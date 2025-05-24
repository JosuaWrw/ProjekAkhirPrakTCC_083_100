// listTransaksi.js
const API_BASE_URL = 'http://localhost:3000';

let allTransaksi = [];
let filteredTransaksi = [];
let isEditMode = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadAdminInfo();
    setupLogout();
    loadTransaksi();
    setupSearch();
    setupModal();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!accessToken || userData.role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user`);
        if (!response) {
            return;
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
        
        if (confirm('Apakah Anda yakin ingin logout?')) {
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
        }
    });
}

async function loadTransaksi() {
    showLoading();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi`);
        
        if (response && response.ok) {
            const transaksi = await response.json();
            allTransaksi = transaksi;
            filteredTransaksi = transaksi;
            displayTransaksi(transaksi);
        } else {
            throw new Error('Failed to load transaksi');
        }
    } catch (error) {
        console.error('Error loading transaksi:', error);
        showNotification('Gagal memuat data transaksi. Silakan refresh halaman.', 'error');
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
    
    const transaksiHTML = transaksi.map((t, index) => {
        const paymentClass = getPaymentClass(t.metode_pembayaran);
        const tanggalFormatted = formatDate(t.tanggal_dipesan);
        
        // Handle data with or without includes - prioritize included data, fallback to ID
        const customerName = t.user ? t.user.nama : `User ID: ${t.id_user}`;
        const mobilName = t.mobil ? t.mobil.nama : `Mobil ID: ${t.id_mobil}`;
        
        return `
            <tr>
                <td>${t.id}</td>
                <td>${customerName}</td>
                <td>${mobilName}</td>
                <td><span class="payment-method ${paymentClass}">${formatPaymentMethod(t.metode_pembayaran)}</span></td>
                <td>${tanggalFormatted}</td>
                <td>
                    <div class="action-buttons">
                        <button class="button is-small is-info" onclick="editTransaksi(${t.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="button is-small is-danger" onclick="deleteTransaksi(${t.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="button is-small is-link" onclick="viewTransaksi(${t.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = transaksiHTML;
}

function getPaymentClass(method) {
    switch(method?.toLowerCase()) {
        case 'cash': return 'method-cash';
        case 'transfer': return 'method-transfer';
        case 'credit': return 'method-credit';
        default: return 'method-cash';
    }
}

function formatPaymentMethod(method) {
    switch(method?.toLowerCase()) {
        case 'cash': return 'Cash';
        case 'transfer': return 'Transfer Bank';
        case 'credit': return 'Credit Card';
        default: return method || 'N/A';
    }
}

// Remove the convertPriceToNumber and formatRupiah functions since we don't need them for transactions

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterTransaksi(searchTerm);
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTransaksi();
        }
    });
}

function searchTransaksi() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterTransaksi(searchTerm);
}

function filterTransaksi(searchTerm = '') {
    const paymentFilter = document.getElementById('paymentFilter').value;
    
    filteredTransaksi = allTransaksi.filter(transaksi => {
        // Get names with fallback to ID
        const customerName = transaksi.user ? transaksi.user.nama : `User ID: ${transaksi.id_user}`;
        const mobilName = transaksi.mobil ? transaksi.mobil.nama : `Mobil ID: ${transaksi.id_mobil}`;
        
        const matchesSearch = searchTerm === '' || 
            customerName.toLowerCase().includes(searchTerm) ||
            mobilName.toLowerCase().includes(searchTerm) ||
            (transaksi.metode_pembayaran && transaksi.metode_pembayaran.toLowerCase().includes(searchTerm)) ||
            transaksi.id.toString().includes(searchTerm);
            
        const matchesPayment = paymentFilter === '' || transaksi.metode_pembayaran === paymentFilter;
        
        return matchesSearch && matchesPayment;
    });
    
    displayTransaksi(filteredTransaksi);
}

function filterByPayment() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterTransaksi(searchTerm);
}

function setupModal() {
    const modal = document.getElementById('transaksiModal');
    const closeButtons = modal.querySelectorAll('.delete, .modal-background');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

async function editTransaksi(transaksiId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi/${transaksiId}`);
        
        if (response && response.ok) {
            const transaksiData = await response.json();
            // The API returns an array, so we take the first element
            const transaksi = Array.isArray(transaksiData) ? transaksiData[0] : transaksiData;
            
            if (!transaksi) {
                throw new Error('Transaksi tidak ditemukan');
            }
            
            isEditMode = true;
            document.getElementById('modalTitle').textContent = 'Edit Transaksi';
            
            // Fill form with transaksi data
            document.getElementById('transaksiId').value = transaksi.id;
            document.getElementById('customerName').value = transaksi.user ? transaksi.user.nama : `User ID: ${transaksi.id_user}`;
            document.getElementById('mobilName').value = transaksi.mobil ? transaksi.mobil.nama : `Mobil ID: ${transaksi.id_mobil}`;
            document.getElementById('metodePembayaran').value = transaksi.metode_pembayaran || '';
            
            // Format date for datetime-local input
            if (transaksi.tanggal_dipesan) {
                const date = new Date(transaksi.tanggal_dipesan);
                const formattedDate = date.toISOString().slice(0, 16);
                document.getElementById('tanggalTransaksi').value = formattedDate;
            }
            
            // Show modal
            document.getElementById('transaksiModal').classList.add('is-active');
        } else {
            throw new Error('Transaksi tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading transaksi:', error);
        showNotification('Gagal memuat data transaksi', 'error');
    }
}

async function deleteTransaksi(transaksiId) {
    const transaksi = allTransaksi.find(t => t.id === transaksiId);
    const customerName = transaksi && transaksi.user ? transaksi.user.nama : 'Unknown';
    
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi dari "${customerName}"?`)) {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/deletetransaksi/${transaksiId}`, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                showNotification('Transaksi berhasil dihapus', 'success');
                await loadTransaksi(); // Refresh data
            } else {
                throw new Error('Gagal menghapus transaksi');
            }
        } catch (error) {
            console.error('Error deleting transaksi:', error);
            showNotification('Gagal menghapus transaksi', 'error');
        }
    }
}

