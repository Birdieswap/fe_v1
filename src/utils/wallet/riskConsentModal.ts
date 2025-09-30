import { OPEN_RISK_CONSENT_EVENT, CLOSE_RISK_CONSENT_EVENT } from "@/components/modals/RiskConsentModalHost";

export function openRiskConsentModal(onConfirm: () => Promise<void> | void) {
  window.dispatchEvent(new CustomEvent(OPEN_RISK_CONSENT_EVENT, { detail: { onConfirm } }));
}
export function closeRiskConsentModal() {
  window.dispatchEvent(new Event(CLOSE_RISK_CONSENT_EVENT));
}