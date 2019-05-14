import * as CONSTANTS from "./constants.js";
import * as MAPUTIL from "./mapUtil.js";
import * as NOISE from "./noise.js";
import { BinaryHeap } from "./heap.js";

let randomMap = undefined;
let features = undefined;
let noiseData = undefined;
let metaData = undefined;
let generationData = undefined;

/**
 * resets all variables
 * 
 * @modifies randomMap
 * @modifies features
 * @modifies noiseData
 * @modifies metaData
 * @modifies generationData
 */
export function reset() {
    randomMap = undefined;
    features = undefined;
    noiseData = undefined;
    metaData = undefined;
    generationData = undefined;
}

/**
 * generates a new random map
 * 
 * @param {number} seed             // map seed generated with game seed and level
 * @param {unsigned int} numRows    // number of tiles in a map column
 * @param {unsigned int} numColumns // number of tiles in a map row 
 * @param {number} gameSeed         // game seed generated randomly or specified by player
 * @param {unsigned int} level      // game level indicating how far down the player is
 * 
 * @modifies randomMap
 * @modifies features
 * @modifies noiseData
 * @modifies metaData
 * @modifies generationData
 * 
 * @returns {array} tileMap         // the tiles of the generated map
 * @returns {coordinates} start     // coordinates where to place the player at the start
 * @returns {array} enemies         // list indicating where to place what enemies
 * @returns {array} items           // list indicating where to place what items
 * @returns {array} secrets         // list indicating where to place what secrets
 * @returns {array} colors          // the colors of the corresponding tiles
 */
export function create(seed, numRows, numColumns, gameSeed, level) {
    randomMap = {
        tileMap: [],    // primary return value
        numRows,
        numColumns,
    };

    // secondary return values
    features = {
        start: undefined,
        exit: undefined,
        enemies: [],
        items: [],
        secrets: [],
        colors: [],
        wayPoints: [],
    };
    
    // randomness
    noiseData= {
        caveChannel: 0,
        waterChannel: 1,
        tunnelChannel: 2,
        terrainChannel: 3,
        grassChannel: 4,
        map: [],
    };

    // information determining what tiles and features to place
    metaData = {
        level,
        type: undefined,
        caveType: undefined,
        waterLevel: -1,
        primaryTile: undefined,
        secondaryTile: undefined,
        distToDeveloped: -1,
        numberBiomeTypes: 0,
        biomeTypes: [],
    };

    // structures and information determining where to place tiles and features
    generationData = {
        caverns: [],
        caves: [],
        tunnels: [],
        biomeGraph: {biomes: [], adjMatrix: []},
        biomeIDsOfType: [],
        pathToExit: undefined,
        locationGrid: undefined, // entries of locationGrid may be 0
        gridRows: undefined,
        gridColumns: undefined,
    };

    initializeRandomMap();
    initializeNoiseData(seed);
    initializeMetaData(seed, gameSeed);

    generateCaverns();      // fills generationData.caverns
    labelCaves();           // fills generationData.caves
    connectCaves();         // fills generationData.tunnels
    placeOtherTiles();      // sets some parts of randomMap.tileMap to water, grass or secondary tiles
    labelAllBiomes();       // fills generationData.biomeGraph.biomes and generationData.biomeIDsOfType
    buildBiomeGraph();      // fills generationData.biomeGraph.adjMatrix
    placeStart();           // sets features.start
    placeExit();            // sets features.exit
    findPathToExit();       // fills generationData.pathToExit
    placeWayPoints();       // fills features.wayPoints
    findFreeLocations();    // fills generationData.locationGrid (entries may be 0) and sets generationData.gridRows and generationData.gridColumns
    placeSecrets();         // fills features.secrets
    placeItems();           // fills features.items
    placeEnemies();         // fills features.enemies
    chooseColors();         // fills features.colors
    
    noiseData = undefined;
    metaData = undefined;
    generationData = undefined;
    return {
        tileMap: randomMap.tileMap,
        start: features.start,
        exit: features.exit,
        enemies: features.enemies,
        items: features.items,
        secrets: features.secrets,
        colors: features.colors,
        wayPoints: features.wayPoints,
    };
}

/**
 * fills randomMap.tileMap with high walls not associated with anything
 * 
 * @modifies randomMap.tileMap
 */
function initializeRandomMap() {
    // tileMap
    for (let i = 0; i < randomMap.numRows; ++i) {
        for (let j = 0; j < randomMap.numColumns; ++j) {
            randomMap.tileMap.push({type: CONSTANTS.TILE_HIGHWALL, caveID: -1, tunnelID: -1, biomeID: -1});
        }
    }
}

/**
 * creates a number of noise maps to help with random placement of tiles and features
 * 
 * @param {number} mapSeed  // map seed generated with game seed and level
 * 
 * @modifies noiseData.map
 */
function initializeNoiseData(mapSeed) {
    NOISE.setMapSeed(mapSeed);
    noiseData.map = NOISE.doubleNoise2D(CONSTANTS.NOISE_CHANNELS, randomMap.numRows, randomMap.numColumns, CONSTANTS.NOISE_COLORS, CONSTANTS.NOISE_EXPONENTS);
}

/**
 * determines metaData based on the map seed and the seeds of some subsequent maps
 * 
 * @param {number} mapSeed  // map seed generated with game seed and level
 * @param {number} gameSeed // game seed generated randomly or specified by player
 * 
 * @modifies metaData
 */
