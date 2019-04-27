import * as GAME from "./game.js";
import * as INPUT from "./input.js";
import * as OVERLAY from "./overlay.js";

let dialog = {
    list: [],
    number: 0,
    currentIndex: -1
};

export function reset() {
    document.removeEventListener("nextDialog", next);
    OVERLAY.hideDialog();
    dialog = {
        list: [],
        number: 0,
        currentIndex: -1
    };
}

export function stop() {
    if (++dialog.number === 10000) dialog.number = 0;
    dialog.currentIndex = -1;
    document.removeEventListener("nextDialog", next);
    OVERLAY.hideDialog();
    GAME.resumeGame();
    INPUT.gameControls();
    setTimeout( _ => { dialog.list = []; }, 500);
}

function next(event) {
    const number = dialog.number;
    if (event.detail.dialogNumber !== number) return;
    
    OVERLAY.hideDialog();
    setTimeout(_ => {
        showWithIndex(event.detail.index, number);
    }, 500);
}

function showWithIndex(index, number) {
    if (!dialog.list.length || number !== dialog.number) return;

    if (index >= dialog.list.length) {
        stop();
        return;
    }
    OVERLAY.setDialogText(dialog.list[index].text);

    if (dialog.list[index].buttons && dialog.list[index].buttons.length) {
        OVERLAY.setDialogButtons(dialog.list[index].buttons, number);
    } else {
        OVERLAY.setDialogButtons([]);
        setTimeout(_ => {
            document.dispatchEvent(new CustomEvent("nextDialog", { detail: { index: index + 1, dialogNumber: number } }));
        }, 3000);
    }

    if (dialog.list[index].trigger) {
        dialog.list[index].trigger();
    }

    dialog.currentIndex = index;
    OVERLAY.showDialog();
}

export function show(newDialog, pause) {
    if (dialog.list.length || !newDialog || !newDialog.length) return false;
    dialog.list = newDialog;
    if (pause) {
        GAME.pauseGame();
        INPUT.dialogControls();
    }
    document.addEventListener("nextDialog", next);
    showWithIndex(0, dialog.number);
    return true;
}

export function skipCurrent() {
    if (dialog.currentIndex < 0 || dialog.currentIndex >= dialog.list.length || (dialog.list[dialog.currentIndex].buttons && dialog.list[dialog.currentIndex].buttons.length)) return;
    const number = dialog.number + 1;
    dialog.number = number;
    document.dispatchEvent(new CustomEvent("nextDialog", { detail: { index: dialog.currentIndex + 1, dialogNumber: number } }));
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