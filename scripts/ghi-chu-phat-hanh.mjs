/**
 * Soạn mục "Có gì mới" của GitHub Release từ tiêu đề commit (một dòng một commit,
 * đọc từ stdin). CI gọi: git log --format=%s PREV..HEAD | node scripts/ghi-chu-phat-hanh.mjs
 *
 * Người tải app không đọc Conventional Commits: bỏ tiền tố `feat:` / `fix(x):`,
 * bỏ commit chỉ đụng CI, tài liệu, test, rồi chia hai nhóm Mới và Sửa lỗi.
 */

// Commit không đổi gì người dùng thấy.
const BO_QUA = new Set(['ci', 'docs', 'test', 'chore', 'style', 'build', 'refactor', 'wip']);
const TIEN_TO = /^([a-z]+)(\([^)]*\))?!?:\s*/i;
// Commit của bạn trong nhóm không theo Conventional Commits: đoán theo chữ đầu.
const LA_SUA = /^(sửa|fix|khắc phục|chữa)\b/i;

function chuHoaDau(s) {
  return s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);
}

/** @returns {{ moi: string[], sua: string[] }} */
export function phanLoai(tieuDe) {
  const moi = [];
  const sua = [];
  const daCo = new Set();
  for (const dong of tieuDe) {
    const s = dong.trim();
    if (!s || /^(revert|merge)\b/i.test(s)) continue;
    const m = TIEN_TO.exec(s);
    const loai = m ? m[1].toLowerCase() : null;
    if (loai && BO_QUA.has(loai)) continue;
    const noiDung = chuHoaDau((m ? s.slice(m[0].length) : s).replace(/[.\s]+$/, ''));
    if (!noiDung || daCo.has(noiDung.toLowerCase())) continue;
    daCo.add(noiDung.toLowerCase());
    const laSua = loai ? loai === 'fix' : LA_SUA.test(noiDung);
    (laSua ? sua : moi).push(noiDung);
  }
  return { moi, sua };
}

export function soanGhiChu(tieuDe, gioiHan = 30) {
  const { moi, sua } = phanLoai(tieuDe);
  const phan = [];
  if (moi.length) phan.push('## Có gì mới\n\n' + moi.slice(0, gioiHan).map((x) => `- ${x}`).join('\n'));
  if (sua.length) phan.push('## Sửa lỗi\n\n' + sua.slice(0, gioiHan).map((x) => `- ${x}`).join('\n'));
  if (!phan.length) phan.push('## Có gì mới\n\n- Không có thay đổi tính năng nào trong commit.');
  return phan.join('\n\n') + '\n';
}

// Chỉ đọc stdin khi chạy thẳng, không phải khi test import.
if (process.argv[1]?.endsWith('ghi-chu-phat-hanh.mjs')) {
  let vao = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (vao += c));
  process.stdin.on('end', () => process.stdout.write(soanGhiChu(vao.split('\n'))));
}
