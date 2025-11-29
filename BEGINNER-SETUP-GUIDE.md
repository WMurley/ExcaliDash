# Step-by-Step Setup Guide for Beginners

This guide assumes you're completely new to coding and walks you through everything from scratch.

## Part 1: Install Required Software

### For Mac Users:

#### 1. Install Homebrew (package manager)
Open Terminal (Applications → Utilities → Terminal) and paste:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Press Enter and follow the prompts.

#### 2. Install Git
```bash
brew install git
```

#### 3. Install Docker Desktop
1. Go to: https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Mac
3. Open the downloaded file and drag Docker to Applications
4. Open Docker Desktop and complete setup
5. Wait for Docker to start (whale icon in menu bar)

### For Windows Users:

#### 1. Install Git
1. Go to: https://git-scm.com/download/win
2. Download and run the installer
3. Use all default options
4. When asked about "Adjusting your PATH", choose "Git from the command line and also from 3rd-party software"

#### 2. Install Docker Desktop
1. Go to: https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Windows
3. Run the installer
4. Restart your computer when prompted
5. Open Docker Desktop and complete setup
6. Enable WSL 2 if prompted

### For Linux Users:

#### 1. Git (usually pre-installed)
Check if installed:
```bash
git --version
```

If not installed:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# Fedora
sudo dnf install git
```

#### 2. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in

# Fedora
sudo dnf install docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

---

## Part 2: Create Docker Hub Account

1. Go to: https://hub.docker.com
2. Click "Sign Up"
3. Create account (FREE)
4. **Remember your username** - you'll need it later
5. Verify your email

---

## Part 3: Clone Your Repository

### 1. Choose a location for your code

**Mac/Linux:**
```bash
# Create a Projects folder in your home directory
mkdir -p ~/Projects
cd ~/Projects
```

**Windows (Git Bash):**
```bash
# Create a Projects folder
mkdir -p /c/Users/YourUsername/Projects
cd /c/Users/YourUsername/Projects
```

### 2. Clone your fork

Replace `YOUR-GITHUB-USERNAME` with your actual GitHub username:

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/ExcaliDash.git
cd ExcaliDash
```

**What this does:**
- Downloads all the code from GitHub to your computer
- Creates a folder called `ExcaliDash`
- Sets up git tracking

### 3. Verify it worked

```bash
ls
```

You should see files like:
- `README.md`
- `build-and-push.sh`
- `frontend/`
- `backend/`
- `SELF-HOSTING.md`
- etc.

---

## Part 4: Configure Your Build Script

### 1. Open the build script in a text editor

**Mac:**
```bash
open -e build-and-push.sh
```
(Opens in TextEdit)

**Windows:**
```bash
notepad build-and-push.sh
```

**Linux:**
```bash
nano build-and-push.sh
# Or use your favorite editor: gedit, vim, etc.
```

### 2. Update these two lines:

Find this section near the top:
```bash
# BEFORE (placeholder values):
DOCKER_USERNAME="your-dockerhub-username"
BACKEND_URL="https://api-draw.yourdomain.com"
```

Change to YOUR actual values:
```bash
# AFTER (your real values):
DOCKER_USERNAME="johnsmith"  # ← Your Docker Hub username
BACKEND_URL="https://api-draw.yourdomain.com"  # ← Your actual backend domain
```

**Example:**
If your Docker Hub username is `johnsmith` and your backend domain is `api-draw.yourdomain.com`:
```bash
DOCKER_USERNAME="johnsmith"
BACKEND_URL="https://api-draw.yourdomain.com"
```

### 3. Save and close the file

---

## Part 5: Update docker-compose.coolify.yml

### 1. Open the file

**Mac:**
```bash
open -e docker-compose.coolify.yml
```

**Windows:**
```bash
notepad docker-compose.coolify.yml
```

**Linux:**
```bash
nano docker-compose.coolify.yml
```

### 2. Replace placeholder values

Find ALL instances of `YOUR-DOCKERHUB-USERNAME` and replace with your actual username.

**BEFORE:**
```yaml
services:
  backend:
    image: YOUR-DOCKERHUB-USERNAME/excalidash-backend:latest
    # ...
  frontend:
    image: YOUR-DOCKERHUB-USERNAME/excalidash-frontend:latest
```

**AFTER:**
```yaml
services:
  backend:
    image: johnsmith/excalidash-backend:latest  # ← Your username
    # ...
  frontend:
    image: johnsmith/excalidash-frontend:latest  # ← Your username
```

### 3. Update the frontend URL

Find this line:
```yaml
- FRONTEND_URL=https://draw.yourdomain.com
```

