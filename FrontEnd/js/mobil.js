// mobil.js
const API_BASE_URL = 'https://dealer-project-935996462481.us-central1.run.app'; // Sesuaikan dengan port backend Anda

let allProducts = [];
let filteredProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Setup logout functionality
    setupLogout();
    
    // Load products
    loadProducts();
    
    // Setup search functionality
    setupSearch();
    
    // Setup navbar burger for mobile
    setupNavbarBurger();
});

async function checkAuthentication() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verify token is still valid
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

async function loadProducts() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/mobil`);
        
        if (response.ok) {
            const products = await response.json();
            allProducts = products;
            filteredProducts = products;
            displayProducts(products);
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Gagal memuat data mobil. Silakan refresh halaman.');
    } finally {
        hideLoading();
    }
}

function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    const emptyState = document.getElementById('emptyState');
    
    if (products.length === 0) {
        productsList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const productsHTML = products.map((product, index) => `
        <div class="product-row">
            <div class="product-info">
                <div class="product-details">
                    <h4>${product.nama}</h4>
                    <p><strong>Merek:</strong> ${product.merek}</p>
                    <p><strong>Tahun:</strong> ${product.tahun_produksi}</p>
                </div>
                <div class="product-actions">
                    <div class="product-price">Rp ${formatCurrency(product.harga)}</div>
                    <div style="margin-top: 1rem;">
                        <button class="button is-info is-small" onclick="viewProductDetail(${product.id})" style="margin-right: 0.5rem;">
                            <i class="fas fa-eye"></i>&nbsp; Detail
                        </button>
                        <button class="button is-primary buy-button" onclick="buyProduct(${product.id})">
                            <i class="fas fa-shopping-cart"></i>&nbsp; Beli Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    productsList.innerHTML = productsHTML;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter(product => 
                product.nama.toLowerCase().includes(searchTerm) ||
                product.merek.toLowerCase().includes(searchTerm) ||
                product.tahun_produksi.toString().includes(searchTerm)
            );
        }
        
        displayProducts(filteredProducts);
    });
    
    // Add enter key support
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
}

function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = allProducts;
    } else {
        filteredProducts = allProducts.filter(product => 
            product.nama.toLowerCase().includes(searchTerm) ||
            product.merek.toLowerCase().includes(searchTerm) ||
            product.tahun_produksi.toString().includes(searchTerm)
        );
    }
    
    displayProducts(filteredProducts);
}

function viewProductDetail(productId) {
    // You can implement a modal or navigate to detail page
    // For now, let's show an alert with product details
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        alert(`Detail Mobil:\n\nNama: ${product.nama}\nMerek: ${product.merek}\nTahun: ${product.tahun_produksi}\nHarga: Rp ${formatCurrency(product.harga)}`);
    }
}

// Updated buyProduct function to redirect to form
function buyProduct(productId) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) {
        alert('Data user tidak ditemukan. Silakan login ulang.');
        return;
    }
    
    // Find the product to show confirmation
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        alert('Data mobil tidak ditemukan.');
        return;
    }
    
    // Show confirmation with product details
    const confirmMessage = `Apakah Anda yakin ingin membeli mobil ini?\n\nNama: ${product.nama}\nMerek: ${product.merek}\nTahun: ${product.tahun_produksi}\nHarga: Rp ${formatCurrency(product.harga)}`;
    
    if (confirm(confirmMessage)) {
        // Redirect to form with car ID as parameter
        window.location.href = `form.html?id=${productId}`;
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
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('productsList').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productsList').style.display = 'block';
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