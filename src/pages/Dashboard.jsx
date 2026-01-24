import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion"; // IMPORT FRAME MOTION
import SuccessModal from "../components/SuccessModal"; // IMPORT MODAL

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function Dashboard() {
    const [applicants, setApplicants] = useState([]);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // Modal state

    const categories = ["speaking", "teknis", "teamwork", "attitude", "kreativitas", "solving"];

    const [inputData, setInputData] = useState({
        scores: { speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 },
        notes: "",
        status: "pending"
    });

    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "applicants"));
                const data = querySnapshot.docs.map((doc) => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: d.nama || "No Name",
                        prodi: d.prodi || "-",
                        divisi: d.divisi || "Umum",
                        whatsapp: d.whatsapp || "-",
                        motivasi: d.motivasi || "Tidak ada motivasi.",
                        status: d.status || "pending",
                        notes: d.recruiterNotes || "",
                        scores: d.nilai || { speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 }
                    };
                });
                setApplicants(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleLogout = async () => { await signOut(auth); navigate("/"); };

    const handleSelect = (app) => {
        setSelectedApplicant(app);
        setInputData({ scores: app.scores, notes: app.notes, status: app.status });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const applicantRef = doc(db, "applicants", selectedApplicant.id);
            await updateDoc(applicantRef, {
                nilai: inputData.scores,
                recruiterNotes: inputData.notes,
                status: inputData.status
            });

            const updatedList = applicants.map(app =>
                app.id === selectedApplicant.id ? { ...app, scores: inputData.scores, notes: inputData.notes, status: inputData.status } : app
            );

            setApplicants(updatedList);
            setSelectedApplicant({ ...selectedApplicant, scores: inputData.scores, notes: inputData.notes, status: inputData.status });
            setIsEditing(false);
            setShowSuccess(true); // TRIGGER ANIMASI CENTANG
        } catch (error) { alert("Gagal menyimpan."); }
        finally { setSaving(false); }
    };

    const calculateAverage = (scores) => {
        if (!scores) return 0;
        const total = Object.values(scores).reduce((a, b) => Number(a) + Number(b), 0);
        return (total / 6).toFixed(0);
    };

    const filteredApplicants = applicants.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const leaders = useMemo(() => {
        const result = {};
        categories.forEach(cat => {
            const top = applicants.reduce((prev, current) => (prev.scores[cat] > current.scores[cat]) ? prev : current, applicants[0]);
            if (top && top.scores[cat] > 0) result[cat] = top;
        });
        return result;
    }, [applicants]);

    const ChartComponent = ({ scores }) => {
        const data = {
            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                label: 'Skill', data: categories.map(cat => scores?.[cat] || 0),
                backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: 'rgba(6, 182, 212, 1)',
                borderWidth: 2, pointBackgroundColor: '#fff', pointBorderColor: 'rgba(6, 182, 212, 1)',
            }],
        };
        const options = {
            scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 20 }, grid: { color: "rgba(203, 213, 225, 0.4)" }, pointLabels: { font: { size: 10, weight: 'bold' }, color: '#64748b' } } },
            plugins: { legend: { display: false } }, maintainAspectRatio: false, animation: { duration: 1000, easing: 'easeOutQuart' } // Smooth Chart Animation
        };
        return <Radar data={data} options={options} />;
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="h-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden">
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Data Disimpan!" message="Penilaian peserta berhasil diperbarui." />

            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-20 shadow-sm">
                <h1 className="font-bold text-lg text-slate-900">Recruit<span className="text-cyan-600">AI</span></h1>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1 rounded bg-slate-100 hover:bg-red-50 transition">LOG OUT</button>
            </nav>

            <div className="flex flex-1 overflow-hidden p-4 gap-4 max-w-[1600px] mx-auto w-full">

                {/* SIDEBAR */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 hidden md:flex">
                    <div className="p-4 border-b border-slate-100 bg-white z-10">
                        <input type="text" placeholder="Cari Peserta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-cyan-500 rounded-lg px-3 py-2 text-sm transition outline-none" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                        {filteredApplicants.map((app, index) => (
                            <motion.div
                                layout // Smooth shuffling animate
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                key={app.id} onClick={() => handleSelect(app)}
                                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between group transition-colors duration-200
                    ${selectedApplicant?.id === app.id ? "bg-slate-800 text-white shadow-md" : "hover:bg-slate-50 text-slate-600"}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0
                        ${selectedApplicant?.id === app.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                                        {app.name.charAt(0)}
                                    </div>
                                    <div className="truncate">
                                        <h3 className="font-bold text-sm truncate">{app.name}</h3>
                                        <p className="text-[10px] opacity-70 uppercase truncate">{app.divisi}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold ${selectedApplicant?.id === app.id ? "text-cyan-400" : "text-slate-300"}`}>
                                    {calculateAverage(app.scores) > 0 ? calculateAverage(app.scores) : "•"}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {selectedApplicant ? (
                            <motion.div
                                key={selectedApplicant.id} // Kunci animasi saat ganti orang
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                                className="flex flex-col h-full"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900">{selectedApplicant.name}</h1>
                                        <div className="flex gap-3 text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                                            <span className="text-cyan-600">{selectedApplicant.divisi}</span><span>•</span><span>{selectedApplicant.prodi}</span>
                                        </div>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving}
                                        className={`px-5 py-2 rounded-lg text-xs font-bold transition shadow-sm ${isEditing ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                    >
                                        {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Score"}
                                    </motion.button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scroll-smooth">
                                    <div className="flex flex-col xl:flex-row gap-8">
                                        <div className="w-full xl:w-5/12 space-y-6">
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 h-[300px] relative">
                                                <ChartComponent scores={isEditing ? inputData.scores : selectedApplicant.scores} />
                                                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md border text-xs font-bold shadow-sm">OVR: {calculateAverage(isEditing ? inputData.scores : selectedApplicant.scores)}</div>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Motivasi</h3>
                                                <p className="text-sm text-slate-700 italic leading-relaxed">"{selectedApplicant.motivasi}"</p>
                                            </div>
                                        </div>

                                        <div className="w-full xl:w-7/12 space-y-6">
                                            {isEditing ? (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                        {categories.map((cat) => (
                                                            <div key={cat}>
                                                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1 uppercase"><span>{cat}</span><span className="text-cyan-600">{inputData.scores[cat]}</span></div>
                                                                <input type="range" min="0" max="100" value={inputData.scores[cat]} onChange={(e) => setInputData({ ...inputData, scores: { ...inputData.scores, [cat]: parseInt(e.target.value) } })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400 uppercase">Recruiter Notes</label>
                                                        <textarea value={inputData.notes} onChange={(e) => setInputData({ ...inputData, notes: e.target.value })} className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 h-24 resize-none" placeholder="Catatan tambahan..." />
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                                                        <select value={inputData.status} onChange={(e) => setInputData({ ...inputData, status: e.target.value })} className="bg-transparent font-bold text-sm outline-none text-slate-800 cursor-pointer">
                                                            <option value="pending">⏳ Pending</option><option value="accepted">✅ Accepted</option><option value="rejected">❌ Rejected</option>
                                                        </select>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {categories.map(cat => (
                                                            <motion.div whileHover={{ y: -2 }} key={cat} className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{cat}</span>
                                                                <span className="font-bold text-lg text-slate-800">{selectedApplicant.scores[cat]}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                    {selectedApplicant.notes && (
                                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100"><h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Notes</h3><p className="text-sm text-slate-700">{selectedApplicant.notes}</p></div>
                                                    )}
                                                    <div className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${selectedApplicant.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : selectedApplicant.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>Status: {selectedApplicant.status}</div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Performers</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                            {categories.map((cat, i) => (
                                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }} key={cat} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{cat}</div>
                                                    <div className="font-bold text-xs text-slate-800 truncate">{leaders[cat]?.name || "-"}</div>
                                                    <div className="text-cyan-600 font-bold text-sm">{leaders[cat]?.scores[cat] || 0}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="text-4xl mb-4">👋</div>
                                <h3 className="font-bold text-slate-800 text-lg">Dashboard Rekrutmen</h3>
                                <p className="text-slate-400 text-sm mt-2">Pilih peserta dari sidebar kiri untuk melihat detail.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}