import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Simbol Standard Galactic Alphabet
const RUNES = [
    "ᚠᚢᚦᚨ", "ᚱᚲᚷᚹ", "ᚺᚾᛁᛃ", "ᛇᛈᛉᛊ", "ᛏᛒᛖᛗ",
    "ᛞᛟᛝ", "ΔΓΛΞ", "ΨΩΠΣ", "⟁↸⟃", "⚡︎★☾"
];

export default function AnimatedBackground() {
    const [glyphs, setGlyphs] = useState([]);
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // A. Generate GLYPHS (Huruf Enchanting)
        // Jumlah diperbanyak (50) dan posisi disebar random X & Y
        const glyphCount = 50;
        const newGlyphs = Array.from({ length: glyphCount }).map((_, i) => ({
            id: `glyph-${i}`,
            text: RUNES[Math.floor(Math.random() * RUNES.length)],
            left: Math.random() * 100, // Posisi Horizontal 0-100%
            top: Math.random() * 100,  // Posisi Vertikal 0-100%
            scale: Math.random() * 0.8 + 0.8, // Ukuran variatif (besar)
            duration: Math.random() * 4 + 3,  // Durasi siklus (3-7 detik)
            delay: Math.random() * 5, // Delay agar muncul tidak barengan
            rotation: Math.floor(Math.random() * 360), // Rotasi awal acak
        }));
        setGlyphs(newGlyphs);

        // B. Generate PARTICLES (Debu Portal Ungu)
        const particleCount = 40;
        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: `particle-${i}`,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 5 + 5,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#05020a]">
            {/* --- ATMOSPHERE GLOWS (Background Nebula) --- */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-fuchsia-900/15 rounded-full blur-[100px] mix-blend-screen"
            />

            {/* --- PORTAL PARTICLES (Debu Ungu Kecil) --- */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute bg-purple-400 rounded-full"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -40, 0], // Melayang naik turun pelan
                        opacity: [0, 0.8, 0], // Kedip-kedip
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 5,
                    }}
                />
            ))}

            {/* --- ENCHANTING GLYPHS (ANIMASI POP-UP) --- */}
            {glyphs.map((g) => (
                <motion.div
                    key={g.id}
                    className="absolute font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-300 via-fuchsia-300 to-white select-none pointer-events-none"
                    style={{
                        left: `${g.left}%`,
                        top: `${g.top}%`,
                        fontSize: `${g.scale}rem`,
                        fontFamily: "'Courier New', monospace",
                        // Glow effect yang lebih kuat
                        textShadow: "0 0 10px rgba(192, 38, 211, 0.8), 0 0 20px rgba(168, 85, 247, 0.4)",
                        rotate: g.rotation,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        // Keyframes: Muncul (0) -> Membesar (1.2) -> Normal (1) -> Hilang (0)
                        scale: [0, 1.3, 1, 0],
                        opacity: [0, 1, 1, 0],
                        // Sedikit rotasi saat animasi berjalan
                        rotate: [g.rotation, g.rotation + 45],
                    }}
                    transition={{
                        duration: g.duration,
                        repeat: Infinity,
                        // Repeat delay agar ada jeda "kosong" sebelum muncul lagi di tempat yang sama
                        repeatDelay: Math.random() * 5 + 2,
                        ease: "easeInOut",
                        delay: g.delay,
                    }}
                >
                    {g.text}
                </motion.div>
            ))}

            {/* Vignette Gelap */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#05020a_100%)] pointer-events-none"></div>
        </div>
    );
}