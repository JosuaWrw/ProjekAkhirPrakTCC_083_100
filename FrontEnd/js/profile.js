// profile.js
const API_BASE_URL = 'https://dealer-project-935996462481.us-central1.run.app'; // Sesuaikan dengan port backend Anda

let currentUserData = {};

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Load profile data
    loadProfileData();
    
    // Setup logout functionality
    setupLogout();
    
    // Setup form submission
    setupFormSubmission();
    
    // Fix navigation links based on user role
    fixNavigationLinks();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user`);
        if (!response) {
            return; // makeAuthenticatedRequest handles redirect
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

async function refreshToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'GET',
            credentials: 'include'
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
        
        const userName = document.getElementById('userName');
        userName.textContent = userData.nama;
    }
}

async function loadProfileData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) {
        alert('Data user tidak ditemukan. Silakan login ulang.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/${userData.id}`);
        
        if (response && response.ok) {
            const profileData = await response.json();
            currentUserData = profileData;
            displayProfileData(profileData);
        } else {
            throw new Error('Failed to load profile data');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to localStorage data
        displayProfileData(userData);
        currentUserData = userData;
    }
}

function displayProfileData(data) {
    // Profile header
    document.getElementById('profileName').textContent = data.nama || 'Tidak tersedia';
    document.getElementById('profileEmail').textContent = data.email || 'Tidak tersedia';
    
    const profileRoleBadge = document.getElementById('profileRole');
    profileRoleBadge.textContent = data.role || 'user';
    profileRoleBadge.className = `role-badge role-${data.role || 'user'}`;
    
    // Profile info
    document.getElementById('displayName').textContent = data.nama || 'Tidak tersedia';
    document.getElementById('displayEmail').textContent = data.email || 'Tidak tersedia';
    document.getElementById('displayPhone').textContent = data.no_telepon || 'Tidak tersedia';
    document.getElementById('displayAddress').textContent = data.alamat || 'Tidak tersedia';
    
    const displayRoleBadge = document.getElementById('displayRole');
    displayRoleBadge.textContent = data.role || 'user';
    displayRoleBadge.className = `role-badge role-${data.role || 'user'}`;
    
    // Populate edit form
    document.getElementById('editName').value = data.nama || '';
    document.getElementById('editEmail').value = data.email || '';
    document.getElementById('editPhone').value = data.no_telepon || '';
    document.getElementById('editAddress').value = data.alamat || '';
}

function fixNavigationLinks() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const dashboardLink = document.querySelector('a[href="index.html"]');
    
    if (dashboardLink) {
        if (userData.role === 'admin') {
            dashboardLink.href = 'indexAdmin.html';
        } else {
            dashboardLink.href = 'indexUser.html';
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
        
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

function setupFormSubmission() {
    const profileEditForm = document.getElementById('profileEditForm');
    
    profileEditForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nama: document.getElementById('editName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            no_telepon: document.getElementById('editPhone').value.trim(),
            alamat: document.getElementById('editAddress').value.trim()
        };
        
        // Validation
        if (!validateForm(formData)) {
            return;
        }
        
        await updateProfile(formData);
    });
}

function validateForm(formData) {
    if (!formData.nama || !formData.email || !formData.no_telepon || !formData.alamat) {
        showError('Semua field harus diisi');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('Format email tidak valid');
        return false;
    }
    
    const phoneRegex = /^[0-9+\-\s]+$/;
    if (!phoneRegex.test(formData.no_telepon)) {
        showError('Format nomor telepon tidak valid');
        return false;
    }
    
    return true;
}

async function updateProfile(formData) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) {
        showError('Data user tidak ditemukan. Silakan login ulang.');
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/edit-user/${userData.id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (response && response.ok) {
            const result = await response.json();
            
            // Update localStorage with new data
            const updatedUserData = { ...userData, ...formData };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // Update current display
            currentUserData = { ...currentUserData, ...formData };
            displayProfileData(currentUserData);
            
            showSuccess('Profil berhasil diperbarui!');
            
            // Hide edit form and show profile info
            cancelEdit();
            
            // Reload user info in navbar
            loadUserInfo();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal memperbarui profil');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Gagal memperbarui profil. Silakan coba lagi.');
    }
}

function showEditForm() {
    document.getElementById('profileInfo').style.display = 'none';
    document.getElementById('editForm').classList.add('show');
    document.getElementById('editBtn').style.display = 'none';
}

function cancelEdit() {
    document.getElementById('editForm').classList.remove('show');
    document.getElementById('profileInfo').style.display = 'block';
    document.getElementById('editBtn').style.display = 'inline-block';
    
    hideError();
    hideSuccess();
    
    // Reset form to original values
    displayProfileData(currentUserData);
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    
    hideSuccess();
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successMessage.style.display = 'block';
    
    hideError();
}

function hideSuccess() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'none';
}

// Utility function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
    let accessToken = localStorage.getItem('accessToken');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
    };
    
    let response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401 || response.status === 403) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
            accessToken = localStorage.getItem('accessToken');
            headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(url, {
                ...options,
                headers
            });
        } else {
            localStorage.clear();
            window.location.href = 'login.html';
            return null;
        }
    }
    
    return response;
}