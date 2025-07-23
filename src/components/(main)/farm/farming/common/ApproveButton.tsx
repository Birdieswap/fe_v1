import { Fragment } from "react";

import ThemedButton from "@/components/atoms/ThemedButton";
import { IToken } from "@/const/contracts/types/tokenTypes";

export default function ApproveButton({
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
        <ThemedButton isDisabled={isPending} variant="MINT" onPress={onClick}>
          {isPending ? "Pending..." : `Approve ${token?.symbol}`}
        </ThemedButton>
      )}
    </Fragment>
  );
}
