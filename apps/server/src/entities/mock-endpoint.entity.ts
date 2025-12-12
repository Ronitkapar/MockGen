import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";
import { Project } from "./project.entity";

@ObjectType()
@Entity()
export class MockEndpoint {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  projectId: string;

  @Field(() => Project)
  @ManyToOne(() => Project, (project) => project.endpoints)
  project: Project;

  @Field()
  @Column()
  method: string;

  @Field()
  @Column()
  path: string;

  @Field(() => String)
  @Column("json")
  responseData: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column("json", { nullable: true })
  chaosConfig: Record<string, any>;
}
