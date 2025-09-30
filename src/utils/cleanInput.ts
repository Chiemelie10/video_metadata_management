import sanitizeHtml from "sanitize-html";

export function cleanInput(value: string): string {
    return sanitizeHtml(value.trim(), {
        allowedTags: [],
        allowedAttributes: {}
    });
}