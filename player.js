import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as OVERLAY from "./overlay.js";
import * as SECRET from "./secret.js";
import * as SOUND from "./sound.js";
import * as UTILITY from "./utility.js";
import { createPlayer } from "./object.js";

let player = undefined;

export function reset() {
    player = undefined;
}

export function initialize(i, j) {
    const parameters = player ? {
        brightness: getBrightness(),
        color: player.light.color,
        luminosity: getLuminosity(),
        luminosityMax: getLuminosityMax(),
        formID: player.form.ID
    } : {
        brightness: 1,
        color: CONSTANTS.DOT_LIGHT_COLOR,
        luminosity: CONSTANTS.PLAYER_LUMINOSITY_START,
        luminosityMax: CONSTANTS.PLAYER_LUMINOSITY_MAX_START,
        formID: "dot"
    };

    player = createPlayer(i, j, [0.2, 0.2, 0.2], 2, parameters.formID);
    OVERLAY.setForm(parameters.formID);
    player.luminosity = parameters.luminosity;
    player.luminosityMax = parameters.luminosityMax;
    const center = getCenter();
    player.light = LIGHT.create(center.x, center.y, [parameters.color[0], parameters.color[1], parameters.color[2], parameters.brightness]);
    player.light.playerLight = true;
    updateStatusLight();
}

export function center() {
    player.form.center();
}

export function transform(formID) {
    OVERLAY.setForm(formID);
    return player.transform(formID);
}

export function dropParticle() {
    if (getLuminosity() < CONSTANTS.PLAYER_LUMINOSITY_MIN
    || getBrightness() < getLuminosity()
    || player.light.isFlaring) return;
    const {x, y} = getLightPosition();
    
    if (MAP.isOnBeacon(player.form.nodes)
    && SECRET.lightUpBeacon(x, y, [player.light.color[0], player.light.color[1], player.light.color[2], getBrightness()])) {
        player.light.brightness = 1;
        SOUND.play("beacon1");
        SOUND.play("particle");
        return;
    }
    if (LIGHT.createParticle(x, y, [player.light.color[0], player.light.color[1], player.light.color[2], getBrightness()]) !== null) {
        player.light.brightness = 1;
        SOUND.play("particle");
    };
}

export function flare() {
    if (getLuminosity() < CONSTANTS.PLAYER_LUMINOSITY_MIN
    || player.light.isFlaring) return;
    player.light.flare(getBrightness() / 2, getBrightness() * 2);
    player.luminosity = UTILITY.add(player.luminosity, - CONSTANTS.PLAYER_LUMINOSITY_HURT_FLARE);
    updateStatusLight();
    SOUND.play("flare");

    SECRET.showInvisibles(getHead(), 25);
}

export function move(counter) {
    if (counter % 10 === 0) {
        if (getLuminosity() < getLuminosityMax()) {
            const nearestBeacon = getNearestSecret("beacon", beacon => {
                return beacon.light !== null;
            });

            if (nearestBeacon
            && nearestBeacon.positionDist < 5) {
                if (getLuminosity() + CONSTANTS.PLAYER_LUMINOSITY_GROWTH < getLuminosityMax()) {
                    player.luminosity = UTILITY.add(player.luminosity, CONSTANTS.PLAYER_LUMINOSITY_GROWTH);
                } else {
                    player.luminosity = getLuminosityMax();
                }

                updateStatusLight();
            }
        }

        if (getBrightness() < getLuminosity()) {
            const gain = getBrightness() * CONSTANTS.PLAYER_LIGHT_GROWTH_FACTOR;

            if (getBrightness() + gain < getLuminosity()) {
                player.light.changeBrightness(gain);
            } else {
                player.light.brightness = getLuminosity();
            }
        }
    }

    if (player.move(counter)) {
        const center = getCenter();
        player.light.position = {x: center.x, y: center.y};
        return MAP.isOnExit(player.form.nodes);
    }

    return false;
}

export function moveLeft() {
    player.moving.left = true;
}

export function moveUp() {
    player.moving.up = true;
}

export function moveRight() {
    player.moving.right = true;
}

export function moveDown() {
    player.moving.down = true;
}

export function stopLeft() {
    player.moving.left = false;
}

export function stopUp() {
    player.moving.up = false;
}

export function stopRight() {
    player.moving.right = false;
}

export function stopDown() {
    player.moving.down = false;
}

export function get() {
    return player;
}

export function getForm() {
    return player.form.ID;
}

export function getHead() {
    return player.getHead();
}

export function getTail() {
    return player.getTail();
}

export function getCenter() {
    return player.getCenter();
}

export function getLightPosition() {
    return player.light.position;
}

export function getLightColor() {
    return player.light.color;
}

export function setLightColor(color) {
    player.light.color = color;
    updateStatusLight();
}

function getLuminosity() {
    return player.luminosity;
}

function getLuminosityMax() {
    return player.luminosityMax;
}

export function getBrightness() {
    return player.light.brightness;
}

export function heal() {
    player.luminosity = UTILITY.add(player.luminosity, CONSTANTS.PLAYER_LUMINOSITY_HEAL);
    if (getLuminosity() > getLuminosityMax()) player.luminosity = getLuminosityMax();
    updateStatusLight();
}

function updateStatusLight() {
    OVERLAY.setLight([player.light.color[0], player.light.color[1], player.light.color[2], getLuminosity()]);
}

export function hurt() {
    SOUND.play("hurt", true);

    player.luminosity = UTILITY.add(player.luminosity, - CONSTANTS.PLAYER_LUMINOSITY_HURT_HIT);
    if (getBrightness() > getLuminosity()) {
        player.light.brightness = getLuminosity();
    }

    updateStatusLight();
    return getLuminosity() <= 0;
}

export function getNearestSecret(secretID, pred) {
    return SECRET.getNearestSecret(getCenter(), secretID, pred);
}
