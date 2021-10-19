const https = require('http');

/**
 * A wrapper for a deleting request
 * @param user
 * @returns {Promise<unknown>}
 */
function deleteFromDB(user) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name: user });
    const options = {
      hostname: 'localhost',
      port: process.env.PORT,
      path: '/simple-chat/delete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const request = https.request(options, (response) => {
      console.log('statusCode: ', response.statusCode);

      response.on('data', (d) => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on('error', (error) => reject(error));
    request.write(data);
    request.end();
  });
}

function sendMessageAboutDisconnection(wss, user) {
  wss.clients.forEach((ws) => ws.send(JSON.stringify({
    isMessage: false,
    data: {
      connect: false,
      name: user,
    },
  })));
}

module.exports = {
  async connect(ctx, app) {
    const wss = app.ws.server;

    /**
     * A listener for messages: ordinary & service
     */
    ctx.websocket.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (!parsed.isMessage) {
          // If the connection is new, add a symbol to WS - an id for finding user when disconnects
          if (parsed.data.connect) {
            const user = Symbol.for('user');
            ctx.websocket[user] = parsed.data.name;
          }
        }
        wss.clients.forEach((ws) => ws.send(message));
      } catch (e) {
        ctx.websocket.send(e.message);
      }
    });

    /**
     * A listener for closing event
     */
    ctx.websocket.on('close', async () => {
      const symbol = (ws) => Object.getOwnPropertySymbols(ws).find((sym) => sym.description === 'user');
      const clients = new Set();
      wss.clients.forEach((ws) => clients.add(ws[symbol(ws)]));
      const user = ctx.websocket[symbol(ctx.websocket)];
      // Tell everybody that user disconnected
      sendMessageAboutDisconnection(wss, user);

      // Then make a request to delete user from a db
      const rest = await deleteFromDB(user);
      rest.data.forEach(async (item) => {
        // There may be incorrect disconnections. Fix them!
        if (!clients.has(item.name)) {
          console.log(`An obsolete user was found: ${item.name}`);
          const newRest = await deleteFromDB(item.name);
          console.log(newRest);
          sendMessageAboutDisconnection(wss, item.name);
        }
      });
    });
  },
};
