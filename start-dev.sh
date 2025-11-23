#!/bin/bash

# REKT JUDGE - Development Server Launcher

echo "🖥️  REKT JUDGE - Starting development server..."
echo ""
echo "Opening terminal interface..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    echo ""
    echo "🌐 Server running at: http://localhost:8000"
    echo "📱 Press Ctrl+C to stop"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2"
    echo ""
    echo "🌐 Server running at: http://localhost:8000"
    echo "📱 Press Ctrl+C to stop"
    echo ""
    python -m SimpleHTTPServer 8000
else
    echo "❌ Python not found!"
    echo ""
    echo "Please install Python or use another web server:"
    echo "  - VS Code Live Server extension"
    echo "  - Node.js: npx serve"
    echo "  - Or open index.html directly in browser"
fi
