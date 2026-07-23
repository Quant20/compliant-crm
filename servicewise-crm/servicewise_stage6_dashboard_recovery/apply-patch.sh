#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
PATCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$PROJECT_ROOT/src"
cp -R "$PATCH_ROOT/src/." "$PROJECT_ROOT/src/"

# These were duplicate, older dashboard wrapper files and are no longer used.
rm -f "$PROJECT_ROOT/src/components/dashboard/Dashboard.jsx"
rm -f "$PROJECT_ROOT/src/components/dashboard/Dashboard.css"

echo "Stage 6 dashboard recovery applied."
echo "Run: npm run build"
echo "Then: npm run dev"
