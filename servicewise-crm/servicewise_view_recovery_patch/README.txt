SERVICEWISE VIEW RECOVERY PATCH

This patch restores the application shell first:
- correct nested routes
- working dashboard/tickets/WhatsApp routes
- visible left navigation and header
- responsive desktop/mobile shell
- removes imports of the three empty CSS files

Copy the src folder over the project src folder.
Do not delete any existing folders.

Commands from project root:

cp -r servicewise_view_recovery_patch/src/* src/
npm run build
npm run dev

After confirming the view, commit:

git add src/main.jsx src/routes/AppRoutes.jsx src/components/layout src/styles/global.css
git commit -m "Restore ServiceWise application shell and routing"
git push
