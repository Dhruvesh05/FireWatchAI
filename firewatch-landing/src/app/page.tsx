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
        1. FLOATING CLOUD NAVBAR (SOLID WHITE BACKGROUND)
        ==================================================
      */}
      {/* 
        ==================================================
        1. FLOATING CLOUD NAVBAR (SOLID WHITE BACKGROUND)
        ==================================================
      */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl">
        <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-zinc-950 dark:text-white rounded-full px-5 py-3 shadow-2xl shadow-black/20 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between transition-all duration-300">

          {/* Brand Logo */}
          <a href="#hero" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-zinc-950 dark:text-white group shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-zinc-950 dark:text-white">
              FireWatch<span className="text-orange-600"> AI</span>
            </span>
          </a>

          {/* Floating Navbar Platform Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-100/90 dark:bg-zinc-900/90 p-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href="#platform"
                  onClick={(e) => handleTabNavigate(tab.id, e)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Controls & Real Health Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Real Backend Status Indicator */}
            {/* <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800">
              <span
                className={`w-2 h-2 rounded-full ${backendStatus === "online"
                  ? "bg-emerald-500 animate-pulse"
                  : backendStatus === "checking"
                    ? "bg-amber-500"
                    : "bg-red-500"
                  }`}
              />
              <span>
                {backendStatus === "online"
                  ? ""
                  : backendStatus === "checking"
                    ? "Connecting..."
                    : ""}
              </span>
            </div> */}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center transition-all cursor-pointer border border-zinc-200/50 dark:border-zinc-800"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer border border-zinc-200/50 dark:border-zinc-800"
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
              className="md:hidden mt-3 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-2 font-bold text-sm">
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
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-orange-600"
                        }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
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
      <section id="hero" className="relative w-full overflow-hidden min-h-[90vh] flex flex-col items-center justify-center pt-36 sm:pt-48 pb-20 sm:pb-32">
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
          {/* Subtle light & dark mode vignette overlays for contrast */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/10 to-white dark:from-black/60 dark:via-black/30 dark:to-black" /> */}
        </div>

        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-orange-600/25 to-amber-500/15 blur-[140px] rounded-full pointer-events-none z-0" />

        {/* Hero Content Wrapper */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center justify-center">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>YOLOv8 Powered Forest Protection</span>
          </div> */}

          <h1 className="text-8xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 text-zinc-950 dark:text-white leading-[1.05] drop-shadow-sm">
            Detect Fire <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent">
              Before It Spreads.
            </span>
          </h1>

          <p className="text-lg sm:text-2xl text-zinc-700 dark:text-zinc-300 max-w-3xl mx-auto font-medium leading-relaxed mb-12 drop-shadow-sm">
            FireWatch AI uses YOLOv8 computer vision to detect potential fire and smoke events from images, videos, and live camera feeds, helping users monitor incidents and respond faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#platform"
              onClick={handlePlatformClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-orange-600/30 transition-all hover:scale-105"
            >
              <span>Upload & Detect</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 font-bold text-sm tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              <span>Watch Demo</span>
            </a>
          </div>
        </div>
      </section>

      {/* 
        ==================================================
        3. FEATURES SECTION
        ==================================================
      */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-3">
            Core Capabilities
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Intelligent Fire Monitoring System
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-orange-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold mb-3 text-zinc-950 dark:text-white">Image & Video Detection</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Upload forest imagery or aerial video feeds for instant YOLOv8 inference with bounding box detection.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-orange-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold mb-3 text-zinc-950 dark:text-white">Live Camera Streams</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Connect camera feeds to run real-time frame processing for continuous wildfire surveillance.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-orange-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold mb-3 text-zinc-950 dark:text-white">Telegram Alerts</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Automated alert notifications sent directly to Telegram channels upon fire detection confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 
        ==================================================
        4. HOW IT WORKS
        ==================================================
      */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950/50 border-y border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-3">
              Workflow
            </h2>
            <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              How FireWatch AI Protects Forests
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { step: "01", title: "Input Feed", desc: "User uploads image, video, or connects live stream." },
              { step: "02", title: "YOLOv8 Inference", desc: "Neural network processes frames to detect fire and smoke." },
              { step: "03", title: "Audit Logging", desc: "Detection metrics and coordinates are recorded in SQLite." },
              { step: "04", title: "Instant Notification", desc: "Telegram bot dispatches immediate alert to responders." },
            ].map((item, idx) => (
              <div key={idx} className="relative p-6">
                <div className="text-4xl font-extrabold font-mono text-orange-600 dark:text-orange-500 mb-3">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">{item.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ==================================================
        5. TECHNOLOGY SECTION
        ==================================================
      */}
      <section id="technology" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-3">
              Built with Modern Stack
            </h2>
            <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-6">
              Computer Vision Meets Next-Gen SaaS
            </h3>
            <p className="text-base text-zinc-600 dark:text-zinc-400 mb-8 font-normal leading-relaxed">
              FireWatch AI leverages Ultralytics YOLOv8 trained on thousands of aerial forest fire images, integrated with a lightweight Python Flask backend API and a fast Next.js UI.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Cpu className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">YOLOv8 Model</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Eye className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">OpenCV Processing</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Database className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">SQLite Logging</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex items-center gap-3">
                <Send className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Telegram Dispatch</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 text-white space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <span className="text-xs font-mono text-zinc-500 uppercase">Detection Architecture</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Active Engine</span>
            </div>
            <div className="space-y-4 font-mono text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Model Architecture:</span>
                <span className="text-white">YOLOv8 PyTorch</span>
              </div>
              <div className="flex justify-between">
                <span>Input Processing:</span>
                <span className="text-white">640x640 Dynamic Tensor</span>
              </div>
              <div className="flex justify-between">
                <span>Target Classes:</span>
                <span className="text-orange-400 font-bold">Fire [0], Smoke [1]</span>
              </div>
              <div className="flex justify-between">
                <span>Backend Framework:</span>
                <span className="text-white">Python Flask API</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ==================================================
        6. DEMO SECTION
        ==================================================
      */}
      <section id="demo" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-900 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-3">
            Architecture Walkthrough
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-6">
            End-to-End Detection Pipeline
          </h3>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12">
            See how input media passes through the YOLOv8 neural network and triggers database logs and alerts.
          </p>

          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
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
          </div>

          <a
            href="#platform"
            onClick={handlePlatformClick}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-orange-600/25 transition-all hover:scale-105"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* 
        ==================================================
        7. FIREWATCH PLATFORM SECTION (#platform)
        ==================================================
      */}
      <section id="platform" className="py-24 px-6 bg-black text-white border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                <Activity className="w-3.5 h-3.5" />
                <span>FireWatch Application Workspace</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                FireWatch AI Platform
              </h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-xl">
                Analyze images and videos, stream live camera feeds, and inspect audit records powered by the Flask YOLOv8 backend.
              </p>
            </div>

            <button
              onClick={fetchPlatformData}
              disabled={loadingData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-orange-500" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Detections</span>
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">
                {loadingData ? "-" : stats.total_detections}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Fire Events</span>
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-red-500">
                {loadingData ? "-" : stats.fire_detections}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Smoke Events</span>
                <CloudFog className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                {loadingData ? "-" : stats.smoke_detections}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Alerts Sent</span>
                <Send className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                {loadingData ? "-" : stats.alerts_sent}
              </div>
            </div>
          </div>

          {/* Platform Main Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-900 pb-4">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${isActive
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                    : "bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: DETECTION WORKSPACE */}
          {activeTab === "detect" && (
            <div className="space-y-8">
              {/* Image vs Video Toggle */}
              <div className="flex items-center justify-between">
                <div className="inline-flex p-1 bg-zinc-950 border border-zinc-900 rounded-2xl">
                  <button
                    onClick={() => setDetectMode("image")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${detectMode === "image" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image Analysis</span>
                  </button>
                  <button
                    onClick={() => setDetectMode("video")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${detectMode === "video" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video Analysis</span>
                  </button>
                </div>

                <div className="text-xs font-mono text-zinc-500 hidden sm:block">
                  Target Endpoint: <code className="text-orange-400 font-bold">{detectMode === "image" ? "/upload_image" : "/upload_video"}</code>
                </div>
              </div>

              {/* IMAGE DETECTION MODE */}
              {detectMode === "image" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upload Controls */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-orange-500" />
                      Select Image File
                    </h3>

                    {/* Drag & Drop Dropzone */}
                    <label className="border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-900/30">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/bmp"
                        onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">
                        {imageFile ? imageFile.name : "Click to select or drag & drop"}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">JPG, PNG, WEBP, BMP (Max 15MB)</p>
                    </label>

                    {/* Local Preview */}
                    {imagePreview && (
                      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 max-h-60 flex items-center justify-center bg-black">
                        <img src={imagePreview} alt="Selected preview" className="max-h-60 object-contain" />
                      </div>
                    )}

                    {imageError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{imageError}</span>
                      </div>
                    )}

                    <button
                      onClick={handleAnalyzeImage}
                      disabled={!imageFile || imageAnalyzing}
                      className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
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
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Eye className="w-5 h-5 text-emerald-400" />
                          Detection Output
                        </h3>
                        {imageResultUrl && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold">
                            Success
                          </span>
                        )}
                      </div>

                      {imageResultUrl ? (
                        <div className="space-y-6">
                          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center min-h-[250px]">
                            <img
                              src={imageResultUrl}
                              alt="Annotated YOLOv8 output"
                              className="max-h-96 object-contain"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Status</div>
                              <div className="text-sm font-extrabold text-emerald-400">Annotated</div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Engine</div>
                              <div className="text-sm font-extrabold text-orange-400">YOLOv8 PyTorch</div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center col-span-2 sm:col-span-1">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Source</div>
                              <div className="text-xs font-mono text-zinc-300 font-bold truncate">Flask Service</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[300px] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-zinc-600">
                          <Crosshair className="w-12 h-12 mb-3 text-zinc-800" />
                          <p className="text-sm font-semibold text-zinc-400">No detection analyzed yet</p>
                          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
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
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-orange-500" />
                    Select Video File for YOLO Processing
                  </h3>

                  <label className="border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-900/30">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                      onChange={(e) => handleVideoFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                      <Film className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      {videoFile ? videoFile.name : "Click to select aerial video file"}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">MP4, WEBM, MOV, AVI, MKV (Max 50MB)</p>
                  </label>

                  {videoError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{videoError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeVideo}
                    disabled={!videoFile || videoAnalyzing}
                    className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
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
                    <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 text-center">
                      <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                        Video Analysis Active
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center min-h-[250px]">
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
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-orange-500" />
                    Live MJPEG Surveillance Stream
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Continuous real-time frame evaluation via OpenCV and YOLOv8 engine.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!cameraActive ? (
                    <button
                      onClick={handleStartCamera}
                      disabled={cameraLoading}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>Start Camera</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopCamera}
                      disabled={cameraLoading}
                      className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                      <span>Stop Camera</span>
                    </button>
                  )}
                </div>
              </div>

              {cameraError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Stream Video Container */}
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-black min-h-[400px] flex items-center justify-center">
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
                  <div className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Camera Standby</div>
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
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    Audit Detection History Log
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Records pulled directly from SQLite database (<code className="text-orange-400">firewatch.db</code>).
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Records</option>
                    <option value="fire">Fire Detected</option>
                    <option value="smoke">Smoke Detected</option>
                  </select>
                </div>
              </div>

              {/* Audit Records Table */}
              <div className="overflow-x-auto border border-zinc-900 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Record ID</th>
                      <th className="p-4">Source Type</th>
                      <th className="p-4">Fire Count</th>
                      <th className="p-4">Smoke Count</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Telegram Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="p-4 font-mono text-zinc-500">#{row.id || idx + 1}</td>
                          <td className="p-4 font-bold capitalize text-white">{row.source || "Image Upload"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.fire_count > 0 ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-500"}`}>
                              {row.fire_count} Fire
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.smoke_count > 0 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                              {row.smoke_count} Smoke
                            </span>
                          </td>
                          <td className="p-4 font-mono text-zinc-400">{row.timestamp || "Recent"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.alert_sent ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
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
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-4">
                <PieChart className="w-5 h-5 text-orange-500" />
                Detection Metrics & Analytics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-mono text-zinc-500 uppercase">Detection Ratio</div>
                  <div className="text-2xl font-extrabold text-white">
                    {stats.fire_detections + stats.smoke_detections > 0
                      ? `${Math.round((stats.fire_detections / (stats.fire_detections + stats.smoke_detections)) * 100)}% Fire`
                      : "No Detections"}
                  </div>
                  <p className="text-xs text-zinc-400">Proportion of fire events vs smoke occurrences.</p>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-mono text-zinc-500 uppercase">Alert Efficiency</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {stats.total_detections > 0
                      ? `${Math.round((stats.alerts_sent / stats.total_detections) * 100)}% Alerted`
                      : "100% Ready"}
                  </div>
                  <p className="text-xs text-zinc-400">Telegram alert dispatches per incident count.</p>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-mono text-zinc-500 uppercase">Backend Service Target</div>
                  <div className="text-xl font-mono text-orange-400 font-bold truncate">{appUrl}</div>
                  <p className="text-xs text-zinc-400">Python Flask API target backend engine.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TELEGRAM ALERTS */}
          {activeTab === "alerts" && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-4">
                <Bell className="w-5 h-5 text-emerald-400" />
                Telegram Notification Dispatch Status
              </h3>

              <div className="overflow-x-auto border border-zinc-900 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Notification ID</th>
                      <th className="p-4">Event Source</th>
                      <th className="p-4">Incident Level</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {alertsData.length > 0 ? (
                      alertsData.map((alert, idx) => (
                        <tr key={alert.id || idx}>
                          <td className="p-4 font-mono text-zinc-500">#{alert.id || idx + 1}</td>
                          <td className="p-4 font-bold text-white">{alert.source || "Image Incident"}</td>
                          <td className="p-4 text-orange-400 font-bold">{alert.type || "Fire / Smoke Warning"}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
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

        </div>
      </section>

      {/* 
        ==================================================
        8. FINAL CTA
        ==================================================
      */}
      <section className="py-28 px-6 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-white mb-6">
            Start Monitoring with FireWatch AI
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
            Analyze images, videos, and live camera feeds with AI-powered fire and smoke detection directly in this workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#platform"
              onClick={handlePlatformClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-orange-600/25 transition-all hover:scale-105"
            >
              <span>Upload & Detect</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 font-bold text-sm tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              <span>Explore Features</span>
            </a>
          </div>
        </div>
      </section>

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
                className="w-full py-3 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
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
