const TOKEN_KEY = "auth_token";

export function getAuthToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}