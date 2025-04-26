// Global variables
let currentUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUIForLoggedInUser();
    }
    
    // Initialize theme
    initializeTheme();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadFeedbackData();
});

// Theme toggle functionality
function initializeTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggleBtn.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i><span>Light Mode</span>' : 
            '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        localStorage.setItem('darkMode', isDarkMode);
    });
    
    // Initialize theme from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show selected tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Reload data for the tab
            loadFeedbackData();
        });
    });
    
    // Login and register buttons
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'block';
    });
    
    document.getElementById('register-btn').addEventListener('click', () => {
        document.getElementById('register-modal').style.display = 'block';
    });
    
    // Switch between login and register
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'block';
    });
    
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'block';
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        updateUIForLoggedOutUser();
        showNotification('You have been logged out successfully.');
    });
    
    // Form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('suggestion-form').addEventListener('submit', handleSuggestionSubmit);
    document.getElementById('complaint-form').addEventListener('submit', handleComplaintSubmit);
    
    // Add new feedback buttons
    document.getElementById('add-suggestion-btn').addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Please login to add a suggestion.', 'warning');
            document.getElementById('login-modal').style.display = 'block';
            return;
        }
        document.getElementById('add-suggestion-modal').style.display = 'block';
    });
    
    document.getElementById('add-complaint-btn').addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Please login to add a complaint.', 'warning');
            document.getElementById('login-modal').style.display = 'block';
            return;
        }
        document.getElementById('add-complaint-modal').style.display = 'block';
    });
    
    // Close buttons for modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close notification
    document.querySelector('.close-notification').addEventListener('click', () => {
        document.getElementById('notification').style.display = 'none';
    });
    
    // Search and filter functionality
    document.getElementById('search-suggestions').addEventListener('input', () => {
        renderSuggestionsList();
    });
    
    document.getElementById('search-complaints').addEventListener('input', () => {
        renderComplaintsList();
    });
    
    document.getElementById('search-my-feedback').addEventListener('input', () => {
        renderMyFeedbackList();
    });
    
    document.getElementById('suggestion-category-filter').addEventListener('change', () => {
        renderSuggestionsList();
    });
    
    document.getElementById('complaint-category-filter').addEventListener('change', () => {
        renderComplaintsList();
    });
    
    document.getElementById('feedback-type-filter').addEventListener('change', () => {
        renderMyFeedbackList();
    });
    
    document.getElementById('suggestion-sort').addEventListener('change', () => {
        renderSuggestionsList();
    });
    
    document.getElementById('complaint-sort').addEventListener('change', () => {
        renderComplaintsList();
    });
    
    document.getElementById('top-voted-type-filter').addEventListener('change', () => {
        renderTopVotedList();
    });
    
    document.getElementById('top-voted-time-filter').addEventListener('change', () => {
        renderTopVotedList();
    });
    
    // Complaint checklist
    const complaintChecks = document.querySelectorAll('.complaint-check');
    complaintChecks.forEach(check => {
        check.addEventListener('change', () => {
            const allChecked = Array.from(complaintChecks).every(c => c.checked);
            document.getElementById('submit-complaint-btn').disabled = !allChecked;
        });
    });
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const user = db.getUserByEmail(email);
    
    if (user && user.password === password) {
        // Store user in session (excluding password)
        const { password, ...userWithoutPassword } = user;
        currentUser = userWithoutPassword;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        updateUIForLoggedInUser();
        
        // Close modal and show notification
        document.getElementById('login-modal').style.display = 'none';
        showNotification('Login successful!');
        
        // Reset form
        document.getElementById('login-form').reset();
        
        // Reload data
        loadFeedbackData();
    } else {
        showNotification('Invalid email or password.', 'error');
    }
}

// Handle register form submission
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate password match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    // Check if email already exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
        showNotification('Email already registered.', 'error');
        return;
    }
    
    // Create new user
    const newUser = db.createUser({
        name,
        email,
        password,
        role: 'student' // Default role
    });
    
    // Store user in session (excluding password)
    const { password: pwd, ...userWithoutPassword } = newUser;
    currentUser = userWithoutPassword;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    // Close modal and show notification
    document.getElementById('register-modal').style.display = 'none';
    showNotification('Registration successful!');
    
    // Reset form
    document.getElementById('register-form').reset();
    
    // Reload data
    loadFeedbackData();
}

