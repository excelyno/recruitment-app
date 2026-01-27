import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const ApplicantContext = createContext();

export function ApplicantProvider({ children }) {
    // --- STATE UTAMA ---
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastFetch, setLastFetch] = useState(0);

    // --- STATE CACHE SOAL (DASHBOARD) ---
    const [questionCache, setQuestionCache] = useState({});

    // --- STATE FORM BUILDER ---
    const [masterForms, setMasterForms] = useState([]);
    const [formsLastFetch, setFormsLastFetch] = useState(0);

    // -----------------------------------------------------------
    // 1. FETCH APPLICANTS (Daftar Peserta)
    // -----------------------------------------------------------
    const fetchApplicants = async (force = false) => {
        const now = Date.now();
        const CACHE_DURATION = 15 * 60 * 1000; // 15 Menit

        if (!force && applicants.length > 0 && (now - lastFetch < CACHE_DURATION)) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, "applicants"));
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setApplicants(data);
            setLastFetch(now);
        } catch (e) {
            console.error("Gagal ambil data:", e);
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------------------------
    // 2. FETCH SOAL PER DIVISI (Untuk Dashboard Detail)
    // -----------------------------------------------------------
    const getDivisionQuestions = async (divisionName) => {
        if (!divisionName) return [];

        // Cek Cache dulu
        if (questionCache[divisionName]) {
            console.log(`⚡ Pakai Cache Soal: ${divisionName}`);
            return questionCache[divisionName];
        }

        console.log(`🔥 Ambil Soal Baru: ${divisionName}`);
        try {
            const docRef = doc(db, "formConfigs", divisionName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const questions = docSnap.data().questions || [];
                // Simpan ke Cache
                setQuestionCache(prev => ({ ...prev, [divisionName]: questions }));
                return questions;
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
        return [];
    };

    // -----------------------------------------------------------
    // 3. FETCH MASTER FORM (Untuk Halaman Form Builder)
    // -----------------------------------------------------------
    const fetchMasterForms = async (force = false) => {
        const now = Date.now();
        const CACHE_DURATION = 10 * 60 * 1000; // 10 Menit

        if (!force && masterForms.length > 0 && (now - formsLastFetch < CACHE_DURATION)) {
            console.log("⚡ Form Builder: Pakai Cache (Instant)");
            return;
        }

        console.log("🔥 Form Builder: Download Data...");
        try {
            const snapshot = await getDocs(collection(db, "formConfigs"));
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMasterForms(data);
            setFormsLastFetch(now);
        } catch (e) {
            console.error("Gagal ambil form:", e);
        }
    };

    // -----------------------------------------------------------
    // 4. SAVE FORM CONFIG (Optimistic Update)
    // -----------------------------------------------------------
    const saveFormConfig = async (divisionId, newQuestions) => {
        try {
            // A. Update Firebase
            const docRef = doc(db, "formConfigs", divisionId);
            await setDoc(docRef, { questions: newQuestions }, { merge: true });

            // B. Update State Form Builder (Biar gak perlu refresh)
            setMasterForms(prev => {
                const index = prev.findIndex(f => f.id === divisionId);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], questions: newQuestions };
                    return updated;
                } else {
                    return [...prev, { id: divisionId, questions: newQuestions }];
                }
            });

            // C. Update juga Cache Dashboard (Biar sinkron)
            setQuestionCache(prev => ({ ...prev, [divisionId]: newQuestions }));

        } catch (error) {
            console.error("Gagal simpan form:", error);
            throw error;
        }
    };

    // Helper: Update Data Peserta Lokal
    const updateApplicantLocal = (id, newData) => {
        setApplicants(prev => prev.map(app =>
            app.id === id ? { ...app, ...newData } : app
        ));
    };

    // Initial Load
    useEffect(() => {
        fetchApplicants();
        fetchMasterForms();
    }, []);

    return (
        <ApplicantContext.Provider value={{
            // State
            applicants,
            loading,
            masterForms,    // <--- JANGAN LUPA INI (PENTING BUAT FORM BUILDER)

            // Functions
            fetchApplicants,
            updateApplicantLocal,
            getDivisionQuestions,
            fetchMasterForms, // <--- JANGAN LUPA INI
            saveFormConfig    // <--- JANGAN LUPA INI
        }}>
            {children}
        </ApplicantContext.Provider>
    );
}

export const useApplicants = () => useContext(ApplicantContext);