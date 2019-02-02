import * as CONSTANTS from "./constants.js";
import * as MAPUTIL from "./mapUtil.js";
import * as NOISE from "./noise.js";
import { BinaryHeap } from "./heap.js";

let randomMap = undefined;

export function create(seed, numRows, numColumns, level) {
    NOISE.setMapSeed(seed);
    
    randomMap = {
        tileMap: [],
        numRows,
        numColumns,
        caveChannel: 0,
        terrainChannel: 1,
        tunnelChannel: 2,
        noiseMap: [],
        level,
        caves: [],
        tunnels: [],
        numberBiomeTypes: 0,
        biomeTypes: [],
        biomeGraph: { biomes: [], adjMatrix: [] },
    };

    // temporary inits
    randomMap.numberBiomeTypes = 4;
    randomMap.biomeTypes = [
        { type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileWideGround },
        { type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround },
        { type: CONSTANTS.WIDE_WATER_BIOME, isAllowed: isTileWideWater },
        { type: CONSTANTS.NARROW_WATER_BIOME, isAllowed: isTileNarrowWater }
    ];

    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numColumns; j++) {
            randomMap.tileMap.push({ type: CONSTANTS.TILE_HIGHWALL, caveID: -1, tunnelID: -1, biomeID: -1 });
        }
    }

    const numNoiseChannels = 3;
    const noiseColors = [
        [0.05, 0.1, 0.4, 0.15, 0.25, 0.05],
        [1.0, 0.75, 0.625, 0.5, 0.375, 0.25],
        [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        //[1.0, 0.5, 0.25, 0.13, 0.06, 0.03],
    ];
    const noiseExponents = [
        2,
        1,
        3,
    ];
    randomMap.noiseMap = NOISE.doubleNoise2D(seed, numNoiseChannels, numRows, numColumns, noiseColors, noiseExponents);

    /**
     * generate caverns
     * label caves
     * connect caves (label tunnels plus width)
     * label biomes (wide/narrow water/ground)
     * for every tile look at neighbor to the right and above and find edges that way
     * place player in fitting biome
     * place exit in another biome
     * place enemies in fitting locations
     * place items in fitting locations
     */

    const caverns = generateCaverns();
    labelCaves(caverns);
    connectCaves();
    
    const typeBiomes = [];
    for (let biomeType of randomMap.biomeTypes) {
        typeBiomes.push(labelBiomes(biomeType.isAllowed, biomeType.type));
    }
    const wideGroundBiomes = typeBiomes[0];

    buildBiomeGraph();

    // choose random fitting biome and place start
    // choose - if possible - exit point that is in a different biome
    let index = Math.floor((wideGroundBiomes.length - 1) * NOISE.random());
    for (let i = index; i != index - 1; i = (i + 1) % (wideGroundBiomes.length - 1)) {
        if (wideGroundBiomes[i].size > Math.sqrt(numRows * numColumns)) {
            index = i;
            break;
        }
    }
    const playerBiome = wideGroundBiomes[index];
    const start = { i: playerBiome.i, j: playerBiome.j };
    getTile(start.i, start.j).type = CONSTANTS.TILE_ENTRANCE;

    let maxDist = 0;
    let maxIndex = 0;
    for (let i = 0; i < wideGroundBiomes.length; i++) {
        if (wideGroundBiomes[i].size > Math.sqrt(numRows * numColumns)) {
            const dist = Math.hypot(wideGroundBiomes[i].i - playerBiome.i, wideGroundBiomes[i].j - playerBiome.j, 2);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
    }
    const exitBiome = wideGroundBiomes[maxIndex];
    getTile(exitBiome.i, exitBiome.j).type = CONSTANTS.TILE_EXIT;
    
    const pathToExit = findBiomePath(getTile(playerBiome.i, playerBiome.j), getTile(exitBiome.i, exitBiome.j));
    
    const { locationGrid, gridRows, gridColumns } = findFreeLocations(); // entries of locationGrid may be 0

    const items = [];
    for (let biome of pathToExit) {
        if (biome.locations.length > 0) {
            if (NOISE.random() < 0.5) {
                items.push({ type: "coin", i: biome.locations[0].i, j: biome.locations[0].j });
            } else {
                items.push({ type: "heal", i: biome.locations[0].i, j: biome.locations[0].j });
            }
        }
        locationGrid[biome.i * gridColumns + biome.j] = 0;
    }

    const secrets = [];
    /*for (let i = 0; i < 1; i++) {
        let index = Math.floor(NOISE.random() * (gridRows * gridColumns - 1));
        for (let j = 0; j < gridRows * gridColumns; j++) {
            if (locationGrid[index] !== 0) {
                secrets.push({ i: locationGrid[index].i, j: locationGrid[index].j, soundID: "ambient01" });
                locationGrid[index] = 0;
                break;
            }
            index = (index + 1) % (gridRows * gridColumns);
        }
    }*/

    const enemies = [];
    const biome1 = wideGroundBiomes[(index + 5) % wideGroundBiomes.length];
    enemies.push({ i: biome1.i, j: biome1.j, color: [0.5, 0, 0], speed: 5, formID: "snake", aiID: "lightAffine" });
    const biome2 = wideGroundBiomes[(index + 10) % wideGroundBiomes.length];
    enemies.push({ i: biome2.i, j: biome2.j, color: [0.5, 0, 0], speed: 3, formID: "dot", aiID: "proxHunter" });

    const colors = [];
    for (let i = 0; i < randomMap.numRows; i++) {
        for (let j = 0; j < randomMap.numColumns; j++) {
            const tile = getTile(i, j);

            if (tile.type === CONSTANTS.TILE_WALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(Math.min(0.03, randomMap.noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                    colors.push(Math.min(0.03, randomMap.noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                    colors.push(Math.min(0.03, randomMap.noiseMap[i * numColumns + j][0] / 10));//colors.push(0.05);
                }
            } else if (tile.type === CONSTANTS.TILE_DIRT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(randomMap.noiseMap[i * numColumns + j][1] / 4);//colors.push(0.24);
                    colors.push(randomMap.noiseMap[i * numColumns + j][1] / 8);//colors.push(0.15);
                    colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_WATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(randomMap.noiseMap[i * numColumns + j][0] / 3);//randomMap.noiseMap[i * numColumns + j][0] / 10 //colors.push(0.0);
                    colors.push(randomMap.noiseMap[i * numColumns + j][0] / 2);//randomMap.noiseMap[i * numColumns + j][1] / 8 //colors.push(0.2);
                    colors.push(randomMap.noiseMap[i * numColumns + j][1] / 2);//randomMap.noiseMap[i * numColumns + j][1] / 5 //colors.push(0.6);
                }
            } else if (tile.type === CONSTANTS.TILE_DEEPWATER) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(Math.max(0.005, randomMap.noiseMap[i * numColumns + j][0] / 4));//randomMap.noiseMap[i * numColumns + j][0] / 4 //colors.push(0.1);
                    colors.push(Math.max(0.05, randomMap.noiseMap[i * numColumns + j][0] / 1.5));//randomMap.noiseMap[i * numColumns + j][0] / 3 //colors.push(0.3);
                }
            } else if (tile.type === CONSTANTS.TILE_GRASS) {
                for (let k = 0; k < 6; k++) {
                    colors.push(randomMap.noiseMap[i * numColumns + j][0] / 3);//colors.push(0.1);
                    colors.push(randomMap.noiseMap[i * numColumns + j][1] / 2);//colors.push(0.3);
                    colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_HIGHWALL) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.0);
                    colors.push(0.0);
                    colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_PAVED) {
                for (let k = 0; k < 6; k++) {
                    colors.push(1.0);
                    colors.push(0.2);
                    colors.push(0.5);
                }
            } else if (tile.type === CONSTANTS.TILE_EXIT) {
                for (let k = 0; k < 6; k++) {
                    colors.push(1.0);
                    colors.push(0.0);
                    colors.push(1.0);
                }
            } else if (tile.type === CONSTANTS.TILE_ENTRANCE) {
                for (let k = 0; k < 6; k++) {
                    colors.push(0.1);
                    colors.push(0.1);
                    colors.push(0.0);
                }
            }
        }
    }

    return { tileMap: randomMap.tileMap, start, enemies, items, secrets, colors };
}

