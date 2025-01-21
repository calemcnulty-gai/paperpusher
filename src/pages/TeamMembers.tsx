import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '@/store'
import { fetchTeamMembers, addTeamMember, removeTeamMember } from '@/store/teamsSlice'
import { Button } from '@/components/ui/button'
import { MainLayout } from "@/components/layout/MainLayout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

export default function TeamMembers() {
  const { teamId } = useParams<{ teamId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'leader' | 'member'>('member')
  const { teamMembers } = useSelector((state: RootState) => state.teams)

  const { data: availableUsers } = useQuery<Profile[]>({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .not('id', 'in', teamMembers.map(m => m.user_id))
        .order('full_name')

      if (error) throw error
      return profiles
    },
    enabled: isAddModalOpen,
  })

  useEffect(() => {
    if (teamId) {
      dispatch(fetchTeamMembers(teamId))
    }
  }, [dispatch, teamId])

  const handleAddMember = async () => {
    if (!teamId || !selectedUserId) return

    try {
      await dispatch(addTeamMember({
        team_id: teamId,
        user_id: selectedUserId,
        role: selectedRole,
      })).unwrap()
      setIsAddModalOpen(false)
      setSelectedUserId('')
      setSelectedRole('member')
    } catch (error) {
      console.error('Failed to add team member:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!teamId) return

    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await dispatch(removeTeamMember({ teamId, userId })).unwrap()
      } catch (error) {
        console.error('Failed to remove team member:', error)
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <h1 className="text-2xl font-bold">Team Members</h1>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">{member.user?.full_name}</TableCell>
                  <TableCell>{member.user?.email}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {teamMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No team members found. Add members to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select User
                </label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: 'leader' | 'member') => setSelectedRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId}
                >
                  Add Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
} 