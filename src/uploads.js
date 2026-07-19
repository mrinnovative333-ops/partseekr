// Zero-dependency multipart/form-data parser for image uploads
const fs = require('fs');
const path = require('path');

function parseMultipart(req, uploadDir) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Not multipart'));
    }
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return reject(new Error('No boundary'));

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from('--' + boundary);
      const parts = [];
      let start = buffer.indexOf(boundaryBuffer);
      while (start !== -1) {
        let end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
        if (end === -1) end = buffer.length;
        const part = buffer.slice(start + boundaryBuffer.length, end);
        if (part.length > 2) parts.push(part);
        start = end;
      }

      const fields = {};
      const files = {};
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const header = part.slice(0, headerEnd).toString();
        const body = part.slice(headerEnd + 4);
        const trailing = body.indexOf('\r\n--');
        const content = trailing !== -1 ? body.slice(0, trailing) : body;

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
    });
  });
}

module.exports = { parseMultipart };
