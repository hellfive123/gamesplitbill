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
  
  // Kiểm tra nếu giá trị đã được nhân với 1000 trước đó
  // Nếu giá trị lớn hơn 1000, giả sử nó đã được nhân với 1000
  if (number >= 1000) {
    return number;
  }
  
  // Nếu giá trị nhỏ hơn 1000, nhân với 1000
  return number * 1000;
};

