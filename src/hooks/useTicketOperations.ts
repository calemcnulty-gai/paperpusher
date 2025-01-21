import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { TicketPriority, TicketStatus } from "@/types/tickets"
import { useAuth } from "@/hooks/useAuth"

export function useTicketOperations(ticketId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleReply = async (message: string, isInternal: boolean = false) => {
    if (!user) return false
    
    try {
      setIsSubmitting(true)
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        is_internal: isInternal,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Reply sent successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] })
      return true
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reply. Please try again.",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateStatus = async (newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      return true
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
      })
      return false
    }
  }

  const updatePriority = async (newPriority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket priority updated successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      return true
    } catch (error) {
      console.error("Error updating ticket priority:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket priority. Please try again.",
      })
      return false
    }
  }

  const updateProject = async (projectId: string | null) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ project_id: projectId })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket project updated successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      return true
    } catch (error) {
      console.error("Error updating ticket project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket project. Please try again.",
      })
      return false
    }
  }

  return {
    isSubmitting,
    handleReply,
    updateStatus,
    updatePriority,
    updateProject,
  }
}