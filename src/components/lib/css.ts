export type CSSLength = number | string | undefined;

export function px(v: CSSLength): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}