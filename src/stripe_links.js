const https = require('https');
const querystring = require('querystring');

const STRIPE_API_HOST = 'api.stripe.com';

function stripeRequest({ method, path, body }) {
  const apiKey = (process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY || '').toString().trim();
  if (!apiKey) {
    return Promise.reject(new Error('No Stripe API key set'));
  }

  const payload = body ? querystring.stringify(body) : '';
  const options = {
    hostname: STRIPE_API_HOST,
    port: 443,
    path,
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `Stripe HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Invalid Stripe response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function createPaymentLink({ title, amountCents, quantity = 1, metadata = {} }) {
  const baseReturn = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const body = {
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': amountCents,
    'line_items[0][price_data][product_data][name]': title,
    'line_items[0][quantity]': quantity,
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': `${baseReturn}/thanks.html?order_id=${metadata.order_id || ''}`,
  };

  Object.keys(metadata).forEach((key, idx) => {
    body[`metadata[${key}]`] = metadata[key];
  });

  return stripeRequest({ method: 'POST', path: '/v1/payment_links', body });
}

module.exports = { createPaymentLink, stripeRequest };
