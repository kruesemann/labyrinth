import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as LIGHT from "./light.js";
import * as SOUND from "./sound.js";
import * as OVERLAY from "./overlay.js";
import * as SECRET from "./secret.js";
import * as ANIMATION from "./animation.js";
import { createPlayer } from "./object.js";

let player = undefined;

export function reset(i, j) {
    if (!player || getBrightness() === 0) {
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, "dot");
    } else {
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, player.form.ID);
    }
    OVERLAY.setForm(player.form.ID);
    const center = getCenter();
    player.light = LIGHT.create(center.x, center.y, [1, 1, 1, getMaxBrightness() / 2]);
}

export function center() {
    player.form.center();
}

export function transform(formID) {
    OVERLAY.setForm(formID);
    return player.transform(formID);
}

export function dropParticle() {
    if (getBrightness() >= CONSTANTS.PLAYER_LIGHT_PARTICLE_COST * 2) {
        const { x, y } = getLightPosition();
        
        if (MAP.isOnBeacon(player.form.nodes)
        && SECRET.lightUpBeacon(x, y, [player.light.color[0], player.light.color[1], player.light.color[2], CONSTANTS.LIGHTPARTICLE_BRIGHTNESS])) {
            player.light.changeBrightness(getBrightness() - CONSTANTS.PLAYER_LIGHT_PARTICLE_COST);
            SOUND.play("beacon1");
            return;
        }
        if (LIGHT.createParticle(x, y, [1.0, 1.0, 0.8, CONSTANTS.LIGHTPARTICLE_BRIGHTNESS]) !== null) {
            player.light.changeBrightness(getBrightness() - CONSTANTS.PLAYER_LIGHT_PARTICLE_COST);
            SOUND.play("particle");
        };
    }
}

export function move(counter) {
    if (counter % 10 === 0) {
        const nearestBeacon = getNearestSecret("beacon", (beacon) => { return beacon.light !== null; } );
        if (nearestBeacon
        && nearestBeacon.positionDist < 5
        && getBrightness() < getMaxBrightness()) {
            player.light.changeBrightness(getBrightness() * CONSTANTS.PLAYER_LIGHT_BEACON_GROWTH);
        }
    }
    if (player.move(counter)) {
        const center = getCenter();
        player.light.set(center.x, center.y);
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
    return player.light.pos;
}

export function getMaxBrightness() {
    switch (player.form.ID) {
        case "dot": return CONSTANTS.PLAYER_LIGHT_MAX_BRIGHTNESS_DOT;
        case "box": return CONSTANTS.PLAYER_LIGHT_MAX_BRIGHTNESS_BOX;
        case "snake": return CONSTANTS.PLAYER_LIGHT_MAX_BRIGHTNESS_SNAKE;
        default: console.log("Unknown player form."); return;
    }
}

export function getBrightness() {
    return player.light.color[3];
}

export function increaseBrightness() {
    player.light.changeBrightness(getBrightness() + CONSTANTS.PLAYER_LIGHT_HEAL);
}

export function hurt() {
    const { x, y } = getCenter();
    const baseColor = player.light.color;
    ANIMATION.playSparks(x, y, baseColor);
    SOUND.play("hurt");

    player.light.changeBrightness(Math.max(0, getBrightness() - CONSTANTS.PLAYER_LIGHT_HURT));
    return getBrightness() === 0;
}

export function flare(brightness, maxBrightness) {
    player.light.flare(brightness, maxBrightness);
    SOUND.play("flare");
}

export function getNearestSecret(secretID, pred) {
    return SECRET.getNearestSecret(getCenter(), secretID, pred);
}
