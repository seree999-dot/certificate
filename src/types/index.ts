export type CertificateTheme =
  | 'royal-gold'
  | 'academic-blue'
  | 'emerald-tech'
  | 'burgundy-luxury'
  | 'modern-purple'
  | 'minimal-dark';

export type BorderStyle = 'classic' | 'modern' | 'ornate' | 'minimal';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  certificateId: string;
  courseOrActivity: string;
  organization: string;
  issueDate: string;
  scoreOrAward?: string;
  department?: string;
  status: 'pending' | 'issued' | 'emailed';
  emailedAt?: string | null;
  downloadedAt?: string | null;
}

export interface CertificateTemplate {
  theme: CertificateTheme;
  title: string;
  subtitle: string;
  bodyPrefix: string;
  bodySuffix: string;
  orgName: string;
  orgLogoUrl?: string;
  signer1Name: string;
  signer1Title: string;
  signer1SignatureUrl?: string;
  signer2Name: string;
  signer2Title: string;
  signer2SignatureUrl?: string;
  showQrCode: boolean;
  showBadge: boolean;
  badgeText: string;
  borderStyle: BorderStyle;
  fontFamily: 'Prompt' | 'Sarabun' | 'Kanit' | 'Cinzel';
  accentColor: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  recipientName: string;
  status: 'success' | 'failed';
  details: string;
}

export interface AdminConfig {
  adminEmails: string[];
  enterprisePin: string;
  sheetId: string;
  sheetTab: string;
  maskPublicEmail: boolean;
  autoSyncBackToSheets: boolean;
}
