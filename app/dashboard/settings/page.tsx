'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        <p className="text-sm text-muted-foreground">Configure monitoring settings</p>
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
