$(document).ready(function() {
    // Initialize chat functionality
    initializeChat();
    loadChatHistory();
    
    // Form submission
    $('#chatForm').on('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    // Clear history button
    $('#clearHistoryBtn').on('click', function() {
        clearChatHistory();
    });
    
    // Auto-focus on message input
    $('#messageInput').focus();
});

function initializeChat() {
    // Set initial API status
    updateApiStatus('ready', 'Ready');
    
    // Load available models and current selection
    loadChatModels();
    
    // Model selection change handler
    $('#chatModelSelect').on('change', switchChatModel);
}

function loadChatModels() {
    fetch('/api/models')
        .then(response => response.json())
        .then(data => {
            console.log('Models API response:', data); // Debug logging
            if (data.success) {
                // Update model selector
                const modelSelect = document.getElementById('chatModelSelect');
                modelSelect.value = data.current_model;
                
                // Update model info display
                const currentModel = data.models[data.current_model];
                console.log('Current model data:', currentModel); // Debug logging
                
                if (currentModel) {
                    document.getElementById('chatModelName').textContent = currentModel.name || 'Unknown Model';
                    document.getElementById('chatModelProvider').textContent = currentModel.provider || 'Unknown Provider';
                    
                    // Also update the status section model name
                    const statusModelElement = document.getElementById('statusModelName');
                    if (statusModelElement) {
                        statusModelElement.textContent = currentModel.name || 'Unknown Model';
                    }
                } else {
                    console.error('Current model not found:', data.current_model);
                }
            }
        })
        .catch(error => {
            console.error('Error loading models:', error);
        });
}

function switchChatModel() {
    const selectedModel = document.getElementById('chatModelSelect').value;
    console.log('Switching to model:', selectedModel); // Debug logging
    
    fetch('/api/set_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: selectedModel })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Set model response:', data); // Debug logging
        if (data.success) {
            // Update model info display
            loadChatModels();
            
            // Add a system message to chat
            const modelName = data.message.replace('Model switched to ', '');
            addMessage(`✓ Switched to ${modelName}`, 'system', new Date());
        } else {
            alert('Error switching model: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error switching model:', error);
        alert('Failed to switch model. Please try again.');
    });
}

function loadChatHistory() {
    $.get('/api/history')
        .done(function(response) {
            if (response.success && response.history.length > 0) {
                const chatMessages = $('#chatMessages');
                chatMessages.empty();
                
                response.history.forEach(function(chat) {
                    addMessage(chat.user_message, 'user', new Date(chat.timestamp));
                    addMessage(chat.ai_response, 'ai', new Date(chat.timestamp), {
                        responseTime: chat.response_time
                    });
                });
                
                scrollToBottom();
            }
        })
        .fail(function() {
            console.error('Failed to load chat history');
        });
}

function sendMessage() {
    const messageInput = $('#messageInput');
    const message = messageInput.val().trim();
    
    if (!message) {
        return;
    }
    
    // Disable input and show loading
    messageInput.prop('disabled', true);
    $('#sendBtn').prop('disabled', true);
    updateApiStatus('sending', 'Sending...');
    
    // Add user message to chat
    addMessage(message, 'user');
    messageInput.val('');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to API
    $.ajax({
        url: '/api/chat',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            message: message
        }),
        timeout: 30000
    })
    .done(function(response) {
        hideTypingIndicator();
        
        if (response.success) {
            addMessage(response.response, 'ai', null, {
                responseTime: response.response_time,
                usage: response.usage
            });
            updateApiStatus('success', 'Success');
            updateResponseTime(response.response_time);
        } else {
            addMessage('Error: ' + response.error, 'ai', null, { isError: true });
            updateApiStatus('error', 'Error');
        }
    })
    .fail(function(xhr, status, error) {
        hideTypingIndicator();
        
        let errorMessage = 'Network error occurred';
        if (status === 'timeout') {
            errorMessage = 'Request timed out';
        } else if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
        }
        
        addMessage('Error: ' + errorMessage, 'ai', null, { isError: true });
        updateApiStatus('error', 'Error');
    })
    .always(function() {
        // Re-enable input
        messageInput.prop('disabled', false);
        $('#sendBtn').prop('disabled', false);
        messageInput.focus();
    });
}

function addMessage(content, sender, timestamp = null, metadata = {}) {
    const chatMessages = $('#chatMessages');
    const messageTime = timestamp || new Date();
    const timeString = messageTime.toLocaleTimeString();
    
    let messageClass = '';
    if (sender === 'user') {
        messageClass = 'message user';
    } else if (sender === 'system') {
        messageClass = 'message system';
    } else {
        messageClass = 'message ai';
    }
    
    if (metadata.isError) {
        messageClass += ' error';
    }
    
    let bubbleClass = 'message-bubble';
    if (metadata.isError) {
        bubbleClass += ' bg-danger text-white';
    }
    
    let metaInfo = '';
    if (metadata.responseTime) {
        metaInfo += `<div class="message-meta">Response time: ${metadata.responseTime.toFixed(2)}s</div>`;
    }
    
    const messageHtml = `
        <div class="${messageClass}">
            <div class="${bubbleClass}">
                ${escapeHtml(content)}
            </div>
            <div class="message-time">${timeString}</div>
            ${metaInfo}
        </div>
    `;
    
    chatMessages.append(messageHtml);
    scrollToBottom();
}

function showTypingIndicator() {
    const chatMessages = $('#chatMessages');
    const typingHtml = `
        <div class="typing-indicator">
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    chatMessages.append(typingHtml);
    scrollToBottom();
}

function hideTypingIndicator() {
    $('.typing-indicator').remove();
}

function scrollToBottom() {
    const chatMessages = $('#chatMessages');
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
}

function updateApiStatus(status, text) {
    const statusElement = $('#apiStatus');
    statusElement.removeClass('bg-secondary bg-primary bg-success bg-danger');
    
    switch(status) {
        case 'ready':
            statusElement.addClass('bg-secondary');
            break;
        case 'sending':
            statusElement.addClass('bg-primary');
            break;
        case 'success':
            statusElement.addClass('bg-success');
            break;
        case 'error':
            statusElement.addClass('bg-danger');
            break;
    }
    
    statusElement.text(text);
}

function updateResponseTime(time) {
    $('#responseTime').text(time.toFixed(2) + 's');
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        $.post('/api/clear-history')
            .done(function(response) {
                if (response.success) {
                    $('#chatMessages').html(`
                        <div class="text-center text-muted">
                            <i class="fas fa-comments fa-3x mb-3"></i>
                            <p>Start an intelligent conversation!</p>
                        </div>
                    `);
                    updateApiStatus('ready', 'Ready');
                    $('#responseTime').text('-');
                }
            })
            .fail(function() {
                alert('Failed to clear chat history');
            });
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
