import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { CreateTemplateModal } from "@/components/templates/CreateTemplateModal"
import { format } from "date-fns"
import MDEditor from '@uiw/react-md-editor'
import { TemplateList } from "@/components/templates/TemplateList"

export default function Templates() {
  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Response Templates</h1>
          <CreateTemplateModal />
        </div>

        <div className="grid gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <TemplateList showActions />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}