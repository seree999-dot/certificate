/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from './services/auth';
import { Navbar } from './components/Navbar';
import { PublicClaimView } from './components/PublicClaimView';
import { TemplateDesigner } from './components/TemplateDesigner';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AdminPortal } from './components/AdminPortal';
import { DEFAULT_TEMPLATE } from './constants/defaultTemplate';
import { INITIAL_SAMPLE_RECIPIENTS, updateSheetRecipientStatus } from './services/googleSheets';
import { Recipient, CertificateTemplate, AdminConfig, AuditLogEntry } from './types';
import { Award, ShieldAlert, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'claim' | 'designer' | 'analytics' | 'admin'>('claim');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // App data states
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    const saved = localStorage.getItem('certiflow_recipients');
    return saved ? JSON.parse(saved) : INITIAL_SAMPLE_RECIPIENTS;
  });

  const [template, setTemplate] = useState<CertificateTemplate>(() => {
    const saved = localStorage.getItem('certiflow_template');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    const saved = localStorage.getItem('certiflow_admin_config');
    return saved
      ? JSON.parse(saved)
      : {
          adminEmails: ['seree999@gmail.com'],
          enterprisePin: '1234',
          sheetId: '',
          sheetTab: 'Sheet1',
          maskPublicEmail: true,
          autoSyncBackToSheets: true,
        };
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('certiflow_audit_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-1',
            timestamp: new Date().toLocaleTimeString('th-TH'),
            action: 'SYSTEM_BOOT',
            userEmail: 'system',
            recipientName: 'CertiFlow Engine',
            status: 'success',
            details: 'ระบบตรวจสอบรายชื่อและออกเกียรติบัตรพร้อมใช้งาน',
          },
        ];
  });

  // Persist local changes
  useEffect(() => {
    localStorage.setItem('certiflow_recipients', JSON.stringify(recipients));
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem('certiflow_template', JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    localStorage.setItem('certiflow_admin_config', JSON.stringify(adminConfig));
  }, [adminConfig]);

  useEffect(() => {
    localStorage.setItem('certiflow_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log audit helper
  const logAuditAction = useCallback(
    (action: string, recipientName: string, status: 'success' | 'failed', details: string) => {
      const newEntry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action,
        userEmail: user?.email || 'Anonymous/Client',
        recipientName,
        status,
        details,
      };
      setAuditLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
    },
    [user]
  );

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (currentUser.email && adminConfig.adminEmails.includes(currentUser.email)) {
          setIsAdminUnlocked(true);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [adminConfig.adminEmails]);

  // Sign in handler
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        if (res.user.email && adminConfig.adminEmails.includes(res.user.email)) {
          setIsAdminUnlocked(true);
        }
        logAuditAction('GOOGLE_SIGN_IN', res.user.displayName || 'User', 'success', res.user.email || '');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      logAuditAction('GOOGLE_SIGN_IN', 'User', 'failed', err.message || 'Login cancelled');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setIsAdminUnlocked(false);
  };

  const handleUnlockAdmin = (pin: string): boolean => {
    if (pin.trim() === adminConfig.enterprisePin.trim()) {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  // Recipient status update (e.g. after email or download)
  const handleUpdateRecipientStatus = (
    id: string,
    newStatus: 'issued' | 'emailed',
    type: 'email' | 'download'
  ) => {
    const nowStr = new Date().toLocaleString('th-TH');
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: newStatus,
            emailedAt: type === 'email' ? nowStr : r.emailedAt,
            downloadedAt: type === 'download' ? nowStr : r.downloadedAt,
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-prompt text-slate-800 selection:bg-amber-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        isAdminUnlocked={isAdminUnlocked}
        connectedSheetId={adminConfig.sheetId || null}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'claim' && (
          <PublicClaimView
            recipients={recipients}
            template={template}
            accessToken={accessToken}
            onUpdateRecipientStatus={handleUpdateRecipientStatus}
            maskPublicEmail={adminConfig.maskPublicEmail}
            onRequireLogin={handleLogin}
            logAuditAction={logAuditAction}
          />
        )}

        {activeTab === 'designer' && (
          <TemplateDesigner
            template={template}
            onUpdateTemplate={setTemplate}
            sampleRecipient={recipients[0] || INITIAL_SAMPLE_RECIPIENTS[0]}
            accessToken={accessToken}
            onRequireLogin={handleLogin}
            logAuditAction={logAuditAction}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            recipients={recipients}
            template={template}
            accessToken={accessToken}
            onUpdateRecipientStatus={handleUpdateRecipientStatus}
            onRequireLogin={handleLogin}
            logAuditAction={logAuditAction}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            isAdminUnlocked={isAdminUnlocked}
            onUnlockAdmin={handleUnlockAdmin}
            user={user}
            adminConfig={adminConfig}
            onUpdateAdminConfig={setAdminConfig}
            recipients={recipients}
            onSetRecipients={setRecipients}
            auditLogs={auditLogs}
            accessToken={accessToken}
            onRequireLogin={handleLogin}
            logAuditAction={logAuditAction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 font-kanit">CertiFlow</span>
            <span>—</span>
            <span>ระบบออกเกียรติบัตรและส่งอีเมลอัตโนมัติ เชื่อมต่อ Google Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Google Sheets</span>
            <span>•</span>
            <span>Gmail API</span>
            <span>•</span>
            <span>Google Drive</span>
            <span>•</span>
            <span>Google Slides</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
