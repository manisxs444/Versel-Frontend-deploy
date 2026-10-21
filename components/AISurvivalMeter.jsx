import React from 'react';
import { 
  AlertOctagon, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  HeartCrack, 
  ArrowRight, 
  Video, 
  Truck, 
  FileText,
  Activity
} from 'lucide-react';

export default function AISurvivalMeter({ 
  result, 
  onNavigateToTab, 
  lang 
}) {
  if (!result) return null;

  const isHi = lang === 'hi';
  const { 
    survivalMinutes, 
    shockIndex, 
    hemorrhageClass, 
    triageCategory, 
    transferFeasibility, 
    primaryRecommendation, 
    stabilizationChecklist,
    vitalsSummary
  } = result;

  const isCritical = triageCategory === 'RED_EXTREME_CRITICAL';
  const isUrgent = triageCategory === 'AMBER_URGENT';
  const isStable = triageCategory === 'GREEN_STABLE';

  return (
    <div className={`rounded-2xl border p-6 transition-all shadow-2xl ${
      isCritical 
        ? 'bg-gradient-to-b from-red-950/70 via-slate-900 to-slate-950 border-red-500/80 glow-emergency' 
        : isUrgent 
          ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/80' 
          : 'bg-gradient-to-b from-emerald-950/50 via-slate-900 to-slate-950 border-emerald-500/80 glow-safe'
    }`}>
      {/* Top Banner Alert */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            isCritical ? 'bg-red-600 text-white animate-bounce' : isUrgent ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {isCritical ? <AlertOctagon className="w-8 h-8" /> : isUrgent ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                isCritical 
                  ? 'bg-red-500/20 text-red-300 border-red-500' 
                  : isUrgent 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
              }`}>
                {isCritical 
                  ? (isHi ? 'अति-गंभीर (जीवन रक्षा संकट)' : 'RED: EXTREME CRITICAL') 
                  : isUrgent 
                    ? (isHi ? 'सशर्त आपातकाल (URGENT)' : 'AMBER: CONDITIONAL TRANSIT') 
                    : (isHi ? 'स्थिर / सुरक्षित (STABLE)' : 'GREEN: STABLE TRANSFER')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Shock Index: {shockIndex} | {hemorrhageClass}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              {isCritical 
                ? (isHi ? '⚠️ हाईवे ट्रांजिट में मृत्यु का उच्च जोखिम!' : '⚠️ Fatal Transit Risk Detected!') 
                : isUrgent 
                  ? (isHi ? 'सशर्त रेफरल: ग्रीन कॉरिडोर एवं इन-ट्रांजिट भर्ती आवश्यक' : 'Conditional Referral: Green Corridor Required') 
                  : (isHi ? 'सुरक्षित रेफरल अथवा स्थानीय पीएचसी उपचार' : 'Safe for Referral or Local PHC Treatment')}
            </h2>
          </div>
        </div>

        {/* Big Survival Time Countdown Gauge */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-inner">
          <Clock className={`w-8 h-8 ${isCritical ? 'text-red-400 animate-spin' : 'text-emerald-400'}`} />
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              {isHi ? 'अनुमानित जीवन रक्षा समय (Golden Window)' : 'AI Critical Survival Window'}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                ~{survivalMinutes}
              </span>
              <span className="text-sm font-bold text-slate-300">
                {isHi ? 'मिनट शेष' : 'mins remaining'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Recommendation Statement */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs uppercase font-mono font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            {isHi ? 'एआई क्लिनिकल निर्णय एवं रणनीति (AI Decision Tree)' : 'AI Clinical Decision & Transit Strategy'}
          </h3>
          <p className="text-sm leading-relaxed text-slate-200 font-medium">
            {primaryRecommendation}
          </p>

          {isCritical && (
            <div className="mt-4 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3">
              <HeartCrack className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-200 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">
                  {isHi ? 'ट्रैफिक जाम एवं दूरी का विश्लेषण:' : 'Traffic Jam & Referral Vulnerability:'}
                </span>
                {isHi 
                  ? `निकटतम बड़े शहर के अस्पताल तक पहुंचने में कम से कम 60 मिनट लगेंगे, जबकि मरीज के पास केवल ~${survivalMinutes} मिनट का सर्वाइवल विंडो है। बिना स्टेबिलाइज किए गाड़ी में बैठाना जानलेवा साबित होगा! तुरंत ई-डॉक्टर को 20% लागत पर जोड़कर गांव में ही प्राथमिक जीवन रक्षक प्रक्रिया शुरू करें।`
                  : `City tertiary trauma centers are ~60 mins away through normal highway traffic, whereas the patient's shock decompensation threshold is only ~${survivalMinutes} mins. Blind referral guarantees death en route! Activate Village E-Doctor Tele-ICU immediately to stabilize blood pressure before transit.`}
              </div>
            </div>
          )}
        </div>

        {/* Immediate Physiological Metrics */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400 uppercase font-semibold mb-3">
            {isHi ? 'शारीरिक पैरामीटर विश्लेषण' : 'Physiological Breakdown'}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Mean Arterial Pressure (MAP):</span>
              <span className={`font-mono font-bold ${result.map < 65 ? 'text-red-400' : 'text-slate-200'}`}>
                {result.map} mmHg {result.map < 65 && '(Shock)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Shock Index (HR/SBP):</span>
              <span className={`font-mono font-bold ${shockIndex > 1.0 ? 'text-red-400' : 'text-slate-200'}`}>
                {shockIndex} {shockIndex > 1.2 ? '(Extreme)' : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Hemorrhage Level:</span>
              <span className="font-mono font-bold text-red-300">{hemorrhageClass}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Airway / GCS State:</span>
              <span className={`font-mono font-bold ${vitalsSummary.gcs <= 8 ? 'text-red-400' : 'text-slate-200'}`}>
                {vitalsSummary.gcs}/15 {vitalsSummary.gcs <= 8 ? '(High Risk)' : '(Intact)'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            {isHi ? '✅ वास्तविक समय आईओटी टेलीमेट्री सक्रिय' : '✅ Live Biometric Telemetry Active'}
          </div>
        </div>
      </div>

      {/* Immediate Step-by-Step Stabilization Checklist */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-6">
        <h3 className="text-xs uppercase font-mono font-bold text-emerald-400 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {isHi ? 'गांव के डॉक्टर के लिए तत्काल प्राथमिक जीवन-रक्षक चेकलिस्ट (Golden Hour Protocol)' : 'Immediate Village PHC Life-Saving Stabilization Checklist'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stabilizationChecklist.map((item) => (
            <div key={item.step} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/40">
                  {item.step}
                </span>
                <span className="text-xs font-bold text-white">{item.action}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons to Drive Solution */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-400 font-medium">
          {isHi 
            ? 'अगला कदम चुनें: अस्पताल में बेड रिजर्व करें अथवा ई-डॉक्टर से जुड़ें' 
            : 'Next Steps: Find Guaranteed ICU Beds or Connect to Remote E-Doctor'}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isCritical ? (
            <>
              <button
                onClick={() => onNavigateToTab('tele')}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950 transition hover:scale-[1.02]"
              >
                <Video className="w-4 h-4" />
                <span>{isHi ? 'ई-डॉक्टर से लाइव जुड़ें (20% लागत)' : 'Connect E-Doctor Now (20% Cost Plan)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateToTab('hospitals')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
              >
                <Truck className="w-4 h-4 text-blue-400" />
                <span>{isHi ? 'अस्पताल एवं बेड देखें' : 'View City Hospitals'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigateToTab('hospitals')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-950 transition hover:scale-[1.02]"
              >
                <Truck className="w-4 h-4" />
                <span>{isHi ? 'अस्पताल खोजें एवं बेड बुक करें' : 'Find Best Hospital & Reserve Bed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateToTab('transit')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'एम्बुलेंस में डिजिटल भर्ती' : 'In-Transit Paperless Admission'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
