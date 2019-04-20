import * as OVERLAY from "./overlay.js";
import * as LIGHT from "./light.js";
import * as PLAYER from "./player.js";
import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as SOUND from "./sound.js";
import * as SECRET from "./secret.js";

let inventory = {
    activeIndex: -1,
    items: [],
    indices: {}
};

let activeItems = [];

export function reset() {
    activeItems = [];
}

function changeItemNumber(id, amount) {
    const item = inventory.items[inventory.indices[id]];
    item.number += amount;

    if (item.number !== 0) {
        inventory.activeIndex = item.index;
        OVERLAY.setActiveItem(inventory.items[inventory.activeIndex]);
        return;
    }

    for (let i = item.index + 1; i < inventory.items.length; i++) {
        --inventory.items[i].index;
        --inventory.indices[inventory.items[i].id];
    }
    inventory.items.splice(item.index, 1);
    inventory.indices[id] = undefined;
    inventory.activeIndex = -1;
    OVERLAY.setActiveItem();
}

export function browseLeft() {
    if (!inventory.items.length) return;
    if (--inventory.activeIndex < 0) inventory.activeIndex = inventory.items.length - 1;
    OVERLAY.setActiveItem(inventory.items[inventory.activeIndex]);
}

export function browseRight() {
    if (!inventory.items.length) return;
    if (++inventory.activeIndex >= inventory.items.length) inventory.activeIndex = 0;
    OVERLAY.setActiveItem(inventory.items[inventory.activeIndex]);
}

export function addHintlight(number) {
    if (inventory.indices["hintlight"] !== undefined) {
        changeItemNumber("hintlight", number === undefined ? 1 : number);
        return;
    }

    const hintlight = {
        index: inventory.items.length,
        id: "hintlight",
        name: "Hint light",
        number: number === undefined ? 0 : number - 1,
        use: function() {
            const { x, y } = PLAYER.getCenter();
            const light = LIGHT.create(x, y, [0.8, 0.5, 1, CONSTANTS.LIGHT_HINTLIGHT_BRIGHTNESS]);

            if (light === null) return;

            light.moving = { left: false, up: false, right: false, down: false };
            light.activeItemIndex = activeItems.length;
            light.route = MAPUTIL.aStar(MAP.getTileMapInfo(), { x, y }, MAP.getExitCoords(), function(i, j) { return !MAP.isTileWall(i, j); });

            light.moveStep = function(counter) {
                if (counter % CONSTANTS.LIGHT_HINTLIGHT_SPEED !== 0) return;

                if (this.route && this.route.length > 0) {
                    if (this.pos.x >= this.route[this.route.length - 1].x && this.pos.x <= this.route[this.route.length - 1].x
                        && this.pos.y >= this.route[this.route.length - 1].y && this.pos.y <= this.route[this.route.length - 1].y) {
                        this.route.pop();
                    }
                    if (this.route.length > 0) {
                        this.moving.right = this.pos.x < this.route[this.route.length - 1].x;
                        this.moving.left = this.pos.x > this.route[this.route.length - 1].x;
                        this.moving.up = this.pos.y < this.route[this.route.length - 1].y;
                        this.moving.down = this.pos.y > this.route[this.route.length - 1].y;
                    } else {
                        this.moving = { left: false, up: false, right: false, down: false };
                    }
                }

                let dx = 0;
                let dy = 0;

                if (this.moving.left) {
                    dx = -CONSTANTS.OBJECT_STRIDE;
                }
                if (this.moving.right) {
                    if (dx === 0) {
                        dx = CONSTANTS.OBJECT_STRIDE;
                    } else {
                        dx = 0;
                    }
                }

                if (this.moving.up) {
                    dy = CONSTANTS.OBJECT_STRIDE;
                }
                if (this.moving.down) {
                    if (dy === 0) {
                        dy = -CONSTANTS.OBJECT_STRIDE;
                    } else {
                        dy = 0;
                    }
                }

                if (dx !== 0 || dy !== 0) {
                    this.move(dx, dy);
                }

                return;
            };

            light.process = function(counter) {
                if (counter % 10 === 0) {
                    if (this.die()) {
                        for (let i = this.activeItemIndex + 1; i < activeItems.length; i++) {
                            --activeItems[i].activeItemIndex;
                        }
                        activeItems.splice(this.activeItemIndex, 1);
                        this.remove();
                        return;
                    }
                }
                this.moveStep(counter);
            };

            activeItems.push(light);
            changeItemNumber("hintlight", -1);
            SOUND.play("hintlight");
        }
    };

    inventory.indices["hintlight"] = hintlight.index;
    inventory.items.push(hintlight);
    changeItemNumber("hintlight", 1);
}

