// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PauseModal from "../PauseModal";

afterEach(cleanup);

describe("PauseModal dialog interactions", () => {
  it("opens a nested restart confirmation and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<PauseModal onResume={vi.fn()} onRestart={vi.fn()} onQuit={vi.fn()} />);
    const restart = screen.getByTestId("pause-restart-btn");

    await user.click(restart);
    const confirmation = await screen.findByRole("alertdialog", { name: "Restart this match?" });
    expect(confirmation.getAttribute("data-state")).toBe("open");
    await user.click(screen.getByRole("button", { name: "Keep playing" }));
    await waitFor(() => expect(document.activeElement).toBe(restart));
  });

  it("restores focus after closing the controls guide nested over the pause dialog", async () => {
    const user = userEvent.setup();
    render(<PauseModal onResume={vi.fn()} onRestart={vi.fn()} onQuit={vi.fn()} />);
    const guideButton = screen.getByTestId("pause-controls-guide-btn");

    await user.click(guideButton);
    const guide = await screen.findByTestId("first-session-guide");
    expect(guide.getAttribute("data-state")).toBe("open");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("first-session-guide")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(guideButton));
  });
});
