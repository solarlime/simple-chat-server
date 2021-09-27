const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const rest = require('./http');
const ws = require('./ws');

dotenv.config();
const app = new Koa();
const prefix = '/simple-chat';
const router = new Router({ prefix });
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
  console.log('main');
  const res = await next();
  ctx.response.body = res;
});

router.get(routes.fetch, rest.fetch);
router.get(routes.add, rest.add);
router.get(routes.delete, rest.delete);
router.get(routes.connect, ws.connect);
router.get(routes.disconnect, ws.disconnect);

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => { console.log(`Server is working on ${PORT}`); });
