SERVICEWISE STAGE 3 - CORE PAGES RECOVERY

This patch replaces the five empty page components with working compatible reconstructions:
- Customers: rebuilt from live ticket customer data
- Agents: rebuilt from recovered users data plus live ticket workload
- Knowledge Base: recovered article structure and search
- Reports: live ticket status, priority and department summaries
- Settings: safe browser-local workspace preferences

It also:
- replaces recovery placeholder routes with the real pages
- adds missing Agents and Knowledge Base styles
- repairs CSS variable aliases used by recovered styles

Install:
cd /workspaces/compliant-crm/servicewise-crm
unzip servicewise_stage3_core_pages.zip
cp -r servicewise_stage3_core_pages/src/* src/
npm run build
npm run dev

After confirming all five sidebar pages open:
git add src/pages src/routes/AppRoutes.jsx src/styles/variables.css
git commit -m "Restore ServiceWise core management pages"
git push
