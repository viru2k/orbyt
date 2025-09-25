# 🎯 Guía Completa de Recompensas - Tipos y Pruebas

## 📋 Índice
1. [Introducción](#introducción)
2. [Tipos de Recompensas](#tipos-de-recompensas)
3. [APIs para Crear Recompensas](#apis-para-crear-recompensas)
4. [Guía de Pruebas Paso a Paso](#guía-de-pruebas-paso-a-paso)
5. [Casos de Uso Avanzados](#casos-de-uso-avanzados)
6. [Monitoreo y Debugging](#monitoreo-y-debugging)

---

## 🌟 Introducción

El sistema de recompensas de Orbyt permite crear promociones complejas y personalizadas para incentivar a los clientes. Soporta diferentes tipos de recompensas, condiciones de activación y métodos de aplicación.

### ✨ Características Principales

- **Recompensas Automáticas**: Se activan cuando se cumplen criterios específicos
- **Aplicación Manual**: Los empleados pueden aplicar recompensas discrecionalmente
- **Múltiples Tipos**: Descuentos, servicios gratis, puntos, cashback
- **Condiciones Flexibles**: Basadas en compras, frecuencia, temporales
- **Integración con PrimeNG**: Interfaz moderna para mostrar recompensas

---

## 🎁 Tipos de Recompensas

### 1. **DISCOUNT_PERCENTAGE** - Descuento por Porcentaje
```typescript
// Ejemplo: 25% de descuento en toda la compra
{
  rewardType: 'DISCOUNT_PERCENTAGE',
  rewardValue: 25, // 25%
  triggerType: 'PURCHASE_AMOUNT',
  triggerValue: 100 // Al comprar €100 o más
}
```

**📊 Casos de Uso:**
- Black Friday: 50% descuento en todo
- Cliente VIP: 15% descuento permanente
- Primera compra: 10% descuento

### 2. **DISCOUNT_AMOUNT** - Descuento Fijo
```typescript
// Ejemplo: €20 de descuento
{
  rewardType: 'DISCOUNT_AMOUNT',
  rewardValue: 20, // €20
  triggerType: 'PURCHASE_AMOUNT',
  triggerValue: 150 // Al comprar €150 o más
}
```

**📊 Casos de Uso:**
- Cupón de bienvenida: €10 de descuento
- Promoción de temporada: €25 menos en compras grandes
- Recompensa por fidelidad: €50 de descuento

### 3. **FREE_SERVICE** - Servicio Gratuito
```typescript
// Ejemplo: Consulta gratuita
{
  rewardType: 'FREE_SERVICE',
  rewardValue: 0, // El valor se define por el servicio específico
  serviceId: 123, // ID del servicio específico
  triggerType: 'VISIT_COUNT',
  triggerValue: 5 // Después de 5 visitas
}
```

**📊 Casos de Uso:**
- Consulta gratuita cada 10 visitas
- Limpieza dental gratis anual
- Servicio premium de cortesía

### 4. **POINTS** - Sistema de Puntos
```typescript
// Ejemplo: 100 puntos por compra
{
  rewardType: 'POINTS',
  rewardValue: 100, // 100 puntos
  triggerType: 'PURCHASE_AMOUNT',
  triggerValue: 50 // Por cada €50 de compra
}
```

**📊 Casos de Uso:**
- 1 punto por cada €1 gastado
- Puntos bonus en productos específicos
- Puntos dobles los fines de semana

### 5. **CASHBACK** - Devolución de Dinero
```typescript
// Ejemplo: 5% cashback
{
  rewardType: 'CASHBACK',
  rewardValue: 5, // 5% de cashback
  triggerType: 'PURCHASE_AMOUNT',
  triggerValue: 200 // En compras de €200+
}
```

**📊 Casos de Uso:**
- Cashback mensual del 3%
- Cashback especial para nuevos clientes
- Cashback aumentado por método de pago

---

## 🔗 APIs para Crear Recompensas

### 1. **Crear Programa de Recompensa**
```http
POST http://localhost:3000/rewards/programs
Content-Type: application/json

{
  "name": "Descuento VIP 20%",
  "description": "Descuento exclusivo para clientes VIP",
  "rewardType": "DISCOUNT_PERCENTAGE",
  "rewardValue": 20,
  "triggerType": "PURCHASE_AMOUNT",
  "triggerValue": 100,
  "status": "ACTIVE",
  "validFrom": "2024-01-01T00:00:00Z",
  "validTo": "2024-12-31T23:59:59Z",
  "maxRedemptions": 1000,
  "eligibilityRules": {
    "clientType": "VIP",
    "minPurchases": 5
  }
}
```

### 2. **Aplicar Recompensa Manual**
```http
POST http://localhost:3000/rewards/customer-rewards
Content-Type: application/json

{
  "clientId": 123,
  "rewardProgramId": 456,
  "notes": "Aplicación manual por servicio excepcional",
  "customValue": 25, // Opcional: valor personalizado
  "expirationDate": "2024-06-30T23:59:59Z"
}
```

### 3. **Trigger Automático de Compra**
```http
POST http://localhost:3000/rewards/trigger-purchase
Content-Type: application/json

{
  "clientId": 123,
  "invoiceId": 789,
  "purchaseAmount": 150.00,
  "paymentMethod": "credit_card",
  "paymentDate": "2024-01-15T14:30:00Z",
  "items": [
    {
      "serviceId": 1,
      "quantity": 1,
      "amount": 75.00
    },
    {
      "serviceId": 2,
      "quantity": 1,
      "amount": 75.00
    }
  ]
}
```

---

## 🧪 Guía de Pruebas Paso a Paso

### **Escenario 1: Descuento por Porcentaje (Black Friday)**

#### 1️⃣ **Crear el Programa**
```bash
# Comando cURL
curl -X POST http://localhost:3000/rewards/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday 50%",
    "description": "Descuento del 50% en toda la tienda durante Black Friday",
    "rewardType": "DISCOUNT_PERCENTAGE",
    "rewardValue": 50,
    "triggerType": "PURCHASE_AMOUNT",
    "triggerValue": 100,
    "status": "ACTIVE",
    "validFrom": "2024-11-25T00:00:00Z",
    "validTo": "2024-11-30T23:59:59Z"
  }'
```

#### 2️⃣ **Crear una Factura de Prueba**
1. Ir a **Facturas → Nueva Factura**
2. Seleccionar cliente
3. Agregar productos por valor de €120 (supera el mínimo de €100)
4. El sistema debe mostrar automáticamente el descuento del 50%

#### 3️⃣ **Verificar en UI**
- La recompensa debe aparecer en la sección "Recompensas Disponibles"
- Debe mostrar el PrimeNG Message con severidad "success"
- El descuento debe aplicarse automáticamente al total

### **Escenario 2: Servicio Gratuito (Fidelización)**

#### 1️⃣ **Crear el Programa**
```bash
curl -X POST http://localhost:3000/rewards/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consulta Gratis cada 10 visitas",
    "description": "Obtén una consulta gratuita cada 10 visitas",
    "rewardType": "FREE_SERVICE",
    "rewardValue": 0,
    "triggerType": "VISIT_COUNT",
    "triggerValue": 10,
    "status": "ACTIVE",
    "eligibilityRules": {
      "minPurchases": 10
    }
  }'
```

#### 2️⃣ **Simular Visitas del Cliente**
```bash
# Simular 10 compras para el cliente ID 123
for i in {1..10}; do
  curl -X POST http://localhost:3000/rewards/trigger-purchase \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": 123,
      \"invoiceId\": $((1000 + i)),
      \"purchaseAmount\": 50,
      \"paymentMethod\": \"credit_card\",
      \"paymentDate\": \"2024-01-$(printf %02d $i)T10:00:00Z\",
      \"items\": [{\"serviceId\": 1, \"quantity\": 1, \"amount\": 50}]
    }"
done
```

#### 3️⃣ **Verificar Recompensa Ganada**
- Ir a **Recompensas → Vista de Cliente**
- Buscar el cliente ID 123
- Debe mostrar la recompensa "EARNED" (Ganada)
- Debe poder canjearse desde la interfaz

### **Escenario 3: Aplicación Manual (Caso Especial)**

#### 1️⃣ **Usar el Modal de Aplicación Manual**
1. Ir a **Recompensas → Vista de Cliente**
2. Buscar cualquier cliente
3. Hacer clic en "Aplicar Nueva Recompensa"
4. Llenar el modal:
   - **Programa**: Seleccionar uno existente
   - **Monto Simulado**: €200
   - **Motivo**: "Cliente insatisfecho - compensación"
   - **Notificar Cliente**: ✅

#### 2️⃣ **Verificar Aplicación**
- La recompensa debe aparecer inmediatamente
- Debe enviarse notificación si se marcó la opción
- El historial debe reflejar que fue aplicación manual

### **Escenario 4: Promoción de Producto Específico**

#### 1️⃣ **Crear Promoción Específica**
```bash
curl -X POST http://localhost:3000/rewards/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "30% OFF en Producto Premium",
    "description": "Descuento especial solo en productos premium",
    "rewardType": "DISCOUNT_PERCENTAGE",
    "rewardValue": 30,
    "triggerType": "SPECIFIC_PRODUCT",
    "triggerValue": 1,
    "status": "ACTIVE",
    "eligibilityRules": {
      "productIds": [101, 102, 103],
      "categories": ["premium"]
    }
  }'
```

#### 2️⃣ **Probar con Factura**
1. Crear nueva factura
2. Agregar SOLO productos premium (IDs 101, 102, 103)
3. El descuento debe aplicarse automáticamente
4. Si se agregan productos no-premium, el descuento no debe aplicarse

---

## 🚀 Casos de Uso Avanzados

### **Caso 1: Promoción por Temporada + Método de Pago**
```typescript
// Promoción navideña con bonus por tarjeta
{
  name: "Navidad + Tarjeta Bonus",
  rewardType: "DISCOUNT_PERCENTAGE",
  rewardValue: 25, // Base 25%
  triggerType: "PURCHASE_AMOUNT",
  triggerValue: 200,
  paymentMethodMultipliers: {
    "credit_card": 1.5, // 37.5% total
    "debit_card": 1.2,  // 30% total
    "cash": 1.0         // 25% base
  },
  validFrom: "2024-12-01T00:00:00Z",
  validTo: "2024-12-31T23:59:59Z"
}
```

### **Caso 2: Sistema de Puntos Escalonado**
```typescript
// Puntos que aumentan según el nivel de compra
[
  {
    name: "Puntos Nivel 1",
    rewardType: "POINTS",
    rewardValue: 1, // 1 punto por €1
    triggerType: "PURCHASE_AMOUNT",
    triggerValue: 0,
    maxTriggerValue: 99
  },
  {
    name: "Puntos Nivel 2",
    rewardType: "POINTS",
    rewardValue: 2, // 2 puntos por €1
    triggerType: "PURCHASE_AMOUNT",
    triggerValue: 100,
    maxTriggerValue: 299
  },
  {
    name: "Puntos Nivel 3",
    rewardType: "POINTS",
    rewardValue: 3, // 3 puntos por €1
    triggerType: "PURCHASE_AMOUNT",
    triggerValue: 300
  }
]
```

### **Caso 3: Recompensa de Cumpleaños**
```typescript
// Descuento especial en el mes de cumpleaños
{
  name: "Descuento de Cumpleaños",
  rewardType: "DISCOUNT_PERCENTAGE",
  rewardValue: 20,
  triggerType: "BIRTHDAY_MONTH",
  eligibilityRules: {
    "requiresBirthdayInProfile": true,
    "maxRedemptionsPerYear": 1
  },
  validityDays: 30 // Válido por 30 días desde activación
}
```

---

## 🔍 Monitoreo y Debugging

### **1. Logs del Sistema**
```bash
# Ver logs de recompensas en tiempo real
tail -f logs/rewards.log | grep "REWARD_"

# Filtrar por cliente específico
tail -f logs/rewards.log | grep "clientId:123"
```

### **2. Consultas SQL Útiles**
```sql
-- Ver todas las recompensas activas de un cliente
SELECT cr.*, rp.name, rp.rewardType, rp.rewardValue
FROM customer_rewards cr
JOIN reward_programs rp ON cr.rewardProgramId = rp.id
WHERE cr.clientId = 123 AND cr.status = 'EARNED';

-- Ver historial de aplicaciones manuales
SELECT * FROM customer_rewards
WHERE applicationMethod = 'MANUAL'
ORDER BY createdAt DESC;

-- Ver estadísticas de redemption por programa
SELECT
  rp.name,
  COUNT(*) as total_redemptions,
  AVG(cr.redeemedValue) as avg_value
FROM customer_rewards cr
JOIN reward_programs rp ON cr.rewardProgramId = rp.id
WHERE cr.status = 'REDEEMED'
GROUP BY rp.id, rp.name;
```

### **3. APIs de Debugging**
```http
# Ver todas las recompensas de un cliente
GET http://localhost:3000/rewards/customer/123/active

# Ver historial completo
GET http://localhost:3000/rewards/customer/123/history

# Ver métricas de programa
GET http://localhost:3000/rewards/programs/456/metrics

# Simular trigger sin aplicar
POST http://localhost:3000/rewards/trigger-purchase/simulate
{
  "clientId": 123,
  "purchaseAmount": 150,
  "items": [...]
}
```

### **4. Herramientas de Testing en Frontend**

#### **Usando Chrome DevTools**
```javascript
// En la consola del navegador
// Simular cambio de cliente para ver sus recompensas
orbytApp.setTestClient({
  id: 123,
  name: "Cliente Test",
  email: "test@example.com"
});

// Forzar recarga de recompensas
orbytApp.reloadClientRewards();

// Ver estado actual de recompensas
console.log(orbytApp.getClientRewards());
```

### **5. Testing Automatizado**
```typescript
// Ejemplo de test E2E con Cypress
describe('Rewards System', () => {
  it('should apply automatic discount', () => {
    cy.visit('/invoices/new');
    cy.selectClient('Test Client');
    cy.addProduct('Product Premium', 150);

    // Verificar que aparece la recompensa
    cy.get('[data-cy="rewards-section"]')
      .should('contain', 'Descuento disponible');

    // Verificar que se aplica el descuento
    cy.get('[data-cy="total-amount"]')
      .should('contain', '€120.00'); // 150 - 20% = 120
  });
});
```

---

## ✅ Checklist de Verificación

### **Al Crear un Nuevo Tipo de Recompensa:**
- [ ] ✅ El programa se crea correctamente en la base de datos
- [ ] ✅ Aparece en el dropdown de aplicación manual
- [ ] ✅ Se muestra correctamente en PrimeNG Message
- [ ] ✅ El cálculo del valor es correcto
- [ ] ✅ Los triggers funcionan según lo esperado
- [ ] ✅ La validación de fechas funciona
- [ ] ✅ Los límites de uso se respetan
- [ ] ✅ El historial se registra correctamente

### **Al Probar Recompensas Automáticas:**
- [ ] ✅ Se activan con los criterios correctos
- [ ] ✅ No se activan cuando no se cumplen criterios
- [ ] ✅ Se muestran en la UI inmediatamente
- [ ] ✅ Se aplican al total de la factura
- [ ] ✅ Se registran en el historial del cliente

### **Al Probar Aplicación Manual:**
- [ ] ✅ El modal se abre correctamente
- [ ] ✅ Los campos se validan apropiadamente
- [ ] ✅ Se puede aplicar la recompensa
- [ ] ✅ Se muestra confirmación de éxito
- [ ] ✅ Se actualiza el estado del cliente

---

## 🎯 Próximos Pasos

### **Funcionalidades Planificadas:**
1. **Recompensas Geográficas**: Basadas en ubicación del cliente
2. **Recompensas Sociales**: Por referir amigos
3. **Gamificación**: Badges y logros
4. **IA Predictiva**: Recomendaciones automáticas de recompensas
5. **Integración con Marketing**: Campañas automatizadas

### **Mejoras Técnicas:**
1. **Real-time Updates**: WebSockets para actualizaciones en tiempo real
2. **Analytics Avanzados**: Dashboard de métricas detallado
3. **A/B Testing**: Comparar efectividad de diferentes recompensas
4. **API Rate Limiting**: Prevenir abuso del sistema
5. **Audit Trail**: Seguimiento completo de cambios

---

*¡Con esta guía tienes todo lo necesario para crear, probar y administrar el sistema de recompensas de Orbyt! 🚀*