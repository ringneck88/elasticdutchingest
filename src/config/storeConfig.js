const fs = require('fs');
const path = require('path');

class StoreConfig {
  constructor(configFilePath = null) {
    this.configFilePath = configFilePath || path.join(process.cwd(), 'stores-api.json');
    this.stores = [];
    this.loadStores();
  }

  loadStores() {
    try {
      const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // Handle stores-api.json format
      if (jsonData.stores && Array.isArray(jsonData.stores)) {
        this.stores = jsonData.stores
          .filter(store => store.status === 'active' && store.apis && store.apis.length > 0)
          .map((store, index) => {
            // Find the Internal API key, or use the first available API key
            const internalApi = store.apis.find(api => api.name === 'Internal');
            const apiKey = internalApi ? internalApi.apiKey : store.apis[0].apiKey;

            // Get coordinates for this store
            const coords = this.getStoreCoordinates(store.name);

            return {
              id: index + 1,
              documentId: store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: store.name,
              slug: store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              dutchieStoreId: apiKey,
              apiKey: apiKey,
              apis: store.apis,
              phone: null,
              email: null,
              timezone: this.determineTimezone(store.name),
              region: this.determineRegion(store.name),
              address: null,
              geo: coords,
              location: coords ? { lat: coords.lat, lon: coords.lon } : null,
              isActive: store.status === 'active'
            };
          });

        console.log(`Loaded ${this.stores.length} active stores from configuration`);
      }
      // Handle all_stores.json format (legacy)
      else if (jsonData.data && Array.isArray(jsonData.data)) {
        this.stores = jsonData.data
          .filter(store => store.is_active && store.DutchieStoreID)
          .map(store => ({
            id: store.id,
            documentId: store.documentId,
            name: store.name,
            slug: store.slug,
            dutchieStoreId: store.DutchieStoreID,
            apiKey: store.DutchieStoreID,
            phone: store.phone,
            email: store.email,
            timezone: store.timezone,
            region: store.region?.name,
            address: store.address,
            geo: store.geo,
            isActive: store.is_active
          }));

        console.log(`Loaded ${this.stores.length} active stores from configuration`);
      } else {
        console.warn('No stores found in configuration file');
      }
    } catch (error) {
      console.error('Error loading store configuration:', error.message);
      throw error;
    }
  }

  determineTimezone(storeName) {
    if (storeName.includes('Florida') || storeName.includes('Cannabist')) {
      return 'America/New_York';
    } else if (storeName.includes('Arizona') || storeName.includes('Phoenix') ||
               storeName.includes('Scottsdale') || storeName.includes('Mesa') ||
               storeName.includes('Tempe') || storeName.includes('Buckeye') ||
               storeName.includes('Mirage')) {
      return 'America/Phoenix';
    } else if (storeName.includes('Nevada') || storeName.includes('Vegas') ||
               storeName.includes('Paradise') || storeName.includes('Rainbow')) {
      return 'America/Los_Angeles';
    } else if (storeName.includes('Michigan') || storeName.includes('Kalamazoo') ||
               storeName.includes('Coldwater') || storeName.includes('Portage') ||
               storeName.includes('Roseville') || storeName.includes('Monroe') ||
               storeName.includes('Buffalo')) {
      return 'America/Detroit';
    } else if (storeName.includes('Illinois') || storeName.includes('IL ')) {
      return 'America/Chicago';
    } else if (storeName.includes('Missouri') || storeName.includes('St Peters')) {
      return 'America/Chicago';
    }
    return 'America/New_York'; // Default
  }

  determineRegion(storeName) {
    if (storeName.includes('Cannabist') &&
        (storeName.includes('Bonita') || storeName.includes('Bradenton') ||
         storeName.includes('Brandon') || storeName.includes('Cape Coral') ||
         storeName.includes('Delray') || storeName.includes('Gainesville') ||
         storeName.includes('Jacksonville') || storeName.includes('Lakeland') ||
         storeName.includes('Longwood') || storeName.includes('Melbourne') ||
         storeName.includes('Miami') || storeName.includes('Orlando') ||
         storeName.includes('Sarasota') || storeName.includes('Augustine') ||
         storeName.includes('Stuart'))) {
      return 'Florida';
    } else if (storeName.includes('Arcadia')) {
      return 'Arizona';
    } else if (storeName.includes('Phoenix') || storeName.includes('Scottsdale') ||
               storeName.includes('Mesa') || storeName.includes('Tempe') ||
               storeName.includes('Buckeye') || storeName.includes('Mirage') ||
               storeName.includes('Northern') || storeName.includes('Bell Rd') ||
               storeName.includes('75th Ave')) {
      return 'Arizona';
    } else if (storeName.includes('Vegas') || storeName.includes('Paradise') ||
               storeName.includes('Rainbow')) {
      return 'Nevada';
    } else if (storeName.includes('Kalamazoo') || storeName.includes('Coldwater') ||
               storeName.includes('Portage') || storeName.includes('Roseville') ||
               storeName.includes('Monroe') || storeName.includes('Buffalo')) {
      return 'Michigan';
    } else if (storeName.includes('IL ') || storeName.includes('Illinois')) {
      return 'Illinois';
    } else if (storeName.includes('St Peters')) {
      return 'Missouri';
    }
    return 'Unknown';
  }

