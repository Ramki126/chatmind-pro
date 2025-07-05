import os
import logging
import time
import json
import requests
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
CORS(app)

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Available models configuration - All via OpenRouter
AVAILABLE_MODELS = {
    "mistral": {
        "name": "Mistral 7B Instruct",
        "model_id": "mistralai/mistral-7b-instruct:free",
        "provider": "Mistral AI",
        "api_type": "openrouter"
    },
    "gpt4o": {
        "name": "GPT-4o Mini",
        "model_id": "openai/gpt-4o-mini",
        "provider": "OpenAI via OpenRouter",
        "api_type": "openrouter"
    }
}

class ChatbotService:
    def __init__(self):
        self.openrouter_api_key = OPENROUTER_API_KEY
        self.openrouter_base_url = OPENROUTER_BASE_URL
        self.models = AVAILABLE_MODELS
        self.current_model = "mistral"  # Default model
    
    def set_model(self, model_key):
        """Set the current model to use"""
        if model_key in self.models:
            self.current_model = model_key
            return True
        return False
    
    def get_current_model(self):
        """Get the current model information"""
        return self.models.get(self.current_model)
    
    def get_api_config(self):
        """Get API configuration for current model - only OpenRouter"""
        return {
            "api_key": self.openrouter_api_key,
            "base_url": self.openrouter_base_url,
            "headers": {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            }
        }
    
    def send_message(self, message, conversation_history=None):
        """Send message to AI model via appropriate API"""
        api_config = self.get_api_config()
        
        if not api_config["api_key"]:
            error_msg = api_config.get("error", "API key not configured")
            return {
                "success": False,
                "error": error_msg,
                "response": None,
                "response_time": 0
            }
        
        headers = api_config["headers"].copy()
        # Add additional headers for OpenRouter
        headers.update({
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "ChatMind Pro"
        })
        
        # Prepare messages for the API
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": self.models[self.current_model]["model_id"],
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{api_config['base_url']}/chat/completions",
                headers=headers,
                json=payload,
                timeout=(10, 45)  # 10s connection, 45s read timeout
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                ai_message = data["choices"][0]["message"]["content"]
                
                return {
                    "success": True,
                    "response": ai_message,
                    "response_time": response_time,
                    "usage": data.get("usage", {}),
                    "error": None
                }
            else:
                error_msg = f"API Error: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", error_msg)
                except:
                    pass
                
                return {
                    "success": False,
                    "error": error_msg,
                    "response": None,
                    "response_time": response_time
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout - API took too long to respond",
                "response": None,
                "response_time": time.time() - start_time
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "response": None,
                "response_time": time.time() - start_time
            }

# Initialize chatbot service
chatbot = ChatbotService()

@app.route('/')
def index():
    """Main chat interface"""
    if 'chat_history' not in session:
        session['chat_history'] = []
    return render_template('chat.html')

