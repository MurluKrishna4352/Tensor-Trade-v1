# Vercel Deployment - Quick Reference

## First Time Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Set Environment Variable:**
   ```bash
   vercel env add GROQ_API_KEY
   ```
   Then paste your Groq API key when prompted.

## Deploy Commands

### Development Preview
```bash
vercel
```
This creates a preview deployment with a unique URL.

### Production Deployment
```bash
vercel --prod
```
This deploys to your production domain.

### Local Testing (Vercel Dev)
```bash
vercel dev
```
Tests the Vercel environment locally at http://localhost:3000

## After Deployment

Your app will be live at:
- Preview: `https://your-project-xxxx.vercel.app`  
- Production: `https://your-project.vercel.app`

Test with:
```bash
curl https://your-project.vercel.app/health
```

## Monitoring

View logs and analytics at:
https://vercel.com/dashboard

## Troubleshooting

### "Module not found" errors
- Ensure all dependencies are in `requirements.txt`
- Run `vercel --prod` again

### "Function exceeded timeout"
- Upgrade to Vercel Pro for 60s timeout
- Or optimize LLM calls for faster responses

### Environment variables not working
```bash
# List all env vars
vercel env ls

# Pull env vars to local
vercel env pull
```

## Custom Domain

1. Go to Project Settings > Domains
2. Add your domain
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

## Rollback

```bash
vercel rollback
```

## CI/CD with GitHub

1. Connect repo to Vercel in dashboard
2. Every push to `main` auto-deploys to production
3. Every PR gets a preview deployment

---

**Need help?** Check [vercel-deployment.md](vercel-deployment.md) for detailed guide.
