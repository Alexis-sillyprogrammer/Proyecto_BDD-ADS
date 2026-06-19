#!/bin/bash

ROJO='\033[0;31m'
CLEAR='\033[0m'

echo -e "${ROJO}🛑 Destruyendo recursos de Kubernetes internamente...${CLEAR}"
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true 2>/dev/null
kubectl delete -f k8s/frontend/ --ignore-not-found=true 2>/dev/null
kubectl delete -f k8s/backend/ --ignore-not-found=true 2>/dev/null
kubectl delete -f k8s/mongo/ --ignore-not-found=true 2>/dev/null

echo -e "${ROJO}💀 Purgando por completo el entorno de Minikube...${CLEAR}"
minikube delete --all --purge

echo -e "${ROJO}🧹 Limpiando imágenes y volúmenes huérfanos en tu Podman local...${CLEAR}"
podman rmi localhost/totalservice-backend:latest localhost/totalservice-frontend:latest --force 2>/dev/null

podman volume prune --force

echo -e "${ROJO}✨ [SISTEMA TOTALMENTE LIMPIO] No queda rastro de la app ni de Minikube.${CLEAR}"