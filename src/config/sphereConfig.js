// 着色器材质统一变量（uniforms）配置
export const shaderUniforms = {
    wireframeWidth: 0.04,      // 线框宽度
    noiseScale: 4.0,           // 噪声纹理缩放比例
    noiseStrength: 0.02,       // 噪声强度
    horizontalOffset: 1.0,      // 水平偏移基准值
    animationStrength: 0.1,    // 基础动画强度
};

// 动画过渡配置
export const animationConfig = {
    // 悬停动画
    hover: {
        scaleUp: 1.1,          // 悬停时的放大比例
        scaleNormal: 1.0,      // 正常比例
        transitionSpeed: 0.1,   // 缩放过渡速度
    },
    // 旋转动画
    rotation: {
        normalSpeed: 0.0017,    // 正常旋转速度
        hoverSpeed: 0,          // 悬停时的旋转速度
        transitionSpeed: 0.05,  // 旋转速度过渡平滑度
    },
    // 波动效果
    wave: {
        frequency: 2,           // 波动频率
        amplitude: 0.03,        // 波动幅度
        transitionSpeed: 0.1,   // 波动过渡速度
    },
};

// 变形效果配置
export const deformationConfig = {
    // 涟漪效果
    ripple: {
        frequency: 10.0,        // 涟漪频率
        speed: 3.0,            // 涟漪动画速度
        amplitude: 0.03,        // 涟漪强度
    },
    // 漩涡效果
    twist: {
        frequency: 4.0,         // 漩涡频率
        amplitude: 0.04,        // 漩涡强度
    },
    // 折叠效果
    fold: {
        frequency: 3.0,         // 折叠频率
        amplitude: 0.01,        // 折叠强度
    },
};

// 噪声动画配置
export const noiseAnimationConfig = {
    vertical: {
        speed: 0.2,            // 垂直噪声动画速度
    },
    horizontal: {
        speed: 0.15,           // 水平噪声动画速度
        offset: 0.5,           // 水平噪声偏移
    },
};

// 几何体配置
export const geometryConfig = {
    radius: 1,                 // 球体半径
    segments: 128,             // 球体分段数
};

// 线框渲染配置
export const wireframeConfig = {
    divisions: 280.0,          // 经线分段数
    color: {
        wire: [0.5, 0.5, 0.5], // 线框颜色 (灰色)
        base: [1.0, 1.0, 1.0], // 基础颜色 (白色)
    },
};