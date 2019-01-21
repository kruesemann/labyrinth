import * as SHADER from "./shader.js";
import * as STAGE from "./stage.js";
import * as EVENT from "./event.js";
import * as PLAYER from "./player.js";
import * as CONSTANTS from "./constants.js";

let animations = {};
let runningAnimations = [];

export function reset() {
    stopAllRunning();

    animations = {};
    runningAnimations = [];
}

export function stopAllRunning() {
    for (let animation of runningAnimations) {
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
}

export function playSnakeDance() {
    SHADER.animationDanceUniforms.u_counter.value = 0;

    const { x, y } = PLAYER.getCenter();
    playDance(x, y, 5, 5, "snakeDance", [
        0.4, -0.4,
        0.4,  0.4,
       -0.4,  0.4,
       -0.4, -0.4,
        0.4, -0.4,
    ]);

    runningAnimations.push({
        uniformsID: "animationDanceUniforms",
        startTime: Date.now(),
        time: 2 * CONSTANTS.ANIMATION_FADE_TIME + CONSTANTS.ANIMATION_DANCE_TIME,
        onEnd: endSnakeDance,
    });
}

export function animate() {
    for (let i = 0; i < runningAnimations.length; i++) {
        const animation = runningAnimations[i];
        if (SHADER[animation.uniformsID].u_counter.value === animation.time) {
            animation.onEnd();
            runningAnimations.splice(i--, 1);
        } else {
            SHADER[animation.uniformsID].u_counter.value = Date.now() - animation.startTime;
        }
    }
}
