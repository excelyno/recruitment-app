import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import AddAdminModal from "./AddAdminModal";

export default function AdminMonitor({ isOpen, onClose, allApplicants }) {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    // --- CONFIG URUTAN PRIORITAS ---
    const rolePriority = {
        "superadmin": 1,
        "acara": 2,
        "pdd": 3,
        "perkab": 4,
        "humas": 5
    };

    // Ganti fetchAdmins dengan logika ini:
    const fetchAdmins = async (force = false) => {
        setLoading(true);
        const CACHE_KEY = "admin_list_cache";

        // 1. Cek Cache LocalStorage (Jika tidak dipaksa refresh)
        if (!force) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                setAdmins(JSON.parse(cached));
                setLoading(false);
                return; // Stop, hemat kuota!
            }
        }

        try {
            // 2. Ambil dari Firebase
            const querySnapshot = await getDocs(collection(db, "admins"));
            let adminList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // ... (logika sorting kamu tetap sama) ...

            setAdmins(adminList);

            // 3. Simpan ke Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(adminList));
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    // PENTING: Saat delete/add admin berhasil, panggil fetchAdmins(true) untuk memaksa update data baru.

    useEffect(() => {
        if (isOpen) fetchAdmins();
    }, [isOpen]);

    const getStats = (role) => {
        if (role === 'superadmin') return { total: allApplicants.length, acc: allApplicants.filter(a => a.status === 'accepted').length };

        const divisiApplicants = allApplicants.filter(app => app.divisi === role);
        const accepted = divisiApplicants.filter(app => app.status === 'accepted').length;

        return { total: divisiApplicants.length, acc: accepted };
    };

    const togglePass = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDeleteFromDB = async (id) => {
        if (!window.confirm("Hapus akses admin ini dari database?")) return;
        await deleteDoc(doc(db, "admins", id));
        fetchAdmins();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col">

                        {/* Header */}
                        <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-white font-bold text-xl">Admin Monitor & Control</h2>
                                <p className="text-slate-400 text-xs mt-1">Pantau kinerja admin divisi dan kelola akses.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-900/20 flex items-center gap-2">
                                    <span>+</span> Admin Baru
                                </button>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center transition">✕</button>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            {loading ? (
                                <div className="text-center py-10 text-slate-400">Loading admin data...</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                            <th className="pb-3 pl-2">Admin / Role</th>
                                            <th className="pb-3">Kredensial Login</th>
                                            <th className="pb-3 text-center">Total Pelamar</th>
                                            <th className="pb-3 text-center">Progress (Acc)</th>
                                            <th className="pb-3 text-right pr-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {admins.map((admin, index) => {
                                            const stats = getStats(admin.role);
                                            const percentage = stats.total === 0 ? 0 : Math.round((stats.acc / stats.total) * 100);

                                            return (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={admin.id}
                                                    className="border-b border-slate-100 hover:bg-white transition group"
                                                >
                                                    <td className="py-4 pl-2">
                                                        <div className="font-bold text-slate-800">{admin.name}</div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold 
                                                            ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            {admin.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="text-slate-600 font-mono text-xs">{admin.email}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="bg-slate-200 px-2 py-1 rounded text-xs font-mono min-w-[80px]">
                                                                {admin.password ? (visiblePasswords[admin.id] ? admin.password : "••••••") : <span className="italic text-slate-400">Hidden</span>}
                                                            </div>
                                                            <button onClick={() => togglePass(admin.id)} className="text-slate-400 hover:text-cyan-600 text-xs font-bold px-1">
                                                                {visiblePasswords[admin.id] ? "Hide" : "Show"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center font-bold text-slate-700">
                                                        {stats.total} <span className="text-slate-400 text-xs font-normal">orang</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3 justify-center">
                                                            <div className="text-right">
                                                                <div className="font-bold text-emerald-600">{stats.acc}</div>
                                                                <div className="text-[10px] text-slate-400">Diterima</div>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 relative overflow-hidden">
                                                                <div className="absolute bottom-0 left-0 right-0 bg-emerald-100 z-0 transition-all duration-500" style={{ height: `${percentage}%` }}></div>
                                                                <span className="z-10">{percentage}%</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right pr-2">
                                                        {admin.role !== 'superadmin' && (
                                                            <button onClick={() => handleDeleteFromDB(admin.id)} className="text-xs text-red-400 hover:text-red-600 font-bold border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>

                    <AddAdminModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); fetchAdmins(); }} />
                </div>
            )}
        </AnimatePresence>
    );
}