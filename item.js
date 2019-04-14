import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";
import * as SOUND from "./sound.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";
import * as SECRET from "./secret.js";
import { increaseScore } from "./index.js";

let items = [];

export function reset() {
    items = [];
}

function create(i, j, color) {
    const item = {
        index: items.length,
        x: 0,
        y: 0,
        mesh: undefined,
        set: function(x, y) {
            if (this.mesh) {
                this.mesh.position.x = x - 0.5;
                this.mesh.position.y = y - 0.5;
            }
            this.x = x;
            this.y = y;
        },
        remove: function() {
            if (this.mesh) STAGE.removeMesh(this.mesh);

            for (let item of items) {
                if (item.index > this.index) {
                    item.index--;
                }
            }
            items.splice(this.index, 1);
        }
    };

    
    if (color) {
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
        item.mesh = new THREE.Mesh(geometry, SHADER.getObjectMaterial());
        STAGE.addMesh(item.mesh);
    }

    const { x, y } = MAPUTIL.tileToCenter(i, j);
    item.set(x, y);
    items.push(item);

    return item;
}

export function createCoin(i, j) {
    const coin = create(i, j, [0.75, 0.75, 0]);

    coin.collect = function() {
        this.set(0, 0);
        increaseScore();
        this.remove();
        SOUND.play("coin");
    };

    return coin;
}

export function createHeal(i, j) {
    const heal = create(i, j, [0.1, 0, 0.1]);

    heal.collect = function() {
        if (!PLAYER.heal()) return;
        this.set(0, 0);
        this.remove();
        SOUND.play("heal");
    };

    return heal;
}

export function createShrine(i, j, index) {
    const shrine = create(i, j, [0, 0.5, 0.75]);

    shrine.collect = function() {
    };

    return shrine;
}

export function createWisp(i, j, index) {
    const wisp = create(i, j);

    wisp.collect = function() {
        this.set(0, 0);
        this.remove();
        SECRET.removeWisp(index);
        SOUND.play("wisp2");
    };

    return wisp;
}

export function createItems(itemList) {
    for (let item of itemList) {
        switch(item.type) {
            case "coin": createCoin(item.i, item.j); break;
            case "heal": createHeal(item.i, item.j); break;
            default: console.log("Unknown item"); break;
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
