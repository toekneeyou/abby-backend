import crypto from "crypto";
import myPassport from "passport";
import { Strategy } from "passport-local";
import { myDataSource } from "./databaseService";
import { User } from "../entity/user.entity";

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

myPassport.use(
  new Strategy(async function verify(username, password, done) {
    try {
      const userRepository = myDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { username },
      });

      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const hashedPassword = await hashPassword(password, user.salt);

      if (hashedPassword === user.password) {
        done(null, user, { message: "Authentication successful" });
      } else {
        done(null, null, {
          message: "Inccorrect username or password",
        });
      }
    } catch (error) {
      console.error(error);
    }
  })
);

export default myPassport;
