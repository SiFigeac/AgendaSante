import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { RoleForm } from "./role-form";

export function RoleManager() {
  const [showAddRole, setShowAddRole] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rôles</h2>
          <p className="text-muted-foreground">
            Créez et gérez les rôles pour les utilisateurs
          </p>
        </div>
        <Button onClick={() => setShowAddRole(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rôle
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rôles existants</CardTitle>
            <CardDescription>
              Liste des rôles disponibles dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              La liste des rôles s'affichera ici
            </div>
          </CardContent>
        </Card>
      </div>

      <RoleForm 
        open={showAddRole}
        onOpenChange={setShowAddRole}
      />
    </div>
  );
}
