import * as CONSTANTS from "./constants.js";

const mapVSrc = `
attribute vec4 a_color;
attribute vec4 a_caveID;
attribute vec4 a_groundCompID;
attribute vec4 a_wideCompID;

varying vec3 v_pos;
varying vec4 v_color;
varying vec4 v_caveID;
varying vec4 v_groundCompID;
varying vec4 v_wideCompID;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position;
    v_color = a_color;
    v_caveID = a_caveID;
    v_groundCompID = a_groundCompID;
    v_wideCompID = a_wideCompID;
}
`;

const mapFSrc = `
#define MAXNUM ${CONSTANTS.LIGHT_MAXNUM}
varying vec3 v_pos;
varying vec4 v_color;
varying vec4 v_caveID;
varying vec4 v_groundCompID;
varying vec4 v_wideCompID;

uniform vec2 u_dimensions;
uniform bool u_showCaverns;
uniform bool u_showGroundComps;
uniform bool u_showWideComps;
uniform vec4 u_ambientLight;
uniform vec2 u_lightPos[MAXNUM];
uniform vec4 u_lightColor[MAXNUM];

void main() {
    if (u_showCaverns) {
        gl_FragColor = v_caveID;
    } else if (u_showGroundComps) {
        gl_FragColor = v_groundCompID;
    } else if (u_showWideComps) {
        gl_FragColor = v_wideCompID;
    } else {
        vec3 RGB = vec3(0.0);

        for (int i = 0; i < MAXNUM; i++) {
            RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(distance(v_pos.xy, u_lightPos[i]), 1.0);
        }

        gl_FragColor.rgb = v_color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
        gl_FragColor.a = v_color.a;
    }
}
`;

export let mapUniforms = {
    u_dimensions: { type: 'vec2', value: new Float32Array([0, 0]) },
    u_showCaverns: { type: 'bool', value: false },
    u_showGroundComps: { type: 'bool', value: false },
    u_showWideComps: { type: 'bool', value: false },
    u_ambientLight: { type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0]) },
    u_lightPos: { type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM) },
    u_lightColor: { type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM) },
};

let mapShaderMaterial = new THREE.ShaderMaterial({
    uniforms: mapUniforms,
    vertexShader:   mapVSrc,
    fragmentShader: mapFSrc,
});

export function getMapMaterial() {
    return mapShaderMaterial;
}

const objectVSrc = `
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_color = a_color;
}
`;

const objectFSrc = `
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`;

export let objectUniforms = {
};

let objectShaderMaterial = new THREE.ShaderMaterial({
    uniforms: objectUniforms,
    vertexShader:   objectVSrc,
    fragmentShader: objectFSrc,
});

export function getObjectMaterial() {
    return objectShaderMaterial;
}
