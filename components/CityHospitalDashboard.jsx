import React, { useState, useEffect } from 'react';
import { Building2, Radio, Activity, AlertTriangle, CheckSquare, Clock, ShieldCheck, Heart, User, MapPin, Zap, Navigation, Wifi } from 'lucide-react';
import { api } from '../services/api';

export default function CityHospitalDashboard({ vitals: initialVitals, triageResult: initialTriage }) {
  const [telemetry, setTelemetry] = useState(null);
  const [connectionType, setConnectionType] = useState('CONNECTING...');
  const [isLiveActive, setIsLiveActive] = useState(true);

  const [checklist, setChecklist] = useState({
    bay: true,
    blood: true,
    surgeon: false,
    ct: false,
    admissionToken: true
  });

  // Connect to Real-Time Telemetry Stream on Mount
  useEffect(() => {
    const unsubscribe = api.subscribeTelemetry((data, transport) => {
      setTelemetry(data);
      setConnectionType(transport);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Simulation triggers for testing the backend broadcast live
  const handleSimulateEvent = async (type) => {
    if (type === 'tachycardia') {
      await api.pushTelemetry({
        vitals: { heartRate: 146, systolicBp: 78, diastolicBp: 48, spo2: 87 }
      });
    } else if (type === 'stabilize') {
      await api.pushTelemetry({
        vitals: { heartRate: 98, systolicBp: 112, diastolicBp: 72, spo2: 96 }
      });
    } else if (type === 'traffic') {
      await api.pushTelemetry({
        speedKmh: 35,
        etaMinutes: (telemetry?.etaMinutes || 18) + 12
      });
    }
  };

  const currentVitals = telemetry?.vitals || initialVitals;
  const currentEta = telemetry?.etaMinutes !== undefined ? telemetry.etaMinutes : 18;
  const currentSpeed = telemetry?.speedKmh || 76;
  const currentProgress = telemetry?.progressPercent || 38;
  const currentAddress = telemetry?.location?.address || 'NH-48 Golden Green Corridor, Mile Marker 42';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs font-mono font-bold">DESTINATION ER RADAR</span>
            <h2 className="text-2xl font-black text-white">Apex AIIMS Trauma Centre - Receiving Bay</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Monitoring Inbound Ambulances, Live Biometric Feeds &amp; Zero-Wait Resuscitation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {connectionType}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Trauma Bays Available</div>
            <div className="text-sm font-bold text-emerald-400">3 of 5 Ready</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Live Inbound Ambulance Tracker (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h3 className="font-bold text-white text-base">
                Inbound: {currentVitals?.patientName || 'Vikas Meena'} ({currentVitals?.age || 28} / {currentVitals?.gender || 'M'})
              </h3>
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 font-mono font-bold text-xs rounded-full border border-red-500/30 animate-pulse">
              ETA: {currentEta} MINS (BAY #03)
            </span>
          </div>

          {/* Telemetry Stream */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live In-Ambulance Telemetry Stream (Backend WS Sync)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> Signal: 98% &bull; Latency: {currentVitals?.latencyMs || 38}ms
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 transition-colors">
                <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                <span className="text-xl font-black text-red-400">{currentVitals?.heartRate || 132} <span className="text-[10px] font-normal text-slate-500">BPM</span></span>
              </div>
              <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <span className="text-xl font-black text-red-400">{currentVitals?.systolicBp || 82}/{currentVitals?.diastolicBp || 52}</span>
              </div>
              <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SpO2 Oxygen</span>
                <span className="text-xl font-black text-amber-400">{currentVitals?.spo2 || 89}%</span>
              </div>
              <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Shock Index</span>
                <span className="text-xl font-black text-red-400">
                  {currentVitals?.shockIndex || (currentVitals?.heartRate / (currentVitals?.systolicBp || 1)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Simulated Animated ECG */}
            <div className="h-10 bg-slate-900/50 rounded-lg overflow-hidden flex items-center px-2">
              <svg className="w-full h-8 stroke-emerald-400 fill-none" viewBox="0 0 500 50">
                <path strokeWidth="2" d="M 0 25 L 50 25 L 60 10 L 70 40 L 80 25 L 120 25 L 130 5 L 140 45 L 150 25 L 200 25 L 210 12 L 220 38 L 230 25 L 300 25 L 310 5 L 320 45 L 330 25 L 400 25 L 410 10 L 420 40 L 430 25 L 500 25" />
              </svg>
            </div>
          </div>

          {/* Live Ambulance Location & Progress */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Navigation className="w-3.5 h-3.5 text-sky-400" /> Live GPS Transit Corridor
              </span>
              <span className="text-sky-400 font-mono font-bold">
                Speed: {currentSpeed} km/h &bull; {currentProgress}% En-Route
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              📍 <strong>Current Position:</strong> {currentAddress}
            </div>
          </div>

          {/* Interactive Backend WebSocket Test Controller */}
          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Test Real-time Backend Broadcast:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateEvent('tachycardia')}
                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-lg text-[11px] font-semibold transition"
              >
                ⚡ Trigger Tachycardia (HR 146)
              </button>
              <button
                onClick={() => handleSimulateEvent('stabilize')}
                className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-semibold transition"
              >
                💚 Push Normal Vitals (BP 112/72)
              </button>
              <button
                onClick={() => handleSimulateEvent('traffic')}
                className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-semibold transition"
              >
                🚗 Jam Delay (+12m)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Hospital Readiness Checklist (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-red-400" /> Pre-Arrival Setup Protocol
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Zero-Wait Protocol</span>
          </div>

          <p className="text-xs text-slate-300">
            Trauma team checklist to prepare before patient arrival:
          </p>

          <div className="space-y-3 pt-1">
            <div onClick={() => toggleCheck('bay')} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input type="checkbox" checked={checklist.bay} onChange={() => {}} className="mt-1 w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700" />
              <div>
                <span className="text-xs font-bold text-white block">Trauma Bay #03 Warmed &amp; Calibrated</span>
                <span className="text-[11px] text-slate-400">Ventilator and rapid infuser primed.</span>
              </div>
            </div>

            <div onClick={() => toggleCheck('blood')} className="flex items-start gap-3 p-3 rounded-xl bg-red-950/30 border border-red-500/40 hover:border-red-500 cursor-pointer">
              <input type="checkbox" checked={checklist.blood} onChange={() => {}} className="mt-1 w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-700" />
              <div>
                <span className="text-xs font-bold text-red-300 block">Prepare 2 Units O-Negative Blood</span>
                <span className="text-[11px] text-red-200">Pre-matched and ready in Trauma Bay refrigerator.</span>
              </div>
            </div>

            <div onClick={() => toggleCheck('surgeon')} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input type="checkbox" checked={checklist.surgeon} onChange={() => {}} className="mt-1 w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700" />
              <div>
                <span className="text-xs font-bold text-white block">On-Call Trauma Surgeon Scrubbed In</span>
                <span className="text-[11px] text-slate-400">Dr. Rajesh Varma paged via emergency buzzer.</span>
              </div>
            </div>

            <div onClick={() => toggleCheck('admissionToken')} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <input type="checkbox" checked={checklist.admissionToken} onChange={() => {}} className="mt-1 w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700" />
              <div>
                <span className="text-xs font-bold text-white block">Paperless En-Route Admission Linked</span>
                <span className="text-[11px] text-emerald-400 font-semibold">ABHA ID verified, PM-JAY auto-authorized.</span>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-4 h-4" /> Destination Trauma Team Scrubbed &amp; Ready
          </button>
        </div>
      </div>
    </div>
  );
}
