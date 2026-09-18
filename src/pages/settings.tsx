import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { toast } from "sonner";
import { Store, Users, Globe, Shield, User, RotateCcw, Bell, FileText } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";

export function SettingsPage() {
  const auth = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const [storeName, setStoreName] = useState(auth.workspace?.storeName ?? services.getStoreName());
  const [storeEmail, setStoreEmail] = useState(auth.user?.email ?? "demo@novastore.sa");
  const [defaultWindow, setDefaultWindow] = useState("14");
  const [autoApproveEligible, setAutoApproveEligible] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [notifyNewCase, setNotifyNewCase] = useState(true);
  const [notifyManualReview, setNotifyManualReview] = useState(true);
  const [notifyResolved, setNotifyResolved] = useState(false);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  const handleSaveStore = async () => {
    if (auth.user && auth.workspace && supabase) {
      const { error } = await supabase.from("stores").update({ name: storeName.trim() }).eq("id", auth.workspace.storeId);
      if (error) return toast.error(error.message);
      await auth.refreshWorkspace();
    } else {
      services.setStoreName(storeName);
    }
    toast.success(t("Store settings saved", "تم حفظ إعدادات المتجر"));
  };

  const handleSavePolicyDefaults = () => {
    toast.success(t("Return policy defaults saved", "تم حفظ الإعدادات الافتراضية لسياسة الإرجاع"));
  };

  const handleSaveNotifications = () => {
    toast.success(t("Notification preferences saved", "تم حفظ تفضيلات الإشعارات"));
  };

  const handleReset = () => {
    services.resetDemo();
    toast.success(t("Demo data reset", "تمت إعادة ضبط البيانات التجريبية"));
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{t("Settings", "الإعدادات")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("Manage your store and workspace configuration.", "إدارة إعدادات المتجر ومساحة العمل.")}</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="mb-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-primary" />
          <span>{auth.user ? t(`Signed in as ${auth.user.email}. Store access is scoped by membership.`, `تم تسجيل الدخول باسم ${auth.user.email}. الوصول مقيد بعضوية المتجر.`) : t("You're editing a simulated demo workspace. Changes stay in this browser.", "أنت تعدّل مساحة عمل تجريبية. تُحفظ التغييرات في هذا المتصفح فقط.")}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Store profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Store profile", "ملف المتجر")}</CardTitle>
              </div>
              <CardDescription>{t("Your store identity and contact details.", "هوية المتجر وبيانات التواصل.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-name">{t("Store name", "اسم المتجر")}</Label>
                  <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-email">{t("Contact email", "بريد التواصل")}</Label>
                  <Input id="store-email" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleSaveStore} className="self-start">{t("Save changes", "حفظ التغييرات")}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Return policy defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Return policy defaults", "إعدادات سياسة الإرجاع")}</CardTitle>
              </div>
              <CardDescription>{t("Default settings applied to new return requests.", "الإعدادات الافتراضية لطلبات الإرجاع الجديدة.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="default-window">{t("Default return window (days)", "مدة الإرجاع الافتراضية (بالأيام)")}</Label>
                  <Input id="default-window" type="number" value={defaultWindow} onChange={(e) => setDefaultWindow(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Auto-approve eligible cases", "اعتماد الحالات المؤهلة تلقائيًا")}</div>
                    <div className="text-xs text-muted-foreground">{t("Skip manual review for eligible returns", "تجاوز المراجعة البشرية للحالات المؤهلة")}</div>
                  </div>
                  <Switch checked={autoApproveEligible} onCheckedChange={setAutoApproveEligible} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Require customer photo", "طلب صورة من العميل")}</div>
                    <div className="text-xs text-muted-foreground">{t("Ask for a photo on defective claims", "طلب صورة عند الإبلاغ عن منتج معيب")}</div>
                  </div>
                  <Switch checked={requirePhoto} onCheckedChange={setRequirePhoto} />
                </div>
                <Button size="sm" onClick={handleSavePolicyDefaults} className="self-start">{t("Save defaults", "حفظ الإعدادات")}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Team access */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Team access", "صلاحيات الفريق")}</CardTitle>
              </div>
              <CardDescription>{t("Manage team members and roles.", "إدارة أعضاء الفريق وأدوارهم.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{auth.user?.email ?? "demo@novastore.sa"}</div>
                    <div className="text-xs text-muted-foreground">{auth.workspace?.role ?? "Owner"}</div>
                  </div>
                  <span className="rounded-full bg-eligible-muted px-2 py-0.5 text-[11px] font-medium text-eligible">{t("Active", "نشط")}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("Team invitations will be available in a future release.", "ستتوفر دعوات الفريق في إصدار لاحق.")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Notifications", "الإشعارات")}</CardTitle>
              </div>
              <CardDescription>{t("Choose what you want to be notified about.", "اختر الإشعارات التي تريد استلامها.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("New case created", "إنشاء حالة جديدة")}</div>
                    <div className="text-xs text-muted-foreground">{t("When a customer submits a return", "عند إرسال العميل طلب إرجاع")}</div>
                  </div>
                  <Switch checked={notifyNewCase} onCheckedChange={setNotifyNewCase} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Manual review needed", "الحالة تتطلب مراجعة بشرية")}</div>
                    <div className="text-xs text-muted-foreground">{t("When a case needs your attention", "عندما تحتاج حالة إلى تدخلك")}</div>
                  </div>
                  <Switch checked={notifyManualReview} onCheckedChange={setNotifyManualReview} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Case resolved", "إغلاق الحالة")}</div>
                    <div className="text-xs text-muted-foreground">{t("When a case reaches resolved status", "عند إغلاق الحالة")}</div>
                  </div>
                  <Switch checked={notifyResolved} onCheckedChange={setNotifyResolved} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Weekly digest", "الملخص الأسبوعي")}</div>
                    <div className="text-xs text-muted-foreground">{t("Summary of returns activity each week", "ملخص أسبوعي لنشاط المرتجعات")}</div>
                  </div>
                  <Switch checked={notifyWeeklyDigest} onCheckedChange={setNotifyWeeklyDigest} />
                </div>
                <Button size="sm" onClick={handleSaveNotifications} className="self-start">{t("Save preferences", "حفظ التفضيلات")}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Language", "اللغة")}</CardTitle>
              </div>
              <CardDescription>{t("Display language for your workspace.", "لغة عرض مساحة العمل.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "ar")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("Language preference is saved on this device.", "يُحفظ اختيار اللغة على هذا الجهاز.")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Security", "الأمان")}</CardTitle>
              </div>
              <CardDescription>{t("Authentication and access control.", "تسجيل الدخول والتحكم في الوصول.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("Two-factor authentication", "المصادقة الثنائية")}</div>
                    <div className="text-xs text-muted-foreground">{t("Available in production rollout", "ستتوفر عند الإطلاق الفعلي")}</div>
                  </div>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t("API rate limiting", "تحديد معدل طلبات الواجهة البرمجية")}</div>
                    <div className="text-xs text-muted-foreground">{t("Available in production rollout", "ستتوفر عند الإطلاق الفعلي")}</div>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t("Account", "الحساب")}</CardTitle>
              </div>
              <CardDescription>{auth.user ? t("Your authenticated workspace account.", "حساب مساحة العمل المسجل.") : t("Your account and demo data.", "حسابك وبيانات التجربة.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">
                  {auth.user ? t(`Signed in as ${auth.user.email}.`, `تم تسجيل الدخول باسم ${auth.user.email}.`) : t("You're using a demo workspace. All data is stored locally in your browser.", "أنت تستخدم مساحة عمل تجريبية. تُحفظ البيانات في متصفحك فقط.")}
                </div>
                {auth.demoMode && !auth.user && (
                  <Button variant="outline" size="sm" onClick={handleReset} className="self-start text-destructive hover:text-destructive">
                    <RotateCcw className="size-3.5" />
                    {t("Reset demo data", "إعادة ضبط بيانات التجربة")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>
    </div>
  );
}
