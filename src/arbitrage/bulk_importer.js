// Bulk import top-scoring parts into listings
const { importPart } = require('./manual_importer');
const { findTopParts } = require('./scanner');

function bulkImportTopParts(options = {}) {
  const parts = findTopParts(options);
  console.log(`[Bulk Import] Found ${parts.length} high-demand parts.`);
  const imported = [];
  for (const part of parts) {
    try {
      const listing = importPart({
        partNumber: part.partNumber,
        costPrice: part.avgCost,
        shippingCost: part.shipping,
        taxRate: 0.08,
        shippingDays: part.days,
        preferredSupplier: 'rockauto',
        competitorPrice: part.avgRetail,
        condition: 'New',
        inventory: 5,
      });
      imported.push(listing);
    } catch (e) {
      console.error('[Bulk Import] Failed for', part.partNumber, e.message);
    }
  }
  console.log(`[Bulk Import] Imported ${imported.length} listings.`);
  return imported;
}

if (require.main === module) {
  bulkImportTopParts({ minScore: 55, limit: 20 });
}

module.exports = { bulkImportTopParts };
