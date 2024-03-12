import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

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
}
