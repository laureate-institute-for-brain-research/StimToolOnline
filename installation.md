# Installation Steps
Installation steps on Ubuntu.
Main Steps are:
1. [Install Dependencies](#1.Install-Dependencies)
2. Clone repo
3. Configure Mysql
4. Configure nginx
5. Setup pm2

# 1. Install Dependencies
```
$ apt install -y nginx
$ apt install -y mysql-server
$ sudo apt install nodejs
$ apt install npm
```
# 2. Clone Repo

`$ git clone https://github.com/laureate-institute-for-brain-research/Online-StimTool.git`


# 3. Setup Mysql & Confgiure
mysql is used to store database.

`$ sudo systemctl start mysqld`

Grap the temporary password:

`$ sudo grep 'temporary password' /var/log/mysqld.log`

Run the secure installation:
 
`$ sudo mysql_secure_installation`

It will prompt you to change your root password. Setup a new password.
```
Output
The existing password for the user account root has expired. Please set a new password.

New password:
```

Once you have mysql setup, we must now setup a user account for stimtool.

Become the mysql root user using the command:

`$ mysql -u root -p`

Create the **stimtool** database.

`mysql> CREATE DATABASE stimtool;`

Generate a secure password, and use it in the example below instead of REPLACEME. Save this password to the password vault.

Create the database user weblogin for communication with the database. And give ALL PRIVILEGES.

`mysql> CREATE USER 'weblogin'@'localhost' IDENTIFIED BY 'REPLACEME';`

Save these in a file called .env

Contents should looke like
```
NODE_ENV=development
PORT=1185
MYSQL_HOST=localhost
MYSQL_USER=weblogin
MYSQL_PASSWORD=REPLACEME
MYSQL_DATABASE=stimtool
DATA_PATH=/media/data
TWILIO_ACCOUNT_SID=AXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=AXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MAILGUN_API_KEY=key-AXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MAILGUN_DOMAIN=AXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
Run *stimtool.js* for the first time for the application to create the necesary tables.

`$ node stimtool.js`

Once you see this message:
```
{"level":30,"time":1641342594803,"pid":6895,"hostname":"L00019188","msg":"Database Connected for Models"}

```
Exit the node process by pressint *Ctrl + C*


# 4. Configure Nginx

Make All Traffic Secure using nginx
Edit the configuration file:

`$ sudo vi /etc/nginx/nginx.conf`
Make sure it has these settings below
```
http {
    server_tokens off; # Prevents people from seeing node/express version
}

# HTTP — redirect all traffic to HTTPS
server {
    listen 80;
    listen [::]:80 default_server ipv6only=on;
    return 301 https://$host$request_uri;
}
```

### Create a secure diffie-helman group
Will make the app stay secure

`# sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096`

### Create a configuration File for SSL
```
# Create snippits Folder
sudo mkdir /etc/nginx/snippits

# Create file
sudo touch /etc/nginx/snippets/ssl-params.conf

# Edit the File
sudo vi /etc/nginx/snippets/ssl-params.conf`
```
Paste Below. Replace **$DNS-IP-1** and **$DNS-IP-2** with your chosen resolver.

```
# See https://cipherli.st/ for details on this configuration
ssl_protocols TLSv1.2;# Requires nginx >= 1.13.0 else use TLSv1.2
ssl_prefer_server_ciphers on; 
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
ssl_session_timeout  10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off; # Requires nginx >= 1.5.9
ssl_stapling on; # Requires nginx >= 1.3.7
ssl_stapling_verify on; # Requires nginx => 1.3.7
resolver $DNS-IP-1 $DNS-IP-2 valid=300s;
resolver_timeout 5s; 
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";

# Add our strong Diffie-Hellman group
# Genereates from openssl dhparam -out /etc/nginx/dhparam.pem 4096
ssl_dhparam /etc/nginx/dhparam.pem;
```

### Configure Domain to use SSL
`sudo nano /etc/nginx/sites-enabled/default`
Paste Below, but replace the domain **app.example.com** with your domain
```
# HTTPS — proxy all requests to the Node app
server {
    # Enable HTTP/2
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;

    # Use certificates
    ssl_certificate /etc/nginx/snippets/wildcard_full_chain.crt;
    ssl_certificate_key /etc/nginx/snippets/wildcard_private.key;

    # Include the SSL configuration from cipherli.st
    include snippets/ssl-params.conf;

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:1185/;
        proxy_ssl_session_reuse off;
        proxy_set_header Host $http_host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
```

### Place CERT and KEY and allow nginx to ready the files
Copy your wildcard_full_chain.crt to the **snippets** folder
Copy your wildecard_private.key to the *snippits** folder

Change the label (aka selinux context) of the file to something that nginx permitted to open:
```
$ chcon -t httpd_config_t /etc/nginx/snippets/wildcard_full_chain.crt 
$ chcon -t httpd_config_t /etc/nginx/snippets/wildcard_private.key
```
Test nginx configuration

```
$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Allow SELinux Connection:
`sudo setsebool -P httpd_can_network_connect true`

### Start nginx
`sudo systemctl start nginx`

### Start nginx after restart
`sudo systemctl enable nginx.service`

# 5. Setup PM2
PM2 is a process manageement that handles all process relating to node tasks.
Like restartin the process during an error, and starting up the application during a restart.

Install pm2.

`sudo npm install -g`

Register this service to systemd to ensure that the application restarts when the machine restarts. 

`sudo pm2 startup systemd`

Run the command below to allow pm2 to startup after every reboot.

`pm2 startup`

Run the **stimtool.js** application 

`pm2 start stimtool.js`

Save the current process

`pm2 save`

Install pm2-logrotate module to save logs.
Default is to rotate every day @midnight

`pm2 install pm2-logrotate`

Logs are stored in **~/.pm2/logs**

It will prompt you to copy/paste the command. Do so and you should see it create a systemctl for the the pm2 service. This will not star the pm2 service along with the node.js app everytime the server restarts.


---

**At this point the application should now be up.**

Go to the IP address using a webbrowser.
example:

[http://172.16.10.3/](http://172.16.10.3/)

or where you setup your domain:

[https://tasks.laureateinstitute.org/](https://tasks.laureateinstitute.org/)