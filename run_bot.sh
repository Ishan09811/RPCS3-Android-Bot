#!/bin/sh

while true; do
  current_hour=$(date +%H)
  if [ "$current_hour" -ge 6 ] && [ "$current_hour" -lt 23 ]; then
    echo "Starting bot..."
    node src/main.js
  else
    echo "Bot is paused. Will restart later."
    sleep 3600  # sleep for 1 hour before checking again
  fi
done
