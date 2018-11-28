import * as SCENE from "./scene.js";
import * as MAP from "./map.js";
import * as SHADER from "./shader.js";
import * as AI from "./ai.js";

function createDotForm(x, y, color) {
    const vertices = [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0,
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

    const form = {
        id: "dot",
        nodes: [{ x: 0, y: 0 }],
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            function add(a, b) {
                return Math.round((a + b) * 10) / 10;
            }

            this.mesh.position.x = add(this.mesh.position.x, dx);
            this.mesh.position.y = add(this.mesh.position.y, dy);
            this.nodes[0].x = add(this.nodes[0].x, dx);
            this.nodes[0].y = add(this.nodes[0].y, dy);
        },
        set: function (x, y) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.nodes[0].x = x + 0.5;
            this.nodes[0].y = y + 0.5;
        },
        isBlocked: function(dx, dy) {
            return !MAP.isNextTileGround(this.nodes[0].x, this.nodes[0].y, dx, dy);
        },
        isAllowed: function(i, j) {
            return MAP.isTileGround(i, j);
        },
        center: function() {
            SCENE.lookAt(this.nodes[0].x, this.nodes[0].y);
        }
    };

    form.set(x, y);
    SCENE.addMesh(form.mesh);

    return form;
}

function createBoxForm(x, y, color) {
    const vertices = [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0,
        
        1, 0, 0,
        2, 0, 0,
        1, 1, 0,
        2, 0, 0,
        2, 1, 0,
        1, 1, 0,
        
        1, 1, 0,
        2, 1, 0,
        1, 2, 0,
        2, 1, 0,
        2, 2, 0,
        1, 2, 0,
        
        0, 1, 0,
        1, 1, 0,
        0, 2, 0,
        1, 1, 0,
        1, 2, 0,
        0, 2, 0,
    ];

    const colors = [];

    for (let i = 0; i < 6 * 4; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const form = {
        id: "box",
        nodes: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
        ],
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            function add(a, b) {
                return Math.round((a + b) * 10) / 10;
            }

            this.mesh.position.x = add(this.mesh.position.x, dx);
            this.mesh.position.y = add(this.mesh.position.y, dy);
            for (let i = 0; i < 4; i++) {
                this.nodes[i].x = add(this.nodes[i].x, dx);
                this.nodes[i].y = add(this.nodes[i].y, dy);
            }
        },
        set: function (x, y) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.nodes = [
                { x: x + 0.5, y: y + 0.5 },
                { x: x + 1.5, y: y + 0.5 },
                { x: x + 1.5, y: y + 1.5 },
                { x: x + 0.5, y: y + 1.5 },
            ];
        },
        isBlocked: function(dx, dy) {
            return MAP.isNextTileWall(this.nodes[0].x, this.nodes[0].y, dx, dy)
                || MAP.isNextTileWall(this.nodes[1].x, this.nodes[1].y, dx, dy)
                || MAP.isNextTileWall(this.nodes[2].x, this.nodes[2].y, dx, dy)
                || MAP.isNextTileWall(this.nodes[3].x, this.nodes[3].y, dx, dy);
        },
        isAllowed: function(i, j) {
            return !MAP.isTileWall(i, j);
        },
        center: function() {
            SCENE.lookAt(this.nodes[0].x + 0.5, this.nodes[0].y + 0.5);
        }
    };

    form.set(x, y);
    SCENE.addMesh(form.mesh);

    return form;
}

