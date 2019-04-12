import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";
import * as CONSTANTS from "./constants.js";
import * as NOISE from "./noise.js";

let secrets = {
    wisps: []
};

export function reset() {
    secrets = {
        wisps: []
    };
}

function createWisp(i, j, color, change) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);

    let wisp = {
        index: secrets.wisps.length,
        x,
        y,
        light: LIGHT.create(x, y, color),
        color,
        interval: Math.floor(NOISE.random() * 800) + 200,
        change,
        gleaming: false,
        gleam: function() {
            if (!this.gleaming) return;

            const newColor = [];
            for (let i = 0; i < 3; i++) {
                newColor.push(this.light.color[i]);
            }

            if (this.light.color[3] + this.change <= this.color[3]
                && this.light.color[3] + this.change > 0) {
                newColor.push(this.light.color[3] + this.change);
            } else if (this.light.color[3] + this.change <= 0) {
                newColor.push(0);
                this.change = - this.change;
                this.gleaming = false;
            } else {
                newColor.push(this.color[3]);
                this.change = - this.change;
            }
            if (newColor[3] > 1) {
                newColor[3] += CONSTANTS.LIGHT_WISP_FLICKER * (Math.random() - 0.5);
            }

            this.light.changeColor(newColor);

            if (!this.gleaming) {
                this.light.move(CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5), CONSTANTS.LIGHT_WISP_JUMP * (Math.random() - 0.5));
                this.color[3] = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_INTENSITY_MAX - CONSTANTS.LIGHT_WISP_INTENSITY_MIN)) + CONSTANTS.LIGHT_WISP_INTENSITY_MIN;
                this.interval = Math.floor(NOISE.random() * (CONSTANTS.LIGHT_WISP_INTERVAL_MAX - CONSTANTS.LIGHT_WISP_INTERVAL_MIN)) + CONSTANTS.LIGHT_WISP_INTERVAL_MIN;
            }
        }
    };
    
    wisp.light.flickering = false;

    secrets.wisps.push(wisp);
}

export function createSecrets(secretList) {
    for (let secret of secretList) {
        switch(secret.type) {
            case "wisp": createWisp(secret.i, secret.j, secret.color, secret.change); break;
            default: console.log("Unknown secret"); break;
        }
    }
}

export function gleamAllWisps(counter) {
    for (let wisp of secrets.wisps) {
        if (counter % wisp.interval === 0) {
            wisp.gleaming = true;
        }
        if (counter % 4 === 0) {
            wisp.gleam();
        }
    }
}
