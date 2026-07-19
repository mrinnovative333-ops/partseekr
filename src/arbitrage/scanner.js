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
  { partNumber: 'BOS-AD1117', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2012-2018 Chevy Sonic', monthlySearches: 3200, avgRetail: 44.99, avgCost: 28, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-3951', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2002-2011 Toyota Camry', monthlySearches: 7500, avgRetail: 9.99, avgCost: 4.75, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4162', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2002-2006 Honda CR-V', monthlySearches: 4500, avgRetail: 59.99, avgCost: 34, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-19300921', brand: 'ACDelco', category: 'Ignition', type: 'Ignition Coil', fits: '2015-2020 Chevy Colorado', monthlySearches: 4100, avgRetail: 35.99, avgCost: 19, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620460', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2004-2008 Acura TL', monthlySearches: 3900, avgRetail: 92, avgCost: 51, shipping: 8.99, days: 4 },
  { partNumber: 'MOTORCRAFT-FL2016', brand: 'Motorcraft', category: 'OEM', type: 'Oil Filter', fits: '2011-2021 Ford F-150 3.5L', monthlySearches: 6800, avgRetail: 14.99, avgCost: 7.5, shipping: 4.99, days: 3 },
  { partNumber: 'BOS-AD1345', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2011-2017 Honda Odyssey', monthlySearches: 3500, avgRetail: 49.99, avgCost: 31, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-5464', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2008-2014 Ford F-150', monthlySearches: 7000, avgRetail: 10.99, avgCost: 5, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4209', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2003-2007 Honda Accord', monthlySearches: 4300, avgRetail: 64.99, avgCost: 36, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-12580681', brand: 'ACDelco', category: 'Engine', type: 'Ignition Coil', fits: '2007-2014 Cadillac Escalade', monthlySearches: 3800, avgRetail: 29.99, avgCost: 16, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK640365', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2006-2011 Honda Civic', monthlySearches: 3700, avgRetail: 87, avgCost: 48, shipping: 8.99, days: 4 },
  { partNumber: 'BOS-AD1378', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2013-2019 Nissan Altima', monthlySearches: 4600, avgRetail: 46.99, avgCost: 29, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-7781', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2010-2015 Chevrolet Camaro', monthlySearches: 5900, avgRetail: 12.99, avgCost: 6.25, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-9066', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2012-2017 Toyota Corolla', monthlySearches: 4800, avgRetail: 69.99, avgCost: 39, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-12643207', brand: 'ACDelco', category: 'Ignition', type: 'Ignition Coil', fits: '2014-2020 Chevy Silverado 5.3L', monthlySearches: 5200, avgRetail: 27.99, avgCost: 15.25, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620485', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2003-2007 Nissan Murano', monthlySearches: 3400, avgRetail: 95, avgCost: 53, shipping: 8.99, days: 4 },
  { partNumber: 'MOTORCRAFT-FL2051', brand: 'Motorcraft', category: 'OEM', type: 'Oil Filter', fits: '2015-2022 Ford Mustang', monthlySearches: 5600, avgRetail: 13.99, avgCost: 7, shipping: 4.99, days: 3 },
  { partNumber: 'BOS-AD1092', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2009-2014 Nissan Maxima', monthlySearches: 3300, avgRetail: 47.99, avgCost: 29.5, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-93815', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2013-2018 Mazda 3', monthlySearches: 6400, avgRetail: 11.49, avgCost: 5.25, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4445', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2004-2008 Toyota Solara', monthlySearches: 4000, avgRetail: 62.99, avgCost: 35, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-25198623', brand: 'ACDelco', category: 'Engine', type: 'Throttle Position Sensor', fits: '2002-2006 Chevy Avalanche', monthlySearches: 3100, avgRetail: 39.99, avgCost: 21, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620333', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2002-2006 Honda CR-V', monthlySearches: 3600, avgRetail: 88, avgCost: 49, shipping: 8.99, days: 4 },
  { partNumber: 'MOTORCRAFT-DG546', brand: 'Motorcraft', category: 'Ignition', type: 'Ignition Coil', fits: '2011-2016 Ford Explorer 3.5L', monthlySearches: 4700, avgRetail: 33.99, avgCost: 18.5, shipping: 5.99, days: 3 },
  { partNumber: 'BOS-AD1479', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2014-2020 Toyota Corolla', monthlySearches: 4200, avgRetail: 43.99, avgCost: 27, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-3657', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2006-2011 Honda Civic', monthlySearches: 7300, avgRetail: 9.49, avgCost: 4.5, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-9051', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2002-2004 Toyota Camry', monthlySearches: 4100, avgRetail: 58.99, avgCost: 33, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-213-3636', brand: 'ACDelco', category: 'Engine', type: 'Engine Coolant Thermostat', fits: '2009-2015 Chevy Traverse', monthlySearches: 2900, avgRetail: 24.99, avgCost: 12.5, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-ES800223', brand: 'Moog', category: 'Steering', type: 'Tie Rod End', fits: '2005-2015 Toyota Tacoma', monthlySearches: 3800, avgRetail: 28.99, avgCost: 14.75, shipping: 4.99, days: 3 },
  { partNumber: 'MOTORCRAFT-FL2062', brand: 'Motorcraft', category: 'OEM', type: 'Oil Filter', fits: '2020-2023 Ford F-150 5.0L', monthlySearches: 5400, avgRetail: 15.99, avgCost: 8, shipping: 4.99, days: 3 },
  { partNumber: 'BOS-AD1644', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2016-2022 Honda Civic', monthlySearches: 4400, avgRetail: 51.99, avgCost: 32, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-4589', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2004-2009 Toyota Prius', monthlySearches: 6100, avgRetail: 11.99, avgCost: 5.5, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4368', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2007-2011 Toyota Camry', monthlySearches: 4700, avgRetail: 66.99, avgCost: 37, shipping: 5.99, days: 3 },
  { partNumber: 'ACD-12622629', brand: 'ACDelco', category: 'Engine', type: 'Crankshaft Position Sensor', fits: '2007-2014 Chevy Tahoe', monthlySearches: 3500, avgRetail: 32.99, avgCost: 17.5, shipping: 5.99, days: 3 },
  { partNumber: 'MOO-RK620553', brand: 'Moog', category: 'Suspension', type: 'Control Arm', fits: '2008-2012 Honda Accord', monthlySearches: 3900, avgRetail: 91, avgCost: 50, shipping: 8.99, days: 4 },
  { partNumber: 'MOTORCRAFT-DG511X', brand: 'Motorcraft', category: 'Ignition', type: 'Ignition Coil', fits: '2004-2008 Ford F-150 5.4L', monthlySearches: 4300, avgRetail: 34.99, avgCost: 19, shipping: 5.99, days: 3 },
  { partNumber: 'BOS-AD1533', brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set', fits: '2010-2015 Chevrolet Equinox', monthlySearches: 3700, avgRetail: 45.99, avgCost: 28.5, shipping: 5.99, days: 3 },
  { partNumber: 'NGK-97279', brand: 'NGK', category: 'Ignition', type: 'Spark Plug', fits: '2018-2023 Toyota Camry', monthlySearches: 5500, avgRetail: 13.99, avgCost: 6.75, shipping: 4.99, days: 3 },
  { partNumber: 'DENSO-234-4353', brand: 'Denso', category: 'Exhaust', type: 'Oxygen Sensor', fits: '2005-2010 Honda Odyssey', monthlySearches: 4200, avgRetail: 61.99, avgCost: 34.5, shipping: 5.99, days: 3 },
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
