#!/bin/sh
find /app -type l | while read l; do
  t=$(readlink "$l")
  case "$t" in
    C:/ProyectoFinalCamara/*)
      nt=$(echo "$t" | sed 's|C:/ProyectoFinalCamara|/app|')
      ln -sf "$nt" "$l"
      echo "Fixed: $l -> $nt"
      ;;
  esac
done
