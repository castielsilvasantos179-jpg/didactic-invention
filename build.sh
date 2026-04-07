#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building Vite client..."
pnpm exec vite build

echo "Building server with esbuild..."
pnpm exec esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --external:express \
  --external:drizzle-orm \
  --external:mysql2

echo "Build complete!"
