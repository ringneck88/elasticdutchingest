const { Client } = require('@elastic/elasticsearch');
require('dotenv').config({ path: '.env', silent: true });

class ElasticsearchClient {
  constructor() {
    console.log('Initializing Elasticsearch client...');
    console.log('ELASTICSEARCH_NODE:', process.env.ELASTICSEARCH_NODE || 'NOT SET');
    console.log('ELASTICSEARCH_USERNAME:', process.env.ELASTICSEARCH_USERNAME ? 'SET' : 'NOT SET');
    console.log('ELASTICSEARCH_PASSWORD:', process.env.ELASTICSEARCH_PASSWORD ? 'SET' : 'NOT SET');

    const clientConfig = {
      node: process.env.ELASTICSEARCH_NODE
    };

    // Only add auth if username and password are provided
    if (process.env.ELASTICSEARCH_USERNAME &&
        process.env.ELASTICSEARCH_PASSWORD &&
        process.env.ELASTICSEARCH_PASSWORD !== 'your_elasticsearch_password_here') {
      clientConfig.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      };
      console.log('Using authenticated Elasticsearch connection');
    } else {
      console.log('Using non-authenticated Elasticsearch connection');
    }

    console.log('Client config (without password):', {
      node: clientConfig.node,
      hasAuth: !!clientConfig.auth
    });

    this.client = new Client(clientConfig);

    // Support for multiple indices by data type
    this.indices = {
      products: process.env.ELASTICSEARCH_INDEX_PRODUCTS || 'dutchie_products',
      menu: process.env.ELASTICSEARCH_INDEX_MENU || 'dutchie_menu',
      orders: process.env.ELASTICSEARCH_INDEX_ORDERS || 'dutchie_orders',
      transactions: process.env.ELASTICSEARCH_INDEX_TRANSACTIONS || 'dutchie_transactions'
    };

    // Keep backward compatibility
    this.indexName = process.env.ELASTICSEARCH_INDEX || 'dutchie_products';
  }

  async connect() {
    try {
      console.log('Attempting to connect to Elasticsearch...');
      const health = await this.client.cluster.health();
      console.log('✅ Connected to Elasticsearch:', health.cluster_name);
      console.log('Cluster status:', health.status);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Elasticsearch');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.meta) {
        console.error('Meta:', error.meta);
      }
      throw error;
    }
  }

  async createIndex(indexName = null, dataType = null) {
    try {
      const targetIndex = indexName || (dataType ? this.indices[dataType] : this.indexName);
      const exists = await this.client.indices.exists({ index: targetIndex });

      if (!exists) {
        // Define mappings based on data type
        let mappings = this.getDefaultMappings();

        if (dataType === 'transactions') {
          mappings = this.getTransactionMappings();
        }

        await this.client.indices.create({
          index: targetIndex,
          body: {
            mappings: {
              properties: mappings
            }
          }
        });
        console.log(`Index '${targetIndex}' created successfully`);
      } else {
        console.log(`Index '${targetIndex}' already exists`);
      }
    } catch (error) {
      console.error('Error creating index:', error.message);
      throw error;
    }
  }

  getDefaultMappings() {
    return {
      id: { type: 'keyword' },
      name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text' },
      price: { type: 'float' },
      category: { type: 'keyword' },
      brand: { type: 'keyword' },
      store_id: { type: 'keyword' },
      store_name: { type: 'keyword' },
      store_region: { type: 'keyword' },
      timestamp: { type: 'date' },
      raw_data: { type: 'object', enabled: false }
    };
  }

  getTransactionMappings() {
    return {
      // Transaction specific fields
      registerTransactionId: { type: 'long' },
      transactionType: { type: 'keyword' },
      transactionAmount: { type: 'float' },
      transactionBy: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      transactionDateUTC: { type: 'date' },
      transactionId: { type: 'long' },
      terminalName: { type: 'keyword' },
      terminalId: { type: 'long' },
      transactionByEmployeeId: { type: 'long' },
      adjustmentReason: { type: 'text' },
      comment: { type: 'text' },

      // Store metadata fields
      id: { type: 'keyword' },
      store_id: { type: 'keyword' },
      store_name: { type: 'keyword' },
      store_region: { type: 'keyword' },
      store_location: { type: 'geo_point' },
      timestamp: { type: 'date' },
      raw_data: { type: 'object', enabled: false }
    };
  }

  async indexDocument(document) {
    try {
      const response = await this.client.index({
        index: this.indexName,
        body: {
          ...document,
          timestamp: new Date().toISOString()
        }
      });
      return response;
    } catch (error) {
      console.error('Error indexing document:', error.message);
      throw error;
    }
  }

  async bulkIndex(documents, indexName = null, dataType = null) {
    if (!documents || documents.length === 0) {
      console.log('No documents to index');
      return;
    }

    try {
      const targetIndex = indexName || (dataType ? this.indices[dataType] : this.indexName);
      const body = documents.flatMap(doc => [
        { index: { _index: targetIndex, _id: doc.id } },
        { ...doc, timestamp: new Date().toISOString() }
      ]);

      const response = await this.client.bulk({ body, refresh: true });

      if (response.errors) {
        const erroredDocuments = [];
        response.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              document: documents[i]
            });
          }
        });
        console.error('Bulk indexing errors:', erroredDocuments);
      }

      console.log(`Bulk indexed ${documents.length} documents`);
      return response;
    } catch (error) {
      console.error('Error bulk indexing:', error.message);
      throw error;
    }
  }

  async search(query) {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: query
      });
      return response;
    } catch (error) {
      console.error('Error searching:', error.message);
      throw error;
    }
  }

  async close() {
    await this.client.close();
    console.log('Elasticsearch connection closed');
  }
}

module.exports = ElasticsearchClient;
