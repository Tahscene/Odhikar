import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

const QUICK_ACTIONS = [
  { label: "জমি বিরোধ", query: "জমি বিরোধে আমার কী অধিকার আছে?" },
  { label: "পারিবারিক সহিংসতা", query: "পারিবারিক সহিংসতা থেকে সুরক্ষা পেতে কী করতে হবে?" },
  { label: "মজুরি দাবি", query: "মালিক আমার মজুরি দিচ্ছে না, কী করব?" },
  { label: "তালাক প্রক্রিয়া", query: "তালাকের আইনি প্রক্রিয়া কী?" },
  { label: "জামিন", query: "জামিনের জন্য কী করতে হবে?" },
  { label: "আইনি সহায়তা", query: "বিনামূল্যে আইনি সহায়তা কোথায় পাবো?" },
];

export default function Bot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "আসসালামু আলাইকুম! আমি নাগরিকবট। আপনার আইনি প্রশ্নে সাহায্য করতে পারি। কী জানতে চান?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/bot/chat", {
        message: userMsg,
        history: newMessages.slice(-10),
      });
      setMessages([...newMessages, {
        role: "assistant",
        content: data.response,
        laws: data.relevant_laws,
      }]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.response || "";
      setMessages([...newMessages, {
        role: "assistant",
        content: detail
          ? `দুঃখিত, একটি সমস্যা হয়েছে: ${detail}`
          : "দুঃখিত, সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed background image with overlay */}
      <div
        className="fixed inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/bot-bg.png')", backgroundPosition: "center 30%" }}
      />
      <div className="fixed inset-0 bg-ink/40" />

      {/* Navbar */}
      <nav className="relative z-10 bg-gradient-to-r from-ink via-bdgreen-dark to-bdgreen px-4 md:px-6 py-3 flex justify-between items-center shadow-xl shadow-bdgreen/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display text-lg text-white font-bold">নাগরিকবট</span>
            <span className="ml-2 text-[10px] text-white/40 tracking-[2px] font-mono">NAGORIKBOT</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/mamla-bazi")} className="text-sm text-white/70 hover:text-white transition-colors">🚨 মামলাবাজি</button>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-white/70 hover:text-white transition-colors">📋 ড্যাশবোর্ড</button>
          <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">লগ আউট</button>
        </div>
      </nav>

      {/* Chat messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-5 py-4 text-base leading-relaxed ${
              msg.role === "user"
                ? "bg-bdgreen text-white rounded-br-none shadow-lg"
                : "bg-white/95 text-navy border border-white/20 rounded-bl-none shadow-lg"
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.laws && msg.laws.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-bdgreen/10">
                  <div className="text-xs font-semibold text-bdgreen mb-1.5">সংশ্লিষ্ট আইন:</div>
                  {msg.laws.map((law, j) => (
                    <div key={j} className="text-sm text-slate pl-2.5 border-l-2 border-bdgreen/20 mt-1.5">
                      {law.law_title_bn} - ধারা {law.section}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-4 flex justify-start">
            <div className="bg-white/90 rounded-xl px-5 py-4 text-base text-slate animate-pulse shadow-lg">
              লিখছে...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="relative z-10 px-4 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.query)}
                className="bg-white/90 text-navy text-sm px-4 py-2.5 rounded-full border border-white/30 hover:bg-white hover:shadow-md transition-all font-medium"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 p-4 border-t border-white/10 bg-ink/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary px-5"
          >
            পাঠান
          </button>
        </div>
      </div>
    </div>
  );
}
