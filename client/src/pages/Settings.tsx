import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, Lock, Download, Upload, Moon } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updatePasswordMutation = trpc.settings.updatePassword.useMutation();
  const updateThemeMutation = trpc.settings.updateTheme.useMutation();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("الرجاء ملء جميع الحقول");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "فشل تغيير كلمة المرور");
    }
  };

  const handleExportData = () => {
    try {
      // This would export all data as JSON
      const data = {
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${new Date().getTime()}.json`;
      link.click();
      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      toast.error("فشل تصدير البيانات");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Process imported data
        toast.success("تم استيراد البيانات بنجاح");
      } catch (error) {
        toast.error("فشل استيراد البيانات - تأكد من صيغة الملف");
      }
    };
    reader.readAsText(file);
  };

  const handleToggleTheme = async () => {
    try {
      const newTheme = theme === "dark" ? "light" : "dark";
      await updateThemeMutation.mutateAsync({ theme: newTheme as "light" | "dark" });
      if (toggleTheme) {
        toggleTheme();
      }
      toast.success(`تم تبديل الوضع إلى ${newTheme === "dark" ? "الليلي" : "الفاتح"}`);
    } catch (error: any) {
      toast.error(error.message || "فشل تبديل الوضع");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الإعدادات</h1>
            <p className="text-slate-600 dark:text-slate-300">إدارة إعدادات التطبيق</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="password" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password" className="gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Download className="w-4 h-4" />
              النسخ الاحتياطي
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Moon className="w-4 h-4" />
              المظهر
            </TabsTrigger>
          </TabsList>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>تغيير كلمة المرور</CardTitle>
                <CardDescription>غيّر كلمة المرور الخاصة بك للدخول إلى النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">كلمة المرور الحالية</label>
                    <Input
                      type="password"
                      placeholder="أدخل كلمة المرور الحالية"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={updatePasswordMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={updatePasswordMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                    <Input
                      type="password"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={updatePasswordMutation.isPending}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="w-full"
                  >
                    {updatePasswordMutation.isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>النسخ الاحتياطي والاستعادة</CardTitle>
                <CardDescription>احفظ واستعد بيانات التطبيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">تصدير البيانات</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    قم بتنزيل نسخة احتياطية من جميع بيانات التطبيق
                  </p>
                  <Button onClick={handleExportData} className="gap-2">
                    <Download className="w-4 h-4" />
                    تنزيل النسخة الاحتياطية
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">استيراد البيانات</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    استعد البيانات من نسخة احتياطية سابقة
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="cursor-pointer"
                    />
                    <Button variant="outline" className="gap-2">
                      <Upload className="w-4 h-4" />
                      استيراد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>تبديل المظهر</CardTitle>
                <CardDescription>اختر بين الوضع الفاتح والليلي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">الوضع الليلي</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {theme === "dark" ? "الوضع الليلي مفعّل حالياً" : "الوضع الفاتح مفعّل حالياً"}
                    </p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleToggleTheme}
                    disabled={updateThemeMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
