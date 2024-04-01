import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
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
  /**
   * If populated, customName > name > merchantName
   */
  @Column({ nullable: true })
  customName: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: false, type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ default: false })
  isModified: boolean;

  @ManyToOne(() => Account, (account) => account.transactions, {
    onDelete: "CASCADE",
    nullable: true,
    orphanedRowAction: "delete",
  })
  account: Account;

  @ManyToOne(() => Institution, (institution) => institution.transactions, {
    onDelete: "CASCADE",
    nullable: true,
    orphanedRowAction: "delete",
    eager: false,
  })
  institution: Institution;

  @ManyToOne(() => User, (user) => user.transactions, {
    onDelete: "CASCADE",
    nullable: false,
    orphanedRowAction: "delete",
    eager: false,
  })
  user: User;

  @ManyToOne(() => Category, (category) => category.transactions, {
    nullable: true,
    eager: true,
  })
  category: Category;

  // Plaid data =============================================================

  @Column({ nullable: true })
  isoCurrencyCode: string;

  @Column({ nullable: false })
  date: string;

  @Column({ nullable: true })
  dateTime: string;

  @Column({ nullable: true })
  authorizedDate: string;

  @Column({ nullable: true })
  authorizedDateTime: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column({ nullable: true })
  merchantAddress: string;

  @Column({ nullable: true })
  merchantCity: string;

  @Column({ nullable: true })
  merchantRegion: string;

  @Column({ nullable: true })
  merchantPostalCode: string;

  @Column({ nullable: true })
  merchantCountry: string;

  @Column({ nullable: true })
  merchantLat: number;

  @Column({ nullable: true })
  merchantLon: number;

  @Column({ nullable: true })
  merchantStoreNumber: string;

  @Column({ nullable: true, default: false })
  pending: boolean;

  @Column({ nullable: true, unique: true })
  transactionId: string;

  @Column({ nullable: true })
  paymentChannel: string;
}

const sampleTransaction = {
  account_id: "BxBXxLj1m4HMXBm9WZZmCWVbPjX16EHwv99vp",
  amount: 2307.21,
  iso_currency_code: "USD",
  unofficial_currency_code: null,
  category: ["Shops", "Computers and Electronics"],
  category_id: "19013000",
  check_number: null,
  date: "2023-01-29",
  datetime: "2023-01-27T11:00:00Z",
  authorized_date: "2023-01-27",
  authorized_datetime: "2023-01-27T10:34:50Z",
  location: {
    address: "300 Post St",
    city: "San Francisco",
    region: "CA",
    postal_code: "94108",
    country: "US",
    lat: 40.740352,
    lon: -74.001761,
    store_number: "1235",
  },
  name: "Apple Store",
  merchant_name: "Apple",
  payment_meta: {
    by_order_of: null,
    payee: null,
    payer: null,
    payment_method: null,
    payment_processor: null,
    ppd_id: null,
    reason: null,
    reference_number: null,
  },
  payment_channel: "in store",
  pending: false,
  pending_transaction_id: null,
  personal_finance_category: {
    primary: "GENERAL_MERCHANDISE",
    detailed: "GENERAL_MERCHANDISE_ELECTRONICS",
  },
  account_owner: null,
  transaction_id: "lPNjeW1nR6CDn5okmGQ6hEpMo4lLNoSrzqDje",
  transaction_code: null,
  transaction_type: "place",
};
