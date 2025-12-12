import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend
    app.enableCors({
        origin: [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
        ],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        })
    );

    const port = process.env.PORT || 3000;
    await app.listen(port, "0.0.0.0");
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
