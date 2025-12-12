# Development Dockerfile for NestJS Server
# Uses volume-mounted node_modules from host for faster builds
FROM node:18-slim

WORKDIR /usr/src/app

# The node_modules will be volume mounted from the host
# This avoids the long npm install time in Docker

# Expose NestJS port
EXPOSE 3000

# Start development server with watch mode
CMD ["npm", "run", "start:dev"]
