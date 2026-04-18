import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPerfId, setSelectedPerfId] = useState(null);
  const [ratingVal, setRatingVal] = useState(3);

  useEffect(() => {
    checkAdminStatus();
    fetchLeaderboard();
  }, [month, year]);

  const checkAdminStatus = () => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    setIsAdmin(userRole === 'admin' || userRole === 'hr');
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/performance/leaderboard?month=${month}&year=${year}`);
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaderboard = async () => {
    try {
      if (!window.confirm("Run performance calculator engine? This evaluates all tasks, attendance, and leaves for the specified month.")) return;
      setLoading(true);
      await API.post('/performance/generate', { month, year });
      alert("Scores Recalculated Successfully!");
      fetchLeaderboard();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Error calculating scores";
      alert(`Performance calculation failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const saveRating = async () => {
    try {
      await API.patch('/performance/rating', { perfId: selectedPerfId, rating: ratingVal });
      setShowRatingModal(false);
      fetchLeaderboard();
    } catch (error) {
      alert("Error updating rating");
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-md ring-2 ring-yellow-400 scale-110';
      case 2: return 'bg-gray-200 text-gray-800 border-gray-400 shadow ring-2 ring-gray-300 scale-105';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-300 shadow ring-2 ring-orange-300 scale-105';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3; // Order 2, 1, 3 for visual podium

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Filters */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Performance Leaderboard</h1>
            <p className="text-gray-500 mt-1">Metrics scaled across Attendance (40%), Tasks (30%), Leaves (15%), HR Rating (15%).</p>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold" />
            </div>
            {isAdmin && (
               <button onClick={calculateLeaderboard} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold shadow-sm transition-all duration-200">
                ⚡ Recalculate Engine
              </button>
            )}
          </div>
        </div>

        {/* Podium Highlight */}
        {!loading && top3.length > 0 && (
          <div className="flex justify-center items-end h-64 space-x-4 mb-12">
            {podiumOrder.map((performer) => {
               const isFirst = performer.rank === 1;
               return (
                 <div key={performer._id} className={`flex flex-col items-center transition-all ${isFirst ? 'z-10 -mt-8' : 'opacity-90'}`}>
                   <div className="relative mb-4">
                     <span className={`absolute -top-6 -right-4 text-4xl ${isFirst?'block':'hidden'}`}>👑</span>
                     <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 font-black text-2xl ${getRankBadge(performer.rank)}`}>
                        {performer.rank === 1 ? '1st' : performer.rank === 2 ? '2nd' : '3rd'}
                     </div>
                   </div>
                   <div className={`bg-white rounded-t-xl shadow-lg border border-slate-200 w-44 flex flex-col items-center justify-start p-4 ${isFirst ? 'h-48' : performer.rank === 2 ? 'h-40 bg-slate-50' : 'h-32 bg-slate-100'}`}>
                     <span className="font-bold text-slate-900 text-center leading-tight truncate w-full">{performer.employeeId?.name || "Unknown"}</span>
                     <span className={`font-black mt-2 ${isFirst ? 'text-indigo-600 text-3xl' : 'text-slate-700 text-xl'}`}>{performer.finalScore.toFixed(0)}</span>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Points</span>
                   </div>
                 </div>
               )
            })}
          </div>
        )}

        {/* Full Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Final Score</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance (40%)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks (30%)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Leaves (15%)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">HR Rating (15%)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center p-8 text-slate-500 font-medium">Running Matrix calculations...</td></tr>
              ) : leaderboard.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-8 text-slate-500 font-medium">No performance data found. Admins must hit Recalculate Engine first.</td></tr>
              ) : leaderboard.map(entry => (
                <tr key={entry._id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-black text-slate-400 text-lg">#{entry.rank}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{entry.employeeId?.name || "Unknown"}</p>
                    <div className="flex gap-1 mt-1">
                      {entry.bonusesApplied.length > 0 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-bold uppercase" title={entry.bonusesApplied.join(', ')}>Bonuses Applied</span>}
                      {entry.penaltiesApplied.length > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-bold uppercase" title={entry.penaltiesApplied.join(', ')}>Penalties Applied</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xl font-black text-indigo-600">{entry.finalScore.toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-sm font-semibold">{entry.attendanceScore.toFixed(0)}</span>
                     <span className="text-xs text-slate-400 block">{entry.breakdown.presentDays}/{entry.breakdown.workingDays} P</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-sm font-semibold">{entry.taskScore.toFixed(0)}</span>
                     <span className="text-xs text-slate-400 block">{entry.breakdown.completedTasks}/{entry.breakdown.totalTasks} Done</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-sm font-semibold">{entry.leaveScore.toFixed(0)}</span>
                     <span className="text-xs text-slate-400 block">LWP: {entry.breakdown.lwpLeaves}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-amber-500">★ {entry.hrRating}</span>
                      {isAdmin && (
                        <button onClick={() => { setSelectedPerfId(entry._id); setRatingVal(entry.hrRating); setShowRatingModal(true); }} className="text-xs text-indigo-600 hover:underline font-semibold">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

      </div>

      {/* Admin HR Rating Modal */}
      {showRatingModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-2">Adjust HR Rating</h3>
             <p className="text-xs text-gray-500 mb-6">Ratings account for 15% of the overall final score trajectory.</p>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Star Rating (1-5)</label>
                  <input type="range" min="1" max="5" step="1" value={ratingVal} onChange={e => setRatingVal(Number(e.target.value))} className="w-full accent-indigo-600" />
                  <div className="text-center mt-2 text-3xl font-black text-amber-500">
                    {'★'.repeat(ratingVal)}{'☆'.repeat(5-ratingVal)}
                  </div>
               </div>
               <div className="flex space-x-3 pt-4 border-t border-slate-100">
                 <button onClick={() => setShowRatingModal(false)} className="flex-1 px-4 py-2 bg-gray-100 font-semibold text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200">Cancel</button>
                 <button onClick={saveRating} className="flex-1 px-4 py-2 bg-indigo-500 font-semibold text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 shadow-sm">Save Map</button>
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default Leaderboard;
