# Development Dockerfile for Vite React Client
# Uses volume-mounted node_modules from host for faster builds
FROM node:18-slim

WORKDIR /usr/src/app

# The node_modules will be volume mounted from the host
# This avoids the long npm install time in Docker

# Expose Vite dev server port
EXPOSE 5173

# Start development server with hot reload
# --host exposes to all network interfaces for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
