import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState } from 'react';

// Create shader material
const SphereMaterial = shaderMaterial(
  {
    time: 0,
    wireframeWidth: 0.04,
    cameraPosition: new THREE.Vector3(0, 0, 4)
  },
  // Vertex shader
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    
    vec2 polarUV(vec3 pos) {
      vec3 n = normalize(pos);
      float phi = atan(n.z, n.x);
      float theta = acos(n.y);
      float u = (phi + 3.14159) / (2.0 * 3.14159);
      return vec2(u, theta / 3.14159);
    }

    void main() {
        vPosition = position;
        vUv = polarUV(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float time;
    uniform float wireframeWidth;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
        float waveFreq = 280.0;
        vec2 uv = vUv;
        
        // Layer 1: Large, slow waves
        float noise1 = snoise(vec2(
            uv.y * 1.0 +    // Y frequency - higher = more waves
            time * 0.2,     // Time speed - higher = faster horizontal movement
            time * 0.1      // Vertical movement speed
        )) * 0.05;        // Amplitude - higher = bigger waves
        
        // Layer 2: Medium waves
        float noise2 = snoise(vec2(
            uv.y * 5.0 -    // Medium frequency
            time * 0.15,    // Different speed for variety
            time * 0.2
        )) * 0.006;        // Medium amplitude
        
        // Layer 3: Small, quick waves
        float noise3 = snoise(vec2(
            uv.y * 6.0 +   // High frequency - creates fine detail
            time * 0.1,
            time * 0.3
        )) * 0.002;        // Small amplitude
        
        // Combine waves
        uv.x += noise1 + noise2 + noise3;
        
        // Vertical variation
        uv.y += snoise(vec2(
            uv.x * 20.0,     // Horizontal frequency of vertical movement
            time * 0.2      // Speed of vertical movement
        )) * 0.01;        // Amount of vertical movement
        
        // Calculate wireframe with noisy effect
        vec2 grid = abs(fract(uv * vec2(waveFreq, 1.0) - 0.5) - 0.5) / fwidth(uv * vec2(waveFreq, 1.0));
        float line = grid.x;
        float wireframe = 1.0 - min(line, 1.0);
        
        vec3 wireframeColor = vec3(0.5);
        vec3 baseColor = vec3(1.0);
        
        vec3 finalColor = mix(baseColor, wireframeColor, wireframe);
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ SphereMaterial });

export default function Sphere() {
  const materialRef = useRef();
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
      if (camera) {
        materialRef.current.cameraPosition.copy(camera.position);
      }
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0017;
    }
  });

  const handlePointerMove = (event) => {
    if (isHovered) {
      const x = (event.point.x / (window.innerWidth / 2));
      const y = (event.point.y / (window.innerHeight / 2));
      setMousePosition({ x, y });
    }
  };

  return (
    <mesh 
      ref={meshRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
    >
      <sphereGeometry args={[1, 128, 128]} />
      <sphereMaterial ref={materialRef} />
    </mesh>
  );
}