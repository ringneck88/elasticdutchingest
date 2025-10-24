const axios = require('axios');
require('dotenv').config();

class DutchieClient {
  constructor(storeConfig = null) {
    this.baseURL = process.env.DUTCHIE_API_URL;
    this.currentStore = storeConfig;

    // Create axios client without auth (will be set per-request)
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  setStore(storeConfig) {
    this.currentStore = storeConfig;
    console.log(`Switched to store: ${storeConfig.name} (API Key: ${storeConfig.apiKey})`);
  }

  getCurrentStoreId() {
    return this.currentStore?.dutchieStoreId || process.env.DUTCHIE_RETAILER_ID;
  }

  getAuthConfig() {
    // Use the store's API key as username with no password (HTTP Basic Auth)
    const apiKey = this.currentStore?.apiKey || process.env.DUTCHIE_API_KEY;
    if (!apiKey || apiKey === 'your_dutchie_api_key_here') {
      console.warn('No valid API key found for authentication');
      return {};
    }

    return {
      auth: {
        username: apiKey,
        password: ''
      }
    };
  }

  async fetchProducts(params = {}) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Fetching products from Dutchie API for store: ${this.currentStore?.name || storeId}...`);

      const response = await this.client.get('/products', {
        ...this.getAuthConfig(),
        params: {
          retailerId: storeId,
          ...params
        }
      });

      console.log(`Fetched ${response.data?.length || 0} products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async fetchProductById(productId) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Fetching product ${productId} from Dutchie API...`);
      const response = await this.client.get(`/products/${productId}`, {
        ...this.getAuthConfig(),
        params: {
          retailerId: storeId
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.message);
      throw error;
    }
  }

  async fetchMenu(params = {}) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Fetching menu from Dutchie API for store: ${this.currentStore?.name || storeId}...`);
      const response = await this.client.get('/menu', {
        ...this.getAuthConfig(),
        params: {
          retailerId: storeId,
          ...params
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching menu:', error.message);
      throw error;
    }
  }

  async fetchOrders(params = {}) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Fetching orders from Dutchie API for store: ${this.currentStore?.name || storeId}...`);
      const response = await this.client.get('/orders', {
        ...this.getAuthConfig(),
        params: {
          retailerId: storeId,
          ...params
        }
      });

      console.log(`Fetched ${response.data?.length || 0} orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      throw error;
    }
  }

  async fetchRegisterTransactions(params = {}) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Fetching register transactions from Dutchie API for store: ${this.currentStore?.name || storeId}...`);

      // Always fetch last 10 minutes
      // This ensures we catch any delayed transactions with 5 minute overlap
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const fromDateTime = tenMinutesAgo.toISOString();
      const toDateTime = now.toISOString();

      console.log(`Fetching transactions from ${fromDateTime} to ${toDateTime} (last 10 minutes)`);

      const response = await this.client.get('/reporting/register-transactions', {
        ...this.getAuthConfig(),
        params: {
          retailerId: storeId,
          fromLastModifiedDateUTC: fromDateTime,
          toLastModifiedDateUTC: toDateTime,
          ...params
        }
      });

      console.log(`Fetched ${response.data?.length || 0} register transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching register transactions:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async makeCustomRequest(endpoint, method = 'GET', data = null, params = {}) {
    try {
      const storeId = this.getCurrentStoreId();
      console.log(`Making ${method} request to ${endpoint}...`);
      const config = {
        ...this.getAuthConfig(),
        method,
        url: endpoint,
        params: {
          retailerId: storeId,
          ...params
        }
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error.message);
      throw error;
    }
  }

  transformForElasticsearch(dutchieData) {
    // Transform Dutchie data structure to match Elasticsearch schema
    // Adjust this based on actual Dutchie API response structure
    if (Array.isArray(dutchieData)) {
      return dutchieData.map(item => this.transformSingleItem(item));
    }
    return this.transformSingleItem(dutchieData);
  }

  transformSingleItem(item) {
    // Check if this is a transaction (has registerTransactionId)
    if (item.registerTransactionId) {
      return {
        // Transaction fields at root level
        registerTransactionId: item.registerTransactionId,
        transactionType: item.transactionType,
        transactionAmount: item.transactionAmount,
        transactionBy: item.transactionBy,
        transactionDateUTC: item.transactionDateUTC,
        transactionId: item.transactionId,
        terminalName: item.terminalName,
        terminalId: item.terminalId,
        transactionByEmployeeId: item.transactionByEmployeeId,
        adjustmentReason: item.adjustmentReason,
        comment: item.comment,

        // Store metadata with location
        id: item.registerTransactionId?.toString(),
        store_id: this.currentStore?.dutchieStoreId,
        store_name: this.currentStore?.name,
        store_region: this.currentStore?.region,
        store_location: this.currentStore?.location,
        raw_data: item // Store original data
      };
    }

    // Default transformation for products/menu/orders
    return {
      id: item.id || item._id,
      name: item.name || item.title,
      description: item.description,
      price: item.price || item.pricing?.price,
      category: item.category || item.type,
      brand: item.brand || item.brandName,
      store_id: this.currentStore?.dutchieStoreId,
      store_name: this.currentStore?.name,
      store_region: this.currentStore?.region,
      store_location: this.currentStore?.location,
      raw_data: item // Store original data
    };
  }
}

module.exports = DutchieClient;
