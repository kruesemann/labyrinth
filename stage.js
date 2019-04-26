import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as HINT from "./hint.js";
import * as INPUT from "./input.js";
import * as INVENTORY from "./inventory.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as SHADER from "./shader.js";
import * as SOUND from "./sound.js";

let stage = undefined;

export function reset() {
    if (stage) {
        if (stage.camera) {
            while(stage.camera.children.length > 0){ 
                stage.camera.remove(stage.camera.children[0]); 
            }
        }
        if (stage.scene) {
            while(stage.scene.children.length > 0){ 
                removeMesh(stage.scene.children[0]); 
            }
        }
    }
    
    stage = {
        width: 0,
        height: 0,
        renderer: undefined,
        canvas: undefined,
        camera: undefined,
        scene: undefined,
        bufferCamera: undefined,
        bufferScene: undefined,
    };

    SOUND.fadeOutLevel();
    MAP.reset();
    LIGHT.reset();
    ANIMATION.reset();
    SHADER.reset();
    INVENTORY.reset();
    HINT.reset();
}

export function initialize() {
    stage = {
        width: window.innerWidth,
        height: window.innerHeight,
        renderer: new THREE.WebGLRenderer(),
        canvas: document.getElementById("canvas"),
        camera: new THREE.PerspectiveCamera(CONSTANTS.CAMERA_FOV, window.innerWidth / window.innerHeight, CONSTANTS.CAMERA_NEAR, CONSTANTS.CAMERA_FAR),
        scene: new THREE.Scene(),
        bufferCamera: undefined,
        bufferScene: undefined,
    };

    stage.renderer.setSize(stage.width, stage.height);
    stage.canvas.appendChild(stage.renderer.domElement);

    stage.camera.add(SOUND.getAudioListener());
    stage.camera.position.z = CONSTANTS.CAMERA_DIST;

    stage.scene.add(stage.camera);

    window.onresize = function resize() {
        stage.width = window.innerWidth;
        stage.height = window.innerHeight;
        stage.renderer.setSize(stage.width, stage.height);
        stage.camera.aspect = stage.width / stage.height;
        stage.camera.updateProjectionMatrix();

        if (INPUT.isFullscreenOn()) {
            stage.canvas.style.cursor = "none";
        } else {
            stage.canvas.style.cursor = "auto";
        }
    }

    SHADER.initialize();
    LIGHT.initialize({x: 200, y: 200});
}

export function lookAt(x, y) {
    stage.camera.position.x = x;
    stage.camera.position.y = y;
    stage.camera.lookAt(x, y, 0);
}

export function zoom(delta) {
    stage.camera.position.z -= 10 * delta;
    if (stage.camera.position.z < 10) {
        stage.camera.position.z = 10;
    } else if (stage.camera.position.z > 1000) {
        stage.camera.position.z = 1000;
    }
}

export function render() {
	stage.renderer.render(stage.scene, stage.camera);
}

export function addMesh(mesh) {
    stage.scene.add(mesh);
}

export function removeMesh(mesh) {
    stage.scene.remove(mesh);
}

export function resetScene() {
    SOUND.fadeOutLevel();
    ANIMATION.stopAllRunning();
    INVENTORY.levelReset();
    HINT.reset();
    while(stage.scene.children.length > 0){ 
        removeMesh(stage.scene.children[0]); 
    }
    stage.scene.add(stage.camera);
}

function createBuffer(meshes, dimensions) {
    stage.bufferCamera = new THREE.PerspectiveCamera(45, dimensions.x / dimensions.y, 1, 1000);
    stage.bufferScene = new THREE.Scene();
    stage.bufferScene.add(stage.bufferCamera);

    for (let mesh of meshes) {
        stage.bufferScene.add(mesh);
    }
}

function deleteBuffer() {
    while(stage.bufferScene.children.length > 0){ 
        stage.bufferScene.remove(stage.bufferScene.children[0]); 
    }
    stage.bufferCamera = undefined;
    stage.bufferScene = undefined;
}

function renderBufferToTexture(dimensions) {
    const target = new THREE.WebGLRenderTarget(dimensions.x, dimensions.y, {minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
    stage.renderer.render(stage.bufferScene, stage.bufferCamera, target, true);
    return target.texture;
}

export function renderToTexture(meshes, dimensions) {
    createBuffer(meshes, dimensions);
    const texture = renderBufferToTexture(dimensions);
    deleteBuffer();
    return texture;
}
