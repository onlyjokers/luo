import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import vertexShader from './shaders/sphereVertex.glsl';
import fragmentShader from './shaders/sphereFragment.glsl';
import {
  shaderUniforms,
  animationConfig,
  geometryConfig,
  deformationConfig,
} from './config/sphereConfig';

// 创建自定义着色器材质
const SphereMaterial = shaderMaterial(
  {
    // 使用配置文件中的统一变量
    time: 0,
    wireframeWidth: shaderUniforms.wireframeWidth,
    noiseScale: shaderUniforms.noiseScale,
    noiseStrength: shaderUniforms.noiseStrength,
    horizontalOffset: shaderUniforms.horizontalOffset,
    mousePos: new THREE.Vector3(0, 0, 0),
    hover: 0,
    animationStrength: shaderUniforms.animationStrength,
  },
  vertexShader,
  fragmentShader
);

// 将自定义材质扩展到 Three.js
extend({ SphereMaterial });

export default function Sphere() {
  const materialRef = useRef();
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const transitionRef = useRef({ 
    hover: 0,
    wave: 0,
    rotSpeed: animationConfig.rotation.normalSpeed
  });

  // 入场动画
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(8, 8, 8);
      gsap.to(meshRef.current.scale, {
        x: animationConfig.hover.scaleNormal,
        y: animationConfig.hover.scaleNormal,
        z: animationConfig.hover.scaleNormal,
        duration: 3,
        ease: "power2.out",
      });
    }
  }, []);

  // 每帧更新
  useFrame((state) => {
    if (meshRef.current) {
      // 平滑缩放动画
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          isHovered ? animationConfig.hover.scaleUp : animationConfig.hover.scaleNormal,
          isHovered ? animationConfig.hover.scaleUp : animationConfig.hover.scaleNormal,
          isHovered ? animationConfig.hover.scaleUp : animationConfig.hover.scaleNormal
        ),
        animationConfig.hover.transitionSpeed
      );
      
      // 平滑控制旋转速度
      const targetRotSpeed = isHovered ? animationConfig.rotation.hoverSpeed : animationConfig.rotation.normalSpeed;
      transitionRef.current.rotSpeed = THREE.MathUtils.lerp(
        transitionRef.current.rotSpeed,
        targetRotSpeed,
        animationConfig.rotation.transitionSpeed
      );
      meshRef.current.rotation.y += transitionRef.current.rotSpeed;
    }

    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
      
      // 平滑过渡悬停状态
      transitionRef.current.hover = THREE.MathUtils.lerp(
        transitionRef.current.hover,
        isHovered ? 1 : 0,
        animationConfig.hover.transitionSpeed
      );

      // 平滑过渡动画强度
      materialRef.current.animationStrength = THREE.MathUtils.lerp(
        materialRef.current.animationStrength || 1.0,
        isHovered ? 0.0 : 1.0,
        0.02
      );

      // 基础正弦波动
      let offset = Math.sin(state.clock.elapsedTime) * 0.01 * (1 - transitionRef.current.hover);
      
      // 平滑过渡的方波效果
      const squareWave = Math.sign(Math.sin(state.clock.elapsedTime * animationConfig.wave.frequency)) 
                        * animationConfig.wave.amplitude;
      transitionRef.current.wave = THREE.MathUtils.lerp(
        transitionRef.current.wave,
        squareWave,
        animationConfig.wave.transitionSpeed
      );

      // 最终偏移量计算
      const mouseInfluence = (mousePosition.x * 0.1);
      const hoverEffect = transitionRef.current.wave + mouseInfluence;
      offset += hoverEffect * transitionRef.current.hover;
      
      materialRef.current.horizontalOffset = offset;
      materialRef.current.hover = transitionRef.current.hover;
    }
  });

  const handlePointerMove = (event) => {
    if (!materialRef.current || !meshRef.current) return;

    const localPos = meshRef.current.worldToLocal(event.point.clone());
    materialRef.current.mousePos.set(localPos.x, localPos.y, localPos.z);

    const x = (event.point.x / (window.innerWidth / 2));
    const y = (event.point.y / (window.innerHeight / 2));
    setMousePosition({ x, y });
  };

  return (
    <mesh 
      ref={meshRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
    >
      <sphereGeometry args={[geometryConfig.radius, geometryConfig.segments, geometryConfig.segments]} />
      <sphereMaterial ref={materialRef} />
    </mesh>
  );
}