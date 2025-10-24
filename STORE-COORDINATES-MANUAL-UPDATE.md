# Manual Store Coordinates Update Guide

Since the API token isn't working, here's how to manually add coordinates to each store in Strapi:

## Step 1: Add the `geo` field to Store content type

1. Go to Strapi Admin → Content-Type Builder
2. Click on "Store"
3. Click "Add another field"
4. Select **JSON** field type
5. Name: `geo`
6. Click "Finish"
7. Click "Save" (this will restart your server)

## Step 2: Add coordinates to each store

Go to Content Manager → Stores and edit each store with these coordinates:

### Arizona Stores

**Mint Cannabis Buckeye**
```json
{"lat": 33.4289, "lon": -112.6387}
```

**Mint Cannabis 75th Ave Phoenix**
```json
{"lat": 33.5008, "lon": -112.1413}
```

**Mint Cannabis Mesa**
```json
{"lat": 33.3940, "lon": -111.7890}
```

**Mint Cannabis Tempe**
```json
{"lat": 33.4145, "lon": -111.9192}
```

**Mint Cannabis El Mirage**
```json
{"lat": 33.6067, "lon": -112.3250}
```

**Mint Cannabis Phoenix**
```json
{"lat": 33.5097, "lon": -112.0429}
```

**Mint Cannabis Northern Phoenix**
```json
{"lat": 33.6182, "lon": -111.9949}
```

**Mint Cannabis Scottsdale**
```json
{"lat": 33.4942, "lon": -111.9261}
```

### Nevada Stores

**Mint Cannabis Las Vegas Strip Dispensary**
```json
{"lat": 36.1147, "lon": -115.1728}
```

**Mint Cannabis West Las Vegas Dispensary**
```json
{"lat": 36.1699, "lon": -115.2398}
```

### Michigan Stores

**Mint Cannabis Monroe MI Dispensary**
```json
{"lat": 41.9165, "lon": -83.3977}
```

**Mint Cannabis Coldwater MI Dispensary**
```json
{"lat": 41.9403, "lon": -85.0005}
```

**Mint Cannabis Portage MI Dispensary**
```json
{"lat": 42.2011, "lon": -85.5800}
```

**Mint Cannabis Kalamazoo MI Dispensary**
```json
{"lat": 42.2917, "lon": -85.5872}
```

**Mint Cannabis New Buffalo MI Dispensary**
```json
{"lat": 41.7964, "lon": -86.7442}
```

**Mint Cannabis Roseville MI Dispensary**
```json
{"lat": 42.4973, "lon": -82.9371}
```

### Missouri Store

**Mint Cannabis - St. Peters Dispensary**
```json
{"lat": 38.7875, "lon": -90.6298}
```

### Illinois Store

**Mint Cannabis - Willowbrook IL Dispensary**
```json
{"lat": 41.7697, "lon": -87.9395}
```

### Florida Stores

**Mint Cannabis Bradenton FL Dispensary**
```json
{"lat": 27.4989, "lon": -82.5748}
```

**Mint Cannabis Cape Coral FL Dispensary**
```json
{"lat": 26.5629, "lon": -81.9495}
```

**Mint Cannabis Delray Beach FL Dispensary**
```json
{"lat": 26.4615, "lon": -80.0728}
```

**Mint Cannabis Gainesville FL Dispensary**
```json
{"lat": 29.6516, "lon": -82.3248}
```

**Mint Cannabis Jacksonville FL Dispensary**
```json
{"lat": 30.3322, "lon": -81.6557}
```

**Mint Cannabis Longwood FL Dispensary**
```json
{"lat": 28.7033, "lon": -81.3384}
```

**Mint Cannabis Melbourne FL Dispensary**
```json
{"lat": 28.0836, "lon": -80.6081}
```

**Mint Cannabis Miami FL Dispensary**
```json
{"lat": 25.7617, "lon": -80.1918}
```

**Mint Cannabis Orlando FL Dispensary**
```json
{"lat": 28.5383, "lon": -81.3792}
```

**Mint Cannabis Sarasota FL Dispensary**
```json
{"lat": 27.3364, "lon": -82.5307}
```

**Mint Cannabis St. Augustine FL Dispensary**
```json
{"lat": 29.9012, "lon": -81.3124}
```

**Mint Cannabis Stuart FL Dispensary**
```json
{"lat": 27.1973, "lon": -80.2528}
```

**Mint Cannabis Bonita Springs FL Dispensary**
```json
{"lat": 26.3398, "lon": -81.7787}
```

**Mint Cannabis Brandon FL Dispensary**
```json
{"lat": 27.9378, "lon": -82.2859}
```

## After adding all coordinates:

1. Make sure each store is **Saved** and **Published**
2. Run a rebuild and deploy:
   ```bash
   npx astro build
   npx wrangler pages deploy dist
   ```

The geolocation sorting will now work on the live site!
