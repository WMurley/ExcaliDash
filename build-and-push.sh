#!/bin/bash
set -e

# ============================================================================
# ExcaliDash Docker Build & Push Script
# ============================================================================
# This script builds custom Docker images for frontend and backend with
# configurable backend URL and pushes them to Docker Hub or GitHub Container Registry.
#
# Usage:
#   1. Update the configuration variables below
#   2. Make script executable: chmod +x build-and-push.sh
#   3. Login to Docker Hub: docker login
#   4. Run: ./build-and-push.sh
# ============================================================================

# ============================================================================
# CONFIGURATION - Update these values for your deployment
# ============================================================================

# Docker registry and username (Docker Hub or GitHub Container Registry)
# Examples:
#   Docker Hub: DOCKER_USERNAME="yourusername"
#   GitHub CR:  DOCKER_USERNAME="ghcr.io/yourusername"
DOCKER_USERNAME="your-dockerhub-username"

# Your backend API URL (where frontend will send requests)
# Must be the full URL including protocol
# Example: https://api-draw.yourdomain.com
BACKEND_URL="https://api-draw.yourdomain.com"

# Version tag for your images
# Automatically read from VERSION file if it exists
if [ -f VERSION ]; then
    VERSION=$(cat VERSION)
else
    VERSION="1.0.0"
fi

# Image names
FRONTEND_IMAGE="${DOCKER_USERNAME}/excalidash-frontend"
BACKEND_IMAGE="${DOCKER_USERNAME}/excalidash-backend"

# ============================================================================
# PREFLIGHT CHECKS
# ============================================================================

echo "============================================================================"
echo "ExcaliDash Build & Push Script"
echo "============================================================================"
echo ""
echo "Configuration:"
echo "  Docker Username: ${DOCKER_USERNAME}"
echo "  Backend URL: ${BACKEND_URL}"
echo "  Version: ${VERSION}"
echo "  Frontend Image: ${FRONTEND_IMAGE}"
echo "  Backend Image: ${BACKEND_IMAGE}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if logged in to Docker
if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running or you're not logged in"
    exit 1
fi

# Validate configuration
if [ "${DOCKER_USERNAME}" = "your-dockerhub-username" ]; then
    echo "Error: Please update DOCKER_USERNAME in the script before running"
    exit 1
fi

if [ "${BACKEND_URL}" = "https://api-draw.yourdomain.com" ]; then
    echo "Warning: Using default BACKEND_URL. Make sure this is correct."
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting build process..."
echo ""

# ============================================================================
# BUILD FRONTEND
# ============================================================================

echo "============================================================================"
echo "Building frontend..."
echo "============================================================================"
echo "  Context: ./frontend"
echo "  Dockerfile: frontend/Dockerfile.custom"
echo "  Backend URL: ${BACKEND_URL}"
echo ""

docker build \
  --build-arg BACKEND_URL="${BACKEND_URL}" \
  --build-arg VITE_APP_VERSION="${VERSION}" \
  --build-arg VITE_APP_BUILD_LABEL="Custom Build $(date +%Y%m%d-%H%M%S)" \
  -t "${FRONTEND_IMAGE}:${VERSION}" \
  -t "${FRONTEND_IMAGE}:latest" \
  -f frontend/Dockerfile.custom \
  ./frontend

echo "✓ Frontend build complete"
echo ""

# ============================================================================
# BUILD BACKEND
# ============================================================================

echo "============================================================================"
echo "Building backend..."
echo "============================================================================"
echo "  Context: ./backend"
echo "  Dockerfile: backend/Dockerfile.custom"
echo ""

docker build \
  -t "${BACKEND_IMAGE}:${VERSION}" \
  -t "${BACKEND_IMAGE}:latest" \
  -f backend/Dockerfile.custom \
  ./backend

echo "✓ Backend build complete"
echo ""

# ============================================================================
# PUSH IMAGES
# ============================================================================

echo "============================================================================"
echo "Pushing images to registry..."
echo "============================================================================"
echo ""

echo "Pushing ${FRONTEND_IMAGE}:${VERSION}..."
docker push "${FRONTEND_IMAGE}:${VERSION}"
echo "✓ Pushed frontend:${VERSION}"

echo "Pushing ${FRONTEND_IMAGE}:latest..."
docker push "${FRONTEND_IMAGE}:latest"
echo "✓ Pushed frontend:latest"

echo "Pushing ${BACKEND_IMAGE}:${VERSION}..."
docker push "${BACKEND_IMAGE}:${VERSION}"
echo "✓ Pushed backend:${VERSION}"

echo "Pushing ${BACKEND_IMAGE}:latest..."
docker push "${BACKEND_IMAGE}:latest"
echo "✓ Pushed backend:latest"

echo ""
echo "============================================================================"
echo "✓ Build and push completed successfully!"
echo "============================================================================"
echo ""
echo "Images pushed:"
echo "  Frontend: ${FRONTEND_IMAGE}:${VERSION}"
echo "  Frontend: ${FRONTEND_IMAGE}:latest"
echo "  Backend:  ${BACKEND_IMAGE}:${VERSION}"
echo "  Backend:  ${BACKEND_IMAGE}:latest"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.coolify.yml with these image names"
echo "  2. Deploy to Coolify using the updated compose file"
echo "  3. Configure domains in Coolify UI"
echo ""
echo "See SELF-HOSTING.md for detailed deployment instructions."
echo ""
