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
        const tbody = document.getElementById('open-positions-body');
        const trades = this.engine.getOpenTrades();
        
        if (!trades.length) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: var(--text-secondary);">No open positions</td></tr>';
            return;
        }
        
        tbody.innerHTML = trades.map(t => `
            <tr>
                <td><strong>${t.symbol.replace('USDT', '')}</strong></td>
                <td class="${t.side === 'LONG' ? 'positive' : 'negative'}">${t.side}</td>
                <td>${Utils.formatPrice(t.entryPrice)}</td>
                <td>$${t.initialMargin}</td>
                <td class="accent-blue">${t.leverage}x</td>
                <td class="negative">${Utils.formatPrice(t.sl)}</td>
                <td class="positive">${Utils.formatPrice(t.tp)}</td>
                <td>${Utils.formatPrice(t.currentPrice)}</td>
                <td class="${t.unrealizedPnl >= 0 ? 'positive' : 'negative'}">
                    ${t.unrealizedPnl >= 0 ? '+' : ''}$${t.unrealizedPnl?.toFixed(2) || 0}
                </td>
                <td>
                    <button class="close-btn" onclick="uiManager.closeTrade(${t.id}, 'Manual')">✕ CLOSE</button>
                </td>
            </tr>
        `).join('');
    }
    
    renderHistory() {
        const tbody = document.getElementById('history-body');
        const history = this.engine.getHistory();
        
        if (!history.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-secondary);">No closed trades</td></tr>';
            return;
        }
        
        tbody.innerHTML = history.slice(0, 20).map(h => `
            <tr>
                <td>${h.closedAt}</td>
                <td><strong>${h.symbol.replace('USDT', '')}</strong></td>
                <td class="${h.side === 'LONG' ? 'positive' : 'negative'}">${h.side}</td>
                <td>${Utils.formatPrice(h.entryPrice)}</td>
                <td>${Utils.formatPrice(h.exitPrice)}</td>
                <td class="${h.realizedPnl >= 0 ? 'positive' : 'negative'}">
                    ${h.realizedPnl >= 0 ? '+' : ''}$${h.realizedPnl.toFixed(2)}
                </td>
                <td>${h.closeReason}</td>
            </tr>
        `).join('');
    }
    
    renderMetrics() {
        const wr = this.engine.getWinRate();
        const total = this.engine.getHistory().length;
        const pf = this.engine.getProfitFactor();
        const exp = this.engine.getExpectancy();
        const todayPnl = this.engine.getTodayPnL();
        const best = this.engine.getBestTrade();
        
        document.getElementById('metric-wr').textContent = wr !== null ? `${wr.toFixed(0)}%` : '--';
        document.getElementById('metric-total').textContent = total;
        document.getElementById('metric-pf').textContent = pf !== null ? pf.toFixed(2) : '--';
        document.getElementById('metric-exp').textContent = exp !== 0 ? `$${exp.toFixed(2)}` : '--';
        document.getElementById('metric-today-pnl').textContent = `$${todayPnl.toFixed(2)}`;
        document.getElementById('metric-today-pnl').className = `metric-value ${todayPnl >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('metric-best-trade').textContent = best ? `$${best.realizedPnl.toFixed(2)}` : '--';
    }
    
    updateHeader() {
        const balance = this.engine.getBalance();
        const totalPnl = this.engine.getTotalPnL();
        const wr = this.engine.getWinRate();
        
        document.getElementById('header-balance').textContent = 
            balance >= 10000 ? `$${Math.round(balance / 1000)}k` : `$${balance.toFixed(0)}`;
        document.getElementById('header-upnl').textContent = 
            `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`;
        document.getElementById('header-upnl').style.color = 
            totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        document.getElementById('header-winrate').textContent = 
            wr !== null ? `${wr.toFixed(0)}%` : '--';
    }
    
    updateOpenCount() {
        const count = this.engine.getOpenTrades().length;
        document.getElementById('open-count').textContent = count;
        const btn = document.querySelector('.tab-btn[data-tab="open"]');
        if (btn) btn.innerHTML = `📂 OPEN (${count})`;
    }
    
    updateCountdown() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        
        this.countdownInterval = setInterval(() => {
            const tfMs = {
                '1m': 60000,
                '5m': 300000,
                '15m': 900000,
                '1h': 3600000
            }[this.currentTF] || 300000;
            
            const now = Date.now();
            const nextCandle = Math.ceil(now / tfMs) * tfMs;
            const remain = nextCandle - now;
            const mins = Math.floor(remain / 60000);
            const secs = Math.floor((remain % 60000) / 1000);
            
            document.getElementById('countdown-display').textContent = `${mins}m ${secs}s`;
            const progress = ((tfMs - remain) / tfMs) * 100;
            document.getElementById('progress-fill').style.width = `${Math.min(100, progress)}%`;
        }, 200);
    }
    
    // ===== ACTIONS =====
    selectPair(symbol) {
        this.currentPair = symbol;
        this.renderPairList();
        if (this.pairData.has(symbol)) {
            this.renderSignalCard(symbol);
        }
    }
    
    changeTF(tf) {
        this.currentTF = tf;
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tf === tf);
        });
        // Trigger refresh
        if (this.onTFChange) this.onTFChange(tf);
    }
    
    openTradeModal(side) {
        const data = this.pairData.get(this.currentPair);
        if (!data) {
            this.toast('Data not ready', 'error');
            return;
        }
        
        const analysis = data.analysis;
        if (analysis.signal !== side && analysis.score < 60) {
            this.toast(`No ${side} signal for this pair`, 'error');
            return;
        }
        
        document.getElementById('modal-title').textContent = `Open ${side} ${this.currentPair}`;
        const modal = document.getElementById('trade-modal');
        modal.classList.add('open');
        
        // Update risk info
        const updateRisk = () => {
            const amount = parseFloat(document.getElementById('modal-amount').value) || 200;
            const lev = parseFloat(document.getElementById('modal-leverage').value);
            const positionSize = amount * lev;
            const riskAmount = Math.abs(analysis.entry - analysis.sl) / analysis.entry * positionSize;
            const riskPct = (riskAmount / this.engine.getBalance()) * 100;
            
            document.getElementById('modal-risk-info').innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span>Position Size:</span>
                    <span class="accent-blue">$${positionSize.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span>Risk Amount:</span>
                    <span class="negative">-$${riskAmount.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Risk % of Balance:</span>
                    <span style="color: ${riskPct > 10 ? '#ef4444' : riskPct > 5 ? '#f59e0b' : '#10b981'}">
                        ${riskPct.toFixed(1)}%
                    </span>
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: var(--text-secondary);">
                    ${riskPct > 20 ? '⚠️ High risk! Consider reducing size.' : ''}
                    ${analysis.signal === side ? '✅ Signal matches your trade direction' : '⚠️ Signal suggests opposite direction'}
                </div>
            `;
        };
        
        document.getElementById('modal-amount').oninput = updateRisk;
        document.getElementById('modal-leverage').onchange = updateRisk;
        updateRisk();
        
        // Confirm button
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.onclick = () => {
            const amount = parseFloat(document.getElementById('modal-amount').value);
            const lev = parseFloat(document.getElementById('modal-leverage').value);
            
            try {
                const trade = this.engine.openTrade(
                    this.currentPair,
                    side,
                    amount,
                    lev,
                    analysis.entry,
                    analysis.sl,
                    analysis.tp1
                );
                this.toast(`✅ ${side} ${this.currentPair} opened @ ${Utils.formatPrice(analysis.entry)}`, 'win');
                this.closeModal();
                this.refreshUI();
            } catch (e) {
                this.toast(e.message, 'error');
            }
        };
    }
    
    closeModal() {
        document.getElementById('trade-modal').classList.remove('open');
    }
    
    closeTrade(id, reason) {
        const closed = this.engine.closeTrade(id, reason);
        if (closed) {
            this.toast(
                `${closed.symbol} ${closed.side} closed: ${closed.realizedPnl >= 0 ? '+' : ''}$${closed.realizedPnl.toFixed(2)} (${reason})`,
                closed.realizedPnl >= 0 ? 'win' : 'loss'
            );
            this.refreshUI();
        }
    }
    
    resetAll() {
        if (confirm('⚠️ Reset all trading data? Balance will return to $10,000')) {
            this.engine.reset();
            this.toast('All data reset', 'info');
            this.refreshUI();
        }
    }
    
    // ===== TOAST =====
    toast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast';
        el.style.borderLeftColor = type === 'win' ? '#10b981' : type === 'loss' ? '#ef4444' : '#3b82f6';
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
    
    // ===== REFRESH =====
    refreshUI() {
        this.renderOpenTrades();
        this.renderHistory();
        this.renderMetrics();
        this.updateHeader();
        this.updateOpenCount();
        this.renderPairList();
        if (this.pairData.has(this.currentPair)) {
            this.renderSignalCard(this.currentPair);
        }
    }
}

// Global UI manager instance
let uiManager = null;

function initUI(engine) {
    uiManager = new UIManager(engine);
    return uiManager;
}
