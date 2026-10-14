import { Volume2, VolumeX, Mic, MicOff, Film } from "lucide-react";

export default function PauseModal({ onResume, onRestart, onQuit, sound, voice, onSound, onVoice, replays, onReplays }) {
  return (
    <div data-testid="pause-modal" className="absolute inset-0 z-30 flex items-center justify-center bg-[#0B0E14]/70 backdrop-blur-md">
      <div className="fade-up w-[320px] rounded-2xl border border-white/10 bg-[#121824] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00F0FF]">Time-out</p>
        <h2 className="font-display mt-1 text-5xl font-black uppercase italic">Paused</h2>
        <div className="mt-6 space-y-2">
          <button data-testid="pause-resume-btn" onClick={onResume} className="btn-volt w-full rounded-full py-3 font-display text-xl font-extrabold uppercase">Resume</button>
          <button data-testid="pause-restart-btn" onClick={onRestart} className="btn-ghost w-full rounded-full py-3 font-display text-lg font-bold uppercase">Restart match</button>
          <button data-testid="pause-quit-btn" onClick={onQuit} className="btn-ghost w-full rounded-full py-3 font-display text-lg font-bold uppercase">Quit to setup</button>
        </div>
        <div className="mt-5 flex gap-2">
          <button data-testid="pause-sound-toggle" onClick={onSound} className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm">
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound
          </button>
          <button data-testid="pause-voice-toggle" onClick={onVoice} className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm">
            {voice ? <Mic size={16} /> : <MicOff size={16} />} Umpire
          </button>
        </div>
        <button data-testid="pause-replays-toggle" onClick={onReplays} className={`btn-ghost mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm ${replays ? "text-[#00F0FF]" : "text-slate-500"}`}>
          <Film size={16} /> Replays {replays ? "on" : "off"}
        </button>
        <div className="hidden">
        </div>
      </div>
    </div>
  );
}
