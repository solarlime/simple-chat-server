module.exports = {
  /**
   * A reading function. Gets info from the websocket server
   * @param ctx
   * @param app
   * @returns {Promise<{data, status: string}|{data: any[], status: string}>}
   */
  async fetch(ctx, app) {
    try {
      const wss = app.ws.server;
      const symbol = (ws) => Object.getOwnPropertySymbols(ws).find((sym) => sym.description === 'user');
      const clients = new Set();
      wss.clients.forEach((ws) => {
        const sym = symbol(ws);
        if (sym) clients.add({ name: ws[sym] });
      });
      return { status: 'Read', data: Array.from(clients) };
    } catch (e) {
      return { status: 'Not read', data: e.message };
    }
  },
};
