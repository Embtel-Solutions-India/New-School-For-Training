import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/api/auth/google/callback",
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();

          if (!email) {
            return done(null, false, { message: "Google account has no email" });
          }

          const existingUser = await User.findOne({ email }).select("+password");

          if (existingUser && existingUser.provider !== "google") {
            return done(null, false, {
              message: "Email already registered with password login",
            });
          }

          if (existingUser) {
            existingUser.googleId = profile.id;
            existingUser.avatar = profile.photos?.[0]?.value || existingUser.avatar;
            existingUser.isVerified = true;
            existingUser.lastLogin = new Date();
            await existingUser.save({ validateBeforeSave: false });
            return done(null, existingUser);
          }

          const user = await User.create({
            name: profile.displayName || email.split("@")[0],
            username: `${email.split("@")[0]}-${profile.id.slice(-6)}`,
            email,
            avatar: profile.photos?.[0]?.value || "",
            provider: "google",
            googleId: profile.id,
            isVerified: true,
            lastLogin: new Date(),
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

export default configurePassport;
