import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  Send,
  Download,
  Mail,
  Calendar,
  Building,
  Award,
  Sparkles,
  Eye,
  FileCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipient, CertificateTemplate } from '../types';
import { generateCertificatePDF, downloadCertificatePDF, renderCertificateToCanvas } from '../services/pdfGenerator';
import { sendCertificateViaGmail } from '../services/gmail';
import { uploadCertificateToDrive } from '../services/googleDriveSlides';

interface PublicClaimViewProps {
  recipients: Recipient[];
  template: CertificateTemplate;
  accessToken: string | null;
  onUpdateRecipientStatus: (id: string, status: 'issued' | 'emailed', type: 'email' | 'download') => void;
  maskPublicEmail: boolean;
  onRequireLogin: () => void;
  logAuditAction: (action: string, recipientName: string, status: 'success' | 'failed', details: string) => void;
}

export const PublicClaimView: React.FC<PublicClaimViewProps> = ({
  recipients,
  template,
  accessToken,
  onUpdateRecipientStatus,
  maskPublicEmail,
  onRequireLogin,
  logAuditAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Search filter
  const cleanQuery = searchTerm.trim().toLowerCase();
  const matchedRecipients = cleanQuery.length >= 2
    ? recipients.filter(
        (r) =>
          r.name.toLowerCase().includes(cleanQuery) ||
          r.certificateId.toLowerCase().includes(cleanQuery) ||
          r.email.toLowerCase().includes(cleanQuery)
      )
    : [];

  // When a recipient is selected, render canvas preview
  useEffect(() => {
    if (selectedRecipient) {
      setTargetEmail(selectedRecipient.email || '');
      setEmailStatus(null);
      renderCertificateToCanvas(selectedRecipient, template).then((canvas) => {
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
      });
    } else {
      setPreviewDataUrl(null);
    }
  }, [selectedRecipient, template]);

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
    });
  };

  const maskEmailAddress = (email: string) => {
    if (!maskPublicEmail) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}***${name.slice(-1)}` : `${name}***`;
    return `${maskedName}@${parts[1]}`;
  };

  // Immediate Send PDF via Gmail API
  const handleSendEmail = async () => {
    if (!selectedRecipient) return;

    if (!accessToken) {
      onRequireLogin();
      return;
    }

    const emailToSend = targetEmail.trim() || selectedRecipient.email;
    if (!emailToSend) {
      setEmailStatus({ success: false, message: 'กรุณาระบุอีเมลผู้รับ' });
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailStatus(null);

      // Generate PDF
      const recipientWithUpdatedEmail = { ...selectedRecipient, email: emailToSend };
      const { pdfBase64 } = await generateCertificatePDF(recipientWithUpdatedEmail, template);

      // Send via Gmail
      const sendResult = await sendCertificateViaGmail(
        accessToken,
        recipientWithUpdatedEmail,
        template,
        pdfBase64
      );

      if (sendResult.success) {
        setEmailStatus({
          success: true,
          message: `ส่งไฟล์เกียรติบัตร PDF ไปยัง ${emailToSend} สำเร็จเรียบร้อยแล้ว!`,
        });
        onUpdateRecipientStatus(selectedRecipient.id, 'emailed', 'email');
        logAuditAction('SEND_GMAIL_PDF', selectedRecipient.name, 'success', `ส่งไปยัง ${emailToSend}`);

        // Confetti celebration
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } else {
        setEmailStatus({
          success: false,
          message: sendResult.error || 'เกิดข้อผิดพลาดในการส่งอีเมล',
        });
        logAuditAction('SEND_GMAIL_PDF', selectedRecipient.name, 'failed', sendResult.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error(err);
      setEmailStatus({
        success: false,
        message: err.message || 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      });
      logAuditAction('SEND_GMAIL_PDF', selectedRecipient.name, 'failed', err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Instant PDF Download
  const handleDownloadPDF = async () => {
    if (!selectedRecipient) return;
    try {
      setIsDownloading(true);
      await downloadCertificatePDF(selectedRecipient, template);
      onUpdateRecipientStatus(selectedRecipient.id, 'issued', 'download');
      logAuditAction('DOWNLOAD_PDF', selectedRecipient.name, 'success', `รหัส: ${selectedRecipient.certificateId}`);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF: ' + err.message);
      logAuditAction('DOWNLOAD_PDF', selectedRecipient.name, 'failed', err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Save to Google Drive
  const handleSaveToDrive = async () => {
    if (!selectedRecipient) return;
    if (!accessToken) {
      onRequireLogin();
      return;
    }
    try {
      setIsSavingDrive(true);
      const { pdfBlob } = await generateCertificatePDF(selectedRecipient, template);
      const driveResult = await uploadCertificateToDrive(accessToken, selectedRecipient, pdfBlob);
      alert(`บันทึกเกียรติบัตรลงใน Google Drive เรียบร้อยแล้ว!`);
      logAuditAction('UPLOAD_DRIVE', selectedRecipient.name, 'success', `Drive File ID: ${driveResult.fileId}`);
    } catch (err: any) {
      console.error(err);
      alert('บันทึก Google Drive ไม่สำเร็จ: ' + err.message);
      logAuditAction('UPLOAD_DRIVE', selectedRecipient.name, 'failed', err.message);
    } finally {
      setIsSavingDrive(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>ระบบรับเกียรติบัตรอัตโนมัติ Real-Time Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-kanit">
          พิมพ์ชื่อ - นามสกุล เพื่อรับเกียรติบัตรทันที
        </h1>
        <p className="text-base text-slate-600 font-prompt">
          ระบบจะตรวจสอบข้อมูลจากฐานข้อมูล Google Sheets อย่างแม่นยำ พร้อมส่งไฟล์ PDF ทางการไปยังอีเมลของคุณทันที
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto">
        <div className="relative rounded-2xl shadow-lg shadow-amber-500/5 bg-white border border-slate-200/90 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all p-2 flex items-center">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="w-6 h-6 text-amber-600" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedRecipient && !e.target.value) {
                setSelectedRecipient(null);
              }
            }}
            placeholder="พิมพ์ ชื่อ - นามสกุล หรือ รหัสเกียรติบัตร เช่น สมชาย รักการเรียน..."
            className="w-full py-2.5 px-2 text-base sm:text-lg text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden font-prompt"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRecipient(null);
              }}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-600 rounded-md"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Quick sample chips */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs text-slate-500 justify-center">
          <span className="font-medium text-slate-400">ตัวอย่างค้นหา:</span>
          {['สมชาย รักการเรียน', 'กานดา วงศ์สุวรรณ', 'ธนวัฒน์ ศิริพงษ์', 'อภิสิทธิ์ เจริญผล'].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setSearchTerm(sample);
                const found = recipients.find((r) => r.name === sample);
                if (found) handleSelectRecipient(found);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results List (if multiple or searching) */}
      {cleanQuery.length >= 2 && !selectedRecipient && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>พบข้อมูลตรงกัน {matchedRecipients.length} รายการ</span>
            <span>คลิกเพื่อดูและรับเกียรติบัตร</span>
          </div>

          {matchedRecipients.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              {matchedRecipients.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRecipient(rec)}
                  className="p-4 hover:bg-amber-50/60 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 font-kanit text-base">
                        {rec.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {rec.certificateId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-md">
                      {rec.courseOrActivity}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{rec.department || rec.organization}</span>
                      {rec.scoreOrAward && <span>• {rec.scoreOrAward}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rec.status === 'emailed' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ส่งอีเมลแล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                        <Award className="w-3.5 h-3.5" />
                        <span>พร้อมรับ</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-800">ไม่พบรายชื่อในระบบ</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                โปรดตรวจสอบตัวสะกดชื่อ-นามสกุล หรือติดต่อผู้ดูแลระบบเพื่อตรวจสอบการลงทะเบียนใน Google Sheets
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Recipient Card & Action Panel */}
      {selectedRecipient && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Certificate Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 font-kanit">
                  ตัวอย่างเกียรติบัตรฉบับทางการ
                </h3>
              </div>
              <button
                onClick={() => setShowFullPreview(true)}
                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ขยายเต็มจอ</span>
              </button>
            </div>

            {/* Certificate Canvas / Image Preview */}
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 aspect-[1.414/1] flex items-center justify-center">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Certificate Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs">กำลังเรนเดอร์เกียรติบัตร...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ความละเอียดสูง 300 DPI เหมาะสำหรับพิมพ์และรับรองผลงาน</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">PDF Landscape A4</span>
            </div>
          </div>

          {/* Right Column: Instant Delivery & Download Actions */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Recipient Details Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    {selectedRecipient.certificateId}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 font-kanit mt-1">
                    {selectedRecipient.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  เลือกใหม่
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium">{selectedRecipient.courseOrActivity}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedRecipient.department || selectedRecipient.organization}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ออกให้ ณ วันที่ {selectedRecipient.issueDate}</span>
                </div>
                {selectedRecipient.scoreOrAward && (
                  <div className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ★ {selectedRecipient.scoreOrAward}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="pt-2 flex items-center gap-2">
                {selectedRecipient.status === 'emailed' ? (
                  <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ได้ทำการจัดส่งเกียรติบัตรเข้าอีเมลเรียบร้อยแล้ว</span>
                  </div>
                ) : selectedRecipient.status === 'issued' ? (
                  <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                    <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>ดาวน์โหลดเกียรติบัตรแล้ว</span>
                  </div>
                ) : (
                  <div className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>สถานะ: พร้อมส่งอีเมลและดาวน์โหลด</span>
                  </div>
                )}
              </div>

              {/* Email Send Box */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  ส่งไฟล์ PDF เข้าอีเมลของคุณ:
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 bg-slate-50/50 p-1">
                  <Mail className="w-4 h-4 text-slate-400 ml-2.5 mr-1" />
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="กรอกอีเมลสำหรับรับเกียรติบัตร..."
                    className="w-full py-1.5 px-2 text-sm text-slate-800 bg-transparent focus:outline-hidden"
                  />
                </div>
                {maskPublicEmail && (
                  <p className="text-[11px] text-slate-400">
                    * ระบบทำการปกปิดข้อมูลส่วนบุคคลตามนโยบาย PDPA: {maskEmailAddress(selectedRecipient.email)}
                  </p>
                )}

                {/* Primary Button: Send via Gmail */}
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งเกียรติบัตรเข้าอีเมล...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ส่งไฟล์ PDF ไปยังอีเมลทันที</span>
                    </>
                  )}
                </button>

                {/* Secondary Button: Direct PDF Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                      <span>กำลังเตรียมไฟล์ PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>ดาวน์โหลดเกียรติบัตร PDF ทันที</span>
                    </>
                  )}
                </button>

                {/* Workspace Google Drive Sync Button */}
                {accessToken && (
                  <button
                    onClick={handleSaveToDrive}
                    disabled={isSavingDrive}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isSavingDrive ? 'กำลังบันทึก...' : 'บันทึกสำเนาลง Google Drive ของคุณ'}</span>
                  </button>
                )}

                {/* Status Notice Toast */}
                {emailStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      emailStatus.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {emailStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

              </div>
            </div>

            {/* Verification Guarantee card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>การรับรองความถูกต้องของเกียรติบัตร</span>
              </p>
              <p>
                เกียรติบัตรทุกใบออกผ่านระบบ CertiFlow ที่ผูกโยงกับฐานข้อมูลทางการขององค์กร สามารถใช้อ้างอิงเลขที่เกียรติบัตรเพื่อตรวจสอบย้อนหลังได้ตลอดเวลา
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {showFullPreview && previewDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-kanit">
                ตัวอย่างเกียรติบัตรขนาดเต็ม - {selectedRecipient?.name}
              </h3>
              <button
                onClick={() => setShowFullPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-2 py-1"
              >
                ปิด
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
              <img
                src={previewDataUrl}
                alt="Full Preview"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-medium text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์ PDF</span>
              </button>
              <button
                onClick={() => setShowFullPreview(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
