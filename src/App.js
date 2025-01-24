// 导入必要的React组件和hooks
import React from 'react'
import { Canvas } from '@react-three/fiber';     // Three.js的React封装
import { OrbitControls } from '@react-three/drei';  // 相机控制组件
import Sphere from './Sphere2';  // 导入自定义球体组件
import { useRef } from 'react';  // 用于获取DOM引用

export default function App() {
  // 创建对OrbitControls的引用
  const controlsRef = useRef();

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
  };

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
    </Canvas>
  );
}