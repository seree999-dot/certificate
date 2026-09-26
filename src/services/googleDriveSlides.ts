import { CertificateTemplate, Recipient } from '../types';

/**
 * Uploads certificate PDF to user's Google Drive
 */
export const uploadCertificateToDrive = async (
  accessToken: string,
  recipient: Recipient,
  pdfBlob: Blob
): Promise<{ fileId: string; webViewLink?: string }> => {
  const metadata = {
    name: `เกียรติบัตร_${recipient.name}_${recipient.certificateId}.pdf`,
    mimeType: 'application/pdf',
    description: `ออกโดยระบบ CertiFlow สำหรับ ${recipient.name} หลักสูตร ${recipient.courseOrActivity}`,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', pdfBlob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive upload error (${response.status}): ${err}`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink,
  };
};

/**
 * Creates a Google Slides presentation for the certificate
 */
export const createSlidesCertificateTemplate = async (
  accessToken: string,
  template: CertificateTemplate,
  title = 'CertiFlow - ต้นแบบเกียรติบัตร Google Slides'
): Promise<{ presentationId: string; slideUrl: string }> => {
  const response = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Slides create error (${response.status}): ${err}`);
  }

  const presentation = await response.json();
  return {
    presentationId: presentation.presentationId,
    slideUrl: `https://docs.google.com/presentation/d/${presentation.presentationId}/edit`,
  };
};
