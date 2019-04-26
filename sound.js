import * as PLAYER from "./player.js";

let audio = {
    listener: undefined,
    loader: undefined,
    masterVolume: 1,
    sounds: {},
    soundIDs: [],
};

export function initialize() {
    audio = {
        listener: new THREE.AudioListener(),
        loader: new THREE.AudioLoader(),
        masterVolume: 1,
        sounds: {},
        soundIDs: [],
    }
    
    audio.listener.setMasterVolume(audio.masterVolume);

    const soundsData = [
        /*{ ID: "music1", url: "assets/music1.ogg", volume: 0.25, loop: true, play: true, levelStop: false },
        { ID: "transforming", url: "assets/transforming.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "transform", url: "assets/transform.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "charging", url: "assets/charging.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "particle", url: "assets/particle.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "coin", url: "assets/coin.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "charge", url: "assets/charge.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "idle", url: "assets/idle.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "shrine", url: "assets/shrine.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "hurt", url: "assets/hurt.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "wisp1", url: "assets/wisp1.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "wisp2", url: "assets/wisp2.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "beacon1", url: "assets/beacon1.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "beacon2", url: "assets/beacon2.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "flare", url: "assets/flare.ogg", volume: 1, loop: false, play: false, levelStop: true },*/
        { ID: "hintlight", url: "assets/hintlight.ogg", volume: 1, loop: false, play: false, levelStop: true },
    ];
    
    loadSounds(soundsData, 0);
}

export function getAudioListener() {
    return audio.listener;
}

function loadSounds(soundsData, i) {
    audio.loader.load(soundsData[i].url, function(buffer) {
        const sound = new THREE.Audio(audio.listener);
        sound.setBuffer(buffer);
        if (soundsData[i].play) {
            sound.play();
            sound.volume = soundsData[i].volume;
            sound.setVolume(soundsData[i].volume);
        } else {
            sound.volume = 0;
            sound.setVolume(0);
        }
        sound.targetVolume = 0;
        sound.targetVolumePriority = 0;
        sound.targetVolumeStep = 0;
        sound.setLoop(soundsData[i].loop);
        sound.levelStop = soundsData[i].levelStop;

        audio.sounds[soundsData[i].ID] = sound;
        audio.soundIDs.push(soundsData[i].ID);

        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            document.dispatchEvent(new Event("soundReady"));
        }
    }, _ => {}, function(_) {
        console.log(soundsData[i].url + " not found");

        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            document.dispatchEvent(new Event("soundReady"));
        }
    });
}

function getVolume(position, maxDist) {
    if (!position) {
        return 1;
    }
    const { x, y } = PLAYER.getCenter();
    return Math.max(0, (maxDist - Math.hypot(position.x - x, position.y - y)) / maxDist);
}

export function play(soundID, tryOnly, position, maxDist) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound:", soundID);
        return;
    }

    if (tryOnly && audio.sounds[soundID].isPlaying) return;

    const volume = getVolume(position, maxDist);
    if (volume !== 0) {
        if (audio.sounds[soundID].isPlaying) {
            audio.sounds[soundID].stop();
        }
        audio.sounds[soundID].setVolume(volume);
        audio.sounds[soundID].volume = volume;
        audio.sounds[soundID].play();
    }
}

export function loop(soundID, time, position, maxDist) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound:", soundID);
        return;
    }

    const volume = getVolume(position, maxDist);
    if (audio.sounds[soundID].targetVolumePriority < 2) {
        audio.sounds[soundID].targetVolume = volume;
        audio.sounds[soundID].targetVolumePriority = 2;
        audio.sounds[soundID].targetVolumeStep = 10 / time;
    }
}

export function forceFadeOut(soundID, time) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound:", soundID);
        return;
    }

    if (audio.sounds[soundID].targetVolumePriority < 3) {
        audio.sounds[soundID].targetVolume = 0;
        audio.sounds[soundID].targetVolumePriority = 3;
        audio.sounds[soundID].targetVolumeStep = 10 / time;
    }
}

export function fadeOut(soundID, time) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound:", soundID);
        return;
    }

    if (audio.sounds[soundID].targetVolumePriority < 1) {
        audio.sounds[soundID].targetVolume = 0;
        audio.sounds[soundID].targetVolumePriority = 1;
        audio.sounds[soundID].targetVolumeStep = 10 / time;
    } else {
        setTimeout(function(){
            if (audio.sounds[soundID].targetVolumePriority < 1) {
                audio.sounds[soundID].targetVolume = 0;
                audio.sounds[soundID].targetVolumePriority = 1;
                audio.sounds[soundID].targetVolumeStep = 10 / time;
            }
        }, 500);
    }
}

export function fadeOutLevel() {
    for (let soundID of audio.soundIDs) {
        if (!audio.sounds[soundID]
        || !audio.sounds[soundID].levelStop
        || !audio.sounds[soundID].getLoop()) continue;

        audio.sounds[soundID].targetVolume = 0;
        audio.sounds[soundID].targetVolumePriority = 4;
        audio.sounds[soundID].targetVolumeStep = 0.01;
    }
}

export function controlVolume(counter) {
    if (counter % 10 !== 0) return;

    for (let soundID of audio.soundIDs) {
        if (audio.sounds[soundID].targetVolumePriority === 0) continue;

        const targetVolume = audio.sounds[soundID].targetVolume;
        const currentVolume = audio.sounds[soundID].volume;
        if (targetVolume < currentVolume) {
            if (targetVolume < currentVolume - audio.sounds[soundID].targetVolumeStep) {
                audio.sounds[soundID].volume -= audio.sounds[soundID].targetVolumeStep;
            } else {
                audio.sounds[soundID].volume = targetVolume;
                audio.sounds[soundID].targetVolumePriority = 0;
            }
        } else if (targetVolume > currentVolume) {
            if (targetVolume > currentVolume + audio.sounds[soundID].targetVolumeStep) {
                audio.sounds[soundID].volume += audio.sounds[soundID].targetVolumeStep;
            } else {
                audio.sounds[soundID].volume = targetVolume;
                audio.sounds[soundID].targetVolumePriority = 0;
            }
        } else {
            audio.sounds[soundID].targetVolumePriority = 0;
        }
        audio.sounds[soundID].setVolume(audio.sounds[soundID].volume);

        if (audio.sounds[soundID].isPlaying) {
            if (audio.sounds[soundID].volume === 0) {
                audio.sounds[soundID].stop();
            }
        } else {
            if (audio.sounds[soundID].volume !== 0) {
                audio.sounds[soundID].play();
            }
        }
    }
}

export function getMasterVolume() {
    return audio.masterVolume;
}

export function setMasterVolume(value) {
    audio.masterVolume = value;
    audio.listener.setMasterVolume(audio.masterVolume);
}

export function toggle() {
    if (audio.masterVolume !== 0) {
        audio.masterVolume = 0;
    } else {
        audio.masterVolume = 1;
    }
    audio.listener.setMasterVolume(audio.masterVolume);

    return audio.masterVolume === 1;
}
