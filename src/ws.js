const https = require('http');

/**
 * A wrapper for a deleting request
 * @param usersArray
 * @returns {Promise<unknown>}
 */
function deleteFromDB(usersArray) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(usersArray);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT,
      path: '/simple-chat/delete/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const request = https.request(options, (response) => {
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
      try {
        const rest = await deleteFromDB([{ name: user }]);
        const usersArray = [];
        // There may be incorrect disconnections. Fix them!
        for (const item of rest.data) {
          if (!clients.has(item.name)) {
            console.log(`An obsolete user was found: ${item.name}`);
            usersArray.push({ name: item.name });
            sendMessageAboutDisconnection(wss, item.name);
          }
        }
        await deleteFromDB(usersArray);
      } catch (e) {
        console.log('Something happened during a deleting process');
      }
    });
  },
};
