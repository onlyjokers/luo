import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import vertexShader from './shaders/sphereVertex.glsl';
import fragmentShader from './shaders/sphereFragment.glsl';

// 创建自定义着色器材质
const SphereMaterial = shaderMaterial(
  {
    // 着色器统一变量（uniforms）声明
    time: 0,                    // 用于动画的时间变量
    wireframeWidth: 0.04,       // 线框宽度
    noiseScale: 4.0,           // 噪声缩放比例
    noiseStrength: 0.02,       // 噪声强度
    horizontalOffset: 1.0,      // 水平偏移量
    mousePos: new THREE.Vector3(0, 0, 0), // 鼠标位置向量
    hover: 0,                              // 悬停状态
    animationStrength: 0.1,  // 控制原有动画强度
  },
  vertexShader,
  fragmentShader
);

// 将自定义材质扩展到 Three.js
extend({ SphereMaterial });

export default function Sphere() {
  // 创建引用和状态
  const materialRef = useRef();        // 材质引用
  const meshRef = useRef();            // 网格引用
  const [isHovered, setIsHovered] = useState(false);  // 悬停状态
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });  // 鼠标位置状态
  // 添加过渡状态
  const transitionRef = useRef({ 
    hover: 0,
    wave: 0,
    rotSpeed: 0.0017 // 初始旋转速度
  });

  // 添加入场动画
  useEffect(() => {
    if (meshRef.current) {
      // 设置初始状态
      meshRef.current.scale.set(8, 8, 8);
      
      // 创建动画
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 3,
        ease: "power2.out",
      });
    }
  }, []); // 空依赖数组确保动画只在组件挂载时执行一次

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
      
      // 平滑控制旋转速度：当悬停时趋向 0，不悬停时为 0.0017
      const targetRotSpeed = isHovered ? 0 : 0.0017;
      transitionRef.current.rotSpeed = THREE.MathUtils.lerp(
        transitionRef.current.rotSpeed || 0.0017,
        targetRotSpeed,
        0.05
      );
      meshRef.current.rotation.y += transitionRef.current.rotSpeed;
    }

    if (materialRef.current) {
      // 更新时间变量
      materialRef.current.time = state.clock.elapsedTime;
      
      // 平滑过渡悬停状态
      transitionRef.current.hover = THREE.MathUtils.lerp(
        transitionRef.current.hover,
        isHovered ? 1 : 0,
        0.05  // 调整过渡速度的值
      );

      // 平滑过渡动画强度
      materialRef.current.animationStrength = THREE.MathUtils.lerp(
        materialRef.current.animationStrength || 1.0,
        isHovered ? 0.0 : 1.0,
        0.02  // 调整动画停止速度的值
      );

      // 基础正弦波动
      let offset = Math.sin(state.clock.elapsedTime) * 0.01 * (1 - transitionRef.current.hover);
      
      // 平滑过渡的方波效果
      const squareWave = Math.sign(Math.sin(state.clock.elapsedTime * 2)) * 0.03;
      transitionRef.current.wave = THREE.MathUtils.lerp(
        transitionRef.current.wave,
        squareWave,
        0.1  // 调整方波过渡速度的值
      );

      // 使用过渡值计算最终偏移量
      const mouseInfluence = (mousePosition.x * 0.1);
      const hoverEffect = transitionRef.current.wave + mouseInfluence;
      offset += hoverEffect * transitionRef.current.hover;
      
      // 更新水平偏移量
      materialRef.current.horizontalOffset = offset;

      // 将 hover 值传递给着色器
      materialRef.current.hover = transitionRef.current.hover;
    }
  });

  // 鼠标移动相关：开始处理鼠标移动，更新着色器中的鼠标位置
  const handlePointerMove = (event) => {
    if (!materialRef.current || !meshRef.current) return;

    // 将鼠标在世界坐标下的点转换到当前 mesh（球体）的本地坐标
    const localPos = meshRef.current.worldToLocal(event.point.clone());
    materialRef.current.mousePos.set(localPos.x, localPos.y, localPos.z);

    // 记录鼠标位置，若要计算其他效果可使用
    const x = (event.point.x / (window.innerWidth / 2));
    const y = (event.point.y / (window.innerHeight / 2));
    setMousePosition({ x, y });
  };
  // 鼠标移动相关：结束处理鼠标移动事件，更新着色器中的鼠标位置

  // 渲染 3D 球体
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