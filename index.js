import * as CONSTANTS from "./constants.js";
import * as STAGE from "./stage.js";
import * as OVERLAY from "./overlay.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import * as NOISE from "./noise.js";

let game = undefined;

export function reset() {
    game = {
        seed: 1,
        level: 0,
        score: 0,
        mapSeed: 0,
        counter: 0,
        nextLevel: true,
    };

    document.removeEventListener("soundReady", setup);
    document.addEventListener("soundReady", setup);

    STAGE.reset();
}

function setup() {
    OVERLAY.reset(game.seed, game.level, game.score);
    INPUT.reset();
    gameloop();
}

export function loadSpecificLevel(gameSeed, level) {
    game.seed = gameSeed;
    game.level = level;
    OVERLAY.setSeed(game.seed);
    OVERLAY.setLevel(game.level);
    loadNextMap();
}

export function nextLevel() {
    game.nextLevel = true;
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
    if (game.nextLevel) {
        game.nextLevel = false;
        OVERLAY.setLevel(++game.level);
        loadNextMap();
    } else {
        const death = MAP.collisionWithPlayer();
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
    MAP.planObjects(game.counter);
    MAP.moveObjects(game.counter);
    game.nextLevel = PLAYER.move(game.counter);
    PLAYER.center();

    LIGHT.renderLighting(game.counter);
    STAGE.render();
}
//gameloop();

reset();
