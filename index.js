import * as SCENE from "./scene.js";
import * as OVERLAY from "./overlay.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";

let gameSeed = 1;
NOISE.setSeed(gameSeed);

let mapSeed = 1000 * NOISE.random();
let mapWidth = 200;
let mapHeight = 200;

SCENE.initialize();
OVERLAY.initialize();
INPUT.initialize();

let counter = 0;
let level = 0;
let nextLvl = true;

export function nextLevel() {
    nextLvl = true;
}

function loadNextMap() {
    SCENE.reset();
    mapSeed = 1000 * NOISE.random();
    MAP.initialize(mapSeed, mapHeight, mapWidth, level);
}

function gameloop() {
    if (nextLvl) {
        nextLvl = false;
        OVERLAY.setLevel(++level);
        loadNextMap();
    } else {
        let death = MAP.collisionWithPlayer();
        if (death) {
            alert("COLLISION!! AHHHHHH!!!");
            return;
        }
    }

    requestAnimationFrame(gameloop);

    if (counter == 1000) {
        counter = 0;
    } else {
        counter++;
    }
    
    MAP.planObjects(counter);
    MAP.moveObjects(counter);
    nextLvl = PLAYER.move(counter);
    PLAYER.center();

    SCENE.render();
}
gameloop();
