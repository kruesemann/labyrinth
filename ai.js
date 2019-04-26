import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";

export function test(self, counter) {
    if (counter % 100 === 0) {
        return {update: true, route: MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getHead(), self.form.isAllowed)};
    }
    return {update: false, route: undefined};
}

export function idle(self, counter) {
    if (counter % 400 === 0) {
        const { x, y } = self.getHead();
        const prox = [MAPUTIL.coordsToTile(x, y)];

        for (let i = 0; prox.length < 50; ++i) {
            if (i >= prox.length) return {update: false, route: undefined};
            
            const current = prox[i];
            for (let j = 0; j < 4; ++j) {
                const neighbor = {i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j};
                if (self.form.isAllowed(neighbor.i, neighbor.j)) {
                    prox.push(neighbor);
                }
            }
        }

        const targetTile = prox[Math.floor((prox.length - 1) * Math.random() + 1)];
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), { x, y }, MAPUTIL.tileToCenter(targetTile.i, targetTile.j), self.form.isAllowed);
        return {update: true, route};
    }
    return {update: false, route: undefined};
}

export function proxHunter(self, counter) {
    if (counter % 100 === 0) {
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getTail(), self.form.isAllowed);
        return {update: true, route: route.length < 25 ? route : []};
    }
    return {update: false, route: undefined};
}

function createIsVisiblePred(selfPosition, maxDist) {
    return function(object) {
        return Math.hypot(selfPosition.x - object.position.x, selfPosition.y - object.position.y) <= maxDist && MAP.rayCast(selfPosition, object.position);
    };
}

export function lightAffine(self, counter) {
    if (counter % 100 === 0) {
        const target = LIGHT.getBrightestLight(createIsVisiblePred(self.getHead(), 50));
        if (target) {
            const route = MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), target.position, self.form.isAllowed);
            if (route && route.length) {
                return {update: true, route};
            }
        }
    }
    return {update: false, route: undefined};
}