@app.route('/qa')
def qa_dashboard():
    """Quality Assurance dashboard"""
    return render_template('qa_dashboard.html')

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """API endpoint for chat functionality"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                "success": False,
                "error": "Message is required"
            }), 400
        
        message = data['message'].strip()
        if not message:
            return jsonify({
                "success": False,
                "error": "Message cannot be empty"
            }), 400
        
        # Get conversation history from session
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        # Convert session history to API format
        conversation_history = []
        for chat in session['chat_history']:
            conversation_history.append({"role": "user", "content": chat['user_message']})
            conversation_history.append({"role": "assistant", "content": chat['ai_response']})
        
        # Send message to AI
        result = chatbot.send_message(message, conversation_history)
        
        if result['success']:
            # Add to session history
            chat_entry = {
                'user_message': message,
                'ai_response': result['response'],
                'timestamp': datetime.now().isoformat(),
                'response_time': result['response_time']
            }
            session['chat_history'].append(chat_entry)
            session.modified = True
            
            return jsonify({
                "success": True,
                "response": result['response'],
                "response_time": result['response_time'],
                "usage": result.get('usage', {})
            })
        else:
            return jsonify({
                "success": False,
                "error": result['error']
            }), 500
            
    except Exception as e:
        logging.error(f"Chat API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/test', methods=['POST'])
def test_model():
    """API endpoint for testing model responses"""
    try:
        data = request.get_json()
        if not data or 'test_cases' not in data:
            return jsonify({
                "success": False,
                "error": "Test cases are required"
            }), 400
        
        test_cases = data['test_cases']
        results = []
        
        for i, test_case in enumerate(test_cases):
            if 'input' not in test_case:
                results.append({
                    "test_id": i,
                    "success": False,
                    "error": "Input is required for test case"
                })
                continue
            
            # Send test message
            result = chatbot.send_message(test_case['input'])
            
            if result['success']:
                # Calculate comprehensive metrics
                response_text = result['response']
                response_length = len(response_text)
                word_count = len(response_text.split())
                sentence_count = len([s for s in response_text.split('.') if s.strip()])
                avg_word_length = sum(len(word) for word in response_text.split()) / max(word_count, 1)
                
                # Calculate readability metrics
                words_per_sentence = word_count / max(sentence_count, 1)
                
                # Calculate coherence indicators
                question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which']
                question_count = sum(1 for word in question_words if word in response_text.lower())
                
                # Calculate lexical diversity (unique words / total words)
                unique_words = len(set(response_text.lower().split()))
                lexical_diversity = unique_words / max(word_count, 1)
                
                # Calculate confidence indicators
                uncertainty_phrases = ['might', 'maybe', 'possibly', 'perhaps', 'could be', 'may be']
                certainty_phrases = ['definitely', 'certainly', 'clearly', 'obviously', 'absolutely']
                uncertainty_count = sum(1 for phrase in uncertainty_phrases if phrase in response_text.lower())
                certainty_count = sum(1 for phrase in certainty_phrases if phrase in response_text.lower())
                
                # Enhanced evaluation system with ground truth support
                quality_score = 0
                response_lower = response_text.lower()
                input_lower = test_case['input'].lower()
                expected_output = test_case.get('expected_output', '').lower() if test_case.get('expected_output') else None
                ground_truth_pass = True  # Initialize ground truth pass status
                
                test_result = {
                    "test_id": i,
                    "success": True,  # Will be updated later based on ground truth
                    "input": test_case['input'],
                    "output": result['response'],
                    "response_time": result['response_time'],
                    "metrics": {
                        # Basic metrics
                        "response_length": response_length,
                        "word_count": word_count,
                        "sentence_count": sentence_count,
                        "avg_response_time": result['response_time'],
                        
                        # Language complexity metrics
                        "avg_word_length": round(avg_word_length, 2),
                        "words_per_sentence": round(words_per_sentence, 2),
                        "lexical_diversity": round(lexical_diversity, 3),
                        
                        # Content analysis metrics
                        "question_count": question_count,
                        "uncertainty_count": uncertainty_count,
                        "certainty_count": certainty_count,
                        
                        # Confidence score (0-100)
                        "confidence_score": max(0, min(100, (certainty_count * 20) - (uncertainty_count * 10) + 50)),
                        
                        # Readability score (simplified - lower is more readable)
                        "readability_score": round(min(100, max(0, (words_per_sentence * 2) + (avg_word_length * 10) - 20)), 1),
                        
                        # Information density (unique words per total words)
                        "information_density": round(lexical_diversity * 100, 1)
                    },
                    "expected_output": test_case.get('expected_output', None)
                }
                
                # Calculate quality score components
                # 1. Relevance Score (0-30 points) - Does response address the question?
                relevance_score = 0
                
                # Extract key terms from input
                question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'explain', 'describe', 'define']
                question_type = next((word for word in question_words if word in input_lower), 'general')
                
                # Check if response addresses the question type appropriately
                if question_type == 'what' and any(word in response_lower for word in ['is', 'are', 'definition', 'means']):
                    relevance_score += 10
                elif question_type == 'how' and any(word in response_lower for word in ['step', 'process', 'method', 'by']):
                    relevance_score += 10
                elif question_type == 'why' and any(word in response_lower for word in ['because', 'reason', 'cause', 'due to']):
                    relevance_score += 10
                elif question_type == 'explain' and any(word in response_lower for word in ['explanation', 'means', 'involves', 'process']):
                    relevance_score += 10
                
                # Check for topic relevance (shared keywords between question and answer)
                input_keywords = set(word for word in input_lower.split() if len(word) > 3)
                response_keywords = set(word for word in response_lower.split() if len(word) > 3)
                keyword_overlap = len(input_keywords.intersection(response_keywords)) / max(len(input_keywords), 1)
                relevance_score += min(20, keyword_overlap * 30)
                
                quality_score += min(30, relevance_score)
                
                # 2. Content Quality with Ground Truth (0-25 points)
                content_score = 0
                ground_truth_pass = True  # Track if ground truth evaluation passes
                truth_overlap = 0  # Initialize overlap score
                
                if expected_output:
                    # Ground truth comparison available
                    expected_keywords = set(expected_output.split())
                    response_keyword_set = set(response_lower.split())
                    truth_overlap = len(expected_keywords.intersection(response_keyword_set)) / max(len(expected_keywords), 1)
                    content_score = truth_overlap * 25
                    
                    # Fail if ground truth overlap is too low (less than 70% match for meaningful evaluation)
                    if truth_overlap < 0.7:
                        ground_truth_pass = False
                else:
                    # Heuristic-based quality assessment
                    error_phrases = ['error', 'sorry', 'cannot', 'unable', 'don\'t know', 'not sure', 'i don\'t understand']
                    if not any(phrase in response_lower for phrase in error_phrases):
                        content_score += 15
                    
                    informative_indicators = ['because', 'however', 'therefore', 'example', 'specifically', 'details', 'first', 'second']
                    if any(word in response_lower for word in informative_indicators):
                        content_score += 10
                
                quality_score += content_score
                
                # 3. Completeness Score (0-20 points)
                completeness_score = 0
                if response_length > 100 and word_count > 15:
                    completeness_score = 20
                elif response_length > 50 and word_count > 8:
                    completeness_score = 15
                elif response_length > 20 and word_count > 5:
                    completeness_score = 10
                
                quality_score += completeness_score
                
                # 4. Linguistic Quality (0-15 points)
                if 0.5 <= lexical_diversity <= 0.9 and 5 <= words_per_sentence <= 20:
                    quality_score += 15
                elif 0.3 <= lexical_diversity <= 0.95:
                    quality_score += 10
                else:
                    quality_score += 5
                
                # 5. Response Efficiency (0-10 points)
                if result['response_time'] < 3:
                    quality_score += 10
                elif result['response_time'] < 8:
                    quality_score += 7
                else:
                    quality_score += 3
                
                # Add quality score and evaluation transparency to metrics
                test_result['metrics']['quality_score'] = quality_score
                test_result['metrics']['has_ground_truth'] = expected_output is not None
                test_result['metrics']['evaluation_method'] = "ground_truth" if expected_output else "heuristic"
                test_result['metrics']['relevance_score'] = round(min(30, relevance_score), 1)
                test_result['metrics']['content_quality_score'] = round(content_score, 1)
                test_result['metrics']['completeness_score'] = round(completeness_score, 1)
                
                # Update test success status based on ground truth evaluation
                if expected_output and not ground_truth_pass:
                    test_result['success'] = False
                    test_result['failure_reason'] = f"Ground truth mismatch - expected content similarity too low ({round(truth_overlap * 100, 1)}% match)"
                    test_result['metrics']['truth_overlap_percent'] = round(truth_overlap * 100, 1)
                
            else:
                test_result = {
                    "test_id": i,
                    "success": False,
                    "input": test_case['input'],
                    "error": result['error'],
                    "response_time": result['response_time']
                }
            
            results.append(test_result)
        
        # Calculate comprehensive summary metrics
        successful_tests = [r for r in results if r['success']]
        if successful_tests:
            avg_response_time = sum(r['response_time'] for r in successful_tests) / len(successful_tests)
            avg_quality_score = sum(r['metrics']['quality_score'] for r in successful_tests) / len(successful_tests)
            avg_confidence_score = sum(r['metrics']['confidence_score'] for r in successful_tests) / len(successful_tests)
            avg_readability_score = sum(r['metrics']['readability_score'] for r in successful_tests) / len(successful_tests)
            avg_info_density = sum(r['metrics']['information_density'] for r in successful_tests) / len(successful_tests)
            avg_lexical_diversity = sum(r['metrics']['lexical_diversity'] for r in successful_tests) / len(successful_tests)
            avg_words_per_sentence = sum(r['metrics']['words_per_sentence'] for r in successful_tests) / len(successful_tests)
            total_word_count = sum(r['metrics']['word_count'] for r in successful_tests)
            success_rate = len(successful_tests) / len(results) * 100
        else:
            avg_response_time = avg_quality_score = avg_confidence_score = 0
            avg_readability_score = avg_info_density = avg_lexical_diversity = 0
            avg_words_per_sentence = total_word_count = success_rate = 0
        
        summary = {
            # Basic performance metrics
            "total_tests": len(test_cases),
            "successful_tests": len(successful_tests),
            "success_rate": round(success_rate, 1),
            "avg_response_time": round(avg_response_time, 2),
            
            # Quality and content metrics
            "avg_quality_score": round(avg_quality_score, 1),
            "avg_confidence_score": round(avg_confidence_score, 1),
            "avg_readability_score": round(avg_readability_score, 1),
            "avg_information_density": round(avg_info_density, 1),
            
            # Language complexity metrics
            "avg_lexical_diversity": round(avg_lexical_diversity, 3),
            "avg_words_per_sentence": round(avg_words_per_sentence, 1),
            "total_words_generated": total_word_count,
            
            # Model evaluation insights
            "model_consistency": round(100 - (len([r for r in successful_tests if r['metrics']['quality_score'] < avg_quality_score * 0.8]) / max(len(successful_tests), 1) * 100), 1),
            "response_efficiency": "Excellent" if avg_response_time < 3 else "Good" if avg_response_time < 6 else "Fair"
        }
        
        return jsonify({
            "success": True,
            "results": results,
            "summary": summary
        })
        
    except Exception as e:
        logging.error(f"Test API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    """Clear chat history"""
    session.pop('chat_history', None)
    return jsonify({"success": True})

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get chat history"""
    history = session.get('chat_history', [])
    return jsonify({
        "success": True,
        "history": history
    })

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available models"""
    return jsonify({
        "success": True,
        "models": chatbot.models,
        "current_model": chatbot.current_model
    })

@app.route('/api/set_model', methods=['POST'])
def set_model():
    """Set the current model"""
    data = request.get_json()
    model_key = data.get('model')
    
    if chatbot.set_model(model_key):
        return jsonify({
            "success": True,
            "message": f"Model switched to {chatbot.models[model_key]['name']}",
            "current_model": chatbot.current_model
        })
    else:
        return jsonify({
            "success": False,
            "error": "Invalid model selection"
        })

# External API endpoints for third-party applications
@app.route('/api/v1/chat', methods=['POST'])
def external_chat_api():
    """Standalone API endpoint for external applications"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                "success": False,
                "error": "Message is required",
                "code": "MISSING_MESSAGE"
            }), 400
        
        message = data['message'].strip()
        if not message:
            return jsonify({
                "success": False,
                "error": "Message cannot be empty",
                "code": "EMPTY_MESSAGE"
            }), 400
        
        # Optional conversation history from request
        conversation_history = data.get('conversation_history', [])
        
        # Optional model selection
        model_key = data.get('model', None)
        original_model = None
        if model_key:
            # Temporarily switch model for this request
            original_model = chatbot.get_current_model()
            chatbot.set_model(model_key)
        
        # Send message to AI
        result = chatbot.send_message(message, conversation_history)
        
        # Restore original model if changed
        if model_key and original_model:
            # Find the original model key by searching for it
            for key, model_info in chatbot.models.items():
                if model_info == original_model:
                    chatbot.set_model(key)
                    break
        
        if result['success']:
            return jsonify({
                "success": True,
                "response": result['response'],
                "response_time": result['response_time'],
                "model": chatbot.get_current_model(),
                "timestamp": time.time()
            })
        else:
            return jsonify({
                "success": False,
                "error": result['error'],
                "code": "AI_ERROR"
            }), 500
            
    except Exception as e:
        logging.error(f"External API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/v1/models', methods=['GET'])
def external_models_api():
    """Get available models for external applications"""
    try:
        models = [
            {
                "key": "mistral",
                "name": "Mistral 7B Instruct",
                "provider": "OpenRouter",
                "free": True,
                "description": "Fast and efficient conversational AI"
            },
            {
                "key": "gpt4o",
                "name": "GPT-4o Mini",
                "provider": "OpenRouter", 
                "free": False,
                "description": "Advanced reasoning and multimodal capabilities"
            }
        ]
        
        current_model = chatbot.get_current_model()
        
        return jsonify({
            "success": True,
            "models": models,
            "current_model": current_model
        })
        
    except Exception as e:
        logging.error(f"Models API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/v1/status', methods=['GET'])
def external_status_api():
    """Health check endpoint for external applications"""
    try:
        return jsonify({
            "success": True,
            "status": "online",
            "service": "ChatMind Pro API",
            "version": "1.0",
            "current_model": chatbot.get_current_model(),
            "timestamp": time.time()
        })
        
    except Exception as e:
        logging.error(f"Status API error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Service unavailable",
            "code": "SERVICE_ERROR"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
