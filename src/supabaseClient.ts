// @ts-nocheck
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ugeekzmtavxcfrhtfrjq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWVrem10YXZ4Y2ZyaHRmcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDU4NDAsImV4cCI6MjEwMDEyMTg0MH0.mEqNG6W_cGLF2tCSpMPfcP8gc7lhSiTxnf9nH-aZmiw";

/**
 * معرف المتجر الحالي (Store ID)
 * 1. يبحث أولاً في الرابط: ?store=UUID
 * 2. ثم في التخزين المحلي localStorage
 * 3. أو يستخدم المعرف الافتراضي لمتجر VELTRIX
 */
export function getCurrentStoreId(): string {
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlStoreId = params.get("store");
      if (urlStoreId && urlStoreId.trim()) {
        localStorage.setItem("nova_current_store_id", urlStoreId.trim());
        return urlStoreId.trim();
      }
      const savedStoreId = localStorage.getItem("nova_current_store_id");
      if (savedStoreId && savedStoreId.trim()) {
        return savedStoreId.trim();
      }
    }
  } catch (e) {
    // fallback
  }
  return "e91260ef-6766-4ba7-bc60-365195ba3bbd";
}

export const CURRENT_STORE_ID = getCurrentStoreId();

// إنشاء اتصال Supabase مع تمرير الهيدر الأمني x-store-id تلقائياً مع كل استعلام
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      "x-store-id": CURRENT_STORE_ID,
    },
  },
});

