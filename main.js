// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2ZzKzKzKzKzKzKzKzKzKzKzKzKzKzKz",
    authDomain: "tanzania-mining-investment.firebaseapp.com",
    databaseURL: "https://tanzania-mining-investment-default-rtdb.firebaseio.com",
    projectId: "tanzania-mining-investment",
    storageBucket: "tanzania-mining-investment.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global Database Instance
let db = null;

/**
 * COMPREHENSIVE DATABASE CLASS
 * All database operations consolidated into one class
 */
class Database {
    constructor() {
        this.db = firebase.firestore();
        this.currentUser = null;
        
        // Formatting helpers
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

    // ========== DATABASE INITIALIZATION ==========
    async initDatabase() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const users = [];
            
            usersSnapshot.forEach(doc => {
                users.push({
                    id: parseInt(doc.id),
                    ...doc.data()
                });
            });
            
            // Create super admin if doesn't exist
            const kingHaruniExists = users.some(user => user.email === 'kingharuni420@gmail.com');
            if (!kingHaruniExists) {
                console.log('Creating super admin user in Firebase...');
                
                const superAdmin = {
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
                    has_received_referral_bonus: false,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await this.db.collection('users').doc('1').set(superAdmin);
                console.log('Super admin created successfully');
            }
            
            // Create regular admin if doesn't exist
            const regularAdminExists = users.some(user => user.email === 'mining.investment.tanzania@proton.me');
            if (!regularAdminExists) {
                console.log('Creating regular admin user in Firebase...');
                
                const regularAdmin = {
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
                    has_received_referral_bonus: false,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await this.db.collection('users').doc('2').set(regularAdmin);
                console.log('Regular admin created successfully');
            }
            
            // Initialize counters
            const counterRef = this.db.collection('counters').doc('global');
            const counterDoc = await counterRef.get();
            
            if (!counterDoc.exists) {
                await counterRef.set({
                    next_user_id: 3,
                    next_transaction_id: 1,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Counters initialized');
            }
            
            console.log('✅ Database initialization complete');
            return true;
            
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            throw error;
        }
    }

    // ========== USER MANAGEMENT ==========
    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({
                id: parseInt(doc.id),
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    async findUserById(id) {
        try {
            const doc = await this.db.collection('users').doc(id.toString()).get();
            return doc.exists ? { id: parseInt(doc.id), ...doc.data() } : null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }

    async findUserByEmail(email) {
        try {
            if (!email || typeof email !== 'string') return null;
            
            const snapshot = await this.db.collection('users')
                .where('email', '==', email.toLowerCase())
                .limit(1)
                .get();
            
            return snapshot.empty ? null : {
                id: parseInt(snapshot.docs[0].id),
                ...snapshot.docs[0].data()
            };
        } catch (error) {
            console.error('Error finding user by email:', error);
            return null;
        }
    }

    async findUserByUsername(username) {
        try {
            if (!username || typeof username !== 'string') return null;
            
            const snapshot = await this.db.collection('users')
                .where('username', '==', username.toLowerCase())
                .limit(1)
                .get();
            
            return snapshot.empty ? null : {
                id: parseInt(snapshot.docs[0].id),
                ...snapshot.docs[0].data()
            };
        } catch (error) {
            console.error('Error finding user by username:', error);
            return null;
        }
    }

    async findUserByEmailOrUsername(identifier) {
        if (!identifier || typeof identifier !== 'string') return null;
        
        const identifierLower = identifier.toLowerCase();
        
        // Try email first
        if (identifierLower.includes('@')) {
            return await this.findUserByEmail(identifierLower);
        }
        
        // Try username
        return await this.findUserByUsername(identifierLower);
    }

    async findUserByReferralCode(referralCode) {
        try {
            if (!referralCode) return null;
            
            const snapshot = await this.db.collection('users')
                .where('referral_code', '==', referralCode.toUpperCase())
                .limit(1)
                .get();
            
            return snapshot.empty ? null : {
                id: parseInt(snapshot.docs[0].id),
                ...snapshot.docs[0].data()
            };
        } catch (error) {
            console.error('Error finding user by referral code:', error);
            return null;
        }
    }

    async getNextId() {
        try {
            const counterRef = this.db.collection('counters').doc('global');
            
            return await this.db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let nextId;
                if (!counterDoc.exists) {
                    nextId = 3; // Start from 3 since we have users 1 and 2
                    transaction.set(counterRef, {
                        next_user_id: 4,
                        next_transaction_id: 1,
                        created_at: firebase.firestore.FieldValue.serverTimestamp(),
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    const data = counterDoc.data();
                    nextId = data.next_user_id || 3;
                    transaction.update(counterRef, {
                        next_user_id: nextId + 1,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                return nextId;
            });
        } catch (error) {
            console.error('Error getting next ID:', error);
            return Math.floor(Date.now() / 1000); // Fallback
        }
    }

    async generateUniqueReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 20) {
            code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const existingUser = await this.findUserByReferralCode(code);
            if (!existingUser) {
                isUnique = true;
            }
            attempts++;
        }
        
        if (!isUnique) {
            code += Date.now().toString().slice(-4);
        }
        
        return code;
    }

    async createUser(userData) {
        try {
            console.log('Creating user:', userData.username);
            
            // Get next user ID
            const nextId = await this.getNextId();
            
            // Generate unique referral code
            const referralCode = await this.generateUniqueReferralCode();
            
            // Create user object
            const newUser = {
                id: nextId,
                username: userData.username.toLowerCase(),
                email: userData.email.toLowerCase(),
                password: userData.password,
                admin_password: '',
                referral_code: referralCode,
                referred_by: userData.referred_by || null,
                join_date: new Date().toISOString(),
                status: 'active',
                is_admin: false,
                is_super_admin: false,
                admin_role: '',
                permissions: [],
                balance: 0,
                investments: [],
                referrals: [],
                transactions: [],
                has_received_referral_bonus: false,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Save to Firestore
            await this.db.collection('users').doc(nextId.toString()).set(newUser);
            
            console.log('User created successfully:', newUser.username);
            return newUser;
            
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    async updateUser(userId, updates) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            // Add timestamp
            updates.updated_at = firebase.firestore.FieldValue.serverTimestamp();
            
            await userRef.update(updates);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    async deleteUser(userId) {
        try {
            await this.db.collection('users').doc(userId.toString()).delete();
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }

    async updateUserBalance(userId, amount) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(amount),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Error updating user balance:', error);
            return false;
        }
    }

    async addReferralToUser(userId, referralData) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            await userRef.update({
                referrals: firebase.firestore.FieldValue.arrayUnion(referralData),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Error adding referral to user:', error);
            return false;
        }
    }

    // ========== INVESTMENT MANAGEMENT ==========
    async getUserInvestments(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId.toString()).get();
            return userDoc.exists ? userDoc.data().investments || [] : [];
        } catch (error) {
            console.error('Error getting user investments:', error);
            return [];
        }
    }

    async updateUserInvestments(userId, investments) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            await userRef.update({
                investments: investments,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating user investments:', error);
            return false;
        }
    }

    async getHighestInvestors(period = 'weekly') {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const investors = [];
            
            const now = new Date();
            let startDate;
            
            switch (period.toLowerCase()) {
                case 'weekly':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const userId = parseInt(doc.id);
                
                if (!user.investments || !Array.isArray(user.investments)) return;
                
                let totalInvestedInPeriod = 0;
                let totalProfitInPeriod = 0;
                
                user.investments.forEach(investment => {
                    const investmentDate = new Date(investment.startTime || investment.date);
                    
                    if (investmentDate >= startDate) {
                        totalInvestedInPeriod += investment.cost || investment.amount || 0;
                        
                        if (investment.completed) {
                            totalProfitInPeriod += investment.finalProfit || 0;
                        } else {
                            const profit = calculateCurrentProfit(investment);
                            totalProfitInPeriod += profit;
                        }
                    }
                });
                
                if (totalInvestedInPeriod > 0) {
                    investors.push({
                        id: userId,
                        username: user.username,
                        email: user.email,
                        totalInvested: totalInvestedInPeriod,
                        totalProfit: totalProfitInPeriod,
                        investmentCount: user.investments.length,
                        profileImage: user.profileImage || null
                    });
                }
            });
            
            investors.sort((a, b) => b.totalInvested - a.totalInvested);
            return investors;
            
        } catch (error) {
            console.error(`Error getting ${period} highest investors:`, error);
            return [];
        }
    }

    async getTopInvestors() {
        try {
            const [weekly, monthly, yearly] = await Promise.all([
                this.getHighestInvestors('weekly'),
                this.getHighestInvestors('monthly'),
                this.getHighestInvestors('yearly')
            ]);
            
            return {
                weekly: weekly.slice(0, 10),
                monthly: monthly.slice(0, 10),
                yearly: yearly.slice(0, 10)
            };
        } catch (error) {
            console.error('Error getting top investors:', error);
            return { weekly: [], monthly: [], yearly: [] };
        }
    }

    async getInvestmentLeaderboard(limit = 20) {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const leaderboard = [];
            
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const userId = parseInt(doc.id);
                
                if (!user.investments || !Array.isArray(user.investments)) return;
                
                let totalInvested = 0;
                let totalProfit = 0;
                let activeInvestments = 0;
                let completedInvestments = 0;
                
                user.investments.forEach(investment => {
                    totalInvested += investment.cost || investment.amount || 0;
                    
                    if (investment.completed) {
                        completedInvestments++;
                        totalProfit += investment.finalProfit || 0;
                    } else {
                        activeInvestments++;
                        const profit = calculateCurrentProfit(investment);
                        totalProfit += profit;
                    }
                });
                
                if (totalInvested > 0) {
                    leaderboard.push({
                        id: userId,
                        username: user.username,
                        email: user.email,
                        totalInvested: totalInvested,
                        totalProfit: totalProfit,
                        activeInvestments: activeInvestments,
                        completedInvestments: completedInvestments,
                        totalInvestments: user.investments.length,
                        profileImage: user.profileImage || null,
                        rank: 0
                    });
                }
            });
            
            leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
            leaderboard.forEach((item, index) => {
                item.rank = index + 1;
                item.position = index + 1;
            });
            
            return leaderboard.slice(0, limit);
            
        } catch (error) {
            console.error('Error getting investment leaderboard:', error);
            return [];
        }
    }

    // ========== TRANSACTION MANAGEMENT ==========
    async getNextTransactionId() {
        try {
            const counterRef = this.db.collection('counters').doc('global');
            
            return await this.db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let nextId;
                if (!counterDoc.exists) {
                    nextId = 1;
                    transaction.set(counterRef, {
                        next_transaction_id: 2,
                        next_user_id: 3,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    const data = counterDoc.data();
                    nextId = data.next_transaction_id || 1;
                    transaction.update(counterRef, {
                        next_transaction_id: nextId + 1,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                return nextId;
            });
        } catch (error) {
            console.error('Error getting next transaction ID:', error);
            return Date.now();
        }
    }

    async createTransaction(userId, type, amount, method, details = {}) {
        try {
            console.log('Creating transaction:', { userId, type, amount, method, details });
            
            const userRef = this.db.collection('users').doc(userId.toString());
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            
            const user = userDoc.data();
            const transactionId = await this.getNextTransactionId();
            const currentTimestamp = new Date().toISOString();
            
            const transaction = {
                id: transactionId,
                userId: userId,
                username: user.username || '',
                email: user.email || '',
                type: type,
                amount: parseFloat(amount) || 0,
                method: method,
                status: 'pending',
                date: currentTimestamp,
                details: {
                    ...details,
                    createdBy: user.username || '',
                    createdAt: currentTimestamp
                },
                adminActionDate: null,
                adminId: null,
                created_at: currentTimestamp
            };
            
            const currentTransactions = user.transactions || [];
            currentTransactions.push(transaction);
            
            let balanceUpdate = 0;
            let transactionStatus = 'pending';
            
            if (type === 'bonus' && method === 'referral') {
                transaction.status = 'approved';
                transactionStatus = 'approved';
                balanceUpdate = amount;
                console.log(`Auto-approving referral bonus of ${amount}`);
            }
            
            const updateData = {
                transactions: currentTransactions,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (balanceUpdate > 0) {
                updateData.balance = firebase.firestore.FieldValue.increment(balanceUpdate);
                console.log(`Adding ${balanceUpdate} to user balance`);
                
                if (this.currentUser && this.currentUser.id === userId) {
                    this.currentUser.balance += balanceUpdate;
                    console.log('Updated current user balance:', this.currentUser.balance);
                }
            }
            
            await userRef.update(updateData);
            console.log('Transaction saved successfully:', transactionId);
            
            return transaction;
            
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error(`Failed to create transaction: ${error.message}`);
        }
    }

    async getUserTransactions(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId.toString()).get();
            if (!userDoc.exists) return [];
            
            const user = userDoc.data();
            if (!user.transactions || !Array.isArray(user.transactions)) return [];
            
            return user.transactions.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting user transactions:', error);
            return [];
        }
    }

    async getAllTransactions() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const allTransactions = [];
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        allTransactions.push({
                            ...transaction,
                            username: user.username,
                            email: user.email,
                            userId: parseInt(userDoc.id)
                        });
                    });
                }
            });
            
            return allTransactions.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting all transactions:', error);
            return [];
        }
    }

    async getPendingTransactions() {
        try {
            console.log('Fetching pending transactions from Firestore...');
            
            const usersSnapshot = await this.db.collection('users').get();
            const pendingTransactions = [];
            
            usersSnapshot.forEach(userDoc => {
                const userData = userDoc.data();
                const userId = parseInt(userDoc.id);
                
                if (userData.transactions && Array.isArray(userData.transactions)) {
                    userData.transactions.forEach(transaction => {
                        if (transaction.status === 'pending') {
                            console.log('Found pending transaction:', {
                                id: transaction.id,
                                userId: userId,
                                username: userData.username,
                                type: transaction.type,
                                amount: transaction.amount
                            });
                            
                            pendingTransactions.push({
                                id: transaction.id,
                                userId: userId,
                                username: userData.username || 'Unknown',
                                email: userData.email || '',
                                type: transaction.type,
                                amount: parseFloat(transaction.amount) || 0,
                                method: transaction.method || '',
                                status: transaction.status,
                                date: transaction.date || new Date().toISOString(),
                                details: transaction.details || {},
                                adminActionDate: transaction.adminActionDate || null,
                                adminId: transaction.adminId || null
                            });
                        }
                    });
                }
            });
            
            console.log(`Total pending transactions found: ${pendingTransactions.length}`);
            return pendingTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
        } catch (error) {
            console.error('Error fetching pending transactions:', error);
            return [];
        }
    }

    async updateTransactionStatus(transactionId, status, adminId) {
        try {
            console.log('Updating transaction status:', { transactionId, status, adminId });
            
            const usersSnapshot = await this.db.collection('users').get();
            let updated = false;
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const transactions = userData.transactions || [];
                const transactionIndex = transactions.findIndex(t => t.id === transactionId);
                
                if (transactionIndex !== -1) {
                    const transaction = transactions[transactionIndex];
                    const oldStatus = transaction.status;
                    const currentTimestamp = new Date().toISOString();
                    
                    console.log('Found transaction:', {
                        id: transaction.id,
                        type: transaction.type,
                        oldStatus: oldStatus,
                        newStatus: status,
                        amount: transaction.amount,
                        userId: parseInt(userDoc.id)
                    });
                    
                    transactions[transactionIndex] = {
                        ...transaction,
                        status: status,
                        adminActionDate: currentTimestamp,
                        adminId: adminId,
                        updated_at: currentTimestamp
                    };
                    
                    let balanceAdjustment = 0;
                    
                    if (transaction.type === 'deposit' && status === 'approved' && oldStatus !== 'approved') {
                        balanceAdjustment = parseFloat(transaction.amount) || 0;
                        console.log('Deposit approved, adding to balance:', balanceAdjustment);
                        
                        const depositingUserId = parseInt(userDoc.id);
                        const depositAmount = parseFloat(transaction.amount) || 0;
                        
                        console.log('Checking for referral bonus...');
                        console.log('Depositing User ID:', depositingUserId);
                        console.log('Deposit Amount:', depositAmount);
                        
                        if (userData.referred_by) {
                            console.log('User was referred by:', userData.referred_by);
                            
                            const userTransactions = userData.transactions || [];
                            const previousApprovedDeposits = userTransactions.filter(t =>
                                t.type === 'deposit' && t.status === 'approved'
                            );
                            
                            console.log('Previous approved deposits count:', previousApprovedDeposits.length);
                            
                            if (previousApprovedDeposits.length === 0) {
                                console.log('This is the FIRST approved deposit! Awarding referral bonus...');
                                
                                const referrer = await this.findUserByReferralCode(userData.referred_by);
                                if (referrer) {
                                    console.log('Referrer found:', referrer.username, 'ID:', referrer.id);
                                    
                                    const referralBonus = depositAmount * 0.10;
                                    console.log(`10% of ${depositAmount} = ${referralBonus}`);
                                    
                                    const referrerRef = this.db.collection('users').doc(referrer.id.toString());
                                    await referrerRef.update({
                                        balance: firebase.firestore.FieldValue.increment(referralBonus),
                                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                    
                                    console.log('Referrer balance updated by:', referralBonus);
                                    
                                    const bonusTransaction = await this.createTransaction(
                                        referrer.id,
                                        'bonus',
                                        referralBonus,
                                        'referral',
                                        {
                                            description: `10% referral bonus for ${userData.username}'s first deposit`,
                                            referred_user_id: depositingUserId,
                                            referred_username: userData.username,
                                            first_deposit_amount: depositAmount,
                                            bonus_percentage: 10,
                                            source_transaction_id: transactionId,
                                            auto_approved: true
                                        }
                                    );
                                    
                                    await this.updateSingleTransactionStatus(bonusTransaction.id, 'approved', 'system');
                                    console.log('Bonus transaction created and approved');
                                    
                                    const referrerDoc = await referrerRef.get();
                                    const referrerData = referrerDoc.data();
                                    
                                    if (referrerData.referrals && Array.isArray(referrerData.referrals)) {
                                        const updatedReferrals = referrerData.referrals.map(ref => {
                                            if (ref.id === depositingUserId) {
                                                return {
                                                    ...ref,
                                                    bonus_pending: false,
                                                    first_deposit_amount: depositAmount,
                                                    bonus_amount: referralBonus,
                                                    bonus_paid: true,
                                                    bonus_paid_date: currentTimestamp,
                                                    bonus_transaction_id: bonusTransaction.id
                                                };
                                            }
                                            return ref;
                                        });
                                        
                                        await referrerRef.update({
                                            referrals: updatedReferrals,
                                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                                        });
                                        
                                        console.log('Referral record updated');
                                    }
                                    
                                    if (this.currentUser && this.currentUser.id === referrer.id) {
                                        this.currentUser.balance += referralBonus;
                                        console.log('Updated current user (referrer) balance');
                                    }
                                } else {
                                    console.log('Referrer not found with code:', userData.referred_by);
                                }
                            } else {
                                console.log('Not first deposit, skipping bonus');
                            }
                        } else {
                            console.log('User has no referrer, skipping bonus');
                        }
                    } else if (transaction.type === 'withdrawal') {
                        if (status === 'rejected' && oldStatus === 'pending') {
                            balanceAdjustment = parseFloat(transaction.amount) || 0;
                            console.log('Withdrawal rejected, adding back to balance:', balanceAdjustment);
                        }
                    }
                    
                    const userRef = this.db.collection('users').doc(userDoc.id);
                    const updateData = {
                        transactions: transactions,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    if (balanceAdjustment !== 0) {
                        updateData.balance = firebase.firestore.FieldValue.increment(balanceAdjustment);
                        
                        if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                            this.currentUser.balance += balanceAdjustment;
                            console.log('Updated current user balance:', this.currentUser.balance);
                        }
                    }
                    
                    await userRef.update(updateData);
                    console.log('Transaction status updated successfully');
                    updated = true;
                    break;
                }
            }
            
            return updated;
            
        } catch (error) {
            console.error('Error updating transaction status:', error);
            return false;
        }
    }

    async updateSingleTransactionStatus(transactionId, status, adminId) {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const transactions = userData.transactions || [];
                const transactionIndex = transactions.findIndex(t => t.id === transactionId);
                
                if (transactionIndex !== -1) {
                    const transaction = transactions[transactionIndex];
                    
                    transactions[transactionIndex] = {
                        ...transaction,
                        status: status,
                        adminActionDate: new Date().toISOString(),
                        adminId: adminId,
                        updated_at: new Date().toISOString()
                    };
                    
                    const userRef = this.db.collection('users').doc(userDoc.id);
                    await userRef.update({
                        transactions: transactions,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error updating single transaction:', error);
            return false;
        }
    }

    // ========== REFERRAL SYSTEM ==========
    async awardReferralBonusAndUpdateBalance(referrerId, depositorId, depositAmount) {
        try {
            console.log('Starting referral bonus process...');
            
            const referralBonus = depositAmount * 0.10;
            console.log(`Calculating 10% of ${depositAmount} = ${referralBonus}`);
            
            const referrerRef = this.db.collection('users').doc(referrerId.toString());
            const referrerDoc = await referrerRef.get();
            
            if (!referrerDoc.exists) {
                console.log('Referrer not found');
                return false;
            }
            
            const referrerData = referrerDoc.data();
            const oldBalance = referrerData.balance || 0;
            const newBalance = oldBalance + referralBonus;
            
            console.log(`Referrer balance: ${oldBalance} → ${newBalance}`);
            
            const transaction = await this.createTransaction(
                referrerId,
                'bonus',
                referralBonus,
                'referral',
                {
                    description: `10% referral bonus for new user deposit`,
                    referred_user_id: depositorId,
                    bonus_percentage: 10,
                    source_deposit_amount: depositAmount,
                    auto_approved: true
                }
            );
            
            const updatedReferrals = referrerData.referrals || [];
            const referralIndex = updatedReferrals.findIndex(ref => ref.id === depositorId);
            
            if (referralIndex !== -1) {
                updatedReferrals[referralIndex] = {
                    ...updatedReferrals[referralIndex],
                    bonus_pending: false,
                    first_deposit_amount: depositAmount,
                    bonus_amount: referralBonus,
                    bonus_paid: true,
                    bonus_paid_date: new Date().toISOString(),
                    bonus_transaction_id: transaction.id
                };
                
                await referrerRef.update({
                    referrals: updatedReferrals,
                    balance: newBalance,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('Referrer balance and referral record updated successfully');
                
                if (this.currentUser && this.currentUser.id === referrerId) {
                    this.currentUser.balance = newBalance;
                    console.log('Updated current user balance in frontend');
                }
                
                return true;
            }
            
            console.log('Referral not found in referrer list');
            return false;
            
        } catch (error) {
            console.error('Error awarding referral bonus:', error);
            return false;
        }
    }

    async awardReferralBonusSimple(depositingUserId, depositAmount) {
        console.log('SIMPLE: Awarding referral bonus');
        
        try {
            const userRef = this.db.collection('users').doc(depositingUserId.toString());
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) return false;
            
            const user = userDoc.data();
            const referrerCode = user.referred_by;
            
            if (!referrerCode) {
                console.log('No referrer code');
                return false;
            }
            
            const referrer = await this.findUserByReferralCode(referrerCode);
            if (!referrer) return false;
            
            const referralBonus = depositAmount * 0.10;
            
            const referrerRef = this.db.collection('users').doc(referrer.id.toString());
            await referrerRef.update({
                balance: firebase.firestore.FieldValue.increment(referralBonus),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`IMMEDIATE: Added ${referralBonus} to referrer ${referrer.username}`);
            
            const bonusTransaction = await this.createTransaction(
                referrer.id,
                'bonus',
                referralBonus,
                'referral',
                {
                    description: `10% referral bonus for ${user.username}'s first deposit`,
                    referred_user_id: depositingUserId,
                    referred_username: user.username,
                    first_deposit_amount: depositAmount,
                    bonus_percentage: 10,
                    immediate: true
                }
            );
            
            await this.updateSingleTransactionStatus(bonusTransaction.id, 'approved', 'system');
            
            return true;
            
        } catch (error) {
            console.error('Error in simple referral bonus:', error);
            return false;
        }
    }

    // ========== STATISTICS ==========
    async getTotalUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting total users:', error);
            return 0;
        }
    }

    async getTotalDeposits() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            let total = 0;
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        if (transaction.type === 'deposit' && transaction.status === 'approved') {
                            total += parseFloat(transaction.amount) || 0;
                        }
                    });
                }
            });
            
            return total;
        } catch (error) {
            console.error('Error getting total deposits:', error);
            return 0;
        }
    }

    async getTotalWithdrawals() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            let total = 0;
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        if (transaction.type === 'withdrawal' && transaction.status === 'approved') {
                            total += parseFloat(transaction.amount) || 0;
                        }
                    });
                }
            });
            
            return total;
        } catch (error) {
            console.error('Error getting total withdrawals:', error);
            return 0;
        }
    }

    // ========== ADMIN UTILITIES ==========
    isSuperAdmin(user) {
        return user && user.email === 'kingharuni420@gmail.com' && user.is_super_admin === true;
    }

    getSuperAdmin() {
        return this.getUsers().then(users => 
            users.find(user => user.email === 'kingharuni420@gmail.com')
        );
    }

    isAdminEmail(email) {
        if (!email) return false;
        
        const adminEmails = [
            'kingharuni420@gmail.com',
            'mining.investment.tanzania@proton.me',
            'halunihillison@gmail.com',
            'mining.investment25@gmail.com',
            'chamahuru01@gmail.com',
            'fracozecompany@gmail.com',
            'harunihilson@gmail.com'
        ];
        
        return adminEmails.includes(email.toLowerCase());
    }

    isRegularAdminEmail(email) {
        if (!email) return false;
        
        const regularAdminEmails = [
            'mining.investment.tanzania@proton.me',
            'halunihillison@gmail.com',
            'mining.investment25@gmail.com',
            'chamahuru01@gmail.com',
            'fracozecompany@gmail.com',
            'harunihilson@gmail.com'
        ];
        
        return regularAdminEmails.includes(email.toLowerCase());
    }

    // ========== DEBUGGING ==========
    async debugDepositApproval(transactionId) {
        console.log('=== DEBUGGING DEPOSIT APPROVAL ===');
        
        try {
            const usersSnapshot = await this.db.collection('users').get();
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const transactions = userData.transactions || [];
                const transaction = transactions.find(t => t.id === transactionId);
                
                if (transaction && transaction.type === 'deposit') {
                    console.log('Found deposit transaction:', {
                        transactionId: transaction.id,
                        userId: parseInt(userDoc.id),
                        username: userData.username,
                        amount: transaction.amount,
                        status: transaction.status,
                        referred_by: userData.referred_by
                    });
                    
                    if (userData.referred_by) {
                        console.log('User has referrer code:', userData.referred_by);
                        
                        const referrer = await this.findUserByReferralCode(userData.referred_by);
                        if (referrer) {
                            console.log('Referrer found:', {
                                id: referrer.id,
                                username: referrer.username,
                                current_balance: referrer.balance
                            });
                            
                            const previousApprovedDeposits = transactions.filter(t => 
                                t.type === 'deposit' && t.status === 'approved'
                            );
                            
                            console.log('Previous approved deposits:', previousApprovedDeposits.length);
                            
                            if (previousApprovedDeposits.length === 0) {
                                console.log('THIS IS THE FIRST DEPOSIT - Bonus should be awarded!');
                                console.log('Calculated bonus amount:', transaction.amount * 0.10);
                            }
                        }
                    }
                    
                    break;
                }
            }
            
        } catch (error) {
            console.error('Debug error:', error);
        }
        
        console.log('=== END DEBUG ===');
    }

    async debugUserBalance(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId.toString()).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('=== USER BALANCE DEBUG ===');
                console.log('User ID:', userId);
                console.log('Username:', userData.username);
                console.log('Current Balance:', userData.balance);
                console.log('Transactions count:', userData.transactions?.length || 0);
                
                const bonusTransactions = (userData.transactions || []).filter(t => 
                    t.type === 'bonus' && t.method === 'referral'
                );
                
                console.log('Bonus Transactions:', bonusTransactions.length);
                bonusTransactions.forEach((t, i) => {
                    console.log(`Bonus ${i+1}:`, {
                        amount: t.amount,
                        date: t.date,
                        description: t.details?.description
                    });
                });
                
                console.log('Referrals:', userData.referrals?.length || 0);
                (userData.referrals || []).forEach((ref, i) => {
                    console.log(`Referral ${i+1}:`, {
                        username: ref.username,
                        bonus_paid: ref.bonus_paid,
                        bonus_amount: ref.bonus_amount,
                        first_deposit_amount: ref.first_deposit_amount
                    });
                });
                
                return userData.balance;
            }
            return null;
        } catch (error) {
            console.error('Error debugging user balance:', error);
            return null;
        }
    }

    // ========== ACHIEVEMENT SYSTEM ==========
    async recordInvestmentAchievement(userId, achievementType, amount, details = {}) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            const achievement = {
                id: Date.now(),
                type: achievementType,
                amount: amount,
                date: new Date().toISOString(),
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await userRef.update({
                achievements: firebase.firestore.FieldValue.arrayUnion(achievement),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return achievement;
            
        } catch (error) {
            console.error('Error recording investment achievement:', error);
            return null;
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing application...');
    
    // Initialize database first
    try {
        await initializeDatabase();
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
    
    // Initialize login tabs
    initLoginTabs();
    
    // Set up form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            signup();
        });
    }
    
    // Check if user is already logged in
    if (db && db.currentUser) {
        console.log('User already logged in:', db.currentUser.username);
        
        if (db.currentUser.is_super_admin) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    } else {
        console.log('No user logged in');
    }
    
    console.log('✅ Application initialized successfully');
});

// Initialize database only once
function initializeDatabase() {
    if (!db) {
        db = new Database();
        window.db = db; // Make it globally available
        
        // Initialize database
        db.initDatabase().then(() => {
            console.log('Database initialized successfully');
        });
    }
    return db;
}

// Make functions globally available
window.initializeDatabase = initializeDatabase;

console.log('✅ Database class loaded successfully');

        
function setupAdminEmailDetection() {
    const loginEmailInput = document.getElementById('login-email');
    const adminPasswordSection = document.getElementById('admin-password-section');
    
    if (loginEmailInput && adminPasswordSection) {
        loginEmailInput.addEventListener('input', async function() {
            const email = this.value.trim().toLowerCase();
            
            if (!email) {
                adminPasswordSection.style.display = 'none';
                return;
            }
            
            try {
                // Check if user exists and is admin
                const user = await db.findUserByEmail(email);
                
                if (user && user.is_admin === true) {
                    console.log('Admin detected:', user.email);
                    adminPasswordSection.style.display = 'block';
                    
                    // If it's super admin email, show special message
                    if (email === 'kingharuni420@gmail.com') {
                        adminPasswordSection.innerHTML = `
                            <div class="form-control">
                                <label for="admin-password">Super Admin Password</label>
                                <input type="password" id="admin-password" placeholder="Enter super admin password" required>
                                <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                                    <i class="far fa-eye"></i> <span>Show Password</span>
                                </div>
                            </div>
                            <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                                <i class="fas fa-crown"></i> Super Admin access detected
                            </p>
                        `;
                    } else {
                        adminPasswordSection.innerHTML = `
                            <div class="form-control">
                                <label for="admin-password">Admin Password</label>
                                <input type="password" id="admin-password" placeholder="Enter admin password" required>
                                <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                                    <i class="far fa-eye"></i> <span>Show Password</span>
                                </div>
                            </div>
                            <p style="font-size: 12px; color: var(--warning); margin-top: 10px;">
                                <i class="fas fa-user-shield"></i> Admin access detected
                            </p>
                        `;
                    }
                } else {
                    adminPasswordSection.style.display = 'none';
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                adminPasswordSection.style.display = 'none';
            }
        });
    }
}


// ===== HAMBURGER NAVIGATION FUNCTIONS =====

// Toggle sidebar function
function toggleSidebar(type) {
    const uiwrap = document.getElementById(`${type}-uiwrap`);
    const sidebar = document.getElementById(`${type}-side`);
    const hamburger = document.getElementById(`${type}-hamburger`);
    
    if (!uiwrap || !sidebar) return;
    
    uiwrap.classList.toggle('active');
    sidebar.classList.toggle('active');
    
    if (hamburger) {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
    }
    
    // Update hamburger icon
    if (hamburger && hamburger.querySelector('i')) {
        const icon = hamburger.querySelector('i');
        if (uiwrap.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Close sidebar function
function closeSidebar(type) {
    const uiwrap = document.getElementById(`${type}-uiwrap`);
    const sidebar = document.getElementById(`${type}-side`);
    const hamburger = document.getElementById(`${type}-hamburger`);
    
    if (uiwrap) uiwrap.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
    
    if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        const icon = hamburger.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Function to determine which sidebar is currently open
function getActiveSidebarType() {
    if (document.getElementById('user-uiwrap')?.classList.contains('active')) return 'user';
    if (document.getElementById('admin-uiwrap')?.classList.contains('active')) return 'admin';
    if (document.getElementById('super-admin-uiwrap')?.classList.contains('active')) return 'super-admin';
    return null;
}

// Auto close hamburger after navigation link is clicked
function autoCloseHamburgerAfterNav() {
    const activeSidebar = getActiveSidebarType();
    if (activeSidebar) {
        closeSidebar(activeSidebar);
    }
}

// Initialize sidebar event listeners
function initializeSidebars() {
    // Close buttons
    document.getElementById('user-closeSide')?.addEventListener('click', () => closeSidebar('user'));
    document.getElementById('admin-closeSide')?.addEventListener('click', () => closeSidebar('admin'));
    document.getElementById('super-admin-closeSide')?.addEventListener('click', () => closeSidebar('super-admin'));
    
    // Backdrop clicks
    document.getElementById('user-back')?.addEventListener('click', () => closeSidebar('user'));
    document.getElementById('admin-back')?.addEventListener('click', () => closeSidebar('admin'));
    document.getElementById('super-admin-back')?.addEventListener('click', () => closeSidebar('super-admin'));
    
    // Navigation link clicks - AUTO CLOSE HAMBURGER
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section from data-target attribute
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            
            // AUTO CLOSE HAMBURGER DROPDOWN
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Bottom bar item clicks - AUTO CLOSE HAMBURGER
    document.querySelectorAll('.bottom-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.bottom-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Get target section
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            
            // AUTO CLOSE HAMBURGER DROPDOWN
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Handle clicks on sidebar action buttons (deposit, withdraw, etc.)
    document.querySelectorAll('.sidebar-action-btn').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Handle clicks on sidebar logout link
    document.querySelectorAll('.nav-link.logout').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            autoCloseHamburgerAfterNav();
            cleanupRewardsListeners();
        });
    });
}

// ===== TAB NAVIGATION FUNCTIONALITY =====

function switchToSection(sectionId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

function loadSectionData(sectionId) {
    console.log('📂 Loading section data for:', sectionId);
    
    switch(sectionId) {
        case 'rewards':
            if (window.rewardsSystem && !window.rewardsSystem.isAdmin) {
                console.log('Loading user rewards section...');
                setTimeout(async () => {
                    await loadUserRewardsUI();
                }, 200);
            }
            break;
            
        case 'rewards-management':
            if (window.rewardsSystem && window.rewardsSystem.isAdmin) {
                console.log('Loading admin rewards management...');
                setTimeout(async () => {
                    await loadAdminRewardsUI();
                }, 200);
            }
            break;
            
        case 'user-management':
            console.log('🔥 Loading user management...');
            setTimeout(async () => {
                await loadUserManagementSection();
            }, 100);
            break;
            
        default:
            console.log('Loading other section:', sectionId);
    }
}

    // Update active nav links in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Update active bottom bar items
    document.querySelectorAll('.bottom-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update dashboard title
    updateDashboardTitle(sectionId);
    
    // Load section-specific data
    loadSectionData(sectionId);
    
    // Scroll to top of the section
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateDashboardTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Investment Dashboard',
        'profile': 'Profile Settings',
        'marketplace': 'Mineral Marketplace',
        'myinvestment': 'My Investments',
        'referrals': 'Referral Network',
        'history': 'Transaction History',
        'rewards': 'Daily Rewards',
        'support': 'Contact Support',
        'about': 'About Us',
        'faq': 'Frequently Asked Questions',
        'admin-approvals': 'Admin Approvals',
        'admin-history': 'Transaction History',
        'admin-chat': 'Chat Support',
        'rewards': 'Rewards System',
        'rewards-management': 'Rewards Management',
        'admin-announcements': 'announcement Management',
        'reports': 'Reports & Analytics',
        'admin-settings': 'Admin Settings',
        'admin-calculator': 'Admin Calculator',
        'super-admin-overview': 'System Overview',
        'admin-management': 'Admin Management',
        'user-management': 'User Management',
        'task-management': 'Task Management',
        'system-monitoring': 'System Monitoring',
        'super-admin-settings': 'System Settings',
        'super-admin-reports': 'Full Reports',
        'system-backup': 'Backup System',
    };
    
    // Update user dashboard title
    const userTitleElement = document.getElementById('user-dashboard-title');
    if (userTitleElement && titleMap[sectionId]) {
        userTitleElement.textContent = titleMap[sectionId];
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initializeSidebars();
    
    // Set default active section if none is active
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) {
        // Set dashboard as default
        switchToSection('dashboard');
    }
    
    // Add event listeners for other navigation elements that should close hamburger
    
    // Profile dropdown in header
    document.querySelector('.user-profile')?.addEventListener('click', function() {
        autoCloseHamburgerAfterNav();
    });
    
    // Dashboard tabs within profile section
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            autoCloseHamburgerAfterNav();
        });
    });
    
    // About page tabs
    document.querySelectorAll('.about-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            // Your about tab switching logic here
            autoCloseHamburgerAfterNav();
        });
    });
    
    // FAQ category buttons
    document.querySelectorAll('.faq-category').forEach(category => {
        category.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // FAQ question toggles
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Modal close buttons (they might be inside hamburger)
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Quick action buttons in profile dropdown
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Gamified nav items in profile dropdown
    document.querySelectorAll('.gamified-nav .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('onclick')?.match(/switchToSection\('(\w+)'\)/)?.[1];
            if (target) {
                switchToSection(target);
            }
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Close hamburger when clicking outside on mobile
    document.addEventListener('click', function(event) {
        // Check if hamburger is open and click is outside
        const activeSidebar = getActiveSidebarType();
        if (activeSidebar && window.innerWidth <= 768) {
            const sidebar = document.getElementById(`${activeSidebar}-side`);
            const hamburger = document.getElementById(`${activeSidebar}-hamburger`);
            
            if (sidebar && !sidebar.contains(event.target) && 
                hamburger && !hamburger.contains(event.target)) {
                closeSidebar(activeSidebar);
            }
        }
    });
});

// For backward compatibility with onclick handlers in HTML
// Update these functions to auto-close hamburger

function openSupportOption(option) {
    switch(option) {
        case 'whatsapp':
            window.open('https://wa.me/255768616961', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255768616961';
            break;
        case 'chat':
            chatSystem.openUserChatModal();
            break;
    }
    autoCloseHamburgerAfterNav();
}

        // Copy referral code
        function copyReferralCode() {
            const referralCode = document.getElementById('user-referral-code').textContent;
            navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
        }

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    autoCloseHamburgerAfterNav();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    autoCloseHamburgerAfterNav();
}

// ========== OPEN INVESTMENT MODAL (FIXED) ==========

function openInvestmentModal(mineral, price) {
    console.log('🔓 Opening investment modal for:', mineral, 'Price:', price);
    
    // Check if user is logged in
    if (!db || !db.currentUser) {
        showNotification('Please login to invest.', true);
        // Redirect to login
        setTimeout(() => {
            switchToSection('login');
        }, 1000);
        return;
    }
    
    // Check first deposit
    if (!hasUserMadeFirstDeposit()) {
        showNotification('Please make your first deposit before investing.', true);
        
        // Open deposit modal after delay
        setTimeout(() => {
            const depositModal = document.getElementById('deposit-modal');
            if (depositModal) {
                depositModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            } else {
                // If no deposit modal, redirect to deposit section
                switchToSection('deposit');
            }
        }, 1500);
        return;
    }
    
    // Set current mineral and price
    currentMineral = mineral;
    currentPrice = price;
    
    // Create modal if it doesn't exist
    if (!document.getElementById('investment-modal')) {
        createInvestmentModal();
    }
    
    // Update modal content
    updateModalContent();
    
    // Show modal
    const modal = document.getElementById('investment-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Setup investment button
    setTimeout(() => {
        setupInvestmentActionButton();
    }, 100);
}

// Function to open investment details modal
function openInvestmentDetailsModal(investmentId) {
    const investment = investments.find(inv => compareInvestmentIds(inv.id, investmentId));
    if (!investment) {
        showNotification('Uwekezaji haupatikani.', true);
        return;
    }
    
    // Create or update modal
    let modal = document.getElementById('investment-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'investment-details-modal';
        modal.className = 'investment-details-modal';
        document.body.appendChild(modal);
    }
    
    // Calculate values
    const currentProfit = calculateCurrentProfit(investment);
    const profitPercentage = investment.cost > 0 ? (currentProfit / investment.cost) * 100 : 0;
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const progress = !investment.completed ?
        Math.min(100, ((now - startDate) / (endDate - startDate)) * 100) : 100;
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeInvestmentDetailsModal()"></div>
        <div class="modal-container ${investment.completed ? 'completed' : 'active'}">
            <div class="modal-header ${investment.completed ? 'completed' : ''}">
                <div class="modal-title">
                    <i class="fas fa-gem"></i>
                    <span>${investment.mineral} Investment Details</span>
                </div>
                <button class="modal-close" onclick="closeInvestmentDetailsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="modal-content-grid">
                    <!-- Basic Information -->
                    <div class="modal-section">
                        <h3 class="section-title">
                            <i class="fas fa-info-circle"></i>
                            Basic Information
                        </h3>
                        <div class="info-grid">
                            <div class="info-row">
                                <span class="info-label">Mineral Type</span>
                                <span class="info-value">${investment.mineral}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Amount</span>
                                <span class="info-value">${investment.grams} grams</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Duration</span>
                                <span class="info-value">${investment.days} days</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Investment</span>
                                <span class="info-value highlight">TZS ${Math.round(investment.cost).toLocaleString()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Status</span>
                                <span class="info-value ${investment.completed ? 'success' : 'highlight'}">
                                    ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Profit Breakdown -->
                    <div class="profit-breakdown">
                        <h3 class="section-title">
                            <i class="fas fa-chart-line"></i>
                            Profit Analysis
                        </h3>
                        <div class="profit-grid">
                            <div class="profit-item">
                                <span class="detail-label">Current Profit</span>
                                <div class="profit-amount">TZS ${Math.round(currentProfit).toLocaleString()}</div>
                                <span class="detail-label">${profitPercentage.toFixed(2)}% return</span>
                            </div>
                            ${!investment.completed ? `
                            <div class="profit-item">
                                <span class="detail-label">Expected Profit</span>
                                <div class="profit-amount">TZS ${Math.round(investment.totalExpectedProfit || 0).toLocaleString()}</div>
                                <span class="detail-label">At completion</span>
                            </div>
                            ` : `
                            <div class="profit-item">
                                <span class="detail-label">Final Profit</span>
                                <div class="profit-amount">TZS ${Math.round(investment.finalProfit || 0).toLocaleString()}</div>
                                <span class="detail-label">Achieved</span>
                            </div>
                            `}
                            <div class="profit-item">
                                <span class="detail-label">Total Return</span>
                                <div class="profit-amount total">
                                    TZS ${Math.round(investment.cost + (investment.completed ? investment.finalProfit || 0 : currentProfit)).toLocaleString()}
                                </div>
                                <span class="detail-label">Including principal</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Timeline -->
                    <div class="modal-section">
                        <h3 class="section-title">
                            <i class="fas fa-history"></i>
                            Investment Timeline
                        </h3>
                        <div class="timeline">
                            <div class="timeline-item">
                                <div class="timeline-content">
                                    <div class="timeline-date">${startDate.toLocaleDateString()}</div>
                                    <div class="timeline-title">Investment Started</div>
                                    <div class="timeline-description">You invested TZS ${Math.round(investment.cost).toLocaleString()}</div>
                                </div>
                            </div>
                            
                            ${!investment.completed ? `
                            <div class="timeline-item">
                                <div class="timeline-content">
                                    <div class="timeline-date">${endDate.toLocaleDateString()}</div>
                                    <div class="timeline-title">Expected Completion</div>
                                    <div class="timeline-description">${Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))} days remaining</div>
                                </div>
                            </div>
                            ` : `
                            <div class="timeline-item completed">
                                <div class="timeline-content">
                                    <div class="timeline-date">${new Date(investment.completionDate).toLocaleDateString()}</div>
                                    <div class="timeline-title">Investment Completed</div>
                                    <div class="timeline-description">Total payout: TZS ${Math.round(investment.cost + (investment.finalProfit || 0)).toLocaleString()}</div>
                                </div>
                            </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Progress -->
                    <div class="modal-section">
                        <h3 class="section-title">
                            <i class="fas fa-tasks"></i>
                            Progress Status
                        </h3>
                        <div class="progress-section">
                            <div class="progress-header">
                                <div class="progress-label">Completion Progress</div>
                                <div class="progress-percentage">${progress.toFixed(1)}%</div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                            <div class="time-info">
                                <div class="time-start">
                                    <div class="time-label">Start Date</div>
                                    <div>${startDate.toLocaleDateString()}</div>
                                </div>
                                <div class="time-end">
                                    <div class="time-label">${investment.completed ? 'Completed' : 'End Date'}</div>
                                    <div>${investment.completed ? new Date(investment.completionDate).toLocaleDateString() : endDate.toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="modal-btn btn-close-modal" onclick="closeInvestmentDetailsModal()">
                    <i class="fas fa-times"></i> Close
                </button>
                <button class="modal-btn btn-delete-modal" onclick="deleteInvestment('${investment.id}'); closeInvestmentDetailsModal();">
                    <i class="fas fa-trash"></i> ${investment.completed ? 'Delete Record' : 'Cancel Investment'}
                </button>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Function to close investment details modal
function closeInvestmentDetailsModal() {
    const modal = document.getElementById('investment-details-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Update your card creation function to use the new modal
function createInvestmentCard(investment) {
    // ... existing card creation code ...
    
    // Update the view details button
    return `
        <div class="mineral-investment-card ${investment.completed ? 'completed' : 'active'}">
            <!-- ... existing card content ... -->
            
            <div class="investment-actions">
                <button class="action-btn btn-view" onclick="openInvestmentDetailsModal('${investment.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="action-btn btn-delete" onclick="deleteInvestment('${investment.id}')">
                    <i class="fas fa-trash"></i> ${investment.completed ? 'Delete' : 'Cancel'}
                </button>
            </div>
        </div>
    `;
}

// ========== INVESTMENT BUTTON SETUP (FIXED) ==========

function setupInvestmentActionButton() {
    console.log('🔧 Setting up investment action button...');
    
    // Find the button
    const startBtn = document.getElementById('start-investment-btn');
    
    if (!startBtn) {
        console.error('❌ Start investment button not found');
        // Try again after delay
        setTimeout(setupInvestmentActionButton, 500);
        return;
    }
    
    console.log('✅ Found start investment button');
    
    // Remove ALL existing event listeners
    const newBtn = startBtn.cloneNode(true);
    if (startBtn.parentNode) {
        startBtn.parentNode.replaceChild(newBtn, startBtn);
    }
    
    // Add click handler
    newBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('🎯 Investment start button clicked!');
        
        // Check if already processing
        if (this.disabled) {
            console.log('Button already processing, ignoring click');
            return;
        }
        
        // Disable button immediately
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Process investment
        await processInvestmentCreation();
        
        // Re-enable button after delay
        setTimeout(() => {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-play-circle"></i> Start Investment';
        }, 2000);
    });
    
    console.log('✅ Investment button setup complete');
}

async function processInvestmentCreation() {
    console.log('🔄 Processing investment creation...');
    
    try {
        // Get input values
        const gramsInput = document.getElementById('investment-grams');
        const daysInput = document.getElementById('investment-days');
        
        if (!gramsInput || !daysInput) {
            throw new Error('Investment form not found');
        }
        
        const grams = parseFloat(gramsInput.value);
        const days = parseInt(daysInput.value);
        
        // Validation
        if (!grams || grams <= 0) {
            throw new Error('Please enter a valid amount of grams');
        }
        
        if (!days || days < 7) {
            throw new Error('Minimum investment period is 7 days');
        }
        
        if (!currentMineral || !currentPrice) {
            throw new Error('Mineral information missing');
        }
        
        const investmentAmount = grams * currentPrice;
        
        // Check balance
        if (!db.currentUser || investmentAmount > db.currentUser.balance) {
            throw new Error('Insufficient balance');
        }
        
        // Create investment
        await createNewInvestment(grams, days, investmentAmount);
        
    } catch (error) {
        console.error('❌ Investment error:', error);
        showNotification(`❌ ${error.message}`, true);
    }
}

async function createNewInvestment(grams, days, amount) {
    console.log('💎 Creating new investment:', { grams, days, amount });
    
    try {
        // Generate unique ID
        const investmentId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create investment object
        const newInvestment = {
            id: investmentId,
            mineral: currentMineral,
            grams: grams,
            days: days,
            startTime: new Date().toISOString(),
            cost: amount,
            completed: false,
            completionDate: null,
            finalProfit: 0
        };
        
        // 1. Deduct balance
        db.currentUser.balance -= amount;
        console.log(`💰 New balance: ${db.currentUser.balance}`);
        
        // 2. Update UI immediately
        updateAllBalanceDisplays();
        
        // 3. Add to investments array
        investments.push(newInvestment);
        
        // 4. Save to Firebase
        const balanceSaved = await saveUserBalanceToFirebase(db.currentUser.id, db.currentUser.balance);
        if (!balanceSaved) throw new Error('Failed to save balance');
        
        const investmentsSaved = await saveAllInvestmentsToFirebase();
        if (!investmentsSaved) throw new Error('Failed to save investment');
        
        // 5. Close modal
        closeInvestmentModal();
        
        // 6. Update displays
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        // 7. Start profit calculation
        startProfitCalculation(newInvestment.id);
        
        // 8. Show success
        showNotification(`✅ Investment started! ${grams}g of ${currentMineral} for ${days} days`);
        
        console.log('🎉 Investment created successfully');
        
        setTimeout(() => {
            loadDashboardStats();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Create investment error:', error);
        throw error;
    }
}

function updateModalContent() {
    // Update mineral name
    const mineralName = document.getElementById('modal-mineral-name');
    if (mineralName) {
        mineralName.textContent = `Invest in ${currentMineral}`;
    }
    
    // Update price
    const priceDisplay = document.getElementById('modal-price-display');
    if (priceDisplay) {
        priceDisplay.textContent = `TZS ${currentPrice.toLocaleString()}`;
    }
    
    // Update balance
    const balanceDisplay = document.getElementById('modal-balance-display');
    if (balanceDisplay && db.currentUser) {
        balanceDisplay.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    }
    
    // Update daily rate
    const dailyRateDisplay = document.getElementById('daily-rate-display');
    if (dailyRateDisplay) {
        const todayRate = getDailyReturnRate(new Date());
        dailyRateDisplay.textContent = `${todayRate}%`;
    }
    
    // Reset inputs
    const gramsInput = document.getElementById('investment-grams');
    const daysInput = document.getElementById('investment-days');
    if (gramsInput) gramsInput.value = '';
    if (daysInput) daysInput.value = '7';
    
    // Reset calculations
    calculateInvestmentReturn();
}

function createInvestmentModal() {
    const modal = document.createElement('div');
    modal.id = 'investment-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-gem"></i> <span id="modal-mineral-name">Invest in Mineral</span></h3>
                <button class="close-modal" onclick="closeInvestmentModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <!-- Price and balance info -->
                <div class="info-cards">
                    <div class="info-card">
                        <div class="info-label">Price per gram</div>
                        <div class="info-value" id="modal-price-display">TZS 0</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Your Balance</div>
                        <div class="info-value" id="modal-balance-display">TZS 0</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Daily Rate</div>
                        <div class="info-value" id="daily-rate-display">3%</div>
                    </div>
                </div>
                
                <!-- Investment form -->
                <div class="investment-form">
                    <div class="form-group">
                        <label for="investment-grams">
                            <i class="fas fa-weight"></i> Quantity (grams)
                        </label>
                        <input type="number" id="investment-grams" 
                               min="0.1" step="0.1" placeholder="0.00"
                               oninput="calculateInvestmentReturn()">
                        <div class="quick-buttons">
                            <button class="quick-btn" onclick="setQuickGrams(1)">1g</button>
                            <button class="quick-btn" onclick="setQuickGrams(5)">5g</button>
                            <button class="quick-btn" onclick="setQuickGrams(10)">10g</button>
                            <button class="quick-btn" onclick="setQuickGrams(50)">50g</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="investment-days">
                            <i class="fas fa-calendar"></i> Duration (days)
                        </label>
                        <input type="number" id="investment-days" 
                               min="7" max="365" value="7"
                               oninput="calculateInvestmentReturn()">
                        <div class="quick-buttons">
                            <button class="quick-btn" onclick="setQuickDays(7)">7d</button>
                            <button class="quick-btn" onclick="setQuickDays(30)">30d</button>
                            <button class="quick-btn" onclick="setQuickDays(90)">90d</button>
                            <button class="quick-btn" onclick="setQuickDays(180)">180d</button>
                        </div>
                    </div>
                </div>
                
                <!-- Calculation results -->
                <div class="calculation-results">
                    <h4><i class="fas fa-calculator"></i> Investment Summary</h4>
                    
                    <div class="result-item">
                        <span>Total Investment:</span>
                        <strong id="total-investment-amount">TZS 0</strong>
                    </div>
                    
                    <div class="result-item">
                        <span>Daily Profit:</span>
                        <strong id="daily-profit-amount">TZS 0</strong>
                    </div>
                    
                    <div class="result-item">
                        <span>Expected Total Profit:</span>
                        <strong id="total-profit-amount">TZS 0</strong>
                    </div>
                    
                    <div class="result-item total">
                        <span>Expected Total Return:</span>
                        <strong id="total-return-amount">TZS 0</strong>
                    </div>
                </div>
                
                <!-- Warning message -->
                <div id="insufficient-warning" class="warning-message" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Insufficient balance</span>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeInvestmentModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button id="start-investment-btn" class="btn-start">
                    <i class="fas fa-play-circle"></i> Start Investment
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup close on click outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeInvestmentModal();
        }
    });
}

// Quick button functions
function setQuickGrams(grams) {
    const input = document.getElementById('investment-grams');
    if (input) {
        input.value = grams;
        calculateInvestmentReturn();
    }
}

function setQuickDays(days) {
    const input = document.getElementById('investment-days');
    if (input) {
        input.value = days;
        calculateInvestmentReturn();
    }
}

function updateUserActivationStatus() {
    const activationStatus = document.getElementById('activation-status');
    if (!activationStatus) return;
    
    const isActivated = isUserActivated();
    
    if (isActivated) {
        activationStatus.innerHTML = `
            <div class="status-badge active">
                <i class="fas fa-check-circle"></i>
                <span>Akaunti Imethibitishwa</span>
            </div>
            <p class="status-message">Unaweza kuanza kuwekeza sasa!</p>
        `;
    } else {
        activationStatus.innerHTML = `
            <div class="status-badge inactive">
                <i class="fas fa-clock"></i>
                <span>Inasubiri Activation</span>
            </div>
            <div class="activation-steps">
                <h4>Hatua za Kuanza Kuwekeza:</h4>
                <ol>
                    <li>Fanya deposit ya kwanza</li>
                    <li>Subiri admin aapprove deposit yako</li>
                    <li>Anza kuwekeza katika madini mbalimbali</li>
                </ol>
            </div>
            <button class="btn-primary" onclick="openModal('deposit-modal')">
                <i class="fas fa-money-bill-wave"></i> Fanya Deposit Ya Kwanza
            </button>
        `;
    }
}


function updateInvestmentModalContent() {
    // Check if user can invest
    if (!isUserActivated()) {
        // Hide the investment form and show message
        const investmentForm = document.querySelector('.investment-form');
        const depositRequiredMessage = document.getElementById('deposit-required-message');
        
        if (investmentForm) investmentForm.style.display = 'none';
        
        if (!depositRequiredMessage) {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                const messageDiv = document.createElement('div');
                messageDiv.id = 'deposit-required-message';
                messageDiv.style.cssText = `
                    text-align: center;
                    padding: 40px 20px;
                `;
                messageDiv.innerHTML = `
                    <div style="font-size: 60px; color: #f39c12; margin-bottom: 20px;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Deposit Inahitajika</h3>
                    <p style="color: #7f8c8d; margin-bottom: 25px;">
                        Unahitaji kufanya deposit ya kwanza kabla ya kuwekeza. 
                        Deposit yako ya kwanza inahitaji kuwa approved na admin.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn-primary" onclick="closeInvestmentModal(); openModal('deposit-modal');" 
                            style="padding: 10px 20px;">
                            <i class="fas fa-money-bill-wave"></i> Fanya Deposit
                        </button>
                        <button class="btn-secondary" onclick="closeInvestmentModal()" 
                            style="padding: 10px 20px;">
                            <i class="fas fa-times"></i> Funga
                        </button>
                    </div>
                `;
                modalContent.appendChild(messageDiv);
            }
        }
        return;
    }
    
    // Normal modal content if user is activated
    // ... existing modal content setup ...
}


// Placeholder functions
function showNotification(message) {
    // Implement notification display
    console.log('Notification:', message);
}

function showError(message) {
    // Implement error display
    console.error('Error:', message);
}

// Login Tabs Function
function initLoginTabs() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginTab && signupTab && loginForm && signupForm) {
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
        
        const loginEmailInput = document.getElementById('login-email');
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (loginEmailInput && adminPasswordSection) {
            loginEmailInput.addEventListener('input', function() {
                if (db && db.isAdminEmail && db.isAdminEmail(this.value)) {
                    adminPasswordSection.style.display = 'block';
                } else {
                    adminPasswordSection.style.display = 'none';
                }
            });
        }
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const adminPassword = document.getElementById('admin-password')?.value || '';
    const loginButton = document.getElementById('login-button');
    
    try {
        // Check if database is initialized
        if (!db) {
            alert('❌ Database not initialized. Please refresh the page.');
            return;
        }
        
        console.log('Attempting login for:', email);
        
        const user = await db.findUserByEmailOrUsername(email);
        
        if (!user) {
            alert('❌ User not found!');
            setButtonLoading(loginButton, false);
            return;
        }
        
        console.log('User found:', {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin,
            is_super_admin: user.is_super_admin,
            status: user.status
        });
        
        // Check account status
        if (user.status === 'inactive') {
            alert('❌ Your account has been deactivated. Please contact administrator.');
            setButtonLoading(loginButton, false);
            return;
        }
        
        // SUPER ADMIN check
        if (email.toLowerCase() === 'kingharuni420@gmail.com') {
    if (password === 'Rehema@mam') {
        db.currentUser = user;
        console.log('Super admin login successful');
        
        // Show dashboard immediately
        showSuperAdminDashboard();
        
                // Show dashboard immediately
                showSuperAdminDashboard();
                
                // Initialize referral system for super admin
                try {
                    await initReferralSystem();
                } catch (error) {
                    console.error('Error initializing referral system for super admin:', error);
                }
                
                // Initialize rewards in background with loading indicator
                showLoadingOverlay('Initializing rewards system...');
                initializeRewardsSystem(user)
                    .then(() => hideLoadingOverlay())
                    .catch(error => {
                        hideLoadingOverlay();
                        console.error('Rewards system failed:', error);
                        showToast('Rewards system may have limited functionality', 'warning');
                    });
            } else {
                alert('❌ Invalid password!');
                setButtonLoading(loginButton, false);
            }
            return;
        }
        
        // Password check for all users
        if (user.password !== password) {
            alert('❌ Invalid password!');
            setButtonLoading(loginButton, false);
            return;
        }
        
        // Check if regular admin
        if (db.isAdminEmail(user.email) || user.is_admin) {
            if (adminPassword !== user.admin_password) {
                alert('❌ Invalid admin password!');
                setButtonLoading(loginButton, false);
                return;
            }
            
            db.currentUser = user;
            console.log('Admin login successful:', user.username);
            
            // Update last active timestamp
            updateLastActive(user.id).catch(console.error);
            
            // Show dashboard immediately
            showAdminDashboard();
            
            // Initialize referral system for admin
            try {
                await initReferralSystem();
            } catch (error) {
                console.error('Error initializing referral system for admin:', error);
            }
            
            // Check admin permissions (non-blocking)
            setTimeout(() => checkAdminPermissions(user), 100);
            
            // Initialize systems in background with progress indicator
            initializeBackgroundSystems(user);
            
        } else {
            // Regular user
            db.currentUser = user;
            console.log('User login successful:', user.username);
            
            // Show dashboard immediately
            showUserDashboard();
            
            // Initialize systems in background with progress indicator
            initializeBackgroundSystems(user);
        }
        
        setButtonLoading(loginButton, false);
        
    } catch (error) {
        setButtonLoading(loginButton, false);
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials and try again.');
        
        // Clear sensitive fields
        document.getElementById('login-password').value = '';
        if (document.getElementById('admin-password')) {
            document.getElementById('admin-password').value = '';
        }
    }
}

// Initialize systems in background without blocking login
async function initializeBackgroundSystems(user) {
    try {
        // Show loading indicator for critical systems
        if (user.is_admin) {
            showLoadingIndicator('Setting up admin systems...');
            
            // Initialize investment system first (if critical for admin)
            await initInvestmentSystem();
            startInvestmentListener();
            
            hideLoadingIndicator();
        }
        
        // Initialize rewards system in background with progress tracking
        initializeRewardsWithProgress(user);
        
    } catch (error) {
        console.error('Background initialization failed:', error);
        showToast('Some features may load slowly', 'info');
    }
}

// Initialize rewards with progress indicator
async function initializeRewardsWithProgress(user) {
    try {
        // Show progress indicator in a non-intrusive area
        const progressBar = createProgressBar('Rewards system loading...');
        
        // Simulate progress updates
        progressBar.update(30);
        
        // Do the actual initialization
        await initializeRewardsSystem(user);
        
        progressBar.update(100);
        setTimeout(() => progressBar.remove(), 1000);
        
        console.log('Rewards system initialized successfully');
        
    } catch (error) {
        console.error('Rewards initialization error:', error);
        showToast('Rewards system loaded with limited functionality', 'warning');
    }
}

// Helper function for loading overlay
function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div class="spinner"></div>
        <p style="margin-top: 20px;">${message}</p>
        <p id="progress-text" style="font-size: 12px; opacity: 0.7;">Please wait...</p>
    `;
    
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

// Helper function for non-intrusive loading indicator
function showLoadingIndicator(message) {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    indicator.textContent = `⚡ ${message}`;
    document.body.appendChild(indicator);
    
    // Auto-hide after 3 seconds
    setTimeout(() => hideLoadingIndicator(), 3000);
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.remove();
}

// Helper function for progress bar
function createProgressBar(message) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 300px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        width: 100%;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        margin-top: 10px;
        overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: #4CAF50;
        transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progressFill);
    container.innerHTML = `<small>${message}</small>`;
    container.appendChild(progressBar);
    document.body.appendChild(container);
    
    return {
        update: (percent) => {
            progressFill.style.width = `${percent}%`;
        },
        remove: () => {
            container.remove();
        }
    };
}

// Toast notification helper
function showToast(message, type = 'info') {
    const colors = {
        info: '#007bff',
        warning: '#ff9800',
        error: '#f44336',
        success: '#4CAF50'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Update last active timestamp
async function updateLastActive(userId) {
    try {
        const userRef = db.db.collection('users').doc(userId.toString());
        await userRef.update({
            last_active: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating last active:', error);
    }
}

// Initialize systems in background without blocking login
async function initializeBackgroundSystems(user) {
    try {
        // Show loading indicator for critical systems
        if (user.is_admin) {
            showLoadingIndicator('Setting up admin systems...');
            
            // Initialize investment system first
            await initInvestmentSystem();
            startInvestmentListener();
            
            hideLoadingIndicator();
        }
        
        // Initialize referral system in background
        try {
            console.log('🎯 Initializing referral system in background...');
            await initReferralSystem();
            console.log('✅ Referral system initialized successfully');
        } catch (error) {
            console.error('Error initializing referral system:', error);
        }
        
        // Initialize rewards system in background with progress tracking
        initializeRewardsWithProgress(user);
        
    } catch (error) {
        console.error('Background initialization failed:', error);
        showToast('Some features may load slowly', 'info');
    }
}

// Check admin permissions and setup dashboard accordingly
function checkAdminPermissions(admin) {
    console.log('Checking admin permissions:', admin.permissions);
    
    // Hide/show sections based on permissions
    const sections = {
        'admin-approvals': ['transaction_approval', 'deposit_approval', 'withdrawal_approval', 'all'],
        'admin-history': ['transaction_approval', 'all'],
        'admin-chat': ['chat_support', 'all'],
        'rewards-management': ['all'],
        'admin-announcements': ['announcements', 'all'],
        'reports': ['reports', 'all'],
        'admin-settings': ['settings', 'all']
    };
    
    Object.keys(sections).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const requiredPerms = sections[sectionId];
            const hasPermission = requiredPerms.some(perm =>
                admin.permissions && admin.permissions.includes(perm)
            );
            
            // Find corresponding nav item
            const navItem = document.querySelector(`[data-target="${sectionId}"]`);
            if (navItem) {
                if (hasPermission) {
                    navItem.style.display = 'block';
                } else {
                    navItem.style.display = 'none';
                }
            }
        }
    });
    
    // Update welcome message with role
    const welcomeMessage = document.getElementById('admin-welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${admin.admin_role ? admin.admin_role.toUpperCase() : 'ADMIN'} ${admin.username}`;
    }
}


// Update user info - SAFELY with null checks
function updateUserInfo() {
    if (!db || !db.currentUser) return;
    
    console.log('Updating user info for:', db.currentUser.username);
    
    // Update usernames
    const elementsToUpdate = {
        'username-display': db.currentUser.username,
        'profile-username': db.currentUser.username,
        'dropdown-username': db.currentUser.username
    };
    
    // Format balance consistently
    const balance = db.currentUser.balance || 0;
    const formattedBalance = db.formatCurrency ? db.formatCurrency(balance) : `TZS ${balance.toLocaleString()}`;
    const plainBalance = `TZS ${Math.round(balance).toLocaleString()}`;
    
    // Add balance elements
    elementsToUpdate['dashboard-balance'] = formattedBalance;
    elementsToUpdate['withdraw-balance'] = plainBalance;
    elementsToUpdate['profile-balance'] = plainBalance;
    elementsToUpdate['profile-balance-display'] = plainBalance;
    
    // Update each element
    Object.entries(elementsToUpdate).forEach(([id, content]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
            console.log(`Updated ${id}: ${content}`);
        } else {
            console.warn(`Element #${id} not found for user info update`);
        }
    });
}
// Helper function to safely update elements
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
        console.log(`Updated ${id}: ${content}`);
    } else {
        console.warn(`Element #${id} not found`);
    }
}

// Then call this function instead of the inline code:
updateUserInfo();

function debugUserInfoElements() {
    const elementIds = [
        'username-display',
        'profile-username',
        'dropdown-username',
        'dashboard-balance',
        'withdraw-balance',
        'profile-balance',
        'profile-balance-display'
    ];
    
    console.log('=== DEBUGGING USER INFO ELEMENTS ===');
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`, element);
    });
    console.log('====================================');
}

// ========== ENHANCED SHOW USER DASHBOARD ==========

// ========== ENHANCED SHOW USER DASHBOARD WITH REFERRAL SYSTEM ==========
function showUserDashboard() {
    console.log('👤 Showing user dashboard...');
    
    // First hide all dashboards
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    // Check if user exists
    if (!db.currentUser) {
        console.error('No current user found!');
        return;
    }
    
    console.log('Current user:', db.currentUser.username);
    
    // Safely update user dashboard elements
    setTimeout(async () => {
        const usernameDisplay = document.getElementById('username-display');
        const dashboardBalance = document.getElementById('dashboard-balance');
        const userReferralCode = document.getElementById('user-referral-code');
        
        if (usernameDisplay) {
            usernameDisplay.textContent = db.currentUser.username;
        }
        
        if (dashboardBalance && db.formatCurrency) {
            dashboardBalance.textContent = db.formatCurrency(db.currentUser.balance || 0);
        }
        
        if (userReferralCode) {
            userReferralCode.textContent = db.currentUser.referral_code || '';
        }
        
        // ========== INITIALIZE REFERRAL SYSTEM ==========
        console.log('🎯 Initializing referral system...');
        try {
            await initReferralSystem();
            console.log('✅ Referral system initialized successfully');
        } catch (error) {
            console.error('Error initializing referral system:', error);
        }
        // ================================================
        
        // Initialize rewards system
        try {
            await initializeRewardsSystem(db.currentUser);
        } catch (error) {
            console.error('Error initializing rewards system:', error);
        }
        
        // Initialize other systems
        if (typeof initInvestmentSystem === 'function') {
            initInvestmentSystem();
        }
        
        if (typeof startInvestmentFirebaseListener === 'function') {
            startInvestmentFirebaseListener();
        }
        
        // Initialize stats
        if (typeof initUserDashboardStats === 'function') {
            initUserDashboardStats();
        }
        
        if (typeof updateReferralStats === 'function') {
            updateReferralStats();
        }
        
        if (typeof updateInvestmentBadge === 'function') {
            updateInvestmentBadge();
        }
        
        if (typeof updateReferralBadge === 'function') {
            updateReferralBadge();
        }
        
        if (typeof updateUserInfo === 'function') {
            updateUserInfo();
        }
        
        if (typeof updateUserActivationStatus === 'function') {
            updateUserActivationStatus();
        }
        
        if (typeof createMineralCards === 'function') {
            createMineralCards();
        }
        
        // Check if we're already on rewards section
        const currentSection = window.location.hash.replace('#', '') || 'dashboard';
        if (currentSection === 'rewards' && rewardsSystem) {
            console.log('Already on rewards section, refreshing UI...');
            await loadUserRewardsUI();
        }
        
        // If we're on referrals section, refresh the data
        if (currentSection === 'referrals') {
            console.log('Already on referrals section, refreshing UI...');
            await loadReferralData();
        }
        
    }, 300);
}

// Show Admin Dashboard - FIXED VERSION WITH FIREBASE
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Initializing admin dashboard...');
        
        // Load admin data from Firebase
        if (typeof loadPendingTransactions === 'function') {
            loadPendingTransactions();
        }
        if (typeof loadAdminStats === 'function') {
            loadAdminStats();
        }
        
        // Set up auto-refresh every 30 seconds for real-time updates
        if (typeof loadPendingTransactions === 'function') {
            setInterval(loadPendingTransactions, 30000);
        }
        
        // Load admin stats
        loadAdminStats();
        updatePendingCountBadge();
        
        
        // Start periodic updates
        setInterval(loadAdminStats, 60000);
        setInterval(updatePendingCountBadge, 30000);
        
        console.log('✅ Admin dashboard initialized');
    }, 100);
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase();
    
    // Initialize login tabs
    initLoginTabs();
    
    // Set up form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            signup();
        });
    }
    
    // Check if user is already logged in (from session)
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
});

// Helper functions
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.querySelector('span').textContent = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.querySelector('span').textContent = 'Show Password';
    }
}

// Navigation functions
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.dashboard-tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

// Landing page functions
function skipLanding() {
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

function showSignup() {
    // Hide landing page and show login container
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
    
    // Switch to signup tab
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginTab && signupTab && loginForm && signupForm) {
        // Remove active class from login tab
        loginTab.classList.remove('active');
        loginForm.classList.remove('active');
        
        // Add active class to signup tab
        signupTab.classList.add('active');
        signupForm.classList.add('active');
    }
}

function showLanding() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) {
        landing.style.display = 'flex';
        // Optional: Add animation
        landing.style.animation = 'fadeIn 0.5s ease';
    }
    if (login) login.style.display = 'none';
    
    // Reset to login tab for next time
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginTab && signupTab && loginForm && signupForm) {
        signupTab.classList.remove('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        loginForm.classList.add('active');
    }
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ========== ENHANCED LOGOUT ==========
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Cleanup rewards system
        cleanupRewardsSystem();
        
        // Clear user data
        db.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Hide all dashboards and containers
        const containers = [
            'user-dashboard',
            'admin-dashboard',
            'super-admin-dashboard',
            'login-container'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show landing container if it exists
        const landingContainer = document.querySelector('.landing-container');
        if (landingContainer) {
            landingContainer.style.display = 'block';
        } else {
            // If no landing container, show login container
            const loginContainer = document.getElementById('login-container');
            if (loginContainer) {
                loginContainer.style.display = 'flex';
            }
        }
        
        // Clear form fields
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        const adminPassword = document.getElementById('admin-password');
        const adminPasswordSection = document.getElementById('admin-password-section');
        const rewardCodeInput = document.getElementById('reward-code-input');
        
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
        if (adminPassword) adminPassword.value = '';
        if (adminPasswordSection) adminPasswordSection.style.display = 'none';
        if (rewardCodeInput) rewardCodeInput.value = '';
        
        console.log('✅ User logged out successfully');
    }
}

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
}

function switchAdminTab(tabId) {
    document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('#admin-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

function switchSuperAdminTab(tabId) {
    document.querySelectorAll('#super-admin-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('#super-admin-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

function copyAdminReferralCode() {
    const referralCode = document.getElementById('admin-referral-code').textContent;
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLoginTabs();
    console.log('✅ Application initialized successfully');
    
    // Check if user is already logged in (for page refresh)
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
});

// Tab switching functionality
function switchTab(tab) {
    // Update tabs
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
    
    // Update forms
    document.getElementById('login-form').classList.toggle('active', tab === 'login');
    document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
    
    // Reset form errors
    resetFormErrors();
}

// Password visibility toggle
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.querySelector('span').textContent = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.querySelector('span').textContent = 'Show Password';
    }
}

// Chat System Class with Firebase Firestore
class ChatSystem {
    constructor() {
        this.db = firebase.firestore();
        this.chatsCollection = this.db.collection('chats');
        this.usersCollection = this.db.collection('users');
        this.currentUserChat = null;
        this.adminViewingUser = null;
        this.isInitialized = false;
        this.unsubscribeListeners = [];
        this.currentUserId = null;
    }

    async init() {
        if (this.isInitialized) return;
        
        await this.setupAuth();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    async setupAuth() {
        // Get current user from your existing db
        if (window.db && window.db.currentUser) {
            this.currentUserId = window.db.currentUser.id;
            this.currentUser = window.db.currentUser;
            
            if (this.currentUser.is_admin) {
                this.startAdminListeners();
                this.loadAdminChatList();
            } else {
                await this.initUserChat(this.currentUserId);
                this.startUserChatListeners(this.currentUserId);
            }
        }
    }

    // Initialize chat data for a user in Firestore
    async initUserChat(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (!chatDoc.exists) {
                // Get user data for username
                const user = await this.getUserById(userId);
                const username = user ? user.username : 'User ' + userId;
                
                const initialChat = {
                    userId: userId,
                    username: username,
                    messages: [{
                        id: 1,
                        sender: 'admin',
                        content: 'Hello! Welcome to Tanzania Mining Investment support. How can we help you today?',
                        timestamp: new Date().toISOString(),
                        read: false
                    }],
                    unreadCount: 0,
                    lastActivity: new Date().toISOString(),
                    status: 'online',
                    createdAt: new Date().toISOString()
                };
                
                await chatRef.set(initialChat);
                return initialChat;
            }
            
            return chatDoc.data();
        } catch (error) {
            console.error('Error initializing user chat:', error);
            throw error;
        }
    }

    // Get user by ID from Firestore
    async getUserById(userId) {
        try {
            const userDoc = await this.usersCollection.doc(userId.toString()).get();
            if (userDoc.exists) {
                return {
                    id: parseInt(userDoc.id),
                    ...userDoc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Get username from user ID
    async getUsername(userId) {
        const user = await this.getUserById(userId);
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
    async sendUserMessage() {
        const messageInput = document.getElementById('user-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message) return;

        const currentUser = window.db.currentUser;
        if (!currentUser) {
            alert('Please log in to send messages');
            return;
        }

        try {
            const chatRef = this.chatsCollection.doc(currentUser.id.toString());
            const chatDoc = await chatRef.get();
            
            if (!chatDoc.exists) {
                await this.initUserChat(currentUser.id);
            }
            
            const chatData = chatDoc.data();
            const messages = chatData.messages || [];
            const newMessage = {
                id: messages.length + 1,
                sender: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                read: false
            };

            // Update chat with new message
            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
                lastActivity: new Date().toISOString(),
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });

            // Clear input
            messageInput.value = '';

            // Simulate admin response after a delay
            setTimeout(() => {
                this.generateAdminResponse(currentUser.id, message);
            }, 2000);
            
        } catch (error) {
            console.error('Error sending user message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Send message from admin
    async sendAdminMessage() {
        const messageInput = document.getElementById('admin-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message || !this.adminViewingUser) return;

        try {
            const chatRef = this.chatsCollection.doc(this.adminViewingUser.toString());
            
            const adminMessage = {
                id: Date.now(),
                sender: 'admin',
                content: message,
                timestamp: new Date().toISOString(),
                read: true
            };

            // Update chat with new message
            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(adminMessage),
                lastActivity: new Date().toISOString(),
                unreadCount: 0  // Reset unread count when admin sends message
            });

            // Clear input
            messageInput.value = '';
            
        } catch (error) {
            console.error('Error sending admin message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Generate automated admin response
    async generateAdminResponse(userId, userMessage) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            
            let response = '';
            const lowerMessage = userMessage.toLowerCase();

            // Simple response logic based on keywords
            if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
                response = 'Our investment plans offer competitive daily returns. working days (3% ROI), weekend (4% ROI). Minimum investment is TZS 12,500.';
            } else if (lowerMessage.includes('withdraw') || lowerMessage.includes('withdrawal')) {
                response = 'Withdrawals are processed everper week. Minimum withdrawal is TZS 10,000 with a 10% service fee. You can withdraw Monday-Friday anytime, and Saturday-Sunday from 2 PM to 11 PM.';
            } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
                response = 'To reset your password, please request "Forgot Password" in admin feature on the login page. An email will be sent to your registered email address with instructions.';
            } else if (lowerMessage.includes('referral') || lowerMessage.includes('bonus')) {
                response = 'Our referral program gives you 10% commission on your referrals\' first deposits. Share your unique referral code with friends to start earning!';
            } else if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
                response = 'You can check your current balance in the dashboard. Deposits are added to your balance after admin approval, which usually takes 1-2 hours during business days.';
            } else {
                response = 'Thank you for your message. Our support team will review your inquiry and respond shortly. For immediate assistance, you can also contact us at +255768616961.';
            }

            const adminMessage = {
                id: Date.now(),
                sender: 'admin',
                content: response,
                timestamp: new Date().toISOString(),
                read: false
            };

            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(adminMessage),
                lastActivity: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error generating admin response:', error);
        }
    }

    // Start real-time listener for user chat
    startUserChatListeners(userId) {
        this.cleanupListeners();

        const chatRef = this.chatsCollection.doc(userId.toString());
        
        const unsubscribe = chatRef.onSnapshot((doc) => {
            if (doc.exists) {
                this.displayUserMessages(doc.data());
            }
        }, (error) => {
            console.error('Error listening to user chat:', error);
        });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Start real-time listener for admin chat list
    startAdminListeners() {
        this.cleanupListeners();

        const unsubscribe = this.chatsCollection
            .orderBy('lastActivity', 'desc')
            .onSnapshot((snapshot) => {
                this.loadAdminChatListFromSnapshot(snapshot);
            }, (error) => {
                console.error('Error listening to admin chats:', error);
            });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Display messages in user chat
    displayUserMessages(chatData) {
        const chatMessages = document.getElementById('user-chat-messages');
        if (!chatMessages) return;

        const messages = chatData.messages || [];

        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
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
    displayAdminMessages(chatData) {
        const chatMessages = document.getElementById('admin-chat-messages');
        if (!chatMessages) return;

        const messages = chatData.messages || [];

        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
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

    // Load admin chat list from Firestore snapshot
    loadAdminChatListFromSnapshot(snapshot) {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        let totalUnread = 0;
        let totalConversations = 0;
        const today = new Date().toDateString();

        snapshot.forEach(doc => {
            const chatData = doc.data();
            totalConversations++;
            
            const userItem = this.createChatUserItem(chatData, totalUnread);
            chatUsersList.appendChild(userItem);
        });

        this.updateAdminStats(totalConversations, totalUnread);
    }

    // Load admin chat list (initial load)
    async loadAdminChatList() {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        try {
            const snapshot = await this.chatsCollection
                .orderBy('lastActivity', 'desc')
                .get();
            
            let totalUnread = 0;
            let totalConversations = 0;

            snapshot.forEach(doc => {
                const chatData = doc.data();
                totalConversations++;
                
                const userItem = this.createChatUserItem(chatData, totalUnread);
                chatUsersList.appendChild(userItem);
            });

            this.updateAdminStats(totalConversations, totalUnread);
            
        } catch (error) {
            console.error('Error loading admin chat list:', error);
        }
    }

    // Create chat user item element
    createChatUserItem(chatData, totalUnread) {
        const userItem = document.createElement('div');
        userItem.className = `chat-user-item ${this.adminViewingUser === chatData.userId ? 'active' : ''}`;
        userItem.onclick = () => this.selectUserChat(chatData.userId);

        const userInfo = document.createElement('div');
        userInfo.className = 'user-chat-info';

        const userName = document.createElement('div');
        userName.className = 'user-name';
        userName.textContent = chatData.username || 'Unknown User';

        const lastMessage = document.createElement('div');
        lastMessage.className = 'last-message';
        const messages = chatData.messages || [];
        const lastMsg = messages[messages.length - 1];
        lastMessage.textContent = lastMsg ? 
            lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : 
            'No messages';

        userInfo.appendChild(userName);
        userInfo.appendChild(lastMessage);

        const chatMeta = document.createElement('div');
        chatMeta.className = 'chat-meta';

        const lastSeen = document.createElement('div');
        lastSeen.className = 'last-seen';
        lastSeen.textContent = this.formatTime(chatData.lastActivity);

        chatMeta.appendChild(lastSeen);

        if (chatData.unreadCount > 0) {
            const unreadCount = document.createElement('div');
            unreadCount.className = 'unread-count';
            unreadCount.textContent = chatData.unreadCount;
            chatMeta.appendChild(unreadCount);
            totalUnread += chatData.unreadCount;
        }

        userItem.appendChild(userInfo);
        userItem.appendChild(chatMeta);
        
        return userItem;
    }

    // Update admin stats display
    updateAdminStats(totalConversations, totalUnread) {
        const totalConversationsEl = document.getElementById('total-conversations');
        const unreadConversationsEl = document.getElementById('unread-conversations');
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
        
        // This would need to be updated to query Firestore
        // For now, return a placeholder
        return count;
    }

    // Select user chat in admin panel
    async selectUserChat(userId) {
        this.adminViewingUser = userId;
        
        // Update UI to show selected user
        document.querySelectorAll('.chat-user-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        // Start real-time listener for this chat
        this.startAdminChatListener(userId);

        // Show chat header
        const chatHeader = document.getElementById('admin-chat-header');
        
        if (chatHeader) {
            const chatData = await this.getChatData(userId);
            const username = chatData ? chatData.username : 'Unknown User';
            const status = chatData ? chatData.status : 'offline';
            
            chatHeader.innerHTML = `
                <div class="chat-title">
                    <i class="fas fa-user"></i>
                    <span>${username}</span>
                    <div class="chat-status">
                        <span class="status-indicator ${status}"></span>
                        <span>${status}</span>
                    </div>
                </div>
            `;
        }

        // Show messages and input
        const noChatSelected = document.getElementById('no-chat-selected');
        const adminChatMessages = document.getElementById('admin-chat-messages');
        const adminChatInput = document.getElementById('admin-chat-input');
        
        if (noChatSelected) noChatSelected.style.display = 'none';
        if (adminChatMessages) adminChatMessages.style.display = 'block';
        if (adminChatInput) adminChatInput.style.display = 'block';

        // Mark messages as read
        await this.markMessagesAsRead(userId);
    }

    // Get chat data from Firestore
    async getChatData(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (chatDoc.exists) {
                return chatDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting chat data:', error);
            return null;
        }
    }

    // Start real-time listener for specific admin chat
    startAdminChatListener(userId) {
        this.cleanupListeners();

        const chatRef = this.chatsCollection.doc(userId.toString());
        
        const unsubscribe = chatRef.onSnapshot((doc) => {
            if (doc.exists) {
                this.displayAdminMessages(doc.data());
            }
        }, (error) => {
            console.error('Error listening to admin chat:', error);
        });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Mark messages as read
    async markMessagesAsRead(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (chatDoc.exists) {
                const chatData = chatDoc.data();
                const messages = chatData.messages || [];
                
                // Mark all user messages as read
                const updatedMessages = messages.map(msg => ({
                    ...msg,
                    read: msg.sender === 'user' ? true : msg.read
                }));
                
                await chatRef.update({
                    messages: updatedMessages,
                    unreadCount: 0
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
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
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Just now';
        }
    }

    // Clean up listeners
    cleanupListeners() {
        this.unsubscribeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribeListeners = [];
    }

    // Open user chat modal
    async openUserChatModal() {
        if (!window.db || !window.db.currentUser) {
            alert('Please log in to use chat');
            return;
        }
        
        try {
            // Initialize chat system if not already done
            await this.init();
            
            // Initialize user chat if it doesn't exist
            await this.initUserChat(window.db.currentUser.id);
            
            // Display messages
            const chatData = await this.getChatData(window.db.currentUser.id);
            if (chatData) {
                this.displayUserMessages(chatData);
            }
            
            // Show modal
            openModal('user-chat-modal');
            
        } catch (error) {
            console.error('Error opening user chat modal:', error);
            alert('Error opening chat. Please try again.');
        }
    }

    // Open admin chat modal
    async openAdminChatModal() {
        if (!window.db || !window.db.currentUser || !window.db.currentUser.is_admin) {
            alert('Admin access required');
            return;
        }
        
        try {
            // Initialize chat system if not already done
            await this.init();
            
            // Load chat list
            await this.loadAdminChatList();
            
            // Show modal
            openModal('admin-chat-modal');
        } catch (error) {
            console.error('Error opening admin chat modal:', error);
            alert('Error opening admin chat. Please try again.');
        }
    }
}

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized. Chat system will not work.');
        return;
    }
    
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
            window.open('https://wa.me/255768616961', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255768616961';
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
    console.log('Filtering referrals by:', filterValue);
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

// Deposit Section Functionality - COMPLETE FIXED VERSION
function initDepositSection() {
    console.log('💰 Initializing deposit section...');
    
    const depositType = document.getElementById('deposit-type');
    const depositBtn = document.getElementById('deposit-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const quickAmounts = document.querySelectorAll('.quick-amount[amount-data]');
    
    if (!depositType) {
        console.error('Deposit type dropdown not found!');
        // Create the dropdown if it doesn't exist
        createDepositTypeDropdown();
        return;
    }
    
    // First, populate the deposit type dropdown
    populateDepositTypeDropdown();
    
    // Bank instructions for each type
    const bankInstructions = {
        'airtel': `
            <div class="instructions-content">
                <h4><i class="fas fa-mobile-alt"></i> Airtel Money</h4>
                <ol>
                <li>Nenda kwenye Airtel Money kwenye simu yako</li>
                <li>Chagua "Lipa Bidhaa"</li>
                <li>Chagua Lipa kwa Halopesa</li>
                <li>Weka lipa namba: <strong>23898109</strong></li>
                <li>Chagua "Weka kiasi"</li>
                <li>Weka kiasi unachotaka kuweka</li>
                <li>Weka nenosiri la Airtel Money</li>
                <li>Subiri kupokea ujumbe wa uthibitisho</li>
                <li><strong>JAZA MSIMBO WA UTHIBITISHO KWA USAHIHI</strong></li>
                </ol>
                <div class="note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Kumbuka:</strong> Tumia jina la rain uliyo tumia kufanya muamala kama kumbukumbu
                </div>
            </div>
        `,
        'mpesa': `
            <div class="instructions-content">
                <h4><i class="fas fa-mobile-alt"></i> M-Pesa</h4>
                <ol>
                <li>Piga *150*00*</li>
                <li>Chagua "Lipa kwa Simu"</li>
                <li>Chagua Lipa kwa Halopesa</li>
                <li>Weka lipa namba: <strong>23898109</strong></li>
                <li>Chagua "Weka kiasi"</li>
                <li>Weka kiasi unachotaka kuweka</li>
                <li>Weka nenosiri la M-Pesa</li>
                <li>Subiri kupokea ujumbe wa uthibitisho</li>
                <li><strong>JAZA MSIMBO WA UTHIBITISHO KWA USAHIHI</strong></li>
                </ol>
                <div class="note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Kumbuka:</strong> Tumia jina la rain uliyo tumia kufanya muamala kama kumbukumbu
                </div>
            </div>
        `,
        'tigopesa': `
            <div class="instructions-content">
                <h4><i class="fas fa-mobile-alt"></i> Tigo Pesa</h4>
                <ol>
                <li>Piga *150*01#</li>
                <li>Chagua "Lipa Bidhaa"</li>
                <li>Chagua Lipa kwa Halopesa</li>
                <li>Weka lipa namba: <strong>23898109</strong></li>
                <li>Chagua "Weka kiasi"</li>
                <li>Weka kiasi unachotaka kuweka</li>
                <li>Weka nenosiri la TigoPesa</li>
                <li>Subiri kupokea ujumbe wa uthibitisho</li>
                <li><strong>JAZA MSIMBO WA UTHIBITISHO KWA USAHIHI</strong></li>
                </ol>
                <div class="note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Kumbuka:</strong> Tumia jina la rain uliyo tumia kufanya muamala kama kumbukumbu
                </div>
            </div>
        `,
        'halopesa': `
            <div class="instructions-content">
                <h4><i class="fas fa-mobile-alt"></i> Halotel Pesa</h4>
                <ol>
                <li>Nenda kwenye menu ya Halopesa <strong>*150*88#</strong></li>
                <li>Chagua <strong>05</strong> "Lipa bidhaa"</li>
                <li>Chagua <strong>02</strong> kwenda halopesa</li>
                <li>Weka lipa namba: <strong>23898109</strong></li>
                <li>Weka kiasi unachotaka kuweka</li>
                <li>Weka nenosiri la Halopesa</li>
                <li>Subiri kupokea ujumbe wa uthibitisho</li>
                <li><strong>JAZA MSIMBO WA UTHIBITISHO KWA USAHIHI</strong></li>
                </ol>
                <div class="note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Kumbuka:</strong> Tumia jina la rain uliyo tumia kufanya muamala kama kumbukumbu
                </div>
            </div>
        `,
        'bank': `
            <div class="instructions-content">
                <h4><i class="fas fa-university"></i> Benki</h4>
                <ol>
                    <li>Nenda kwenye benki yako au ATM</li>
                    <li>Weka Namba Ya Siri/li>
                    <li>Nenda "Tuma Pesa"</li>
                    <li>Nenda "Mitandao Ya Simu"</li>
                    <li>Namba ya simu : <strong>0768616961</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Chukua namba ya muamala (Transaction ID)</li>
                </ol>
                <div class="note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Kumbuka:</strong> Tumia jina la rain uliyo tumia kufanya muamala kama kumbukumbu
                </div>
            </div>
        `
    };
    
    // Populate the deposit type dropdown
    function populateDepositTypeDropdown() {
        const options = [
            { value: '', text: 'Chagua aina ya kuweka fedha', disabled: true, selected: true },
            { value: 'mpesa', text: 'M-Pesa', icon: 'fas fa-mobile-alt' },
            { value: 'airtel', text: 'Airtel Money', icon: 'fas fa-mobile-alt' },
            { value: 'tigopesa', text: 'Tigo Pesa', icon: 'fas fa-mobile-alt' },
            { value: 'halopesa', text: 'Halotel Pesa', icon: 'fas fa-mobile-alt' },
            { value: 'bank', text: 'Benki', icon: 'fas fa-university' }
        ];
        
        depositType.innerHTML = '';
        
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            if (option.disabled) opt.disabled = true;
            if (option.selected) opt.selected = true;
            depositType.appendChild(opt);
        });
        
        console.log('✅ Deposit type dropdown populated');
    }
    
    // Create account info sections if they don't exist
    function createAccountInfoSections() {
        const depositForm = document.querySelector('.deposit-form');
        if (!depositForm) return;
        
        // Remove existing account info sections
        document.querySelectorAll('.account-info').forEach(el => el.remove());
        
        // Create account info sections
        const accountInfoHTML = `
            <!-- M-Pesa Account Info -->
            <div id="mpesa-info" class="account-info" style="display: none;">
                <div class="account-details">
                    <h4><i class="fas fa-mobile-alt"></i> M-Pesa Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Namba ya Simu:</span>
                        <span class="detail-value">0768 616 961</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Mpokeaji:</span>
                        <span class="detail-value">TANZANIA MINING</span>
                    </div>
                </div>
            </div>
            
            <!-- Airtel Money Account Info -->
            <div id="airtel-info" class="account-info" style="display: none;">
                <div class="account-details">
                    <h4><i class="fas fa-mobile-alt"></i> Airtel Money Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Namba ya Simu:</span>
                        <span class="detail-value">0768 616 961</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Mpokeaji:</span>
                        <span class="detail-value">TANZANIA MINING</span>
                    </div>
                </div>
            </div>
            
            <!-- Tigo Pesa Account Info -->
            <div id="tigopesa-info" class="account-info" style="display: none;">
                <div class="account-details">
                    <h4><i class="fas fa-mobile-alt"></i> Tigo Pesa Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Namba ya Simu:</span>
                        <span class="detail-value">0768 616 961</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Mpokeaji:</span>
                        <span class="detail-value">TANZANIA MINING</span>
                    </div>
                </div>
            </div>
            
            <!-- Halotel Pesa Account Info -->
            <div id="halopesa-info" class="account-info" style="display: none;">
                <div class="account-details">
                    <h4><i class="fas fa-mobile-alt"></i> Halotel Pesa Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Namba ya Simu:</span>
                        <span class="detail-value">0768 616 961</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Mpokeaji:</span>
                        <span class="detail-value">TANZANIA MINING</span>
                    </div>
                </div>
            </div>
            
            <!-- Bank Account Info -->
            <div id="bank-info" class="account-info" style="display: none;">
                <div class="account-details">
                    <h4><i class="fas fa-university"></i> Bank Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">Namba ya Akaunti:</span>
                        <span class="detail-value">0123456789</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Benki:</span>
                        <span class="detail-value">CRDB Bank</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Jina la Mpokeaji:</span>
                        <span class="detail-value">Tanzania Mining Investment</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Akaunti ya:</span>
                        <span class="detail-value">Current Account</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after deposit type field
        const depositTypeField = depositType.closest('.form-group');
        if (depositTypeField) {
            depositTypeField.insertAdjacentHTML('afterend', accountInfoHTML);
        }
    }
    
    // Create instructions section if it doesn't exist
    function createInstructionsSection() {
        const instructionsContainer = document.getElementById('instructions-container');
        if (!instructionsContainer) {
            const depositForm = document.querySelector('.deposit-form');
            if (depositForm) {
                depositForm.insertAdjacentHTML('beforeend', `
                    <div id="instructions-container" class="instructions-container">
                        <h4 id="instructions-title">Jinsi Ya Kutuma Pesa</h4>
                        <div id="instructions-content" class="instructions-content">
                            <p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>
                        </div>
                    </div>
                `);
            }
        }
    }
    
    // Show account info and instructions based on deposit type
    depositType.addEventListener('change', function() {
        console.log('Deposit type changed to:', this.value);
        
        // Hide all account info
        document.querySelectorAll('.account-info').forEach(info => {
            info.style.display = 'none';
        });
        
        // Show selected account info
        const selectedType = this.value;
        if (selectedType) {
            const selectedInfo = document.getElementById(`${selectedType}-info`);
            if (selectedInfo) {
                selectedInfo.style.display = 'block';
                
                // Scroll to account info
                setTimeout(() => {
                    selectedInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
            
            // Update instructions
            const instructionsTitle = document.getElementById('instructions-title');
            const instructionsContent = document.getElementById('instructions-content');
            
            if (instructionsTitle && instructionsContent) {
                instructionsTitle.textContent = 'Jinsi Ya Kutuma Pesa';
                instructionsContent.innerHTML = bankInstructions[selectedType] || 
                    '<p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>';
                
                // Scroll to instructions
                setTimeout(() => {
                    instructionsContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 500);
            }
        }
    });
    
  // Quick amount buttons functionality
document.addEventListener('DOMContentLoaded', function() {
    const quickAmounts = document.querySelectorAll('.quick-amount');
    const amountInput = document.getElementById('deposit-amount');
    
    if (quickAmounts.length > 0 && amountInput) {
        quickAmounts.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('info-amount');
                
                // Set the input value
                amountInput.value = amount;
                
                // Trigger input event for any listeners
                amountInput.dispatchEvent(new Event('input'));
                
                // Highlight the selected button
                quickAmounts.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                console.log('Quick amount selected:', formatTZS(amount));
            });
        });
        
        // Clear active button when user types manually
        amountInput.addEventListener('input', function() {
            const currentValue = this.value;
            let found = false;
            
            quickAmounts.forEach(button => {
                const buttonAmount = button.getAttribute('info-amount');
                if (buttonAmount === currentValue) {
                    button.classList.add('active');
                    found = true;
                } else {
                    button.classList.remove('active');
                }
            });
            
            // If no matching button found, ensure all are inactive
            if (!found) {
                quickAmounts.forEach(button => button.classList.remove('active'));
            }
        });
    }
});

// Optional: Helper function to format TZS amounts
function formatTZS(amount) {
    return 'TZS ' + Number(amount).toLocaleString('en-TZ');
}
    
    // Deposit button click - FIXED
    if (depositBtn) {
        // Remove existing event listeners
        const newBtn = depositBtn.cloneNode(true);
        depositBtn.parentNode.replaceChild(newBtn, depositBtn);
        
        newBtn.addEventListener('click', async function() {
            console.log('Deposit button clicked');
            
            const amountInput = document.getElementById('deposit-amount');
            const depositTypeSelect = document.getElementById('deposit-type');
            const senderNameInput = document.getElementById('sender-name');
            const senderAccountInput = document.getElementById('sender-account');
            
            if (!amountInput || !depositTypeSelect || !senderNameInput || !senderAccountInput) {
                alert('Hitilafu ya mfumo. Tafadhali jaribu tena.');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            const depositMethod = depositTypeSelect.value;
            const senderName = senderNameInput.value.trim();
            const senderAccount = senderAccountInput.value.trim();
            
            // Validation
            if (!amount || isNaN(amount) || amount < 1000 || amount > 10000000) {
                alert('Tafadhali weka kiasi sahihi cha kuweka fedha (TZS 1,000 hadi TZS 10,000,000)');
                return;
            }
            
            if (!depositMethod) {
                alert('Tafadhali chagua aina ya kuweka fedha');
                depositTypeSelect.focus();
                return;
            }
            
            if (!senderName) {
                alert('Tafadhali weka jina kamili la mtumaji');
                senderNameInput.focus();
                return;
            }
            
            if (!senderAccount) {
                alert('Tafadhali weka namba ya akaunti au simu ya mtumaji');
                senderAccountInput.focus();
                return;
            }
            
            // Show loading on button
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inaunda ombi...';
            this.disabled = true;
            
            try {
                // Create deposit transaction
                console.log('Creating deposit transaction:', {
                    userId: db.currentUser.id,
                    amount: amount,
                    method: depositMethod
                });
                
                const transaction = await db.createTransaction(
                    db.currentUser.id,
                    'deposit',
                    amount,
                    depositMethod,
                    { 
                        senderName: senderName,
                        senderAccount: senderAccount,
                        description: `Deposit via ${depositMethod}`,
                        auto_approve: false
                    }
                );
                
                if (transaction) {
                    console.log('✅ Deposit transaction created successfully:', transaction.id);
                    
                    // Show transaction code section
                    const transactionSection = document.getElementById('transaction-section');
                    const depositAmountDisplay = document.getElementById('deposit-amount-display');
                    
                    if (transactionSection) {
                        transactionSection.style.display = 'block';
                    } else {
                        // Create transaction section if it doesn't exist
                        createTransactionSection();
                    }
                    
                    if (depositAmountDisplay) {
                        depositAmountDisplay.textContent = db.formatCurrency ? 
                            db.formatCurrency(amount) : `TZS ${amount.toLocaleString()}`;
                    }
                    
                    // Store transaction ID temporarily
                    window.currentDepositTransactionId = transaction.id;
                    
                    // Show success message
                    showNotification('✅ Ombi lako la kuweka fedha limewasilishwa!', 'success');
                    
                    // Scroll to transaction section
                    setTimeout(() => {
                        const section = document.getElementById('transaction-section');
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                    
                    // Reset form (keep amount for reference)
                    depositTypeSelect.value = '';
                    senderNameInput.value = '';
                    senderAccountInput.value = '';
                    
                    // Hide account info
                    document.querySelectorAll('.account-info').forEach(info => {
                        info.style.display = 'none';
                    });
                    
                    // Reset quick amount buttons
                    quickAmounts.forEach(btn => btn.classList.remove('active'));
                    
                } else {
                    throw new Error('Failed to create transaction');
                }
            } catch (error) {
                console.error('Error creating deposit transaction:', error);
                alert('❌ Hitilafu imetokea: ' + error.message);
            } finally {
                // Restore button state
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }
    
    // Verify button click - FIXED
    if (verifyBtn) {
        // Remove existing event listeners
        const newVerifyBtn = verifyBtn.cloneNode(true);
        verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
        
        newVerifyBtn.addEventListener('click', async function() {
            console.log('Verify button clicked');
            
            const transactionCodeInput = document.getElementById('transaction-code');
            if (!transactionCodeInput) {
                alert('Hitilafu ya mfumo. Tafadhali jaribu tena.');
                return;
            }
            
            const transactionCode = transactionCodeInput.value.trim();
            
            if (!transactionCode) {
                alert('Tafadhali weka msimbo wa muamala');
                transactionCodeInput.focus();
                return;
            }
            
            if (!window.currentDepositTransactionId) {
                alert('❌ Hitilafu imetokea. Tafadhali anza mchakato wa kuweka fedha tena.');
                return;
            }
            
            // Show loading on button
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inathibitisha...';
            this.disabled = true;
            
            try {
                console.log('Verifying transaction code for transaction:', window.currentDepositTransactionId);
                
                // Update transaction with verification code
                const success = await updateTransactionWithVerificationCode(window.currentDepositTransactionId, transactionCode);
                
                if (success) {
                    // Show status section
                    const statusSection = document.getElementById('status-section');
                    const transactionSection = document.getElementById('transaction-section');
                    
                    if (statusSection) {
                        statusSection.style.display = 'block';
                    } else {
                        // Create status section if it doesn't exist
                        createStatusSection();
                    }
                    
                    if (transactionSection) {
                        transactionSection.style.display = 'none';
                    }
                    
                    // Reset verification code
                    transactionCodeInput.value = '';
                    
                    // Clear temporary data
                    window.currentDepositTransactionId = null;
                    
                    // Show success message
                    showNotification('✅ Uthibitishaji umekamilika! Ombi lako linachunguzwa.', 'success');
                    
                    // Auto-close modal after 5 seconds
                    setTimeout(() => {
                        const depositModal = document.getElementById('deposit-modal');
                        if (depositModal && depositModal.style.display === 'block') {
                            closeModal('deposit-modal');
                        }
                    }, 5000);
                } else {
                    throw new Error('Failed to verify transaction');
                }
            } catch (error) {
                console.error('Error verifying transaction:', error);
                alert('❌ Hitilafu imetokea: ' + error.message);
            } finally {
                // Restore button state
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }
    
    // Create transaction section if it doesn't exist
    function createTransactionSection() {
        const depositForm = document.querySelector('.deposit-form');
        if (!depositForm) return;
        
        depositForm.insertAdjacentHTML('beforeend', `
            <div id="transaction-section" class="transaction-section" style="display: none;">
                <div class="section-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>Thibitisha Muamala</h4>
                </div>
                <p>Ombi lako limewasilishwa kikamilifu! Tafadhali weka namba ya muamala uliyopata.</p>
                
                <div class="transaction-info">
                    <div class="info-item">
                        <span>Kiasi:</span>
                        <strong id="deposit-amount-display">TZS 0</strong>
                    </div>
                    <div class="info-item">
                        <span>Namba ya Muamala:</span>
                        <strong>${window.currentDepositTransactionId || 'Inawekwa...'}</strong>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="transaction-code">
                        <i class="fas fa-key"></i> Namba ya Muamala (Transaction ID)
                    </label>
                    <input type="text" id="transaction-code" 
                           placeholder="Ingiza namba ya muamala uliyopata" required>
                    <small class="form-hint">
                        <i class="fas fa-info-circle"></i>
                        Namba hii utaipata baada ya kukamilisha malipo
                    </small>
                </div>
                
                <div class="form-actions">
                    <button id="verify-btn" class="btn-primary">
                        <i class="fas fa-check"></i> Thibitisha Muamala
                    </button>
                </div>
            </div>
        `);
        
        // Re-attach verify button listener
        const newVerifyBtn = document.getElementById('verify-btn');
        if (newVerifyBtn) {
            newVerifyBtn.addEventListener('click', function() {
                // Trigger verification
                document.getElementById('verify-btn').click();
            });
        }
    }
    
    // Create status section if it doesn't exist
    function createStatusSection() {
        const depositForm = document.querySelector('.deposit-form');
        if (!depositForm) return;
        
        depositForm.insertAdjacentHTML('beforeend', `
            <div id="status-section" class="status-section" style="display: none;">
                <div class="status-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Ombi Limewasilishwa!</h4>
                <p>Ombi lako la kuweka fedha limewasilishwa kikamilifu na linachunguzwa na admin.</p>
                
                <div class="status-info">
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>Muda wa Kukagua</strong>
                            <span>1-2 saa za kazi</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-bell"></i>
                        <div>
                            <strong>Taarifa</strong>
                            <span>Utapokea taarifa ukiwa approved</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-headset"></i>
                        <div>
                            <strong>Usaidizi</strong>
                            <span>Piga simu 0768 616 961</span>
                        </div>
                    </div>
                </div>
                
                <button class="btn-secondary" onclick="closeModal('deposit-modal')">
                    <i class="fas fa-times"></i> Funga
                </button>
            </div>
        `);
    }
    
    // Initialize sections
    createAccountInfoSections();
    createInstructionsSection();
    
    console.log('✅ Deposit section initialized successfully');
}

// Helper function to update transaction with verification code
async function updateTransactionWithVerificationCode(transactionId, verificationCode) {
    try {
        console.log('Updating transaction with verification code:', { transactionId, verificationCode });
        
        const usersSnapshot = await db.db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            const transactionIndex = transactions.findIndex(t => t.id == transactionId);
            
            if (transactionIndex !== -1) {
                // Update transaction with verification code
                transactions[transactionIndex] = {
                    ...transactions[transactionIndex],
                    details: {
                        ...transactions[transactionIndex].details,
                        verificationCode: verificationCode,
                        verifiedAt: new Date().toISOString()
                    }
                };
                
                // Update user document
                const userRef = db.db.collection('users').doc(userDoc.id);
                await userRef.update({
                    transactions: transactions,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Transaction updated with verification code');
                return true;
            }
        }
        
        console.log('❌ Transaction not found');
        return false;
        
    } catch (error) {
        console.error('Error updating transaction with verification code:', error);
        return false;
    }
}

// Function to create deposit modal HTML if it doesn't exist
function createDepositModal() {
    if (document.getElementById('deposit-modal')) return;
    
    const modalHTML = `
        <div id="deposit-modal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Weka Fedha</h3>
                    <button class="close-modal" onclick="closeModal('deposit-modal')">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form class="deposit-form">
                        <!-- Amount -->
                        <div class="form-group">
                            <label for="amount">
                                <i class="fas fa-money-bill-alt"></i> Kiasi (TZS)
                            </label>
                            <input type="number" id="amount" 
                                   min="1000" max="10000000" 
                                   placeholder="0.00" required>
                            <small class="form-hint">Kiwango cha chini: TZS 1,000</small>
                            
                            <!-- Quick Amounts -->
                            <div class="quick-amounts">
                                <button type="button" class="quick-amount" data-amount="10000">
                                    TZS 10,000
                                </button>
                                <button type="button" class="quick-amount" data-amount="50000">
                                    TZS 50,000
                                </button>
                                <button type="button" class="quick-amount" data-amount="100000">
                                    TZS 100,000
                                </button>
                                <button type="button" class="quick-amount" data-amount="500000">
                                    TZS 500,000
                                </button>
                            </div>
                        </div>
                        
                        <!-- Deposit Type -->
                        <div class="form-group">
                            <label for="deposit-type">
                                <i class="fas fa-wallet"></i> Aina ya Kuweka Fedha
                            </label>
                            <select id="deposit-type" required>
                                <option value="" disabled selected>Chagua aina ya kuweka fedha</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="airtel">Airtel Money</option>
                                <option value="tigopesa">Tigo Pesa</option>
                                <option value="halopesa">Halotel Pesa</option>
                                <option value="bank">Benki</option>
                            </select>
                        </div>
                        
                        <!-- Sender Name -->
                        <div class="form-group">
                            <label for="sender-name">
                                <i class="fas fa-user"></i> Jina Kamili la Mtumaji
                            </label>
                            <input type="text" id="sender-name" 
                                   placeholder="Ingiza jina lako kamili" required>
                        </div>
                        
                        <!-- Sender Account -->
                        <div class="form-group">
                            <label for="sender-account">
                                <i class="fas fa-id-card"></i> Namba ya Akaunti/Simu ya Mtumaji
                            </label>
                            <input type="text" id="sender-account" 
                                   placeholder="Ingiza namba ya simu au akaunti" required>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="form-actions">
                            <button type="button" id="deposit-btn" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> Wasilisha Ombi
                            </button>
                            <button type="button" class="btn-secondary" onclick="closeModal('deposit-modal')">
                                <i class="fas fa-times"></i> Ghairi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize the deposit section after creating modal
    setTimeout(() => initDepositSection(), 100);
}

// Update the openModal function to handle deposit modal
function openModal(modalId) {
    if (modalId === 'deposit-modal' && !document.getElementById('deposit-modal')) {
        createDepositModal();
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset deposit modal when opened
        if (modalId === 'deposit-modal') {
            setTimeout(() => {
                resetDepositModal();
            }, 100);
        }
    }
    
    autoCloseHamburgerAfterNav();
}

// Function to reset deposit modal
function resetDepositModal() {
    // Reset form fields
    const fields = ['amount', 'deposit-type', 'sender-name', 'sender-account', 'transaction-code'];
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // Hide sections
    const sections = ['transaction-section', 'status-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    // Hide account info
    document.querySelectorAll('.account-info').forEach(info => {
        info.style.display = 'none';
    });
    
    // Reset quick amount buttons
    document.querySelectorAll('.quick-amount').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Clear temporary data
    window.currentDepositTransactionId = null;
    
    // Reset instructions
    const instructionsContent = document.getElementById('instructions-content');
    if (instructionsContent) {
        instructionsContent.innerHTML = '<p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>';
    }
}

// Make sure this is called when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create deposit modal if it doesn't exist
    setTimeout(() => {
        if (!document.getElementById('deposit-modal')) {
            createDepositModal();
        }
    }, 1000);
});
 
// Withdrawal Section Functionality - FIREBASE VERSION
async function initWithdrawalSection() {
    const withdrawMethod = document.getElementById('withdraw-method');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const quickAmounts = document.querySelectorAll('#withdraw-section .quick-amount[data-amount]');
    
    // Show account info based on withdrawal method
    if (withdrawMethod) {
        withdrawMethod.addEventListener('change', function() {
            const accountInfo = document.getElementById('withdraw-account-info');
            if (accountInfo) {
                if (this.value) {
                    accountInfo.style.display = 'block';
                } else {
                    accountInfo.style.display = 'none';
                }
            }
        });
    }
    
    // Quick amount buttons
    if (quickAmounts.length > 0) {
        quickAmounts.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                const withdrawAmountInput = document.getElementById('withdraw-amount');
                if (withdrawAmountInput) {
                    withdrawAmountInput.value = amount;
                    updateWithdrawalCalculation();
                }
            });
        });
    }
    
    // Update withdrawal calculation when amount changes
    if (withdrawAmount) {
        withdrawAmount.addEventListener('input', updateWithdrawalCalculation);
    }
    
    // Withdrawal button click - UPDATED FOR FIREBASE
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', async function() {
            const amountInput = document.getElementById('withdraw-amount');
            const methodSelect = document.getElementById('withdraw-method');
            const accountNumberInput = document.getElementById('account-number');
            const accountNameInput = document.getElementById('account-name');
            const reasonInput = document.getElementById('withdraw-reason');
            
            if (!amountInput || !methodSelect || !accountNumberInput || !accountNameInput) {
                alert('Hitilafu ya mfumo. Tafadhali jaribu tena.');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;
            const accountNumber = accountNumberInput.value.trim();
            const accountName = accountNameInput.value.trim();
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
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
            const hasWithdrawn = await hasWithdrawnToday(db.currentUser.id);
            if (hasWithdrawn) {
                alert('Umekwisha toa fedha leo. Unaweza kutoa fedha tena kesho.');
                return;
            }
            
            // Check if user has pending withdrawal
            const hasPending = await hasPendingWithdrawal(db.currentUser.id);
            if (hasPending) {
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
            
            try {
                // Process withdrawal (deduct amount immediately) - KEY FEATURE
                const success = await processWithdrawalRequest(db.currentUser.id, amount);
                
                if (!success) {
                    alert('Hitilafu imetokea wakati wa kutoa fedha. Tafadhali jaribu tena.');
                    return;
                }
                
                // Create withdrawal transaction
                const transaction = await db.createTransaction(
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
                    const statusSection = document.getElementById('withdraw-status-section');
                    const requestAmountDisplay = document.getElementById('withdraw-request-amount');
                    
                    if (statusSection) statusSection.style.display = 'block';
                    if (requestAmountDisplay) requestAmountDisplay.textContent = db.formatCurrency(amount);
                    
                    // Reset form
                    amountInput.value = '';
                    methodSelect.value = '';
                    accountNumberInput.value = '';
                    accountNameInput.value = '';
                    if (reasonInput) reasonInput.value = '';
                    
                    // Hide account info
                    const accountInfo = document.getElementById('withdraw-account-info');
                    if (accountInfo) accountInfo.style.display = 'none';
                    
                    // Update balance display
                    updateBalanceDisplay();
                    
                    alert('Ombi lako la kutoa fedha limewasilishwa kwa mafanikio. Kiasi kimetolewa kwenye salio lako na linachunguzwa.');
                } else {
                    alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
                }
            } catch (error) {
                console.error('Error processing withdrawal:', error);
                alert('Hitilafu imetokea. Tafadhali jaribu tena.');
            }
        });
    }
    
    // Initial calculation update
    updateWithdrawalCalculation();
}

// Process withdrawal request (deduct amount immediately) - FIREBASE VERSION
async function processWithdrawalRequest(userId, amount) {
    try {
        // Check if user has sufficient balance
        if (db.currentUser.balance < amount) {
            return false;
        }
        
        // Deduct amount immediately - KEY FEATURE
        const newBalance = db.currentUser.balance - amount;
        
        // Update user balance in Firebase
        const userRef = db.db.collection('users').doc(userId.toString());
        await userRef.update({
            balance: newBalance,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update current user balance
        db.currentUser.balance = newBalance;
        
        return true;
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        return false;
    }
}

// Check if user has pending withdrawal - FIREBASE VERSION
async function hasPendingWithdrawal(userId) {
    try {
        // Get user document
        const userRef = db.db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        const transactions = userData.transactions || [];
        
        // Check if there's any pending withdrawal transaction
        return transactions.some(t => 
            t.type === 'withdrawal' && t.status === 'pending'
        );
    } catch (error) {
        console.error('Error checking pending withdrawal:', error);
        return false;
    }
}

// Check if user has withdrawn today - FIREBASE VERSION
async function hasWithdrawnToday(userId) {
    try {
        // Get user document
        const userRef = db.db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        const transactions = userData.transactions || [];
        
        const today = new Date().toDateString();
        return transactions.some(t => {
            if (t.type === 'withdrawal' && t.status === 'approved') {
                const transactionDate = new Date(t.date).toDateString();
                return transactionDate === today;
            }
            return false;
        });
    } catch (error) {
        console.error('Error checking if user has withdrawn today:', error);
        return false;
    }
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
    const amountInput = document.getElementById('withdraw-amount');
    const withdrawCalc = document.getElementById('calc-withdraw');
    const chargeCalc = document.getElementById('calc-charge');
    const receiveCalc = document.getElementById('calc-receive');
    const remainingCalc = document.getElementById('calc-remaining');
    
    if (!amountInput || !withdrawCalc || !chargeCalc || !receiveCalc || !remainingCalc) {
        return;
    }
    
    const amount = parseFloat(amountInput.value) || 0;
    const serviceCharge = amount * 0.1;
    const netAmount = amount - serviceCharge;
    const currentUser = db.currentUser;
    const remainingBalance = currentUser ? (currentUser.balance - amount) : 0;
    
    withdrawCalc.textContent = db.formatCurrency(amount);
    chargeCalc.textContent = db.formatCurrency(serviceCharge);
    receiveCalc.textContent = db.formatCurrency(netAmount);
    remainingCalc.textContent = db.formatCurrency(remainingBalance);
}

// Update Database transaction status method for Firebase - FIXED WITHDRAWAL LOGIC
// Update transaction status (Database method - optimized and combined)
Database.prototype.updateTransactionStatus = async function(transactionId, status, adminId) {
    try {
        console.log(`🔄 Updating transaction ${transactionId} to ${status} by admin ${adminId}`);
        
        const usersSnapshot = await this.db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            
            if (transactionIndex !== -1) {
                const transaction = transactions[transactionIndex];
                const oldStatus = transaction.status;
                const currentTimestamp = new Date().toISOString();
                
                console.log(`📝 Found transaction:`, {
                    id: transaction.id,
                    userId: parseInt(userDoc.id),
                    type: transaction.type,
                    oldStatus: oldStatus,
                    newStatus: status,
                    amount: transaction.amount
                });
                
                // Update transaction
                transactions[transactionIndex] = {
                    ...transaction,
                    status: status,
                    adminActionDate: currentTimestamp,
                    adminId: adminId
                };
                
                // Calculate balance adjustment
                let balanceAdjustment = 0;
                
                if (transaction.type === 'deposit' && status === 'approved' && oldStatus !== 'approved') {
                    balanceAdjustment = parseFloat(transaction.amount) || 0;
                    console.log(`💰 initapproved: Adding ${balanceAdjustment} to balance`);
                } else if (transaction.type === 'withdrawal' && status === 'rejected' && oldStatus === 'pending') {
                    // For withdrawal rejection: add back the deducted amount (amount was already deducted when requested)
                    balanceAdjustment = parseFloat(transaction.amount) || 0;
                    console.log(`💸 Withdrawal rejected: Adding back ${balanceAdjustment} to balance`);
                }
                // For withdrawal approval: do nothing (amount was already deducted when requested)
                
                // Update user in Firestore
                const userRef = this.db.collection('users').doc(userDoc.id);
                const updateData = {
                    transactions: transactions,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (balanceAdjustment !== 0) {
                    updateData.balance = firebase.firestore.FieldValue.increment(balanceAdjustment);
                    
                    // Update current user object if it's the same user
                    if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                        this.currentUser.balance += balanceAdjustment;
                        this.currentUser.transactions = transactions;
                        console.log(`📊 Updated current user balance: ${this.currentUser.balance}`);
                    }
                } else {
                    // Still update current user's transactions even if balance doesn't change
                    if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                        this.currentUser.transactions = transactions;
                    }
                }
                
                await userRef.update(updateData);
                console.log(`✅ Transaction ${transactionId} updated to ${status}`);
                return true;
            }
        }
        
        console.log(`❌ Transaction ${transactionId} not found`);
        return false;
        
    } catch (error) {
        console.error('❌ Error updating transaction status:', error);
        return false;
    }
};

// Update balance display function
function updateBalanceDisplay() {
    const profileBalance = document.getElementById('profile-balance');
    const profileBalanceDisplay = document.getElementById('profile-balance-display');
    const dashboardBalance = document.getElementById('dashboard-balance');
    const withdrawBalance = document.getElementById('withdraw-balance');
    
    if (profileBalance) profileBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (profileBalanceDisplay) profileBalanceDisplay.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (dashboardBalance) dashboardBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (withdrawBalance) withdrawBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    // Update modal balance if modal is open
    const modalBalance = document.getElementById('modal-balance');
    const investmentModal = document.getElementById('investment-modal');
    if (modalBalance && investmentModal && investmentModal.style.display === 'flex') {
        modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    }
}

// Update the showSuperAdminDashboard function

// Update the navigation to handle super admin
function initNavigation() {
    // Add event listeners for navigation items
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (!target) return;
                
                // Hide all sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Remove active class from all nav items
                navItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // Show target section and activate nav item
                const targetSection = document.getElementById(target);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
                this.classList.add('active');
            });
        });
    }

    // Special handling for super admin dashboard navigation
    const superAdminNavItems = document.querySelectorAll('#super-admin-dashboard .nav-item');
    if (superAdminNavItems.length > 0) {
        superAdminNavItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (target) {
                    switchToSection(target);
                }
            });
        });
    }
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
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const targetNavItem = document.querySelector(`[data-target="${sectionId}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing sections...');
    
    // Initialize UI elements with delays to ensure elements exist
    setTimeout(() => {
        // Initialize login tabs
        if (typeof initLoginTabs === 'function') {
            initLoginTabs();
        }
        
        // Initialize deposit section
        if (typeof initDepositSection === 'function') {
            initDepositSection();
        }
        
        // Initialize withdrawal section
        if (typeof initWithdrawalSection === 'function') {
            initWithdrawalSection();
        }
        
        // Initialize navigation
        if (typeof initNavigation === 'function') {
            initNavigation();
        }
    }, 500);
    
    // Check if user is already logged in
    if (db && db.currentUser) {
        console.log('User already logged in:', db.currentUser.username);
        setTimeout(() => {
            if (db.isSuperAdmin(db.currentUser)) {
                showSuperAdminDashboard();
            } else if (db.currentUser.is_admin) {
                showAdminDashboard();
            } else {
                showUserDashboard();
            }
        }, 1000);
    }
    
    // Auto-detect admin email for admin password field
    const loginEmailInput = document.getElementById('login-email');
    const adminPasswordSection = document.getElementById('admin-password-section');
    
    if (loginEmailInput && adminPasswordSection) {
        loginEmailInput.addEventListener('input', function() {
            const email = this.value;
            
            if (db && db.isAdminEmail(email)) {
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
                            <i class="fas fa-crown"></i> Super Admin access detected
                        </p>
                    `;
                }
            } else {
                adminPasswordSection.style.display = 'none';
            }
        });
    }
});

// Add helper function to check user permissions
function hasPermission(permission) {
    if (!db || !db.currentUser) return false;
    
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
    console.log('Initializing Super Admin Dashboard...');
    
    // Load super admin data
    if (typeof loadSuperAdminData === 'function') {
        loadSuperAdminData();
    }
    
    // Setup event listeners
    if (typeof setupSuperAdminEventListeners === 'function') {
        setupSuperAdminEventListeners();
    }
    
    // Start real-time updates
    if (typeof startRealTimeUpdates === 'function') {
        startRealTimeUpdates();
    }
    
    // Show welcome message for super admin
    showNotification('Welcome, Super Admin!', 'success');
}

// Add function to load super admin data (placeholder)
function loadSuperAdminData() {
    console.log('Loading super admin data...');
    // This should be implemented based on your specific super admin requirements
    if (typeof updateSuperAdminStats === 'function') {
        updateSuperAdminStats();
    }
}

// Add function to update super admin statistics (placeholder)
function updateSuperAdminStats() {
    console.log('Updating super admin statistics...');
    // This should be implemented based on your specific super admin requirements
}

// Add notification function
function showNotification(message, type = 'info') {
    // Check if notification styles are already added
    if (!document.getElementById('notification-styles')) {
        // Add CSS for notifications
        const notificationStyles = `
        <style id="notification-styles">
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
            font-family: Arial, sans-serif;
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
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', notificationStyles);
    }
    
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
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// CSS for super admin badge (if needed)
const superAdminBadgeCSS = `
<style>
.super-admin-badge {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    margin-left: 8px;
    display: inline-block;
}
</style>
`;

// Inject super admin badge styles
if (!document.getElementById('super-admin-badge-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'super-admin-badge-styles';
    styleElement.textContent = superAdminBadgeCSS;
    document.head.appendChild(styleElement);
}

// ========== SUPER ADMIN DASHBOARD FUNCTIONS ==========

// Initialize super admin dashboard
function initSuperAdminDashboard() {
    updateSuperAdminUI();
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
}

// Load super admin data
async function loadSuperAdminData() {
    try {
        await Promise.all([
            loadAdminsList(),
            loadUsersList(),
            loadSystemStats(),
            loadRecentActivities(),
            loadPendingTasks(),
            loadSystemLogs()
        ]);
        
    } catch (error) {
        console.error('Error loading super admin data:', error);
    }
}

// Load system statistics
async function loadSystemStats() {
    try {
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin);
        const activeAdmins = admins.filter(admin => admin.status === 'active');
        const pendingTransactions = await db.getPendingTransactions();
        
        const totalDeposits = await db.getTotalDeposits();
        const totalWithdrawals = await db.getTotalWithdrawals();
        const systemRevenue = totalDeposits - totalWithdrawals;
        
        updateElement('#super-total-users', users.length);
        updateElement('#active-admins-count', activeAdmins.length);
        updateElement('#pending-approvals-count', pendingTransactions.length);
        updateElement('#system-revenue', db.formatCurrency ? db.formatCurrency(systemRevenue) : `TZS ${Math.round(systemRevenue).toLocaleString()}`);
        
        updateElement('#total-admins-count', admins.length);
        updateElement('#active-admins', activeAdmins.length);
        
        const onlineAdmins = activeAdmins.filter(admin => {
            if (!admin.last_active) return false;
            const lastActive = new Date(admin.last_active);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastActive > fiveMinutesAgo;
        });
        updateElement('#online-admins', onlineAdmins.length);
        
        const activeUsers = users.filter(user => user.status === 'active' && !user.is_admin);
        const inactiveUsers = users.filter(user => user.status === 'inactive');
        const today = new Date().toDateString();
        const todaySignups = users.filter(user => {
            const joinDate = new Date(user.join_date).toDateString();
            return joinDate === today && !user.is_admin;
        });
        
        updateElement('#total-users-count', users.length);
        updateElement('#active-users-count', activeUsers.length);
        updateElement('#inactive-users-count', inactiveUsers.length);
        updateElement('#today-signups-count', todaySignups.length);
        
    } catch (error) {
        console.error('Error loading system stats:', error);
    }
}

// Update element helper function
function updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Toggle user password visibility
function toggleUserPassword(userId, button) {
    const row = button.closest('tr');
    const passwordCell = row.querySelector('.password-cell');
    const maskedSpan = passwordCell.querySelector('.password-masked');
    
    if (maskedSpan.dataset.actual) {
        maskedSpan.textContent = '********';
        delete maskedSpan.dataset.actual;
        button.innerHTML = '<i class="fas fa-eye"></i>';
    } else {
        maskedSpan.textContent = 'Password hidden for security';
        maskedSpan.dataset.actual = 'true';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    }
}

// Toggle password visibility in modal
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const container = document.getElementById('system-activities-list');
        if (!container) return;
        
        const transactions = await db.getAllTransactions();
        const recentTransactions = transactions.slice(0, 10);
        
        let html = '';
        
        if (recentTransactions.length === 0) {
            html = '<div class="no-activities">No recent activities found</div>';
        } else {
            recentTransactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const timeAgo = getTimeAgo(date);
                
                html += `
                    <div class="activity-item">
                        <div class="activity-icon ${transaction.type === 'deposit' ? 'deposit' : 'withdrawal'}">
                            <i class="fas fa-${transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div class="activity-details">
                            <div class="activity-title">${transaction.username} - ${transaction.type.toUpperCase()}</div>
                            <div class="activity-info">
                                Amount: TZS ${Math.round(transaction.amount).toLocaleString()} | 
                                Status: <span class="status-${transaction.status}">${transaction.status}</span>
                            </div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Load pending tasks
async function loadPendingTasks() {
    try {
        const pendingTasks = 0;
        updateElement('#pending-tasks-count', pendingTasks);
        
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin);
        const assigneeFilter = document.getElementById('task-assignee-filter');
        
        if (assigneeFilter) {
            assigneeFilter.innerHTML = '<option value="all">All Assignees</option>';
            admins.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.id;
                option.textContent = admin.username;
                assigneeFilter.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading pending tasks:', error);
    }
}

// Load system logs
async function loadSystemLogs() {
    try {
        const container = document.getElementById('system-logs');
        if (!container) return;
        
        const html = '';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading system logs:', error);
    }
}

// Setup super admin event listeners
function setupSuperAdminEventListeners() {
    const adminSearch = document.getElementById('admin-search');
    if (adminSearch) {
        adminSearch.addEventListener('input', filterAdminsTable);
    }
    
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsersTable);
    }
    
    const addAdminBtn = document.querySelector('button[onclick="openAddAdminModal()"]');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddAdminModal);
    }
    
    const createTaskBtn = document.querySelector('button[onclick="openCreateTaskModal()"]');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', openCreateTaskModal);
    }
    
    const viewAllTransactionsBtn = document.querySelector('button[onclick="viewAllTransactions()"]');
    if (viewAllTransactionsBtn) {
        viewAllTransactionsBtn.addEventListener('click', viewAllTransactions);
    }
    
    const adminChatBtn = document.querySelector('button[onclick="switchToSection(\'super-admin-chat\')"]');
    if (adminChatBtn) {
        adminChatBtn.addEventListener('click', () => switchToSection('super-admin-chat'));
    }
    
    const saveSecurityBtn = document.querySelector('button[onclick="saveSecuritySettings()"]');
    if (saveSecurityBtn) {
        saveSecurityBtn.addEventListener('click', saveSecuritySettings);
    }
    
    const saveSystemConfigBtn = document.querySelector('button[onclick="saveSystemConfig()"]');
    if (saveSystemConfigBtn) {
        saveSystemConfigBtn.addEventListener('click', saveSystemConfig);
    }
    
    const updateRolePermsBtn = document.querySelector('button[onclick="updateRolePermissions()"]');
    if (updateRolePermsBtn) {
        updateRolePermsBtn.addEventListener('click', updateRolePermissions);
    }
}

// Start real-time updates
function startRealTimeUpdates() {
    setInterval(() => {
        loadSystemStats();
        loadRecentActivities();
    }, 30000);
    
    if (db && db.db) {
        const usersRef = db.db.collection('users');
        
        usersRef.onSnapshot((snapshot) => {
            loadUsersList();
            loadAdminsList();
            loadSystemStats();
        });
    }
}

// Filter admins table
function filterAdminsTable() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const rows = document.querySelectorAll('#admins-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter users table
function filterUsersTable() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Open add admin modal
function openAddAdminModal() {
    showCustomModal('Add New Admin', getAddAdminModalContent());
}

// Initialize when super admin dashboard is shown
function showSuperAdminDashboard() {
    console.log('🛡️ Showing Super Admin Dashboard...');
    
    // Hide all other dashboards with null checks
    const loginContainer = document.getElementById('login-container');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'block';
    
    // Update username display with safe access
    if (db?.currentUser?.username) {
        const usernameDisplay = document.getElementById('super-admin-username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = db.currentUser.username;
        }
    }
    
    // Initialize rewards system if needed (from first version)
    if (db.currentUser && !rewardsSystem) {
        setTimeout(() => initializeRewardsSystem(db.currentUser), 300);
    }
    
    // Add user management to navigation
    setTimeout(() => {
        addUserManagementToNavigation();
    }, 500);
    
    // Initialize user management system
    setTimeout(() => {
        if (typeof addUserManagementStyles === 'function') {
            addUserManagementStyles();
        }
    }, 300);
    
    // Initialize admin management system
    setTimeout(() => {
        initSuperAdminDashboardWithAdminManagement();
    }, 500);
    
    // Initialize super admin system with combined initialization
    setTimeout(() => {
        // Call both initialization functions if they exist
        if (typeof initSuperAdminDashboard === 'function') {
            initSuperAdminDashboard();
        }
        if (typeof initializeSuperAdminSystem === 'function') {
            initializeSuperAdminSystem();
        }
        // If neither exists, fall back to whichever might exist
        else if (typeof initSuperAdminDashboard === 'function') {
            initSuperAdminDashboard();
        }
        else if (typeof initializeSuperAdminSystem === 'function') {
            initializeSuperAdminSystem();
        }
    }, 500);
}

// Hamburger Menu System
class HamburgerSystem {
    constructor() {
        this.currentDashboard = null;
        this.init();
    }
    
    init() {
        // Set up event listeners for all hamburger buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.hambtn')) {
                const btn = e.target.closest('.hambbtn');
                const dashboard = btn.getAttribute('data-dashboard');
                this.toggleSidebar(dashboard);
            }
            
            if (e.target.closest('.closebtn')) {
                const dashboard = this.currentDashboard;
                this.closeSidebar(dashboard);
            }
            
            if (e.target.classList.contains('backdrop')) {
                const dashboard = this.currentDashboard;
                this.closeSidebar(dashboard);
            }
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !e.target.closest('.sidebar') &&
                !e.target.closest('.hambbtn') && this.currentDashboard) {
                this.closeSidebar(this.currentDashboard);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentDashboard) {
                this.closeSidebar(this.currentDashboard);
            }
        });
    }
    
    toggleSidebar(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar.classList.contains('active')) {
            this.closeSidebar(dashboard);
        } else {
            this.openSidebar(dashboard);
        }
    }
    
    openSidebar(dashboard) {
        // Close any open sidebar first
        this.closeAllSidebars();
        
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar && backdrop && hamburger) {
            sidebar.classList.add('active');
            backdrop.classList.add('active');
            hamburger.classList.add('active');
            this.currentDashboard = dashboard;
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeSidebar(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar && backdrop && hamburger) {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            hamburger.classList.remove('active');
            this.currentDashboard = null;
            document.body.style.overflow = '';
        }
    }
    
    closeAllSidebars() {
        const dashboards = ['user', 'admin', 'super-admin'];
        dashboards.forEach(dashboard => {
            this.closeSidebar(dashboard);
        });
    }
    
    // Update sidebar content when switching dashboards
    updateSidebarContent(dashboard, userData) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        if (!sidebar) return;
        
        // Update user info
        if (userData) {
            const usernameEl = sidebar.querySelector('#sidebar-username');
            const balanceEl = sidebar.querySelector('#sidebar-balance');
            
            if (usernameEl) usernameEl.textContent = userData.username || 'User';
            if (balanceEl) balanceEl.textContent = `TZS ${userData.balance || 0}`;
        }
    }
}

// Initialize the hamburger system
const hamburgerSystem = new HamburgerSystem();

// Replace the old toggleSidebar function with this:
function toggleSidebar(dashboard) {
    hamburgerSystem.toggleSidebar(dashboard);
}

// Initialize sidebar when dashboard loads
function initializeDashboardSidebar(dashboard, userData = null) {
    // Set up close button event
    const closeBtn = document.getElementById(`${dashboard}-closeSide`);
    if (closeBtn) {
        closeBtn.onclick = () => hamburgerSystem.closeSidebar(dashboard);
    }
    
    // Set up backdrop click event
    const backdrop = document.getElementById(`${dashboard}-back`);
    if (backdrop) {
        backdrop.onclick = () => hamburgerSystem.closeSidebar(dashboard);
    }
    
    // Update content if user data provided
    if (userData) {
        hamburgerSystem.updateSidebarContent(dashboard, userData);
    }
    
    // Set up navigation links
    const navLinks = document.querySelectorAll(`#${dashboard}-side .nav-link`);
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (dashboard === 'user') {
                const target = link.getAttribute('data-target');
                if (target) {
                    e.preventDefault();
                    showSection(target);
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth <= 768) {
                        hamburgerSystem.closeSidebar(dashboard);
                    }
                }
            }
        });
    });
}

// Call this when switching to a dashboard
function setupDashboard(dashboardType, userData) {
    // Close any open sidebars first
    hamburgerSystem.closeAllSidebars();
    
    // Initialize the sidebar for this dashboard
    initializeDashboardSidebar(dashboardType, userData);
}

// Add responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        // Auto-open sidebar on larger screens if needed
        if (hamburgerSystem.currentDashboard) {
            const sidebar = document.getElementById(`${hamburgerSystem.currentDashboard}-side`);
            if (sidebar && !sidebar.classList.contains('active')) {
                hamburgerSystem.openSidebar(hamburgerSystem.currentDashboard);
            }
        }
    } else {
        // Auto-close sidebar on mobile if open
        if (hamburgerSystem.currentDashboard) {
            hamburgerSystem.closeSidebar(hamburgerSystem.currentDashboard);
        }
    }
});

// ==============================================
// COMPLETE INVESTMENT SYSTEM - ENHANCED VERSION
// ==============================================

// Investment System Variables
let investments = [];
let currentMineral = null;
let currentPrice = 0;
let profitIntervals = {};
let isInvestmentSystemInitialized = false;
let investmentFirebaseUnsubscribe = null;
let isInvestmentButtonListenerSet = false;
let isCreatingInvestment = false;
let lastDeleteTime = {}; // Track last delete time per investment

// DOM Elements (will be initialized when needed)
let investmentModal, modalTitle, modalPrice, modalBalance, investmentGrams, investmentDays;
let totalCost, dailyProfit, insufficientFunds, startInvestmentBtn, investmentsContainer;

// ========== INITIALIZATION ==========

function initializeInvestmentSystem() {
    console.log('🚀 Initializing Investment System...');
    
    // Initialize DOM Elements
    investmentModal = document.getElementById('investment-modal');
    modalTitle = document.getElementById('modal-title');
    modalPrice = document.getElementById('modal-price');
    modalBalance = document.getElementById('modal-balance');
    investmentGrams = document.getElementById('investment-grams');
    investmentDays = document.getElementById('investment-days');
    totalCost = document.getElementById('total-cost');
    dailyProfit = document.getElementById('daily-profit');
    insufficientFunds = document.getElementById('insufficient-funds');
    startInvestmentBtn = document.getElementById('start-investment-btn');
    investmentsContainer = document.getElementById('investments-container');
    
    // Add investment styles
    addInvestmentStyles();
    
    // Setup event listeners
    setupInvestmentEventListeners();
    
    // Load investments if user is logged in
    if (db && db.currentUser) {
        loadUserInvestments();
    }
    
    console.log('✅ Investment System Initialized');
}

// Add investment styles to document
function addInvestmentStyles() {
    if (!document.getElementById('investment-styles')) {
        const styles = document.createElement('style');
        styles.id = 'investment-styles';
        styles.textContent = `
/* Mineral Investment Card - Advanced Responsive CSS */
:root {
  /* Color Variables */
  --primary-blue: #256f8a;
  --primary-blue-light: #3498db;
  --secondary-green: #113745;
  --secondary-gold: #28a745;
  --secondary-red: #e74c3c;
  --background-light: #f8f9fa;
  --background-card: #ffffff;
  --border-color: #e0e0e0;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --shadow-light: rgba(0, 0, 0, 0.05);
  --shadow-medium: rgba(0, 0, 0, 0.1);
  --shadow-dark: rgba(0, 0, 0, 0.15);
  
  /* Animation Variables */
  --transition-speed: 0.3s;
  --transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Spacing Variables */
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-xxl: 1.5rem;
}

/* Base Card Styles */
.mineral-investment-card {
  background: var(--background-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px var(--shadow-light);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  transition: all var(--transition-speed) var(--transition-bounce);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  height: 100%;
  min-height: 380px;
}

.mineral-investment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--primary-blue-light);
}

.mineral-investment-card.active {
  border-left: 4px solid var(--secondary-green);
  background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
}

.mineral-investment-card.completed {
  border-left: 4px solid var(--secondary-gold);
  background: linear-gradient(135deg, #ffffff 0%, #fffbf0 100%);
}

.mineral-investment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-blue-light), var(--secondary-green));
  opacity: 0;
  transition: opacity var(--transition-speed);
}

.mineral-investment-card:hover::before {
  opacity: 1;
}

/* Header Section */
.mineral-investment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--space-md);
  border-bottom: 2px solid var(--border-color);
  position: relative;
}

.mineral-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.mineral-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-light));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-xl);
  box-shadow: 0 4px 6px var(--shadow-light);
  transition: transform var(--transition-speed);
}

.mineral-investment-card:hover .mineral-icon {
  transform: rotate(15deg) scale(1.1);
}

.mineral-details {
  flex: 1;
  min-width: 0;
}

.mineral-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.investment-amount {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--primary-blue);
  background: var(--background-light);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  display: inline-block;
}

/* Investment Status */
.investment-status {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  margin-left: var(--space-sm);
  box-shadow: 0 2px 4px var(--shadow-light);
}

.status-active {
  background: linear-gradient(135deg, var(--secondary-green), #2ecc71);
  color: white;
  animation: pulse 2s infinite;
}

.status-completed {
  background: linear-gradient(135deg, var(--secondary-gold), #e67e22);
  color: white;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(46, 204, 113, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
  }
}

/* Investment Details */
.investment-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--background-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.investment-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
  border-bottom: 1px dashed var(--border-color);
}

.investment-detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.investment-detail-row:first-child {
  padding-top: 0;
}

.investment-detail-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.investment-detail-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.investment-detail-value.amount {
  color: var(--primary-blue);
  font-size: var(--font-size-md);
}

.investment-detail-value.profit {
  font-size: var(--font-size-md);
}

.investment-detail-value.profit.positive {
  color: var(--secondary-green);
}

.investment-detail-value.profit.negative {
  color: var(--secondary-red);
}

.investment-detail-value.expected,
.investment-detail-value.total-received {
  color: var(--secondary-gold);
  font-size: var(--font-size-md);
}

/* Progress Section */
.investment-progress-section {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  margin-top: var(--space-sm);
}

.investment-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 600;
}

.investment-progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-sm);
  position: relative;
}

.investment-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.investment-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--secondary-green), #2ecc71);
  border-radius: 4px;
  transition: width 1s ease-in-out;
  position: relative;
  z-index: 1;
}

.investment-time-remaining {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  justify-content: center;
}

.investment-time-remaining i {
  color: var(--primary-blue-light);
}

/* Completion Info */
.investment-completion-info {
  background: linear-gradient(135deg, #fff9e6, #ffefc9);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(243, 156, 18, 0.3);
  margin-top: var(--space-sm);
}

.investment-completion-date {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.investment-completion-date i {
  color: var(--secondary-gold);
}

.investment-success-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--secondary-green);
  color: white;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.investment-success-badge i {
  font-size: var(--font-size-lg);
}

/* Actions Section */
.investment-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: auto;
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

.btn-view-details,
.btn-delete {
  flex: 1;
  padding: 0.75rem var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-speed);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  min-height: 44px;
}

.btn-view-details {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-light));
  color: white;
}

.btn-view-details:hover {
  background: linear-gradient(135deg, var(--primary-blue-light), #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

        /* === VIEW DETAILS MODAL === */
        .investment-details-modal {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            border: 2px solid rgba(52, 152, 219, 0.1);
            position: relative;
            animation: modalSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .investment-details-modal::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 6px;
            background: linear-gradient(90deg, #3498db, #2980b9, #27ae60);
        }
        
        .investment-details-modal h3 {
            color: #2c3e50;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 30px;
            text-align: center;
            background: linear-gradient(135deg, #2c3e50, #3498db);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            padding-bottom: 15px;
            border-bottom: 3px solid #f1f8ff;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 25px 0;
        }
        
        .detail-item {
            padding: 20px;
            background: linear-gradient(135deg, #f8fbfe, #f0f7ff);
            border-radius: 12px;
            border: 2px solid rgba(52, 152, 219, 0.1);
            transition: all 0.3s ease;
        }
        
        .detail-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(52, 152, 219, 0.1);
            border-color: rgba(52, 152, 219, 0.3);
        }
        
        .detail-item .detail-label {
            color: #5d6d7e;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .detail-item .detail-value {
            color: #2c3e50;
            font-size: 18px;
            font-weight: 700;
            line-height: 1.4;
        }
        
        .detail-item .detail-value.total,
        .detail-item .detail-value.total-expected {
            color: #9b59b6;
            font-size: 20px;
            font-weight: 800;
        }
        
        .details-actions {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            padding-top: 25px;
            border-top: 2px solid #f1f8ff;
        }
        
        .details-actions button {
            flex: 1;
            padding: 16px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .btn-close {
            background: linear-gradient(135deg, #95a5a6, #7f8c8d);
            color: white;
        }
        
        .btn-close:hover {
            background: linear-gradient(135deg, #7f8c8d, #95a5a6);
            transform: translateY(-3px);
        }
         
         .mineral-btn-delete {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

.mineral-btn-delete:hover {
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(231, 76, 60, 0.4);
}

        
        .btn-delete {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
        }
        
        .btn-delete:hover {
            background: linear-gradient(135deg, #c0392b, #e74c3c);
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(231, 76, 60, 0.4);
        }
        
/* Responsive Design */

/* Tablets (768px and up) */
@media (min-width: 768px) {
  .mineral-investment-card {
    min-height: 420px;
    padding: var(--space-xl);
  }
  
  .mineral-name {
    font-size: var(--font-size-xl);
  }
  
  .investment-amount {
    font-size: var(--font-size-lg);
  }
  
  .investment-status {
    font-size: var(--font-size-sm);
    padding: 0.5rem 1rem;
  }
  
  .investment-detail-label,
  .investment-detail-value {
    font-size: var(--font-size-md);
  }
  
  .investment-detail-value.amount,
  .investment-detail-value.profit,
  .investment-detail-value.expected,
  .investment-detail-value.total-received {
    font-size: var(--font-size-lg);
  }
  
  .btn-view-details,
  .btn-delete {
    font-size: var(--font-size-md);
    padding: 0.875rem var(--space-lg);
  }
  
  .investment-progress-bar {
    height: 10px;
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .mineral-investment-card {
    max-width: 480px;
    margin: 0 auto var(--space-md) auto;
  }
  
  .mineral-investment-header {
    flex-direction: row;
    align-items: center;
  }
  
  .investment-details {
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    gap: var(--space-md);
  }
  
  .investment-detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
    border-bottom: none;
    padding: 0;
  }
  
  .investment-detail-value {
    text-align: left;
    max-width: 100%;
  }
  
  .investment-actions {
    flex-direction: row;
  }
  
  /* Create a two-column grid for larger screens */
  .investment-details > .investment-detail-row:nth-child(odd) {
    border-right: 1px dashed var(--border-color);
    padding-right: var(--space-md);
  }
  
  .investment-details > .investment-detail-row:nth-child(even) {
    padding-left: var(--space-md);
  }
}

/* Large Desktop (1440px and up) */
@media (min-width: 1440px) {
  .mineral-investment-card {
    max-width: 520px;
  }
  
  .mineral-icon {
    width: 56px;
    height: 56px;
    font-size: var(--font-size-xxl);
  }
  
  .investment-detail-value {
    font-size: var(--font-size-lg);
  }
}

/* Mobile (up to 480px) */
@media (max-width: 480px) {
  .mineral-investment-card {
    padding: var(--space-md);
    min-height: 360px;
    border-radius: var(--radius-md);
  }
  
  .mineral-investment-header {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  
  .investment-status {
    order: -1;
    width: 100%;
    text-align: center;
    margin-left: 0;
  }
  
  .mineral-info {
    width: 100%;
  }
  
  .mineral-icon {
    width: 40px;
    height: 40px;
    font-size: var(--font-size-lg);
  }
  
  .mineral-name {
    font-size: var(--font-size-md);
  }
  
  .investment-amount {
    font-size: var(--font-size-sm);
  }
  
  .investment-details {
    padding: var(--space-sm);
  }
  
  .investment-detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }
  
  .investment-detail-value {
    text-align: left;
    max-width: 100%;
  }
  
  .investment-actions {
    flex-direction: column;
  }
  
  .btn-view-details,
  .btn-delete {
    width: 100%;
  }
  
  .investment-progress-section,
  .investment-completion-info {
    padding: var(--space-sm);
  }
  
  .investment-success-badge {
    flex-direction: column;
    text-align: center;
    padding: var(--space-sm);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-blue: #3498db;
    --primary-blue-light: #5dade2;
    --secondary-green: #58d68d;
    --secondary-gold: #f7dc6f;
    --secondary-red: #f1948a;
    --background-light: #2c3e50;
    --background-card: #1a2530;
    --border-color: #34495e;
    --text-primary: #ecf0f1;
    --text-secondary: #bdc3c7;
    --shadow-light: rgba(0, 0, 0, 0.3);
    --shadow-medium: rgba(0, 0, 0, 0.4);
  }
  
  .mineral-investment-card.active {
    background: linear-gradient(135deg, #1a2530 0%, #1e2a36 100%);
  }
  
  .mineral-investment-card.completed {
    background: linear-gradient(135deg, #1a2530 0%, #2d2419 100%);
  }
  
  .investment-progress-section {
    background: linear-gradient(135deg, #2c3e50, #34495e);
  }
  
  .investment-completion-info {
    background: linear-gradient(135deg, #3d321f, #4a3c25);
    border-color: rgba(247, 220, 111, 0.3);
  }
  
  .btn-delete {
    background: linear-gradient(135deg, #2c3e50, #34495e);
  }
}

/* Print Styles */
@media print {
  .mineral-investment-card {
    box-shadow: none;
    border: 1px solid #000;
    break-inside: avoid;
  }
  
  .investment-actions {
    display: none;
  }
  
  .mineral-investment-card:hover {
    transform: none;
    box-shadow: none;
  }
  
  .investment-status {
    background: #fff !important;
    color: #000 !important;
    border: 1px solid #000;
  }
  
  .mineral-icon {
    background: #fff !important;
    color: #000 !important;
    border: 1px solid #000;
  }
}

/* Accessibility Improvements */
@media (prefers-reduced-motion: reduce) {
  .mineral-investment-card,
  .mineral-icon,
  .btn-view-details,
  .btn-delete,
  .investment-progress-fill {
    transition: none;
    animation: none;
  }
  
  .mineral-investment-card:hover {
    transform: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .mineral-investment-card {
    border: 2px solid currentColor;
  }
  
  .investment-detail-row {
    border-bottom: 2px dashed currentColor;
  }
  
  .btn-view-details,
  .btn-delete {
    border: 2px solid currentColor;
  }
}

/* Landscape Orientation for Mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .mineral-investment-card {
    min-height: 320px;
  }
  
  .mineral-investment-header {
    flex-direction: row;
    flex-wrap: nowrap;
  }
  
  .investment-status {
    width: auto;
    order: 0;
  }
  
  .investment-actions {
    flex-direction: row;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn-view-details,
  .btn-delete {
    min-height: 48px;
    padding: 1rem var(--space-md);
  }
  
  .mineral-investment-card:hover {
    transform: none;
    box-shadow: 0 4px 6px var(--shadow-light);
  }
}
        `;
        
        document.head.appendChild(styles);
        console.log('✅ Added advanced investment styles');
    }
}
    

// Setup all event listeners
function setupInvestmentEventListeners() {
    // Modal input listeners
    if (investmentGrams) {
        investmentGrams.addEventListener('input', calculateInvestmentReturn);
        investmentGrams.addEventListener('change', calculateInvestmentReturn);
    }
    
    if (investmentDays) {
        investmentDays.addEventListener('input', calculateInvestmentReturn);
        investmentDays.addEventListener('change', calculateInvestmentReturn);
    }
    
    // Quick amount buttons
    setupQuickAmountButtons();
    
    // Modal close listeners
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
    
    // Invest now button (if exists separately)
    const investNowBtn = document.getElementById('invest-now-btn');
    if (investNowBtn) {
        investNowBtn.addEventListener('click', function() {
            if (investmentGrams && investmentDays && 
                parseFloat(investmentGrams.value) > 0 && 
                parseFloat(investmentDays.value) >= 7) {
                startInvestment();
            } else {
                showNotification('Tafadhali weka gramu na siku halali kabla ya kuwekeza.', true);
            }
        });
    }
    
    // Add escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && investmentModal && 
            investmentModal.style.display === 'flex') {
            closeInvestmentModal();
        }
    });
}

// Setup quick amount buttons
function setupQuickAmountButtons() {
    // Quick grams buttons
    document.querySelectorAll('.quick-gram-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const grams = this.getAttribute('data-grams');
            if (investmentGrams) {
                investmentGrams.value = grams;
                calculateInvestmentReturn();
            }
        });
    });
    
    // Quick days buttons
    document.querySelectorAll('.quick-days-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = this.getAttribute('data-days');
            if (investmentDays) {
                investmentDays.value = days;
                calculateInvestmentReturn();
            }
        });
    });
}

// ========== USER VALIDATION ==========

// Check if user can invest (has made first deposit)
function canUserInvest() {
    if (!db || !db.currentUser) return false;
    
    // Check user status
    if (db.currentUser.status === 'inactive' || db.currentUser.status === 'pending') {
        return false;
    }
    
    // Check if user has made first approved deposit
    const transactions = db.currentUser.transactions || [];
    const hasApprovedDeposit = transactions.some(t => 
        t.type === 'deposit' && t.status === 'approved'
    );
    
    return hasApprovedDeposit;
}

// Show deposit required message
function showDepositRequired() {
    showNotification('⚠️ Unahitaji kufanya deposit ya kwanza kabla ya kuwekeza.', true);
    
    setTimeout(() => {
        if (confirm('Ungependa kufanya deposit ya kwanza sasa?')) {
            openModal('deposit-modal');
        }
    }, 1500);
}

// ========== INVESTMENT MODAL FUNCTIONS ==========

// Open investment modal with validation
function openInvestmentModal(mineral, price) {
    console.log(`📖 Opening investment modal for ${mineral} at TZS ${price}/g`);
    
    // Check if user can invest
    if (!canUserInvest()) {
        showDepositRequired();
        return;
    }
    
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    // Set current mineral and price
    currentMineral = mineral;
    currentPrice = price;
    
    // Update modal content
    updateModalContent();
    
    // Show modal
    if (investmentModal) {
        investmentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on grams input
        setTimeout(() => {
            if (investmentGrams) investmentGrams.focus();
        }, 300);
    }
    
    // Calculate initial return
    calculateInvestmentReturn();
}

// Update modal content
function updateModalContent() {
    if (!modalTitle || !modalPrice || !modalBalance) return;
    
    // Update title and price
    modalTitle.textContent = `Wekeza kwenye ${currentMineral}`;
    modalPrice.textContent = `TZS ${currentPrice.toLocaleString()}/g`;
    
    // Update balance
    if (db.currentUser) {
        const balance = db.currentUser.balance || 0;
        modalBalance.textContent = `TZS ${Math.round(balance).toLocaleString()}`;
        
        // Add balance info
        updateBalanceInfoInModal(balance);
    }
    
    // Reset inputs
    if (investmentGrams) investmentGrams.value = '';
    if (investmentDays) investmentDays.value = '7';
    
    // Reset displays
    if (totalCost) totalCost.textContent = 'TZS 0';
    if (dailyProfit) dailyProfit.textContent = 'TZS 0';
    if (insufficientFunds) insufficientFunds.style.display = 'none';
    
    // Setup invest button
    setupInvestButton();
}

// Add balance info to modal
function updateBalanceInfoInModal(balance) {
    let balanceInfo = document.getElementById('modal-balance-info');
    if (!balanceInfo) {
        balanceInfo = document.createElement('div');
        balanceInfo.id = 'modal-balance-info';
        balanceInfo.style.cssText = `
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
            font-size: 14px;
        `;
        
        const titleElement = modalTitle?.parentNode;
        if (titleElement) {
            titleElement.insertBefore(balanceInfo, titleElement.children[1]);
        }
    }
    
    balanceInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2c3e50; font-weight: 600;">
                <i class="fas fa-wallet"></i> Salio Lako:
            </span>
            <span style="color: #27ae60; font-weight: bold;">
                TZS ${Math.round(balance).toLocaleString()}
            </span>
        </div>
        <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
            <i class="fas fa-info-circle"></i>
            Kiasi cha chini: 1g | Muda wa chini: 7 siku
        </div>
    `;
}

// Setup invest button
function setupInvestButton() {
    if (!startInvestmentBtn) return;
    
    // Remove any existing listeners
    const newBtn = startInvestmentBtn.cloneNode(true);
    startInvestmentBtn.parentNode.replaceChild(newBtn, startInvestmentBtn);
    startInvestmentBtn = newBtn;
    
    // Add click listener
    startInvestmentBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if already creating investment
        if (isCreatingInvestment) {
            showNotification('Uwekezaji unaanzishwa tayari... Tafadhali subiri', false);
            return;
        }
        
        // Start investment
        await startInvestment();
    });
    
    // Update button text
    startInvestmentBtn.textContent = 'Anza Kuwekeza';
    startInvestmentBtn.disabled = false;
}

// Calculate investment return in real-time
function calculateInvestmentReturn() {
    if (!investmentGrams || !investmentDays || !totalCost || !dailyProfit || !insufficientFunds) {
        return;
    }
    
    const grams = parseFloat(investmentGrams.value) || 0;
    const days = parseFloat(investmentDays.value) || 0;
    
    if (grams <= 0 || days < 7) {
        // Reset displays
        if (totalCost) totalCost.textContent = 'TZS 0';
        if (dailyProfit) dailyProfit.textContent = 'TZS 0';
        if (insufficientFunds) insufficientFunds.style.display = 'none';
        if (startInvestmentBtn) startInvestmentBtn.disabled = true;
        
        // Remove profit breakdown
        removeProfitBreakdown();
        return;
    }
    
    // Calculate cost
    const cost = grams * currentPrice;
    
    // Check if user has sufficient balance
    const hasSufficientBalance = db.currentUser && db.currentUser.balance >= cost;
    
    // Update cost display
    if (totalCost) {
        totalCost.textContent = `TZS ${Math.round(cost).toLocaleString()}`;
        totalCost.style.color = hasSufficientBalance ? '#27ae60' : '#e74c3c';
    }
    
    // Update insufficient funds message
    if (insufficientFunds) {
        if (!hasSufficientBalance) {
            insufficientFunds.style.display = 'block';
            insufficientFunds.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Salio lako halitoshi. Unahitaji TZS ${Math.round(cost - db.currentUser.balance).toLocaleString()} zaidi.</span>
            `;
        } else {
            insufficientFunds.style.display = 'none';
        }
    }
    
    // Calculate and display profits
    calculateAndDisplayProfits(grams, days, cost, hasSufficientBalance);
}

// Calculate and display profit breakdown
function calculateAndDisplayProfits(grams, days, cost, hasSufficientBalance) {
    // Calculate profits
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    const totalProfit = calculateExpectedTotalProfitForPeriod(cost, days);
    const totalReturn = cost + totalProfit;
    const averageDailyProfit = totalProfit / days;
    const profitPercentage = (totalProfit / cost) * 100;
    
    // Update daily profit display
    if (dailyProfit) {
        dailyProfit.textContent = `TZS ${Math.round(averageDailyProfit).toLocaleString()}/siku`;
        dailyProfit.style.color = '#27ae60';
    }
    
    // Enable/disable start button
    if (startInvestmentBtn) {
        startInvestmentBtn.disabled = !hasSufficientBalance || grams <= 0 || days < 7;
    }
    
    // Show profit breakdown
    showProfitBreakdown(cost, totalProfit, totalReturn, profitPercentage, days);
}

// Show profit breakdown in modal
function showProfitBreakdown(cost, totalProfit, totalReturn, profitPercentage, days) {
    // Remove existing breakdown
    removeProfitBreakdown();
    
    // Create new breakdown
    const breakdown = document.createElement('div');
    breakdown.id = 'profit-breakdown-modal';
    breakdown.style.cssText = `
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
        border: 1px solid #dee2e6;
    `;
    
    breakdown.innerHTML = `
        <h4 style="color: #2c3e50; margin-bottom: 10px; font-size: 16px;">
            <i class="fas fa-chart-line"></i> Makadirio ya Faida
        </h4>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="background: white; padding: 10px; border-radius: 6px;">
                <div style="font-size: 12px; color: #7f8c8d;">Uwekezaji wa Awali</div>
                <div style="font-weight: bold; color: #2c3e50;">TZS ${Math.round(cost).toLocaleString()}</div>
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 6px;">
                <div style="font-size: 12px; color: #7f8c8d;">Faida Inayotarajiwa</div>
                <div style="font-weight: bold; color: #27ae60;">TZS ${Math.round(totalProfit).toLocaleString()}</div>
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 6px;">
                <div style="font-size: 12px; color: #7f8c8d;">Asilimia ya Faida</div>
                <div style="font-weight: bold; color: #3498db;">${profitPercentage.toFixed(2)}%</div>
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 6px;">
                <div style="font-size: 12px; color: #7f8c8d;">Jumla ya Mapato</div>
                <div style="font-weight: bold; color: #9b59b6;">TZS ${Math.round(totalReturn).toLocaleString()}</div>
            </div>
        </div>
        
        <div style="margin-top: 10px; padding: 10px; background: #e8f4fc; border-radius: 6px;">
            <div style="font-size: 12px; color: #2980b9;">
                <i class="fas fa-info-circle"></i>
                <strong>Kumbuka:</strong> Faida yote na uwekezaji wako wa awali zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji (${days} siku).
            </div>
        </div>
    `;
    
    // Insert before the invest button
    const buttonContainer = startInvestmentBtn?.parentNode;
    if (buttonContainer) {
        buttonContainer.insertBefore(breakdown, startInvestmentBtn);
    }
}

// Remove profit breakdown
function removeProfitBreakdown() {
    const existingBreakdown = document.getElementById('profit-breakdown-modal');
    if (existingBreakdown) {
        existingBreakdown.remove();
    }
}

// Close investment modal
function closeInvestmentModal() {
    if (investmentModal) {
        investmentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset modal
        currentMineral = null;
        currentPrice = 0;
        
        // Remove profit breakdown
        removeProfitBreakdown();
        
        // Reset creation lock
        isCreatingInvestment = false;
        
        console.log('✅ Investment modal closed');
    }
}

// ========== INVESTMENT CREATION ==========

// Start investment process
async function startInvestment() {
    console.log('🚀 Starting investment process...');
    
    // Validate user
    if (!db || !db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    // Check if already creating
    if (isCreatingInvestment) {
        showNotification('Uwekezaji unaanzishwa tayari... Tafadhali subiri', false);
        return;
    }
    
    // Get input values
    const grams = parseFloat(investmentGrams?.value) || 0;
    const days = parseFloat(investmentDays?.value) || 0;
    
    // Validate inputs
    if (!grams || grams < 1 || isNaN(grams)) {
        showNotification('Tafadhali weka angalau gramu 10', true);
        return;
    }
    
    if (!days || days < 7 || isNaN(days)) {
        showNotification('Tafadhali weka angalau siku 7', true);
        return;
    }
    
    if (!currentMineral || !currentPrice) {
        showNotification('Hitilafu ilitokea. Tafadhali chagua madini tena.', true);
        return;
    }
    
    // Calculate cost
    const cost = grams * currentPrice;
    
    // Check balance
    if (cost > db.currentUser.balance) {
        showNotification(`Salio lako halitoshi. Unahitaji TZS ${Math.round(cost - db.currentUser.balance).toLocaleString()} zaidi.`, true);
        return;
    }
    
    // Set creation lock
    isCreatingInvestment = true;
    if (startInvestmentBtn) {
        startInvestmentBtn.disabled = true;
        startInvestmentBtn.textContent = 'Inaanzisha...';
    }
    
    try {
        // Create investment with simplified approach
        await createNewInvestment(grams, days, cost);
        
    } catch (error) {
        console.error('❌ Investment creation failed:', error);
        // Error message already shown in createNewInvestment
        
    } finally {
        // Always unlock the system
        setTimeout(() => {
            isCreatingInvestment = false;
            if (startInvestmentBtn) {
                startInvestmentBtn.disabled = false;
                startInvestmentBtn.textContent = 'Anza Kuwekeza';
            }
        }, 1000);
    }
}

// Validate investment inputs
function validateInvestmentInputs(grams, days) {
    if (!grams || grams < 10 || isNaN(grams)) {
        showNotification('Tafadhali weka angalau gramu 10', true);
        return false;
    }
    
    if (!days || days < 7 || isNaN(days)) {
        showNotification('Tafadhali weka angalau siku 7', true);
        return false;
    }
    
    return true;
}

// Check user balance
function checkUserBalance(cost) {
    if (cost > db.currentUser.balance) {
        showNotification(`Salio lako halitoshi. Unahitaji TZS ${Math.round(cost - db.currentUser.balance).toLocaleString()} zaidi.`, true);
        return false;
    }
    
    return true;
}

// Create new investment
// === FIXED INVESTMENT CREATION FUNCTION ===
async function createNewInvestment(grams, days, cost) {
    console.log('🔄 Creating new investment...');
    
    // Generate unique ID
    const investmentId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Check for duplicates (60-second cooldown)
    const now = Date.now();
    const duplicate = investments.find(inv =>
        !inv.completed &&
        inv.mineral === currentMineral &&
        inv.grams === grams &&
        inv.days === days &&
        Math.abs(inv.cost - cost) < 0.01 &&
        (now - new Date(inv.startTime).getTime()) < 60000
    );
    
    if (duplicate) {
        showNotification('Uwekezaji huu tayari umeanzishwa! Tafadhali angalia katika orodha ya uwekezaji wako.', true);
        throw new Error('Duplicate investment detected');
    }
    
    // Record original balance for rollback
    const originalBalance = db.currentUser.balance;
    
    try {
        // 1. DEDUCT BALANCE IMMEDIATELY
        console.log(`💰 Before deduction: ${originalBalance}`);
        console.log(`💰 Deducting: ${cost}`);
        
        db.currentUser.balance -= cost;
        
        console.log(`💰 After deduction: ${db.currentUser.balance}`);
        
        // 2. IMMEDIATELY UPDATE UI
        updateAllBalanceDisplays();
        
        // 3. Create investment object with SIMPLER structure
        const newInvestment = {
            id: investmentId,
            mineral: currentMineral,
            grams: grams,
            days: days,
            startTime: new Date().toISOString(),
            cost: cost,
            completed: false,
            completionDate: null,
            finalProfit: 0,
            dailyRate: 0.035, // Simplified rate
            totalExpectedProfit: cost * 0.035 * days // Simplified calculation
        };
        
        console.log('📋 Investment created:', newInvestment);
        
        // 4. Add to local array
        investments.push(newInvestment);
        
        // 5. Save to Firebase - SIMPLIFIED VERSION
        const success = await saveInvestmentToFirebaseSimple(newInvestment, db.currentUser.balance);
        
        if (!success) {
            throw new Error('Failed to save to Firebase');
        }
        
        console.log('✅ Firebase save successful');
        
        // 6. Close modal and reset
        setTimeout(() => {
            closeInvestmentModal();
        }, 500);
        
        // 7. Update displays
        setTimeout(() => {
            updateInvestmentsDisplay();
            updateProfitBreakdown();
        }, 800);
        
        // 8. Start profit calculation
        setTimeout(() => {
            startProfitCalculation(investmentId);
        }, 1000);
        
        // 9. Show success message
        showNotification(`✅ Uwekezaji umeanzishwa kikamilifu! ${grams}g ya ${currentMineral} kwa ${days} siku.`, false);
        
        console.log('🎉 Investment created successfully');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR in createNewInvestment:', error);
        console.error('Error stack:', error.stack);
        
        // IMMEDIATE ROLLBACK ON ERROR
        console.log('🔄 Immediate rollback initiated...');
        
        // 1. Restore balance
        db.currentUser.balance = originalBalance;
        
        // 2. Update UI immediately
        updateAllBalanceDisplays();
        
        // 3. Remove from local array if added
        const index = investments.findIndex(inv => inv.id === investmentId);
        if (index !== -1) {
            investments.splice(index, 1);
            console.log('🗑️ Removed investment from local array');
        }
        
        // 4. Try to restore balance in Firebase
        try {
            console.log('💾 Attempting to restore balance in Firebase...');
            await restoreBalanceInFirebase(originalBalance);
            console.log('✅ Balance restored in Firebase');
        } catch (fbError) {
            console.error('❌ Failed to restore balance in Firebase:', fbError);
        }
        
        // 5. Show error message to user
        showNotification('❌ Hitilafu ilitokea. Fedha zako zimerudishwa kwenye salio lako.', true);
        
        throw error;
    }
}

// ========== INVESTMENT MANAGEMENT ==========

// Enhanced delete investment with cooldown
async function deleteInvestment(investmentId) {
    console.log(`🗑️ Attempting to delete investment: ${investmentId}`);
    
    // Check cooldown (prevent multiple clicks)
    const now = Date.now();
    if (lastDeleteTime[investmentId] && (now - lastDeleteTime[investmentId]) < 2000) {
        console.log('⏳ Please wait before deleting again');
        return;
    }
    
    // Set cooldown
    lastDeleteTime[investmentId] = now;
    
    // Find investment
    const investment = investments.find(inv => compareInvestmentIds(inv.id, investmentId));
    
    if (!investment) {
        showNotification('❌ Uwekezaji haupatikani. Tafadhali jaribu tena.', true);
        return;
    }
    
    // Confirm deletion
    let confirmMessage, confirmTitle;
    
    if (investment.completed) {
        confirmTitle = 'Futa Rekodi ya Uwekezaji';
        confirmMessage = 'Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika?';
    } else {
        confirmTitle = 'Futa Uwekezaji';
        confirmMessage = 'Unahakika unataka kufuta uwekezaji huu? Uwekezaji wako wa awali na faida yote itaongezwa kwenye balansi yako.';
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        if (investment.completed) {
            await deleteCompletedInvestment(investment);
        } else {
            await deleteActiveInvestment(investment);
        }
        
    // After successful deletion, update stats
        setTimeout(() => {
            loadDashboardStats();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error deleting investment:', error);
        showNotification('❌ Hitilafu ilitokea wakati wa kufuta uwekezaji. Tafadhali jaribu tena.', true);
    }
}

// Delete active investment with refund
async function deleteActiveInvestment(investment) {
    console.log('💰 Deleting active investment with refund...');
    
    // Calculate profit earned so far
    const currentProfit = calculateCurrentProfit(investment);
    const totalAmountToRefund = investment.cost + currentProfit;
    
    console.log('📊 Refund calculation:', {
        cost: investment.cost,
        profit: currentProfit,
        totalRefund: totalAmountToRefund
    });
    
    // Stop profit calculation
    if (profitIntervals[investment.id]) {
        clearInterval(profitIntervals[investment.id]);
        delete profitIntervals[investment.id];
    }
    
    // Update user balance
    const oldBalance = db.currentUser.balance;
    db.currentUser.balance += totalAmountToRefund;
    
    // Update UI immediately
    updateAllBalanceDisplays();
    
    // Remove from local array
    investments = investments.filter(inv => !compareInvestmentIds(inv.id, investment.id));
    
    // Save to Firebase
    await Promise.all([
        saveUserBalanceToFirebase(db.currentUser.id, db.currentUser.balance),
        saveAllInvestmentsToFirebase()
    ]);
    
    // Update displays
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
    
    // Show success message
    showNotification(`✅ Uwekezaji umefutwa kikamilifu! TZS ${Math.round(totalAmountToRefund).toLocaleString()} zimeongezwa kwenye salio lako.`, false);
    
    console.log('🎉 Active investment deleted and refunded');
}

// Delete completed investment (no refund)
async function deleteCompletedInvestment(investment) {
    console.log('🗑️ Deleting completed investment record...');
    
    // Remove from local array
    investments = investments.filter(inv => !compareInvestmentIds(inv.id, investment.id));
    
    // Save to Firebase
    await saveAllInvestmentsToFirebase();
    
    // Update displays
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
    
    // Show success message
    showNotification('✅ Rekodi ya uwekezaji imefutwa kikamilifu!', false);
    
    console.log('🎉 Completed investment record deleted');
}

// Complete investment automatically
async function completeInvestment(investment) {
    if (investment.completed) return;
    
    console.log('🏁 Completing investment:', investment.id);
    
    try {
        investment.completed = true;
        investment.completionDate = new Date().toISOString();
        
        // Calculate final profit
        const totalProfit = calculateExpectedTotalProfitForPeriod(investment.cost, investment.days);
        investment.finalProfit = totalProfit;
        
        // Add investment cost + profit to balance
        const totalAmount = investment.cost + totalProfit;
        db.currentUser.balance += totalAmount;
        
        // Stop profit calculation
        if (profitIntervals[investment.id]) {
            clearInterval(profitIntervals[investment.id]);
            delete profitIntervals[investment.id];
        }
        
        // Save to Firebase
        await Promise.all([
            saveUserBalanceToFirebase(db.currentUser.id, db.currentUser.balance),
            saveAllInvestmentsToFirebase()
        ]);
        
        // Update UI
        updateAllBalanceDisplays();
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        // Show success message
        showNotification(`🎉 Uwekezaji wako wa ${investment.mineral} umekamilika! TZS ${Math.round(totalAmount).toLocaleString()} zimeongezwa kwenye salio lako.`, false);
        
        console.log('✅ Investment completed successfully');
        
    } catch (error) {
        console.error('❌ Error completing investment:', error);
    }
}

// ========== PROFIT CALCULATION ==========

// Get daily return rate based on day of week
function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03; // 4% weekends, 3% weekdays
}

// Calculate expected total profit for a period
function calculateExpectedTotalProfitForPeriod(cost, days) {
    // Simple calculation: average 3.5% daily return
    const averageDailyRate = 0.035;
    return cost * averageDailyRate * days;
}

// Calculate current profit for an investment
function calculateCurrentProfit(investment) {
    if (investment.completed) {
        return investment.finalProfit || 0;
    }
    
    const now = new Date();
    const startDate = new Date(investment.startTime);
    const elapsedDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    if (elapsedDays <= 0) return 0;
    
    // Calculate profit for elapsed days
    const dailyRate = investment.dailyRate || 0.035;
    const profitForElapsedDays = investment.cost * dailyRate * elapsedDays;
    
    // Cap at expected total profit
    const expectedTotalProfit = investment.totalExpectedProfit || 
        calculateExpectedTotalProfitForPeriod(investment.cost, investment.days);
    
    return Math.min(profitForElapsedDays, expectedTotalProfit);
}

// Start profit calculation interval
function startProfitCalculation(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || investment.completed) return;
    
    // Clear existing interval
    if (profitIntervals[investmentId]) {
        clearInterval(profitIntervals[investmentId]);
    }
    
    // Set up interval to check completion
    profitIntervals[investmentId] = setInterval(() => {
        const now = new Date();
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        
        if (now >= endDate) {
            completeInvestment(investment);
        } else {
            // Update investment displays to show current profit
            updateInvestmentsDisplay();
        }
    }, 60000); // Check every minute
}

// ========== INVESTMENT DISPLAY ==========

// Update investments display with responsive design
function updateInvestmentsDisplay() {
    console.log('🔄 Updating investments display...');
    
    // Find containers
    const activeContainer = document.getElementById('active-investments-container');
    const completedContainer = document.getElementById('completed-investments-container');
    const allContainer = document.getElementById('investments-container');
    
    if (!activeContainer && !completedContainer && !allContainer) {
        console.warn('No investments containers found');
        return;
    }
    
    // Separate active and completed investments
    const activeInvestments = investments.filter(inv => !inv.completed);
    const completedInvestments = investments.filter(inv => inv.completed);
    
    // Display active investments
    if (activeContainer) {
        if (activeInvestments.length === 0) {
            activeContainer.innerHTML = createNoInvestmentsMessage('active');
        } else {
            activeContainer.innerHTML = activeInvestments.map(inv => 
                createInvestmentCard(inv)
            ).join('');
        }
    }
    
    // Display completed investments
    if (completedContainer) {
        if (completedInvestments.length === 0) {
            completedContainer.innerHTML = createNoInvestmentsMessage('completed');
        } else {
            completedContainer.innerHTML = completedInvestments.map(inv => 
                createInvestmentCard(inv)
            ).join('');
        }
    }
    
    // Display all investments in single container
    if (allContainer && !activeContainer && !completedContainer) {
        if (investments.length === 0) {
            allContainer.innerHTML = createNoInvestmentsMessage('all');
        } else {
            let html = '';
            
            // Active investments section
            if (activeInvestments.length > 0) {
                html += '<h3 class="section-title">Uwekezaji Unaendelea</h3>';
                html += '<div class="investments-grid active">';
                html += activeInvestments.map(inv => createInvestmentCard(inv)).join('');
                html += '</div>';
            }
            
            // Completed investments section
            if (completedInvestments.length > 0) {
                html += '<h3 class="section-title">Uwekezaji Ulokamilika</h3>';
                html += '<div class="investments-grid completed">';
                html += completedInvestments.map(inv => createInvestmentCard(inv)).join('');
                html += '</div>';
            }
            
            allContainer.innerHTML = html;
        }
    }
    
    // Setup delete button listeners
    setupDeleteButtonListeners();
    
    console.log(`✅ Display updated: ${activeInvestments.length} active, ${completedInvestments.length} completed`);
}

// Create investment card HTML
function createInvestmentCard(investment) {
    const isActive = !investment.completed;
    const currentProfit = calculateCurrentProfit(investment);
    const profitPercentage = investment.cost > 0 ? (currentProfit / investment.cost) * 100 : 0;
    
    // Calculate progress
    let progress = 0;
    if (isActive) {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const now = new Date();
        const totalTime = endDate - startDate;
        const elapsedTime = now - startDate;
        progress = Math.min(100, (elapsedTime / totalTime) * 100);
    }
    
    return `
        <div class="mineral-investment-card ${isActive ? 'active' : 'completed'}" 
             d="${investment.id}">
            
            <div class="mineral-investment-header">
                <div class="mineral-info">
                    <div class="mineral-icon">
                        <i class="fas fa-gem"></i>
                    </div>
                    <div class="mineral-details">
                        <h4 class="mineral-name">${investment.mineral}</h4>
                        <div class="investment-amount">${investment.grams}g</div>
                    </div>
                </div>
                <div class="investment-status ${isActive ? 'status-active' : 'status-completed'}">
                    ${isActive ? 'INAENDELEA' : 'IMEMALIZIKA'}
                </div>
            </div>
            
            <div class="investment-details">
                <div class="investment-detail-row">
                    <span class="investment-detail-label">Muda:</span>
                    <span class="investment-detail-value">${investment.days} siku</span>
                </div>
                
                <div class="investment-detail-row">
                    <span class="investment-detail-label">Uwekezaji:</span>
                    <span class="investment-detail-value amount">TZS ${Math.round(investment.cost).toLocaleString()}</span>
                </div>
                
                <div class="investment-detail-row">
                    <span class="investment-detail-label">${isActive ? 'Faida ya Sasa' : 'Faida ya Mwisho'}:</span>
                    <span class="investment-detail-value profit ${currentProfit >= 0 ? 'positive' : 'negative'}">
                        TZS ${Math.round(currentProfit).toLocaleString()} (${profitPercentage.toFixed(2)}%)
                    </span>
                </div>
                
                ${isActive ? `
                <div class="investment-detail-row">
                    <span class="investment-detail-label">Faida Inayotarajiwa:</span>
                    <span class="investment-detail-value expected">
                        TZS ${Math.round(investment.totalExpectedProfit || 0).toLocaleString()}
                    </span>
                </div>
                ` : `
                <div class="investment-detail-row">
                    <span class="investment-detail-label">Jumla ya Mapato:</span>
                    <span class="investment-detail-value total-received">
                        TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}
                    </span>
                </div>
                `}
            </div>
            
            ${isActive ? `
            <div class="investment-progress-section">
                <div class="investment-progress-info">
                    <span>Maendeleo:</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
                <div class="investment-progress-bar">
                    <div class="investment-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="investment-time-remaining">
                    <i class="far fa-clock"></i>
                    <span>Siku ${Math.ceil(investment.days * (100 - progress) / 100)} zimebaki</span>
                </div>
            </div>
            ` : `
            <div class="investment-completion-info">
                <div class="investment-completion-date">
                    <i class="far fa-calendar-check"></i>
                    <span>Imekamilika: ${new Date(investment.completionDate).toLocaleDateString()}</span>
                </div>
                <div class="investment-success-badge">
                    <i class="fas fa-check-circle"></i>
                    <span>Fedha zimeongezwa kwenye salio lako</span>
                </div>
            </div>
            `}
            
            <div class="investment-actions">
                <button class="btn-view-details" onclick="viewInvestmentDetails('${investment.id}')">
                    <i class="fas fa-eye"></i> Angalia Maelezo
                </button>
                
                ${isActive ? `
                <button class="btn-delete" data-investment-id="${investment.id}">
                    <i class="fas fa-trash"></i> Futa Uwekezaji
                </button>
                ` : `
                <button class="btn-delete" data-investment-id="${investment.id}">
                    <i class="fas fa-trash"></i> Futa Rekodi
                </button>
                `}
            </div>
        </div>
    `;
}

// Create no investments message
function createNoInvestmentsMessage(type) {
    const messages = {
        active: {
            title: 'Hakuna Uwekezaji Unaendelea',
            message: 'Huna uwekezaji wowote unaoendelea. Anza uwekezaji wako wa kwanza leo!',
            button: 'Anza Kuwekeza'
        },
        completed: {
            title: 'Hakuna Uwekezaji Ulokamilika',
            message: 'Huna uwekezaji uliokamilika bado.',
            button: 'Angalia Uwekezaji Unaendelea'
        },
        all: {
            title: 'Hakuna Uwekezaji',
            message: 'Huna uwekezaji wowote. Anza uwekezaji wako wa kwanza leo!',
            button: 'Anza Kuwekeza'
        }
    };
    
    const msg = messages[type] || messages.all;
    
    return `
        <div class="no-investments">
            <div class="no-investments-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <h3>${msg.title}</h3>
            <p>${msg.message}</p>
            <button class="btn-primary" onclick="switchToSection('marketplace')">
                <i class="fas fa-gem"></i> ${msg.button}
            </button>
        </div>
    `;
}

// Setup delete button listeners
function setupDeleteButtonListeners() {
    // Use event delegation for delete buttons
    document.querySelectorAll('.investments-container, .investments-grid').forEach(container => {
        // Remove existing listener
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
        
        // Add event delegation
        newContainer.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const investmentId = deleteBtn.getAttribute('data-investment-id');
                if (investmentId) {
                    deleteInvestment(investmentId);
                }
            }
        });
    });
}

// View investment details
function viewInvestmentDetails(investmentId) {
    const investment = investments.find(inv => compareInvestmentIds(inv.id, investmentId));
    if (!investment) return;
    
    const currentProfit = calculateCurrentProfit(investment);
    const profitPercentage = investment.cost > 0 ? (currentProfit / investment.cost) * 100 : 0;
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    
    const detailsHtml = `
        <div class="investment-details-modal">
            <h3>Maelezo ya Uwekezaji</h3>
            
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Madini:</span>
                    <span class="detail-value">${investment.mineral}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Kiasi:</span>
                    <span class="detail-value">${investment.grams} gramu</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Muda:</span>
                    <span class="detail-value">${investment.days} siku</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Uwekezaji wa Awali:</span>
                    <span class="detail-value">TZS ${Math.round(investment.cost).toLocaleString()}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">${investment.completed ? 'Faida ya Mwisho' : 'Faida ya Sasa'}:</span>
                    <span class="detail-value">TZS ${Math.round(currentProfit).toLocaleString()} (${profitPercentage.toFixed(2)}%)</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Tarehe ya Kuanza:</span>
                    <span class="detail-value">${startDate.toLocaleDateString()}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Tarehe ya Kumaliza:</span>
                    <span class="detail-value">${endDate.toLocaleDateString()}</span>
                </div>
                
                ${investment.completed ? `
                <div class="detail-item">
                    <span class="detail-label">Tarehe ya Kukamilika:</span>
                    <span class="detail-value">${new Date(investment.completionDate).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Jumla ya Mapato:</span>
                    <span class="detail-value total">TZS ${Math.round(investment.cost + (investment.finalProfit || 0)).toLocaleString()}</span>
                </div>
                ` : `
                <div class="detail-item">
                    <span class="detail-label">Faida Inayotarajiwa:</span>
                    <span class="detail-value expected">TZS ${Math.round(investment.totalExpectedProfit || 0).toLocaleString()}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Jumla Inayotarajiwa:</span>
                    <span class="detail-value total-expected">TZS ${Math.round(investment.cost + (investment.totalExpectedProfit || 0)).toLocaleString()}</span>
                </div>
                `}
            </div>
            
            <div class="details-actions">
                ${!investment.completed ? `
                <button class="btn-delete" onclick="deleteInvestment('${investment.id}')">
                    <i class="fas fa-trash"></i> Futa Uwekezaji
                </button>
                ` : `
                <button class="btn-delete" onclick="deleteInvestment('${investment.id}')">
                    <i class="fas fa-trash"></i> Futa Rekodi
                </button>
                `}
                
                <button class="btn-close" onclick="closeModal('investment-details-modal')">
                    <i class="fas fa-times"></i> Funga
                </button>
            </div>
        </div>
    `;
    
    // Create or update modal
    let modal = document.getElementById('investment-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'investment-details-modal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        `;
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = detailsHtml;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ========== FIREBASE INTEGRATION ==========

// Load user investments
async function loadUserInvestments() {
    try {
        console.log('📥 Loading user investments...');
        
        if (!db || !db.currentUser || !db.currentUser.id) {
            return;
        }
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            investments = userData.investments || [];
            
            console.log(`✅ Loaded ${investments.length} investments`);
            
            // Initialize profit calculations
            initializeProfitCalculations();
            
            // Update displays
            updateInvestmentsDisplay();
            updateProfitBreakdown();
            
            // Start real-time listener
            startInvestmentFirebaseListener();
        }
        
    } catch (error) {
        console.error('❌ Error loading investments:', error);
    }
}

// Initialize profit calculations
function initializeProfitCalculations() {
    // Clear existing intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    // Start profit calculations for active investments
    investments.forEach(investment => {
        if (!investment.completed && investment.id) {
            startProfitCalculation(investment.id);
        }
    });
}

// Save all investments to Firebase
async function saveAllInvestmentsToFirebase() {
    try {
        if (!db || !db.currentUser || !db.currentUser.id) {
            return false;
        }
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        await userRef.update({
            investments: investments,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`💾 Saved ${investments.length} investments to Firebase`);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving investments:', error);
        return false;
    }
}

// SIMPLIFIED Firebase save function
async function saveInvestmentToFirebaseSimple(investment, newBalance) {
    try {
        console.log('💾 Saving to Firebase (simple)...');
        
        if (!db || !db.currentUser || !db.currentUser.id) {
            throw new Error('User not logged in');
        }
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        // Get current user data
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }
        
        const userData = userDoc.data();
        const currentInvestments = userData.investments || [];
        
        // Add new investment
        currentInvestments.push(investment);
        
        // Update document
        await userRef.update({
            balance: newBalance,
            investments: currentInvestments,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Saved to Firebase successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
        throw error;
    }
}

// Restore balance in Firebase
async function restoreBalanceInFirebase(originalBalance) {
    try {
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        await userRef.update({
            balance: originalBalance,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error restoring balance:', error);
        return false;
    }
}

// Save single investment to Firebase
async function saveInvestmentToFirebase(investment) {
    try {
        if (!db.currentUser || !db.currentUser.id) {
            throw new Error('No user logged in');
        }
        
        // First save balance
        await saveUserBalanceToFirebase(db.currentUser.id, db.currentUser.balance);
        
        // Then save investments
        await saveAllInvestmentsToFirebase();
        
        console.log('✅ Investment saved to Firebase');
        return true;
        
    } catch (error) {
        console.error('❌ Error saving investment:', error);
        throw error;
    }
}

// Save user balance to Firebase
async function saveUserBalanceToFirebase(userId, balance) {
    try {
        const userRef = db.db.collection('users').doc(userId.toString());
        
        await userRef.update({
            balance: balance,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`💰 Balance saved to Firebase: ${balance}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving balance:', error);
        return false;
    }
}

// Start Firebase real-time listener
function startInvestmentFirebaseListener() {
    if (!db || !db.currentUser || !db.currentUser.id) {
        return;
    }
    
    // Clean up previous listener
    if (investmentFirebaseUnsubscribe) {
        investmentFirebaseUnsubscribe();
    }
    
    const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
    
    investmentFirebaseUnsubscribe = userRef.onSnapshot((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Check if investments changed
            const newInvestments = userData.investments || [];
            if (JSON.stringify(investments) !== JSON.stringify(newInvestments)) {
                console.log('🔄 Investments updated from Firebase');
                investments = newInvestments;
                
                // Update displays
                updateInvestmentsDisplay();
                updateProfitBreakdown();
                
                // Reinitialize profit calculations
                initializeProfitCalculations();
            }
            
            // Check if balance changed
            if (db.currentUser.balance !== userData.balance) {
                console.log('💰 Balance updated from Firebase:', userData.balance);
                db.currentUser.balance = userData.balance;
                updateAllBalanceDisplays();
            }
        }
    }, (error) => {
        console.error('❌ Firebase listener error:', error);
    });
}

// ========== UTILITY FUNCTIONS ==========

// Compare investment IDs
function compareInvestmentIds(id1, id2) {
    return String(id1) === String(id2);
}

// Update all balance displays
function updateAllBalanceDisplays() {
    if (!db.currentUser) return;
    
    const balance = db.currentUser.balance;
    const formattedBalance = `TZS ${Math.round(balance).toLocaleString()}`;
    
    // Update all balance elements
    const balanceElements = [
        'dashboard-balance',
        'profile-balance',
        'profile-balance-display',
        'withdraw-balance',
        'modal-balance'
    ];
    
    balanceElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formattedBalance;
        }
    });
    
    // Also update modal balance if modal is open
    if (investmentModal && investmentModal.style.display === 'flex' && modalBalance) {
        modalBalance.textContent = formattedBalance;
    }
}

// Reset investment lock
function resetInvestmentLock() {
    isCreatingInvestment = false;
    if (startInvestmentBtn) {
        startInvestmentBtn.disabled = false;
        startInvestmentBtn.textContent = 'Anza Kuwekeza';
    }
}

// Show notification
function showNotification(message, isError = false) {
    console.log(`📢 ${message}`);
    
    // Create or update notification element
    let notification = document.getElementById('investment-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'investment-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            max-width: 350px;
            display: none;
        `;
        document.body.appendChild(notification);
    }
    
    // Update notification
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
    notification.style.display = 'block';
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

// Update profit breakdown
function updateProfitBreakdown() {
    const container = document.getElementById('profit-breakdown');
    if (!container) return;
    
    let totalInvested = 0;
    let totalCurrentProfit = 0;
    let totalExpectedProfit = 0;
    let totalCompletedProfit = 0;
    
    investments.forEach(investment => {
        totalInvested += investment.cost;
        
        if (investment.completed) {
            totalCompletedProfit += investment.finalProfit || 0;
        } else {
            totalCurrentProfit += calculateCurrentProfit(investment);
            totalExpectedProfit += investment.totalExpectedProfit || 0;
        }
    });
    
    const totalProfit = totalCurrentProfit + totalCompletedProfit;
    const overallPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    
    container.innerHTML = `
        <div class="profit-summary">
            <div class="profit-card">
                <div class="profit-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="profit-info">
                    <div class="profit-label">Jumla ya Uwekezaji</div>
                    <div class="profit-amount">TZS ${Math.round(totalInvested).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="profit-card">
                <div class="profit-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="profit-info">
                    <div class="profit-label">Faida ya Sasa</div>
                    <div class="profit-amount current">TZS ${Math.round(totalCurrentProfit).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="profit-card">
                <div class="profit-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <div class="profit-info">
                    <div class="profit-label">Faida Inayotarajiwa</div>
                    <div class="profit-amount expected">TZS ${Math.round(totalExpectedProfit).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="profit-card">
                <div class="profit-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="profit-info">
                    <div class="profit-label">Asilimia ya Mafanikio</div>
                    <div class="profit-amount percentage">${overallPercentage.toFixed(2)}%</div>
                </div>
            </div>
        </div>
    `;
}

// Update investment history
function updateInvestmentHistory() {
    const container = document.getElementById('investment-history');
    if (!container) return;
    
    if (investments.length === 0) {
        container.innerHTML = '<p class="no-history">Hakuna historia ya uwekezaji.</p>';
        return;
    }
    
    const sortedInvestments = [...investments].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
    );
    
    container.innerHTML = sortedInvestments.map(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const profit = investment.completed ? 
            (investment.finalProfit || 0) : 
            calculateCurrentProfit(investment);
        
        return `
            <div class="history-item ${investment.completed ? 'completed' : 'active'}">
                <div class="history-header">
                    <div class="history-mineral">
                        <i class="fas fa-gem"></i>
                        <span>${investment.mineral}</span>
                    </div>
                    <div class="history-status ${investment.completed ? 'status-completed' : 'status-active'}">
                        ${investment.completed ? 'IMEMALIZIKA' : 'INAENDELEA'}
                    </div>
                </div>
                
                <div class="history-details">
                    <div class="history-row">
                        <span>Kiasi:</span>
                        <span>${investment.grams}g (TZS ${Math.round(investment.cost).toLocaleString()})</span>
                    </div>
                    
                    <div class="history-row">
                        <span>Muda:</span>
                        <span>${investment.days} siku</span>
                    </div>
                    
                    <div class="history-row">
                        <span>${investment.completed ? 'Faida ya Mwisho' : 'Faida ya Sasa'}:</span>
                        <span class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                            TZS ${Math.round(profit).toLocaleString()}
                        </span>
                    </div>
                    
                    <div class="history-row">
                        <span>Tarehe ya Kuanza:</span>
                        <span>${startDate.toLocaleDateString()}</span>
                    </div>
                    
                    ${investment.completed ? `
                    <div class="history-row">
                        <span>Tarehe ya Kukamilika:</span>
                        <span>${new Date(investment.completionDate).toLocaleDateString()}</span>
                    </div>
                    ` : `
                    <div class="history-row">
                        <span>Tarehe ya Kumaliza:</span>
                        <span>${endDate.toLocaleDateString()}</span>
                    </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// ========== CLEANUP ==========

// Cleanup investment system
function cleanupInvestmentSystem() {
    console.log('🧹 Cleaning up investment system...');
    
    // Clear intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    // Clear investments
    investments = [];
    
    // Stop Firebase listener
    if (investmentFirebaseUnsubscribe) {
        investmentFirebaseUnsubscribe();
        investmentFirebaseUnsubscribe = null;
    }
    
    // Reset flags
    isInvestmentSystemInitialized = false;
    isInvestmentButtonListenerSet = false;
    isCreatingInvestment = false;
    
    console.log('✅ Investment system cleaned up');
}

// ========== EXPORT FUNCTIONS ==========

// Export functions to global scope
window.initializeInvestmentSystem = initializeInvestmentSystem;
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.startInvestment = startInvestment;
window.calculateInvestmentReturn = calculateInvestmentReturn;
window.deleteInvestment = deleteInvestment;
window.viewInvestmentDetails = viewInvestmentDetails;
window.loadUserInvestments = loadUserInvestments;
window.updateInvestmentsDisplay = updateInvestmentsDisplay;
window.cleanupInvestmentSystem = cleanupInvestmentSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📈 Initializing Complete Investment System...');
    
    // Wait for Firebase to be ready
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            initializeInvestmentSystem();
        } else {
            console.log('⏳ Waiting for Firebase initialization...');
            setTimeout(initializeInvestmentSystem, 1000);
        }
    }, 500);
    
    // Also initialize when user logs in
    const originalShowUserDashboard = window.showUserDashboard;
    if (originalShowUserDashboard) {
        window.showUserDashboard = function() {
            originalShowUserDashboard.apply(this, arguments);
            setTimeout(initializeInvestmentSystem, 1000);
        };
    }
});

console.log('✅ Complete Investment System Loaded');

// Profile Tab Switch Functionality
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId + '-section');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Initialize tab functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all dashboard tabs
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target tab from onclick attribute
            const onclickContent = this.getAttribute('onclick');
            const match = onclickContent.match(/switchTab\('([^']+)'\)/);
            
            if (match && match[1]) {
                switchTab(match[1]);
            }
        });
    });
});

// Simplified and fixed tab switching function
function setupAboutUsTabs() {
    const aboutTabs = document.querySelectorAll('.about-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    aboutTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            aboutTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });
            
            // Show the corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            const targetPane = document.getElementById(`${tabId}-tab`);
            
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
                
                // Trigger animations for new content
                setTimeout(() => {
                    animateCommitmentItems();
                }, 100);
            }
        });
    });
    
    // Initialize first tab
    const firstTab = document.querySelector('.about-tab.active');
    if (firstTab) {
        const firstTabId = firstTab.getAttribute('data-tab');
        const firstPane = document.getElementById(`${firstTabId}-tab`);
        if (firstPane) {
            firstPane.classList.add('active');
            firstPane.style.display = 'block';
        }
    }
}

// Animation for commitment items
function animateCommitmentItems() {
    const commitmentItems = document.querySelectorAll('.commitment-item');
    const commitmentCards = document.querySelectorAll('.commitment-card');
    
    commitmentItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 200);
    });
    
    commitmentCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, (commitmentItems.length * 200) + (index * 200));
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAboutUsTabs();
    animateCommitmentItems();
});

// Also add this to handle tab switching from navigation
// Unified section switching function
function switchToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Ensure hidden with inline style
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Ensure visible with inline style
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll to top of section with smooth behavior
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Handle special section logic
        if (sectionId === 'about') {
            // Reset to overview tab when entering About section
            const overviewTab = document.querySelector('.about-tab[data-tab="overview"]');
            if (overviewTab) {
                overviewTab.click();
            }
            
            // Check if commitment tab is active and trigger animations
            setTimeout(() => {
                const activeTab = document.querySelector('.about-tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'commitment') {
                    animateCommitmentItems();
                }
            }, 300);
        }
    }
}

// Initialize counter animations for About Us stats
function triggerCounterAnimations() {
    const counters = document.querySelectorAll('.counter-animation');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                if (current > target) current = target;
                
                counter.querySelector('.stat-number').textContent = 
                    target >= 1000 ? Math.floor(current).toLocaleString() : current.toFixed(1);
                
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    });
}

// Minerals carousel functionality
function setupMineralsCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.mineral-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function updateCarousel() {
        // Move track
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }
    
    // Previous button click
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }
    
    // Dot click
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-rotate every 5 seconds
    let autoRotate = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);
    
    // Pause on hover
    const carouselContainer = document.querySelector('.minerals-carousel');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(autoRotate);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            autoRotate = setInterval(() => {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel();
            }, 5000);
        });
    }
}

function resetMineralsCarousel() {
    const track = document.querySelector('.carousel-track');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    if (track) {
        track.style.transform = 'translateX(0%)';
        dots.forEach((dot, index) => {
            if (index === 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Contact action functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showLocation() {
    const location = "Dar es Salaam, Tanzania";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Counter animation function
function triggerCounterAnimations() {
    const counters = document.querySelectorAll('.counter-animation');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const numberElement = counter.querySelector('.stat-number');
        const currentText = numberElement.textContent;
        
        // Reset to 0 if needed
        if (currentText === '0' || currentText === '0%') {
            numberElement.textContent = target >= 1000 ? '0' : target % 1 !== 0 ? '0.0' : '0';
        }
        
        let current = 0;
        const increment = target / 50; // Adjust speed (50 steps)
        const duration = 1500; // 1.5 seconds
        const stepTime = duration / 50;
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // Format the number based on the target
            if (target >= 1000) {
                // For large numbers like 54678289
                numberElement.textContent = Math.floor(current).toLocaleString();
            } else if (target % 1 !== 0) {
                // For decimal numbers like 65.5
                numberElement.textContent = current.toFixed(1);
            } else if (counter.querySelector('.stat-number').textContent.includes('%')) {
                // For percentage like 98%
                numberElement.textContent = Math.floor(current) + '%';
            } else {
                // For whole numbers like 4
                numberElement.textContent = Math.floor(current);
            }
        }, stepTime);
    });
}

// Update your tab switching function to trigger animations
function setupAboutUsTabs() {
    const aboutTabs = document.querySelectorAll('.about-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    aboutTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            aboutTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });
            
            // Show the corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            const targetPane = document.getElementById(`${tabId}-tab`);
            
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
                
                // Trigger counter animations when overview tab is clicked
                if (tabId === 'overview') {
                    setTimeout(triggerCounterAnimations, 100);
                }
                
                // Trigger other animations
                setTimeout(() => {
                    animateCommitmentItems();
                }, 100);
            }
        });
    });
    
    // Initialize first tab (overview)
    const firstTab = document.querySelector('.about-tab.active');
    if (firstTab) {
        const firstTabId = firstTab.getAttribute('data-tab');
        const firstPane = document.getElementById(`${firstTabId}-tab`);
        if (firstPane) {
            firstPane.classList.add('active');
            firstPane.style.display = 'block';
            
            // Trigger counter animations on initial load if overview is active
            if (firstTabId === 'overview') {
                setTimeout(triggerCounterAnimations, 500);
            }
        }
    }
}

// Also update the switchToSection function
function switchToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // If switching to About Us, trigger overview animations
        if (sectionId === 'about') {
            setTimeout(() => {
                // Reset to overview tab
                const overviewTab = document.querySelector('.about-tab[data-tab="overview"]');
                if (overviewTab && !overviewTab.classList.contains('active')) {
                    overviewTab.click();
                } else if (overviewTab && overviewTab.classList.contains('active')) {
                    // If already on overview, trigger animations
                    triggerCounterAnimations();
                }
            }, 300);
        }
    }
}

// Add Intersection Observer for counter animations when scrolling
function setupIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% of element is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                if (counter.classList.contains('counter-animation')) {
                    triggerCounterAnimations();
                    observer.unobserve(counter); // Only trigger once
                }
            }
        });
    }, observerOptions);
    
    // Observe all counter elements
    document.querySelectorAll('.counter-animation').forEach(counter => {
        observer.observe(counter);
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAboutUsTabs();
    setupIntersectionObserver();
    
    // Also trigger animations if overview is visible on load
    if (document.querySelector('#about.content-section.active')) {
        setTimeout(triggerCounterAnimations, 1000);
    }
});

// FAQ Functionality
function initializeFAQ() {
    console.log('Initializing FAQ functionality...');
    
    // Get all FAQ elements
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faq-search');
    
    // Check if elements exist
    if (faqCategories.length === 0 || faqItems.length === 0) {
        console.warn('FAQ elements not found. Retrying in 500ms...');
        setTimeout(initializeFAQ, 500);
        return;
    }
    
    console.log(`Found ${faqCategories.length} categories and ${faqItems.length} FAQ items`);
    
    // Category Filtering
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            // Remove active class from all categories
            faqCategories.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            this.classList.add('active');
            
            // Get category filter
            const filter = this.getAttribute('data-category');
            
            // Filter FAQ items
            faqItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filter === 'all' || filter === itemCategory) {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.classList.add('hidden');
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Search Functionality
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.classList.add('hidden');
                        item.style.display = 'none';
                    }, 300);
                }
            });
            
            // Reset category filter when searching
            if (searchTerm !== '') {
                faqCategories.forEach(cat => {
                    if (cat.classList.contains('active') && cat.getAttribute('data-category') !== 'all') {
                        cat.classList.remove('active');
                    }
                });
                
                const allCategory = document.querySelector('.faq-category[data-category="all"]');
                if (allCategory && !allCategory.classList.contains('active')) {
                    allCategory.classList.add('active');
                }
            }
        });
    }
    
    // Accordion Functionality
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', function() {
            // Toggle active class
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            }
        });
        
        // Initialize all as closed
        answer.style.maxHeight = null;
    });
    
    // Initialize first category as active
    const firstCategory = document.querySelector('.faq-category.active');
    if (firstCategory) {
        firstCategory.click();
    }
    
    console.log('FAQ functionality initialized successfully');
}

// Update your switchToSection function to include FAQ initialization
function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // Update active bottom bar item
        document.querySelectorAll('.bottom-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Initialize FAQ when section is shown
        if (sectionId === 'faq') {
            setTimeout(initializeFAQ, 100);
            
            // Reset search and show all items
            const faqSearch = document.getElementById('faq-search');
            if (faqSearch) {
                faqSearch.value = '';
            }
            
            // Show all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('hidden');
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
            
            // Reset to "All Questions"
            const allCategory = document.querySelector('.faq-category[data-category="all"]');
            if (allCategory) {
                allCategory.click();
            }
        }
    }
}

// Initialize FAQ when page loads if FAQ is active
document.addEventListener('DOMContentLoaded', function() {
    // Check if FAQ section is active on load
    const faqSection = document.getElementById('faq');
    if (faqSection && faqSection.classList.contains('active')) {
        setTimeout(initializeFAQ, 500);
    }
    
    // Set up FAQ navigation links
    document.querySelectorAll('.nav-link[data-target="faq"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSection('faq');
        });
    });
    
    // Set up bottom bar FAQ link
    document.querySelectorAll('.bottom-item[data-target="faq"]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSection('faq');
        });
    });
});

// FAQ Functionality
function initializeFAQ() {
    console.log('Initializing FAQ functionality...');
    
    // Get all FAQ elements
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faq-search');
    
    // Check if elements exist
    if (faqCategories.length === 0) {
        console.warn('No FAQ categories found');
        return;
    }
    
    console.log(`Found ${faqCategories.length} categories and ${faqItems.length} FAQ items`);
    
    // Initialize all FAQ answers as collapsed
    faqItems.forEach(item => {
        const answer = item.querySelector('.faq-answer');
        if (answer) {
            answer.style.maxHeight = null;
        }
    });
    
    // Category Filtering
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            console.log('Category clicked:', this.textContent);
            
            // Remove active class from all categories
            faqCategories.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            this.classList.add('active');
            
            // Get category filter
            const filter = this.getAttribute('data-category');
            console.log('Filtering by:', filter);
            
            // Show/hide FAQ items based on category
            faqItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filter === 'all' || filter === itemCategory) {
                    item.style.display = 'block';
                    // Force reflow for animation
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Search Functionality
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            console.log('Searching for:', searchTerm);
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
                const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
                
                if (searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
            
            // Reset to "All Questions" when searching
            if (searchTerm !== '') {
                const allCategory = document.querySelector('.faq-category[data-category="all"]');
                if (allCategory && !allCategory.classList.contains('active')) {
                    faqCategories.forEach(cat => cat.classList.remove('active'));
                    allCategory.classList.add('active');
                }
            }
        });
    }
    
    // Accordion Functionality
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        
        if (!question || !answer) {
            console.warn('FAQ item missing question or answer:', item);
            return;
        }
        
        question.addEventListener('click', function() {
            console.log('FAQ question clicked');
            
            // Check if this item is already active
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherIcon = otherItem.querySelector('.faq-question i');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                    if (otherIcon) {
                        otherIcon.classList.remove('fa-chevron-up');
                        otherIcon.classList.add('fa-chevron-down');
                    }
                }
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            } else {
                item.classList.remove('active');
                answer.style.maxHeight = null;
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            }
        });
        
        // Set initial icon state
        if (icon) {
            icon.classList.add('fa-chevron-down');
        }
    });
    
    // Initialize first category as active
    const activeCategory = document.querySelector('.faq-category.active');
    if (activeCategory) {
        // Trigger click to filter items
        activeCategory.click();
    } else {
        // If no active category, activate "All Questions"
        const allCategory = document.querySelector('.faq-category[data-category="all"]');
        if (allCategory) {
            allCategory.classList.add('active');
            allCategory.click();
        }
    }
    
    console.log('FAQ functionality initialized successfully');
}

// Update the switchToSection function
function switchToSection(sectionId) {
    console.log('Switching to section:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Scroll to top of section
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // Initialize FAQ when section is shown
        if (sectionId === 'faq') {
            console.log('FAQ section activated, initializing...');
            setTimeout(() => {
                initializeFAQ();
            }, 100);
        }
    } else {
        console.error('Section not found:', sectionId);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Set up navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('Nav link clicked:', target);
            switchToSection(target);
        });
    });
    
    // Set up bottom bar links
    const bottomItems = document.querySelectorAll('.bottom-item');
    bottomItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('Bottom item clicked:', target);
            switchToSection(target);
        });
    });
    
    // Check if FAQ is active on page load
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'faq') {
        console.log('FAQ is active on load');
        setTimeout(initializeFAQ, 500);
    }
});

// Add this function to force FAQ display (for debugging)
function forceShowFAQ() {
    const faqSection = document.getElementById('faq');
    if (faqSection) {
        switchToSection('faq');
    }
}

// Landing Page Animated Counters
function animateLandingCounters() {
    console.log('Starting landing page counter animations...');
    
    const counters = [
        {
            element: document.getElementById('active-users'),
            target: 54678289,
            suffix: '',
            duration: 3000
        },
        {
            element: document.getElementById('total-invested'),
            target: 65.5,
            suffix: '',
            duration: 2500,
            isDecimal: true
        },
        {
            element: document.getElementById('minerals'),
            target: 4,
            suffix: '',
            duration: 1500
        },
        {
            element: document.getElementById('satisfaction-rate'),
            target: 98,
            suffix: '%',
            duration: 2000
        }
    ];
    
    // Check if all elements exist
    const missingElements = counters.filter(counter => !counter.element);
    if (missingElements.length > 0) {
        console.warn('Some counter elements not found:', missingElements);
        return;
    }
    
    counters.forEach(counter => {
        const { element, target, suffix, duration, isDecimal } = counter;
        let current = 0;
        const increment = target / (duration / 16); // 60fps
        const isPercentage = suffix === '%';
        
        // Reset to 0
        if (isDecimal) {
            element.textContent = '0.0' + suffix;
        } else if (isPercentage) {
            element.textContent = '0' + suffix;
        } else if (target >= 1000) {
            element.textContent = '0';
        } else {
            element.textContent = '0' + suffix;
        }
        
        const updateCounter = () => {
            current += increment;
            
            // If we've reached or passed the target
            if (current >= target) {
                current = target;
                
                // Format final number
                if (target >= 1000) {
                    element.textContent = target.toLocaleString() + suffix;
                } else if (isDecimal) {
                    element.textContent = target.toFixed(1) + suffix;
                } else if (isPercentage) {
                    element.textContent = target + suffix;
                } else {
                    element.textContent = target + suffix;
                }
                
                // Add animation class when complete
                element.classList.add('counter-complete');
                return;
            }
            
            // Update current value
            if (target >= 1000) {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            } else if (isDecimal) {
                element.textContent = current.toFixed(1) + suffix;
            } else if (isPercentage) {
                element.textContent = Math.floor(current) + suffix;
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
            
            requestAnimationFrame(updateCounter);
        };
        
        // Start animation with a slight delay
        setTimeout(updateCounter, 100);
    });
    
    console.log('Landing page counters animation started');
}

// Intersection Observer for landing page counters
function setupLandingPageObserver() {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) {
        console.log('Stats grid not found, retrying...');
        setTimeout(setupLandingPageObserver, 500);
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('Stats grid is visible, starting animations...');
                animateLandingCounters();
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3, // Trigger when 30% of element is visible
        rootMargin: '50px' // Start animation a bit earlier
    });
    
    observer.observe(statsGrid);
    console.log('Landing page observer set up');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up landing page counters...');
    
    // Setup intersection observer
    setTimeout(setupLandingPageObserver, 1000);
    
    // Also trigger on window load for good measure
    window.addEventListener('load', function() {
        console.log('Window loaded, checking for visible stats...');
        setTimeout(setupLandingPageObserver, 500);
    });
});

// Add a manual trigger function for testing
function testLandingCounters() {
    console.log('Manually testing landing counters...');
    animateLandingCounters();
}

// Update the openSupportOption function to handle chat - NO FIREBASE CHANGES NEEDED
function openSupportOption(option) {
    switch (option) {
        case 'whatsapp':
            window.open('https://wa.me/255768616961', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255768616961';
            break;
        case 'chat':
            if (window.chatSystem) {
                window.chatSystem.openUserChatModal();
            }
            break;
    }
}

// ===== ADMIN APPROVAL FUNCTIONS =====

// Updated loadPendingTransactions for your template
async function loadPendingTransactions() {
    try {
        console.log('🔄 Loading pending transactions for admin...');
        
        // Check if admin is logged in
        if (!db.currentUser || !db.currentUser.is_admin) {
            console.error('❌ User is not an admin');
            return;
        }
        
        // Find elements specific to your template
        const pendingTableBody = document.getElementById('pending-transactions-body');
        const adminApprovalsSection = document.getElementById('admin-approvals');
        
        if (!pendingTableBody) {
            console.error('❌ Pending transactions table body not found. Looking for: #pending-transactions-body');
            
            // Try to find the section first
            if (adminApprovalsSection) {
                console.log('✅ Found admin approvals section');
                
                // Check if table exists within section
                const tables = adminApprovalsSection.querySelectorAll('table');
                console.log(`Found ${tables.length} tables in admin approvals section`);
                
                tables.forEach((table, index) => {
                    const tbody = table.querySelector('tbody');
                    console.log(`Table ${index + 1}:`, {
                        id: table.id,
                        className: table.className,
                        hasTbody: !!tbody,
                        tbodyId: tbody ? tbody.id : 'no id'
                    });
                });
            }
            
            return;
        }
        
        console.log('✅ Found pending transactions table body');
        
        // Show loading state
        pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Inapakua miradi...</td></tr>';
        
        // Get pending transactions from Firebase
        const pendingTransactions = await db.getPendingTransactions();
        console.log('📋 Pending transactions received:', pendingTransactions.length);
        
        // Clear table
        pendingTableBody.innerHTML = '';
        
        if (pendingTransactions.length === 0) {
            pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Hakuna miradi inayosubiri idhini.</td></tr>';
            console.log('📭 No pending transactions found');
            return;
        }
        
        // Populate table with transactions
        pendingTransactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            
            // Format amount
            const formattedAmount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${transaction.amount.toLocaleString()}`;
            
            // Format date
            let formattedDate = 'N/A';
            try {
                const date = new Date(transaction.date);
                formattedDate = date.toLocaleDateString();
            } catch (e) {
                formattedDate = transaction.date || 'N/A';
            }
            
            // Get transaction details based on type
            let details = '';
            let transactionType = '';
            
            if (transaction.type === 'deposit') {
                transactionType = 'Wekezo';
                details = `
                    <strong>Wekezo kwa ${transaction.method || 'N/A'}</strong><br>
                    Mtumaji: ${transaction.details?.senderName || 'N/A'}<br>
                    Akaunti: ${transaction.details?.senderAccount || 'N/A'}<br>
                    Msimbo: ${transaction.details?.transactionCode || 'N/A'}
                `;
            } else if (transaction.type === 'withdrawal') {
                transactionType = 'Utoaji';
                details = `
                    <strong>Utoaji kwa ${transaction.method || 'N/A'}</strong><br>
                    Akaunti: ${transaction.details?.accountNumber || 'N/A'}<br>
                    Jina: ${transaction.details?.accountName || 'N/A'}<br>
                    Sababu: ${transaction.details?.reason || 'N/A'}
                `;
            } else {
                transactionType = transaction.type || 'N/A';
                details = JSON.stringify(transaction.details || {});
            }
            
            // Create action buttons with Swahili text
            row.innerHTML = `
                <td>
                    <strong>${transaction.username}</strong><br>
                    <small>${transaction.email}</small>
                </td>
                <td>
                    <span class="badge ${transaction.type === 'deposit' ? 'deposit-badge' : 'withdrawal-badge'}">
                        ${transactionType}
                    </span>
                </td>
                <td><strong>${formattedAmount}</strong></td>
                <td>${formattedDate}</td>
                <td class="transaction-details">${details}</td>
                <td class="action-buttons">
                    <button class="btn-approve" onclick="approveTransaction(${transaction.id})" title="Idhinisha">
                        <i class="fas fa-check"></i> Idhinisha
                    </button>
                    <button class="btn-reject" onclick="rejectTransaction(${transaction.id})" title="Kataa">
                        <i class="fas fa-times"></i> Kataa
                    </button>
                </td>
            `;
            
            pendingTableBody.appendChild(row);
        });
        
        console.log('✅ Pending transactions loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading pending transactions:', error);
        
        // Show error in table
        const pendingTableBody = document.getElementById('pending-transactions-body');
        if (pendingTableBody) {
            pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">Hitilafu ilitokea wakati wa kupakia miradi. Tafadhali jaribu tena.</td></tr>';
        }
    }
}

// Update approveTransaction for Swahili messages
async function approveTransaction(transactionId) {
    if (!confirm('Una hakika unataka kuidhinisha muamala huu?')) {
        return;
    }
    
    try {
        console.log(`✅ Inaidhinisha muamala ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'approved', adminId);
        
        if (success) {
            alert('✅ Muamala umeidhinishwa kikamilifu!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats if function exists
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Imeshindwa kuidhinisha muamala. Tafadhali jaribu tena.');
        }
    } catch (error) {
        console.error('❌ Hitilafu ya kuidhinisha muamala:', error);
        alert('❌ Hitilafu: ' + (error.message || 'Imeshindwa kuidhinisha muamala'));
    }
}

// Update rejectTransaction for Swahili messages
async function rejectTransaction(transactionId) {
    const reason = prompt('Tafadhali andika sababu ya kukataa:');
    if (!reason || reason.trim() === '') {
        alert('Tafadhali toa sababu ya kukataa');
        return;
    }
    
    if (!confirm('Una hakika unataka kukataa muamala huu?')) {
        return;
    }
    
    try {
        console.log(`❌ Inakataa muamala ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'rejected', adminId);
        
        if (success) {
            alert('✅ Muamala umekataliwa kikamilifu!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats if function exists
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Imeshindwa kukataa muamala. Tafadhali jaribu tena.');
        }
    } catch (error) {
        console.error('❌ Hitilafu ya kukataa muamala:', error);
        alert('❌ Hitilafu: ' + (error.message || 'Imeshindwa kukataa muamala'));
    }
}

// Update showAdminDashboard to ensure admin-approvals section is visible
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Inaanzisha dashibodi ya admin...');
        
        // First, show the admin-approvals section
        showSection('admin-approvals');
        
        // Load pending transactions
        if (typeof loadPendingTransactions === 'function') {
            loadPendingTransactions();
        }
        
        // Load admin stats if function exists
        if (typeof loadAdminStats === 'function') {
            loadAdminStats();
        }
        
        console.log('✅ Dashibodi ya admin imeanzishwa');
    }, 100);
}

// Helper function to show specific section
function showSection(sectionId) {
    // Hide all content sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        console.log(`✅ Showing section: ${sectionId}`);
    } else {
        console.error(`❌ Section not found: ${sectionId}`);
    }
}

// Add CSS styles for your template
function addAdminApprovalsStyles() {
    if (!document.getElementById('admin-approvals-styles')) {
        const styles = `
        <style id="admin-approvals-styles">
        /* Admin approvals table styles */
        .transaction-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .transaction-table th {
            background: #2c3e50;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .transaction-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        
        .transaction-table tr:hover {
            background: #f8f9fa;
        }
        
        .transaction-table .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        
        .deposit-badge {
            background: #27ae60;
            color: white;
        }
        
        .withdrawal-badge {
            background: #e74c3c;
            color: white;
        }
        
        .transaction-details {
            max-width: 250px;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn-approve, .btn-reject {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-approve {
            background: #27ae60;
            color: white;
        }
        
        .btn-reject {
            background: #e74c3c;
            color: white;
        }
        
        .btn-approve:hover {
            background: #219653;
            transform: translateY(-2px);
        }
        
        .btn-reject:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }
        
        .btn-approve:active, .btn-reject:active {
            transform: translateY(0);
        }
        
        .admin-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 24px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .pending-transactions h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Added admin approvals styles');
    }
}

// Call this when admin dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    // Add styles when page loads
    addAdminApprovalsStyles();
});

// Approve transaction
async function approveTransaction(transactionId) {
    if (!confirm('Are you sure you want to APPROVE this transaction?')) {
        return;
    }
    
    try {
        console.log(`✅ Approving transaction ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'approved', adminId);
        
        if (success) {
            alert('✅ Transaction approved successfully!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
            
            // Update user balances display
            if (typeof updateAllBalanceDisplays === 'function') {
                updateAllBalanceDisplays();
            }
        } else {
            alert('❌ Failed to approve transaction. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error approving transaction:', error);
        alert('❌ Error: ' + (error.message || 'Failed to approve transaction'));
    }
}

// Reject transaction
async function rejectTransaction(transactionId) {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason || reason.trim() === '') {
        alert('Please provide a reason for rejection');
        return;
    }
    
    if (!confirm('Are you sure you want to REJECT this transaction?')) {
        return;
    }
    
    try {
        console.log(`❌ Rejecting transaction ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'rejected', adminId);
        
        if (success) {
            alert('✅ Transaction rejected successfully!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Failed to reject transaction. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error rejecting transaction:', error);
        alert('❌ Error: ' + (error.message || 'Failed to reject transaction'));
    }
}

// Add this to your slideshow JavaScript
function initSlideshowTouchSupport() {
    const slideshowTrack = document.querySelector('.slideshow-track');
    if (!slideshowTrack) return;
    
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    slideshowTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
    });
    
    slideshowTrack.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        
        // Prevent vertical scrolling when swiping horizontally
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    });
    
    slideshowTrack.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        
        const diff = startX - currentX;
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
        
        isSwiping = false;
    });
    
    // Your existing nextSlide and prevSlide functions
    function nextSlide() {
        // Your next slide logic
    }
    
    function prevSlide() {
        // Your previous slide logic
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initSlideshowTouchSupport);

// Enhanced Load transaction history for user - REMOVED SUMMARY, ADDED AUTO-SHOW
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        console.error('Transaction history body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Sasisha</td></tr>';
        return;
    }
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                    <p style="color: #95a5a6;">Tafadhali subiri kidogo</p>
                </td>
            </tr>
        `;
        
        // Get transactions asynchronously
        const transactions = await db.getUserTransactions(db.currentUser.id);
        
        if (!Array.isArray(transactions)) {
            console.error('getUserTransactions did not return an array:', transactions);
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ya mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (transactions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi</h4>
                        <p style="color: #95a5a6;">Haujaanza muamala wowote bado</p>
                        <button onclick="switchToSection('deposit')" style="margin-top: 15px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Anza Muamala wa Kwanza
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'transaction-row';
            
            // Format date with time
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount with better styling
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
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
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
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
                    <button class="btn-receipt" onclick="showReceiptModal(${transaction.id})" 
                            style="display: flex; align-items: center; gap: 5px; padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        📄 Risiti
                    </button>
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add filter and search functionality
        addTransactionFilters(transactions);
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                    <button onclick="loadTransactionHistory()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

// Enhanced Load admin transaction history - REMOVED SUMMARY, ADDED AUTO-SHOW
async function loadAdminTransactionHistory() {
    const historyBody = document.getElementById('admin-transactions-body');
    if (!historyBody) {
        console.error('Admin transactions body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                    <p style="color: #95a5a6;">Tafadhali subiri kidogo</p>
                </td>
            </tr>
        `;
        
        // Get all transactions asynchronously
        const transactions = await db.getAllTransactions();
        
        if (!Array.isArray(transactions)) {
            console.error('getAllTransactions did not return an array:', transactions);
            historyBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ya mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
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
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'admin-transaction-row';
            
            // Format date with time
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount with better styling
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
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
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kutoa</strong></div>
                    <div style="font-size: 11px; color: #666;">Kwa: ${accountName}</div>
                    <div style="font-size: 11px; color: #666;">Akaunti: ${accountNumber}</div>
                    <div style="font-size: 11px; color: #666;">Njia: ${method}</div>
                `;
            } else {
                transactionIcon = '💳';
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
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
                                transaction.type || 'Muamala'}</span>
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
                        <button class="btn-receipt" onclick="showReceiptModal(${transaction.id})" 
                                style="background: #3498db; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            📄 Risiti
                        </button>
                    </div>
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add filter and search functionality for admin
        addAdminTransactionFilters(transactions);
        
    } catch (error) {
        console.error('Error loading admin transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                    <button onclick="loadAdminTransactionHistory()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

// In your loadPendingTransactions function or wherever you display transactions
function displayTransactionWithBonusInfo(transaction) {
    return `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-user">${transaction.username}</div>
                <div class="transaction-amount">${transaction.type === 'deposit' ? '+' : '-'} TZS ${Math.round(transaction.amount).toLocaleString()}</div>
                <div class="transaction-type">${transaction.type.toUpperCase()}</div>
            </div>
            <div class="transaction-details">
                <div class="transaction-date">${new Date(transaction.date).toLocaleString()}</div>
                <div class="transaction-method">${transaction.method}</div>
                ${transaction.type === 'deposit' && transaction.details?.referred_by ? 
                    `<div class="referral-bonus-info">
                        <i class="fas fa-gift"></i> 
                        <span>Referred by: ${transaction.details.referred_by}</span>
                        <span class="bonus-amount">Bonus: TZS ${Math.round(transaction.amount * 0.10).toLocaleString()}</span>
                    </div>` : ''
                }
            </div>
            <div class="transaction-actions">
                <button class="btn-approve" onclick="approveTransaction(${transaction.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="rejectTransaction(${transaction.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `;
}


// Add filter functionality for user transactions
function addTransactionFilters(transactions) {
    const tableContainer = document.querySelector('#history .table-container');
    if (!tableContainer) return;
    
    // Remove existing filter if any
    const existingFilter = document.getElementById('transaction-filter');
    if (existingFilter) existingFilter.remove();
    
    const filterHtml = `
        <div id="transaction-filter" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Aina:</label>
                    <select id="filter-type" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Miradi Yote</option>
                        <option value="deposit">Kuwaweka</option>
                        <option value="withdrawal">Kutoa</option>
                        <option value="investment">Uwekezaji</option>
                        <option value="bonus">Ziada</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Hali:</label>
                    <select id="filter-status" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Hali Zote</option>
                        <option value="pending">Inasubiri</option>
                        <option value="approved">Imekubaliwa</option>
                        <option value="rejected">Imekataliwa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Tafuta:</label>
                    <input type="text" id="search-transactions" placeholder="Tafuta muamala..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 200px;">
                </div>
                <div style="align-self: flex-end;">
                    <button onclick="applyTransactionFilters()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Tafuta
                    </button>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                Jumla ya miradi: ${transactions.length}
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', filterHtml);
}

// Add filter functionality for admin transactions
function addAdminTransactionFilters(transactions) {
    const tableContainer = document.querySelector('#admin-history .table-container');
    if (!tableContainer) return;
    
    // Remove existing filter if any
    const existingFilter = document.getElementById('admin-transaction-filter');
    if (existingFilter) existingFilter.remove();
    
    const filterHtml = `
        <div id="admin-transaction-filter" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Aina:</label>
                    <select id="admin-filter-type" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Miradi Yote</option>
                        <option value="deposit">Kuwaweka</option>
                        <option value="withdrawal">Kutoa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Hali:</label>
                    <select id="admin-filter-status" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Hali Zote</option>
                        <option value="pending">Inasubiri</option>
                        <option value="approved">Imekubaliwa</option>
                        <option value="rejected">Imekataliwa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Tafuta Kwa Jina:</label>
                    <input type="text" id="admin-search-user" placeholder="Jina la mtumiaji..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 200px;">
                </div>
                <div style="align-self: flex-end;">
                    <button onclick="applyAdminTransactionFilters()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Tafuta
                    </button>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                Jumla ya miradi: ${transactions.length}
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', filterHtml);
}

// Also update the refresh functions:
async function refreshUserTransactions() {
    await loadTransactionHistory();
    // Removed summary display
}

async function refreshAdminTransactions() {
    await loadAdminTransactionHistory();
    // Removed summary display
}

// AUTO-SHOW TRANSACTIONS ON LOGIN - ADD THIS FUNCTION
function setupAutoShowTransactions() {
    console.log('Setting up auto-show transactions...');
    
    // Check if user is logged in
    if (!db.currentUser) return;
    
    // Auto-load transactions based on user type
    if (db.currentUser.is_admin || db.currentUser.is_super_admin) {
        // Admin - show both pending and history
        setTimeout(() => {
            loadPendingTransactions();
            loadAdminTransactionHistory();
        }, 1000);
    } else {
        // Regular user - show their transactions
        setTimeout(() => {
            loadTransactionHistory();
        }, 1000);
    }
    
    // Set up real-time updates
    setupTransactionRealTimeUpdates();
}

// Set up real-time Firebase listener for transactions
function setupTransactionRealTimeUpdates() {
    if (!db.currentUser || !db.db) return;
    
    console.log('Setting up real-time transaction updates...');
    
    // For regular users
    if (!db.currentUser.is_admin && !db.currentUser.is_super_admin) {
        // Listen for user's own transactions
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        userRef.onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.transactions) {
                    console.log('Real-time update: User transactions changed');
                    // Only reload if we're on the transaction history page
                    if (document.getElementById('history') && 
                        document.getElementById('history').classList.contains('active')) {
                        loadTransactionHistory();
                    }
                }
            }
        });
    }
    
    // For admins
    if (db.currentUser.is_admin || db.currentUser.is_super_admin) {
        // Admin can listen to all users (optional)
        // This is a simplified version - you might want to optimize this
        setInterval(() => {
            if (document.getElementById('admin-approvals') && 
                document.getElementById('admin-approvals').classList.contains('active')) {
                loadPendingTransactions();
            }
            if (document.getElementById('admin-history') && 
                document.getElementById('admin-history').classList.contains('active')) {
                loadAdminTransactionHistory();
            }
        }, 10000); // Check every 10 seconds
    }
}

// ENHANCED RECEIPT MODAL FUNCTIONS - ADD THESE
// Create receipt modal HTML
function createReceiptModal() {
    if (document.getElementById('receipt-modal')) return;
    
    const modalHTML = `
        <div id="receipt-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7);">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 0; width: 80%; max-width: 600px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #2c3e50;">📄 Risiti Ya Muamala</h2>
                    <button onclick="closeReceiptModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                    <div id="receipt-content"></div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; text-align: center;">
                    <button onclick="printReceipt()" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">
                        🖨️ Print Risiti
                    </button>
                    <button onclick="downloadReceipt()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">
                        💾 Pakua Risiti
                    </button>
                    <button onclick="closeReceiptModal()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        ✕ Funga
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add receipt CSS
    addReceiptCSS();
}

// Add receipt styling CSS
function addReceiptCSS() {
    if (document.getElementById('receipt-styles')) return;
    
    const styleHTML = `
        <style id="receipt-styles">
        /* Receipt Modal Styles */
        .receipt {
            font-family: 'Courier New', monospace;
            max-width: 100%;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px dashed #ccc;
        }
        
        .receipt-header h2 {
            color: #2c3e50;
            font-size: 20px;
            margin: 0 0 10px 0;
        }
        
        .receipt-header p {
            margin: 5px 0;
            color: #7f8c8d;
        }
        
        .receipt-details {
            margin-bottom: 20px;
        }
        
        .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #eee;
        }
        
        .receipt-row strong {
            color: #2c3e50;
        }
        
        .receipt-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #ccc;
        }
        
        .qr-code {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px auto;
            display: inline-block;
            border: 1px solid #ddd;
        }
        
        .instructions {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 14px;
        }
        
        .instructions h4 {
            margin-top: 0;
            color: #2c3e50;
        }
        
        .instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 5px;
        }
        
        /* Status Colors */
        .status-approved {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-pending {
            color: #f39c12;
            font-weight: bold;
        }
        
        .status-rejected {
            color: #e74c3c;
            font-weight: bold;
        }
        
        /* Print Styles */
        @media print {
            body * {
                visibility: hidden;
            }
            #receipt-modal, #receipt-modal * {
                visibility: visible;
            }
            #receipt-modal {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
            }
            .modal-footer {
                display: none !important;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styleHTML);
}

// Show receipt modal
async function showReceiptModal(transactionId) {
    console.log('Showing receipt for transaction:', transactionId);
    
    // Create modal if it doesn't exist
    createReceiptModal();
    
    // Show loading in modal
    document.getElementById('receipt-content').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
            <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia risiti...</h4>
        </div>
    `;
    
    // Show modal
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    try {
        // Get transaction details
        const users = await db.getUsers();
        let transaction = null;
        let user = null;
        
        // Find the transaction
        for (const u of users) {
            if (u.transactions && Array.isArray(u.transactions)) {
                const found = u.transactions.find(t => t.id === transactionId);
                if (found) {
                    transaction = found;
                    user = u;
                    break;
                }
            }
        }
        
        if (!transaction) {
            throw new Error('Muamala haupatikani');
        }
        
        // Format date and time
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        const formattedDate = transactionDate.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const formattedTime = transactionDate.toLocaleTimeString('sw-TZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determine status
        let statusText, statusClass, statusIcon;
        if (transaction.status === 'approved') {
            statusText = 'IMEFAULU';
            statusClass = 'status-approved';
            statusIcon = '✅';
        } else if (transaction.status === 'rejected') {
            statusText = 'IMEKATALIWA';
            statusClass = 'status-rejected';
            statusIcon = '❌';
        } else {
            statusText = 'INASUBIRI';
            statusClass = 'status-pending';
            statusIcon = '⏳';
        }
        
        // Build receipt HTML
        const receiptHTML = `
            <div class="receipt">
                <div class="receipt-header">
                    <h2>TANZANIA MINING INVESTMENT</h2>
                    <p><strong>Risiti Ya Muamala Rasmi</strong></p>
                    <p><em>Namba ya Risiti: #${transaction.id}</em></p>
                    <p><em>Tarehe ya Kutoa: ${new Date().toLocaleDateString('sw-TZ')}</em></p>
                </div>
                
                <div class="receipt-details">
                    <div class="receipt-row">
                        <span><strong>Tarehe ya Muamala:</strong></span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Muda wa Muamala:</strong></span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Jina la Mteja:</strong></span>
                        <span>${user.username || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Barua Pepe:</strong></span>
                        <span>${user.email || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Aina ya Muamala:</strong></span>
                        <span>${transaction.type === 'deposit' ? '📥 KUWAWEKA FEDHA' : 
                                 transaction.type === 'withdrawal' ? '📤 KUTOA FEDHA' : 
                                 transaction.type === 'investment' ? '💼 UWEKEZAJI' :
                                 '💳 MUAMALA'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Kiasi cha Muamala:</strong></span>
                        <span style="font-size: 18px; font-weight: bold; color: #2c3e50;">${db.formatCurrency(transaction.amount)}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Njia ya Malipo:</strong></span>
                        <span>${getBankName(transaction.method || transaction.details?.method)}</span>
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
                    ` : transaction.type === 'withdrawal' ? `
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
                        <span><strong>Sababu ya Kutoa:</strong></span>
                        <span>${transaction.details.reason}</span>
                    </div>
                    ` : ''}
                    ` : ''}
                    
                    <div class="receipt-row">
                        <span><strong>Hali ya Muamala:</strong></span>
                        <span class="${statusClass}">${statusIcon} ${statusText}</span>
                    </div>
                    
                    ${transaction.adminActionDate ? `
                    <div class="receipt-row">
                        <span><strong>Tarehe ya Idhini:</strong></span>
                        <span>${new Date(transaction.adminActionDate).toLocaleDateString('sw-TZ')}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="receipt-footer">
                    <div class="qr-code">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${statusText}</div>
                        <div style="background: white; padding: 10px; display: inline-block; border: 1px solid #ddd;">
                            <div style="width: 100px; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                                QR Code<br>#${transaction.id}
                            </div>
                        </div>
                        <p style="margin-top: 5px; font-size: 10px;">Scan for Verification</p>
                    </div>
                    <p><strong>ASANTE KWA KUTUMIA HUDUMA ZETU</strong></p>
                    <p><strong>TANZANIA MINING INVESTMENT</strong></p>
                    <p>+255768616961 | mining.investment.tanzania@proton.me</p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
                        Risiti hii ni ushahidi rasmi wa muamala wako. Tafadhali hifadhi kwa usalama.
                    </p>
                </div>
                
                <div class="instructions">
                    <h4>📸 Maelekezo ya Kuhifadhi Risiti:</h4>
                    <ul>
                        <li><strong>Kuchukua Screenshot:</strong> Bonyeza pamoja Power + Volume Down (simu)</li>
                        <li><strong>Kupakua:</strong> Bonyeza "Pakua Risiti" hapo juu</li>
                        <li><strong>Kuchapisha:</strong> Bonyeza "Print Risiti" kwa nakala ya karatasi</li>
                        <li><strong>Kuhifadhi:</strong> Tuma kwenye barua pepe yako au hifadhi kwenye wavuti</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.getElementById('receipt-content').innerHTML = receiptHTML;
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        document.getElementById('receipt-content').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                <p style="color: #95a5a6;">${error.message || 'Imeshindwa kupakia risiti'}</p>
                <button onclick="closeReceiptModal()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Funga
                </button>
            </div>
        `;
    }
}

// Close receipt modal
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Print receipt
function printReceipt() {
    window.print();
}

// Download receipt as PDF (simulated)
function downloadReceipt() {
    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;
    
    // Create a downloadable link
    const content = receiptContent.innerHTML;
    const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Risiti Ya Muamala - Tanzania Mining Investment</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .status-approved { color: green; font-weight: bold; }
                .status-pending { color: orange; font-weight: bold; }
                .status-rejected { color: red; font-weight: bold; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risiti-muamala-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Risiti imepakuliwa! Tafadhali fungua faili hii kwenye browser yako.');
}

// Update admin login to auto-show transactions
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Initializing admin dashboard...');
        
        // AUTO-SHOW TRANSACTIONS ON ADMIN LOGIN
        setupAutoShowTransactions();
        
        // Set up auto-refresh every 30 seconds for real-time updates
        setInterval(() => {
            if (document.getElementById('admin-approvals') && 
                document.getElementById('admin-approvals').classList.contains('active')) {
                loadPendingTransactions();
            }
            if (document.getElementById('admin-history') && 
                document.getElementById('admin-history').classList.contains('active')) {
                loadAdminTransactionHistory();
            }
        }, 30000);
        
        console.log('✅ Admin dashboard initialized');
    }, 100);
}

// Helper function to get bank name
function getBankName(method) {
    if (!method) return 'N/A';
    
    const bankNames = {
        'vodacom': 'Vodacom M-Pesa',
        'tigo': 'Tigo Pesa',
        'airtel': 'Airtel Money',
        'halotel': 'Halotel Halopesa',
        'crdb': 'CRDB Bank',
        'nmb': 'NMB Bank',
        'ezy': 'Ezy Pesa',
        'bank': 'Benki',
        'other': 'Nyingine',
        'mpesa': 'M-Pesa',
        'tigopesa': 'Tigo Pesa',
        'airtelmoney': 'Airtel Money',
        'halopesa': 'Halopesa'
    };
    
    return bankNames[method.toLowerCase()] || method;
}

// Make functions global
window.showReceiptModal = showReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;

// Initialize auto-show on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (db && db.currentUser) {
        setTimeout(() => {
            setupAutoShowTransactions();
        }, 2000);
    }
});








// ===== SIMPLIFIED TRANSACTION HISTORY & RECEIPT SYSTEM =====

// Global variable for current receipt data
window.currentReceiptData = null;

// Load transaction history for user
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        console.error('Transaction history body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Samahani, tafadhali ingia kwanza</td></tr>';
        return;
    }
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                </td>
            </tr>
        `;
        
        // Get transactions
        const transactions = await db.getUserTransactions(db.currentUser.id);
        
        if (!Array.isArray(transactions)) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu ya Mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (transactions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <h4 style="color: #2c3e50; margin-bottom: 10px;">Hakuna Historia ya Miradi</h4>
                        <p style="color: #7f8c8d;">Haujaanza muamala wowote bado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        // Clear and populate table
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format date
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
            // Status
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
            
            // Transaction details
            let details = '';
            let transactionIcon = '';
            
            if (transaction.type === 'deposit') {
                transactionIcon = '📥';
                const senderName = transaction.details?.senderName || 'Haijawekwa';
                const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kutoa</strong></div>
                    <div style="font-size: 12px; color: #666;">Kwa: ${accountName}</div>
                    <div style="font-size: 12px; color: #666;">Akaunti: ${accountNumber}</div>
                    <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
                `;
            } else {
                transactionIcon = '💳';
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
            }
            
            // Transaction ID
            const transactionId = transaction.transaction_id || transaction.id || 'N/A';
            
            // Receipt button
            const receiptButton = `
                <button onclick="showReceiptModal(${transaction.id})" 
                        style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: all 0.3s;">
                    📄 Risiti
                </button>
            `;
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: bold; color: #2c3e50;">${formattedDate}</div>
                    <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${transactionIcon}</span>
                        <span style="font-weight: 500;">${transaction.type === 'deposit' ? 'Kuwaweka' : 
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
                    <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td style="max-width: 200px;">${details}</td>
                <td>
                    ${receiptButton}
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add CSS if not present
        if (!document.getElementById('transaction-styles')) {
            const styleHTML = `
                <style id="transaction-styles">
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .status-pending { background: #fef5e7; color: #f39c12; }
                    .status-approved { background: #d5f4e6; color: #27ae60; }
                    .status-rejected { background: #fadbd8; color: #e74c3c; }
                    button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styleHTML);
        }
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu Ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                </td>
            </tr>
        `;
    }
}

// ===== SIMPLE RECEIPT MODAL SYSTEM =====

// Create receipt modal
function createReceiptModal() {
    if (document.getElementById('receipt-modal')) return;
    
    const modalHTML = `
        <div id="receipt-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); overflow-y: auto;">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 0; width: 90%; max-width: 600px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #2c3e50; color: white;">
                    <h2 style="margin: 0; font-size: 22px;">📄 RISITI YA MUAMALA</h2>
                    <button onclick="closeReceiptModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: white;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px; max-height: 70vh; overflow-y: auto;">
                    <div id="receipt-content"></div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; text-align: center;">
                    <button onclick="printReceipt()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        🖨️ Chapisha
                    </button>
                    <button onclick="downloadReceipt()" style="padding: 12px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        📥 Pakua
                    </button>
                    <button onclick="closeReceiptModal()" style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        ✕ Funga
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    addReceiptStyles();
}

// Add receipt styles
function addReceiptStyles() {
    if (document.getElementById('receipt-styles')) return;
    
    const styleHTML = `
        <style id="receipt-styles">
            /* Receipt Content Styles */
            .receipt-container {
                font-family: 'Courier New', monospace;
                max-width: 100%;
                background: white;
                padding: 20px;
            }
            
            .receipt-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px dashed #ccc;
            }
            
            .receipt-header h1 {
                color: #2c3e50;
                font-size: 24px;
                margin: 0 0 10px 0;
            }
            
            .receipt-details {
                margin: 20px 0;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px dotted #eee;
            }
            
            .detail-label {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .detail-value {
                text-align: right;
                font-weight: 600;
            }
            
            .amount-display {
                background: #27ae60;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            
            /* QR Code Section */
            .qr-section {
                text-align: center;
                margin: 25px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px solid #3498db;
            }
            
            .fake-qr-code {
                width: 150px;
                height: 150px;
                background: white;
                margin: 15px auto;
                border: 2px solid #ddd;
                position: relative;
                overflow: hidden;
            }
            
            .qr-pattern {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 5px, #2c3e50 5px, #2c3e50 6px),
                    repeating-linear-gradient(90deg, transparent, transparent 5px, #2c3e50 5px, #2c3e50 6px);
                opacity: 0.1;
            }
            
            .qr-corners {
                position: absolute;
                width: 100%;
                height: 100%;
            }
            
            .qr-corner {
                position: absolute;
                width: 30px;
                height: 30px;
                border: 4px solid #2c3e50;
            }
            
            .qr-corner:nth-child(1) {
                top: 8px;
                left: 8px;
                border-radius: 6px;
            }
            
            .qr-corner:nth-child(2) {
                top: 8px;
                right: 8px;
                border-radius: 6px;
            }
            
            .qr-corner:nth-child(3) {
                bottom: 8px;
                left: 8px;
                border-radius: 6px;
            }
            
            .qr-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                background: #2c3e50;
                opacity: 0.2;
                border-radius: 4px;
            }
            
            .qr-text {
                position: absolute;
                bottom: -20px;
                left: 0;
                right: 0;
                font-size: 10px;
                color: #666;
                font-weight: bold;
            }
            
            .receipt-footer {
                text-align: center;
                margin-top: 25px;
                padding-top: 15px;
                border-top: 2px dashed #ccc;
            }
            
            /* Status Styles */
            .status-approved {
                color: #27ae60;
                font-weight: bold;
            }
            
            .status-pending {
                color: #f39c12;
                font-weight: bold;
            }
            
            .status-rejected {
                color: #e74c3c;
                font-weight: bold;
            }
            
            /* Print Styles */
            @media print {
                body * {
                    visibility: hidden;
                }
                #receipt-modal, #receipt-modal * {
                    visibility: visible;
                }
                #receipt-modal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white;
                    margin: 0;
                    padding: 0;
                }
                .modal-footer {
                    display: none !important;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styleHTML);
}

// Show receipt modal
async function showReceiptModal(transactionId) {
    console.log('Showing receipt for transaction:', transactionId);
    
    // Create modal if it doesn't exist
    createReceiptModal();
    
    // Show loading
    document.getElementById('receipt-content').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h4 style="color: #2c3e50; margin-bottom: 10px;">Inapakia risiti...</h4>
        </div>
    `;
    
    // Show modal
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    try {
        // Get transaction data
        const users = await db.getUsers();
        let transaction = null;
        let user = null;
        
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
        
        if (!transaction) throw new Error('Muamala haupatikani');
        
        // Format dates
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        const formattedDate = transactionDate.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = transactionDate.toLocaleTimeString('sw-TZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Status
        let statusText, statusClass;
        if (transaction.status === 'approved') {
            statusText = 'IMEFAULU';
            statusClass = 'status-approved';
        } else if (transaction.status === 'rejected') {
            statusText = 'IMEKATALIWA';
            statusClass = 'status-rejected';
        } else {
            statusText = 'INASUBIRI';
            statusClass = 'status-pending';
        }
        
        // Transaction type
        let typeText = '';
        if (transaction.type === 'deposit') {
            typeText = 'KUWAWEKA FEDHA';
        } else if (transaction.type === 'withdrawal') {
            typeText = 'KUTOA FEDHA';
        } else {
            typeText = 'MUAMALA';
        }
        
        // Build receipt HTML
        const receiptHTML = `
            <div class="receipt-container">
                <div class="receipt-header">
                    <h1>TANZANIA MINING INVESTMENT</h1>
                    <p><strong>Huduma za Uwekezaji</strong></p>
                    <div style="background: #f8f9fa; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold;">
                        RISITI: #TMI${transaction.id.toString().padStart(6, '0')}
                    </div>
                </div>
                
                <div class="receipt-details">
                    <div class="detail-row">
                        <span class="detail-label">Tarehe ya Muamala:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Muda wa Muamala:</span>
                        <span class="detail-value">${formattedTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Namba ya Mteja:</span>
                        <span class="detail-value">#${user.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mteja:</span>
                        <span class="detail-value">${user.username || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Aina ya Muamala:</span>
                        <span class="detail-value">${typeText}</span>
                    </div>
                    
                    <div class="amount-display">
                        ${db.formatCurrency(transaction.amount)}
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Njia ya Malipo:</span>
                        <span class="detail-value">${getBankName(transaction.method || transaction.details?.method)}</span>
                    </div>
                    
                    ${transaction.type === 'deposit' ? `
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mtumaji:</span>
                        <span class="detail-value">${transaction.details?.senderName || 'Haijawekwa'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Akaunti ya Mtumaji:</span>
                        <span class="detail-value">${transaction.details?.senderAccount || 'Haijawekwa'}</span>
                    </div>
                    ` : transaction.type === 'withdrawal' ? `
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mlipokeaji:</span>
                        <span class="detail-value">${transaction.details?.accountName || 'Haijawekwa'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Akaunti ya Mlipokeaji:</span>
                        <span class="detail-value">${transaction.details?.accountNumber || 'Haijawekwa'}</span>
                    </div>
                    ` : ''}
                    
                    <div class="detail-row">
                        <span class="detail-label">Hali ya Muamala:</span>
                        <span class="detail-value ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <!-- QR Code Section -->
                <div class="qr-section">
                    <div style="background: #3498db; color: white; padding: 5px 15px; border-radius: 15px; display: inline-block; font-weight: bold; margin-bottom: 15px;">
                        QR CODE YA UTHIBITISHO
                    </div>
                    <div class="fake-qr-code">
                        <div class="qr-pattern"></div>
                        <div class="qr-corners">
                            <div class="qr-corner"></div>
                            <div class="qr-corner"></div>
                            <div class="qr-corner"></div>
                        </div>
                        <div class="qr-center"></div>
                        <div class="qr-text">TMI${transaction.id}</div>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 15px;">
                        <strong>Skani kuthibitisha ukweli wa risiti hii</strong><br>
                        verify.tanzaniamining.co.tz
                    </p>
                </div>
                
                <div class="receipt-footer">
                    <p><strong>📞 Huduma za Wateja:</strong>255768616961</p>
                    <p><strong>📧 Barua Pepe:</strong> mining.investment.tanzania@proton.me</p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-top: 15px;">
                        Risiti hii ni ushahidi rasmi. Tafadhali hifadhi kwa usalama.
                    </p>
                    <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin-top: 15px;">
                        <strong>ASANTE KWA KUWEKEZA NA KUTUAMINI!</strong>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('receipt-content').innerHTML = receiptHTML;
        
        // Store transaction data
        window.currentReceiptData = {
            id: transaction.id,
            user: user,
            transaction: transaction
        };
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        document.getElementById('receipt-content').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu Ilitokea</h4>
                <p style="color: #95a5a6;">${error.message || 'Imeshindwa kupakia risiti'}</p>
            </div>
        `;
    }
}

// Close receipt modal
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        window.currentReceiptData = null;
    }
}

// Print receipt
function printReceipt() {
    if (!window.currentReceiptData) {
        alert('Tafadhali subiri risiti ipakie kwanza');
        return;
    }
    window.print();
}

// Download receipt as HTML
function downloadReceipt() {
    if (!window.currentReceiptData) {
        alert('Tafadhali subiri risiti ipakie kwanza');
        return;
    }
    
    const receiptContent = document.getElementById('receipt-content').innerHTML;
    const data = window.currentReceiptData;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Risiti #TMI${data.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt-container { max-width: 600px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .amount-display { background: #27ae60; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
                .qr-section { text-align: center; margin: 20px 0; padding: 20px; border: 2px solid #3498db; }
                .receipt-footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #ccc; }
            </style>
        </head>
        <body>
            ${receiptContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risiti_TMI${data.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Risiti imepakuliwa! Fungua faili hii kwenye browser yako.');
}

// Helper function to get bank name
function getBankName(method) {
    if (!method) return 'Haijawekwa';
    
    const banks = {
        'nmb': 'NMB Bank',
        'crdb': 'CRDB Bank',
        'airtel': 'Airtel Money',
        'tigo': 'Tigo Pesa',
        'mpesa': 'M-Pesa',
        'halopesa': 'Halopesa',
        'tpesa': 'T-Pesa',
        'vodacom': 'Vodacom M-Pesa',
        'bank': 'Benki',
        'mobile': 'Mkoba wa simu'
    };
    
    return banks[method.toLowerCase()] || method;
}

// Export functions
window.loadTransactionHistory = loadTransactionHistory;
window.showReceiptModal = showReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if transaction history should be loaded
    if (db && db.currentUser && document.getElementById('transaction-history-body')) {
        setTimeout(loadTransactionHistory, 500);
    }
});

// ===== QUICK FIX - Hamburger Isolation =====
// Add this to your existing JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Track which dashboard is active
    let activeDashboard = 'user';
    
    // Function to determine active dashboard
    function getActiveDashboard() {
        // Check which dashboard is visible
        if (!document.getElementById('user-dashboard').classList.contains('hidden')) {
            return 'user';
        } else if (!document.getElementById('admin-dashboard').classList.contains('hidden')) {
            return 'admin';
        } else if (!document.getElementById('super-admin-dashboard').classList.contains('hidden')) {
            return 'super-admin';
        }
        return 'user';
    }
    
    // Override hamburger button clicks
    document.addEventListener('click', function(e) {
        // Check if clicked element is a hamburger button
        const hamburgerBtn = e.target.closest('.hamburger-btn');
        if (!hamburgerBtn) return;
        
        // Get the dashboard from button ID
        let dashboard = 'user';
        if (hamburgerBtn.id === 'admin-hamburger') {
            dashboard = 'admin';
        } else if (hamburgerBtn.id === 'super-admin-hamburger') {
            dashboard = 'super-admin';
        }
        
        // Update active dashboard
        activeDashboard = dashboard;
        console.log(`Active dashboard: ${activeDashboard}`);
        
        // Only toggle sidebar for active dashboard
        toggleSidebarForDashboard(activeDashboard);
        
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Function to toggle sidebar for specific dashboard
    function toggleSidebarForDashboard(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-sidebar`);
        const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
        
        if (!sidebar) return;
        
        if (sidebar.classList.contains('active')) {
            // Close sidebar
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // Close all other sidebars first
            ['user', 'admin', 'super-admin'].forEach(d => {
                if (d !== dashboard) {
                    const otherSidebar = document.getElementById(`${d}-sidebar`);
                    const otherOverlay = document.getElementById(`${d}-sidebar-overlay`);
                    if (otherSidebar) otherSidebar.classList.remove('active');
                    if (otherOverlay) otherOverlay.classList.remove('active');
                }
            });
            
            // Open requested sidebar
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Override close button clicks
    document.addEventListener('click', function(e) {
        const closeBtn = e.target.closest('.sidebar-close');
        if (!closeBtn) return;
        
        // Find which sidebar to close
        const sidebarId = closeBtn.closest('.dashboard-sidebar')?.id;
        if (!sidebarId) return;
        
        const dashboard = sidebarId.replace('-sidebar', '');
        closeSidebarForDashboard(dashboard);
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    function closeSidebarForDashboard(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-sidebar`);
        const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
        
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Overlay click
    document.querySelectorAll('.sidebar-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const overlayId = this.id;
            const dashboard = overlayId.replace('-sidebar-overlay', '');
            closeSidebarForDashboard(dashboard);
        });
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all sidebars
            ['user', 'admin', 'super-admin'].forEach(dashboard => {
                closeSidebarForDashboard(dashboard);
            });
        }
    });
});

// ===== AUTO-CLOSE ADDON =====
// Add this to your existing hamburger isolation code

// Add auto-close for navigation clicks
function addAutoCloseToNavigation() {
    // Listen for all navigation clicks
    document.addEventListener('click', function(e) {
        // Check if click is on any navigation element
        const isNavClick = e.target.closest('.nav-link') || 
                          e.target.closest('.dropdown-link') || 
                          e.target.closest('.action-btn') || 
                          e.target.closest('.logout-btn');
        
        if (!isNavClick) return;
        
        // Find which sidebar this click belongs to
        const sidebar = isNavClick.closest('.dashboard-sidebar');
        if (!sidebar) return;
        
        // Get dashboard name from sidebar ID
        const dashboard = sidebar.id.replace('-sidebar', '');
        
        // Close the sidebar after delay
        setTimeout(() => {
            closeSidebarForDashboard(dashboard);
        }, 300);
    });
}

// Make sure this function is available
function closeSidebarForDashboard(dashboard) {
    const sidebar = document.getElementById(`${dashboard}-sidebar`);
    const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
    
    if (sidebar) {
        sidebar.classList.remove('active');
        // Also close any open dropdowns
        const openDropdowns = sidebar.querySelectorAll('.nav-item.open');
        openDropdowns.forEach(item => {
            item.classList.remove('open');
        });
    }
    
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize auto-close
document.addEventListener('DOMContentLoaded', addAutoCloseToNavigation);

// Add this debug function
function debugInvestmentCreation() {
    console.log('=== INVESTMENT DEBUG INFO ===');
    console.log('Current User:', db.currentUser ? {
        id: db.currentUser.id,
        username: db.currentUser.username,
        balance: db.currentUser.balance
    } : 'No user');
    
    console.log('Current Investment Data:', {
        mineral: currentMineral,
        price: currentPrice,
        grams: parseFloat(document.getElementById('investment-grams')?.value) || 0,
        days: parseFloat(document.getElementById('investment-days')?.value) || 0,
        calculatedCost: (parseFloat(document.getElementById('investment-grams')?.value) || 0) * currentPrice
    });
    
    console.log('All Investments:', investments);
    console.log('Investment Intervals:', profitIntervals);
    console.log('=== END DEBUG ===');
}

// Call this in your startInvestment() function for debugging
// Add: console.log('Debug:', debugInvestmentCreation());

// Add this debug function
function debugInvestmentCreation() {
    console.log('=== INVESTMENT DEBUG INFO ===');
    console.log('Current User:', db.currentUser ? {
        id: db.currentUser.id,
        username: db.currentUser.username,
        balance: db.currentUser.balance
    } : 'No user');
    
    console.log('Current Investment Data:', {
        mineral: currentMineral,
        price: currentPrice,
        grams: parseFloat(document.getElementById('investment-grams')?.value) || 0,
        days: parseFloat(document.getElementById('investment-days')?.value) || 0,
        calculatedCost: (parseFloat(document.getElementById('investment-grams')?.value) || 0) * currentPrice
    });
    
    console.log('All Investments:', investments);
    console.log('Investment Intervals:', profitIntervals);
    console.log('=== END DEBUG ===');
}

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
        

const TermsModal = {
    currentTab: 'general',
    
    init: function() {
        this.bindEvents();
        this.generateTOC();
        this.loadTermsStatus();
    },
    
    bindEvents: function() {
        // Tab switching
        document.querySelectorAll('.terms-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });
        
        // Quick nav buttons
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-scroll');
                this.scrollToSection(sectionId);
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('terms-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerms(e.target.value);
            });
        }
        
        // Accept checkbox
        const acceptCheckbox = document.getElementById('terms-accept-checkbox');
        const acceptBtn = document.getElementById('accept-terms-btn');
        
        if (acceptCheckbox && acceptBtn) {
            acceptCheckbox.addEventListener('change', (e) => {
                acceptBtn.disabled = !e.target.checked;
            });
        }
    },
    
    switchTab: function(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.terms-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab contents
        document.querySelectorAll('.terms-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to selected tab
        const selectedTab = document.querySelector(`.terms-tab[data-tab="${tabId}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Show corresponding content
        const tabContent = document.getElementById(`${tabId}-tab-content`);
        if (tabContent) {
            tabContent.classList.add('active');
            this.currentTab = tabId;
            
            // Scroll to top of tab content
            const mainContent = document.getElementById('terms-main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
            
            // Update TOC
            this.updateTOCForTab(tabId);
        }
    },
    
    generateTOC: function() {
        const tocList = document.getElementById('toc-list');
        if (!tocList) return;
        
        const tabs = ['general', 'investment', 'account', 'financial', 'legal', 'privacy'];
        let tocHTML = '';
        
        tabs.forEach(tab => {
            const tabContent = document.getElementById(`${tab}-tab-content`);
            if (!tabContent) return;
            
            const sections = tabContent.querySelectorAll('.terms-section');
            if (sections.length > 0) {
                sections.forEach((section, index) => {
                    const sectionId = section.id;
                    const sectionNumber = section.querySelector('.section-number')?.textContent || (index + 1);
                    const sectionTitle = section.querySelector('h3')?.textContent?.replace(sectionNumber, '').trim() || `Section ${index + 1}`;
                    
                    tocHTML += `
                        <a href="#${sectionId}" class="toc-item" data-tab="${tab}">
                            <span>${sectionNumber}. ${sectionTitle}</span>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    `;
                });
            }
        });
        
        tocList.innerHTML = tocHTML;
        
        // Add click event to TOC items
        tocList.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-tab');
                const targetSection = item.getAttribute('href').substring(1);
                
                // Switch to the correct tab first
                if (targetTab !== this.currentTab) {
                    this.switchTab(targetTab);
                }
                
                // Then scroll to the section
                setTimeout(() => {
                    this.scrollToSection(targetSection);
                }, 100);
            });
        });
        
        this.updateTOCForTab(this.currentTab);
    },
    
    updateTOCForTab: function(tabId) {
        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    scrollToSection: function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const mainContent = document.getElementById('terms-main-content');
            if (mainContent) {
                const sectionTop = section.offsetTop - 20;
                mainContent.scrollTo({
                    top: sectionTop,
                    behavior: 'smooth'
                });
            }
        }
    },
    
    searchTerms: function(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        if (searchTermLower.length < 2) {
            // Clear highlights and show all
            this.clearHighlights();
            return;
        }
        
        // Search in current active tab
        const activeTabContent = document.querySelector('.terms-tab-content.active');
        if (!activeTabContent) return;
        
        const sections = activeTabContent.querySelectorAll('.terms-section');
        let foundAny = false;
        
        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(searchTermLower)) {
                section.style.display = 'block';
                this.highlightText(section, searchTermLower);
                foundAny = true;
            } else {
                section.style.display = 'none';
            }
        });
        
        if (!foundAny) {
            // Search in all tabs
            document.querySelectorAll('.terms-tab-content').forEach(tabContent => {
                const allSections = tabContent.querySelectorAll('.terms-section');
                allSections.forEach(section => {
                    const text = section.textContent.toLowerCase();
                    if (text.includes(searchTermLower)) {
                        // Switch to this tab
                        const tabId = tabContent.id.replace('-tab-content', '');
                        this.switchTab(tabId);
                        this.highlightText(section, searchTermLower);
                        foundAny = true;
                    }
                });
            });
        }
    },
    
    highlightText: function(element, searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.parentNode.nodeName !== 'MARK') {
                nodes.push(node);
            }
        }
        
        nodes.forEach(node => {
            const text = node.textContent;
            if (regex.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<mark>$1</mark>');
                node.parentNode.replaceChild(span, node);
            }
        });
    },
    
    clearHighlights: function() {
        // Show all sections
        document.querySelectorAll('.terms-section').forEach(section => {
            section.style.display = 'block';
        });
        
        // Remove highlights
        document.querySelectorAll('mark').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    },
    
    loadTermsStatus: function() {
        // Check if user has already accepted terms
        const user = firebase.auth().currentUser;
        if (user) {
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().termsAccepted) {
                        const statusElement = document.getElementById('terms-status');
                        if (statusElement) {
                            statusElement.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> Status: Accepted';
                            statusElement.style.color = '#28a745';
                        }
                        
                        const acceptCheckbox = document.getElementById('terms-accept-checkbox');
                        const acceptBtn = document.getElementById('accept-terms-btn');
                        if (acceptCheckbox && acceptBtn) {
                            acceptCheckbox.checked = true;
                            acceptCheckbox.disabled = true;
                            acceptBtn.disabled = true;
                            acceptBtn.innerHTML = '<i class="fas fa-check-circle"></i> Already Accepted';
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading terms status:', error);
                });
        }
    }
};

// Initialize modal when opened
function initTermsModal() {
    TermsModal.init();
}

// Copy section function
function copySection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const text = section.innerText;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            const copyBtn = section.querySelector('.section-copy');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

// Accept terms function
function acceptTerms() {
    const acceptCheckbox = document.getElementById('terms-accept-checkbox');
    if (!acceptCheckbox.checked) return;
    
    const user = firebase.auth().currentUser;
    if (user) {
        const db = firebase.firestore();
        db.collection('users').doc(user.uid).update({
            termsAccepted: true,
            termsAcceptedDate: new Date(),
            termsVersion: '2024-01-01',
            termsAcceptedIP: getClientIP()
        })
        .then(() => {
            // Update UI
            const acceptBtn = document.getElementById('accept-terms-btn');
            const statusElement = document.getElementById('terms-status');
            
            acceptBtn.innerHTML = '<i class="fas fa-check-circle"></i> Accepted';
            acceptBtn.disabled = true;
            acceptCheckbox.disabled = true;
            
            if (statusElement) {
                statusElement.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> Status: Accepted';
                statusElement.style.color = '#28a745';
            }
            
            // Show success message
            showNotification('Terms and Conditions accepted successfully!', 'success');
        })
        .catch(error => {
            console.error('Error saving acceptance:', error);
            showNotification('Error saving acceptance. Please try again.', 'error');
        });
    } else {
        showNotification('Please log in to accept the terms.', 'warning');
    }
}

// Helper function to get client IP
function getClientIP() {
    // This would be implemented to get the user's IP address
    return 'Captured on acceptance';
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to container or body
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Print terms function
function printTerms() {
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.terms-modal-container').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Terms and Conditions - Tanzania Mining Investment</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h2 { color: #333; }
                .terms-section { margin-bottom: 30px; }
                .section-number { font-weight: bold; margin-right: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #f5f5f5; }
                .note { font-style: italic; color: #666; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h2>Terms and Conditions - Tanzania Mining Investment</h2>
            <p>Printed: ${new Date().toLocaleDateString()}</p>
            <div>${printContent}</div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Download terms as PDF
function downloadTermsPDF() {
    showNotification('PDF download will be available soon.', 'info');
    // Implementation would require a PDF generation library
}

// Initialize when modal opens
document.addEventListener('DOMContentLoaded', function() {
    // Override the openModal function for terms modal
    const originalOpenModal = window.openModal;
    window.openModal = function(modalId) {
        originalOpenModal(modalId);
        if (modalId === 'terms-modal') {
            setTimeout(() => {
                initTermsModal();
            }, 100);
        }
    };
});

// Profile Tab Switcher Implementation
class ProfileTabManager {
    constructor() {
        this.currentTab = null;
        this.tabHistory = [];
        this.maxHistory = 10;
        this.init();
    }   
    
    init() {
        this.setupTabElements();
        this.setupEventListeners();
        this.loadInitialTab();
        this.setupKeyboardNavigation();
        console.log('Profile Tab Manager initialized');
    }
    
    setupTabElements() {
        this.tabs = document.querySelectorAll('.dashboard-tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Add data attributes for better selection
        this.tabs.forEach((tab, index) => {
            const onclickAttr = tab.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('switchTab')) {
                const match = onclickAttr.match(/switchTab\('([^']+)'\)/);
                if (match && match[1]) {
                    tab.dataset.tabId = match[1];
                }
            } else {
                // Alternative: extract from text content
                const tabText = tab.textContent.trim().toLowerCase();
                const tabIdMap = {
                    'investment plans': 'investments',
                    'my investments': 'my-investments',
                    'referral earnings': 'referrals',
                    'investment calculator': 'calculator'
                };
                if (tabIdMap[tabText]) {
                    tab.dataset.tabId = tabIdMap[tabText];
                }
            }
        });
    }
    
    setupEventListeners() {
        // Tab click events
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tabId;
                if (tabId) {
                    this.switchToTab(tabId);
                }
            });
        });
        
        // Browser back/forward navigation
        window.addEventListener('popstate', () => {
            this.loadInitialTab();
        });
        
        // Custom events for external control
        document.addEventListener('profileTabChange', (e) => {
            if (e.detail && e.detail.tabId) {
                this.switchToTab(e.detail.tabId);
            }
        });
    }
    
    switchToTab(tabId, addToHistory = true) {
        // Skip if already on this tab
        if (this.currentTab === tabId) return;
        
        console.log(`Switching to tab: ${tabId}`);
        
        // Update history
        if (addToHistory && this.currentTab) {
            this.tabHistory.push(this.currentTab);
            if (this.tabHistory.length > this.maxHistory) {
                this.tabHistory.shift();
            }
            
            // Update browser history
            history.pushState({ tabId }, '', `#profile-${tabId}`);
        }
        
        // Update current tab
        const previousTab = this.currentTab;
        this.currentTab = tabId;
        
        // Update UI
        this.updateTabVisuals(tabId);
        this.showTabContent(tabId);
        
        // Dispatch events
        this.dispatchTabChangeEvent(tabId, previousTab);
        
        // Save to session storage for persistence
        sessionStorage.setItem('lastProfileTab', tabId);
        
        // Load tab-specific content
        this.loadTabContent(tabId);
    }
    
    updateTabVisuals(tabId) {
        // Remove active class from all tabs
        this.tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        // Add active class to current tab
        const activeTab = Array.from(this.tabs).find(tab => tab.dataset.tabId === tabId);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.setAttribute('aria-selected', 'true');
            
            // Scroll into view if needed (for mobile)
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    activeTab.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'center'
                    });
                }, 100);
            }
        }
    }
    
    showTabContent(tabId) {
        // Hide all tab contents
        this.tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
            content.setAttribute('aria-hidden', 'true');
        });
        
        // Show selected tab content
        const contentId = `${tabId}-section`;
        const contentElement = document.getElementById(contentId);
        
        if (contentElement) {
            contentElement.style.display = 'block';
            contentElement.classList.add('active');
            contentElement.setAttribute('aria-hidden', 'false');
            
            // Add fade-in animation
            contentElement.style.opacity = '0';
            setTimeout(() => {
                contentElement.style.transition = 'opacity 0.3s ease';
                contentElement.style.opacity = '1';
            }, 50);
            
            // Focus first interactive element for accessibility
            setTimeout(() => {
                const firstInteractive = contentElement.querySelector(
                    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (firstInteractive) {
                    firstInteractive.focus();
                }
            }, 300);
        } else {
            console.warn(`Tab content element not found: #${contentId}`);
        }
    }
    
    loadTabContent(tabId) {
        // Load content based on tab
        switch(tabId) {
            case 'calculator':
                this.loadCalculatorContent();
                break;
            case 'my-investments':
                this.loadMyInvestmentsContent();
                break;
            case 'referrals':
                this.loadReferralsContent();
                break;
            case 'investments':
                this.loadInvestmentPlansContent();
                break;
        }
    }
    
    loadCalculatorContent() {
        // Initialize calculator if needed
        if (typeof window.calculateMineralValue === 'function') {
            // Set default values
            const mineralGramsInput = document.getElementById('mineral-grams');
            const mineralTypeSelect = document.getElementById('mineral-type');
            
            if (mineralGramsInput && !mineralGramsInput.value) {
                mineralGramsInput.value = '10';
            }
            
            // Calculate initial value
            setTimeout(() => {
                if (typeof calculateMineralValue === 'function') {
                    calculateMineralValue();
                }
            }, 100);
        }
    }
    
    loadMyInvestmentsContent() {
        // Load user investments
        if (typeof window.loadUserInvestments === 'function') {
            setTimeout(() => {
                window.loadUserInvestments();
            }, 100);
        }
    }
    
    loadReferralsContent() {
        // Load referrals data
        if (typeof window.loadReferralsData === 'function') {
            setTimeout(() => {
                window.loadReferralsData();
            }, 100);
        }
    }
    
    loadInvestmentPlansContent() {
        // Load investment plans
        console.log('Loading investment plans content');
    }
    
    dispatchTabChangeEvent(newTabId, previousTabId) {
        const event = new CustomEvent('profileTabChanged', {
            detail: {
                newTab: newTabId,
                previousTab: previousTabId,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }
    
    loadInitialTab() {
        // Check URL hash first
        const hash = window.location.hash;
        if (hash.startsWith('#profile-')) {
            const tabId = hash.replace('#profile-', '');
            if (this.isValidTab(tabId)) {
                this.switchToTab(tabId, false);
                return;
            }
        }
        
        // Check session storage
        const savedTab = sessionStorage.getItem('lastProfileTab');
        if (savedTab && this.isValidTab(savedTab)) {
            this.switchToTab(savedTab, false);
            return;
        }
        
        // Default to first active tab or first tab
        const defaultTab = document.querySelector('.dashboard-tab.active') || this.tabs[0];
        if (defaultTab && defaultTab.dataset.tabId) {
            this.switchToTab(defaultTab.dataset.tabId, false);
        } else if (this.tabs.length > 0) {
            this.switchToTab(this.tabs[0].dataset.tabId, false);
        }
    }
    
    isValidTab(tabId) {
        return Array.from(this.tabs).some(tab => tab.dataset.tabId === tabId);
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle if focus is within profile section
            const profileSection = document.getElementById('profile');
            if (!profileSection || !profileSection.contains(document.activeElement)) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateToNextTab();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateToPreviousTab();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateToFirstTab();
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateToLastTab();
                    break;
            }
        });
    }
    
    navigateToNextTab() {
        if (!this.currentTab) return;
        
        const currentIndex = Array.from(this.tabs).findIndex(
            tab => tab.dataset.tabId === this.currentTab
        );
        
        if (currentIndex >= 0 && currentIndex < this.tabs.length - 1) {
            const nextTab = this.tabs[currentIndex + 1];
            this.switchToTab(nextTab.dataset.tabId);
        }
    }
    
    navigateToPreviousTab() {
        if (!this.currentTab) return;
        
        const currentIndex = Array.from(this.tabs).findIndex(
            tab => tab.dataset.tabId === this.currentTab
        );
        
        if (currentIndex > 0) {
            const prevTab = this.tabs[currentIndex - 1];
            this.switchToTab(prevTab.dataset.tabId);
        }
    }
    
    navigateToFirstTab() {
        if (this.tabs.length > 0) {
            this.switchToTab(this.tabs[0].dataset.tabId);
        }
    }
    
    navigateToLastTab() {
        if (this.tabs.length > 0) {
            this.switchToTab(this.tabs[this.tabs.length - 1].dataset.tabId);
        }
    }
    
    goBackInHistory() {
        if (this.tabHistory.length > 0) {
            const previousTab = this.tabHistory.pop();
            this.switchToTab(previousTab, false);
        }
    }
    
    getCurrentTab() {
        return this.currentTab;
    }
    
    getTabHistory() {
        return [...this.tabHistory];
    }
}

// Initialize Profile Tab Manager when dashboard loads
function initializeProfileTabs() {
    // Check if we're on the user dashboard
    const userDashboard = document.getElementById('user-dashboard');
    const profileSection = document.getElementById('profile');
    
    if (userDashboard && userDashboard.style.display !== 'none' && profileSection) {
        // Check if profile section is active
        if (profileSection.classList.contains('active')) {
            // Initialize tab manager
            if (!window.profileTabManager) {
                window.profileTabManager = new ProfileTabManager();
                console.log('Profile tabs initialized');
            }
            return window.profileTabManager;
        }
    }
    return null;
}

// Make switchTab function globally available for onclick attributes
function switchTab(tabId) {
    if (window.profileTabManager) {
        window.profileTabManager.switchToTab(tabId);
    } else {
        // Fallback simple implementation
        const tabs = document.querySelectorAll('.dashboard-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Update tabs
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(`'${tabId}'`)) {
                tab.classList.add('active');
            }
        });
        
        // Update content
        tabContents.forEach(content => {
            content.style.display = 'none';
            if (content.id === `${tabId}-section`) {
                content.style.display = 'block';
                content.classList.add('active');
            }
        });
        
        // Update URL
        window.location.hash = `profile-${tabId}`;
    }
}

// Initialize when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    // Monitor for dashboard visibility changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const userDashboard = document.getElementById('user-dashboard');
                if (userDashboard && userDashboard.style.display !== 'none') {
                    // Initialize profile tabs
                    setTimeout(() => {
                        initializeProfileTabs();
                    }, 500);
                }
            }
        });
    });
    
    // Observe dashboard visibility
    const userDashboard = document.getElementById('user-dashboard');
    if (userDashboard) {
        observer.observe(userDashboard, { attributes: true, attributeFilter: ['style'] });
    }
    
    // Also initialize immediately if dashboard is already visible
    if (userDashboard && userDashboard.style.display !== 'none') {
        setTimeout(() => {
            initializeProfileTabs();
        }, 1000);
    }
});

// Event listener for dashboard navigation
document.addEventListener('dashboardNavChange', function(e) {
    if (e.detail && e.detail.target === 'profile') {
        // Profile section was opened, initialize tabs
        setTimeout(() => {
            initializeProfileTabs();
        }, 300);
    }
});

// Enhanced error handling for chat system
if (typeof window.chatSystem !== 'undefined') {
    // Wrap chat system methods with error handling
    const originalSendMessage = window.chatSystem.sendMessage;
    const originalUpdateStats = window.chatSystem.updateStats;
    
    if (originalSendMessage) {
        window.chatSystem.sendMessage = function(...args) {
            try {
                return originalSendMessage.apply(this, args);
            } catch (error) {
                console.error('Error in chat system sendMessage:', error);
                // Fallback: Show message locally if Firebase fails
                this.showLocalMessage(args[0], args[1]);
                return Promise.resolve();
            }
        };
    }
    
    if (originalUpdateStats) {
        window.chatSystem.updateStats = function(...args) {
            try {
                // Validate inputs before passing to Firebase
                const [chatId, updates] = args;
                
                // Ensure updates is an object
                if (!updates || typeof updates !== 'object') {
                    console.error('Invalid updates object:', updates);
                    return Promise.reject(new Error('Invalid updates'));
                }
                
                // Convert all values to numbers where appropriate
                const sanitizedUpdates = {};
                for (const key in updates) {
                    if (key.includes('Count') || key.includes('unread')) {
                        sanitizedUpdates[key] = Number(updates[key]) || 0;
                    } else {
                        sanitizedUpdates[key] = updates[key];
                    }
                }
                
                return originalUpdateStats.call(this, chatId, sanitizedUpdates);
            } catch (error) {
                console.error('Error in chat system updateStats:', error);
                return Promise.resolve(); // Resolve to prevent chain failures
            }
        };
    }
}

// ==============================================
// COMPLETE USER MANAGEMENT SYSTEM
// ==============================================

// Global variables for user management
let usersList = [];
let currentEditingUserId = null;

// Initialize super admin management system
function initSuperAdminManagement() {
    console.log('🚀 Initializing Super Admin Management System...');
    
    // Add management styles
    addSuperAdminManagementStyles();
    
    // Load initial data
    loadUsersList();
    loadSuperAdminStats();
    
    // Setup event listeners
    setupSuperAdminEventListeners();
    
    // Start real-time updates
    startSuperAdminRealTimeUpdates();
    
    console.log('✅ Super Admin Management System Initialized');
}

async function loadUsersManagement() {
    try {
        console.log('Loading users for management...');
        
        if (!db) {
            alert('Database not initialized');
            return;
        }
        
        // Show loading state
        const usersTableBody = document.getElementById('users-table-body');
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <p>Loading users...</p>
                    </td>
                </tr>
            `;
        }
        
        // Get all users
        usersList = await db.getUsers();
        
        // Sort users by join date (newest first)
        usersList.sort((a, b) => new Date(b.join_date) - new Date(a.join_date));
        
        // Update display
        updateUsersTable();
        
        // Update stats
        updateUserManagementStats();
        
    } catch (error) {
        console.error('Error loading users for management:', error);
        
        const usersTableBody = document.getElementById('users-table-body');
        if (usersTableBody) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <p>Error loading users. Please try again.</p>
                        <button onclick="loadUsersManagement()" class="btn-retry" style="margin-top: 10px;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Update users table
function updateUsersTable() {
    const usersTableBody = document.getElementById('users-table-body');
    if (!usersTableBody) return;
    
    if (usersList.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 32px; color: #bdc3c7; margin-bottom: 10px;"></i>
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    usersList.forEach((user, index) => {
        // Calculate user statistics
        const totalInvested = user.investments ? 
            user.investments.reduce((sum, inv) => sum + (inv.cost || 0), 0) : 0;
        
        const totalDeposits = user.transactions ? 
            user.transactions.filter(t => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const totalWithdrawals = user.transactions ? 
            user.transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved')
                .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const referralCount = user.referrals ? user.referrals.length : 0;
        
        // Format dates
        const joinDate = new Date(user.join_date);
        const lastActive = user.last_active ? new Date(user.last_active) : joinDate;
        
        // Get status badge
        const statusBadge = getStatusBadge(user.status);
        
        html += `
            <tr data-user-id="${user.id}" class="user-row ${index % 2 === 0 ? 'even' : 'odd'}">
                <td>
                    <div class="user-info-cell">
                        <div class="user-avatar">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.username}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.id}</td>
                <td>${joinDate.toLocaleDateString()}</td>
                <td>${db.formatCurrency(user.balance || 0)}</td>
                <td>${db.formatCurrency(totalInvested)}</td>
                <td>${referralCount}</td>
                <td>
                    <div class="status-cell">
                        ${statusBadge}
                        ${user.is_admin ? 
                            `<span class="admin-badge ${user.is_super_admin ? 'super-admin' : 'admin'}">
                                <i class="fas ${user.is_super_admin ? 'fa-crown' : 'fa-user-shield'}"></i>
                                ${user.is_super_admin ? 'Super Admin' : 'Admin'}
                            </span>` : ''
                        }
                    </div>
                </td>
                <td>${lastActive.toLocaleDateString()}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn-action btn-view" onclick="viewUser(${user.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editUser(${user.id})" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-${user.status === 'active' ? 'suspend' : 'activate'}" 
                                onclick="${user.status === 'active' ? 'suspendUser' : 'activateUser'}(${user.id})" 
                                title="${user.status === 'active' ? 'Suspend User' : 'Activate User'}">
                            <i class="fas fa-${user.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteUserConfirm(${user.id})" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    usersTableBody.innerHTML = html;
    
    // Add search functionality
    setupUserSearch();
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="status-badge active"><i class="fas fa-check-circle"></i> Active</span>',
        'inactive': '<span class="status-badge inactive"><i class="fas fa-minus-circle"></i> Inactive</span>',
        'pending': '<span class="status-badge pending"><i class="fas fa-clock"></i> Pending</span>',
        'suspended': '<span class="status-badge suspended"><i class="fas fa-ban"></i> Suspended</span>',
        'banned': '<span class="status-badge banned"><i class="fas fa-gavel"></i> Banned</span>'
    };
    
    return badges[status] || '<span class="status-badge unknown">Unknown</span>';
}

// Load users list for management
async function loadUsersList() {
    try {
        console.log('📊 Loading users list...');
        
        const usersBody = document.getElementById('users-table-body');
        if (!usersBody) {
            console.error('Users table body not found');
            return;
        }
        
        // Show loading state
        usersBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>Loading users data...</p>
                </td>
            </tr>
        `;
        
        // Get all users (non-admins)
        const allUsers = await db.getUsers();
        const regularUsers = allUsers.filter(user => !user.is_admin);
        usersList = regularUsers;
        
        console.log(`✅ Found ${regularUsers.length} regular users`);
        
        // Update statistics
        updateUserStats(regularUsers);
        
        // Clear table
        usersBody.innerHTML = '';
        
        if (regularUsers.length === 0) {
            usersBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">No Users Found</h4>
                        <p style="color: #95a5a6;">No regular users registered yet</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort users by activity
        const sortedUsers = regularUsers.sort((a, b) => {
            // Active users first
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            
            // Then by join date (newest first)
            const aJoinDate = new Date(a.join_date);
            const bJoinDate = new Date(b.join_date);
            return bJoinDate - aJoinDate;
        });
        
        // Populate table
        sortedUsers.forEach((user, index) => {
            const row = createUserTableRow(user, index + 1);
            usersBody.appendChild(row);
        });
        
        console.log('✅ Users list loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading users list:', error);
        showNotification('Error loading users list. Please try again.', true);
    }
}

// Create user table row
function createUserTableRow(user, index) {
    const row = document.createElement('tr');
    row.className = `user-row ${user.status === 'active' ? 'active-user' : 'inactive-user'}`;
    row.dataset.userId = user.id;
    
    // Format join date
    const joinDate = new Date(user.join_date);
    const formattedJoinDate = joinDate.toLocaleDateString('en-TZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Format balance
    const formattedBalance = db.formatCurrency ? 
        db.formatCurrency(user.balance || 0) : 
        `TZS ${Math.round(user.balance || 0).toLocaleString()}`;
    
    // Status
    const status = user.status === 'active' ? 'Active' : 'Inactive';
    const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
    
    // Calculate user metrics
    const totalInvestments = user.investments ? user.investments.length : 0;
    const activeInvestments = user.investments ? 
        user.investments.filter(inv => !inv.completed).length : 0;
    const totalDeposits = user.transactions ? 
        user.transactions
            .filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
    
    row.innerHTML = `
        <td>${user.id}</td>
        <td>
            <div class="user-info">
                <div class="user-avatar">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="user-name">${user.username}</div>
                    <div class="user-meta">
                        <span class="user-id">ID: ${user.id}</span>
                        <span class="user-ref">Ref: ${user.referral_code || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </td>
        <td>${user.email}</td>
        <td>
            <span class="status-badge ${statusClass}">${status}</span>
        </td>
        <td class="password-cell">
            <div class="password-display">
                <span class="password-masked">••••••••</span>
                <button class="btn-show-password" onclick="toggleUserPassword(${user.id}, this)" title="Show Password">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </td>
        <td>
            <code class="referral-code">${user.referral_code || 'N/A'}</code>
        </td>
        <td>
            <div class="balance-display">
                <span class="balance-amount">${formattedBalance}</span>
                ${totalDeposits > 0 ? `<div class="total-deposits">Total deposits: TZS ${Math.round(totalDeposits).toLocaleString()}</div>` : ''}
            </div>
        </td>
        <td>${formattedJoinDate}</td>
        <td>
            <div class="user-actions">
                <button class="btn-action view" onclick="viewUser(${user.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action chat" onclick="chatWithUser(${user.id})" title="Chat" ${user.status !== 'active' ? 'disabled' : ''}>
                    <i class="fas fa-comment"></i>
                </button>
                <button class="btn-action investments" onclick="viewUserInvestments(${user.id})" title="View Investments">
                    <i class="fas fa-chart-line"></i>
                </button>
                <button class="btn-action transactions" onclick="viewUserTransactions(${user.id})" title="View Transactions">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="btn-action edit" onclick="editUser(${user.id})" title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action reset-password" onclick="resetUserPassword(${user.id})" title="Reset Password">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn-action status" onclick="toggleUserStatus(${user.id}, '${user.status}')" title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
                    <i class="fas ${user.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                </button>
                <button class="btn-action delete" onclick="deleteUser(${user.id})" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Store password for toggling
    row.querySelector('.password-masked').dataset.password = user.password || 'No password set';
    
    return row;
}

// Update user statistics
function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    
    const today = new Date().toDateString();
    const todaySignups = users.filter(user => {
        const joinDate = new Date(user.join_date).toDateString();
        return joinDate === today;
    }).length;
    
    updateElement('#total-users-count', totalUsers);
    updateElement('#active-users-count', activeUsers);
    updateElement('#inactive-users-count', inactiveUsers);
    updateElement('#today-signups-count', todaySignups);
}

// Load super admin statistics
async function loadSuperAdminStats() {
    try {
        const allUsers = await db.getUsers();
        const admins = allUsers.filter(user => user.is_admin);
        const regularUsers = allUsers.filter(user => !user.is_admin);
        
        updateAdminStats(admins);
        updateUserStats(regularUsers);
        
    } catch (error) {
        console.error('Error loading super admin stats:', error);
    }
}

// Update element helper function
function updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// ==============================================
// EDIT USER FUNCTION WITH PASSWORD SECTION
// ==============================================

async function editUser(userId) {
    try {
        console.log('✏️ Editing user:', userId);
        currentEditingUserId = userId;
        
        const user = await db.findUserById(userId);
        if (!user) {
            showNotification('User not found', true);
            return;
        }
        
        // Get user's referrals
        const allUsers = await db.getUsers();
        const userReferrals = allUsers.filter(u => u.referred_by === user.referral_code);
        
        // Create modal content
        const modalContent = `
            <div class="modal-overlay" onclick="closeUserModal()"></div>
            <div class="modal-container user-edit-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-user-edit"></i>
                        <span>Edit User - ${user.username}</span>
                    </div>
                    <button class="modal-close" onclick="closeUserModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="edit-user-form" onsubmit="return submitEditUserForm(event, ${userId})">
                        <div class="form-tabs">
                            <div class="tab-buttons">
                                <button type="button" class="tab-btn active" data-tab="basic">Basic Info</button>
                                <button type="button" class="tab-btn" data-tab="security">Security</button>
                                <button type="button" class="tab-btn" data-tab="financial">Financial</button>
                                <button type="button" class="tab-btn" data-tab="advanced">Advanced</button>
                            </div>
                            
                            <div class="tab-content active" id="basic-tab">
                                <div class="form-group">
                                    <label for="edit-username">Username *</label>
                                    <input type="text" id="edit-username" value="${user.username}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-email">Email Address *</label>
                                    <input type="email" id="edit-email" value="${user.email}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-status">Account Status *</label>
                                    <select id="edit-status" required>
                                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-referral-code">Referral Code *</label>
                                    <input type="text" id="edit-referral-code" value="${user.referral_code || ''}" required>
                                    <small class="form-help">Unique code for referrals</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-referred-by">Referred By</label>
                                    <input type="text" id="edit-referred-by" value="${user.referred_by || ''}" placeholder="Referral code of referrer">
                                </div>
                            </div>
                            
                            <div class="tab-content" id="security-tab">
                                <div class="form-group">
                                    <label for="edit-password">New Password</label>
                                    <div class="password-input-group">
                                        <input type="password" id="edit-password" placeholder="Leave empty to keep current">
                                        <button type="button" class="password-toggle" onclick="toggleEditPassword('edit-password', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-admin-password">Admin Password</label>
                                    <div class="password-input-group">
                                        <input type="password" id="edit-admin-password" value="${user.admin_password || ''}" placeholder="Admin access password">
                                        <button type="button" class="password-toggle" onclick="toggleEditPassword('edit-admin-password', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <small class="form-help">For admin-level operations</small>
                                </div>
                                
                                <div class="form-group">
                                    <label>Security Flags</label>
                                    <div class="checkbox-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-force-password-reset" ${user.force_password_reset ? 'checked' : ''}>
                                            Force password reset on next login
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-2fa-enabled" ${user.two_factor_enabled ? 'checked' : ''}>
                                            Two-factor authentication enabled
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-email-verified" ${user.email_verified ? 'checked' : ''}>
                                            Email verified
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="financial-tab">
                                <div class="form-group">
                                    <label for="edit-balance">Account Balance (TZS)</label>
                                    <input type="number" id="edit-balance" value="${user.balance || 0}" step="1000" min="0">
                                    <small class="form-help">Current balance in Tanzanian Shillings</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-total-deposits">Total Deposits (TZS)</label>
                                    <input type="number" id="edit-total-deposits" value="${calculateTotalDeposits(user)}" step="1000" min="0" readonly>
                                    <small class="form-help">Calculated from transaction history</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-total-withdrawals">Total Withdrawals (TZS)</label>
                                    <input type="number" id="edit-total-withdrawals" value="${calculateTotalWithdrawals(user)}" step="1000" min="0" readonly>
                                </div>
                                
                                <div class="form-group">
                                    <label>Financial Restrictions</label>
                                    <div class="checkbox-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-withdrawal-locked" ${user.withdrawal_locked ? 'checked' : ''}>
                                            Lock withdrawals
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-deposit-locked" ${user.deposit_locked ? 'checked' : ''}>
                                            Lock deposits
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="edit-investment-locked" ${user.investment_locked ? 'checked' : ''}>
                                            Lock new investments
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="advanced-tab">
                                <div class="form-group">
                                    <label for="edit-join-date">Join Date</label>
                                    <input type="datetime-local" id="edit-join-date" value="${formatDateTimeLocal(user.join_date)}">
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-last-active">Last Active</label>
                                    <input type="datetime-local" id="edit-last-active" value="${formatDateTimeLocal(user.last_active)}">
                                </div>
                                
                                <div class="form-group">
                                    <label>User Statistics</label>
                                    <div class="stats-display">
                                        <div class="stat-item">
                                            <span>Total Investments:</span>
                                            <span>${user.investments ? user.investments.length : 0}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Active Investments:</span>
                                            <span>${user.investments ? user.investments.filter(inv => !inv.completed).length : 0}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Total Referrals:</span>
                                            <span>${userReferrals.length}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Total Transactions:</span>
                                            <span>${user.transactions ? user.transactions.length : 0}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-notes">Admin Notes</label>
                                    <textarea id="edit-notes" rows="4" placeholder="Add notes about this user...">${user.admin_notes || ''}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="viewUser(${userId})">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button type="button" class="btn-warning" onclick="resetUserPassword(${userId})">
                                <i class="fas fa-key"></i> Reset Password
                            </button>
                            <button type="button" class="btn-danger" onclick="showDeleteUserConfirmation(${userId})">
                                <i class="fas fa-trash"></i> Delete User
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Create or update modal
        let modal = document.getElementById('user-edit-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-edit-modal';
            modal.className = 'user-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalContent;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup tab switching
        setupEditUserTabs();
        
        // Setup form validation
        setupEditUserFormValidation();
        
    } catch (error) {
        console.error('❌ Error opening edit user modal:', error);
        showNotification('Error loading user data', true);
    }
}

// Format date for datetime-local input
function formatDateTimeLocal(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

// Calculate total deposits from user transactions
function calculateTotalDeposits(user) {
    if (!user.transactions) return 0;
    return user.transactions
        .filter(t => t.type === 'deposit' && t.status === 'approved')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
}

// Calculate total withdrawals from user transactions
function calculateTotalWithdrawals(user) {
    if (!user.transactions) return 0;
    return user.transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'approved')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
}

// Setup edit user tabs
function setupEditUserTabs() {
    const tabBtns = document.querySelectorAll('#edit-user-form .tab-btn');
    const tabContents = document.querySelectorAll('#edit-user-form .tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            const tabId = btn.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Toggle password visibility in edit form
function toggleEditPassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Setup edit user form validation
function setupEditUserFormValidation() {
    const form = document.getElementById('edit-user-form');
    if (!form) return;
    
    // Username validation
    const usernameInput = document.getElementById('edit-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (usernameInput.value.length < 3) {
                usernameInput.setCustomValidity('Username must be at least 3 characters');
            } else {
                usernameInput.setCustomValidity('');
            }
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('edit-email');
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                emailInput.setCustomValidity('Please enter a valid email address');
            } else {
                emailInput.setCustomValidity('');
            }
        });
    }
    
    // Referral code validation
    const referralCodeInput = document.getElementById('edit-referral-code');
    if (referralCodeInput) {
        referralCodeInput.addEventListener('input', () => {
            if (referralCodeInput.value.length < 3) {
                referralCodeInput.setCustomValidity('Referral code must be at least 3 characters');
            } else {
                referralCodeInput.setCustomValidity('');
            }
        });
    }
    
    // Balance validation
    const balanceInput = document.getElementById('edit-balance');
    if (balanceInput) {
        balanceInput.addEventListener('input', () => {
            if (balanceInput.value < 0) {
                balanceInput.setCustomValidity('Balance cannot be negative');
            } else {
                balanceInput.setCustomValidity('');
            }
        });
    }
}

// Submit edit user form
async function submitEditUserForm(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        // Get form values
        const username = document.getElementById('edit-username').value.trim();
        const email = document.getElementById('edit-email').value.trim().toLowerCase();
        const status = document.getElementById('edit-status').value;
        const referralCode = document.getElementById('edit-referral-code').value.trim().toUpperCase();
        const referredBy = document.getElementById('edit-referred-by').value.trim().toUpperCase() || null;
        const password = document.getElementById('edit-password').value;
        const adminPassword = document.getElementById('edit-admin-password').value;
        const balance = parseFloat(document.getElementById('edit-balance').value) || 0;
        const joinDate = document.getElementById('edit-join-date').value;
        const lastActive = document.getElementById('edit-last-active').value;
        const notes = document.getElementById('edit-notes').value.trim();
        
        // Get checkbox values
        const forcePasswordReset = document.getElementById('edit-force-password-reset').checked;
        const twoFactorEnabled = document.getElementById('edit-2fa-enabled').checked;
        const emailVerified = document.getElementById('edit-email-verified').checked;
        const withdrawalLocked = document.getElementById('edit-withdrawal-locked').checked;
        const depositLocked = document.getElementById('edit-deposit-locked').checked;
        const investmentLocked = document.getElementById('edit-investment-locked').checked;
        
        // Get current user data
        const currentUser = await db.findUserById(userId);
        if (!currentUser) {
            showNotification('User not found', true);
            return;
        }
        
        // Check if email changed and is unique
        if (email !== currentUser.email) {
            const existingUser = await db.findUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                showNotification('Email already registered by another user', true);
                return;
            }
        }
        
        // Check if username changed and is unique
        if (username !== currentUser.username) {
            const existingUsername = await db.findUserByUsername(username);
            if (existingUsername && existingUsername.id !== userId) {
                showNotification('Username already taken', true);
                return;
            }
        }
        
        // Check if referral code changed and is unique
        if (referralCode !== currentUser.referral_code) {
            const existingReferral = await db.findUserByReferralCode(referralCode);
            if (existingReferral && existingReferral.id !== userId) {
                showNotification('Referral code already in use', true);
                return;
            }
        }
        
        // Prepare update data
        const updateData = {
            username: username.toLowerCase(),
            email: email,
            status: status,
            referral_code: referralCode,
            referred_by: referredBy,
            balance: balance,
            admin_notes: notes,
            force_password_reset: forcePasswordReset,
            two_factor_enabled: twoFactorEnabled,
            email_verified: emailVerified,
            withdrawal_locked: withdrawalLocked,
            deposit_locked: depositLocked,
            investment_locked: investmentLocked,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add password if changed
        if (password) {
            updateData.password = password;
            if (adminPassword) {
                updateData.admin_password = adminPassword;
            } else {
                updateData.admin_password = password; // Set same as regular password
            }
        } else if (adminPassword) {
            updateData.admin_password = adminPassword;
        }
        
        // Add dates if changed
        if (joinDate) {
            updateData.join_date = new Date(joinDate).toISOString();
        }
        
        if (lastActive) {
            updateData.last_active = new Date(lastActive).toISOString();
        }
        
        // Update user in database
        const success = await db.updateUser(userId, updateData);
        
        if (success) {
            showNotification('✅ User updated successfully!');
            closeUserModal();
            
            // Refresh user list
            loadUsersList();
            
            // Update current user data if editing own profile
            if (db.currentUser && db.currentUser.id === userId) {
                const updatedUser = await db.findUserById(userId);
                db.currentUser = updatedUser;
                updateUserInfo();
            }
        } else {
            showNotification('❌ Failed to update user', true);
        }
        
    } catch (error) {
        console.error('❌ Error updating user:', error);
        showNotification('Error updating user: ' + error.message, true);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
}
 
// ==============================================
// VIEW USER DETAILS FUNCTION
// ==============================================

async function viewUser(userId) {
    try {
        console.log('Viewing user:', userId);
        
        // Get user data
        const user = await db.findUserById(userId);
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Calculate user statistics
        const totalInvested = user.investments ?
            user.investments.reduce((sum, inv) => sum + (inv.cost || 0), 0) : 0;
        
        const totalDeposits = user.transactions ?
            user.transactions.filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const totalWithdrawals = user.transactions ?
            user.transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const referralCount = user.referrals ? user.referrals.length : 0;
        const activeReferrals = user.referrals ?
            user.referrals.filter(r => r.bonus_pending || r.bonus_paid).length : 0;
        
        // Get latest transactions
        const latestTransactions = user.transactions ?
            user.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5) : [];
        
        // Get active investments
        const activeInvestments = user.investments ?
            user.investments.filter(inv => !inv.completed) : [];
        
        // Create modal HTML
        const modalContent = `
            <div class="modal-overlay" onclick="closeUserModal()"></div>
            <div class="modal-container user-view-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-user-circle"></i>
                        <span>User Details - ${user.username}</span>
                    </div>
                    <button class="modal-close" onclick="closeUserModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="user-profile-section">
                        <div class="user-profile-header">
                            <div class="user-avatar-large">
                                ${user.username.charAt(0).toUpperCase()}
                            </div>
                            <div class="user-profile-info">
                                <h3>${user.username}</h3>
                                <p class="user-email">${user.email}</p>
                                <div class="user-stats">
                                    <span class="user-stat ${user.status}">
                                        <i class="fas fa-circle"></i> ${user.status}
                                    </span>
                                    ${user.is_admin ? 
                                        `<span class="user-stat admin ${user.is_super_admin ? 'super-admin' : 'admin'}">
                                            <i class="fas ${user.is_super_admin ? 'fa-crown' : 'fa-user-shield'}"></i>
                                            ${user.is_super_admin ? 'Super Admin' : 'Admin'}
                                        </span>` : ''
                                    }
                                    <span class="user-stat">
                                        <i class="fas fa-calendar"></i>
                                        Joined: ${new Date(user.join_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-details-grid">
                            <!-- Account Information -->
                            <div class="detail-card">
                                <h4><i class="fas fa-user"></i> Account Information</h4>
                                <div class="detail-list">
                                    <div class="detail-item">
                                        <span class="detail-label">User ID:</span>
                                        <span class="detail-value">${user.id}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Referral Code:</span>
                                        <span class="detail-value code">${user.referral_code || 'N/A'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Referred By:</span>
                                        <span class="detail-value">${user.referred_by || 'None'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Account Status:</span>
                                        <span class="detail-value ${user.status}">${user.status}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Last Active:</span>
                                        <span class="detail-value">
                                            ${user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Financial Overview -->
                            <div class="detail-card">
                                <h4><i class="fas fa-chart-line"></i> Financial Overview</h4>
                                <div class="detail-list">
                                    <div class="detail-item">
                                        <span class="detail-label">Current Balance:</span>
                                        <span class="detail-value amount">${db.formatCurrency(user.balance || 0)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Invested:</span>
                                        <span class="detail-value amount">${db.formatCurrency(totalInvested)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Deposits:</span>
                                        <span class="detail-value amount positive">${db.formatCurrency(totalDeposits)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Withdrawals:</span>
                                        <span class="detail-value amount negative">${db.formatCurrency(totalWithdrawals)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Net Profit/Loss:</span>
                                        <span class="detail-value amount ${(user.balance - totalDeposits) >= 0 ? 'positive' : 'negative'}">
                                            ${db.formatCurrency(user.balance - totalDeposits)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Referral Network -->
                            <div class="detail-card">
                                <h4><i class="fas fa-users"></i> Referral Network</h4>
                                <div class="detail-list">
                                    <div class="detail-item">
                                        <span class="detail-label">Total Referrals:</span>
                                        <span class="detail-value">${referralCount}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Active Referrals:</span>
                                        <span class="detail-value">${activeReferrals}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Referral Earnings:</span>
                                        <span class="detail-value amount">
                                            ${db.formatCurrency(user.referral_earnings || 0)}
                                        </span>
                                    </div>
                                </div>
                                ${user.referrals && user.referrals.length > 0 ? `
                                    <div class="referrals-list">
                                        <h5>Recent Referrals:</h5>
                                        ${user.referrals.slice(0, 3).map(ref => `
                                            <div class="referral-item">
                                                <span>${ref.username}</span>
                                                <span class="status ${ref.bonus_paid ? 'paid' : 'pending'}">
                                                    ${ref.bonus_paid ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Current Activity -->
                            <div class="detail-card">
                                <h4><i class="fas fa-chart-pie"></i> Current Activity</h4>
                                <div class="detail-list">
                                    <div class="detail-item">
                                        <span class="detail-label">Active Investments:</span>
                                        <span class="detail-value">${activeInvestments.length}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Completed Investments:</span>
                                        <span class="detail-value">
                                            ${user.investments ? user.investments.filter(inv => inv.completed).length : 0}
                                        </span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Transactions:</span>
                                        <span class="detail-value">${user.transactions ? user.transactions.length : 0}</span>
                                    </div>
                                </div>
                                ${activeInvestments.length > 0 ? `
                                    <div class="investments-preview">
                                        <h5>Active Investments:</h5>
                                        ${activeInvestments.slice(0, 2).map(inv => `
                                            <div class="investment-preview-item">
                                                <i class="fas fa-gem"></i>
                                                <span>${inv.mineral} - ${db.formatCurrency(inv.cost || 0)}</span>
                                                <span class="progress">${calculateProgress(inv)}%</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Recent Transactions -->
                        ${latestTransactions.length > 0 ? `
                            <div class="transactions-section">
                                <h4><i class="fas fa-history"></i> Recent Transactions</h4>
                                <div class="transactions-list">
                                    ${latestTransactions.map(tx => `
                                        <div class="transaction-item ${tx.type}">
                                            <div class="transaction-icon ${tx.type}">
                                                <i class="fas fa-${tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                                            </div>
                                            <div class="transaction-details">
                                                <div class="transaction-type">${tx.type.toUpperCase()}</div>
                                                <div class="transaction-amount ${tx.status}">
                                                    ${db.formatCurrency(tx.amount)}
                                                </div>
                                            </div>
                                            <div class="transaction-meta">
                                                <div class="transaction-date">
                                                    ${new Date(tx.date).toLocaleDateString()}
                                                </div>
                                                <div class="transaction-status ${tx.status}">
                                                    ${tx.status}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn btn-edit" onclick="editUser(${user.id}); closeUserModal();">
                        <i class="fas fa-edit"></i> Edit User
                    </button>
                    <button class="modal-btn btn-${user.status === 'active' ? 'suspend' : 'activate'}" 
                            onclick="${user.status === 'active' ? 'suspendUser' : 'activateUser'}(${user.id}); closeUserModal();">
                        <i class="fas fa-${user.status === 'active' ? 'pause' : 'play'}"></i>
                        ${user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button class="btn-secondary" onclick="viewUserTransactions(${user.id})">
                                <i class="fas fa-exchange-alt"></i> View All Transactions
                    </button>
                    <button class="modal-btn btn-close" onclick="closeUserModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                    
                </div>
            </div>
        `;
        
        // Create or update modal
        let modal = document.getElementById('user-view-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-view-modal';
            modal.className = 'user-modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalContent;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error viewing user:', error);
        alert('Error loading user details. Please try again.');
    }
}

// Helper function to calculate investment progress
function calculateProgress(investment) {
    if (investment.completed) return 100;
    
    const start = new Date(investment.startTime);
    const end = new Date(start.getTime() + (investment.days * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (now >= end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
}


// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Calculate user net profit
function calculateUserNetProfit(user) {
    if (!user.investments || !Array.isArray(user.investments)) return 0;
    
    let totalProfit = 0;
    let totalInvested = 0;
    
    user.investments.forEach(investment => {
        totalInvested += investment.cost || 0;
        
        if (investment.completed) {
            totalProfit += investment.finalProfit || 0;
        } else {
            // Calculate current profit for active investments
            const currentProfit = calculateCurrentProfit(investment);
            totalProfit += currentProfit;
        }
    });
    
    return totalProfit;
}

// Calculate investment progress
function calculateProgress(investment) {
    if (investment.completed) return 100;
    
    const start = new Date(investment.startTime);
    const end = new Date(start.getTime() + (investment.days * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (now >= end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
}

// Setup event listeners
function setupSuperAdminEventListeners() {
    // Admin search
    const adminSearch = document.getElementById('admin-search');
    if (adminSearch) {
        adminSearch.addEventListener('input', debounce(filterAdminsTable, 300));
    }
    
    // User search
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(filterUsersTable, 300));
    }
    
    // Add admin button
    const addAdminBtn = document.querySelector('button[onclick="openAddAdminModal()"]');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddAdminModal);
    }
}

// Debounce function for search
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

// Filter admins table
function filterAdminsTable() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const rows = document.querySelectorAll('#admins-table-body tr.admin-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter users table
function filterUsersTable() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr.user-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Toggle user password visibility
function toggleUserPassword(userId, button) {
    const row = button.closest('tr');
    const passwordCell = row.querySelector('.password-cell');
    const maskedSpan = passwordCell.querySelector('.password-masked');
    const icon = button.querySelector('i');
    
    if (maskedSpan.dataset.revealed === 'true') {
        // Hide password
        maskedSpan.textContent = '••••••••';
        maskedSpan.dataset.revealed = 'false';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.title = 'Show Password';
    } else {
        // Show password
        const actualPassword = maskedSpan.dataset.password;
        maskedSpan.textContent = actualPassword;
        maskedSpan.dataset.revealed = 'true';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.title = 'Hide Password';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (maskedSpan.dataset.revealed === 'true') {
                maskedSpan.textContent = '••••••••';
                maskedSpan.dataset.revealed = 'false';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                button.title = 'Show Password';
            }
        }, 10000);
    }
}

// Chat with admin
async function chatWithAdmin(adminId) {
    if (!window.chatSystem) {
        showNotification('Chat system not available', true);
        return;
    }
    
    const admin = await db.findUserById(adminId);
    if (!admin || admin.status !== 'active') {
        showNotification('Admin is not available for chat', true);
        return;
    }
    
    // Open admin chat modal and select this admin
    window.chatSystem.openAdminChatModal();
    
    // Need to wait a bit for modal to open
    setTimeout(() => {
        if (window.chatSystem.selectUserChat) {
            window.chatSystem.selectUserChat(adminId);
        }
    }, 500);
}

// Chat with user
async function chatWithUser(userId) {
    if (!window.chatSystem) {
        showNotification('Chat system not available', true);
        return;
    }
    
    const user = await db.findUserById(userId);
    if (!user || user.status !== 'active') {
        showNotification('User is not available for chat', true);
        return;
    }
    
    // Open admin chat modal and select this user
    window.chatSystem.openAdminChatModal();
    
    // Need to wait a bit for modal to open
    setTimeout(() => {
        if (window.chatSystem.selectUserChat) {
            window.chatSystem.selectUserChat(userId);
        }
    }, 500);
}

// View user investments
async function viewUserInvestments(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user) {
            showNotification('User not found', true);
            return;
        }
        
        const investments = user.investments || [];
        
        if (investments.length === 0) {
            showNotification('This user has no investments', true);
            return;
        }
        
        // Sort investments by date (newest first)
        const sortedInvestments = investments.sort((a, b) => {
            const dateA = new Date(a.startTime || 0);
            const dateB = new Date(b.startTime || 0);
            return dateB - dateA;
        });
        
        // Group investments by status
        const activeInvestments = sortedInvestments.filter(inv => !inv.completed);
        const completedInvestments = sortedInvestments.filter(inv => inv.completed);
        
        // Calculate totals
        const totalInvested = sortedInvestments.reduce((sum, inv) => sum + (inv.cost || 0), 0);
        const totalProfit = sortedInvestments.reduce((sum, inv) => {
            if (inv.completed) {
                return sum + (inv.finalProfit || 0);
            } else {
                return sum + calculateCurrentProfit(inv);
            }
        }, 0);
        
        // Create modal content
        let modalContent = `
            <div class="user-investments-modal">
                <div class="modal-header">
                    <h3>${user.username}'s Investments</h3>
                    <button class="close-modal" onclick="closeModal('user-investments-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="investment-summary">
                        <div class="summary-card">
                            <div class="summary-label">Total Investments</div>
                            <div class="summary-value">${sortedInvestments.length}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Invested</div>
                            <div class="summary-value">${db.formatCurrency ? db.formatCurrency(totalInvested) : `TZS ${Math.round(totalInvested).toLocaleString()}`}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Profit</div>
                            <div class="summary-value ${totalProfit >= 0 ? 'positive' : 'negative'}">
                                ${db.formatCurrency ? db.formatCurrency(totalProfit) : `TZS ${Math.round(totalProfit).toLocaleString()}`}
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Active Investments</div>
                            <div class="summary-value">${activeInvestments.length}</div>
                        </div>
                    </div>
        `;
        
        // Active investments section
        if (activeInvestments.length > 0) {
            modalContent += `
                <div class="investments-section">
                    <h4>Active Investments (${activeInvestments.length})</h4>
                    <div class="investments-list">
            `;
            
            activeInvestments.forEach(investment => {
                const currentProfit = calculateCurrentProfit(investment);
                const profitPercentage = investment.cost > 0 ? (currentProfit / investment.cost * 100) : 0;
                const startDate = new Date(investment.startTime);
                const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
                const now = new Date();
                const progress = Math.min(100, ((now - startDate) / (endDate - startDate)) * 100);
                
                modalContent += `
                    <div class="investment-item active">
                        <div class="investment-header">
                            <span class="mineral-name">${investment.mineral}</span>
                            <span class="investment-status active">Active</span>
                        </div>
                        <div class="investment-details">
                            <div>Amount: ${db.formatCurrency ? db.formatCurrency(investment.cost) : `TZS ${Math.round(investment.cost).toLocaleString()}`}</div>
                            <div>Duration: ${investment.days} days</div>
                            <div>Current Profit: ${db.formatCurrency ? db.formatCurrency(currentProfit) : `TZS ${Math.round(currentProfit).toLocaleString()}`} (${profitPercentage.toFixed(2)}%)</div>
                            <div>Progress: ${progress.toFixed(1)}%</div>
                            <div>Ends: ${endDate.toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
            });
            
            modalContent += `
                    </div>
                </div>
            `;
        }
        
        // Completed investments section
        if (completedInvestments.length > 0) {
            modalContent += `
                <div class="investments-section">
                    <h4>Completed Investments (${completedInvestments.length})</h4>
                    <div class="investments-list">
            `;
            
            completedInvestments.slice(0, 5).forEach(investment => {
                const profitPercentage = investment.cost > 0 ? (investment.finalProfit / investment.cost * 100) : 0;
                const completionDate = new Date(investment.completionDate || investment.startTime);
                
                modalContent += `
                    <div class="investment-item completed">
                        <div class="investment-header">
                            <span class="mineral-name">${investment.mineral}</span>
                            <span class="investment-status completed">Completed</span>
                        </div>
                        <div class="investment-details">
                            <div>Amount: ${db.formatCurrency ? db.formatCurrency(investment.cost) : `TZS ${Math.round(investment.cost).toLocaleString()}`}</div>
                            <div>Final Profit: ${db.formatCurrency ? db.formatCurrency(investment.finalProfit) : `TZS ${Math.round(investment.finalProfit).toLocaleString()}`} (${profitPercentage.toFixed(2)}%)</div>
                            <div>Completed: ${completionDate.toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
            });
            
            if (completedInvestments.length > 5) {
                modalContent += `<p class="more-items">+ ${completedInvestments.length - 5} more completed investments</p>`;
            }
            
            modalContent += `
                    </div>
                </div>
            `;
        }
        
        modalContent += `
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="exportUserInvestments(${userId})">
                            <i class="fas fa-download"></i> Export as CSV
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal(`${user.username}'s Investments`, modalContent, 'user-investments-modal');
        
    } catch (error) {
        console.error('Error viewing user investments:', error);
        showNotification('Error loading user investments', true);
    }
}


// View user transactions
async function viewUserTransactions(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user) {
            showNotification('User not found', true);
            return;
        }
        
        const transactions = user.transactions || [];
        
        if (transactions.length === 0) {
            showNotification('This user has no transactions', true);
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });
        
        // Calculate totals
        const totalDeposits = sortedTransactions
            .filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalWithdrawals = sortedTransactions
            .filter(t => t.type === 'withdrawal' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const pendingTransactions = sortedTransactions.filter(t => t.status === 'pending');
        
        // Create modal content
        let modalContent = `
            <div class="user-transactions-modal">
                <div class="modal-header">
                    <h3>${user.username}'s Transactions</h3>
                    <button class="close-modal" onclick="closeModal('user-transactions-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="transaction-summary">
                        <div class="summary-card">
                            <div class="summary-label">Total Transactions</div>
                            <div class="summary-value">${sortedTransactions.length}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Deposits</div>
                            <div class="summary-value">${db.formatCurrency ? db.formatCurrency(totalDeposits) : `TZS ${Math.round(totalDeposits).toLocaleString()}`}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Withdrawals</div>
                            <div class="summary-value">${db.formatCurrency ? db.formatCurrency(totalWithdrawals) : `TZS ${Math.round(totalWithdrawals).toLocaleString()}`}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Pending</div>
                            <div class="summary-value">${pendingTransactions.length}</div>
                        </div>
                    </div>
                    
                    <div class="transactions-section">
                        <h4>Recent Transactions</h4>
                        <div class="transactions-table-container">
                            <table class="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;
        
        // Add transaction rows (limit to 20 for performance)
        sortedTransactions.slice(0, 20).forEach(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-TZ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const amount = db.formatCurrency ?
                db.formatCurrency(transaction.amount) :
                `TZS ${Math.round(transaction.amount || 0).toLocaleString()}`;
            
            const statusClass = transaction.status === 'approved' ? 'approved' :
                transaction.status === 'pending' ? 'pending' : 'rejected';
            
            modalContent += `
                <tr class="transaction-row ${statusClass}">
                    <td>${formattedDate}</td>
                    <td>
                        <span class="transaction-type ${transaction.type}">
                            ${transaction.type === 'deposit' ? 'Deposit' : 
                             transaction.type === 'withdrawal' ? 'Withdrawal' : 
                             transaction.type === 'investment' ? 'Investment' : 
                             transaction.type === 'bonus' ? 'Bonus' : transaction.type}
                        </span>
                    </td>
                    <td>${amount}</td>
                    <td>${transaction.method || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${transaction.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn-small" onclick="viewTransactionDetails(${userId}, ${transaction.id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        modalContent += `
                                </tbody>
                            </table>
                        </div>
                        ${sortedTransactions.length > 20 ? 
                            `<p class="more-items">+ ${sortedTransactions.length - 20} more transactions</p>` : ''}
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="exportUserTransactions(${userId})">
                            <i class="fas fa-download"></i> Export as CSV
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal(`${user.username}'s Transactions`, modalContent, 'user-transactions-modal');
        
    } catch (error) {
        console.error('Error viewing user transactions:', error);
        showNotification('Error loading user transactions', true);
    }
}

// Reset user password
async function resetUserPassword(userId) {
    if (!confirm('Are you sure you want to reset this user\'s password? They will need to set a new password on next login.')) {
        return;
    }
    
    try {
        const user = await db.findUserById(userId);
        if (!user) {
            showNotification('User not found', true);
            return;
        }
        
        // Generate a temporary password
        const tempPassword = generateTemporaryPassword();
        
        // Update user password in database
        const success = await db.updateUser(userId, {
            password: tempPassword,
            force_password_reset: true
        });
        
        if (success) {
            showNotification(`✅ Password reset successfully. Temporary password: ${tempPassword}. User will be forced to change it on next login.`);
            
            // Copy password to clipboard
            navigator.clipboard.writeText(tempPassword)
                .then(() => console.log('Temporary password copied to clipboard'))
                .catch(err => console.error('Failed to copy:', err));
                
        } else {
            showNotification('❌ Failed to reset password', true);
        }
        
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        showNotification('Error resetting password', true);
    }
}

// Generate temporary password
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '@123'; // Add complexity requirement
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const success = await db.updateUser(userId, { status: newStatus });
        
        if (success) {
            showNotification(`✅ User ${action}d successfully`);
            loadUsersList();
        } else {
            showNotification(`❌ Failed to ${action} user`, true);
        }
        
    } catch (error) {
        console.error(`❌ Error ${action}ing user:`, error);
        showNotification(`Error ${action}ing user`, true);
    }
}

// Show delete user confirmation
function showDeleteUserConfirmation(userId) {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;
    
    const message = `
        Are you sure you want to delete this user?
        
        User: ${user.username}
        Email: ${user.email}
        Balance: ${db.formatCurrency ? db.formatCurrency(user.balance) : `TZS ${Math.round(user.balance).toLocaleString()}`}
        
        This action cannot be undone!
    `;
    
    if (confirm(message)) {
        deleteUser(userId);
    }
}

// Delete user
async function deleteUser(userId) {
    try {
        const user = await db.findUserById(userId);
        if (user.is_admin || user.is_super_admin) {
            showNotification('Cannot delete admin users through this interface', true);
            return;
        }
        
        // Check if user has balance
        if (user.balance > 0) {
            if (!confirm(`This user has a balance of ${db.formatCurrency ? db.formatCurrency(user.balance) : `TZS ${Math.round(user.balance).toLocaleString()}`}. Are you sure you want to delete them?`)) {
                return;
            }
        }
        
        const success = await db.deleteUser(userId);
        
        if (success) {
            showNotification('✅ User deleted successfully');
            loadUsersList();
        } else {
            showNotification('❌ Failed to delete user', true);
        }
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        showNotification('Error deleting user', true);
    }
}

// Close user modal
function closeUserModal() {
    const modals = document.querySelectorAll('.user-modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    document.body.style.overflow = 'auto';
    currentEditingUserId = null;
    currentEditingAdminId = null;
}

// Start real-time updates
function startSuperAdminRealTimeUpdates() {
    // Update stats every 30 seconds
    setInterval(() => {
        loadSuperAdminStats();
    }, 30000);
    
    // Listen for user changes in Firebase
    if (db && db.db) {
        const usersRef = db.db.collection('users');
        
        usersRef.onSnapshot((snapshot) => {
            console.log('🔄 Real-time user update detected');
            loadAdminsList();
            loadUsersList();
            loadSuperAdminStats();
        });
    }
}

// Refresh user list
function refreshUserList() {
    loadUsersList();
    showNotification('✅ User list refreshed');
}

// ==============================================
// ADD ADMIN MODAL FUNCTIONS
// ==============================================

// Open add admin modal
function openAddAdminModal() {
    const modalContent = `
        <div class="modal-overlay" onclick="closeUserModal()"></div>
        <div class="modal-container add-admin-modal">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-user-plus"></i>
                    <span>Add New Admin</span>
                </div>
                <button class="modal-close" onclick="closeUserModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="add-admin-form" onsubmit="return submitAddAdminForm(event)">
                    <div class="form-section">
                        <h4><i class="fas fa-user"></i> Basic Information</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="add-admin-username">Username *</label>
                                <input type="text" id="add-admin-username" placeholder="Enter username" required>
                            </div>
                            <div class="form-group">
                                <label for="add-admin-email">Email Address *</label>
                                <input type="email" id="add-admin-email" placeholder="Enter email" required>
                            </div>
                            <div class="form-group">
                                <label for="add-admin-role">Admin Role *</label>
                                <select id="add-admin-role" required>
                                    <option value="">Select Role</option>
                                    <option value="support_admin">Support Admin</option>
                                    <option value="transaction_admin">Transaction Admin</option>
                                    <option value="investment_admin">Investment Admin</option>
                                    <option value="full_admin">Full Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4><i class="fas fa-key"></i> Security</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="add-admin-password">Password *</label>
                                <div class="password-input-group">
                                    <input type="password" id="add-admin-password" placeholder="Enter password" required>
                                    <button type="button" class="password-toggle" onclick="toggleEditPassword('add-admin-password', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="add-admin-confirm-password">Confirm Password *</label>
                                <div class="password-input-group">
                                    <input type="password" id="add-admin-confirm-password" placeholder="Confirm password" required>
                                    <button type="button" class="password-toggle" onclick="toggleEditPassword('add-admin-confirm-password', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4><i class="fas fa-shield-alt"></i> Permissions</h4>
                        <div class="permissions-grid">
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="user_management" checked>
                                User Management
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="transaction_approval" checked>
                                Transaction Approval
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="chat_support" checked>
                                Chat Support
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="investment_management">
                                Investment Management
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="report_viewing">
                                Report Viewing
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="announcements">
                                Announcements
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="permissions" value="settings">
                                Settings
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeUserModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-user-plus"></i> Add Admin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Create or update modal
    let modal = document.getElementById('add-admin-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-admin-modal';
        modal.className = 'user-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalContent;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Submit add admin form
async function submitAddAdminForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    try {
        // Get form values
        const username = document.getElementById('add-admin-username').value.trim();
        const email = document.getElementById('add-admin-email').value.trim().toLowerCase();
        const password = document.getElementById('add-admin-password').value;
        const confirmPassword = document.getElementById('add-admin-confirm-password').value;
        const role = document.getElementById('add-admin-role').value;
        
        // Get selected permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]:checked');
        const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
        
        // Validate inputs
        if (!username || !email || !password || !confirmPassword || !role) {
            showNotification('Please fill in all required fields', true);
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', true);
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', true);
            return;
        }
        
        // Check if email already exists
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            showNotification('Email already registered', true);
            return;
        }
        
        // Check if username already exists
        const existingUsername = await db.findUserByUsername(username);
        if (existingUsername) {
            showNotification('Username already taken', true);
            return;
        }
        
        // Create admin data object
        const adminData = {
            username: username,
            email: email,
            password: password,
            admin_password: password,
            role: role,
            permissions: permissions,
            is_admin: true,
            is_super_admin: false
        };
        
        // Create the admin user
        const newAdmin = await createAdminUser(adminData);
        
        if (newAdmin) {
            showNotification('✅ Admin added successfully!');
            
            // Show credentials
            const credentialsMessage = `
                Admin Created Successfully!
                
                Username: ${newAdmin.username}
                Email: ${newAdmin.email}
                Password: ${password}
                Admin Role: ${newAdmin.admin_role}
                
                Please save these credentials and share them securely with the admin.
            `;
            
            alert(credentialsMessage);
            
            closeUserModal();
            loadAdminsList();
            
            // Reset form
            form.reset();
        } else {
            showNotification('❌ Failed to create admin', true);
        }
        
    } catch (error) {
        console.error('❌ Error adding admin:', error);
        showNotification('Error adding admin: ' + error.message, true);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Admin';
    }
}

// Create admin user
async function createAdminUser(adminData) {
    try {
        console.log('👑 Creating admin user:', adminData.username);
        
        // Get next user ID
        const nextId = await db.getNextId();
        console.log('Next user ID:', nextId);
        
        // Generate unique referral code
        const referralCode = await db.generateUniqueReferralCode();
        console.log('Generated referral code:', referralCode);
        
        // Determine if this should be a super admin
        const isSuperAdmin = adminData.email.toLowerCase() === 'kingharuni420@gmail.com';
        const isAdmin = adminData.is_admin !== false;
        
        // Get role-specific permissions
        let permissions = adminData.permissions || [];
        let adminRole = adminData.role || 'admin';
        
        // Set permissions based on role
        switch(adminData.role) {
            case 'support_admin':
                permissions = ['chat_support', 'user_management'];
                break;
            case 'transaction_admin':
                permissions = ['transaction_approval', 'user_management'];
                break;
            case 'investment_admin':
                permissions = ['investment_management', 'report_viewing'];
                break;
            case 'full_admin':
                permissions = ['user_management', 'transaction_approval', 'chat_support', 
                             'investment_management', 'report_viewing', 'announcements', 'settings'];
                break;
            case 'super_admin':
                permissions = ['all'];
                adminRole = 'super_admin';
                break;
            default:
                permissions = ['user_management', 'transaction_approval', 'chat_support'];
        }
        
        // Create admin object
        const newAdmin = {
            id: nextId,
            username: adminData.username.toLowerCase(),
            email: adminData.email.toLowerCase(),
            password: adminData.password,
            admin_password: adminData.admin_password || adminData.password,
            referral_code: referralCode,
            referred_by: null,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: isAdmin,
            is_super_admin: isSuperAdmin,
            admin_role: adminRole,
            permissions: permissions,
            balance: 0,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false,
            email_verified: true,
            last_active: null,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('💾 Saving admin to Firestore:', {
            id: newAdmin.id,
            username: newAdmin.username,
            email: newAdmin.email,
            is_admin: newAdmin.is_admin,
            is_super_admin: newAdmin.is_super_admin,
            admin_role: newAdmin.admin_role
        });
        
        // Save to Firestore
        await db.db.collection('users').doc(nextId.toString()).set(newAdmin);
        
        console.log('✅ Admin saved successfully');
        return newAdmin;
        
    } catch (error) {
        console.error('❌ Error in createAdminUser:', error);
        throw new Error(`Failed to create admin: ${error.message}`);
    }
}

// Show highest investors
async function showHighestInvestors() {
    try {
        const leaderboard = await db.getInvestmentLeaderboard(10);
        
        if (leaderboard.length === 0) {
            showNotification('No investment data available', true);
            return;
        }
        
        let modalContent = `
            <div class="highest-investors-modal">
                <div class="modal-header">
                    <h3>Top Investors</h3>
                    <button class="close-modal" onclick="closeModal('highest-investors-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="time-period-selector">
                        <button class="period-btn active" onclick="changeInvestorPeriod('all')">All Time</button>
                        <button class="period-btn" onclick="changeInvestorPeriod('weekly')">Weekly</button>
                        <button class="period-btn" onclick="changeInvestorPeriod('monthly')">Monthly</button>
                        <button class="period-btn" onclick="changeInvestorPeriod('yearly')">Yearly</button>
                    </div>
                    
                    <div class="investors-list" id="investors-list-content">
                        ${createInvestorsListHTML(leaderboard)}
                    </div>
                </div>
            </div>
        `;
        
        showCustomModal('Top Investors', modalContent, 'highest-investors-modal');
        
    } catch (error) {
        console.error('Error loading highest investors:', error);
        showNotification('Error loading investor data', true);
    }
}

// Create investors list HTML
function createInvestorsListHTML(investors) {
    let html = '<table class="investors-table"><thead><tr>';
    html += '<th>Rank</th><th>User</th><th>Total Invested</th><th>Total Profit</th><th>Active</th><th>Actions</th></tr></thead><tbody>';
    
    investors.forEach((investor, index) => {
        html += `
            <tr class="investor-row">
                <td>
                    <div class="rank rank-${index + 1}">
                        ${index + 1}
                    </div>
                </td>
                <td>
                    <div class="investor-info">
                        <div class="investor-avatar">${investor.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="investor-name">${investor.username}</div>
                            <div class="investor-email">${investor.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="invested-amount">
                        ${db.formatCurrency ? db.formatCurrency(investor.totalInvested) : `TZS ${Math.round(investor.totalInvested).toLocaleString()}`}
                    </div>
                </td>
                <td>
                    <div class="profit-amount ${investor.totalProfit >= 0 ? 'positive' : 'negative'}">
                        ${db.formatCurrency ? db.formatCurrency(investor.totalProfit) : `TZS ${Math.round(investor.totalProfit).toLocaleString()}`}
                    </div>
                </td>
                <td>
                    <div class="active-count">
                        ${investor.activeInvestments || 0} active
                    </div>
                </td>
                <td>
                    <div class="investor-actions">
                        <button class="btn-small" onclick="viewUserInvestments(${investor.id})" title="View Investments">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn-small" onclick="chatWithUser(${investor.id})" title="Chat">
                            <i class="fas fa-comment"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

// Change investor period
async function changeInvestorPeriod(period) {
    try {
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(period)) {
                btn.classList.add('active');
            }
        });
        
        let investors;
        if (period === 'all') {
            investors = await db.getInvestmentLeaderboard(10);
        } else {
            investors = await db.getHighestInvestors(period);
        }
        
        const investorsList = document.getElementById('investors-list-content');
        if (investorsList) {
            investorsList.innerHTML = createInvestorsListHTML(investors);
        }
        
    } catch (error) {
        console.error(`Error loading ${period} investors:`, error);
        showNotification(`Error loading ${period} investor data`, true);
    }
}

// ==============================================
// STYLES FOR ADMIN & USER MANAGEMENT
// ==============================================

function addSuperAdminManagementStyles() {
    if (!document.getElementById('super-admin-management-styles')) {
        const styles = document.createElement('style');
        styles.id = 'super-admin-management-styles';
        styles.textContent = `
            /* Super Admin Management Styles */
            .management-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f1f1f1;
            }
            
            .admin-stats, .user-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0 30px;
            }
            
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-card > div:first-child {
                font-size: 14px;
                color: #7f8c8d;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .stat-number {
                font-size: 36px;
                font-weight: bold;
                color: #2c3e50;
            }
            
            .search-box {
                margin: 20px 0;
            }
            
            .search-box input {
                width: 100%;
                padding: 12px 20px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .search-box input:focus {
                border-color: #3498db;
                outline: none;
            }
            
            .filters {
                display: flex;
                gap: 10px;
                margin: 20px 0;
            }
            
            .filters select {
                padding: 10px 15px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                cursor: pointer;
            }
            
            .table-container {
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-top: 20px;
                overflow-x: auto;
            }
            
            .user-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 1000px;
            }
            
            .user-table th {
                background: #2c3e50;
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
                position: sticky;
                top: 0;
            }
            
            .user-table td {
                padding: 15px;
                border-bottom: 1px solid #eee;
                vertical-align: middle;
            }
            
            .user-table tr:hover {
                background: #f8f9fa;
            }
            
            .admin-info, .user-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .admin-avatar, .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                color: white;
            }
            
            .admin-avatar.super-admin {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
            }
            
            .admin-avatar.regular-admin {
                background: #3498db;
            }
            
            .user-avatar {
                background: #9b59b6;
            }
            
            .admin-name, .user-name {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .admin-id, .user-id, .user-ref {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .user-meta {
                display: flex;
                gap: 10px;
                margin-top: 5px;
            }
            
            .role-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
            }
            
            .super-admin-badge {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
            }
            
            .admin-badge {
                background: #3498db;
                color: white;
            }
            
            .permissions-cell {
                max-width: 250px;
            }
            
            .permissions-list {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .permission-badge {
                padding: 4px 8px;
                background: #ecf0f1;
                border-radius: 12px;
                font-size: 11px;
                color: #2c3e50;
                white-space: nowrap;
            }
            
            .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
            }
            
            .status-active {
                background: #27ae60;
                color: white;
            }
            
            .status-inactive {
                background: #e74c3c;
                color: white;
            }
            
            .last-active {
                font-size: 13px;
            }
            
            .last-active.online {
                color: #27ae60;
                font-weight: bold;
            }
            
            .last-active.recent {
                color: #f39c12;
            }
            
            .last-active.away {
                color: #7f8c8d;
            }
            
            .last-active.offline {
                color: #95a5a6;
            }
            
            .password-cell {
                min-width: 150px;
            }
            
            .password-display {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .password-masked {
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
            }
            
            .btn-show-password {
                width: 30px;
                height: 30px;
                border: none;
                background: #ecf0f1;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .btn-show-password:hover {
                background: #3498db;
                color: white;
            }
            
            .referral-code {
                font-family: 'Courier New', monospace;
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .balance-display {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .total-deposits {
                font-size: 11px;
                color: #7f8c8d;
                margin-top: 5px;
            }
            
            .admin-actions, .user-actions {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
            }
            
            .btn-action {
                width: 35px;
                height: 35px;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .btn-action.view {
                background: #3498db;
                color: white;
            }
            
            .btn-action.chat {
                background: #2ecc71;
                color: white;
            }
            
            .btn-action.edit {
                background: #f39c12;
                color: white;
            }
            
            .btn-action.investments {
                background: #9b59b6;
                color: white;
            }
            
            .btn-action.transactions {
                background: #1abc9c;
                color: white;
            }
            
            .btn-action.reset-password {
                background: #34495e;
                color: white;
            }
            
            .btn-action.status {
                background: #e74c3c;
                color: white;
            }
            
            .btn-action.deactivate {
                background: #e74c3c;
                color: white;
            }
            
            .btn-action.delete {
                background: #c0392b;
                color: white;
            }
            
            .btn-action.disabled {
                background: #bdc3c7;
                cursor: not-allowed;
            }
            
            .btn-action:hover:not(:disabled) {
                transform: scale(1.1);
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            }
            
            .btn-action:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Loading Spinner */
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Form Tabs */
            .form-tabs {
                margin-bottom: 20px;
            }
            
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #f1f1f1;
                padding-bottom: 10px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                border: none;
                background: #ecf0f1;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .tab-btn.active {
                background: #3498db;
                color: white;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Form Elements */
            .form-section {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f1f8ff;
            }
            
            .form-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            .form-section h4 {
                margin: 0 0 20px 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-group label {
                font-weight: 600;
                color: #5d6d7e;
                font-size: 14px;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                padding: 10px 12px;
                border: 2px solid #e8f4fc;
                border-radius: 6px;
                font-size: 14px;
                transition: border 0.3s;
            }
            
            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            
            .password-input-group {
                position: relative;
            }
            
            .password-input-group input {
                width: 100%;
                padding-right: 40px;
            }
            
            .password-toggle {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #7f8c8d;
                cursor: pointer;
                font-size: 14px;
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                cursor: pointer;
                padding: 8px;
                background: white;
                border-radius: 6px;
                border: 2px solid #e8f4fc;
                transition: all 0.3s;
            }
            
            .checkbox-label:hover {
                border-color: #3498db;
                background: #f1f8ff;
            }
            
            .permissions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .form-help {
                font-size: 12px;
                color: #7f8c8d;
                margin-top: 4px;
            }
            
            .stats-display {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            
            .stat-item:last-child {
                border-bottom: none;
            }
            
            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #f1f1f1;
            }
            
            .btn-primary, .btn-secondary, .btn-warning, .btn-danger, .btn-success {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #3498db;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2980b9;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #5a6268;
            }
            
            .btn-warning {
                background: #ffc107;
                color: #212529;
            }
            
            .btn-warning:hover {
                background: #e0a800;
            }
            
            .btn-danger {
                background: #dc3545;
                color: white;
            }
            
            .btn-danger:hover {
                background: #c82333;
            }
            
            .btn-success {
                background: #28a745;
                color: white;
            }
            
            .btn-success:hover {
                background: #218838;
            }
            
            /* Modal Styles */
            .user-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(5px);
            }
            
            .modal-container {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 10001;
                position: relative;
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .modal-header {
                padding: 20px 30px;
                border-bottom: 2px solid #f1f8ff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #f8fbfe, #e3f2fd);
            }
            
            .modal-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 18px;
                font-weight: 700;
                color: #2c3e50;
            }
            
            .modal-title i {
                color: #3498db;
                font-size: 20px;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #7f8c8d;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .modal-close:hover {
                color: #e74c3c;
            }
            
            .modal-body {
                padding: 30px;
            }
            
            /* User View Modal Specific */
            .user-profile-section, .admin-profile-section {
                margin-bottom: 30px;
            }
            
            .user-profile-header, .admin-profile-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f1f8ff;
            }
            
            .user-avatar-large, .admin-avatar-large {
                width: 80px;
                height: 80px;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: bold;
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
            
            .user-avatar-large {
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
            }
            
            .admin-avatar-large.super-admin {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
            }
            
            .admin-avatar-large.regular-admin {
                background: linear-gradient(135deg, #3498db, #2980b9);
            }
            
            .user-profile-info h3, .admin-profile-info h3 {
                margin: 0 0 5px 0;
                color: #2c3e50;
                font-size: 24px;
            }
            
            .user-email, .admin-email {
                color: #7f8c8d;
                margin: 0 0 10px 0;
            }
            
            .user-stats, .admin-stats {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .user-stat, .admin-stat {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .user-stat i, .admin-stat i {
                font-size: 10px;
            }
            
            .user-stat.active, .admin-stat.active {
                background: #d4edda;
                color: #155724;
            }
            
            .user-stat.inactive, .admin-stat.inactive {
                background: #f8d7da;
                color: #721c24;
            }
            
            .user-stat.admin, .admin-stat.admin {
                background: #d1ecf1;
                color: #0c5460;
            }
            
            .user-stat.super-admin, .admin-stat.super-admin {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #333;
            }
            
            .user-details-grid, .admin-details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .detail-card {
                background: #f8fbfe;
                border-radius: 10px;
                padding: 20px;
                border: 2px solid #e8f4fc;
            }
            
            .detail-card h4 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .detail-card h4 i {
                color: #3498db;
            }
            
            .detail-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 12px;
                border-bottom: 1px solid #e8f4fc;
            }
            
            .detail-item:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }
            
            .detail-label {
                color: #5d6d7e;
                font-weight: 600;
                font-size: 14px;
            }
            
            .detail-value {
                font-weight: 700;
                color: #2c3e50;
            }
            
            .detail-value.amount {
                color: #2c3e50;
            }
            
            .detail-value.positive {
                color: #27ae60;
            }
            
            .detail-value.negative {
                color: #e74c3c;
            }
            
            .detail-value.code {
                background: #f1f8ff;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                border: 1px dashed #3498db;
            }
            
            .permissions-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .permission-tag {
                padding: 6px 12px;
                background: #3498db;
                color: white;
                border-radius: 20px;
                font-size: 12px;
            }
            
            .referrals-list, .investments-preview {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e8f4fc;
            }
            
            .referrals-list h5, .investments-preview h5 {
                margin: 0 0 10px 0;
                color: #5d6d7e;
                font-size: 14px;
            }
            
            .referral-item, .investment-preview-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: white;
                border-radius: 6px;
                margin-bottom: 5px;
                border: 1px solid #f1f8ff;
            }
            
            .referral-item .status {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .status.paid {
                background: #d4edda;
                color: #155724;
            }
            
            .status.pending {
                background: #fff3cd;
                color: #856404;
            }
            
            .investment-preview-item i {
                color: #9b59b6;
            }
            
            .investment-preview-item .progress {
                background: #3498db;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .transactions-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #f1f8ff;
            }
            
            .transactions-section h4 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .transactions-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .transaction-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px;
                background: #f8fbfe;
                border-radius: 8px;
                border-left: 4px solid;
            }
            
            .transaction-item.deposit {
                border-left-color: #27ae60;
            }
            
            .transaction-item.withdrawal {
                border-left-color: #e74c3c;
            }
            
            .transaction-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .transaction-icon.deposit {
                background: #d4edda;
                color: #27ae60;
            }
            
            .transaction-icon.withdrawal {
                background: #f8d7da;
                color: #e74c3c;
            }
            
            .transaction-details {
                flex: 1;
            }
            
            .transaction-type {
                font-weight: 600;
                color: #2c3e50;
                font-size: 14px;
            }
            
            .transaction-amount {
                font-weight: 700;
                font-size: 16px;
            }
            
            .transaction-amount.approved {
                color: #27ae60;
            }
            
            .transaction-amount.pending {
                color: #f39c12;
            }
            
            .transaction-amount.rejected {
                color: #e74c3c;
            }
            
            .transaction-meta {
                text-align: right;
            }
            
            .transaction-date {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .transaction-status {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                margin-top: 5px;
            }
            
            .transaction-status.approved {
                background: #d4edda;
                color: #155724;
            }
            
            .transaction-status.pending {
                background: #fff3cd;
                color: #856404;
            }
            
            .transaction-status.rejected {
                background: #f8d7da;
                color: #721c24;
            }
            
            .modal-actions {
                padding: 20px 30px;
                border-top: 2px solid #f1f8ff;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                background: #f8fbfe;
            }
            
            .modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .modal-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .btn-edit {
                background: #28a745;
                color: white;
            }
            
            .btn-suspend {
                background: #ffc107;
                color: #212529;
            }
            
            .btn-activate {
                background: #20c997;
                color: white;
            }
            
            .btn-close {
                background: #6c757d;
                color: white;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .management-header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: flex-start;
                }
                
                .admin-stats, .user-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .admin-actions, .user-actions {
                    flex-direction: column;
                }
                
                .btn-action {
                    width: 30px;
                    height: 30px;
                }
                
                .modal-container {
                    width: 95%;
                    max-height: 95vh;
                }
                
                .user-details-grid, .admin-details-grid {
                    grid-template-columns: 1fr;
                }
                
                .form-grid {
                    grid-template-columns: 1fr;
                }
                
                .permissions-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .tab-buttons {
                    flex-direction: column;
                }
                
                .modal-actions {
                    flex-direction: column;
                }
                
                .modal-btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .form-actions {
                    flex-direction: column;
                }
                
                .btn-primary, .btn-secondary, .btn-warning, .btn-danger, .btn-success {
                    width: 100%;
                    justify-content: center;
                }
            }
            
            @media (max-width: 480px) {
                .admin-stats, .user-stats {
                    grid-template-columns: 1fr;
                }
                
                .modal-header {
                    padding: 15px 20px;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .user-profile-header, .admin-profile-header {
                    flex-direction: column;
                    text-align: center;
                }
                
                .user-stats, .admin-stats {
                    justify-content: center;
                }
                
                .permissions-grid {
                    grid-template-columns: 1fr;
                }
            }
            
                    /* Super Admin Management Styles */
        .management-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f1f1f1;
        }
        
        .admin-stats, .user-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card > div:first-child {
            font-size: 14px;
            color: #7f8c8d;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .search-box {
            margin: 20px 0;
        }
        
        .search-box input {
            width: 100%;
            padding: 12px 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .search-box input:focus {
            border-color: #3498db;
            outline: none;
        }
        
        .user-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
        
        .user-table th {
            background: #2c3e50;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        
        .user-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            vertical-align: middle;
        }
        
        .user-table tr:hover {
            background: #f8f9fa;
        }
        
        .admin-info, .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .admin-avatar, .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: white;
        }
        
        .admin-avatar.super-admin {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
        }
        
        .admin-avatar.regular-admin {
            background: #3498db;
        }
        
        .user-avatar {
            background: #9b59b6;
        }
        
        .admin-name, .user-name {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .admin-id, .user-id, .user-ref {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .user-meta {
            display: flex;
            gap: 10px;
            margin-top: 5px;
        }
        
        .role-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        
        .super-admin-badge {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
        }
        
        .admin-badge {
            background: #3498db;
            color: white;
        }
        
        .permissions-cell {
            max-width: 250px;
        }
        
        .permissions-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .permission-badge {
            padding: 4px 8px;
            background: #ecf0f1;
            border-radius: 12px;
            font-size: 11px;
            color: #2c3e50;
            white-space: nowrap;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        
        .status-active {
            background: #27ae60;
            color: white;
        }
        
        .status-inactive {
            background: #e74c3c;
            color: white;
        }
        
        .last-active {
            font-size: 13px;
        }
        
        .last-active.online {
            color: #27ae60;
            font-weight: bold;
        }
        
        .last-active.recent {
            color: #f39c12;
        }
        
        .last-active.away {
            color: #7f8c8d;
        }
        
        .last-active.offline {
            color: #95a5a6;
        }
        
        .password-cell {
            min-width: 150px;
        }
        
        .password-display {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .password-masked {
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        }
        
        .btn-show-password {
            width: 30px;
            height: 30px;
            border: none;
            background: #ecf0f1;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .btn-show-password:hover {
            background: #3498db;
            color: white;
        }
        
        .referral-code {
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .balance-display {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .total-deposits {
            font-size: 11px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .admin-actions, .user-actions {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        
        .btn-action {
            width: 35px;
            height: 35px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .btn-action.view {
            background: #3498db;
            color: white;
        }
        
        .btn-action.chat {
            background: #2ecc71;
            color: white;
        }
        
        .btn-action.edit {
            background: #f39c12;
            color: white;
        }
        
        .btn-action.investments {
            background: #9b59b6;
            color: white;
        }
        
        .btn-action.transactions {
            background: #1abc9c;
            color: white;
        }
        
        .btn-action.reset-password {
            background: #34495e;
            color: white;
        }
        
        .btn-action.status {
            background: #e74c3c;
            color: white;
        }
        
        .btn-action.deactivate {
            background: #e74c3c;
            color: white;
        }
        
        .btn-action.delete {
            background: #c0392b;
            color: white;
        }
        
        .btn-action.disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        
        .btn-action:hover:not(:disabled) {
            transform: scale(1.1);
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        
        .btn-action:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Modal Specific Styles */
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .detail-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #eee;
        }
        
        .detail-card h5 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            padding-bottom: 10px;
            border-bottom: 2px solid #f1f1f1;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #eee;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .permissions-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .permission-tag {
            padding: 6px 12px;
            background: #3498db;
            color: white;
            border-radius: 20px;
            font-size: 12px;
        }
        
        .profile-tags {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .role-tag, .status-tag, .referral-tag {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .super-admin-tag {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
        }
        
        .admin-tag {
            background: #3498db;
            color: white;
        }
        
        .active-tag {
            background: #27ae60;
            color: white;
        }
        
        .inactive-tag {
            background: #e74c3c;
            color: white;
        }
        
        .referral-tag {
            background: #9b59b6;
            color: white;
        }
        
        .details-tabs {
            margin: 20px 0;
        }
        
        .tab-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #f1f1f1;
            padding-bottom: 10px;
        }
        
        .tab-btn {
            padding: 10px 20px;
            border: none;
            background: #ecf0f1;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .tab-btn.active {
            background: #3498db;
            color: white;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .summary-label {
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .summary-value.positive {
            color: #27ae60;
        }
        
        .summary-value.negative {
            color: #e74c3c;
        }
        
        .detail-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #eee;
        }
        
        .detail-section h5 {
            margin: 0 0 15px 0;
            color: #2c3e50;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f1f1;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .status-indicator {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-indicator.active {
            background: #27ae60;
            color: white;
        }
        
        .status-indicator.inactive {
            background: #e74c3c;
            color: white;
        }
        
        /* Investment Styles */
        .investment-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .investments-section {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .investments-section h4 {
            margin: 0 0 15px 0;
            color: #2c3e50;
        }
        
        .investments-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .investment-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .investment-item.active {
            border-left-color: #3498db;
        }
        
        .investment-item.completed {
            border-left-color: #27ae60;
        }
        
        .investment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .mineral-name {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .investment-status {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .investment-status.active {
            background: #3498db;
            color: white;
        }
        
        .investment-status.completed {
            background: #27ae60;
            color: white;
        }
        
        .investment-details {
            font-size: 14px;
            color: #7f8c8d;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }
        
        .more-items {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            margin-top: 10px;
        }
        
        /* Transaction Styles */
        .transaction-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .transactions-table-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #eee;
            border-radius: 8px;
        }
        
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .transactions-table th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            position: sticky;
            top: 0;
        }
        
        .transactions-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .transaction-row:hover {
            background: #f8f9fa;
        }
        
        .transaction-type {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .transaction-type.deposit {
            background: #27ae60;
            color: white;
        }
        
        .transaction-type.withdrawal {
            background: #e74c3c;
            color: white;
        }
        
        .transaction-type.investment {
            background: #3498db;
            color: white;
        }
        
        .transaction-type.bonus {
            background: #f39c12;
            color: white;
        }
        
        .btn-small {
            width: 30px;
            height: 30px;
            border: none;
            background: #ecf0f1;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .btn-small:hover {
            background: #3498db;
            color: white;
        }
        
        /* Add Admin Form */
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus, .form-group select:focus {
            border-color: #3498db;
            outline: none;
        }
        
        .password-toggle {
            margin-top: 8px;
            font-size: 14px;
            color: #3498db;
            cursor: pointer;
            display: inline-block;
        }
        
        .permissions-checkboxes {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
        }
        
        .permissions-checkboxes label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: normal;
            cursor: pointer;
        }
        
        .permissions-checkboxes input[type="checkbox"] {
            width: auto;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f1f1f1;
        }
            
                    /* Top Investors Styles */
        .time-period-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f1f1f1;
        }
        
        .period-btn {
            padding: 8px 16px;
            border: 2px solid #3498db;
            background: white;
            color: #3498db;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .period-btn.active {
            background: #3498db;
            color: white;
        }
        
        .investors-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .investors-table th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
        }
        
        .investors-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .rank {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            margin: 0 auto;
        }
        
        .rank-1 {
            background: #ffd700;
            color: #333;
        }
        
        .rank-2 {
            background: #c0c0c0;
        }
        
        .rank-3 {
            background: #cd7f32;
        }
        
        .rank-4, .rank-5, .rank-6, .rank-7, .rank-8, .rank-9, .rank-10 {
            background: #3498db;
        }
        
        .investor-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .investor-avatar {
            width: 35px;
            height: 35px;
            background: #9b59b6;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .investor-name {
            font-weight: bold;
        }
        
        .investor-email {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .invested-amount {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .profit-amount {
            font-weight: bold;
        }
        
        .profit-amount.positive {
            color: #27ae60;
        }
        
        .profit-amount.negative {
            color: #e74c3c;
        }
        
        .active-count {
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .investor-actions {
            display: flex;
            gap: 5px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .admin-stats, .user-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .admin-actions, .user-actions {
                flex-direction: column;
            }
            
            .btn-action {
                width: 30px;
                height: 30px;
            }
            
            .user-table {
                display: block;
                overflow-x: auto;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid, .investment-summary, .transaction-summary {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .time-period-selector {
                flex-wrap: wrap;
            }
        }
        
        @media (max-width: 480px) {
            .admin-stats, .user-stats {
                grid-template-columns: 1fr;
            }
            
            .management-header {
                flex-direction: column;
                gap: 15px;
                align-items: flex-start;
            }
            
            .stats-grid, .investment-summary, .transaction-summary {
                grid-template-columns: 1fr;
            }
            
            .tab-buttons {
                flex-direction: column;
            }
        }
        `;
        document.head.appendChild(styles);
        console.log('✅ Added super admin management styles');
    }
}

// ==============================================
// INITIALIZATION
// ==============================================

// Initialize when super admin dashboard loads
function initSuperAdminDashboard() {
    console.log('🚀 Initializing Super Admin Dashboard...');
    
    // Add management styles
    addSuperAdminManagementStyles();
    
    // Initialize management system
    initSuperAdminManagement();
    
    // Update UI
    updateSuperAdminUI();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    console.log('✅ Super Admin Dashboard Initialized');
}

// Update super admin UI elements
function updateSuperAdminUI() {
    const username = db.currentUser?.username || 'Super Admin';
    
    document.querySelectorAll('#super-admin-username-display').forEach(el => {
        el.textContent = username;
    });
    
    const sidebarName = document.getElementById('super-admin-sidebar-name');
    if (sidebarName) {
        sidebarName.textContent = username;
    }
}

// Start real-time updates
function startRealTimeUpdates() {
    setInterval(() => {
        loadSuperAdminStats();
    }, 30000);
}

// Add highest investors button to super admin header
function addHighestInvestorsButton() {
    const header = document.querySelector('#admin-management .management-header');
    if (header) {
        const existingBtn = header.querySelector('.btn-show-investors');
        if (!existingBtn) {
            const investorsBtn = document.createElement('button');
            investorsBtn.className = 'btn btn-primary btn-show-investors';
            investorsBtn.innerHTML = '<i class="fas fa-trophy"></i> Top Investors';
            investorsBtn.onclick = showHighestInvestors;
            header.appendChild(investorsBtn);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin & User Management System Loaded');
    
    // Make functions globally available
    window.initSuperAdminManagement = initSuperAdminManagement;
    window.loadUsersList = loadUsersList;
    window.toggleUserPassword = toggleUserPassword;
    window.chatWithAdmin = chatWithAdmin;
    window.viewUserInvestments = viewUserInvestments;
    window.viewUserTransactions = viewUserTransactions;
    window.editUser = editUser;
    window.resetUserPassword = resetUserPassword;
    window.toggleUserStatus = toggleUserStatus;
    window.deleteUser = deleteUser;
    window.openAddAdminModal = openAddAdminModal;
    window.submitAddAdminForm = submitAddAdminForm;
    window.toggleEditPassword = toggleEditPassword;
    window.closeUserModal = closeUserModal;
    window.refreshUserList = refreshUserList;
    window.initSuperAdminDashboard = initSuperAdminDashboard;
});

// ========== DASHBOARD STATISTICS LOADER ==========

// ========== DASHBOARD STATISTICS LOADER ==========

async function loadDashboardStats() {
    try {
        console.log('📊 Loading dashboard statistics...');
        
        if (!db || !db.currentUser) {
            console.error('No user logged in');
            return;
        }
        
        const userId = db.currentUser.id;
        
        // 1. Get user balance
        const totalBalance = db.currentUser.balance || 0;
        updateElement('#total-balance', formatNumber(totalBalance));
        
        // 2. Get active investments count
        const investments = await db.getUserInvestments(userId);
        const activeInvestments = investments.filter(inv => !inv.completed);
        updateElement('#active-investments', activeInvestments.length);
        
        // 3. Calculate total profit
        let totalProfit = 0;
        investments.forEach(investment => {
            if (investment.completed) {
                totalProfit += investment.finalProfit || 0;
            } else {
                const currentProfit = calculateCurrentProfit(investment);
                totalProfit += currentProfit;
            }
        });
        updateElement('#total-profit', formatNumber(totalProfit));
        
        // 4. Get referral count
        const userData = await db.findUserById(userId);
        const referralCount = userData?.referrals?.length || 0;
        updateElement('#referral-count-card', referralCount);
        
        console.log('✅ Dashboard statistics loaded:', {
            totalBalance,
            activeInvestments: activeInvestments.length,
            totalProfit,
            referralCount
        });
        
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        showNotification('Error loading statistics. Please refresh.', 'error');
    }
}

// ========== HELPER FUNCTIONS ==========

// Format number with commas
function formatNumber(number) {
    return number.toLocaleString('en-TZ');
}

// Update element text content safely
function updateElement(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = content;
    } else {
        console.warn(`Element ${selector} not found`);
    }
}

// Calculate current profit for an active investment
function calculateCurrentProfit(investment) {
    if (investment.completed) {
        return investment.finalProfit || 0;
    }
    
    const startDate = new Date(investment.startTime);
    const now = new Date();
    const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = investment.days;
    
    // Ensure daysPassed is not negative and not exceeding totalDays
    const effectiveDays = Math.max(0, Math.min(daysPassed, totalDays));
    
    // Calculate profit based on your business logic
    // Example: 3% daily return on investment
    const dailyReturnRate = 0.03; // 3%
    const expectedTotalProfit = investment.cost * dailyReturnRate * totalDays;
    const profitSoFar = (effectiveDays / totalDays) * expectedTotalProfit;
    
    return Math.max(0, profitSoFar);
}

// ========== INTEGRATION WITH EXISTING CODE ==========

// Call this function when user dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    // If user is already logged in when page loads
    if (db && db.currentUser) {
        setTimeout(() => {
            loadDashboardStats();
        }, 1000);
    }
});

// ========== REAL-TIME UPDATES ==========

// Function to start real-time stats updates
function startRealTimeStatsUpdates() {
    // Update stats every 30 seconds
    setInterval(() => {
        if (db && db.currentUser) {
            loadDashboardStats();
        }
    }, 30000);
    
    // Also update when investment modal is closed
    const modal = document.getElementById('investment-modal');
    if (modal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style') {
                    const displayStyle = modal.style.display;
                    if (displayStyle === 'none') {
                        // Modal just closed, refresh stats
                        setTimeout(() => {
                            loadDashboardStats();
                        }, 1000);
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }
}

// Call this when user dashboard initializes
function initUserDashboardStats() {
    loadDashboardStats();
    startRealTimeStatsUpdates();
    
    // Also update stats when switching to dashboard section
    document.addEventListener('sectionChanged', function(e) {
        if (e.detail.sectionId === 'dashboard') {
            loadDashboardStats();
        }
    });
}

// ========== ERROR HANDLING ==========

// Fallback function if Database.getUserInvestments doesn't exist
if (typeof db !== 'undefined' && db) {
    if (!db.getUserInvestments) {
        db.getUserInvestments = async function(userId) {
            try {
                const user = await this.findUserById(userId);
                return user?.investments || [];
            } catch (error) {
                console.error('Error getting user investments:', error);
                return [];
            }
        };
    }
}

// Initialize when DOM is fully loaded
window.addEventListener('load', function() {
    // Check if stats container exists
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer && db && db.currentUser) {
        console.log('Initializing dashboard statistics...');
        initUserDashboardStats();
    }
});

// Add these functions to update dashboard stats
async function updateUserDashboardStats() {
    try {
        if (!db.currentUser) return;
        
        // Update total balance
        const totalBalance = document.getElementById('total-balance');
        if (totalBalance) {
            totalBalance.textContent = db.formatCurrency(db.currentUser.balance);
        }
        
        // Update active investments count
        const activeInvestments = investments.filter(inv => !inv.completed);
        const activeInvestmentsEl = document.getElementById('active-investments');
        if (activeInvestmentsEl) {
            activeInvestmentsEl.textContent = activeInvestments.length;
        }
        
        // Update total profit
        const totalProfitEl = document.getElementById('total-profit');
        if (totalProfitEl) {
            let totalProfit = 0;
            investments.forEach(investment => {
                if (investment.completed) {
                    totalProfit += investment.finalProfit || 0;
                } else {
                    totalProfit += calculateCurrentProfit(investment);
                }
            });
            totalProfitEl.textContent = db.formatCurrency(totalProfit);
        }
        
        // Update referral count
        const referralCountEl = document.getElementById('referral-count-card');
        if (referralCountEl && db.currentUser.referrals) {
            referralCountEl.textContent = db.currentUser.referrals.length;
        }
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Call this function when dashboard loads
function initUserDashboardStats() {
    updateUserDashboardStats();
    // Update every 30 seconds
    setInterval(updateUserDashboardStats, 30000);
}

// Add these functions to update referral stats
function updateReferralStats() {
    if (!db || !db.currentUser) return;
    
    const referrals = db.currentUser.referrals || [];
    const totalReferrals = referrals.length;
    const pendingBonuses = referrals.filter(ref => ref.bonus_pending && !ref.bonus_paid).length;
    const earnedBonuses = referrals.filter(ref => ref.bonus_paid).length;
    const totalEarned = referrals.reduce((sum, ref) => sum + (ref.bonus_amount || 0), 0);
    
    // Update UI elements
    updateElement('total-referrals-count', totalReferrals);
    updateElement('active-referrals-count', referrals.filter(ref => ref.status === 'active').length);
    updateElement('total-earned', db.formatCurrency ? db.formatCurrency(totalEarned) : `TZS ${Math.round(totalEarned).toLocaleString()}`);
    
    // Update the commission display in referrals list
    const referralsList = document.getElementById('referrals-list');
    if (referralsList) {
        referralsList.innerHTML = referrals.map(referral => `
            <div class="referral-item">
                <div class="referral-info">
                    <div class="referral-name">${referral.username}</div>
                    <div class="referral-date">Joined: ${new Date(referral.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-status">
                    <div class="referral-bonus">
                        <span class="bonus-amount">${referral.bonus_paid ? 'TZS ' + Math.round(referral.bonus_amount || 0).toLocaleString() : 'Pending'}</span>
                        <span class="bonus-status ${referral.bonus_paid ? 'paid' : 'pending'}">
                            ${referral.bonus_paid ? '✅ Paid' : '⏳ Pending'}
                        </span>
                    </div>
                    ${referral.first_deposit_amount ? 
                        `<div class="first-deposit">First Deposit: TZS ${Math.round(referral.first_deposit_amount).toLocaleString()}</div>` : 
                        `<div class="no-deposit">Awaiting first deposit</div>`
                    }
                </div>
            </div>
        `).join('');
    }
}

async function checkReferralBonusStatus() {
    if (!db || !db.currentUser) {
        alert('Please login first');
        return;
    }
    
    try {
        const balance = await db.debugUserBalance(db.currentUser.id);
        alert(`Current balance: TZS ${Math.round(balance || 0).toLocaleString()}\nCheck console for details.`);
    } catch (error) {
        console.error('Debug error:', error);
        alert('Debug failed: ' + error.message);
    }
}

// Add to ChatSystem class or create separate functions
async function updateChatStats() {
    try {
        if (!window.chatSystem) return;
        
        // Update chat badge counts
        const pendingChats = await chatSystem.getPendingChatsCount();
        
        // Update admin sidebar badge
        const chatBadge = document.getElementById('chat-badge');
        if (chatBadge) {
            chatBadge.textContent = pendingChats > 0 ? pendingChats : '';
            chatBadge.style.display = pendingChats > 0 ? 'flex' : 'none';
        }
        
        // Update bottom bar badge
        const bottomChatBadge = document.getElementById('bottom-chat-badge');
        if (bottomChatBadge) {
            bottomChatBadge.textContent = pendingChats > 0 ? pendingChats : '';
            bottomChatBadge.style.display = pendingChats > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating chat stats:', error);
    }
}

// Add to ChatSystem class
async function getPendingChatsCount() {
    try {
        if (!this.chatsCollection) return 0;
        
        const snapshot = await this.chatsCollection.get();
        let pendingCount = 0;
        
        snapshot.forEach(doc => {
            const chatData = doc.data();
            if (chatData.unreadCount > 0) {
                pendingCount++;
            }
        });
        
        return pendingCount;
    } catch (error) {
        console.error('Error getting pending chats count:', error);
        return 0;
    }
}

// Add function to load admin stats
async function loadAdminStats() {
    try {
        console.log('📊 Loading admin statistics...');
        
        // Get total users
        const totalUsers = await db.getTotalUsers();
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            totalUsersEl.textContent = totalUsers;
        }
        
        // Get total deposits
        const totalDeposits = await db.getTotalDeposits();
        const totalDepositsEl = document.getElementById('total-deposits');
        if (totalDepositsEl) {
            totalDepositsEl.textContent = db.formatCurrency(totalDeposits);
        }
        
        // Get total withdrawals
        const totalWithdrawals = await db.getTotalWithdrawals();
        const totalWithdrawalsEl = document.getElementById('total-withdrawals');
        if (totalWithdrawalsEl) {
            totalWithdrawalsEl.textContent = db.formatCurrency(totalWithdrawals);
        }
        
        // Get pending transactions count
        const pendingTransactions = await db.getPendingTransactions();
        const pendingTransactionsEl = document.getElementById('pending-transactions-count');
        if (pendingTransactionsEl) {
            pendingTransactionsEl.textContent = pendingTransactions.length;
        }
        
        console.log('✅ Admin statistics loaded');
        
    } catch (error) {
        console.error('❌ Error loading admin stats:', error);
    }
}

// Add function to update pending count badge
async function updatePendingCountBadge() {
    try {
        const pendingTransactions = await db.getPendingTransactions();
        const pendingCount = pendingTransactions.length;
        
        // Update sidebar badge
        const pendingBadge = document.getElementById('pending-count');
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount > 0 ? pendingCount : '';
            pendingBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating pending count badge:', error);
    }
}

// Add function to load super admin data
async function loadSuperAdminData() {
    try {
        console.log('👑 Loading super admin data...');
        
        await Promise.all([
            loadAdminsList(),
            loadUsersList(),
            loadSystemStats(),
            loadRecentActivities()
        ]);
        
        console.log('✅ Super admin data loaded');
        
    } catch (error) {
        console.error('❌ Error loading super admin data:', error);
    }
}

// Add function to update investment badge
function updateInvestmentBadge() {
    const activeInvestments = investments.filter(inv => !inv.completed);
    const investmentBadge = document.getElementById('sidebar-investments-badge');
    
    if (investmentBadge) {
        investmentBadge.textContent = activeInvestments.length > 0 ? activeInvestments.length : '';
        investmentBadge.style.display = activeInvestments.length > 0 ? 'flex' : 'none';
    }
}

// ========== INVESTMENT HISTORY FUNCTION ==========

function updateInvestmentHistory() {
    const historyContainer = document.getElementById('investment-history');
    if (!historyContainer) return;
    
    // Clear container
    historyContainer.innerHTML = '';
    
    if (investments.length === 0) {
        historyContainer.innerHTML = `
            <div class="no-history">
                <i class="fas fa-history"></i>
                <p>No investment history available</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedInvestments = [...investments].sort((a, b) =>
        new Date(b.startTime) - new Date(a.startTime)
    );
    
    // Create history items
    sortedInvestments.forEach(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const currentProfit = calculateCurrentProfit(investment);
        const totalProfit = investment.completed ?
            (investment.finalProfit || 0) :
            calculateExpectedTotalProfit(investment);
        
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${investment.completed ? 'completed' : 'active'}`;
        historyItem.innerHTML = `
            <div class="history-header">
                <div class="history-title">
                    <i class="fas fa-${investment.completed ? 'check-circle' : 'gem'}"></i>
                    <span>${investment.mineral} - ${investment.grams}g</span>
                </div>
                <div class="history-status ${investment.completed ? 'completed' : 'active'}">
                    ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                </div>
            </div>
            
            <div class="history-details">
                <div class="history-row">
                    <span>Investment:</span>
                    <strong>TZS ${Math.round(investment.cost).toLocaleString()}</strong>
                </div>
                <div class="history-row">
                    <span>Started:</span>
                    <span>${startDate.toLocaleDateString()}</span>
                </div>
                <div class="history-row">
                    <span>${investment.completed ? 'Completed:' : 'Expected End:'}</span>
                    <span>${investment.completed ? 
                        new Date(investment.completionDate).toLocaleDateString() : 
                        endDate.toLocaleDateString()}</span>
                </div>
                <div class="history-row">
                    <span>${investment.completed ? 'Final Profit:' : 'Current Profit:'}</span>
                    <strong class="${currentProfit >= 0 ? 'profit' : 'loss'}">
                        TZS ${Math.round(investment.completed ? (investment.finalProfit || 0) : currentProfit).toLocaleString()}
                    </strong>
                </div>
                <div class="history-row">
                    <span>${investment.completed ? 'Total Received:' : 'Expected Total:'}</span>
                    <strong class="total">
                        TZS ${Math.round(totalProfit + investment.cost).toLocaleString()}
                    </strong>
                </div>
            </div>
            
            <div class="history-actions">
                ${!investment.completed ? `
                <button class="btn-cancel-history" onclick="deleteInvestment('${investment.id}')">
                    <i class="fas fa-trash"></i> Cancel
                </button>
                ` : `
                <button class="btn-delete-history" onclick="deleteCompletedInvestment('${investment.id}')">
                    <i class="fas fa-trash-alt"></i> Delete Record
                </button>
                `}
            </div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Add function to update referral badge
function updateReferralBadge() {
    const referralBadge = document.getElementById('sidebar-referral-badge');
    if (referralBadge && db.currentUser && db.currentUser.referrals) {
        const pendingReferrals = db.currentUser.referrals.filter(ref => 
            ref.bonus_pending === true && !ref.bonus_paid
        );
        referralBadge.textContent = pendingReferrals.length > 0 ? pendingReferrals.length : '';
        referralBadge.style.display = pendingReferrals.length > 0 ? 'flex' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize all stats when page loads
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            loadSuperAdminData();
        } else if (db.currentUser.is_admin) {
            loadAdminStats();
            updatePendingCountBadge();
        } else {
            initUserDashboardStats();
            updateReferralStats();
        }
    }
    
    // Initialize chat system
    if (window.chatSystem) {
        setInterval(() => {
        }, 30000);
    }
});

// ==============================================
// COMPLETE ANNOUNCEMENT SYSTEM FOR FIREBASE
// ==============================================

// Global Announcement Manager Class
class AnnouncementManager {
    constructor() {
        this.db = null;
        this.announcementsCollection = null;
        this.storage = null;
        this.landingAnnouncements = [];
        this.dashboardAnnouncements = [];
        this.allAnnouncements = [];
        this.currentSlide = 0; // For landing slideshow
        this.dashboardSlide = 0; // For dashboard slideshow
        this.slideInterval = null;
        this.dashboardInterval = null; // Separate interval for dashboard
        this.isAdmin = false;
        this.currentMediaType = 'gallery';
        this.selectedFile = null;
        this.editMode = false;
        this.currentEditId = null;
        
        // Don't initialize immediately, wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM already loaded, initialize immediately
            this.init();
        }
    }
    
    async init() {
        try {
            console.log('Initializing Announcement Manager...');
            
            // Step 1: Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Step 2: Initialize Firebase services
            await this.initFirebaseServices();
            
            // Step 3: Inject CSS for dashboard slideshow
            this.injectDashboardSlideshowCSS();
            
            // Step 4: Check admin status
            this.checkAdminStatus();
            
            // Step 5: Setup event listeners
            this.setupEventListeners();
            
            // Step 6: Load all announcements
            await this.loadAllAnnouncements();
            
            // Step 7: Start slideshow if needed
            if (this.landingAnnouncements.length > 1) {
                this.startSlideshow();
            }
            
            if (this.dashboardAnnouncements.length > 1) {
                this.startDashboardSlideshow();
            }
            
            console.log('Announcement Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Announcement Manager:', error);
            console.error('Error details:', error.message, error.stack);
            
            // Show user-friendly error
            this.showNotification('Announcement system initialization failed. Please refresh the page.', 'error');
            
            // Show fallback content
            this.showFallbackAnnouncements();
        }
    }
    
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    console.log('Firebase is ready');
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('Firebase not available after ' + maxAttempts + ' attempts'));
                    return;
                }
                
                console.log('Waiting for Firebase... attempt ' + attempts);
                setTimeout(checkFirebase, 500);
            };
            
            checkFirebase();
        });
    }
    
    async initFirebaseServices() {
        try {
            // Get the Firebase app instance
            const firebaseApp = firebase.app();
            
            // Initialize Firestore
            this.db = firebaseApp.firestore();
            
            // Initialize Storage
            this.storage = firebaseApp.storage();
            
            // Set up announcements collection
            this.announcementsCollection = this.db.collection('announcements');
            
            console.log('Firebase services initialized');
            
        } catch (error) {
            console.error('Error initializing Firebase services:', error);
            throw new Error('Failed to initialize Firebase services: ' + error.message);
        }
    }
    
    // ==============================================
    // LOAD ANNOUNCEMENTS
    // ==============================================
    
    async loadAllAnnouncements() {
        try {
            console.log('Loading announcements from Firestore...');
            
            let snapshot;
            try {
                // First try simple query
                snapshot = await this.announcementsCollection.get();
            } catch (error) {
                console.error('Firestore error:', error);
                throw error;
            }
            
            this.landingAnnouncements = [];
            this.dashboardAnnouncements = [];
            this.allAnnouncements = [];
            
            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    const announcement = {
                        id: doc.id,
                        title: data.title || 'No Title',
                        content: data.content || '',
                        type: data.type || 'dashboard',
                        mediaType: data.mediaType || null,
                        mediaUrl: data.mediaUrl || null,
                        priority: data.priority || 'medium',
                        isActive: data.isActive !== undefined ? data.isActive : true,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
                        createdBy: data.createdBy || 'admin'
                    };
                    
                    // Only show active announcements
                    if (announcement.isActive) {
                        this.allAnnouncements.push(announcement);
                        
                        if (announcement.type === 'landing') {
                            this.landingAnnouncements.push(announcement);
                        } else if (announcement.type === 'dashboard') {
                            this.dashboardAnnouncements.push(announcement);
                        }
                    }
                    
                } catch (parseError) {
                    console.error('Error parsing announcement:', parseError);
                }
            });
            
            // Sort by date (newest first)
            this.landingAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            this.dashboardAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            this.allAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            
            // Reset slideshow positions
            this.currentSlide = 0;
            this.dashboardSlide = 0;
            
            // Render announcements
            this.renderLandingAnnouncements();
            this.renderDashboardAnnouncements();
            this.renderManagementList();
            
            console.log(`Loaded ${this.allAnnouncements.length} announcements`);
            console.log(`Dashboard announcements: ${this.dashboardAnnouncements.length}`);
            console.log(`Landing announcements: ${this.landingAnnouncements.length}`);
            
        } catch (error) {
            console.error('Error loading announcements:', error);
            this.showFallbackAnnouncements();
        }
    }
    
    showFallbackAnnouncements() {
        // Landing page fallback
        const slidesTrack = document.getElementById('landingSlidesTrack');
        if (slidesTrack) {
            slidesTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>Welcome to Tanzania Mining Investment</h3>
                        <p>Stay tuned for important updates and announcements.</p>
                    </div>
                </div>
            `;
        }
        
        // Dashboard fallback
        const dashboardContainer = document.getElementById('dashboardAnnouncementsList');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-info-circle"></i>
                    <p>Announcements will appear here</p>
                </div>
            `;
        }
    }
    
    // ==============================================
    // RENDER ANNOUNCEMENTS
    // ==============================================
    
    renderLandingAnnouncements() {
        const slidesTrack = document.getElementById('landingSlidesTrack');
        const slidesDots = document.getElementById('landingSlidesDots');
        
        if (!slidesTrack) {
            console.log('Landing slides track not found');
            return;
        }
        
        if (this.landingAnnouncements.length === 0) {
            slidesTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>Welcome to Tanzania Mining Investment</h3>
                        <p>No announcements at the moment. Check back soon!</p>
                    </div>
                </div>
            `;
            if (slidesDots) slidesDots.innerHTML = '';
            return;
        }
        
        slidesTrack.innerHTML = '';
        if (slidesDots) slidesDots.innerHTML = '';
        
        this.landingAnnouncements.forEach((announcement, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = 'announcement-slide';
            
            let mediaHtml = '';
            if (announcement.mediaUrl) {
                mediaHtml = this.renderMediaElement(announcement, true);
            }
            
            slide.innerHTML = `
                ${mediaHtml}
                <div class="slide-content">
                    <span class="priority-badge priority-${announcement.priority}">
                        ${announcement.priority.toUpperCase()}
                    </span>
                    <h3>${this.escapeHtml(announcement.title)}</h3>
                    <p>${this.escapeHtml(announcement.content)}</p>
                    <div class="announcement-timestamp">
                        <i class="far fa-clock"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                    <!-- Centered Date -->
                    <div class="center-date">
                        <i class="far fa-calendar"></i>
                        Posted: ${this.formatFullDate(announcement.createdAt)}
                    </div>
                </div>
            `;
            
            slidesTrack.appendChild(slide);
            
            // Create dot if container exists
            if (slidesDots) {
                const dot = document.createElement('div');
                dot.className = `slideshow-dot ${index === 0 ? 'active' : ''}`;
                dot.onclick = () => this.goToSlide(index);
                slidesDots.appendChild(dot);
            }
        });
        
        this.updateSlideshow();
    }
    
    renderDashboardAnnouncements() {
        const container = document.getElementById('dashboardAnnouncementsList');
        if (!container) {
            console.log('Dashboard announcements container not found');
            return;
        }
        
        if (this.dashboardAnnouncements.length === 0) {
            container.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-info-circle"></i>
                    <p>No announcements at the moment</p>
                </div>
            `;
            return;
        }
        
        // If only one announcement, show it without slideshow
        if (this.dashboardAnnouncements.length === 1) {
            const announcement = this.dashboardAnnouncements[0];
            container.innerHTML = this.createDashboardAnnouncementHTML(announcement);
        } else {
            // Create slideshow for multiple announcements
            container.innerHTML = this.createDashboardSlideshowHTML();
            
            // Start dashboard slideshow
            this.startDashboardSlideshow();
        }
    }
    
    createDashboardSlideshowHTML() {
        return `
            <div class="dashboard-slideshow-container">
                <div class="dashboard-slides-track" id="dashboardSlidesTrack">
                    ${this.dashboardAnnouncements.map((announcement, index) => `
                        <div class="dashboard-slide ${index === 0 ? 'active' : ''}">
                            ${this.createDashboardSlideContent(announcement)}
                        </div>
                    `).join('')}
                </div>
                
                ${this.dashboardAnnouncements.length > 1 ? `
                    <div class="dashboard-slideshow-controls">
                        <button class="slideshow-btn prev-btn" onclick="announcementManager.changeDashboardSlide(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div class="dashboard-slides-dots" id="dashboardSlidesDots">
                            ${this.dashboardAnnouncements.map((_, index) => `
                                <div class="slideshow-dot ${index === 0 ? 'active' : ''}" 
                                     onclick="announcementManager.goToDashboardSlide(${index})"></div>
                            `).join('')}
                        </div>
                        
                        <button class="slideshow-btn next-btn" onclick="announcementManager.changeDashboardSlide(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="dashboard-slideshow-info">
                        <span id="dashboardSlideCounter">1 of ${this.dashboardAnnouncements.length}</span>
                        <button class="btn-pause" onclick="announcementManager.toggleDashboardSlideshow()">
                            <i class="fas fa-pause" id="dashboardPauseIcon"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createDashboardSlideContent(announcement) {
        let mediaHtml = '';
        if (announcement.mediaUrl) {
            mediaHtml = this.renderMediaElement(announcement, true);
        }
        
        return `
            ${mediaHtml}
            <div class="dashboard-slide-content">
                <div class="slide-header">
                    <span class="priority-badge priority-${announcement.priority}">
                        ${announcement.priority.toUpperCase()}
                    </span>
                    <h3>${this.escapeHtml(announcement.title)}</h3>
                </div>
                
                <div class="slide-body">
                    <p>${this.escapeHtml(announcement.content)}</p>
                </div>
                
                <div class="slide-footer">
                    <div class="announcement-timestamp">
                        <i class="far fa-clock"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                    
                    <div class="center-date">
                        <i class="far fa-calendar"></i>
                        Posted: ${this.formatFullDate(announcement.createdAt)}
                    </div>
                </div>
                
                ${this.isAdmin ? `
                    <div class="dashboard-announcement-actions">
                        <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                            <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createDashboardAnnouncementHTML(announcement) {
        let mediaHtml = '';
        if (announcement.mediaUrl) {
            mediaHtml = this.renderMediaElement(announcement, true);
        }
        
        return `
            <div class="dashboard-single-announcement">
                ${mediaHtml}
                <div class="dashboard-announcement-content">
                    <div class="announcement-header">
                        <h3>${this.escapeHtml(announcement.title)}</h3>
                        <span class="priority-badge priority-${announcement.priority}">
                            ${announcement.priority.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="announcement-body">
                        <p>${this.escapeHtml(announcement.content)}</p>
                    </div>
                    
                    <div class="announcement-footer">
                        <div class="announcement-timestamp">
                            <i class="far fa-clock"></i>
                            ${this.formatDate(announcement.createdAt)}
                        </div>
                        
                        <div class="center-date">
                            <i class="far fa-calendar"></i>
                            Posted: ${this.formatFullDate(announcement.createdAt)}
                        </div>
                    </div>
                    
                    ${this.isAdmin ? `
                        <div class="dashboard-announcement-actions">
                            <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                                <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderMediaElement(announcement, isSlideshow = false) {
        if (!announcement.mediaUrl) return '';
        
        const mediaType = announcement.mediaType || this.detectMediaType(announcement.mediaUrl);
        
        switch (mediaType) {
            case 'video':
                if (isSlideshow) {
                    return `
                        <div class="slide-media">
                            <video autoplay loop muted playsinline>
                                <source src="${announcement.mediaUrl}" type="video/mp4">
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="announcement-media">
                            <video controls>
                                <source src="${announcement.mediaUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                }
                
            case 'youtube':
                const videoId = this.extractYouTubeId(announcement.mediaUrl);
                if (videoId) {
                    if (isSlideshow) {
                        return `
                            <div class="slide-media">
                                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}" 
                                        frameborder="0" 
                                        allow="autoplay; encrypted-media" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="announcement-media">
                                <iframe src="https://www.youtube.com/embed/${videoId}" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        `;
                    }
                }
                return '';
                
            default: // image
                if (isSlideshow) {
                    return `<div class="slide-media"><img src="${announcement.mediaUrl}" alt="${this.escapeHtml(announcement.title)}"></div>`;
                } else {
                    return `
                        <div class="announcement-media">
                            <img src="${announcement.mediaUrl}" alt="${this.escapeHtml(announcement.title)}">
                        </div>
                    `;
                }
        }
    }
    
    // ==============================================
    // CREATE ANNOUNCEMENT - FIXED VERSION
    // ==============================================

    async createAnnouncement(formData) {
        try {
            console.log('Creating announcement with data:', formData);
            
            // Validate form data
            if (!formData.title || !formData.content || !formData.type) {
                this.showNotification('Please fill all required fields', 'error');
                return null;
            }
            
            // DEBUG: Log the type to ensure it's correct
            console.log('Announcement type being saved:', formData.type);
            
            // Prepare announcement data
            const announcementData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type, // This should be 'dashboard' or 'landing'
                priority: formData.priority || 'medium',
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.getCurrentUserId()
            };
            
            // Handle media
            let mediaUrl = null;
            let mediaType = null;
            
            if (this.currentMediaType === 'gallery' && this.selectedFile) {
                try {
                    const dataUrl = await this.convertFileToDataURL(this.selectedFile);
                    mediaUrl = dataUrl;
                    mediaType = this.selectedFile.type.startsWith('video/') ? 'video' : 'image';
                    console.log('File converted to data URL');
                } catch (fileError) {
                    console.error('Error handling file:', fileError);
                    this.showNotification('Error processing file', 'error');
                    return null;
                }
            } else if (this.currentMediaType === 'url') {
                const urlInput = document.getElementById('mediaUrlInput');
                const url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    mediaUrl = url;
                    mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                }
            }
            
            // Add media data to announcement
            if (mediaUrl) {
                announcementData.mediaUrl = mediaUrl;
                announcementData.mediaType = mediaType;
            }
            
            console.log('Saving announcement to Firestore:', announcementData);
            
            // Add to Firestore
            const docRef = await this.announcementsCollection.add(announcementData);
            
            console.log('Announcement created with ID:', docRef.id);
            
            this.showNotification('Announcement published successfully!', 'success');
            
            // Reset form
            this.resetCreateForm();
            
            // Reload announcements after a short delay
            setTimeout(() => {
                this.loadAllAnnouncements();
            }, 1000);
            
            // Switch to manage tab to see the new announcement
            this.switchTab('manage');
            
            return docRef.id;
            
        } catch (error) {
            console.error('Error creating announcement:', error);
            console.error('Error details:', error.message, error.stack);
            
            let errorMessage = 'Error creating announcement';
            if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. You may need admin rights.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
            return null;
        }
    }
    
    // Helper function to convert file to data URL
    convertFileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    async uploadFileToStorage(file) {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const filename = `announcements/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            
            // Create storage reference
            const storageRef = this.storage.ref(filename);
            
            // Upload file
            const uploadTask = storageRef.put(file);
            
            // Wait for upload to complete
            await uploadTask;
            
            // Get download URL
            const downloadURL = await storageRef.getDownloadURL();
            
            // Determine media type
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
            
            return { mediaUrl: downloadURL, mediaType };
            
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    // ==============================================
    // UPDATE ANNOUNCEMENT
    // ==============================================
    
    async updateAnnouncement(announcementId, formData) {
        try {
            // Validate form data
            if (!formData.title || !formData.content || !formData.type) {
                this.showNotification('Please fill all required fields', 'error');
                return false;
            }
            
            // Prepare update data
            const updateData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type,
                priority: formData.priority,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Handle media
            if (this.currentMediaType === 'gallery' && this.selectedFile) {
                // Upload new file
                const { mediaUrl, mediaType } = await this.uploadFileToStorage(this.selectedFile);
                updateData.mediaUrl = mediaUrl;
                updateData.mediaType = mediaType;
                
            } else if (this.currentMediaType === 'url') {
                const urlInput = document.getElementById('mediaUrlInput');
                const url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    updateData.mediaUrl = url;
                    updateData.mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                } else {
                    updateData.mediaUrl = null;
                    updateData.mediaType = null;
                }
            } else if (this.currentMediaType === 'none') {
                updateData.mediaUrl = null;
                updateData.mediaType = null;
            }
            
            // Update in Firestore
            await this.announcementsCollection.doc(announcementId).update(updateData);
            
            this.showNotification('Announcement updated successfully!', 'success');
            
            // Reset form
            this.resetCreateForm();
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
            return true;
            
        } catch (error) {
            console.error('Error updating announcement:', error);
            this.showNotification('Error updating announcement: ' + error.message, 'error');
            return false;
        }
    }
    
    // ==============================================
    // DELETE ANNOUNCEMENT
    // ==============================================
    
    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.announcementsCollection.doc(announcementId).delete();
            
            this.showNotification('Announcement deleted successfully!', 'success');
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showNotification('Error deleting announcement', 'error');
        }
    }
    
    // ==============================================
    // TOGGLE ANNOUNCEMENT STATUS
    // ==============================================
    
    async toggleAnnouncement(announcementId, newStatus) {
        try {
            await this.announcementsCollection.doc(announcementId).update({
                isActive: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showNotification(`Announcement ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
        } catch (error) {
            console.error('Error toggling announcement:', error);
            this.showNotification('Error updating announcement', 'error');
        }
    }
    
    // ==============================================
    // GALLERY UPLOAD FUNCTIONS
    // ==============================================
    
    setupGalleryUpload() {
        const galleryFileInput = document.getElementById('galleryFileInput');
        const dragDropArea = document.getElementById('dragDropArea');
        
        if (!galleryFileInput) return;
        
        // Click to choose from gallery
        if (dragDropArea) {
            dragDropArea.addEventListener('click', (e) => {
                e.preventDefault();
                galleryFileInput.click();
            });
        }
        
        // File selection handler
        galleryFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // Drag and drop functionality
        if (dragDropArea) {
            dragDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.add('dragover');
            });
            
            dragDropArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.remove('dragover');
            });
            
            dragDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.remove('dragover');
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleFileSelect(e.dataTransfer.files[0]);
                }
            });
        }
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File size must be less than 5MB', 'error');
            return;
        }
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            this.showNotification('Invalid file type. Please use JPG, PNG, GIF, or MP4', 'error');
            return;
        }
        
        this.selectedFile = file;
        this.previewSelectedFile(file);
        this.showNotification('File selected successfully', 'success');
    }
    
    previewSelectedFile(file) {
        const previewContainer = document.getElementById('galleryPreview');
        if (!previewContainer) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = '';
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (file.type.startsWith('image/')) {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-preview" onclick="announcementManager.removePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="file-info">
                        <span>${this.escapeHtml(file.name)}</span>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                `;
            } else if (file.type.startsWith('video/')) {
                previewItem.innerHTML = `
                    <video controls>
                        <source src="${e.target.result}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                    <button type="button" class="remove-preview" onclick="announcementManager.removePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="file-info">
                        <span>${this.escapeHtml(file.name)}</span>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                `;
            }
            
            previewContainer.appendChild(previewItem);
        };
        
        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    removePreview() {
        this.selectedFile = null;
        const previewContainer = document.getElementById('galleryPreview');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-image"></i>
                    <p>No file selected</p>
                </div>
            `;
        }
        
        const fileInput = document.getElementById('galleryFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    // ==============================================
    // ANNOUNCEMENT MANAGEMENT LIST
    // ==============================================
    
    renderManagementList() {
        const grid = document.getElementById('announcementsGrid');
        if (!grid) return;
        
        if (this.allAnnouncements.length === 0) {
            grid.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-inbox"></i>
                    <p>No announcements found</p>
                    <button class="btn btn-primary" onclick="announcementManager.switchTab('create')">
                        <i class="fas fa-plus"></i> Create First Announcement
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.allAnnouncements.map(announcement => `
            <div class="announcement-card ${announcement.priority || 'medium'}">
                <div class="announcement-header">
                    <h4 class="announcement-title">${this.escapeHtml(announcement.title || 'Untitled')}</h4>
                    <span class="announcement-type-badge">
                        ${announcement.type === 'landing' ? 'Landing Page' : 'Dashboard'}
                    </span>
                </div>
                
                <div class="announcement-content">
                    ${this.escapeHtml((announcement.content || '').length > 150 ? 
                      (announcement.content || '').substring(0, 150) + '...' : 
                      announcement.content || '')}
                </div>
                
                ${announcement.mediaUrl ? `
                    <div class="announcement-media-indicator">
                        <i class="fas fa-${announcement.mediaType === 'video' || announcement.mediaType === 'youtube' ? 'video' : 'image'}"></i>
                        Includes ${announcement.mediaType === 'youtube' ? 'YouTube video' : announcement.mediaType || 'media'}
                    </div>
                ` : ''}
                
                <div class="announcement-meta">
                    <span class="announcement-status ${announcement.isActive ? 'status-active' : 'status-inactive'}">
                        ${announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div class="announcement-date">
                        <i class="far fa-calendar"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                </div>
                
                <!-- Centered Post Date -->
                <div class="center-date">
                    <i class="far fa-clock"></i>
                    Posted on: ${this.formatFullDate(announcement.createdAt)}
                </div>
                
                <div class="announcement-actions">
                    <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                        <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        this.updateStats();
    }
    
    updateStats() {
        const activeCount = this.allAnnouncements.filter(a => a.isActive).length;
        const totalCount = this.allAnnouncements.length;
        
        const activeElement = document.getElementById('activeCount');
        const totalElement = document.getElementById('totalCount');
        
        if (activeElement) activeElement.textContent = `${activeCount} Active`;
        if (totalElement) totalElement.textContent = `${totalCount} Total`;
    }
    
    filterAnnouncements() {
        const searchTerm = document.getElementById('announcementSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        
        let filtered = [...this.allAnnouncements];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(announcement => 
                (announcement.title || '').toLowerCase().includes(searchTerm) ||
                (announcement.content || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(announcement => announcement.type === typeFilter);
        }
        
        // Apply status filter
        if (statusFilter) {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(announcement => announcement.isActive === isActive);
        }
        
        this.renderFilteredList(filtered);
    }
    
    renderFilteredList(announcements) {
        const grid = document.getElementById('announcementsGrid');
        if (!grid) return;
        
        if (announcements.length === 0) {
            grid.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-search"></i>
                    <p>No announcements match your filters</p>
                </div>
            `;
            return;
        }
        
        // Temporarily replace allAnnouncements with filtered list for rendering
        const originalList = this.allAnnouncements;
        this.allAnnouncements = announcements;
        this.renderManagementList();
        this.allAnnouncements = originalList;
    }
    
    // ==============================================
    // EDIT ANNOUNCEMENT
    // ==============================================
    
    async editAnnouncement(announcementId) {
        try {
            const doc = await this.announcementsCollection.doc(announcementId).get();
            if (!doc.exists) {
                this.showNotification('Announcement not found', 'error');
                return;
            }
            
            const announcement = doc.data();
            this.editMode = true;
            this.currentEditId = announcementId;
            
            // Switch to create tab
            this.switchTab('create');
            
            // Fill form with existing data
            document.getElementById('enhancedTitle').value = announcement.title || '';
            document.getElementById('enhancedContent').value = announcement.content || '';
            document.getElementById('enhancedType').value = announcement.type || 'dashboard';
            document.getElementById('enhancedPriority').value = announcement.priority || 'medium';
            
            // Set post date if exists
            if (announcement.createdAt) {
                const date = new Date(announcement.createdAt.toDate());
                const formattedDate = date.toISOString().slice(0, 16);
                document.getElementById('postDate').value = formattedDate;
                this.updateDateDisplay();
            }
            
            // Handle media
            if (announcement.mediaUrl) {
                // Switch to URL tab
                this.switchMediaTab('url');
                
                document.getElementById('mediaUrlInput').value = announcement.mediaUrl || '';
                
                const mediaType = announcement.mediaType || 'image';
                const radioBtn = document.querySelector(`input[name="urlType"][value="${mediaType}"]`);
                if (radioBtn) {
                    radioBtn.checked = true;
                    this.previewMediaURL(announcement.mediaUrl, mediaType);
                }
            } else {
                // Switch to none tab
                this.switchMediaTab('none');
            }
            
            // Update submit button
            const submitBtn = document.querySelector('#enhancedAnnouncementForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
            
            this.showNotification('Edit mode activated', 'info');
            
        } catch (error) {
            console.error('Error loading announcement for edit:', error);
            this.showNotification('Error loading announcement', 'error');
        }
    }
    
    // ==============================================
    // LANDING SLIDESHOW FUNCTIONS
    // ==============================================
    
    startSlideshow() {
        if (this.landingAnnouncements.length <= 1) return;
        
        clearInterval(this.slideInterval);
        this.slideInterval = setInterval(() => {
            this.changeSlide(1);
        }, 5000);
    }
    
    changeSlide(direction) {
        if (this.landingAnnouncements.length <= 1) return;
        
        this.currentSlide += direction;
        if (this.currentSlide >= this.landingAnnouncements.length) {
            this.currentSlide = 0;
        } else if (this.currentSlide < 0) {
            this.currentSlide = this.landingAnnouncements.length - 1;
        }
        
        this.goToSlide(this.currentSlide);
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlideshow();
    }
    
    updateSlideshow() {
        const slidesTrack = document.getElementById('landingSlidesTrack');
        const dots = document.querySelectorAll('.slideshow-dot');
        
        if (!slidesTrack) return;
        
        slidesTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    // ==============================================
    // DASHBOARD SLIDESHOW FUNCTIONS
    // ==============================================
    
    startDashboardSlideshow() {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        clearInterval(this.dashboardInterval);
        this.dashboardInterval = setInterval(() => {
            this.changeDashboardSlide(1);
        }, 6000); // 6 seconds per slide for dashboard
        
        // Update pause button icon
        const pauseIcon = document.getElementById('dashboardPauseIcon');
        if (pauseIcon) {
            pauseIcon.className = 'fas fa-pause';
        }
    }
    
    stopDashboardSlideshow() {
        clearInterval(this.dashboardInterval);
        this.dashboardInterval = null;
        
        // Update pause button icon
        const pauseIcon = document.getElementById('dashboardPauseIcon');
        if (pauseIcon) {
            pauseIcon.className = 'fas fa-play';
        }
    }
    
    toggleDashboardSlideshow() {
        if (this.dashboardInterval) {
            this.stopDashboardSlideshow();
        } else {
            this.startDashboardSlideshow();
        }
    }
    
    changeDashboardSlide(direction) {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        const oldSlide = this.dashboardSlide;
        this.dashboardSlide += direction;
        
        if (this.dashboardSlide >= this.dashboardAnnouncements.length) {
            this.dashboardSlide = 0;
        } else if (this.dashboardSlide < 0) {
            this.dashboardSlide = this.dashboardAnnouncements.length - 1;
        }
        
        this.updateDashboardSlideshow(oldSlide);
    }
    
    goToDashboardSlide(index) {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        const oldSlide = this.dashboardSlide;
        this.dashboardSlide = index;
        this.updateDashboardSlideshow(oldSlide);
    }
    
    updateDashboardSlideshow(oldSlide = null) {
        const slidesTrack = document.getElementById('dashboardSlidesTrack');
        const dots = document.querySelectorAll('#dashboardSlidesDots .slideshow-dot');
        const counter = document.getElementById('dashboardSlideCounter');
        
        if (!slidesTrack) return;
        
        // Remove active class from old slide
        if (oldSlide !== null) {
            const oldSlides = document.querySelectorAll('.dashboard-slide');
            if (oldSlides[oldSlide]) {
                oldSlides[oldSlide].classList.remove('active');
            }
        }
        
        // Add active class to current slide
        const slides = document.querySelectorAll('.dashboard-slide');
        if (slides[this.dashboardSlide]) {
            slides[this.dashboardSlide].classList.add('active');
        }
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.dashboardSlide);
        });
        
        // Update counter
        if (counter) {
            counter.textContent = `${this.dashboardSlide + 1} of ${this.dashboardAnnouncements.length}`;
        }
        
        // Auto-start slideshow if it was running
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
            this.startDashboardSlideshow();
        }
    }
    
    // ==============================================
    // UI HELPER FUNCTIONS
    // ==============================================
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update tab buttons
        document.querySelectorAll('.modal-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetBtn = document.querySelector(`.modal-tab[onclick*="switchTab('${tabName}')"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }
    
    switchMediaTab(tabName, clickedTab = null) {
        this.currentMediaType = tabName;
        
        if (!clickedTab) {
            clickedTab = document.querySelector(`.media-tab[data-target="${tabName}"]`);
        }
        
        // Update tab styles
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (clickedTab) clickedTab.classList.add('active');
        
        // Show selected section
        document.querySelectorAll('.media-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName + 'Section').classList.add('active');
        
        // Reset file selection when switching from gallery
        if (tabName !== 'gallery') {
            this.removePreview();
        }
    }
    
    previewMediaURL(url, mediaType) {
        const urlPreview = document.getElementById('urlPreview');
        if (!urlPreview) return;
        
        if (!this.isValidURL(url)) {
            urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Invalid URL format</div>';
            urlPreview.style.display = 'block';
            return;
        }
        
        urlPreview.innerHTML = '<div class="loading-preview"><i class="fas fa-spinner fa-spin"></i> Loading preview...</div>';
        urlPreview.style.display = 'block';
        
        setTimeout(() => {
            try {
                switch (mediaType) {
                    case 'image':
                        urlPreview.innerHTML = `
                            <div class="url-preview-content">
                                <img src="${url}" alt="URL Preview" 
                                     onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'url-error\\'><i class=\\'fas fa-exclamation-circle\\'></i> Failed to load image</div>';">
                                <div class="url-info">Image URL: ${url}</div>
                            </div>
                        `;
                        break;
                        
                    case 'video':
                        urlPreview.innerHTML = `
                            <div class="url-preview-content">
                                <video controls>
                                    <source src="${url}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <div class="url-info">Video URL: ${url}</div>
                            </div>
                        `;
                        break;
                        
                    case 'youtube':
                        const videoId = this.extractYouTubeId(url);
                        if (videoId) {
                            urlPreview.innerHTML = `
                                <div class="url-preview-content">
                                    <iframe src="https://www.youtube.com/embed/${videoId}" 
                                            frameborder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowfullscreen>
                                    </iframe>
                                    <div class="url-info">YouTube Video ID: ${videoId}</div>
                                </div>
                            `;
                        } else {
                            urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Invalid YouTube URL</div>';
                        }
                        break;
                }
            } catch (error) {
                urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Error loading preview</div>';
            }
        }, 500);
    }
    
    resetCreateForm() {
        this.editMode = false;
        this.currentEditId = null;
        this.selectedFile = null;
        
        const form = document.getElementById('enhancedAnnouncementForm');
        if (form) {
            form.reset();
            console.log('Form reset');
        }
        
        this.removePreview();
        
        const urlPreview = document.getElementById('urlPreview');
        if (urlPreview) {
            urlPreview.style.display = 'none';
            urlPreview.innerHTML = '';
        }
        
        const submitBtn = document.querySelector('#enhancedAnnouncementForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Announcement';
            submitBtn.disabled = false;
        }
        
        this.updateDateDisplay();
        
        // Reset to gallery tab
        const galleryTab = document.querySelector('.media-tab[data-target="gallery"]');
        if (galleryTab) {
            this.switchMediaTab('gallery', galleryTab);
        }
    }
    
    updateDateDisplay() {
        const dateInput = document.getElementById('postDate');
        const dateDisplay = document.getElementById('dateDisplay');
        
        if (!dateDisplay || !dateInput) return;
        
        if (dateInput.value) {
            try {
                const date = new Date(dateInput.value);
                dateDisplay.querySelector('span').textContent = 
                    `Will be posted on: ${date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`;
            } catch (e) {
                dateDisplay.querySelector('span').textContent = 'Invalid date selected';
            }
        } else {
            dateDisplay.querySelector('span').textContent = 'Will be posted immediately';
        }
    }
    
    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    
    checkAdminStatus() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.isAdmin = user.role === 'admin' || user.role === 'super_admin';
        } catch (e) {
            this.isAdmin = false;
        }
    }
    
    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || 'admin';
        } catch (e) {
            return 'admin';
        }
    }
    
    detectMediaType(url) {
        if (!url) return null;
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return 'video';
        } else if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            return 'image';
        }
        
        return 'image'; // default
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(date) {
        if (!date) return 'Unknown date';
        try {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }
    
    formatFullDate(date) {
        if (!date) return 'Unknown date';
        try {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }
    
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // ==============================================
    // DASHBOARD SLIDESHOW CSS INJECTION
    // ==============================================
    
injectDashboardSlideshowCSS() {
    const style = document.createElement('style');
    style.textContent = `
        /* Dashboard Slideshow Styles - Mobile First */
        .dashboard-slideshow-container {
            width: 100%;
            overflow: hidden;
            position: relative;
            border-radius: 12px;
            background: var(--primary-dark);
            min-height: 250px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .dashboard-slides-track {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
        }
        
        .dashboard-slide {
            flex: 0 0 100%;
            min-height: 250px;
            display: none;
            flex-direction: column;
            padding: 20px;
            color: white;
        }
        
        .dashboard-slide.active {
            display: flex;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0.4; }
            to { opacity: 1; }
        }
        
        .dashboard-slide-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        
        .dashboard-slide .slide-media {
            flex: 1;
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            max-height: 180px;
        }
        
        .dashboard-slide .slide-media img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-media video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-media iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-header {
            margin-bottom: 10px;
        }
        
        .dashboard-slide .slide-header h3 {
            font-size: 18px;
            margin: 8px 0;
            color: white;
            line-height: 1.3;
        }
        
        .dashboard-slide .slide-body {
            flex: 1;
            margin-bottom: 10px;
        }
        
        .dashboard-slide .slide-body p {
            font-size: 14px;
            line-height: 1.5;
            margin: 10px 0;
            opacity: 0.9;
        }
        
        .dashboard-slide .slide-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 15px;
            margin-top: auto;
        }
        
        .dashboard-slideshow-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .dashboard-slides-dots {
            display: flex;
            gap: 6px;
        }
        
        .dashboard-slides-dots .slideshow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .dashboard-slides-dots .slideshow-dot.active {
            background: white;
            transform: scale(1.3);
        }
        
        .slideshow-btn {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.3s;
            opacity: 0.8;
        }
        
        .slideshow-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            opacity: 1;
        }
        
        .dashboard-slideshow-info {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .dashboard-slideshow-info span {
            color: white;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .btn-pause {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            opacity: 0.8;
        }
        
        .btn-pause:hover {
            background: rgba(255, 255, 255, 0.3);
            opacity: 1;
        }
        
        .dashboard-single-announcement {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
            transition: transform 0.3s, box-shadow 0.3s;
            margin-bottom: 20px;
        }
        
        .dashboard-single-announcement:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .dashboard-announcement-content {
            display: flex;
            flex-direction: column;
        }
        
        .dashboard-single-announcement .announcement-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .dashboard-single-announcement .announcement-header h3 {
            font-size: 18px;
            color: #2c3e50;
            margin: 0;
            flex: 1;
        }
        
        .dashboard-single-announcement .announcement-body {
            font-size: 14px;
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .dashboard-single-announcement .announcement-footer {
            border-top: 1px solid #eee;
            padding-top: 15px;
            margin-top: auto;
        }
        
        .dashboard-announcement-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            flex-wrap: wrap;
        }
        
        .dashboard-announcement-actions .action-btn {
            padding: 8px 15px;
            font-size: 13px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-weight: 600;
            min-height: 36px;
        }
        
        .dashboard-announcement-actions .btn-edit {
            background: #3498db;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-edit:hover {
            background: #2980b9;
        }
        
        .dashboard-announcement-actions .btn-toggle {
            background: #2ecc71;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-toggle:hover {
            background: #27ae60;
        }
        
        .dashboard-announcement-actions .btn-delete {
            background: #e74c3c;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-delete:hover {
            background: #c0392b;
        }
        
        /* Priority badges for dashboard */
        .priority-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: white;
        }
        
        .priority-badge.priority-high {
            background: #ff4757;
        }
        
        .priority-badge.priority-medium {
            background: #ffa502;
        }
        
        .priority-badge.priority-low {
            background: #2ed573;
        }
        
        .priority-badge.priority-urgent {
            background: #ff3838;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .announcement-timestamp {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 5px;
        }
        
        .center-date {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .dashboard-single-announcement .announcement-timestamp,
        .dashboard-single-announcement .center-date {
            color: #7f8c8d;
        }
        
        /* Tablet Styles */
        @media (min-width: 768px) {
            .dashboard-slideshow-container {
                min-height: 300px;
            }
            
            .dashboard-slide {
                min-height: 300px;
                padding: 30px;
                flex-direction: row;
            }
            
            .dashboard-slide .slide-media {
                flex: 1;
                margin-right: 30px;
                margin-bottom: 0;
                max-height: 240px;
            }
            
            .dashboard-slide .slide-header h3 {
                font-size: 22px;
            }
            
            .dashboard-slide .slide-body p {
                font-size: 15px;
            }
            
            .slideshow-btn {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
            
            .dashboard-slides-dots .slideshow-dot {
                width: 10px;
                height: 10px;
            }
            
            .dashboard-single-announcement {
                padding: 25px;
            }
            
            .dashboard-single-announcement .announcement-header h3 {
                font-size: 20px;
            }
            
            .dashboard-single-announcement .announcement-body {
                font-size: 15px;
            }
        }
        
        /* Desktop Styles */
        @media (min-width: 1024px) {
            .dashboard-slideshow-container {
                min-height: 350px;
            }
            
            .dashboard-slide {
                padding: 40px;
            }
            
            .dashboard-slide .slide-header h3 {
                font-size: 24px;
            }
            
            .dashboard-slide .slide-body p {
                font-size: 16px;
            }
            
            .dashboard-announcement-actions .action-btn {
                padding: 10px 18px;
                font-size: 14px;
            }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .dashboard-single-announcement {
                background: #2c3e50;
                color: #ecf0f1;
                border-left-color: #667eea;
            }
            
            .dashboard-single-announcement .announcement-header h3,
            .dashboard-single-announcement .announcement-body {
                color: #ecf0f1;
            }
            
            .dashboard-single-announcement .announcement-footer,
            .dashboard-announcement-actions {
                border-color: #4a6572;
            }
            
            .dashboard-single-announcement .announcement-timestamp,
            .dashboard-single-announcement .center-date {
                color: #bdc3c7;
            }
        }
        
        /* Accessibility Improvements */
        .slideshow-btn:focus,
        .btn-pause:focus,
        .dashboard-slides-dots .slideshow-dot:focus,
        .dashboard-announcement-actions .action-btn:focus {
            outline: 2px solid #667eea;
            outline-offset: 2px;
        }
        
        /* Touch-friendly improvements */
        .slideshow-btn,
        .btn-pause,
        .dashboard-slides-dots .slideshow-dot,
        .dashboard-announcement-actions .action-btn {
            min-height: 44px;
            min-width: 44px;
        }
        
        .dashboard-slides-dots .slideshow-dot {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .dashboard-slides-dots .slideshow-dot::before {
            content: '';
            display: block;
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transition: all 0.3s;
        }
        
        .dashboard-slides-dots .slideshow-dot.active::before {
            background: white;
            transform: scale(1.3);
        }
    `;
    
    document.head.appendChild(style);
}
    
    // ==============================================
    // EVENT LISTENERS SETUP - FIXED FORM SUBMISSION
    // ==============================================
    
    setupEventListeners() {
        // Enhanced form submission - FIXED
        const enhancedForm = document.getElementById('enhancedAnnouncementForm');
        if (enhancedForm) {
            enhancedForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Form submitted');
                
                // Disable submit button
                const submitBtn = enhancedForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
                submitBtn.disabled = true;
                
                try {
                    // Get form values directly from elements
                    const title = document.getElementById('enhancedTitle').value.trim();
                    const content = document.getElementById('enhancedContent').value.trim();
                    const type = document.getElementById('enhancedType').value;
                    const priority = document.getElementById('enhancedPriority').value || 'medium';
                    
                    // DEBUG: Log all form values
                    console.log('Form values collected:');
                    console.log('Title:', title);
                    console.log('Content:', content);
                    console.log('Type:', type);
                    console.log('Priority:', priority);
                    
                    // Validate required fields
                    if (!title) {
                        throw new Error('Title is required');
                    }
                    if (!content) {
                        throw new Error('Content is required');
                    }
                    if (!type) {
                        throw new Error('Announcement type is required');
                    }
                    
                    // Create formData object
                    const formData = {
                        title: title,
                        content: content,
                        type: type, // This should be 'dashboard' or 'landing'
                        priority: priority
                    };
                    
                    console.log('Form data to be saved:', formData);
                    
                    if (this.editMode && this.currentEditId) {
                        console.log('Updating announcement:', this.currentEditId);
                        const success = await this.updateAnnouncement(this.currentEditId, formData);
                        if (success) {
                            this.showNotification('Announcement updated successfully!', 'success');
                        }
                    } else {
                        console.log('Creating new announcement');
                        const announcementId = await this.createAnnouncement(formData);
                        if (announcementId) {
                            this.showNotification('Announcement published successfully!', 'success');
                        }
                    }
                    
                } catch (error) {
                    console.error('Form submission error:', error);
                    this.showNotification(`Error: ${error.message}`, 'error');
                } finally {
                    // Re-enable submit button
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Media tabs
        const mediaTabs = document.querySelectorAll('.media-tab');
        mediaTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = tab.getAttribute('data-target');
                this.switchMediaTab(target, tab);
            });
        });
        
        // URL checker
        const urlInput = document.getElementById('mediaUrlInput');
        const urlTypeRadios = document.querySelectorAll('input[name="urlType"]');
        
        if (urlInput) {
            const checkAndPreviewURL = () => {
                const url = urlInput.value.trim();
                const mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                
                if (url) {
                    this.previewMediaURL(url, mediaType);
                } else {
                    const urlPreview = document.getElementById('urlPreview');
                    if (urlPreview) {
                        urlPreview.style.display = 'none';
                        urlPreview.innerHTML = '';
                    }
                }
            };
            
            urlInput.addEventListener('input', checkAndPreviewURL);
            
            urlTypeRadios.forEach(radio => {
                radio.addEventListener('change', checkAndPreviewURL);
            });
        }
        
        // Post date display
        const postDateInput = document.getElementById('postDate');
        if (postDateInput) {
            postDateInput.addEventListener('change', () => {
                this.updateDateDisplay();
            });
        }
        
        // Search and filter
        const searchInput = document.getElementById('announcementSearch');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterAnnouncements();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterAnnouncements();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterAnnouncements();
            });
        }
        
        // Setup gallery upload
        this.setupGalleryUpload();
    }
}

// ==============================================
// GLOBAL FUNCTIONS
// ==============================================

// Open enhanced modal
function openEnhancedModal() {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal) {
        modal.style.display = 'block';
        if (window.announcementManager) {
            window.announcementManager.loadAllAnnouncements();
            window.announcementManager.switchTab('create');
        }
    }
}

// Close enhanced modal
function closeEnhancedModal() {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal) {
        modal.style.display = 'none';
        if (window.announcementManager) {
            window.announcementManager.resetCreateForm();
        }
    }
}

// Change slide for landing announcements
function changeSlide(direction) {
    if (window.announcementManager) {
        window.announcementManager.changeSlide(direction);
    }
}

// Change slide for dashboard announcements
function changeDashboardSlide(direction) {
    if (window.announcementManager) {
        window.announcementManager.changeDashboardSlide(direction);
    }
}

// Go to specific dashboard slide
function goToDashboardSlide(index) {
    if (window.announcementManager) {
        window.announcementManager.goToDashboardSlide(index);
    }
}

// Toggle dashboard slideshow
function toggleDashboardSlideshow() {
    if (window.announcementManager) {
        window.announcementManager.toggleDashboardSlideshow();
    }
}

// Refresh dashboard announcements
function refreshDashboardAnnouncements() {
    if (window.announcementManager) {
        window.announcementManager.loadAllAnnouncements();
        window.announcementManager.showNotification('Announcements refreshed!', 'success');
    }
}

// Reset form
function resetForm() {
    if (window.announcementManager) {
        window.announcementManager.resetCreateForm();
    }
}

// Update date display
function updateDateDisplay() {
    if (window.announcementManager) {
        window.announcementManager.updateDateDisplay();
    }
}

// Switch tab
function switchTab(tabName) {
    if (window.announcementManager) {
        window.announcementManager.switchTab(tabName);
    }
}

// Switch media tab
function switchMediaTab(tabName) {
    if (window.announcementManager) {
        window.announcementManager.switchMediaTab(tabName);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal && e.target === modal) {
        closeEnhancedModal();
    }
});

// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEnhancedModal();
    }
});

// Initialize the manager when the page loads
let announcementManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing announcement system...');
    
    // Create announcement manager
    announcementManager = new AnnouncementManager();
    
    // Make it globally available
    window.announcementManager = announcementManager;
    
    // Also make utility functions globally available
    window.openEnhancedModal = () => {
        const modal = document.getElementById('enhancedAnnouncementModal');
        if (modal) {
            modal.style.display = 'block';
            if (announcementManager) {
                announcementManager.loadAllAnnouncements();
                announcementManager.switchTab('create');
            }
        }
    };
    
    window.closeEnhancedModal = () => {
        const modal = document.getElementById('enhancedAnnouncementModal');
        if (modal) {
            modal.style.display = 'none';
            if (announcementManager) {
                announcementManager.resetCreateForm();
            }
        }
    };
    
    window.changeSlide = (direction) => {
        if (announcementManager) {
            announcementManager.changeSlide(direction);
        }
    };
    
    window.changeDashboardSlide = (direction) => {
        if (announcementManager) {
            announcementManager.changeDashboardSlide(direction);
        }
    };
    
    window.goToDashboardSlide = (index) => {
        if (announcementManager) {
            announcementManager.goToDashboardSlide(index);
        }
    };
    
    window.toggleDashboardSlideshow = () => {
        if (announcementManager) {
            announcementManager.toggleDashboardSlideshow();
        }
    };
    
    console.log('Announcement system initialization started');
});

// ========== COMPLETE DAILY REWARDS SYSTEM - PERSISTENT FIRESTORE ==========

// ========== COMPLETE DAILY REWARDS SYSTEM - PERSISTENT FIRESTORE ==========

class DailyRewardsSystem {
    constructor() {
        this.db = firebase.firestore();
        this.rewardsRef = this.db.collection('rewards');
        this.redemptionsRef = this.db.collection('redemptions');
        this.currentUser = null;
        this.isAdmin = false;
        this.isInitialized = false;
    }

    async init(currentUser) {
        console.log('🎁 Initializing Daily Rewards System for:', currentUser?.username);
        
        this.currentUser = currentUser;
        this.isAdmin = currentUser?.is_admin || false;
        
        try {
            // Setup initial data if needed
            await this.setupInitialData();
            
            // Load appropriate data based on user type
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('✅ Daily Rewards System initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing rewards system:', error);
            throw error;
        }
    }

    async setupInitialData() {
        try {
            // Check if system config exists
            const configRef = this.db.collection('system_settings').doc('rewards_config');
            const configDoc = await configRef.get();
            
            if (!configDoc.exists) {
                await configRef.set({
                    min_reward_amount: 10,
                    max_reward_amount: 1000000,
                    default_expiry_days: 30,
                    daily_claim_limit: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                console.log('✅ Created rewards system config');
            }
            
            // Create some default reward codes if admin and none exist
            if (this.isAdmin) {
                await this.createDefaultRewardCodes();
            }
            
        } catch (error) {
            console.error('Error setting up initial data:', error);
        }
    }

    async createDefaultRewardCodes() {
        try {
            const existingCodes = await this.rewardsRef.limit(1).get();
            
            if (existingCodes.empty) {
                console.log('Creating default reward codes...');
                
                const defaultCodes = [
                    {
                        code: 'WELCOME100',
                        amount: 1000,
                        expires_at: this.addDays(new Date(), 365).toISOString(), // 1 year
                        max_claims: 1000,
                        created_by: {
                            user_id: this.currentUser.id,
                            username: this.currentUser.username
                        },
                        status: 'active'
                    },
                    {
                        code: 'BONUS500',
                        amount: 5000,
                        expires_at: this.addDays(new Date(), 180).toISOString(), // 6 months
                        max_claims: 500,
                        created_by: {
                            user_id: this.currentUser.id,
                            username: this.currentUser.username
                        },
                        status: 'active'
                    },
                    {
                        code: 'VIP1000',
                        amount: 10000,
                        expires_at: this.addDays(new Date(), 90).toISOString(), // 3 months
                        max_claims: 100,
                        created_by: {
                            user_id: this.currentUser.id,
                            username: this.currentUser.username
                        },
                        status: 'active'
                    }
                ];
                
                for (const codeData of defaultCodes) {
                    await this.createRewardCode(codeData);
                }
                
                console.log('✅ Created default reward codes');
            }
        } catch (error) {
            console.error('Error creating default reward codes:', error);
        }
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    async createRewardCode(codeData) {
        try {
            const now = new Date();
            
            const rewardData = {
                code: codeData.code.toUpperCase(),
                amount: parseInt(codeData.amount),
                expires_at: codeData.expires_at || this.addDays(now, 30).toISOString(),
                max_claims: codeData.max_claims || 999999,
                claims_count: 0,
                created_by: {
                    user_id: this.currentUser.id,
                    username: this.currentUser.username,
                    email: this.currentUser.email
                },
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
                status: 'active',
                is_active: true
            };
            
            await this.rewardsRef.doc(rewardData.code).set(rewardData);
            return rewardData;
            
        } catch (error) {
            console.error('Error creating reward code:', error);
            throw error;
        }
    }

    async loadInitialData() {
        try {
            if (this.isAdmin) {
                // Admin: Load both codes and redemptions
                await this.loadAdminRewardCodes();
                await this.loadAllRedemptions();
            } else {
                // User: Load their redemption history
                await this.loadUserRedemptions();
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    async generateRewardCode(amount, expiresAt, usageLimit) {
        try {
            if (!this.isAdmin) {
                throw new Error('Admin access required');
            }

            // Validate inputs
            amount = parseInt(amount);
            if (isNaN(amount) || amount < 10) {
                throw new Error('Amount must be at least 10 TZS');
            }

            // Generate unique code
            const code = await this.generateUniqueCode();

            // Prepare expiry date
            let expiryDate;
            if (expiresAt) {
                expiryDate = new Date(expiresAt);
                if (isNaN(expiryDate.getTime())) {
                    throw new Error('Invalid expiry date format');
                }
                expiryDate.setHours(23, 59, 59, 0);
                
                if (expiryDate <= new Date()) {
                    throw new Error('Expiry date must be in the future');
                }
            } else {
                // Default: 30 days from now
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                expiryDate.setHours(23, 59, 59, 0);
            }

            // Create reward document
            const rewardData = {
                code: code,
                amount: amount,
                expires_at: expiryDate.toISOString(),
                max_claims: parseInt(usageLimit) || 999999,
                claims_count: 0,
                created_by: {
                    user_id: this.currentUser.id,
                    username: this.currentUser.username,
                    email: this.currentUser.email
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'active',
                is_active: true
            };

            // Save to Firestore
            await this.rewardsRef.doc(code).set(rewardData);

            console.log('✅ Reward code generated:', code);
            return {
                success: true,
                code: code,
                amount: amount,
                expires_at: expiryDate.toISOString(),
                message: `Reward code ${code} generated successfully!`
            };

        } catch (error) {
            console.error('❌ Error generating reward code:', error);
            throw error;
        }
    }

    async generateUniqueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        let attempts = 0;
        
        while (attempts < 100) {
            code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // Check if code exists
            const existing = await this.rewardsRef.doc(code).get();
            if (!existing.exists) {
                return code;
            }
            attempts++;
        }
        
        // Fallback: Add timestamp
        code += Date.now().toString().slice(-4);
        return code;
    }

    async loadAdminRewardCodes() {
        try {
            const snapshot = await this.rewardsRef
                .orderBy('created_at', 'desc')
                .limit(100)
                .get();
            
            const codes = snapshot.docs.map(doc => {
                const data = doc.data();
                const expiresAt = new Date(data.expires_at);
                const now = new Date();
                
                return {
                    id: doc.id,
                    ...data,
                    is_expired: expiresAt < now,
                    can_claim: data.is_active && expiresAt > now && data.claims_count < data.max_claims,
                    expiry_date: this.formatDate(data.expires_at)
                };
            });
            
            this.adminRewardCodes = codes;
            return codes;
            
        } catch (error) {
            console.error('Error loading admin reward codes:', error);
            return [];
        }
    }

    async loadAllRedemptions() {
        try {
            const snapshot = await this.redemptionsRef
                .orderBy('claimed_at', 'desc')
                .limit(100)
                .get();
            
            const redemptions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    claimed_date: this.formatDateTime(data.claimed_at)
                };
            });
            
            this.allRedemptions = redemptions;
            return redemptions;
            
        } catch (error) {
            console.error('Error loading all redemptions:', error);
            return [];
        }
    }

    async deactivateRewardCode(code) {
        try {
            await this.rewardsRef.doc(code).update({
                is_active: false,
                status: 'inactive',
                updated_at: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Error deactivating reward code:', error);
            return false;
        }
    }

    // ========== USER FUNCTIONS ==========

    async claimReward(code) {
        try {
            if (!this.currentUser) {
                throw new Error('Please login to claim rewards');
            }

            // Get reward data
            const rewardDoc = await this.rewardsRef.doc(code.toUpperCase()).get();
            if (!rewardDoc.exists) {
                throw new Error('Invalid reward code');
            }

            const reward = rewardDoc.data();
            const now = new Date();
            const expiresAt = new Date(reward.expires_at);

            // Validations
            if (!reward.is_active || reward.status !== 'active') {
                throw new Error('This reward code is no longer active');
            }

            if (expiresAt < now) {
                throw new Error('This reward code has expired');
            }

            if (reward.claims_count >= reward.max_claims) {
                throw new Error('This reward code has reached its usage limit');
            }

            // Check if user already claimed this code
            const existingClaim = await this.redemptionsRef
                .where('user_id', '==', this.currentUser.id)
                .where('reward_code', '==', code.toUpperCase())
                .limit(1)
                .get();

            if (!existingClaim.empty) {
                throw new Error('You have already claimed this reward');
            }

            // Start batch write for atomic operation
            const batch = this.db.batch();

            // 1. Update reward claims count
            const rewardRef = this.rewardsRef.doc(code.toUpperCase());
            batch.update(rewardRef, {
                claims_count: firebase.firestore.FieldValue.increment(1),
                updated_at: now.toISOString(),
                last_claimed_at: now.toISOString()
            });

            // 2. Create redemption record
            const redemptionId = this.redemptionsRef.doc().id;
            const redemptionRef = this.redemptionsRef.doc(redemptionId);
            const redemptionData = {
                id: redemptionId,
                user_id: this.currentUser.id,
                username: this.currentUser.username,
                email: this.currentUser.email,
                reward_code: code.toUpperCase(),
                amount: reward.amount,
                claimed_at: now.toISOString(),
                status: 'success',
                reward_details: {
                    created_by: reward.created_by,
                    expires_at: reward.expires_at
                }
            };
            batch.set(redemptionRef, redemptionData);

            // 3. Update user balance
            const userRef = this.db.collection('users').doc(this.currentUser.id.toString());
            batch.update(userRef, {
                balance: firebase.firestore.FieldValue.increment(reward.amount),
                updated_at: now.toISOString()
            });

            // 4. Add transaction record
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            
            const transaction = {
                id: Date.now(),
                user_id: this.currentUser.id,
                type: 'reward',
                amount: reward.amount,
                method: 'reward_code',
                status: 'approved',
                date: now.toISOString(),
                details: {
                    description: `Reward claim using code: ${code}`,
                    reward_code: code.toUpperCase(),
                    auto_approved: true
                },
                created_at: now.toISOString()
            };
            
            transactions.push(transaction);
            batch.update(userRef, { transactions: transactions });

            // Execute batch
            await batch.commit();

            // Update local user balance
            if (window.db && window.db.currentUser) {
                window.db.currentUser.balance += reward.amount;
                
                // Add redemption to local cache
                if (!window.db.currentUser.redemptions) {
                    window.db.currentUser.redemptions = [];
                }
                window.db.currentUser.redemptions.push(redemptionData);
            }

            // Refresh data
            if (this.isAdmin) {
                await this.loadAdminRewardCodes();
                await this.loadAllRedemptions();
            } else {
                await this.loadUserRedemptions();
            }

            return {
                success: true,
                amount: reward.amount,
                redemption_id: redemptionId,
                message: `Successfully claimed ${this.formatCurrency(reward.amount)}!`
            };

        } catch (error) {
            console.error('Error claiming reward:', error);
            
            // Record failed attempt
            await this.recordFailedRedemption(code, error.message);
            
            throw error;
        }
    }

    async recordFailedRedemption(code, errorMessage) {
        try {
            if (!this.currentUser) return;
            
            await this.redemptionsRef.add({
                user_id: this.currentUser.id,
                username: this.currentUser.username,
                reward_code: code.toUpperCase(),
                status: 'failed',
                error: errorMessage,
                attempted_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error recording failed redemption:', error);
        }
    }

    async loadUserRedemptions() {
        try {
            if (!this.currentUser) return [];
            
            const snapshot = await this.redemptionsRef
                .where('user_id', '==', this.currentUser.id)
                .where('status', '==', 'success')
                .orderBy('claimed_at', 'desc')
                .limit(50)
                .get();
            
            const redemptions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    claimed_date: this.formatDateTime(data.claimed_at)
                };
            });
            
            this.userRedemptions = redemptions;
            
            // Also store in local user object for quick access
            if (window.db && window.db.currentUser) {
                window.db.currentUser.redemptions = redemptions;
            }
            
            return redemptions;
            
        } catch (error) {
            console.error('Error loading user redemptions:', error);
            return [];
        }
    }

    // ========== STATISTICS ==========

    async getRewardStats() {
        try {
            // Get total rewards
            const rewardsSnapshot = await this.rewardsRef.get();
            
            // Get user-specific stats
            let userClaims = 0;
            let userAmount = 0;
            
            if (this.currentUser) {
                const userRedemptions = await this.redemptionsRef
                    .where('user_id', '==', this.currentUser.id)
                    .where('status', '==', 'success')
                    .get();
                
                userClaims = userRedemptions.size;
                userAmount = userRedemptions.docs.reduce((sum, doc) => {
                    return sum + (doc.data().amount || 0);
                }, 0);
            }
            
            // Get active codes
            const now = new Date().toISOString();
            const activeCodesSnapshot = await this.rewardsRef
                .where('is_active', '==', true)
                .where('expires_at', '>', now)
                .get();
            
            const activeCodes = activeCodesSnapshot.size;
            
            // Get total claimed amount
            const allRedemptions = await this.redemptionsRef
                .where('status', '==', 'success')
                .get();
            
            const totalClaimed = allRedemptions.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || 0);
            }, 0);
            
            return {
                total_codes: rewardsSnapshot.size,
                active_codes: activeCodes,
                total_claimed_amount: totalClaimed,
                user_claims: userClaims,
                user_claimed_amount: userAmount
            };
            
        } catch (error) {
            console.error('Error getting reward stats:', error);
            return {
                total_codes: 0,
                active_codes: 0,
                total_claimed_amount: 0,
                user_claims: 0,
                user_claimed_amount: 0
            };
        }
    }

    // ========== HELPER FUNCTIONS ==========

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS'
        }).format(amount);
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString('en-TZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    formatDateTime(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleString('en-TZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    isExpired(expiresAt) {
        try {
            return new Date(expiresAt) < new Date();
        } catch (error) {
            return true;
        }
    }

    cleanup() {
        this.currentUser = null;
        this.isAdmin = false;
        this.isInitialized = false;
        this.adminRewardCodes = [];
        this.userRedemptions = [];
        this.allRedemptions = [];
    }
}

// ========== GLOBAL REWARDS SYSTEM MANAGEMENT ==========

let rewardsSystem = null;

async function initializeRewardsSystem(user) {
    try {
        if (!user) {
            console.log('No user provided for rewards system initialization');
            return null;
        }
        
        // Cleanup existing system
        if (rewardsSystem) {
            rewardsSystem.cleanup();
        }
        
        // Create new system
        rewardsSystem = new DailyRewardsSystem();
        await rewardsSystem.init(user);
        
        window.rewardsSystem = rewardsSystem; // Make globally available
        
        // Load appropriate UI based on user type
        if (user.is_admin) {
            await loadAdminRewardsUI();
        } else {
            await loadUserRewardsUI();
        }
        // Initialize appropriate UI based on user type
        await initializeRewardsUI();
        console.log('✅ Rewards system initialized for user:', user.username);
        return rewardsSystem;
        
    } catch (error) {
        console.error('❌ Error initializing rewards system:', error);
        return null;
    }
}

function cleanupRewardsSystem() {
    if (rewardsSystem) {
        rewardsSystem.cleanup();
        rewardsSystem = null;
        window.rewardsSystem = null;
    }
}

// ========== USER REWARDS FUNCTIONS ==========

async function claimReward() {
    try {
        if (!rewardsSystem || !rewardsSystem.currentUser) {
            showNotification('Please login to claim rewards', true);
            return;
        }
        
        const codeInput = document.getElementById('reward-code-input');
        const statusElement = document.getElementById('reward-status');
        
        if (!codeInput) {
            alert('Reward code input not found');
            return;
        }
        
        const code = codeInput.value.trim();
        if (!code) {
            showRewardStatus('Please enter a reward code', 'error', statusElement);
            return;
        }
        
        // Show loading
        const claimBtn = document.getElementById('claim-reward-btn') || 
                        document.querySelector('.btn-claim-reward');
        const originalText = claimBtn?.innerHTML;
        if (claimBtn) {
            claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            claimBtn.disabled = true;
        }
        
        // Claim reward
        const result = await rewardsSystem.claimReward(code);
        
        if (result.success) {
            // Update UI
            showRewardStatus(result.message, 'success', statusElement);
            
            // Clear input
            codeInput.value = '';
            
            // Update balance displays
            updateAllBalanceDisplays();
            
            // Refresh UI
            if (rewardsSystem.isAdmin) {
                await loadAdminRewardsUI();
            } else {
                await loadUserRewardsUI();
            }
            
            // Show success notification
            showNotification(`🎉 ${result.message}`, false);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (statusElement) statusElement.style.display = 'none';
            }, 5000);
        }
        
    } catch (error) {
        console.error('Claim reward error:', error);
        showRewardStatus(`❌ ${error.message || 'Failed to claim reward'}`, 'error');
        showNotification(`❌ ${error.message || 'Failed to claim reward'}`, true);
    } finally {
        // Reset button
        const claimBtn = document.getElementById('claim-reward-btn') || 
                        document.querySelector('.btn-claim-reward');
        if (claimBtn) {
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Reward';
            claimBtn.disabled = false;
        }
    }
}



// ========== ADMIN REWARDS FUNCTIONS ==========

async function generateRewardCode() {
    try {
        if (!rewardsSystem || !rewardsSystem.isAdmin) {
            alert('Admin access required');
            return;
        }
        
        const amountInput = document.getElementById('reward-amount');
        const expiryInput = document.getElementById('reward-expiry');
        const limitInput = document.getElementById('reward-usage-limit');
        
        if (!amountInput) {
            alert('Amount input not found');
            return;
        }
        
        const amount = parseInt(amountInput.value);
        const expiry = expiryInput?.value;
        const limit = limitInput?.value ? parseInt(limitInput.value) : null;
        
        // Validation
        if (isNaN(amount) || amount < 10) {
            alert('Please enter a valid amount (minimum 10 TZS)');
            return;
        }
        
        // Show loading
        const generateBtn = document.querySelector('button[onclick="generateRewardCode()"]') ||
                           document.querySelector('.btn-generate-code');
        const originalText = generateBtn?.innerHTML;
        if (generateBtn) {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;
        }
        
        // Generate code
        const result = await rewardsSystem.generateRewardCode(amount, expiry, limit);
        
        // Reset form
        if (amountInput) amountInput.value = '1000';
        if (expiryInput) expiryInput.value = '';
        if (limitInput) limitInput.value = '';
        
        // Refresh UI
        await loadAdminRewardsUI();
        
        // Show success
        alert(`✅ Reward code generated!\n\nCode: ${result.code}\nAmount: ${rewardsSystem.formatCurrency(amount)}\n\nShare this code with users!`);
        
    } catch (error) {
        console.error('Generate code error:', error);
        alert(`❌ ${error.message || 'Failed to generate reward code'}`);
    } finally {
        // Reset button
        const generateBtn = document.querySelector('button[onclick="generateRewardCode()"]') ||
                           document.querySelector('.btn-generate-code');
        if (generateBtn) {
            generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate Code';
            generateBtn.disabled = false;
        }
    }
}

async function loadAdminRewardsUI() {
    try {
        if (!rewardsSystem || !rewardsSystem.isAdmin) return;
        
        // Load data in parallel
        const [codes, redemptions, stats] = await Promise.all([
            rewardsSystem.loadAdminRewardCodes(),
            rewardsSystem.loadAllRedemptions(),
            rewardsSystem.getRewardStats()
        ]);
        
        // Update reward codes list
        const codesContainer = document.getElementById('active-reward-codes') ||
                              document.getElementById('reward-codes-list');
        if (codesContainer) {
            if (codes.length === 0) {
                codesContainer.innerHTML = `
                    <div class="no-rewards">
                        <i class="fas fa-gift"></i>
                        <h4>No reward codes found</h4>
                        <p>Generate your first reward code using the form.</p>
                    </div>
                `;
            } else {
                let html = '';
                codes.forEach(code => {
                    const isExpired = rewardsSystem.isExpired(code.expires_at);
                    const usage = `${code.claims_count || 0}/${code.max_claims || '∞'}`;
                    const expiry = rewardsSystem.formatDate(code.expires_at);
                    
                    html += `
                        <div class="reward-code-item ${isExpired ? 'expired' : ''}">
                            <div class="reward-code-header">
                                <div class="code">${code.code}</div>
                                <div class="amount">${rewardsSystem.formatCurrency(code.amount)}</div>
                            </div>
                            <div class="reward-details">
                                <div><strong>Expires:</strong> ${expiry}</div>
                                <div><strong>Usage:</strong> ${usage}</div>
                                <div><strong>Status:</strong> ${code.status || 'active'}</div>
                                <div><strong>Created by:</strong> ${code.created_by?.username || 'Admin'}</div>
                            </div>
                            <div class="reward-actions">
                                <button class="btn btn-copy" onclick="copyToClipboard('${code.code}')">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                                <button class="btn btn-deactivate" onclick="deactivateRewardCode('${code.code}')">
                                    <i class="fas fa-ban"></i> ${isExpired ? 'Delete' : 'Deactivate'}
                                </button>
                            </div>
                        </div>
                    `;
                });
                codesContainer.innerHTML = html;
            }
        }
        
        // Update redemption history
        const historyContainer = document.getElementById('reward-redemption-history');
        if (historyContainer) {
            if (redemptions.length === 0) {
                historyContainer.innerHTML = `
                    <div class="no-rewards">
                        <i class="fas fa-history"></i>
                        <h4>No redemption history</h4>
                        <p>No rewards have been claimed yet.</p>
                    </div>
                `;
            } else {
                let html = '';
                redemptions.forEach(redemption => {
                    html += `
                        <div class="redemption-item">
                            <div class="redemption-info">
                                <div><strong>${redemption.username || 'User'}</strong></div>
                                <div class="code">${redemption.reward_code}</div>
                                <div class="date">${rewardsSystem.formatDateTime(redemption.claimed_at)}</div>
                                <div class="status ${redemption.status}">${redemption.status}</div>
                            </div>
                            <div class="redemption-amount">${rewardsSystem.formatCurrency(redemption.amount)}</div>
                        </div>
                    `;
                });
                historyContainer.innerHTML = html;
            }
        }
        
        // Update stats
        const totalCodesEl = document.getElementById('total-active-codes');
        const totalAmountEl = document.getElementById('total-redeemed-amount');
        
        if (totalCodesEl) totalCodesEl.textContent = stats.total_codes;
        if (totalAmountEl) totalAmountEl.textContent = rewardsSystem.formatCurrency(stats.total_claimed_amount);
        
    } catch (error) {
        console.error('Error loading admin rewards UI:', error);
    }
}

// ========== HELPER FUNCTIONS ==========

function showRewardStatus(message, type, element = null) {
    const statusElement = element || document.getElementById('reward-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `reward-status ${type}`;
        statusElement.style.display = 'block';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showNotification('✅ Copied to clipboard!', false))
        .catch(err => showNotification('❌ Failed to copy', true));
}

async function deactivateRewardCode(code) {
    if (!confirm('Are you sure you want to deactivate this reward code?')) {
        return;
    }
    
    try {
        if (!rewardsSystem) return;
        
        const success = await rewardsSystem.deactivateRewardCode(code);
        
        if (success) {
            showNotification('✅ Reward code deactivated', false);
            setTimeout(loadAdminRewardsUI, 500);
        } else {
            showNotification('❌ Failed to deactivate', true);
        }
    } catch (error) {
        console.error('Deactivate error:', error);
        showNotification('❌ Error: ' + error.message, true);
    }
}

// Make functions globally available
window.claimReward = claimReward;
window.generateRewardCode = generateRewardCode;
window.copyRewardCode = copyToClipboard;
window.deactivateRewardCode = deactivateRewardCode;
window.loadAdminRewardsUI = loadAdminRewardsUI;
window.initializeRewardsSystem = initializeRewardsSystem;

console.log('✅ Daily Rewards System loaded successfully');
 
// Quick amount buttons for withdraw modal
function setupQuickAmountButtons() {
    const quickAmountButtons = document.querySelectorAll('.quick-amount');
    const amountInput = document.getElementById('withdraw-amount');
    
    quickAmountButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            amountInput.value = amount;
            
            // Trigger input event to update calculations if needed
            amountInput.dispatchEvent(new Event('input'));
            
            // Optional: Add visual feedback
            quickAmountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', setupQuickAmountButtons);

// Quick amount buttons for deposit modal
function setupDepositQuickAmountButtons() {
    const depositQuickButtons = document.querySelectorAll('.deposit-quick-amount');
    const depositAmountInput = document.getElementById('amount'); // Change to your deposit input ID
    
    depositQuickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            depositAmountInput.value = amount;
            
            // Trigger input event to update calculations if needed
            depositAmountInput.dispatchEvent(new Event('input'));
            
            // Optional: Add visual feedback
            depositQuickButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', setupDepositQuickAmountButtons);

// Profile Tab Switch Functionality
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId + '-section');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Initialize tab functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all dashboard tabs
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target tab from onclick attribute
            const onclickContent = this.getAttribute('onclick');
            const match = onclickContent.match(/switchTab\('([^']+)'\)/);
            
            if (match && match[1]) {
                switchTab(match[1]);
            }
        });
    });
});

async function signup() {
    console.log('=== SIGNUP PROCESS STARTED ===');
    
    // Get form values
    const username = document.getElementById('signup-username').value.trim();
    let email = document.getElementById('signup-email').value.trim().toLowerCase();
    let referralCode = document.getElementById('signup-referral').value.trim().toUpperCase();
    const password = document.getElementById('signup-password').value;
    const password2 = document.getElementById('signup-password2').value;
    
    // Check for stored referral code from URL parameter
    const storedReferralCode = localStorage.getItem('pending_referral_code');
    if (storedReferralCode && (!referralCode || referralCode === '')) {
        referralCode = storedReferralCode;
        document.getElementById('signup-referral').value = referralCode;
    }
    
    // Debug logging
    console.log('Form values:', { username, email, referralCode, password: '***' });
    
    // Check terms agreement
    const agreeTerms = document.getElementById('agree-terms').checked;
    
    // Validate inputs
    if (!username || !email || !referralCode || !password || !password2) {
        alert('❌ Please fill in all fields');
        return;
    }
    
    if (!agreeTerms) {
        alert('❌ You must agree to the Terms and Conditions');
        return;
    }
    
    if (password !== password2) {
        alert('❌ Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
    }
    
    try {
        console.log('Step 1: Checking database...');
        if (!db) {
            alert('❌ Database not initialized. Please refresh the page.');
            return;
        }
        
        console.log('Step 2: Checking referral code:', referralCode);
        const referrer = await db.findUserByReferralCode(referralCode);
        if (!referrer) {
            alert('❌ Invalid referral code. Please enter a valid referral code.');
            return;
        }
        console.log('Referrer found:', referrer.username);
        
        // Show loading state
        console.log('Step 3: Setting loading state...');
        const signupBtn = document.querySelector('#signup-form button[type="button"]');
        const originalBtnText = signupBtn?.textContent || 'Sign Up';
        if (signupBtn) {
            signupBtn.textContent = 'Creating Account...';
            signupBtn.disabled = true;
        }
        
        // Check username availability
        console.log('Step 4: Checking username availability:', username);
        const existingUserByUsername = await db.findUserByUsername(username);
        
        if (existingUserByUsername) {
            // Reset button state
            if (signupBtn) {
                signupBtn.textContent = originalBtnText;
                signupBtn.disabled = false;
            }
            
            const isSameEmail = existingUserByUsername.email === email;
            if (isSameEmail) {
                alert('❌ You already have an account with this email. Please login instead.');
                return;
            } else {
                alert('❌ Username already taken. Please choose a different username.');
                return;
            }
        }
        
        // Check email availability
        console.log('Step 5: Checking email availability:', email);
        const existingUserByEmail = await db.findUserByEmail(email);
        
        if (existingUserByEmail) {
            // Reset button state
            if (signupBtn) {
                signupBtn.textContent = originalBtnText;
                signupBtn.disabled = false;
            }
            alert('❌ Email already registered. Please use a different email or login.');
            return;
        }
        
        console.log('Step 6: Creating new user...');
        
        // Create new user
        const newUser = await db.createUser({
            username: username,
            email: email,
            password: password,
            referred_by: referralCode
        });
        
        console.log('Step 7: New user created:', newUser);
        
        // Add referral data to referrer
        console.log('Step 8: Adding referral to referrer');
        const referralData = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            join_date: newUser.join_date,
            bonus_pending: true,
            first_deposit_amount: 0,
            bonus_amount: 0,
            bonus_paid: false,
            bonus_paid_date: null
        };
        
        await db.addReferralToUser(referrer.id, referralData);
        console.log('Step 9: Referral added');
        
        // Set current user
        db.currentUser = newUser;
        
        // Reset button state
        if (signupBtn) {
            signupBtn.textContent = originalBtnText;
            signupBtn.disabled = false;
        }
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Show success
        alert(`✅ Signup successful! Welcome ${username}`);
        // FIXED: Changed signupButton to signupBtn
        if (signupBtn) {
            signupBtn.textContent = 'Sign Up';
            signupBtn.disabled = false;
        }
        console.log('=== SIGNUP COMPLETED SUCCESSFULLY ===');
        
        // Show dashboard
        showUserDashboard();
        
    } catch (error) {
        console.error('=== SIGNUP ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Reset button
        const signupBtn = document.querySelector('#signup-form button[type="button"]');
        if (signupBtn) {
            signupBtn.textContent = 'Create Account';
            signupBtn.disabled = false;
        }
        
        alert(`❌ Signup failed: ${error.message || 'Please try again.'}`);
    }
}
        
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
    console.log('Updating mineral prices:', newPrices);
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
        console.error('Failed to copy: ', err);
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

// Calculator Functions
function updateCalculator() {
    const mineral = document.getElementById('calc-mineral');
    const amount = parseFloat(document.getElementById('calc-amount').value) || 0;
    const days = parseInt(document.getElementById('calc-days').value) || 0;
    
    // Calculate profit based on weekdays and weekends
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    // Weekdays: Monday-Friday (5 days per week)
    const weekdays = (weeks * 5) + Math.min(remainingDays, 5);
    // Weekends: Saturday-Sunday (2 days per week)
    const weekends = (weeks * 2) + Math.max(0, remainingDays - 5);
    
    const weekdayProfit = amount * 0.03 * weekdays;
    const weekendProfit = amount * 0.04 * weekends;
    const totalProfit = weekdayProfit + weekendProfit;
    const totalReturn = amount + totalProfit;
    const monthlyProfit = (totalProfit / days) * 30;
    
    // Update display
    document.getElementById('calc-total-investment').textContent = `TZS ${Math.round(amount).toLocaleString()}`;
    document.getElementById('calc-total-profit').textContent = `TZS ${Math.round(totalProfit).toLocaleString()}`;
    document.getElementById('calc-total-return').textContent = `TZS ${Math.round(totalReturn).toLocaleString()}`;
    document.getElementById('calc-monthly-profit').textContent = `TZS ${Math.round(monthlyProfit).toLocaleString()}`;
}

function setCalculatorAmount(amount) {
    document.getElementById('calc-amount').value = amount;
    updateCalculator();
}

// FAQ Functions
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');
}

// Initialize calculator on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateCalculator, 100);
});

// Make functions globally available
window.setCalculatorAmount = setCalculatorAmount;
window.updateCalculator = updateCalculator;
window.toggleFAQ = toggleFAQ;

   // Add loading state function at the beginning of your file, after firebase initialization
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        button.disabled = true;
    } else {
        button.innerHTML = button.getAttribute('data-original-text');
        button.disabled = false;
    }
}

// Update the DOMContentLoaded event listener to ensure signup function is properly attached
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase();
    
    // Initialize login tabs
    initLoginTabs();
    
    // Set up form submissions with loading states
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            signup();
        });
    }
    
    // Check if user is already logged in (from session)
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
});

// Add loading state function with dots animation
function setButtonLoading(button, isLoading, buttonType = 'login') {
    if (isLoading) {
        button.setAttribute('data-original-text', button.innerHTML);
        if (buttonType === 'login') {
            button.innerHTML = 'Logging in<span class="loading-dots"></span>';
        } else {
            button.innerHTML = 'Creating Account<span class="loading-dots"></span>';
        }
        button.disabled = true;
        button.classList.add('loading');
        
        // Start dots animation
        startDotsAnimation(button.querySelector('.loading-dots'));
    } else {
        button.innerHTML = button.getAttribute('data-original-text');
        button.disabled = false;
        button.classList.remove('loading');
        
        // Stop dots animation
        const dots = button.querySelector('.loading-dots');
        if (dots) {
            clearInterval(dots.animationInterval);
        }
    }
}

// Dots animation function
function startDotsAnimation(dotsElement) {
    if (!dotsElement) return;
    
    let dotsCount = 0;
    const maxDots = 3;
    
    dotsElement.animationInterval = setInterval(() => {
        dotsCount = (dotsCount + 1) % (maxDots + 1);
        dotsElement.textContent = '.'.repeat(dotsCount);
    }, 300);
}

// ====================
// REFERRAL SYSTEM FUNCTIONS
// ====================

// Initialize referral system
function initReferralSystem() {
    console.log('Initializing referral system...');
    
    // Load referral data
    loadReferralData();
    
    // Generate dynamic referral link
    updateReferralLink();
    
    // Setup event listeners
    setupReferralEventListeners();
    
    // Auto-process URL referral parameter
    processUrlReferralParameter();
}

// Setup referral event listeners
function setupReferralEventListeners() {
    // Copy referral code button
    const copyCodeBtn = document.getElementById('copy-referral-code-btn');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyReferralCode);
    }
    
    // Copy referral link button
    const copyLinkBtn = document.getElementById('copy-referral-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyReferralLink);
    }
    
    // Share buttons
    const whatsappBtn = document.querySelector('.share-btn.whatsapp');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', shareViaWhatsApp);
    }
    
    const emailBtn = document.querySelector('.share-btn.email');
    if (emailBtn) {
        emailBtn.addEventListener('click', shareViaEmail);
    }
    
    const smsBtn = document.querySelector('.share-btn.sms');
    if (smsBtn) {
        smsBtn.addEventListener('click', shareViaSMS);
    }
    
    // Referral filter
    const referralFilter = document.getElementById('referral-filter');
    if (referralFilter) {
        referralFilter.addEventListener('change', filterReferrals);
    }
    
    // Refresh referrals button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadReferralData);
    }
}

// Generate dynamic referral link
function updateReferralLink() {
    if (!db.currentUser || !db.currentUser.referral_code) {
        console.log('No user logged in or no referral code');
        return;
    }
    
    const referralLinkElement = document.getElementById('referral-link-text');
    if (referralLinkElement) {
        const baseUrl = window.location.origin || 'https://tanzania-mining-investment.web.app';
        const referralLink = `${baseUrl}/?ref=${db.currentUser.referral_code}`;
        referralLinkElement.textContent = referralLink;
        
        // Also update any other referral link displays
        const referralLinkDisplay = document.getElementById('user-referral-link');
        if (referralLinkDisplay) {
            referralLinkDisplay.textContent = referralLink;
        }
    }
}

// Copy referral code function
function copyReferralCode() {
    if (!db.currentUser) {
        showNotification('Please login first', true);
        return;
    }
    
    const referralCode = db.currentUser.referral_code;
    if (!referralCode) {
        showNotification('No referral code available', true);
        return;
    }
    
    navigator.clipboard.writeText(referralCode)
        .then(() => {
            showNotification('Referral code copied to clipboard!');
            
            // Visual feedback
            const copyBtn = document.getElementById('copy-referral-code-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.style.background = '#27ae60';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy referral code', true);
        });
}

// Copy referral link function
function copyReferralLink() {
    const referralLinkElement = document.getElementById('referral-link-text');
    if (!referralLinkElement) {
        showNotification('Referral link not found', true);
        return;
    }
    
    const referralLink = referralLinkElement.textContent;
    if (!referralLink || referralLink.includes('ref=-')) {
        showNotification('Please generate a referral link first', true);
        return;
    }
    
    navigator.clipboard.writeText(referralLink)
        .then(() => {
            showNotification('Referral link copied to clipboard!');
            
            // Visual feedback
            const copyBtn = document.getElementById('copy-referral-link-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyBtn.style.background = '#27ae60';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy referral link', true);
        });
}

// Share via WhatsApp
function shareViaWhatsApp() {
    if (!db.currentUser) {
        showNotification('Please login first', true);
        return;
    }
    
    const referralLinkElement = document.getElementById('referral-link-text');
    if (!referralLinkElement) return;
    
    const referralLink = referralLinkElement.textContent;
    const message = `Join Tanzania Mining Investment and start earning with precious minerals! Use my referral link to get started: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
}

// Share via Email
function shareViaEmail() {
    if (!db.currentUser) {
        showNotification('Please login first', true);
        return;
    }
    
    const referralLinkElement = document.getElementById('referral-link-text');
    if (!referralLinkElement) return;
    
    const referralLink = referralLinkElement.textContent;
    const subject = 'Join Tanzania Mining Investment - Great Opportunity!';
    const body = `Hello!

I wanted to share this amazing investment opportunity with you. Tanzania Mining Investment offers fantastic returns on precious minerals investments.

Join using my referral link to get started:
${referralLink}

Key Benefits:
✅ High returns on investment
✅ Multiple minerals to choose from
✅ Secure platform
✅ Daily profit calculations
✅ Referral bonuses

Let's grow our wealth together!

Best regards,
${db.currentUser.username}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Share via SMS
function shareViaSMS() {
    if (!db.currentUser) {
        showNotification('Please login first', true);
        return;
    }
    
    const referralLinkElement = document.getElementById('referral-link-text');
    if (!referralLinkElement) return;
    
    const referralLink = referralLinkElement.textContent;
    const message = `Join Tanzania Mining Investment! Use my referral link: ${referralLink}`;
    
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
}

// Load referral data with multi-level tracking
async function loadReferralData() {
    try {
        if (!db.currentUser) {
            console.log('No user logged in for referral data');
            return;
        }
        
        console.log('Loading referral data for user:', db.currentUser.id);
        
        // Show loading state
        const referralsBody = document.getElementById('referrals-table-body');
        if (referralsBody) {
            referralsBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <p>Loading referral data...</p>
                    </td>
                </tr>
            `;
        }
        
        // Get all users to analyze referrals
        const allUsers = await db.getUsers();
        const currentUserId = db.currentUser.id;
        
        // Filter direct referrals (1st generation)
        const directReferrals = allUsers.filter(user => 
            user.referred_by === db.currentUser.referral_code
        );
        
        // Find 2nd generation referrals
        const secondGenReferrals = [];
        const thirdGenReferrals = [];
        
        directReferrals.forEach(directRef => {
            // Find users referred by direct referrals (2nd generation)
            const secondGen = allUsers.filter(user => 
                user.referred_by === directRef.referral_code
            );
            secondGenReferrals.push(...secondGen);
            
            // Find 3rd generation referrals
            secondGen.forEach(secondRef => {
                const thirdGen = allUsers.filter(user => 
                    user.referred_by === secondRef.referral_code
                );
                thirdGenReferrals.push(...thirdGen);
            });
        });
        
        // Calculate statistics
        const totalReferrals = directReferrals.length + secondGenReferrals.length + thirdGenReferrals.length;
        const activeReferrals = [...directReferrals, ...secondGenReferrals, ...thirdGenReferrals]
            .filter(user => user.status === 'active').length;
        
        const totalEarnings = await calculateTotalReferralEarnings(currentUserId, allUsers);
        
        // Update statistics display
        updateElement('total-referrals', totalReferrals);
        updateElement('active-referrals', activeReferrals);
        updateElement('total-earnings', db.formatCurrency ? db.formatCurrency(totalEarnings) : `TZS ${totalEarnings.toLocaleString()}`);
        updateElement('direct-referrals', directReferrals.length);
        
        // Update referral code display
        updateElement('user-referral-code-display', db.currentUser.referral_code || '-');
        updateElement('user-referral-code', db.currentUser.referral_code || '');
        
        // Update referral table
        updateReferralsTable(directReferrals, secondGenReferrals, thirdGenReferrals);
        
        console.log('Referral data loaded:', {
            direct: directReferrals.length,
            secondGen: secondGenReferrals.length,
            thirdGen: thirdGenReferrals.length,
            total: totalReferrals,
            earnings: totalEarnings
        });
        
    } catch (error) {
        console.error('Error loading referral data:', error);
        showNotification('Error loading referral data. Please try again.', true);
    }
}

// Calculate total referral earnings
async function calculateTotalReferralEarnings(userId, allUsers) {
    try {
        let totalEarnings = 0;
        
        // Get current user to find their referral code
        const currentUser = await db.findUserById(userId);
        if (!currentUser) return 0;
        
        // Find users referred by this user
        const referredUsers = allUsers.filter(user => user.referred_by === currentUser.referral_code);
        
        for (const referredUser of referredUsers) {
            // Get referred user's transactions
            const userTransactions = referredUser.transactions || [];
            
            // Calculate earnings from this referred user's first deposit
            const firstDeposit = userTransactions.find(t => 
                t.type === 'deposit' && t.status === 'approved'
            );
            
            if (firstDeposit) {
                // 10% commission on first deposit
                const commission = firstDeposit.amount * 0.10;
                totalEarnings += commission;
                
                // Check for ongoing commissions (if implemented)
                const ongoingDeposits = userTransactions.filter(t => 
                    t.type === 'deposit' && t.status === 'approved' && t !== firstDeposit
                );
                
                // Add 5% commission on subsequent deposits (if implemented)
                ongoingDeposits.forEach(deposit => {
                    totalEarnings += deposit.amount * 0.05;
                });
            }
        }
        
        return totalEarnings;
        
    } catch (error) {
        console.error('Error calculating referral earnings:', error);
        return 0;
    }
}

// Update referrals table with multi-level data
function updateReferralsTable(directRefs, secondGenRefs, thirdGenRefs) {
    const referralsBody = document.getElementById('referrals-table-body');
    if (!referralsBody) return;
    
    referralsBody.innerHTML = '';
    
    if (directRefs.length === 0 && secondGenRefs.length === 0 && thirdGenRefs.length === 0) {
        referralsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">No Referrals Yet</h4>
                    <p style="color: #95a5a6;">Share your referral link to start earning commissions!</p>
                    <button onclick="shareViaWhatsApp()" style="margin-top: 15px; padding: 10px 20px; background: #25D366; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fab fa-whatsapp"></i> Share on WhatsApp
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Add direct referrals (1st generation)
    directRefs.forEach((user, index) => {
        const row = createReferralRow(user, '1st Generation', index + 1);
        referralsBody.appendChild(row);
    });
    
    // Add second generation referrals
    secondGenRefs.forEach((user, index) => {
        const row = createReferralRow(user, '2nd Generation', directRefs.length + index + 1);
        referralsBody.appendChild(row);
    });
    
    // Add third generation referrals
    thirdGenRefs.forEach((user, index) => {
        const row = createReferralRow(user, '3rd Generation', directRefs.length + secondGenRefs.length + index + 1);
        referralsBody.appendChild(row);
    });
}

// Create referral table row
function createReferralRow(user, generation, rowNumber) {
    const row = document.createElement('tr');
    row.className = `referral-row ${generation.toLowerCase().replace(' ', '-')}`;
    
    // Calculate user's total deposits
    const totalDeposits = user.transactions ? 
        user.transactions
            .filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
    
    // Calculate commission earned from this user
    let commissionEarned = 0;
    if (user.transactions) {
        const firstDeposit = user.transactions.find(t => 
            t.type === 'deposit' && t.status === 'approved'
        );
        if (firstDeposit) {
            commissionEarned = firstDeposit.amount * 0.10;
            
            // Add 5% for subsequent deposits
            const otherDeposits = user.transactions.filter(t => 
                t.type === 'deposit' && t.status === 'approved' && t !== firstDeposit
            );
            otherDeposits.forEach(deposit => {
                commissionEarned += deposit.amount * 0.05;
            });
        }
    }
    
    // Format dates
    const joinDate = user.join_date ? new Date(user.join_date) : new Date();
    const formattedDate = joinDate.toLocaleDateString('en-TZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    row.innerHTML = `
        <td>
            <div class="user-info">
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${user.username}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="generation-badge ${generation.toLowerCase().replace(' ', '-')}">
                        ${generation}
                    </div>
                </div>
            </div>
        </td>
        <td>${formattedDate}</td>
        <td>
            <span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">
                ${user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td>
            <div class="deposit-amount">
                TZS ${Math.round(totalDeposits).toLocaleString()}
            </div>
            ${totalDeposits > 0 ? `<div class="deposit-count">${user.transactions.filter(t => t.type === 'deposit' && t.status === 'approved').length} deposit(s)</div>` : ''}
        </td>
        <td>
            <div class="commission-amount ${commissionEarned > 0 ? 'has-commission' : ''}">
                TZS ${Math.round(commissionEarned).toLocaleString()}
            </div>
            ${commissionEarned > 0 ? '<div class="commission-status">Commission Paid</div>' : '<div class="commission-status pending">No commission yet</div>'}
        </td>
        <td>
            <div class="referral-actions">
                <button class="btn-view" onclick="viewReferralDetails(${user.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-message" onclick="messageReferral(${user.id})" title="Send Message" ${user.status !== 'active' ? 'disabled' : ''}>
                    <i class="fas fa-envelope"></i>
                </button>
                <button class="btn-invite" onclick="reInviteReferral('${user.email}')" title="Re-invite" ${user.status !== 'active' ? 'disabled' : ''}>
                    <i class="fas fa-redo"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Filter referrals by status
function filterReferrals() {
    const filterValue = document.getElementById('referral-filter').value;
    const rows = document.querySelectorAll('.referral-row');
    
    rows.forEach(row => {
        const status = row.querySelector('.status-badge').textContent.toLowerCase();
        const generation = row.querySelector('.generation-badge').textContent.toLowerCase();
        
        let shouldShow = true;
        
        switch(filterValue) {
            case 'active':
                shouldShow = status === 'active';
                break;
            case 'inactive':
                shouldShow = status === 'inactive';
                break;
            case 'has_deposits':
                const depositAmount = row.querySelector('.deposit-amount').textContent;
                shouldShow = !depositAmount.includes('0');
                break;
            case 'has_commission':
                const commissionAmount = row.querySelector('.commission-amount').textContent;
                shouldShow = !commissionAmount.includes('0');
                break;
            case 'direct':
                shouldShow = generation.includes('1st');
                break;
            case 'indirect':
                shouldShow = generation.includes('2nd') || generation.includes('3rd');
                break;
            case 'all':
            default:
                shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 10);
        } else {
            row.style.opacity = '0';
            row.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                row.style.display = 'none';
            }, 300);
        }
    });
}

// View referral details
async function viewReferralDetails(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user) {
            showNotification('User not found', true);
            return;
        }
        
        // Calculate detailed information
        const totalDeposits = user.transactions ? 
            user.transactions
                .filter(t => t.type === 'deposit' && t.status === 'approved')
                .reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const depositCount = user.transactions ? 
            user.transactions.filter(t => t.type === 'deposit' && t.status === 'approved').length : 0;
        
        const lastDeposit = user.transactions ? 
            user.transactions
                .filter(t => t.type === 'deposit' && t.status === 'approved')
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
        
        // Calculate commissions
        let totalCommission = 0;
        let firstDepositCommission = 0;
        let ongoingCommissions = 0;
        
        if (user.transactions) {
            const firstDeposit = user.transactions.find(t => 
                t.type === 'deposit' && t.status === 'approved'
            );
            
            if (firstDeposit) {
                firstDepositCommission = firstDeposit.amount * 0.10;
                totalCommission += firstDepositCommission;
                
                const otherDeposits = user.transactions.filter(t => 
                    t.type === 'deposit' && t.status === 'approved' && t !== firstDeposit
                );
                
                otherDeposits.forEach(deposit => {
                    const commission = deposit.amount * 0.05;
                    ongoingCommissions += commission;
                    totalCommission += commission;
                });
            }
        }
        
        // Create modal content
        const modalContent = `
            <div class="referral-details-modal">
                <div class="modal-header">
                    <h3>Referral Details</h3>
                    <button class="close-modal" onclick="closeModal('referral-details-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-profile-section">
                        <div class="profile-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="profile-info">
                            <h4>${user.username}</h4>
                            <p>${user.email}</p>
                            <span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">
                                ${user.status === 'active' ? 'Active User' : 'Inactive User'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-card">
                            <h5>Account Information</h5>
                            <div class="detail-item">
                                <span>Join Date:</span>
                                <span>${new Date(user.join_date).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item">
                                <span>Referral Code:</span>
                                <span>${user.referral_code || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span>Account Balance:</span>
                                <span>TZS ${Math.round(user.balance || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <h5>Deposit Activity</h5>
                            <div class="detail-item">
                                <span>Total Deposits:</span>
                                <span>TZS ${Math.round(totalDeposits).toLocaleString()}</span>
                            </div>
                            <div class="detail-item">
                                <span>Number of Deposits:</span>
                                <span>${depositCount}</span>
                            </div>
                            ${lastDeposit ? `
                            <div class="detail-item">
                                <span>Last Deposit:</span>
                                <span>TZS ${Math.round(lastDeposit.amount).toLocaleString()} on ${new Date(lastDeposit.date).toLocaleDateString()}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="detail-card">
                            <h5>Your Commissions</h5>
                            <div class="detail-item">
                                <span>First Deposit Commission (10%):</span>
                                <span class="commission-amount">TZS ${Math.round(firstDepositCommission).toLocaleString()}</span>
                            </div>
                            <div class="detail-item">
                                <span>Ongoing Commissions (5%):</span>
                                <span class="commission-amount">TZS ${Math.round(ongoingCommissions).toLocaleString()}</span>
                            </div>
                            <div class="detail-item total">
                                <span>Total Commission Earned:</span>
                                <span class="total-commission">TZS ${Math.round(totalCommission).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="messageReferral(${user.id})">
                            <i class="fas fa-envelope"></i> Send Message
                        </button>
                        <button class="btn-primary" onclick="reInviteReferral('${user.email}')">
                            <i class="fas fa-redo"></i> Re-invite
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Create and show modal
        showCustomModal('Referral Details', modalContent, 'referral-details-modal');
        
    } catch (error) {
        console.error('Error viewing referral details:', error);
        showNotification('Error loading referral details', true);
    }
}

// Process URL referral parameter for auto-signup
function processUrlReferralParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
        console.log('Referral code detected in URL:', referralCode);
        
        // Store in localStorage for signup form
        localStorage.setItem('pending_referral_code', referralCode);
        
        // Auto-fill signup form if on signup page
        const signupReferralInput = document.getElementById('signup-referral');
        if (signupReferralInput) {
            signupReferralInput.value = referralCode;
            
            // Show notification
            showNotification(`Referral code ${referralCode} detected! You'll earn commission when you sign up.`);
        }
        
        // Remove referral parameter from URL (optional)
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// Message referral
function messageReferral(userId) {
    if (window.chatSystem) {
        // If chat system exists, open chat with user
        window.chatSystem.selectUserChat(userId);
        window.chatSystem.openAdminChatModal();
    } else {
        // Fallback to email
        db.findUserById(userId).then(user => {
            if (user && user.email) {
                const subject = 'Message from your referrer';
                const body = `Hello ${user.username},\n\nI noticed you joined through my referral. Welcome to Tanzania Mining Investment!\n\nLet me know if you have any questions.\n\nBest regards,\n${db.currentUser.username}`;
                window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }
        });
    }
}

// Re-invite referral
function reInviteReferral(email) {
    const subject = 'Reminder: Tanzania Mining Investment Opportunity';
    const body = `Hello,

This is a friendly reminder about the Tanzania Mining Investment platform. 

If you haven't started investing yet, now is a great time to begin! The platform offers excellent returns on precious minerals investments.

You can get started by making your first deposit.

If you have any questions, feel free to reach out!

Best regards,
${db.currentUser.username}`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Update element helper
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
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

// Show custom modal - FIXED VERSION
function showCustomModal(title, content, modalId = 'custom-modal') {
    // Check if modal already exists
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button class="modal-close-btn" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #7f8c8d;
                    z-index: 1001;
                ">&times;</button>
                <div class="modal-body">${content}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for close button
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeCustomModal(modalId);
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCustomModal(modalId);
            }
        });
    }
    
    // Update modal content
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = content;
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeCustomModal(modalId);
        }
    };
    
    // Store the handler reference on the modal element
    modal._escapeHandler = escapeHandler;
    document.addEventListener('keydown', escapeHandler);
}

// Close custom modal - FIXED VERSION
function closeCustomModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Hide modal instead of removing it
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove escape key listener
        if (modal._escapeHandler) {
            document.removeEventListener('keydown', modal._escapeHandler);
            delete modal._escapeHandler;
        }
    }
}

// Update your closeModal function to handle both types
function closeModal(modalId) {
    // Check if it's a custom modal
    const modal = document.getElementById(modalId);
    if (modal && modal.classList.contains('modal')) {
        closeCustomModal(modalId);
    } else {
        // Handle regular modals
        const regularModal = document.getElementById(modalId);
        if (regularModal) {
            regularModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        autoCloseHamburgerAfterNav();
    }
}
// Add referral system CSS
function addReferralSystemStyles() {
    if (!document.getElementById('referral-system-styles')) {
        const styles = `
        <style id="referral-system-styles">
        /* Referral System Styles */
        .referral-code-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
        .code-display {
            flex: 1;
            padding: 15px;
            background: #f8f9fa;
            border: 2px dashed #3498db;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            text-align: center;
            letter-spacing: 2px;
        }
        
        .btn-copy {
            padding: 15px 25px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-copy:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .referral-link-container {
            margin: 20px 0;
        }
        
        .referral-link {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }
        
        .referral-link span {
            flex: 1;
            padding: 12px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2c3e50;
            overflow-x: auto;
            white-space: nowrap;
        }
        
        .share-buttons {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .share-btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
            min-width: 200px;
        }
        
        .share-btn.whatsapp {
            background: #25D366;
            color: white;
        }
        
        .share-btn.email {
            background: #EA4335;
            color: white;
        }
        
        .share-btn.sms {
            background: #34B7F1;
            color: white;
        }
        
        .share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .referral-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .referrals-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .referrals-table th {
            background: #2c3e50;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .referrals-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .referrals-table tr:hover {
            background: #f8f9fa;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            background: #3498db;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
        }
        
        .user-name {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .user-email {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .generation-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .generation-badge.1st-generation {
            background: #27ae60;
            color: white;
        }
        
        .generation-badge.2nd-generation {
            background: #f39c12;
            color: white;
        }
        
        .generation-badge.3rd-generation {
            background: #9b59b6;
            color: white;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        
        .status-badge.active {
            background: #27ae60;
            color: white;
        }
        
        .status-badge.inactive {
            background: #e74c3c;
            color: white;
        }
        
        .deposit-amount {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .deposit-count {
            font-size: 11px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .commission-amount {
            font-weight: bold;
            color: #27ae60;
        }
        
        .commission-amount.has-commission {
            color: #27ae60;
        }
        
        .commission-status {
            font-size: 11px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .commission-status.pending {
            color: #f39c12;
        }
        
        .referral-actions {
            display: flex;
            gap: 5px;
        }
        
        .referral-actions button {
            width: 35px;
            height: 35px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .btn-view {
            background: #3498db;
            color: white;
        }
        
        .btn-message {
            background: #2ecc71;
            color: white;
        }
        
        .btn-invite {
            background: #f39c12;
            color: white;
        }
        
        .referral-actions button:hover {
            transform: scale(1.1);
        }
        
        .referral-actions button:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
            transform: none;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Modal Styles */
        .referral-details-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f1f1f1;
        }
        
        .referral-details-modal .modal-header h3 {
            margin: 0;
            color: #2c3e50;
        }
        
.close - modal {
    position: absolute;
    top: 15 px;
    right: 15 px;
    color: white;
    font - size: 28 px;
    font - weight: bold;
    cursor: pointer;
    z - index: 1000;
    background: #113745;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    transition: all 0.3s ease;
    /* Remove float: right since we're using absolute positioning */
    /* float: right; */
}

.close-modal:hover {
    color: black;
    background: white;
    transform: rotate(90deg);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .close-modal {
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        font-size: 24px;
        background: # 113745;
}
}

/* For very small screens */
@media(max - width: 480 px) {
    .close - modal {
        top: 8 px;
        right: 8 px;
        width: 38 px;
        height: 38 px;
        font - size: 22 px;
    }
}
        
        .user-profile-section {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .profile-avatar {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
        }
        
        .profile-info h4 {
            margin: 0 0 5px 0;
            color: #2c3e50;
        }
        
        .profile-info p {
            margin: 0 0 10px 0;
            color: #7f8c8d;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .detail-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #eee;
        }
        
        .detail-card h5 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            padding-bottom: 10px;
            border-bottom: 2px solid #f1f1f1;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #eee;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-item span:first-child {
            color: #7f8c8d;
        }
        
        .detail-item span:last-child {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .detail-item.total {
            font-size: 16px;
            font-weight: bold;
        }
        
        .commission-amount {
            color: #27ae60;
            font-weight: bold;
        }
        
        .total-commission {
            color: #27ae60;
            font-size: 18px;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn-primary, .btn-secondary {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-secondary {
            background: #f1f1f1;
            color: #2c3e50;
        }
        
        .btn-primary:hover, .btn-secondary:hover {
            transform: translateY(-2px);
        }
        
        /* Commission rates */
        .commission-rates {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
        }
        
        .commission-rates .content-title {
            margin: 0 0 20px 0;
            color: white;
            font-size: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .rate-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            margin-bottom: 10px;
        }
        
        .rate-item:last-child {
            margin-bottom: 0;
        }
        
        .amount-range {
            font-size: 16px;
            font-weight: 600;
        }
        
        .commission-rate {
            background: white;
            color: #667eea;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 18px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .share-buttons {
                flex-direction: column;
            }
            
            .share-btn {
                min-width: auto;
            }
            
            .referral-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
            
            .referrals-table {
                display: block;
                overflow-x: auto;
            }
        }
        
        @media (max-width: 480px) {
            .referral-stats {
                grid-template-columns: 1fr;
            }
            
            .code-display {
                font-size: 16px;
            }
            
            .referral-link span {
                font-size: 12px;
            }
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Added referral system styles');
    }
}
// Initialize referral system when user dashboard loads
function initReferralOnDashboardLoad() {
    // Add styles
    addReferralSystemStyles();
    
    // Initialize referral system
    if (typeof initReferralSystem === 'function') {
        initReferralSystem();
    }
    
    // Process URL parameters
    if (typeof processUrlReferralParameter === 'function') {
        processUrlReferralParameter();
    }
}


// Make functions globally available
window.copyReferralCode = copyReferralCode;
window.copyReferralLink = copyReferralLink;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;
window.shareViaSMS = shareViaSMS;
window.filterReferrals = filterReferrals;
window.viewReferralDetails = viewReferralDetails;
window.messageReferral = messageReferral;
window.reInviteReferral = reInviteReferral;
window.initReferralSystem = initReferralSystem;
window.loadReferralData = loadReferralData;

console.log('✅ Referral system functions loaded');

// ========== ADMIN MANAGEMENT SYSTEM ==========
// Add this section to your existing code

// Initialize admin management
async function initAdminManagement() {
    console.log('🛡️ Initializing Admin Management System...');
    
    // Create admin management section if it doesn't exist
    createAdminManagementSection();
    
    // Load admin list
    await loadAdminList();
    
    // Setup event listeners
    setupAdminManagementListeners();
}

// Create admin management section
function createAdminManagementSection() {
    const adminManagementSection = document.getElementById('admin-management');
    if (!adminManagementSection) return;
    
    adminManagementSection.innerHTML = `
        <div class="admin-management-container">
            <!-- Header -->
            <div class="admin-management-header">
                <div class="header-content">
                    <h2><i class="fas fa-user-shield"></i> Admin Management</h2>
                    <p>Manage admin accounts, permissions, and activities</p>
                </div>
                <button class="btn-primary" onclick="openAddAdminModal()">
                    <i class="fas fa-user-plus"></i> Add New Admin
                </button>
            </div>

            <!-- Stats Cards -->
            <div class="admin-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="total-admins-count">0</h3>
                        <p>Total Admins</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="active-admins-count">0</h3>
                        <p>Active Admins</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="pending-tasks-count">0</h3>
                        <p>Pending Tasks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="admin-activity-count">0</h3>
                        <p>Today's Activities</p>
                    </div>
                </div>
            </div>

            <!-- Search and Filter -->
            <div class="admin-toolbar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="admin-search" placeholder="Search admins by name or email...">
                </div>
                <div class="filter-controls">
                    <select id="admin-role-filter" class="filter-select">
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                    <select id="admin-status-filter" class="filter-select">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            <!-- Admins Table -->
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Admin Info</th>
                            <th>Role & Permissions</th>
                            <th>Status</th>
                            <th>Last Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="admins-table-body">
                        <!-- Admins will be loaded here -->
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div id="no-admins-message" class="empty-state" style="display: none;">
                <div class="empty-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h3>No Admins Found</h3>
                <p>Add your first admin to start managing the system</p>
                <button class="btn-primary" onclick="openAddAdminModal()">
                    <i class="fas fa-user-plus"></i> Add Admin
                </button>
            </div>
        </div>

        <!-- Add Admin Modal -->
        <div id="add-admin-modal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Add New Admin</h3>
                    <button class="close-modal" onclick="closeModal('add-admin-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="add-admin-form" class="admin-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="admin-username">
                                    <i class="fas fa-user"></i> Username *
                                </label>
                                <input type="text" id="admin-username" 
                                       placeholder="Enter username" required>
                            </div>
                            <div class="form-group">
                                <label for="admin-email">
                                    <i class="fas fa-envelope"></i> Email *
                                </label>
                                <input type="email" id="admin-email" 
                                       placeholder="admin@example.com" required>
                            </div>
                            <div class="form-group">
                                <label for="admin-password-new">
                                    <i class="fas fa-lock"></i> Password *
                                </label>
                                <div class="password-input-group">
                                    <input type="password" id="admin-password-new" 
                                           placeholder="Enter password" required>
                                    <button type="button" class="password-toggle-btn" 
                                            onclick="togglePasswordVisibility('admin-password-new', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="admin-role">
                                    <i class="fas fa-user-tag"></i> Role *
                                </label>
                                <select id="admin-role" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="support">Support</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="admin-permissions">
                                <i class="fas fa-key"></i> Permissions
                            </label>
                            <div class="permissions-grid">
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="user_management">
                                    <span>User Management</span>
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="transaction_approval">
                                    <span>Transaction Approval</span>
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="chat_support">
                                    <span>Chat Support</span>
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="reports">
                                    <span>Reports</span>
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="announcements">
                                    <span>Announcements</span>
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="settings">
                                    <span>Settings</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="admin-status">
                                <i class="fas fa-circle"></i> Status
                            </label>
                            <select id="admin-status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Create Admin
                            </button>
                            <button type="button" class="btn-secondary" 
                                    onclick="closeModal('add-admin-modal')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Edit Admin Modal -->
        <div id="edit-admin-modal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Edit Admin</h3>
                    <button class="close-modal" onclick="closeModal('edit-admin-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-admin-form" class="admin-form">
                        <input type="hidden" id="edit-admin-id">
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="edit-admin-username">
                                    <i class="fas fa-user"></i> Username *
                                </label>
                                <input type="text" id="edit-admin-username" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-admin-email">
                                    <i class="fas fa-envelope"></i> Email *
                                </label>
                                <input type="email" id="edit-admin-email" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-admin-password">
                                    <i class="fas fa-lock"></i> New Password
                                </label>
                                <div class="password-input-group">
                                    <input type="password" id="edit-admin-password" 
                                           placeholder="Leave blank to keep current">
                                    <button type="button" class="password-toggle-btn" 
                                            onclick="togglePasswordVisibility('edit-admin-password', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="edit-admin-role">
                                    <i class="fas fa-user-tag"></i> Role *
                                </label>
                                <select id="edit-admin-role" required>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="support">Support</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="edit-admin-permissions">
                                <i class="fas fa-key"></i> Permissions
                            </label>
                            <div class="permissions-grid" id="edit-permissions-container">
                                <!-- Permissions will be populated here -->
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="edit-admin-status">
                                <i class="fas fa-circle"></i> Status
                            </label>
                            <select id="edit-admin-status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                            <button type="button" class="btn-secondary" 
                                    onclick="closeModal('edit-admin-modal')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- View Admin Details Modal -->
        <div id="view-admin-modal" class="modal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3><i class="fas fa-eye"></i> Admin Details</h3>
                    <button class="close-modal" onclick="closeModal('view-admin-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="admin-profile-header">
                        <div class="admin-avatar">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="admin-profile-info">
                            <h3 id="view-admin-name">Loading...</h3>
                            <p id="view-admin-email">Loading...</p>
                            <div class="admin-badges">
                                <span class="badge" id="view-admin-role">Admin</span>
                                <span class="badge" id="view-admin-status">Active</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-details-grid">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="detail-label">Admin ID:</span>
                                    <span class="detail-value" id="view-admin-id">-</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Join Date:</span>
                                    <span class="detail-value" id="view-admin-join-date">-</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Last Active:</span>
                                    <span class="detail-value" id="view-admin-last-active">-</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-key"></i> Permissions</h4>
                            <div class="permissions-list" id="view-permissions-list">
                                <!-- Permissions will be loaded here -->
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-chart-bar"></i> Activity Stats</h4>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Transactions Approved:</span>
                                    <span class="stat-value" id="view-transactions-approved">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Users Managed:</span>
                                    <span class="stat-value" id="view-users-managed">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Chats Handled:</span>
                                    <span class="stat-value" id="view-chats-handled">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-primary" onclick="viewAdminTransactions()">
                            <i class="fas fa-list"></i> View Transactions
                        </button>
                        <button class="btn-secondary" onclick="closeModal('view-admin-modal')">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Transactions Modal -->
        <div id="admin-transactions-modal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3><i class="fas fa-list-alt"></i> Admin Transactions</h3>
                    <button class="close-modal" onclick="closeModal('admin-transactions-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="transactions-header">
                        <h4 id="admin-transactions-title">Transactions Approved by Admin</h4>
                        <div class="transactions-stats">
                            <span>Total: <strong id="total-admin-transactions">0</strong></span>
                            <span>Approved: <strong id="approved-admin-transactions">0</strong></span>
                            <span>Rejected: <strong id="rejected-admin-transactions">0</strong></span>
                        </div>
                    </div>

                    <div class="transactions-table-container">
                        <table class="transactions-table">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>User</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="admin-transactions-list">
                                <!-- Transactions will be loaded here -->
                            </tbody>
                        </table>
                    </div>

                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeModal('admin-transactions-modal')">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load admin list from Firebase
async function loadAdminList() {
    try {
        console.log('📋 Loading admin list...');
        
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin === true);
        
        // Update stats
        updateAdminStats(admins);
        
        // Display admins table
        displayAdminsTable(admins);
        
    } catch (error) {
        console.error('❌ Error loading admin list:', error);
        showNotification('Failed to load admin list', 'error');
    }
}

// Update admin statistics
function updateAdminStats(admins) {
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(admin => admin.status === 'active').length;
    const inactiveAdmins = admins.filter(admin => admin.status === 'inactive').length;
    const pendingAdmins = admins.filter(admin => admin.status === 'pending').length;
    
    // Update count displays
    document.getElementById('total-admins-count').textContent = totalAdmins;
    document.getElementById('active-admins-count').textContent = activeAdmins;
    document.getElementById('pending-tasks-count').textContent = pendingAdmins;
    
    // Calculate today's activities
    const today = new Date().toDateString();
    let todayActivities = 0;
    
    admins.forEach(admin => {
        if (admin.last_active) {
            const lastActiveDate = new Date(admin.last_active).toDateString();
            if (lastActiveDate === today) {
                todayActivities++;
            }
        }
    });
    
    document.getElementById('admin-activity-count').textContent = todayActivities;
}

// Display admins in table
function displayAdminsTable(admins) {
    const tableBody = document.getElementById('admins-table-body');
    const noAdminsMessage = document.getElementById('no-admins-message');
    
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (admins.length === 0) {
        if (noAdminsMessage) noAdminsMessage.style.display = 'block';
        return;
    }
    
    if (noAdminsMessage) noAdminsMessage.style.display = 'none';
    
    // Sort admins: super admin first, then by join date
    admins.sort((a, b) => {
        if (a.is_super_admin && !b.is_super_admin) return -1;
        if (!a.is_super_admin && b.is_super_admin) return 1;
        return new Date(b.join_date) - new Date(a.join_date);
    });
    
    // Add each admin to table
    admins.forEach(admin => {
        const row = createAdminTableRow(admin);
        tableBody.appendChild(row);
    });
}

// Create table row for admin
function createAdminTableRow(admin) {
    const row = document.createElement('tr');
    
    // Format last active
    let lastActive = 'Never';
    if (admin.last_active) {
        const lastActiveDate = new Date(admin.last_active);
        const now = new Date();
        const diffMs = now - lastActiveDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) lastActive = 'Just now';
        else if (diffMins < 60) lastActive = `${diffMins}m ago`;
        else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)}h ago`;
        else lastActive = lastActiveDate.toLocaleDateString();
    }
    
    // Create status badge
    const statusClass = admin.status === 'active' ? 'success' : 
                       admin.status === 'inactive' ? 'error' : 'warning';
    
    row.innerHTML = `
        <td>${admin.id}</td>
        <td>
            <div class="admin-info-cell">
                <div class="admin-avatar-small">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="admin-info">
                    <div class="admin-name">${admin.username}</div>
                    <div class="admin-email">${admin.email}</div>
                </div>
            </div>
        </td>
        <td>
            <div class="role-permissions-cell">
                <div class="admin-role">${admin.admin_role || 'admin'}</div>
                <div class="admin-permissions">
                    ${(admin.permissions || []).slice(0, 3).map(p => 
                        `<span class="permission-tag">${p}</span>`
                    ).join('')}
                    ${(admin.permissions || []).length > 3 ? 
                        `<span class="permission-tag">+${(admin.permissions || []).length - 3}</span>` : ''
                    }
                </div>
            </div>
        </td>
        <td>
            <span class="status-badge ${statusClass}">
                ${admin.status}
            </span>
        </td>
        <td>${lastActive}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn view-btn" onclick="viewAdminDetails(${admin.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editAdmin(${admin.id})" title="Edit Admin" 
                    ${admin.is_super_admin ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn transactions-btn" onclick="viewAdminTransactionsModal(${admin.id})" title="View Transactions">
                    <i class="fas fa-list"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteAdmin(${admin.id})" title="Delete Admin"
                    ${admin.is_super_admin ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Setup event listeners for admin management
function setupAdminManagementListeners() {
    // Search functionality
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterAdminsTable, 300));
    }
    
    // Filter functionality
    const roleFilter = document.getElementById('admin-role-filter');
    const statusFilter = document.getElementById('admin-status-filter');
    
    if (roleFilter) {
        roleFilter.addEventListener('change', filterAdminsTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAdminsTable);
    }
    
    // Add admin form
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', handleAddAdmin);
    }
    
    // Edit admin form
    const editAdminForm = document.getElementById('edit-admin-form');
    if (editAdminForm) {
        editAdminForm.addEventListener('submit', handleEditAdmin);
    }
}

// Filter admins table
async function filterAdminsTable() {
    try {
        const searchTerm = document.getElementById('admin-search').value.toLowerCase();
        const roleFilter = document.getElementById('admin-role-filter').value;
        const statusFilter = document.getElementById('admin-status-filter').value;
        
        const users = await db.getUsers();
        let admins = users.filter(user => user.is_admin === true);
        
        // Apply filters
        if (searchTerm) {
            admins = admins.filter(admin => 
                admin.username.toLowerCase().includes(searchTerm) ||
                admin.email.toLowerCase().includes(searchTerm)
            );
        }
        
        if (roleFilter !== 'all') {
            admins = admins.filter(admin => 
                (admin.admin_role || 'admin') === roleFilter
            );
        }
        
        if (statusFilter !== 'all') {
            admins = admins.filter(admin => admin.status === statusFilter);
        }
        
        // Display filtered results
        displayAdminsTable(admins);
        
    } catch (error) {
        console.error('Error filtering admins:', error);
    }
}

// Open add admin modal
function openAddAdminModal() {
    // Reset form
    const form = document.getElementById('add-admin-form');
    if (form) form.reset();
    
    // Open modal
    openModal('add-admin-modal');
}

// Handle add admin form submission
async function handleAddAdmin(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const username = document.getElementById('admin-username').value.trim();
        const email = document.getElementById('admin-email').value.trim().toLowerCase();
        const password = document.getElementById('admin-password-new').value;
        const role = document.getElementById('admin-role').value;
        const status = document.getElementById('admin-status').value;
        
        // Get selected permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]:checked');
        const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
        
        // Validation
        if (!username || !email || !password || !role) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Check if email already exists
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            showNotification('Email already registered', 'error');
            return;
        }
        
        // Get next user ID
        const nextId = await db.getNextId();
        
        // Create admin object
        const newAdmin = {
            id: nextId,
            username: username.toLowerCase(),
            email: email,
            password: password,
            admin_password: password, // For admin login
            referral_code: await db.generateUniqueReferralCode(),
            referred_by: null,
            join_date: new Date().toISOString(),
            status: status,
            is_admin: true,
            is_super_admin: false,
            admin_role: role,
            permissions: permissions,
            balance: 0,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firebase
        await db.db.collection('users').doc(nextId.toString()).set(newAdmin);
        
        showNotification('Admin created successfully!', 'success');
        
        // Close modal and refresh list
        closeModal('add-admin-modal');
        await loadAdminList();
        
    } catch (error) {
        console.error('Error creating admin:', error);
        showNotification('Failed to create admin: ' + error.message, 'error');
    }
}

// Open edit admin modal
async function editAdmin(adminId) {
    try {
        const admin = await db.findUserById(adminId);
        if (!admin) {
            showNotification('Admin not found', 'error');
            return;
        }
        
        // Don't allow editing super admin
        if (admin.is_super_admin) {
            showNotification('Cannot edit super admin', 'warning');
            return;
        }
        
        // Fill form with admin data
        document.getElementById('edit-admin-id').value = admin.id;
        document.getElementById('edit-admin-username').value = admin.username;
        document.getElementById('edit-admin-email').value = admin.email;
        document.getElementById('edit-admin-role').value = admin.admin_role || 'admin';
        document.getElementById('edit-admin-status').value = admin.status || 'active';
        
        // Set permissions
        const permissionsContainer = document.getElementById('edit-permissions-container');
        const permissions = admin.permissions || [];
        
        permissionsContainer.innerHTML = `
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="user_management" 
                    ${permissions.includes('user_management') ? 'checked' : ''}>
                <span>User Management</span>
            </label>
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="transaction_approval"
                    ${permissions.includes('transaction_approval') ? 'checked' : ''}>
                <span>Transaction Approval</span>
            </label>
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="chat_support"
                    ${permissions.includes('chat_support') ? 'checked' : ''}>
                <span>Chat Support</span>
            </label>
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="reports"
                    ${permissions.includes('reports') ? 'checked' : ''}>
                <span>Reports</span>
            </label>
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="announcements"
                    ${permissions.includes('announcements') ? 'checked' : ''}>
                <span>Announcements</span>
            </label>
            <label class="permission-checkbox">
                <input type="checkbox" name="edit-permissions" value="settings"
                    ${permissions.includes('settings') ? 'checked' : ''}>
                <span>Settings</span>
            </label>
        `;
        
        // Open modal
        openModal('edit-admin-modal');
        
    } catch (error) {
        console.error('Error loading admin for edit:', error);
        showNotification('Failed to load admin details', 'error');
    }
}

// Handle edit admin form submission
async function handleEditAdmin(event) {
    event.preventDefault();
    
    try {
        const adminId = document.getElementById('edit-admin-id').value;
        const username = document.getElementById('edit-admin-username').value.trim();
        const email = document.getElementById('edit-admin-email').value.trim().toLowerCase();
        const password = document.getElementById('edit-admin-password').value;
        const role = document.getElementById('edit-admin-role').value;
        const status = document.getElementById('edit-admin-status').value;
        
        // Get selected permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="edit-permissions"]:checked');
        const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
        
        // Validation
        if (!username || !email || !role) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Check if email exists for another user
        const existingUser = await db.findUserByEmail(email);
        if (existingUser && existingUser.id !== parseInt(adminId)) {
            showNotification('Email already registered by another user', 'error');
            return;
        }
        
        // Prepare update data
        const updateData = {
            username: username.toLowerCase(),
            email: email,
            admin_role: role,
            permissions: permissions,
            status: status,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update password if provided
        if (password) {
            updateData.password = password;
            updateData.admin_password = password;
        }
        
        // Update in Firebase
        await db.updateUser(adminId, updateData);
        
        showNotification('Admin updated successfully!', 'success');
        
        // Close modal and refresh list
        closeModal('edit-admin-modal');
        await loadAdminList();
        
    } catch (error) {
        console.error('Error updating admin:', error);
        showNotification('Failed to update admin: ' + error.message, 'error');
    }
}

// View admin details
async function viewAdminDetails(adminId) {
    try {
        const admin = await db.findUserById(adminId);
        if (!admin) {
            showNotification('Admin not found', 'error');
            return;
        }
        
        // Fill modal with admin details
        document.getElementById('view-admin-name').textContent = admin.username;
        document.getElementById('view-admin-email').textContent = admin.email;
        document.getElementById('view-admin-id').textContent = admin.id;
        document.getElementById('view-admin-role').textContent = admin.admin_role || 'admin';
        document.getElementById('view-admin-status').textContent = admin.status || 'active';
        
        // Format dates
        const joinDate = new Date(admin.join_date);
        document.getElementById('view-admin-join-date').textContent = joinDate.toLocaleDateString();
        
        let lastActive = 'Never';
        if (admin.last_active) {
            const lastActiveDate = new Date(admin.last_active);
            lastActive = lastActiveDate.toLocaleString();
        }
        document.getElementById('view-admin-last-active').textContent = lastActive;
        
        // Display permissions
        const permissionsList = document.getElementById('view-permissions-list');
        const permissions = admin.permissions || [];
        
        if (permissions.length > 0) {
            permissionsList.innerHTML = permissions.map(p => 
                `<span class="permission-tag">${p.replace('_', ' ')}</span>`
            ).join('');
        } else {
            permissionsList.innerHTML = '<span class="no-permissions">No permissions assigned</span>';
        }
        
        // Calculate activity stats
        const transactionsApproved = await getAdminTransactionsCount(adminId);
        const usersManaged = await getUsersManagedCount(adminId);
        const chatsHandled = await getChatsHandledCount(adminId);
        
        document.getElementById('view-transactions-approved').textContent = transactionsApproved;
        document.getElementById('view-users-managed').textContent = usersManaged;
        document.getElementById('view-chats-handled').textContent = chatsHandled;
        
        // Store admin ID for transactions view
        window.currentViewingAdminId = adminId;
        
        // Open modal
        openModal('view-admin-modal');
        
    } catch (error) {
        console.error('Error loading admin details:', error);
        showNotification('Failed to load admin details', 'error');
    }
}

// Get count of transactions approved by admin
async function getAdminTransactionsCount(adminId) {
    try {
        const allTransactions = await db.getAllTransactions();
        return allTransactions.filter(t => 
            t.adminId === adminId.toString() && 
            t.status === 'approved'
        ).length;
    } catch (error) {
        console.error('Error getting admin transactions count:', error);
        return 0;
    }
}

// Get count of users managed by admin
async function getUsersManagedCount(adminId) {
    try {
        const users = await db.getUsers();
        // For now, we'll count all users if admin has user_management permission
        const admin = await db.findUserById(adminId);
        if (admin && admin.permissions && admin.permissions.includes('user_management')) {
            return users.filter(u => !u.is_admin).length;
        }
        return 0;
    } catch (error) {
        console.error('Error getting users managed count:', error);
        return 0;
    }
}

// Get count of chats handled by admin
async function getChatsHandledCount(adminId) {
    try {
        // This would require a chat system integration
        // For now, return a placeholder
        return 0;
    } catch (error) {
        console.error('Error getting chats handled count:', error);
        return 0;
    }
}

// Delete admin with confirmation
async function deleteAdmin(adminId) {
    try {
        const admin = await db.findUserById(adminId);
        if (!admin) {
            showNotification('Admin not found', 'error');
            return;
        }
        
        // Don't allow deleting super admin
        if (admin.is_super_admin) {
            showNotification('Cannot delete super admin', 'warning');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete admin "${admin.username}"? This action cannot be undone.`)) {
            return;
        }
        
        // Delete admin from Firebase
        const success = await db.deleteUser(adminId);
        
        if (success) {
            showNotification('Admin deleted successfully!', 'success');
            await loadAdminList(); // Refresh the list
        } else {
            showNotification('Failed to delete admin', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting admin:', error);
        showNotification('Failed to delete admin: ' + error.message, 'error');
    }
}

// View admin transactions modal
async function viewAdminTransactionsModal(adminId) {
    try {
        const admin = await db.findUserById(adminId);
        if (!admin) {
            showNotification('Admin not found', 'error');
            return;
        }
        
        // Load admin transactions
        await loadAdminTransactions(adminId, admin.username);
        
        // Open modal
        openModal('admin-transactions-modal');
        
    } catch (error) {
        console.error('Error opening admin transactions:', error);
        showNotification('Failed to load transactions', 'error');
    }
}

// Load transactions approved by specific admin
async function loadAdminTransactions(adminId, adminName) {
    try {
        const allTransactions = await db.getAllTransactions();
        const adminTransactions = allTransactions.filter(t => 
            t.adminId === adminId.toString() || 
            (t.adminId && t.adminId.toString() === adminId.toString())
        );
        
        // Update modal title
        document.getElementById('admin-transactions-title').textContent = 
            `Transactions Approved by ${adminName}`;
        
        // Update stats
        const total = adminTransactions.length;
        const approved = adminTransactions.filter(t => t.status === 'approved').length;
        const rejected = adminTransactions.filter(t => t.status === 'rejected').length;
        
        document.getElementById('total-admin-transactions').textContent = total;
        document.getElementById('approved-admin-transactions').textContent = approved;
        document.getElementById('rejected-admin-transactions').textContent = rejected;
        
        // Display transactions
        displayAdminTransactions(adminTransactions);
        
    } catch (error) {
        console.error('Error loading admin transactions:', error);
        showNotification('Failed to load transactions', 'error');
    }
}

// Display admin transactions in table
function displayAdminTransactions(transactions) {
    const tableBody = document.getElementById('admin-transactions-list');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>No transactions found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each transaction
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Status badge
        const statusClass = transaction.status === 'approved' ? 'success' : 
                          transaction.status === 'rejected' ? 'error' : 'warning';
        
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>
                <div class="user-info-cell">
                    <div class="user-name">${transaction.username || 'Unknown'}</div>
                    <div class="user-email">${transaction.email || ''}</div>
                </div>
            </td>
            <td>
                <span class="transaction-type ${transaction.type}">
                    ${transaction.type}
                </span>
            </td>
            <td class="amount-cell">
                TZS ${db.formatNumber(transaction.amount)}
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${transaction.status}
                </span>
            </td>
            <td>${formattedDate}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewTransactionDetails(${transaction.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// View transaction details
async function viewTransactionDetails(transactionId) {
    try {
        const allTransactions = await db.getAllTransactions();
        const transaction = allTransactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            showNotification('Transaction not found', 'error');
            return;
        }
        
        // Create details modal content
        const modalContent = `
            <div class="transaction-details">
                <h3>Transaction Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${transaction.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">User:</span>
                        <span class="detail-value">${transaction.username} (${transaction.email})</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${transaction.type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">TZS ${db.formatNumber(transaction.amount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value ${transaction.status}">${transaction.status}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Method:</span>
                        <span class="detail-value">${transaction.method || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date(transaction.date).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Approved By:</span>
                        <span class="detail-value">${transaction.adminId || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Approval Date:</span>
                        <span class="detail-value">${transaction.adminActionDate ? new Date(transaction.adminActionDate).toLocaleString() : 'N/A'}</span>
                    </div>
                </div>
                
                ${transaction.details ? `
                <div class="additional-details">
                    <h4>Additional Details:</h4>
                    <pre>${JSON.stringify(transaction.details, null, 2)}</pre>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeModal('transaction-details-modal')">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        // Create or update modal
        let modal = document.getElementById('transaction-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'transaction-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-receipt"></i> Transaction Details</h3>
                        <button class="close-modal" onclick="closeModal('transaction-details-modal')">&times;</button>
                    </div>
                    <div class="modal-body" id="transaction-details-content">
                        ${modalContent}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            document.getElementById('transaction-details-content').innerHTML = modalContent;
        }
        
        // Open modal
        openModal('transaction-details-modal');
        
    } catch (error) {
        console.error('Error loading transaction details:', error);
        showNotification('Failed to load transaction details', 'error');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.title = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.title = 'Show Password';
    }
}

// Debounce function for search
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

// Add CSS styles for admin management
function addAdminManagementStyles() {
    if (!document.getElementById('admin-management-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-management-styles';
        styles.textContent = `
            /* Admin Management Styles */
            .admin-management-container {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
            }

            .admin-management-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
            }

            .header-content h2 {
                color: #2c3e50;
                margin: 0 0 5px 0;
                font-size: 24px;
            }

            .header-content p {
                color: #7f8c8d;
                margin: 0;
                font-size: 14px;
            }

            .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }

            .stat-card:hover {
                transform: translateY(-5px);
            }

            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }

            .stat-icon.primary { background: #e3f2fd; color: #1976d2; }
            .stat-icon.success { background: #e8f5e9; color: #388e3c; }
            .stat-icon.warning { background: #fff3e0; color: #f57c00; }
            .stat-icon.info { background: #e0f7fa; color: #0097a7; }

            .stat-info h3 {
                margin: 0 0 5px 0;
                font-size: 28px;
                color: #2c3e50;
            }

            .stat-info p {
                margin: 0;
                color: #7f8c8d;
                font-size: 14px;
            }

            .admin-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                gap: 20px;
                flex-wrap: wrap;
            }

            .search-box {
                flex: 1;
                min-width: 300px;
                position: relative;
            }

            .search-box i {
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: #7f8c8d;
            }

            .search-box input {
                width: 100%;
                padding: 12px 15px 12px 45px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }

            .search-box input:focus {
                outline: none;
                border-color: #3498db;
            }

            .filter-controls {
                display: flex;
                gap: 10px;
            }

            .filter-select {
                padding: 12px 15px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                background: white;
                font-size: 14px;
                min-width: 150px;
            }

            .admin-table-container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }

            .admin-table {
                width: 100%;
                border-collapse: collapse;
            }

            .admin-table thead {
                background: #f8f9fa;
            }

            .admin-table th {
                padding: 15px;
                text-align: left;
                font-weight: 600;
                color: #2c3e50;
                border-bottom: 2px solid #e0e0e0;
            }

            .admin-table td {
                padding: 15px;
                border-bottom: 1px solid #e0e0e0;
                vertical-align: middle;
            }

            .admin-table tbody tr:hover {
                background: #f8f9fa;
            }

            .admin-info-cell {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .admin-avatar-small {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e3f2fd;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1976d2;
            }

            .admin-info {
                flex: 1;
            }

            .admin-name {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 2px;
            }

            .admin-email {
                font-size: 12px;
                color: #7f8c8d;
            }

            .role-permissions-cell {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .admin-role {
                font-weight: 600;
                color: #3498db;
                text-transform: capitalize;
            }

            .admin-permissions {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }

            .permission-tag {
                background: #e8f5e9;
                color: #388e3c;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                text-transform: capitalize;
            }

            .status-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .status-badge.success {
                background: #d4edda;
                color: #155724;
            }

            .status-badge.error {
                background: #f8d7da;
                color: #721c24;
            }

            .status-badge.warning {
                background: #fff3cd;
                color: #856404;
            }

            .action-buttons {
                display: flex;
                gap: 8px;
            }

            .action-btn {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 8px;
                background: #f8f9fa;
                color: #7f8c8d;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }

            .action-btn:hover {
                transform: translateY(-2px);
            }

            .view-btn:hover { background: #e3f2fd; color: #1976d2; }
            .edit-btn:hover { background: #e8f5e9; color: #388e3c; }
            .transactions-btn:hover { background: #fff3e0; color: #f57c00; }
            .delete-btn:hover { background: #f8d7da; color: #721c24; }

            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }

            .empty-state {
                text-align: center;
                padding: 60px 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .empty-icon {
                font-size: 60px;
                color: #bdc3c7;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                color: #2c3e50;
                margin-bottom: 10px;
            }

            .empty-state p {
                color: #7f8c8d;
                margin-bottom: 30px;
            }

            /* Admin Form Styles */
            .admin-form {
                padding: 10px;
            }

            .form-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 20px;
            }

            @media (max-width: 768px) {
                .form-grid {
                    grid-template-columns: 1fr;
                }
            }

            .form-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-weight: 600;
                color: #2c3e50;
            }

            .form-group input,
            .form-group select {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }

            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #3498db;
            }

            .password-input-group {
                position: relative;
            }

            .password-toggle-btn {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #7f8c8d;
                cursor: pointer;
                padding: 5px;
            }

            .permissions-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            @media (max-width: 480px) {
                .permissions-grid {
                    grid-template-columns: 1fr;
                }
            }

            .permission-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }

            .permission-checkbox input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: #3498db;
            }

            .permission-checkbox span {
                font-size: 14px;
                color: #2c3e50;
            }

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
            }

            /* Admin Profile Styles */
            .admin-profile-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
            }

            .admin-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3498db, #2980b9);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
            }

            .admin-profile-info {
                flex: 1;
            }

            .admin-profile-info h3 {
                margin: 0 0 5px 0;
                color: #2c3e50;
            }

            .admin-profile-info p {
                margin: 0 0 10px 0;
                color: #7f8c8d;
            }

            .admin-badges {
                display: flex;
                gap: 10px;
            }

            .badge {
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .badge:first-child {
                background: #e3f2fd;
                color: #1976d2;
            }

            .badge:last-child {
                background: #d4edda;
                color: #155724;
            }

            .admin-details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .detail-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 12px;
            }

            .detail-section h4 {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 0 15px 0;
                color: #2c3e50;
            }

            .detail-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px dashed #dee2e6;
            }

            .detail-item:last-child {
                border-bottom: none;
            }

            .detail-label {
                color: #7f8c8d;
                font-weight: 500;
            }

            .detail-value {
                color: #2c3e50;
                font-weight: 600;
            }

            .permissions-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .no-permissions {
                color: #bdc3c7;
                font-style: italic;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }

            .stat-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }

            .stat-label {
                display: block;
                font-size: 12px;
                color: #7f8c8d;
                margin-bottom: 5px;
            }

            .stat-value {
                display: block;
                font-size: 20px;
                font-weight: 700;
                color: #2c3e50;
            }

            /* Transactions Styles */
            .transactions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e0e0e0;
            }

            .transactions-stats {
                display: flex;
                gap: 20px;
                font-size: 14px;
                color: #7f8c8d;
            }

            .transactions-stats strong {
                color: #2c3e50;
                margin-left: 5px;
            }

            .transactions-table-container {
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 20px;
            }

            .transactions-table {
                width: 100%;
                border-collapse: collapse;
            }

            .transactions-table th {
                background: #f8f9fa;
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
                color: #2c3e50;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .transactions-table td {
                padding: 12px 15px;
                border-bottom: 1px solid #e0e0e0;
            }

            .user-info-cell {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 2px;
            }

            .user-email {
                font-size: 12px;
                color: #7f8c8d;
            }

            .transaction-type {
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .transaction-type.deposit {
                background: #d4edda;
                color: #155724;
            }

            .transaction-type.withdrawal {
                background: #f8d7da;
                color: #721c24;
            }

            .transaction-type.bonus {
                background: #fff3cd;
                color: #856404;
            }

            .amount-cell {
                font-weight: 600;
                color: #2c3e50;
            }

            .no-data {
                text-align: center;
                padding: 40px !important;
                color: #bdc3c7;
            }

            .no-data i {
                font-size: 48px;
                margin-bottom: 15px;
                display: block;
            }

            /* Transaction Details Styles */
            .transaction-details {
                padding: 10px;
            }

            .transaction-details h3 {
                color: #2c3e50;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }

            .details-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }

            @media (max-width: 768px) {
                .details-grid {
                    grid-template-columns: 1fr;
                }
            }

            .detail-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }

            .detail-label {
                display: block;
                font-size: 12px;
                color: #7f8c8d;
                margin-bottom: 5px;
            }

            .detail-value {
                display: block;
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
                word-break: break-word;
            }

            .detail-value.approved {
                color: #27ae60;
            }

            .detail-value.rejected {
                color: #e74c3c;
            }

            .detail-value.pending {
                color: #f39c12;
            }

            .additional-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
            }

            .additional-details h4 {
                color: #2c3e50;
                margin: 0 0 15px 0;
            }

            .additional-details pre {
                margin: 0;
                padding: 15px;
                background: white;
                border-radius: 6px;
                overflow-x: auto;
                font-size: 12px;
                font-family: 'Courier New', monospace;
            }

            /* Modal Styles */
            .modal-content {
                animation: modalSlideIn 0.3s ease;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .admin-management-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 15px;
                }

                .admin-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }

                .search-box {
                    min-width: 100%;
                }

                .filter-controls {
                    width: 100%;
                    justify-content: space-between;
                }

                .filter-select {
                    flex: 1;
                    min-width: 0;
                }

                .admin-table {
                    display: block;
                    overflow-x: auto;
                }

                .admin-table th,
                .admin-table td {
                    white-space: nowrap;
                }

                .transactions-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }

                .transactions-stats {
                    width: 100%;
                    justify-content: space-between;
                }
            }
        `;
        document.head.appendChild(styles);
        console.log('✅ Added admin management styles');
    }
}

// Initialize admin management when super admin dashboard loads
function initSuperAdminDashboardWithAdminManagement() {
    console.log('🛡️ Initializing Super Admin Dashboard with Admin Management...');
    
    // Add admin management styles
    addAdminManagementStyles();
    
    // Initialize admin management system
    initAdminManagement();
    
    // Start periodic updates
    setInterval(() => {
        loadAdminList();
    }, 30000); // Update every 30 seconds
}


// Make sure to call this when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin management when super admin section is active
    const adminManagementSection = document.getElementById('admin-management');
    if (adminManagementSection && db?.currentUser?.is_super_admin) {
        setTimeout(() => {
            initAdminManagement();
        }, 1000);
    }
});

// In your JavaScript, add an event listener for this button:
document.getElementById('open-top-investors-btn').addEventListener('click', function() {
    openTopInvestorsModal();
});

// Then create the function to open the modal:
function openTopInvestorsModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('top-investors-modal')) {
        createTopInvestorsModal();
    }
    
    // Load top investors data
    loadTopInvestorsData();
    
    // Show modal
    const modal = document.getElementById('top-investors-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Function to create the modal
function createTopInvestorsModal() {
    const modal = document.createElement('div');
    modal.id = 'top-investors-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-trophy"></i> Top Investors Leaderboard</h3>
                <button class="close-modal" onclick="closeTopInvestorsModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <div class="tab-navigation">
                    <button class="tab-btn active" data-period="weekly">Weekly</button>
                    <button class="tab-btn" data-period="monthly">Monthly</button>
                    <button class="tab-btn" data-period="yearly">Yearly</button>
                </div>
                
                <div class="top-investors-content">
                    <div id="weekly-investors" class="investors-period active">
                        <h4>Weekly Top Investors</h4>
                        <div class="loading-indicator">Loading weekly data...</div>
                    </div>
                    <div id="monthly-investors" class="investors-period">
                        <h4>Monthly Top Investors</h4>
                        <div class="loading-indicator">Loading monthly data...</div>
                    </div>
                    <div id="yearly-investors" class="investors-period">
                        <h4>Yearly Top Investors</h4>
                        <div class="loading-indicator">Loading yearly data...</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeTopInvestorsModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add tab switching functionality
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            switchTopInvestorsTab(period);
        });
    });
}

// Function to close the modal
function closeTopInvestorsModal() {
    const modal = document.getElementById('top-investors-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Function to switch tabs
function switchTopInvestorsTab(period) {
    // Update active tab
    document.querySelectorAll('#top-investors-modal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-period') === period) {
            btn.classList.add('active');
        }
    });
    
    // Update active content
    document.querySelectorAll('#top-investors-modal .investors-period').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${period}-investors`) {
            content.classList.add('active');
        }
    });
}

// Function to load top investors data
async function loadTopInvestorsData() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return;
        }
        
        const topInvestors = await db.getTopInvestors();
        
        // Update each period section
        ['weekly', 'monthly', 'yearly'].forEach(period => {
            const container = document.getElementById(`${period}-investors`);
            if (container) {
                const investors = topInvestors[period] || [];
                
                if (investors.length === 0) {
                    container.innerHTML = `
                        <h4>${capitalizeFirstLetter(period)} Top Investors</h4>
                        <div class="no-data">No ${period} investment data available</div>
                    `;
                    return;
                }
                
                let html = `
                    <h4>${capitalizeFirstLetter(period)} Top Investors</h4>
                    <div class="investors-list">
                `;
                
                investors.forEach((investor, index) => {
                    html += `
                        <div class="investor-item">
                            <div class="investor-rank">${index + 1}</div>
      
                            <div class="investor-info">
                                <div class="investor-name">${investor.username}</div>
                            </div>
                            <div class="investor-stats">
                                <div class="investor-amount">
                                    <strong>TZS ${Math.round(investor.totalInvested).toLocaleString()}</strong>
                                    <small>Total Invested</small>
                                </div>
                                <div class="investor-profit">
                                    <strong>TZS ${Math.round(investor.totalProfit).toLocaleString()}</strong>
                                    <small>Total Profit</small>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
                container.innerHTML = html;
            }
        });
        
    } catch (error) {
        console.error('Error loading top investors data:', error);
        
        // Show error in all sections
        ['weekly', 'monthly', 'yearly'].forEach(period => {
            const container = document.getElementById(`${period}-investors`);
            if (container) {
                container.innerHTML = `
                    <h4>${capitalizeFirstLetter(period)} Top Investors</h4>
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Failed to load ${period} data
                    </div>
                `;
            }
        });
    }
}

// Helper function
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
