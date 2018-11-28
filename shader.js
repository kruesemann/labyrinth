const vSrc = `
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_color = a_color;
}
`;

const fSrc = `
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`;

let uniforms = {
};

let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader:   vSrc,
    fragmentShader: fSrc,
});

export function getMaterial() {
    return shaderMaterial;
}
