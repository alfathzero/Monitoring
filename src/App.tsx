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
  Activity
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

    // Planet angles states (accumulates step-by-step)
    let mercuryAngle = Math.random() * Math.PI * 2;
    let venusAngle = Math.random() * Math.PI * 2;
    let earthAngle = Math.random() * Math.PI * 2;
    let marsAngle = Math.random() * Math.PI * 2;
    let jupiterAngle = Math.random() * Math.PI * 2;
    let saturnAngle = Math.random() * Math.PI * 2;
    let moonAngle = Math.random() * Math.PI * 2;

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

      // Update planetary angles with custom warp speed
      mercuryAngle += 0.032 * cpuSpeedFactor * warpMultiplier;
      venusAngle += 0.018 * cpuSpeedFactor * warpMultiplier;
      earthAngle += 0.012 * cpuSpeedFactor * warpMultiplier;
      marsAngle += 0.008 * cpuSpeedFactor * warpMultiplier;
      jupiterAngle += 0.0045 * cpuSpeedFactor * warpMultiplier;
      saturnAngle += 0.0022 * cpuSpeedFactor * warpMultiplier;
      moonAngle += 0.065 * (0.8 + ramUsageFactor * 1.5) * warpMultiplier;

      // Define standard planetary orbits radius
      const rMercury = minDim * 0.13;
      const rVenus = minDim * 0.21;
      const rEarth = minDim * 0.31;
      const rMars = minDim * 0.41;
      const rJupiter = minDim * 0.51;
      const rSaturn = minDim * 0.63;

      const orbits = [
        { r: rMercury, color: "rgba(230, 200, 180, 0.09)", name: "Merkurius" },
        { r: rVenus, color: "rgba(240, 220, 150, 0.09)", name: "Venus" },
        { r: rEarth, color: "rgba(100, 200, 255, 0.12)", name: "Bumi" },
        { r: rMars, color: "rgba(250, 120, 100, 0.09)", name: "Mars" },
        { r: rJupiter, color: "rgba(245, 180, 100, 0.09)", name: "Yupiter" },
        { r: rSaturn, color: "rgba(245, 220, 160, 0.1)", name: "Saturnus" }
      ];

      // 2. Draw Orbit Track Rings (dashed elegant lines)
      ctx.lineWidth = 1;
      orbits.forEach((orbit) => {
        ctx.strokeStyle = orbit.color;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbit.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]); // Reset dash

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

      // Helper to draw a generic planet orb
      const drawPlanet = (
        name: string,
        angle: number,
        orbitRadius: number,
        bodyRadius: number,
        colors: { inner: string; outer: string; glow: string },
        detailRenderer?: (px: number, py: number) => void
      ) => {
        const px = centerX + Math.cos(angle) * orbitRadius;
        const py = centerY + Math.sin(angle) * orbitRadius;

        // Draw outer fuzzy atmosphere glow
        const atmosphere = ctx.createRadialGradient(px, py, 0, px, py, bodyRadius * 2);
        atmosphere.addColorStop(0, colors.glow);
        atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = atmosphere;
        ctx.beginPath();
        ctx.arc(px, py, bodyRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw planet solid body
        const bodyGlow = ctx.createRadialGradient(
          px - bodyRadius/3, py - bodyRadius/3, 0,
          px, py, bodyRadius
        );
        bodyGlow.addColorStop(0, colors.inner);
        bodyGlow.addColorStop(1, colors.outer);
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
      let colorsMercury = { inner: "#fcd34d", outer: "#78350f", glow: "rgba(251, 191, 36, 0.35)" };
      let colorsVenus = { inner: "#ffed4a", outer: "#e05600", glow: "rgba(234, 179, 8, 0.4)" };
      let colorsEarth = {
        inner: ram > 80 ? "#f43f5e" : "#00cdff",
        outer: ram > 80 ? "#9f1239" : "#1e40af",
        glow: ram > 80 ? "rgba(244, 63, 94, 0.45)" : "rgba(30, 64, 175, 0.4)"
      };
      let colorsMars = { inner: "#f87171", outer: "#991b1b", glow: "rgba(239, 68, 68, 0.42)" };
      let colorsJupiter = { inner: "#f59e0b", outer: "#78350f", glow: "rgba(245, 158, 11, 0.3)" };
      let colorsSaturn = { inner: "#fcd34d", outer: "#d97706", glow: "rgba(217, 119, 6, 0.3)" };
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

      // 4. DRAW VENUS (Mercury & Venus)
      // Mercury - fast inner crawler
      const posMercury = drawPlanet("Mercury", mercuryAngle, rMercury, 3, colorsMercury);
      planetPositions.mercury = { x: posMercury.x, y: posMercury.y, label: "Merkurius (Load Speed)", val: `${(cpuSpeedFactor * 1.5).toFixed(1)} rps` };

      // Venus - beautiful bright copper golden planet
      const posVenus = drawPlanet("Venus", venusAngle, rVenus, 4.5, colorsVenus);
      planetPositions.venus = { x: posVenus.x, y: posVenus.y, label: "Venus (Beban Inti)", val: `${(cpu * 1.1).toFixed(0)} MHz` };

      // 5. DRAW BUMI (Earth with orbiting Moon is mapped directly to live RAM Memory Usage!)
      const posEarth = drawPlanet("Earth", earthAngle, rEarth, 6.5, colorsEarth, (ex, ey) => {
        // Custom Earth details (clouds or green continent blobs representation)
        ctx.fillStyle = earthContinentsColor;
        ctx.beginPath();
        ctx.arc(ex - 2, ey + 1, 2.5, 0, Math.PI * 2);
        ctx.arc(ex + 2, ey - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw Moon representing RAM alarm warning
        const moonRadius = 6.4 + (stats?.ram?.free ? 6.5 : 10);
        const mx = ex + Math.cos(moonAngle) * moonRadius;
        const my = ey + Math.sin(moonAngle) * moonRadius;

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

      // 6. DRAW MARS (Representative of Input/Output loads)
      const posMars = drawPlanet("Mars", marsAngle, rMars, 4, colorsMars);
      planetPositions.mars = { x: posMars.x, y: posMars.y, label: "Mars (Spesifikasi CPU)", val: `${stats?.cpuCores || 4} Core CPU` };

      // 7. DRAW YUPITER (Jupiter represents hard disk storage usage!)
      const diskPr = stats?.disk?.usagePercent || 36;
      const posJupiter = drawPlanet("Jupiter", jupiterAngle, rJupiter, 10, colorsJupiter, (jx, jy) => {
        // Draw recognizable Jovian colored stripes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(jx - 9.2, jy - 3); ctx.lineTo(jx + 9.2, jy - 3);
        ctx.moveTo(jx - 9.4, jy + 2); ctx.lineTo(jx + 9.4, jy + 2);
        ctx.stroke();

        // Famous Great Red Spot of Jupiter
        ctx.fillStyle = starSystemTheme === "neutron" ? "#0284c7" : starSystemTheme === "nebula" ? "#701a75" : "#991b1b";
        ctx.beginPath();
        ctx.arc(jx + 3, jy + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      const diskUsed = stats?.disk?.used ? `${stats.disk.used.toFixed(0)} GB` : "45 GB";
      const diskTotal = stats?.disk?.total ? `${stats.disk.total.toFixed(0)} GB` : "120 GB";
      planetPositions.jupiter = { x: posJupiter.x, y: posJupiter.y, label: "Yupiter (Storage Disk)", val: `${diskPr}% (${diskUsed} / ${diskTotal})` };

      // 8. DRAW SATURNUS (Saturn representing Telemetry Remote node attachments)
      // Check count of active remote devices
      const activeDevices = stats?.remoteDevicesCount || 0; 
      const posSaturn = drawPlanet("Saturn", saturnAngle, rSaturn, 7.5, colorsSaturn, (sx, sy) => {
        // Render detailed slanted ring around Saturnus
        ctx.strokeStyle = saturnRingColor;
        ctx.lineWidth = 1.3;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(18 * Math.PI / 180); // 18 degree rings inclination
        ctx.scale(1.9, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, 7.8, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary outer ring layer
        ctx.strokeStyle = saturnRingOuterColor;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Saturn's Moons (Auxiliary nodes representation orbiting Saturn!)
        // Draw mini glowing orb satellites to match connected nodes
        const activeMoons = Math.max(1, activeDevices);
        for (let m = 0; m < activeMoons; m++) {
          const mAngle = (Date.now() * 0.0016) + (m * Math.PI * 2 / activeMoons);
          const mx = sx + Math.cos(mAngle) * 16.5;
          const my = sy + Math.sin(mAngle) * 16.5;

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "telegram" | "script" | "remote" | "logs" | "pterodactyl">("dashboard");
  const [pteroConfig, setPteroConfig] = useState<PterodactylConfig>({
    pterodactylDomain: "",
    pterodactylApiKey: "",
    pterodactylActive: false
  });
  const [pteroServers, setPteroServers] = useState<PterodactylServer[]>([]);
  const [isLoadingPtero, setIsLoadingPtero] = useState(false);
  const [pteroError, setPteroError] = useState<string | null>(null);
  const [pteroLastSync, setPteroLastSync] = useState<string | null>(null);
  const [savingPteroConfig, setSavingPteroConfig] = useState(false);
  const [pteroDiagSteps, setPteroDiagSteps] = useState<{ title: string; status: "success" | "warning" | "danger" | "pending"; message: string; details?: string }[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

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

  // Self App URL from user environment if needed, fallbacks to window.location.origin
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchStats();
    fetchConfig();
    fetchRemoteDevices();
    fetchAlertLogs();
    fetchPteroConfig();

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

  // Synchronize Pterodactyl server loads periodically
  useEffect(() => {
    if (pteroConfig.pterodactylActive) {
      syncPteroServers();
      const pteroInterval = setInterval(syncPteroServers, 12000); // refresh every 12 seconds
      return () => clearInterval(pteroInterval);
    }
  }, [pteroConfig.pterodactylActive, pteroConfig.pterodactylDomain, pteroConfig.pterodactylApiKey]);

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

  const fetchPteroConfig = async () => {
    try {
      const res = await fetch("/api/pterodactyl-config");
      const json = await res.json();
      if (json.success && json.data) {
        setPteroConfig(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil konfigurasi Pterodactyl:", err);
    }
  };

  const syncPteroServers = async () => {
    setIsLoadingPtero(true);
    setPteroError(null);
    try {
      const res = await fetch("/api/pterodactyl-servers");
      const json = await res.json();
      if (json.success) {
        setPteroServers(json.data || []);
        setPteroLastSync(new Date().toLocaleTimeString("id-ID"));
      } else {
        setPteroError(json.error || "Gagal sinkronisasi data server.");
      }
    } catch (err: any) {
      setPteroError("Gagal menghubungi server backend: " + err.message);
    } finally {
      setIsLoadingPtero(false);
    }
  };

  const handleSavePteroConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPteroConfig(true);
    try {
      const res = await fetch("/api/pterodactyl-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pteroConfig)
      });
      const json = await res.json();
      if (json.success) {
        alert("Konfigurasi Pterodactyl berhasil disimpan!");
        if (pteroConfig.pterodactylActive) {
          syncPteroServers();
        }
      } else {
        alert("Gagal menyimpan konfigurasi: " + json.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingPteroConfig(false);
    }
  };

  const handleRunPteroDiagnostics = async () => {
    setIsDiagnosing(true);
    setPteroDiagSteps([
      { title: "Normalisasi Format Domain", status: "pending", message: "Sedang berjalan..." },
      { title: "Resolusi DNS Selesai", status: "pending", message: "Menunggu langkah sebelumnya..." },
      { title: "Uji Port/Web Server", status: "pending", message: "Menunggu langkah sebelumnya..." },
      { title: "Uji API Key Pterodactyl", status: "pending", message: "Menunggu langkah sebelumnya..." }
    ]);

    try {
      const res = await fetch("/api/pterodactyl-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: pteroConfig.pterodactylDomain,
          apiKey: pteroConfig.pterodactylApiKey
        })
      });
      const json = await res.json();
      if (json.success && json.steps) {
        setPteroDiagSteps(json.steps);
      } else {
        setPteroDiagSteps([
          { title: "Koneksi Backend Gagal", status: "danger", message: "Backend didiagnosa error: " + (json.error || "Gagal") }
        ]);
      }
    } catch (err: any) {
      setPteroDiagSteps([
        { title: "Koneksi Backend Gagal", status: "danger", message: "Gagal menghubungi backend untuk diagnosa: " + err.message }
      ]);
    } finally {
      setIsDiagnosing(false);
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
        botResponse = `✨ *Halo! Saya Bot VPS Monitor Anda.* 🤖\n\nSaya siap memantau performa VPS / Server Pterodactyl Anda secara realtime.\n\n*Daftar Perintah:*\n📊 /status - Cek status performa\n🖥️ /cpu - Detail processor\n📟 /ram - Detail RAM\n💾 /disk - Kapasitas storage\n🌍 /remote - Ringkas remote server\n⏱️ /ping - Latency bot\nℹ️ /help - Bantuan`;
      } else if (trimmed === "/help") {
        botResponse = `*Panduan Perintah VPS Monitor Bot:*\n\n/status - Menampilkan visual bar CPU, RAM, dan Disk\n/cpu - Info clock, core detail, dan load\n/ram - Info total, gratis, dan terpakai\n/disk - Info partisi penyimpanan server\n/remote - Daftar node Pterodactyl luar\n/ping - Respons latensi bot`;
      } else if (trimmed === "/ping") {
        botResponse = `🏓 *PONG! BOT AKTIF & RESPONSIF*\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Latency:* \`12 ms\`\n🚀 *Status Server:* \`ONLINE\`\n\n💻 *INFORMASI SPESIFIKASI VPS (LENGKAP)*\n• *Platform OS:* \`${stats?.platform || "linux"} (${stats?.arch || "x64"})\`\n• *Model CPU:* \`${stats?.cpuModel || "Intel Xeon vCPU"}\`\n• *CPU Thread / Core:* \`${stats?.cpuCores || "4"} Threads\`\n• *Beban CPU:* \`${stats?.cpu || 24}%\`\n• *RAM Terpakai:* \`${stats?.ram.used || 2.4} GB\` (${stats?.ram.percent || 48}% Used)\n• *Disk Storage:* \`${stats?.disk.used || 120} GB\` terpakai dari ${stats?.disk.total || 500} GB\n━━━━━━━━━━━━━━━━━━━━━\n_Pengukuran langsung dari Simulator Sandbox._`;
      } else if (trimmed === "/status") {
        const cpuP = stats?.cpu || 25;
        const ramP = stats?.ram.percent || 55;
        const diskP = stats?.disk.usagePercent || 35;
        botResponse = `📊 *ID SERVER: LOCAL DASHBOARD*\n━━━━━━━━━━━━━━━━━━━━━\n🖥️ *CPU Usage:* \n\`${getBar(cpuP)}\`\n\n📟 *RAM Usage:* \n\`${getBar(ramP)}\` \n_${stats?.ram.used || 2.2} GB dari ${stats?.ram.total || 8} GB_\n\n💾 *Disk Storage:* \n\`${getBar(diskP)}\` \n_${stats?.disk.used || 45} GB dari ${stats?.disk.total || 120} GB_\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Uptime:* \`14 hari, 5 jam, 12 menit\`\n_Dikirim via Dashboard Monitoring VPS_`;
      } else if (trimmed === "/cpu") {
        botResponse = `🖥️ *INFORMASI CPU SERVER*\n━━━━━━━━━━━━━━━━━━━━━\n• *Model:* ${stats?.cpuModel || "Genuine Intel Xeon"}\n• *Core:* ${stats?.cpuCores || 4} CPU thread\n• *Beban Saat Ini:* \`${stats?.cpu || 18}%\`\n• *Load Average (5/10/15m):* \n\`[0.15, 0.22, 0.18]\`\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/ram") {
        botResponse = `📟 *INFORMASI RAM (MEMORY)*\n━━━━━━━━━━━━━━━━━━━━━\n• *Total:* \`${stats?.ram.total || 8} GB\`\n• *Used:* \`${stats?.ram.used || 3.2} GB\`\n• *Free:* \`${stats?.ram.free || 4.8} GB\`\n• *Persentase:* \`${stats?.ram.percent || 40}%\`\n• *Visual Grafis:* \n\`${getBar(stats?.ram.percent || 40)}\`\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/disk") {
        botResponse = `💾 *INFORMASI PENYIMPANAN DISK*\n━━━━━━━━━━━━━━━━━━━━━\n• *Kapasitas:* \`${stats?.disk.total || 250} GB\`\n• *Terpakai:* \`${stats?.disk.used || 85} GB\`\n• *Sisa Ruang:* \`${stats?.disk.free || 165} GB\`\n• *Persentase:* \`${stats?.disk.usagePercent || 34}%\`\n• *Visual Grafis:* \n\`${getBar(stats?.disk.usagePercent || 34)}\`\n━━━━━━━━━━━━━━━━━━━━━`;
      } else if (trimmed === "/remote") {
        if (remoteDevices.length === 0) {
          botResponse = `🌍 *Node Remote:* Belum ada node Pterodactyl remote yang aktif saat ini. Silakan hubungkan daemon di server luar!`;
        } else {
          botResponse = `🌍 *DAFTAR REMOTE NODE TELEMETRY*\n━━━━━━━━━━━━━━━━━━━━━\n`;
          remoteDevices.forEach((node) => {
            botResponse += `🟢 *${node.nodeId}* (${node.stats.os})\n ├ CPU: \`${node.stats.cpu}%\`\n ├ RAM: \`${node.stats.ram.percent}%\` (${(node.stats.ram.used/1024).toFixed(1)}GB)\n └ Seen: \`aktif\`\n\n`;
          });
        }
      } else {
        botResponse = `❌ *Perintah tidak dikenali.*\n\nGunakan menu tombol reply keyboard interaktif di bawah ini untuk mengakses informasi pemantauan real-time.`;
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
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-neutral-800 gap-1 md:gap-2 mb-8 font-display text-[11px] md:text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "dashboard"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/15 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.3)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${activeTab === "dashboard" ? "animate-spin" : ""}`} style={{ animationDuration: '6s' }} />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[01]</span>
            DASHBOARD UTAMA
          </button>
          <button
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "telegram"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/15 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.3)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[02]</span>
            BOT TELEGRAM
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "script"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/15 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.3)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[03]</span>
            DAEMON NODE SCRIPT
          </button>
          <button
            onClick={() => setActiveTab("remote")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "remote"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/15 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.3)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[04]</span>
            REMOTE TELEMETRY
            {remoteDevices.length > 0 && (
              <span className="ml-1 bg-cyan-500 text-neutral-950 font-bold px-1.5 py-0.2 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {remoteDevices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pterodactyl")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "pterodactyl"
                ? "border-amber-500 text-amber-400 bg-amber-950/15 shadow-[0_4px_20px_-5px_rgba(245,158,11,0.3)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Server className={`w-3.5 h-3.5 ${activeTab === "pterodactyl" ? "animate-pulse" : ""}`} />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[05]</span>
            PTERODACTYL MONITOR
            {pteroServers.filter(s => s.alertFlags.isOverloaded).length > 0 && (
              <span className="ml-1 bg-amber-500 text-neutral-950 font-bold px-1.5 py-0.2 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-bounce">
                {pteroServers.filter(s => s.alertFlags.isOverloaded).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-5 py-3 transition-all relative border-b-2 font-bold tracking-wider cursor-pointer ${
              activeTab === "logs"
                ? "border-rose-500 text-rose-400 bg-rose-950/10 shadow-[0_4px_20px_-5px_rgba(244,63,94,0.25)]"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Bell className={`w-3.5 h-3.5 text-rose-400 ${activeTab === "logs" ? "animate-bounce" : ""}`} />
            <span className="opacity-60 text-[9px] font-mono mr-0.5">[06]</span>
            DATABASE LOG ALARM
            {alertLogs.length > 0 && (
              <span className="ml-1 bg-rose-600 text-white font-bold px-1.5 py-0.2 text-[9px] rounded font-mono shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse">
                {alertLogs.length}
              </span>
            )}
          </button>
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

          {activeTab === "telegram" && (
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

          {activeTab === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Instructions and Script panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Integration Guide */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-5 lg:col-span-1">
                  <h3 className="text-md font-semibold text-neutral-100">Langkah Setup di Pterodactyl Panel</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ikuti panduan berikut untuk menyebarkan script monitoring Node.js di server VPS Pterodactyl Anda:
                  </p>

                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">1</div>
                      <p className="text-neutral-300">
                        Buat server baru dengan Egg <strong>Node.js</strong> di panel Pterodactyl Anda, atau buka File Manager di server yang sudah ada.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">2</div>
                      <p className="text-neutral-300">
                        Pastikan Anda melampirkan modul dependensi Telegram Bot di file <code className="text-emerald-300 font-mono">package.json</code>: <br />
                        <code className="block bg-neutral-950 p-2 border border-neutral-850 rounded mt-1 font-mono text-[10px]">
                          "node-telegram-bot-api": "0.66.0"
                        </code>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">3</div>
                      <p className="text-neutral-300">
                        Buat file bernama <code className="text-emerald-300 font-mono">index.js</code> lewat File Manager Pterodactyl, lalu salin program lengkap di sebelah kanan dan klik <strong>Save</strong>.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">4</div>
                      <p className="text-neutral-300">
                        Atur startup command server Pterodactyl Anda menjadi <code className="text-emerald-300 font-mono">node index.js</code> lalu jalankan server (klik Start).
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">5</div>
                      <p className="text-neutral-300">
                        Bot Anda siap! Sapa bot Anda di Telegram dan saksikan statistik VPS Pterodactyl Anda tersinkronisasi di tab <strong>"Remote Telemetry Nodes"</strong> secara real-time.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-semibold text-[11px] block">💡 Info Telemetry Sync</span>
                    <p className="text-neutral-400 text-[10px] leading-normal">
                      Pterodactyl Daemon akan mengirim statistik performa ke dashboard web ini setiap 5 detik. Dashboard akan menampilkannya saat perangkat Anda online!
                    </p>
                  </div>
                </div>

                {/* Code Block area */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 lg:col-span-2 flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="text-md font-semibold text-neutral-100 flex items-center gap-2">
                        <Code className="w-4.5 h-4.5 text-emerald-400" />
                        Source Code JavaScript (Pterodactyl)
                      </h3>
                      <p className="text-xs text-neutral-400">Kode ini otomatis diperbarui dengan preferensi token dan threshold di atas!</p>
                    </div>

                    {/* Copy to Clipboard action */}
                    <button
                      onClick={() => handleCopyCode(generatedScriptCode)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all select-none ${
                        copied 
                          ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' 
                          : 'bg-neutral-800 border-neutral-750 text-neutral-300 hover:bg-neutral-750'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {copied ? "Berhasil disalin!" : "Salin Code"}
                    </button>
                  </div>

                  {/* Rendered customized source block */}
                  <div className="flex-1 bg-neutral-950 border border-neutral-850 rounded-xl p-4 overflow-y-auto font-mono text-xs text-emerald-300/90 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
                    <pre className="whitespace-pre">{generatedScriptCode}</pre>
                  </div>
                </div>

              </div>

              {/* Option 3: System Startup Auto-Start Generator / Daemon Helper */}
              <div id="startup-auto-start-panel" className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-5">
                <div className="border-b border-neutral-850 pb-4">
                  <h3 className="text-md font-semibold text-neutral-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    Sistem Startup Generator / Auto-Start Helper (Pterodactyl & VPS)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Pastikan agen monitoring bot Anda otomatis dinyalakan kembali pasca sistem crash, error memori, maupun server reboot dengan pendaftaran berkala.
                  </p>
                </div>

                <div className="flex bg-neutral-950 p-1 border border-neutral-800 rounded-xl max-w-md">
                  <button
                    onClick={() => setStartupMethod("cron")}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      startupMethod === "cron"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Metode A: Cron @reboot (Rekomendasi Egg Pterodactyl / Non-root)
                  </button>
                  <button
                    onClick={() => setStartupMethod("systemd")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      startupMethod === "systemd"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Metode B: Systemd Daemon (Rekomendasi VPS Root)
                  </button>
                </div>

                {startupMethod === "cron" ? (
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-300 leading-normal">
                      Metode ini menggunakan layanan bawaan <strong>Cron OS</strong> linux yang sangat ringan dan tidak membutuhkan hak akses root administrator, cocok dikonfigurasi langsung di Panel Pterodactyl.
                    </p>
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">Langkah Eksekusi Crontab</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`(crontab -l 2>/dev/null; echo "@reboot cd $(pwd || echo '/home/container') && node index.js >> daemon_bot.log 2>&1 &") | crontab -`);
                            alert("Perintah Crontab berhasil disalin ke papan klip!");
                          }}
                          className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-750 rounded-lg flex items-center gap-1 transition cursor-pointer select-none"
                        >
                          <Clipboard className="w-3 h-3" /> Salin Perintah
                        </button>
                      </div>
                      <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed select-all bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
{`(crontab -l 2>/dev/null; echo "@reboot cd \$(pwd || echo '/home/container') && node index.js >> daemon_bot.log 2>&1 &") | crontab -`}
                      </pre>
                      <ul className="list-disc pl-4 text-[11.5px] text-neutral-400 space-y-1">
                        <li>Perintah di atas mengecek daftar cron lama kemudian meng-inject tugas <code className="text-emerald-400 font-mono">@reboot</code>.</li>
                        <li>Cocok di pterodactyl maupun VPS linux standar.</li>
                        <li>Output bot akan tersimpan rapi di dalam fail log <code className="text-emerald-400 font-mono">daemon_bot.log</code>.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-300 leading-normal">
                      Memanfaatkan service manager standar <strong>systemd</strong> pada server Linux (Ubuntu, Debian, CentOS) dengan akses root agar daemon bot menjadi background service sesungguhnya dengan auto-restart handal.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">1. Konfigurasi Service File</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`[Unit]
Description=Pterodactyl VPS Monitor Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pterodactyl-bot
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target`);
                              alert("Content service systemd disalin!");
                            }}
                            className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 rounded flex items-center gap-1 transition cursor-pointer select-none"
                          >
                            <Clipboard className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <pre className="text-[10px] text-neutral-300 font-mono whitespace-pre overflow-x-auto leading-relaxed p-3 bg-neutral-900/60 rounded-lg border border-neutral-850 h-44">
{`[Unit]
Description=Pterodactyl VPS Monitor Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pterodactyl-bot
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target`}
                        </pre>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">2. Perintah Registrasi Shell</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`sudo nano /etc/systemd/system/vps-monitor-bot.service
sudo systemctl daemon-reload
sudo systemctl enable vps-monitor-bot
sudo systemctl start vps-monitor-bot
sudo systemctl status vps-monitor-bot`);
                              alert("Rentetan perintah shell disalin!");
                            }}
                            className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 rounded flex items-center gap-1 transition cursor-pointer select-none"
                          >
                            <Clipboard className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre overflow-x-auto leading-relaxed p-3 bg-neutral-900/60 rounded-lg border border-neutral-850 h-44">
{`# Buat berkas baru
sudo nano /etc/systemd/system/vps-monitor-bot.service

# Muat ulang systemd konfigurasi
sudo systemctl daemon-reload

# Aktifkan otostart boot service
sudo systemctl enable vps-monitor-bot

# Jalankan bot sekarang juga
sudo systemctl start vps-monitor-bot

# Monitor status daemon
sudo systemctl status vps-monitor-bot`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {activeTab === "remote" && (
            <motion.div
              key="remote"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Remote server telemetry center */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-100">Daftar Remote Server (Telemetri Node)</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Menampilkan status server Pterodactyl eksternal yang terhubung dan mengirimkan telemetri secara real-time.
                    </p>
                  </div>
                  <button 
                    onClick={fetchRemoteDevices}
                    className="px-4 py-2 bg-neutral-800 border border-neutral-750 hover:bg-neutral-750 text-xs text-neutral-300 rounded-xl flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Teranyar
                  </button>
                </div>

                {remoteDevices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {remoteDevices.map((device, idx) => {
                      const isConnected = Date.now() - device.lastSeen < 15000; // Online if received within 15 seconds
                      return (
                        <div key={idx} className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4">
                          
                          {/* Device identifier header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400 ${isConnected ? 'animate-pulse' : 'text-neutral-500'}`}>
                                <Server className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-200">{device.nodeId}</h4>
                                <span className="text-[10px] font-mono text-neutral-400 uppercase">{device.stats.os}</span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 text-[10px] rounded-full font-semibold font-mono ${
                              isConnected ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                            }`}>
                              {isConnected ? "🟢 ONLINE" : "🔴 OFFLINE"}
                            </span>
                          </div>

                          {/* Stats row info */}
                          <div className="grid grid-cols-3 gap-3 text-center border-y border-neutral-850 py-3">
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">CPU</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.cpu}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">RAM</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.ram.percent}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">DISK</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.disk.percent}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Wifi className="w-3.5 h-3.5 text-neutral-400" />
                              Last report: {Math.max(0, Math.round((Date.now() - device.lastSeen) / 1000))} detik yang lalu
                            </span>
                            <span>
                              Uptime: {formatUptime(device.stats.uptime)}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800 rounded-3xl space-y-4 text-center">
                    <Cloud className="w-12 h-12 text-neutral-500 stroke-1" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-neutral-300">Belum Ada Node Telemetry Terdeteksi</h4>
                      <p className="text-xs text-neutral-500 max-w-sm">
                        Instal script monitoring kami di panel Pterodactyl Anda. Setelah script diaktifkan, telemetri server eksternal Anda akan langsung muncul di sini secara dynamic!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "pterodactyl" && (
            <motion.div
              key="pterodactyl"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top panel details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration form card */}
                <div className="lg:col-span-1 bg-[#09090e]/80 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500/40 rounded-bl"></div>
                  <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-neutral-900 pb-2.5">
                    <Settings className="w-4 h-4 text-amber-500" />
                    KONFIGURASI PANEL CLIENT
                  </h3>

                  <form onSubmit={handleSavePteroConfig} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase font-bold mb-1.55">DOMAIN PANEL PTERODACTYL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://panel.hostgacor.com"
                        value={pteroConfig.pterodactylDomain}
                        onChange={(e) => setPteroConfig({ ...pteroConfig, pterodactylDomain: e.target.value })}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-neutral-200 outline-none transition font-sans"
                      />
                      <p className="text-[9px] text-neutral-500 mt-1">Gunakan format HTTP/HTTPS valid tanpa trailing slash.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-mono uppercase font-bold mb-1.5 font-bold">CLIENT API KEY (PTLA)</label>
                      <input
                        type="password"
                        required
                        placeholder="ptla_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={pteroConfig.pterodactylApiKey}
                        onChange={(e) => setPteroConfig({ ...pteroConfig, pterodactylApiKey: e.target.value })}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-neutral-200 outline-none transition font-mono"
                      />
                      <p className="text-[9px] text-neutral-500 mt-1">Gunakan client API key yang diawali dengan <code className="font-mono text-amber-500">ptla_</code> dari profil panel Anda.</p>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2 border-t border-neutral-900">
                      <input
                        type="checkbox"
                        id="pteroActive"
                        checked={pteroConfig.pterodactylActive}
                        onChange={(e) => setPteroConfig({ ...pteroConfig, pterodactylActive: e.target.checked })}
                        className="rounded border-neutral-800 text-amber-500 bg-black focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                      />
                      <label htmlFor="pteroActive" className="text-xs text-neutral-300 select-none cursor-pointer font-bold">
                        Aktifkan Pelacakan Live Telemetry
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPteroConfig}
                      className="w-full py-2.5 px-4 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/35 hover:border-amber-400 text-xs font-display text-amber-400 hover:text-white rounded-xl transition cursor-pointer font-bold uppercase text-center mt-2 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                    >
                      {savingPteroConfig ? "MENYIMPAN..." : "SIMPAN KONFIGURASI"}
                    </button>
                  </form>

                  {/* Connection Diagnostics Section */}
                  <div className="mt-6 pt-5 border-t border-neutral-900 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        DIAGNOSTIK KONEKSI API
                      </h4>
                      <button
                        type="button"
                        onClick={handleRunPteroDiagnostics}
                        disabled={isDiagnosing || !pteroConfig.pterodactylDomain}
                        className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded transition uppercase flex items-center gap-1 ${
                          !pteroConfig.pterodactylDomain
                            ? "bg-neutral-900 border border-neutral-850 text-neutral-600 cursor-not-allowed"
                            : "bg-cyan-950/25 hover:bg-cyan-950/45 border border-cyan-500/30 text-cyan-400 hover:text-white cursor-pointer"
                        }`}
                      >
                        {isDiagnosing ? "MEMINDAI..." : "MULAI DIAGNOSA"}
                      </button>
                    </div>

                    <p className="text-[9px] text-neutral-500 leading-relaxed">
                      Gunakan utilitas ini untuk menguji apakah domain panel Anda dapat dijangkau dan apakah API Key yang Anda buat memiliki izin yang tepat.
                    </p>

                    {pteroDiagSteps.length > 0 && (
                      <div className="space-y-2.5 bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 font-mono text-[10px] max-h-[350px] overflow-y-auto">
                        {pteroDiagSteps.map((step, idx) => {
                          const isSuccess = step.status === "success";
                          const isWarning = step.status === "warning";
                          const isDanger = step.status === "danger";
                          const isPending = step.status === "pending";

                          return (
                            <div key={idx} className="space-y-1 pb-2 last:pb-0 border-b border-neutral-900/40 last:border-0">
                              <div className="flex items-center gap-1.5 font-bold">
                                {isSuccess && <span className="text-emerald-500">✔</span>}
                                {isWarning && <span className="text-amber-500">⚠</span>}
                                {isDanger && <span className="text-red-500">✘</span>}
                                {isPending && <span className="text-cyan-500 inline-block animate-spin">⟳</span>}
                                <span className={
                                  isSuccess ? "text-emerald-400" :
                                  isWarning ? "text-amber-400" :
                                  isDanger ? "text-red-400" :
                                  "text-neutral-400"
                                }>
                                  {step.title}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-neutral-300 pl-4">{step.message}</p>
                              {step.details && (
                                <p className="text-[9px] text-neutral-500 pl-4 mt-0.5 leading-relaxed bg-[#0b0b10] p-1.5 rounded border border-neutral-900/20 italic">
                                  {step.details}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dashboard summary stats */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Cards status section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    
                    {/* TOTAL CARGO SERVERS */}
                    <div className="bg-[#0b0b10] border border-neutral-850 rounded-xl p-4.5 relative overflow-hidden">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold">TOTAL SERVED CLIENT</p>
                      <h3 className="text-2xl font-extrabold mt-1 text-neutral-100 font-sans tracking-tight">
                        {pteroConfig.pterodactylActive ? pteroServers.length : "0"} <span className="text-xs text-neutral-500 font-normal">Server</span>
                      </h3>
                      <div className="text-[10px] text-neutral-400 font-mono mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Status: {pteroConfig.pterodactylActive ? "Monitoring On" : "Inaktif"}
                      </div>
                    </div>

                    {/* OVERLOAD WARNING COUNTER */}
                    {(() => {
                      const overloadedCount = pteroServers.filter(s => s.alertFlags.isOverloaded).length;
                      const hasOverload = overloadedCount > 0;
                      return (
                        <div className={`border rounded-xl p-4.5 relative overflow-hidden transition-all duration-300 ${
                          hasOverload 
                            ? "bg-amber-950/15 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)] animate-pulse" 
                            : "bg-[#0b0b10] border-neutral-850"
                        }`}>
                          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> SERVER OVERLOAD
                          </p>
                          <h3 className={`text-2xl font-extrabold mt-1 tracking-tight font-sans ${hasOverload ? "text-amber-450" : "text-neutral-100"}`}>
                            {overloadedCount} <span className="text-xs text-neutral-500 font-normal">Server Terbebani</span>
                          </h3>
                          <div className="text-[10px] text-neutral-400 font-mono mt-2 uppercase">
                            {hasOverload ? "🔥 BEBERAPA NODES MEMBUTUHKAN PENANGANAN" : "🟢 AMAN // BEBAN SEMUA SERVER STABIL"}
                          </div>
                        </div>
                      );
                    })()}

                    {/* LAST TIMESTAMP METRICS */}
                    <div className="bg-[#0b0b10] border border-neutral-850 rounded-xl p-4.5 relative overflow-hidden">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold">MUTAKHIR METRICS SYNC</p>
                      <h3 className="text-sm font-extrabold mt-2 text-neutral-200 font-mono">
                        {pteroLastSync ? pteroLastSync : "Belum Tersinkron"}
                      </h3>
                      <button
                        onClick={syncPteroServers}
                        disabled={isLoadingPtero || !pteroConfig.pterodactylActive}
                        className={`mt-2 py-1 px-2.5 text-[9px] font-mono font-bold border rounded transition flex items-center gap-1 uppercase ${
                          (!pteroConfig.pterodactylActive)
                            ? "border-neutral-850 text-neutral-600 bg-transparent cursor-not-allowed"
                            : "border-amber-500/30 text-amber-400 hover:text-white bg-[#100c05] hover:bg-amber-950/20 cursor-pointer"
                        }`}
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isLoadingPtero ? "animate-spin" : ""}`} /> SYNC_ALL_LOADS
                      </button>
                    </div>

                  </div>

                  {/* Pterodactyl Overview Panel */}
                  <div className="bg-[#050508]/60 border border-neutral-850 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider">PELACAKAN MULTI-SERVER PTERODACTYL</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Sistem memindai performa node, kontainer server, alokasi memori, ruang disk, dan konsumsi CPU inti secara simultan.</p>
                      </div>
                      <span className="text-[9px] bg-neutral-900 border border-neutral-800 font-mono text-neutral-400 px-2 py-0.5 rounded uppercase">
                        Active Monitoring
                      </span>
                    </div>

                    {!pteroConfig.pterodactylActive ? (
                      <div className="py-12 text-center border border-dashed border-neutral-850 rounded-xl space-y-3 bg-black/20">
                        <Server className="w-10 h-10 text-neutral-600 mx-auto stroke-1" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-neutral-300">Live Telemetry Pterodactyl Belum Aktif</p>
                          <p className="text-[10px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                            Masukkan Pterodactyl Domain dan Client API Key, lalu centang "Aktifkan Pelacakan Live Telemetry" untuk menguji status muatan server dan mendeteksi overload.
                          </p>
                        </div>
                      </div>
                    ) : isLoadingPtero && pteroServers.length === 0 ? (
                      <div className="py-12 text-center bg-black/10 rounded-xl border border-neutral-905">
                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                        <p className="text-xs text-neutral-400 font-mono">SEDANG MENGHUBUNGI API PTERODACTYL DAN MENGHITUNG BEBAN SERVERS...</p>
                      </div>
                    ) : pteroError ? (
                      <div className="py-8 px-4 text-center border border-rose-950/40 bg-rose-950/10 rounded-xl space-y-2">
                        <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">MENGALAMI MASALAH KONEKSI API PANEL</p>
                        <p className="text-[10px] text-neutral-400 font-mono max-w-md mx-auto">{pteroError}</p>
                        <button
                          onClick={syncPteroServers}
                          className="mt-2 text-[9px] font-mono font-bold text-amber-400 hover:text-white border border-amber-500/25 px-2 py-1 rounded bg-[#100c05] cursor-pointer"
                        >
                          COBA LAGI_
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-neutral-950/45 p-3 rounded-xl border border-neutral-900 flex justify-between items-center">
                          <span className="text-neutral-500">SERVER RUNNING:</span>
                          <span className="text-emerald-400 font-bold">{pteroServers.filter(s => s.status === "running").length} Server</span>
                        </div>
                        <div className="bg-neutral-950/45 p-3 rounded-xl border border-neutral-900 flex justify-between items-center">
                          <span className="text-neutral-500">SERVER OFFLINE/STALLED:</span>
                          <span className={`${pteroServers.filter(s => s.status === "offline").length > 0 ? "text-red-400 font-bold" : "text-neutral-400"}`}>
                            {pteroServers.filter(s => s.status === "offline").length} Server
                          </span>
                        </div>
                        <div className="bg-neutral-950/45 p-3 rounded-xl border border-neutral-900 flex justify-between items-center">
                          <span className="text-neutral-500">DISK OVERLOAD:</span>
                          <span className={`${pteroServers.filter(s => s.alertFlags.diskOverload).length > 0 ? "text-amber-500 font-bold animate-pulse" : "text-neutral-400"}`}>
                            {pteroServers.filter(s => s.alertFlags.diskOverload).length} Server
                          </span>
                        </div>
                        <div className="bg-neutral-950/45 p-3 rounded-xl border border-neutral-900 flex justify-between items-center">
                          <span className="text-neutral-500">RAM/CPU OVERLOAD:</span>
                          <span className={`${pteroServers.filter(s => s.alertFlags.ramOverload || s.alertFlags.cpuOverload).length > 0 ? "text-amber-500 font-bold animate-pulse" : "text-neutral-400"}`}>
                            {pteroServers.filter(s => s.alertFlags.ramOverload || s.alertFlags.cpuOverload).length} Server
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Server Data Grid Cards */}
              {pteroConfig.pterodactylActive && pteroServers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider flex items-center gap-2">
                      <span>DAFTAR LIVE NODES SERVER ({pteroServers.length})</span>
                      {isLoadingPtero && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                          UPDATING...
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-mono">AMBANG BATAS OVERLOAD: &gt;90% DARI ALOKASI LIMIT SERVER</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pteroServers.map((server) => {
                      const isOffline = server.status === "offline";
                      const isSuspended = server.isSuspended || server.status === "suspended";
                      const isOverloaded = server.alertFlags.isOverloaded;

                      // Memory percentage string
                      const ramPercent = server.limits.memory > 0 
                        ? Math.round((server.resources.memory / server.limits.memory) * 100) 
                        : 0;

                      // Disk percentage string
                      const diskPercent = server.limits.disk > 0 
                        ? Math.round((server.resources.disk / server.limits.disk) * 100) 
                        : 0;

                      // CPU percentage string
                      const cpuPercent = server.limits.cpu > 0 
                        ? Math.round((server.resources.cpu / server.limits.cpu) * 100)
                        : Math.round(server.resources.cpu);

                      return (
                        <div 
                          key={server.id} 
                          className={`bg-neutral-950 border rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all duration-300 ${
                            isOffline 
                              ? "border-neutral-900 opacity-70"
                              : isSuspended
                                ? "border-amber-950/65 bg-[#0e0a05]/40"
                                : isOverloaded
                                  ? "border-red-500/40 bg-red-950/5 shadow-[0_0_15px_rgba(239,68,68,0.06)]"
                                  : "border-neutral-850 hover:border-neutral-750 hover:bg-neutral-900/10"
                          }`}
                        >
                          {/* Card Warning Top Glow */}
                          {isOverloaded && (
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse"></div>
                          )}

                          {/* Identifier Header */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="truncate pr-1">
                              <h4 className="text-sm font-bold text-neutral-100 font-sans tracking-tight truncate flex items-center gap-1.5" title={server.name}>
                                {server.name}
                              </h4>
                              <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex flex-wrap gap-x-2 items-center">
                                <span className="text-neutral-500">ID: {server.id}</span>
                                <span>•</span>
                                <span className="text-neutral-400 text-[10px] uppercase">{server.node}</span>
                              </div>
                            </div>

                            {/* Server Status Badge */}
                            <span className={`px-2.5 py-0.5 text-[9px] rounded font-bold font-mono uppercase tracking-wider shrink-0 border ${
                              isOffline 
                                ? 'bg-neutral-900 text-neutral-500 border-neutral-800' 
                                : isSuspended
                                  ? 'bg-orange-950/30 text-orange-400 border-orange-500/20'
                                  : isOverloaded
                                    ? 'bg-red-950/20 text-red-500 border-red-500/30 animate-pulse'
                                    : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isOffline 
                                ? "🔴 OFF" 
                                : isSuspended
                                  ? "⚠️ SUSPENDED"
                                  : isOverloaded
                                    ? "🔥 OVERLOAD"
                                    : "🟢 RUNNING"
                              }
                            </span>
                          </div>

                          {/* Trigger list diagnostics if overloading */}
                          {isOverloaded && (
                            <div className="bg-red-950/30 border border-red-500/25 px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono text-red-400 flex items-center gap-1.5 animate-pulse uppercase font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              TERDETEKSI OVERLOAD: {server.alertFlags.details.join(", ")}
                            </div>
                          )}

                          {/* Core Metrics Visual Section */}
                          <div className="space-y-3.5 font-mono text-[10px] pt-1.5">

                            {/* CPU Loads */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-neutral-400 font-sans">
                                <span className={`font-mono text-[9px] px-1 py-0.2 rounded font-bold ${
                                  server.alertFlags.cpuOverload ? "bg-red-950 text-red-405 border border-red-500/20" : "bg-neutral-900 border border-neutral-850 text-neutral-450"
                                }`}>
                                  CPU
                                </span>
                                <span>
                                  {isOffline ? "0.0%" : `${server.resources.cpu.toFixed(1)}%`} 
                                  <span className="text-neutral-500 ml-1">
                                    / {server.limits.cpu > 0 ? `${server.limits.cpu}%` : "¥ (Unlimited)"}
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    isOffline 
                                      ? "bg-neutral-800"
                                      : server.alertFlags.cpuOverload
                                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                                        : "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                                  }`}
                                  style={{ width: `${Math.min(100, isOffline ? 0 : cpuPercent)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Memory RAM Utilization */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-neutral-400 font-sans">
                                <span className={`font-mono text-[9px] px-1 py-0.2 rounded font-bold ${
                                  server.alertFlags.ramOverload ? "bg-red-950 text-red-405 border border-red-500/20" : "bg-neutral-900 border border-neutral-850 text-neutral-450"
                                }`}>
                                  RAM
                                </span>
                                <span>
                                  {isOffline ? "0" : server.resources.memory.toFixed(0)} MB
                                  <span className="text-neutral-500 ml-1">
                                    / {server.limits.memory > 0 ? `${server.limits.memory} MB` : "¥ (Unlimited)"}
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    isOffline 
                                      ? "bg-neutral-800"
                                      : server.alertFlags.ramOverload
                                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                                        : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                                  }`}
                                  style={{ width: `${Math.min(100, isOffline ? 0 : ramPercent)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Disk Storage Space */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-neutral-400 font-sans">
                                <span className={`font-mono text-[9px] px-1 py-0.2 rounded font-bold ${
                                  server.alertFlags.diskOverload ? "bg-red-950 text-red-405 border border-red-500/20" : "bg-neutral-900 border border-neutral-850 text-neutral-450"
                                }`}>
                                  DISK
                                </span>
                                <span>
                                  {isOffline ? "0" : (server.resources.disk / 1024).toFixed(1)} GB
                                  <span className="text-neutral-500 ml-1">
                                    / {server.limits.disk > 0 ? `${(server.limits.disk / 1024).toFixed(1)} GB` : "¥ (Unlimited)"}
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    isOffline 
                                      ? "bg-neutral-800"
                                      : server.alertFlags.diskOverload
                                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                                        : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)]"
                                  }`}
                                  style={{ width: `${Math.min(100, isOffline ? 0 : diskPercent)}%` }}
                                ></div>
                              </div>
                            </div>

                          </div>

                          {/* Extra info panel card block */}
                          <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-[9px] text-neutral-500 font-mono">
                            <span className="truncate max-w-[120px] capitalize">Node: {server.node}</span>
                            <span className="truncate font-sans uppercase text-neutral-400">UUID: {server.id}</span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
