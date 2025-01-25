import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Task } from "@/types/tickets";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("priority", { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Don't do anything if dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Update task status in state
    const newTasks = Array.from(tasks);
    const task = newTasks.find(t => t.id === draggableId);
    if (!task) return;

    task.status = destination.droppableId;

    setTasks(newTasks);

    // Update in database
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: destination.droppableId })
        .eq("id", draggableId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const getColumnTasks = (status: string) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => {
        if (status === "resolved") {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
        );
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <Droppable droppableId="open">
            {(provided) => (
              <Card ref={provided.innerRef} {...provided.droppableProps}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>To Do</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {getColumnTasks("open").length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getColumnTasks("open").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4"
                        >
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === "urgent" ? "bg-red-100 text-red-700" :
                              task.priority === "high" ? "bg-orange-100 text-orange-700" :
                              task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>

          {/* In Progress Column */}
          <Droppable droppableId="pending">
            {(provided) => (
              <Card ref={provided.innerRef} {...provided.droppableProps}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>In Progress</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {getColumnTasks("pending").length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getColumnTasks("pending").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4"
                        >
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === "urgent" ? "bg-red-100 text-red-700" :
                              task.priority === "high" ? "bg-orange-100 text-orange-700" :
                              task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>

          {/* Done Column */}
          <Droppable droppableId="resolved">
            {(provided) => (
              <Card ref={provided.innerRef} {...provided.droppableProps}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Done</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {getColumnTasks("resolved").length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getColumnTasks("resolved").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4"
                        >
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              Completed {new Date(task.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
};

export default Tasks;