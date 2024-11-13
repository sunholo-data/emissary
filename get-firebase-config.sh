#!/bin/bash

# Get the secret
gcloud secrets versions access latest --secret=FIREBASE_ENV --project $_PROJECT_ID > .env.local

# Parse env file and create build args
echo "Creating build args from env file..."
DOCKER_ARGS=$(grep "NEXT_PUBLIC_" .env.local | sed 's/^/--build-arg /' | tr '\n' ' ')

# Store for next step
echo "$DOCKER_ARGS" > /workspace/docker_args

# Debug output (optional)
echo "Generated Docker build args from environment variables"
echo "Args file contents:"
cat /workspace/docker_args
