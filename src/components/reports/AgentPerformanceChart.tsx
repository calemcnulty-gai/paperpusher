import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface AgentPerformanceChartProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function AgentPerformanceChart({ dateRange }: AgentPerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-performance", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agent_performance", {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString()
      })
      if (error) throw error
      return data.map((item: any) => ({
        ...item,
        avg_response_time: parseFloat(item.avg_response_time) / 3600 // Convert to hours
      }))
    }
  })

  const chartConfig = {
    ticketsHandled: {
      label: "Tickets Handled",
      color: "#8b5cf6"
    },
    resolutionRate: {
      label: "Resolution Rate (%)",
      color: "#06b6d4"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="agent_name" type="category" width={100} />
              <ChartTooltip />
              <Bar
                dataKey="tickets_handled"
                name="Tickets Handled"
                fill={chartConfig.ticketsHandled.color}
              />
              <Bar
                dataKey="resolution_rate"
                name="Resolution Rate"
                fill={chartConfig.resolutionRate.color}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}