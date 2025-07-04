#!/bin/bash

# Test Veo 2 API Access
echo "🔍 Testing Veo 2 API Access..."
echo ""

# Load API key from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not found. Please set it in .env file"
    exit 1
fi

echo "✅ API Key found: ${GEMINI_API_KEY:0:10}..."
echo ""

# Test 1: List available models
echo "📋 Listing available models..."
echo "================================"
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | grep -E "(name|displayName)" | grep -i veo

echo ""
echo ""

# Test 2: Try to call Veo 2 directly
echo "🎥 Testing Veo 2 video generation..."
echo "===================================="

# Create request body
cat > veo2-request.json << EOF
{
  "prompt": "A beautiful sunset over the ocean with gentle waves",
  "config": {
    "numberOfVideos": 1,
    "aspectRatio": "16:9",
    "personGeneration": "dont_allow",
    "durationSeconds": 5
  }
}
EOF

# Make the request
echo "Making request to Veo 2 API..."
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateVideos?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @veo2-request.json \
  -w "\n\nHTTP Status: %{http_code}")

echo "$RESPONSE"
echo ""

# Clean up
rm -f veo2-request.json

# Test 3: Check if it's using the correct endpoint format
echo ""
echo "🔧 Testing alternative endpoint formats..."
echo "=========================================="

# Try predictLongRunning endpoint (from Python example)
cat > veo2-request-alt.json << EOF
{
  "instances": [{
    "prompt": "A beautiful sunset over the ocean with gentle waves"
  }],
  "parameters": {
    "aspectRatio": "16:9",
    "personGeneration": "dont_allow",
    "numberOfVideos": 1,
    "durationSeconds": 5
  }
}
EOF

echo "Trying predictLongRunning endpoint..."
RESPONSE_ALT=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @veo2-request-alt.json \
  -w "\n\nHTTP Status: %{http_code}")

echo "$RESPONSE_ALT"
echo ""

# Clean up
rm -f veo2-request-alt.json

echo ""
echo "📝 Summary:"
echo "==========="
echo "If you see 403 errors: Veo 2 access might not be enabled for your API key"
echo "If you see 404 errors: The endpoint or model name might be incorrect"
echo "If you see 400 errors: The request format might be incorrect"
echo ""
echo "Veo 2 requirements:"
echo "- Paid Google Cloud account"
echo "- Veo 2 API access enabled (might require allowlisting)"
echo "- Proper billing setup"
