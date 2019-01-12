import * as SCENE from "./scene.js";
import * as OVERLAY from "./overlay.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import * as NOISE from "./noise.js";

let gameSeed = 1;
let level = 0;
let score = 0;

let mapSeed = 0;
let mapWidth = 200;
let mapHeight = 200;

SCENE.initialize();
OVERLAY.initialize();
OVERLAY.set(gameSeed, level, score);
INPUT.initialize();

let counter = 0;
let nextLvl = true;

export function loadSpecificLevel(_gameSeed, _level) {
    gameSeed = _gameSeed;
    level = _level;
    OVERLAY.initialize(gameSeed);
    OVERLAY.setLevel(level);
    loadNextMap();
}

export function nextLevel() {
    nextLvl = true;
}

function loadNextMap() {
    SCENE.reset();
    NOISE.setSeed(gameSeed + 200 * (level - 1));
    mapSeed = NOISE.random();
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
    LIGHT.renderLighting(counter);
    nextLvl = PLAYER.move(counter);
    PLAYER.center();

    SCENE.render();
}
gameloop();
