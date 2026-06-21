// ========== TRADING LOGIC ==========
class TradingEngine {
    constructor() {
        this.balance = Storage.getBalance();
        this.openTrades = Storage.getOpenTrades().map(t => ({
            ...t,
            currentPrice: t.entryPrice,
            unrealizedPnl: 0
        }));
        this.history = Storage.getHistory();
        this.pairData = new Map();
        this.currentPair = CONFIG.DEFAULT_PAIR;
        this.currentTF = CONFIG.DEFAULT_TF;
    }
    
    // ===== TRADE MANAGEMENT =====
    openTrade(symbol, side, amount, leverage, entryPrice, sl, tp) {
        if (amount > this.balance) {
            throw new Error('Insufficient balance');
        }
        if (amount < CONFIG.MIN_TRADE_AMOUNT) {
            throw new Error(`Minimum trade amount is $${CONFIG.MIN_TRADE_AMOUNT}`);
        }
        
        const positionSize = amount * leverage;
        const riskAmount = Math.abs(entryPrice - sl) / entryPrice * positionSize;
        const riskPct = (riskAmount / this.balance) * 100;
        
        if (riskPct > CONFIG.MAX_RISK_PCT) {
            throw new Error(`Risk exceeds ${CONFIG.MAX_RISK_PCT}% of balance`);
        }
        
        const trade = {
            id: Date.now(),
            symbol: symbol,
            side: side,
            entryPrice: entryPrice,
            sl: sl,
            tp: tp,
            leverage: leverage,
            initialMargin: amount,
            positionSize: positionSize,
            currentPrice: entryPrice,
            unrealizedPnl: 0,
            openTime: new Date().toLocaleString(),
            riskPct: riskPct
        };
        
        this.openTrades.push(trade);
        this.balance -= amount;
        this.persist();
        return trade;
    }
    
    closeTrade(id, reason = 'Manual') {
        const index = this.openTrades.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        const trade = this.openTrades[index];
        const finalPnl = trade.unrealizedPnl || 0;
        this.balance += trade.initialMargin + finalPnl;
        
        const closedTrade = {
            ...trade,
            exitPrice: trade.currentPrice,
            realizedPnl: finalPnl,
            closeReason: reason,
            closedAt: new Date().toLocaleString()
        };
        
        this.history.unshift(closedTrade);
        this.openTrades.splice(index, 1);
        this.persist();
        
        return closedTrade;
    }
    
    updateOpenTrades(prices) {
        let closedTrades = [];
        
        for (const trade of this.openTrades) {
            const price = prices[trade.symbol];
            if (!price) continue;
            
            trade.currentPrice = price;
            
            // Calculate PnL
            let pnlRaw = trade.side === 'LONG'
                ? (price - trade.entryPrice) / trade.entryPrice * trade.positionSize
                : (trade.entryPrice - price) / trade.entryPrice * trade.positionSize;
            trade.unrealizedPnl = pnlRaw;
            
            // Check SL/TP
            let closeReason = null;
            if (trade.side === 'LONG') {
                if (price <= trade.sl) closeReason = 'Stop Loss';
                else if (price >= trade.tp) closeReason = 'Take Profit';
            } else {
                if (price >= trade.sl) closeReason = 'Stop Loss';
                else if (price <= trade.tp) closeReason = 'Take Profit';
            }
            
            if (closeReason) {
                const closed = this.closeTrade(trade.id, closeReason);
                if (closed) closedTrades.push(closed);
            }
        }
        
        this.persist();
        return closedTrades;
    }
    
