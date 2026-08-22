import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye,
  FileText,
  Percent,
  Layers,
  Settings,
  CreditCard,
  Zap,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Key,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  Copy,
  Search,
  Sliders,
  Shield,
  Globe,
  Activity,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ============================================================================
// 1. INTEGRATION LAYER: NORMALIZED INTERNAL MODELS (النماذج الموحدة)
// ============================================================================

export class InternalCustomer {
  constructor({ name = "", phone = "", email = "", notes = "" } = {}) {
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.notes = notes;
  }
}

export class InternalAddress {
  constructor({
    city = "",
    area = "",
    address = "",
    street = "",
    building = "",
    landmark = "",
    latitude = null,
    longitude = null,
  } = {}) {
    this.city = city;
    this.area = area;
    this.address = address;
    this.street = street;
    this.building = building;
    this.landmark = landmark;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  get formattedAddress() {
    return [this.city, this.area, this.street, this.building, this.address, this.landmark]
      .filter(Boolean)
      .join(" - ");
  }
}

export class InternalOrderItem {
  constructor({
    id = null,
    productId = null,
    title = "",
    sku = "",
    quantity = 1,
    unitPrice = 0,
    totalPrice = 0,
    variant = null,
    weightKg = 0,
  } = {}) {
    this.id = id;
    this.productId = productId;
    this.title = title;
    this.sku = sku;
    this.quantity = Number(quantity) || 1;
    this.unitPrice = Number(unitPrice) || 0;
    this.totalPrice = Number(totalPrice) || this.unitPrice * this.quantity;
    this.variant = variant;
    this.weightKg = Number(weightKg) || 0;
  }
}

export class InternalOrder {
  constructor({
    orderId = null,
    referenceNumber = "",
    customer = null,
    shippingAddress = null,
    items = [],
    subtotal = 0,
    shippingCost = 0,
    discount = 0,
    totalAmount = 0,
    currency = "LYD",
    paymentMethod = "cod",
    paymentStatus = "pending",
    orderStatus = "new",
    notes = "",
    createdAt = new Date().toISOString(),
  } = {}) {
    this.orderId = orderId;
    this.referenceNumber = referenceNumber || (orderId ? `ORD-${orderId}` : "");
    this.customer = customer instanceof InternalCustomer ? customer : new InternalCustomer(customer);
    this.shippingAddress =
      shippingAddress instanceof InternalAddress ? shippingAddress : new InternalAddress(shippingAddress);
    this.items = (items || []).map((it) => (it instanceof InternalOrderItem ? it : new InternalOrderItem(it)));
    this.subtotal = Number(subtotal) || 0;
    this.shippingCost = Number(shippingCost) || 0;
    this.discount = Number(discount) || 0;
    this.totalAmount = Number(totalAmount) || this.subtotal + this.shippingCost - this.discount;
    this.currency = currency || "LYD";
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
    this.orderStatus = orderStatus;
    this.notes = notes;
    this.createdAt = createdAt;
  }

  get totalQuantity() {
    return this.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  }

  get totalWeightKg() {
    return this.items.reduce((sum, it) => sum + (it.weightKg || 0) * (it.quantity || 1), 0);
  }
}

export class InternalShipment {
  constructor({
    shipmentId = null,
    orderId = null,
    providerCode = "",
    providerShipmentId = "",
    trackingNumber = "",
    trackingUrl = "",
    shippingCost = 0,
    shipmentStatus = "draft",
    labelUrl = "",
    rawResponse = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  } = {}) {
    this.shipmentId = shipmentId;
    this.orderId = orderId;
    this.providerCode = providerCode;
    this.providerShipmentId = providerShipmentId;
    this.trackingNumber = trackingNumber;
    this.trackingUrl = trackingUrl;
    this.shippingCost = Number(shippingCost) || 0;
    this.shipmentStatus = shipmentStatus;
    this.labelUrl = labelUrl;
    this.rawResponse = rawResponse;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class InternalPayment {
  constructor({
    paymentId = null,
    orderId = null,
    providerCode = "",
    providerTransactionId = "",
    amount = 0,
    currency = "LYD",
    paymentStatus = "pending",
    paymentUrl = "",
    rawResponse = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  } = {}) {
    this.paymentId = paymentId;
    this.orderId = orderId;
    this.providerCode = providerCode;
    this.providerTransactionId = providerTransactionId;
    this.amount = Number(amount) || 0;
    this.currency = currency || "LYD";
    this.paymentStatus = paymentStatus;
    this.paymentUrl = paymentUrl;
    this.rawResponse = rawResponse;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

// ============================================================================
// 2. SECURITY & DATA MASKING UTILS (أدوات حماية وحجب البيانات الحساسة)
// ============================================================================

export function maskSecret(secret, visibleChars = 4) {
  if (!secret || typeof secret !== "string") return "";
  if (secret.length <= visibleChars * 2) return "••••••••";
  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  return `${start}••••••••${end}`;
}

export function sanitizeLogPayload(data) {
  if (!data || typeof data !== "object") return data;
  const sensitiveKeys = ["secret", "password", "token", "key", "authorization", "api_key", "client_secret"];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
      sanitized[key] = "•••••• [PROTECTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogPayload(sanitized[key]);
    }
  }
  return sanitized;
}

// ============================================================================
// 3. INTEGRATION LOGS SERVICE (خدمة تسجيل العمليات والتكاملات)
// ============================================================================

class IntegrationLogManager {
  constructor() {
    this.storageKey = "nova_integration_logs";
  }

  getLogs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  log({
    providerCode,
    providerType = "general",
    action = "",
    endpoint = "",
    method = "GET",
    statusCode = 200,
    durationMs = 0,
    success = true,
    message = "",
    orderId = null,
    details = null,
  }) {
    const logs = this.getLogs();
    const newEntry = {
      id: "LOG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      providerCode,
      providerType,
      action,
      endpoint,
      method,
      statusCode,
      durationMs,
      success,
      message,
      orderId,
      details: sanitizeLogPayload(details),
    };

    const updated = [newEntry, ...logs].slice(0, 150);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist integration log:", e);
    }
    return newEntry;
  }

  clearLogs() {
    localStorage.removeItem(this.storageKey);
  }
}

export const IntegrationLogs = new IntegrationLogManager();

// ============================================================================
// 4. STATUS MAPPER (محرك تعيين الحالات)
// ============================================================================

export class StatusMapper {
  constructor(customMapping = {}) {
    this.mapping = customMapping || {};
  }

  toStoreStatus(providerStatus, defaultStatus = "new") {
    if (!providerStatus) return defaultStatus;
    const normalized = String(providerStatus).toLowerCase().trim();
    return this.mapping[normalized] || this.mapping[providerStatus] || defaultStatus;
  }

  toProviderStatus(storeStatus) {
    for (const [providerStatus, internalStatus] of Object.entries(this.mapping)) {
      if (internalStatus === storeStatus) return providerStatus;
    }
    return storeStatus;
  }
}

// ============================================================================
// 5. ABSTRACT BASE PROVIDERS (الفئات الأساسية للمزودات)
// ============================================================================

export class BaseProvider {
  constructor(config = {}) {
    this.code = config.code || "unknown";
    this.name = config.name || "Unknown Provider";
    this.type = config.type || "general"; // payment | delivery
    this.config = config;
    this.environment = config.environment || "sandbox"; // sandbox | production
    this.isActive = config.isActive !== false;
    this.statusMapper = new StatusMapper(config.statusMapping || {});
  }

  get isConfigured() {
    return !!this.config.apiBaseUrl || this.config.isSystem;
  }

  async testConnection() {
    throw new Error(`testConnection() not implemented in provider ${this.code}`);
  }

  logOperation(logData) {
    return IntegrationLogs.log({
      providerCode: this.code,
      providerType: this.type,
      ...logData,
    });
  }
}

export class PaymentProvider extends BaseProvider {
  constructor(config = {}) {
    super({ ...config, type: "payment" });
  }

  async createPayment(internalOrder) {
    throw new Error(`createPayment() not implemented in ${this.code}`);
  }

  async verifyPayment(transactionId) {
    throw new Error(`verifyPayment() not implemented in ${this.code}`);
  }

  async refundPayment(transactionId, amount) {
    throw new Error(`refundPayment() is not supported by ${this.code}`);
  }
}

export class DeliveryProvider extends BaseProvider {
  constructor(config = {}) {
    super({ ...config, type: "delivery" });
  }

  async calculateShipping(address, order) {
    throw new Error(`calculateShipping() not implemented in ${this.code}`);
  }

  async createShipment(internalOrder) {
    throw new Error(`createShipment() not implemented in ${this.code}`);
  }

  async getShipmentStatus(trackingNumber) {
    throw new Error(`getShipmentStatus() not implemented in ${this.code}`);
  }

  async cancelShipment(trackingNumber) {
    throw new Error(`cancelShipment() is not supported by ${this.code}`);
  }

  async getSupportedCities() {
    return this.config.supportedCities || [];
  }
}

// ============================================================================
// 6. DEFAULT BUILT-IN ADAPTERS (المحولات الافتراضية الجاهزة)
// ============================================================================

export class CodPaymentProvider extends PaymentProvider {
  constructor(config = {}) {
    super({
      code: "cod",
      name: "الدفع عند الاستلام (كاش)",
      description: "استلام قيمة الطلب نقداً عند تسليم الشحنة للزبون",
      isSystem: true,
      isActive: true,
      ...config,
    });
  }

  async testConnection() {
    const startTime = Date.now();
    this.logOperation({
      action: "test_connection",
      endpoint: "internal://cod/check",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      success: true,
      message: "طريقة الدفع عند الاستلام جاهزة ونشطة داخل المتجر 🟢",
    });
    return { success: true, message: "الدفع عند الاستلام نشط وجاهز للعمل 🟢" };
  }

  async createPayment(internalOrder) {
    return {
      success: true,
      transactionId: `COD-${internalOrder.orderId}`,
      status: "pending_cod",
      message: "تم اختيار الدفع عند الاستلام بنجاح",
    };
  }

  async verifyPayment() {
    return { success: true, status: "pending" };
  }
}

export class BankTransferPaymentProvider extends PaymentProvider {
  constructor(config = {}) {
    super({
      code: "bank_transfer",
      name: "التحويل المصرفي (إيداع بنكي)",
      description: "تحويل مباشر لحساب المتجر مع مراجعة وتأكيد الإيصال",
      isSystem: true,
      isActive: true,
      ...config,
    });
  }

  async testConnection() {
    const startTime = Date.now();
    const bankAccount = this.config.bankAccount || "محدد في إعدادات المتجر";
    this.logOperation({
      action: "test_connection",
      endpoint: "internal://bank_transfer/check",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      success: true,
      message: `التحويل المصرفي جاهز (الحساب: ${bankAccount}) 🟢`,
    });
    return { success: true, message: `التحويل المصرفي مهيأ وجاهز 🟢 (الحساب: ${bankAccount})` };
  }

  async createPayment(internalOrder) {
    return {
      success: true,
      transactionId: `BANK-${internalOrder.orderId}`,
      status: "awaiting_verification",
      message: "يرجى إرفاق إيصال التحويل المصرفي لتأكيد الطلب",
    };
  }

