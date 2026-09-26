import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  Send,
  FileSpreadsheet,
  PieChart,
  Users,
  Search,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Recipient, CertificateTemplate } from '../types';
import { generateCertificatePDF } from '../services/pdfGenerator';
import { sendCertificateViaGmail } from '../services/gmail';

interface AnalyticsDashboardProps {
  recipients: Recipient[];
  template: CertificateTemplate;
  accessToken: string | null;
  onUpdateRecipientStatus: (id: string, status: 'issued' | 'emailed', type: 'email' | 'download') => void;
  onRequireLogin: () => void;
  logAuditAction: (action: string, recipientName: string, status: 'success' | 'failed', details: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  recipients,
  template,
  accessToken,
  onUpdateRecipientStatus,
  onRequireLogin,
  logAuditAction,
}) => {
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Metrics
  const total = recipients.length;
  const emailedCount = recipients.filter((r) => r.status === 'emailed').length;
  const issuedCount = recipients.filter((r) => r.status === 'issued').length;
  const pendingCount = recipients.filter((r) => r.status === 'pending').length;
  const totalClaimed = emailedCount + issuedCount;
  const claimRate = total > 0 ? Math.round((totalClaimed / total) * 100) : 0;

  // Department groupings
  const departmentCounts: Record<string, { total: number; claimed: number }> = {};
  recipients.forEach((r) => {
    const dept = r.department || 'ทั่วไป / บุคคลภายนอก';
    if (!departmentCounts[dept]) {
      departmentCounts[dept] = { total: 0, claimed: 0 };
    }
    departmentCounts[dept].total += 1;
    if (r.status === 'emailed' || r.status === 'issued') {
      departmentCounts[dept].claimed += 1;
    }
  });

  const departmentList = Object.keys(departmentCounts);

  // Filtered recipients for table
  const filteredRecipients = recipients.filter((r) => {
    const matchesDept = filterDepartment === 'all' || (r.department || 'ทั่วไป / บุคคลภายนอก') === filterDepartment;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'รหัสเกียรติบัตร',
      'ชื่อ - นามสกุล',
      'อีเมล',
      'หลักสูตร / กิจกรรม',
      'แผนก / หน่วยงาน',
      'ผลงาน / รางวัล',
      'วันที่ออก',
      'สถานะ',
    ];

    const rows = filteredRecipients.map((r, i) => [
      i + 1,
      `"${r.certificateId}"`,
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.courseOrActivity}"`,
      `"${r.department || '-'}"`,
      `"${r.scoreOrAward || '-'}"`,
      `"${r.issueDate}"`,
      r.status === 'emailed' ? 'ส่งอีเมลแล้ว' : r.status === 'issued' ? 'ดาวน์โหลดแล้ว' : 'รอดำเนินการ',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CertiFlow_Export_Statistics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logAuditAction('EXPORT_CSV', 'Filtered Recipients', 'success', `จำนวน ${filteredRecipients.length} รายชื่อ`);
  };

  // Bulk Email Dispatch to all pending
  const handleBulkSendEmails = async () => {
    if (!accessToken) {
      onRequireLogin();
      return;
    }

    const pendingList = recipients.filter((r) => r.status === 'pending');
    if (pendingList.length === 0) {
      alert('ไม่มีรายชื่อที่รอดำเนินการส่งอีเมล');
      return;
    }

    if (!confirm(`ยืนยันการส่งเกียรติบัตร PDF ทางอีเมลไปยังผู้รับทั้งหมด ${pendingList.length} รายการ?`)) {
      return;
    }

    setIsBatchSending(true);
    setBatchProgress({ current: 0, total: pendingList.length });

    let successCount = 0;
    for (let i = 0; i < pendingList.length; i++) {
      const rec = pendingList[i];
      try {
        const { pdfBase64 } = await generateCertificatePDF(rec, template);
        const res = await sendCertificateViaGmail(accessToken, rec, template, pdfBase64);
        if (res.success) {
          onUpdateRecipientStatus(rec.id, 'emailed', 'email');
          successCount++;
        }
      } catch (err) {
        console.error('Batch send error for ' + rec.name, err);
      }
      setBatchProgress({ current: i + 1, total: pendingList.length });
    }

    setIsBatchSending(false);
    setBatchProgress(null);
    alert(`ส่งอีเมลเกียรติบัตรแบบกลุ่มเสร็จสิ้น: สำเร็จ ${successCount} จาก ${pendingList.length} รายการ`);
    logAuditAction('BATCH_SEND_GMAIL', 'Pending Recipients', 'success', `ส่งสำเร็จ ${successCount}/${pendingList.length}`);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-kanit">
              สถิติการออกเกียรติบัตร & การส่งออกข้อมูล (Analytics & Export)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            สรุปผลการจัดส่ง ประมวลผลกราฟิกจำแนกตามแผนก พร้อมเครื่องมือส่งอีเมลกลุ่มและส่งออกข้อมูล
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV เพื่อประมวลผลสถิติ</span>
          </button>

          <button
            onClick={handleBulkSendEmails}
            disabled={isBatchSending || pendingCount === 0}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isBatchSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังส่ง ({batchProgress?.current}/{batchProgress?.total})...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งอีเมลอัตโนมัติทั้งหมด ({pendingCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>ผู้มีสิทธิ์ทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-kanit">
            {total}
          </div>
          <p className="text-[11px] text-slate-400">จากฐานข้อมูลที่เชื่อมต่อ</p>
        </div>

        {/* Emailed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-1 bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>ส่งเข้าอีเมลแล้ว</span>
            <Mail className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-kanit">
            {emailedCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {total > 0 ? Math.round((emailedCount / total) * 100) : 0}% ของทั้งหมด
          </p>
        </div>

        {/* Issued/Downloaded */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs space-y-1 bg-gradient-to-b from-white to-blue-50/20">
          <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
            <span>ดาวน์โหลดแล้ว</span>
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-kanit">
            {issuedCount}
          </div>
          <p className="text-[11px] text-blue-600 font-medium">
            {total > 0 ? Math.round((issuedCount / total) * 100) : 0}% ของทั้งหมด
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs space-y-1 bg-gradient-to-b from-white to-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>รอดำเนินการ</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-kanit">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium">
            {total > 0 ? Math.round((pendingCount / total) * 100) : 0}% คงค้าง
          </p>
        </div>

        {/* Claim Rate */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex items-center justify-between text-amber-100 text-xs font-medium">
            <span>อัตราความสำเร็จ</span>
            <TrendingUp className="w-4 h-4 text-amber-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-kanit">
            {claimRate}%
          </div>
          <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${claimRate}%` }}
            />
          </div>
        </div>

      </div>

      {/* Graphical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graphic 1: Department Bar Distribution Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800 font-kanit">
                สถิติการรับเกียรติบัตรจำแนกตามหน่วยงาน / แผนก
              </h3>
            </div>
            <span className="text-xs text-slate-400">อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {departmentList.map((dept) => {
              const info = departmentCounts[dept];
              const pct = info.total > 0 ? Math.round((info.claimed / info.total) * 100) : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-xs">{dept}</span>
                    <span className="text-slate-500 font-mono">
                      {info.claimed}/{info.total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graphic 2: Delivery Channels Visual Radial */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800 font-kanit">
                สัดส่วนสถานะการจัดส่ง
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Delivery Status Breakdown</p>
          </div>

          {/* SVG Donut Graphic */}
          <div className="py-4 flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 36 36" className="w-36 h-36">
              {/* Background circle */}
              <path
                className="text-slate-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Emailed stroke */}
              <path
                className="text-emerald-500"
                strokeDasharray={`${total > 0 ? (emailedCount / total) * 100 : 0}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Issued stroke */}
              <path
                className="text-blue-500"
                strokeDasharray={`${total > 0 ? (issuedCount / total) * 100 : 0}, 100`}
                strokeDashoffset={`-${total > 0 ? (emailedCount / total) * 100 : 0}`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold font-kanit text-slate-800">{claimRate}%</span>
              <span className="block text-[10px] text-slate-400">สำเร็จ</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>ส่งอีเมลเรียบร้อย</span>
              </span>
              <span className="font-semibold text-slate-800">{emailedCount} ราย</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>ดาวน์โหลดทางเว็บ</span>
              </span>
              <span className="font-semibold text-slate-800">{issuedCount} ราย</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>ยังไม่ได้รับเกียรติบัตร</span>
              </span>
              <span className="font-semibold text-slate-800">{pendingCount} ราย</span>
            </div>
          </div>

        </div>

      </div>

      {/* Recipient Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 font-kanit">
              รายชื่อผู้มีสิทธิ์รับเกียรติบัตร ({filteredRecipients.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            >
              <option value="all">ทุกแผนก / หน่วยงาน</option>
              {departmentList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="emailed">ส่งอีเมลแล้ว</option>
              <option value="issued">ดาวน์โหลดแล้ว</option>
              <option value="pending">รอดำเนินการ</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">รหัสเกียรติบัตร</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">หลักสูตร / กิจกรรม</th>
                <th className="py-3 px-4">แผนก / สังกัด</th>
                <th className="py-3 px-4">ผลการประเมิน</th>
                <th className="py-3 px-4">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecipients.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {rec.certificateId}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 font-kanit">
                    {rec.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {rec.email}
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                    {rec.courseOrActivity}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {rec.department || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {rec.scoreOrAward ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        {rec.scoreOrAward}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {rec.status === 'emailed' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ส่งอีเมลแล้ว</span>
                      </span>
                    ) : rec.status === 'issued' ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ดาวน์โหลดแล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>รอดำเนินการ</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
