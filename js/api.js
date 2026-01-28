/* ═══════════════════════════════════════════════════════════════════════
   EXCHANGERATE API INTEGRATION - FIXED VERSION
   ═══════════════════════════════════════════════════════════════════════ */

class CurrencyAPI {
    constructor() {
        // Using exchangerate-api.com - FREE, no key needed
        this.baseURL = 'https://open.er-api.com/v6';
        this.cacheKey = 'rv_cache';
        this.cacheExpiry = 3600000; // 1 hour
    }
    
    getCachedData(key) {
        const cache = Storage.get(this.cacheKey) || {};
        const cached = cache[key];
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }
    
    setCachedData(key, data) {
        const cache = Storage.get(this.cacheKey) || {};
        cache[key] = {
            data: data,
            timestamp: Date.now()
        };
        Storage.set(this.cacheKey, cache);
    }
    
    // Get all available currencies
    async getCurrencies() {
        const cacheKey = 'currencies';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(`${this.baseURL}/latest/USD`);
            const result = await response.json();
            
            if (result.result !== 'success') {
                throw new Error('Failed to fetch currencies');
            }
            
            // Convert rates object to currencies format
            const currencies = {};
            Object.keys(result.rates).forEach(code => {
                currencies[code] = {
                    code: code,
                    name: this.getCurrencyName(code)
                };
            });
            
            this.setCachedData(cacheKey, currencies);
            return currencies;
        } catch (error) {
            console.error('Currency fetch error:', error);
            return this.getFallbackCurrencies();
        }
    }
    
    // Get latest exchange rates
    async getLatestRates(baseCurrency = 'USD') {
        const cacheKey = `rates_${baseCurrency}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(`${this.baseURL}/latest/${baseCurrency}`);
            const result = await response.json();
            
            if (result.result !== 'success') {
                throw new Error('Failed to fetch rates');
            }
            
            this.setCachedData(cacheKey, result.rates);
            return result.rates;
        } catch (error) {
            console.error('Rates fetch error:', error);
            throw error;
        }
    }
    
    // Convert currency
    async convert(amount, from, to) {
        if (from === to) {
            return {
                amount: amount,
                from: from,
                to: to,
                rate: 1,
                result: amount,
                date: new Date().toISOString().split('T')[0]
            };
        }
        
        try {
            const response = await fetch(`${this.baseURL}/latest/${from}`);
            const result = await response.json();
            
            if (result.result !== 'success') {
                throw new Error('Conversion failed');
            }
            
            const rate = result.rates[to];
            
            if (!rate) {
                throw new Error('Currency not supported');
            }
            
            const convertedAmount = amount * rate;
            
            return {
                amount: amount,
                from: from,
                to: to,
                rate: rate,
                result: convertedAmount,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Conversion error:', error);
            throw error;
        }
    }
    
    // Get time series data (simulated for free API)
    async getTimeSeries(startDate, endDate, baseCurrency = 'USD', targetCurrency = 'EUR') {
        try {
            // For free API, we'll simulate historical data
            const rates = {};
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Get current rate
            const currentData = await fetch(`${this.baseURL}/latest/${baseCurrency}`);
            const currentResult = await currentData.json();
            const currentRate = currentResult.rates[targetCurrency];
            
            // Generate simulated historical data
            let currentDate = new Date(start);
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                // Add random variance (+/- 5%)
                const variance = 0.95 + Math.random() * 0.1;
                rates[dateStr] = {
                    [targetCurrency]: currentRate * variance
                };
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return {
                success: true,
                base: baseCurrency,
                rates: rates
            };
        } catch (error) {
            console.error('Time series error:', error);
            throw error;
        }
    }
    
    // Get currency symbol
    getCurrencySymbol(code) {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'INR': '₹', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr',
            'CNY': '¥', 'BRL': 'R$', 'MXN': '$', 'RUB': '₽',
            'KRW': '₩', 'ZAR': 'R', 'SGD': 'S$', 'HKD': 'HK$',
            'NOK': 'kr', 'SEK': 'kr', 'DKK': 'kr', 'PLN': 'zł',
            'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱',
            'NZD': 'NZ$', 'TRY': '₺', 'AED': 'د.إ', 'SAR': '﷼'
        };
        return symbols[code] || code;
    }
    
    // Get currency name
    getCurrencyName(code) {
        const names = {
            'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound',
            'JPY': 'Japanese Yen', 'AUD': 'Australian Dollar',
            'CAD': 'Canadian Dollar', 'CHF': 'Swiss Franc',
            'CNY': 'Chinese Yuan', 'INR': 'Indian Rupee',
            'MXN': 'Mexican Peso', 'BRL': 'Brazilian Real',
            'ZAR': 'South African Rand', 'SGD': 'Singapore Dollar',
            'HKD': 'Hong Kong Dollar', 'NOK': 'Norwegian Krone',
            'SEK': 'Swedish Krona', 'DKK': 'Danish Krone',
            'PLN': 'Polish Zloty', 'THB': 'Thai Baht',
            'MYR': 'Malaysian Ringgit', 'IDR': 'Indonesian Rupiah',
            'PHP': 'Philippine Peso', 'NZD': 'New Zealand Dollar',
            'TRY': 'Turkish Lira', 'RUB': 'Russian Ruble',
            'KRW': 'South Korean Won', 'AED': 'UAE Dirham',
            'SAR': 'Saudi Riyal'
        };
        return names[code] || code;
    }
    
    // Fallback currencies
    getFallbackCurrencies() {
        const codes = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR'];
        const currencies = {};
        codes.forEach(code => {
            currencies[code] = {
                code: code,
                name: this.getCurrencyName(code)
            };
        });
        return currencies;
    }
    
    // Get popular currency pairs
    getPopularPairs() {
        return [
            { from: 'USD', to: 'EUR', name: 'US Dollar to Euro' },
            { from: 'USD', to: 'GBP', name: 'US Dollar to British Pound' },
            { from: 'USD', to: 'JPY', name: 'US Dollar to Japanese Yen' },
            { from: 'EUR', to: 'USD', name: 'Euro to US Dollar' },
            { from: 'GBP', to: 'USD', name: 'British Pound to US Dollar' },
            { from: 'USD', to: 'INR', name: 'US Dollar to Indian Rupee' },
            { from: 'USD', to: 'CAD', name: 'US Dollar to Canadian Dollar' },
            { from: 'USD', to: 'AUD', name: 'US Dollar to Australian Dollar' }
        ];
    }
}

// Conversion History
class ConversionHistory {
    constructor() {
        this.key = 'rv_history';
    }
    
    add(conversion) {
        const history = this.getAll();
        const entry = {
            id: 'conv_' + Date.now(),
            userId: Session.getUser()?.id,
            ...conversion,
            timestamp: new Date().toISOString()
        };
        history.unshift(entry);
        
        if (history.length > 100) history.splice(100);
        
        Storage.set(this.key, history);
        return entry;
    }
    
    getAll() {
        return Storage.get(this.key) || [];
    }
    
    getUserHistory() {
        const userId = Session.getUser()?.id;
        return this.getAll().filter(h => h.userId === userId);
    }
    
    delete(id) {
        const history = this.getAll().filter(h => h.id !== id);
        Storage.set(this.key, history);
    }
    
    clear() {
        const userId = Session.getUser()?.id;
        const history = this.getAll().filter(h => h.userId !== userId);
        Storage.set(this.key, history);
    }
    
    getStats() {
        const history = this.getUserHistory();
        const stats = {
            total: history.length,
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            mostUsedPair: null,
            totalAmount: 0
        };
        
        if (history.length === 0) return stats;
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const pairs = {};
        
        history.forEach(h => {
            const date = new Date(h.timestamp);
            if (date >= todayStart) stats.today++;
            if (date >= weekStart) stats.thisWeek++;
            if (date >= monthStart) stats.thisMonth++;
            
            const pair = `${h.from}/${h.to}`;
            pairs[pair] = (pairs[pair] || 0) + 1;
            
            if (h.from === 'USD') {
                stats.totalAmount += h.amount;
            }
        });
        
        if (Object.keys(pairs).length > 0) {
            stats.mostUsedPair = Object.keys(pairs).reduce((a, b) => 
                pairs[a] > pairs[b] ? a : b
            );
        }
        
        return stats;
    }
}

// Favorites Manager
class FavoritesManager {
    constructor() {
        this.key = 'rv_favorites';
    }
    
    add(code, name) {
        const favorites = this.getAll();
        const userId = Session.getUser()?.id;
        
        if (favorites.some(f => f.code === code && f.userId === userId)) {
            return false;
        }
        
        favorites.push({
            id: 'fav_' + Date.now(),
            userId: userId,
            code: code,
            name: name,
            addedAt: new Date().toISOString()
        });
        
        Storage.set(this.key, favorites);
        return true;
    }
    
    remove(code) {
        const userId = Session.getUser()?.id;
        const favorites = this.getAll().filter(f => !(f.code === code && f.userId === userId));
        Storage.set(this.key, favorites);
    }
    
    getAll() {
        return Storage.get(this.key) || [];
    }
    
    getUserFavorites() {
        const userId = Session.getUser()?.id;
        return this.getAll().filter(f => f.userId === userId);
    }
    
    isFavorite(code) {
        const userId = Session.getUser()?.id;
        return this.getAll().some(f => f.code === code && f.userId === userId);
    }
}

// Initialize
const currencyAPI = new CurrencyAPI();
const conversionHistory = new ConversionHistory();
const favoritesManager = new FavoritesManager();

window.currencyAPI = currencyAPI;
window.conversionHistory = conversionHistory;
window.favoritesManager = favoritesManager;
