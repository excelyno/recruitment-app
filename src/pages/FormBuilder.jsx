import { useState, useEffect } from "react";
import { useApplicants } from "../context/ApplicantContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Save, Layers, Loader2,
    CheckCircle, AlertCircle, X, Lock
} from "lucide-react";
// 1. IMPORT PENJAGA
import FeatureGuard from "../components/FeatureGuard";

// ==========================================
// 🚨 SAKLAR UTAMA (HARDCODE) 🚨
// Ganti ke 'true' jika Anda ingin mengedit form.
// Kembalikan ke 'false' setelah selesai agar aman.
// ==========================================
const ENABLE_FORM_BUILDER = true;

// 2. KOMPONEN UTAMA (HANYA SEBAGAI PINTU GERBANG)
export default function FormBuilder() {
    return (
        <FeatureGuard isActive={ENABLE_FORM_BUILDER}>
            <FormBuilderContent />
        </FeatureGuard>
    );
}

// 3. LOGIKA ASLI FORM BUILDER (DIPINDAHKAN KE SINI)
function FormBuilderContent() {
    // --- AMBIL PROFIL ADMIN & FUNGSI DARI CONTEXT ---
    const {
        getDivisionQuestions,
        saveFormConfig,
        adminProfile,
        adminLoading
    } = useApplicants();

    const [selectedDivision, setSelectedDivision] = useState("acara");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State Toast
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Helper Toast
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- SET DIVISI OTOMATIS BERDASARKAN ROLE ---
    useEffect(() => {
        if (!adminLoading && adminProfile?.role) {
            if (adminProfile.role !== 'superadmin') {
                setSelectedDivision(adminProfile.division);
            }
        }
    }, [adminProfile, adminLoading]);

    // --- FETCH PERTANYAAN ---
    useEffect(() => {
        if (adminLoading) return;

        let isMounted = true;
        const fetchConfig = async () => {
            setLoading(true);
            setQuestions([]);
            try {
                const data = await getDivisionQuestions(selectedDivision);
                if (isMounted) setQuestions(data || []);
            } catch (e) {
                console.error("Error fetching config:", e);
                showToast("Gagal memuat pertanyaan.", "error");
            } finally {
                if (isMounted) setTimeout(() => setLoading(false), 300);
            }
        };

        if (selectedDivision) {
            fetchConfig();
        }

        return () => { isMounted = false; };
    }, [selectedDivision, getDivisionQuestions, adminLoading]);

    // --- SIMPAN CONFIG ---
    const handleSave = async () => {
        setSaving(true);
        try {
            await saveFormConfig(selectedDivision, questions);
            showToast("Berhasil menyimpan perubahan!", "success");
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan. Cek koneksi.", "error");
        } finally {
            setSaving(false);
        }
    };

    // --- HELPER FUNCTIONS ---
    const addQuestion = () => {
        const newId = crypto.randomUUID();
        setQuestions([...questions, { id: newId, text: "", type: "text" }]);
    };

    const deleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    // --- RENDER LOADING AWAL ---
    if (adminLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }
    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-32 md:pb-24 px-4 md:px-0 relative">

            {/* --- TOAST NOTIFICATION --- */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 0 }} // X:0 agar center di mobile
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 0 }}
                        className={`fixed top-4 left-4 right-4 md:left-auto md:top-24 md:right-8 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-md ${toast.type === 'success'
                            ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50/95 border-rose-200 text-rose-800'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-bold">
                                {toast.type === 'success' ? 'Sukses' : 'Error'}
                            </span>
                            <span className="text-xs font-medium opacity-80 leading-tight">{toast.message}</span>
                        </div>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:bg-black/5 p-1 rounded-full shrink-0">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HEADER & SELECTOR --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 pt-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">Form Builder</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">Sesuaikan pertanyaan khusus untuk setiap divisi.</p>
                </div>

                {/* Division Selector Card */}
                <div className={`p-1.5 pl-2 rounded-xl border shadow-sm flex items-center gap-2 transition-colors w-full md:w-auto ${adminProfile.role !== 'superadmin' ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200'
                    }`}>
                    <div className={`p-2 rounded-lg shrink-0 ${adminProfile.role !== 'superadmin' ? 'bg-slate-200 text-slate-500' : 'bg-sage-100 text-sage-600'
                        }`}>
                        {adminProfile.role !== 'superadmin' ? <Lock size={18} /> : <Layers size={18} />}
                    </div>

                    <div className="flex-1 relative">
                        {adminProfile.role === 'superadmin' ? (
                            <>
                                <span className="absolute text-[10px] font-bold text-slate-400 -top-1 left-1">PILIH DIVISI</span>
                                <select
                                    value={selectedDivision}
                                    onChange={(e) => setSelectedDivision(e.target.value)}
                                    className="w-full bg-transparent font-bold text-slate-700 text-sm outline-none cursor-pointer py-1 appearance-none pr-8"
                                >
                                    <option value="acara">Divisi Acara</option>
                                    <option value="humas">Divisi Humas</option>
                                    <option value="pdd">Divisi PDD</option>
                                    <option value="perkab">Divisi Perkap</option>
                                </select>
                            </>
                        ) : (
                            <div className="font-bold text-slate-500 px-2 uppercase tracking-wider text-xs md:text-sm">
                                Divisi {selectedDivision}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- STATIC FIELDS INFO --- */}
            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 border-dashed">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Default Fields</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Otomatis muncul di semua formulir)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-60">
                    {['Nama Lengkap', 'Program Studi', 'Angkatan'].map((field) => (
                        <div key={field} className="bg-white px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 cursor-not-allowed flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                            {field}
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-px bg-slate-200 w-full"></div>

            {/* --- DYNAMIC QUESTIONS AREA --- */}
            <div className="space-y-4 min-h-[300px]">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg md:text-xl font-bold text-slate-700 flex items-center gap-2">
                        Pertanyaan
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-sm uppercase border border-emerald-200">{selectedDivision}</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white/50 rounded-3xl border border-slate-100 border-dashed">
                        <Loader2 className="animate-spin text-sage-500" size={32} />
                        <span className="text-slate-400 text-sm font-medium">Memuat pertanyaan...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {questions.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm mx-1"
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Layers size={32} />
                                </div>
                                <p className="text-slate-500 mb-6 font-medium text-sm">Belum ada pertanyaan kustom untuk divisi ini.</p>
                                <button
                                    onClick={addQuestion}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full transition shadow-lg shadow-emerald-200"
                                >
                                    + Buat Pertanyaan Pertama
                                </button>
                            </motion.div>
                        )}

                        {questions.map((q, index) => (
                            <motion.div
                                layout
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="group relative bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all hover:border-emerald-300"
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Header Kartu: Label & Tipe */}
                                    <div className="flex justify-between items-start md:items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            Q{index + 1}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <select
                                                value={q.type}
                                                onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                                                className="text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                                            >
                                                <option value="text">Jawaban Singkat</option>
                                                <option value="longtext">Esai Panjang</option>
                                                <option value="scale">Skala 1-10</option>
                                            </select>

                                            {/* Delete Btn: Visible on Mobile, Hover on Desktop */}
                                            <button
                                                onClick={() => deleteQuestion(q.id)}
                                                className="p-1.5 text-rose-400 md:text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition 
                                                md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                                title="Hapus Pertanyaan"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Input Pertanyaan */}
                                    <div className="relative group/input">
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                                            className="w-full text-base md:text-lg font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0 bg-transparent transition focus:text-emerald-800"
                                            placeholder="Tulis pertanyaanmu di sini..."
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-focus-within/input:w-full opacity-50"></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!loading && questions.length > 0 && (
                    <motion.button
                        layout
                        onClick={addQuestion}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition flex items-center justify-center gap-2 group"
                    >
                        <div className="bg-slate-100 p-1 rounded-full group-hover:bg-emerald-100 transition-colors">
                            <Plus size={18} />
                        </div>
                        Tambah Pertanyaan
                    </motion.button>
                )}
            </div>

            {/* --- FLOATING SAVE BUTTON --- */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: questions.length > 0 ? 0 : 100 }}
                className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-40 w-full md:w-auto px-4 md:px-0"
            >
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto justify-center bg-slate-900 text-white pl-6 pr-8 py-3.5 rounded-full font-bold shadow-2xl hover:bg-emerald-600 active:bg-emerald-700 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </motion.div>
        </div>
    );
}