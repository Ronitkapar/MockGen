import { ObjectType, InputType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ChaosSettings {
    @Field(() => Int)
    latencyMs: number;

    @Field()
    forceError: boolean;
}

@InputType()
export class UpdateChaosInput {
    @Field(() => Int)
    latencyMs: number;

    @Field()
    forceError: boolean;
}
