import * as CONSTANTS from "./constants.js";
import * as LIGHT from "./light.js";
import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as OVERLAY from "./overlay.js";
import * as PLAYER from "./player.js";
import * as SECRET from "./secret.js";
import * as SOUND from "./sound.js";

let inventory = {
    activeIndex: -1,
    items: [],
    indices: {},
    activeItems: []
};

export function reset() {
    inventory = {
        activeIndex: -1,
        items: [],
        indices: {},
        activeItems: []
    };
}

export function levelReset() {
    inventory.activeItems = [];
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

function addMovingLightProcessFunction(light) {
    light.process = function(counter) {
        if (counter % 10 === 0) {
            if (this.die()) {
                for (let i = this.activeItemIndex + 1; i < inventory.activeItems.length; i++) {
                    --inventory.activeItems[i].activeItemIndex;
                }
                inventory.activeItems.splice(this.activeItemIndex, 1);
                this.remove();
                return;
            }
        }
        this.moveStep(counter);
    };
}

function addHintlightMoveStepFunction(light) {
    light.moveStep = function(counter) {
        if (counter % CONSTANTS.LIGHT_HINTLIGHT_SPEED !== 0) return;

        if (this.route && this.route.length > 0) {
            if (this.position.x >= this.route[this.route.length - 1].x && this.position.x <= this.route[this.route.length - 1].x
                && this.position.y >= this.route[this.route.length - 1].y && this.position.y <= this.route[this.route.length - 1].y) {
                this.route.pop();
            }
            if (this.route.length > 0) {
                this.moving.right = this.position.x < this.route[this.route.length - 1].x;
                this.moving.left = this.position.x > this.route[this.route.length - 1].x;
                this.moving.up = this.position.y < this.route[this.route.length - 1].y;
                this.moving.down = this.position.y > this.route[this.route.length - 1].y;
            } else {
                this.moving = { left: false, up: false, right: false, down: false };
            }
        }

        let x = 0;
        let y = 0;

        if (this.moving.left) {
            x = -CONSTANTS.OBJECT_STRIDE;
        }
        if (this.moving.right) {
            if (x === 0) {
                x = CONSTANTS.OBJECT_STRIDE;
            } else {
                x = 0;
            }
        }

        if (this.moving.up) {
            y = CONSTANTS.OBJECT_STRIDE;
        }
        if (this.moving.down) {
            if (y === 0) {
                y = -CONSTANTS.OBJECT_STRIDE;
            } else {
                y = 0;
            }
        }

        if (x !== 0 || y !== 0) {
            this.changePosition({x, y});
        }

        return;
    };
}

function addSendlightMoveStepFunction(light) {
    light.moveStep = function(counter) {
        if (counter % CONSTANTS.LIGHT_SENDLIGHT_SPEED !== 0) return;

        if (MAP.isOnBeacon([this.position])
        && SECRET.lightUpBeacon(this.position.x, this.position.y, [this.color[0], this.color[1], this.color[2], CONSTANTS.LIGHT_PARTICLE_BRIGHTNESS])) {
            SOUND.play("beacon1");
        }

        let x = 0;
        let y = 0;

        if (this.moving.left) {
            x = -CONSTANTS.OBJECT_STRIDE;
        }
        if (this.moving.right) {
            if (x === 0) {
                x = CONSTANTS.OBJECT_STRIDE;
            } else {
                x = 0;
            }
        }

        if (this.moving.up) {
            y = CONSTANTS.OBJECT_STRIDE;
        }
        if (this.moving.down) {
            if (y === 0) {
                y = -CONSTANTS.OBJECT_STRIDE;
            } else {
                y = 0;
            }
        }

        if (MAP.isNextTileOfType(this.position.x, this.position.y, x, y, CONSTANTS.WALL_TILES)) {
            x = 0;
            y = 0;
        }

        if (x !== 0 || y !== 0) {
            this.changePosition({x, y});
        }

        return;
    };
}

function useHintlight() {
    const { x, y } = PLAYER.getCenter();
    const light = LIGHT.create(x, y, [0.8, 0.5, 1, CONSTANTS.LIGHT_HINTLIGHT_BRIGHTNESS]);

    if (light === null) return;

    light.moving = { left: false, up: false, right: false, down: false };
    light.activeItemIndex = inventory.activeItems.length;
    light.route = MAPUTIL.aStar(MAP.getTileMapInfo(), { x, y }, MAP.getExitCoords(), MAP.isTileNotWall);

    addHintlightMoveStepFunction(light);
    addMovingLightProcessFunction(light);

    inventory.activeItems.push(light);
    changeItemNumber("hintlight", -1);
    SOUND.play("hintlight");
}

function useSendlight() {
    const moving = PLAYER.get().moving;
    if (!moving.left && !moving.up && !moving.right && !moving.down) return;

    const { x, y } = PLAYER.getCenter();
    const light = LIGHT.create(x, y, [1, 0.8, 0.5, CONSTANTS.LIGHT_SENDLIGHT_BRIGHTNESS]);

    if (light === null) return;

    light.moving = { left: moving.left, up: moving.up, right: moving.right, down: moving.down };
    light.activeItemIndex = inventory.activeItems.length;

    addSendlightMoveStepFunction(light);
    addMovingLightProcessFunction(light);

    inventory.activeItems.push(light);
    changeItemNumber("sendlight", -1);
    SOUND.play("particle");
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
        use: useHintlight
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
        use: useSendlight
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
    for (let item of inventory.activeItems) {
        item.process(counter);
    }
}
