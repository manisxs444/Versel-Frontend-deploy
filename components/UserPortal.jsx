import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Navigation, 
  Send, 
  Phone, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Video, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Lock,
  Compass
} from 'lucide-react';
import { api } from '../services/api';

export default function UserPortal({ 
  currentUser, 
  onUpdateUser, 
  onNavigateTab,
  lang 
}) {
  const isHi = lang === 'hi';

  // Profile State (Resets on refresh, stored in DB)
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [age, setAge] = useState(currentUser?.age || '');
  const [gender, setGender] = useState(currentUser?.gender || 'Male');
  const [locationName, setLocationName] = useState(currentUser?.locationName || '');
  const [latitude, setLatitude] = useState(currentUser?.latitude || 24.7180);
  const [longitude, setLongitude] = useState(currentUser?.longitude || 78.1062);
  const [gpsAccuracy, setGpsAccuracy] = useState(currentUser?.gpsAccuracy || null);
  const [isLocating, setIsLocating] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Health Problem Submission State
  const [healthProblem, setHealthProblem] = useState('');
  const [severity, setSeverity] = useState('URGENT'); // 'NORMAL' | 'URGENT' | 'CRITICAL_EMERGENCY'
  const [temperatureF, setTemperatureF] = useState('102');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['High Fever (102°F)', 'Body Ache']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentComplaint, setRecentComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Common Symptoms list
  const availableSymptoms = [
    { id: 'fever', name: isHi ? 'तेज बुखार (102°F)' : 'High Fever (102°F)' },
    { id: 'chills', name: isHi ? 'कंपकंपी / ठंड' : 'Shivering / Chills' },
    { id: 'bodyache', name: isHi ? 'शरीर में दर्द' : 'Body Ache' },
    { id: 'headache', name: isHi ? 'सिरदर्द' : 'Severe Headache' },
    { id: 'cough', name: isHi ? 'खांसी व जुकाम' : 'Cough & Cold' },
    { id: 'vomiting', name: isHi ? 'उल्टी / जी मिचलाना' : 'Vomiting / Nausea' },
    { id: 'trauma', name: isHi ? 'चोट / रक्तस्राव' : 'Trauma / Bleeding' },
    { id: 'breathing', name: isHi ? 'सांस लेने में तकलीफ' : 'Breathing Difficulty' }
  ];

  // Fetch Complaint History on mount
  useEffect(() => {
    loadComplaints();
  }, [userName]);

  const loadComplaints = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getUserComplaints(userName);
      if (res?.complaints) {
        setComplaintHistory(res.complaints);
      }
    } catch (e) {
      console.warn('Error loading complaints:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Live GPS Detector using browser Geolocation API
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert(isHi ? 'आपके ब्राउज़र में GPS सपोर्ट नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        setIsLocating(false);

        // Update location address
        const autoLocation = `Live GPS: ${lat}° N, ${lng}° E (Acc: ±${acc}m)`;
        setLocationName(autoLocation);

        // Update in parent state & localStorage
        onUpdateUser({
          ...currentUser,
          name: userName,
          phone,
          locationName: autoLocation,
          latitude: lat,
          longitude: lng,
          gpsAccuracy: acc
        });
      },
      (error) => {
        setIsLocating(false);
        console.warn('GPS Error:', error.message);
        alert(isHi ? 'GPS अनुमति नहीं मिली या सिग्नल कमजोर है। आप मैन्युअली लोकेशन दर्ज कर सकते हैं।' : 'Unable to acquire GPS coordinates. You can type your location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Toggle Symptom Chip
  const toggleSymptom = (symName) => {
    setSelectedSymptoms(prev => 
      prev.includes(symName) 
        ? prev.filter(s => s !== symName)
        : [...prev, symName]
    );
  };

  // Save User Profile to SQLite Database
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const updated = {
      name: userName,
      phone,
      age: Number(age),
      gender,
      locationName,
      latitude,
      longitude,
      gpsAccuracy
    };

    onUpdateUser(updated);
    try {
      await api.saveUserProfile(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {}
  };

  // Submit Health Problem to SQLite Database
  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    if (!healthProblem.trim()) {
      alert(isHi ? 'कृपया अपनी समस्या लिखें।' : 'Please describe your health problem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userName,
        phone,
        locationName,
        latitude,
        longitude,
        healthProblem,
        severity,
        symptoms: selectedSymptoms,
        vitals: {
          temperatureF: temperatureF ? `${temperatureF}°F` : '102°F',
          recordedAt: new Date().toISOString()
        },
        assignedDoctorName: 'Dr. Manish Singh, MD'
      };

      const res = await api.submitUserComplaint(payload);
      if (res?.complaint) {
        setRecentComplaint(res.complaint);
        setHealthProblem('');
        // Reload list
        loadComplaints();

        // Audio success chime
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to register complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-950">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Verified Patient Profile
                </span>
                <span className="text-xs text-blue-300 font-mono font-semibold">
                  SQLite Database Synced
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {userName} &bull; <span className="text-emerald-400 font-mono text-sm">{phone}</span>
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{locationName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950 active:scale-95 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? (isHi ? 'GPS खोज रहा है...' : 'Detecting GPS...') : (isHi ? '📍 लाइव GPS अपडेट करें' : '📍 Auto-Detect My GPS')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile & Location Config */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>{isHi ? 'मरीज प्रोफ़ाइल एवं लोकेशन' : 'Patient Credentials & Location'}</span>
              </h3>
              {profileSaved && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to DB!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {isHi ? 'आपका पूरा नाम:' : 'Your Full Name:'}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Manish Singh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {isHi ? 'मोबाइल नंबर:' : 'Mobile Number:'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 7061496748"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isHi ? 'उम्र (वर्ष):' : 'Age:'}</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isHi ? 'लिंग:' : 'Gender:'}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Location Details */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>{isHi ? 'वर्तमान लोकेशन:' : 'Current Location:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>Auto-Detect</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Chanderi, MP or Your City / Village"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                />

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Lat: <strong className="text-emerald-400">{latitude}</strong></div>
                  <div>Lng: <strong className="text-emerald-400">{longitude}</strong></div>
                  {gpsAccuracy && (
                    <div className="col-span-2 text-sky-400">GPS Accuracy: &plusmn;{gpsAccuracy}m</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-blue-950"
              >
                {isHi ? 'प्रोफ़ाइल डेटाबेस में सुरक्षित करें' : 'Save & Sync Profile to Database'}
              </button>
            </form>
          </div>

          {/* Assigned On-Call Tele-Doctor Badge */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
              PRIMARY EMERGENCY DOCTOR ASSIGNED
            </span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center font-bold text-white text-base">
                👨‍⚕️
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Dr. Manish Singh, MD</h4>
                <p className="text-xs text-slate-400">Senior Emergency Intensivist</p>
                <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
                  Direct Hotline: +91 7061496748
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('tele')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Video className="w-4 h-4" />
              <span>Connect Video Call with Dr. Manish</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Health Problem Submission & Medical Records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Submission Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-base">
                  {isHi ? 'अपनी स्वास्थ्य समस्या दर्ज करें (डेटाबेस में सेव होगी)' : 'Report Your Medical Problem (Saves to Database with Name)'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Logged In: <strong className="text-white">{userName}</strong>
              </span>
            </div>

            {/* Success notification banner after submission */}
            {recentComplaint && (
              <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-4 space-y-2 animate-fadeIn text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Case #{recentComplaint.id} Registered Successfully in SQLite!</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    STATUS: {recentComplaint.status}
                  </span>
                </div>
                <p className="text-slate-300">
                  Recorded for <strong className="text-white">{recentComplaint.user_name}</strong> at <strong className="text-white">{recentComplaint.location_name}</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab('tele')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Call Dr. Manish Singh Now</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('copilot')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI Copilot for First-Aid</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitProblem} className="space-y-4 text-xs">
              {/* Problem Description Textarea */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  {isHi ? 'अपनी समस्या का विवरण लिखें (उदा. 102 बुखार, चक्कर, या चोट):' : 'Describe your medical issue / symptoms:'}
                </label>
                <textarea
                  rows="3"
                  value={healthProblem}
                  onChange={(e) => setHealthProblem(e.target.value)}
                  placeholder={
                    isHi
                      ? 'उदा. मुझे कल रात से 102 डिग्री तेज बुखार है, साथ में सिरदर्द और कंपकंपी हो रही है...'
                      : 'e.g. I have a 102 degree high fever with shivering, headache, and severe body pain since last night...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {/* Urgency / Severity Selector */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  {isHi ? 'गंभीरता स्तर (Urgency Level):' : 'Select Urgency / Severity Level:'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSeverity('NORMAL')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      severity === 'NORMAL'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    🟢 {isHi ? 'सामान्य' : 'Normal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('URGENT')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      severity === 'URGENT'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    🟡 {isHi ? 'गंभीर (Urgent)' : 'Urgent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('CRITICAL_EMERGENCY')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      severity === 'CRITICAL_EMERGENCY'
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950 animate-pulse'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    🔴 {isHi ? 'आपातकालीन' : 'Critical ER'}
                  </button>
                </div>
              </div>

              {/* Quick Symptom Chips */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  {isHi ? 'लक्षण चुनें (त्वरित चयन):' : 'Select Key Symptoms:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSymptoms.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym.name);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => toggleSymptom(sym.name)}
                        className={`px-3 py-1.5 rounded-xl border transition text-xs font-semibold ${
                          isSelected
                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sym.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Temperature / Vitals Input */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">
                    {isHi ? 'शरीर का तापमान (°F):' : 'Body Temperature (°F):'}
                  </label>
                  <input
                    type="text"
                    value={temperatureF}
                    onChange={(e) => setTemperatureF(e.target.value)}
                    placeholder="102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">
                    {isHi ? 'स्थान (GPS / पता):' : 'Tagged Location:'}
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    readOnly
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !healthProblem.trim()}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-xl shadow-red-950 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting 
                    ? (isHi ? 'डेटाबेस में दर्ज हो रहा है...' : 'Saving to Database...') 
                    : (isHi ? `समस्या सुरक्षित करें (${userName} के नाम से)` : `Submit Problem to Database as "${userName}"`)}
                </span>
              </button>
            </form>
          </div>

          {/* SQLite Complaints History for This User */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  {isHi ? `${userName} के पूर्व दर्ज केस (SQLite Records)` : `Complaints History Recorded for ${userName}`}
                </h3>
              </div>
              <button
                onClick={loadComplaints}
                className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {complaintHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800/60">
                {isHi ? 'कोई पूर्व दर्ज केस नहीं है। ऊपर फॉर्म भरकर अपनी समस्या सबमिट करें।' : 'No complaints registered yet. Submit your problem above to save your first case in SQLite!'}
              </div>
            ) : (
              <div className="space-y-3">
                {complaintHistory.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          #{c.id}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          c.severity === 'CRITICAL_EMERGENCY'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : c.severity === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {c.severity}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {c.created_at}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[11px]">
                        <span>Assigned: {c.assigned_doctor_name || 'Dr. Manish Singh'}</span>
                      </div>
                    </div>

                    <p className="text-slate-200 font-medium text-xs leading-relaxed">
                      "{c.health_problem}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span>{c.location_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateTab('tele')}
                          className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Video className="w-3 h-3" />
                          <span>Call Doctor</span>
                        </button>
                        <button
                          onClick={() => onNavigateTab('copilot')}
                          className="text-purple-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Triage</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
