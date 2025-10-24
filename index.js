const IndexingService = require('./src/services/indexingService');
require('dotenv').config();

async function main() {
  const service = new IndexingService();

  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'products';

    console.log(`\nExecuting command: ${command}\n`);

    // Initialize the service with the appropriate data type
    const dataTypeMap = {
      'products': 'products',
      'menu': 'menu',
      'orders': 'orders',
      'transactions': 'transactions'
    };
    await service.initialize(dataTypeMap[command] || null);

    let result;
    switch (command) {
      case 'list-stores':
        service.listStores();
        await service.close();
        process.exit(0);
        break;

      case 'products':
        result = await service.indexProducts();
        break;

      case 'menu':
        result = await service.indexMenu();
        break;

      case 'orders':
        result = await service.indexOrders();
        break;

      case 'transactions':
        result = await service.indexRegisterTransactions();
        break;

      case 'custom':
        if (!args[1]) {
          console.error('Please provide an endpoint for custom command');
          console.log('Usage: node index.js custom /endpoint');
          process.exit(1);
        }
        result = await service.indexCustomEndpoint(args[1]);
        break;

      case 'help':
        console.log('\nAvailable commands:');
        console.log('  list-stores  - List all available stores from all_stores.json');
        console.log('  products     - Index products from Dutchie API for all stores');
        console.log('  menu         - Index menu from Dutchie API for all stores');
        console.log('  orders       - Index orders from Dutchie API for all stores');
        console.log('  transactions - Index register transactions from Dutchie API for all stores (today\'s data)');
        console.log('  custom       - Index from custom endpoint (usage: node index.js custom /endpoint)');
        console.log('  help         - Show this help message');
        await service.close();
        process.exit(0);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('\nAvailable commands:');
        console.log('  list-stores  - List all available stores from all_stores.json');
        console.log('  products     - Index products from Dutchie API for all stores');
        console.log('  menu         - Index menu from Dutchie API for all stores');
        console.log('  orders       - Index orders from Dutchie API for all stores');
        console.log('  transactions - Index register transactions from Dutchie API for all stores (today\'s data)');
        console.log('  custom       - Index from custom endpoint (usage: node index.js custom /endpoint)');
        console.log('  help         - Show this help message');
        process.exit(1);
    }

    console.log('\n=== Summary ===');
    console.log(JSON.stringify(result, null, 2));

    await service.close();
    console.log('\nProcess completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n=== Error ===');
    console.error(error.message);
    console.error(error.stack);

    await service.close();
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Run the main function
main();
