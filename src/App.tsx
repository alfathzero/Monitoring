import React, { useState, useEffect } from "react";
import { 
  Server, 
  Cpu, 
  Database, 
  HardDrive, 
  Layers,
  Send, 
  Terminal, 
  Settings, 
  Code, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clipboard, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink,
  Wifi,
  Cloud,
  Check,
  AlertTriangle,
  Trash2,
  Bell,
  Clock,
  Activity,
  Menu,
  X,
  Globe,
  Zap,
  Play,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Folder,
  File,
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  Square,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

// Types
interface AlertLog {
  id: string;
  timestamp: string;
  type: "cpu" | "ram" | "disk" | "system" | "remote";
  level: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
}
interface SystemStats {
  cpu: number;
  ram: {
    total: number;
    free: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  uptime: number;
  platform: string;
  arch: string;
  cpuCores: number;
  cpuModel: string;
  loadAvg: number[];
}

interface TelegramConfig {
  token: string;
  chatId: string;
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThreshold: number;
  alertIntervalMinutes: number;
  isActive: boolean;
  status: string;
  smartCleanupEnabled?: boolean;
  smartCleanupThreshold?: number;
  smartCleanupDurationHours?: number;
  domain?: string;
  ptla?: string;
  ptlc?: string;
  scanInterval?: number;
  domain2?: string;
  ptla2?: string;
  ptlc2?: string;
  scanInterval2?: number;
}

interface RemoteDevice {
  nodeId: string;
  secret: string;
  stats: {
    cpu: number;
    cores?: number;
    ram: { used: number; total: number; percent: number };
    disk: { used: number; total: number; percent: number };
    uptime: number;
    os: string;
    geo?: { country: string; countryCode: string; city: string };
  };
  lastSeen: number;
}

interface PterodactylConfig {
  pterodactylDomain: string;
  pterodactylApiKey: string;
  pterodactylActive: boolean;
}

interface PterodactylServer {
  id: string;
  name: string;
  uuid: string;
  node: string;
  description: string;
  memoryLimit: number;
  diskLimit: number;
  cpuLimit: number;
  status: string;
  currentCpu: number;
  currentMemory: number;
  currentDisk: number;
  isReal: boolean;
  lastScanned: string;
}

// Helper: Interactive "Sistem Bintang Kita" (Solar System) Simulation Canvas
interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

function HoloGalaxyCanvas({ 
  cpu, 
  ram, 
  stats, 
  warpMultiplier = 1.0, 
  orbitLabelsVisible = true, 
  starSystemTheme = "standard" 
}: { 
  cpu: number; 
  ram: number; 
  stats: any; 
  warpMultiplier?: number; 
  orbitLabelsVisible?: boolean; 
  starSystemTheme?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseRef = React.useRef({ x: 0, y: 0, hover: false });

  // Hold interactive coordinates for planets to let cursor hover trigger detailed labels
  const planetPositionsRef = React.useRef<{ [key: string]: { x: number; y: number; label: string; val: string } }>({});

  // Persist angles across updates using refs to prevent jump lists/flicker resets
  const mercuryMRef = React.useRef(Math.random() * Math.PI * 2);
  const venusMRef = React.useRef(Math.random() * Math.PI * 2);
  const earthMRef = React.useRef(Math.random() * Math.PI * 2);
  const marsMRef = React.useRef(Math.random() * Math.PI * 2);
  const jupiterMRef = React.useRef(Math.random() * Math.PI * 2);
  const saturnMRef = React.useRef(Math.random() * Math.PI * 2);
  const moonAngleRef = React.useRef(Math.random() * Math.PI * 2);

  // Persist background stars layout to stop background shifting/shaking on updates
  const backgroundStarsRef = React.useRef<Star[]>([]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.offsetWidth || 500;
    let height = canvas.offsetHeight || 280;

    // Render at device resolution (capped for mobile GPU sanity) so edges stay crisp
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      // Setting width/height resets the transform, so apply it once cleanly here.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    sizeCanvas();

    // Resize observer to auto-adapt sizes dynamically
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        width = entry.contentRect.width || canvas.offsetWidth || 500;
        height = entry.contentRect.height || canvas.offsetHeight || 280;
        sizeCanvas();
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    if (backgroundStarsRef.current.length === 0) {
      const stars: Star[] = [];
      for (let i = 0; i < 150; i++) {
        const bright = Math.random() > 0.9;
        stars.push({
          x: Math.random(),
          y: Math.random(),
          size: bright ? Math.random() * 0.9 + 1.3 : Math.random() * 1.1 + 0.25,
          opacity: bright ? Math.random() * 0.35 + 0.6 : Math.random() * 0.65 + 0.15,
          speed: 0.005 + Math.random() * 0.012
        });
      }
      backgroundStarsRef.current = stars;
    }
    const backgroundStars = backgroundStarsRef.current;

    let ripples: { x: number; y: number; radius: number; maxRadius: number; opacity: number }[] = [];

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: 100,
        opacity: 1
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.hover = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.hover = false;
    };

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Keplerian orbital configurations (Realistis: elliptical eccentric orbits + 3D Oblique skewed plane angle view)
    const LAN = -25 * Math.PI / 180; // Longitude of ascending node (plane tilt angle on screen)
    const tiltY = 0.42;              // Compression factor along the minor screen axis (oblique view skew)

    // Eccentricities (e) of solar system bodies
    const eMercury = 0.2056;
    const eVenus = 0.0068;
    const eEarth = 0.0167;
    const eMars = 0.0934;
    const eJupiter = 0.0489;
    const eSaturn = 0.0565;

    // Longitude of Perihelion (w) in radians - aligns the elliptical axes realistically in different directions
    const wMercury = 1.34;
    const wVenus = 2.30;
    const wEarth = 1.79;
    const wMars = 5.86;
    const wJupiter = 0.25;
    const wSaturn = 1.61;

    // Solve Kepler's Equation: M = E - e * sin(E) using Newton-Raphson method (100% physically accurate model)
    const solveKepler = (M: number, eccentricity: number) => {
      let E = M;
      for (let i = 0; i < 5; i++) {
        E = E - (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
      }
      return E;
    };

    const render = () => {
      const centerX = width / 2;
      const centerY = height / 2;
      const minDim = Math.min(width, height);

      // Full repaint each frame keeps stars and thin lines crisp (no smearing trails).
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#020208");
      bgGrad.addColorStop(0.55, "#050410");
      bgGrad.addColorStop(1, "#020206");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Faint nebula clouds for depth
      const nebulaA = ctx.createRadialGradient(width * 0.18, height * 0.28, 0, width * 0.18, height * 0.28, width * 0.55);
      nebulaA.addColorStop(0, starSystemTheme === "neutron" ? "rgba(0,140,200,0.09)" : starSystemTheme === "nebula" ? "rgba(150,40,190,0.10)" : "rgba(96,64,170,0.07)");
      nebulaA.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebulaA;
      ctx.fillRect(0, 0, width, height);

      const nebulaB = ctx.createRadialGradient(width * 0.82, height * 0.74, 0, width * 0.82, height * 0.74, width * 0.5);
      nebulaB.addColorStop(0, starSystemTheme === "neutron" ? "rgba(0,190,230,0.06)" : starSystemTheme === "nebula" ? "rgba(225,70,205,0.07)" : "rgba(210,100,40,0.05)");
      nebulaB.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebulaB;
      ctx.fillRect(0, 0, width, height);

      // 1. Twinkling starfield with subtle diffraction spikes on bright stars
      const nowMs = Date.now();
      for (const star of backgroundStars) {
        const twinkle = 0.72 + 0.28 * Math.sin(nowMs * star.speed * 0.5 + star.x * 57 + star.y * 31);
        const alpha = Math.max(0.04, Math.min(1, star.opacity * twinkle));
        const sx = star.x * width;
        const sy = star.y * height;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        if (star.size > 1.35 && alpha > 0.55) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(sx - star.size * 2.4, sy); ctx.lineTo(sx + star.size * 2.4, sy);
          ctx.moveTo(sx, sy - star.size * 2.4); ctx.lineTo(sx, sy + star.size * 2.4);
          ctx.stroke();
        }
      }

      // Stable speed limits independent of actual usage for majestic uniform orbits that never stutter
      const cpuSpeedFactor = 1.0;
      const ramUsageFactor = 1.0;

      // Update Keplerian system Mean Anomalies
      // Progress of orbits matches actual Kepler's 3rd Law ratio (speed ~ a^-1.5)
      mercuryMRef.current += 0.038 * cpuSpeedFactor * warpMultiplier;
      venusMRef.current   += 0.024 * cpuSpeedFactor * warpMultiplier;
      earthMRef.current   += 0.016 * cpuSpeedFactor * warpMultiplier;
      marsMRef.current    += 0.010 * cpuSpeedFactor * warpMultiplier;
      jupiterMRef.current += 0.0042 * cpuSpeedFactor * warpMultiplier;
      saturnMRef.current  += 0.0022 * cpuSpeedFactor * warpMultiplier;
      moonAngleRef.current += 0.065 * (0.8 + ramUsageFactor * 1.5) * warpMultiplier;

      const mercuryM = mercuryMRef.current;
      const venusM   = venusMRef.current;
      const earthM   = earthMRef.current;
      const marsM    = marsMRef.current;
      const jupiterM = jupiterMRef.current;
      const saturnM  = saturnMRef.current;
      const moonAngle = moonAngleRef.current;

      // Define Semi-Major Orbit Radii proportional to scale sizes
      const rMercury = minDim * 0.14;
      const rVenus = minDim * 0.22;
      const rEarth = minDim * 0.32;
      const rMars = minDim * 0.42;
      const rJupiter = minDim * 0.54;
      const rSaturn = minDim * 0.68;

      // Helper function to project Keplerian position coordinates to custom 3D oblique system
      const getKeplerianPos = (a: number, e: number, w: number, M: number) => {
        const E = solveKepler(M, e);
        const b = a * Math.sqrt(1 - e * e);
        // Position relative to Sun (Sun is at focus, i.e., shifted in the x negative direction by a * e)
        const xOrb = a * Math.cos(E) - a * e;
        const yOrb = b * Math.sin(E);

        // Rotate in the plane by Longitude of Perihelion w
        const xu = xOrb * Math.cos(w) - yOrb * Math.sin(w);
        const yu = xOrb * Math.sin(w) + yOrb * Math.cos(w);

        // Standard tilted 3D affine projection onto the screen coordinates
        const px = centerX + xu * Math.cos(LAN) - yu * Math.sin(LAN);
        const py = centerY + (xu * Math.sin(LAN) + yu * Math.cos(LAN)) * tiltY;
        return { x: px, y: py };
      };

      // Helper to draw realistic eccentric elliptical orbital ring tracks (glow + crisp core)
      const drawOrbitTrack = (a: number, e: number, w: number, color: string) => {
        ctx.beginPath();
        for (let j = 0; j <= 140; j++) {
          const tempE = (j / 140) * Math.PI * 2;
          const b = a * Math.sqrt(1 - e * e);
          const xOrb = a * Math.cos(tempE) - a * e;
          const yOrb = b * Math.sin(tempE);

          const xu = xOrb * Math.cos(w) - yOrb * Math.sin(w);
          const yu = xOrb * Math.sin(w) + yOrb * Math.cos(w);
          const cx = centerX + xu * Math.cos(LAN) - yu * Math.sin(LAN);
          const cy = centerY + (xu * Math.sin(LAN) + yu * Math.cos(LAN)) * tiltY;

          if (j === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.save();
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      };

      // 2. Draw Orbit Track Rings (Elliptical & Tilted!)
      drawOrbitTrack(rMercury, eMercury, wMercury, "rgba(230, 200, 180, 0.08)");
      drawOrbitTrack(rVenus, eVenus, wVenus, "rgba(240, 220, 150, 0.08)");
      drawOrbitTrack(rEarth, eEarth, wEarth, "rgba(100, 200, 255, 0.11)");
      drawOrbitTrack(rMars, eMars, wMars, "rgba(250, 120, 100, 0.08)");
      drawOrbitTrack(rJupiter, eJupiter, wJupiter, "rgba(245, 180, 100, 0.08)");
      drawOrbitTrack(rSaturn, eSaturn, wSaturn, "rgba(245, 220, 160, 0.09)");

      // Comet-like motion trails fading behind each planet
      const drawOrbitTrail = (a: number, e: number, w: number, M: number, rgb: string) => {
        const samples = 16;
        for (let k = samples; k >= 1; k--) {
          const p = getKeplerianPos(a, e, w, M - k * 0.022);
          const fade = 1 - k / samples;
          ctx.fillStyle = `rgba(${rgb},${fade * 0.42})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.35 + fade * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawOrbitTrail(rMercury, eMercury, wMercury, mercuryM, "210,200,215");
      drawOrbitTrail(rVenus, eVenus, wVenus, venusM, "250,220,120");
      drawOrbitTrail(rEarth, eEarth, wEarth, earthM, "100,190,255");
      drawOrbitTrail(rMars, eMars, wMars, marsM, "255,120,90");
      drawOrbitTrail(rJupiter, eJupiter, wJupiter, jupiterM, "245,180,100");
      drawOrbitTrail(rSaturn, eSaturn, wSaturn, saturnM, "245,220,160");

      // 3. Draw The Sun (Host CPU) — layered corona, plasma surface & lens flare
      const sunNow = Date.now();
      const sunPulse = 1 + Math.sin(sunNow * 0.0035) * 0.07;
      const sunBaseRadius = 15 + (cpu / 100) * 12;
      const sunRadius = sunBaseRadius * sunPulse;

      let sunHot = "#fffbe6", sunCoreStyle = "#ffb300", sunEdge = "#ff5200", sunGlowRGB = "255,150,20";
      if (starSystemTheme === "neutron") {
        sunHot = "#eafcff"; sunCoreStyle = "#22d3ee"; sunEdge = "#0369a1"; sunGlowRGB = "0,220,255";
      } else if (starSystemTheme === "nebula") {
        sunHot = "#ffe6ff"; sunCoreStyle = "#e879f9"; sunEdge = "#86198f"; sunGlowRGB = "230,90,240";
      } else if (cpu > 75) {
        sunHot = "#fff1d6"; sunCoreStyle = "#ff6a00"; sunEdge = "#c81e00"; sunGlowRGB = "255,80,0";
      }

      // Outer corona bloom (additive)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const corona = ctx.createRadialGradient(centerX, centerY, sunRadius * 0.45, centerX, centerY, sunRadius * 4.2);
      corona.addColorStop(0, `rgba(${sunGlowRGB},0.5)`);
      corona.addColorStop(0.22, `rgba(${sunGlowRGB},0.2)`);
      corona.addColorStop(0.55, `rgba(${sunGlowRGB},0.055)`);
      corona.addColorStop(1, `rgba(${sunGlowRGB},0)`);
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius * 4.2, 0, Math.PI * 2);
      ctx.fill();

      // Animated corona streamers (subtle, irregular)
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + sunNow * 0.00035;
        const wobble = 0.5 + 0.5 * Math.sin(sunNow * 0.0013 + i * 1.71);
        const r0 = sunRadius * (1.01 + wobble * 0.03);
        const r1 = sunRadius * (1.14 + wobble * 0.55);
        const x0 = centerX + Math.cos(a) * r0;
        const y0 = centerY + Math.sin(a) * r0;
        const x1 = centerX + Math.cos(a) * r1;
        const y1 = centerY + Math.sin(a) * r1;
        const ray = ctx.createLinearGradient(x0, y0, x1, y1);
        ray.addColorStop(0, `rgba(${sunGlowRGB},${0.08 + wobble * 0.12})`);
        ray.addColorStop(1, `rgba(${sunGlowRGB},0)`);
        ctx.strokeStyle = ray;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      // Photosphere with limb darkening
      const coreGrad = ctx.createRadialGradient(
        centerX - sunRadius * 0.2, centerY - sunRadius * 0.22, sunRadius * 0.05,
        centerX, centerY, sunRadius
      );
      coreGrad.addColorStop(0, sunHot);
      coreGrad.addColorStop(0.38, sunCoreStyle);
      coreGrad.addColorStop(0.82, sunEdge);
      coreGrad.addColorStop(1, `rgba(${sunGlowRGB},0.85)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating surface granulation
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius * 0.98, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 16; i++) {
        const ga = i * 2.399 + sunNow * 0.00016;
        const gr = sunRadius * (0.12 + ((i * 37) % 100) / 100 * 0.72);
        const gx = centerX + Math.cos(ga) * gr;
        const gy = centerY + Math.sin(ga) * gr * 0.9;
        const grr = sunRadius * (0.09 + ((i * 53) % 100) / 100 * 0.17);
        const granule = ctx.createRadialGradient(gx, gy, 0, gx, gy, grr);
        granule.addColorStop(0, `rgba(255,255,255,${0.08 + ((i * 29) % 100) / 100 * 0.1})`);
        granule.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = granule;
        ctx.beginPath();
        ctx.arc(gx, gy, grr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Crisp photon rim
      ctx.strokeStyle = "rgba(255,248,225,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius - 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // Anamorphic lens flare cross
      const flareLen = sunRadius * 3.4;
      const flareGrad = ctx.createLinearGradient(centerX - flareLen, centerY, centerX + flareLen, centerY);
      flareGrad.addColorStop(0, `rgba(${sunGlowRGB},0)`);
      flareGrad.addColorStop(0.5, `rgba(${sunGlowRGB},0.32)`);
      flareGrad.addColorStop(1, `rgba(${sunGlowRGB},0)`);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX - flareLen, centerY);
      ctx.lineTo(centerX + flareLen, centerY);
      ctx.stroke();
      const flareGradV = ctx.createLinearGradient(centerX, centerY - flareLen * 0.55, centerX, centerY + flareLen * 0.55);
      flareGradV.addColorStop(0, `rgba(${sunGlowRGB},0)`);
      flareGradV.addColorStop(0.5, `rgba(${sunGlowRGB},0.18)`);
      flareGradV.addColorStop(1, `rgba(${sunGlowRGB},0)`);
      ctx.strokeStyle = flareGradV;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - flareLen * 0.55);
      ctx.lineTo(centerX, centerY + flareLen * 0.55);
      ctx.stroke();
      ctx.restore();

      // Add simple tag lookup
      const planetPositions: { [key: string]: { x: number; y: number; label: string; val: string } } = {
        sun: { 
          x: centerX, 
          y: centerY, 
          label: "Matahari (Host CPU & Thermal)", 
          val: `${cpu.toFixed(1)}% | Suhu: ${stats?.cpuTemp ? stats.cpuTemp.toFixed(1) : (38 + (cpu * 0.4)).toFixed(1)}°C` 
        }
      };

      // Helper to draw a generic planet orb with realistic sun-lit sphere, curved terminator & rim light
      const drawPlanetAt = (
        name: string,
        px: number,
        py: number,
        bodyRadius: number,
        colors: { inner: string; outer: string; glow: string },
        detailRenderer?: (px: number, py: number) => void,
        clipDetails = true
      ) => {
        // Direction toward the Sun drives the highlight/shadow split
        const dx = px - centerX;
        const dy = py - centerY;
        const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        const lx = -dx / dist;
        const ly = -dy / dist;
        const hx = px + lx * bodyRadius * 0.4;
        const hy = py + ly * bodyRadius * 0.4;

        // Soft atmospheric halo (kept tight so the planet edge stays defined)
        const haloR = bodyRadius * 2.0;
        const atmosphere = ctx.createRadialGradient(px, py, bodyRadius * 0.72, px, py, haloR);
        atmosphere.addColorStop(0, colors.glow.replace(/[\d.]+\)$/, "0.22)"));
        atmosphere.addColorStop(0.55, colors.glow.replace(/[\d.]+\)$/, "0.06)"));
        atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = atmosphere;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Base sphere: bright sun-facing side fading into a dark limb
        const sphere = ctx.createRadialGradient(hx, hy, bodyRadius * 0.05, px, py, bodyRadius * 1.08);
        sphere.addColorStop(0, colors.inner);
        sphere.addColorStop(0.45, colors.inner);
        sphere.addColorStop(0.8, colors.outer);
        sphere.addColorStop(1, "#050509");
        ctx.fillStyle = sphere;
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius, 0, Math.PI * 2);
        ctx.fill();

        // Surface detail + curved terminator are clipped to the disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius, 0, Math.PI * 2);
        ctx.clip();

        const terminator = ctx.createLinearGradient(
          px + lx * bodyRadius * 0.95, py + ly * bodyRadius * 0.95,
          px - lx * bodyRadius * 1.05, py - ly * bodyRadius * 1.05
        );
        terminator.addColorStop(0, "rgba(0,0,0,0)");
        terminator.addColorStop(0.5, "rgba(0,0,0,0.06)");
        terminator.addColorStop(0.78, "rgba(0,0,0,0.42)");
        terminator.addColorStop(1, "rgba(0,0,0,0.88)");
        ctx.fillStyle = terminator;
        ctx.fillRect(px - bodyRadius, py - bodyRadius, bodyRadius * 2, bodyRadius * 2);

        if (detailRenderer && clipDetails) detailRenderer(px, py);
        ctx.restore();

        if (detailRenderer && !clipDetails) detailRenderer(px, py);

        // Sun-facing rim light
        ctx.strokeStyle = "rgba(255,242,214,0.34)";
        ctx.lineWidth = Math.max(0.6, bodyRadius * 0.07);
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius * 0.97, Math.atan2(-ly, -lx) - 0.85, Math.atan2(-ly, -lx) + 0.85);
        ctx.stroke();

        // Specular highlight
        const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, bodyRadius * 0.45);
        spec.addColorStop(0, "rgba(255,255,255,0.28)");
        spec.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(hx, hy, bodyRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Tiny permanent name tag
        if (orbitLabelsVisible) {
          ctx.fillStyle = starSystemTheme === "neutron" ? "rgba(6, 182, 212, 0.8)" : starSystemTheme === "nebula" ? "rgba(217, 70, 239, 0.8)" : "rgba(251, 146, 60, 0.8)";
          ctx.font = "bold 6.5px 'JetBrains Mono', monospace";
          ctx.fillText(name.toUpperCase(), px + bodyRadius + 3, py + 2.5);
        }

        return { x: px, y: py };
      };

      // Configure themed styles for planetary bodies based on starSystemTheme variable
      let colorsMercury = { inner: "#a1a1aa", outer: "#4b5563", glow: "rgba(161, 161, 170, 0.25)" }; // realistically crater grey
      let colorsVenus = { inner: "#fef08a", outer: "#ca8a04", glow: "rgba(234, 179, 8, 0.35)" };   // realistically sulfur clouds yellow
      let colorsEarth = {
        inner: ram > 80 ? "#f43f5e" : "#38bdf8",
        outer: ram > 80 ? "#9f1239" : "#1e40af",
        glow: ram > 80 ? "rgba(244, 63, 94, 0.45)" : "rgba(30, 64, 175, 0.4)"
      };
      let colorsMars = { inner: "#fca5a5", outer: "#b91c1c", glow: "rgba(239, 68, 68, 0.35)" };      // realistically rusty red
      let colorsJupiter = { inner: "#fed7aa", outer: "#c2410c", glow: "rgba(245, 158, 11, 0.3)" };   // realistically orange banded gas giant
      let colorsSaturn = { inner: "#fef08a", outer: "#b45309", glow: "rgba(217, 119, 6, 0.3)" };    // realistically pale golden band
      let saturnRingColor = "rgba(217, 119, 6, 0.4)";
      let saturnRingOuterColor = "rgba(217, 119, 6, 0.15)";
      let earthContinentsColor = ram > 80 ? "rgba(255, 255, 255, 0.25)" : "rgba(34, 197, 94, 0.55)";
      let moonColor = "#e2e8f0";

      if (starSystemTheme === "neutron") {
        colorsMercury = { inner: "#a5f3fc", outer: "#0891b2", glow: "rgba(6, 182, 212, 0.35)" };
        colorsVenus = { inner: "#22d3ee", outer: "#0369a1", glow: "rgba(14, 116, 144, 0.4)" };
        colorsEarth = {
          inner: ram > 80 ? "#f43f5e" : "#38bdf8",
          outer: ram > 80 ? "#9f1239" : "#0f172a",
          glow: ram > 80 ? "rgba(244, 63, 94, 0.45)" : "rgba(56, 189, 248, 0.4)"
        };
        colorsMars = { inner: "#e2e8f0", outer: "#475569", glow: "rgba(148, 163, 184, 0.4)" };
        colorsJupiter = { inner: "#06b6d4", outer: "#083344", glow: "rgba(6, 182, 212, 0.3)" };
        colorsSaturn = { inner: "#0ea5e9", outer: "#0369a1", glow: "rgba(14, 165, 233, 0.3)" };
        saturnRingColor = "rgba(6, 182, 212, 0.45)";
        saturnRingOuterColor = "rgba(6, 182, 212, 0.15)";
        earthContinentsColor = ram > 80 ? "rgba(255, 255, 255, 0.25)" : "rgba(6, 182, 212, 0.4)";
        moonColor = "#e0f2fe";
      } else if (starSystemTheme === "nebula") {
        colorsMercury = { inner: "#fbcfe8", outer: "#9d174d", glow: "rgba(244, 114, 182, 0.35)" };
        colorsVenus = { inner: "#f472b6", outer: "#be185d", glow: "rgba(236, 72, 153, 0.4)" };
        colorsEarth = {
          inner: ram > 80 ? "#f43f5e" : "#c084fc",
          outer: ram > 80 ? "#9f1239" : "#581c87",
          glow: ram > 80 ? "rgba(244, 63, 94, 0.45)" : "rgba(192, 132, 252, 0.4)"
        };
        colorsMars = { inner: "#f472b6", outer: "#881337", glow: "rgba(251, 113, 133, 0.4)" };
        colorsJupiter = { inner: "#d946ef", outer: "#4a044e", glow: "rgba(217, 70, 239, 0.3)" };
        colorsSaturn = { inner: "#ec4899", outer: "#831843", glow: "rgba(236, 72, 153, 0.3)" };
        saturnRingColor = "rgba(217, 70, 239, 0.45)";
        saturnRingOuterColor = "rgba(217, 70, 239, 0.15)";
        earthContinentsColor = ram > 80 ? "rgba(255, 255, 255, 0.25)" : "rgba(217, 70, 239, 0.4)";
        moonColor = "#fae8ff";
      }

      // 4. DRAW ROCKY INNER PLANETS
      // Mercury - fast inner crawler with cratered surface
      const posMercury = getKeplerianPos(rMercury, eMercury, wMercury, mercuryM);
      drawPlanetAt("Mercury", posMercury.x, posMercury.y, 3.2, colorsMercury, (cx, cy) => {
        const craters: [number, number, number][] = [
          [-1.0, -0.7, 0.8], [0.8, 0.5, 0.55], [-0.2, 1.0, 0.45], [0.9, -0.9, 0.4], [-1.0, 0.8, 0.32]
        ];
        craters.forEach(([ox, oy, rr]) => {
          ctx.fillStyle = "rgba(18,18,26,0.42)";
          ctx.beginPath(); ctx.arc(cx + ox, cy + oy, rr, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.10)";
          ctx.lineWidth = 0.35;
          ctx.beginPath(); ctx.arc(cx + ox, cy + oy, rr + 0.25, 0, Math.PI * 2); ctx.stroke();
        });
      });
      planetPositions.mercury = { x: posMercury.x, y: posMercury.y, label: "Merkurius (Load Speed)", val: `${(cpuSpeedFactor * 1.5).toFixed(1)} rps` };

      // Venus - bright copper-yellow planet wrapped in swirling clouds
      const posVenus = getKeplerianPos(rVenus, eVenus, wVenus, venusM);
      drawPlanetAt("Venus", posVenus.x, posVenus.y, 4.8, colorsVenus, (vx, vy) => {
        ctx.strokeStyle = "rgba(255,250,220,0.20)";
        ctx.lineWidth = 0.55;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(vx, vy - 1.8 + i * 1.8, 3.6 - i * 0.5, 0.65, -0.22, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      planetPositions.venus = { x: posVenus.x, y: posVenus.y, label: "Venus (Beban Inti)", val: `${(cpu * 1.1).toFixed(0)} MHz` };

      // 5. DRAW BUMI (Earth with orbiting Moon is mapped directly to live RAM Memory Usage!)
      const posEarth = getKeplerianPos(rEarth, eEarth, wEarth, earthM);
      drawPlanetAt("Earth", posEarth.x, posEarth.y, 6.5, colorsEarth, (ex, ey) => {
        // Oceans/continents clipped to the globe
        ctx.save();
        ctx.beginPath();
        ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
        ctx.clip();

        const land: [number, number, number][] = [
          [-2.0, 0.7, 2.0], [1.6, -1.2, 1.5], [2.3, 1.7, 1.1], [-0.7, -2.5, 0.95], [0.9, 2.9, 0.75]
        ];
        ctx.fillStyle = earthContinentsColor;
        land.forEach(([ox, oy, rr]) => {
          ctx.beginPath(); ctx.arc(ex + ox, ey + oy, rr, 0, Math.PI * 2); ctx.fill();
        });

        // Cloud swirls
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(ex - 2.6 + i * 2.8, ey - 1.8 + i * 1.7, 2.1, 0.65, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Polar ice caps
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath(); ctx.ellipse(ex, ey - 6.0, 2.4, 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(ex, ey + 6.0, 2.1, 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Blue atmospheric limb
        ctx.strokeStyle = ram > 80 ? "rgba(255,120,140,0.55)" : "rgba(90,190,255,0.55)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(ex, ey, 6.9, 0, Math.PI * 2);
        ctx.stroke();

        // Faint lunar orbit track
        const moonRadiusX = 12.5;
        const moonRadiusY = 5.4;
        ctx.strokeStyle = "rgba(200,220,255,0.12)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(ex, ey, moonRadiusX, moonRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Moon representing RAM pressure, lit from the same Sun direction
        const mx = ex + Math.cos(moonAngle) * moonRadiusX;
        const my = ey + Math.sin(moonAngle) * moonRadiusY;
        const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 4.2);
        moonGlow.addColorStop(0, "rgba(255,255,255,0.28)");
        moonGlow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath(); ctx.arc(mx, my, 4.2, 0, Math.PI * 2); ctx.fill();

        const moonBody = ctx.createRadialGradient(mx - 0.6, my - 0.6, 0.1, mx, my, 1.9);
        moonBody.addColorStop(0, "#ffffff");
        moonBody.addColorStop(0.55, moonColor);
        moonBody.addColorStop(1, "rgba(30,35,45,0.9)");
        ctx.fillStyle = moonBody;
        ctx.beginPath(); ctx.arc(mx, my, 1.9, 0, Math.PI * 2); ctx.fill();
      }, false);
      const usedGb = stats?.ram?.used ? `${stats.ram.used.toFixed(1)} GB` : `${((8 * ram)/100).toFixed(1)} GB`;
      const maxGb = stats?.ram?.total ? `${stats.ram.total.toFixed(0)} GB` : "8 GB";
      planetPositions.earth = { x: posEarth.x, y: posEarth.y, label: "Bumi (Memori RAM)", val: `${ram.toFixed(0)}% (${usedGb} / ${maxGb})` };

      // 6. DRAW MARS (Representative of Input/Output loads with polar ice caps!)
      const posMars = getKeplerianPos(rMars, eMars, wMars, marsM);
      drawPlanetAt("Mars", posMars.x, posMars.y, 4.2, colorsMars, (mx, my) => {
        // Dark basaltic regions
        ctx.fillStyle = "rgba(90,20,15,0.32)";
        ctx.beginPath(); ctx.ellipse(mx - 1.1, my + 0.7, 1.7, 0.85, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx + 1.4, my - 0.5, 1.1, 0.65, -0.3, 0, Math.PI * 2); ctx.fill();
        // Polar ice cap
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.beginPath(); ctx.ellipse(mx, my - 3.35, 1.3, 0.5, 0, 0, Math.PI * 2); ctx.fill();
      });
      planetPositions.mars = { x: posMars.x, y: posMars.y, label: "Mars (Spesifikasi CPU)", val: `${stats?.cpuCores || 4} Core CPU` };

      // 7. DRAW YUPITER (Jupiter represents hard disk storage usage!)
      const diskPr = stats?.disk?.usagePercent || 36;
      const posJupiter = getKeplerianPos(rJupiter, eJupiter, wJupiter, jupiterM);
      drawPlanetAt("Jupiter", posJupiter.x, posJupiter.y, 11, colorsJupiter, (jx, jy) => {
        // Jovian cloud bands rotated to the system horizon plane
        ctx.save();
        ctx.translate(jx, jy);
        ctx.rotate(LAN);

        const bands: { y: number; h: number; c: string }[] = [
          { y: -7.6, h: 1.7, c: "rgba(255,240,210,0.22)" },
          { y: -4.7, h: 2.2, c: "rgba(120,60,20,0.28)" },
          { y: -1.3, h: 2.4, c: "rgba(255,235,200,0.18)" },
          { y: 2.3, h: 2.0, c: "rgba(110,50,15,0.26)" },
          { y: 5.7, h: 1.5, c: "rgba(255,230,190,0.16)" }
        ];
        bands.forEach((b) => {
          ctx.fillStyle = b.c;
          ctx.fillRect(-11, b.y, 22, b.h);
        });

        // Great Red Spot with a soft gradient rim
        const spot = ctx.createRadialGradient(3, 4.2, 0, 3, 4.2, 2.7);
        spot.addColorStop(0, starSystemTheme === "neutron" ? "#38bdf8" : starSystemTheme === "nebula" ? "#f0abfc" : "#e0533d");
        spot.addColorStop(1, "rgba(120,30,10,0.12)");
        ctx.fillStyle = spot;
        ctx.beginPath(); ctx.ellipse(3, 4.2, 2.8, 1.7, 0, 0, Math.PI * 2); ctx.fill();

        // Small white storm ovals
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.beginPath(); ctx.ellipse(-4.2, -2.1, 1.1, 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5.6, -5.3, 0.9, 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      const diskUsed = stats?.disk?.used ? `${stats.disk.used.toFixed(0)} GB` : "45 GB";
      const diskTotal = stats?.disk?.total ? `${stats.disk.total.toFixed(0)} GB` : "120 GB";
      planetPositions.jupiter = { x: posJupiter.x, y: posJupiter.y, label: "Yupiter (Storage Disk)", val: `${diskPr}% (${diskUsed} / ${diskTotal})` };

      // 8. DRAW SATURNUS (Saturn representing Telemetry Remote node attachments)
      const activeDevices = stats?.remoteDevicesCount || 0;
      const posSaturn = getKeplerianPos(rSaturn, eSaturn, wSaturn, saturnM);
      drawPlanetAt("Saturn", posSaturn.x, posSaturn.y, 8.5, colorsSaturn, (sx, sy) => {
        // Saturn's own cloud bands
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 8.5, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = "rgba(120,70,20,0.28)";
        ctx.lineWidth = 1.1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(sx, sy + i * 2.3, 8.8, 1.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Multi-band rings with Cassini-style gaps
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(LAN + 18 * Math.PI / 180);
        ctx.scale(1.95, 0.42);
        const ringBands: { r: number; w: number; a: number }[] = [
          { r: 9.0, w: 1.5, a: 0.62 },
          { r: 10.1, w: 0.45, a: 0.28 },
          { r: 11.5, w: 0.9, a: 0.48 },
          { r: 12.7, w: 0.4, a: 0.22 },
          { r: 13.8, w: 0.8, a: 0.34 },
          { r: 15.2, w: 0.5, a: 0.16 }
        ];
        ringBands.forEach((rb) => {
          ctx.globalAlpha = rb.a;
          ctx.strokeStyle = rb.r > 13 ? saturnRingOuterColor : saturnRingColor;
          ctx.lineWidth = rb.w;
          ctx.beginPath();
          ctx.arc(0, 0, rb.r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        ctx.restore();

        // Saturn's moons with soft glow
        const activeMoons = Math.max(1, activeDevices);
        const moonTint = starSystemTheme === "neutron" ? "34,211,238" : starSystemTheme === "nebula" ? "244,114,182" : "56,189,248";
        for (let m = 0; m < activeMoons; m++) {
          const mAngle = (Date.now() * 0.0016) + (m * Math.PI * 2 / activeMoons);
          const mx = sx + Math.cos(mAngle) * 19.5;
          const my = sy + Math.sin(mAngle) * 7.5;

          const moonHalo = ctx.createRadialGradient(mx, my, 0, mx, my, 3.6);
          moonHalo.addColorStop(0, `rgba(${moonTint},0.5)`);
          moonHalo.addColorStop(1, `rgba(${moonTint},0)`);
          ctx.fillStyle = moonHalo;
          ctx.beginPath(); ctx.arc(mx, my, 3.6, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = `rgba(${moonTint},1)`;
          ctx.beginPath(); ctx.arc(mx, my, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }, false);
      planetPositions.saturn = { x: posSaturn.x, y: posSaturn.y, label: "Saturnus (Auxiliary Remote Nodes)", val: `${activeDevices} Node Aktif` };

      // Store positions in ref for mouse hovering labels readout
      planetPositionsRef.current = planetPositions;

      // Subtle vignette focuses attention on the system and softens the canvas edges
      const vignette = ctx.createRadialGradient(centerX, centerY, minDim * 0.34, centerX, centerY, minDim * 0.92);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 9. Draw Wave Ripples from Click triggers
      ripples = ripples.filter((rip) => {
        rip.radius += 3.2;
        rip.opacity -= 0.024;
        
        ctx.strokeStyle = `rgba(251, 146, 60, ${rip.opacity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        return rip.opacity > 0;
      });

      // 10. Check if mouse is hovering close to any planet representation to render a HUD pointer connection badge
      if (mouseRef.current.hover) {
        let hoverObject: any = null;
        let bestDist = 28;

        Object.keys(planetPositions).forEach((key) => {
          const item = planetPositions[key];
          const dx = mouseRef.current.x - item.x;
          const dy = mouseRef.current.y - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            hoverObject = item;
          }
        });

        if (hoverObject) {
          // Draw neat glowing cursor connection pointer line to hover position
          ctx.strokeStyle = "rgba(251, 146, 60, 0.4)";
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(mouseRef.current.x, mouseRef.current.y);
          ctx.lineTo(hoverObject.x, hoverObject.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Glowing pinpoint ring on the planet
          ctx.strokeStyle = "#fb923c";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(hoverObject.x, hoverObject.y, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Render Floating Text Box Detail
          const paddingX = 10;
          const paddingY = 6;
          const textLabel = hoverObject.label.toUpperCase();
          const textVal = hoverObject.val;

          ctx.font = "bold 9.5px 'Inter', sans-serif";
          const widthLabel = ctx.measureText(textLabel).width;
          ctx.font = "8.5px 'JetBrains Mono', monospace";
          const widthVal = ctx.measureText(textVal).width;

          const boxWidth = Math.max(widthLabel, widthVal) + paddingX * 2;
          const boxHeight = 32;

          let boxX = mouseRef.current.x + 12;
          let boxY = mouseRef.current.y - 12;
          // Boundary guard bounds
          if (boxX + boxWidth > width) boxX = mouseRef.current.x - boxWidth - 12;
          if (boxY + boxHeight > height) boxY = height - boxHeight - 8;
          if (boxY < 0) boxY = 8;

          ctx.fillStyle = "rgba(8, 8, 16, 0.95)";
          ctx.strokeStyle = "#fb923c";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5);
          ctx.fill();
          ctx.stroke();

          // Write typography details
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9.5px 'Inter', sans-serif";
          ctx.fillText(textLabel, boxX + paddingX, boxY + 13);

          ctx.fillStyle = "#fb923c";
          ctx.font = "8.5px 'JetBrains Mono', monospace";
          ctx.fillText(textVal, boxX + paddingX, boxY + 25);
        }
      }

      // 11. Draw corner technical celestial framing indicators
      const borderO = 10;
      ctx.strokeStyle = "rgba(251, 146, 60, 0.22)";
      ctx.beginPath();
      // TL Corner
      ctx.moveTo(borderO, borderO + 8); ctx.lineTo(borderO, borderO); ctx.lineTo(borderO + 8, borderO);
      // TR Corner
      ctx.moveTo(width - borderO, borderO + 8); ctx.lineTo(width - borderO, borderO); ctx.lineTo(width - borderO - 8, borderO);
      // BL Corner
      ctx.moveTo(borderO, height - borderO - 8); ctx.lineTo(borderO, height - borderO); ctx.lineTo(borderO + 8, height - borderO);
      // BR Corner
      ctx.moveTo(width - borderO, height - borderO - 8); ctx.lineTo(width - borderO, height - borderO); ctx.lineTo(width - borderO - 8, height - borderO);
      ctx.stroke();

      // Canvas Label Overlay (top-left title is rendered by the HTML overlay)
      ctx.fillStyle = "rgba(251, 146, 60, 0.6)";
      ctx.fillText(`SUMBU UTAMA: MATAHARI // HOST CPU`, 18, height - 15);
      ctx.fillText(`RESONANSI: CONNECTED`, width - 132, height - 15);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cpu, ram, stats, warpMultiplier, orbitLabelsVisible, starSystemTheme]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-[#05050a]/98 border border-orange-500/15 rounded-2xl overflow-hidden shadow-[inset_0_0_35px_rgba(251,146,60,0.04)] group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.015),transparent)] pointer-events-none"></div>
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-crosshair" />
      <div className="absolute top-4 left-4 right-4 pointer-events-none flex justify-between select-none">
        <span className="text-[9.5px] text-orange-400 font-display tracking-wider flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
          DIAGRAM KINETIK SISTEM BINTANG
        </span>
        <span className="text-[8.5px] text-neutral-500 font-mono">
          [METRIK: LIVE SYSTEM]
        </span>
      </div>
    </div>
  );
}

// Helper functions for IndexedDB persistence of custom background music
const DB_NAME = "vps_monitor_audio_db";
const STORE_NAME = "audio_store";
const AUDIO_KEY = "custom_bg_music";

const saveAudioToIDB = async (arrayBuffer: ArrayBuffer): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(arrayBuffer, AUDIO_KEY);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = (e) => {
          db.close();
          reject(e);
        };
      } catch (e) {
        db.close();
        reject(e);
      }
    };
    request.onerror = (e) => {
      reject(e);
    };
  });
};

const loadAudioFromIDB = async (): Promise<ArrayBuffer | null> => {
  return new Promise<ArrayBuffer | null>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          resolve(null);
          return;
        }
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(AUDIO_KEY);
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result || null);
        };
        getReq.onerror = (e) => {
          db.close();
          reject(e);
        };
      } catch (e) {
        db.close();
        reject(e);
      }
    };
    request.onerror = (e) => {
      reject(e);
    };
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "ptero" | "telegram" | "ports" | "terminal" | "backup" | "optimizer" | "bandwidth" | "logs" | "remote">("dashboard");
  const [showMenu, setShowMenu] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [bandwidthConfig, setBandwidthConfig] = useState({
    alertNetRxThreshold: 10,
    alertNetTxThreshold: 10
  });
  const [savingBandwidthConfig, setSavingBandwidthConfig] = useState(false);
  const [isSimulatingFlood, setIsSimulatingFlood] = useState(false);
  const [simulatedFloodType, setSimulatedFloodType] = useState<"rx" | "tx" | null>(null);
  const [simCountdown, setSimCountdown] = useState(0);

  // SSH VPS states
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState(22);
  const [sshUsername, setSshUsername] = useState("root");
  const [sshPassword, setSshPassword] = useState("");
  const [sshPrivateKey, setSshPrivateKey] = useState("");
  const [sshIsActive, setSshIsActive] = useState(false);
  const [sshTesting, setSshTesting] = useState(false);
  const [sshSaving, setSshSaving] = useState(false);
  const [sshShowPrivateKey, setSshShowPrivateKey] = useState(false);

  const formatBandwidthSpeed = (bytesPerSec: number | undefined) => {
    if (bytesPerSec === undefined || bytesPerSec === null || isNaN(bytesPerSec)) return "0.00 KB/s";
    if (bytesPerSec < 1024) {
      return `${bytesPerSec.toFixed(0)} B/s`;
    } else if (bytesPerSec < 1024 * 1024) {
      return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
    } else {
      return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
    }
  };

  interface BandwidthHistoryPoint {
    time: string;
    rx: number;
    tx: number;
  }

  interface PingHistoryPoint {
    time: string;
    ping: number;
  }

  const generateInitialBandwidthHistory = (): BandwidthHistoryPoint[] => {
    const points: BandwidthHistoryPoint[] = [];
    const now = new Date();
    // Generate 15 points representing the last few hours
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 20 * 60 * 1000);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      
      let rx = parseFloat((Math.random() * 1.5 + 0.2).toFixed(3));
      let tx = parseFloat((Math.random() * 1.0 + 0.1).toFixed(3));
      
      // Pre-baked spikes to make the graph interesting and show spikes clearly
      if (i === 11) {
        rx = 8.421;
        tx = 2.115;
      } else if (i === 6) {
        rx = 1.154;
        tx = 12.294;
      } else if (i === 2) {
        rx = 15.220;
        tx = 3.518;
      }
      
      points.push({ time: timeStr, rx, tx });
    }
    return points;
  };

  const generateInitialPingHistory = (): PingHistoryPoint[] => {
    const points: PingHistoryPoint[] = [];
    const now = new Date();
    // Generate 20 points
    for (let i = 19; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 15 * 60 * 1000);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      
      let ping = Math.floor(Math.random() * 6) + 11; // base 11 - 16 ms
      if (i === 15) ping = 42; // jitter spikes
      if (i === 10) ping = 64; 
      if (i === 4) ping = 55;
      
      points.push({ time: timeStr, ping });
    }
    return points;
  };

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<{ cpu: number[]; ram: number[] }>({ cpu: [], ram: [] });
  const [bandwidthHistory, setBandwidthHistory] = useState<BandwidthHistoryPoint[]>(() => generateInitialBandwidthHistory());
  const [pingHistory, setPingHistory] = useState<PingHistoryPoint[]>(() => generateInitialPingHistory());
  const [remoteDevices, setRemoteDevices] = useState<RemoteDevice[]>([]);
  const [customNodeName, setCustomNodeName] = useState("Node-Satellite-01");
  const [copied, setCopied] = useState(false);
  const [isLodingStats, setIsLoadingStats] = useState(false);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [startupMethod, setStartupMethod] = useState<"cron" | "systemd">("cron");
  const [warpMultiplier, setWarpMultiplier] = useState<number>(1.0);
  const [orbitLabelsVisible, setOrbitLabelsVisible] = useState<boolean>(true);
  const [starSystemTheme, setStarSystemTheme] = useState<"standard" | "neutron" | "nebula">("standard");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "bot",
      text: "✨ *Halo! Saya Bot VPS Monitor Anda.* 🤖\n\nSaya siap memantau performa VPS / Server Pterodactyl Anda secara realtime.\n\nGunakan tombol menu di bawah ini untuk berinteraksi langsung!",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [config, setConfig] = useState<TelegramConfig>({
    token: "",
    chatId: "",
    alertCpuThreshold: 80,
    alertRamThreshold: 90,
    alertDiskThreshold: 85,
    alertIntervalMinutes: 5,
    isActive: false,
    status: "Offline",
    smartCleanupEnabled: true,
    smartCleanupThreshold: 90,
    smartCleanupDurationHours: 1,
    domain: "",
    ptla: "",
    ptlc: "",
    scanInterval: 5,
    domain2: "",
    ptla2: "",
    ptlc2: "",
    scanInterval2: 5,
  });

  const [pterodactylServers, setPterodactylServers] = useState<PterodactylServer[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [pterodactylScanError, setPterodactylScanError] = useState<string | null>(null);
  const [isScanningPterodactyl, setIsScanningPterodactyl] = useState<boolean>(false);
  const [deletedPteroServerIds, setDeletedPteroServerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("deleted_ptero_server_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDeletePteroServer = (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menyembunyikan/menghapus panel '${id}' dari daftar monitoring?`)) {
      const updated = [...deletedPteroServerIds, id];
      setDeletedPteroServerIds(updated);
      localStorage.setItem("deleted_ptero_server_ids", JSON.stringify(updated));
    }
  };

  const handleResetDeletedPteroServers = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan semua panel Pterodactyl yang sebelumnya dihapus?")) {
      setDeletedPteroServerIds([]);
      localStorage.removeItem("deleted_ptero_server_ids");
    }
  };

  const [pteroSearchQuery, setPteroSearchQuery] = useState("");

  const [savingConfig, setSavingConfig] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Smart Cleanup States
  interface SmartCleanupStatus {
    success: boolean;
    enabled: boolean;
    threshold: number;
    durationHours: number;
    overloadStartTime: number | null;
    elapsedMs: number;
    isOverloaded: boolean;
    simulatedDiskOverload: boolean;
  }
  const [smartCleanupStatus, setSmartCleanupStatus] = useState<SmartCleanupStatus | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [smartCleanupLogs, setSmartCleanupLogs] = useState<string[]>([]);

  // Ports/Services checking state
  const [ports, setPorts] = useState([
    { id: "1", name: "Web Server (HTTP)", host: "localhost", port: 80, status: "idle", type: "http" },
    { id: "2", name: "Secure Web API (HTTPS)", host: "api.telegram.org", port: 443, status: "idle", type: "https" },
    { id: "3", name: "Database Service (MySQL)", host: "localhost", port: 3306, status: "idle", type: "db" },
    { id: "4", name: "SSH Control Panel", host: "localhost", port: 22, status: "idle", type: "ssh" }
  ]);
  const [checkingPorts, setCheckingPorts] = useState(false);
  const [newPortName, setNewPortName] = useState("");
  const [newPortHost, setNewPortHost] = useState("");
  const [newPortNum, setNewPortNum] = useState(80);
  const [newPortType, setNewPortType] = useState("http");

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState<string>("=== HUBUNG KONSOL VPS SUKSES ===\nDashboard monitoring siap menerima perintah pintas.\nPilih salah satu command di bawah untuk mendiagnosa performa real-time VPS Anda.");
  const [executingCmd, setExecutingCmd] = useState(false);
  const [customCmd, setCustomCmd] = useState("");

  // Backup state
  const [backups, setBackups] = useState([
    { id: "b1", name: "Backup Pterodactyl Game Server Data", target: "/var/lib/pterodactyl", schedule: "Harian (03:00)", size: "432 MB", status: "success", timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString() },
    { id: "b2", name: "MySQL Main Database Schema Logs", target: "/var/lib/mysql", schedule: "Mingguan (Minggu 01:00)", size: "1.2 GB", status: "success", timestamp: new Date(Date.now() - 3600000 * 24 * 7).toLocaleString() }
  ]);
  const [backupSchedule, setBackupSchedule] = useState("daily");
  const [backupTarget, setBackupTarget] = useState("/home/container/data");
  const [backupName, setBackupName] = useState("Auto-backup data folder vps");
  const [isSimulatingBackup, setIsSimulatingBackup] = useState(false);

  // NCDU Interactive State & Types
  interface NcduNode {
    name: string;
    sizeMB: number;
    type: "dir" | "file";
    children?: NcduNode[];
  }

  const [ncduPath, setNcduPath] = useState<string[]>(["var", "lib", "pterodactyl"]);
  const [ncduSearchQuery, setNcduSearchQuery] = useState("");
  const [ncduTree, setNcduTree] = useState<NcduNode>({
    name: "root",
    sizeMB: 35635,
    type: "dir",
    children: [
      {
        name: "var",
        sizeMB: 35431,
        type: "dir",
        children: [
          {
            name: "lib",
            sizeMB: 35111,
            type: "dir",
            children: [
              {
                name: "pterodactyl",
                sizeMB: 19354,
                type: "dir",
                children: [
                  {
                    name: "volumes",
                    sizeMB: 14541,
                    type: "dir",
                    children: [
                      {
                        name: "minecraft-survival (srv-8f8ef3)",
                        sizeMB: 8909,
                        type: "dir",
                        children: [
                          { name: "world", sizeMB: 5325, type: "dir" },
                          { name: "plugins", sizeMB: 840, type: "dir" },
                          { name: "latest_server.log", sizeMB: 1530, type: "file" },
                          { name: "libraries", sizeMB: 1214, type: "dir" }
                        ]
                      },
                      {
                        name: "gta5-fivem (srv-4f9f72)",
                        sizeMB: 4301,
                        type: "dir",
                        children: [
                          { name: "resources", sizeMB: 3101, type: "dir" },
                          { name: "server_cache_temp", sizeMB: 1200, type: "dir" }
                        ]
                      },
                      {
                        name: "bungeecord-proxy (srv-5d8882)",
                        sizeMB: 1331,
                        type: "dir"
                      }
                    ]
                  },
                  {
                    name: "backups",
                    sizeMB: 4198,
                    type: "dir",
                    children: [
                      { name: "backup_daily_srv-8f8ef3.tar.gz", sizeMB: 2100, type: "file" },
                      { name: "backup_old_unused_999.tar.gz", sizeMB: 1898, type: "file" },
                      { name: "config_backup.zip", sizeMB: 200, type: "file" }
                    ]
                  },
                  {
                    name: "cache",
                    sizeMB: 452,
                    type: "dir",
                    children: [
                      { name: "docker-overlay-temp.tmp", sizeMB: 350, type: "file" },
                      { name: "local-assets", sizeMB: 102, type: "dir" }
                    ]
                  },
                  {
                    name: "tmp",
                    sizeMB: 612,
                    type: "dir",
                    children: [
                      { name: "pterodactyl-installation.sh", sizeMB: 12, type: "file" },
                      { name: "temp-java-libs-build.tar", sizeMB: 600, type: "file" }
                    ]
                  },
                  { name: "daemon", sizeMB: 28, type: "dir" }
                ]
              },
              {
                name: "docker",
                sizeMB: 15757,
                type: "dir",
                children: [
                  {
                    name: "overlay2",
                    sizeMB: 14457,
                    type: "dir",
                    children: [
                      { name: "layer_minecraft__active_8b14a27b", sizeMB: 8700, type: "dir" },
                      { name: "layer_database__host_9c43d81fa", sizeMB: 4200, type: "dir" },
                      { name: "layer_proxy__cache_5d8882fa", sizeMB: 1557, type: "dir" }
                    ]
                  },
                  { name: "containers", sizeMB: 1200, type: "dir" },
                  { name: "volumes", sizeMB: 100, type: "dir" }
                ]
              }
            ]
          },
          {
            name: "log",
            sizeMB: 320,
            type: "dir",
            children: [
              { name: "nginx-access.log", sizeMB: 180, type: "file" },
              { name: "syslog", sizeMB: 110, type: "file" },
              { name: "daemon.log", sizeMB: 30, type: "file" }
            ]
          }
        ]
      }
    ]
  });

  const getCurrentNcduNode = () => {
    let current = ncduTree;
    for (const segment of ncduPath) {
      const found = current.children?.find(child => child.name === segment);
      if (found) {
        current = found;
      } else {
        break;
      }
    }
    return current;
  };

  const getSearchNcduResults = (query: string): { node: NcduNode; path: string[]; fullPath: string[] }[] => {
    if (!query.trim()) return [];
    const results: { node: NcduNode; path: string[]; fullPath: string[] }[] = [];
    const lowercaseQuery = query.toLowerCase();

    const traverse = (currentNode: NcduNode, currentPath: string[]) => {
      if (currentNode.children) {
        for (const child of currentNode.children) {
          const childPath = [...currentPath, child.name];
          if (child.name.toLowerCase().includes(lowercaseQuery)) {
            results.push({
              node: child,
              path: currentPath,
              fullPath: childPath
            });
          }
          if (child.type === "dir" && child.children) {
            traverse(child, childPath);
          }
        }
      }
    };

    traverse(ncduTree, []);
    return results;
  };

  const handleNcduDelete = (nodeName: string, customPath?: string[]) => {
    const activePath = customPath !== undefined ? customPath : ncduPath;
    const deleteAndRecalculate = (node: NcduNode, pathSegments: string[], targetName: string): { updatedNode: NcduNode; deletedSize: number } => {
      if (pathSegments.length === 0) {
        const itemToDelete = node.children?.find(c => c.name === targetName);
        if (!itemToDelete) return { updatedNode: node, deletedSize: 0 };
        
        const deletedSize = itemToDelete.sizeMB;
        const newChildren = node.children?.filter(c => c.name !== targetName) || [];
        
        const updated = {
          ...node,
          sizeMB: Math.max(0, node.sizeMB - deletedSize),
          children: newChildren
        };
        return { updatedNode: updated, deletedSize };
      }
      
      const currentSegment = pathSegments[0];
      const newChildren = node.children?.map(child => {
        if (child.name === currentSegment) {
          const res = deleteAndRecalculate(child, pathSegments.slice(1), targetName);
          return { res, child };
        }
        return { res: null, child };
      });
      
      let totalDeleted = 0;
      const finalChildren = newChildren?.map(item => {
        if (item.res) {
          totalDeleted += item.res.deletedSize;
          return item.res.updatedNode;
        }
        return item.child;
      }) || [];
      
      return {
        updatedNode: {
          ...node,
          sizeMB: Math.max(0, node.sizeMB - totalDeleted),
          children: finalChildren
        },
        deletedSize: totalDeleted
      };
    };
    
    const { updatedNode, deletedSize } = deleteAndRecalculate(ncduTree, activePath, nodeName);
    setNcduTree(updatedNode);
    
    if (stats) {
      const gbs = deletedSize / 1024;
      const newUsed = Math.max(0, stats.disk.used - gbs);
      const newPercent = Math.max(0, Math.min(100, Math.round((newUsed / stats.disk.total) * 100)));
      setStats({
        ...stats,
        disk: {
          ...stats.disk,
          used: Number(newUsed.toFixed(2)),
          free: Number((stats.disk.total - newUsed).toFixed(2)),
          usagePercent: newPercent
        }
      });
    }

    setAlertLogs(prev => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: "disk",
        level: "success",
        title: "🗑️ Pembersihan NCDU",
        message: `Berhasil menghapus '${nodeName}' senilai ${deletedSize >= 1024 ? (deletedSize/1024).toFixed(2) + ' GB' : deletedSize + ' MB'}.`
      },
      ...prev
    ]);
  };

  // Optimizer state
  const [autoCleanRam, setAutoCleanRam] = useState(true);
  const [autoCleanLogs, setAutoCleanLogs] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([
    "Sistem pemonitor performa RAM otomatis bermuatan aktif.",
    "Batas threshold RAM diatur pada 80% total kapasitas lokal.",
    "Daemon optimisasi siap siaga."
  ]);

  // --- AUDIO ALARM & DYNAMIC BACKGROUND MUSIC CONTROLLER ---
  const [voiceAlarmEnabled, setVoiceAlarmEnabled] = useState<boolean>(false);
  const [ramAudioThreshold, setRamAudioThreshold] = useState<number>(80);
  const [diskAudioThreshold, setDiskAudioThreshold] = useState<number>(85);
  const [alarmSoundType, setAlarmSoundType] = useState<string>("custom-alarm-mp3");
  const [alarmCooldownSeconds, setAlarmCooldownSeconds] = useState<number>(30);

  const [bgMusicEnabled, setBgMusicEnabled] = useState<boolean>(() => {
    return localStorage.getItem("vps_bg_music_enabled") !== "false";
  });
  const [bgMusicTrack, setBgMusicTrack] = useState<string>("custom-mp3");
  const [customAudioName, setCustomAudioName] = useState<string>(() => {
    return localStorage.getItem("vps_custom_audio_name") || "";
  });
  const [customAlarmAudioName, setCustomAlarmAudioName] = useState<string>("");
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(() => {
    return Number(localStorage.getItem("vps_bg_music_volume") || "50");
  });
  const [alarmAudioVolume, setAlarmAudioVolume] = useState<number>(0);

  const bgMusicGainNodeRef = React.useRef<GainNode | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const customAudioBufferRef = React.useRef<AudioBuffer | null>(null);
  const customSourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playSynthAlarm = (type: string) => {};
  const speakVoiceAlarm = (message: string, isIndonesian: boolean) => {};
  const playTestAlarm = () => {};

  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomAudioName(file.name);
    localStorage.setItem("vps_custom_audio_name", file.name);
    
    stopBackgroundMusic();
    const ctx = ensureAudioContext();
    if (!ctx) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Save original arrayBuffer to IndexedDB for persistence
      await saveAudioToIDB(arrayBuffer.slice(0));
      
      ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
        customAudioBufferRef.current = decodedBuffer;
        setBgMusicTrack("custom-mp3");
        setBgMusicEnabled(true);
        setTimeout(() => {
          startBackgroundMusic();
        }, 150);
      }, (err) => {
        console.error("Gagal mendecode file audio:", err);
        alert("Gagal mendecode file audio MP3 Anda. Format tidak didukung atau file rusak.");
      });
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Gagal membaca file audio Anda.");
    }
  };

  const handleCustomAlarmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {};

  const handleBgMusicVolumeChange = (newVol: number) => {
    setBgMusicVolume(newVol);
    localStorage.setItem("vps_bg_music_volume", String(newVol));
    if (bgMusicGainNodeRef.current && audioContextRef.current) {
      const baseVol = 0.15;
      const computedVol = baseVol * (newVol / 100);
      try {
        bgMusicGainNodeRef.current.gain.setValueAtTime(computedVol, audioContextRef.current.currentTime);
      } catch (e) {
        bgMusicGainNodeRef.current.gain.value = computedVol;
      }
    }
  };

  const startBackgroundMusic = () => {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      
      // Stop previous instance before starting new one to prevent duplication / overlapping
      stopBackgroundMusic();
      
      if (!customAudioBufferRef.current) {
        return;
      }

      const musicVolume = ctx.createGain();
      const baseVol = 0.15;
      const computedVol = baseVol * (bgMusicVolume / 100);
      musicVolume.gain.setValueAtTime(computedVol, ctx.currentTime);
      musicVolume.connect(ctx.destination);
      bgMusicGainNodeRef.current = musicVolume;

      const source = ctx.createBufferSource();
      source.buffer = customAudioBufferRef.current;
      source.loop = true;
      source.connect(musicVolume);
      source.start(0);
      customSourceNodeRef.current = source;
    } catch (e) {
      console.error("Failed to start bg music:", e);
    }
  };

  const stopBackgroundMusic = () => {
    if (customSourceNodeRef.current) {
      try {
        customSourceNodeRef.current.stop();
      } catch (e) {}
      customSourceNodeRef.current = null;
    }
    if (bgMusicGainNodeRef.current && audioContextRef.current) {
      try {
        const currentG = bgMusicGainNodeRef.current.gain;
        currentG.setValueAtTime(currentG.value, audioContextRef.current.currentTime);
        currentG.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.4);
      } catch (e) {}
    }
  };

  const checkAudioAlarms = (ramPercent: number, diskPercent: number) => {
    // Disabled at user's request
  };

  // Persistently load BGM from IndexedDB on startup
  useEffect(() => {
    const initAndLoadPersistedBgm = async () => {
      try {
        const arrayBuffer = await loadAudioFromIDB();
        if (arrayBuffer) {
          const ctx = ensureAudioContext();
          if (ctx) {
            ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
              customAudioBufferRef.current = decodedBuffer;
              if (bgMusicEnabled) {
                startBackgroundMusic();
              }
            }, (err) => {
              console.error("Gagal mendecode persisted BGM dari IDB:", err);
            });
          }
        }
      } catch (e) {
        console.error("Failed to load persisted audio on mount:", e);
      }
    };
    initAndLoadPersistedBgm();
  }, []);

  useEffect(() => {
    localStorage.setItem("vps_voice_alarm_enabled", String(voiceAlarmEnabled));
    localStorage.setItem("vps_ram_audio_threshold", String(ramAudioThreshold));
    localStorage.setItem("vps_disk_audio_threshold", String(diskAudioThreshold));
    localStorage.setItem("vps_alarm_sound_type", alarmSoundType);
    localStorage.setItem("vps_alarm_cooldown_seconds", String(alarmCooldownSeconds));
  }, [voiceAlarmEnabled, ramAudioThreshold, diskAudioThreshold, alarmSoundType, alarmCooldownSeconds]);

  useEffect(() => {
    localStorage.setItem("vps_bg_music_enabled", String(bgMusicEnabled));
    localStorage.setItem("vps_bg_music_track", "custom-mp3");
    if (bgMusicEnabled) {
      if (customAudioBufferRef.current) {
        startBackgroundMusic();
      }
    } else {
      stopBackgroundMusic();
    }
    return () => {
      stopBackgroundMusic();
    };
  }, [bgMusicEnabled]);

  // Handle browser audio context suspended state via click and key triggers
  useEffect(() => {
    const handleAutoplayUnlock = () => {
      if (bgMusicEnabled) {
        const ctx = ensureAudioContext();
        if (ctx) {
          if (ctx.state === "suspended") {
            ctx.resume().then(() => {
              if (customAudioBufferRef.current && !customSourceNodeRef.current) {
                startBackgroundMusic();
              }
            }).catch(err => console.warn("Failed to resume audio on event:", err));
          } else {
            if (customAudioBufferRef.current && !customSourceNodeRef.current) {
              startBackgroundMusic();
            }
          }
        }
      }
    };
    window.addEventListener("click", handleAutoplayUnlock);
    window.addEventListener("keydown", handleAutoplayUnlock);
    return () => {
      window.removeEventListener("click", handleAutoplayUnlock);
      window.removeEventListener("keydown", handleAutoplayUnlock);
    };
  }, [bgMusicEnabled]);

  // Security Lock & PIN State
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("vps_monitor_admin_password") || "vps2026");
  const [adminSessionActive, setAdminSessionActive] = useState(() => sessionStorage.getItem("vps_monitor_admin_session") === "active");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // Forgot Password Recovery States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "verify">("request");
  const [forgotCodeInput, setForgotCodeInput] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotNewPasswordConfirm, setForgotNewPasswordConfirm] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [sendingResetRequest, setSendingResetRequest] = useState(false);
  const [verifyingResetRequest, setVerifyingResetRequest] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  const handleVerifyPIN = async (pinToCheck: string) => {
    setVerifyingPin(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pinToCheck }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSessionActive(true);
        sessionStorage.setItem("vps_monitor_admin_session", "active");
        setPinInput("");
        setPinError("");
        localStorage.setItem("vps_monitor_admin_password", pinToCheck);
        setAdminPassword(pinToCheck);
      } else {
        setPinError(data.error || "Kombinasi kata sandi salah. Silahkan coba lagi!");
      }
    } catch (err) {
      // Local fallback in case of server offline
      if (pinToCheck === adminPassword) {
        setAdminSessionActive(true);
        sessionStorage.setItem("vps_monitor_admin_session", "active");
        setPinInput("");
        setPinError("");
      } else {
        setPinError("Kombinasi kata sandi salah atau server sedang offline.");
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleRequestForgotPasswordCode = async () => {
    setSendingResetRequest(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await fetch("/api/forgot-password-request", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotPasswordStep("verify");
        setForgotSuccess("Kode verifikasi berhasil dikirim ke bot Telegram Anda!");
      } else {
        setForgotError(data.error || "Gagal mengirim kode reset.");
      }
    } catch (err) {
      setForgotError("Gagal menghubungi server. Pastikan server aktif.");
    } finally {
      setSendingResetRequest(false);
    }
  };

  const handleVerifyForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCodeInput) {
      setForgotError("Kode verifikasi wajib diisi!");
      return;
    }
    if (!forgotNewPassword) {
      setForgotError("Kata sandi baru tidak boleh kosong!");
      return;
    }
    if (forgotNewPassword !== forgotNewPasswordConfirm) {
      setForgotError("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setVerifyingResetRequest(true);
    setForgotError("");
    try {
      const res = await fetch("/api/forgot-password-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: forgotCodeInput,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminPassword(forgotNewPassword);
        localStorage.setItem("vps_monitor_admin_password", forgotNewPassword);
        
        // Log in immediately
        setAdminSessionActive(true);
        sessionStorage.setItem("vps_monitor_admin_session", "active");
        
        // Reset states
        setPinInput("");
        setPinError("");
        setShowForgotPassword(false);
        setForgotPasswordStep("request");
        setForgotCodeInput("");
        setForgotNewPassword("");
        setForgotNewPasswordConfirm("");
        setStatusMsg({ type: "success", text: "Kata sandi admin berhasil disetel ulang!" });
      } else {
        setForgotError(data.error || "Gagal menyetel ulang kata sandi.");
      }
    } catch (err) {
      setForgotError("Gagal menghubungi server.");
    } finally {
      setVerifyingResetRequest(false);
    }
  };

  const handleLogoutAdmin = () => {
    setAdminSessionActive(false);
    sessionStorage.removeItem("vps_monitor_admin_session");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) {
      setPinError("Kata sandi baru tidak boleh kosong!");
      return;
    }
    if (newPasswordInput !== newPasswordConfirm) {
      setPinError("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }
    
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminPassword(newPasswordInput);
        localStorage.setItem("vps_monitor_admin_password", newPasswordInput);
        setPinError("");
        setNewPasswordInput("");
        setNewPasswordConfirm("");
        setShowPasswordChange(false);
        setStatusMsg({ type: "success", text: "Kata sandi admin sukses diperbarui!" });
      } else {
        setPinError(data.error || "Gagal memperbarui kata sandi di server.");
      }
    } catch (err) {
      // Local fallback
      setAdminPassword(newPasswordInput);
      localStorage.setItem("vps_monitor_admin_password", newPasswordInput);
      setPinError("");
      setNewPasswordInput("");
      setNewPasswordConfirm("");
      setShowPasswordChange(false);
      setStatusMsg({ type: "success", text: "Kata sandi admin sukses diperbarui di browser (lokal)!" });
    }
  };

  const handleRestartBot = async () => {
    setIsRestarting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/restart-bot", {
        method: "POST",
      });
      const data = await res.json();
      setIsRestarting(false);
      if (data.success) {
        setStatusMsg({ type: "success", text: "Proses polling bot Telegram berhasil dinyalakan ulang!" });
        fetchConfig();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyalakan ulang bot." });
      }
    } catch (err) {
      setIsRestarting(false);
      setStatusMsg({ type: "error", text: "Error jaringan sewaktu memuat ulang bot." });
    }
  };

  const handleCheckPorts = async () => {
    setCheckingPorts(true);
    setPorts(prev => prev.map(p => ({ ...p, status: "loading" })));
    try {
      const res = await fetch("/api/check-ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ports: ports.map(p => ({ id: p.id, host: p.host, port: p.port })) })
      });
      const data = await res.json();
      if (data.success && data.results) {
        setPorts(prev => prev.map(p => {
          const match = data.results.find((r: any) => r.id === p.id);
          return match ? { ...p, status: match.status } : p;
        }));
      } else {
        setPorts(prev => prev.map(p => ({ ...p, status: p.host === "localhost" ? "offline" : "online" })));
      }
    } catch (e) {
      setPorts(prev => prev.map(p => ({ ...p, status: "offline" })));
    } finally {
      setCheckingPorts(false);
    }
  };

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortName || !newPortHost || !newPortNum) return;
    const item = {
      id: Math.random().toString(),
      name: newPortName,
      host: newPortHost,
      port: Number(newPortNum),
      status: "idle" as const,
      type: newPortType
    };
    setPorts(prev => [...prev, item]);
    setNewPortName("");
    setNewPortHost("");
    setNewPortNum(80);
  };

  const handleDeletePort = (id: string) => {
    setPorts(prev => prev.filter(p => p.id !== id));
  };

  const handleRunCommand = async (cmdId: string) => {
    setExecutingCmd(true);
    setTerminalOutput(prev => prev + `\n\n$ executing: ${cmdId}...`);
    try {
      const res = await fetch("/api/run-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmdId })
      });
      const data = await res.json();
      if (data.success) {
        setTerminalOutput(prev => prev + `\n\n=== TERM OUTPUT (${cmdId}) ===\n` + data.output);
      } else {
        setTerminalOutput(prev => prev + `\n\nError: ` + data.error);
      }
    } catch (e) {
      setTerminalOutput(prev => prev + `\n\nFail: Error jaringan menghubungi konsol.`);
    } finally {
      setExecutingCmd(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsSimulatingBackup(true);
    try {
      const res = await fetch("/api/trigger-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: backupName, target: backupTarget })
      });
      const data = await res.json();
      if (data.success && data.backup) {
        setBackups(prev => [data.backup, ...prev]);
        fetchAlertLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingBackup(false);
    }
  };

  const handleOptimizeRam = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/optimize-ram", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOptimizationLogs(prev => [
          ...data.logs,
          `[${new Date().toLocaleTimeString()}] Pembebasan RAM sukses. Menghemat estimasi ${(data.recoveredBytes / 1024 / 1024).toFixed(1)} MB!`,
          ...prev
        ]);
        if (stats) {
          setStats({
            ...stats,
            ram: {
              ...stats.ram,
              used: Math.max(0.2, stats.ram.used - (data.recoveredBytes / 1024 / 1024 / 1024)),
              percent: Math.max(8, Math.round(stats.ram.percent - 12))
            }
          });
        }
        fetchAlertLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Self App URL from user environment if needed, fallbacks to window.location.origin
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchStats();
    fetchConfig();
    fetchRemoteDevices();
    fetchPterodactylServers();
    fetchAlertLogs();
    fetchBandwidthConfig();
    fetchSshConfig();
    fetchSmartCleanupStatus();

    // Intervals
    const statsInterval = setInterval(fetchStats, 3000);
    const remoteInterval = setInterval(fetchRemoteDevices, 4000);
    const pteroInterval = setInterval(fetchPterodactylServers, 5000);
    const logsInterval = setInterval(fetchAlertLogs, 4000);
    const smartCleanupInterval = setInterval(fetchSmartCleanupStatus, 3000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(remoteInterval);
      clearInterval(pteroInterval);
      clearInterval(logsInterval);
      clearInterval(smartCleanupInterval);
    };
  }, []);

  // Handle countdown during bandwidth flood test simulation
  useEffect(() => {
    if (simCountdown > 0) {
      const timer = setTimeout(() => {
        setSimCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (simCountdown === 0 && isSimulatingFlood) {
      setIsSimulatingFlood(false);
      setSimulatedFloodType(null);
    }
  }, [simCountdown, isSimulatingFlood]);

  // Accumulate local performance stats history for the grid sparkline
  useEffect(() => {
    if (stats) {
      setHistory(prev => {
        const nextCpu = [...prev.cpu, stats.cpu].slice(-30);
        const nextRam = [...prev.ram, stats.ram.percent].slice(-30);
        return { cpu: nextCpu, ram: nextRam };
      });
      setBandwidthHistory(prev => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        const timeStr = `${hours}:${minutes}:${seconds}`;
        
        const rxVal = stats.network ? parseFloat((stats.network.rxSpeed / 1024 / 1024).toFixed(3)) : 0;
        const txVal = stats.network ? parseFloat((stats.network.txSpeed / 1024 / 1024).toFixed(3)) : 0;
        
        const nextHistory = [...prev, { time: timeStr, rx: rxVal, tx: txVal }];
        return nextHistory.slice(-35); // Keep the last 35 data points
      });
      setPingHistory(prev => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        const timeStr = `${hours}:${minutes}:${seconds}`;
        
        let pingVal = Math.floor(Math.random() * 5) + 11; // base 11-15 ms
        if (stats.cpu > 75) {
          pingVal += Math.floor(Math.random() * 25) + 12; // Extra CPU processing delay
        } else if (Math.random() < 0.10) {
          pingVal += Math.floor(Math.random() * 32) + 15; // Network jitter
        }
        
        const nextHistory = [...prev, { time: timeStr, ping: pingVal }];
        return nextHistory.slice(-35); // Keep last 35 data points
      });
      // Trigger voice / synth alarm checks automatically
      checkAudioAlarms(stats.ram.percent, stats.disk.usagePercent);
    }
  }, [stats, voiceAlarmEnabled, ramAudioThreshold, diskAudioThreshold, alarmSoundType, alarmCooldownSeconds]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/system-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching local stats:", err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/telegram-config");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error("Error fetching bot config:", err);
    }
  };

  const fetchRemoteDevices = async () => {
    try {
      const res = await fetch("/api/remote-devices");
      const data = await res.json();
      if (data.success) {
        setRemoteDevices(data.data);
      }
    } catch (err) {
      console.error("Error fetching remote devices:", err);
    }
  };

  const fetchPterodactylServers = async () => {
    try {
      const res = await fetch("/api/pterodactyl-servers");
      const data = await res.json();
      if (data.success) {
        setPterodactylServers(data.data);
        setPterodactylScanError(data.error || null);
        setIsScanningPterodactyl(data.isScanning || false);
      }
    } catch (err) {
      console.error("Error fetching Pterodactyl servers:", err);
    }
  };

  const triggerPterodactylRescan = async () => {
    setIsScanningPterodactyl(true);
    try {
      const res = await fetch("/api/pterodactyl-scan/force", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPterodactylServers(data.data);
        setPterodactylScanError(data.error || null);
      }
    } catch (err) {
      console.error("Error running manual Pterodactyl scan:", err);
    } finally {
      setIsScanningPterodactyl(false);
    }
  };

  const runVirtualSmartCleanup = () => {
    const resetDirContent = (node: NcduNode, pathSegments: string[], targetName: string): { updatedNode: NcduNode; recoveredMB: number } => {
      if (pathSegments.length === 0) {
        const folder = node.children?.find(c => c.name === targetName);
        if (!folder) return { updatedNode: node, recoveredMB: 0 };
        
        const recoveredMB = folder.sizeMB;
        const updatedFolder = {
          ...folder,
          sizeMB: 0,
          children: []
        };
        const newChildren = node.children?.map(c => c.name === targetName ? updatedFolder : c) || [];
        
        return {
          updatedNode: {
            ...node,
            sizeMB: Math.max(0, node.sizeMB - recoveredMB),
            children: newChildren
          },
          recoveredMB
        };
      }
      
      const currentSegment = pathSegments[0];
      let totalRecovered = 0;
      const finalChildren = node.children?.map(child => {
        if (child.name === currentSegment) {
          const res = resetDirContent(child, pathSegments.slice(1), targetName);
          totalRecovered = res.recoveredMB;
          return res.updatedNode;
        }
        return child;
      }) || [];
      
      return {
        updatedNode: {
          ...node,
          sizeMB: Math.max(0, node.sizeMB - totalRecovered),
          children: finalChildren
        },
        recoveredMB: totalRecovered
      };
    };

    let tree = ncduTree;
    let totalMB = 0;
    
    // Clean cache
    const resCache = resetDirContent(tree, ["var", "lib", "pterodactyl"], "cache");
    tree = resCache.updatedNode;
    totalMB += resCache.recoveredMB;
    
    // Clean tmp (if exists)
    const resTmp = resetDirContent(tree, ["var", "lib", "pterodactyl"], "tmp");
    tree = resTmp.updatedNode;
    totalMB += resTmp.recoveredMB;
    
    setNcduTree(tree);

    // Update state stats disk values
    if (stats) {
      const gbs = totalMB / 1024;
      const newUsed = Math.max(0, stats.disk.used - gbs);
      const newPercent = Math.max(0, Math.min(100, Math.round((newUsed / stats.disk.total) * 100)));
      setStats({
        ...stats,
        disk: {
          ...stats.disk,
          used: parseFloat(newUsed.toFixed(1)),
          free: parseFloat(Math.max(0, stats.disk.total - newUsed).toFixed(1)),
          usagePercent: newPercent
        }
      });
    }
  };

  const fetchSmartCleanupStatus = async () => {
    try {
      const res = await fetch("/api/smart-cleanup/status");
      const data = await res.json();
      if (data.success) {
        setSmartCleanupStatus(data);
        
        // If the backend says simulation is off but our frontend is showing virtual overload values,
        // or just whenever a cleanup happens, we can verify if virtual folders are already cleared.
        // If server was overloaded and is now cleared, execute virtual cleanup.
        if (!data.simulatedDiskOverload && stats && stats.disk.usagePercent < 50) {
          // Double check if virtual files exist and wipe them
          const cacheNode = ncduTree.children?.[0]?.children?.[0]?.children?.[0]?.children?.find(c => c.name === "cache");
          if (cacheNode && cacheNode.sizeMB > 0) {
            runVirtualSmartCleanup();
          }
        }
      }
    } catch (e) {
      console.error("Error fetching smart cleanup status", e);
    }
  };

  const handleForceSmartCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const res = await fetch("/api/smart-cleanup/force", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSmartCleanupLogs(data.logs || []);
        runVirtualSmartCleanup();
        fetchSmartCleanupStatus();
        fetchAlertLogs();
        fetchStats();
      }
    } catch (e) {
      console.error("Error running smart cleanup", e);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const toggleSimulateDiskOverload = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/sim-disk-overload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        fetchSmartCleanupStatus();
        fetchAlertLogs();
        fetchStats();
      }
    } catch (e) {
      console.error("Error toggling disk simulation", e);
    }
  };

  const fetchAlertLogs = async () => {
    try {
      const res = await fetch("/api/alert-logs");
      const data = await res.json();
      if (data.success) {
        setAlertLogs(data.data);
      }
    } catch (err) {
      console.error("Error fetching alert logs:", err);
    }
  };

  const clearAlertLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus seluruh log riwayat peringatan?")) {
      return;
    }
    try {
      const res = await fetch("/api/clear-logs", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setAlertLogs([]);
        setStatusMsg({ type: "success", text: "Seluruh logs berhasil dibersihkan!" });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menghapus log." });
      }
    } catch (err) {
      console.error("Error clearing logs:", err);
      setStatusMsg({ type: "error", text: "Gagal menghubungkan ke server untuk membersihkan log." });
    }
  };

  const fetchBandwidthConfig = async () => {
    try {
      const res = await fetch("/api/bandwidth-config");
      const json = await res.json();
      if (json.success && json.data) {
        setBandwidthConfig(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil konfigurasi bandwidth:", err);
    }
  };

  const fetchSshConfig = async () => {
    try {
      const res = await fetch("/api/ssh-config");
      const json = await res.json();
      if (json.success && json.data) {
        setSshHost(json.data.host || "");
        setSshPort(json.data.port || 22);
        setSshUsername(json.data.username || "root");
        setSshIsActive(json.data.isActive || false);
        if (json.data.hasPassword) {
          setSshPassword("********");
        }
        if (json.data.hasPrivateKey) {
          setSshPrivateKey("********");
        }
      }
    } catch (err) {
      console.error("Gagal mengambil konfigurasi SSH:", err);
    }
  };

  const handleSaveSshConfig = async (activateOverride = undefined) => {
    setSshSaving(true);
    try {
      const activeState = activateOverride !== undefined ? activateOverride : sshIsActive;
      const res = await fetch("/api/ssh-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: sshHost,
          port: sshPort,
          username: sshUsername,
          password: sshPassword,
          privateKey: sshPrivateKey,
          isActive: activeState
        })
      });
      const json = await res.json();
      if (json.success) {
        setSshIsActive(json.data.isActive);
        alert(activateOverride ? "VPS Login berhasil terkoneksi & diaktifkan!" : "Konfigurasi SSH VPS berhasil disimpan!");
      } else {
        alert("Gagal menyimpan konfigurasi SSH: " + json.error);
      }
    } catch (err: any) {
      alert("Error saving SSH: " + err.message);
    } finally {
      setSshSaving(false);
    }
  };

  const handleTestSshConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSshTesting(true);
    setTerminalOutput(prev => prev + `\n\n$ Menghubungkan SSH ke VPS: ${sshHost}:${sshPort}...`);
    try {
      const res = await fetch("/api/ssh-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: sshHost,
          port: sshPort,
          username: sshUsername,
          password: sshPassword,
          privateKey: sshPrivateKey
        })
      });
      const json = await res.json();
      if (json.success) {
        setSshIsActive(true);
        setTerminalOutput(prev => prev + `\n\n=== Status Koneksi SSH VPS (Sukses) ===\nKoneksi Berhasil!\nPlatform: ${json.output.trim()}`);
        alert("Sukses! Koneksi SSH VPS Berhasil Tersambung.\nMode SSH otomatis AKTIF sekarang.");
      } else {
        setTerminalOutput(prev => prev + `\n\nError SSH: ` + json.error);
        alert(json.error);
      }
    } catch (err: any) {
      setTerminalOutput(prev => prev + `\n\nFail: Koneksi SSH Timeout atau gagal terhubung.`);
      alert("Error: Gagal menghubungi server atau timeout.");
    } finally {
      setSshTesting(false);
    }
  };

  const handleSaveBandwidthConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBandwidthConfig(true);
    try {
      const res = await fetch("/api/bandwidth-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bandwidthConfig)
      });
      const json = await res.json();
      if (json.success) {
        alert("Konfigurasi limit alarm bandwidth berhasil disimpan!");
      } else {
        alert("Gagal menyimpan konfigurasi: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingBandwidthConfig(false);
    }
  };

  const startPacketFloodSimulation = async (type: "rx" | "tx", speedMb: number, durationSec: number) => {
    if (isSimulatingFlood) {
      alert("Simulasi banjir paket sedang berlangsung!");
      return;
    }
    
    setIsSimulatingFlood(true);
    setSimulatedFloodType(type);
    setSimCountdown(durationSec);

    try {
      const res = await fetch("/api/bandwidth-test-flood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, speedMb, durationSec })
      });
      const json = await res.json();
      if (!json.success) {
        alert("Gagal menjalankan simulasi: " + json.error);
        setIsSimulatingFlood(false);
        setSimulatedFloodType(null);
        setSimCountdown(0);
      }
    } catch (err: any) {
      alert("Gagal menghubungi server untuk simulasi: " + err.message);
      setIsSimulatingFlood(false);
      setSimulatedFloodType(null);
      setSimCountdown(0);
    }
  };

  const handleSendSimulatedChat = (text: string) => {
    if (!text.trim()) return;

    const userTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const userMsg = { sender: "user", text, time: userTime };
    
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const trimmed = text.trim().toLowerCase();
      let botResponse = "";

      const getBar = (pct: number) => {
        const totalBlocks = 10;
        const filled = Math.round((pct / 100) * totalBlocks);
        const blank = totalBlocks - filled;
        return "■".repeat(filled) + "□".repeat(blank) + ` [${pct}%]`;
      };

      // Base commands
      if (trimmed === "/start") {
        botResponse = `✨ *Halo! Saya Bot VPS Monitor Anda.* 🤖\n\nSaya siap memantau performa VPS & trafik bandwidth keluar masuk Anda secara realtime.\n\n*Daftar Perintah:*\n📊 /status - Cek status performa\n🖥️ /cpu - Detail processor\n📟 /ram - Detail RAM\n💾 /disk - Kapasitas storage\n⚡ /bandwidth - Trafik bandwidth & limit\n⏱️ /ping - Latency bot\nℹ️ /help - Bantuan`;
      } else if (trimmed === "/help") {
        botResponse = `*Panduan Perintah VPS Monitor Bot:*\n\n/status - Menampilkan visual bar CPU, RAM, dan Disk\n/cpu - Info clock, core detail, dan load\n/ram - Info total, gratis, dan terpakai\n/disk - Info Ruang penyimpanan disk\n/bandwidth - Info kecepatan RX/TX serta pencegahan overload paket\n/ping - Respons latensi bot`;
      } else if (trimmed === "/ping") {
        botResponse = `🏓 *PONG! BOT AKTIF & RESPONSIF*\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Latency:* \`12 ms\`\n🚀 *Status Server:* \`ONLINE\`\n\n💻 *INFORMASI SPESIFIKASI VPS (LENGKAP)*\n• *Platform OS:* \`${stats?.platform || "linux"} (${stats?.arch || "x64"})\`\n• *Model CPU:* \`${stats?.cpuModel || "Intel Xeon vCPU"}\`\n• *CPU Thread / Core:* \`${stats?.cpuCores || "4"} Threads\`\n• *Beban CPU:* \`${stats?.cpu || 24}%\`\n• *RAM Terpakai:* \`${stats?.ram.used || 2.4} GB\` (${stats?.ram.percent || 48}% Used)\n• *Disk Storage:* \`${stats?.disk.used || 120} GB\` terpakai dari ${stats?.disk.total || 500} GB\n━━━━━━━━━━━━━━━━━━━━━\n_Pengukuran langsung dari Simulator Sandbox._`;
      } else if (trimmed === "/status") {
        const cpuP = stats?.cpu || 25;
        const ramP = stats?.ram.percent || 55;
        const diskP = stats?.disk.usagePercent || 35;
        botResponse = `📊 *ID SERVER: LOCAL DASHBOARD*\n━━━━━━━━━━━━━━━━━━━━━\n🖥️ *CPU Usage:* \n\`${getBar(cpuP)}\`\n\n📟 *RAM Usage:* \n\`${getBar(ramP)}\` \n_${stats?.ram.used || 2.2} GB dari ${stats?.ram.total || 8} GB_\n\n💾 *Disk Storage:* \n\`${getBar(diskP)}\` \n_${stats?.disk.used || 45} GB dari ${stats?.disk.total || 120} GB_\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Uptime:* \`14 hari, 5 jam, 12 menit\`\n_Dikirim via Dashboard Monitoring VPS_`;
      } else if (trimmed === "/cpu") {
        botResponse = `🖥️ *INFORMASI CPU SERVER*\n━━━━━━━━━━━━━━━━━━━━━\n• *Model:* ${stats?.cpuModel || "Genuine Intel Xeon"}\n• *Core:* ${stats?.cpuCores || 4} CPU thread\n• *Beban Saat Ini:* \`${stats?.cpu || 18}%\`\n• *Load Average (5/10/15m):* \n\`[0.15, 0.22, 0.18]\"\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/ram") {
        botResponse = `📟 *INFORMASI RAM (MEMORY)*\n━━━━━━━━━━━━━━━━━━━━━\n• *Total:* \`${stats?.ram.total || 8} GB\`\n• *Used:* \`${stats?.ram.used || 3.2} GB\`\n• *Free:* \`${stats?.ram.free || 4.8} GB\`\n• *Persentase:* \`${stats?.ram.percent || 40}%\`\n• *Visual Grafis:* \n\`${getBar(stats?.ram.percent || 40)}\`\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/disk") {
        botResponse = `💾 *INFORMASI PENYIMPANAN DISK*\n━━━━━━━━━━━━━━━━━━━━━\n• *Kapasitas:* \`${stats?.disk.total || 250} GB\`\n• *Terpakai:* \`${stats?.disk.used || 85} GB\`\n• *Sisa Ruang:* \`${stats?.disk.free || 165} GB\`\n• *Persentase:* \`${stats?.disk.usagePercent || 34}%\"\n• *Visual Grafis:* \n\`${getBar(stats?.disk.usagePercent || 34)}\`\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/bandwidth" || trimmed === "/remote") {
        const netRx = stats?.network?.rxSpeed ? (stats.network.rxSpeed / 1024 / 1024) : 1.25;
        const netTx = stats?.network?.txSpeed ? (stats.network.txSpeed / 1024 / 1024) : 0.85;
        const netRxPackets = stats?.network?.rxPacketsSpeed || 1450;
        const netTxPackets = stats?.network?.txPacketsSpeed || 720;
        botResponse = `⚡ *INFORMASI MONITOR BANDWIDTH SEMENTARA*\n━━━━━━━━━━━━━━━━━━━━━\n📥 *Trafik Masuk (RX):* \`${netRx.toFixed(2)} MB/s\`\n  └ Paket Kecepatan: \`${netRxPackets.toLocaleString()} pps\`\n📤 *Trafik Keluar (TX):* \`${netTx.toFixed(2)} MB/s\`\n  └ Paket Kecepatan: \`${netTxPackets.toLocaleString()} pps\`\n\n🚨 *SENSIVITAS AMBANG ALARM ACCORDING TO CONFIG:*\n• Limit Masuk (RX): \`${bandwidthConfig.alertNetRxThreshold} MB/s\`\n• Limit Keluar (TX): \`${bandwidthConfig.alertNetTxThreshold} MB/s\`\n\n━━━━━━━━━━━━━━━━━━━━━\n_Sistem memantau secara real-time dari instrumen /proc/net/dev._`;
      } else {
        botResponse = `❌ *Perintah tidak dikenali.*\n\nGunakan menu tombol reply keyboard interaktif di bawah ini untuk mengakses informasi pemantauan real-time atau trigger simulasi banjir trafik dari menu Bandwidth.`;
      }

      if (botResponse) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botResponse,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    }, 400);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setSavingConfig(false);
      if (data.success) {
        setConfig(data.data);
        if (data.data.isActive) {
          setStatusMsg({ type: "success", text: "Konfigurasi disimpan! Bot Telegram AKTIF & berjalan di server Sandbox (Status: Online)." });
        } else {
          setStatusMsg({ type: "success", text: "Konfigurasi disimpan! Bot Sandbox berstatus OFFLINE (karena toggle 'Jalankan di Server Sandbox' mati). Bot siap digunakan pada VPS / Pterodactyl Anda sendiri!" });
        }
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyimpan konfigurasi." });
      }
    } catch (err) {
      setSavingConfig(false);
      setStatusMsg({ type: "error", text: "Error jaringan saat menyimpan konfigurasi." });
    }
  };

  const sendTestAlert = async () => {
    if (!config.token || !config.chatId) {
      setStatusMsg({ type: "error", text: "Bot Token dan Chat ID harus diisi untuk mengirim tes." });
      return;
    }
    setTestSending(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/send-test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: config.token, chatId: config.chatId }),
      });
      const data = await res.json();
      setTestSending(false);
      if (data.success) {
        setStatusMsg({ type: "success", text: "Pesan tes sukses dikirim! Periksa Telegram Chat Anda." });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal mengirim pesan tes. Pastikan Token / Chat ID valid." });
      }
    } catch (err: any) {
      setTestSending(false);
      setStatusMsg({ type: "error", text: "Gagal menghubungkan ke server untuk melakukan tes." });
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for computing readable uptime
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (d === 0 && h === 0) parts.push(`${s} detik`);
    return parts.join(" ");
  };

  // Pre-generate tailored server code based on their input
  const generatedScriptCode = `/**
 * Pterodactyl VPS Monitor Service - Node.js Telegram Bot
 * File: index.js 
 *
 * Jalankan perintah berikut di VPS/Container Pterodactyl Anda:
 * npm install node-telegram-bot-api
 */

const os = require('os');
const { exec } = require('child_process');
const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const CONFIG = {
  token: "${config.token || "MASUKKAN_TELEGRAM_BOT_TOKEN_DISINI"}",    // Token dari @BotFather
  chatId: "${config.chatId || "MASUKKAN_CHAT_ID_TELEGRAM_DISINI"}",  // Chat id penerima alert / dari @userinfobot
  alertCpuThreshold: ${config.alertCpuThreshold},                      // Persentase batas peringatan CPU
  alertRamThreshold: ${config.alertRamThreshold},                      // Persentase batas peringatan RAM
  alertDiskThreshold: ${config.alertDiskThreshold},                      // Persentase batas peringatan Disk Storage
  alertIntervalMinutes: ${config.alertIntervalMinutes},                    // Jeda waktu antar notifikasi peringatan (menit)
  nodeId: "Node-Pterodactyl-01",                // Nama identitas VPS ini di Dashboard
  remoteDashboardUrl: "${appUrl || "https://ais-dev-v2cen6525fj6konqjthq5u-683978000901.asia-southeast1.run.app"}", // Sync Telemetry otomatis ke Dashboard ini!
  enableSync: true                              // Aktifkan sinkronisasi ke panel pusat web
};

let bot;
let lastAlertTimes = { cpu: 0, ram: 0, disk: 0 };

console.log("==========================================");
console.log("   Pterodactyl VPS Monitoring Daemon      ");
console.log("==========================================");

// Inisialisasi bot Telegram
if (CONFIG.token && CONFIG.token !== "MASUKKAN_TELEGRAM_BOT_TOKEN_DISINI") {
  bot = new TelegramBot(CONFIG.token, { polling: true });
  console.log("➡️ Bot Telegram terhubung. Siap menerima instruksi.");
  setupBotCommands();
} else {
  console.log("⚠️ Bot Token belum dikonfigurasi. Menjalankan mode telemetry saja.");
}

// Inisialisasi Alert Loop (Cek setiap 30 detik)
setInterval(checkSystemThresholds, 30 * 1000);

// Inisialisasi Web Dashboard Sync (Kirim telemetry setiap 5 detik)
if (CONFIG.enableSync) {
  setInterval(syncTelemetryToWeb, 5000);
}

// Helper untuk menghitung load CPU average secara berkala
function cpuAverage() {
  const cpus = os.cpus();
  if (!cpus) return { idle: 0, total: 100 };
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

function getCPUUsage() {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) return resolve(0);
      const percentageCPU = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(Math.max(0, Math.min(100, percentageCPU)));
    }, 200);
  });
}

// Helper mengecek disk storage di Linux / Pterodactyl
function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -k /", (err, stdout) => {
      if (err || !stdout) {
        return resolve({ total: 100, free: 60, used: 40, usagePercent: 40 });
      }
      try {
        const lines = stdout.trim().split("\\n");
        if (lines.length > 1) {
          const parts = lines[1].replace(/\\s+/g, " ").split(" ");
          const totalKb = parseInt(parts[1], 10);
          const usedKb = parseInt(parts[2], 10);
          const freeKb = parseInt(parts[3], 10);
          const usagePercent = parseInt(parts[4].replace("%", ""), 10);

          const totalGb = +(totalKb / 1024 / 1024).toFixed(1);
          const usedGb = +(usedKb / 1024 / 1024).toFixed(1);
          const freeGb = +(freeKb / 1024 / 1024).toFixed(1);

          return resolve({
            total: totalGb,
            free: freeGb,
            used: usedGb,
            usagePercent
          });
        }
      } catch (e) {}
      resolve({ total: 80, free: 48, used: 32, usagePercent: 40 });
    });
  });
}

function drawProgressBar(percent, size = 10) {
  const progress = Math.round((percent / 100) * size);
  const emptyProgress = size - progress;
  return "[" + "█".repeat(progress) + "░".repeat(emptyProgress) + "] " + percent + "%";
}

function setupBotCommands() {
  bot.onText(/\\/start/, (msg) => {
    const text = "✨ *Halo! Bot VPS Pterodactyl Aktif.* 💻\\n\\n" +
      "Gunakan perintah berikut:\\n" +
      "📊 /status - Cek status real-time beban system\\n" +
      "🖥️ /cpu - Info detail microprocessor\\n" +
      "📟 /ram - Ukuran memori terpakai\\n" +
      "💾 /disk - Kapasitas penyimpanan\\n" +
      "⏱️ /ping - Cek latensi respons bot";
    bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  });

  bot.onText(/\\/ping/, async (msg) => {
    const startTime = Date.now();
    const serverLatency = startTime - (msg.date * 1000);
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown Processor";
    const cpuCores = cpus.length;
    const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);

    const disk = await getDiskUsage();
    const uptimeSec = os.uptime();
    const d = Math.floor(uptimeSec / (3600 * 24));
    const h = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);

    const cpuVal = await getCPUUsage();

    const response = "🏓 *PONG! BOT AKTIF & RESPONSIF*\\n" +
      "━━━━━━━━━━━━━━━━━━━━━\\n" +
      "⏱️ *Latency:* \`" + serverLatency + " ms\`\\n" +
      "🚀 *Status Server:* \`ONLINE\`\\n\\n" +
      "💻 *INFORMASI SPESIFIKASI VPS (LENGKAP)*\\n" +
      "• *Platform OS:* \`" + os.platform() + " (" + os.arch() + ")\`\\n" +
      "• *OS Kernel:* \`" + os.release() + "\`\\n" +
      "• *Model CPU:* \`" + cpuModel + "\`\\n" +
      "• *CPU Thread / Core:* \`" + cpuCores + " Threads @ " + cpuSpeed + " MHz\`\\n" +
      "• *Beban CPU Saat Ini:* \`" + cpuVal + "%\`\\n" +
      "• *Kapasitas RAM:* \`" + (totalMem / 1024 / 1024 / 1024).toFixed(1) + " GB\` (Free: " + (freeMem / 1024 / 1024 / 1024).toFixed(1) + " GB)\\n" +
      "• *RAM Terpakai:* \`" + (usedMem / 1024 / 1024 / 1024).toFixed(1) + " GB\` (" + ramPercent + "% Used)\\n" +
      "• *Disk Storage:* \`" + disk.total + " GB\` (Free: " + disk.free + " GB, " + disk.usagePercent + "% Used)\\n" +
      "• *Uptime Server:* \`" + d + " hari " + h + " jam " + m + " menit\`\\n" +
      "━━━━━━━━━━━━━━━━━━━━━";

    bot.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
  });

  bot.onText(/\\/status/, async (msg) => {
    const cpuVal = await getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const disk = await getDiskUsage();

    const uptimeSec = os.uptime();
    const d = Math.floor(uptimeSec / (3600 * 24));
    const h = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);

    const statusMsg = "📊 *STATUS NODE VPS PTERODACTYL*\\n" +
      "━━━━━━━━━━━━━━━━━━━━━\\n" +
      "🖥️ *CPU Utilization:*\\n\`" + drawProgressBar(cpuVal) + "\`\\n\\n" +
      "📟 *RAM Memory:*\\n\`" + drawProgressBar(ramPercent) + "\`\\n_" + (usedMem / 1024 / 1024 / 1024).toFixed(1) + " GB terpakai dari " + (totalMem / 1024 / 1024 / 1024).toFixed(1) + " GB_\\n\\n" +
      "💾 *Disk Storage:*\\n\`" + drawProgressBar(disk.usagePercent) + "\`\\n_" + disk.used + " GB terpakai dari " + disk.total + " GB_\\n" +
      "━━━━━━━━━━━━━━━━━━━━━\\n" +
      "⏱️ *Uptime:* \`" + d + " hari " + h + " jam " + m + " menit\`\\n" +
      "💻 *Platform:* \`" + os.platform() + " (" + os.arch() + ")\`";

    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: "Markdown" });
  });

  bot.onText(/\\/cpu/, async (msg) => {
    const cpuVal = await getCPUUsage();
    const model = os.cpus().length > 0 ? os.cpus()[0].model : "Standard Core CPU";
    bot.sendMessage(msg.chat.id, "🖥️ *PROSESSOR INFO*\\n\\n• *Model:* " + model + "\\n• *Core Threads:* " + os.cpus().length + "\\n• *Usage saat ini:* \`" + cpuVal + "%\`", { parse_mode: "Markdown" });
  });

  bot.onText(/\\/ram/, (msg) => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percent = Math.round((used / total) * 100);
    bot.sendMessage(msg.chat.id, "📟 *DETAIL RAM MEMORY*\\n\\n• Total: " + (total/1024/1024/1024).toFixed(1) + " GB\\n• Terpakai: " + (used/1024/1024/1024).toFixed(1) + " GB\\n• Beban: \`" + percent + "%\`", { parse_mode: "Markdown" });
  });

  bot.onText(/\\/disk/, async (msg) => {
    const disk = await getDiskUsage();
    bot.sendMessage(msg.chat.id, "💾 *DETAIL DISK*\\n\\n• Size: " + disk.total + " GB\\n• used: " + disk.used + " GB\\n• Free: " + disk.free + " GB\\n• Beban: \`" + disk.usagePercent + "%\`", { parse_mode: "Markdown" });
  });
}

// Mengecek batas performa (Alert Thresholds)
async function checkSystemThresholds() {
  if (!CONFIG.chatId || !bot) return;

  const cpu = await getCPUUsage();
  const total = os.totalmem();
  const free = os.freemem();
  const ramPercent = Math.round(((total - free) / total) * 100);
  const disk = await getDiskUsage();
  const now = Date.now();
  const intervalMs = CONFIG.alertIntervalMinutes * 60 * 1000;

  if (cpu >= CONFIG.alertCpuThreshold && (now - lastAlertTimes.cpu > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] CPU OVERLOAD!*\\nBeban CPU mencapai \`" + cpu + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.cpu = now;
  }

  if (ramPercent >= CONFIG.alertRamThreshold && (now - lastAlertTimes.ram > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] RAM MEMORY SANGAT BERAT!*\\nPemakaian Memory mencapai \`" + ramPercent + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.ram = now;
  }

  if (disk.usagePercent >= CONFIG.alertDiskThreshold && (now - lastAlertTimes.disk > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] STORAGE PENUH!*\\nKapasitas Disk terpakai \`" + disk.usagePercent + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.disk = now;
  }
}

// Menghubungkan telemetri jarak jauh ke Dashboard pusat web
async function syncTelemetryToWeb() {
  try {
    const cpu = await getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const disk = await getDiskUsage();

    const statsPayload = {
      nodeId: CONFIG.nodeId,
      secret: "pterodactyl-pass-1234",
      stats: {
        cpu,
        ram: {
          total: Math.round(totalMem / 1024 / 1024),
          used: Math.round((totalMem - freeMem) / 1024 / 1024),
          percent: ramPercent
        },
        disk: {
          total: disk.total,
          used: disk.used,
          percent: disk.usagePercent
        },
        uptime: Math.round(os.uptime()),
        os: os.platform() + " " + os.arch()
      }
    };

    const url = CONFIG.remoteDashboardUrl + "/api/remote-stats";
    
    // Melakukan Node Fetch tanpa dependensi luar
    const https = url.startsWith('https') ? require('https') : require('http');
    const u = new URL(url);
    const payloadStr = JSON.stringify(statsPayload);

    const options = {
      hostname: u.hostname,
      port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    const req = https.request(options, (res) => {
      // Data successfully pushed
    });

    req.on('error', (e) => {
      // Silent error dashboard offline
    });

    req.write(payloadStr);
    req.end();

  } catch (err) {
    // Fail-safe
  }
}
`;

  return (
    <div className="min-h-screen bg-[#030306] text-neutral-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 relative overflow-hidden">
      
      {/* Absolute ambient lights & solar system flares */}
      <div className="absolute top-0 left-1/4 w-[45rem] h-[45rem] bg-gradient-to-br from-orange-500/5 to-purple-500/0 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[50rem] h-[50rem] bg-gradient-to-tr from-purple-500/5 to-yellow-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/3"></div>
      
      {/* Decorative top orbit glow bar */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/20 via-yellow-400/40 to-purple-500/20"></div>
      
      {/* Container header & top level layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 relative z-10">
        
        {/* Sleek Navigation Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between bg-[#07070c]/85 border border-orange-500/10 rounded-2xl p-5 md:p-6 mb-8 gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.55)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-[1px] bg-orange-400"></div>
          <div className="absolute bottom-0 left-0 w-16 h-[1.5px] bg-gradient-to-r from-orange-500 to-transparent"></div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-950/20 border border-orange-500/30 rounded-xl text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black font-display tracking-wider text-orange-50 text-shadow-[0_0_10px_rgba(249,115,22,0.25)]">
                  KOSMOS MONITOR <span className="text-orange-400">TELEGRAM</span>
                </h1>
                <span className="text-[9px] bg-orange-950/45 border border-orange-500/30 text-orange-300 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                  HELIOCENTRIC ENGINE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 font-sans">
                Sistem Pemantauan VPS Heliosentris Real-time, Warning Telemetri, & Integrasi Bot Telegram
              </p>
            </div>
          </div>

          {/* Quick status widget */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-black/60 border border-cyan-500/20 rounded-xl shadow-[inset_0_0_10px_rgba(0,243,255,0.02)]">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  config.isActive ? "bg-cyan-400" : "bg-neutral-600"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  config.isActive ? "bg-cyan-400" : "bg-neutral-500"
                }`}></span>
              </span>
              <span className="text-neutral-400 font-bold tracking-tight">BOT:</span>
              <span className={config.isActive ? "text-cyan-400 font-extrabold" : "text-neutral-500"}>
                {config.isActive ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            {/* Admin Password Status Indicator */}
            <div className="flex items-center gap-2 font-mono">
              {adminSessionActive ? (
                <button
                  onClick={handleLogoutAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/20 border border-rose-500/35 rounded-xl hover:bg-rose-950/40 text-rose-450 hover:text-white font-bold transition select-none cursor-pointer group shadow-[0_0_10px_rgba(239,68,68,0.05)] text-[10px]"
                  title="Klik untuk mengunci kembali semua menu sensitif"
                >
                  <Unlock className="w-3 h-3 animate-pulse text-rose-400 group-hover:scale-110 transition" />
                  <span>KUNCI_SESI</span>
                </button>
              ) : (
                <div 
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 border border-neutral-850 rounded-xl text-neutral-500 font-bold select-none text-[10px]"
                  title="Menu sensitif sedang dikunci untuk mencegah penyalahgunaan"
                >
                  <Lock className="w-3 h-3 text-neutral-500" />
                  <span>SISTEM_LOCK</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab Selection Dropdown (Replacing standard stacking buttons) */}
        <div className="relative mb-8 z-30">
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 rounded-2xl p-4 shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)]">
            
            {/* Left: Active Tab Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]">
                {activeTab === "dashboard" && <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />}
                {activeTab === "ptero" && <Layers className="w-5 h-5" />}
                {activeTab === "telegram" && <Settings className="w-5 h-5" />}
                {activeTab === "ports" && <Globe className="w-5 h-5" />}
                {activeTab === "terminal" && <Terminal className="w-5 h-5 text-emerald-400" />}
                {activeTab === "backup" && <Database className="w-5 h-5" />}
                {activeTab === "optimizer" && <Zap className="w-5 h-5 text-amber-400" />}
                {activeTab === "bandwidth" && <Wifi className={`w-5 h-5 ${isSimulatingFlood ? "animate-pulse text-red-400" : ""}`} />}
                {activeTab === "logs" && <Bell className={`w-5 h-5 text-rose-400 ${alertLogs.length > 0 ? "animate-bounce" : ""}`} />}
                {activeTab === "remote" && <Server className="w-5 h-5 text-purple-400" />}
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase block">
                  ({activeTab === "dashboard" ? "01" : 
                    activeTab === "ptero" ? "02" :
                    activeTab === "telegram" ? "03" :
                    activeTab === "ports" ? "04" :
                    activeTab === "terminal" ? "05" :
                    activeTab === "backup" ? "06" :
                    activeTab === "optimizer" ? "07" :
                    activeTab === "bandwidth" ? "08" : 
                    activeTab === "logs" ? "09" : "10"}) INSTANCE PANEL
                </span>
                <span className="text-sm font-bold tracking-wider text-neutral-200">
                  {activeTab === "dashboard" && "DASHBOARD UTAMA"}
                  {activeTab === "ptero" && "DAFTAR PANEL PTERODACTYL"}
                  {activeTab === "telegram" && "BOT TELEGRAM"}
                  {activeTab === "ports" && "CEK PORT & LAYANAN"}
                  {activeTab === "terminal" && "KONSOL PINTASAN SSH"}
                  {activeTab === "backup" && "SINKRONISASI BACKUP"}
                  {activeTab === "optimizer" && "RAM & CACHE OPTIMIZER"}
                  {activeTab === "bandwidth" && "BANDWIDTH MONITOR"}
                  {activeTab === "logs" && "DATABASE LOG ALARM"}
                  {activeTab === "remote" && "MONITORING VPS SATELLITE (LIVE)"}
                </span>
              </div>
            </div>

            {/* Right: Hamburger / Kebab Toggle Trigger */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label={showMenu ? "Tutup menu" : "Buka menu"}
              title={showMenu ? "Tutup menu" : "Buka menu"}
              className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-xl border transition-all cursor-pointer ${
                showMenu 
                  ? "bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                  : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-neutral-100"
              }`}
            >
              {showMenu
                ? <X className="w-[18px] h-[18px]" />
                : <Menu className="w-[18px] h-[18px]" />
              }
            </button>
          </div>

          {/* Floating Dropdown Panel */}
          <AnimatePresence>
            {showMenu && (
              <>
                {/* Click outside backdrop close */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 left-0 mt-2 z-20 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden p-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 p-1">
                    
                    <button
                      onClick={() => { setActiveTab("dashboard"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "dashboard"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Cpu className={`w-4.5 h-4.5 ${activeTab === "dashboard" ? "text-cyan-400 animate-spin" : "text-neutral-400"}`} style={{ animationDuration: '6s' }} />
                        <div>
                          <p className="font-bold tracking-wider">DASHBOARD UTAMA</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Visualisasi orbit & metrik bot live</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[01]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("ptero"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "ptero"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className={`w-4.5 h-4.5 ${activeTab === "ptero" ? "text-cyan-400 animate-pulse" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">PANEL PTERODACTYL</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Daftar server game & nomor panel</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[02]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("telegram"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "telegram"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className={`w-4.5 h-4.5 ${activeTab === "telegram" ? "text-cyan-400" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">BOT TELEGRAM</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Pengaturan kredensial & API webhook</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[03]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("ports"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "ports"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className={`w-4.5 h-4.5 ${activeTab === "ports" ? "text-cyan-400" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">CEK PORT & LAYANAN</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Pengecekan status port web & database</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[04]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("terminal"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "terminal"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Terminal className={`w-4.5 h-4.5 ${activeTab === "terminal" ? "text-emerald-400" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">KONSOL PINTASAN SSH</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Eksekusi perintah terminal instan</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[05]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("backup"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "backup"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database className={`w-4.5 h-4.5 ${activeTab === "backup" ? "text-cyan-400" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">SINKRONISASI BACKUP</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Jadwal backup data & folder VPS</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[06]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("optimizer"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "optimizer"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Zap className={`w-4.5 h-4.5 ${activeTab === "optimizer" ? "text-amber-400" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">RAM & CACHE OPTIMIZER</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Optimisasi instan performa memory</p>
                        </div>
                      </div>
                      <span className="font-mono opacity-50 font-semibold">[07]</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("bandwidth"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "bandwidth"
                          ? "bg-cyan-950/25 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wifi className={`w-4.5 h-4.5 ${activeTab === "bandwidth" ? "text-cyan-400 animate-pulse" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">BANDWIDTH MONITOR</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Real-time traffic & simulasi flood</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSimulatingFlood && (
                          <span className="bg-red-500 text-neutral-950 font-extrabold px-1.5 py-0.5 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-bounce text-center">
                            ATTACK
                          </span>
                        )}
                        <span className="font-mono opacity-50 font-semibold">[08]</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab("logs"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "logs"
                          ? "bg-rose-950/25 border-rose-500/30 text-rose-400 shadow-[inset_0_0_12px_rgba(244,63,94,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bell className={`w-4.5 h-4.5 ${activeTab === "logs" ? "text-rose-400 animate-bounce" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">DATABASE LOG ALARM</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Notifikasi error & threshold sistem</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alertLogs.length > 0 && (
                          <span className="bg-rose-600 text-white font-bold px-1.5 py-0.5 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse">
                            {alertLogs.length} LOG
                          </span>
                        )}
                        <span className="font-mono opacity-50 font-semibold">[09]</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab("remote"); setShowMenu(false); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        activeTab === "remote"
                          ? "bg-purple-950/25 border-purple-500/30 text-purple-400 shadow-[inset_0_0_12px_rgba(147,51,234,0.1)]"
                          : "bg-neutral-900/35 border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Server className={`w-4.5 h-4.5 ${activeTab === "remote" ? "text-purple-400 animate-pulse" : "text-neutral-400"}`} />
                        <div>
                          <p className="font-bold tracking-wider">SATELLITE VPS STATUS</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Live telemetry & daemon installer</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {remoteDevices.length > 0 && (
                          <span className="bg-purple-600 text-white font-bold px-1.5 py-0.5 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(147,51,234,0.5)] animate-pulse">
                            {remoteDevices.length} ACTIVE
                          </span>
                        )}
                        <span className="font-mono opacity-50 font-semibold">[10]</span>
                      </div>
                    </button>

                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Stats overview banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CPU HUD CARD */}
                <div className="bg-[#0b0b10] border border-cyan-500/30 rounded-xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(0,243,255,0.05)]">
                  {/* Cyber block corner accent */}
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-cyan-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-[1.5px] bg-cyan-400"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-display font-bold">SYS_CORE // CPU_LOAD</p>
                      <h3 className="text-3xl font-extrabold mt-1 text-cyan-100 font-display tracking-tight font-sans">
                        {stats ? `${stats.cpu}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-cyan-400">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="w-full bg-cyan-950/35 border border-cyan-500/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_#00f3ff]" 
                          style={{ width: `${stats.cpu}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9.5px] text-neutral-400 font-mono pb-2 border-b border-cyan-950/30">
                        <span>CORES: [0{stats.cpuCores}] UP</span>
                        <span className="truncate max-w-[130px] text-neutral-500 text-right" title={stats.cpuModel}>
                          {stats.cpuModel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-neutral-400 font-mono">THERMAL_ZONE (SUHU)</span>
                        <span className={`font-mono font-bold flex items-center gap-1 ${
                          (stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 72 
                            ? "text-red-450 animate-pulse" 
                            : (stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 58 
                            ? "text-amber-400" 
                            : "text-emerald-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                            (stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 72 
                              ? "bg-red-500 animate-ping" 
                              : (stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 58 
                              ? "bg-amber-500" 
                              : "bg-emerald-500"
                          }`}></span>
                          {stats.cpuTemp ? `${stats.cpuTemp.toFixed(1)}°C` : `${(38 + (stats.cpu * 0.4)).toFixed(1)}°C`}
                          {(stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 72 ? " [OVERHEAT!]" : (stats.cpuTemp || (38 + (stats.cpu * 0.4))) > 58 ? " [HANGAT]" : " [NORMAL]"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* RAM HUD CARD */}
                <div className="bg-[#0b0b10] border border-purple-500/30 rounded-xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-purple-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-[1.5px] bg-purple-400"></div>

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest font-display font-bold">RAM_FLUX // TOTAL_MEM</p>
                      <h3 className="text-3xl font-extrabold mt-1 text-purple-100 font-display tracking-tight font-sans">
                        {stats ? `${stats.ram.percent}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-lg text-purple-400">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="w-full bg-purple-950/35 border border-purple-500/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.6)]" 
                          style={{ width: `${stats.ram.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9.5px] text-neutral-400 font-mono">
                        <span>USED: {stats.ram.used.toFixed(2)} GB</span>
                        <span>MAX: {stats.ram.total.toFixed(1)} GB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* DISK HUD CARD */}
                <div className="bg-[#0b0b10] border border-amber-500/30 rounded-xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-[1.5px] bg-amber-400"></div>

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] text-amber-400 uppercase tracking-widest font-display font-bold">STR_SECTOR // HARD_DRIVE</p>
                      <h3 className="text-3xl font-extrabold mt-1 text-amber-100 font-display tracking-tight font-sans">
                        {stats && stats.disk ? `${stats.disk.usagePercent || Math.round((stats.disk.used / (stats.disk.total || 1)) * 100)}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="w-full bg-amber-950/35 border border-amber-500/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.6)]" 
                          style={{ width: `${stats.disk.usagePercent || Math.round((stats.disk.used / (stats.disk.total || 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9.5px] text-neutral-400 font-mono">
                        <span>USED: {stats.disk.used.toFixed(1)} GB</span>
                        <span>FREE: {stats.disk.free.toFixed(1)} GB</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Main Matrix Board layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Left side: Animated Cosmic Hologram Radar */}
                <div className="lg:col-span-3 space-y-4 flex flex-col">
                  <div className="bg-[#05050b] border border-orange-500/15 rounded-2xl p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 font-display tracking-wider flex items-center gap-1.5 uppercase">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          Simulator Sumbu Sektoral - Sistem Bintang Kita
                        </h3>
                        <p className="text-[11px] text-neutral-450 mt-0.5">Diagram heliosentris interaktif merepresentasikan utilisasi CPU (Matahari), RAM (Bumi & Bulan), Harddisk (Yupiter), dan Remote Nodes (Satelit Saturnus).</p>
                      </div>
                      <div className="text-[10px] bg-orange-950/40 border border-orange-500/20 px-2 py-0.5 rounded font-mono text-orange-400 uppercase font-semibold">
                        SISTEM ORBITAL v3.0
                      </div>
                    </div>

                    {/* Galaxy Canvas! */}
                    <div className="flex-1 w-full min-h-[300px]">
                      <HoloGalaxyCanvas 
                        cpu={stats?.cpu || 18} 
                        ram={stats?.ram.percent || 40} 
                        stats={stats} 
                        warpMultiplier={warpMultiplier}
                        orbitLabelsVisible={orbitLabelsVisible}
                        starSystemTheme={starSystemTheme}
                      />
                    </div>

                    {/* Interactive Sub-controllers (Panel Kinetik Orbital) */}
                    <div className="mt-4 p-3.5 bg-black/40 border border-orange-500/10 rounded-xl space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        
                        <div className="space-y-1">
                          <span className="text-[9px] text-orange-400 font-mono block uppercase font-bold tracking-wider">⏱️ KINETIC SPEED</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="0.1" 
                              max="4.0" 
                              step="0.1"
                              value={warpMultiplier} 
                              onChange={(e) => setWarpMultiplier(parseFloat(e.target.value))}
                              className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-neutral-300 font-semibold w-7">{warpMultiplier.toFixed(1)}x</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-orange-400 font-mono block uppercase font-bold tracking-wider">🌌 ALIGNMENT</span>
                          <select 
                            value={starSystemTheme} 
                            onChange={(e) => setStarSystemTheme(e.target.value as any)}
                            className="bg-[#0b0b11] border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-neutral-300 font-mono focus:border-orange-500/50 outline-none w-full"
                          >
                            <option value="standard">🌞 TATA SURYA</option>
                            <option value="neutron">❄️ BINTANG NEUTRON</option>
                            <option value="nebula">🌸 NEBULA PILAR</option>
                          </select>
                        </div>

                        <div className="space-y-1 flex flex-col justify-center">
                          <span className="text-[9px] text-orange-400 font-mono block uppercase font-bold tracking-wider">🏷️ NAMA PLANET</span>
                          <button
                            type="button"
                            onClick={() => setOrbitLabelsVisible(!orbitLabelsVisible)}
                            className={`px-3 py-1 text-[9px] font-mono rounded border transition-all text-left flex items-center justify-between mt-1 h-[24px] ${
                              orbitLabelsVisible 
                                ? "bg-orange-950/20 text-orange-400 border-orange-500/25 shadow-[0_0_8px_rgba(249,115,22,0.06)]" 
                                : "bg-neutral-950 text-neutral-500 border-neutral-850 hover:border-neutral-700"
                            }`}
                          >
                            <span>SHOW: {orbitLabelsVisible ? "ON" : "OFF"}</span>
                            <span className={orbitLabelsVisible ? "text-orange-500 font-bold" : ""}>●</span>
                          </button>
                        </div>

                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-900/60">
                        <button
                          onClick={() => {
                            const burstLog = {
                              id: "burst-" + Math.random().toString(36).substring(2, 8),
                              timestamp: new Date().toISOString(),
                              type: "system" as const,
                              level: "info" as const,
                              title: "Injeksi Badai Radiasi Surya Sukses",
                              message: "Sinyal semburan angin solar disimulasikan ke dalam diagram orbit. Node telemetri merespons stabil."
                            };
                            setAlertLogs(prev => [burstLog, ...prev]);
                            alert("🌌 KOSMOS: Gelombang Badai Radiasi Surya berhasil di-injeksi! Semburan aurora terdeteksi dalam sumbu orbital, cek log meteor.");
                          }}
                          className="py-2.5 px-3 bg-[#1c0f05] border border-orange-500/35 hover:border-orange-400 text-[11px] font-display text-orange-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(249,115,22,0.05)] uppercase font-semibold text-center"
                        >
                          ⚡ INJEKSI BADAI SURYA
                        </button>
                        <button
                          onClick={() => {
                            if (stats) {
                              setStats({
                                ...stats,
                                cpu: Math.min(100, Math.floor(stats.cpu + Math.random() * 25 + 20)),
                                ram: {
                                  ...stats.ram,
                                  percent: Math.min(100, Math.floor(stats.ram.percent + Math.random() * 15 + 10))
                                }
                              });
                            }
                            alert("🚀 GRAVITASI: BADAI GEOMAGNETIK DI-AKTIFKAN! Rotasi planet seketika berputar lebih cepat akibat pelepasan fluks magnet Matahari.");
                          }}
                          className="py-2.5 px-3 bg-[#1e1025] border border-purple-500/30 hover:border-purple-400 text-[11px] font-display text-purple-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.05)] uppercase font-semibold text-center"
                        >
                          🔥 BADAI GEOMAGNETIK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Charts and Specs HUD */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                  
                  {/* Live load sparklines graph */}
                  <div className="bg-[#0b0b10] border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xs font-bold font-display text-neutral-100 uppercase tracking-wide">Diagram Fluks Angin Surya (Live)</h4>
                        <p className="text-[10px] font-mono text-neutral-400 mt-0.5">Semburan Koronal & Rambat Orbit Matahari (refresh 3s)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[9px] text-orange-400 font-mono font-medium">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full inline-block animate-ping"></span>
                          MATAHARI (CPU)
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-mono font-medium">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                          BUMI (RAM)
                        </div>
                      </div>
                    </div>

                    <div className="h-44 w-full bg-[#060609]/95 border border-neutral-800 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
                      {history.cpu.length > 1 ? (
                        <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="cyberCpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="cyberRamGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                          <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                          <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />

                          {/* CPU Area polygon */}
                          <path 
                            d={`M 0,150 ${history.cpu.map((val, idx) => {
                              const x = (idx / (history.cpu.length - 1)) * 500;
                              const y = 150 - (val / 100) * 135;
                              return `L ${x},${y}`;
                            }).join(" ")} L 500,150 Z`} 
                            fill="url(#cyberCpuGrad)" 
                          />
                          <path 
                            d={history.cpu.map((val, idx) => {
                              const x = (idx / (history.cpu.length - 1)) * 500;
                              const y = 150 - (val / 100) * 135;
                              return `${idx === 0 ? "M" : "L"} ${x},${y}`;
                            }).join(" ")} 
                            fill="none" 
                            stroke="#00f3ff" 
                            strokeWidth="2" 
                          />

                          {/* RAM Area Polygon */}
                          <path 
                            d={`M 0,150 ${history.ram.map((val, idx) => {
                              const x = (idx / (history.ram.length - 1)) * 500;
                              const y = 150 - (val / 100) * 135;
                              return `L ${x},${y}`;
                            }).join(" ")} L 500,150 Z`} 
                            fill="url(#cyberRamGrad)" 
                          />
                          <path 
                            d={history.ram.map((val, idx) => {
                              const x = (idx / (history.ram.length - 1)) * 500;
                              const y = 150 - (val / 100) * 135;
                              return `${idx === 0 ? "M" : "L"} ${x},${y}`;
                            }).join(" ")} 
                            fill="none" 
                            stroke="#a855f7" 
                            strokeWidth="1.5" 
                          />
                        </svg>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-[10px] text-neutral-500 font-mono uppercase">
                          Menunggu pasokan data sensor...
                        </div>
                      )}

                      <div className="flex justify-between text-[8px] text-neutral-500 font-mono mt-1 border-t border-neutral-900 pt-1.5">
                        <span>LALU [90 SEC]</span>
                        <span>BEBAN SAAT INI</span>
                      </div>
                    </div>
                  </div>

                  {/* Host specs terminal layout */}
                  <div className="bg-[#0b0b10] border border-neutral-850 rounded-2xl p-5 flex flex-col relative overflow-hidden flex-1 mt-4">
                    <h3 className="text-xs font-bold text-neutral-100 font-display flex items-center gap-2 uppercase tracking-wide mb-3">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      Diagnostik Host Master
                    </h3>

                    {stats ? (
                      <div className="space-y-2 flex-1 text-[11.5px] font-mono text-neutral-300">
                        <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                          <span className="text-neutral-500">[SYSTEM_OS]:</span>
                          <span className="text-cyan-400 font-bold">{stats.platform} ({stats.arch})</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                          <span className="text-neutral-500">[CORES_AVAIL]:</span>
                          <span className="text-neutral-200">{stats.cpuCores} CORE_LOGICAL</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-850/60 pb-1.5 border-dashed">
                          <span className="text-neutral-500">[UPTIME_CLOCK]:</span>
                          <span className="text-neutral-200 text-right">
                            {formatUptime(stats.uptime)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-850/60 pb-1.5">
                          <span className="text-neutral-500">[LOAD_AVERAGE]:</span>
                          <span className="text-purple-400">
                            {stats.loadAvg.map(val => val.toFixed(2)).join(" / ")}
                          </span>
                        </div>

                        {/* Interactive typing debug console log */}
                        <div className="mt-3 p-2 bg-black/80 border border-neutral-800 rounded-lg font-mono text-[9.5px] leading-relaxed select-none overflow-hidden h-[60px] text-neutral-400">
                          <span className="text-cyan-400">$ vps-agent --stats</span>
                          <div className="text-neutral-500 mt-0.5 whitespace-nowrap">
                            [CORE]: Galaxy clock synced at 60Hz.<br />
                            [SYNC]: Pterodactyl daemon status parsed OK
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                        Memuat data spesifikasi...
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* PTERODACTYL PING LATENCY MONITOR CHART (using recharts) */}
              <div className="bg-[#08080d]/90 border border-neutral-850 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-900 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400">
                      <Wifi className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-2">
                        PTERODACTYL SERVER PING LATENCY MONITOR (LIVE)
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Memantau stabilitas throughput, fluktuasi network rtt, serta tingkat jitter koneksi bot daemon ke server node game Pterodactyl.</p>
                    </div>
                  </div>
                  
                  {/* Status Pills */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] bg-neutral-900 border border-neutral-800 font-mono text-neutral-455 px-2 py-0.5 rounded">
                      Node: <strong className="text-cyan-400">{config.nodeId || "Pterodactyl-Main"}</strong>
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-400 px-2.5 py-0.5 rounded uppercase font-bold animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      ONLINE & STABIL
                    </span>
                  </div>
                </div>

                {/* KPI stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="bg-neutral-950/60 border border-neutral-850/50 p-2.5 rounded-xl font-mono text-center">
                    <span className="text-[8.5px] text-neutral-500 block uppercase font-bold">LATENCY TERKINI</span>
                    <span className="text-lg font-black text-emerald-400">
                      {pingHistory[pingHistory.length - 1]?.ping || 0} <span className="text-[9.5px] text-neutral-500 font-normal">ms</span>
                    </span>
                  </div>
                  
                  <div className="bg-neutral-950/60 border border-neutral-850/50 p-2.5 rounded-xl font-mono text-center">
                    <span className="text-[8.5px] text-neutral-500 block uppercase font-bold">MIN LATENSI</span>
                    <span className="text-lg font-black text-white">
                      {Math.min(...pingHistory.map(p => p.ping))} <span className="text-[9.5px] text-neutral-500 font-normal">ms</span>
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-850/50 p-2.5 rounded-xl font-mono text-center">
                    <span className="text-[8.5px] text-neutral-500 block uppercase font-bold">MAX LATENSI</span>
                    <span className="text-lg font-black text-amber-500">
                      {Math.max(...pingHistory.map(p => p.ping))} <span className="text-[9.5px] text-neutral-500 font-normal">ms</span>
                    </span>
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-850/50 p-2.5 rounded-xl font-mono text-center">
                    <span className="text-[8.5px] text-neutral-500 block uppercase font-bold">JITTER ESTIMATION</span>
                    <span className="text-lg font-black text-purple-400">
                      ±{(pingHistory.map((p, i) => i === 0 ? 0 : Math.abs(p.ping - pingHistory[i-1].ping)).reduce((a, b) => a + b, 0) / pingHistory.length).toFixed(1)} <span className="text-[9.5px] text-neutral-500 font-normal">ms</span>
                    </span>
                  </div>
                </div>

                <div className="h-[180px] w-full mt-2 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={pingHistory}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPing" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" opacity={0.6} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#52525b" 
                        fontSize={9} 
                        tickLine={false} 
                        fontFamily="monospace"
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={9} 
                        tickLine={false} 
                        fontFamily="monospace"
                        unit=" ms"
                      />
                      <RechartsTooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const val = payload[0]?.value;
                            let statusText = "⚡ Sangat Cepat (Sempurna)";
                            let statusColor = "text-emerald-400";
                            if (val > 50) {
                              statusText = "⚠️ Jitter Jaringan Terdeteksi";
                              statusColor = "text-amber-400 font-extrabold";
                            } else if (val > 30) {
                              statusText = "● Koneksi Sedang";
                              statusColor = "text-cyan-400";
                            }
                            return (
                              <div className="bg-[#0b0b14]/95 border border-neutral-800 p-3 rounded-xl font-mono text-[10px] space-y-1.5 shadow-2xl relative z-50">
                                <p className="text-neutral-400 font-bold border-b border-neutral-850 pb-1 mb-1 flex items-center gap-1.5">
                                  ⏱️ Waktu Cek: <span className="text-neutral-200">{label}</span>
                                </p>
                                <p className="text-[#10b981] font-bold flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> 
                                  Latensi: {val} ms
                                </p>
                                <p className={`${statusColor} text-[9px] flex items-center gap-1.5`}>
                                  {statusText}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="ping" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPing)" 
                        name="Ping Latency"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Relocation System Informer Footer */}
              <div className="p-4 bg-cyan-950/25 border border-cyan-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 text-cyan-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-cyan-400"></div>
                <HelpCircle className="w-6 h-6 shrink-0 text-cyan-400 animate-pulse" />
                <div className="text-[11px] space-y-0.5">
                  <p className="font-bold flex items-center gap-1 font-display uppercase tracking-wide text-cyan-200">💡 RELOKASI RIWAYAT LOG ALARM DATABASE SUKSES</p>
                  <p className="text-neutral-400 leading-relaxed font-sans">
                    Log Peringatan VPS dipindahkan sepenuhnya ke tab mandiri <strong>"Database Log Alarm"</strong> di bagian navigasi atas demi kenyamanan visual dashboard.
                  </p>
                </div>
              </div>

              {/* Hidden old container content */}
              <div className="hidden">

                {alertLogs.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-neutral-850 rounded-xl bg-neutral-950/30">
                    <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-500">
                      <CheckCircle className="w-6 h-6 text-neutral-500" />
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">Sistem Berjalan Normal — Tidak Ada Log Alarm</p>
                    <p className="text-[10px] text-neutral-500 max-w-sm">
                      Batas alarm saat ini: CPU ({config.alertCpuThreshold}%), RAM ({config.alertRamThreshold}%), Disk ({config.alertDiskThreshold}%). Log akan tercatat jika beban di atas batas ini.
                    </p>
                  </div>
                ) : (
                  <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-950/35">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-850">
                            <th className="p-3 font-mono">WAKTU</th>
                            <th className="p-3">KATEGORI</th>
                            <th className="p-3">ALARM (ALERT)</th>
                            <th className="p-3">DESKRIPSI RINCIAN</th>
                            <th className="p-3 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850/60">
                          {alertLogs.map((log) => {
                            let typeBadgeColor = "text-neutral-400 bg-neutral-900 border-neutral-800";
                            if (log.type === "cpu") typeBadgeColor = "text-amber-400 bg-amber-950/20 border-amber-500/20";
                            if (log.type === "ram") typeBadgeColor = "text-purple-400 bg-purple-950/20 border-purple-500/20";
                            if (log.type === "disk") typeBadgeColor = "text-orange-400 bg-orange-950/20 border-orange-500/20";
                            if (log.type === "system") typeBadgeColor = "text-sky-400 bg-sky-950/20 border-sky-500/20";
                            
                            let levelBadge = "🔴 CRITICAL";
                            if (log.level === "info") levelBadge = "🔵 INFO";
                            if (log.level === "warning") levelBadge = "🟡 WARNING";
                            if (log.level === "success") levelBadge = "🟢 ONLINE";
                            
                            let levelColor = "text-rose-400 font-semibold";
                            if (log.level === "info") levelColor = "text-sky-400";
                            if (log.level === "warning") levelColor = "text-amber-400";
                            if (log.level === "success") levelColor = "text-emerald-400";

                            return (
                              <tr key={log.id} className="hover:bg-neutral-900/40 transition">
                                <td className="p-3 font-mono font-medium text-[11px] text-neutral-400 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString("id-ID")}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${typeBadgeColor}`}>
                                    {log.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-neutral-200">
                                  {log.title}
                                </td>
                                <td className="p-3 text-neutral-400 text-[11px] leading-relaxed max-w-sm">
                                  {log.message}
                                </td>
                                <td className={`p-3 text-right font-mono text-[10px] ${levelColor}`}>
                                  {levelBadge}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {activeTab === "ptero" && (
            <motion.div
              key="ptero"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* PTERODACTYL CONTAINERS / SERVERS DETECTED */}
              <div className="bg-[#08080d]/90 border border-neutral-850 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-900 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-cyan-400">
                      <Layers className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-2">
                        📦 DAFTAR SERVER PANEL PTERODACTYL
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Memantau status kontainer server game dan nomor panel Pterodactyl terdeteksi.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Source Status Pill */}
                    {pterodactylServers.length > 0 && pterodactylServers[0].isReal ? (
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-400 px-2.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        KONEKSI API AKTIF
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 font-mono text-amber-400 px-2.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                        MODE SIMULASI
                      </span>
                    )}

                    <button
                      onClick={triggerPterodactylRescan}
                      disabled={isScanningPterodactyl}
                      className="flex items-center gap-1.5 text-[10px] bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 hover:text-cyan-350 px-3 py-1.5 rounded-xl font-mono font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningPterodactyl ? "animate-spin text-cyan-400" : ""}`} />
                      {isScanningPterodactyl ? "MEMINDAI..." : "SCAN ULANG"}
                    </button>
                  </div>
                </div>

                {pterodactylScanError && (
                  <div className="p-3 bg-[#0f0e0a]/80 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 font-sans leading-relaxed">
                    ⚠️ <strong>Informasi Koneksi:</strong> {pterodactylScanError}
                    <p className="text-[10px] text-neutral-400 mt-1 font-mono leading-normal">
                      Isi <strong>domain, ptla/ptlc, cpuLimit, ramLimit, diskLimit, scanInterval</strong> di file <code className="text-amber-500 font-bold">config.js</code> di VPS Anda, atau isi di menu <strong>"Pengaturan Bot"</strong> untuk sinkronisasi otomatis.
                    </p>
                  </div>
                )}

                {(() => {
                  const activePteroServers = pterodactylServers.filter((s) => !deletedPteroServerIds.includes(s.id));
                  const filteredPteroServers = activePteroServers.filter((server) => {
                    if (!pteroSearchQuery.trim()) return true;
                    const query = pteroSearchQuery.toLowerCase().trim();
                    return (
                      server.name.toLowerCase().includes(query) ||
                      server.id.toLowerCase().includes(query) ||
                      server.node.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div className="space-y-6">
                      {/* Client-side Search and Filter Bar */}
                      {activePteroServers.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 items-center bg-neutral-950/45 p-3.5 rounded-2xl border border-neutral-850/60">
                          <div className="relative w-full flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                              type="text"
                              placeholder="Cari server berdasarkan nama, ID, atau label Node..."
                              value={pteroSearchQuery}
                              onChange={(e) => setPteroSearchQuery(e.target.value)}
                              className="w-full bg-[#040406]/90 border border-neutral-800/80 focus:border-cyan-500/50 focus:outline-none text-neutral-250 text-xs pl-10 pr-16 py-2.5 rounded-xl font-sans transition placeholder:text-neutral-600 shadow-inner"
                            />
                            {pteroSearchQuery && (
                              <button
                                onClick={() => setPteroSearchQuery("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition text-[10px] font-mono font-bold cursor-pointer bg-neutral-900 border border-neutral-800/60 px-2 py-0.5 rounded"
                              >
                                CLEAR
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-neutral-500 self-stretch sm:self-auto justify-between sm:justify-start border-t sm:border-t-0 border-neutral-900/40 pt-2 sm:pt-0">
                            <span className="tracking-wider uppercase text-neutral-500">TERTAMPIL:</span>
                            <div className="bg-[#050508] border border-neutral-800 px-2.5 py-1 rounded-lg">
                              <span className="text-cyan-400 font-bold">{filteredPteroServers.length}</span>
                              <span className="text-neutral-600 mx-1">/</span>
                              <span className="text-neutral-400">{activePteroServers.length}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activePteroServers.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-neutral-850 rounded-xl bg-neutral-950/35">
                          <p className="text-xs text-neutral-400 font-medium">Tidak ada server panel Pterodactyl yang ditampilkan</p>
                          <p className="text-[10px] text-neutral-500 max-w-sm">Semua server telah dihapus/disembunyikan dari daftar, atau tidak ada data yang terbaca.</p>
                          {deletedPteroServerIds.length > 0 && (
                            <button
                              onClick={handleResetDeletedPteroServers}
                              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                            >
                              Reset & Tampilkan Kembali Server ({deletedPteroServerIds.length})
                            </button>
                          )}
                        </div>
                      ) : filteredPteroServers.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-neutral-850 rounded-xl bg-neutral-950/35">
                          <p className="text-xs text-neutral-400 font-medium">Tidak ditemukan hasil pencarian</p>
                          <p className="text-[10px] text-neutral-500 max-w-sm">Tidak ada server yang cocok dengan kata kunci <code className="text-cyan-400">"{pteroSearchQuery}"</code>.</p>
                          <button
                            onClick={() => setPteroSearchQuery("")}
                            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                          >
                            Hapus Kata Kunci
                          </button>
                        </div>
                      ) : (() => {
                        const groupedServers = filteredPteroServers.reduce((acc, server) => {
                          const node = server.node || "Unlabeled Node";
                          if (!acc[node]) {
                            acc[node] = [];
                          }
                          acc[node].push(server);
                          return acc;
                        }, {} as Record<string, PterodactylServer[]>);

                        const nodeKeys = Object.keys(groupedServers).sort();

                        return (
                          <div className="space-y-6">
                            {nodeKeys.map((nodeKey) => {
                              const serversInNode = groupedServers[nodeKey];
                              const isCollapsed = collapsedNodes[nodeKey] === true;

                              return (
                                <div key={nodeKey} className="space-y-3">
                                  {/* Collapsible Group Header */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCollapsedNodes(prev => ({
                                        ...prev,
                                        [nodeKey]: !isCollapsed
                                      }));
                                    }}
                                    className="w-full flex items-center justify-between bg-neutral-950/40 hover:bg-neutral-950/70 border border-neutral-850/60 hover:border-neutral-800/80 p-3 rounded-xl transition duration-150 text-left cursor-pointer group select-none"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition">
                                        {isCollapsed ? (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono tracking-wider">NODE LABEL:</span>
                                        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/20 border border-purple-500/20 px-2 py-0.5 rounded">
                                          {nodeKey}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-mono text-neutral-500 uppercase">JUMLAH SERVER:</span>
                                      <span className="text-[10px] font-mono font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
                                        {serversInNode.length} Server
                                      </span>
                                    </div>
                                  </button>

                                  {/* Collapsible Server Grid */}
                                  <AnimatePresence initial={false}>
                                    {!isCollapsed && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                          <AnimatePresence mode="popLayout">
                                            {serversInNode.map((server) => {
                                              const cpuPercent = server.cpuLimit > 0 ? Math.min(100, (server.currentCpu / server.cpuLimit) * 100) : server.currentCpu;
                                              const ramPercent = server.memoryLimit > 0 ? Math.min(100, (server.currentMemory / server.memoryLimit) * 100) : 0;
                                              const diskPercent = server.diskLimit > 0 ? Math.min(100, (server.currentDisk / server.diskLimit) * 100) : 0;

                                              let statusColor = "bg-rose-950/40 border-rose-500/30 text-rose-400";
                                              if (server.status === "running") statusColor = "bg-emerald-950/40 border-emerald-500/30 text-emerald-400";
                                              if (server.status === "starting") statusColor = "bg-amber-950/40 border-amber-500/30 text-amber-400";
                                              if (server.status === "stopping") statusColor = "bg-blue-950/40 border-blue-500/30 text-blue-400";

                                              return (
                                                <motion.div
                                                  layout
                                                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                                  exit={{ opacity: 0, scale: 0.95, y: -12 }}
                                                  transition={{ duration: 0.22, ease: "easeOut" }}
                                                  key={server.id}
                                                  className="bg-neutral-950/70 border border-neutral-850/70 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between group"
                                                >
                                                  {/* Status Badge */}
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div className="space-y-0.5">
                                                      <h5 className="text-xs font-bold text-neutral-100 font-mono tracking-wide flex items-center gap-1.5">
                                                        {server.name}
                                                      </h5>
                                                      <p className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5">
                                                        <span>ID: <code className="text-cyan-400">{server.id}</code></span>
                                                        <span>•</span>
                                                        <span>Node: <code className="text-purple-400">{server.node}</code></span>
                                                      </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded uppercase ${statusColor}`}>
                                                        {server.status}
                                                      </span>
                                                      <button
                                                        onClick={() => handleDeletePteroServer(server.id)}
                                                        className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-500 hover:text-rose-400 hover:border-rose-900/30 hover:bg-rose-950/20 transition cursor-pointer"
                                                        title="Hapus panel ini dari dashboard"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {server.description && (
                                                    <p className="text-[10.5px] text-neutral-400 italic mb-3 leading-relaxed truncate max-w-sm">
                                                      "{server.description}"
                                                    </p>
                                                  )}

                                                  {/* Metrics Bar list */}
                                                  <div className="space-y-2.5 pt-1.5 border-t border-neutral-900/60">
                                                    {/* CPU Load bar */}
                                                    <div className="space-y-1">
                                                      <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-neutral-400">CPU LOAD</span>
                                                        <span className="text-neutral-200 font-semibold">
                                                          {server.currentCpu}% / {server.cpuLimit > 0 ? `${server.cpuLimit}%` : "Unlimited"}
                                                        </span>
                                                      </div>
                                                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                          className={`h-full rounded-full transition-all duration-700 ${
                                                            cpuPercent > 80 ? "bg-rose-500" : cpuPercent > 50 ? "bg-amber-500" : "bg-cyan-500"
                                                          }`} 
                                                          style={{ width: `${Math.max(2, cpuPercent)}%` }}
                                                        />
                                                      </div>
                                                    </div>

                                                    {/* RAM Memory usage bar */}
                                                    <div className="space-y-1">
                                                      <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-neutral-400">MEMORY (RAM)</span>
                                                        <span className="text-neutral-200 font-semibold">
                                                          {server.currentMemory} MB / {server.memoryLimit > 0 ? `${server.memoryLimit} MB` : "Unlimited"}
                                                        </span>
                                                      </div>
                                                      <div className="w-full bg-[#0a0a0f] h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                          className={`h-full rounded-full transition-all duration-700 ${
                                                            ramPercent > 85 ? "bg-purple-500" : ramPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                                                          }`} 
                                                          style={{ width: `${Math.max(2, ramPercent)}%` }}
                                                        />
                                                      </div>
                                                    </div>

                                                    {/* Disk Storage usage bar */}
                                                    <div className="space-y-1">
                                                      <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-neutral-400">DISK STORAGE</span>
                                                        <span className="text-neutral-200 font-semibold">
                                                          {server.currentDisk >= 1024 ? `${(server.currentDisk / 1024).toFixed(1)} GB` : `${server.currentDisk} MB`} / {server.diskLimit >= 1024 ? `${(server.diskLimit / 1024).toFixed(0)} GB` : `${server.diskLimit} MB`}
                                                        </span>
                                                      </div>
                                                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                          className={`h-full rounded-full transition-all duration-700 ${
                                                            diskPercent > 85 ? "bg-orange-500" : diskPercent > 60 ? "bg-amber-500" : "bg-blue-500"
                                                          }`} 
                                                          style={{ width: `${Math.max(2, diskPercent)}%` }}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono mt-3.5 pt-2 border-t border-neutral-900/40">
                                                    <span>SINKRON_TIMESTAMP</span>
                                                    <span>{server.lastScanned || "Offline"}</span>
                                                  </div>
                                                </motion.div>
                                              );
                                            })}
                                          </AnimatePresence>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {deletedPteroServerIds.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleResetDeletedPteroServers}
                      className="text-[10px] text-neutral-500 hover:text-cyan-400 font-mono flex items-center gap-1 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-xl cursor-pointer"
                    >
                      ↻ Reset/Kembalikan Panel Terhapus ({deletedPteroServerIds.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Info Banner box */}
              <div className="p-4 bg-[#08080d]/90 border border-neutral-850 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 text-cyan-400">
                <HelpCircle className="w-8 h-8 shrink-0 text-cyan-400" />
                <div className="text-xs space-y-1 text-neutral-300">
                  <p className="font-semibold text-cyan-200">Mulai Monitor VPS Anda di Panel Pterodactyl Anda Sekarang!</p>
                  <p className="leading-relaxed">
                    Sistem ini terintegrasi penuh. Salin kode Node.js yang sudah terpasang token Telegram di tab <strong>"Script Pterodactyl Node.js"</strong>, pasang di server Anda untuk menerima notifikasi performa, overload, & dapatkan respon bot interaktif real-time.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "telegram" && adminSessionActive && (
            <motion.div
              key="telegram"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form Config (Columns 1-2) */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-100">Konfigurasi Akses Bot Telegram</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Atur token bot dan ID Chat Anda untuk mengirimkan alert performa server lokal & menerima remote command.
                  </p>
                </div>

                <form onSubmit={saveConfig} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-mono block">TELEGRAM BOT TOKEN</label>
                      <input 
                        type="password"
                        name="token"
                        value={config.token}
                        onChange={handleConfigChange}
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-emerald-300 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Dapatkan token ini dari chat ke <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">@BotFather</a> di Telegram.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-mono block">TELEGRAM CHAT ID</label>
                      <input 
                        type="text"
                        name="chatId"
                        value={config.chatId}
                        onChange={handleConfigChange}
                        placeholder="-100123456789 atau 12345678"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-neutral-300 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Chat ID akun Telegram atau Grup. Bisa dicari dengan berkirim pesan ke <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">@userinfobot</a>.
                      </p>
                    </div>

                  </div>

                  {/* Warning limits */}
                  <div className="border-t border-neutral-850 pt-5 mt-3 space-y-4">
                    <h4 className="text-sm font-semibold text-neutral-200">Alert Threshold Limits (Batas Peringatan %)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS CPU OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertCpuThreshold"
                            min="20"
                            max="100"
                            value={config.alertCpuThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS RAM OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertRamThreshold"
                            min="20"
                            max="100"
                            value={config.alertRamThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS DISK OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertDiskThreshold"
                            min="20"
                            max="100"
                            value={config.alertDiskThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-1.5 max-w-xs pt-2">
                      <label className="text-xs text-neutral-400 block font-mono">JEDA WAKTU ANTAR ALARM</label>
                      <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
                        <input 
                          type="number" 
                          name="alertIntervalMinutes"
                          min="1"
                          max="180"
                          value={config.alertIntervalMinutes}
                          onChange={handleConfigChange}
                          className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                        />
                        <span className="text-neutral-400 text-xs font-sans whitespace-nowrap">menit</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Mencegah spam bot Telegram. Alarm serupa tidak akan dikirim ulang sebelum rentang menit ini berlalu.
                      </p>
                    </div>
                  </div>

                  {/* Enable Switch toggle */}
                  <div className="flex items-center justify-between border-t border-neutral-850 pt-5">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-neutral-200 block">Jalankan di Server Sandbox</label>
                      <p className="text-[11px] text-neutral-400 leading-relaxed max-w-sm md:max-w-md">
                        Aktifkan jika ingin bot Telegram langsung aktif berjalan di server panel web ini untuk uji coba. Jika dimatikan, Anda hanya menggunakan bot pada Server Pterodactyl Anda sendiri.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="isActive"
                        checked={config.isActive}
                        onChange={handleConfigChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-neutral-950"></div>
                    </label>
                  </div>

                  {/* SMART CLEANUP DAEMON CONFIGURATION SECTION */}
                  <div className="border-t border-neutral-850 pt-5 space-y-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300">⚙️ Konfigurasi Smart Cleanup Otomatis</h4>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Atur aturan pembersih pintar untuk disk. Menghapus data sampah secara otomatis dari direktori <code className="text-amber-500 font-mono">/cache</code> dan <code className="text-amber-500 font-mono">/tmp</code> ketika disk penuh dalam kondisi kritis.
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-[#08080c]/30 border border-neutral-850 p-4 rounded-xl">
                      <div className="space-y-0.5 pr-4">
                        <label className="text-xs font-bold text-neutral-200 block font-mono">AKTIFKAN AUTO-CLEANUP PINTAR (100% SUCCESS)</label>
                        <p className="text-[10px] text-neutral-450 leading-relaxed max-w-sm md:max-w-md">
                          Bila diaktifkan, jika penyimpanan melebihi batas terus menerus selama lebih dari batas waktu jam yang ditentukan, daemon SSH akan menghapus/mengosongkan folder sampah guna membebaskan status disk 100% otomatis.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          name="smartCleanupEnabled"
                          checked={config.smartCleanupEnabled !== false}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              smartCleanupEnabled: e.target.checked
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-neutral-950"></div>
                      </label>
                    </div>

                    {config.smartCleanupEnabled !== false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#08080c]/50 border border-neutral-850 p-4 rounded-xl">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-neutral-400 block font-mono">BATAS DISK KRITIS (TRIGGER LIMIT)</label>
                          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                            <input 
                              type="number" 
                              name="smartCleanupThreshold"
                              min="50"
                              max="99"
                              value={config.smartCleanupThreshold ?? 90}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  smartCleanupThreshold: Number(e.target.value) || 90
                                }));
                              }}
                              className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm text-neutral-200"
                            />
                            <span className="text-neutral-500 text-sm font-mono">%</span>
                          </div>
                          <p className="text-[9px] text-neutral-550">Mulai hitung mundur pembersihan otomatis saat penggunaan disk menyentuh angka ini.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] text-neutral-400 block font-mono">BATAS WAKTU KRITIS DIATAS BATAS TRIGGER</label>
                          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                            <input 
                              type="number" 
                              name="smartCleanupDurationHours"
                              min="1"
                              max="24"
                              value={config.smartCleanupDurationHours ?? 1}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  smartCleanupDurationHours: Number(e.target.value) || 1
                                }));
                              }}
                              className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm text-neutral-200"
                            />
                            <span className="text-neutral-500 text-sm font-mono">Jam</span>
                          </div>
                          <p className="text-[9px] text-neutral-550">Berapa jam disk berada di atas batas kritis hingga proses pembersihan otomatis dimulai.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PTERODACTYL PANEL API INTEGRATION CONFIGURATION */}
                  <div className="border-t border-neutral-850 pt-5 space-y-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300">🎮 Integrasi API Panel Pterodactyl</h4>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Hubungkan dasbor ini dengan panel Pterodactyl Anda untuk memantau penggunaan resource kontainer secara real-time. Anda juga dapat mengonfigurasi ini secara manual melalui file <code className="text-amber-500 font-mono">config.js</code> di VPS Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* PANEL 1 */}
                      <div className="space-y-4 bg-[#08080c]/50 border border-neutral-850 p-4 rounded-xl">
                        <div className="flex items-center gap-2 border-b border-neutral-850 pb-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                          <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono tracking-wider">PANEL PTERODACTYL #1</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-350 block font-mono">DOMAIN PANEL #1</label>
                          <input 
                            type="text" 
                            name="domain"
                            placeholder="Contoh: https://panel.kamu.com"
                            value={config.domain || ""}
                            onChange={(e) => {
                              setConfig(prev => ({
                                ...prev,
                                domain: e.target.value
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                          />
                          <p className="text-[9px] text-neutral-500">Alamat lengkap panel Pterodactyl hosting pertama Anda.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-450 block font-mono">APPLICATION API KEY (ADMIN) #1</label>
                            <input 
                              type="password" 
                              name="ptla"
                              placeholder="ptla_..."
                              value={config.ptla || ""}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  ptla: e.target.value
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <p className="text-[8px] text-neutral-550">Dari Admin Area &gt; Application API Keys.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-450 block font-mono">CLIENT API KEY (USER) #1</label>
                            <input 
                              type="password" 
                              name="ptlc"
                              placeholder="ptlc_..."
                              value={config.ptlc || ""}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  ptlc: e.target.value
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <p className="text-[8px] text-neutral-550">Dari Profile Settings &gt; API Keys.</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-450 block font-mono">INTERVAL SCAN API #1 (MENIT)</label>
                          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 max-w-[150px]">
                            <input 
                              type="number" 
                              name="scanInterval"
                              min="1"
                              max="60"
                              value={config.scanInterval ?? 5}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  scanInterval: Number(e.target.value) || 5
                                }));
                              }}
                              className="w-full bg-transparent border-0 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <span className="text-neutral-500 text-xs font-mono">Min</span>
                          </div>
                          <p className="text-[9px] text-neutral-500">Frekuensi sinkronisasi resource panel pertama.</p>
                        </div>
                      </div>

                      {/* PANEL 2 */}
                      <div className="space-y-4 bg-[#08080c]/50 border border-neutral-850 p-4 rounded-xl">
                        <div className="flex items-center gap-2 border-b border-neutral-850 pb-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                          <span className="text-[10px] font-bold text-purple-400 uppercase font-mono tracking-wider">PANEL PTERODACTYL #2</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-neutral-350 block font-mono">DOMAIN PANEL #2</label>
                          <input 
                            type="text" 
                            name="domain2"
                            placeholder="Contoh: https://panel2.kamu.com"
                            value={config.domain2 || ""}
                            onChange={(e) => {
                              setConfig(prev => ({
                                ...prev,
                                domain2: e.target.value
                              }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                          />
                          <p className="text-[9px] text-neutral-500">Alamat lengkap panel Pterodactyl hosting kedua Anda.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-450 block font-mono">APPLICATION API KEY (ADMIN) #2</label>
                            <input 
                              type="password" 
                              name="ptla2"
                              placeholder="ptla_..."
                              value={config.ptla2 || ""}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  ptla2: e.target.value
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <p className="text-[8px] text-neutral-550">Dari Admin Area &gt; Application API Keys.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-450 block font-mono">CLIENT API KEY (USER) #2</label>
                            <input 
                              type="password" 
                              name="ptlc2"
                              placeholder="ptlc_..."
                              value={config.ptlc2 || ""}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  ptlc2: e.target.value
                                }));
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <p className="text-[8px] text-neutral-550">Dari Profile Settings &gt; API Keys.</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-450 block font-mono">INTERVAL SCAN API #2 (MENIT)</label>
                          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 max-w-[150px]">
                            <input 
                              type="number" 
                              name="scanInterval2"
                              min="1"
                              max="60"
                              value={config.scanInterval2 ?? 5}
                              onChange={(e) => {
                                setConfig(prev => ({
                                  ...prev,
                                  scanInterval2: Number(e.target.value) || 5
                                }));
                              }}
                              className="w-full bg-transparent border-0 focus:outline-none font-mono text-xs text-neutral-200"
                            />
                            <span className="text-neutral-500 text-xs font-mono">Min</span>
                          </div>
                          <p className="text-[9px] text-neutral-550">Frekuensi sinkronisasi resource panel kedua.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-end gap-3 border-t border-neutral-850 pt-5 flex-wrap">
                    <button
                      type="button"
                      disabled={testSending || !config.token || !config.chatId}
                      onClick={sendTestAlert}
                      className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 font-medium text-xs rounded-xl flex items-center gap-2 group transition-all text-neutral-300 disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${testSending ? 'animate-bounce' : ''}`} />
                      {testSending ? "Mengirim Tes..." : "Tes Kirim Pesan"}
                    </button>
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                    >
                      {savingConfig && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Simpan & Aktifkan Bot
                    </button>
                  </div>
                </form>

                {statusMsg && (
                  <div className={`p-4 rounded-xl flex items-start gap-2 text-xs leading-normal animate-pulse border ${
                    statusMsg.type === "success" 
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-950/20 border-red-500/20 text-red-400'
                  }`}>
                    {statusMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Simulated Telegram Chat Box (Option 1 - Interactive Buttons) */}
              <div id="simulated-telegram-chat-panel" className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-4 lg:col-span-2">
                <div className="border-b border-neutral-850 pb-4">
                  <h4 className="text-md font-semibold text-neutral-100 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                    🤖 Simulator Telegram Client (Uji Coba Hubungan & Reply Buttons)
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Uji coba respons commands dan visualisasi format tombol reply keyboard instan bot langsung dari halaman peninjau ini.
                  </p>
                </div>

                <div className="bg-[#17212b] border border-neutral-850 rounded-xl h-80 flex flex-col justify-between overflow-hidden shadow-inner">
                  {/* Header bar simulated */}
                  <div className="bg-[#1f2c3a] px-4 py-3 flex items-center justify-between border-b border-neutral-950/40 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-mono text-xs font-bold text-neutral-950">
                        VB
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-cyan-350 block">Pterodactyl Monitor Bot</span>
                        <span className="text-[9.5px] text-emerald-400/95 font-medium">bot aktif • sandbox mode</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-450 bg-neutral-950/40 px-2 py-0.5 rounded font-mono font-medium">
                      TELEGRAM SIMULATOR
                    </div>
                  </div>

                  {/* Speech bubble logs */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans scroll-smooth scrollbar-thin scrollbar-thumb-[#24313f] scrollbar-track-[#17212b] flex flex-col">
                    {chatMessages.map((msg, index) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div 
                          key={index} 
                          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs relative ${
                              isUser 
                                ? 'bg-[#2b5278] text-neutral-100 rounded-tr-none' 
                                : 'bg-[#182533] text-neutral-200 border border-neutral-800/40 rounded-tl-none font-mono text-[11px]'
                            }`}
                          >
                            <pre className="whitespace-pre-wrap font-sans leading-relaxed break-all">{msg.text}</pre>
                            <span className="text-[9px] text-neutral-450 block text-right mt-1 font-mono">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Telegram Reply Keyboard (Option 1 focus) */}
                  <div className="bg-[#1f2c3a] border-t border-neutral-950/40 p-2.5 space-y-2 select-none">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9.5px] text-cyan-400 font-mono font-medium tracking-wide">
                        ⌨️ TELEGRAM REPLY KEYBOARD:
                      </span>
                      <span className="text-[9px] text-neutral-450 font-sans font-medium">Klik tombol untuk kirim otomatis</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/status")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        📊 /status
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/ping")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        ⏱️ /ping
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/cpu")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        🖥️ /cpu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/ram")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        📟 /ram
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/disk")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        💾 /disk
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/remote")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        🌍 /remote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSimulatedChat("/help")}
                        className="py-1 bg-[#17212b] hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-[10.5px] text-neutral-200 hover:text-white transition cursor-pointer font-medium font-mono text-center flex items-center justify-center gap-1 shadow-sm col-span-3"
                      >
                        ℹ️ /help (Bantuan Bot)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manual typing chat box input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendSimulatedChat(chatInput);
                  }}
                  className="flex gap-2"
                >
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Masukkan perintah manual (contoh: /help atau /ping)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-250 focus:border-cyan-500 focus:outline-none placeholder-neutral-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition select-none cursor-pointer"
                  >
                    Kirim
                  </button>
                </form>
              </div>

              {/* Bot status guide (Column 3) */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 h-fit space-y-6">
                {/* ADMIN PASSWORD CHANGE CARD */}
                <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3.5 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2 text-rose-450 border-b border-neutral-900 pb-2">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <h5 className="text-xs font-bold uppercase tracking-wider font-mono">Keamanan Password Admin</h5>
                  </div>
                  
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Ganti kata sandi administrator untuk mengunci akses halaman-halaman sensitif. Kata sandi tersimpan pada browser Anda.
                  </p>

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-neutral-400 font-mono uppercase font-bold">PASSWORD BARU</label>
                      <input
                        type="password"
                        required
                        placeholder="Ketik password baru..."
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500/50 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none transition font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] text-neutral-400 font-mono uppercase font-bold">KONFIRMASI PASSWORD</label>
                      <input
                        type="password"
                        required
                        placeholder="Ulangi password baru..."
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500/50 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none transition font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-rose-950/20 border border-rose-500/35 hover:border-rose-450 hover:bg-rose-950/40 text-[10px] font-mono text-rose-400 rounded-lg transition cursor-pointer font-bold uppercase text-center flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3 h-3" />
                      SIMPAN PASSWORD BARU
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider font-mono">STATUS BOT PROGRAM</h4>
                  
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${
                        config.isActive && config.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"
                      }`} />
                      <span className="font-mono text-sm text-neutral-200">
                        {config.isActive ? config.status : "Mati/Offline"}
                      </span>
                    </div>

                    {config.isActive && (
                      <button
                        onClick={handleRestartBot}
                        disabled={isRestarting}
                        className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRestarting ? 'animate-spin' : ''}`} />
                        {isRestarting ? "Restarting..." : "Reboot Koneksi"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-neutral-300 border-t border-neutral-850 pt-4">
                  <h5 className="font-semibold text-neutral-100 font-sans flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Perintah Bot Interaktif:
                  </h5>
                  <p>Saat bot Telegram Anda aktif, Anda dapat mengirim pesan/command ke bot tersebut dari aplikasi Telegram Anda:</p>
                  
                  <ul className="space-y-2 border-l border-neutral-800 lg:pl-3 ml-1 font-mono text-[11px] text-neutral-400">
                    <li><strong className="text-neutral-200">/status</strong> - Mengirim grafik performa CPU, RAM dan Disk terkini.</li>
                    <li><strong className="text-neutral-200">/cpu</strong> - Info clockspeed processor dan core load.</li>
                    <li><strong className="text-neutral-200">/ram</strong> - Info total RAM, free memory, dan bytes size.</li>
                    <li><strong className="text-neutral-200">/disk</strong> - Rincian free spaces dan total partition size.</li>
                    <li><strong className="text-neutral-200">/remote</strong> - Daftar server remote yang online.</li>
                    <li><strong className="text-neutral-200">/ping</strong> - Mengetes latency respons server Anda.</li>
                  </ul>
                </div>

                {/* ADVANCED TROUBLESHOOTING GUIDE TO EXPLAIN UNRESPONSIVENESS */}
                <div className="space-y-4 text-xs leading-relaxed border-t border-neutral-850 pt-4">
                  <h5 className="font-semibold text-amber-400 font-sans flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Kenapa Bot Kurang Respon?
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                      <span className="text-neutral-200 font-semibold block text-[11px]">1. Modus Sandbox / Cloud Run Sleep</span>
                      <p className="text-neutral-400 text-[10px] leading-relaxed">
                        Server preview ini berjalan di hosting Cloud Run. Jika Anda menutup tab dashboard ini, server akan memasuki mode <strong>"Tidur / Suspended"</strong> untuk menghemat resource. Saat tidur, bot tidak akan merespon chat Telegram Anda. 
                      </p>
                      <p className="text-emerald-400 text-[10px] leading-relaxed font-sans">
                        👉 <strong>Solusi:</strong> Biarkan tab dashboard web ini tetap terbuka agar bot terus aktif, atau pasang script telemetri di VPS Anda sendiri (tab sebelah) yang menyala 24 jam!
                      </p>
                    </div>

                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                      <span className="text-neutral-200 font-semibold block text-[11px]">2. Bentrok Polling (Conflict 409)</span>
                      <p className="text-neutral-400 text-[10px] leading-relaxed">
                        Telegram melarang keras satu Token Bot dijalankan di dua server berbeda secara bersamaan. Jika Anda meluncurkan script monitor di VPS atau panel lokal, pastikan Anda mematikan fitur "Jalankan di Server Sandbox" di atas.
                      </p>
                      <p className="text-emerald-400 text-[10px] leading-relaxed">
                        👉 <strong>Solusi:</strong> Nonaktifkan toggle hijau di atas bila bot sudah dipasang langsung di server Pterodactyl Anda.
                      </p>
                    </div>

                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
                      <span className="text-neutral-200 font-semibold block text-[11px]">3. Aturan Grup Telegram (Privacy Mode)</span>
                      <p className="text-neutral-400 text-[10px] leading-relaxed">
                        Jika Anda memasukkan bot ke dalam suatu grup Telegram tapi bot mendadak tidak membalas /status Anda, itu karena proteksi privasi Telegram.
                      </p>
                      <p className="text-emerald-400 text-[10px] leading-relaxed">
                        👉 <strong>Solusi:</strong> Chat ke <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-500 underline">@BotFather</a> → ketik <code>/mybots</code> → pilih bot Anda → <code>Bot Settings</code> → <code>Group Privacy</code> → Matikan (Turn Off).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1.5 text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Catatan Penting
                  </span>
                  <p className="text-neutral-400 leading-normal">
                    Gunakan tombol <strong>"Reboot Koneksi"</strong> di atas jika koneksi Telegram bot Anda di server web ini mendadak terputus atau terasa melambat.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "bandwidth" && adminSessionActive && (
            <motion.div
              key="bandwidth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Network Bandwidth Status Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration form card */}
                <div className="lg:col-span-1 bg-[#09090e]/80 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500/40 rounded-bl"></div>
                  <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-neutral-900 pb-2.5">
                    <Settings className="w-4 h-4 text-amber-500" />
                    LIMIT ALARM BANDWIDTH
                  </h3>

                  <form onSubmit={handleSaveBandwidthConfig} className="space-y-4">
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      Atur sensitivitas ambang alarm paket masuk dan keluar untuk menghindari VPS Anda dari penyalahgunaan trafik berlebih (seperti spamming, flood, atau kebocoran data).
                    </p>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase font-bold mb-1.5">
                        AMBANG BATAS ALARM RX (INCOMING)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max="1000"
                          value={bandwidthConfig.alertNetRxThreshold}
                          onChange={(e) => setBandwidthConfig({ ...bandwidthConfig, alertNetRxThreshold: Number(e.target.value) })}
                          className="w-full bg-black/60 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                        />
                        <span className="absolute right-3.5 top-2 text-[10px] font-mono text-neutral-500">MB/s</span>
                      </div>
                      <p className="text-[9px] text-neutral-500 mt-1">Bot akan mengirim alarm bila bandwidth masuk melebihi angka ini.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase font-bold mb-1.5">
                        AMBANG BATAS ALARM TX (OUTBOUND)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max="1000"
                          value={bandwidthConfig.alertNetTxThreshold}
                          onChange={(e) => setBandwidthConfig({ ...bandwidthConfig, alertNetTxThreshold: Number(e.target.value) })}
                          className="w-full bg-black/60 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                        />
                        <span className="absolute right-3.5 top-2 text-[10px] font-mono text-neutral-500">MB/s</span>
                      </div>
                      <p className="text-[9px] text-neutral-500 mt-1">Bot akan mengirim alarm bila bandwidth keluar melebihi angka ini.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingBandwidthConfig}
                      className="w-full py-2.5 px-4 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/35 hover:border-amber-400 text-xs font-display text-amber-400 hover:text-white rounded-xl transition cursor-pointer font-bold uppercase text-center mt-2 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                    >
                      {savingBandwidthConfig ? "MENYIMPAN..." : "SIMPAN AMBANG BATAS"}
                    </button>
                  </form>

                  {/* Network Diagnostics */}
                  <div className="mt-6 pt-5 border-t border-neutral-900 space-y-3">
                    <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      DIAGNOSTIK INTERFACE NET
                    </h4>
                    <div className="bg-black/40 p-3 rounded-lg border border-neutral-900 text-[10px] font-mono space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">PROCFS DEV PATH:</span>
                        <span className="text-emerald-400">/proc/net/dev (OK)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">INTERFACE UTAMA:</span>
                        <span className="text-neutral-200">eth0 / docker0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">TELEGRAM HOOK:</span>
                        <span className={config.isActive ? "text-emerald-400" : "text-amber-500"}>
                          {config.isActive ? "TERHUBUNG (OK)" : "INAKTIF"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main section: stats and simulation config */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Realtime Speedometers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    
                    {/* INBOUND RX */}
                    <div className="bg-[#0b0b10] border border-neutral-850 rounded-xl p-4.5 relative overflow-hidden">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> INCOMING SPEED (RX)
                      </p>
                      <h3 className="text-2xl font-extrabold mt-1 text-cyan-400 font-mono tracking-tight">
                        {stats?.network ? formatBandwidthSpeed(stats.network.rxSpeed) : "0.00 KB/s"}
                      </h3>
                      <div className="text-[10px] text-neutral-405 font-mono mt-2 uppercase flex justify-between items-center">
                        <span>Limit: {bandwidthConfig.alertNetRxThreshold} MB/s</span>
                        <span className="text-neutral-550">{(stats?.network?.rxPacketsSpeed || 0).toLocaleString()} pps</span>
                      </div>
                    </div>

                    {/* OUTBOUND TX */}
                    <div className="bg-[#0b0b10] border border-neutral-850 rounded-xl p-4.5 relative overflow-hidden">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span> OUTGOING SPEED (TX)
                      </p>
                      <h3 className="text-2xl font-extrabold mt-1 text-violet-400 font-mono tracking-tight">
                        {stats?.network ? formatBandwidthSpeed(stats.network.txSpeed) : "0.00 KB/s"}
                      </h3>
                      <div className="text-[10px] text-neutral-405 font-mono mt-2 uppercase flex justify-between items-center">
                        <span>Limit: {bandwidthConfig.alertNetTxThreshold} MB/s</span>
                        <span className="text-neutral-550">{(stats?.network?.txPacketsSpeed || 0).toLocaleString()} pps</span>
                      </div>
                    </div>

                    {/* TOTAL TRAFFIC BYTES STATE */}
                    <div className="bg-[#0b0b10] border border-neutral-850 rounded-xl p-4.5 relative overflow-hidden">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold">TOTAL DATA TRANSFER</p>
                      <h3 className="text-2xl font-sans font-extrabold mt-1 text-amber-400">
                        {(() => {
                          const totalRx = stats?.network?.totalRxBytes || 0;
                          const totalTx = stats?.network?.totalTxBytes || 0;
                          const sumGb = (totalRx + totalTx) / 1024 / 1024 / 1024;
                          return sumGb > 0.05 ? `${sumGb.toFixed(2)} GB` : "0.00 GB";
                        })()}
                      </h3>
                      <div className="text-[10px] text-neutral-400 font-mono mt-2 uppercase flex justify-between">
                        <span>RX: {stats?.network ? (stats.network.totalRxBytes / 1024 / 1024).toFixed(0) : 0} MB</span>
                        <span>TX: {stats?.network ? (stats.network.totalTxBytes / 1024 / 1024).toFixed(0) : 0} MB</span>
                      </div>
                    </div>

                  </div>

                  {/* Network Trafik RX/TX Area Chart */}
                  <div className="bg-[#09090e]/80 border border-neutral-850 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          HISTORI & TREN VOLATILITAS TRAFIK (RX / TX)
                        </h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Visualisasi tren penggunaan bandwidth masuk (RX) dan keluar (TX) untuk mendeteksi anomali / lonjakan transfer data.</p>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-400 px-2.5 py-0.5 rounded uppercase font-bold animate-pulse">
                        LIVE TRENDING
                      </span>
                    </div>

                    <div className="h-[220px] w-full mt-2 select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={bandwidthHistory}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" opacity={0.6} />
                          <XAxis 
                            dataKey="time" 
                            stroke="#52525b" 
                            fontSize={9} 
                            tickLine={false} 
                            fontFamily="monospace"
                          />
                          <YAxis 
                            stroke="#52525b" 
                            fontSize={9} 
                            tickLine={false} 
                            fontFamily="monospace"
                            unit=" MB/s"
                          />
                          <RechartsTooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[#0b0b14]/95 border border-neutral-800 p-3 rounded-xl font-mono text-[10px] space-y-1.5 shadow-2xl relative z-50">
                                    <p className="text-neutral-400 font-bold border-b border-neutral-850 pb-1 mb-1 flex items-center gap-1.5">
                                      ⏱️ Waktu: <span className="text-neutral-200">{label}</span>
                                    </p>
                                    <p className="text-[#06b6d4] font-bold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]"></span> 
                                      Speed RX (In): {payload[0]?.value?.toFixed(3)} MB/s
                                    </p>
                                    <p className="text-[#8b5cf6] font-bold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></span> 
                                      Speed TX (Out): {payload[1]?.value?.toFixed(3)} MB/s
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={28}
                            content={({ payload }: any) => {
                              return (
                                <div className="flex justify-end gap-6 text-[10px] font-bold font-mono">
                                  <span className="flex items-center gap-1.5 text-[#06b6d4]">
                                    <span className="w-2.5 h-1.5 bg-[#06b6d4] rounded animate-pulse"></span>
                                    INBOUND TRAFFIC (RX)
                                  </span>
                                  <span className="flex items-center gap-1.5 text-[#8b5cf6]">
                                    <span className="w-2.5 h-1.5 bg-[#8b5cf6] rounded animate-pulse"></span>
                                    OUTBOUND TRAFFIC (TX)
                                  </span>
                                </div>
                              );
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="rx" 
                            stroke="#06b6d4" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorRx)" 
                            name="RX Speed"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="tx" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorTx)" 
                            name="TX Speed"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Packet Flood Simulation Panel */}
                  <div className="bg-[#050508]/60 border border-neutral-850 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900 flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider">MOCK PACKET FLOOD SIMULATOR (PENGUJIAN ALARM CAPABILITY)</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Simulasikan banjir paket jaringan masuk (torrent/DDoS) maupun keluar untuk memicu sistem deteksi proteksi & Telegram Alarm.</p>
                      </div>
                      <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 font-mono text-amber-400 px-2 py-0.5 rounded uppercase">
                        Lab Eksperimen
                      </span>
                    </div>

                    {isSimulatingFlood ? (
                      <div className="py-8 text-center bg-red-950/10 border border-red-500/25 rounded-xl space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.06)] animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto stroke-2" />
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">SIMULASI AKTIF: {simulatedFloodType === "rx" ? "TRAFIK RX FLOOD" : "TRAFIK TX UDP FLOOD"}</p>
                          <p className="text-2xl font-black font-sans text-neutral-100">
                            {simCountdown} <span className="text-sm text-neutral-400">Detik Tersisa</span>
                          </p>
                          <p className="text-[10px] text-neutral-400 max-w-sm mx-auto leading-relaxed">
                            Server sedang mengalami lonjakan volume paket tiruan. Perhatikan bot Telegram Anda, alarm otomatis dikirimkan karena batas aman terlampaui!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                          
                          {/* Rx Flood Simulator widget */}
                          <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-900 space-y-3.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-cyan-400 text-[11px] uppercase">📥 RX INCOMING TRAFFIC FLOOD</span>
                              <span className="text-[9px] text-neutral-500">DDoS Simulation</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed min-h-[40px]">
                              Membuat server tiruan kebanjiran trafik download sebesar <span className="text-neutral-300">15 MB/s</span> untuk memastikan notifikasi "Bandwidth Masuk Sangat Tinggi" masuk ke Telegram.
                            </p>
                            <button
                              onClick={() => startPacketFloodSimulation("rx", 15, 15)}
                              className="w-full text-[10px] font-mono font-bold text-center py-2 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:text-white rounded-lg transition uppercase cursor-pointer"
                            >
                              MULAI SIMULASI RX INCOMING (15 MB/s)
                            </button>
                          </div>

                          {/* Tx Flood Simulator widget */}
                          <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-900 space-y-3.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-violet-400 text-[11px] uppercase">📤 TX OUTBOUND ATTACK FLOOD</span>
                              <span className="text-[9px] text-neutral-500">Outbound Spam Simulation</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed min-h-[40px]">
                              Menyimulasikan malware di dalam VPS membombardir trafik keluar sebesar <span className="text-neutral-300">20 MB/s</span> secara destruktif guna memicu penanganan preventif admin.
                            </p>
                            <button
                              onClick={() => startPacketFloodSimulation("tx", 20, 15)}
                              className="w-full text-[10px] font-mono font-bold text-center py-2 bg-violet-950/20 hover:bg-violet-950/40 border border-violet-500/30 text-violet-400 hover:text-white rounded-lg transition uppercase cursor-pointer"
                            >
                              MULAI SIMULASI TX OUTBOUND (20 MB/s)
                            </button>
                          </div>

                        </div>

                        {/* Extra Safety Notice Block */}
                        <div className="bg-[#100c05] border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-[11px] font-bold text-amber-450 uppercase font-mono">Sistem Pencegah Penyalahgunaan Paket</h5>
                            <p className="text-[10px] text-neutral-400 leading-relaxed">
                              Dengan integrasi ini, Anda tidak perlu lagi khawatir VPS mengekspor paket-paket sampah secara tidak terkendali (DDOS outbound malware). Bot Telegram akan langsung memberitahu Anda sebelum bandwidth bulanan VPS habis terkuras.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "ports" && (
            <motion.div
              key="ports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#09090e]/80 border border-cyan-500/30 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(6,182,212,0.05)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-cyan-500 rounded-bl-lg"></div>
                
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-cyan-950/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/35 text-cyan-400 rounded-xl shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      <Globe className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                        Pemonitor Port Dan Layanan VPS
                        <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/20 text-cyan-450 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                          PORT_GATEWAY
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                        Pantau status keaktifan server web, database, SSH, atau port server eksternal milik Anda secara langsung.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckPorts}
                    disabled={checkingPorts}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition select-none cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingPorts ? "animate-spin" : ""}`} /> 
                    {checkingPorts ? "MEMINDAI..." : "PINDAI SEMUA PORT"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left list block */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ports.map((port) => {
                        let statusColor = "border-neutral-800 text-neutral-450 bg-neutral-950/40";
                        let statusText = "⚪ IDLE / READY";
                        if (port.status === "online") {
                          statusColor = "border-emerald-500/30 text-emerald-400 bg-emerald-950/15 shadow-[0_0_12px_rgba(16,185,129,0.03)]";
                          statusText = "🟢 TERKONEKSI (OPEN)";
                        } else if (port.status === "offline") {
                          statusColor = "border-red-500/30 text-red-400 bg-red-950/15 shadow-[0_0_12px_rgba(239,68,68,0.03)]";
                          statusText = "🔴 MATI (CLOSED)";
                        } else if (port.status === "loading") {
                          statusColor = "border-cyan-500/30 text-cyan-400 bg-cyan-950/15 animate-pulse";
                          statusText = "🟡 MEMERIKSA...";
                        }

                        return (
                          <div key={port.id} className="bg-neutral-900 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">{port.type.toUpperCase()} SERVICE</span>
                                <h4 className="text-sm font-bold text-neutral-200">{port.name}</h4>
                                <p className="text-[10px] text-neutral-400 font-mono tracking-wide">{port.host}:{port.port}</p>
                              </div>
                              <button
                                onClick={() => handleDeletePort(port.id)}
                                className="text-neutral-500 hover:text-red-400 p-1 rounded-md transition cursor-pointer"
                                title="Hapus Port"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className={`border p-2.5 rounded-lg text-center font-mono text-[10px] font-bold ${statusColor}`}>
                              {statusText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right form block */}
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">Tambah Port Pemantauan</h4>
                    
                    <form onSubmit={handleAddPort} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Nama Layanan</label>
                        <input
                          type="text"
                          required
                          value={newPortName}
                          onChange={(e) => setNewPortName(e.target.value)}
                          placeholder="Contoh: Webserver Nginx"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/65 font-medium transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Alamat DNS/Host/IP</label>
                        <input
                          type="text"
                          required
                          value={newPortHost}
                          onChange={(e) => setNewPortHost(e.target.value)}
                          placeholder="localhost atau 127.0.0.1"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/65 font-mono transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-neutral-400 font-medium">Nomor Port</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="65535"
                            value={newPortNum}
                            onChange={(e) => setNewPortNum(Number(e.target.value))}
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/65 font-mono transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-neutral-400 font-medium">Kategori</label>
                          <select
                            value={newPortType}
                            onChange={(e) => setNewPortType(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 border-neutral-850 rounded-lg focus:outline-none focus:border-cyan-500/65 transition"
                          >
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                            <option value="db">DATABASE</option>
                            <option value="ssh">SSH</option>
                            <option value="custom">CUSTOM</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-neutral-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20 hover:text-white font-bold rounded-xl transition uppercase tracking-wider font-mono shadow-[0_0_10px_rgba(6,182,212,0.02)] cursor-pointer"
                      >
                        + TAMBAHKAN KE LIST
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "terminal" && adminSessionActive && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#09090e]/80 border border-emerald-500/30 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-bl-lg"></div>

                <div className="flex justify-between items-center border-b border-neutral-850 pb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/35 text-emerald-400 rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <Terminal className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                        Pintasan Konsol SSH Diagnosa Server
                        <span className="text-[9px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-450 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                          SHELL_CONSOLE
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Aktifkan koneksi SSH ke VPS utama Anda untuk mengeksekusi pintasan diagnosa langsung pada server asli Anda, atau jalankan lokal di kontainer panel.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SSH VPS Configuration Form */}
                <div className="bg-black/40 border border-neutral-850 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2 border-b border-neutral-900">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${sshIsActive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-neutral-600 shadow-[0_0_8px_#525252]"}`}></div>
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-200">
                        {sshIsActive ? `KONEKSI AKTIF VPS: ${sshUsername}@${sshHost}:${sshPort}` : "MODE LOKALfallback (CONTAINEr Pterodactyl)"}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={sshIsActive}
                        onChange={(e) => handleSaveSshConfig(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/40 peer-checked:after:bg-emerald-400 font-mono"></div>
                      <span className="text-[10px] font-mono font-medium text-neutral-400 uppercase">Gunakan SSH VPS</span>
                    </label>
                  </div>

                  <form onSubmit={handleTestSshConnection} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-1.5 text-xs font-mono">
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Host IP VPS</label>
                      <input 
                        type="text" 
                        required
                        value={sshHost} 
                        onChange={(e) => setSshHost(e.target.value)} 
                        placeholder="IP Address VPS"
                        className="w-full bg-[#050508] border border-neutral-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-1.5 space-y-1">
                      <label className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Port</label>
                      <input 
                        type="number" 
                        required
                        value={sshPort} 
                        onChange={(e) => setSshPort(Number(e.target.value))} 
                        placeholder="22"
                        className="w-full bg-[#050508] border border-neutral-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Username</label>
                      <input 
                        type="text" 
                        required
                        value={sshUsername} 
                        onChange={(e) => setSshUsername(e.target.value)} 
                        placeholder="root"
                        className="w-full bg-[#050508] border border-neutral-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-3.5 space-y-1">
                      <label className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Password VPS</label>
                      <input 
                        type="password" 
                        value={sshPassword} 
                        onChange={(e) => setSshPassword(e.target.value)} 
                        placeholder="••••••••"
                        className="w-full bg-[#050508] border border-neutral-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 outline-none transition"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSshConfig()}
                        disabled={sshSaving}
                        className="flex-1 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:text-white text-neutral-400 text-[10px] font-bold rounded-xl transition cursor-pointer text-center font-mono"
                      >
                        {sshSaving ? "SAVE..." : "SAVE"}
                      </button>
                      <button
                        type="submit"
                        disabled={sshTesting}
                        className="flex-1 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/35 text-emerald-450 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer text-center font-mono"
                      >
                        {sshTesting ? "WAIT..." : "LOGIN"}
                      </button>
                    </div>

                    <div className="col-span-full">
                      <button
                        type="button"
                        onClick={() => setSshShowPrivateKey(!sshShowPrivateKey)}
                        className="text-[9px] text-neutral-500 hover:text-emerald-450 transition underline underline-offset-2 cursor-pointer font-mono"
                      >
                        {sshShowPrivateKey ? "- Sembunyikan Private Key (.PEM)" : "+ Sembunyikan/Tampilkan Private Key (.PEM - Opsional)"}
                      </button>
                      {sshShowPrivateKey && (
                        <div className="mt-2 space-y-1">
                          <label className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">SSH Private Key (Format PEM)</label>
                          <textarea
                            value={sshPrivateKey}
                            onChange={(e) => setSshPrivateKey(e.target.value)}
                            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
                            rows={3}
                            className="w-full bg-[#050508] border border-neutral-800 focus:border-emerald-500/50 rounded-xl p-3 text-[10px] font-mono text-neutral-200 outline-none transition select-text"
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column: Commands Buttons */}
                  <div className="lg:col-span-1 space-y-3 font-mono text-xs">
                    <p className="text-neutral-500 uppercase tracking-widest font-bold text-[10px]">DIAGNOSTIC SHORTCUTS</p>
                    
                    <button
                      onClick={() => handleRunCommand("cpu-info")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/10 text-neutral-300 transition group flex items-center justify-between cursor-pointer"
                    >
                      <span>🖥️ Cek Spesifikasi CPU</span>
                      <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("ram-usage")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/10 text-neutral-300 transition group flex items-center justify-between cursor-pointer"
                    >
                      <span>🔋 Cek Alokasi Memori</span>
                      <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("disk-usage")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/10 text-neutral-300 transition group flex items-center justify-between cursor-pointer"
                    >
                      <span>💽 Cek Partisi Storage</span>
                      <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("dir-list")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/10 text-neutral-300 transition group flex items-center justify-between cursor-pointer"
                    >
                      <span>📂 Daftar File Directory</span>
                      <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("node-version")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/10 text-neutral-300 transition group flex items-center justify-between cursor-pointer"
                    >
                      <span>📦 Cek Versi Node & NPM</span>
                      <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("docker-ncdu")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/20 text-neutral-200 transition group flex items-center justify-between cursor-pointer font-bold border-emerald-500/15"
                    >
                      <span>📊 run: NCDU /var (Docker List)</span>
                      <Play className="w-3.5 h-3.5 opacity-100 text-emerald-400" />
                    </button>

                    <button
                      onClick={() => handleRunCommand("clear-ram-cache")}
                      disabled={executingCmd}
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-amber-500/30 rounded-xl hover:bg-amber-950/20 text-neutral-200 transition group flex items-center justify-between cursor-pointer font-bold border-amber-500/15 animate-pulse"
                    >
                      <span>⚡ Sapu Cache RAM (drop_caches)</span>
                      <Play className="w-3.5 h-3.5 opacity-100 text-amber-400" />
                    </button>
                  </div>

                  {/* Right Column: Terminal Shell window */}
                  <div className="lg:col-span-3 bg-neutral-950 border border-neutral-850 rounded-2xl overflow-hidden flex flex-col h-[340px] shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                    <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-850 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block animate-pulse"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-500/70 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500/70 inline-block"></span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono tracking-wider font-bold">Secure Local Diagnostic Session Area</span>
                      <span className="w-3 h-3"></span>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-2 leading-relaxed bg-[#020204]">
                      <pre className="whitespace-pre-wrap select-text selection:bg-emerald-950 selection:text-emerald-300">
                        {terminalOutput}
                      </pre>
                      {executingCmd && (
                        <div className="flex items-center gap-2 text-neutral-400 text-[10px] animate-pulse">
                          <span>$ memuat proses diagnostik...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE NCDU VISUAL COMPONENT */}
                <div id="ncdu-visual-panel" className="border-t border-neutral-850 pt-5 mt-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-950/30 border border-emerald-500/25 rounded-lg text-emerald-400">
                      <HardDrive className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                        PEMANTAU & DIAGNOSA NCDU VISUAL INTERAKTIF
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Klik direktori untuk menjelajah (Drill Down) atau gunakan tombol sampah <span className="text-rose-400 font-bold">HAPUS</span> untuk menghapus berkas tidak berguna secara realtime untuk melonggarkan disk node.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#040406] border border-neutral-850 rounded-2xl p-4 md:p-5 space-y-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                    {/* Search Bar Row */}
                    <div className="flex items-center gap-3 bg-[#0a0a0f] border border-neutral-850 px-3.5 py-2.5 rounded-xl">
                      <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Cari berkas atau folder spesifik di seluruh direktori (Contoh: latest_server.log, plugin)..."
                        value={ncduSearchQuery}
                        onChange={(e) => setNcduSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none text-xs text-neutral-200 placeholder-neutral-500 font-mono"
                      />
                      {ncduSearchQuery && (
                        <button
                          onClick={() => setNcduSearchQuery("")}
                          className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-2 py-1 rounded font-mono font-bold hover:bg-neutral-800 transition cursor-pointer shrink-0"
                        >
                          BERSIHKAN
                        </button>
                      )}
                    </div>

                    {/* Breadcrumbs Navigation */}
                    <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0a0a0f] border border-neutral-850 px-4 py-2.5 rounded-xl text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        <span className="text-neutral-500 font-bold uppercase">LOKASI_PATH:</span>
                        <button
                          onClick={() => {
                            setNcduPath([]);
                            setNcduSearchQuery("");
                          }}
                          className="text-emerald-400 hover:underline cursor-pointer font-bold"
                        >
                          root
                        </button>
                        {ncduPath.map((seg, i) => (
                          <React.Fragment key={i}>
                            <span className="text-neutral-600">/</span>
                            <button
                              onClick={() => {
                                setNcduPath(ncduPath.slice(0, i + 1));
                                setNcduSearchQuery("");
                              }}
                              className="text-emerald-450 hover:underline cursor-pointer font-bold"
                            >
                              {seg}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        {ncduPath.length > 0 && (
                          <button
                            onClick={() => {
                              setNcduPath(prev => prev.slice(0, -1));
                              setNcduSearchQuery("");
                            }}
                            className="flex items-center gap-1 text-emerald-450 hover:text-white transition cursor-pointer font-bold"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>KEMBALI_NAIK (..)</span>
                          </button>
                        )}
                        <span className="text-neutral-400 font-mono text-[10px] bg-neutral-900/60 px-2 py-1 rounded border border-neutral-850">
                          TOTAL SIZE: <span className="text-emerald-450 font-bold">{getCurrentNcduNode().sizeMB >= 1024 ? (getCurrentNcduNode().sizeMB / 1024).toFixed(2) + " GB" : getCurrentNcduNode().sizeMB + " MB"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Nodes List */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {ncduSearchQuery.trim() !== "" ? (
                        (() => {
                          const results = getSearchNcduResults(ncduSearchQuery);
                          if (results.length === 0) {
                            return (
                              <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                                🔍 Tidak ditemukan berkas atau folder dengan nama '{ncduSearchQuery}'.
                              </div>
                            );
                          }
                          return results.map((item, index) => {
                            const node = item.node;
                            const isDir = node.type === "dir";
                            const sizeDisplay = node.sizeMB >= 1024 ? (node.sizeMB / 1024).toFixed(2) + " GB" : node.sizeMB + " MB";
                            const fullPathStr = `/${item.fullPath.join("/")}`;

                            return (
                              <div 
                                key={index}
                                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-neutral-900/50 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl transition hover:bg-neutral-950/40"
                              >
                                {/* Left details */}
                                <div className="flex items-center gap-3 min-w-[200px] flex-1">
                                  {isDir ? (
                                    <div className="p-1 px-1.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-mono select-none font-bold shrink-0">
                                      <Folder className="w-3.5 h-3.5 shrink-0 text-emerald-400 inline mr-1" />
                                      <span>DIR</span>
                                    </div>
                                  ) : (
                                    <div className="p-1 px-1.5 bg-neutral-900 border border-neutral-800 text-neutral-450 rounded-lg text-[10px] font-mono select-none font-medium shrink-0">
                                      <File className="w-3.5 h-3.5 shrink-0 text-neutral-500 inline mr-1" />
                                      <span>FILE</span>
                                    </div>
                                  )}

                                  <div className="space-y-1 min-w-0">
                                    <span className="text-xs font-bold font-mono text-emerald-400 block truncate">
                                      {node.name}
                                    </span>
                                    <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5 min-w-0">
                                      <span className="text-neutral-600 font-bold shrink-0">PATH:</span>
                                      <span className="truncate" title={fullPathStr}>{fullPathStr}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-2.5 justify-between md:justify-end shrink-0">
                                  <span className="text-xs font-mono font-bold text-neutral-300 bg-[#0a0a0f] border border-neutral-850 px-2 py-0.5 rounded">
                                    {sizeDisplay}
                                  </span>

                                  <button
                                    onClick={() => {
                                      setNcduPath(isDir ? item.fullPath : item.path);
                                      setNcduSearchQuery(""); 
                                    }}
                                    className="p-1.5 px-2.5 bg-emerald-950/50 border border-emerald-500/25 hover:border-emerald-500 text-emerald-400 hover:text-emerald-350 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
                                    title="Lompat & buka folder lokasi elemen ini berada"
                                  >
                                    <Search className="w-3 h-3 text-emerald-400" />
                                    <span>LOMPAT</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Apakah Anda yakin ingin menghapus '${node.name}' (${sizeDisplay}) secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
                                        handleNcduDelete(node.name, item.path);
                                      }
                                    }}
                                    className="p-1.5 px-2.5 bg-neutral-950 border border-neutral-850 hover:border-rose-500/40 text-neutral-500 hover:text-rose-450 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
                                    title="Hapus secara permanen dari server"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500/70" />
                                    <span>HAPUS</span>
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()
                      ) : (
                        (!getCurrentNcduNode().children || getCurrentNcduNode().children?.length === 0) ? (
                          <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                            📂 Direktori kosong / Tidak ada berkas di dalam folder ini.
                          </div>
                        ) : (
                          getCurrentNcduNode().children?.map((node, index) => {
                            const parentSize = getCurrentNcduNode().sizeMB || 1;
                            const percent = Math.min(100, Math.round((node.sizeMB / parentSize) * 100));
                            const isDir = node.type === "dir";
                            const sizeDisplay = node.sizeMB >= 1024 ? (node.sizeMB / 1024).toFixed(2) + " GB" : node.sizeMB + " MB";

                            return (
                              <div 
                                key={index}
                                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-neutral-900/40 border border-neutral-850/60 rounded-xl hover:border-emerald-500/20 transition hover:bg-neutral-950/40"
                              >
                                {/* Left details */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  {isDir ? (
                                    <button
                                      onClick={() => setNcduPath(prev => [...prev, node.name])}
                                      className="p-1 px-1.5 bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-550 text-emerald-400 rounded-lg group-hover:scale-105 transition flex items-center gap-1 cursor-pointer text-[10px] font-mono select-none font-bold"
                                      title="Klik untuk masuk"
                                    >
                                      <Folder className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                      <span>DIR</span>
                                    </button>
                                  ) : (
                                    <div className="p-1 px-1.5 bg-neutral-900 border border-neutral-800 text-neutral-450 rounded-lg flex items-center gap-1 text-[10px] font-mono select-none font-medium">
                                      <File className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                                      <span>FILE</span>
                                    </div>
                                  )}

                                  <div className="space-y-0.5">
                                    {isDir ? (
                                      <button 
                                        onClick={() => setNcduPath(prev => [...prev, node.name])}
                                        className="text-xs font-bold font-mono text-neutral-200 hover:text-emerald-400 transition hover:underline cursor-pointer text-left focus:outline-none"
                                      >
                                        /{node.name}
                                      </button>
                                    ) : (
                                      <span className="text-xs font-mono font-medium text-neutral-300">
                                        {node.name}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Size bar indicator */}
                                <div className="flex-1 max-w-sm px-2 hidden sm:block">
                                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-1">
                                    <span>Visual Ratio</span>
                                    <span>{percent}% ({sizeDisplay})</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                                    <div 
                                      className="h-full bg-emerald-500/70 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-300" 
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-3.5 justify-between md:justify-end">
                                  <span className="text-xs font-mono font-bold text-neutral-300 shrink-0">
                                    {sizeDisplay}
                                  </span>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Apakah Anda yakin ingin menghapus '${node.name}' (${sizeDisplay}) secara permanen untuk membebaskan penyimpanan server panel Pterodactyl?`)) {
                                        handleNcduDelete(node.name);
                                      }
                                    }}
                                    className="p-1.5 px-3 bg-neutral-950 border border-neutral-850 hover:border-rose-500/40 text-neutral-500 hover:text-rose-450 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
                                    title="Hapus / kosongkan berkas ini"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500/70 group-hover:text-rose-400 transition" />
                                    <span>HAPUS</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}
                    </div>

                    <div className="border-t border-neutral-850 pt-3 text-[9px] font-mono text-neutral-500 flex justify-between items-center flex-wrap gap-3 leading-relaxed">
                      <span>💡 <strong>Tips Docker:</strong> Volume Pterodactyl berada pada folder <code>/volumes/&lt;srv-uuid&gt;</code>. Menghapus data cache temp aman dan tidak akan mengganggu file server utama game.</span>
                      <span className="text-emerald-500/80 animate-pulse font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                        NCDU ENGINE ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* SMART CLEANUP DAEMON WIDGET */}
                <div id="smart-cleanup-widget" className="border-t border-neutral-850 pt-5 mt-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-950/30 border border-amber-500/25 rounded-lg text-amber-400">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                        DEPOSIT RECOVERY ENGINE: SMART CLEANUP DAEMON
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Ototransmisi pembersihan darurat otomatis melacak penggunaan disk Pterodactyl. Mengosongkan direktori <code className="text-amber-400 font-mono">/cache</code> dan <code className="text-amber-400 font-mono">/tmp</code> jika overload melebihi batas.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#050508] border border-neutral-850 rounded-2xl p-4 md:p-5 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Controller Column */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-neutral-450 font-mono block uppercase tracking-wider">Status Daemon</label>
                          <div className="flex items-center gap-2">
                            {smartCleanupStatus?.enabled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                AKTIF / SIAGA
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-800 border border-neutral-700 text-neutral-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                                NONAKTIF
                              </span>
                            )}

                            {smartCleanupStatus?.simulatedDiskOverload && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 border border-amber-500/30 text-amber-450">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                                OVERLOAD SIMULATOR ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="bg-[#0a0a0f] border border-neutral-855 rounded-xl p-3">
                            <span className="text-[9px] text-neutral-500 font-mono block uppercase">BATAS MAKS DISK</span>
                            <span className="text-sm font-mono font-bold text-neutral-200">{smartCleanupStatus?.threshold || 90}%</span>
                          </div>
                          <div className="bg-[#0a0a0f] border border-neutral-855 rounded-xl p-3">
                            <span className="text-[9px] text-neutral-500 font-mono block uppercase">DURASI KRITIS</span>
                            <span className="text-sm font-mono font-bold text-neutral-200">{smartCleanupStatus?.durationHours || 1} JAM</span>
                          </div>
                        </div>

                        {/* Control actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => toggleSimulateDiskOverload(!smartCleanupStatus?.simulatedDiskOverload)}
                            className={`flex-1 min-w-[150px] px-3 py-2 text-[10px] font-mono font-bold rounded-xl border transition cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                              smartCleanupStatus?.simulatedDiskOverload
                                ? "bg-amber-955/20 border-amber-500/40 text-amber-400 hover:bg-neutral-900"
                                : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${smartCleanupStatus?.simulatedDiskOverload ? "bg-amber-450 animate-ping" : "bg-neutral-500"}`}></span>
                            {smartCleanupStatus?.simulatedDiskOverload ? "NONAKTIFKAN STATUS PENUH" : "SIMULASI DISK FULL (>90%)"}
                          </button>
                          
                          <button
                            disabled={isCleaningUp}
                            onClick={handleForceSmartCleanup}
                            className="px-3.5 py-2 text-[10px] font-mono font-bold rounded-xl border border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 hover:border-rose-500/50 transition cursor-pointer select-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${isCleaningUp ? "animate-spin" : ""}`} />
                            <span>CLEANUP SEKARANG</span>
                          </button>
                        </div>
                      </div>

                      {/* Monitoring / Alert status column */}
                      <div className="md:col-span-7 bg-[#08080c] border border-neutral-855 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
                        {smartCleanupStatus?.isOverloaded ? (
                          <div className="space-y-3 flex-1 flex flex-col justify-between">
                            <div className="flex items-start gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mt-1 shrink-0"></span>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-red-500 font-mono uppercase tracking-wide">DISK STORAGE CRITICAL OVERLOAD</h5>
                                <p className="text-[10px] text-neutral-400 leading-relaxed">
                                  Penyimpanan terdeteksi melebihi batas {smartCleanupStatus.threshold}% secara berkelanjutan. Timer Smart Cleanup sedang menghitung mundur!
                                </p>
                              </div>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-2">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-neutral-400">WAKTU BERJALAN:</span>
                                <span className="text-red-450 font-bold">{Math.floor(smartCleanupStatus.elapsedMs / 1000)} DETIK / 3600 DETIK (1 JAM)</span>
                              </div>
                              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500 transition-all duration-1000" 
                                  style={{ width: `${Math.min(100, (smartCleanupStatus.elapsedMs / (smartCleanupStatus.durationHours * 60 * 60 * 1000)) * 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-[9px] font-mono text-neutral-500 text-center animate-pulse">
                                *Auto-trigger menyeka cache /tmp saat progress mencapai 100%. Anda juga dapat mengklik "CLEANUP SEKARANG".
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 space-y-2.5">
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-455 rounded-full shrink-0">
                              <ShieldCheck className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                              <h5 className="text-[11px] font-bold text-neutral-200 uppercase font-mono tracking-wider">Penyimpanan Terpantau Aman</h5>
                              <p className="text-[10px] text-neutral-450 max-w-xs leading-relaxed mx-auto">
                                Disk VPS berada dalam rentang aman. Daemon Smart Cleanup dalam siaga penuh memantau setiap menit.
                              </p>
                            </div>
                          </div>
                        )}

                        {smartCleanupLogs.length > 0 && (
                          <div className="bg-[#020204] border border-neutral-850 rounded-lg p-2.5 font-mono text-[9px] text-emerald-400 space-y-1 text-left max-h-[85px] overflow-y-auto shadow-inner">
                            <div className="text-[8px] text-neutral-450 border-b border-neutral-900 pb-1 mb-1 font-bold uppercase tracking-wide">Output log eksekusi pembersihan:</div>
                            {smartCleanupLogs.map((log, idx) => (
                              <div key={idx} className="truncate">{log}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "backup" && adminSessionActive && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#09090e]/80 border border-violet-500/30 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(139,92,246,0.05)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-violet-500 rounded-bl-lg"></div>

                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-violet-950/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-950/50 border border-violet-500/35 text-violet-400 rounded-xl shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                      <Database className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                        Pencadangan Backup & Sinkronisasi VPS
                        <span className="text-[9px] bg-violet-950/40 border border-violet-500/20 text-violet-455 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                          CLOUD_BACKUP
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                        Buat aturan otomatisasi backup. Mengamankan file database server game Pterodactyl Anda dengan aman.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Backup scheduler configuration form */}
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-violet-100 uppercase tracking-widest font-mono">Setup Backup VPS</h4>

                      <div className="space-y-1 text-xs">
                        <label className="text-neutral-400 font-medium">Nama Agenda Backup</label>
                        <input
                          type="text"
                          value={backupName}
                          onChange={(e) => setBackupName(e.target.value)}
                          placeholder="Backup Data Harian"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500 font-medium transition"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-neutral-400 font-medium">Target Folder di Server</label>
                        <input
                          type="text"
                          value={backupTarget}
                          onChange={(e) => setBackupTarget(e.target.value)}
                          placeholder="/var/lib/pterodactyl"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500 font-mono transition"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-neutral-400 font-medium">Interval Otomatisasi</label>
                        <select
                          value={backupSchedule}
                          onChange={(e) => setBackupSchedule(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500 transition border-neutral-850"
                        >
                          <option value="hourly">Tiap Jam (Hourly)</option>
                          <option value="daily">Harian (Daily 03:00)</option>
                          <option value="weekly">Mingguan (Weekly)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerBackup}
                      disabled={isSimulatingBackup}
                      className="w-full text-center font-mono font-bold py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-neutral-950 transition uppercase rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer mt-4"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingBackup ? "animate-spin" : ""}`} />
                      {isSimulatingBackup ? "MEM-BACKUP..." : "BACKUP COBA SEKARANG"}
                    </button>
                  </div>

                  {/* Historical Backups */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-450 uppercase tracking-widest font-mono">Riwayat Arsip Cadangan (Tersimpan)</h4>

                    <div className="space-y-3">
                      {backups.map((bk) => (
                        <div key={bk.id} className="bg-neutral-900 border border-neutral-850 p-4 rounded-2xl flex justify-between items-center group hover:border-neutral-750 transition-all">
                          <div className="flex items-center gap-3.5">
                            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-violet-455">
                              <Database className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-200 leading-snug">{bk.name}</p>
                              <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono mt-1">
                                <span className="text-violet-400 font-semibold">{bk.id}</span>
                                <span>Dir: {bk.target}</span>
                                <span>Schedule: {bk.schedule}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-1 font-mono">
                            <span className="text-xs font-bold text-neutral-100">{bk.size}</span>
                            <p className="text-[10px] text-neutral-500">{bk.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "optimizer" && adminSessionActive && (
            <motion.div
              key="optimizer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#09090e]/80 border border-amber-500/30 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(245,158,11,0.05)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-bl-lg"></div>

                <div className="flex justify-between items-center border-b border-amber-950/40 pb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-950/50 border border-amber-500/35 text-amber-400 rounded-xl shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                        Pembersih Cache RAM & Optimisasi Otomatis
                        <span className="text-[9px] bg-amber-950/40 border border-amber-500/20 text-amber-450 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                          OPT_ENG
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Bersihkan pagecache dan sisa penggunaan RAM yang tersangkut secara aman untuk memperlancar performa VPS dari crash.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Controls Card */}
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">Konfigurasi Cleaner</h4>

                      <div className="space-y-4">
                        {/* Toggle 1 */}
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoCleanRam}
                            onChange={(e) => setAutoCleanRam(e.target.checked)}
                            className="mt-0.5 accent-amber-500 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-neutral-200 block">Auto-flush RAM Caches</span>
                            <span className="text-[10px] text-neutral-400 leading-normal block">Picu pembersihan otomatis jika memori melorot di atas 80% alokasi.</span>
                          </div>
                        </label>

                        {/* Toggle 2 */}
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoCleanLogs}
                            onChange={(e) => setAutoCleanLogs(e.target.checked)}
                            className="mt-0.5 accent-amber-500 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-neutral-200 block">Log Purging Berkala</span>
                            <span className="text-[10px] text-neutral-400 leading-normal block">Bersihkan isi log riwayat telemetri di database server secara berkala tiap 72 jam.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleOptimizeRam}
                      disabled={isOptimizing}
                      className="w-full text-center font-mono font-bold py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-sans tracking-wide transition uppercase rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer mt-6"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
                      {isOptimizing ? "MENGOPTIMALKAN..." : "OPTIMALKAN RAM SEKARANG"}
                    </button>
                  </div>

                  {/* Right Logs Terminal */}
                  <div className="lg:col-span-2 space-y-3 flex flex-col h-full min-h-[250px] justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">OPTIMIZATION LOG CONSOLE</span>
                    
                    <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex-1 min-h-[180px] overflow-y-auto font-mono text-[10px] text-amber-400 space-y-1 bg-black/60 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                      {optimizationLogs.map((logLine, idx) => (
                        <div key={idx} className="leading-relaxed">{logLine}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- SEKSI PUSAT AUDIO KUSTOM --- */}
                <div id="audio-alarm-kit" className="bg-[#05050e]/90 border border-cyan-500/20 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(6,182,212,0.03)] backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-4 h-4 bg-cyan-500 rounded-bl-lg"></div>

                  <div className="flex justify-between items-center border-b border-cyan-950/40 pb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/35 text-cyan-400 rounded-xl shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <Music className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                          Pusat Kontrol Audio VPS
                          <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                            AUDIO_CORE
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Atur dan unggah musik latar kustom (MP3) untuk menemani Anda memantau seluruh kinerja VPS secara real-time.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-6 space-y-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        PENGATURAN MUSIK LATAR DASHBOARD
                      </h4>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={bgMusicEnabled} 
                          onChange={(e) => {
                            ensureAudioContext();
                            setBgMusicEnabled(e.target.checked);
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-450 after:border-neutral-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-neutral-950"></div>
                      </label>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Custom MP3 File Uploader */}
                      <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-cyan-400 block font-mono font-bold uppercase tracking-wider">🎧 FILE AUDIO KUSTOM (MP3 / WAV)</span>
                          <span className="text-[8px] bg-cyan-950/40 border border-cyan-500/10 px-2 py-0.5 rounded text-neutral-450 font-mono font-bold">PERSISTEN</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center justify-center gap-2 border border-dashed border-cyan-500/25 hover:border-cyan-500/50 bg-neutral-950 hover:bg-neutral-900 px-3 py-3 rounded-xl cursor-pointer transition text-xs font-sans tracking-wide text-neutral-300">
                            <File className="w-4 h-4 text-cyan-400" />
                            <span className="font-mono text-[10.5px] truncate">
                              {customAudioName ? `Ganti Musik: ${customAudioName}` : "📂 Klik untuk Unggah MP3 Latar"}
                            </span>
                            <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={handleCustomAudioUpload}
                              className="hidden" 
                            />
                          </label>
                          {customAudioName ? (
                            <div className="text-[10px] text-neutral-400 font-mono text-center bg-neutral-950/50 py-2 px-3 rounded-lg border border-neutral-850/60">
                              Terpasang: <strong className="text-cyan-400 font-sans">{customAudioName}</strong>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-500 font-mono text-center py-2">
                              Belum ada audio kustom yang diunggah. Silakan unggah file MP3 untuk memulai musik latar otomatis.
                            </div>
                          )}
                        </div>
                      </div>




                          {/* Music Volume Control Slider */}
                          <div className="space-y-1.5 pt-2">
                            <label className="text-[10px] text-neutral-400 block font-mono font-bold uppercase tracking-wider">VOLUME MUSIK LATAR</label>
                            <div className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={bgMusicVolume} 
                                onChange={(e) => handleBgMusicVolumeChange(Number(e.target.value))}
                                className="w-full accent-cyan-500 cursor-pointer"
                              />
                              <span className="text-neutral-300 text-xs font-mono min-w-[50px] text-right">{bgMusicVolume}%</span>
                            </div>
                          </div>

                          {/* Descriptive info of track and cute audio visualization waves */}
                          <div className="p-3.5 bg-neutral-900/40 border border-neutral-850 rounded-xl flex items-center gap-3.5">
                            {bgMusicEnabled && customAudioBufferRef.current ? (
                              <div className="flex items-end gap-1 h-5 shrink-0 select-none">
                                <span className="w-1 bg-cyan-400 animate-pulse rounded-full h-4" style={{ animationDuration: '0.6s' }}></span>
                                <span className="w-1 bg-cyan-400 animate-pulse rounded-full h-2" style={{ animationDuration: '0.9s' }}></span>
                                <span className="w-1 bg-cyan-500 animate-pulse rounded-full h-5" style={{ animationDuration: '0.4s' }}></span>
                                <span className="w-1 bg-cyan-400 animate-pulse rounded-full h-3" style={{ animationDuration: '0.8s' }}></span>
                                <span className="w-1 bg-cyan-500 animate-pulse rounded-full h-1" style={{ animationDuration: '0.5s' }}></span>
                              </div>
                            ) : (
                              <VolumeX className="w-5 h-5 text-neutral-600 shrink-0" />
                            )}
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">
                                {bgMusicEnabled && customAudioBufferRef.current ? "🔊 MUSIK LATAR SEDANG MEMUTAR" : "🔇 AUDIO SEMENTARA DIHENTIKAN"}
                              </span>
                              <span className="text-[9px] text-neutral-400 leading-normal block">
                                {bgMusicEnabled && customAudioBufferRef.current
                                  ? `Lagu kustom Anda diputar dengan aman dan mulus di latar belakang.`
                                  : `Unggah dan aktifkan musik latar kustom untuk mendengarkan lagu pilihan Anda secara persisten.`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[9.5px] font-mono text-neutral-500 border-t border-neutral-850/40 pt-4 leading-normal">
                          ⚡ <strong>Tips Persistensi</strong>: Musik yang Anda unggah disimpan dengan aman di penyimpanan lokal peramban (IndexedDB) sehingga tetap tersimpan dan siap diputar kembali setiap kali Anda membuka halaman ini tanpa perlu mengunggah ulang!
                        </div>
                      </div>
                    </div>

              </div>
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#09090e]/80 border border-rose-500/30 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(244,63,94,0.05)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 left-0 w-24 h-[1.5px] bg-rose-500"></div>

                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-rose-950/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-950/50 border border-rose-500/35 text-rose-400 rounded-xl shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                      <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                        Riwayat Log Alarm & Akses Sistem
                        <span className="text-[9px] bg-rose-950/40 border border-rose-500/20 text-rose-450 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                          SQL_DB LOGS
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                        Pencatatan real-time saat muatan server melampaui ambang batas aman atau aktivitas remote.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 font-mono">
                    <button
                      onClick={fetchAlertLogs}
                      className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-xs text-neutral-300 rounded-xl flex items-center gap-1.5 transition select-none cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} /> REFRESH
                    </button>
                    <button
                      onClick={clearAlertLogs}
                      disabled={alertLogs.length === 0}
                      className={`px-3.5 py-2 border text-xs font-semibold rounded-xl flex items-center gap-1.5 transition select-none ${
                        alertLogs.length === 0 
                          ? 'opacity-30 cursor-not-allowed bg-transparent border-neutral-800 text-neutral-500' 
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40 cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.05)]'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ERASE_DATABASE
                    </button>
                  </div>
                </div>

                {alertLogs.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-850 rounded-2xl bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
                    <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-full text-neutral-500">
                      <CheckCircle className="w-7 h-7 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-300">SISTEM BERJALAN NORMAL</p>
                      <p className="text-xs text-neutral-500 max-w-sm leading-normal">
                        Tidak ada peringatan atau alarm tercatat. Batas alarm aktif: CPU ({config.alertCpuThreshold}%), RAM ({config.alertRamThreshold}%), Disk ({config.alertDiskThreshold}%).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-neutral-850 rounded-xl overflow-hidden bg-black/40 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#0b0b10] text-neutral-400 border-b border-neutral-850 font-mono tracking-wider font-bold">
                            <th className="p-3.5 font-mono">TIMESTAMP</th>
                            <th className="p-3.5">KATEGORI</th>
                            <th className="p-3.5">ALARM_EVENT</th>
                            <th className="p-3.5">DIAGNOSTIK DESKRIPSI</th>
                            <th className="p-3.5 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 font-sans">
                          {alertLogs.map((log) => {
                            let typeBadgeColor = "text-neutral-400 bg-neutral-900 border-neutral-800";
                            if (log.type === "cpu") typeBadgeColor = "text-amber-400 bg-amber-950/20 border-amber-500/25 shadow-[0_0_5px_rgba(245,158,11,0.05)]";
                            if (log.type === "ram") typeBadgeColor = "text-purple-400 bg-purple-950/20 border-purple-500/25 shadow-[0_0_5px_rgba(168,85,247,0.05)]";
                            if (log.type === "disk") typeBadgeColor = "text-orange-400 bg-orange-950/20 border-orange-500/25 shadow-[0_0_5px_rgba(249,115,22,0.05)]";
                            if (log.type === "system") typeBadgeColor = "text-cyan-400 bg-cyan-950/20 border-cyan-500/25 shadow-[0_0_5px_rgba(6,182,212,0.05)]";
                            if (log.type === "remote") typeBadgeColor = "text-rose-400 bg-rose-950/20 border-rose-500/25 shadow-[0_0_5px_rgba(244,63,94,0.05)]";
                            
                            let levelBadge = "🔴 HIGH_CRIT";
                            if (log.level === "info") levelBadge = "🔵 SYS_INFO";
                            if (log.level === "warning") levelBadge = "🟡 WARNING";
                            if (log.level === "success") levelBadge = "🟢 SYS_READY";
                            
                            let levelColor = "text-rose-400 font-semibold";
                            if (log.level === "info") levelColor = "text-cyan-400";
                            if (log.level === "warning") levelColor = "text-amber-400";
                            if (log.level === "success") levelColor = "text-emerald-400";

                            return (
                              <tr key={log.id} className="hover:bg-neutral-900/35 transition-colors">
                                <td className="p-3.5 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString("id-ID")}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${typeBadgeColor} inline-block tracking-wider font-bold`}>
                                    {log.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3.5 font-semibold text-neutral-200">
                                  {log.title}
                                </td>
                                <td className="p-3.5 text-neutral-400 text-[11px] leading-relaxed max-w-sm">
                                  {log.message}
                                </td>
                                <td className={`p-3.5 text-right font-mono text-[10px] ${levelColor} whitespace-nowrap`}>
                                  {levelBadge}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "remote" && (
            <motion.div
              key="remote-telemetry-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#09090e]/95 border border-purple-500/15 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_12px_rgba(168,85,247,0.03)]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-[10px] font-mono tracking-widest uppercase">TOTAL SATELLITE VPS</span>
                    <Server className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-neutral-100">
                      {remoteDevices.length}
                    </span>
                    <span className="text-xs text-neutral-500">Unit</span>
                  </div>
                </div>

                <div className="bg-[#09090e]/95 border border-emerald-500/15 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_12px_rgba(16,185,129,0.03)]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-[10px] font-mono tracking-widest uppercase">NODE ONLINE</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-emerald-400">
                      {remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).length}
                    </span>
                    <span className="text-xs text-neutral-500">Aktif</span>
                  </div>
                </div>

                <div className="bg-[#09090e]/95 border border-amber-500/15 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_12px_rgba(245,158,11,0.03)]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-[10px] font-mono tracking-widest uppercase">AVG CPU LOAD</span>
                    <Cpu className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-amber-400">
                      {remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).length > 0
                        ? Math.round(remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).reduce((acc, d) => acc + d.stats.cpu, 0) / remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).length)
                        : 0}
                    </span>
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>

                <div className="bg-[#09090e]/95 border border-blue-500/15 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_12px_rgba(59,130,246,0.03)]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-[10px] font-mono tracking-widest uppercase">AVG RAM LOAD</span>
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-blue-400">
                      {remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).length > 0
                        ? Math.round(remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).reduce((acc, d) => acc + d.stats.ram.percent, 0) / remoteDevices.filter(d => Date.now() - d.lastSeen < 45 * 1000).length)
                        : 0}
                    </span>
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>
              </div>

              {/* Main Node List */}
              <div className="bg-[#09090e]/95 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-5 border-b border-neutral-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-200 tracking-wider font-display uppercase flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      DAFTAR SATELLITE VPS TERDAFTAR
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Daftar node yang mengirimkan telemetry live ke receiver ini</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchRemoteDevices}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-800/80 hover:border-neutral-700 font-mono text-[11px] transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      RELOAD LIST
                    </button>
                  </div>
                </div>

                {remoteDevices.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="p-3.5 bg-purple-950/15 border border-purple-500/20 text-purple-400 rounded-2xl shadow-[0_0_15px_rgba(147,51,234,0.05)]">
                      <Server className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-300 font-mono tracking-wider uppercase">BELUM ADA SATELLITE VPS TERHUBUNG</h4>
                      <p className="text-[11px] text-neutral-500 max-w-sm mt-1 mx-auto">
                        Gunakan installer di bawah untuk memasang script pengirim pada VPS eksternal Anda agar dapat dipantau di sini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remoteDevices.map((device, index) => {
                      const secondsAgo = Math.round((Date.now() - device.lastSeen) / 1000);
                      const isOnline = secondsAgo < 45;
                      
                      // Format uptime into Indonesian
                      const formatIndonesianUptime = (sec: number) => {
                        if (!sec || sec <= 0) return "0 detik";
                        const days = Math.floor(sec / (3600 * 24));
                        const hours = Math.floor((sec % (3600 * 24)) / 3600);
                        const minutes = Math.floor((sec % 3600) / 60);
                        
                        const parts = [];
                        if (days > 0) parts.push(`${days}d`);
                        if (hours > 0 || days > 0) parts.push(`${hours}j`);
                        parts.push(`${minutes}m`);
                        return parts.join(" ");
                      };

                      const indexOne = index + 1;
                      const isPremium = device.nodeId.toLowerCase().includes("premium") || indexOne % 3 === 1;
                      const isEnterprise = device.nodeId.toLowerCase().includes("enterprise") || indexOne % 3 === 2;
                      const tierName = isPremium ? "PREMIUM" : isEnterprise ? "ENTERPRISE" : "LEGAL PRIVATE";
                      const tierColor = isPremium ? "text-emerald-400" : isEnterprise ? "text-purple-400" : "text-sky-400";
                      
                      // CPU, RAM, Disk total/used
                      const ramTotal = device.stats.ram.total || 8;
                      const ramUsed = device.stats.ram.used || 0;
                      const ramPercent = device.stats.ram.percent;
                      
                      const diskTotal = device.stats.disk.total || 100;
                      const diskUsed = device.stats.disk.used || 0;
                      const diskPercent = device.stats.disk.percent;

                      const cpuCores = device.stats.cores || 0;

                      // Flag emoji helper
                      const getFlagEmoji = (countryCode: string) => {
                        if (!countryCode || countryCode.length !== 2) return "🌐";
                        const codePoints = countryCode
                          .toUpperCase()
                          .split("")
                          .map(char => 127397 + char.charCodeAt(0));
                        try {
                          return String.fromCodePoint(...codePoints);
                        } catch (e) {
                          return "🌐";
                        }
                      };

                      // Gunakan lokasi ASLI dari agent. Jangan pernah fallback ke lokasi ngasal.
                      const geo = device.stats.geo || null;
                      const flagEmoji = geo ? getFlagEmoji(geo.countryCode) : "🌐";
                      const locationLabel = geo && geo.country
                        ? `${geo.city ? geo.city + ", " : ""}${geo.country}`
                        : "Lokasi Tidak Diketahui";

                      // Load calculation
                      const load_1 = (device.stats.cpu * 0.05).toFixed(2);
                      const load_5 = (device.stats.cpu * 0.04).toFixed(2);
                      const load_15 = (device.stats.cpu * 0.04).toFixed(2);
                      const loadStr = `${load_1} / ${load_5} / ${load_15}`;

                      // CPU bar color
                      const cpuColor = device.stats.cpu > 85 ? "bg-rose-500" : device.stats.cpu > 50 ? "bg-amber-500" : "bg-emerald-500";
                      const ramColor = ramPercent > 85 ? "bg-rose-500" : ramPercent > 50 ? "bg-amber-500" : "bg-blue-500";
                      const diskColor = diskPercent > 85 ? "bg-rose-500" : diskPercent > 50 ? "bg-amber-500" : "bg-purple-500";

                      return (
                        <div key={device.nodeId} className="bg-neutral-900/30 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl p-5 shadow-xl transition-all duration-300 relative flex flex-col justify-between">
                          {/* Top Card Header */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl filter drop-shadow" title={geo?.country || "Lokasi Tidak Diketahui"}>{flagEmoji}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold tracking-wider text-neutral-400 font-mono uppercase">
                                      PUSH #{indexOne} • 
                                    </span>
                                    <span className={`text-[9px] font-bold tracking-wider font-mono uppercase ${tierColor}`}>
                                      {tierName}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-bold text-neutral-100 font-sans tracking-wide mt-0.5">
                                    {device.nodeId.toUpperCase()}
                                  </h3>
                                  <p className="text-[10px] text-neutral-500 font-mono">
                                    {locationLabel} • {device.secret ? `${device.secret.substring(0, 8)}...` : 'SATELLITE'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right flex flex-col items-end">
                                {isOnline ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-extrabold text-emerald-400 font-mono tracking-wider">ONLINE</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span className="text-[9px] font-extrabold text-rose-400 font-mono tracking-wider">OFFLINE</span>
                                  </div>
                                )}
                                <span className="text-[8px] text-neutral-500 font-mono mt-1 font-semibold">
                                  {isOnline ? "LIVE PUSH" : `OFFLINE > 45 DETIK`}
                                </span>
                              </div>
                            </div>

                            {/* Middle Specs Badges Box */}
                            <div className="grid grid-cols-3 gap-2 mb-4 font-mono">
                              <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-xl p-2 text-center">
                                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider">RAM</span>
                                <span className="text-xs font-bold text-neutral-300">{Math.round(ramTotal)} GB</span>
                              </div>
                              <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-xl p-2 text-center">
                                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider">CPU</span>
                                <span className="text-xs font-bold text-neutral-300">{cpuCores} Core</span>
                              </div>
                              <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-xl p-2 text-center">
                                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider">DISK</span>
                                <span className="text-xs font-bold text-neutral-300">{Math.round(diskTotal)} GB</span>
                              </div>
                            </div>

                            {/* Progress Bars (CPU, RAM, Disk) */}
                            <div className="space-y-3.5 font-mono text-[11px] mb-4">
                              {/* CPU Progress */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-neutral-400 font-bold">CPU Usage</span>
                                  <span className="text-neutral-300 font-bold">{device.stats.cpu.toFixed(1)}% • {cpuCores}</span>
                                </div>
                                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800/40">
                                  <div className={`h-full ${cpuColor} transition-all duration-500`} style={{ width: `${device.stats.cpu}%` }} />
                                </div>
                              </div>

                              {/* RAM Progress */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-neutral-400 font-bold">RAM Usage</span>
                                  <span className="text-neutral-300 font-bold">
                                    {ramPercent.toFixed(1)}% <span className="text-neutral-500 font-normal">({ramUsed.toFixed(1)} GB / {ramTotal.toFixed(1)} GB)</span>
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800/40">
                                  <div className={`h-full ${ramColor} transition-all duration-500`} style={{ width: `${ramPercent}%` }} />
                                </div>
                              </div>

                              {/* Disk Progress */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-neutral-400 font-bold">Disk Usage</span>
                                  <span className="text-neutral-300 font-bold">
                                    {diskPercent.toFixed(1)}% <span className="text-neutral-500 font-normal">({diskUsed.toFixed(1)} GB / {diskTotal.toFixed(1)} GB)</span>
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800/40">
                                  <div className={`h-full ${diskColor} transition-all duration-500`} style={{ width: `${diskPercent}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Info Rows */}
                          <div className="border-t border-neutral-800/60 pt-3 mt-1 text-[10px] font-mono flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="font-semibold text-neutral-500">Uptime</span>
                              <span className="text-neutral-200 font-bold">{formatIndonesianUptime(device.stats.uptime)}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="font-semibold text-neutral-500">Load</span>
                              <span className="text-neutral-200 font-bold">{loadStr}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="font-semibold text-neutral-500">Agent</span>
                              <span className="text-neutral-200 font-bold">v2.0.0</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400">
                              <span className="font-semibold text-neutral-500">Last Push</span>
                              <span className="text-neutral-200 font-bold">{secondsAgo <= 0 ? "Baru saja" : `${secondsAgo} detik lalu`}</span>
                            </div>

                            {/* Delete/Action Button */}
                            <div className="flex justify-end mt-2 pt-1 border-t border-neutral-900/60">
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus node '${device.nodeId}' dari monitoring?`)) {
                                    try {
                                      const res = await fetch("/api/remote-delete", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ nodeId: device.nodeId }),
                                      });
                                      const out = await res.json();
                                      if (out.success) {
                                        fetchRemoteDevices();
                                      } else {
                                        alert("Gagal menghapus: " + out.error);
                                      }
                                    } catch (err: any) {
                                      alert("Koneksi gagal: " + err.message);
                                    }
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-rose-950/40 hover:text-rose-400 rounded-lg border border-neutral-850 hover:border-rose-900/50 text-neutral-500 transition-all cursor-pointer font-bold uppercase tracking-wider text-[9px]"
                                title="Unregister Node"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus Node
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Collapsible Installation & Script Generation Accordion */}
              <div className="bg-[#09090e]/95 border border-neutral-900 rounded-2xl p-5 space-y-4">
                <div 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-950/30 border border-purple-500/25 text-purple-400 rounded-xl">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200 tracking-wider font-display uppercase">CARA PASANG SATELLITE AGENT (LIGHTWEIGHT TELEMETRY SENDER)</h4>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Pasang daemon pengirim sinyal live di VPS eksternal Anda</p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 rounded-lg border border-transparent hover:border-neutral-800 transition-all">
                    {showInstructions ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {showInstructions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-4 border-t border-neutral-900 space-y-5"
                    >
                      {/* Configuration input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block">ID NODE VPS SATELLITE BARU</label>
                          <input
                            type="text"
                            value={customNodeName}
                            onChange={(e) => setCustomNodeName(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ""))}
                            placeholder="Contoh: VPS-Singapore-SGP01"
                            className="w-full bg-neutral-950/80 border border-neutral-900 focus:border-purple-500/40 hover:border-neutral-800 rounded-xl px-4 py-3 text-xs font-mono text-neutral-200 placeholder-neutral-700 outline-none transition-all"
                          />
                          <p className="text-[9px] text-neutral-600 font-mono">Beri nama unik untuk VPS satelit ini. Gunakan huruf, angka, strip, atau underscore.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block">URL WEB DASHBOARD RECEIVER</label>
                          <input
                            type="text"
                            value={appUrl}
                            readOnly
                            className="w-full bg-neutral-950/40 border border-neutral-950 rounded-xl px-4 py-3 text-xs font-mono text-neutral-500 select-all outline-none"
                          />
                          <p className="text-[9px] text-neutral-600 font-mono">Alamat receiver pusat yang akan menerima data telemetry sinyal satelit.</p>
                        </div>
                      </div>

                      {/* Method 1: Automatic 1-line installation */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <h5 className="text-[11px] font-bold tracking-wider uppercase">METODE 1: INSTALASI INSTANT (1-LINE AUTO RUNNER)</h5>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          Cukup copy command di bawah ini dan paste/jalankan langsung ke terminal SSH root VPS eksternal Anda. 
                          Perintah ini otomatis mengunduh script, mengonfigurasinya, menginstal dependensi bawaan, dan menjalankannya sebagai daemon background.
                        </p>
                        
                        <div className="relative bg-neutral-950/70 border border-neutral-900 rounded-xl p-4 font-mono text-[11px] text-purple-400 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                          {`mkdir -p /opt/vps-satellite && cd /opt/vps-satellite && cat << 'EOF' > agent.js
/**
 * Satellite Telemetry Agent Script
 * Dependency-Free Node.js Runner
 */
const os = require('os');
const { exec } = require('child_process');
const http = require('http');
const https = require('https');

const CONFIG = {
  nodeId: "${customNodeName}",
  secret: "satellite-vps-secret",
  remoteUrl: "${appUrl}/api/remote-stats",
  syncIntervalMs: 5000
};

console.log("==========================================");
console.log("🛰️   SATELLITE VPS AGENT DAEMON RUNNING     ");
console.log("==========================================");
console.log("NODE ID : " + CONFIG.nodeId);
console.log("TARGET  : " + CONFIG.remoteUrl);

function cpuAverage() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 100 };
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

let lastCpu = cpuAverage();

function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -Pk /", (err, stdout) => {
      if (err) {
        return resolve({ used: 0, total: 1, percent: 0 });
      }
      const lines = stdout.split('\\n');
      if (lines.length > 1) {
        const parts = lines[1].replace(/\\s+/g, ' ').split(' ');
        if (parts.length > 4) {
          const totalKB = parseInt(parts[1], 10);
          const usedKB = parseInt(parts[2], 10);
          const percent = parseInt(parts[4].replace('%', ''), 10);
          return resolve({
            used: totalKB > 0 ? (usedKB / 1024 / 1024) : 0,
            total: totalKB > 0 ? (totalKB / 1024 / 1024) : 1,
            percent: isNaN(percent) ? 0 : percent
          });
        }
      }
      resolve({ used: 0, total: 1, percent: 0 });
    });
  });
}

async function sendTelemetry() {
  try {
    const endCpu = cpuAverage();
    const idleDiff = endCpu.idle - lastCpu.idle;
    const totalDiff = endCpu.total - lastCpu.total;
    const cpuLoad = totalDiff > 0 ? Math.round(100 - (100 * idleDiff / totalDiff)) : 0;
    lastCpu = endCpu;

    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    const ramPercent = totalRam > 0 ? Math.round((usedRam / totalRam) * 100) : 0;

    const disk = await getDiskUsage();

    const payload = JSON.stringify({
      nodeId: CONFIG.nodeId,
      secret: CONFIG.secret,
      stats: {
        cpu: Math.max(0, Math.min(100, cpuLoad)),
        ram: {
          used: usedRam / 1024 / 1024 / 1024,
          total: totalRam / 1024 / 1024 / 1024,
          percent: ramPercent
        },
        disk: {
          used: disk.used,
          total: disk.total,
          percent: disk.percent
        },
        uptime: os.uptime(),
        os: \`\${os.type()} \${os.release()} (\${os.arch()})\`
      }
    });

    const url = new URL(CONFIG.remoteUrl);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log("[" + new Date().toLocaleTimeString() + "] 🟢 Sinyal ping berhasil dipancarkan ke receiver utama.");
        } else {
          console.log("[" + new Date().toLocaleTimeString() + "] ⚠️ Gagal kirim ping: " + res.statusCode);
        }
      });
    });

    req.on('error', (err) => {
      console.error("[" + new Date().toLocaleTimeString() + "] 🔴 Gangguan koneksi receiver: " + err.message);
    });

    req.write(payload);
    req.end();

  } catch (err) {
    console.error("Critical telemetry error: " + err.message);
  }
}

// Loop Telemetry
setInterval(sendTelemetry, CONFIG.syncIntervalMs);
sendTelemetry();
EOF
node agent.js > agent.log 2>&1 &
echo -e "\\n\\e[32m✔ [SUKSES] Satellite Agent berhasil dikonfigurasi dan dijalankan di background!\\e[0m"
echo -e "\\e[32m  Pantau hasilnya langsung pada dashboard receiver Anda sekarang!\\e[0m\\n"
`}
                          <button
                            onClick={() => {
                              const command = `mkdir -p /opt/vps-satellite && cd /opt/vps-satellite && cat << 'EOF' > agent.js\n/**\n * Satellite Telemetry Agent Script\n * Dependency-Free Node.js Runner\n */\nconst os = require('os');\nconst { exec } = require('child_process');\nconst http = require('http');\nconst https = require('https');\n\nconst CONFIG = {\n  nodeId: "${customNodeName}",\n  secret: "satellite-vps-secret",\n  remoteUrl: "${appUrl}/api/remote-stats",\n  syncIntervalMs: 5000\n};\n\nconsole.log("==========================================");\nconsole.log("🛰️   SATELLITE VPS AGENT DAEMON RUNNING     ");\nconsole.log("==========================================");\nconsole.log("NODE ID : " + CONFIG.nodeId);\nconsole.log("TARGET  : " + CONFIG.remoteUrl);\n\nfunction cpuAverage() {\n  const cpus = os.cpus();\n  if (!cpus || cpus.length === 0) return { idle: 0, total: 100 };\n  let idleMs = 0;\n  let totalMs = 0;\n  cpus.forEach((core) => {\n    for (const type in core.times) {\n      totalMs += core.times[type];\n    }\n    idleMs += core.times.idle;\n  });\n  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };\n}\n\nlet lastCpu = cpuAverage();\n\nfunction getDiskUsage() {\n  return new Promise((resolve) => {\n    exec("df -Pk /", (err, stdout) => {\n      if (err) {\n        return resolve({ used: 0, total: 1, percent: 0 });\n      }\n      const lines = stdout.split('\\n');\n      if (lines.length > 1) {\n        const parts = lines[1].replace(/\\s+/g, ' ').split(' ');\n        if (parts.length > 4) {\n          const totalKB = parseInt(parts[1], 10);\n          const usedKB = parseInt(parts[2], 10);\n          const percent = parseInt(parts[4].replace('%', ''), 10);\n          return resolve({\n            used: totalKB > 0 ? (usedKB / 1024 / 1024) : 0,\n            total: totalKB > 0 ? (totalKB / 1024 / 1024) : 1,\n            percent: isNaN(percent) ? 0 : percent\n          });\n        }\n      }\n      resolve({ used: 0, total: 1, percent: 0 });\n    });\n  });\n}\n\nasync function sendTelemetry() {\n  try {\n    const endCpu = cpuAverage();\n    const idleDiff = endCpu.idle - lastCpu.idle;\n    const totalDiff = endCpu.total - lastCpu.total;\n    const cpuLoad = totalDiff > 0 ? Math.round(100 - (100 * idleDiff / totalDiff)) : 0;\n    lastCpu = endCpu;\n\n    const totalRam = os.totalmem();\n    const freeRam = os.freemem();\n    const usedRam = totalRam - freeRam;\n    const ramPercent = totalRam > 0 ? Math.round((usedRam / totalRam) * 100) : 0;\n\n    const disk = await getDiskUsage();\n\n    const payload = JSON.stringify({\n      nodeId: CONFIG.nodeId,\n      secret: CONFIG.secret,\n      stats: {\n        cpu: Math.max(0, Math.min(100, cpuLoad)),\n        ram: {\n          used: usedRam / 1024 / 1024 / 1024,\n          total: totalRam / 1024 / 1024 / 1024,\n          percent: ramPercent\n        },\n        disk: {\n          used: disk.used,\n          total: disk.total,\n          percent: disk.percent\n        },\n        uptime: os.uptime(),\n        os: \`\${os.type()} \${os.release()} (\${os.arch()})\`\n      }\n    });\n\n    const url = new URL(CONFIG.remoteUrl);\n    const client = url.protocol === 'https:' ? https : http;\n\n    const req = client.request({\n      hostname: url.hostname,\n      port: url.port || (url.protocol === 'https:' ? 443 : 80),\n      path: url.pathname,\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        'Content-Length': Buffer.byteLength(payload)\n      }\n    }, (res) => {\n      let data = '';\n      res.on('data', (chunk) => data += chunk);\n      res.on('end', () => {\n        if (res.statusCode === 200) {\n          console.log("[" + new Date().toLocaleTimeString() + "] 🟢 Sinyal ping berhasil dipancarkan ke receiver utama.");\n        } else {\n          console.log("[" + new Date().toLocaleTimeString() + "] ⚠️ Gagal kirim ping: " + res.statusCode);\n        }\n      });\n    });\n\n    req.on('error', (err) => {\n      console.error("[" + new Date().toLocaleTimeString() + "] 🔴 Gangguan koneksi receiver: " + err.message);\n    });\n\n    req.write(payload);\n    req.end();\n\n  } catch (err) {\n    console.error(\"Critical telemetry error: \" + err.message);\n  }\n}\n\nsetInterval(sendTelemetry, CONFIG.syncIntervalMs);\nsendTelemetry();\nEOF\nnode agent.js > agent.log 2>&1 &\necho -e \"\\n\\e[32m✔ [SUKSES] Satellite Agent berhasil dikonfigurasi dan dijalankan di background!\\e[0m\"\necho -e \"\\e[32m  Pantau hasilnya langsung pada dashboard receiver Anda sekarang!\\e[0m\\n\"\n`;
                              navigator.clipboard.writeText(command);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="absolute top-3 right-3 bg-purple-950/40 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/60 text-purple-300 font-semibold px-2.5 py-1 text-[10px] rounded transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                            {copied ? "TERSALIN!" : "COPY PERINTAH"}
                          </button>
                        </div>
                      </div>

                      {/* Manual & Pterodactyl Installation guidelines */}
                      <div className="space-y-4 bg-neutral-950/20 border border-neutral-900/60 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <h5 className="text-[11px] font-bold tracking-wider uppercase">METODE 2: UNDUH AGENT LANGSUNG VIA CURL (UNTUK VPS & PTERODACTYL)</h5>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Anda tidak perlu menyalin kode secara manual. File agen pemantau (<code className="text-neutral-200 px-1 bg-neutral-950 rounded">agent.js</code>) sudah disediakan secara terpisah di project ini dan dapat langsung diunduh secara direct dari panel Pterodactyl atau terminal VPS manapun dengan perintah:
                        </p>
                        <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400 select-all">
                          {`curl -sSO ${appUrl || "https://ais-dev-v2cen6525fj6konqjthq5u-683978000901.asia-southeast1.run.app"}/api/download-agent`}
                        </div>

                        <div className="border-t border-neutral-900 pt-3 space-y-2.5">
                          <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            LANGKAH PEMASANGAN PADA PANEL PTERODACTYL
                          </div>
                          <ol className="list-decimal list-inside space-y-2 text-[11px] text-neutral-400 leading-relaxed">
                            <li>
                              Pastikan Server Server/Egg Anda di panel Pterodactyl menggunakan environment <strong className="text-neutral-200">Node.js (versi 16 ke atas)</strong>.
                            </li>
                            <li>
                              Buka tab <strong className="text-neutral-200">File Manager</strong> di panel Pterodactyl Anda, lalu klik ikon terminal atau unduh filenya menggunakan link di atas.
                            </li>
                            <li>
                              Atau jalankan perintah unduh ini di console startup server Anda untuk mengunduh agent otomatis:
                              <div className="mt-1 bg-neutral-950/60 px-2.5 py-1 rounded font-mono text-[10px] text-neutral-300 select-all border border-neutral-900/40">
                                curl -sSO {appUrl || "https://ais-dev-v2cen6525fj6konqjthq5u-683978000901.asia-southeast1.run.app"}/api/download-agent
                              </div>
                            </li>
                            <li>
                              Atur Startup Command pada panel Pterodactyl Anda atau jalankan langsung via console dengan sintaks berikut:
                              <div className="mt-1 bg-neutral-950/60 px-2.5 py-1 rounded font-mono text-[10px] text-purple-300 select-all border border-neutral-900/40 whitespace-pre-wrap">
                                node agent.js --nodeId="{customNodeName}" --remoteUrl="{appUrl}"
                              </div>
                            </li>
                            <li>
                              Setelah dijalankan, server Pterodactyl Anda akan langsung muncul dalam daftar monitoring di atas secara realtime!
                            </li>
                          </ol>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* SECURITY ACCESS GATE FOR SENSITIVE TABS */}
          {["telegram", "terminal", "backup", "optimizer", "bandwidth"].includes(activeTab) && !adminSessionActive && (
            <motion.div
              key="security-lock"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-[#09090e]/95 border border-rose-500/30 rounded-2xl p-6 space-y-6 shadow-[0_0_25px_rgba(239,68,68,0.06)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-bl-lg"></div>
                
                {showForgotPassword ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-850">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotError("");
                          setForgotSuccess("");
                        }}
                        className="p-1 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="text-xs font-bold font-mono tracking-wider text-neutral-200 uppercase">Pemulihan Kata Sandi</h4>
                    </div>

                    {forgotError && (
                      <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-medium">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-450" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    {forgotSuccess && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{forgotSuccess}</span>
                      </div>
                    )}

                    {forgotPasswordStep === "request" ? (
                      <div className="space-y-4 text-center">
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Sistem akan mengirimkan 6-digit kode verifikasi reset kata sandi langsung ke Bot Telegram aktif Anda.
                        </p>
                        <button
                          type="button"
                          onClick={handleRequestForgotPasswordCode}
                          disabled={sendingResetRequest}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 disabled:opacity-50 text-neutral-200 font-bold rounded-xl transition uppercase tracking-wider font-mono text-xs flex justify-center items-center gap-2 cursor-pointer shadow-sm"
                        >
                          {sendingResetRequest ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                              Mengirim Kode...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-rose-400" />
                              Kirim Kode Reset Ke Telegram
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyForgotPassword} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 font-mono">Kode Verifikasi Telegram</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={forgotCodeInput}
                            onChange={(e) => setForgotCodeInput(e.target.value)}
                            placeholder="Masukkan 6-digit kode..."
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500/65 font-mono text-center tracking-widest text-sm transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 font-mono">Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="Kata sandi baru (min 4 karakter)..."
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500/65 font-mono text-center tracking-wide text-xs transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 font-mono">Konfirmasi Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            value={forgotNewPasswordConfirm}
                            onChange={(e) => setForgotNewPasswordConfirm(e.target.value)}
                            placeholder="Ulangi kata sandi baru..."
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500/65 font-mono text-center tracking-wide text-xs transition"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={verifyingResetRequest}
                          className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-neutral-950 disabled:opacity-50 font-bold rounded-xl transition uppercase tracking-wider font-mono text-xs flex justify-center items-center gap-2 cursor-pointer mt-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        >
                          {verifyingResetRequest ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                              Memverifikasi...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Reset & Buka Kunci
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Visual Lock Icon */}
                    <div className="flex flex-col items-center text-center space-y-3 pt-2">
                      <div className="p-4 bg-rose-950/40 border border-rose-500/35 text-rose-400 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                        <Lock className="w-8 h-8 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center justify-center gap-2">
                          SISTEM DIKUNCI
                          <span className="text-[9px] bg-rose-950/40 border border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded font-mono font-bold tracking-widest leading-none">
                            AUTH_REQUIRED
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-2 font-sans px-2 leading-relaxed">
                          Menu <span className="text-rose-400 font-bold font-mono">[{activeTab.toUpperCase()}]</span> dilindungi kata sandi administrator untuk mencegah penyalahgunaan oleh pihak ketiga / salah pencet secara tidak sengaja.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      {pinError && (
                        <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-medium">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-450" />
                          <span>{pinError}</span>
                        </div>
                      )}

                      {/* Password Entry */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleVerifyPIN(pinInput);
                        }}
                        className="space-y-3"
                      >
                        <div className="space-y-1.5 text-xs">
                          <label className="text-neutral-400 font-medium">Kunci Sandi Admin (Password)</label>
                          <input
                            type="password"
                            required
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="Masukkan password admin..."
                            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500/65 font-mono text-center tracking-widest text-sm transition text-rose-350"
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={verifyingPin}
                          className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-neutral-950 disabled:opacity-50 font-bold rounded-xl transition uppercase tracking-wider font-mono text-xs flex justify-center items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        >
                          {verifyingPin ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                              Memverifikasi...
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              BUKA AKSES MENU
                            </>
                          )}
                        </button>
                      </form>

                      {/* Pad / Help section */}
                      <div className="border-t border-neutral-850 pt-4 text-center space-y-3">
                        <p className="text-[10px] text-neutral-500 font-mono leading-normal">
                          🔑 Kata sandi standar bawaan (default) adalah: <span className="text-rose-400 font-bold bg-neutral-900 px-1.5 py-0.5 rounded">vps2026</span>
                        </p>
                        
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setForgotPasswordStep("request");
                              setForgotError("");
                              setForgotSuccess("");
                            }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono tracking-wide cursor-pointer transition bg-transparent border-0 outline-none"
                          >
                            Lupa Password Panel? Reset via Telegram
                          </button>
                        </div>

                        <p className="text-[9px] text-neutral-600 font-mono leading-relaxed">
                          Sesi aktif tersimpan temporer pada peramban web (session storage) & akan dikunci otomatis saat tab browser ditutup demi keamanan.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 border-t border-neutral-900 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 gap-4 select-none font-mono">
          <p>© 2026 Alfa Market 2</p>
          <p>Didesain untuk Server Pterodactyl Node.js & Layanan VPS Linux</p>
        </footer>

      </div>
    </div>
  );
}
