
/**
 * Chuyển đổi số thành mệnh giá VND dựa vào quy tắc:
 * - Nếu số < 1000: nhân với 1000
 * - Nếu số >= 1000: giữ nguyên
 */
export const normalizeVNDAmount = (input: string): number => {
  const number = parseFloat(input);
  if (isNaN(number)) return 0;
  
  // Nếu số nhỏ hơn 1000, giả định là đang nhập theo đơn vị nghìn
  return number < 1000 ? number * 1000 : number;
};

