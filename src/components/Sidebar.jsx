import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Users, ClipboardList,
    FileEdit, LogOut, X, ShieldCheck
} from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Sidebar({ userRole = "guest", mobileOpen, setMobileOpen }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    // --- KONFIGURASI MENU ---
    const links = [
        {
            to: "/DaShbOaRd",
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            roles: ["all"]
        },
        // --- MENU SAKTI (GLOBAL LIST) ---
        // Perbaikan: Role 'ketua' & 'bph' ditambahkan di sini agar bisa lihat semua data
        {
            to: "/gLoBaL-aCcEpTeD",
            label: "Global List (Semua)",
            icon: <ShieldCheck size={20} />,
            roles: ["superadmin", "ketua", "bph"]
        },
        // --- FORM BUILDER ---
        {
            to: "/fOrM-bUiLdEr",
            label: "Form Builder",
            icon: <FileEdit size={20} />,
            roles: ["superadmin", "acara", "ketua"] // Ketua juga bisa edit form jika perlu
        },
        // --- DIVISI SAYA ---
        {
            to: "/mY-dIvIsIoN",
            label: "Divisi Saya",
            icon: <ClipboardList size={20} />,
            roles: ["acara", "humas", "pdd", "perkab"]
            // Pastikan semua role divisi tertulis disini
        }
    ];

    // Filter menu berdasarkan Role Login
    const filteredLinks = links.filter(link =>
        link.roles.includes("all") || link.roles.includes(userRole)
    );

    // --- KOMPONEN KONTEN SIDEBAR ---
    const SidebarContent = () => (
        <div className="h-full flex flex-col bg-white border-r border-slate-200">
            {/* 1. Header Logo */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20 mr-3">
                    L
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-800">
                    Recruit<span className="text-sky-500">LAWOS</span>
                </span>
            </div>

            {/* 2. Menu Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Main Menu ({userRole})
                </p>
                {filteredLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100"
                                : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Indikator Garis Biru di Kiri */}
                                <span
                                    className={`absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-r-full transition-transform duration-300 ${isActive ? 'scale-y-100 translate-x-0' : 'scale-y-0 -translate-x-full'
                                        }`}
                                />

                                <span className="relative z-10 flex items-center gap-3">
                                    {link.icon}
                                    {link.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* 3. Footer / Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-rose-100 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:block w-64 h-screen sticky top-0 z-30 shrink-0">
                <SidebarContent />
            </aside>

            {/* --- MOBILE SIDEBAR --- */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop Gelap */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                        />

                        {/* Panel Slide */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="md:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-white shadow-2xl"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-5 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}