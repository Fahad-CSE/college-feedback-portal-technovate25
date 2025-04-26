// Simple in-browser database using localStorage
class DB {
    constructor() {
        // Initialize database structure if it doesn't exist
        if (!localStorage.getItem('db_initialized')) {
            this.initializeDB();
        }
    }

    // Initialize database with default structure and sample data
    initializeDB() {
        const initialData = {
            users: [
                {
                    id: 'admin1',
                    name: 'Admin User',
                    email: 'admin@college.edu',
                    password: 'admin123', // In a real app, this would be hashed
                    role: 'admin',
                    badges: ['admin', 'contributor', 'problem_solver'],
                    createdAt: new Date().toISOString()
                }
            ],
            suggestions: [],
            complaints: [],
            comments: [],
            votes: [],
            badges: {
                admin: {
                    name: 'Admin',
                    description: 'College administrator',
                    icon: 'fa-user-shield',
                    color: '#4285f4'
                },
                contributor: {
                    name: 'Contributor',
                    description: 'Contributed 5+ suggestions',
                    icon: 'fa-lightbulb',
                    color: '#fbbc05'
                },
                problem_solver: {
                    name: 'Problem Solver',
                    description: 'Helped resolve issues',
                    icon: 'fa-wrench',
                    color: '#34a853'
                },
                first_suggestion: {
                    name: 'Idea Starter',
                    description: 'Submitted first suggestion',
                    icon: 'fa-star',
                    color: '#ea4335'
                },
                first_complaint: {
                    name: 'Issue Reporter',
                    description: 'Submitted first complaint',
                    icon: 'fa-flag',
                    color: '#ea4335'
                },
                top_voted: {
                    name: 'Community Favorite',
                    description: 'Received 10+ votes on feedback',
                    icon: 'fa-trophy',
                    color: '#ffd700'
                }
            }
        };

        // Store initial data
        for (const key in initialData) {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        }

        localStorage.setItem('db_initialized', 'true');
    }

    // User methods
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: 'user_' + Date.now(),
            ...userData,
            badges: [],
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    }

    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    // Badge methods
    getBadges() {
        return JSON.parse(localStorage.getItem('badges')) || {};
    }

    getBadgeDetails(badgeId) {
        const badges = this.getBadges();
        return badges[badgeId];
    }

    addBadgeToUser(userId, badgeId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            if (!users[userIndex].badges) {
                users[userIndex].badges = [];
            }
            
            if (!users[userIndex].badges.includes(badgeId)) {
                users[userIndex].badges.push(badgeId);
                localStorage.setItem('users', JSON.stringify(users));
                return true;
            }
        }
        return false;
    }

    // Feedback methods (suggestions and complaints)
    getSuggestions() {
        return JSON.parse(localStorage.getItem('suggestions')) || [];
    }

    getComplaints() {
        return JSON.parse(localStorage.getItem('complaints')) || [];
    }

    getAllFeedback() {
        const suggestions = this.getSuggestions().map(item => ({...item, type: 'suggestion'}));
        const complaints = this.getComplaints().map(item => ({...item, type: 'complaint'}));
        return [...suggestions, ...complaints];
    }

    getFeedbackById(id, type) {
        if (type === 'suggestion') {
            return this.getSuggestions().find(item => item.id === id);
        } else if (type === 'complaint') {
            return this.getComplaints().find(item => item.id === id);
        }
        return null;
    }

    createSuggestion(data) {
        const suggestions = this.getSuggestions();
        const newSuggestion = {
            id: 'sug_' + Date.now(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        suggestions.push(newSuggestion);
        localStorage.setItem('suggestions', JSON.stringify(suggestions));
        
        // Check if user should get a badge
        if (data.userId) {
            const userSuggestions = suggestions.filter(s => s.userId === data.userId);
            if (userSuggestions.length === 1) {
                this.addBadgeToUser(data.userId, 'first_suggestion');
            } else if (userSuggestions.length >= 5) {
                this.addBadgeToUser(data.userId, 'contributor');
            }
        }
        
        return newSuggestion;
    }

    createComplaint(data) {
        const complaints = this.getComplaints();
        const newComplaint = {
            id: 'comp_' + Date.now(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        complaints.push(newComplaint);
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        // Check if user should get a badge
        if (data.userId) {
            const userComplaints = complaints.filter(c => c.userId === data.userId);
            if (userComplaints.length === 1) {
                this.addBadgeToUser(data.userId, 'first_complaint');
            }
        }
        
        return newComplaint;
    }

    updateFeedback(id, type, updates) {
        if (type === 'suggestion') {
            const suggestions = this.getSuggestions();
            const index = suggestions.findIndex(item => item.id === id);
            if (index !== -1) {
                suggestions[index] = { 
                    ...suggestions[index], 
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('suggestions', JSON.stringify(suggestions));
                return suggestions[index];
            }
        } else if (type === 'complaint') {
            const complaints = this.getComplaints();
            const index = complaints.findIndex(item => item.id === id);
            if (index !== -1) {
                complaints[index] = { 
                    ...complaints[index], 
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('complaints', JSON.stringify(complaints));
                return complaints[index];
            }
        }
        return null;
    }

    // Vote methods
    getVotes() {
        return JSON.parse(localStorage.getItem('votes')) || [];
    }

    getVotesByFeedback(feedbackId) {
        return this.getVotes().filter(vote => vote.feedbackId === feedbackId);
    }

    getVoteByUserAndFeedback(userId, feedbackId) {
        return this.getVotes().find(vote => vote.userId === userId && vote.feedbackId === feedbackId);
    }

    createVote(userId, feedbackId, feedbackType) {
        const votes = this.getVotes();
        const existingVote = this.getVoteByUserAndFeedback(userId, feedbackId);
        
        if (existingVote) {
            // Remove vote if it already exists (toggle)
            const newVotes = votes.filter(vote => !(vote.userId === userId && vote.feedbackId === feedbackId));
            localStorage.setItem('votes', JSON.stringify(newVotes));
            return null;
        } else {
            // Add new vote
            const newVote = {
                id: 'vote_' + Date.now(),
                userId,
                feedbackId,
                feedbackType,
                createdAt: new Date().toISOString()
            };
            votes.push(newVote);
            localStorage.setItem('votes', JSON.stringify(votes));
            
            // Check if feedback should get a badge
            const feedbackVotes = this.getVotesByFeedback(feedbackId);
            if (feedbackVotes.length >= 10) {
                const feedback = this.getFeedbackById(feedbackId, feedbackType);
                if (feedback && feedback.userId) {
                    this.addBadgeToUser(feedback.userId, 'top_voted');
                }
            }
            
            return newVote;
        }
    }

    // Comment methods
    getComments() {
        return JSON.parse(localStorage.getItem('comments')) || [];
    }

    getCommentsByFeedback(feedbackId) {
        return this.getComments().filter(comment => comment.feedbackId === feedbackId);
    }

    createComment(data) {
        const comments = this.getComments();
        const newComment = {
            id: 'comment_' + Date.now(),
            ...data,
            createdAt: new Date().toISOString()
        };
        comments.push(newComment);
        localStorage.setItem('comments', JSON.stringify(comments));
        
        // If admin is responding to a complaint, check if user should get a badge
        const user = this.getUserById(data.userId);
        if (user && user.role === 'admin') {
            const feedback = this.getFeedbackById(data.feedbackId, data.feedbackType);
            if (feedback && feedback.userId) {
                // Add problem solver badge to the admin
                this.addBadgeToUser(data.userId, 'problem_solver');
            }
        }
        
        return newComment;
    }
}

// Initialize the database
const db = new DB();