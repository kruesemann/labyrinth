import * as SOUND from "./sound.js";
import * as INPUT from "./input.js";
import * as SHADER from "./shader.js";
import * as HINT from "./hint.js";
import * as DIALOG from "./dialog.js";
import { loadSpecificLevel } from "./index.js";

let display = undefined;

export function reset(seed, level, score) {
    document.getElementById("loading-box").style.display = "none";
    document.getElementById("info").style.display = "block";
    document.getElementById("canvas").style.display = "block";
    document.getElementById("status").style.display = "block";

    display = {
        seed: document.getElementById("info-seed"),
        level: document.getElementById("info-level"),
        score: document.getElementById("info-score"),
        form: document.getElementById("info-form"),
        light: document.getElementById("status-light"),
    };

    DIALOG.reset();
    setDialogText("");
    setDialogButtons([]);

    document.getElementById("info-set").removeEventListener("click", loadLevel);
    document.getElementById("info-set").addEventListener("click", loadLevel);

    document.getElementById("info-fc").removeEventListener("click", INPUT.toggleFullscreen);
    document.getElementById("info-fc").addEventListener("click", INPUT.toggleFullscreen);

    document.getElementById("info-sound").removeEventListener("click", toggleSoundButton);
    document.getElementById("info-sound").addEventListener("click", toggleSoundButton);

    document.getElementById("info-help").removeEventListener("click", DIALOG.showHelp);
    document.getElementById("info-help").addEventListener("click", DIALOG.showHelp);

    document.getElementById("info-gamma").removeEventListener("input", setGamma);
    document.getElementById("info-gamma").addEventListener("input", setGamma);

    setSeed(seed);
    setLevel(level);
    setScore(score);
    setForm("dot");
    setLight([0, 0, 0, 0]);
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

export function setForm(formID) {
    display.form.innerHTML = formID;
}

export function setLight(color) {
    display.light.style.boxShadow = `0px 0px ${color[3]}px ${color[3]}px rgb(${color[0] * 255},${color[1] * 255},${color[2] * 255})`;
}

export function setDialogText(text) {
    document.getElementById("dialog-text").innerHTML = text;
}

export function setDialogButtons(options, dialogNumber) {
    const dialog_buttons = document.getElementById("dialog-buttons");
    while (dialog_buttons.firstChild) {
        dialog_buttons.removeChild(dialog_buttons.firstChild);
    }
    for (let option of options) {
        const button = document.createElement("BUTTON");
        button.classList.add("button");
        button.innerHTML = option.text;
        button.addEventListener("click", _ => { document.dispatchEvent(new CustomEvent("nextDialog", { detail: { index: option.index, dialogNumber } })); });
        dialog_buttons.appendChild(button);
    }
}

export function showDialog() {
    document.getElementById("dialog").style.opacity = 1;
}

export function hideDialog() {
    document.getElementById("dialog").style.opacity = 0;
}

export function updateStatus(counter) {
    if (counter % 50 !== 0) return;

    if (HINT.isPlayerNearHint()) {
        document.getElementById("status-help").style.opacity = 1;
    } else {
        document.getElementById("status-help").style.opacity = 0;
    }
}
