import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as LIGHT from "./light.js";
import * as SOUND from "./sound.js";
import * as OVERLAY from "./overlay.js";
import * as SECRET from "./secret.js";
import { createPlayer } from "./object.js";

let player = undefined;

export function reset(i, j) {
    if (!player || player.health === 0) {
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, "dot");
        setHealth(100);
    } else {
        const health = player.health;
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, player.form.ID);
        setHealth(health);
    }
    OVERLAY.setForm(player.form.ID);
    const center = getCenter();
    player.light = LIGHT.create(center.x, center.y, [1, 1, 1, 1]);
}

export function center() {
    player.form.center();
}

export function transform(formID) {
    OVERLAY.setForm(formID);
    return player.transform(formID);
}

export function dropParticle() {
    if (player.light.color[3] >= CONSTANTS.LIGHTPARTICLE_BRIGHTNESS / 2) {
        const { x, y } = getLightPosition();
        
        if (MAP.isOnBeacon(player.form.nodes)
        && SECRET.lightBeacon(x, y)) {
            player.light.changeColor([1, 1, 1, 1]);
            SOUND.play("beacon");
            return;
        }
        if (LIGHT.createParticle(x, y, [1.0, 1.0, 0.8, CONSTANTS.LIGHTPARTICLE_BRIGHTNESS]) !== null) {
            player.light.changeColor([1, 1, 1, 1]);
            SOUND.play("particle");
        };
    }
}

export function move(counter) {
    if (counter % 10 === 0) {
        if (player.light.color[3] < CONSTANTS.LIGHTPARTICLE_BRIGHTNESS / 2) {
            player.light.changeColor([1, 1, 1, player.light.color[3] * CONSTANTS.LIGHT_PLAYER_GROWTH]);
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

export function getHealth() {
    return player.health;
}

function setHealth(health) {
    player.health = health;
    OVERLAY.setHealth(health);
}

export function hurt() {
    setHealth(Math.max(0, player.health - CONSTANTS.HEALTH_HURT));
    SOUND.play("hurt");
    return player.health === 0;
}

export function heal() {
    if (player.health === 100) return false;
    setHealth(Math.min(100, player.health + CONSTANTS.HEALTH_HEAL));
    return true;
}

export function getNearestShrine() {
    return MAP.getNearestShrine(getCenter());
}
