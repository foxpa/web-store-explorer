// 0. DOM Element Selections
const searchInput = document.querySelector('#search-input');
const searchBtn = document.querySelector('#search-btn');
const fetchBtn = document.querySelector('#fetch-btn');
const statusMessage = document.querySelector('#status-message');
const favCounter = document.querySelector('#fav-counter');
const resultsGrid = document.querySelector('#results-grid');
const favoritesList = document.querySelector('#favorites-list');

// 1. Centralized State Object
const state = {
    items: [],      // Filtered products currently displayed
    allItems: [],   // Master cache of products from API
    favorites: [],  // Saved user bookmarks
    loading: false,
    error: null
};

const API_URL = 'https://fakestoreapi.com/products?limit=8';
const STORAGE_KEY = 'user_store_favs_v1';

// 2. Asynchronous Fetch with 3-Step Recipe
async function fetchItems() {
    state.loading = true;
    state.error = null;
    render();
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = await response.json();
        state.allItems = data;
        state.items = data;
    } catch (err) {
        state.error = 'Failed to load products. Check your connection.';
    } finally {
        state.loading = false;
        render();
    }
}

// 3. Search and Filter Handler
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    state.items = query
        ? state.allItems.filter(item => item.title.toLowerCase().includes(query))
        : [...state.allItems];
    render();
}

// 4. Data-First Render Function
function render() {
    // Update status messages (keep single-line strings!)
    statusMessage.textContent = state.loading
        ? 'Loading products...'
        : (state.error ? `⚠ ${state.error}` : '');
    
    favCounter.textContent = state.favorites.length;

    // Render Available Products
    resultsGrid.innerHTML = state.items.length === 0 && !state.loading
        ? '<p>No items found matching search.</p>'
        : state.items.map(item => {
            const isFav = state.favorites.some(f => f.id === item.id);
            return `
                <div class='card'>
                    <h4>${item.title.slice(0, 35)}...</h4>
                    <p style='color:#059669; font-weight:bold;'>$${Number(item.price).toFixed(2)}</p>
                    <button data-action='add-fav' data-id='${item.id}' ${isFav ? 'disabled' : ''}>
                        ${isFav ? 'Favorited' : 'Favorite'}
                    </button>
                </div>
            `;
        }).join('');

    // Render Favorites List
    favoritesList.innerHTML = state.favorites.map(fav => `
        <div class='fav-card'>
            <span>${fav.title}</span>
            <button data-action='remove-fav' data-id='${fav.id}'>Remove</button>
        </div>
    `).join('');
}

// 5. State Mutations & Persistence
function addFavorite(id) {
    const product = state.allItems.find(item => item.id === id);
    if (product && !state.favorites.some(fav => fav.id === id)) {
        state.favorites.push(product);
        saveFavorites();
        render();
    }
}

function removeFavorite(id) {
    state.favorites = state.favorites.filter(fav => fav.id !== id);
    saveFavorites();
    render();
}

function saveFavorites() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites));
    } catch (err) {
        console.error('Failed to save favorites:', err);
    }
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        state.favorites = saved ? JSON.parse(saved) : [];
    } catch (err) {
        console.warn('Corrupt storage data. Resetting favorites.');
        state.favorites = [];
    }
}

// 6. Event Delegation & Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    searchBtn.addEventListener('click', handleSearch);
    fetchBtn.addEventListener('click', () => {
        searchInput.value = '';
        fetchItems();
    });

    // Event delegation on static parent containers
    resultsGrid.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'add-fav') {
            addFavorite(Number(e.target.dataset.id));
        }
    });

    favoritesList.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'remove-fav') {
            removeFavorite(Number(e.target.dataset.id));
        }
    });
}

// 7. Application Initialization Sequence
function init() {
    setupEventListeners(); // Wire clicks & inputs
    loadFavorites();       // 1. Rehydrate storage from disk
    render();              // 2. Render initial cached favorites
    fetchItems();          // 3. Fetch live remote records
}

init();