import { PRINT_RATES } from "./data";

export function computeBill(paperSize, color, pages) {
  const rate = PRINT_RATES[paperSize]?.[color];
  const pageCount = Number(pages);

  if (
    typeof rate !== "number" ||
    !Number.isFinite(rate) ||
    !Number.isFinite(pageCount) ||
    !Number.isInteger(pageCount) ||
    pageCount < 0
  ) {
    return 0;
  }

  return rate * pageCount;
}

export function formatPeso(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return (0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  }

  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}
