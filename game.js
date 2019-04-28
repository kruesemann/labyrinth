import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as INVENTORY from "./inventory.js";
import * as ITEM from "./item.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as NOISE from "./noise.js";
import * as OBJECT from "./object.js";
import * as OVERLAY from "./overlay.js";
import * as PLAYER from "./player.js";
import * as SOUND from "./sound.js";
import * as STAGE from "./stage.js";

let game = {
    seed: 0,
    level: 0,
    score: 0,
    mapSeed: 0,
    counter: 0,
    nextLevel: true,
    paused: false
};

export function reset() {
    game = {
        seed: 0,
        level: 0,
        score: 0,
        mapSeed: 0,
        counter: 0,
        nextLevel: true,
        paused: false
    };

    STAGE.reset();
    OVERLAY.reset();
    NOISE.reset();
}

export function initialize(seed) {
    game = {
        seed,
        level: 0,
        score: 0,
        mapSeed: 0,
        counter: 0,
        nextLevel: true,
        paused: false
    };

    STAGE.initialize();
    NOISE.setGameSeed(game.seed);

    loadingLoop();
}

function loadingLoop() {
    const loadingProgressVolume = SOUND.loadingProgress();
    OVERLAY.setLoadingProgressVolume(loadingProgressVolume);
    if (loadingProgressVolume === 100) setTimeout(setup, 0); //sonst sieht man nie den Ladebalken voll
    else requestAnimationFrame(loadingLoop);
}

function setup() {
    OVERLAY.initialize(game.seed, game.level, game.score);
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
    MAP.initialize(game.mapSeed, 200, 200, game.seed, game.level);
}

function resolveCollisions() {
    if (!OBJECT.collisionWithPlayer()) return;

    if (!PLAYER.hurt()) return;

    alert("DEAD!! AHHHHHH!!!");
    setScore(0);
    loadSpecificLevel(game.seed, 1);
}

export function pauseGame() {
    game.paused = true;
    SOUND.fadeOutLevel();
}

export function resumeGame() {
    if (!game.paused) return;
    game.paused = false;
    gameloop();
}

export function togglePause() {
    if (game.paused) resumeGame();
    else pauseGame();
}

function gameloop() {
    if (game.paused) return;

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
        ++game.counter;
    }
    
    INVENTORY.processActiveItems(game.counter);
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