function generateCaverns() {
    const numZones = { i: 4, j: 4 };
    const numCavernsPerZone = 1;
    const caverns = [];
    const cavernDistMin = 5;
    const cavernSizeMin = 5;
    const cavernSizeMaxMin = 10;
    const cavernSizeMaxMax = 40;

    for (let i = 0; i < numZones.i; i++) {
        for (let j = 0; j < numZones.j; j++) {
            for (let k = 0; k < numCavernsPerZone; k++) {
                const lowerOffset = (i === 0 ? cavernSizeMaxMax : cavernDistMin)                 + i * randomMap.numRows / numZones.i;
                const upperOffset = (i === numZones.i - 1 ? cavernSizeMaxMax : cavernDistMin)    + (numZones.i - i - 1) * randomMap.numRows / numZones.i;
                const leftOffset  = (j === 0 ? cavernSizeMaxMax : cavernDistMin)                 + j * randomMap.numColumns / numZones.j + 5;
                const rightOffset = (j === numZones.j ? cavernSizeMaxMax : cavernDistMin)        + (numZones.j - j - 1) * randomMap.numColumns / numZones.j + 5;

                caverns.push({
                    x: leftOffset + (randomMap.numColumns - leftOffset - rightOffset) * NOISE.random(),
                    y: lowerOffset + (randomMap.numRows - lowerOffset - upperOffset) * NOISE.random(),
                    angle: Math.PI * NOISE.random(),
                    cavernSizeX: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                    cavernSizeY: cavernSizeMaxMin + (cavernSizeMaxMax - cavernSizeMaxMin) * NOISE.random(),
                });
            }
        }
    }

    for (let i = 1; i < randomMap.numRows - 1; i++) {
        for (let j = 1; j < randomMap.numColumns - 1; j++) {
            let tileCenter = MAPUTIL.tileToCenter(i, j);
            for (let k = 0; k < caverns.length; k++) {
                const distToCenter = dist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y);

                if (distToCenter < cavernSizeMin) {
                    getTile(i, j).type = CONSTANTS.TILE_DIRT;
                } else {
                    const ellipseRadius = caverns[k].cavernSizeX * caverns[k].cavernSizeY;
                    const distToMax = ellipseRadius - ellipseDist(tileCenter.x, tileCenter.y, caverns[k].x, caverns[k].y, caverns[k].cavernSizeX, caverns[k].cavernSizeY, caverns[k].angle);

                    if (randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.caveChannel] < (distToMax + 2 * cavernSizeMaxMax) / (1.5 * ellipseRadius)) {
                        if (randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.caveChannel] < distToMax / (1.5 * ellipseRadius)) {
                            getTile(i, j).type = CONSTANTS.TILE_DIRT;
                        } else if (getTile(i, j).type === CONSTANTS.TILE_HIGHWALL) {
                            getTile(i, j).type = CONSTANTS.TILE_WALL;
                        }
                    }
                }
            }
        }
    }

    return caverns;
}

