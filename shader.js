import * as CONSTANTS from "./constants.js";

const mapTextureVSrc = `
attribute vec4 a_color;

uniform vec2 u_dimensions;

varying vec4 v_color;

void main() {
    gl_Position.xy = vec2(2.0 * position.xy / u_dimensions - vec2(1.0));
    gl_Position.zw = vec2(0.0, 1.0);
    v_color = a_color;
}
`;

const mapTextureFSrc = `
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`;

export let mapTextureUniforms = {
    u_dimensions: { type: 'vec2', value: new Float32Array(2) },
};

let mapTextureShaderMaterial = new THREE.ShaderMaterial({
    uniforms: mapTextureUniforms,
    vertexShader:   mapTextureVSrc,
    fragmentShader: mapTextureFSrc,
});

export function getMapTextureMaterial() {
    return mapTextureShaderMaterial;
}

const mapVSrc = `
attribute vec2 a_texelCoords;
attribute vec4 a_color;
attribute vec4 a_caveID;
attribute vec4 a_groundCompID;
attribute vec4 a_wideCompID;

uniform vec2 u_dimensions;

varying vec3 v_pos;
varying vec2 v_texelCoords;
varying vec4 v_color;
varying vec4 v_caveID;
varying vec4 v_groundCompID;
varying vec4 v_wideCompID;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position;
    v_texelCoords = a_texelCoords;
    v_color = a_color;
    v_caveID = a_caveID;
    v_groundCompID = a_groundCompID;
    v_wideCompID = a_wideCompID;
}
`;

const mapFSrc = `
#define MAXNUM ${CONSTANTS.LIGHT_MAXNUM}
varying vec3 v_pos;
varying vec2 v_texelCoords;
varying vec4 v_color;
varying vec4 v_caveID;
varying vec4 v_groundCompID;
varying vec4 v_wideCompID;

uniform sampler2D u_texture;
uniform vec2 u_dimensions;
uniform bool u_showCaverns;
uniform bool u_showGroundComps;
uniform bool u_showWideComps;
uniform vec4 u_ambientLight;
uniform vec2 u_lightPos[MAXNUM];
uniform vec4 u_lightColor[MAXNUM];

bool rayCast(vec2 start, vec2 target) {
    ivec2 startTile = ivec2(floor(start));
    ivec2 targetTile = ivec2(floor(target));


    int di = (targetTile.x > startTile.x) ? targetTile.x - startTile.x : startTile.x - targetTile.x;
    int dj = (targetTile.y > startTile.y) ? targetTile.y - startTile.y : startTile.y - targetTile.y;
    int i = startTile.x;
    int j = startTile.y;
    int i_inc = (targetTile.x > startTile.x) ? 1 : -1;
    int j_inc = (targetTile.y > startTile.y) ? 1 : -1;
    int error = di - dj;
    di *= 2;
    dj *= 2;

    bool skip = false;

    for (int n = 50; n > 0; --n)
    {
        if (skip) {
            skip = false;
        } else {
            if (n <= 1 + di + dj) {
                if (texture2D(u_texture, vec2(float(i), float(j)) / u_dimensions).rgb == vec3(0.0)) {
                    return false;
                }

                if (error > 0)
                {
                    i += i_inc;
                    error -= dj;
                }
                else if (error < 0)
                {
                    j += j_inc;
                    error += di;
                }
                else if (error == 0) {
                    i += i_inc;
                    j += j_inc;
                    error -= dj;
                    error += di;
                    skip = true;
                }
            }
        }
    }

    return true;
}

void main() {
    if (u_showCaverns) {
        gl_FragColor = v_caveID;
    } else if (u_showGroundComps) {
        gl_FragColor = v_groundCompID;
    } else if (u_showWideComps) {
        gl_FragColor = v_wideCompID;
    } else {
        vec4 color = texture2D(u_texture, v_texelCoords);
        vec3 RGB = vec3(0.0);

        for (int i = 0; i < MAXNUM; i++) {
            if (u_lightColor[i].a > 0.0) {

                float dist = distance(v_pos.xy, u_lightPos[i]);

                if (dist < 25.0) {// && rayCast(v_pos.xy, u_lightPos[i])) {
                    RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist, 1.0);
                }
            }
        }

        gl_FragColor.rgb = 0.5 * color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
        gl_FragColor.a = color.a;
    }
}
`;

export let mapUniforms = {
    u_texture: { type: 'sampler2D', value: undefined },
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
