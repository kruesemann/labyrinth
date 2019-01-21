import * as STAGE from "./stage.js";
import * as SOUND from "./sound.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import { nextLevel } from "./index.js";

const KEY_SPACE = 32;
const KEY_LEFT  = 37;
const KEY_UP    = 38;
const KEY_RIGHT = 39;
const KEY_DOWN  = 40;
const KEY_F11   = 122;

let keyBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false };

function enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

export function toggleFullscreen() {
    if ((document.fullScreenElement && document.fullScreenElement !== null)
    || (document.mozFullScreen || document.webkitIsFullScreen)) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

function wheelHandler(event) {
    STAGE.zoom(event.wheelDelta || -event.detail);
}

function keyDownHandler(event) {
    switch (event.keyCode) {
        case KEY_SPACE:
            if (!keyBuffer.ongoing) {
                keyBuffer.ongoing = true;
                SOUND.repeat("transforming");
            }
            break;
        case KEY_LEFT:
            PLAYER.moveLeft();
            if (keyBuffer.ongoing) {
                keyBuffer.sequence[keyBuffer.startIndex] = KEY_LEFT - 36;
                keyBuffer.startIndex = (keyBuffer.startIndex + 1) % 4;
            }
            break;
        case KEY_UP:
            PLAYER.moveUp();
            if (keyBuffer.ongoing) {
                keyBuffer.sequence[keyBuffer.startIndex] = KEY_UP - 36;
                keyBuffer.startIndex = (keyBuffer.startIndex + 1) % 4;
            }
            break;
        case KEY_RIGHT:
            PLAYER.moveRight();
            if (keyBuffer.ongoing) {
                keyBuffer.sequence[keyBuffer.startIndex] = KEY_RIGHT - 36;
                keyBuffer.startIndex = (keyBuffer.startIndex + 1) % 4;
            }
            break;
        case KEY_DOWN:
            PLAYER.moveDown();
            if (keyBuffer.ongoing) {
                keyBuffer.sequence[keyBuffer.startIndex] = KEY_DOWN - 36;
                keyBuffer.startIndex = (keyBuffer.startIndex + 1) % 4;
            }
            break;
        case KEY_F11:
            toggleFullscreen();
            event.preventDefault();
            break;
        case 49://1
            PLAYER.transform("dot");
            break;
        case 50://2
            PLAYER.transform("box");
            break;
        case 51://3
            PLAYER.transform("snake");
            break;
        case 65://a
            PLAYER.moveLeft();
            break;
        case 68://d
            PLAYER.moveRight();
            break;
        case 69://e
            PLAYER.dropParticle();
            break;
        case 81://q
            LIGHT.removeLight(1);
            break;
        case 83://s
            PLAYER.moveDown();
            break;
        case 87://w
            PLAYER.moveUp();
            break;
        case 88://x
            nextLevel();
            break;
    }
    
    if (keyBuffer.ongoing) {

        let transformationCode = 0;
        for (let i = 0; i < 4; i++) {
            transformationCode *= 10;
            transformationCode += keyBuffer.sequence[(keyBuffer.startIndex + i) % 4];
        }

        switch (transformationCode) {
            case 4321:
                if (PLAYER.transform("snake")) SOUND.play("transform");
                break;
            case 3131:
                if (PLAYER.transform("box")) SOUND.play("transform");
                break;
            case 3142:
                if (PLAYER.transform("dot")) SOUND.play("transform");
                break;
            default:
                break;
        }
    }
}

function keyUpHandler(event) {
    switch (event.keyCode) {
        case KEY_SPACE:
            keyBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false };
            SOUND.fadeOut("transforming", 100);
            break;
        case KEY_LEFT:
            PLAYER.stopLeft();
            break;
        case KEY_UP:
            PLAYER.stopUp();
            break;
        case KEY_RIGHT:
            PLAYER.stopRight();
            break;
        case KEY_DOWN:
            PLAYER.stopDown();
            break;
        case 65://a
            PLAYER.stopLeft();
            break;
        case 68://d
            PLAYER.stopRight();
            break;
        case 83://s
            PLAYER.stopDown();
            break;
        case 87://w
            PLAYER.stopUp();
            break;
    }
}

export function reset() {
    keyBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false };

    document.removeEventListener("mousewheel", wheelHandler);
    document.removeEventListener("DOMMouseScroll", wheelHandler);
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);

    document.addEventListener("mousewheel", wheelHandler);
    document.addEventListener("DOMMouseScroll", wheelHandler);
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
}
