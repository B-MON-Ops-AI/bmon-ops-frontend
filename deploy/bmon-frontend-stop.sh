#!/bin/sh

APP_NAME="bmon-ops-frontend"
APP_HOME="/app/applications/war/bmon-ai-agent/bmon-ops-frontend"
CONF_HOME="$APP_HOME/conf"
HTTPD_BIN="/usr/sbin/httpd"

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`

if [ e$PID = "e" ]
then
    echo "$APP_NAME is not RUNNING..."
    exit;
fi

echo "Stopping $APP_NAME... (PID: $PID)"

$HTTPD_BIN -f $CONF_HOME/httpd.conf -k stop

sleep 1

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`
if [ e$PID = "e" ]
then
    echo "$APP_NAME stopped."
else
    echo "$APP_NAME stop failed. force kill... (PID: $PID)"
    kill -9 $PID
    echo "$APP_NAME killed."
fi
