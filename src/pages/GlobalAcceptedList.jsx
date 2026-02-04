import { useMemo } from "react";
import { useApplicants } from "../context/ApplicantContext"; // 1. Import Context Saja
import { motion } from "framer-motion";
import { CheckCircle2, UserCircle, Loader2 } from "lucide-react";

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
        <div className="space-y-8 pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                        {pageTitle}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {adminProfile.role === 'superadmin'
                            ? "Rekapitulasi seluruh kandidat yang lolos seleksi."
                            : "Daftar kandidat yang resmi masuk divisi Anda."}
                    </p>
                </div>

                {/* Info Admin Login */}
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                        <UserCircle size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Logged in as</p>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                            {adminProfile.name} <span className="text-emerald-600">({adminProfile.role === 'superadmin' ? 'Super Admin' : adminProfile.division})</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- LIST CONTENT --- */}
            {Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-medium">Belum ada kandidat yang diterima.</p>
                </div>
            ) : (
                Object.entries(groupedData).map(([divisi, apps]) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        key={divisi} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        {/* Judul Divisi */}
                        <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center">
                            <h2 className="text-sm font-black text-emerald-800 uppercase tracking-widest pl-2 border-l-4 border-emerald-500">
                                Divisi {divisi}
                            </h2>
                            <span className="bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                                {apps.length} Personel
                            </span>
                        </div>

                        {/* Tabel Data */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-slate-50 text-slate-400 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Nama Kandidat</th>
                                        <th className="p-4">Prodi</th>
                                        <th className="p-4 text-center">Avg Score</th>
                                        <th className="p-4">Kontak</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {apps.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-slate-700">{app.nama}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{app.nim}</div>
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium">{app.prodi}</td>
                                            <td className="p-4 text-center">
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                    {Math.round(Object.values(app.nilai || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) / 6)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <a
                                                    href={`https://wa.me/${app.whatsapp}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-slate-600 hover:text-emerald-600 hover:underline font-bold text-xs flex items-center gap-1"
                                                >
                                                    {app.whatsapp}
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );
}