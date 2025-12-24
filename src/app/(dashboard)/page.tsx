import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // CHECK ORGANIZATION STATUS
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // If NO Org -> Redirect to Onboarding
  if (!member) {
    redirect('/onboarding')
  }

  return (
    <>
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-none border-black shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <div className="h-4 w-4 bg-gray-100"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% from last month</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-black shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <div className="h-4 w-4 bg-gray-100"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">0 pending approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <Button className="rounded-none bg-black hover:bg-[#eb4f27] text-white">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </div>

          <div className="rounded-none border border-black">
            <Table>
              <TableHeader>
                <TableRow className="border-black hover:bg-transparent">
                  <TableHead className="w-[100px] text-black font-bold">ID</TableHead>
                  <TableHead className="text-black font-bold">Status</TableHead>
                  <TableHead className="text-black font-bold">Title</TableHead>
                  <TableHead className="text-black font-bold text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-black/10 hover:bg-gray-50">
                  <TableCell className="font-medium">#001</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none border-gray-400 font-normal">Draft</Badge>
                  </TableCell>
                  <TableCell>Welcome to Agent Niuans</TableCell>
                  <TableCell className="text-right">Today</TableCell>
                </TableRow>
                <TableRow className="border-black/10 hover:bg-gray-50">
                  <TableCell className="font-medium">#002</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none border-gray-400 font-normal">Draft</Badge>
                  </TableCell>
                  <TableCell>Setting up Webflow API</TableCell>
                  <TableCell className="text-right">Today</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  )
}
