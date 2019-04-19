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
import * as SOUND from "./sound.js";

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

function setScore(score) {
    game.score = score;
    OVERLAY.setScore(score);
}

export function increaseScore() {
    setScore(game.score + 1);
}

function loadNextMap() {
    STAGE.resetScene();
    game.mapSeed = NOISE.nextMapSeed();
    MAP.reset(game.mapSeed, 200, 200, game.seed, game.level);
}

function resolveCollisions() {
    if (!OBJECT.collisionWithPlayer()) return;

    if (!PLAYER.hurt()) return;

    alert("DEAD!! AHHHHHH!!!");
    setScore(0);
    loadSpecificLevel(game.seed, 1);
}

function gameloop() {
    if (game.nextLevel) {
        game.nextLevel = false;
        OVERLAY.setLevel(++game.level);
        loadNextMap();
    }

    resolveCollisions();

    requestAnimationFrame(gameloop);

    if (game.counter === CONSTANTS.MAX_COUNTER) {
        game.counter = 0;
    } else {
        game.counter++;
    }
    
    ITEM.collectItemsUnderPlayer();
    OBJECT.planEnemies(game.counter);
    OBJECT.moveEnemies(game.counter);
    game.nextLevel = PLAYER.move(game.counter);
    PLAYER.center();
    MAP.ambientSound(game.counter);
    ANIMATION.animate();
    SOUND.controlVolume(game.counter);
    OVERLAY.updateStatus(game.counter);

    LIGHT.renderLighting(game.counter);
    STAGE.render();
}

reset();
