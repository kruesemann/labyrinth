import * as CONSTANTS from "./constants.js";

// -------------------------------
// SOURCES

/**
 * Common
 */

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

    for (int n = 2 * MAXDIST + 1; n > 1; --n) {
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

/**
 * Map texture
 */

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

/**
 * Map Lighting
 */

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
    vec3 light = vec3(0.0);
    vec2 mapCoords = v_texelCoords * u_dimensions;

    for (int i = 0; i < MAXNUM; i++) {
        if (u_lightColor[i].a > 0.0) {

            float dist = distance(mapCoords, u_lightPos[i]);

            if (dist < float(MAXDIST)) {
                if (rayCast(mapCoords, u_lightPos[i])) {
                    RGB += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist, float(DISTEXP));
                    if (dist < 5.0) {
                        light += u_lightColor[i].a * u_lightColor[i].rgb / pow(dist + 1.0, 4.0);
                    }
                }
            }
        }
    }

    if (light != vec3(0.0)) gl_FragColor.rgb = light;
    else gl_FragColor.rgb = color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB);
    gl_FragColor.rgb = max(light, color.rgb * max(u_ambientLight.a * u_ambientLight.rgb, RGB));
    gl_FragColor.a = color.a;
}
`;

/**
 * Map
 */

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

uniform float u_gamma;
uniform sampler2D u_texture;

void main(void) {
    gl_FragColor = texture2D(u_texture, v_texelCoords);
    gl_FragColor.r = pow(gl_FragColor.r, u_gamma);
    gl_FragColor.g = pow(gl_FragColor.g, u_gamma);
    gl_FragColor.b = pow(gl_FragColor.b, u_gamma);
}
`;

/**
 * Object
 */

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

uniform float u_gamma;
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
    gl_FragColor.r = pow(gl_FragColor.r, u_gamma);
    gl_FragColor.g = pow(gl_FragColor.g, u_gamma);
    gl_FragColor.b = pow(gl_FragColor.b, u_gamma);
}
`;

/**
 * Animation dance
 */

const animationDanceVSrc = `
varying vec2 v_pos;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position.xy;
}
`;

const animationDanceFSrc = `
#define FADE_TIME   ${CONSTANTS.ANIMATION_DANCE_FADE_TIME}
#define OPACITY     ${CONSTANTS.ANIMATION_DANCE_OPACITY}
#define TIME        ${CONSTANTS.ANIMATION_DANCE_TIME}
#define STEP_TIME   ${CONSTANTS.ANIMATION_DANCE_TIME / 4}
#define FADE_FACTOR ${CONSTANTS.ANIMATION_DANCE_FADE_TIME / CONSTANTS.ANIMATION_DANCE_OPACITY}
#define SECOND_FADE ${CONSTANTS.ANIMATION_DANCE_FADE_TIME + CONSTANTS.ANIMATION_DANCE_TIME}
#define TOTAL_TIME  ${2 * CONSTANTS.ANIMATION_DANCE_FADE_TIME + CONSTANTS.ANIMATION_DANCE_TIME}
#define STEP_1      ${CONSTANTS.ANIMATION_DANCE_FADE_TIME + 1 * CONSTANTS.ANIMATION_DANCE_TIME / 4}
#define STEP_2      ${CONSTANTS.ANIMATION_DANCE_FADE_TIME + 2 * CONSTANTS.ANIMATION_DANCE_TIME / 4}
#define STEP_3      ${CONSTANTS.ANIMATION_DANCE_FADE_TIME + 3 * CONSTANTS.ANIMATION_DANCE_TIME / 4}
#define STEP_4      ${CONSTANTS.ANIMATION_DANCE_FADE_TIME + 4 * CONSTANTS.ANIMATION_DANCE_TIME / 4}

varying vec2 v_pos;

uniform float u_gamma;
uniform float u_counter;
uniform vec2 u_moves[5];

