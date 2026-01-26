import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
                setError("Restricted Access.");
                await auth.signOut();
            }
        } catch (err) {
            setError("Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-sm"
            >
                <div className="glass p-10 rounded-3xl text-center">
                    <motion.div
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="w-16 h-16 bg-sage-200 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl"
                    >
                        🌿
                    </motion.div>

                    <h1 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-400 text-sm mb-8">Please enter your details.</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-xs text-rose-500 bg-rose-50 p-2 rounded-lg mb-4 font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4 text-left">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sage-300 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sage-300 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Password"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-bold text-sm transition-all shadow-lg shadow-sage-200 disabled:opacity-50 mt-2"
                        >
                            {loading ? "..." : "Sign In"}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}