import * as SCENE from "./scene.js";

let audioListener = undefined;
let audioLoader = undefined;
let volume = 0;
let music = undefined;

export let particleSound = undefined;
export let coinSound = undefined;
export let enemySound = undefined;

export function initialize() {
    audioListener = new THREE.AudioListener();
    audioListener.setMasterVolume(volume);
    SCENE.addToCamera(audioListener);

    music = new THREE.Audio(audioListener);
    audioLoader = new THREE.AudioLoader();
    
    audioLoader.load('assets/Erwachen.wav', function(buffer) {
        music.setBuffer(buffer);
        music.setLoop(true);
        music.play();
    });
    audioLoader.load('assets/ding01.wav', function(buffer) {
        particleSound = new THREE.Audio(audioListener);
        particleSound.setBuffer(buffer);
        particleSound.setVolume(0.1);
        coinSound = new THREE.Audio(audioListener);
        coinSound.setBuffer(buffer);
        coinSound.setVolume(0.1);
    });
    audioLoader.load('assets/ghost01.wav', function(buffer) {
        enemySound = new THREE.Audio(audioListener);
        enemySound.setBuffer(buffer);
    });
}

export function toggle() {
    if (volume !== 0) {
        volume = 0;
    } else {
        volume = 1;
    }
    audioListener.setMasterVolume(volume);
}
