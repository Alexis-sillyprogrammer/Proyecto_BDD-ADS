# Despliegue en Kubernetes — AutoService Total (Project-5O)

Guía avanzada de despliegue, arquitectura y operación para la plataforma distribuida **AutoService Total** en un clúster local de Kubernetes (minikube) utilizando el motor de contenedores **Podman (Rootless)** sobre **Fedora Linux**.

---

## 🏛️ Decisiones de Arquitectura e Inferencia Teórica

El sistema se ha diseñado bajo un patrón de **Microservicios desacoplados** para garantizar alta disponibilidad, tolerancia a fallos y escalabilidad independiente. Cada componente cumple un rol único dentro del ecosistema del clúster:

### 1. Capa de Presentación (Frontend Multi-Pod)

- **Tecnología:** Servidor Web Nginx de alto rendimiento empacado sobre alpine.
- **Rol Arquitectónico:** Actúa como el punto de entrada al clúster y como **Proxy Inverso**. Todas las peticiones dirigidas a la API interna (`/api/*`) son interceptadas y redirigidas dinámicamente hacia el servicio del Backend en la red interna del clúster.
- **Ventaja:** Al unificar el dominio bajo un solo puerto local, se eliminan por completo los problemas de **CORS (Cross-Origin Resource Sharing)** y se permite el intercambio seguro de cookies de sesión con políticas `SameSite: Lax` sin requerir configuraciones complejas en los navegadores de desarrollo.

### 2. Capa de Lógica de Negocio (Backend Escalable)

- **Tecnología:** Node.js (Runtime 20-Alpine) + Express.
- **Manejo de Estado y Datos:** Implementa una arquitectura sin estado (Stateless) en sus Pods, delegando la persistencia de datos a MongoDB. Durante el arranque del clúster, el servidor ejecuta una rutina maestra de automatización (`ejecutarSeeder()`), la cual interactúa secuencialmente con la base de datos para verificar la integridad de las colecciones e inyectar registros base si se detecta un esquema vacío.

### 3. Capa de Persistencia y Volúmenes (Database Engine)

- **Tecnología:** MongoDB 7.0 Community Edition.
- **Ciclo de Vida del Dato:** Dado que los Pods de Kubernetes son efímeros por naturaleza, la base de datos se desacopla del ciclo de vida del contenedor mediante un **PersistentVolumeClaim (PVC)** respaldado por la clase de almacenamiento estándar de Minikube. Esto garantiza que, incluso si el Pod de base de datos se destruye o el clúster se apaga, los datos de los usuarios, productos y pedidos permanecen intactos.

---

---

## Arquitectura

```

Navegador / curl

│

kubectl port-forward (o Ingress)

│

┌────▼─────┐

│ frontend │ nginx: sirve estáticos + proxy /api/ → backend-svc:3000

│ (2 pods) │

└────┬─────┘

│ red interna del cluster

┌────▼─────┐

│ backend │ Node/Express

│ (2 pods) │

└────┬─────┘

│

┌────▼─────┐

│ mongo │ MongoDB 7.0 + PVC para persistencia

│ (1 pod) │

└──────────┘

```


El frontend (nginx) actúa como proxy inverso: todas las llamadas del navegador a `/api/...` se redirigen internamente al backend, así no hay problemas de CORS ni de cookies entre orígenes distintos.

---

## 📂 Estructura del Repositorio

```
proyecto/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── server.js              # Inicialización de Express y conexión a bases de datos
│   ├── seeder.js              # Lógica secuencial de inserción automática de datos de prueba
│   ├── models/                # Esquemas de Mongoose (Usuario, Producto, Pedido)
│   └── routes/                # Controladores de las APIs RESTful
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf             # Reglas del Proxy Inverso para /api/
│   └── public/                # Archivos estáticos de la interfaz web
├── k8s/                        # Manifiestos declarativos de Kubernetes
│   ├── 00-namespace.yaml       # Aislamiento lógico ('totalservice')
│   ├── mongo/                  # Deployment, PVC y Service (Puerto 27017)
│   ├── backend/                # Deployment, ConfigMap, Secret y Service (Puerto 3000)
│   ├── frontend/                # Deployment y Service (Puerto 80)
│   └── ingress.yaml            # Reglas de enrutamiento HTTP de producción
├── start-all.sh                # Script Pro: Inicialización y compilación automatizada desde cero
└── clean-all.sh                # Script Pro: Purga total y liberación de memoria del sistema
```

---

## ⚙️ Requisitos Previos (Entorno de Hospedaje)

- **Sistema Operativo:** Fedora Linux con Podman configurado en modo Rootless (entorno nativo sin privilegios de súper usuario).
- **Binarios del Sistema:** `kubectl` y `minikube` instalados en el `$PATH`.
- **Configuración del Driver:** El entorno local debe configurarse estrictamente para comunicarse con el demonio de Podman sin llamadas a `sudo`:

```bash
minikube config set rootless true
```

---

