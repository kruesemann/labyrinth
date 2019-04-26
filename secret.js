import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as HINT from "./hint.js";
import * as ITEM from "./item.js";
import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";
import * as NOISE from "./noise.js";
import * as SOUND from "./sound.js";

let secrets = {
    shrines: {},
    wisps: {},
    beacons: {}
};

export function reset() {
    secrets = {
        shrines: {},
        wisps: {},
        beacons: {}
    };
}

function createShrine(i, j, formIDs) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);
    const uuid = `shrine${x}${y}${Date.now()}`;

    const shrine = {
        uuid,
        x,
        y,
        formIDs,
        item: ITEM.createShrine(i, j, uuid),
        hint: HINT.create(i, j, [
            { text: "This is a shrine. You can change form here." },
            { text: "Hold down <b>SPACE</b> and do a little dance." },
            { text: "The snake form requires this dance: <b>DOWN RIGHT UP LEFT</b>", trigger: function() { ANIMATION.playSnakeDance(x, y); } }
        ])
    };

    secrets.shrines[uuid] = shrine;
}

function addWispMemberFunctions(wisp) {
    wisp.set = function(x, y) {
        this.light.position = {x, y};
        this.item.position = {x, y};
    };

    wisp.startGleam = function() {
        if (this.gleaming) return;
        const x = this.x + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5);
        const y = this.y + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5);
        this.set(x, y);
        this.color[3] = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_BRIGHTNESS_MAX - CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN)) + CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN;
        this.interval = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN;
        this.gleaming = true;
        SOUND.loop("wisp1", 10, {x, y}, 40);
    };
    
    wisp.gleam = function() {
        if (!this.gleaming) return;

        let newBrightness = this.light.brightness + this.change;

        if (newBrightness <= 0) {
            newBrightness = 0;
            this.change = - this.change;
            this.gleaming = false;
        } else if (newBrightness > this.color[3]) {
            newBrightness = this.color[3];
            this.change = - this.change;
        }
        if (newBrightness > 1) {
            newBrightness += CONSTANTS.LIGHT_WISP_FLICKER * (Math.random() - 0.5);
        }

        this.light.brightness = newBrightness;

        if (!this.gleaming) {
            this.set(0, 0);
            SOUND.forceFadeOut("wisp1", 100);
        }
    };
    
    wisp.remove = function() {
        this.light.remove();
        delete secrets.wisps[this.uuid];
    };
}

function createWisp(i, j, color, change) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);
    const uuid = `wisp${x}${y}${Date.now()}`;

    const wisp = {
        uuid,
        x,
        y,
        light: LIGHT.create(x, y, [color[0], color[1], color[2], 0]),
        item: ITEM.createWisp(i, j, uuid),
        color,
        interval: Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN,
        change,
        gleaming: false
    };

    if (wisp.light === null) return;
    
    addWispMemberFunctions(wisp);

    wisp.set(0, 0);
    wisp.light.flickering = false;

    secrets.wisps[uuid] = wisp;
}

export function removeWisp(uuid) {
    secrets.wisps[uuid].remove();
}

function addBeaconMemberFunctions(beacon, x, y) {
    beacon.lightUp = function(baseColor) {
        if (this.light !== null) return false;
        this.light = LIGHT.create(x, y, baseColor);
        if (this.light === null) return false;
        this.light.flare(CONSTANTS.LIGHT_BEACON_BRIGHTNESS, CONSTANTS.LIGHT_BEACON_FLARE);
        return true;
    };
}

function createBeacon(i, j) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);
    const uuid = `beacon${x}${y}${Date.now()}`;

    const beacon = {
        uuid,
        x,
        y,
        light: null
    };

    addBeaconMemberFunctions(beacon, x, y);

    secrets.beacons[uuid] = beacon;
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

export function lightUpBeacon(x, y, baseColor) {
    let nearestBeacon = undefined;
    let minDist = Infinity;

    for (const uuid in secrets.beacons) {
        if (!secrets.beacons.hasOwnProperty(uuid)) continue;
        const beacon = secrets.beacons[uuid];

        const dist = Math.hypot(beacon.x - x, beacon.y - y);
        if (dist < minDist) {
            nearestBeacon = beacon;
            minDist = dist;
        }
    }

    return nearestBeacon.lightUp(baseColor);
}

export function gleamAllWisps(counter) {
    for (const uuid in secrets.wisps) {
        const wisp = secrets.wisps[uuid];
        if (counter % wisp.interval === 0) {
            wisp.startGleam();
        }
        if (counter % CONSTANTS.LIGHT_WISP_INTERVAL === 0) {
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

    for (const uuid in list) {
        if (!list.hasOwnProperty(uuid)) continue;
        const secret = list[uuid];

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
