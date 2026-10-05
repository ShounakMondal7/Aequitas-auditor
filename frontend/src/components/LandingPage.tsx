import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileCheck,
  Activity,
  Users,
} from 'lucide-react';
import Lightfall from './Lightfall';

export interface CarouselFeature {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  tag: string;
  img: string;
  icon: React.ElementType;
  overview: string;
  regulation: string;
  specs: { label: string; value: string }[];
  bulletPoints: string[];
}

// Enterprise audit features
const CAROUSEL_ITEMS: CarouselFeature[] = [
  {
    id: 1,
    title: "Autonomous Remediation",
    subtitle: "Real-time bias correction & data rebalancing",
    badge: "In-Processing Mitigation",
    tag: "AIF360 Engine",
    img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    icon: Cpu,
    overview:
      "Continuously monitors model inference streams and dynamically applies Kamiran-Calders reweighting and adversarial debiasing. Unprivileged demographic groups are equalized in real time without sacrificing predictive ROC-AUC accuracy or operational throughput.",
    regulation: "NYC Local Law 144 • EEOC 29 C.F.R. § 1607 (Four-Fifths Rule) • EU AI Act Art. 10",
    specs: [
      { label: "Disparate Impact Target", value: "≥ 0.80 (80% Rule)" },
      { label: "Remediation Latency", value: "< 42ms / batch" },
      { label: "Core Algorithm", value: "Reweighing & Prejudice Remover" },
    ],
    bulletPoints: [
      "Automated reweighting of biased training records before production deployment",
      "Preserves model utility and downstream predictive power with zero label drift",
      "Instant rollback checkpoints for total regulatory transparency and safety",
    ],
  },
  {
    id: 2,
    title: "Neural Auditing",
    subtitle: "Deep dataset inspection & proxy feature discovery",
    badge: "Latent Space Diagnostics",
    tag: "Representation Analysis",
    img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    icon: Activity,
    overview:
      "Dissects high-dimensional feature spaces, NLP token embeddings, and tabular distributions to detect indirect proxy bias (such as postal codes, educational markers, or colloquial phrasing) that secretly correlate with protected categories.",
    regulation: "EU AI Act Art. 10 (Data Governance) • NIST AI RMF 1.0 (MAP 2.3)",
    specs: [
      { label: "Proxy Detection", value: "Mutual Information & SHAP" },
      { label: "Combinatorial Groups", value: "Multi-Attribute (Race × Gender)" },
      { label: "Data Coverage", value: "Tabular, Text & Embeddings" },
    ],
    bulletPoints: [
      "Identifies covert proxy features masking protected demographic categories",
      "Evaluates statistical parity difference and equalized opportunity metrics",
      "Automated distribution shift detection between training and live inference",
    ],
  },
  {
    id: 3,
    title: "EEOC Compliance",
    subtitle: "Automated 4/5ths Rule adherence & legal audit readiness",
    badge: "Regulatory Benchmark",
    tag: "Statutory Adherence",
    img: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80",
    icon: FileCheck,
    overview:
      "Executes continuous compliance checks against the EEOC Four-Fifths Rule and municipal algorithmic accountability statutes. Instantly flags adverse impact violations and generates tamper-evident audit filings formatted for enterprise legal counsel.",
    regulation: "EEOC Uniform Guidelines § 1607.4D • Title VII Civil Rights Act",
    specs: [
      { label: "Safety Threshold", value: "0.80 Disparate Impact Boundary" },
      { label: "Significance Test", value: "Two-Tailed Z-Test (p < 0.05)" },
      { label: "Documentation", value: "1-Click Certified Audit Export" },
    ],
    bulletPoints: [
      "Continuous benchmark evaluation against Title VII and EEOC standards",
      "Pre-configured legal export ready for compliance and board submission",
      "Automatic disparate impact threshold alerts with configurable sensitivities",
    ],
  },
  {
    id: 4,
    title: "Live Reasoning Logs",
    subtitle: "Transparent AI decision matrices & agent telemetry",
    badge: "Auditable Telemetry",
    tag: "High-Frequency Stream",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    icon: ShieldCheck,
    overview:
      "Provides real-time visibility into autonomous audit agent decision-making. Every metric evaluation, statistical hypothesis test, and proposed mitigation step is captured in high-frequency event streams with cryptographic verification.",
    regulation: "EU AI Act Art. 12 (Record-Keeping) • ISO/IEC 42001 Standard",
    specs: [
      { label: "Telemetry Protocol", value: "Low-Latency WebSocket Bus" },
      { label: "Audit Integrity", value: "Cryptographically Chained Logs" },
      { label: "Explainability", value: "SHAP & Counterfactual Matrices" },
    ],
    bulletPoints: [
      "Real-time terminal telemetry stream with step-by-step agent reasoning",
      "Traceable justification for every proposed fairness remediation",
      "Exportable audit logs compatible with Splunk, Datadog, and enterprise SIEMs",
    ],
  },
  {
    id: 5,
    title: "Human-in-the-Loop",
    subtitle: "Executive override controls & governance sign-off gates",
    badge: "Human Oversight",
    tag: "Dual-Key Review",
    img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    icon: Users,
    overview:
      "Guarantees that sensitive model remediations and threshold modifications are never committed without authorized human review. Empowers compliance officers and lead data scientists with dual-key approval gates and complete rollback capability.",
    regulation: "EU AI Act Art. 14 (Human Oversight) • White House AI Bill of Rights",
    specs: [
      { label: "Sign-Off Protocol", value: "Dual-Key Executive Review" },
      { label: "Rollback Speed", value: "Instant Zero-Downtime Revert" },
      { label: "Role Permissions", value: "Admin / Compliance / Auditor" },
    ],
    bulletPoints: [
      "Configurable approval thresholds for high-stakes decision models",
      "Interactive remediation diffs showing before/after disparate impact curves",
      "Auditor attribution tracking with timestamped executive validation",
    ],
  },
];

