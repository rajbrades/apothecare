#!/bin/bash
echo "📋 Supabase Setup for Apotheca"
echo ""
echo "This script will help you set up your Supabase database."
echo ""
echo "Please have ready:"
echo "  1. Your Supabase Project URL"
echo "  2. Your Supabase anon/public key"
echo "  3. Your Database password"
echo ""
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read

echo ""
echo "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co):"
read SUPABASE_URL

echo "Enter your Supabase anon/public key:"
read SUPABASE_ANON_KEY

echo ""
echo "Creating .env.local file..."
cat > .env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENVEOF

echo "✅ .env.local created!"
echo ""
echo "To run the database migration:"
echo "  1. Go to your Supabase dashboard: $SUPABASE_URL"
echo "  2. Click 'SQL Editor' in the sidebar"
echo "  3. Click 'New query'"
echo "  4. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql"
echo "  5. Click 'Run'"
echo ""
echo "Setup complete! Run 'npm run dev' to start the server."
