# Guía para el Agente de Frontend: Gestión de Usuarios y Permisos

Este documento describe los endpoints clave y el flujo de interacción con la API de Backoffice Hub para la gestión de usuarios y sus permisos. Está diseñado para guiar la construcción de la interfaz de usuario, detallando las funcionalidades feature a feature.

---

## 1. Autenticación

Antes de interactuar con cualquier endpoint protegido, el agente de frontend debe autenticarse para obtener un JSON Web Token (JWT).

*   **Endpoint**: `POST /auth/login`
*   **Cuerpo de la Solicitud (Request Body)**:
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "su_password"
    }
    ```
*   **Respuesta Exitosa (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Uso**: El `accessToken` debe ser almacenado de forma segura (ej. `localStorage` o `sessionStorage`) y enviado en el encabezado `Authorization` como `Bearer <accessToken>` en todas las solicitudes subsiguientes a endpoints protegidos.

---

## 2. Gestión de Usuarios y Permisos

### 2.1. Listado de Usuarios del Grupo (con Roles y Permisos)

Este endpoint permite a un administrador obtener una lista de todos los usuarios que pertenecen a su mismo grupo (tenant), incluyendo sus roles y los permisos asociados a cada rol.

*   **Endpoint**: `GET /users/group`
*   **Permiso Requerido**: `user:manage:group` (El usuario autenticado debe tener este permiso).
*   **Respuesta Exitosa (200 OK)**: Array de `UserResponseDto`.
    ```json
    [
      {
        "id": 1,
        "email": "admin@glamour.com",
        "fullName": "Admin Glamour",
        "isAdmin": true,
        "active": true,
        "createdAt": "2025-08-06T10:00:00.000Z",
        "updatedAt": "2025-08-06T10:00:00.000Z",
        "roles": [
          {
            "id": 1,
            "name": "Admin de Cuenta",
            "description": "Acceso total a la cuenta.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              { "id": 2, "name": "agenda:read:group", "description": "Ver la agenda de todos en el grupo" },
              // ... más permisos
            ]
          }
        ]
      },
      {
        "id": 2,
        "email": "estilista@glamour.com",
        "fullName": "Carlos Estilista",
        "isAdmin": false,
        "active": true,
        "createdAt": "2025-08-06T10:05:00.000Z",
        "updatedAt": "2025-08-06T10:05:00.000Z",
        "roles": [
          {
            "id": 2,
            "name": "Profesional",
            "description": "Gestiona su agenda y clientes.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              // ... más permisos
            ]
          }
        ]
      }
    ]
    ```
*   **Uso en Frontend**: Utilizar esta respuesta para poblar una tabla o lista de usuarios, mostrando su información básica, y permitiendo expandir para ver los roles y permisos detallados.

### 2.2. Actualización de Roles de Sub-Usuarios

Permite a un administrador actualizar el perfil de un sub-usuario, incluyendo su nombre, estado de actividad y, crucialmente, los roles asignados.

*   **Endpoint**: `PATCH /users/sub-user/:id`
*   **Permiso Requerido**: `user:manage:group`
*   **Parámetros de Ruta**: `:id` (ID del sub-usuario a actualizar).
*   **Cuerpo de la Solicitud (Request Body)**: `AdminUpdateUserDto`.
    *   **Ejemplo 1: Actualizar roles y estado de actividad**
        ```json
        {
          "isActive": true,
          "roles": [
            { "id": 1, "name": "Admin de Cuenta" },
            { "id": 2, "name": "Profesional" }
          ]
        }
        ```
    *   **Ejemplo 2: Actualizar solo el nombre completo**
        ```json
        {
          "fullName": "Nuevo Nombre Completo del Usuario"
        }
        ```
*   **Consideraciones**:
    *   El backend solo utilizará el `id` de los objetos `roles` para vincular los roles existentes al usuario. El `name` es opcional en el envío, pero se recomienda incluirlo para claridad en el frontend.
    *   Solo se pueden actualizar usuarios que pertenezcan al mismo grupo del administrador autenticado y que no sean administradores de cuenta (el propio `owner`).

### 2.3. Obtención de Permisos Disponibles

Este endpoint proporciona una lista de todos los permisos atómicos definidos en el sistema. Es útil para construir interfaces de administración de roles donde se puedan seleccionar permisos.

*   **Endpoint**: `GET /permissions`
*   **Permiso Requerido**: `role:manage`
*   **Respuesta Exitosa (200 OK)**: Array de `PermissionResponseDto`.
    ```json
    [
      {
        "id": 1,
        "name": "agenda:read:own",
        "description": "Ver la agenda propia"
      },
      {
        "id": 2,
        "name": "agenda:read:group",
        "description": "Ver la agenda de todos en el grupo"
      },
      {
        "id": 7,
        "name": "user:manage:group",
        "description": "Crear/editar/eliminar sub-usuarios del grupo"
      }
      // ... y así sucesivamente para todos los permisos
    ]
    ```
*   **Uso en Frontend**: Esta lista puede ser utilizada para poblar selectores o checkboxes en una interfaz de gestión de roles (si se implementa la creación/edición de roles en el frontend), permitiendo al administrador asignar permisos a un rol.

---

## 3. Plan de Implementación (Feature a Feature)

Este plan sugiere un orden lógico para construir las funcionalidades en el frontend.

### Feature 1: Módulo de Autenticación (Login)

*   **Descripción**: Interfaz de usuario para que los usuarios ingresen sus credenciales (email y contraseña).
*   **Interacción API**:
    *   Realizar una solicitud `POST` a `/auth/login` con el email y la contraseña.
    *   En caso de éxito (200 OK), extraer el `accessToken` de la respuesta.
    *   Almacenar el `accessToken` de forma segura (ej. `localStorage`).
    *   Redirigir al usuario a la página principal o al dashboard.
    *   Manejar errores (ej. credenciales inválidas, usuario inactivo) mostrando mensajes apropiados.

### Feature 2: Visualización de Usuarios del Grupo

*   **Descripción**: Una página o componente que muestre una lista de todos los usuarios bajo la cuenta del administrador autenticado.
*   **Interacción API**:
    *   Al cargar la página/componente, realizar una solicitud `GET` a `/users/group`, incluyendo el JWT en el encabezado `Authorization`.
    *   Procesar la respuesta (array de `UserResponseDto`).
    *   Renderizar una tabla o lista, mostrando el `email`, `fullName`, `isAdmin`, `active` de cada usuario.
    *   Implementar una forma de expandir cada fila para mostrar los `roles` asignados al usuario, y dentro de cada rol, sus `permissions`.
    *   Manejar estados de carga y errores de la API.

### Feature 3: Edición de Roles de Sub-Usuario

*   **Descripción**: Un formulario o modal que permita a un administrador modificar los detalles de un sub-usuario, incluyendo la asignación de roles.
*   **Interacción API**:
    *   **Carga de Datos**: Al abrir el formulario para un usuario específico, se pueden usar los datos ya obtenidos del `GET /users/group`.
    *   **Selección de Roles**:
        *   Para permitir la selección de roles, el frontend necesitará una lista de todos los roles disponibles. Por ahora, se puede asumir que el frontend tiene esta lista o la obtiene de los roles ya presentes en los usuarios del `GET /users/group`. (Idealmente, en el futuro, podría haber un `GET /roles` para obtener todos los roles disponibles).
        *   Presentar una interfaz (ej. checkboxes, multi-select) para que el administrador elija los roles que desea asignar al sub-usuario.
    *   **Envío de Actualización**:
        *   Al guardar los cambios, construir un objeto `AdminUpdateUserDto`.
        *   El array `roles` en el DTO debe contener objetos con al menos el `id` de cada rol seleccionado (ej. `{ id: 1, name: "Admin de Cuenta" }`).
        *   Realizar una solicitud `PATCH` a `/users/sub-user/:id` (reemplazando `:id` con el ID real del usuario) con el `AdminUpdateUserDto` en el cuerpo.
        *   Manejar la respuesta (200 OK para éxito) y los errores (ej. 400 Bad Request, 403 Forbidden).

### Feature 4: Visualización de Permisos Disponibles (Opcional/Futuro)

*   **Descripción**: Una sección dedicada (quizás dentro de un módulo de "Gestión de Roles" más amplio) para listar y describir todos los permisos atómicos del sistema.
*   **Interacción API**:
    *   Realizar una solicitud `GET` a `/permissions`, incluyendo el JWT.
    *   Procesar la respuesta (array de `PermissionResponseDto`).
    *   Renderizar una lista o tabla mostrando el `name` y `description` de cada permiso.
*   **Uso**: Aunque no es directamente para la gestión de usuarios, esta funcionalidad es crucial para que un administrador entienda qué capacidades confiere cada permiso, lo cual es fundamental para la gestión de roles.

---
