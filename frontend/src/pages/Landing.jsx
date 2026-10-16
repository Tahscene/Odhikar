import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const STATS = [
  { value: "46,00,000+", label: "Pending Cases", label_bn: "বিচারাধীন মামলা" },
  { value: "2,301", label: "Judges", label_bn: "বিচারক" },
  { value: "3", label: "AI Tools", label_bn: "AI টুল" },
  { value: "64", label: "Districts", label_bn: "জেলা কভারেজ" },
];

const TOOLS = [
  {
    icon: "⚖",
    title: "Case Prioritizer",
    title_bn: "কেস অগ্রাধিকার নির্ণয়",
    desc: "AI scores each case 0-100 based on age, type, sensitivity and urgency. Judges see the most critical cases first.",
    desc_bn: "AI প্রতিটি মামলাকে বয়স, ধরন, সংবেদনশীলতা ও জরুরিতার ভিত্তিতে ০-১০০ স্কোর দেয়। বিচারক সবচেয়ে জরুরি মামলা আগে দেখেন।",
    accent: "from-bdred to-bdred/80",
    iconBg: "bg-bdred/10",
  },
  {
    icon: "📜",
    title: "Legal Summarizer",
    title_bn: "আইনি সারাংশকারী",
    desc: "RAG-powered AI reads case documents, identifies applicable Bangladesh laws with specific sections, and generates structured summaries.",
    desc_bn: "RAG-চালিত AI মামলার নথি পড়ে, প্রযোজ্য বাংলাদেশি আইনের নির্দিষ্ট ধারা চিহ্নিত করে এবং কাঠামোগত সারাংশ তৈরি করে।",
    accent: "from-gold to-gold/80",
    iconBg: "bg-gold/10",
  },
  {
    icon: "💬",
    title: "NagorikBot",
    title_bn: "নাগরিকবট",
    desc: "Citizens ask legal questions in plain Bangla. The chatbot explains rights, guides court procedures, and locates legal aid offices.",
    desc_bn: "নাগরিকরা সহজ বাংলায় আইনি প্রশ্ন করেন। চ্যাটবট অধিকার ব্যাখ্যা করে, আদালত প্রক্রিয়া গাইড করে এবং আইনি সহায়তা কেন্দ্র খুঁজে দেয়।",
    accent: "from-bdgreen to-bdgreen-dark",
    iconBg: "bg-bdgreen/10",
  },
];

