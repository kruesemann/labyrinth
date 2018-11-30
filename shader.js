const mapVSrc = `
attribute vec4 a_color;
attribute vec4 a_caveID;

varying vec4 v_color;
varying vec4 v_caveID;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_color = a_color;
    v_caveID = a_caveID;
}
`;

const mapFSrc = `
#define MAXNUM 16;
varying vec4 v_color;
varying vec4 v_caveID;

uniform bool u_showCaverns;
//uniform vec2 u_lightPos[MAXNUM];
//uniform vec4 u_lightColor[MAXNUM];

void main() {
    if (u_showCaverns) {
        gl_FragColor = v_caveID;
    } else {
        vec3 ambientLight = vec3(1.0, 1.0, 1.0);
        vec2 lightPos = vec2(1000.0, 500.0);
        vec4 lightColor = vec4(1.0, 1.0, 1.0, 100.0);

        gl_FragColor.rgb = v_color.rgb * max(ambientLight, lightColor.a * lightColor.rgb / distance(gl_FragCoord.xy, lightPos));
        gl_FragColor.a = v_color.a;
    }
}
`;

export let mapUniforms = {
    u_showCaverns: { type: 'bool', value: false },
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
