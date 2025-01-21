import { Profile } from "@/types/profiles"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeamMemberFormProps {
  availableUsers: Profile[]
  selectedUserId: string
  setSelectedUserId: (id: string) => void
  role: string
  setRole: (role: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function TeamMemberForm({
  availableUsers,
  selectedUserId,
  setSelectedUserId,
  role,
  setRole,
  onSubmit,
  onCancel,
}: TeamMemberFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="user" className="text-sm font-medium text-gray-700">
          User
        </label>
        <Select
          value={selectedUserId}
          onValueChange={setSelectedUserId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">
          Role
        </label>
        <Select
          value={role}
          onValueChange={(value: string) => setRole(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="leader">Leader</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!selectedUserId}
        >
          Add Member
        </Button>
      </div>
    </form>
  )
}