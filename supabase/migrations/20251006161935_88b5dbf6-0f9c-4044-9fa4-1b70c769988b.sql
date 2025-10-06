-- Create regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pastor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create areas table  
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  pastor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add region and area references to churches table
ALTER TABLE public.churches 
ADD COLUMN region_id UUID REFERENCES public.regions(id),
ADD COLUMN area_id UUID REFERENCES public.areas(id),
ADD COLUMN pastor_id UUID REFERENCES auth.users(id);

-- Add responsible to assistance_groups table (church_id already exists)
ALTER TABLE public.assistance_groups 
ADD COLUMN responsible_id UUID REFERENCES auth.users(id);

-- Add assistance_group reference to visitors table  
ALTER TABLE public.visitors
ADD COLUMN assistance_group_id UUID REFERENCES public.assistance_groups(id);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regions
CREATE POLICY "Everyone can view regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for areas  
CREATE POLICY "Everyone can view areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Admins can manage areas" ON public.areas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update triggers for timestamps
CREATE TRIGGER update_regions_updated_at
BEFORE UPDATE ON public.regions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_areas_updated_at
BEFORE UPDATE ON public.areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();