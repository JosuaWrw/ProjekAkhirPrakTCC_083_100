// indexUser.js
const API_BASE_URL = 'https://dealer-project-935996462481.us-central1.run.app'; // Sesuaikan dengan port backend Anda

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Setup logout functionality
    setupLogout();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!accessToken) {
        // No token, redirect to login
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user has admin role and redirect to admin dashboard
    if (userData.role === 'admin') {
        window.location.href = 'indexAdmin.html';
        return;
    }
    
    // Verify token is still valid
    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // Token might be expired, try to refresh
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
                // Refresh failed, redirect to login
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Try to refresh token
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

async function refreshToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'GET',
            credentials: 'include' // Include cookies for refresh token
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
    }
}

function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.nama) {
        // Set greeting
        const userGreeting = document.getElementById('userGreeting');
        const currentHour = new Date().getHours();
        let greeting = 'Selamat Datang';
        
        if (currentHour < 12) {
            greeting = 'Selamat Pagi';
        } else if (currentHour < 15) {
            greeting = 'Selamat Siang';
        } else if (currentHour < 18) {
            greeting = 'Selamat Sore';
        } else {
            greeting = 'Selamat Malam';
        }
        
        userGreeting.textContent = `${greeting}, ${userData.nama}!`;
        
        // Set username in dropdown
        const userName = document.getElementById('userName');
        userName.textContent = userData.nama;
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            // Call logout API
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'DELETE',
                credentials: 'include' // Include cookies for refresh token
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
        
        // Clear local storage regardless of API call result
        localStorage.clear();
        
        // Redirect to login
        window.location.href = 'login.html';
    });
}

// Utility function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
    let accessToken = localStorage.getItem('accessToken');
    
    // Set default headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
    };
    
    // Make the request
    let response = await fetch(url, {
        ...options,
        headers
    });
    
    // If token expired, try to refresh
    if (response.status === 401 || response.status === 403) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
            // Retry with new token
            accessToken = localStorage.getItem('accessToken');
            headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(url, {
                ...options,
                headers
            });
        } else {
            // Refresh failed, redirect to login
            localStorage.clear();
            window.location.href = 'login.html';
            return null;
        }
    }
    
    return response;
}