import { Recipient, CertificateTemplate } from '../types';

/**
 * Base64URL safe encoder
 */
const toBase64Url = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Encodes UTF-8 string for email headers (RFC 2047)
 */
const encodeMimeHeader = (text: string): string => {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(text)))}?=`;
};

/**
 * Sends certificate PDF directly to recipient email via Gmail API
 */
export const sendCertificateViaGmail = async (
  accessToken: string,
  recipient: Recipient,
  template: CertificateTemplate,
  pdfBase64: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const subject = `[เกียรติบัตรรับรอง] ขอมอบเกียรติบัตร: ${recipient.courseOrActivity} - ${recipient.name}`;
    const filename = `Certificate_${recipient.certificateId}.pdf`;

    const htmlBody = `
      <div style="font-family: 'Sarabun', 'Prompt', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #b8860b; margin: 0 0 8px 0; font-size: 24px;">${template.title}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">${template.orgName}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          เรียนคุณ <strong>${recipient.name}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          ${template.bodyPrefix} <strong>${recipient.name}</strong> ${template.bodySuffix}
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #0f172a;">${recipient.courseOrActivity}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #475569;">เลขที่เกียรติบัตร: <strong>${recipient.certificateId}</strong></p>
          ${recipient.scoreOrAward ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #059669;">ผลการประเมิน: <strong>${recipient.scoreOrAward}</strong></p>` : ''}
          <p style="margin: 0; font-size: 13px; color: #64748b;">วันที่ออกเกียรติบัตร: ${recipient.issueDate}</p>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          ทางระบบได้แนบไฟล์เกียรติบัตรฉบับอิเล็กทรอนิกส์ (PDF) ที่ลงนามและรับรองอย่างเป็นทางการมาพร้อมกับอีเมลฉบับนี้แล้ว ท่านสามารถดาวน์โหลดและพิมพ์เพื่อนำไปใช้ประโยชน์ในงานวิชาการหรือวิชาชีพได้ทันที
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <div style="font-size: 12px; color: #94a3b8; text-align: center;">
          <p style="margin: 0;">ออกให้โดยระบบ CertiFlow Automated Certificate System</p>
          <p style="margin: 4px 0 0 0;">หากมีข้อสงสัยประการใด โปรดติดต่อผู้จัดโครงการหรือหน่วยงานผู้ออกเกียรติบัตร</p>
        </div>
      </div>
    `;

    // Build raw MIME string
    const mimeMessage = [
      `To: ${recipient.email}`,
      `Subject: ${encodeMimeHeader(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
      '',
      `--${boundary}`,
      'Content-Type: application/pdf',
      `Content-Disposition: attachment; filename="${encodeMimeHeader(filename)}"`,
      'Content-Transfer-Encoding: base64',
      '',
      pdfBase64,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    // Base64URL encode the entire raw MIME string
    // Because mimeMessage contains binary-safe strings + base64 pdf, we encode properly:
    const encodedRaw = toBase64Url(mimeMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedRaw,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gmail API send error:', errText);
      return { success: false, error: `Gmail API Error (${response.status}): ${errText}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('sendCertificateViaGmail exception:', error);
    return { success: false, error: error.message || 'ส่งอีเมลไม่สำเร็จ' };
  }
};
