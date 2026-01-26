import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Trash2, Plus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AddAdminModal from "../components/AddAdminModal";

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [applicants, setApplicants] = useState([]);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Ambil Data Pelamar untuk Statistik
            const appSnapshot = await getDocs(collection(db, "applicants"));
            const appList = appSnapshot.docs.map(doc => doc.data());
            setApplicants(appList);

            // 2. Ambil Data Admin
            const querySnapshot = await getDocs(collection(db, "admins"));
            const adminList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // FIX ERROR: Berikan nilai default jika kosong
                    name: data.name || "Admin",
                    role: data.role || "guest",
                    email: data.email || "-"
                };
            });

            // Priority Sort (Superadmin First)
            const rolePriority = { "superadmin": 1, "acara": 2, "pdd": 3, "perkab": 4, "humas": 5 };
            adminList.sort((a, b) => {
                const roleA = (a.role || "").toLowerCase();
                const roleB = (b.role || "").toLowerCase();
                return (rolePriority[roleA] || 99) - (rolePriority[roleB] || 99);
            });

            setAdmins(adminList);
        } catch (error) {
            console.error("Error fetch admins:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Hitung Statistik per Admin
    const getStats = (role) => {
        const r = (role || "").toLowerCase();
        if (r === 'superadmin') {
            return {
                total: applicants.length,
                acc: applicants.filter(a => a.status === 'accepted').length
            };
        }

        const divApps = applicants.filter(app => (app.divisi || "").toLowerCase() === r);
        const accepted = divApps.filter(app => app.status === 'accepted').length;

        return { total: divApps.length, acc: accepted };
    };

    // Toggle Password
    const togglePass = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Hapus Admin
    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus akses admin ini?")) return;
        try {
            await deleteDoc(doc(db, "admins", id));
            fetchData(); // Refresh list
        } catch (e) {
            alert("Gagal menghapus: " + e.message);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <UserCog size={32} className="text-sage-600" />
                        Admin Management
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Kelola akses dan pantau kinerja divisi.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-sage-600 text-white font-bold rounded-xl hover:bg-sage-700 transition shadow-lg shadow-sage-200"
                >
                    <Plus size={20} /> Add New Admin
                </button>
            </div>

            {/* Admin Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">Admin Name</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Access Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Credentials</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Performance</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">Loading data...</td>
                                </tr>
                            ) : admins.map((admin) => {
                                const stats = getStats(admin.role);
                                const percent = stats.total === 0 ? 0 : Math.round((stats.acc / stats.total) * 100);
                                const isSuper = admin.role === 'superadmin';

                                return (
                                    <motion.tr
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        key={admin.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md
                                                    ${isSuper ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-emerald-400 to-teal-600'}`}>
                                                    {/* FIX: Menggunakan Optional Chaining & Default Value */}
                                                    {(admin.name || "A").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-base">{admin.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                                        {isSuper && <ShieldCheck size={12} className="text-indigo-500" />}
                                                        {isSuper ? "Root Access" : "Division Admin"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                                ${isSuper ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {admin.role}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{admin.email}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs font-mono text-slate-800 font-bold bg-slate-100 px-2 py-1 rounded min-w-[80px]">
                                                        {visiblePasswords[admin.id] ? (admin.password || "••••••") : "••••••"}
                                                    </div>
                                                    <button onClick={() => togglePass(admin.id)} className="text-slate-400 hover:text-sage-600 transition">
                                                        {visiblePasswords[admin.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1 w-32">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                    <span>Progress</span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${isSuper ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                    {stats.acc} dari {stats.total} diterima
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            {!isSuper && (
                                                <button
                                                    onClick={() => handleDelete(admin.id)}
                                                    className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition border border-transparent hover:border-rose-100"
                                                    title="Hapus Admin"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Admin */}
            <AddAdminModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); fetchData(); }} />
        </div>
    );
}