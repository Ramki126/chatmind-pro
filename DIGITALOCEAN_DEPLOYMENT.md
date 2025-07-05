# DigitalOcean App Platform Deployment Guide

## 🚀 Deploy ChatMind Pro API to DigitalOcean

**Result:** Professional URL like `https://chatmind-pro-api-xxxxx.ondigitalocean.app` or your custom domain

## 📋 Prerequisites

1. DigitalOcean account (sign up at cloud.digitalocean.com)
2. GitHub account
3. Your OpenRouter API key

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Export your code** from Replit:
   ```bash
   python export_code.py
   ```

2. **Create GitHub repository:**
   - Go to github.com
   - Create new repository: `chatmind-pro-api`
   - Upload your exported files

### Step 2: Deploy to DigitalOcean

1. **Login to DigitalOcean:**
   - Go to https://cloud.digitalocean.com/
   - Navigate to "Apps" section
   - Click "Create App"

2. **Connect GitHub:**
   - Choose "GitHub" as source
   - Authorize DigitalOcean to access your repositories
   - Select your `chatmind-pro-api` repository
   - Choose `main` branch

3. **Configure App Settings:**
   - **App Name:** `chatmind-pro-api`
   - **Region:** Choose closest to your users
   - **Plan:** Basic ($5/month) or Development ($0 for testing)

4. **Environment Variables:**
   - Click "Edit" next to your app
   - Go to "App-Level Environment Variables"
   - Add these variables:
     ```
     OPENROUTER_API_KEY = your_openrouter_api_key_here
     SESSION_SECRET = your_random_secret_string_here
     ```

5. **Build & Deploy:**
   - DigitalOcean will automatically detect Python
   - It will use your `requirements.txt` and `Procfile`
   - Click "Create Resources"
   - Wait for deployment (3-5 minutes)

### Step 3: Test Your API

Your API will be available at:
```
https://chatmind-pro-api-xxxxx.ondigitalocean.app
```

**Test endpoints:**
```bash
# Health check
curl https://your-app-url.ondigitalocean.app/api/v1/status

# Send message
curl -X POST https://your-app-url.ondigitalocean.app/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "model": "mistral"}'

# Get models
curl https://your-app-url.ondigitalocean.app/api/v1/models
```

## 🌐 Custom Domain Setup

### Add Your Own Domain

1. **In DigitalOcean Apps:**
   - Go to your app settings
   - Click "Domains" tab
   - Click "Add Domain"
   - Enter your domain: `api.yourdomain.com`

2. **Configure DNS:**
   - In your domain registrar (GoDaddy, Namecheap, etc.)
   - Add CNAME record:
     ```
     Name: api
     Value: your-app-url.ondigitalocean.app
     ```

3. **SSL Certificate:**
   - DigitalOcean automatically provides free SSL
   - Your API will be available at `https://api.yourdomain.com`

## 💰 Pricing

- **Development Plan:** Free (limited resources)
- **Basic Plan:** $5/month (recommended for production)
- **Professional Plan:** $12/month (for high traffic)

## 🔄 Automatic Deployments

DigitalOcean will automatically redeploy when you push to GitHub:

1. Make changes to your code
2. Push to GitHub main branch
3. DigitalOcean automatically builds and deploys
4. Zero downtime deployments

## 📊 Monitoring & Logs

1. **View Logs:**
   - Go to your app in DigitalOcean
   - Click "Runtime Logs" tab
   - Monitor API requests and errors

2. **Metrics:**
   - CPU and memory usage
   - Request volume
   - Response times

## 🔒 Security Features

- Automatic SSL certificates
- DDoS protection
- Firewall management
- Secure environment variables

## 📱 Your Final API URLs

After deployment, your API will be accessible at:

```
# Status check
GET https://api.yourdomain.com/api/v1/status

# Send chat message
POST https://api.yourdomain.com/api/v1/chat

# Get available models
GET https://api.yourdomain.com/api/v1/models
```

## 🎯 Benefits of DigitalOcean

✅ **Professional URL** - No Replit branding  
✅ **Custom Domains** - Use your own domain  
✅ **Auto-scaling** - Handles traffic spikes  
✅ **Zero Downtime** - Automatic deployments  
✅ **Global CDN** - Fast worldwide access  
✅ **SSL Included** - Secure HTTPS by default  
✅ **Monitoring** - Built-in logs and metrics  

## 🆘 Troubleshooting

**Common Issues:**

1. **Build Failed:**
   - Check your `requirements.txt` file
   - Ensure all dependencies are listed

2. **Environment Variables:**
   - Verify `OPENROUTER_API_KEY` is set correctly
   - Check for typos in variable names

3. **Health Check Failed:**
   - Ensure `/api/v1/status` endpoint works
   - Check app logs for errors

**Support:**
- DigitalOcean documentation: docs.digitalocean.com
- Community forum: digitalocean.com/community