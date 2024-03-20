import crypto from "crypto";
import { myDataSource } from "./databaseService";
import { User } from "../entity/user.entity";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

passport.serializeUser(function (user: User, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
    });
  });
});

passport.deserializeUser(function (user: User, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const userRepository = myDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { username } });

      if (!user) {
        console.log("user not found");

        return done(null, false);
      }

      const hashedPassword = await hashPassword(password, user.salt);

      if (user.password === hashedPassword) {
        console.log("success", user);
        return done(null, user);
      } else {
        console.log("incorrect password");
        return done(null, false);
      }
    } catch (error) {
      return done(error);
    }
  })
);

export default passport;
