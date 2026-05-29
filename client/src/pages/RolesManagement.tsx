import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ChevronLeft, Shield, Users, Briefcase, BookOpen } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "accountant" | "teacher";
  createdAt: Date;
}

const ROLES = [
  {
    id: "admin",
    name: "مسؤول",
    description: "صلاحيات كاملة للتطبيق",
    icon: Shield,
    color: "bg-red-500",
    permissions: ["إدارة المجموعات", "إدارة الطلاب", "إدارة المدفوعات", "إدارة الأدوار", "الإعدادات"],
  },
  {
    id: "accountant",
    name: "محاسب",
    description: "إدارة المدفوعات والحسابات",
    icon: Briefcase,
    color: "bg-blue-500",
    permissions: ["عرض المجموعات", "عرض الطلاب", "إدارة المدفوعات", "عرض التقارير"],
  },
  {
    id: "teacher",
    name: "معلم",
    description: "عرض البيانات فقط",
    icon: BookOpen,
    color: "bg-green-500",
    permissions: ["عرض المجموعات", "عرض الطلاب", "عرض المدفوعات"],
  },
];

export default function RolesManagement() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "المسؤول",
      email: "admin@school.com",
      role: "admin",
      createdAt: new Date(),
    },
  ]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "accountant" | "teacher">("teacher");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("الرجاء ملء جميع الحقول");
      return;
    }

    if (!newUserEmail.includes("@")) {
      toast.error("البريد الإلكتروني غير صحيح");
      return;
    }

    setIsAdding(true);
    try {
      const newUser: User = {
        id: users.length + 1,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        createdAt: new Date(),
      };

      setUsers([...users, newUser]);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("teacher");
      toast.success("تم إضافة المستخدم بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة المستخدم");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = (id: number) => {
    if (id === 1) {
      toast.error("لا يمكن حذف المسؤول");
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
    toast.success("تم حذف المستخدم بنجاح");
  };

  const handleChangeRole = (id: number, newRole: "admin" | "accountant" | "teacher") => {
    if (id === 1) {
      toast.error("لا يمكن تغيير دور المسؤول");
      return;
    }
    setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    toast.success("تم تحديث الدور بنجاح");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">إدارة الأدوار والصلاحيات</h1>
            <p className="text-slate-600 dark:text-slate-300">إدارة أدوار المستخدمين والصلاحيات</p>
          </div>
        </div>

        {/* Roles Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">الأدوار المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${role.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle>{role.name}</CardTitle>
                    </div>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">الصلاحيات:</p>
                      <ul className="text-sm space-y-1">
                        {role.permissions.map((perm) => (
                          <li key={perm} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                            {perm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Add New User */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إضافة مستخدم جديد</CardTitle>
            <CardDescription>أضف مستخدماً جديداً وحدد دوره</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="اسم المستخدم"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                disabled={isAdding}
              />
              <Input
                placeholder="البريد الإلكتروني"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isAdding}
              />
              <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)} disabled={isAdding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مسؤول</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUser} disabled={isAdding} className="w-full">
              {isAdding ? <Spinner className="w-4 h-4 mr-2" /> : null}
              إضافة المستخدم
            </Button>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              المستخدمون ({users.length})
            </CardTitle>
            <CardDescription>قائمة المستخدمين وأدوارهم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => {
                const role = ROLES.find((r) => r.id === user.role);
                const Icon = role?.icon;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${role?.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        {Icon && <Icon className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value: any) => handleChangeRole(user.id, value)}
                        disabled={user.id === 1}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مسؤول</SelectItem>
                          <SelectItem value="accountant">محاسب</SelectItem>
                          <SelectItem value="teacher">معلم</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.id !== 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
