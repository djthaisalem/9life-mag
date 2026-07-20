// Do not treat valid Vietnamese letters such as "Â" in "Âm nhạc" as broken text.
const mojibakePattern = /(?:Ã.|Ä.|Å.|Æ.|Ð.|Ø.|Þ.|á[»º]|ï¿|�|\u0010|\u0011)/u

const directRepairs: Array<[string, string]> = [
  ['Nghï¿½ s)', 'Nghệ sĩ'], ['Ngh� s)', 'Nghệ sĩ'], ['Tï¿½ng', 'Tổng'], ['T�ng', 'Tổng'], ['Bï¿½i viï¿½t', 'Bài viết'], ['B�i vi�t', 'Bài viết'], ['Quï¿½n lï¿½', 'Quản lý'], ['Qu�n l�', 'Quản lý'], ['Phï¿½n quyï¿½n', 'Phân quyền'], ['Ph�n quy�n', 'Phân quyền'], ['Thanh toï¿½n', 'Thanh toán'], ['Thanh to�n', 'Thanh toán'], ['Chï¿½ duyï¿½t', 'Chờ duyệt'], ['Ch� duy�t', 'Chờ duyệt'], ['Chï¿½a', 'Chưa'], ['Ch�a', 'Chưa'], ['Tï¿½ chï¿½i', 'Từ chối'], ['T� ch�i', 'Từ chối'], ['ï¿½ang', 'Đang'], ['\u0010ang', 'Đang'], ['\u0010ï¿½', 'Đã'], ['\u0010�', 'Đã'], ['ÄÃ³ng', 'Đóng'], ['Tá»«', 'Từ'], ['TÃ¡Â»Â«', 'Từ'], ['Sá»‘', 'Số'], ['GÃ³i', 'Gói'],
  ['H�i Nam', 'Hải Nam'], ['H�i An', 'Hội An'], ['H� N�i', 'Hà Nội'], ['\u0010� N�ng', 'Đà Nẵng'], ['Đ� Nẵng', 'Đà Nẵng'],
  ['H� s�', 'Hồ sơ'], ['Nh�p n�i b�', 'Nháp nội bộ'], ['C�n r� so�t', 'Cần rà soát'], ['Ch�a map', 'Chưa map'],
  ['M�i', 'Mới'], ['Gi� b�n', 'Giữ bàn'], ['\u0010� c�c', 'Đã cọc'], ['Ho�n t�t', 'Hoàn tất'], ['\u0010� x�c nh�n', 'Đã xác nhận'], ['\u0010ang b�o gi�', 'Đang báo giá'], ['Ch� ch�t', 'Chờ chốt'],
  ['Tr� sao m�i play', 'Trừ sao mới play'], ['Ch� n�i b�', 'Chỉ nội bộ'], ['Li�n h� th�m', 'Liên hệ thêm'], ['kh�ch', 'khách'],
  ['D�ng ch� l�c', 'Dòng chủ lực'], ['c�c set', 'các set'], ['\u0011�m', 'đêm'], ['d� \u0011�y', 'dễ đẩy'], ['�u ti�n', 'ưu tiên'], ['ho�c c�ng \u0011�ng', 'hoặc cộng đồng'],
]

function decodeUtf8Once(input: string) { return new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(input, (char) => char.charCodeAt(0) & 0xff)) }

export function repairVietnameseText(input: string) {
  let current = input
  for (const [broken, correct] of directRepairs) current = current.split(broken).join(correct)
  if (!mojibakePattern.test(current)) return current
  try {
    for (let index = 0; index < 3; index += 1) { const next = decodeUtf8Once(current); if (next === current) break; current = next; if (!mojibakePattern.test(current)) break }
  } catch { return current }
  for (const [broken, correct] of directRepairs) current = current.split(broken).join(correct)
  return current
}

export function repairVietnameseValue<T>(input: T): T {
  if (typeof input === 'string') return repairVietnameseText(input) as T
  if (Array.isArray(input)) return input.map((item) => repairVietnameseValue(item)) as T
  if (input && typeof input === 'object') return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, repairVietnameseValue(value)])) as T
  return input
}
