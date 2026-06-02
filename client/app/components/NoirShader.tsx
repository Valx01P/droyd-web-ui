"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./NoirShader.module.css";

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 safeResolution = max(uResolution, vec2(1.0));
    vec2 uv = gl_FragCoord.xy / safeResolution;
    vec2 p = uv - 0.5;
    p.x *= safeResolution.x / safeResolution.y;

    float vignette = smoothstep(0.88, 0.18, length(p));
    float scanline = sin((uv.y + uTime * 0.018) * 900.0) * 0.035;
    float verticalTear = smoothstep(0.986, 1.0, sin((uv.x * 36.0) + noise(vec2(uTime * 0.3, uv.y * 6.0)) * 1.7));
    float labGrid = smoothstep(0.992, 0.999, sin((p.x * 18.0) + (uTime * 0.08)) * sin((p.y * 13.0) - (uTime * 0.04)));
    float smokeA = noise((p * 2.4) + vec2(uTime * 0.035, -uTime * 0.02));
    float smokeB = noise((p * 5.2) + vec2(-uTime * 0.025, uTime * 0.03));
    float smoke = smoothstep(0.28, 0.92, smokeA * 0.64 + smokeB * 0.52);
    float mouseBeam = smoothstep(0.55, 0.0, distance(uv, uMouse));

    vec3 cyan = vec3(0.17, 0.86, 0.83);
    vec3 brass = vec3(0.95, 0.62, 0.21);
    vec3 blood = vec3(0.82, 0.07, 0.08);
    vec3 steel = vec3(0.5, 0.67, 0.72);

    vec3 color = cyan * (labGrid * 0.22 + mouseBeam * 0.08);
    color += brass * (smoke * 0.11);
    color += blood * (verticalTear * 0.2);
    color += steel * scanline;

    float alpha = clamp((smoke * 0.16 + labGrid * 0.28 + verticalTear * 0.32 + mouseBeam * 0.08) * vignette * uIntensity, 0.0, 0.62);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function NoirShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const preserveDrawingBuffer = new URLSearchParams(window.location.search).has("visual-check");
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      canvas,
      powerPreference: "high-performance",
      preserveDrawingBuffer,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      depthWrite: false,
      transparent: true,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.62, 0.42) },
        uTime: { value: 0 },
        uIntensity: { value: reduceMotion ? 0.42 : 1 },
      },
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const width = Math.max(1, parent.clientWidth);
      const height = Math.max(1, parent.clientHeight);
      renderer.setSize(width, height, false);
      const pixelRatio = renderer.getPixelRatio();
      material.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
    };

    const updateMouse = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      material.uniforms.uMouse.value.set(
        (event.clientX - rect.left) / Math.max(1, rect.width),
        1 - (event.clientY - rect.top) / Math.max(1, rect.height),
      );
    };

    let frame = 0;
    const clock = new THREE.Clock();
    const render = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    parent.addEventListener("pointermove", updateMouse);

    return () => {
      window.removeEventListener("resize", resize);
      parent.removeEventListener("pointermove", updateMouse);
      window.cancelAnimationFrame(frame);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" data-webgl-canvas />;
}
