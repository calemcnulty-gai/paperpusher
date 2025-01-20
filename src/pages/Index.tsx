import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/MainLayout"
import { BarChart3, Inbox, Clock, CheckCircle } from "lucide-react"

const stats = [
  {
    title: "Open Tickets",
    value: "12",
    icon: Inbox,
    description: "Active support requests",
  },
  {
    title: "Avg. Response Time",
    value: "2.4h",
    icon: Clock,
    description: "Last 7 days",
  },
  {
    title: "Resolution Rate",
    value: "94%",
    icon: CheckCircle,
    description: "Last 30 days",
  },
  {
    title: "Total Tickets",
    value: "156",
    icon: BarChart3,
    description: "This month",
  },
]

const Index = () => {
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
          {stats.map((stat) => (
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
      </div>
    </MainLayout>
  )
}

export default Index