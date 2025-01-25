import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Package, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...')
      
      // Get total products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      if (productsError) {
        console.error('Error fetching products:', productsError)
        throw productsError
      }

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      // Get low stock products (less than 10 items)
      const { data: lowStockProducts, error: lowStockError } = await supabase
        .from('products')
        .select('*')
        .lt('stock_quantity', 10)
      
      if (lowStockError) {
        console.error('Error fetching low stock products:', lowStockError)
        throw lowStockError
      }

      return {
        totalProducts: totalProducts || 0,
        totalUsers: totalUsers || 0,
        lowStockCount: lowStockProducts?.length || 0
      }
    }
  })

  const defaultStats = {
    totalProducts: 0,
    totalUsers: 0,
    lowStockCount: 0
  }

  const displayStats = [
    {
      title: "Total Products",
      value: stats?.totalProducts || defaultStats.totalProducts,
      icon: Package,
      description: "Products in inventory",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || defaultStats.totalUsers,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount || defaultStats.lowStockCount,
      icon: BarChart3,
      description: "Products with low stock",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your inventory dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate('/products')}>
          <Package className="mr-2 h-4 w-4" />
          Manage Products
        </Button>
        <Button variant="outline" onClick={() => navigate('/users')}>
          <Users className="mr-2 h-4 w-4" />
          Manage Users
        </Button>
      </div>
    </div>
  )
}

export default Index