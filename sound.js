import * as SCENE from "./scene.js";

let audioListener = undefined;
let audioLoader = undefined;
let masterVolume = 1;

const sounds = {};

export function initialize() {
    audioListener = new THREE.AudioListener();
    audioListener.setMasterVolume(masterVolume);
    SCENE.addToCamera(audioListener);
    audioLoader = new THREE.AudioLoader();

    const soundsData = [
        { id: "music", url: "assets/Erwachen.wav", volume: 0, loop: true, play: true },
        { id: "charging", url: "assets/charging.wav", volume: 1, loop: true, play: false },
        { id: "particle", url: "assets/ding01.wav", volume: 1, loop: false, play: false },
        { id: "coin", url: "assets/ding01.wav", volume: 0.1, loop: false, play: false },
        { id: "charge", url: "assets/ghost01.wav", volume: 1, loop: false, play: false },
        { id: "idle", url: "assets/ghost01.wav", volume: 0.1, loop: false, play: false },
    ];
    
    loadSounds(soundsData, 0);
}

function loadSounds(soundsData, i) {
    if (i < soundsData.length) {
        audioLoader.load(soundsData[i].url, function(buffer) {
            const sound = new THREE.Audio(audioListener);
            sound.setBuffer(buffer);
            sound.setVolume(soundsData[i].volume);
            sound.setLoop(soundsData[i].loop);
            sounds[soundsData[i].id] = sound;
            if (soundsData[i].play) sound.play();
            loadSounds(soundsData, i + 1);
        });
    }
}

export function play(sound, volume) {
    if (!sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume) {
        sounds[sound].setVolume(1);
    }

    if (sounds[sound].isPlaying) {
        sounds[sound].stop();
    }
    sounds[sound].play();
}

export function repeat(sound, volume) {
    if (!sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume) {
        sounds[sound].setVolume(1);
    }

    if (!sounds[sound].isPlaying) sounds[sound].play();
}

export function setVolume(sound, volume) {
    if (volume !== 0) {
        sounds[sound].setVolume(volume);
        return true;
    }
    
    sounds[sound].stop();
    return false;
}

export function toggle() {
    if (masterVolume !== 0) {
        masterVolume = 0;
    } else {
        masterVolume = 1;
    }
    audioListener.setMasterVolume(masterVolume);

    return masterVolume === 1;
}
