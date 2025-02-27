import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export function PermissionManager() {
  const [permissions, setPermissions] = useState({
    users: false,
    roles: false,
    appointments: false,
    reports: false,
  });

  const handlePermissionChange = (permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Permissions</h2>
        <p className="text-muted-foreground">
          Configurez les permissions du système
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions disponibles</CardTitle>
          <CardDescription>
            Activez ou désactivez les permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="font-medium">Gestion des utilisateurs</div>
            <Switch
              checked={permissions.users}
              onCheckedChange={() => handlePermissionChange('users')}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="font-medium">Gestion des rôles</div>
            <Switch
              checked={permissions.roles}
              onCheckedChange={() => handlePermissionChange('roles')}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="font-medium">Gestion des rendez-vous</div>
            <Switch
              checked={permissions.appointments}
              onCheckedChange={() => handlePermissionChange('appointments')}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="font-medium">Accès aux rapports</div>
            <Switch
              checked={permissions.reports}
              onCheckedChange={() => handlePermissionChange('reports')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}