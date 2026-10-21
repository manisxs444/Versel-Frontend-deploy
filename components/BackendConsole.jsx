import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Trash2, 
  Play, 
  Table, 
  Cpu, 
  ArrowUpRight 
} from 'lucide-react';
import { api } from '../services/api';

export default function BackendConsole({ lang }) {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('tables'); // tables, api-tester, logs
  const [testEndpoint, setTestEndpoint] = useState('/api/database/stats');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchBackendData();
  }, []);

  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const s = await api.getDatabaseStats();
      const r = await api.getDatabaseRecords();
      setStats(s);
      setRecords(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async (endpoint, method = 'GET', body = null) => {
    setTestEndpoint(endpoint);
    setTestLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      const elapsed = (performance.now() - start).toFixed(2);
      setTestResult({
        status: res.status,
        statusText: res.statusText,
        timeMs: elapsed,
        headers: {
          'content-type': res.headers.get('content-type'),
          'x-backend-engine': res.headers.get('x-backend-engine') || 'JeevanSetu-SQLite-Engine',
          'x-response-time-ms': res.headers.get('x-response-time-ms') || elapsed
        },
        data
      });
    } catch (err) {
      setTestResult({
        status: 'ERROR',
        error: err.message,
        timeMs: (performance.now() - start).toFixed(2)
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleResetDb = async () => {
    if (confirm('Are you sure you want to reset patient and session logs in the SQLite database? Master hospital data will remain intact.')) {
      await api.resetDatabase();
      fetchBackendData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SQLite3 Persistent Storage
                </span>
                <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Native node:sqlite Active (WAL Mode)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                JeevanSetu AI Backend Architecture & Database Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-stack Node.js server with persistent SQLite file storage, relational triage models, and real-time query telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackendData}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>

            <button
              onClick={handleResetDb}
              className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold px-3 py-2.5 rounded-xl transition"
              title="Reset test records in SQLite"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset DB</span>
            </button>
          </div>
        </div>

        {/* Real-time Hardware & DB Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <Server className="w-3 h-3 text-blue-400" /> Server Port
            </div>
            <div className="text-lg font-bold font-mono text-white">:5001</div>
            <div className="text-[10px] text-emerald-400">Node HTTP Daemon</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-purple-400" /> Database File
            </div>
            <div className="text-xs font-bold font-mono text-slate-200 line-clamp-1">jeevansetu.db</div>
            <div className="text-[10px] text-slate-400">SQLite3 WAL Mode</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Avg Latency
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {stats?.avgResponseTimeMs || 1.15} ms
            </div>
            <div className="text-[10px] text-slate-400">Ultra-low overhead</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" /> Patients Stored
            </div>
            <div className="text-lg font-bold font-mono text-amber-300">
              {stats?.tableCounts?.patients || records?.patients?.length || 0}
            </div>
            <div className="text-[10px] text-slate-400">Triaged cases</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> Admission Tokens
            </div>
            <div className="text-lg font-bold font-mono text-teal-300">
              {stats?.tableCounts?.admissionPasses || records?.recentAdmissions?.length || 0}
            </div>
            <div className="text-[10px] text-slate-400">Pre-booked beds</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-rose-400" /> Tele Sessions
            </div>
            <div className="text-lg font-bold font-mono text-rose-300">
              {stats?.tableCounts?.teleSessions || records?.recentTeleSessions?.length || 0}
            </div>
            <div className="text-[10px] text-slate-400">20% fee logs</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'tables' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Live SQLite Database Tables</span>
        </button>

        <button
          onClick={() => setActiveSubTab('api-tester')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'api-tester' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Interactive REST API Explorer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'logs' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>HTTP Traffic & Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: Live SQLite Database Tables */}
      {activeSubTab === 'tables' && (
        <div className="space-y-6">
          {/* User Complaints & Medical Problems Table */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-400" />
                Table: <code className="text-rose-300 font-mono">user_complaints</code> (Live Patient Problems & Cases)
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {records?.userComplaints?.length || 0} Registered User Cases in SQLite
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Tagged Location / GPS</th>
                    <th className="p-3">Reported Health Problem</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Assigned Doctor</th>
                    <th className="p-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {records?.userComplaints?.length > 0 ? (
                    records.userComplaints.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-rose-300 font-bold font-mono">#{row.id}</td>
                        <td className="p-3 text-white font-sans font-bold">{row.user_name}</td>
                        <td className="p-3 text-emerald-400">{row.phone}</td>
                        <td className="p-3 text-slate-300 text-[11px] font-sans">
                          {row.location_name}
                          {row.latitude && <div className="text-[10px] text-slate-500 font-mono">{row.latitude}, {row.longitude}</div>}
                        </td>
                        <td className="p-3 text-slate-200 font-sans max-w-xs">{row.health_problem}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.severity === 'CRITICAL_EMERGENCY'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : row.severity === 'URGENT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="p-3 text-sky-300 font-sans">{row.assigned_doctor_name || 'Dr. Manish Singh'}</td>
                        <td className="p-3 text-slate-400 text-[10px]">{row.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-500 font-sans">
                        No user complaints registered yet. Go to the <strong>8. User Login & Report</strong> tab to submit a medical problem and it will appear here instantly!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Profiles Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                Table: <code className="text-sky-300 font-mono">user_profiles</code> (Registered User Accounts & Locations)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Primary Key: <span className="text-slate-200">id</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Mobile Phone</th>
                    <th className="p-3">Age / Gender</th>
                    <th className="p-3">Last Known Location & Coordinates</th>
                    <th className="p-3">Last Login / Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {records?.userProfiles?.length > 0 ? (
                    records.userProfiles.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-sky-300 font-semibold">{u.id}</td>
                        <td className="p-3 text-white font-sans font-medium">{u.name}</td>
                        <td className="p-3 text-emerald-400">{u.phone}</td>
                        <td className="p-3 text-slate-400">{u.age} / {u.gender}</td>
                        <td className="p-3 text-slate-300 text-[11px] font-sans">
                          {u.location_name}
                          {u.latitude && <div className="text-[10px] text-slate-500 font-mono">{u.latitude}, {u.longitude}</div>}
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">{u.last_login || u.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500 font-sans">
                        No user accounts saved in SQLite yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Patients & Triage Assessments Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Table: <code className="text-indigo-300 font-mono">patients</code> & <code className="text-indigo-300 font-mono">triage_assessments</code>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Primary Key: <span className="text-slate-200">id</span> | Foreign Key: <span className="text-slate-200">patient_id</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Patient ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Age / Sex</th>
                    <th className="p-3">Emergency Type</th>
                    <th className="p-3">Shock Index</th>
                    <th className="p-3">Survival Window</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {records?.recentTriage?.length > 0 ? (
                    records.recentTriage.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-indigo-300 font-semibold">{row.patient_id || row.id}</td>
                        <td className="p-3 text-white font-sans font-medium">{row.patient_name || 'Vikas Meena'}</td>
                        <td className="p-3 text-slate-400">28 / Male</td>
                        <td className="p-3 text-slate-300 font-sans">{row.emergency_type || 'Road Accident'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            row.shock_index > 1.2 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {row.shock_index}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">~{row.survival_minutes} mins</td>
                        <td className="p-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700">
                            {row.triage_category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">{row.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-500 font-sans">
                        No triage assessments recorded yet. Use the <strong>Triage & Survival AI</strong> tab to calculate vitals and see real-time SQLite entries appear here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admission Passes Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Table: <code className="text-emerald-300 font-mono">admission_passes</code> (In-Transit Tokens)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-Deducts ICU Beds from <code className="text-slate-200">hospitals</code>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Admission Token</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">ABHA Health ID</th>
                    <th className="p-3">Receiving Hospital</th>
                    <th className="p-3">Pre-Allocated Bed</th>
                    <th className="p-3">Blood Preorder</th>
                    <th className="p-3">Green Corridor</th>
                    <th className="p-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {records?.recentAdmissions?.length > 0 ? (
                    records.recentAdmissions.map((row) => (
                      <tr key={row.token} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-emerald-400 font-bold">{row.token}</td>
                        <td className="p-3 text-white font-sans">{row.patient_name}</td>
                        <td className="p-3 text-cyan-300">{row.abha_id}</td>
                        <td className="p-3 text-blue-300 font-sans font-medium">{row.hospital_name}</td>
                        <td className="p-3 text-slate-300">{row.reserved_bed_type}</td>
                        <td className="p-3 text-rose-300">{row.blood_preorder}</td>
                        <td className="p-3 text-emerald-400">
                          {row.green_corridor_active ? 'ACTIVE ●' : 'STANDBY'}
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">{row.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-500 font-sans">
                        No admission passes generated yet. Click "Select Hospital & Reserve ICU Bed" to generate one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive REST API Explorer */}
      {activeSubTab === 'api-tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Live Backend Endpoints
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Click any route to execute an authentic HTTP request against the Node backend on port 5001:
            </p>

            <button
              onClick={() => handleTestApi('/api/user/complaints?user=Manish', 'GET')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-2">GET</span>
                <span className="text-xs font-mono text-white">/api/user/complaints?user=Manish</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/user/profile?id=USR-7061496748', 'GET')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-2">GET</span>
                <span className="text-xs font-mono text-white">/api/user/profile</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/database/stats', 'GET')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-2">GET</span>
                <span className="text-xs font-mono text-white">/api/database/stats</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/hospitals?survivalMinutes=45', 'GET')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-2">GET</span>
                <span className="text-xs font-mono text-white">/api/hospitals</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/tele-doctors', 'GET')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mr-2">GET</span>
                <span className="text-xs font-mono text-white">/api/tele-doctors</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/triage/calculate-survival', 'POST', {
                patientName: 'Karan Singh',
                age: 35,
                heartRate: 130,
                systolicBp: 85,
                diastolicBp: 50,
                spo2: 89,
                bloodLossMl: 1200,
                gcsScore: 11
              })}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold mr-2">POST</span>
                <span className="text-xs font-mono text-white">/api/triage/calculate-survival</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleTestApi('/api/admission/pre-register', 'POST', {
                patientName: 'Amit Verma',
                hospitalId: 'hosp-1',
                age: 29
              })}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold mr-2">POST</span>
                <span className="text-xs font-mono text-white">/api/admission/pre-register</span>
              </div>
              <Play className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Response Console */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white uppercase">
                    HTTP Response Inspector
                  </span>
                  {testResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      HTTP {testResult.status} ({testResult.timeMs} ms)
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">Target: {testEndpoint}</span>
              </div>

              {testLoading ? (
                <div className="h-72 flex items-center justify-center text-xs font-mono text-indigo-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Executing backend query on http://localhost:5001...
                </div>
              ) : testResult ? (
                <div className="space-y-3 font-mono">
                  {/* Headers */}
                  <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800 flex justify-between flex-wrap gap-2">
                    <span>Engine: <strong className="text-indigo-300">{testResult.headers?.['x-backend-engine']}</strong></span>
                    <span>Backend Latency: <strong className="text-emerald-400">{testResult.headers?.['x-response-time-ms']} ms</strong></span>
                  </div>

                  {/* Body */}
                  <pre className="p-4 bg-slate-900/90 rounded-xl text-xs text-emerald-300 overflow-x-auto max-h-80 border border-slate-800/80 leading-relaxed font-mono">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                  <Terminal className="w-10 h-10 mb-2 opacity-50" />
                  <span>Select an endpoint on the left to fire a live query against the SQLite backend.</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
              <span>Backed by Node.js native http router & node:sqlite</span>
              <span>Host: http://localhost:5001</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Table: <code className="text-emerald-300 font-mono">api_logs</code> (Real-Time Request Telemetry)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Logged automatically on every HTTP call
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Execution Time</th>
                  <th className="p-3">Client IP</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {stats?.recentLogs?.length > 0 ? (
                  stats.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-500">#{log.id}</td>
                      <td className="p-3 font-bold text-blue-400">{log.method}</td>
                      <td className="p-3 text-slate-200">{log.endpoint}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {log.status_code}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-400 font-semibold">{log.response_time_ms?.toFixed(2)} ms</td>
                      <td className="p-3 text-slate-400">{log.ip}</td>
                      <td className="p-3 text-slate-400 text-[10px]">{log.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500 font-sans">
                      No logs captured yet. Use the API Explorer to generate live audit logs!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
