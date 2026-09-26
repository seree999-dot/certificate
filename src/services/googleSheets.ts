import { Recipient } from '../types';

export const INITIAL_SAMPLE_RECIPIENTS: Recipient[] = [
  {
    id: '1',
    name: 'สมชาย รักการเรียน',
    email: 'somchai.rak@example.com',
    certificateId: 'CERT-2026-001',
    courseOrActivity: 'การประยุกต์ใช้ปัญญาประดิษฐ์ในองค์กรยุคใหม่ (AI for Enterprise)',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    scoreOrAward: 'คะแนนระดับดีเยี่ยม (98%)',
    department: 'ฝ่ายพัฒนาระบบสารสนเทศ',
    status: 'pending',
  },
  {
    id: '2',
    name: 'กานดา วงศ์สุวรรณ',
    email: 'kanda.wong@example.com',
    certificateId: 'CERT-2026-002',
    courseOrActivity: 'การบริหารจัดการข้อมูลและการวิเคราะห์ Big Data',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    scoreOrAward: 'ผ่านเกณฑ์มาตรฐานระดับทอง',
    department: 'ฝ่ายกลยุทธ์และแผนงาน',
    status: 'emailed',
    emailedAt: '2026-09-26 09:15',
  },
  {
    id: '3',
    name: 'ธนวัฒน์ ศิริพงษ์',
    email: 'thanawat.siri@example.com',
    certificateId: 'CERT-2026-003',
    courseOrActivity: 'การรักษาความมั่นคงปลอดภัยไซเบอร์ระดับองค์กร (Cybersecurity)',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '25 กันยายน 2569',
    scoreOrAward: 'คะแนนระดับดีมาก',
    department: 'ฝ่ายโครงสร้างพื้นฐานไอที',
    status: 'issued',
    downloadedAt: '2026-09-25 14:20',
  },
  {
    id: '4',
    name: 'อภิสิทธิ์ เจริญผล',
    email: 'apisit.c@example.com',
    certificateId: 'CERT-2026-004',
    courseOrActivity: 'การพัฒนาเว็บแอปพลิเคชันสมัยใหม่ด้วย React และ Cloud Services',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    scoreOrAward: 'ผลงานดีเด่นอันดับ 1',
    department: 'คณะเทคโนโลยีสารสนเทศ',
    status: 'pending',
  },
  {
    id: '5',
    name: 'พรทิพย์ สุขเกษม',
    email: 'porntip.suk@example.com',
    certificateId: 'CERT-2026-005',
    courseOrActivity: 'การออกแบบประสบการณ์ผู้ใช้และการวิจัย UX/UI Design',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '24 กันยายน 2569',
    scoreOrAward: 'ผ่านการทดสอบสมรรถนะวิชาชีพ',
    department: 'ฝ่ายนวัตกรรมผลิตภัณฑ์',
    status: 'emailed',
    emailedAt: '2026-09-24 16:40',
  },
  {
    id: '6',
    name: 'ศิริพร บุญมี',
    email: 'siriporn.b@example.com',
    certificateId: 'CERT-2026-006',
    courseOrActivity: 'การประยุกต์ใช้ปัญญาประดิษฐ์ในองค์กรยุคใหม่ (AI for Enterprise)',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    scoreOrAward: 'ผ่านเกณฑ์มาตรฐาน',
    department: 'ฝ่ายทรัพยากรบุคคล (HR)',
    status: 'pending',
  },
  {
    id: '7',
    name: 'วีระชัย แสงทอง',
    email: 'veerachai.s@example.com',
    certificateId: 'CERT-2026-007',
    courseOrActivity: 'ผู้นำแห่งอนาคตกับการเปลี่ยนแปลงทางดิจิทัล (Digital Leadership)',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '23 กันยายน 2569',
    scoreOrAward: 'ผ่านการประเมินทักษะผู้นำ',
    department: 'ฝ่ายบริหารระดับกลาง',
    status: 'issued',
  },
  {
    id: '8',
    name: 'นภาพร จันทร์กระจ่าง',
    email: 'naphaporn.j@example.com',
    certificateId: 'CERT-2026-008',
    courseOrActivity: 'การบริหารจัดการข้อมูลและการวิเคราะห์ Big Data',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    scoreOrAward: 'เกียรตินิยมเหรียญทอง',
    department: 'ฝ่ายกลยุทธ์และแผนงาน',
    status: 'pending',
  },
];

/**
 * Parses raw 2D array from Google Sheets into Recipient objects
 */
