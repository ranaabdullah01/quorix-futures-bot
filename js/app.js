// ========== MAIN APPLICATION ==========
class QuorixApp {
    constructor() {
        this.engine = null;
        this.ui = null;
        this.loading = new LoadingManager();
        this.tickInterval = null;
        this.signalInterval = null;
    }
    
    async init() {
        // Show loading screen
        this.loading.start();
        
        // Initialize engine
        this.engine = initTradingEngine();
        this.ui = initUI(this.engine);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start countdown
        this.ui.updateCountdown();
        
        // Initial data load
        await this.scanAllPairs();
        
        // Render initial UI
        this.ui.refreshUI();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Finish loading
        this.loading.finish();
    }
    
    async scanAllPairs() {
        const symbols = CONFIG.SYMBOLS;
        let completed = 0;
        const total = symbols.length;
        
        // Fetch all tickers first
        const tickers = await API.fetchAllTickers(symbols);
        
        // Process in batches
        const batchSize = 10;
        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (sym) => {
                try {
                    const candles = await API.fetchKlines(sym, this.ui.currentTF, 80);
                    const ticker = tickers[sym] || { price: 0, change24h: 0 };
                    
                    if (candles.length && ticker.price) {
                        const analysis = this.engine.analyzePair(sym, candles, ticker);
                        this.ui.pairData.set(sym, { candles, ticker, analysis });
                    }
                } catch (e) {
                    // Silent fail
                }
                
                completed++;
                const percent = (completed / total) * 100;
                this.loading.updateProgress(percent);
            }));
        }
    }
    
    setupEventListeners() {
        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.ui.searchQuery = e.target.value;
            this.ui.renderPairList();
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tabName = btn.dataset.tab;
                document.getElementById('tab-open').style.display = tabName === 'open' ? 'block' : 'none';
                document.getElementById('tab-history').style.display = tabName === 'history' ? 'block' : 'none';
                document.getElementById('tab-metrics').style.display = tabName === 'metrics' ? 'block' : 'none';
                
                if (tabName === 'metrics') {
                    this.ui.renderMetrics();
                }
            });
        });
        
        // Reset
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.ui.resetAll();
        });
        
        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tf = btn.dataset.tf;
                this.ui.changeTF(tf);
                // Re-scan with new timeframe
                this.scanAllPairs().then(() => {
                    this.ui.refreshUI();
                });
            });
        });
        
        // Modal close on background click
        document.getElementById('trade-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.ui.closeModal();
            }
        });
        
        // Escape key for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.ui.closeModal();
            }
        });
    }
    
    startPeriodicUpdates() {
        // Update open trades every 2 seconds
        this.tickInterval = setInterval(async () => {
            if (this.engine.getOpenTrades().length === 0) return;
            
            const symbols = this.engine.getOpenTrades().map(t => t.symbol);
            const prices = await API.fetchAllPrices(symbols);
            
            if (Object.keys(prices).length) {
                this.engine.updateOpenTrades(prices);
                this.ui.renderOpenTrades();
                this.ui.updateHeader();
                this.ui.updateOpenCount();
            }
        }, CONFIG.PRICE_UPDATE_INTERVAL);
        
        // Refresh signals every 10 seconds
        this.signalInterval = setInterval(async () => {
            // Only refresh visible data
            await this.scanAllPairs();
            this.ui.renderPairList();
            if (this.ui.pairData.has(this.ui.currentPair)) {
                this.ui.renderSignalCard(this.ui.currentPair);
            }
        }, CONFIG.SIGNAL_UPDATE_INTERVAL);
    }
    
    cleanup() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.signalInterval) clearInterval(this.signalInterval);
        if (this.ui.countdownInterval) clearInterval(this.ui.countdownInterval);
    }
}

// ========== BOOTSTRAP ==========
const app = new QuorixApp();

// Make UI available globally for onclick handlers
window.uiManager = null;

app.init().then(() => {
    window.uiManager = app.ui;
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});
