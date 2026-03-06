
-- Update the handle_new_user function to replace MT5 Standard, MT5 Financial, Deriv cTrader with Bitcoin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  demo_account_id UUID;
  real_account_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.accounts (user_id, type, balance, currency)
  VALUES (NEW.id, 'demo', 10000, 'USD')
  RETURNING id INTO demo_account_id;

  INSERT INTO public.accounts (user_id, type, balance, currency)
  VALUES (NEW.id, 'real', 0, 'USD')
  RETURNING id INTO real_account_id;

  -- Create default trading accounts for demo
  INSERT INTO public.trading_accounts (account_id, name, platform, balance) VALUES
    (demo_account_id, 'Bitcoin', 'Bitcoin', 0),
    (demo_account_id, 'Options trading', 'Options', 0);

  -- Create default trading accounts for real
  INSERT INTO public.trading_accounts (account_id, name, platform, balance) VALUES
    (real_account_id, 'Bitcoin', 'Bitcoin', 0),
    (real_account_id, 'Options trading', 'Options', 0);

  RETURN NEW;
END;
$function$;

-- Remove the three old account types for existing users and add Bitcoin
DELETE FROM public.trading_accounts WHERE platform IN ('MT5', 'cTrader');

INSERT INTO public.trading_accounts (account_id, name, platform, balance)
SELECT a.id, 'Bitcoin', 'Bitcoin', 0
FROM public.accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM public.trading_accounts ta WHERE ta.account_id = a.id AND ta.platform = 'Bitcoin'
);
