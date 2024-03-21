import { DataSource } from "typeorm";
import { User } from "../entity/user.entity";
import { Account } from "../entity/account.entity";
import { Institution } from "../entity/institution.entity";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { NetWorth } from "../entity/netWorth";

export const myDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Account, Institution, Transaction, Category, NetWorth],
  logging: true,
  /**
   * When synchronize is set to true,
   * TypeORM will attempt to synchronize
   * the database schema with your entity definitions
   * every time the application starts.
   * Good for DEV, not for PROD
   */
  synchronize: true,
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
