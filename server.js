require('./loadenv');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createPaymentLink } = require('./src/stripe_links');
const { sendTelegram, formatOrderAlert } = require('./src/telegram');
const { parseMultipart } = require('./src/uploads');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const DEMAND_FILE = path.join(DATA_DIR, 'demand.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const SITE_NAME = 'PartSeekr';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

function initStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(LISTINGS_FILE)) fs.writeFileSync(LISTINGS_FILE, '[]');
  if (!fs.existsSync(DEMAND_FILE)) fs.writeFileSync(DEMAND_FILE, '[]');
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return []; }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function renderPartPage(listing) {
  const mainImage = (listing.photos && listing.photos[0]) || listing.image;
  const thumbnails = (listing.photos || [listing.image]).slice(0, 8).map((url, i) => `<img src="${url}" alt="${listing.title}" onclick="document.getElementById('mainImage').src='${url}'" loading="lazy">`).join('');

  const schema = {
    '@context': 'https://schema.org', '@type': 'Product', name: listing.title, image: mainImage, description: listing.description,
    brand: { '@type': 'Brand', name: listing.brand }, mpn: listing.partNumber, category: listing.category,
    offers: { '@type': 'Offer', url: `${SITE_URL}/part/${listing.id}`, priceCurrency: 'USD', price: listing.price.toFixed(2),
      availability: listing.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: SITE_NAME } },
  };
  const shippingInfo = listing.shippingDays ? `<p class="shipping">Ships from supplier in ${listing.shippingDays} days</p>` : '';
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
  <header class="site-header"><a href="/" class="logo">${SITE_NAME}</a><nav><a href="/">Parts</a><a href="/demand.html">Demand Board</a><a href="/sell.html">Sell a Part</a></nav></header>
  <main class="container part-detail">
    <div class="part-card-detail">
      <div>
        <img id="mainImage" class="gallery-main" src="${mainImage}" alt="${listing.title}">
        <div class="gallery">${thumbnails}</div>
      </div>
      <div class="part-info">
        <h1>${listing.title}</h1>
        <p class="part-number">Part # ${listing.partNumber}</p>
        <p class="brand">Brand: ${listing.brand}</p>
        <p class="fits">Fits: ${listing.fits}</p>
        <p class="condition">Condition: ${listing.condition}</p>
        <p class="description">${listing.description}</p>
        ${shippingInfo}
        <p class="price">$${listing.price.toFixed(2)}</p>
        <p class="stock">${listing.inventory > 0 ? `In stock: ${listing.inventory}` : 'Out of stock'}</p>
        ${listing.inventory > 0 ? `
        <form action="/checkout" method="POST" class="buy-form">
          <input type="hidden" name="listingId" value="${listing.id}">
          <label>Qty: <input type="number" name="quantity" value="1" min="1" max="${listing.inventory}"></label>
          <button type="submit" class="btn btn-primary">Buy Now</button>
        </form>` : '<button class="btn" disabled>Out of Stock</button>'}
      </div>
    </div>
  </main>
  <footer class="site-footer"><p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Local auto parts, found fast.</p></footer>
