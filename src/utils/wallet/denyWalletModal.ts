export type DenyWalletModalSupportLink = {
  label: string;
  href: string;
};

export type DenyWalletModalOptions = {
  title?: string;
  body?: string[];

  supportEmail?: string;
  supportLink?: DenyWalletModalSupportLink;

  // ✅ null이면 CTA 숨김
  cta?: { label: string; href: string } | null;
};

export function openDenyWalletModal(
  address?: string,
  opts?: DenyWalletModalOptions
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("app/denyWalletModal/open", {
      detail: {
        address,
        title: opts?.title,
        body: opts?.body,
        supportEmail: opts?.supportEmail,
        supportLink: opts?.supportLink,
        cta: opts?.cta, // null 전달 가능
      },
    })
  );
}

export function closeDenyWalletModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("app/denyWalletModal/close"));
}
