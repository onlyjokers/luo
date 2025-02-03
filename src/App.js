// 导入必要的React组件和hooks
import React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber';     // Three.js的React封装
import { OrbitControls } from '@react-three/drei';  // 相机控制组件
import Sphere from './Sphere2';  // 导入自定义球体组件
import { useRef } from 'react';  // 用于获取DOM引用
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
  // 创建对OrbitControls的引用
  const controlsRef = useRef();
  // 新增：存储相机偏移，以在 SteadicamRig 中使用
  const offsetRef = useRef(new THREE.Vector3(0, 0, 0));

  // 鼠标移动相关：开始处理Canvas鼠标移动事件，更新控制器和相机偏移
  // 处理鼠标移动事件的函数
  const handleMouseMove = (e) => {
    if (controlsRef.current) {
      // 将鼠标位置转换为旋转角度 
      // clientY/innerHeight将得到0-1的值，减0.5使其范围为-0.5到0.5
      // 乘0.5来限制旋转幅度
      const rotX = (e.clientY / window.innerHeight - 0.5) * 0.5;
      const rotY = (e.clientX / window.innerWidth - 0.5) * 0.5;
      
      // 平滑设置相机角度
      // setAzimuthalAngle设置水平旋转角度
      // setPolarAngle设置垂直旋转角度
      controlsRef.current.setAzimuthalAngle(-rotY);
      controlsRef.current.setPolarAngle(Math.PI / 2 - rotX);
    }
    // 将鼠标范围转化为偏移量 (x, y, z)，z 可随意调节以产生前后“摇臂”感
    offsetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 5.0;
    offsetRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 5.0;
    offsetRef.current.z = 0.4 * Math.sin(e.clientX * 0.02);
  };
  // 鼠标移动相关：结束处理Canvas鼠标移动事件，更新控制器和相机偏移

  return (
    // Canvas是Three.js的渲染容器
    <Canvas
      // 设置相机初始位置
      camera={{ position: [0, 0, 4] }}
      // 设置画布样式
      style={{ 
        width: '100vw', 
        height: '100vh',
        background: '#ffffff'
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