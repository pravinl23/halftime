import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Campaigns</CardTitle>
            <CardDescription>Active ad campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reach</CardTitle>
            <CardDescription>Total users reached</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Average engagement rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Create your first campaign to start reaching your target audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Navigate to the Campaigns section to create AI-generated ads that match your brand and target demographics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

