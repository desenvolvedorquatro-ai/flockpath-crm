-- Remove the current policy that allows all authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete visitors" ON public.visitors;

-- Create new policy that only allows admins and diaconos to delete visitors
CREATE POLICY "Only admins and diaconos can delete visitors"
ON public.visitors FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'Diacono')
);