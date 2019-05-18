import * as DIALOG from "./dialog.js";
import * as GAME from "./game.js";
import * as HINT from "./hint.js";
import * as INPUT from "./input.js";
import * as SHADER from "./shader.js";

const light = {
    mesh: undefined,
    renderer: new THREE.WebGLRenderer({alpha: true}),
    camera: new THREE.PerspectiveCamera(45, 1, 1, 100),
    scene: new THREE.Scene(),
    size: {x: 100, y: 100},
    color: [0, 0, 0, 0],
    center: [50, 50]
};
light.camera.position.z = 10;
light.scene.add(light.camera);
light.renderer.setSize(light.size.x, light.size.y);
document.getElementById("status-light").appendChild(light.renderer.domElement);
SHADER.luminosityUniforms.u_center.value = new Float32Array(light.center);

export function reset() {
    document.getElementById("screen-game").style.display = "none";

    setDialogText("");
    setDialogButtons([]);
    setActiveItem();
    setSeed(0);
    setLevel(0);
    setScore(0);
    setForm("dot");
    setLoadingProgressVolume(0);
    setLight([0, 0, 0, 0]);
    light.mesh = undefined;

    DIALOG.reset();
}

export function initialize(seed, level, score) {
    document.getElementById("screen-loading").style.display = "none";
    document.getElementById("screen-game").style.display = "block";

    setSeed(seed);
    setLevel(level);
    setScore(score);
    setForm("dot");
    initializeLight();
}

export function levelReset() {
    light.scene.add(light.mesh);
}

export function render(counter) {
    if (counter % 200 === 0) {
        light.center = [light.size.x / 2 + Math.random() * 8 - 4, light.size.y / 2 + Math.random() * 16 - 8];
    }
    if (counter % 20 === 0) {
        SHADER.luminosityUniforms.u_center.value[0] += SHADER.luminosityUniforms.u_center.value[0] < light.center[0] ? 0.5 : -0.5;
        SHADER.luminosityUniforms.u_center.value[1] += SHADER.luminosityUniforms.u_center.value[1] < light.center[1] ? 0.5 : -0.5;
    }

    if (counter % 8 === 0) {
        SHADER.luminosityUniforms.u_color.value[3] = light.color[3] + Math.random() - 0.5;
        light.renderer.render(light.scene, light.camera);
    }
    SHADER.luminosityUniforms.u_time.value = (Date.now() / 1000) % 1000000;
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

function initializeLight() {
    setLight([0, 0, 0, 0]);

    SHADER.luminosityUniforms.u_texture.value = new THREE.TextureLoader().load("assets/luminosity.png");
    SHADER.luminosityUniforms.u_texture.value.magFilter = THREE.NearestFilter;
    SHADER.luminosityUniforms.u_texture.value.minFilter = THREE.NearestFilter;

    const vertices = [
        -1, -1, 0,
         1, -1, 0,
        -1,  1, 0,
         1, -1, 0,
         1,  1, 0,
        -1,  1, 0,
    ];

    const texelCoords = [
        0, 0,
        1, 0,
        0, 1,
        1, 0,
        1, 1,
        0, 1,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array(texelCoords), 2));

    light.mesh = new THREE.Mesh(geometry, SHADER.getLuminosityMaterial());
}

export function setLight(color) {
    light.color = color;
    SHADER.luminosityUniforms.u_color.value = new Float32Array(color);
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
    if (counter % 100 !== 0) return;

    if (HINT.isPlayerNearHint()) {
        document.getElementById("status-help").style.opacity = 1;
    } else {
        document.getElementById("status-help").style.opacity = 0;
    }
}

export function setActiveItem(item) {
    if (!item) {
        document.getElementById("status-item-text").innerHTML = "";
        return;
    }
    document.getElementById("status-item-text").innerHTML = item.name + " [" + item.number + "]";
}
