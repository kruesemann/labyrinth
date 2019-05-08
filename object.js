import * as AI from "./ai.js";
import * as ANIMATION from "./animation.js";
import * as CONSTANTS from "./constants.js";
import * as MAP from "./map.js";
import * as MAPUTIL from "./mapUtil.js";
import * as PLAYER from "./player.js";
import * as SHADER from "./shader.js";
import * as SOUND from "./sound.js";
import * as STAGE from "./stage.js";
import * as UTILITY from "./utility.js";

let enemies = [];

export function reset() {
    enemies = [];
}

function createDotForm(x, y, color) {
    const vertices = [
        0, 0, 0.02,
        1, 0, 0.02,
        0, 1, 0.02,
        1, 0, 0.02,
        1, 1, 0.02,
        0, 1, 0.02,
    ];

    const colors = [];

    for (let i = 0; i < 6; ++i) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    const geometry = new THREE.BufferGeometry(); 
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const form = {
        ID: "dot",
        nodes: [{x: 0, y: 0}],
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            this.mesh.position.x = UTILITY.add(this.mesh.position.x, dx);
            this.mesh.position.y = UTILITY.add(this.mesh.position.y, dy);
            this.nodes[0].x = UTILITY.add(this.nodes[0].x, dx);
            this.nodes[0].y = UTILITY.add(this.nodes[0].y, dy);
        },
        set: function (x, y) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.nodes[0].x = x + 0.5;
            this.nodes[0].y = y + 0.5;
        },
        isBlocked: function(dx, dy) {
            return MAP.isNextTileOfType(this.nodes[0].x, this.nodes[0].y, dx, dy, CONSTANTS.FORBIDDEN_DOT_TILES);
        },
        isAllowed: function(i, j) {
            return MAP.isTileGround(i, j);
        },
        getCenter: function() {
            return this.nodes[0];
        },
        center: function() {
            const {x, y} = this.getCenter();
            STAGE.lookAt(x, y);
        }
    };

    form.set(x, y);
    STAGE.addMesh(form.mesh);

    return form;
}

function createBoxForm(x, y, color) {
    const vertices = [
        0, 0, 0.02,
        1, 0, 0.02,
        0, 1, 0.02,
        1, 0, 0.02,
        1, 1, 0.02,
        0, 1, 0.02,
        
        1, 0, 0.02,
        2, 0, 0.02,
        1, 1, 0.02,
        2, 0, 0.02,
        2, 1, 0.02,
        1, 1, 0.02,
        
        1, 1, 0.02,
        2, 1, 0.02,
        1, 2, 0.02,
        2, 1, 0.02,
        2, 2, 0.02,
        1, 2, 0.02,
        
        0, 1, 0.02,
        1, 1, 0.02,
        0, 2, 0.02,
        1, 1, 0.02,
        1, 2, 0.02,
        0, 2, 0.02,
    ];

    const colors = [];

    for (let i = 0; i < 6 * 4; ++i) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const form = {
        ID: "box",
        nodes: [
            {x: 0, y: 0},
            {x: 0, y: 0},
            {x: 0, y: 0},
            {x: 0, y: 0},
        ],
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            function add(a, b) {
                return Math.round((a + b) * 10) / 10;
            }

            this.mesh.position.x = add(this.mesh.position.x, dx);
            this.mesh.position.y = add(this.mesh.position.y, dy);
            for (let i = 0; i < 4; ++i) {
                this.nodes[i].x = add(this.nodes[i].x, dx);
                this.nodes[i].y = add(this.nodes[i].y, dy);
            }
        },
        set: function (x, y) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.nodes = [
                {x: x + 0.5, y: y + 0.5},
                {x: x + 1.5, y: y + 0.5},
                {x: x + 1.5, y: y + 1.5},
                {x: x + 0.5, y: y + 1.5},
            ];
        },
        isBlocked: function(dx, dy) {
            return MAP.isNextTileOfType(this.nodes[0].x, this.nodes[0].y, dx, dy, CONSTANTS.FORBIDDEN_BOX_TILES)
                || MAP.isNextTileOfType(this.nodes[1].x, this.nodes[1].y, dx, dy, CONSTANTS.FORBIDDEN_BOX_TILES)
                || MAP.isNextTileOfType(this.nodes[2].x, this.nodes[2].y, dx, dy, CONSTANTS.FORBIDDEN_BOX_TILES)
                || MAP.isNextTileOfType(this.nodes[3].x, this.nodes[3].y, dx, dy, CONSTANTS.FORBIDDEN_BOX_TILES);
        },
        isAllowed: function(i, j) {
            return !MAP.isTileWall(i, j);
        },
        getCenter: function() {
            return {x: this.nodes[0].x + 0.5, y: this.nodes[0].y + 0.5};
        },
        center: function() {
            const {x, y} = this.getCenter();
            STAGE.lookAt(x, y);
        }
    };

    form.set(x, y);
    STAGE.addMesh(form.mesh);

    return form;
}

