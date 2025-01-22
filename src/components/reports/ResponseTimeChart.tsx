import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface ResponseTimeChartProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function ResponseTimeChart({ dateRange }: ResponseTimeChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["response-time", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_ticket_stats", {
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
    responseTime: {
      label: "Average Response Time (hours)",
      color: "#6366f1"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <ChartTooltip />
              <Bar
                dataKey="avg_response_time"
                name="Average Response Time"
                fill={chartConfig.responseTime.color}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}