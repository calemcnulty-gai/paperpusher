# Welcome to AutoCRM

## Project info

**URL**: https://lovable.dev/projects/6d017fd8-0b57-4c54-b70f-d63b5a35fe7b

## Technologies

This project uses a modern tech stack focused on maintainability and scalability:

- TypeScript for type safety
- React 18 with Vite for fast development
- Redux (@reduxjs/toolkit) for centralized state management
- TanStack Query for server state and data fetching
- shadcn/ui (Radix UI primitives) for accessible components
- Tailwind CSS for styling
- Supabase for backend services
- AWS Amplify for deployment

## State Management Guidelines

We use Redux as our primary state management solution. Here's what you need to know:

1. **Redux Store Organization**
   - Feature-based slices (auth, tickets, users, etc.)
   - Async operations via createAsyncThunk
   - Strict TypeScript typing for actions and state
   - Normalized state shape for relational data

2. **When to Use Redux vs TanStack Query**
   - Redux: Application state, shared business logic, UI state
   - TanStack Query: Server state, data fetching, caching

3. **Best Practices**
   - Use Redux Toolkit's createSlice for reducers
   - Implement memoized selectors for derived data
   - Keep reducers pure and predictable
   - Document state shape and actions

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Development Workflow

You can edit this project in several ways:

**Use Lovable**
Visit the [Lovable Project](https://lovable.dev/projects/6d017fd8-0b57-4c54-b70f-d63b5a35fe7b) and start prompting.
Changes made via Lovable will be committed automatically.

**Use your preferred IDE**
Clone the repo and push changes. Pushed changes will be reflected in Lovable.

**Edit directly in GitHub**
Navigate to files and use the "Edit" button (pencil icon).

**Use GitHub Codespaces**
Launch a new Codespace from the "Code" button in the repository.

## Deployment

Open [Lovable](https://lovable.dev/projects/6d017fd8-0b57-4c54-b70f-d63b5a35fe7b) and click on Share -> Publish.

For custom domains, we recommend using Netlify. See our docs: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
