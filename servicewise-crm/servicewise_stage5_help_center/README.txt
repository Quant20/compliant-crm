SERVICEWISE CRM — STAGE 5 HELP CENTER RENAME

This patch changes Knowledge Base to Help Center everywhere:
- Folder: src/pages/HelpCenter/
- Component: HelpCenter
- Route: /help-center
- Sidebar label: Help Center
- Header title: Help Center
- Dashboard quick action: Help Center

The old /knowledge-base URL redirects to /help-center.
The installer removes the obsolete src/pages/KnowledgeBase folder.

Apply from the ServiceWise project root:

  unzip -o servicewise_stage5_help_center.zip
  bash servicewise_stage5_help_center/apply-patch.sh .
  npm run build
  npm run dev
