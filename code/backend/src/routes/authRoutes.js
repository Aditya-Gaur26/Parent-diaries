import express from 'express';
import passport from 'passport';

const router = express.Router();

// Initiate Google OAuth authentication
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
  
// Google OAuth callback route using a custom callback
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
        // If authentication fails, redirect back to frontend login page with error message
        const errorMessage = encodeURIComponent(err?.message || info?.message || 'Authentication failed');
        return res.redirect(`http://localhost:3000/login?error=${errorMessage}`);
        }
        // Generate JWT using a method defined on the user model
        const token = user.generateToken();
        
        // On successful authentication, redirect to frontend with token as query parameter
        return res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    })(req, res, next);
});

export default router;