float box(vec2 pos, vec2 size){
    size = vec2(0.5) - size * 0.5;
    vec2 uv = smoothstep(size, size + vec2(0.001), pos);
    uv *= smoothstep(size, size + vec2(0.001), vec2(1.0) - pos);
    return uv.x * uv.y;
}

void main(void) {
    vec2 pos = v_pos.xy / vec2(5.0, 5.0);
    
    float masterOpacity = 0.0;

    if (u_counter < float(FADE_TIME)) {
        masterOpacity = u_counter / float(FADE_FACTOR);
    } else if (u_counter < float(SECOND_FADE)) {
        masterOpacity = float(OPACITY);
    } else if (u_counter < float(TOTAL_TIME)) {
        masterOpacity = (float(TOTAL_TIME) - u_counter) / float(FADE_FACTOR);
    }

    vec2 translate = vec2(0.0);

    if (u_counter < float(FADE_TIME)) {
        translate = u_moves[0];
    } else if (u_counter < float(STEP_1)) {
        float lambda = (u_counter - float(FADE_TIME)) / float(STEP_TIME);
        translate = mix(u_moves[0], u_moves[1], lambda);
    } else if (u_counter < float(STEP_2)) {
        float lambda = (u_counter - float(STEP_1)) / float(STEP_TIME);
        translate = mix(u_moves[1], u_moves[2], lambda);
    } else if (u_counter < float(STEP_3)) {
        float lambda = (u_counter - float(STEP_2)) / float(STEP_TIME);
        translate = mix(u_moves[2], u_moves[3], lambda);
    } else if (u_counter < float(STEP_4)) {
        float lambda = (u_counter - float(STEP_3)) / float(STEP_TIME);
        translate = mix(u_moves[3], u_moves[4], lambda);
    } else {
        translate = u_moves[4];
    }

    pos -= translate;

    vec4 color = vec4(1.0, 1.0, 0.0, box(pos, vec2(0.2)));

    gl_FragColor = masterOpacity * color;
    gl_FragColor.r = pow(gl_FragColor.r, u_gamma);
    gl_FragColor.g = pow(gl_FragColor.g, u_gamma);
    gl_FragColor.b = pow(gl_FragColor.b, u_gamma);
}
`;

/**
 * Animation sparks
 */

const animationSparksVSrc = `
varying vec2 v_pos;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position.xy;
}
`;

const animationSparksFSrc = `
#define TOTAL_TIME ${CONSTANTS.ANIMATION_SPARKS_TIME}
#define SIZE       ${CONSTANTS.ANIMATION_SPARKS_SIZE}

varying vec2 v_pos;

uniform float u_gamma;
uniform float u_counter;
uniform vec2 u_directions[12];
uniform vec4 u_colors[12];

float spark(vec2 pos, vec2 direction, float brightness) {
    vec2 radii = vec2(max(brightness * length(direction) * 10.0, brightness), brightness);
    float angle = asin(direction.y / length(direction));
    if (direction.x > 0.0) {
        angle = radians(180.0) - angle;
    }
    return 1.0 - smoothstep(-4.0,
                            1.0,
                            pow(pos.x * cos(angle) - pos.y * sin(angle), 2.0)
                            / pow(radii.x, 2.0)
                            + pow(pos.x * sin(angle) + pos.y * cos(angle), 2.0)
                            / pow(radii.y, 2.0));
}

