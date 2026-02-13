#!/bin/bash
# init-artifact.sh: Initializes a new React + Vite project with Tailwind and shadcn/ui

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

# 1. Create Vite project
npm create vite@latest "$PROJECT_NAME" -- --template react-ts
cd "$PROJECT_NAME" || exit 1

# 2. Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Configure Tailwind
cat > tailwind.config.js <<EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# 4. Add Tailwind directives to index.css
cat > src/index.css <<EOF
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# 5. Setup shadcn/ui (basic)
# Note: In a real environment, we might want to pre-install some components.
# This script initializes the shadcn config.
echo "Initializing shadcn/ui..."
npx shadcn-ui@latest init -y

echo "✅ Project '$PROJECT_NAME' initialized successfully."
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev"
