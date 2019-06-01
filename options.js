const buttonCodes = {
    0: "LEFT MOUSE",
    1: "MIDDLE MOUSE",
    2: "RIGHT MOUSE",
    3: "MOUSE 4",
    4: "MOUSE 5",
};

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
        gLeft:      {code:  65, key: true}, // a
        gUp:        {code:  87, key: true}, // w
        gRight:     {code:  68, key: true}, // d
        gDown:      {code:  83, key: true}, // s
        browse:     {code:   9, key: true}, // tab
        menu:       {code:  27, key: true}, // esc
        transform:  {code:  32, key: true}, // space
        gSkip:      {code: 190, key: true}, // .
        gStop:      {code:  88, key: true}, // x
        particle:   {code:  69, key: true}, // e
        flare:      {code:  70, key: true}, // f
        hint:       {code:  81, key: true}, // q
        useItem:    {code:  82, key: true}, // r
        pause:      {code:  80, key: true}, // p
    };
    
    menuControls = {
        mLeft:      {code:   37, key: true}, // left
        mUp:        {code:   38, key: true}, // up
        mRight:     {code:   39, key: true}, // right
        mDown:      {code:   40, key: true}, // down
        mEnter:     {code:   13, key: true}, // enter
        mBack:      {code:   27, key: true}, // esc
    };
    
    dialogControls = {
        dLeft:      {code:   37, key: true}, // left
        dUp:        {code:   38, key: true}, // up
        dRight:     {code:   39, key: true}, // right
        dDown:      {code:   40, key: true}, // down
        dEnter:     {code:   13, key: true}, // enter
        dSkip:      {code:  190, key: true}, // .
        dStop:      {code:   88, key: true}, // x
    };

    for (const key in gameControls) {
        if (!gameControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = translateBinding(gameControls[key]);
        document.getElementById(key).addEventListener("click", gameBindingHandler);
    }

    for (const key in menuControls) {
        if (!menuControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = translateBinding(menuControls[key]);
        document.getElementById(key).addEventListener("click", menuBindingHandler);
    }

    for (const key in dialogControls) {
        if (!dialogControls.hasOwnProperty(key)) continue;
        document.getElementById(key).innerHTML = translateBinding(dialogControls[key]);
        document.getElementById(key).addEventListener("click", dialogBindingHandler);
    }
}

export function translateBinding(binding) {
    return binding.key ? keyCodes[binding.code] : buttonCodes[binding.code];
}

function isUsed(newBindingKey, newBindingValue, layout) {
    for (const key in layout) {
        if (!layout.hasOwnProperty(key) || key === newBindingKey) continue;
        if (layout[key].code === newBindingValue) return key;
    }
    return undefined;
}

function getConfirmation(newBindingKey, newBindingValue, layout, oldBindingKey) {
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
        changeControls(newBindingKey, newBindingValue, layout);
        changeControls(oldBindingKey, undefined, layout);
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

function changeControls(newBindingKey, newBindingValue, layout) {
    layout[newBindingKey] = newBindingValue;
    document.getElementById(newBindingKey).innerHTML = newBindingValue ? translateBinding(newBindingValue) : "&zwnj;";
}

function bindingHandler(clickEvent, layout) {
    document.getElementById("screen-menu").style.pointerEvents = "none";
    document.getElementById("screen-window").style.display = "block";
    document.getElementById("window-text").innerHTML = "Please press a key or mouse button to change the binding.";

    const windowButtons = document.getElementById("window-buttons");
    const cancelButton = document.createElement("BUTTON");
    cancelButton.classList.add("input-h");
    cancelButton.classList.add("button");
    cancelButton.innerHTML = "Cancel";

    cancelButton.addEventListener("click", event => {
        event.stopPropagation();
        document.getElementById("screen-menu").style.pointerEvents = "auto";
        document.getElementById("screen-window").style.display = "none";
        clickEvent.target.blur();
        windowButtons.removeChild(cancelButton);
    });

    windowButtons.appendChild(cancelButton);

    function setBinding(event) {
        let newBindingValue;
        if ("keyCode" in event) {
            if (!keyCodes[event.keyCode]) return;
            newBindingValue = {code: event.keyCode, key: true};
        } else if ("button" in event) {
            if (!buttonCodes[event.button]) return;
            newBindingValue = {code: event.button, key: false};
        } else {
            return;
        }

        document.getElementById("screen-menu").style.pointerEvents = "auto";
        document.getElementById("screen-window").style.display = "none";
        windowButtons.removeChild(cancelButton);

        event.stopPropagation();
        event.preventDefault();

        const oldBindingKey = isUsed(clickEvent.target.id, newBindingValue, layout);
        if (oldBindingKey) {
            getConfirmation(clickEvent.target.id, newBindingValue, layout, oldBindingKey);
        } else {
            changeControls(clickEvent.target.id, newBindingValue, layout);
        }

        clickEvent.target.blur();
        document.removeEventListener("keydown", setBinding);
        document.removeEventListener("click", setBinding);
    }

    clickEvent.target.focus();

    clickEvent.stopPropagation();
    document.addEventListener("keydown", setBinding);
    document.addEventListener("click", setBinding);
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
