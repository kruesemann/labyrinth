import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";
import * as CONSTANTS from "./constants.js";
import * as NOISE from "./noise.js";
import * as SOUND from "./sound.js";
import * as ITEM from "./item.js";
import * as HINT from "./hint.js";
import * as ANIMATION from "./animation.js";

let secrets = {
    shrines: [],
    wisps: [],
    beacons: []
};

export function reset() {
    secrets = {
        shrines: [],
        wisps: [],
        beacons: []
    };
}

function createShrine(i, j, formIDs) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);
    const shrine = {
        index: secrets.shrines.length,
        x,
        y,
        formIDs,
        item: ITEM.createShrine(i, j, secrets.shrines.length),
        hint: HINT.create(i, j, [
            { text: "This is a shrine. You can change form here." },
            { text: "Hold down <b>SPACE</b> and do a little dance." },
            { text: "The snake form requires this dance: <b>DOWN RIGHT UP LEFT</b>", trigger: function() { ANIMATION.playSnakeDance(x, y); } }
        ])
    };

    secrets.shrines.push(shrine);
}

function createWisp(i, j, color, change) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);

    const wisp = {
        index: secrets.wisps.length,
        x,
        y,
        light: LIGHT.create(x, y, color),
        item: ITEM.createWisp(i, j, secrets.wisps.length),
        color,
        interval: Math.floor(NOISE.random() * 800) + 200,
        change,
        gleaming: false,
        set: function(x, y) {
            this.light.set(x, y);
            this.item.set(x, y);
        },
        gleam: function() {
            if (!this.gleaming) return;

            let newBrightness = 0;

            if (this.light.color[3] + this.change <= this.color[3]
            && this.light.color[3] + this.change > 0) {
                newBrightness = this.light.color[3] + this.change;
            } else if (this.light.color[3] + this.change <= 0) {
                newBrightness = 0;
                this.change = - this.change;
                this.gleaming = false;
            } else {
                newBrightness = this.color[3];
                this.change = - this.change;
            }
            if (newBrightness > 1) {
                newBrightness += CONSTANTS.LIGHT_WISP_FLICKER * (Math.random() - 0.5);
            }

            this.light.setBrightness(newBrightness);

            if (!this.gleaming) {
                this.set(0, 0);
                this.color[3] = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_BRIGHTNESS_MAX - CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN)) + CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN;
                this.interval = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN;
                SOUND.forceFadeOut("wisp1", 100);
            }
        },
        remove: function() {
            LIGHT.removeLight(this.light.index);
            for (let wisp of secrets.wisps) {
                if (wisp.index > this.index) {
                    wisp.index--;
                }
            }
            secrets.wisps.splice(this.index, 1);
        }
    };

    if (wisp.light === null) return;
    
    wisp.light.flickering = false;

    secrets.wisps.push(wisp);
}

function createBeacon(i, j) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);

    const beacon = {
        index: secrets.beacons.length,
        x,
        y,
        light: null,
        lightUp: function(baseColor) {
            if (this.light !== null) return false;
            this.light = LIGHT.create(x, y, baseColor);
            if (this.light === null) return false;
            this.light.flare(CONSTANTS.LIGHT_BEACON_BRIGHTNESS, CONSTANTS.LIGHT_BEACON_FLARE);
            return true;
        }
    };

    secrets.beacons.push(beacon);
    return beacon;
}

export function createSecrets(secretList) {
    for (let secret of secretList) {
        switch(secret.type) {
            case "shrine": createShrine(secret.i, secret.j, secret.formIDs); break;
            case "wisp": createWisp(secret.i, secret.j, secret.color, secret.change); break;
            case "beacon": createBeacon(secret.i, secret.j); break;
            default: console.log("Unknown secret"); break;
        }
    }
}

export function removeWisp(index) {
    secrets.wisps[index].remove();
}

export function lightUpBeacon(x, y, baseColor) {
    let nearestBeacon = undefined;
    let minDist = Infinity;

    for (let beacon of secrets.beacons) {
        const dist = Math.hypot(beacon.x - x, beacon.y - y);
        if (dist < minDist) {
            nearestBeacon = beacon;
            minDist = dist;
        }
    }

    return nearestBeacon.lightUp(baseColor);
}

export function gleamAllWisps(counter) {
    for (let wisp of secrets.wisps) {
        if (counter % wisp.interval === 0) {
            wisp.set(wisp.x + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5), wisp.y + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5));
            wisp.gleaming = true;
            SOUND.loop("wisp1", 10, { x: wisp.x, y: wisp.y }, 40);
        }
        if (counter % 4 === 0) {
            wisp.gleam();
        }
    }
}

export function getNearestSecret(position, secretID, pred) {
    let nearestSecret = undefined;
    let minDist = Infinity;

    let list = undefined;
    switch (secretID) {
        case "shrine": list = secrets.shrines; break;
        case "wisp": list = secrets.wisps; break;
        case "beacon": list = secrets.beacons; break;
        default: console.log("Unknown secret."); return;
    }

    for (let secret of list) {
        if (pred) {
            if (!pred(secret)) {
                continue;
            }
        }

        const dist = Math.hypot(position.x - secret.x, position.y - secret.y);
        if (dist < minDist) {
            nearestSecret = secret;
            minDist = dist;
        }
    }

    if (nearestSecret) {
        nearestSecret.positionDist = minDist;
    }
    return nearestSecret;
}
