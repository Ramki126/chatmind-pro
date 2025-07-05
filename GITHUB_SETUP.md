# GitHub Setup & Deployment Guide

## 📋 Complete Steps to Push ChatMind Pro to GitHub

### Step 1: Download Your Code from Replit

1. **Download the deployment package** created by the export script:
   - File: `chatmind_pro_api_20250705_130231.zip`
   - Extract this zip file on your local machine

2. **Files included in the package:**
   ```
   ✓ app.py - Main Flask application
   ✓ main.py - Entry point
   ✓ templates/ - HTML templates
   ✓ static/ - CSS, JS, assets
   ✓ requirements.txt - Python dependencies
   ✓ Procfile - Deployment configuration
   ✓ app.yaml - DigitalOcean configuration
   ✓ .env.example - Environment template
   ✓ README.md - Documentation
   ✓ .gitignore - Git ignore rules
   ```

### Step 2: Local Git Setup

1. **Navigate to your extracted folder:**
   ```bash
   cd chatmind-pro
   ```

2. **Initialize Git repository:**
   ```bash
   git init
   ```

3. **Add all files:**
   ```bash
   git add .
   ```

4. **Create initial commit:**
   ```bash
   git commit -m "Initial commit: ChatMind Pro AI Platform"
   ```

### Step 3: GitHub Repository Setup

1. **Go to GitHub.com** and sign in

2. **Create new repository:**
   - Click "New repository" button
   - Repository name: `chatmind-pro` (or your preferred name)
   - Description: "AI Chatbot & Testing Platform with Multi-Model Support"
   - Make it Public or Private
   - **Don't** initialize with README (you already have one)

3. **Connect local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/yourusername/chatmind-pro.git
   
   # Check current branch name
   git branch
   
   # If you see "master", rename it to "main"
   git branch -M main
   git push -u origin main
   
   # Alternative: If you want to keep "master" branch
   # git push -u origin master
   ```

### Step 4: Environment Setup

1. **Create `.env` file locally:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your API keys:**
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   SESSION_SECRET=your_random_secret_key_here
   ```

   **Note:** Never commit the `.env` file (it's in .gitignore)

### Step 5: Local Testing

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run locally:**
   ```bash
   python main.py
   ```

3. **Test the application:**
   - Visit: `http://localhost:5000`
   - Test chat functionality
   - Test QA dashboard
   - Verify model switching

## 🌊 DigitalOcean Deployment

### Option A: Direct GitHub Integration

1. **Go to DigitalOcean App Platform:**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub:**
   - Choose "GitHub" as source
   - Select your `chatmind-pro` repository
   - Choose `main` branch

3. **Configure App:**
   - App name: `chatmind-pro-api`
   - Region: Choose closest to your users
   - Plan: Basic ($5/month) recommended

4. **Set Environment Variables:**
   ```
   OPENROUTER_API_KEY = your_key_here
   SESSION_SECRET = random_secret_here
   ```

5. **Deploy:**
   - DigitalOcean automatically detects Python
   - Uses your `requirements.txt` and `Procfile`
   - Deployment takes 3-5 minutes

### Option B: Using App Spec (app.yaml)

1. **Upload app.yaml:**
   - In DigitalOcean Apps console
   - Use "Edit App Spec" option
   - Upload the included `app.yaml` file

2. **Automatic Configuration:**
   - App name, resources, and environment setup
   - Health checks and scaling rules
   - Domain configuration

## 🔧 Repository Structure After Setup

```
chatmind-pro/                    # Your GitHub repository
├── .git/                       # Git metadata
├── .gitignore                  # Files to ignore
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies
├── Procfile                    # Process configuration
├── app.yaml                    # DigitalOcean configuration
├── main.py                     # Application entry point
├── app.py                      # Main Flask application
├── .env.example                # Environment template
├── .env                        # Your secrets (not committed)
├── templates/                  # HTML templates
│   ├── base.html
│   ├── chat.html
│   └── qa_dashboard.html
├── static/                     # Frontend assets
│   ├── css/custom.css
│   └── js/
│       ├── chat.js
│       └── qa.js
└── docs/                       # Documentation
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT_GUIDE.md
    └── DIGITALOCEAN_DEPLOYMENT.md
```

## 🔄 Continuous Deployment Workflow

After initial setup, your workflow becomes:

1. **Make code changes locally**
2. **Test locally:** `python main.py`
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```
4. **DigitalOcean automatically deploys** your changes

## 🌐 Your Professional URLs

After deployment:
- **DigitalOcean URL:** `https://chatmind-pro-api-xxxxx.ondigitalocean.app`
- **Custom Domain:** `https://api.yourdomain.com` (optional)
- **GitHub Repository:** `https://github.com/yourusername/chatmind-pro`

## 🔐 Security Best Practices

1. **Never commit API keys**
2. **Use environment variables** for secrets
3. **Keep .env in .gitignore**
4. **Regularly rotate API keys**
5. **Use strong session secrets**

## 📊 Monitoring Your Deployment

### DigitalOcean Dashboard:
- View application logs
- Monitor CPU/memory usage
- Track request volume
- Set up alerts

### API Health Checks:
```bash
# Test your deployed API
curl https://your-app.ondigitalocean.app/api/v1/status
```

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failed:**
   - Check `requirements.txt` formatting
   - Verify Python version in `runtime.txt`

2. **Environment Variables:**
   - Ensure all required variables are set in DigitalOcean
   - Check for typos in variable names

3. **API Errors:**
   - Verify OPENROUTER_API_KEY is valid
   - Check API quota limits

### Getting Help:
- Check application logs in DigitalOcean console
- Review GitHub Actions (if using)
- Test API endpoints individually