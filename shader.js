const mapVSrc = `
attribute vec4 a_color;
attribute vec4 a_cavernID;

varying vec4 v_color;
varying vec4 v_cavernID;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_color = a_color;
    v_cavernID = a_cavernID;
}
`;

const mapFSrc = `
varying vec4 v_color;
varying vec4 v_cavernID;

uniform bool u_showCaverns;

void main() {
    if (u_showCaverns) {
        gl_FragColor = v_cavernID;
    } else {
        gl_FragColor = v_color;
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
