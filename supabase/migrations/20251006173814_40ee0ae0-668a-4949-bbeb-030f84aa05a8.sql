-- Add region_id and area_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
ADD COLUMN area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_profiles_region_id ON public.profiles(region_id);
CREATE INDEX idx_profiles_area_id ON public.profiles(area_id);

-- Update RLS policies to allow users to view their own region and area
-- The existing policies should already cover this, but we ensure read access
CREATE POLICY "Users can view profiles with region/area info" 
ON public.profiles 
FOR SELECT 
USING (true);