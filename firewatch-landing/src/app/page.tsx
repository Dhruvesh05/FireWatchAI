"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Send,
  Cpu,
  Database,
  Eye,
  ChevronRight,
  AlertCircle,
  Upload,
  Play,
  Square,
  Search,
  PieChart,
  Bell,
  RefreshCw,
  CloudFog,
  Film,
  Crosshair,
  Activity,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NeumorphicNavbar from "@/components/NeumorphicNavbar";

// Supported file validation helpers
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".bmp"];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];
const ALLOWED_VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

function isValidImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTS.some((ext) => name.endsWith(ext));
}

function isValidVideoFile(file: File): boolean {
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_VIDEO_EXTS.some((ext) => name.endsWith(ext));
}

const NAV_TABS = [
  { id: "detect", label: "Upload", icon: Upload },
  { id: "camera", label: "Live Camera", icon: Camera },
  { id: "history", label: "Audit Log", icon: Database },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "alerts", label: "Telegram Alerts", icon: Bell },
] as const;

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Platform State
  const [activeTab, setActiveTab] = useState<"detect" | "camera" | "history" | "analytics" | "alerts">("detect");
  const [detectMode, setDetectMode] = useState<"image" | "video">("image");

  // Real Backend Data States
  const [stats, setStats] = useState({ total_detections: 0, fire_detections: 0, smoke_detections: 0, alerts_sent: 0 });
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Detection Form States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageResultUrl, setImageResultUrl] = useState<string | null>(null);
  const [imageResultMeta, setImageResultMeta] = useState<any | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoAnalyzing, setVideoAnalyzing] = useState(false);
  const [videoResult, setVideoResult] = useState<any | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState<number>(Date.now());

  // History Filtering
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5000";

  // Toggle theme class on HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Real backend health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${appUrl}/api/health`, { method: "GET" });
        if (res.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [appUrl]);

  // Fetch Platform Data from Backend
  const fetchPlatformData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, historyRes, analyticsRes, alertsRes] = await Promise.all([
        fetch(`${appUrl}/api/stats`).catch(() => null),
        fetch(`${appUrl}/api/history`).catch(() => null),
        fetch(`${appUrl}/api/analytics`).catch(() => null),
        fetch(`${appUrl}/api/alerts`).catch(() => null),
      ]);

      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (historyRes && historyRes.ok) {
        const data = await historyRes.json();
        setHistoryData(data);
      }
      if (analyticsRes && analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalyticsData(data);
      }
      if (alertsRes && alertsRes.ok) {
        const data = await alertsRes.json();
        setAlertsData(data);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, [appUrl]);

  // Hero background video ref for reliable browser playback
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.defaultMuted = true;
      heroVideoRef.current.muted = true;
      heroVideoRef.current.play().catch(() => {
        // Autoplay handled by browser policy
      });
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handlePlatformClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (backendStatus === "offline") {
      e.preventDefault();
      setShowOfflineModal(true);
    }
  };

  const handleTabNavigate = (
    tabId: "detect" | "camera" | "history" | "analytics" | "alerts",
    e: React.MouseEvent
  ) => {
    setActiveTab(tabId);
    if (backendStatus === "offline") {
      e.preventDefault();
      setShowOfflineModal(true);
      return;
    }
    const platformEl = document.getElementById("platform");
    if (platformEl) {
      platformEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Image Analysis Handler with content-type checking
  const handleImageFileChange = (file: File | null) => {
    if (!file) return;
    if (!isValidImageFile(file)) {
      setImageError("Unsupported image format. Please select JPG, PNG, WEBP, or BMP.");
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageResultUrl(null);
    setImageResultMeta(null);
    setImageError(null);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setImageAnalyzing(true);
    setImageError(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await fetch(`${appUrl}/upload_image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Image analysis request failed.");
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("image/")) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageResultUrl(objectUrl);
        setImageResultMeta({ success: true, type: "annotated_image" });
      } else if (contentType.includes("json")) {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.image_url) {
          setImageResultUrl(`${appUrl}${data.image_url}`);
        }
        setImageResultMeta(data);
      } else {
        const text = await res.text();
        throw new Error(text || "Unexpected server response.");
      }

      fetchPlatformData(); // Refresh metrics and audit log
    } catch (err: any) {
      setImageError(err.message || "Unable to process image. Please check connection.");
    } finally {
      setImageAnalyzing(false);
    }
  };

  // Video Analysis Handler
  const handleVideoFileChange = (file: File | null) => {
    if (!file) return;
    if (!isValidVideoFile(file)) {
      setVideoError("Unsupported video format. Please select MP4, WEBM, MOV, AVI, or MKV.");
      setVideoFile(null);
      return;
    }
    setVideoFile(file);
    setVideoResult(null);
    setVideoError(null);
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;
    setVideoAnalyzing(true);
    setVideoError(null);

    const formData = new FormData();
    formData.append("file", videoFile);

    try {
      const res = await fetch(`${appUrl}/upload_video`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Video upload failed.");
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVideoResult(data);
      } else {
        setVideoResult({ stream_url: "/video_feed" });
      }

      fetchPlatformData();
    } catch (err: any) {
      setVideoError(err.message || "Failed to analyze video file.");
    } finally {
      setVideoAnalyzing(false);
    }
  };

  // Live Camera Handlers using correct POST method
  const handleStartCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      const res = await fetch(`${appUrl}/webcam/start`, {
        method: "POST",
      });

      if (res.ok) {
        setCameraKey(Date.now());
        setCameraActive(true);
      } else {
        const errText = await res.text();
        setCameraError(errText || "Unable to start backend camera stream.");
      }
    } catch {
      setCameraError("FireWatch backend webcam service is unavailable.");
    } finally {
      setCameraLoading(false);
    }
  };

  const handleStopCamera = async () => {
    setCameraLoading(true);
    try {
      await fetch(`${appUrl}/webcam/stop`, {
        method: "POST",
      });
    } catch {
      // proceed
    } finally {
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  // Filtered History Records
  const filteredHistory = historyData.filter((item) => {
    const matchesSearch =
      (item.source || "").toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.timestamp || "").toLowerCase().includes(historySearch.toLowerCase());
    if (historyFilter === "fire") return matchesSearch && item.fire_count > 0;
    if (historyFilter === "smoke") return matchesSearch && item.smoke_count > 0;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white transition-colors duration-300">

      {/* 
        ==================================================
        1. FLOATING NEUMORPHIC NAVBAR
        ==================================================
      */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl">
        <div className="bg-[#e0e5ec] dark:bg-[#18191c] text-zinc-900 dark:text-zinc-100 rounded-full px-6 py-3.5 border border-zinc-300/60 dark:border-zinc-800/80 flex items-center justify-between transition-all duration-300">

          {/* Brand Logo */}
          <a href="#hero" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-zinc-950 dark:text-white group shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#e0e5ec] dark:bg-[#18191c] shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124] flex items-center justify-center text-orange-600 group-hover:shadow-[inset_3px_3px_6px_#c8cdd4,inset_-3px_-3px_6px_#ffffff] dark:group-hover:shadow-[inset_3px_3px_6px_#101114,inset_-3px_-3px_6px_#202124] transition-all duration-300">
              <Flame className="w-5 h-5 fill-orange-600 text-orange-600" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-zinc-900 dark:text-white">
              FireWatch<span className="text-orange-600"> AI</span>
            </span>
          </a>

          {/* Floating Navbar Platform Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-2 bg-[#e0e5ec] dark:bg-[#18191c] p-2 rounded-full shadow-[inset_4px_4px_8px_#c8cdd4,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#101114,inset_-4px_-4px_8px_#202124]">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href="#platform"
                  onClick={(e) => handleTabNavigate(tab.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${isActive
                    ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_5px_5px_9px_#c8cdd4,inset_-5px_-5px_9px_#ffffff] dark:shadow-[inset_5px_5px_9px_#101114,inset_-5px_-5px_9px_#202124]"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Controls & Real Health Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[#e0e5ec] dark:bg-[#18191c] text-zinc-800 dark:text-zinc-200 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[6px_6px_12px_#c8cdd4,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#101114,-6px_-6px_12px_#202124] active:shadow-[inset_4px_4px_8px_#c8cdd4,inset_-4px_-4px_8px_#ffffff] dark:active:shadow-[inset_4px_4px_8px_#101114,inset_-4px_-4px_8px_#202124]"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-zinc-700" />
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-[#e0e5ec] dark:bg-[#18191c] text-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer shadow-[6px_6px_12px_#c8cdd4,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#101114,-6px_-6px_12px_#202124] active:shadow-[inset_4px_4px_8px_#c8cdd4,inset_-4px_-4px_8px_#ffffff]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-4 bg-[#e0e5ec] dark:bg-[#18191c] text-zinc-950 dark:text-white rounded-3xl p-5 shadow-[10px_10px_20px_#c8cdd4,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#101114,-10px_-10px_20px_#202124]"
            >
              <div className="flex flex-col gap-2.5 font-bold text-sm">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-2 py-1">
                  Platform Navigation
                </div>
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <a
                      key={tab.id}
                      href="#platform"
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleTabNavigate(tab.id, e);
                      }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 ${isActive
                        ? "bg-[#e0e5ec] dark:bg-[#18191c] text-orange-600 dark:text-orange-400 shadow-[inset_5px_5px_9px_#c8cdd4,inset_-5px_-5px_9px_#ffffff] dark:shadow-[inset_5px_5px_9px_#101114,inset_-5px_-5px_9px_#202124]"
                        : "text-zinc-700 dark:text-zinc-300 hover:shadow-[4px_4px_8px_#c8cdd4,-4px_-4px_8px_#ffffff] dark:hover:shadow-[4px_4px_8px_#101114,-4px_-4px_8px_#202124]"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 
        ==================================================
        2. HERO SECTION
        ==================================================
      */}
      <motion.section
        id="hero"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full overflow-hidden min-h-[100vh] flex flex-col items-center justify-center pt-36 sm:pt-52 pb-20 sm:pb-36"
      >
        {/* Background Video (Full Bleed Edge-to-Edge) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            ref={heroVideoRef}
            src="/herofns.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-100 dark:opacity-100 scale-105"
          />
        </div>

        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-tr from-orange-600/25 to-amber-500/15 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none z-0" />

        {/* Hero Content Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.2, once: false }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center"
        >
          <h1 className="font-[family-name:var(--font-dm-sans)] text-4xl sm:text-7xl lg:text-8xl xl:text-9xl font-semibold tracking-tight mb-12 sm:mb-20 text-white leading-[1.05] sm:leading-[1.03]">
            Detect Fire <br className="hidden sm:block" />
            <span className="bg-gradient-to-r text-white via-white via-[65%] to-[#ea580c] bg-clip-text text-transparent">
              Before It Spreads.
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <a
              href="#platform"
              onClick={handlePlatformClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent border border-white/20 hover:bg-orange-500 backdrop-blur-md text-white font-bold text-sm tracking-wide transition-all hover:scale-100"
            >
              <span>Upload & Detect</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent border border-white/20 hover:bg-white hover:text-orange-600 backdrop-blur-md text-white font-bold text-sm tracking-wide transition-all hover:scale-100"
            >
              <span>Watch Demo</span>
            </a>
          </div>
        </motion.div>
      </motion.section>

      {/* 
        ==================================================
        3. FEATURES SECTION
        ==================================================
      */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-900"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.2, once: false }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-16"
        >
          <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Intelligent Fire Monitoring System
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
          <motion.img
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            src="/upload.svg"
            alt="Upload Detection"
            className="w-full h-auto rounded-2xl object-contain transition-all duration-300"
          />
          <motion.img
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            src="/webcam.svg"
            alt="Webcam Detection"
            className="w-full h-auto rounded-2xl object-contain transition-all duration-300"
          />
          <motion.img
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            src="/telegram.svg"
            alt="Telegram Alerts"
            className="w-full h-auto rounded-2xl object-contain transition-all duration-300"
          />
        </div>
      </motion.section>

      {/* 
        ==================================================
        4. HOW IT WORKS
        ==================================================
      */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-24 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-950/50 border-y border-zinc-200 dark:border-zinc-900"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-10 sm:mb-16"
          >
            <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              How FireWatch AI Protects Forests
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { step: "01", title: "Input Feed", desc: "User uploads image, video, or connects live stream." },
              { step: "02", title: "YOLOv8 Inference", desc: "Neural network processes frames to detect fire and smoke." },
              { step: "03", title: "Audit Logging", desc: "Detection metrics and coordinates are recorded in SQLite." },
              { step: "04", title: "Instant Notification", desc: "Telegram bot dispatches immediate alert to responders." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.2, once: false }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                className="relative p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-600 dark:text-orange-500 mb-3">
                  {item.step}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white mb-2">{item.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 
        ==================================================
        5. TECHNOLOGY SECTION
        ==================================================
      */}
      <motion.section
        id="technology"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white mb-4 sm:mb-6">
              Computer Vision Meets Next-Gen SaaS
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-6 sm:mb-8 font-normal leading-relaxed">
              FireWatch AI leverages Ultralytics YOLOv8 trained on thousands of aerial forest fire images, integrated with a lightweight Python Flask backend API and a fast Next.js UI.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Cpu className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">YOLOv8 Model</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Eye className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">OpenCV Processing</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Database className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">SQLite Logging</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Send className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Telegram Dispatch</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-900 text-white space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <span className="text-xs font-mono text-zinc-500 uppercase">Detection Architecture</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Active Engine</span>
            </div>
            <div className="space-y-4 font-mono text-xs text-zinc-400">
              <div className="flex justify-between items-center gap-2">
                <span>Model Architecture:</span>
                <span className="text-white font-bold">YOLOv8 PyTorch</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Input Processing:</span>
                <span className="text-white font-bold">640x640 Dynamic Tensor</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Target Classes:</span>
                <span className="text-orange-400 font-bold">Fire [0], Smoke [1]</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Backend Framework:</span>
                <span className="text-white font-bold">Python Flask API</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 
        ==================================================
        6. DEMO SECTION
        ==================================================
      */}
      <motion.section
        id="demo"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-24 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-900 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white mb-4 sm:mb-6">
              End-to-End Detection Pipeline
            </h3>
            <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
              See how input media passes through the YOLOv8 neural network and triggers database logs and alerts.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sm:mb-12 shadow-sm"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Input Media</span>
            </div>

            <ChevronRight className="w-6 h-6 text-zinc-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">YOLOv8 Engine</span>
            </div>

            <ChevronRight className="w-6 h-6 text-zinc-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Detection Record</span>
            </div>

            <ChevronRight className="w-6 h-6 text-zinc-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Telegram Alert</span>
            </div>
          </motion.div>

          <a
            href="#platform"
            onClick={handlePlatformClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent border border-black text-black hover:bg-orange-600 hover:border-orange-600 hover:text-white dark:bg-transparent dark:border-white dark:text-white dark:hover:bg-orange-600 dark:hover:border-orange-600 dark:hover:text-white font-bold text-sm tracking-wide transition-all duration-300"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </motion.section>

      {/* 
        ==================================================
        7. FIREWATCH PLATFORM SECTION (#platform)
        ==================================================
      */}
      {/* 
        ==================================================
        7. FIREWATCH PLATFORM SECTION (#platform)
        ==================================================
      */}
      <motion.section
        id="platform"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.1, once: false }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-black text-zinc-950 dark:text-white border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-b border-zinc-200 dark:border-zinc-900 pb-6 sm:pb-8"
          >
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                FireWatch AI Platform
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed">
                Analyze images and videos, stream live camera feeds, and inspect audit records powered by the Flask YOLOv8 backend.
              </p>
            </div>

            <button
              onClick={fetchPlatformData}
              disabled={loadingData}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold transition-all duration-300 cursor-pointer shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] hover:text-orange-600 dark:hover:text-orange-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-orange-500" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </motion.div>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 sm:p-6 rounded-3xl shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Detections</span>
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white">
                {loadingData ? "-" : stats.total_detections}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 sm:p-6 rounded-3xl shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Fire Events</span>
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-red-500">
                {loadingData ? "-" : stats.fire_detections}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 sm:p-6 rounded-3xl shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Smoke Events</span>
                <CloudFog className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-500 dark:text-amber-400">
                {loadingData ? "-" : stats.smoke_detections}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 sm:p-6 rounded-3xl shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Alerts Sent</span>
                <Send className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {loadingData ? "-" : stats.alerts_sent}
              </div>
            </div>
          </motion.div>

          {/* Platform Main Navigation Tabs (Neumorphism Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="flex items-center gap-2 sm:gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-6 overflow-x-auto no-scrollbar"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${isActive
                    ? "bg-zinc-200 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)]"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)]"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Animated Tab Content Switcher */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* TAB 1: DETECTION WORKSPACE */}
              {activeTab === "detect" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Image vs Video Toggle (Neumorphic Style) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="inline-flex p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)]">
                      <button
                        onClick={() => setDetectMode("image")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${detectMode === "image"
                          ? "bg-zinc-200 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.12),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.04)]"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.7)] dark:shadow-[2px_2px_6px_rgba(0,0,0,0.6),-2px_-2px_6px_rgba(255,255,255,0.03)]"
                          }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Image Analysis</span>
                      </button>
                      <button
                        onClick={() => setDetectMode("video")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${detectMode === "video"
                          ? "bg-zinc-200 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.12),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.04)]"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.7)] dark:shadow-[2px_2px_6px_rgba(0,0,0,0.6),-2px_-2px_6px_rgba(255,255,255,0.03)]"
                          }`}
                      >
                        <Film className="w-4 h-4" />
                        <span>Video Analysis</span>
                      </button>
                    </div>

                    <div className="text-xs font-mono text-zinc-500">
                      Target Endpoint: <code className="text-orange-600 dark:text-orange-400 font-bold">{detectMode === "image" ? "/upload_image" : "/upload_video"}</code>
                    </div>
                  </div>

                  {/* IMAGE DETECTION MODE */}
                  {detectMode === "image" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      {/* Upload Controls */}
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                          <Upload className="w-5 h-5 text-orange-500" />
                          Select Image File
                        </h3>

                        {/* Drag & Drop Dropzone */}
                        <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-100/50 dark:bg-zinc-900/30">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/bmp"
                            onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1">
                            {imageFile ? imageFile.name : "Click to select or drag & drop"}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono">JPG, PNG, WEBP, BMP (Max 15MB)</p>
                        </label>

                        {/* Local Preview */}
                        {imagePreview && (
                          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-60 flex items-center justify-center bg-zinc-100 dark:bg-black">
                            <img src={imagePreview} alt="Selected preview" className="max-h-60 object-contain" />
                          </div>
                        )}

                        {imageError && (
                          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{imageError}</span>
                          </div>
                        )}

                        <button
                          onClick={handleAnalyzeImage}
                          disabled={!imageFile || imageAnalyzing}
                          className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 disabled:opacity-50 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {imageAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Running YOLOv8 Detection...</span>
                            </>
                          ) : (
                            <>
                              <Crosshair className="w-4 h-4" />
                              <span>Analyze Image</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Annotated Detection Result */}
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4 mb-6">
                            <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              Detection Output
                            </h3>
                            {imageResultUrl && (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                                Success
                              </span>
                            )}
                          </div>

                          {imageResultUrl ? (
                            <div className="space-y-6">
                              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black flex items-center justify-center min-h-[250px]">
                                <img
                                  src={imageResultUrl}
                                  alt="Annotated YOLOv8 output"
                                  className="max-h-96 object-contain"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Status</div>
                                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Annotated</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Engine</div>
                                  <div className="text-sm font-extrabold text-orange-600 dark:text-orange-400">YOLOv8 PyTorch</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center col-span-1 sm:col-span-1">
                                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Source</div>
                                  <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-bold truncate">Flask Service</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[250px] sm:min-h-[300px] border border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center p-6 sm:p-8 text-zinc-600">
                              <Crosshair className="w-10 sm:w-12 h-10 sm:h-12 mb-3 text-zinc-400 dark:text-zinc-800" />
                              <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-400">No detection analyzed yet</p>
                              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-600 mt-1 max-w-xs">
                                Select an image on the left and click Analyze Image to view real-time YOLOv8 bounding boxes.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIDEO DETECTION MODE */}
                  {detectMode === "video" && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 max-w-3xl mx-auto shadow-sm">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-orange-500" />
                        Select Video File for YOLO Processing
                      </h3>

                      <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-100/50 dark:bg-zinc-900/30">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                          onChange={(e) => handleVideoFileChange(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                          <Film className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1">
                          {videoFile ? videoFile.name : "Click to select aerial video file"}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">MP4, WEBM, MOV, AVI, MKV (Max 50MB)</p>
                      </label>

                      {videoError && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{videoError}</span>
                        </div>
                      )}

                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={!videoFile || videoAnalyzing}
                        className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 disabled:opacity-50 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {videoAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing Video Frames...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Analyze Video Stream</span>
                          </>
                        )}
                      </button>

                      {videoResult && (
                        <div className="p-4 sm:p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 text-center">
                          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            Video Analysis Active
                          </div>
                          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black flex items-center justify-center min-h-[200px]">
                            <img
                              src={`${appUrl}${videoResult.stream_url || "/video_feed"}`}
                              alt="Processed video frame stream"
                              className="w-full max-h-96 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE CAMERA STREAM */}
              {activeTab === "camera" && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-orange-500" />
                        Live MJPEG Surveillance Stream
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Continuous real-time frame evaluation via OpenCV and YOLOv8 engine.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {!cameraActive ? (
                        <button
                          onClick={handleStartCamera}
                          disabled={cameraLoading}
                          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          <span>Start Camera</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStopCamera}
                          disabled={cameraLoading}
                          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-red-600 dark:text-red-400 disabled:opacity-50 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                          <span>Stop Camera</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {cameraError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Stream Video Container */}
                  <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                    {cameraActive ? (
                      <img
                        src={`${appUrl}/webcam_feed?t=${cameraKey}`}
                        alt="Real-time webcam detection feed"
                        className="w-full max-h-[550px] object-contain"
                        onError={() => {
                          setCameraError("Camera feed stream disconnected.");
                          setCameraActive(false);
                        }}
                      />
                    ) : (
                      <div className="text-center p-6 sm:p-8 space-y-4">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-600 flex items-center justify-center mx-auto">
                          <Camera className="w-7 sm:w-8 h-7 sm:h-8" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Camera Standby</div>
                          <div className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                            Click "Start Camera" above to launch the MJPEG live video stream and evaluate frames in real-time.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT HISTORY */}
              {activeTab === "history" && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        Audit Detection History Log
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Records pulled directly from SQLite database (<code className="text-orange-600 dark:text-orange-400">firewatch.db</code>).
                      </p>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search history..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                        />
                      </div>

                      <select
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Records</option>
                        <option value="fire">Fire Detected</option>
                        <option value="smoke">Smoke Detected</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Records Table */}
                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-2xl">
                    <table className="w-full min-w-[600px] text-left text-xs">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Record ID</th>
                          <th className="p-4">Source Type</th>
                          <th className="p-4">Fire Count</th>
                          <th className="p-4">Smoke Count</th>
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Telegram Dispatch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                        {filteredHistory.length > 0 ? (
                          filteredHistory.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="p-4 font-mono text-zinc-500">#{row.id || idx + 1}</td>
                              <td className="p-4 font-bold capitalize text-zinc-950 dark:text-white">{row.source || "Image Upload"}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.fire_count > 0 ? "bg-red-500/20 text-red-600 dark:text-red-400" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"}`}>
                                  {row.fire_count} Fire
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.smoke_count > 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"}`}>
                                  {row.smoke_count} Smoke
                                </span>
                              </td>
                              <td className="p-4 font-mono text-zinc-500 dark:text-zinc-400">{row.timestamp || "Recent"}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.alert_sent ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"}`}>
                                  {row.alert_sent ? "Sent" : "Skipped"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500 font-mono">
                              No detection audit records found in SQLite database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-4">
                    <PieChart className="w-5 h-5 text-orange-500" />
                    Detection Metrics & Analytics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="p-5 sm:p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-xs font-mono text-zinc-500 uppercase">Detection Ratio</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white">
                        {stats.fire_detections + stats.smoke_detections > 0
                          ? `${Math.round((stats.fire_detections / (stats.fire_detections + stats.smoke_detections)) * 100)}% Fire`
                          : "No Detections"}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Proportion of fire events vs smoke occurrences.</p>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-xs font-mono text-zinc-500 uppercase">Alert Efficiency</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {stats.total_detections > 0
                          ? `${Math.round((stats.alerts_sent / stats.total_detections) * 100)}% Alerted`
                          : "100% Ready"}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Telegram alert dispatches per incident count.</p>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-xs font-mono text-zinc-500 uppercase">Backend Service Target</div>
                      <div className="text-lg sm:text-xl font-mono text-orange-600 dark:text-orange-400 font-bold truncate">{appUrl}</div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Python Flask API target backend engine.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TELEGRAM ALERTS */}
              {activeTab === "alerts" && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-4">
                    <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Telegram Notification Dispatch Status
                  </h3>

                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-2xl">
                    <table className="w-full min-w-[500px] text-left text-xs">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Notification ID</th>
                          <th className="p-4">Event Source</th>
                          <th className="p-4">Incident Level</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                        {alertsData.length > 0 ? (
                          alertsData.map((alert, idx) => (
                            <tr key={alert.id || idx}>
                              <td className="p-4 font-mono text-zinc-500">#{alert.id || idx + 1}</td>
                              <td className="p-4 font-bold text-zinc-950 dark:text-white">{alert.source || "Image Incident"}</td>
                              <td className="p-4 text-orange-600 dark:text-orange-400 font-bold">{alert.type || "Fire / Smoke Warning"}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                  Dispatched
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-zinc-500 font-mono">
                              Telegram Alert System is active and listening for fire events.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </motion.section>

      {/* 
        ==================================================
        8. FINAL CTA
        ==================================================
      */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.15, once: false }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-16 sm:py-28 px-4 sm:px-6 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300 text-center overflow-hidden"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Centered Video Before Text (Transparent, Zoomed & Large) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="w-full flex justify-center items-center my-4 sm:my-10 overflow-visible"
          >
            <video
              src="/endvideo.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full max-w-md sm:max-w-xl lg:max-w-2xl h-auto block transform scale-110 sm:scale-135 transition-transform duration-300 pointer-events-none"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-zinc-950 dark:text-white mb-4 sm:mb-6"
          >
            Start Monitoring with FireWatch AI
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-sm sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Analyze images, videos, and live camera feeds with AI-powered fire and smoke detection directly in this workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, once: false }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <a
              href="#platform"
              onClick={handlePlatformClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent border border-black text-black hover:bg-orange-600 hover:border-orange-600 hover:text-white dark:bg-transparent dark:border-white dark:text-white dark:hover:bg-orange-600 dark:hover:border-orange-600 dark:hover:text-white font-bold text-sm tracking-wide transition-all duration-300"
            >
              <span>Upload & Detect</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent border border-black text-black hover:bg-zinc-200 hover:border-zinc-200 hover:text-orange-600 dark:bg-transparent dark:border-white dark:text-white dark:hover:bg-white-600 dark:hover:border-white-600 dark:hover:text-orange font-bold text-sm tracking-wide transition-all duration-300"
            >
              <span>Explore Features</span>
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* 
        ==================================================
        9. FOOTER (STRICTLY BLACK BG-BLACK)
        ==================================================
      */}
      <footer className="bg-black text-white border-t border-zinc-900 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <a href="#hero" className="flex items-center gap-2.5 font-bold text-xl mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <span className="font-extrabold tracking-tighter text-white">
                  FireWatch<span className="text-orange-500"> AI</span>
                </span>
              </a>
              <p className="text-zinc-400 text-sm max-w-sm font-normal leading-relaxed mb-6">
                AI-powered forest fire and smoke detection using YOLOv8 computer vision.
              </p>
            </div>

            <div>
              <h4 className="font-mono font-bold text-xs uppercase text-zinc-500 tracking-wider mb-4">
                Navigation
              </h4>
              <ul className="space-y-2.5 text-sm text-zinc-400 font-medium">
                <li>
                  <a href="#features" className="hover:text-orange-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-orange-400 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#technology" className="hover:text-orange-400 transition-colors">
                    Technology
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-orange-400 transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#platform" className="hover:text-orange-400 transition-colors">
                    Platform
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-xs uppercase text-zinc-500 tracking-wider mb-4">
                System Platform
              </h4>
              <ul className="space-y-2.5 text-sm text-zinc-400 font-medium">
                <li>
                  <a href="#platform" onClick={handlePlatformClick} className="hover:text-orange-400 transition-colors">
                    YOLOv8 Engine Workspace
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-normal">
            <div>© 2026 FireWatch AI</div>
          </div>
        </div>
      </footer>

      {/* Backend Offline Modal Notice */}
      <AnimatePresence>
        {showOfflineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Platform Unavailable</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                FireWatch AI platform is currently offline. Please start the Flask backend server at <code className="text-orange-400 font-mono font-bold">{appUrl}</code> and try again.
              </p>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.7),-4px_-4px_10px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer"
              >
                Close Notice
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
