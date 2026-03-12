/**
 * Content Security Policy configuration
 * Prevents XSS, clickjacking, and other injection attacks
 */
module.exports = {
  directives: {
    // Default policy: everything from same origin
    defaultSrc: ["'self'"],
    
    // Scripts: only from own domain + trusted CDNs
    scriptSrc: [
      "'self'",
      "https://cdn.jsdelivr.net", // For external libraries if needed
      "https://analytics.google.com" // For analytics if used
    ],
    
    // Styles: own domain + Google Fonts
    styleSrc: [
      "'self'",
      "https://fonts.googleapis.com",
      "'unsafe-inline'" // Required for Tailwind - can be removed in future
    ],
    
    // Images: own domain, data URIs, and HTTPS
    imgSrc: [
      "'self'",
      "data:",
      "https:"
    ],
    
    // Fonts: own domain and Google Fonts
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    
    // API connections: own backend only
    connectSrc: [
      "'self'",
      process.env.API_URL || "https://api.trimly.com",
      process.env.WEBSOCKET_URL || "wss://api.trimly.com" // WebSocket for Socket.io
    ],
    
    // Prevent embedding in iframes (clickjacking protection)
    frameSrc: ["'none'"],
    
    // Prevent object/embed embedding
    objectSrc: ["'none'"],
    
    // Frame ancestors (X-Frame-Options equivalent)
    frameAncestors: ["'none'"],
    
    // Base URI restriction
    baseUri: ["'self'"],
    
    // Form submissions only to same origin
    formAction: ["'self'"],
    
    // Upgrade HTTP to HTTPS in production
    ...(process.env.NODE_ENV === 'production' && {
      upgradeInsecureRequests: []
    }),
    
    // Report CSP violations (optional)
    ...(process.env.CSP_REPORT_URI && {
      reportUri: [process.env.CSP_REPORT_URI]
    })
  },
  
  // Report violations but don't enforce (report-only mode)
  reportOnly: process.env.CSP_REPORT_ONLY === 'true'
};
