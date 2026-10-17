'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AppWindow,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  FolderTree,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { Application, Category } from '@/lib/types';

export default function OverviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/applications').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([appsData, catData]) => {
        setApps(appsData || []);
        setCategories(catData || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const publicUp = apps.filter((a) => a.last_public_status === 'up').length;
  const publicDown = apps.filter((a) => a.last_public_status === 'down').length;
  const publicPending = apps.filter(
    (a) => a.last_public_status === 'pending' || !a.last_public_status
  ).length;

  const recentApps = apps.slice(0, 5);

  const stats = [
    { label: 'Total Applications', value: apps.length, icon: AppWindow, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Public Endpoints Up', value: publicUp, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Public Endpoints Down', value: publicDown, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Categories', value: categories.length, icon: FolderTree, color: 'text-warning', bg: 'bg-warning/10' },
  ];

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
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor and access your self-hosted applications</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/applications">
            <AppWindow className="mr-2 h-4 w-4" />
            Manage Applications
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monitoring Status</CardTitle>
            <CardDescription>Public endpoint health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm">Up</span>
              </div>
              <Badge className="bg-success/20 text-success hover:bg-success/30">{publicUp}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Down</span>
              </div>
              <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30">{publicDown}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="secondary">{publicPending}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
              <CardDescription>Your latest added applications</CardDescription>
            </div>
            <Link href="/dashboard/applications" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AppWindow className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No applications yet</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/dashboard/applications">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Add your first app
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          app.last_public_status === 'up'
                            ? 'bg-success/10 text-success'
                            : app.last_public_status === 'down'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium">{app.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.public_url}</p>
                      </div>
                    </div>
                    <a
                      href={app.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
