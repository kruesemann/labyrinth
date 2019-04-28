import * as CONSTANTS from "./constants.js";
import { BinaryHeap } from "./heap.js";

export function manhattan(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function coordsToTile(x, y) {
    return {i: Math.floor(y), j: Math.floor(x)};
}

export function tileToCoords(i, j) {
    return {x: j, y: i};
}

export function tileToCenter(i, j) {
    return {x: j + 0.5, y: i + 0.5};
}

export function isTileOfType(i, j, tileTypes, tileGetter) {
    if (!tileGetter) console.log(i, j, tileTypes);
    const tileType = tileGetter(i, j).type;
    for (let i = 0; i < tileTypes.length; ++i) {
        if (tileType === tileTypes[i]) {
            return true;
        }
    }
    return false;
}

export function isTileGround(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.GROUND_TILES, tileGetter);
}

export function isTileWall(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.WALL_TILES, tileGetter);
}

export function isTileWater(i, j, tileGetter) {
    return isTileOfType(i, j, CONSTANTS.WATER_TILES, tileGetter);
}

export function isTileWideGround(i, j, tileGetter) {
    if (!isTileGround(i, j, tileGetter)) return false;

    if (isTileGround(i, j - 1, tileGetter)
    && isTileGround(i - 1, j, tileGetter)
    && isTileGround(i - 1, j - 1, tileGetter)
    || isTileGround(i, j + 1, tileGetter)
    && isTileGround(i - 1, j, tileGetter)
    && isTileGround(i - 1, j + 1, tileGetter)
    || isTileGround(i, j - 1, tileGetter)
    && isTileGround(i + 1, j, tileGetter)
    && isTileGround(i + 1, j - 1, tileGetter)
    || isTileGround(i, j + 1, tileGetter)
    && isTileGround(i + 1, j, tileGetter)
    && isTileGround(i + 1, j + 1, tileGetter)) {
        return true;
    }
    return false;
}

export function isTileNarrowGround(i, j, tileGetter) {
    return isTileGround(i, j, tileGetter) && !isTileWideGround(i, j, tileGetter);
}

export function isTileWideWater(i, j, tileGetter) {
    if (!isTileWater(i, j, tileGetter)) return false;

    if (isTileWater(i, j - 1, tileGetter)
    && isTileWater(i - 1, j, tileGetter)
    && isTileWater(i - 1, j - 1, tileGetter)
    || isTileWater(i, j + 1, tileGetter)
    && isTileWater(i - 1, j, tileGetter)
    && isTileWater(i - 1, j + 1, tileGetter)
    || isTileWater(i, j - 1, tileGetter)
    && isTileWater(i + 1, j, tileGetter)
    && isTileWater(i + 1, j - 1, tileGetter)
    || isTileWater(i, j + 1, tileGetter)
    && isTileWater(i + 1, j, tileGetter)
    && isTileWater(i + 1, j + 1, tileGetter)) {
        return true;
    }
    return false;
}

export function isTileNarrowWater(i, j, tileGetter) {
    return isTileWater(i, j, tileGetter) && !isTileWideWater(i, j, tileGetter);
}

export function aStar(mapInfo, position, target, isAllowed, maxDist) {
    const {numColumns, numRows} = mapInfo;
    const compMap = [];
    let mapStart = coordsToTile(position.x - maxDist, position.y - maxDist);
    let mapEnd = coordsToTile(position.x + maxDist, position.y + maxDist);
    if (maxDist) {
        mapStart.i = Math.max(1, mapStart.i);
        mapStart.j = Math.max(1, mapStart.j);
        mapEnd.i = Math.min(numRows - 1, mapEnd.i);
        mapEnd.j = Math.min(numColumns - 1, mapEnd.j);
    } else {
        mapStart = {i: 0, j: 0};
        mapEnd = {i: numRows, j: numColumns};
    }
    const startTile = coordsToTile(position.x, position.y);
    const targetTile = coordsToTile(target.x, target.y);
  
    const weightFunction = function(i, j) {
        if (isAllowed(i, j)) return 1;
        return 2;
    };
  
    for (let i = mapStart.i; i < mapEnd.i; ++i) {
        for (let j = mapStart.j; j < mapEnd.j; ++j) {
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
  
    const start = compMap[(startTile.i - mapStart.i) * (mapEnd.j - mapStart.j) + startTile.j - mapStart.j];
    start.g = 0;
    start.f = manhattan(startTile.i, startTile.j, targetTile.i, targetTile.j);
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        if (current.i === targetTile.i && current.j === targetTile.j) {
            const path = [];
            while (current) {
                path.push(tileToCenter(current.i, current.j));
                current = current.pred;
            }
            
            return path;
        }

        current.closed = true;

        for (const dir of CONSTANTS.DIRECTIONS) {
            const ni = current.i + dir.i;
            const nj = current.j + dir.j;

            const {x, y} = tileToCenter(ni, nj);
            if (maxDist && Math.hypot(x - position.x, y - position.y) > maxDist) continue;

            const neighbor = compMap[(ni - mapStart.i) * (mapEnd.j - mapStart.j) + nj - mapStart.j];

            if (neighbor.closed) continue;
            if (!isAllowed(ni, nj)) continue;
            if (dir.i !== 0
                && dir.j !== 0
                && !isAllowed(current.i + dir.i, current.j)
                && !isAllowed(current.i, current.j + dir.j))
                continue;

            const nCost = weightFunction(ni, nj);
            const g =
                ni !== current.i && nj !== current.j
                ? current.g + nCost * 1.5
                : current.g + nCost;

            if (neighbor.visited && g >= neighbor.g) continue;
            neighbor.pred = current;
            neighbor.g = g;
            neighbor.f = g + manhattan(ni, nj, targetTile.i, targetTile.j);

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
