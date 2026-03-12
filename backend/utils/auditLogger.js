const fs = require('fs');
const path = require('path');

/**
 * Audit logging utility for security events
 */
class AuditLogger {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Log an audit event
   */
  async log(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    try {
      // Console log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', JSON.stringify(entry, null, 2));
      }

      // File log in production
      if (process.env.NODE_ENV === 'production') {
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, `audit_${date}.log`);
        
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      }

      // Send to external service if configured
      if (process.env.AUDIT_LOG_URL) {
        this._sendToExternalService(entry);
      }
    } catch (error) {
      console.error('[AUDIT ERROR]', error.message);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(event) {
    await this.log({
      category: 'AUTHENTICATION',
      ...event
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(event) {
    await this.log({
      category: 'AUTHORIZATION',
      ...event
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(event) {
    await this.log({
      category: 'DATA_MODIFICATION',
      ...event
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event) {
    await this.log({
      category: 'SECURITY',
      ...event
    });
  }

  /**
   * Send log to external service
   */
  _sendToExternalService(entry) {
    // Non-blocking async operation
    setImmediate(async () => {
      try {
        await fetch(process.env.AUDIT_LOG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          timeout: 5000
        });
      } catch (error) {
        console.error('[AUDIT LOG SEND ERROR]', error.message);
      }
    });
  }
}

module.exports = new AuditLogger();
