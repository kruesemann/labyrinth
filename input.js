import * as SCENE from "./scene.js";
import * as PLAYER from "./player.js";
import { nextLevel } from "./index.js";

let mousedown = false;
let mouse = { x: 0, y: 0 };

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

        switch (event.keyCode) {
            case 88://x
                nextLevel();
                break;
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
            case 122:
                if (
                    (document.fullScreenElement && document.fullScreenElement !== null) ||
                    (document.mozFullScreen || document.webkitIsFullScreen)
                ) {
                    exitFullscreen();
                } else {
                    enterFullscreen();
                }
                event.preventDefault();
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
        }
    });
}
