import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  Wind, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  PhoneCall, 
  IndianRupee, 
  UserCheck, 
  Navigation,
  ArrowRight,
  CreditCard,
  QrCode,
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Zap,
  Sparkles,
  User,
  HeartPulse,
  Activity,
  Thermometer,
  Droplet,
  Brain,
  Gauge
} from 'lucide-react';
import { api } from '../services/api';

export default function HospitalReferralGrid({ 
  hospitals, 
  survivalMinutes, 
  triageResult,
  onSelectHospital, 
  selectedHospitalId, 
  onProceedToTransit,
  vitals = {},
  currentUser = {},
  lang 
}) {
  const isHi = lang === 'hi';
  const [filter, setFilter] = useState('all'); // all, ayushman, fastest, most-beds
  
  // Hospital Payment Gatekeeper State
  const [payingHospital, setPayingHospital] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'AYUSHMAN' | 'PIN'
  const [testMode, setTestMode] = useState(true); // Default ₹1 test mode
  const [utrInput, setUtrInput] = useState('');
  const [ayushmanCardNo, setAyushmanCardNo] = useState('PMJAY-DEL-2026-991A');
  const [doctorPasscode, setDoctorPasscode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [bookedReceipt, setBookedReceipt] = useState(null);

  const patientName = currentUser?.name || vitals?.patientName || 'Manish Singh';
  const patientAge = currentUser?.age || vitals?.age || 28;
  const patientLocation = currentUser?.locationName || 'NH-48 Highway, Mile Marker 42 / Chanderi';
  const patientProblem = vitals?.emergencyType || 'Severe Trauma / High Fever';

  // Derived Clinical Triage & Real-time Vitals
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

  const filteredHospitals = hospitals.filter(h => {
    if (filter === 'ayushman') return h.ayushmanBharat;
    if (filter === 'fastest') return h.totalTransitMins <= 45;
    if (filter === 'most-beds') return h.icuBedsAvailable >= 4;
    return true;
  });

  // Open Payment Gatekeeper Modal before booking
  const handleInitiateBooking = (hosp) => {
    setPayingHospital(hosp);
    setPaymentError(null);
    setUtrInput('');
    setShowPaymentModal(true);
  };

  // Process Hospital Payment
  const handleExecutePayment = async (method) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    const feeAmount = method === 'AYUSHMAN' 
      ? 0 
      : (payingHospital.bookingDeposit === 0 
          ? 0 
          : (testMode ? 1 : (payingHospital.bookingDeposit || 2500)));

    try {
      const receipt = await api.payHospitalDeposit({
        hospitalId: payingHospital.id,
        hospitalName: payingHospital.name,
        patientName,
        amount: feeAmount,
        paymentMethod: method,
        utrNumber: method === 'UPI' ? utrInput : null,
        ayushmanId: method === 'AYUSHMAN' ? ayushmanCardNo : null,
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

      // Also trigger live admission pre-registration to alert City Hospital Dashboard
      try {
        await api.preRegisterAdmission({
          patientName,
          age: patientAge,
          gender: currentUser?.gender || vitals?.gender || 'Male',
          hospitalId: payingHospital.id,
          villageOrigin: patientLocation,
          emergencyType: patientProblem,
          reservedBedType: 'ICU Bed #04 (Trauma Ready)',
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
      } catch {}

      setBookedReceipt(receipt);
      setIsProcessingPayment(false);

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

      // Select and notify parent
      onSelectHospital(payingHospital.id);
      setTimeout(() => {
        setShowPaymentModal(false);
        const pass = receipt?.admissionPass || receipt;
        onProceedToTransit(payingHospital.id, pass);
      }, 1500);

    } catch (err) {
      setIsProcessingPayment(false);
      setPaymentError('Payment processing failed. Please retry.');
    }
  };

  const handleVerifyUtr = () => {
    const cleanUtr = utrInput.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setPaymentError('❌ Invalid UTR: Please enter the exact 12-digit numeric Ref/UTR No from your PhonePe receipt.');
      return;
    }
    handleExecutePayment('UPI');
  };

  const handleDoctorPinUnlock = () => {
    if (doctorPasscode === '7061' || doctorPasscode === '9508') {
      handleExecutePayment('DOCTOR_EMERGENCY_OVERRIDE');
    } else {
      setPaymentError('❌ Incorrect Emergency PIN. Enter 7061 or 9508.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Logged-in Patient Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-900/50">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{patientName} ({patientAge} Yrs)</span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40">
                  ACTIVE PATIENT REPORT
                </span>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                  {triageCat.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>{patientLocation}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <span>Triage: <strong className="text-red-400">{patientProblem}</strong></span>
            <span>&bull;</span>
            <span>Survival: <strong className="text-emerald-400 font-bold">~{survivalMinutes} mins</strong></span>
          </div>
        </div>

        {/* Live Vitals Telemetry Badges Strip */}
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

      {/* Header and filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              {isHi 
                ? 'स्मार्ट सिटी अस्पताल रेफरल एवं लाइव आईसीयू बेड ग्रिड' 
                : 'Smart City Hospital Referral & Live ICU Bed Availability'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isHi 
                ? `प्रत्येक अस्पताल का पारदर्शी शुल्क देखें और बुकिंग से पहले 20% अग्रिम भुगतान / आयुष्मान कार्ड से सीट लॉक करें` 
                : `View transparent hospital pricing & complete emergency deposit / PM-JAY authorization before locking your ICU bed`}
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isHi ? 'सभी अस्पताल (All)' : 'All Hospitals'}
            </button>
            <button
              onClick={() => setFilter('ayushman')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filter === 'ayushman' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              {isHi ? 'आयुष्मान भारत 100% मुफ्त' : 'Ayushman Cashless (PM-JAY)'}
            </button>
            <button
              onClick={() => setFilter('fastest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'fastest' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isHi ? 'सबसे कम दूरी (<45m)' : 'Shortest Route (<45m)'}
            </button>
            <button
              onClick={() => setFilter('most-beds')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'most-beds' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isHi ? 'अधिकतम आईसीयू बेड (4+)' : 'Most ICU Beds (4+)'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Safe Transit Margin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span>Fatal Transit Delay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>100% Cashless Ayushman PM-JAY</span>
          </div>
        </div>
      </div>

      {/* Hospital Cards List */}
      <div className="grid grid-cols-1 gap-5">
        {filteredHospitals.map((hosp) => {
          const isSelected = selectedHospitalId === hosp.id;
          const exceedsSurvival = hosp.totalTransitMins > survivalMinutes;
          const isFreeGovt = hosp.isGovernment || hosp.bookingDeposit === 0;

          return (
            <div
              key={hosp.id}
              className={`rounded-2xl border p-5 transition-all shadow-xl ${
                isSelected 
                  ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: Name and Basic Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">
                      {hosp.name}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {hosp.type}
                    </span>
                    {hosp.ayushmanBharat && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {isHi ? 'आयुष्मान भारत कैशलेस' : 'Ayushman PM-JAY Empaneled'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {hosp.distanceKm} km {isHi ? 'दूरी' : 'distance'}
                    </span>
                    <span>|</span>
                    <span className="text-slate-300">
                      ⭐ {hosp.rating} / 5.0 Rating
                    </span>
                    <span>|</span>
                    <span className="text-slate-400">
                      📞 {hosp.contactNumber}
                    </span>
                  </div>
                </div>

                {/* Right: Transit Time */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border text-right font-mono ${
                    exceedsSurvival 
                      ? 'bg-red-950/60 border-red-800/80 text-red-300' 
                      : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  }`}>
                    <div className="text-[10px] uppercase font-bold flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {isHi ? 'यात्रा समय (ट्रैफिक सहित)' : 'Transit Time (w/ Traffic)'}
                    </div>
                    <div className="text-2xl font-black">
                      {hosp.totalTransitMins} mins
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Normal {hosp.normalTimeMins}m + Traffic {hosp.trafficDelayMins}m
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Feasibility Alert */}
              {exceedsSurvival ? (
                <div className="mt-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2 text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>{isHi ? '⚠️ घातक देरी चेतावनी:' : '⚠️ Fatal Transit Risk:'}</strong>{' '}
                    Transit time ({hosp.totalTransitMins}m) exceeds patient survival window ({survivalMinutes}m). High probability of arrest en route!
                  </span>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>{isHi ? 'सुरक्षित सीमा में:' : 'Safely Reachable:'}</strong>{' '}
                    Patient arrives with ~{survivalMinutes - hosp.totalTransitMins} mins buffer. Green Corridor dispatched.
                  </span>
                </div>
              )}

              {/* Real-Time Capacity & Detailed Pricing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800">
                {/* 1. ICU Beds */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Bed className="w-3.5 h-3.5 text-blue-400" />
                    <span>ICU Beds Available</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    {hosp.icuBedsAvailable} / {hosp.totalIcuBeds}{' '}
                    <span className="text-xs font-normal text-emerald-400">Free</span>
                  </div>
                </div>

                {/* 2. Ventilators */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ventilators</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    {hosp.ventilatorsAvailable} Ready
                  </div>
                </div>

                {/* 3. Daily ICU Pricing */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily ICU Rate</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    {hosp.icuDayRate !== undefined && hosp.icuDayRate > 0 
                      ? `₹${hosp.icuDayRate.toLocaleString('en-IN')}/day` 
                      : '₹0 (Free Govt)'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {hosp.ayushmanBharat ? '80-100% PM-JAY Covered' : 'Private TPA'}
                  </div>
                </div>

                {/* 4. Advance Deposit Needed */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bed Lock Deposit</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {hosp.bookingDeposit !== undefined && hosp.bookingDeposit > 0
                      ? `₹${hosp.bookingDeposit.toLocaleString('en-IN')}`
                      : '₹0 (Cashless)'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {hosp.bookingDeposit > 0 ? '⚡ Test Mode: ₹1' : 'Free under PM-JAY'}
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Specialists & Book Button with Payment Trigger */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold text-slate-300">Specialists:</span>
                  {hosp.specialistsOnDuty.map((spec, i) => (
                    <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Pay & Book Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInitiateBooking(hosp)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950' 
                        : exceedsSurvival 
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-950'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isFreeGovt 
                        ? (isHi ? 'आयुष्मान से 100% मुफ्त बेड बुक करें' : 'Authorize Free Bed (PM-JAY)') 
                        : (isHi ? `भुगतान करें और बेड बुक करें (₹${testMode ? 1 : hosp.bookingDeposit})` : `Pay Deposit & Book ICU Bed (₹${testMode ? 1 : hosp.bookingDeposit})`)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* HOSPITAL PAYMENT & BED BOOKING GATEKEEPER MODAL */}
      {/* ==================================================================== */}
      {showPaymentModal && payingHospital && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 my-8">
            {/* Close Button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1 pr-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-blue-400" />
                  ICU Bed Lock & Payment Gate
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {payingHospital.type}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                {payingHospital.name}
              </h3>
              <p className="text-xs text-slate-400">
                Complete hospital booking deposit to lock your ICU bed & dispatch the live report to the destination ER radar.
              </p>
            </div>

            {/* Attached Patient Information & Complete Clinical Triage Telemetry */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="text-[10px] font-mono font-bold text-sky-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  Live Patient Intake & Complete Triage Telemetry (Auto-Transmitted)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                    {triageCat.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                    Golden Hour: ~{survivalMinutes} mins
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
                  <span>Real-Time Triage Vitals Parameters:</span>
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
                        <Thermometer className="w-3 h-3 text-amber-400" /> Temperature
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
                        <Droplet className="w-3 h-3 text-red-500" /> Blood Loss
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
                        <Wind className="w-3 h-3 text-teal-400" /> Resp Rate
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
                        <Brain className="w-3 h-3 text-purple-400" /> GCS Scale
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
              <div className="text-[10px] font-mono text-slate-400 bg-blue-950/40 border border-blue-900/50 rounded-xl p-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  📡 Complete clinical triage profile will be locked into the blockchain token & auto-dispatched to <strong>{payingHospital.name}</strong> ICU upon payment confirmation.
                </span>
              </div>
            </div>

            {/* Itemized Pricing Breakdown */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Emergency Admission Bill Breakdown</span>
                <span className="text-sky-400">24-Hour Bed Guarantee</span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>1. Dedicated ICU Bed (24 Hrs):</span>
                  <span>{payingHospital.icuDayRate > 0 ? `₹${payingHospital.icuDayRate.toLocaleString('en-IN')}` : '₹0 (Free Govt)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Trauma OT & Ventilator Standby:</span>
                  <span>{payingHospital.isGovernment ? '₹0' : '₹4,500'}</span>
                </div>
                {payingHospital.ayushmanBharat && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>3. PM-JAY Ayushman Bharat Subsidy:</span>
                    <span>- {payingHospital.isGovernment ? '100% Free' : '80% Subsidized'}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Payable In-Ambulance Deposit:</span>
                  <span className="text-emerald-400">
                    {payingHospital.bookingDeposit === 0 
                      ? '₹0 (Cashless)' 
                      : (testMode ? '₹1 (Test Mode)' : `₹${payingHospital.bookingDeposit}`)}
                  </span>
                </div>
              </div>

              {/* Test Mode Switcher */}
              {payingHospital.bookingDeposit > 0 && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Verification Fee:</span>
                  <button
                    type="button"
                    onClick={() => setTestMode(!testMode)}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    {testMode ? 'Switch to Full ₹' + payingHospital.bookingDeposit : '⚡ Switch to ₹1 Test Mode'}
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200">
                {paymentError}
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setPaymentMethod('UPI'); setPaymentError(null); }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'UPI'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>PhonePe UPI</span>
              </button>

              <button
                type="button"
                onClick={() => { setPaymentMethod('AYUSHMAN'); setPaymentError(null); }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'AYUSHMAN'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ayushman (₹0)</span>
              </button>

              <button
                type="button"
                onClick={() => { setPaymentMethod('PIN'); setPaymentError(null); }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'PIN'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Doctor PIN</span>
              </button>
            </div>

            {/* TAB 1: UPI / PhonePe QR Option */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4 pt-1">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-36 h-36 bg-white rounded-xl p-1.5 border-2 border-emerald-500 shadow-lg shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/phonepe-qr.jpg" 
                      alt="PhonePe QR Code" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="text-black font-bold text-xs text-center p-2">PhonePe QR<br/>9508258748@ybl</div>';
                      }}
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                      Scan via PhonePe / GPay / Paytm
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      Pay <span className="text-emerald-400 font-extrabold text-base">₹{payingHospital.bookingDeposit === 0 ? 0 : (testMode ? 1 : payingHospital.bookingDeposit)}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      UPI ID: <strong className="text-emerald-400 font-mono">9508258748@ybl</strong><br />
                      Beneficiary: <strong>Manish Kumar / Dr. Manish Singh</strong><br />
                      Bank: <strong>Union Bank of India (Ending 9123)</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Enter 12-Digit PhonePe Transaction Ref No / UTR:
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 428910284719"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyUtr}
                  disabled={isProcessingPayment || utrInput.length < 12}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingPayment ? 'Verifying & Booking...' : 'Verify UTR & Confirm ICU Bed Booking'}</span>
                </button>
              </div>
            )}

            {/* TAB 2: Ayushman Bharat Cashless (₹0) */}
            {paymentMethod === 'AYUSHMAN' && (
              <div className="space-y-4 pt-1 text-xs">
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Ayushman Bharat PM-JAY Golden Card Authorization</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Under National Health Authority Golden Hour Clause 4B, trauma accident patients are entitled to <strong>100% Cashless Emergency Admission (₹0 Co-Pay)</strong> at all empaneled super-specialty hospitals.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Enter PM-JAY Golden Card / ABHA Number:
                  </label>
                  <input
                    type="text"
                    value={ayushmanCardNo}
                    onChange={(e) => setAyushmanCardNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleExecutePayment('AYUSHMAN')}
                  disabled={isProcessingPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold py-3 rounded-xl transition shadow-xl shadow-blue-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Authorize 100% Cashless Bed Reservation (₹0)</span>
                </button>
              </div>
            )}

            {/* TAB 3: Doctor Emergency PIN Override */}
            {paymentMethod === 'PIN' && (
              <div className="space-y-4 pt-1 text-xs">
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>Doctor Immediate Life-or-Death Override</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    If patient is unresponsive or kin is not present, on-duty trauma intensivist (Dr. Manish Singh) can bypass the payment gate immediately using the clinical emergency passcode.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Enter Doctor Passcode (PIN 7061 or 9508):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={doctorPasscode}
                    onChange={(e) => setDoctorPasscode(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDoctorPinUnlock}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition shadow-xl shadow-purple-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Bed Immediately (Doctor Override)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
