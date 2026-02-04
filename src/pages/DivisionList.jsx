import React, { useState, useMemo, memo } from 'react'; // Tambah useMemo & memo
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Phone, UserX } from 'lucide-react';
import { useOutletContext } from "react-router-dom";
import { useApplicants } from "../context/ApplicantContext";

// --- 1. KOMPONEN BARIS TABEL (DIPISAH & DI-MEMO) ---
// Ini mencegah re-render massal. Hanya baris yang datanya berubah yang akan dirender ulang.
const ApplicantRow = memo(({ app, getStatusColor, onViewDetails }) => {

    // Hitung rata-rata di sini saja
    const calculateAverage = (nilaiObj) => {
        if (!nilaiObj) return 0;
        const values = Object.values(nilaiObj).filter(v => !isNaN(parseInt(v)));
        if (values.length === 0) return 0;
        const total = values.reduce((acc, curr) => acc + parseInt(curr), 0);
        return Math.round(total / values.length);
    };

    return (
        <tr className="group hover:bg-slate-50 transition-colors duration-200">
            {/* Nama & Prodi */}
            <td className="p-6 pl-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-bold text-sm border border-sage-200">
                        {app.nama ? app.nama.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-base">{app.nama}</div>
                        <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">
                            {app.prodi}
                        </div>
                    </div>
                </div>
            </td>

            {/* Kontak */}
            <td className="p-6">
                <a
                    href={`https://wa.me/${app.whatsapp ? app.whatsapp.replace(/\D/g, '') : ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sage-600 hover:text-sage-800 font-bold text-xs transition-colors bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-full border border-sage-200"
                >
                    <Phone className="w-3 h-3" />
                    {app.whatsapp || '-'}
                </a>
            </td>

            {/* Rata-rata Nilai */}
            <td className="p-6 text-center font-bold text-slate-700">
                <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-200">
                    {calculateAverage(app.nilai)}
                </div>
            </td>

            {/* Status Badge */}
            <td className="p-6 text-center">
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
    // React tidak akan menghitung ulang filter ini kecuali applicants/tab berubah
    const filteredData = useMemo(() => {
        return applicants.filter(app => {
            const matchRole = (userRole && userRole !== 'superadmin')
                ? app.divisi === userRole
                : true;

            // Normalisasi status (Solusi Bug Status Kosong)
            const currentStatus = app.status || 'pending';
            const matchStatus = currentStatus === activeTab;

            return matchRole && matchStatus;
        });
    }, [applicants, userRole, activeTab]);

    // Helper warna status (tidak perlu di-memo karena ringan)
    const getStatusColor = (status) => {
        const normalized = status || 'pending';
        switch (normalized) {
            case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-400 font-medium">Loading applicant data...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Division List</h1>
                <p className="text-slate-500 text-sm">
                    Manage applicants for <span className="font-bold uppercase text-sage-600 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">{userRole}</span>.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white rounded-xl border border-slate-200 w-fit shadow-sm">
                {['pending', 'accepted', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${activeTab === tab
                            ? 'bg-sage-600 text-white shadow-md transform scale-105'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-sage-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table Container - Mengurangi Blur agar Ringan */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }} // Kurangi jarak animasi Y biar lebih cepat
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }} // Percepat durasi animasi
                    className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm overflow-hidden" // Ubah blur jadi sm
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6 pl-8">Name</th>
                                    <th className="p-6">Contact</th>
                                    <th className="p-6 text-center">Avg Score</th>
                                    <th className="p-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <UserX className="w-8 h-8 text-slate-300" />
                                                <span className="text-slate-400 italic font-medium">
                                                    No applicants found in <span className="capitalize font-bold text-slate-500">{activeTab}</span> list.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // --- 4. RENDER MENGGUNAKAN KOMPONEN MEMO ---
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