# Kestra KV Store Configuration Guide

## Required Keys for Faceless Video Generator

Add these keys to the Kestra KV Store under namespace `company.team`:

### Already Configured ✅
- `GOOGLE_API_KEY` - Gemini API key
- `KOKO_BASE_URL` - Kokoro TTS base URL
- `KOKORO_API` - Kokoro TTS API key

### Supabase (Required)
```
Key: SUPABASE_URL
Value: https://adkjkixcisfjogkrkupg.supabase.co

Key: SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2praXhjaXNmam9na3JrdXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5Njg4MDMsImV4cCI6MjA1MjU0NDgwM30.kcswO84SUbI9ytrt2b_l_SVlcz_tFq93OLmnUFqmQf8

Key: SUPABASE_SERVICE_KEY
Value: [Get from Supabase Dashboard > Project Settings > API > service_role key]
```

### MinIO Storage (Required)
```
Key: MINIO_ENDPOINT
Value: https://console-projeto-1-minio.2eisou.easypanel.host

Key: MINIO_ACCESS_KEY
Value: [Your MinIO access key]

Key: MINIO_SECRET_KEY
Value: [Your MinIO secret key]

Key: MINIO_BUCKET
Value: nca-toolkit
```

### Replicate (Required for Image Generation)
```
Key: REPLICATE_API_TOKEN
Value: [Get from replicate.com > Account > API Tokens]
```

### AssemblyAI (Required for Captions)
```
Key: ASSEMBLYAI_API_KEY
Value: [Get from assemblyai.com > Dashboard]
```

## How to Add Keys in Kestra

1. Go to https://kestra.tribeai.com.br/
2. Navigate to **Namespaces** > **company.team**
3. Go to **KV Store** tab
4. Click **Add Key**
5. Enter the key name and value
6. Save

## Verifying Configuration

After adding all keys, you can verify them by running a test workflow:

```yaml
id: test-kv-store
namespace: company.team
tasks:
  - id: check-keys
    type: io.kestra.plugin.core.log.Log
    message: |
      Supabase URL: {{ kv('SUPABASE_URL') }}
      MinIO Endpoint: {{ kv('MINIO_ENDPOINT') }}
      Google API Key exists: {{ kv('GOOGLE_API_KEY') != null }}
```
