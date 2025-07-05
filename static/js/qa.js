$(document).ready(function() {
    // Initialize QA dashboard
    initializeQA();
    
    // Form submission
    $('#testForm').on('submit', function(e) {
        e.preventDefault();
        runTests();
    });
    
    // Export results button
    $('#exportResultsBtn').on('click', function() {
        exportResults();
    });
});

let testResults = null;

function initializeQA() {
    console.log('QA Dashboard initialized');
    
    // Load available models and current selection
    loadModels();
    
    // Model selection change handler
    $('#modelSelect').on('change', switchModel);
    
    // Test case management handlers
    $('#addTestCaseBtn').on('click', addTestCase);
    $('#clearAllBtn').on('click', clearAllTestCases);
    
    // CSV upload handlers
    $('#uploadCsvBtn').on('click', toggleCsvUpload);
    $('#cancelCsvBtn').on('click', toggleCsvUpload);
    $('#processCsvBtn').on('click', processCsvFile);
    $('#downloadTemplateBtn').on('click', downloadCsvTemplate);
    
    // Add sample test cases
    addSampleTestCases();
}

function loadModels() {
    fetch('/api/models')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update model selector
                const modelSelect = document.getElementById('modelSelect');
                modelSelect.value = data.current_model;
                
                // Update model info display
                const currentModel = data.models[data.current_model];
                document.getElementById('modelName').textContent = currentModel.name;
                document.getElementById('modelProvider').textContent = currentModel.provider;
            }
        })
        .catch(error => {
            console.error('Error loading models:', error);
        });
}

function switchModel() {
    const selectedModel = document.getElementById('modelSelect').value;
    
    fetch('/api/set_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: selectedModel })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update model info display
            loadModels();
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
            toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
            toast.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>${data.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(toast);
            
            // Auto-remove toast after 3 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        } else {
            alert('Error switching model: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error switching model:', error);
        alert('Failed to switch model. Please try again.');
    });
}

function runTests() {
    const testCases = $('#testCases').val().trim();
    if (!testCases) {
        alert('Please enter test cases');
        return;
    }
    
    // Parse test cases (support "question|expected_answer" format)
    const cases = testCases.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const parts = line.split('|');
            return {
                input: parts[0].trim(),
                expected_output: parts.length > 1 ? parts[1].trim() : null
            };
        });
    
    if (cases.length === 0) {
        alert('No valid test cases found');
        return;
    }
    
    // Show progress modal
    const progressModal = new bootstrap.Modal(document.getElementById('testProgressModal'));
    progressModal.show();
    
    // Update progress
    updateTestProgress(0, `Preparing ${cases.length} test cases...`);
    
    // Disable form
    $('#runTestBtn').prop('disabled', true);
    
    // Run tests
    $.ajax({
        url: '/api/test',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            test_cases: cases
        }),
        timeout: 60000 // 1 minute timeout for all tests
    })
    .done(function(response) {
        progressModal.hide();
        
        if (response.success) {
            testResults = response;
            displayResults(response);
            $('#exportResultsBtn').prop('disabled', false);
        } else {
            alert('Test failed: ' + response.error);
        }
    })
    .fail(function(xhr, status, error) {
        progressModal.hide();
        
        let errorMessage = 'Test execution failed';
        if (status === 'timeout') {
            errorMessage = 'Test execution timed out';
        } else if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
        }
        
        alert('Error: ' + errorMessage);
    })
    .always(function() {
        // Re-enable form
        $('#runTestBtn').prop('disabled', false);
    });
}

function updateTestProgress(percentage, text) {
    $('#testProgress').css('width', percentage + '%');
    $('#testProgressText').text(text);
}