Make sure it matches YOUR actual frontend domain.

### 4. Save and close

---

## Part 6: Build and Push Docker Images

### 1. Login to Docker Hub

```bash
docker login
```

Enter:
- Username: (your Docker Hub username)
- Password: (your Docker Hub password)

You should see: `Login Succeeded`

### 2. Make the build script executable

**Mac/Linux:**
```bash
chmod +x build-and-push.sh
```

**Windows (Git Bash):**
```bash
chmod +x build-and-push.sh
```

### 3. Run the build script

```bash
./build-and-push.sh
```

**This will take 5-10 minutes** and will:
1. Build the frontend image with your backend URL
2. Build the backend image
3. Push both to Docker Hub

**You'll see output like:**
```
============================================================================
ExcaliDash Build & Push Script
============================================================================

Configuration:
  Docker Username: johnsmith
  Backend URL: https://api-draw.yourdomain.com
  Version: 1.0.0
  ...

Building frontend...
[lots of output]
✓ Frontend build complete

Building backend...
[lots of output]
✓ Backend build complete

Pushing images...
✓ Pushed frontend:1.0.0
✓ Pushed frontend:latest
✓ Pushed backend:1.0.0
✓ Pushed backend:latest

✓ Build and push completed successfully!
```

### 4. Verify on Docker Hub

1. Go to https://hub.docker.com
2. Login
3. You should see two repositories:
   - `excalidash-frontend`
   - `excalidash-backend`

---

## Part 7: Deploy to Coolify

### 1. Login to Coolify

Go to your Coolify dashboard (e.g., `https://coolify.yourdomain.com`)

### 2. Create New Service

1. Click **"+ New Resource"**
2. Select **"Docker Compose"**
3. Choose your server/destination

### 3. Configure the Service

**Name:** `excalidash` (or whatever you want)

**Docker Compose:**
- Copy the entire contents of `docker-compose.coolify.yml`
- Paste into the text area

**Important:** Make sure you already updated the usernames in the file (Step 5 above)

### 4. Save (don't deploy yet)

Click **"Save"** (not "Deploy" yet)

---

## Part 8: Configure Domains in Coolify

### Backend Domain

