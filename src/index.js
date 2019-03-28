const debug = require('debug')('nl20');

const Koa = require('koa');
const koaBody = require('koa-body');
const pugRendered = require('./middleware/pug');

const xautolock = require('./xautolock');
const Locker = require('./lock');


const locker = new Locker('zenity');
const app = new Koa();

const safeActions = {
    locknow: xautolock.locknow,
    unlocknow: xautolock.unlocknow,
};

app.use(async (ctx, next) => {
    ctx.set('Cache-Control', 'no-store');

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

app.use(pugRendered());

app.use(async (ctx, next) => {
    const { method, url } = ctx;
    if (method !== 'GET') {
        return next();
    }

    if (['/', '/index'].includes(url)) {
        ctx.render = {
            name: 'index.pug',
            options: {
                locked: await locker.isLocked(),
            },
        };
    } else if (['/error'].includes(url)) {
        ctx.render = {
            name: 'error.pug',
            options: {
                error: 'unknown error',
            },
        };
    }

    return null;
});

app.use(koaBody());

app.use(async (ctx) => {
    if (!ctx.request.body || !ctx.request.body.action) {
        ctx.throw(400, 'wrong body');
    }

    const action = safeActions[ctx.request.body.action];
    if (!action) {
        ctx.throw(400, 'wrong action');
    }
    try {
        await action();
        ctx.render = 'action.pug';
    } catch (error) {
        console.error(error);

        ctx.status = 500;
        ctx.render = {
            name: 'error.pug',
            options: { error },
        };
    }
});

app.listen(3000);
