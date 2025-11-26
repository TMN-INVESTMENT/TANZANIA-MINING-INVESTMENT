// Replace your current Database class with this enhanced version
class Database {
    constructor() {
        console.log('🔄 Database constructor called');
        this.initDatabase();
        this.currentUser = null;
        this.formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-TZ', {
                style: 'currency',
                currency: 'TZS'
            }).format(amount);
        };
        this.formatNumber = (number) => {
            return new Intl.NumberFormat('en-TZ').format(number);
        };
    }

    initDatabase() {
        console.log('🔄 initDatabase() called');
        
        try {
            let users = JSON.parse(localStorage.getItem('mining_users') || '[]');
            console.log('📊 Current users in localStorage:', users.length);
            
            // Check if we need to initialize the database
            if (users.length === 0) {
                console.log('🚀 Initializing new database...');
                
                // Create initial users with kingharuni420 as SUPER ADMIN
                users = [
                    {
                        id: 1,
                        username: 'kingharuni',
                        email: 'kingharuni420@gmail.com',
                        password: 'Rehema@mam',
                        admin_password: 'Rehema@mam',
                        referral_code: 'KING001',
                        referred_by: null,
                        join_date: new Date().toISOString(),
                        status: 'active',
                        is_admin: true,
                        is_super_admin: true,
                        admin_role: 'super_admin',
                        permissions: ['all'],
                        balance: 10000000,
                        investments: [],
                        referrals: [],
                        transactions: [],
                        has_received_referral_bonus: false
                    },
                    {
                        id: 2,
                        username: 'halunihillison',
                        email: 'mining.investment.tanzania@proton.me',
                        password: 'user123',
                        admin_password: 'Kalinga@25',
                        referral_code: 'HALUNI002',
                        referred_by: null,
                        join_date: new Date().toISOString(),
                        status: 'active',
                        is_admin: true,
                        is_super_admin: false,
                        admin_role: 'admin',
                        permissions: ['user_management', 'transaction_approval', 'chat_support'],
                        balance: 5000000,
                        investments: [],
                        referrals: [],
                        transactions: [],
                        has_received_referral_bonus: false
                    },
                    {
                        id: 3,
                        username: 'mininginvestment',
                        email: 'mining.investment.tanzania@proton.me',
                        password: 'user123',
                        admin_password: 'Kalinga@25',
                        referral_code: 'MINING003',
                        referred_by: null,
                        join_date: new Date().toISOString(),
                        status: 'active',
                        is_admin: true,
                        is_super_admin: false,
                        admin_role: 'admin',
                        permissions: ['user_management', 'transaction_approval', 'reports'],
                        balance: 5000000,
                        investments: [],
                        referrals: [],
                        transactions: [],
                        has_received_referral_bonus: false
                    }
                ];
                
                localStorage.setItem('mining_users', JSON.stringify(users));
                localStorage.setItem('mining_next_id', '4');
                console.log('✅ Database initialized with', users.length, 'users');
            } else {
                console.log('📁 Existing database found with', users.length, 'users');
                
                // Check if kingharuni420 exists in existing database, if not add it
                const kingHaruniExists = users.some(user => user.email === 'kingharuni420@gmail.com');
                if (!kingHaruniExists) {
                    console.log('👑 Adding super admin user...');
                    const superAdmin = {
                        id: users.length + 1,
                        username: 'kingharuni',
                        email: 'kingharuni420@gmail.com',
                        password: 'Rehema@mam',
                        admin_password: 'Rehema@mam',
                        referral_code: 'KING001',
                        referred_by: null,
                        join_date: new Date().toISOString(),
                        status: 'active',
                        is_admin: true,
                        is_super_admin: true,
                        admin_role: 'super_admin',
                        permissions: ['all'],
                        balance: 10000000,
                        investments: [],
                        referrals: [],
                        transactions: [],
                        has_received_referral_bonus: false
                    };
                    users.push(superAdmin);
                    localStorage.setItem('mining_users', JSON.stringify(users));
                    localStorage.setItem('mining_next_id', (users.length + 1).toString());
                    console.log('✅ Super admin added');
                }
            }
            
            console.log('🎯 Final user count:', users.length);
            
        } catch (error) {
            console.error('❌ Database initialization error:', error);
        }
    }

    getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem('mining_users') || '[]');
            console.log('📊 getUsers() returned:', users.length, 'users');
            return users;
        } catch (error) {
            console.error('❌ getUsers() error:', error);
            return [];
        }
    }

    saveUsers(users) {
        console.log('💾 Saving users:', users.length);
        try {
            localStorage.setItem('mining_users', JSON.stringify(users));
            console.log('✅ Users saved successfully');
        } catch (error) {
            console.error('❌ saveUsers() error:', error);
        }
    }

    createUser(userData) {
        console.log('👤 Creating new user:', userData);
        const users = this.getUsers();
        const newUser = {
            id: this.getNextId(),
            ...userData,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: false,
            balance: 0,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false
        };
        users.push(newUser);
        this.saveUsers(users);
        
        console.log('✅ User created successfully:', newUser);
        console.log('📈 Total users now:', users.length);
        
        return newUser;
    }

            getTotalUsers() {
                return this.getUsers().length;
            }

            getTodaySignups() {
                const users = this.getUsers();
                const today = new Date().toDateString();
                return users.filter(user => {
                    const userDate = new Date(user.join_date).toDateString();
                    return userDate === today;
                }).length;
            }  

            // Transaction methods
            createTransaction(userId, type, amount, method, details = {}) {
                const users = this.getUsers();
                const user = users.find(u => u.id === userId);
                
                if (!user) return null;
                
                const transaction = {
                    id: this.getNextTransactionId(),
                    userId: userId,
                    username: user.username,
                    type: type, // 'deposit' or 'withdrawal'
                    amount: amount,
                    method: method,
                    status: 'pending', // 'pending', 'approved', 'rejected'
                    date: new Date().toISOString(),
                    details: details,
                    adminActionDate: null,
                    adminId: null
                };
                
                // Initialize transactions array if it doesn't exist
                if (!user.transactions) {
                    user.transactions = [];
                }
                
                user.transactions.push(transaction);
                this.saveUsers(users);
                
                return transaction;
            }
            
            // Get next transaction ID
            getNextTransactionId() {
                let nextId = localStorage.getItem('mining_next_transaction_id');
                if (!nextId) {
                    nextId = 1;
                } else {
                    nextId = parseInt(nextId) + 1;
                }
                localStorage.setItem('mining_next_transaction_id', nextId.toString());
                return nextId;
            }
            
            // Get all pending transactions (for admin)
            getPendingTransactions() {
                const users = this.getUsers();
                const pendingTransactions = [];
                
                users.forEach(user => {
                    if (user.transactions) {
                        user.transactions.forEach(transaction => {
                            if (transaction.status === 'pending') {
                                pendingTransactions.push({
                                    ...transaction,
                                    username: user.username,
                                    email: user.email
                                });
                            }
                        });
                    }
                });
                
                return pendingTransactions;
            }
            
            // Get all transactions (for admin)
            getAllTransactions() {
                const users = this.getUsers();
                const allTransactions = [];
                
                users.forEach(user => {
                    if (user.transactions) {
                        user.transactions.forEach(transaction => {
                            allTransactions.push({
                                ...transaction,
                                username: user.username,
                                email: user.email
                            });
                        });
                    }
                });
                
                // Sort by date (newest first)
                return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            
            // Update transaction status (admin approval/rejection)
            updateTransactionStatus(transactionId, status, adminId) {
                const users = this.getUsers();
                
                for (let user of users) {
                    if (user.transactions) {
                        const transaction = user.transactions.find(t => t.id === transactionId);
                        if (transaction) {
                            const oldStatus = transaction.status;
                            transaction.status = status;
                            transaction.adminActionDate = new Date().toISOString();
                            transaction.adminId = adminId;
                            
                            // Update user balance based on transaction type and status
                            if (transaction.type === 'deposit' && status === 'approved') {
                                user.balance += transaction.amount;
                            } else if (transaction.type === 'withdrawal') {
                                if (status === 'approved' && oldStatus === 'pending') {
                                    // Amount was already deducted when withdrawal was requested
                                    // No further action needed
                                } else if (status === 'rejected' && oldStatus === 'pending') {
                                    // Add back the deducted amount
                                    user.balance += transaction.amount;
                                }
                            }
                            
                            this.saveUsers(users);
                            return true;
                        }
                    }
                }
                
                return false;
            }
            
            // Get user transactions
            getUserTransactions(userId) {
                const users = this.getUsers();
                const user = users.find(u => u.id === userId);
                
                if (!user || !user.transactions) {
                    return [];
                }
                
                // Sort by date (newest first)
                return user.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            
            // Process withdrawal request (deduct amount immediately)
            processWithdrawalRequest(userId, amount) {
                const users = this.getUsers();
                const user = users.find(u => u.id === userId);
                
                if (!user) return false;
                
                if (user.balance < amount) {
                    return false; // Insufficient balance
                }
                
                user.balance -= amount;
                this.saveUsers(users);
                return true;
            }
            
            // Check if user has withdrawn today
            hasWithdrawnToday(userId) {
                const user = this.getUsers().find(u => u.id === userId);
                if (!user || !user.transactions) return false;
                
                const today = new Date().toDateString();
                return user.transactions.some(t => {
                    if (t.type === 'withdrawal' && t.status === 'approved') {
                        const transactionDate = new Date(t.date).toDateString();
                        return transactionDate === today;
                    }
                    return false;
                });
            }
            
            // Check if withdrawal is allowed at current time
            isWithdrawalAllowed() {
                const now = new Date();
                const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                const hour = now.getHours();
                
                // Monday to Friday: all hours allowed
                if (day >= 1 && day <= 5) {
                    return true;
                }
                // Saturday and Sunday: 14:00 to 23:00
                else if (day === 0 || day === 6) {
                    return hour >= 14 && hour < 23;
                }
                
                return false;
            }
            
            // Get total deposits
            getTotalDeposits() {
                const users = this.getUsers();
                let total = 0;
                
                users.forEach(user => {
                    if (user.transactions) {
                        user.transactions.forEach(transaction => {
                            if (transaction.type === 'deposit' && transaction.status === 'approved') {
                                total += transaction.amount;
                            }
                        });
                    }
                });
                
                return total;
            }
            
            // Get total withdrawals
            getTotalWithdrawals() {
                const users = this.getUsers();
                let total = 0;
                
                users.forEach(user => {
                    if (user.transactions) {
                        user.transactions.forEach(transaction => {
                            if (transaction.type === 'withdrawal' && transaction.status === 'approved') {
                                total += transaction.amount;
                            }
                        });
                    }
                });
                
                return total;
            }
        }
                  
        // Initialize database
        const db = new Database();

// Chat Manager yenye utendaji wote
class ChatManager {
    constructor() {
        this.maxMessages = 500;
        this.maxMessageLength = 1000;
        this.messages = this.loadMessages();
        this.init();
    }
    
    init() {
        // Initialize chat functionality
        this.setupEventListeners();
        this.updateStorageInfo();
        this.displayMessages();
    }
    
    setupEventListeners() {
        // Setup chat input event listeners
        const chatInput = document.querySelector('.chat-input');
        const sendButton = document.querySelector('.send-btn');
        
        if (chatInput && sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }
    
    sendMessage() {
        const chatInput = document.querySelector('.chat-input');
        const messageText = chatInput.value.trim();
        
        if (!messageText) return;
        
        // Check message length
        if (messageText.length > this.maxMessageLength) {
            showNotification(`Message too long. Maximum ${this.maxMessageLength} characters allowed.`, 'error');
            return;
        }
        
        const message = {
            id: Date.now(),
            text: messageText,
            userId: 'current-user',
            timestamp: new Date().toISOString(),
            type: 'user'
        };
        
        this.addMessage(message);
        chatInput.value = '';
        
        // Simulate reply (optional)
        setTimeout(() => {
            this.addBotReply();
        }, 1000);
    }
    
    addBotReply() {
        const replies = [
            "Thank you for your message! How can I help you?",
            "I understand your concern. Let me assist you with that.",
            "That's a great question! Let me find the best solution for you.",
            "I appreciate your feedback. Our team will review it."
        ];
        
        const reply = {
            id: Date.now(),
            text: replies[Math.floor(Math.random() * replies.length)],
            userId: 'support-bot',
            timestamp: new Date().toISOString(),
            type: 'support'
        };
        
        this.addMessage(reply);
    }
    
    addMessage(message) {
        this.messages.push(message);
        
        // Auto-clean kama messages zimezidi
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
            showNotification('Old messages were automatically cleared to save space.', 'info');
        }
        
        this.saveMessages();
        this.displayMessages();
        this.updateStorageInfo();
    }
    
    displayMessages() {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = this.messages.map(msg => `
            <div class="message ${msg.type === 'user' ? 'user-message' : 'support-message'}">
                <div class="message-content">${this.escapeHtml(msg.text)}</div>
                <div class="message-time">${this.formatTime(msg.timestamp)}</div>
            </div>
        `).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    loadMessages() {
        try {
            const saved = localStorage.getItem('chat_messages');
            return saved ? JSON.parse(saved).slice(-this.maxMessages) : [];
        } catch (error) {
            
            return [];
        }
    }
    
    saveMessages() {
        try {
            localStorage.setItem('chat_messages', 
                JSON.stringify(this.messages.slice(-this.maxMessages))
            );
        } catch (error) {
            
            showNotification('Error saving chat history. Storage might be full.', 'error');
        }
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.messages = [];
            this.saveMessages();
            this.displayMessages();
            this.updateStorageInfo();
            showNotification('Chat history cleared successfully!', 'success');
        }
    }
    
    updateStorageInfo() {
        const storageInfo = document.getElementById('storageInfo');
        if (!storageInfo) return;
        
        try {
            const used = JSON.stringify(localStorage).length;
            const max = 5 * 1024 * 1024; // 5MB limit
            const percent = Math.min((used / max * 100), 100).toFixed(1);
            
            storageInfo.textContent = `Storage: ${percent}% used`;
            storageInfo.className = `storage-info ${percent > 80 ? 'warning' : ''}`;
            
        } catch (error) {
            storageInfo.textContent = 'Storage: Unable to calculate';
        }
    }
}

// Initialize chat manager
let chatManager;

// Function ya kuanzisha chat
function initializeChat() {
    chatManager = new ChatManager();
}

// Function ya kufuta chat history
function clearChatHistory() {
    if (chatManager) {
        chatManager.clearHistory();
    } else {
        // Fallback kama chatManager haijaanzishwa
        localStorage.removeItem('chat_messages');
        showNotification('Chat history cleared!', 'success');
        
        // Reload messages ikiwa kuna display
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }
}

// Anza chat system wakati ukurasa unapopakiwa
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

// Chat System Class
class ChatSystem {
    constructor() {
        this.chats = JSON.parse(localStorage.getItem('mining_chats')) || {};
        this.currentUserChat = null;
        this.adminViewingUser = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.loadAdminChatList();
        this.startPolling();
        this.isInitialized = true;
    }

    // Initialize chat data for a user
    initUserChat(userId) {
        if (!this.chats[userId]) {
            this.chats[userId] = {
                userId: userId,
                username: this.getUsername(userId),
                messages: [
                    {
                        id: 1,
                        sender: 'admin',
                        content: 'Hello! Welcome to Tanzania Mining Investment support. How can we help you today?',
                        timestamp: new Date().toISOString(),
                        read: false
                    }
                ],
                unreadCount: 0,
                lastActivity: new Date().toISOString(),
                status: 'online'
            };
            this.saveChats();
        }
        return this.chats[userId];
    }

    // Get username from user ID
    getUsername(userId) {
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);
        return user ? user.username : 'Unknown User';
    }

    // Setup event listeners for chat functionality
    setupEventListeners() {
        // User chat modal events
        const userMessageInput = document.getElementById('user-message-input');
        if (userMessageInput) {
            userMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendUserMessage();
                }
            });
        }

        // Admin chat modal events
        const adminMessageInput = document.getElementById('admin-message-input');
        if (adminMessageInput) {
            adminMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAdminMessage();
                }
            });
        }

        // File upload handling
        const userFileInput = document.getElementById('user-file-input');
        if (userFileInput) {
            userFileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e, 'user');
            });
        }

        // Quick responses
        document.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const onclickAttr = e.target.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/'([^']+)'/);
                    if (match) {
                        const message = match[1];
                        this.quickQuestion(message);
                    }
                }
            });
        });
    }

    // Send message from user
    sendUserMessage() {
        const messageInput = document.getElementById('user-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message) return;

        const currentUser = db.currentUser;
        if (!currentUser) {
            alert('Please log in to send messages');
            return;
        }

        // Initialize chat if it doesn't exist
        this.initUserChat(currentUser.id);
        
        // Add message to chat
        const userChat = this.chats[currentUser.id];
        const newMessage = {
            id: userChat.messages.length + 1,
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            read: false
        };

        userChat.messages.push(newMessage);
        userChat.lastActivity = new Date().toISOString();
        userChat.unreadCount++;
        this.saveChats();

        // Clear input and update UI
        messageInput.value = '';
        this.displayUserMessages(currentUser.id);

        // Simulate admin response after a delay
        setTimeout(() => {
            this.generateAdminResponse(currentUser.id, message);
        }, 2000);
    }

    // Send message from admin
    sendAdminMessage() {
        const messageInput = document.getElementById('admin-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message || !this.adminViewingUser) return;

        const userChat = this.chats[this.adminViewingUser];
        if (!userChat) return;

        const newMessage = {
            id: userChat.messages.length + 1,
            sender: 'admin',
            content: message,
            timestamp: new Date().toISOString(),
            read: true
        };

        userChat.messages.push(newMessage);
        userChat.lastActivity = new Date().toISOString();
        userChat.unreadCount = 0; // Reset unread count when admin sends message
        this.saveChats();

        // Clear input and update UI
        messageInput.value = '';
        this.displayAdminMessages(this.adminViewingUser);
        this.loadAdminChatList();
    }

    // Generate automated admin response
    generateAdminResponse(userId, userMessage) {
        const userChat = this.chats[userId];
        if (!userChat) return;

        let response = '';
        const lowerMessage = userMessage.toLowerCase();

        // Simple response logic based on keywords
        if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
            response = 'Our investment plans offer competitive returns. You can choose from Basic (15% ROI), Premium (25% ROI), or VIP (40% ROI) plans. Minimum investment is TZS 10,000.';
        } else if (lowerMessage.includes('withdraw') || lowerMessage.includes('withdrawal')) {
            response = 'Withdrawals are processed once per week. Minimum withdrawal is TZS 10,000 with a 10% service fee. You can withdraw Monday-Friday anytime, and Saturday-Sunday from 2 PM to 11 PM.';
        } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
            response = 'To reset your password, please use the "Forgot Password" feature on the login page. An email will be sent to your registered email address with instructions.';
        } else if (lowerMessage.includes('referral') || lowerMessage.includes('bonus')) {
            response = 'Our referral program gives you 10% commission on your referrals\' first deposits. Share your unique referral code with friends to start earning!';
        } else if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
            response = 'You can check your current balance in the dashboard. Deposits are added to your balance after admin approval, which usually takes 1-2 hours during business days.';
        } else {
            response = 'Thank you for your message. Our support team will review your inquiry and respond shortly. For immediate assistance, you can also contact us at +255 624 666 402.';
        }

        const adminMessage = {
            id: userChat.messages.length + 1,
            sender: 'admin',
            content: response,
            timestamp: new Date().toISOString(),
            read: false
        };

        userChat.messages.push(adminMessage);
        userChat.lastActivity = new Date().toISOString();
        this.saveChats();

        this.displayUserMessages(userId);
        this.loadAdminChatList();
    }

    // Display messages in user chat
    displayUserMessages(userId) {
        const chatMessages = document.getElementById('user-chat-messages');
        if (!chatMessages) return;

        const userChat = this.chats[userId];
        if (!userChat) return;

        chatMessages.innerHTML = '';
        
        userChat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender === 'user' ? 'user-message' : 'support-message'}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = message.content;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatTime(message.timestamp);
            
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(messageTime);
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Display messages in admin chat
    displayAdminMessages(userId) {
        const chatMessages = document.getElementById('admin-chat-messages');
        if (!chatMessages) return;

        const userChat = this.chats[userId];
        if (!userChat) return;

        chatMessages.innerHTML = '';
        
        userChat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `admin-message ${message.sender}`;
            
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            messageBubble.textContent = message.content;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatTime(message.timestamp);
            
            messageDiv.appendChild(messageBubble);
            messageDiv.appendChild(messageTime);
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load admin chat list
    loadAdminChatList() {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        // Get all users with chats
        const users = db.getUsers();
        let totalUnread = 0;
        let totalConversations = 0;

        users.forEach(user => {
            const userChat = this.chats[user.id];
            if (userChat) {
                totalConversations++;
                const userItem = document.createElement('div');
                userItem.className = `chat-user-item ${this.adminViewingUser === user.id ? 'active' : ''}`;
                userItem.onclick = () => this.selectUserChat(user.id);

                const userInfo = document.createElement('div');
                userInfo.className = 'user-chat-info';

                const userName = document.createElement('div');
                userName.className = 'user-name';
                userName.textContent = user.username;

                const lastMessage = document.createElement('div');
                lastMessage.className = 'last-message';
                const lastMsg = userChat.messages[userChat.messages.length - 1];
                lastMessage.textContent = lastMsg ? lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : 'No messages';

                userInfo.appendChild(userName);
                userInfo.appendChild(lastMessage);

                const chatMeta = document.createElement('div');
                chatMeta.className = 'chat-meta';

                const lastSeen = document.createElement('div');
                lastSeen.className = 'last-seen';
                lastSeen.textContent = this.formatTime(userChat.lastActivity);

                chatMeta.appendChild(lastSeen);

                if (userChat.unreadCount > 0) {
                    const unreadCount = document.createElement('div');
                    unreadCount.className = 'unread-count';
                    unreadCount.textContent = userChat.unreadCount;
                    chatMeta.appendChild(unreadCount);
                    totalUnread += userChat.unreadCount;
                }

                userItem.appendChild(userInfo);
                userItem.appendChild(chatMeta);
                chatUsersList.appendChild(userItem);
            }
        });

        // Update admin chat stats
        const totalConversationsEl = document.getElementById('total-conversations');
        const unreadConversationsEl = document.getElementById('unread-conversations');
        const unreadMassageEl = document.getElementById('unread-massage');
        const activeConversationsEl = document.getElementById('active-conversations');
        
        if (totalConversationsEl) totalConversationsEl.textContent = totalConversations;
        if (unreadConversationsEl) unreadConversationsEl.textContent = totalUnread;
        if (activeConversationsEl) activeConversationsEl.textContent = this.getActiveConversationsCount();

        // Update admin chat badge
        const adminChatBadge = document.getElementById('admin-chat-badge');
        if (adminChatBadge) {
            if (totalUnread > 0) {
                adminChatBadge.textContent = totalUnread;
                adminChatBadge.style.display = 'flex';
            } else {
                adminChatBadge.style.display = 'none';
            }
        }
    }

    // Get count of active conversations (today)
    getActiveConversationsCount() {
        const today = new Date().toDateString();
        let count = 0;
        
        Object.values(this.chats).forEach(chat => {
            const chatDate = new Date(chat.lastActivity).toDateString();
            if (chatDate === today) {
                count++;
            }
        });
        
        return count;
    }

    // Select user chat in admin panel
    selectUserChat(userId) {
        this.adminViewingUser = userId;
        
        // Update UI to show selected user
        document.querySelectorAll('.chat-user-item').forEach(item => {
            item.classList.remove('active');
        });
        
        event.currentTarget.classList.add('active');

        // Show chat header
        const chatHeader = document.getElementById('admin-chat-header');
        const userChat = this.chats[userId];
        
        if (chatHeader && userChat) {
            chatHeader.innerHTML = `
                <div class="chat-title">
                    <i class="fas fa-user"></i>
                    <span>${userChat.username}</span>
                    <div class="chat-status">
                        <span class="status-indicator ${userChat.status}"></span>
                        <span>${userChat.status}</span>
                    </div>
                </div>
            `;
        }

        // Show messages and input - with null checks
        const noChatSelected = document.getElementById('no-chat-selected');
        const adminChatMessages = document.getElementById('admin-chat-messages');
        const adminChatInput = document.getElementById('admin-chat-input');
        
        if (noChatSelected) noChatSelected.style.display = 'none';
        if (adminChatMessages) adminChatMessages.style.display = 'block';
        if (adminChatInput) adminChatInput.style.display = 'block';

        // Display messages
        this.displayAdminMessages(userId);

        // Mark messages as read
        if (userChat.unreadCount > 0) {
            userChat.messages.forEach(message => {
                if (message.sender === 'user') {
                    message.read = true;
                }
            });
            userChat.unreadCount = 0;
            this.saveChats();
            this.loadAdminChatList();
        }
    }

    // Quick question from user
    quickQuestion(question) {
        const messageInput = document.getElementById('user-message-input');
        if (messageInput) {
            messageInput.value = question;
            this.sendUserMessage();
        }
    }

    // Quick response from admin
    adminQuickResponse(response) {
        const messageInput = document.getElementById('admin-message-input');
        if (messageInput) {
            messageInput.value = response;
            this.sendAdminMessage();
        }
    }

    // Handle file upload
    handleFileUpload(event, sender) {
        const files = event.target.files;
        const fileList = document.getElementById(sender === 'user' ? 'user-file-list' : 'admin-file-list');
        
        if (!fileList) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('span');
            fileName.textContent = file.name;
            
            const fileRemove = document.createElement('span');
            fileRemove.className = 'file-remove';
            fileRemove.innerHTML = '<i class="fas fa-times"></i>';
            fileRemove.onclick = () => fileItem.remove();
            
            fileItem.appendChild(fileName);
            fileItem.appendChild(fileRemove);
            fileList.appendChild(fileItem);
        }
        
        // Reset file input
        event.target.value = '';
    }

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Save chats to localStorage
    saveChats() {
        localStorage.setItem('mining_chats', JSON.stringify(this.chats));
    }

    // Start polling for updates (simulates real-time)
    startPolling() {
        setInterval(() => {
            if (db.currentUser && !db.currentUser.is_admin) {
                // Update user's own chat
                this.displayUserMessages(db.currentUser.id);
            } else if (db.currentUser && db.currentUser.is_admin) {
                // Update admin chat list
                this.loadAdminChatList();
                if (this.adminViewingUser) {
                    this.displayAdminMessages(this.adminViewingUser);
                }
            }
        }, 3000);
    }

    // Open user chat modal
    openUserChatModal() {
        if (!db.currentUser) {
            alert('Please log in to use chat');
            return;
        }
        
        // Initialize chat system if not already done
        this.init();
        
        // Initialize user chat if it doesn't exist
        this.initUserChat(db.currentUser.id);
        
        // Display messages
        this.displayUserMessages(db.currentUser.id);
        
        // Show modal
        openModal('user-chat-modal');
    }

    // Open admin chat modal
    openAdminChatModal() {
        if (!db.currentUser || !db.currentUser.is_admin) {
            alert('Admin access required');
            return;
        }
        
        // Initialize chat system if not already done
        this.init();
        
        // Load chat list
        this.loadAdminChatList();
        
        // Show modal
        openModal('admin-chat-modal');
    }
}