function initializeMetaData(mapSeed, gameSeed) {
    // type
    metaData.type = getMapType(mapSeed, metaData.level);

    // cave type
    const options = [
        {value: CONSTANTS.CAVE_TYPE_CAVESYSTEM, frequency: 18},
        {value: CONSTANTS.CAVE_TYPE_CAVESYSTEM, frequency: 1},
        {value: CONSTANTS.CAVE_TYPE_CAVESYSTEM, frequency: 1},
    ];
    metaData.caveType = NOISE.withFrequencies(options);

    // water level
    switch (metaData.type) {
        case CONSTANTS.MAP_TYPE_GROUND:
            metaData.waterLevel = -1;
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDGROUND:
            metaData.waterLevel = 0.5;
            break;
        case CONSTANTS.MAP_TYPE_DEVELOPED:
            metaData.waterLevel = -1;
            break;
        case CONSTANTS.MAP_TYPE_ROCK:
            metaData.waterLevel = -1;
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDROCK:
            metaData.waterLevel = 0.5;
            break;
        default:
            console.log("water level init: unknown map type");
            break;
    }

    // primary & secondary tiles
    switch (metaData.type) {
        case CONSTANTS.MAP_TYPE_GROUND:
            metaData.primaryTile = CONSTANTS.TILE_DIRT;
            metaData.secondaryTile = CONSTANTS.TILE_ROCK;
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDGROUND:
            metaData.primaryTile = CONSTANTS.TILE_DIRT;
            metaData.secondaryTile = CONSTANTS.TILE_ROCK;
            break;
        case CONSTANTS.MAP_TYPE_DEVELOPED:
            metaData.primaryTile = CONSTANTS.TILE_PAVED;
            metaData.secondaryTile = CONSTANTS.TILE_ROCK;
            break;
        case CONSTANTS.MAP_TYPE_ROCK:
            metaData.primaryTile = CONSTANTS.TILE_ROCK;
            metaData.secondaryTile = CONSTANTS.TILE_DIRT;
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDROCK:
            metaData.primaryTile = CONSTANTS.TILE_ROCK;
            metaData.secondaryTile = CONSTANTS.TILE_DIRT;
            break;
        default:
            console.log("primary & secondary tiles init: unknown map type");
            break;
    }

    // distToDeveloped
    if (metaData.type == CONSTANTS.MAP_TYPE_DEVELOPED) {
        metaData.distToDeveloped = 0;
    } else {
        for (let i = 0; i < 5; ++i) {
            const peekSeed = NOISE.peekSeed(gameSeed, metaData.level + i);
    
            if (getMapType(peekSeed, metaData.level + i + 1) === CONSTANTS.MAP_TYPE_DEVELOPED) {
                metaData.distToDeveloped = i + 1;
                break;
            }
        }
    }

    // biome types
    switch (metaData.type) {
        case CONSTANTS.MAP_TYPE_GROUND:
            metaData.numberBiomeTypes = 2;
            metaData.biomeTypes = [
                {type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround},
                {type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileGround},
            ];
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDGROUND:
            metaData.numberBiomeTypes = 4;
            metaData.biomeTypes = [
                {type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround},
                {type: CONSTANTS.NARROW_WATER_BIOME, isAllowed: isTileNarrowWater},
                {type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileGround},
                {type: CONSTANTS.WIDE_WATER_BIOME, isAllowed: isTileWater},
            ];
            break;
        case CONSTANTS.MAP_TYPE_DEVELOPED:
            metaData.numberBiomeTypes = 2;
            metaData.biomeTypes = [
                {type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround},
                {type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileGround},
            ];
            break;
        case CONSTANTS.MAP_TYPE_ROCK:
            metaData.numberBiomeTypes = 2;
            metaData.biomeTypes = [
                {type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround},
                {type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileGround},
            ];
            break;
        case CONSTANTS.MAP_TYPE_FLOODEDROCK:
            metaData.numberBiomeTypes = 4;
            metaData.biomeTypes = [
                {type: CONSTANTS.NARROW_GROUND_BIOME, isAllowed: isTileNarrowGround},
                {type: CONSTANTS.NARROW_WATER_BIOME, isAllowed: isTileNarrowWater},
                {type: CONSTANTS.WIDE_GROUND_BIOME, isAllowed: isTileGround},
                {type: CONSTANTS.WIDE_WATER_BIOME, isAllowed: isTileWater},
            ];
            break;
        default:
            console.log("biome init: unknown map type");
            break;
    }
}

/**
 * determines the map type based on the given seed and level
 * 
 * @param {number} seed // map seed generated with game seed and level
 */
function getMapType(seed, level) {
    let index;
    for (index = 0; index < CONSTANTS.MAP_TYPE_LEVEL_THRESHHOLDS.length; ++index) {
        if (level < CONSTANTS.MAP_TYPE_LEVEL_THRESHHOLDS[index]) break;
    }

    const options = [
        {value: CONSTANTS.MAP_TYPE_GROUND, frequency: CONSTANTS.MAP_TYPE_FREQ_GROUND[index]},
        {value: CONSTANTS.MAP_TYPE_FLOODEDGROUND, frequency: CONSTANTS.MAP_TYPE_FREQ_FLOODEDGROUND[index]},
        {value: CONSTANTS.MAP_TYPE_DEVELOPED, frequency: CONSTANTS.MAP_TYPE_FREQ_DEVELOPED[index]},
        {value: CONSTANTS.MAP_TYPE_ROCK, frequency: CONSTANTS.MAP_TYPE_FREQ_ROCK[index]},
        {value: CONSTANTS.MAP_TYPE_FLOODEDROCK, frequency: CONSTANTS.MAP_TYPE_FREQ_FLOODEDROCK[index]},
    ];
    
    return NOISE.withFrequencies(options, seed);
}

/**
 * constructs a list of biomes of the specified type
 * 
 * @param {BIOME_TYPE} biomeType
 * 
 * @returns {array} biomes
 */
function getBiomesOfType(biomeType) {
    const biomes = [];
    for (let i = 0; i < generationData.biomeIDsOfType[biomeType].length; ++i)
        biomes.push(generationData.biomeGraph.biomes[generationData.biomeIDsOfType[biomeType][i]]);
    return biomes;
}

/**
 * builds caverns around centers randomly placed on a grid
 * based on distance to centers and noiseData.map values
 * 
 * @modifies randomMap.tileMap[i].type
 * @modifies generationData.caverns
 */
