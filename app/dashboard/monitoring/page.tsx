'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Play, Loader2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Application, CheckResult } from '@/lib/types';

export default function MonitoringPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filterApp, setFilterApp] = useState('__all__');

  const loadData = useCallback(async () => {
    try {
      const [appsRes, resultsRes] = await Promise.all([
        fetch('/api/applications').then((r) => r.json()),
        fetch('/api/monitoring/results?limit=100').then((r) => r.json()),
      ]);
      setApps(Array.isArray(appsRes) ? appsRes : []);
      setResults(Array.isArray(resultsRes) ? resultsRes : []);
    } catch {
      toast.error('Failed to load monitoring data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAllChecks = async () => {
    setRunning(true);
    toast.info('Running health checks...');
    try {
      const res = await fetch('/api/monitoring/run-checks', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check run failed');
      toast.success('Health checks completed');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setRunning(false);
  };

  const checkOne = async (appId: string) => {
    try {
      const res = await fetch(`/api/monitoring/check/${appId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      toast.success('Health check completed');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredResults = filterApp === '__all__'
    ? results
    : results.filter((r) => r.application_id === filterApp);

  const monitoredApps = apps.filter((a) => a.public_monitoring_enabled || a.internal_monitoring_enabled);
  const upCount = apps.filter((a) => a.last_public_status === 'up').length;
  const downCount = apps.filter((a) => a.last_public_status === 'down').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-sm text-muted-foreground">Real HTTP health checks for your applications</p>
        </div>
        <Button onClick={runAllChecks} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Run All Checks
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitored Apps</p>
                <p className="mt-1 text-3xl font-bold">{monitoredApps.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endpoints Up</p>
                <p className="mt-1 text-3xl font-bold text-success">{upCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endpoints Down</p>
                <p className="mt-1 text-3xl font-bold text-destructive">{downCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Current Status</CardTitle>
            <CardDescription>Latest health check results per application</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitoredApps.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No applications have monitoring enabled
              </p>
            ) : (
              monitoredApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        app.last_public_status === 'up'
                          ? 'bg-success/10 text-success'
                          : app.last_public_status === 'down'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {app.last_public_status === 'up' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : app.last_public_status === 'down' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.public_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.last_public_response_ms != null && (
                      <span className="text-xs text-muted-foreground">{app.last_public_response_ms}ms</span>
                    )}
                    {app.last_public_http_status != null && (
                      <Badge variant="outline" className="text-xs">{app.last_public_http_status}</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => checkOne(app.id)}>
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Check History</CardTitle>
            <CardDescription>Recent health check results</CardDescription>
          </div>
          <Select value={filterApp} onValueChange={setFilterApp}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All applications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All applications</SelectItem>
              {apps.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No check results yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.slice(0, 50).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.application_name ?? 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{r.check_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'up' ? (
                          <Badge className="bg-success/20 text-success hover:bg-success/30">Up</Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30">Down</Badge>
                        )}
                      </TableCell>
                      <TableCell>{r.http_status_code ?? '-'}</TableCell>
                      <TableCell>{r.response_time_ms != null ? `${r.response_time_ms}ms` : '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.checked_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
