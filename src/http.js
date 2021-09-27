const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('db.json');

function readingProcess(readable) {
  return new Promise((resolve, reject) => {
    const data = [];
    readable.on('data', (chunk) => {
      data.push(chunk);
    });
    readable.on('end', () => {
      const buffer = Buffer.concat(data);
      resolve(buffer);
    });
    readable.on('error', (e) => reject(e));
  });
}

module.exports = {
  async fetch() {
    const readable = fs.createReadStream(dbPath);
    try {
      const result = await readingProcess(readable);
      return { status: 'Read', data: JSON.parse(result) };
    } catch (e) {
      return { status: 'Not read', data: e.message };
    }
  },

  async add(ctx) {
    const readable = fs.createReadStream(dbPath);
    try {
      const buffer = await readingProcess(readable);
      const json = JSON.parse(buffer);
      json.data.push(ctx.request.body);
      console.log(json.data);
      const writable = fs.createWriteStream(dbPath);
      writable.write(Buffer.from(JSON.stringify(json)), () => console.log('Writing ended!'));
      return { status: 'Added', data: ctx.request.body };
    } catch (e) {
      return { status: 'Not added', data: e.message };
    }
  },

  delete() {
    return 'deleted';
  },
};