function generateCaverns() {
    const numZones = {i: 4, j: 4};
    const numCavernsPerZone = 1;
    generationData.caverns = [];
    const cavernDistMin = 5;
    const cavernSizeMin = 5;
    const cavernSizeMaxMin = 10;
    const cavernSizeMaxMax = 40;

    for (let i = 0; i < numZones.i; ++i) {
        for (let j = 0; j < numZones.j; ++j) {
            for (let k = 0; k < numCavernsPerZone; ++k) {
                const lowerOffset = (i === 0 ? cavernSizeMaxMax : cavernDistMin)                 + i * randomMap.numRows / numZones.i;
                const upperOffset = (i === numZones.i - 1 ? cavernSizeMaxMax : cavernDistMin)    + (numZones.i - i - 1) * randomMap.numRows / numZones.i;
                const leftOffset  = (j === 0 ? cavernSizeMaxMax : cavernDistMin)                 + j * randomMap.numColumns / numZones.j + 5;
                const rightOffset = (j === numZones.j ? cavernSizeMaxMax : cavernDistMin)        + (numZones.j - j - 1) * randomMap.numColumns / numZones.j + 5;

                generationData.caverns.push({
                    x: NOISE.randomInt(leftOffset, randomMap.numColumns - rightOffset),
                    y: NOISE.randomInt(lowerOffset, randomMap.numRows - upperOffset),
                    angle: NOISE.randomDouble(0, Math.PI),
                    cavernSizeX: NOISE.randomInt(cavernSizeMaxMin, cavernSizeMaxMax),
                    cavernSizeY: NOISE.randomInt(cavernSizeMaxMin, cavernSizeMaxMax),
                });
            }
        }
    }

    for (let i = 1; i < randomMap.numRows - 1; ++i) {
        for (let j = 1; j < randomMap.numColumns - 1; ++j) {
            const tileCenter = MAPUTIL.tileToCenter(i, j);
            for (let k = 0; k < generationData.caverns.length; ++k) {
                const distToCenter = dist(tileCenter.x, tileCenter.y, generationData.caverns[k].x, generationData.caverns[k].y);

                if (distToCenter < cavernSizeMin) {
                    getTile(i, j).type = metaData.primaryTile;
                } else {
                    const ellipseRadius = generationData.caverns[k].cavernSizeX * generationData.caverns[k].cavernSizeY;
                    const distToMax = ellipseRadius - ellipseDist(tileCenter.x,
                                                                  tileCenter.y,
                                                                  generationData.caverns[k].x,
                                                                  generationData.caverns[k].y,
                                                                  generationData.caverns[k].cavernSizeX,
                                                                  generationData.caverns[k].cavernSizeY,
                                                                  generationData.caverns[k].angle);

                    if (noiseData.map[i * randomMap.numColumns + j][noiseData.caveChannel] < (distToMax + 2 * cavernSizeMaxMax) / (1.5 * ellipseRadius)) {
                        if (noiseData.map[i * randomMap.numColumns + j][noiseData.caveChannel] < distToMax / (1.5 * ellipseRadius)) {
                            getTile(i, j).type = metaData.primaryTile;
                        } else if (getTile(i, j).type === CONSTANTS.TILE_HIGHWALL) {
                            getTile(i, j).type = CONSTANTS.TILE_WALL;
                        }
                    }
                }
            }
        }
    }
}

/**
 * finds caves composed of overlapping caverns and labels them
 * 
 * @modifies randomMap.tileMap[i].caveID
 * @modifies generationData.caves
 */
function labelCaves() {
    generationData.caves = [];
    let ID = 0;

    for (let i = 0; i < generationData.caverns.length; ++i) {
        const centerTile = MAPUTIL.coordsToTile(generationData.caverns[i].x, generationData.caverns[i].y);
        if (getTile(centerTile.i, centerTile.j).caveID === -1) {
            generationData.caves.push({i: centerTile.i, j: centerTile.j, ID, systemID: -1, size: 0});
            const queue = [centerTile];

            while (queue.length > 0) {
                const current = queue.pop();
                getTile(current.i, current.j).caveID = ID;
                generationData.caves[generationData.caves.length - 1].size++;

                for (let j = 0; j < 4; ++j) {
                    const neighbor = {i: current.i + CONSTANTS.DIRECTIONS[j].i, j: current.j + CONSTANTS.DIRECTIONS[j].j};

                    if (getTile(neighbor.i, neighbor.j).caveID === -1
                    && !isTileWall(neighbor.i, neighbor.j)) {
                        queue.push(neighbor);
                    }
                }
            }
            ++ID;
        }
    }
}

/**
 * connects all caves to a cave system by building tunnels first to nearest disconnected caves, then to caves of different connected components
 * 
 * @modifies generationData.tunnels // by calling buildTunnel
 */
function connectCaves() {
    let caveSystems = [];
    for (let i = 0; i < generationData.caves.length; ++i) {
        if (generationData.caves[i].systemID === -1) {
            caveSystems = buildTunnel(generationData.caves[i], caveSystems);
        }
    }

    while (caveSystems.length > 1) {
        caveSystems = buildTunnel(caveSystems[caveSystems.length - 1][0], caveSystems, caveSystems[caveSystems.length - 2][0]);
    }
}

/**
 * builds a tunnel between cave and either the nearest cave of another connected component or given targetCave
 * 
 * @param {*} cave          // the start cave
 * @param {*} caveSystems   // the current connected components
 * @param {*} targetCave    // an optional target cave
 * 
 * @modifies randomMap.tileMap
 * @modifies caveSystems
 * 
 * @returns caveSystems     // the updated version
 */