// Handle suggestion submission
function handleSuggestionSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to add a suggestion.', 'warning');
        return;
    }
    
    const title = document.getElementById('suggestion-title').value;
    const category = document.getElementById('suggestion-category').value;
    const description = document.getElementById('suggestion-description').value;
    const anonymous = document.getElementById('suggestion-anonymous').checked;
    
    // Handle image upload
    const imageInput = document.getElementById('suggestion-image');
    let imageData = null;
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageData = event.target.result;
            
            // Create suggestion with image
            createSuggestionWithData(title, category, description, anonymous, imageData);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        // Create suggestion without image
        createSuggestionWithData(title, category, description, anonymous, null);
    }
}

// Create suggestion with all data
function createSuggestionWithData(title, category, description, anonymous, imageData) {
    const newSuggestion = db.createSuggestion({
        title,
        category,
        description,
        userId: anonymous ? null : currentUser.id,
        authorName: anonymous ? 'Anonymous' : currentUser.name,
        image: imageData
    });
    
    // Close modal and show notification
    document.getElementById('add-suggestion-modal').style.display = 'none';
    showNotification('Suggestion submitted successfully!');
    
    // Reset form
    document.getElementById('suggestion-form').reset();
    
    // Reload suggestions
    renderSuggestionsList();
    
    // Switch to suggestions tab
    document.querySelector('[data-tab="suggestions"]').click();
}

// Handle complaint submission
function handleComplaintSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to add a complaint.', 'warning');
        return;
    }
    
    const title = document.getElementById('complaint-title').value;
    const category = document.getElementById('complaint-category').value;
    const description = document.getElementById('complaint-description').value;
    const urgency = document.getElementById('complaint-urgency').value;
    const anonymous = document.getElementById('complaint-anonymous').checked;
    
    // Handle image upload
    const imageInput = document.getElementById('complaint-image');
    let imageData = null;
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageData = event.target.result;
            
            // Create complaint with image
            createComplaintWithData(title, category, description, urgency, anonymous, imageData);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        // Create complaint without image
        createComplaintWithData(title, category, description, urgency, anonymous, null);
    }
}

// Create complaint with all data
function createComplaintWithData(title, category, description, urgency, anonymous, imageData) {
    const newComplaint = db.createComplaint({
        title,
        category,
        description,
        urgency,
        userId: anonymous ? null : currentUser.id,
        authorName: anonymous ? 'Anonymous' : currentUser.name,
        image: imageData
    });
    
    // Close modal and show notification
    document.getElementById('add-complaint-modal').style.display = 'none';
    showNotification('Complaint submitted successfully!');
    
    // Reset form
    document.getElementById('complaint-form').reset();
    document.querySelectorAll('.complaint-check').forEach(check => {
        check.checked = false;
    });
    document.getElementById('submit-complaint-btn').disabled = true;
    
    // Reload complaints
    renderComplaintsList();
    
    // Switch to complaints tab
    document.querySelector('[data-tab="complaints"]').click();
}

// Load feedback data based on active tab
function loadFeedbackData() {
    const activeTab = document.querySelector('.tab-content.active');
    
    if (activeTab.id === 'suggestions-tab') {
        renderSuggestionsList();
    } else if (activeTab.id === 'complaints-tab') {
        renderComplaintsList();
    } else if (activeTab.id === 'my-feedback-tab') {
        renderMyFeedbackList();
    } else if (activeTab.id === 'top-voted-tab') {
        renderTopVotedList();
    }
    
    // Update user badges
    if (currentUser) {
        renderUserBadges();
    }
}

