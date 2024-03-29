import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";

export type TrendType = "cash" | "credit cards" | "loans" | "investments";

@Entity()
export class Trend {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  date: string; // 1989-11-29

  @Column({ nullable: false, type: "decimal", precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: false })
  type: TrendType;

  @ManyToOne(() => User, (user) => user.trends, {
    onDelete: "CASCADE",
    nullable: false,
    orphanedRowAction: "delete",
  })
  user: User;
}
