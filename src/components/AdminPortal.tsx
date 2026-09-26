import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  History,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Users,
  Database
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Recipient, AuditLogEntry, AdminConfig } from '../types';
import { fetchGoogleSheetData, createSampleSheetInDrive } from '../services/googleSheets';

interface AdminPortalProps {
  isAdminUnlocked: boolean;
  onUnlockAdmin: (pin: string) => boolean;
  user: User | null;
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (newConfig: AdminConfig) => void;
  recipients: Recipient[];
  onSetRecipients: (recipients: Recipient[]) => void;
  auditLogs: AuditLogEntry[];
  accessToken: string | null;
  onRequireLogin: () => void;
  logAuditAction: (action: string, recipientName: string, status: 'success' | 'failed', details: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isAdminUnlocked,
  onUnlockAdmin,
  user,
  adminConfig,
  onUpdateAdminConfig,
  recipients,
  onSetRecipients,
  auditLogs,
  accessToken,
  onRequireLogin,
  logAuditAction,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [sheetIdInput, setSheetIdInput] = useState(adminConfig.sheetId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // New recipient form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState<Partial<Recipient>>({
    name: '',
    email: '',
    certificateId: `CERT-2026-${String(recipients.length + 1).padStart(3, '0')}`,
    courseOrActivity: 'การประยุกต์ใช้เทคโนโลยีและการจัดการนวัตกรรม',
    organization: 'สถาบันพัฒนานวัตกรรมและเทคโนโลยีดิจิทัล',
    issueDate: '26 กันยายน 2569',
    department: 'ฝ่ายพัฒนาระบบสารสนเทศ',
    scoreOrAward: 'ผ่านการทดสอบสมรรถนะ',
    status: 'pending',
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlockAdmin(pinInput);
    if (success) {
      setPinError(false);
      setPinInput('');
      logAuditAction('ADMIN_LOGIN', 'Admin Console', 'success', `User: ${user?.email || 'PIN Admin'}`);
    } else {
      setPinError(true);
      logAuditAction('ADMIN_LOGIN', 'Admin Console', 'failed', 'Invalid PIN code');
    }
  };

  // Sync from Google Sheets
  const handleSyncFromSheets = async () => {
    if (!sheetIdInput.trim()) {
      setSyncStatus({ success: false, message: 'กรุณากรอก Google Sheet ID หรือ URL' });
      return;
    }

    if (!accessToken) {
      onRequireLogin();
      return;
    }

    // Extract ID from URL if user pasted a full URL
    let cleanId = sheetIdInput.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    try {
      setIsSyncing(true);
      setSyncStatus(null);
      const rows = await fetchGoogleSheetData(accessToken, cleanId);
      if (rows && rows.length > 0) {
        onSetRecipients(rows);
        onUpdateAdminConfig({ ...adminConfig, sheetId: cleanId });
        setSyncStatus({
          success: true,
          message: `เชื่อมต่อและดึงข้อมูลสำเร็จ! พบรายชื่อทั้งหมด ${rows.length} รายการ`,
        });
        logAuditAction('SYNC_SHEETS', 'Google Sheets DB', 'success', `Sheet ID: ${cleanId}, Found: ${rows.length} rows`);
      } else {
        setSyncStatus({
          success: false,
          message: 'เชื่อมต่อสำเร็จแต่ไม่พบข้อมูลรายชื่อในแถวที่ 2 เป็นต้นไป',
        });
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        success: false,
        message: err.message || 'เชื่อมต่อ Google Sheets ไม่สำเร็จ โปรดตรวจสอบสิทธิ์การเข้าถึง',
      });
      logAuditAction('SYNC_SHEETS', 'Google Sheets DB', 'failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto create sample sheet in Drive
  const handleCreateSampleSheet = async () => {
    if (!accessToken) {
      onRequireLogin();
      return;
    }

    try {
      setIsCreatingSheet(true);
      const res = await createSampleSheetInDrive(accessToken);
      setCreatedSheetUrl(res.spreadsheetUrl);
      setSheetIdInput(res.spreadsheetId);
      onUpdateAdminConfig({ ...adminConfig, sheetId: res.spreadsheetId });
      setSyncStatus({
        success: true,
        message: `สร้าง Google Sheet ใหม่บน Google Drive เรียบร้อยแล้ว! รหัสชีต: ${res.spreadsheetId}`,
      });
      logAuditAction('CREATE_DRIVE_SHEET', 'Google Drive', 'success', res.spreadsheetUrl);
    } catch (err: any) {
      alert('สร้าง Google Sheet ไม่สำเร็จ: ' + err.message);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Add new recipient manually
  const handleAddRecipient = () => {
    if (!newRecipient.name?.trim() || !newRecipient.email?.trim()) {
      alert('กรุณากรอกชื่อและอีเมล');
      return;
    }

    const created: Recipient = {
      id: String(Date.now()),
      name: newRecipient.name.trim(),
      email: newRecipient.email.trim(),
      certificateId: newRecipient.certificateId || `CERT-${Date.now().toString().slice(-4)}`,
      courseOrActivity: newRecipient.courseOrActivity || 'หลักสูตรอบรม',
      organization: newRecipient.organization || 'องค์กร',
      issueDate: newRecipient.issueDate || '26 กันยายน 2569',
      department: newRecipient.department,
      scoreOrAward: newRecipient.scoreOrAward,
      status: 'pending',
    };

    onSetRecipients([created, ...recipients]);
    setShowAddModal(false);
    logAuditAction('ADD_RECIPIENT', created.name, 'success', `รหัส: ${created.certificateId}`);
  };

  const handleDeleteRecipient = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบรายชื่อ "${name}" ออกจากระบบหรือไม่?`)) {
      onSetRecipients(recipients.filter((r) => r.id !== id));
      logAuditAction('DELETE_RECIPIENT', name, 'success', `ID: ${id}`);
    }
  };

  // Login Gate if not unlocked
  if (!isAdminUnlocked) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-kanit">
              ระบบรักษาความปลอดภัยระดับองค์กร
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ส่วนงานผู้ดูแลระบบ (Admin Control Portal) ป้องกันข้อมูลส่วนบุคคลตามมาตรฐานความปลอดภัย
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-slate-700">
                รหัสผ่านผู้ดูแลระบบ (Admin Enterprise PIN):
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="กรอกรหัส PIN (ค่าเริ่มต้น: 1234)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              {pinError && (
                <p className="text-xs text-rose-600 font-medium">
                  รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง (PIN เริ่มต้น: 1234)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              ปลดล็อกเข้าสู่แผงควบคุม
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            * หากผู้ใช้เข้าสู่ระบบด้วย Google Account ขององค์กรที่อยู่ในสิทธิ์ จะได้รับการอนุมัติอัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-kanit">
              ระบบจัดการความปลอดภัย & การเข้าถึงข้อมูลระดับองค์กร
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            เชื่อมต่อ Google Sheets ตรวจสอบประวัติการใช้งาน (Audit Log) และควบคุมนโยบายความเป็นส่วนตัว
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>สิทธิ์ผู้ดูแลระบบ: ปลดล็อกแล้ว</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Google Sheets Connect & Security Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Google Sheets Connection Hub */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 font-kanit">
                การเชื่อมต่อฐานข้อมูล Google Sheets
              </h3>
            </div>
            <span className="text-xs text-slate-400">Google Workspace API</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ระบุ <strong>Google Sheet ID</strong> หรือ วางลิงก์ Google Sheets ของคุณ เพื่อให้ระบบดึงข้อมูลผู้รับเกียรติบัตรมาตรวจสอบแบบเรียลไทม์ หรือกดปุ่มสร้างชีตตัวอย่างอัตโนมัติลงในบัญชี Google Drive ของคุณ
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Google Spreadsheet ID หรือ URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sheetIdInput}
                onChange={(e) => setSheetIdInput(e.target.value)}
                placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:border-indigo-500 focus:outline-hidden"
              />
              <button
                onClick={handleSyncFromSheets}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงก์...' : 'ซิงก์ข้อมูล'}</span>
              </button>
            </div>
          </div>

          {/* Action to auto-create Google Sheet */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-emerald-900">ยังไม่มี Google Sheet หรือต้องการแม่แบบเริ่มต้น?</p>
              <p className="text-emerald-700 text-[11px]">ระบบสามารถสร้างชีตใหม่ที่จัดฟอร์แมตหัวคอลัมน์ครบถ้วนใน Google Drive ของคุณทันที</p>
            </div>
            <button
              onClick={handleCreateSampleSheet}
              disabled={isCreatingSheet}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingSheet ? 'กำลังสร้าง...' : 'สร้างชีตตัวอย่างใน Drive'}</span>
            </button>
          </div>

          {createdSheetUrl && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200">
              <span className="truncate max-w-sm">ลิงก์ชีต: {createdSheetUrl}</span>
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 font-bold hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>เปิดดูชีต</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {syncStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                syncStatus.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {syncStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </div>

        {/* Security & Access Policies */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 font-kanit">
              นโยบายการควบคุมความปลอดภัย (Security Policy)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Mask Public Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">
                  การปกปิดข้อมูลอีเมลสาธารณะ (Data Masking PDPA)
                </span>
                <span className="text-slate-500 text-[11px] block">
                  ซ่อนตัวอักษรบางส่วนในหน้าค้นหา เช่น som***@domain.com
                </span>
              </div>
              <button
                onClick={() =>
                  onUpdateAdminConfig({
                    ...adminConfig,
                    maskPublicEmail: !adminConfig.maskPublicEmail,
                  })
                }
                className={`p-1.5 rounded-lg border transition-colors ${
                  adminConfig.maskPublicEmail
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-300'
                }`}
              >
                {adminConfig.maskPublicEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PIN Code Change */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">
                รหัสผ่านสำหรับเข้าถึงระบบแอดมิน (PIN Code):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={adminConfig.enterprisePin}
                  onChange={(e) =>
                    onUpdateAdminConfig({
                      ...adminConfig,
                      enterprisePin: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 shrink-0">บันทึกอัตโนมัติ</span>
              </div>
            </div>

            {/* Google Admin Email Whitelist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 block">
                บัญชี Google ผู้ดูแลระบบที่ได้รับอนุญาต:
              </span>
              <p className="text-[11px] text-slate-500">
                ปัจจุบัน: {user?.email || 'seree999@gmail.com'} (Super Admin)
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Recipient Management Table with Manual Add */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 font-kanit">
              จัดการรายชื่อผู้รับเกียรติบัตร ({recipients.length} คน)
            </h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มรายชื่อใหม่</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">รหัส</th>
                <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                <th className="py-2.5 px-3">อีเมล</th>
                <th className="py-2.5 px-3">หลักสูตร</th>
                <th className="py-2.5 px-3">สถานะ</th>
                <th className="py-2.5 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipients.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono text-slate-600">{rec.certificateId}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{rec.email}</td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{rec.courseOrActivity}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      rec.status === 'emailed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rec.status === 'issued'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {rec.status === 'emailed' ? 'ส่งแล้ว' : rec.status === 'issued' ? 'ดาวน์โหลดแล้ว' : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRecipient(rec.id, rec.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="ลบรายชื่อ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 font-kanit">
              บันทึกกิจกรรมความปลอดภัยระดับองค์กร (Audit Trail Logs)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{auditLogs.length} รายการ</span>
        </div>

        <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">เวลา (Timestamp)</th>
                <th className="py-2.5 px-3">กิจกรรม (Action)</th>
                <th className="py-2.5 px-3">เป้าหมาย (Target)</th>
                <th className="py-2.5 px-3">ผลลัพธ์</th>
                <th className="py-2.5 px-3">รายละเอียด (Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 text-slate-500 text-[11px]">{log.timestamp}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-2 px-3 text-slate-700">{log.recipientName}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 truncate max-w-sm">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Recipient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-slate-900 font-kanit">
              เพิ่มรายชื่อผู้รับเกียรติบัตรใหม่
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="เช่น นายธนากร จิตมุ่งมั่น"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">อีเมล *</label>
                <input
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  placeholder="เช่น thanakorn.j@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสเกียรติบัตร</label>
                  <input
                    type="text"
                    value={newRecipient.certificateId}
                    onChange={(e) => setNewRecipient({ ...newRecipient, certificateId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">แผนก / สังกัด</label>
                  <input
                    type="text"
                    value={newRecipient.department}
                    onChange={(e) => setNewRecipient({ ...newRecipient, department: e.target.value })}
                    placeholder="เช่น ฝ่ายเทคโนโลยีสารสนเทศ"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หลักสูตร / กิจกรรม</label>
                <input
                  type="text"
                  value={newRecipient.courseOrActivity}
                  onChange={(e) => setNewRecipient({ ...newRecipient, courseOrActivity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                บันทึกรายชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
