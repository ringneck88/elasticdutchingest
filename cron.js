const cron = require('node-cron');
const { exec } = require('child_process');
const util = require('util');
const http = require('http');
const execPromise = util.promisify(exec);

// Configure the cron schedule
// Default: Every 5 minutes (can be overridden by CRON_SCHEDULE env var)
const cronSchedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

// Create a simple HTTP server for Railway health checks
const PORT = process.env.PORT || 3000;
let lastRunTime = null;
let lastRunStatus = 'Not started yet';

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      cronSchedule,
      lastRun: lastRunTime,
      lastStatus: lastRunStatus,
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('=== Dutchie Transaction Sync Cron Job ===');
  console.log(`Health check server running on 0.0.0.0:${PORT}`);
  console.log(`Cron schedule: ${cronSchedule}`);
  console.log(`Next run will execute: node index.js transactions`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Waiting for scheduled time...\n');
}).on('error', (err) => {
  console.error('Failed to start HTTP server:', err);
  process.exit(1);
});

// Schedule the job
cron.schedule(cronSchedule, async () => {
  const timestamp = new Date().toISOString();
  lastRunTime = timestamp;
  lastRunStatus = 'Running...';
  console.log(`\n[${timestamp}] Starting scheduled transaction sync (last 10 minutes)...`);

  try {
    const { stdout, stderr } = await execPromise('node index.js transactions');

    if (stdout) {
      console.log('STDOUT:', stdout);
    }

    if (stderr) {
      console.error('STDERR:', stderr);
    }

    lastRunStatus = 'Success';
    console.log(`[${new Date().toISOString()}] Transaction sync completed successfully\n`);
  } catch (error) {
    lastRunStatus = `Error: ${error.message}`;
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

// Graceful shutdown handlers
let isShuttingDown = false;

process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n⚠️  Received SIGTERM. Shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n⚠️  Received SIGINT. Shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
