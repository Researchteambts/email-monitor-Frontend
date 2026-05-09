export interface Account {
  id: number;
  email: string;
  provider: string;
  is_active: boolean;
  total_emails: number;
  unread_count: number;
  last_active: string | null;
}

export interface EmailEntry {
  id: number;
  account_id: number;
  uid: string;
  from: string;
  subject: string;
  body: string;
  is_read: boolean;
  received_at: string;
  forwarded_at: string;
  status: string;
  folder: string;
}