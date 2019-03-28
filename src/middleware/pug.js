const pug = require('pug');
const path = require('path');
const csso = require('csso');
const util = require('util');
const readFile = util.promisify(require('fs').readFile);


const filters = {
    cssmin(text, options) {
        const minifiedCss = csso.minify(text, options).css;
        return `<style>${minifiedCss}</style>`;
    },
};

module.exports = function pugRendered(options) {
    const opts = Object.assign({
        workDir: '../views',
        cache: true,
    }, options);

    const cache = {};

    return async (ctx, next) => {
        await next();

        if (!ctx.render) {
            return;
        }

        const renderData = await (typeof ctx.render === 'string' ? { name: ctx.render } : ctx.render);

        let pugFn = null;
        if (!pugFn && opts.cache && renderData.name in cache) {
            pugFn = cache[renderData.name];
        }

        if (!pugFn) {
            const filename = path.join(__dirname, opts.workDir, renderData.name);
            const source = await readFile(filename);

            cache[renderData.name] = pug.compile(source, { filename, filters });
            pugFn = cache[renderData.name];
        }

        ctx.body = pugFn(renderData.options);
    };
};
