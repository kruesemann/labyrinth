import * as CONSTANTS from "./constants.js";
import * as DIALOG from "./dialog.js";
import * as GAME from "./game.js";
import * as HINT from "./hint.js";
import * as INVENTORY from "./inventory.js";
import * as OPTIONS from "./options.js";
import * as OVERLAY from "./overlay.js";
import * as PLAYER from "./player.js";
import * as SOUND from "./sound.js";
import * as STAGE from "./stage.js";

const KEY_TAB   = 9;
const KEY_F11   = 122;

let transformBuffer = {sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined};
let state = CONSTANTS.STATE_MENU;
let mouse = {x: 0, y: 0};

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

function mouseHandler(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
}

function downGame(bindingValue) {
    function checkTransformationSequence() {
        let transformationCode = 0;
        for (let i = 0; i < 4; ++i) {
            transformationCode *= 10;
            transformationCode += transformBuffer.sequence[(transformBuffer.startIndex + i) % 4];
        }

        switch (transformationCode) {
            case 4321:
                for (const formID of transformBuffer.shrine.formIDs) {
                    if (formID === "snake" && PLAYER.transform("snake")) {
                        transformBuffer.sequence = [-1, -1, -1, -1];
                        SOUND.play("transform");
                        break;
                    }
                }
                break;
            case 3131:
            for (const formID of transformBuffer.shrine.formIDs) {
                if (formID === "box" && PLAYER.transform("box")) {
                    transformBuffer.sequence = [-1, -1, -1, -1];
                    SOUND.play("transform");
                    break;
                }
            }
            break;
            case 3142:
            for (const formID of transformBuffer.shrine.formIDs) {
                if (formID === "dot" && PLAYER.transform("dot")) {
                    transformBuffer.sequence = [-1, -1, -1, -1];
                    SOUND.play("transform");
                    break;
                }
            }
            break;
            default:
                break;
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.browse.code
    && bindingValue.key === OPTIONS.gameControls.browse.key) {
        INVENTORY.browseRight();
    }

    if (bindingValue.code === OPTIONS.gameControls.menu.code
    && bindingValue.key === OPTIONS.gameControls.menu.key) {
        OVERLAY.ingameMenu();
    }

    if (bindingValue.code === OPTIONS.gameControls.transform.code
    && bindingValue.key === OPTIONS.gameControls.transform.key) {
        if (!transformBuffer.ongoing) {
            transformBuffer.shrine = PLAYER.getNearestSecret("shrine");
            if (transformBuffer.shrine
            && transformBuffer.shrine.positionDist < 5) {
                transformBuffer.ongoing = true;
                SOUND.loop("transforming", 100);
            }
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.gLeft.code
    && bindingValue.key === OPTIONS.gameControls.gLeft.key) {
        PLAYER.moveLeft();
        if (transformBuffer.ongoing) {
            transformBuffer.sequence[transformBuffer.startIndex] = 1;
            transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
            checkTransformationSequence();
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.gUp.code
    && bindingValue.key === OPTIONS.gameControls.gUp.key) {
        PLAYER.moveUp();
        if (transformBuffer.ongoing) {
            transformBuffer.sequence[transformBuffer.startIndex] = 2;
            transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
            checkTransformationSequence();
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.gRight.code
    && bindingValue.key === OPTIONS.gameControls.gRight.key) {
        PLAYER.moveRight();
        if (transformBuffer.ongoing) {
            transformBuffer.sequence[transformBuffer.startIndex] = 3;
            transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
            checkTransformationSequence();
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.gDown.code
    && bindingValue.key === OPTIONS.gameControls.gDown.key) {
        PLAYER.moveDown();
        if (transformBuffer.ongoing) {
            transformBuffer.sequence[transformBuffer.startIndex] = 4;
            transformBuffer.startIndex = (transformBuffer.startIndex + 1) % 4;
            checkTransformationSequence();
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.gSkip.code
    && bindingValue.key === OPTIONS.gameControls.gSkip.key) {
        DIALOG.skipCurrent();
    }

    if (bindingValue.code === OPTIONS.gameControls.particle.code
    && bindingValue.key === OPTIONS.gameControls.particle.key) {
        PLAYER.dropParticle();
    }

    if (bindingValue.code === OPTIONS.gameControls.flare.code
    && bindingValue.key === OPTIONS.gameControls.flare.key) {
        PLAYER.flare();
    }

    if (bindingValue.code === OPTIONS.gameControls.flare.code
    && bindingValue.key === OPTIONS.gameControls.flare.key) {
        PLAYER.flare();
    }

    if (bindingValue.code === OPTIONS.gameControls.hint.code
    && bindingValue.key === OPTIONS.gameControls.hint.key) {
        const nearestHint = HINT.getNearestHint();
        if (nearestHint.playerDist < 5) {
            nearestHint.show();
        }
    }

    if (bindingValue.code === OPTIONS.gameControls.useItem.code
    && bindingValue.key === OPTIONS.gameControls.useItem.key) {
        INVENTORY.useItem(mouse);
    }

    if (bindingValue.code === OPTIONS.gameControls.pause.code
    && bindingValue.key === OPTIONS.gameControls.pause.key) {
        GAME.togglePause();
    }

    if (bindingValue.code === OPTIONS.gameControls.gStop.code
    && bindingValue.key === OPTIONS.gameControls.gStop.key) {
        DIALOG.stop();
    }
}

function buttonDownGame(event) {
    downGame({code: event.button, key: false});
}

function keyDownGame(event) {
    downGame({code: event.keyCode, key: true});

    // DEBUG
    switch (event.keyCode) {
        case 49://1
            PLAYER.transform("dot");
            break;
        case 50://2
            PLAYER.transform("box");
            break;
        case 51://3
            PLAYER.transform("snake");
            break;
        case 67://c
            GAME.nextLevel();
            break;
        case 66://b
            INVENTORY.addHintlight(5);
            INVENTORY.addSendlight(20, 5);
            break;
        case 78://n
            PLAYER.increaseLuminosityMax();
            break;
    }
}

function upGame(bindingValue) {
    if (bindingValue.code === OPTIONS.gameControls.transform.code
    && bindingValue.key === OPTIONS.gameControls.transform.key) {
        transformBuffer = {sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined};
        SOUND.forceFadeOut("transforming", 50);
    }
    
    if (bindingValue.code === OPTIONS.gameControls.gLeft.code
    && bindingValue.key === OPTIONS.gameControls.gLeft.key) {
        PLAYER.stopLeft();
    }
    
    if (bindingValue.code === OPTIONS.gameControls.gUp.code
    && bindingValue.key === OPTIONS.gameControls.gUp.key) {
        PLAYER.stopUp();
    }
    
    if (bindingValue.code === OPTIONS.gameControls.gRight.code
    && bindingValue.key === OPTIONS.gameControls.gRight.key) {
        PLAYER.stopRight();
    }
    
    if (bindingValue.code === OPTIONS.gameControls.gDown.code
    && bindingValue.key === OPTIONS.gameControls.gDown.key) {
        PLAYER.stopDown();
    }
}

function buttonUpGame(event) {
    upGame({code: event.button, key: false});
}

function keyUpGame(event) {
    upGame({code: event.keyCode, key: true});
}

function downMenu(bindingValue) {
    if (bindingValue.code !== OPTIONS.menuControls.mBack.code
    || bindingValue.key !== OPTIONS.menuControls.mBack.key) return;

    if (document.getElementById("menu-ingame").style.display === "block") {
        document.getElementById("menu-ingame-back").dispatchEvent(new MouseEvent("click"));
    } else if (document.getElementById("menu-options").style.display === "block") {
        document.getElementById("menu-options-back").dispatchEvent(new MouseEvent("click"));
    }
}

function buttonDownMenu(event) {
    downMenu(event.button);
}

function keyDownMenu(event) {
    downMenu(event.keyCode);
}

function buttonUpMenu() {}
function keyUpMenu() {}

function downDialog(bindingValue) {
    if (bindingValue.code === OPTIONS.dialogControls.dSkip.code
    && bindingValue.key === OPTIONS.dialogControls.dSkip.key) {
        DIALOG.skipCurrent();
    }
    
    if (bindingValue.code === OPTIONS.dialogControls.dStop.code
    && bindingValue.key === OPTIONS.dialogControls.dStop.key) {
        DIALOG.stop();
    }
}

function buttonDownDialog(event) {
    downDialog({code: event.button, key: false});
}

function keyDownDialog(event) {
    downDialog({code: event.keyCode, key: true});
}

function buttonUpDialog() {}
function keyUpDialog() {}

function buttonDownHandler(event) {
    event.preventDefault();
    switch (state) {
        case CONSTANTS.STATE_GAME: buttonDownGame(event); break;
        case CONSTANTS.STATE_MENU: buttonDownMenu(event); break;
        case CONSTANTS.STATE_DIALOG: buttonDownDialog(event); break;
    }
}

function buttonUpHandler(event) {
    switch (state) {
        case CONSTANTS.STATE_GAME: buttonUpGame(event); break;
        case CONSTANTS.STATE_MENU: buttonUpMenu(event); break;
        case CONSTANTS.STATE_DIALOG: buttonUpDialog(event); break;
    }
}

function keyDownHandler(event) {
    if (event.keyCode === KEY_F11) {
        toggleFullscreen(event);
        return;
    }

    if (event.keyCode === KEY_TAB)
        event.preventDefault();

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

export function initialize() {
    transformBuffer = {sequence: [-1, -1, -1, -1], startIndex: 0, ongoing: false, shrine: undefined};
    mouse = {x: 0, y: 0};

    document.removeEventListener("mousewheel", wheelHandler);
    document.removeEventListener("DOMMouseScroll", wheelHandler);
    document.removeEventListener("mousemove", mouseHandler);
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
    document.removeEventListener("mousedown", buttonDownHandler);
    document.removeEventListener("mouseup", buttonUpHandler);

    document.addEventListener("mousewheel", wheelHandler);
    document.addEventListener("DOMMouseScroll", wheelHandler);
    document.addEventListener("mousemove", mouseHandler);
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    document.addEventListener("mousedown", buttonDownHandler);
    document.addEventListener("mouseup", buttonUpHandler);
}