class ChatDatabase {
  constructor() {
    this.dbName = 'MiningChatsDB';
    this.version = 1;
    this.storeName = 'chats';
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveChats(chats) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    // Clear old data
    store.clear();
    
    // Add all chats
    chats.forEach(chat => {
      store.add(chat);
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getChats() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new ChatSystem();
    
    // Update support options to use chat system
    const chatSupportOption = document.querySelector('.support-option[onclick="openSupportOption(\'chat\')"]');
    if (chatSupportOption) {
        chatSupportOption.setAttribute('onclick', 'chatSystem.openUserChatModal()');
    }
    
    // Update admin chat button
    const adminChatButton = document.querySelector('.btn[onclick*="openChatModal"]');
    if (adminChatButton) {
        adminChatButton.setAttribute('onclick', 'chatSystem.openAdminChatModal()');    
    }
}); 
 
// Update the openSupportOption function to handle chat
function openSupportOption(option) {
    switch(option) {
        case 'whatsapp':
            window.open('https://wa.me/255624666402', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255624666402';
            break;
        case 'chat':
            if (window.chatSystem) {
                window.chatSystem.openUserChatModal();
            }
            break;
    }
}

// Make sure modal functions are available
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
                // Toggle dropdown visibility
        document.getElementById('profileBtn').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.add('active');
            document.getElementById('overlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Close dropdown when clicking close button
        document.getElementById('closeDropdown').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Close dropdown when clicking outside
        document.getElementById('overlay').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Bank instructions
        const bankInstructions = {
            vodacom: `
                <h4>Maelekezo ya Vodacom M-Pesa:</h4>
                <ol>
                    <li>Nenda kwenye M-Pesa kwenye simu yako</li>
                    <li>Chagua "Lipa kwa halopesa"</li>
                    <li>Weka lipa namba: <strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la M-Pesa</li>
                    <li>Jina la kampuni: <strong>TMN INVESTMENT</strong></li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            tigo: `
                <h4>Maelekezo ya Tigo Pesa:</h4>
                <ol>
                    <li>Nenda kwenye Tigo Pesa kwenye simu yako</li>
                    <li>Chagua lipa kwa simu</li>
                    <li>lipa kwa halopesa <strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Tigo Pesa</li>
                    <li>Jina la kampuni: <strong>TMN INVESTMENT</strong></li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            airtel: `
                <h4>Maelekezo ya Airtel Money:</h4>
                <ol>
                    <li>Nenda kwenye Airtel Money kwenye simu yako</li>
                    <li>Chagua "Lipa kwa simu"</li>
                    <li>Weka lipa namba<strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Airtel Money</li>
                    <li>Jina la kampuni: <strong>TMN INVESTMENT</strong></li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            halotel: `
                <h4>Maelekezo ya Halotel Halopesa:</h4>
                <ol>
                    <li>Nenda kwenye menu ya Halopesa <strong>*150*88#</strong></li>
                    <li>Chagua <strong>05</strong> "Lipa bidhaa"</li>
                    <li>Chagua <strong>02</strong> kwenda halopesa</li>
                    <li>Weka lipa namba: <strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Halopesa</li>
                    <li>Jina la kampuni: <strong>TMN INVESTMENT</strong></li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            crdb: `
                <h4>Maelekezo ya CRDB Bank:</h4>
                <ol>
                    <li>Nenda kwenye kituo cha CRDB Bank au tumia CRDB Mobile Banking</li>
                    <li>Chagua "Transfer Funds"</li>
                    <li>Chagua "To halopesa lipa"</li>
                    <li>Weka namba ya akaunti: <strong>23898109</strong></li>
                    <li>Weka jina la akaunti: <strong>TMN INVESTMENT</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Kamilisha muamala</li>
                </ol>
            `,
            nmb: `
                <h4>Maelekezo ya NMB Bank:</h4>
                <ol>
                    <li>Nenda kwenye kituo cha NMB Bank au tumia NMB Mobile Banking</li>
                    <li>Chagua "Transfer"</li>
                    <li>Chagua "To halopesa lipa"</li>
                    <li>Weka namba ya akaunti: <strong>23898109</strong></li>
                    <li>Weka jina la akaunti: <strong>TMN INVESTMENT</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Kamilisha muamala</li>
                </ol>
            `,
            ezy: `
                <h4>Maelekezo ya Ezy Pesa:</h4>
                <ol>
                    <li>Nenda kwenye Ezy Pesa kwenye simu yako</li>
                    <li>Chagua "Send Money to halopesa lipa"</li>
                    <li>Namba ya lipa: <strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Ezy Pesa</li>
                    <li>Jina la kampuni: <strong>TMN INVESTMENT</strong></li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `
        };

        // DOM Content Loaded Event
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize UI elements
            initLoginTabs();
            initDepositSection();
            initWithdrawalSection();
            initNavigation();
            
            // Check if user is already logged in
            if (db.currentUser) {
                if (db.currentUser.is_admin) {
                    showAdminDashboard();
                } else {
                    showUserDashboard();
                }
            }
        })

        // Login Tabs
        function initLoginTabs() {
            const loginTab = document.getElementById('login-tab');
            const signupTab = document.getElementById('signup-tab');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            
            loginTab.addEventListener('click', () => {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
                loginTab.classList.add('active');
                signupTab.classList.remove('active');
            });
            
            signupTab.addEventListener('click', () => {
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
                signupTab.classList.add('active');
                loginTab.classList.remove('active');
            });
            
            // Check for admin email when typing
            document.getElementById('login-email').addEventListener('input', function() {
                if (db.isAdminEmail(this.value)) {
                    document.getElementById('admin-password-section').style.display = 'block';
                } else {
                    document.getElementById('admin-password-section').style.display = 'none';
                }
            });
        }
        
// Update the login function to handle the super admin properly
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const adminPassword = document.getElementById('admin-password').value;
    
        // Load referrals immediately after login
        loadEnhancedReferrals();
        
        // Also set up periodic refresh if needed
        setInterval(loadEnhancedReferrals, 30000); // Refresh every 30 seconds

    const user = db.findUserByEmailOrUsername(email);
    
    if (user) {
        
        
        // Check if user is active
        if (user.status === 'inactive') {
            alert('❌ Your account has been deactivated. Please contact administrator.');
            return;
        }
        
        // Check for SUPER ADMIN first - ONLY kingharuni420@gmail.com
        if (email.toLowerCase() === 'kingharuni420@gmail.com' && password === 'Rehema@mam') {
            
            db.currentUser = {
                ...user,
                is_super_admin: true,
                is_admin: true,
                permissions: ['all'],
                admin_role: 'super_admin'
            };
            showSuperAdminDashboard();
            return;
        }
        
        if (user.password === password) {
            // Check if this is an admin login (but NOT super admin)
            if ((db.isAdminEmail(user.email) || user.is_admin) && email.toLowerCase() !== 'kingharuni420@gmail.com') {
                // Verify admin password for regular admins
                if (adminPassword === user.admin_password) {
                    db.currentUser = user;
                    showAdminDashboard();
                } else {
                    alert('❌ Invalid admin password!');
                }
            } else {
                // Regular user login
                db.currentUser = user;
                showUserDashboard();
                initializeAfterLogin();
            }
        } else {
            alert('❌ Invalid password!');
        }
    } else {
        alert('❌ User not found! Please check your email/username or contact support.');
        setTimeout(() => {
        }, 1000);                
    }
}
        
function signup() {
    console.log('🔄 signup() function called');
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const referralCode = document.getElementById('signup-referral').value;
    const password = document.getElementById('signup-password').value;
    const password2 = document.getElementById('signup-password2').value;

    console.log('📝 Signup data:', { username, email, referralCode });

    // Validate required fields
    if (!username || !email || !referralCode || !password) {
        alert('Please fill all fields');
        return;
    }

    if (password !== password2) {
        alert('Passwords do not match');
        return;
    }

    // Check if referral code exists
    const referrer = db.findUserByReferralCode(referralCode);
    console.log('🔍 Referrer found:', referrer);
    
    if (!referrer) {
        alert('Invalid referral code');
        return;
    }

    // Check if username or email already exists
    const existingUser = db.findUserByEmailOrUsername(email) || db.findUserByEmailOrUsername(username);
    console.log('🔍 Existing user check:', existingUser);
    
    if (existingUser) {
        alert('Username or email already exists');
        return;
    }

    // Generate unique referral code for new user
    let userReferralCode;
    do {
        userReferralCode = generateReferralCode();
    } while (db.findUserByReferralCode(userReferralCode));

    console.log('🎯 Generated referral code:', userReferralCode);

    // Create new user
    const newUser = db.createUser({
        username: username,
        email: email,
        password: password,
        referral_code: userReferralCode,
        referred_by: referralCode
    });

    console.log('✅ New user created:', newUser);

    // Add to referrer's referrals
    const users = db.getUsers();
    const updatedReferrer = users.find(u => u.id === referrer.id);
    if (updatedReferrer) {
        if (!updatedReferrer.referrals) updatedReferrer.referrals = [];
        updatedReferrer.referrals.push({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            join_date: newUser.join_date
        });
        db.saveUsers(users);
        console.log('✅ Added to referrer referrals');
    }

    db.currentUser = newUser;
    
    console.log('🎉 Signup completed successfully!');
    console.log('👤 Current user set to:', db.currentUser);
    
    showUserDashboard();
}

        // Generate referral code
        function generateReferralCode() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        // Copy referral code
        function copyReferralCode() {
            const referralCode = document.getElementById('user-referral-code').textContent;
            navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
        }

        function copyAdminReferralCode() {
            const referralCode = document.getElementById('admin-referral-code').textContent;
            navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
        }


// Hakuna JavaScript iliyojumuishwa - ongeza utendaji
function togglePassword(fieldId, toggleElement) {
    const field = document.getElementById(fieldId);
    if (field.type === 'password') {
        field.type = 'text';
        toggleElement.innerHTML = '<i class="far fa-eye-slash"></i> <span>Hide Password</span>';
    } else {
        field.type = 'password';
        toggleElement.innerHTML = '<i class="far fa-eye"></i> <span>Show Password</span>';
    }
}

        // Toggle password visibility
        function togglePassword(inputId, toggleElement) {
            const passwordInput = document.getElementById(inputId);
            const eyeIcon = toggleElement.querySelector('i');
            const textSpan = toggleElement.querySelector('span');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
                textSpan.textContent = 'Hide Password';
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
                textSpan.textContent = 'Show Password'; 
            }
        }

        // Switch tabs for user dashboard
        function switchTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('#user-dashboard .tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('#user-dashboard .dashboard-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(`${tabId}-section`).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }

        // Switch tabs for admin dashboard
        function switchAdminTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('#admin-dashboard .dashboard-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(`${tabId}-section`).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }



        // Load user referrals
function loadUserReferrals() {
    const referralsList = document.getElementById('user-referrals-list');
    
    if (!referralsList) {
        
        return;
    }
    
    // Check if user data is available
    if (!db || !db.currentUser) {
        referralsList.innerHTML = '<p>User data not available</p>';
        return;
    }
    
    if (!db.currentUser.referrals || db.currentUser.referrals.length === 0) {
        referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
        return;
    }
    
    let html = '';
    db.currentUser.referrals.forEach(ref => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${ref.username || 'N/A'}</div>
                    <div class="referral-date">${new Date(ref.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${ref.email || 'N/A'}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    referralsList.innerHTML = html;
}

// Call after DOM is ready
document.addEventListener('DOMContentLoaded', loadUserReferrals);

        // Load admin users
        function loadAdminUsers() {
            const usersList = document.getElementById('admin-users-list');
            const users = db.getUsers();
            
            let html = '';
            users.forEach(user => {
                html += `
                    <div class="referral-item">
                        <div class="referral-header">
                            <div class="referral-name">${user.username} ${user.is_admin ? '<span style="color: #dc3545;">(Admin)</span>' : ''}</div>
                            <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                        </div>
                        <div class="referral-details">
                            <div><strong>Email:</strong> ${user.email}</div>
                            <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                            <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                            <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                        </div>
                    </div>
                `;
            });
            
            usersList.innerHTML = html;
        }

        // Load admin referrals
        function loadAdminReferrals() {
            const referralsList = document.getElementById('admin-referrals-list');
            const referrals = db.getUsersByReferrer(db.currentUser.referral_code);
            
            if (referrals.length === 0) {
                referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
                return;
            }
            
            let html = '';
            referrals.forEach(user => {
                html += `
                    <div class="referral-item">
                        <div class="referral-header">
                            <div class="referral-name">${user.username}</div>
                            <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                        </div>
                        <div class="referral-details">
                            <div><strong>Email:</strong> ${user.email}</div>
                            <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                            <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                            <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                        </div>
                    </div>
                `;
            });
            
            referralsList.innerHTML = html;
        }

        // Load admin investments
        function loadAdminInvestments() {
            const investmentsList = document.getElementById('admin-investments-list');
            const users = db.getUsers();
            
            // Get all investments from all users
            const allInvestments = [];
            users.forEach(user => {
                if (user.investments) {
                    user.investments.forEach(inv => {
                        allInvestments.push({
                            username: user.username,
                            plan: inv.plan,
                            amount: inv.amount,
                            date: inv.date
                        });
                    });
                }
            });
            
            if (allInvestments.length === 0) {
                investmentsList.innerHTML = '<p>No investments yet.</p>';
                return;
            }
            
            // Sort by date (newest first)
            allInvestments.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let html = '';
            allInvestments.slice(0, 10).forEach(inv => { // Show only 10 most recent
                html += `
                    <div class="referral-item">
                        <div class="referral-header">
                            <div class="referral-name">${inv.username}</div>
                            <div class="referral-date">${new Date(inv.date).toLocaleDateString()}</div>
                        </div>
                        <div class="referral-details">
                            <div><strong>Plan:</strong> ${inv.plan.toUpperCase()}</div>
                            <div><strong>Amount:</strong> ${db.formatCurrency(inv.amount)}</div>
                        </div>
                    </div>
                `;
            });
            
            investmentsList.innerHTML = html;
            
            // Update investment stats
            document.getElementById('admin-active-plans').textContent = allInvestments.length;
            document.getElementById('admin-completed-plans').textContent = Math.floor(allInvestments.length * 0.3); // Simulated completed plans
        }

        // Investment function with referral bonus
        function invest(plan) {
            let minAmount = 0;
            let roi = 0;
            let duration = 0;
            let planName = '';
            
            switch(plan) {
                case 'basic':
                    minAmount = 10000;
                    roi = 15;
                    duration = 30;
                    planName = 'Basic Plan (15% ROI)';
                    break;
                case 'premium':
                    minAmount = 100000;
                    roi = 25;
                    duration = 60;
                    planName = 'Premium Plan (25% ROI)';
                    break;
                case 'vip':
                    minAmount = 500000;
                    roi = 40;
                    duration = 90;
                    planName = 'VIP Plan (40% ROI)';
                    break;
            }
            
            const amount = parseFloat(prompt(`Enter investment amount for ${planName} (Minimum: ${db.formatCurrency(minAmount)})`));
            
            if (!amount || amount < minAmount) {
                alert(`Minimum investment for this plan is ${db.formatCurrency(minAmount)}`);
                return;
            }
            
            if (amount > db.currentUser.balance) {
                alert('Insufficient balance');
                return;
            }
            
            // Create investment
            const investment = {
                id: Date.now(),
                plan: plan,
                amount: amount,
                roi: roi,
                duration: duration,
                date: new Date().toISOString(),
                status: 'active'
            };
            
            // Create transaction
            const transaction = {
                id: Date.now(),
                type: 'Investment',
                amount: amount,
                date: new Date().toISOString(),
                status: 'completed'
            };
            
            // Update user
            const users = db.getUsers();
            const userIndex = users.findIndex(u => u.id === db.currentUser.id);
            
            if (userIndex !== -1) {
                if (!users[userIndex].investments) users[userIndex].investments = [];
                users[userIndex].investments.push(investment);
                
                if (!users[userIndex].transactions) users[userIndex].transactions = [];
                users[userIndex].transactions.push(transaction);
                
                users[userIndex].balance -= amount;
                
                // Check if this is user's first deposit and add referral bonus
                if (!users[userIndex].has_received_referral_bonus && users[userIndex].referred_by) {
                    const referrer = users.find(u => u.referral_code === users[userIndex].referred_by);
                    if (referrer) {
                        // Calculate referral bonus (10% of first deposit, max 50,000 TZS)
                        let referralBonus = amount * 0.1;
                        if (referralBonus > 50000) referralBonus = 50000;
                        
                        // Add bonus to referrer's balance
                        referrer.balance += referralBonus;
                        
                        // Add transaction for referrer
                        if (!referrer.transactions) referrer.transactions = [];
                        referrer.transactions.push({
                            id: Date.now(),
                            type: 'Referral Bonus',
                            amount: referralBonus,
                            date: new Date().toISOString(),
                            status: 'completed'
                        });
                        
                        // Mark that user has received referral bonus
                        users[userIndex].has_received_referral_bonus = true;
                        
                        alert(`Referral bonus of ${db.formatCurrency(referralBonus)} added to your referrer's account!`);
                    }
                }
                
                db.saveUsers(users);
                
                // Update current user
                db.currentUser = users[userIndex];
                
                // Refresh dashboard
                if (db.currentUser.is_admin) {
                    showAdminDashboard();
                } else {
                    showUserDashboard();
                }
                
                alert(`Successfully invested ${db.formatCurrency(amount)} in ${planName}`);
            }
        }

// Update the logout function to handle super admin
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        db.currentUser = null;
        
        // Hide all dashboards
        document.getElementById('user-dashboard').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('super-admin-dashboard').style.display = 'none';
        
        // Show login container
        document.getElementById('login-container').style.display = 'flex';
        
        // Clear form fields
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password-section').style.display = 'none';
    }
}

        // Navigation
        function initNavigation() {
            // User navigation
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const target = this.getAttribute('data-target');
                    
                    // Update active tab
                    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show target section
                    document.querySelectorAll('.content-section').forEach(section => {
                        section.classList.remove('active');
                    });
                    document.getElementById(target).classList.add('active');
                    
                    // Load data if needed
                    if (target === 'history-section') {
                        loadTransactionHistory();
                    } else if (target === 'admin-history') {
                        loadAdminTransactionHistory();
                    } else if (target === 'admin-stats') {
                        loadAdminStats();
                    }
                });
            });
        }
        
        
        // Main Navigation Functionality
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to switch between sections
    function switchSection(target) {
        // Remove active class from all nav items and sections
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding section
        const activeNavItem = document.querySelector(`.nav-item[data-target="${target}"]`);
        const activeSection = document.getElementById(`${target}-section`);
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        if (activeSection) {
            activeSection.classList.add('active');
            
            // Load data for specific sections
            if (target === 'referrals') {
                loadEnhancedReferrals();
            } else if (target === 'history') {
                loadTransactionHistory();
            } else if (target === 'myinvestment') {
                loadUserInvestments();
            }
        }
    }
    
    // Add click event to all nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchSection(target);
        });
    });
});
        
        // Update the auto-detection in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initLoginTabs();
    initDepositSection();
    initWithdrawalSection();
    initNavigation();
    
    // Check if user is already logged in
    if (db.currentUser) {
        if (db.isSuperAdmin(db.currentUser)) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
    
    // Auto-detect admin email for admin password field
    document.getElementById('login-email').addEventListener('input', function() {
        const email = this.value;
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (db.isAdminEmail(email)) {
            adminPasswordSection.style.display = 'block';
            
            // If it's super admin email, show special message
            if (email === 'kingharuni420@gmail.com') {
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Super Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter super admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                        <i class="fas fa-crown"></i> Super Admin Access - Full System Control
                    </p>
                `;
            } else {
                // Regular admin
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--warning); margin-top: 10px;">
                        <i class="fas fa-user-shield"></i> Admin access requires special authorization
                    </p>
                `;
            }
        } else {
            adminPasswordSection.style.display = 'none';
        }
    });
});

        // Update the admin management functions to protect super admin
function loadAdminsList() {
    const users = db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const tbody = document.getElementById('admins-table-body');
    
    tbody.innerHTML = '';
    
    admins.forEach(admin => {
        const isSuperAdmin = admin.email === 'kingharuni420@gmail.com';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.id}</td>
            <td>
                ${admin.username}
                ${isSuperAdmin ? '<span class="super-admin-badge">SUPER ADMIN</span>' : ''}
            </td>
            <td>${admin.email}</td>
            <td>
                <span class="admin-role-badge role-${admin.admin_role || 'admin'}">
                    ${isSuperAdmin ? 'SUPER ADMIN' : (admin.admin_role || 'ADMIN')}
                </span>
            </td>
            <td>${getAdminPermissions(admin)}</td>
            <td><span class="status-${admin.status}">${admin.status}</span></td>
            <td>${formatDate(admin.last_active)}</td>
            <td>
                <button class="btn-action view" onclick="viewAdminDetails(${admin.id})">View</button>
                ${!isSuperAdmin ? 
                    `<button class="btn-action edit" onclick="editAdmin(${admin.id})">Edit</button>
                     <button class="btn-action delete" onclick="deleteAdmin(${admin.id})">Remove</button>` : 
                    '<span style="color: #666; font-size: 12px;">Protected</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update edit admin function to protect super admin
function editAdmin(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email !== 'kingharuni420@gmail.com') {
        const modalContent = `
            <h3>Edit Admin</h3>
            <div class="form-group">
                <label>Role</label>
                <select id="edit-admin-role">
                    <option value="support" ${admin.admin_role === 'support' ? 'selected' : ''}>Support Admin</option>
                    <option value="approval" ${admin.admin_role === 'approval' ? 'selected' : ''}>Approval Admin</option>
                    <option value="financial" ${admin.admin_role === 'financial' ? 'selected' : ''}>Financial Admin</option>
                    <option value="full" ${admin.admin_role === 'full' ? 'selected' : ''}>Full Admin</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="edit-admin-status">
                    <option value="active" ${admin.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${admin.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label>Permissions</label>
                <div class="permissions-list">
                    <label><input type="checkbox" name="edit-admin-permissions" value="user_management" ${admin.permissions && admin.permissions.includes('user_management') ? 'checked' : ''}> User Management</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="transaction_approval" ${admin.permissions && admin.permissions.includes('transaction_approval') ? 'checked' : ''}> Transaction Approval</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="chat_support" ${admin.permissions && admin.permissions.includes('chat_support') ? 'checked' : ''}> Chat Support</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="reports" ${admin.permissions && admin.permissions.includes('reports') ? 'checked' : ''}> View Reports</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="settings" ${admin.permissions && admin.permissions.includes('settings') ? 'checked' : ''}> System Settings</label>
                </div>
            </div>
            <button class="btn btn-primary" onclick="saveAdminChanges(${adminId})">Save Changes</button>
        `;
        
        showCustomModal('Edit Admin', modalContent);
    } else {
        alert('Cannot edit super admin account');
    }
}

// Update save admin changes to handle permissions
function saveAdminChanges(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email !== 'kingharuni420@gmail.com') {
        admin.admin_role = document.getElementById('edit-admin-role').value;
        admin.status = document.getElementById('edit-admin-status').value;
        
        // Update permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="edit-admin-permissions"]:checked');
        admin.permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
        
        updateUserInDatabase(admin);
        closeCustomModal();
        loadAdminsList();
        alert('Admin updated successfully!');
    }
}

// Update delete admin to protect super admin
function deleteAdmin(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email === 'kingharuni420@gmail.com') {
        alert('Cannot delete super admin account!');
        return;
    }
    
    if (confirm('Are you sure you want to remove this admin?')) {
        const users = db.getUsers();
        const adminIndex = users.findIndex(user => user.id === adminId);
        
        if (adminIndex !== -1) {
            users[adminIndex].is_admin = false;
            delete users[adminIndex].admin_role;
            delete users[adminIndex].permissions;
            
            db.saveUsers(users);
            loadAdminsList();
            updateSuperAdminStats();
            alert('Admin removed successfully!');
        }
    }
}

// Add function to update user in database
function updateUserInDatabase(user) {
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
        users[userIndex] = user;
        db.saveUsers(users);
    }
}

// Update the super admin welcome message
function initSuperAdminDashboard() {
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
    
    // Show special welcome message for super admin
    showNotification('Welcome, King Haruni! Super Admin Access Granted', 'success');
    
    // Update the header with super admin badge
    const header = document.querySelector('#super-admin-dashboard .dashboard-header');
    if (header) {
        header.classList.add('super-admin-header');
    }
} 

                        // Navigation functionality
        document.addEventListener('DOMContentLoaded', function() {
            const navItems = document.querySelectorAll('.nav-item');
            const contentSections = document.querySelectorAll('.content-section');
            
            // Function to switch between sections
            function switchSection(target) {
                // Remove active class from all nav items and sections
                navItems.forEach(item => {
                    item.classList.remove('active');
                });
                
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // Add active class to clicked nav item and corresponding section
                const activeNavItem = document.querySelector(`.nav-item[data-target="${target}"]`);
                const activeSection = document.getElementById(`${target}-section`);
                
                if (activeNavItem) {
                    activeNavItem.classList.add('active');
                }
                
                if (activeSection) {
                    activeSection.classList.add('active');
                }
            }
            
            // Add click event to all nav items
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    const target = this.getAttribute('data-target');
                    switchSection(target);
                });
            });
            
            // Add animation to cards on page load
            const cards = document.querySelectorAll('.card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s, transform 0.5s';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // Chart buttons functionality
            const chartBtns = document.querySelectorAll('.chart-btn');
            chartBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    chartBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        });
        
     
        // Toggle between image and video upload sections
function toggleMediaInput() {
    const mediaType = document.getElementById('mediaType').value;
    const imageSection = document.getElementById('imageUploadSection');
    const videoSection = document.getElementById('videoUploadSection');
    const videoUrlSection = document.getElementById('videoUrlSection');
    
    if (mediaType === 'image') {
        imageSection.style.display = 'block';
        videoSection.style.display = 'none';
        videoUrlSection.style.display = 'none';
    } else {
        imageSection.style.display = 'none';
        videoSection.style.display = 'block';
        videoUrlSection.style.display = 'block';
    }
}

// Add new announcement
function addAnnouncement() {
    const text = document.getElementById('announcementText').value;
    const mediaType = document.getElementById('mediaType').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const videoFile = document.getElementById('videoUpload').files[0];
    const videoUrl = document.getElementById('videoUrl').value;
    
    if (!text) {
        alert('Please enter announcement text');
        return;
    }
    
    let mediaData = null;
    
    if (mediaType === 'image' && imageFile) {
        // Handle image upload
        const reader = new FileReader();
        reader.onload = function(e) {
            mediaData = e.target.result;
            saveAnnouncement(text, mediaType, mediaData, null);
        };
        reader.readAsDataURL(imageFile);
    } else if (mediaType === 'video') {
        if (videoFile) {
            // Handle video file upload
            const reader = new FileReader();
            reader.onload = function(e) {
                mediaData = e.target.result;
                saveAnnouncement(text, mediaType, mediaData, null);
            };
            reader.readAsDataURL(videoFile);
        } else if (videoUrl) {
            // Handle video URL
            saveAnnouncement(text, mediaType, null, videoUrl);
        } else {
            alert('Please provide either a video file or URL');
            return;
        }
    } else {
        alert('Please select a media file');
        return;
    }
}

// Fixed saveAnnouncement function - make it async
async function saveAnnouncement(text, mediaType, mediaData, videoUrl) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    // Compress image data if it's too large
    let processedMediaData = mediaData;
    if (mediaType === 'image' && mediaData && mediaData.length > 1000000) { // 1MB
        try {
            processedMediaData = await compressImage(mediaData);
        } catch (error) {
            
            processedMediaData = mediaData; // Use original if compression fails
        }
    }
    
    const newAnnouncement = {
        id: Date.now(),
        text: text,
        mediaType: mediaType,
        mediaData: processedMediaData,
        videoUrl: videoUrl,
        timestamp: new Date().toISOString()
    };
    
    // Check storage size before saving
    const newData = JSON.stringify([...announcements, newAnnouncement]);
    if (newData.length > 4500000) { // Leave 500KB buffer
        alert('Storage limit reached. Please delete some old announcements.');
        return;
    }
    
    try {
        localStorage.setItem('announcements', newData);
        
        // Clear form
        document.getElementById('announcementForm').reset();
        toggleMediaInput();
        
        // Refresh announcements list and slideshow
        loadAnnouncements();
        updateSlideshow();
        
        alert('Announcement added successfully!');
    } catch (error) {
        alert('Error saving announcement: ' + error.message);
    }
}

// Also update the addAnnouncement function to handle async
async function addAnnouncement() {
    const text = document.getElementById('announcementText').value;
    const mediaType = document.getElementById('mediaType').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const videoFile = document.getElementById('videoUpload').files[0];
    const videoUrl = document.getElementById('videoUrl').value;
    
    if (!text) {
        alert('Please enter announcement text');
        return;
    }
    
    let mediaData = null;
    
    if (mediaType === 'image' && imageFile) {
        // Handle image upload
        const reader = new FileReader();
        reader.onload = function(e) {
            mediaData = e.target.result;
            saveAnnouncement(text, mediaType, mediaData, null);
        };
        reader.readAsDataURL(imageFile);
    } else if (mediaType === 'video') {
        if (videoFile) {
            // Handle video file upload
            const reader = new FileReader();
            reader.onload = function(e) {
                mediaData = e.target.result;
                saveAnnouncement(text, mediaType, mediaData, null);
            };
            reader.readAsDataURL(videoFile);
        } else if (videoUrl) {
            // Handle video URL
            saveAnnouncement(text, mediaType, null, videoUrl);
        } else {
            alert('Please provide either a video file or URL');
            return;
        }
    } else {
        alert('Please select a media file');
        return;
    }
}

        // Deposit Section Functionality
        function initDepositSection() {
            const depositType = document.getElementById('deposit-type');
            const depositBtn = document.getElementById('deposit-btn');
            const verifyBtn = document.getElementById('verify-btn');
            const quickAmounts = document.querySelectorAll('.quick-amount[data-amount]');
            
            // Show account info and instructions based on deposit type
            depositType.addEventListener('change', function() {
                // Hide all account info
                document.querySelectorAll('.account-info').forEach(info => {
                    info.style.display = 'none';
                });
                
                // Show selected account info
                const selectedType = this.value;
                if (selectedType) {
                    document.getElementById(`${selectedType}-info`).style.display = 'block';
                    
                    // Update instructions
                    document.getElementById('instructions-title').textContent = 'Jinsi Ya Kutuma Pesa';
                    document.getElementById('instructions-content').innerHTML = bankInstructions[selectedType] || '<p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>';
                }
            });
            
            // Quick amount buttons
            quickAmounts.forEach(button => {
                button.addEventListener('click', function() {
                    const amount = this.getAttribute('data-amount');
                    document.getElementById('amount').value = amount;
                });
            });
            
            // Deposit button click
            depositBtn.addEventListener('click', function() {
                const amount = parseFloat(document.getElementById('amount').value);
                const depositType = document.getElementById('deposit-type').value;
                const senderName = document.getElementById('sender-name').value;
                const senderAccount = document.getElementById('sender-account').value;
                
                if (!amount || amount < 1000) {
                    alert('Tafadhali weka kiasi sahihi cha kuweka fedha (kiwango cha chini ni TZS 1,000)');
                    return;
                }
                
                if (!depositType) {
                    alert('Tafadhali chagua aina ya kuweka fedha');
                    return;
                }
                
                if (!senderName) {
                    alert('Tafadhali weka jina kamili la mtumaji');
                    return;
                }
                
                if (!senderAccount) {
                    alert('Tafadhali weka namba ya akaunti au simu ya mtumaji');
                    return;
                }
                
                // Show transaction code section
                document.getElementById('transaction-section').style.display = 'block';
                document.getElementById('deposit-amount-display').textContent = db.formatCurrency(amount);
                
                // Store deposit details temporarily
                window.currentDeposit = {
                    amount: amount,
                    type: depositType,
                    senderName: senderName,
                    senderAccount: senderAccount
                };
            });
            
            // Verify button click
            verifyBtn.addEventListener('click', function() {
                const transactionCode = document.getElementById('transaction-code').value;
                
                if (!transactionCode) {
                    alert('Tafadhali weka msimbo wa muamala');
                    return;
                }
                
                if (!window.currentDeposit) {
                    alert('Hitilafu imetokea. Tafadhali anza tena.');
                    return;
                }
                
                // Create deposit transaction
                const transaction = db.createTransaction(
                    db.currentUser.id,
                    'deposit',
                    window.currentDeposit.amount,
                    window.currentDeposit.type,
                    { 
                        senderName: window.currentDeposit.senderName,
                        senderAccount: window.currentDeposit.senderAccount,
                        transactionCode: transactionCode
                    }
                );
                
                if (transaction) {
                    // Show status section
                    document.getElementById('status-section').style.display = 'block';
                    document.getElementById('transaction-section').style.display = 'none';
                    
                    // Reset form
                    document.getElementById('amount').value = '';
                    document.getElementById('deposit-type').value = '';
                    document.getElementById('sender-name').value = '';
                    document.getElementById('sender-account').value = '';
                    document.getElementById('transaction-code').value = '';
                    
                    // Clear temporary data
                    window.currentDeposit = null;
                    
                    alert('Ombi lako la kuweka fedha limewasilishwa kwa mafanikio. Linasubiri idhini.');
                } else {
                    alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
                }
            });
        }

// Withdrawal Section Functionality
function initWithdrawalSection() {
    const withdrawMethod = document.getElementById('withdraw-method');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const quickAmounts = document.querySelectorAll('#withdraw-section .quick-amount[data-amount]');
    
    // Show account info based on withdrawal method
    withdrawMethod.addEventListener('change', function() {
        const accountInfo = document.getElementById('withdraw-account-info');
        if (this.value) {
            accountInfo.style.display = 'block';
        } else {
            accountInfo.style.display = 'none';
        }
    });
    
    // Quick amount buttons
    quickAmounts.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            document.getElementById('withdraw-amount').value = amount;
            updateWithdrawalCalculation();
        });
    });
    
    // Update withdrawal calculation when amount changes
    withdrawAmount.addEventListener('input', updateWithdrawalCalculation);
    
    // Withdrawal button click - UPDATED LOGIC
    withdrawBtn.addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('withdraw-method').value;
        const accountNumber = document.getElementById('account-number').value;
        const accountName = document.getElementById('account-name').value;
        const reason = document.getElementById('withdraw-reason').value;
        
        if (!amount || amount < 10000 || amount > 5000000) {
            alert('Tafadhali weka kiasi sahihi cha kutoa fedha (TZS 10,000 hadi TZS 5,000,000)');
            return;
        }
        
        // Check if withdrawal is allowed at this time
        if (!isWithdrawalAllowed()) {
            alert('Kutoa fedha kunaruhusiwa Jumatatu hadi Ijumaa (saa zote) au Jumamosi hadi Jumapili (14:00 - 23:00) pekee.');
            return;
        }
        
        // Check if user has already withdrawn today
        if (hasWithdrawnToday(db.currentUser.id)) {
            alert('Umekwisha toa fedha leo. Unaweza kutoa fedha tena kesho.');
            return;
        }
        
        // Check if user has pending withdrawal
        if (hasPendingWithdrawal(db.currentUser.id)) {
            alert('Una ombi la kutoa fedha linasubiri idhini. Huwezi kufanya ombi jingine mpaka ombi la kwanza litakapokamilika.');
            return;
        }
        
        // Check if amount is more than 50% of balance
        const maxWithdrawal = db.currentUser.balance * 0.5;
        if (amount > maxWithdrawal) {
            alert(`Kiasi cha juu unachoruhusiwa kutoa ni ${db.formatCurrency(maxWithdrawal)} (50% ya salio lako)`);
            return;
        }
        
        if (!method) {
            alert('Tafadhali chagua njia ya kutoa fedha');
            return;
        }
        
        if (!accountNumber) {
            alert('Tafadhali weka namba ya akaunti au simu');
            return;
        }
        
        if (!accountName) {
            alert('Tafadhali weka jina kamili la mlipokeaji');
            return;
        }
        
        // Check if user has sufficient balance
        if (db.currentUser.balance < amount) {
            alert('Salio lako halitoshi kwa kutoa fedha hii. Tafadhali angalia salio lako na ujaribu tena.');
            return;
        }
        
        // Process withdrawal (deduct amount immediately) - KEY FEATURE
        const success = processWithdrawalRequest(db.currentUser.id, amount);
        
        if (!success) {
            alert('Hitilafu imetokea wakati wa kutoa fedha. Tafadhali jaribu tena.');
            return;
        }
        
        // Create withdrawal transaction
        const transaction = db.createTransaction(
            db.currentUser.id,
            'withdrawal',
            amount,
            method,
            { 
                accountNumber: accountNumber,
                accountName: accountName,
                reason: reason,
                serviceCharge: amount * 0.1,
                netAmount: amount - (amount * 0.1)
            }
        );
        
        if (transaction) {
            // Show status section
            document.getElementById('withdraw-status-section').style.display = 'block';
            document.getElementById('withdraw-request-amount').textContent = db.formatCurrency(amount);
            
            // Reset form
            document.getElementById('withdraw-amount').value = '';
            document.getElementById('withdraw-method').value = '';
            document.getElementById('account-number').value = '';
            document.getElementById('account-name').value = '';
            document.getElementById('withdraw-reason').value = '';
            
            // Update balance display
            updateBalanceDisplay();
            
            alert('Ombi lako la kutoa fedha limewasilishwa kwa mafanikio. Kiasi kimetolewa kwenye salio lako na linachunguzwa.');
        } else {
            alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
        }
    });
    
    // Initial calculation update
    updateWithdrawalCalculation();
}

