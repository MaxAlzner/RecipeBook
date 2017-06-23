
# setup server instructions
[source](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04)

1. Install mysql
2. Run mysql script(s)
    - db/schema.sql
    - db/dump.sql
3. Setup mysql user
4. Copy db-config-base.json and rename to db-config.json, then fill in relevant info.
5. npm upgrade
6. sudo npm install -g pm2
7. pm2 start server.js
8. pm2 startup systemd
9. sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username
10. systemctl status pm2-username
11. sudo nano /etc/nginx/sites-available/default
```
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```
12. sudo nginx -t
13. sudo systemctl restart nginx

# server upgrade

1. git pull
2. npm upgrade
3. pm2 restart server