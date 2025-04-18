class TokenBlacklist {
    constructor() {
        // Use Map instead of Set for better key-value storage
        this.blacklistedTokens = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // Cleanup every hour
    }

    addToken(token, exp) {
        // Store token with its expiration time
        this.blacklistedTokens.set(token, exp);
    }

    isBlacklisted(token) {
        // Check if token exists and hasn't expired
        const expiry = this.blacklistedTokens.get(token);
        if (!expiry) return false;
        
        // If token has expired, remove it and return false
        if (expiry <= Date.now()) {
            this.blacklistedTokens.delete(token);
            return false;
        }
        return true;
    }

    cleanup() {
        const now = Date.now();
        for (const [token, exp] of this.blacklistedTokens.entries()) {
            if (exp <= now) {
                this.blacklistedTokens.delete(token);
            }
        }
    }
}

export default new TokenBlacklist();