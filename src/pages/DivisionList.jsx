import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";

export default function DivisionList() {
    const { userRole } = useOutletContext();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("accepted");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "applicants"));
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter by role (if not superadmin, though superadmin might want to see specific divisions too, but typically use GlobalList)
                // Assuming this page is mostly for non-superadmins or "My Division" view
                if (userRole && userRole !== 'superadmin') {
                    data = data.filter(app => app.divisi === userRole);
                }
                // If superadmin visits this page, maybe show nothing or let them pick? 
                // The prompt implies "list where list yang keterima itu siapa aja dan yang ketolak dan ke pending"
                // We will default to showing all if superadmin, or filter by a dropdown later if needed.
                // For now, if superadmin, showing ALL sorted by status makes sense or just reuse GlobalAcceptedList logic but for all statuses.

                setApplicants(data);
            } catch (e) {
                console.error("Error", e);
            } finally {
                setLoading(false);
            }
        };
        if (userRole) fetchData();
    }, [userRole]);

    const filteredData = applicants.filter(app => app.status === activeTab);

    if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Division List</h1>
                <p className="text-slate-500 text-sm">Manage applicants for <span className="font-bold uppercase text-sage-600">{userRole}</span>.</p>
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
                                        {Math.round(Object.values(app.nilai || {}).reduce((a, b) => a + parseInt(b), 0) / 6)}
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
