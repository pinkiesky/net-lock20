const util = require('util');
const execFile = util.promisify(require('child_process').execFile);


class Locker {
    constructor(lockerName) {
        this.lockerName = lockerName;
    }

    async isLocked() {
        const {
            stdout,
        } = await execFile('ps', ['hax', '--format', '%c']);

        return stdout.includes(this.lockerName);
    }
}

module.exports = Locker;
