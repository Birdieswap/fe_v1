"use client";

import Markdown from "react-markdown";
import { SetStateAction, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";

import { FilterButton } from "@/components/atoms/FilterButton";
import Icons from "@/assets/icons/icons";
import SearchBox from "@/components/atoms/SearchBox";
import { FaqFilter, items } from "@/const/faq";

function Title({ text, searchText }: { text: string; searchText: string }) {
  const index = text.toLowerCase().indexOf(searchText.toLowerCase());

  if (index === -1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {text.slice(0, index)}
      <span className="font-semibold text-light-primary dark:text-dark-primary">
        {text.slice(index, index + searchText.length)}
      </span>
      {text.slice(index + searchText.length)}
    </span>
  );
}

export default function FaqPage() {
  const [filter, _setFilter] = useState<string | null>(null);
  const setFilter = (value: SetStateAction<string | null>) => {
    _setFilter((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;

      if (newValue === prev) {
        return null;
      } else {
        return newValue;
      }
    });
  };

  const [searchString, setSearchString] = useState<string | undefined>(
    undefined,
  );
  const filteredItems = items.filter((item) => {
    const isFilter = !filter
      ? true
      : item.topic.map((v) => v.toString()).includes(filter);
    const isSearch = !searchString
      ? true
      : item.title.toLowerCase().includes(searchString.toLowerCase());

    return isFilter && isSearch;
  });

  return (
    <div className="container flex h-full grow flex-col items-center px-3 py-2 sm:py-8">
      <div className="flex w-full flex-row items-center max-lg:flex-wrap-reverse pb-5 max-md:gap-2 max-md:px-1 max-md:py-2 md:gap-4">
        <div className="flex grow flex-row items-center max-md:gap-2 max-md:overflow-x-scroll max-md:py-0.5 md:gap-4">
          <FilterButton
            selected={filter}
            setSelected={setFilter}
            value={FaqFilter.GENERAL}
          >
            General
          </FilterButton>
          <FilterButton
            selected={filter}
            setSelected={setFilter}
            value={FaqFilter.SWAP}
          >
            Swap
          </FilterButton>
          <FilterButton
            selected={filter}
            setSelected={setFilter}
            value={FaqFilter.FARM}
          >
            Farm
          </FilterButton>
          <FilterButton
            selected={filter}
            setSelected={setFilter}
            value={FaqFilter.EASY}
          >
            Easy
          </FilterButton>
          <FilterButton
            selected={filter}
            setSelected={setFilter}
            value={FaqFilter.TROUBLESHOOTING}
          >
            Troubleshooting
          </FilterButton>
        </div>
        <div className="max-xl:grow max-md:pb-1">
          <SearchBox
            placeholder="Search Assets, Platforms"
            value={searchString}
            onValueChange={setSearchString}
          />
        </div>
      </div>
      <Accordion
        className="px-0"
        itemClasses={{
          title: "text-[15px] font-medium",
          trigger: "py-5 border-b border-default-400 dark:border-default-100",
          indicator:
            "text-default-700 rotate-180 data-[open=true]:rotate-0 data-[open=false]:rotate-180",
          content:
            "bg-default-100 dark:bg-dark-popup-bg text-[15px] font-normal px-6 py-4 text-foreground",
        }}
        showDivider={false}
        style={{ padding: "0px" }}
      >
        {filteredItems.map((item) => (
          <AccordionItem
            key={item.key}
            indicator={<Icons.Dropdown />}
            title={<Title searchText={searchString || ""} text={item.title} />}
          >
            <Markdown>{item.content}</Markdown>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
