# Tipsy Tiger - Supabase Setup Guide

## Step 1: Create Database Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (nzdvgphyrkuswqcvfenn)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `supabase-setup.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- ✅ `tracking_entries` table
- ✅ Row Level Security policies
- ✅ Indexes for performance

## Step 2: Verify Setup

1. Go to **Table Editor** in Supabase
2. You should see `tracking_entries` table
3. Check that it has these columns:
   - `id` (uuid)
   - `user_id` (uuid)
   - `date` (date)
   - `sober` (boolean)
   - `drinks` (integer)
   - `occasion` (text)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Step 3: Test the App

1. Open `index.html` in your browser
2. You should see a **Sign In / Sign Up** form
3. Click **Sign Up** and create an account with:
   - Your email
   - A password (at least 6 characters)
4. Check your email for confirmation (if email confirmation is enabled)
5. Sign in with your credentials
6. Start tracking!

## Troubleshooting

### If you see "Error loading data"
- Make sure you ran the SQL script
- Check that Row Level Security is enabled
- Verify the table exists in Table Editor

### If authentication doesn't work
- Check your Supabase project URL and anon key in `script.js`
- Make sure email auth is enabled in Supabase Settings → Authentication

### If you want to disable email confirmation
1. Go to Supabase Dashboard
2. Settings → Authentication
3. Disable "Enable email confirmations"

## That's it! 🎉

Your app is now connected to Supabase and ready to use!
