-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new RLS policy for profile access
CREATE POLICY "Role-based profile access"
ON profiles FOR SELECT
TO authenticated
USING (
  CASE 
    -- Admins and agents can see all profiles
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'agent')
    ) THEN true
    -- Customers can only see their own profile
    ELSE id = auth.uid()
  END
);