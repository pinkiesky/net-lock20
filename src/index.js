const Koa = require('koa');
const pug = require('pug');

const app = new Koa();

app.use(async (ctx, next) => {
    const auth = ctx.get('Authorization');
    if (!auth || !auth.length) {
        ctx.set('WWW-Authenticate', 'Basic');

        // should not use `.throw` by design
        // https://github.com/koajs/koa/issues/1127
        ctx.status = 401;
    } else {
        await next();
    }
});

app.use(async (ctx) => {
    ctx.body = pug.renderFile('./views/index.pug');
});

app.listen(3000);
