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

const CLOUDS = `
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
{ 
    const vec2  C = vec2(1.0 / 6.0, 1.0 / 3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i); 
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
                                     i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
                                     i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float normnoise(float noise) {
    return 0.5 * (noise + 1.0);
}

float clouds(vec2 uv, float time) {
    uv += vec2(time * 0.05, time * 0.01);
    
    vec2 off1 = vec2(50.0, 33.0);
    vec2 off2 = vec2(0.0, 0.0);
    vec2 off3 = vec2(-300.0, 50.0);
    vec2 off4 = vec2(-100.0, 200.0);
    vec2 off5 = vec2(400.0, -200.0);
    vec2 off6 = vec2(100.0, -1000.0);
    float scale1 = 3.0;
    float scale2 = 6.0;
    float scale3 = 12.0;
    float scale4 = 24.0;
    float scale5 = 48.0;
    float scale6 = 96.0;
    return normnoise(snoise(vec3((uv + off1) * scale1, time * 0.5)) * 0.8 + 
                     snoise(vec3((uv + off2) * scale2, time * 0.4)) * 0.4 +
                     snoise(vec3((uv + off3) * scale3, time * 0.1)) * 0.2 +
                     snoise(vec3((uv + off4) * scale4, time * 0.7)) * 0.1 +
                     snoise(vec3((uv + off5) * scale5, time * 0.2)) * 0.05 +
                     snoise(vec3((uv + off6) * scale6, time * 0.3)) * 0.025);
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
    gl_Position.xy = 2.0 * position.xy / u_dimensions - vec2(1.0);
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
uniform vec2 u_texelTranslation;

varying vec2 v_texelCoords;

void main(void) {
    gl_Position = vec4(position, 1.0);
    v_texelCoords = a_texelCoords + u_texelTranslation;
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
    if (v_texelCoords.x < 0.0 || v_texelCoords.x > 1.0 || v_texelCoords.y < 0.0 || v_texelCoords.y > 1.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec4 color = texture2D(u_texture, v_texelCoords);
    vec3 RGB = vec3(0.0);
    vec3 light = vec3(0.0);
    vec2 mapCoords = v_texelCoords * u_dimensions;

    for (int i = 0; i < MAXNUM; ++i) {
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

varying vec2 v_texelCoords;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_texelCoords = a_texelCoords;
}
`;

const mapFSrc = `
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

    for (int i = 0; i < MAXNUM; ++i) {
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

float box(vec2 pos, vec2 size) {
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
    for (int i = 0; i < 12; ++i) {
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

/**
 * Animation gleam
 */

const animationGleamVSrc = `
varying vec2 v_pos;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_pos = position.xy;
}
`;

const animationGleamFSrc = `
#define TOTAL_TIME ${CONSTANTS.ANIMATION_GLEAM_TIME}
#define HALF_TIME  ${CONSTANTS.ANIMATION_GLEAM_TIME / 2}
#define SIZE       ${CONSTANTS.ANIMATION_GLEAM_SIZE}

varying vec2 v_pos;

uniform float u_gamma;
uniform float u_counter;
uniform vec4 u_color;

void main(void) {
    vec2 pos = v_pos.xy / vec2(float(SIZE)) - vec2(0.5);
    pos *= 30.0;

    gl_FragColor.rgb = u_color.rgb;
    gl_FragColor.a = u_color.a / pow(sqrt(abs(pos.x)) + sqrt(abs(pos.y)), 4.0);

    if (u_counter < float(HALF_TIME)) {
        gl_FragColor.a *= pow(max(0.0, u_counter / float(TOTAL_TIME)), 4.0);
    } else {
        gl_FragColor.a *= pow(max(0.0, (float(TOTAL_TIME) - u_counter) / float(TOTAL_TIME)), 4.0);
    }

    if (gl_FragColor.a < 0.01) gl_FragColor.a = 0.0;

    gl_FragColor.r = pow(gl_FragColor.r, u_gamma);
    gl_FragColor.g = pow(gl_FragColor.g, u_gamma);
    gl_FragColor.b = pow(gl_FragColor.b, u_gamma);
}
`;

/**
 * Overlay luminosity
 */

const luminosityVSrc = `
attribute vec2 a_texelCoords;

varying vec2 v_texelCoords;

void main(void) {
    gl_Position = vec4(position, 1.0);
    v_texelCoords = a_texelCoords;
}
`;

const luminosityFScr = `
uniform sampler2D u_texture;
uniform vec4 u_color;
uniform vec2 u_center;
uniform float u_time;

