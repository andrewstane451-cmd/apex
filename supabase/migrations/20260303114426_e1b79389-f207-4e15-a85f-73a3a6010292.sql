
-- Create user verifications table to track each verification step
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  country_verified BOOLEAN NOT NULL DEFAULT false,
  country_name TEXT,
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  location_verified BOOLEAN NOT NULL DEFAULT false,
  number_verified BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
ON public.user_verifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications"
ON public.user_verifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
ON public.user_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_verifications_updated_at
BEFORE UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create verification row on signup
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

  INSERT INTO public.trading_accounts (account_id, name, platform, balance) VALUES
    (demo_account_id, 'Bitcoin', 'Bitcoin', 0),
    (demo_account_id, 'Options trading', 'Options', 0);

  INSERT INTO public.trading_accounts (account_id, name, platform, balance) VALUES
    (real_account_id, 'Bitcoin', 'Bitcoin', 0),
    (real_account_id, 'Options trading', 'Options', 0);

  -- Auto-create verification record
  INSERT INTO public.user_verifications (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$function$;
