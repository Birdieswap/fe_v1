import { Fragment } from "react";

import StakeThemedButton from "@/components/atoms/StakeThemedButton";
import { IToken } from "@/const/contracts/types/tokenTypes";
import ButtonWithPresence from "@/components/common/ButtonWithPresence";

export default function StakeApproveButton({
  isApproved,
  isActive,
  isPending,
  token,
  onClick,
}: {
  isApproved: boolean;
  isPending?: boolean;
  isActive?: boolean;
  token?: IToken;
  onClick: () => void | Promise<void>;
}) {
  const isBusy = !!isPending && (isActive === undefined || isActive);

  return (
    <Fragment>
      {!isApproved && token && (isActive === undefined || isActive) && (
        <ButtonWithPresence
          fullWidth
          isDisabled={!!isPending}
          variant="MINT"
          onPress={onClick}
          aria-busy={isBusy ? true : undefined} // ✅ approve pending이면 pulse
        >
          {isPending ? `Approving ${token.symbol}` : `Approve ${token.symbol}`}
        </ButtonWithPresence>
      )}
    </Fragment>
  );
}
