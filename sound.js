import * as EVENT from "./event.js";

let audio = undefined;

export function reset() {
    audio = {
        listener: new THREE.AudioListener(),
        loader: new THREE.AudioLoader(),
        masterVolume: 1,
        sounds: {},
        soundIDs: [],
    }
    
    audio.listener.setMasterVolume(audio.masterVolume);

    const soundsData = [
        { ID: "charging", url: "assets/charging.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "particle", url: "assets/particle.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "coin", url: "assets/coin.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "charge", url: "assets/charge.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "idle", url: "assets/idle.ogg", volume: 1, loop: false, play: false, levelStop: true },
        { ID: "ambient01", url: "assets/ambient01.ogg", volume: 1, loop: true, play: false, levelStop: true },
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
        sound.levelStop = soundsData[i].levelStop;
        if (soundsData[i].play) sound.play();

        audio.sounds[soundsData[i].ID] = sound;
        audio.soundIDs.push(soundsData[i].ID);

        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            EVENT.trigger("soundReady");
        }
    }, _ => {}, function(_) {
        console.log(soundsData[i].url + " not found");

        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            EVENT.trigger("soundReady");
        }
    });
}

export function play(sound, volume) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume || volume === 0) {
        audio.sounds[sound].setVolume(volume);
    } else {
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

    if (volume || volume === 0) {
        audio.sounds[sound].setVolume(volume);
    } else {
        audio.sounds[sound].setVolume(1);
    }

    if (!audio.sounds[sound].isPlaying) audio.sounds[sound].play();
}

export function setVolume(sound, volume) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    if (volume !== 0) {
        audio.sounds[sound].setVolume(volume);
        return true;
    }
    
    audio.sounds[sound].stop();
    return false;
}

export function stopLevelSounds(volume) {
    for (let sound of audio.soundIDs) {
        if (audio.sounds[sound].levelStop){
            if (audio.sounds[sound].isPlaying) {
                if (volume !== 0) {
                    audio.sounds[sound].setVolume(volume);
                } else {
                    audio.sounds[sound].stop();
                }
            }
        }
    }
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
