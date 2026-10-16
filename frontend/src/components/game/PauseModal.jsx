import { useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Volume2, VolumeX, Mic, MicOff, Film, BookOpen } from "lucide-react";
import FirstSessionGuide from "@/components/game/FirstSessionGuide";

export default function PauseModal({ onResume, onRestart, onQuit, sound, voice, onSound, onVoice, replays, onReplays, displayPrefs = { hudSize: "normal", reducedEffects: false, reducedMotion: false, shotHoldMs: 150 }, onDisplayPrefChange = () => {} }) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideTriggerRef = useRef(null);

  return (
    <>
    <Dialog.Root open onOpenChange={(open) => !open && onResume()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0B0E14]/70 backdrop-blur-md" />
        <Dialog.Content data-testid="pause-modal" className="fixed inset-x-4 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-auto max-w-[320px] -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#121824] p-6 outline-none fade-up sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00F0FF]">Rally Rush · Time-out</p>
          <Dialog.Title className="font-display mt-1 text-5xl font-black uppercase italic">Paused</Dialog.Title>
          <Dialog.Description className="sr-only">The match is paused. Resume, restart the match, or return to setup.</Dialog.Description>
          <div className="mt-6 space-y-2">
            <button data-testid="pause-resume-btn" onClick={onResume} className="btn-volt w-full rounded-full py-3 font-display text-xl font-extrabold uppercase">Resume</button>
            <AlertDialog.Root open={confirmRestart} onOpenChange={setConfirmRestart}>
              <AlertDialog.Trigger asChild>
                <button data-testid="pause-restart-btn" className="btn-ghost w-full rounded-full py-3 font-display text-lg font-bold uppercase">Restart match</button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-[#0B0E14]/80 backdrop-blur-sm" />
                <AlertDialog.Content className="fixed inset-x-4 top-1/2 z-[60] mx-auto w-auto max-w-sm -translate-y-1/2 rounded-2xl border border-white/10 bg-[#121824] p-6 outline-none sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2">
                  <AlertDialog.Title className="font-display text-2xl font-black uppercase">Restart this match?</AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-slate-300">The current score and match statistics will be lost.</AlertDialog.Description>
                  <div className="mt-6 flex justify-end gap-2">
                    <AlertDialog.Cancel asChild>
                      <button className="btn-ghost rounded-full px-4 py-2 text-sm">Keep playing</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button data-testid="pause-restart-confirm-btn" onClick={onRestart} className="btn-volt rounded-full px-4 py-2 text-sm font-bold uppercase">Restart</button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
            <button data-testid="pause-quit-btn" onClick={onQuit} className="btn-ghost w-full rounded-full py-3 font-display text-lg font-bold uppercase">Quit to setup</button>
          </div>
          <div className="mt-5 flex gap-2">
            <button data-testid="pause-sound-toggle" aria-pressed={sound} onClick={onSound} className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm">
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound
            </button>
            <button data-testid="pause-voice-toggle" aria-pressed={voice} onClick={onVoice} className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm">
              {voice ? <Mic size={16} /> : <MicOff size={16} />} Umpire
            </button>
          </div>
          <button data-testid="pause-replays-toggle" aria-pressed={replays} onClick={onReplays} className={`btn-ghost mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm ${replays ? "text-[#00F0FF]" : "text-slate-400"}`}>
            <Film size={16} /> Replays {replays ? "on" : "off"}
          </button>
          <section aria-label="Match display preferences" className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-slate-300">Accessibility</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" data-testid="pause-hud-size-toggle" aria-pressed={displayPrefs.hudSize === "large"} onClick={() => onDisplayPrefChange("hudSize", displayPrefs.hudSize === "large" ? "normal" : "large")} className="btn-ghost rounded-lg px-2 py-2 text-xs">
                HUD text · {displayPrefs.hudSize === "large" ? "Large" : "Normal"}
              </button>
              <button type="button" data-testid="pause-reduced-effects-toggle" aria-pressed={displayPrefs.reducedEffects} onClick={() => onDisplayPrefChange("reducedEffects", !displayPrefs.reducedEffects)} className="btn-ghost rounded-lg px-2 py-2 text-xs">
                Reduced effects · {displayPrefs.reducedEffects ? "On" : "Off"}
              </button>
              <button type="button" data-testid="pause-reduced-motion-toggle" aria-pressed={displayPrefs.reducedMotion} onClick={() => onDisplayPrefChange("reducedMotion", !displayPrefs.reducedMotion)} className="btn-ghost col-span-2 rounded-lg px-2 py-2 text-xs">
                Reduced motion · {displayPrefs.reducedMotion ? "On" : "Off"}
              </button>
            </div>
            <label htmlFor="shot-hold-delay" className="mt-3 block font-mono text-[10px] uppercase tracking-wider text-slate-300">Touch hold delay · {displayPrefs.shotHoldMs} ms</label>
            <input id="shot-hold-delay" data-testid="pause-shot-hold-delay" type="range" min="100" max="250" step="25" value={displayPrefs.shotHoldMs}
              onChange={(event) => onDisplayPrefChange("shotHoldMs", Number(event.target.value))}
              className="mt-2 w-full accent-[#DFFF00]" aria-label="Touch shot preparation delay" />
            <p className="mt-1 text-[11px] leading-snug text-slate-400">Lower values prepare sooner; raise it if scrolling triggers a shot.</p>
            <p className="col-span-2 mt-1 text-[11px] leading-snug text-slate-400">System reduced-motion settings are always respected.</p>
          </section>
          <button data-testid="pause-controls-guide-btn" onClick={(event) => { guideTriggerRef.current = event.currentTarget; setGuideOpen(true); }} className="btn-ghost mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm">
            <BookOpen size={16} /> Controls guide
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <FirstSessionGuide open={guideOpen} onOpenChange={setGuideOpen} returnFocusRef={guideTriggerRef} />
    </>
  );
}
