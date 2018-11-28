import * as SCENE from "./scene.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as NOISE from "./noise.js";

let gameSeed = 1;
NOISE.setSeed(gameSeed);

let mapSeed = 1000 * NOISE.random();
let mapWidth = 100;
let mapHeight = 100;

SCENE.initialize();
INPUT.initialize();

MAP.initialize(mapSeed, mapHeight, mapWidth);
MAP.create();
PLAYER.initialize();

let counter = 0;

function gameloop() {
    if (MAP.collisionWithPlayer()) {
        SCENE.reset();
        mapSeed = 1000 * NOISE.random();
        MAP.initialize(mapSeed, mapHeight, mapWidth);
        //MAP.initialize(Math.floor(1000 * Math.random()), Math.floor(1000 * Math.random()), mapHeight, mapWidth);
        MAP.create();
        PLAYER.initialize();
        alert("COLLISION!! AHHHHHH!!!");
        //return;
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
