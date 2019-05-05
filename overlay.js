import * as DIALOG from "./dialog.js";
import * as GAME from "./game.js";
import * as HINT from "./hint.js";
import * as INPUT from "./input.js";

export function reset() {
    document.getElementById("screen-game").style.display = "none";

    setDialogText("");
    setDialogButtons([]);
    setActiveItem();
    setSeed(0);
    setLevel(0);
    setScore(0);
    setForm("dot");
    setLight([0, 0, 0, 0]);
    setLoadingProgressVolume(0);

    DIALOG.reset();
}

export function initialize(seed, level, score) {
    document.getElementById("screen-loading").style.display = "none";
    document.getElementById("screen-game").style.display = "block";

    setSeed(seed);
    setLevel(level);
    setScore(score);
    setForm("dot");
    setLight([0, 0, 0, 0]);
}

export function setLoadingProgressVolume(value) {
    document.getElementById("loading-volume").value = value;
}

export function ingameMenu() {
    GAME.pauseGame();
    INPUT.menuControls();
    document.getElementById("menu-ingame").style.display = "block";
} 

export function setSeed(seed) {
    document.getElementById("info-seed").innerHTML = seed;
}

export function setLevel(level) {
    document.getElementById("info-level").innerHTML = level;
}

export function setScore(score) {
    document.getElementById("info-score").innerHTML = score;
}

export function setForm(formID) {
    document.getElementById("info-form").innerHTML = formID;
}

export function setLight(color) {
    document.getElementById("status-light").style.boxShadow = `0px 0px ${color[3]}px ${color[3]}px rgb(${color[0] * 255},${color[1] * 255},${color[2] * 255})`;
}

export function setDialogText(text) {
    document.getElementById("dialog-text").innerHTML = text;
}

export function setDialogButtons(options, dialogNumber) {
    const dialog_buttons = document.getElementById("dialog-buttons");
    while (dialog_buttons.firstChild) {
        dialog_buttons.removeChild(dialog_buttons.firstChild);
    }
    for (const option of options) {
        const button = document.createElement("BUTTON");
        button.classList.add("button");
        button.classList.add("input-h");
        button.innerHTML = option.text;
        button.addEventListener("click", _ => {
            document.dispatchEvent(new CustomEvent("nextDialog", {detail: {index: option.index, dialogNumber}}));
        });
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

export function setActiveItem(item) {
    if (!item) {
        document.getElementById("status-item").innerHTML = "";
        return;
    }
    document.getElementById("status-item").innerHTML = item.name + " [" + item.number + "]";
}
