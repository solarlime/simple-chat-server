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
    connect: '/connect',
  };
  return {
    fetch: basis.fetch,
    connect: basis.connect,
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
  console.log(`HTTP request detected: ${ctx.request.path}`);
  const res = await next();
  ctx.response.body = res;
});

app.ws.use(async (ctx, next) => {
  console.log(`WS request detected: ${ctx.request.path}`);
  const res = await next();
  ctx.response.body = res;
});

restRouter.get(routes.fetch, (ctx) => rest.fetch(ctx, app));
wsRouter.get(routes.connect, (ctx) => ws.connect(ctx, app));

app.use(restRouter.routes()).use(restRouter.allowedMethods());
app.ws.use(wsRouter.routes()).use(wsRouter.allowedMethods());

app.listen(PORT, () => { console.log(`Server is working on ${PORT}`); });
