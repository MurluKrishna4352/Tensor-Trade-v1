# ✅ Vercel Deployment Checklist

Your project is now **Vercel-ready**! Follow this checklist to deploy.

## Files Added/Modified

### ✅ New Files Created:
- `vercel.json` - Vercel configuration for routing and builds
- `api/index.py` - Serverless function entry point
- `.vercelignore` - Files to exclude from deployment
- `runtime.txt` - Python version specification (3.10)
- `.env.example` - Environment variable template
- `vercel-deployment.md` - Detailed deployment guide
- `VERCEL_QUICKSTART.md` - Quick reference guide
- `DEPLOY_CHECKLIST.md` - This file

### ✅ Files Modified:
- `requirements.txt` - Added all dependencies (groq, aiohttp, yfinance, etc.)
- `frontend.js` - Updated API_BASE_URL to work with both local and production
- `main.py` - Changed root endpoint from `/` to `/api` for Vercel routing
- `README.md` - Added deployment section

## Pre-Deployment Checklist

### 1. ✅ Prerequisites Installed
```powershell
# Install Node.js (if not installed)
# Download from: https://nodejs.org/

# Install Vercel CLI
npm install -g vercel

# Verify installation
vercel --version
```

### 2. ✅ Get Groq API Key
1. Visit https://console.groq.com
2. Sign up for free account
3. Create API key
4. Save it securely (you'll need it in step 4)

### 3. ✅ Test Locally First
```powershell
# Activate virtual environment
& C:/Users/kndn2/Desktop/deriv/.venv/Scripts/Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Test the server
uvicorn main:app --host 0.0.0.0 --port 8000

# In another terminal, test health endpoint
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
```

### 4. ✅ Deploy to Vercel

#### Option A: Command Line (Recommended)
```powershell
# Login to Vercel
vercel login

# Deploy (first time will ask questions)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? deriv-trading-ai (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No

# Add environment variable
vercel env add GROQ_API_KEY production

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration (Automatic)
```powershell
# 1. Push code to GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push

# 2. Go to https://vercel.com/dashboard
# 3. Click "Add New Project"
# 4. Import your GitHub repository
# 5. Add GROQ_API_KEY in environment variables
# 6. Click "Deploy"
```

## Post-Deployment Verification

### Test Your Deployment
```powershell
# Replace YOUR_URL with your actual Vercel URL
$VERCEL_URL = "https://your-project.vercel.app"

# Test health endpoint
Invoke-RestMethod -Uri "$VERCEL_URL/health" -Method Get

# Test asset analysis
Invoke-RestMethod -Uri "$VERCEL_URL/analyze-asset?asset=AAPL" -Method Post

# Open frontend in browser
Start-Process $VERCEL_URL
```

### Expected Response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "services": { ... }
}
```

## Troubleshooting

### Issue: "Build failed"
- Check `vercel logs` for details
- Verify all dependencies are in `requirements.txt`
- Ensure Python version matches `runtime.txt`

### Issue: "GROQ_API_KEY not found"
```powershell
# Add environment variable
vercel env add GROQ_API_KEY production
# Then redeploy
vercel --prod
```

### Issue: "Function timeout"
- Vercel free tier has 10s timeout
- Upgrade to Pro for 60s timeout
- Or optimize LLM calls for faster response

### Issue: "Module import errors"
```powershell
# Ensure all imports work locally first
python -c "from main import app; print('OK')"

# If OK locally, redeploy
vercel --prod
```

## Success Indicators

✅ Build completes without errors  
✅ `/health` endpoint returns 200 OK  
✅ Frontend loads and shows UI  
✅ Can analyze assets (AAPL, SPY, etc.)  
✅ LLM council generates debate output  

## Next Steps

1. **Custom Domain**: Add in Vercel dashboard under Project Settings > Domains
2. **Analytics**: Enable Vercel Analytics for traffic monitoring
3. **Speed Insights**: Add Vercel Speed Insights for performance tracking
4. **CI/CD**: Connect GitHub for automatic deployments on push

## Resources

- 📘 [Detailed Guide](vercel-deployment.md)
- ⚡ [Quick Reference](VERCEL_QUICKSTART.md)
- 🌐 [Vercel Documentation](https://vercel.com/docs)
- 💬 [Vercel Community](https://github.com/vercel/vercel/discussions)

## Support

If you encounter issues:
1. Check [vercel-deployment.md](vercel-deployment.md) troubleshooting section
2. Run `vercel logs` to see deployment logs
3. Visit Vercel dashboard for detailed error messages

---

**Ready to deploy?** Run `vercel --prod` and you're live! 🚀
