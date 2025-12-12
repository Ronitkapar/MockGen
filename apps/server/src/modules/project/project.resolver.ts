import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { ProjectType, StatusType } from "./project.type";

@Resolver(() => ProjectType)
export class ProjectResolver {
    private projectsMap: Map<string, ProjectType> = new Map();

    @Query(() => [ProjectType], { description: "Get all projects" })
    async allProjects(): Promise<ProjectType[]> {
        return Array.from(this.projectsMap.values());
    }

    @Query(() => StatusType, { description: "Get system health status" })
    async health(): Promise<StatusType> {
        return {
            message: "MockGen Server is running!",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        };
    }

    @Query(() => ProjectType, { nullable: true, description: "Get project by ID" })
    async project(@Args("id") id: string): Promise<ProjectType | null> {
        return this.projectsMap.get(id) || null;
    }

    @Mutation(() => ProjectType, { description: "Create a new project" })
    async createProject(
        @Args("name") name: string,
        @Args("repoUrl", { nullable: true }) repoUrl?: string
    ): Promise<ProjectType> {
        const id = Date.now().toString();
        const project: ProjectType = {
            id,
            name,
            repoUrl,
            createdAt: new Date().toISOString(),
        };
        this.projectsMap.set(id, project);
        return project;
    }
}