    // ===== ANALYSIS =====
    analyzePair(symbol, candles, ticker) {
        if (!candles || candles.length < 30) {
            return { signal: 'NEUTRAL', score: 50, entry: ticker.price, sl: 0, tp1: 0, rr: 0, atr: 0 };
        }
        
        const closes = candles.map(c => c.close);
        const price = ticker.price;
        
        // EMAs
        const ema9 = closes.slice(-9).reduce((a, b) => a + b, 0) / 9;
        const ema21 = closes.slice(-21).reduce((a, b) => a + b, 0) / 21;
        
        // RSI
        let gains = 0, losses = 0;
        for (let i = closes.length - 14; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        const rsi = avgGain + avgLoss === 0 ? 50 : 100 - (100 / (1 + (avgGain / avgLoss)));
        
        // MACD
        const macdLine = ema9 - ema21;
        
        // ATR
        const volatility = (Math.max(...closes.slice(-14)) - Math.min(...closes.slice(-14))) / price;
        const atr = volatility * price;
        
        // Score calculation
        let bullScore = 0, bearScore = 0;
        
        if (ema9 > ema21) bullScore += 28;
        else bearScore += 28;
        
        if (rsi < 35) bullScore += 28;
        else if (rsi > 65) bearScore += 28;
        
        if (macdLine > 0) bullScore += 22;
        else bearScore += 22;
        
        if (ticker.change24h > 1.2) bullScore += 12;
        else if (ticker.change24h < -1.2) bearScore += 12;
        
        const total = bullScore + bearScore;
        const finalScore = total ? (bullScore / total) * 100 : 50;
        
        const signalDir = finalScore >= 65 ? 'LONG' : (finalScore <= 35 ? 'SHORT' : 'NEUTRAL');
        const sl = signalDir === 'LONG' ? price - atr * 1.6 : price + atr * 1.6;
        const tp1 = signalDir === 'LONG' ? price + atr * 2.5 : price - atr * 2.5;
        const rr = Math.abs(tp1 - price) / Math.abs(price - sl);
        
        return {
            signal: signalDir,
            score: Math.round(finalScore),
            entry: price,
            sl: sl,
            tp1: tp1,
            rr: rr,
            atr: atr,
            rsi: rsi.toFixed(0),
            ema9: ema9,
            ema21: ema21,
            macd: macdLine
        };
    }
    
    // ===== PERSISTENCE =====
    persist() {
        Storage.persistAll(this.balance, this.openTrades, this.history);
    }
    
    reset() {
        this.balance = 10000;
        this.openTrades = [];
        this.history = [];
        this.persist();
    }
    
    // ===== GETTERS =====
    getBalance() { return this.balance; }
    getOpenTrades() { return this.openTrades; }
    getHistory() { return this.history; }
    
    getTotalPnL() {
        return this.openTrades.reduce((acc, t) => acc + (t.unrealizedPnl || 0), 0);
    }
    
    getWinRate() {
        const total = this.history.length;
        if (total === 0) return null;
        const wins = this.history.filter(t => t.realizedPnl > 0).length;
        return (wins / total) * 100;
    }
    
    getProfitFactor() {
        const grossProfit = this.history.filter(t => t.realizedPnl > 0)
            .reduce((acc, t) => acc + t.realizedPnl, 0);
        const grossLoss = Math.abs(this.history.filter(t => t.realizedPnl < 0)
            .reduce((acc, t) => acc + t.realizedPnl, 0));
        return grossLoss > 0 ? grossProfit / grossLoss : null;
    }
    
    getExpectancy() {
        const total = this.history.length;
        if (total === 0) return 0;
        return this.history.reduce((acc, t) => acc + t.realizedPnl, 0) / total;
    }
    
    getTodayPnL() {
        const today = new Date().toDateString();
        const todayTrades = this.history.filter(t => 
            new Date(t.closedAt).toDateString() === today
        );
        return todayTrades.reduce((acc, t) => acc + t.realizedPnl, 0);
    }
    
    getBestTrade() {
        if (this.history.length === 0) return null;
        return this.history.reduce((best, t) => 
            t.realizedPnl > best.realizedPnl ? t : best
        );
    }
}

// Global trading engine instance
let tradingEngine = null;

function initTradingEngine() {
    tradingEngine = new TradingEngine();
    return tradingEngine;
}
