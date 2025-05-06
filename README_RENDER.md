# Render.com Setup for Rainbow Room Inventory System

This guide explains how to set up the Rainbow Room Inventory System on Render.com, including automatic database initialization and mock data population.

## Overview

The application is configured to automatically:

1. Initialize the persistent disk storage
2. Set up the SQLite database
3. Populate the database with mock data (if no database exists)

This happens during the build phase, so your application will be ready to use with sample data as soon as it's deployed.

## How It Works

The initialization process uses the following components:

1. **scripts/render-init.js**: A script that:
   - Creates necessary directories
   - Checks if a database exists
   - Runs database setup
   - Populates with mock data (only if the database doesn't exist)

2. **Package.json scripts**:
   - `render-build`: Runs during deployment to build and initialize the app
   - `render-init`: The initialization script that sets up the database

3. **Environment variables**:
   - `RENDER_DATA_DIR`: Path to the database directory
   - `RENDER_UPLOADS_DIR`: Path to the uploads directory

## Persistent Data

The application uses Render's disk feature to ensure data persistence:

1. **Database**: Stored in `/var/data/database.db`
2. **Uploads**: Stored in `/var/uploads/`

When the app first deploys, it checks if a database exists. If not, it creates one and populates it with sample data. On subsequent deployments, it keeps the existing database intact.

## Mock Data

The application is populated with:

- 10 item categories (Clothing, Toys, Books, etc.)
- 50+ size options
- 100 sample inventory items
- Random QR codes and placeholder images

This allows you to immediately test all features of the application.

## Troubleshooting

If you encounter issues with data initialization:

1. **Check build logs**: Look for "RENDER INITIALIZATION" sections
2. **Check disk permissions**: Ensure the disk is properly mounted
3. **Manual initialization**: You can SSH into the instance and run `npm run render-init`

## Data Reset

If you need to reset all data:

1. Delete the disk in Render dashboard
2. Create a new disk with the same settings
3. Redeploy the application