function displayResults(data) {
    const resultsContainer = $('#resultsContainer');
    const summary = data.summary;
    
    // Create comprehensive summary cards
    const summaryHtml = `
        <div class="row mb-4">
            <div class="col-12">
                <h6 class="text-muted mb-3">📊 Performance Overview</h6>
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-value">${summary.total_tests}</div>
                        <div class="metric-label">Total Tests</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value text-success">${summary.successful_tests}</div>
                        <div class="metric-label">Successful</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.success_rate}%</div>
                        <div class="metric-label">Success Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.avg_response_time}s</div>
                        <div class="metric-label">Avg Response Time</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value text-info">${summary.response_efficiency || 'N/A'}</div>
                        <div class="metric-label">Efficiency Rating</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-12">
                <h6 class="text-muted mb-3">🎯 Quality Metrics</h6>
                <div class="metrics-grid mb-4">
                    <div class="metric-card">
                        <div class="metric-value text-primary">${summary.avg_quality_score || 0}</div>
                        <div class="metric-label">Quality Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value text-warning">${summary.avg_confidence_score || 0}</div>
                        <div class="metric-label">Confidence Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.avg_readability_score || 0}</div>
                        <div class="metric-label">Readability Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value text-info">${summary.avg_information_density || 0}%</div>
                        <div class="metric-label">Info Density</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.model_consistency || 0}%</div>
                        <div class="metric-label">Consistency</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-12">
                <h6 class="text-muted mb-3">📝 Language Analysis</h6>
                <div class="metrics-grid mb-3">
                    <div class="metric-card">
                        <div class="metric-value">${summary.avg_lexical_diversity || 0}</div>
                        <div class="metric-label">Lexical Diversity</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.avg_words_per_sentence || 0}</div>
                        <div class="metric-label">Words/Sentence</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${summary.total_words_generated || 0}</div>
                        <div class="metric-label">Total Words</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <canvas id="successChart" width="400" height="200"></canvas>
            </div>
            <div class="col-md-6">
                <canvas id="qualityChart" width="400" height="200"></canvas>
            </div>
        </div>
    `;
    
    resultsContainer.html(summaryHtml);
    
    // Create charts
    createSuccessChart(summary);
    createQualityChart(data.results);
    
    // Show detailed results
    displayDetailedResults(data.results);
    $('#detailedResultsSection').show();
}

function createSuccessChart(summary) {
    const ctx = document.getElementById('successChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Successful', 'Failed'],
            datasets: [{
                data: [summary.successful_tests, summary.total_tests - summary.successful_tests],
                backgroundColor: ['#198754', '#dc3545'],
                borderWidth: 2,
                borderColor: '#495057'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Test Success Rate',
                    color: '#fff'
                },
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

function createQualityChart(results) {
    const ctx = document.getElementById('qualityChart').getContext('2d');
    const successfulResults = results.filter(r => r.success);
    const qualityScores = successfulResults.map(r => r.metrics.quality_score);
    const testIds = successfulResults.map(r => `Test ${r.test_id + 1}`);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: testIds,
            datasets: [{
                label: 'Quality Score',
                data: qualityScores,
                backgroundColor: '#0d6efd',
                borderColor: '#084298',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Quality Scores by Test',
                    color: '#fff'
                },
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: '#495057'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: '#495057'
                    }
                }
            }
        }
    });
}

