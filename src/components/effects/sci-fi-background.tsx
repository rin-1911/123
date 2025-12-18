"use client";

import { useEffect, useRef } from "react";

// 登录页面的科幻3D背景
export function SciFiLoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 保存非空引用
    const cvs = canvas;
    const context = ctx;

    let animationId: number;
    let particles: Particle[] = [];
    let gridLines: GridLine[] = [];
    let time = 0;

    // 设置canvas尺寸
    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      initParticles();
      initGrid();
    };

    // 粒子类
    class Particle {
      x: number = 0;
      y: number = 0;
      z: number = 0;
      size: number = 0;
      speed: number = 0;
      color: string = "";
      angle: number = 0;
      orbit: number = 0;

      constructor() {
        this.reset();
        this.z = Math.random() * cvs.width;
      }

      reset() {
        this.x = Math.random() * cvs.width - cvs.width / 2;
        this.y = Math.random() * cvs.height - cvs.height / 2;
        this.z = cvs.width;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 2 + 1;
        this.color = `hsla(${180 + Math.random() * 60}, 100%, ${60 + Math.random() * 20}%, `;
        this.angle = Math.random() * Math.PI * 2;
        this.orbit = Math.random() * 100 + 50;
      }

      update() {
        this.z -= this.speed * 2;
        this.angle += 0.01;
        
        if (this.z <= 0) {
          this.reset();
        }
      }

      draw() {
        const scale = cvs.width / this.z;
        const x2d = this.x * scale + cvs.width / 2;
        const y2d = this.y * scale + cvs.height / 2;
        const size = this.size * scale;
        const opacity = 1 - this.z / cvs.width;

        context.beginPath();
        context.arc(x2d, y2d, Math.max(0.5, size), 0, Math.PI * 2);
        context.fillStyle = this.color + opacity + ")";
        context.fill();

        // 添加发光效果
        context.shadowBlur = 10;
        context.shadowColor = this.color + "0.5)";
      }
    }

    // 网格线类
    class GridLine {
      y: number;
      speed: number;

      constructor(y: number) {
        this.y = y;
        this.speed = 2;
      }

      update() {
        this.y += this.speed;
        if (this.y > cvs.height) {
          this.y = cvs.height / 2;
        }
      }

      draw() {
        const perspective = (this.y - cvs.height / 2) / (cvs.height / 2);
        const alpha = Math.abs(perspective) * 0.3;
        
        context.beginPath();
        context.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        context.lineWidth = 1;
        context.moveTo(0, this.y);
        context.lineTo(cvs.width, this.y);
        context.stroke();
      }
    }

    // 初始化粒子
    function initParticles() {
      particles = [];
      const count = Math.floor((cvs.width * cvs.height) / 8000);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    // 初始化网格
    function initGrid() {
      gridLines = [];
      for (let i = 0; i < 20; i++) {
        gridLines.push(new GridLine(cvs.height / 2 + i * 30));
      }
    }

    // 绘制六边形网格
    function drawHexGrid() {
      const hexSize = 60;
      const rows = Math.ceil(cvs.height / (hexSize * 1.5)) + 2;
      const cols = Math.ceil(cvs.width / (hexSize * Math.sqrt(3))) + 2;

      context.strokeStyle = "rgba(0, 255, 255, 0.05)";
      context.lineWidth = 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * hexSize * Math.sqrt(3) + (row % 2) * hexSize * Math.sqrt(3) / 2;
          const y = row * hexSize * 1.5;
          drawHexagon(x, y, hexSize * 0.9);
        }
      }
    }

    function drawHexagon(x: number, y: number, size: number) {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
          context.moveTo(hx, hy);
        } else {
          context.lineTo(hx, hy);
        }
      }
      context.closePath();
      context.stroke();
    }

    // 绘制中心能量环
    function drawEnergyRings() {
      const centerX = cvs.width * 0.75;
      const centerY = cvs.height / 2;

      for (let i = 0; i < 5; i++) {
        const radius = 100 + i * 50 + Math.sin(time * 0.02 + i) * 20;
        const alpha = 0.1 - i * 0.015;
        
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        context.lineWidth = 2;
        context.stroke();
      }

      // 旋转的弧线
      for (let i = 0; i < 3; i++) {
        const startAngle = time * 0.01 + (i * Math.PI * 2) / 3;
        const endAngle = startAngle + Math.PI / 2;
        const radius = 150 + i * 40;

        context.beginPath();
        context.arc(centerX, centerY, radius, startAngle, endAngle);
        context.strokeStyle = `rgba(0, 200, 255, ${0.3 - i * 0.08})`;
        context.lineWidth = 3;
        context.lineCap = "round";
        context.stroke();
      }
    }

    // 绘制数据流
    function drawDataStreams() {
      const streams = 8;
      for (let i = 0; i < streams; i++) {
        const x = (cvs.width / streams) * i + 50;
        const offset = (time * 2 + i * 100) % cvs.height;
        
        const gradient = context.createLinearGradient(x, offset - 100, x, offset);
        gradient.addColorStop(0, "rgba(0, 255, 255, 0)");
        gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.3)");
        gradient.addColorStop(1, "rgba(0, 255, 255, 0)");

        context.beginPath();
        context.strokeStyle = gradient;
        context.lineWidth = 2;
        context.moveTo(x, offset - 100);
        context.lineTo(x, offset);
        context.stroke();
      }
    }

    // 动画循环
    function animate() {
      context.fillStyle = "rgba(15, 23, 42, 0.1)";
      context.fillRect(0, 0, cvs.width, cvs.height);

      // 绘制背景元素
      drawHexGrid();
      drawDataStreams();
      drawEnergyRings();

      // 更新和绘制网格线
      gridLines.forEach((line) => {
        line.update();
        line.draw();
      });

      // 更新和绘制粒子
      context.shadowBlur = 0;
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      time++;
      animationId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener("resize", resize);

    // 初始填充背景
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, cvs.width, cvs.height);

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
    />
  );
}

