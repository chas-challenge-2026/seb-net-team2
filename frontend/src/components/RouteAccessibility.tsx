import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import i18n from "../i18n/i18n";

function titleKey(path: string) {
    if (path === "/" || path === "/login" || path === "/logout") return "a11y.login";
    if (path === "/register") return "a11y.register";
    if (path === "/dashboard") return "navigation.dashboard";
    if (path === "/ny-betalning") return "navigation.newPayment";
    if (path === "/spara-investera") return "saveInvest.title";
    if (path === "/bolan") return "a11y.mortgage";
    if (path === "/profil") return "profilePage.title";
    if (path === "/attestkorg") return "approvalInbox.title";
    if (path === "/granskningslogg") return "auditLog.title";
    if (path === "/admin" || path === "/admin/") return "admin.dashboard.title";
    if (path.startsWith("/admin/users")) return path.endsWith("/create") ? "users.create.title" : path.endsWith("/edit") ? "users.edit.title" : "users.list.title";
    if (path.startsWith("/admin/approval-limits")) return path.endsWith("/create") ? "approvalLimits.create.title" : path.endsWith("/edit") ? "approvalLimits.edit.title" : "approvalLimits.list.title";
    return undefined;
}

export function RouteAccessibility() {
    const pathname = useRouterState({ select: state => state.location.pathname });
    useEffect(() => {
        const main = document.getElementById("main-content");
        if (!main) return;
        let focused = false;
        const update = () => {
            const heading = main.querySelector("h1");
            const key = titleKey(pathname);
            document.title = `${key ? i18n.t(key) : heading?.textContent?.trim() || "SEB"} – SEB`;
            if (!heading) return;
            if (!focused && !document.querySelector('[aria-modal="true"]')) {
                heading.tabIndex = -1;
                heading.focus({ preventScroll: true });
                focused = true;
            }
        };
        const frame = requestAnimationFrame(update);
        const observer = new MutationObserver(update);
        observer.observe(main, { childList: true, subtree: true, characterData: true });
        i18n.on("languageChanged", update);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); i18n.off("languageChanged", update); };
    }, [pathname]);
    return null;
}
