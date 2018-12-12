import * as CONSTANTS from "./constants.js";
import * as SHADER from "./shader.js";

const lights = [];

export function createLight(x, y, color, animation) {
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
        index: uniformIndex,
        pos: undefined,
        color: undefined,
        animation: animation,
        animationStep: 0,
        changeColor: function(newColor) {
            this.color = newColor;
            for (let i = 0; i < 4; i++) {
                SHADER.mapUniforms.u_lightColor.value[4 * this.index + i] = newColor[i];
            }
        },
        move: function(dx, dy) {
            this.pos.x += dx;
            this.pos.y += dy;
            SHADER.mapUniforms.u_lightPos.value[2 * this.index] = this.pos.x;
            SHADER.mapUniforms.u_lightPos.value[2 * this.index + 1] = this.pos.y;
        },
        set: function(x, y) {
            this.pos = { x, y };
            SHADER.mapUniforms.u_lightPos.value[2 * this.index] = this.pos.x;
            SHADER.mapUniforms.u_lightPos.value[2 * this.index + 1] = this.pos.y;
        },
        flicker: function() {
            if (this.animationStep < this.animation.length) {
                SHADER.mapUniforms.u_lightColor.value[4 * this.index + 3] += this.animation[this.animationStep++];
            } else {
                this.animationStep = 0;
                SHADER.mapUniforms.u_lightColor.value[4 * this.index + 3] = this.color[3];
            }
        },
    };
    
    light.changeColor(color);
    light.set(x, y);

    lights.push(light);
}

export function removeLight(index) {
    if (index >= lights.length) return;

    const uniformIndex = lights[index].index;
    SHADER.mapUniforms.u_lightPos.value[2 * uniformIndex] = 0;
    SHADER.mapUniforms.u_lightPos.value[2 * uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 1] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 2] = 0;
    SHADER.mapUniforms.u_lightColor.value[4 * uniformIndex + 3] = 0;
    lights.splice(index, 1);
}

export function flickerAll(counter) {
    if (counter % 4 == 0) {
        for (let light of lights) {
            light.flicker();
        }
    }
}
