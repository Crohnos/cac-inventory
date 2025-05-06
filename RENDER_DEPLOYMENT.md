# Render.com Deployment Guide

This guide explains how to deploy the Rainbow Room Inventory System to Render.com's free tier.

## Prerequisites

1. A GitHub account with this repository pushed to it
2. A Render.com account

## Project Preparation

The following files have been prepared for Render deployment:

1. **render.yaml** - Service configuration file
2. **package.json** - Added Render-specific scripts
3. **frontend/src/services/api.ts** - Updated to support production API URL
4. **frontend/.env.production** - Set production API URL
5. **src/server.ts** - Updated for CORS and persistent storage
6. **src/database/connection.ts** - Updated for persistent storage

## Deployment Steps

### 1. Create a New Web Service for the Backend

1. Go to the Render Dashboard and click "New+"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: rainbow-room-api
   - **Runtime**: Node
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Instance Type**: Free
5. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `RENDER`: true
   - `CORS_ORIGIN`: (will be your frontend URL, can update later)
6. Create Disk:
   - Click "Add Disk"
   - Name: data-and-uploads
   - Mount Path: /data-uploads
   - Size: 1GB (free tier limit)
7. Click "Create Web Service"

### 2. Create a New Static Site for the Frontend

1. Go to the Render Dashboard and click "New+"
2. Select "Static Site"
3. Connect your GitHub repository
4. Configure the site:
   - **Name**: rainbow-room-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: frontend/dist
5. Add environment variables:
   - `VITE_API_URL`: (URL of your backend, e.g., https://rainbow-room-api.onrender.com/api)
6. Under "Advanced" settings, add a redirect rule:
   - Source: /*
   - Destination: /index.html
   - Status: 200
7. Click "Create Static Site"

### 3. Update CORS Settings

1. After both services are deployed, update the backend CORS_ORIGIN environment variable with the actual frontend URL from Render.

### 4. Monitor Deployment

1. Check the deployment logs for any errors
2. Test the application by navigating to your frontend URL
3. If you encounter issues, check:
   - Logs in the Render dashboard
   - Network requests in browser Dev Tools
   - Database and upload paths in the backend

## Important Notes

1. **Free Tier Limitations**:
   - Services will spin down after 15 minutes of inactivity
   - When a service spins up again, it may take 30-60 seconds to respond
   - Limited to 512 MB RAM
   - 500 hours of runtime per month
   - 1GB of storage

2. **Data Persistence**:
   - All data is stored on the mounted disk
   - Database and uploads will persist between deployments

3. **Troubleshooting**:
   - If the database isn't working, check mounted disk permissions
   - If frontend can't connect to backend, verify CORS_ORIGIN and API URL configuration
   - If images don't load, ensure the uploads directory is properly mounted