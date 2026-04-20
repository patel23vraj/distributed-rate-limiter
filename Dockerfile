# Dockerfile

# Use official Node.js 20 Alpine image
# Alpine is a minimal Linux distro — keeps the image small
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first
# We do this before copying source code so Docker can cache
# the npm install layer — if only source code changes,
# Docker reuses the cached node_modules layer
COPY package*.json ./

# Install only production dependencies
# --omit=dev skips nodemon and other dev tools
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]