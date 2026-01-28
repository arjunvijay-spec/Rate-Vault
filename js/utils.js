// Toast System
const Toast = {
    show(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div>${message}</div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Storage Helper
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    }
};

// Session Manager
const Session = {
    setUser(user) {
        Storage.set('currentUser', user);
        Storage.set('sessionTime', Date.now());
    },
    
    getUser() {
        const user = Storage.get('currentUser');
        const sessionTime = Storage.get('sessionTime');
        
        if (!user || !sessionTime) return null;
        
        // 24 hour session
        if (Date.now() - sessionTime > 24 * 60 * 60 * 1000) {
            this.logout();
            return null;
        }
        
        return user;
    },
    
    isAuthenticated() {
        return this.getUser() !== null;
    },
    
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    logout() {
        Storage.remove('currentUser');
        Storage.remove('sessionTime');
        window.location.href = '../index.html';
    }
};

// Simple hash for demo
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + hash.toString(36);
}

// Initialize users
function initUsers() {
    let users = Storage.get('rv_users');
    if (!users || users.length === 0) {
        users = [{
            id: 'admin001',
            name: 'Administrator',
            email: 'admin@ratevault.com',
            password: hashPassword('admin2024'),
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString()
        }];
        Storage.set('rv_users', users);
    }
    return users;
}

window.Toast = Toast;
window.Storage = Storage;
window.Session = Session;
window.hashPassword = hashPassword;
window.initUsers = initUsers;
