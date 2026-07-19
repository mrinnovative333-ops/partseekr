// Telegram order alert sender
const https = require('https');

function sendTelegram(message) {
  return new Promise((resolve, reject) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('[Telegram] No bot token or chat ID configured. Message not sent.');
      return resolve(false);
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) {
            console.log('[Telegram] Alert sent.');
            resolve(true);
          } else {
            console.error('[Telegram] API error:', parsed.description);
            resolve(false);
          }
        } catch (e) {
          reject(new Error(`Invalid Telegram response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function formatOrderAlert(order, listing) {
  const lines = [];
  lines.push(`🚨 *NEW PAID ORDER*`);
  lines.push('');
  lines.push(`*Order:* \`${order.id}\``);
  lines.push(`*Part:* ${listing.title}`);
  lines.push(`*Part Number:* \`${listing.partNumber}\``);
  lines.push(`*Quantity:* ${order.quantity}`);
  lines.push(`*Total Paid:* $${order.total.toFixed(2)}`);
  lines.push('');
  lines.push(`*Customer:* ${order.customer.name}`);
  lines.push(`*Phone:* ${order.customer.phone}`);
  lines.push(`*Email:* ${order.customer.email}`);
  lines.push(`*Address:*`);
  lines.push(`${order.customer.address}`);
  lines.push(`${order.customer.city}, ${order.customer.state} ${order.customer.zip}`);
  if (order.customer.notes) {
    lines.push('');
    lines.push(`*Notes:* ${order.customer.notes}`);
  }
  lines.push('');
  if (listing.supplierUrl) {
    lines.push(`*Supplier Link:* ${listing.supplierUrl}`);
  }
  lines.push(`*Landed Cost:* $${(listing.landedCost || listing.costPrice || 0).toFixed(2)}`);
  lines.push(`*Estimated Profit:* $${(order.total - (listing.landedCost || listing.costPrice || 0) * order.quantity).toFixed(2)}`);
  if (listing.shippingDays) {
    lines.push(`*Supplier Shipping:* ${listing.shippingDays} days`);
  }
  lines.push('');
  lines.push(`[View on Dashboard](${(process.env.SITE_URL || '').replace(/\/$/, '')}/api/orders)`);
  return lines.join('\n');
}

module.exports = { sendTelegram, formatOrderAlert };
