// SEO generator for auto-parts listings.
const PART_PATTERNS = {
  BOS: { brand: 'Bosch', category: 'Brakes', type: 'Brake Pad Set' },
  NGK: { brand: 'NGK', category: 'Ignition', type: 'Spark Plug' },
  DENSO: { brand: 'Denso', category: 'Ignition', type: 'Oxygen Sensor' },
  MOO: { brand: 'Moog', category: 'Suspension', type: 'Control Arm' },
  ACD: { brand: 'ACDelco', category: 'Ignition', type: 'Ignition Coil' },
  MOPAR: { brand: 'Mopar', category: 'OEM', type: 'Genuine Part' },
  MOTORCRAFT: { brand: 'Motorcraft', category: 'OEM', type: 'Genuine Part' },
};

const KNOWN_FITS = {
  'BOS-04495': '2015-2020 Ford F-150',
  'NGK-6994': 'Universal 14mm thread',
  'DENSO-234-4622': '2010 Toyota Camry 2.5L',
  'ACD-41-1033': '2007-2013 Chevy Silverado 5.3L',
  'MOO-RK620497': '2008-2012 Honda Accord',
};

function detectBrand(partNumber) {
  const upper = partNumber.toUpperCase();
  for (const prefix of Object.keys(PART_PATTERNS)) {
    if (upper.startsWith(prefix)) return PART_PATTERNS[prefix];
  }
  return { brand: 'OEM', category: 'Auto Parts', type: 'Replacement Part' };
}

function generateTitle({ partNumber, brand, type, fits }) {
  return `${brand} ${partNumber} ${type} for ${fits || 'select applications'}`;
}

function generateDescription({ brand, partNumber, type, fits, condition }) {
  return `Genuine ${brand} ${partNumber} ${type}. Fits ${fits || 'compatible vehicles'}. ${condition} replacement part with fast local availability.`;
}

function generateTags({ brand, partNumber, type, category, fits }) {
  const tags = new Set();
  tags.add(brand.toLowerCase());
  tags.add(partNumber.toLowerCase());
  tags.add(type.toLowerCase().replace(/ /g, '-'));
  tags.add(category.toLowerCase());
  if (fits) {
    fits.split(/[-\s]/).filter(Boolean).forEach(p => {
      if (p.length > 2 && !/^\d{4}$/.test(p)) tags.add(p.toLowerCase());
    });
    const years = fits.match(/\d{4}/g);
    if (years && years.length >= 2) tags.add(`${years[0]}-${years[1]}`);
  }
  return Array.from(tags);
}

function generateListing({ partNumber, costPrice, condition = 'New', inventory = 3, fits, image }) {
  const meta = detectBrand(partNumber);
  const knownFits = KNOWN_FITS[partNumber.toUpperCase()];
  const finalFits = fits || knownFits || 'various compatible models';
  return {
    partNumber: partNumber.toUpperCase(),
    title: generateTitle({ partNumber: partNumber.toUpperCase(), brand: meta.brand, type: meta.type, fits: finalFits }),
    brand: meta.brand,
    category: meta.category,
    condition,
    fits: finalFits,
    description: generateDescription({ brand: meta.brand, partNumber: partNumber.toUpperCase(), type: meta.type, fits: finalFits, condition }),
    tags: generateTags({ brand: meta.brand, partNumber: partNumber.toUpperCase(), type: meta.type, category: meta.category, fits: finalFits }),
    costPrice,
    inventory,
    image: image || `https://placehold.co/400x300/e2e8f0/1e293b?text=${encodeURIComponent(partNumber.toUpperCase())}`,
  };
}

module.exports = { generateListing, generateTitle, generateTags, generateDescription, detectBrand };
