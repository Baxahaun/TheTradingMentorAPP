---
description: Implementar funcionalidades de IA para Trading Mentor en 3 fases
---

# Workflow: Implementación IA - Trading Mentor

Este workflow implementa las funcionalidades de IA en 3 fases progresivas.

## Requisitos Previos
- [ ] API key de OpenAI (https://platform.openai.com/api-keys)
- [ ] Firebase Plan Blaze activado
- [ ] Variables de entorno configuradas

---

# 🚀 FASE 1: MVP "WOW" (2-3 semanas)

## 1.1 Configurar API de IA

### Agregar variables de entorno
Editar `.env`:
```env
VITE_OPENAI_API_KEY=sk-xxxx
# O usar Gemini:
# VITE_GEMINI_API_KEY=xxxx
```

### Instalar dependencia
// turbo
```bash
cd functions
npm install openai
cd ..
```

---

## 1.2 Crear Cloud Function: Daily Insights

Crear `functions/src/aiInsights.ts`:

```typescript
import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

const openai = new OpenAI({
  apiKey: functions.config().openai.key
});

export const generateDailyInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const userId = context.auth.uid;
  
  // 1. Obtener trades del usuario
  const tradesSnapshot = await admin.firestore()
    .collection('users').doc(userId)
    .collection('trades')
    .orderBy('date', 'desc')
    .limit(100)
    .get();
  
  const trades = tradesSnapshot.docs.map(doc => doc.data());
  
  // 2. Calcular estadísticas
  const stats = calculateTradeStats(trades);
  
  // 3. Generar insights con AI
  const prompt = `
    Analiza estos datos de trading y genera 3 insights accionables en español:
    
    - Total trades: ${stats.totalTrades}
    - Win rate: ${stats.winRate}%
    - Mejor par: ${stats.bestPair}
    - Peor par: ${stats.worstPair}
    - Mejor día: ${stats.bestDay}
    - Peor día: ${stats.worstDay}
    - Mejor sesión: ${stats.bestSession}
    - P&L total: $${stats.totalPnL}
    
    Formato de respuesta (JSON):
    {
      "insights": [
        {"emoji": "💡", "title": "...", "description": "...", "actionable": "..."},
        {"emoji": "⚠️", "title": "...", "description": "...", "actionable": "..."},
        {"emoji": "🎯", "title": "...", "description": "...", "actionable": "..."}
      ]
    }
  `;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  const insights = JSON.parse(completion.choices[0].message.content || '{}');
  
  // 4. Guardar en cache
  await admin.firestore()
    .collection('users').doc(userId)
    .collection('aiCache')
    .doc('dailyInsights')
    .set({
      insights: insights.insights,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });
  
  return insights;
});

function calculateTradeStats(trades: any[]) {
  // Implementar cálculos estadísticos
  // ...
  return {
    totalTrades: trades.length,
    winRate: 0,
    bestPair: '',
    worstPair: '',
    bestDay: '',
    worstDay: '',
    bestSession: '',
    totalPnL: 0
  };
}
```

### Configurar API key en Firebase
```bash
firebase functions:config:set openai.key="sk-xxxx"
```

---

## 1.3 Crear Componente: AI Insights Widget

Crear `src/components/widgets/AIInsightsWidget.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';

interface Insight {
  emoji: string;
  title: string;
  description: string;
  actionable: string;
}

export const AIInsightsWidget: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchInsights = async () => {
      try {
        const functions = getFunctions();
        const generateInsights = httpsCallable(functions, 'generateDailyInsights');
        const result = await generateInsights({});
        setInsights((result.data as any).insights);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧠 AI Insights de Hoy
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
            AI Powered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">{insight.emoji}</span>
              <div>
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
                <p className="text-xs text-purple-600 mt-1">
                  💡 {insight.actionable}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

---

## 1.4 Crear Cloud Function: Sentiment Analysis

Crear `functions/src/sentimentAnalysis.ts`:

```typescript
export const analyzeSentiment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { noteText } = data;
  
  const prompt = `
    Analiza el siguiente texto de notas de trading y detecta las emociones presentes.
    
    Texto: "${noteText}"
    
    Responde en JSON con este formato:
    {
      "emotions": [
        {"name": "Ansiedad", "emoji": "😰", "confidence": 0.85},
        {"name": "FOMO", "emoji": "⚡", "confidence": 0.72}
      ],
      "suggestion": "Breve sugerencia en español"
    }
    
    Emociones posibles: Ansiedad, FOMO, Confianza, Miedo, Euforia, Frustración, Calma, Impaciencia
  `;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(completion.choices[0].message.content || '{}');
});
```

---

## 1.5 Crear Componente: Sentiment Tags

Crear `src/components/SentimentTags.tsx`:

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Emotion {
  name: string;
  emoji: string;
  confidence: number;
}

interface SentimentTagsProps {
  noteText: string;
  onEmotionsDetected: (emotions: Emotion[]) => void;
}

export const SentimentTags: React.FC<SentimentTagsProps> = ({ 
  noteText, 
  onEmotionsDetected 
}) => {
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [suggestion, setSuggestion] = useState('');

  const analyzeNote = async () => {
    if (!noteText.trim()) return;
    
    setLoading(true);
    try {
      const functions = getFunctions();
      const analyze = httpsCallable(functions, 'analyzeSentiment');
      const result = await analyze({ noteText });
      const data = result.data as any;
      
      setEmotions(data.emotions);
      setSuggestion(data.suggestion);
      onEmotionsDetected(data.emotions);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={analyzeNote}
        disabled={loading || !noteText.trim()}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {loading ? 'Analizando...' : 'Detectar emociones'}
      </Button>
      
      {emotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emotions.map((emotion, index) => (
            <Badge key={index} variant="secondary">
              {emotion.emoji} {emotion.name} 
              <span className="text-xs ml-1 opacity-70">
                {Math.round(emotion.confidence * 100)}%
              </span>
            </Badge>
          ))}
        </div>
      )}
      
      {suggestion && (
        <p className="text-sm text-purple-600">
          💡 {suggestion}
        </p>
      )}
    </div>
  );
};
```

