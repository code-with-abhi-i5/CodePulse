"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <h1 className="text-[180px] md:text-[240px] font-bold leading-none gradient-text select-none">
            404
          </h1>
        </motion.div>

        {/* Floating code elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { text: "<div>", x: "10%", y: "20%", delay: 0 },
            { text: "{ }", x: "80%", y: "15%", delay: 0.5 },
            { text: "=>", x: "15%", y: "70%", delay: 1 },
            { text: "<//>", x: "85%", y: "65%", delay: 1.5 },
            { text: "null", x: "50%", y: "10%", delay: 2 },
            { text: "404", x: "70%", y: "80%", delay: 0.8 },
          ].map((item, i) => (
            <motion.span
              key={i}
              className="absolute font-mono text-white/5 text-2xl"
              style={{ left: item.x, top: item.y }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.15, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut",
              }}
            >
              {item.text}
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Page not found
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
          className="flex items-center justify-center gap-3"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