export function addSendlight(number) {
    if (inventory.indices["sendlight"] !== undefined) {
        changeItemNumber("sendlight", number === undefined ? 1 : number);
        return;
    }

    const sendlight = {
        index: inventory.items.length,
        id: "sendlight",
        name: "Send light",
        number: number === undefined ? 0 : number - 1,
        use: function() {
            const moving = PLAYER.get().moving;
            if (!moving.left && !moving.up && !moving.right && !moving.down) return;

            const { x, y } = PLAYER.getCenter();
            const light = LIGHT.create(x, y, [1, 0.8, 0.5, CONSTANTS.LIGHT_SENDLIGHT_BRIGHTNESS]);

            if (light === null) return;

            light.moving = { left: moving.left, up: moving.up, right: moving.right, down: moving.down };
            light.activeItemIndex = activeItems.length;

            light.moveStep = function(counter) {
                if (counter % CONSTANTS.LIGHT_SENDLIGHT_SPEED !== 0) return;

                if (MAP.isOnBeacon([this.pos])
                && SECRET.lightUpBeacon(this.pos.x, this.pos.y, [this.color[0], this.color[1], this.color[2], CONSTANTS.LIGHT_PARTICLE_BRIGHTNESS])) {
                    SOUND.play("beacon1");
                }

                let dx = 0;
                let dy = 0;

                if (this.moving.left) {
                    dx = -CONSTANTS.OBJECT_STRIDE;
                }
                if (this.moving.right) {
                    if (dx === 0) {
                        dx = CONSTANTS.OBJECT_STRIDE;
                    } else {
                        dx = 0;
                    }
                }

                if (this.moving.up) {
                    dy = CONSTANTS.OBJECT_STRIDE;
                }
                if (this.moving.down) {
                    if (dy === 0) {
                        dy = -CONSTANTS.OBJECT_STRIDE;
                    } else {
                        dy = 0;
                    }
                }

                if (MAP.isNextTileOfType(this.pos.x, this.pos.y, dx, dy, CONSTANTS.WALL_TILES)) {
                    dx = 0;
                    dy = 0;
                }

                if (dx !== 0 || dy !== 0) {
                    this.move(dx, dy);
                }

                return;
            };

            light.process = function(counter) {
                if (counter % 10 === 0) {
                    if (this.die()) {
                        for (let i = this.activeItemIndex + 1; i < activeItems.length; i++) {
                            --activeItems[i].activeItemIndex;
                        }
                        activeItems.splice(this.activeItemIndex, 1);
                        this.remove();
                        return;
                    }
                }
                this.moveStep(counter);
            };

            activeItems.push(light);
            changeItemNumber("sendlight", -1);
            SOUND.play("particle");
        }
    };

    inventory.indices["sendlight"] = sendlight.index;
    inventory.items.push(sendlight);
    changeItemNumber("sendlight", 1);
}

export function useItem() {
    if (inventory.activeIndex === -1) return;
    inventory.items[inventory.activeIndex].use();
}

export function processActiveItems(counter) {
    for (let item of activeItems) {
        item.process(counter);
    }
}