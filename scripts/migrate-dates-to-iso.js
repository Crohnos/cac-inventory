/**
 * Date Migration Script - Convert all dates to ISO format (YYYY-MM-DD)
 *
 * This script standardizes date formats across all tables to ISO 8601 format.
 * Current formats found:
 * - M-D-YYYY (e.g., "10-13-2025")
 * - M/D/YYYY (e.g., "10/13/2025")
 * - YYYY-MM-DD (already ISO)
 *
 * Target format: YYYY-MM-DD (ISO 8601)
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Convert various date formats to ISO format (YYYY-MM-DD)
 */
function toISO(dateStr) {
  if (!dateStr) return null;

  // Already ISO format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // M-D-YYYY or M/D/YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];

    // Validate the date
    const isoDate = `${year}-${month}-${day}`;
    const testDate = new Date(isoDate);
    if (testDate.toISOString().startsWith(isoDate)) {
      return isoDate;
    }
  }

  throw new Error(`Unknown date format: ${dateStr}`);
}

console.log('\n🗓️  Date Migration to ISO Format (YYYY-MM-DD)\n');
console.log('=' .repeat(60));

// Track statistics
const stats = {
  checkouts: { total: 0, converted: 0, alreadyISO: 0, errors: 0 },
  volunteer_sessions: { total: 0, converted: 0, alreadyISO: 0, errors: 0 },
  inventory_additions: { total: 0, converted: 0, alreadyISO: 0, errors: 0 },
  inventory_transfers: { total: 0, converted: 0, alreadyISO: 0, errors: 0 },
  inventory_adjustments: { total: 0, converted: 0, alreadyISO: 0, errors: 0 }
};

/**
 * Migrate dates in a table
 */
function migrateDates(tableName, idColumn, dateColumn) {
  console.log(`\n📋 Migrating ${tableName}.${dateColumn}...`);

  const rows = db.prepare(`SELECT ${idColumn}, ${dateColumn} FROM ${tableName}`).all();
  stats[tableName].total = rows.length;

  if (rows.length === 0) {
    console.log('   ⚠️  No records found - skipping');
    return;
  }

  const update = db.prepare(`UPDATE ${tableName} SET ${dateColumn} = ? WHERE ${idColumn} = ?`);

  let converted = 0;
  let alreadyISO = 0;
  let errors = 0;

  db.transaction(() => {
    for (const row of rows) {
      const originalDate = row[dateColumn];

      try {
        const isoDate = toISO(originalDate);

        if (isoDate === originalDate) {
          alreadyISO++;
        } else {
          update.run(isoDate, row[idColumn]);
          converted++;
          console.log(`   ✓ ${originalDate} → ${isoDate}`);
        }
      } catch (error) {
        errors++;
        console.error(`   ✗ Failed to convert "${originalDate}": ${error.message}`);
      }
    }
  })();

  stats[tableName].converted = converted;
  stats[tableName].alreadyISO = alreadyISO;
  stats[tableName].errors = errors;

  console.log(`   📊 Converted: ${converted}, Already ISO: ${alreadyISO}, Errors: ${errors}`);
}

// Migrate all tables with date columns
try {
  migrateDates('checkouts', 'checkout_id', 'checkout_date');
  migrateDates('volunteer_sessions', 'session_id', 'session_date');
  migrateDates('inventory_additions', 'addition_id', 'addition_date');
  migrateDates('inventory_transfers', 'transfer_id', 'transfer_date');
  migrateDates('inventory_adjustments', 'adjustment_id', 'adjustment_date');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Date Migration Complete!\n');

  // Print summary
  console.log('📊 Summary:');
  console.log('-'.repeat(60));

  let totalConverted = 0;
  let totalAlreadyISO = 0;
  let totalErrors = 0;

  for (const [table, stat] of Object.entries(stats)) {
    if (stat.total > 0) {
      console.log(`${table.padEnd(25)} ${stat.converted} converted, ${stat.alreadyISO} already ISO, ${stat.errors} errors`);
      totalConverted += stat.converted;
      totalAlreadyISO += stat.alreadyISO;
      totalErrors += stat.errors;
    }
  }

  console.log('-'.repeat(60));
  console.log(`${'TOTAL'.padEnd(25)} ${totalConverted} converted, ${totalAlreadyISO} already ISO, ${totalErrors} errors`);

  if (totalErrors > 0) {
    console.log('\n⚠️  Some dates could not be converted. Please review errors above.');
    process.exit(1);
  }

  // Verify all dates are now ISO format
  console.log('\n🔍 Verifying ISO format...\n');

  const tables = [
    { name: 'checkouts', column: 'checkout_date' },
    { name: 'volunteer_sessions', column: 'session_date' },
    { name: 'inventory_additions', column: 'addition_date' },
    { name: 'inventory_transfers', column: 'transfer_date' },
    { name: 'inventory_adjustments', column: 'adjustment_date' }
  ];

  let allValid = true;

  for (const table of tables) {
    const nonISO = db.prepare(`
      SELECT ${table.column}
      FROM ${table.name}
      WHERE ${table.column} NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      LIMIT 5
    `).all();

    if (nonISO.length > 0) {
      allValid = false;
      console.error(`❌ ${table.name}.${table.column} has non-ISO dates:`);
      nonISO.forEach(row => console.error(`   - ${row[table.column]}`));
    } else {
      console.log(`✅ ${table.name}.${table.column} - all dates are ISO format`);
    }
  }

  if (allValid) {
    console.log('\n🎉 All dates successfully migrated to ISO format!\n');
  } else {
    console.log('\n❌ Some dates are still not in ISO format. Review errors above.\n');
    process.exit(1);
  }

} catch (error) {
  console.error(`\n❌ Migration failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