  async verifyPayment() {
    return { success: true, status: "pending" };
  }
}

export class GenericApiPaymentProvider extends PaymentProvider {
  async testConnection() {
    const startTime = Date.now();
    if (!this.config.apiBaseUrl) {
      const msg = "لم يتم تعيين رابط Base URL للبوابة";
      this.logOperation({
        action: "test_connection",
        endpoint: "n/a",
        statusCode: 400,
        durationMs: 0,
        success: false,
        message: msg,
      });
      return { success: false, message: msg };
    }

    try {
      const response = await fetch(this.config.apiBaseUrl, {
        method: "HEAD",
        headers: {
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
      });

      const durationMs = Date.now() - startTime;
      const success = response.ok || response.status === 401 || response.status === 405;

      this.logOperation({
        action: "test_connection",
        endpoint: this.config.apiBaseUrl,
        method: "HEAD",
        statusCode: response.status,
        durationMs,
        success,
        message: success ? "تم الوصول لخادم البوابة بنجاح" : `رد الخادم برمز: ${response.status}`,
      });

      return {
        success,
        message: success
          ? `تم اختبار الاتصال بالبوابة بنجاح 🟢 (رمز الاستجابة: ${response.status})`
          : `تعذر الاتصال بالبوابة 🔴 (رمز الاستجابة: ${response.status})`,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.logOperation({
        action: "test_connection",
        endpoint: this.config.apiBaseUrl,
        method: "HEAD",
        statusCode: 0,
        durationMs,
        success: false,
        message: err.message,
      });
      return { success: false, message: `فشل الاتصال بالبوابة: ${err.message}` };
    }
  }

  async createPayment(internalOrder) {
    return {
      success: true,
      paymentUrl: `${this.config.apiBaseUrl}/checkout?order=${internalOrder.orderId}`,
      transactionId: `TX-${Date.now()}`,
    };
  }

  async verifyPayment(transactionId) {
    return { success: true, status: "completed" };
  }
}

export class ManualDeliveryProvider extends DeliveryProvider {
  constructor(config = {}) {
    super({
      code: "manual_delivery",
      name: "التوصيل الخاص / المحلي (مندوب المتجر)",
      description: "توصيل الطلبات عبر مناديب المتجر بتسعير مرن لكل مدينة",
      isSystem: true,
      isActive: true,
      ...config,
    });
  }

  async testConnection() {
    const startTime = Date.now();
    this.logOperation({
      action: "test_connection",
      endpoint: "internal://manual_delivery/check",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      success: true,
      message: "خدمة التوصيل الخاصة بالمتجر تعمل بنجاح 🟢",
    });
    return { success: true, message: "خدمة التوصيل الخاصة بالمتجر جاهزة ونشطة 🟢" };
  }

  async calculateShipping(address) {
    const cityRates = this.config.cityRates || {
      "طرابلس": 15,
      "بنغازي": 25,
      "مصراتة": 20,
      "الزاوية": 15,
      "البيضاء": 30,
      "طبرق": 35,
      "سبها": 35,
      "سرت": 25,
      "زليتن": 20,
      "غريان": 20,
      "الخمس": 20,
    };
    const flatRate = this.config.flatRate != null ? Number(this.config.flatRate) : 20;
    const cost = address?.city && cityRates[address.city] != null ? cityRates[address.city] : flatRate;
    return { available: true, cost, estimatedDays: 2 };
  }

  async createShipment(internalOrder) {
    const rate = await this.calculateShipping(internalOrder.shippingAddress, internalOrder);
    const trackingNumber = `NOV-TRK-${internalOrder.orderId}`;
    return {
      success: true,
      shipment: new InternalShipment({
        orderId: internalOrder.orderId,
        providerCode: this.code,
        providerShipmentId: `SHIP-${internalOrder.orderId}`,
        trackingNumber,
        shippingCost: rate.cost,
        shipmentStatus: "created",
      }),
      message: `تم إنشاء الشحنة برقم تتبع: ${trackingNumber}`,
    };
  }

  async getShipmentStatus(trackingNumber) {
    return {
      status: "in_transit",
      internalStatus: "shipped",
      trackingUrl: "",
      events: [{ title: "تم تسليم الطلب للمندوب", time: new Date().toISOString() }],
    };
  }
}

export class GenericApiDeliveryProvider extends DeliveryProvider {
  async testConnection() {
    const startTime = Date.now();
    if (!this.config.apiBaseUrl) {
      const msg = "لم يتم تعيين رابط Base URL لشركة التوصيل";
      this.logOperation({
        action: "test_connection",
        endpoint: "n/a",
        statusCode: 400,
        durationMs: 0,
        success: false,
        message: msg,
      });
      return { success: false, message: msg };
    }

    try {
      const response = await fetch(this.config.apiBaseUrl, {
        method: "HEAD",
        headers: {
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
      });

      const durationMs = Date.now() - startTime;
      const success = response.ok || response.status === 401 || response.status === 405;

      this.logOperation({
        action: "test_connection",
        endpoint: this.config.apiBaseUrl,
        method: "HEAD",
        statusCode: response.status,
        durationMs,
        success,
        message: success ? "تم الاتصال بخادم شركة التوصيل" : `رد الخادم: ${response.status}`,
      });

      return {
        success,
        message: success
          ? `تم اختبار الاتصال بشركة التوصيل بنجاح 🟢 (رمز الاستجابة: ${response.status})`
          : `تعذر الاتصال بشركة التوصيل 🔴 (رمز الاستجابة: ${response.status})`,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.logOperation({
        action: "test_connection",
        endpoint: this.config.apiBaseUrl,
        method: "HEAD",
        statusCode: 0,
        durationMs,
        success: false,
        message: err.message,
      });
      return { success: false, message: `فشل الاتصال بشركة التوصيل: ${err.message}` };
    }
  }

  async calculateShipping(address) {
    const flatRate = this.config.flatRate != null ? Number(this.config.flatRate) : 25;
    return { available: true, cost: flatRate, estimatedDays: 3 };
  }

  async createShipment(internalOrder) {
    const trackingNumber = `EXT-TRK-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      shipment: new InternalShipment({
        orderId: internalOrder.orderId,
        providerCode: this.code,
        providerShipmentId: `EXT-SHIP-${Date.now()}`,
        trackingNumber,
        shippingCost: this.config.flatRate || 25,
        shipmentStatus: "created",
      }),
      message: `تم تسجيل الشحنة برقم تتبع: ${trackingNumber}`,
    };
  }

  async getShipmentStatus(trackingNumber) {
    return {
      status: "in_transit",
      internalStatus: "shipped",
      trackingUrl: `${this.config.apiBaseUrl}/track/${trackingNumber}`,
    };
  }
}

/**
 * 6. Ezone Pay Payment Gateway Adapter (بوابة إيزون باي للدفع الإلكتروني)
 * Fully compliant with Ezone Pay API Specification
 */
export class EzonePayPaymentProvider extends PaymentProvider {
  constructor(config = {}) {
    super({
      code: "ezone_pay",
      name: "Ezone Pay (إيزون باي للدفع الإلكتروني)",
      description: "بوابة دفع ليبية متكاملة تدعم سداد، تداول، إدفع لي، موبي كاش، ومصرفي باي",
      apiBaseUrl: config.apiBaseUrl || "https://test.ezonepay.ly",
      environment: config.environment || "sandbox",
      isSystem: false,
      isActive: config.isActive !== false,
      ...config,
    });
  }

  async testConnection() {
    const startTime = Date.now();
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      const msg = "لم يتم إدخال مفتاح الـ API الخاص بـ Ezone Pay (X-API-Key)";
      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/payment-link/list`,
        statusCode: 401,
        durationMs: 0,
        success: false,
        message: msg,
      });
      return { success: false, message: msg };
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/payment-link/list?PageNumber=1&PageSize=1`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json",
        },
      });

      const durationMs = Date.now() - startTime;
      const success = response.ok;
      let errorDetail = "";
      if (!success) {
        try {
          const errJson = await response.json();
          errorDetail = errJson.message || `رمز الخطأ: ${response.status}`;
        } catch {
          errorDetail = `رمز الاستجابة: ${response.status}`;
        }
      }

      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/payment-link/list`,
        method: "GET",
        statusCode: response.status,
        durationMs,
        success,
        message: success ? "تم الاتصال ببوابة Ezone Pay بنجاح وتوثيق الـ API Key" : `فشل الاتصال: ${errorDetail}`,
      });

      return {
        success,
        message: success
          ? "تم التحقق من مفتاح API والاتصال بـ Ezone Pay بنجاح 🟢"
          : `فشل التحقق من بوابة Ezone Pay 🔴 (${errorDetail})`,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/payment-link/list`,
        method: "GET",
        statusCode: 0,
        durationMs,
        success: false,
        message: err.message,
      });
      return { success: false, message: `تعذر الوصول لخادم Ezone Pay: ${err.message}` };
    }
  }

  async createPayment(internalOrder) {
    const startTime = Date.now();
    const apiKey = this.config.apiKey;
    const nameParts = (internalOrder.customer?.name || "زبون متجر").trim().split(" ");
    const firstName = nameParts[0] || "زبون";
    const lastName = nameParts.slice(1).join(" ") || "المتجر";

    const payload = {
      Title: `طلب رقم #${internalOrder.orderId}`,
      OrderReference: internalOrder.referenceNumber || `ORD-${internalOrder.orderId}`,
      IsUniqueOrderReference: false,
      InternalReference: `NOV-${internalOrder.orderId}`,
      Amount: Number(internalOrder.totalAmount),
      Currency: 1, // 1 = LYD
      Note: internalOrder.notes || "طلب عبر المتجر الإلكتروني",
      Customer: {
        FirstName: firstName,
        LastName: lastName,
        PhoneNumber: internalOrder.customer?.phone || "0910000000",
      },
      RedirectUrl: `${window.location.origin}/?payment_success=true&order_id=${internalOrder.orderId}`,
    };

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/payment-link/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      if (res.ok && data.Link) {
        this.logOperation({
          action: "create_payment_link",
          endpoint: `${this.config.apiBaseUrl}/payment-link/new`,
          method: "POST",
          statusCode: res.status,
          durationMs,
          success: true,
          message: `تم إنشاء رابط دفع Ezone Pay للطلب #${internalOrder.orderId}`,
          orderId: internalOrder.orderId,
          details: { paymentLinkId: data.Id, link: data.Link },
        });

        return {
          success: true,
          paymentUrl: data.Link,
          transactionId: String(data.Id || `EZ-${Date.now()}`),
          message: "تم إنشاء رابط الدفع بنجاح",
        };
      } else {
        throw new Error(data.message || `رمز الاستجابة: ${res.status}`);
      }
    } catch (err) {
      this.logOperation({
        action: "create_payment_link",
        endpoint: `${this.config.apiBaseUrl}/payment-link/new`,
        method: "POST",
        statusCode: 0,
        durationMs: Date.now() - startTime,
        success: false,
        message: err.message,
        orderId: internalOrder.orderId,
      });
      return { success: false, message: err.message };
    }
  }

  async verifyPayment(paymentLinkId) {
    const apiKey = this.config.apiKey;
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/payment-link/${paymentLinkId}`, {
        headers: { "X-API-Key": apiKey, "Accept": "application/json" },
      });
      const data = await res.json();
      const isPaid = (data.TotalAmountPaid || 0) >= (data.Amount || 1);
      return {
        success: res.ok,
        status: isPaid ? "completed" : "pending",
        raw: data,
      };
    } catch (err) {
      return { success: false, status: "error", message: err.message };
    }
  }
}

/**
 * 7. Darb Assabil Delivery Adapter (شركة درب السبيل للخدمات اللوجستية والشحن)
 * Fully compliant with Darb Assabil V2 API Specification
 */
export class DarbAssabilDeliveryProvider extends DeliveryProvider {
  constructor(config = {}) {
    super({
      code: "darb_assabil",
      name: "Darb Assabil (شركة درب السبيل للشحن واللوجستيات)",
      description: "خدمات التوصيل والشحن المحلي داخل كافة المدن الليبية مع التتبع وتأكيد الاستلام",
      apiBaseUrl: config.apiBaseUrl || "https://v2.sabil.ly",
      environment: config.environment || "production",
      isSystem: false,
      isActive: config.isActive !== false,
      ...config,
    });
  }

  parseJwt(token) {
    try {
      if (!token || typeof token !== "string") return null;
      const parts = token.trim().split(".");
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }
      const rawDecoded = atob(base64);
      try {
        const jsonPayload = decodeURIComponent(
          rawDecoded
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        return JSON.parse(jsonPayload);
      } catch {
        return JSON.parse(rawDecoded);
      }
    } catch (e) {
      return null;
    }
  }

  getHeaders() {
    const rawKey = (this.config.apiKey || "").trim();
    const jwtPayload = this.parseJwt(rawKey);
    const accountId = this.config.accessToken || this.config.apiSecret || jwtPayload?.secretId || "";

    const authVal = rawKey.startsWith("Bearer ")
      ? rawKey
      : rawKey.startsWith("apikey ")
      ? rawKey
      : `apikey ${rawKey}`;

    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authVal,
      "X-API-VERSION": "1.0.0",
      ...(accountId ? { "X-ACCOUNT-ID": accountId } : {}),
    };
  }

  async testConnection() {
    const startTime = Date.now();
    const rawKey = (this.config.apiKey || "").trim();
    if (!rawKey) {
      const msg = "لم يتم إدخال مفتاح API أو رمز التحقق لشركة درب السبيل (API Key)";
      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/api/wallet/metadata`,
        statusCode: 401,
        durationMs: 0,
        success: false,
        message: msg,
      });
      return { success: false, message: msg };
    }

    if (!this.config.apiBaseUrl || !/^https?:\/\//i.test(this.config.apiBaseUrl)) {
      const msg = `رابط الـ API (Base URL) غير صحيح: "${this.config.apiBaseUrl}". يجب أن يبدأ بـ https:// (مثال: https://v2.sabil.ly)`;
      this.logOperation({
        action: "test_connection",
        endpoint: this.config.apiBaseUrl || "n/a",
        statusCode: 400,
        durationMs: 0,
        success: false,
        message: msg,
      });
      return { success: false, message: msg };
    }

    // لا اختصار — نتصل فعلياً بالسيرفر دائماً، بغض النظر عن شكل المفتاح
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/wallet/metadata`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const durationMs = Date.now() - startTime;
      const success = response.ok;

      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/api/wallet/metadata`,
        method: "GET",
        statusCode: response.status,
        durationMs,
        success,
        message: success ? "تم التحقق من مفتاح درب السبيل والاتصال بنجاح" : `رد الخادم: ${response.status}`,
      });

      return {
        success,
        message: success
          ? "تم التحقق والاتصال بخوادم شركة درب السبيل بنجاح 🟢"
          : `رد الخادم: ${response.status} (تحقق من صلاحية الحساب والمفتاح)`,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.logOperation({
        action: "test_connection",
        endpoint: `${this.config.apiBaseUrl}/api/wallet/metadata`,
        method: "GET",
        statusCode: 0,
        durationMs,
        success: false,
        message: err.message,
      });
      return { success: false, message: `تعذر الاتصال بدرب السبيل: ${err.message}` };
    }
  }

  async calculateShipping(address, order) {
    const city = address?.city || "طرابلس";

    if (!this.config.apiKey) {
      const flatRate = this.config.flatRate || 20;
      return { available: true, cost: flatRate, estimatedDays: 2 };
    }

    try {
      const payload = {
        from: {
          countryCode: "LBY",
          city: "طرابلس",
          area: "المركز",
        },
        to: {
          countryCode: "LBY",
          city: city,
          area: address?.area || "المدينة",
          address: address?.address || "",
        },
        products: (order?.items || []).map((it) => ({
          title: it.title,
          quantity: it.quantity || 1,
          amount: it.unitPrice || it.price || 10,
          isChargeable: true,
        })),
        paymentBy: "receiver",
      };

      const res = await fetch(`${this.config.apiBaseUrl}/api/local/shipments/calculate/shipping`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const cost = data.data?.remainings?.remainings?.amount || this.config.flatRate || 20;
        return { available: true, cost: Number(cost), estimatedDays: 2 };
      }
    } catch (e) {
      console.warn("Darb Assabil rate fallback:", e);
    }

    return { available: true, cost: this.config.flatRate || 20, estimatedDays: 2 };
  }

  async createShipment(internalOrder) {
    const startTime = Date.now();
    const address = internalOrder.shippingAddress;
    const customer = internalOrder.customer;
    const headers = this.getHeaders();

    // 1. تنسيق رقم الهاتف الليبي بالصيغة الدولية (+218)
    let rawPhone = (customer?.phone || "").replace(/[^0-9+]/g, "");
    if (rawPhone.startsWith("0")) {
      rawPhone = "+218" + rawPhone.slice(1);
    } else if (!rawPhone.startsWith("+") && rawPhone.length > 0) {
      rawPhone = "+218" + rawPhone;
    }
    if (!rawPhone) rawPhone = "+218910301107";

    let contactId = null;
    let serviceId = null;

    // 2. تسجيل / جلب معرف الزبون (Contact ID)
    try {
      const contactRes = await fetch(`${this.config.apiBaseUrl}/api/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: customer?.name || "زبون المتجر", phone: rawPhone }),
      });
      const contactData = await contactRes.json().catch(() => ({}));
      if (contactRes.ok && contactData?.data?._id) {
        contactId = contactData.data._id;
      } else if (!contactRes.ok) {
        console.warn("Darb Assabil Contact creation failed:", contactRes.status, contactData);
      }
    } catch (cErr) {
      console.warn("Darb Assabil Contact error:", cErr);
    }

    // 3. جلب كود الخدمة المتاحة (Service ID)
    try {
      const serviceRes = await fetch(`${this.config.apiBaseUrl}/api/local/service/rates/public`, {
        method: "GET",
        headers,
      });
      const serviceData = await serviceRes.json().catch(() => ({}));
      if (serviceRes.ok) {
        if (serviceData?.data?.results?.[0]?._id) {
          serviceId = serviceData.data.results[0]._id;
        } else if (Array.isArray(serviceData?.data) && serviceData.data[0]?._id) {
          serviceId = serviceData.data[0]._id;
        }
      }
    } catch (sErr) {
      console.warn("Darb Assabil Service rates error:", sErr);
    }

    // 4. تجهيز حمولة الشحنة
    const payload = {
      from: { countryCode: "LBY", city: "طرابلس", area: "المركز", address: "مقر المتجر" },
      to: {
        countryCode: "LBY",
        city: address?.city || "طرابلس",
        area: address?.area || "المدينة",
        address: address?.formattedAddress || address?.address || "طرابلس",
      },
      products: (internalOrder.items || []).map((it) => ({
        title: it.title || "منتج",
        quantity: it.quantity || 1,
        amount: Number(it.unitPrice) || 10,
        currency: "lyd",
        isChargeable: true,
      })),
      paymentBy: "receiver",
      notes: `طلب #${internalOrder.orderId} - العميل: ${customer?.name || "زبون"} (${customer?.phone || ""}) - الدفع: ${internalOrder.paymentMethod || "كاش"}`,
    };
    if (contactId) payload.contacts = [contactId];
    if (serviceId) payload.service = serviceId;

    // 5. تنفيذ الطلب — بدون أي fallback وهمي
    let res;
    let data;
    try {
      res = await fetch(`${this.config.apiBaseUrl}/api/local/shipments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => ({}));
    } catch (networkErr) {
      const durationMs = Date.now() - startTime;
      this.logOperation({
        action: "create_shipment",
        endpoint: `${this.config.apiBaseUrl}/api/local/shipments`,
        method: "POST",
        statusCode: 0,
        durationMs,
        success: false,
        message: `فشل الاتصال بدرب السبيل: ${networkErr.message}`,
        orderId: internalOrder.orderId,
      });
      return {
        success: false,
        message: `تعذر الاتصال بشركة درب السبيل: ${networkErr.message}`,
      };
    }

    const durationMs = Date.now() - startTime;

    // فشل حقيقي من السيرفر (401 مفتاح خاطئ، 400 بيانات ناقصة، ...)
    if (!res.ok || !(data?.status || data?.data)) {
      const errorDetail =
  data?.message ||
  data?.error?.message ||
  (typeof data?.error === "string" ? data.error : null) ||
  (Array.isArray(data?.errors)
    ? data.errors
        .map((e) => typeof e === "string" ? e : e.message || JSON.stringify(e))
        .join(", ")
    : null) ||
  JSON.stringify(data) ||
  `رمز الاستجابة: ${res.status}`;
      this.logOperation({
        action: "create_shipment",
        endpoint: `${this.config.apiBaseUrl}/api/local/shipments`,
        method: "POST",
        statusCode: res.status,
        durationMs,
        success: false,
        message: `فشل إنشاء الشحنة في درب السبيل: ${errorDetail}`,
        orderId: internalOrder.orderId,
        details: data,
      });
      return {
        success: false,
        message: `فشل إنشاء الشحنة لدى درب السبيل 🔴 (${errorDetail}). تحقق من مفتاح الـ API والحساب.`,
      };
    }

    // نجاح حقيقي وموثّق من رد السيرفر فعلياً
    const ref = data.data?.reference || data.data?.trackingNumber;
    if (!ref) {
      this.logOperation({
        action: "create_shipment",
        endpoint: `${this.config.apiBaseUrl}/api/local/shipments`,
        method: "POST",
        statusCode: res.status,
        durationMs,
        success: false,
        message: "رد السيرفر لا يحتوي على رقم تتبع صالح",
        orderId: internalOrder.orderId,
        details: data,
      });
      return {
        success: false,
        message: "تم إرسال الطلب لكن لم يرجع رقم تتبع من درب السبيل — راجع الدعم الفني.",
      };
    }

    this.logOperation({
      action: "create_shipment",
      endpoint: `${this.config.apiBaseUrl}/api/local/shipments`,
      method: "POST",
      statusCode: res.status,
      durationMs,
      success: true,
      message: `تم تسجيل الشحنة في درب السبيل بنجاح (رقم التتبع: ${ref})`,
      orderId: internalOrder.orderId,
    });

    return {
      success: true,
      shipment: new InternalShipment({
        orderId: internalOrder.orderId,
        providerCode: this.code,
        providerShipmentId: data.data?._id || "",
        trackingNumber: ref,
        trackingUrl: `https://track.sabil.ly/${ref}`,
        shippingCost: this.config.flatRate || 20,
        shipmentStatus: "created",
        rawResponse: data.data,
      }),
      message: `تم إنشاء الشحنة برقم تتبع: ${ref}`,
    };
  }

  async getShipmentStatus(trackingNumber) {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/api/local/shipments/timeline/${trackingNumber}`, {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return {
        status: "in_transit",
        internalStatus: "shipped",
        trackingUrl: `https://track.sabil.ly/${trackingNumber}`,
        events: data.data?.timeline || [],
      };
    } catch (err) {
      return { status: "unknown", internalStatus: "new", message: err.message };
    }
  }
}

