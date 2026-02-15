# Contributing & Development Guidelines

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 17 with pgvector
- Anthropic API key

### Local Development

```bash
git clone https://github.com/rajbrades/apotheca.git
cd apotheca
npm install
cp .env.example .env.local
# Fill in .env.local
npm run dev
```

### Database

```bash
# First time
createdb apotheca
psql apotheca -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql apotheca -f supabase/migrations/001_initial_schema.sql

# Reset database
dropdb apotheca && createdb apotheca
psql apotheca -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql apotheca -f supabase/migrations/001_initial_schema.sql
```

## Code Conventions

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- Use explicit types — avoid `any`
- Database types are in `src/types/database.ts`
- Prefer `interface` for object shapes, `type` for unions and intersections

### File Naming

- Components: `PascalCase.tsx` (e.g., `ChatMessage.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatBiomarker.ts`)
- API routes: `route.ts` inside the appropriate directory
- Types: `camelCase.ts` with exported `PascalCase` interfaces

### Component Structure

```typescript
// 1. Imports
import { useState } from "react";

// 2. Types
interface Props {
  message: Message;
  onReply: (content: string) => void;
}

// 3. Component
export function ChatMessage({ message, onReply }: Props) {
  // hooks first
  const [expanded, setExpanded] = useState(false);

  // handlers
  const handleReply = () => { ... };

  // render
  return ( ... );
}
```

### Styling

- Tailwind CSS v4 with custom theme variables defined in `globals.css`
- Use CSS variables (e.g., `var(--color-brand-600)`) for theme colors
- No inline style objects — Tailwind classes only
- Design system fonts: `var(--font-display)` for headings, `var(--font-body)` for UI, `var(--font-mono)` for values

### API Routes

```typescript
// Every API route follows this pattern:
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Get practitioner
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    // 3. Validate input (Zod)
    const body = await request.json();

    // 4. Business logic

    // 5. Audit log (service client)
    const serviceClient = createServiceClient();
    await serviceClient.from("audit_logs").insert({ ... });

    // 6. Return response
    return NextResponse.json({ ... });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Git Workflow

### Branches

- `main` — production-ready code
- `dev` — integration branch for active development
- `feature/xxx` — feature branches off `dev`
- `fix/xxx` — bug fix branches

### Commits

Use conventional commits:

```
feat: add lab upload drag-and-drop UI
fix: correct TSH functional range upper bound
refactor: extract biomarker flag logic to utility
docs: update API reference for lab endpoints
chore: upgrade @anthropic-ai/sdk to 0.40.0
```

### Pull Requests

- Every PR must have a description explaining what and why
- All TypeScript must compile (`npm run build`)
- Lint must pass (`npm run lint`)

## Database Migrations

### Creating a New Migration

```bash
# Create a new migration file
touch supabase/migrations/002_description.sql
```

### Migration Rules

1. Migrations are numbered sequentially: `001_`, `002_`, ..., `006_`
2. Each migration is idempotent where possible (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
3. Never modify a migration that has already been applied to production
4. Destructive changes (DROP, ALTER COLUMN type) require a separate migration with a rollback plan
5. Always add RLS policies for new tables containing PHI
6. Always add audit log entries for new PHI-accessing operations

## Environment Variables

Never commit secrets. Use `.env.local` for development and environment-specific configuration in AWS Amplify for production.

The `.env.example` file documents all required variables with placeholder values. Keep it updated when adding new environment variables.

## Security Rules

1. **Never log PHI** — no patient names, DOBs, or clinical data in console.log or error messages
2. **Always use parameterized queries** — never interpolate user input into SQL
3. **Always validate input** — use Zod schemas on every API endpoint
4. **Always check auth** — every API route must verify the Supabase session
5. **Always audit** — every PHI access must create an audit_log entry
6. **Never expose service role key** — only use in server-side code, never in client components
7. **Minimum necessary** — only send the patient data the AI actually needs for the query
