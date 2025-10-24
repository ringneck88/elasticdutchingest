# Railway Cron Job Setup - Complete

## What Was Done

Successfully configured the Dutchie Transaction Sync application to run as a scheduled cron job on Railway.

## Files Created/Modified

### New Files:
1. **cron.js** - Main cron scheduler that runs the transaction sync on a schedule
2. **railway.json** - Railway deployment configuration
3. **RAILWAY-SETUP.md** - Complete deployment guide with step-by-step instructions
4. **DEPLOYMENT-SUMMARY.md** - This file

### Modified Files:
1. **package.json** - Added scripts:
   - `npm start` → Runs the cron job
   - `npm sync` → Manually runs a one-time sync
2. **dutchieClient.js** - Updated to fetch all of October 2025 data
3. **storeConfig.js** - Removed testing mode, now processes all 42 stores

## Current Configuration

### Cron Schedule
- **Default:** Daily at 2:00 AM UTC (`0 2 * * *`)
- **Configurable:** Set `CRON_SCHEDULE` environment variable in Railway

### Data Fetched
- **Date Range:** October 1-31, 2025 (configurable in `dutchieClient.js`)
- **Stores:** All 42 stores (26 with valid API keys)
- **Volume:** ~156,930 transactions per sync
- **Data:** Transaction type, amount, employee, store location (lat/lon), etc.

### Features
- ✅ Automatic scheduled syncing
- ✅ Geolocation data for map visualization
- ✅ Error handling (invalid API keys don't stop other stores)
- ✅ Batch processing (100 documents per batch)
- ✅ Comprehensive logging
- ✅ Graceful shutdown handling

## Next Steps to Deploy

### 1. Commit and Push Code
```bash
git add .
git commit -m "Add Railway cron job for automated transaction syncing"
git push origin main
```

### 2. Deploy to Railway
Follow the detailed steps in **RAILWAY-SETUP.md**:
1. Create new Railway project from GitHub repo
2. Configure environment variables
3. Deploy automatically starts
4. Monitor logs to verify cron schedule

### 3. Environment Variables to Set in Railway
```
DUTCHIE_API_URL=https://api.pos.dutchie.com
ELASTICSEARCH_NODE=https://elasticsearch-production-486b.up.railway.app
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_actual_password
ELASTICSEARCH_INDEX_TRANSACTIONS=dutchie_transactions
CRON_SCHEDULE=0 2 * * *
RUN_ON_STARTUP=false
```

## Testing Locally

Test the cron job locally before deploying:

```bash
# Install dependencies
npm install

# Test a one-time sync
npm run sync

# Test the cron scheduler (runs continuously)
npm start
```

## Monitoring

Once deployed to Railway:
1. View logs in Railway dashboard
2. Check Elasticsearch transaction count
3. Monitor cron execution timestamps

## Cost Estimate

- **Railway:** ~$5-10/month (runs continuously but only syncs on schedule)
- **Minimal resource usage** when not actively syncing

## Support

- **Setup Guide:** See RAILWAY-SETUP.md
- **Issues:** https://github.com/ringneck88/elasticdutchingest/issues

---

## Test Results from Last Run

**Date:** October 24, 2025
**Total Transactions:** 156,930
**Successful Stores:** 26/42
**Failed Stores:** 10 (invalid API keys), 6 (no transactions)

**Top Performers:**
- Tempe: 40,120 transactions
- Mesa: 18,159 transactions
- Buckeye: 15,965 transactions
- Bell Rd: 14,866 transactions
- Northern: 13,541 transactions

**Regional Distribution:**
- Arizona: 113,926 (72.6%)
- Michigan: 18,689 (11.9%)
- Florida: 13,709 (8.7%)
- Missouri: 6,369 (4.1%)
- Illinois: 4,237 (2.7%)
