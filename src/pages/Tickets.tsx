import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal"
import { TicketTable } from "@/components/tickets/TicketTable"

const Tickets = () => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(full_name, role, email),
          assignee:profiles!tickets_assigned_to_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })

  const isAgent = tickets?.[0]?.customer?.role === 'agent'
  const isAdmin = tickets?.[0]?.customer?.role === 'admin'
  const canEdit = isAgent || isAdmin

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <CreateTicketModal />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <TicketTable 
            tickets={tickets} 
            isLoading={isLoading}
            canEdit={canEdit}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default Tickets