import express from 'express';
import passport from 'passport';

const router = express.Router();

// Route to initiate Google authentication.
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback route that Google will redirect to after authentication.
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // On successful authentication, you can send a response, set a cookie, or redirect.
    res.send('Google login successful! You can now close this window.');
  }
);

export default router;
