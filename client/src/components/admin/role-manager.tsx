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
import { useRoleStore } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

export function RoleManager() {
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ReturnType<typeof useRoleStore.getState>["roles"][0] | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<ReturnType<typeof useRoleStore.getState>["roles"][0] | null>(null);
  const { toast } = useToast();
  const { roles, deleteRole } = useRoleStore();

  const handleEditRole = (role: typeof roles[0]) => {
    setSelectedRole(role);
    setShowRoleForm(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleForm(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      deleteRole(roleToDelete.name);
      toast({
        title: "Succès",
        description: `Le rôle ${roleToDelete.displayName} a été supprimé.`,
      });
      setRoleToDelete(null);
    }
  };

  // ... rest of the component
}