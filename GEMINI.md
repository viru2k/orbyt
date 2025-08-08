Contexto del Proyecto Orbyt para Gemini
Este documento proporciona el contexto esencial para la IA de Gemini sobre el proyecto Orbyt. Por favor, utiliza esta información como base para todas las interacciones, refactorizaciones y generación de código relacionadas con este proyecto.

1. Descripción General y Stack Tecnológico
Proyecto: Orbyt, una aplicación de gestión para negocios (SPA).

Framework: Angular 17+ (usando componentes standalone).

Librería de UI: PrimeNG, con un sistema de temas dinámico (presets Lara light/dark).

Gestión de Estado: NgRx ComponentStore. Este es el patrón principal. No usar Signals para el estado a menos que se solicite explícitamente. El estado se gestiona de forma localizada por feature (ej. AuthStore, ClientStore, ProductStore).

Programación Reactiva: Uso intensivo de RxJS y Observables para manejar el estado y los flujos de datos. Los componentes se suscriben al estado del store usando el pipe async.

API: El cliente de la API en src/app/api/ se genera automáticamente con OpenAPI Generator. Los DTOs de esta carpeta son la única fuente de verdad para los modelos de datos del backend.

Estilos: SCSS.

2. Patrones de Arquitectura Clave
a. NgRx ComponentStore
Este es el pilar de la gestión de estado. Cada store sigue esta estructura:

State Interface: Define la forma de los datos del store.

Constructor: Inicializa el estado y, si es necesario, enlaza con las Redux DevTools (linkToGlobalState).

Selectores (readonly name$): Exponen fragmentos del estado como Observables.

Updaters (readonly setName): Métodos síncronos que usan this.updater() para modificar el estado.

Effects (readonly login): Métodos que usan this.effect() para manejar operaciones asíncronas (llamadas a la API), utilizando tapResponse para gestionar los casos de éxito y error.

b. Componentes Reutilizables (Dumb Components)
El proyecto utiliza componentes genéricos para encapsular la lógica de la UI y mantener los componentes de las features limpios. Los más importantes son:

orb-form-field: Envuelve los campos de formulario de PrimeNG. Gestiona automáticamente la etiqueta flotante (p-floatLabel) y la visualización de mensajes de error. No es necesario añadir p-floatLabel en los formularios que lo usan.

orb-actions-popover: Muestra un botón de elipsis (...) en las tablas que, al hacer clic, abre un popover con las acciones de la fila (ej. Editar, Eliminar). Recibe los datos de la fila (itemData) y la configuración de las acciones (actions).

orb-table: Componente base para las tablas, que recibe columnas, datos y configuraciones de acciones.

c. Gestión de Permisos y Menú Dinámico
El AuthStore contiene un user$ observable con el perfil del usuario logueado, que incluye flags de permisos (ej. canManageClients).

El orb-sidebar.component.ts se suscribe a user$ y construye el menú (MenuItem[]) de forma dinámica, usando la propiedad visible para mostrar u ocultar opciones según los permisos.

d. Gestión de Temas (Claro/Oscuro)
Un ThemeService centralizado gestiona el tema.

El servicio funciona añadiendo una clase (.light-theme o .dark-theme) al <body> del documento.

La configuración de PrimeNG en app.config.ts (darkModeSelector) está configurada para detectar esta clase y aplicar el tema correspondiente.

3. Instrucciones para Interacciones Futuras
Idioma: El código, comentarios y la interfaz de usuario deben estar en español.

Estado: Utiliza siempre el patrón NgRx ComponentStore con Observables y el pipe async en las plantillas. Evita usar signals para la gestión del estado.

Refactorización: Cuando se pida refactorizar un componente (ej. una nueva página de "Agenda"), sigue los patrones existentes: crea un store dedicado, un componente de lista "inteligente" y componentes de UI "tontos" y reutilizables.

DTOs: Basa siempre la estructura de los datos en los DTOs definidos en src/app/api/model/.

Notificaciones: Utiliza el NotificationService centralizado para mostrar mensajes al usuario. No uses alert() o console.log() para feedback al usuario.