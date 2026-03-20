import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iyszwbxtbdmgjoughdzf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5c3p3Ynh0YmRtZ2pvdWdoZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDE0MTMsImV4cCI6MjA4OTA3NzQxM30.ovSqzcio4kw6lOmsh4ZEGCPtzgnX-UjabYVFn1dlhh0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface ScanRecord {
  id: string;
  user_id: string;
  file_name: string;
  image_url: string | null;
  classification: string;
  confidence: number;
  risk_level: string;
  prob_normal: number;
  prob_benign: number;
  prob_malignant: number;
  notes: string;
  created_at: string;
}

export interface ScanResult {
  id: string;
  fileName: string;
  image: string | null;
  result: {
    classification: string;
    confidence: number;
    probabilities: { normal: number; benign: number; malignant: number };
    riskLevel: string;
  };
  date: string;
  notes: string;
}
