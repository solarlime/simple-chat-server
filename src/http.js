const fs = require('fs');
const path = require('path');

function readingProcess(readable, data) {
  return new Promise((resolve, reject) => {
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
    const readable = fs.createReadStream(path.resolve('db.json'));
    const data = [];
    try {
      const result = await readingProcess(readable, data);
      return { status: 'Read', data: JSON.parse(result) };
    } catch (e) {
      return { status: 'Not read', data: e.message };
    }
  },

  add() {
    return 'added';
  },

  delete() {
    return 'deleted';
  },
};
