# Faceless Video Generator - Web Interface Deployment Guide

## Deploy to EasyPanel

### Option 1: Using Docker (Recommended)

1. **Push to GitHub**
   
   First, create a GitHub repository and push the code:
   
   ```bash
   cd web
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/faceless-video-generator-web.git
   git push -u origin main
   ```

2. **Create App in EasyPanel**
   
   - Go to your EasyPanel dashboard
   - Click "Create Service" > "App"
   - Name: `video-generator-web`
   - Select "GitHub" as source
   - Connect your repository
   - Set the following environment variables:

3. **Environment Variables**
   
   ```
   SUPABASE_URL=https://adkjkixcisfjogkrkupg.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2praXhjaXNmam9na3JrdXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5Njg4MDMsImV4cCI6MjA1MjU0NDgwM30.kcswO84SUbI9ytrt2b_l_SVlcz_tFq93OLmnUFqmQf8
   KESTRA_URL=https://kestra.tribeai.com.br
   KESTRA_NAMESPACE=company.team
   ```

4. **Domain Configuration**
   
   - Go to "Domains" tab
   - Add your domain or use the auto-generated EasyPanel subdomain
   - Enable HTTPS

### Option 2: Using Docker Compose (Local/VPS)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  web:
    build: ./web
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=https://adkjkixcisfjogkrkupg.supabase.co
      - SUPABASE_KEY=your_anon_key
      - KESTRA_URL=https://kestra.tribeai.com.br
      - KESTRA_NAMESPACE=company.team
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Direct Python Deployment

1. Install dependencies:
   ```bash
   cd web
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```bash
   export SUPABASE_URL="https://adkjkixcisfjogkrkupg.supabase.co"
   export SUPABASE_KEY="your_anon_key"
   export KESTRA_URL="https://kestra.tribeai.com.br"
   export KESTRA_NAMESPACE="company.team"
   ```

3. Run the server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test API endpoints: `/api/stats`, `/api/channels`
- [ ] Test channel creation
- [ ] Test manual video addition
- [ ] Verify Kestra webhook triggers are working
