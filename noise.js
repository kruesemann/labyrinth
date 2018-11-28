let seed = 1;

export function setSeed(s) {
    seed = s;
}

export function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function noise(gen, nx, ny) {
    return gen.noise2D(nx, ny)/2 + 0.5;
}

export function doubleNoise2D(seed, numChannels, height, width, noiseColors, noiseExponents) {
    const gens = [];
    const centers = [];

    for (let i = 0; i < numChannels; i++) {
        const rngSeed = Math.abs(seed - 1000 * random());
        const rng = PM_PRNG.create(rngSeed);
        gens.push(new SimplexNoise(rng.nextDouble.bind(rng)));
        centers.push({ x: random(), y: random() });
    }

    const map = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = x / width, ny = y / height;
            const channels = [];

            for (let i = 0; i < numChannels; i++) {
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
