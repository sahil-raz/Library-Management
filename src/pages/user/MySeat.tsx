import React, { useEffect, useState } from 'react';
import { Armchair, Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';

export const MySeat: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; dashboard: any }>('/user/dashboard')
      .then((res) => {
        if (res.success) setData(res.dashboard);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const seat = data?.seat;
  const branch = data?.branch;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="My Seat" subtitle="Desk & Study Spot Details" showBack />

      <div className="p-4 flex flex-col gap-4">
        {seat ? (
          <>
            <SpotlightCard className="bg-gradient-to-br from-purple-700 to-indigo-900 text-white border-none shadow-ios-lg text-center py-8">
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-200">
                Allocated Seat Number
              </span>
              <div className="text-5xl font-black text-white tracking-tight my-2">
                {seat.seatNumber}
              </div>
              <div className="inline-flex mt-2">
                <PulseBadge status="ASSIGNED" size="sm" />
              </div>
            </SpotlightCard>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-900">Branch & Timetable</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Branch Name</span>
                  <strong className="text-slate-800">{branch?.name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Opening Hours</span>
                  <span className="font-semibold text-slate-700">
                    {branch?.openingTime} - {branch?.closingTime}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Address</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[200px]">
                    {branch?.address}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Staff Support</span>
                  <span className="font-semibold text-slate-700">{branch?.phone}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Armchair className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Seat Allocated Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
              Once you have an active membership, your branch manager will reserve your desk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
