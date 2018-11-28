let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
let VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 1, FAR = 1000;
let scrollSpeed = 0.001;

let renderer = new THREE.WebGLRenderer();
let camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
let scene = new THREE.Scene();

renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);
scene.add(camera);
camera.position.z = 50;

window.onresize = function resize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    ASPECT = WIDTH / HEIGHT;
    camera.aspect = ASPECT;
    camera.updateProjectionMatrix();
    renderer.setSize(WIDTH, HEIGHT);
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
}
