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
        { ID: "transforming", url: "assets/transforming.ogg", volume: 1, loop: true, play: false, levelStop: true },
        { ID: "transform", url: "assets/transform.ogg", volume: 1, loop: false, play: false, levelStop: true },
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
        sound.isFading = false;
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

export function play(soundID, volume) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound");
        return;
    }

    if (volume || volume === 0) {
        audio.sounds[soundID].setVolume(volume);
    } else {
        audio.sounds[soundID].setVolume(1);
    }

    if (audio.sounds[soundID].isPlaying) {
        audio.sounds[soundID].stop();
    }
    audio.sounds[soundID].play();
}

export function repeat(soundID, volume) {
    if (!audio.sounds[soundID]) {
        console.log("Unknown sound");
        return;
    }

    if (volume || volume === 0) {
        audio.sounds[soundID].setVolume(volume);
        if (!audio.sounds[soundID].isPlaying) audio.sounds[soundID].play();
    } else {
        fadeIn(soundID, 100);
    }
}

export async function fadeIn(soundID, time) {
    if (audio.sounds[soundID].isPlaying) return;

    audio.sounds[soundID].play();
    audio.sounds[soundID].setVolume(0);

    function fade(volume) {
        setTimeout(() => {
            if (volume < 1) {
                fade(volume + 0.1);
                audio.sounds[soundID].setVolume(volume);
            }
        }, time / 10);
    }
    fade(0.1);
}

export async function fadeOutLevel(time) {
    const fades = [];

    for (let soundID of audio.soundIDs) {
        if (audio.sounds[soundID].levelStop
        && audio.sounds[soundID].isPlaying
        && !audio.sounds[soundID].isFading) {
            console.log(soundID, audio.sounds[soundID].isFading);
            audio.sounds[soundID].isFading = true;
            fades.push(soundID);
        }
    }

    function fade(volume) {
        setTimeout(() => {
            if (volume > 0) {
                fade(volume - 0.1);
            }

            for (let soundID of fades) {
                if (volume > 0) {
                    audio.sounds[soundID].setVolume(volume);
                } else {
                    audio.sounds[soundID].stop();
                    audio.sounds[soundID].isFading = false;
                }
            }
        }, time / 10);
    }
    fade(0.9);
}

export async function fadeOut(soundID, time) {
    if (!audio.sounds[soundID].isPlaying
    || audio.sounds[soundID].isFading) {
        return;
    }

    audio.sounds[soundID].isFading = true;

    function fade(volume) {
        setTimeout(() => {
            if (volume > 0) {
                fade(volume - 0.1);
                audio.sounds[soundID].setVolume(volume);
            } else {
                audio.sounds[soundID].stop();
                audio.sounds[soundID].isFading = false;
            }
        }, time / 10);
    }
    fade(0.9);
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
