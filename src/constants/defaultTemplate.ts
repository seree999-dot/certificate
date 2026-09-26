import { CertificateTemplate } from '../types';

export const DEFAULT_TEMPLATE: CertificateTemplate = {
  theme: 'royal-gold',
  title: 'เกียรติบัตรรับรอง',
  subtitle: 'Certificate of Academic & Professional Achievement',
  bodyPrefix: 'ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า',
  bodySuffix: 'ได้เข้าร่วมและผ่านการฝึกอบรมเชิงปฏิบัติการระดับสูงในหลักสูตร',
  orgName: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
  signer1Name: 'ศ.ดร. ธีรภัทร วิจิตรปัญญา',
  signer1Title: 'ประธานคณะกรรมการบริหารหลักสูตร',
  signer2Name: 'ดร. กรกนก รัตนโชติ',
  signer2Title: 'ผู้อำนวยการสถาบันพัฒนานวัตกรรมฯ',
  showQrCode: true,
  showBadge: true,
  badgeText: 'OFFICIAL CERTIFIED',
  borderStyle: 'classic',
  fontFamily: 'Prompt',
  accentColor: '#b8860b',
};
