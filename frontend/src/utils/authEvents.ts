export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export function notifySessionExpired() {
    window.dispatchEvent(
        new Event(SESSION_EXPIRED_EVENT)
    );
}