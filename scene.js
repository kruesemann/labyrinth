import * as SHADER from "./shader.js";

const cameraDist = 50;

let WIDTH = undefined;
let HEIGHT = undefined;
let VIEW_ANGLE = undefined;
let ASPECT = undefined;
let NEAR = undefined;
let FAR = undefined;
let scrollSpeed = undefined;

let renderer = undefined;
let camera = undefined;
let scene = undefined;

let canvas = undefined;

export function initialize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    VIEW_ANGLE = 45;
    ASPECT = WIDTH / HEIGHT;
    NEAR = 1;
    FAR = 1000;
    scrollSpeed = 0.001;

    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene = new THREE.Scene();

    renderer.setSize(WIDTH, HEIGHT);
    canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);

    SHADER.mapUniforms.u_dimensions.value = [WIDTH, HEIGHT];

    window.onresize = function resize() {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
        ASPECT = WIDTH / HEIGHT;
        camera.aspect = ASPECT;
        camera.updateProjectionMatrix();
        renderer.setSize(WIDTH, HEIGHT);
        
        SHADER.mapUniforms.u_dimensions.value = [WIDTH, HEIGHT];
    }
}

export function moveCamera(x, y) {
    camera.position.x -= x * scrollSpeed * camera.position.z;
    camera.position.y += y * scrollSpeed * camera.position.z;
}

export function lookAt(x, y) {
    camera.position.x = x;
    camera.position.y = y;
    camera.lookAt(x, y, 0);
}

export function zoom(delta) {
    camera.position.z -= 10 * delta;
    if (camera.position.z < 10) {
        camera.position.z = 10;
    } else if (camera.position.z > 1000) {
        camera.position.z = 1000;
    }
}

export function render() {
	renderer.render(scene, camera);
}

export function addMesh(mesh) {
    scene.add(mesh);
}

export function removeMesh(mesh) {
    scene.remove(mesh);
    //disposeHierarchy (mesh, disposeNode);
}

export function reset() {
    while(scene.children.length > 0){ 
        removeMesh(scene.children[0]); 
    }
    scene.add(camera);
    camera.position.z = cameraDist;
}
