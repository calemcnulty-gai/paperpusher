import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientDetail() {
  const { userId } = useParams()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      console.log("Fetching client profile:", userId)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching client profile:", error)
        throw error
      }

      console.log("Fetched client profile:", data)
      return data
    },
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", userId],
    queryFn: async () => {
      console.log("Fetching client tasks:", userId)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching client tasks:", error)
        throw error
      }

      console.log("Fetched client tasks:", data)
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
  const closedTasks = tasks?.filter((task) => task.status === "resolved") || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
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

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Open Tasks ({openTasks.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed Tasks ({closedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open">
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
        <TabsContent value="closed">
          {tasksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : closedTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No closed tasks</p>
          ) : (
            <div className="space-y-4">
              {closedTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Closed
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