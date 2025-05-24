// listUser.js
const API_BASE_URL = 'http://localhost:3000';

let allUsers = [];
let filteredUsers = [];
let isEditMode = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadAdminInfo();
    setupLogout();
    loadUsers();
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

async function loadUsers() {
    showLoading();
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/user`);
        
        if (response && response.ok) {
            const users = await response.json();
            allUsers = users;
            filteredUsers = users;
            displayUsers(users);
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Gagal memuat data user. Silakan refresh halaman.', 'error');
    } finally {
        hideLoading();
    }
}

function displayUsers(users) {
    const usersTable = document.getElementById('usersTable');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        usersTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    usersTable.style.display = 'block';
    
    const usersHTML = users.map((user, index) => {
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.nama || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.no_telepon || 'N/A'}</td>
                <td><span class="user-role ${roleClass}">${user.role || 'user'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="button is-small is-info" onclick="editUser(${user.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="button is-small is-danger" onclick="deleteUser(${user.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="button is-small is-link" onclick="viewUser(${user.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = usersHTML;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterUsers(searchTerm);
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
}

function searchUsers() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterUsers(searchTerm);
}

function filterUsers(searchTerm = '') {
    const roleFilter = document.getElementById('roleFilter').value;
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = searchTerm === '' || 
            (user.nama && user.nama.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.no_telepon && user.no_telepon.includes(searchTerm));
            
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    displayUsers(filteredUsers);
}

function filterByRole() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterUsers(searchTerm);
}

function setupModal() {
    const modal = document.getElementById('userModal');
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
    document.getElementById('modalTitle').textContent = 'Tambah User';
    document.getElementById('saveButtonText').textContent = 'Simpan';
    document.getElementById('passwordHelp').textContent = 'Password wajib diisi untuk user baru';
    document.getElementById('userPassword').required = true;
    
    // Reset form
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    // Show modal
    document.getElementById('userModal').classList.add('is-active');
}

async function editUser(userId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/${userId}`);
        
        if (response && response.ok) {
            const user = await response.json();
            
            isEditMode = true;
            document.getElementById('modalTitle').textContent = 'Edit User';
            document.getElementById('saveButtonText').textContent = 'Update';
            document.getElementById('passwordHelp').textContent = 'Kosongkan jika tidak ingin mengubah password';
            document.getElementById('userPassword').required = false;
            
            // Fill form with user data
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.nama || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userPhone').value = user.no_telepon || '';
            document.getElementById('userRole').value = user.role || 'user';
            document.getElementById('userAddress').value = user.alamat || '';
            document.getElementById('userPassword').value = '';
            
            // Show modal
            document.getElementById('userModal').classList.add('is-active');
        } else {
            throw new Error('User tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('Gagal memuat data user', 'error');
    }
}

async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (user && user.id === userData.id) {
        showNotification('Tidak dapat menghapus akun sendiri', 'error');
        return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus user "${user ? user.nama : 'Unknown'}"?`)) {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/delete-user/${userId}`, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                showNotification('User berhasil dihapus', 'success');
                await loadUsers(); // Refresh data
            } else {
                throw new Error('Gagal menghapus user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Gagal menghapus user', 'error');
        }
    }
}

function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        const userInfo = `
Detail User:

ID: ${user.id}
Nama: ${user.nama || 'N/A'}
Email: ${user.email || 'N/A'}
No. Telepon: ${user.no_telepon || 'N/A'}
Role: ${user.role || 'user'}
Alamat: ${user.alamat || 'N/A'}
        `;
        alert(userInfo);
    }
}

async function saveUser() {
    const form = document.getElementById('userForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userId = document.getElementById('userId').value;
    const userData = {
        nama: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        no_telepon: document.getElementById('userPhone').value.trim(),
        role: document.getElementById('userRole').value,
        alamat: document.getElementById('userAddress').value.trim()
    };
    
    const password = document.getElementById('userPassword').value.trim();
    if (password) {
        userData.password = password;
    }
    
    try {
        let response;
        
        if (isEditMode && userId) {
            response = await makeAuthenticatedRequest(`${API_BASE_URL}/edit-user/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            if (!password) {
                showNotification('Password wajib diisi untuk user baru', 'error');
                return;
            }
            response = await makeAuthenticatedRequest(`${API_BASE_URL}/register`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
        
        if (response && response.ok) {
            const message = isEditMode ? 'User berhasil diupdate' : 'User berhasil ditambahkan';
            showNotification(message, 'success');
            closeModal();
            await loadUsers(); // Refresh data
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Gagal menyimpan user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification(error.message || 'Gagal menyimpan user', 'error');
    }
}

function closeModal() {
    document.getElementById('userModal').classList.remove('is-active');
    document.getElementById('userForm').reset();
}

function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('usersTable').style.display = 'none';
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