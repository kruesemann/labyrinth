import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";
import * as SOUND from "./sound.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";
import { increaseScore } from "./index.js";

let items = [];

export function reset() {
    items = [];
}

function create(i, j, color) {
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

    const item = {
        index: items.length,
        x: 0,
        y: 0,
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        set: function(x, y) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.x = x + 0.5;
            this.y = y + 0.5;
        },
        remove: function() {
            STAGE.removeMesh(this.mesh);
            items.splice(this.index, 1);
        }
    };

    const { x, y } = MAPUTIL.tileToCoords(i, j);
    item.set(x, y);
    STAGE.addMesh(item.mesh);

    items.push(item);
    return item;
}

export function createCoin(i, j) {
    const coin = create(i, j, [0.75, 0.75, 0]);

    coin.collect = function() {
        coin.set(0, 0);
        increaseScore();
        this.remove();
        SOUND.play("coin");
    };
}

export function createHeal(i, j) {
    const heal = create(i, j, [0.75, 0, 0.1]);

    heal.collect = function() {
        if (!PLAYER.heal()) return;
        heal.set(0, 0);
        this.remove();
        SOUND.play("heal");
    };
}

export function createItems(itemList) {
    for (let item of itemList) {
        switch(item.type) {
            case "coin": createCoin(item.i, item.j); break;
            case "heal": createHeal(item.i, item.j); break;
            default: console.log("Unknown item"); return;
        }
    }
}

export function collectItemsUnderPlayer() {
    const itemSize = 1;
    const pNodes = PLAYER.get().form.nodes;

    for (let pNode of pNodes) {
        for (let item of items) {
            if (pNode.x >= item.x && pNode.x < item.x + itemSize) {
                if (pNode.y >= item.y && pNode.y < item.y + itemSize) {
                    item.collect();
                    continue;
                } else if (pNode.y <= item.y && pNode.y + itemSize > item.y) {
                    item.collect();
                    continue;
                }
            } else if (pNode.x <= item.x && pNode.x + itemSize > item.x) {
                if (pNode.y >= item.y && pNode.y < item.y + itemSize) {
                    item.collect();
                    continue;
                } else if (pNode.y <= item.y && pNode.y + itemSize > item.y) {
                    item.collect();
                    continue;
                }
            }
        }
    }
}
