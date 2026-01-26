import { useEffect, useState, useMemo, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Doughnut, Radar, PolarArea } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, LogOut, Download, Filter,
    CheckCircle2, XCircle, Clock, Users,
    Edit3, X, PieChart, Activity
} from "lucide-react";
import AdminMonitor from "../components/AdminMonitor";
import AnimatedBackground from "../components/AnimatedBackground";
import SuccessModal from "../components/SuccessModal";
import { getElementAtEvent } from "react-chartjs-2";

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard() {
    const [applicants, setApplicants] = useState([]);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDivisi, setFilterDivisi] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [formQuestions, setFormQuestions] = useState([]);
    const [showMonitor, setShowMonitor] = useState(false); // Restore this line

    // Chart Refs for Interactivity
    const doughnutRef = useRef(null);

    // Auth Info
    const [userRole, setUserRole] = useState("guest");
    const [userName, setUserName] = useState("Admin");

    // Edit Scoring State
    const [isEditing, setIsEditing] = useState(false);
    const [inputScores, setInputScores] = useState({});
    const [inputNotes, setInputNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: ""
    });

    const navigate = useNavigate();
    const categories = ["speaking", "teknis", "teamwork", "attitude", "kreativitas", "solving"];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) return;

                // --- 1. AMBIL DATA ADMIN & ROLE ---
                const adminRef = doc(db, "admins", user.uid);
                const adminSnap = await getDoc(adminRef);

                let myRole = "guest";
                let myName = "Admin";

                if (adminSnap.exists()) {
                    const data = adminSnap.data();
                    myRole = data.role || "guest";
                    myName = data.name || "Admin";

                    setUserRole(myRole);
                    setUserName(myName);
                }

                // --- 2. AMBIL PELAMAR (SESUAI ROLE) ---
                let applicantQuery;

                if (myRole === "superadmin") {
                    // Kalau Superadmin, ambil SEMUA pelamar
                    applicantQuery = collection(db, "applicants");
                } else {
                    // Kalau Admin Divisi (misal: Acara), ambil pelamar divisi itu saja
                    applicantQuery = query(
                        collection(db, "applicants"),
                        where("divisi", "==", myRole) // Filter database langsung
                    );
                }

                const querySnapshot = await getDocs(applicantQuery);
                let dataPelamar = querySnapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        nama: d.nama || "Tanpa Nama",
                        divisi: d.divisi || "umum",
                        nilai: d.nilai || { speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 },
                        recruiterNotes: d.recruiterNotes || "",
                        dynamicAnswers: d.dynamicAnswers || {}
                    };
                });

                // Sortir dari yang terbaru
                dataPelamar.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setApplicants(dataPelamar);

                // --- 3. AMBIL CONFIG FORM (FIXED LOGIC) ---
                // Kita ambil SEMUA config form dan kita tandai (tagging) setiap pertanyaan milik divisi mana.
                // Ini penting agar Superadmin (atau admin lain) bisa melihat pertanyaan yang BENAR sesuai divisi pelamar.

                try {
                    // Selalu ambil semua config (agar Superadmin aman saat cek berbagai divisi)
                    const configSnap = await getDocs(collection(db, "formConfigs"));
                    let allQuestionsTagged = [];

                    configSnap.forEach(doc => {
                        const divisionName = doc.id; // Contoh: 'acara', 'pdd'
                        const d = doc.data();

                        if (d.questions && Array.isArray(d.questions)) {
                            // PENTING: Tempelkan 'divisionOwner' ke setiap pertanyaan
                            const tagged = d.questions.map(q => ({
                                ...q,
                                divisionOwner: divisionName
                            }));
                            allQuestionsTagged = [...allQuestionsTagged, ...tagged];
                        }
                    });

                    setFormQuestions(allQuestionsTagged);
                } catch (e) {
                    console.error("Form config fetch error:", e);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const filteredApplicants = useMemo(() => {
        let filtered = applicants;
        if (userRole && userRole !== 'superadmin') filtered = filtered.filter(app => app.divisi === userRole);
        if (filterDivisi !== 'all') filtered = filtered.filter(app => app.divisi === filterDivisi);
        if (filterStatus !== 'all') filtered = filtered.filter(app => app.status === filterStatus);

        return filtered.filter(app =>
            app.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.prodi.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [applicants, searchTerm, userRole, filterDivisi, filterStatus]);

    const stats = useMemo(() => {
        const sourceData = applicants; // Use all applicants for global stats if needed, or filtered
        // Using filtered for context-aware stats
        const dataToUse = filteredApplicants;
        const total = dataToUse.length;
        const pending = dataToUse.filter(a => a.status === 'pending').length;
        const accepted = dataToUse.filter(a => a.status === 'accepted').length;
        const rejected = dataToUse.filter(a => a.status === 'rejected').length;

        const doughnutLabels = ['Accepted', 'Rejected', 'Pending'];
        const doughnutValues = [accepted, rejected, pending];
        const doughnutColors = ['#10b981', '#f43f5e', '#f59e0b']; // Emerald, Rose, Amber

        const avgScores = categories.map(cat => {
            if (total === 0) return 0;
            const sum = dataToUse.reduce((acc, curr) => acc + (parseInt(curr.nilai?.[cat]) || 0), 0);
            return Math.round(sum / total);
        });

        return { total, pending, accepted, rejected, doughnutLabels, doughnutValues, doughnutColors, avgScores };
    }, [filteredApplicants, applicants]); // Add applicants dependancy if we switch logic

    const handleSelect = (app) => {
        setSelectedApplicant(app);
        setInputScores({ ...app.nilai });
        setInputNotes(app.recruiterNotes || "");
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const appRef = doc(db, "applicants", selectedApplicant.id);
            const newData = { nilai: inputScores, recruiterNotes: inputNotes };
            await updateDoc(appRef, newData);

            const updatedApplicants = applicants.map(p => p.id === selectedApplicant.id ? { ...p, ...newData } : p);
            setApplicants(updatedApplicants);
            setSelectedApplicant(prev => ({ ...prev, ...newData }));
            setIsEditing(false);
            setShowSuccess(true);
        } catch (e) { alert("Failed to save."); }
        finally { setSaving(false); }
    };
    // --- UPDATE LOGIC (Copy dari sini) ---
    const updateStatus = async (e, id, newStatus) => {
        // Mencegah event bubbling (biar gak nge-klik parent element)
        if (e) e.stopPropagation();

        // 1. LOGIKA UI: Tutup Panel Statistik dulu biar lega
        setSelectedApplicant(null);

        // 2. LOGIKA MODAL: Siapkan pesan sukses
        const isAccepted = newStatus === 'accepted';
        setModalConfig({
            isOpen: true,
            title: isAccepted ? "Pelamar Diterima! 🎉" : "Pelamar Ditolak",
            message: isAccepted
                ? "Status berhasil diubah menjadi Accepted. Data tersimpan."
                : "Status berhasil diubah menjadi Rejected. Pastikan notes sudah aman."
        });

        // 3. LOGIKA DATABASE: Kirim data ke Firebase
        try {
            // Update List Pelamar di layar (biar instan berubah warnanya)
            setApplicants(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));

            // Update data asli di Firebase Firestore
            const docRef = doc(db, "applicants", id);
            await updateDoc(docRef, { status: newStatus });
        } catch (error) {
            console.error("Gagal update status:", error);
            alert("Yah, gagal update status. Cek koneksi internet.");
        }
    };
    // --- Selesai Copy ---
    const handleLogout = async () => { await signOut(auth); navigate("/"); };

    const handleExportCSV = () => {
        const headers = ["Nama", "Prodi", "Divisi", "WhatsApp", "Status", "Nilai Rata-rata"];
        const rows = filteredApplicants.map(app => [
            app.nama,
            app.prodi,
            app.divisi,
            app.whatsapp,
            app.status,
            (Object.values(app.nilai || {}).reduce((a, b) => a + parseInt(b), 0) / 6).toFixed(1)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "recruitment_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Chart Events
    const handleDoughnutClick = (event) => {
        const { current: chart } = doughnutRef;
        if (!chart) return;
        const elements = getElementAtEvent(chart, event);
        if (elements.length > 0) {
            const index = elements[0].index;
            const statusMap = ['accepted', 'rejected', 'pending'];
            setFilterStatus(statusMap[index]);
        } else {
            setFilterStatus('all');
        }
    };

    // Chart Configuration
    const polarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                ticks: { display: false },
                grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] },
                pointLabels: { display: true, centerPointLabels: true, font: { size: 10, weight: 'bold' }, color: '#64748b' }
            }
        },
        plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } } }
    };

    const polarData = {
        labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [{
            label: 'Avg Score',
            data: stats.avgScores,
            backgroundColor: [
                'rgba(16, 185, 129, 0.5)',
                'rgba(59, 130, 246, 0.5)',
                'rgba(245, 158, 11, 0.5)',
                'rgba(239, 68, 68, 0.5)',
                'rgba(139, 92, 246, 0.5)',
                'rgba(236, 72, 153, 0.5)',
            ],
            borderWidth: 0,
        }]
    };

    const doughnutOptions = {
        cutout: '75%',
        borderRadius: 10,
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
        onClick: handleDoughnutClick,
        onHover: (event, chartElement) => {
            event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="font-sans text-slate-800">
            <SuccessModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
            />
            <AdminMonitor isOpen={showMonitor} onClose={() => setShowMonitor(false)} allApplicants={applicants} />

            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", val: stats.total, color: "text-blue-600 bg-blue-50/50", icon: <Users className="w-4 h-4" /> },
                        { label: "Pending", val: stats.pending, color: "text-amber-600 bg-amber-50/50", icon: <Clock className="w-4 h-4" /> },
                        { label: "Accepted", val: stats.accepted, color: "text-emerald-600 bg-emerald-50/50", icon: <CheckCircle2 className="w-4 h-4" /> },
                        { label: "Rejected", val: stats.rejected, color: "text-rose-600 bg-rose-50/50", icon: <XCircle className="w-4 h-4" /> }
                    ].map((stat, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            key={stat.label}
                            className={`p-5 rounded-2xl glass border-0 flex flex-col justify-between h-28 hover:transform hover:-translate-y-1 transition-all duration-300`}
                        >
                            <div className="flex justify-between items-start opacity-70">
                                <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                                {stat.icon}
                            </div>
                            <div className={`text-3xl font-black tracking-tighter ${stat.color.split(' ')[0]}`}>{stat.val}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass p-6 rounded-3xl min-h-[350px]">
                        <div className="mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Activity size={16} /> Competency Map</h3>
                        </div>
                        <div className="h-64 w-full">
                            <PolarArea data={polarData} options={polarOptions} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-3xl flex flex-col items-center justify-center min-h-[350px]">
                        <div className="w-full text-left mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><PieChart size={16} /> Status Distribution</h3>
                            <p className="text-xs text-slate-400 mt-1">Click segments to filter</p>
                        </div>
                        <div className="relative h-48 w-48">
                            <Doughnut ref={doughnutRef} data={{
                                labels: stats.doughnutLabels,
                                datasets: [{ data: stats.doughnutValues, backgroundColor: stats.doughnutColors, borderWidth: 0, hoverOffset: 10 }]
                            }} options={doughnutOptions} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-slate-700">{stats.total}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-center flex-wrap">
                            {stats.doughnutLabels.map((label, i) => (
                                <div key={label} className="flex items-center gap-1.5 cursor-pointer" onClick={() => setFilterStatus(label.toLowerCase())}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stats.doughnutColors[i] }}></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Applicants Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text" placeholder="Search candidates..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white/50 border border-transparent focus:border-sage-300 rounded-xl text-sm focus:outline-none transition font-medium placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition shadow-lg">
                                    <Download size={14} /> CSV
                                </button>
                            </div>
                        </div>

                        {/* Filter Tags */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${filterStatus === 'all' ? 'bg-sage-600 text-white' : 'bg-white/50 text-slate-500'}`}>All</button>
                            <button onClick={() => setFilterStatus('pending')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${filterStatus === 'pending' ? 'bg-amber-400 text-white' : 'bg-white/50 text-slate-500'}`}>Pending</button>
                            <button onClick={() => setFilterStatus('accepted')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${filterStatus === 'accepted' ? 'bg-emerald-500 text-white' : 'bg-white/50 text-slate-500'}`}>Accepted</button>
                            <button onClick={() => setFilterStatus('rejected')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${filterStatus === 'rejected' ? 'bg-rose-500 text-white' : 'bg-white/50 text-slate-500'}`}>Rejected</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/30 text-slate-400 border-b border-slate-100/50">
                                <tr>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest pl-8">Name</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest">Division</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Avg</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {filteredApplicants.map((app) => (
                                    <motion.tr
                                        key={app.id}
                                        onClick={() => handleSelect(app)}
                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                                        className="cursor-pointer transition-colors hover:bg-white/40"
                                    >
                                        <td className="p-5 pl-8">
                                            <div className="font-bold text-slate-700 text-sm">{app.nama}</div>
                                            <div className="text-[10px] text-slate-400">{app.prodi}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-white/60 rounded text-[10px] font-bold uppercase text-slate-500 border border-slate-100">{app.divisi}</span>
                                        </td>
                                        <td className="p-5 text-center font-bold text-sage-600">
                                            {Math.round(Object.values(app.nilai || {}).reduce((a, b) => a + parseInt(b), 0) / 6)}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className={`w-2 h-2 rounded-full mx-auto ${app.status === 'accepted' ? 'bg-emerald-500' : app.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
            {/* Slide-over Detail */}
            <AnimatePresence>
                {selectedApplicant && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedApplicant(null)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white/80 backdrop-blur-xl shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-white/50"
                        >
                            <div className="p-6 flex justify-between items-center sticky top-0 bg-white/50 backdrop-blur z-10 border-b border-slate-100/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{selectedApplicant.nama}</h2>
                                    <a href={`https://wa.me/${selectedApplicant.whatsapp}`} target="_blank" rel="noreferrer" className="text-xs text-sage-600 font-bold hover:underline">WhatsApp</a>
                                </div>
                                <button onClick={() => setSelectedApplicant(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"><X size={16} /></button>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                <div className="bg-slate-50 rounded-2xl p-4 flex justify-center border border-slate-100">
                                    <Radar data={{
                                        labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                                        datasets: [{
                                            label: 'Stats',
                                            data: categories.map(c => selectedApplicant.nilai[c]),
                                            backgroundColor: 'rgba(82, 143, 82, 0.2)',
                                            borderColor: '#528f52',
                                            pointBackgroundColor: '#fff',
                                        }]
                                    }} options={{ scales: { r: { ticks: { display: false }, grid: { color: '#e2e8f0' } } }, plugins: { legend: { display: false } } }} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scores</h4>
                                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-xs font-bold text-sage-600 bg-sage-100 px-3 py-1 rounded-lg">
                                            {isEditing ? (saving ? "Saving..." : "Done") : "Edit"}
                                        </button>
                                    </div>
                                    {categories.map(cat => (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>{cat}</span>
                                                <span>{isEditing ? inputScores[cat] : selectedApplicant.nilai[cat]}</span>
                                            </div>
                                            {isEditing ? (
                                                <input type="range" min="0" max="100" value={inputScores[cat] || 0} onChange={e => setInputScores({ ...inputScores, [cat]: parseInt(e.target.value) || 0 })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-sage-600" />
                                            ) : (
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedApplicant.nilai[cat]}%` }} className="h-full bg-sage-500 rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Info ({selectedApplicant.divisi})</h4>

                                    {/* Cek apakah ada pertanyaan untuk divisi ini */}
                                    {formQuestions.some(q => q.divisionOwner === selectedApplicant.divisi) ? (
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                                            {formQuestions
                                                // FILTER: Cuma ambil soal punya divisi si pelamar (misal: 'acara')
                                                .filter(q => q.divisionOwner === selectedApplicant.divisi)
                                                .map((q, index) => (
                                                    <div key={index} className="border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                                                        {/* FIX: Pakai q.text sesuai screenshot Firebase */}
                                                        <p className="text-xs font-bold text-slate-700 mb-1">
                                                            {q.text}
                                                        </p>

                                                        {/* Jawaban User */}
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-sage-500"></div>
                                                            <p className="text-sm font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-200 w-full">
                                                                {selectedApplicant.dynamicAnswers?.[q.id] ||
                                                                    <span className="italic text-slate-400 text-xs">Belum dijawab</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                                            Tidak ada pertanyaan khusus untuk divisi ini di database.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</h4>
                                    {isEditing ? (
                                        <textarea value={inputNotes} onChange={e => setInputNotes(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-sage-500 outline-none h-24 resize-none bg-white" placeholder="Write something..." />
                                    ) : (
                                        <div className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                                            {selectedApplicant.recruiterNotes || "No notes yet."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 sticky bottom-0 bg-white/80">
                                <button onClick={() => updateStatus(null, selectedApplicant.id, 'rejected')} className="py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition">Reject</button>
                                <button onClick={() => updateStatus(null, selectedApplicant.id, 'accepted')} className="py-3 rounded-xl bg-sage-600 text-white font-bold text-xs hover:bg-sage-700 transition shadow-lg shadow-sage-200">Accept</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}