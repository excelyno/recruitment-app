import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, UserX } from 'lucide-react';
import { useOutletContext } from "react-router-dom";
import { useApplicants } from "../context/ApplicantContext";

// --- 1. KOMPONEN BARIS TABEL (RESPONSIVE CARD/ROW) ---
const ApplicantRow = memo(({ app, getStatusColor, onViewDetails }) => {

    // Hitung rata-rata
    const calculateAverage = (nilaiObj) => {
        if (!nilaiObj) return 0;
        const values = Object.values(nilaiObj).filter(v => !isNaN(parseInt(v)));
        if (values.length === 0) return 0;
        const total = values.reduce((acc, curr) => acc + parseInt(curr), 0);
        return Math.round(total / values.length);
    };

    return (
        <tr className="
            group transition-all duration-200
            /* MOBILE: Tampilan Card */
            flex flex-col relative
            bg-white rounded-2xl border border-slate-200 shadow-sm mb-4
            
            /* DESKTOP: Tampilan Table Row Normal */
            md:table-row md:bg-transparent md:rounded-none md:border-0 md:border-b md:shadow-none md:mb-0 md:hover:bg-slate-50
        ">
            {/* Nama & Prodi */}
            <td className="p-5 md:p-6 md:pl-8 border-b md:border-none border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-bold text-sm border border-sage-200 shrink-0">
                        {app.nama ? app.nama.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-slate-800 text-base">{app.nama}</div>
                            {/* Status Badge untuk Mobile (Muncul di pojok kanan atas kartu) */}
                            <span className={`md:hidden text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border ${getStatusColor(app.status)}`}>
                                {app.status || 'pending'}
                            </span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">
                            {app.prodi}
                        </div>
                    </div>
                </div>
            </td>

            {/* Kontak */}
            <td className="px-5 py-3 md:p-6 md:table-cell">
                <div className="flex md:block items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium uppercase md:hidden">WhatsApp</span>
                    <a
                        href={`https://wa.me/${app.whatsapp ? app.whatsapp.replace(/\D/g, '') : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sage-600 hover:text-sage-800 font-bold text-xs transition-colors bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-full border border-sage-200 w-fit"
                    >
                        <Phone className="w-3 h-3" />
                        {app.whatsapp || '-'}
                    </a>
                </div>
            </td>

            {/* Rata-rata Nilai */}
            <td className="px-5 py-3 md:p-6 md:text-center font-bold text-slate-700 md:table-cell">
                <div className="flex md:block items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium uppercase md:hidden">Avg. Score</span>
                    <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-200">
                        {calculateAverage(app.nilai)}
                    </div>
                </div>
            </td>

            {/* Status Badge (Desktop Only - karena di mobile sudah ditaruh di atas) */}
            <td className="p-6 text-center hidden md:table-cell">
                <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(app.status)}`}>
                    {app.status || 'pending'}
                </span>
            </td>
        </tr>
    );
});

// --- 2. KOMPONEN UTAMA ---
export default function DivisionList() {
    const { userRole } = useOutletContext();
    const { applicants, loading } = useApplicants();
    const [activeTab, setActiveTab] = useState("pending");

    // --- 3. OPTIMASI FILTER DENGAN USEMEMO ---
    const filteredData = useMemo(() => {
        return applicants.filter(app => {
            const matchRole = (userRole && userRole !== 'superadmin')
                ? app.divisi === userRole
                : true;

            const currentStatus = app.status || 'pending';
            const matchStatus = currentStatus === activeTab;

            return matchRole && matchStatus;
        });
    }, [applicants, userRole, activeTab]);

    const getStatusColor = (status) => {
        const normalized = status || 'pending';
        switch (normalized) {
            case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-400 font-medium animate-pulse">Loading applicant data...</div>;

    return (
        <div className="space-y-6 pb-24 md:pb-0"> {/* Padding bottom extra di mobile */}
            <div className="px-1 md:px-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">Division List</h1>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                    Manage applicants for <span className="font-bold uppercase text-sage-600 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">{userRole}</span>.
                </p>
            </div>

            {/* Tabs - Horizontal Scroll di Mobile */}
            <div className="flex p-1 bg-white rounded-xl border border-slate-200 w-full md:w-fit shadow-sm overflow-x-auto no-scrollbar">
                {['pending', 'accepted', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 whitespace-nowrap ${activeTab === tab
                            ? 'bg-sage-600 text-white shadow-md transform scale-[1.02]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-sage-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table Container */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    // Di mobile bg-transparent agar jarak antar kartu terlihat, desktop bg-white menyatu
                    className="md:bg-white/95 md:backdrop-blur-sm md:rounded-3xl md:border md:border-slate-200 md:shadow-sm md:overflow-hidden"
                >
                    <div className="w-full">
                        <table className="w-full text-left border-collapse">
                            {/* Header - Hidden di Mobile */}
                            <thead className="hidden md:table-header-group bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6 pl-8">Name</th>
                                    <th className="p-6">Contact</th>
                                    <th className="p-6 text-center">Avg Score</th>
                                    <th className="p-6 text-center">Status</th>
                                </tr>
                            </thead>

                            {/* Body - Block display di mobile */}
                            <tbody className="block md:table-row-group w-full divide-y md:divide-slate-100 divide-transparent">
                                {filteredData.length === 0 ? (
                                    <tr className="block md:table-row bg-white rounded-2xl border border-slate-200 md:border-0 p-8 md:p-0">
                                        <td colSpan="4" className="p-8 md:p-16 text-center block md:table-cell">
                                            <div className="flex flex-col items-center gap-2">
                                                <UserX className="w-8 h-8 text-slate-300" />
                                                <span className="text-slate-400 italic font-medium text-sm">
                                                    No applicants found in <span className="capitalize font-bold text-slate-500">{activeTab}</span> list.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(app => (
                                        <ApplicantRow
                                            key={app.id || Math.random()}
                                            app={app}
                                            getStatusColor={getStatusColor}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}