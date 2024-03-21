import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Institution } from "./institution.entity";
import { Account } from "./account.entity";
import { Transaction } from "./transaction.entity";
import { NetWorth } from "./netWorth";

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

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ type: "varchar" })
  salt: string;

  @Column({ type: "varchar" })
  password: string;

  @OneToMany(() => Institution, (institution) => institution.user, {
    eager: false,
  })
  institutions: Institution[];

  @OneToMany(() => Account, (account) => account.user, {
    eager: false,
  })
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    eager: false,
  })
  transactions: Transaction[];

  @OneToMany(() => NetWorth, (netWorth) => netWorth.user, {
    eager: false,
  })
  netWorths: NetWorth[];
}
