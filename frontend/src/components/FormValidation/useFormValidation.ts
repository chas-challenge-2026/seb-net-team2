import { useState } from "react";
import { useTranslation } from "react-i18next";

export type FieldErrors = Record<string, string>;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export function focusField(id: string) {
    const field = document.getElementById(id);
    if (!field) return;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: "center", behavior: "instant" });
}

/** Reuse HTML constraints; custom errors come from existing business validation. */
export function useFormValidation() {
    const { t } = useTranslation();
    const [errors, setErrors] = useState<FieldErrors>({});
    const [attempt, setAttempt] = useState(0);

    function validate(form: HTMLFormElement, custom: FieldErrors = {}) {
        const next: FieldErrors = {};
        for (const element of Array.from(form.elements)) {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) continue;
            const field: Control = element;
            if (!field.id || field.disabled) continue;
            const validity = field.validity;
            const label = field.labels?.[0]?.childNodes[0]?.textContent?.trim() || field.name;
            if (validity.valueMissing) next[field.id] = t("validation.required", { field: label });
            else if (validity.typeMismatch) next[field.id] = t("validation.email");
            else if (validity.badInput) next[field.id] = t("validation.number");
            else if (validity.rangeUnderflow) next[field.id] = t("validation.minimum", { min: field.getAttribute("min") });
            else if (validity.rangeOverflow) next[field.id] = t("validation.maximum", { max: field.getAttribute("max") });
            else if (validity.stepMismatch) next[field.id] = t("validation.step", { step: field.getAttribute("step") });
            else if (!validity.valid) next[field.id] = t("validation.format", { field: label });
            if (custom[field.id] && !next[field.id]) next[field.id] = custom[field.id];
        }
        setErrors(next);
        setAttempt(current => current + 1);
        const first = Object.keys(next)[0];
        if (first) requestAnimationFrame(() => focusField(first));
        return !first;
    }

    function clear(id?: string) {
        setErrors(current => {
            if (!id) return {};
            const next = { ...current };
            delete next[id];
            return next;
        });
    }

    function fieldProps(id: string, description?: string) {
        return {
            "aria-invalid": Boolean(errors[id]),
            "aria-describedby": [description, errors[id] ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined,
        };
    }

    return { errors, attempt, validate, clear, fieldProps };
}
