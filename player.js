import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as LIGHT from "./light.js";
import * as SOUND from "./sound.js";
import { createPlayer } from "./object.js";

let player = undefined;
let light = undefined;

export function reset(i, j) {
    if (player) {
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, player.form.ID);
    } else {
        player = createPlayer(i, j, [0.1, 0.1, 0], 2, "dot");
    }
    const center = getCenter();
    light = LIGHT.create(center.x, center.y, [1, 1, 1, 1]);
}

export function center() {
    player.form.center();
}

export function transform(form) {
    player.transform(form);
}

export function dropParticle() {
    if (light.color[3] >= CONSTANTS.LIGHTPARTICLE_BRIGHTNESS / 2) {
        const { x, y } = getLightPosition();
        if (LIGHT.createParticle(x, y, [1.0, 1.0, 0.8, CONSTANTS.LIGHTPARTICLE_BRIGHTNESS]) !== null) {
            light.changeColor([1, 1, 1, 1]);
            SOUND.play("particle");
        };
    }
}

export function move(counter) {
    if (counter % 10 === 0) {
        if (light.color[3] < CONSTANTS.LIGHTPARTICLE_BRIGHTNESS / 2) {
            light.changeColor([1, 1, 1, light.color[3] * CONSTANTS.LIGHT_PLAYER_GROWTH]);
        }
    }
    if (player.move(counter)) {
        const center = getCenter();
        light.set(center.x, center.y);
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
    return light.pos;
}
