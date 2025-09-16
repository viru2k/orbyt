# TODO - Tareas Frontend Prioritarias

Este archivo contiene todas las tareas de frontend que deben ser implementadas basadas en feedback del usuario y mejoras identificadas.

## 🚨 INSTRUCCIONES PARA EL AGENTE

**IMPORTANTE:** Este TODO es el archivo principal que debes consultar siempre para tareas de frontend:

1. **Antes de comenzar:** Lee este archivo completo y ejecuta `TodoWrite` para cargar las tareas pendientes
2. **Al trabajar:** Marca cada tarea como `in_progress` cuando comiences y `completed` cuando termines
3. **Al finalizar:** Actualiza este documento con el estado final

---

## 🔥 NUEVO: PORTAL DE CLIENTES - MÁXIMA PRIORIDAD

### ✅ Backend Completado
El sistema de portal de clientes está **100% implementado** en el backoffice-hub con endpoints funcionales.

### 🎯 Tareas Frontend para Portal de Clientes

#### **ROOMS**
- [x] **GESTION - ROOMS**
  - [x] Columna sala su el donde dice Sala de Consulta 1 deberia ser size 12 y Sala principal para consultas 10 px
  - [x] El selector de 15,30,50 debe verse como el de la tabla cliente.
  - [x] Mostrando 1 a 10 de 21 esta repetido, debe haber 1 solo
  - [x] Agregar store para gestionar  backend de rooms
  - [x] validar que se pueda hacer CREATE UPDATE GET
  - [x] Quitar datos mock
  - [x] Conectar con la store
  - [x] accion - remover cambiar estado, debe ir en editar. debe quedar solo esa accion
  - [x] BACKEND IMPLEMENTAR CRUD DE ROOMS NO EXISTE EL SERVICIO
  - [] si la tabla tiene una sola accion reemplaza  los  ... por un la piz para editar ( el lapiz simple)
- [x] **MODAL  - ROOMS**
  - [x] Modal refactor similar a  user-edit-form.component
  - [x] Los campos tienen placeholder y no deben tenerlo
  - [x] el ancho del modal es mayor que los campos mostrados  deberia ser un tamano menor deberia sm o md ( si es md sera sm)
  - [x] no tiene footer
  - [x] quitar Mostrar solo activos

