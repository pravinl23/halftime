"use client"

import { useEffect, useRef } from 'react'
import { Renderer, Camera, Transform, Plane, Program, Mesh, Vec2 } from 'ogl'

interface LightRaysProps {
  raysOrigin?: 'top-center' | 'bottom-center' | 'center'
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  followMouse?: boolean
  mouseInfluence?: number
  noiseAmount?: number
  distortion?: number
  className?: string
}

export default function LightRays({
  raysOrigin = 'bottom-center',
  raysColor = '#ffffff',
  raysSpeed = 1.5,
  lightSpread = 0.8,
  rayLength = 1.2,
  followMouse = false,
  mouseInfluence = 0.1,
  noiseAmount = 0.1,
  distortion = 0.05,
  className = ''
}: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = new Renderer({ canvas: canvasRef.current, alpha: true })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const camera = new Camera(gl, { fov: 45 })
    camera.position.z = 5

    const scene = new Transform()

    // Convert hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 1, g: 1, b: 1 }
    }

    const color = hexToRgb(raysColor)

    // Get origin position
    const getOriginY = () => {
      if (raysOrigin === 'top-center') return 1.0
      if (raysOrigin === 'bottom-center') return -1.0
      return 0.0
    }

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `

    const fragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec3 uColor;
      uniform float uSpeed;
      uniform float uSpread;
      uniform float uLength;
      uniform float uMouseInfluence;
      uniform float uNoise;
      uniform float uDistortion;
      uniform float uOriginY;
      varying vec2 vUv;

      // Simplex noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5 + uMouse.x * uMouseInfluence, uOriginY * 0.5 + 0.5 + uMouse.y * uMouseInfluence);
        
        vec2 dir = uv - center;
        float dist = length(dir);
        float angle = atan(dir.y, dir.x);
        
        // Create soft radial gradient instead of rays
        float radialGradient = 1.0 - smoothstep(0.0, uLength, dist);
        
        // Add very subtle angular variation for some texture
        float angularNoise = 0.0;
        angularNoise += sin(angle * 100.0 + uTime * uSpeed) * 0.015;
        angularNoise += sin(angle * 150.0 - uTime * uSpeed * 0.8) * 0.01;
        angularNoise += sin(angle * 200.0 + uTime * uSpeed * 1.2) * 0.008;
        
        // Add procedural noise for organic feel
        float proceduralNoise = snoise(vec2(angle * 50.0, dist * 5.0 + uTime * 0.2)) * uNoise * 0.5;
        
        // Combine everything with heavy smoothing
        float intensity = radialGradient;
        intensity *= (1.0 + angularNoise + proceduralNoise);
        intensity = smoothstep(0.0, 1.0, intensity);
        
        // Very subtle distortion
        intensity *= 1.0 + snoise(uv * 15.0 + uTime * 0.1) * uDistortion * 0.5;
        
        // Apply color with soft falloff
        vec3 color = uColor * intensity;
        
        gl_FragColor = vec4(color, intensity * 0.5);
      }
    `

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vec2() },
        uColor: { value: [color.r, color.g, color.b] },
        uSpeed: { value: raysSpeed },
        uSpread: { value: lightSpread },
        uLength: { value: rayLength },
        uMouseInfluence: { value: mouseInfluence },
        uNoise: { value: noiseAmount },
        uDistortion: { value: distortion },
        uOriginY: { value: getOriginY() }
      },
      transparent: true
    })

    const geometry = new Plane(gl, { width: 2, height: 2 })
    const mesh = new Mesh(gl, { geometry, program })
    mesh.setParent(scene)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!followMouse) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Resize handler
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    let animationId: number
    const animate = (t: number) => {
      animationId = requestAnimationFrame(animate)
      
      program.uniforms.uTime.value = t * 0.001
      if (followMouse) {
        program.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
      }
      
      renderer.render({ scene, camera })
    }
    animate(0)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, followMouse, mouseInfluence, noiseAmount, distortion])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  )
}
