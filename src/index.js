const debug = require('debug')('nl20');

const Koa = require('koa');
const koaBody = require('koa-body');
const pugRendered = require('./middleware/pug');
const reqFilter = require('./middleware/reqFilter');
const rollup = require('./middleware/rollup');

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
app.use(rollup());

const jsFileRE = (/^\/(\w+\.js)$/i);
app.use(reqFilter(async (ctx) => {
    const { url } = ctx;

    const [, filename] = jsFileRE.exec(url);
    ctx.state.$rollup = filename;

    return null;
}, {
    availableMethods: ['GET'],
    pathCheck: jsFileRE,
    name: 'pageHandlerFilter',
}));

app.use(reqFilter(async (ctx) => {
    const { url } = ctx;
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
    } else if (['/hotp'].includes(url)) {
        ctx.render = 'hotp.pug';
    }

    return null;
}, {
    availableMethods: ['GET'],
    pathCheck: /^\/\w*$/i,
    name: 'pageHandlerFilter',
}));

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
