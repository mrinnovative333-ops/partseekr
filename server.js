require('./loadenv');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createPaymentLink } = require('./src/stripe_links');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const DEMAND_FILE = path.join(DATA_DIR, 'demand.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const SITE_NAME = 'PartSeekr';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// Seed data if files don't exist
function initStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(LISTINGS_FILE)) {
    const listings = [
      {
        id: 'lst_001',
        partNumber: 'BOS-04495',
        title: 'Bosch 04495 Brake Pad Set - Front',
        brand: 'Bosch',
        category: 'Brakes',
        condition: 'New',
        price: 47.99,
        inventory: 4,
        fits: '2015-2020 Ford F-150',
        description: 'Ceramic brake pad set, direct OEM replacement. Low dust, quiet operation.',
        image: 'https://placehold.co/400x300/e2e8f0/1e293b?text=BOS-04495',
        tags: ['brake pads', 'ford', 'f150', 'front'],
      },
      {
        id: 'lst_002',
        partNumber: 'NGK-6994',
        title: 'NGK 6994 Spark Plug - Iridium IX',
        brand: 'NGK',
        category: 'Ignition',
        condition: 'New',
        price: 8.49,
        inventory: 24,
        fits: 'Universal 14mm thread',
        description: 'Iridium IX spark plug. Pre-gapped, ready to install.',
        image: 'https://placehold.co/400x300/e2e8f0/1e293b?text=NGK-6994',
        tags: ['spark plug', 'ignition', 'iridium'],
      },
      {
        id: 'lst_003',
        partNumber: 'MOO-RK620497',
        title: 'Moog RK620497 Control Arm and Ball Joint',
        brand: 'Moog',
        category: 'Suspension',
        condition: 'New',
        price: 89.00,
        inventory: 2,
        fits: '2008-2012 Honda Accord',
        description: 'R-Series control arm with pressed-in ball joint. Powdered metal gusher bearing.',
        image: 'https://placehold.co/400x300/e2e8f0/1e293b?text=MOO-RK620497',
        tags: ['control arm', 'suspension', 'honda', 'accord'],
      },
    ];
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(listings, null, 2));
  }

  if (!fs.existsSync(DEMAND_FILE)) {
    const demand = [
      {
        id: 'dem_001',
        partNumber: 'DENSO-234-4622',
        title: 'Need Denso 234-4622 Oxygen Sensor',
        category: 'Exhaust',
        budget: 65.00,
        quantity: 2,
        location: 'Tulsa, OK',
        notes: 'Looking for upstream sensor for 2010 Toyota Camry.',
        contact: 'buyer@example.com',
        createdAt: new Date().toISOString(),
        tags: ['oxygen sensor', 'toyota', 'camry', 'exhaust'],
      },
      {
        id: 'dem_002',
        partNumber: 'ACD-41-1033',
        title: 'Wanted: ACDelco 41-1033 Ignition Coil',
        category: 'Ignition',
        budget: 22.00,
        quantity: 6,
        location: 'Oklahoma City, OK',
        notes: 'Need six coils for 2007 Chevy Silverado 5.3L.',
        contact: 'mechanic@example.com',
        createdAt: new Date().toISOString(),
        tags: ['ignition coil', 'chevy', 'silverado'],
      },
    ];
    fs.writeFileSync(DEMAND_FILE, JSON.stringify(demand, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, '[]');
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function renderPartPage(listing) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    image: listing.image,
    description: listing.description,
    brand: { '@type': 'Brand', name: listing.brand },
    mpn: listing.partNumber,
    category: listing.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/part/${listing.id}`,
      priceCurrency: 'USD',
      price: listing.price.toFixed(2),
      availability: listing.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${listing.title} | ${SITE_NAME}</title>
  <meta name="description" content="${listing.description.replace(/"/g, '&quot;')}">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <header class="site-header">
    <a href="/" class="logo">${SITE_NAME}</a>
    <nav>
      <a href="/">Parts</a>
      <a href="/demand.html">Demand Board</a>
      <a href="/sell.html">Sell a Part</a>
    </nav>
  </header>
  <main class="container part-detail">
    <div class="part-card-detail">
      <img src="${listing.image}" alt="${listing.title}">
      <div class="part-info">
        <h1>${listing.title}</h1>
        <p class="part-number">Part # ${listing.partNumber}</p>
        <p class="brand">Brand: ${listing.brand}</p>
        <p class="fits">Fits: ${listing.fits}</p>
        <p class="condition">Condition: ${listing.condition}</p>
        <p class="description">${listing.description}</p>
        <p class="price">$${listing.price.toFixed(2)}</p>
        <p class="stock">${listing.inventory > 0 ? `In stock: ${listing.inventory}` : 'Out of stock'}</p>
        ${listing.inventory > 0 ? `
        <form action="/checkout" method="POST" class="buy-form">
          <input type="hidden" name="listingId" value="${listing.id}">
          <label>Qty: <input type="number" name="quantity" value="1" min="1" max="${listing.inventory}"></label>
          <button type="submit" class="btn btn-primary">Buy Now</button>
        </form>
        ` : '<button class="btn" disabled>Out of Stock</button>'}
      </div>
    </div>
  </main>
  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Local auto parts, found fast.</p>
  </footer>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Create listing
  if (pathname === '/api/listings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const listings = readJson(LISTINGS_FILE);
        const listing = {
          id: 'lst_' + Date.now(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        listings.push(listing);
        writeJson(LISTINGS_FILE, listings);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(listing));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API: Listings
  if (pathname === '/api/listings' && req.method === 'GET') {
    const listings = readJson(LISTINGS_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(listings));
    return;
  }

  // API: Demand
  if (pathname === '/api/demand' && req.method === 'GET') {
    const demand = readJson(DEMAND_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(demand));
    return;
  }

  if (pathname === '/api/demand' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const demand = readJson(DEMAND_FILE);
        const entry = {
          id: 'dem_' + Date.now(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        demand.push(entry);
        writeJson(DEMAND_FILE, demand);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entry));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // SEO: robots.txt
  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    return;
  }

  // SEO: sitemap.xml
  if (pathname === '/sitemap.xml') {
    const listings = readJson(LISTINGS_FILE);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${SITE_URL}/demand.html</loc><priority>0.8</priority></url>\n`;
    xml += `  <url><loc>${SITE_URL}/sell.html</loc><priority>0.7</priority></url>\n`;
    listings.forEach(l => {
      xml += `  <url><loc>${SITE_URL}/part/${l.id}</loc><priority>0.9</priority></url>\n`;
    });
    xml += '</urlset>';
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(xml);
    return;
  }

  // Checkout form POST -> create order and redirect to Stripe
  if (pathname === '/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const listingId = params.get('listingId');
      const quantity = parseInt(params.get('quantity') || '1', 10);
      const listings = readJson(LISTINGS_FILE);
      const listing = listings.find(l => l.id === listingId);
      if (!listing || listing.inventory < quantity) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Not available</h1><a href="/">Back</a>');
        return;
      }

      const total = (listing.price * quantity).toFixed(2);
      const order = {
        id: 'ord_' + Date.now(),
        listingId,
        title: listing.title,
        partNumber: listing.partNumber,
        quantity,
        unitPrice: listing.price,
        total: parseFloat(total),
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
      };
      const orders = readJson(ORDERS_FILE);
      orders.push(order);
      writeJson(ORDERS_FILE, orders);

      // Try to auto-create Stripe payment link
      createPaymentLink({
        title: listing.title,
        amountCents: Math.round(order.total * 100),
        quantity,
        metadata: { order_id: order.id, part_number: listing.partNumber },
      })
        .then(link => {
          res.writeHead(302, { Location: link.url + '?client_reference_id=' + order.id });
          res.end();
        })
        .catch(err => {
          // Fallback to static payment link env var
          const staticUrl = process.env.STRIPE_PAYMENT_LINK_BASE;
          if (staticUrl) {
            res.writeHead(302, { Location: `${staticUrl}?client_reference_id=${order.id}` });
            res.end();
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<!DOCTYPE html>
<html><head><title>Order Created</title><link rel="stylesheet" href="/styles.css"></head>
<body class="container" style="padding-top:40px">
<h1>Order Created</h1>
<p>Order ID: <strong>${order.id}</strong></p>
<p>${listing.title} x ${quantity} = $${total}</p>
<p>Status: ${order.status}</p>
<p style="color:#ef4444">Stripe payment link failed: ${err.message}</p>
<p>Set STRIPE_PAYMENT_LINK_BASE or STRIPE_RESTRICTED_KEY.</p>
<a href="/" class="btn">Continue Shopping</a>
</body></html>`);
          }
        });
      return;
    });
    return;
  }

  // Server-rendered part page
  if (pathname.startsWith('/part/')) {
    const id = pathname.split('/')[2];
    const listings = readJson(LISTINGS_FILE);
    const listing = listings.find(l => l.id === id);
    if (listing) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderPartPage(listing));
      return;
    }
  }

  // Static files
  const extToType = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  const filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = extToType[ext] || 'text/plain';
  serveFile(res, filePath, contentType);
});

initStore();
server.listen(PORT, () => {
  console.log(`[${SITE_NAME}] Server running at ${SITE_URL}`);
});
