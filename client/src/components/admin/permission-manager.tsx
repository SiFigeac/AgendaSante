import { usePermissionStore } from "@/lib/permissions";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export function PermissionManager() {
  const { permissions, togglePermission } = usePermissionStore();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Gestion des permissions</h2>
        <p className="text-muted-foreground">
          Configurez les permissions système
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
          {permissions.map((permission) => (
            <div
              key={permission.name}
              className="flex items-center justify-between space-x-4 py-4"
            >
              <div>
                <div className="font-medium">{permission.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {permission.description}
                </div>
              </div>
              <Switch
                checked={permission.enabled}
                onCheckedChange={() => togglePermission(permission.name)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
