import createHotp from './hotp';

(async function main() {
    const { hotp, remainingSec } = await createHotp({
        secret: 'verySecret',
        timeWindowSec: 30,
        tokenSize: 5,
        digestName: 'SHA-256',
    });

    console.info(hotp, remainingSec);
}());
