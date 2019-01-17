import * as STAGE from "./stage.js";

let audio = undefined;

export function reset() {
    audio = {
        listener: new THREE.AudioListener(),
        loader: new THREE.AudioLoader(),
        masterVolume: 1,
        sounds: {},
    }
    
    audio.listener.setMasterVolume(masterVolume);

    new Event("soundReady");

    const soundsData = [
        { id: "music", url: "assets/Erwachen.wav", volume: 0, loop: true, play: true },
        { id: "charging", url: "assets/charging.wav", volume: 1, loop: true, play: false },
        { id: "particle", url: "assets/ding01.wav", volume: 1, loop: false, play: false },
        { id: "coin", url: "assets/ding01.wav", volume: 0.1, loop: false, play: false },
        { id: "charge", url: "assets/ghost01.wav", volume: 1, loop: false, play: false },
        { id: "idle", url: "assets/ghost01.wav", volume: 0.1, loop: false, play: false },
    ];
    
    loadSounds(soundsData, 0);

    return audio.listener;
}

function loadSounds(soundsData, i) {
    audio.loader.load(soundsData[i].url, function(buffer) {
        const sound = new THREE.Audio(audio.listener);
        sound.setBuffer(buffer);
        sound.setVolume(soundsData[i].volume);
        sound.setLoop(soundsData[i].loop);
        audio.sounds[soundsData[i].id] = sound;
        if (soundsData[i].play) sound.play();
        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            document.dispatchEvent("soundReady");
        }
    });
}

export function play(sound, volume) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume) {
        audio.sounds[sound].setVolume(1);
    }

    if (audio.sounds[sound].isPlaying) {
        audio.sounds[sound].stop();
    }
    audio.sounds[sound].play();
}

export function repeat(sound, volume) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume) {
        audio.sounds[sound].setVolume(1);
    }

    if (!audio.sounds[sound].isPlaying) audio.sounds[sound].play();
}

export function setVolume(sound, volume) {
    if (volume !== 0) {
        audio.sounds[sound].setVolume(volume);
        return true;
    }
    
    audio.sounds[sound].stop();
    return false;
}

export function toggle() {
    if (audio.masterVolume !== 0) {
        audio.masterVolume = 0;
    } else {
        audio.masterVolume = 1;
    }
    audioListener.setMasterVolume(audio.masterVolume);

    return audio.masterVolume === 1;
}
