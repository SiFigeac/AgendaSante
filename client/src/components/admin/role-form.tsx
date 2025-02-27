import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRoleStore, type Role } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

export function RoleForm({ open, onOpenChange, role }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRole, updateRole } = useRoleStore();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      users: role?.permissions?.includes("users") || false,
      roles: role?.permissions?.includes("roles") || false,
      appointments: role?.permissions?.includes("appointments") || false,
      reports: role?.permissions?.includes("reports") || false,
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Convertir les switches en tableau de permissions
      const permissions = [];
      if (data.users) permissions.push("users");
      if (data.roles) permissions.push("roles");
      if (data.appointments) permissions.push("appointments");
      if (data.reports) permissions.push("reports");

      const roleData = {
        description: data.description,
        permissions,
      };

      if (role) {
        // Mise à jour d'un rôle existant
        if (data.name && data.name !== role.name) {
          roleData['name'] = data.name;
        }
        updateRole(role.name, roleData);
      } else {
        // Création d'un nouveau rôle
        if (!data.name) {
          throw new Error("Le nom est requis pour créer un rôle");
        }
        addRole({
          name: data.name,
          displayName: data.name,
          description: data.description,
          permissions,
          color: null,
        });
      }

      toast({
        title: "Succès",
        description: role ? "Rôle mis à jour avec succès" : "Rôle créé avec succès",
      });

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {role ? `Modifier le rôle : ${role.displayName}` : 'Nouveau rôle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(!role || role.name !== 'admin') && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nom du rôle
                      {role && <span className="text-sm text-muted-foreground ml-2">(optionnel)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: responsable" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Description du rôle" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h4 className="font-medium">Permissions</h4>

              <FormField
                control={form.control}
                name="users"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Gestion des utilisateurs</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Gestion des rôles</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Gestion des rendez-vous</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Accès aux rapports</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {role ? 'Mettre à jour le rôle' : 'Créer le rôle'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}