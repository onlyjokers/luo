import React from 'react'
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

// Create shader material
const SphereMaterial = shaderMaterial(
  {
    uTime: 0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    varying vec2 vUv;
    
    // Simplex noise function for distortion
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
      vec2 uv = vUv;
      
      // Increased number of lines
      float lineFreq = 120.0;
      
      // Create smoother distortion mask
      float noiseMask = snoise(vec2(
        uv.y * 1.5 + uTime * 0.1,
        uv.x * 1.5 - uTime * 0.15
      ));
      
      // Softer transition for the mask
      float distortionMask = smoothstep(0.1, 0.9, noiseMask);
      
      // Gradual distortion
      float distortion = snoise(vec2(
        uv.x * 2.0 + uTime * 0.2,
        uv.y * 2.0 + uTime * 0.1
      )) * 0.08;
      
      // Smooth transition between distorted and non-distorted areas
      float finalDistortion = distortion * distortionMask;
      
      // Create base pattern with smooth distortion
      float pattern = sin((uv.x + finalDistortion) * lineFreq * 3.14159);
      
      // Create thinner, sharper lines (approximately 1px)
      float lines = smoothstep(0.98, 0.99, abs(pattern));
      
      // Final color with darker lines (increased from 0.12 to 0.25)
      vec3 color = vec3(1.0 - lines * 0.25);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ SphereMaterial });

export default function Sphere() {
  const materialRef = useRef();
  const meshRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Optional: slow rotation
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <sphereMaterial ref={materialRef} />
    </mesh>
  );
}