import { useEffect, useState, useMemo, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, getDoc, collection, getDocs } from "firebase/firestore"; // collection & getDocs masih dipakai untuk FormConfig & Admin check
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
    Edit3, X, PieChart, Activity, RefreshCw
} from "lucide-react";
import SuccessModal from "../components/SuccessModal";
import { getElementAtEvent } from "react-chartjs-2";
import { useApplicants } from "../context/ApplicantContext";


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
    const { applicants, loading, updateApplicantLocal, getDivisionQuestions, fetchApplicants, adminProfile } = useApplicants();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleManualSync = async () => {
        setIsSyncing(true);
        if (fetchApplicants) {
            await fetchApplicants();
        }
        setTimeout(() => setIsSyncing(false), 800);
    };
    const [selectedApplicant, setSelectedApplicant] = useState(null);
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
    const [inputScores, setInputScores] = useState({
        speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0
    });

    const [isEditing, setIsEditing] = useState(false);
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

    // --- EFFECT 1: INITIALIZE ADMIN (Jalan Sekali saat Loading) ---
    useEffect(() => {
        const fetchAdminProfile = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Ambil data Admin (Nama & Role)
                const adminRef = doc(db, "admins", user.uid);
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists()) {
                    const data = adminSnap.data();
                    setUserRole(data.role || "guest");
                    setUserName(data.name || "Admin");
                }
            } catch (error) {
                console.error("Auth Error:", error);
            }
        };

        fetchAdminProfile();
    }, []); // Dependency kosong = Jalan sekali saja


    // --- LOGIKA BARU: Ambil Master Soal agar urutannya 1, 2, 3... ---
    useEffect(() => {
        const fetchDivisionQuestions = async () => {
            // Cuma jalan kalau ada peserta dipilih & punya divisi
            if (selectedApplicant?.divisi) {
                try {
                    // Ambil config dari database (formConfigs/acara, formConfigs/humas, dll)
                    const docRef = doc(db, "formConfigs", selectedApplicant.divisi);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // Simpan ke state formQuestions yang sudah Anda buat
                        setFormQuestions(docSnap.data().questions || []);
                    } else {
                        setFormQuestions([]);
                    }
                } catch (error) {
                    console.error("Gagal ambil urutan soal:", error);
                }
            }
        };

        fetchDivisionQuestions();
    }, [selectedApplicant]); // Efek ini jalan setiap ganti peserta


    //========================================================================

    // --- EFFECT 2: LOAD SOAL OTOMATIS (Jalan saat Ganti Peserta) ---
    useEffect(() => {
        const loadQuestionsSmartly = async () => {
            // Cek 1: Apakah ada peserta dipilih?
            // Cek 2: Apakah peserta punya divisi? (Penting!)
            if (selectedApplicant && selectedApplicant.divisi) {

                // --- TUNING POINT: Pakai Cache Context ---
                // Fungsi ini otomatis hemat kuota (baca penjelasan di bawah)
                const questions = await getDivisionQuestions(selectedApplicant.divisi);

                setFormQuestions(questions);
            } else {
                setFormQuestions([]);
            }
        };

        loadQuestionsSmartly();
    }, [selectedApplicant, getDivisionQuestions]);
    //========================================================================

    const filteredApplicants = useMemo(() => {
        let filtered = applicants;
        if (userRole && userRole !== 'superadmin' && userRole !== 'ketua') filtered = filtered.filter(app => app.divisi === userRole);
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


    const handleScoreChange = (category, value) => {
        setInputScores(prev => ({
            ...prev,
            [category]: parseInt(value) || 0 // Pastikan value di-parse ke angka
        }));
    };

    //save

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update ke Firebase
            const appRef = doc(db, "applicants", selectedApplicant.id);
            const newData = { nilai: inputScores, recruiterNotes: inputNotes };
            await updateDoc(appRef, newData);


            updateApplicantLocal(selectedApplicant.id, newData); // <--- Update ke Gudang Pusat

            // Update UI Popup (biar realtime di modal)
            setSelectedApplicant(prev => ({ ...prev, ...newData }));

            setIsEditing(false);
            setShowSuccess(true);
        } catch (e) { alert("Failed to save."); }
        finally { setSaving(false); }
    };
    // 1. UPDATE handleSelect: Agar saat dibuka, nilai & notes langsung terisi
    const handleSelect = (app) => {
        setSelectedApplicant(app);
        // Masukkan data database ke state input agar siap diedit
        setInputScores(app.nilai || { speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 });
        setInputNotes(app.recruiterNotes || "");
    };

    // 2. UPDATE updateStatus: Simpan Status + Nilai + Notes sekaligus
    const updateStatus = async (e, id, newStatus) => {
        if (e) e.stopPropagation();
        if (!id) return;

        try {
            const applicantRef = doc(db, "applicants", id);

            // Data paket lengkap yang akan disimpan
            const updateData = {
                status: newStatus,
                nilai: inputScores,       // Ambil dari slider terakhir
                recruiterNotes: inputNotes // Ambil dari text area terakhir
            };

            // Kirim ke Firebase
            await updateDoc(applicantRef, updateData);

            // Update tampilan lokal (Context)
            updateApplicantLocal(id, updateData);

            // Tutup Slide Over
            setSelectedApplicant(null);

        } catch (error) {
            console.error("Error updating status:", error);
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

            <div className="space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">
                            Halo, {adminProfile?.name || 'Admin'} 👋
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Overview Data Rekrutmen
                        </p>
                    </div>

                    {/* <button
                        onClick={handleManualSync}
                        disabled={isSyncing}
                        className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-emerald-200 transition-all group active:scale-95 disabled:opacity-70"
                    >
                        <motion.div
                            animate={{ rotate: isSyncing ? 360 : 0 }}
                            transition={{ repeat: isSyncing ? Infinity : 0, duration: 1, ease: "linear" }}
                        >
                            <RefreshCw size={20} className={isSyncing ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"} />
                        </motion.div>
                        <span className="font-bold text-slate-600 group-hover:text-emerald-700">
                            {isSyncing ? "Menyinkronkan..." : "Sync Data"}
                        </span>
                    </button> */}
                </div>


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
                                            <div className="text-[10px] text-slate-500 font-medium flex gap-1 items-center mt-0.5">
                                                <span className="font-mono text-slate-600 bg-slate-100 px-1 rounded">{app.nim}</span>
                                                <span className="text-slate-300">•</span>
                                                <span>{app.prodi}</span>
                                            </div>
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

                                <div className="h-[300px] w-full relative flex justify-center items-center">
                                    <Radar
                                        data={{
                                            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                                            datasets: [{
                                                label: 'Stats',
                                                data: categories.map(c => inputScores[c] || 0),
                                                backgroundColor: 'rgba(82, 143, 82, 0.2)',
                                                borderColor: '#528f52',

                                                // --- PENGATURAN TITIK (POINT) ---
                                                pointBackgroundColor: '#fff', // Warna isi titik (Putih)
                                                pointBorderColor: '#528f52',  // Warna garis pinggir titik (Hijau)
                                                pointBorderWidth: 2,          // Ketebalan garis pinggir titik

                                                pointRadius: 6,       // <--- UKURAN TITIK (Default biasanya 3, ganti ke 6 atau 8)
                                                pointHoverRadius: 8,  // <--- UKURAN SAAT MOUSE DIARAHKAN (Hover)
                                                // --------------------------------

                                                borderWidth: 2,
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                r: {
                                                    min: 0,
                                                    max: 100,
                                                    beginAtZero: true,
                                                    ticks: { display: false, stepSize: 20 },
                                                    grid: { color: '#e2e8f0' },
                                                    pointLabels: {
                                                        font: { size: 11, weight: 'bold' }, // Ukuran teks label (Speaking, Teknis, dll)
                                                        color: '#64748b'
                                                    }
                                                }
                                            },
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                </div>

                                <div className="space-y-6 pb-24"> {/* Tambah padding bawah agar tidak tertutup tombol */}

                                    {/* --- BAGIAN SCORING (Selalu Aktif) --- */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Activity size={14} /> Scoring
                                            </h4>
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                Auto-save on decision
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            {categories.map(cat => (
                                                <div key={cat} className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                        <span>{cat}</span>
                                                        {/* Menampilkan angka skor real-time */}
                                                        <span className={`px-2 py-0.5 rounded text-white ${(inputScores[cat] || 0) > 75 ? 'bg-emerald-500' :
                                                            (inputScores[cat] || 0) > 50 ? 'bg-yellow-500' : 'bg-slate-400'
                                                            }`}>
                                                            {inputScores[cat] || 0}
                                                        </span>
                                                    </div>

                                                    {/* Slider Selalu Muncul (Tanpa isEditing) */}
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={inputScores[cat] || 0}
                                                        onChange={e => setInputScores({ ...inputScores, [cat]: parseInt(e.target.value) || 0 })}
                                                        className="w-full h-2 bg-slate-200 rounded-lg accent-sage-600 cursor-pointer hover:accent-sage-500 transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* --- BAGIAN SUBMISSION DETAILS (Pertanyaan & Jawaban) --- */}
                                    <div className="mt-6 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <Edit3 size={14} /> Submission Details
                                        </h4>

                                        {formQuestions.length > 0 ? (
                                            formQuestions.map((q, idx) => {
                                                const detailAnswer = selectedApplicant.answersDetails?.find(a => a.question === q.text || a.id === q.id);
                                                const legacyAnswer = selectedApplicant.dynamicAnswers?.[q.id];
                                                const finalAnswer = detailAnswer?.answer || legacyAnswer || "-";

                                                return (
                                                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">
                                                                <span className="text-emerald-600 mr-1">{idx + 1}.</span>
                                                                {q.text}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed ml-3 border-l-2 border-slate-200 pl-3">
                                                            {finalAnswer}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic text-xs">
                                                    {selectedApplicant.answersDetails ? "Menampilkan data tersimpan (Mode Fallback)" : "Memuat pertanyaan..."}
                                                </p>
                                                {/* Fallback Data */}
                                                {selectedApplicant.answersDetails?.map((item, idx) => (
                                                    <div key={idx} className="mt-2 text-left bg-white p-2 rounded border text-xs text-slate-500">
                                                        {item.question}: <span className="text-slate-800">{item.answer}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* --- BAGIAN NOTES (Selalu Aktif) --- */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Edit3 size={14} /> Recruiter Notes
                                        </h4>
                                        <textarea
                                            value={inputNotes}
                                            onChange={e => setInputNotes(e.target.value)}
                                            className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:border-sage-500 focus:ring-1 focus:ring-sage-200 outline-none h-32 resize-none bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="Tulis alasan diterima/ditolak atau catatan wawancara di sini..."
                                        />
                                    </div>

                                </div>

                                {/* --- ACTION BUTTONS (Sticky Bottom) --- */}
                                <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                    <button
                                        onClick={(e) => updateStatus(e, selectedApplicant.id, 'rejected')}
                                        className="py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-rose-100"
                                    >
                                        Reject & Save
                                    </button>
                                    <button
                                        onClick={(e) => updateStatus(e, selectedApplicant.id, 'accepted')}
                                        className="py-3 rounded-xl bg-sage-600 text-white font-bold text-xs hover:bg-sage-700 hover:shadow-lg hover:shadow-sage-200 hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        Accept & Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}