export const LandingPage = ({
  onLogin,
  onLaunchWorkspace,
}: {
  onLogin: () => void;
  onLaunchWorkspace?: () => void;
}) => {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<CarouselFeature>(CAROUSEL_ITEMS[0]);
  const detailSectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getFeatureTitle = (item: CarouselFeature) => t(`landing.f${item.id}_title`, item.title);
  const getFeatureSubtitle = (item: CarouselFeature) => t(`landing.f${item.id}_subtitle`, item.subtitle);
  const getFeatureBadge = (item: CarouselFeature) => t(`landing.f${item.id}_badge`, item.badge);
  const getFeatureTag = (item: CarouselFeature) => t(`landing.f${item.id}_tag`, item.tag);
  const getFeatureOverview = (item: CarouselFeature) => t(`landing.f${item.id}_overview`, item.overview);
  const getFeatureRegulation = (item: CarouselFeature) => t(`landing.f${item.id}_regulation`, item.regulation);
  const getFeatureBullets = (item: CarouselFeature) => [
    t(`landing.f${item.id}_bullet1`, item.bulletPoints[0]),
    t(`landing.f${item.id}_bullet2`, item.bulletPoints[1]),
    t(`landing.f${item.id}_bullet3`, item.bulletPoints[2]),
  ];

  const rotateTo = useCallback((index: number) => {
    setActiveIndex(index);
    setRotation(-index * (360 / CAROUSEL_ITEMS.length));
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = (activeIndex + 1) % CAROUSEL_ITEMS.length;
    rotateTo(nextIndex);
  }, [activeIndex, rotateTo]);

  const handlePrev = useCallback(() => {
    const prevIndex = (activeIndex - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length;
    rotateTo(prevIndex);
  }, [activeIndex, rotateTo]);

  const handleScrollToBreakdown = () => {
    const element = document.getElementById('breakdown-section');
    if (!element) return;

    // Small delay ensures rotation animation starts gracefully before scrolling begins
    setTimeout(() => {
      // 1. Direct container scroll (essential for Chrome/Safari with overflow-y-auto root)
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: element.offsetTop - 30,
          behavior: 'smooth',
        });
      }

      // 2. Window scroll fallback
      window.scrollTo({
        top: element.offsetTop - 30,
        behavior: 'smooth',
      });

      // 3. Native scrollIntoView fallback
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        element.scrollIntoView();
      }
    }, 180);
  };

  // Click card handler: rotate to it, select it, and smoothly scroll down to the breakdown section
  const handleCardClick = (index: number) => {
    rotateTo(index);
    setSelectedFeature(CAROUSEL_ITEMS[index]);
    handleScrollToBreakdown();
  };

  // Smooth auto-rotation logic (pauses on hover)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % CAROUSEL_ITEMS.length;
        setRotation(-next * (360 / CAROUSEL_ITEMS.length));
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full relative bg-[#04020a] text-white overflow-x-hidden overflow-y-auto scroll-smooth font-sans selection:bg-teal-500/30"
    >
      {/* ============================================================
          1. HIGH-PERFORMANCE LIGHTFALL BACKGROUND (React Bits)
         ============================================================ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Lightfall
          colors={['#9d004e', '#158914', '#dde05c']}
          backgroundColor="#0a29ff"
          speed={0.5}
          streakCount={3}
          streakWidth={1.2}
          streakLength={1.2}
          glow={1.1}
          density={0.7}
          twinkle={1.0}
          zoom={2.6}
          backgroundGlow={0.6}
          opacity={1.0}
          mouseInteraction={true}
          mouseStrength={0.6}
          mouseRadius={1.0}
          mouseDampening={0.15}
        />
        {/* Soft edge radial vignette deepening screen boundaries */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(4,2,10,0.78)_100%)] pointer-events-none" />
      </div>

      {/* ============================================================
          2. CRYSTAL-CLEAR TOP NAVIGATION (NO BLUR)
         ============================================================ */}
      <nav className="w-full flex items-center justify-between px-6 md:px-12 py-6 z-50 fixed top-0 bg-transparent border-none pointer-events-auto">
        <div className="flex items-center space-x-3">
          {/* Glowing teal triangle/pyramid SVG logo */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-teal-950/70 border border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.6)]">
            <svg
              className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.9)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 22 20 2 20" className="fill-teal-400/25 stroke-teal-400" />
              <polygon points="12 7 18 19 6 19" className="fill-emerald-400/35 stroke-emerald-300" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 tracking-tight">
            {t('nav.aequitas', 'Aequitas')}
          </span>
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-teal-400/25 bg-teal-950/40 text-[10px] uppercase tracking-widest text-teal-300 backdrop-blur-md font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>{t('landing.hero_badge', 'Enterprise Auditor')}</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onLogin}
            className="px-6 py-2.5 text-sm font-bold rounded-full bg-white text-slate-950 hover:bg-teal-400 hover:shadow-[0_0_25px_rgba(45,212,191,0.6)] transition-all duration-300 cursor-pointer active:scale-95"
          >
            {t('landing.login_btn', 'Log In / Sign Up')}
          </button>
        </div>
      </nav>

      {/* ============================================================
          3. CINEMATIC 3D ROTATING CAROUSEL (PROPORTIONED & COMPACT)
         ============================================================ */}
      <section className="min-h-screen flex flex-col items-center justify-center relative z-10 pt-24 pb-12 px-4 perspective-[1200px]">
        {/* 3D Cylindrical Carousel Wrapper */}
        <div
          className="relative w-full max-w-lg h-[360px] md:h-[390px] flex items-center justify-center transform-style-3d"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div
            className="relative w-60 h-[320px] md:w-68 md:h-[350px] transform-style-3d"
            animate={{ rotateY: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 16, mass: 0.9 }}
          >
            {CAROUSEL_ITEMS.map((item, i) => {
              const angle = (360 / CAROUSEL_ITEMS.length) * i;
              const radius = 290; // Proportioned cylindrical radius
              const isActive = activeIndex === i;
              // Determine front vs back orientation to ensure visible cards always receive clicks
              const currentAngle = (((angle + rotation) % 360) + 360) % 360;
              const isFacingBack = currentAngle > 90 && currentAngle < 270;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(i)}
                  className={`absolute inset-0 rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer select-none group ${
                    isActive
                      ? "border-teal-400/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9),0_0_35px_rgba(157,0,78,0.35)] ring-1 ring-teal-400/40 scale-[1.02] z-30"
                      : isFacingBack
                      ? "border-white/10 opacity-30 pointer-events-none z-0"
                      : "border-white/15 shadow-xl opacity-70 hover:opacity-100 hover:scale-[1.01] z-20"
                  }`}
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={item.img}
                    alt={getFeatureTitle(item)}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                  {/* High-Legibility Card Captions */}
                  <div className="absolute bottom-0 inset-x-0 p-4 md:p-5 text-center flex flex-col items-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-teal-300 font-semibold mb-1">
                      {t('landing.feature_prefix', 'Feature')} 0{item.id}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight drop-shadow-md">
                      {getFeatureTitle(item)}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium tracking-wide mt-0.5 line-clamp-1">
                      {getFeatureSubtitle(item)}
                    </p>
                    <div className="mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] font-semibold text-teal-300 flex items-center space-x-1">
                      <span>{t('landing.click_for_breakdown', 'Click for full breakdown')}</span>
                      <ArrowRight className="w-3 h-3 translate-y-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ============================================================
            4. INTERACTIVE CONTROLS, COUNTER & ACTIONS
           ============================================================ */}
        <div className="mt-6 flex flex-col items-center justify-center space-y-3.5 text-center z-20">
          {/* Slide Navigation & Index Counter */}
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slide Index Counter */}
            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-teal-400 font-bold">0{activeIndex + 1}</span>
              <span className="opacity-40">/</span>
              <span>0{CAROUSEL_ITEMS.length}</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination Pill Indicators */}
          <div className="flex items-center space-x-2">
            {CAROUSEL_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  rotateTo(idx);
                  setSelectedFeature(item);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === idx
                    ? "w-8 bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onLaunchWorkspace || onLogin}
              className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(45,212,191,0.5)] hover:shadow-[0_0_40px_rgba(45,212,191,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{t('landing.launch_workspace', 'Launch Auditor Workspace')}</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleScrollToBreakdown}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-teal-400/30 bg-teal-950/30 hover:bg-teal-950/60 text-teal-300 hover:text-teal-200 font-semibold text-xs sm:text-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(45,212,191,0.2)]"
            >
              <span>{t('landing.explore_breakdown', 'Explore Card Breakdown')}</span>
              <span className="text-teal-400 animate-bounce">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. EXPANDED BIG RECTANGULAR CARD EXPLANATION SECTION
         ============================================================ */}
      <section
        ref={detailSectionRef}
        id="breakdown-section"
        className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-20 flex flex-col items-center"
      >
        {/* Section Header */}
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-950/40 text-teal-300 text-xs font-mono uppercase tracking-widest mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('landing.inspection_badge', 'Interactive Feature Inspection')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('landing.deep_arch_title', 'Deep Architecture & Compliance')}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            {t(
              'landing.deep_arch_subtitle',
              'Click any card above or switch below to inspect statutory adherence, algorithms, and real-time mitigation telemetry.'
            )}
          </p>
        </div>

        {/* Feature Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 w-full max-w-4xl">
          {CAROUSEL_ITEMS.map((item, idx) => {
            const isCurrent = selectedFeature.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  rotateTo(idx);
                  setSelectedFeature(item);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                  isCurrent
                    ? "bg-teal-400 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.6)] font-bold scale-105"
                    : "bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10"
                }`}
              >
                <span className="opacity-60 font-mono">0{item.id}</span>
                <span>{getFeatureTitle(item)}</span>
              </button>
            );
          })}
        </div>

        {/* The Big Rectangular Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFeature.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full rounded-3xl overflow-hidden border border-white/20 bg-black/50 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(157,0,78,0.2)] flex flex-col lg:flex-row relative"
          >
            {/* Left Visual Column */}
            <div className="lg:w-5/12 relative min-h-[300px] lg:min-h-[480px] overflow-hidden flex flex-col justify-end p-6 sm:p-8">
              <img
                src={selectedFeature.img}
                alt={getFeatureTitle(selectedFeature)}
                className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-teal-950/20 mix-blend-overlay pointer-events-none" />

              {/* Badges on Visual */}
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-400/90 text-slate-950 text-xs font-bold shadow-lg">
                    {getFeatureBadge(selectedFeature)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-teal-300 text-xs font-mono font-medium backdrop-blur-md">
                    {getFeatureTag(selectedFeature)}
                  </span>
                </div>

                <div className="bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl p-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                    {t('landing.regulatory_mandate', 'Regulatory Mandate')}
                  </span>
                  <p className="text-xs font-semibold text-slate-200">
                    {getFeatureRegulation(selectedFeature)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Information & Metrics Column */}
            <div className="lg:w-7/12 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6">
              <div>
                {/* Header */}
                <div className="flex items-center space-x-2.5 text-xs font-mono text-teal-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>{t('landing.subsystem_module', 'SUBSYSTEM MODULE')} 0{selectedFeature.id}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {getFeatureTitle(selectedFeature)}
                </h3>
                <p className="text-slate-300 text-sm font-medium mt-1">
                  {getFeatureSubtitle(selectedFeature)}
                </p>

                {/* Core Overview */}
                <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {getFeatureOverview(selectedFeature)}
                </div>

                {/* Key Technical Specifications */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedFeature.specs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col"
                    >
                      <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">
                        {spec.label}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-teal-300 font-mono">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Key Capabilities */}
                <div className="mt-6 space-y-2.5">
                  <span className="text-[11px] uppercase tracking-widest font-mono text-slate-400 block">
                    {t('landing.core_guarantees', 'Core Operational Guarantees')}
                  </span>
                  {getFeatureBullets(selectedFeature).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>{t('landing.back_to_3d', 'Back to 3D View')}</span>
                </button>

                <button
                  type="button"
                  onClick={onLaunchWorkspace || onLogin}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(45,212,191,0.5)] hover:shadow-[0_0_35px_rgba(45,212,191,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{t('landing.launch_in_workspace', 'Launch in Auditor Workspace')}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
};

export default LandingPage;