export const parseSheetRowsToRecipients = (rows: any[][]): Recipient[] => {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  
  // Find indices for common columns
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('ชื่อ'));
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('อีเมล') || h.includes('เมล'));
  const certIdIdx = headers.findIndex((h) => h.includes('id') || h.includes('รหัส') || h.includes('เลขที่'));
  const courseIdx = headers.findIndex((h) => h.includes('course') || h.includes('หลักสูตร') || h.includes('กิจกรรม') || h.includes('โครงการ'));
  const orgIdx = headers.findIndex((h) => h.includes('org') || h.includes('องค์กร') || h.includes('หน่วยงาน') || h.includes('สังกัด'));
  const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('วัน'));
  const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('แผนก') || h.includes('ฝ่าย') || h.includes('สาขา'));
  const awardIdx = headers.findIndex((h) => h.includes('award') || h.includes('เกียรติ') || h.includes('รางวัล') || h.includes('เกรด') || h.includes('คะแนน'));
  const statusIdx = headers.findIndex((h) => h.includes('status') || h.includes('สถานะ'));

  const recipients: Recipient[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : String(row[0] || '').trim();
    if (!name) continue;

    const email = emailIdx !== -1 ? String(row[emailIdx] || '').trim() : String(row[1] || '').trim();
    const certId = certIdIdx !== -1 && row[certIdIdx] ? String(row[certIdIdx]).trim() : `CERT-${String(i).padStart(4, '0')}`;
    const course = courseIdx !== -1 && row[courseIdx] ? String(row[courseIdx]).trim() : 'การอบรมและพัฒนาทักษะวิชาชีพ';
    const org = orgIdx !== -1 && row[orgIdx] ? String(row[orgIdx]).trim() : 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล';
    const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : '26 กันยายน 2569';
    const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : '';
    const award = awardIdx !== -1 && row[awardIdx] ? String(row[awardIdx]).trim() : '';
    const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toLowerCase() : 'pending';

    let status: 'pending' | 'issued' | 'emailed' = 'pending';
    if (rawStatus.includes('email') || rawStatus.includes('ส่งแล้ว') || rawStatus.includes('sent')) {
      status = 'emailed';
    } else if (rawStatus.includes('issue') || rawStatus.includes('ดาวน์โหลดแล้ว') || rawStatus.includes('รับแล้ว')) {
      status = 'issued';
    }

    recipients.push({
      id: String(i),
      name,
      email,
      certificateId: certId,
      courseOrActivity: course,
      organization: org,
      issueDate: date,
      department: dept,
      scoreOrAward: award,
      status,
    });
  }

  return recipients;
};

/**
 * Fetch rows from Google Sheets API
 */
export const fetchGoogleSheetData = async (
  accessToken: string,
  spreadsheetId: string,
  range = 'A1:Z500'
): Promise<Recipient[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return parseSheetRowsToRecipients(data.values || []);
};

/**
 * Update recipient status in Google Sheet row
 */
export const updateSheetRecipientStatus = async (
  accessToken: string,
  spreadsheetId: string,
  cellRange: string, // e.g. "Sheet1!G2"
  statusValue: string
) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[statusValue]],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Error updating Google Sheet row:', err);
    throw new Error(`Failed to update status in Google Sheet: ${err}`);
  }

  return await response.json();
};

/**
 * Create a new ready-to-use Google Sheet in user's Google Drive with template headers & sample data
 */
export const createSampleSheetInDrive = async (
  accessToken: string,
  title = 'CertiFlow - ฐานข้อมูลผู้รับเกียรติบัตร'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const requestBody = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'รายชื่อผู้รับเกียรติบัตร',
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'ลำดับ' } },
                  { userEnteredValue: { stringValue: 'ชื่อ - นามสกุล' } },
                  { userEnteredValue: { stringValue: 'อีเมล' } },
                  { userEnteredValue: { stringValue: 'รหัสเกียรติบัตร' } },
                  { userEnteredValue: { stringValue: 'หลักสูตร / กิจกรรม' } },
                  { userEnteredValue: { stringValue: 'หน่วยงาน / แผนก' } },
                  { userEnteredValue: { stringValue: 'ผลการอบรม / รางวัล' } },
                  { userEnteredValue: { stringValue: 'วันที่ออกเกียรติบัตร' } },
                  { userEnteredValue: { stringValue: 'สถานะการส่ง' } },
                ],
              },
              ...INITIAL_SAMPLE_RECIPIENTS.map((r, idx) => ({
                values: [
                  { userEnteredValue: { numberValue: idx + 1 } },
                  { userEnteredValue: { stringValue: r.name } },
                  { userEnteredValue: { stringValue: r.email } },
                  { userEnteredValue: { stringValue: r.certificateId } },
                  { userEnteredValue: { stringValue: r.courseOrActivity } },
                  { userEnteredValue: { stringValue: r.department || '-' } },
                  { userEnteredValue: { stringValue: r.scoreOrAward || '-' } },
                  { userEnteredValue: { stringValue: r.issueDate } },
                  { userEnteredValue: { stringValue: r.status === 'emailed' ? 'ส่งอีเมลแล้ว' : r.status === 'issued' ? 'ดาวน์โหลดแล้ว' : 'รอดำเนินการ' } },
                ],
              })),
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets creation failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
  };
};
