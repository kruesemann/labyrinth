import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";

function idle(self, radius) {
    const {x, y} = self.getHead();
    const prox = [MAPUTIL.coordsToTile(x, y)];

    for (let i = 0; prox.length < radius * radius; ++i) {
        if (i >= prox.length) {
            return false;
        }
        
        const current = prox[i];
        for (let j = 0; j < 4; ++j) {
            const neighbor = {i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j};
            if (self.form.isAllowed(neighbor.i, neighbor.j)) {
                prox.push(neighbor);
            }
        }
    }

    const targetTile = prox[Math.floor((prox.length - 1) * Math.random() + 1)];
    const route = MAPUTIL.aStar(MAP.getTileMapInfo(), {x, y}, MAPUTIL.tileToCenter(targetTile.i, targetTile.j), self.form.isAllowed, radius);
    
    if (route && route.length > 1) {
        self.idle({update: true, route});
        return true;
    }

    return false;
}

function proxHunt(self, radius) {
    const playerPos = PLAYER.getHead();
    const selfPos = self.getHead();
    if (Math.hypot(playerPos.x - selfPos.x, playerPos.y - selfPos.y) > radius) return;

    const route = MAPUTIL.aStar(MAP.getTileMapInfo(), selfPos, playerPos, self.form.isAllowed, radius);
    if (route && route.length > 1) {
        self.charge({update: true, route: route});
        return true;
    }

    return false;
}

function sightHunt(self, radius) {
    const playerPos = PLAYER.getHead();
    const selfPos = self.getHead();
    if (Math.hypot(selfPos.x - playerPos.x, selfPos.y - playerPos.y) <= radius && MAP.rayCast(selfPos, playerPos)) {
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), selfPos, playerPos, self.form.isAllowed, radius);
        if (route && route.length > 1) {
            self.charge({update: true, route});
            return true;
        }
    }

    return false;
}

function createIsVisiblePred(selfPos, maxDist) {
    return function(object) {
        return Math.hypot(selfPos.x - object.position.x, selfPos.y - object.position.y) <= maxDist && MAP.rayCast(selfPos, object.position);
    };
}

function seekLight(self, radius) {
    const selfPos = self.getHead();
    const light = LIGHT.getBrightestLight(createIsVisiblePred(selfPos, radius));
    if (light) {
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), selfPos, light.position, self.form.isAllowed, radius);
        if (route && route.length > 5) {
            self.go({update: true, route});
            return true;
        }
    }

    return false;
}

function fleeLight(self, radius) {
    const selfPos = self.getHead();
    const gradient = LIGHT.getGradient(selfPos, createIsVisiblePred(selfPos, radius));
    if (!gradient) return false;

    const startTile = MAPUTIL.coordsToTile(selfPos.x, selfPos.y);

    const prox = [startTile];
    let maxValue = 0;
    let maxPos = selfPos;

    for (let i = 0; prox.length < radius * radius; ++i) {
        if (i >= prox.length) {
            return false;
        }
        
        const current = prox[i];
        for (let j = 0; j < 4; ++j) {
            const neighbor = {i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j};
            if (self.form.isAllowed(neighbor.i, neighbor.j)) {
                prox.push(neighbor);
                const neighborPos = MAPUTIL.tileToCenter(neighbor.i, neighbor.j);
                const value = gradient.x * (neighborPos.x - selfPos.x) + gradient.y * (neighborPos.y - selfPos.y);
                if (maxValue < value) {
                    maxValue = value;
                    maxPos = neighborPos;
                }
            }
        }
    }

    const route = MAPUTIL.aStar(MAP.getTileMapInfo(), selfPos, maxPos, self.form.isAllowed, radius);
    
    if (route && route.length > 1) {
        self.go({update: true, route});
        return true;
    }

    return false;
}

export function proxHunter(self, counter) {
    if (counter % 30 !== 0) return;

    if (self.state.action !== CONSTANTS.ACTION_CHARGING) {
        if (sightHunt(self, 30)) return;
        if (self.route.length) return;
    } else {
        if (proxHunt(self, 30)) return;
        if (self.route.length) return;
        self.stopCharge();
    }
    
    if (counter % 390 === 0) idle(self, 25);
}

export function lightHunter(self, counter) {
    if (counter % 30 !== 0) return false;
    
    if (sightHunt(self, 40)) return;
    if (self.route.length) return;
    self.stopCharge();

    if (seekLight(self, 40)) return;
    if (self.route.length) return;
    
    if (counter % 390 === 0) idle(self, 25);
}

export function darkHunter(self, counter) {
    if (counter % 30 !== 0) return;

    if (sightHunt(self, 25)) return;
    if (self.route.length) return;
    self.stopCharge();

    if (fleeLight(self, 40)) return;
    if (self.route.length) return;

    if (counter % 390 === 0) idle(self, 25);
}
