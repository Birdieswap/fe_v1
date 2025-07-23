import "./ThemedSwitch.css";

import { Switch } from "@heroui/react";

export default function ThemedSwitch(
  props: Omit<Parameters<typeof Switch>[0], "className" | "size">,
) {
  return (
    <Switch
      {...props}
      classNames={{
        base: "switch-base",
        wrapper: "switch-wrapper",
        thumb: "switch-thumb",
      }}
    />
  );
}
