import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import { BinaryHeap } from "./heap.js";

function aStar(mapInfo, position, target, object) {
    const { numColumns, numRows } = mapInfo;
    const startTile = MAP.coordsToTile(position.x, position.y);
    const targetTile = MAP.coordsToTile(target.x, target.y);
    const compMap = [];
  
    const weightFunction = function(i, j) {
        if (object.form.isAllowed(i, j)) return 1;
        return 2;
    };
  
    for (let i = 0; i < numColumns; i++) {
        for (let j = 0; j < numRows; j++) {
            compMap.push({
                i: i,
                j: j,
                visited: false,
                closed: false,
                pred: null,
                f: undefined,
                g: undefined
            });
        }
    }
  
    const heap = new BinaryHeap(node => node.f);
  
    const start = compMap[startTile.i * numColumns + startTile.j];
    start.g = 0;
    start.f = MAP.manhattan(startTile.i, startTile.j, targetTile.i, targetTile.j);
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        if (current.i == targetTile.i && current.j == targetTile.j) {
            const path = [];
            while (current) {
                path.push(MAP.tileToCenter(current.i, current.j));
                current = current.pred;
            }

            return path;
        }

        current.closed = true;

        for (let dir of CONSTANTS.DIRECTIONS) {
            const ni = current.i + dir.i;
            const nj = current.j + dir.j;

            const neighbor = compMap[ni * numColumns + nj];

            if (neighbor.closed) continue;
            if (!object.form.isAllowed(ni, nj)) continue;
            if (dir.i != 0
                && dir.j != 0
                && !object.form.isAllowed(current.i + dir.i, current.j)
                && !object.form.isAllowed(current.i, current.j + dir.j))
                continue;

            const nCost = weightFunction(ni, nj);
            const g =
                ni != current.i && nj != current.j
                ? current.g + nCost * 1.5
                : current.g + nCost;

            if (neighbor.visited && g >= neighbor.g) continue;
            neighbor.pred = current;
            neighbor.g = g;
            neighbor.f = g + MAP.manhattan(ni, nj, targetTile.i, targetTile.j);

            if (!neighbor.visited) {
                neighbor.visited = true;
                heap.push(neighbor);
            } else {
                heap.rescoreElement(neighbor);
            }
        }
    }

    return [];
}

export function test(self, counter) {
    if (counter % 100 == 0) {
        return { update: true, route: aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getHead(), self) };
    }
    return { update: false, route: undefined };
}

export function idle(self, counter) {
    if (counter % 400 == 0) {
        const { x, y } = self.getHead();
        const prox = [MAP.coordsToTile(x, y)];

        for (let i = 0; prox.length < 50; i++) {
            const current = prox[i];
            for (let j = 0; j < 4; j++) {
                const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };
                if (self.form.isAllowed(neighbor.i, neighbor.j)) {
                    prox.push(neighbor);
                }
            }
        }

        const targetTile = prox[Math.floor((prox.length - 1) * Math.random() + 1)];
        const route = aStar(MAP.getTileMapInfo(), { x, y }, MAP.tileToCenter(targetTile.i, targetTile.j), self);
        return { update: true, route };
    }
    return { update: false, route: undefined };
}

export function proxHunter(self, counter) {
    if (counter % 100 == 0) {
        const route = aStar(MAP.getTileMapInfo(), self.getHead(), PLAYER.getTail(), self);
        return { update: true, route: route.length < 25 ? route : [] };
    }
    return { update: false, route: undefined };
}

export function lightAffine(self, counter) {
    if (counter % 100 == 0) {
        let route = undefined;
        for (let light of LIGHT.lights) {
            if (MAP.rayCast(self.getHead(), light.pos)) {
                route = aStar(MAP.getTileMapInfo(), self.getHead(), light.pos, self);
            }
        }
        if (route) {
            return { update: true, route: route.length > 5 ? route : [] };
        }
    }
    return { update: false, route: undefined };
}
