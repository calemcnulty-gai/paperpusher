import { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { DateRangePicker } from "@/components/reports/DateRangePicker"
import { TicketBurndownChart } from "@/components/reports/TicketBurndownChart"
import { ResponseTimeChart } from "@/components/reports/ResponseTimeChart"
import { AgentPerformanceChart } from "@/components/reports/AgentPerformanceChart"
import { PriorityDistributionChart } from "@/components/reports/PriorityDistributionChart"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { exportToCSV } from "@/lib/export"
import { useToast } from "@/components/ui/use-toast"

const Reports = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      await exportToCSV(dateRange.from, dateRange.to)
      toast({
        title: "Export successful",
        description: "The report has been downloaded as a CSV file."
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the data."
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <div className="flex items-center gap-4">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <Button onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <TicketBurndownChart dateRange={dateRange} />
          </div>
          <ResponseTimeChart dateRange={dateRange} />
          <AgentPerformanceChart dateRange={dateRange} />
          <PriorityDistributionChart dateRange={dateRange} />
        </div>
      </div>
    </MainLayout>
  )
}

export default Reports