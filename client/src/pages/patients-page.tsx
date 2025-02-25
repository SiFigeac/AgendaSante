import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import type { Patient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatientForm } from "@/components/patients/patient-form";
import { PatientDetailDialog } from "@/components/patients/patient-detail-dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function PatientsPage() {
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fonction pour formater automatiquement la date
  const formatDateInput = (input: string) => {
    // Enlever les / existants
    const digitsOnly = input.replace(/\//g, '');

    // Si l'entrée contient 6 ou 8 chiffres consécutifs, on la traite comme une date
    if (/^\d{6,8}$/.test(digitsOnly)) {
      const day = digitsOnly.slice(0, 2);
      const month = digitsOnly.slice(2, 4);
      const year = digitsOnly.slice(4);
      // Si l'année est sur 2 chiffres, on ajoute 2000 ou 1900 selon la valeur
      const fullYear = year.length === 2 
        ? (parseInt(year) > 23 ? '19' : '20') + year 
        : year;
      return `${day}/${month}/${fullYear}`;
    }
    return input;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formattedInput = formatDateInput(input);
    setSearchTerm(formattedInput);
  };

  // Filtrer les patients en fonction de la recherche
  const filteredPatients = patients?.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      format(new Date(patient.dateOfBirth), 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Patients</h1>
          <Button onClick={() => setShowAddPatient(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un patient
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom ou date de naissance (jj/mm/aaaa)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.map((patient) => (
                <TableRow 
                  key={patient.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <TableCell>
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell>{format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <PatientForm
          open={showAddPatient}
          onOpenChange={setShowAddPatient}
        />

        {selectedPatient && (
          <PatientDetailDialog
            open={!!selectedPatient}
            onOpenChange={(open) => !open && setSelectedPatient(null)}
            patient={selectedPatient}
          />
        )}
      </main>
    </div>
  );
}