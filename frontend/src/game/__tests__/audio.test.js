import { afterEach, describe, expect, it, vi } from "vitest";
import { audio, selectUmpireVoice } from "../audio";

describe("umpire voice selection", () => {
  it("prefers an available British English male voice and falls back to English", () => {
    const voices = [
      { name: "US English", lang: "en-US", default: true },
      { name: "Daniel", lang: "en-GB" },
      { name: "Français", lang: "fr-FR" },
    ];
    expect(selectUmpireVoice(voices)).toBe(voices[1]);
    expect(selectUmpireVoice([voices[0]])).toBe(voices[0]);
    expect(selectUmpireVoice([voices[2]])).toBeNull();
  });

  it("speaks match calls with clear, natural English umpire delivery", () => {
    class UtteranceMock {
      constructor(text) { this.text = text; }
    }
    const voice = { name: "Daniel", lang: "en-GB" };
    const synth = { getVoices: () => [voice], cancel: vi.fn(), speak: vi.fn() };
    vi.stubGlobal("window", { speechSynthesis: synth });
    vi.stubGlobal("SpeechSynthesisUtterance", UtteranceMock);
    audio.voice = true;

    audio.say("Winner. Fifteen love.");

    expect(synth.cancel).toHaveBeenCalledOnce();
    const [utterance] = synth.speak.mock.calls[0];
    expect(utterance.text).toBe("Winner. Fifteen love.");
    expect(utterance.lang).toBe("en-GB");
    expect(utterance.voice).toBe(voice);
    expect(utterance.rate).toBe(0.9);
    expect(utterance.pitch).toBe(0.96);
  });
});

afterEach(() => {
  audio.voice = true;
  vi.unstubAllGlobals();
});
