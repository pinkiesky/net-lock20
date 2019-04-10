const C_LONG_SIZE = 8;
const TEXT_ENC = new TextEncoder();

/**
 * @param {Buffer} msgBuffer
 * @param {string} hashName
 */
export async function hash(msgBuffer, hashName = 'SHA-256') {
    // eslint-disable-next-line no-undef
    return window.crypto.subtle.digest(hashName, msgBuffer);
}

export function getHotpTimeInfo(hotpData) {
    const now = Date.now() / 1000;
    const currentWindow = parseInt(now / hotpData.timeWindowSec, 10);
    const remainingSec = hotpData.timeWindowSec - (now - currentWindow * hotpData.timeWindowSec);

    return {
        now, currentWindow, remainingSec,
    };
}

/**
 * @param {object} hotpData
 * @param {string} hotpData.secret
 * @param {number} hotpData.timeWindowSec
 * @param {number} hotpData.tokenSize
 * @param {string} hotpData.digestName
 * @returns {object}
 */
export async function createHotp(hotpData) {
    const timeInfo = getHotpTimeInfo(hotpData);
    const { currentWindow } = timeInfo;

    const str = TEXT_ENC.encode(hotpData.secret);
    const fullData = new Uint8Array(str.length + C_LONG_SIZE);
    fullData.set(str, C_LONG_SIZE);

    for (let i = 0; i < C_LONG_SIZE; i += 1) {
        // eslint-disable-next-line no-bitwise
        fullData[i] = (currentWindow / (2 ** (i * 8))) & 0xff;
    }

    const hashData = new Uint8Array(await hash(fullData, hotpData.hashName));

    const step = parseInt(hashData.length / hotpData.tokenSize, 10);
    const hotp = Array.from(
        { length: hotpData.tokenSize },
        (v, i) => hashData[i * step] % 10,
    ).join('');

    return {
        hotp, timeInfo,
    };
}
