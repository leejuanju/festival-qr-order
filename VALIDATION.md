# Validation notes for v4

This package was prepared from the previous v3.1 project and includes the requested v4 UI/UX and workflow changes.

## Implemented

- Added a reusable back button component and placed it on admin, hall, kitchen, and QR print screens.
- Redesigned `/` as an operator home, not a customer-facing page.
- Added customer-facing order history for each table via the table order screen.
- Added table-session payment summary: total amount, paid amount, unpaid remaining amount.
- Added hall-side bulk payment confirmation for all unpaid orders in a table session.
- Kept individual order payment confirmation.
- Simplified kitchen board to only show `주문접수`, `조리중`, `준비완료`.
- Removed kitchen payment filters and payment badges from the kitchen screen.
- Ensured kitchen board groups orders by `created_at` ascending so orders appear in received order.
- Redesigned the top customer menu hero component with a cleaner modern layout.

## New/changed routes

- `GET /api/orders/table/[tableNumber]`: returns the current open table session, orders, and payment summary for customer order history.
- `PATCH /api/sessions/[id]/payment`: marks all unpaid, non-cancelled orders in a session as paid. Requires admin PIN.

## Build validation

The ChatGPT container used to prepare this ZIP could not resolve `registry.npmjs.org`, so `npm install` and `npm run build` could not be completed in-container.

A basic structural check was performed:

- JS/CSS file presence check
- Basic brace/parenthesis/bracket balance check across JS and CSS files
- Secret file exclusion check: `.env.local` is not included

Run locally:

```powershell
npm install
npm run build
npm run dev
```

If `npm run build` reports an error, copy the full error text and use it to patch the affected file.
