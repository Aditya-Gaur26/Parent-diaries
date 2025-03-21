import express from 'express';
import passport from 'passport';

/**
 * Express router to handle authentication routes
 * @type {import('express').Router}
 */
const router = express.Router();

// Debug logging for OAuth callback URL configuration
console.log('Auth routes loaded. Callback URL:', process.env.GOOGLE_CALLBACK_URL);

/**
 * Initiates Google OAuth authentication process
 * @route GET /auth/google 
 * @description Starts the Google OAuth flow with specified scopes and custom state
 * @returns {void} Redirects to Google login page
 */
router.get('/google', (req, res, next) => {
    // Log the start of OAuth flow for debugging
    console.log('Starting Google OAuth flow. Using callback URL:', process.env.GOOGLE_CALLBACK_URL);
    
    // Configure passport authentication with custom parameters
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false,
        // Encode return URL in state parameter for security
        state: Buffer.from(JSON.stringify({ returnTo: 'wavediaries:///' })).toString('base64'),
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    })(req, res, next);
});

/**
 * Handles the Google OAuth callback
 * @route GET /auth/google/callback
 * @description Processes the OAuth callback from Google, generates JWT token on success
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Sends HTML response with redirection logic
 */
router.get('/google/callback', (req, res, next) => {
    // Log callback receipt for debugging
    console.log('Received callback from Google at:', new Date().toISOString());
    console.log('Callback params:', req.query);
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
        // Log authentication result
        console.log('Auth result:', { error: !!err, user: !!user });
        
        if (err || !user) {
            // If authentication fails, prepare error redirect with multiple methods
            const errorMessage = encodeURIComponent(err?.message || info?.message || 'Authentication failed');
            console.error('Auth error:', err || info?.message);
            
            return res.send(`
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; }
                        .container { max-width: 500px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h2 { color: #d32f2f; }
                        .button { 
                            display: inline-block; 
                            background-color: #4285f4; 
                            color: white; 
                            padding: 12px 24px; 
                            border-radius: 4px; 
                            text-decoration: none; 
                            margin: 15px 0;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .instructions { margin-top: 15px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Authentication Failed</h2>
                        <p>Unable to complete the sign-in process.</p>
                        
                        <a href="wavediaries:///" class="button">Return to App</a>
                        
                        <div class="instructions">
                            <p><strong>Having trouble?</strong></p>
                            <p>If the button doesn't work, please close this browser and open the Wave Diaries app manually.</p>
                        </div>
                    </div>

                    <script>
                        // Try various methods to redirect
                        function attemptRedirect() {
                            // For Android - try multiple approaches
                            window.location.href = 'wavediaries:///';

                            // For Expo Go development
                            setTimeout(() => {
                                window.location.href = 'exp://192.168.160.155:8081';
                            }, 500);
                            
                            // Try standard redirect as last resort
                            setTimeout(() => {
                                window.location.replace('wavediaries:///');
                            }, 1000);
                        }
                        
                        // Attempt redirect immediately
                        attemptRedirect();
                        
                        // Try again after a delay
                        setTimeout(attemptRedirect, 2000);
                    </script>
                </body>
                </html>
            `);
        }
        
        // Generate JWT token for authenticated user
        const token = user.generateToken();
        console.log('Auth successful, returning token');
        
        // URL-encode token for safe transport
        const encodedToken = encodeURIComponent(token);
        
        // Send HTML with clear UI and multiple redirection strategies
        return res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; }
                    .container { max-width: 500px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #4caf50; }
                    .button { 
                        display: inline-block; 
                        background-color: #4285f4; 
                        color: white; 
                        padding: 12px 24px; 
                        border-radius: 4px; 
                        text-decoration: none; 
                        margin: 15px 0;
                        font-weight: bold;
                        font-size: 16px;
                    }
                    .instructions { margin-top: 15px; color: #555; }
                    .token-value { 
                        word-break: break-all; 
                        background: #f0f0f0;
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        font-family: monospace;
                        font-size: 12px;
                        text-align: left;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Authentication Successful</h2>
                    <p>You've successfully signed in!</p>
                    
                    <a href="wavediaries://login?token=${encodedToken}" class="button">Return to Wave Diaries</a>
                    
                    <div class="instructions">
                        <p><strong>Having trouble?</strong></p>
                        <p>If the automatic redirection doesn't work:</p>
                        <ol style="text-align: left">
                            <li>Close this browser</li>
                            <li>Open the Parent Diaries app</li>
                            <li>If prompted, tap "Copy Token" below and paste it in the app</li>
                        </ol>
                        
                        <button onclick="copyToken()" style="padding: 8px 16px; margin-top: 10px; cursor: pointer;">Copy Token</button>
                        <p id="copyStatus" style="color: green; display: none; margin-top: 5px;">Token copied!</p>
                        <div id="tokenDisplay" class="token-value">${token}</div>
                    </div>
                </div>

                <script>
                    // Function to copy token to clipboard
                    function copyToken() {
                        const tokenEl = document.getElementById('tokenDisplay');
                        const tokenValue = "${token}";
                        
                        // Show the token briefly
                        tokenEl.style.display = 'block';
                        
                        // Create a temporary textarea for copying
                        const textarea = document.createElement('textarea');
                        textarea.value = tokenValue;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        
                        // Show copy confirmation
                        document.getElementById('copyStatus').style.display = 'block';
                        setTimeout(() => {
                            document.getElementById('copyStatus').style.display = 'none';
                            tokenEl.style.display = 'none';
                        }, 2000);
                    }

                    // Try various methods to redirect
                    function attemptRedirect() {
                        // For Android & iOS - try multiple approaches with the token
                        window.location.href = 'wavediaries://login?token=${encodedToken}';
                        
                        // For Expo Go development
                        setTimeout(() => {
                            window.location.href = 'exp://192.168.160.155:8081/--/login?token=${encodedToken}';
                        }, 500);
                        
                        // Try standard redirect as last resort
                        setTimeout(() => {
                            window.location.replace('wavediaries://login?token=${encodedToken}');
                        }, 1000);
                    }
                    
                    // Attempt redirect immediately
                    attemptRedirect();
                    
                    // Try again after a delay
                    setTimeout(attemptRedirect, 1500);
                </script>
            </body>
            </html>
        `);
    })(req, res, next);
});

export default router;