function createSnakeForm(x, y, color) {
    const length = 16;

    const vertices = [];
    const nodes = [];
    for (let i = 0; i < length; i++) {
        vertices.push(x);
        vertices.push(y);
        vertices.push(0);
        vertices.push(x + 1);
        vertices.push(y);
        vertices.push(0);
        vertices.push(x);
        vertices.push(y + 1);
        vertices.push(0);
        vertices.push(x + 1);
        vertices.push(y);
        vertices.push(0);
        vertices.push(x + 1);
        vertices.push(y + 1);
        vertices.push(0);
        vertices.push(x);
        vertices.push(y + 1);
        vertices.push(0);

        nodes.push({ x: x + 0.5, y: y + 0.5 });
    }

    const colors = [];

    for (let i = 0; i < 6 * length; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.addAttribute('a_color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const form = {
        id: "snake",
        nodes: nodes,
        mesh: new THREE.Mesh(geometry, SHADER.getObjectMaterial()),
        move: function (dx, dy) {
            function add(a, b) {
                return Math.round((a + b) * 10) / 10;
            }

            this.mesh.geometry.attributes.position.needsUpdate = true;
            const vertices = [];
            for (let j = 0; j < 6; j++) {
                vertices.push(add(this.mesh.geometry.attributes.position.array[j * 3], dx));
                vertices.push(add(this.mesh.geometry.attributes.position.array[j * 3 + 1], dy));
                vertices.push(0);
            }
            for (let i = 1; i < length; i++) {
                for (let j = 0; j < 18; j++) {
                    vertices.push(this.mesh.geometry.attributes.position.array[(i - 1) * 18 + j]);
                }
            }
            this.mesh.geometry.attributes.position.array = new Float32Array(vertices);
            this.mesh.geometry.computeBoundingSphere();
            for (let i = length - 1; i > 0; i--) {
                this.nodes[i].x = this.nodes[i - 1].x;
                this.nodes[i].y = this.nodes[i - 1].y;
            }
            this.nodes[0].x = add(this.nodes[0].x, dx);
            this.nodes[0].y = add(this.nodes[0].y, dy);
        },
        set: function (x, y) {
            this.mesh.geometry.attributes.position.needsUpdate = true;
            const vertices = [];
            for (let i = 0; i < length; i++) {
                vertices.push(x);
                vertices.push(y);
                vertices.push(0);
                vertices.push(x + 1);
                vertices.push(y);
                vertices.push(0);
                vertices.push(x);
                vertices.push(y + 1);
                vertices.push(0);
                vertices.push(x + 1);
                vertices.push(y);
                vertices.push(0);
                vertices.push(x + 1);
                vertices.push(y + 1);
                vertices.push(0);
                vertices.push(x);
                vertices.push(y + 1);
                vertices.push(0);
            }
            this.mesh.geometry.attributes.position.array = new Float32Array(vertices);
            this.mesh.geometry.computeBoundingSphere();

            for (let i = 0; i < length; i++) {
                this.nodes[i].x = x + 0.5;
                this.nodes[i].y = y + 0.5;
            }
        },
        isBlocked: function(dx, dy) {
            return MAP.isNextTileWall(this.nodes[0].x, this.nodes[0].y, dx, dy);
        },
        isAllowed: function(i, j) {
            return !MAP.isTileWall(i, j);
        },
        center: function() {
            SCENE.lookAt(this.nodes[0].x, this.nodes[0].y);
        }
    };

    SCENE.addMesh(form.mesh);

    return form;
}

export function createObject(i, j, color, speed, formName, aiName) {
    let { x, y } = MAP.tileToCoords(i, j);

    let object = {
        form: undefined,
        speed: speed,
        moving: { left: false, up: false, right: false, down: false },
        ai: undefined,
        route: undefined,
        plan: function(counter) {
            if (!this.ai) return;
            let { update, route } = this.ai(this, counter);
            if (update) {
                this.route = route;
            }
        },
        move: function() {
            if (this.route) {
                if (this.route.length > 0) {
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
                        this.moving = { left: false, up: false, right: false, down: false };
                    }
                } else {
                    this.moving = { left: false, up: false, right: false, down: false };
                }
            }

            let dx = 0;
            let dy = 0;

            if (this.moving.left) {
                dx = -this.speed;
            }
            if (this.moving.right) {
                if (dx == 0) {
                    dx = this.speed;
                } else {
                    dx = 0;
                }
            }
            if (this.form.isBlocked(dx, 0)) {
                dx = 0;
            }

            if (this.moving.up) {
                dy = this.speed;
            }
            if (this.moving.down) {
                if (dy == 0) {
                    dy = -this.speed;
                } else {
                    dy = 0;
                }
            }
            if (this.form.isBlocked(0, dy)) {
                dy = 0;
            }

            if (dx != 0 && dy != 0 && this.form.isBlocked(dx, dy)) {
                //dx = 0;
                dy = 0;
            }

            if (dx != 0 || dy != 0) {
                this.form.move(dx, dy);
            }
        },
        transform: function(form, x, y) {
            let pos = undefined;
            if (this.form) {
                pos = this.form.nodes[0];
                SCENE.removeMesh(this.form.mesh);

                pos.x -= 0.5;
                pos.y -= 0.5;
                if (form === "box") {
                    pos.x -= 0.5;
                    pos.y -= 0.5;
                }
                if (this.form.id === "box") {
                    pos.x += 0.5;
                    pos.y += 0.5;
                }
            } else {
                pos = { x, y };
            }

            switch (form) {
                case "dot": object.form = createDotForm(pos.x, pos.y, color); break;
                case "box": object.form = createBoxForm(pos.x, pos.y, color); break;
                case "snake": object.form = createSnakeForm(pos.x, pos.y, color); break;
            }
        },
    };

    object.transform(formName, x, y);

    switch(aiName) {
        case "test": object.ai = function(self, counter) { return AI.test(self, counter); }; break;
    }

    return object;
}
