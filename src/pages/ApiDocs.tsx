import { useQuery } from "@tanstack/react-query"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { MainLayout } from "@/components/layout/MainLayout"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ApiDocs = () => {
  const { data: docs } = useQuery({
    queryKey: ["api-documentation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_documentation")
        .select("*")
        .order("path")
      
      if (error) throw error

      // Transform the data into OpenAPI format
      const paths: Record<string, any> = {}
      
      data?.forEach((doc) => {
        if (!paths[doc.path]) {
          paths[doc.path] = {}
        }
        
        paths[doc.path][doc.method.toLowerCase()] = {
          summary: doc.summary,
          description: doc.description,
          tags: doc.tags,
          requestBody: doc.request_schema ? {
            content: {
              "application/json": {
                schema: doc.request_schema
              }
            }
          } : undefined,
          responses: {
            "200": {
              description: "Successful response",
              content: doc.response_schema ? {
                "application/json": {
                  schema: doc.response_schema
                }
              } : undefined
            }
          }
        }
      })

      return {
        openapi: "3.0.0",
        info: {
          title: "AutoCRM API Documentation",
          version: "1.0.0",
          description: "API documentation for the AutoCRM platform"
        },
        paths
      }
    }
  })

  return (
    <MainLayout>
      <Card className="min-h-screen">
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          {docs && <SwaggerUI spec={docs} />}
        </CardContent>
      </Card>
    </MainLayout>
  )
}

export default ApiDocs