-- Stop vendors changing their own admin, plan, verification and bank fields.
--
-- The "Users can update their own profile" RLS policy (scripts/011) allows any
-- column on your own row, and the anon key + a user's session can call
-- PostgREST directly from the browser. So a vendor could set is_admin, pick a
-- paid plan_id, or mark themselves payout_verified. RLS can't restrict
-- columns; this trigger does.
--
-- Only requests made with a user's JWT (role "authenticated" or "anon") are
-- blocked. Server routes using the service-role key, the SQL editor, and the
-- signup trigger (handle_new_user) are unaffected.
--
-- Deploy the app code that ships with this file BEFORE running it: the NIN,
-- bank and admin routes now write these columns with the service-role client.

CREATE OR REPLACE FUNCTION public.protect_privileged_user_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.is_admin, false)
       OR NEW.role = 'admin'
       OR coalesce(NEW.payout_verified, false)
       OR NEW.plan_id IS NOT NULL
       OR NEW.legal_name IS NOT NULL
       OR coalesce(NEW.admin_kyc_approved, false)
    THEN
      RAISE EXCEPTION 'Not allowed to set privileged user fields' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_admin           IS DISTINCT FROM OLD.is_admin
     OR NEW.role               IS DISTINCT FROM OLD.role
     OR NEW.plan_id            IS DISTINCT FROM OLD.plan_id
     OR NEW.payout_verified    IS DISTINCT FROM OLD.payout_verified
     OR NEW.legal_name         IS DISTINCT FROM OLD.legal_name
     OR NEW.kyc_status         IS DISTINCT FROM OLD.kyc_status
     OR NEW.admin_kyc_approved IS DISTINCT FROM OLD.admin_kyc_approved
     OR NEW.bank_name          IS DISTINCT FROM OLD.bank_name
     OR NEW.account_number     IS DISTINCT FROM OLD.account_number
     OR NEW.account_name       IS DISTINCT FROM OLD.account_name
     OR NEW.auth_id            IS DISTINCT FROM OLD.auth_id
  THEN
    RAISE EXCEPTION 'Not allowed to change privileged user fields' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_privileged_user_columns ON public.users;
CREATE TRIGGER protect_privileged_user_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_user_columns();
