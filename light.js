import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as NOISE from "./noise.js";
import * as PLAYER from "./player.js";
import * as SECRET from "./secret.js";
import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";

let lightingMap = {
    lights: {},
    dimensions: undefined,
    mesh: undefined
};

class Light {
    constructor(position, color, brightness, flickering, fading) {
        this._uuid = NOISE.createUuid();
        this._uniformIndex = -1;
        this._position = position;
        this._color = color;
        this._brightness = brightness;
        this._flickering = flickering;
        this._fading = fading;
        this._isFlaring = false;
        lightingMap.lights[this.uuid] = this;
    }

    get uuid() {
        return this._uuid;
    }

    set uniformIndex(newUniformIndex) {
        this._uniformIndex = newUniformIndex;
        this.position = this.position;
        this.color = this.color;
        this.brightness = this.brightness;
    }

    get uniformIndex() {
        return this._uniformIndex;
    }

    set position(newPosition) {
        this._position = newPosition;
        if (this.uniformIndex !== -1) {
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = CONSTANTS.LIGHT_MAP_PRECISION * newPosition.x;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = CONSTANTS.LIGHT_MAP_PRECISION * newPosition.y;
            
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex] = newPosition.x;
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = newPosition.y;
        }
    }

    get position() {
        return this._position;
    }

    changePosition(dPosition) {
        this.position = {
            x: this.position.x + dPosition.x,
            y: this.position.y + dPosition.y
        };
    }

    set color(newColor) {
        this._color = newColor;
        if (this.uniformIndex !== -1) {
            for (let i = 0; i < 3; ++i) {
                SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
                SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
            }
        }
    }

    get color() {
        return this._color;
    }

    set brightness(newBrightness) {
        this._brightness = newBrightness;
        if (this.uniformIndex !== -1) {
            SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = newBrightness;
            SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = newBrightness;
        }
    }

    get brightness() {
        return this._brightness;
    }

    changeBrightness(dBrightness) {
        this.brightness += dBrightness;
        if (this.brightness < 0) this.brightness = 0;
    }

    set flickering(newFlickering) {
        this._flickering = newFlickering;
    }

    get flickering() {
        return this._flickering;
    }

    set fading(newFading) {
        this._fading = newFading;
    }

    get fading() {
        return this._fading;
    }

    set isFlaring(newIsFlaring) {
        this._isFlaring = newIsFlaring;
    }

    get isFlaring() {
        return this._isFlaring;
    }

    flare(targetBrightness, maxBrightness) {
        if (this.isFlaring) return;
        this.isFlaring = true;

        const lowerBound = flareUpInverse(this.brightness / maxBrightness);
        const upperBound = flareDownInverse(targetBrightness / maxBrightness);
        const stepNum = (upperBound - lowerBound) / CONSTANTS.LIGHT_FLARE_STEP_WIDTH;

        function flareStep(counter, self) {
            setTimeout(() => {
                if (counter > stepNum) {
                    self.brightness = targetBrightness;
                    self.isFlaring = false;
                    return;
                }
                const x = lowerBound + counter * CONSTANTS.LIGHT_FLARE_STEP_WIDTH;
                if (x < 1) self.brightness = maxBrightness * flareUp(x);
                else self.brightness = maxBrightness * flareDown(x);
                flareStep(counter + 1, self);
            }, CONSTANTS.LIGHT_BEACON_STEP_TIME);
        }
        flareStep(1, this);
    }

    flicker() {
        if (this.uniformIndex !== -1) {
            const rand = CONSTANTS.LIGHT_PARTICLE_FLICKER * (Math.random() - 0.5);
            SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = this.brightness + rand < 0.1 ? 0 : this.brightness + rand;
            SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = this.brightness + rand < 0.1 ? 0 : this.brightness + rand;
        }
    }

    die(decay) {
        this.brightness -= decay;
        return this.brightness <= CONSTANTS.LIGHT_PARTICLE_DEATH;
    }

    remove() {
        if (this.uniformIndex !== -1) {
            for (let i = 0; i < 4; ++i) {
                SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + i] = 0;
                SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + i] = 0;
            }
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = 0;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = 0;

            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex] = 0;
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = 0;
        }

        delete lightingMap.lights[this.uuid];
    }
}

export function reset() {
    lightingMap = {
        lights: {},
        dimensions: undefined,
        mesh: undefined
    };
}

export function initialize(mapDimensions) {
    const screenDimensions = STAGE.getScreenWorldDimensions();
    const dimensions = {x: screenDimensions.x * CONSTANTS.LIGHT_MAP_PRECISION, y: screenDimensions.y * CONSTANTS.LIGHT_MAP_PRECISION};
    SHADER.mapLightingUniforms.u_dimensions.value = new Float32Array([mapDimensions.x * CONSTANTS.LIGHT_MAP_PRECISION, mapDimensions.y * CONSTANTS.LIGHT_MAP_PRECISION]);

    const lightGeometry = new THREE.BufferGeometry();
    lightGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -1, -1, 0,
         1, -1, 0,
        -1,  1, 0,
         1, -1, 0,
         1,  1, 0,
        -1,  1, 0,
    ]), 3));
    lightGeometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
                                           0,                                    0,
        screenDimensions.x / mapDimensions.x,                                    0,
                                           0, screenDimensions.y / mapDimensions.y,
        screenDimensions.x / mapDimensions.x,                                    0,
        screenDimensions.x / mapDimensions.x, screenDimensions.y / mapDimensions.y,
                                           0, screenDimensions.y / mapDimensions.y,
    ]), 2));

    lightingMap = {
        lights: {},
        dimensions,
        mesh: new THREE.Mesh(lightGeometry, SHADER.getMapLightingMaterial())
    };
}

