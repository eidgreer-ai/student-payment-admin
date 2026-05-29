import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocalAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Lock } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useLocalAuth();
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("الرجاء إدخال كلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      // Verify password with backend
      await loginMutation.mutateAsync({ password });
      
      // If verification succeeds, update local auth state
      await login(password);
      
      toast.success("تم تسجيل الدخول بنجاح");
      
      // Navigate to dashboard
      setTimeout(() => {
        setLocation("/");
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل الدخول - كلمة المرور غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">تطبيق إدارة الطلاب</CardTitle>
          <CardDescription>أدخل كلمة المرور للدخول إلى النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                كلمة المرور
              </label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
