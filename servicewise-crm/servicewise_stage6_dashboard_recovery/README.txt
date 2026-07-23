SERVICEWISE CRM — STAGE 6 DASHBOARD RECOVERY

This patch restores a live dashboard connected to TicketContext.

It includes:
- Live ticket KPI cards
- Horizontal ticket analytics
- Recent tickets with navigation
- Recent ticket activity
- Working New Ticket action
- Refresh action
- Responsive blue/green ServiceWise styling
- Removal of the unused duplicate dashboard component

Apply from the project root:

  unzip -o servicewise_stage6_dashboard_recovery.zip
  bash servicewise_stage6_dashboard_recovery/apply-patch.sh .

Then run:

  npm run build
  npm run dev
