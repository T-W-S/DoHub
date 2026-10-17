# Docker Hub

A single-administrator, self-hosted dashboard for accessing, organising, and monitoring web applications running in your Docker environment.

**No Docker socket access. No Docker Engine API integration. No container management.** Docker Hub complements your existing Nginx Proxy Manager setup — it does not replace it.

## Features

- **Application Management** — Full CRUD for your web applications: name, description, public HTTPS URL, optional internal health-check URL, icon, category, tags, notes, and an optional free-text Docker container label.
- **Search & Filter** — Search by name, description, or tag. Filter by category. Sort by name, date added, or status.
- **One-Click Access** — Open any application directly from the dashboard.
- **Real HTTP Health Checks** — Server-side checks for public HTTPS endpoints and explicitly permitted internal URLs. Tracks response times, HTTP status codes, last-successful-check timestamps, failure thresholds, and monitoring history with configurable retention.
- **SSRF Protection** — DNS resolution validation, private IP detection, host allowlisting for internal checks, redirect blocking, TLS certificate validation, and configurable timeouts.
- **Single-Administrator Auth** — First-run setup, bcrypt password hashing, server-side sessions with secure cookies, protected API endpoints.
- **Dark/Light Theme** — Responsive interface that works on mobile and desktop.
- **Categories** — Organise applications into groups with custom icons and colours.
- **SQLite Database** — Local file-based storage with automatic migrations. No external database required.

## Quick Start

### Using Docker Compose (recommended)

1. Clone the repository and navigate to the project directory.

2. Build and start the container:
   ```bash
   docker compose up -d --build
   ```

3. Open `http://localhost:3000` in your browser.

4. You will be redirected to the first-run setup page. Create your administrator account (email + password, minimum 8 characters).

5. You're in. Start adding your applications.

### Using Docker

```bash
docker build -t docker-hub .
docker run -d \
  --name docker-hub \
  -p 3000:3000 \
  -v docker-hub-data:/app/data \
  --restart unless-stopped \
  docker-hub
```

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|---|---|---|
| `DOCKER_HUB_DB_DIR` | `/app/data` | Directory for the SQLite database file |
| `PORT` | `3000` | Port the application listens on |
| `NODE_ENV` | `production` | Set to `production` for secure cookies |

Monitoring settings (check interval, timeout, retention, internal host allowlist) are configured through the **Settings** page in the dashboard, not environment variables.

## Deploying Behind Nginx Proxy Manager

Docker Hub is designed to sit behind Nginx Proxy Manager, just like your other applications.

1. In NPM, create a new **Proxy Host**:
   - **Domain**: e.g. `hub.example.com`
   - **Forward Hostname**: your Docker host IP (or the container name if on the same Docker network)
   - **Forward Port**: `3000`
   - **Block Common Exploits**: enabled
   - **Websockets Support**: enabled

2. Under the **SSL** tab, request a new Let's Encrypt certificate and enable **Force SSL**.

3. Add the Docker Hub container to the same Docker network as NPM (if using Docker networking):
   ```yaml
   services:
     docker-hub:
       # ... existing config
       networks:
         - proxy_network

   networks:
     proxy_network:
       external: true
   ```

4. If your session cookie isn't being set correctly through the proxy, ensure NPM is forwarding the `Cookie` header (it does by default).

## Internal Monitoring Setup

To monitor internal services (e.g. `http://internal-service:8080/health`):

1. **Add the host to the allowlist** — Go to **Settings** → **Internal Host Allowlist** and add the hostname or IP (e.g. `internal-service` or `192.168.1.10`).

2. **Ensure network reachability** — The Docker Hub container must be on the same Docker network as the services you want to monitor, or the host must be otherwise reachable. If using Docker Compose, add both services to the same network.

3. **Configure the application** — Set the **Health Check URL** to the internal endpoint and enable **Internal Monitoring**.

The dashboard will not check internal URLs that aren't in the allowlist. This prevents it from becoming an unrestricted network proxy.

## Data Persistence

The SQLite database and all application data is stored in the `DOCKER_HUB_DB_DIR` directory (default: `/app/data` inside the container). Mount this as a volume to persist data across container restarts:

```yaml
volumes:
  - docker-hub-data:/app/data
```

### Backup

```bash
# Stop the container
docker compose stop

# Copy the database file
docker cp docker-hub:/app/data/docker-hub.db ./backup-docker-hub.db

# Restart
docker compose start
```

### Restore

```bash
# Stop the container
docker compose stop

# Copy the backup back
docker cp ./backup-docker-hub.db docker-hub:/app/data/docker-hub.db

# Restart
docker compose start
```

## What Docker Hub Does NOT Do

- **No Docker socket access** — The container does not mount `/var/run/docker.sock`.
- **No Docker Engine API integration** — No container start/stop/restart, no logs, no CPU/memory stats.
- **No container discovery** — Applications are manually registered.
- **No proxy management** — NPM handles all reverse proxying and certificates.
- **No multi-user functionality** — Single administrator only.

The optional Docker container label field on each application is free-text only — it is never queried against Docker.

## Nginx Proxy Manager Integration (Future)

Read-only visibility of NPM proxy hosts, domain mappings, upstream destinations, and certificate expiry is planned for a future release. This integration is **not yet implemented** and will not be claimed as working until it has been built and tested.

## Tech Stack

- **Frontend**: React, TypeScript, Next.js, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes (server-side, Node.js runtime)
- **Database**: SQLite (via better-sqlite3) with automatic migrations
- **Auth**: bcryptjs password hashing, server-side sessions, secure HTTP-only cookies
- **Deployment**: Docker, Docker Compose
