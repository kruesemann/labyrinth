import * as OVERLAY from "./overlay.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";

let help = [];

export function reset() {
    help = [];
}

export function create(i, j, dialog) {
    const hint = {
        i,
        j,
        dialog,
        show: function() {
            OVERLAY.showDialog(dialog);
        }
    };

    help.push(hint);
}

export function getNearestHint() {
    const { x, y } = PLAYER.getCenter();
    let nearestHint = undefined;
    let minDist = Infinity;

    for (let hint of help) {
        const position = MAPUTIL.tileToCoords(hint.i, hint.j);
        const dist = Math.hypot(position.x - x, position.y - y);
        if (dist < minDist) {
            nearestHint = hint;
            minDist = dist;
        }
    }

    nearestHint.playerDist = minDist;
    return nearestHint;
}

export function isPlayerNearHint() {
    const nearestHint = getNearestHint();
    return nearestHint.playerDist < 5;
}
