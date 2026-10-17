'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plug, Server, Shield, Lock, ExternalLink } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">Connect external services and tools</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Nginx Proxy Manager</CardTitle>
                <CardDescription>Read-only visibility of proxy hosts and certificates</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Planned</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This integration will provide read-only visibility into your Nginx Proxy Manager setup,
            including proxy hosts, domain mappings, upstream destinations, and certificate expiry
            information. NPM remains responsible for reverse proxying, HTTPS, and Let&apos;s Encrypt
            certificates.
          </p>

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <p className="text-sm font-medium">Planned features:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Read-only access to proxy host configurations
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Domain mapping visibility
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Upstream destination monitoring
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Let&apos;s Encrypt certificate expiry tracking
              </li>
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Important notes:</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>This integration is not yet implemented. It will not be claimed as working until it has been built and tested.</li>
              <li>Docker Hub will not modify proxy hosts or certificates.</li>
              <li>NPM continues to handle all reverse proxying and TLS termination.</li>
              <li>Integration will use the documented NPM API with read-only access only.</li>
            </ul>
          </div>

          <a
            href="https://nginxproxymanager.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Learn more about Nginx Proxy Manager
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Plug className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">More integrations coming in the future</p>
        </CardContent>
      </Card>
    </div>
  );
}
