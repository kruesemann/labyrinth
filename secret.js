import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as HINT from "./hint.js";
import * as ITEM from "./item.js";
import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";
import * as NOISE from "./noise.js";
import * as OPTIONS from "./options.js";
import * as PLAYER from "./player.js";
import * as SOUND from "./sound.js";

let secrets = {
    shrines: {},
    wisps: {},
    beacons: {},
    invisibles: {},
    particlePuzzles: {},
};

export function reset() {
    secrets = {
        shrines: {},
        wisps: {},
        beacons: {},
        invisibles: {},
        particlePuzzles: {},
    };
}

function createShrine(i, j, formIDs) {
    const position = MAPUTIL.tileToCenter(i, j);
    const uuid = NOISE.createUuid();

    const hintDialog = [
        {
            text: `This is a shrine. You can change form here.`
        },
        {
            text: `Hold down <b>${OPTIONS.keyCodes[OPTIONS.gameControls.transform]}</b> and do a little dance.`
        }
    ];

    let dot = false;
    let box = false;
    let snake = false;
    for (const formID of formIDs) {
        switch (formID) {
            case "dot": dot = true; break;
            case "box": box = true; break;
            case "snake": snake = true; break;
            default: console.log("Unknown form"); break;
        }
    }
    if (dot) {
        hintDialog.push({
            text: `The dot form requires this dance: <b>RIGHT LEFT DOWN UP</b>`,
            trigger: function() {
                ANIMATION.playDotDance(position);
            }
        });
    }
    if (box) {
        hintDialog.push({
            text: `The box form requires this dance: <b>RIGHT LEFT RIGHT LEFT</b>`,
            trigger: function() {
                ANIMATION.playBoxDance(position);
            }
        });
    }
    if (snake) {
        hintDialog.push({
            text: `The snake form requires this dance: <b>DOWN RIGHT UP LEFT</b>`,
            trigger: function() {
                ANIMATION.playSnakeDance(position);
            }
        });
    }

    const shrine = {
        uuid,
        position,
        formIDs,
        item: ITEM.createShrine(i, j, uuid),
        hint: HINT.create(i, j, hintDialog)
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
        const x = this.position.x + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5);
        const y = this.position.y + CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5);
        this.set(x, y);
        this.color[3] = Math.floor(Math.random() * (CONSTANTS.LIGHT_WISP_BRIGHTNESS_MAX - CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN)) + CONSTANTS.LIGHT_WISP_BRIGHTNESS_MIN;
        this.interval = Math.floor(Math.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN;
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
    const position = MAPUTIL.tileToCenter(i, j);
    const uuid = NOISE.createUuid();

    const wisp = {
        uuid,
        position,
        light: LIGHT.create(position.x, position.y, [color[0], color[1], color[2], 0]),
        item: ITEM.createWisp(i, j, uuid),
        color,
        interval: Math.floor(Math.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN,
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

function addBeaconMemberFunctions(beacon, position) {
    beacon.lightUp = function(baseColor) {
        if (this.light !== null) return false;
        this.light = LIGHT.create(position.x, position.y, baseColor);
        if (this.light === null) return false;
        this.light.flare(CONSTANTS.LIGHT_BEACON_BRIGHTNESS, CONSTANTS.LIGHT_BEACON_FLARE);
        return true;
    };
}

function createBeacon(i, j) {
    const position = MAPUTIL.tileToCenter(i, j);
    const uuid = NOISE.createUuid();

    const beacon = {
        uuid,
        position,
        light: null
    };

    addBeaconMemberFunctions(beacon, position);

    secrets.beacons[uuid] = beacon;
}

function createInvisible(i, j, color, item) {
    const position = MAPUTIL.tileToCenter(i, j);
    const uuid = NOISE.createUuid();

    item.i = 0;
    item.j = 0;
    delete item.color;

    const invisible = {
        uuid,
        position,
        color,
        item: ITEM.createItem(item),
        interval: Math.floor(Math.random() * (CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MAX - CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MIN)) + CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MIN
    };
    
    secrets.invisibles[uuid] = invisible;
}

function addParticlePuzzleSolveFunction(particlePuzzle) {
    particlePuzzle.solve = function() {
        ITEM.createItem(this.item);
        delete secrets.particlePuzzles[this.uuid];
    };
}

function createParticlePuzzle(i, j, points, item) {
    const position = MAPUTIL.tileToCenter(i, j);
    const uuid = NOISE.createUuid();

    item.i = i;
    item.j = j;

    const particlePuzzle = {
        uuid,
        position,
        points,
        item,
    };

    addParticlePuzzleSolveFunction(particlePuzzle);

    secrets.particlePuzzles[uuid] = particlePuzzle;
}

export function createSecrets(secretList) {
    for (const secret of secretList) {
        switch(secret.type) {
            case "shrine": createShrine(secret.i, secret.j, secret.formIDs); break;
            case "wisp": createWisp(secret.i, secret.j, secret.color, secret.change); break;
            case "beacon": createBeacon(secret.i, secret.j); break;
            case "invisible": createInvisible(secret.i, secret.j, secret.item.color, secret.item); break;
            case "particlePuzzle": createParticlePuzzle(secret.i, secret.j, secret.points, secret.item); break;
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

        const dist = Math.hypot(beacon.position.x - x, beacon.position.y - y);
        if (dist < minDist) {
            nearestBeacon = beacon;
            minDist = dist;
        }
    }

    return nearestBeacon.lightUp(baseColor);
}

export function gleamAllWisps(counter) {
    for (const uuid in secrets.wisps) {
        if (!secrets.wisps.hasOwnProperty(uuid)) continue;
        const wisp = secrets.wisps[uuid];
        if (counter % wisp.interval === 0) {
            wisp.startGleam();
        }
        if (counter % CONSTANTS.LIGHT_WISP_INTERVAL === 0) {
            wisp.gleam();
        }
    }
}

export function showInvisibles(position, radius) {
    for (const uuid in secrets.invisibles) {
        if (!secrets.invisibles.hasOwnProperty(uuid)) continue;
        const invisible = secrets.invisibles[uuid];

        const dist = Math.hypot(invisible.position.x - position.x, invisible.position.y - position.y);
        if (dist <= radius) {
            invisible.item.color = invisible.color;
            invisible.item.position = invisible.position;
            delete secrets.invisibles[uuid];
        }
    }
}

function gleamAllInvisibles(counter) {
    for (const uuid in secrets.invisibles) {
        if (!secrets.invisibles.hasOwnProperty(uuid)) continue;
        const invisible = secrets.invisibles[uuid];
        const playerPos = PLAYER.getHead();

        if (counter % invisible.interval !== 0) continue;
        invisible.interval = Math.floor(Math.random() * (CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MAX - CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MIN)) + CONSTANTS.INVISIBLE_GLEAM_INTERVAL_MIN;
        
        const dist = Math.hypot(invisible.position.x - playerPos.x, invisible.position.y - playerPos.y);
        if (dist <= 25) {
            ANIMATION.playGleam(invisible.position, [1, 1, 1, 10]);
        }
    }
}

function isParticle(light) {
    return light.fading && light.flickering;
}

function isParticlePuzzleSolved(points) {
    for (const point of points) {
        if (!LIGHT.getLightsInRadius(MAPUTIL.tileToCenter(point.i, point.j), 1, isParticle).length) {
            return false;
        }
    }
    return true;
}

function solveParticlePuzzles(counter) {
    if (counter % 50 !== 0) return;

    for (const uuid in secrets.particlePuzzles) {
        if (!secrets.particlePuzzles.hasOwnProperty(uuid)) continue;
        const particlePuzzle = secrets.particlePuzzles[uuid];

        if (isParticlePuzzleSolved(particlePuzzle.points))
            particlePuzzle.solve();
    }
}

export function processSecrets(counter) {
    gleamAllInvisibles(counter);
    solveParticlePuzzles(counter);
}

export function getNearestSecret(position, secretID, pred) {
    let nearestSecret = undefined;
    let minDist = Infinity;

    let list = undefined;
    switch (secretID) {
        case "shrine": list = secrets.shrines; break;
        case "wisp": list = secrets.wisps; break;
        case "beacon": list = secrets.beacons; break;
        case "invisible": list = secrets.invisibles; break;
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

        const dist = Math.hypot(position.x - secret.position.x, position.y - secret.position.y);
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
