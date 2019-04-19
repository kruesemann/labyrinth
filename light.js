import * as CONSTANTS from "./constants.js";
import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";
import * as SECRET from "./secret.js";

export const lights = [];

let mapLightingMesh = undefined;
let dimensions = undefined;

export function reset(numRows, numColumns, level) {
    removeAllLights();

    dimensions = [CONSTANTS.LIGHT_MAP_PRECISION * numColumns, CONSTANTS.LIGHT_MAP_PRECISION * numRows];

    const lightGeometry = new THREE.BufferGeometry();
    lightGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                    0,             0, 0.01,
        dimensions[0],             0, 0.01,
                    0, dimensions[1], 0.01,
        dimensions[0],             0, 0.01,
        dimensions[0], dimensions[1], 0.01,
                    0, dimensions[1], 0.01,
    ]), 3));
    lightGeometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 0,
        1, 1,
        0, 1,
    ]), 2));

    SHADER.mapLightingUniforms.u_dimensions.value = dimensions;
    SHADER.mapLightingUniforms.u_ambientLight.value = [1.0, 1.0, 1.0, Math.max(0.0, CONSTANTS.LIGHT_AMBIENT_INITIAL - level * CONSTANTS.LIGHT_AMBIENT_DECREASE)];
    SHADER.objectUniforms.u_ambientLight.value = SHADER.mapLightingUniforms.u_ambientLight.value;
    mapLightingMesh = new THREE.Mesh(lightGeometry, SHADER.getMapLightingMaterial());
}

export function create(x, y, color) {
    let uniformIndex = -1;

    for (let i = 0; i < CONSTANTS.LIGHT_MAXNUM; i++) {
        if (SHADER.mapLightingUniforms.u_lightPos.value[2 * i] === 0
        && SHADER.mapLightingUniforms.u_lightPos.value[2 * i + 1] === 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i] === 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 1] === 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 2] === 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 3] === 0) {
            uniformIndex = i;
        }
    }

    if (uniformIndex === -1) {
        console.log("too many lights");
        return null;
    }

    const light = {
        index: lights.length,
        uniformIndex: uniformIndex,
        pos: undefined,
        color: undefined,
        flickering: true,
        fade: false,
        animationStep: 0,
        flaring: false,
        changeColor: function(newColor) {
            this.color = newColor;
            for (let i = 0; i < 4; i++) {
                SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
                
                SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
            }
        },
        setBrightness: function(newBrightness) {
            if (newBrightness < 0) newBrightness = 0;
            this.color[3] = newBrightness;
            SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = newBrightness;
            
            SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = newBrightness;
        },
        changeBrightness: function(difference) {
            this.setBrightness(this.color[3] + difference);
        },
        move: function(dx, dy) {
            this.pos.x += dx;
            this.pos.y += dy;

            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = CONSTANTS.LIGHT_MAP_PRECISION * this.pos.x;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = CONSTANTS.LIGHT_MAP_PRECISION * this.pos.y;

            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        set: function(x, y) {
            this.pos = { x, y };

            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = CONSTANTS.LIGHT_MAP_PRECISION * this.pos.x;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = CONSTANTS.LIGHT_MAP_PRECISION * this.pos.y;
            
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.objectUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        flare: function(targetBrightness, maxBrightness) {
            if (this.flaring) return;
            this.flaring = true;
            const lowerBound = flareUpInverse(this.color[3] / maxBrightness);
            const upperBound = flareDownInverse(targetBrightness / maxBrightness);
            const stepNum = (upperBound - lowerBound) / CONSTANTS.LIGHT_FLARE_STEP_WIDTH;

            function flare(counter, light) {
                setTimeout(() => {
                    if (counter > stepNum) {
                        light.setBrightness(targetBrightness);
                        light.flaring = false;
                        return;
                    }
                    const x = lowerBound + counter * CONSTANTS.LIGHT_FLARE_STEP_WIDTH;
                    if (x < 1) light.setBrightness(maxBrightness * flareUp(x));
                    else light.setBrightness(maxBrightness * flareDown(x));
                    flare(counter + 1, light);
                }, CONSTANTS.LIGHT_BEACON_STEP_TIME);
            }
            flare(1, this);
        },
        flicker: function() {
            const rand = CONSTANTS.LIGHT_PARTICLE_FLICKER * (Math.random() - 0.5);

            const intensity = this.color[3] + rand < 0.1 ? 0 : this.color[3] + rand;

            SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = intensity;

            SHADER.objectUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = intensity;
        },
        die: function() {
            this.color[3] -= CONSTANTS.LIGHT_PARTICLE_DECAY;
            return this.color[3] <= CONSTANTS.LIGHT_PARTICLE_DEATH;
        },
        remove: function() {
            removeLight(this.index);
        }
    };
    
    light.changeColor(color);
    light.set(x, y);

    lights.push(light);

    return light;
}

export function createLights(lightList) {
    for (let light of lightList) {
        create(light.x, light.y, light.color);
    }
}

export function createParticle(x, y, color) {
    const particle = create(x, y, color);
    if (particle !== null) {
        particle.fade = true;
    }
    return particle;
}

function removeShaderLight(uniformIndex) {
    SHADER.mapLightingUniforms.u_lightPos.value[2 * uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightPos.value[2 * uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 2] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 3] = 0;
    
    SHADER.objectUniforms.u_lightPos.value[2 * uniformIndex] = 0;
    SHADER.objectUniforms.u_lightPos.value[2 * uniformIndex + 1] = 0;
    SHADER.objectUniforms.u_lightColor.value[4 * uniformIndex] = 0;
    SHADER.objectUniforms.u_lightColor.value[4 * uniformIndex + 1] = 0;
    SHADER.objectUniforms.u_lightColor.value[4 * uniformIndex + 2] = 0;
    SHADER.objectUniforms.u_lightColor.value[4 * uniformIndex + 3] = 0;
}

export function removeLight(index) {
    if (index >= lights.length) return;

    removeShaderLight(lights[index].uniformIndex);

    for (let light of lights) {
        if (light.index > index) {
            light.index--;
        }
    }

    lights.splice(index, 1);
}

export function removeLastLight() {
    if (lights.length === 0) return;

    removeShaderLight(lights.pop().uniformIndex);
}

export function removeAllLights() {
    while (lights.length > 0) {
        removeLastLight();
    }
}

export function flickerAll(counter) {
    if (counter % 4 === 0) {
        for (let light of lights) {
            if (light.flickering) {
                light.flicker();
            }
        }
    }
    if (counter % 10 === 0) {
        for (let light of lights) {
            if (light.fade && light.die()) {
                light.remove();
            }
        }
    }
}

export function renderLighting(counter) {
    SECRET.gleamAllWisps(counter);
    flickerAll(counter);
    SHADER.mapUniforms.u_texture.value = STAGE.renderToTexture([mapLightingMesh], dimensions[0], dimensions[1]);
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
