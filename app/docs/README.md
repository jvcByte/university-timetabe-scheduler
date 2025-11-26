# Documentation Pages

This directory contains the Next.js pages for viewing documentation in the web application.

## Structure

```
app/docs/
├── page.tsx                    # Main documentation landing page
├── user-guide/
│   └── page.tsx               # User Guide viewer
├── solver-algorithm/
│   └── page.tsx               # Solver Algorithm documentation viewer
├── architecture/
│   └── page.tsx               # Architecture documentation viewer
├── api/
│   └── page.tsx               # API Documentation viewer
├── index/
│   └── page.tsx               # Documentation Index viewer
└── quick-start/
    └── page.tsx               # Quick Start guide
```

## Components

- **MarkdownViewer** (`components/markdown-viewer.tsx`) - Renders markdown content with syntax highlighting
- **DashboardHeader** - Updated to include "Documentation" link

## Features

- ✅ Beautiful markdown rendering with syntax highlighting
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Code syntax highlighting (Prism)
- ✅ GitHub Flavored Markdown (tables, task lists, etc.)
- ✅ Download markdown files
- ✅ Navigation between documentation pages
- ✅ Accessible from all authenticated user roles

## Access

**Public Access** - No authentication required! Anyone can access the documentation at:
- `/docs` - Main documentation page
- `/docs/user-guide` - User Guide
- `/docs/solver-algorithm` - Algorithm details
- `/docs/architecture` - System architecture
- `/docs/api` - API reference
- `/docs/index` - Documentation index
- `/docs/quick-start` - Quick start guide

This makes the documentation accessible to:
- Prospective users evaluating the system
- Developers integrating with the API
- System administrators during setup
- All authenticated users (Admin, Faculty, Student)

## API Routes

- `/api/docs/[filename]` - Serves markdown files for download

## Dependencies

- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support
- `react-syntax-highlighter` - Code syntax highlighting
- `@types/react-syntax-highlighter` - TypeScript types
