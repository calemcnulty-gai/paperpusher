import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface PriorityDistributionChartProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function PriorityDistributionChart({ dateRange }: PriorityDistributionChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["priority-distribution", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_priority_distribution", {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString()
      })
      if (error) throw error
      return data
    }
  })

  const chartConfig = {
    urgent: {
      label: "Urgent",
      color: "#ef4444"
    },
    high: {
      label: "High",
      color: "#f97316"
    },
    medium: {
      label: "Medium",
      color: "#eab308"
    },
    low: {
      label: "Low",
      color: "#22c55e"
    }
  }

  const COLORS = [
    chartConfig.urgent.color,
    chartConfig.high.color,
    chartConfig.medium.color,
    chartConfig.low.color
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => 
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}