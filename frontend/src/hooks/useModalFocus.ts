import { useLayoutEffect, type RefObject } from "react";

/** Isolate an open overlay, trap keyboard focus, and restore its trigger. */
export function useModalFocus(open: boolean, ref: RefObject<HTMLElement | null>, manageFocus = true) {
    useLayoutEffect(() => {
        const dialog = ref.current;
        if (!open || !dialog) return;
        const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const isolated: { element: HTMLElement; inert: boolean }[] = [];
        let branch: HTMLElement = dialog;
        while (branch.parentElement && branch.parentElement !== document.body) {
            for (const sibling of branch.parentElement.children) {
                if (sibling !== branch && sibling instanceof HTMLElement) {
                    isolated.push({ element: sibling, inert: sibling.inert });
                    sibling.setAttribute("inert", "");
                }
            }
            branch = branch.parentElement;
        }
        const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )).filter(element => !element.closest('[hidden], [inert]') && getComputedStyle(element).visibility !== "hidden" && getComputedStyle(element).display !== "none");
        if (manageFocus) (controls()[0] ?? dialog).focus();
        const keepFocus = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;
            const items = controls();
            const first = items[0];
            const last = items[items.length - 1];
            if (!first || !last) { event.preventDefault(); dialog.focus(); }
            else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        };
        if (manageFocus) document.addEventListener("keydown", keepFocus);
        return () => {
            document.removeEventListener("keydown", keepFocus);
            isolated.forEach(({ element, inert }) => { element.toggleAttribute("inert", inert); });
            if (trigger?.isConnected) trigger.focus();
        };
    }, [open, ref, manageFocus]);
}
