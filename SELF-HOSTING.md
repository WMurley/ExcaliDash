# ExcaliDash Self-Hosting Guide

Complete guide for deploying ExcaliDash on your own infrastructure using Coolify (or any Docker-based platform).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Building Custom Docker Images](#building-custom-docker-images)
- [Deploying to Coolify](#deploying-to-coolify)
- [Configuration Guide](#configuration-guide)
- [Backup & Restore](#backup--restore)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## Prerequisites

Before you begin, ensure you have:

### Required
- **Docker** and **Docker Compose** installed on your local machine (for building images)
  - Install from: https://docs.docker.com/get-docker/
- **Domain name** with DNS access (for configuring subdomains)
- **Docker Hub account** (free tier works fine)
  - Sign up at: https://hub.docker.com/
- **Coolify instance** running (or any Docker hosting platform)
  - Self-hosted: https://coolify.io/
  - Or use any platform that supports docker-compose

### Recommended Setup
For this guide, we'll use:
- **Frontend domain**: `draw.yourdomain.com` (or your domain)
- **Backend domain**: `api-draw.yourdomain.com` (or your domain)

Both domains should point to your Coolify server's IP address.

---

## Architecture Overview

ExcaliDash consists of two services:

```
┌─────────────────────────────────────────────────────────┐
│ User Browser                                             │
│   ↓                                                      │
│   draw.yourdomain.com (Frontend - Static React App)    │
│   ↓                                                      │
│   → Makes API calls to →                                │
│   ↓                                                      │
│   api-draw.yourdomain.com (Backend - Express + SQLite) │
│   ↓                                                      │
│   SQLite Database (in Docker volume)                    │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- Frontend is built with the backend URL **baked in** at build time
- Frontend makes direct HTTPS calls to backend (no proxying)
- Backend uses SQLite for data persistence (stored in Docker volume)
- Both services run as separate containers

---

## Building Custom Docker Images

### Step 1: Clone and Configure

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/YOUR-USERNAME/ExcaliDash.git
   cd ExcaliDash
   ```

2. **Edit the build script**:
   ```bash
   nano build-and-push.sh
   ```

3. **Update these configuration values**:
   ```bash
   # Your Docker Hub username
   DOCKER_USERNAME="your-dockerhub-username"

   # Your backend API URL (full URL with https://)
   BACKEND_URL="https://api-draw.yourdomain.com"
   ```

4. **Save and exit** (Ctrl+O, Enter, Ctrl+X in nano)

### Step 2: Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password.

### Step 3: Build and Push Images

```bash
./build-and-push.sh
```

This will:
- Build the frontend with your custom backend URL
- Build the backend
- Tag both images with version and `latest`
- Push all images to Docker Hub

**Expected output:**
```
============================================================================
✓ Build and push completed successfully!
============================================================================

Images pushed:
  Frontend: your-username/excalidash-frontend:1.0.0
  Frontend: your-username/excalidash-frontend:latest
  Backend:  your-username/excalidash-backend:1.0.0
  Backend:  your-username/excalidash-backend:latest
```

### Step 4: Verify Images on Docker Hub

Visit `https://hub.docker.com/u/your-username` and confirm both images are present.

---

## Deploying to Coolify

### Step 1: Prepare Docker Compose File

1. **Edit `docker-compose.coolify.yml`**:
   ```bash
   nano docker-compose.coolify.yml
   ```

2. **Replace all instances of `YOUR-DOCKERHUB-USERNAME`** with your actual Docker Hub username:
   ```yaml
   services:
     backend:
       image: your-username/excalidash-backend:latest
       # ...
     frontend:
       image: your-username/excalidash-frontend:latest
       # ...
   ```

3. **Update environment variables** if needed:
   ```yaml
   environment:
     - FRONTEND_URL=https://draw.yourdomain.com  # Your frontend domain
   ```

4. **Save the file**

### Step 2: Create New Service in Coolify

1. **Login to your Coolify dashboard**

2. **Create a new project** (or select existing one)

3. **Add new resource** → **Docker Compose**

4. **Configure the service**:
   - **Name**: `excalidash` (or any name you prefer)
   - **Docker Compose**: Paste the contents of `docker-compose.coolify.yml`

5. **Click "Save"**

### Step 3: Configure Domains in Coolify

#### Backend Domain

1. Navigate to **excalidash** → **backend** service
2. Click **"Domains"** tab
3. Add domain: `api-draw.yourdomain.com`
4. **Enable SSL/TLS** (Let's Encrypt automatic)
5. Save

#### Frontend Domain

1. Navigate to **excalidash** → **frontend** service
2. Click **"Domains"** tab
3. Add domain: `draw.yourdomain.com`
4. **Enable SSL/TLS** (Let's Encrypt automatic)
5. Save

### Step 4: Configure DNS

In your DNS provider (Cloudflare, Route53, etc.), add these A records:

```
draw.yourdomain.com       → A → YOUR_COOLIFY_SERVER_IP
api-draw.yourdomain.com   → A → YOUR_COOLIFY_SERVER_IP
```

**Wait for DNS propagation** (usually 1-5 minutes, can take up to 24 hours)

### Step 5: Deploy

1. In Coolify, go to your **excalidash** service
2. Click **"Deploy"** button
3. Monitor logs to ensure successful deployment

**Expected logs:**
```
✓ Pulling images...
✓ Starting backend...
✓ Backend health check passed
✓ Starting frontend...
✓ Deployment successful
```

### Step 6: Verify Deployment

1. **Visit your frontend**: `https://draw.yourdomain.com`
2. You should see the ExcaliDash interface
3. **Create a test drawing** and save it
4. **Refresh the page** - drawing should persist

---

## Configuration Guide

### Environment Variables

#### Backend (`docker-compose.coolify.yml`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend server port (internal) |
| `NODE_ENV` | `production` | Node environment |
| `FRONTEND_URL` | (required) | Your frontend URL for CORS (e.g., `https://draw.yourdomain.com`) |
| `DATABASE_URL` | `file:/app/prisma/dev.db` | SQLite database path |

#### Frontend (Build-time only)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Set in `build-and-push.sh` - Full backend URL (e.g., `https://api-draw.yourdomain.com`) |

### Adding Basic Authentication (Optional)

To protect your instance with username/password:

1. In Coolify, navigate to **frontend** service
2. Go to **"Basic Auth"** section
3. Enable and set username/password
4. Save and redeploy

**Note:** This only protects the frontend. The backend API will still be accessible directly.

### Multiple Frontend URLs (CORS)

If you need multiple frontend domains (e.g., production + staging):

```yaml
environment:
  - FRONTEND_URL=https://draw.yourdomain.com,https://staging.yourdomain.com
```

Separate multiple URLs with commas (no spaces).

---

## Backup & Restore

### Backup Strategy

Your data is stored in Docker volumes. Recommended backup schedule: **Daily**

### Manual Backup

#### Method 1: Using Docker Volume Backup

```bash
# SSH into your Coolify server
ssh your-server

# Find the volume name
docker volume ls | grep excalidash

# Create backup directory
mkdir -p ~/excalidash-backups

# Backup database volume
docker run --rm \
  -v excalidash_data:/data \
  -v ~/excalidash-backups:/backup \
  alpine tar czf /backup/excalidash-db-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

#### Method 2: Using ExcaliDash Export Feature

1. Visit your backend: `https://api-draw.yourdomain.com/export`
2. This downloads the SQLite database file
3. Save this file securely

**Automated backup with cron:**

```bash
# Add to crontab (crontab -e)
0 2 * * * docker run --rm -v excalidash_data:/data -v ~/excalidash-backups:/backup alpine tar czf /backup/excalidash-db-$(date +\%Y\%m\%d).tar.gz -C /data .
```

This runs daily at 2 AM.

### Restore from Backup

#### Restore from Volume Backup

```bash
# SSH into your Coolify server
ssh your-server

# Stop the services
cd /path/to/your/coolify/project
docker compose down

# Restore from backup
docker run --rm \
  -v excalidash_data:/data \
  -v ~/excalidash-backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/excalidash-db-YYYYMMDD-HHMMSS.tar.gz"

# Start services again
docker compose up -d
```

#### Restore from Database Export

1. Visit: `https://api-draw.yourdomain.com/import/sqlite`
2. Use the import functionality (requires backend rebuild with upload enabled)

---

## Updating

When you need to update ExcaliDash (e.g., pull latest changes from upstream):

### Step 1: Pull Latest Changes

```bash
cd ExcaliDash
git pull origin main
```

### Step 2: Rebuild Images

```bash
./build-and-push.sh
```

This builds new images with updated code.

### Step 3: Update Coolify

1. In Coolify, go to your **excalidash** service
2. Click **"Redeploy"**
3. Select **"Pull latest images"**
4. Click **"Deploy"**

Coolify will pull the new `latest` tags and restart services.

### Step 4: Verify

- Check that drawings still load
- Test creating new drawings
- Check logs for any errors

---

## Troubleshooting

### Frontend shows "Network Error" or 502

**Symptoms:**
- Frontend loads but can't fetch drawings
- Browser console shows CORS errors or connection refused

**Solutions:**

1. **Check backend is running:**
   ```bash
   # In Coolify logs
   Look for "Backend health check passed"
   ```

2. **Verify backend URL in frontend build:**
   - Was the image built with correct `BACKEND_URL`?
   - Check: `docker inspect your-username/excalidash-frontend:latest`
   - Look for `VITE_API_URL` in image config

3. **Check CORS configuration:**
   ```yaml
   # In docker-compose.coolify.yml
   environment:
     - FRONTEND_URL=https://draw.yourdomain.com
   ```
   Must match your actual frontend domain (with `https://`)

4. **DNS issues:**
   ```bash
   # Test DNS resolution
   nslookup api-draw.yourdomain.com
   ```

5. **SSL certificate issues:**
   - In Coolify, check that SSL is enabled for both domains
   - Wait for Let's Encrypt certificate generation (can take 1-2 minutes)

### Database is Empty After Deployment

**Cause:** Volume not persisting correctly

**Solution:**

1. Check volume exists:
   ```bash
   docker volume ls | grep excalidash
   ```

2. Check volume is mounted:
   ```bash
   docker inspect excalidash-backend | grep -A 5 Mounts
   ```

3. Verify database file exists:
   ```bash
   docker exec excalidash-backend ls -la /app/prisma/
   ```

### "Cannot find module" or Build Errors

**Cause:** Dependencies not installed correctly

**Solution:**

Rebuild images from scratch:
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild
./build-and-push.sh
```

### WebSocket Connection Failures

**Symptoms:**
- Real-time collaboration doesn't work
- Console errors about Socket.IO

**Solutions:**

1. **Check backend logs** for WebSocket connection attempts

2. **Verify Coolify WebSocket support:**
   - Coolify should automatically handle WebSocket upgrades
   - Check Traefik configuration if using custom setup

3. **Test direct connection:**
   ```bash
   curl https://api-draw.yourdomain.com/health
   ```
   Should return `{"status":"ok"}`

### High Memory Usage

**Cause:** Large drawings with many elements

**Solutions:**

1. **Increase container memory limits** in Coolify (Settings → Resources)

2. **Clean up old drawings:**
   - Use the ExcaliDash UI to delete unused drawings

3. **Database vacuum:**
   ```bash
   docker exec excalidash-backend npx prisma db execute --sql "VACUUM"
   ```

---

## Security Considerations

### Important Warning

ExcaliDash is designed for **personal/internal use only**. The original developer warns:

- ❌ Not production-ready for public internet
- ❌ Inadequate XSS protection
- ❌ No CSRF protection
- ❌ CORS issues for public deployment

### Recommended Security Measures

For personal/team use:

1. **Use Basic Authentication** (configured in Coolify)
   - Protects frontend from unauthorized access

2. **VPN Access** (recommended for sensitive data)
   - Keep ExcaliDash behind VPN (Tailscale, WireGuard, etc.)
   - Don't expose to public internet

3. **Regular Backups** (see [Backup & Restore](#backup--restore))
   - Daily automated backups
   - Store backups securely (encrypted)

4. **Keep Updated**
   - Watch the repository for security updates
   - Rebuild images when updates available

5. **Firewall Rules**
   - Only allow access from trusted IPs/networks
   - Use Cloudflare Access or similar for additional protection

6. **Monitor Logs**
   - Regularly check Coolify logs for suspicious activity
   - Set up alerts for errors

### What This Setup Does NOT Protect Against

- Cross-Site Scripting (XSS) attacks
- Cross-Site Request Forgery (CSRF)
- SQL Injection (limited due to Prisma, but still a concern)
- DDoS attacks
- Brute force attacks (unless you add rate limiting)

**For production use, you would need:**
- Proper authentication system (OAuth, JWT, etc.)
- CSRF tokens
- Input sanitization and validation
- Rate limiting
- Security headers (CSP, HSTS, etc.)
- Regular security audits

---

## Advanced Configuration

### Using PostgreSQL Instead of SQLite

If you need better performance or scalability:

1. **Set up PostgreSQL database**

2. **Update `docker-compose.coolify.yml`**:
   ```yaml
   services:
     backend:
       environment:
         - DATABASE_URL=postgresql://user:password@postgres-host:5432/excalidash
   ```

3. **Add PostgreSQL service** or use external database

4. **Redeploy**

Note: Migrations may need to be run manually.

### Custom Domain Without Coolify

If deploying without Coolify:

1. **Use provided `docker-compose.yml`** or create custom one

2. **Set up reverse proxy** (Nginx, Traefik, Caddy):
   ```nginx
   # Frontend
   server {
       listen 443 ssl;
       server_name draw.yourdomain.com;

       location / {
           proxy_pass http://localhost:6767;
       }
   }

   # Backend
   server {
       listen 443 ssl;
       server_name api-draw.yourdomain.com;

       location / {
           proxy_pass http://localhost:3002;
       }
   }
   ```

3. **Configure SSL certificates** (Let's Encrypt with Certbot)

---

## Getting Help

### Resources

- **GitHub Repository**: https://github.com/ZimengXiong/ExcaliDash
- **Original Excalidraw**: https://github.com/excalidraw/excalidraw
- **Coolify Docs**: https://coolify.io/docs
- **Docker Docs**: https://docs.docker.com/

### Common Issues

Check `TESTING.md` for a comprehensive testing checklist.

### Reporting Bugs

If you find issues with the self-hosting setup:

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in Coolify
3. Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Logs from both frontend and backend
   - Your configuration (sanitized - no secrets!)

---

## Next Steps

After successful deployment:

1. ✅ Run through `TESTING.md` checklist
2. ✅ Set up automated backups
3. ✅ Configure basic auth (if needed)
4. ✅ Test creating and saving drawings
5. ✅ Test real-time collaboration (if using)
6. ✅ Document your specific configuration for team members

---

## License

ExcaliDash is based on Excalidraw and maintains its MIT license. See LICENSE file for details.

---

**Happy Self-Hosting! 🎨**