function createSnakeForm(x, y, color) {
    const length = 16;

    const vertices = [];
    const nodes = [];
    for (let i = 0; i < length; ++i) {
        vertices.push(x);
        vertices.push(y);
        vertices.push(0.02);
        vertices.push(x + 1);
        vertices.push(y);
        vertices.push(0.02);
        vertices.push(x);
        vertices.push(y + 1);
        vertices.push(0.02);
        vertices.push(x + 1);
        vertices.push(y);
        vertices.push(0.02);
        vertices.push(x + 1);
        vertices.push(y + 1);
        vertices.push(0.02);
        vertices.push(x);
        vertices.push(y + 1);
        vertices.push(0.02);

        nodes.push({x: x + 0.5, y: y + 0.5});
    }

    const colors = [];

    for (let i = 0; i < 6 * length; ++i) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const form = {
        ID: "snake",
        nodes: nodes,
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            function add(a, b) {
                return Math.round((a + b) * 10) / 10;
            }

            this.mesh.geometry.attributes.position.needsUpdate = true;
            const vertices = [];
            for (let i = 0; i < 6; ++i) {
                vertices.push(add(this.mesh.geometry.attributes.position.array[i * 3], dx));
                vertices.push(add(this.mesh.geometry.attributes.position.array[i * 3 + 1], dy));
                vertices.push(0);
            }
            for (let i = 1; i < length; ++i) {
                for (let j = 0; j < 18; ++j) {
                    vertices.push(this.mesh.geometry.attributes.position.array[(i - 1) * 18 + j]);
                }
            }
            this.mesh.geometry.attributes.position.array = new Float32Array(vertices);
            this.mesh.geometry.computeBoundingSphere();
            for (let i = length - 1; i > 0; --i) {
                this.nodes[i].x = this.nodes[i - 1].x;
                this.nodes[i].y = this.nodes[i - 1].y;
            }
            this.nodes[0].x = add(this.nodes[0].x, dx);
            this.nodes[0].y = add(this.nodes[0].y, dy);
        },
        set: function (x, y) {
            this.mesh.geometry.attributes.position.needsUpdate = true;
            const vertices = [];
            for (let i = 0; i < length; ++i) {
                vertices.push(x);
                vertices.push(y);
                vertices.push(0.02);
                vertices.push(x + 1);
                vertices.push(y);
                vertices.push(0.02);
                vertices.push(x);
                vertices.push(y + 1);
                vertices.push(0.02);
                vertices.push(x + 1);
                vertices.push(y);
                vertices.push(0.02);
                vertices.push(x + 1);
                vertices.push(y + 1);
                vertices.push(0.02);
                vertices.push(x);
                vertices.push(y + 1);
                vertices.push(0.02);
            }
            this.mesh.geometry.attributes.position.array = new Float32Array(vertices);
            this.mesh.geometry.computeBoundingSphere();

            for (let i = 0; i < length; ++i) {
                this.nodes[i].x = x + 0.5;
                this.nodes[i].y = y + 0.5;
            }
        },
        isBlocked: function(dx, dy) {
            return MAP.isNextTileOfType(this.nodes[0].x, this.nodes[0].y, dx, dy, CONSTANTS.FORBIDDEN_SNAKE_TILES);
        },
        isAllowed: function(i, j) {
            return !MAP.isTileWall(i, j);
        },
        getCenter: function() {
            return this.nodes[0];
        },
        center: function() {
            const {x, y} = this.getCenter();
            STAGE.lookAt(x, y);
        }
    };

    STAGE.addMesh(form.mesh);

    return form;
}

function formPlan(self, counter, ai) {
    setTimeout(_ => {
        ai(self, counter);
    }, 0);
}

