// login.js
const API_BASE_URL = 'http://localhost:3000'; // Sesuaikan dengan port backend Anda

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Check if user is already logged in
    if (localStorage.getItem('accessToken')) {
        redirectBasedOnRole();
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Email dan password tidak boleh kosong');
            return;
        }
        
        showLoading();
        hideError();
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for refresh token
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'Succes') {
                // Store access token and user data
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('userData', JSON.stringify(data.safeUserData));
                
                hideLoading();
                
                // Redirect based on user role
                redirectBasedOnRole(data.safeUserData.role);
            } else {
                hideLoading();
                showError(data.message || 'Login gagal. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Login error:', error);
            hideLoading();
            showError('Terjadi kesalahan koneksi. Silakan coba lagi.');
        }
    });
});

function redirectBasedOnRole(role = null) {
    if (!role) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        role = userData.role;
    }
    
    if (role === 'admin') {
        window.location.href = 'indexAdmin.html';
    } else {
        window.location.href = 'indexUser.html';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}

function showLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';
}

function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'none';
}