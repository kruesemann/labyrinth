import * as SOUND from "./sound.js";
import * as INPUT from "./input.js";
import { loadSpecificLevel } from "./index.js";

let seedDisplay = undefined;
let levelDisplay = undefined;
let scoreDisplay = undefined;

export function reset(seed, level, score) {
    seedDisplay = document.getElementById('info-seed');
    levelDisplay = document.getElementById('info-level');
    scoreDisplay = document.getElementById('info-score');

    document.getElementById("info-set").removeEventListener("click", setLevel);
    document.getElementById("info-set").addEventListener("click", setLevel);

    document.getElementById("info-fc").removeEventListener("click", INPUT.toggleFullscreen);
    document.getElementById("info-fc").addEventListener("click", INPUT.toggleFullscreen);

    document.getElementById("info-sound").removeEventListener("click", toggleSoundButton);
    document.getElementById("info-sound").addEventListener("click", toggleSoundButton);

    setSeed(seed);
    setLevel(level);
    setScore(score);
}

function setLevel() {
    loadSpecificLevel(Number(seedDisplay.value), Number(levelDisplay.value));
}

function toggleSoundButton() {
    if (SOUND.toggle()) {
        document.getElementById("info-sound").value = "Mute";
    } else {
        document.getElementById("info-sound").value = "Sound";
    }
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
