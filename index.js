import * as SCENE from "./scene.js";
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
INPUT.initialize();

let counter = 0;
let nextLvl = true;

export function nextLevel() {
    nextLvl = true;
}

function loadNewMap() {
    SCENE.reset();
    mapSeed = 1000 * NOISE.random();
    MAP.initialize(mapSeed, mapHeight, mapWidth);
}

function gameloop() {
    if (nextLvl) {
        nextLvl = false;
        loadNewMap();
    } else {
        let death = MAP.collisionWithPlayer();
        if (death) {
            alert("COLLISION!! AHHHHHH!!!");
            loadNewMap();//return;
        }
    }

    requestAnimationFrame(gameloop);

    if (counter == 1000) {
        counter = 0;
    } else {
        counter++;
    }
    
    MAP.planObjects(counter);
    MAP.moveObjects();
    PLAYER.move();
    PLAYER.center();

    SCENE.render();
}
gameloop();
