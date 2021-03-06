import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as HINT from "./hint.js";
import * as INPUT from "./input.js";
import * as INVENTORY from "./inventory.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as OVERLAY from "./overlay.js";
import * as SOUND from "./sound.js";

const renderer = new THREE.WebGLRenderer();
const canvas = document.getElementById("canvas");

renderer.setSize(window.innerWidth, window.innerHeight);
canvas.appendChild(renderer.domElement);

let stage = {
    width: 0,
    height: 0,
    camera: undefined,
    scene: undefined,
    bufferCamera: undefined,
    bufferScene: undefined,
    rendering : false,
    counter: 0,
};

export function reset() {
    SOUND.fadeOutLevel();
    ANIMATION.reset();
    LIGHT.reset();
    MAP.reset();
    INVENTORY.reset();
    HINT.reset();

    if (stage) {
        if (stage.camera) {
            while(stage.camera.children.length > 0) {
                stage.camera.remove(stage.camera.children[0]); 
            }
        }
        if (stage.scene) {
            while(stage.scene.children.length > 0) {
                removeMesh(stage.scene.children[0]); 
            }
        }
    }
    
    stage = {
        width: 0,
        height: 0,
        camera: undefined,
        scene: undefined,
        bufferCamera: undefined,
        bufferScene: undefined,
        rendering : false,
        counter: 0,
    };
}

export function initialize() {
    stage = {
        width: window.innerWidth,
        height: window.innerHeight,
        camera: new THREE.PerspectiveCamera(CONSTANTS.CAMERA_FOV, window.innerWidth / window.innerHeight, CONSTANTS.CAMERA_NEAR, CONSTANTS.CAMERA_FAR),
        scene: new THREE.Scene(),
        bufferCamera: undefined,
        bufferScene: undefined,
        rendering : false,
        counter: 0,
    };

    stage.camera.add(SOUND.getAudioListener());
    stage.camera.position.z = CONSTANTS.CAMERA_DIST;

    const height = CONSTANTS.CAMERA_DIST * Math.tan(CONSTANTS.CAMERA_FOV * Math.PI / 180);
    stage.camera.screenWorldDimensions = {
        x: Math.ceil(height * stage.camera.aspect),
        y: Math.ceil(height)
    };

    window.onresize = function resize() {
        if (!stage.camera) return;
        
        stage.width = window.innerWidth;
        stage.height = window.innerHeight;
        renderer.setSize(stage.width, stage.height);
        stage.camera.aspect = stage.width / stage.height;
        stage.camera.updateProjectionMatrix();

        if (INPUT.isFullscreenOn()) {
            canvas.style.cursor = "none";
        } else {
            canvas.style.cursor = "auto";
        }
        render();
    }

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

    const height = stage.camera.position.z * Math.tan(CONSTANTS.CAMERA_FOV * Math.PI / 180);
    stage.camera.screenWorldDimensions = {
        x: Math.ceil(height * stage.camera.aspect),
        y: Math.ceil(height)
    };

    MAP.reinitializeMesh();
    LIGHT.initialize({x: 200, y: 200});
}

export function startRendering() {
    stage.rendering = true;
}

export function stopRendering() {
    stage.rendering = false;
}

function render() {
    requestAnimationFrame(render);
    if (!stage.rendering) return;

    if (stage.counter === CONSTANTS.MAX_COUNTER) {
        stage.counter = 0;
    } else {
        ++stage.counter;
    }

    MAP.ambientSound(stage.counter);
    ANIMATION.animate();
    OVERLAY.render(stage.counter);
    OVERLAY.updateStatus(stage.counter);
    LIGHT.renderLighting(stage.counter);
	renderer.render(stage.scene, stage.camera);
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
    while(stage.scene.children.length > 0) {
        removeMesh(stage.scene.children[0]); 
    }
    stage.scene.add(stage.camera);
}

function createBuffer(meshes, dimensions) {
    stage.bufferCamera = new THREE.PerspectiveCamera(45, dimensions.x / dimensions.y, 1, 1000);
    stage.bufferScene = new THREE.Scene();
    stage.bufferScene.add(stage.bufferCamera);

    for (const mesh of meshes) {
        stage.bufferScene.add(mesh);
    }
}

function deleteBuffer() {
    while(stage.bufferScene.children.length > 0) {
        stage.bufferScene.remove(stage.bufferScene.children[0]); 
    }
    stage.bufferCamera = undefined;
    stage.bufferScene = undefined;
}

function renderBufferToTexture(dimensions) {
    const target = new THREE.WebGLRenderTarget(dimensions.x, dimensions.y, {minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
    renderer.render(stage.bufferScene, stage.bufferCamera, target, true);
    return target.texture;
}

export function renderToTexture(meshes, dimensions) {
    createBuffer(meshes, dimensions);
    const texture = renderBufferToTexture(dimensions);
    deleteBuffer();
    return texture;
}

export function getScreenWorldDimensions() {
    return stage.camera.screenWorldDimensions;
}

export function screenToCoords(screenPos) {
    let vec = new THREE.Vector3(
        (screenPos.x / stage.width) * 2 - 1,
        1 - (screenPos.y / stage.height) * 2,
        0.5
    );
    let pos = new THREE.Vector3();

    vec.unproject(stage.camera);
    vec.sub(stage.camera.position).normalize();
    const distance = - stage.camera.position.z / vec.z;

    pos.copy(stage.camera.position).add(vec.multiplyScalar(distance));

    return {x: pos.x, y: pos.y};
}

requestAnimationFrame(render);
