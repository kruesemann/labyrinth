import * as OVERLAY from "./overlay.js";
import * as GAME from "./game.js";
import * as INPUT from "./input.js";

let dialog = [];
let dialogNumber = 0;
let currentIndex = -1;

export function reset() {
    if (++dialogNumber === 10000) dialogNumber = 0;
    currentIndex = -1;
    document.removeEventListener("nextDialog", next);
    OVERLAY.hideDialog();
    GAME.resumeGame();
    INPUT.gameControls();
    setTimeout( _ => { dialog = []; }, 500);
}

function next(event) {
    const number = dialogNumber;
    if (event.detail.dialogNumber !== number) return;
    
    OVERLAY.hideDialog();
    setTimeout(_ => {
        showWithIndex(event.detail.index, number);
    }, 500);
}

function showWithIndex(index, number) {
    if (!dialog.length || number !== dialogNumber) return;

    if (index >= dialog.length) {
        reset();
        return;
    }
    OVERLAY.setDialogText(dialog[index].text);

    if (dialog[index].buttons && dialog[index].buttons.length) {
        OVERLAY.setDialogButtons(dialog[index].buttons, number);
    } else {
        OVERLAY.setDialogButtons([]);
        setTimeout(_ => {
            document.dispatchEvent(new CustomEvent("nextDialog", { detail: { index: index + 1, dialogNumber: number } }));
        }, 3000);
    }

    if (dialog[index].trigger) {
        dialog[index].trigger();
    }

    currentIndex = index;
    OVERLAY.showDialog();
}

export function show(newDialog, pause) {
    if (dialog.length || !newDialog || !newDialog.length) return false;
    dialog = newDialog;
    if (pause) {
        GAME.pauseGame();
        INPUT.dialogControls();
    }
    document.addEventListener("nextDialog", next);
    showWithIndex(0, dialogNumber);
    return true;
}

export function skipCurrent() {
    if (currentIndex < 0 || currentIndex >= dialog.length || (dialog[currentIndex].buttons && dialog[currentIndex].buttons.length)) return;
    const number = dialogNumber + 1;
    dialogNumber = number;
    document.dispatchEvent(new CustomEvent("nextDialog", { detail: { index: currentIndex + 1, dialogNumber: number } }));
}

export function showHelp() {
    show([
        { text: "Move with the arrow keys.", buttons: [{ text: "Continue", index: 1 }, { text: "Skip 1", index: 2 }] },
        { text: "When your Glow stops increasing, press <b>E</b> to drop a light particle." },
        { text: "Find the magenta exit to proceed to the next level. It will get darker further down.", buttons: [{ text: "Continue", index: 3 }, { text: "Skip 3", index: 7 }, { text: "Back", index: 1 }, { text: "Reset", index: 0 }] },
        { text: "Avoid the red enemies. They will hurt you." },
        { text: "Yellow coins increase your score." },
        { text: "Purple items replenish your health. You will die when your health is depleted." },
        { text: "Near shrines you can change into different forms." },
        { text: "In Dot form you are small and cannot swim." },
        { text: "In Box form you can swim but will not fit everywhere." },
        { text: "In Snake form you can go anywhere but cannot easily dodge enemies." },
        { text: "When you see a big glowing <b>Q</b> in the down-left corner, press <b>Q</b> to see a hint.", buttons: [{ text: "Done", index: Infinity }] }
    ], true);
}