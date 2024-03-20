import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ColumnType,
} from "typeorm";
import { User } from "./user.entity";
import { Institution } from "./institution.entity";
import { Transaction } from "./transaction.entity";

export type AccountValues = {
  [key in keyof Account]: Account[key];
};

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  plaidAccountId: string;

  @Column({ nullable: true })
  plaidName: string;

  @Column({ nullable: true })
  plaidOfficialName: string;

  // only supported for Chase items
  @Column({ nullable: true })
  plaidPersistentAccountId: string;

  @Column({ nullable: true })
  plaidSubType: string;

  @Column({ nullable: true })
  plaidType: string;

  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  plaidAvailableBalance: number;

  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  plaidCurrentBalance: number;

  @Column({ nullable: true })
  plaidIsoCurrencyCode: string;

  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  plaidCreditLimit: number;

  @Column({ type: "date", nullable: true })
  lastUpdatedDatetime: string;

  @Column({ type: "date", nullable: true })
  lastSync: Date;

  @ManyToOne(() => Institution, (institution) => institution.accounts)
  institution: Institution;

  @ManyToOne(() => User, (user) => user.accounts)
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];
}
