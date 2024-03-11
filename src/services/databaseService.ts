import { DataSource } from "typeorm";
import { User } from "../entity/user.entity";

export const myDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: "abby-dev",
  entities: [User],
  logging: true,
  synchronize: false,
});

export function initializeDatabase() {
  myDataSource
    .initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization:", err);
    });
}
