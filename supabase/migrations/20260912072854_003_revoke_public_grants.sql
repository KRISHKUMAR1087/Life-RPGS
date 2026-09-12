/*
# Revoke PUBLIC execute grants on SECURITY DEFINER functions

PostgreSQL grants EXECUTE to PUBLIC by default for functions. The
previous migration only revoked from `anon` and `authenticated`
explicitly, but PUBLIC (which covers all roles) still grants access.

## Changes
1. Revoke EXECUTE from PUBLIC on all three SECURITY DEFINER functions.
2. Re-grant EXECUTE to authenticated only on complete_quest and purchase_item.
3. handle_new_user stays revoked from everyone — it's a trigger only.
*/

REVOKE EXECUTE ON FUNCTION complete_quest(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION purchase_item(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION complete_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_item(uuid) TO authenticated;
