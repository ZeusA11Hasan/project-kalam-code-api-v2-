-- Create a custom users table to store game-like progression data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  streak_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow the authenticated signup process to insert into this table
-- Note: In production, you'd usually use a Trigger on auth.users to do this automatically.
CREATE POLICY "Enable insert for authenticated users only"
  ON public.users
  FOR INSERT
  WITH CHECK (true);
