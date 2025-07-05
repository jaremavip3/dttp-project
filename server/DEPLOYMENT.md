# DTTP AI Search Server - Docker Deployment Guide

This guide will help you deploy the DTTP AI Search Server on any laptop/server to work with your Vercel-hosted frontend at https://dttp-project.vercel.app/

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM (for ML models)
- 10GB free disk space

### 1. Clone or Copy the Server Files

```bash
# If you have git access to the repo
git clone <your-repo-url>
cd dttp-project/server

# OR copy the server folder to your target machine
```

### 2. Configure Environment

```bash
# Copy the production environment template
cp .env.prod .env

# Edit the environment file with your database credentials
nano .env  # or use your preferred editor
```

**Required Configuration:**
Update these variables in `.env`:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `DATABASE_HOST` - Your database host
- `DATABASE_PASSWORD` - Your database password

### 3. Deploy the Server

```bash
# Make the deployment script executable
chmod +x deploy-prod.sh

# Deploy the server
./deploy-prod.sh
```

The script will:

- Build the Docker image
- Start the service
- Verify it's running correctly
- Display connection details

### 4. Update Vercel Configuration

In your Vercel project settings, add this environment variable:

- `NEXT_PUBLIC_API_URL` = `http://YOUR_SERVER_IP:5000`

Replace `YOUR_SERVER_IP` with the actual IP address of the machine running the Docker container.

## 📋 Environment Variables

### Server Environment (`.env`)

```bash
# Database Configuration (REQUIRED)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
DATABASE_HOST=your_database_host_here
DATABASE_PASSWORD=your_database_password_here

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://dttp-project.vercel.app

# Model Configuration
MODELS_CACHE_DIR=/app/model_cache
EMBEDDINGS_CACHE_DIR=/app/embeddings_cache
MAX_WORKERS=4
ENABLE_MODEL_PARALLELISM=true
```

### Vercel Environment (Project Settings)

- `NEXT_PUBLIC_API_URL` = `http://your-server-ip:5000`

## 🛠 Management Commands

### Using the deployment script:

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the server
docker-compose -f docker-compose.prod.yml down

# Restart the server
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:5000/health
```

### Manual Docker commands:

```bash
# Build image
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f dttp-backend

# Stop services
docker-compose -f docker-compose.prod.yml down

# Remove everything (including volumes)
docker-compose -f docker-compose.prod.yml down -v
```

## 🔍 Verification

After deployment, verify the service is working:

1. **Health Check:** `curl http://localhost:5000/health`
2. **API Documentation:** http://localhost:5000/docs
3. **Test from Frontend:** Visit https://dttp-project.vercel.app/ and try the search functionality

## 🌐 Network Configuration

### Port Requirements

- **Port 5000:** API server (must be accessible from the internet for Vercel)

### Firewall Configuration

Make sure port 5000 is open for incoming connections:

```bash
# Ubuntu/Debian
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### Router Configuration

If running on a home network, configure port forwarding:

- Forward external port 5000 to internal port 5000 on the server machine

## 📊 Monitoring

### Health Monitoring

The service includes built-in health checks:

- Docker health check every 30 seconds
- API endpoint: `/health`
- Model-specific health: `/health/{model}`

### Log Monitoring

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Specific service logs
docker-compose -f docker-compose.prod.yml logs -f dttp-backend
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 5000 already in use:**

   ```bash
   # Check what's using the port
   sudo lsof -i :5000

   # Kill the process or change the port in docker-compose.prod.yml
   ```

2. **Out of memory errors:**

   - Increase Docker memory limits
   - Reduce `MAX_WORKERS` in environment
   - Set `ENABLE_MODEL_PARALLELISM=false`

3. **Database connection errors:**

   - Verify database credentials in `.env`
   - Check network connectivity to database
   - Ensure database accepts connections from Docker container IP

4. **CORS errors from Vercel:**
   - Verify `ALLOWED_ORIGINS` includes `https://dttp-project.vercel.app`
   - Check Vercel environment variable `NEXT_PUBLIC_API_URL`

### Getting Help

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify health: `curl http://localhost:5000/health`
3. Test API docs: http://localhost:5000/docs

## 🔄 Updates

To update the server:

```bash
# Pull latest changes (if using git)
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📈 Performance Tuning

### For High-Performance Servers:

```bash
# Edit docker-compose.prod.yml to increase resources
deploy:
  resources:
    limits:
      memory: 16G
    reservations:
      memory: 8G
```

### For Low-Resource Servers:

```bash
# In .env file:
MAX_WORKERS=2
ENABLE_MODEL_PARALLELISM=false
```

## 🔐 Security Considerations

1. **Database Security:** Use strong passwords and restrict database access
2. **Network Security:** Use HTTPS in production (add nginx proxy)
3. **Environment Variables:** Never commit `.env` files to version control
4. **Updates:** Regularly update Docker images and dependencies

---

## Quick Reference

| Action   | Command                                             |
| -------- | --------------------------------------------------- |
| Deploy   | `./deploy-prod.sh`                                  |
| Stop     | `docker-compose -f docker-compose.prod.yml down`    |
| Logs     | `docker-compose -f docker-compose.prod.yml logs -f` |
| Health   | `curl http://localhost:5000/health`                 |
| API Docs | http://localhost:5000/docs                          |
