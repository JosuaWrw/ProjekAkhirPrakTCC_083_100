// register.js
const API_BASE_URL = 'http://localhost:3000'; // Sesuaikan dengan port backend Anda

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Check if user is already logged in
    if (localStorage.getItem('accessToken')) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.role === 'admin') {
            window.location.href = 'indexAdmin.html';
        } else {
            window.location.href = 'indexUser.html';
        }
    }

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nama: document.getElementById('nama').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            no_telepon: document.getElementById('no_telepon').value.trim(),
            alamat: document.getElementById('alamat').value.trim(),
            role: 'user' // Default role untuk registrasi umum
        };
        
        // Validation
        if (!validateForm(formData)) {
            return;
        }
        
        showLoading();
        hideError();
        hideSuccess();
        
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nama: formData.nama,
                    email: formData.email,
                    password: formData.password,
                    no_telepon: formData.no_telepon,
                    alamat: formData.alamat,
                    role: formData.role
                })
            });
            
            const data = await response.json();
            
            if (response.status === 201 && data.status === 'Success') {
                hideLoading();
                showSuccess('Registrasi berhasil! Silakan login dengan akun Anda.');
                
                // Reset form
                registerForm.reset();
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                hideLoading();
                showError(data.msg || 'Registrasi gagal. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Register error:', error);
            hideLoading();
            showError('Terjadi kesalahan koneksi. Silakan coba lagi.');
        }
    });
});

function validateForm(formData) {
    // Check empty fields
    if (!formData.nama || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.no_telepon || !formData.alamat) {
        showError('Semua field harus diisi');
        return false;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('Format email tidak valid');
        return false;
    }
    
    // Check password length
    if (formData.password.length < 6) {
        showError('Password minimal 6 karakter');
        return false;
    }
    
    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
        showError('Konfirmasi password tidak cocok');
        return false;
    }
    
    // Check phone number format (basic validation)
    const phoneRegex = /^[0-9+\-\s]+$/;
    if (!phoneRegex.test(formData.no_telepon)) {
        showError('Format nomor telepon tidak valid');
        return false;
    }
    
    return true;
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

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successMessage.style.display = 'block';
}

function hideSuccess() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'none';
}

function showLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';
}

function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'none';
}