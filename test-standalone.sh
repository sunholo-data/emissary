#!/bin/bash

# Build the application
echo "Building application..."
npm run build

# Create standalone test directory
echo "Setting up standalone test environment..."
rm -rf standalone-test
mkdir -p standalone-test

# Copy the standalone server and core files
echo "Copying standalone files..."
cp -r .next/standalone/* standalone-test/

# Create necessary directories
echo "Creating .next directory structure..."
mkdir -p standalone-test/.next/cache
mkdir -p standalone-test/.next/static
mkdir -p standalone-test/.next/server
mkdir -p standalone-test/.next/types

# Copy required Next.js files
echo "Copying Next.js build files..."
cp -r .next/BUILD_ID standalone-test/.next/
cp -r .next/build-manifest.json standalone-test/.next/
cp -r .next/react-loadable-manifest.json standalone-test/.next/
cp -r .next/routes-manifest.json standalone-test/.next/
cp -r .next/app-build-manifest.json standalone-test/.next/
cp -r .next/app-path-routes-manifest.json standalone-test/.next/
cp -r .next/prerender-manifest.json standalone-test/.next/
cp -r .next/prerender-manifest.js standalone-test/.next/
cp -r .next/images-manifest.json standalone-test/.next/
cp -r .next/required-server-files.json standalone-test/.next/
cp -r .next/export-marker.json standalone-test/.next/
cp -r .next/package.json standalone-test/.next/
cp -r .next/static standalone-test/.next/
cp -r .next/server standalone-test/.next/
cp -r .next/types standalone-test/.next/

# Copy static files to root static directory as well
echo "Copying static files to root..."
cp -r .next/static standalone-test/static

# Copy public directory
echo "Copying public directory..."
cp -r public standalone-test/public

# List contents of directories for verification
echo "Contents of standalone .next directory:"
ls -la standalone-test/.next/

# Start the server
echo "Starting standalone server..."
cd standalone-test
PORT=3000 node server.js