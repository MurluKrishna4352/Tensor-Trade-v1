# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`

## Environment Variables

Before deploying, set up these environment variables in your Vercel project dashboard:

1. **GROQ_API_KEY** - Your Groq API key for LLM inference
   ```
   vercel env add GROQ_API_KEY
   ```

## Deployment Steps

### Option 1: Deploy via CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project directory:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository

2. Go to https://vercel.com/dashboard

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure environment variables in the project settings

6. Deploy!

## Project Structure for Vercel

```
deriv/
├── api/
│   └── index.py          # Serverless entry point
├── agents/               # Agent modules
├── services/             # Service modules  
├── llm_council/          # Debate engine
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel configuration
├── index.html           # Frontend HTML
└── frontend.js          # Frontend JavaScript
```

## Testing Locally

Test the Vercel deployment locally:

```bash
vercel dev
```

This will start a local development server that mimics the Vercel environment.

## API Endpoints

After deployment, your API will be available at:

- `GET /` - Serves the frontend
- `GET /health` - Health check endpoint
- `POST /analyze-asset` - Analyze a specific asset
- `POST /run-agents` - Run full agent analysis

Example:
```
https://your-project.vercel.app/health
https://your-project.vercel.app/analyze-asset?asset=AAPL
```

## Troubleshooting

### Cold Starts
Serverless functions may experience cold starts (first request takes longer). This is normal for Vercel's free tier.

### Timeout Limits
- Free tier: 10 second execution limit
- Pro tier: 60 second execution limit
- Enterprise: Configurable

If your LLM council takes longer than these limits, consider:
- Upgrading to Pro/Enterprise
- Optimizing agent execution
- Implementing response streaming

### Memory Limits
- Default: 1024 MB
- Adjust in vercel.json if needed:
  ```json
  {
    "functions": {
      "api/index.py": {
        "memory": 3008
      }
    }
  }
  ```

### Dependencies
If you encounter missing dependencies, ensure all required packages are in `requirements.txt`.

## Monitoring

Monitor your deployment at:
- Vercel Dashboard: https://vercel.com/dashboard
- Runtime Logs: Available in the deployment details

## Scaling

Vercel automatically scales based on traffic. No configuration needed.

## Custom Domain

Add a custom domain in your Vercel project settings:
1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS records as instructed

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
