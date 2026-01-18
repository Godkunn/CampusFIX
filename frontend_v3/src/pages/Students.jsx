import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import { ShieldCheck, AlertTriangle, User, Search, RefreshCw, UserX } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  // 🔒 Reset scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🍞 Toast System: Atomic updates + Timer Cleanup
  const showToast = useCallback((type, message) => {
    setToast(prev => {
      // If a toast is already active, clear its timer to prevent early dismissal
      if (prev?._id) clearTimeout(prev._id);
      
      const id = setTimeout(() => setToast(null), 3000);
      return { type, message, _id: id };
    });
  }, []);

  // Safety: Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      setToast(current => {
        if (current?._id) clearTimeout(current._id);
        return null;
      });
    };
  }, []);

  // 1️⃣ Pure Fetch Function (Manual Refresh)
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/all');
      setStudents(res.data);
    } catch (err) {
      console.error("Database Fetch Error:", err);
      showToast('error', "Failed to connect to database");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // 2️⃣ Unmount-Safe Initial Load
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/all');
        if (isMounted) setStudents(res.data);
      } catch (err) {
        if (isMounted) {
          console.error("Database Fetch Error:", err);
          showToast('error', "Failed to connect to database");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => { isMounted = false; };
  }, [showToast]);

  // 🔍 Safe, Case-Insensitive Search
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return students;

    return students.filter(s => 
      (s.full_name || "").toLowerCase().includes(term) || 
      (s.enrollment_no || "").toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const handleRequest = async (id, action) => {
    try {
      await api.post(`/users/${id}/manage-hostel`, { action });
      showToast('success', `Request ${action}ed successfully`);
      loadStudents(); 
    } catch {
      showToast('error', "Action failed");
    }
  };

  const getTrustColor = (score) => {
    if (score >= 10) return '#22c55e'; // Green
    if (score >= 5) return '#3b82f6';  // Blue
    if (score >= 0) return '#eab308';  // Yellow
    return '#ef4444';                  // Red
  };

  return (
    <div className="students-page fade-in">
      <style>{`
        .students-page { width: 100%; max-width: 1200px; margin: 0 auto; padding: clamp(8px, 2vw, 20px); box-sizing: border-box; }
        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border-radius: clamp(12px, 3vw, 20px); padding: clamp(12px, 4vw, 24px); box-shadow: 0 8px 32px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.4); }
        
        .controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .search-box input { background: transparent; border: none; outline: none; width: 100%; font-size: 0.9rem; }
        
        /* Desktop Table */
        .desktop-table { display: none; width: 100%; border-collapse: collapse; }
        .desktop-table th { text-align: left; padding: 12px; color: #64748b; font-size: 0.8rem; border-bottom: 2px solid #f1f5f9; }
        .desktop-table td { padding: 12px; border-bottom: 1px solid #f8fafc; font-size: 0.9rem; }
        
        /* Mobile Cards */
        .mobile-cards { display: flex; flex-direction: column; gap: 12px; }
        .student-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        
        /* Media Queries */
        @media (min-width: 768px) { .desktop-table { display: table; } .mobile-cards { display: none; } }
        
        /* Nano/Micro Phone Tweaks */
        @media (max-width: 350px) { 
          .glass-panel { padding: 8px; } 
          .font-nano { font-size: 0.65rem !important; } 
          .btn-nano { padding: 4px 6px !important; font-size: 0.6rem !important; } 
        }

        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; }
        .btn-action { border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 4px; }
        
        .toast-notif { position: fixed; top: 20px; right: 20px; z-index: 10000; background: white; padding: 12px 24px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); animation: slideIn 0.3s ease; border-left: 5px solid; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notif" style={{ borderLeftColor: toast.type === 'success' ? '#10b981' : '#ef4444' }}>
          {toast.message}
        </div>
      )}

      <div className="glass-panel">
        <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', color: '#1e293b', marginBottom: '15px' }}>
          🎓 Registered Students
        </h2>

        {/* Controls */}
        <div className="controls">
          <div className="search-box">
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Search Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* 🛡️ Spam Prevention: Button disabled while loading */}
          <button 
            onClick={() => !loading && loadStudents()} 
            className="btn-action" 
            style={{ background: '#e0e7ff', color: '#4338ca', opacity: loading ? 0.7 : 1 }} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '10px' }} />
            <div>Syncing with Neon Database...</div>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <UserX size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <div>No students found matching "{searchTerm}"</div>
              </div>
            ) : (
              <>
                {/* 🖥️ Desktop View */}
                <table className="desktop-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Trust Score</th>
                      <th>Enrollment</th>
                      <th>Hostel</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4f46e5' }}>
                              {s.full_name ? s.full_name.charAt(0) : '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{s.full_name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="badge" style={{ border: `1px solid ${getTrustColor(s.credit_score || 0)}`, color: getTrustColor(s.credit_score || 0) }}>
                            {s.credit_score < 0 ? <AlertTriangle size={12}/> : <ShieldCheck size={12}/>} {s.credit_score || 0}
                          </div>
                        </td>
                        <td>{s.enrollment_no || '-'}</td>
                        <td>{s.hostel ? `${s.hostel}-${s.room_no}` : <span style={{color:'#cbd5e1'}}>None</span>}</td>
                        <td>
                          {s.requested_hostel ? (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleRequest(s.id, 'approve')} className="btn-action" style={{ background: '#dcfce7', color: '#166534' }}>✓</button>
                              <button onClick={() => handleRequest(s.id, 'reject')} className="btn-action" style={{ background: '#fee2e2', color: '#991b1b' }}>✗</button>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 📱 Mobile/Nano View */}
                <div className="mobile-cards">
                  {filteredStudents.map(s => (
                    <div key={s.id} className="student-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <User size={16} color="#4f46e5" />
                          <span style={{ fontWeight: '700' }} className="font-nano">{s.full_name}</span>
                        </div>
                        <div className="badge font-nano" style={{ border: `1px solid ${getTrustColor(s.credit_score || 0)}`, color: getTrustColor(s.credit_score || 0) }}>
                          {s.credit_score || 0}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }} className="font-nano">
                        <div>ID: {s.enrollment_no || 'N/A'}</div>
                        <div>Hostel: {s.hostel ? `${s.hostel}-${s.room_no}` : 'Not Assigned'}</div>
                      </div>

                      {s.requested_hostel && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#b45309', marginBottom: '8px' }}>Req: {s.requested_hostel}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleRequest(s.id, 'approve')} className="btn-action btn-nano" style={{ flex: 1, background: '#22c55e', color: 'white', justifyContent: 'center' }}>Approve</button>
                            <button onClick={() => handleRequest(s.id, 'reject')} className="btn-action btn-nano" style={{ flex: 1, background: '#ef4444', color: 'white', justifyContent: 'center' }}>Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}