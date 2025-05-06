# Render.com Disk Setup Guide

This guide explains how to configure the disk settings for the Rainbow Room Inventory System on Render.com.

## Disk Configuration

The application uses a disk mount for persistent storage of two things:
1. The SQLite database file
2. Uploaded photos

## Environment Variables

The following environment variables must be set in the Render dashboard:

- `RENDER`: Set to "true" to indicate we're running on Render
- `RENDER_DATA_DIR`: Set to "/var/data" (the directory for the database file)
- `RENDER_UPLOADS_DIR`: Set to "/var/uploads" (the directory for uploaded files)

## Disk Mount Settings

When setting up the disk in the Render dashboard:

1. **Name**: data-and-uploads
2. **Mount Path**: /var
3. **Size**: 1GB (minimum for free tier)

## Directory Structure

The application expects the following directory structure on the mounted disk:

```
/var/
  ├── data/
  │   └── database.db
  └── uploads/
      ├── [photo files]
      └── temp/
          └── [temporary import files]
```

## Manual Setup (If Needed)

If you encounter permission issues, you may need to SSH into the instance and create the directories manually:

```bash
# Create the necessary directories
mkdir -p /var/data
mkdir -p /var/uploads/temp

# Set proper permissions
chmod 755 /var/data
chmod 755 /var/uploads
chmod 755 /var/uploads/temp
```

## Troubleshooting

Common errors:

1. **EACCES: permission denied**: The application doesn't have permission to create/write to directories. Make sure the directories exist and have proper permissions.

2. **Cannot find database file**: The database file is missing or not accessible. Check if the `/var/data/database.db` file exists.

3. **Cannot write to uploads directory**: The uploads directory doesn't have the right permissions. Check if the `/var/uploads` directory exists and has write permissions.