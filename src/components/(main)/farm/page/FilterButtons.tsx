import { Dispatch, SetStateAction } from "react";

import { FilterButton } from "@/components/atoms/FilterButton";

export enum Filter {
  ALL = "ALL",
  SINGLE = "SINGLE",
  LP = "LP",
  STABLE = "STABLE",
  MY_FARM = "MY_FARM",
}

export default function FilterButtons({
  selected,
  setSelected,
}: {
  selected: Filter;
  setSelected: Dispatch<SetStateAction<Filter>>;
}) {
  return (
    <div className="flex flex-row items-center max-md:gap-2 md:gap-4">
      <FilterButton
        selected={selected}
        setSelected={setSelected}
        value={Filter.ALL}
      >
        All
      </FilterButton>
      <FilterButton
        selected={selected}
        setSelected={setSelected}
        value={Filter.SINGLE}
      >
        Single
      </FilterButton>
      <FilterButton
        selected={selected}
        setSelected={setSelected}
        value={Filter.LP}
      >
        LP
      </FilterButton>
      <FilterButton
        selected={selected}
        setSelected={setSelected}
        value={Filter.STABLE}
      >
        Stable
      </FilterButton>
      <FilterButton
        selected={selected}
        setSelected={setSelected}
        value={Filter.MY_FARM}
      >
        My Farm
      </FilterButton>
    </div>
  );
}
