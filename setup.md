
# setup server instructions

1. Install mysql
2. Run mysql script(s)
    - db/schema.sql
    - db/dump.sql
3. npm upgrade
4. sudo npm install -g pm2
5. pm2 start server.js
6. pm2 startup systemd
7. sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u <username> --hp /home/<username>
8. systemctl status pm2-<username>
9. sudo nano /etc/nginx/sites-available/default
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
10. sudo nginx -t
11. sudo systemctl restart nginx

# server upgrade

1. git pull
2. npm upgrade
3. pm2 restart server