import { useState } from "react";
import { useTranslation } from "react-i18next";

export type FieldErrors = Record<string, string>;
export type TranslatedError = { key: string; fieldKey?: string; values?: Record<string, string | number | null> };
export type ValidationErrors = Record<string, TranslatedError | string>;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type ValidationError = (TranslatedError & { field?: Control }) | string;

export function focusField(id: string) {
    const field = document.getElementById(id);
    if (!field) return;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: "center", behavior: "instant" });
}

/** Reuse HTML constraints; custom errors come from existing business validation. */
export function useFormValidation() {
    const { t } = useTranslation();
    const [errorDetails, setErrors] = useState<Record<string, ValidationError>>({});
    const [attempt, setAttempt] = useState(0);
    // Translate on render so visible errors follow the selected language.
    const errors: FieldErrors = Object.fromEntries(Object.entries(errorDetails).map(([id, error]) => {
        if (typeof error === "string") return [id, error];
        const labelElement = error.field?.labels?.[0];
        const label = Array.from(labelElement?.childNodes ?? [])
            .find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            ?.textContent?.trim() || labelElement?.textContent?.trim() || error.field?.name;
        return [id, t(error.key, { ...error.values, field: error.fieldKey ? t(error.fieldKey) : label })];
    }));

    function validate(form: HTMLFormElement, custom: ValidationErrors = {}) {
        const next: Record<string, ValidationError> = {};
        for (const element of Array.from(form.elements)) {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) continue;
            const field: Control = element;
            if (!field.id || field.disabled) continue;
            const validity = field.validity;
            if (validity.valueMissing) next[field.id] = { key: "validation.required", field };
            else if (validity.typeMismatch) next[field.id] = { key: "validation.email", field };
            else if (validity.badInput) next[field.id] = { key: "validation.number", field };
            else if (validity.rangeUnderflow) next[field.id] = { key: "validation.minimum", field, values: { min: field.getAttribute("min") } };
            else if (validity.rangeOverflow) next[field.id] = { key: "validation.maximum", field, values: { max: field.getAttribute("max") } };
            else if (validity.stepMismatch) next[field.id] = { key: "validation.step", field, values: { step: field.getAttribute("step") } };
            else if (!validity.valid) next[field.id] = { key: "validation.format", field };
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
