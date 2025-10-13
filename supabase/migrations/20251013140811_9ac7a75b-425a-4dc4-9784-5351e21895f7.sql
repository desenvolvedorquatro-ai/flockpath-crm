-- Fix foreign key for visitor_interactions.created_by to point to profiles instead of auth.users
ALTER TABLE visitor_interactions
DROP CONSTRAINT IF EXISTS visitor_interactions_created_by_fkey;

-- Create new FK pointing to profiles
ALTER TABLE visitor_interactions
ADD CONSTRAINT visitor_interactions_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_visitor_interactions_created_by 
ON visitor_interactions(created_by);