export function validateContractField(key, value) {
  if (!value) return undefined;

  if (key === 'dien_thoai') {
    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
    const cleanValue = value.replace(/[\s.]/g, '');
    if (!phoneRegex.test(cleanValue)) return 'Số điện thoại không hợp lệ (VN)';
  }

  if (key === 'cccd') {
    const cleanValue = value.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanValue)) return 'CCCD phải gồm 12 chữ số';
  }

  if (['ngay_bat_dau', 'ngay_ket_thuc'].includes(key)) {
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 31) return 'Ngày từ 1 đến 31';
  }

  if (['thang_bat_dau', 'thang_ket_thuc'].includes(key)) {
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 12) return 'Tháng từ 1 đến 12';
  }

  return undefined;
}
