import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

export default function GlobalAcceptedList() {
    const [accepted, setAccepted] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccepted = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "applicants"));
                const data = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(app => app.status === 'accepted');

                // Sort by Division then Name
                data.sort((a, b) => a.divisi.localeCompare(b.divisi) || a.nama.localeCompare(b.nama));
                setAccepted(data);
            } catch (e) {
                console.error("Error fetching accepted list:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAccepted();
    }, []);

    // Group by Division
    const grouped = accepted.reduce((acc, curr) => {
        const div = curr.divisi || "umum";
        if (!acc[div]) acc[div] = [];
        acc[div].push(curr);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Global Accepted List</h1>
                <p className="text-slate-500 text-sm">All candidates accepted across divisions.</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading...</div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-20 text-slate-400">No accepted candidates yet.</div>
            ) : (
                Object.entries(grouped).map(([divisi, apps]) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        key={divisi} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="bg-sage-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">{divisi}</h2>
                            <span className="bg-sage-200 text-sage-700 px-3 py-1 rounded-full text-xs font-bold">{apps.length} Personel</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-slate-50 text-slate-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-4 pl-6">Name</th>
                                        <th className="p-4">Major</th>
                                        <th className="p-4 text-center">Avg Score</th>
                                        <th className="p-4">Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {apps.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 pl-6 font-bold text-slate-700">{app.nama}</td>
                                            <td className="p-4 text-slate-500">{app.prodi}</td>
                                            <td className="p-4 text-center font-bold text-emerald-600">
                                                {Math.round(Object.values(app.nilai || {}).reduce((a, b) => a + parseInt(b), 0) / 6)}
                                            </td>
                                            <td className="p-4">
                                                <a href={`https://wa.me/${app.whatsapp}`} target="_blank" rel="noreferrer" className="text-sage-600 hover:underline font-bold text-xs">
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
