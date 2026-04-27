#!/bin/bash

# ═══════════════════════════════════════════════════════════
# E-COM Quick Start Script
# ═══════════════════════════════════════════════════════════

echo ""
echo "✅ E-Com MongoDB Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found! Please install Node.js from nodejs.org"
    exit 1
fi

echo "✅ npm found"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Setup .env if missing
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "❌ IMPORTANT: Update .env with your MongoDB URI!"
    echo ""
    echo "Edit .env file now (press Enter when done)..."
    read
else
    echo "✅ .env file found"
    echo ""
fi

# Start server
echo "🚀 Starting MongoDB E-Com server..."
echo ""
echo "Server will run on: http://localhost:5000"
echo "API: http://localhost:5000/api/health"
echo "Frontend: Open index.html in browser"
echo ""

npm start
