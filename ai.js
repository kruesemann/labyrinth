import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";
import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";

export function test(self, counter) {
    if (counter % 100 === 0) {
        return { update: true, route: MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getHead(), self.form.isAllowed) };
    }
    return { update: false, route: undefined };
}

export function idle(self, counter) {
    if (counter % 400 === 0) {
        const { x, y } = self.getHead();
        const prox = [MAPUTIL.coordsToTile(x, y)];

        for (let i = 0; prox.length < 50; i++) {
            if (i >= prox.length) return { update: false, route: undefined };
            
            const current = prox[i];
            for (let j = 0; j < 4; j++) {
                const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };
                if (self.form.isAllowed(neighbor.i, neighbor.j)) {
                    prox.push(neighbor);
                }
            }
        }

        const targetTile = prox[Math.floor((prox.length - 1) * Math.random() + 1)];
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), { x, y }, MAPUTIL.tileToCenter(targetTile.i, targetTile.j), self.form.isAllowed);
        return { update: true, route };
    }
    return { update: false, route: undefined };
}

export function proxHunter(self, counter) {
    if (counter % 100 === 0) {
        const route = MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getTail(), self.form.isAllowed);
        return { update: true, route: route.length < 25 ? route : [] };
    }
    return { update: false, route: undefined };
}

export function lightAffine(self, counter) {
    if (counter % 100 === 0) {
        let route = undefined;
        for (let i = LIGHT.lights.length - 1; i >= 0; i--) {
            if (LIGHT.lights[i].color[3] === 0) continue;
            if (MAP.rayCast(self.getHead(), LIGHT.lights[i].pos)) {
                route = MAPUTIL.aStar(MAP.getTileMapInfo(), self.getHead(), LIGHT.lights[i].pos, self.form.isAllowed);
                if (route) {
                    return { update: true, route: route.length > 5 ? route : [] };
                }
            }
        }
    }
    return { update: false, route: undefined };
}
