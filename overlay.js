import * as SOUND from "./sound.js";
import * as INPUT from "./input.js";
import * as SHADER from "./shader.js";
import * as HELP from "./help.js";
import { loadSpecificLevel } from "./index.js";

let display = undefined;
let dialogActive = false;

export function reset(seed, level, score) {
    document.getElementById("loading-box").style.display = "none";
    document.getElementById("info").style.display = "block";
    document.getElementById("canvas").style.display = "block";
    document.getElementById("status").style.display = "block";

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

    document.getElementById("info-help").removeEventListener("click", showHelp);
    document.getElementById("info-help").addEventListener("click", showHelp);

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

async function showText({ text, trigger }) {
    const dialog = document.createElement("DIV");
    dialog.classList.add("dialog");
    dialog.innerHTML = text;
    document.getElementById("dialog-box").appendChild(dialog);

    setTimeout(() => {
        dialog.remove();
    }, 5000);

    if (trigger) trigger();
}

async function showDialogAsync(dialog, index) {
    if (index === dialog.length) {
        dialogActive = false;
        return;
    }
    
    const diologNode = dialog[index];
    showText(diologNode);

    setTimeout(() => {
        showDialogAsync(dialog, index + 1);
    }, 5200);
}

export function showDialog(dialog) {
    if (dialogActive) return false;
    dialogActive = true;
    showDialogAsync(dialog, 0);
    return true;
}

export function updateStatus(counter) {
    if (counter % 50 !== 0) return;

    if (HELP.isPlayerNearHint()) {
        document.getElementById("status-help").style.opacity = 1;
    } else {
        document.getElementById("status-help").style.opacity = 0;
    }
}

function showHelp() {
    showDialog([
        { text: "Move with the arrow keys." },
        { text: "When your Glow stops increasing, press <b>E</b> to drop a light particle." },
        { text: "Find the magenta exit to proceed to the next level. It will get darker further down." },
        { text: "Avoid the red enemies. They will hurt you." },
        { text: "Yellow coins increase your score." },
        { text: "Purple items replenish your health. You will die when your health is depleted." },
        { text: "Near shrines you can change into different forms." },
        { text: "In Dot form you are small and cannot swim." },
        { text: "In Box form you can swim but will not fit everywhere." },
        { text: "In Snake form you can go anywhere but cannot easily dodge enemies." },
        { text: "When you see a big glowing <b>Q</b> in the down-left corner, press <b>Q</b> to see a hint." },
    ]);
}
