const util = require('util');
const execFile = util.promisify(require('child_process').execFile);


async function xautolock(...args) {
    return execFile('xautolock', args);
}

async function locknow() {
    return xautolock('-locknow');
}

async function unlocknow() {
    return xautolock('-unlocknow');
}

module.exports = {
    exec: xautolock, locknow, unlocknow,
};
