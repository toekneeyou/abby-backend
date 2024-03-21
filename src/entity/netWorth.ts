import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class NetWorth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: "decimal" })
  amount: number;

  @Column()
  month: number;

  @Column()
  day: number;

  @Column()
  year: number;

  @ManyToOne(() => User, (user) => user.netWorths)
  user: User;
}
