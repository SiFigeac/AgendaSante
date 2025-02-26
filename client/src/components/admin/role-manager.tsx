import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { RoleForm } from "./role-form";
import { PREDEFINED_ROLES } from "@/lib/roles";

export function RoleManager() {
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<(typeof PREDEFINED_ROLES)[0] | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<(typeof PREDEFINED_ROLES)[0] | null>(null);

  const handleEditRole = (role: typeof PREDEFINED_ROLES[0]) => {
    setSelectedRole(role);
    setShowRoleForm(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleForm(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      // TODO: Implement role deletion API
      console.log("Deleting role:", roleToDelete);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rôles</h2>
          <p className="text-muted-foreground">
            Créez et gérez les rôles pour les utilisateurs
          </p>
        </div>
        <Button onClick={handleAddRole}>
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
            <div className="space-y-4">
              {PREDEFINED_ROLES.map((role) => (
                <div 
                  key={role.name}
                  className="flex items-start justify-between p-4 rounded-lg border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {role.displayName}
                      </h3>
                      <Badge variant="secondary" className="capitalize">
                        {role.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifier le rôle</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRoleToDelete(role)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Supprimer le rôle</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <RoleForm 
        open={showRoleForm}
        onOpenChange={setShowRoleForm}
        role={selectedRole}
      />

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le rôle "{roleToDelete?.displayName}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}