#!/bin/bash

port=${1:-8080}

cd $(dirname $0)/static
exec python -m SimpleHTTPServer "$port"
