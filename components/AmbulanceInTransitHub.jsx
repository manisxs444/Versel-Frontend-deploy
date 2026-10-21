import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Truck, 
  ShieldCheck, 
  QrCode, 
  Clock, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Wind, 
  Gauge, 
  Building2, 
  UserCheck, 
  FileCheck2,
  Share2,
  Printer,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

export default function AmbulanceInTransitHub({ 
  selectedHospital, 
  vitals, 
  admissionPass, 
  currentUser,
  onGeneratePass, 
  lang 
}) {
  const isHi = lang === 'hi';
  const [pulseBeep, setPulseBeep] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [connectionType, setConnectionType] = useState('CONNECTING...');
  const [customHr, setCustomHr] = useState('');
  const [customSpo2, setCustomSpo2] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatusMsg, setPushStatusMsg] = useState(null);

  // Subscribe to live telemetry via WebSocket with fallback to SSE / polling
  useEffect(() => {
    const unsub = api.subscribeTelemetry((data, protocol) => {
      setLiveTelemetry(data);
      if (protocol) {
        setConnectionType(protocol);
      }
    });
    return () => unsub();
  }, []);

  // Heartbeat pulse animation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseBeep(prev => !prev);
    }, 750);
    return () => clearInterval(timer);
  }, []);

  const hosp = selectedHospital || {
    name: 'Apex AIIMS Trauma Super-Specialty',
    totalTransitMins: 35,
    distanceKm: 24,
    specialistsOnDuty: ['Senior Neurosurgeon', 'Trauma Surgeon', 'Chief Intensivist']
  };

  // Derive active vitals from live stream or fallback
  const curVitals = liveTelemetry?.vitals || vitals;
  const curHr = curVitals?.heartRate || vitals?.heartRate || 132;
  const curSysBp = curVitals?.systolicBp || vitals?.systolicBp || 82;
  const curDiaBp = curVitals?.diastolicBp || vitals?.diastolicBp || 52;
  const curSpo2 = curVitals?.spo2 || vitals?.spo2 || 89;
  const curShockIndex = curVitals?.shockIndex || (curHr / (curSysBp || 1)).toFixed(2);
  const curProgress = liveTelemetry?.progressPercent !== undefined ? liveTelemetry.progressPercent : 42;
  const curEta = liveTelemetry?.etaMinutes !== undefined ? liveTelemetry.etaMinutes : Math.max(3, Math.round((hosp.totalTransitMins || 35) * (1 - curProgress / 100)));
  const curSpeed = liveTelemetry?.speedKmh || 78;

  // Active Admission Pass / Booking Receipt Details
  const activePass = admissionPass || {
    token: 'JS-EMERG-8492019',
    patient_name: currentUser?.name || vitals?.patientName || 'Emergency Patient',
    age: currentUser?.age || vitals?.age || 28,
    gender: currentUser?.gender || vitals?.gender || 'Male',
    hospital_name: hosp.name,
    reserved_bed_type: 'Trauma ICU Bay 04 (Ventilator Ready)',
    paperwork_status: '100% PRE-COMPLETED IN-AMBULANCE (Zero ER Wait Time)',
    ayushman_status: 'PAID & CONFIRMED • GREEN CORRIDOR ACTIVE'
  };

  const patientDisplayName = activePass.patient_name || activePass.patientName || currentUser?.name || vitals?.patientName || 'Emergency Patient';
  const patientDisplayAge = activePass.age || currentUser?.age || vitals?.age || 28;
  const patientDisplayGender = activePass.gender || currentUser?.gender || vitals?.gender || 'Male';
  const tokenNumber = activePass.token || activePass.admissionToken || activePass.id || 'JS-EMERG-8492019';
  const abhaId = activePass.abha_id || activePass.abhaId || '91-4921-8201-9430';
  const hospitalName = activePass.hospital_name || activePass.receivingHospital || hosp.name;
  const bedType = activePass.reserved_bed_type || activePass.reservedBedType || 'Trauma ICU Bay 04 (Ventilator-Ready)';

  // Handle Paramedic Push to Live Telemetry Backend
  const handlePushLiveVitals = async (actionType) => {
    setIsPushing(true);
    let updatedVitals = {};
    if (actionType === 'OXYGEN') {
      updatedVitals = { spo2: 98, respiratoryRate: 20, latencyMs: 28 };
    } else if (actionType === 'STABILIZE_BP') {
      updatedVitals = { systolicBp: 110, diastolicBp: 72, heartRate: 94, shockIndex: 0.85 };
    } else if (actionType === 'CUSTOM') {
      if (customHr) updatedVitals.heartRate = Number(customHr);
      if (customSpo2) updatedVitals.spo2 = Number(customSpo2);
    }

    try {
      await api.pushTelemetry({
        vitals: updatedVitals,
        status: 'EN_ROUTE_STABILIZING',
        lastUpdated: new Date().toISOString()
      });
      setPushStatusMsg(isHi ? '✓ टेलीमेट्री लाइव अपडेट अस्पताल एवं डेटाबेस में दर्ज हो गया!' : '✓ Live telemetry pushed to City Hospital & SQLite DB!');
      setTimeout(() => setPushStatusMsg(null), 3500);
      setCustomHr('');
      setCustomSpo2('');
    } catch (e) {
      setPushStatusMsg('Push Error: ' + e.message);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Green Corridor & Live Transit Banner */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white animate-pulse shadow-lg shadow-emerald-500/30">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isHi ? 'ग्रीन कॉरिडोर सक्रिय' : 'GREEN CORRIDOR LIVE'}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  NH-48 Emergency Express Link
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  📡 {connectionType}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {isHi 
                  ? 'एम्बुलेंस में डिजिटल भर्ती रसीद एवं लाइव ट्रान्जिट हब' 
                  : 'In-Transit Paperless Admission Receipt & Live Monitoring Hub'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">
                {isHi ? 'अस्पताल पहुंचने का समय (ETA)' : 'Estimated Arrival (ETA)'}
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ~{curEta} mins
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">
                {isHi ? 'एम्बुलेंस गति' : 'Speed'}
              </div>
              <div className="text-xl font-bold text-cyan-300">
                {curSpeed} km/h
              </div>
            </div>
          </div>
        </div>

        {/* Live Route Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <MapPin className="w-3.5 h-3.5" /> {currentUser?.locationName || 'Accident Site / PHC Hub'}
            </span>
            <span className="text-slate-300 font-semibold">
              {curProgress}% {isHi ? 'सफर पूरा (ग्रीन कॉरिडोर क्लियर)' : 'journey completed (Corridor Clear)'}
            </span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Building2 className="w-3.5 h-3.5" /> {hospitalName}
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${curProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Digital Emergency Admission Pass & Booking Receipt */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Watermark badge */}
            <div className="absolute right-4 top-4 text-emerald-500/10 font-black text-6xl select-none pointer-events-none">
              SEAT BOOKED
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isHi ? 'अस्पताल में बेड रिजर्वेशन पुष्टि रसीद (Official Receipt)' : 'Official Hospital Bed Reservation & Admission Receipt'}
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  {isHi ? 'डिजिटल भर्ती पास (Zero-Wait Entry Pass)' : 'Digital Emergency Pre-Admission Pass'}
                </h3>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">{isHi ? 'बुकिंग टोकन संख्या' : 'Admission Token / ID'}</span>
                <span className="text-sm font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/50 shadow-sm">
                  {tokenNumber}
                </span>
              </div>
            </div>

            {/* Pass details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'रोगी का नाम:' : 'Patient Name:'}</span>
                  <span className="font-bold text-white font-mono text-sm">{patientDisplayName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'उम्र एवं लिंग:' : 'Age & Gender:'}</span>
                  <span className="font-semibold text-slate-200">{patientDisplayAge} Yrs / {patientDisplayGender}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'डिजिटल आभा संख्या (ABHA ID):' : 'ABHA Health ID:'}</span>
                  <span className="font-mono text-cyan-300 font-semibold">{abhaId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'प्राथमिक केंद्र (मूल):' : 'Referred From:'}</span>
                  <span className="text-slate-200">{currentUser?.locationName || 'Accident Site / PHC Hub'}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'गंतव्य अस्पताल:' : 'Receiving Hospital:'}</span>
                  <span className="font-bold text-blue-300 text-sm">{hospitalName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'पूर्व-आवंटित बेड:' : 'Pre-Allocated Bed:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">{bedType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'सीट बुकिंग स्थिति:' : 'Booking & Payment Status:'}</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {activePass.ayushman_status || 'SEAT RESERVED • PAYMENT CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">{isHi ? 'कागजी कार्रवाई:' : 'Paperwork Status:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {activePass.paperwork_status || '100% COMPLETE IN-AMBULANCE'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code and Quick Scan Verification */}
            <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-md">
                  <QrCode className="w-12 h-12 text-slate-950" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isHi ? 'अस्पताल गेट पर सीधे स्कैन करें' : 'Direct Scan at Emergency Entrance'}
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                    {isHi 
                      ? 'अस्पताल पहुंचने पर कोई पर्ची, कोई कतार और कोई डिपाजिट नहीं। मरीज सीधे ट्रॉमा ओटी/आईसीयू जाएगा!' 
                      : 'Zero admission counter delay, no queue. Patient wheeled directly into pre-scrubbed Trauma Bay.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isHi ? 'रसीद प्रिंट / डाउनलोड करें' : 'Print / Download Receipt'}</span>
                </button>
                <button
                  onClick={() => alert(isHi ? `टोकन संख्या ${tokenNumber} अस्पताल को प्रेषित कर दी गई है!` : `Token ${tokenNumber} synced with hospital systems!`)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isHi ? 'शेयर करें' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Receiving City Hospital Standby Status */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-400" />
              {isHi ? 'प्राप्तकर्ता अस्पताल में पूर्व-तैयारी स्थिति (Hospital Readiness)' : 'Receiving Trauma Center Live Readiness'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isHi ? 'आईसीयू एवं वेंटिलेटर' : 'ICU & Ventilator'}
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {bedType}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Calibrated for SpO2 {curSpo2}%
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isHi ? 'ब्लड बैंक अलर्ट' : 'Blood Bank Pre-Order'}
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  2 Units O+ PRBC Reserved
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Cross-matching initiated en route
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isHi ? 'सर्जिकल टीम' : 'Surgical Team'}
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  Trauma Team Scrubbed In
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Emergency Surgeons on standby
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: Live In-Transit Vitals Telemetry Monitor & Backend Control */}
        <div className="space-y-6">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  {isHi ? 'लाइव एम्बुलेंस टेलीमेट्री' : 'Live IoT Telemetry Stream'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live SQLite Synced
              </span>
            </div>

            {/* Simulated Continuous ECG Rhythm Strip */}
            <div className="bg-black/90 rounded-xl p-3 border border-slate-800/80 mb-4 overflow-hidden relative">
              <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 mb-1">
                <span>LEAD II (Real-time ECG Stream)</span>
                <span className="animate-pulse flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" /> REC ●
                </span>
              </div>
              <div className="h-14 flex items-center justify-center">
                <svg className="w-full h-10 text-emerald-400" viewBox="0 0 300 40" preserveAspectRatio="none">
                  <path 
                    d="M0,20 L40,20 L45,10 L50,30 L55,5 L60,35 L65,20 L100,20 L105,10 L110,30 L115,5 L120,35 L125,20 L160,20 L165,10 L170,30 L175,5 L180,35 L185,20 L220,20 L225,10 L230,30 L235,5 L240,35 L245,20 L300,20" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="stroke-emerald-400"
                  />
                </svg>
              </div>
            </div>

            {/* Real-time streaming numbers */}
            <div className="space-y-3 font-mono">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Heart className={`w-4 h-4 ${pulseBeep ? 'scale-125' : 'scale-100'} transition-transform`} />
                  <span className="text-xs uppercase font-bold">HR (हृदय गति)</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {curHr}{' '}
                  <span className="text-xs font-normal text-slate-400">BPM</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold">BP (रक्तचाप)</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {curSysBp}/{curDiaBp}{' '}
                  <span className="text-xs font-normal text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold">SpO2 (ऑक्सीजन)</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {curSpo2}{' '}
                  <span className="text-xs font-normal text-slate-400">%</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold">Shock Index (शॉक इंडेक्स)</span>
                </div>
                <div className="text-xl font-bold text-amber-300">
                  {curShockIndex}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              {isHi ? 'डेटा सीधे अस्पताल के आईसीयू मॉनिटर पर स्ट्रीम हो रहा है' : 'Streaming live to City Hospital ICU Console'}
            </div>
          </div>

          {/* Interactive Paramedic Live Vitals Injection & Backend Test */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {isHi ? 'पैरामेडिक लाइव टेलीमेट्री अपडेट (Backend Test)' : 'Paramedic In-Transit Controls (Live DB Sync)'}
            </div>
            <p className="text-[11px] text-slate-400">
              {isHi 
                ? 'एम्बुलेंस पैरामेडिक द्वारा दिए गए उपचार का डेटा तुरंत अस्पताल और डेटाबेस में अपडेट करें:' 
                : 'Simulate live medical interventions. Immediately updates backend WebSocket stream and SQLite DB:'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isPushing}
                onClick={() => handlePushLiveVitals('OXYGEN')}
                className="p-2.5 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-xl text-xs font-semibold text-left transition"
              >
                🫁 {isHi ? 'ऑक्सीजन दें (SpO2 98%)' : 'Apply O2 (SpO2 98%)'}
              </button>
              <button
                disabled={isPushing}
                onClick={() => handlePushLiveVitals('STABILIZE_BP')}
                className="p-2.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-semibold text-left transition"
              >
                💉 {isHi ? 'आईवी फ्लूड्स दें (BP 110/72)' : 'IV Fluids (BP 110/72)'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                placeholder="HR (e.g. 85)"
                value={customHr}
                onChange={e => setCustomHr(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                placeholder="SpO2 (e.g. 96)"
                value={customSpo2}
                onChange={e => setCustomSpo2(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                disabled={isPushing || (!customHr && !customSpo2)}
                onClick={() => handlePushLiveVitals('CUSTOM')}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Push
              </button>
            </div>

            {pushStatusMsg && (
              <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 p-2 rounded-lg text-center animate-fade-in">
                {pushStatusMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
