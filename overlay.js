import * as INPUT from "./input.js";
import { loadSpecificLevel } from "./index.js";

let seedDisplay = undefined;
let levelDisplay = undefined;
let scoreDisplay = undefined;

export function initialize() {
    seedDisplay = document.getElementById('info-seed');
    levelDisplay = document.getElementById('info-level');
    scoreDisplay = document.getElementById('info-score');

    document.getElementById("info-set").addEventListener("click", _ => {
        loadSpecificLevel(Number(seedDisplay.value), Number(levelDisplay.value));
    });

    document.getElementById("info-fc").addEventListener("click", _ => {
        INPUT.toggleFullscreen();
    });
}

export function setSeed(seed) {
    //seedDisplay.innerHTML = seed;
    seedDisplay.value = seed;
}

export function setLevel(level) {
    //levelDisplay.innerHTML = level;
    levelDisplay.value = level;
}

export function setScore(score) {
    scoreDisplay.innerHTML = score;
}

export function set(seed, level, score) {
    setSeed(seed);
    setLevel(level);
    setScore(score);
}
