# ChatMind Pro API - Custom Domain Deployment Guide

## 🚀 Deploy Without Replit Branding

### Option 1: Heroku (Free/Paid) - Quick Setup
**Result:** `https://your-api-name.herokuapp.com` or `https://yourdomain.com`

**Steps:**
1. Create Heroku account at heroku.com
2. Install Heroku CLI
3. In your project folder:
```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-chatmind-api

# Set environment variable
heroku config:set OPENROUTER_API_KEY=your_key_here

# Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

**Custom Domain:**
```bash
heroku domains:add yourdomain.com
# Then configure DNS: CNAME record pointing to your-app.herokuapp.com
```

### Option 2: Railway (Modern, Fast)
**Result:** `https://your-app.railway.app` or `https://yourdomain.com`

**Steps:**
1. Go to railway.app
2. Connect GitHub repository
3. Add environment variable: `OPENROUTER_API_KEY`
4. Deploy automatically

### Option 3: Render (Simple)
**Result:** `https://your-api.onrender.com` or `https://yourdomain.com`

**Steps:**
1. Go to render.com
2. Connect repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn --bind 0.0.0.0:$PORT main:app`
5. Add environment variable: `OPENROUTER_API_KEY`

### Option 4: DigitalOcean App Platform
**Result:** `https://your-api.ondigitalocean.app` or `https://yourdomain.com`

**Steps:**
1. Go to cloud.digitalocean.com
2. Create new App
3. Connect repository
4. Configure environment variables
5. Deploy

### Option 5: AWS/Google Cloud (Advanced)
**Result:** `https://yourdomain.com`

For production-grade deployment with full control.

## 📋 Required Files Created:

✅ `Procfile` - Heroku deployment configuration  
✅ `runtime.txt` - Python version specification  
✅ `main.py` - Application entry point  
✅ `app.py` - Main Flask application  

## 🔧 Environment Variables Needed:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
SESSION_SECRET=your_random_secret_key_here
```

## 🌐 Custom Domain Setup:

After deploying to any platform:
1. **Buy domain** from any registrar
2. **Add custom domain** in platform settings
3. **Configure DNS:**
   - CNAME record: `api` → `your-app.platform.com`
   - Or A record pointing to platform IP

**Final Result:**
- `https://api.yourdomain.com/api/v1/chat`
- `https://api.yourdomain.com/api/v1/models`
- `https://api.yourdomain.com/api/v1/status`

## 🚀 Quick Recommendation:

**For fastest setup:** Use **Railway** or **Render**
- No credit card required for free tier
- Automatic deployments from Git
- Easy custom domain setup
- Professional URLs immediately

## 📁 Export Your Code:

1. Download all files from Replit
2. Create new Git repository
3. Deploy to chosen platform
4. Update API documentation with new URLs

Your API will be completely independent of Replit with a professional URL structure.