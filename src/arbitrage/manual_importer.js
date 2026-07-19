// Manual importer with landed cost, supplier URL, and shipping estimate
const fs = require('fs');
const path = require('path');
const { generateListing } = require('./seo_generator');
const { applyMarkup, estimateProfit } = require('./markup');
const { detectSupplierUrl, estimateLandedCost } = require('./suppliers');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function importPart({
  partNumber,
  costPrice,
  shippingCost = 0,
  taxRate = 0,
  shippingDays = 3,
  preferredSupplier = 'rockauto',
  condition,
  inventory,
  fits,
  image,
  competitorPrice,
}) {
  const draft = generateListing({ partNumber, costPrice, condition, inventory, fits, image });
  const landed = estimateLandedCost({ costPrice, shippingCost, taxRate });
  const supplierUrl = detectSupplierUrl({ partNumber, preferred: preferredSupplier });

  const sellingPrice = applyMarkup(landed.landedCost, competitorPrice);
  const profit = estimateProfit(landed.landedCost, sellingPrice);

  const listing = {
    id: 'lst_' + Date.now(),
    ...draft,
    price: sellingPrice,
    costPrice,
    shippingCost,
    taxRate,
    tax: landed.tax,
    landedCost: landed.landedCost,
    shippingDays,
    preferredSupplier,
    supplierUrl,
    competitorPrice: competitorPrice || null,
    profitGross: profit.gross,
    profitMargin: profit.margin,
    createdAt: new Date().toISOString(),
  };

  const listings = readJson(LISTINGS_FILE);
  listings.push(listing);
  writeJson(LISTINGS_FILE, listings);

  console.log('[Importer] Created listing:');
  console.log('  Title: ' + listing.title);
  console.log('  Cost: $' + costPrice.toFixed(2));
  console.log('  Shipping: $' + shippingCost.toFixed(2));
  console.log('  Tax: ' + (taxRate * 100).toFixed(2) + '%');
  console.log('  Landed Cost: $' + landed.landedCost.toFixed(2));
  console.log('  Price: $' + listing.price.toFixed(2));
  console.log('  Margin: ' + listing.profitMargin + '%');
  console.log('  Supplier: ' + listing.supplierUrl);
  console.log('  View: http://localhost:3000/part/' + listing.id);
  return listing;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node src/arbitrage/manual_importer.js <PART_NUMBER> <COST_PRICE> [SHIPPING_COST] [TAX_RATE] [SHIPPING_DAYS] [PREFERRED_SUPPLIER] [COMPETITOR_PRICE] [CONDITION] [INVENTORY]');
    console.log('Example: node src/arbitrage/manual_importer.js BOS-04495 32.50 5.99 0.08 3 rockauto 52.00 New 4');
    process.exit(1);
  }

  importPart({
    partNumber: args[0],
    costPrice: parseFloat(args[1]),
    shippingCost: args[2] ? parseFloat(args[2]) : 0,
    taxRate: args[3] ? parseFloat(args[3]) : 0,
    shippingDays: args[4] ? parseInt(args[4], 10) : 3,
    preferredSupplier: args[5] || 'rockauto',
    competitorPrice: args[6] ? parseFloat(args[6]) : null,
    condition: args[7] || 'New',
    inventory: args[8] ? parseInt(args[8], 10) : 3,
  });
}

module.exports = { importPart };
