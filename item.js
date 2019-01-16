import * as SHADER from "./shader.js";
import * as SCENE from "./scene.js";
import * as SOUND from "./sound.js";
import * as PLAYER from "./player.js";
import { increaseScore } from "./index.js";

let items = [];

function createItem(x, y, color) {
    const vertices = [
        0.25, 0.25, 0,
        0.75, 0.25, 0,
        0.25, 0.75, 0,
        0.75, 0.25, 0,
        0.75, 0.75, 0,
        0.25, 0.75, 0,
    ];

    const colors = [];

    for (let i = 0; i < 6; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    let geometry = new THREE.BufferGeometry();
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
            SCENE.removeMesh(this.mesh);
            items.splice(this.index, 1);
        }
    };

    item.set(x, y);
    SCENE.addMesh(item.mesh);

    items.push(item);
    return item;
}

export function createCoin(x, y) {
    const coin = createItem(x, y, [0.75, 0.75, 0]);

    coin.collect = function() {
        increaseScore();
        this.remove();
        if (SOUND.coinSound.isPlaying) {
            SOUND.coinSound.stop();
        }
        SOUND.coinSound.play();
    };
}

export function removeAllItems() {
    for (let item of items) {
        SCENE.removeMesh(item.mesh);
    }
    items = [];
}

export function collectItemsUnderPlayer() {
    const itemSize = 1;
    let pNodes = PLAYER.get().form.nodes;

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
