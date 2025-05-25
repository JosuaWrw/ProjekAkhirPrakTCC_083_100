// listTransaksi.js
const API_BASE_URL = 'http://localhost:3000'; // Sesuaikan dengan port backend Anda

let allTransaksi = [];
let filteredTransaksi = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load admin info
    loadAdminInfo();
    
    // Setup logout functionality
    setupLogout();
    
    // Load all transactions
    loadAllTransaksi();
    
    // Setup modal functionality
    setupModal();
    
    // Setup search functionality
    setupSearch();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        window.location.href = '../login.html';
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user`);
        if (!response) {
            return; // makeAuthenticatedRequest handles redirect
        }
        
        // Check if user has admin role
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.role !== 'admin') {
            alert('Akses ditolak. Anda tidak memiliki hak admin.');
            window.location.href = '../login.html';
            return;
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.clear();
        window.location.href = '../login.html';
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

function loadAdminInfo() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.nama) {
        const adminGreeting = document.getElementById('adminGreeting');
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
        
        adminGreeting.textContent = `${greeting}, ${userData.nama}!`;
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
        window.location.href = '../login.html';
    });
}

async function loadAllTransaksi() {
    showLoading();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi`);
        
        if (response && response.ok) {
            const transaksi = await response.json();
            
            // Get detailed transaction data with user and mobil info
            const detailedTransaksi = await Promise.all(
                transaksi.map(async (t) => {
                    try {
                        const detailResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi/${t.id}`);
                        if (detailResponse && detailResponse.ok) {
                            const detailData = await detailResponse.json();
                            return Array.isArray(detailData) ? detailData[0] : detailData;
                        }
                        return t;
                    } catch (error) {
                        console.error(`Error loading detail for transaction ${t.id}:`, error);
                        return t;
                    }
                })
            );
            
            allTransaksi = detailedTransaksi;
            filteredTransaksi = [...allTransaksi];
            displayTransaksi(filteredTransaksi);
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

function displayTransaksi(transaksi) {
    const transaksiTable = document.getElementById('transaksiTable');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('transaksiTableBody');
    
    if (transaksi.length === 0) {
        transaksiTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    transaksiTable.style.display = 'block';
    
    const transaksiHTML = transaksi.map((transaction) => {
        const customerName = transaction.user ? transaction.user.nama : 'User tidak ditemukan';
        const mobilName = transaction.mobil ? transaction.mobil.nama : 'Mobil tidak ditemukan';
        const tanggal = new Date(transaction.tanggal_dipesan).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const metodePembayaran = transaction.metode_pembayaran || 'Tidak diketahui';
        const paymentClass = getPaymentMethodClass(metodePembayaran);
        
        return `
            <tr>
                <td>#${transaction.id}</td>
                <td>${customerName}</td>
                <td>${mobilName}</td>
                <td>
                    <span class="payment-method ${paymentClass}">
                        ${metodePembayaran.charAt(0).toUpperCase() + metodePembayaran.slice(1)}
                    </span>
                </td>
                <td>${tanggal}</td>
                <td>
                    <div class="action-buttons">
                        <button class="button is-small is-info" onclick="editTransaksi(${transaction.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="button is-small is-danger" onclick="deleteTransaksi(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = transaksiHTML;
}

function getPaymentMethodClass(method) {
    switch(method.toLowerCase()) {
        case 'cash':
            return 'method-cash';
        case 'transfer':
            return 'method-transfer';
        case 'credit':
            return 'method-credit';
        default:
            return 'method-cash';
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        searchTransaksi();
    });
    
    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTransaksi();
        }
    });
}

function searchTransaksi() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const paymentFilter = document.getElementById('paymentFilter').value.toLowerCase();
    
    filteredTransaksi = allTransaksi.filter(transaction => {
        const customerName = transaction.user ? transaction.user.nama.toLowerCase() : '';
        const mobilName = transaction.mobil ? transaction.mobil.nama.toLowerCase() : '';
        const transactionId = transaction.id.toString();
        const metodePembayaran = transaction.metode_pembayaran ? transaction.metode_pembayaran.toLowerCase() : '';
        
        const matchesSearch = searchTerm === '' || 
            customerName.includes(searchTerm) ||
            mobilName.includes(searchTerm) ||
            transactionId.includes(searchTerm);
            
        const matchesPayment = paymentFilter === '' || metodePembayaran === paymentFilter;
        
        return matchesSearch && matchesPayment;
    });
    
    displayTransaksi(filteredTransaksi);
}

function filterByPayment() {
    searchTransaksi(); // Reuse search function with filter
}

async function editTransaksi(transaksiId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi/${transaksiId}`);
        
        if (response && response.ok) {
            const transaksiData = await response.json();
            const transaction = Array.isArray(transaksiData) ? transaksiData[0] : transaksiData;
            
            if (transaction) {
                populateEditForm(transaction);
                openModal();
            } else {
                alert('Data transaksi tidak ditemukan');
            }
        } else {
            throw new Error('Failed to load transaction data');
        }
    } catch (error) {
        console.error('Error loading transaction data:', error);
        alert('Gagal memuat data transaksi');
    }
}

function populateEditForm(transaction) {
    document.getElementById('transaksiId').value = transaction.id;
    document.getElementById('customerName').value = transaction.user ? transaction.user.nama : 'User tidak ditemukan';
    document.getElementById('mobilName').value = transaction.mobil ? transaction.mobil.nama : 'Mobil tidak ditemukan';
    document.getElementById('metodePembayaran').value = transaction.metode_pembayaran || '';
    
    // Format tanggal untuk input datetime-local
    const tanggal = new Date(transaction.tanggal_dipesan);
    const formatTanggal = tanggal.toISOString().slice(0, 16);
    document.getElementById('tanggalTransaksi').value = formatTanggal;
}

async function saveTransaksi() {
    const transaksiId = document.getElementById('transaksiId').value;
    const metodePembayaran = document.getElementById('metodePembayaran').value;
    const tanggalTransaksi = document.getElementById('tanggalTransaksi').value;
    
    if (!metodePembayaran || !tanggalTransaksi) {
        showNotification('Mohon lengkapi semua field yang diperlukan', 'is-warning');
        return;
    }
    
    const updateData = {
        metode_pembayaran: metodePembayaran,
        tanggal_dipesan: new Date(tanggalTransaksi).toISOString()
    };
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/updatetransaksi/${transaksiId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (response && response.ok) {
            showNotification('Transaksi berhasil diperbarui!', 'is-success');
            closeModal();
            loadAllTransaksi(); // Reload data
        } else {
            throw new Error('Failed to update transaction');
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showNotification('Gagal memperbarui transaksi', 'is-danger');
    }
}

async function deleteTransaksi(transaksiId) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/deletetransaksi/${transaksiId}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            showNotification('Transaksi berhasil dihapus!', 'is-success');
            loadAllTransaksi(); // Reload data
        } else {
            throw new Error('Failed to delete transaction');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Gagal menghapus transaksi', 'is-danger');
    }
}

function setupModal() {
    const modal = document.getElementById('transaksiModal');
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
    const modal = document.getElementById('transaksiModal');
    modal.classList.add('is-active');
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('transaksiModal');
    modal.classList.remove('is-active');
    document.body.classList.remove('modal-open');
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('transaksiTable').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    hideLoading();
    alert(message);
}

function showNotification(message, type = 'is-info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // Remove existing classes
    notification.className = 'notification';
    
    // Add new type class
    notification.classList.add(type);
    
    notificationText.textContent = message;
    notification.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
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
            window.location.href = '../login.html';
            return null;
        }
    }
    
    return response;
}