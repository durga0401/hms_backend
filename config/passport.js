const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // Check if user exists by google_id or email
        let user = await User.findByGoogleId(googleId);

        if (!user) {
          // Check if email already exists
          user = await User.findByEmail(email);

          if (user) {
            // Link Google account to existing user
            await User.updateGoogleId(user.id, googleId);
            user.google_id = googleId;
          } else {
            // Create new user with Google account (default role: PATIENT)
            const userId = await User.createWithGoogle({
              email,
              name,
              google_id: googleId,
              role: "PATIENT",
            });
            user = await User.findById(userId);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token for OAuth user
const generateTokenForOAuthUser = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

module.exports = { passport, generateTokenForOAuthUser };