---

## 1.6 Crear Cloud Function: Weekly Report

Crear `functions/src/weeklyReport.ts`:

```typescript
export const sendWeeklyReport = functions.pubsub
  .schedule('every sunday 09:00')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    // Obtener todos los usuarios con email
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Generar reporte con AI
      const report = await generateWeeklyReport(userDoc.id);
      
      // Enviar email (usar SendGrid, Mailgun, etc.)
      // await sendEmail(userData.email, report);
    }
});

async function generateWeeklyReport(userId: string) {
  // Obtener trades de la semana
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const tradesSnapshot = await admin.firestore()
    .collection('users').doc(userId)
    .collection('trades')
    .where('date', '>=', weekAgo.toISOString())
    .get();
  
  const trades = tradesSnapshot.docs.map(doc => doc.data());
  
  // Generar reporte con AI
  const prompt = `
    Genera un reporte semanal de trading en español...
    [Incluir datos y formato]
  `;
  
  // Llamar a OpenAI
  // ...
  
  return report;
}
```

---

## 1.7 Deploy Fase 1

// turbo
```bash
# Deploy Cloud Functions
cd functions
npm run build
firebase deploy --only functions

# Build y deploy frontend
cd ..
npm run build
firebase deploy --only hosting
```

---

## 1.8 Verificación Fase 1

- [ ] AIInsightsWidget aparece en dashboard
- [ ] Insights se generan correctamente
- [ ] SentimentTags funciona en formulario de trades
- [ ] Cache de 24h funciona
- [ ] Rate limiting por plan implementado

---

# 🔄 FASE 2: GROWTH (4-6 semanas)

## 2.1 Trade Coach AI (Chatbot)

### Crear componente de chat
Crear `src/components/TradeCoach/TradeCoachChat.tsx`

### Crear Cloud Function con RAG
Crear `functions/src/tradeCoach.ts`

Tecnología:
- Embeddings con OpenAI `text-embedding-3-small`
- Vector store en Firestore o Pinecone
- Contexto de conversación

---

## 2.2 Pattern Detection

### Crear servicio de detección
Crear `src/services/patternDetection.ts`

### Crear Cloud Function
Crear `functions/src/detectPatterns.ts`

Patrones a detectar:
- Correlación hora del día vs resultado
- Correlación día de semana vs resultado
- Correlación par vs resultado
- Comportamiento post-pérdida
- Streaks de ganancias/pérdidas

---

## 2.3 Journal AI Assistant

### Crear componente
Crear `src/components/JournalAssistant.tsx`

Features:
- Preguntas guiadas basadas en el trade
- Auto-completado inteligente
- Sugerencias de reflexión

---

# 🚀 FASE 3: PREMIUM (6-8 semanas)

## 3.1 Screenshot Analysis

### Configurar Vision API
Usar GPT-4 Vision o Gemini Vision

### Crear Cloud Function
Crear `functions/src/screenshotAnalysis.ts`

```typescript
export const analyzeScreenshot = functions.https.onCall(async (data, context) => {
  const { imageUrl } = data;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analiza este gráfico de trading...' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]
  });
  
  return response.choices[0].message.content;
});
```

---

## 3.2 Predictive Prop Firm Alerts

### Crear modelo de predicción
- Regresión lineal para profit target
- Cálculo de probabilidad de drawdown  
- Alertas automáticas

---

## 3.3 Strategy Optimizer

### Crear análisis de estrategia
- Backtesting con datos del usuario
- Sugerencias de optimización
- A/B testing de parámetros

---

# ✅ Checklist Final

## Fase 1
- [ ] Cloud Functions desplegadas
- [ ] AIInsightsWidget funcional
- [ ] SentimentTags funcional
- [ ] Weekly Report configurado
- [ ] Rate limiting implementado

## Fase 2
- [ ] Trade Coach funcional
- [ ] Pattern Detection funcional
- [ ] Journal Assistant funcional

## Fase 3
- [ ] Screenshot Analysis funcional
- [ ] Predictive Alerts funcional
- [ ] Strategy Optimizer funcional
