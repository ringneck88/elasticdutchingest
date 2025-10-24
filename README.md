# Dutchie to Elasticsearch Ingestion Service

A Node.js application that fetches JSON data from Dutchie API endpoints and indexes it into Elasticsearch. Supports multiple stores configured via JSON file.

## Project Structure

```
elasticdutchingest/
├── src/
│   ├── clients/
│   │   ├── dutchieClient.js       # Dutchie API client
│   │   └── elasticsearchClient.js # Elasticsearch client
│   ├── services/
│   │   └── indexingService.js     # Main indexing service
│   └── config/
│       └── storeConfig.js         # Store configuration loader
├── stores-api.json                # Store configuration file with API keys
├── index.js                       # Entry point
├── .env.example                   # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- Elasticsearch instance (v7.x or v8.x)
- Dutchie API credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ringneck88/elasticdutchingest.git
cd elasticdutchingest
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Dutchie API Configuration
DUTCHIE_API_URL=https://api.dutchie.com/v1
DUTCHIE_API_KEY=your_dutchie_api_key_here

# Elasticsearch Configuration (Railway instance)
ELASTICSEARCH_NODE=https://elasticsearch-production-486b.up.railway.app
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password_here
ELASTICSEARCH_INDEX=dutchie_products

# Application Configuration
LOG_LEVEL=info
BATCH_SIZE=100
```

5. Ensure your `stores-api.json` file is in the project root with store configurations.

## Multi-Store Configuration

The application automatically loads store configurations from `stores-api.json`. Each store entry should have:

- `name`: Store name
- `status`: Store status ("active" or "inactive")
- `apis`: Array of API configurations, each with:
  - `name`: API service name (e.g., "Internal", "Dutchie")
  - `apiKey`: The API key for that service

The app will process all stores with `status: "active"` and automatically uses the "Internal" API key if available, or the first API key in the list.

## Dutchie API Information

The application is designed to work with Dutchie's API. You'll need:

1. **API Key**: Obtain from your Dutchie account dashboard
2. **Store IDs**: Configured in `all_stores.json` (uses `DutchieStoreID` field)
3. **API URL**: Base URL for Dutchie API endpoints

### Supported Endpoints

The client supports fetching data from:
- `/products` - Product catalog
- `/menu` - Menu items
- `/orders` - Order history
- `/reporting/register-transactions` - Register transactions (automatically filters to today's data)
- Custom endpoints via `makeCustomRequest()`

**Note**: You may need to adjust the API endpoints and data transformation logic in `src/clients/dutchieClient.js` based on the actual Dutchie API documentation and your specific use case.

## Usage

### List All Stores
```bash
node index.js list-stores
```

### Index Products (All Stores)
```bash
node index.js products
```
This will fetch and index products from all active stores in `all_stores.json`.

### Index Menu (All Stores)
```bash
node index.js menu
```

### Index Orders (All Stores)
```bash
node index.js orders
```

### Index Register Transactions (All Stores - Today's Data)
```bash
node index.js transactions
```
This will fetch and index today's register transactions from all active stores.

### Index Custom Endpoint
```bash
node index.js custom /your-custom-endpoint
```

### Show Help
```bash
node index.js help
```

## Features

- **Multi-Store Support**: Automatically processes all active stores from configuration file
- **Batch Processing**: Processes data in configurable batch sizes for optimal performance
- **Error Handling**: Comprehensive error handling and logging per store
- **Flexible Indexing**: Support for multiple Dutchie endpoints
- **Data Transformation**: Automatic transformation of Dutchie data to Elasticsearch format
- **Store Metadata**: Each indexed document includes store ID, name, and region
- **Bulk Operations**: Uses Elasticsearch bulk API for efficient indexing

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DUTCHIE_API_URL` | Dutchie API base URL | - |
| `DUTCHIE_API_KEY` | Your Dutchie API key | - |
| `ELASTICSEARCH_NODE` | Elasticsearch URL | https://elasticsearch-production-486b.up.railway.app |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | elastic |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | - |
| `ELASTICSEARCH_INDEX` | Target index name | dutchie_products |
| `BATCH_SIZE` | Number of documents per batch | 100 |

**Note**: `DUTCHIE_RETAILER_ID` is no longer required when using `all_stores.json` for multi-store configuration.

## Elasticsearch Index Schema

The default index mapping includes:

- `id` (keyword): Product/item ID
- `name` (text): Product/item name
- `description` (text): Description
- `price` (float): Price
- `category` (keyword): Category
- `brand` (keyword): Brand name
- `store_id` (keyword): Dutchie store ID
- `store_name` (keyword): Store name
- `store_region` (keyword): Store region
- `timestamp` (date): Indexing timestamp
- `raw_data` (object): Original data from Dutchie API

You can customize the mapping in `src/clients/elasticsearchClient.js`.

## Customization

### Modifying Data Transformation

Edit the `transformForElasticsearch()` method in `src/clients/dutchieClient.js` to match your specific data structure:

```javascript
transformSingleItem(item) {
  return {
    id: item.id || item._id,
    name: item.name || item.title,
    // Add your custom field mappings here
    raw_data: item
  };
}
```

### Adding New Endpoints

To add support for new Dutchie endpoints:

1. Add a new method in `src/clients/dutchieClient.js`
2. Add a corresponding method in `src/services/indexingService.js`
3. Add a new command case in `index.js`

## Error Handling

The application includes:
- Connection error handling
- Batch processing error tracking
- Uncaught exception handlers
- Detailed error logging

## Development

To modify or extend the application:

1. **Add new API methods**: Update `src/clients/dutchieClient.js`
2. **Customize Elasticsearch schema**: Modify `src/clients/elasticsearchClient.js`
3. **Add new indexing logic**: Update `src/services/indexingService.js`

## Troubleshooting

### Connection Issues
- Verify Elasticsearch is running: `curl http://localhost:9200`
- Check Dutchie API credentials and endpoint URLs
- Review firewall and network settings

### Data Not Indexing
- Check Dutchie API response format
- Verify data transformation logic
- Review Elasticsearch logs for indexing errors

### Performance Issues
- Adjust `BATCH_SIZE` environment variable
- Monitor Elasticsearch cluster health
- Consider implementing rate limiting for API calls

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!
