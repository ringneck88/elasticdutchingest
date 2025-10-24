const DutchieClient = require('../clients/dutchieClient');
const ElasticsearchClient = require('../clients/elasticsearchClient');
const StoreConfig = require('../config/storeConfig');

class IndexingService {
  constructor() {
    this.dutchieClient = new DutchieClient();
    this.esClient = new ElasticsearchClient();
    this.storeConfig = new StoreConfig();
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 100;
  }

  async initialize(dataType = null) {
    console.log('Initializing Indexing Service...');
    await this.esClient.connect();

    // Create index for specific data type or all indices
    if (dataType) {
      await this.esClient.createIndex(null, dataType);
      console.log(`Indexing Service initialized for ${dataType}`);
    } else {
      await this.esClient.createIndex();
      console.log('Indexing Service initialized successfully');
    }

    console.log(`Found ${this.storeConfig.getStoreCount()} stores to process`);
  }

  listStores() {
    this.storeConfig.listStores();
  }

  async indexAllStores(dataType, params = {}) {
    const stores = this.storeConfig.getActiveStores();
    console.log(`\n=== Processing ${dataType} for ${stores.length} stores ===\n`);

    const results = [];
    let totalIndexed = 0;
    let totalErrors = 0;

    for (const store of stores) {
      let result;
      switch (dataType) {
        case 'products':
          result = await this.indexProductsForStore(store, params);
          break;
        case 'menu':
          result = await this.indexMenuForStore(store, params);
          break;
        case 'orders':
          result = await this.indexOrdersForStore(store, params);
          break;
        case 'transactions':
          result = await this.indexRegisterTransactionsForStore(store, params);
          break;
        default:
          console.error(`Unknown data type: ${dataType}`);
          continue;
      }

      results.push(result);
      totalIndexed += result.indexed || 0;
      totalErrors += result.errors || 0;
    }

    return {
      dataType,
      storesProcessed: stores.length,
      totalIndexed,
      totalErrors,
      storeResults: results
    };
  }

  async indexProducts(params = {}) {
    return await this.indexAllStores('products', params);
  }

  async indexProductsForStore(store, params = {}) {
    try {
      this.dutchieClient.setStore(store);
      console.log(`\n[${store.name}] Starting product indexing...`);

      // Fetch products from Dutchie API
      const products = await this.dutchieClient.fetchProducts(params);

      if (!products || products.length === 0) {
        console.log(`[${store.name}] No products found to index`);
        return { store: store.name, indexed: 0, errors: 0 };
      }

      // Transform data for Elasticsearch
      const transformedProducts = this.dutchieClient.transformForElasticsearch(products);

      // Index in batches
      const batches = this.createBatches(transformedProducts, this.batchSize);
      let indexed = 0;
      let errors = 0;

      for (let i = 0; i < batches.length; i++) {
        console.log(`[${store.name}] Indexing batch ${i + 1}/${batches.length}...`);
        try {
          await this.esClient.bulkIndex(batches[i], null, 'products');
          indexed += batches[i].length;
        } catch (error) {
          console.error(`[${store.name}] Error indexing batch ${i + 1}:`, error.message);
          errors += batches[i].length;
        }
      }

      console.log(`[${store.name}] Indexing completed. Indexed: ${indexed}, Errors: ${errors}`);
      return { store: store.name, indexed, errors, total: products.length };
    } catch (error) {
      console.error(`[${store.name}] Error in indexProducts:`, error.message);
      return { store: store.name, indexed: 0, errors: 0, error: error.message };
    }
  }

  async indexMenu(params = {}) {
    return await this.indexAllStores('menu', params);
  }

  async indexMenuForStore(store, params = {}) {
    try {
      this.dutchieClient.setStore(store);
      console.log(`\n[${store.name}] Starting menu indexing...`);

      const menu = await this.dutchieClient.fetchMenu(params);

      if (!menu) {
        console.log(`[${store.name}] No menu data found to index`);
        return { store: store.name, indexed: 0, errors: 0 };
      }

      // Transform and index menu data
      const transformedMenu = this.dutchieClient.transformForElasticsearch(menu);
      await this.esClient.bulkIndex(Array.isArray(transformedMenu) ? transformedMenu : [transformedMenu], null, 'menu');

      console.log(`[${store.name}] Menu indexing completed`);
      return { store: store.name, indexed: 1, errors: 0 };
    } catch (error) {
      console.error(`[${store.name}] Error in indexMenu:`, error.message);
      return { store: store.name, indexed: 0, errors: 0, error: error.message };
    }
  }

