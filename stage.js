import { LIGHTMAP_PRECISION } from "./constants";

let stage = undefined;

export function reset() {
    if (stage) {
        if (stage.camera) {
            while(stage.camera.children.length > 0){ 
                removeMesh(stage.camera.children[0]); 
            }
        }
        resetScene();
    }

    stage = {
        width: window.innerWidth,
        height: window.innerHeight,
        renderer: new THREE.WebGLRenderer(),
        camera: new THREE.PerspectiveCamera(CONSTANTS.CAMERA_FOV, window.innerWidth / window.innerHeight, CONSTANTS.CAMERA_NEAR, CONSTANTS.CAMERA_FAR),
        scene: new THREE.Scene(),
        canvas: document.getElementById('canvas'),
        bufferCamera: undefined,
        bufferScene: undefined,
    };

    stage.renderer.setSize(stage.width, stage.height);
    //stage.scene.background = new THREE.Color( 0xffffff );
    stage.canvas.appendChild(renderer.domElement);

    stage.camera.add(SOUND.reset());
    MAP.reset();

    window.onresize = function resize() {
        stage.width = window.innerWidth;
        stage.height = window.innerHeight;
        stage.camera.aspect = stage.width / stage.height;
        stage.camera.updateProjectionMatrix();
        stage.renderer.setSize(stage.width, stage.height);

        if ((document.fullScreenElement && document.fullScreenElement !== null)
        || (document.mozFullScreen || document.webkitIsFullScreen)) {
            stage.canvas.style.cursor = "none";
        } else {
            stage.canvas.style.cursor = "auto";
        }
    }
}

export function moveCamera(x, y) {
    stage.camera.position.x -= x * CONSTANTS.CAMERA_SCROLLSPEED * stage.camera.position.z;
    stage.camera.position.y += y * CONSTANTS.CAMERA_SCROLLSPEED * stage.camera.position.z;
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
    if (!stage) return;
    if (!stage.scene) return;

    while(stage.scene.children.length > 0){ 
        removeMesh(stage.scene.children[0]); 
    }
    stage.scene.add(stage.camera);
    stage.camera.position.z = CONSTANTS.CAMERA_DIST;
}

function createBuffer(meshes, width, height) {
    stage.bufferCamera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
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

function renderBufferToTexture(width, height) {
    let bufferTexture = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
    stage.renderer.render(stage.bufferScene, stage.bufferCamera, stage.bufferTexture, true);
    return bufferTexture.texture;
}

export function renderToTexture(meshes, width, height) {
    createBuffer(meshes, width, height);
    const texture = renderBufferToTexture(width, height);
    deleteBuffer();
    return texture;
}
