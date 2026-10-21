import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Video, 
  Truck, 
  CheckCircle2, 
  HeartPulse, 
  Building2, 
  Clock, 
  Award,
  User,
  MapPin,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  RefreshCw
} from 'lucide-react';

export default function LandingPage({ 
  onSelectRole, 
  currentUser, 
  onEmergencyLogin,
  lang 
}) {
  const isHi = lang === 'hi';

  const [name, setName] = useState(currentUser?.name || '');
  const [age, setAge] = useState(currentUser?.age || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [locationName, setLocationName] = useState(currentUser?.locationName || '');
  const [latitude, setLatitude] = useState(currentUser?.latitude || 24.7180);
  const [longitude, setLongitude] = useState(currentUser?.longitude || 78.1062);
  const [isLocating, setIsLocating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Quick lookup of previously saved patient from SQLite DB
  const handleLookupDB = async () => {
    const rawPhone = prompt(isHi ? 'डेटाबेस से पुराना मरीज लोड करने के लिए मोबाइल नंबर दर्ज करें:' : 'Enter 10-digit phone number to retrieve stored patient from SQLite DB:');
    if (!rawPhone) return;
    const clean = rawPhone.replace(/[^0-9]/g, '').slice(-10);
    try {
      setIsLookingUp(true);
      const res = await api.getUserProfile('USR-' + clean);
      if (res && res.profile) {
        setName(res.profile.name || '');
        setAge(res.profile.age || '');
        setPhone(res.profile.phone || '');
        setLocationName(res.profile.location_name || '');
        if (res.profile.latitude) setLatitude(res.profile.latitude);
        if (res.profile.longitude) setLongitude(res.profile.longitude);
        alert(isHi ? `डेटाबेस से मरीज लोड किया गया: ${res.profile.name}` : `Patient data retrieved from SQLite DB: ${res.profile.name}`);
      } else {
        alert(isHi ? 'डेटाबेस में इस नंबर से कोई मरीज नहीं मिला।' : 'No patient record found in SQLite DB for this number.');
      }
    } catch {
      alert('Error querying database.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Auto-detect GPS coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert(isHi ? 'GPS सपोर्ट उपलब्ध नहीं है।' : 'Geolocation not supported by browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setLocationName(`Live GPS: ${lat}° N, ${lng}° E (Acc: ±${acc}m)`);
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleStartEmergency = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (onEmergencyLogin) {
      onEmergencyLogin({
        name,
        age: Number(age),
        phone,
        locationName,
        latitude,
        longitude
      });
    } else {
      onSelectRole('triage');
    }
  };

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center relative max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold shadow-inner">
          <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
          <span>India Rural Emergency Grid &bull; Golden Hour Triage</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
          Bridging the Gap Between <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Rural Care</span> and City Hospitals in the <span className="text-red-500 underline decoration-red-500/50 underline-offset-8">Golden Hour</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Over 60% of rural trauma patients die during blind highway transfers. LifeLink AI connects accident victims and village PHCs to city super-specialty hospitals with en-route bed booking, live telemetry, and on-call tele-intensivists.
        </p>

        {/* ================================================================ */}
        {/* EMERGENCY ACCIDENT INTAKE & LOGIN CARD (The User's First Step) */}
        {/* ================================================================ */}
        <div className="max-w-2xl mx-auto mt-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-red-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-left space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 flex items-center">
            <button
              type="button"
              onClick={handleLookupDB}
              className="bg-slate-800 hover:bg-slate-700 text-sky-400 font-mono font-bold text-[10px] px-3 py-1 border-r border-slate-700 transition cursor-pointer"
              title="Retrieve previous patient by phone from SQLite DB"
            >
              {isLookingUp ? 'Fetching...' : '🔍 Load Stored Patient'}
            </button>
            <div className="bg-red-600 text-white font-mono font-bold text-[10px] uppercase px-4 py-1 rounded-bl-xl tracking-wider animate-pulse">
              🚨 Accident Intake
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {isHi ? 'आपातकालीन मरीज लॉगिन / पंजीकरण' : 'Emergency Patient Intake & Registration'}
              </h3>
              <p className="text-xs text-slate-400">
                {isHi ? 'मरीज का नाम व स्थान दर्ज करें — यह डेटाबेस में हमेशा के लिए सुरक्षित रहेगा' : 'Enter patient name & location — stored in SQLite DB for permanent record'}
              </p>
            </div>
          </div>

          <form onSubmit={handleStartEmergency} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  {isHi ? 'मरीज का नाम (Full Name):' : 'Patient Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isHi ? "उदा. मनीष सिंह" : "e.g. Rahul Sharma"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {isHi ? 'उम्र:' : 'Age:'}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {isHi ? 'मोबाइल:' : 'Phone:'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Location with One-Click GPS Detection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{isHi ? 'दुर्घटना / वर्तमान स्थान (Nearby Location):' : 'Accident / Current Location:'}</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="text-[11px] text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : '📍 Auto-Detect Live GPS'}</span>
                </button>
              </div>

              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={isHi ? "उदा. NH-48 हाईवे, माइल 42 या जीपीएस बटन दबाएं" : "e.g. NH-48 Highway, Mile Marker 42 or click Auto-Detect GPS"}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Submit & Proceed Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm py-3.5 rounded-xl transition shadow-xl shadow-red-950 flex items-center justify-center gap-2 active:scale-95 cursor-pointer tracking-wide"
            >
              <span>{isHi ? 'लॉगिन करें एवं मेडिकल रिपोर्ट दर्ज करें' : 'Login & Submit Medical Report (Saves to DB)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Role Fast-Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onSelectRole('triage')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-red-400" /> Village Doctor Station
          </button>
          <button
            onClick={() => onSelectRole('hospitals')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Hospital Pricing &amp; ICU Beds
          </button>
          <button
            onClick={() => onSelectRole('city')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" /> Destination City ER Radar
          </button>
          <button
            onClick={() => onSelectRole('teleDoctor')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5 text-amber-400" /> E-Doctor Tele-ICU
          </button>
        </div>

        {/* Live impact strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <div className="text-2xl font-black text-sky-400">14,820+</div>
            <div className="text-xs text-slate-400 mt-1">Golden Hour Lives Saved</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <div className="text-2xl font-black text-emerald-400">&lt; 18 mins</div>
            <div className="text-xs text-slate-400 mt-1">Average Response &amp; Match</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <div className="text-2xl font-black text-amber-400">94.2%</div>
            <div className="text-xs text-slate-400 mt-1">Zero ER Wait Bed Lock</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <div className="text-2xl font-black text-purple-400">20% Cost</div>
            <div className="text-xs text-slate-400 mt-1">Rural Tele-ICU Stabilization</div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-sky-400 font-bold uppercase tracking-wider text-xs">Clinical Workflow</span>
          <h2 className="text-3xl font-extrabold text-white">How LifeLink AI Protects Every Minute</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Emergency Intake &amp; Triage</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Login immediately upon accident or trauma. Enter symptoms and vitals. AI computes your survival window and shock index in real time.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Transparent Pricing &amp; Bed Payment</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Browse available city hospitals with daily rates and deposit fees. Complete booking payment or Ayushman verification to lock your ICU bed before arrival.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Report Sent to Hospital &amp; E-Doctor</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your live report, GPS position, and booked bed pass directly into the Destination City ER Radar and E-Doctor suite for zero-wait resuscitation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
