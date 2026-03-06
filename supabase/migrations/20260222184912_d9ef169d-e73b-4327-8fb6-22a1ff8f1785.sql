-- Allow users to update their own trading accounts (needed for bot balance changes and transfers)
CREATE POLICY "Users can update own trading accounts"
ON public.trading_accounts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM accounts
  WHERE accounts.id = trading_accounts.account_id
  AND accounts.user_id = auth.uid()
));
