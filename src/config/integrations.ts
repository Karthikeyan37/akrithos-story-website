const defaults = {
  site: "https://akrithos.com",
  training: "https://akrithos.com/training",
  portal: "https://learn.akrithos.com/",
  formId: "NF6k2MmqcnTNqAfG3Fxd",
  calendly: "https://calendly.com/alex-buriak/akrithos-ai-scoping-call",
  foundingCheckout:
    "https://link.fastpaydirect.com/payment-link/6a74dc5a50f272ef3a73c519",
  singleSessionCheckout:
    "https://link.fastpaydirect.com/payment-link/6a7a014ac8cc9a2ce7267306",
  monthlyCheckout:
    "https://link.fastpaydirect.com/payment-link/6a830bf573c7ff66b05e890a",
  contactEmail: "info@akrithos.com",
} as const;

function publicUrl(name: string, value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;
  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error(`${name} must use HTTPS.`);
  }
  return parsed.toString();
}

function publicIdentifier(name: string, value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;
  if (!/^[A-Za-z0-9_-]+$/.test(candidate)) {
    throw new Error(`${name} contains unsupported characters.`);
  }
  return candidate;
}

function publicEmail(value: string | undefined) {
  const candidate = value?.trim() || defaults.contactEmail;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    throw new Error("NEXT_PUBLIC_CONTACT_EMAIL must be a valid email address.");
  }
  return candidate;
}

const diagnosticFormId = publicIdentifier(
  "NEXT_PUBLIC_GHL_DIAGNOSTIC_FORM_ID",
  process.env.NEXT_PUBLIC_GHL_DIAGNOSTIC_FORM_ID,
  defaults.formId,
);

export const integrations = Object.freeze({
  siteUrl: publicUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL, defaults.site),
  trainingUrl: defaults.training,
  portalUrl: publicUrl(
    "NEXT_PUBLIC_GHL_PORTAL_URL",
    process.env.NEXT_PUBLIC_GHL_PORTAL_URL,
    defaults.portal,
  ),
  diagnosticFormId,
  diagnosticFormUrl: `https://api.leadconnectorhq.com/widget/form/${diagnosticFormId}`,
  diagnosticScriptUrl: "https://link.msgsndr.com/js/form_embed.js",
  calendlyUrl: publicUrl(
    "NEXT_PUBLIC_CALENDLY_URL",
    process.env.NEXT_PUBLIC_CALENDLY_URL,
    defaults.calendly,
  ),
  foundingCheckoutUrl: publicUrl(
    "NEXT_PUBLIC_FOUNDING_CHECKOUT_URL",
    process.env.NEXT_PUBLIC_FOUNDING_CHECKOUT_URL,
    defaults.foundingCheckout,
  ),
  singleSessionCheckoutUrl: publicUrl(
    "NEXT_PUBLIC_SINGLE_SESSION_CHECKOUT_URL",
    process.env.NEXT_PUBLIC_SINGLE_SESSION_CHECKOUT_URL,
    defaults.singleSessionCheckout,
  ),
  monthlyCheckoutUrl: publicUrl(
    "NEXT_PUBLIC_MONTHLY_CHECKOUT_URL",
    process.env.NEXT_PUBLIC_MONTHLY_CHECKOUT_URL,
    defaults.monthlyCheckout,
  ),
  contactEmail: publicEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
});
