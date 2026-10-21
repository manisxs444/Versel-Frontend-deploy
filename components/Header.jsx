import React from 'react';
import { Activity, ShieldAlert, Video, Truck, Sparkles, Globe, MapPin, Radio, Database, Home, Building2, User } from 'lucide-react';

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  lang, 
  setLang,
  currentUser,
  criticalAlert = false 
}) {
  const t = {
    en: {
      title: 'LifeLink AI',
      subtitle: 'Rural-to-Urban Emergency Referral & Tele-ICU Grid',
      phcTag: 'Chanderi Rural PHC (Hub-14)',
      teleReady: 'Tele-ICU Online (6 Docs)',
      greenCorridor: 'Green Corridor Synced',
      tabLanding: '1. Landing',
      tabTriage: '2. Village Doctor',
      tabTransit: '3. Transit & Referral',
      tabCity: '4. City Hospital',
      tabTeleDoctor: '5. E-Doctor',
      tabCopilot: '6. ✨ Google Gemini AI',
      tabBackend: '7. DB Console',
      tabUser: '8. User Login & Report'
    },
    hi: {
      title: 'जीवनसेतु AI',
      subtitle: 'ग्रामीण-शहरी आपातकालीन रेफरल एवं टेली-आईसीयू नेटवर्क',
      phcTag: 'चंदेरी प्राथमिक स्वास्थ्य केंद्र (हब-14)',
      teleReady: 'टेली-आईसीयू सक्रिय (6 विशेषज्ञ)',
      greenCorridor: 'ग्रीन कॉरिडोर लिंक',
      tabLanding: '1. मुख्य पृष्ठ',
      tabTriage: '2. ग्रामीण डॉक्टर',
      tabTransit: '3. एम्बुलेंस रेफरल',
      tabCity: '4. शहर अस्पताल',
      tabTeleDoctor: '5. ई-डॉक्टर',
      tabCopilot: '6. ✨ गूगल जेमिनी AI',
      tabBackend: '7. डेटाबेस',
      tabUser: '8. मरीज लॉगिन / समस्या'
    }
  }[lang];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      {/* Top emergency status bar */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-red-950/50 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{t.phcTag}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Dist. Civil & Apex AIIMS Trauma Corridor (NH-48)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5" />
              <span>{t.teleReady}</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.greenCorridor}</span>
            </div>

            {/* User Profile Quick Access */}
            <button
              onClick={() => setCurrentTab('user')}
              className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition font-medium ${
                currentTab === 'user'
                  ? 'bg-rose-900/60 border-rose-500 text-rose-300'
                  : currentUser?.name
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Click to open User Login & Report Problem"
            >
              <User className={`w-3.5 h-3.5 ${currentUser?.name ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="font-bold">
                {currentUser?.name 
                  ? currentUser.name 
                  : (lang === 'hi' ? '+ नया मरीज पंजीयन' : '+ New Patient Intake')}
              </span>
              {currentUser?.locationName && (
                <span className="text-slate-400 font-mono text-[10px]">
                  ({currentUser.locationName.split(',')[0]})
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-700 transition font-medium"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'English (Switch to HI)' : 'हिंदी (Switch to EN)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 rounded-2xl shadow-lg shadow-red-900/30">
            <Activity className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                {t.title}
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-mono uppercase font-bold tracking-wider">
                  Emergency Live
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Tab navigation pills */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setCurrentTab('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'landing'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            {t.tabLanding}
          </button>

          <button
            onClick={() => setCurrentTab('triage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'triage'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t.tabTriage}
          </button>

          <button
            onClick={() => setCurrentTab('transit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'transit'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            {t.tabTransit}
          </button>

          <button
            onClick={() => setCurrentTab('city')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'city'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            {t.tabCity}
          </button>

          <button
            onClick={() => setCurrentTab('tele')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'tele'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {t.tabTeleDoctor}
          </button>

          <button
            onClick={() => setCurrentTab('copilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'copilot'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            {t.tabCopilot}
          </button>

          <button
            onClick={() => setCurrentTab('backend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'backend'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-300" />
            {t.tabBackend}
          </button>

          <button
            onClick={() => setCurrentTab('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              currentTab === 'user'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5 text-rose-300" />
            {t.tabUser}
          </button>
        </nav>
      </div>
    </header>
  );
}
