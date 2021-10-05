const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('db.json');

/**
 * A promise which wraps the reading events
 * @returns {Promise<unknown>}
 */
function readingProcess() {
  return new Promise((resolve, reject) => {
    // At first, check if the file exists
    fs.stat(dbPath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Create a new one
          const emptyJson = '{"name":"simple-chat-db","data":[]}';
          fs.writeFileSync(dbPath, emptyJson);
          resolve(Buffer.from(emptyJson));
        } else {
          reject(err);
        }
      } else {
        const readable = fs.createReadStream(dbPath);
        const data = [];
        readable.on('data', (chunk) => {
          data.push(chunk);
        });
        readable.on('end', () => {
          const buffer = Buffer.concat(data);
          readable.destroy();
          resolve(buffer);
        });
        readable.on('error', (e) => {
          readable.destroy();
          reject(e);
        });
      }
    });
  });
}

/**
 * A wrapper for adding/deleting users
 * @param ctx
 * @param callback - a main function which adds/deletes a user
 * @returns {Promise<ReadableStream<Uint8Array>>}
 */
async function addOrDie(ctx, callback) {
  const buffer = await readingProcess();
  const json = JSON.parse(buffer);
  await callback(json, ctx.request.body);
  console.log(json.data);
  const writable = fs.createWriteStream(dbPath);
  writable.write(Buffer.from(JSON.stringify(json)), (err) => {
    if (!err) console.log('Writing ended!');
    writable.destroy();
  });
  return ctx.request.body;
}

module.exports = {
  /**
   * A wrapper for a reading function
   * @returns {Promise<{data, status: string}|{data: any, status: string}>}
   */
  async fetch() {
    try {
      const result = await readingProcess();
      return { status: 'Read', data: JSON.parse(result) };
    } catch (e) {
      return { status: 'Not read', data: e.message };
    }
  },

  /**
   * A wrapper for an adding function
   * @param ctx
   * @returns {Promise<{data, status: string}|{data: ReadableStream<Uint8Array>, status: string}>}
   */
  async add(ctx) {
    try {
      const result = await addOrDie(ctx, (json, body) => new Promise((resolve, reject) => {
        const isAlreadyAdded = json.data.find((item) => item.userName === body.userName);
        if (!isAlreadyAdded) {
          resolve(json.data.push(body));
        } else {
          reject(new Error(`User ${body.userName}'s already added`));
        }
      }));
      return { status: 'Added', data: result };
    } catch (e) {
      return { status: 'Not added', data: e.message };
    }
  },

  /**
   * A wrapper for a deleting function
   * @param ctx
   * @returns {Promise<{data, status: string}|{data: ReadableStream<Uint8Array>, status: string}>}
   */
  async delete(ctx) {
    try {
      const result = await addOrDie(ctx, (json, body) => new Promise((resolve, reject) => {
        const index = json.data.findIndex((item) => item.userName === body.userName);
        if (index !== -1) {
          resolve(json.data.splice(
            json.data.findIndex((item) => item.userName === body.userName), 1,
          ));
        } else {
          reject(new Error(`No user ${body.userName} found`));
        }
      }));
      return { status: 'Deleted', data: result };
    } catch (e) {
      return { status: 'Not deleted', data: e.message };
    }
  },
};
