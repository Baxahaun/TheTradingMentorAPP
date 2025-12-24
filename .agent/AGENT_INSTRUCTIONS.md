# Trading Mentor - Instrucciones para Agentes

> ⚠️ **IMPORTANTE**: Todo agente DEBE leer este archivo y el ROADMAP antes de ejecutar cualquier acción.

## Antes de Cualquier Tarea

1. **Revisar el Roadmap**: `docs/ROADMAP.md`
2. **Revisar el estado de tareas**: `.agent/tasks/STATUS.md`
3. **Identificar en qué fase/trimestre estamos**
4. **Verificar dependencias antes de iniciar cualquier trabajo**

---

## Estructura del Proyecto

```
trading-journal/
├── .agent/
│   ├── workflows/           # Workflows ejecutables
│   │   ├── backoffice-saas.md
│   │   ├── branding.md
│   │   └── ai-features.md
│   ├── tasks/
│   │   └── STATUS.md        # Estado actual de tareas
│   └── AGENT_INSTRUCTIONS.md # Este archivo
├── docs/
│   └── ROADMAP.md           # Roadmap de mejoras
└── src/                     # Código fuente
```

---

## Workflows Disponibles

| Comando | Descripción | Dependencias |
|---------|-------------|--------------|
| `/branding` | Cambiar nombre, colores, logos | Ninguna |
| `/backoffice-saas` | Panel admin + Stripe | Branding (recomendado) |
| `/ai-features` | IA en 3 fases | Backoffice + Stripe |

---

## Reglas para Agentes

1. **Siempre verificar el estado actual** antes de proponer cambios
2. **No duplicar trabajo** - revisar si la tarea ya está completada
3. **Actualizar STATUS.md** después de completar cualquier tarea
4. **Seguir las dependencias** del roadmap
5. **Documentar cambios** en los archivos correspondientes

---

## Estado del Proyecto

Para conocer el estado actual del proyecto:

1. Leer `docs/ROADMAP.md` para contexto general
2. Leer `.agent/tasks/STATUS.md` para estado detallado
3. Revisar commits recientes si es necesario

---

## Contacto

Si hay ambigüedad en las instrucciones, **preguntar al usuario** antes de asumir.
