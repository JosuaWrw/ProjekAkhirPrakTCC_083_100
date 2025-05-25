// transaksiSaya.js
const API_BASE_URL = 'https://dealer-project-935996462481.us-central1.run.app'; // Sesuaikan dengan port backend Anda

let allTransactions = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Setup logout functionality
    setupLogout();
    
    // Load user transactions
    loadUserTransactions();
    
    // Setup modal functionality
    setupModal();
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

async function loadUserTransactions() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) {
        showError('Data user tidak ditemukan. Silakan login ulang.');
        return;
    }
    
    showLoading();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksiuser/${userData.id}`);
        
        if (response && response.ok) {
            const transactions = await response.json();
            allTransactions = transactions;
            displayTransactions(transactions);
        } else {
            throw new Error('Failed to load transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Gagal memuat data transaksi. Silakan refresh halaman.');
    } finally {
        hideLoading();
    }
}

function displayTransactions(transactions) {
    const transactionTable = document.getElementById('transactionTable');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('transactionTableBody');
    
    if (transactions.length === 0) {
        transactionTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    transactionTable.style.display = 'block';
    
    const transactionsHTML = transactions.map((transaction, index) => {
        const tanggal = new Date(transaction.tanggal_dipesan).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const mobilNama = transaction.mobil ? transaction.mobil.nama : 'Mobil tidak ditemukan';
        const mobilHarga = transaction.mobil ? formatCurrency(transaction.mobil.harga) : 'Harga tidak tersedia';
        const status = getTransactionStatus(); // Since backend doesn't have status field
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${tanggal}</td>
                <td>${mobilNama}</td>
                <td>Rp ${mobilHarga}</td>
                <td>${transaction.metode_pembayaran}</td>
                <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                <td>
                    <button class="button is-small is-info detail-button" onclick="showTransactionDetail(${transaction.id})">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = transactionsHTML;
}

function getTransactionStatus() {
    // Since backend doesn't have status field, we'll default to 'Success'
    // You can modify this logic based on your business requirements
    return 'Success';
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'success':
        case 'berhasil':
            return 'status-success';
        case 'pending':
        case 'menunggu':
            return 'status-pending';
        case 'cancelled':
        case 'dibatalkan':
            return 'status-cancelled';
        default:
            return 'status-success';
    }
}

async function showTransactionDetail(transactionId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi/${transactionId}`);
        
        if (response && response.ok) {
            const transactionData = await response.json();
            // The API returns an array, so we take the first element
            const transaction = Array.isArray(transactionData) ? transactionData[0] : transactionData;
            
            if (transaction) {
                displayTransactionDetail(transaction);
                openModal();
            } else {
                alert('Detail transaksi tidak ditemukan');
            }
        } else {
            throw new Error('Failed to load transaction detail');
        }
    } catch (error) {
        console.error('Error loading transaction detail:', error);
        alert('Gagal memuat detail transaksi');
    }
}

function displayTransactionDetail(transaction) {
    const tanggal = new Date(transaction.tanggal_dipesan).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const mobilNama = transaction.mobil ? transaction.mobil.nama : 'Mobil tidak ditemukan';
    const mobilHarga = transaction.mobil ? formatCurrency(transaction.mobil.harga) : 'Harga tidak tersedia';
    const userName = transaction.user ? transaction.user.nama : 'User tidak ditemukan';
    const userPhone = transaction.user ? transaction.user.no_telepon : 'Tidak tersedia';
    const userAddress = transaction.user ? transaction.user.alamat : 'Tidak tersedia';
    const status = getTransactionStatus();
    
    const detailHTML = `
        <div class="content">
            <h4 class="title is-5">Informasi Transaksi</h4>
            <table class="table is-fullwidth">
                <tbody>
                    <tr>
                        <th>ID Transaksi</th>
                        <td>#${transaction.id}</td>
                    </tr>
                    <tr>
                        <th>Tanggal Pemesanan</th>
                        <td>${tanggal}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
                    </tr>
                </tbody>
            </table>
            
            <h4 class="title is-5">Informasi Mobil</h4>
            <table class="table is-fullwidth">
                <tbody>
                    <tr>
                        <th>Nama Mobil</th>
                        <td>${mobilNama}</td>
                    </tr>
                    <tr>
                        <th>Harga</th>
                        <td>Rp ${mobilHarga}</td>
                    </tr>
                </tbody>
            </table>
            
            <h4 class="title is-5">Informasi Pembeli</h4>
            <table class="table is-fullwidth">
                <tbody>
                    <tr>
                        <th>Nama</th>
                        <td>${userName}</td>
                    </tr>
                    <tr>
                        <th>No. Telepon</th>
                        <td>${userPhone}</td>
                    </tr>
                    <tr>
                        <th>Alamat</th>
                        <td>${userAddress}</td>
                    </tr>
                </tbody>
            </table>
            
            <h4 class="title is-5">Informasi Pembayaran</h4>
            <table class="table is-fullwidth">
                <tbody>
                    <tr>
                        <th>Metode Pembayaran</th>
                        <td>${transaction.metode_pembayaran}</td>
                    </tr>
                    <tr>
                        <th>Total Harga</th>
                        <td><strong>Rp ${mobilHarga}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('transactionDetail').innerHTML = detailHTML;
}

function setupModal() {
    const modal = document.getElementById('transactionModal');
    const closeButtons = modal.querySelectorAll('.delete, .modal-background');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.add('is-active');
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.remove('is-active');
    document.body.classList.remove('modal-open');
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
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('transactionTable').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    hideLoading();
    alert(message);
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