function labelCaves(caverns) {
    randomMap.caves = [];
    let ID = 0;

    for (let i = 0; i < caverns.length; i++) {
        const centerTile = MAPUTIL.coordsToTile(caverns[i].x, caverns[i].y);
        if (getTile(centerTile.i, centerTile.j).caveID === -1) {
            randomMap.caves.push({ i: centerTile.i, j: centerTile.j, ID, systemID: -1, size: 0 });
            const queue = [centerTile];

            while (queue.length > 0) {
                const current = queue.pop();
                getTile(current.i, current.j).caveID = ID;
                randomMap.caves[randomMap.caves.length - 1].size++;

                for (let j = 0; j < 4; j++) {
                    const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };

                    if (getTile(neighbor.i, neighbor.j).caveID === -1
                    && !isTileWall(neighbor.i, neighbor.j)) {
                        queue.push(neighbor);
                    }
                }
            }
            ID++;
        }
    }
}

function connectCaves() {
    let caveSystems = [];
    for (let i = 0; i < randomMap.caves.length; i++) {
        if (randomMap.caves[i].systemID === -1) {
            caveSystems = buildTunnel(randomMap.caves[i], caveSystems);
        }
    }

    while (caveSystems.length > 1) {
        caveSystems = buildTunnel(caveSystems[caveSystems.length - 1][0], caveSystems, caveSystems[caveSystems.length - 2][0]);
    }

    for (let i = 1; i < randomMap.numRows - 1; i++) {
        for (let j = 1; j < randomMap.numColumns - 1; j++) {
            if (getTile(i, j).type === CONSTANTS.TILE_DIRT) {
                if (randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.terrainChannel] > 0.3) {
                    if (randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.terrainChannel] > 0.5) {
                        if (randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.terrainChannel] > 0.6) {
                            getTile(i, j).type = CONSTANTS.TILE_DEEPWATER;
                        } else {
                            getTile(i, j).type = CONSTANTS.TILE_WATER;
                        }
                    }
                } else {
                    getTile(i, j).type = CONSTANTS.TILE_GRASS;
                }
            }
        }
    }
}

