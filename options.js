const keyCodes = {
      3: "BREAK",
      8: "BACKSPACE",
      9: "TAB",
     12: "CLEAR",
     13: "ENTER",
     16: "SHIFT",
     17: "CTRL",
     18: "ALT",
     19: "PAUSE",
     20: "CAPSLOCK",
     21: "HANGUL",
     25: "HANJA",
     27: "ESC",
     28: "CONV",
     29: "NONCONV",
     32: "SPACE",
     33: "PAGEUP",
     34: "PAGEDOWN",
     35: "END",
     36: "HOME",
     37: "LEFT",
     38: "UP",
     39: "RIGHT",
     40: "DOWN",
     41: "SELECT",
     42: "PRINT",
     43: "EXEC",
     44: "PRINT SCR",
     45: "INSERT",
     46: "DELETE",
     47: "HELP",
     48: "0",
     49: "1",
     50: "2",
     51: "3",
     52: "4",
     53: "5",
     54: "6",
     55: "7",
     56: "8",
     57: "9",
     58: ":",
     59: ";",
     60: "<",
     61: "=",
     63: "ß",
     64: "@",
     65: "A",
     66: "B",
     67: "C",
     68: "D",
     69: "E",
     70: "F",
     71: "G",
     72: "H",
     73: "I",
     74: "J",
     75: "K",
     76: "L",
     77: "M",
     78: "N",
     79: "O",
     80: "P",
     81: "Q",
     82: "R",
     83: "S",
     84: "T",
     85: "U",
     86: "V",
     87: "W",
     88: "X",
     89: "Y",
     90: "Z",
     91: "SPECIAL LEFT",
     92: "RIGHT WINDOW",
     93: "SPECIAL RIGHT",
     95: "SPLEEP",
     96: "NUM 0",
     97: "NUM 1",
     98: "NUM 2",
     99: "NUM 3",
    100: "NUM 4",
    101: "NUM 5",
    102: "NUM 6",
    103: "NUM 7",
    104: "NUM 8",
    105: "NUM 9",
    106: "MULT",
    107: "ADD",
    108: "NUM SEP",
    109: "SUB",
    110: "DEC POINT",
    111: "DIV",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    124: "F13",
    125: "F14",
    126: "F15",
    127: "F16",
    128: "F17",
    129: "F18",
    130: "F19",
    131: "F20",
    132: "F21",
    133: "F22",
    134: "F23",
    135: "F24",
    144: "NUM LOCK",
    145: "SCROLL LOCK",
    160: "^",
    161: "!",
    162: "؛",
    163: "#",
    164: "$",
    165: "ù",
    166: "PAGE BACKWARD",
    167: "PAGE FORWARD",
    168: "REFRESH",
    169: "CLOSING PAREN",
    170: "*",
    171: "~",
    172: "HOME",
    173: "-",
    174: "decrease volume level",
    175: "increase volume level",
    176: "NEXT",
    177: "PREVIOUS",
    178: "STOP",
    179: "PLAY/PAUSE",
    180: "EMAIL",
    181: "MUTE/UNMUTE",
    182: "DECR VOL",
    183: "INCR VOL",
    186: "semi-colon / ñ",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "grave accent / ñ / æ / ö",
    193: "?",
    194: "NUM SEP",
    219: "(",
    220: "\\",
    221: ")",
    222: "'",
    223: "`",
    224: "SPECIAL",
    225: "ALTGR",
    226: "< /git >, left back slash",
    230: "GNOME Compose Key",
    231: "ç",
    233: "XF86Forward",
    234: "XF86Back",
    235: "non-conversion",
    240: "alphanumeric",
    242: "hiragana/katakana",
    243: "half-width/full-width",
    244: "kanji",
    251: "unlock trackpad (Chrome/Edge)",
    255: "toggle touchpad",
};

export let gameControls = undefined;

export let menuControls = undefined;

export let dialogControls = undefined;

