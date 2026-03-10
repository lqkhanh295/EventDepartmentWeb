// Chuyển số thành chữ tiếng Việt
const chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

function docSo3ChuSo(baso) {
  let tram, chuc, donvi;
  let KetQua = '';
  tram = Math.floor(baso / 100);
  chuc = Math.floor((baso % 100) / 10);
  donvi = baso % 10;

  if (tram === 0 && chuc === 0 && donvi === 0) return '';

  if (tram !== 0) {
    KetQua += chuSo[tram] + ' trăm';
    if (chuc === 0 && donvi !== 0) KetQua += ' linh';
  }

  if (chuc !== 0 && chuc !== 1) {
    KetQua += ' ' + chuSo[chuc] + ' mươi';
    if (chuc === 0 && donvi !== 0) KetQua += ' linh';
  }
  if (chuc === 1) KetQua += ' mười';

  switch (donvi) {
    case 1:
      if (chuc !== 0 && chuc !== 1) {
        KetQua += ' mốt';
      } else {
        KetQua += ' ' + chuSo[donvi];
      }
      break;
    case 5:
      if (chuc === 0) {
        KetQua += ' ' + chuSo[donvi];
      } else {
        KetQua += ' lăm';
      }
      break;
    default:
      if (donvi !== 0) {
        KetQua += ' ' + chuSo[donvi];
      }
      break;
  }
  return KetQua;
}

export function numberToVietnameseText(so) {
  if (!so && so !== 0) return '';
  let strSo = so.toString().replace(/[.,\s]/g, '');
  let num = parseInt(strSo);

  if (isNaN(num)) return '';
  if (num === 0) return 'Không đồng';

  let Lan = 0;
  let i = 0;
  let KetQua = '';
  let ViTri = [];

  if (num < 0) {
    num = Math.abs(num);
  }

  ViTri[5] = Math.floor(num / 1000000000000000);
  if (isNaN(ViTri[5])) ViTri[5] = 0;
  num = num - ViTri[5] * 1000000000000000;

  ViTri[4] = Math.floor(num / 1000000000000);
  if (isNaN(ViTri[4])) ViTri[4] = 0;
  num = num - ViTri[4] * 1000000000000;

  ViTri[3] = Math.floor(num / 1000000000);
  if (isNaN(ViTri[3])) ViTri[3] = 0;
  num = num - ViTri[3] * 1000000000;

  ViTri[2] = Math.floor(num / 1000000);
  if (isNaN(ViTri[2])) ViTri[2] = 0;

  ViTri[1] = Math.floor((num % 1000000) / 1000);
  if (isNaN(ViTri[1])) ViTri[1] = 0;

  ViTri[0] = num % 1000;
  if (isNaN(ViTri[0])) ViTri[0] = 0;

  if (ViTri[5] > 0) Lan = 5;
  else if (ViTri[4] > 0) Lan = 4;
  else if (ViTri[3] > 0) Lan = 3;
  else if (ViTri[2] > 0) Lan = 2;
  else if (ViTri[1] > 0) Lan = 1;
  else Lan = 0;

  for (i = Lan; i >= 0; i--) {
    let tmp = docSo3ChuSo(ViTri[i]);
    if (tmp !== '') {
      KetQua += tmp + tien[i];
    } else if (i > 0 && KetQua !== '') {
      KetQua += ' không' + tien[i];
    }
  }

  if (KetQua === '') return '';

  KetQua = KetQua.trim();
  KetQua = KetQua.charAt(0).toUpperCase() + KetQua.slice(1);
  return KetQua + ' đồng';
}
