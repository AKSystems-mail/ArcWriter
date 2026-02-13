---
name: web-artifacts-builder
description: Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components.
---

# Web Artifacts Builder

## Overview

The Web Artifacts Builder skill provides a structured workflow and a set of scripts to create high-quality, single-file HTML artifacts from a modern React/TypeScript/Tailwind/shadcn codebase. This is ideal for complex interactive components that need to be shared in a conversation as a standalone artifact.

## Workflow

### 1. Initialize the Frontend Project
Use the initialization script to scaffold a new React project with Tailwind CSS and shadcn/ui configured.

```bash
bash .agent/skills/web-artifacts-builder/scripts/init-artifact.sh <project-name>
```

### 2. Develop Your Artifact
Build your React application in the newly created directory. Use `npm run dev` to see changes locally.
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui.
- **Guidelines**: Avoid "AI slop" (excessive centered layouts, purple gradients, uniform rounded corners, Inter font). Aim for professional, unique designs.

### 3. Bundle into a Single HTML File
Once development is complete, use the bundling script to generate a self-contained HTML file.

```bash
bash .agent/skills/web-artifacts-builder/scripts/bundle-artifact.sh
```

This creates `bundle.html` in the project root, containing all JS, CSS, and assets inlined.

### 4. Present to User
Provide the `bundle.html` file to the user so it can be viewed as an artifact.

## Guidelines & Best Practices

- **shadcn/ui**: Use the pre-installed components or add new ones using `npx shadcn-ui@latest add [component]`.
- **State Management**: Use React hooks (useState, useReducer, useContext) for internal state.
- **Single File Requirement**: The final output must be a single `bundle.html`. Ensure all assets (images, fonts) are either base64 encoded or accessible via CDN. The bundling script handles local JS and CSS.
- **Testing**: Test the artifact visually before final delivery if possible, but prioritize speed.

## Resources

- **scripts/init-artifact.sh**: Scaffolds the React project.
- **scripts/bundle-artifact.sh**: Bundles the project into a single HTML file.
- **assets/**: Contains configuration templates and boilerplate.
