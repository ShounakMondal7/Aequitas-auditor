# Stage 1: Build the React (Vite) application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build static bundle
COPY . .
RUN npm run build

# Stage 2: Serve static files with production Nginx
FROM nginx:alpine

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
