import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, ChevronLeft } from "lucide-react";

export default function Groups() {
  const [, setLocation] = useLocation();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const groupsQuery = trpc.groups.list.useQuery();
  const createGroupMutation = trpc.groups.create.useMutation();
  const updateGroupMutation = trpc.groups.update.useMutation();
  const deleteGroupMutation = trpc.groups.delete.useMutation();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("الرجاء إدخال اسم المجموعة");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: newGroupName,
        description: newGroupDesc,
      });
      toast.success("تم إنشاء المجموعة بنجاح");
      setNewGroupName("");
      setNewGroupDesc("");
      setIsDialogOpen(false);
      groupsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إنشاء المجموعة");
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;

    try {
      await deleteGroupMutation.mutateAsync({ id });
      toast.success("تم حذف المجموعة بنجاح");
      groupsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف المجموعة");
    }
  };

  if (groupsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">المجموعات</h1>
              <p className="text-slate-600 dark:text-slate-300">إدارة مجموعات الطلاب</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة مجموعة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
                <DialogDescription>أدخل بيانات المجموعة الجديدة</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">اسم المجموعة</label>
                  <Input
                    placeholder="مثال: المجموعة الأولى"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الوصف (اختياري)</label>
                  <Input
                    placeholder="وصف المجموعة"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending}
                  className="w-full"
                >
                  {createGroupMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupsQuery.data?.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setLocation(`/groups/${group.id}`)}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-blue-600 transition-colors">{group.name}</CardTitle>
                <CardDescription>{group.description || "بدون وصف"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950"
                >
                  عرض الطلاب
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groupsQuery.data?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-300 mb-4">لا توجد مجموعات حتى الآن</p>
            <Button onClick={() => setIsDialogOpen(true)}>إنشاء مجموعة أولى</Button>
          </div>
        )}
      </div>
    </div>
  );
}
