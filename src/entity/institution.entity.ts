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
  /**
   * If populated, customName > name.
   */
  @Column({ nullable: true })
  customName: string;
  /**
   * A user can have many item/institutions.
   */
  @ManyToOne(() => User, (user) => user.institutions, {
    onDelete: "CASCADE",
    nullable: false,
    orphanedRowAction: "delete",
  })
  user: User;
  /**
   * An item/institution can have many accounts.
   */
  @OneToMany(() => Account, (account) => account.institution, { cascade: true })
  accounts: Account[];
  /**
   * An item/institution can have many transactions.
   */
  @OneToMany(() => Transaction, (transaction) => transaction.institution, {
    cascade: true,
  })
  transactions: Transaction[];

  // Plaid data =============================================================

  /**
   * The Plaid Item ID. The item_id is always unique; linking the same account
   * at the same institution twice will result in two Items with different
   * item_id values. Like all Plaid identifiers, the item_id is case-sensitive.
   */
  @Column({ nullable: false })
  itemId: string;
  /**
   * The Plaid Institution ID associated with the Item. Field is null for Items
   * created via Same Day Micro-deposits.
   */
  @Column({ nullable: true })
  institutionId: string;
  /**
   * The official name of the institution.
   */
  @Column({ nullable: true })
  name: string;
  /**
   * The access token associated with the Item data is being requested for.
   */
  @Column({ nullable: false })
  accessToken: string;
  /**
   * Used for syncing transactions. Indiciates which transactions have
   * been retrieved already.
   */
  @Column({ nullable: true })
  cursor: string;
  /**
   * The URL for the institution's website.
   */
  @Column({ nullable: true })
  logo: string;
  /**
   * Base64 encoded representation of the institution's logo, returned as a base64
   * encoded 152x152 PNG. Not all institutions' logos are available.
   */
  @Column({ nullable: true })
  url: string;
  /**
   * Hexadecimal representation of the primary color used by the institution.
   */
  @Column({ nullable: true })
  primaryColor: string;
}
