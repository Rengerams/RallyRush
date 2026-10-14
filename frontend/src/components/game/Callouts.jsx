import { motion, AnimatePresence } from "framer-motion";

const Q = { perfect: ["PERFECT!", "#DFFF00"], good: ["GOOD", "#00F0FF"], late: ["LATE", "#F59E0B"], miss: ["MISS", "#E05A47"] };

export default function Callouts({ call, quality }) {
  return (
    <>
      <AnimatePresence>
        {call && (
          <motion.div key={call.id} data-testid="umpire-call" initial={{ opacity: 0, y: -16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 text-center">
            <p className="font-display whitespace-nowrap text-5xl font-black uppercase italic text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">{call.text}</p>
            {call.sub && <p data-testid="umpire-call-sub" className="mt-1 whitespace-nowrap rounded-full bg-[#0B0E14]/80 px-4 py-1 font-mono text-sm uppercase tracking-[0.2em] text-[#DFFF00]">{call.sub}</p>}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {quality && (
          <motion.p key={quality.id} data-testid="shot-quality" initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="font-display pointer-events-none absolute bottom-[14%] left-1/2 -translate-x-1/2 text-4xl font-black italic" style={{ color: Q[quality.q][1] }}>
            {Q[quality.q][0]}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