function create(i, j, color, speed, formID, aiID) {
    const {x, y} = MAPUTIL.tileToCoords(i, j);

    const object = {
        form: undefined,
        speed: speed,
        moving: {left: false, up: false, right: false, down: false},
        ai: undefined,
        route: undefined,
        state: {action: CONSTANTS.ACTION_IDLE, start: 0},
        plan: function(counter) {
            if (!this.ai) return;

            if (this.state.action === CONSTANTS.ACTION_CHARGING) {
                SOUND.loop("charging", 100, this.getCenter(), 60);
            }
            
            formPlan(this, counter, this.ai);
        },
        implementPlan: function(plan, counter) {
            if (plan.update) {
                if (plan.route.length) {
                    this.route = plan.route;
                    if (this.state.action !== CONSTANTS.ACTION_CHARGING) {
                        this.state = {action: CONSTANTS.ACTION_CHARGING, start: counter};
                        SOUND.play("charge", false, this.getCenter(), 50);
                    }
                    return;
                }
            }

            if (this.route && this.route.length) return;

            if (this.state.action === CONSTANTS.ACTION_CHARGING) {
                this.state = {action: CONSTANTS.ACTION_IDLE, start: counter};
                SOUND.fadeOut("charging", 1000);
            }

            formPlan(this, counter, AI.idle);
        },
        idle: function(plan) {
            if (!plan.update) return;
            SOUND.play("idle", false, this.getCenter(), 40);
            this.route = plan.route;
        },
        move: function(counter) {
            if (counter % this.speed !== 0) return false;

            if (this.route && this.route.length > 0) {
                if (this.form.nodes[0].x >= this.route[this.route.length - 1].x && this.form.nodes[0].x <= this.route[this.route.length - 1].x
                    && this.form.nodes[0].y >= this.route[this.route.length - 1].y && this.form.nodes[0].y <= this.route[this.route.length - 1].y) {
                    this.route.pop();
                }
                if (this.route.length > 0) {
                    this.moving.right = this.form.nodes[0].x < this.route[this.route.length - 1].x;
                    this.moving.left = this.form.nodes[0].x > this.route[this.route.length - 1].x;
                    this.moving.up = this.form.nodes[0].y < this.route[this.route.length - 1].y;
                    this.moving.down = this.form.nodes[0].y > this.route[this.route.length - 1].y;
                } else {
                    this.moving = {left: false, up: false, right: false, down: false};
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
            if (this.form.isBlocked(dx, 0)) {
                dx = 0;
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
            if (this.form.isBlocked(0, dy)) {
                dy = 0;
            }

            if (dx !== 0 && dy !== 0 && this.form.isBlocked(dx, dy)) {
                if (this.form.isBlocked(-dx, dy)) {
                    dx = 0;
                } else {
                    dy = 0;
                }
            }

            if (dx !== 0 || dy !== 0) {
                this.form.move(dx, dy);
                return true;
            }

            return false;
        },
        getHead: function() {
            return this.form.nodes[0];
        },
        getTail: function() {
            return this.form.nodes[this.form.nodes.length - 1];
        },
        getCenter: function() {
            return this.form.getCenter();
        },
        transform: function(formID, x, y) {
            let pos = undefined;
            if (this.form) {
                if (this.form.ID === formID) return false;

                pos = this.form.nodes[0];
                STAGE.removeMesh(this.form.mesh);

                pos.x -= 0.5;
                pos.y -= 0.5;
                if (formID === "box") {
                    pos.x -= 0.5;
                    pos.y -= 0.5;
                }
                if (this.form.ID === "box") {
                    pos.x += 0.5;
                    pos.y += 0.5;
                }
            } else {
                pos = {x, y};
            }

            switch (formID) {
                case "dot": this.form = createDotForm(pos.x, pos.y, color); break;
                case "box": this.form = createBoxForm(pos.x, pos.y, color); break;
                case "snake": this.form = createSnakeForm(pos.x, pos.y, color); break;
                default: return false;
            }
            return true;
        },
    };

    object.transform(formID, x, y);

    switch(aiID) {
        case "proxHunter":
            object.ai = function(self, counter) {
                return AI.proxHunter(self, counter);
            };
            object.route = [];
            break;
        case "lightAffine":
            object.ai = function(self, counter) {
                return AI.lightAffine(self, counter);
            };
            object.route = [];
            break;
    }

    return object;
}

export function createEnemy(i, j, color, speed, formID, aiID) {
    const enemy = create(i, j, color, speed, formID, aiID);
    enemies.push(enemy);
}

export function createEnemies(enemyList) {
    for (const enemy of enemyList) {
        createEnemy(enemy.i, enemy.j, enemy.color, enemy.speed, enemy.formID, enemy.aiID);
    }
}

export function createPlayer(i, j, color, speed, formID) {
    return create(i, j, color, speed, formID);
}

export function planEnemies(counter) {
    for (let enemy of enemies) {
        enemy.plan(counter);
    }
}

export function moveEnemies(counter) {
    for (let enemy of enemies) {
        enemy.move(counter);
    }
}

export function collisionWithPlayer() {
    const pNodes = PLAYER.get().form.nodes;

    for (const enemy of enemies) {
        const oNodes = enemy.form.nodes;

        for (const pNode of pNodes) {
            for (const oNode of oNodes) {
                if (pNode.x >= oNode.x && pNode.x < oNode.x + 1) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + 1) {
                        ANIMATION.playSparks(pNode, PLAYER.getLightColor());
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + 1 > oNode.y) {
                        ANIMATION.playSparks(pNode, PLAYER.getLightColor());
                        return true;
                    }
                } else if (pNode.x <= oNode.x && pNode.x + 1 > oNode.x) {
                    if (pNode.y >= oNode.y && pNode.y < oNode.y + 1) {
                        ANIMATION.playSparks(pNode, PLAYER.getLightColor());
                        return true;
                    } else if (pNode.y <= oNode.y && pNode.y + 1 > oNode.y) {
                        ANIMATION.playSparks(pNode, PLAYER.getLightColor());
                        return true;
                    }
                }
            }
        }
    }

    return false;
}
