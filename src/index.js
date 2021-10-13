const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const websockify = require('koa-websocket');
const rest = require('./http');
const ws = require('./ws');

dotenv.config();
const app = websockify(new Koa());
const prefix = '/simple-chat';
const restRouter = new Router({ prefix });
const wsRouter = new Router({ prefix });
const { PORT } = process.env;

function routesF() {
  const basis = {
    fetch: '/fetch',
    add: '/add',
    delete: '/delete',
    connect: '/connect',
    disconnect: '/disconnect',
  };
  return {
    fetch: basis.fetch,
    add: basis.add,
    delete: basis.delete,
    connect: basis.connect,
    disconnect: basis.disconnect,
  };
}
const routes = routesF();

app.use(koaCors({ allowMethods: 'GET,POST' }));
app.use(koaBody({
  urlencoded: true,
  parsedMethods: ['POST', 'GET'],
  json: true,
  jsonLimit: '50mb',
  textLimit: '50mb',
}));

app.use(async (ctx, next) => {
  console.log('http');
  const res = await next();
  ctx.response.body = res;
});

app.ws.use(async (ctx, next) => {
  console.log('ws');
  const res = await next();
  ctx.response.body = res;
});

restRouter.get(routes.fetch, rest.fetch);
restRouter.post(routes.add, rest.add);
restRouter.post(routes.delete, rest.delete);
wsRouter.get(routes.connect, (ctx) => ws.connect(ctx, app));

app.use(restRouter.routes()).use(restRouter.allowedMethods());
app.ws.use(wsRouter.routes()).use(wsRouter.allowedMethods());

app.listen(PORT, () => { console.log(`Server is working on ${PORT}`); });
