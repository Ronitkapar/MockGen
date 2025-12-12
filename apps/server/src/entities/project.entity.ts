import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";
import { User } from "./user.entity";
import { MockEndpoint } from "./mock-endpoint.entity";

@ObjectType()
@Entity()
export class Project {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  ownerId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.projects)
  owner: User;

  @Field(() => [MockEndpoint], { nullable: true })
  @OneToMany(() => MockEndpoint, (endpoint) => endpoint.project)
  endpoints: MockEndpoint[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
