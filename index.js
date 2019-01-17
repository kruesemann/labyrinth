import * as CONSTANTS from "./constants.js";
import * as STAGE from "./stage.js";
import * as SOUND from "./sound.js";
import * as OVERLAY from "./overlay.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import * as NOISE from "./noise.js";

let game = undefined;

export function reset() {
    console.log("hello there");
    game = {
        seed: 1,
        level: 0,
        score: 0,
        mapSeed: 0,
        counter: 0,
        nextLevel: true,
    };

    STAGE.reset();
    OVERLAY.reset(game.gameSeed, game.level, game.score);
    INPUT.reset();

    document.removeEventListener("soundReady", gameloop);
    document.addEventListener("soundReady", gameloop);
}

export function loadSpecificLevel(gameSeed, level) {
    game.seed = gameSeed;
    game.level = level;
    OVERLAY.setSeed(game.seed);
    OVERLAY.setLevel(game.level);
    loadNextMap();
}

export function nextLevel() {
    game.nextLvl = true;
}

export function increaseScore() {
    OVERLAY.setScore(++game.score);
}

function loadNextMap() {
    STAGE.resetScene();
    NOISE.setSeed(game.seed + 200 * (game.level - 1));
    game.mapSeed = NOISE.random();
    MAP.reset(game.mapSeed, 200, 200, game.level);
}

function gameloop() {
    if (game.nextLvl) {
        game.nextLvl = false;
        OVERLAY.setLevel(++game.level);
        loadNextMap();
    } else {
        let death = MAP.collisionWithPlayer();
        if (death) {
            alert("COLLISION!! AHHHHHH!!!");
            return;
        }
    }

    requestAnimationFrame(gameloop);

    if (game.counter == CONSTANTS.MAX_COUNTER) {
        game.counter = 0;
    } else {
        game.counter++;
    }
    
    ITEM.collectItemsUnderPlayer();
    MAP.planObjects(counter);
    MAP.moveObjects(counter);
    LIGHT.renderLighting(counter);
    game.nextLvl = PLAYER.move(counter);
    PLAYER.center();

    STAGE.render();
}
//gameloop();

reset();
