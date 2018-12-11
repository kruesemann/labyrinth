let levelDisplay = undefined;

export function initialize() {
    levelDisplay = document.getElementById('level');
}

export function setLevel(level) {
    levelDisplay.innerHTML = `Level ${level}`;
}