  getStoreCoordinates(storeName) {
    // Coordinates mapping from STORE-COORDINATES-MANUAL-UPDATE.md
    const coordinates = {
      // Arizona
      'Buckeye': { lat: 33.4289, lon: -112.6387 },
      '75th Ave': { lat: 33.5008, lon: -112.1413 },
      'Mesa': { lat: 33.3940, lon: -111.7890 },
      'Tempe': { lat: 33.4145, lon: -111.9192 },
      'El Mirage': { lat: 33.6067, lon: -112.3250 },
      'Bell Rd': { lat: 33.6182, lon: -111.9949 },
      'Northern': { lat: 33.6182, lon: -111.9949 },
      'Scottsdale': { lat: 33.4942, lon: -111.9261 },
      'Mirage': { lat: 33.6182, lon: -111.9949 },

      // Nevada
      'Paradise': { lat: 36.1147, lon: -115.1728 },
      'Rainbow': { lat: 36.1699, lon: -115.2398 },

      // Michigan
      'Monroe': { lat: 41.9165, lon: -83.3977 },
      'Coldwater': { lat: 41.9403, lon: -85.0005 },
      'Portage': { lat: 42.2011, lon: -85.5800 },
      'Kalamazoo': { lat: 42.2917, lon: -85.5872 },
      'Buffalo': { lat: 41.7964, lon: -86.7442 },
      'Roseville': { lat: 42.4973, lon: -82.9371 },

      // Missouri
      'St Peters': { lat: 38.7875, lon: -90.6298 },

      // Illinois
      'IL LLC': { lat: 41.7697, lon: -87.9395 },

      // Florida
      'Bradenton': { lat: 27.4989, lon: -82.5748 },
      'Cape Coral': { lat: 26.5629, lon: -81.9495 },
      'Delray': { lat: 26.4615, lon: -80.0728 },
      'Gainesville': { lat: 29.6516, lon: -82.3248 },
      'Jacksonville': { lat: 30.3322, lon: -81.6557 },
      'Longwood': { lat: 28.7033, lon: -81.3384 },
      'Melbourne': { lat: 28.0836, lon: -80.6081 },
      'Miami': { lat: 25.7617, lon: -80.1918 },
      'Orlando': { lat: 28.5383, lon: -81.3792 },
      'Sarasota': { lat: 27.3364, lon: -82.5307 },
      'Augustine': { lat: 29.9012, lon: -81.3124 },
      'Stuart': { lat: 27.1973, lon: -80.2528 },
      'Bonita': { lat: 26.3398, lon: -81.7787 },
      'Brandon': { lat: 27.9378, lon: -82.2859 }
    };

    // Find matching coordinate by checking if any key is in the store name
    for (const [key, coords] of Object.entries(coordinates)) {
      if (storeName.includes(key)) {
        return coords;
      }
    }

    return null;
  }

  getAllStores() {
    return this.stores;
  }

  getActiveStores() {
    return this.stores.filter(store => store.isActive);
  }

  getStoreById(id) {
    return this.stores.find(store => store.id === id);
  }

  getStoreByDutchieId(dutchieStoreId) {
    return this.stores.find(store => store.dutchieStoreId === dutchieStoreId);
  }

  getStoreBySlug(slug) {
    return this.stores.find(store => store.slug === slug);
  }

  getStoresByRegion(region) {
    return this.stores.filter(store => store.region === region);
  }

  getStoreCount() {
    return this.stores.length;
  }

  listStores() {
    console.log('\n=== Available Stores ===');
    this.stores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} (ID: ${store.id})`);
      console.log(`   Dutchie ID: ${store.dutchieStoreId}`);
      console.log(`   Region: ${store.region || 'N/A'}`);
      console.log(`   Address: ${store.address?.street}, ${store.address?.city}, ${store.address?.state}`);
      console.log('');
    });
  }
}

module.exports = StoreConfig;