// Process withdrawal request (deduct amount immediately)
function processWithdrawalRequest(userId, amount) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return false;
    
    // Check if user has sufficient balance
    if (user.balance < amount) {
        return false;
    }
    
    // Deduct amount immediately - KEY FEATURE
    user.balance -= amount;
    db.saveUsers(users);
    
    // Update current user if it's the same user
    if (db.currentUser && db.currentUser.id === userId) {
        db.currentUser.balance = user.balance;
    }
    
    return true;
}

// Check if user has pending withdrawal
function hasPendingWithdrawal(userId) {
    const user = db.getUsers().find(u => u.id === userId);
    if (!user || !user.transactions) return false;
    
    return user.transactions.some(t => 
        t.type === 'withdrawal' && t.status === 'pending'
    );
}

// Check if user has withdrawn today
function hasWithdrawnToday(userId) {
    const user = db.getUsers().find(u => u.id === userId);
    if (!user || !user.transactions) return false;
    
    const today = new Date().toDateString();
    return user.transactions.some(t => {
        if (t.type === 'withdrawal' && t.status === 'approved') {
            const transactionDate = new Date(t.date).toDateString();
            return transactionDate === today;
        }
        return false;
    });
}

// Check if withdrawal is allowed at current time
function isWithdrawalAllowed() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + (minutes / 100);
    
    // Monday to Friday: all hours allowed
    if (day >= 1 && day <= 5) {
        return true;
    }
    // Saturday and Sunday: 14:00 to 23:00
    else if (day === 0 || day === 6) {
        return currentTime >= 14.00 && currentTime < 23.00;
    }
    
    return false;
}

// Update withdrawal calculation
function updateWithdrawalCalculation() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value) || 0;
    const serviceCharge = amount * 0.1;
    const netAmount = amount - serviceCharge;
    const currentUser = db.currentUser;
    const remainingBalance = currentUser ? (currentUser.balance - amount) : 0;
    
    document.getElementById('calc-withdraw').textContent = db.formatCurrency(amount);
    document.getElementById('calc-charge').textContent = db.formatCurrency(serviceCharge);
    document.getElementById('calc-receive').textContent = db.formatCurrency(netAmount);
    document.getElementById('calc-remaining').textContent = db.formatCurrency(remainingBalance);
}

// Update Database transaction status method - FIXED WITHDRAWAL LOGIC
Database.prototype.updateTransactionStatus = function(transactionId, status, adminId) {
    const users = this.getUsers();
    
    for (let user of users) {
        if (user.transactions) {
            const transaction = user.transactions.find(t => t.id === transactionId);
            if (transaction) {
                const oldStatus = transaction.status;
                transaction.status = status;
                transaction.adminActionDate = new Date().toISOString();
                transaction.adminId = adminId;
                
                // Update user balance based on transaction type and status - KEY FEATURE
                if (transaction.type === 'deposit' && status === 'approved') {
                    // For deposit: add amount when approved
                    user.balance += transaction.amount;
                } else if (transaction.type === 'withdrawal') {
                    if (status === 'rejected' && oldStatus === 'pending') {
                        // For withdrawal rejection: add back the deducted amount + service charge
                        user.balance += transaction.amount;
                    }
                    // For withdrawal approval: do nothing (amount was already deducted when requested)
                }
                
                this.saveUsers(users);
                
                // Update current user if it's the same user
                if (this.currentUser && this.currentUser.id === user.id) {
                    this.currentUser.balance = user.balance;
                }
                
                return true;
            }
        }
    }
    
    return false;
}; 

// Update the showSuperAdminDashboard function
function showSuperAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'block';
    
    // Update the username display
    document.getElementById('super-admin-username-display').textContent = db.currentUser.username;
    
    initSuperAdminDashboard();
}

// Update the navigation to handle super admin
function initNavigation() {
    // Add event listeners for navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Show target section and activate nav item
            document.getElementById(target).classList.add('active');
            this.classList.add('active');
        });
    });

    // Special handling for super admin dashboard navigation
    document.querySelectorAll('#super-admin-dashboard .nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchToSection(target);
        });
    });
}

// Add function to switch sections in super admin dashboard
function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section and activate corresponding nav item
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initLoginTabs();
    initDepositSection();
    initWithdrawalSection();
    initNavigation();
    
    // Check if user is already logged in
    if (db.currentUser) {
        if (db.isSuperAdmin(db.currentUser)) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
    
    // Auto-detect admin email for admin password field
    document.getElementById('login-email').addEventListener('input', function() {
        const email = this.value;
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (db.isAdminEmail(email)) {
            adminPasswordSection.style.display = 'block';
            
            // If it's super admin email, show special message
            if (email === 'harunihilson@gmail.com') {
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Super Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter super admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                        <i class="fas fa-crown"></i> Super Admin access detected
                    </p>
                `;
            }
        } else {
            adminPasswordSection.style.display = 'none';
        }
    });
});

// Add helper function to check user permissions
function hasPermission(permission) {
    if (!db.currentUser) return false;
    
    // Super admin has all permissions
    if (db.isSuperAdmin(db.currentUser)) {
        return true;
    }
    
    // Check if user has the specific permission
    if (db.currentUser.permissions && db.currentUser.permissions.includes('all')) {
        return true;
    }
    
    return db.currentUser.permissions && db.currentUser.permissions.includes(permission);
}

// Add function to initialize super admin dashboard
function initSuperAdminDashboard() {
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
    
    // Show welcome message for super admin
    showNotification('Welcome, Super Admin!', 'success');
}

// Add function to load super admin data
function loadSuperAdminData() {
    updateSuperAdminStats();
    loadAdminsList();
    loadTasks();
    loadSystemActivities();
}

// Add function to update super admin statistics
function updateSuperAdminStats() {
    const users = db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const activeAdmins = admins.filter(admin => admin.status === 'active');
    const pendingTransactions = db.getPendingTransactions();
    
    // Update DOM elements
    const totalUsersElement = document.getElementById('super-total-users');
    const activeAdminsCountElement = document.getElementById('active-admins-count');
    const pendingApprovalsElement = document.getElementById('pending-approvals-count');
    const totalAdminsElement = document.getElementById('total-admins-count');
    const activeAdminsElement = document.getElementById('active-admins');
    
    if (totalUsersElement) totalUsersElement.textContent = users.length;
    if (activeAdminsCountElement) activeAdminsCountElement.textContent = activeAdmins.length;
    if (pendingApprovalsElement) pendingApprovalsElement.textContent = pendingTransactions.length;
    if (totalAdminsElement) totalAdminsElement.textContent = admins.length;
    if (activeAdminsElement) activeAdminsElement.textContent = activeAdmins.length;
}

// Add notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add CSS for notifications
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.success {
    background: #27ae60;
}

.notification.error {
    background: #e74c3c;
}

.notification.info {
    background: #3498db;
}

.notification.warning {
    background: #f39c12;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.super-admin-badge {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    margin-left: 8px;
}
</style>
`;

// Inject notification styles
document.head.insertAdjacentHTML('beforeend', notificationStyles); 

        // Show user dashboard
        function showUserDashboard() {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('user-dashboard').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'none';
            
            // Update user info
            document.getElementById('username-display').textContent = db.currentUser.username;
            document.getElementById('profile-username').textContent = db.currentUser.username;
            document.getElementById('dropdown-username').textContent = db.currentUser.username;
            document.getElementById('dashboard-balance').textContent = db.formatCurrency(db.currentUser.balance);
            document.getElementById('withdraw-balance').textContent = db.formatCurrency(db.currentUser.balance);
            document.getElementById('profile-balance').textContent = `TZS ${db.currentUser.balance}`;
            document.getElementById('profile-balance-display').textContent = `TZS ${db.currentUser.balance}`;
            document.getElementById('dashboard-balance').textContent = `TZS ${db.currentUser.balance}`;

    
                // Update dashboard stats with investment data
    const userInvestments = getCurrentUserInvestments();
    const activeInvestments = userInvestments.filter(inv => !inv.completed);
    
    document.getElementById('total-balance').textContent = db.formatNumber(db.currentUser.balance);
    document.getElementById('active-investments').textContent = activeInvestments.length;
    document.getElementById('active-investment-count').textContent = activeInvestments.length;
    document.getElementById('available-investments').textContent = activeInvestments.length;
    
    // Calculate total profit from investments
    let totalProfit = 0;
    userInvestments.forEach(investment => {
        if (investment.completed) {
            totalProfit += investment.finalProfit || 0;
        } else {
            totalProfit += calculateCurrentProfit(investment);
        }
        totalProfit += investment.collectedProfits || 0;
    });
    
    document.getElementById('total-profit').textContent = db.formatNumber(totalProfit);
    document.getElementById('today-profit').textContent = db.formatNumber(totalProfit);
    

    
    // Update referral code
    document.getElementById('user-referral-code').textContent = db.currentUser.referral_code;
    
    // Initialize investment system for the user
    initInvestmentSystem();
    
    // Load user data
    loadUserReferrals();
    initRewardsSystem();
    
    // Load referrals when dashboard is shown
    loadEnhancedReferrals();
    
    // Set up auto-refresh
    startReferralAutoRefresh();
            
            // Update withdrawal calculation with current balance
            updateWithdrawalCalculation();
            
            // Load transaction history if on history tab
            if (document.getElementById('history').classList.contains('active')) {
                loadTransactionHistory();
            }
        }
        
        // Show admin dashboard
        function showAdminDashboard() {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('user-dashboard').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            
            document.getElementById('admin-username-display').textContent = db.currentUser.username;
            loadPendingTransactions();
            loadAdminStats();
            initRewardsSystem();
            
        }
        
        // Update balance display
        function updateBalanceDisplay() {
            if (db.currentUser) {
                document.getElementById('dashboard-balance').textContent = db.formatCurrency(db.currentUser.balance);
                document.getElementById('withdraw-balance').textContent = db.formatCurrency(db.currentUser.balance);
                updateWithdrawalCalculation();
            }
        }
        
        // Load transaction history
        function loadTransactionHistory() {
            const historyBody = document.getElementById('transaction-history-body');
            historyBody.innerHTML = '';
            
            if (!db.currentUser) return;
            
            const transactions = db.getUserTransactions(db.currentUser.id);
            
            if (transactions.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna historia ya miradi</td></tr>';
                return;
            }
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
                
                // Format amount
                const amount = db.formatCurrency(transaction.amount);
                
                // Status with appropriate class
                let statusClass = '';
                let statusText = '';
                if (transaction.status === 'pending') {
                    statusClass = 'status-pending';
                    statusText = 'Inasubiri';
                } else if (transaction.status === 'approved') {
                    statusClass = 'status-approved';
                    statusText = 'Imekubaliwa';
                } else if (transaction.status === 'rejected') {
                    statusClass = 'status-rejected';
                    statusText = 'Imekataliwa';
                }
                
                // Details based on transaction type
                let details = '';
                if (transaction.type === 'deposit') {
                    details = `Kutoka: ${transaction.details.senderName} (${transaction.details.senderAccount})`;
                } else if (transaction.type === 'withdrawal') {
                    details = `Kwa: ${transaction.details.accountName} (${transaction.details.accountNumber})`;
                }
                
row.innerHTML = `
    <td>${date}</td>
    <td>${transaction.type === 'deposit' ? '📥 Kuweka' : '📤 Kutoa'}</td>
    <td>${amount}</td>
    <td class="${statusClass}">${statusIcon} ${statusText}</td>
    <td>${details}</td>
    <td>
        <button class="btn" onclick="generateReceipt(${transaction.id})" 
                style="width: auto; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            👁️ Onyesha Risiti
        </button>
    </td>
`;
                
                historyBody.appendChild(row);
            });
        }
        
        // Load admin transaction history
        function loadAdminTransactionHistory() {
            const historyBody = document.getElementById('admin-transactions-body');
            historyBody.innerHTML = '';
            
            const transactions = db.getAllTransactions();
            
            if (transactions.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna historia ya miradi</td></tr>';
                return;
            }
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
                
                // Format amount
                const amount = db.formatCurrency(transaction.amount);
                
                // Status with appropriate class
                let statusClass = '';
                let statusText = '';
                if (transaction.status === 'pending') {
                    statusClass = 'status-pending';
                    statusText = 'Inasubiri';
                } else if (transaction.status === 'approved') {
                    statusClass = 'status-approved';
                    statusText = 'Imekubaliwa';
                } else if (transaction.status === 'rejected') {
                    statusClass = 'status-rejected';
                    statusText = 'Imekataliwa';
                }
                
                // Details based on transaction type
                let details = '';
                if (transaction.type === 'deposit') {
                    details = `Kutoka: ${transaction.details.senderName} (${transaction.details.senderAccount})`;
                } else if (transaction.type === 'withdrawal') {
                    details = `Kwa: ${transaction.details.accountName} (${transaction.details.accountNumber})`;
                }
                
                row.innerHTML = `
                    <td>${transaction.username}</td>
                    <td>${transaction.type === 'deposit' ? 'Kuwaweka' : 'Kutoa'}</td>
                    <td>${amount}</td>
                    <td>${date}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td>${details}</td>
                `;
                
                historyBody.appendChild(row);
            });
        }
        
        // Load admin stats
        function loadAdminStats() {
            document.getElementById('total-users').textContent = db.getTotalUsers();
            document.getElementById('total-deposits').textContent = db.formatCurrency(db.getTotalDeposits());
            document.getElementById('total-withdrawals').textContent = db.formatCurrency(db.getTotalWithdrawals());
            document.getElementById('pending-transactions-count').textContent = db.getPendingTransactions().length;
        }

        // Admin Functions

function loadPendingTransactions() {
    const pendingBody = document.getElementById('pending-transactions-body');
    pendingBody.innerHTML = '';
    
    const pendingTransactions = db.getPendingTransactions();
    
    if (pendingTransactions.length === 0) {
        pendingBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna miradi inayosubiri idhini</td></tr>';
        return;
    }
    
    pendingTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
        
        // Format amount
        const amount = db.formatCurrency(transaction.amount);
        
        // Details based on transaction type - WITH ERROR HANDLING
        let details = '';
        if (transaction.type === 'deposit') {
            // Use optional chaining and default values
            const senderName = transaction.details?.senderName || 'Haijawekwa';
            const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
            const transactionCode = transaction.details?.transactionCode || 'Haijawekwa';
            details = `Kutoka: ${senderName} (${senderAccount}), Kodi: ${transactionCode}`;
        } else if (transaction.type === 'withdrawal') {
            // Use optional chaining and default values
            const accountName = transaction.details?.accountName || 'Haijawekwa';
            const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
            const reason = transaction.details?.reason ? `, Sababu: ${transaction.details.reason}` : '';
            details = `Kwa: ${accountName} (${accountNumber})${reason}`;
        }
        
        row.innerHTML = `
            <td>${transaction.username} (${transaction.email})</td>
            <td>${transaction.type === 'deposit' ? 'Kuwaweka' : 'Kutoa'}</td>
            <td>${amount}</td>
            <td>${date}</td>
            <td>${details}</td>
            <td>
                <button class="btn" onclick="approveTransaction(${transaction.id})" style="margin-bottom: 5px; width: auto; padding: 5px 10px;">Idhinisha</button>
                <button class="btn" style="background: #e74c3c; width: auto; padding: 5px 10px;" onclick="rejectTransaction(${transaction.id})">Kataa</button>
            </td>
        `;
        
        pendingBody.appendChild(row);
    });
}

// Enhanced Load transaction history for user
function loadTransactionHistory() {
    
    
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Sasisha</td></tr>';
        return;
    }
    
    const transactions = db.getUserTransactions(db.currentUser.id);
    
    
    if (transactions.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi</h4>
                    <p style="color: #95a5a6;">Haujaanza muamala wowote bado</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'transaction-row';
        
        // Format date with time
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format amount with better styling
        const amount = db.formatCurrency(transaction.amount);
        
        // Enhanced status with appropriate class and icons
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';
        
        if (transaction.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Inasubiri';
            statusIcon = '⏳';
        } else if (transaction.status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Imekubaliwa';
            statusIcon = '✅';
        } else if (transaction.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Imekataliwa';
            statusIcon = '❌';
        } else {
            statusClass = 'status-unknown';
            statusText = transaction.status || 'Haijulikani';
            statusIcon = '❓';
        }
        
        // Enhanced details based on transaction type with better formatting
        let details = '';
        let transactionIcon = '';
        
        if (transaction.type === 'deposit') {
            transactionIcon = '📥';
            const senderName = transaction.details?.senderName || 'Haijawekwa';
            const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kuwaweka</strong></div>
                <div style="font-size: 12px; color: #666;">Kutoka: ${senderName}</div>
                <div style="font-size: 12px; color: #666;">Akaunti: ${senderAccount}</div>
                <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
            `;
        } else if (transaction.type === 'withdrawal') {
            transactionIcon = '📤';
            const accountName = transaction.details?.accountName || 'Haijawekwa';
            const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kutoa</strong></div>
                <div style="font-size: 12px; color: #666;">Kwa: ${accountName}</div>
                <div style="font-size: 12px; color: #666;">Akaunti: ${accountNumber}</div>
                <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
            `;
        } else if (transaction.type === 'investment') {
            transactionIcon = '💼';
            const plan = transaction.details?.plan || 'Standard';
            const duration = transaction.details?.duration || 'N/A';
            details = `
                <div><strong>${transactionIcon} Uwekezaji</strong></div>
                <div style="font-size: 12px; color: #666;">Mpango: ${plan}</div>
                <div style="font-size: 12px; color: #666;">Muda: ${duration}</div>
            `;
        } else if (transaction.type === 'bonus') {
            transactionIcon = '🎁';
            const bonusType = transaction.details?.bonusType || 'Ziada';
            details = `
                <div><strong>${transactionIcon} Ziada</strong></div>
                <div style="font-size: 12px; color: #666;">Aina: ${bonusType}</div>
            `;
        } else {
            transactionIcon = '💳';
            details = transaction.description || `Muamala wa ${transaction.type}`;
        }
        
        // Transaction ID for reference
        const transactionId = transaction.transaction_id || transaction.id || 'N/A';
        
        row.innerHTML = `
            <td>
                <div style="font-weight: bold;">${formattedDate}</div>
                <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${transactionIcon}</span>
                    <span>${transaction.type === 'deposit' ? 'Kuwaweka' : 
                            transaction.type === 'withdrawal' ? 'Kutoa' : 
                            transaction.type === 'investment' ? 'Uwekezaji' :
                            transaction.type === 'bonus' ? 'Ziada' : 'Muamala'}</span>
                </div>
            </td>
            <td>
                <div style="font-weight: bold; font-size: 16px; 
                           color: ${transaction.type === 'withdrawal' ? '#e74c3c' : '#27ae60'}">
                    ${transaction.type === 'withdrawal' ? '-' : '+'}${amount}
                </div>
            </td>
            <td>
                <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${statusIcon} ${statusText}
                </span>
            </td>
            <td>${details}</td>
            <td>
                <button class="btn-receipt" onclick="generateReceipt(${transaction.id})" 
                        style="display: flex; align-items: center; gap: 5px; padding: 8px 12px;">
                    📄 Pakua Risiti
                </button>
            </td>
        `;
        
        historyBody.appendChild(row);
    });
    
    // Add transaction summary
    addTransactionSummary(transactions);
}

// Enhanced Load admin transaction history
function loadAdminTransactionHistory() {
    
    
    const historyBody = document.getElementById('admin-transactions-body');
    if (!historyBody) {
        
        return;
    }
    
    historyBody.innerHTML = '';
    
    const transactions = db.getAllTransactions();
    
    
    if (transactions.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi ya watumiaji</h4>
                    <p style="color: #95a5a6;">Hakuna muamala uliofanywa na watumiaji bado</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'admin-transaction-row';
        
        // Format date with time
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format amount with better styling
        const amount = db.formatCurrency(transaction.amount);
        
        // Enhanced status with appropriate class and icons
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';
        
        if (transaction.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Inasubiri';
            statusIcon = '⏳';
        } else if (transaction.status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Imekubaliwa';
            statusIcon = '✅';
        } else if (transaction.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Imekataliwa';
            statusIcon = '❌';
        } else {
            statusClass = 'status-unknown';
            statusText = transaction.status || 'Haijulikani';
            statusIcon = '❓';
        }
        
        // Enhanced details based on transaction type with better formatting
        let details = '';
        let transactionIcon = '';
        
        if (transaction.type === 'deposit') {
            transactionIcon = '📥';
            const senderName = transaction.details?.senderName || 'Haijawekwa';
            const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kuwaweka</strong></div>
                <div style="font-size: 11px; color: #666;">Kutoka: ${senderName}</div>
                <div style="font-size: 11px; color: #666;">Akaunti: ${senderAccount}</div>
                <div style="font-size: 11px; color: #666;">Njia: ${method}</div>
            `;
        } else if (transaction.type === 'withdrawal') {
            transactionIcon = '📤';
            const accountName = transaction.details?.accountName || 'Haijawekwa';
            const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kutoa</strong></div>
                <div style="font-size: 11px; color: #666;">Kwa: ${accountName}</div>
                <div style="font-size: 11px; color: #666;">Akaunti: ${accountNumber}</div>
                <div style="font-size: 11px; color: #666;">Njia: ${method}</div>
            `;
        } else {
            transactionIcon = '💳';
            details = transaction.description || `Muamala wa ${transaction.type}`;
        }
        
        // Transaction ID for reference
        const transactionId = transaction.transaction_id || transaction.id || 'N/A';
        
        row.innerHTML = `
            <td>
                <div style="font-weight: bold;">${transaction.username || 'N/A'}</div>
                <div style="font-size: 11px; color: #95a5a6;">${transaction.email || ''}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${transactionIcon}</span>
                    <span>${transaction.type === 'deposit' ? 'Kuwaweka' : 
                            transaction.type === 'withdrawal' ? 'Kutoa' : 
                            transaction.type}</span>
                </div>
            </td>
            <td>
                <div style="font-weight: bold; font-size: 16px; 
                           color: ${transaction.type === 'withdrawal' ? '#e74c3c' : '#27ae60'}">
                    ${transaction.type === 'withdrawal' ? '-' : '+'}${amount}
                </div>
            </td>
            <td>
                <div style="font-weight: bold;">${formattedDate}</div>
                <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
            </td>
            <td>
                <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${statusIcon} ${statusText}
                </span>
            </td>
            <td>${details}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${transaction.status === 'pending' ? `
                        <button class="btn-approve" onclick="approveTransaction(${transaction.id})" 
                                style="background: #27ae60; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            ✓ Kubali
                        </button>
                        <button class="btn-reject" onclick="rejectTransaction(${transaction.id})" 
                                style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            ✗ Kataa
                        </button>
                    ` : ''}
                    <button class="btn-receipt" onclick="generateReceipt(${transaction.id})" 
                            style="background: #3498db; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        📄 Risiti
                    </button>
                </div>
            </td>
        `;
        
        historyBody.appendChild(row);
    });
    
    // Add admin transaction summary
    addAdminTransactionSummary(transactions);
}

// Helper function to add transaction summary for users
function addTransactionSummary(transactions) {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    // Remove existing summary if any
    const existingSummary = document.getElementById('transaction-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'approved')
                                     .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved')
                                       .reduce((sum, t) => sum + t.amount, 0);
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    
    const summaryHtml = `
        <div id="transaction-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3498db;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📈 Muhtasari wa Miradi</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Kuweka</div>
                    <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${db.formatCurrency(totalDeposits)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Kutoa</div>
                    <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">${db.formatCurrency(totalWithdrawals)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Inasubiri</div>
                    <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${pendingTransactions}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Miradi</div>
                    <div style="font-size: 18px; font-weight: bold; color: #3498db;">${transactions.length}</div>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', summaryHtml);
}

// Helper function to add transaction summary for admin
function addAdminTransactionSummary(transactions) {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    // Remove existing summary if any
    const existingSummary = document.getElementById('admin-transaction-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'approved')
                                     .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved')
                                       .reduce((sum, t) => sum + t.amount, 0);
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const totalUsers = [...new Set(transactions.map(t => t.userId))].length;
    
    const summaryHtml = `
        <div id="admin-transaction-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #e74c3c;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">👑 Muhtasari wa Miradi ya Watumiaji</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Kuweka</div>
                    <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${db.formatCurrency(totalDeposits)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Kutoa</div>
                    <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">${db.formatCurrency(totalWithdrawals)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Inasubiri</div>
                    <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${pendingTransactions}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Watumiaji</div>
                    <div style="font-size: 18px; font-weight: bold; color: #3498db;">${totalUsers}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Miradi</div>
                    <div style="font-size: 18px; font-weight: bold; color: #9b59b6;">${transactions.length}</div>
                </div>
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', summaryHtml);
}

// Simplified auto-refresh button
const AUTO_REFRESH_TIME = 30000; // 30 seconds

function refreshUserTransactions() {
    loadTransactionHistory();
    showRefreshFeedback('user');
    startButtonCountdown('user');
}

function refreshAdminTransactions() {
    loadAdminTransactionHistory();
    showRefreshFeedback('admin');
    startButtonCountdown('admin');
}

function showRefreshFeedback(type) {
    const button = document.querySelector(`#${type === 'user' ? 'history' : 'admin-history'} .btn-refresh`);
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '🔄 Inasasisha...';
        button.disabled = true;
        
        setTimeout(() => {
            // Restore button with countdown
            const baseText = type === 'user' ? '⏱️ Sasisha Matumizi' : '⏱️ Sasisha Historia';
            button.innerHTML = `${baseText} <span class="countdown">(30)</span>`;
            button.disabled = false;
            
            // Start countdown
            startButtonCountdown(type);
        }, 1000);
    }
}

function startButtonCountdown(type) {
    const button = document.querySelector(`#${type === 'history' ? 'history' : 'admin-history'} .btn-refresh`);
    if (!button) return;
    
    let seconds = AUTO_REFRESH_TIME / 1000;
    const countdownElement = button.querySelector('.countdown');
    
    // Clear any existing interval
    if (button.countdownInterval) {
        clearInterval(button.countdownInterval);
    }
    
    button.countdownInterval = setInterval(() => {
        seconds--;
        
        if (countdownElement) {
            countdownElement.textContent = `(${seconds})`;
        }
        
        // Change color when countdown is low
        if (seconds <= 5 && countdownElement) {
            countdownElement.style.color = '#e74c3c';
            countdownElement.style.fontWeight = 'bold';
        }
        
        if (seconds <= 0) {
            clearInterval(button.countdownInterval);
            // Auto-refresh
            if (type === 'user') {
                refreshUserTransactions();
            } else {
                refreshAdminTransactions();
            }
        }
    }, 1000);
}

// Initialize auto-refresh when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Start initial refresh and countdown
    setTimeout(() => {
        refreshUserTransactions();
        refreshAdminTransactions();
    }, 2000);
}); 

// Simplified refresh - runs immediately after login
function refreshUserTransactions() {
    loadTransactionHistory();
}

function refreshAdminTransactions() {
    loadAdminTransactionHistory();
}

// Call this function immediately after successful login
function initializeAfterLogin() {
    refreshUserTransactions();
    refreshAdminTransactions();
}

// Make functions global for HTML onclick handlers
window.approveTransaction = function(transactionId) {
    if (confirm('Una uhakika unataka kuidhinisha muamala huu?')) {
        const success = db.updateTransactionStatus(
            transactionId, 
            'approved', 
            db.currentUser.id
        );
        
        if (success) {
            alert('Muamala umeidhinishwa kwa mafanikio');
            loadPendingTransactions();
            loadAdminStats();
        } else {
            alert('Hitilafu imetokea wakati wa kuidhinisha muamala');
        }
    }
};

window.rejectTransaction = function(transactionId) {
    if (confirm('Una uhakika unataka kukataa muamala huu?')) {
        const success = db.updateTransactionStatus(
            transactionId, 
            'rejected', 
            db.currentUser.id
        );
        
        if (success) {
            alert('Muamala umekataliwa kwa mafanikio');
            loadPendingTransactions();
            loadAdminStats();
        } else {
            alert('Hitilafu imetokea wakati wa kukataa muamala');
        }
    }
};

    // Enhanced Quick Amount Button JavaScript
class QuickAmountManager {
    constructor() {
        this.selectedAmount = null;
        this.amounts = [50000, 100000, 250000, 500000];
        this.init();
    }

    init() {
        this.createQuickAmountButtons();
        this.bindEvents();
        this.setDefaultAmount();
    }

    // Create quick amount buttons dynamically (optional enhancement)
    createQuickAmountButtons() {
        const container = document.querySelector('.quick-amounts, .amount-suggestions');
        if (!container || container.children.length > 0) return;

        const isEnhanced = container.classList.contains('amount-suggestions');
        
        this.amounts.forEach(amount => {
            const button = document.createElement('div');
            button.className = isEnhanced ? 'amount-suggestion' : 'quick-amount';
            button.setAttribute('data-amount', amount);
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-label', `Select ${this.formatCurrency(amount)}`);
            
            button.innerHTML = `
                <span class="amount-display">${this.formatCurrency(amount)}</span>
                <span class="amount-badge">Quick</span>
            `;
            
            container.appendChild(button);
        });
    }

    // Enhanced event binding with multiple fallbacks
    bindEvents() {
        // Method 1: Event delegation (primary)
        this.bindEventDelegation();
        
        // Method 2: Direct binding with mutation observer
        this.bindDirectWithObserver();
        
        // Method 3: Keyboard accessibility
        this.bindKeyboardEvents();
        
        // Method 4: Periodic check for new buttons
        this.startPeriodicCheck();
    }

    bindEventDelegation() {
        document.addEventListener('click', (e) => {
            const quickAmountBtn = e.target.closest('.quick-amount, .amount-suggestion');
            if (quickAmountBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleQuickAmountClick(quickAmountBtn);
            }
        });

        // Double-click support for quick selection
        document.addEventListener('dblclick', (e) => {
            const quickAmountBtn = e.target.closest('.quick-amount, .amount-suggestion');
            if (quickAmountBtn) {
                e.preventDefault();
                this.handleQuickAmountDoubleClick(quickAmountBtn);
            }
        });
    }

