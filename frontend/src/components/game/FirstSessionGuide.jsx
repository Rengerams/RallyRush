import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, BookOpen, X } from "lucide-react";
import { getTutorialTransition, markTutorialComplete, TUTORIAL_STEPS } from "@/lib/tutorial";

export default function FirstSessionGuide({ open, onOpenChange }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const move = (action) => {
    const next = getTutorialTransition(step, action);
    setStep(next.step);
    if (next.complete) {
      markTutorialComplete();
      onOpenChange(false);
    }
  };
  const current = TUTORIAL_STEPS[step];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#05080d]/85 backdrop-blur-md" />
        <Dialog.Content data-testid="first-session-guide" aria-describedby="first-session-guide-description"
          className="fixed inset-x-4 top-1/2 z-[70] mx-auto max-h-[calc(100dvh-2rem)] w-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#121824] p-5 shadow-2xl outline-none fade-up sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF]"><BookOpen size={14} /> Rally Rush guide</p>
              <Dialog.Title className="font-display mt-2 text-4xl font-black uppercase italic text-white">{current.title}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close guide" className="btn-ghost rounded-full p-2"><X size={16} /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description id="first-session-guide-description" className="mt-4 text-sm leading-relaxed text-slate-200">{current.body}</Dialog.Description>
          <p className="mt-3 rounded-lg border border-[#DFFF00]/20 bg-[#DFFF00]/5 px-3 py-2 font-mono text-xs text-[#DFFF00]">{current.cue}</p>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span data-testid="guide-progress" className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Step {step + 1} of {TUTORIAL_STEPS.length}</span>
            <div className="flex items-center gap-2">
              <button data-testid="guide-skip-btn" type="button" onClick={() => move("skip")} className="btn-ghost rounded-full px-3 py-2 text-xs">Skip guide</button>
              {step > 0 && <button data-testid="guide-back-btn" type="button" onClick={() => move("back")} aria-label="Previous guide step" className="btn-ghost rounded-full p-2"><ArrowLeft size={16} /></button>}
              <button data-testid="guide-continue-btn" type="button" onClick={() => move("continue")} className="btn-volt flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase">
                {step === TUTORIAL_STEPS.length - 1 ? "Finish" : "Continue"} {step < TUTORIAL_STEPS.length - 1 && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
