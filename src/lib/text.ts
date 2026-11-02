/**
 * Bỏ dấu để so: gõ "ha" phải ra "Hà Nội", "thanh hoa" ra "Thanh Hóa". Gõ không
 * dấu là cách gõ nhanh phổ biến (28/10). Đ/đ không tách được bằng NFD nên đổi tay.
 */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** `label` có chứa `query` không, bỏ qua dấu và hoa thường. Query rỗng là khớp. */
export function matchesVi(label: string, query: string): boolean {
  const needle = boDau(query);
  return !needle || boDau(label).includes(needle);
}

/**
 * Bỏ tiền tố hành chính để sắp theo tên riêng: "Thành phố Hà Nội" đứng cạnh
 * "Hà Giang", "Quận 10" sau "Quận 9". GHN trả lẫn lộn có và không có tiền tố.
 */
const ADMIN_PREFIX = /^(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\s+/;

function sortKey(name: string): string {
  return boDau(name).replace(ADMIN_PREFIX, '');
}

/** So sánh tên tiếng Việt A-Z (không phân biệt dấu, số theo giá trị). */
export function compareVi(a: string, b: string): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  // So số theo giá trị ("Quận 2" trước "Quận 10") bằng cách đệm số ra cùng độ dài.
  const pad = (s: string) => s.replace(/\d+/g, (d) => d.padStart(6, '0'));
  const pa = pad(ka);
  const pb = pad(kb);
  if (pa < pb) return -1;
  if (pa > pb) return 1;
  return 0;
}

/** Trả bản sao đã sắp A-Z theo tên. */
export function sortByNameVi<T>(items: readonly T[], getName: (it: T) => string): T[] {
  return [...items].sort((x, y) => compareVi(getName(x), getName(y)));
}
