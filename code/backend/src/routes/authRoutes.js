import express from 'express';
import passport from 'passport';

const router = express.Router();

// Log the callback URL at route level for debugging
console.log('Auth routes loaded. Callback URL:', process.env.GOOGLE_CALLBACK_URL);

// Initiate Google OAuth authentication with specific callback URL
router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth flow. Using callback URL:', process.env.GOOGLE_CALLBACK_URL);
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    state: Buffer.from(JSON.stringify({ returnTo: 'wavediaries://dashboard' })).toString('base64'),
    // Explicitly specify the callback URL here to ensure it matches
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  })(req, res, next);
});

// Google OAuth callback route
router.get('/google/callback', (req, res, next) => {
    console.log('Received callback from Google at:', new Date().toISOString());
    console.log('Callback params:', req.query);
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
        console.log('Auth result:', { error: !!err, user: !!user });
        
        if (err || !user) {
            // If authentication fails, send HTML that redirects to app with error
            const errorMessage = encodeURIComponent(err?.message || info?.message || 'Authentication failed');
            console.error('Auth error:', err || info?.message);
            
            return res.send(`
                <html></html>
                <body>
                    <p>Authentication failed. Redirecting to app...</p>
                    <script>
                        window.location.replace('wavediaries://login?error=${errorMessage}');
                    </script>
                </body>
                </html>
            `);
        }
        
        // Generate JWT using a method defined on the user model
        const token = user.generateToken();
        console.log('Auth successful, returning token');
        
        // Send HTML that redirects to app with token
        return res.send(`
            <html>
            <body>
                <p>Authentication successful! Redirecting to app...</p>
                <script>
                    window.location.replace('wavediaries://dashboard?token=${token}');
                </script>
            </body>
            </html>
        `);
    })(req, res, next);
});

export default router;
