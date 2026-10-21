import React from 'react';
import { Heart, Gauge, Droplet, Brain, Thermometer, Wind, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function VitalsTriageForm({ 
  vitals, 
  setVitals, 
  onCalculate, 
  triageResult, 
  lang 
}) {
  const isHi = lang === 'hi';

  const presets = [
    {
      id: 'highway-polytrauma',
      name: isHi ? 'हाईवे एक्सीडेंट (गंभीर रक्तस्राव)' : 'Severe Highway Polytrauma',
      desc: isHi ? 'भारी खून बहना, बीपी 80 से नीचे, बेहोशी' : 'Massive hemorrhage, BP < 90, GCS 10',
      badge: isHi ? 'अति-गंभीर (Critical)' : 'Extreme Critical',
      color: 'border-red-500/60 bg-red-950/30 text-red-300',
      values: {
        patientName: 'Vikas Meena',
        age: 28,
        gender: 'Male',
        emergencyType: 'Severe Road Accident / Polytrauma',
        heartRate: 132,
        systolicBp: 82,
        diastolicBp: 52,
        spo2: 89,
        respiratoryRate: 28,
        bloodLossMl: 1400,
        gcsScore: 10,
        tempC: 36.2
      }
    },
    {
      id: 'neuro-snakebite',
      name: isHi ? 'विषैला सांप काटना (न्यूरोटॉक्सिक)' : 'Neurotoxic Snake Envenomation',
      desc: isHi ? 'पलकें गिरना (Ptosis), सांस लेने में रुकावट' : 'Drooping eyelids, acute hypoxia, SpO2 drop',
      badge: isHi ? 'आपातकालीन ASV' : 'Urgent ASV',
      color: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
      values: {
        patientName: 'Geeta Devi',
        age: 34,
        gender: 'Female',
        emergencyType: 'Snakebite (Common Krait)',
        heartRate: 112,
        systolicBp: 104,
        diastolicBp: 68,
        spo2: 88,
        respiratoryRate: 26,
        bloodLossMl: 50,
        gcsScore: 12,
        tempC: 37.1
      }
    },
    {
      id: 'severe-pph',
      name: isHi ? 'प्रसव के बाद गंभीर रक्तस्राव (PPH)' : 'Severe Postpartum Hemorrhage',
      desc: isHi ? 'डिलीवरी के बाद 1 लीटर से अधिक खून बहना' : 'Atonic PPH, acute vascular shock',
      badge: isHi ? 'तत्काल रक्त / TXA' : 'Immediate Blood / TXA',
      color: 'border-rose-500/60 bg-rose-950/30 text-rose-300',
      values: {
        patientName: 'Sunita Sharma',
        age: 24,
        gender: 'Female',
        emergencyType: 'Postpartum Hemorrhage (PPH)',
        heartRate: 126,
        systolicBp: 78,
        diastolicBp: 46,
        spo2: 94,
        respiratoryRate: 24,
        bloodLossMl: 1250,
        gcsScore: 13,
        tempC: 36.5
      }
    },
    {
      id: 'stable-minor',
      name: isHi ? 'सामान्य चोट / स्थिर मरीज' : 'Stable Fall / Minor Fracture',
      desc: isHi ? 'गांव के पीएचसी में इलाज संभव' : 'Manageable at Village PHC safely',
      badge: isHi ? 'स्थिर (PHC Treatable)' : 'Stable at PHC',
      color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
      values: {
        patientName: 'Ramesh Yadav',
        age: 45,
        gender: 'Male',
        emergencyType: 'Distal Forearm Fracture (Closed)',
        heartRate: 76,
        systolicBp: 122,
        diastolicBp: 80,
        spo2: 99,
        respiratoryRate: 16,
        bloodLossMl: 80,
        gcsScore: 15,
        tempC: 37.0
      }
    }
  ];

  const handleChange = (field, val) => {
    setVitals(prev => ({ ...prev, [field]: val }));
  };

  const applyPreset = (presetValues) => {
    setVitals(presetValues);
    onCalculate(presetValues);
  };

  // Instant Shock Index for preview
  const previewSI = vitals.systolicBp > 0 
    ? (vitals.heartRate / vitals.systolicBp).toFixed(2) 
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Quick Scenario Preset Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {isHi ? 'त्वरित आपातकालीन परिदृश्य (1-क्लिक टेस्ट)' : 'Quick Emergency Scenarios (1-Click Presets)'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {isHi ? 'परीक्षण के लिए क्लिक करें' : 'Click to simulate clinical cases'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.values)}
              className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] flex flex-col justify-between ${p.color}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs line-clamp-1">{p.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 font-semibold">
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono opacity-70">
                HR: {p.values.heartRate} | BP: {p.values.systolicBp}/{p.values.diastolicBp} | Loss: {p.values.bloodLossMl}ml
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Information & Vitals Inputs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              {isHi ? 'रोगी की जानकारी एवं महत्वपूर्ण लक्षण (Vitals Capture)' : 'Patient Intake & Biometric Vitals Capture'}
            </h2>
            <p className="text-xs text-slate-400">
              {isHi ? 'गाँव के प्राथमिक स्वास्थ्य केंद्र (PHC) में दर्ज करें' : 'Captured by PHC Doctor / Community Health Worker'}
            </p>
          </div>

          {/* Real-time Shock Index Pill */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
            previewSI > 1.2 
              ? 'bg-red-500/20 text-red-300 border-red-500/50 glow-emergency' 
              : previewSI > 0.9 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
          }`}>
            <span>Shock Index (HR/SBP): {previewSI}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-black/40">
              {previewSI > 1.2 ? (isHi ? 'गंभीर शॉक' : 'Severe Shock') : previewSI > 0.9 ? (isHi ? 'मध्यम शॉक' : 'Mild Shock') : (isHi ? 'सामान्य' : 'Normal')}
            </span>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {isHi ? 'मरीज का नाम' : 'Patient Name'}
            </label>
            <input
              type="text"
              value={vitals.patientName || ''}
              onChange={(e) => handleChange('patientName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {isHi ? 'उम्र एवं लिंग' : 'Age & Gender'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={vitals.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Age"
              />
              <select
                value={vitals.gender || 'Male'}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">{isHi ? 'Male (पुरुष)' : 'Male'}</option>
                <option value="Female">{isHi ? 'Female (महिला)' : 'Female'}</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {isHi ? 'दुर्घटना / इमरजेंसी का प्रकार' : 'Emergency / Trauma Type'}
            </label>
            <input
              type="text"
              value={vitals.emergencyType || ''}
              onChange={(e) => handleChange('emergencyType', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder={isHi ? 'उदा. रोड एक्सीडेंट, सर्पदंश' : 'e.g. Highway Accident, Snakebite'}
            />
          </div>
        </div>

        {/* 6 Biometric Vitals Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Heart Rate */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-400">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'हृदय गति (Heart Rate)' : 'Heart Rate'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {vitals.heartRate} BPM
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={vitals.heartRate}
              onChange={(e) => handleChange('heartRate', parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>40 Brady</span>
              <span>80 Normal</span>
              <span>180 Tachy</span>
            </div>
          </div>

          {/* 2. Blood Pressure (Systolic / Diastolic) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Gauge className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'रक्तचाप (Blood Pressure)' : 'Blood Pressure'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {vitals.systolicBp}/{vitals.diastolicBp} mmHg
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">{isHi ? 'Systolic (ऊपरी)' : 'Systolic (SBP)'}</span>
                <input
                  type="number"
                  min="40"
                  max="220"
                  value={vitals.systolicBp}
                  onChange={(e) => handleChange('systolicBp', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">{isHi ? 'Diastolic (निचला)' : 'Diastolic (DBP)'}</span>
                <input
                  type="number"
                  min="20"
                  max="140"
                  value={vitals.diastolicBp}
                  onChange={(e) => handleChange('diastolicBp', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Blood Loss in ML */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-red-400">
                <Droplet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'रक्त की हानि (Blood Loss)' : 'Est. Blood Loss'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                {vitals.bloodLossMl} ml
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={vitals.bloodLossMl}
              onChange={(e) => handleChange('bloodLossMl', parseInt(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0 ml</span>
              <span>750 (Class II)</span>
              <span>1500+ (Class IV)</span>
            </div>
          </div>

          {/* 4. SpO2 Oxygen Saturation */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Wind className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'ऑक्सीजन (SpO2 %)' : 'Oxygen (SpO2)'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {vitals.spo2} %
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              value={vitals.spo2}
              onChange={(e) => handleChange('spo2', parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>60% Critical</span>
              <span>90% Hypoxia</span>
              <span>100% Optimal</span>
            </div>
          </div>

          {/* 5. GCS Consciousness Scale */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-400">
                <Brain className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'चेतना स्तर (GCS Score)' : 'Consciousness (GCS)'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {vitals.gcsScore} / 15
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              value={vitals.gcsScore}
              onChange={(e) => handleChange('gcsScore', parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>3 (Coma)</span>
              <span>8 (Intubate)</span>
              <span>15 (Alert)</span>
            </div>
          </div>

          {/* 6. Body Temperature */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{isHi ? 'शरीर का तापमान' : 'Temperature'}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {vitals.tempC} °C
              </span>
            </div>
            <input
              type="range"
              min="34.0"
              max="41.0"
              step="0.1"
              value={vitals.tempC}
              onChange={(e) => handleChange('tempC', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>34° Hypothermia</span>
              <span>37° Normal</span>
              <span>40° Pyrexia</span>
            </div>
          </div>
        </div>

        {/* Calculate Survival Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => onCalculate(vitals)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-950 transition hover:scale-[1.01]"
          >
            <Zap className="w-5 h-5 text-yellow-300" />
            <span>
              {isHi ? 'एआई जीवन रक्षा समय (Survival Window) की गणना करें' : 'Calculate AI Golden Hour & Survival Window'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
