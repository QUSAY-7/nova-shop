import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ugeekzmtavxcfrhtfrjq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWVrem10YXZ4Y2ZyaHRmcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDU4NDAsImV4cCI6MjEwMDEyMTg0MH0.mEqNG6W_cGLF2tCSpMPfcP8gc7lhSiTxnf9nH-aZmiw";

export const supabase = createClient(supabaseUrl, supabaseKey);
