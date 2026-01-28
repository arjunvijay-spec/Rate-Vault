// Wait for page load
document.addEventListener('DOMContentLoaded', function() {
    // Auth check
    if (!Session.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    initializePage();
});

let rateChart = null;

async function initializePage() {

async function initializePage() {
    const user = Session.getUser();
    document.getElementById('userName').textContent = user.name;
    
    try {
        await loadCurrencies();
        updateStats();
        loadRecentHistory();
        loadFavorites();
        await initChart();
    } catch (error) {
        console.error('Initialization error:', error);
        Toast.show('Failed to initialize dashboard', 'error');
    }
}

// Load currencies
async function loadCurrencies() {
    try {
        const currencies = await currencyAPI.getCurrencies();
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        Object.entries(currencies).forEach(([code, data]) => {
            const name = data.description || data.name || code;
            fromSelect.add(new Option(`${code} - ${name}`, code));
            toSelect.add(new Option(`${code} - ${name}`, code));
        });
        
        fromSelect.value = 'USD';
        toSelect.value = 'EUR';
    } catch (error) {
        console.error('Error loading currencies:', error);
        Toast.show('Failed to load currencies', 'error');
    }
}

// Convert currency
async function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    
    if (!amount || amount <= 0) {
        Toast.show('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        const result = await currencyAPI.convert(amount, from, to);
        
        document.getElementById('result').style.display = 'block';
        document.getElementById('resultAmount').textContent = 
            `${currencyAPI.getCurrencySymbol(to)} ${result.result.toFixed(2)}`;
        document.getElementById('resultRate').textContent = 
            `1 ${from} = ${result.rate.toFixed(4)} ${to}`;
        
        conversionHistory.add(result);
        updateStats();
        loadRecentHistory();
        updateChart(from, to);
        
        Toast.show('Conversion successful!', 'success');
    } catch (error) {
        Toast.show('Conversion failed: ' + error.message, 'error');
    }
}

// Swap currencies
function swapCurrencies() {
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    document.getElementById('fromCurrency').value = to;
    document.getElementById('toCurrency').value = from;
}

// Update stats
function updateStats() {
    const stats = conversionHistory.getStats();
    
    document.getElementById('totalConversions').textContent = stats.total;
    document.getElementById('todayConversions').textContent = stats.today;
    document.getElementById('weekConversions').textContent = stats.thisWeek;
    document.getElementById('totalFavorites').textContent = favoritesManager.getUserFavorites().length;
    document.getElementById('mostUsedPair').textContent = stats.mostUsedPair || '---';
}

// Load recent history
function loadRecentHistory() {
    const history = conversionHistory.getUserHistory().slice(0, 5);
    const container = document.getElementById('recentHistory');
    
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">No conversions yet</div>';
        return;
    }
    
    container.innerHTML = history.map(h => `
        <div class="history-item">
            <div>
                <strong>${h.amount.toFixed(2)} ${h.from} → ${h.result.toFixed(2)} ${h.to}</strong>
                <div style="font-size: 0.75rem; color: #CBD5E0; margin-top: 0.25rem;">
                    ${new Date(h.timestamp).toLocaleString()}
                </div>
            </div>
            <button onclick="deleteConversion('${h.id}')" style="background: none; border: none; color: #EF4444; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Delete conversion
function deleteConversion(id) {
    conversionHistory.delete(id);
    updateStats();
    loadRecentHistory();
    Toast.show('Conversion deleted', 'success');
}

// Load favorites
function loadFavorites() {
    const favorites = favoritesManager.getUserFavorites();
    const container = document.getElementById('favoritesList');
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-state">No favorites yet</div>';
        return;
    }
    
    container.innerHTML = favorites.map(f => `
        <div class="favorite-item">
            <div>
                <strong>${f.code}</strong>
                <div style="font-size: 0.75rem; color: #CBD5E0;">${f.name}</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="useFavorite('${f.code}')" class="badge" style="cursor: pointer; border: none;">
                    Use
                </button>
                <button onclick="removeFavorite('${f.code}')" style="background: none; border: none; color: #EF4444; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Add favorite
async function addFavoritePrompt() {
    const currencies = await currencyAPI.getCurrencies();
    const codes = Object.keys(currencies);
    
    const code = prompt('Enter currency code (e.g., USD, EUR, GBP):')?.toUpperCase();
    
    if (!code) return;
    
    if (!currencies[code]) {
        Toast.show('Invalid currency code', 'error');
        return;
    }
    
    const name = currencies[code].description || currencies[code].name || code;
    
    if (favoritesManager.add(code, name)) {
        loadFavorites();
        updateStats();
        Toast.show(`${code} added to favorites`, 'success');
    } else {
        Toast.show('Already in favorites', 'warning');
    }
}

// Remove favorite
function removeFavorite(code) {
    favoritesManager.remove(code);
    loadFavorites();
    updateStats();
    Toast.show('Removed from favorites', 'success');
}

// Use favorite
function useFavorite(code) {
    document.getElementById('toCurrency').value = code;
    document.getElementById('amount').focus();
    Toast.show(`Set target currency to ${code}`, 'success');
}

// Initialize chart
async function initChart() {
    const ctx = document.getElementById('rateChart');
    
    rateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Exchange Rate',
                data: [],
                borderColor: '#00C853',
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 31, 53, 0.9)',
                    titleColor: '#00C853',
                    bodyColor: '#FFFFFF',
                    borderColor: '#00C853',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#CBD5E0'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#CBD5E0'
                    }
                }
            }
        }
    });
    
    await updateChart('USD', 'EUR');
}

// Update chart
async function updateChart(from, to) {
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const start = startDate.toISOString().split('T')[0];
        
        const data = await currencyAPI.getTimeSeries(start, endDate, from, to);
        
        const dates = Object.keys(data.rates).sort();
        const rates = dates.map(date => data.rates[date][to]);
        
        rateChart.data.labels = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        rateChart.data.datasets[0].data = rates;
        rateChart.data.datasets[0].label = `${from}/${to}`;
        rateChart.update();
        
    } catch (error) {
        console.error('Chart update error:', error);
    }
}
