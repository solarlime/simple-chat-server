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
  /**
   * A wrapper for dealing with websockets
   * @param ctx
   * @param app
   * @returns {Promise<void>}
   */
  async connect(ctx, app) {
    const wss = app.ws.server;

    // Server disconnects after a minute of doing nothing. Prevent from it with PING messages
    const pingInterval = setInterval(() => {
      ctx.websocket.ping();
    }, 30000);

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
      clearInterval(pingInterval);
    });
  },
};
