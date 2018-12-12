import * as CONSTANTS from "./constants.js";
import * as SHADER from "./shader.js";

const lights = [];

export function createLight(x, y, color) {
    let uniformIndex = -1;

    for (let i = 0; i < CONSTANTS.LIGHT_MAXNUM; i++) {
        if (SHADER.mapUniforms.u_lightPos.value[2 * i] == 0
            && SHADER.mapUniforms.u_lightPos.value[2 * i + 1] == 0
            && SHADER.mapUniforms.u_lightColor.value[4 * i] == 0
            && SHADER.mapUniforms.u_lightColor.value[4 * i + 1] == 0
            && SHADER.mapUniforms.u_lightColor.value[4 * i + 2] == 0
            && SHADER.mapUniforms.u_lightColor.value[4 * i + 3] == 0) {
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
                SHADER.mapUniforms.u_lightColor.value[4 * this.uniformIndex + i] = newColor[i];
            }
        },
        move: function(dx, dy) {
            this.pos.x += dx;
            this.pos.y += dy;
            SHADER.mapUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.mapUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        set: function(x, y) {
            this.pos = { x, y };
            SHADER.mapUniforms.u_lightPos.value[2 * this.uniformIndex] = this.pos.x;
            SHADER.mapUniforms.u_lightPos.value[2 * this.uniformIndex + 1] = this.pos.y;
        },
        flicker: function() {
            SHADER.mapUniforms.u_lightColor.value[4 * this.uniformIndex + 3] = this.color[3] + Math.random() - 0.5;
        },
        die: function() {
            this.color[3] -= 0.1;
            return this.color[3] <= 0;
        },
    };
    
    light.changeColor(color);
    light.set(x, y);

    lights.push(light);
}

export function removeLight(index) {
    if (index >= lights.length) return;

    const uniformIndex = lights[index].uniformIndex;
    SHADER.mapUniforms.u_lightPos.value[2 * uniformIndex] = 0;
    SHADER.mapUniforms.u_lightPos.value[2 * uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 2] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 3] = 0;
    lights.splice(index, 1);
}

export function removeLastLight() {
    if (lights.length == 0) return;

    const light = lights.pop();

    SHADER.mapUniforms.u_lightPos.value[2 * light.uniformIndex] = 0;
    SHADER.mapUniforms.u_lightPos.value[2 * light.uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * light.uniformIndex] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * light.uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * light.uniformIndex + 2] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * light.uniformIndex + 3] = 0;
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
