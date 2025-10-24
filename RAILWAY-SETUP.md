# Railway Deployment Guide

This guide will help you deploy the Dutchie Transaction Sync as a cron job on Railway.

## Overview

The application automatically syncs transaction data from Dutchie API to Elasticsearch every 5 minutes using node-cron. Each sync fetches the last 10 minutes of data (5-minute overlap ensures no transactions are missed).

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with this code
- Dutchie API credentials
- Elasticsearch instance URL

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add Railway cron job configuration"
git push origin main
```

### 2. Create New Project on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `ringneck88/elasticdutchingest`
5. Railway will automatically detect the Node.js project

### 3. Configure Environment Variables

In your Railway project, go to "Variables" tab and add:

#### Required Variables:
```
DUTCHIE_API_URL=https://api.pos.dutchie.com
ELASTICSEARCH_NODE=https://elasticsearch-production-486b.up.railway.app
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password_here
```

#### Optional Variables:
```
# Cron schedule (default: */5 * * * * = every 5 minutes)
CRON_SCHEDULE=*/5 * * * *

# Run sync immediately on startup (default: false)
RUN_ON_STARTUP=false

# Elasticsearch indices
ELASTICSEARCH_INDEX_TRANSACTIONS=dutchie_transactions

# Application config
LOG_LEVEL=info
BATCH_SIZE=100
```

### 4. Cron Schedule Examples

The `CRON_SCHEDULE` variable uses standard cron syntax:

```
# Every day at 2:00 AM UTC
0 2 * * *

# Every 6 hours
0 */6 * * *

# Every hour
0 * * * *

# Every day at midnight
0 0 * * *

# Every Monday at 3:00 AM
0 3 * * 1

# Every 30 minutes
*/30 * * * *
```

### 5. Deploy

Railway will automatically build and deploy your application:
1. Install dependencies (`npm install`)
2. Start the cron job (`npm start`)
3. The cron job will run continuously and execute syncs on schedule

### 6. Monitor Logs

View logs in Railway dashboard:
1. Go to your project
2. Click on the service
3. Navigate to "Deployments" → Select deployment → "View Logs"

You'll see:
- Cron schedule confirmation
- Execution timestamps
- Sync results and transaction counts
- Any errors

## Usage

### Manual Sync

If you need to run a sync manually without waiting for the cron schedule:

1. In Railway dashboard, go to your service
2. Open the deployment logs
3. The sync runs automatically per the schedule, or
4. Set `RUN_ON_STARTUP=true` to run immediately on deployment

### Update Cron Schedule

To change the schedule:
1. Update the `CRON_SCHEDULE` environment variable in Railway
2. Redeploy the service (or it will restart automatically)

### Check Transaction Count

After a sync completes, you can verify by querying your Elasticsearch:

```bash
curl -X GET "https://elasticsearch-production-486b.up.railway.app/dutchie_transactions/_count"
```

## Architecture

```
Railway Service (Always Running)
    ↓
cron.js (node-cron scheduler)
    ↓
    Runs on schedule (e.g., daily at 2 AM)
    ↓
index.js transactions
    ↓
    1. Fetch from Dutchie API (/reporting/register-transactions)
    2. Transform data (add store metadata, geolocation)
    3. Bulk index to Elasticsearch
```

## Data Fetched

- **Date Range:** Last 10 minutes (with 5-minute overlap to catch delayed transactions)
- **Frequency:** Every 5 minutes
- **Stores:** All 42 configured stores (26 with valid API keys)
- **Volume:** ~5-50 transactions per sync per store (varies by time of day)
- **Fields:** Transaction type, amount, employee name, date, store location (lat/lon), etc.
- **Duplicates:** Automatically handled - Elasticsearch updates existing documents with same transaction ID

## Troubleshooting

### Service Keeps Restarting
- Check logs for errors
- Verify all environment variables are set correctly
- Ensure Elasticsearch is accessible from Railway

### No Data Being Synced
- Verify `CRON_SCHEDULE` is correct
- Check if date range in `dutchieClient.js` needs updating
- Review logs for API authentication errors

### Invalid API Keys
Some stores may have invalid API keys. These will be logged as errors but won't stop the sync for other stores.

## Costs

Railway pricing:
- Hobby Plan: $5/month + usage
- This cron job uses minimal resources (only active during sync)
- Estimated cost: $5-10/month

## Support

For issues or questions:
- GitHub Issues: https://github.com/ringneck88/elasticdutchingest/issues
- Railway Docs: https://docs.railway.app
