import * as LIGHT from "./light.js";
import * as MAPUTIL from "./mapUtil.js";

let secrets = {
    wisps: []
};

export function reset() {
    secrets = {
        wisps: []
    };
}

function createWisp(i, j, color, interval, change) {
    const { x, y } = MAPUTIL.tileToCenter(i, j);

    let wisp = {
        index: secrets.wisps.length,
        x,
        y,
        light: LIGHT.create(x, y, color),
        color,
        interval,
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
                newColor.push(this.color[0]);
                this.change = - this.change;
                this.gleaming = false;
            } else {
                newColor.push(this.color[3]);
                this.change = - this.change;
            }

            this.light.changeColor(newColor);
        }
    };
    
    const newColor = [];
    for (let i = 0; i < 3; i++) {
        newColor.push(wisp.light.color[i]);
    }
    wisp.light.changeColor(newColor);

    secrets.wisps.push(wisp);
}

export function createSecrets(secretList) {
    for (let secret of secretList) {
        switch(secret.type) {
            case "wisp": createWisp(secret.i, secret.j, secret.color, secret.interval, secret.change); break;
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