function displayDetailedResults(results) {
    const detailedResults = $('#detailedResults');
    let html = '';
    
    results.forEach(function(result, index) {
        const statusClass = result.success ? 'success' : 'error';
        const statusIcon = result.success ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
        
        html += `
            <div class="test-result ${statusClass} p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">
                        <i class="fas ${statusIcon} me-2"></i>
                        Test ${index + 1}
                    </h6>
                    <span class="badge ${result.success ? 'bg-success' : 'bg-danger'}">
                        ${result.success ? 'PASS' : 'FAIL'}
                    </span>
                </div>
                
                <div class="mb-2">
                    <strong>Input:</strong>
                    <div class="bg-dark p-2 rounded mt-1">
                        <code class="text-light">${escapeHtml(result.input)}</code>
                    </div>
                </div>
                
                ${result.expected_output ? `
                <div class="mb-2">
                    <strong>Expected Output (Ground Truth):</strong>
                    <div class="bg-secondary p-2 rounded mt-1">
                        <small class="text-light">${escapeHtml(result.expected_output)}</small>
                    </div>
                </div>
                ` : ''}
        `;
        
        if (result.success) {
            html += `
                <div class="mb-2">
                    <strong>Output:</strong>
                    <div class="bg-dark p-2 rounded mt-1">
                        <small class="text-light">${escapeHtml(result.output)}</small>
                    </div>
                </div>
                
                <div class="row mt-2">
                    <div class="col-md-2">
                        <small class="text-muted">Response Time:</small><br>
                        <strong>${result.response_time.toFixed(2)}s</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Quality Score:</small><br>
                        <strong class="text-primary">${result.metrics.quality_score}/100</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Confidence:</small><br>
                        <strong class="text-warning">${result.metrics.confidence_score}/100</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Readability:</small><br>
                        <strong>${result.metrics.readability_score}</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Word Count:</small><br>
                        <strong>${result.metrics.word_count}</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Info Density:</small><br>
                        <strong class="text-info">${result.metrics.information_density}%</strong>
                    </div>
                </div>
                
                <div class="row mt-2">
                    <div class="col-md-3">
                        <small class="text-muted">Lexical Diversity:</small><br>
                        <strong>${result.metrics.lexical_diversity}</strong>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Words/Sentence:</small><br>
                        <strong>${result.metrics.words_per_sentence}</strong>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Sentences:</small><br>
                        <strong>${result.metrics.sentence_count}</strong>
                    </div>
                    <div class="col-md-3">
                        <small class="text-muted">Avg Word Length:</small><br>
                        <strong>${result.metrics.avg_word_length} chars</strong>
                    </div>
                </div>
            `;
        } else {
            // Handle failed test cases
            if (result.error) {
                // API or system error
                html += `
                    <div class="mb-2">
                        <strong>Error:</strong>
                        <div class="alert alert-danger mt-1">
                            ${escapeHtml(result.error)}
                        </div>
                    </div>
                `;
            } else {
                // Evaluation failure (failed ground truth comparison)
                html += `
                    <div class="mb-2">
                        <strong>Response:</strong>
                        <div class="bg-dark p-2 rounded mt-1">
                            <small class="text-light">${escapeHtml(result.output)}</small>
                        </div>
                    </div>
                `;
                
                if (result.failure_reason) {
                    html += `
                        <div class="mb-2">
                            <strong>Failure Reason:</strong>
                            <div class="alert alert-warning mt-1">
                                ${escapeHtml(result.failure_reason)}
                            </div>
                            <div class="small text-muted mt-2">
                                <strong>Ground Truth Evaluation Details:</strong><br>
                                • <strong>Method:</strong> Keyword overlap comparison<br>
                                • <strong>Threshold:</strong> 70% word match required for pass<br>
                                • <strong>How it works:</strong> Splits both expected answer and AI response into individual words, 
                                then calculates percentage of expected words found in the response<br>
                                • <strong>Why it failed:</strong> The AI response contained too few words that match the expected answer
                            </div>
                        </div>
                    `;
                }
                
                if (result.metrics && result.metrics.truth_overlap_percent !== undefined) {
                    html += `
                        <div class="mb-2">
                            <strong>Ground Truth Match:</strong>
                            <div class="progress mt-1">
                                <div class="progress-bar bg-warning" role="progressbar" 
                                     style="width: ${result.metrics.truth_overlap_percent}%">
                                    ${result.metrics.truth_overlap_percent}%
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
            
            html += `
                <div class="mt-2">
                    <small class="text-muted">Response Time:</small>
                    <strong>${result.response_time.toFixed(2)}s</strong>
                </div>
            `;
        }
        
        html += '</div>';
    });
    
    detailedResults.html(html);
}

function exportResults() {
    if (!testResults) {
        alert('No test results to export');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mistral_ai_test_results_${timestamp}.json`;
    
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

let testCasesList = [];

function addTestCase() {
    const question = $('#questionInput').val().trim();
    const expected = $('#expectedInput').val().trim();
    
    if (!question) {
        alert('Please enter a question');
        return;
    }
    
    const testCase = {
        id: Date.now(),
        question: question,
        expected: expected || null
    };
    
    testCasesList.push(testCase);
    updateTestCasesDisplay();
    updateTestCasesTextarea();
    
    // Clear inputs
    $('#questionInput').val('');
    $('#expectedInput').val('');
}

function removeTestCase(id) {
    testCasesList = testCasesList.filter(tc => tc.id !== id);
    updateTestCasesDisplay();
    updateTestCasesTextarea();
}

function clearAllTestCases() {
    if (testCasesList.length === 0) return;
    
    if (confirm('Are you sure you want to clear all test cases?')) {
        testCasesList = [];
        updateTestCasesDisplay();
        updateTestCasesTextarea();
    }
}

function updateTestCasesDisplay() {
    const container = $('#testCasesList');
    
    if (testCasesList.length === 0) {
        container.html(`
            <div class="text-muted text-center py-4">
                <i class="fas fa-clipboard-list fa-2x mb-2"></i>
                <p>No test cases added yet. Use the form above to add questions.</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    testCasesList.forEach((testCase, index) => {
        const hasExpected = testCase.expected && testCase.expected.length > 0;
        html += `
            <div class="test-case-item border rounded p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="mb-2">
                            <strong>Q${index + 1}:</strong> 
                            <span id="question-${testCase.id}">${escapeHtml(testCase.question)}</span>
                        </div>
                        ${hasExpected ? `
                            <div class="text-muted small mb-2">
                                <strong>Expected:</strong> 
                                <span id="expected-${testCase.id}">${escapeHtml(testCase.expected)}</span>
                                <span class="badge bg-success ms-2">Ground Truth Evaluation</span>
                            </div>
                            <div class="small text-info">
                                <i class="fas fa-info-circle me-1"></i>
                                <strong>Evaluation Method:</strong> Compares AI response keywords with expected answer. 
                                Requires 70%+ word overlap to pass.
                            </div>
                        ` : `
                            <div class="text-muted small mb-2">
                                <span class="badge bg-secondary">Heuristic Evaluation</span>
                            </div>
                            <div class="small text-info">
                                <i class="fas fa-info-circle me-1"></i>
                                <strong>Evaluation Method:</strong> Uses quality indicators like response length, 
                                coherence, and confidence markers to score the answer.
                            </div>
                        `}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary" onclick="editTestCase(${testCase.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="removeTestCase(${testCase.id})" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
}

function updateTestCasesTextarea() {
    const textareaValue = testCasesList.map(tc => {
        if (tc.expected) {
            return `${tc.question}|${tc.expected}`;
        }
        return tc.question;
    }).join('\n');
    
    $('#testCases').val(textareaValue);
}

function addSampleTestCases() {
    if (testCasesList.length > 0) return; // Don't add samples if there are already test cases
    
    const samples = [
        { question: "What is artificial intelligence?", expected: null },
        { 
            question: "How does machine learning work?", 
            expected: "Machine learning is a method where computers learn patterns from data to make predictions or decisions without being explicitly programmed for each task."
        },
        { question: "Explain quantum computing in simple terms.", expected: null },
        { 
            question: "What are the benefits of renewable energy?", 
            expected: "Benefits include reduced greenhouse gas emissions, improved energy security, job creation, and long-term cost savings."
        }
    ];
    
    samples.forEach(sample => {
        testCasesList.push({
            id: Date.now() + Math.random(),
            question: sample.question,
            expected: sample.expected
        });
    });
    
    updateTestCasesDisplay();
    updateTestCasesTextarea();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Edit test case functionality
function editTestCase(id) {
    const testCase = testCasesList.find(tc => tc.id === id);
    if (!testCase) return;
    
    // Fill the form with existing data
    $('#questionInput').val(testCase.question);
    $('#expectedInput').val(testCase.expected || '');
    
    // Remove the test case from list
    removeTestCase(id);
    
    // Scroll to form
    $('#questionInput').focus();
}

// CSV Upload functionality
function toggleCsvUpload() {
    $('#csvUploadSection').collapse('toggle');
}

function downloadCsvTemplate() {
    const csvContent = "question,expected\n" +
                      "What is artificial intelligence?,AI is the simulation of human intelligence in machines\n" +
                      "How does machine learning work?,\n" +
                      "Explain quantum computing,Quantum computing uses quantum bits that can exist in multiple states simultaneously";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test_cases_template.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function processCsvFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a CSV file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            
            // Validate headers
            const questionCol = headers.indexOf('question');
            const expectedCol = headers.indexOf('expected');
            
            if (questionCol === -1) {
                alert('CSV must have a "question" column');
                return;
            }
            
            let importedCount = 0;
            
            // Process each line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                const question = columns[questionCol];
                
                if (question) {
                    const expected = expectedCol !== -1 ? columns[expectedCol] : '';
                    
                    testCasesList.push({
                        id: Date.now() + Math.random(),
                        question: question,
                        expected: expected || null
                    });
                    importedCount++;
                }
            }
            
            if (importedCount > 0) {
                updateTestCasesDisplay();
                updateTestCasesTextarea();
                
                // Show success message
                const toast = document.createElement('div');
                toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
                toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
                toast.innerHTML = `
                    <i class="fas fa-check-circle me-2"></i>Successfully imported ${importedCount} test cases
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 3000);
                
                // Close upload section
                $('#csvUploadSection').collapse('hide');
                fileInput.value = '';
            } else {
                alert('No valid test cases found in CSV file');
            }
            
        } catch (error) {
            alert('Error processing CSV file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}
