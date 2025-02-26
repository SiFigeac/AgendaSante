import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserForm } from "@/components/admin/user-form";
import { UserList } from "@/components/admin/user-list";
import { AvailabilityManager } from "@/components/admin/availability-manager";
import { DoctorsSchedule } from "@/components/admin/doctors-schedule";
import { RoleManager } from "@/components/admin/role-manager";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [showAddUser, setShowAddUser] = useState(false);

  // Rediriger si l'utilisateur n'est pas admin
  if (!currentUser?.isAdmin) {
    return <div>Accès non autorisé</div>;
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Administration</h1>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Gestion des utilisateurs</TabsTrigger>
            <TabsTrigger value="roles">Gestion des rôles</TabsTrigger>
            <TabsTrigger value="availability">Plages horaires</TabsTrigger>
            <TabsTrigger value="schedule">Planning des médecins</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddUser(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </div>

            <UserList />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManager />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManager />
          </TabsContent>

          <TabsContent value="schedule">
            <DoctorsSchedule />
          </TabsContent>
        </Tabs>

        <UserForm
          open={showAddUser}
          onOpenChange={setShowAddUser}
        />
      </main>
    </div>
  );
}