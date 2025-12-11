import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Project } from './project.entity';

export enum UserPersona {
    STUDENT = 'STUDENT',
    PROFESSIONAL = 'PROFESSIONAL',
}

registerEnumType(UserPersona, { name: 'UserPersona' });

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ unique: true })
    email: string;

    @Field()
    @Column()
    name: string;

    @Field(() => UserPersona)
    @Column({
        type: 'enum',
        enum: UserPersona,
        default: UserPersona.PROFESSIONAL,
    })
    persona: UserPersona;

    @Field(() => [Project], { nullable: true })
    @OneToMany(() => Project, (project) => project.owner)
    projects: Project[];
}
