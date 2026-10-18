'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Activity,
  AppWindow,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Application, Category } from '@/lib/types';

type AppForm = {
  name: string;
  description: string;
  public_url: string;
  health_check_url: string;
  icon: string;
  category_id: string;
  tags: string;
  notes: string;
  docker_label: string;
  public_monitoring_enabled: boolean;
  internal_monitoring_enabled: boolean;
  failure_threshold: number;
};

const emptyForm: AppForm = {
  name: '',
  description: '',
  public_url: '',
  health_check_url: '',
  icon: '',
  category_id: '__none__',
  tags: '',
  notes: '',
  docker_label: '',
  public_monitoring_enabled: true,
  internal_monitoring_enabled: false,
  failure_threshold: 3,
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'status'>('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsRes, catRes] = await Promise.all([
        fetch('/api/applications').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);
      setApps(Array.isArray(appsRes) ? appsRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const filteredApps = apps
    .filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (a.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === '__all__' || a.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'status') {
        const order: Record<string, number> = { up: 0, pending: 1, down: 2 };
        return (order[a.last_public_status ?? 'pending'] ?? 3) - (order[b.last_public_status ?? 'pending'] ?? 3);
      }
      return 0;
    });

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (app: Application) => {
    setForm({
      name: app.name,
      description: app.description ?? '',
      public_url: app.public_url,
      health_check_url: app.health_check_url ?? '',
      icon: app.icon ?? '',
      category_id: app.category_id ?? '__none__',
      tags: (app.tags ?? []).join(', '),
      notes: app.notes ?? '',
      docker_label: app.docker_label ?? '',
      public_monitoring_enabled: app.public_monitoring_enabled,
      internal_monitoring_enabled: app.internal_monitoring_enabled,
      failure_threshold: app.failure_threshold,
    });
    setEditingId(app.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.public_url.trim()) {
      toast.error('Name and public URL are required');
      return;
    }

    setSaving(true);

    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      public_url: form.public_url.trim(),
      health_check_url: form.health_check_url.trim() || null,
      icon: form.icon.trim() || null,
      category_id: form.category_id === '__none__' ? null : form.category_id,
      tags,
      notes: form.notes.trim() || null,
      docker_label: form.docker_label.trim() || null,
      public_monitoring_enabled: form.public_monitoring_enabled,
      internal_monitoring_enabled: form.internal_monitoring_enabled,
      failure_threshold: form.failure_threshold,
    };

    try {
      const url = editingId ? `/api/applications/${editingId}` : '/api/applications';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success(editingId ? 'Application updated' : 'Application created');
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/applications/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Application deleted');
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusBadge = (status: string | null) => {
    if (status === 'up') return <Badge className="bg-success/20 text-success hover:bg-success/30">Up</Badge>;
    if (status === 'down') return <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30">Down</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Manage your self-hosted web applications</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-40">
            <ArrowUpDown className="mr-2 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredApps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AppWindow className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              {apps.length === 0 ? 'No applications yet.' : 'No applications match your filters.'}
            </p>
            {apps.length === 0 && (
              <Button onClick={openAdd} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add your first application
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app) => {
            const category = categories.find((c) => c.id === app.category_id);
            return (
              <Card key={app.id} className="group flex flex-col overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                        {app.icon || app.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="truncate font-semibold">{app.name}</h3>
                        {category && (
                          <Badge variant="outline" className="mt-1 text-xs">{category.name}</Badge>
                        )}
                      </div>
                    </div>
                    {statusBadge(app.last_public_status)}
                  </div>

                  {app.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
                  )}

                  {app.tags && app.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {app.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {app.last_public_response_ms != null && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      {app.last_public_response_ms}ms response
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                    <Button asChild size="sm" className="flex-1">
                      <a href={app.public_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Open
                      </a>
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => openEdit(app)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setDeleteId(app.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Application' : 'Add Application'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update your application details' : 'Register a new web application to track'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My App" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A brief description" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_url">Public URL *</Label>
              <Input id="public_url" type="url" value={form.public_url} onChange={(e) => setForm({ ...form, public_url: e.target.value })} placeholder="https://app.example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_check_url">Health Check URL</Label>
              <Input id="health_check_url" type="url" value={form.health_check_url} onChange={(e) => setForm({ ...form, health_check_url: e.target.value })} placeholder="http://internal:8080/health" />
              <p className="text-xs text-muted-foreground">Optional. Internal URLs require allowlisted hosts in Settings.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon / Emoji</Label>
                <Input id="icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. A" maxLength={4} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="frontend, api" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="docker_label">Docker Container Label</Label>
                <Input id="docker_label" value={form.docker_label} onChange={(e) => setForm({ ...form, docker_label: e.target.value })} placeholder="my-app-container" />
                <p className="text-xs text-muted-foreground">Free-text label only. Not queried against Docker.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes" rows={2} />
            </div>
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pub_mon">Public Monitoring</Label>
                  <p className="text-xs text-muted-foreground">Check the public HTTPS URL</p>
                </div>
                <Switch id="pub_mon" checked={form.public_monitoring_enabled} onCheckedChange={(v) => setForm({ ...form, public_monitoring_enabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="int_mon">Internal Monitoring</Label>
                  <p className="text-xs text-muted-foreground">Check the health check URL</p>
                </div>
                <Switch id="int_mon" checked={form.internal_monitoring_enabled} onCheckedChange={(v) => setForm({ ...form, internal_monitoring_enabled: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Failure Threshold</Label>
                <Input id="threshold" type="number" min={1} max={10} value={form.failure_threshold} onChange={(e) => setForm({ ...form, failure_threshold: parseInt(e.target.value) || 3 })} />
                <p className="text-xs text-muted-foreground">Consecutive failures before marking down</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Add Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the application and all its monitoring history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
