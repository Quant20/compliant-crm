#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ServiceWise CRM — Frontend Patch Script (Phase 1)
# ═══════════════════════════════════════════════════════════════
# This script replaces the 4 frontend files with the updated
# versions that connect to the backend API (port 5000).
#
# USAGE:  cd /workspaces/compliant-crm-working/servicewise-crm
#         bash /path/to/apply-patch.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(pwd)"

echo "╔══════════════════════════════════════════════╗"
echo "║  ServiceWise CRM — Frontend Patch (Phase 1)  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Target directory: $TARGET_DIR"
echo ""

# Verify we're in the CRM project root
if [ ! -f "$TARGET_DIR/package.json" ] || [ ! -d "$TARGET_DIR/src" ]; then
  echo "❌ ERROR: Not in the servicewise-crm project root."
  echo "   Make sure you run this from the project root directory."
  echo "   cd /workspaces/compliant-crm-working/servicewise-crm"
  exit 1
fi

# Verify source files exist
for f in Settings.jsx Settings.css authService.js Header.jsx; do
  if [ ! -f "$SCRIPT_DIR/src/pages/Settings/$f" ] && [ ! -f "$SCRIPT_DIR/src/services/$f" ] && [ ! -f "$SCRIPT_DIR/src/components/layout/$f" ]; then
    echo "❌ ERROR: Source file $f not found in $SCRIPT_DIR"
    exit 1
  fi
done

# Back up originals
BACKUP_DIR="$TARGET_DIR/.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/src/pages/Settings" "$BACKUP_DIR/src/services" "$BACKUP_DIR/src/components/layout" "$BACKUP_DIR/src/styles"

echo "📦 Backing up originals to $BACKUP_DIR ..."
[ -f "$TARGET_DIR/src/pages/Settings/Settings.jsx" ] && cp "$TARGET_DIR/src/pages/Settings/Settings.jsx" "$BACKUP_DIR/src/pages/Settings/"
[ -f "$TARGET_DIR/src/pages/Settings/Settings.css" ] && cp "$TARGET_DIR/src/pages/Settings/Settings.css" "$BACKUP_DIR/src/pages/Settings/"
[ -f "$TARGET_DIR/src/services/authService.js" ] && cp "$TARGET_DIR/src/services/authService.js" "$BACKUP_DIR/src/services/"
[ -f "$TARGET_DIR/src/components/layout/Header.jsx" ] && cp "$TARGET_DIR/src/components/layout/Header.jsx" "$BACKUP_DIR/src/components/layout/"
[ -f "$TARGET_DIR/src/styles/authShell.css" ] && cp "$TARGET_DIR/src/styles/authShell.css" "$BACKUP_DIR/src/styles/"
echo "   ✓ Backups saved"
echo ""

# Copy new files
echo "🔄 Applying patches ..."

cp "$SCRIPT_DIR/src/pages/Settings/Settings.jsx" "$TARGET_DIR/src/pages/Settings/Settings.jsx"
echo "   ✓ src/pages/Settings/Settings.jsx"

cp "$SCRIPT_DIR/src/pages/Settings/Settings.css" "$TARGET_DIR/src/pages/Settings/Settings.css"
echo "   ✓ src/pages/Settings/Settings.css"

cp "$SCRIPT_DIR/src/services/authService.js" "$TARGET_DIR/src/services/authService.js"
echo "   ✓ src/services/authService.js"

cp "$SCRIPT_DIR/src/components/layout/Header.jsx" "$TARGET_DIR/src/components/layout/Header.jsx"
echo "   ✓ src/components/layout/Header.jsx"

[ -f "$SCRIPT_DIR/src/styles/authShell.css" ] && cp "$SCRIPT_DIR/src/styles/authShell.css" "$TARGET_DIR/src/styles/authShell.css"
echo "   ✓ src/styles/authShell.css"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Patch applied successfully!             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Backups saved to: $BACKUP_DIR"
echo ""
echo "If Vite is running, it will auto-reload."
echo "If not, start it with: npm run dev -- --host 0.0.0.0 --port 5174"
echo ""
echo "To undo: cp $BACKUP_DIR/src/pages/Settings/Settings.jsx src/pages/Settings/"
