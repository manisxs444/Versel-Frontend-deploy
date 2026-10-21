import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ExternalLink,
  Zap, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Key, 
  Globe, 
  Search, 
  Copy, 
  Check, 
  Compass,
  ArrowUpRight,
  Code2,
  Cpu,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import { searchService } from '../services/searchService';

export default function AICopilotChat({ 
  vitals, 
  onAskCopilot, 
  lang 
}) {
  const isHi = lang === 'hi';
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: isHi 
        ? `नमस्ते! यह **गूगल जेमिनी (Google Gemini) AI हब** है।\n\nआप नीचे दिए गए **"गूगल जेमिनी खोलें"** बटन से सीधे जेमिनी के ऑफिशियल पोर्टल पर जाकर **दुनिया का कोई भी सवाल** पूछ सकते हैं — कोडिंग, विज्ञान, गणित, सामान्य ज्ञान, इतिहास या आपातकालीन चिकित्सा!\n\nआप यहाँ नीचे भी सवाल टाइप करके सीधे जेमिनी पर सर्च कर सकते हैं या इन-ऐप पूछ सकते हैं।`
        : `Welcome to the **Google Gemini AI Hub**!\n\nYou can click the **"Open Official Google Gemini"** button below to launch the official Google Gemini portal where you can ask **literally anything without limitations** — coding, science, mathematics, world history, creative writing, or emergency medicine!\n\nYou can also type any question below to launch it directly on Gemini or chat in-app.`,
      engine: 'Google Gemini 1.5'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('jeevansetu_copilot_key') || ''; } catch { return ''; }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  const handleUpdateApiKey = (key) => {
    setApiKey(key);
    try { localStorage.setItem('jeevansetu_copilot_key', key); } catch {}
  };

  // Direct External Links
  const GEMINI_WEB_URL = 'https://gemini.google.com/app';
  const GEMINI_STUDIO_URL = 'https://aistudio.google.com/prompts/new_chat';
  const GEMINI_KEY_URL = 'https://aistudio.google.com/app/apikey';

  const openGeminiDirectly = (query = '') => {
    if (query && query.trim()) {
      // Open Google Search or Gemini with query
      const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(GEMINI_WEB_URL, '_blank', 'noopener,noreferrer');
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [isHi]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert(isHi ? 'आपके ब्राउज़र में वॉइस स्पीच रिकग्निशन समर्थित नहीं है।' : 'Speech recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSpeakText = (text, idx) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_$\\]/g, '').slice(0, 350);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isHi ? 'hi-IN' : 'en-US';
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleInAppAsk = async (textToQuery = null) => {
    const query = textToQuery || input;
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      let finalAnswer = '';
      let engineName = 'Google Gemini Direct';

      // 1. If user entered a Gemini API Key, query live Gemini 1.5 Flash directly
      if (apiKey) {
        const liveRes = await searchService.queryGeminiLive(apiKey, userText, vitals, messages);
        if (liveRes && liveRes.answer) {
          finalAnswer = liveRes.answer;
          engineName = 'Google Gemini 1.5 Flash (Live API)';
        }
      }

      // 2. If no key or key failed, call backend / intelligent responder
      if (!finalAnswer) {
        const backendRes = await onAskCopilot(userText, vitals, 70, apiKey || null, messages);
        finalAnswer = backendRes.copilotOutput || 'Could not fetch response. Please open the official Gemini portal link.';
        engineName = backendRes.engine || 'JeevanSetu Gemini Portal';
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: finalAnswer,
          queryUsed: userText,
          engine: engineName
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: isHi 
            ? 'क्षमा करें, उत्तर प्राप्त करने में समस्या हुई। कृपया ऊपर दिए गए "गूगल जेमिनी ऑफिशियल लिंक" से सीधे पूछें।' 
            : 'Encountered an error. Please use the official Google Gemini source link above to ask anything without limits.',
          engine: 'Google Gemini'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const popularTopics = [
    { label: '🩺 ' + (isHi ? '102°F बुखार का इलाज' : '102°F Fever First Aid'), query: 'How to treat 102 degree fever immediately? Paracetamol dose and cooling tips' },
    { label: '🐍 ' + (isHi ? 'सांप काटने पर ASV प्रोटोकॉल' : 'Snakebite Emergency ASV'), query: 'WHO anti-snake venom protocol and first aid steps' },
    { label: '💻 ' + (isHi ? 'Python React कोड' : 'Python & React Code'), query: 'Write a full-stack React and Python fastAPI code example with auth' },
    { label: '🧬 ' + (isHi ? 'मानव शरीर विज्ञान' : 'Human Physiology & Shock'), query: 'Explain hemorrhagic shock stages and shock index in medical terms' },
    { label: '🌌 ' + (isHi ? 'क्वांटम भौतिकी' : 'Quantum Physics in Simple Words'), query: 'Explain quantum computing and superposition in simple terms' },
    { label: '📈 ' + (isHi ? 'सामान्य ज्ञान एवं करंट अफेयर्स' : 'General Knowledge & News'), query: 'Latest developments in artificial intelligence and global economy' }
  ];

  return (
    <div className="space-y-5">
      {/* 1. HERO BANNER: OFFICIAL GOOGLE GEMINI SOURCE PORTAL */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border border-blue-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  OFFICIAL AI SOURCE
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <span>Google Gemini AI</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                    Official Portal
                  </span>
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isHi
                ? 'गूगल जेमिनी पर आप दुनिया का कोई भी सवाल बिना किसी रुकावट के पूछ सकते हैं — कोडिंग, गणित, विज्ञान, इतिहास, निबंध, चिकित्सा, या सामान्य ज्ञान। सीधे ऑफिशियल पोर्टल पर जाने के लिए नीचे दिए गए बटन पर क्लिक करें:'
                : 'With Google Gemini, you can ask literally anything without limitations — advanced coding, mathematics, science, world history, creative writing, or deep clinical reasoning. Launch the official source portal directly below:'}
            </p>
          </div>

          {/* Action Launch Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <a
              href={GEMINI_WEB_URL}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>{isHi ? '🚀 गूगल जेमिनी ऑफिशियल खोलें' : '🚀 Open Official Google Gemini'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href={GEMINI_STUDIO_URL}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>{isHi ? 'Google AI Studio चैट' : 'Google AI Studio Chat'}</span>
            </a>
          </div>
        </div>

        {/* Optional Gemini API Key configuration drawer */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Key className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {apiKey 
                ? (isHi ? '✓ आपकी पर्सनल Gemini API Key सक्रिय है' : '✓ Custom Gemini API Key active (100% Unlimited In-App)')
                : (isHi ? 'क्या आप इन-ऐप जेमिनी से अनलिमिटेड जवाब चाहते हैं?' : 'Want direct unlimited answers inside this screen?')}
            </span>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-blue-400 hover:underline font-semibold ml-1 cursor-pointer"
            >
              {showKeyInput ? (isHi ? 'छिपाएं' : 'Hide') : (isHi ? 'API Key दर्ज करें' : 'Enter API Key')}
            </button>
          </div>

          <a
            href={GEMINI_KEY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
          >
            <span>{isHi ? 'फ्री में Gemini API Key प्राप्त करें (Google AI Studio)' : 'Get Free Gemini API Key (100% Free on AI Studio)'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {showKeyInput && (
          <div className="mt-3 p-3 bg-slate-950/90 rounded-2xl border border-blue-500/30 flex flex-wrap items-center gap-2">
            <input
              type="password"
              placeholder="Paste Google Gemini API Key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => handleUpdateApiKey(e.target.value)}
              className="flex-1 min-w-[240px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {apiKey && (
              <button
                onClick={() => handleUpdateApiKey('')}
                className="px-3 py-2 bg-red-950/60 text-red-300 hover:bg-red-900 text-xs rounded-xl border border-red-800/60"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. POPULAR QUESTIONS & QUICK DIRECT LAUNCHERS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-[11px] font-mono text-slate-400 uppercase font-bold mb-2.5 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>{isHi ? 'सुझाए गए सवाल (एक क्लिक में पूछें)' : 'Suggested Topics (Click to ask or search on Gemini)'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularTopics.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(item.query);
                handleInAppAsk(item.query);
              }}
              className="text-xs bg-slate-950 hover:bg-blue-950/40 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-blue-500/50 transition flex items-center gap-1.5 font-medium shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CHAT STREAM / RESULTS BOX */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-lg shadow-blue-950/60">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-br-none shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
                }`}
              >
                {/* Header for AI response */}
                {m.sender === 'ai' && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      {m.engine || 'Google Gemini'}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={GEMINI_WEB_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono hover:underline"
                        title="Open on Google Gemini Web"
                      >
                        <span>Open in Gemini</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleSpeakText(m.text, idx)}
                        className={`p-1 rounded-lg transition ${
                          speakingIdx === idx 
                            ? 'bg-amber-500 text-white animate-pulse' 
                            : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={speakingIdx === idx ? 'Stop Voice' : 'Listen via Voice'}
                      >
                        {speakingIdx === idx ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => copyToClipboard(m.text, idx)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Copy to clipboard"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed font-sans">
                  {m.text}
                </div>

                {/* Quick Link to Gemini if this was an AI answer */}
                {m.sender === 'ai' && m.queryUsed && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {isHi ? 'अधिक विस्तृत विश्लेषण के लिए:' : 'For deep multimodal analysis:'}
                    </span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(m.queryUsed)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>{isHi ? 'Google / Gemini पर देखें ↗' : 'View on Google / Gemini ↗'}</span>
                    </a>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-center text-xs text-blue-300 font-mono animate-fadeIn">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/30 border border-blue-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-blue-300" />
              </div>
              <span>{isHi ? 'गूगल जेमिनी AI से उत्तर प्राप्त किया जा रहा है...' : 'Querying Google Gemini AI intelligence engine...'}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 4. BOTTOM INPUT & DUAL ACTION BAR */}
        <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
          {/* Hands-free Voice Input Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-xl border transition shadow flex items-center justify-center ${
              isListening 
                ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-red-900/50' 
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={isListening ? 'Listening... Click to Stop' : 'Voice Input (Hindi / English)'}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInAppAsk();
              }
            }}
            placeholder={
              isListening
                ? (isHi ? 'सुन रहा हूँ... जो चाहें पूछें...' : 'Listening... Speak anything...')
                : (isHi ? 'यहाँ कुछ भी पूछें (कोडिंग, बुखार का इलाज, गणित, विज्ञान, सामान्य ज्ञान)...' : 'Ask anything (coding, fever treatment, math, science, current affairs)...')
            }
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />

          {/* DUAL BUTTONS: ASK ON GOOGLE GEMINI vs SEND IN-APP */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Ask on Official Gemini Web */}
            <button
              onClick={() => openGeminiDirectly(input)}
              className="flex-1 sm:flex-none px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Launch directly on Google Gemini in new window"
            >
              <span>{isHi ? 'Gemini पर पूछें' : 'Ask on Gemini'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {/* In-app submit */}
            <button
              onClick={() => handleInAppAsk()}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Ask inside this dashboard"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>{isHi ? 'इन-ऐप' : 'In-App'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
