import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import dotenv from 'dotenv';

dotenv.config();

// Get the callback URL from environment variables - use the exact URL without any modifications
const callbackURL = process.env.GOOGLE_CALLBACK_URL;
console.log('Google OAuth callback URL being used:', callbackURL);

// Configure Google strategy for Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      passReqToCallback: true,
      scope: ['profile', 'email'] // Ensure we're requesting profile and email
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.displayName);
        // Log available profile data to understand what fields we have access to
        console.log('Google profile fields available:', Object.keys(profile));
        console.log('Profile JSON:', JSON.stringify(profile, null, 2));
        
        // Check if user already exists
        let user = await User.findOne({ email : profile.emails?.[0]?.value });
        
        // Extract available data (Note: Google OAuth typically doesn't provide phone or DOB)
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;
        
        // These fields typically won't be available from Google OAuth
        // but we're preparing code to handle them if they were
        const mobileNumber = profile._json?.phoneNumber || null;
        const dob = profile._json?.birthday || null;

        // Create default child
        const defaultChild = {
          name: 'Default Child',
          dateOfBirth: new Date(),  // Current date as placeholder
          gender: 'Other',  // Default gender
          bloodGroup: null,
          medicalConditions: [],
          allergies: []
        };
        
        if (!user) {
          // Create new user if doesn't exist
          user = await new User({
            googleid: profile.id,
            email: email,
            name: name,
            // avatar: avatar,
            mobile_number: mobileNumber,
            dob: dob,
            isVerified: true,
            subscriptionType: 'free', // Set default subscription type
            children : [defaultChild]
          }).save();
          
          // Create a default subscription for the new Google user
          const newSubscription = new Subscription({
            userId: user._id,
            type: 'free',
            startDate: new Date(),
            autoRenew: true
          });
          await newSubscription.save();
          
        } else {
          // Update existing user with any new information
          if (mobileNumber || dob) {
            if (mobileNumber) user.mobileNumber = mobileNumber;
            if (dob) user.dob = dob;
            await user.save();
          }
          
          // Check if this user has a subscription entry already
          const existingSubscription = await Subscription.findOne({ userId: user._id });
          if (!existingSubscription) {
            // Create subscription if it doesn't exist
            const newSubscription = new Subscription({
              userId: user._id,
              type: user.subscriptionType || 'free',
              startDate: new Date(),
              autoRenew: true
            });
            await newSubscription.save();
          }
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;
