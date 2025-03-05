import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useRoleStore } from "@/lib/roles";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePastelColor(existingColors: string[]): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 80;

  // Générer une nouvelle couleur
  const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Si la couleur existe déjà, en générer une nouvelle
  if (existingColors.includes(newColor)) {
    return generatePastelColor(existingColors);
  }

  return newColor;
}

const DEFAULT_PERMISSIONS = {
  doctor: ["view_appointments", "manage_own_appointments"],
  staff: ["view_appointments", "manage_all_appointments", "manage_patients"],
  admin: ["view_appointments", "manage_all_appointments", "manage_patients", "manage_users", "manage_system"],
};


export function UserForm({ open, onOpenChange }: UserFormProps) {
  const { toast } = useToast();
  const { roles } = useRoleStore();
  const QueryClient = useQueryClient();

  const { data: existingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      isAdmin: false,
      permissions: DEFAULT_PERMISSIONS.staff,
      role: "staff" as const,
    },
  });

  const role = form.watch("role");

  useEffect(() => {
    if (role) {
      form.setValue("permissions", DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || []);
    }
  }, [role, form.setValue]);

  // Rest of the component logic...
}