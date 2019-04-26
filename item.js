import * as GAME from "./game.js";
import * as INVENTORY from "./inventory.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";
import * as SECRET from "./secret.js";
import * as SHADER from "./shader.js";
import * as SOUND from "./sound.js";
import * as STAGE from "./stage.js";

let items = {};

class Item {
    constructor(position, color) {
        this._uuid = `item${position.x}${position.y}${Date.now()}`;
        if (items[this.uuid]) return;
        if (color) {
            this._color = color;

            const vertices = [
                0.25, 0.25, 0.01,
                0.75, 0.25, 0.01,
                0.25, 0.75, 0.01,
                0.75, 0.25, 0.01,
                0.75, 0.75, 0.01,
                0.25, 0.75, 0.01,
            ];
            
            const colors = [];
            for (let k = 0; k < 6; k++) {
                colors.push(color[0]);
                colors.push(color[1]);
                colors.push(color[2]);
            }
            const geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

            this._mesh = new THREE.Mesh(geometry, SHADER.getObjectMaterial());
            STAGE.addMesh(this._mesh);
        }
        this.position = position;
        items[this.uuid] = this;
    }

    get uuid() {
        return this._uuid;
    }

    set position(newPosition) {
        this._position = newPosition;
        if (this._mesh) {
            this._mesh.position.x = newPosition.x - 0.5;
            this._mesh.position.y = newPosition.y - 0.5;
        }
    }

    get position() {
        return this._position;
    }

    collect() {
        //no-op
    }

    remove() {
        if (this._mesh) STAGE.removeMesh(this._mesh);
        delete items[this.uuid];
    }
}

export function reset() {
    items = {};
}

function create(i, j, color) {
    return new Item(MAPUTIL.tileToCenter(i, j), color);
}

function addCoinCollectFunction(coin) {
    coin.collect = function() {
        this.position = {x: 0, y: 0};
        GAME.increaseScore();
        PLAYER.increaseBrightness();
        this.remove();
        SOUND.play("coin");
    };
}

function addWispCollectFunction(wisp, uuid) {
    wisp.collect = function() {
        this.position = {x: 0, y: 0};
        INVENTORY.addHintlight();
        SECRET.removeWisp(uuid);
        this.remove();
        SOUND.play("wisp2");
    };
}

export function createCoin(i, j) {
    const coin = create(i, j, [0.75, 0.75, 0]);
    addCoinCollectFunction(coin);
    return coin;
}

export function createShrine(i, j) {
    const shrine = create(i, j, [0, 0.5, 0.75]);
    return shrine;
}

export function createWisp(i, j, uuid) {
    const wisp = create(i, j);
    addWispCollectFunction(wisp, uuid);
    return wisp;
}

export function createItems(itemList) {
    for (let item of itemList) {
        switch(item.type) {
            case "coin": createCoin(item.i, item.j); break;
            default: console.log("Unknown item"); break;
        }
    }
}

export function collectItemsUnderPlayer() {
    const itemSize = 1;
    const pNodes = PLAYER.get().form.nodes;

    for (let pNode of pNodes) {
        for (const uuid in items) {
            if (!items.hasOwnProperty(uuid)) continue;
            const item = items[uuid];

            if (pNode.x >= item.position.x && pNode.x < item.position.x + itemSize) {
                if (pNode.y >= item.position.y && pNode.y < item.position.y + itemSize) {
                    item.collect();
                    continue;
                } else if (pNode.y <= item.position.y && pNode.y + itemSize > item.position.y) {
                    item.collect();
                    continue;
                }
            } else if (pNode.x <= item.position.x && pNode.x + itemSize > item.position.x) {
                if (pNode.y >= item.position.y && pNode.y < item.position.y + itemSize) {
                    item.collect();
                    continue;
                } else if (pNode.y <= item.position.y && pNode.y + itemSize > item.position.y) {
                    item.collect();
                    continue;
                }
            }
        }
    }
}
