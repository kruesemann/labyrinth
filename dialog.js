import * as GAME from "./game.js";
import * as INPUT from "./input.js";
import * as OPTIONS from "./options.js";
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
    setTimeout(_ => {
        dialog.list = [];
    }, 500);
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
            document.dispatchEvent(new CustomEvent("nextDialog", {detail: {index: index + 1, dialogNumber: number}}));
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
    document.dispatchEvent(new CustomEvent("nextDialog", {detail: {index: dialog.currentIndex + 1, dialogNumber: number}}));
}

export function showHelp() {
    show([
        {
            text: `You can skip this dialog by pressing <b>${OPTIONS.translateBinding(OPTIONS.dialogControls.dStop)}</b>.`,
            buttons: [{text: "Next", index: 1}]
        },
        {
            text: `Move with <b>${OPTIONS.translateBinding(OPTIONS.gameControls.gUp)}${OPTIONS.translateBinding(OPTIONS.gameControls.gLeft)}${OPTIONS.translateBinding(OPTIONS.gameControls.gDown)}${OPTIONS.translateBinding(OPTIONS.gameControls.gRight)}</b>.`,
            buttons: [{text: "Next", index: 2}]
        },
        {
            text: `When your <em>Glow</em> stops increasing, press <b>${OPTIONS.translateBinding(OPTIONS.gameControls.particle)}</b> to drop a light particle.`,
            buttons: [{text: "Next", index: 3}]
        },
        {
            text: `Dropping a light particle on a <em>Beacon</em> (orange cross) will light the <em>Beacon</em>.`,
            buttons: [{text: "Next", index: 4}]
        },
        {
            text: `Find the magenta exit to proceed to the next level. It will get darker further down.`,
            buttons: [{text: "Next", index: 5}]
        },
        {
            text: `Avoid the red enemies. They will take away your <em>Glow</em>.`,
            buttons: [{text: "Next", index: 6}]
        },
        {
            text: `Collecting yellow <em>Star Fragments</em> or standing next to a lit <em>Beacon</em> will increase your maximum <em>Glow</em> up to a point.`,
            buttons: [{text: "Next", index: 7}]
        },
        {
            text: `Sometimes you can see hidden items flashing. Uncover them by <em>Flaring</em> with <b>${OPTIONS.translateBinding(OPTIONS.gameControls.flare)}</b>, but beware: <em>Flaring</em> decreases your maximum <em>Glow</em>.`,
            buttons: [{text: "Next", index: 8}]
        },
        {
            text: `Sometimes you can see regular patterns of dark tiles on the ground. Have them lit up by particles at the same time to uncover a hidden item.`,
            buttons: [{text: "Next", index: 9}]
        },
        {
            text: `Sometimes you will find <em>Wisps</em>. If you are quick enough you can catch them.`,
            buttons: [{text: "Next", index: 10}]
        },
        {
            text: `Usable items will appear in your inventory on the left. You can cycle through it by pressing <b>${OPTIONS.translateBinding(OPTIONS.gameControls.browse)}</b> and use the active item by pressing <b>${OPTIONS.translateBinding(OPTIONS.gameControls.useItem)}</b>.`,
            buttons: [{text: "Next", index: 11}]
        },
        {
            text: `Near <em>Shrines</em> you can change into different forms, signified by colored squares.`,
            buttons: [{text: "Next", index: 12}]
        },
        {
            text: `In <em>Dot</em> form you are small and cannot swim. It is signified by a white square.`,
            buttons: [{text: "Next", index: 13}]
        },
        {
            text: `In <em>Box</em> form you can swim but will not fit everywhere. It is signified by a green square.`,
            buttons: [{text: "Next", index: 14}]
        },
        {
            text: `In <em>Snake</em> form you can go anywhere but cannot easily dodge enemies. It is signified by a red square.`,
            buttons: [{text: "Next", index: 15}]
        },
        {
            text: `When you see a big glowing <b>Q</b> in the down-left corner, press <b>${OPTIONS.translateBinding(OPTIONS.gameControls.hint)}</b> to see a hint.`,
            buttons: [{text: "Again", index: 0}, {text: "Done", index: Infinity}]
        }
    ], true);
}