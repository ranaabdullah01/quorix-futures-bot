// ========== UI FUNCTIONS ==========
class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.currentPair = CONFIG.DEFAULT_PAIR;
        this.currentTF = CONFIG.DEFAULT_TF;
        this.searchQuery = '';
        this.pairData = new Map();
        this.countdownInterval = null;
    }
    
    // ===== RENDER FUNCTIONS =====
    renderPairList() {
        const container = document.getElementById('pair-list-container');
        const filteredSymbols = CONFIG.SYMBOLS.filter(sym => 
            sym.toLowerCase().replace('usdt', '').includes(this.searchQuery.toLowerCase()) ||
            sym.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        
        if (filteredSymbols.length === 0) {
            container.innerHTML = '<div class="no-results">🔍 No matching assets found</div>';
            return;
        }
        
        container.innerHTML = filteredSymbols.map(sym => {
            const data = this.pairData.get(sym);
            const ticker = data?.ticker || { price: 0, change24h: 0 };
            const analysis = data?.analysis || { signal: 'NEUTRAL', score: 0 };
            const isActive = this.currentPair === sym;
            
            return `
                <div class="pair-row ${isActive ? 'active' : ''}" onclick="uiManager.selectPair('${sym}')">
                    <div class="pair-info">
                        <div class="pair-symbol">${sym.replace('USDT', '')}</div>
                        <div class="pair-price">${Utils.formatShort(ticker.price)}</div>
                        <div class="pair-change ${ticker.change24h >= 0 ? 'positive' : 'negative'}">
                            ${ticker.change24h >= 0 ? '+' : ''}${ticker.change24h.toFixed(2)}%
                        </div>
                    </div>
                    <span class="signal-badge ${analysis.signal === 'LONG' ? 'sig-long' : analysis.signal === 'SHORT' ? 'sig-short' : 'sig-neutral'}">
                        ${analysis.signal} ${analysis.score}
                    </span>
                </div>
            `;
        }).join('');
    }
    
    renderSignalCard(symbol) {
        const data = this.pairData.get(symbol);
        if (!data) return;
        
        const analysis = data.analysis;
        const ticker = data.ticker;
        
        // Basic info
        document.getElementById('signal-pair-name').textContent = symbol.replace('USDT', '/USDT');
        document.getElementById('signal-meta').innerHTML = `
            24h: <span class="${ticker.change24h >= 0 ? 'positive' : 'negative'}">
                ${ticker.change24h >= 0 ? '+' : ''}${ticker.change24h.toFixed(2)}%
            </span> | 
            H: ${Utils.formatShort(ticker.high24h)} | 
            L: ${Utils.formatShort(ticker.low24h)}
        `;
        
        // Score ring
        const score = analysis.score || 0;
        document.getElementById('score-value').textContent = score;
        const circumference = 150.8;
        const offset = circumference - (score / 100) * circumference;
        const ring = document.getElementById('score-ring-path');
        ring.style.strokeDashoffset = offset;
        ring.style.stroke = analysis.signal === 'LONG' ? '#10b981' : 
                           analysis.signal === 'SHORT' ? '#ef4444' : '#f59e0b';
        
        // Signal direction
        const dirEl = document.getElementById('signal-direction');
        dirEl.textContent = analysis.signal;
        dirEl.className = 'signal-direction ' + analysis.signal.toLowerCase();
        
        document.getElementById('signal-confidence').textContent = 
            `Score ${score} | ${score > 70 ? 'High' : score > 50 ? 'Medium' : 'Low'} Confidence`;
        
        // Analysis
        document.getElementById('signal-analysis').innerHTML = `
            📊 RSI: ${analysis.rsi || '--'} | 
            R/R: 1:${analysis.rr ? analysis.rr.toFixed(2) : '--'} | 
            ATR: $${analysis.atr ? analysis.atr.toFixed(2) : '0'}
            ${analysis.signal === 'LONG' ? '🟢 Bullish Divergence Detected' : ''}
            ${analysis.signal === 'SHORT' ? '🔴 Bearish Divergence Detected' : ''}
        `;
        
        // Levels
        document.getElementById('level-entry').textContent = Utils.formatPrice(analysis.entry);
        document.getElementById('level-entry').className = 'level-value positive';
        
        document.getElementById('level-sl').textContent = Utils.formatPrice(analysis.sl);
        document.getElementById('level-sl').className = 'level-value negative';
        
        document.getElementById('level-tp').textContent = Utils.formatPrice(analysis.tp1);
        document.getElementById('level-tp').className = 'level-value positive';
        
        document.getElementById('level-rr').textContent = analysis.rr ? `1:${analysis.rr.toFixed(2)}` : '--';
        document.getElementById('level-rr').className = 'level-value neutral';
        
        // Trade buttons
        const canLong = analysis.signal === 'LONG' && analysis.score >= 60;
        const canShort = analysis.signal === 'SHORT' && analysis.score >= 60;
        document.getElementById('trade-buttons-container').innerHTML = `
            <button class="btn-long ${!canLong ? 'btn-disabled' : ''}" 
                    onclick="${canLong ? `uiManager.openTradeModal('LONG')` : ''}">
                ▲ LONG ${analysis.signal === 'LONG' ? '✅' : ''}
            </button>
            <button class="btn-short ${!canShort ? 'btn-disabled' : ''}" 
                    onclick="${canShort ? `uiManager.openTradeModal('SHORT')` : ''}">
                ▼ SHORT ${analysis.signal === 'SHORT' ? '✅' : ''}
            </button>
        `;
    }
    
    renderOpenTrades() {
        const tbody = document.getElementById('open-positions-body
