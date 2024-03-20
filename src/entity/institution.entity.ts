import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { Account } from "./account.entity";
import { Transaction } from "./transaction.entity";

export type InstitutionValues = {
  [key in keyof Institution]: Institution[key];
};

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  plaidItemId: string;

  @Column({ nullable: true })
  plaidInstitutionId: string;

  @Column({ nullable: true })
  plaidName: string;

  @Column({ nullable: false })
  plaidAccessToken: string;

  @Column({ nullable: true })
  plaidCursor: string;

  @ManyToOne(() => User, (user) => user.institutions)
  user: User;

  @OneToMany(() => Account, (account) => account.institution)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.institution)
  transactions: Transaction[];
}