    bindDirectWithObserver() {
        // Use MutationObserver to watch for dynamically added buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const buttons = node.querySelectorAll?.('.quick-amount, .amount-suggestion') || [];
                        buttons.forEach(button => {
                            this.bindDirectEvent(button);
                        });
                        
                        // If the added node itself is a button
                        if (node.matches?.('.quick-amount, .amount-suggestion')) {
                            this.bindDirectEvent(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial direct binding
        setTimeout(() => {
            document.querySelectorAll('.quick-amount, .amount-suggestion').forEach(button => {
                this.bindDirectEvent(button);
            });
        }, 100);
    }

    bindDirectEvent(button) {
        // Remove existing events to avoid duplicates
        button.removeEventListener('click', this.buttonClickHandler);
        button.removeEventListener('touchstart', this.touchHandler);
        
        // Add new events
        this.buttonClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleQuickAmountClick(button);
        };
        
        button.addEventListener('click', this.buttonClickHandler);
        button.addEventListener('touchstart', this.touchHandler, { passive: false });
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            const focused = document.activeElement;
            if (focused && focused.matches('.quick-amount, .amount-suggestion')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleQuickAmountClick(focused);
                }
            }
            
            // Number shortcuts (1-4 for quick amounts)
            if (e.key >= '1' && e.key <= '4' && e.altKey) {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                this.selectAmountByIndex(index);
            }
        });
    }

    startPeriodicCheck() {
        // Fallback: Check for new buttons every 2 seconds
        setInterval(() => {
            const buttons = document.querySelectorAll('.quick-amount, .amount-suggestion');
            buttons.forEach(button => {
                if (!button.hasAttribute('data-bound')) {
                    this.bindDirectEvent(button);
                    button.setAttribute('data-bound', 'true');
                }
            });
        }, 2000);
    }

    handleQuickAmountClick(button) {
        const amount = button.getAttribute('data-amount');
        
        
        this.selectAmount(amount);
        
        // Visual feedback
        this.animateButton(button);
        
        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    handleQuickAmountDoubleClick(button) {
        const amount = button.getAttribute('data-amount');
        
        
        this.selectAmount(amount);
        
        // Auto-submit if amount is valid
        setTimeout(() => {
            const withdrawBtn = document.getElementById('withdraw-btn');

            if (withdrawBtn && !withdrawBtn.disabled) {
                withdrawBtn.click();
            }
        }, 300);
    }

    selectAmount(amount) {
        if (!amount) return;
        
        const amountInput = document.getElementById('withdraw-amount');

        if (!amountInput) {
            
            return;
        }
        
        // Set the amount
        amountInput.value = amount;
        this.selectedAmount = amount;
        
        // Update visual selection
        this.updateVisualSelection(amount);
        
        // Trigger calculation
        this.triggerCalculation();
        
        // Focus the input for further editing
        amountInput.focus();
        
        // Dispatch custom event for other components
        this.dispatchAmountSelectedEvent(amount);
    }

    selectAmountByIndex(index) {
        const buttons = document.querySelectorAll('.quick-amount, .amount-suggestion');
        if (buttons[index]) {
            const amount = buttons[index].getAttribute('data-amount');
            this.selectAmount(amount);
        }
    }

    updateVisualSelection(selectedAmount) {
        // Remove selection from all buttons
        document.querySelectorAll('.quick-amount, .amount-suggestion').forEach(btn => {
            btn.classList.remove('active', 'selected', 'highlighted');
        });
        
        // Add selection to clicked button
        const selectedBtn = document.querySelector(`[data-amount="${selectedAmount}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active', 'selected');
            
            // Add temporary highlight effect
            selectedBtn.classList.add('highlighted');
            setTimeout(() => {
                selectedBtn.classList.remove('highlighted');
            }, 1000);
        }
    }

    animateButton(button) {
        // Add animation class
        button.classList.add('animating');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            button.classList.remove('animating');
        }, 300);
    }

    triggerCalculation() {
        // Trigger the withdrawal calculation
        const amountInput = document.getElementById('withdraw-amount');

        if (amountInput) {
            // Dispatch input event to trigger calculation
            const event = new Event('input', { bubbles: true });
            amountInput.dispatchEvent(event);
            
            // Also trigger change event for good measure
            const changeEvent = new Event('change', { bubbles: true });
            amountInput.dispatchEvent(changeEvent);
        }
        
        // Direct call to calculation function if available
        if (window.calculateWithdrawal) {
            window.calculateWithdrawal();
        } else if (window.withdrawalManager?.calculateWithdrawal) {
            window.withdrawalManager.calculateWithdrawal();
        }
    }

    setDefaultAmount() {
        // Set the first quick amount as default selection
        const defaultAmount = this.amounts[0];
        setTimeout(() => {
            this.selectAmount(defaultAmount.toString());
        }, 500);
    }

    dispatchAmountSelectedEvent(amount) {
        const event = new CustomEvent('quickAmountSelected', {
            detail: {
                amount: parseInt(amount),
                formattedAmount: this.formatCurrency(amount),
                timestamp: new Date().toISOString()
            },
            bubbles: true
        });
        
        document.dispatchEvent(event);
    }

    // Utility methods
    formatCurrency(amount) {
        return 'TZS ' + parseInt(amount).toLocaleString('en-TZ');
    }

    // Public methods
    getSelectedAmount() {
        return this.selectedAmount;
    }

    setAmounts(newAmounts) {
        this.amounts = newAmounts;
        this.createQuickAmountButtons();
    }

    addAmount(amount) {
        if (!this.amounts.includes(amount)) {
            this.amounts.push(amount);
            this.amounts.sort((a, b) => a - b);
            this.createQuickAmountButtons();
        }
    }

    removeAmount(amount) {
        this.amounts = this.amounts.filter(a => a !== amount);
        this.createQuickAmountButtons();
    }
}

// Initialize quick amount manager
const quickAmountManager = new QuickAmountManager();

// receipt in modal - REPLACE THE OLD generateReceipt FUNCTION WITH THIS
window.generateReceipt = function(transactionId) {
    const users = db.getUsers();
    let transaction = null;
    let user = null;
    
    // Find the transaction
    for (const u of users) {
        if (u.transactions) {
            const found = u.transactions.find(t => t.id === transactionId);
            if (found) {
                transaction = found;
                user = u;
                break;
            }
        }
    }
    
    if (!transaction) {
        alert('Muamala haupatikani');
        return;
    }
    
    // Format date and time
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString('sw-TZ');
    const formattedTime = transactionDate.toLocaleTimeString('sw-TZ');
    
    // Determine status
    let statusText, statusClass, statusIcon;
    if (transaction.status === 'approved') {
        statusText = 'Imekubaliwa';
        statusClass = 'status-approved';
        statusIcon = '✅';
    } else if (transaction.status === 'rejected') {
        statusText = 'Imekataliwa';
        statusClass = 'status-rejected';
        statusIcon = '❌';
    } else {
        statusText = 'Inasubiri';
        statusClass = 'status-pending';
        statusIcon = '⏳';
    }
    
    // Build receipt HTML
    const receiptHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>TANZANIA MINING INVESTMENT</h2>
                <p><strong>Risiti Ya Muamala</strong></p>
                <p><em>Namba ya Risiti: #${transaction.id}</em></p>
            </div>
            
            <div class="receipt-details">
                <div class="receipt-row">
                    <span><strong>Tarehe:</strong></span>
                    <span>${formattedDate}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Muda:</strong></span>
                    <span>${formattedTime}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Jina la Mteja:</strong></span>
                    <span>${user.username}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Aina ya Muamala:</strong></span>
                    <span>${transaction.type === 'deposit' ? 'Kuwaweka Fedha' : 'Kutoa Fedha'}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Kiasi:</strong></span>
                    <span style="font-size: 18px; font-weight: bold; color: #2c3e50;">${db.formatCurrency(transaction.amount)}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Njia:</strong></span>
                    <span>${getBankName(transaction.method)}</span>
                </div>
                
                ${transaction.type === 'deposit' ? `
                <div class="receipt-row">
                    <span><strong>Jina la Mtumaji:</strong></span>
                    <span>${transaction.details?.senderName || 'Haijawekwa'}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Akaunti ya Mtumaji:</strong></span>
                    <span>${transaction.details?.senderAccount || 'Haijawekwa'}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Msimbo wa Muamala:</strong></span>
                    <span>${transaction.details?.transactionCode || 'Haijawekwa'}</span>
                </div>
                ` : `
                <div class="receipt-row">
                    <span><strong>Jina la Mlipokeaji:</strong></span>
                    <span>${transaction.details?.accountName || 'Haijawekwa'}</span>
                </div>
                <div class="receipt-row">
                    <span><strong>Akaunti ya Mlipokeaji:</strong></span>
                    <span>${transaction.details?.accountNumber || 'Haijawekwa'}</span>
                </div>
                ${transaction.details?.reason ? `
                <div class="receipt-row">
                    <span><strong>Sababu:</strong></span>
                    <span>${transaction.details.reason}</span>
                </div>
                ` : ''}
                `}
                
                <div class="receipt-row">
                    <span><strong>Hali:</strong></span>
                    <span class="${statusClass}">${statusIcon} ${statusText}</span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <div class="qr-code">
                    <div>
                        <strong>${transaction.status === 'approved' ? 'IMEFAULU' : 
                                 transaction.status === 'rejected' ? 'IMEKATALIWA' : 'INASUBIRI'}</strong><br>
                        <span style="font-size: 10px;">Scan for Verification</span>
                    </div>
                </div>
                <p><strong>Asante kwa kutumia huduma zetu</strong></p>
                <p><strong>TANZANIA MINING INVESTMENT</strong></p>
                <p>+255 624 666 402 | info@tanzaniamining.co.tz</p>
            </div>
            
            <div class="instructions">
                <h4>📸 Maelekezo ya Kuchukua Screenshot:</h4>
                <ul>
                    <li><strong>Simu:</strong> Bonyeza pamoja Power + Volume Down</li>
                    <li><strong>Kompyuta:</strong> Windows + Shift + S</li>
                    <li><strong>Kompyuta:</strong> Tumia Print Screen kwenye kibodi</li>
                    <li>Hifadhi picha kama ushahidi wa muamala wako</li>
                </ul>
            </div>
            
            <div class="receipt-actions">
                <button class="btn btn-screenshot" onclick="takeScreenshot()">Chukua Screenshot</button>
                <button class="btn btn-close" onclick="closeReceiptModal()">Funga Risiti</button>
            </div>
        </div>
    `;
    
    // Insert receipt into modal
    document.getElementById('receiptContent').innerHTML = receiptHTML;
    
    // Show modal
    receiptModal.style.display = 'block';
};

// Close receipt modal
function closeReceiptModal() {
    receiptModal.style.display = 'none';
}

// Take screenshot (simulated)
function takeScreenshot() {
    alert('Screenshot imechukuliwa! Tafadhali hifadhi picha kwenye kifaa chako.\n\nMaelekezo ya kuhifadhi:\n- Simu: Bonyeza picha na uchague "Save Image"\n- Kompyuta: Kulia-click picha na uchague "Save Image As"');
}

// Helper function to get bank name - ADD THIS FUNCTION
function getBankName(method) {
    const bankNames = {
        'vodacom': 'Vodacom M-Pesa',
        'tigo': 'Tigo Pesa',
        'airtel': 'Airtel Money',
        'halotel': 'Halotel Halopesa',
        'crdb': 'CRDB Bank',
        'nmb': 'NMB Bank',
        'ezy': 'Ezy Pesa',
        'bank': 'Benki',
        'other': 'Nyingine'
    };
    return bankNames[method] || method;
}

// Make it global for the modal
window.getBankName = getBankName;

        
                // Modal functions
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
            }
        }
        
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('investment-modal')) {
                event.target.style.display = 'none';
            }
        }
        
                            // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
        
        // Add this function to show the user management section
function showUserManagement() {
    document.getElementById('admin-dashboard').classList.remove('active');
    document.getElementById('user-management').classList.add('active');
    
    loadUserManagementTable();
}

// Add this function to load users into the management table
function loadUserManagementTable() {
    const users = db.getUsers();
    const tableBody = document.getElementById('user-management-table');
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    
    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.referral_code.toLowerCase().includes(searchTerm)
    );
    
    tableBody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Status badge
        const statusBadge = user.status === 'active' ? 
            '<span class="status-badge active">Active</span>' : 
            '<span class="status-badge inactive">Inactive</span>';
        
        // Admin badge
        const adminBadge = user.is_admin ? '<span class="admin-badge">Admin</span>' : '';
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <strong>${user.username}</strong>
                    ${adminBadge}
                </div>
                <small>${user.email}</small>
            </td>
            <td>${user.referral_code}</td>
            <td>${db.formatCurrency(user.balance)}</td>
            <td>${user.investments ? user.investments.length : 0}</td>
            <td>${user.referrals ? user.referrals.length : 0}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action view-password" onclick="viewUserPassword(${user.id})" title="View Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn-action view-operations" onclick="viewUserOperations(${user.id})" title="View Operations">
                        <i class="fas fa-history"></i>
                    </button>
                    ${!user.is_admin ? `
                        <button class="btn-action ${user.status === 'active' ? 'deactivate' : 'activate'}" 
                                onclick="toggleUserStatus(${user.id})" 
                                title="${user.status === 'active' ? 'Deactivate User' : 'Activate User'}">
                            <i class="fas ${user.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                        </button>
                        <button class="btn-action delete-user" onclick="deleteUser(${user.id})" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Add this function to toggle user status (active/inactive)
function toggleUserStatus(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && !user.is_admin) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        db.saveUsers(users);
        
        // Show notification
        showNotification(`User ${user.username} has been ${user.status === 'active' ? 'activated' : 'deactivated'}`, 'success');
        
        // Reload the table
        loadUserManagementTable();
    }
}

// Add this function to view user password
function viewUserPassword(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Show password in a modal or alert
        const modal = document.getElementById('password-modal');
        const passwordDisplay = document.getElementById('user-password-display');
        
        passwordDisplay.textContent = user.password;
        modal.style.display = 'block';
    }
}

// Add this function to view user operations
function viewUserOperations(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Show operations modal
        const modal = document.getElementById('operations-modal');
        const operationsContent = document.getElementById('operations-content');
        
        let operationsHTML = `
            <div class="user-operations-header">
                <h3>Operations for ${user.username}</h3>
                <p>Email: ${user.email} | Joined: ${new Date(user.join_date).toLocaleDateString()}</p>
            </div>
        `;
        
        // Investments
        operationsHTML += `
            <div class="operations-section">
                <h4>Investments (${user.investments ? user.investments.length : 0})</h4>
                ${user.investments && user.investments.length > 0 ? 
                    user.investments.map(inv => `
                        <div class="operation-item">
                            <span>Amount: ${db.formatCurrency(inv.amount)}</span>
                            <span>Date: ${new Date(inv.date).toLocaleDateString()}</span>
                            <span>Plan: ${inv.plan || 'Standard'}</span>
                        </div>
                    `).join('') : 
                    '<p class="no-data">No investments found</p>'
                }
            </div>
        `;
        
        // Transactions
        operationsHTML += `
            <div class="operations-section">
                <h4>Transactions (${user.transactions ? user.transactions.length : 0})</h4>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div class="operation-item">
                            <span>Type: ${trans.type}</span>
                            <span>Amount: ${db.formatCurrency(trans.amount)}</span>
                            <span>Date: ${new Date(trans.date).toLocaleDateString()}</span>
                        </div>
                    `).join('') : 
                    '<p class="no-data">No transactions found</p>'
                }
            </div>
        `;
        
        // Referrals
        operationsHTML += `
            <div class="operations-section">
                <h4>Referrals (${user.referrals ? user.referrals.length : 0})</h4>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div class="operation-item">
                            <span>Username: ${ref.username}</span>
                            <span>Email: ${ref.email}</span>
                            <span>Joined: ${new Date(ref.join_date).toLocaleDateString()}</span>
                        </div>
                    `).join('') : 
                    '<p class="no-data">No referrals found</p>'
                }
            </div>
        `;
        
        operationsContent.innerHTML = operationsHTML;
        modal.style.display = 'block';
    }
}

// Add this function to delete user
function deleteUser(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && !user.is_admin) {
        if (confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
            const updatedUsers = users.filter(u => u.id !== userId);
            db.saveUsers(updatedUsers);
            
            showNotification(`User ${user.username} has been deleted`, 'success');
            loadUserManagementTable();
        }
    }
}

// Add this function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add modal close functionality
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Add navigation back to admin dashboard
function backToAdminDashboard() {
    document.getElementById('user-management').classList.remove('active');
    document.getElementById('admin-dashboard').classList.add('active');
}
 
let referralRefreshInterval;

function startReferralAutoRefresh() {
    // Clear any existing interval
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
    }
    
    // Refresh every 30 seconds
    referralRefreshInterval = setInterval(() => {
        if (document.getElementById('referrals').classList.contains('active')) {
            loadEnhancedReferrals();
        }
    }, 30000);
}

function stopReferralAutoRefresh() {
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
        referralRefreshInterval = null;
    }
}



function startReferralAutoRefresh() {
    // Clear any existing interval
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
    }
    
    // Refresh every 30 seconds
    referralRefreshInterval = setInterval(() => {
        if (document.getElementById('referrals').classList.contains('active')) {
            loadEnhancedReferrals();
        }
    }, 30000);
}

function stopReferralAutoRefresh() {
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
        referralRefreshInterval = null;
    }
}



     
        
        
   // Tab switching function
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-section`).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load referral data if referrals tab is selected
    if (tabId === 'referrals') {
        loadEnhancedReferrals();
    }
}
     
        
        
        
// Enhanced Referral System JavaScript
function loadEnhancedReferrals() {
    if (!db.currentUser) return;
    
    // Get user's referrals
    const users = db.getUsers();
    const userReferrals = users.filter(user => user.referred_by === db.currentUser.referral_code);
    
    // Update statistics
    updateReferralStats(userReferrals);
    
    // Update referral code display
    document.getElementById('user-referral-code-display').textContent = db.currentUser.referral_code;
    document.getElementById('referral-link-text').textContent = 
        `https://tanzania-mining.com/register?ref=${db.currentUser.referral_code}`;
    
    // Populate referrals table
    populateReferralsTable(userReferrals);
    
    // Update earnings summary
    updateEarningsSummary(userReferrals);
    
    // Update referral count badge
    const referralCountBadge = document.getElementById('referral-count-badge');
    const referralCountCard = document.getElementById('referral-count-card');
    const referralCount = document.getElementById('referral-count');
    if (userReferrals.length > 0) {
        referralCountBadge.textContent = userReferrals.length;
        referralCountCard.textContent = userReferrals.length;
        referralCount.textContent = userReferrals.length;
        referralCountBadge.style.display = 'flex';
        referralCount.style.display = 'flex';
        referralCountCard.style.display = 'flex';
    } else {
        referralCountBadge.style.display = 'none';
        referralCountCard.style.display = 'none';
        referralCount.style.display = 'none';
    }
}

// Update referral statistics
function updateReferralStats(referrals) {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(user => user.status === 'active').length;
    
    // Calculate total earnings from referral bonuses
    let totalEarnings = 0;
    let pendingEarnings = 0;
    
    if (db.currentUser.transactions) {
        db.currentUser.transactions.forEach(transaction => {
            if (transaction.type === 'Referral Bonus') {
                if (transaction.status === 'completed') {
                    totalEarnings += transaction.amount;
                } else if (transaction.status === 'pending') {
                    pendingEarnings += transaction.amount;
                }
            }
        });
    }
    
    document.getElementById('total-referrals').textContent = totalReferrals;
    document.getElementById('active-referrals').textContent = activeReferrals;
    document.getElementById('total-earnings').textContent = `TZS ${db.formatNumber(totalEarnings)}`;
    document.getElementById('pending-earnings').textContent = `TZS ${db.formatNumber(pendingEarnings)}`;
}

// Populate referrals table
function populateReferralsTable(referrals) {
    const tableBody = document.getElementById('referrals-table-body');
    const noDataMessage = document.getElementById('no-referrals-message');
    
    if (referrals.length === 0) {
        tableBody.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    let html = '';
    referrals.forEach(user => {
        // Calculate user's referral earnings
        const userEarnings = calculateReferralEarnings(user);
        
        // Determine status
        let statusClass, statusText;
        if (user.status === 'active') {
            statusClass = 'status-active';
            statusText = 'Active';
        } else if (user.balance > 0) {
            statusClass = 'status-pending';
            statusText = 'Pending';
        } else {
            statusClass = 'status-inactive';
            statusText = 'Inactive';
        }
        
        html += `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </td>
                <td>${new Date(user.join_date).toLocaleDateString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>TZS ${db.formatNumber(user.balance)}</td>
                <td>TZS ${db.formatNumber(userEarnings)}</td>
                <td>
                    <button class="btn-action view-details" onclick="viewReferralDetails(${user.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Calculate referral earnings for a specific user
function calculateReferralEarnings(referredUser) {
    if (!db.currentUser.transactions) return 0;
    
    let earnings = 0;
    db.currentUser.transactions.forEach(transaction => {
        if (transaction.type === 'Referral Bonus' && 
            transaction.details && 
            transaction.details.referredUserId === referredUser.id) {
            earnings += transaction.amount;
        }
    });
    
    return earnings;
}

// Update earnings summary
function updateEarningsSummary(referrals) {
    let totalEarned = 0;
    let available = 0;
    let pending = 0;
    
    if (db.currentUser.transactions) {
        db.currentUser.transactions.forEach(transaction => {
            if (transaction.type === 'Referral Bonus') {
                if (transaction.status === 'completed') {
                    totalEarned += transaction.amount;
                    available += transaction.amount;
                } else if (transaction.status === 'pending') {
                    totalEarned += transaction.amount;
                    pending += transaction.amount;
                }
            }
        });
    }
}



// Copy referral link
function copyReferralLink() {
    const referralLink = document.getElementById('referral-link-text').textContent;
    navigator.clipboard.writeText(referralLink);
    showNotification('Referral link copied to clipboard!', 'success');
}

// Share via WhatsApp
function shareViaWhatsApp() {
    const referralCode = db.currentUser.referral_code;
    const message = `Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Share via Email
function shareViaEmail() {
    const referralCode = db.currentUser.referral_code;
    const subject = 'Join Tanzania Mining Investment';
    const body = `Hi, I wanted to share this amazing investment opportunity with you. Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
}

// Share via SMS
function shareViaSMS() {
    const referralCode = db.currentUser.referral_code;
    const message = `Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = url;
}

// Filter referrals
function filterReferrals() {
    const filterValue = document.getElementById('referral-filter').value;
    // This would filter the displayed referrals based on the selected criteria
    
    // Actual implementation would depend on your data structure
}

// Refresh referrals
function refreshReferrals() {
    loadEnhancedReferrals();
    showNotification('Referral data refreshed!', 'success');
}

// View referral details
function viewReferralDetails(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const earnings = calculateReferralEarnings(user);
        const message = `
            Referral Details:
            Name: ${user.username}
            Email: ${user.email}
            Join Date: ${new Date(user.join_date).toLocaleDateString()}
            Status: ${user.status}
            Total Deposits: TZS ${db.formatNumber(user.balance)}
            Your Earnings: TZS ${db.formatNumber(earnings)}
        `;
        alert(message);
    }
}


        
        
 


// Add animation to the container on load
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});          
                 
 
// Daily Rewards System - Updated with 10 TZS minimum
class DailyRewards {
    constructor() {
        this.initRewardsDatabase();
    }

    initRewardsDatabase() {
        if (!localStorage.getItem('mining_reward_codes')) {
            localStorage.setItem('mining_reward_codes', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('mining_reward_redemptions')) {
            localStorage.setItem('mining_reward_redemptions', JSON.stringify([]));
        }
    }

    getRewardCodes() {
        return JSON.parse(localStorage.getItem('mining_reward_codes') || '[]');
    }

    saveRewardCodes(codes) {
        localStorage.setItem('mining_reward_codes', JSON.stringify(codes));
    }

    getRewardRedemptions() {
        return JSON.parse(localStorage.getItem('mining_reward_redemptions') || '[]');
    }

    saveRewardRedemptions(redemptions) {
        localStorage.setItem('mining_reward_redemptions', JSON.stringify(redemptions));
    }

    generateRewardCode(amount, expiresAt = null, usageLimit = null) {
        const codes = this.getRewardCodes();
        
        // Generate a unique code
        let code;
        do {
            code = this.generateUniqueCode();
        } while (codes.find(c => c.code === code));
        
        const newCode = {
            id: Date.now(),
            code: code,
            amount: parseInt(amount),
            createdBy: db.currentUser.id,
            createdByUsername: db.currentUser.username,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            isActive: true,
            redeemedBy: [] // Track which users have redeemed this code
        };
        
        codes.push(newCode);
        this.saveRewardCodes(codes);
        
        return newCode;
    }

    generateUniqueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    claimReward(code, userId, username) {
        const codes = this.getRewardCodes();
        const redemptions = this.getRewardRedemptions();
        
        // Find the reward code
        const rewardCode = codes.find(c => c.code === code.toUpperCase());
        
        if (!rewardCode) {
            return { success: false, message: '❌ Invalid reward code' };
        }
        
        if (!rewardCode.isActive) {
            return { success: false, message: '❌ This reward code is no longer active' };
        }
        
        // Check if code has expired
        if (rewardCode.expiresAt && new Date() > new Date(rewardCode.expiresAt)) {
            rewardCode.isActive = false; // Auto-deactivate expired codes
            this.saveRewardCodes(codes);
            return { success: false, message: '❌ This reward code has expired' };
        }
        
        // Check if user has already claimed this code
        const userRedemption = rewardCode.redeemedBy.find(redemption => redemption.userId === userId);
        if (userRedemption) {
            return { success: false, message: '❌ You have already claimed this reward code' };
        }
        
        // Check usage limit
        if (rewardCode.usageLimit && rewardCode.redeemedBy.length >= rewardCode.usageLimit) {
            rewardCode.isActive = false; // Auto-deactivate when limit reached
            this.saveRewardCodes(codes);
            return { success: false, message: '❌ This reward code has reached its usage limit' };
        }
        
        // Add user to redeemed list with timestamp
        const redemptionRecord = {
            userId: userId,
            username: username,
            redeemedAt: new Date().toISOString()
        };
        
        rewardCode.redeemedBy.push(redemptionRecord);
        
        // Create redemption history record
        const redemption = {
            id: Date.now(),
            userId: userId,
            username: username,
            codeId: rewardCode.id,
            code: rewardCode.code,
            amount: rewardCode.amount,
            redeemedAt: new Date().toISOString()
        };
        
        redemptions.push(redemption);
        
        // Save updates
        this.saveRewardCodes(codes);
        this.saveRewardRedemptions(redemptions);
        
        return { 
            success: true, 
            message: `🎉 Successfully claimed ${db.formatCurrency(rewardCode.amount)} reward! Amount added to your balance.`,
            amount: rewardCode.amount
        };
    }

    deactivateRewardCode(codeId) {
        const codes = this.getRewardCodes();
        const code = codes.find(c => c.id === codeId);
        
        if (code) {
            code.isActive = false;
            this.saveRewardCodes(codes);
            return true;
        }
        
        return false;
    }

    getActiveRewardCodes() {
        const codes = this.getRewardCodes();
        return codes.filter(code => code.isActive);
    }

    getUserClaimedRewards(userId) {
        const redemptions = this.getRewardRedemptions();
        return redemptions
            .filter(r => r.userId === userId)
            .sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    }

    getAllRedemptions() {
        return this.getRewardRedemptions().sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    }

    getRewardStats() {
        const codes = this.getRewardCodes();
        const redemptions = this.getRewardRedemptions();
        
        const activeCodes = codes.filter(code => code.isActive).length;
        const totalRedeemed = redemptions.reduce((sum, redemption) => sum + redemption.amount, 0);
        
        return {
            activeCodes: activeCodes,
            totalRedeemed: totalRedeemed
        };
    }
}

// Initialize rewards system
const dailyRewards = new DailyRewards();

// User Functions
function claimReward() {
    if (!db.currentUser) {
        showNotification('Please log in to claim rewards', true);
        return;
    }
    
    const codeInput = document.getElementById('reward-code-input');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        showRewardStatus('Please enter a reward code', 'error');
        return;
    }
    
    if (code.length !== 8) {
        showRewardStatus('Reward code must be 8 characters long', 'error');
        return;
    }
    
    const result = dailyRewards.claimReward(code, db.currentUser.id, db.currentUser.username);
    
    if (result.success) {
        // Add reward amount to user balance
        const oldBalance = db.currentUser.balance;
        db.currentUser.balance += result.amount;
        saveCurrentUserBalance();
        updateBalanceDisplays();
        
        showRewardStatus(result.message, 'success');
        codeInput.value = '';
        
        // Refresh claimed rewards list
        loadUserClaimedRewards();
        
        // Show notification with balance update
        showNotification(`🎉 Reward claimed! ${db.formatCurrency(result.amount)} added to your balance. New balance: ${db.formatCurrency(db.currentUser.balance)}`);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            const statusElement = document.getElementById('reward-status');
            statusElement.style.display = 'none';
        }, 5000);
    } else {
        showRewardStatus(result.message, 'error');
    }
}

function showRewardStatus(message, type) {
    const statusElement = document.getElementById('reward-status');
    statusElement.textContent = message;
    statusElement.className = `reward-status ${type}`;
    statusElement.style.display = 'block';
}