1. In your excalidash service, click on **"backend"** container
2. Go to **"Domains"** tab
3. Click **"Add Domain"**
4. Enter: `api-draw.yourdomain.com`
5. Enable **"Generate SSL Certificate"** (Let's Encrypt)
6. Click **"Save"**

### Frontend Domain

1. Go back and click on **"frontend"** container
2. Go to **"Domains"** tab
3. Click **"Add Domain"**
4. Enter: `draw.yourdomain.com`
5. Enable **"Generate SSL Certificate"** (Let's Encrypt)
6. Click **"Save"**

### 🔒 IMPORTANT: Enable Basic Authentication (Security)

**For the frontend container:**

1. Still in frontend settings, scroll to **"Basic Auth"** section
2. Click **"Enable Basic Auth"**
3. Set **Username:** (choose something, e.g., `admin`)
4. Set **Password:** (choose a STRONG password)
5. Click **"Save"**

**What this does:**
- Anyone visiting `draw.yourdomain.com` must enter this username/password
- Protects your app from public access
- Solves the "don't expose to internet" security concern

---

## Part 9: Configure DNS

Before deploying, make sure your DNS is set up:

### In Your DNS Provider (Cloudflare, Namecheap, etc.):

Add two **A records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | draw | YOUR_COOLIFY_SERVER_IP | Auto |
| A | api-draw | YOUR_COOLIFY_SERVER_IP | Auto |

**Example:**
If your Coolify server IP is `123.45.67.89`:
```
draw.yourdomain.com       →  123.45.67.89
api-draw.yourdomain.com   →  123.45.67.89
```

**Wait 1-5 minutes** for DNS to propagate.

### Verify DNS is working:

```bash
# Check frontend domain
nslookup draw.yourdomain.com

# Check backend domain
nslookup api-draw.yourdomain.com
```

Both should return your server's IP address.

---

## Part 10: Deploy!

### 1. Start Deployment

In Coolify:
1. Go to your excalidash service
2. Click **"Deploy"**
3. Watch the logs

**Expected output:**
```
Pulling images...
✓ Image pulled: johnsmith/excalidash-backend:latest
✓ Image pulled: johnsmith/excalidash-frontend:latest
Creating containers...
✓ Container excalidash-backend created
✓ Container excalidash-frontend created
Starting services...
✓ Backend health check passed
✓ Frontend started
Deployment successful!
```

### 2. Check Logs

**Backend logs should show:**
```
Server started on port 3002
Database connected
```

**Frontend logs should show:**
```
nginx: [notice] start worker processes
```

---

## Part 11: Test Your Deployment

### 1. Visit your frontend

Go to: `https://draw.yourdomain.com`

**You should see:**
- Browser prompts for username/password (Basic Auth)
- Enter the credentials you set in Part 8
- ExcaliDash interface loads

### 2. Check for errors

Open browser DevTools:
- **Mac:** Cmd + Option + I
- **Windows:** F12 or Ctrl + Shift + I

Go to **Console** tab:
- Should see NO red errors
- Should see NO CORS errors
- Should see NO "Failed to fetch" errors

### 3. Test functionality

1. **Create a drawing:**
   - Draw some shapes
   - Click "Save"
   - Name it "Test Drawing 1"

2. **Verify it saved:**
   - Drawing appears in left sidebar
   - Refresh the page
   - Drawing still there

3. **Load the drawing:**
   - Click on "Test Drawing 1"
   - Shapes appear correctly

### 4. Check backend directly

Visit: `https://api-draw.yourdomain.com/health`

Should show:
```json
{"status":"ok"}
```

---

## Part 12: Troubleshooting

### Problem: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Make sure Docker Desktop is running
# You should see the Docker whale icon in your system tray/menu bar
```

### Problem: Build script fails with "permission denied"

**Solution:**
```bash
chmod +x build-and-push.sh
```

### Problem: "Network Error" when accessing frontend

**Check:**
1. Is backend running in Coolify? (check logs)
2. Is backend health check passing? `curl https://api-draw.yourdomain.com/health`
3. Did you build frontend with correct `BACKEND_URL`? (check build-and-push.sh)

**Fix:**
If backend URL was wrong, rebuild:
1. Update `build-and-push.sh` with correct URL
2. Run `./build-and-push.sh` again
3. Redeploy in Coolify

### Problem: CORS errors in browser console

**Check:**
In `docker-compose.coolify.yml`, verify:
```yaml
environment:
  - FRONTEND_URL=https://draw.yourdomain.com
```

Must match your ACTUAL frontend domain (with `https://`).

**Fix:**
1. Update docker-compose.coolify.yml
2. Redeploy in Coolify

### Problem: DNS not resolving

**Check:**
```bash
nslookup draw.yourdomain.com
```

**If it doesn't return your IP:**
- Wait longer (DNS can take up to 24 hours)
- Check your DNS provider settings
- Verify you added A records correctly

### Problem: SSL certificate not generating

**Check:**
1. DNS must be working first
2. Port 80 and 443 must be open on your server
3. Domain must be publicly accessible

**Wait:** SSL generation can take 1-2 minutes

---

## Part 13: Next Steps

### You're done! 🎉

Your ExcaliDash instance is now:
- ✅ Running on your domain
- ✅ Protected with basic authentication
- ✅ Using your custom Docker images
- ✅ Persisting data in Docker volumes
- ✅ SSL encrypted (HTTPS)

### Recommended:

1. **Set up backups** (see SELF-HOSTING.md → Backup & Restore)
2. **Read TESTING.md** and run through the checklist
3. **Bookmark your instance** for easy access
4. **Share credentials** with anyone you want to give access

### Updating in the future:

When you want to update ExcaliDash:
1. `git pull origin main` (get latest changes)
2. `./build-and-push.sh` (rebuild images)
3. Redeploy in Coolify

---

## Quick Reference Commands

```bash
# Navigate to project
cd ~/Projects/ExcaliDash

# Check git status
git status

# Pull latest changes
git pull

# Rebuild images
./build-and-push.sh

# Login to Docker Hub
docker login

# Check Docker is running
docker ps

# View build logs
docker images
```

---

## Getting Help

If you get stuck:

1. **Check SELF-HOSTING.md** → Troubleshooting section
2. **Check TESTING.md** → Specific test cases
3. **Check SECURITY-AUDIT.md** → Security questions
4. **Check Coolify logs** → Shows what's happening on server
5. **Check browser DevTools** → Console shows errors

---

## Important Files Reference

- `build-and-push.sh` - Build and push Docker images
- `docker-compose.coolify.yml` - Coolify deployment config
- `SELF-HOSTING.md` - Comprehensive deployment guide
- `TESTING.md` - Testing checklist
- `SECURITY-AUDIT.md` - Security review and recommendations
- `frontend/Dockerfile.custom` - Frontend Docker build
- `backend/Dockerfile.custom` - Backend Docker build

---

**Congratulations! You've successfully self-hosted ExcaliDash! 🎨**
