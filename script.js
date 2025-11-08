// Configuration
const POKEMON_PER_PAGE = 20;
let currentOffset = 0;
let currentPage = 1;

// DOM elements
const pokemonListEl = document.getElementById('pokemon-list');
const paginationEl = document.getElementById('pagination');
const pokemonDetailEl = document.getElementById('pokemon-detail');
const searchInputEl = document.getElementById('search-input');
const searchBtnEl = document.getElementById('search-btn');
const clearSearchBtnEl = document.getElementById('clear-search-btn');

// Search state
let isSearchMode = false;
let searchResults = [];

// Fetch Pokemon list
async function fetchPokemonList(offset = 0) {
    try {
        pokemonListEl.innerHTML = '<div class="loading">Loading Pokémon...</div>';
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_PER_PAGE}&offset=${offset}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch Pokémon list');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        pokemonListEl.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        throw error;
    }
}

// Fetch Pokemon details
async function fetchPokemonDetail(name) {
    try {
        pokemonDetailEl.innerHTML = '<div class="loading">Loading details...</div>';
        pokemonDetailEl.classList.remove('hidden');
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch Pokémon details');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        pokemonDetailEl.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        throw error;
    }
}

// Display Pokemon list
function displayPokemonList(pokemonList) {
    pokemonListEl.innerHTML = '';
    
    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        
        card.innerHTML = `
            <h3>${pokemon.name}</h3>
            <button class="view-details-btn" data-name="${pokemon.name}">View Details</button>
        `;
        
        // Add click event to the button
        const button = card.querySelector('.view-details-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            viewPokemonDetails(pokemon.name);
        });
        
        pokemonListEl.appendChild(card);
    });
}

// Display Pokemon details
function displayPokemonDetail(pokemon) {
    pokemonDetailEl.innerHTML = `
        <div class="pokemon-detail-header">
            <div>
                <h2>${pokemon.name}</h2>
                <div class="info-item">
                    <span class="info-label">ID:</span>
                    <span class="info-value">#${pokemon.id}</span>
                </div>
            </div>
            <button class="close-btn" onclick="closePokemonDetail()">Close</button>
        </div>
        <div class="detail-content">
            <div class="detail-sprite">
                <img src="${pokemon.sprites.front_default || pokemon.sprites.other?.['official-artwork']?.front_default || ''}" 
                     alt="${pokemon.name}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="detail-info">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ID:</span>
                    <span class="info-value">#${pokemon.id}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Weight:</span>
                    <span class="info-value">${pokemon.weight / 10} kg</span>
                </div>
            </div>
        </div>
    `;
    
    pokemonDetailEl.classList.remove('hidden');
    
    // Scroll to details
    pokemonDetailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// View Pokemon details
async function viewPokemonDetails(name) {
    try {
        const pokemon = await fetchPokemonDetail(name);
        displayPokemonDetail(pokemon);
    } catch (error) {
        console.error('Error viewing Pokémon details:', error);
    }
}

// Close Pokemon details
function closePokemonDetail() {
    pokemonDetailEl.classList.add('hidden');
}

// Make closePokemonDetail available globally
window.closePokemonDetail = closePokemonDetail;

// Display pagination
function displayPagination(totalCount, currentOffset) {
    const totalPages = Math.ceil(totalCount / POKEMON_PER_PAGE);
    const currentPageNum = Math.floor(currentOffset / POKEMON_PER_PAGE) + 1;
    
    paginationEl.innerHTML = `
        <button ${currentOffset === 0 ? 'disabled' : ''} onclick="goToPage(${currentPageNum - 1})">Previous</button>
        <span>Page ${currentPageNum} of ${totalPages}</span>
        <button ${currentPageNum >= totalPages ? 'disabled' : ''} onclick="goToPage(${currentPageNum + 1})">Next</button>
    `;
}

// Go to specific page
async function goToPage(page) {
    // Don't paginate if in search mode
    if (isSearchMode) {
        return;
    }
    
    const offset = (page - 1) * POKEMON_PER_PAGE;
    currentOffset = offset;
    currentPage = page;
    
    try {
        const data = await fetchPokemonList(offset);
        displayPokemonList(data.results);
        displayPagination(data.count, offset);
        
        // Close details when navigating
        closePokemonDetail();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// Make goToPage available globally
window.goToPage = goToPage;

// Search Pokemon
async function searchPokemon(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return;
    }
    
    try {
        pokemonListEl.innerHTML = '<div class="loading">Searching Pokémon...</div>';
        paginationEl.innerHTML = '';
        
        const searchName = searchTerm.toLowerCase().trim();
        
        // Try to fetch the specific Pokemon
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchName}`);
            
            if (response.ok) {
                const pokemonData = await response.json();
                // Display single result
                const singleResult = {
                    name: pokemonData.name,
                    url: `https://pokeapi.co/api/v2/pokemon/${pokemonData.id}/`
                };
                displayPokemonList([singleResult]);
                isSearchMode = true;
                searchResults = [singleResult];
                clearSearchBtnEl.classList.remove('hidden');
                closePokemonDetail();
                return;
            }
        } catch (error) {
            // If specific Pokemon not found, try searching through list
        }
        
        // If exact match not found, search through the list
        // Fetch a large number of Pokemon to search through
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0`);
        const data = await response.json();
        
        // Filter Pokemon by name
        const filtered = data.results.filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchName)
        );
        
        if (filtered.length === 0) {
            pokemonListEl.innerHTML = '<div class="error">No Pokémon found matching your search.</div>';
            isSearchMode = false;
            clearSearchBtnEl.classList.add('hidden');
        } else {
            displayPokemonList(filtered);
            isSearchMode = true;
            searchResults = filtered;
            clearSearchBtnEl.classList.remove('hidden');
            closePokemonDetail();
        }
    } catch (error) {
        pokemonListEl.innerHTML = `<div class="error">Error searching Pokémon: ${error.message}</div>`;
        console.error('Error searching Pokémon:', error);
    }
}

// Clear search and return to normal view
function clearSearch() {
    searchInputEl.value = '';
    isSearchMode = false;
    searchResults = [];
    clearSearchBtnEl.classList.add('hidden');
    closePokemonDetail();
    
    // Reload the initial page
    goToPage(1);
}

// Event listeners for search
searchBtnEl.addEventListener('click', () => {
    const searchTerm = searchInputEl.value;
    searchPokemon(searchTerm);
});

searchInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const searchTerm = searchInputEl.value;
        searchPokemon(searchTerm);
    }
});

clearSearchBtnEl.addEventListener('click', clearSearch);

// Initialize app
async function init() {
    try {
        const data = await fetchPokemonList(0);
        displayPokemonList(data.results);
        displayPagination(data.count, 0);
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);