// 系统加载时的高级科幻动画 - Deep Void风格
export function SciFiLoadingAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* 噪点纹理 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 微弱扫描线 */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[1px] w-full"
            style={{
              top: `${30 + i * 20}%`,
              background: `linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.3) 50%, transparent 100%)`,
              animation: `scanLine ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* 中心加载器 */}
      <div className="relative">
        {/* 外圈 - 缓慢旋转 */}
        <div className="absolute -inset-16 animate-spin" style={{ animationDuration: "12s" }}>
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="voidGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
                <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#voidGrad1)"
              strokeWidth="1"
              strokeDasharray="50 100"
            />
          </svg>
        </div>

        {/* 中圈 - 反向旋转 */}
        <div
          className="absolute -inset-10 animate-spin"
          style={{ animationDuration: "8s", animationDirection: "reverse" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(0, 240, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="30 60"
            />
          </svg>
        </div>

        {/* 内圈发光 */}
        <div className="absolute -inset-6">
          <div 
            className="w-full h-full rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)",
              animation: "pulseGlow 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* 核心 */}
        <div className="relative w-20 h-20">
          {/* 外框 */}
          <div className="absolute inset-0 rounded-xl border border-cyan-500/30 rotate-45" />
          <div className="absolute inset-1 rounded-lg border border-cyan-500/20" />
          
          {/* 内部发光 */}
          <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent" />
          
          {/* 图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animation: "iconPulse 2s ease-in-out infinite" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>

        {/* 角点装饰 */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute w-2 h-2"
            style={{
              left: "50%",
              top: "50%",
              transform: `rotate(${deg}deg) translateY(-50px)`,
            }}
          >
            <div 
              className="w-full h-full bg-cyan-400/50 rounded-full"
              style={{
                animation: `dotPulse 1.5s ease-in-out infinite`,
                animationDelay: `${deg / 360}s`,
                boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
              }}
            />
          </div>
        ))}
      </div>

      {/* 加载文字 */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-center">
        <p className="text-zinc-500 text-xs font-mono tracking-[0.5em] uppercase">
          INITIALIZING
        </p>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-cyan-500/50 rounded-full"
              style={{
                animation: "dotBounce 1s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 角落装饰 */}
      <div className="absolute top-6 left-6 w-12 h-12 border-l border-t border-zinc-800" />
      <div className="absolute top-6 right-6 w-12 h-12 border-r border-t border-zinc-800" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-l border-b border-zinc-800" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-r border-b border-zinc-800" />

      {/* 顶部状态 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-zinc-700 tracking-widest">
        DENTAL-OPS :: SYSTEM BOOT
      </div>

      {/* CSS动画 */}
      <style jsx>{`
        @keyframes scanLine {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(100%);
            opacity: 1;
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        @keyframes iconPulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes dotBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
