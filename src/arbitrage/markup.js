const DEFAULT_MARKUP_PCT = 0.30;
const MIN_MARKUP_PCT = 0.15;
const COMPETITOR_BUFFER = 0.05;

function applyMarkup(costPrice, competitorPrice, customMarkup) {
  const markup = customMarkup || DEFAULT_MARKUP_PCT;
  let price = costPrice * (1 + Math.max(markup, MIN_MARKUP_PCT));
  if (competitorPrice && competitorPrice > 0) {
    const cap = competitorPrice * (1 - COMPETITOR_BUFFER);
    if (price > cap) price = cap;
  }
  return Math.round(price * 100) / 100;
}

function estimateProfit(costPrice, sellingPrice) {
  const gross = sellingPrice - costPrice;
  const margin = (gross / sellingPrice) * 100;
  return { gross, margin: Math.round(margin * 100) / 100 };
}

module.exports = { applyMarkup, estimateProfit, DEFAULT_MARKUP_PCT, MIN_MARKUP_PCT };
