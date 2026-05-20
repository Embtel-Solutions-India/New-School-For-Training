import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const configurePassport = () => {
  console.log({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    callback: process.env.GOOGLE_CALLBACK_URL,
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/api/auth/google/callback",

        scope: ["profile", "email"]
      },

      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("PROFILE:", profile?.id);

          const email =
            profile.emails?.[0]?.value?.toLowerCase();

          if (!email) {
            return done(null,false);
          }

          let user =
            await User.findOne({ email });

          if(!user){
            user=await User.create({
              name:profile.displayName,
              email,
              provider:"google",
              googleId:profile.id,
              isVerified:true
            });
          }

          return done(null,user);

        } catch(err){
          return done(err);
        }
      }
    )
  );
};

export default configurePassport;