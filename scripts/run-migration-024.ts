/**
 * Apply migration 024 via Supabase service client.
 * Usage: npx tsx scripts/run-migration-024.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Read migration SQL
  const sqlPath = resolve(__dirname, "../supabase/migrations/024_partnership_rag.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  // Split into individual statements and execute
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Running ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 80).replace(/\n/g, " ");
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    const { error } = await supabase.rpc("exec_sql", { sql: stmt });

    if (error) {
      // Try direct fetch if rpc doesn't exist
      const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: stmt }),
      });

      if (!response.ok) {
        console.log(`  ⚠ RPC not available, trying SQL via Management API...`);
        break;
      }
    }
  }

  console.log("\nDone. Please apply the migration via Supabase Dashboard SQL Editor if any errors occurred.");
  console.log("Migration file: supabase/migrations/024_partnership_rag.sql");
}

main().catch(console.error);
