/**
 * Audit Log Archival Script — HIPAA H6
 *
 * Archives audit log entries older than 1 year to a JSON file,
 * then optionally deletes them from the database.
 *
 * Usage:
 *   npx tsx scripts/archive-audit-logs.ts                  # Dry run (export only)
 *   npx tsx scripts/archive-audit-logs.ts --delete         # Export + delete archived rows
 *   npx tsx scripts/archive-audit-logs.ts --months 6       # Archive logs older than 6 months
 *
 * Output: archives/audit-logs-YYYY-MM-DD.json
 *
 * Production: Schedule this as a cron job (monthly) or Supabase Edge Function.
 * For S3 Glacier archival, upload the JSON file via AWS CLI after export.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes("--delete");
  const monthsIdx = args.indexOf("--months");
  const months = monthsIdx !== -1 ? parseInt(args[monthsIdx + 1]) : 12;

  if (isNaN(months) || months < 1) {
    console.error("Invalid --months value. Must be >= 1.");
    process.exit(1);
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffISO = cutoff.toISOString();

  console.log(`\nAudit Log Archival`);
  console.log(`─────────────────────────────────────`);
  console.log(`Cutoff:    ${cutoffISO} (${months} months ago)`);
  console.log(`Mode:      ${shouldDelete ? "EXPORT + DELETE" : "DRY RUN (export only)"}`);

  // Count eligible rows
  const { count } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoffISO);

  console.log(`Eligible:  ${count || 0} rows\n`);

  if (!count || count === 0) {
    console.log("No logs to archive. Exiting.");
    return;
  }

  // Fetch in batches of 1000
  const allLogs: unknown[] = [];
  const batchSize = 1000;
  let offset = 0;

  while (offset < count) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .lt("created_at", cutoffISO)
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(`Fetch error at offset ${offset}:`, error.message);
      process.exit(1);
    }

    allLogs.push(...(data || []));
    offset += batchSize;
    process.stdout.write(`  Fetched ${allLogs.length}/${count} rows\r`);
  }

  console.log(`\n  Fetched ${allLogs.length} total rows.`);

  // Write to archive file
  const archiveDir = join(process.cwd(), "archives");
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `audit-logs-${dateStr}.json`;
  const filepath = join(archiveDir, filename);

  writeFileSync(filepath, JSON.stringify({
    archived_at: new Date().toISOString(),
    cutoff_date: cutoffISO,
    row_count: allLogs.length,
    logs: allLogs,
  }, null, 2));

  console.log(`  Archived to: ${filepath}`);

  // Delete if requested
  if (shouldDelete) {
    console.log(`\n  Deleting ${allLogs.length} archived rows from database...`);

    // Delete in batches to avoid timeouts
    const ids = allLogs.map((log) => (log as { id: string }).id);
    const deleteBatchSize = 500;

    for (let i = 0; i < ids.length; i += deleteBatchSize) {
      const batch = ids.slice(i, i + deleteBatchSize);
      const { error } = await supabase
        .from("audit_logs")
        .delete()
        .in("id", batch);

      if (error) {
        console.error(`  Delete error at batch ${i}:`, error.message);
        console.error("  Archive file preserved. Re-run with remaining IDs.");
        process.exit(1);
      }
      process.stdout.write(`  Deleted ${Math.min(i + deleteBatchSize, ids.length)}/${ids.length}\r`);
    }

    console.log(`\n  Successfully deleted ${ids.length} rows.`);
  } else {
    console.log(`\n  Dry run complete. Re-run with --delete to remove archived rows.`);
  }

  console.log(`\nDone.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
