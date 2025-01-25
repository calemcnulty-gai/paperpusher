import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { ClientTable } from "@/components/clients/ClientTable";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Clients = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      console.log("Fetching clients from Supabase");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client");

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }
      console.log("Fetched clients:", data);
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ClientTable clients={clients || []} />
        )}
      </div>
    </MainLayout>
  );
};

export default Clients;