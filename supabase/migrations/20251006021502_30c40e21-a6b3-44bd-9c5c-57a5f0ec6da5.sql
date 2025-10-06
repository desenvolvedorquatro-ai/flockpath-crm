-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'pastor', 'group_leader', 'user');

-- Create enum for visitor status (funil)
CREATE TYPE public.visitor_status AS ENUM (
  'visitante',
  'interessado',
  'em_acompanhamento',
  'novo_membro',
  'engajado'
);

-- Create churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pastor_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, church_id, role)
);

-- Create assistance groups table
CREATE TABLE public.assistance_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visitors table
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.assistance_groups(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  first_visit_date DATE DEFAULT CURRENT_DATE,
  invited_by TEXT,
  status visitor_status DEFAULT 'visitante',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visitor history table
CREATE TABLE public.visitor_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  contacted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visitor event attendance table
CREATE TABLE public.visitor_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  attended BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visitor_id, event_id)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has role in specific church
CREATE OR REPLACE FUNCTION public.has_role_in_church(_user_id UUID, _church_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND church_id = _church_id
      AND role = _role
  )
$$;

-- Create function to get user's church
CREATE OR REPLACE FUNCTION public.get_user_church(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistance_groups_updated_at
  BEFORE UPDATE ON public.assistance_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for churches
CREATE POLICY "Admins can view all churches"
  ON public.churches FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their church"
  ON public.churches FOR SELECT
  TO authenticated
  USING (id = public.get_user_church(auth.uid()));

CREATE POLICY "Admins can insert churches"
  ON public.churches FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update churches"
  ON public.churches FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assistance_groups
CREATE POLICY "Users can view groups in their church"
  ON public.assistance_groups FOR SELECT
  TO authenticated
  USING (
    church_id = public.get_user_church(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Pastors can manage groups in their church"
  ON public.assistance_groups FOR ALL
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'pastor') OR
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for visitors
CREATE POLICY "Users can view visitors in their church"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (
    church_id = public.get_user_church(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Group leaders can view their group visitors"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.assistance_groups
      WHERE leader_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert visitors in their church"
  ON public.visitors FOR INSERT
  TO authenticated
  WITH CHECK (church_id = public.get_user_church(auth.uid()));

CREATE POLICY "Pastors and group leaders can update visitors"
  ON public.visitors FOR UPDATE
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'pastor') OR
    public.has_role(auth.uid(), 'admin') OR
    group_id IN (
      SELECT id FROM public.assistance_groups
      WHERE leader_id = auth.uid()
    )
  );

-- RLS Policies for visitor_history
CREATE POLICY "Users can view history for visitors in their church"
  ON public.visitor_history FOR SELECT
  TO authenticated
  USING (
    visitor_id IN (
      SELECT id FROM public.visitors
      WHERE church_id = public.get_user_church(auth.uid())
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert visitor history"
  ON public.visitor_history FOR INSERT
  TO authenticated
  WITH CHECK (
    visitor_id IN (
      SELECT id FROM public.visitors
      WHERE church_id = public.get_user_church(auth.uid())
    )
  );

-- RLS Policies for events
CREATE POLICY "Users can view events in their church"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    church_id = public.get_user_church(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Pastors can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'pastor') OR
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for visitor_attendance
CREATE POLICY "Users can view attendance in their church"
  ON public.visitor_attendance FOR SELECT
  TO authenticated
  USING (
    visitor_id IN (
      SELECT id FROM public.visitors
      WHERE church_id = public.get_user_church(auth.uid())
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert attendance"
  ON public.visitor_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    visitor_id IN (
      SELECT id FROM public.visitors
      WHERE church_id = public.get_user_church(auth.uid())
    )
  );