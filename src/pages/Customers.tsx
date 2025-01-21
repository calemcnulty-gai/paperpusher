import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Customers = () => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      console.log("Fetching customers from Supabase");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer");

      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
      console.log("Fetched customers:", data);
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <CustomerTable customers={customers || []} />
        )}
      </div>
    </MainLayout>
  );
};

export default Customers;