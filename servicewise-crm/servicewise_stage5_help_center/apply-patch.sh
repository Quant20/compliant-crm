#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
PATCH_ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_ROOT"

mkdir -p src/pages/HelpCenter
cp "$PATCH_ROOT/src/pages/HelpCenter/HelpCenter.jsx" src/pages/HelpCenter/HelpCenter.jsx
cp "$PATCH_ROOT/src/pages/HelpCenter/HelpCenter.css" src/pages/HelpCenter/HelpCenter.css
cp "$PATCH_ROOT/src/routes/AppRoutes.jsx" src/routes/AppRoutes.jsx
cp "$PATCH_ROOT/src/components/layout/Sidebar.jsx" src/components/layout/Sidebar.jsx
cp "$PATCH_ROOT/src/components/layout/Header.jsx" src/components/layout/Header.jsx
cp "$PATCH_ROOT/src/components/dashboard/QuickActions.jsx" src/components/dashboard/QuickActions.jsx

rm -rf src/pages/KnowledgeBase

echo "Help Center patch applied."
echo "Run: npm run build"
