CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  age INTEGER,
  gender TEXT,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  fitness_goal TEXT DEFAULT 'maintain',
  activity_level TEXT DEFAULT 'moderate',
  target_weight_kg DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT DEFAULT 'snack',
  food_name TEXT NOT NULL,
  image_url TEXT,
  calories INTEGER DEFAULT 0,
  protein DECIMAL(6,2) DEFAULT 0,
  carbs DECIMAL(6,2) DEFAULT 0,
  fats DECIMAL(6,2) DEFAULT 0,
  fiber DECIMAL(6,2) DEFAULT 0,
  sugar DECIMAL(6,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  vitamins JSONB DEFAULT '{}',
  minerals JSONB DEFAULT '{}',
  notes TEXT,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_intake TO authenticated;
GRANT ALL ON public.water_intake TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_history TO authenticated;
GRANT ALL ON public.weight_history TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own food logs" ON public.food_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own water intake" ON public.water_intake FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own weight history" ON public.weight_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();