# Kestra KV Store Configuration

Required keys to configure in Kestra > Namespaces > company.team > KV Store:

## Already Configured (Verify)

- `GOOGLE_API_KEY` - Gemini API key
- `KOKO_BASE_URL` - Kokoro TTS base URL
- `KOKORO_API` - Kokoro TTS API key

## Required - Add These

### 1. Supabase URL
Key: SUPABASE_URL
Value: [Your Supabase project URL - get from Supabase Dashboard > Settings > API]

### 2. Supabase Anon Key
Key: SUPABASE_ANON_KEY
Value: [Your Supabase anon key - get from Supabase Dashboard > Settings > API]

### 3. MinIO Configuration
Key: MINIO_ENDPOINT
Value: [Your MinIO endpoint URL]

Key: MINIO_ACCESS_KEY
Value: [Your MinIO access key]

Key: MINIO_SECRET_KEY
Value: [Your MinIO secret key]

Key: MINIO_BUCKET
Value: nca-toolkit (or your bucket name)

### 4. Replicate API
Key: REPLICATE_API_TOKEN
Value: [Get from replicate.com > Account > API Tokens]

### 5. AssemblyAI API
Key: ASSEMBLYAI_API_KEY
Value: [Get from assemblyai.com > Dashboard]

## How to Add Keys

1. Go to Kestra UI
2. Navigate to Namespaces > company.team
3. Click on "KV Store" tab
4. Click "Add Key"
5. Enter key name and value
6. Click Save

## Verification

After adding all keys, you can test them by creating a simple flow:

```yaml
id: test-kv-store
namespace: company.team
tasks:
  - id: verify
    type: io.kestra.plugin.core.log.Log
    message: |
      Supabase URL exists: {{ kv('SUPABASE_URL') != null }}
      Google API Key exists: {{ kv('GOOGLE_API_KEY') != null }}
```
