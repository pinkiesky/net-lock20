const Koa = require('koa');
const pug = require('pug');

const app = new Koa();

app.use(async (ctx) => {
    ctx.body = pug.renderFile('./views/index.pug');
});

app.listen(3000);
