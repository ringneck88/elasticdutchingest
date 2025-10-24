# Incremental Sync Configuration - Complete

## Summary

The Dutchie Transaction Sync has been configured for **real-time incremental syncing**:

- **Runs every:** 5 minutes
- **Fetches:** Last 10 minutes of data
- **Overlap:** 5-minute overlap ensures no transactions are missed
- **Duplicates:** Automatically handled by Elasticsearch (updates existing documents)

## How It Works

### Time Window Strategy
```
Run 1 (00:00): Fetches 23:50 - 00:00 (last 10 min)
Run 2 (00:05): Fetches 23:55 - 00:05 (last 10 min) ← 5 min overlap
Run 3 (00:10): Fetches 00:00 - 00:10 (last 10 min) ← 5 min overlap
```

The 5-minute overlap ensures:
- No gaps if a sync is delayed
- Catches any transactions that were posted late to Dutchie API
- Duplicate protection via Elasticsearch document IDs

### Duplicate Handling

Elasticsearch uses `registerTransactionId` as the document `_id`:
```javascript
{ index: { _index: targetIndex, _id: doc.id } }
```

This means:
- Same transaction fetched multiple times → **Updates existing document**
- No duplicate documents created
- Latest data always wins

## Configuration

### Cron Schedule
Default: `*/5 * * * *` (every 5 minutes)

Change via environment variable:
```bash
CRON_SCHEDULE=*/5 * * * *
```

### Data Fetch Window
Hardcoded in `dutchieClient.js:136-137`:
```javascript
const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
```

To change the time window:
1. Modify the milliseconds calculation
2. Keep overlap greater than sync frequency
3. Example: For 15-minute window with 5-minute sync:
   ```javascript
   const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
   ```

## Benefits

### Real-Time Data
- New transactions appear in Elasticsearch within 5 minutes
- No need to wait for daily batch processing

### Low API Load
- Only fetches last 10 minutes instead of full history
- Reduces API calls and processing time
- Each sync is fast (~628 transactions for Bell Rd vs 14,866 for full day)

### Resilience
- 5-minute overlap catches delayed transactions
- If a sync fails, next sync catches missed data
- Duplicate protection prevents data corruption

### Scalability
- Efficient use of resources
- Can handle high transaction volumes
- Railway costs remain minimal

## Monitoring

### Check Sync Frequency
View Railway logs to see sync execution:
```
[2025-10-24T18:00:00.000Z] Starting scheduled transaction sync (last 10 minutes)...
[2025-10-24T18:05:00.000Z] Starting scheduled transaction sync (last 10 minutes)...
[2025-10-24T18:10:00.000Z] Starting scheduled transaction sync (last 10 minutes)...
```

### Verify Data
Each sync logs transaction count:
```
Fetched 7 register transactions
Bulk indexed 7 documents
```

### Elasticsearch Query
Check recent transactions:
```bash
curl -X GET "https://elasticsearch-production-486b.up.railway.app/dutchie_transactions/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 10,
    "sort": [{"transactionDateUTC": {"order": "desc"}}]
  }'
```

## Troubleshooting

### Too Many Transactions
If 10-minute window fetches too many transactions:
- Reduce time window to 7-8 minutes
- Keep at least 2-minute overlap with sync frequency

### Missing Transactions
If transactions are missing:
- Increase time window to 15 minutes
- Check Dutchie API for delayed posting

### High API Usage
If hitting API rate limits:
- Increase sync frequency to every 10 minutes
- Keep time window at 15 minutes (5-minute overlap)

## Railway Deployment

See **RAILWAY-SETUP.md** for complete deployment instructions.

Quick deploy:
```bash
git add .
git commit -m "Configure 5-minute incremental sync"
git push origin main
```

Then deploy to Railway and set environment variables.

## Testing Locally

Test the incremental sync:
```bash
# Run one-time sync
npm run sync

# Start cron job (runs every 5 minutes)
npm start
```

Watch for log output:
```
Fetching transactions from 2025-10-24T18:14:29.331Z to 2025-10-24T18:24:29.331Z (last 10 minutes)
Fetched 7 register transactions
```

## Performance

### Single Store (Bell Rd)
- **Full day:** 14,866 transactions
- **10 minutes:** ~7 transactions
- **Reduction:** 99.95% fewer transactions per sync

### All Stores (26 active)
- **Full day:** ~156,930 transactions
- **10 minutes:** ~182 transactions (estimate)
- **Processing time:** < 1 minute per sync

### Railway Costs
- Minimal CPU usage (only active during 1-minute sync every 5 minutes)
- Estimated: $5-10/month on Railway Hobby plan
