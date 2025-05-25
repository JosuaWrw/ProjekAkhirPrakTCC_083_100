// listMobil.js
const API_BASE_URL = 'http://localhost:3000';

let allMobil = [];
let filteredMobil = [];
let isEditMode = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadAdminInfo();
    setupLogout();
    loadMobil();
    setupSearch();
    setupModal();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!accessToken || userData.role !== 'admin') {
        localStorage.clear();
        window.location.href = '../login.html';
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
            window.location.href = '../login.html';
        }
    });
}

async function loadMobil() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/mobil`);
        
        if (response && response.ok) {
            const mobil = await response.json();
            allMobil = mobil;
            filteredMobil = mobil;
            populateMerekFilter(mobil);
            displayMobil(mobil);
        } else {
            throw new Error('Failed to load mobil');
        }
    } catch (error) {
        console.error('Error loading mobil:', error);
        showNotification('Gagal memuat data mobil. Silakan refresh halaman.', 'error');
    } finally {
        hideLoading();
    }
}

function populateMerekFilter(mobil) {
    const merekFilter = document.getElementById('merekFilter');
    const mereks = [...new Set(mobil.map(m => m.merek).filter(Boolean))];
    
    // Clear existing options except the first one
    merekFilter.innerHTML = '<option value="">Semua Merek</option>';
    
    mereks.forEach(merek => {
        const option = document.createElement('option');
        option.value = merek;
        option.textContent = merek;
        merekFilter.appendChild(option);
    });
}

function displayMobil(mobil) {
    const mobilTable = document.getElementById('mobilTable');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('mobilTableBody');
    
    if (mobil.length === 0) {
        mobilTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    mobilTable.style.display = 'block';
    
    const mobilHTML = mobil.map((m, index) => {
        const hargaFormatted = formatRupiah(m.harga);
        
        return `
            <tr>
                <td>${m.id}</td>
                <td>${m.nama || 'N/A'}</td>
                <td>${m.merek || 'N/A'}</td>
                <td>${m.tahun_produksi || 'N/A'}</td>
                <td><span class="price-display">${hargaFormatted}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="button is-small is-info" onclick="editMobil(${m.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="button is-small is-danger" onclick="deleteMobil(${m.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="button is-small is-link" onclick="viewMobil(${m.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = mobilHTML;
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

function formatRupiah(amount) {
    // Convert string to number using our custom function
    const numericAmount = convertPriceToNumber(amount);
    
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterMobil(searchTerm);
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMobil();
        }
    });
}

function searchMobil() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterMobil(searchTerm);
}

function filterMobil(searchTerm = '') {
    const merekFilter = document.getElementById('merekFilter').value;
    
    filteredMobil = allMobil.filter(mobil => {
        const matchesSearch = searchTerm === '' || 
            (mobil.nama && mobil.nama.toLowerCase().includes(searchTerm)) ||
            (mobil.merek && mobil.merek.toLowerCase().includes(searchTerm)) ||
            (mobil.tahun_produksi && mobil.tahun_produksi.toString().includes(searchTerm));
            
        const matchesMerek = merekFilter === '' || mobil.merek === merekFilter;
        
        return matchesSearch && matchesMerek;
    });
    
    displayMobil(filteredMobil);
}

function filterByMerek() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterMobil(searchTerm);
}

function setupModal() {
    const modal = document.getElementById('mobilModal');
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

function openAddModal() {
    isEditMode = false;
    document.getElementById('modalTitle').textContent = 'Tambah Mobil';
    document.getElementById('saveButtonText').textContent = 'Simpan';
    
    // Reset form
    document.getElementById('mobilForm').reset();
    document.getElementById('mobilId').value = '';
    
    // Show modal
    document.getElementById('mobilModal').classList.add('is-active');
}

async function editMobil(mobilId) {
    try {
        const response = await fetch(`${API_BASE_URL}/mobil/${mobilId}`);
        
        if (response && response.ok) {
            const mobil = await response.json();
            
            isEditMode = true;
            document.getElementById('modalTitle').textContent = 'Edit Mobil';
            document.getElementById('saveButtonText').textContent = 'Update';
            
            // Fill form with mobil data
            document.getElementById('mobilId').value = mobil.id;
            document.getElementById('mobilNama').value = mobil.nama || '';
            document.getElementById('mobilMerek').value = mobil.merek || '';
            document.getElementById('mobilTahun').value = mobil.tahun_produksi || '';
            document.getElementById('mobilHarga').value = mobil.harga || '';
            
            // Show modal
            document.getElementById('mobilModal').classList.add('is-active');
        } else {
            throw new Error('Mobil tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading mobil:', error);
        showNotification('Gagal memuat data mobil', 'error');
    }
}

async function deleteMobil(mobilId) {
    const mobil = allMobil.find(m => m.id === mobilId);
    
    if (confirm(`Apakah Anda yakin ingin menghapus mobil "${mobil ? mobil.nama : 'Unknown'}"?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/deletemobil/${mobilId}`, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                showNotification('Mobil berhasil dihapus', 'success');
                await loadMobil(); // Refresh data
            } else {
                throw new Error('Gagal menghapus mobil');
            }
        } catch (error) {
            console.error('Error deleting mobil:', error);
            showNotification('Gagal menghapus mobil', 'error');
        }
    }
}

function viewMobil(mobilId) {
    const mobil = allMobil.find(m => m.id === mobilId);
    if (mobil) {
        const mobilInfo = `
Detail Mobil:

ID: ${mobil.id}
Nama: ${mobil.nama || 'N/A'}
Merek: ${mobil.merek || 'N/A'}
Tahun Produksi: ${mobil.tahun_produksi || 'N/A'}
Harga: ${formatRupiah(mobil.harga)}
        `;
        alert(mobilInfo);
    }
}

async function saveMobil() {
    const form = document.getElementById('mobilForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const mobilId = document.getElementById('mobilId').value;
    const mobilData = {
        nama: document.getElementById('mobilNama').value.trim(),
        merek: document.getElementById('mobilMerek').value.trim(),
        tahun_produksi: document.getElementById('mobilTahun').value.trim(),
        harga: document.getElementById('mobilHarga').value.trim()
    };
    
    try {
        let response;
        
        if (isEditMode && mobilId) {
            response = await fetch(`${API_BASE_URL}/updatemobil/${mobilId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mobilData)
            });
        } else {
            response = await fetch(`${API_BASE_URL}/tambahmobil`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mobilData)
            });
        }
        
        if (response && response.ok) {
            const message = isEditMode ? 'Mobil berhasil diupdate' : 'Mobil berhasil ditambahkan';
            showNotification(message, 'success');
            closeModal();
            await loadMobil(); // Refresh data
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Gagal menyimpan mobil');
        }
    } catch (error) {
        console.error('Error saving mobil:', error);
        showNotification(error.message || 'Gagal menyimpan mobil', 'error');
    }
}

function closeModal() {
    document.getElementById('mobilModal').classList.remove('is-active');
    document.getElementById('mobilForm').reset();
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('mobilTable').style.display = 'none';
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
            window.location.href = '../login.html';
            return null;
        }
    }
    
    return response;
}