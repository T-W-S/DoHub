'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Plus, X, Shield, Clock, Trash2, Server } from 'lucide-react';
import { toast } from 'sonner';
import type { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHost, setNewHost] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load settings');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitoring_interval_seconds: settings.monitoring_interval_seconds,
          retention_days: settings.retention_days,
          check_timeout_ms: settings.check_timeout_ms,
          allowed_internal_hosts: settings.allowed_internal_hosts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const addHost = () => {
    if (!newHost.trim() || !settings) return;
    if (settings.allowed_internal_hosts.includes(newHost.trim())) {
      toast.error('Host already in allowlist');
      return;
    }
    setSettings({
      ...settings,
      allowed_internal_hosts: [...settings.allowed_internal_hosts, newHost.trim()],
    });
    setNewHost('');
  };

  const removeHost = (host: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      allowed_internal_hosts: settings.allowed_internal_hosts.filter((h) => h !== host),
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure monitoring and security settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Monitoring Configuration</CardTitle>
              <CardDescription>Control how health checks are performed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="interval">Check Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min={30}
                value={settings.monitoring_interval_seconds}
                onChange={(e) =>
                  setSettings({ ...settings, monitoring_interval_seconds: parseInt(e.target.value) || 300 })
                }
              />
              <p className="text-xs text-muted-foreground">How often to run checks</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Check Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                min={1000}
                value={settings.check_timeout_ms}
                onChange={(e) =>
                  setSettings({ ...settings, check_timeout_ms: parseInt(e.target.value) || 10000 })
                }
              />
              <p className="text-xs text-muted-foreground">Max wait per request</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Retention (days)</Label>
              <Input
                id="retention"
                type="number"
                min={1}
                value={settings.retention_days}
                onChange={(e) =>
                  setSettings({ ...settings, retention_days: parseInt(e.target.value) || 30 })
                }
              />
              <p className="text-xs text-muted-foreground">How long to keep history</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Internal Host Allowlist</CardTitle>
              <CardDescription>
                Hostnames and IPs permitted for internal health checks (SSRF protection)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Only hosts in this list can be reached by internal monitoring checks. This prevents the
            dashboard from becoming an unrestricted network proxy. Hostnames that resolve to private
            IP addresses (10.x, 172.16-31.x, 192.168.x, 127.x, ::1) must be in this list to be checked.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="e.g. internal-service, 192.168.1.10, myapp.local"
              value={newHost}
              onChange={(e) => setNewHost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHost();
                }
              }}
            />
            <Button onClick={addHost} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {settings.allowed_internal_hosts.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 p-3">
              {settings.allowed_internal_hosts.map((host) => (
                <Badge
                  key={host}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 pl-3 pr-1"
                >
                  <Server className="h-3 w-3 text-muted-foreground" />
                  {host}
                  <button
                    onClick={() => removeHost(host)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              No internal hosts allowlisted yet. Add hostnames or IPs that internal monitoring should be allowed to reach.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">About Docker Hub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Self-hosted dashboard for accessing and monitoring web applications running in your Docker environment.</p>
          <p>No Docker socket access. No Docker Engine API integration. No container management.</p>
          <p>Complements Nginx Proxy Manager. Does not replace it.</p>
        </CardContent>
      </Card>
    </div>
  );
}