  async indexOrders(params = {}) {
    return await this.indexAllStores('orders', params);
  }

  async indexOrdersForStore(store, params = {}) {
    try {
      this.dutchieClient.setStore(store);
      console.log(`\n[${store.name}] Starting order indexing...`);

      const orders = await this.dutchieClient.fetchOrders(params);

      if (!orders || orders.length === 0) {
        console.log(`[${store.name}] No orders found to index`);
        return { store: store.name, indexed: 0, errors: 0 };
      }

      // Transform data for Elasticsearch
      const transformedOrders = this.dutchieClient.transformForElasticsearch(orders);

      // Index in batches
      const batches = this.createBatches(transformedOrders, this.batchSize);
      let indexed = 0;
      let errors = 0;

      for (let i = 0; i < batches.length; i++) {
        console.log(`[${store.name}] Indexing batch ${i + 1}/${batches.length}...`);
        try {
          await this.esClient.bulkIndex(batches[i], null, 'orders');
          indexed += batches[i].length;
        } catch (error) {
          console.error(`[${store.name}] Error indexing batch ${i + 1}:`, error.message);
          errors += batches[i].length;
        }
      }

      console.log(`[${store.name}] Order indexing completed. Indexed: ${indexed}, Errors: ${errors}`);
      return { store: store.name, indexed, errors, total: orders.length };
    } catch (error) {
      console.error(`[${store.name}] Error in indexOrders:`, error.message);
      return { store: store.name, indexed: 0, errors: 0, error: error.message };
    }
  }

  async indexRegisterTransactions(params = {}) {
    return await this.indexAllStores('transactions', params);
  }

  async indexRegisterTransactionsForStore(store, params = {}) {
    try {
      this.dutchieClient.setStore(store);
      console.log(`\n[${store.name}] Starting register transactions indexing...`);

      const transactions = await this.dutchieClient.fetchRegisterTransactions(params);

      if (!transactions || transactions.length === 0) {
        console.log(`[${store.name}] No transactions found to index`);
        return { store: store.name, indexed: 0, errors: 0 };
      }

      // Transform data for Elasticsearch
      const transformedTransactions = this.dutchieClient.transformForElasticsearch(transactions);

      // Index in batches
      const batches = this.createBatches(transformedTransactions, this.batchSize);
      let indexed = 0;
      let errors = 0;

      for (let i = 0; i < batches.length; i++) {
        console.log(`[${store.name}] Indexing batch ${i + 1}/${batches.length}...`);
        try {
          await this.esClient.bulkIndex(batches[i], null, 'transactions');
          indexed += batches[i].length;
        } catch (error) {
          console.error(`[${store.name}] Error indexing batch ${i + 1}:`, error.message);
          errors += batches[i].length;
        }
      }

      console.log(`[${store.name}] Transaction indexing completed. Indexed: ${indexed}, Errors: ${errors}`);
      return { store: store.name, indexed, errors, total: transactions.length };
    } catch (error) {
      console.error(`[${store.name}] Error in indexRegisterTransactions:`, error.message);
      return { store: store.name, indexed: 0, errors: 0, error: error.message };
    }
  }

  async indexCustomEndpoint(endpoint, params = {}, method = 'GET') {
    try {
      console.log(`Starting custom endpoint indexing: ${endpoint}...`);

      const data = await this.dutchieClient.makeCustomRequest(endpoint, method, null, params);

      if (!data) {
        console.log('No data found to index');
        return { indexed: 0, errors: 0 };
      }

      // Transform data for Elasticsearch
      const transformedData = this.dutchieClient.transformForElasticsearch(data);
      const dataArray = Array.isArray(transformedData) ? transformedData : [transformedData];

      // Index in batches
      const batches = this.createBatches(dataArray, this.batchSize);
      let indexed = 0;
      let errors = 0;

      for (let i = 0; i < batches.length; i++) {
        console.log(`Indexing batch ${i + 1}/${batches.length}...`);
        try {
          await this.esClient.bulkIndex(batches[i], null, 'custom');
          indexed += batches[i].length;
        } catch (error) {
          console.error(`Error indexing batch ${i + 1}:`, error.message);
          errors += batches[i].length;
        }
      }

      console.log(`Custom endpoint indexing completed. Indexed: ${indexed}, Errors: ${errors}`);
      return { indexed, errors, total: dataArray.length };
    } catch (error) {
      console.error('Error in indexCustomEndpoint:', error.message);
      throw error;
    }
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async close() {
    await this.esClient.close();
    console.log('Indexing Service closed');
  }
}

module.exports = IndexingService;
