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
        updateElement('user-referral-display', db.currentUser.referral_code || '-');
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