function buildTunnel(cave, caveSystems, targetCave) {
    const weightFunction = function weightFunction(i, j) {
        const noiseWeight = noiseData.map[i * randomMap.numColumns + j][noiseData.tunnelChannel];
        return isTileWall(i, j) ? noiseWeight : 10 + noiseWeight;
    };

    const dig = function (i, j, width) {
        const digTile = function(i, j) {
            if (i < 1 || i > randomMap.numRows - 2 || j < 1 || j > randomMap.numColumns - 2) return;

            const tile = getTile(i, j);
            if (tile.type === CONSTANTS.TILE_HIGHWALL || tile.type === CONSTANTS.TILE_WALL || tile.type === CONSTANTS.TILE_BRICKWALL) {
                tile.type = metaData.primaryTile;
                tile.tunnelID = generationData.tunnels.length - 1;
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
    for (let i = 0; i < randomMap.numColumns; ++i) {
        for (let j = 0; j < randomMap.numRows; ++j) {
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
        if (currentCaveID > -1 && currentCaveID < generationData.caves.length) {
            const currentCave = generationData.caves[currentCaveID];
            const currentCaveSystemID = currentCave.systemID;

            if ((!targetCave && cave.ID !== currentCaveID)
            || (targetCave && targetCave.systemID === currentCaveSystemID)) {
                // target found, build tunnel
                generationData.tunnels.push({i: current.i, j: current.j, ID: generationData.tunnels.length});
                const path = [];
                while (current) {
                    path.push({i: current.i, j: current.j});
                    current = current.pred;
                }

                const width = NOISE.withProbability(0.7) ? 2 : 1;
                let wide = false;
                let varianceLength = NOISE.randomInt(3, 13);
                for (const tileNr of path) {
                    if (varianceLength === 0) {
                        varianceLength = NOISE.randomInt(3, 13);
                        wide = !wide;
                    }
                    dig(tileNr.i, tileNr.j, wide ? width + 1 : width);
                    --varianceLength;
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

        for (let j = 0; j < 4; ++j) {
            const neighbor = searchMap[(current.i + CONSTANTS.DIRECTIONS[j].i) * randomMap.numColumns + current.j + CONSTANTS.DIRECTIONS[j].j];

            if (neighbor.closed) continue;
            if (neighbor.i === 0 || neighbor.i === randomMap.numRows - 1 || neighbor.j === 0 || neighbor.j === randomMap.numColumns - 1) continue;

            const nCost = weightFunction(neighbor.i, neighbor.j);
            const g =
                neighbor.i !== current.i && neighbor.i !== current.j
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

/**
 * places water, grass and secondary tiles based on metaData.waterLevel and noiseData.map values
 * 
 * @modifies randomMap.tileMap[i].type
 */
function placeOtherTiles() {
    for (let i = 1; i < randomMap.numRows - 1; ++i) {
        for (let j = 1; j < randomMap.numColumns - 1; ++j) {
            if (getTile(i, j).type === metaData.primaryTile) {
                if (noiseData.map[i * randomMap.numColumns + j][noiseData.waterChannel] > 1 - metaData.waterLevel) {
                    if (noiseData.map[i * randomMap.numColumns + j][noiseData.waterChannel] > 1 - metaData.waterLevel + 0.1) {
                        getTile(i, j).type = CONSTANTS.TILE_DEEPWATER;
                    } else {
                        getTile(i, j).type = CONSTANTS.TILE_WATER;
                    }
                } else {
                    if (noiseData.map[i * randomMap.numColumns + j][noiseData.terrainChannel] > 0.6) {
                        getTile(i, j).type = metaData.secondaryTile;
                    }
                    if (noiseData.map[i * randomMap.numColumns + j][noiseData.grassChannel] > 0.3) {
                        getTile(i, j).type = CONSTANTS.TILE_GRASS;
                    }
                }
            }
        }
    }
}

/**
 * labels all biomes of all types
 * 
 * @modifies randomMap.tileMap[i].biomeID // by calling labelBiomes
 */
function labelAllBiomes() {
    for (const biomeType of metaData.biomeTypes) {
        labelBiomes(biomeType.isAllowed, biomeType.type);
    }
}

/**
 * labels all biomes of given biomeType with BFS
 * 
 * @param {function} isAllowed      // a boolean valued function indicating if a tile is allowed in given biomeType by taking coordinates
 * @param {BIOME_TYPE} biomeType    // biomeType of biomes to be labeled
 * 
 * @modifies randomMap.tileMap[i].biomeID
 * @modifies generationData.biomeGraph.biomes
 * @modifies generationData.biomeIDsOfType[biomeType]
 */
function labelBiomes(isAllowed, biomeType) {
    generationData.biomeIDsOfType[biomeType] = [];

    for (let i = 1; i < randomMap.numRows - 1; ++i) {
        for (let j = 1; j < randomMap.numColumns - 1; ++j) {
            if (isAllowed(i, j)
            && getTile(i, j).biomeID === -1
            && (getTile(i, j).caveID !== -1 || getTile(i, j).tunnelID !== -1)) {
                const biomeID = generationData.biomeGraph.biomes.length;
                generationData.biomeGraph.biomes.push({i, j, ID: biomeID, type: biomeType, locations: []});
                generationData.biomeIDsOfType[biomeType].push(biomeID);
                const queue = [{i, j}];
                let size = 0;

                while (queue.length > 0) {
                    const current = queue.pop();
                    getTile(current.i, current.j).biomeID = biomeID;
                    ++size;

                    for (let k = 0; k < 4; ++k) {
                        const neighbor = {i: current.i + CONSTANTS.DIRECTIONS[k].i, j: current.j + CONSTANTS.DIRECTIONS[k].j};

                        if (getTile(neighbor.i, neighbor.j).biomeID === -1) {
                            if (isAllowed(neighbor.i, neighbor.j)) {
                                queue.push(neighbor);
                            }
                        }
                    }
                }

                generationData.biomeGraph.biomes[generationData.biomeGraph.biomes.length - 1].size = size;
            }
        }
    }
}

/**
 * constructs the adjacency matrix of biomes based on their neighborhood relations
 * 
 * @modifies generationData.biomeGraph.adjMatrix
 */
function buildBiomeGraph() {
    const numberBiomes = generationData.biomeGraph.biomes.length;
    for (let i = 0; i < numberBiomes * numberBiomes; ++i) {
        generationData.biomeGraph.adjMatrix.push(0);
    }
    
    for (let i = 1; i < randomMap.numRows - 2; ++i) {
        for (let j = 1; j < randomMap.numColumns - 2; ++j) {
            const currentBiome = getTile(i, j).biomeID;
            const upperNeighborBiome = getTile(i + 1, j).biomeID;
            if (currentBiome !== -1
            && upperNeighborBiome !== -1
            && upperNeighborBiome !== currentBiome) {
                generationData.biomeGraph.adjMatrix[currentBiome * numberBiomes + upperNeighborBiome] = 1;
                generationData.biomeGraph.adjMatrix[upperNeighborBiome * numberBiomes + currentBiome] = 1;
            }
            const rightNeighborBiome = getTile(i, j + 1).biomeID;
            if (currentBiome !== -1
            && rightNeighborBiome !== -1
            && rightNeighborBiome !== currentBiome) {
                generationData.biomeGraph.adjMatrix[currentBiome * numberBiomes + rightNeighborBiome] = 1;
                generationData.biomeGraph.adjMatrix[rightNeighborBiome * numberBiomes + currentBiome] = 1;
            }
        }
    }
}

/**
 * finds a path through generationData.biomeGraph with Dijkstra
 * 
 * @param {coordinates} startTile
 * @param {coordinates} targetTile
 */
function findBiomePath(startTile, targetTile) {
    const numberBiomes = generationData.biomeGraph.biomes.length;
    const searchMap = [];
    for (let i = 0; i < numberBiomes; ++i) {
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
                const biome = generationData.biomeGraph.biomes[current.ID];
                path.push(biome);
                current = current.pred;
            }
            return path;
        }

        current.closed = true;

        for (let i = 0; i < numberBiomes; ++i) {
            if (generationData.biomeGraph.adjMatrix[i * numberBiomes + current.ID] === 0) continue;

            const neighbor = searchMap[i];
            const weight = current.weight + generationData.biomeGraph.biomes[neighbor.ID].type;

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

/**
 * determines the starting coordinates in a fitting biome randomly
 * 
 * @modifies randomMap.tileMap[i].type
 * @modifies features.start
 */
function placeStart() {
    const wideGroundBiomes = getBiomesOfType(CONSTANTS.WIDE_GROUND_BIOME);
    let index = NOISE.randomInt(0, wideGroundBiomes.length - 1);
    for (let i = index; i !== index - 1; i = (i + 1) % (wideGroundBiomes.length - 1)) {
        if (wideGroundBiomes[i].size > Math.sqrt(randomMap.numRows * randomMap.numColumns)) {
            index = i;
            break;
        }
    }
    const startBiome = wideGroundBiomes[index];
    features.start = {i: startBiome.i, j: startBiome.j};
    getTile(startBiome.i, startBiome.j).type = CONSTANTS.TILE_ENTRANCE;
}

/**
 * determines the exit coordinates in a fitting biome farthest away from features.start
 * 
 * @modifies randomMap.tileMap[i].type
 * @modifies features.exit
 */
function placeExit() {
    const wideGroundBiomes = getBiomesOfType(CONSTANTS.WIDE_GROUND_BIOME);
    let maxDist = 0;
    let maxIndex = 0;
    for (let i = 0; i < wideGroundBiomes.length; ++i) {
        if (wideGroundBiomes[i].size > Math.sqrt(randomMap.numRows * randomMap.numColumns)) {
            const dist = Math.hypot(wideGroundBiomes[i].i - features.start.i, wideGroundBiomes[i].j - features.start.j, 2);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
    }
    const exitBiome = wideGroundBiomes[maxIndex];
    features.exit = {i: exitBiome.i, j: exitBiome.j};
    getTile(exitBiome.i, exitBiome.j).type = CONSTANTS.TILE_EXIT;
}

/**
 * finds a path through generationData.biomeGraph from features.start to features.exit
 * 
 * @modifies generationData.pathToExit
 */
function findPathToExit() {
    generationData.pathToExit = findBiomePath(getTile(features.start.i, features.start.j), getTile(features.exit.i, features.exit.j));
}

/**
 * places waypoints along a path to the exit
 * 
 * @modifies features.wayPoints
 */
function placeWayPoints() {
    const start = MAPUTIL.tileToCenter(features.start.i, features.start.j);
    const target = MAPUTIL.tileToCenter(features.exit.i, features.exit.j);
    const path = MAPUTIL.aStar({numColumns: randomMap.numColumns, numRows: randomMap.numRows}, start, target, isTileNotWall);
    let counter = 50;
    for (const coords of path) {
        if (counter === 50) {
            features.wayPoints.push(coords);
            counter = 0;
        } else {
            ++counter;
        }
    }
}

/**
 * finds locations with free space in the vicinity for the placement of features
 * 
 * @modifies generationData.locationGrid
 * @modifies generationData.gridRows
 * @modifies generationData.gridColumns
 */
function findFreeLocations() {
    const fineRows = Math.floor(randomMap.numRows / CONSTANTS.LOCATION_RADIUS);
    const fineColumns = Math.floor(randomMap.numColumns / CONSTANTS.LOCATION_RADIUS);
    generationData.gridRows = Math.floor(randomMap.numRows / CONSTANTS.LOCATION_DIST);
    generationData.gridColumns = Math.floor(randomMap.numColumns / CONSTANTS.LOCATION_DIST);
    const fineGrid = [];
    generationData.locationGrid = [];

    for (let i = 0; i < fineRows * fineColumns; ++i) {
        fineGrid.push(0);
        if (i < generationData.gridRows * generationData.gridColumns) {
            generationData.locationGrid.push(0);
        }
    }

    function round(x) {
        const result = Math.round(x);
        return {result, dir: result === Math.floor(x) ? 1 : -1};
    }

    for (let i = CONSTANTS.LOCATION_RADIUS + 1; i < randomMap.numRows - CONSTANTS.LOCATION_RADIUS - 1; ++i) {
        for (let j = CONSTANTS.LOCATION_RADIUS + 1; j < randomMap.numColumns - CONSTANTS.LOCATION_RADIUS - 1; ++j) {
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
                    fineGrid[validIndex] = {i, j, isAllowed: isTileGround};
                }
            } else if (isTileWater(i, j)) {
                if (isTileWater(i + CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i - CONSTANTS.LOCATION_RADIUS, j)
                && isTileWater(i, j + CONSTANTS.LOCATION_RADIUS)
                && isTileWater(i, j - CONSTANTS.LOCATION_RADIUS)) {
                    fineGrid[validIndex] = {i, j, isAllowed: isTileWater};
                }
            }
        }
    }

    function areNeighborsFree(i, j, isAllowed) {
        for (let k = 0; k < CONSTANTS.LOCATION_RADIUS; ++k) {
            for (let l = 0; l < CONSTANTS.LOCATION_RADIUS - k; ++l) {
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

    for (let k = 0; k < fineRows; ++k) {
        for (let l = 0; l < fineColumns; ++l) {
            const tile = fineGrid[k * fineColumns + l];
            if (tile !== 0) {
                const row = round(tile.i / CONSTANTS.LOCATION_DIST);
                const column = round(tile.j / CONSTANTS.LOCATION_DIST);

                let validIndex = 0;
                let index = (row.result + row.dir) * generationData.gridColumns + column.result + column.dir;
                if (index < generationData.gridRows * generationData.gridColumns) {
                    if (generationData.locationGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = (row.result + row.dir) * generationData.gridColumns + column.result;
                if (index < generationData.gridRows * generationData.gridColumns) {
                    if (generationData.locationGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * generationData.gridColumns + column.result + column.dir;
                if (index < generationData.gridRows * generationData.gridColumns) {
                    if (generationData.locationGrid[index] !== 0) continue;
                    validIndex = index;
                }
                index = row.result * generationData.gridColumns + column.result;
                if (index < generationData.gridRows * generationData.gridColumns) {
                    if (generationData.locationGrid[index] !== 0) continue;
                    validIndex = index;
                }

                if (areNeighborsFree(tile.i, tile.j, tile.isAllowed)) {
                    generationData.locationGrid[validIndex] = {i: tile.i, j: tile.j};
                    generationData.biomeGraph.biomes[getTile(tile.i, tile.j).biomeID].locations.push({i: tile.i, j: tile.j});
                }
            }
        }
    }
}

/**
 * finds a random location for features
 * 
 * @param {bool} useCaverns // use cavern centers as possible locations
 * @param {bool} useGrid // use free generationData.locationGrid nodes as possible locations
 * 
 * @modifies generationData.locationGrid
 * 
 * @returns location // the nice random location
 */
function getRandomLocation(useCaverns, useGrid) {
    const locations = [];

    if (useCaverns) {
        for (const cavern of generationData.caverns) {
            const {i, j} = MAPUTIL.coordsToTile(cavern.x, cavern.y);
            const gridIndex = Math.round(i / CONSTANTS.LOCATION_DIST) * generationData.gridColumns + Math.round(j / CONSTANTS.LOCATION_DIST);

            if (generationData.locationGrid[gridIndex] === 0) continue;

            locations.push({i, j});
        }
    }

    if (useGrid && !locations.length) {
        for (let k = 0; k < generationData.gridRows * generationData.gridColumns; ++k) {
            if (generationData.locationGrid[k] === 0) continue;

            locations.push({
                i: generationData.locationGrid[k].i + NOISE.randomInt(- CONSTANTS.LOCATION_RADIUS, CONSTANTS.LOCATION_RADIUS),
                j: generationData.locationGrid[k].j + NOISE.randomInt(- CONSTANTS.LOCATION_RADIUS, CONSTANTS.LOCATION_RADIUS)
            });
        }
    }

    if (!locations.length) return undefined;

    const location = locations[NOISE.randomInt(0, locations.length - 1)];
    generationData.locationGrid[Math.round(location.i / CONSTANTS.LOCATION_DIST) * generationData.gridColumns + Math.round(location.j / CONSTANTS.LOCATION_DIST)] = 0;
    return location;
}

/**
 * places secrets in fitting locations around the map
 * 
 * @modifies randomMap.tileMap
 * @modifies features.secrets
 * @modifies generationData.locationGrid
 */
function placeSecrets() {
    // shrines
    function placeShrineTiles(i, j) {
        for (let k = 0; k < 3; ++k) {
            for (let l = 0; l < 3; ++l) {
                getTile(i + k, j + l).type = CONSTANTS.TILE_PAVED;
                getTile(i + k, j - l).type = CONSTANTS.TILE_PAVED;
                getTile(i - k, j + l).type = CONSTANTS.TILE_PAVED;
                getTile(i - k, j - l).type = CONSTANTS.TILE_PAVED;
            }
        }
        getTile(i, j).type = CONSTANTS.TILE_SHRINE;
    }


    let dot = false;
    let box = false;
    let snake = false;
    for (let i = 0; i < generationData.pathToExit.length; ++i) {
        const biome = generationData.pathToExit[i];
        let formIDs = [];
        if (snake || box && dot) {
            formIDs.push("snake");
            if (biome.type !== CONSTANTS.NARROW_GROUND_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("box");
            }
            if (biome.type !== CONSTANTS.WIDE_WATER_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("dot");
            }
        }
        else if (box) {
            if (biome.type !== CONSTANTS.NARROW_GROUND_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("box");
            } else {
                formIDs.push("snake");
            }
            if (biome.type !== CONSTANTS.WIDE_WATER_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("dot");
            }
        } else if (dot) {
            if (biome.type !== CONSTANTS.NARROW_GROUND_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("box");
            }
            if (biome.type !== CONSTANTS.WIDE_WATER_BIOME
            && biome.type !== CONSTANTS.NARROW_WATER_BIOME) {
                formIDs.push("dot");
            } else {
                formIDs.push("snake");
            }
        }

        if (formIDs.length) {
            if (biome.locations.length > 0) {
                const locationIndex = NOISE.randomInt(0, biome.locations.length - 1);
                features.secrets.push({type: "shrine", i: biome.locations[locationIndex].i, j: biome.locations[locationIndex].j, formIDs});
                generationData.locationGrid[Math.round(biome.locations[locationIndex].i / CONSTANTS.LOCATION_DIST) * generationData.gridColumns + Math.round(biome.locations[locationIndex].j / CONSTANTS.LOCATION_DIST)] = 0;
                dot = box = snake = false;
                placeShrineTiles(biome.locations[locationIndex].i, biome.locations[locationIndex].j);
            } else if (i === generationData.pathToExit.length - 1 || i === 0) {
                features.secrets.push({type: "shrine", i: biome.i, j: biome.j + 2, formIDs});
                generationData.locationGrid[Math.round(biome.i / CONSTANTS.LOCATION_DIST) * generationData.gridColumns + Math.round(biome.j / CONSTANTS.LOCATION_DIST)] = 0;
                dot = box = snake = false;
                placeShrineTiles(biome.i, biome.j + 2);
            } else if (biome.size > 50) {
                features.secrets.push({type: "shrine", i: biome.i, j: biome.j, formIDs});
                generationData.locationGrid[Math.round(biome.i / CONSTANTS.LOCATION_DIST) * generationData.gridColumns + Math.round(biome.j / CONSTANTS.LOCATION_DIST)] = 0;
                dot = box = snake = false;
                placeShrineTiles(biome.i, biome.j);
            }
        }
        
        if (biome.type === CONSTANTS.NARROW_GROUND_BIOME) dot = true;
        else if (biome.type === CONSTANTS.WIDE_WATER_BIOME) box = true;
        else if (biome.type === CONSTANTS.NARROW_WATER_BIOME) snake = true;
    }

    // wisps
    const numWisps = NOISE.randomInt(0, 5);

    for (let i = 0; i < numWisps; ++i) {
        const location = getRandomLocation(false, true);
        if (!location) {
            break;
        }
        const color = [NOISE.randomDouble(0.3, 1), NOISE.randomDouble(0.3, 1), NOISE.randomDouble(0.3, 1), 0];
        const change = NOISE.randomInt(CONSTANTS.LIGHT_WISP_CHANGE_MIN, CONSTANTS.LIGHT_WISP_CHANGE_MAX) / 10;
        features.secrets.push({type: "wisp", i: location.i, j: location.j, color, change});
    }

    // beacons
    function placeBeaconTiles(i, j) {
        getTile(i - 1, j).type = CONSTANTS.TILE_BEACON;
        getTile(i, j - 1).type = CONSTANTS.TILE_BEACON;
        getTile(i, j).type = CONSTANTS.TILE_BEACON;
        getTile(i, j + 1).type = CONSTANTS.TILE_BEACON;
        getTile(i + 1, j).type = CONSTANTS.TILE_BEACON;
    }

    const numBeacons = NOISE.randomInt(1, 3);

    for (let i = 0; i < numBeacons; ++i) {
        const location = getRandomLocation(true, true);
        if (!location) {
            break;
        }
        features.secrets.push({type: "beacon", i: location.i, j: location.j});
        placeBeaconTiles(location.i, location.j);
    }

    // invisibles
    const numInvisibles = NOISE.randomInt(0, 5);

    for (let i = 0; i < numInvisibles; ++i) {
        const location = getRandomLocation(false, true);
        if (!location) {
            break;
        }
        const color = [NOISE.randomDouble(0.3, 1), NOISE.randomDouble(0.3, 1), NOISE.randomDouble(0.3, 1), 0];
        features.secrets.push({type: "invisible", i: location.i, j: location.j, item: {type: "coloredLight", color}});
    }

    // particle puzzles
    const numParticlePuzzles = 1;

    for (let i = 0; i < numParticlePuzzles; ++i) {
        const location = getRandomLocation(true, true);
        if (!location) {
            break;
        }
        const points = [
            {i: location.i + 3, j: location.j},
            {i: location.i - 3, j: location.j}
        ];
        for (const point of points) {
            getTile(point.i, point.j).type = CONSTANTS.TILE_PAVED;
        }
        features.secrets.push({type: "particlePuzzle", i: location.i, j: location.j, points, item: {type: "sendlight", brightness: 20}});
    }
}

/**
 * places items in fitting locations around the map
 * 
 * @modifies features.items
 * @modifies generationData.locationGrid
 */
function placeItems() {
    const numItems = NOISE.randomInt(5, 15);

    for (let i = 0; i < numItems; ++i) {
        const location = getRandomLocation(false, true);
        if (!location) {
            break;
        }
        features.items.push({type: "coin", i: location.i, j: location.j});
    }
}

/**
 * places enemies in fitting locations around the map
 * 
 * @modifies features.enemies
 */
function placeEnemies() {
    const possibleEnemyLocations = [];

    const wideGroundBiomes = getBiomesOfType(CONSTANTS.WIDE_GROUND_BIOME);
    for (let i = 0; i < wideGroundBiomes.length; ++i) {
        if (wideGroundBiomes[i].size > Math.sqrt(randomMap.numRows * randomMap.numColumns)) {
            for (const location of wideGroundBiomes[i].locations) {
                const dist = Math.hypot(location.i - features.start.i, location.j - features.start.j);
                if (dist > 50) {
                    possibleEnemyLocations.push(location);
                }
            }
        }
    }

    if (!possibleEnemyLocations.length) return;
    const index1 = NOISE.randomInt(0, possibleEnemyLocations.length - 1);
    const location1 = possibleEnemyLocations.splice(index1, 1)[0];
    features.enemies.push({i: location1.i, j: location1.j, color: [0.5, 0, 0], speed: 5, formID: "snake", aiID: "lightAffine"});

    if (!possibleEnemyLocations.length) return;
    const index2 = NOISE.randomInt(0, possibleEnemyLocations.length - 1);
    const location2 = possibleEnemyLocations.splice(index2, 1)[0];
    features.enemies.push({i: location2.i, j: location2.j, color: [0.5, 0, 0], speed: 3, formID: "dot", aiID: "proxHunter"});
}

/**
 * determines color variations of tiles based on their type and noiseData.map values
 * 
 * @modifies features.colors
 */
function chooseColors() {
    for (let i = 0; i < randomMap.numRows; ++i) {
        for (let j = 0; j < randomMap.numColumns; ++j) {
            const tile = getTile(i, j);
            
            if (tile.type === CONSTANTS.TILE_WALL) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(Math.min(0.03, noiseData.map[i * randomMap.numColumns + j][0] / 10));//features.colors.push(0.05);
                    features.colors.push(Math.min(0.03, noiseData.map[i * randomMap.numColumns + j][0] / 10));//features.colors.push(0.05);
                    features.colors.push(Math.min(0.03, noiseData.map[i * randomMap.numColumns + j][0] / 10));//features.colors.push(0.05);
                }
            } else if (tile.type === CONSTANTS.TILE_DIRT) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][1] / 4);//features.colors.push(0.24);
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][1] / 8);//features.colors.push(0.15);
                    features.colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_ROCK) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][1] / 4);//features.colors.push(0.5);
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][1] / 4);//features.colors.push(0.5);
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][1] / 4);//features.colors.push(0.5);
                }
            } else if (tile.type === CONSTANTS.TILE_WATER) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(noiseData.map[i * randomMap.numColumns + j][0] / 3);//noiseData.map[i * randomMap.numColumns + j][0] / 10 //features.colors.push(0.0);
                    features.colors.push(Math.max(0.005, noiseData.map[i * randomMap.numColumns + j][0] / 2));//noiseData.map[i * randomMap.numColumns + j][1] / 8 //features.colors.push(0.2);
                    features.colors.push(Math.max(0.05, noiseData.map[i * randomMap.numColumns + j][1] / 2));//noiseData.map[i * randomMap.numColumns + j][1] / 5 //features.colors.push(0.6);
                }
            } else if (tile.type === CONSTANTS.TILE_DEEPWATER) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.0);
                    features.colors.push(Math.max(0.005, noiseData.map[i * randomMap.numColumns + j][0] / 4));//noiseData.map[i * randomMap.numColumns + j][0] / 4 //features.colors.push(0.1);
                    features.colors.push(Math.max(0.05, noiseData.map[i * randomMap.numColumns + j][0] / 1.5));//noiseData.map[i * randomMap.numColumns + j][0] / 3 //features.colors.push(0.3);
                }
            } else if (tile.type === CONSTANTS.TILE_GRASS) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(Math.max(0.005, noiseData.map[i * randomMap.numColumns + j][4] / 12));//features.colors.push(0.1);
                    features.colors.push(Math.max(0.05, noiseData.map[i * randomMap.numColumns + j][1] / 8));//features.colors.push(0.3);
                    features.colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_HIGHWALL) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.0);
                    features.colors.push(0.0);
                    features.colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_PAVED) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.05);
                    features.colors.push(0.015);
                    features.colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_EXIT) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(1.0);
                    features.colors.push(0.0);
                    features.colors.push(1.0);
                }
            } else if (tile.type === CONSTANTS.TILE_ENTRANCE) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.1);
                    features.colors.push(0.1);
                    features.colors.push(0.0);
                }
            } else if (tile.type === CONSTANTS.TILE_SHRINE) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.0);
                    features.colors.push(0.05);
                    features.colors.push(0.1);
                }
            } else if (tile.type === CONSTANTS.TILE_BEACON) {
                for (let k = 0; k < 6; ++k) {
                    features.colors.push(0.2);
                    features.colors.push(0.1);
                    features.colors.push(0);
                }
            }

            /*for (let k = 0; k < 6; ++k) {
                if (tile.biomeID === -1) {
                    features.colors.push(0);
                    features.colors.push(0);
                    features.colors.push(0);
                } else if (generationData.biomeGraph.biomes[tile.biomeID].type === CONSTANTS.WIDE_GROUND_BIOME) {
                    features.colors.push(0);
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                    features.colors.push(0);
                } else if (generationData.biomeGraph.biomes[tile.biomeID].type === CONSTANTS.NARROW_GROUND_BIOME) {
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                    features.colors.push(0);
                } else if (generationData.biomeGraph.biomes[tile.biomeID].type === CONSTANTS.WIDE_WATER_BIOME) {
                    features.colors.push(0);
                    features.colors.push(0);
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                } else if (generationData.biomeGraph.biomes[tile.biomeID].type === CONSTANTS.NARROW_WATER_BIOME) {
                    features.colors.push(0);
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                    features.colors.push((tile.biomeID + 10) / (generationData.biomeGraph.biomes.length + 10));
                }
            }*/
        }
    }
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

