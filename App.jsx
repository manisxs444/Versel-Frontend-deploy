import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import VitalsTriageForm from './components/VitalsTriageForm';
import AISurvivalMeter from './components/AISurvivalMeter';
import HospitalReferralGrid from './components/HospitalReferralGrid';
import AmbulanceInTransitHub from './components/AmbulanceInTransitHub';
import CityHospitalDashboard from './components/CityHospitalDashboard';
import TeleDoctorSuite from './components/TeleDoctorSuite';
import AICopilotChat from './components/AICopilotChat';
import BackendConsole from './components/BackendConsole';
import UserPortal from './components/UserPortal';
import { api, fallbackHospitals, fallbackDoctors, calculateLocalTriage } from './services/api';

export default function App() {
  const [lang, setLang] = useState('en'); // 100% Pure English UI by default

  // User Profile & Location State (Session only - resets on page refresh, stored permanently in SQLite DB)
  const [currentUser, setCurrentUser] = useState(null);

  const handleUpdateUser = (updated) => {
    setCurrentUser(updated);
  };

  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab')) return params.get('tab');
      if (params.get('teleRole')) return 'tele';
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['landing', 'triage', 'hospitals', 'transit', 'city', 'tele', 'copilot', 'backend', 'user'];
      if (hash && validTabs.includes(hash)) {
        return hash;
      }
    } catch {}
    return 'landing';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);

  // Sync hash with current tab & listen for hash changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('teleRole') || params.get('tab') === 'tele') {
        setCurrentTab('tele');
      } else if (params.get('tab')) {
        setCurrentTab(params.get('tab'));
      }
    } catch {}

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['landing', 'triage', 'hospitals', 'transit', 'city', 'tele', 'copilot', 'backend', 'user'];
      if (hash && validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSetTab = (tab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  // Initial vitals (Severe highway polytrauma case by default to showcase the core problem)
  const [vitals, setVitals] = useState({
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
  });

  const [triageResult, setTriageResult] = useState(null);
  const [hospitals, setHospitals] = useState(fallbackHospitals);
  const [selectedHospitalId, setSelectedHospitalId] = useState('hosp-1');
  const [doctors, setDoctors] = useState(fallbackDoctors);
  const [admissionPass, setAdmissionPass] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compute triage on mount
  useEffect(() => {
    handleCalculateTriage(vitals);
    loadHospitals(35);
  }, []);

  const handleCalculateTriage = async (currentVitals) => {
    setLoading(true);
    try {
      const res = await api.calculateSurvival(currentVitals);
      setTriageResult(res);
      loadHospitals(res.survivalMinutes);

      // Automatically sync emergency medical report with user complaints in SQLite database
      if (currentUser?.phone || currentVitals?.patientName) {
        api.submitUserComplaint({
          name: currentVitals.patientName || currentUser?.name || 'Emergency Patient',
          phone: currentUser?.phone || '+91 7061496748',
          problem: `Emergency Vitals Assessment: ${currentVitals.emergencyType || 'Severe Trauma / Accident'} | HR: ${currentVitals.heartRate} bpm, BP: ${currentVitals.systolicBp}/${currentVitals.diastolicBp}, SpO2: ${currentVitals.spo2}%, Temp: ${currentVitals.tempC}°C, Blood Loss: ${currentVitals.bloodLossMl}ml. Survival Window: ${res.survivalMinutes || 45} mins.`,
          locationName: currentUser?.locationName || 'Accident Site / PHC Hub',
          latitude: currentUser?.latitude || 24.7180,
          longitude: currentUser?.longitude || 78.1062
        }).catch(err => console.warn('Complaint auto-sync failed:', err));
      }
    } catch {
      const local = calculateLocalTriage(currentVitals);
      setTriageResult(local);
      loadHospitals(local.survivalMinutes);
    } finally {
      setLoading(false);
    }
  };

  const loadHospitals = async (survivalMins) => {
    try {
      const res = await api.getHospitals(survivalMins);
      if (res && res.hospitals) {
        setHospitals(res.hospitals);
      }
    } catch {
      // Keep fallbacks
    }
  };

  const handleSelectHospital = (hospId) => {
    setSelectedHospitalId(hospId);
  };

  const handleProceedToTransit = async (hospId, passOrReceipt = null) => {
    setSelectedHospitalId(hospId);
    if (passOrReceipt) {
      const directPass = passOrReceipt.admissionPass || passOrReceipt;
      if (directPass.token || directPass.admissionToken || directPass.id) {
        setAdmissionPass(directPass);
        setCurrentTab('transit');
        return;
      }
    }

    try {
      const pass = await api.preRegisterAdmission({
        hospitalId: hospId,
        patientName: currentUser?.name || vitals.patientName,
        age: currentUser?.age || vitals.age,
        gender: currentUser?.gender || vitals.gender,
        villageOrigin: currentUser?.locationName || 'Accident Site / PHC Hub',
        vitals
      });
      setAdmissionPass(pass);
    } catch (e) {
      console.error(e);
    }
    setCurrentTab('transit');
  };

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        criticalAlert={triageResult?.triageCategory === 'RED_EXTREME_CRITICAL'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* TAB 0: Landing Page (Emergency Intake & Login) */}
        {currentTab === 'landing' && (
          <LandingPage 
            onSelectRole={(tab) => handleSetTab(tab)}
            currentUser={currentUser}
            onEmergencyLogin={(userData) => {
              handleUpdateUser(userData);
              setVitals(v => ({
                ...v,
                patientName: userData.name,
                age: userData.age,
                location: userData.locationName
              }));
              api.saveUserProfile(userData).catch(e => console.warn('Save user error:', e));
              handleSetTab('triage');
            }}
            lang={lang}
          />
        )}

        {/* TAB 1: Triage & Survival AI (Village Doctor) */}
        {currentTab === 'triage' && (
          <div className="space-y-6">
            <VitalsTriageForm
              vitals={vitals}
              setVitals={setVitals}
              onCalculate={handleCalculateTriage}
              triageResult={triageResult}
              lang={lang}
            />

            {triageResult && (
              <AISurvivalMeter
                result={triageResult}
                onNavigateToTab={(tab) => {
                  if (tab === 'transit') {
                    handleProceedToTransit(selectedHospitalId);
                  } else {
                    setCurrentTab(tab);
                  }
                }}
                lang={lang}
              />
            )}
          </div>
        )}

        {/* TAB 2: Smart Hospital & Bed Finder */}
        {currentTab === 'hospitals' && (
          <HospitalReferralGrid
            hospitals={hospitals}
            survivalMinutes={triageResult?.survivalMinutes || 45}
            triageResult={triageResult}
            onSelectHospital={handleSelectHospital}
            selectedHospitalId={selectedHospitalId}
            onProceedToTransit={handleProceedToTransit}
            vitals={vitals}
            currentUser={currentUser}
            lang={lang}
          />
        )}

        {/* TAB 3: In-Ambulance Paperless Admission */}
        {currentTab === 'transit' && (
          <AmbulanceInTransitHub
            selectedHospital={selectedHospital}
            vitals={vitals}
            admissionPass={admissionPass}
            currentUser={currentUser}
            onGeneratePass={() => handleProceedToTransit(selectedHospitalId)}
            lang={lang}
          />
        )}

        {/* TAB 4: Destination City Hospital Dashboard */}
        {currentTab === 'city' && (
          <CityHospitalDashboard
            vitals={vitals}
            triageResult={triageResult}
            selectedHospital={selectedHospital}
          />
        )}

        {/* TAB 5: Tele-Doctor 20% Cost Plan */}
        {currentTab === 'tele' && (
          <TeleDoctorSuite
            doctors={doctors}
            vitals={vitals}
            currentUser={currentUser}
            triageResult={triageResult}
            onUpdateVitals={setVitals}
            lang={lang}
          />
        )}

        {/* TAB 5: AI Clinical Copilot */}
        {currentTab === 'copilot' && (
          <AICopilotChat
            vitals={vitals}
            onAskCopilot={api.askCopilot}
            lang={lang}
          />
        )}

        {/* TAB 6: Backend & SQLite DB Console */}
        {currentTab === 'backend' && (
          <BackendConsole lang={lang} />
        )}

        {/* TAB 7: User Login & Report Health Problem (Database Synced) */}
        {currentTab === 'user' && (
          <UserPortal
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onNavigateTab={handleSetTab}
            lang={lang}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            JeevanSetu AI &copy; 2026 | National Rural Emergency Health & Golden Hour Referral Network
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>ABDM Ayushman Bharat Linked</span>
            <span>•</span>
            <span>Green Corridor 108 Fleet Enabled</span>
            <span>•</span>
            <span>Emergency Tele-ICU Grid</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
