-- Skin Flows Table
-- Stores results from AI Dermatology tests (Skin MBTI, Skin Age, UV Score, etc.)

create table if not exists public.skin_flows (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null, -- Nullable for anonymous users
  flow_type text not null, -- 'skin_mbti', 'skin_age', 'uv_score', 'cleansing_lab', 'trouble_map'
  answers_json jsonb, -- Raw answers from the user
  result_json jsonb, -- Final result + CTA data
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.skin_flows enable row level security;

-- Users can view their own flows
create policy "Users can view own skin flows" 
  on public.skin_flows for select 
  using (auth.uid() = user_id);

-- Policy for updating: Users can update their own flows (e.g. linking after login)
create policy "Users can update own skin flows" 
  on public.skin_flows for update 
  using (auth.uid() = user_id);

-- Note: Insertions are handled server-side via API (Service Role), so explicit insert policy for public is not strictly needed if only API writes.
-- However, if client-side inserts were needed:
-- create policy "Enable insert for authenticated users only" on public.skin_flows for insert with check (auth.uid() = user_id);
