import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";
import LoadingScreen from "./LoadingScreen";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react"; // Import Menu dan X untuk variasi

export default function DashboardLayout() {
    // State toggle sidebar
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userRole, setUserRole] = useState("guest");
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const init = async () => {
            const user = auth.currentUser;
            if (user) {
                const cachedRole = localStorage.getItem("user_role");
                if (cachedRole) {
                    setUserRole(cachedRole);
                    setLoading(false);
                    return;
                }
                try {
                    const adminRef = doc(db, "admins", user.uid);
                    const adminSnap = await getDoc(adminRef);
                    if (adminSnap.exists()) {
                        const role = adminSnap.data().role || "guest";
                        setUserRole(role);
                        localStorage.setItem("user_role", role);
                    }
                } catch (e) {
                    console.error("Error role", e);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    // Function Toggle (Buka/Tutup)
    const toggleSidebar = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden relative">
            <AnimatedBackground />

            {/* 1. LOADING SCREEN */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        key="global-loader"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <LoadingScreen />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. SIDEBAR */}
            <div className={`z-40 transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <Sidebar
                    userRole={userRole}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />
            </div>

            {/* 3. KONTEN UTAMA WRAPPER */}
            <main className="flex-1 flex flex-col min-w-0 h-screen bg-slate-50/50 relative">

                {/* --- HEADER MOBILE (Dengan Button Premium) --- */}
                <header className="md:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center px-4 shrink-0 sticky top-0 z-30 shadow-sm">
                    {/* TOMBOL MENU "SAKTI" */}
                    <button
                        onClick={toggleSidebar}
                        className="group relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 
                                   shadow-sm hover:shadow-md hover:shadow-sky-200/40 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 
                                   active:scale-95 transition-all duration-300 ease-out"
                        aria-label="Toggle Menu"
                    >
                        {/* Icon akan berubah sedikit warnanya saat hover */}
                        <Menu
                            size={24}
                            className="transition-transform duration-300 group-hover:rotate-180"
                        />
                    </button>

                    {/* Branding Text */}
                    <span className="ml-4 font-bold text-lg tracking-tight text-slate-700 select-none">
                        Recruit<span className="text-sky-500">LAWOS</span>
                    </span>
                </header>

                {/* --- AREA KONTEN SCROLLABLE --- */}
                <div className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="md:px-10 md:py-8 px-4 py-8 max-w-[1600px] mx-auto min-h-full">
                        {!loading && (
                            <div
                                key={location.pathname}
                                className="w-full h-full animate-enter"
                            >
                                <Outlet context={{ userRole }} />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}