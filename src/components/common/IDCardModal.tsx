import React, { useRef } from 'react';
import { X, Printer, Download, BookOpen, Phone, Mail, MapPin, Calendar, Armchair, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  idCardData: {
    student: {
      id: string;
      idCardNumber: string;
      name: string;
      phone: string;
      classCourse?: string;
      address?: string;
      photo?: string;
      parentName?: string;
      parentPhone?: string;
      aadharNumber?: string;
      dateOfBirth?: string;
      gender?: string;
      planName?: string;
      planStartDate?: string;
      planEndDate?: string;
    };
    library: {
      organizationName: string;
      phone?: string;
      email?: string;
      whatsappNumber?: string;
      branchName?: string;
      branchAddress?: string;
      branchPhone?: string;
      branchEmail?: string;
    };
    seat?: {
      seatNumber?: string;
    };
    batch?: {
      name?: string;
      timing?: string;
    };
  } | null;
}

export const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, idCardData }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !idCardData) return null;

  const { student, library, seat, batch } = idCardData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-ios-blue text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Identity Card</h3>
              <p className="text-[11px] text-slate-500">Official Library Membership Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ID Card Container */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {/* THE ID CARD */}
          <div
            id="printable-id-card"
            ref={cardRef}
            className="w-full max-w-[340px] rounded-2xl bg-white border-2 border-slate-300 shadow-xl overflow-hidden relative text-slate-900 select-none print:shadow-none print:border-black print:max-w-none"
            style={{ minHeight: '520px' }}
          >
            {/* Top Library Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-3.5 text-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <BookOpen className="w-4 h-4 text-sky-200" />
                <h2 className="text-sm font-black tracking-wide uppercase line-clamp-1">
                  {library.organizationName}
                </h2>
              </div>
              <p className="text-[10px] text-blue-100 font-medium line-clamp-1">
                {library.branchName || 'Main Study Centre'}
              </p>
              {library.branchAddress && (
                <p className="text-[9px] text-blue-200/90 line-clamp-1 flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {library.branchAddress}
                </p>
              )}
            </div>

            {/* Accent Line */}
            <div className="h-1 bg-amber-400 w-full" />

            {/* Student Info Body */}
            <div className="p-4 flex flex-col items-center text-center">
              {/* Photo Frame */}
              <div className="w-24 h-28 rounded-xl bg-slate-100 border-2 border-ios-blue/40 shadow-sm overflow-hidden flex items-center justify-center mb-2.5 relative">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <UserIcon className="w-10 h-10 mb-1" />
                    <span className="text-[9px] font-bold">NO PHOTO</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold py-0.5">
                  STUDENT
                </div>
              </div>

              {/* Student Name & ID */}
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {student.name}
              </h3>
              <div className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                ID: {student.idCardNumber}
              </div>

              {student.classCourse && (
                <p className="text-[11px] font-bold text-ios-blue mt-1">
                  {student.classCourse}
                </p>
              )}

              {/* Seat & Batch Highlights */}
              <div className="grid grid-cols-2 gap-2 w-full mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-purple-100 text-purple-700">
                    <Armchair className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold">SEAT NO.</span>
                    <span className="text-xs font-black text-slate-900">
                      {seat?.seatNumber ? `Desk ${seat.seatNumber}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-amber-100 text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold">SESSION BATCH</span>
                    <span className="text-[11px] font-bold text-slate-900 line-clamp-1">
                      {batch?.name || 'Full Day'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Fields */}
              <div className="w-full mt-2.5 space-y-1 text-[10px] text-left border-t border-slate-100 pt-2 text-slate-700 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold">{student.phone}</span>
                </div>
                {student.parentName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parent / Guardian:</span>
                    <span className="font-bold">{student.parentName} ({student.parentPhone})</span>
                  </div>
                )}
                {student.aadharNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aadhar No:</span>
                    <span className="font-mono">XXXX-XXXX-{student.aadharNumber.slice(-4)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Plan:</span>
                  <span className="font-bold text-ios-blue">{student.planName || 'Regular Plan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Till:</span>
                  <span className="font-bold text-rose-600">
                    {student.planEndDate ? new Date(student.planEndDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Barcode Graphic Representation */}
              <div className="w-full mt-3 pt-2 border-t border-slate-200 flex flex-col items-center">
                <div className="h-7 w-44 flex items-center justify-between gap-[2px]">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 1, 2, 3, 4, 1, 2].map((w, i) => (
                    <div
                      key={i}
                      className="h-full bg-slate-900"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-slate-500 mt-0.5">
                  *{student.idCardNumber}*
                </span>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="bg-slate-100 px-3 py-1.5 border-t border-slate-200 text-[9px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 text-ios-blue" />
                {library.branchPhone || library.phone}
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="w-2.5 h-2.5" /> Verified Pass
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Student ID Card</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