function buildTunnel(cave, caveSystems, targetCave) {
    const weightFunction = function weightFunction(i, j) {
        const noiseWeight = randomMap.noiseMap[i * randomMap.numColumns + j][randomMap.tunnelChannel];
        return isTileWall(i, j) ? noiseWeight : 10 + noiseWeight;
    };

    const dig = function (i, j, width) {
        const digTile = function(i, j) {
            if (i < 1 || i > randomMap.numRows - 2 || j < 1 || j > randomMap.numColumns - 2) return;

            const tile = getTile(i, j);
            if (tile.type === CONSTANTS.TILE_HIGHWALL || tile.type === CONSTANTS.TILE_WALL || tile.type === CONSTANTS.TILE_BRICKWALL) {
                tile.type = CONSTANTS.TILE_DIRT;
                tile.tunnelID = randomMap.tunnels.length - 1;
            }
        }

        const makeWall = function(i, j) {
            if (i < 1 || i > randomMap.numRows - 2 || j < 1 || j > randomMap.numColumns - 2) return;
            
            const tile = getTile(i - 1, j);
            if (tile.type === CONSTANTS.TILE_HIGHWALL) {
                tile.type = CONSTANTS.TILE_WALL;
            }
        }

        digTile(i, j); // first layer
        
        if (width > 1) {
            digTile(i - 1, j);// second layer
            digTile(i + 1, j);
            digTile(i, j - 1);
            digTile(i, j + 1);

            if (width > 2) {
                digTile(i - 2, j); // third layer
                digTile(i + 2, j);
                digTile(i, j - 2);
                digTile(i, j + 2);
            } else {
                makeWall(i - 2, j); // third layer
                makeWall(i + 2, j);
                makeWall(i, j - 2);
                makeWall(i, j + 2);
            }
        } else {
            makeWall(i - 1, j);// second layer
            makeWall(i + 1, j);
            makeWall(i, j - 1);
            makeWall(i, j + 1);

            makeWall(i - 2, j); // third layer
            makeWall(i + 2, j);
            makeWall(i, j - 2);
            makeWall(i, j + 2);
        }
        
        makeWall(i - 3, j);  // last layer
        makeWall(i + 3, j);
        makeWall(i, j - 3);
        makeWall(i, j + 3);
    }

    const searchMap = [];
    for (let i = 0; i < randomMap.numColumns; i++) {
        for (let j = 0; j < randomMap.numRows; j++) {
            searchMap.push({
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
  
    const start = searchMap[cave.i * randomMap.numColumns + cave.j];
    start.g = 0;
    start.f = targetCave ? MAPUTIL.manhattan(cave.i, cave.j, targetCave.i, targetCave.j) : 0;
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        const currentCaveID = getTile(current.i, current.j).caveID;
        if (currentCaveID > -1 && currentCaveID < randomMap.caves.length) {
            const currentCave = randomMap.caves[currentCaveID];
            const currentCaveSystemID = currentCave.systemID;

            if ((!targetCave && cave.ID != currentCaveID)
            || (targetCave && targetCave.systemID === currentCaveSystemID)) {
                // target found, build tunnel
                randomMap.tunnels.push({ i: current.i, j: current.j, ID: randomMap.tunnels.length });
                const path = [];
                while (current) {
                    path.push({ i: current.i, j: current.j });
                    current = current.pred;
                }

                const width = NOISE.random() > 0.3 ? 2 : 1;
                let wide = false;
                let varianceLength = 3 + Math.floor(10 * NOISE.random());
                for (let tileNr of path) {
                    if (varianceLength === 0) {
                        varianceLength = 3 + Math.floor(10 * NOISE.random());
                        wide = !wide;
                    }
                    dig(tileNr.i, tileNr.j, wide ? width + 1 : width);
                    varianceLength--;
                }

                if (currentCaveSystemID === -1) {
                    cave.systemID = caveSystems.length;
                    currentCave.systemID = caveSystems.length;
                    caveSystems.push([cave, currentCave]);
                    return caveSystems;
                }

                if (cave.systemID === -1) {
                    cave.systemID = currentCaveSystemID;
                    caveSystems[currentCaveSystemID].push(cave);
                    return caveSystems;
                }

                caveSystems[currentCaveSystemID] = caveSystems[currentCaveSystemID].concat(caveSystems[cave.systemID]);
                for (let systemCave of caveSystems[currentCaveSystemID]) {
                    systemCave.systemID = currentCaveSystemID;
                }
                caveSystems.pop();

                return caveSystems;
            }
        }

        current.closed = true;

        for (let j = 0; j < 4; j++) {
            const neighbor = searchMap[(current.i + CONSTANTS.DIRECTIONS[j].i) * randomMap.numColumns + current.j + CONSTANTS.DIRECTIONS[j].j];

            if (neighbor.closed) continue;
            if (neighbor.i === 0 || neighbor.i === randomMap.numRows - 1 || neighbor.j === 0 || neighbor.j === randomMap.numColumns - 1) continue;

            const nCost = weightFunction(neighbor.i, neighbor.j);
            const g =
                neighbor.i != current.i && neighbor.i != current.j
                ? current.g + nCost * 1.5
                : current.g + nCost;

            if (neighbor.visited && g >= neighbor.g) continue;
            neighbor.pred = current;
            neighbor.g = g;
            neighbor.f = g + (targetCave ? MAPUTIL.manhattan(neighbor.i, neighbor.j, targetCave.i, targetCave.j) : 0);

            if (!neighbor.visited) {
                neighbor.visited = true;
                heap.push(neighbor);
            } else {
                heap.rescoreElement(neighbor);
            }
        }
    }

    return caveSystems;
}

function labelBiomes(isAllowed, biomeType) {
    const biomes = [];

    for (let i = 1; i < randomMap.numRows - 1; i++) {
        for (let j = 1; j < randomMap.numColumns - 1; j++) {
            if (isAllowed(i, j)
            && getTile(i, j).biomeID === -1
            && (getTile(i, j).caveID !== -1 || getTile(i, j).tunnelID !== -1)) {
                const biomeID = randomMap.biomeGraph.biomes.length;
                biomes.push({ i, j, ID: biomeID });
                randomMap.biomeGraph.biomes.push({ i, j, ID: biomeID, type: biomeType, locations: [] });
                const queue = [{ i, j }];
                let size = 0;

                while (queue.length > 0) {
                    const current = queue.pop();
                    getTile(current.i, current.j).biomeID = biomeID;
                    size++;

                    for (let j = 0; j < 4; j++) {
                        const neighbor = { i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j };

                        if (getTile(neighbor.i, neighbor.j).biomeID === -1
                        && isAllowed(neighbor.i, neighbor.j)) {
                            queue.push(neighbor);
                        }
                    }
                }

                biomes[biomes.length - 1].size = size;
                randomMap.biomeGraph.biomes[randomMap.biomeGraph.biomes.length - 1].size = size;
            }
        }
    }

    return biomes;
}

function buildBiomeGraph() {
    const numberBiomes = randomMap.biomeGraph.biomes.length;
    for (let i = 0; i < numberBiomes * numberBiomes; i++) {
        randomMap.biomeGraph.adjMatrix.push(0);
    }
    
    for (let i = 1; i < randomMap.numRows - 2; i++) {
        for (let j = 1; j < randomMap.numColumns - 2; j++) {
            const currentBiome = getTile(i, j).biomeID;
            const upperNeighborBiome = getTile(i + 1, j).biomeID;
            if (currentBiome !== -1
            && upperNeighborBiome !== -1
            && upperNeighborBiome !== currentBiome) {
                randomMap.biomeGraph.adjMatrix[currentBiome * numberBiomes + upperNeighborBiome] = 1;
                randomMap.biomeGraph.adjMatrix[upperNeighborBiome * numberBiomes + currentBiome] = 1;
            }
            const rightNeighborBiome = getTile(i, j + 1).biomeID;
            if (currentBiome !== -1
            && rightNeighborBiome !== -1
            && rightNeighborBiome !== currentBiome) {
                randomMap.biomeGraph.adjMatrix[currentBiome * numberBiomes + rightNeighborBiome] = 1;
                randomMap.biomeGraph.adjMatrix[rightNeighborBiome * numberBiomes + currentBiome] = 1;
            }
        }
    }
}

function findBiomePath(startTile, targetTile) {
    const numberBiomes = randomMap.biomeGraph.biomes.length;
    const searchMap = [];
    for (let i = 0; i < numberBiomes; i++) {
        searchMap.push({
            ID: i,
            visited: false,
            closed: false,
            pred: null,
            weight: undefined
        });
    }
  
    const heap = new BinaryHeap(node => node.weight);
  
    const start = searchMap[startTile.biomeID];
    start.weight = 0;
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        if (current.ID === targetTile.biomeID) {
            const path = [];
            while (current) {
                const biome = randomMap.biomeGraph.biomes[current.ID];
                path.push(biome);
                current = current.pred;
            }
            return path;
        }

        current.closed = true;

        for (let i = 0; i < numberBiomes; i++) {
            if (randomMap.biomeGraph.adjMatrix[i * numberBiomes + current.ID] === 0) continue;

            const neighbor = searchMap[i];
            const weight = current.weight + randomMap.biomeGraph.biomes[neighbor.ID].type;

            if (neighbor.closed) continue;
            if (neighbor.visited && weight >= neighbor.weight) continue;

            neighbor.pred = current;
            neighbor.weight = weight;

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

function findFreeLocations() {
    const fineRows = Math.floor(randomMap.numRows / CONSTANTS.LOCATION_RADIUS);
    const fineColumns = Math.floor(randomMap.numColumns / CONSTANTS.LOCATION_RADIUS);
    const coarseRows = Math.floor(randomMap.numRows / CONSTANTS.LOCATION_DIST);
    const coarseColumns = Math.floor(randomMap.numColumns / CONSTANTS.LOCATION_DIST);
    const fineGrid = [];
    const coarseGrid = [];

    for (let i = 0; i < fineRows * fineColumns; i++) {
        fineGrid.push(0);
        if (i < coarseRows * coarseColumns) {
            coarseGrid.push(0);
        }
    }

    function round(x) {
        const result = Math.round(x);
        return { result, dir: result === Math.floor(x) ? 1 : -1 };
    }

    for (let i = CONSTANTS.LOCATION_RADIUS + 1; i < randomMap.numRows - CONSTANTS.LOCATION_RADIUS - 1; i++) {
        for (let j = CONSTANTS.LOCATION_RADIUS + 1; j < randomMap.numColumns - CONSTANTS.LOCATION_RADIUS - 1; j++) {
            if (getTile(i, j).biomeID === -1) continue;

            const row = round(i / CONSTANTS.LOCATION_RADIUS);
            const column = round(j / CONSTANTS.LOCATION_RADIUS);

            let validIndex = 0;
            let index = (row.result + row.dir) * fineColumns + column.result + column.dir;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = (row.result + row.dir) * fineColumns + column.result;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = row.result * fineColumns + column.result + column.dir;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }
            index = row.result * fineColumns + column.result;
            if (index < fineRows * fineColumns) {
                if (fineGrid[index] !== 0) continue;
                validIndex = index;
            }

            if (isTileGround(i, j)) {
                if (isTileGround(i + CONSTANTS.LOCATION_RADIUS, j)
                && isTileGround(i - CONSTANTS.LOCATION_RADIUS, j)
                && isTileGround(i, j + CONSTANTS.LOCATION_RADIUS)
                && isTileGround(i, j - CONSTANTS.LOCATION_RADIUS)) {
                    fineGrid[validIndex] = { i, j, isAllowed: isTileGround };
                }
            } else if (isTileWater(i, j)) {
                if (isTileWater(i + CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i - CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i, j + CONSTANTS.LOCATION_RADIUS)
                && isTileWater(i, j - CONSTANTS.LOCATION_RADIUS)) {
                    fineGrid[validIndex] = { i, j, isAllowed: isTileWater };
                }
            }
        }
    }

    function areNeighborsFree(i, j, isAllowed) {
        for (let k = 0; k < CONSTANTS.LOCATION_RADIUS; k++) {
            for (let l = 0; l < CONSTANTS.LOCATION_RADIUS - k; l++) {
                if (!isAllowed(i + k, j + l)
                || !isAllowed(i + k, j - l)
                || !isAllowed(i - k, j + l)
                || !isAllowed(i - k, j - l)) {
                    return false;
                }
            }
        }
        return true;
    }

    for (let k = 0; k < fineRows; k++) {
        for (let l = 0; l < fineColumns; l++) {
            const tile = fineGrid[k * fineColumns + l];
            if (tile !== 0) {
                const row = round(tile.i / CONSTANTS.LOCATION_DIST);
                const column = round(tile.j / CONSTANTS.LOCATION_DIST);

                let validIndex = 0;
                let index = (row.result + row.dir) * coarseColumns + column.result + column.dir;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = (row.result + row.dir) * coarseColumns + column.result;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * coarseColumns + column.result + column.dir;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * coarseColumns + column.result;
                if (index < coarseRows * coarseColumns) {
                    if (coarseGrid[index] !== 0) continue;
                    validIndex = index;
                }

                if (areNeighborsFree(tile.i, tile.j, tile.isAllowed)) {
                    coarseGrid[validIndex] = { i: tile.i, j: tile.j };
                    randomMap.biomeGraph.biomes[getTile(tile.i, tile.j).biomeID].locations.push({ i: tile.i, j: tile.j });
                }
            }
        }
    }

    return { locationGrid: coarseGrid, gridRows: coarseRows, gridColumns: coarseColumns };
}

function getTile(i, j) {
    return randomMap.tileMap[i * randomMap.numColumns + j];
}

function norm(x, y) {
    return Math.sqrt(x * x + y * y);
}

function dist(x1, y1, x2, y2) {
    return norm(x1 - x2, y1 - y2);
}

function ellipseDist(x, y, mx, my, rx, ry, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const projX = cos * (x - mx) - sin * (y - my);
    const projY = sin * (x - mx) + cos * (y - my);
    return Math.sqrt(ry * ry * projX * projX + rx * rx * projY * projY);
}

function isTileGround(i, j) {
    return MAPUTIL.isTileGround(i, j, getTile);
}

function isTileWall(i, j) {
    return MAPUTIL.isTileWall(i, j, getTile);
}

function isTileWater(i, j) {
    return MAPUTIL.isTileWater(i, j, getTile);
}

function isTileWideGround(i, j) {
    return MAPUTIL.isTileWideGround(i, j, getTile);
}

function isTileNarrowGround(i, j) {
    return MAPUTIL.isTileNarrowGround(i, j, getTile);
}

function isTileWideWater(i, j) {
    return MAPUTIL.isTileWideWater(i, j, getTile);
}

function isTileNarrowWater(i, j) {
    return MAPUTIL.isTileNarrowWater(i, j, getTile);
}
