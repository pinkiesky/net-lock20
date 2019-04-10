import { createHotp, getHotpTimeInfo } from './hotp';


function updateUI(hotpData = null, timeInfo = null, hotp = null) {
    const progress = document.getElementById('timeRemaining');
    const hotpInfo = document.getElementById('hotp');

    if (hotpData) {
        progress.max = hotpData.timeWindowSec;
    }

    if (timeInfo) {
        progress.value = timeInfo.remainingSec;
    }

    if (hotp) {
        hotpInfo.textContent = hotp;
    }
}

function scheduleHotpUpdate(hotpData, timeInfo) {
    const delay = Math.min(1000, timeInfo.remainingSec * 1000);
    console.debug(`schedule hotp update with delay ${delay}ms`);

    setTimeout(() => updateHotp(hotpData, timeInfo.currentWindow), delay);
}

async function updateHotp(hotpData, prevHotpWindow = -1) {
    const timeInfo = getHotpTimeInfo(hotpData);
    if (timeInfo.currentWindow === prevHotpWindow) {
        updateUI(hotpData, timeInfo);
        scheduleHotpUpdate(hotpData, timeInfo);
        return;
    }

    const { hotp } = await createHotp(hotpData);

    console.info(`new hotp: ${hotp}`, timeInfo);

    updateUI(hotpData, timeInfo, hotp);
    scheduleHotpUpdate(hotpData, timeInfo);
}

(async function main() {
    const hotpData = {
        secret: 'verySecret',
        timeWindowSec: 30,
        tokenSize: 5,
        digestName: 'SHA-256',
    };

    updateHotp(hotpData);
}());
