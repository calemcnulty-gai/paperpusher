#!/bin/zsh

# Set environment variables for build
export VITE_SUPABASE_URL="https://gukvkyekmmdlmliomxtj.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1a3ZreWVrbW1kbG1saW9teHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDg3MDYsImV4cCI6MjA1MzMyNDcwNn0.zlEKMxFEFlTBu4ePr_gSVes4s0ZMhTbQe-V9jxiQflg"

# Build the project
npm run build

# Deploy to EC2 (replace with your values)
scp -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem -r dist/* ubuntu@44.218.104.132:~/paperpusher/dist/

# SSH into the server and set permissions
ssh -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem ubuntu@44.218.104.132 "sudo cp -r ~/paperpusher/dist/* /var/www/paperpusher/ && sudo chown -R www-data:www-data /var/www/paperpush"