function loadUserClaimedRewards() {
    if (!db.currentUser) return;
    
    const claimedRewardsList = document.getElementById('claimed-rewards-list');
    const userRewards = dailyRewards.getUserClaimedRewards(db.currentUser.id);
    
    if (userRewards.length === 0) {
        claimedRewardsList.innerHTML = '<div class="no-rewards">No rewards claimed yet. Enter a code above to claim your first reward!</div>';
        return;
    }
    
    let html = '';
    userRewards.slice(0, 10).forEach(reward => {
        const date = new Date(reward.redeemedAt).toLocaleDateString('en-TZ');
        const time = new Date(reward.redeemedAt).toLocaleTimeString('en-TZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        html += `
            <div class="reward-item">
                <div>
                    <div class="reward-code-display">${reward.code}</div>
                    <div class="reward-date">${date} at ${time}</div>
                </div>
                <div class="reward-amount">+${db.formatCurrency(reward.amount)}</div>
            </div>
        `;
    });
    
    claimedRewardsList.innerHTML = html;
}

// Admin Functions
function generateRewardCode() {
    const amountInput = document.getElementById('reward-amount');
    const expiryInput = document.getElementById('reward-expiry');
    const usageLimitInput = document.getElementById('reward-usage-limit');
    
    const amount = parseInt(amountInput.value);
    const expiry = expiryInput.value ? new Date(expiryInput.value).toISOString() : null;
    const usageLimit = usageLimitInput.value ? parseInt(usageLimitInput.value) : null;
    
    if (!amount || amount < 10) {
        alert('Please enter a valid reward amount (minimum 10 TZS)');
        return;
    }
    
    const rewardCode = dailyRewards.generateRewardCode(amount, expiry, usageLimit);
    
    // Clear form
    amountInput.value = '1000'; // Reset to default value
    expiryInput.value = '';
    usageLimitInput.value = '';
    
    // Refresh reward codes display
    loadAdminRewardCodes();
    
    // Show success message with code
    alert(`🎉 Reward code generated successfully!\n\nCode: ${rewardCode.code}\nAmount: ${db.formatCurrency(amount)}\n\nCopy this code and share it with users!`);
}

function loadAdminRewardCodes() {
    const activeRewardCodes = document.getElementById('active-reward-codes');
    const codes = dailyRewards.getActiveRewardCodes();
    
    // Update stats
    const stats = dailyRewards.getRewardStats();
    document.getElementById('total-active-codes').textContent = stats.activeCodes;
    document.getElementById('total-redeemed-amount').textContent = db.formatCurrency(stats.totalRedeemed); 
    
    if (codes.length === 0) {
        activeRewardCodes.innerHTML = '<div class="no-rewards">No active reward codes. Create one using the form on the left.</div>';
        return;
    }
    
    let html = '';
    codes.forEach(code => {
        const createdDate = new Date(code.createdAt).toLocaleDateString('en-TZ');
        const expiryDate = code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('en-TZ') : 'No expiry';
        const usageCount = code.redeemedBy.length;
        const usageLimit = code.usageLimit || 'Unlimited';
        
        let statusBadge = '';
        if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
            statusBadge = '<span class="expired-badge">Expired</span>';
        } else if (code.usageLimit && usageCount >= code.usageLimit) {
            statusBadge = '<span class="limit-reached-badge">Limit Reached</span>';
        }
        
        html += `
            <div class="reward-code-item">
                <div class="reward-code-header">
                    <div class="reward-code">${code.code}</div>
                    <div class="reward-amount-badge">${db.formatCurrency(code.amount)}</div>
                </div>
                <div class="reward-details">
                    <div><strong>Created:</strong> ${createdDate}</div>
                    <div><strong>Expires:</strong> ${expiryDate}</div>
                    <div><strong>Usage:</strong> ${usageCount}/${usageLimit}</div>
                    <div><strong>Created by:</strong> ${code.createdByUsername}</div>
                </div>
                ${statusBadge}
                ${code.redeemedBy.length > 0 ? `
                    <div class="redeemed-users">
                        <strong>Redeemed by (${code.redeemedBy.length} user(s)):</strong>
                        ${code.redeemedBy.map(redemption => {
                            const date = new Date(redemption.redeemedAt).toLocaleDateString('en-TZ');
                            return `
                                <div class="redeemed-user">
                                    <span class="redeemed-username">${redemption.username}</span>
                                    <span class="redeemed-date">${date}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div style="margin-top: 10px; color: #7f8c8d; font-style: italic;">No redemptions yet</div>'}
                <div class="reward-actions">
                    <button class="btn" onclick="copyRewardCode('${code.code}')">
                        <i class="fas fa-copy"></i> Copy Code
                    </button>
                    <button class="btn" style="background: #e74c3c;" onclick="deactivateRewardCode(${code.id})">
                        <i class="fas fa-ban"></i> Deactivate
                    </button>
                </div>
            </div>
        `;
    });
    
    activeRewardCodes.innerHTML = html;
}

function loadRewardRedemptionHistory() {
    const rewardHistory = document.getElementById('reward-redemption-history');
    const redemptions = dailyRewards.getAllRedemptions();
    
    if (redemptions.length === 0) {
        rewardHistory.innerHTML = '<div class="no-rewards">No reward redemptions yet.</div>';
        return;
    }
    
    let html = '';
    redemptions.slice(0, 20).forEach(redemption => {
        const date = new Date(redemption.redeemedAt).toLocaleDateString('en-TZ');
        const time = new Date(redemption.redeemedAt).toLocaleTimeString('en-TZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        html += `
            <div class="reward-item">
                <div>
                    <div><strong>${redemption.username}</strong></div>
                    <div class="reward-code-display">${redemption.code}</div>
                    <div class="reward-date">${date} at ${time}</div>
                </div>
                <div class="reward-amount">${db.formatCurrency(redemption.amount)}</div>
            </div>
        `;
    });
    
    rewardHistory.innerHTML = html;
}

function copyRewardCode(code) {
    navigator.clipboard.writeText(code);
    showNotification('Reward code copied to clipboard!');
}

function deactivateRewardCode(codeId) {
    if (confirm('Are you sure you want to deactivate this reward code? Users will no longer be able to claim it.')) {
        const success = dailyRewards.deactivateRewardCode(codeId);
        
        if (success) {
            loadAdminRewardCodes();
            showNotification('Reward code deactivated successfully');
        } else {
            showNotification('Error deactivating reward code', true);
        }
    }
}

// Initialize rewards when dashboard loads
function initRewardsSystem() {
    if (db.currentUser) {
        if (db.currentUser.is_admin) {
            loadAdminRewardCodes();
            loadRewardRedemptionHistory();
        } else {
            loadUserClaimedRewards();
        }
    }
}


      
  // Announcement System
class AnnouncementSystem {
    constructor() {
        this.announcements = this.loadAnnouncements();
        this.currentSlide = 0;
        this.slideshowInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAdminAnnouncements();
        this.startSlideshow();
    }

    // Load announcements from localStorage
    loadAnnouncements() {
        const stored = localStorage.getItem('mining_announcements');
        if (stored) {
            return JSON.parse(stored);
        } else {
            // Create sample announcements
            const sampleAnnouncements = [
                {
                    id: 1,
                    title: "Welcome to Tanzania Mining Investment",
                    content: "We're excited to have you on board. Start your investment journey with us today!",
                    type: "none",
                    priority: "high",
                    active: true,
                    createdAt: new Date().toISOString(),
                    createdBy: "System"
                },
                {
                    id: 2,
                    title: "New Investment Plans Available",
                    content: "Check out our new premium investment plans with higher returns and better benefits.",
                    type: "none",
                    priority: "medium",
                    active: true,
                    createdAt: new Date().toISOString(),
                    createdBy: "System"
                }
            ];
            this.saveAnnouncements(sampleAnnouncements);
            return sampleAnnouncements;
        }
    }

    // Save announcements to localStorage
    saveAnnouncements(announcements) {
        localStorage.setItem('mining_announcements', JSON.stringify(announcements));
    }

    // Get next announcement ID
    getNextId() {
        const maxId = this.announcements.reduce((max, announcement) => 
            Math.max(max, announcement.id), 0);
        return maxId + 1;
    }

    // Setup event listeners
    setupEventListeners() {
        // Admin announcement form
        const newAnnouncementBtn = document.getElementById('new-announcement-btn');
        const announcementForm = document.getElementById('announcement-form');
        const cancelAnnouncement = document.getElementById('cancel-announcement');
        const saveAnnouncement = document.getElementById('save-announcement');
        const mediaTypeRadios = document.querySelectorAll('input[name="media-type"]');

        if (newAnnouncementBtn) {
            newAnnouncementBtn.addEventListener('click', () => {
                announcementForm.style.display = 'block';
                this.resetAnnouncementForm();
            });
        }

        if (cancelAnnouncement) {
            cancelAnnouncement.addEventListener('click', () => {
                announcementForm.style.display = 'none';
            });
        }

        if (saveAnnouncement) {
            saveAnnouncement.addEventListener('click', () => {
                this.saveNewAnnouncement();
            });
        }

        // Media type selection
        if (mediaTypeRadios.length > 0) {
            mediaTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.toggleMediaSections(e.target.value);
                });
            });
        }

        // Slideshow navigation
        const prevBtn = document.getElementById('slideshow-prev');
        const nextBtn = document.getElementById('slideshow-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextSlide();
            });
        }

        // Pause slideshow on hover
        const slideshow = document.getElementById('announcements-slideshow');
        if (slideshow) {
            slideshow.addEventListener('mouseenter', () => {
                this.pauseSlideshow();
            });

            slideshow.addEventListener('mouseleave', () => {
                this.resumeSlideshow();
            });
        }
    }

    // Toggle media sections based on selection
    toggleMediaSections(mediaType) {
        const imageSection = document.getElementById('image-upload-section');
        const videoSection = document.getElementById('video-upload-section');

        if (imageSection) imageSection.style.display = mediaType === 'image' ? 'block' : 'none';
        if (videoSection) videoSection.style.display = mediaType === 'video' ? 'block' : 'none';
    }

    // Reset announcement form
    resetAnnouncementForm() {
        document.getElementById('announcement-title').value = '';
        document.getElementById('announcement-content').value = '';
        document.getElementById('announcement-image').value = '';
        document.getElementById('announcement-video').value = '';
        document.getElementById('announcement-priority').value = 'medium';
        document.getElementById('announcement-active').checked = true;
        
        // Reset media type to none
        document.querySelector('input[name="media-type"][value="none"]').checked = true;
        this.toggleMediaSections('none');
    }

    // Save new announcement
    saveNewAnnouncement() {
        const title = document.getElementById('announcement-title').value.trim();
        const content = document.getElementById('announcement-content').value.trim();
        const mediaType = document.querySelector('input[name="media-type"]:checked').value;
        const priority = document.getElementById('announcement-priority').value;
        const active = document.getElementById('announcement-active').checked;

        if (!title) {
            alert('Please enter a title for the announcement');
            return;
        }

        if (!content) {
            alert('Please enter content for the announcement');
            return;
        }

        const newAnnouncement = {
            id: this.getNextId(),
            title,
            content,
            type: mediaType,
            priority,
            active,
            createdAt: new Date().toISOString(),
            createdBy: db.currentUser ? db.currentUser.username : 'Admin'
        };

        // Handle media based on type
        if (mediaType === 'image') {
            const imageFile = document.getElementById('announcement-image').files[0];
            if (imageFile) {
                // Convert image to base64 for storage
                const reader = new FileReader();
                reader.onload = (e) => {
                    newAnnouncement.mediaUrl = e.target.result;
                    this.finalizeAnnouncementSave(newAnnouncement);
                };
                reader.readAsDataURL(imageFile);
            } else {
                this.finalizeAnnouncementSave(newAnnouncement);
            }
        } else if (mediaType === 'video') {
            const videoUrl = document.getElementById('announcement-video').value.trim();
            if (videoUrl) {
                newAnnouncement.mediaUrl = videoUrl;
            }
            this.finalizeAnnouncementSave(newAnnouncement);
        } else {
            this.finalizeAnnouncementSave(newAnnouncement);
        }
    }

    // Finalize saving announcement
    finalizeAnnouncementSave(announcement) {
        this.announcements.push(announcement);
        this.saveAnnouncements(this.announcements);
        
        // Update UI
        this.loadAdminAnnouncements();
        this.updateSlideshow();
        
        // Hide form
        document.getElementById('announcement-form').style.display = 'none';
        
        // Show success message
        alert('Announcement saved successfully!');
    }

    // Load announcements in admin panel
    loadAdminAnnouncements() {
        const announcementsList = document.getElementById('announcements-list');
        if (!announcementsList) return;

        const activeAnnouncements = this.announcements.filter(a => a.active);
        const inactiveAnnouncements = this.announcements.filter(a => !a.active);

        let html = '';

        // Active announcements
        if (activeAnnouncements.length > 0) {
            html += '<h4>Active Announcements</h4>';
            activeAnnouncements.forEach(announcement => {
                html += this.createAnnouncementCard(announcement);
            });
        }

        // Inactive announcements
        if (inactiveAnnouncements.length > 0) {
            html += '<h4 style="margin-top: 30px;">Inactive Announcements</h4>';
            inactiveAnnouncements.forEach(announcement => {
                html += this.createAnnouncementCard(announcement);
            });
        }

        if (this.announcements.length === 0) {
            html = '<p>No announcements found. Create your first announcement!</p>';
        }

        announcementsList.innerHTML = html;
    }

    // Create announcement card for admin panel
    createAnnouncementCard(announcement) {
        const date = new Date(announcement.createdAt).toLocaleDateString();
        const priorityClass = `priority-${announcement.priority}`;
        
        let mediaPreview = '';
        if (announcement.type === 'image' && announcement.mediaUrl) {
            mediaPreview = `
                <div class="announcement-media-preview">
                    <img src="${announcement.mediaUrl}" alt="Announcement image" style="width: 100%; border-radius: 5px;">
                </div>
            `;
        } else if (announcement.type === 'video' && announcement.mediaUrl) {
            mediaPreview = `
                <div class="announcement-media-preview">
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
                        <i class="fas fa-video" style="font-size: 2rem; color: #666;"></i>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Video: ${announcement.mediaUrl}</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="announcement-card">
                <div class="announcement-header">
                    <h4 class="announcement-title">${announcement.title}</h4>
                    <div class="announcement-meta">
                        <span class="priority-badge ${priorityClass}">${announcement.priority}</span>
                        <span>${date}</span>
                    </div>
                </div>
                <div class="announcement-content">
                    <p>${announcement.content}</p>
                    ${mediaPreview}
                </div>
                <div class="announcement-actions">
                    <button class="btn btn-edit" onclick="announcementSystem.editAnnouncement(${announcement.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-toggle" onclick="announcementSystem.toggleAnnouncement(${announcement.id})">
                        <i class="fas ${announcement.active ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                        ${announcement.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-delete" onclick="announcementSystem.deleteAnnouncement(${announcement.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Edit announcement
    editAnnouncement(id) {
        const announcement = this.announcements.find(a => a.id === id);
        if (!announcement) return;

        // Populate form with announcement data
        document.getElementById('announcement-title').value = announcement.title;
        document.getElementById('announcement-content').value = announcement.content;
        document.getElementById('announcement-priority').value = announcement.priority;
        document.getElementById('announcement-active').checked = announcement.active;
        
        // Set media type
        document.querySelector(`input[name="media-type"][value="${announcement.type}"]`).checked = true;
        this.toggleMediaSections(announcement.type);
        
        // Show form
        document.getElementById('announcement-form').style.display = 'block';
        
        // Store the ID for updating
        document.getElementById('announcement-form').dataset.editingId = id;
        
        // Change save button text
        document.getElementById('save-announcement').textContent = 'Update Announcement';
    }

    // Toggle announcement active status
    toggleAnnouncement(id) {
        const announcement = this.announcements.find(a => a.id === id);
        if (announcement) {
            announcement.active = !announcement.active;
            this.saveAnnouncements(this.announcements);
            this.loadAdminAnnouncements();
            this.updateSlideshow();
        }
    }

    // Delete announcement
    deleteAnnouncement(id) {
        if (confirm('Are you sure you want to delete this announcement?')) {
            this.announcements = this.announcements.filter(a => a.id !== id);
            this.saveAnnouncements(this.announcements);
            this.loadAdminAnnouncements();
            this.updateSlideshow();
        }
    }

    // Update slideshow with current announcements
    updateSlideshow() {
        const slideshowTrack = document.getElementById('slideshow-track');
        const dotsContainer = document.getElementById('slideshow-dots');
        
        if (!slideshowTrack) return;

        const activeAnnouncements = this.announcements.filter(a => a.active);
        
        if (activeAnnouncements.length === 0) {
            slideshowTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>No Announcements</h3>
                        <p>Check back later for updates</p>
                    </div>
                </div>
            `;
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        let slidesHtml = '';
        let dotsHtml = '';

        activeAnnouncements.forEach((announcement, index) => {
            let mediaHtml = '';
            
            if (announcement.type === 'image' && announcement.mediaUrl) {
                mediaHtml = `<div class="slide-media"><img src="${announcement.mediaUrl}" alt="${announcement.title}"></div>`;
            } else if (announcement.type === 'video' && announcement.mediaUrl) {
                // Check if it's a YouTube or Vimeo URL
                if (announcement.mediaUrl.includes('youtube') || announcement.mediaUrl.includes('youtu.be')) {
                    const videoId = this.extractYouTubeId(announcement.mediaUrl);
                    if (videoId) {
                        mediaHtml = `<div class="slide-media"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" allow="autoplay"></iframe></div>`;
                    }
                } else if (announcement.mediaUrl.includes('vimeo')) {
                    const videoId = this.extractVimeoId(announcement.mediaUrl);
                    if (videoId) {
                        mediaHtml = `<div class="slide-media"><iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1" allow="autoplay"></iframe></div>`;
                    }
                }
            }

            slidesHtml += `
                <div class="announcement-slide">
                    ${mediaHtml}
                    <div class="slide-content">
                        <span class="priority-badge priority-${announcement.priority}">${announcement.priority.toUpperCase()}</span>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                        <small>Posted on ${new Date(announcement.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;

            dotsHtml += `<div class="slideshow-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`;
        });

        slideshowTrack.innerHTML = slidesHtml;
        
        if (dotsContainer) {
            dotsContainer.innerHTML = dotsHtml;
            
            // Add click event to dots
            const dots = dotsContainer.querySelectorAll('.slideshow-dot');
            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const slideIndex = parseInt(dot.getAttribute('data-slide'));
                    this.goToSlide(slideIndex);
                });
            });
        }

        // Reset current slide
        this.currentSlide = 0;
        this.updateSlidePosition();
    }

    // Extract YouTube video ID from URL
    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    }

    // Extract Vimeo video ID from URL
    extractVimeoId(url) {
        const regExp = /(?:vimeo\.com\/)(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : false;
    }

    // Start slideshow
    startSlideshow() {
        this.updateSlideshow();
        this.slideshowInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    // Go to next slide
    nextSlide() {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (activeAnnouncements.length <= 1) return;
        
        this.currentSlide = (this.currentSlide + 1) % activeAnnouncements.length;
        this.updateSlidePosition();
    }

    // Go to previous slide
    prevSlide() {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (activeAnnouncements.length <= 1) return;
        
        this.currentSlide = (this.currentSlide - 1 + activeAnnouncements.length) % activeAnnouncements.length;
        this.updateSlidePosition();
    }

    // Go to specific slide
    goToSlide(index) {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (index >= 0 && index < activeAnnouncements.length) {
            this.currentSlide = index;
            this.updateSlidePosition();
        }
    }

    // Update slide position
    updateSlidePosition() {
        const slideshowTrack = document.getElementById('slideshow-track');
        if (slideshowTrack) {
            slideshowTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }

        // Update active dot
        const dots = document.querySelectorAll('.slideshow-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Pause slideshow
    pauseSlideshow() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }

    // Resume slideshow
    resumeSlideshow() {
        if (!this.slideshowInterval) {
            this.slideshowInterval = setInterval(() => {
                this.nextSlide();
            }, 5000);
        }
    }
}

// Initialize announcement system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.announcementSystem = new AnnouncementSystem();
});

// Update the navigation to show announcements section
document.addEventListener('DOMContentLoaded', function() {
    // Add announcement navigation item click handler
    const announcementNav = document.querySelector('.nav-item[data-target="announcements"]');
    if (announcementNav) {
        announcementNav.addEventListener('click', function() {
            // Switch to announcements section
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('announcements').classList.add('active');
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    }
});       
           
// Investment System
let investments = [];
let currentMineral = null;
let currentPrice = 0;
let profitIntervals = {};

// DOM Elements
const investmentModal = document.getElementById('investment-modal');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalBalance = document.getElementById('modal-balance');
const investmentGrams = document.getElementById('investment-grams');
const investmentDays = document.getElementById('investment-days');
const totalCost = document.getElementById('total-cost');
const dailyProfit = document.getElementById('daily-profit');
const insufficientFunds = document.getElementById('insufficient-funds');
const startInvestmentBtn = document.getElementById('start-investment-btn');
const investmentsContainer = document.getElementById('investments-container');

// ========== CORE CALCULATION FUNCTIONS ==========

// Get daily return rate based on day of week
function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03;
}

// Calculate profit for time period
function calculateProfitForPeriod(principal, startDate, endDate) {
    let currentAmount = principal;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
        const dailyRate = getDailyReturnRate(currentDate);
        const secondsInDay = 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + dailyRate, 1 / secondsInDay) - 1;
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const secondsToProcess = Math.min((end - currentDate) / 1000, (endOfDay - currentDate) / 1000);
        
        if (secondsToProcess > 0) {
            currentAmount = currentAmount * Math.pow(1 + perSecondRate, secondsToProcess);
        }
        
        currentDate = new Date(Math.min(endOfDay.getTime() + 1000, end.getTime()));
    }
    
    return currentAmount - principal;
}

// Calculate current profit
function calculateCurrentProfit(investment) {
    const now = new Date();
    const startDate = new Date(investment.startTime);
    return now >= startDate ? calculateProfitForPeriod(investment.cost, startDate, now) : 0;
}

// Calculate expected total profit at the end
function calculateExpectedTotalProfit(investment) {
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    return calculateProfitForPeriod(investment.cost, startDate, endDate);
}

// ========== MODAL FUNCTIONS ==========

// Open investment modal
function openInvestmentModal(mineral, price) {
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    currentMineral = mineral;
    currentPrice = price;
    
    modalTitle.textContent = `Wekeza kwenye ${mineral}`;
    modalPrice.textContent = `TZS ${price.toLocaleString()}/g`;
    modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    investmentGrams.value = '';
    investmentDays.value = '7';
    totalCost.textContent = 'TZS 0';
    dailyProfit.textContent = 'TZS 0';
    insufficientFunds.style.display = 'none';
    startInvestmentBtn.disabled = false;
    
    investmentModal.style.display = 'flex';
}

// Close modal
function closeInvestmentModal() {
    investmentModal.style.display = 'none';
}

// Calculate investment return - MOVED BEFORE IT'S USED
function calculateInvestmentReturn() {
    const grams = parseFloat(investmentGrams.value) || 0;
    const days = parseFloat(investmentDays.value) || 0;
    
    if (grams > 0 && days > 0) {
        const cost = grams * currentPrice;
        
        if (cost > db.currentUser.balance) {
            insufficientFunds.style.display = 'block';
            startInvestmentBtn.disabled = true;
        } else {
            insufficientFunds.style.display = 'none';
            startInvestmentBtn.disabled = false;
        }
        
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
        const totalReturn = cost + calculateProfitForPeriod(cost, startDate, endDate);
        const averageDailyProfit = (totalReturn - cost) / days;
        const totalProfit = totalReturn - cost;
        const profitPercentage = ((totalProfit / cost) * 100);
        
        totalCost.textContent = `TZS ${Math.round(cost).toLocaleString()}`;
        dailyProfit.textContent = `TZS ${Math.round(averageDailyProfit).toLocaleString()}/siku`;
        
        // Show expected profit information
        const expectedInfo = document.getElementById('expected-profit-info') || document.createElement('div');
        expectedInfo.id = 'expected-profit-info';
        expectedInfo.innerHTML = `
            <div class="expected-profit-breakdown">
                <h4>Makadirio ya Faida:</h4>
                <div class="expected-row">
                    <span>Faida Inayotarajiwa:</span>
                    <span>TZS ${Math.round(totalProfit).toLocaleString()} (${profitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="expected-row">
                    <span>Jumla Inayotarajiwa:</span>
                    <span>TZS ${Math.round(totalReturn).toLocaleString()}</span>
                </div>
                <div class="expected-note">
                    <p><strong>Kumbuka:</strong> Faida yote na uwekezaji wako wa awali zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji.</p>
                </div>
            </div>
        `;
        
        if (!document.getElementById('expected-profit-info')) {
            startInvestmentBtn.parentNode.insertBefore(expectedInfo, startInvestmentBtn);
        }
        
    } else {
        totalCost.textContent = 'TZS 0';
        dailyProfit.textContent = 'TZS 0';
        insufficientFunds.style.display = 'none';
        startInvestmentBtn.disabled = false;
        
        const expectedInfo = document.getElementById('expected-profit-info');
        if (expectedInfo) {
            expectedInfo.remove();
        }
    }
}

// Start investment
function startInvestment() {
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    const grams = parseFloat(investmentGrams.value);
    const days = parseFloat(investmentDays.value);
    
    if (!grams || grams <= 0) {
        showNotification('Tafadhali weka idadi halali ya gramu', true);
        return;
    }
    
    if (!days || days < 7) {
        showNotification('Tafadhali weka kipindi halali cha uwekezaji (angalau siku 7)', true);
        return;
    }
    
    const cost = grams * currentPrice;
    
    if (cost > db.currentUser.balance) {
        showNotification('Salio lako halitoshi kwa uwekezaji huu', true);
        return;
    }
    
    db.currentUser.balance -= cost;
    saveCurrentUserBalance();
    updateBalanceDisplays();
    
    const investment = {
        id: Date.now(),
        mineral: currentMineral,
        grams: grams,
        days: days,
        startTime: new Date().toISOString(),
        cost: cost,
        completed: false
    };
    
    investments.push(investment);
    saveCurrentUserInvestments();
    closeInvestmentModal();
    
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
    
    showNotification('Uwekezaji umeanzishwa kikamilifu! Faida yote na uwekezaji wako zitaongezwa kiotomatiki mwisho wa muda.');
    startProfitCalculation(investment.id);
}

// ========== INVESTMENT MANAGEMENT FUNCTIONS ==========

// Get user investments from localStorage - ISOLATED PER USER
function getCurrentUserInvestments() {
    if (!db.currentUser || !db.currentUser.username) return [];
    const userInvestments = localStorage.getItem(`investments_${db.currentUser.username}`);
    return userInvestments ? JSON.parse(userInvestments) : [];
}

// Save user investments to localStorage - ISOLATED PER USER
function saveCurrentUserInvestments() {
    if (!db.currentUser || !db.currentUser.username) return;
    localStorage.setItem(`investments_${db.currentUser.username}`, JSON.stringify(investments));
}

// Save user balance to database
function saveCurrentUserBalance() {
    if (!db.currentUser) return;
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === db.currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].balance = db.currentUser.balance;
        db.saveUsers(users);
    }
}

// Delete investment - FOR ACTIVE INVESTMENTS ONLY
function deleteInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    if (investment.completed) {
        // For completed investments, just remove the record
        if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika?")) {
            investments = investments.filter(inv => inv.id !== investmentId);
            saveCurrentUserInvestments();
            
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
        }
    } else {
        // For active investments, refund money
        if (confirm("Unahakika unataka kufuta uwekezaji huu? Uwekezaji wako wa awali na faida yote itaongezwa kwenye balansi yako.")) {
            const currentProfit = calculateCurrentProfit(investment);
            const totalAmountToRefund = investment.cost + currentProfit;
            
            if (profitIntervals[investmentId]) {
                clearInterval(profitIntervals[investmentId]);
                delete profitIntervals[investmentId];
            }
            
            db.currentUser.balance += totalAmountToRefund;
            saveCurrentUserBalance();
            updateBalanceDisplays();
            
            investments = investments.filter(inv => inv.id !== investmentId);
            saveCurrentUserInvestments();
            
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification(`Uwekezaji umefutwa kikamilifu! TZS ${Math.round(totalAmountToRefund).toLocaleString()} zimeongezwa kwenye akaunti yako.`);
        }
    }
}

// Delete completed investment record only - NO MONEY TRANSACTION
function deleteCompletedInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !investment.completed) return;
    
    if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika? Hii itaondoa rekodi tu, hakuna fedha zitatoka kwenye akaunti yako.")) {
        investments = investments.filter(inv => inv.id !== investmentId);
        saveCurrentUserInvestments();
        
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
    }
}

// Complete investment automatically when end date is reached
function completeInvestment(investment) {
    if (investment.completed) return;
    
    const now = new Date();
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    
    if (now >= endDate) {
        investment.completed = true;
        investment.completionDate = new Date().toISOString();
        
        // Calculate total expected profit (not current profit)
        const totalProfit = calculateExpectedTotalProfit(investment);
        investment.finalProfit = totalProfit;
        
        // Add both original investment and total expected profit to user balance
        const totalAmount = investment.cost + totalProfit;
        db.currentUser.balance += totalAmount;
        saveCurrentUserBalance();
        
        // Stop profit calculation for this investment
        if (profitIntervals[investment.id]) {
            clearInterval(profitIntervals[investment.id]);
            delete profitIntervals[investment.id];
        }
        
        saveCurrentUserInvestments();
        updateBalanceDisplays();
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        showNotification(`Uwekezaji wako wa ${investment.mineral} umekamilika! TZS ${Math.round(totalAmount).toLocaleString()} zimeongezwa kwenye salio lako.`);
    }
}

// ========== DISPLAY FUNCTIONS ==========

// Format date
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Update investments display
function updateInvestmentsDisplay() {
    if (!investmentsContainer) return;
    
    investmentsContainer.innerHTML = '';
    
    if (investments.length === 0) {
        investmentsContainer.innerHTML = '<p>Huna uwekezaji wowote unaoendelea.</p>';
        return;
    }
    
    investments.forEach(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const now = new Date();
        const totalTime = investment.days * 24 * 60 * 60 * 1000;
        const elapsedTime = now - startDate;
        const progress = Math.min(100, (elapsedTime / totalTime) * 100);
        const remainingTime = Math.max(0, endDate - now);
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
        
        // Calculate current profit for display only
        const currentProfit = calculateCurrentProfit(investment);
        const expectedTotalProfit = calculateExpectedTotalProfit(investment);
        const currentProfitPercentage = ((currentProfit / investment.cost) * 100);
        const expectedProfitPercentage = ((expectedTotalProfit / investment.cost) * 100);
        
        const investmentCard = document.createElement('div');
        investmentCard.className = 'investment-card';
        
        if (investment.completed) {
            investmentCard.innerHTML = `
                <div class="investment-header">
                    <div class="investment-mineral">${investment.mineral}</div>
                    <div class="investment-amount">${investment.grams} gramu</div>
                </div>
                <div class="investment-details">
                    <div class="investment-duration">
                        <span>Hali:</span>
                        <span class="status-completed">UMEMALIZIKA</span>
                    </div>
                    <div class="investment-duration">
                        <span>Uwekezaji wa Awali:</span>
                        <span>TZS ${Math.round(investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-profit-percentage">
                        <span>Faida ya Mwisho:</span>
                        <span class="percentage positive">
                            TZS ${Math.round(investment.finalProfit || 0).toLocaleString()}
                        </span>
                    </div>
                    <div class="investment-total-return">
                        <span>Jumla ya Mapato:</span>
                        <span class="total-return">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-completion-date">
                        <span>Tarehe ya Kukamilika:</span>
                        <span>${formatDate(new Date(investment.completionDate))}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 100%; background: #27ae60;"></div>
                </div>
                <div class="profit-display">
                    <div>Uwekezaji Umekamilika</div>
                    <div class="current-profit" style="color: #27ae60;">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</div>
                    <div class="countdown">Zimeongezwa kwenye salio lako</div>
                </div>
                <div class="investment-actions">
                    <button class="delete-btn" onclick="deleteCompletedInvestment(${investment.id})">
                        Futa Rekodi
                    </button>
                </div>
                <div class="investment-note-completed">
                    <p><strong>Kumbuka:</strong> Uwekezaji wako umekamilika na fedha zote zimeongezwa kwenye salio lako. "Futa Rekodi" itaondoa rekodi tu, hakuna fedha zitatoka.</p>
                </div>
            `;
        } else {
            investmentCard.innerHTML = `
                <div class="investment-header">
                    <div class="investment-mineral">${investment.mineral}</div>
                    <div class="investment-amount">${investment.grams} gramu</div>
                </div>
                <div class="investment-details">
                    <div class="investment-duration">
                        <span>Muda wa Uwekezaji:</span>
                        <span>${investment.days} siku</span>
                    </div>
                    <div class="investment-rate">
                        <span>Kiwango cha Faida:</span>
                        <span>Jumatatu-Ijumaa: 3%, Jumamosi/Jumapili: 4%</span>
                    </div>
                    <div class="investment-duration">
                        <span>Uwekezaji wa Awali:</span>
                        <span>TZS ${Math.round(investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-profit-percentage">
                        <span>Faida ya Sasa:</span>
                        <span class="percentage ${currentProfit >= 0 ? 'positive' : 'negative'}">
                            TZS ${Math.round(currentProfit).toLocaleString()} (${currentProfitPercentage.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="investment-expected-profit">
                        <span>Faida Inayotarajiwa Mwishoni:</span>
                        <span class="expected-profit">TZS ${Math.round(expectedTotalProfit).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                    </div>
                    <div class="investment-total-expected">
                        <span>Jumla Inayotarajiwa Mwishoni:</span>
                        <span class="total-expected">TZS ${Math.round(expectedTotalProfit + investment.cost).toLocaleString()}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%;"></div>
                </div>
                <div class="profit-display">
                    <div>Faida Inakua Kilasiku</div>
                    <div class="current-profit">TZS ${Math.round(currentProfit).toLocaleString()}</div>
                    <div class="countdown">Siku ${remainingDays} zimebaki</div>
                </div>
                <div class="investment-actions">
                    <button class="delete-btn" onclick="deleteInvestment(${investment.id})">
                        Futa Uwekezaji & Pokea Fedha
                    </button>
                </div>
                <div class="investment-note">
                    <p><strong>Kumbuka:</strong> Faida yote na uwekezaji wako wa awali zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji.</p>
                </div>
            `;
        }
        
        investmentsContainer.appendChild(investmentCard);
    });
}

