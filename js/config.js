// ========== CONFIGURATION ==========
const CONFIG = {
    // Trading pairs (50+ assets)
    SYMBOLS: [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT',
        'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'UNIUSDT', 'ATOMUSDT', 'LTCUSDT',
        'NEARUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'FILUSDT', 'EGLDUSDT', 'AAVEUSDT',
        'XTZUSDT', 'THETAUSDT', 'EOSUSDT', 'KSMUSDT', 'ZECUSDT', 'XLMUSDT', 'TRXUSDT',
        'ARBUSDT', 'OPUSDT', 'IMXUSDT', 'MKRUSDT', 'CRVUSDT', 'SUSHIUSDT', 'COMPUSDT',
        '1INCHUSDT', 'SNXUSDT', 'RUNEUSDT', 'FLOWUSDT', 'STXUSDT', 'SANDUSDT', 'MANAUSDT',
        'GALAUSDT', 'AXSUSDT', 'ENJUSDT', 'ILVUSDT', 'YGGUSDT', 'APEUSDT', 'MAGICUSDT',
        'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT',
        'INJUSDT', 'TIAUSDT', 'SEIUSDT', 'SUIUSDT', 'APTUSDT', 'ARUSDT', 'RNDRUSDT',
        'FETUSDT', 'AGIXUSDT', 'OCEANUSDT'
    ],
    
    TIMEFRAMES: ['1m', '5m', '15m', '1h'],
    DEFAULT_TF: '5m',
    DEFAULT_PAIR: 'BTCUSDT',
    
    // Risk parameters
    MAX_RISK_PCT: 25,
    MIN_TRADE_AMOUNT: 10,
    DEFAULT_AMOUNT: 200,
    DEFAULT_LEVERAGE: 10,
    
    // Update intervals (ms)
    PRICE_UPDATE_INTERVAL: 2000,
    SIGNAL_UPDATE_INTERVAL: 10000,
    COUNTDOWN_INTERVAL: 200,
    
    // API endpoints
    BINANCE_FUTURES_API: 'https://fapi.binance.com/fapi/v1',
    BINANCE_SPOT_API: 'https://api.binance.com/api/v3',
    
    // Storage keys
    STORAGE_KEYS: {
        BALANCE: 'quorix_balance',
        OPEN_TRADES: 'quorix_open_trades',
        HISTORY: 'quorix_history'
    }
};

// ========== LOADING MESSAGES ==========
const LOADING_MESSAGES = [
    { emoji: '🔮', text: 'Consulting the crypto crystal ball...' },
    { emoji: '🤖', text: 'Training the trading AI with memes...' },
    { emoji: '📊', text: 'Drawing lines that definitely mean something...' },
    { emoji: '🦄', text: 'Searching for the next 100x gem...' },
    { emoji: '☕', text: 'Brewing fresh market analysis...' },
    { emoji: '🚀', text: 'Preparing for moon mission...' },
    { emoji: '🐶', text: 'Asking Doge for financial advice...' },
    { emoji: '🧠', text: 'Using 100% of the brain (finally)...' },
    { emoji: '📈', text: 'Making lines go up (we hope)...' },
    { emoji: '🎲', text: 'Rolling the crypto dice...' },
    { emoji: '🌊', text: 'Riding the volatility wave...' },
    { emoji: '🤑', text: 'Counting imaginary profits...' },
    { emoji: '🤡', text: 'Pretending to know what we\'re doing...' },
    { emoji: '🎯', text: 'Aiming for the moon, landing on Mars...' },
    { emoji: '💎', text: 'Checking diamond hands status...' },
    { emoji: '🔄', text: 'Buying high, selling low... just kidding!' },
    { emoji: '🧘', text: 'Meditating on the candlesticks...' },
    { emoji: '⚡', text: 'Channeling Elon\'s energy...' },
    { emoji: '🎭', text: 'Watching the market drama unfold...' },
    { emoji: '🍿', text: 'Grab popcorn, market is volatile!' },
    { emoji: '🤞', text: 'Crossing fingers for green candles...' },
    { emoji: '🏦', text: 'Bribing the market experts...' },
    { emoji: '📚', text: 'Reading the crypto textbook we didn\'t write...' },
    { emoji: '🧪', text: 'Mixing technical analysis with chaos...' },
    { emoji: '🎪', text: 'Welcome to the crypto circus!' },
    { emoji: '🔥', text: 'Everything is fine. This is fine.' },
    { emoji: '💀', text: 'YOLO-ing into the next trade...' },
    { emoji: '📉', text: 'Making lines go down (oops)...' },
];

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    formatPrice: (p) => p ? `$${p.toLocaleString(undefined, {minimumFractionDigits: p < 1 ? 4 : 2})}` : '--',
    formatShort: (p) => p ? `$${p.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : '--',
    formatPercent: (p) => p !== undefined ? `${p > 0 ? '+' : ''}${p.toFixed(2)}%` : '--',
    formatVolume: (v) => {
        if (!v) return '--';
        if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
        return `$${v.toFixed(2)}`;
    },
    truncate: (num, decimals = 2) => {
        if (!num) return 0;
        return Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    randomBetween: (min, max) => Math.random() * (max - min) + min,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
