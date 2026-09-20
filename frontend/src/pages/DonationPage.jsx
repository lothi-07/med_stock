import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Gift,
  CheckCircle2,
  Building2,
  Clock,
  Send,
  PackageCheck,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { donationService, batchService } from '../services/api';
import { DonationStatusBadge, ExpiryBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const DonationPage = () => {
  const { user, isNgo, isPharmacy } = useAuth();

  const [availableDonations, setAvailableDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedBatchForDonation, setSelectedBatchForDonation] = useState(null);
  const [selectedDonationForClaim, setSelectedDonationForClaim] = useState(null);

  // Form states
  const [donateQty, setDonateQty] = useState(10);
  const [donateNotes, setDonateNotes] = useState('Free surplus for community health camp');
  const [claimQty, setClaimQty] = useState(5);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDonations = async () => {
    try {
      setLoading(true);
      const [avail, my, expiring] = await Promise.all([
        donationService.listAvailable().catch(() => []),
        donationService.listOrgDonations().catch(() => []),
        batchService.getExpiring(45).catch(() => []),
      ]);

      setAvailableDonations(avail || []);
      setMyDonations(my || []);
      setExpiringBatches(expiring || []);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [user]);

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    if (!selectedBatchForDonation) return;
    setErrorMsg('');
    try {
      await donationService.createDonation({
        batch_id: selectedBatchForDonation.id,
        medicine_name: selectedBatchForDonation.medicine_name,
        qty_available: donateQty,
        notes: donateNotes,
      });
      setSuccessMsg(`Listed ${donateQty} units of ${selectedBatchForDonation.medicine_name} for NGO donation!`);
      setIsDonateModalOpen(false);
      loadDonations();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to list donation');
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!selectedDonationForClaim) return;
    setErrorMsg('');
    try {
      await donationService.claimDonation(selectedDonationForClaim.id, claimQty);
      setSuccessMsg(`Successfully claimed ${claimQty} units for ${user?.org_name}!`);
      setIsClaimModalOpen(false);
      loadDonations();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to claim donation');
    }
  };

  const handleUpdateStatus = async (donationId, status) => {
    try {
      await donationService.updateStatus(donationId, status);
      setSuccessMsg(`Donation status updated to ${status}`);
      loadDonations();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update status');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-indigo-400" />
            Surplus Medicine Donation Network
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect pharmacies with verified NGOs to repurpose safe near-expiry medicines for community relief camps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Viewing as: {user?.org_name} ({user?.org_type?.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pharmacy Perspective: Donate near-expiry batches */}
      {isPharmacy && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                Near-Expiry Stock Eligible for NGO Donation
              </h3>
              <p className="text-xs text-slate-400">
                Stock with less than 45 days of shelf life. Donate to community health camps to prevent disposal waste.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringBatches.length > 0 ? (
              expiringBatches.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{b.medicine_name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">Batch: {b.batch_no}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <ExpiryBadge days={b.days_to_expiry} status={b.expiry_status} />
                      <span className="text-xs text-slate-400">Stock: {b.qty_on_hand}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBatchForDonation(b);
                      setDonateQty(Math.min(b.qty_on_hand, 20));
                      setIsDonateModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>List for Donation</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-xs text-slate-500">
                No near-expiry inventory needing immediate donation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NGO Marketplace: Available donations */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Live Surplus Donations Marketplace
            </h3>
            <p className="text-xs text-slate-400">
              Medicines available from participating pharmacies ready for NGO collection.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Medicine</th>
                <th className="px-6 py-3.5">Donor Pharmacy</th>
                <th className="px-6 py-3.5">Expiry Date</th>
                <th className="px-6 py-3.5 text-center">Available Units</th>
                <th className="px-6 py-3.5">Notes</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {availableDonations.length > 0 ? (
                availableDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-bold text-white">{d.medicine_name}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.donor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{d.expiry_date}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-400">
                      {d.qty_available}
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic">{d.notes || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {isNgo ? (
                        <button
                          onClick={() => {
                            setSelectedDonationForClaim(d);
                            setClaimQty(d.qty_available);
                            setIsClaimModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow-sm transition"
                        >
                          Claim for Camp
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Available to NGOs</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No donations currently waiting in the marketplace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation Pipeline Tracker */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-teal-400" />
          My Organization's Donation Activity & Pipeline
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Medicine</th>
                <th className="px-6 py-3.5">Donor</th>
                <th className="px-6 py-3.5">Recipient NGO</th>
                <th className="px-6 py-3.5 text-center">Claimed Qty</th>
                <th className="px-6 py-3.5 text-center">Pipeline Status</th>
                <th className="px-6 py-3.5 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {myDonations.length > 0 ? (
                myDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-semibold text-white">{d.medicine_name}</td>
                    <td className="px-6 py-4 text-slate-300">{d.donor_name}</td>
                    <td className="px-6 py-4 text-slate-300">{d.claimer_name || 'Awaiting Claim'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-200">
                      {d.qty_claimed} / {d.qty_available}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DonationStatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.status === 'claimed' && (
                          <button
                            onClick={() => handleUpdateStatus(d.id, 'picked')}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold"
                          >
                            Mark Picked Up
                          </button>
                        )}
                        {d.status === 'picked' && (
                          <button
                            onClick={() => handleUpdateStatus(d.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">
                    No active donation history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donate Modal */}
      {isDonateModalOpen && selectedBatchForDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Donate Surplus Medicine</h3>
                <p className="text-xs text-emerald-400">{selectedBatchForDonation.medicine_name}</p>
              </div>
              <button onClick={() => setIsDonateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantity to Donate (Max: {selectedBatchForDonation.qty_on_hand})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedBatchForDonation.qty_on_hand}
                  value={donateQty}
                  onChange={(e) => setDonateQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={donateNotes}
                  onChange={(e) => setDonateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Confirm & List on Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && selectedDonationForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Claim Donation for NGO</h3>
                <p className="text-xs text-indigo-400">{selectedDonationForClaim.medicine_name}</p>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaim} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Claim Quantity (Available: {selectedDonationForClaim.qty_available})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDonationForClaim.qty_available}
                  value={claimQty}
                  onChange={(e) => setClaimQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Confirm Claim & Reserve for Pickup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
