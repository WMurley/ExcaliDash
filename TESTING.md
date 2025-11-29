# ExcaliDash Testing Checklist

Comprehensive testing guide to ensure your ExcaliDash deployment is working correctly.

## Table of Contents

- [Pre-Deployment Testing](#pre-deployment-testing)
- [Local Docker Testing](#local-docker-testing)
- [Production Testing (Coolify)](#production-testing-coolify)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Troubleshooting Failed Tests](#troubleshooting-failed-tests)

---

## Pre-Deployment Testing

Before building Docker images, verify the configuration:

### Configuration Validation

- [ ] `build-and-push.sh` updated with correct Docker Hub username
- [ ] `build-and-push.sh` updated with correct `BACKEND_URL` (e.g., `https://api-draw.yourdomain.com`)
- [ ] `docker-compose.coolify.yml` updated with your Docker Hub username
- [ ] `docker-compose.coolify.yml` has correct `FRONTEND_URL` in backend environment
- [ ] DNS A records created for both frontend and backend domains
- [ ] DNS propagation complete (test with `nslookup draw.yourdomain.com`)

### Build System Check

- [ ] Docker installed and running: `docker --version`
- [ ] Docker Compose installed: `docker compose version`
- [ ] Logged into Docker Hub: `docker login`
- [ ] `build-and-push.sh` is executable: `ls -la build-and-push.sh`

---

## Local Docker Testing

Test images locally before pushing to production.

### Step 1: Build Images

```bash
./build-and-push.sh
```

**Expected Result:**
- [ ] Frontend builds without errors
- [ ] Backend builds without errors
- [ ] Both images tagged with version and `latest`
- [ ] Images pushed to Docker Hub successfully

**Verify on Docker Hub:**
- [ ] Visit `https://hub.docker.com/u/YOUR-USERNAME`
- [ ] Confirm `excalidash-frontend:latest` exists
- [ ] Confirm `excalidash-backend:latest` exists

### Step 2: Test Backend Locally

```bash
# Run backend container
docker run -d \
  --name test-backend \
  -p 3002:3002 \
  -e PORT=3002 \
  -e FRONTEND_URL=http://localhost:6767 \
  -e DATABASE_URL=file:/app/prisma/dev.db \
  YOUR-USERNAME/excalidash-backend:latest

# Wait a few seconds for startup
sleep 10
```

**Tests:**

- [ ] Container starts successfully: `docker ps | grep test-backend`
- [ ] Health check passes: `curl http://localhost:3002/health`
  - Expected: `{"status":"ok"}`
- [ ] No errors in logs: `docker logs test-backend`

**Verify API Endpoints:**

```bash
# List drawings (should be empty initially)
curl http://localhost:3002/drawings
# Expected: []

# Get library (should return default)
curl http://localhost:3002/library
# Expected: {"id":1,"items":"[]"}
```

- [ ] `/drawings` returns `[]` (empty array)
- [ ] `/library` returns library object
- [ ] No 500 errors

**Cleanup:**
```bash
docker stop test-backend
docker rm test-backend
```

### Step 3: Test Frontend Locally

```bash
# Run frontend container
docker run -d \
  --name test-frontend \
  -p 8080:80 \
  YOUR-USERNAME/excalidash-frontend:latest

# Wait a few seconds
sleep 5
```

**Tests:**

- [ ] Container starts successfully: `docker ps | grep test-frontend`
- [ ] Frontend accessible: `curl -I http://localhost:8080`
  - Expected: `HTTP/1.1 200 OK`
- [ ] Index.html served: `curl http://localhost:8080 | grep -i excalidash`
- [ ] No errors in logs: `docker logs test-frontend`

**Verify in Browser:**

- [ ] Open `http://localhost:8080` in browser
- [ ] Page loads without errors
- [ ] No console errors (open DevTools → Console)
- [ ] Check Network tab for API calls - should point to your `BACKEND_URL`

**Verify Backend URL is Correct:**

- [ ] Open browser DevTools → Network tab
- [ ] Refresh the page
- [ ] Look for API requests
- [ ] Confirm they're going to your configured backend URL (e.g., `https://api-draw.yourdomain.com`)
- [ ] NOT going to `/api/*` or `localhost`

**Cleanup:**
```bash
docker stop test-frontend
docker rm test-frontend
```

### Step 4: Full Stack Local Test

Test both services together:

```bash
# Create network
docker network create excalidash-test

# Start backend
docker run -d \
  --name test-backend \
  --network excalidash-test \
  -p 3002:3002 \
  -e PORT=3002 \
  -e FRONTEND_URL=http://localhost:8080 \
  -e DATABASE_URL=file:/app/prisma/dev.db \
  YOUR-USERNAME/excalidash-backend:latest

# Start frontend
docker run -d \
  --name test-frontend \
  --network excalidash-test \
  -p 8080:80 \
  YOUR-USERNAME/excalidash-frontend:latest

# Wait for services to start
sleep 15
```

**Full Workflow Test:**

- [ ] Open `http://localhost:8080` in browser
- [ ] Create a new drawing (add some shapes)
- [ ] Click "Save" and give it a name
- [ ] Confirm drawing appears in sidebar
- [ ] Refresh browser
- [ ] Drawing still visible in sidebar
- [ ] Click on drawing to load it
- [ ] All shapes render correctly
- [ ] Create a collection
- [ ] Add drawing to collection
- [ ] Collection shows up in sidebar

**Cleanup:**
```bash
docker stop test-frontend test-backend
docker rm test-frontend test-backend
docker network rm excalidash-test
```

---

## Production Testing (Coolify)

After deploying to Coolify, verify everything works in production.

### Step 1: Deployment Verification

**In Coolify Dashboard:**

- [ ] Both services show as "Running"
- [ ] No restart loops (check uptime)
- [ ] Health checks passing (if configured)

**Backend Logs:**
- [ ] No error messages
- [ ] Shows "Server started on port 3002" or similar
- [ ] Database migrations completed successfully
- [ ] No CORS errors

**Frontend Logs:**
- [ ] Nginx started successfully
- [ ] No errors

### Step 2: Network & SSL Testing

**Backend Endpoint:**

```bash
# Test backend health
curl https://api-draw.yourdomain.com/health

# Expected: {"status":"ok"}
```

- [ ] Backend domain resolves
- [ ] HTTPS certificate is valid (no browser warnings)
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Response time < 1 second

**Frontend Endpoint:**

```bash
# Test frontend
curl -I https://draw.yourdomain.com

# Expected: HTTP/2 200
```

- [ ] Frontend domain resolves
- [ ] HTTPS certificate is valid
- [ ] Returns 200 OK
- [ ] Response time < 2 seconds

### Step 3: CORS & API Communication

**Open Frontend in Browser:**

- [ ] Navigate to `https://draw.yourdomain.com`
- [ ] Open DevTools → Console
- [ ] **No CORS errors in console**
- [ ] **No 502/503/504 errors**
- [ ] **No "Failed to fetch" errors**

**Network Tab Verification:**

- [ ] Open DevTools → Network tab
- [ ] Refresh page
- [ ] Look for API calls (e.g., `/drawings`, `/library`)
- [ ] Verify they're going to `https://api-draw.yourdomain.com`
- [ ] All API calls return 200 OK (or appropriate status codes)
- [ ] No preflight CORS failures

### Step 4: Core Functionality Testing

**Drawing Creation:**

- [ ] Click "New Drawing" or start drawing
- [ ] Add rectangle (R key)
- [ ] Add circle (O key)
- [ ] Add text (T key)
- [ ] Add arrow connecting two shapes
- [ ] All tools work correctly

**Saving & Loading:**

- [ ] Click "Save" button
- [ ] Enter drawing name: "Test Drawing 1"
- [ ] Drawing appears in left sidebar
- [ ] Refresh browser
- [ ] Drawing still in sidebar
- [ ] Click on drawing name
- [ ] Drawing loads with all elements intact

**Collections:**

- [ ] Click "New Collection"
- [ ] Name it "Test Collection"
- [ ] Collection appears in sidebar
- [ ] Drag "Test Drawing 1" into collection
- [ ] Refresh browser
- [ ] Collection and drawing association persists

**Search:**

- [ ] Create multiple drawings with different names
- [ ] Use search bar
- [ ] Type drawing name
- [ ] Correct drawings filtered
- [ ] Clear search shows all drawings

**Duplicate Drawing:**

- [ ] Right-click on a drawing
- [ ] Select "Duplicate"
- [ ] New copy appears with "(copy)" suffix
- [ ] Both drawings are independent

**Delete Drawing:**

- [ ] Right-click on a drawing
- [ ] Select "Delete"
- [ ] Confirm deletion
- [ ] Drawing removed from sidebar
- [ ] Refresh browser
- [ ] Drawing still deleted (persists)

**Library:**

- [ ] Create a custom shape/group
- [ ] Add to library
- [ ] Library item appears in library panel
- [ ] Refresh browser
- [ ] Library item still present
- [ ] Can use library item in new drawing

**Export Drawing:**

- [ ] Open a drawing
- [ ] Export as PNG
- [ ] File downloads correctly
- [ ] Export as SVG
- [ ] File downloads correctly
- [ ] Export as .excalidraw
- [ ] File downloads correctly

### Step 5: Data Persistence Testing

**Test database persistence:**

- [ ] Create a new drawing and save it
- [ ] In Coolify, restart the backend service
- [ ] Wait for backend to come back up
- [ ] Refresh frontend
- [ ] Drawing still exists
- [ ] Can load and edit the drawing

**Test volume persistence:**

- [ ] In Coolify, redeploy the entire stack
- [ ] Wait for services to start
- [ ] Visit frontend
- [ ] All previous drawings still present
- [ ] Collections still present
- [ ] Library items still present

### Step 6: Browser Compatibility

Test in multiple browsers:

**Chrome/Edge:**
- [ ] All functionality works
- [ ] No console errors
- [ ] Drawing renders correctly

**Firefox:**
- [ ] All functionality works
- [ ] No console errors
- [ ] Drawing renders correctly

**Safari (if available):**
- [ ] All functionality works
- [ ] No console errors
- [ ] Drawing renders correctly

**Mobile Browser (optional):**
- [ ] Frontend loads
- [ ] Basic drawing works
- [ ] Touch gestures work

### Step 7: Real-Time Collaboration (WebSocket)

If using collaboration features:

- [ ] Open same drawing in two browser windows
- [ ] Both windows show same content
- [ ] Draw in window 1
- [ ] Changes appear in window 2 in real-time
- [ ] Move cursor in window 1
- [ ] Cursor position visible in window 2
- [ ] No WebSocket connection errors in console

---

## Performance Testing

### Response Time

**API Response Times:**

```bash
# Time backend health check
time curl https://api-draw.yourdomain.com/health

# Time drawings list
time curl https://api-draw.yourdomain.com/drawings
```

- [ ] Health check < 200ms
- [ ] Drawings list < 500ms (with < 100 drawings)
- [ ] Drawings list < 1s (with 100-1000 drawings)

**Frontend Load Time:**

- [ ] Open DevTools → Network tab
- [ ] Disable cache
- [ ] Refresh page
- [ ] Total page load < 3 seconds (on good connection)
- [ ] DOMContentLoaded < 1.5 seconds
- [ ] All resources loaded successfully

### Large Drawing Test

- [ ] Create drawing with 100+ elements
- [ ] Save drawing
- [ ] Drawing saves successfully (< 5 seconds)
- [ ] Load drawing
- [ ] Drawing loads completely (< 3 seconds)
- [ ] No lag when moving elements
- [ ] Zoom in/out works smoothly

### Stress Test (Optional)

- [ ] Create 50+ drawings
- [ ] Create 10+ collections
- [ ] Add many items to library
- [ ] Sidebar still responsive
- [ ] Search still fast
- [ ] No memory leaks (check Task Manager over time)

---

## Security Testing

### Basic Auth (if enabled)

- [ ] Visit `https://draw.yourdomain.com`
- [ ] Prompted for username/password
- [ ] Wrong credentials rejected
- [ ] Correct credentials grant access

### HTTPS & Certificates

- [ ] Frontend uses HTTPS (padlock in browser)
- [ ] Backend uses HTTPS (check API calls)
- [ ] Certificate is valid (click padlock → certificate)
- [ ] No mixed content warnings
- [ ] No insecure requests in Network tab

### XSS Protection Test

**Warning:** Basic test only. Not comprehensive.

- [ ] Create drawing with text: `<script>alert('XSS')</script>`
- [ ] Save drawing
- [ ] Load drawing
- [ ] Script does NOT execute
- [ ] Text is escaped/sanitized

### CORS Configuration

- [ ] Open DevTools → Console
- [ ] Look for CORS errors
- [ ] Should see NONE
- [ ] Backend only accepts requests from your frontend domain

**Test CORS from external origin:**

```bash
# Try to access API from different origin (should fail)
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  https://api-draw.yourdomain.com/drawings
```

- [ ] Request is blocked or returns CORS error

### Input Validation

- [ ] Try creating drawing with extremely long name (10000+ chars)
- [ ] Application handles gracefully (either accepts or rejects cleanly)
- [ ] No server crash
- [ ] No unhandled errors

---

## Troubleshooting Failed Tests

### Backend Health Check Fails

**Symptoms:** `curl https://api-draw.yourdomain.com/health` returns error

**Check:**
1. Backend service running in Coolify?
2. Correct domain configured?
3. SSL certificate issued?
4. Backend logs for errors?

**Fix:**
- Redeploy backend service
- Check environment variables
- Review SELF-HOSTING.md troubleshooting section

### Frontend Shows CORS Errors

**Symptoms:** Console shows "CORS policy blocked" errors

**Check:**
1. `FRONTEND_URL` in backend environment matches actual frontend domain
2. Includes `https://` prefix
3. No trailing slash

**Fix:**
```yaml
# In docker-compose.coolify.yml
environment:
  - FRONTEND_URL=https://draw.yourdomain.com
```
Redeploy backend.

### Drawings Don't Persist

**Symptoms:** Drawings disappear after refresh or restart

**Check:**
1. Volume `excalidash_data` exists: `docker volume ls`
2. Volume mounted correctly in backend
3. Database file exists: `docker exec excalidash-backend ls /app/prisma/`

**Fix:**
- Verify `docker-compose.coolify.yml` has volume mounts
- Redeploy with correct configuration

### Frontend Makes Requests to Wrong URL

**Symptoms:** Network tab shows API calls going to `/api/*` or localhost

**Check:**
1. Was frontend built with correct `BACKEND_URL`?
2. Check `build-and-push.sh` configuration
3. Verify image was rebuilt and pushed after changes

**Fix:**
- Update `build-and-push.sh` with correct URL
- Rebuild: `./build-and-push.sh`
- Update image tags in Coolify
- Redeploy

### WebSocket Errors

**Symptoms:** "WebSocket connection failed" in console

**Check:**
1. Backend supports WebSocket upgrade
2. Coolify/Traefik configured for WebSockets
3. No proxy blocking WebSocket connections

**Fix:**
- Usually automatic in Coolify
- Check Traefik configuration if using custom setup

---

## Test Summary Template

After completing testing, fill out this summary:

```
TESTING SUMMARY
================

Date: _____________
Tester: _____________

Build Information:
- Frontend Image: _____________
- Backend Image: _____________
- Backend URL: _____________

Pre-Deployment Tests: [PASS/FAIL]
Local Docker Tests: [PASS/FAIL]
Production Tests: [PASS/FAIL]
Performance Tests: [PASS/FAIL]
Security Tests: [PASS/FAIL]

Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

Overall Status: [READY FOR PRODUCTION / NEEDS FIXES]

Notes:
________________________________
________________________________
```

---

## Continuous Testing

Recommended ongoing testing schedule:

- **Daily:** Quick smoke test (visit site, create/load drawing)
- **Weekly:** Full functionality test
- **Monthly:** Performance and security review
- **After Updates:** Complete test suite

---

## Automated Testing (Future Enhancement)

Consider setting up:

- **Uptime monitoring** (UptimeRobot, Pingdom)
  - Monitor both frontend and backend domains
  - Alert on downtime

- **Synthetic monitoring** (Selenium, Playwright)
  - Automate drawing creation and loading
  - Run nightly tests

- **Log monitoring** (Grafana, ELK stack)
  - Alert on errors in logs
  - Track performance metrics

---

## Getting Help

If tests fail and you can't resolve:

1. Review `SELF-HOSTING.md` troubleshooting section
2. Check Coolify logs for both services
3. Open GitHub issue with:
   - Which tests failed
   - Error messages from logs
   - Your configuration (sanitized)

---

**Happy Testing! 🧪**
