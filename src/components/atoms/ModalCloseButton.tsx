import { Button } from "@heroui/react";

import Icons from "@/assets/icons/icons";

export default function ModalCloseButton(props: Parameters<typeof Button>[0]) {
  return (
    <Button {...props} isIconOnly variant="light">
      <Icons.Close className="fill-foreground" />
    </Button>
  );
}