export function reset() {
    gameControls = {
        gLeft:       65, // a
        gUp:         87, // w
        gRight:      68, // d
        gDown:       83, // s
        browse:       9, // tab
        menu:        27, // esc
        transform:   32, // space
        gSkip:      190, // .
        gStop:       88, // x
        particle:    69, // e
        flare:       70, // f
        hint:        81, // q
        useItem:     82, // r
        pause:       80, // p
    };
    
    menuControls = {
        mLeft:       37, // left
        mUp:         38, // up
        mRight:      39, // right
        mDown:       40, // down
        mEnter:      13, // enter
        mBack:       27, // esc
    };
    
    dialogControls = {
        dLeft:       37, // left
        dUp:         38, // up
        dRight:      39, // right
        dDown:       40, // down
        dEnter:      13, // enter
        dSkip:      190, // .
        dStop:       88, // x
    };

    for (const key in gameControls) {
        if (!gameControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = keyCodes[gameControls[key]];
        document.getElementById(key).addEventListener("click", gameBindingHandler);
    }

    for (const key in menuControls) {
        if (!menuControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = keyCodes[menuControls[key]];
        document.getElementById(key).addEventListener("click", menuBindingHandler);
    }

    for (const key in dialogControls) {
        if (!dialogControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = keyCodes[dialogControls[key]];
        document.getElementById(key).addEventListener("click", dialogBindingHandler);
    }
}

function isUsed(newBinding, keyCode, layout) {
    for (const key in layout) {
        if (!layout.hasOwnProperty(key) || key === newBinding) continue;
        if (layout[key] === keyCode) return key;
    }
    return undefined;
}

function getConfirmation(newBinding, keyCode, layout, oldBinding) {
    document.getElementById("screen-menu").style.pointerEvents = "none";
    document.getElementById("screen-window").style.display = "block";
    document.getElementById("window-text").innerHTML = "This key is already bound to another function. Replace binding?";

    const windowButtons = document.getElementById("window-buttons");
    const yesButton = document.createElement("BUTTON");
    yesButton.classList.add("input-h");
    yesButton.classList.add("button");
    yesButton.innerHTML = "Yes";
    const noButton = document.createElement("BUTTON");
    noButton.classList.add("input-h");
    noButton.classList.add("button");
    noButton.innerHTML = "No";

    yesButton.addEventListener("click", _ => {
        changeControls(newBinding, keyCode, layout);
        changeControls(oldBinding, undefined, layout);
        document.getElementById("screen-menu").style.pointerEvents = "auto";
        document.getElementById("screen-window").style.display = "none";
        windowButtons.removeChild(yesButton);
        windowButtons.removeChild(noButton);
    });

    noButton.addEventListener("click", _ => {
        document.getElementById("screen-menu").style.pointerEvents = "auto";
        document.getElementById("screen-window").style.display = "none";
        windowButtons.removeChild(yesButton);
        windowButtons.removeChild(noButton);
    });

    windowButtons.appendChild(yesButton);
    windowButtons.appendChild(noButton);
}

function changeControls(newBinding, keyCode, layout) {
    layout[newBinding] = keyCode;
    document.getElementById(newBinding).innerHTML = keyCode ? keyCodes[keyCode] : "&zwnj;";
}

function bindingHandler(clickEvent, layout) {
    function setBinding(keyEvent) {
        if (!keyCodes[keyEvent.keyCode]) return;
    
        keyEvent.stopImmediatePropagation();
        const oldBinding = isUsed(clickEvent.target.id, keyEvent.keyCode, layout);
        if (oldBinding) {
            getConfirmation(clickEvent.target.id, keyEvent.keyCode, layout, oldBinding);
        } else {
            changeControls(clickEvent.target.id, keyEvent.keyCode, layout);
        }
        clickEvent.target.blur();
        document.removeEventListener("keydown", setBinding);
    }

    clickEvent.target.focus();
    clickEvent.stopImmediatePropagation();
    document.addEventListener("keydown", setBinding);
    document.addEventListener("click", _ => {
        document.removeEventListener("keydown", setBinding);
    });
}

function gameBindingHandler(event) {
    bindingHandler(event, gameControls);
}

function menuBindingHandler(event) {
    bindingHandler(event, menuControls);
}

function dialogBindingHandler(event) {
    bindingHandler(event, dialogControls);
}
