// ========== LOADING SCREEN ==========
class LoadingManager {
    constructor() {
        this.isComplete = false;
        this.interval = null;
    }
    
    start() {
        this.isComplete = false;
        this.updateMessage();
        this.interval = setInterval(() => this.updateMessage(), 3000);
        this.updateProgress(0);
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }
    
    updateMessage() {
        if (this.isComplete) return;
        const msgEl = document.getElementById('loadingMessage');
        const randomMsg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
        msgEl.innerHTML = `<span class="emoji">${randomMsg.emoji}</span> ${randomMsg.text}`;
        msgEl.style.opacity = '0';
        setTimeout(() => { msgEl.style.opacity = '1'; }, 50);
    }
    
    updateProgress(percent) {
        const bar = document.getElementById('loadingBar');
        const percentEl = document.getElementById('loadingPercent');
        const clamped = Math.min(100, Math.max(0, percent));
        bar.style.width = `${clamped}%`;
        percentEl.textContent = `${Math.round(clamped)}%`;
    }
    
    finish() {
        this.isComplete = true;
        this.updateProgress(100);
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        setTimeout(() => {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }, 500);
    }
}
