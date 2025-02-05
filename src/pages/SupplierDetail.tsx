import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function SupplierDetail() {
  const { userId } = useParams()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      console.log("Fetching supplier profile:", userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching supplier profile:", error)
        throw error
      }

      console.log("Fetched supplier profile:", data)
      return data
    },
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", userId],
    queryFn: async () => {
      console.log("Fetching supplier tasks:", userId)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching supplier tasks:", error)
        throw error
      }

      console.log("Fetched supplier tasks:", data)
      return data || []
    },
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", userId],
    queryFn: async () => {
      console.log("Fetching supplier products:", userId)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", userId)
        .order("name")

      if (error) {
        console.error("Error fetching supplier products:", error)
        throw error
      }

      console.log("Fetched supplier products:", data)
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

  const openTasks = tasks?.filter((task) => task.status !== "resolved") || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Details</CardTitle>
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

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Open Tasks ({openTasks.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          {tasksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : openTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No open tasks</p>
          ) : (
            <div className="space-y-4">
              {openTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.status}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {task.priority}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="products">
          {productsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : products?.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No products</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Card key={product.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ${product.wholesale_price?.toFixed(2)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Stock: {product.stock_quantity}
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