import { useState } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { useApplicants } from "../context/ApplicantContext"; // 1. Import Context

export default function DivisionList() {
    const { userRole } = useOutletContext();

    // 2. Ambil data dari Gudang Pusat (Context)
    const { applicants, loading } = useApplicants();

    const [activeTab, setActiveTab] = useState("accepted");

    // 3. Logic Filter: Dilakukan di Client Side (Hemat Kuota)
    // Tidak perlu useEffect + getDocs lagi!
    const filteredData = applicants.filter(app => {
        // A. Filter berdasarkan Role (Divisi)
        // Jika Superadmin -> Lihat semua. Jika Admin Divisi -> Lihat divisinya saja.
        const matchRole = (userRole && userRole !== 'superadmin')
            ? app.divisi === userRole
            : true;

        // B. Filter berdasarkan Tab Status (Accepted/Rejected/Pending)
        const matchStatus = app.status === activeTab;

        return matchRole && matchStatus;
    });

    if (loading) return <div className="text-center py-20 text-slate-400">Loading data...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Division List</h1>
                <p className="text-slate-500 text-sm">
                    Manage applicants for <span className="font-bold uppercase text-sage-600">{userRole}</span>.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white rounded-xl border border-slate-200 w-fit">
                {['pending', 'accepted', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                            ? 'bg-sage-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="p-6 pl-8">Name</th>
                                <th className="p-6">Contact</th>
                                <th className="p-6 text-center">Avg Score</th>
                                <th className="p-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">No {activeTab} applicants found.</td></tr>
                            ) : filteredData.map(app => (
                                <tr key={app.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-6 pl-8">
                                        <div className="font-bold text-slate-800">{app.nama}</div>
                                        <div className="text-xs text-slate-500">{app.prodi}</div>
                                    </td>
                                    <td className="p-6">
                                        <a href={`https://wa.me/${app.whatsapp}`} target="_blank" rel="noreferrer" className="text-sage-600 hover:underline font-bold text-xs">
                                            {app.whatsapp}
                                        </a>
                                    </td>
                                    <td className="p-6 text-center font-bold text-slate-700">
                                        {/* Hitung Rata-rata Nilai (Safe Check jika nilai null) */}
                                        {Math.round(Object.values(app.nilai || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) / 6)}
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                            app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}