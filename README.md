# ChatMind Pro API Deployment

## Quick Start

1. Set environment variables:
   - OPENROUTER_API_KEY (get from openrouter.ai)
   - SESSION_SECRET (random string)

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run locally:
   ```bash
   python main.py
   ```

4. Deploy to cloud platform using provided guides.

## API Endpoints

- POST /api/v1/chat - Send messages
- GET /api/v1/models - Get available models  
- GET /api/v1/status - Health check

See API_DOCUMENTATION.md for complete details.
