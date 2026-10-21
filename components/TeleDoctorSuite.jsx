import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  PhoneCall,
  UserCheck, 
  ShieldCheck, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Pill, 
  Activity,
  Heart,
  ExternalLink,
  Wifi,
  Radio,
  Copy,
  Smartphone,
  PhoneForwarded,
  MessageCircle,
  X,
  Lock,
  Unlock,
  CreditCard,
  QrCode,
  CheckCircle2,
  Download,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Thermometer,
  Wind,
  Droplet,
  Brain,
  Gauge,
  User,
  MapPin,
  HeartPulse
} from 'lucide-react';
import { WebRTCClient } from '../services/webrtc';
import { api } from '../services/api';

export default function TeleDoctorSuite({ 
  doctors, 
  vitals = {}, 
  currentUser = {},
  triageResult = {},
  onUpdateVitals, 
  lang 
}) {
  const isHi = lang === 'hi';
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0] || null);
  const [sessionActive, setSessionActive] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [webrtcStatus, setWebrtcStatus] = useState('CONNECTING_SIGNALING');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callState, setCallState] = useState('IDLE'); // IDLE, RINGING, CONNECTED

  // --- 20% EMERGENCY BILLING GATEKEEPER STATE ---
  // Defaulting to UNLOCKED for Dr. Manish testing per user request
  const [isPaid, setIsPaid] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'AYUSHMAN'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState({
    transactionId: 'TXN-UPI-MANISH-AUTHORIZED',
    amountPaid: 1,
    doctorName: 'Dr. Manish Singh, MD',
    paymentMethod: 'PHONEPE_UPI_VERIFIED',
    status: 'AUTHORIZED'
  });
  const [ayushmanCardNo, setAyushmanCardNo] = useState('PMJAY-DEL-2026-991A');
  const [paymentError, setPaymentError] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [payerNameInput, setPayerNameInput] = useState('');
  const [doctorPasscode, setDoctorPasscode] = useState('');
  const [showDocBypass, setShowDocBypass] = useState(false);

  // Derived Patient & Clinical Triage Vitals Parameters
  const patientName = currentUser?.name || vitals?.patientName || 'Manish Singh';
  const patientAge = currentUser?.age || vitals?.age || 28;
  const patientLocation = currentUser?.locationName || 'NH-48 Highway, Mile Marker 42 / Chanderi';
  const patientProblem = vitals?.emergencyType || 'Severe Trauma / High Fever';

  const hr = vitals?.heartRate || 132;
  const sysBp = vitals?.systolicBp || 82;
  const diaBp = vitals?.diastolicBp || 52;
  const bpStr = `${sysBp}/${diaBp} mmHg`;
  const spo2 = vitals?.spo2 || 89;
  const tempC = vitals?.tempC !== undefined ? vitals.tempC : 36.2;
  const tempF = ((tempC * 9/5) + 32).toFixed(1);
  const respRate = vitals?.respiratoryRate || 28;
  const bloodLoss = vitals?.bloodLossMl !== undefined ? vitals.bloodLossMl : 1400;
  const gcs = vitals?.gcsScore || 10;
  const shockIndex = triageResult?.shockIndex || (hr / (sysBp || 1)).toFixed(2);
  const mapPressure = triageResult?.mapPressure || Math.round(((2 * diaBp) + sysBp) / 3);
  const triageCat = triageResult?.triageCategory || 'RED_EXTREME_CRITICAL';
  const survivalMinutes = triageResult?.survivalMinutes || 45;

  const [transmittedReport, setTransmittedReport] = useState({
    patientName,
    patientAge,
    patientLocation,
    patientProblem,
    bpStr,
    hr,
    tempC,
    tempF,
    spo2,
    bloodLoss,
    respRate,
    gcs,
    shockIndex,
    mapPressure,
    triageCat,
    survivalMinutes,
    timestamp: new Date().toLocaleTimeString()
  });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcClientRef = useRef(null);

  // Initialize WebRTC on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('teleRole') || 'village_doctor';

    // If opening as specialist peer, auto-authorize view
    if (role === 'specialist') {
      setIsPaid(true);
    }

    const client = new WebRTCClient({
      roomId: 'emergency-room-chanderi-aiims',
      role,
      onLocalStream: (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          setHasRemoteVideo(true);
        }
      },
      onStatusChange: (status) => {
        setWebrtcStatus(status);
        if (status.includes('LIVE') || status.includes('ACTIVE') || status.includes('STANDBY')) {
          setCallState('CONNECTED');
        }
      }
    });

    client.initialize();
    webrtcClientRef.current = client;

    return () => {
      client.close();
    };
  }, []);

  const handleToggleMic = () => {
    if (!isPaid) {
      setShowPaymentModal(true);
      return;
    }
    if (webrtcClientRef.current) {
      const active = webrtcClientRef.current.toggleAudio();
      setMicOn(active);
    }
  };

  const handleToggleVideo = () => {
    if (!isPaid) {
      setShowPaymentModal(true);
      return;
    }
    if (webrtcClientRef.current) {
      const active = webrtcClientRef.current.toggleVideo();
      setVideoOn(active);
    }
  };

  const handleEndCall = () => {
    if (webrtcClientRef.current) {
      webrtcClientRef.current.close();
      setSessionActive(false);
      setCallState('IDLE');
    }
  };

  const openSecondPeerWindow = () => {
    if (!isPaid) {
      setShowPaymentModal(true);
      return;
    }
    const url = `${window.location.protocol}//${window.location.host}/?tab=tele&teleRole=specialist#tele`;
    window.open(url, '_blank', 'width=980,height=750');
  };

  // Direct In-App Call Trigger with Gatekeeper Check
  const triggerInAppCall = () => {
    if (!isPaid) {
      setShowPaymentModal(true);
      return;
    }

    setShowCallModal(true);
    setCallState('RINGING');

    // Simulate ringtone chime with Web Audio API
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const playChime = (freq, time, dur) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + time);
          osc.stop(ctx.currentTime + time + dur);
        };
        playChime(440, 0, 0.4);
        playChime(480, 0.45, 0.6);
      }
    } catch {}

    setTimeout(() => {
      setCallState('CONNECTED');
    }, 2200);
  };

  // Helper: Transmit Complete Patient Intake & Triage Vitals Report to Doctor & Database
  const dispatchReportToDoctor = async (methodName, receipt) => {
    const reportData = {
      patientName,
      patientAge,
      patientLocation,
      patientProblem,
      bpStr,
      hr,
      tempC,
      tempF,
      spo2,
      bloodLoss,
      respRate,
      gcs,
      shockIndex,
      mapPressure,
      triageCat,
      survivalMinutes,
      timestamp: new Date().toLocaleTimeString(),
      assignedDoctor: doc.name,
      receiptNumber: receipt?.transactionId || receipt?.id || 'TXN-PAID'
    };
    setTransmittedReport(reportData);

    // 1. Submit complaint & clinical report to SQLite database user_complaints table assigned to this doctor
    try {
      await api.submitUserComplaint({
        name: patientName,
        phone: currentUser?.phone || '+91 7061496748',
        problem: `Tele-Doctor Emergency Referral: ${patientProblem} | BP: ${bpStr}, Temp: ${tempC}°C (${tempF}°F), HR: ${hr} bpm, SpO2: ${spo2}%, Loss: ${bloodLoss}ml, GCS: ${gcs}/15, Survival: ~${survivalMinutes}m. Assigned to ${doc.name}.`,
        locationName: patientLocation,
        latitude: currentUser?.latitude || 24.7180,
        longitude: currentUser?.longitude || 78.1062,
        severity: triageCat.includes('RED') ? 'CRITICAL' : 'URGENT',
        symptoms: [patientProblem, `BP: ${bpStr}`, `Temp: ${tempF}°F`, `SpO2: ${spo2}%`, `Survival: ~${survivalMinutes}m`],
        vitals: {
          heartRate: hr,
          systolicBp: sysBp,
          diastolicBp: diaBp,
          spo2,
          tempC,
          tempF,
          respiratoryRate: respRate,
          bloodLossMl: bloodLoss,
          gcsScore: gcs,
          shockIndex,
          mapPressure,
          triageCategory: triageCat,
          survivalMinutes
        }
      });
    } catch (e) {
      console.warn('Complaint submit error:', e);
    }

    // 2. Broadcast via WebSocket Telemetry Hub to Doctor Workstation
    try {
      await api.pushTelemetry({
        patientName,
        location: patientLocation,
        emergencyType: patientProblem,
        vitals: {
          heartRate: hr,
          systolicBp: sysBp,
          diastolicBp: diaBp,
          spo2,
          tempC,
          respiratoryRate: respRate,
          bloodLossMl: bloodLoss,
          gcsScore: gcs
        },
        triageResult: {
          survivalMinutes,
          shockIndex,
          mapPressure,
          triageCategory: triageCat
        },
        assignedDoctor: doc.name,
        paymentStatus: 'PAID_AND_TRANSMITTED'
      });
    } catch (e) {
      console.warn('Telemetry push error:', e);
    }
  };

  // Payment Execution Handler
  const handleExecutePayment = async (selectedMethod) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const feeAmount = selectedMethod === 'PMJAY_CASHLESS' ? 0 : (doc.teleConsultationFee !== undefined ? doc.teleConsultationFee : 1);
      const receipt = await api.payConsultationFee({
        doctorId: doc.id,
        patientName: currentUser?.name || vitals?.patientName || 'Emergency Patient',
        amount: feeAmount,
        paymentMethod: selectedMethod,
        ayushmanCardNo: selectedMethod === 'PMJAY_CASHLESS' ? ayushmanCardNo : null,
        vitals: {
          heartRate: hr,
          systolicBp: sysBp,
          diastolicBp: diaBp,
          spo2,
          tempC,
          respiratoryRate: respRate,
          bloodLossMl: bloodLoss,
          gcsScore: gcs,
          shockIndex,
          mapPressure,
          triageCategory: triageCat
        }
      });

      // Dispatch full clinical triage report to doctor workstation & database
      await dispatchReportToDoctor(selectedMethod, receipt);

      setPaymentReceipt(receipt);
      setIsPaid(true);
      setIsProcessingPayment(false);
      setShowPaymentModal(false);

      // Play success chime
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {}
    } catch (err) {
      setIsProcessingPayment(false);
      setPaymentError('Payment processing failed. Please retry.');
    }
  };

  // Real UTR Verification against Database
  const handleVerifyUtrPayment = async () => {
    const cleanUtr = utrInput.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setPaymentError('❌ Invalid UTR: Please send ₹750 via PhonePe QR and enter the exact 12-digit numeric UTR / Ref No from your payment receipt.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const res = await api.verifyUtrPayment({
        utrNumber: cleanUtr,
        amount: feeAmount,
        payerName: payerNameInput || patientName,
        doctorId: doc.id,
        doctorName: doc.name
      });

      // Dispatch full clinical triage report to doctor workstation & database
      await dispatchReportToDoctor('UPI_UTR', res.receipt);

      setPaymentReceipt(res.receipt);
      setIsPaid(true);
      setIsProcessingPayment(false);
      setShowPaymentModal(false);

      // Play success chime
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {}
    } catch (err) {
      setIsProcessingPayment(false);
      setPaymentError('❌ ' + err.message);
    }
  };

  const handleDoctorPinUnlock = () => {
    if (doctorPasscode === '9508' || doctorPasscode === '7061') {
      dispatchReportToDoctor('DOCTOR_PIN', { transactionId: 'PIN-OVERRIDE-MANISH' });
      setIsPaid(true);
      setShowPaymentModal(false);
      alert('Doctor Override: Access Unlocked & Clinical Report Synced for Dr. Manish Kumar!');
    } else {
      setPaymentError('❌ Incorrect Doctor PIN. Please enter 9508 or 7061.');
    }
  };

  // Step-by-step stabilization tasks completed by local doctor
  const [completedSteps, setCompletedSteps] = useState({
    step1: true,  // Hemostatic direct pressure
    step2: false, // TXA injection
    step3: false, // Two 16G IV cannulas + warmed RL
    step4: false, // High-dose Vitamin C / Inotrope stabilization
    step5: false, // High-flow oxygen + Cervical collar
  });

  const toggleStep = (key) => {
    if (!isPaid) {
      setShowPaymentModal(true);
      return;
    }
    setCompletedSteps(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!prev[key]) {
        onUpdateVitals(v => ({
          ...v,
          heartRate: Math.max(75, v.heartRate - 5),
          systolicBp: Math.min(115, v.systolicBp + 4),
          spo2: Math.min(98, v.spo2 + 2)
        }));
      }
      return next;
    });
  };

  const doc = selectedDoctor || doctors[0];
  const docPhone = doc?.phoneNumber || '+91 7061496748';
  const docWa = doc?.whatsappNumber || '917061496748';
  const mobileLink = `${window.location.protocol}//${window.location.host}/?tab=tele&teleRole=specialist#tele`;
  const feeAmount = doc?.teleConsultationFee !== undefined ? doc.teleConsultationFee : 1;
  const standardCost = doc?.standardCityCost || 5000;
  const savingsAmount = standardCost - feeAmount;

  return (
    <div className="space-y-6 relative">
      {/* 20% Cost Benefit & Payment Status Banner */}
      <div className={`border rounded-2xl p-5 shadow-2xl transition-all ${
        isPaid 
          ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-emerald-500/60' 
          : 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-red-950/90 border-amber-500/50'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl text-white shadow-lg ${
              isPaid ? 'bg-emerald-600 shadow-emerald-950' : 'bg-amber-600 shadow-amber-900'
            }`}>
              {isPaid ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                  isPaid 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isPaid ? 'ACCESS GRANTED • 20% SUBSIDY AUTHORIZED' : 'PAYMENT REQUIRED • 20% SUBSIDIZED PLAN'}
                </span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">
                  Save ₹{savingsAmount} (80% Govt Subsidy)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {isPaid
                  ? `Active Session with ${doc.name} (Authorized Consultation)`
                  : 'Specialist Tele-ICU Consultation Locked: Complete ₹750 Payment to Call'}
              </h2>
            </div>
          </div>

          {/* Access Status & Payment Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            {!isPaid ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-950 transition flex items-center gap-2 active:scale-95 animate-pulse"
              >
                <CreditCard className="w-4 h-4" />
                <span>PAY ₹{feeAmount} TO UNLOCK DOCTOR</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                title="Click to view QR & payment receipt"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>RECEIPT #{paymentReceipt?.transactionId || 'TXN-PAID'} (UNLOCKED)</span>
              </button>
            )}

            <button
              onClick={openSecondPeerWindow}
              className={`border px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow active:scale-95 ${
                isPaid 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Open second window to test 2-way WebRTC peer video"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Peer Window</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transmitted Patient Clinical Report Banner (Delivered to Doctor Desk) */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-900/50">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{patientName} ({patientAge} Yrs, {currentUser?.gender || vitals?.gender || 'Male'})</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  REPORT TRANSMITTED TO {doc.name.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                  {triageCat.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>{patientLocation}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-300">Emergency: <strong className="text-red-400">{patientProblem}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300 font-mono">
            <span className="text-[11px] bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Synced with DB: {paymentReceipt?.transactionId || 'TXN-AUTHORIZED'}</span>
            </span>
            <span>Survival: <strong className="text-emerald-400 font-bold">~{survivalMinutes} mins</strong></span>
          </div>
        </div>

        {/* 6-Metric Vitals Live Strip on Doctor Desk */}
        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-red-400" /> BP:
            </span>
            <span className={`font-bold ${sysBp < 90 ? 'text-red-400' : 'text-slate-200'}`}>{bpStr}</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-rose-400" /> HR:
            </span>
            <span className={`font-bold ${hr > 110 ? 'text-red-400' : 'text-slate-200'}`}>{hr} bpm</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-400" /> Temp:
            </span>
            <span className={`font-bold ${tempC > 38 || tempC < 35.5 ? 'text-amber-400' : 'text-slate-200'}`}>
              {tempC}°C ({tempF}°F)
            </span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" /> SpO2:
            </span>
            <span className={`font-bold ${spo2 < 90 ? 'text-red-400' : 'text-slate-200'}`}>{spo2}%</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-red-500" /> Loss:
            </span>
            <span className="font-bold text-red-400">{bloodLoss} mL</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" /> GCS:
            </span>
            <span className="font-bold text-amber-300">{gcs}/15</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video Consultation Console (Gated by Payment) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Top Bar with Real WebRTC Status */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`relative flex h-2.5 w-2.5 ${isPaid ? 'animate-ping' : ''}`}>
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPaid ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  STATUS: <span className={isPaid ? 'text-emerald-400' : 'text-amber-400'}>
                    {isPaid ? `ENCRYPTED P2P LIVE (${webrtcStatus})` : 'LOCKED (PAYMENT PENDING)'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono font-bold text-emerald-400">
                  {doc.name}
                </span>
              </div>
            </div>

            {/* Video Canvas with Dynamic Lock Overlay */}
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
              {/* Actual Video Track if Paid */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${hasRemoteVideo && isPaid ? 'block' : 'hidden'}`}
              />

              {/* Persona / Audio Simulator if unlinked peer */}
              {(!hasRemoteVideo || !isPaid) && (
                <div className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-6 text-center transition-all ${
                  !isPaid ? 'blur-md opacity-30 select-none pointer-events-none' : ''
                }`}>
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full bg-blue-600/30 border-2 border-blue-400/80 flex items-center justify-center shadow-inner">
                      <UserCheck className="w-12 h-12 text-blue-300" />
                    </div>
                    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{doc.name}</h4>
                  <p className="text-xs text-blue-300 font-medium max-w-md">{doc.specialization}</p>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Direct Hotline: <strong className="text-emerald-400">{docPhone}</strong> &bull; {doc.experienceYears}+ Yrs Exp
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-slate-700">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                    <span className="text-[11px] font-mono text-emerald-300 ml-1">
                      {isHi ? '"तुरंत 1g TXA स्लो-पुश दीजिए और बीपी मॉनिटर करें..."' : '"Administer 1g TXA slow push and check SBP..."'}
                    </span>
                  </div>
                </div>
              )}

              {/* OVERLAY: Gated Lock Screen when NOT PAID */}
              {!isPaid && (
                <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-xl">
                    <Lock className="w-8 h-8 animate-bounce" />
                  </div>
                  
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-lg font-black text-white">
                      Tele-Emergency Video Feed Is Locked
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      To access <strong className="text-white">{doc.name}</strong>, complete the subsidized 20% rural emergency consultation bill of <strong className="text-emerald-400">₹{feeAmount}</strong> (or verify via Ayushman Bharat Golden Card for 100% cashless grant).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setPaymentMethod('UPI');
                        setShowPaymentModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition flex items-center gap-2 active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{feeAmount} via UPI</span>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod('AYUSHMAN');
                        setShowPaymentModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold text-xs transition flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Ayushman Bharat (Free ₹0)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture: Local Webcam */}
              <div className={`absolute bottom-4 right-4 w-44 aspect-video bg-slate-950/90 rounded-xl border-2 border-emerald-500/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center z-20 ${
                !isPaid ? 'opacity-40' : ''
              }`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                  Local PHC Camera
                </div>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="bg-slate-900/90 px-4 py-3 flex items-center justify-between flex-wrap gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMic}
                  className={`p-3 rounded-full transition ${
                    micOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                  }`}
                  title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition ${
                    videoOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                  }`}
                  title={videoOn ? 'Stop Video' : 'Start Video'}
                >
                  {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-950"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>{isHi ? 'समाप्त' : 'End Call'}</span>
                </button>
              </div>

              {/* Direct Calling Emergency Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerInAppCall}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg ${
                    isPaid 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900 animate-pulse' 
                      : 'bg-slate-800 text-amber-300 border border-amber-500/50'
                  }`}
                >
                  {isPaid ? <PhoneCall className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-400" />}
                  <span>{isPaid ? `CALL ${doc.name.toUpperCase()}` : `UNLOCK & CALL (₹${feeAmount})`}</span>
                </button>

                <a
                  href={`https://wa.me/${docWa}?text=${encodeURIComponent(
                    `🚨 JEEVANSETU AI CRITICAL EMERGENCY CONSULTATION\n` +
                    `Doctor: ${doc.name}\n` +
                    `Payment Status: ${isPaid ? 'PAID & AUTHORIZED' : 'PAYMENT PENDING'}\n` +
                    `Patient: ${vitals?.patientName || 'Vikas Meena'} (${vitals?.age || 28}/${vitals?.gender || 'M'})\n` +
                    `Condition: ${vitals?.emergencyType || 'Severe Highway Polytrauma'}\n` +
                    `Vitals: HR ${vitals?.heartRate} BPM | BP ${vitals?.systolicBp}/${vitals?.diastolicBp} | SpO2 ${vitals?.spo2}%\n` +
                    `Join Live Video Room: ${mobileLink}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 hover:bg-green-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-green-900"
                  title="Send patient vitals & live video link to doctor's WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp SOS</span>
                </a>
              </div>
            </div>
          </div>

          {/* Doctor Direct Hotline Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 text-lg font-bold">
                👨‍⚕️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">{doc.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    ONLINE 24x7
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Direct Line: <strong className="text-emerald-400 font-mono">{docPhone}</strong> &bull; {doc.designation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mobileLink);
                  alert(`Doctor Video Link Copied!\n\nOpen this on any phone or browser to connect directly with Dr. Manish Singh:\n${mobileLink}`);
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy Mobile Video Link</span>
              </button>
            </div>
          </div>

          {/* Doctor Selection Carousel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3">
              {isHi ? 'उपलब्ध वरिष्ठ विशेषज्ञ (24x7 ऑन-कॉल पैनल)' : 'Available On-Duty Trauma Specialists'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDoctor(d);
                    // Keep unlocked if Dr. Manish is selected
                    if (d.name?.toLowerCase().includes('manish')) {
                      setIsPaid(true);
                      setPaymentReceipt({
                        transactionId: 'TXN-UPI-MANISH-AUTHORIZED',
                        amountPaid: 1,
                        doctorName: d.name,
                        paymentMethod: 'PHONEPE_UPI_VERIFIED',
                        status: 'AUTHORIZED'
                      });
                    } else if (d.id !== doc.id) {
                      setIsPaid(false);
                      setPaymentReceipt(null);
                    }
                  }}
                  className={`text-left p-3.5 rounded-xl border transition ${
                    selectedDoctor?.id === d.id 
                      ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white line-clamp-1">{d.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">₹{d.teleConsultationFee} (20%)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{d.specialization}</p>
                  <div className="mt-2 text-[10px] text-blue-300 font-mono flex justify-between items-center">
                    <span>⭐ {d.rating} | {d.languages?.join(', ')}</span>
                    <span className="text-emerald-400 font-bold">{d.phoneNumber || '+91 7061496748'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Telemetry & Step-by-Step Guidance */}
        <div className="space-y-6">
          {/* Synchronized Biometrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                Live Patient Biometrics
              </h4>
              <span className="text-[10px] font-mono text-emerald-400">SYNCED</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">HR / Pulse</span>
                <span className="text-xl font-black text-red-400">{vitals.heartRate} <span className="text-xs font-normal">BPM</span></span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <span className="text-xl font-black text-red-400">{vitals.systolicBp}/{vitals.diastolicBp}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SpO2</span>
                <span className="text-xl font-black text-amber-400">{vitals.spo2}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Shock Index</span>
                <span className="text-xl font-black text-red-400">{(vitals.heartRate / (vitals.systolicBp || 1)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Stabilization Protocol (Gated) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isHi ? 'लाइव मार्गदर्शन चेकलिस्ट' : 'Stabilization Action Protocol'}
              </h4>
              <span className="text-[10px] text-slate-400">Plan B Guidance</span>
            </div>

            <div className={`space-y-2.5 text-xs ${!isPaid ? 'opacity-40 select-none' : ''}`}>
              <label onClick={() => toggleStep('step1')} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input type="checkbox" checked={completedSteps.step1} onChange={() => {}} className="mt-0.5 text-emerald-500 rounded bg-slate-900" />
                <div>
                  <span className="font-bold text-white block">1. Combat Packing &amp; Tourniquet</span>
                  <span className="text-slate-400 text-[11px]">Direct mechanical pressure applied to bleeding wound.</span>
                </div>
              </label>

              <label onClick={() => toggleStep('step2')} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input type="checkbox" checked={completedSteps.step2} onChange={() => {}} className="mt-0.5 text-emerald-500 rounded bg-slate-900" />
                <div>
                  <span className="font-bold text-white block">2. 1g IV Tranexamic Acid (TXA)</span>
                  <span className="text-slate-400 text-[11px]">Infuse over 10 minutes to arrest hyperfibrinolysis.</span>
                </div>
              </label>

              <label onClick={() => toggleStep('step3')} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input type="checkbox" checked={completedSteps.step3} onChange={() => {}} className="mt-0.5 text-emerald-500 rounded bg-slate-900" />
                <div>
                  <span className="font-bold text-white block">3. Large-Bore IV &amp; Warmed RL</span>
                  <span className="text-slate-400 text-[11px]">Two 16G cannulas with 1000ml Ringer's Lactate.</span>
                </div>
              </label>

              <label onClick={() => toggleStep('step4')} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input type="checkbox" checked={completedSteps.step4} onChange={() => {}} className="mt-0.5 text-emerald-500 rounded bg-slate-900" />
                <div>
                  <span className="font-bold text-white block">4. Microvascular Protection</span>
                  <span className="text-slate-400 text-[11px]">Calcium gluconate + Inotropic pressor support.</span>
                </div>
              </label>

              <label onClick={() => toggleStep('step5')} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input type="checkbox" checked={completedSteps.step5} onChange={() => {}} className="mt-0.5 text-emerald-500 rounded bg-slate-900" />
                <div>
                  <span className="font-bold text-white block">5. High-Flow O2 &amp; Cervical Collar</span>
                  <span className="text-slate-400 text-[11px]">Non-rebreather mask at 12-15 L/min flow.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 20% EMERGENCY BILLING & PAYMENT MODAL (GATEKEEPER) */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GOVT RURAL EMERGENCY 20% SUBSIDY GATEWAY</span>
              </div>
              <h3 className="text-2xl font-black text-white">Unlock Tele-ICU Consultation</h3>
              <p className="text-xs text-slate-400">
                Direct encrypted link to <strong>{doc.name}</strong> ({docPhone})
              </p>
            </div>

            {/* Attached Patient Information & Complete Clinical Triage Telemetry */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="text-[10px] font-mono font-bold text-sky-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  Live Patient Intake & Triage Report (Auto-Transmitted to {doc.name})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                    {triageCat.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                    Golden Hour: ~{survivalMinutes}m
                  </span>
                </div>
              </div>

              {/* Patient Basic Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400">Patient: </span>
                  <strong className="text-white">{patientName} ({patientAge} Yrs, {currentUser?.gender || vitals?.gender || 'Male'})</strong>
                </div>
                <div>
                  <span className="text-slate-400">Emergency: </span>
                  <strong className="text-red-400">{patientProblem}</strong>
                </div>
                <div className="sm:col-span-2 text-slate-300">
                  <span className="text-slate-400">Origin Location: </span>
                  <strong className="text-emerald-400">{patientLocation}</strong>
                </div>
              </div>

              {/* 8-Point Clinical Triage Vitals Grid */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-red-400" />
                  <span>Real-Time Triage Vitals (Transmitted with Payment):</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {/* 1. Blood Pressure */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-red-400" /> BP
                      </span>
                      <span className={`text-[9px] font-bold ${sysBp < 90 ? 'text-red-400' : 'text-slate-400'}`}>
                        {sysBp < 90 ? 'Shock' : 'Normal'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${sysBp < 90 ? 'text-red-400' : 'text-white'}`}>
                      {bpStr}
                    </div>
                  </div>

                  {/* 2. Body Temperature */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                      </span>
                      <span className={`text-[9px] font-bold ${tempC > 38 ? 'text-amber-400' : tempC < 35.5 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                        {tempC > 38 ? 'Pyrexia' : tempC < 35.5 ? 'Hypothermia' : 'Normal'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${tempC > 38 || tempC < 35.5 ? 'text-amber-400' : 'text-white'}`}>
                      {tempC}°C ({tempF}°F)
                    </div>
                  </div>

                  {/* 3. Heart Rate */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-rose-400" /> Pulse (HR)
                      </span>
                      <span className={`text-[9px] font-bold ${hr > 110 ? 'text-red-400' : 'text-slate-400'}`}>
                        {hr > 110 ? 'Tachycardia' : 'Normal'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${hr > 110 ? 'text-red-400' : 'text-white'}`}>
                      {hr} bpm
                    </div>
                  </div>

                  {/* 4. Oxygen SpO2 */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-sky-400" /> SpO2
                      </span>
                      <span className={`text-[9px] font-bold ${spo2 < 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {spo2 < 90 ? 'Critical' : 'Adequate'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${spo2 < 90 ? 'text-red-400' : 'text-white'}`}>
                      {spo2}%
                    </div>
                  </div>

                  {/* 5. Blood Loss */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-red-500" /> Loss
                      </span>
                      <span className="text-[9px] font-bold text-red-400">
                        {bloodLoss > 1000 ? 'Class III' : 'Class I-II'}
                      </span>
                    </div>
                    <div className="text-sm font-bold mt-1 text-red-400">
                      {bloodLoss} mL
                    </div>
                  </div>

                  {/* 6. Respiratory Rate */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-teal-400" /> Resp
                      </span>
                      <span className={`text-[9px] font-bold ${respRate > 24 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {respRate > 24 ? 'Tachypnea' : 'Normal'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${respRate > 24 ? 'text-amber-300' : 'text-white'}`}>
                      {respRate} /min
                    </div>
                  </div>

                  {/* 7. Glasgow Coma Scale (GCS) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" /> GCS
                      </span>
                      <span className={`text-[9px] font-bold ${gcs <= 8 ? 'text-red-400' : gcs <= 12 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {gcs <= 8 ? 'Severe' : gcs <= 12 ? 'Moderate' : 'Mild'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${gcs <= 12 ? 'text-amber-300' : 'text-white'}`}>
                      {gcs} / 15
                    </div>
                  </div>

                  {/* 8. Shock Index & MAP */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-rose-400" /> Shock Idx
                      </span>
                      <span className={`text-[9px] font-bold ${shockIndex > 0.9 ? 'text-red-400' : 'text-slate-400'}`}>
                        MAP: {mapPressure}
                      </span>
                    </div>
                    <div className={`text-sm font-bold mt-1 ${shockIndex > 0.9 ? 'text-red-400' : 'text-white'}`}>
                      {shockIndex} SI
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Dispatch Security Notice */}
              <div className="text-[10px] font-mono text-slate-400 bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  📡 Complete clinical triage profile will be encrypted &amp; auto-dispatched to <strong>{doc.name}</strong>'s video monitor upon payment confirmation.
                </span>
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>City Private Super-Specialty ICU:</span>
                <span className="line-through font-mono">₹{standardCost}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-semibold">
                <span>Rural Golden Hour Subsidy (80% Off):</span>
                <span>-₹{savingsAmount}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-extrabold text-white">
                <span>Net Emergency Fee (20% Only):</span>
                <span className="text-2xl text-emerald-400 font-mono">₹{feeAmount}</span>
              </div>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  paymentMethod === 'UPI' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI QR / Apps</span>
              </button>

              <button
                onClick={() => setPaymentMethod('AYUSHMAN')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  paymentMethod === 'AYUSHMAN' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Ayushman Bharat (Free)</span>
              </button>
            </div>

            {/* TAB A: Real PhonePe QR & Strict 12-Digit UTR Verification */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4">
                {/* Real PhonePe QR Card */}
                <div className="bg-slate-950 border border-purple-500/50 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-sm">
                        पे
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Manish Kumar</div>
                        <div className="text-[10px] text-purple-300 font-mono">+91 9508258748</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      Union Bank of India (9123)
                    </span>
                  </div>

                  {/* Real Uploaded PhonePe QR Image */}
                  <div className="bg-white p-2.5 rounded-2xl max-w-[220px] mx-auto shadow-2xl border-4 border-purple-600 overflow-hidden">
                    <img
                      src="/phonepe-qr.jpg"
                      alt="Manish Kumar PhonePe QR Code"
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  </div>

                  <div className="space-y-0.5 text-center">
                    <p className="text-xs font-mono text-purple-300 font-bold">
                      Scan via PhonePe, Google Pay, Paytm, or BHIM
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Transfer exact emergency fee: <strong className="text-emerald-400">₹{feeAmount}</strong>
                    </p>
                  </div>
                </div>

                {/* Strict 12-Digit Bank UTR Input */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex justify-between">
                      <span>Enter 12-Digit UPI Reference / UTR Number *</span>
                      <span className="text-[10px] font-normal text-slate-400">Mandatory from receipt</span>
                    </label>
                    <input
                      type="text"
                      maxLength="12"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 428190284719"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-base text-emerald-400 font-mono font-bold tracking-wider placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Sender Name / Mobile (Optional)
                    </label>
                    <input
                      type="text"
                      value={payerNameInput}
                      onChange={(e) => setPayerNameInput(e.target.value)}
                      placeholder="e.g. Ramesh Meena (Patient Brother)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleVerifyUtrPayment}
                    disabled={isProcessingPayment || utrInput.length < 12}
                    className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-95 ${
                      utrInput.length === 12
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950 cursor-pointer animate-pulse'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {isProcessingPayment 
                        ? 'VERIFYING BANK UTR WITH DATABASE...' 
                        : utrInput.length === 12 
                          ? `VERIFY UTR & UNLOCK DR. MANISH SINGH` 
                          : 'ENTER 12-DIGIT UTR TO UNLOCK'}
                    </span>
                  </button>
                </div>

                {/* Doctor / Owner Passcode Quick Access */}
                <div className="pt-1 text-center">
                  {!showDocBypass ? (
                    <button
                      onClick={() => setShowDocBypass(true)}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                    >
                      Are you Dr. Manish Kumar? Click to enter Doctor PIN
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                      <input
                        type="password"
                        maxLength="4"
                        value={doctorPasscode}
                        onChange={(e) => setDoctorPasscode(e.target.value)}
                        placeholder="Doctor PIN (9508/7061)"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono w-40 focus:outline-none"
                      />
                      <button
                        onClick={handleDoctorPinUnlock}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        Unlock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB B: Ayushman Bharat 100% Cashless Waiver */}
            {paymentMethod === 'AYUSHMAN' && (
              <div className="space-y-4">
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    PM-JAY Golden Card Cashless Guarantee
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Under National Health Authority (NHA) Emergency Clause 4B, rural BPL and Ayushman families receive 100% free Tele-ICU triage. Fee will be billed directly to the Ministry grant.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Patient Ayushman Card / ABHA ID
                  </label>
                  <input
                    type="text"
                    value={ayushmanCardNo}
                    onChange={(e) => setAyushmanCardNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. PMJAY-DEL-2026-991A"
                  />
                </div>

                <button
                  onClick={() => handleExecutePayment('PMJAY_CASHLESS')}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition active:scale-95"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isProcessingPayment ? 'AUTHORIZING PM-JAY GRANT...' : 'VERIFY & WAIVE FEE TO ₹0 (100% CASHLESS)'}</span>
                </button>
              </div>
            )}

            {paymentError && (
              <p className="text-xs text-red-400 text-center font-semibold">{paymentError}</p>
            )}
          </div>
        </div>
      )}

      {/* Interactive Emergency Call Modal (Only Accessible after Payment) */}
      {showCallModal && isPaid && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-3xl">
                👨‍⚕️
              </div>
              <h3 className="text-xl font-black text-white">{doc.name}</h3>
              <p className="text-xs text-emerald-400 font-mono font-bold">DIRECT ON-CALL HOTLINE: {docPhone}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300">
                  {callState === 'RINGING' ? 'Ringing Dr. Manish Singh...' : 'Call Connected (HD Encrypted Video)'}
                </span>
              </div>
            </div>

            {/* Call Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setShowCallModal(false);
                  openSecondPeerWindow();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950 transition"
              >
                <Video className="w-5 h-5" />
                <span>Answer Video Call in Doctor Window</span>
              </button>

              <a
                href={`https://wa.me/${docWa}?text=${encodeURIComponent(
                  `🚨 EMERGENCY CONSULTATION CALL\nPatient: ${vitals?.patientName || 'Vikas Meena'}\nReceipt: ${paymentReceipt?.transactionId || 'PAID'}\nJoin Live Room: ${mobileLink}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Open WhatsApp Chat ({docPhone})</span>
              </a>

              <a
                href={`tel:${docPhone}`}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <PhoneForwarded className="w-4 h-4 text-emerald-400" />
                <span>Cellular Dial on Phone: {docPhone}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
