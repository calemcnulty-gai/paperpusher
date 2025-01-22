#!/bin/zsh

# Set environment variables for build
export VITE_SUPABASE_URL="https://olfgwqwvvywhjmxhzmby.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZmd3cXd2dnl3aGpteGh6bWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczOTc0NzQsImV4cCI6MjA1Mjk3MzQ3NH0.j_UD8dZUqSFgHDCus7AVkFhGDzIQw0DCKXJxNijy4mk"

# Build the project
npm run build

# Deploy to EC2 (replace with your values)
scp -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem -r dist/* ubuntu@44.218.104.132:~/autocrm/dist/

# SSH into the server and set permissions
ssh -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem ubuntu@44.218.104.132 "sudo cp -r ~/autocrm/dist/* /var/www/autocrm/ && sudo chown -R www-data:www-data /var/www/autocrm"