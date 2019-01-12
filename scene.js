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
let bufferCamera = undefined;
let bufferScene = undefined;

let canvas = undefined;

let listener = undefined;
let sound = undefined;
let audioLoader = undefined;

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
    //scene.background = new THREE.Color( 0xffffff );
    canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);

    listener = new THREE.AudioListener();
    camera.add( listener );

    sound = new THREE.Audio( listener );
    audioLoader = new THREE.AudioLoader();
    
    /*audioLoader.load( 'assets/Erwachen.wav', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
        sound.play();
    });*/

    window.onresize = function resize() {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
        ASPECT = WIDTH / HEIGHT;
        camera.aspect = ASPECT;
        camera.updateProjectionMatrix();
        renderer.setSize(WIDTH, HEIGHT);
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
}

export function reset() {
    while(scene.children.length > 0){ 
        removeMesh(scene.children[0]); 
    }
    scene.add(camera);
    camera.position.z = cameraDist;
}

export function createBuffer(meshes, width, height) {
    bufferCamera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    bufferScene = new THREE.Scene();
    bufferScene.add(bufferCamera);

    for (let mesh of meshes) {
        bufferScene.add(mesh);
    }
}

export function deleteBuffer() {
    while(bufferScene.children.length > 0){ 
        bufferScene.remove(bufferScene.children[0]); 
    }
    bufferCamera = undefined;
    bufferScene = undefined;
}

export function renderBufferToTexture(width, height) {
    let bufferTexture = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
    renderer.render(bufferScene, bufferCamera, bufferTexture, true);
    return bufferTexture.texture;
}
