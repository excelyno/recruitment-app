import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const ApplicantContext = createContext();

export function ApplicantProvider({ children }) {
    // ==========================================
    // 1. STATE MANAGEMENT
    // ==========================================

    const [user, setUser] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Kita hapus 'lastFetch' manual, karena sekarang dikontrol oleh Interval
    const [adminProfile, setAdminProfile] = useState({ role: "", division: "", name: "" });
    const [adminLoading, setAdminLoading] = useState(true);
    const [questionCache, setQuestionCache] = useState({});

    // ==========================================
    // 2. FETCH DATA FUNCTIONS
    // ==========================================

    // --- FETCH PELAMAR (DENGAN USECALLBACK) ---
    const fetchApplicants = useCallback(async () => {
        setLoading(true);
        console.log("🔄 Syncing: Mengambil data pelamar terbaru...");

        try {
            // NANTI: Di sini bisa ditambah logic 'where' untuk hemat kuota berdasarkan divisi
            const snapshot = await getDocs(collection(db, "applicants"));

            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort data terbaru di atas
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setApplicants(data);
        } catch (e) {
            console.error("❌ Gagal ambil pelamar:", e);
        } finally {
            setLoading(false);
        }
    }, []); // Dependency kosong agar fungsi stabil

    // --- SMART POLLING (AUTO-REFRESH 5 MENIT) ---
    useEffect(() => {
        // 1. Load pertama kali saat aplikasi dibuka
        fetchApplicants();

        // 2. Setup Timer 5 Menit (300.000 ms)
        const intervalId = setInterval(() => {
            // HANYA refresh jika user sedang melihat tab (Hemat Kuota & Baterai)
            if (document.visibilityState === 'visible') {
                console.log("⏰ Auto-Sync 5 Menit Triggered");
                fetchApplicants();
            } else {
                console.log("⏸️ Tab Inactive: Auto-Sync ditunda (Hemat Kuota)");
            }
        }, 300000); // <--- 5 MENIT

        // 3. Cleanup saat component unmount (Mencegah memory leak)
        return () => clearInterval(intervalId);
    }, [fetchApplicants]);


    // --- FETCH ADMIN PROFILE ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const docRef = doc(db, "admins", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        let detectedDivision = data.division || data.divisi || "";
                        if (!detectedDivision && data.role !== "superadmin") {
                            detectedDivision = data.role;
                        }

                        console.log("✅ LOGIN ADMIN:", data.name, "| DIVISI:", detectedDivision);

                        setAdminProfile({
                            name: data.name || data.nama || "Admin",
                            role: data.role || "guest",
                            division: detectedDivision.toLowerCase()
                        });
                    } else {
                        setAdminProfile({ role: "guest", division: "", name: "Guest" });
                    }
                } catch (error) {
                    console.error("Error fetch admin:", error);
                }
            } else {
                setAdminProfile({ role: "guest", division: "", name: "" });
            }
            setAdminLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- FETCH SOAL PER DIVISI ---
    const getDivisionQuestions = async (divisionName) => {
        if (!divisionName) return [];

        // Cek Cache Lokal dulu (Hemat Read)
        if (questionCache[divisionName]) return questionCache[divisionName];

        try {
            const docRef = doc(db, "formConfigs", divisionName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const questions = docSnap.data().questions || [];
                // Simpan ke cache
                setQuestionCache(prev => ({ ...prev, [divisionName]: questions }));
                return questions;
            } else {
                console.warn(`⚠️ Config form untuk ${divisionName} belum dibuat.`);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
        return [];
    };

    // ==========================================
    // 3. UPDATE FUNCTIONS
    // ==========================================

    const saveFormConfig = async (divisionId, newQuestions) => {
        try {
            const docRef = doc(db, "formConfigs", divisionId);
            await setDoc(docRef, { questions: newQuestions, updatedAt: new Date() }, { merge: true });

            setQuestionCache(prev => ({ ...prev, [divisionId]: newQuestions }));
            return true;
        } catch (error) {
            console.error("Gagal simpan form:", error);
            throw error;
        }
    };

    const updateApplicantLocal = (id, newData) => {
        setApplicants(prev => prev.map(app =>
            app.id === id ? { ...app, ...newData } : app
        ));
    };

    return (
        <ApplicantContext.Provider value={{
            user,
            applicants,
            loading,
            adminProfile,
            adminLoading,
            fetchApplicants, // Fungsi ini sekarang aman dipanggil manual tombol "Sync"
            updateApplicantLocal,
            getDivisionQuestions,
            saveFormConfig
        }}>
            {children}
        </ApplicantContext.Provider>
    );
}

export const useApplicants = () => useContext(ApplicantContext);