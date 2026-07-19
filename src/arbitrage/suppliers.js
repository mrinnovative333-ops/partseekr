// Supplier link builders and landed-cost calculator

function rockAutoSearchUrl(partNumber) {
  return `https://www.rockauto.com/en/catalog/search?partnumber=${encodeURIComponent(partNumber)}`;
}

function ebaySearchUrl(partNumber) {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(partNumber)}`;
}

function amazonSearchUrl(partNumber) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(partNumber)}`;
}

function advanceAutoSearchUrl(partNumber) {
  return `https://shop.advanceautoparts.com/web/SearchResults?searchTerm=${encodeURIComponent(partNumber)}`;
}

function autozoneSearchUrl(partNumber) {
  return `https://www.autozone.com/search?searchText=${encodeURIComponent(partNumber)}`;
}

function oreillySearchUrl(partNumber) {
  return `https://www.oreillyauto.com/search?q=${encodeURIComponent(partNumber)}`;
}

function detectSupplierUrl({ partNumber, preferred = 'rockauto' }) {
  const strategies = {
    rockauto: rockAutoSearchUrl,
    ebay: ebaySearchUrl,
    amazon: amazonSearchUrl,
    advance: advanceAutoSearchUrl,
    autozone: autozoneSearchUrl,
    oreilly: oreillySearchUrl,
  };
  const fn = strategies[preferred] || strategies.rockauto;
  return fn(partNumber);
}

function estimateLandedCost({ costPrice, shippingCost = 0, taxRate = 0 }) {
  const tax = costPrice * taxRate;
  return {
    costPrice,
    shippingCost,
    taxRate,
    tax,
    landedCost: costPrice + shippingCost + tax,
  };
}

function formatSupplierOptions(partNumber) {
  return {
    rockauto: rockAutoSearchUrl(partNumber),
    ebay: ebaySearchUrl(partNumber),
    amazon: amazonSearchUrl(partNumber),
    advance: advanceAutoSearchUrl(partNumber),
    autozone: autozoneSearchUrl(partNumber),
    oreilly: oreillySearchUrl(partNumber),
  };
}

module.exports = {
  rockAutoSearchUrl,
  ebaySearchUrl,
  amazonSearchUrl,
  advanceAutoSearchUrl,
  autozoneSearchUrl,
  oreillySearchUrl,
  detectSupplierUrl,
  estimateLandedCost,
  formatSupplierOptions,
};