function isTileNotWall(i, j) {
    return !isTileWall(i, j);
}

function isTileWater(i, j) {
    return MAPUTIL.isTileWater(i, j, getTile);
}

function isTileNarrow(i, j, isAllowed) {
    if (!isAllowed(i, j)) return false;

    // adjacent tiles
    if (!isAllowed(i, j - 1) && !isAllowed(i, j + 1)) return true;
    if (!isAllowed(i - 1, j) && !isAllowed(i + 1, j)) return true;
    
    // diagonal tiles
    for (let k = 4; k < 8; ++k) {
        const dir = CONSTANTS.DIRECTIONS[k];
        if (isAllowed(i + dir.i, j + dir.j)) continue;
        if (!isAllowed(i - dir.i, j)) {
            if (!isAllowed(i + dir.i, j - dir.j)) return true;
            return isAllowed(i, j + dir.j);
        }
        if (!isAllowed(i, j - dir.j)) {
            if (!isAllowed(i - dir.i, j + dir.j)) return true;
            return isAllowed(i + dir.i, j);
        }
        if (!isAllowed(i - dir.i, j - dir.j)) return true;
    }
    
    return false;
}

function isTileNarrowGround(i, j) {
    return isTileNarrow(i, j, isTileGround);
}

function isTileNarrowWater(i, j) {
    return isTileNarrow(i, j, isTileWater);
}
