# Plan de Implementación de Frontend para Orbyt

Este documento detalla las features a implementar en el frontend de Orbyt, siguiendo la guía de la API y marcando el progreso.

## Features

### [X] Feature 1: Módulo de Autenticación (Login)
*   **Descripción**: Interfaz de usuario para que los usuarios ingresen sus credenciales (email y contraseña).
*   **Interacción API**: `POST /auth/login`
*   **Notas**: Manejo de almacenamiento de `accessToken` y redirección.

### [X] Feature 2: Visualización de Usuarios del Grupo
*   **Descripción**: Una página o componente que muestre una lista de todos los usuarios bajo la cuenta del administrador autenticado.
*   **Interacción API**: `GET /users/group`
*   **Notas**:
    *   Implementar una **tabla** para mostrar `email`, `fullName`, `isAdmin`, `active`.
    *   Permitir expandir filas para ver `roles` y `permissions`.

### [X] Feature 3: Edición de Roles de Sub-Usuario
*   **Descripción**: Un formulario o modal que permita a un administrador modificar los detalles de un sub-usuario, incluyendo la asignación de roles.
*   **Interacción API**: `PATCH /users/sub-user/:id`
*   **Notas**:
    *   Implementar un **modal** o formulario de edición.
    *   Utilizar datos de `GET /users/group` para precargar.
    *   Manejar la selección de roles (ej. checkboxes, multi-select).

### [ ] Feature 4: Visualización de Permisos Disponibles (Opcional/Futuro)
*   **Descripción**: Una sección dedicada para listar y describir todos los permisos atómicos del sistema.
*   **Interacción API**: `GET /permissions`
*   **Notas**:
    *   Implementar una **tabla** o lista para mostrar `name` y `description` de cada permiso.
    *   Esta feature es opcional y puede ser implementada en el futuro.
