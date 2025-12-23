import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from './auth/actions'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, User, LogOut } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email?.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden">
      <AppSidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-xl font-bold tracking-tight">Overview</h1>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-transparent">
                  <Avatar className="h-10 w-10 border border-gray-200 rounded-none">
                    <AvatarImage src={profile?.avatar_url || ''} alt="@user" />
                    <AvatarFallback className="bg-[#eb4f27] text-white rounded-none">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-none border-black" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <form action={signout} className="w-full flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <button type="submit">Log out</button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
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
      </main>
    </div>
  )
}
