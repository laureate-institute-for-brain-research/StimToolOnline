# Online-StimTool

Node WebApp used for Online Studies including but not limited to MTurk
This is the 'web' version of stimtool.

# Installation

1. Clone Repo

	```
	$ git clone https://github.com/laureate-institute-for-brain-research/Online-StimTool.git
	```

2. Cd into folder and Intall pacakge dependencies
	```
	$ cd Online-StimTool
	$ npm install
	```

3. Configure parameters in the .env file
	
	Contents of example .env file maybe:
	```
	NODE_ENV=development
	PORT=1185
	MYSQL_HOST=localhost
	MYSQL_USER=weblogin
	MYSQL_PASSWORD=U5AZwEpM
	MYSQL_DATABASE=stimtool
	DATA_PATH=/media/data
	```

4. Run Application

	```
	$ node stimtool.js
	```

	**Note** During production, it mayb be best to use something like [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) to run continuously. As well as using reverse proxy like [nginx](https://www.nginx.com/)	