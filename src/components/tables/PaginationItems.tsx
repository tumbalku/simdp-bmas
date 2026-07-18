"use client";

import type { MouseEvent } from "react";

import {
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

type PaginationItemsProps = {
  page: number;
  totalPages: number;
  getHref?: (page: number) => string;
  onPageClick?: (event: MouseEvent<HTMLAnchorElement>, page: number) => void;
};

export function PaginationItems({
  page,
  totalPages,
  getHref = () => "#",
  onPageClick,
}: PaginationItemsProps) {
  const items = [];

  for (let item = 1; item <= totalPages; item += 1) {
    if (
      item === 1 ||
      item === totalPages ||
      (item >= page - 1 && item <= page + 1)
    ) {
      items.push(
        <PaginationItem key={item}>
          <PaginationLink
            href={getHref(item)}
            isActive={item === page}
            onClick={
              onPageClick
                ? (event) => onPageClick(event, item)
                : undefined
            }
          >
            {item}
          </PaginationLink>
        </PaginationItem>
      );
    } else if (item === page - 2 || item === page + 2) {
      items.push(
        <PaginationItem key={item}>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
  }

  return items;
}