const FEATURES = [
  { icon: "🔒", title: "End-to-End Encryption", title_bn: "সম্পূর্ণ এনক্রিপশন", desc_bn: "JWT টোকেন, bcrypt পাসওয়ার্ড, hash-chain অডিট লেজার" },
  { icon: "🛡", title: "Sensitive Case Protection", title_bn: "সংবেদনশীল মামলা সুরক্ষা", desc_bn: "পারিবারিক সহিংসতা ও নাবালক মামলায় স্বয়ংক্রিয় নাম গোপন" },
  { icon: "📊", title: "XGBoost ML Model", title_bn: "XGBoost ML মডেল", desc_bn: "১৪টি feature, R²=০.৯৫২, seed=42 দিয়ে reproducible training" },
  { icon: "🌐", title: "RAG Knowledge Base", title_bn: "RAG জ্ঞানভিত্তি", desc_bn: "বাংলাদেশের ৮টি প্রধান আইনের ৫০+ ধারা keyword-matched retrieval" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("bn");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* ===== Fixed Navbar ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-black/5" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-bdgreen/30 shadow-md">
              <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className={`font-display text-lg font-bold ${scrolled ? "text-navy" : "text-white"}`}>অধিকার</span>
              <span className={`ml-2 text-[10px] tracking-[3px] font-mono uppercase ${scrolled ? "text-slate" : "text-white/50"}`}>ODHIKAR</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* MamlaBazi link */}
            <button
              onClick={() => navigate("/mamla-bazi")}
              className={`hidden md:block text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                scrolled ? "text-bdred hover:bg-bdred/10" : "text-bdred/80 bg-white/10 hover:bg-white/20"
              }`}
            >
              🚨 {lang === "bn" ? "মামলাবাজি" : "MamlaBazi"}
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                scrolled ? "bg-slate/10 text-slate hover:bg-slate/20" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span className={lang === "bn" ? "font-bold" : "opacity-50"}>বাং</span>
              <span className="opacity-30">|</span>
              <span className={lang === "en" ? "font-bold" : "opacity-50"}>EN</span>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="bg-bdgreen hover:bg-bdgreen-dark text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-bdgreen/20"
            >
              {lang === "bn" ? "লগইন" : "Sign In"}
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <div className="relative min-h-[92vh] flex">
        {/* Left content */}
        <div className="md:w-[48%] flex flex-col justify-center px-8 md:px-16 pt-20 pb-12 bg-gradient-to-br from-ink via-navy to-bdgreen-dark relative overflow-hidden">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-bdgreen animate-pulse" />
              <span className="text-xs text-white/70 font-medium">
                {lang === "bn" ? "BCOLBD 2026 AI Category" : "BCOLBD 2026 AI Category"}
              </span>
            </div>

            <h1 className="font-display font-bold text-white leading-[1.05] text-5xl md:text-6xl lg:text-7xl mb-6">
              {lang === "bn" ? (
                <>বিচার বিভাগের<br/><span className="text-gold">AI প্ল্যাটফর্ম</span></>
              ) : (
                <>Judiciary<br/><span className="text-gold">AI Platform</span></>
              )}
            </h1>

            <p className="text-white/70 text-lg md:text-xl leading-relaxed max-w-md mb-10">
              {lang === "bn"
                ? "মামলার অগ্রাধিকার নির্ণয়, আইনি সারাংশ এবং নাগরিক সহায়তা, একটি প্ল্যাটফর্মে।"
                : "Case prioritization, legal summarization and citizen legal aid, all in one platform."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="bg-gold hover:bg-white text-ink font-bold px-8 py-3.5 rounded-lg text-base transition-all shadow-lg hover:shadow-xl"
              >
                {lang === "bn" ? "বিচারক হিসেবে ঢুকুন" : "Judge Login"}
              </button>
              <button
                onClick={() => navigate("/login")}
                className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg text-base hover:bg-white/10 transition-colors"
              >
                {lang === "bn" ? "নাগরিক হিসেবে ঢুকুন" : "Citizen Login"}
              </button>
            </div>

            <p className="text-white/30 text-sm mt-10 font-medium">
              {lang === "bn" ? "সবার জন্য আইন, সবার জন্য ন্যায়" : "Law for all, Justice for all"}
            </p>
          </div>
        </div>

        {/* Right image */}
        <div className="hidden md:block md:w-[52%] relative">
          <img
            src="/hero-justice.jpg"
            alt="Justice"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/20 to-transparent" />
        </div>
      </div>

      {/* ===== Stats Bar ===== */}
      <div className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-bold text-4xl md:text-5xl text-bdgreen">{s.value}</div>
              <div className="text-base text-slate mt-2 font-medium">{lang === "bn" ? s.label_bn : s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Problem Statement ===== */}
      <div className="bg-bdred/[0.03]">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-8 h-[3px] bg-bdred rounded-full" />
            <span className="text-sm font-bold text-bdred uppercase tracking-wider">
              {lang === "bn" ? "সমস্যা" : "The Problem"}
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl text-ink leading-snug font-bold">
            {lang === "bn" ? (
              <>মাত্র <span className="text-bdred">২,৩০১</span> জন বিচারক <span className="text-bdred">৪৬ লক্ষের</span> বেশি মামলা সামলাচ্ছেন</>
            ) : (
              <>Only <span className="text-bdred">2,301</span> judges handle over <span className="text-bdred">4.6 million</span> pending cases</>
            )}
          </h2>
          <p className="text-lg text-slate mt-4 max-w-2xl mx-auto leading-relaxed">
            {lang === "bn"
              ? "ফলে বিচার পেতে বছরের পর বছর লেগে যায়। ODHIKAR AI দিয়ে এই সমস্যার সমাধান করে।"
              : "Justice delayed is justice denied. ODHIKAR uses AI to solve this crisis."
            }
          </p>
        </div>
      </div>

      {/* ===== 3 AI Tools ===== */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-[3px] bg-gold rounded-full" />
              <span className="text-sm font-bold text-gold uppercase tracking-wider">
                {lang === "bn" ? "আমাদের টুলস" : "Our Tools"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              {lang === "bn" ? "তিনটি AI টুল, একটি প্ল্যাটফর্ম" : "Three AI Tools, One Platform"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TOOLS.map((tool, i) => (
              <button
                key={i}
                onClick={() => navigate("/login")}
                className="group text-left bg-white rounded-2xl border border-black/[0.06] p-7 md:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${tool.iconBg} flex items-center justify-center text-2xl mb-5`}>
                  {tool.icon}
                </div>
                <h3 className="font-bold text-navy text-xl mb-1">{lang === "bn" ? tool.title_bn : tool.title}</h3>
                <p className="text-xs font-mono text-slate/50 uppercase tracking-wider mb-4">{tool.title}</p>
                <p className="text-base text-slate leading-relaxed mb-5">{lang === "bn" ? tool.desc_bn : tool.desc}</p>
                <div className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${tool.accent} bg-clip-text text-transparent`}>
                  {lang === "bn" ? "ব্যবহার করুন" : "Get Started"}
                  <span className="group-hover:translate-x-1.5 transition-transform text-current">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Security & Tech ===== */}
      <div className="bg-gradient-to-br from-ink via-navy to-bdgreen-dark text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-[3px] bg-bdgreen rounded-full" />
              <span className="text-sm font-bold text-bdgreen uppercase tracking-wider">
                {lang === "bn" ? "নিরাপত্তা ও প্রযুক্তি" : "Security & Technology"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {lang === "bn" ? "আন্তর্জাতিক মানের নিরাপত্তা" : "Enterprise-Grade Security"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-6 border border-white/[0.08] hover:bg-white/10 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <div className="text-base font-semibold text-white mb-2">{lang === "bn" ? f.title_bn : f.title}</div>
                <div className="text-sm text-white/60 leading-relaxed">{f.desc_bn}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CTA Section ===== */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            {lang === "bn" ? "আজই শুরু করুন" : "Get Started Today"}
          </h2>
          <p className="text-lg text-slate mb-8 max-w-xl mx-auto">
            {lang === "bn"
              ? "বিচারক অথবা নাগরিক, আপনার জন্য ODHIKAR প্রস্তুত।"
              : "Whether you are a Judge or a Citizen, ODHIKAR is ready for you."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/login")} className="bg-bdgreen hover:bg-bdgreen-dark text-white font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg shadow-bdgreen/20">
              {lang === "bn" ? "বিচারক লগইন" : "Judge Login"}
            </button>
            <button onClick={() => navigate("/login")} className="bg-navy hover:bg-ink text-white font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg">
              {lang === "bn" ? "নাগরিক লগইন" : "Citizen Login"}
            </button>
            <button onClick={() => navigate("/mamla-bazi")} className="bg-bdred hover:bg-bdred/90 text-white font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg shadow-bdred/20">
              {lang === "bn" ? "🚨 মামলাবাজি রিপোর্ট" : "🚨 MamlaBazi Report"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <footer className="bg-ink text-white/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
              </div>
              <span className="font-display text-white font-semibold">অধিকার ODHIKAR</span>
            </div>
            <div className="text-center md:text-right text-sm">
              <p className="text-white/40">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার, বিচার বিভাগ</p>
              <p className="text-white/30 mt-1">Team TellTheTruth © 2025</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
