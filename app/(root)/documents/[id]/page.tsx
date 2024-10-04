import CollaborativeRoom from "@/components/CollaborativeRoom"
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";

const Document = async ({ params: { id } }: SearchParamProps) => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in');
  }

  const room = await getDocument({ 
    roomId: id,
    userId: clerkUser.emailAddresses[0].emailAddress
  })

  if (!room) {
    redirect('/');
  }

  // Check to see if room.usersAccesses exists before trying to use Object.keys() on it.
  if (!room.usersAccesses || typeof room.usersAccesses !== 'object') {
    console.error('Room data is missing usersAccesses property');
    redirect('/');
  }

  const userIds = Object.keys(room.usersAccesses);
  const users = await getClerkUsers({ userIds });

  // Extract the user data and add the userType property:
  const usersData = users.map((user: User) => ({
    ...user,
    // If the user has the 'room:write' permission, they are an editor, otherwise they are a viewer:
    userType: room.usersAccesses[user.email]?.includes('room:write')
    ? 'editor'
    : 'viewer'
  }))

  // Determine the current user's type based on their access permissions:
  const currentUsertype = room.usersAccesses[clerkUser.emailAddresses[0].emailAddress]?.includes
  ('room:write') ? 'editor' : 'viewer'; 

  return (
    <main className="flex w-full flex-col items-center">
      <CollaborativeRoom 
        roomId={id}
        roomMetadata={room.metadata}
        users={usersData}
        currentUserType={currentUsertype}
      />
    </main>
  )
}

export default Document