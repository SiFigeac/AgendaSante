import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserForm } from "@/components/admin/user-form";
import { AvailabilityManager } from "@/components/admin/availability-manager";
import { DoctorsSchedule } from "@/components/admin/doctors-schedule";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);

  // Rediriger si l'utilisateur n'est pas admin
  if (!currentUser?.isAdmin) {
    return <div>Accès non autorisé</div>;
  }

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${userId}`,
        { isAdmin }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Succès",
        description: "Droits d'administrateur mis à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom d'utilisateur</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>
                        <Badge>
                          {user.role === "doctor" ? "Médecin" : 
                           user.role === "staff" ? "Personnel" : "Administrateur"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.isAdmin}
                          onCheckedChange={(checked) =>
                            toggleAdmin.mutate({ userId: user.id, isAdmin: checked })
                          }
                          disabled={user.id === currentUser?.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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