varying vec2 v_texelCoords;

${CLOUDS}

void main(void) {
    gl_FragColor = texture2D(u_texture, v_texelCoords);
    float dist = 4.0 * length(gl_FragCoord.xy - u_center);
    gl_FragColor.rgb *= u_color.rgb * u_color.a / sqrt(dist);
    float overflow = max(0.0, gl_FragColor.r - 1.0) + max(0.0, gl_FragColor.g - 1.0) + max(0.0, gl_FragColor.b - 1.0);
    gl_FragColor.rgb += vec3(overflow / 2.0);
    if (gl_FragColor.a == 0.0) {
        gl_FragColor.rgb = mix(u_color.rgb, vec3(dot(vec3(0.3, 0.59, 0.11), u_color.rgb)), 0.6);
        float noise = pow(clouds(gl_FragCoord.xy / 100.0, u_time), 4.0);
        gl_FragColor.a = u_color.a / 10.0 * noise * smoothstep(0.0, 50.0, 50.0 - length((gl_FragCoord.xy - u_center) * vec2(1.1 + noise / 10.0, 1.0 + noise / 10.0)));
    }
}
`;

// -------------------------------
// UNIFORMS

let u_gamma = {type: 'float', value: 1};

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
    u_texelTranslation: {type: 'vec2', value: new Float32Array(2)},
    u_ambientLight: {type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0])},
    u_lightPos: {type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightColor: {type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM)},
};

/**
 * Map
 */

export const mapUniforms = {
    u_gamma,
    u_texture: {type: 'sampler2D', value: undefined},
};

/**
 * Object
 */

export const objectUniforms = {
    u_gamma,
    u_texture: {type: 'sampler2D', value: undefined},
    u_dimensions: {type: 'vec2', value: new Float32Array(2)},
    u_ambientLight: {type: 'vec3', value: new Float32Array([1.0, 1.0, 1.0, 1.0])},
    u_lightPos: {type: 'vec2', value: new Float32Array(2 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightColor: {type: 'vec4', value: new Float32Array(4 * CONSTANTS.LIGHT_MAXNUM)},
    u_lightPrecision: {type: 'float', value: 1},
};

/**
 * Overlay luminosity
 */

export const luminosityUniforms = {
    u_texture: {type: 'sampler2D', value: undefined},
    u_color: {type: 'vec4', value: new Float32Array(4)},
    u_center: {type: 'vec2', value: new Float32Array(2)},
    u_time: {type: 'float', value: 0},
};

// -------------------------------
// MATERIALS

const materials = {
    mapTexture: new THREE.ShaderMaterial({
        uniforms:       mapTextureUniforms,
        vertexShader:   mapTextureVSrc,
        fragmentShader: mapTextureFSrc,
    }),
    mapLighting: new THREE.ShaderMaterial({
        uniforms:       mapLightingUniforms,
        vertexShader:   mapLightingVSrc,
        fragmentShader: mapLightingFSrc,
    }),
    map: new THREE.ShaderMaterial({
        uniforms:       mapUniforms,
        vertexShader:   mapVSrc,
        fragmentShader: mapFSrc,
    }),
    object: new THREE.ShaderMaterial({
        uniforms:       objectUniforms,
        vertexShader:   objectVSrc,
        fragmentShader: objectFSrc,
    }),
    luminosity: new THREE.ShaderMaterial({
        uniforms:       luminosityUniforms,
        vertexShader:   luminosityVSrc,
        fragmentShader: luminosityFScr,
        depthWrite:     false,
        transparent:    true,
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

export function getAnimationDanceMaterial(uniforms) {
    uniforms.u_gamma = u_gamma;
    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: animationDanceVSrc,
        fragmentShader: animationDanceFSrc,
        depthWrite: false,
        transparent: true,
    });
}

export function getAnimationSparksMaterial(uniforms) {
    uniforms.u_gamma = u_gamma;
    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: animationSparksVSrc,
        fragmentShader: animationSparksFSrc,
        depthWrite: false,
        transparent: true,
    });
}

export function getAnimationGleamMaterial(uniforms) {
    uniforms.u_gamma = u_gamma;
    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: animationGleamVSrc,
        fragmentShader: animationGleamFSrc,
        depthWrite: false,
        transparent: true,
    });
}

export function getLuminosityMaterial() {
    return materials.luminosity;
}

// -------------------------------
// GENERAL

export function getGamma() {
    return u_gamma.value;
}

export function setGamma(gamma) {
    u_gamma.value = gamma;
}
