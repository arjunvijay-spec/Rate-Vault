// Initialize users on page load
initUsers();

// Card switching functions
function showLogin() {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('adminLoginCard').classList.add('hidden');
    document.getElementById('registerCard').classList.add('hidden');
}

function showAdminLogin() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminLoginCard').classList.remove('hidden');
    document.getElementById('registerCard').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminLoginCard').classList.add('hidden');
    document.getElementById('registerCard').classList.remove('hidden');
}

// Password toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// User Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const users = Storage.get('rv_users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        Toast.show('Email not found. Please register first.', 'error');
        return;
    }
    
    if (user.password !== hashPassword(password)) {
        Toast.show('Incorrect password', 'error');
        return;
    }
    
    if (user.role === 'admin') {
        Toast.show('Please use Admin Login for administrator accounts', 'error');
        return;
    }
    
    if (user.status === 'blocked') {
        Toast.show('Your account has been blocked', 'error');
        return;
    }
    
    Session.setUser(user);
    showSuccess('dashboard.html');
});

// Admin Login
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    const users = Storage.get('rv_users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        Toast.show('Admin account not found', 'error');
        return;
    }
    
    if (user.password !== hashPassword(password)) {
        Toast.show('Incorrect password', 'error');
        return;
    }
    
    if (user.role !== 'admin') {
        Toast.show('Not an administrator account', 'error');
        return;
    }
    
    Session.setUser(user);
    showSuccess('admin.html');
});

// Register
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (name.length < 2) {
        Toast.show('Name must be at least 2 characters', 'error');
        return;
    }
    
    if (!email.includes('@')) {
        Toast.show('Invalid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        Toast.show('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        Toast.show('Passwords do not match', 'error');
        return;
    }
    
    const users = Storage.get('rv_users') || [];
    
    if (users.find(u => u.email === email)) {
        Toast.show('Email already registered. Please login.', 'error');
        return;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        password: hashPassword(password),
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    Storage.set('rv_users', users);
    
    Toast.show('Account created successfully! Please login.', 'success');
    
    setTimeout(() => {
        showLogin();
        document.getElementById('loginEmail').value = email;
    }, 1500);
});

// Success animation
function showSuccess(redirectUrl) {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminLoginCard').classList.add('hidden');
    document.getElementById('successAnimation').classList.remove('hidden');
    
    Toast.show('Login successful!', 'success');
    
    setTimeout(() => {
        window.location.href = 'pages/' + redirectUrl;
    }, 2000);
}

// Password strength indicator
const registerPassword = document.getElementById('registerPassword');
if (registerPassword) {
    registerPassword.addEventListener('input', function() {
        const password = this.value;
        const strengthDiv = document.getElementById('passwordStrength');
        const fill = strengthDiv.querySelector('.strength-fill');
        const text = strengthDiv.querySelector('.strength-text span');
        
        if (password.length === 0) {
            strengthDiv.style.display = 'none';
            return;
        }
        
        strengthDiv.style.display = 'block';
        
        let strength = 'weak';
        fill.className = 'strength-fill';
        
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            strength = 'strong';
        } else if (password.length >= 6) {
            strength = 'medium';
        }
        
        fill.classList.add(strength);
        text.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
        text.className = strength;
    });
}

// Check if already logged in
if (Session.isAuthenticated()) {
    const user = Session.getUser();
    if (user.role === 'admin') {
        window.location.href = 'pages/admin.html';
    } else {
        window.location.href = 'pages/dashboard.html';
    }
}