// ============================================================================
// 8. PROVIDER REGISTRY & FACTORY (سجل المزودات ومصنع المحولات)
// ============================================================================

class ProviderRegistryManager {
  constructor() {
    this.paymentProviders = new Map();
    this.deliveryProviders = new Map();
    this.storageKey = "nova_integration_providers_config";
    this.initializeDefaultProviders();
  }

  initializeDefaultProviders() {
    const configs = this.loadStoredConfigs();
    this.paymentProviders.clear();
    this.deliveryProviders.clear();

    // Default Payment Providers
    this.registerPaymentProvider(new CodPaymentProvider(configs["cod"] || {}));
    this.registerPaymentProvider(new BankTransferPaymentProvider(configs["bank_transfer"] || {}));
    this.registerPaymentProvider(new EzonePayPaymentProvider(configs["ezone_pay"] || {}));

    // Default Delivery Providers
    this.registerDeliveryProvider(new ManualDeliveryProvider(configs["manual_delivery"] || {}));
    this.registerDeliveryProvider(new DarbAssabilDeliveryProvider(configs["darb_assabil"] || {}));

    // Load custom registered providers from saved config
    for (const [code, cfg] of Object.entries(configs)) {
      if (["cod", "bank_transfer", "ezone_pay", "manual_delivery", "darb_assabil"].includes(code)) continue;
      if (cfg.type === "payment") {
        this.registerPaymentProvider(new GenericApiPaymentProvider(cfg));
      } else if (cfg.type === "delivery") {
        this.registerDeliveryProvider(new GenericApiDeliveryProvider(cfg));
      }
    }
  }

  loadStoredConfigs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveConfigs(configs) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    } catch (e) {
      console.error("Failed to save provider configs:", e);
    }
  }

  registerPaymentProvider(providerInstance) {
    this.paymentProviders.set(providerInstance.code, providerInstance);
  }

  registerDeliveryProvider(providerInstance) {
    this.deliveryProviders.set(providerInstance.code, providerInstance);
  }

  getPaymentProvider(code) {
    return this.paymentProviders.get(code);
  }

  getDeliveryProvider(code) {
    return this.deliveryProviders.get(code);
  }

  getAllPaymentProviders() {
    return Array.from(this.paymentProviders.values());
  }

  getAllDeliveryProviders() {
    return Array.from(this.deliveryProviders.values());
  }

  saveProviderConfig(code, newConfig) {
    const configs = this.loadStoredConfigs();
    configs[code] = {
      ...configs[code],
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfigs(configs);
    this.initializeDefaultProviders();
    return configs[code];
  }

  deleteCustomProvider(code) {
    const configs = this.loadStoredConfigs();
    if (configs[code] && !configs[code].isSystem) {
      delete configs[code];
      this.saveConfigs(configs);
      this.paymentProviders.delete(code);
      this.deliveryProviders.delete(code);
      this.initializeDefaultProviders();
      return true;
    }
    return false;
  }
}

export const ProviderRegistry = new ProviderRegistryManager();

export function buildStatusWhatsAppLink(order, customStatus = null, storeName = "متجرنا") {
  let phone = (order?.customer_phone || "").replace(/[^\d]/g, "");
  if (!phone) return { url: null, text: "", phone: "" };
  if (phone.startsWith("0")) phone = "218" + phone.slice(1);
  else if (!phone.startsWith("218")) phone = "218" + phone;

  const name = order.customer_name || "زبوننا العزيز";
  const status = customStatus || order.status || "جديد";
  const trackingNumber = order.tracking_number || `DS-${order.id}`;
  const total = order.total_price || 0;

  const messages = {
    "جديد": `مرحباً ${name} 👋\nتم استلام وتأكيد طلبك رقم #${order.id} بنجاح لدى ${storeName} 🌟\n💰 القيمة الإجمالية: ${total} د.ل\n⏳ الطلب قيد المراجعة وسنقوم بتجهيزه فوراً. شكراً لتسوقك معنا!`,
    "قيد التجهيز": `مرحباً ${name} 👋\nيسعدنا إبلاغك أن طلبك رقم #${order.id} قيد التجهيز والتغليف حالياً 📦.\nسيتم تسليمه لشركة التوصيل قريباً جداً 🚚`,
    "تم الشحن": `مرحباً ${name} 👋\n🚚 تم تسليم شحنتك للمندوب وهي في طريقها إليك الآن!\n📦 رقم الطلب: #${order.id}\n📍 رقم التتبع: ${trackingNumber}\n💰 المبلغ المطلوب عند الاستلام: ${total} د.ل\nيرجى إبقاء هاتفك متاحاً لتسهيل التسليم ❤️`,
    "تم التسليم": `مرحباً ${name} 👋\nتم تأكيد تسليم طلبك رقم #${order.id} بنجاح ✅.\nنتمنى أن تنال المنتجات إعجابك، ونسعد دائماً بخدمتك في ${storeName} 🌟`,
    "ملغي": `مرحباً ${name} 👋\nنود إبلاغك بأنه تم إلغاء الطلب رقم #${order.id}.\nإذا كان لديك أي استفسار أو ترغب في إعادة الطلب، يسعدنا تواصلك معنا في أي وقت.`,
  };

  const text = messages[status] || `مرحباً ${name}، هناك تحديث بخصوص طلبك رقم #${order.id} لدى ${storeName}.`;
  return {
    url: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
    text,
    phone,
  };
}

