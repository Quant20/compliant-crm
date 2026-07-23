SERVICEWISE STAGE 2 - TICKET RECOVERY

This patch restores the latest preserved Tickets page and a compatible ticket data context.

It restores:
- professional ticket list view
- ticket statistics
- search, filters, sorting and pagination
- create ticket modal
- open ticket details
- close, reopen, irrelevant and delete actions
- customer messages, internal notes and activity functions expected by TicketDetails
- Supabase loading when available
- safe local-storage fallback if Supabase table/RLS is not ready

Copy without deleting existing folders:

cd /workspaces/compliant-crm/servicewise-crm
unzip servicewise_stage2_ticket_recovery.zip
cp -r servicewise_stage2_ticket_recovery/src/* src/

Then run:

npm run build
npm run dev

After confirming Tickets works:

git add src/context/TicketContext.jsx src/pages/Tickets/Tickets.jsx
git commit -m "Restore ServiceWise ticket workspace and data context"
git push