async function viewTransaksi(transaksiId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/transaksi/${transaksiId}`);
        
        if (response && response.ok) {
            const transaksiData = await response.json();
            // The API returns an array, so we take the first element
            const transaksi = Array.isArray(transaksiData) ? transaksiData[0] : transaksiData;
            
            if (transaksi) {
                showTransaksiDetail(transaksi);
            } else {
                showNotification('Detail transaksi tidak ditemukan', 'error');
            }
        } else {
            throw new Error('Failed to load transaction detail');
        }
    } catch (error) {
        console.error('Error loading transaction detail:', error);
        showNotification('Gagal memuat detail transaksi', 'error');
    }
}

function showTransaksiDetail(transaksi) {
    const customerName = transaksi.user ? transaksi.user.nama : `User ID: ${transaksi.id_user}`;
    const customerPhone = transaksi.user ? transaksi.user.no_telepon : 'N/A';
    const customerAddress = transaksi.user ? transaksi.user.alamat : 'N/A';
    const mobilName = transaksi.mobil ? transaksi.mobil.nama : `Mobil ID: ${transaksi.id_mobil}`;
    const mobilMerek = transaksi.mobil ? transaksi.mobil.merek : 'N/A';
    const tanggalFormatted = formatDate(transaksi.tanggal_dipesan);
    
    const transaksiInfo = `
Detail Transaksi:

ID Transaksi: ${transaksi.id}
ID User: ${transaksi.id_user}
ID Mobil: ${transaksi.id_mobil}

=== INFORMASI CUSTOMER ===
Nama: ${customerName}
No. Telepon: ${customerPhone}
Alamat: ${customerAddress}

=== INFORMASI MOBIL ===
Nama Mobil: ${mobilName}
Merek: ${mobilMerek}

=== INFORMASI TRANSAKSI ===
Metode Pembayaran: ${formatPaymentMethod(transaksi.metode_pembayaran)}
Tanggal Transaksi: ${tanggalFormatted}
    `;
    alert(transaksiInfo);
}

async function saveTransaksi() {
    const form = document.getElementById('transaksiForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const transaksiId = document.getElementById('transaksiId').value;
    const transaksiData = {
        metode_pembayaran: document.getElementById('metodePembayaran').value,
        tanggal_dipesan: document.getElementById('tanggalTransaksi').value
    };
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/updatetransaksi/${transaksiId}`, {
            method: 'PUT',
            body: JSON.stringify(transaksiData)
        });
        
        if (response && response.ok) {
            showNotification('Transaksi berhasil diupdate', 'success');
            closeModal();
            await loadTransaksi(); // Refresh data
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Gagal menyimpan transaksi');
        }
    } catch (error) {
        console.error('Error saving transaksi:', error);
        showNotification(error.message || 'Gagal menyimpan transaksi', 'error');
    }
}

function closeModal() {
    document.getElementById('transaksiModal').classList.remove('is-active');
    document.getElementById('transaksiForm').reset();
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('transaksiTable').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // Remove existing classes
    notification.classList.remove('is-success', 'is-danger', 'is-warning', 'is-info');
    
    // Add appropriate class based on type
    switch(type) {
        case 'success':
            notification.classList.add('is-success');
            break;
        case 'error':
            notification.classList.add('is-danger');
            break;
        case 'warning':
            notification.classList.add('is-warning');
            break;
        default:
            notification.classList.add('is-info');
    }
    
    notificationText.textContent = message;
    notification.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').style.display = 'none';
}

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