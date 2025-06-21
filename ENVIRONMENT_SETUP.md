# DTTP Project - Environment Configuration Guide

## Overview

This guide explains how to set up environment variables for both the server (Python/FastAPI) and client (Next.js) components of the DTTP project.

## Server Environment Variables

### Location
Create a `.env` file in the `/server` directory.

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Database Configuration
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=postgres

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
LOG_LEVEL=INFO

# CORS Configuration (use specific origins in production)
ALLOWED_ORIGINS=*

# Model Configuration
IMAGES_PATH=../client/public/test_images
MODELS_CACHE_DIR=./model_cache
EMBEDDINGS_CACHE_DIR=./embeddings_cache
MAX_WORKERS=4
ENABLE_MODEL_PARALLELISM=true
```

### Setup Steps

1. Copy the example file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` with your actual Supabase credentials and configuration.

3. Ensure your Supabase project has:
   - Images table created
   - Storage bucket for images
   - Proper RLS policies

## Client Environment Variables

### Location
Create a `.env.local` file in the `/client` directory.

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Add any other client-side environment variables here
```

### Setup Steps

1. Copy the example file:
   ```bash
   cp client/.env.example client/.env.local
   ```

2. Update the API URL if your server runs on a different host/port.

## Security Notes

1. **Never commit `.env` files to version control** - they contain sensitive credentials
2. The `.env.example` files show the structure but don't contain real secrets
3. In production, use proper secret management services
4. For client-side variables, only use `NEXT_PUBLIC_` prefix for variables that should be exposed to the browser

## Files Structure After Setup

```
dttp-project/
├── server/
│   ├── .env              # Your actual secrets (gitignored)
│   ├── .env.example      # Template file (safe to commit)
│   └── ...
├── client/
│   ├── .env.local        # Your actual client config (gitignored)
│   ├── .env.example      # Template file (safe to commit)
│   └── ...
```

## Development vs Production

### Development
- Use `localhost` URLs
- Can use relaxed CORS settings (`ALLOWED_ORIGINS=*`)
- Use development Supabase project

### Production
- Use proper domain names
- Restrict CORS to specific origins
- Use production Supabase project
- Consider using environment variable injection from deployment platform

## Troubleshooting

1. **Server won't start**: Check that all required environment variables are set
2. **Database connection fails**: Verify Supabase credentials and database URL
3. **Client can't reach API**: Ensure `NEXT_PUBLIC_API_URL` points to the correct server address
4. **CORS errors**: Update `ALLOWED_ORIGINS` to include your client domain

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/service keys
4. Navigate to Settings → Database to get connection details
