import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const PADS = [
  { k: "up", icon: ChevronUp, cls: "col-start-2" },
  { k: "left", icon: ChevronLeft, cls: "col-start-1 row-start-2" },
  { k: "down", icon: ChevronDown, cls: "col-start-2 row-start-2" },
  { k: "right", icon: ChevronRight, cls: "col-start-3 row-start-2" },
];

export default function DPad({ onKey }) {
  return (
    <div className="grid w-36 grid-cols-3 grid-rows-2 gap-1.5 lg:hidden">
      {PADS.map(({ k, icon: Icon, cls }) => (
        <button key={k} type="button" data-testid={`dpad-${k}`} className={`${cls} flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 active:bg-[#DFFF00]/20`}
          onPointerDown={() => onKey(k, true)} onPointerUp={() => onKey(k, false)} onPointerLeave={() => onKey(k, false)}>
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
}
