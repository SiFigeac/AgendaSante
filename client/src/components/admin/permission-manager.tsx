import { useState } from "react";
import { PERMISSION_LABELS, usePermissionStore, type Permission } from "@/lib/permissions";
import { useRoleStore } from "@/lib/roles";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PermissionManager() {
  const { roles } = useRoleStore();
  const { rolePermissions, setRolePermissions } = usePermissionStore();
  const [selectedRole, setSelectedRole] = useState(roles[0]?.name || "");

  const handlePermissionChange = (permission: Permission) => {
    if (!selectedRole) return;

    const currentPermissions = rolePermissions[selectedRole] || [];
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    setRolePermissions(selectedRole, newPermissions);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Permissions</h2>
        <p className="text-muted-foreground">
          Configurez les permissions pour chaque rôle
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des permissions</CardTitle>
          <CardDescription>
            Sélectionnez un rôle et configurez ses permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionner un rôle</label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="space-y-4">
              {(Object.entries(PERMISSION_LABELS) as [Permission, string][]).map(([permission, label]) => (
                <div
                  key={permission}
                  className="flex items-center justify-between py-2"
                >
                  <div className="font-medium">
                    {label}
                  </div>
                  <Switch
                    checked={rolePermissions[selectedRole]?.includes(permission)}
                    onCheckedChange={() => handlePermissionChange(permission)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}