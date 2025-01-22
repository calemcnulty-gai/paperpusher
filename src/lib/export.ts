import { supabase } from "@/integrations/supabase/client"

export async function exportToCSV(startDate: Date, endDate: Date) {
  // Fetch all report data
  const [dailyStats, agentPerformance, priorityDistribution] = await Promise.all([
    supabase.rpc("get_daily_ticket_stats", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }),
    supabase.rpc("get_agent_performance", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }),
    supabase.rpc("get_priority_distribution", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
  ])

  // Prepare CSV content
  const csvContent = [
    // Daily Stats
    "Daily Statistics",
    "Date,Open Tickets,Resolved Tickets,Average Response Time",
    ...dailyStats.data.map((row: any) => 
      `${row.date},${row.open_tickets},${row.resolved_tickets},${row.avg_response_time}`
    ),
    "",
    // Agent Performance
    "Agent Performance",
    "Agent Name,Tickets Handled,Average Response Time,Resolution Rate",
    ...agentPerformance.data.map((row: any) =>
      `${row.agent_name},${row.tickets_handled},${row.avg_response_time},${row.resolution_rate}%`
    ),
    "",
    // Priority Distribution
    "Priority Distribution",
    "Priority,Count,Percentage",
    ...priorityDistribution.data.map((row: any) =>
      `${row.priority},${row.count},${row.percentage}%`
    )
  ].join("\n")

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `ticket_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}