// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth"; // IMPORT BARU: onAuthStateChanged
import { useNavigate } from "react-router-dom";
import RecruitCard from "../components/RecruitCard";

export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true); // Loading awal aplikasi
    const navigate = useNavigate();

    useEffect(() => {
        // FUNGSI INI AKAN MEMANTAU STATUS LOGIN TERUS MENERUS
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // --- JIKA USER DITEMUKAN (Sudah Login) ---
                console.log("User terdeteksi:", user.email);

                try {
                    // 1. Ambil Data Admin dari Firestore
                    const docRef = doc(db, "admins", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const adminData = docSnap.data();
                        setUserData(adminData);

                        // 2. Ambil Data Pelamar sesuai Role
                        const q = query(
                            collection(db, "applicants"),
                            where("divisi", "==", adminData.role)
                        );

                        const querySnapshot = await getDocs(q);
                        const pelamarList = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                        setApplicants(pelamarList);

                    } else {
                        // Login di Auth berhasil, tapi tidak ada data di database 'admins'
                        alert("Akun Anda tidak terdaftar sebagai Admin!");
                        await signOut(auth);
                        navigate("/");
                    }
                } catch (error) {
                    console.error("Error mengambil data:", error);
                } finally {
                    setLoading(false); // Matikan loading setelah data siap
                }

            } else {
                // --- JIKA TIDAK ADA USER (Belum Login) ---
                console.log("Tidak ada user login, kembali ke halaman utama.");
                navigate("/");
                setLoading(false);
            }
        });

        // Cleanup listener ketika pindah halaman (biar tidak memori leak)
        return () => unsubscribe();

    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    // TAMPILAN LOADING (Penting agar tidak blank putih saat refresh)
    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-semibold">Memuat Data Dashboard...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <h1 className="font-bold text-xl text-gray-800">Recruit<span className="text-blue-600">App</span></h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase">
                        {userData?.role}
                    </span>
                    <button onClick={handleLogout} className="text-red-500 text-sm font-bold hover:underline">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Dashboard Seleksi</h2>
                        <p className="text-gray-500 mt-1">Menampilkan pelamar untuk divisi <span className="font-bold uppercase text-blue-600">{userData?.role}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-gray-800">{applicants.length}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Pelamar</p>
                    </div>
                </div>

                {applicants.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 text-lg">Belum ada pelamar masuk untuk divisi ini.</p>
                        <p className="text-sm text-gray-300 mt-2">Sebarkan link pendaftaran: /daftar</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applicants.map((pelamar) => (
                            <RecruitCard key={pelamar.id} dataPelamar={pelamar} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}