#### **THUMBNAILS**
- [x] **THUMBNAILS Y AVATAR**
  - [x] (http://localhost:3000/upload) no esta funcionando correctamente da un 400    "entityId must be an integer number"
  - [x] Se deberia implementar un flujo de que si se hace un  post se debe crear primero el recurso  y luego  llamar a post de imagen ( esto aplica para clientes, productos usuarios cuandeo se crean)
  - [x] avatar cuando no tiene imagen muestra las iniciales , estas iniciales en csss estan movidas a la izquierda. debe corregirse en todas las tablas que implementen avatar

#### **USUARIO**
- [x] **GESTION - USUARIO**
  - [x] la card de avatar debe ser mas pequena, como muy alto el 8 px mas que el contenedor del avatar
  - [x] [BACKEND] Al hacer PATCH http://localhost:3000/users/sub-user/2 da error "Uno o más roles son inválidos."
  - [x] Quita la columna fecha de creacion
  - [x] Agrega una columna que tenga en tag el los roles por ejemplo Profesional ,Secretaria
  - [x] El selector de 15,30,50 debe verse como el de la tabla cliente.
  - [x] Mostrando 1 a 10 de 21 esta repetido, debe haber 1 solo
  - [x] La columna admin debe ser de 68px

#### **CLIENTE**
- [x] **GESTION - CLIENTE**
  - [x] Mostrando 1 a 10 de 21 esta duplicado
  - [x] se estan haciendo llamadas a http://localhost:3000/upload/entity/client/1 para cada cliente, esto no es correcto lo vamos a quitar, se va a agregar u campo extra llamada avatar puede venir null o la url, si viene null se muestran las letras normales del nombre sino la imagen
  - [x] [BACKEND] http://localhost:3000/clients cada cliente deberia tener un campo extra con la url del avatar si no tiene imagen asociada viene null,sino la url con la imagen
  - [x] las fuentes de telefono  y fecha de creacion debe 12 px.  estoy viendo que     --project-font-size: 14px;

    

- [x] **MODAL  - CLIENTE**
  - [x] Los campos de tipo input son menores que los campos dropdown, deben mantener la misma coherencia de ancho.  incrementalos
  - [x] El campo estado no esta funcionando, solo muestra activo. el unico campo que se debe mantener igual es fecha y mas pequeno el de estado
  - [x] Las cards de avatar, informacion basica , informacion de contacto, Información Personal y Notas Adicionales estan pegadas
  - [x] la card de avatar debe ser mas pequena, como muy alto el 8 px mas que el contenedor del avatar
  - [x] quita la card que contiene notas adicionales y agrega campo tipo dni (dropdonw ) y numero de documento en informacion personal
  - [x] [BACKEND]  falta implementar campo no requerido de sexo, dniy tipo de dni (nie pasaporte dni) y fecha de nacimiento
      - [] card de avatar es de 503 x 235 es mucho tamaño para una card, quita el titulo  avatar y haza mas pequeñ


#### **SERVICIOS**
- [x] **GESTION - SERVICIOS**
  - [x] Agregar store para gestionar  backend de services
  - [x] Accion quitar  cambiar estado y eliminar
  - [x] Mostrando 1 a 10 de 21 esta repetido, debe haber 1 solo
  - [x] El selector de 15,30,50 debe verse como el de la tabla cliente.
  - [] si la tabla tiene una sola accion reemplaza  los  ... por un la piz para editar ( el lapiz simple)
- [x] **MODAL  - SERVICIOS**
  - [x] deberia ir dentro de una card  inputs de form  como en la modal de usuario, si agregas mas de una card debe ir con 8 px de separacion cada una
  - [x] no esta recibiendo todos los  valores que estan en la tabla
  - [x] [backend] category es una tabla? si es asi debe crearse el crud ( el delete no debe existir es disable)
  - [x] el patch solo esta enviando basePrice: 12.5, category: "General", name: "corte"



#### **PRODUCTO**
- [x] **GESTION - PRODUCTO**
  - [x] El campo propietario muestra el tooltip correcto pero las iniciales son del producto, deberas mejorar el avatar
  - [x] se estan haciendo llamadas a http://localhost:3000/upload/entity/product/1 para cada producto, esto no es correcto lo vamos a quitar, se va a agregar u campo extra llamada avatar puede venir null o la url, si viene null se muestran las letras normales del nombre sino la imagen
  - [x] [BACKEND] http://localhost:3000/products cada producto deberia tener un campo extra con la url del avatar si no tiene imagen asociada viene null,sino la url con la imagen
      - [] debe tener el solo la action de editar,  si la tabla tiene una sola accion reemplaza  los  ... por un la piz para editar ( el lapiz simple)

- [x] **MODAL  - PRODUCTO**
  - [x] Los campos de tipo input son menores que los campos dropdown, deben mantener la misma coherencia de ancho.  incrementalos
  - [x] El campo estado no esta funcionando, solo muestra activo. el unico campo que se debe mantener igual es fecha y mas pequeno el de estado
  - [x] Las cards de avatar, informacion basica , informacion de contacto, Información Personal y Notas Adicionales estan pegadas
  - [x] la card de avatar debe ser mas pequena, como muy alto el 8 px mas que el contenedor del avatar
  - [x] deberia los inputs de form ir dentro de una card como en la modal de usuario, si agregas mas de una card debe ir con 8 px de separacion cada una


#### **AGENDA**
- [x] **GESTION - AGENDA**
  - [x] deberia mostrar la agenda en formato dia con el dia de hoy seleccionado con una linea que marque la hora actual, o puesto el foco en la hora actual en su version calendario
  - [x] Deberia poder actualizar
  - [] deberia poder hacer drag an drop de una cita y que actualize los horarios 

- [x] **MODAL  - AGENDA**
  - [x] El campo titulo tiene placeholder, quitalo, agrega https://primeng.org/inputtext#helptext si necesitas aclarar algo

- [x] **MODAL  - SELECCIONAR SERVICIO**
  - [x] La seccion de servicios utilizados recientemente tiene datos mocks, quitalos
  - [x] La seccion de servicios de busqueda debe tener una separacion para saber cuales son. el historial de servicios utilizados deben ser 3 maximo
  - [x] La card de servicios debe ser mas pequena
  - [x] la card servicio  no es igual que la del historial, intenta que se parezca
  - [x] el dropdown de estado tiene los estados en ingles, deben estar en espanol
  - [] debe ser mas ancho  usa otro size para ese modal

- [x] **MODAL  - EDITAR TURNO**
  - [x] No carga el servicio que tiene por defecto
  - [x] se estan haciendo llamadas a http://localhost:3000/upload/entity/client/22 para cada cliente, esto no es correcto lo vamos a quitar, se va a agregar u campo extra llamada avatar puede venir null o la url, si viene null se muestran las letras normales del nombre sino la imagen
  - [x] [BACKEND] http://localhost:3000/clients cada cliente deberia tener un campo extra con la url del avatar si no tiene imagen asociada viene null,sino la url con la imagen
