import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Institution } from "./institution.entity";
import { Account } from "./account.entity";
import { Transaction } from "./transaction.entity";
import { Trend } from "./trends.entity";
import { Category } from "./category.entity";

export type UserValues = {
  [key in keyof User]: User[key];
};

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: false })
  email: string;

  @Column({ unique: true, length: 30, nullable: false })
  username: string;
  /**
   * Used to hash password. Unique to each user.
   */
  @Column({ type: "varchar", nullable: false })
  salt: string;

  @Column({ type: "varchar", nullable: false })
  password: string;

  @OneToMany(() => Institution, (institution) => institution.user, {
    eager: false,
    cascade: true,
  })
  institutions: Institution[];

  @OneToMany(() => Account, (account) => account.user, {
    eager: false,
    cascade: true,
  })
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    eager: false,
    cascade: true,
  })
  transactions: Transaction[];

  @OneToMany(() => Trend, (trend) => trend.user, {
    eager: false,
    cascade: true,
  })
  trends: Trend[];

  @OneToMany(() => Category, (category) => category.user, {
    eager: false,
    cascade: true,
  })
  categories: Category[];
}
