import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRoleStore } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

const createRoleSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string(),
  permissions: z.object({
    canManageUsers: z.boolean(),
    canManageRoles: z.boolean(),
    canManageAppointments: z.boolean(),
    canViewReports: z.boolean(),
  }),
});

const updateRoleSchema = createRoleSchema.extend({
  name: z.string().optional(),
});

type RoleFormData = z.infer<typeof createRoleSchema>;

interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: {
    name: string;
    description: string;
  } | null;
}

export function RoleForm({ open, onOpenChange, role }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateRole } = useRoleStore();
  const { toast } = useToast();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(role ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: {
        canManageUsers: false,
        canManageRoles: false,
        canManageAppointments: false,
        canViewReports: false,
      },
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      if (role) {
        // Mise à jour d'un rôle existant
        updateRole(role.name, {
          name: data.name || role.name,
          description: data.description,
          permissions: data.permissions
        });
        toast({
          title: "Succès",
          description: "Le rôle a été mis à jour avec succès.",
        });
      } else {
        // TODO: Implement role creation
        console.log("Creating new role:", data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du rôle.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {role ? `Modifier le rôle : ${role.name}` : 'Nouveau rôle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Nom du rôle
                    {role && <span className="text-sm text-muted-foreground">(optionnel)</span>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={role ? role.name : "Ex: admin"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Décrivez les responsabilités de ce rôle"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="font-medium">Permissions</h4>

              <FormField
                control={form.control}
                name="permissions.canManageUsers"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>Gestion des utilisateurs</FormLabel>
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
                name="permissions.canManageRoles"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>Gestion des rôles</FormLabel>
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
                name="permissions.canManageAppointments"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>Gestion des rendez-vous</FormLabel>
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
                name="permissions.canViewReports"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>Accès aux rapports</FormLabel>
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

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {role ? 'Mettre à jour le rôle' : 'Créer le rôle'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}