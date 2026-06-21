// ========== STORAGE MANAGEMENT ==========
const Storage = {
    getBalance: () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE);
        return saved && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 10000;
    },
    
    setBalance: (balance) => {
        localStorage.setItem(CONFIG.STORAGE_KEYS.BALANCE, balance.toString());
    },
    
    getOpenTrades: () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.OPEN_TRADES);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },
    
    setOpenTrades: (trades) => {
        localStorage.setItem(CONFIG.STORAGE_KEYS.OPEN_TRADES, JSON.stringify(trades));
    },
    
    getHistory: () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },
    
    setHistory: (history) => {
        localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    },
    
    persistAll: (balance, trades, history) => {
        Storage.setBalance(balance);
        Storage.setOpenTrades(trades);
        Storage.setHistory(history);
    },
    
    clearAll: () => {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.BALANCE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.OPEN_TRADES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
    }
};
