#!/bin/bash

port=${1:-8080}

cd static
exec python -m SimpleHTTPServer "$port"
