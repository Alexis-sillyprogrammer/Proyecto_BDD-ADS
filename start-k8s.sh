#!/bin/bash

VERDE='\033[0;32m'
AZUL='\033[0;34m'
CLEAR='\033[0m'

echo -e "${AZUL}⚙️  Configurando e Iniciando Minikube con Podman (Rootless)...${CLEAR}"
minikube config set rootless true

minikube delete 2>/dev/null

minikube start --driver=podman --container-runtime=containerd

echo -e "${AZUL}🌐 Activando Addon de Ingress Nginx...${CLEAR}"
minikube addons enable ingress

echo -e "${AZUL}📦 Construyendo imágenes (backend gRPC, frontend con cliente generado, Envoy)...${CLEAR}"
minikube image build -f backend-grpc/Dockerfile -t localhost/totalservice-backend-grpc:latest .
minikube image build -f frontend/Dockerfile -t localhost/totalservice-frontend:latest .
minikube image build -t localhost/totalservice-envoy:latest ./envoy

echo -e "${VERDE}🚀 Desplegando toda la arquitectura en Kubernetes...${CLEAR}"
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/mongo/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/envoy/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml

echo -e "${AZUL}⏳ Esperando a que los Pods estén listos...${CLEAR}"
kubectl wait --namespace totalservice --for=condition=ready pod -l app=frontend --timeout=60s
kubectl wait --namespace totalservice --for=condition=ready pod -l app=envoy --timeout=60s

echo -e "${VERDE}✨ ¡Entorno creado con éxito!${CLEAR}"
echo -e "${AZUL}🔌 Abriendo canal hacia Envoy en http://localhost:8081 (segundo plano)...${CLEAR}"
kubectl port-forward -n totalservice svc/envoy-svc 8081:8080 &

echo -e "${AZUL}🔌 Abriendo canal de comunicación en http://localhost:8080...${CLEAR}"
kubectl port-forward -n totalservice svc/frontend-svc 8080:80