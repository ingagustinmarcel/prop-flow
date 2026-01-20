-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- UNITS TABLE
create table units (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  tenant text, -- Tenant Name
  rent numeric not null default 0,
  security_deposit numeric default 0,
  increment_percentage numeric default 0,
  lease_start date,
  lease_end date,
  last_increment_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- EXPENSES TABLE
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  unit_id uuid references units(id) on delete cascade not null,
  category text not null,
  amount numeric not null,
  date date not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PAYMENTS TABLE
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  unit_id uuid references units(id) on delete cascade not null,
  amount numeric not null,
  date_paid date not null,
  for_month text not null, -- Format YYYY-MM
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS)
-- This ensures users can only see their own data

alter table units enable row level security;
alter table expenses enable row level security;
alter table payments enable row level security;

-- Policies for UNITS
create policy "Users can view their own units" on units for select using (auth.uid() = user_id);
create policy "Users can insert their own units" on units for insert with check (auth.uid() = user_id);
create policy "Users can update their own units" on units for update using (auth.uid() = user_id);
create policy "Users can delete their own units" on units for delete using (auth.uid() = user_id);

-- Policies for EXPENSES
create policy "Users can view their own expenses" on expenses for select using (auth.uid() = user_id);
create policy "Users can insert their own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update their own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete their own expenses" on expenses for delete using (auth.uid() = user_id);

-- Policies for PAYMENTS
create policy "Users can view their own payments" on payments for select using (auth.uid() = user_id);
create policy "Users can insert their own payments" on payments for insert with check (auth.uid() = user_id);
create policy "Users can update their own payments" on payments for update using (auth.uid() = user_id);
create policy "Users can delete their own payments" on payments for delete using (auth.uid() = user_id);
