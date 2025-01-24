import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

// Create shader material
const SphereMaterial = shaderMaterial(
  {
    time: 0,
    wireframeWidth: 0.05
  },
  // Simplified Vertex shader
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader (unchanged)
  `
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float wireframeWidth;

    void main() {
        // Calculate wireframe for longitude lines only
        vec2 grid = abs(fract(vUv * vec2(100.0, 1.0) - 0.5) - 0.5) / fwidth(vUv * vec2(100.0, 1.0));
        float line = grid.x;  // Only use x component for longitude lines
        float wireframe = 1.0 - min(line, 1.0);
        
        // Set wireframe color
        vec3 wireframeColor = vec3(0.8, 0.5, 0.5); // Pink color
        vec3 baseColor = vec3(0.1); // Dark base color
        
        vec3 finalColor = mix(baseColor, wireframeColor, wireframe);
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Extend Three.js with our custom material
extend({ SphereMaterial });

export default function Sphere() {
  const materialRef = useRef();
  const meshRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <sphereMaterial ref={materialRef} />
    </mesh>
  );
}