let audio = undefined;
const readyEvent = new Event("soundReady");

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
        { id: "music", url: "assets/Erwachen.wav", volume: 0, loop: true, play: true, levelStop: false },
        { id: "charging", url: "assets/charging.wav", volume: 1, loop: true, play: false, levelStop: true },
        { id: "particle", url: "assets/ding01.wav", volume: 1, loop: false, play: false, levelStop: true },
        { id: "coin", url: "assets/ding01.wav", volume: 1, loop: false, play: false, levelStop: true },
        { id: "charge", url: "assets/ghost01.wav", volume: 1, loop: false, play: false, levelStop: true },
        { id: "idle", url: "assets/ghost01.wav", volume: 1, loop: false, play: false, levelStop: true },
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
        audio.sounds[soundsData[i].id] = sound;
        audio.soundIDs.push(soundsData[i].id);
        if (soundsData[i].play) sound.play();
        if (i < soundsData.length - 1) {
            loadSounds(soundsData, i + 1);
        } else {
            document.dispatchEvent(readyEvent);
        }
    });
}

export function play(sound) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    audio.sounds[sound].setVolume(1);

    if (audio.sounds[sound].isPlaying) {
        audio.sounds[sound].stop();
    }
    audio.sounds[sound].play();
}

export function repeat(sound) {
    if (!audio.sounds[sound]) {
        console.log("Unknown sound");
        return;
    }

    audio.sounds[sound].setVolume(1);

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
