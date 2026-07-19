// High-demand auto parts discovery engine
// Uses curated lists of fast-moving, high-margin parts plus keyword/SEO scoring.

const POPULAR_PARTS = [
  { partNumber: 'BOS-04495', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2015-2020 Ford F-150', monthlySearches: 5400, avgRetail: 52, avgCost: 32.5, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-6994', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: 'Universal 14mm thread', monthlySearches: 8100, avgRetail: 11.99, avgCost: 5.5, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4622', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2010 Toyota Camry 2.5L', monthlySearches: 6600, avgRetail: 74.99, avgCost: 42, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-41-1033', brand: 'ACDelco', category: 'Ignition', type: 'Ignition Coil', fits: '2007-2013 Chevy Silverado 5.3L', monthlySearches: 4900, avgRetail: 26.99, avgCost: 14.75, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620497', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2008-2012 Honda Accord', monthlySearches: 4400, avgRetail: 105, avgCost: 58, shipping: 8.99, days: 4 },
  { partNumber: 'MOTORCRAFT-FL500S', brand: 'Motorcraft', category: 'OEM', type: 'Oil Filter', fits: 'Ford F-150 / Mustang', monthlySearches: 7200, avgRetail: 12.99, avgCost: 6.25, shipping: 4.99, days: 3 },
  { partNumber: 'BOS-BC905', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2005-2015 Toyota Tacoma', monthlySearches: 3900, avgRetail: 48, avgCost: 30, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-LFR6AIX-11', brand: 'NGK', category: 'Ignition', type: 'Iridium IX Spark Plug', fits: 'BMW / Nissan / Subaru', monthlySearches: 6200, avgRetail: 13.99, avgCost: 7, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-9052', brand: 'Denso', category: 'Exhaust', type: 'Air Fuel Ratio Sensor', fits: '2004-2009 Toyota Prius', monthlySearches: 5100, avgRetail: 89.99, avgCost: 52, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620568', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2003-2007 Honda Accord', monthlySearches: 3600, avgRetail: 98, avgCost: 54, shipping: 8.99, days: 4 },
  { partNumber: 'ACD-12611420', brand: 'ACDelco', category: 'Engine', type: 'Mass Air Flow Sensor', fits: '2007-2014 Chevy Silverado', monthlySearches: 5800, avgRetail: 67.99, avgCost: 38, shipping: 5.99, days: 3 },
  { partNumber: 'BOS-15003', brand: 'Bosch', category: 'Brakes', type: 'Brake Rotor', fits: '2010-2018 Toyota Camry', monthlySearches: 4700, avgRetail: 59.99, avgCost: 34, shipping: 7.99, days: 4 },
  { partNumber: 'MOTORCRAFT-DG511', brand: 'Motorcraft', category: 'Ignition', type: 'Ignition Coil', fits: '2008-2010 Ford F-150 5.4L', monthlySearches: 4300, avgRetail: 31.99, avgCost: 17.5, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-ES800373', brand: 'Moog', category: 'Steering', type: 'Tie Rod End', fits: '2004-2012 Ford F-150', monthlySearches: 4100, avgRetail: 29.99, avgCost: 15.5, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-950-0107', brand: 'Denso', category: 'Engine', type: 'Fuel Pump Module', fits: '2001-2004 Toyota Camry', monthlySearches: 3800, avgRetail: 119.99, avgCost: 72, shipping: 8.99, days: 4 },
];

const DEFAULT_TAX_RATE = 0.08;

function scorePart(part) {
  const landed = part.avgCost + part.shipping + (part.avgCost * DEFAULT_TAX_RATE);
  const gross = part.avgRetail - landed;
  const margin = gross / part.avgRetail;
  const demandScore = Math.min(part.monthlySearches / 10000, 1);
  const marginScore = Math.min(margin / 0.35, 1);
  const profitScore = Math.min(gross / 30, 1);
  return {
    landed,
    gross,
    margin,
    score: (demandScore * 0.4 + marginScore * 0.35 + profitScore * 0.25) * 100,
  };
}

function findTopParts({ minScore = 50, limit = 20, minMargin = 0.20 } = {}) {
  return POPULAR_PARTS
    .map(p => ({ ...p, ...scorePart(p) }))
    .filter(p => p.score >= minScore && p.margin >= minMargin)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function generateSeoKeywords(part) {
  const keywords = [];
  const cleanPn = part.partNumber.toLowerCase().replace(/[^a-z0-9-]/g, '');
  keywords.push(`${part.brand} ${part.partNumber}`);
  keywords.push(`${part.partNumber} ${part.type}`);
  keywords.push(`${part.type} for ${part.fits}`);
  keywords.push(`buy ${part.partNumber} online`);
  keywords.push(`${part.partNumber} near me`);
  keywords.push(`${part.brand.toLowerCase()} ${part.type} ${part.fits}`);
  if (part.monthlySearches) {
    keywords.push(`${cleanPn} in stock`);
    keywords.push(`best price ${part.partNumber}`);
  }
  return keywords;
}

module.exports = { findTopParts, scorePart, generateSeoKeywords, POPULAR_PARTS, DEFAULT_TAX_RATE };
