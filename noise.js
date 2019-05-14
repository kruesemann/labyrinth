let mapRng = undefined;
let gameRng = undefined;

export function createUuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function reset() {
    mapRng = undefined;
    gameRng = undefined;
}

export function setGameSeed(s) {
    gameRng = PM_PRNG.create(s);
}

export function setMapSeed(s) {
    mapRng = PM_PRNG.create(s);
}

export function randomInt(min, max) {
    return mapRng.nextIntRange(min, max);
}

export function randomDouble(min, max) {
    return mapRng.nextDoubleRange(min, max);
}

export function withProbability(probability) {
    return mapRng.nextDoubleRange(0, 1) <= probability;
}

export function withFrequencies(options, seed) {
    const rng = seed ? PM_PRNG.create(seed) : mapRng;
    const threshhold = rng.nextDoubleRange(0, 1);
    const sum = options.reduce((s, option) => s + option.frequency, 0);
    let frequency = 0;
    for (const option of options) {
        frequency += option.frequency / sum;
        if (threshhold <= frequency) return option.value;
    }
    return undefined;
}

export function nextMapSeed() {
    return gameRng.nextInt();
}

export function peekSeed(seed, i) {
    const rng = PM_PRNG.create(seed);
    for (let j = 0; j < i - 1; ++j) rng.nextInt();
    return rng.nextInt();
}

function noise(gen, nx, ny) {
    return gen.noise2D(nx, ny) / 2 + 0.5;
}

export function doubleNoise2D(numChannels, height, width, noiseColors, noiseExponents) {
    const gens = [];
    const centers = [];

    for (let i = 0; i < numChannels; ++i) {
        const rngSeed = mapRng.nextInt();
        const rng = PM_PRNG.create(rngSeed);
        gens.push(new SimplexNoise(rng.nextDouble.bind(rng)));
        centers.push({x: mapRng.nextDouble(), y: mapRng.nextDouble()});
    }

    const map = [];
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const nx = x / width, ny = y / height;
            const channels = [];

            for (let i = 0; i < numChannels; ++i) {
                const cnx = nx - centers[i].x;
                const cny = ny - centers[i].y;

                let c = noiseColors[i][0] * noise(gens[i], cnx, cny)            //black
                    + noiseColors[i][1] * noise(gens[i], 2 * cnx, 2 * cny)      //red
                    + noiseColors[i][2] * noise(gens[i], 4 * cnx, 4 * cny)      //pink
                    + noiseColors[i][3] * noise(gens[i], 8 * cnx, 8 * cny)      //white
                    + noiseColors[i][4] * noise(gens[i], 16 * cnx, 16 * cny)    //blue
                    + noiseColors[i][5] * noise(gens[i], 32 * cnx, 32 * cny);   //violet
                c /= (noiseColors[i][0] + noiseColors[i][1] + noiseColors[i][2] + noiseColors[i][3] + noiseColors[i][4] + noiseColors[i][5]);
                c = Math.pow(c, noiseExponents[i]);
                channels.push(c);
            }

            map.push(channels);
        }
    }
    return map;
}
