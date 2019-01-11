import * as CONSTANTS from "./constants.js";
import * as SHADER from "./shader.js";
import * as SCENE from "./scene.js";

export const lights = [];

let mapLightingMesh = undefined;
let dimensions = undefined;

export function createLight(x, y, color) {
    let uniformIndex = -1;

    for (let i = 0; i < CONSTANTS.LIGHT_MAXNUM; i++) {
        if (SHADER.mapLightingUniforms.u_lightPos.value[2 * i] == 0
        && SHADER.mapLightingUniforms.u_lightPos.value[2 * i + 1] == 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i] == 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 1] == 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 2] == 0
        && SHADER.mapLightingUniforms.u_lightColor.value[4 * i + 3] == 0) {
            uniformIndex = i;
        }
    }

    if (uniformIndex == -1) {
        console.log("too many lights");
        return;
    }

    const light = {
        uniformIndex: uniformIndex,
        pos: undefined,
        color: undefined,
        animationStep: 0,
        changeColor: function(newColor) {
            this.color = newColor;
            for (let i = 0; i < 4; i++) {
                SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
            }
        },
        move: function(dx, dy) {
            this.pos.x += dx;
            this.pos.y += dy;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        set: function(x, y) {
            this.pos = { x, y };
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.mapLightingUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        flicker: function() {
            SHADER.mapLightingUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = this.color[3] + Math.random() - 0.5;
        },
        die: function() {
            this.color[3] -= 0.1;
            return this.color[3] <= 2.5;
        },
    };
    
    light.changeColor(color);
    light.set(x, y);

    lights.push(light);
}

export function removeLight(index) {
    if (index >= lights.length) return;

    const uniformIndex = lights[index].uniformIndex;
    SHADER.mapLightingUniforms.u_lightPos.value[2 * uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightPos.value[2 * uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 2] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * uniformIndex + 3] = 0;
    lights.splice(index, 1);
}

export function removeLastLight() {
    if (lights.length == 0) return;

    const light = lights.pop();

    SHADER.mapLightingUniforms.u_lightPos.value[2 * light.uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightPos.value[2 * light.uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * light.uniformIndex] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * light.uniformIndex + 1] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * light.uniformIndex + 2] = 0;
    SHADER.mapLightingUniforms.u_lightColor.value[4 * light.uniformIndex + 3] = 0;
}

export function removeAllLights() {
    while (lights.length > 0) {
        removeLastLight();
    }
}

export function flickerAll(counter) {
    if (counter % 4 == 0) {
        for (let light of lights) {
            light.flicker();
        }
    }
    if (counter % 10 == 0) {
        for (let i = 0; i < lights.length; i++) {
            if (lights[i].die()) {
                removeLight(i);
                i--;
            }
        }
    }
}

export function initializeLighting(numRows, numColumns, level) {
    dimensions = [numColumns, numRows];

    let lightGeometry = new THREE.BufferGeometry();
    lightGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
        0,0,-0.1,
        dimensions[0],0,-0.1,
        0,dimensions[1],-0.1,
        dimensions[0],0,-0.1,
        dimensions[0],dimensions[1],-0.1,
        0,dimensions[1],-0.1,
    ]), 3));
    lightGeometry.addAttribute('a_texelCoords', new THREE.BufferAttribute(new Float32Array([
        0,0,
        1,0,
        0,1,
        1,0,
        1,1,
        0,1,
    ]), 2));

    SHADER.mapLightingUniforms.u_dimensions.value = dimensions;
    SHADER.mapLightingUniforms.u_ambientLight.value = [1.0, 1.0, 1.0, Math.max(0.0, 3.0 - level * 0.3)];
    mapLightingMesh = new THREE.Mesh(lightGeometry, SHADER.getMapLightingMaterial());
}

export function renderLighting(counter) {
    flickerAll(counter);
    SCENE.createBuffer([mapLightingMesh], dimensions[0], dimensions[1]);
    SHADER.mapUniforms.u_texture.value = SCENE.renderBufferToTexture(dimensions[0], dimensions[1]);
    SCENE.deleteBuffer();
}
