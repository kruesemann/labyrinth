import * as CONSTANTS from "./constants.js";
import * as SCENE from "./scene.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import * as SHADER from "./shader.js";
import { nextLevel } from "./index.js";

let mousedown = false;
let mouse = { x: 0, y: 0 };

function enterFullscreen() {
    document.getElementById("canvas").style.cursor = "none";
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
    document.getElementById("canvas").style.cursor = "auto";
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

export function initialize() {
    document.addEventListener("mousedown", event => {
        mousedown = true;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
    
    document.addEventListener("mouseup", event => {
        mousedown = false;
    });
    
    document.addEventListener("mousemove", event => {
        if (mousedown) {
            SCENE.moveCamera(event.clientX - mouse.x, event.clientY - mouse.y);
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }
    });

    function wheelHandler(event) {
        SCENE.zoom(event.wheelDelta || -event.detail);
    }
    document.addEventListener("mousewheel", wheelHandler);
    document.addEventListener("DOMMouseScroll", wheelHandler);

    window.addEventListener("keydown", event => {
        switch (event.keyCode) {
            case 37://left
                PLAYER.moveLeft();
                break;
            case 38://up
                PLAYER.moveUp();
                break;
            case 39://right
                PLAYER.moveRight();
                break;
            case 40://down
                PLAYER.moveDown();
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
                let { x, y } = PLAYER.getHead();
                LIGHT.createLight(x - 0.25, y - 0.25, [1.0, 1.0, 0.8, CONSTANTS.LIGHTPARTICLE_BRIGHTNESS]);
                break;
            case 81://q
                LIGHT.removeLight(0);
                break;
            case 82://r
                console.log(SHADER.mapUniforms.u_lightColor.value);
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
            case 122:
                toggleFullscreen();
                event.preventDefault();
                break;
        }
    });

    window.addEventListener("keyup", event => {
        switch (event.keyCode) {
            case 37://left
                PLAYER.stopLeft();
                break;
            case 38://up
                PLAYER.stopUp();
                break;
            case 39://right
                PLAYER.stopRight();
                break;
            case 40://down
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
    });
}
