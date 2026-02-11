# Apotheca

**AI Clinical Decision Support for Functional Medicine**

Evidence-based clinical intelligence for MDs, DOs, NPs, PAs, DCs, and NDs practicing functional and integrative medicine.

## Features

- 🧠 **AI Clinical Chat** — Evidence-cited responses with functional medicine expertise
- 🔬 **Deep Consult Mode** — Extended analysis using Claude Opus for complex cases
- 📊 **Dual-Range Lab Interpretation** — Conventional and functional/optimal reference ranges
- 👥 **Patient Context Threading** — Link conversations to patient records
- 📝 **Visit Documentation** — SOAP notes with IFM Matrix integration
- 💊 **Protocol Generation** — Supplement dosing based on evidence
- 🔒 **HIPAA Compliant** — Row-Level Security + audit logging
- ✨ **Streaming Responses** — Real-time AI output with word count guidance

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4
- **Database**: PostgreSQL with pgvector (Supabase Cloud for production)
- **Auth**: Supabase Auth with Row-Level Security
- **AI**: Anthropic Claude API (Sonnet 4 + Opus 4)
- **Hosting**: AWS Amplify (production) / localhost (dev)
- **Payments**: Stripe

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ with pgvector extension
- Anthropic API key
- Supabase account (for production)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/rajbrades/apotheca.git
cd apotheca
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Click "New project"
3. Choose a name and strong database password
4. Wait ~2 minutes for project creation

### 3. Enable pgvector extension

1. In your Supabase dashboard, go to **Database → Extensions**
2. Search for **pgvector** and enable it
3. Wait for it to activate

### 4. Run the database migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor and click "Run"

**Note:** Skip the first few lines (`CREATE EXTENSION`) since you already enabled extensions via the UI.

### 5. Set up environment variables

1. In your Supabase dashboard, go to **Settings → API**
2. Copy your **Project URL**, **anon public key**, and **secret key**
3. Get your Anthropic API key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
4. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Apotheca
```

**⚠️ Security:** Never commit `.env.local` to git or share these keys publicly.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create your account

1. Click "Get Started" or go to `/auth/register`
2. Fill in your details and create an account
3. Complete the onboarding with your credentials
4. Start chatting!

## Environment Variables Reference

### Required

```bash
# Supabase (get from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx  # or eyJhbGci... format
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx           # or eyJhbGci... format

# Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Apotheca
```

### Optional (for local PostgreSQL)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apotheca
```

### Optional (for payments - not required for development)

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

## Troubleshooting

### "Invalid API key" error

- Make sure all three credentials (URL + anon key + secret key) are from the **same** Supabase project
- Verify there are no extra spaces, quotes, or line breaks in your `.env.local`
- After updating `.env.local`, clear the cache and restart:
  ```bash
  rm -rf .next
  npm run dev
  ```
- Hard refresh your browser (Cmd+Shift+R)

### "Stream interrupted" error in chat

- Verify you have a valid `ANTHROPIC_API_KEY` in `.env.local`
- Check the server logs for API errors
- Make sure your Anthropic account has credits

### Supabase migration errors

- Enable pgvector extension via the Supabase UI **before** running migrations
- Skip `CREATE EXTENSION` lines if you already enabled extensions via UI
- Check that your database password is correct

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # Clinical chat endpoint
│   │   └── ...
│   ├── auth/              # Auth pages (login, register, callback)
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Main dashboard
│   ├── labs/              # Lab interpretation
│   ├── patients/          # Patient management
│   ├── visits/            # Visit documentation
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Shared UI components
│   ├── chat/              # Chat-specific components
│   ├── labs/              # Lab-specific components
│   ├── visits/            # Visit-specific components
│   ├── patients/          # Patient-specific components
│   └── layout/            # Layout components (sidebar, header)
├── lib/
│   ├── supabase/          # Supabase client utilities
│   ├── ai/                # Anthropic client + prompts
│   └── rag/               # RAG pipeline utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── styles/                # Additional styles
```

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema including:
- Practitioners (users with credential verification)
- Patients
- Conversations + Messages (with citation metadata)
- Visits (SOAP notes, IFM Matrix)
- Lab Reports + Biomarker Results (dual-range system)
- Clinical Reviews
- Evidence Documents + Chunks (RAG vector store)
- Biomarker Reference Ranges (pre-seeded with functional ranges)
- Audit Logs (HIPAA compliance)
- Row-Level Security policies on all tables

## Key Features

- [x] Clinical chat with evidence-cited responses
- [x] Streaming AI responses with real-time output
- [x] Deep Consult mode (Claude Opus for complex cases)
- [x] Word count guidance (1500 word soft target)
- [x] Supabase Auth with credential verification
- [x] HIPAA audit logging
- [x] Free tier with 2 queries/day limit
- [ ] Patient management with context threading
- [ ] Multi-modal lab interpretation (blood, stool, saliva)
- [ ] Functional vs. conventional range display
- [ ] Visit documentation with SOAP note generation
- [ ] Protocol generation with supplement dosing
- [ ] Stripe subscription ($89/mo Pro tier)

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run db:migrate # Run database migrations
```

## Contributing

This is a private project. Please contact the repository owner for access.

## License

Proprietary — All rights reserved.