// Update investment history
function updateInvestmentHistory() {
    const investmentHistory = document.getElementById('investment-history');
    if (!investmentHistory) return;
    
    investmentHistory.innerHTML = '';
    
    if (investments.length === 0) {
        investmentHistory.innerHTML = '<p>Hakuna historia ya uwekezaji.</p>';
        return;
    }
    
    const sortedInvestments = [...investments].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    sortedInvestments.forEach(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const currentProfit = investment.completed ? (investment.finalProfit || 0) : calculateCurrentProfit(investment);
        const expectedTotalProfit = calculateExpectedTotalProfit(investment);
        const currentProfitPercentage = ((currentProfit / investment.cost) * 100);
        const expectedProfitPercentage = ((expectedTotalProfit / investment.cost) * 100);
        
        const historyCard = document.createElement('div');
        historyCard.className = `history-card ${investment.completed ? 'completed' : 'active'}`;
        
        historyCard.innerHTML = `
            <div class="history-header">
                <div class="history-mineral">${investment.mineral}</div>
                <div class="history-status ${investment.completed ? 'status-completed' : 'status-active'}">
                    ${investment.completed ? 'IMEMALIZIKA' : 'INAENDELEA'}
                </div>
            </div>
            <div class="history-details">
                <div class="history-amount">
                    <span>Kiasi:</span>
                    <span>${investment.grams}g (TZS ${Math.round(investment.cost).toLocaleString()})</span>
                </div>
                <div class="history-dates">
                    <div class="history-date">
                        <span>Tarehe ya Kuanza:</span>
                        <span>${formatDate(startDate)}</span>
                    </div>
                    <div class="history-date">
                        <span>Tarehe ya Kumaliza:</span>
                        <span>${formatDate(endDate)}</span>
                    </div>
                </div>
                <div class="history-duration">
                    <span>Muda:</span>
                    <span>${investment.days} siku</span>
                </div>
                ${investment.completed ? `
                <div class="history-profit">
                    <span>Faida ya Mwisho:</span>
                    <span class="profit-amount">TZS ${Math.round(investment.finalProfit || 0).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-total-return">
                    <span>Jumla ya Mapato:</span>
                    <span class="total-return">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</span>
                </div>
                <div class="history-completion-date">
                    <span>Tarehe ya Kukamilika:</span>
                    <span>${formatDate(new Date(investment.completionDate))}</span>
                </div>
                ` : `
                <div class="history-current-profit">
                    <span>Faida ya Sasa:</span>
                    <span class="current-profit">TZS ${Math.round(currentProfit).toLocaleString()} (${currentProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-expected-profit">
                    <span>Faida Inayotarajiwa Mwishoni:</span>
                    <span class="expected-profit">TZS ${Math.round(expectedTotalProfit).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-total-expected">
                    <span>Jumla Inayotarajiwa Mwishoni:</span>
                    <span class="total-expected">TZS ${Math.round(expectedTotalProfit + investment.cost).toLocaleString()}</span>
                </div>
                `}
            </div>
            <div class="history-actions">
                ${!investment.completed ? `
                <button class="delete-btn" onclick="deleteInvestment(${investment.id})">Futa Uwekezaji & Pokea Fedha</button>
                ` : `
                <button class="delete-btn" onclick="deleteCompletedInvestment(${investment.id})">Futa Rekodi</button>
                `}
            </div>
        `;
        
        investmentHistory.appendChild(historyCard);
    });
}

// Update profit breakdown
function updateProfitBreakdown() {
    const profitBreakdown = document.getElementById('profit-breakdown');
    if (!profitBreakdown) return;
    
    let totalInvested = 0;
    let totalCurrentProfit = 0;
    let totalExpectedProfit = 0;
    let totalCompletedProfit = 0;
    let totalCompletedInvestment = 0;
    
    investments.forEach(investment => {
        totalInvested += investment.cost;
        if (investment.completed) {
            totalCompletedProfit += investment.finalProfit || 0;
            totalCompletedInvestment += investment.cost;
        } else {
            totalCurrentProfit += calculateCurrentProfit(investment);
            totalExpectedProfit += calculateExpectedTotalProfit(investment);
        }
    });
    
    const totalActiveExpected = totalInvested - totalCompletedInvestment + totalExpectedProfit;
    const totalCompletedAmount = totalCompletedInvestment + totalCompletedProfit;
    const overallProfitPercentage = totalInvested > 0 ? ((totalCurrentProfit + totalCompletedProfit) / totalInvested) * 100 : 0;
    
    profitBreakdown.innerHTML = `
        <div class="profit-summary">
            <div class="profit-card">
                <h4>Jumla ya Uwekezaji</h4>
                <div class="profit-amount">TZS ${Math.round(totalInvested).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Faida ya Sasa</h4>
                <div class="profit-amount current">TZS ${Math.round(totalCurrentProfit).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Faida Inayotarajiwa</h4>
                <div class="profit-amount expected">TZS ${Math.round(totalExpectedProfit).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Jumla Inayotarajiwa</h4>
                <div class="profit-amount total">TZS ${Math.round(totalActiveExpected + totalCompletedAmount).toLocaleString()}</div>
            </div>
        </div>
        <div class="percentage-breakdown">
            <h4>Asilimia ya Mafanikio ya Uwekezaji</h4>
            <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${Math.min(100, overallProfitPercentage)}%"></div>
            </div>
            <div class="percentage-text">${overallProfitPercentage.toFixed(2)}% ya Faida (Jumla)</div>
        </div>
        <div class="profit-explanation">
            <h4>Maelezo ya Mfumo:</h4>
            <ul>
                <li><strong>Faida ya Sasa:</strong> Faida iliyokusanyika hadi sasa</li>
                <li><strong>Faida Inayotarajiwa:</strong> Faida inayotarajiwa kufikiwa mwisho wa uwekezaji</li>
                <li><strong>Jumla Inayotarajiwa:</strong> Uwekezaji wako wa awali + faida inayotarajiwa</li>
                <li><strong>Kumbuka:</strong> Faida yote na uwekezaji wako zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji</li>
            </ul>
        </div>
    `;
}

// ========== SYSTEM FUNCTIONS ==========

// Start profit calculation
function startProfitCalculation(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    profitIntervals[investmentId] = setInterval(() => {
        const now = new Date();
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        
        // Check if investment period has ended
        if (now >= endDate) {
            completeInvestment(investment);
        } else {
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
        }
    }, 1000);
}

// Update balance displays
function updateBalanceDisplays() {
    const profileBalance = document.getElementById('profile-balance');
    const profileBalanceDisplay = document.getElementById('profile-balance-display');
    const dashboardBalance = document.getElementById('dashboard-balance');
    const withdrawBalance = document.getElementById('withdraw-balance');
    
    if (profileBalance) profileBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (profileBalanceDisplay) profileBalanceDisplay.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (dashboardBalance) dashboardBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (withdrawBalance) withdrawBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    if (investmentModal && investmentModal.style.display === 'flex') {
        modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    }
}

// Show notification
function showNotification(message, isError = false) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            display: none;
            max-width: 300px;
            text-align: center;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Initialize investment system
function initInvestmentSystem() {
    investments = getCurrentUserInvestments();
    
    // Clear any existing intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    // Check for completed investments and complete them
    investments.forEach(investment => {
        if (!investment.completed) {
            const now = new Date();
            const startDate = new Date(investment.startTime);
            const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
            
            if (now >= endDate) {
                completeInvestment(investment);
            } else {
                startProfitCalculation(investment.id);
            }
        }
    });
    
    updateBalanceDisplays();
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
}

// Clear all intervals when user logs out
function clearInvestmentIntervals() {
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
}

// ========== INITIALIZATION ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for modal
    if (investmentGrams) {
        investmentGrams.addEventListener('input', calculateInvestmentReturn);
    }
    if (investmentDays) {
        investmentDays.addEventListener('input', calculateInvestmentReturn);
    }
    
    // Add event listeners for modal close
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeInvestmentModal);
    }
    
    // Close modal when clicking outside
    if (investmentModal) {
        investmentModal.addEventListener('click', function(e) {
            if (e.target === investmentModal) {
                closeInvestmentModal();
            }
        });
    }
});

// Export functions for global access
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.startInvestment = startInvestment;
window.calculateInvestmentReturn = calculateInvestmentReturn;
window.deleteInvestment = deleteInvestment;
window.deleteCompletedInvestment = deleteCompletedInvestment;
window.initInvestmentSystem = initInvestmentSystem;
window.clearInvestmentIntervals = clearInvestmentIntervals; 

        // Password Reset Manager - Single Step Approach
        const PasswordResetManager = {
            // Initialize the password reset system
            init() {
                this.bindEvents();
                this.updateEmailPreview();
            },
            
            // Bind all event listeners
            bindEvents() {
                // Real-time validation and preview updates
                const emailInput = document.getElementById('reset-email');
                const usernameInput = document.getElementById('reset-username');
                const phoneInput = document.getElementById('reset-phone');
                
                if (emailInput) {
                    emailInput.addEventListener('input', this.debounce(() => {
                        this.validateEmail();
                        this.updateEmailPreview();
                    }, 300));
                }
                
                if (usernameInput) {
                    usernameInput.addEventListener('input', this.debounce(() => {
                        this.updateEmailPreview();
                    }, 300));
                }
                
                if (phoneInput) {
                    phoneInput.addEventListener('input', this.debounce(() => {
                        this.updateEmailPreview();
                    }, 300));
                }
                
                // Send request button
                const sendRequestBtn = document.getElementById('send-request-btn');
                if (sendRequestBtn) {
                    sendRequestBtn.addEventListener('click', () => {
                        this.sendResetRequest();
                    });
                }
                
                // Reset form button
                const resetFormBtn = document.getElementById('reset-form-btn');
                if (resetFormBtn) {
                    resetFormBtn.addEventListener('click', () => {
                        this.resetForm();
                    });
                }
                
                // New request button
                const newRequestBtn = document.getElementById('new-request-btn');
                if (newRequestBtn) {
                    newRequestBtn.addEventListener('click', () => {
                        this.showResetForm();
                    });
                }
                
                // Enter key support
                document.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.closest('#reset-form')) {
                        this.sendResetRequest();
                    }
                });
            },
            
            // Validate email
            validateEmail() {
                const emailInput = document.getElementById('reset-email');
                const emailError = document.getElementById('email-error');
                const sendButton = document.getElementById('send-request-btn');
                
                if (!emailInput) return false;
                
                const email = emailInput.value.trim();
                const isValid = this.isValidEmail(email);
                
                if (emailError) {
                    emailError.style.display = isValid ? 'none' : 'block';
                }
                
                if (sendButton) {
                    sendButton.disabled = !isValid;
                }
                
                return isValid;
            },
            
            // Update email preview
            updateEmailPreview() {
                const emailPreview = document.getElementById('email-preview-content');
                if (!emailPreview) return;
                
                // Get current values
                const email = document.getElementById('reset-email')?.value || '';
                const username = document.getElementById('reset-username')?.value || '';
                const phone = document.getElementById('reset-phone')?.value || '';
                
                // Generate email content
                const emailContent = this.generateEmailContent(email, username, phone);
                emailPreview.textContent = emailContent;
                
                // Show/hide preview based on whether email is valid
                const emailPreviewContainer = document.getElementById('email-preview');
                if (emailPreviewContainer) {
                    if (this.isValidEmail(email)) {
                        emailPreviewContainer.style.display = 'block';
                    } else {
                        emailPreviewContainer.style.display = 'none';
                    }
                }
            },
            
            // Generate email content
            generateEmailContent(email, username, phone) {
                return `Dear MINING INVESTMENT Customer Support Team,

I am writing to request a password reset for my account on your website. I have forgotten my password and am unable to log in.

The account is registered under the following details:
Email Address: ${email}
Username: ${username || 'Not provided'}

Could you please send a password reset link or instructions to the email address associated with my account?

Thank you for your assistance.

Sincerely,
${email}

Phone Number: ${phone || 'Not provided'}`;
            },
            
            // Send reset request via email
            async sendResetRequest() {
                if (!this.validateEmail()) {
                    this.showToast('Please enter a valid email address', 'error');
                    return;
                }
                
                // Get current values
                const email = document.getElementById('reset-email')?.value || '';
                const username = document.getElementById('reset-username')?.value || '';
                const phone = document.getElementById('reset-phone')?.value || '';
                
                // Generate email content
                const emailContent = this.generateEmailContent(email, username, phone);
                const userIdentifier = username || email || 'User';
                const subject = `Account Password Reset Request - ${userIdentifier}`;
                
                // Create mailto link
                const mailtoLink = `mailto:mining.investment.tanzania@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailContent)}`;
                
                // Show loading state
                this.setLoadingState(true);
                
                try {
                    // Simulate processing delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Open email client
                    window.location.href = mailtoLink;
                    
                    // Show success message
                    this.showSuccessMessage();
                    this.showToast('Email client opened with pre-written message', 'success');
                    
                } catch (error) {
                    this.showToast('Failed to open email client. Please try again.', 'error');
                } finally {
                    this.setLoadingState(false);
                }
            },
            
            // Show success message
            showSuccessMessage() {
                const resetForm = document.getElementById('reset-form');
                const successMessage = document.getElementById('success-message');
                
                if (resetForm) resetForm.style.display = 'none';
                if (successMessage) successMessage.style.display = 'block';
            },
            
            // Show reset form
            showResetForm() {
                const resetForm = document.getElementById('reset-form');
                const successMessage = document.getElementById('success-message');
                
                if (resetForm) resetForm.style.display = 'block';
                if (successMessage) successMessage.style.display = 'none';
                
                this.resetForm();
            },
            
            // Reset form
            resetForm() {
                // Reset form inputs
                document.getElementById('reset-email').value = '';
                document.getElementById('reset-username').value = '';
                document.getElementById('reset-phone').value = '';
                
                // Reset validation states
                document.getElementById('email-error').style.display = 'none';
                document.getElementById('send-request-btn').disabled = true;
                
                // Update email preview
                this.updateEmailPreview();
                
                // Show toast confirmation
                this.showToast('Form has been reset', 'info');
            },
            
            // Set loading state
            setLoadingState(isLoading) {
                const sendButton = document.getElementById('send-request-btn');
                if (sendButton) {
                    if (isLoading) {
                        sendButton.disabled = true;
                        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Email...';
                    } else {
                        sendButton.disabled = !this.validateEmail();
                        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Password Reset Request';
                    }
                }
            },
            
            // Utility functions
            isValidEmail(email) {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            },
            
            debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            },
            
            showToast(message, type = 'info') {
                // Create toast element
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <div class="toast-content">
                        <i class="fas ${this.getToastIcon(type)}"></i>
                        <span>${message}</span>
                    </div>
                    <button class="toast-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Add to container
                const container = document.getElementById('toast-container') || this.createToastContainer();
                container.appendChild(toast);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 5000);
            },
            
            getToastIcon(type) {
                const icons = {
                    success: 'fa-check-circle',
                    error: 'fa-exclamation-circle',
                    warning: 'fa-exclamation-triangle',
                    info: 'fa-info-circle'
                };
                return icons[type] || 'fa-info-circle';
            },
            
            createToastContainer() {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
                return container;
            }
        };

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            PasswordResetManager.init();
        });
        
        document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    // Get all content sections
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to switch between sections
    function switchSection(targetId) {
        // Remove active class from all nav items and content sections
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding content section
        const activeNavItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        const activeContentSection = document.getElementById(targetId);
        
        if (activeNavItem && activeContentSection) {
            activeNavItem.classList.add('active');
            activeContentSection.classList.add('active');
        }
    }
    
    // Add click event listeners to all nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            switchSection(targetId);
        });
    });
});


// User Management Functions - Enhanced Version
function loadAdminUsers() {

    const users = db.getUsers();
    const tableBody = document.getElementById('users-table-body');
    const searchTerm = document.getElementById('user-search') ? document.getElementById('user-search').value.toLowerCase() : '';
    
    // Auto-create table if it doesn't exist
    if (!tableBody) {
        
        createUsersTable();
        return;
    }
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.referral_code && user.referral_code.toLowerCase().includes(searchTerm))
    );
    
    tableBody.innerHTML = '';
    
    let activeCount = 0;
    let inactiveCount = 0;
    let todaySignups = 0;
    const today = new Date().toDateString();
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Count stats
        if (user.status === 'active') activeCount++;
        else inactiveCount++;
        
        const userDate = new Date(user.join_date).toDateString();
        if (userDate === today) todaySignups++;
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-${user.status}">${user.status.toUpperCase()}</span>
            </td>
            <td>
                <span class="password-field">${user.password}</span>
                ${!user.is_admin ? `<button class="btn-action btn-view" onclick="resetPassword(${user.id})">Reset</button>` : ''}
            </td>
            <td>${user.referral_code || 'N/A'}</td>
            <td>${db.formatCurrency(user.balance)}</td>
            <td>${new Date(user.join_date).toLocaleDateString()}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewUserDetails(${user.id})">View</button>
                <button class="btn-action btn-edit" onclick="editUser(${user.id})">Edit</button>
                ${user.status === 'active' && !user.is_admin ? 
                    `<button class="btn-action btn-deactivate" onclick="toggleUserStatus(${user.id}, 'inactive')">Deactivate</button>` :
                    `<button class="btn-action btn-activate" onclick="toggleUserStatus(${user.id}, 'active')">Activate</button>`
                }
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update stats automatically
    updateUserStats(users.length, activeCount, inactiveCount, todaySignups);
    
    
}

// Auto-create users table if it doesn't exist
function createUsersTable() {
    const adminPanel = document.querySelector('.admin-panel') || document.getElementById('admin-panel');
    if (!adminPanel) {
        
        createAdminPanel();
        return;
    }
    
    const userManagementHTML = `
        <div class="user-management">
            <div class="management-header">
                <h2>User Management</h2>
                <div class="user-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-users-count">0</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-users-count">0</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="inactive-users-count">0</div>
                        <div class="stat-label">Inactive Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="today-signups-count">0</div>
                        <div class="stat-label">Today's Signups</div>
                    </div>
                </div>
            </div>
            
            <div class="search-box">
                <input type="text" id="user-search" placeholder="Search users by username, email, or referral code..." onkeyup="loadAdminUsers()">
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Password</th>
                            <th>Referral Code</th>
                            <th>Balance</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Users will be loaded here automatically -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- User Details Modal -->
        <div id="user-details-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeUserDetails()">&times;</span>
                <div id="user-details-content"></div>
            </div>
        </div>
        
        <!-- Edit User Modal -->
        <div id="edit-user-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeEditUser()">&times;</span>
                <div id="edit-user-content"></div>
            </div>
        </div>
    `;
    
    adminPanel.innerHTML = userManagementHTML;
    
    // Load users immediately after creating table
    setTimeout(() => loadAdminUsers(), 100);
}

// Auto-create admin panel if it doesn't exist
function createAdminPanel() {
    const mainContent = document.querySelector('.dashboard-content') || document.querySelector('.content-section.active');
    if (!mainContent) {
        
        return;
    }
    
    const adminPanelHTML = `
        <div class="admin-panel" id="admin-panel">
            <div class="admin-header">
                <h2><i class="fas fa-crown"></i> Admin Panel</h2>
                <div class="admin-nav">
                    <button class="admin-nav-btn active" onclick="showAdminSection('users')">User Management</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('investments')">Investments</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('transactions')">Transactions</button>
                </div>
            </div>
            <div class="admin-content" id="admin-content">
                <!-- User management will be loaded here automatically -->
            </div>
        </div>
    `;
    
    mainContent.innerHTML = adminPanelHTML;
    
    // Create users table after admin panel is created
    setTimeout(() => createUsersTable(), 100);
}

// Auto-update user statistics
function updateUserStats(total, active, inactive, today) {
    const elements = {
        'total-users-count': total,
        'active-users-count': active,
        'inactive-users-count': inactive,
        'today-signups-count': today
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Enhanced viewUserDetails with auto-investment loading
function viewUserDetails(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        
        return;
    }
    
    // Auto-load user investments
    const userInvestments = getUserInvestmentsForAdmin(user.username);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code || 'N/A'}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio (Auto-loaded)</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.username}', ${investment.id})">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.username}', ${investment.id})">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.username}', ${investment.id})">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations (Auto-loaded)</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Auto-initialize user management
function autoInitializeUserManagement() {
    
    
    // Check if admin panel button exists and add auto-load
    const adminBtn = document.getElementById('admin-panel-section');
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            
            setTimeout(() => {
                loadAdminUsers();
            }, 1000);
        });
    }
    
    // Auto-load users if we're already in admin panel
    if (window.location.hash === '#admin' || document.querySelector('.admin-panel')) {
        
        setTimeout(() => {
            loadAdminUsers();
        }, 500);
    }
    
    // Auto-refresh users every 30 seconds when in admin panel
    setInterval(() => {
        if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
            loadAdminUsers();
        }
    }, 30000);
}

// Enhanced editUser with auto-form population
function editUser(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('edit-user-content');
    if (!modalContent) {
        
        return;
    }
    
    modalContent.innerHTML = `
        <div class="edit-form">
            <h3>Edit User: ${user.username}</h3>
            <div class="form-group">
                <label for="edit-username">Username:</label>
                <input type="text" id="edit-username" value="${user.username}">
            </div>
            
            <div class="form-group">
                <label for="edit-email">Email:</label>
                <input type="email" id="edit-email" value="${user.email}">
            </div>
            
            <div class="form-group">
                <label for="edit-password">Password:</label>
                <input type="text" id="edit-password" value="${user.password}">
            </div>
            
            <div class="form-group">
                <label for="edit-status">Status:</label>
                <select id="edit-status">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="edit-balance">Balance (TZS):</label>
                <input type="number" id="edit-balance" value="${user.balance}">
            </div>
            
            <div class="form-group">
                <label for="edit-referral-code">Referral Code:</label>
                <input type="text" id="edit-referral-code" value="${user.referral_code || ''}">
            </div>
            
            <div class="form-actions">
                <button class="btn-action btn-activate" onclick="saveUserChanges(${user.id})">Save Changes</button>
                <button class="btn-action btn-deactivate" onclick="closeEditUser()">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('edit-user-modal').style.display = 'block';
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    
    setTimeout(autoInitializeUserManagement, 2000);
});

// Auto-refresh when coming back to the page
window.addEventListener('focus', function() {
    if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
        
        loadAdminUsers();
    }
});

function saveUserChanges(userId) {
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const status = document.getElementById('edit-status').value;
    const balance = parseFloat(document.getElementById('edit-balance').value);
    const referralCode = document.getElementById('edit-referral-code').value;
    
    // Validate inputs
    if (!username || !email || !password || !referralCode) {
        alert('Please fill all fields');
        return;
    }
    
    // Check if username or email already exists (excluding current user)
    const existingUser = users.find(u => 
        (u.username === username || u.email === email) && u.id !== userId
    );
    
    if (existingUser) {
        alert('Username or email already exists');
        return;
    }
    
    // Update user
    users[userIndex].username = username;
    users[userIndex].email = email;
    users[userIndex].password = password;
    users[userIndex].status = status;
    users[userIndex].balance = balance;
    users[userIndex].referral_code = referralCode;
    
    db.saveUsers(users);
    closeEditUser();
    loadAdminUsers();
    alert('User updated successfully');
}

function toggleUserStatus(userId, newStatus) {
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }
    
    if (users[userIndex].is_admin) {
        alert('Cannot deactivate admin users');
        return;
    }
    
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) {
        users[userIndex].status = newStatus;
        db.saveUsers(users);
        loadAdminUsers();
        alert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    }
}

function resetPassword(userId) {
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }
    
    const newPassword = prompt('Enter new password for user:');
    if (newPassword && newPassword.length >= 4) {
        users[userIndex].password = newPassword;
        db.saveUsers(users);
        loadAdminUsers();
        alert('Password reset successfully');
    } else if (newPassword) {
        alert('Password must be at least 4 characters long');
    }
}

function closeUserDetails() {
    document.getElementById('user-details-modal').style.display = 'none';
}

function closeEditUser() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

// Add search functionality
document.getElementById('user-search').addEventListener('input', loadAdminUsers);

// Close modals when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('user-details-modal');
    const editModal = document.getElementById('edit-user-modal');
    
    if (event.target === userModal) {
        closeUserDetails();
    }
    if (event.target === editModal) {
        closeEditUser();
    }
}



// Fixed viewUserDetails function
function viewUserDetails(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        
        return;
    }
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="user-operations">
            <h4>User Operations</h4>
            
            <div class="operation-section">
                <h5>Investments (${user.investments ? user.investments.length : 0})</h5>
                ${user.investments && user.investments.length > 0 ? 
                    user.investments.map(inv => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Amount:</strong> ${db.formatCurrency(inv.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(inv.date).toLocaleString()}</p>
                            <p><strong>Plan:</strong> ${inv.plan || 'Standard'}</p>
                        </div>
                    `).join('') : 
                    '<p>No investments</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Fixed editUser function
function editUser(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('edit-user-content');
    if (!modalContent) {
        
        return;
    }
    
    modalContent.innerHTML = `
        <div class="edit-form">
            <div class="form-group">
                <label for="edit-username">Username:</label>
                <input type="text" id="edit-username" value="${user.username}">
            </div>
            
            <div class="form-group">
                <label for="edit-email">Email:</label>
                <input type="email" id="edit-email" value="${user.email}">
            </div>
            
            <div class="form-group">
                <label for="edit-password">Password:</label>
                <input type="text" id="edit-password" value="${user.password}">
            </div>
            
            <div class="form-group">
                <label for="edit-status">Status:</label>
                <select id="edit-status">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="edit-balance">Balance (TZS):</label>
                <input type="number" id="edit-balance" value="${user.balance}">
            </div>
            
            <div class="form-group">
                <label for="edit-referral-code">Referral Code:</label>
                <input type="text" id="edit-referral-code" value="${user.referral_code}">
            </div>
            
            <button class="btn-action btn-activate" onclick="saveUserChanges(${user.id})">Save Changes</button>
            <button class="btn-action btn-deactivate" onclick="closeEditUser()">Cancel</button>
        </div>
    `;
    
    document.getElementById('edit-user-modal').style.display = 'block';
}

// Close modal functions
function closeUserDetails() {
    const modal = document.getElementById('user-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeEditUser() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('user-details-modal');
    const editModal = document.getElementById('edit-user-modal');
    
    if (event.target === userModal) {
        closeUserDetails();
    }
    if (event.target === editModal) {
        closeEditUser();
    }
}

// Enhanced viewUserDetails function with investment tracking
function viewUserDetails(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        
        return;
    }
    
    // Get user's investments from localStorage
    const userInvestments = getUserInvestmentsForAdmin(user.username);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.username}', ${investment.id})">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.username}', ${investment.id})">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.username}', ${investment.id})">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Helper function to get user investments for admin view
function getUserInvestmentsForAdmin(username) {
    if (!username) return [];
    const userInvestments = localStorage.getItem(`investments_${username}`);
    return userInvestments ? JSON.parse(userInvestments) : [];
}

// Helper function to save user investments for admin actions
function saveUserInvestmentsForAdmin(username, investments) {
    if (!username) return;
    localStorage.setItem(`investments_${username}`, JSON.stringify(investments));
}

// Enhanced investment statistics calculation
function calculateUserInvestmentStats(user, userInvestments) {
    if (!userInvestments || userInvestments.length === 0) {
        return {
            totalInvested: 0,
            activeInvestments: 0,
            totalProfit: 0,
            availableProfit: 0,
            completedInvestments: 0,
            pendingInvestments: 0,
            totalReferrals: user.referrals ? user.referrals.length : 0,
            totalTransactions: user.transactions ? user.transactions.length : 0
        };
    }

    let totalInvested = 0;
    let activeInvestments = 0;
    let totalProfit = 0;
    let availableProfit = 0;
    let completedInvestments = 0;
    let pendingInvestments = 0;

    userInvestments.forEach(investment => {
        totalInvested += investment.cost;
        const profit = calculateCurrentProfit(investment);
        totalProfit += profit;

        if (investment.completed) {
            completedInvestments++;
        } else {
            activeInvestments++;
            availableProfit += profit;
        }
    });

    return {
        totalInvested,
        activeInvestments,
        totalProfit,
        availableProfit,
        completedInvestments,
        pendingInvestments,
        totalReferrals: user.referrals ? user.referrals.length : 0,
        totalTransactions: user.transactions ? user.transactions.length : 0
    };
}

// Admin investment management functions
function adminCompleteInvestment(username, investmentId) {
    if (!confirm('Mark this investment as completed? The user will receive any remaining profits.')) {
        return;
    }

    const userInvestments = getUserInvestmentsForAdmin(username);
    const investmentIndex = userInvestments.findIndex(inv => inv.id === investmentId);
    
    if (investmentIndex === -1) {
        alert('Investment not found');
        return;
    }

    const investment = userInvestments[investmentIndex];
    const finalProfit = calculateCurrentProfit(investment);
    
    // Update investment status
    userInvestments[investmentIndex].completed = true;
    userInvestments[investmentIndex].finalProfit = finalProfit;
    
    // Update user balance in database
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        users[userIndex].balance += investment.cost + finalProfit;
        
        // Add transaction record
        if (!users[userIndex].transactions) {
            users[userIndex].transactions = [];
        }
        users[userIndex].transactions.push({
            type: 'investment_completion',
            amount: investment.cost + finalProfit,
            date: new Date().toISOString(),
            description: `Investment completion - ${investment.mineral}`
        });
        
        db.saveUsers(users);
    }

    saveUserInvestmentsForAdmin(username, userInvestments);
    
    // Refresh the view
    const user = users.find(u => u.username === username);
    if (user) {
        viewUserDetails(user.id);
    }
    
    alert('Investment marked as completed successfully!');
}

function adminCancelInvestment(username, investmentId) {
    if (!confirm('Cancel this investment? The user will receive a refund of their principal amount and current profit.')) {
        return;
    }

    const userInvestments = getUserInvestmentsForAdmin(username);
    const investmentIndex = userInvestments.findIndex(inv => inv.id === investmentId);
    
    if (investmentIndex === -1) {
        alert('Investment not found');
        return;
    }

    const investment = userInvestments[investmentIndex];
    const currentProfit = calculateCurrentProfit(investment);
    const totalRefund = investment.cost + currentProfit;
    
    // Update user balance in database
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        users[userIndex].balance += totalRefund;
        
        // Add transaction record
        if (!users[userIndex].transactions) {
            users[userIndex].transactions = [];
        }
        users[userIndex].transactions.push({
            type: 'investment_refund',
            amount: totalRefund,
            date: new Date().toISOString(),
            description: `Investment cancellation - ${investment.mineral}`
        });
        
        db.saveUsers(users);
    }

    // Remove investment
    userInvestments.splice(investmentIndex, 1);
    saveUserInvestmentsForAdmin(username, userInvestments);
    
    // Refresh the view
    const user = users.find(u => u.username === username);
    if (user) {
        viewUserDetails(user.id);
    }
    
    alert(`Investment cancelled! TZS ${Math.round(totalRefund).toLocaleString()} refunded to user.`);
}

