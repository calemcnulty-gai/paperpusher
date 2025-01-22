import { CardDescription } from "@/components/ui/card"

type InvitationMessageProps = {
  invitedBy: string
  teamName?: string
  role: string
}

export const InvitationMessage = ({ invitedBy, teamName, role }: InvitationMessageProps) => {
  return (
    <CardDescription>
      {invitedBy} invited you to join {teamName ? `the ${teamName} team` : "AutoCRM"} as{" "}
      {role === "admin" ? "an administrator" : `a ${role}`}
    </CardDescription>
  )
}