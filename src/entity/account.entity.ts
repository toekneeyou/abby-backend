import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
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
  /**
   * If populated, customName > officialName
   */
  @Column({ nullable: true })
  customName: string;
  /**
   * Last time account balances were synced.
   */
  @Column({ type: "date", nullable: true })
  lastSync: string;
  /**
   * Is account hidden in UI?
   */
  @Column({ default: false })
  isHidden: boolean;

  @ManyToOne(() => Institution, (institution) => institution.accounts, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    nullable: false,
    eager: true,
  })
  institution: Institution;

  @ManyToOne(() => User, (user) => user.accounts, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    nullable: false,
  })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account, {
    cascade: true,
    eager: false,
  })
  transactions: Transaction[];

  // Plaid data =============================================================

  /**
   * Plaid’s unique identifier for the account. This value will not change
   * unless Plaid can't reconcile the account with the data returned by the
   * financial institution. This may occur, for example, when the name of the
   * account changes. If this happens a new account_id will be assigned to the
   * account.
   * The account_id can also change if the access_token is deleted and the same
   * credentials that were used to generate that access_token are used to generate
   * a new access_token on a later date. In that case, the new account_id will be
   * different from the old account_id.
   * If an account with a specific account_id disappears instead of changing, the
   * account is likely closed. Closed accounts are not returned by the Plaid API.
   * Like all Plaid identifiers, the account_id is case sensitive.
   */
  @Column({ nullable: true })
  accountId: string;
  /**
   * The name of the account, either assigned by the user or by the financial
   * institution itself.
   */
  @Column({ nullable: true })
  name: string;
  /**
   * The official name of the account as given by the financial institution.
   */
  @Column({ nullable: true })
  officialName: string;
  /**
   * A unique and persistent identifier for accounts that can be used to trace multiple
   * instances of the same account across different Items for depository accounts.
   * This is currently only supported for Chase Items. Because Chase accounts have a
   * different account number each time they are linked, this field may be used instead
   * of the account number to uniquely identify a Chase account across multiple Items
   * for payments use cases, helping to reduce duplicate Items or attempted fraud.
   * In Sandbox, this field may be populated for any account; in Production and Development,
   * it will only be populated for Chase accounts.
   */
  @Column({ nullable: true })
  persistentAccountId: string;
  /**
   * Possible values: 401a, 401k, 403B, 457b, 529, brokerage, cash isa, crypto exchange,
   * education savings account, ebt, fixed annuity, gic, health reimbursement arrangement,
   * hsa, isa, ira, lif, life insurance, lira, lrif, lrsp, non-custodial wallet,
   * non-taxable brokerage account, other, other insurance, other annuity, prif, rdsp,
   * resp, rlif, rrif, pension, profit sharing plan, retirement, roth, roth 401k, rrsp,
   * sep ira, simple ira, sipp, stock plan, thrift savings plan, tfsa, trust, ugma, utma,
   * variable annuity, credit card, paypal, cd, checking, savings, money market, prepaid,
   * auto, business, commercial, construction, consumer, home equity, loan, mortgage,
   * overdraft, line of credit, student, cash management, keogh, mutual fund, recurring,
   * rewards, safe deposit, sarsep, payroll, null
   */
  @Column({ nullable: true })
  subType: string;
  /**
   * Possible values: investment, credit, depository, loan, brokerage, other
   */
  @Column({ nullable: true })
  type: string;
  /**
   * The amount of funds available to be withdrawn from the account, as determined
   * by the financial institution.
   * For credit-type accounts, the available balance typically equals the limit less
   * the current balance, less any pending outflows plus any pending inflows.
   * For depository-type accounts, the available balance typically equals the current
   * balance less any pending outflows plus any pending inflows. For depository-type
   * accounts, the available balance does not include the overdraft limit.
   * For investment-type accounts (or brokerage-type accounts for API versions
   * 2018-05-22 and earlier), the available balance is the total cash available to
   * withdraw as presented by the institution.
   * Note that not all institutions calculate the available  balance. In the event
   * that available balance is unavailable, Plaid will return an available balance
   * value of null.
   * Available balance may be cached and is not guaranteed to be up-to-date in realtime
   * unless the value was returned by /accounts/balance/get.
   * If current is null this field is guaranteed not to be null.
   */
  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  availableBalance: number;
  /**
   * The total amount of funds in or owed by the account.
   * For credit-type accounts, a positive balance indicates the amount owed; a
   * negative amount indicates the lender owing the account holder.
   * For loan-type accounts, the current balance is the principal remaining on the loan,
   * except in the case of student loan accounts at Sallie Mae (ins_116944). For
   * Sallie Mae student loans, the account's balance includes both principal and any
   * outstanding interest.
   * For investment-type accounts (or brokerage-type accounts for API versions 2018-05-22
   * and earlier), the current balance is the total value of assets as presented by the
   * institution.
   * Note that balance information may be cached unless the value was returned by
   * /accounts/balance/get; if the Item is enabled for Transactions, the balance will be
   * at least as recent as the most recent Transaction update. If you require realtime
   * balance information, use the available balance as provided by /accounts/balance/get.
   * When returned by /accounts/balance/get, this field may be null. When this happens,
   * available is guaranteed not to be null.
   */
  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  currentBalance: number;
  /**
   * The ISO-4217 currency code of the balance. Always null if unofficial_currency_code
   * is non-null.
   */
  @Column({ nullable: true })
  isoCurrencyCode: string;
  /**
   * The unofficial currency code associated with the balance. Always null if
   * iso_currency_code is non-null. Unofficial currency codes are used for currencies that
   * do not have official ISO currency codes, such as cryptocurrencies and the currencies
   * of certain countries.
   */
  @Column({ nullable: true })
  unofficialCurrencyCode: string;
  /**
   * For credit-type accounts, this represents the credit limit.
   * For depository-type accounts, this represents the pre-arranged overdraft limit,
   * which is common for current (checking) accounts in Europe.
   * In North America, this field is typically only available for credit-type accounts.
   */
  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  limit: number;
}
