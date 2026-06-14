#!/bin/bash
# Double-click this file (or run it in Terminal) to launch Pitch Perfect.
# It starts a tiny local web server and opens the app in Google Chrome.

cd "$(dirname "$0")"
PORT=8723

# Start a static server in the background (Python 3 ships with macOS).
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!

# Give it a moment, then open Chrome (fall back to default browser).
sleep 1
URL="http://localhost:$PORT/index.html"
if open -a "Google Chrome" "$URL" 2>/dev/null; then :; else open "$URL"; fi

echo "Pitch Perfect is running at $URL"
echo "Close this window (or press Ctrl+C) to stop the server."

# Keep the server alive until this window/script is closed.
wait $SERVER_PID
