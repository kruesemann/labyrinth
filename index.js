import * as DIALOG from "./dialog.js";
import * as GAME from "./game.js";
import * as INPUT from "./input.js";
import * as SHADER from "./shader.js";
import * as SOUND from "./sound.js";

SOUND.initialize();
INPUT.initialize();

document.getElementById("menu-main-start").addEventListener("click", gameMenu);
document.getElementById("menu-main-options").addEventListener("click", mainOptionsMenu);

document.getElementById("menu-game-start").addEventListener("click", startGame);
document.getElementById("menu-game-back").addEventListener("click", mainMenu);

document.getElementById("menu-options-sound").addEventListener("input", setMasterVolume);

document.getElementById("menu-ingame-back").addEventListener("click", resumeGame);
document.getElementById("menu-ingame-options").addEventListener("click", ingameOptionsMenu);
document.getElementById("menu-ingame-help").addEventListener("click", showHelp);
document.getElementById("menu-ingame-exit").addEventListener("click", resetGame);

function mainMenu() {
    console.log("hello terhe");
    document.getElementById("screen-game").style.display = "none";
    document.getElementById("screen-loading").style.display = "none";
    document.getElementById("screen-start").style.display = "block";
    document.getElementById("menu-ingame").style.display = "none";
    document.getElementById("menu-game").style.display = "none";
    document.getElementById("menu-options").style.display = "none";
    document.getElementById("menu-main").style.display = "block";
}

function startGame() {
    document.getElementById("menu-game").style.display = "none";
    document.getElementById("screen-start").style.display = "none";
    document.getElementById("screen-loading").style.display = "block";
    INPUT.gameControls();
    GAME.initialize(Number(document.getElementById("menu-game-seed").value));
}

function gameMenu() {
    document.getElementById("menu-main").style.display = "none";
    document.getElementById("menu-game-seed").value = Math.floor(Math.random() * 1000000000000);
    document.getElementById("menu-game").style.display = "block";
}

function optionsMenu() {
    document.getElementById("menu-options-gamma").value = 1 - SHADER.getGamma();
    document.getElementById("menu-options-fullscreen").checked = INPUT.isFullscreenOn();
    document.getElementById("menu-options-sound").value = SOUND.getMasterVolume();
    document.getElementById("menu-options").style.display = "block";
}

function setMasterVolume() {
    SOUND.setMasterVolume(document.getElementById("menu-options-sound").value);
}

function applyOptions() {
    SHADER.setGamma(1 - Number(document.getElementById("menu-options-gamma").value));
    INPUT.setFullscreen(document.getElementById("menu-options-fullscreen").checked);
}

function mainOptionsMenu() {
    document.getElementById("menu-options-back").addEventListener("click", mainOptionsMenuBack);
    document.getElementById("menu-main").style.display = "none";
    optionsMenu();
}

function mainOptionsMenuBack() {
    document.getElementById("menu-options-back").removeEventListener("click", mainOptionsMenuBack);
    applyOptions();
    mainMenu();
}

function ingameOptionsMenu() {
    document.getElementById("menu-options-back").addEventListener("click", ingameOptionsMenuBack);
    document.getElementById("menu-ingame").style.display = "none";
    optionsMenu();
}

function ingameOptionsMenuBack() {
    document.getElementById("menu-options-back").removeEventListener("click", ingameOptionsMenuBack);
    applyOptions();
    document.getElementById("menu-options").style.display = "none";
    document.getElementById("menu-ingame").style.display = "block";
}

export function resumeGame() {
    document.getElementById("menu-ingame").style.display = "none";
    INPUT.gameControls();
    GAME.resumeGame();
}

function resetGame() {
    GAME.reset();
    mainMenu();
}

function showHelp() {
    document.getElementById("menu-ingame").style.display = "none";
    DIALOG.showHelp();
}
