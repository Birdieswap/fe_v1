import { Fragment } from "react";

import StakeThemedButton from "@/components/atoms/StakeThemedButton";
import { IToken } from "@/const/contracts/types/tokenTypes";

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
  return (
    <Fragment>
      {!isApproved && token && (isActive === undefined || isActive) && (
        <StakeThemedButton
          isDisabled={isPending}
          variant="MINT"
          onPress={onClick}
        >
          {/* {isPending ? "Pending..." : `Approve ${token?.symbol}`} */}
          {`Approve ${token?.symbol}`}
        </StakeThemedButton>
      )}
    </Fragment>
  );
}