function adminViewInvestmentDetails(username, investmentId) {
    const userInvestments = getUserInvestmentsForAdmin(username);
    const investment = userInvestments.find(inv => inv.id === investmentId);
    
    if (!investment) {
        alert('Investment not found');
        return;
    }

    const profit = calculateCurrentProfit(investment);
    const progress = calculateInvestmentProgress(investment);
    const daysPassed = getDaysPassed(investment);
    const daysRemaining = getDaysRemaining(investment);
    const totalDays = getTotalDays(investment);
    const profitPercentage = ((profit / investment.cost) * 100);

    const detailsHtml = `
        <div class="user-info">
            <h4>Investment Details - ${username}</h4>
            <p><strong>Investment ID:</strong> ${investment.id}</p>
            <p><strong>Mineral:</strong> ${investment.mineral}</p>
            <p><strong>Grams:</strong> ${investment.grams}g</p>
            <p><strong>Total Amount:</strong> ${db.formatCurrency(investment.cost)}</p>
            <p><strong>Status:</strong> <span class="status-${investment.completed ? 'completed' : 'active'}">${investment.completed ? 'COMPLETED' : 'ACTIVE'}</span></p>
            <p><strong>Duration:</strong> ${investment.days} days</p>
            <p><strong>Start Date:</strong> ${new Date(investment.startTime).toLocaleString()}</p>
            <p><strong>End Date:</strong> ${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleString()}</p>
            <p><strong>Progress:</strong> ${progress}% (${daysPassed}/${totalDays} days)</p>
            <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
            <p><strong>Current Profit:</strong> ${db.formatCurrency(profit)}</p>
            <p><strong>Profit Percentage:</strong> <span style="color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">${profitPercentage.toFixed(2)}%</span></p>
            <p><strong>Total Value:</strong> ${db.formatCurrency(investment.cost + profit)}</p>
            ${investment.collectedProfits ? `
                <p><strong>Collected Profits:</strong> ${db.formatCurrency(investment.collectedProfits)}</p>
            ` : ''}
        </div>
    `;

    // Create a modal for investment details
    const modal = document.createElement('div');
    modal.className = 'user-details-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
            ${detailsHtml}
        </div>
    `;
    document.body.appendChild(modal);
}

// Investment calculation functions (from your system)
function calculateCurrentProfit(investment) {
    const now = new Date();
    const startDate = new Date(investment.startTime);
    return now >= startDate ? calculateProfitForPeriod(investment.cost, startDate, now) : 0;
}

function calculateProfitForPeriod(principal, startDate, endDate) {
    let currentAmount = principal;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
        const dailyRate = getDailyReturnRate(currentDate);
        const secondsInDay = 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + dailyRate, 1 / secondsInDay) - 1;
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const secondsToProcess = Math.min((end - currentDate) / 1000, (endOfDay - currentDate) / 1000);
        
        if (secondsToProcess > 0) {
            currentAmount = currentAmount * Math.pow(1 + perSecondRate, secondsToProcess);
        }
        
        currentDate = new Date(Math.min(endOfDay.getTime() + 1000, end.getTime()));
    }
    
    return currentAmount - principal;
}

function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03;
}

function calculateInvestmentProgress(investment) {
    const daysPassed = getDaysPassed(investment);
    const totalDays = investment.days;
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
}

function getDaysPassed(investment) {
    const startDate = new Date(investment.startTime);
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getDaysRemaining(investment) {
    const currentDate = new Date();
    const endDate = new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000);
    const diffTime = endDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getTotalDays(investment) {
    return investment.days;
} 


 
 
 
 
 
 
 
// Update transaction summary cards
function updateTransactionSummary(transactions) {
    const totals = {
        deposit: 0,
        withdrawal: 0,
        investment: 0,
        bonus: 0
    };
    
    transactions.forEach(transaction => {
        if (transaction.status === 'approved') {
            switch(transaction.type) {
                case 'deposit':
                    totals.deposit += transaction.amount;
                    break;
                case 'withdrawal':
                    totals.withdrawal += transaction.amount;
                    break;
                case 'investment':
                    totals.investment += transaction.amount;
                    break;
                case 'bonus':
                case 'referral':
                    totals.bonus += transaction.amount;
                    break;
            }
        }
    });
    
    document.getElementById('total-deposits-summary').textContent = formatCurrency(totals.deposit);
    document.getElementById('total-withdrawals-summary').textContent = formatCurrency(totals.withdrawal);
    document.getElementById('total-investments-summary').textContent = formatCurrency(totals.investment);
    document.getElementById('total-bonus-summary').textContent = formatCurrency(totals.bonus);
}

// Filter transactions based on current filters
function filterTransactions() {
    const typeFilter = document.getElementById('transaction-filter').value;
    const periodFilter = document.getElementById('period-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
    
    let filteredTransactions = currentTransactions.filter(transaction => {
        // Type filter
        if (typeFilter !== 'all' && transaction.type !== typeFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && transaction.status !== statusFilter) {
            return false;
        }
        
        // Period filter
        if (periodFilter !== 'all') {
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            
            switch(periodFilter) {
                case 'today':
                    if (transactionDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (transactionDate < weekAgo) return false;
                    break;
                case 'month':
                    if (transactionDate.getMonth() !== now.getMonth() || 
                        transactionDate.getFullYear() !== now.getFullYear()) return false;
                    break;
                case 'year':
                    if (transactionDate.getFullYear() !== now.getFullYear()) return false;
                    break;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const searchableText = [
                transaction.type,
                transaction.amount.toString(),
                formatCurrency(transaction.amount),
                transaction.status,
                transaction.details?.description || '',
                formatDate(transaction.date)
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sort transactions
    sortTransactionArray(filteredTransactions);
    
    // Display transactions
    displayTransactions(filteredTransactions);
}

// Sort transaction array
function sortTransactionArray(transactions) {
    transactions.sort((a, b) => {
        let aValue, bValue;
        
        switch(currentSortField) {
            case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;
            case 'amount':
                aValue = a.amount;
                bValue = b.amount;
                break;
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                aValue = new Date(a.date);
                bValue = new Date(b.date);
        }
        
        if (currentSortDirection === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
    });
}

// Sort transactions by field
function sortTransactions(field) {
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'desc';
    }
    
    // Update sort indicators
    document.querySelectorAll('.transactions-table th i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentHeader = document.querySelector(`.transactions-table th[onclick="sortTransactions('${field}')"]`);
    if (currentHeader) {
        const icon = currentHeader.querySelector('i');
        if (icon) {
            icon.className = currentSortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
    
    filterTransactions();
}

// Display transactions in the table
function displayTransactions(transactions) {
    const tbody = document.getElementById('transaction-history-body');
    const noTransactions = document.getElementById('no-transactions');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '';
        noTransactions.style.display = 'block';
        document.getElementById('transaction-pagination').style.display = 'none';
        return;
    }
    
    noTransactions.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(transactions.length / transactionsPerPage);
    const startIndex = (currentTransactionPage - 1) * transactionsPerPage;
    const endIndex = Math.min(startIndex + transactionsPerPage, transactions.length);
    const pageTransactions = transactions.slice(startIndex, endIndex);
    
    // Generate table rows
    let html = '';
    pageTransactions.forEach(transaction => {
        const statusClass = getStatusClass(transaction.status);
        const typeIcon = getTransactionTypeIcon(transaction.type);
        
        html += `
            <tr class="transaction-row">
                <td>${formatDate(transaction.date)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="${typeIcon}"></i>
                        <span>${getTransactionTypeLabel(transaction.type)}</span>
                    </div>
                </td>
                <td>
                    <div class="${transaction.type === 'withdrawal' ? 'text-danger' : 'text-success'}">
                        ${transaction.type === 'withdrawal' ? '-' : '+'} ${formatCurrency(transaction.amount)}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${getStatusLabel(transaction.status)}
                    </span>
                </td>
                <td class="transaction-details" title="${transaction.details?.description || 'No description'}">
                    ${transaction.details?.description || 'No description'}
                </td>
                <td>
                    <button class="btn-receipt" onclick="viewTransactionDetails(${transaction.id})">
                        <i class="fas fa-eye"></i> Angalia
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Update pagination
    updatePagination(totalPages);
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById('transaction-pagination');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    prevBtn.disabled = currentTransactionPage === 1;
    nextBtn.disabled = currentTransactionPage === totalPages;
    
    // Generate page numbers
    let pageHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentTransactionPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `
            <div class="page-number ${i === currentTransactionPage ? 'active' : ''}" 
                 onclick="goToPage(${i})">${i}</div>
        `;
    }
    
    pageNumbers.innerHTML = pageHtml;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(currentTransactions.length / transactionsPerPage);
    const newPage = currentTransactionPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentTransactionPage = newPage;
        filterTransactions();
    }
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(currentTransactions.length / transactionsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentTransactionPage = page;
        filterTransactions();
    }
}

// Setup transaction search
function setupTransactionSearch() {
    const searchInput = document.getElementById('transaction-search');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterTransactions();
        }, 300);
    });
}

// View transaction details
function viewTransactionDetails(transactionId) {
    const transaction = currentTransactions.find(t => t.id === transactionId);
    
    if (!transaction) return;
    
    // Create modal content
    const modalContent = `
        <div class="transaction-details-modal">
            <h3>Maelezo ya Muamala</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Aina ya Muamala:</label>
                    <span>${getTransactionTypeLabel(transaction.type)}</span>
                </div>
                <div class="detail-item">
                    <label>Kiasi:</label>
                    <span class="${transaction.type === 'withdrawal' ? 'text-danger' : 'text-success'}">
                        ${transaction.type === 'withdrawal' ? '-' : '+'} ${formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="detail-item">
                    <label>Hali:</label>
                    <span class="status-badge ${getStatusClass(transaction.status)}">
                        ${getStatusLabel(transaction.status)}
                    </span>
                </div>
                <div class="detail-item">
                    <label>Tarehe:</label>
                    <span>${formatDate(transaction.date)}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Maelezo:</label>
                    <span>${transaction.details?.description || 'Hakuna maelezo'}</span>
                </div>
                ${transaction.details?.method ? `
                <div class="detail-item">
                    <label>Njia:</label>
                    <span>${transaction.details.method}</span>
                </div>
                ` : ''}
                ${transaction.details?.account ? `
                <div class="detail-item">
                    <label>Akaunti:</label>
                    <span>${transaction.details.account}</span>
                </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="printTransaction(${transaction.id})">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">
                    Funga
                </button>
            </div>
        </div>
    `;
    
    // Show modal (you'll need to implement your modal system)
    showCustomModal('Maelezo ya Muamala', modalContent);
}

// Export transaction history
function exportTransactionHistory() {
    if (currentTransactions.length === 0) {
        alert('Hakuna miradi ya kusasisha bado.');
        return;
    }
    
    // Create CSV content
    let csvContent = "Tarehe,Aina,Kiasi,Hali,Maelezo\n";
    
    currentTransactions.forEach(transaction => {
        const row = [
            formatDate(transaction.date),
            getTransactionTypeLabel(transaction.type),
            transaction.amount,
            getStatusLabel(transaction.status),
            `"${(transaction.details?.description || '').replace(/"/g, '""')}"`
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historia_ya_miradi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper functions
function getTransactionTypeIcon(type) {
    switch(type) {
        case 'deposit': return 'fas fa-money-bill-wave';
        case 'withdrawal': return 'fas fa-wallet';
        case 'investment': return 'fas fa-chart-line';
        case 'bonus': return 'fas fa-gift';
        case 'referral': return 'fas fa-users';
        default: return 'fas fa-exchange-alt';
    }
}

function getTransactionTypeLabel(type) {
    switch(type) {
        case 'deposit': return 'Wekezo';
        case 'withdrawal': return 'Mito';
        case 'investment': return 'Uwekezaji';
        case 'bonus': return 'Zawadi';
        case 'referral': return 'Kipato cha Mkufunzi';
        default: return type;
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'approved': return 'status-approved';
        case 'pending': return 'status-pending';
        case 'failed': return 'status-rejected';
        default: return 'status-unknown';
    }
}

function getStatusLabel(status) {
    switch(status) {
        case 'approved': return 'Imekamilika';
        case 'pending': return 'Inasubiri';
        case 'failed': return 'Imeshindwa';
        default: return status;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS'
    }).format(amount);
}

// Initialize when the section is shown
document.addEventListener('DOMContentLoaded', function() {
    // You'll need to integrate this with your existing navigation system
    // For example, when the history section is shown:
    // initTransactionHistory();
});

// Super Admin JavaScript functionality

// Initialize super admin dashboard
function initSuperAdminDashboard() {
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
}

// Load super admin data
function loadSuperAdminData() {
    updateSuperAdminStats();
    loadAdminsList();
    loadTasks();
    loadSystemActivities();
}

// Update super admin statistics
function updateSuperAdminStats() {
    const users = db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const activeAdmins = admins.filter(admin => admin.status === 'active');
    const pendingTransactions = db.getPendingTransactions();
    
    document.getElementById('super-total-users').textContent = users.length;
    document.getElementById('active-admins-count').textContent = activeAdmins.length;
    document.getElementById('pending-approvals-count').textContent = pendingTransactions.length;
    document.getElementById('total-admins-count').textContent = admins.length;
    document.getElementById('active-admins').textContent = activeAdmins.length;
}

// Load admins list
function loadAdminsList() {
    const users = db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const tbody = document.getElementById('admins-table-body');
    
    tbody.innerHTML = '';
    
    admins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.id}</td>
            <td>${admin.username}</td>
            <td>${admin.email}</td>
            <td>${admin.admin_role || 'Admin'}</td>
            <td>${getAdminPermissions(admin)}</td>
            <td><span class="status-${admin.status}">${admin.status}</span></td>
            <td>${formatDate(admin.last_active)}</td>
            <td>
                <button class="btn-action view" onclick="viewAdminDetails(${admin.id})">View</button>
                <button class="btn-action edit" onclick="editAdmin(${admin.id})">Edit</button>
                ${admin.email !== 'harunihilson@gmail.com' ? 
                    `<button class="btn-action delete" onclick="deleteAdmin(${admin.id})">Remove</button>` : 
                    '<span style="color: #666;">Super Admin</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get admin permissions
function getAdminPermissions(admin) {
    if (!admin.permissions) return 'Full Access';
    return admin.permissions.join(', ');
}

// Open add admin modal
function openAddAdminModal() {
    openModal('add-admin-modal');
}

// Create new admin
function createNewAdmin() {
    const email = document.getElementById('new-admin-email').value;
    const username = document.getElementById('new-admin-username').value;
    const password = document.getElementById('new-admin-password').value;
    const role = document.getElementById('new-admin-role').value;
    
    const permissionCheckboxes = document.querySelectorAll('input[name="admin-permissions"]:checked');
    const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
    
    if (!email || !username || !password) {
        alert('Please fill all required fields');
        return;
    }
    
    // Check if user already exists
    const existingUser = db.findUserByEmailOrUsername(email);
    if (existingUser) {
        // Convert existing user to admin
        existingUser.is_admin = true;
        existingUser.admin_role = role;
        existingUser.permissions = permissions;
        updateUserInDatabase(existingUser);
    } else {
        // Create new admin user
        const newAdmin = {
            email: email,
            username: username,
            password: password,
            is_admin: true,
            admin_role: role,
            permissions: permissions,
            status: 'active',
            join_date: new Date().toISOString(),
            last_active: new Date().toISOString()
        };
        db.createUser(newAdmin);
    }
    
    closeModal('add-admin-modal');
    loadAdminsList();
    updateSuperAdminStats();
    alert('Admin created successfully!');
}

// View admin details
function viewAdminDetails(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin) {
        const modalContent = `
            <h3>Admin Details</h3>
            <div class="user-info">
                <p><strong>Username:</strong> ${admin.username}</p>
                <p><strong>Email:</strong> ${admin.email}</p>
                <p><strong>Role:</strong> ${admin.admin_role || 'Admin'}</p>
                <p><strong>Status:</strong> ${admin.status}</p>
                <p><strong>Join Date:</strong> ${formatDate(admin.join_date)}</p>
                <p><strong>Last Active:</strong> ${formatDate(admin.last_active)}</p>
                <p><strong>Permissions:</strong> ${getAdminPermissions(admin)}</p>
            </div>
        `;
        
        showCustomModal('Admin Details', modalContent);
    }
}

// Edit admin
function editAdmin(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email !== 'harunihilson@gmail.com') {
        const modalContent = `
            <h3>Edit Admin</h3>
            <div class="form-group">
                <label>Role</label>
                <select id="edit-admin-role">
                    <option value="support" ${admin.admin_role === 'support' ? 'selected' : ''}>Support Admin</option>
                    <option value="approval" ${admin.admin_role === 'approval' ? 'selected' : ''}>Approval Admin</option>
                    <option value="financial" ${admin.admin_role === 'financial' ? 'selected' : ''}>Financial Admin</option>
                    <option value="full" ${admin.admin_role === 'full' ? 'selected' : ''}>Full Admin</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="edit-admin-status">
                    <option value="active" ${admin.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${admin.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="saveAdminChanges(${adminId})">Save Changes</button>
        `;
        
        showCustomModal('Edit Admin', modalContent);
    } else {
        alert('Cannot edit super admin account');
    }
}

// Save admin changes
function saveAdminChanges(adminId) {
    const users = db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin) {
        admin.admin_role = document.getElementById('edit-admin-role').value;
        admin.status = document.getElementById('edit-admin-status').value;
        
        updateUserInDatabase(admin);
        closeCustomModal();
        loadAdminsList();
        alert('Admin updated successfully!');
    }
}

// Delete admin
function deleteAdmin(adminId) {
    if (confirm('Are you sure you want to remove this admin?')) {
        const users = db.getUsers();
        const adminIndex = users.findIndex(user => user.id === adminId);
        
        if (adminIndex !== -1) {
            users[adminIndex].is_admin = false;
            delete users[adminIndex].admin_role;
            delete users[adminIndex].permissions;
            
            db.saveUsers(users);
            loadAdminsList();
            updateSuperAdminStats();
            alert('Admin removed successfully!');
        }
    }
}

// Task Management Functions
function openCreateTaskModal() {
    // Populate assignee dropdown with admins
    const users = db.getUsers();
    const admins = users.filter(user => user.is_admin && user.status === 'active');
    const assigneeSelect = document.getElementById('task-assignee');
    
    assigneeSelect.innerHTML = '';
    admins.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.id;
        option.textContent = admin.username;
        assigneeSelect.appendChild(option);
    });
    
    openModal('create-task-modal');
}

function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const assigneeId = document.getElementById('task-assignee').value;
    const priority = document.getElementById('task-priority').value;
    const deadline = document.getElementById('task-deadline').value;
    
    if (!title || !description || !assigneeId || !deadline) {
        alert('Please fill all required fields');
        return;
    }
    
    const task = {
        id: generateTaskId(),
        title: title,
        description: description,
        assignee_id: parseInt(assigneeId),
        priority: priority,
        status: 'pending',
        created_at: new Date().toISOString(),
        deadline: deadline,
        created_by: db.currentUser.id
    };
    
    saveTask(task);
    closeModal('create-task-modal');
    loadTasks();
    alert('Task created successfully!');
}

function loadTasks() {
    const tasks = getTasks();
    const tasksList = document.getElementById('tasks-list');
    
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.status}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>Assigned to: ${getUsernameById(task.assignee_id)}</span>
                <span>Deadline: ${formatDate(task.deadline)}</span>
                <span>Status: ${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'in-progress')">Start</button>
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'completed')">Complete</button>
                <button class="btn-action delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        tasksList.appendChild(taskElement);
    });
    
    updateTaskStats();
}

// System Monitoring Functions
function startRealTimeUpdates() {
    // Update system stats every 30 seconds
    setInterval(() => {
        updateSuperAdminStats();
        updateSystemLogs();
    }, 30000);
}

function updateSystemLogs() {
    const logsContainer = document.getElementById('system-logs');
    const currentTime = new Date().toLocaleTimeString();
    
    // Add a sample log entry (in real implementation, this would come from server)
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-time">${currentTime}</span>
        <span class="log-message">System check completed - All services running normally</span>
    `;
    
    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
    
    // Keep only last 10 log entries
    if (logsContainer.children.length > 10) {
        logsContainer.removeChild(logsContainer.lastChild);
    }
}

// Utility Functions
function generateTaskId() {
    return Date.now();
}

function getTasks() {
    const tasks = JSON.parse(localStorage.getItem('admin_tasks') || '[]');
    return tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function saveTask(task) {
    const tasks = getTasks();
    tasks.push(task);
    localStorage.setItem('admin_tasks', JSON.stringify(tasks));
}

function getUsernameById(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown';
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
}

function showCustomModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeCustomModal()">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
}

function closeCustomModal() {
    const modal = document.querySelector('.modal:last-child');
    if (modal) {
        modal.remove();
    }
}

function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section and activate corresponding nav item
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
}

  
// Show super admin dashboard
function showSuperAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'block';
    
    initSuperAdminDashboard();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Your existing initialization code...
    
    // Add super admin initialization if super admin is logged in
    if (db.currentUser && db.currentUser.email === 'harunihilson@gmail.com') {
        showSuperAdminDashboard();
    }
});

// Add a function to manually add the super admin if needed
function addSuperAdminManually() {
    const users = db.getUsers();
    
    // Check if kingharuni420 already exists
    const kingHaruniExists = users.some(user => user.email === 'kingharuni420@gmail.com');
    
    if (!kingHaruniExists) {
        const superAdmin = {
            id: db.getNextId(),
            username: 'kingharuni',
            email: 'kingharuni420@gmail.com',
            password: 'Rehema@mam',
            admin_password: 'Rehema@mam',
            referral_code: 'KING001',
            referred_by: null,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: true,
            is_super_admin: true,
            admin_role: 'super_admin',
            permissions: ['all'],
            balance: 10000000,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false
        };
        
        users.push(superAdmin);
        db.saveUsers(users);
        
        alert('Super admin account created successfully! You can now login with kingharuni420@gmail.com and password Rehema@mam');
    } else {
        alert('Super admin account already exists!');
    }
}

// Update the DOMContentLoaded to ensure super admin exists
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database first
    db.initDatabase();
    
    // Initialize UI elements
    initLoginTabs();
    initDepositSection();
    initWithdrawalSection();
    initNavigation();
    
    // Check if user is already logged in
    if (db.currentUser) {
        if (db.isSuperAdmin(db.currentUser)) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
    
    // Auto-detect admin email for admin password field
    document.getElementById('login-email').addEventListener('input', function() {
        const email = this.value;
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (db.isAdminEmail(email)) {
            adminPasswordSection.style.display = 'block';
            
            // If it's super admin email, show special message
            if (email.toLowerCase() === 'kingharuni420@gmail.com') {
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Super Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter super admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                        <i class="fas fa-crown"></i> Super Admin Access - Full System Control
                    </p>
                `;
            } else {
                // Regular admin
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--warning); margin-top: 10px;">
                        <i class="fas fa-user-shield"></i> Admin access requires special authorization
                    </p>
                `;
            }
        } else {
            adminPasswordSection.style.display = 'none';
        }
    });
});

// Define the missing functions

// Update Task Stats Function
function updateTaskStats() {
    const tasks = getTasks();
    
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    
    // Update DOM elements if they exist
    const pendingTasksElement = document.getElementById('pending-tasks-count');
    const progressTasksElement = document.getElementById('progress-tasks-count');
    const completedTasksElement = document.getElementById('completed-tasks-count');
    
    if (pendingTasksElement) pendingTasksElement.textContent = pendingTasks;
    if (progressTasksElement) progressTasksElement.textContent = inProgressTasks;
    if (completedTasksElement) completedTasksElement.textContent = completedTasks;
}

// Backup System Function
function backupSystem() {
    // Show loading state
    const backupBtn = document.querySelector('[onclick="backupSystem()"]');
    const originalText = backupBtn.innerHTML;
    backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing Up...';
    backupBtn.disabled = true;
    
    // Simulate backup process
    setTimeout(() => {
        // Get all data from localStorage
        const backupData = {
            mining_users: localStorage.getItem('mining_users'),
            mining_next_id: localStorage.getItem('mining_next_id'),
            mining_next_transaction_id: localStorage.getItem('mining_next_transaction_id'),
            admin_tasks: localStorage.getItem('admin_tasks'),
            admin_chats: localStorage.getItem('admin_chats'),
            system_settings: localStorage.getItem('system_settings'),
            backup_timestamp: new Date().toISOString()
        };
        
        // Create a downloadable backup file
        const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });
        
        const backupUrl = URL.createObjectURL(backupBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = backupUrl;
        downloadLink.download = `mining_system_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(backupUrl);
        
        // Restore button state
        backupBtn.innerHTML = originalText;
        backupBtn.disabled = false;
        
        // Show success message
        showNotification('System backup completed and downloaded successfully!', 'success');
        
        // Log backup event
        
    }, 2000);
}

