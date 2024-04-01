import { myDataSource } from "./databaseService";
import { User } from "../entity/user.entity";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

export async function generateSalt() {
  return await bcrypt.genSalt(10);
}

export async function hashPassword(password: string, salt: string) {
  return await bcrypt.hash(password, salt);
}

passport.serializeUser(function (user: User, cb) {
  process.nextTick(function () {
    return cb(null, user);
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
      let user = await userRepository.findOne({ where: { username } });

      if (!user) {
        user = await userRepository.findOne({ where: { email: username } });
      }
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
