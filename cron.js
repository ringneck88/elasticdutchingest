const cron = require('node-cron');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configure the cron schedule
// Default: Every 5 minutes (can be overridden by CRON_SCHEDULE env var)
const cronSchedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

console.log('=== Dutchie Transaction Sync Cron Job ===');
console.log(`Cron schedule: ${cronSchedule}`);
console.log(`Next run will execute: node index.js transactions`);
console.log('Waiting for scheduled time...\n');

// Schedule the job
cron.schedule(cronSchedule, async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Starting scheduled transaction sync (last 10 minutes)...`);

  try {
    const { stdout, stderr } = await execPromise('node index.js transactions');

    if (stdout) {
      console.log('STDOUT:', stdout);
    }

    if (stderr) {
      console.error('STDERR:', stderr);
    }

    console.log(`[${new Date().toISOString()}] Transaction sync completed successfully\n`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during transaction sync:`, error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Optional: Run immediately on startup if RUN_ON_STARTUP=true
if (process.env.RUN_ON_STARTUP === 'true') {
  console.log('RUN_ON_STARTUP is enabled. Running initial sync...\n');
  execPromise('node index.js transactions')
    .then(({ stdout, stderr }) => {
      if (stdout) console.log('Initial sync STDOUT:', stdout);
      if (stderr) console.error('Initial sync STDERR:', stderr);
      console.log('Initial sync completed\n');
    })
    .catch(error => {
      console.error('Initial sync error:', error.message);
    });
}

// Keep the process alive
console.log('Cron job is running. Press Ctrl+C to stop.\n');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Shutting down gracefully...');
  process.exit(0);
});
