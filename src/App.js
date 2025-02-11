import React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber';     // Three.js 的 React 封装
import { OrbitControls } from '@react-three/drei';  // 相机控制组件
import Sphere from './Sphere';  // 导入自定义球体组件
import { useRef } from 'react';  // 用于获取 DOM 引用
import * as THREE from 'three';

// 新增 SteadicamRig 组件
function SteadicamRig({ offsetRef }) {
  const { camera } = useThree();

  useFrame(() => {
    // 基础位置与目标朝向
    const basePos = new THREE.Vector3(0, 0, 4);
    const baseLookAt = new THREE.Vector3(0, 0, 0);

    // 计算期望位置：基础位置 + 鼠标偏移
    const desiredPos = basePos.clone().add(offsetRef.current);
    // 平滑插值相机位置
    camera.position.lerp(desiredPos, 0.05);

    // 使相机大致朝向球体中心，同时根据 offsetRef.current 略微偏移
    const lookTarget = baseLookAt.clone().add(
      new THREE.Vector3(
        offsetRef.current.x * 0.2,
        offsetRef.current.y * 0.2,
        offsetRef.current.z * 0.2
      )
    );
    camera.lookAt(lookTarget);
  });

  return null;
}

export default function App() {
  // 创建对 OrbitControls 的引用
  const controlsRef = useRef();
  // 新增：存储相机偏移，以在 SteadicamRig 中使用
  const offsetRef = useRef(new THREE.Vector3(0, 0, 0));
  // 在组件开始处初始化上一次鼠标位置为屏幕中心（归一化的中间值）
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // 鼠标移动相关：开始处理 Canvas 鼠标移动事件，更新控制器和相机偏移（连续状态）
  const handleMouseMove = (e) => {
    // 计算归一化的鼠标位置
    const norm = {
      x: e.clientX / window.innerWidth - 0.5,
      y: e.clientY / window.innerHeight - 0.5,
    };
    // 根据当前与上一次位置计算偏移差值
    const diffX = norm.x - prevMouseRef.current.x;
    const diffY = norm.y - prevMouseRef.current.y;
    // 累加偏移，保持连续状态；根据需要调整乘数来控制偏移幅度
    offsetRef.current.x += diffX * 5.0;
    offsetRef.current.y += -diffY * 5.0;
    // 可选：针对 z 轴也累加一个效果
    offsetRef.current.z += 0.4 * diffX;
    // 更新上一次的鼠标位置
    prevMouseRef.current = norm;
  };
  // 鼠标移动相关：结束处理 Canvas 鼠标移动事件，更新控制器和相机偏移

  return (
    // Canvas 是 Three.js 的渲染容器
    <Canvas
      // 设置相机初始位置
      camera={{ position: [0, 0, 4] }}
      // 修改画布样式，将背景色改为浅灰色
      style={{ 
        width: '100vw', 
        height: '100vh',
        background: 'rgb(255, 255, 255)'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* 添加环境光源 */}
      <ambientLight intensity={0.5} />
      {/* 添加点光源 */}
      <pointLight position={[10, 10, 10]} />
      {/* 渲染球体组件 */}
      <Sphere />
      {/* 相机控制器配置 */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}    // 禁用缩放
        enablePan={false}     // 禁用平移
        enableDamping         // 启用阻尼效果
        dampingFactor={0.1}   // 设置阻尼系数
        minPolarAngle={Math.PI / 2 - 0.5}    // 限制垂直旋转最小角度
        maxPolarAngle={Math.PI / 2 + 0.5}    // 限制垂直旋转最大角度
        minAzimuthAngle={-0.5}               // 限制水平旋转最小角度
        maxAzimuthAngle={0.5}                // 限制水平旋转最大角度
      />
      {/* 使用新定义的 SteadicamRig */}
      <SteadicamRig offsetRef={offsetRef} />
    </Canvas>
  );
}