## 🤖 Operación Automatizada (Scripts del Proyecto)

Para agilizar el flujo de desarrollo, el proyecto cuenta con dos scripts de automatización con manejo de color y control de excepciones.

### A) Orquestación Completa desde Cero (`./start-all.sh`)

Este comando automatiza el ciclo completo de preparación e inicio de la infraestructura:

1. Elimina residuos de perfiles corruptos anteriores.
2. Inicializa el nodo de Minikube usando el entorno containerd aislado en Podman.
3. Habilita el controlador interno de Ingress Nginx.
4. Compila e inyecta las imágenes de Docker del Frontend y Backend directamente en el clúster utilizando la política `imagePullPolicy: Never`.
5. Despliega de manera ordenada todos los manifiestos YAML en el Namespace `totalservice`.
6. Espera a que la sonda de disponibilidad (ReadinessProbe) del Frontend marque un estado `Ready`.
7. Ejecuta el redireccionamiento de puertos (port-forward) automático.

**Cómo ejecutarlo:**

```bash
chmod +x start-all.sh
./start-all.sh
```

### B) Purga Total del Entorno (`./clean-all.sh`)

Utilízalo para limpiar el sistema por completo, liberando memoria RAM y almacenamiento en Fedora:

1. Destruye todos los recursos activos del clúster de forma síncrona.
2. Elimina la máquina virtual/contenedor de Minikube y purga su caché de configuración (`~/.minikube`).
3. Remueve las imágenes duplicadas en el registro de Podman local.
4. Ejecuta un prune forzado de volúmenes huérfanos del sistema.

**Cómo ejecutarlo:**

```bash
chmod +x clean-all.sh
./clean-all.sh
```

---

## 🔍 Datos Sembrados para Pruebas (Seeder Auth)

Al levantar el sistema por primera vez, la rutina de inicialización poblará automáticamente las colecciones de Mongo. Puedes utilizar las siguientes credenciales e identidades en el Frontend para validar los flujos basados en roles de acceso:

| Rol de Usuario | Correo de Acceso | Contraseña Base | Acciones Disponibles en la App |
|---|---|---|---|
| Empleado | empleado@autoservice.com | password123 | Permite visualizar y accionar el panel de administración para añadir nuevos productos al inventario automotriz. |
| Cliente | cliente@gmail.com | password123 | Permite explorar el catálogo público, agregar artículos al carrito e interactuar con el flujo de pedidos. |

---

## 🛠️ Bitácora de Errores Críticos y Soluciones (Troubleshooting)

### Error 1: `TypeError: seedProductos is not a function` (Backend Pod Crashes)

- **Origen:** El módulo del servidor invocaba una desestructuración inválida del archivo de semilla debido a una discrepancia entre los named exports internos de JavaScript y la llamada maestra de ejecución síncrona en `server.js`.
- **Solución Aplicada:** Se unificó el flujo de datos bajo la función asíncrona estructurada `ejecutarSeeder()`, encargada de procesar las promesas en el orden correcto de dependencias (Productos → Usuarios → Pedidos).

### Error 2: Incompatibilidad Crítica en el Kernel Linux 6.19+ (Mongo Crash)

- **Origen:** Las versiones modernas del Kernel de Linux introdujeron cambios en la gestión de memoria que provocan un fallo catastrófico e inmediato en el asignador de memoria dinámica TCMalloc incluido por defecto en las imágenes de MongoDB 8.0+. Al usar Podman Rootless, el contenedor comparte directamente el Kernel del host Fedora, heredando el crash de manera sistemática.
- **Solución Aplicada:** Se realizó un downgrade arquitectónico controlado hacia MongoDB 7.0 en el archivo `k8s/mongo/deployment.yaml`. Esta versión cuenta con una compilación de TCMalloc perfectamente compatible con los kernels modernos de Linux.

### Error 3: Aislamiento de Red Local (Ingress unreachable en Rootless)

- **Origen:** Al ejecutar Podman de forma rootless, Minikube se ve obligado a crear un puente de red virtualizado no privilegiado (`slirp4netns` o `pasta`). Como consecuencia directa, la dirección IP arrojada por `minikube ip` se encuentra en una subred inaccesible para la tarjeta de red del sistema host.
- **Solución Aplicada:** Se sustituyó la dependencia del archivo de hosts local por un canal de retransmisión seguro mediante `kubectl port-forward` apuntando al servicio perimetral del frontend en el puerto `8080:80`.

---

## 📊 Referencia Rápida de Comandos de Diagnóstico

| Acción Requerida | Comando de Kubernetes |
|---|---|
| Monitorear logs del Backend en tiempo real | `kubectl logs deployment/backend -n totalservice -f` |
| Inspeccionar variables de entorno inyectadas | `kubectl describe deployment/backend -n totalservice` |
| Verificar la persistencia del volumen | `kubectl get pvc -n totalservice` |
| Forzar reciclado de pods por cambios menores | `kubectl rollout restart deployment/backend -n totalservice` |