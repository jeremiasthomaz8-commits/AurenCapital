type EventName =
  | "view_landing_page"
  | "click_primary_cta"
  | "start_qualification"
  | "complete_qualification"
  | "begin_checkout"
  | "expand_faq"
  | "click_support";
let analyticsAllowed = false;

export function allowAnalytics(allowed: boolean) {
  analyticsAllowed = allowed;
}
export function track(
  name: EventName,
  metadata: Record<string, string | number> = {},
) {
  if (!analyticsAllowed) return;
  // Payload is strictly constructed here. Never pass form values, contact details or financial answers.
  const safe = Object.fromEntries(
    Object.entries(metadata).filter(([key]) =>
      ["section", "step", "question"].includes(key),
    ),
  );
  window.dispatchEvent(
    new CustomEvent("auren:analytics", { detail: { event: name, ...safe } }),
  );
}

export function attribution() {
  if (!analyticsAllowed) return {};
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ].flatMap((key) => {
      const value = params.get(key);
      return value && /^[\w .-]{1,100}$/.test(value) ? [[key, value]] : [];
    }),
  );
}
