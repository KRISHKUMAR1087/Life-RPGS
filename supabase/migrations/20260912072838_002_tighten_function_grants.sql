/*
# Tighten SECURITY DEFINER function execute grants

## Changes
1. Revoke EXECUTE on complete_quest() and purchase_item() from anon role.
   These should only be callable by authenticated users — the functions
   use auth.uid() internally, so anon calls would fail anyway, but we
   tighten the surface area.
2. Revoke EXECUTE on handle_new_user() from both anon and authenticated.
   This is a trigger function, not meant to be called via the API.

## Security
- complete_quest and purchase_item: EXECUTE restricted to authenticated only.
- handle_new_user: EXECUTE revoked from all non-superuser roles (only called by the trigger).
*/

REVOKE EXECUTE ON FUNCTION complete_quest(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION purchase_item(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;
