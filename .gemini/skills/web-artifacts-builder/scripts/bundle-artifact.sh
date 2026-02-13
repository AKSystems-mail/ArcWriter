#!/bin/bash
# bundle-artifact.sh: Bundles the React app into a single HTML file

if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Run this from the project root."
  exit 1
fi

# 1. Install bundling plugin if not present
if ! grep -q "vite-plugin-singlefile" package.json; then
  echo "Installing vite-plugin-singlefile..."
  npm install -D vite-plugin-singlefile
fi

# 2. Update vite.config.ts to use the plugin
# This is a bit tricky to automate perfectly with sed, so we'll overwrite it if it's simple.
cat > vite.config.ts <<EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
})
EOF

# 3. Build the project
echo "Building project..."
npm run build

# 4. Final output
if [ -f "dist/index.html" ]; then
  cp dist/index.html ../bundle.html
  echo "✅ Artifact bundled successfully to bundle.html"
else
  echo "❌ Error: Build failed or index.html not found in dist/"
  exit 1
fi
