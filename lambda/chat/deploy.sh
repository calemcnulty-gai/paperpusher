#!/bin/bash

# Set script to exit on error
set -e

# Load environment variables
source ../../.env

# Create a temporary directory for the build
BUILD_DIR="$(mktemp -d)"
echo "Building in $BUILD_DIR"

# Create package directory
mkdir -p "$BUILD_DIR/package"

# Create and activate virtual environment
python3 -m venv "$BUILD_DIR/venv"
source "$BUILD_DIR/venv/bin/activate"

# Upgrade pip
pip install --upgrade pip

# Install dependencies to package directory
pip install -r requirements.txt -t "$BUILD_DIR/package"

# Copy source files to package directory
cp -r src/* "$BUILD_DIR/package/"

# Create deployment package
cd "$BUILD_DIR/package"
zip -r ../deployment.zip ./*

# Deploy to AWS Lambda
aws lambda update-function-code \
  --function-name paperpusher-chat \
  --zip-file fileb://"$BUILD_DIR/deployment.zip"

# Create environment variable JSON
ENV_JSON=$(cat << EOF
{
  "Variables": {
    "OPENAI_API_KEY": "${OPENAI_API_KEY}",
    "PINECONE_API_KEY": "${PINECONE_API_KEY}",
    "PINECONE_INDEX": "${PINECONE_INDEX}",
    "SUPABASE_PROJECT_URL": "${SUPABASE_PROJECT_URL}",
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}
EOF
)

# Update environment variables
aws lambda update-function-configuration \
  --function-name paperpusher-chat \
  --environment "${ENV_JSON}"

# Clean up
rm -rf "$BUILD_DIR"

echo "Deployment complete!" 