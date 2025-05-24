// form.js
const API_BASE_URL = 'http://localhost:3000'; // Sesuaikan dengan port backend Anda

let selectedCar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Load car details from URL parameters
    loadCarDetails();
    
    // Setup form submission
    setupFormSubmission();
    
    // Setup navbar burger for mobile
    setupNavbarBurger();
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
    }
}

async function loadCarDetails() {
    // Get car ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');
    
    if (!carId) {
        showError('ID mobil tidak ditemukan. Redirecting...');
        setTimeout(() => {
            window.location.href = 'mobil.html';
        }, 2000);
        return;
    }
    
    try {
        // Fetch car details from backend
        const response = await fetch(`${API_BASE_URL}/mobil/${carId}`);
        
        if (response.ok) {
            const carData = await response.json();
            selectedCar = carData;
            displayCarDetails(carData);
            
            // Pre-fill form with user data if available
            prefillUserData();
        } else {
            throw new Error('Mobil tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading car details:', error);
        showError('Gagal memuat detail mobil. Redirecting...');
        setTimeout(() => {
            window.location.href = 'mobil.html';
        }, 2000);
    }
}

function displayCarDetails(car) {
    document.getElementById('carName').textContent = car.nama || 'N/A';
    document.getElementById('carBrand').textContent = car.merek || 'N/A';
    document.getElementById('carYear').textContent = car.tahun_produksi || 'N/A';
    document.getElementById('carPrice').textContent = `Rp ${formatCurrency(car.harga)}`;
}

function prefillUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.nama) {
        document.getElementById('buyerName').value = userData.nama;
    }
    if (userData.email) {
        document.getElementById('buyerEmail').value = userData.email;
    }
    if (userData.no_telepon) {
        document.getElementById('buyerPhone').value = userData.no_telepon;
    }
}

function setupFormSubmission() {
    const form = document.getElementById('purchaseForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide any existing messages
        hideError();
        hideSuccess();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Show loading
        showLoading();
        
        try {
            await submitPurchase();
        } catch (error) {
            console.error('Purchase submission error:', error);
            showError('Terjadi kesalahan saat memproses pembelian. Silakan coba lagi.');
        } finally {
            hideLoading();
        }
    });
}

function validateForm() {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerEmail = document.getElementById('buyerEmail').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!buyerName) {
        showError('Nama lengkap harus diisi');
        return false;
    }
    
    if (!buyerEmail) {
        showError('Email harus diisi');
        return false;
    }
    
    if (!isValidEmail(buyerEmail)) {
        showError('Format email tidak valid');
        return false;
    }
    
    if (!buyerPhone) {
        showError('No. telepon harus diisi');
        return false;
    }
    
    if (!paymentMethod) {
        showError('Metode pembayaran harus dipilih');
        return false;
    }
    
    if (!selectedCar) {
        showError('Data mobil tidak ditemukan');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function submitPurchase() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerEmail = document.getElementById('buyerEmail').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Update user data if needed (optional - based on your business logic)
    const shouldUpdateUser = userData.email !== buyerEmail || 
                           userData.nama !== buyerName || 
                           userData.no_telepon !== buyerPhone;
    
    if (shouldUpdateUser) {
        try {
            const updateResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/edit-user/${userData.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nama: buyerName,
                    email: buyerEmail,
                    no_telepon: buyerPhone,
                    alamat: userData.alamat || ''
                })
            });
            
            if (updateResponse && updateResponse.ok) {
                // Update local storage
                const updatedUserData = {
                    ...userData,
                    nama: buyerName,
                    email: buyerEmail,
                    no_telepon: buyerPhone
                };
                localStorage.setItem('userData', JSON.stringify(updatedUserData));
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            // Continue with transaction even if user update fails
        }
    }
    
    // Create transaction
    const transactionData = {
        id_user: userData.id,
        id_mobil: selectedCar.id,
        metode_pembayaran: paymentMethod
    };
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tambahtransaksi`, {
        method: 'POST',
        body: JSON.stringify(transactionData)
    });
    
    if (response && response.ok) {
        const result = await response.json();
        showSuccess('Pembelian berhasil! Terima kasih atas kepercayaan Anda.');
        
        // Reset form
        document.getElementById('purchaseForm').reset();
        
        // Redirect to transaction page after 3 seconds
        setTimeout(() => {
            window.location.href = 'transaksiSaya.html';
        }, 3000);
    } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal memproses pembelian');
    }
}

function setupNavbarBurger() {
    // Get all "navbar-burger" elements
    const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
    
    // Check if there are any navbar burgers
    if (navbarBurgers.length > 0) {
        // Add a click event on each of them
        navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const targetElement = document.getElementById(target);
                
                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                targetElement.classList.toggle('is-active');
            });
        });
    }
}

function convertPriceToNumber(priceString) {
    if (!priceString) return 0;
    
    // Convert to lowercase and remove extra spaces
    let price = priceString.toString().toLowerCase().trim();
    
    // If it's already a number, return it
    if (!isNaN(price) && !isNaN(parseFloat(price))) {
        return parseFloat(price);
    }
    
    // Remove 'rp', 'rupiah', and common punctuation
    price = price.replace(/rp\.?|rupiah/gi, '').trim();
    
    // Handle Indonesian number words
    let multiplier = 1;
    let baseNumber = 0;
    
    // Extract the base number (digits before the word)
    const numberMatch = price.match(/(\d+(?:[.,]\d+)?)/);
    if (numberMatch) {
        baseNumber = parseFloat(numberMatch[1].replace(',', '.'));
    }
    
    // Determine multiplier based on Indonesian words
    if (price.includes('ribu')) {
        multiplier = 1000;
    } else if (price.includes('juta')) {
        multiplier = 1000000;
    } else if (price.includes('miliar') || price.includes('milyar')) {
        multiplier = 1000000000;
    } else if (price.includes('triliun')) {
        multiplier = 1000000000000;
    }
    
    // If no base number found but we have text, try to extract any number
    if (baseNumber === 0) {
        const anyNumberMatch = price.match(/(\d+)/);
        if (anyNumberMatch) {
            baseNumber = parseInt(anyNumberMatch[1]);
        }
    }
    
    return baseNumber * multiplier;
}

function formatCurrency(amount) {
    // Convert string to number using our custom function
    const numericAmount = convertPriceToNumber(amount);
    
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);
}

function showLoading() {
    document.getElementById('loadingMessage').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function showSuccess(message) {
    document.getElementById('successText').textContent = message;
    document.getElementById('successMessage').style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideSuccess();
    }, 5000);
}

function hideSuccess() {
    document.getElementById('successMessage').style.display = 'none';
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