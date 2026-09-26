import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  UserCheck,
  Award,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  Presentation,
  CheckCircle2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { CertificateTemplate, CertificateTheme, Recipient } from '../types';
import { renderCertificateToCanvas } from '../services/pdfGenerator';
import { createSlidesCertificateTemplate } from '../services/googleDriveSlides';

interface TemplateDesignerProps {
  template: CertificateTemplate;
  onUpdateTemplate: (newTemplate: CertificateTemplate) => void;
  sampleRecipient: Recipient;
  accessToken: string | null;
  onRequireLogin: () => void;
  logAuditAction: (action: string, recipientName: string, status: 'success' | 'failed', details: string) => void;
}

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  template,
  onUpdateTemplate,
  sampleRecipient,
  accessToken,
  onRequireLogin,
  logAuditAction,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate>(template);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isCreatingSlides, setIsCreatingSlides] = useState(false);
  const [slidesUrl, setSlidesUrl] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Update preview whenever currentTemplate changes
  useEffect(() => {
    let isCancelled = false;
    setIsRendering(true);
    renderCertificateToCanvas(sampleRecipient, currentTemplate).then((canvas) => {
      if (!isCancelled) {
        setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
        setIsRendering(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [currentTemplate, sampleRecipient]);

  const handleChange = (key: keyof CertificateTemplate, value: any) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onUpdateTemplate(currentTemplate);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    logAuditAction('SAVE_TEMPLATE', 'All Recipients', 'success', `Theme: ${currentTemplate.theme}, Title: ${currentTemplate.title}`);
  };

  const handleCreateSlides = async () => {
    if (!accessToken) {
      onRequireLogin();
      return;
    }
    try {
      setIsCreatingSlides(true);
      const res = await createSlidesCertificateTemplate(accessToken, currentTemplate);
      setSlidesUrl(res.slideUrl);
      logAuditAction('CREATE_GOOGLE_SLIDES', 'Template Deck', 'success', res.slideUrl);
    } catch (err: any) {
      alert('สร้าง Google Slides ไม่สำเร็จ: ' + err.message);
    } finally {
      setIsCreatingSlides(false);
    }
  };

  const themes: { id: CertificateTheme; name: string; color: string; desc: string }[] = [
    {
      id: 'royal-gold',
      name: 'Royal Gold (สีทองพระราชทาน)',
      color: '#b8860b',
      desc: 'เหมาะสำหรับพิธีการ มอบรางวัลทรงเกียรติ และสถาบันชั้นนำ',
    },
    {
      id: 'academic-blue',
      name: 'Academic Blue (น้ำเงินวิชาการ)',
      color: '#1e40af',
      desc: 'เหมาะสำหรับมหาวิทยาลัย ใบประกาศนียบัตร และหลักสูตรวิชาชีพ',
    },
    {
      id: 'emerald-tech',
      name: 'Emerald Tech (เขียวมรกตนวัตกรรม)',
      color: '#065f46',
      desc: 'เหมาะสำหรับสายเทคโนโลยี สิ่งแวดล้อม และนวัตกรรมดิจิทัล',
    },
    {
      id: 'burgundy-luxury',
      name: 'Burgundy Luxury (แดงเบอร์กันดีพรีเมียม)',
      color: '#881337',
      desc: 'เหมาะสำหรับงานเกียรติยศระดับนานาชาติ และองค์กรระดับสูง',
    },
    {
      id: 'modern-purple',
      name: 'Modern Purple (ม่วงร่วมสมัย)',
      color: '#6b21a8',
      desc: 'เหมาะสำหรับงานสร้างสรรค์ เวิร์กช็อป และหลักสูตรผู้นำยุคใหม่',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-kanit">
              เครื่องมือปรับแต่งดีไซน์เทมเพลตเกียรติบัตร
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ปรับแต่งรูปแบบตราประจำองค์กร ลายเซ็นดิจิทัล ฟอนต์ และโทนสี พร้อมดูตัวอย่างแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกเทมเพลต</span>
          </button>

          {accessToken && (
            <button
              onClick={handleCreateSlides}
              disabled={isCreatingSlides}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Presentation className="w-4 h-4 text-amber-600" />
              <span>{isCreatingSlides ? 'กำลังสร้าง Slides...' : 'สร้างใน Google Slides'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>บันทึกการตั้งค่าเทมเพลตสำเร็จแล้ว!</span>
        </div>
      )}

      {/* Google Slides Alert if created */}
      {slidesUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-amber-600" />
            <span>สร้างเอกสารแม่แบบบน Google Slides เรียบร้อยแล้ว สามารถเปิดแก้ไขได้ทันที</span>
          </div>
          <a
            href={slidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-700 font-bold hover:underline"
          >
            <span>เปิด Google Slides</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Split Screen Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-6 space-y-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs max-h-[82vh] overflow-y-auto">
          
          {/* 1. Theme Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>เลือกสไตล์ธีมสีและลวดลาย (Theme & Palette)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleChange('theme', t.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    currentTemplate.theme === t.id
                      ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-bold text-slate-800">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. Text Titles & Headings */}
          <div className="space-y-3.5">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-600" />
              <span>ข้อความและส่วนหัวเกียรติบัตร (Titles & Content)</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ชื่อหน่วยงาน / องค์กรผู้ออกเกียรติบัตร:
              </label>
              <input
                type="text"
                value={currentTemplate.orgName}
                onChange={(e) => handleChange('orgName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  หัวข้อเกียรติบัตร:
                </label>
                <input
                  type="text"
                  value={currentTemplate.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  คำบรรยายย่อย (Subtitle):
                </label>
                <input
                  type="text"
                  value={currentTemplate.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                คำนำหน้าชื่อผู้รับ (Prefix):
              </label>
              <input
                type="text"
                value={currentTemplate.bodyPrefix}
                onChange={(e) => handleChange('bodyPrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ข้อความรับรองการเข้าร่วม / ผ่านหลักสูตร (Suffix):
              </label>
              <textarea
                rows={2}
                value={currentTemplate.bodySuffix}
                onChange={(e) => handleChange('bodySuffix', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. Typography & Badges */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ฟอนต์และตราประทับเกียรติยศ (Typography & Badge)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ตระกูลฟอนต์ (Font Family):
                </label>
                <select
                  value={currentTemplate.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="Prompt">Prompt (โมเดิร์นมาตรฐาน)</option>
                  <option value="Sarabun">Sarabun (ทางการราชการ)</option>
                  <option value="Kanit">Kanit (โดดเด่น อ่านง่าย)</option>
                  <option value="Cinzel">Cinzel (คลาสสิกสากล)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={currentTemplate.showBadge}
                    onChange={(e) => handleChange('showBadge', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>แสดงตราประทับทองคำ (Official Certified Seal)</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. Dual Signatures */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>ผู้ลงนามและลายเซ็น (Authorized Signatories)</span>
            </label>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-700">ผู้ลงนามคนที่ 1 (ด้านซ้าย)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ชื่อ - สกุล ผู้ลงนามที่ 1"
                  value={currentTemplate.signer1Name}
                  onChange={(e) => handleChange('signer1Name', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden bg-white"
                />
                <input
                  type="text"
                  placeholder="ตำแหน่งผู้ลงนามที่ 1"
                  value={currentTemplate.signer1Title}
                  onChange={(e) => handleChange('signer1Title', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden bg-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-700">ผู้ลงนามคนที่ 2 (ด้านขวา)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ชื่อ - สกุล ผู้ลงนามที่ 2"
                  value={currentTemplate.signer2Name}
                  onChange={(e) => handleChange('signer2Name', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden bg-white"
                />
                <input
                  type="text"
                  placeholder="ตำแหน่งผู้ลงนามที่ 2"
                  value={currentTemplate.signer2Title}
                  onChange={(e) => handleChange('signer2Title', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Real-Time Live Preview */}
        <div className="lg:col-span-6 space-y-3 sticky top-24">
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">
                ตัวอย่างแสดงผลสด (Live Interactive Certificate)
              </span>
            </div>
            {isRendering && (
              <span className="text-[11px] text-amber-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>กำลังอัปเดต...</span>
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 shadow-md overflow-hidden bg-slate-900 aspect-[1.414/1] flex items-center justify-center p-2">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Certificate Live Preview"
                className="w-full h-full object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
                <p className="text-xs">กำลังประมวลผลตัวอย่างเกียรติบัตร...</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
            <span>ตัวอย่างข้อมูลทดสอบ: <strong>{sampleRecipient.name}</strong></span>
            <span className="text-[11px] text-amber-700">อัปเดตอัตโนมัติขณะพิมพ์</span>
          </div>
        </div>

      </div>

    </div>
  );
};
