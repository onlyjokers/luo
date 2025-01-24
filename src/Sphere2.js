// 导入必要的库和hooks
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState } from 'react';

// 创建自定义着色器材质
const SphereMaterial = shaderMaterial(
  {
    // 着色器统一变量（uniforms）声明
    time: 0,                    // 用于动画的时间变量
    wireframeWidth: 0.04,       // 线框宽度
    noiseScale: 4.0,           // 噪声缩放比例
    noiseStrength: 0.02,       // 噪声强度
    horizontalOffset: 1.0      // 水平偏移量
  },
  // 顶点着色器 - 处理几何体顶点位置计算
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float time;
    uniform float noiseScale;
    uniform float noiseStrength;
    uniform float horizontalOffset;

    // Simplex noise function
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
    
    // Modified polarUV function for better seam handling
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

        // Create seamless noise by sampling in a circular pattern
        float angle = polarCoord.x * 2.0 * 3.14159;
        vec2 noiseCoord = vec2(cos(angle), sin(angle)) * polarCoord.y;
        
        // Sample noise at multiple overlapping points for seamless wrapping
        float verticalNoise = snoise(noiseCoord * noiseScale + time * 0.2) * noiseStrength;
        float horizontalNoise = snoise((noiseCoord + vec2(0.5)) * noiseScale + time * 0.15) * horizontalOffset;
        
        // Calculate tangent vector
        vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
        
        // Smooth out the pole regions symmetrically
        float poleWeight = sin(polarCoord.y * 3.14159);
        verticalNoise *= poleWeight;
        horizontalNoise *= poleWeight;
        
        // Combine vertical and horizontal displacement
        vec3 newPosition = position + 
                          normal * verticalNoise +
                          tangent * horizontalNoise;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // 片段着色器 - 处理表面颜色渲染
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float wireframeWidth;

    void main() {
        // Calculate wireframe for longitude lines, adjust for seamless wrapping
        vec2 grid = abs(fract(vUv * vec2(280.0, 1.0) - 0.5) - 0.5) / fwidth(vUv * vec2(280.0, 1.0));
        float line = grid.x;
        float wireframe = 1.0 - min(line, 1.0);
        
        // Set wireframe color to grey and background to white
        vec3 wireframeColor = vec3(0.5); // Grey color (0.3, 0.3, 0.3)
        vec3 baseColor = vec3(1.0); // White color (1.0, 1.0, 1.0)
        
        vec3 finalColor = mix(baseColor, wireframeColor, wireframe);
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// 将自定义材质扩展到 Three.js
extend({ SphereMaterial });

export default function Sphere() {
  // 创建引用和状态
  const materialRef = useRef();        // 材质引用
  const meshRef = useRef();            // 网格引用
  const [isHovered, setIsHovered] = useState(false);  // 悬停状态
  const { camera } = useThree();       // 获取场景相机
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });  // 鼠标位置状态
  // 添加过渡状态
  const transitionRef = useRef({ 
    hover: 0,
    wave: 0
  });

  // 每帧更新函数
  useFrame((state) => {
    if (meshRef.current) {
      // 平滑缩放动画
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          isHovered ? 1.1 : 1.0,
          isHovered ? 1.1 : 1.0,
          isHovered ? 1.1 : 1.0
        ),
        0.1
      );

      meshRef.current.rotation.y += 0.0017;
    }

    if (materialRef.current) {
      // 更新时间变量
      materialRef.current.time = state.clock.elapsedTime;
      
      // 平滑过渡悬停状态
      transitionRef.current.hover = THREE.MathUtils.lerp(
        transitionRef.current.hover,
        isHovered ? 1 : 0,
        0.05  // 调整这个值可以改变过渡速度
      );

      // 基础正弦波动
      let offset = Math.sin(state.clock.elapsedTime) * 0.07;
      
      // 平滑过渡的方波效果
      const squareWave = Math.sign(Math.sin(state.clock.elapsedTime * 2)) * 0.03;
      transitionRef.current.wave = THREE.MathUtils.lerp(
        transitionRef.current.wave,
        squareWave,
        0.1  // 调整这个值可以改变方波过渡速度
      );

      // 使用过渡值计算最终偏移量
      const mouseInfluence = (mousePosition.x * 0.1);
      const hoverEffect = transitionRef.current.wave + mouseInfluence;
      offset += hoverEffect * transitionRef.current.hover;
      
      // 更新水平偏移量
      materialRef.current.horizontalOffset = offset;
    }
  });

  // 处理指针（鼠标）移动事件
  const handlePointerMove = (event) => {
    if (isHovered) {
      // 将鼠标位置转换为标准化设备坐标（-1 到 +1）
      const x = (event.point.x / (window.innerWidth / 2));
      const y = (event.point.y / (window.innerHeight / 2));
      setMousePosition({ x, y });
    }
  };

  // 渲染3D球体
  return (
    <mesh 
      ref={meshRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
    >
      {/* 创建球体几何体，参数：[半径, 水平分段数, 垂直分段数] */}
      <sphereGeometry args={[1, 128, 128]} />
      {/* 应用自定义着色器材质 */}
      <sphereMaterial ref={materialRef} />
    </mesh>
  );
}