</body>
</html>`;
}

function renderCheckoutForm(listing, quantity, errors = {}) {
  const total = (listing.price * quantity).toFixed(2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout | ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>.checkout-form{max-width:600px;margin:0 auto}.field{margin-bottom:1rem}.field label{display:block;margin-bottom:.25rem}.field input,.field textarea{width:100%}.error{color:var(--danger);font-size:.85rem}</style>
</head>
<body>
  <header class="site-header"><a href="/" class="logo">${SITE_NAME}</a></header>
  <main class="container">
    <div class="checkout-form">
      <h2>Complete Your Order</h2>
      <p><strong>${listing.title}</strong> x ${quantity}</p>
      <p class="price">Total: $${total}</p>
      <form action="/checkout" method="POST">
        <input type="hidden" name="listingId" value="${listing.id}">
        <input type="hidden" name="quantity" value="${quantity}">
        <input type="hidden" name="step" value="confirm">
        <div class="field"><label>Full Name *</label><input type="text" name="name" required value="${(errors.name || '').replace(/"/g, '&quot;')}">${errors.name ? `<span class="error">${errors.name}</span>` : ''}</div>
        <div class="field"><label>Email *</label><input type="email" name="email" required value="${(errors.email || '').replace(/"/g, '&quot;')}">${errors.email ? `<span class="error">${errors.email}</span>` : ''}</div>
        <div class="field"><label>Phone *</label><input type="tel" name="phone" required value="${(errors.phone || '').replace(/"/g, '&quot;')}">${errors.phone ? `<span class="error">${errors.phone}</span>` : ''}</div>
        <div class="field"><label>Street Address *</label><input type="text" name="address" required value="${(errors.address || '').replace(/"/g, '&quot;')}">${errors.address ? `<span class="error">${errors.address}</span>` : ''}</div>
        <div class="field"><label>City *</label><input type="text" name="city" required value="${(errors.city || '').replace(/"/g, '&quot;')}">${errors.city ? `<span class="error">${errors.city}</span>` : ''}</div>
        <div class="field"><label>State *</label><input type="text" name="state" required value="${(errors.state || '').replace(/"/g, '&quot;')}">${errors.state ? `<span class="error">${errors.state}</span>` : ''}</div>
        <div class="field"><label>ZIP Code *</label><input type="text" name="zip" required value="${(errors.zip || '').replace(/"/g, '&quot;')}">${errors.zip ? `<span class="error">${errors.zip}</span>` : ''}</div>
        <div class="field"><label>Order Notes (optional)</label><textarea name="notes" rows="3">${(errors.notes || '').replace(/"/g, '&quot;')}</textarea></div>
        <button type="submit" class="btn btn-primary">Pay Securely with Stripe</button>
      </form>
    </div>
  </main>
  <footer class="site-footer"><p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Local auto parts, found fast.</p></footer>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true); const pathname = parsed.pathname;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (pathname === '/api/listings' && req.method === 'POST') {
    let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
      try { const data = JSON.parse(body); const listings = readJson(LISTINGS_FILE); const listing = { id: 'lst_' + Date.now(), ...data, createdAt: new Date().toISOString() }; listings.push(listing); writeJson(LISTINGS_FILE, listings); res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(listing)); }
      catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid JSON' })); }
    }); return;
  }
  if (pathname === '/api/listings/upload' && req.method === 'POST') {
    parseMultipart(req, UPLOAD_DIR).then(({ fields, files }) => {
      const photoUrls = [];
      for (let i = 0; i < 5; i++) {
        const f = files[`photos${i}`];
        if (f) photoUrls.push(`${SITE_URL}/uploads/${f.savedName}`);
      }
      const listing = {
        id: 'lst_' + Date.now(),
        title: fields.title || '',
        partNumber: (fields.partNumber || '').toUpperCase(),
        brand: fields.brand || '',
        category: fields.category || '',
        condition: fields.condition || 'New',
        price: parseFloat(fields.price || '0'),
        inventory: parseInt(fields.inventory || '1', 10),
        fits: fields.fits || '',
        description: fields.description || '',
        image: photoUrls[0] || `https://placehold.co/400x300/e2e8f0/1e293b?text=${encodeURIComponent((fields.partNumber || 'PART').toUpperCase())}`,
        photos: photoUrls.length ? photoUrls : undefined,
        tags: (fields.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };
      const listings = readJson(LISTINGS_FILE); listings.push(listing); writeJson(LISTINGS_FILE, listings);
      res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(listing));
    }).catch(err => { res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end(err.message); });
    return;
  }
  if (pathname === '/api/listings' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(readJson(LISTINGS_FILE))); return; }
  if (pathname === '/api/orders' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(readJson(ORDERS_FILE))); return; }
  if (pathname === '/api/demand' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(readJson(DEMAND_FILE))); return; }
  if (pathname === '/api/demand' && req.method === 'POST') {
    let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
      try { const data = JSON.parse(body); const demand = readJson(DEMAND_FILE); const entry = { id: 'dem_' + Date.now(), ...data, createdAt: new Date().toISOString() }; demand.push(entry); writeJson(DEMAND_FILE, demand); res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(entry)); }
      catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid JSON' })); }
    }); return;
  }
  if (pathname === '/api/demand/upload' && req.method === 'POST') {
    parseMultipart(req, UPLOAD_DIR).then(({ fields, files }) => {
      const photoUrls = [];
      for (let i = 0; i < 5; i++) {
        const f = files[`photos${i}`];
        if (f) photoUrls.push(`${SITE_URL}/uploads/${f.savedName}`);
      }
      const entry = {
        id: 'dem_' + Date.now(),
        title: fields.title || '',
        partNumber: (fields.partNumber || '').toUpperCase(),
        category: fields.category || '',
        budget: parseFloat(fields.budget || '0'),
        quantity: parseInt(fields.quantity || '1', 10),
        location: fields.location || '',
        contact: fields.contact || '',
        notes: fields.notes || '',
        photos: photoUrls.length ? photoUrls : undefined,
        tags: (fields.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };
      const demand = readJson(DEMAND_FILE); demand.push(entry); writeJson(DEMAND_FILE, demand);
      res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(entry));
    }).catch(err => { res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end(err.message); });
    return;
  }
  if (pathname === '/api/admin/apply-photo' && req.method === 'POST') {
    parseMultipart(req, UPLOAD_DIR).then(({ fields, files }) => {
      const partNumber = (fields.partNumber || '').toUpperCase();
      const f = files.photo;
      if (!partNumber || !f) { res.writeHead(400); res.end('Missing partNumber or photo'); return; }
      const listings = readJson(LISTINGS_FILE);
      const idx = listings.findIndex(l => l.partNumber.toUpperCase() === partNumber);
      if (idx === -1) { res.writeHead(404); res.end('Listing not found'); return; }
      const photoUrl = `${SITE_URL}/uploads/${f.savedName}`;
      if (!listings[idx].photos) listings[idx].photos = [];
      listings[idx].photos.push(photoUrl);
      listings[idx].photos = listings[idx].photos.slice(-8);
      listings[idx].image = listings[idx].photos[0];
      writeJson(LISTINGS_FILE, listings);
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, partNumber, photoUrl }));
    }).catch(err => { res.writeHead(400); res.end(err.message); });
    return;
  }
  if (pathname.startsWith('/uploads/')) {
    const file = pathname.replace('/uploads/', '').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(UPLOAD_DIR, file);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).pipe(res);
    } else { res.writeHead(404); res.end('Not found'); }
    return;
  }
  if (pathname === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`); return; }
  if (pathname === '/sitemap.xml') {
    const listings = readJson(LISTINGS_FILE); let xml = '<?xml version="1.0" encoding="UTF-8"?\u003e\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>\n`; xml += `  <url><loc>${SITE_URL}/demand.html</loc><priority>0.8</priority></url>\n`; xml += `  <url><loc>${SITE_URL}/sell.html</loc><priority>0.7</priority></url>\n`;
    listings.forEach(l => { xml += `  <url><loc>${SITE_URL}/part/${l.id}</loc><priority>0.9</priority></url>\n`; });
    xml += '</urlset>'; res.writeHead(200, { 'Content-Type': 'application/xml' }); res.end(xml); return;
  }
  if (pathname === '/webhooks/stripe' && req.method === 'POST') {
    let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const session = event.data?.object || {};
        const orderId = session.client_reference_id || session.metadata?.order_id;
        if (orderId) {
          const orders = readJson(ORDERS_FILE); const order = orders.find(o => o.id === orderId);
          if (order) {
            order.status = 'paid'; order.paidAt = new Date().toISOString(); writeJson(ORDERS_FILE, orders);
            const listings = readJson(LISTINGS_FILE); const listing = listings.find(l => l.id === order.listingId);
            if (listing) sendTelegram(formatOrderAlert(order, listing)).catch(console.error);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ received: true }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid payload' })); }
    }); return;
  }
  if (pathname === '/checkout' && req.method === 'POST') {
    let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
      const params = new URLSearchParams(body);
      const listingId = params.get('listingId'); const quantity = parseInt(params.get('quantity') || '1', 10); const step = params.get('step') || 'form';
      const listings = readJson(LISTINGS_FILE); const listing = listings.find(l => l.id === listingId);
      if (!listing || listing.inventory < quantity) { res.writeHead(400, { 'Content-Type': 'text/html' }); res.end('<h1>Not available</h1><a href="/">Back</a>'); return; }
      if (step === 'form') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(renderCheckoutForm(listing, quantity)); return; }
      const customer = {
        name: params.get('name') || '', email: params.get('email') || '', phone: params.get('phone') || '',
        address: params.get('address') || '', city: params.get('city') || '', state: params.get('state') || '', zip: params.get('zip') || '', notes: params.get('notes') || '',
      };
      const errors = {};
      if (!customer.name) errors.name = 'Required'; if (!customer.email) errors.email = 'Required'; if (!customer.phone) errors.phone = 'Required';
      if (!customer.address) errors.address = 'Required'; if (!customer.city) errors.city = 'Required'; if (!customer.state) errors.state = 'Required'; if (!customer.zip) errors.zip = 'Required';
      if (Object.keys(errors).length > 0) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(renderCheckoutForm(listing, quantity, { ...errors, ...customer })); return; }
      const total = (listing.price * quantity).toFixed(2);
      const order = {
        id: 'ord_' + Date.now(), listingId, title: listing.title, partNumber: listing.partNumber, quantity, unitPrice: listing.price,
        total: parseFloat(total), status: 'pending_payment', customer, createdAt: new Date().toISOString(),
      };
      const orders = readJson(ORDERS_FILE); orders.push(order); writeJson(ORDERS_FILE, orders);
      createPaymentLink({ title: listing.title, amountCents: Math.round(order.total * 100), quantity, metadata: { order_id: order.id, part_number: listing.partNumber } })
        .then(link => { res.writeHead(302, { Location: link.url + '?client_reference_id=' + order.id }); res.end(); })
        .catch(err => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<!DOCTYPE html><html><head><title>Order Created</title><link rel="stylesheet" href="/styles.css"></head><body class="container" style="padding-top:40px"><h1>Order Created</h1><p>Order ID: <strong>${order.id}</strong></p><p>${listing.title} x ${quantity} = $${total}</p><p>Status: ${order.status}</p><p style="color:#ef4444">Stripe payment link failed: ${err.message}</p><p>We saved your order. Please contact support to complete payment.</p><a href="/" class="btn">Continue Shopping</a></body></html>`);
        });
      return;
    }); return;
  }
  if (pathname.startsWith('/part/')) {
    const id = pathname.split('/')[2]; const listings = readJson(LISTINGS_FILE); const listing = listings.find(l => l.id === id);
    if (listing) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(renderPartPage(listing)); return; }
  }
  const extToType = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  const ext = path.extname(filePath).toLowerCase();
  serveFile(res, filePath, extToType[ext] || 'text/plain');
});

initStore();
server.listen(PORT, () => { console.log(`[${SITE_NAME}] Server running at ${SITE_URL}`); });