export function levelReset(level) {
    const ambientLightBrightness = Math.max(0.0, CONSTANTS.LIGHT_AMBIENT_INITIAL - level * CONSTANTS.LIGHT_AMBIENT_DECREASE);
    SHADER.mapLightingUniforms.u_ambientLight.value[3] = ambientLightBrightness;
    SHADER.objectUniforms.u_ambientLight.value[3] = ambientLightBrightness;

    SHADER.mapLightingUniforms.u_lightPos.value = new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM);
    SHADER.mapLightingUniforms.u_lightColor.value = new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM);

    lightingMap.lights = {};
}

export function create(x, y, color) {
    return new Light({x, y}, [color[0], color[1], color[2]], color[3], true, false);
}

export function createLights(lightList) {
    for (const light of lightList) {
        create(light.x, light.y, light.color);
    }
}

export function createParticle(x, y, color) {
    const particle = create(x, y, color);
    if (particle !== null) {
        particle.fading = true;
    }
    return particle;
}

export function flickerAll(counter) {
    if (counter % 4 === 0) {
        for (const uuid in lightingMap.lights) {
            if (!lightingMap.lights.hasOwnProperty(uuid)) continue;
            const light = lightingMap.lights[uuid];

            if (light.flickering) {
                light.flicker();
            }
        }
    }
    if (counter % 10 === 0) {
        for (const uuid in lightingMap.lights) {
            if (!lightingMap.lights.hasOwnProperty(uuid)) continue;
            const light = lightingMap.lights[uuid];

            if (light.fading && light.die(CONSTANTS.LIGHT_PARTICLE_DECAY)) {
                light.remove();
            }
        }
    }
}

function brighter(o1, o2) {
    return o2.brightness - o1.brightness;
}

function assignUniformIndices() {
    SHADER.mapLightingUniforms.u_lightPos.value = new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM);
    SHADER.mapLightingUniforms.u_lightColor.value = new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM);

    const playerPos = PLAYER.getHead();
    const list = [];

    for (const uuid in lightingMap.lights) {
        if (!lightingMap.lights.hasOwnProperty(uuid)) continue;
        const light = lightingMap.lights[uuid];
        light.uniformIndex = -1;
        const dist = Math.hypot(playerPos.x - light.position.x, playerPos.y - light.position.y);
        if (dist < CONSTANTS.LIGHT_MAX_RENDER_DIST) list.push(light);
    }

    list.sort(brighter);

    let uInd = 0;
    for (let light of list) {
        light.uniformIndex = ++uInd;
    }
}

export function renderLighting(counter) {
    assignUniformIndices();
    SECRET.gleamAllWisps(counter);
    flickerAll(counter);

    const {x, y} = PLAYER.getCenter();
    const mapDimensions = MAP.getTileMapInfo();
    const screenDimensions = STAGE.getScreenWorldDimensions();
    SHADER.mapLightingUniforms.u_texelTranslation.value = [(x - screenDimensions.x / 2) / mapDimensions.numColumns, (y - screenDimensions.y / 2) / mapDimensions.numRows];
    SHADER.mapUniforms.u_texture.value = STAGE.renderToTexture([lightingMap.mesh], lightingMap.dimensions);
}

function flareUp(x) {
    return 1 - 2 * Math.pow(x - 1, 2);
}

function flareDown(x) {
    return 1 - Math.pow(x - 1, 2);
}

function flareUpInverse(y) {
    return 1 - Math.sqrt((1 - y) / 2);
}

function flareDownInverse(y) {
    return 1 + Math.sqrt(1 - y);
}

export function getBrightestLight(pred) {
    let brightestLight = undefined;

    for (const uuid in lightingMap.lights) {
        if (!lightingMap.lights.hasOwnProperty(uuid)) continue;
        const light = lightingMap.lights[uuid];

        if (light.brightness < 0.1 || !pred(light)) continue;
        if (!brightestLight) {
            brightestLight = light;
            continue;
        }
        if (brightestLight.brightness < light.brightness) {
            brightestLight = light;
        }
    }

    return brightestLight;
}

export function getLightsInRadius(position, radius, pred) {
    let nearLights = [];

    for (const uuid in lightingMap.lights) {
        if (!lightingMap.lights.hasOwnProperty(uuid)) continue;
        const light = lightingMap.lights[uuid];

        const dist = Math.hypot(light.position.x - position.x, light.position.y - position.y);
        if (dist > radius || !pred(light)) continue;
        nearLights.push(light);
    }

    return nearLights;
}
