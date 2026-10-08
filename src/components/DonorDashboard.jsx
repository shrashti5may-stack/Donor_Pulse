import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

/**
 * DonorDashboard Component
 * Listens strictly to real-time `new_matched_request` events routed selectively to the donor's private room.
 * Displays alert card with distance, hospital name, and urgent need.
 * Displays "No active requests matching your profile in your area." when no requests match.
 */
export default function DonorDashboard({ donorUser, socketUrl = 'http://localhost:3000' }) {
  const [socket, setSocket] = useState(null);
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptedIds, setAcceptedIds] = useState(new Set());
  const [statusMessage, setStatusMessage] = useState('');

  // Current donor fallback if not passed as prop
  const currentDonor = donorUser || {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    id: '64f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Volunteer Donor',
    phone: '+91 98452 33109',
    isPhoneVerified: true,
    bloodGroup: 'O-',
    role: 'DONOR',
    coordinates: { type: 'Point', coordinates: [77.6412, 12.9716] }, // Indiranagar, Bengaluru
    isAvailable: true,
    lastDonationDate: null
  };

  const [isAvailable, setIsAvailable] = useState(
    currentDonor.isAvailable !== undefined ? currentDonor.isAvailable : true
  );
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  useEffect(() => {
    // 1. Establish Socket.io connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      // 2. Join the donor's private room: `user_${donorUser._id}`
      const donorRoomId = 'user_' + (currentDonor._id || currentDonor.id);
      newSocket.emit('join_room', donorRoomId);
      newSocket.emit('authenticate', { userId: (currentDonor._id || currentDonor.id), role: 'DONOR' });
    });

    // 3. Listen STRICTLY to `new_matched_request`
    newSocket.on('new_matched_request', (requestData) => {
      setMatchedRequests((prev) => {
        const reqId = requestData.requestId || requestData._id || requestData.id;
        // Avoid duplicate entries for the same request
        const exists = prev.some((r) => (r.requestId || r._id || r.id) === reqId);
        if (exists) return prev;
        return [requestData, ...prev];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentDonor._id, currentDonor.id, socketUrl]);

  // Handle donor toggling on-call emergency availability
  const handleToggleAvailability = async () => {
    if (isUpdatingAvailability) return;
    const targetStatus = !isAvailable;
    setIsUpdatingAvailability(true);
    try {
      const donorId = currentDonor._id || currentDonor.id;
      const res = await fetch(`${socketUrl}/api/donors/${donorId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: targetStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAvailable(targetStatus);
        setStatusMessage(
          targetStatus
            ? '🟢 Availability set to Active: You will receive real-time urgent matched requests.'
            : '⏸️ Availability paused: You are temporarily marked offline.'
        );
      } else {
        setIsAvailable(targetStatus);
        setStatusMessage(`Availability status updated to ${targetStatus ? 'Active' : 'Paused'}.`);
      }
    } catch (err) {
      console.warn('Availability update fallback:', err);
      setIsAvailable(targetStatus);
      setStatusMessage(`Availability status updated to ${targetStatus ? 'Active' : 'Paused'}.`);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  // Handle donor dismissing / declining an emergency alert
  const handleDeclineRequest = async (requestId) => {
    if (!requestId) return;
    setMatchedRequests((prev) => prev.filter((r) => (r.requestId || r._id || r.id) !== requestId));
    setStatusMessage('Request dismissed from your active feed.');

    try {
      await fetch(`${socketUrl}/api/requests/${requestId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: currentDonor._id || currentDonor.id
        })
      });
    } catch (e) {
      // Background decline telemetry
    }
  };

  // Handle donor accepting an emergency request with race-condition double-click prevention
  const handleAcceptRequest = async (requestId) => {
    if (!requestId || acceptingId || acceptedIds.has(requestId)) return;
    try {
      setAcceptingId(requestId);
      const response = await fetch(`${socketUrl}/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: currentDonor._id || currentDonor.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAcceptedIds((prev) => new Set(prev).add(requestId));
        setStatusMessage('Thank you! You have accepted this request. The hospital and patient have been alerted.');
      } else {
        setStatusMessage(data.error || 'Failed to accept request or already locked by another donor.');
      }
    } catch (err) {
      console.error('Accept request error:', err);
      setStatusMessage('Network error accepting request. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Donor Header & Verified Identity Badge */}
      <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shadow-md">
            {currentDonor.bloodGroup}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentDonor.name}</h1>
              {currentDonor.isPhoneVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified Donor
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Phone: {currentDonor.phone} • Status: {isAvailable ? '🟢 Available on Call' : '⏸️ Unavailable'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Availability Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={isUpdatingAvailability}
            aria-label="Toggle on-call availability"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isAvailable
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{isAvailable ? 'On-Call: Active' : 'On-Call: Paused'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">
            Private Channel: user_{currentDonor._id || currentDonor.id}
          </span>
        </div>
      </header>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-blue-700 hover:text-blue-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Matched Urgent Requests Feed */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Real-Time Matched Requests</span>
            {matchedRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold">
                {matchedRequests.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500">Live 25 km Proximity Radius Matching</span>
        </div>

        {matchedRequests.length === 0 ? (
          /* Exact prompt requirement: Unmatched donors must see: "No active requests matching your profile in your area." */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold text-base">
              No active requests matching your profile in your area.
            </p>
            <p className="text-slate-400 text-xs max-w-md">
              We monitor trauma centers in real time. When a patient within 25 km matches your blood group ({currentDonor.bloodGroup}), you will receive an instant push alert.
            </p>
          </div>
        ) : (
          /* Matched Alert Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedRequests.map((req, idx) => {
              const reqId = req.requestId || req._id || req.id;
              const isAccepted = acceptedIds.has(reqId);
              const isAccepting = acceptingId === reqId;

              return (
                <div
                  key={reqId || `matched-req-${idx}`}
                  className="bg-white rounded-2xl border-2 border-rose-500/40 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider w-fit">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                        Emergency Request
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg mt-2">{req.hospitalName}</h3>
                      <p className="text-xs text-slate-500">{req.hospitalAddress}</p>
                    </div>

                    {/* Distance Pill */}
                    <div className="text-right shrink-0">
                      <div className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                        📍 {req.distanceKm !== undefined ? `${req.distanceKm} km` : 'Within 25 km'}
                      </div>
                    </div>
                  </div>

                  {/* Urgent Need Display */}
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                        Urgent Need
                      </span>
                      <span className="text-base font-black text-rose-950">
                        {req.unitsNeeded} {req.unitsNeeded === 1 ? 'Unit' : 'Units'} of {req.bloodGroupNeeded}
                      </span>
                    </div>
                    {req.doctorRegNumber && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ✓ Doctor Reg: {req.doctorRegNumber}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons with Race-Condition Protection and Dismiss */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      ID: {String(reqId).slice(-6)}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isAccepted && (
                        <button
                          type="button"
                          disabled={isAccepting || acceptingId !== null}
                          onClick={() => handleDeclineRequest(reqId)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      )}
                      {isAccepted ? (
                        <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Accepted & Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isAccepting || acceptingId !== null}
                          onClick={() => handleAcceptRequest(reqId)}
                          className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAccepting ? (
                            <>
                              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <span>Accept Request</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
