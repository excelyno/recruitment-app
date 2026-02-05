import { useMemo } from "react";
import { useApplicants } from "../context/ApplicantContext"; // 1. Import Context Saja
import { motion } from "framer-motion";
import { CheckCircle2, UserCircle, Phone, Trophy, GraduationCap, LayoutGrid } from 'lucide-react';

// Helper hitung rata-rata
const calculateScore = (nilaiObj) => {
    if (!nilaiObj) return 0;
    const values = Object.values(nilaiObj).map(v => parseInt(v) || 0);
    if (values.length === 0) return 0;
    const total = values.reduce((acc, curr) => acc + curr, 0);
    return Math.round(total / values.length);
};

export default function GlobalAcceptedList() {
    // 2. AMBIL SEMUA DARI CONTEXT (GRATIS KUOTA)
    // appsLoading = loading data pelamar
    // adminLoading = loading cek profil admin
    const { applicants, loading: appsLoading, adminProfile, adminLoading } = useApplicants();

    // 3. LOGIC FILTER & GROUPING (Client Side - Javascript)
    const groupedData = useMemo(() => {
        // Tunggu semua data siap
        if (appsLoading || adminLoading) return {};

        // A. Filter Status: Harus 'accepted'
        let filtered = applicants.filter(app => app.status === 'accepted');

        // B. Filter Role: Jika BUKAN Superadmin atau Ketua, filter cuma divisinya dia
        if (adminProfile?.role !== 'superadmin' && adminProfile?.role !== 'ketua') {
            filtered = filtered.filter(app => app.divisi === adminProfile?.division);
        }

        // C. Sorting: Urutkan Divisi A-Z, lalu Nama A-Z
        filtered.sort((a, b) =>
            (a.divisi || "").localeCompare(b.divisi || "") ||
            (a.nama || "").localeCompare(b.nama || "")
        );

        // D. Grouping: Kelompokkan array berdasarkan nama divisi
        return filtered.reduce((acc, curr) => {
            const div = curr.divisi || "umum";
            if (!acc[div]) acc[div] = [];
            acc[div].push(curr);
            return acc;
        }, {});

    }, [applicants, adminProfile, appsLoading, adminLoading]);

    // 4. RENDER UI
    if (appsLoading || adminLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-slate-400">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }

    // Judul Dinamis
    const pageTitle = adminProfile.role === 'superadmin'
        ? "Global Accepted List"
        : `Tim Divisi ${adminProfile.division?.toUpperCase()}`;

    return (
        <div className="space-y-6 md:space-y-8 pb-32 md:pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 pt-4 md:pt-0">
                <div className="px-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={28} />
                        {pageTitle}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        {adminProfile.role === 'superadmin'
                            ? "Rekapitulasi seluruh kandidat yang lolos seleksi."
                            : "Daftar kandidat yang resmi masuk divisi Anda."}
                    </p>
                </div>

                {/* Info Admin Login */}
                <div className="bg-white px-4 py-3 md:py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 mx-1 md:mx-0">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                        <UserCircle size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                            {adminProfile.name} <span className="text-emerald-600">({adminProfile.role === 'superadmin' ? 'Super Admin' : adminProfile.division})</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- LIST CONTENT --- */}
            {Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed mx-1">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <LayoutGrid size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada kandidat yang diterima.</p>
                </div>
            ) : (
                <div className="space-y-6 md:space-y-8">
                    {Object.entries(groupedData).map(([divisi, apps], index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={divisi}
                            className="bg-white md:rounded-3xl border-y md:border border-slate-200 shadow-sm overflow-hidden -mx-4 md:mx-0"
                        >
                            {/* Judul Divisi */}
                            <div className="bg-emerald-50/80 px-6 py-4 border-b border-emerald-100 flex justify-between items-center backdrop-blur-sm">
                                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest pl-3 border-l-4 border-emerald-500">
                                    Divisi {divisi}
                                </h2>
                                <span className="bg-white text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-emerald-100">
                                    {apps.length} Personel
                                </span>
                            </div>

                            {/* --- TAMPILAN DESKTOP (TABLE) --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white border-b border-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="p-5 pl-8">Nama Kandidat</th>
                                            <th className="p-5">Prodi</th>
                                            <th className="p-5 text-center">Avg Score</th>
                                            <th className="p-5">Kontak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {apps.map(app => (
                                            <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="p-5 pl-8">
                                                    <div className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{app.nama}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{app.nim}</div>
                                                </td>
                                                <td className="p-5 text-slate-500 font-medium">{app.prodi}</td>
                                                <td className="p-5 text-center">
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                                        <Trophy size={12} className="text-emerald-500" />
                                                        {calculateScore(app.nilai)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <a
                                                        href={`https://wa.me/${app.whatsapp ? app.whatsapp.replace(/\D/g, '') : ''}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all font-bold text-xs inline-flex items-center gap-2 border border-transparent hover:border-emerald-200"
                                                    >
                                                        <Phone size={14} />
                                                        {app.whatsapp}
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- TAMPILAN MOBILE (CARDS) --- */}
                            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                                {apps.map(app => (
                                    <div key={app.id} className="p-5 bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">{app.nama}</div>
                                                <div className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">
                                                    {app.nim}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score</span>
                                                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg text-sm">
                                                    <Trophy size={12} />
                                                    {calculateScore(app.nilai)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                                            <GraduationCap size={16} className="text-slate-400" />
                                            <span className="font-medium">{app.prodi}</span>
                                        </div>

                                        <a
                                            href={`https://wa.me/${app.whatsapp ? app.whatsapp.replace(/\D/g, '') : ''}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex justify-center items-center gap-2 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                        >
                                            <Phone size={16} />
                                            Hubungi via WhatsApp
                                        </a>
                                    </div>
                                ))}
                            </div>

                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}