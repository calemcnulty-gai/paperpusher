import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/MainLayout"
import { BarChart3, Inbox, Clock, CheckCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...')
      
      // Get open tickets count
      const { count: openTickets, error: openTicketsError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      
      if (openTicketsError) {
        console.error('Error fetching open tickets:', openTicketsError)
        throw openTicketsError
      }

      // Get total tickets this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { count: monthlyTickets, error: monthlyTicketsError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
      
      if (monthlyTicketsError) {
        console.error('Error fetching monthly tickets:', monthlyTicketsError)
        throw monthlyTicketsError
      }

      // Get resolved tickets count for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: resolvedTickets, error: resolvedTicketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'resolved')
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (resolvedTicketsError) {
        console.error('Error fetching resolved tickets:', resolvedTicketsError)
        throw resolvedTicketsError
      }

      const { data: totalTickets30Days, error: totalTickets30DaysError } = await supabase
        .from('tickets')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (totalTickets30DaysError) {
        console.error('Error fetching total tickets:', totalTickets30DaysError)
        throw totalTickets30DaysError
      }

      const resolutionRate = totalTickets30Days?.length 
        ? Math.round((resolvedTickets?.length / totalTickets30Days.length) * 100)
        : 0

      // Calculate average response time
      const { data: ticketsWithMessages, error: ticketsWithMessagesError } = await supabase
        .from('tickets')
        .select(`
          id,
          created_at,
          ticket_messages (
            created_at
          )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (ticketsWithMessagesError) {
        console.error('Error fetching tickets with messages:', ticketsWithMessagesError)
        throw ticketsWithMessagesError
      }

      let totalResponseTime = 0
      let ticketsWithResponses = 0
      
      ticketsWithMessages?.forEach(ticket => {
        if (ticket.ticket_messages && ticket.ticket_messages.length > 0) {
          const sortedMessages = [...ticket.ticket_messages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          const firstResponse = new Date(sortedMessages[0].created_at)
          const ticketCreation = new Date(ticket.created_at)
          const responseTime = (firstResponse.getTime() - ticketCreation.getTime()) / (1000 * 60 * 60) // hours
          totalResponseTime += responseTime
          ticketsWithResponses++
        }
      })
      
      const avgResponseTime = ticketsWithResponses 
        ? (totalResponseTime / ticketsWithResponses).toFixed(1)
        : 0

      return {
        openTickets: openTickets || 0,
        avgResponseTime: `${avgResponseTime}h`,
        resolutionRate: `${resolutionRate}%`,
        monthlyTickets: monthlyTickets || 0
      }
    }
  })

  // New query for priority tickets
  const { data: priorityTickets } = useQuery({
    queryKey: ['priority-tickets'],
    queryFn: async () => {
      console.log('Fetching priority tickets...')
      const { data, error } = await supabase.rpc('get_dashboard_priority_tickets', {
        p_user_id: user?.id,
        p_limit: 5
      })

      if (error) {
        console.error('Error fetching priority tickets:', error)
        throw error
      }

      return data
    }
  })

  const defaultStats = {
    openTickets: 0,
    avgResponseTime: '0h',
    resolutionRate: '0%',
    monthlyTickets: 0
  }

  const displayStats = [
    {
      title: "Open Tickets",
      value: stats?.openTickets || defaultStats.openTickets,
      icon: Inbox,
      description: "Active support requests",
    },
    {
      title: "Avg. Response Time",
      value: stats?.avgResponseTime || defaultStats.avgResponseTime,
      icon: Clock,
      description: "Last 7 days",
    },
    {
      title: "Resolution Rate",
      value: stats?.resolutionRate || defaultStats.resolutionRate,
      icon: CheckCircle,
      description: "Last 30 days",
    },
    {
      title: "Total Tickets",
      value: stats?.monthlyTickets || defaultStats.monthlyTickets,
      icon: BarChart3,
      description: "This month",
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your support dashboard
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {displayStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Priority Tickets Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Priority Tickets</h2>
            <Button variant="outline" onClick={() => navigate('/tickets')}>
              View All Tickets
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {priorityTickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/tickets?id=${ticket.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{ticket.subject}</h3>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{ticket.customer_name}</span>
                      <span>{format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                ))}
                {priorityTickets?.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No priority tickets at the moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

export default Index