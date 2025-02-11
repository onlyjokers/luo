varying vec3 vPosition;
varying vec2 vUv;
uniform float wireframeWidth;

void main() {
    // 计算经线的线框，调整以实现无缝包裹
    vec2 grid = abs(fract(vUv * vec2(280.0, 1.0) - 0.5) - 0.5) / fwidth(vUv * vec2(280.0, 1.0));
    float line = grid.x;
    float wireframe = 1.0 - min(line, 1.0);
    
    // 将线框颜色设置为灰色，背景为白色
    vec3 wireframeColor = vec3(0.5); // 灰色 (0.3, 0.3, 0.3)
    vec3 baseColor = vec3(1.0); // 白色 (1.0, 1.0, 1.0)
    
    vec3 finalColor = mix(baseColor, wireframeColor, wireframe);
    gl_FragColor = vec4(finalColor, 1.0);
}