void main(void) {
    vec2 pos = v_pos.xy / vec2(float(SIZE)) - vec2(0.5);

    vec4 color = vec4(0.0);
    vec2 translate = vec2(0.0);
    for (int i = 0; i < 12; i++) {
        translate = u_directions[i] * u_counter / float(TOTAL_TIME);
        float brightness = spark(pos - translate, u_directions[i], u_colors[i].a);
        if (brightness > 0.0)
            color += vec4(u_colors[i].rgb, 1.0);
    }

    gl_FragColor = min(vec4(1.0), color);

    if (u_counter < 50.0) {
        gl_FragColor.a *= pow(max(0.0, u_counter / 50.0), 2.0);
    } else {
        gl_FragColor.a *= pow(max(0.0, (float(TOTAL_TIME) - u_counter) / float(TOTAL_TIME)), 2.0);
    }

    gl_FragColor.r = pow(gl_FragColor.r, u_gamma);
    gl_FragColor.g = pow(gl_FragColor.g, u_gamma);
    gl_FragColor.b = pow(gl_FragColor.b, u_gamma);
}
`;

// -------------------------------
// UNIFORMS

/**
 * Map texture
 */

export const mapTextureUniforms = {
    u_dimensions: {type: 'vec2', value: new Float32Array(2)},
};

/**
 * Map lighting
 */

export const mapLightingUniforms = {
    u_texture: {type: 'sampler2D', value: undefined},
    u_dimensions: {type: 'vec2', value: new Float32Array(2)},
    u_ambientLight: {type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0])},
    u_lightPos: {type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightColor: {type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM)},
};

/**
 * Map
 */

export const mapUniforms = {
    u_gamma: {type: 'float', value: 1},
    u_texture: {type: 'sampler2D', value: undefined},
};

/**
 * Object
 */

export const objectUniforms = {
    u_gamma: {type: 'float', value: 1},
    u_texture: {type: 'sampler2D', value: undefined},
    u_dimensions: {type: 'vec2', value: new Float32Array(2)},
    u_ambientLight: {type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0])},
    u_lightPos: {type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightColor: {type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightPrecision: {type: 'float', value: 1},
};

/**
 * Animation dance
 */

export const animationDanceUniforms = {
    u_gamma: {type: 'float', value: 1},
    u_counter: {type: 'float', value: 0},
    u_moves: {type: 'vec2', value: new Float32Array(10)},
};

/** 
 * Animations sparks
 */

export const animationSparksUniforms = {
    u_gamma: {type: 'float', value: 1},
    u_counter: {type: 'float', value: 0},
    u_directions: {type: 'vec2', value: new Float32Array(24)},
    u_colors: {type: 'vec4', value: new Float32Array(48)},
};

// -------------------------------
// MATERIALS

const materials = {
    mapTexture: new THREE.ShaderMaterial({
        uniforms: mapTextureUniforms,
        vertexShader:   mapTextureVSrc,
        fragmentShader: mapTextureFSrc,
    }),
    mapLighting: new THREE.ShaderMaterial({
        uniforms: mapLightingUniforms,
        vertexShader:   mapLightingVSrc,
        fragmentShader: mapLightingFSrc,
    }),
    map: new THREE.ShaderMaterial({
        uniforms: mapUniforms,
        vertexShader:   mapVSrc,
        fragmentShader: mapFSrc,
    }),
    object: new THREE.ShaderMaterial({
        uniforms: objectUniforms,
        vertexShader:   objectVSrc,
        fragmentShader: objectFSrc,
    }),
    animationDance: new THREE.ShaderMaterial({
        uniforms: animationDanceUniforms,
        vertexShader:   animationDanceVSrc,
        fragmentShader: animationDanceFSrc,
        depthWrite: false,
        transparent: true,
    }),
    animationSparks: new THREE.ShaderMaterial({
        uniforms: animationSparksUniforms,
        vertexShader:   animationSparksVSrc,
        fragmentShader: animationSparksFSrc,
        depthWrite: false,
        transparent: true,
    })
};

export function getMapTextureMaterial() {
    return materials.mapTexture;
}

export function getMapLightingMaterial() {
    return materials.mapLighting;
}

export function getMapMaterial() {
    return materials.map;
}

export function getObjectMaterial() {
    return materials.object;
}

export function getAnimationDanceMaterial() {
    return materials.animationDance;
}

export function getAnimationSparksMaterial() {
    return materials.animationSparks;
}

// -------------------------------
// GENERAL

export function getGamma() {
    return mapUniforms.u_gamma.value;
}

export function setGamma(gamma) {
    mapUniforms.u_gamma.value = gamma;
    objectUniforms.u_gamma.value = gamma;
    animationDanceUniforms.u_gamma.value = gamma;
}
