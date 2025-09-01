export { OPEN_DENY_WALLET_EVENT, CLOSE_DENY_WALLET_EVENT } from "@/components/modals/DeniedWalletModalHost";

export function openDenyWalletModal(address?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app/denyWalletModal/open", { detail: { address } }));
}

export function closeDenyWalletModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("app/denyWalletModal/close"));
}
