SERVICEWISE CRM - STAGE 4 AUTHENTICATION RECOVERY

This stage restores:
- Login route and session restoration
- Supabase authentication with local demo fallback
- Protected application routes
- Admin-only Agents, Reports and Settings routes
- Role-aware sidebar navigation
- Logged-in user details in the header
- Working sign-out flow
- Unauthorized page
- Compatibility wrapper for components importing hooks/useAuth.js

INSTALL
1. Put this extracted folder inside the project root.
2. Run:

   cp -r servicewise_stage4_auth_recovery/src/* src/

3. Build and run:

   npm run build
   npm run dev

DEMO ACCOUNTS
Administrator:
admin@servicewise.com
admin123

Support Agent:
zubair@servicewise.com
agent123

The Support Agent can access Dashboard, Tickets, WhatsApp Inbox,
Customers and Knowledge Base. Agents, Reports and Settings are Admin-only.
