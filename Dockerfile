# Build stage
FROM node:19-alpine AS builder

# Set the working directory
WORKDIR /app

# Define all build arguments
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

# Set them as environment variables for the build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application with environment variables available
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM node:19-alpine

WORKDIR /app

# Copy from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./static

# Copy all required Next.js files
COPY --from=builder /app/.next/BUILD_ID ./.next/
COPY --from=builder /app/.next/build-manifest.json ./.next/
COPY --from=builder /app/.next/app-build-manifest.json ./.next/
COPY --from=builder /app/.next/app-path-routes-manifest.json ./.next/
COPY --from=builder /app/.next/prerender-manifest.json ./.next/
COPY --from=builder /app/.next/prerender-manifest.js ./.next/
COPY --from=builder /app/.next/routes-manifest.json ./.next/
COPY --from=builder /app/.next/images-manifest.json ./.next/
COPY --from=builder /app/.next/required-server-files.json ./.next/
COPY --from=builder /app/.next/react-loadable-manifest.json ./.next/
COPY --from=builder /app/.next/export-marker.json ./.next/
COPY --from=builder /app/.next/package.json ./.next/

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]