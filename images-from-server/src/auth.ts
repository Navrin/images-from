import passport from "koa-passport";
import settings from "./settings";
import { OAuth2Strategy as GoogleAuth } from "passport-google-oauth";

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(
    new GoogleAuth(
        {
            clientID: settings.google.id,
            clientSecret: settings.google.secret,
            callbackURL: settings.endpoint + "/auth/google/callback",
        },
        (access, refresh, prof, done) => {
            done(null, prof);
        },
    ),
);
