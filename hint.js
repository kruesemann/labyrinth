import * as DIALOG from "./dialog.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";

let hints = [];

export function reset() {
    hints = [];
}

export function create(i, j, dialog) {
    const hint = {
        i,
        j,
        dialog,
        show: function() {
            DIALOG.show(dialog);
        }
    };

    hints.push(hint);

    return hint;
}

export function getNearestHint() {
    const playerPos = PLAYER.getCenter();
    let nearestHint = undefined;
    let minDist = Infinity;

    for (const hint of hints) {
        const position = MAPUTIL.tileToCoords(hint.i, hint.j);
        const dist = Math.hypot(position.x - playerPos.x, position.y - playerPos.y);
        if (dist < minDist) {
            nearestHint = hint;
            minDist = dist;
        }
    }

    if (nearestHint) {
        nearestHint.playerDist = minDist;
    }
    return nearestHint;
}

export function isPlayerNearHint() {
    const nearestHint = getNearestHint();
    return nearestHint && nearestHint.playerDist < 5;
}
