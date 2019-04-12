const rollup = require('rollup');
const { join } = require('path');


module.exports = function pugRendered() {
    return async (ctx, next) => {
        await next();

        if (typeof ctx.state.$rollup !== 'string') {
            return;
        }

        console.log('rollup', join(__dirname, '..', 'scripts', ctx.state.$rollup));
        const bundle = await rollup.rollup({
            input: join(__dirname, '..', 'scripts', ctx.state.$rollup),
        });
        const { output } = await bundle.generate({
            format: 'iife',
        });

        if (output.length !== 1) {
            throw new Error(`Wrong rollup bundles length: ${output.length}`);
        }

        ctx.type = 'application/javascript';
        ctx.body = output[0].code;
    };
};
