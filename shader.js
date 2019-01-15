import * as CONSTANTS from "./constants.js";

const RAYCAST = `
bool compLEQ(vec2 a, vec2 b) {
    return a.x <= b.x && a.y <= b.y;
}

bool compLEQ(vec3 a, vec3 b) {
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

    bool skip = false;

    // skip start tile
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

    for (int n = MAXDIST + 1; n > 1; --n) {
        if (n <= 1 + di + dj) {
            if (skip) {
                skip = false;
            } else {
                if (compLEQ(texture2D(u_texture, vec2(float(i) - 0.5, float(j) - 0.5) / u_dimensions).rgb, vec3(0.035))) {
                    return false;
                }

                if (error > 0) {
                    i += i_inc;
                    error -= dj;
                } else if (error < 0) {
                    j += j_inc;
                    error += di;
                } else {
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
`;

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
#define DISTEXP ${CONSTANTS.LIGHT_DISTEXP}

varying vec2 v_texelCoords;

uniform sampler2D u_texture;
uniform vec2 u_dimensions;
uniform vec4 u_ambientLight;
uniform vec2 u_lightPos[MAXNUM];
uniform vec4 u_lightColor[MAXNUM];

${RAYCAST}

void main(void) {
    vec4 color = texture2D(u_texture, v_texelCoords);
    vec3 RGB = vec3(0.0);
    vec2 mapCoords = v_texelCoords * u_dimensions;

    for (int i = 0; i < MAXNUM; i++) {
        if (u_lightColor[i].a > 0.0) {

            float dist = distance(mapCoords, u_lightPos[i]);

            if (dist < float(MAXDIST)) {
                if (rayCast(mapCoords, u_lightPos[i])) {
                    RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist, float(DISTEXP));
                }
            }
        }
    }

    gl_FragColor.rgb = color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
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

uniform float u_lightPrecision;

varying vec4 v_pos;
varying vec4 v_color;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = u_lightPrecision * modelMatrix * vec4(position, 1.0);
    v_color = a_color;
}
`;

const objectFSrc = `
#define MAXNUM ${CONSTANTS.LIGHT_MAXNUM}
#define MAXDIST ${CONSTANTS.LIGHT_MAXDIST}
#define DISTEXP ${CONSTANTS.LIGHT_DISTEXP}

varying vec4 v_pos;
varying vec4 v_color;

uniform sampler2D u_texture;
uniform vec2 u_dimensions;
uniform vec4 u_ambientLight;
uniform vec2 u_lightPos[MAXNUM];
uniform vec4 u_lightColor[MAXNUM];
uniform float u_lightPrecision;

${RAYCAST}

void main() {
    vec3 RGB = vec3(0.0);

    for (int i = 0; i < MAXNUM; i++) {
        if (u_lightColor[i].a > 0.0) {
            float dist = distance(floor(v_pos.xy + vec2(0.5)), u_lightPrecision * u_lightPos[i]);

            if (dist < float(MAXDIST)
            && rayCast(v_pos.xy, u_lightPrecision * u_lightPos[i])) {
                RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist, float(DISTEXP));
            }
        }
    }

    gl_FragColor.rgb = v_color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
    gl_FragColor.a = v_color.a;
}
`;

export let objectUniforms = {
    u_texture: { type: 'sampler2D', value: undefined },
    u_dimensions: { type: 'vec2', value: new Float32Array(2) },
    u_ambientLight: { type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0]) },
    u_lightPos: { type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM) },
    u_lightColor: { type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM) },
    u_lightPrecision: { type: 'float', value: 1 },
};

let objectShaderMaterial = new THREE.ShaderMaterial({
    uniforms: objectUniforms,
    vertexShader:   objectVSrc,
    fragmentShader: objectFSrc,
});

export function getObjectMaterial() {
    return objectShaderMaterial;
}
