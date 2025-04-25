/**
 * Chuyển đổi số thành mệnh giá VND.
 * Giả định người dùng luôn nhập số tiền theo đơn vị nghìn đồng.
 * Ví dụ: 
 * - Nhập 12 -> 12,000 VNĐ
 * - Nhập 1233 -> 1,233,000 VNĐ
 */
export const normalizeVNDAmount = (input: string): number => {
  const number = parseFloat(input);
  if (isNaN(number)) return 0;
  
  // Luôn nhân với 1000 vì giả định người dùng nhập theo đơn vị nghìn
  return number * 1000;
};