function printAdminInvoice(order, storeName) {
  const itemsRows = (order.items || [])
    .map(
      (it) => `
        <tr>
          <td>${it.title}${it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join(" / ")})` : ""}</td>
          <td style="text-align:center">${it.qty}</td>
          <td style="text-align:center">${it.price} د.ل</td>
          <td style="text-align:center">${it.price * it.qty} د.ل</td>
        </tr>`
    )
    .join("");

  const invoiceWindow = window.open("", "_blank");
  invoiceWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>فاتورة طلب #${order.id}</title>
      <style>
        body { font-family: Tajawal, Arial, sans-serif; padding: 32px; color: #0B2027; }
        .header { border-bottom: 2px solid #0E7C86; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { color: #0E7C86; margin: 0; }
        .meta { font-size: 13px; color: #5B7278; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px; border-bottom: 1px solid #E3ECED; text-align: right; }
        th { background: #E7F3F3; color: #0A5A61; }
        .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #0E7C86; }
        .customer-box { margin-top: 20px; padding: 14px; background: #F3F7F8; border-radius: 8px; font-size: 13px; }
        .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #5B7278; }
        @media print { button { display: none; } }
        .print-btn { margin-top: 24px; padding: 10px 20px; background: #0E7C86; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${storeName || "المتجر"}</h1>
        <div class="meta">
          فاتورة رقم INV-${order.id}<br/>
          ${new Date(order.created_at).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" })}
          —
          ${new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <div class="customer-box">
        <div>الاسم: ${order.customer_name || "-"}</div>
        <div>الهاتف: ${order.customer_phone || "-"}</div>
        <div>العنوان: ${order.customer_address || "-"}</div>
        <div>طريقة الدفع: ${order.payment_method || "-"}</div>
        <div>حالة الطلب: ${order.status || "-"}</div>
      </div>
      <table>
        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
        <tbody>
          ${itemsRows}
          <tr class="total-row"><td colspan="3">الإجمالي الكلي</td><td>${order.total_price} د.ل</td></tr>
        </tbody>
      </table>
      <div class="footer">شكراً لتسوقك من ${storeName || "متجرنا"}</div>
      <center><button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button></center>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const authed = !!session;

  // ---- نظام الأدوار (Roles) ----
  const [userRole, setUserRole] = useState(null); // owner / admin / moderator
  const [roleLoading, setRoleLoading] = useState(true);
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin" || userRole === "owner";
  const isModerator = userRole === "moderator";

  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("moderator");
  const [teamSaving, setTeamSaving] = useState(false);

  const [newLoginEmail, setNewLoginEmail] = useState("");
  const [newLoginPassword, setNewLoginPassword] = useState("");
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsMessage, setCredsMessage] = useState("");

  // ---- تبويبات لوحة التحكم ----
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("30days"); // today | 7days | 30days | all

  useEffect(() => {
    if (isModerator) setActiveTab("products");
  }, [userRole]);

  const TABS = isModerator
    ? [{ id: "products", label: "المنتجات" }]
    : [
        { id: "dashboard", label: "لوحة الإحصائيات" },
        { id: "settings", label: "إعدادات المتجر" },
        { id: "integrations", label: "الدفع والتوصيل" },
        { id: "orders", label: "الطلبات" },
        { id: "invoices", label: "الفواتير" },
        { id: "customers", label: "العملاء" },
        { id: "products", label: "المنتجات" },
        ...(isOwner
          ? [
              { id: "team", label: "إدارة الفريق" },
              { id: "credentials", label: "إعدادات الدخول" },
            ]
          : []),
      ];

  // ---- تبويب الدفع والتوصيل (Integration Layer State) ----
  const [integrationSubTab, setIntegrationSubTab] = useState("payments"); // "payments" | "delivery" | "logs"
  const [registryVersion, setRegistryVersion] = useState(0);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState({
    code: "",
    name: "",
    type: "payment",
    environment: "sandbox",
    apiBaseUrl: "",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    webhookUrl: "",
    webhookSecret: "",
    flatRate: 20,
    statusMapping: {},
    isActive: true,
  });
  const [testingCode, setTestingCode] = useState(null);
  const [testFeedback, setTestFeedback] = useState({});
  const [showSecretMap, setShowSecretMap] = useState({});
  const [logFilterQuery, setLogFilterQuery] = useState("");
  const [logFilterType, setLogFilterType] = useState("all");
  const [waNotifyModal, setWaNotifyModal] = useState(null);

  const paymentProvidersList = useMemo(() => {
    return ProviderRegistry.getAllPaymentProviders();
  }, [registryVersion]);

  const deliveryProvidersList = useMemo(() => {
    return ProviderRegistry.getAllDeliveryProviders();
  }, [registryVersion]);

  const integrationLogsList = useMemo(() => {
    const all = IntegrationLogs.getLogs();
    return all.filter((l) => {
      const matchType = logFilterType === "all" || l.providerType === logFilterType;
      const matchQuery =
        !logFilterQuery.trim() ||
        l.providerCode.toLowerCase().includes(logFilterQuery.toLowerCase()) ||
        (l.message || "").toLowerCase().includes(logFilterQuery.toLowerCase()) ||
        (l.endpoint || "").toLowerCase().includes(logFilterQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [registryVersion, logFilterQuery, logFilterType]);

  async function handleTestProvider(provider) {
    setTestingCode(provider.code);
    try {
      const result = await provider.testConnection();
      setTestFeedback((prev) => ({
        ...prev,
        [provider.code]: {
          success: result.success,
          message: result.message,
          time: new Date().toLocaleTimeString("ar-LY"),
        },
      }));
    } catch (err) {
      setTestFeedback((prev) => ({
        ...prev,
        [provider.code]: {
          success: false,
          message: err.message,
          time: new Date().toLocaleTimeString("ar-LY"),
        },
      }));
    } finally {
      setTestingCode(null);
      setRegistryVersion((v) => v + 1);
    }
  }

  function handleToggleProvider(code, currentStatus) {
    ProviderRegistry.saveProviderConfig(code, { isActive: !currentStatus });
    setRegistryVersion((v) => v + 1);
  }

  function handleOpenAddProvider(defaultType = "payment") {
    const randomCode = `${defaultType}_${Date.now().toString().slice(-4)}`;
    setEditingProvider({
      code: randomCode,
      name: "",
      type: defaultType,
      environment: "sandbox",
      apiBaseUrl: "",
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      webhookUrl: `${window.location.origin}/api/webhooks/${randomCode}`,
      webhookSecret: "",
      flatRate: 25,
      statusMapping: { pending: "جديد", in_transit: "تم الشحن", delivered: "تم التسليم" },
      isActive: true,
      isSystem: false,
    });
    setIsConfigModalOpen(true);
  }

  function handleOpenEditProvider(provider) {
    const cfg = provider.config || {};
    setEditingProvider({
      code: provider.code,
      name: provider.name || "",
      type: provider.type || "payment",
      environment: provider.environment || "sandbox",
      apiBaseUrl: cfg.apiBaseUrl || "",
      apiKey: cfg.apiKey || "",
      apiSecret: cfg.apiSecret || "",
      accessToken: cfg.accessToken || "",
      webhookUrl: cfg.webhookUrl || `${window.location.origin}/api/webhooks/${provider.code}`,
      webhookSecret: cfg.webhookSecret || "",
      flatRate: cfg.flatRate != null ? cfg.flatRate : 25,
      statusMapping: cfg.statusMapping || { pending: "جديد", in_transit: "تم الشحن", delivered: "تم التسليم" },
      isActive: provider.isActive,
      isSystem: !!cfg.isSystem,
    });
    setIsConfigModalOpen(true);
  }

  function handleSaveProviderSubmit(e) {
    e.preventDefault();
    if (!editingProvider.name.trim()) {
      alert("يرجى كتابة اسم المزود / الشركة");
      return;
    }

    ProviderRegistry.saveProviderConfig(editingProvider.code, editingProvider);
    IntegrationLogs.log({
      providerCode: editingProvider.code,
      providerType: editingProvider.type,
      action: "save_configuration",
      endpoint: editingProvider.apiBaseUrl || "config://store",
      statusCode: 200,
      durationMs: 15,
      success: true,
      message: `تم حفظ وتحديث إعدادات المزود (${editingProvider.name}) بنجاح`,
    });

    setIsConfigModalOpen(false);
    setRegistryVersion((v) => v + 1);
    alert(`تم حفظ إعدادات (${editingProvider.name}) بنجاح ✅`);
  }

  function handleDeleteCustomProvider(code, name) {
    if (!confirm(`هل أنت متأكد من حذف المزود (${name})؟`)) return;
    ProviderRegistry.deleteCustomProvider(code);
    IntegrationLogs.log({
      providerCode: code,
      action: "delete_provider",
      endpoint: "config://store",
      statusCode: 200,
      durationMs: 5,
      success: true,
      message: `تم حذف المزود (${name})`,
    });
    setRegistryVersion((v) => v + 1);
  }

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file");

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    cost_price: "",
    compare_at: "",
    category: "",
    code: "",
    stock: "",
    image: "",
    extraImagesText: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [variants, setVariants] = useState([]);

  function addVariantRow() {
    setVariants([...variants, { size: "", color: "", price: "", quantity: "" }]);
  }

  function updateVariantRow(index, field, value) {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  }

  function removeVariantRow(index) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  const emptySettingsForm = {
    store_name: "",
    store_url: "",
    store_description: "",
    whatsapp_number: "",
    bank_account: "",
    facebook_url: "",
    instagram_url: "",
    logo_url: "",
  };
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [bankReceiptInputs, setBankReceiptInputs] = useState({});
  const ORDER_STATUSES = ["جديد", "قيد التحقق من الحوالة", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
  const STATUS_LABELS = {
    "جديد": "جديد",
    "قيد التحقق من الحوالة": "قيد التحقق من الحوالة",
    "قيد التجهيز": "قيد التجهيز",
    "تم الشحن": "قيد الشحن",
    "تم التسليم": "تم التسليم",
    "ملغي": "ملغي",
  };

  const CUSTOMER_TIERS = ["دائم", "أحياناً", "نادر"];
  function getCustomerTier(ordersCount) {
    if (ordersCount >= 10) return "دائم";
    if (ordersCount >= 5) return "أحياناً";
    return "نادر";
  }

  function isBankTransferOverdue(order) {
    if (!order.bank_receipt_date || order.bank_verified_at) return false;
    const receiptDate = new Date(order.bank_receipt_date);
    const now = new Date();
    const hoursPassed = (now - receiptDate) / (1000 * 60 * 60);
    return hoursPassed > 24;
  }

  const [visits, setVisits] = useState([]);

  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const phone = o.customer_phone;
      if (!phone) return;
      if (!map[phone]) {
        map[phone] = {
          phone,
          name: o.customer_name || "بدون اسم",
          address: o.customer_address || "",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at,
        };
      }
      map[phone].ordersCount += 1;
      map[phone].totalSpent += o.total_price || 0;
      if (new Date(o.created_at) > new Date(map[phone].lastOrderDate)) {
        map[phone].lastOrderDate = o.created_at;
        map[phone].address = o.customer_address || map[phone].address;
        map[phone].name = o.customer_name || map[phone].name;
      }
    });
    return Object.values(map)
      .map((c) => ({ ...c, tier: getCustomerTier(c.ordersCount) }))
      .sort((a, b) => b.ordersCount - a.ordersCount);
  }, [orders]);

  // ---- حساب الإحصائيات الشاملة والدقيقة بدقة واحترافية متطابقة 100% ----
  const dashboardStats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let activeOrders = orders;
    if (timeFilter === "today") {
      const todayStr = new Date().toISOString().slice(0, 10);
      activeOrders = orders.filter((o) => o.created_at && o.created_at.slice(0, 10) === todayStr);
    } else if (timeFilter === "7days") {
      activeOrders = orders.filter((o) => o.created_at && (now - new Date(o.created_at).getTime()) <= 7 * dayMs);
    } else if (timeFilter === "30days") {
      activeOrders = orders.filter((o) => o.created_at && (now - new Date(o.created_at).getTime()) <= 30 * dayMs);
    }

    const validOrders = activeOrders.filter((o) => o.status !== "ملغي");
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const totalOrders = activeOrders.length;
    const completedOrders = activeOrders.filter((o) => o.status === "تم التسليم").length;
    const shippedOrders = activeOrders.filter((o) => o.status === "تم الشحن" || o.status === "قيد التجهيز").length;
    const pendingOrders = activeOrders.filter((o) => o.status === "جديد" || o.status === "قيد التحقق من الحوالة").length;
    const cancelledOrders = activeOrders.filter((o) => o.status === "ملغي").length;

    const totalUnitsSold = validOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }, 0);

    const periodCustomers = new Set(activeOrders.map((o) => o.customer_phone).filter(Boolean)).size;
    const aov = validOrders.length > 0 ? Math.round(totalSales / validOrders.length) : 0;

    const productsByTitle = {};
    products.forEach((p) => {
      productsByTitle[p.title] = p;
    });

    let totalProfit = 0;
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const product = productsByTitle[it.title];
        if (product && product.cost_price != null) {
          const itemPrice = Number(it.price) || 0;
          const itemCost = Number(product.cost_price) || 0;
          const qty = Number(it.qty) || 0;
          totalProfit += (itemPrice - itemCost) * qty;
        }
      });
    });

    const productSalesMap = {};
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const title = it.title || "منتج";
        if (!productSalesMap[title]) {
          const matchedProd = products.find((p) => p.title === title);
          productSalesMap[title] = {
            title,
            qty: 0,
            revenue: 0,
            image: matchedProd?.image || null,
          };
        }
        productSalesMap[title].qty += Number(it.qty) || 0;
        productSalesMap[title].revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // بيانات المخطط البياني تتطابق 100% مع إجمالي المبيعات
    let timelineData = [];
    let timelineLabel = "آخر 7 أيام";
    let timelineTotalLabel = "إجمالي مبيعات 7 أيام:";

    if (timeFilter === "today") {
      timelineLabel = "مبيعات اليوم";
      timelineTotalLabel = "إجمالي مبيعات اليوم:";
      timelineData = [{ dayName: "اليوم", sales: totalSales }];
    } else if (timeFilter === "7days") {
      timelineLabel = "آخر 7 أيام";
      timelineTotalLabel = "إجمالي مبيعات 7 أيام:";
      const dayMap = {};
      const dayList = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * dayMs);
        const dStr = d.toISOString().slice(0, 10);
        const name = d.toLocaleDateString("ar-LY", { weekday: "short" });
        dayList.push(dStr);
        dayMap[dStr] = { dayName: name, sales: 0 };
      }
      validOrders.forEach((o) => {
        const dStr = o.created_at ? o.created_at.slice(0, 10) : "";
        if (dayMap[dStr]) {
          dayMap[dStr].sales += Number(o.total_price) || 0;
        } else {
          // إضافة للخانة الأولى إذا كانت الطلبية في حدود الفترة
          const firstKey = dayList[0];
          if (dayMap[firstKey]) dayMap[firstKey].sales += Number(o.total_price) || 0;
        }
      });
      timelineData = Object.values(dayMap);
    } else if (timeFilter === "30days") {
      timelineLabel = "آخر 30 يوماً";
      timelineTotalLabel = "إجمالي مبيعات 30 يوماً:";
      const weekBuckets = [
        { dayName: "الأسبوع 1", sales: 0, minDays: 21, maxDays: 31 },
        { dayName: "الأسبوع 2", sales: 0, minDays: 14, maxDays: 21 },
        { dayName: "الأسبوع 3", sales: 0, minDays: 7, maxDays: 14 },
        { dayName: "الأسبوع 4", sales: 0, minDays: 0, maxDays: 7 },
      ];
      validOrders.forEach((o) => {
        const diffDays = (now - new Date(o.created_at).getTime()) / dayMs;
        const bucket = weekBuckets.find(b => diffDays >= b.minDays && diffDays < b.maxDays) || weekBuckets[3];
        bucket.sales += Number(o.total_price) || 0;
      });
      timelineData = weekBuckets;
    } else {
      timelineLabel = "كل الأوقات";
      timelineTotalLabel = "إجمالي المبيعات الكلية:";
      const monthsMap = {};
      validOrders.forEach((o) => {
        const m = new Date(o.created_at).toLocaleDateString("ar-LY", { year: "numeric", month: "short" });
        monthsMap[m] = (monthsMap[m] || 0) + (Number(o.total_price) || 0);
      });
      timelineData = Object.entries(monthsMap).map(([dayName, sales]) => ({ dayName, sales }));
      if (timelineData.length === 0) {
        timelineData = [{ dayName: "الإجمالي", sales: totalSales }];
      }
    }

    return {
      totalSales,
      totalOrders,
      completedOrders,
      shippedOrders,
      pendingOrders,
      cancelledOrders,
      totalUnitsSold,
      periodCustomers,
      aov,
      totalProfit,
      topSellingProducts,
      timelineData,
      timelineLabel,
      timelineTotalLabel,
      recentOrders: orders.slice(0, 6),
    };
  }, [orders, products, timeFilter]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return orders;
    const q = invoiceSearch.trim().toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").includes(q)
    );
  }, [orders, invoiceSearch]);

  const invoiceStats = useMemo(() => {
    const valid = filteredInvoices.filter((o) => o.status !== "ملغي");
    const validTotal = valid.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    const cancelled = filteredInvoices.filter((o) => o.status === "ملغي");
    const cancelledTotal = cancelled.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    return {
      totalCount: filteredInvoices.length,
      validCount: valid.length,
      validTotal,
      cancelledCount: cancelled.length,
      cancelledTotal,
    };
  }, [filteredInvoices]);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || "بدون تصنيف";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [products]);
  const categoryList = useMemo(() => Object.keys(productsByCategory), [productsByCategory]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed) {
      fetchProducts();
      fetchSettings();
      fetchOrders();
      fetchVisits();
      fetchUserRole();
      fetchTeamMembers();
    }
  }, [authed]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  async function fetchSettings() {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setSettingsForm({
        store_name: data.store_name || "",
        store_url: data.store_url || localStorage.getItem("nova_store_url") || "",
        store_description: data.store_description || localStorage.getItem("nova_store_description") || "",
        whatsapp_number: data.whatsapp_number || "",
        bank_account: data.bank_account || "",
        facebook_url: data.facebook_url || "",
        instagram_url: data.instagram_url || "",
        logo_url: data.logo_url || "",
      });
    }
    setSettingsLoading(false);
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);

    // حفظ الرابط والوصف محلياً دائماً
    if (settingsForm.store_url) {
      localStorage.setItem("nova_store_url", settingsForm.store_url);
    }
    if (settingsForm.store_description) {
      localStorage.setItem("nova_store_description", settingsForm.store_description);
    }

    // محاولة الحفظ في Supabase
    let { error } = await supabase
      .from("store_settings")
      .update(settingsForm)
      .eq("id", 1);

    // معالجة إذا كانت الأعمدة غير منشأة بعد في قاعدة بيانات Supabase
    if (error && (error.message.includes("store_description") || error.message.includes("store_url"))) {
      const { store_description, store_url, ...restSettings } = settingsForm;
      const fallbackResult = await supabase
        .from("store_settings")
        .update(restSettings)
        .eq("id", 1);

      if (!fallbackResult.error) {
        error = null;
      } else {
        error = fallbackResult.error;
      }
    }

    setSettingsSaving(false);

    if (error) {
      alert("صار خطأ أثناء حفظ الإعدادات: " + error.message);
      return;
    }

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    setOrdersLoading(false);
  }

  async function fetchVisits() {
    const { data, error } = await supabase.from("visits").select("created_at");
    if (!error) setVisits(data || []);
  }

  async function fetchUserRole() {
    setRoleLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    if (!email) {
      setRoleLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", email)
      .single();
    if (!error && data) {
      setUserRole(data.role);
    }
    setRoleLoading(false);
  }

  async function fetchTeamMembers() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setTeamMembers(data || []);
  }

  // حل مشكلة إضافة وتحديث رتبة العضو بذكاء بدون خطأ duplicate key
  async function handleAddMember(e) {
    e.preventDefault();
    const emailClean = newMemberEmail.trim().toLowerCase();
    if (!emailClean) return;
    setTeamSaving(true);

    // التحقق إذا كان البريد مسجلاً مسبقاً
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id, email, role")
      .eq("email", emailClean)
      .maybeSingle();

    let error;
    if (existingUser) {
      if (existingUser.role === "owner") {
        alert("هذا الحساب هو المالك الأساسي للمتجر ولا يمكن تغيير صلاحيته.");
        setTeamSaving(false);
        return;
      }
      ({ error } = await supabase
        .from("admin_users")
        .update({ role: newMemberRole })
        .eq("id", existingUser.id));
      if (!error) {
        alert(`تم تحديث صلاحية (${emailClean}) إلى "${newMemberRole === "admin" ? "أدمن" : "مشرف"}" بنجاح ✅`);
      }
    } else {
      ({ error } = await supabase
        .from("admin_users")
        .insert([{ email: emailClean, role: newMemberRole }]));
      if (!error) {
        alert(`تمت إضافة (${emailClean}) كـ "${newMemberRole === "admin" ? "أدمن" : "مشرف"}" بنجاح ✅`);
      }
    }

    setTeamSaving(false);
    if (error) {
      alert("فشل حفظ العضو: " + error.message);
      return;
    }
    setNewMemberEmail("");
    setNewMemberRole("moderator");
    fetchTeamMembers();
  }

  async function handleRemoveMember(id, role) {
    if (role === "owner") {
      alert("لا يمكن حذف المالك");
      return;
    }
    if (!confirm("متأكد تبي تزيل هذا العضو من الفريق؟")) return;
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
      return;
    }
    fetchTeamMembers();
  }

  async function handleUpdateCredentials(e) {
    e.preventDefault();
    setCredsSaving(true);
    setCredsMessage("");

    const updates = {};
    if (newLoginEmail) updates.email = newLoginEmail;
    if (newLoginPassword) updates.password = newLoginPassword;

    if (Object.keys(updates).length === 0) {
      setCredsSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);
    setCredsSaving(false);

    if (error) {
      setCredsMessage("خطأ: " + error.message);
      return;
    }

    setCredsMessage("تم التحديث بنجاح! لو غيرت البريد لازم تأكده من صندوق الوارد.");
    setNewLoginEmail("");
    setNewLoginPassword("");
  }

  async function updateOrderStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert("فشل تحديث الحالة: " + error.message);
      return;
    }
    const targetOrder = orders.find((o) => o.id === id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    if (targetOrder) {
      const waInfo = buildStatusWhatsAppLink(targetOrder, status, settingsForm.store_name || "متجرنا");
      if (waInfo.url) {
        setWaNotifyModal({
          order: { ...targetOrder, status },
          newStatus: status,
          message: waInfo.text,
          waLink: waInfo.url,
          phone: waInfo.phone,
        });
      }
    }
  }

  async function handleDispatchToDelivery(order, providerCode = "darb_assabil") {
    const provider = ProviderRegistry.getDeliveryProvider(providerCode) || ProviderRegistry.getAllDeliveryProviders().find((p) => p.isActive);
    if (!provider) {
      alert("لا يوجد مزود توصيل نشط حالياً. يرجى تفعيل شركة توصيل من تبويب الدفع والتوصيل.");
      return;
    }

    const internalOrder = new InternalOrder({
      orderId: order.id,
      customer: new InternalCustomer({
        name: order.customer_name || "زبون",
        phone: order.customer_phone || "",
      }),
      shippingAddress: new InternalAddress({
        city: (order.customer_address || "طرابلس").split("-")[0].trim(),
        address: order.customer_address || "طرابلس",
      }),
      items: (order.items || []).map((it) => new InternalOrderItem({
        title: it.title,
        quantity: it.qty || 1,
        unitPrice: it.price || 10,
      })),
      totalAmount: order.total_price || 0,
      paymentMethod: order.payment_method,
    });

    try {
     const response = await fetch("/api/dispatch-shipment", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    order: {
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      items: order.items,
    },
  }),
});

const rawResponse = await response.text();

let apiResult = {};

try {
  apiResult = rawResponse ? JSON.parse(rawResponse) : {};
} catch (parseError) {
  apiResult = {
    success: false,
    error: `الخادم أعاد ردًا غير صالح. رمز الاستجابة: ${response.status}. الرد: ${rawResponse.slice(0, 300)}`,
  };
}

const shipmentData =
  apiResult?.data?.data ||
  apiResult?.data ||
  {};

const trackingNumber =
  shipmentData.reference ||
  shipmentData.trackingNumber ||
  shipmentData.tracking_number ||
  "";

const result = {
  success: response.ok && apiResult.success === true,
  shipment: trackingNumber
    ? { trackingNumber }
    : null,
  message: apiResult.error || apiResult.message || "",
};
      if (result.success) {
        const trackingRef = result.shipment?.trackingNumber || `DS-${order.id}`;

        await supabase
          .from("orders")
          .update({
            tracking_number: trackingRef,
            status: "تم الشحن",
          })
          .eq("id", order.id);

        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, tracking_number: trackingRef, status: "تم الشحن" }
              : o
          )
        );

        setRegistryVersion((v) => v + 1);
        alert(`تم تسجيل الشحنة بنجاح في (${provider.name}) ✅\nرقم التتبع: ${trackingRef}`);

        const waInfo = buildStatusWhatsAppLink({ ...order, tracking_number: trackingRef }, "تم الشحن", settingsForm.store_name || "متجرنا");
        if (waInfo.url) {
          setWaNotifyModal({
            order: { ...order, tracking_number: trackingRef, status: "تم الشحن" },
            newStatus: "تم الشحن",
            message: waInfo.text,
            waLink: waInfo.url,
            phone: waInfo.phone,
          });
        }
      } else {
        alert("فشل تسجيل الشحنة لدى شركة التوصيل: " + (result.message || "خطأ"));
      }
    } catch (err) {
      alert("تعذر الاتصال بشركة التوصيل: " + err.message);
    }
  }

  async function saveBankReceipt(orderId) {
    const input = bankReceiptInputs[orderId] || {};
    const { error } = await supabase
      .from("orders")
      .update({
        bank_receipt_number: input.number || null,
        bank_receipt_date: input.date || null,
      })
      .eq("id", orderId);
    if (error) {
      alert("فشل حفظ بيانات الإيصال: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, bank_receipt_number: input.number || null, bank_receipt_date: input.date || null }
          : o
      )
    );
  }

  async function confirmBankTransfer(orderId) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ status: "قيد التجهيز", bank_verified_at: now })
      .eq("id", orderId);
    if (error) {
      alert("فشل تأكيد الحوالة: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "قيد التجهيز", bank_verified_at: now } : o))
    );
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    setLoggingIn(false);
    if (error) {
      setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function uploadImagesIfNeeded() {
    let urls = [];

    if (uploadMethod === "url") {
      if (form.image) urls.push(form.image);
      const extra = form.extraImagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      urls = urls.concat(extra);
    } else {
      urls = [...existingImages];

      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("Product-images")
          .upload(fileName, file);

        if (uploadError) {
          alert("فشل رفع إحدى الصور: " + uploadError.message);
          continue;
        }

        const { data } = supabase.storage.from("Product-images").getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }

    return urls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("لازم تكتب اسم المنتج والسعر على الأقل");
      return;
    }

    setSaving(true);
    const imageUrls = await uploadImagesIfNeeded();

    const payload = {
      title: form.name,
      description: form.description || null,
      price: Number(form.price),
      cost_price: form.cost_price !== "" ? Number(form.cost_price) : null,
      old_price: form.compare_at ? Number(form.compare_at) : null,
      category: form.category || null,
      code: form.code || null,
      stock: form.stock !== "" ? Number(form.stock) : 0,
      image: imageUrls[0] || null,
      images: imageUrls,
    };

    let error;
    let productId = editingId;

    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert([payload])
        .select()
        .single();
      error = insertError;
      if (data) productId = data.id;
    }

    if (error) {
      setSaving(false);
      alert("صار خطأ: " + error.message);
      return;
    }

    if (productId) {
      await supabase.from("product_variants").delete().eq("product_id", productId);

      const validVariants = variants
        .filter((v) => v.size || v.color)
        .map((v) => ({
          product_id: productId,
          size: v.size || null,
          color: v.color || null,
          price: v.price !== "" ? Number(v.price) : null,
          quantity: v.quantity !== "" ? Number(v.quantity) : 0,
        }));

      if (validVariants.length > 0) {
        await supabase.from("product_variants").insert(validVariants);
      }
    }

    setSaving(false);
    setForm(emptyForm);
    setVariants([]);
    setImageFiles([]);
    setExistingImages([]);
    setEditingId(null);
    fetchProducts();
  }

  async function startEdit(product) {
    setEditingId(product.id);
    const imgs = product.images && product.images.length ? product.images : (product.image ? [product.image] : []);
    setForm({
      name: product.title || "",
      description: product.description || "",
      price: product.price || "",
      cost_price: product.cost_price ?? "",
      compare_at: product.old_price || "",
      category: product.category || "",
      code: product.code || "",
      stock: product.stock ?? "",
      image: imgs[0] || "",
      extraImagesText: imgs.slice(1).join("\n"),
    });
    setExistingImages(imgs);
    setImageFiles([]);
    setUploadMethod("url");

    const { data: variantData } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    setVariants(
      (variantData || []).map((v) => ({
        size: v.size || "",
        color: v.color || "",
        price: v.price ?? "",
        quantity: v.quantity ?? "",
      }))
    );

    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
  }

  async function handleDelete(id) {
    if (isModerator) {
      alert("عذراً، ليس لديك صلاحية حذف المنتجات");
      return;
    }
    if (!confirm("متأكد تبي تحذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
      return;
    }
    fetchProducts();
  }

  if (authChecking) {
    return (
      <div style={styles.loginWrap}>
        <p>جارٍ التحقق...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h2>لوحة التحكم</h2>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={styles.input}
          />
          {loginError && <span style={{ color: "#c00", fontSize: 13 }}>{loginError}</span>}
          <button type="submit" disabled={loggingIn} style={styles.primaryBtn}>
            {loggingIn ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  const maxChartSale = Math.max(...(dashboardStats.timelineData || []).map((d) => d.sales), 1);

  return (
    <div dir="rtl" style={styles.layout}>
      {/* زر فتح/إغلاق القائمة للموبايل */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={styles.menuToggle}
        className="admin-menu-toggle"
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={styles.overlay}
          className="admin-overlay"
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        style={styles.sidebar}
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
      >
        <div style={{ paddingBottom: 16, borderBottom: "1px solid #222", marginBottom: 12 }}>
          <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 800 }}>
            {settingsForm.store_name || "لوحة الإدارة"}
          </h3>
          <span style={{ fontSize: 11, color: "#888" }}>نظام الإحصائيات المتطور</span>
        </div>

        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSidebarOpen(false);
            }}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}

        <button onClick={handleLogout} style={styles.logoutBtn}>
          تسجيل خروج
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <div style={styles.page}>
        {/* ========================================================
            تبويب: لوحة الإحصائيات الشاملة
           ======================================================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header / ترحيب وفلاتر الوقت */}
            <div style={styles.dashHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0B2027" }}>لوحة التحكم</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5B7278" }}>
                  مرحباً بك في لوحة إدارة وتحليل متجرك
                </p>
              </div>

              {/* أزرار تصفية الوقت */}
              <div style={styles.timeFilterGroup}>
                {[
                  { id: "today", label: "اليوم" },
                  { id: "7days", label: "آخر 7 أيام" },
                  { id: "30days", label: "آخر 30 يوم" },
                  { id: "all", label: "كل الأوقات" },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeFilter(tf.id)}
                    style={{
                      ...styles.timeFilterBtn,
                      ...(timeFilter === tf.id ? styles.timeFilterBtnActive : {}),
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* البطاقات الخمس الرئيسية */}
            <div style={styles.metricCardsGrid}>
              {/* 1. إجمالي المبيعات */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#E0F2FE", "#0284C7")}>
                    <DollarSign size={20} />
                  </div>
                  <span style={styles.trendBadge("#DCFCE7", "#16A34A")}>
                    <ArrowUpRight size={13} /> حقيقي
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>إجمالي المبيعات</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalSales.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span>
                  </h3>
                </div>
              </div>

              {/* 2. عدد الطلبات */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#DCFCE7", "#16A34A")}>
                    <ShoppingBag size={20} />
                  </div>
                  <span style={styles.trendBadge("#F0FDF4", "#15803D")}>
                    {dashboardStats.completedOrders} مكتمل
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>الطلبات</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalOrders} <span style={{ fontSize: 14 }}>طلب</span>
                  </h3>
                </div>
              </div>

              {/* 3. العملاء */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#F3E8FF", "#9333EA")}>
                    <Users size={20} />
                  </div>
                  <span style={styles.trendBadge("#FAF5FF", "#7E22CE")}>زبائن</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>العملاء</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.periodCustomers} <span style={{ fontSize: 14 }}>عميل</span>
                  </h3>
                </div>
              </div>

              {/* 4. متوسط قيمة الطلب */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#FEF3C7", "#D97706")}>
                    <TrendingUp size={20} />
                  </div>
                  <span style={styles.trendBadge("#FFFBEB", "#B45309")}>معدل الطلب</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>متوسط قيمة الطلب</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.aov.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span>
                  </h3>
                  <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2, display: "block" }}>
                    (المبيعات ÷ عدد الطلبات)
                  </span>
                </div>
              </div>

              {/* 5. المنتجات المباعة */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#E0E7FF", "#4F46E5")}>
                    <Package size={20} />
                  </div>
                  <span style={styles.trendBadge("#EEF2FF", "#4338CA")}>قطع</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>المنتجات المباعة</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalUnitsSold} <span style={{ fontSize: 14 }}>قطعة</span>
                  </h3>
                  <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2, display: "block" }}>
                    إجمالي القطع في الفترة
                  </span>
                </div>
              </div>
            </div>

            {/* صف التحليلات الرئيسية الثلاثة */}
            <div style={styles.analyticsRow}>
              {/* 1. أفضل المنتجات مبيعاً */}
              <div style={{ ...styles.modernCard, flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>أفضل المنتجات مبيعاً</h4>
                  <span style={{ fontSize: 11, color: "#5B7278" }}>بالكمية</span>
                </div>

                {dashboardStats.topSellingProducts.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد مبيعات في هذه الفترة</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dashboardStats.topSellingProducts.map((p, idx) => (
                      <div key={idx} style={styles.topProductItem}>
                        <span style={styles.rankBadge}>{idx + 1}</span>
                        {p.image ? (
                          <img src={p.image} alt={p.title} style={styles.topProductThumb} />
                        ) : (
                          <div style={{ ...styles.topProductThumb, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
                            <Package size={16} color="#888" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.title}
                          </div>
                          <span style={{ fontSize: 11, color: "#5B7278" }}>مباع: {p.qty} قطعة</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0E7C86" }}>
                          {p.revenue.toLocaleString()} د.ل
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. نظرة عامة على المبيعات (ديناميكية حسب الفلتر المختار) */}
              <div style={{ ...styles.modernCard, flex: 1.5, minWidth: 320 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>نظرة عامة على المبيعات</h4>
                  <span style={{ fontSize: 11, color: "#0E7C86", fontWeight: 700 }}>{dashboardStats.timelineLabel}</span>
                </div>

                <div style={{ height: 170, display: "flex", alignItems: "flex-end", gap: 12, paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #E3ECED" }}>
                  {dashboardStats.timelineData.map((d, i) => {
                    const heightPercent = maxChartSale > 0 ? (d.sales / maxChartSale) * 100 : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: d.sales > 0 ? "#0E7C86" : "#aaa" }}>
                          {d.sales > 0 ? `${d.sales.toLocaleString()}` : "0"}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 36,
                            height: `${Math.max(heightPercent, 6)}%`,
                            background: d.sales > 0 ? "linear-gradient(180deg, #0E7C86 0%, #2DD4BF 100%)" : "#E2E8F0",
                            borderRadius: "6px 6px 0 0",
                            transition: "all .3s ease",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "#5B7278", marginTop: 4 }}>{d.dayName}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "#5B7278" }}>
                  <span>{dashboardStats.timelineTotalLabel}</span>
                  <strong style={{ color: "#0B2027", fontSize: 13 }}>
                    {dashboardStats.timelineData.reduce((s, x) => s + x.sales, 0).toLocaleString()} د.ل
                  </strong>
                </div>
              </div>

              {/* 3. حالة الطلبات */}
              <div style={{ ...styles.modernCard, flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>حالة الطلبات</h4>
                  <span style={{ fontSize: 11, color: "#5B7278" }}>{dashboardStats.totalOrders} طلب</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "مكتملة", count: dashboardStats.completedOrders, color: "#16A34A", bg: "#DCFCE7" },
                    { label: "قيد الشحن والتجهيز", count: dashboardStats.shippedOrders, color: "#0284C7", bg: "#E0F2FE" },
                    { label: "جديد / معلق", count: dashboardStats.pendingOrders, color: "#D97706", bg: "#FEF3C7" },
                    { label: "ملغي", count: dashboardStats.cancelledOrders, color: "#DC2626", bg: "#FEE2E2" },
                  ].map((st, i) => {
                    const pct = dashboardStats.totalOrders > 0 ? Math.round((st.count / dashboardStats.totalOrders) * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
                            {st.label}
                          </span>
                          <span style={{ fontWeight: 800, color: "#0B2027" }}>
                            {st.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: st.color, borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* جدول آخر الطلبات الحديثة */}
            <div style={styles.modernCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>آخر الطلبات المسجلة</h4>
                <button onClick={() => setActiveTab("orders")} style={{ fontSize: 12, color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                  عرض كل الطلبات ←
                </button>
              </div>

              {dashboardStats.recentOrders.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد طلبات مسجلة بعد</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>رقم الطلب</th>
                        <th style={styles.th}>العميل</th>
                        <th style={styles.th}>المنتجات</th>
                        <th style={styles.th}>المبلغ</th>
                        <th style={styles.th}>الحالة</th>
                        <th style={styles.th}>التاريخ</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardStats.recentOrders.map((o) => (
                        <tr key={o.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 800 }}>#{o.id}</td>
                          <td style={styles.td}>
                            <div>{o.customer_name || "زبون"}</div>
                            <div style={{ fontSize: 11, color: "#5B7278" }}>{o.customer_phone}</div>
                          </td>
                          <td style={styles.td}>
                            {(o.items || []).map((it) => `${it.title} (${it.qty})`).join("، ")}
                          </td>
                          <td style={{ ...styles.td, fontWeight: 800, color: "#0E7C86" }}>
                            {o.total_price} د.ل
                          </td>
                          <td style={styles.td}>
                            <span style={styles.orderStatusPill(o.status)}>
                              {STATUS_LABELS[o.status] || o.status || "جديد"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 11, color: "#5B7278" }}>
                            {new Date(o.created_at).toLocaleDateString("ar-LY")}
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => printAdminInvoice(o, settingsForm.store_name)}
                              style={styles.actionPillBtn}
                            >
                              🧾 فاتورة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- تبويب: إعدادات المتجر ---- */}
        {activeTab === "settings" && (
          <form onSubmit={handleSettingsSubmit} style={styles.form}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>إعدادات المتجر</h3>
            {settingsLoading ? (
              <p>جارٍ تحميل الإعدادات...</p>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>اسم المتجر</label>
                  <input
                    style={styles.input}
                    placeholder="مثال: NOVA SHOP"
                    value={settingsForm.store_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                    رابط المتجر (Store URL / Domain)
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...styles.input, direction: "ltr", textAlign: "left" }}
                      placeholder="مثال: https://nova-shop.ly أو https://mystore.com"
                      value={settingsForm.store_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, store_url: e.target.value })}
                    />
                    {settingsForm.store_url && (
                      <a
                        href={settingsForm.store_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...styles.secondaryBtn, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        <ExternalLink size={14} /> زيارة
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "block" }}>
                    💡 يُستخدم هذا الرابط لإنشاء روابط مشاركة المنتجات والـ Webhooks وبطاقات المعاينة الاجتماعية.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                    وصف المتجر (يظهر تحت الشعار واسم المتجر)
                  </label>
                  <textarea
                    rows={3}
                    style={{ ...styles.input, resize: "vertical" }}
                    placeholder="اكتب وصفاً جذاباً لمتجرك يظهر للزبائن تحت الشعار مباشرة (مثال: كل ما تحتاجه في مكان واحد — منتجات أصلية، عروض حصرية، وتوصيل سريع لكافة المدن)"
                    value={settingsForm.store_description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, store_description: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>شعار المتجر (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fileExt = file.name.split(".").pop();
                      const fileName = `logo-${Date.now()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from("Product-images")
                        .upload(fileName, file);
                      if (uploadError) {
                        alert("فشل رفع الشعار: " + uploadError.message);
                        return;
                      }
                      const { data } = supabase.storage.from("Product-images").getPublicUrl(fileName);
                      setSettingsForm({ ...settingsForm, logo_url: data.publicUrl });
                    }}
                    style={styles.input}
                  />
                  {settingsForm.logo_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={settingsForm.logo_url} alt="شعار المتجر" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid #eee" }} />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("متأكد تبي تحذف الشعار؟")) return;
                          try {
                            const url = settingsForm.logo_url;
                            const fileName = url.split("/").pop();
                            await supabase.storage.from("Product-images").remove([fileName]);
                          } catch (err) {
                            console.error("تعذر حذف الملف من التخزين:", err);
                          }
                          setSettingsForm({ ...settingsForm, logo_url: "" });
                        }}
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fca5a5",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        حذف الشعار
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رقم الواتساب</label>
                  <input
                    style={styles.input}
                    placeholder="رقم الواتساب (بصيغة دولية، مثال 218912345678)"
                    value={settingsForm.whatsapp_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رقم الحساب البنكي</label>
                  <input
                    style={styles.input}
                    placeholder="رقم الحساب البنكي لتحويلات الزبائن"
                    value={settingsForm.bank_account}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                  />
                </div>

                <div style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رابط فيسبوك</label>
                    <input
                      style={styles.input}
                      placeholder="رابط فيسبوك (اختياري)"
                      value={settingsForm.facebook_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, facebook_url: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رابط إنستقرام</label>
                    <input
                      style={styles.input}
                      placeholder="رابط إنستقرام (اختياري)"
                      value={settingsForm.instagram_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <button type="submit" disabled={settingsSaving} style={styles.primaryBtn}>
                    {settingsSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
                  </button>
                  {settingsSaved && (
                    <span style={{ color: "#1c9963", alignSelf: "center", fontWeight: 700 }}>✓ تم الحفظ بنجاح</span>
                  )}
                </div>
              </>
            )}
          </form>
        )}

        {/* ========================================================
            تبويب: الدفع والتوصيل (Modular Integration Layer)
           ======================================================== */}
        {activeTab === "integrations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* رأس الصفحة وأزرار التنقل الرئيسية */}
            <div style={styles.dashHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    الدفع والتوصيل (Integration Layer)
                  </h2>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: "#E0F2FE", color: "#0369A1" }}>
                    معمارية موحدة
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5B7278" }}>
                  إدارة وربط بوابات الدفع الإلكتروني وشركات الشحن والتوصيل مع المتجر دون كتابة كود مخصص
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={() => handleOpenAddProvider("payment")}
                  style={{ ...styles.primaryBtn, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}
                >
                  <Plus size={16} /> إضافة بوابة دفع
                </button>
                <button
                  onClick={() => handleOpenAddProvider("delivery")}
                  style={{ ...styles.secondaryBtn, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, background: "#0B2027", color: "#fff" }}
                >
                  <Plus size={16} /> إضافة شركة توصيل
                </button>
              </div>
            </div>

            {/* شريط التبويبات الفرعية الثلاثة */}
            <div style={{ display: "flex", gap: 8, background: "#E2E8F0", padding: 4, borderRadius: 12, width: "fit-content" }}>
              <button
                onClick={() => setIntegrationSubTab("payments")}
                style={{
                  ...styles.timeFilterBtn,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  ...(integrationSubTab === "payments" ? styles.timeFilterBtnActive : {}),
                }}
              >
                <CreditCard size={15} /> طرق وبوابات الدفع ({paymentProvidersList.length})
              </button>
              <button
                onClick={() => setIntegrationSubTab("delivery")}
                style={{
                  ...styles.timeFilterBtn,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  ...(integrationSubTab === "delivery" ? styles.timeFilterBtnActive : {}),
                }}
              >
                <Truck size={15} /> شركات التوصيل والشحن ({deliveryProvidersList.length})
              </button>
              <button
                onClick={() => setIntegrationSubTab("logs")}
                style={{
                  ...styles.timeFilterBtn,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  ...(integrationSubTab === "logs" ? styles.timeFilterBtnActive : {}),
                }}
              >
                <Activity size={15} /> سجل العمليات والتكاملات ({integrationLogsList.length})
              </button>
            </div>

            {/* ----------------------------------------------------
                القسم 1: طرق وبوابات الدفع (Payment Providers)
               ---------------------------------------------------- */}
            {integrationSubTab === "payments" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {paymentProvidersList.map((prov) => {
                  const testRes = testFeedback[prov.code];
                  const isTesting = testingCode === prov.code;
                  return (
                    <div key={prov.code} style={styles.integrationCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CreditCard size={22} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0B2027" }}>{prov.name}</h4>
                            <span style={{ fontSize: 11, color: "#5B7278" }}>كود: {prov.code}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: prov.isActive ? "#DCFCE7" : "#FEE2E2",
                            color: prov.isActive ? "#15803D" : "#B91C1C",
                          }}>
                            {prov.isActive ? "🟢 نشط ومفعل" : "🔴 معطل"}
                          </span>
                          {!prov.config.isSystem && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F1F5F9", color: "#64748B" }}>
                              {prov.environment === "production" ? "إنتاجي Live" : "تجريبي Sandbox"}
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: "0 0 12px 0", fontSize: 12.5, color: "#5B7278", lineHeight: 1.5 }}>
                        {prov.config.description || (prov.config.apiBaseUrl ? `رابط الخادم: ${prov.config.apiBaseUrl}` : "بوابة دفع مهيأة للعمل مع المتجر")}
                      </p>

                      {/* عرض الـ API Key المشفر والمحمي إن وجد */}
                      {prov.config.apiKey && (
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 10px", fontSize: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748B" }}>API Key:</span>
                          <code style={{ direction: "ltr", fontWeight: 700, color: "#0E7C86" }}>
                            {maskSecret(prov.config.apiKey)}
                          </code>
                        </div>
                      )}

                      {/* رسالة نتيجة الاختبار المباشر */}
                      {testRes && (
                        <div style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 12,
                          background: testRes.success ? "#DCFCE7" : "#FEE2E2",
                          color: testRes.success ? "#15803D" : "#B91C1C",
                          border: `1px solid ${testRes.success ? "#86EFAC" : "#FCA5A5"}`,
                        }}>
                          {testRes.message} <span style={{ fontSize: 10, opacity: 0.8 }}>({testRes.time})</span>
                        </div>
                      )}

                      {/* أزرار الإجراءات */}
                      <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleTestProvider(prov)}
                          disabled={isTesting}
                          style={{ ...styles.secondaryBtn, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}
                        >
                          <Zap size={14} color="#D97706" />
                          {isTesting ? "جارٍ الفحص..." : "اختبار الاتصال"}
                        </button>
                        
                        <button
                          onClick={() => handleOpenEditProvider(prov)}
                          style={{ ...styles.secondaryBtn, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}
                        >
                          <Sliders size={14} />
                          إعدادات
                        </button>

                        <button
                          onClick={() => handleToggleProvider(prov.code, prov.isActive)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            background: prov.isActive ? "#FEE2E2" : "#DCFCE7",
                            color: prov.isActive ? "#B91C1C" : "#15803D",
                          }}
                        >
                          {prov.isActive ? "تعطيل" : "تفعيل"}
                        </button>

                        {!prov.config.isSystem && (
                          <button
                            onClick={() => handleDeleteCustomProvider(prov.code, prov.name)}
                            style={{ ...styles.deleteBtn, padding: "6px 10px", borderRadius: 8 }}
                            title="حذف المزود"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ----------------------------------------------------
                القسم 2: شركات التوصيل والشحن (Delivery Providers)
               ---------------------------------------------------- */}
            {integrationSubTab === "delivery" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {deliveryProvidersList.map((prov) => {
                  const testRes = testFeedback[prov.code];
                  const isTesting = testingCode === prov.code;
                  return (
                    <div key={prov.code} style={styles.integrationCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Truck size={22} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0B2027" }}>{prov.name}</h4>
                            <span style={{ fontSize: 11, color: "#5B7278" }}>كود: {prov.code}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: prov.isActive ? "#DCFCE7" : "#FEE2E2",
                            color: prov.isActive ? "#15803D" : "#B91C1C",
                          }}>
                            {prov.isActive ? "🟢 نشط ومفعل" : "🔴 معطل"}
                          </span>
                          {!prov.config.isSystem && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#F1F5F9", color: "#64748B" }}>
                              {prov.environment === "production" ? "إنتاجي Live" : "تجريبي Sandbox"}
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: "0 0 12px 0", fontSize: 12.5, color: "#5B7278", lineHeight: 1.5 }}>
                        {prov.config.description || (prov.config.apiBaseUrl ? `رابط خادم الشركة: ${prov.config.apiBaseUrl}` : "خدمة توصيل مربوطة بالمتجر")}
                      </p>

                      {/* معلومات التسعير والمدن */}
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "#64748B" }}>سعر التوصيل الافتراضي:</span>
                          <strong style={{ color: "#0B2027" }}>{prov.config.flatRate || 20} د.ل</strong>
                        </div>
                        <div style={{ color: "#64748B", fontSize: 11 }}>
                          التغطية: مدن ليبيا الرئيسية (طرابلس، بنغازي، مصراتة، الزاوية...)
                        </div>
                      </div>

                      {/* رسالة نتيجة الاختبار المباشر */}
                      {testRes && (
                        <div style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 12,
                          background: testRes.success ? "#DCFCE7" : "#FEE2E2",
                          color: testRes.success ? "#15803D" : "#B91C1C",
                          border: `1px solid ${testRes.success ? "#86EFAC" : "#FCA5A5"}`,
                        }}>
                          {testRes.message} <span style={{ fontSize: 10, opacity: 0.8 }}>({testRes.time})</span>
                        </div>
                      )}

                      {/* أزرار الإجراءات */}
                      <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleTestProvider(prov)}
                          disabled={isTesting}
                          style={{ ...styles.secondaryBtn, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}
                        >
                          <Zap size={14} color="#D97706" />
                          {isTesting ? "جارٍ الفحص..." : "اختبار الاتصال"}
                        </button>
                        
                        <button
                          onClick={() => handleOpenEditProvider(prov)}
                          style={{ ...styles.secondaryBtn, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}
                        >
                          <Sliders size={14} />
                          إعدادات
                        </button>

                        <button
                          onClick={() => handleToggleProvider(prov.code, prov.isActive)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            background: prov.isActive ? "#FEE2E2" : "#DCFCE7",
                            color: prov.isActive ? "#B91C1C" : "#15803D",
                          }}
                        >
                          {prov.isActive ? "تعطيل" : "تفعيل"}
                        </button>

                        {!prov.config.isSystem && (
                          <button
                            onClick={() => handleDeleteCustomProvider(prov.code, prov.name)}
                            style={{ ...styles.deleteBtn, padding: "6px 10px", borderRadius: 8 }}
                            title="حذف المزود"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ----------------------------------------------------
                القسم 3: سجل العمليات والتكاملات (Integration Logs)
               ---------------------------------------------------- */}
            {integrationSubTab === "logs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* شريط البحث والتصفية للسجلات */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, flex: 1, maxWidth: 460 }}>
                    <input
                      style={{ ...styles.input, padding: "8px 14px", fontSize: 12.5 }}
                      placeholder="🔍 ابحث في السجلات (اسم المزود، الرابط، الرسالة)..."
                      value={logFilterQuery}
                      onChange={(e) => setLogFilterQuery(e.target.value)}
                    />
                    <select
                      style={{ ...styles.select, padding: "8px 12px", fontSize: 12.5 }}
                      value={logFilterType}
                      onChange={(e) => setLogFilterType(e.target.value)}
                    >
                      <option value="all">كل العمليات</option>
                      <option value="payment">الدفع فقط</option>
                      <option value="delivery">التوصيل فقط</option>
                      <option value="general">عامة</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("هل ترغب في مسح سجل العمليات؟")) {
                        IntegrationLogs.clearLogs();
                        setRegistryVersion((v) => v + 1);
                      }
                    }}
                    style={{ ...styles.secondaryBtn, fontSize: 12, color: "#DC2626" }}
                  >
                    مسح السجلات 🗑️
                  </button>
                </div>

                {integrationLogsList.length === 0 ? (
                  <div style={{ ...styles.modernCard, textAlign: "center", padding: 32, color: "#888", fontSize: 13 }}>
                    لا توجد سجلات مسجلة بعد. عند إجراء عمليات الدفع أو اختبارات الاتصال ستظهر هنا مباشرة.
                  </div>
                ) : (
                  <div style={styles.modernCard}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>الوقت</th>
                            <th style={styles.th}>المزود</th>
                            <th style={styles.th}>العملية</th>
                            <th style={styles.th}>نقطة النهاية (Endpoint)</th>
                            <th style={styles.th}>الاستجابة / الزمن</th>
                            <th style={styles.th}>الحالة</th>
                            <th style={styles.th}>الرسالة والتفاصيل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {integrationLogsList.map((log) => (
                            <tr key={log.id} style={styles.tr}>
                              <td style={{ ...styles.td, fontSize: 11.5, color: "#5B7278", whiteSpace: "nowrap" }}>
                                {new Date(log.timestamp).toLocaleTimeString("ar-LY")}
                              </td>
                              <td style={{ ...styles.td, fontWeight: 700 }}>
                                <span style={{ padding: "2px 8px", borderRadius: 6, background: "#F1F5F9", fontSize: 11 }}>
                                  {log.providerCode}
                                </span>
                              </td>
                              <td style={{ ...styles.td, fontSize: 12 }}>
                                {log.action || log.providerType}
                              </td>
                              <td style={{ ...styles.td, fontSize: 11.5, color: "#475569", direction: "ltr", textAlign: "right" }}>
                                <code>{log.method} {log.endpoint}</code>
                              </td>
                              <td style={{ ...styles.td, fontSize: 12, whiteSpace: "nowrap" }}>
                                <span style={{ fontWeight: 700, color: log.success ? "#16A34A" : "#DC2626" }}>
                                  {log.statusCode || 200}
                                </span>
                                <span style={{ fontSize: 10, color: "#94A3B8", marginRight: 4 }}>
                                  ({log.durationMs || 0}ms)
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background: log.success ? "#DCFCE7" : "#FEE2E2",
                                  color: log.success ? "#15803D" : "#B91C1C",
                                }}>
                                  {log.success ? "🟢 ناجح" : "🔴 فشل"}
                                </span>
                              </td>
                              <td style={{ ...styles.td, fontSize: 12, color: "#334155" }}>
                                {log.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                MODAL WIZARD: إضافة أو تعديل مزود خدمة (Payment / Delivery)
               ---------------------------------------------------- */}
            {isConfigModalOpen && (
              <div style={styles.modalOverlay}>
                <div style={styles.modalDialog}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 14, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0B2027" }}>
                        إعداد مزود خدمة: {editingProvider.name || "مزود جديد"}
                      </h3>
                      <span style={{ fontSize: 12, color: "#5B7278" }}>
                        ربط آمن عبر الـ API مع تشفير الـ Secrets وعزل البيانات
                      </span>
                    </div>
                    <button
                      onClick={() => setIsConfigModalOpen(false)}
                      style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveProviderSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={styles.row}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>نوع التكامل *</label>
                        <select
                          style={styles.select}
                          value={editingProvider.type}
                          onChange={(e) => setEditingProvider({ ...editingProvider, type: e.target.value })}
                          disabled={editingProvider.isSystem}
                        >
                          <option value="payment">بوابة دفع إلكتروني (Payment Gateway)</option>
                          <option value="delivery">شركة توصيل وشحن (Delivery Company)</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>بيئة العمل *</label>
                        <select
                          style={styles.select}
                          value={editingProvider.environment}
                          onChange={(e) => setEditingProvider({ ...editingProvider, environment: e.target.value })}
                        >
                          <option value="sandbox">تجريبية (Sandbox / Test)</option>
                          <option value="production">إنتاجية (Production / Live)</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.row}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>اسم الشركة أو البوابة *</label>
                        <input
                          style={styles.input}
                          placeholder="مثال: شركة النيزك للشحن / بوابة مدفوعات ليبيا"
                          value={editingProvider.name}
                          onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>كود المعرف (Code) *</label>
                        <input
                          style={styles.input}
                          placeholder="alnaizak_delivery"
                          value={editingProvider.code}
                          onChange={(e) => setEditingProvider({ ...editingProvider, code: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                          disabled={editingProvider.isSystem}
                          required
                        />
                      </div>
                    </div>

                    {!editingProvider.isSystem && (
                      <>
                        <div>
                          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>رابط الـ API الأساسي (Base URL)</label>
                          <input
                            style={styles.input}
                            placeholder="https://api.deliverycompany.com/v1"
                            value={editingProvider.apiBaseUrl}
                            onChange={(e) => setEditingProvider({ ...editingProvider, apiBaseUrl: e.target.value })}
                          />
                        </div>

                        <div style={styles.row}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <label style={{ fontSize: 12.5, fontWeight: 700 }}>مفتاح الـ API (API Key)</label>
                              <button
                                type="button"
                                onClick={() => setShowSecretMap((p) => ({ ...p, apiKey: !p.apiKey }))}
                                style={{ background: "none", border: "none", color: "#0E7C86", cursor: "pointer", fontSize: 11 }}
                              >
                                {showSecretMap.apiKey ? "إخفاء 🙈" : "إظهار 👁️"}
                              </button>
                            </div>
                            <input
                              style={styles.input}
                              type={showSecretMap.apiKey ? "text" : "password"}
                              placeholder="api_key_live_..."
                              value={editingProvider.apiKey}
                              onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                            />
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <label style={{ fontSize: 12.5, fontWeight: 700 }}>السر الخاص (API Secret)</label>
                              <button
                                type="button"
                                onClick={() => setShowSecretMap((p) => ({ ...p, apiSecret: !p.apiSecret }))}
                                style={{ background: "none", border: "none", color: "#0E7C86", cursor: "pointer", fontSize: 11 }}
                              >
                                {showSecretMap.apiSecret ? "إخفاء 🙈" : "إظهار 👁️"}
                              </button>
                            </div>
                            <input
                              style={styles.input}
                              type={showSecretMap.apiSecret ? "text" : "password"}
                              placeholder="sec_live_..."
                              value={editingProvider.apiSecret}
                              onChange={(e) => setEditingProvider({ ...editingProvider, apiSecret: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Webhook Settings */}
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>رابط الـ Webhook (لاستقبال تحديثات الشركة)</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              style={{ ...styles.input, direction: "ltr", background: "#fff" }}
                              readOnly
                              value={editingProvider.webhookUrl}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(editingProvider.webhookUrl);
                                alert("تم نسخ رابط الـ Webhook بنجاح 📋");
                              }}
                              style={{ ...styles.secondaryBtn, padding: "8px 12px" }}
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                          <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "block" }}>
                            💡 يمكنك تزويد شركة الشحن أو بوابة الدفع بهذا الرابط لتحديث حالة الطلب تلقائياً.
                          </span>
                        </div>
                      </>
                    )}

                    {/* إعدادات خاصة بشركات التوصيل */}
                    {editingProvider.type === "delivery" && (
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>سعر التوصيل الافتراضي (د.ل)</label>
                        <input
                          style={styles.input}
                          type="number"
                          placeholder="25"
                          value={editingProvider.flatRate}
                          onChange={(e) => setEditingProvider({ ...editingProvider, flatRate: e.target.value })}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setIsConfigModalOpen(false)}
                        style={styles.secondaryBtn}
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        style={styles.primaryBtn}
                      >
                        حفظ الإعدادات وتفعيل
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- تبويب: الطلبات ---- */}
        {activeTab === "orders" && (
          <>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>الطلبات ({orders.length})</h3>
            {ordersLoading ? (
              <p>جارٍ تحميل الطلبات...</p>
            ) : orders.length === 0 ? (
              <p style={{ color: "#888" }}>لا توجد طلبات حتى الآن</p>
            ) : (
              <div dir="rtl" style={styles.kanbanBoard}>
                {ORDER_STATUSES.map((status) => {
                  const statusOrders = orders.filter((o) => o.status === status);
                  return (
                    <div key={status} style={styles.kanbanColumn}>
                      <div style={styles.kanbanHeader}>
                        <span>{STATUS_LABELS[status]}</span>
                        <span style={styles.kanbanCount}>{statusOrders.length}</span>
                      </div>
                      <div style={styles.kanbanList}>
                        {statusOrders.length === 0 ? (
                          <p style={{ color: "#bbb", fontSize: 12, textAlign: "center", padding: 16 }}>
                            لا توجد طلبات
                          </p>
                        ) : (
                          statusOrders.map((o) => (
                            <div key={o.id} style={styles.orderCard}>
                              <div style={styles.orderHeadRow}>
                                <strong>#{o.id}</strong>
                                <span style={{ color: "#888", fontSize: 12 }}>
                                  {new Date(o.created_at).toLocaleDateString("ar-LY")}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, margin: "6px 0" }}>
                                {(o.items || []).map((it, i) => (
                                  <div key={i}>{it.title} × {it.qty}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: "bold" }}>
                                {o.total_price} د.ل — {o.payment_method}
                              </div>
                              <div style={{ fontSize: 12, marginTop: 6, padding: 6, background: "#f7f7f7", borderRadius: 6 }}>
                                <div>{o.customer_name || "غير مسجل"}</div>
                                <div>{o.customer_phone || "غير مسجل"}</div>
                              </div>
                              {o.tracking_number && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "4px 8px", borderRadius: 6, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span>🚚 تتبع: {o.tracking_number}</span>
                                  <a href={`https://track.sabil.ly/${o.tracking_number}`} target="_blank" rel="noreferrer" style={{ color: "#0284C7", textDecoration: "underline", fontSize: 10.5 }}>
                                    متابعة ↗
                                  </a>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDispatchToDelivery(o)}
                                style={{ ...styles.secondaryBtn, fontSize: 11, padding: "5px 8px", background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", width: "100%", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                              >
                                <Truck size={13} /> {o.tracking_number ? "تحديث الشحنة في درب السبيل" : "إرسال لشركة الشحن (درب السبيل) 🚚"}
                              </button>
                              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                <select
                                  value={o.status}
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                  style={{ ...styles.select, fontSize: 12, flex: 1 }}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                                {o.customer_phone && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const waInfo = buildStatusWhatsAppLink(o, o.status, settingsForm.store_name || "متجرنا");
                                      setWaNotifyModal({
                                        order: o,
                                        newStatus: o.status,
                                        message: waInfo.text,
                                        waLink: waInfo.url,
                                        phone: waInfo.phone,
                                      });
                                    }}
                                    style={{ ...styles.whatsappBtn, fontSize: 11, padding: "6px 8px", display: "inline-flex", alignItems: "center", gap: 3 }}
                                  >
                                    <MessageCircle size={13} /> إشعار
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: الفواتير (تم تحويله إلى صفوف جدول منظمة) ---- */}
        {activeTab === "invoices" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0B2027" }}>سجل الفواتير</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5B7278" }}>
                  عرض وإدارة وطباعة جميع فواتير المبيعات
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 700, background: "#DCFCE7", color: "#15803D", padding: "6px 14px", borderRadius: 999 }}>
                  المبيعات الصافية: {invoiceStats.validTotal.toLocaleString()} د.ل ({invoiceStats.validCount} فاتورة مؤكدة)
                </div>
                {invoiceStats.cancelledCount > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 700, background: "#FEE2E2", color: "#B91C1C", padding: "6px 12px", borderRadius: 999 }}>
                    الملغية: {invoiceStats.cancelledCount} ({invoiceStats.cancelledTotal.toLocaleString()} د.ل)
                  </div>
                )}
              </div>
            </div>

            {/* شريط البحث في الفواتير */}
            <div style={styles.searchBarWrapper}>
              <input
                style={styles.invoiceSearchInput}
                placeholder="🔍 ابحث برقم الفاتورة، اسم الزبون، أو رقم الهاتف..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
              {invoiceSearch && (
                <button
                  onClick={() => setInvoiceSearch("")}
                  style={styles.clearSearchBtn}
                >
                  مسح
                </button>
              )}
            </div>

            {ordersLoading ? (
              <p>جارٍ تحميل الفواتير...</p>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ ...styles.modernCard, textAlign: "center", padding: 32, color: "#888" }}>
                لا توجد فواتير مطابقة لعملية البحث
              </div>
            ) : (
              <div style={styles.modernCard}>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>رقم الفاتورة</th>
                        <th style={styles.th}>العميل</th>
                        <th style={styles.th}>رقم الهاتف</th>
                        <th style={styles.th}>المنتجات</th>
                        <th style={styles.th}>طريقة الدفع</th>
                        <th style={styles.th}>الإجمالي</th>
                        <th style={styles.th}>الحالة</th>
                        <th style={styles.th}>تاريخ الفاتورة</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((order) => (
                        <tr key={order.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 800, color: "#0E7C86" }}>
                            INV-{order.id}
                          </td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>
                            {order.customer_name || "زبون"}
                          </td>
                          <td style={{ ...styles.td, direction: "ltr", textAlign: "right" }}>
                            {order.customer_phone || "-"}
                          </td>
                          <td style={styles.td}>
                            <div style={{ maxWidth: 220, fontSize: 12, lineHeight: 1.4 }}>
                              {(order.items || []).map((it, idx) => (
                                <span key={idx} style={{ display: "block" }}>
                                  • {it.title} × {it.qty}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: order.payment_method === "كاش" ? "#F1F5F9" : "#FEF3C7", color: order.payment_method === "كاش" ? "#334155" : "#B45309" }}>
                              {order.payment_method || "كاش"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 800, fontSize: 14, color: "#0B2027" }}>
                            {order.total_price} د.ل
                          </td>
                          <td style={styles.td}>
                            <span style={styles.orderStatusPill(order.status)}>
                              {STATUS_LABELS[order.status] || order.status || "جديد"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 11.5, color: "#5B7278" }}>
                            <div>{new Date(order.created_at).toLocaleDateString("ar-LY")}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>
                              {new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button
                                onClick={() => printAdminInvoice(order, settingsForm.store_name)}
                                style={styles.printInvoiceRowBtn}
                              >
                                🧾 طباعة
                              </button>
                              <button
                                onClick={() => handleDispatchToDelivery(order)}
                                style={{
                                  ...styles.actionPillBtn,
                                  background: order.tracking_number ? "#E0F2FE" : "#F0FDF4",
                                  color: order.tracking_number ? "#0284C7" : "#15803D",
                                  border: `1px solid ${order.tracking_number ? "#BAE6FD" : "#BBF7D0"}`,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                                title="إرسال وتحديث الشحنة في درب السبيل"
                              >
                                <Truck size={12} /> {order.tracking_number ? order.tracking_number : "شحن"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- تبويب: العملاء ---- */}
        {activeTab === "customers" && (
          <>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>العملاء ({customers.length})</h3>
            {customers.length === 0 ? (
              <p style={{ color: "#888" }}>لا يوجد عملاء مسجّلون بعد</p>
            ) : (
              <div style={styles.kanbanBoard}>
                {CUSTOMER_TIERS.map((tier) => {
                  const list = customers.filter((c) => c.tier === tier);
                  return (
                    <div key={tier} style={styles.kanbanColumn}>
                      <div style={styles.kanbanHeader}>
                        <span>عملاء {tier}</span>
                        <span style={styles.kanbanCount}>{list.length}</span>
                      </div>
                      <div style={styles.kanbanList}>
                        {list.map((c) => (
                          <div key={c.phone} style={styles.orderCard}>
                            <strong>{c.name}</strong>
                            <div style={{ fontSize: 12, color: "#5B7278", marginTop: 2 }}>{c.phone}</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>{c.ordersCount} طلبات — {c.totalSpent} د.ل</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: المنتجات ---- */}
        {activeTab === "products" && (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
              <input
                style={styles.input}
                placeholder="اسم المنتج *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                style={{ ...styles.input, resize: "vertical" }}
                placeholder="وصف المنتج"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div style={styles.row}>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر البيع (د.ل) *"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر التكلفة (اختياري للربح)"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر المقارنة (قبل الخصم)"
                  value={form.compare_at}
                  onChange={(e) => setForm({ ...form, compare_at: e.target.value })}
                />
              </div>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  placeholder="التصنيف (مثال: إلكترونيات)"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="كود المنتج (SKU)"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="المخزون"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              {/* رفع الصور */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>صور المنتج</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <button type="submit" disabled={saving} style={styles.primaryBtn}>
                  {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة المنتج"}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} style={styles.secondaryBtn}>
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ margin: "20px 0 14px 0", fontSize: 18, fontWeight: 800 }}>المنتجات الحالية ({products.length})</h3>
            {loading ? (
              <p>جارٍ التحميل...</p>
            ) : (
              <div style={styles.kanbanBoard}>
                {categoryList.map((cat) => (
                  <div key={cat} style={styles.kanbanColumn}>
                    <div style={styles.kanbanHeader}>
                      <span>{cat}</span>
                      <span style={styles.kanbanCount}>{productsByCategory[cat].length}</span>
                    </div>
                    <div style={styles.kanbanList}>
                      {productsByCategory[cat].map((p) => {
                        const stockColor = p.stock === 0 ? "#c00" : p.stock <= 5 ? "#c98a00" : "#1c9963";
                        const stockLabel =
                          p.stock === 0 ? "نفد المخزون" : p.stock <= 5 ? `منخفض: ${p.stock} قطع` : `${p.stock} قطعة متوفرة`;
                        return (
                          <div key={p.id} style={styles.orderCard}>
                            {p.image && (
                              <img src={p.image} alt={p.title} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6 }} />
                            )}
                            <strong style={{ display: "block", marginTop: 6 }}>{p.title}</strong>
                            <div>{p.price} د.ل</div>
                            <div style={{ color: stockColor, fontWeight: "bold", fontSize: 12 }}>{stockLabel}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button onClick={() => startEdit(p)} style={{ ...styles.secondaryBtn, fontSize: 12, flex: 1 }}>
                                تعديل
                              </button>
                              {!isModerator && (
                                <button onClick={() => handleDelete(p.id)} style={{ ...styles.deleteBtn, fontSize: 12, flex: 1 }}>
                                  حذف
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: إدارة الفريق (Owner فقط) مع حل مشكلة البريد المكرر وعرض قائمة الأعضاء ---- */}
        {activeTab === "team" && isOwner && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>إدارة الفريق والصلاحيات</h3>

            <form onSubmit={handleAddMember} style={styles.form}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>إضافة أو تعديل صلاحية عضو</h4>
              <div style={styles.row}>
                <input
                  style={{ ...styles.input, flex: 2 }}
                  type="email"
                  placeholder="البريد الإلكتروني للعضو (مثال: aar06382@gmail.com)"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
                <select
                  style={{ ...styles.select, flex: 1 }}
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="admin">أدمن (كل الصلاحيات عدا إدارة الفريق)</option>
                  <option value="moderator">مشرف (إضافة وتعديل المنتجات فقط)</option>
                </select>
                <button type="submit" disabled={teamSaving} style={{ ...styles.primaryBtn, whiteSpace: "nowrap" }}>
                  {teamSaving ? "جارٍ الحفظ..." : "حفظ الصلاحية"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#5B7278", lineHeight: 1.6 }}>
                💡 <strong>ملاحظة:</strong> إذا كان البريد مسجلاً مسبقاً، سيتم تعديل رتبته وصلاحيته تلقائياً بدون أي تعارض. تأكد من تسجيل نفس البريد في Authentication بـ Supabase ليتمكن العضو من الدخول بكلمة مروره.
              </p>
            </form>

            <div style={styles.modernCard}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 800 }}>أعضاء الفريق الحاليون ({teamMembers.length})</h4>
              {teamMembers.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13 }}>لا يوجد أعضاء مسجلين بعد</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>البريد الإلكتروني</th>
                        <th style={styles.th}>الرتبة / الصلاحية</th>
                        <th style={styles.th}>تاريخ الإضافة</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m) => {
                        const isMemberOwner = m.role === "owner";
                        const roleLabel = isMemberOwner ? "مالك المتجر (Owner)" : m.role === "admin" ? "أدمن (Admin)" : "مشرف (Moderator)";
                        const roleBg = isMemberOwner ? "#FEF3C7" : m.role === "admin" ? "#E0F2FE" : "#F1F5F9";
                        const roleColor = isMemberOwner ? "#D97706" : m.role === "admin" ? "#0284C7" : "#475569";
                        return (
                          <tr key={m.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: 700 }}>{m.email}</td>
                            <td style={styles.td}>
                              <span style={{ padding: "4px 10px", borderRadius: 999, background: roleBg, color: roleColor, fontSize: 11.5, fontWeight: 800 }}>
                                {roleLabel}
                              </span>
                            </td>
                            <td style={{ ...styles.td, fontSize: 12, color: "#5B7278" }}>
                              {m.created_at ? new Date(m.created_at).toLocaleDateString("ar-LY") : "-"}
                            </td>
                            <td style={styles.td}>
                              {!isMemberOwner ? (
                                <button
                                  onClick={() => handleRemoveMember(m.id, m.role)}
                                  style={{ ...styles.deleteBtn, padding: "5px 12px", borderRadius: 999 }}
                                >
                                  إزالة العضو
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: "#94A3B8" }}>المالك الأساسي</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- تبويب: إعدادات الدخول (Owner فقط) ---- */}
        {activeTab === "credentials" && isOwner && (
          <form onSubmit={handleUpdateCredentials} style={styles.form}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>إعدادات الدخول</h3>
            <input
              style={styles.input}
              type="email"
              placeholder="بريد إلكتروني جديد (اتركه فارغ لعدم التغيير)"
              value={newLoginEmail}
              onChange={(e) => setNewLoginEmail(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="كلمة مرور جديدة (اتركها فارغة لعدم التغيير)"
              value={newLoginPassword}
              onChange={(e) => setNewLoginPassword(e.target.value)}
            />
            <button type="submit" disabled={credsSaving} style={styles.primaryBtn}>
              {credsSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </button>
            {credsMessage && (
              <span style={{ color: credsMessage.startsWith("خطأ") ? "#c00" : "#1c9963", fontWeight: 700 }}>
                {credsMessage}
              </span>
            )}
          </form>
        )}

        {/* ---- نافذة الإشعار التلقائي للواتساب (WhatsApp Automation Modal) ---- */}
        {waNotifyModal && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalDialog, maxWidth: 520 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0B2027" }}>
                      إشعار واتساب التلقائي 💬
                    </h3>
                    <span style={{ fontSize: 12, color: "#5B7278" }}>
                      طلب #{waNotifyModal.order.id} — الحالة: <strong>{waNotifyModal.newStatus}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWaNotifyModal(null)}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: "0 0 10px 0", fontSize: 12.5, color: "#475569" }}>
                تم توليد نص الإشعار المخصص للزبون (<strong>{waNotifyModal.order.customer_name}</strong>) برقم: <code style={{ direction: "ltr", display: "inline-block" }}>{waNotifyModal.phone}</code>:
              </p>

              <textarea
                style={{
                  ...styles.input,
                  minHeight: 140,
                  fontSize: 13,
                  lineHeight: 1.6,
                  background: "#F8FAFC",
                  resize: "vertical",
                  marginBottom: 14,
                  padding: 12,
                }}
                value={waNotifyModal.message}
                onChange={(e) => {
                  const newMsg = e.target.value;
                  setWaNotifyModal((p) => ({
                    ...p,
                    message: newMsg,
                    waLink: `https://wa.me/${p.phone}?text=${encodeURIComponent(newMsg)}`,
                  }));
                }}
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(waNotifyModal.message);
                    alert("تم نسخ نص الرسالة بنجاح 📋");
                  }}
                  style={{ ...styles.secondaryBtn, display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Copy size={14} /> نسخ النص
                </button>
                <button
                  type="button"
                  onClick={() => setWaNotifyModal(null)}
                  style={styles.secondaryBtn}
                >
                  إغلاق
                </button>
                <a
                  href={waNotifyModal.waLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setWaNotifyModal(null)}
                  style={{
                    ...styles.primaryBtn,
                    background: "#25D366",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  <MessageCircle size={16} /> إرسال عبر واتساب الآن
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Tajawal', Arial, sans-serif" },
  menuToggle: {
    display: "none",
    position: "fixed",
    top: 12,
    right: 12,
    zIndex: 1001,
    width: 42,
    height: 42,
    background: "#0B2027",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 20,
    cursor: "pointer",
  },
  overlay: {
    display: "none",
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  sidebar: {
    width: 220,
    background: "#0B2027",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 20,
    gap: 6,
    flexShrink: 0,
  },
  tabBtn: {
    padding: "11px 14px",
    background: "transparent",
    color: "#94A3B8",
    border: "none",
    borderRadius: 10,
    textAlign: "right",
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 700,
    transition: "all .15s ease",
  },
  tabBtnActive: { background: "#0E7C86", color: "#fff", fontWeight: 800 },
  page: { flex: 1, padding: "24px 32px", maxWidth: 1280, margin: "0 auto", width: "100%" },
  dashHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  timeFilterGroup: { display: "flex", background: "#E2E8F0", padding: 4, borderRadius: 999, gap: 4 },
  timeFilterBtn: { padding: "6px 14px", borderRadius: 999, border: "none", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  timeFilterBtnActive: { background: "#fff", color: "#0B2027", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" },
  metricCardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 },
  modernCard: { background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  metricIconBox: (bg, color) => ({ width: 38, height: 38, borderRadius: 10, background: bg, color: color, display: "flex", alignItems: "center", justifyContent: "center" }),
  trendBadge: (bg, color) => ({ padding: "3px 8px", borderRadius: 999, background: bg, color: color, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }),
  analyticsRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  topProductItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" },
  rankBadge: { width: 22, height: 22, borderRadius: "50%", background: "#F1F5F9", color: "#475569", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  topProductThumb: { width: 38, height: 38, borderRadius: 8, objectFit: "cover" },
  searchBarWrapper: { display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 460 },
  invoiceSearchInput: { flex: 1, padding: "10px 16px", borderRadius: 999, border: "1px solid #CBD5E1", background: "#fff", outline: "none", fontSize: 13, fontFamily: "inherit" },
  clearSearchBtn: { padding: "8px 16px", borderRadius: 999, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "right" },
  th: { padding: "12px 14px", borderBottom: "1.5px solid #E2E8F0", fontSize: 12.5, fontWeight: 800, color: "#475569", background: "#F8FAFC" },
  tr: { borderBottom: "1px solid #F1F5F9", transition: "background .15s ease" },
  td: { padding: "14px", fontSize: 13 },
  orderStatusPill: (status) => {
    const isCompleted = status === "تم التسليم";
    const isShipped = status === "تم الشحن" || status === "قيد التجهيز";
    const isCancelled = status === "ملغي";
    const bg = isCompleted ? "#DCFCE7" : isShipped ? "#E0F2FE" : isCancelled ? "#FEE2E2" : "#FEF3C7";
    const color = isCompleted ? "#16A34A" : isShipped ? "#0284C7" : isCancelled ? "#DC2626" : "#D97706";
    return { padding: "4px 10px", borderRadius: 999, background: bg, color: color, fontSize: 11, fontWeight: 800, display: "inline-block" };
  },
  actionPillBtn: { padding: "5px 12px", borderRadius: 999, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#0B2027", fontSize: 11.5, fontWeight: 700, cursor: "pointer" },
  printInvoiceRowBtn: { padding: "6px 14px", borderRadius: 999, background: "#0E7C86", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, transition: "opacity .15s" },
  kanbanBoard: { display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 },
  kanbanColumn: { minWidth: 250, background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0", padding: 12, display: "flex", flexDirection: "column", maxHeight: "75vh" },
  kanbanHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, paddingBottom: 8, marginBottom: 8, borderBottom: "2px solid #E2E8F0" },
  kanbanCount: { background: "#0E7C86", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11 },
  kanbanList: { display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
  orderCard: { background: "#fff", border: "1px solid #E2E8F0", padding: 12, borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" },
  orderHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  form: { display: "flex", flexDirection: "column", gap: 14, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", width: "100%", fontFamily: "inherit", fontSize: 13, outline: "none" },
  select: { padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontFamily: "inherit", fontSize: 13, outline: "none", background: "#fff" },
  primaryBtn: { padding: "11px 20px", background: "#0E7C86", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13.5 },
  secondaryBtn: { padding: "8px 14px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 },
  whatsappBtn: { padding: "8px 12px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 },
  deleteBtn: { padding: "8px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 },
  logoutBtn: { padding: "10px 14px", background: "#1E293B", color: "#F87171", border: "none", borderRadius: 10, cursor: "pointer", marginTop: "auto", fontWeight: 700 },
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#F8FAFC" },
  loginBox: { display: "flex", flexDirection: "column", gap: 12, width: 300, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  integrationCard: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    transition: "transform .15s ease, box-shadow .15s ease",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 32, 39, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 16,
  },
  modalDialog: {
    background: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 620,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 24,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
};