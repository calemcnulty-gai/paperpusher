#!/bin/zsh

# Build the project
npm run build

# Deploy to EC2 (replace with your values)
scp -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem -r dist/* ubuntu@44.218.104.132:/var/www/autocrm/

# SSH into the server and set permissions
ssh -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem ubuntu@44.218.104.132 "sudo chown -R nginx:nginx /var/www/autocrm"

