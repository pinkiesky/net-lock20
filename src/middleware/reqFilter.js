module.exports = function reqFilter(middleware, options) {
    const opts = Object.assign({
        name: `reqFilter:${parseInt(Math.random() * Number.MAX_SAFE_INTEGER, 10)}`,

        availableMethods: ['GET', 'POST'],
        requiredStateKeys: [],
        pathCheck: null,

        debug: false,
    }, options);

    const log = (...args) => console.log(`${opts.name}: ${args.join(', ')}`);

    return async (ctx, next) => {
        const { method, state, url } = ctx;

        if (opts.availableMethods && !opts.availableMethods.includes(method)) {
            log('drop by available methods', opts.availableMethods, method, url);
            return next();
        }

        if (opts.pathCheck instanceof RegExp && !opts.pathCheck.test(url)) {
            log('drop by path', opts.pathCheck, method, url);
            return next();
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const key of opts.requiredStateKeys || []) {
            if (!(key in state)) {
                log('drop by requiredStateKeys', key, method, url, state);
                return next();
            }
        }

        log('filter pass', method, url);
        return middleware(ctx, next);
    };
};
