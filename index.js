import * as CONSTANTS from "./constants.js";
import * as STAGE from "./stage.js";
import * as OVERLAY from "./overlay.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as OBJECT from "./object.js";
import * as PLAYER from "./player.js";
import * as LIGHT from "./light.js";
import * as ITEM from "./item.js";
import * as NOISE from "./noise.js";
import * as EVENT from "./event.js";
import * as ANIMATION from "./animation.js";

let game = undefined;

export function reset() {
    EVENT.reset();

    game = {
        seed: 1,
        level: 0,
        score: 0,
        mapSeed: 0,
        counter: 0,
        nextLevel: true,
    };

    EVENT.on("soundReady", setup);

    STAGE.reset();
}

function setup() {
    EVENT.off("soundReady", setup);

    OVERLAY.reset(game.seed, game.level, game.score);
    NOISE.setGameSeed(game.seed);
    INPUT.reset();
    gameloop();
}

export function loadSpecificLevel(gameSeed, level) {
    game.seed = gameSeed;
    game.level = level;
    OVERLAY.setSeed(game.seed);
    OVERLAY.setLevel(game.level);
    NOISE.setGameSeed(game.seed + level - 1);
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
    game.mapSeed = NOISE.nextMapSeed();
    MAP.reset(game.mapSeed, 200, 200, game.level);
}

function gameloop() {
    if (game.nextLevel) {
        game.nextLevel = false;
        OVERLAY.setLevel(++game.level);
        loadNextMap();
    } else {
        const death = OBJECT.collisionWithPlayer();
        if (death) {
            alert("COLLISION!! AHHHHHH!!!");
            game.score = 0;
            OVERLAY.setScore(game.score);
            loadSpecificLevel(game.seed, 1);
        }
    }

    requestAnimationFrame(gameloop);

    if (game.counter === CONSTANTS.MAX_COUNTER) {
        game.counter = 0;
    } else {
        game.counter++;
    }

    if (game.counter % 200 === 0) {
        ANIMATION.playSnakeDance();
    }
    
    ITEM.collectItemsUnderPlayer();
    OBJECT.planEnemies(game.counter);
    OBJECT.moveEnemies(game.counter);
    game.nextLevel = PLAYER.move(game.counter);
    PLAYER.center();
    MAP.ambientSound();
    ANIMATION.animate();

    LIGHT.renderLighting(game.counter);
    STAGE.render();
}

reset();
