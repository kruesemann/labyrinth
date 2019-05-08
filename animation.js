import * as CONSTANTS from "./constants.js";
import * as NOISE from "./noise.js";
import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";

let animations = {};

export function reset() {
    stopAllRunning();
    animations = {};
}

export function stopAllRunning() {
    for (const uuid in animations) {
        if (!animations.hasOwnProperty(uuid)) continue;
        const animation = animations[uuid];
        animation.onEnd();
    }
}

function onEndFunction(uuid) {
    return function() {
        STAGE.removeMesh(animations[uuid].mesh);
        delete animations[uuid];
    };
}

class DanceAnimation {
    constructor(position, danceMoves) {
        this._uuid = NOISE.createUuid();
        this._startTime = Date.now();
        this._time = 2 * CONSTANTS.ANIMATION_DANCE_FADE_TIME + CONSTANTS.ANIMATION_DANCE_TIME;
        this._uniforms = {
            u_counter: {type: 'float', value: 0},
            u_moves: {type: 'vec2', value: new Float32Array(danceMoves)},
        };
        this.onEnd = onEndFunction(this._uuid);

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                                         0,                              0, 0.03,
            CONSTANTS.ANIMATION_DANCE_SIZE,                              0, 0.03,
                                         0, CONSTANTS.ANIMATION_DANCE_SIZE, 0.03,
            CONSTANTS.ANIMATION_DANCE_SIZE,                              0, 0.03,
            CONSTANTS.ANIMATION_DANCE_SIZE, CONSTANTS.ANIMATION_DANCE_SIZE, 0.03,
                                         0, CONSTANTS.ANIMATION_DANCE_SIZE, 0.03,
        ]), 3));

        this._mesh = new THREE.Mesh(geometry, SHADER.getAnimationDanceMaterial(this.uniforms));
        this._mesh.position.x = position.x - CONSTANTS.ANIMATION_DANCE_SIZE / 2;
        this._mesh.position.y = position.y - CONSTANTS.ANIMATION_DANCE_SIZE / 2;

        STAGE.addMesh(this.mesh);
        animations[this._uuid] = this;
    }

    get startTime() {
        return this._startTime;
    }

    get uniforms() {
        return this._uniforms;
    }

    get mesh() {
        return this._mesh;
    }
}

export function playSnakeDance(position) {
    new DanceAnimation(position, [
        -0.4,  0.4,
        -0.4, -0.4,
         0.4, -0.4,
         0.4,  0.4,
        -0.4,  0.4,
    ]);
}

export function playSparks(position, baseColor) {
    const uuid = NOISE.createUuid();

    const directions = [];
    const colors = [];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    for (let i = 0; i < 12; ++i) {
        directions.push(Math.random() - 0.5);
        directions.push(Math.random() - 0.5);
        colors.push(clamp(Math.random() * 0.1 + baseColor[0], 0, 1));
        colors.push(clamp(Math.random() * 0.1 + baseColor[1], 0, 1));
        colors.push(clamp(Math.random() * 0.1 + baseColor[2], 0, 1));
        colors.push(Math.random() * 0.004 + 0.006);
    }

    const animation = {
        uuid,
        startTime: Date.now(),
        time: CONSTANTS.ANIMATION_SPARKS_TIME,
        onEnd: onEndFunction(uuid),
        uniforms: {
            u_counter: {type: 'float', value: 0},
            u_directions: {type: 'vec2', value: new Float32Array(directions)},
            u_colors: {type: 'vec4', value: new Float32Array(colors)},
        }
    };

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                                      0,                               0, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE,                               0, 0.03,
                                      0, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE,                               0, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
                                      0, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
    ]), 3));

    animation.mesh = new THREE.Mesh(geometry, SHADER.getAnimationSparksMaterial(animation.uniforms));
    animation.mesh.position.x = position.x - CONSTANTS.ANIMATION_SPARKS_SIZE / 2;
    animation.mesh.position.y = position.y - CONSTANTS.ANIMATION_SPARKS_SIZE / 2;

    STAGE.addMesh(animation.mesh);
    animations[uuid] = animation;
}

export function playGleam(position, color) {
    const uuid = NOISE.createUuid();

    const animation = {
        uuid,
        startTime: Date.now(),
        time: CONSTANTS.ANIMATION_GLEAM_TIME,
        onEnd: onEndFunction(uuid),
        uniforms: {
            u_counter: {type: 'float', value: 0},
            u_color: {type: 'vec4', value: new Float32Array(color)},
        }
    };

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                                     0,                              0, 0.03,
        CONSTANTS.ANIMATION_GLEAM_SIZE,                              0, 0.03,
                                     0, CONSTANTS.ANIMATION_GLEAM_SIZE, 0.03,
        CONSTANTS.ANIMATION_GLEAM_SIZE,                              0, 0.03,
        CONSTANTS.ANIMATION_GLEAM_SIZE, CONSTANTS.ANIMATION_GLEAM_SIZE, 0.03,
                                     0, CONSTANTS.ANIMATION_GLEAM_SIZE, 0.03,
    ]), 3));

    animation.mesh = new THREE.Mesh(geometry, SHADER.getAnimationGleamMaterial(animation.uniforms));
    animation.mesh.position.x = position.x - CONSTANTS.ANIMATION_GLEAM_SIZE / 2;
    animation.mesh.position.y = position.y - CONSTANTS.ANIMATION_GLEAM_SIZE / 2;

    STAGE.addMesh(animation.mesh);
    animations[uuid] = animation;
}

export function animate() {
    for (const uuid in animations) {
        if (!animations.hasOwnProperty(uuid)) continue;
        const animation = animations[uuid];
        if (animation.uniforms.u_counter.value >= animation.time) {
            animation.onEnd();
        } else {
            animation.uniforms.u_counter.value = Date.now() - animation.startTime;
        }
    }
}
