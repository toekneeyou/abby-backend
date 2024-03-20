import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "./user.entity";
import { Institution } from "./institution.entity";
import { Account } from "./account.entity";
import { Category } from "./category.entity";

export type TransactionValues = {
  [key in keyof Transaction]: Transaction[key];
};

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: false })
  plaidIsoCurrencyCode: number;

  @ManyToOne(() => Account, (account) => account.transactions)
  account: Account;

  @ManyToOne(() => Institution, (institution) => institution.transactions)
  institution: Institution;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @ManyToMany(() => Category)
  @JoinTable()
  plaidCategories: Category[];
}
