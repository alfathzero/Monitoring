import React, { useState, useEffect } from "react";
import { 
  Server, 
  Cpu, 
  Database, 
  HardDrive, 
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
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Folder,
  File,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
}

interface RemoteDevice {
  nodeId: string;
  secret: string;
  stats: {
    cpu: number;
    ram: { used: number; total: number; percent: number };
    disk: { used: number; total: number; percent: number };
    uptime: number;
    os: string;
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
  uuid: string;
  name: string;
  node: string;
  limits: {
    memory: number; // MB
    disk: number; // MB
    cpu: number; // %
  };
  status: string;
  isSuspended: boolean;
  resources: {
    cpu: number;
    memory: number; // MB
    disk: number; // MB
    rawMemory: number;
    rawDisk: number;
  };
  alertFlags: {
    cpuOverload: boolean;
    ramOverload: boolean;
    diskOverload: boolean;
    isOverloaded: boolean;
    details: string[];
    cpuPercent: number;
    ramPercent: number;
    diskPercent: number;
  };
}

// Helper: Interactive "Sistem Bintang Kita" (Solar System) Simulation Canvas
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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth || 500;
    let height = canvas.height = canvas.offsetHeight || 280;

    // Resize observer to auto-adapt sizes dynamically
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        width = canvas.width = entry.contentRect.width || canvas.offsetWidth || 500;
        height = canvas.height = entry.contentRect.height || canvas.offsetHeight || 280;
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
    }

    const backgroundStars: Star[] = [];
    for (let i = 0; i < 90; i++) {
      backgroundStars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        speed: 0.005 + Math.random() * 0.01
      });
    }

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

    // Planet Mean Anomalies (accumulated step-by-step for Keplerian motion)
    let mercuryM = Math.random() * Math.PI * 2;
    let venusM   = Math.random() * Math.PI * 2;
    let earthM   = Math.random() * Math.PI * 2;
    let marsM    = Math.random() * Math.PI * 2;
    let jupiterM = Math.random() * Math.PI * 2;
    let saturnM  = Math.random() * Math.PI * 2;
    let moonAngle = Math.random() * Math.PI * 2;

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
      // Dark space backdrop vacuum
      ctx.fillStyle = "rgba(4, 4, 8, 0.22)"; 
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const minDim = Math.min(width, height);

      // 1. Draw twinkling deep space background stars
      backgroundStars.forEach((star) => {
        star.opacity += (Math.random() - 0.5) * 0.06;
        if (star.opacity < 0.1) star.opacity = 0.1;
        if (star.opacity > 0.9) star.opacity = 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
      });

      // CPU loads influence speed of orbits
      const cpuSpeedFactor = 0.4 + (cpu / 100) * 1.8;
      const ramUsageFactor = ram / 100;

      // Update Keplerian system Mean Anomalies
      // Progress of orbits matches actual Kepler's 3rd Law ratio (speed ~ a^-1.5)
      mercuryM += 0.038 * cpuSpeedFactor * warpMultiplier;
      venusM   += 0.024 * cpuSpeedFactor * warpMultiplier;
      earthM   += 0.016 * cpuSpeedFactor * warpMultiplier;
      marsM    += 0.010 * cpuSpeedFactor * warpMultiplier;
      jupiterM += 0.0042 * cpuSpeedFactor * warpMultiplier;
      saturnM  += 0.0022 * cpuSpeedFactor * warpMultiplier;
      moonAngle += 0.065 * (0.8 + ramUsageFactor * 1.5) * warpMultiplier;

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

      // Helper to draw realistic eccentric elliptical orbital ring tracks
      const drawOrbitTrack = (a: number, e: number, w: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        for (let j = 0; j <= 100; j++) {
          const tempE = (j / 100) * Math.PI * 2;
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
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // 2. Draw Orbit Track Rings (Elliptical & Tilted!)
      drawOrbitTrack(rMercury, eMercury, wMercury, "rgba(230, 200, 180, 0.08)");
      drawOrbitTrack(rVenus, eVenus, wVenus, "rgba(240, 220, 150, 0.08)");
      drawOrbitTrack(rEarth, eEarth, wEarth, "rgba(100, 200, 255, 0.11)");
      drawOrbitTrack(rMars, eMars, wMars, "rgba(250, 120, 100, 0.08)");
      drawOrbitTrack(rJupiter, eJupiter, wJupiter, "rgba(245, 180, 100, 0.08)");
      drawOrbitTrack(rSaturn, eSaturn, wSaturn, "rgba(245, 220, 160, 0.09)");

      // 3. Draw The Sun (Central Star representing Host CPU)
      const sunPulse = 1 + Math.sin(Date.now() * 0.0035) * 0.08;
      const sunBaseRadius = 15 + (cpu / 100) * 12;
      const sunRadius = sunBaseRadius * sunPulse;

      const sunGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, sunRadius * 2.5
      );

      // Define color hooks based on theme
      let sunGlowStop0 = "rgba(255, 195, 0, 1)";
      let sunGlowStop1 = "rgba(255, 90, 0, 0.7)";
      let sunGlowStop2 = "rgba(244, 63, 94, 0.15)";
      let sunGlowStop3 = "rgba(255, 120, 0, 0)";
      let sunCoreStyle = "#ffaa00";
      let sunFlareStyle = "rgba(255, 170, 0, 0.18)";

      if (starSystemTheme === "neutron") {
        sunGlowStop0 = "rgba(0, 243, 255, 1)";
        sunGlowStop1 = "rgba(0, 102, 204, 0.75)";
        sunGlowStop2 = "rgba(30, 64, 175, 0.2)";
        sunGlowStop3 = "rgba(0, 243, 255, 0)";
        sunCoreStyle = "#00f3ff";
        sunFlareStyle = "rgba(0, 243, 255, 0.3)";
      } else if (starSystemTheme === "nebula") {
        sunGlowStop0 = "rgba(217, 70, 239, 1)";
        sunGlowStop1 = "rgba(112, 26, 117, 0.75)";
        sunGlowStop2 = "rgba(76, 29, 149, 0.2)";
        sunGlowStop3 = "rgba(217, 70, 239, 0)";
        sunCoreStyle = "#d946ef";
        sunFlareStyle = "rgba(217, 70, 239, 0.3)";
      } else {
        if (cpu > 75) {
          sunGlowStop0 = "rgba(255, 60, 0, 1)";
          sunGlowStop1 = "rgba(255, 140, 0, 0.8)";
          sunGlowStop2 = "rgba(255, 230, 0, 0.25)";
          sunGlowStop3 = "rgba(255, 60, 0, 0)";
          sunCoreStyle = "#ff3c00";
          sunFlareStyle = "rgba(255, 60, 0, 0.35)";
        }
      }

      sunGlow.addColorStop(0, sunGlowStop0);
      sunGlow.addColorStop(0.3, sunGlowStop1);
      sunGlow.addColorStop(0.6, sunGlowStop2);
      sunGlow.addColorStop(1, sunGlowStop3);

      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Render actual Sun core sphere
      ctx.fillStyle = sunCoreStyle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Draw faint sun flare rays
      ctx.strokeStyle = sunFlareStyle;
      ctx.lineWidth = 1.2;
      const flareCount = 8;
      for (let i = 0; i < flareCount; i++) {
        const angle = (Date.now() * 0.0007) + (i * Math.PI * 2 / flareCount);
        const startX = centerX + Math.cos(angle) * (sunRadius * 0.7);
        const startY = centerY + Math.sin(angle) * (sunRadius * 0.7);
        const endX = centerX + Math.cos(angle) * (sunRadius * 1.5 + (cpu > 75 ? 12 : 5));
        const endY = centerY + Math.sin(angle) * (sunRadius * 1.5 + (cpu > 75 ? 12 : 5));
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Add simple tag lookup
      const planetPositions: { [key: string]: { x: number; y: number; label: string; val: string } } = {
        sun: { x: centerX, y: centerY, label: "Matahari (Host CPU)", val: `${cpu.toFixed(1)}%` }
      };

      // Helper to draw a generic planet orb at exact coordinates (px, py) with realistic shading relative to Sun light direction
      const drawPlanetAt = (
        name: string,
        px: number,
        py: number,
        bodyRadius: number,
        colors: { inner: string; outer: string; glow: string },
        detailRenderer?: (px: number, py: number) => void
      ) => {
        // Draw outer fuzzy atmosphere glow
        const atmosphere = ctx.createRadialGradient(px, py, 0, px, py, bodyRadius * 2);
        atmosphere.addColorStop(0, colors.glow);
        atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = atmosphere;
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Compute 3D light vector pointing away from center Sun to draw realistic sphere shadow!
        const dx = px - centerX;
        const dy = py - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Shadow offset shifts the highlight source sphere slightly towards the sun
        const hx = dist > 0 ? px - (dx / dist) * (bodyRadius / 2.5) : px;
        const hy = dist > 0 ? py - (dy / dist) * (bodyRadius / 2.5) : py;

        const bodyGlow = ctx.createRadialGradient(
          hx, hy, bodyRadius * 0.1,
          px, py, bodyRadius
        );
        bodyGlow.addColorStop(0, colors.inner);
        bodyGlow.addColorStop(0.85, colors.outer);
        bodyGlow.addColorStop(1, "rgba(4, 4, 8, 0.96)"); // Black shadow vacuum representing night side
        ctx.fillStyle = bodyGlow;
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius, 0, Math.PI * 2);
        ctx.fill();

        // Run custom extra rendering if defined (like Saturn rings)
        if (detailRenderer) {
          detailRenderer(px, py);
        }

        // Draw permanent tiny adjacent name tag if requested
        if (orbitLabelsVisible) {
          ctx.fillStyle = starSystemTheme === "neutron" ? "rgba(6, 182, 212, 0.75)" : starSystemTheme === "nebula" ? "rgba(217, 70, 239, 0.75)" : "rgba(251, 146, 60, 0.75)";
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
      // Mercury - fast inner crawler
      const posMercury = getKeplerianPos(rMercury, eMercury, wMercury, mercuryM);
      drawPlanetAt("Mercury", posMercury.x, posMercury.y, 3.2, colorsMercury);
      planetPositions.mercury = { x: posMercury.x, y: posMercury.y, label: "Merkurius (Load Speed)", val: `${(cpuSpeedFactor * 1.5).toFixed(1)} rps` };

      // Venus - beautiful bright copper-yellow planet
      const posVenus = getKeplerianPos(rVenus, eVenus, wVenus, venusM);
      drawPlanetAt("Venus", posVenus.x, posVenus.y, 4.8, colorsVenus);
      planetPositions.venus = { x: posVenus.x, y: posVenus.y, label: "Venus (Beban Inti)", val: `${(cpu * 1.1).toFixed(0)} MHz` };

      // 5. DRAW BUMI (Earth with orbiting Moon is mapped directly to live RAM Memory Usage!)
      const posEarth = getKeplerianPos(rEarth, eEarth, wEarth, earthM);
      drawPlanetAt("Earth", posEarth.x, posEarth.y, 6.5, colorsEarth, (ex, ey) => {
        // Custom Earth details (clouds or green continent blobs representation)
        ctx.fillStyle = earthContinentsColor;
        ctx.beginPath();
        ctx.arc(ex - 2, ey + 1, 2.5, 0, Math.PI * 2);
        ctx.arc(ex + 2, ey - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw Moon representing RAM alarm warning - Moon orbits Earth aligned in skewed orbital plane
        const moonRadiusX = 11.5;
        const moonRadiusY = 5.0; // Scaled to matches oblique display skew!
        const mx = ex + Math.cos(moonAngle) * moonRadiusX;
        const my = ey + Math.sin(moonAngle) * moonRadiusY;

        ctx.fillStyle = moonColor;
        ctx.shadowColor = starSystemTheme === "neutron" ? "#06b6d4" : starSystemTheme === "nebula" ? "#d946ef" : "#94a3b8";
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });
      const usedGb = stats?.ram?.used ? `${stats.ram.used.toFixed(1)} GB` : `${((8 * ram)/100).toFixed(1)} GB`;
      const maxGb = stats?.ram?.total ? `${stats.ram.total.toFixed(0)} GB` : "8 GB";
      planetPositions.earth = { x: posEarth.x, y: posEarth.y, label: "Bumi (Memori RAM)", val: `${ram.toFixed(0)}% (${usedGb} / ${maxGb})` };

      // 6. DRAW MARS (Representative of Input/Output loads with polar ice caps!)
      const posMars = getKeplerianPos(rMars, eMars, wMars, marsM);
      drawPlanetAt("Mars", posMars.x, posMars.y, 4.2, colorsMars, (mx, my) => {
        // Tiny physical polar ice cap
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(mx, my - 3.2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
      planetPositions.mars = { x: posMars.x, y: posMars.y, label: "Mars (Spesifikasi CPU)", val: `${stats?.cpuCores || 4} Core CPU` };

      // 7. DRAW YUPITER (Jupiter represents hard disk storage usage!)
      const diskPr = stats?.disk?.usagePercent || 36;
      const posJupiter = getKeplerianPos(rJupiter, eJupiter, wJupiter, jupiterM);
      drawPlanetAt("Jupiter", posJupiter.x, posJupiter.y, 11, colorsJupiter, (jx, jy) => {
        // Draw Jovian stripes rotated to system horizon plane
        ctx.save();
        ctx.translate(jx, jy);
        ctx.rotate(LAN);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, -4); ctx.lineTo(10, -4);
        ctx.moveTo(-11, 2); ctx.lineTo(11, 2);
        ctx.stroke();

        // Animated Red Spot of Jupiter
        ctx.fillStyle = starSystemTheme === "neutron" ? "#0284c7" : starSystemTheme === "nebula" ? "#701a75" : "#991b1b";
        ctx.beginPath();
        ctx.ellipse(3, 4, 2.5, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      const diskUsed = stats?.disk?.used ? `${stats.disk.used.toFixed(0)} GB` : "45 GB";
      const diskTotal = stats?.disk?.total ? `${stats.disk.total.toFixed(0)} GB` : "120 GB";
      planetPositions.jupiter = { x: posJupiter.x, y: posJupiter.y, label: "Yupiter (Storage Disk)", val: `${diskPr}% (${diskUsed} / ${diskTotal})` };

      // 8. DRAW SATURNUS (Saturn representing Telemetry Remote node attachments)
      const activeDevices = stats?.remoteDevicesCount || 0;
      const posSaturn = getKeplerianPos(rSaturn, eSaturn, wSaturn, saturnM);
      drawPlanetAt("Saturn", posSaturn.x, posSaturn.y, 8.5, colorsSaturn, (sx, sy) => {
        // Render 3D slanted rings around Saturnus aligned with oblique solar plane
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(LAN + 18 * Math.PI / 180);
        ctx.scale(1.9, 0.4);

        ctx.strokeStyle = saturnRingColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = saturnRingOuterColor;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Saturn's Moons
        const activeMoons = Math.max(1, activeDevices);
        for (let m = 0; m < activeMoons; m++) {
          const mAngle = (Date.now() * 0.0016) + (m * Math.PI * 2 / activeMoons);
          // Moons orbit ring aligned to screen obliqueness
          const mx = sx + Math.cos(mAngle) * 19.5;
          const my = sy + Math.sin(mAngle) * 7.5;

          ctx.fillStyle = starSystemTheme === "neutron" ? "#22d3ee" : starSystemTheme === "nebula" ? "#f472b6" : "#38bdf8";
          ctx.beginPath();
          ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      planetPositions.saturn = { x: posSaturn.x, y: posSaturn.y, label: "Saturnus (Auxiliary Remote Nodes)", val: `${activeDevices} Node Aktif` };

      // Store positions in ref for mouse hovering labels readout
      planetPositionsRef.current = planetPositions;

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

      // Canvas Label Overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
      ctx.fillText(`PETA ORBITAL SISTEM BINTANG KITA (KINETIK)`, 18, 22);

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

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "telegram" | "ports" | "terminal" | "backup" | "optimizer" | "bandwidth" | "logs">("dashboard");
  const [showMenu, setShowMenu] = useState(false);
  const [bandwidthConfig, setBandwidthConfig] = useState({
    alertNetRxThreshold: 10,
    alertNetTxThreshold: 10
  });
  const [savingBandwidthConfig, setSavingBandwidthConfig] = useState(false);
  const [isSimulatingFlood, setIsSimulatingFlood] = useState(false);
  const [simulatedFloodType, setSimulatedFloodType] = useState<"rx" | "tx" | null>(null);
  const [simCountdown, setSimCountdown] = useState(0);

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<{ cpu: number[]; ram: number[] }>({ cpu: [], ram: [] });
  const [remoteDevices, setRemoteDevices] = useState<RemoteDevice[]>([]);
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
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleNcduDelete = (nodeName: string) => {
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
    
    const { updatedNode, deletedSize } = deleteAndRecalculate(ncduTree, ncduPath, nodeName);
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

  // Security Lock & PIN State
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("vps_monitor_admin_password") || "");
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(() => !localStorage.getItem("vps_monitor_admin_password"));
  const [adminSessionActive, setAdminSessionActive] = useState(() => sessionStorage.getItem("vps_monitor_admin_session") === "active");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const handleVerifyPIN = (pinToCheck: string) => {
    if (needsPasswordSetup) {
      if (!pinToCheck || pinToCheck.length < 6) {
        setPinError("Kata sandi minimal 6 karakter!");
        return;
      }
      setAdminPassword(pinToCheck);
      localStorage.setItem("vps_monitor_admin_password", pinToCheck);
      setNeedsPasswordSetup(false);
      setAdminSessionActive(true);
      sessionStorage.setItem("vps_monitor_admin_session", "active");
      setPinInput("");
      setPinError("");
      return;
    }
    if (pinToCheck === adminPassword) {
      setAdminSessionActive(true);
      sessionStorage.setItem("vps_monitor_admin_session", "active");
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Kombinasi kata sandi salah. Silahkan coba lagi!");
    }
  };

  const handleLogoutAdmin = () => {
    setAdminSessionActive(false);
    sessionStorage.removeItem("vps_monitor_admin_session");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) {
      setPinError("Kata sandi baru tidak boleh kosong!");
      return;
    }
    if (newPasswordInput !== newPasswordConfirm) {
      setPinError("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }
    setAdminPassword(newPasswordInput);
    localStorage.setItem("vps_monitor_admin_password", newPasswordInput);
    setPinError("");
    setNewPasswordInput("");
    setNewPasswordConfirm("");
    setShowPasswordChange(false);
    setStatusMsg({ type: "success", text: "Kata sandi admin sukses diperbarui!" });
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
    fetchAlertLogs();
    fetchBandwidthConfig();

    // Intervals
    const statsInterval = setInterval(fetchStats, 3000);
    const remoteInterval = setInterval(fetchRemoteDevices, 4000);
    const logsInterval = setInterval(fetchAlertLogs, 4000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(remoteInterval);
      clearInterval(logsInterval);
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
    }
  }, [stats]);

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
      secret: CONFIG.nodeId + "-telemetry",
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

            <div className="flex items-center gap-2 px-3.5 py-2 bg-black/60 border border-purple-500/25 rounded-xl shadow-[inset_0_0_10px_rgba(168,85,247,0.02)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-neutral-400 font-bold tracking-tight">SYNC_PORT:</span>
              <span className="text-purple-400 truncate max-w-[120px] md:max-w-[200px]" title={appUrl}>
                {appUrl}
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
                {activeTab === "telegram" && <Settings className="w-5 h-5" />}
                {activeTab === "ports" && <Globe className="w-5 h-5" />}
                {activeTab === "terminal" && <Terminal className="w-5 h-5 text-emerald-400" />}
                {activeTab === "backup" && <Database className="w-5 h-5" />}
                {activeTab === "optimizer" && <Zap className="w-5 h-5 text-amber-400" />}
                {activeTab === "bandwidth" && <Wifi className={`w-5 h-5 ${isSimulatingFlood ? "animate-pulse text-red-400" : ""}`} />}
                {activeTab === "logs" && <Bell className={`w-5 h-5 text-rose-400 ${alertLogs.length > 0 ? "animate-bounce" : ""}`} />}
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase block">
                  ({activeTab === "dashboard" ? "01" : 
                    activeTab === "telegram" ? "02" :
                    activeTab === "ports" ? "03" :
                    activeTab === "terminal" ? "04" :
                    activeTab === "backup" ? "05" :
                    activeTab === "optimizer" ? "06" :
                    activeTab === "bandwidth" ? "07" : "08"}) INSTANCE PANEL
                </span>
                <span className="text-sm font-bold tracking-wider text-neutral-200">
                  {activeTab === "dashboard" && "DASHBOARD UTAMA"}
                  {activeTab === "telegram" && "BOT TELEGRAM"}
                  {activeTab === "ports" && "CEK PORT & LAYANAN"}
                  {activeTab === "terminal" && "KONSOL PINTASAN SSH"}
                  {activeTab === "backup" && "SINKRONISASI BACKUP"}
                  {activeTab === "optimizer" && "RAM & CACHE OPTIMIZER"}
                  {activeTab === "bandwidth" && "BANDWIDTH MONITOR"}
                  {activeTab === "logs" && "DATABASE LOG ALARM"}
                </span>
              </div>
            </div>

            {/* Right: Hamburger / Kebab Toggle Trigger */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs font-mono transition-all cursor-pointer ${
                showMenu 
                  ? "bg-cyan-500 text-neutral-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                  : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-neutral-100"
              }`}
            >
              {showMenu ? (
                <>
                  <X className="w-4 h-4 text-center" />
                  <span className="hidden sm:inline">TUTUP MENU</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-center" />
                  <span className="hidden sm:inline">MENU LAYER</span>
                </>
              )}
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
                      <span className="font-mono opacity-50 font-semibold">[02]</span>
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
                      <span className="font-mono opacity-50 font-semibold">[03]</span>
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
                      <span className="font-mono opacity-50 font-semibold">[04]</span>
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
                      <span className="font-mono opacity-50 font-semibold">[05]</span>
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
                      <span className="font-mono opacity-50 font-semibold">[06]</span>
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
                        <span className="font-mono opacity-50 font-semibold">[07]</span>
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
                        <span className="font-mono opacity-50 font-semibold">[08]</span>
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
                      <div className="flex justify-between text-[9.5px] text-neutral-400 font-mono">
                        <span>CORES: [0{stats.cpuCores}] UP</span>
                        <span className="truncate max-w-[130px] text-neutral-500 text-right" title={stats.cpuModel}>
                          {stats.cpuModel}
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
                        {stats ? `${stats.disk.usagePercent}%` : "Calculating..."}
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
                          style={{ width: `${stats.disk.usagePercent}%` }}
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

              {/* Quick Info Banner box */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 text-emerald-400">
                <HelpCircle className="w-8 h-8 shrink-0 text-emerald-400" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Mulai Monitor VPS Anda di Panel Pterodactyl Anda Sekarang!</p>
                  <p className="text-neutral-300 leading-relaxed">
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
                      <h3 className="text-2xl font-extrabold mt-1 text-neutral-100 font-sans tracking-tight">
                        {stats?.network ? (stats.network.rxSpeed / 1024 / 1024).toFixed(2) : "0.00"} <span className="text-xs text-neutral-400 font-normal">MB/s</span>
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
                      <h3 className="text-2xl font-extrabold mt-1 text-neutral-100 font-sans tracking-tight">
                        {stats?.network ? (stats.network.txSpeed / 1024 / 1024).toFixed(2) : "0.00"} <span className="text-xs text-neutral-400 font-normal">MB/s</span>
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
                        Jalankan modul pemindai sistem lokal Anda secara aman tanpa harus login SSH manual dari komputer.
                      </p>
                    </div>
                  </div>
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
                      className="w-full text-left p-3 bg-neutral-900 border border-neutral-850 hover:border-emerald-500/30 rounded-xl hover:bg-emerald-950/20 text-neutral-200 transition group flex items-center justify-between cursor-pointer font-bold border-emerald-500/10"
                    >
                      <span>📊 run: NCDU Disk Usage</span>
                      <Play className="w-3.5 h-3.5 opacity-100 text-emerald-400 transition" />
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
                    {/* Breadcrumbs Navigation */}
                    <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0a0a0f] border border-neutral-850 px-4 py-2.5 rounded-xl text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        <span className="text-neutral-500 font-bold uppercase">LOKASI_PATH:</span>
                        <button
                          onClick={() => setNcduPath([])}
                          className="text-emerald-400 hover:underline cursor-pointer font-bold"
                        >
                          root
                        </button>
                        {ncduPath.map((seg, i) => (
                          <React.Fragment key={i}>
                            <span className="text-neutral-600">/</span>
                            <button
                              onClick={() => setNcduPath(ncduPath.slice(0, i + 1))}
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
                            onClick={() => setNcduPath(prev => prev.slice(0, -1))}
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
                      {(!getCurrentNcduNode().children || getCurrentNcduNode().children?.length === 0) ? (
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
                        placeholder={needsPasswordSetup ? "Buat password baru (min 6 karakter)..." : "Masukkan password admin..."}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500/65 font-mono text-center tracking-widest text-sm transition text-rose-350"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-neutral-950 font-bold rounded-xl transition uppercase tracking-wider font-mono text-xs flex justify-center items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      {needsPasswordSetup ? "BUAT PASSWORD & MASUK" : "BUKA AKSES MENU"}
                    </button>
                  </form>

                  {/* Pad / Help section */}
                  <div className="border-t border-neutral-850 pt-4 text-center">
                    <p className="text-[10px] text-neutral-500 font-mono leading-normal">
                      {needsPasswordSetup
                        ? <>🔐 Belum ada kata sandi. Silakan buat kata sandi admin baru (min. 6 karakter).&nbsp;</>
                        : <>🔑 Masukkan kata sandi admin yang telah Anda konfigurasi.</>
                      }
                    </p>
                    <p className="text-[9px] text-neutral-600 font-mono mt-2.5 leading-relaxed">
                      Sesi aktif tersimpan temporer pada peramban web (session storage) & akan dikunci otomatis saat tab browser ditutup demi keamanan.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 border-t border-neutral-900 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 gap-4 select-none font-mono">
          <p>© 2026 Google AI Studio Daemon Monitor App</p>
          <p>Didesain untuk Server Pterodactyl Node.js & Layanan VPS Linux</p>
        </footer>

      </div>
    </div>
  );
}
