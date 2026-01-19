# Web Interface Deployment Guide

## Option 1: Deploy on EasyPanel with Git

1. Create a new App in EasyPanel
2. Select "Git" as source
3. Enter repository: `https://github.com/Guilherme-Silva-Lopes/faceless-video-generator-web.git`
4. Set Build settings:
   - Build Command: (leave empty, uses Dockerfile)
   - Dockerfile Path: `web/Dockerfile`
5. Add Environment Variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase anon key
   - `KESTRA_WEBHOOK_URL` - Your Kestra webhook URL
6. Deploy!

## Option 2: Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=your_supabase_url_here
      - SUPABASE_KEY=your_supabase_anon_key_here
      - KESTRA_WEBHOOK_URL=https://kestra.tribeai.com.br/api/v1/executions/webhook/company.team/webhook-trigger/faceless-video-generator-webhook
```

Run: `docker-compose up -d`

## Option 3: Direct Python

```bash
cd web
pip install -r requirements.txt
export SUPABASE_URL="your_supabase_url_here"
export SUPABASE_KEY="your_supabase_anon_key_here"
export KESTRA_WEBHOOK_URL="https://kestra.tribeai.com.br/api/v1/executions/webhook/company.team/webhook-trigger/faceless-video-generator-webhook"
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Your Supabase project URL | Yes |
| SUPABASE_KEY | Your Supabase anon key | Yes |
| KESTRA_WEBHOOK_URL | Kestra webhook endpoint | Yes |
