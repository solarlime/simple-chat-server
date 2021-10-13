const https = require('http');

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
    ctx.websocket.on('close', () => {
      const user = ctx.websocket[Object.getOwnPropertySymbols(ctx.websocket).find((sym) => sym.description === 'user')];
      // Tell everybody that user disconnected
      wss.clients.forEach((ws) => ws.send(JSON.stringify({
        isMessage: false,
        data: {
          connect: false,
          name: user,
        },
      })));

      // Then make a request to delete user from a db
      const data = JSON.stringify({ name: user });
      const options = {
        hostname: 'localhost',
        port: 3001,
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
            console.log(JSON.parse(d));
          } catch (e) {
            console.log('Did not receive a response properly');
          }
        });
      });

      request.on('error', (error) => console.log(error));
      request.write(data);
      request.end();
    });
  },
};
