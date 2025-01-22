#!/bin/zsh

# Build the project
npm run build

# Deploy to EC2 (replace with your values)
scp -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem -r dist/* ubuntu@44.218.104.132:~/autocrm/dist/

# SSH into the server and set permissions
ssh -i /Users/calemcnulty/Workspace/perms/cale-ssh.pem ubuntu@44.218.104.132 "sudo cp -r ~/autocrm/dist/* /var/www/autocrm/ && sudo chown -R www-data:www-data /var/www/autocrm"

