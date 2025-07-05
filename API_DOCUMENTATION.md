# ChatMind Pro API Documentation

## Base URL
```
https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev
```

## Authentication
Currently no authentication required (public API). All endpoints are accessible.

## API Endpoints

### 1. Send Chat Message
**Endpoint:** `POST /api/v1/chat`

Send a message to the AI and get a response.

**Request Body:**
```json
{
  "message": "What is artificial intelligence?",
  "conversation_history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help you?"}
  ],
  "model": "mistral"
}
```

**Request Parameters:**
- `message` (required): The message to send to the AI
- `conversation_history` (optional): Array of previous conversation messages
- `model` (optional): Model to use ("mistral" or "gpt4o")

**Response:**
```json
{
  "success": true,
  "response": "Artificial intelligence (AI) refers to...",
  "response_time": 1.23,
  "model": {
    "key": "mistral",
    "name": "Mistral 7B Instruct",
    "provider": "OpenRouter"
  },
  "timestamp": 1625097600.123
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Message is required",
  "code": "MISSING_MESSAGE"
}
```

### 2. Get Available Models
**Endpoint:** `GET /api/v1/models`

Get list of available AI models.

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "key": "mistral",
      "name": "Mistral 7B Instruct",
      "provider": "OpenRouter",
      "free": true,
      "description": "Fast and efficient conversational AI"
    },
    {
      "key": "gpt4o",
      "name": "GPT-4o Mini",
      "provider": "OpenRouter",
      "free": false,
      "description": "Advanced reasoning and multimodal capabilities"
    }
  ],
  "current_model": {
    "key": "mistral",
    "name": "Mistral 7B Instruct",
    "provider": "OpenRouter"
  }
}
```

### 3. Health Check
**Endpoint:** `GET /api/v1/status`

Check if the API service is running.

**Response:**
```json
{
  "success": true,
  "status": "online",
  "service": "ChatMind Pro API",
  "version": "1.0",
  "current_model": {
    "key": "mistral",
    "name": "Mistral 7B Instruct",
    "provider": "OpenRouter"
  },
  "timestamp": 1625097600.123
}
```

## Usage Examples

### Python Example
```python
import requests
import json

# Base URL
base_url = "https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev"

# Send a chat message
def send_message(message, conversation_history=None, model=None):
    url = f"{base_url}/api/v1/chat"
    payload = {
        "message": message,
        "conversation_history": conversation_history or [],
        "model": model or "mistral"
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Example usage
response = send_message("What is machine learning?")
if response["success"]:
    print(f"AI Response: {response['response']}")
    print(f"Response Time: {response['response_time']}s")
else:
    print(f"Error: {response['error']}")

# Get available models
def get_models():
    url = f"{base_url}/api/v1/models"
    response = requests.get(url)
    return response.json()

models = get_models()
print("Available models:", models["models"])

# Check API status
def check_status():
    url = f"{base_url}/api/v1/status"
    response = requests.get(url)
    return response.json()

status = check_status()
print("API Status:", status["status"])
```

### JavaScript Example
```javascript
const baseUrl = "https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev";

// Send a chat message
async function sendMessage(message, conversationHistory = [], model = "mistral") {
    const response = await fetch(`${baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            conversation_history: conversationHistory,
            model: model
        })
    });
    
    return await response.json();
}

// Example usage
sendMessage("What is artificial intelligence?")
    .then(response => {
        if (response.success) {
            console.log("AI Response:", response.response);
            console.log("Response Time:", response.response_time + "s");
        } else {
            console.log("Error:", response.error);
        }
    })
    .catch(error => console.error("Request failed:", error));

// Get available models
async function getModels() {
    const response = await fetch(`${baseUrl}/api/v1/models`);
    return await response.json();
}

// Check API status
async function checkStatus() {
    const response = await fetch(`${baseUrl}/api/v1/status`);
    return await response.json();
}
```

### cURL Examples
```bash
# Send a chat message
curl -X POST "https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?",
    "model": "mistral"
  }'

# Get available models
curl "https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev/api/v1/models"

# Check API status
curl "https://411c140d-2e7d-4bf4-816d-8c7ac8a0528d-00-3eqjkf7z9ikny.spock.replit.dev/api/v1/status"
```

## Error Codes
- `MISSING_MESSAGE`: Message field is required
- `EMPTY_MESSAGE`: Message cannot be empty
- `AI_ERROR`: Error from AI model
- `INTERNAL_ERROR`: Server internal error
- `SERVICE_ERROR`: Service unavailable

## Rate Limiting
Currently no rate limiting is implemented. Use responsibly.

## Response Times
- Typical response time: 1-3 seconds
- Varies based on message complexity and model selected
- GPT-4o Mini may be slightly slower than Mistral

## Conversation History Format
The conversation history should be an array of message objects:
```json
[
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi! How can I help you?"},
  {"role": "user", "content": "What is AI?"}
]
```

## Integration Tips
1. **Always check the `success` field** in responses
2. **Handle errors gracefully** with proper error codes
3. **Maintain conversation history** for context-aware responses
4. **Choose appropriate model** based on your needs (free vs premium)
5. **Monitor response times** for user experience optimization