// Generate System Report Function
function generateSystemReport() {
    const reportBtn = document.querySelector('[onclick="generateSystemReport()"]');
    const originalText = reportBtn.innerHTML;
    reportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    reportBtn.disabled = true;
    
    setTimeout(() => {
        const users = db.getUsers();
        const transactions = db.getAllTransactions();
        const pendingTransactions = db.getPendingTransactions();
        const tasks = getTasks();
        
        const reportData = {
            report_timestamp: new Date().toISOString(),
            summary: {
                total_users: users.length,
                total_admins: users.filter(user => user.is_admin).length,
                active_users: users.filter(user => user.status === 'active').length,
                total_transactions: transactions.length,
                pending_approvals: pendingTransactions.length,
                total_deposits: db.getTotalDeposits(),
                total_withdrawals: db.getTotalWithdrawals(),
                system_balance: users.reduce((sum, user) => sum + user.balance, 0)
            },
            user_breakdown: {
                by_status: {
                    active: users.filter(user => user.status === 'active').length,
                    inactive: users.filter(user => user.status === 'inactive').length
                },
                by_type: {
                    regular: users.filter(user => !user.is_admin).length,
                    admins: users.filter(user => user.is_admin).length
                }
            },
            recent_activities: transactions.slice(0, 10),
            task_overview: {
                total_tasks: tasks.length,
                by_status: {
                    pending: tasks.filter(task => task.status === 'pending').length,
                    in_progress: tasks.filter(task => task.status === 'in-progress').length,
                    completed: tasks.filter(task => task.status === 'completed').length
                }
            }
        };
        
        // Create and download report
        const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], {
            type: 'application/json'
        });
        
        const reportUrl = URL.createObjectURL(reportBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = reportUrl;
        downloadLink.download = `system_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(reportUrl);
        
        // Restore button
        reportBtn.innerHTML = originalText;
        reportBtn.disabled = false;
        
        showNotification('System report generated and downloaded!', 'success');
    }, 1500);
}

// Setup Super Admin Event Listeners
function setupSuperAdminEventListeners() {
    // Add any super admin specific event listeners here
    
}

// Load System Activities
function loadSystemActivities() {
    const activitiesList = document.getElementById('system-activities-list');
    if (!activitiesList) return;
    
    const transactions = db.getAllTransactions().slice(0, 5);
    const tasks = getTasks().slice(0, 3);
    
    let activitiesHTML = '';
    
    // Add recent transactions as activities
    transactions.forEach(transaction => {
        activitiesHTML += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${transaction.type === 'deposit' ? 'fa-download' : 'fa-upload'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        ${transaction.username} - ${transaction.type} of TZS ${db.formatNumber(transaction.amount)}
                    </div>
                    <div class="activity-time">${formatDate(transaction.date)}</div>
                </div>
            </div>
        `;
    });
    
    // Add task activities
    tasks.forEach(task => {
        activitiesHTML += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        Task: ${task.title} (${task.status})
                    </div>
                    <div class="activity-time">Assigned to: ${getUsernameById(task.assignee_id)}</div>
                </div>
            </div>
        `;
    });
    
    activitiesList.innerHTML = activitiesHTML || '<p>No recent activities</p>';
}

// Update Task Status Function
function updateTaskStatus(taskId, newStatus) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        tasks[taskIndex].updated_at = new Date().toISOString();
        localStorage.setItem('admin_tasks', JSON.stringify(tasks));
        
        loadTasks();
        showNotification(`Task status updated to ${newStatus}`, 'success');
    }
}

// Delete Task Function
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const tasks = getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('admin_tasks', JSON.stringify(filteredTasks));
        
        loadTasks();
        showNotification('Task deleted successfully', 'success');
    }
}

// Filter Tasks Function
function filterTasks() {
    const statusFilter = document.getElementById('task-status-filter').value;
    const assigneeFilter = document.getElementById('task-assignee-filter').value;
    
    const tasks = getTasks();
    let filteredTasks = tasks;
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (assigneeFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.assignee_id === parseInt(assigneeFilter));
    }
    
    displayFilteredTasks(filteredTasks);
}

// Display Filtered Tasks
function displayFilteredTasks(tasks) {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.status}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>Assigned to: ${getUsernameById(task.assignee_id)}</span>
                <span>Deadline: ${formatDate(task.deadline)}</span>
                <span>Status: ${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'in-progress')">Start</button>
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'completed')">Complete</button>
                <button class="btn-action delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        tasksList.appendChild(taskElement);
    });
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p>No tasks found matching the filters</p>';
    }
}

// View All Transactions Function
function viewAllTransactions() {
    // Switch to admin history section and show all transactions
    switchToSection('admin-history');
    
    // Refresh the transactions to show all
    setTimeout(() => {
        refreshAdminTransactions();
    }, 100);
}

// Save Security Settings Function
function saveSecuritySettings() {
    const twoFactorAuth = document.getElementById('two-factor-auth').checked;
    const sessionTimeout = document.getElementById('session-timeout').value;
    const maxLoginAttempts = document.getElementById('max-login-attempts').value;
    
    // Save to localStorage
    const securitySettings = {
        twoFactorAuth,
        sessionTimeout: parseInt(sessionTimeout),
        maxLoginAttempts: parseInt(maxLoginAttempts),
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('security_settings', JSON.stringify(securitySettings));
    showNotification('Security settings saved successfully!', 'success');
}

// Save System Config Function
function saveSystemConfig() {
    const maintenanceMode = document.getElementById('maintenance-mode').checked;
    const autoBackup = document.getElementById('auto-backup').checked;
    const backupFrequency = document.getElementById('backup-frequency').value;
    
    const systemConfig = {
        maintenanceMode,
        autoBackup,
        backupFrequency,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('system_config', JSON.stringify(systemConfig));
    showNotification('System configuration saved successfully!', 'success');
}

// Update Permission Preview Function
function updatePermissionPreview() {
    const role = document.getElementById('admin-role').value;
    const preview = document.getElementById('permission-preview');
    
    const permissions = {
        full: ['User Management', 'Transaction Approval', 'Chat Support', 'Reports', 'System Settings'],
        moderate: ['User Management', 'Transaction Approval', 'Chat Support', 'Reports'],
        limited: ['User Management', 'Transaction Approval']
    };
    
    const rolePermissions = permissions[role] || [];
    
    preview.innerHTML = `
        <h4>Permissions for ${role} role:</h4>
        <ul>
            ${rolePermissions.map(perm => `<li>${perm}</li>`).join('')}
        </ul>
    `;
}

// Update Role Permissions Function
function updateRolePermissions() {
    const role = document.getElementById('admin-role').value;
    
    // This would typically update the permissions for all admins with this role
    // For now, we'll just show a notification
    showNotification(`Permissions updated for ${role} role`, 'success');
}

// Refresh Admin Earnings Function
function refreshAdminEarnings() {
    // This would refresh the admin earnings approval list
    showNotification('Earnings list refreshed', 'info');
}

// Admin Quick Response Function
function adminQuickResponse(response) {
    const messageInput = document.getElementById('admin-message-input');
    messageInput.value = response;
}

// Initialize these functions when the super admin dashboard loads
function initSuperAdminDashboard() {
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
    
    // Initialize permission preview
    updatePermissionPreview();
    
    // Show welcome message for super admin
    showNotification('Welcome, King Haruni! Super Admin Access Granted', 'success');
}

// Make sure to call updateTaskStats when loading tasks
function loadTasks() {
    const tasks = getTasks();
    const tasksList = document.getElementById('tasks-list');
    
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.status}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>Assigned to: ${getUsernameById(task.assignee_id)}</span>
                <span>Deadline: ${formatDate(task.deadline)}</span>
                <span>Status: ${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'in-progress')">Start</button>
                <button class="btn-action" onclick="updateTaskStatus(${task.id}, 'completed')">Complete</button>
                <button class="btn-action delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        tasksList.appendChild(taskElement);
    });
    
    // Update task statistics
    updateTaskStats();
}



// In your navigation item click handler
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        
        // Stop auto-refresh when leaving referrals section
        if (target !== 'referrals') {
            stopReferralAutoRefresh();
        }
        
        // Show the target section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');
        
        // Start auto-refresh when entering referrals section
        if (target === 'referrals') {
            loadEnhancedReferrals();
            startReferralAutoRefresh();
        }
    });
});

// Count running investments for the current user
function countRunningInvestments() {
    if (!db.currentUser || !db.currentUser.investments) return 0;
    
    const now = new Date();
    return db.currentUser.investments.filter(investment => {
        // Check if investment is active (not completed and not cancelled)
        return investment.status === 'active' || 
               (investment.end_date && new Date(investment.end_date) > now);
    }).length;
}

// Update the investment count badge
function updateInvestmentCountBadge() {
    const count = countRunningInvestments();
    const badge = document.getElementById('myinvestment-count-badge');
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Load and update investment data
function loadInvestmentData() {
    if (!db.currentUser) return;
    
    // Update the count badge
    updateInvestmentCountBadge();
    
    // Your existing investment loading logic here
    loadUserInvestments(); // Your existing function
}

// Enhanced function to get detailed investment stats
function getInvestmentStats() {
    if (!db.currentUser || !db.currentUser.investments) {
        return {
            running: 0,
            completed: 0,
            pending: 0,
            total: 0
        };
    }
    
    const now = new Date();
    const investments = db.currentUser.investments;
    
    const stats = {
        running: investments.filter(inv => 
            inv.status === 'active' || (inv.end_date && new Date(inv.end_date) > now)
        ).length,
        completed: investments.filter(inv => 
            inv.status === 'completed' || (inv.end_date && new Date(inv.end_date) <= now)
        ).length,
        pending: investments.filter(inv => 
            inv.status === 'pending'
        ).length,
        total: investments.length
    };
    
    return stats;
}


// About Us Section Enhancement JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabs = document.querySelectorAll('.about-tab');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // Add active class to current tab and pane
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
    
    // Carousel functionality
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.mineral-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    let currentSlide = 0;
    
    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update slides
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
    }
    
    prevBtn.addEventListener('click', function() {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : slides.length - 1;
        updateCarousel();
    });
    
    nextBtn.addEventListener('click', function() {
        currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
        updateCarousel();
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-advance carousel
    setInterval(() => {
        currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
        updateCarousel();
    }, 5000);
    
    // Counter animation
    const counters = document.querySelectorAll('.counter-animation');
    
    function startCounterAnimation() {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const numberElement = counter.querySelector('.stat-number');
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                numberElement.textContent = target < 10 ? Math.floor(current) : 
                                           target === 98 ? Math.floor(current) + '%' :
                                           target === 2.5 ? current.toFixed(1) + 'B' :
                                           Math.floor(current);
            }, 20);
        });
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('counter-animation')) {
                    startCounterAnimation();
                    observer.unobserve(entry.target);
                } else {
                    entry.target.style.animationPlayState = 'running';
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.counter-animation, .slide-in').forEach(el => {
        observer.observe(el);
    });
});

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    });
}

function showLocation() {
    alert('Our office is located in Dar es Salaam, Tanzania. Contact us for specific directions.');
}

        // FAQ functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle FAQ items
            const faqQuestions = document.querySelectorAll('.faq-question');
            
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const item = question.parentElement;
                    item.classList.toggle('active');
                });
            });
            
            // FAQ search functionality
            const faqSearch = document.getElementById('faq-search');
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                
                faqItems.forEach(item => {
                    const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                    const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                    
                    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
            
            // FAQ category filtering
            const faqCategories = document.querySelectorAll('.faq-category');
            
            faqCategories.forEach(category => {
                category.addEventListener('click', function() {
                    // Remove active class from all categories
                    faqCategories.forEach(cat => cat.classList.remove('active'));
                    
                    // Add active class to clicked category
                    this.classList.add('active');
                    
                    const selectedCategory = this.getAttribute('data-category');
                    
                    // Show/hide FAQ items based on category
                    faqItems.forEach(item => {
                        const itemCategory = item.getAttribute('data-category');
                        
                        if (selectedCategory === 'all' || itemCategory === selectedCategory) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        });
        
        // Mineral Value Calculator Function
function calculateMineralValue() {
    // Get input values
    const grams = parseFloat(document.getElementById('mineral-grams').value);
    const mineralType = document.getElementById('mineral-type').value;
    const resultElement = document.getElementById('mineral-result');

    // Validate input
    if (!grams || grams <= 0) {
        resultElement.innerHTML = '<span style="color: #e74c3c;">Please enter a valid number of grams</span>';
        return;
    }

    // Calculate value based on mineral type
    const calculation = calculateMineralPrice(grams, mineralType);
    
    // Display result with formatting
    resultElement.innerHTML = `
        <div class="calc-result-content">
            <div class="calc-result-main">
                <strong>Value: TZS ${calculation.tzsValue.toLocaleString()} | $${calculation.usdValue.toLocaleString()}</strong>
            </div>
            <div class="calc-result-breakdown">
                <div class="breakdown-item">
                    <span>Mineral:</span>
                    <span>${calculation.mineralName}</span>
                </div>
                <div class="breakdown-item">
                    <span>Weight:</span>
                    <span>${grams}g</span>
                </div>
                <div class="breakdown-item">
                    <span>Price per gram:</span>
                    <span>TZS ${calculation.pricePerGramTZS.toLocaleString()} | $${calculation.pricePerGramUSD}</span>
                </div>
                <div class="breakdown-item">
                    <span>Total Value:</span>
                    <span class="total-value">TZS ${calculation.tzsValue.toLocaleString()} | $${calculation.usdValue.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

// Calculate mineral price based on type and weight
function calculateMineralPrice(grams, mineralType) {
    // Mineral prices per gram (in TZS and USD)
    const mineralPrices = {
        diamond: {
            name: 'Diamond',
            tzsPerGram: 325000,  // TZS 325,000 per gram
            usdPerGram: 140      // $140 per gram
        },
        gold: {
            name: 'Gold',
            tzsPerGram: 125000,  // TZS 125,000 per gram
            usdPerGram: 54       // $54 per gram
        },
        tanzanite: {
            name: 'Tanzanite',
            tzsPerGram: 275000,  // TZS 275,000 per gram
            usdPerGram: 118      // $118 per gram
        },
        copper: {
            name: 'Copper',
            tzsPerGram: 12500,   // TZS 12,500 per gram
            usdPerGram: 5.4      // $5.40 per gram
        }
    };

    const mineral = mineralPrices[mineralType] || mineralPrices.diamond;
    
    // Calculate total values
    const tzsValue = grams * mineral.tzsPerGram;
    const usdValue = grams * mineral.usdPerGram;

    return {
        mineralName: mineral.name,
        pricePerGramTZS: mineral.tzsPerGram,
        pricePerGramUSD: mineral.usdPerGram,
        tzsValue: Math.round(tzsValue),
        usdValue: usdValue.toFixed(2)
    };
}

// Add real-time calculation as user types
function setupMineralCalculator() {
    const gramsInput = document.getElementById('mineral-grams');
    const mineralSelect = document.getElementById('mineral-type');
    
    if (gramsInput && mineralSelect) {
        // Real-time calculation on input change
        gramsInput.addEventListener('input', debounce(calculateMineralValue, 500));
        mineralSelect.addEventListener('change', calculateMineralValue);
        
        // Enter key support
        gramsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateMineralValue();
            }
        });
    }
}

// Debounce function to prevent too many calculations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupMineralCalculator();
});

// Additional utility functions for the calculator

// Quick calculate functions for common amounts
function quickCalculate(grams) {
    document.getElementById('mineral-grams').value = grams;
    calculateMineralValue();
}

// Reset calculator
function resetCalculator() {
    document.getElementById('mineral-grams').value = '';
    document.getElementById('mineral-type').value = 'diamond';
    document.getElementById('mineral-result').innerHTML = 'Value: TZS 0.00 | $0.00';
}

// Get current mineral prices (could be extended to fetch from API)
function getCurrentMineralPrices() {
    return {
        diamond: { tzs: 325000, usd: 140 },
        gold: { tzs: 125000, usd: 54 },
        tanzanite: { tzs: 275000, usd: 118 },
        copper: { tzs: 12500, usd: 5.4 }
    };
}

// Update prices (for admin functionality)
function updateMineralPrices(newPrices) {
    // This would typically be an admin function to update prices
    
    // In a real implementation, this would save to database/localStorage
}

// Export calculation as CSV
function exportCalculation() {
    const grams = document.getElementById('mineral-grams').value;
    const mineralType = document.getElementById('mineral-type').value;
    
    if (!grams) {
        alert('Please enter a value to export');
        return;
    }
    
    const calculation = calculateMineralPrice(parseFloat(grams), mineralType);
    
    const csvContent = [
        'Mineral,Weight (g),Price per gram (TZS),Price per gram (USD),Total Value (TZS),Total Value (USD)',
        `${calculation.mineralName},${grams},${calculation.pricePerGramTZS},${calculation.pricePerGramUSD},${calculation.tzsValue},${calculation.usdValue}`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mineral-calculation-${calculation.mineralName.toLowerCase()}-${grams}g.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Calculator functionality for admin dashboard
function calculatePercentage() {
    const originalAmount = parseFloat(document.getElementById('original-amount').value);
    const percentage = parseFloat(document.getElementById('percentage-value').value);
    
    if (isNaN(originalAmount) || isNaN(percentage)) {
        alert('Please enter valid numbers for both amount and percentage');
        return;
    }
    
    const percentageAmount = (originalAmount * percentage) / 100;
    const totalAmount = originalAmount + percentageAmount;
    
    document.getElementById('percentage-amount-result').textContent = `TZS ${percentageAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('percentage-result').textContent = `${percentage}%`;
    document.getElementById('total-amount-result').textContent = `TZS ${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Add to history
    addToHistory(`${originalAmount.toLocaleString()} TZS + ${percentage}% = ${percentageAmount.toLocaleString()} TZS`);
}

function calculatePercentageFromAmount() {
    const originalAmount = parseFloat(document.getElementById('original-amount').value);
    const resultAmount = parseFloat(document.getElementById('result-amount').value);
    
    if (isNaN(originalAmount) || isNaN(resultAmount)) {
        alert('Please enter valid numbers for both original amount and result amount');
        return;
    }
    
    if (originalAmount === 0) {
        alert('Original amount cannot be zero');
        return;
    }
    
    const percentage = ((resultAmount - originalAmount) / originalAmount) * 100;
    const percentageAmount = resultAmount - originalAmount;
    
    document.getElementById('percentage-amount-result').textContent = `TZS ${percentageAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('percentage-result').textContent = `${percentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    document.getElementById('total-amount-result').textContent = `TZS ${resultAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Add to history
    addToHistory(`${originalAmount.toLocaleString()} TZS → ${resultAmount.toLocaleString()} TZS = ${percentage.toFixed(2)}%`);
}

function resetCalculator() {
    document.getElementById('original-amount').value = '';
    document.getElementById('percentage-value').value = '';
    document.getElementById('result-amount').value = '';
    document.getElementById('percentage-amount-result').textContent = 'TZS 0.00';
    document.getElementById('percentage-result').textContent = '0.00%';
    document.getElementById('total-amount-result').textContent = 'TZS 0.00';
}

function copyResults() {
    const percentageAmount = document.getElementById('percentage-amount-result').textContent;
    const percentage = document.getElementById('percentage-result').textContent;
    const totalAmount = document.getElementById('total-amount-result').textContent;
    
    const textToCopy = `Percentage Amount: ${percentageAmount}\nPercentage: ${percentage}\nTotal Amount: ${totalAmount}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Show success message
        showNotification('Results copied to clipboard!', 'success');
    }).catch(err => {
        
        showNotification('Failed to copy results', 'error');
    });
}

function addToHistory(calculation) {
    const historyList = document.getElementById('calculator-history');
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    historyItem.innerHTML = `
        <div class="history-calculation">${calculation}</div>
        <div class="history-time">${timeString}</div>
    `;
    
    // Add to top of history
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
    
    // Limit history to 10 items
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Save to localStorage
    saveCalculatorHistory();
}

function clearCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    historyList.innerHTML = '<div class="no-history">No calculation history</div>';
    
    // Clear from localStorage
    localStorage.removeItem('calculatorHistory');
}

function saveCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    const historyItems = [];
    
    for (let i = 0; i < historyList.children.length; i++) {
        const item = historyList.children[i];
        if (item.classList.contains('history-item')) {
            const calculation = item.querySelector('.history-calculation').textContent;
            const time = item.querySelector('.history-time').textContent;
            historyItems.push({ calculation, time });
        }
    }
    
    localStorage.setItem('calculatorHistory', JSON.stringify(historyItems));
}

function loadCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    const savedHistory = localStorage.getItem('calculatorHistory');
    
    if (savedHistory) {
        const historyItems = JSON.parse(savedHistory);
        
        if (historyItems.length > 0) {
            historyList.innerHTML = '';
            
            historyItems.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-calculation">${item.calculation}</div>
                    <div class="history-time">${item.time}</div>
                `;
                historyList.appendChild(historyItem);
            });
        } else {
            historyList.innerHTML = '<div class="no-history">No calculation history</div>';
        }
    } else {
        historyList.innerHTML = '<div class="no-history">No calculation history</div>';
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCalculatorHistory();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            calculatePercentage();
        }
    });
});

// JavaScript functions for referral earnings description
function goToSupport() {
    // Navigate to support section
    const supportSection = document.querySelector('[data-target="support"]');
    if (supportSection) {
        supportSection.click();
    } else {
        // Fallback: scroll to support section
        const supportElement = document.getElementById('support');
        if (supportElement) {
            supportElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function checkEarnings() {
    // Show available earnings modal or section
    const earningsElement = document.getElementById('available-earnings');
    if (earningsElement) {
        earningsElement.scrollIntoView({ behavior: 'smooth' });
        
        // Add highlight effect
        earningsElement.style.backgroundColor = '#fff3cd';
        earningsElement.style.transition = 'background-color 0.5s ease';
        
        setTimeout(() => {
            earningsElement.style.backgroundColor = '';
        }, 2000);
    }
    
    // You can also trigger a refresh of earnings data
    refreshReferralEarnings();
}

function refreshReferralEarnings() {
    // This function would typically make an API call to refresh earnings data
    
    
    // Show loading state
    const earningsElement = document.getElementById('available-earnings');
    if (earningsElement) {
        const originalText = earningsElement.textContent;
        earningsElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        // Simulate API call
        setTimeout(() => {
            earningsElement.textContent = originalText;
            showNotification('Earnings data updated successfully!', 'success');
        }, 1500);
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set user's actual referral code in the example
    const userRefCode = localStorage.getItem('userReferralCode') || 'TMN-USER123';
    document.getElementById('user-referral-code').textContent = userRefCode;   
});

 // Weka maximum messages kwa user
const CHAT_STORAGE_LIMITS = {
    maxMessages: 1000,        // Max messages total
    maxMessageLength: 500,    // Max characters per message
    maxAttachments: 50,       // Max files user can upload
    maxAttachmentSize: 5 * 1024 * 1024 // 5MB max per file
};

function cleanupOldMessages() {
    // Futa messages za zamani zaidi ya siku 30
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Futa messages zilizo older than 30 days
    deleteMessagesOlderThan(thirtyDaysAgo);
}

// Compress chat data kabla ya kuhifadhi
function compressChatData(messages) {
    return messages.map(msg => ({
        id: msg.id,
        t: msg.text.substring(0, 200), // Shorten text
        u: msg.userId,
        ts: msg.timestamp
    }));
}

// Ongeza storage usage monitor
function updateStorageInfo() {
    const used = JSON.stringify(localStorage).length;
    const max = 5 * 1024 * 1024; // 5MB limit
    const percent = (used / max * 100).toFixed(1);
    
    document.getElementById('storageInfo').textContent = 
        `Storage: ${percent}% used`;
        
    // Ongeza warning kama storage inakaribia kujaa
    if (percent > 80) {
        showStorageWarning();
    }
}

function showStorageWarning() {
    alert('⚠️ Chat storage inakaribia kujaa! Tafadhali futa baadhi ya messages za zamani.');
}

// Weka hii kwenye JavaScript yako
function clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
        // Futa messages kutoka localStorage
        localStorage.removeItem('chat_messages');
        
        // Futa messages kutoka kwenye display
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Onyesha confirmation message
        showNotification('Chat history cleared successfully!', 'success');
        
        // Update storage info
        updateStorageInfo();
    }
}

// Function ya kuonyesha notifications
function showNotification(message, type = 'info') {
    // Ongeza notification system kama haipo
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Onyesha notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Futa notification baada ya muda
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}


        




// Landing page functions
function skipLanding() {
    safeStorage.setItem('landingSeen', 'true');
    showLogin();
}

function showLogin() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
}

function showLanding() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'flex';
    if (login) login.style.display = 'none';
}

// Safe error display function
function showError(message, type = 'error') {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        
        return;
    }
    
    const errorMessage = document.createElement('div');
    errorMessage.className = `error-message ${type}`;
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-title">${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}</div>
            <div class="error-details">${message}</div>
        </div>
        <button class="error-close" onclick="this.parentElement.remove()">×</button>
        <div class="error-progress"></div>
    `;
    
    errorContainer.appendChild(errorMessage);
    
    // Animate in
    setTimeout(() => errorMessage.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorMessage.parentElement) {
            errorMessage.classList.remove('show');
            setTimeout(() => errorMessage.remove(), 300);
        }
    }, 5000);
}

// Safe localStorage functions with error handling
const safeStorage = {
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            
            // Fallback to sessionStorage
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch (e2) {
                
                return false;
            }
        }
    },
    
    getItem: (key) => {
        try {
            return localStorage.getItem(key) || sessionStorage.getItem(key);
        } catch (e) {
            
            return null;
        }
    },
    
    clearExpired: () => {
        try {
            // Clear old items to free up space
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('temp_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            
        }
    }
};

        // DOM Elements
        const slideshowContainer = document.getElementById('slideshowContainer');
        const announcementsContainer = document.getElementById('announcementsContainer');
        const adminToggle = document.getElementById('adminToggle');
        const adminPanel = document.getElementById('adminPanel');
        const announcementType = document.getElementById('announcementType');
        const announcementForm = document.getElementById('announcementForm');
        const mediaForm = document.getElementById('mediaForm');
        const mediaFile = document.getElementById('mediaFile');
        const imagePreview = document.getElementById('imagePreview');
        const videoPreview = document.getElementById('videoPreview');
        const saveBtn = document.getElementById('saveBtn');
        const updateBtn = document.getElementById('updateBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const clearBtn = document.getElementById('clearBtn');
        const prevBtn = document.getElementById('prevBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const nextBtn = document.getElementById('nextBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const contentList = document.getElementById('contentList');

        // State variables
        let currentSlideIndex = 0;
        let slideshowInterval;
        let isPlaying = true;
        let isEditing = false;
        let currentEditId = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            loadSlides();
            loadAnnouncements();
            loadContentList();
            startSlideshow();
            
            // Set up event listeners
            adminToggle.addEventListener('click', toggleAdminPanel);
            announcementType.addEventListener('change', toggleFormType);
            mediaFile.addEventListener('change', previewMedia);
            saveBtn.addEventListener('click', saveContent);
            updateBtn.addEventListener('click', updateContent);
            cancelBtn.addEventListener('click', cancelEdit);
            clearBtn.addEventListener('click', clearForm);
            prevBtn.addEventListener('click', showPreviousSlide);
            pauseBtn.addEventListener('click', toggleSlideshow);
            nextBtn.addEventListener('click', showNextSlide);
        });

        // Toggle admin panel visibility
        function toggleAdminPanel() {
            adminPanel.classList.toggle('active');
            adminToggle.textContent = adminPanel.classList.contains('active') ? 
                'Hide Admin Panel' : 'Show Admin Panel';
        }

        // Toggle form based on content type
        function toggleFormType() {
            const type = announcementType.value;
            
            if (type === 'announcement') {
                announcementForm.style.display = 'block';
                mediaForm.style.display = 'none';
            } else {
                announcementForm.style.display = 'none';
                mediaForm.style.display = 'block';
            }
        }

        // Preview selected media file
        function previewMedia() {
            const file = mediaFile.files[0];
            if (!file) return;
            
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            // Reset previews
            imagePreview.style.display = 'none';
            videoPreview.style.display = 'none';
            
            if (isImage) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else if (isVideo) {
                videoPreview.src = URL.createObjectURL(file);
                videoPreview.style.display = 'block';
            }
        }

        // Save content to localStorage
        function saveContent() {
            const type = announcementType.value;
            
            if (type === 'announcement') {
                const title = document.getElementById('announcementTitle').value;
                const content = document.getElementById('announcementContent').value;
                
                if (!title || !content) {
                    alert('Please fill in all fields');
                    return;
                }
                
                const announcement = {
                    id: Date.now(),
                    type: 'announcement',
                    title,
                    content,
                    date: new Date().toLocaleDateString()
                };
                
                saveToStorage('announcements', announcement);
                loadAnnouncements();
                
            } else {
                const caption = document.getElementById('mediaCaption').value;
                const file = mediaFile.files[0];
                
                if (!file || !caption) {
                    alert('Please select a file and enter a caption');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const media = {
                        id: Date.now(),
                        type: type,
                        caption,
                        data: e.target.result,
                        fileType: file.type
                    };
                    
                    saveToStorage('slides', media);
                    loadSlides();
                };
                
                reader.readAsDataURL(file);
            }
            
            clearForm();
            loadContentList();
            alert('Content saved successfully!');
        }

        // Update existing content
        function updateContent() {
            const type = announcementType.value;
            
            if (type === 'announcement') {
                const title = document.getElementById('announcementTitle').value;
                const content = document.getElementById('announcementContent').value;
                
                if (!title || !content) {
                    alert('Please fill in all fields');
                    return;
                }
                
                const announcement = {
                    id: currentEditId,
                    type: 'announcement',
                    title,
                    content,
                    date: new Date().toLocaleDateString()
                };
                
                updateInStorage('announcements', announcement);
                loadAnnouncements();
                
            } else {
                const caption = document.getElementById('mediaCaption').value;
                const file = mediaFile.files[0];
                
                if (!caption) {
                    alert('Please enter a caption');
                    return;
                }
                
                // If no new file is selected, keep the existing one
                if (!file) {
                    const slides = JSON.parse(localStorage.getItem('slides')) || [];
                    const existingSlide = slides.find(slide => slide.id === currentEditId);
                    
                    if (existingSlide) {
                        const media = {
                            id: currentEditId,
                            type: type,
                            caption,
                            data: existingSlide.data,
                            fileType: existingSlide.fileType
                        };
                        
                        updateInStorage('slides', media);
                        loadSlides();
                    }
                } else {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const media = {
                            id: currentEditId,
                            type: type,
                            caption,
                            data: e.target.result,
                            fileType: file.type
                        };
                        
                        updateInStorage('slides', media);
                        loadSlides();
                    };
                    
                    reader.readAsDataURL(file);
                }
            }
            
            cancelEdit();
            loadContentList();
            alert('Content updated successfully!');
        }

        // Cancel edit mode
        function cancelEdit() {
            isEditing = false;
            currentEditId = null;
            saveBtn.style.display = 'block';
            updateBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            clearForm();
        }

        // Edit content
        function editContent(id, type) {
            isEditing = true;
            currentEditId = id;
            
            if (type === 'announcement') {
                const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
                const announcement = announcements.find(item => item.id === id);
                
                if (announcement) {
                    announcementType.value = 'announcement';
                    toggleFormType();
                    document.getElementById('announcementTitle').value = announcement.title;
                    document.getElementById('announcementContent').value = announcement.content;
                }
            } else {
                const slides = JSON.parse(localStorage.getItem('slides')) || [];
                const slide = slides.find(item => item.id === id);
                
                if (slide) {
                    announcementType.value = slide.type;
                    toggleFormType();
                    document.getElementById('mediaCaption').value = slide.caption;
                    
                    // Show preview of existing media
                    if (slide.type === 'image') {
                        imagePreview.src = slide.data;
                        imagePreview.style.display = 'block';
                    } else if (slide.type === 'video') {
                        videoPreview.src = slide.data;
                        videoPreview.style.display = 'block';
                    }
                }
            }
            
            saveBtn.style.display = 'none';
            updateBtn.style.display = 'block';
            cancelBtn.style.display = 'block';
            
            // Scroll to form
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        }

        // Delete content
        function deleteContent(id, type) {
            if (confirm('Are you sure you want to delete this content?')) {
                if (type === 'announcement') {
                    deleteFromStorage('announcements', id);
                    loadAnnouncements();
                } else {
                    deleteFromStorage('slides', id);
                    loadSlides();
                }
                loadContentList();
                alert('Content deleted successfully!');
            }
        }

        // Save item to localStorage
        function saveToStorage(key, item) {
            let items = JSON.parse(localStorage.getItem(key)) || [];
            items.push(item);
            localStorage.setItem(key, JSON.stringify(items));
        }

        // Update item in localStorage
        function updateInStorage(key, updatedItem) {
            let items = JSON.parse(localStorage.getItem(key)) || [];
            const index = items.findIndex(item => item.id === updatedItem.id);
            if (index !== -1) {
                items[index] = updatedItem;
                localStorage.setItem(key, JSON.stringify(items));
            }
        }

        // Delete item from localStorage
        function deleteFromStorage(key, id) {
            let items = JSON.parse(localStorage.getItem(key)) || [];
            items = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(items));
        }

        // Load slides from localStorage
        function loadSlides() {
            const slides = JSON.parse(localStorage.getItem('slides')) || [];
            slideshowContainer.innerHTML = '';
            
            if (slides.length === 0) {
                // Add default slides if none exist
                const defaultSlides = [
                    {
                        id: 1,
                        type: 'image',
                        caption: 'Welcome to our announcement center',
                        data: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                        fileType: 'image/jpeg'
                    },
                    {
                        id: 2,
                        type: 'image',
                        caption: 'Stay updated with our latest news',
                        data: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                        fileType: 'image/jpeg'
                    }
                ];
                
                localStorage.setItem('slides', JSON.stringify(defaultSlides));
                return loadSlides();
            }
            
            slides.forEach((slide, index) => {
                const slideElement = document.createElement('div');
                slideElement.className = `slide ${index === 0 ? 'active' : ''}`;
                
                if (slide.type === 'image') {
                    slideElement.innerHTML = `
                        <img src="${slide.data}" alt="${slide.caption}">
                        <div class="slide-caption">${slide.caption}</div>
                    `;
                } else if (slide.type === 'video') {
                    slideElement.innerHTML = `
                        <video src="${slide.data}" controls></video>
                        <div class="slide-caption">${slide.caption}</div>
                    `;
                }
                
                slideshowContainer.appendChild(slideElement);
            });
            
            currentSlideIndex = 0;
        }

        // Load announcements from localStorage
        function loadAnnouncements() {
            const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
            announcementsContainer.innerHTML = '';
            
            if (announcements.length === 0) {
                // Add default announcements if none exist
                const defaultAnnouncements = [
                    {
                        id: 1,
                        type: 'announcement',
                        title: 'Welcome!',
                        content: 'Welcome to our new announcement center. Check back regularly for updates.',
                        date: new Date().toLocaleDateString()
                    },
                    {
                        id: 2,
                        type: 'announcement',
                        title: 'Maintenance Notice',
                        content: 'The system will undergo maintenance this weekend. Some features may be temporarily unavailable.',
                        date: new Date().toLocaleDateString()
                    }
                ];
                
                localStorage.setItem('announcements', JSON.stringify(defaultAnnouncements));
                return loadAnnouncements();
            }
            
            // Sort announcements by date (newest first)
            announcements.sort((a, b) => b.id - a.id);
            
            announcements.forEach(announcement => {
                const announcementElement = document.createElement('div');
                announcementElement.className = 'announcement';
                announcementElement.innerHTML = `
                    <h3>${announcement.title}</h3>
                    <div class="announcement-date">${announcement.date}</div>
                    <div class="announcement-date"><h2>${announcement.content}</h2></div>

                `;
                announcementsContainer.appendChild(announcementElement);
            });
        }

        // Load content list for management
        function loadContentList() {
            const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
            const slides = JSON.parse(localStorage.getItem('slides')) || [];
            contentList.innerHTML = '';
            
            // Combine and sort all content by ID (newest first)
            const allContent = [...announcements, ...slides].sort((a, b) => b.id - a.id);
            
            if (allContent.length === 0) {
                contentList.innerHTML = '<div class="content-item">No content available</div>';
                return;
            }
            
            allContent.forEach(item => {
                const contentItem = document.createElement('div');
                contentItem.className = 'content-item';
                
                const title = item.type === 'announcement' ? item.title : item.caption;
                const type = item.type === 'announcement' ? 'Announcement' : 
                             item.type === 'image' ? 'Image Slide' : 'Video Slide';
                
                contentItem.innerHTML = `
                    <div class="content-info">
                        <div class="content-title">${title}</div>
                        <div class="content-type">${type}</div>
                    </div>
                    <div class="content-actions">
                        <button class="action-btn edit" onclick="editContent(${item.id}, '${item.type}')">Edit</button>
                        <button class="action-btn delete" onclick="deleteContent(${item.id}, '${item.type}')">Delete</button>
                    </div>
                `;
                
                contentList.appendChild(contentItem);
            });
        }

        // Clear form inputs
        function clearForm() {
            document.getElementById('announcementTitle').value = '';
            document.getElementById('announcementContent').value = '';
            document.getElementById('mediaCaption').value = '';
            document.getElementById('mediaFile').value = '';
            imagePreview.style.display = 'none';
            videoPreview.style.display = 'none';
        }

        // Slideshow functionality
        function startSlideshow() {
            slideshowInterval = setInterval(showNextSlide, 5000);
        }

        function showNextSlide() {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) return;
            
            slides[currentSlideIndex].classList.remove('active');
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            slides[currentSlideIndex].classList.add('active');
        }

        function showPreviousSlide() {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) return;
            
            slides[currentSlideIndex].classList.remove('active');
            currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
            slides[currentSlideIndex].classList.add('active');
        }

        function toggleSlideshow() {
            if (isPlaying) {
                clearInterval(slideshowInterval);
                pauseBtn.textContent = 'Play';
            } else {
                startSlideshow();
                pauseBtn.textContent = 'Pause';
            }
            isPlaying = !isPlaying;
        }
        
                // Close error message
        function closeError(errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.classList.remove('show');
                errorElement.classList.add('hide');
                
                // Remove from DOM after animation
                setTimeout(() => {
                    if (errorElement.parentNode) {
                        errorElement.parentNode.removeChild(errorElement);
                    }
                }, 300);
            }
        }
