import * as SOUND from "./sound.js";
import * as INPUT from "./input.js";
import * as SHADER from "./shader.js";
import { loadSpecificLevel } from "./index.js";

let display = undefined;

export function reset(seed, level, score) {
    document.getElementById("loading-box").style.display = "none";
    document.getElementById("info").style.display = "block";
    document.getElementById("canvas").style.display = "block";

    display = {
        seed: document.getElementById("info-seed"),
        level: document.getElementById("info-level"),
        score: document.getElementById("info-score"),
        health: document.getElementById("info-health"),
        form: document.getElementById("info-form"),
    };

    document.getElementById("info-set").removeEventListener("click", loadLevel);
    document.getElementById("info-set").addEventListener("click", loadLevel);

    document.getElementById("info-fc").removeEventListener("click", INPUT.toggleFullscreen);
    document.getElementById("info-fc").addEventListener("click", INPUT.toggleFullscreen);

    document.getElementById("info-sound").removeEventListener("click", toggleSoundButton);
    document.getElementById("info-sound").addEventListener("click", toggleSoundButton);
    
    document.getElementById("info-gamma").removeEventListener("input", setGamma);
    document.getElementById("info-gamma").addEventListener("input", setGamma);

    setSeed(seed);
    setLevel(level);
    setScore(score);
    setHealth(100);
    setForm("dot");
}

function loadLevel() {
    loadSpecificLevel(Number(display.seed.value), Number(display.level.value));
}

function toggleSoundButton() {
    if (SOUND.toggle()) {
        document.getElementById("info-sound").value = "Mute";
    } else {
        document.getElementById("info-sound").value = "Sound";
    }
}

function setGamma() {
    const gamma = document.getElementById("info-gamma").value;
    SHADER.mapUniforms.u_gamma.value = gamma;
    SHADER.objectUniforms.u_gamma.value = gamma;
    SHADER.animationDanceUniforms.u_gamma.value = gamma;
}

export function setSeed(seed) {
    //display.seed.innerHTML = seed;
    display.seed.value = seed;
}

export function setLevel(level) {
    //display.level.innerHTML = level;
    display.level.value = level;
}

export function setScore(score) {
    display.score.innerHTML = score;
}

export function setHealth(health) {
    display.health.style.width = `${health}%`;
}

export function setForm(formID) {
    display.form.innerHTML = formID;
}
