# MCP Appium Configuration Guide

## Supabase Tracing Setup

### Option 1: Environment Variables (Recommended)
Create a `.env` file in your project root:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option 2: Shell Environment
```bash
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Option 3: Inline Environment
```bash
SUPABASE_URL="https://your-project-id.supabase.co" SUPABASE_KEY="eyJ..." npm start
```

### Option 4: Configuration File
Create a `config.json` file:
```json
{
  "tracing": {
    "enabled": true,
    "supabase": {
      "url": "https://your-project-id.supabase.co",
      "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for production**
3. **Rotate keys regularly**
4. **Use least-privilege access**
5. **Monitor usage and set up alerts**

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create or select your project
3. Navigate to Settings > API
4. Copy your Project URL and anon/public key
5. Set up Row Level Security (RLS) policies as needed
