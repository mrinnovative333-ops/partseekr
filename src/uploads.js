// Zero-dependency multipart/form-data parser for image uploads
const fs = require('fs');
const path = require('path');

function parseMultipart(req, uploadDir) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error('Not multipart'));
    }
    const boundaryMatch = contentType.match(/boundary=([^;\s]+)/);
    if (!boundaryMatch) return reject(new Error('No boundary'));
    const boundary = boundaryMatch[1];

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > 20 * 1024 * 1024) {
        reject(new Error('Upload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const delimiter = Buffer.from(`\r\n--${boundary}`);
        const parts = [];
        let start = buffer.indexOf(delimiter);
        while (start !== -1) {
          let end = buffer.indexOf(delimiter, start + delimiter.length);
          if (end === -1) end = buffer.length;
          const part = buffer.slice(start + delimiter.length, end);
          if (part.length > 0) parts.push(part);
          start = end;
        }

        const fields = {};
        const files = {};

        for (const part of parts) {
          // Remove leading CRLF
          let bodyStart = part.indexOf('\r\n\r\n');
          if (bodyStart === -1) continue;
          const header = part.slice(0, bodyStart).toString();
          let content = part.slice(bodyStart + 4);
          // Strip trailing CRLF and final --
          if (content.length >= 2 && content.slice(content.length - 2).toString() === '\r\n') {
            content = content.slice(0, content.length - 2);
          }
          if (content.length >= 2 && content.slice(content.length - 2).toString() === '--') {
            content = content.slice(0, content.length - 2);
          }

          const nameMatch = header.match(/name="([^"]+)"/);
          const filenameMatch = header.match(/filename="([^"]+)"/);
          const fieldName = nameMatch ? nameMatch[1] : null;
          if (!fieldName) continue;

          if (filenameMatch) {
            const filename = filenameMatch[1];
            if (!filename || content.length === 0) continue;
            const ext = path.extname(filename).toLowerCase() || '.jpg';
            const safeName = Date.now() + '_' + Math.random().toString(36).slice(2) + ext;
            const filePath = path.join(uploadDir, safeName);
            fs.writeFileSync(filePath, content);
            files[fieldName] = { originalName: filename, savedName: safeName, path: filePath, size: content.length };
          } else {
            fields[fieldName] = content.toString().trim();
          }
        }
        resolve({ fields, files });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { parseMultipart };
