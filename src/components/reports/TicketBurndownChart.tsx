import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface TicketBurndownChartProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function TicketBurndownChart({ dateRange }: TicketBurndownChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["ticket-burndown", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_ticket_stats", {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString()
      })
      if (error) throw error
      return data
    }
  })

  const chartConfig = {
    openTickets: {
      label: "Open Tickets",
      color: "#ef4444"
    },
    resolvedTickets: {
      label: "Resolved Tickets",
      color: "#22c55e"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Burndown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <ChartTooltip />
              <Line
                type="monotone"
                dataKey="open_tickets"
                name="Open Tickets"
                stroke={chartConfig.openTickets.color}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="resolved_tickets"
                name="Resolved Tickets"
                stroke={chartConfig.resolvedTickets.color}
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}