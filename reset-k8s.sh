#!/bin/bash

VERDE='\033[0;32m'
AZUL='\033[0;34m'
ROJO='\033[0;31m'
NC='\033[0;3m'
CLEAR='\033[0m'

echo -e "${ROJO}🗑️  Destruyendo recursos actuales en Kubernetes...${CLEAR}"
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
kubectl delete -f k8s/frontend/ --ignore-not-found=true
kubectl delete -f k8s/backend/ --ignore-not-found=true
kubectl delete -f k8s/mongo/ --ignore-not-found=true

echo -e "${ROJO}🔥 Eliminando imágenes viejas de Minikube...${CLEAR}"
minikube image rm localhost/totalservice-backend:latest 2>/dev/null
minikube image rm localhost/totalservice-frontend:latest 2>/dev/null

echo -e "${AZUL}📦 Compilando nuevas imágenes desde el código local...${CLEAR}"
minikube image build -t localhost/totalservice-backend:latest ./backend
minikube image build -t localhost/totalservice-frontend:latest ./frontend

echo -e "${VERDE}🚀 Desplegando arquitectura limpia en Kubernetes...${CLEAR}"
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/mongo/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml

echo -e "${VERDE}✅ ¡Entorno reseteado con éxito! Revisa los pods con: kubectl get pods -n totalservice${CLEAR}"