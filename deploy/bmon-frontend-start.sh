#!/bin/sh

APP_NAME="bmon-ops-frontend"
APP_HOME="/app/applications/war/bmon-ai-agent/bmon-ops-frontend"
APP_PORT="19090"
CONF_HOME="$APP_HOME/conf"
HTTPD_BIN="/usr/sbin/httpd"

PID=`ps -ef | grep httpd | grep "$CONF_HOME/httpd.conf" | grep -v grep | awk '{print $2}' | head -1`
echo $PID

if [ e$PID != "e" ]
then
    echo "$APP_NAME is already RUNNING... (PID: $PID)"
    exit;
fi

$HTTPD_BIN -f $CONF_HOME/httpd.conf -k start

if [ e$1 = "enotail" ]
then
    echo "Starting... $APP_NAME"
    exit;
fi

sleep 1
echo "$APP_NAME started. (PORT: $APP_PORT)"
