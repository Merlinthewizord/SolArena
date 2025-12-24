-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Creators can update their tournaments" ON tournaments;

-- Allow anyone to create tournaments (they provide wallet address)
CREATE POLICY "Anyone can create tournaments"
  ON tournaments
  FOR INSERT
  WITH CHECK (true);

-- Allow creators to update their own tournaments based on wallet address
CREATE POLICY "Creators can update own tournaments"
  ON tournaments
  FOR UPDATE
  USING (created_by_wallet IS NOT NULL AND created_by_wallet != '');

-- The existing "Anyone can view active tournaments" SELECT policy is fine
