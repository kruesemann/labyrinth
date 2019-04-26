import * as CONSTANTS from "./constants.js";
import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";

let animations = {};
let runningAnimations = [];

export function reset() {
    stopAllRunning();

    animations = {};
    runningAnimations = [];
}

export function stopAllRunning() {
    for (const animation of runningAnimations) {
        animation.onEnd();
    }
} 

function playDance(x, y, width, height, animationID, danceMoves) {
    const vertices = [
            0,      0, 0.03,
        width,      0, 0.03,
            0, height, 0.03,
        width,      0, 0.03,
        width, height, 0.03,
            0, height, 0.03,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    const animation = new THREE.Mesh(geometry, SHADER.getAnimationDanceMaterial());
    animation.position.x = x - width / 2;
    animation.position.y = y - height / 2;

    SHADER.animationDanceUniforms.u_moves.value = new Float32Array(danceMoves);

    if (animations[animationID]) STAGE.removeMesh(animations[animationID]);
    STAGE.addMesh(animation);
    animations[animationID] = animation;
}

function endSnakeDance() {
    STAGE.removeMesh(animations["snakeDance"]);
    animations["snakeDance"] = undefined;
}

export function playSnakeDance(x, y) {
    SHADER.animationDanceUniforms.u_counter.value = 0;

    playDance(x, y, 5, 5, "snakeDance", [
        -0.4,  0.4,
        -0.4, -0.4,
         0.4, -0.4,
         0.4,  0.4,
        -0.4,  0.4,
    ]);

    runningAnimations.push({
        uniformsID: "animationDanceUniforms",
        startTime: Date.now(),
        time: 2 * CONSTANTS.ANIMATION_DANCE_FADE_TIME + CONSTANTS.ANIMATION_DANCE_TIME,
        onEnd: endSnakeDance,
    });
}

function endSparks() {
    STAGE.removeMesh(animations["sparks"]);
    animations["sparks"] = undefined;
}

export function playSparks(x, y, baseColor) {
    if (animations["sparks"]) return;

    const vertices = [
                                      0,                               0, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE,                               0, 0.03,
                                      0, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE,                               0, 0.03,
        CONSTANTS.ANIMATION_SPARKS_SIZE, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
                                      0, CONSTANTS.ANIMATION_SPARKS_SIZE, 0.03,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    const animation = new THREE.Mesh(geometry, SHADER.getAnimationSparksMaterial());
    animation.position.x = x - CONSTANTS.ANIMATION_SPARKS_SIZE / 2;
    animation.position.y = y - CONSTANTS.ANIMATION_SPARKS_SIZE / 2;

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

    SHADER.animationSparksUniforms.u_counter.value = 0;
    SHADER.animationSparksUniforms.u_directions.value = new Float32Array(directions);
    SHADER.animationSparksUniforms.u_colors.value = new Float32Array(colors);

    STAGE.addMesh(animation);
    animations["sparks"] = animation;

    runningAnimations.push({
        uniformsID: "animationSparksUniforms",
        startTime: Date.now(),
        time: CONSTANTS.ANIMATION_SPARKS_TIME,
        onEnd: endSparks,
    });
}

export function animate() {
    for (let i = 0; i < runningAnimations.length; i++) {
        const animation = runningAnimations[i];
        if (SHADER[animation.uniformsID].u_counter.value >= animation.time) {
            runningAnimations.splice(i--, 1);
            animation.onEnd();
        } else {
            SHADER[animation.uniformsID].u_counter.value = Date.now() - animation.startTime;
        }
    }
}
