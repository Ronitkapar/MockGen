import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType({ description: "A MockGen project for GraphQL" })
export class ProjectType {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field({ nullable: true })
    repoUrl?: string;

    @Field()
    createdAt: string;
}

@ObjectType({ description: "System status" })
export class StatusType {
    @Field()
    message: string;

    @Field()
    timestamp: string;

    @Field()
    version: string;
}
