import { useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { MAX_BACKUP_BYTES, deleteLocalData, exportLocalData, importLocalData, parseLocalDataBackup } from "@/lib/api";

export default function LocalDataControls() {
  const fileRef = useRef(null);
  const [pendingBackup, setPendingBackup] = useState(null);
  const [message, setMessage] = useState("");

  const downloadBackup = () => {
    try {
      const blob = new Blob([exportLocalData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rally-rush-save-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded.");
    } catch {
      setMessage("Could not create a backup from this device.");
    }
  };

  const chooseBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup file is too large.");
      const text = await file.text();
      const preview = parseLocalDataBackup(text);
      setPendingBackup({ text, matchCount: preview.matches.length, playerName: preview.setup.name });
      setMessage("");
    } catch (error) {
      setPendingBackup(null);
      setMessage(error.message || "This backup could not be read.");
    }
  };

  const confirmImport = () => {
    if (!pendingBackup) return;
    try {
      const result = importLocalData(pendingBackup.text);
      setMessage(`Imported setup for ${result.setup.name} and ${result.matchCount} match records.`);
      setPendingBackup(null);
      window.location.reload();
    } catch (error) {
      setMessage(error.message || "The backup could not be imported.");
    }
  };

  const deleteData = () => {
    if (!window.confirm("Delete Rally Rush setup, preferences, tutorial progress, and match history from this device?")) return;
    deleteLocalData();
    window.location.reload();
  };

  return (
    <section aria-labelledby="local-data-title" className="rounded-2xl border border-white/10 bg-[#121824] p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF]">Device storage</p>
      <h2 id="local-data-title" className="font-display mt-1 text-3xl font-black uppercase italic">Local data &amp; backups</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">Match records and setup stay on this device. Rally Rush does not upload them. Export a versioned JSON backup to keep a copy or transfer it to another device.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" data-testid="local-data-export" onClick={downloadBackup} className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 text-sm"><Download size={15} /> Export backup</button>
        <button type="button" data-testid="local-data-choose-import" onClick={() => fileRef.current?.click()} className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 text-sm"><Upload size={15} /> Choose backup</button>
        <button type="button" data-testid="local-data-delete" onClick={deleteData} className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 text-sm text-rose-300"><Trash2 size={15} /> Delete local data</button>
        <input ref={fileRef} data-testid="local-data-file" className="sr-only" type="file" accept="application/json,.json" onChange={chooseBackup} />
      </div>
      {pendingBackup && <div data-testid="local-data-import-preview" className="mt-4 rounded-xl border border-[#DFFF00]/25 bg-[#DFFF00]/5 p-4">
        <p className="text-sm text-white">Backup for <b>{pendingBackup.playerName}</b> · {pendingBackup.matchCount} match records.</p>
        <p className="mt-1 text-xs text-slate-300">Import replaces the current setup and match history on this device.</p>
        <div className="mt-3 flex gap-2">
          <button type="button" data-testid="local-data-import-confirm" onClick={confirmImport} className="btn-volt rounded-full px-4 py-2 text-xs font-bold uppercase">Import backup</button>
          <button type="button" data-testid="local-data-import-cancel" onClick={() => setPendingBackup(null)} className="btn-ghost rounded-full px-4 py-2 text-xs">Cancel</button>
        </div>
      </div>}
      {message && <p data-testid="local-data-status" role="status" aria-live="polite" className="mt-3 text-xs text-slate-300">{message}</p>}
    </section>
  );
}
