/**
 * Passport.js Configuration
 * Google OAuth 2.0 Strategy
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update avatar if changed
          if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // Check if email already registered (link accounts)
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: name || 'Student',
          email: email || `google_${profile.id}@placeholder.com`,
          avatar: avatar || '',
          // No password needed for OAuth users
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Minimal serialize (we use JWT so session is just a bridge)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
