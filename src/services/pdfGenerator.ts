import { jsPDF } from 'jspdf';
import { CertificateTemplate, Recipient } from '../types';

export const renderCertificateToCanvas = async (
  recipient: Recipient,
  template: CertificateTemplate
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  // High-res A4 Landscape proportion (ratio 1.414)
  const width = 1920;
  const height = 1358;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (template.theme === 'royal-gold') {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#fefbf3');
    gradient.addColorStop(1, '#fbf6e8');
  } else if (template.theme === 'academic-blue') {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f0f7ff');
    gradient.addColorStop(1, '#e2edfd');
  } else if (template.theme === 'emerald-tech') {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f0fdf4');
    gradient.addColorStop(1, '#dcfce7');
  } else if (template.theme === 'burgundy-luxury') {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#fff1f2');
    gradient.addColorStop(1, '#ffe4e6');
  } else if (template.theme === 'modern-purple') {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#faf5ff');
    gradient.addColorStop(1, '#f3e8ff');
  } else {
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#f1f5f9');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Borders
  const borderOffset = 45;
  const primaryColor =
    template.theme === 'royal-gold'
      ? '#b8860b'
      : template.theme === 'academic-blue'
      ? '#1e40af'
      : template.theme === 'emerald-tech'
      ? '#065f46'
      : template.theme === 'burgundy-luxury'
      ? '#881337'
      : template.theme === 'modern-purple'
      ? '#6b21a8'
      : '#334155';

  const secondaryColor =
    template.theme === 'royal-gold'
      ? '#d4af37'
      : template.theme === 'academic-blue'
      ? '#60a5fa'
      : template.theme === 'emerald-tech'
      ? '#34d399'
      : template.theme === 'burgundy-luxury'
      ? '#f43f5e'
      : template.theme === 'modern-purple'
      ? '#c084fc'
      : '#94a3b8';

  // Double Frame Border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 14;
  ctx.strokeRect(borderOffset, borderOffset, width - borderOffset * 2, height - borderOffset * 2);

  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(borderOffset + 18, borderOffset + 18, width - (borderOffset + 18) * 2, height - (borderOffset + 18) * 2);

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(borderOffset + 28, borderOffset + 28, width - (borderOffset + 28) * 2, height - (borderOffset + 28) * 2);

  // Corner Ornaments
  const drawCorner = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = secondaryColor;
    ctx.lineWidth = 3;

    // Corner bracket
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(0, 0);
    ctx.lineTo(50, 0);
    ctx.stroke();

    // Corner decorative diamond
    ctx.beginPath();
    ctx.moveTo(18, 18);
    ctx.lineTo(26, 12);
    ctx.lineTo(34, 18);
    ctx.lineTo(26, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const cornerMargin = borderOffset + 38;
  drawCorner(cornerMargin, cornerMargin, 0);
  drawCorner(width - cornerMargin, cornerMargin, Math.PI / 2);
  drawCorner(width - cornerMargin, height - cornerMargin, Math.PI);
  drawCorner(cornerMargin, height - cornerMargin, -Math.PI / 2);

  // Center alignment helper
  ctx.textAlign = 'center';

  // Organization Header
  ctx.fillStyle = '#475569';
  ctx.font = `600 32px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(template.orgName.toUpperCase(), width / 2, 190);

  // Certificate Title
  ctx.fillStyle = primaryColor;
  ctx.font = `bold 64px '${template.fontFamily}', 'Prompt', serif`;
  ctx.fillText(template.title, width / 2, 280);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = `italic 500 28px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(template.subtitle, width / 2, 335);

  // Decorative divider line with diamond in center
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 250, 365);
  ctx.lineTo(width / 2 - 25, 365);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2 + 25, 365);
  ctx.lineTo(width / 2 + 250, 365);
  ctx.stroke();

  // Diamond in center
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.moveTo(width / 2, 355);
  ctx.lineTo(width / 2 + 10, 365);
  ctx.lineTo(width / 2, 375);
  ctx.lineTo(width / 2 - 10, 365);
  ctx.closePath();
  ctx.fill();

  // Body Prefix ("ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า")
  ctx.fillStyle = '#334155';
  ctx.font = `400 32px '${template.fontFamily}', 'Sarabun', sans-serif`;
  ctx.fillText(template.bodyPrefix, width / 2, 440);

  // Recipient Name (Highlight)
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 68px '${template.fontFamily}', 'Kanit', sans-serif`;
  ctx.fillText(recipient.name, width / 2, 545);

  // Name underline accent
  const nameWidth = ctx.measureText(recipient.name).width;
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameWidth / 2 - 30, 565);
  ctx.lineTo(width / 2 + nameWidth / 2 + 30, 565);
  ctx.stroke();

  // Department or Award if present
  let currentY = 620;
  if (recipient.department || recipient.scoreOrAward) {
    ctx.fillStyle = primaryColor;
    ctx.font = `600 30px '${template.fontFamily}', 'Prompt', sans-serif`;
    const subText = [recipient.department, recipient.scoreOrAward ? `(${recipient.scoreOrAward})` : '']
      .filter(Boolean)
      .join(' ');
    ctx.fillText(subText, width / 2, currentY);
    currentY += 55;
  }

  // Course / Activity & Description (Word wrap if long)
  ctx.fillStyle = '#334155';
  ctx.font = `400 32px '${template.fontFamily}', 'Sarabun', sans-serif`;

  const fullDescription = `${template.bodySuffix} "${recipient.courseOrActivity}"`;
  // Wrap text
  const maxTextWidth = width - 400;
  const words = fullDescription.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  lines.forEach((l) => {
    ctx.fillText(l.trim(), width / 2, currentY);
    currentY += 45;
  });

  // Issue Date & Given text
  currentY += 15;
  ctx.fillStyle = '#475569';
  ctx.font = `400 28px '${template.fontFamily}', 'Sarabun', sans-serif`;
  ctx.fillText(`ให้ไว้ ณ วันที่ ${recipient.issueDate || 'วันที่ออกเกียรติบัตร'}`, width / 2, currentY);

  // Bottom section: Signatures and Stamp / QR
  const signY = height - 250;

  // Signer 1 (Left)
  ctx.save();
  ctx.translate(width * 0.28, signY);
  // Simulated signature line
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-160, 0);
  ctx.lineTo(160, 0);
  ctx.stroke();

  // Signature script text
  ctx.fillStyle = '#1e293b';
  ctx.font = `italic 42px 'Charm', cursive`;
  ctx.fillText(template.signer1Name, 0, -20);

  // Signer name and title
  ctx.fillStyle = '#1e293b';
  ctx.font = `600 26px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(`(${template.signer1Name})`, 0, 40);

  ctx.fillStyle = '#64748b';
  ctx.font = `400 22px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(template.signer1Title, 0, 72);
  ctx.restore();

  // Signer 2 (Right)
  ctx.save();
  ctx.translate(width * 0.72, signY);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-160, 0);
  ctx.lineTo(160, 0);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = `italic 42px 'Charm', cursive`;
  ctx.fillText(template.signer2Name, 0, -20);

  ctx.fillStyle = '#1e293b';
  ctx.font = `600 26px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(`(${template.signer2Name})`, 0, 40);

  ctx.fillStyle = '#64748b';
  ctx.font = `400 22px '${template.fontFamily}', 'Prompt', sans-serif`;
  ctx.fillText(template.signer2Title, 0, 72);
  ctx.restore();

  // Center Official Seal / Badge
  if (template.showBadge) {
    const sealX = width / 2;
    const sealY = height - 250;
    ctx.save();
    ctx.translate(sealX, sealY);

    // Outer notched circle / starburst
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    const numPoints = 24;
    const outerR = 64;
    const innerR = 56;
    for (let i = 0; i < numPoints * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / numPoints;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Inner gold ring
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    // Central core
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OFFICIAL', 0, -8);
    ctx.fillText('CERTIFIED', 0, 12);
    ctx.restore();
  }

  // Certificate ID & Verification Code (Bottom Bar)
  ctx.fillStyle = '#64748b';
  ctx.font = `500 20px 'Cinzel', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`NO. ${recipient.certificateId}`, borderOffset + 40, height - borderOffset - 20);

  ctx.textAlign = 'right';
  ctx.fillText(`VERIFIED BY CERTIFLOW SYSTEM`, width - borderOffset - 40, height - borderOffset - 20);

  return canvas;
};

export const generateCertificatePDF = async (
  recipient: Recipient,
  template: CertificateTemplate
): Promise<{ pdfBlob: Blob; pdfBase64: string; dataUrl: string }> => {
  const canvas = await renderCertificateToCanvas(recipient, template);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  // A4 Landscape is 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

  const pdfBlob = pdf.output('blob');
  const pdfBase64 = pdf.output('datauristring').split(',')[1];

  return {
    pdfBlob,
    pdfBase64,
    dataUrl,
  };
};

export const downloadCertificatePDF = async (
  recipient: Recipient,
  template: CertificateTemplate
) => {
  const { pdfBlob } = await generateCertificatePDF(recipient, template);
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificate_${recipient.name.replace(/\s+/g, '_')}_${recipient.certificateId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
