import * as STAGE from "./stage.js";
import * as SOUND from "./sound.js";
import * as PLAYER from "./player.js";
import * as HINT from "./hint.js";
import * as DIALOG from "./dialog.js";
import * as INVENTORY from "./inventory.js";
import * as GAME from "./game.js";
import * as OVERLAY from "./overlay.js";
import * as CONSTANTS from "./constants.js";

const KEY_TAB   = 9;
const KEY_ESC   = 27;
const KEY_SPACE = 32;
const KEY_LEFT  = 37;
const KEY_UP    = 38;
const KEY_RIGHT = 39;
const KEY_DOWN  = 40;
const KEY_F11   = 122;
const KEY_DOT   = 190;

let transformBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined };
let state = CONSTANTS.STATE_MENU;

export function menuControls() {
    state = CONSTANTS.STATE_MENU;
}

export function gameControls() {
    state = CONSTANTS.STATE_GAME;
}

export function dialogControls() {
    state = CONSTANTS.STATE_DIALOG;
}

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

export function toggleFullscreen(event) {
    event.preventDefault();
    if (isFullscreenOn()) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

export function isFullscreenOn() {
    return (document.fullScreenElement && document.fullScreenElement !== null) || (document.mozFullScreen || document.webkitIsFullScreen);
}

export function setFullscreen(on) {
    if (isFullscreenOn()) {
        if (!on) exitFullscreen();
    } else if (on) enterFullscreen();
}

function wheelHandler(event) {
    if (state !== CONSTANTS.STATE_GAME) return;

    STAGE.zoom(event.wheelDelta || -event.detail);
}

function keyDownGame(event) {
    function checkTransformationSequence() {
        let transformationCode = 0;
        for (let i = 0; i < 4; i++) {
            transformationCode *= 10;
            transformationCode += transformBuffer.sequence[(transformBuffer.startIndex + i) % 4];
        }

        switch (transformationCode) {
            case 4321:
                for (let formID of transformBuffer.shrine.formIDs) {
                    if (formID === "snake" && PLAYER.transform("snake")) {
                        transformBuffer.sequence = [ -1, -1, -1, -1 ];
                        SOUND.play("transform");
                        break;
                    }
                }
                break;
            case 3131:
            for (let formID of transformBuffer.shrine.formIDs) {
                if (formID === "box" && PLAYER.transform("box")) {
                    transformBuffer.sequence = [ -1, -1, -1, -1 ];
                    SOUND.play("transform");
                    break;
                }
            }
            break;
            case 3142:
            for (let formID of transformBuffer.shrine.formIDs) {
                if (formID === "dot" && PLAYER.transform("dot")) {
                    transformBuffer.sequence = [ -1, -1, -1, -1 ];
                    SOUND.play("transform");
                    break;
                }
            }
            break;
            default:
                break;
        }
    }

    switch (event.keyCode) {
        case KEY_TAB:
            event.preventDefault();
            INVENTORY.browseRight();
            break;
        case KEY_ESC:
            OVERLAY.ingameMenu();
            break;
        case KEY_SPACE:
            if (!transformBuffer.ongoing) {
                transformBuffer.shrine = PLAYER.getNearestSecret("shrine");
                if (transformBuffer.shrine
                && transformBuffer.shrine.positionDist < 5) {
                    transformBuffer.ongoing = true;
                    SOUND.loop("transforming", 100);
                }
            }
            break;
        case KEY_LEFT:
            PLAYER.moveLeft();
            if (transformBuffer.ongoing) {
                transformBuffer.sequence[transformBuffer.startIndex] = KEY_LEFT - 36;
                transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
                checkTransformationSequence();
            }
            break;
        case KEY_UP:
            PLAYER.moveUp();
            if (transformBuffer.ongoing) {
                transformBuffer.sequence[transformBuffer.startIndex] = KEY_UP - 36;
                transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
                checkTransformationSequence();
            }
            break;
        case KEY_RIGHT:
            PLAYER.moveRight();
            if (transformBuffer.ongoing) {
                transformBuffer.sequence[transformBuffer.startIndex] = KEY_RIGHT - 36;
                transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
                checkTransformationSequence();
            }
            break;
        case KEY_DOWN:
            PLAYER.moveDown();
            if (transformBuffer.ongoing) {
                transformBuffer.sequence[transformBuffer.startIndex] = KEY_DOWN - 36;
                transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
                checkTransformationSequence();
            }
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
        case 67://c
            GAME.nextLevel();
            break;
        case 68://d
            PLAYER.moveRight();
            break;
        case 69://e
            PLAYER.dropParticle();
            break;
        case 70://f
            PLAYER.flare();
            break;
        case 81://q
            const nearestHint = HINT.getNearestHint();
            if (nearestHint.playerDist < 5) {
                nearestHint.show();
            }
            break;
        case 83://s
            PLAYER.moveDown();
            break;
        case 87://w
            PLAYER.moveUp();
            break;
        case 86://v
            INVENTORY.useItem();
            break;
        case 66://b
            INVENTORY.addHintlight(5);
            INVENTORY.addSendlight(5);
            break;
        case 80://p
            GAME.togglePause();
            break;
    }
}

function keyUpGame(event) {
    switch (event.keyCode) {
        case KEY_SPACE:
            transformBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined };
            SOUND.forceFadeOut("transforming", 50);
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

function keyDownMenu(event) {
    if (document.getElementById("menu-ingame").style.display === "block"
    && event.keyCode === KEY_ESC) {
        document.getElementById("menu-ingame-back").dispatchEvent(new MouseEvent("click"));
        return;
    }
    if (document.getElementById("menu-options").style.display === "block"
    && event.keyCode === KEY_ESC) {
        document.getElementById("menu-options-back").dispatchEvent(new MouseEvent("click"));
        return;
    }
}

function keyUpMenu(event) {}

function keyDownDialog(event) {
    switch (event.keyCode) {
        case KEY_DOT:
            DIALOG.skipCurrent();
            break;
        case 88://x
            DIALOG.reset();
            break;
    }
}

function keyUpDialog(event) {}

function keyDownHandler(event) {
    if (event.keyCode === KEY_F11) {
        toggleFullscreen(event);
        return;
    }

    switch (state) {
        case CONSTANTS.STATE_GAME: keyDownGame(event); break;
        case CONSTANTS.STATE_MENU: keyDownMenu(event); break;
        case CONSTANTS.STATE_DIALOG: keyDownDialog(event); break;
    }
}

function keyUpHandler(event) {
    switch (state) {
        case CONSTANTS.STATE_GAME: keyUpGame(event); break;
        case CONSTANTS.STATE_MENU: keyUpMenu(event); break;
        case CONSTANTS.STATE_DIALOG: keyUpDialog(event); break;
    }
}

export function reset() {
    transformBuffer = { sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined };

    document.removeEventListener("mousewheel", wheelHandler);
    document.removeEventListener("DOMMouseScroll", wheelHandler);
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);

    document.addEventListener("mousewheel", wheelHandler);
    document.addEventListener("DOMMouseScroll", wheelHandler);
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
}
