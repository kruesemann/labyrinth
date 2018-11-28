import { createObject } from "./object.js";

let player = undefined;

export function initialize() {
    player = createObject(2, 2, [1, 1, 0], 0.5, "box");
}

export function center() {
    player.form.center();
}

export function transform(form) {
    player.transform(form);
}

export function move() {
    player.move();
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

export function getPosition() {
    return player.form.nodes[0];
}
