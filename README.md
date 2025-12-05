# Tipsy Tiger 🐅

A fun and colorful web app to help you track your personal health goals. Track alcohol, coffee, or even your fizzy drinks intake - whatever makes sense for you!

## Features

- 📅 **Calendar Tracking** - Visual calendar to track your daily intake
- 🎨 **Color-Coded System** - Green (sober) to Red (5+ drinks) gradient
- 📊 **Multiple Views**:
  - Month view - Detailed monthly calendar
  - Year view - Overview of all 12 months
  - Date range - Custom date range selection
  - Analytics - Insights and patterns
- 📝 **Optional Notes** - Add occasion notes to your entries
- 💡 **Pattern Insights** - Discover your drinking patterns
- 💾 **Local Storage** - All data saved locally in your browser

## How to Use

1. Enter your name when prompted
2. Click on any date in the calendar
3. Choose "Yes" if sober, or "Nah" if you had drinks
4. If you had drinks, enter the number of glasses/shots
5. Optionally add a note about the occasion
6. View your progress in the Analytics section

## Color Coding

- 🟢 **Green** - Sober (0 drinks)
- 🟡 **Yellow** - 1 drink
- 🟠 **Orange** - 2-4 drinks
- 🔴 **Red** - 5+ drinks

## Tech Stack

- Pure HTML, CSS, and JavaScript
- Supabase for authentication and database
- LocalStorage fallback for offline use

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. Sign up or sign in with your email
4. Start tracking!

### Database Setup

**IMPORTANT:** Before using the app, you must set up the database:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Copy and paste the contents of `supabase-setup.sql`
5. Click **Run**

See `SETUP.md` for detailed instructions.

## Live Demo

Simply open `index.html` in your browser to start using the app!

## License

vibe coded by [@ravicharavi](https://github.com/ravicharavi)
