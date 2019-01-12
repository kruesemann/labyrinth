import * as SCENE from "./scene.js";
import * as MAP from "./map.js";
import * as LIGHT from "./light.js";
import { createObject } from "./object.js";

let player = undefined;
let light = undefined;

export function initialize(i, j) {
    if (player) {
        SCENE.removeMesh(player.form.mesh);
        player = createObject(i, j, [0.1, 0.1, 0], 2, player.form.id);
    } else {
        player = createObject(i, j, [0.1, 0.1, 0], 2, "dot");
    }
    const { x, y } = MAP.tileToCenter(i, j);
    light = LIGHT.createLight(x, y, [1, 1, 1, 5]);
}

export function center() {
    player.form.center();
}

export function transform(form) {
    player.transform(form);
}

export function move(counter) {
    if (player.move(counter)) {
        const { x, y } = getHead();
        light.set(x, y);
        return MAP.isOnExit(player.form.nodes[0]);
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
    return player.form.id;
}

export function getHead() {
    return player.getHead();
}

export function getTail() {
    return player.getTail();
}
