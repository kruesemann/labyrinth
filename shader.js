import * as CONSTANTS from "./constants.js";

const mapTextureVSrc = `
attribute vec4 a_color;

uniform vec2 u_dimensions;

varying vec4 v_color;

void main(void) {
    gl_Position.xy = vec2(2.0 * position.xy / u_dimensions - vec2(1.0));
    gl_Position.zw = vec2(0.0, 1.0);
    v_color = a_color;
}
`;

const mapTextureFSrc = `
varying vec4 v_color;

void main(void) {
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

const mapLightingVSrc = `
attribute vec2 a_texelCoords;

uniform vec2 u_dimensions;

varying vec2 v_texelCoords;

void main(void) {
    gl_Position.xy = vec2(2.0 * position.xy / u_dimensions - vec2(1.0));
    gl_Position.zw = vec2(0.0, 1.0);
    v_texelCoords = a_texelCoords;
}
`;

const mapLightingFSrc = `
#define MAXNUM ${CONSTANTS.LIGHT_MAXNUM}
#define MAXDIST ${CONSTANTS.LIGHT_MAXDIST}

varying vec2 v_texelCoords;

uniform sampler2D u_texture;
uniform vec2 u_dimensions;
uniform vec4 u_ambientLight;
uniform vec2 u_lightPos[MAXNUM];
uniform vec4 u_lightColor[MAXNUM];

bool compleq(vec2 a, vec2 b) {
    return a.x <= b.x && a.y <= b.y;
}

bool compleq(vec3 a, vec3 b) {
    return a.x <= b.x && a.y <= b.y && a.z <= b.z;
}

bool rayCast(vec2 start, vec2 target) {
    ivec2 startTile = ivec2(ceil(start));
    ivec2 targetTile = ivec2(ceil(target));

    int di = 0;
    int dj = 0;
    int i_inc = 0;
    int j_inc = 0;

    if (targetTile.x > startTile.x) {
        di = targetTile.x - startTile.x;
        i_inc = 1;
    } else {
        di = startTile.x - targetTile.x;
        i_inc = -1;
    }

    if (targetTile.y > startTile.y) {
        dj = targetTile.y - startTile.y;
        j_inc = 1;
    } else {
        dj = startTile.y - targetTile.y;
        j_inc = -1;
    }

    int i = startTile.x;
    int j = startTile.y;
    int error = di - dj;
    //di *= 2;
    //dj *= 2;

    bool skip = false;

    for (int n = MAXDIST + 1; n > 0; --n) {
        if (n <= 1 + di + dj) {
            if (skip) {
                skip = false;
            } else {
                if (compleq(texture2D(u_texture, vec2(float(i), float(j)) / u_dimensions).rgb, vec3(0.055))) {
                    return false;
                }

                if (error > 0) {
                    i += i_inc;
                    error -= dj;
                } else if (error < 0) {
                    j += j_inc;
                    error += di;
                } else if (error == 0) {
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

void main(void) {
    vec4 color = texture2D(u_texture, v_texelCoords);
    vec3 RGB = vec3(0.0);
    vec2 mapCoords = v_texelCoords * u_dimensions;

    for (int i = 0; i < MAXNUM; i++) {
        if (u_lightColor[i].a > 0.0) {

            float dist = distance(mapCoords, u_lightPos[i]);

            if (dist < float(MAXDIST)) {
                if (rayCast(mapCoords, u_lightPos[i])) {
                    RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist, 1.0);
                }
            }
        }
    }

    gl_FragColor.rgb = 0.5 * color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
    gl_FragColor.a = color.a;
}
`;

export let mapLightingUniforms = {
    u_texture: { type: 'sampler2D', value: undefined },
    u_dimensions: { type: 'vec2', value: new Float32Array(2) },
    u_ambientLight: { type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0]) },
    u_lightPos: { type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM) },
    u_lightColor: { type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM) },
};

let mapLightingShaderMaterial = new THREE.ShaderMaterial({
    uniforms: mapLightingUniforms,
    vertexShader:   mapLightingVSrc,
    fragmentShader: mapLightingFSrc,
});

export function getMapLightingMaterial() {
    return mapLightingShaderMaterial;
}

const mapVSrc = `
attribute vec2 a_texelCoords;

varying vec3 v_pos;
varying vec2 v_texelCoords;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position;
    v_texelCoords = a_texelCoords;
}
`;

const mapFSrc = `
varying vec3 v_pos;
varying vec2 v_texelCoords;

uniform sampler2D u_texture;

void main(void) {
    gl_FragColor = texture2D(u_texture, v_texelCoords);
}
`;

export let mapUniforms = {
    u_texture: { type: 'sampler2D', value: undefined },
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
