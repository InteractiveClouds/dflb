STAT_PING=`curl -s http://127.0.0.1:40009/ping`

if [ "X${STAT_PING}" == "Xpong" ]; then
    echo "[INFO] stat-server is up"
else
    echo "[INFO] stat-server is down. starting..."
    node lib/statServer/index.js &
fi

while [ "X${STAT_PING}" != "Xpong" ]; do
echo "[INFO] waiting for stat server is up..."
sleep 3
STAT_PING=`curl -s http://127.0.0.1:40009/ping`
done

NGINX_PID=`pgrep -f 'nginx-perl: master process'`

if [ "X${NGINX_PID}" == "X" ]; then
    echo "[INFO] nginx is down. starting..."
    nginx-perl
else
    echo "[INFO] nginx is up"
fi

LBSERVER_PID=`pgrep -f 'node ./server.js'`

if [ "X${LBSERVER_PID}" != "X" ]; then
    echo "[INFO] LB-server is up with pid ${LBSERVER_PID}. killing..."
    kill ${LBSERVER_PID}
fi

echo "[INFO] starting LB-server..."
node ./server.js &
