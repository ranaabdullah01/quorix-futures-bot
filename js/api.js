// ========== API FUNCTIONS ==========
const API = {
    async fetchPrice(symbol) {
        try {
            const response = await fetch(`${CONFIG.BINANCE_FUTURES_API}/ticker/price?symbol=${symbol}`);
            const data = await response.json();
            return parseFloat(data.price);
        } catch (e) {
            console.error(`Failed to fetch price for ${symbol}:`, e);
            return null;
        }
    },
    
    async fetchTicker(symbol) {
        try {
            const [priceRes, changeRes] = await Promise.all([
                fetch(`${CONFIG.BINANCE_FUTURES_API}/ticker/price?symbol=${symbol}`),
                fetch(`${CONFIG.BINANCE_FUTURES_API}/ticker/24hr?symbol=${symbol}`)
            ]);
            const priceData = await priceRes.json();
            const changeData = await changeRes.json();
            return {
                price: parseFloat(priceData.price),
                change24h: parseFloat(changeData.priceChangePercent || 0),
                high24h: parseFloat(changeData.highPrice || 0),
                low24h: parseFloat(changeData.lowPrice || 0),
                volume: parseFloat(changeData.volume || 0)
            };
        } catch (e) {
            console.error(`Failed to fetch ticker for ${symbol}:`, e);
            return { price: 0, change24h: 0, high24h: 0, low24h: 0, volume: 0 };
        }
    },
    
    async fetchKlines(symbol, interval = '5m', limit = 80) {
        try {
            const response = await fetch(
                `${CONFIG.BINANCE_FUTURES_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
            );
            const data = await response.json();
            if (!Array.isArray(data)) return [];
            return data.map(k => ({
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
                time: parseInt(k[0])
            }));
        } catch (e) {
            console.error(`Failed to fetch klines for ${symbol}:`, e);
            return [];
        }
    },
    
    async fetchAllPrices(symbols) {
        try {
            const response = await fetch(`${CONFIG.BINANCE_FUTURES_API}/ticker/price`);
            const data = await response.json();
            const priceMap = {};
            data.forEach(item => {
                if (symbols.includes(item.symbol)) {
                    priceMap[item.symbol] = parseFloat(item.price);
                }
            });
            return priceMap;
        } catch (e) {
            console.error('Failed to fetch all prices:', e);
            return {};
        }
    },
    
    async fetchAllTickers(symbols) {
        try {
            const response = await fetch(`${CONFIG.BINANCE_FUTURES_API}/ticker/24hr`);
            const data = await response.json();
            const tickerMap = {};
            data.forEach(item => {
                if (symbols.includes(item.symbol)) {
                    tickerMap[item.symbol] = {
                        price: parseFloat(item.lastPrice),
                        change24h: parseFloat(item.priceChangePercent || 0),
                        high24h: parseFloat(item.highPrice || 0),
                        low24h: parseFloat(item.lowPrice || 0),
                        volume: parseFloat(item.volume || 0)
                    };
                }
            });
            return tickerMap;
        } catch (e) {
            console.error('Failed to fetch all tickers:', e);
            return {};
        }
    }
};
