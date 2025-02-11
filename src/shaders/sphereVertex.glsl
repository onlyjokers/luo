varying vec3 vPosition;
varying vec2 vUv;
uniform float time;
uniform float noiseScale;
uniform float noiseStrength;
uniform float horizontalOffset;
uniform vec3 mousePos;
uniform float hover;
uniform float animationStrength;  // 控制动画强度

// Simplex 噪声函数
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// 优化接缝处理的 polarUV 函数
vec2 polarUV(vec3 pos) {
  vec3 n = normalize(pos);
  float phi = atan(n.z, n.x);
  float theta = acos(n.y);
  float u = (phi + 3.14159) / (2.0 * 3.14159);
  return vec2(u, theta / 3.14159);
}

void main() {
    vPosition = position;
    vec2 polarCoord = polarUV(position);
    vUv = polarCoord;

    // 使用圆形采样创建无缝噪声
    float angle = polarCoord.x * 2.0 * 3.14159;
    vec2 noiseCoord = vec2(cos(angle), sin(angle)) * polarCoord.y;
    
    // 在多个重叠点采样噪声以实现无缝包裹
    float verticalNoise = snoise(noiseCoord * noiseScale + time * 0.2) * noiseStrength * animationStrength;
    float horizontalNoise = snoise((noiseCoord + vec2(0.5)) * noiseScale + time * 0.15) * horizontalOffset * animationStrength;
    
    // 计算切向量
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    
    // 对极地区域进行对称平滑处理
    float poleWeight = sin(polarCoord.y * 3.14159);
    verticalNoise *= poleWeight;
    horizontalNoise *= poleWeight;
    
    // 结合垂直与水平位移
    vec3 newPosition = position + 
                      normal * verticalNoise +
                      tangent * horizontalNoise;

    // 计算鼠标位置与当前顶点之间的距离
    float dist = distance(position, mousePos);
    
    // 产生随时间波动的涟漪效果，并根据 hover 调整影响力
    float ripple = 0.03 * sin(dist * 10.0 - time * 3.0) * hover;

    // 将涟漪效果叠加到 newPosition 上
    newPosition += normal * ripple;

    // 漩涡效果，振幅由 0.08 降为 0.04，使未悬停时褶皱较低
    vec3 tangent2 = normalize(cross(normal, tangent));
    float twist = (1.0 - hover) * 0.04 * sin(time * 4.0 + vUv.x * 6.2831);
    newPosition += tangent2 * twist;
    
    // 修改：内部折叠效果，振幅由 0.1 降为 0.01，使未悬停时褶皱较低
    float fold = (1.0 - hover) * 0.01 * cos(time * 3.0 + vUv.y * 6.2831);
    newPosition -= normal * fold;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}