// Render suggestions list
function renderSuggestionsList() {
    const suggestions = db.getSuggestions();
    const searchTerm = document.getElementById('search-suggestions').value.toLowerCase();
    const categoryFilter = document.getElementById('suggestion-category-filter').value;
    const sortOption = document.getElementById('suggestion-sort').value;
    
    // Filter suggestions
    let filteredSuggestions = suggestions.filter(suggestion => {
        const matchesSearch = suggestion.title.toLowerCase().includes(searchTerm) || 
                             suggestion.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || suggestion.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Sort suggestions
    filteredSuggestions = sortFeedback(filteredSuggestions, sortOption);
    
    // Render to DOM
    const suggestionsList = document.getElementById('suggestions-list');
    
    if (filteredSuggestions.length === 0) {
        suggestionsList.innerHTML = '<div class="no-data-message">No suggestions found.</div>';
        return;
    }
    
    suggestionsList.innerHTML = '';
    
    filteredSuggestions.forEach(suggestion => {
        const suggestionCard = createFeedbackCard(suggestion, 'suggestion');
        suggestionsList.appendChild(suggestionCard);
    });
}

// Render complaints list
function renderComplaintsList() {
    const complaints = db.getComplaints();
    const searchTerm = document.getElementById('search-complaints').value.toLowerCase();
    const categoryFilter = document.getElementById('complaint-category-filter').value;
    const sortOption = document.getElementById('complaint-sort').value;
    
    // Filter complaints
    let filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.title.toLowerCase().includes(searchTerm) || 
                             complaint.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || complaint.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Sort complaints
    filteredComplaints = sortFeedback(filteredComplaints, sortOption);
    
    // Render to DOM
    const complaintsList = document.getElementById('complaints-list');
    
    if (filteredComplaints.length === 0) {
        complaintsList.innerHTML = '<div class="no-data-message">No complaints found.</div>';
        return;
    }
    
    complaintsList.innerHTML = '';
    
    filteredComplaints.forEach(complaint => {
        const complaintCard = createFeedbackCard(complaint, 'complaint');
        complaintsList.appendChild(complaintCard);
    });
}

// Continuing from where we left off...

// Render my feedback list (continued)
function renderMyFeedbackList() {
    if (!currentUser) {
        document.getElementById('my-feedback-list').innerHTML = 
            '<div class="no-data-message">Please login to see your feedback.</div>';
        return;
    }
    
    const allFeedback = db.getAllFeedback();
    const searchTerm = document.getElementById('search-my-feedback').value.toLowerCase();
    const typeFilter = document.getElementById('feedback-type-filter').value;
    
    // Filter my feedback
    const myFeedback = allFeedback.filter(feedback => {
        const isMyFeedback = feedback.userId === currentUser.id;
        const matchesSearch = feedback.title.toLowerCase().includes(searchTerm) || 
                             feedback.description.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || feedback.type === typeFilter;
        return isMyFeedback && matchesSearch && matchesType;
    });
    
    // Sort by newest first
    myFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render to DOM
    const myFeedbackList = document.getElementById('my-feedback-list');
    
    if (myFeedback.length === 0) {
        myFeedbackList.innerHTML = '<div class="no-data-message">No feedback found.</div>';
        return;
    }
    
    myFeedbackList.innerHTML = '';
    
    myFeedback.forEach(feedback => {
        const feedbackCard = createFeedbackCard(feedback, feedback.type);
        myFeedbackList.appendChild(feedbackCard);
    });
}

// Render top voted list
function renderTopVotedList() {
    const allFeedback = db.getAllFeedback();
    const typeFilter = document.getElementById('top-voted-type-filter').value;
    const timeFilter = document.getElementById('top-voted-time-filter').value;
    
    // Filter by type and time
    let filteredFeedback = allFeedback.filter(feedback => {
        const matchesType = !typeFilter || feedback.type === typeFilter;
        
        // Filter by time
        if (timeFilter !== 'all') {
            const feedbackDate = new Date(feedback.createdAt);
            const currentDate = new Date();
            
            if (timeFilter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(currentDate.getDate() - 7);
                return matchesType && feedbackDate >= oneWeekAgo;
            } else if (timeFilter === 'month') {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(currentDate.getMonth() - 1);
                return matchesType && feedbackDate >= oneMonthAgo;
            }
        }
        
        return matchesType;
    });
    
    // Get vote counts for each feedback
    filteredFeedback = filteredFeedback.map(feedback => {
        const votes = db.getVotesByFeedback(feedback.id);
        return {
            ...feedback,
            voteCount: votes.length
        };
    });
    
    // Sort by vote count (descending)
    filteredFeedback.sort((a, b) => b.voteCount - a.voteCount);
    
    // Take top 10
    filteredFeedback = filteredFeedback.slice(0, 10);
    
    // Render to DOM
    const topVotedList = document.getElementById('top-voted-list');
    
    if (filteredFeedback.length === 0) {
        topVotedList.innerHTML = '<div class="no-data-message">No feedback found.</div>';
        return;
    }
    
    topVotedList.innerHTML = '';
    
    filteredFeedback.forEach(feedback => {
        const feedbackCard = createFeedbackCard(feedback, feedback.type);
        topVotedList.appendChild(feedbackCard);
    });
}

// Create feedback card
function createFeedbackCard(feedback, type) {
    const card = document.createElement('div');
    card.className = 'feedback-card';
    card.setAttribute('data-id', feedback.id);
    card.setAttribute('data-type', type);
    
    // Calculate time since creation
    const timeSince = getTimeSince(feedback.createdAt);
    
    // Get vote count
    const votes = db.getVotesByFeedback(feedback.id);
    const voteCount = votes.length;
    
    // Check if current user has voted
    const hasVoted = currentUser && votes.some(vote => vote.userId === currentUser.id);
    
    // Create card content
    card.innerHTML = `
        <div class="feedback-header">
            <div class="feedback-title">${feedback.title}</div>
            <div class="feedback-category">${feedback.category}</div>
        </div>
        <div class="feedback-meta">
            <div class="feedback-author">
                ${feedback.userId ? `By: ${feedback.authorName}` : '<span class="anonymous">Anonymous</span>'}
                ${timeSince}
            </div>
            <div class="feedback-status status-${feedback.status}">
                <i class="fas fa-circle"></i> ${capitalizeFirstLetter(feedback.status)}
            </div>
        </div>
        <div class="feedback-content">
            ${feedback.description}
        </div>
        ${feedback.image ? `<img src="${feedback.image}" alt="Feedback image" class="feedback-image">` : ''}
        <div class="feedback-actions">
            <button class="vote-btn ${hasVoted ? 'voted' : ''}" data-id="${feedback.id}" data-type="${type}">
                <i class="fas fa-thumbs-up"></i> ${voteCount} Vote${voteCount !== 1 ? 's' : ''}
            </button>
            <div class="response-time">
                ${getResponseTimeIndicator(feedback)}
            </div>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.vote-btn').addEventListener('click', handleVote);
    
    // Add click event to view details
    card.addEventListener('click', function(e) {
        // Don't trigger if clicking on vote button
        if (!e.target.closest('.vote-btn')) {
            showFeedbackDetails(feedback.id, type);
        }
    });
    
    return card;
}

// Handle vote button click
function handleVote(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
        showNotification('Please login to vote.', 'warning');
        document.getElementById('login-modal').style.display = 'block';
        return;
    }
    
    const feedbackId = this.getAttribute('data-id');
    const feedbackType = this.getAttribute('data-type');
    
    // Toggle vote
    const vote = db.createVote(currentUser.id, feedbackId, feedbackType);
    
    // Update UI
    loadFeedbackData();
}

// Show feedback details
function showFeedbackDetails(id, type) {
    const feedback = db.getFeedbackById(id, type);
    if (!feedback) return;
    
    // Get comments
    const comments = db.getCommentsByFeedback(id);
    
    // Get vote count
    const votes = db.getVotesByFeedback(id);
    const voteCount = votes.length;
    
    // Check if current user has voted
    const hasVoted = currentUser && votes.some(vote => vote.userId === currentUser.id);
    
    // Calculate time since creation
    const timeSince = getTimeSince(feedback.createdAt);
    
    // Create detail content
    const detailContent = document.getElementById('feedback-detail-content');
    
    detailContent.innerHTML = `
        <h2>${feedback.title}</h2>
        <div class="feedback-meta">
            <div class="feedback-author">
                ${feedback.userId ? `By: ${feedback.authorName}` : '<span class="anonymous">Anonymous</span>'}
                ${timeSince}
            </div>
            <div class="feedback-category">${feedback.category}</div>
        </div>
        <div class="feedback-status-detail">
            <span class="status-label">Status:</span>
            <span class="status-${feedback.status}">
                <i class="fas fa-circle"></i> ${capitalizeFirstLetter(feedback.status)}
            </span>
            ${type === 'complaint' ? `
                <span class="urgency-label">Urgency:</span>
                <span class="urgency-${feedback.urgency}">
                    <span class="urgency-indicator urgency-${feedback.urgency}"></span>
                    ${capitalizeFirstLetter(feedback.urgency)}
                </span>
            ` : ''}
        </div>
        <div class="feedback-content-detail">
            ${feedback.description}
        </div>
        ${feedback.image ? `<img src="${feedback.image}" alt="Feedback image" class="feedback-image">` : ''}
        <div class="feedback-actions-detail">
            <button class="vote-btn ${hasVoted ? 'voted' : ''}" data-id="${feedback.id}" data-type="${type}">
                <i class="fas fa-thumbs-up"></i> ${voteCount} Vote${voteCount !== 1 ? 's' : ''}
            </button>
            <div class="response-time">
                ${getResponseTimeIndicator(feedback)}
            </div>
        </div>
        
        <div class="comments-section">
            <h3>Comments (${comments.length})</h3>
            <div class="comments-list">
                ${comments.length > 0 ? comments.map(comment => {
                    const commentUser = comment.userId ? db.getUserById(comment.userId) : null;
                    const isAdmin = commentUser && commentUser.role === 'admin';
                    const commentTimeSince = getTimeSince(comment.createdAt);
                    
                    return `
                        <div class="comment ${isAdmin ? 'admin-response' : ''}">
                            <div class="comment-header">
                                <div class="comment-author">
                                    ${comment.userId ? commentUser.name : 'Anonymous'}
                                    ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                                </div>
                                <div class="comment-time">${commentTimeSince}</div>
                            </div>
                            <div class="comment-content">${comment.content}</div>
                        </div>
                    `;
                }).join('') : '<div class="no-data-message">No comments yet.</div>'}
            </div>
            
            ${currentUser ? `
                <div class="comment-form">
                    <h4>Add a Comment</h4>
                    <form id="comment-form">
                        <input type="hidden" id="comment-feedback-id" value="${feedback.id}">
                        <input type="hidden" id="comment-feedback-type" value="${type}">
                        <div class="form-group">
                            <textarea id="comment-content" rows="3" placeholder="Write your comment here..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="comment-anonymous">
                                Comment Anonymously
                            </label>
                        </div>
                        <button type="submit" class="primary-btn">Submit Comment</button>
                    </form>
                </div>
            ` : '<div class="login-prompt">Please <a href="#" id="login-to-comment">login</a> to comment.</div>'}
        </div>
    `;
    
    // Add event listeners
    detailContent.querySelector('.vote-btn').addEventListener('click', handleVote);
    
    if (currentUser) {
        detailContent.querySelector('#comment-form').addEventListener('submit', handleCommentSubmit);
    } else if (detailContent.querySelector('#login-to-comment')) {
        detailContent.querySelector('#login-to-comment').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('feedback-detail-modal').style.display = 'none';
            document.getElementById('login-modal').style.display = 'block';
        });
    }
    
    // Show modal
    document.getElementById('feedback-detail-modal').style.display = 'block';
}

// Handle comment submission
function handleCommentSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to comment.', 'warning');
        return;
    }
    
    const feedbackId = document.getElementById('comment-feedback-id').value;
    const feedbackType = document.getElementById('comment-feedback-type').value;
    const content = document.getElementById('comment-content').value;
    const anonymous = document.getElementById('comment-anonymous').checked;
    
    // Create comment
    db.createComment({
        feedbackId,
        feedbackType,
        userId: anonymous ? null : currentUser.id,
        authorName: anonymous ? 'Anonymous' : currentUser.name,
        content
    });
    
    // Show notification
    showNotification('Comment added successfully!');
    
    // Refresh feedback details
    showFeedbackDetails(feedbackId, feedbackType);
}

// Get response time indicator
function getResponseTimeIndicator(feedback) {
    // Calculate expected response time based on type and urgency
    let expectedDays = feedback.type === 'complaint' ? 3 : 7;
    
    if (feedback.type === 'complaint' && feedback.urgency === 'high') {
        expectedDays = 1;
    } else if (feedback.type === 'complaint' && feedback.urgency === 'medium') {
        expectedDays = 2;
    }
    
    // Calculate days since creation
    const createdDate = new Date(feedback.createdAt);
    const currentDate = new Date();
    const daysSinceCreation = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
    
    // Calculate progress percentage
    const progressPercentage = Math.min((daysSinceCreation / expectedDays) * 100, 100);
    
    // Determine response time class
    let responseTimeClass = 'response-time-fast';
    if (progressPercentage > 75) {
        responseTimeClass = 'response-time-slow';
    } else if (progressPercentage > 50) {
        responseTimeClass = 'response-time-medium';
    }
    
    // If already resolved, show resolved message
    if (feedback.status === 'resolved') {
        return `<span class="response-time-fast">Resolved</span>`;
    }
    
    // If rejected, show rejected message
    if (feedback.status === 'rejected') {
        return `<span class="response-time-slow">Rejected</span>`;
    }
    
    // If in progress, show in progress message
    if (feedback.status === 'in-progress') {
        return `<span class="response-time-medium">In Progress</span>`;
    }
    
    // Show expected response time
    return `
        <span class="${responseTimeClass}">
            <i class="fas fa-clock"></i> 
            Expected response: ${expectedDays - daysSinceCreation > 0 ? expectedDays - daysSinceCreation + ' days' : 'Overdue'}
        </span>
        <div class="progress-container">
            <div class="progress-bar progress-${responseTimeClass.split('-')[2]}" style="width: ${progressPercentage}%"></div>
        </div>
    `;
}

// Sort feedback based on option
function sortFeedback(feedbackList, sortOption) {
    switch (sortOption) {
        case 'newest':
            return feedbackList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return feedbackList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'most-voted':
            return feedbackList.sort((a, b) => {
                const aVotes = db.getVotesByFeedback(a.id).length;
                const bVotes = db.getVotesByFeedback(b.id).length;
                return bVotes - aVotes;
            });
        case 'least-voted':
            return feedbackList.sort((a, b) => {
                const aVotes = db.getVotesByFeedback(a.id).length;
                const bVotes = db.getVotesByFeedback(b.id).length;
                return aVotes - bVotes;
            });
        default:
            return feedbackList;
    }
}

// Render user badges
function renderUserBadges() {
    if (!currentUser) return;
    
    const userBadgesContainer = document.getElementById('user-badges');
    const user = db.getUserById(currentUser.id);
    
    if (!user || !user.badges || user.badges.length === 0) {
        userBadgesContainer.innerHTML = '<div class="badge-placeholder">No badges earned yet</div>';
        return;
    }
    
    userBadgesContainer.innerHTML = '';
    
    user.badges.forEach(badgeId => {
        const badgeDetails = db.getBadgeDetails(badgeId);
        if (badgeDetails) {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge';
            badgeElement.style.backgroundColor = badgeDetails.color;
            
            badgeElement.innerHTML = `
                <i class="fas ${badgeDetails.icon}"></i>
                <div class="badge-tooltip">${badgeDetails.name}: ${badgeDetails.description}</div>
            `;
            
            userBadgesContainer.appendChild(badgeElement);
        }
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('register-btn').classList.add('hidden');
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}`;
    document.querySelector('.user-profile').classList.remove('hidden');
    
    // Show admin controls if user is admin
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }
    
    // Render user badges
    renderUserBadges();
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('register-btn').classList.remove('hidden');
    document.querySelector('.user-profile').classList.add('hidden');
    
    // Hide admin controls
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    
    // Reset badges
    document.getElementById('user-badges').innerHTML = '<div class="badge-placeholder">Login to see your badges</div>';
    
    // Reset my feedback tab
    document.getElementById('my-feedback-list').innerHTML = '<div class="no-data-message">Login to see your feedback.</div>';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    notificationMessage.textContent = message;
    
    // Set notification color based on type
    if (type === 'error') {
        notification.style.borderLeft = '4px solid var(--danger-color)';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid var(--warning-color)';
    } else {
        notification.style.borderLeft = '4px solid var(--success-color)';
    }
    
    notification.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Helper function to get time since date
function getTimeSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval === 1 ? ' • 1 year ago' : ` • ${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval === 1 ? ' • 1 month ago' : ` • ${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval === 1 ? ' • 1 day ago' : ` • ${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval === 1 ? ' • 1 hour ago' : ` • ${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval === 1 ? ' • 1 minute ago' : ` • ${interval} minutes ago`;
    }
    
    return ' • Just now';
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}