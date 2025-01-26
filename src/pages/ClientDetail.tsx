import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientDetail() {
  const { userId } = useParams()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      console.log("Fetching client profile:", userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching client profile:", error)
        throw error
      }

      console.log("Fetched client profile:", data)
      return data
    },
  })

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", userId],
    queryFn: async () => {
      console.log("Fetching client tickets:", userId)
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching client tickets:", error)
        throw error
      }

      console.log("Fetched client tickets:", data)
      return data || []
    },
  })

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const openTickets = tickets?.filter((ticket) => ticket.status !== "closed") || []
  const closedTickets = tickets?.filter((ticket) => ticket.status === "closed") || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p>{profile?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p>{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Open Tickets ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed Tickets ({closedTickets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open">
          {ticketsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : openTickets.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No open tickets</p>
          ) : (
            <div className="space-y-4">
              {openTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {ticket.status}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {ticket.priority}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="closed">
          {ticketsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : closedTickets.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No closed tickets</p>
          ) : (
            <div className="space-y-4">
              {closedTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Closed
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}