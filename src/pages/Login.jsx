import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const adminDoc = await getDoc(doc(db, "admins", user.uid));

            if (adminDoc.exists()) {
                navigate("/dashboard");
            } else {
                setError("Akses ditolak.");
                await auth.signOut();
            }
        } catch (err) {
            setError("Email atau password tidak valid.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-200">

            {/* --- ANIMATED BACKGROUND SHAPES --- */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Shape 1: Lingkaran Besar Kiri Atas */}
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float-slow"></div>

                {/* Shape 2: Lingkaran Kanan Bawah */}
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float-medium" style={{ animationDelay: '1s' }}></div>

                {/* Shape 3: Kotak Miring Kecil (Aksen Teknis) */}
                <div className="absolute top-[20%] right-[15%] w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-3xl opacity-20 animate-spin-slow blur-sm"></div>

                {/* Shape 4: Kotak Miring Kecil (Aksen Teknis 2) */}
                <div className="absolute bottom-[20%] left-[15%] w-16 h-16 bg-gradient-to-tr from-teal-400 to-emerald-300 rounded-xl opacity-20 animate-float-fast blur-sm" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* --- GLASS CARD --- */}
            <div className="relative w-full max-w-[380px] p-8 z-10">

                {/* Kartu Transparan */}
                <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/50 p-8">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-400 text-sm font-medium">Please enter your details.</p>
                    </div>

                    {error && (
                        <div className="mb-5 text-center p-3 rounded-xl bg-red-50 text-red-500 text-xs font-semibold border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Email */}
                        <div className="group">
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 px-5 py-4 rounded-2xl border border-gray-200 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="group">
                            <input
                                type="password"
                                required
                                className="w-full bg-white/50 px-5 py-4 rounded-2xl border border-gray-200 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Tombol Utama */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-emerald-600 text-white font-bold text-sm tracking-wide transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}