
import { FunnelBlock } from '../types';

export const FUNNEL_BLOCKS: FunnelBlock[] = [
  {
    id: 1,
    type: 'vsl',
    title: '¡BASTA DE SENTIRTE INVISIBLE! ¡TU TRANSFORMACIÓN COMIENZA AHORA!',
    description: 'Mira este video corto antes de comenzar tu diagnóstico personalizado.'
  },
  {
    id: 2,
    type: 'question',
    title: '¿Qué es lo que más te molesta en tu salud y cuerpo hoy en día?',
    alternatives: [
      { id: 'A', text: 'Falta de energía y disposición.', feedback: '¡Muchas mujeres se sienten así por el metabolismo lento. ¡Vamos a resolverlo!' },
      { id: 'B', text: 'Inconformidad con mi cuerpo (abdomen/piernas).', feedback: 'Entiendo perfectamente. Enfocarnos en la tonificación cambiará cómo te ves.' },
      { id: 'C', text: 'Autoestima baja y desmotivación.', feedback: '¡La motivación viene con los primeros resultados, y llegarán rápido!' },
      { id: 'D', text: 'Dolores en el cuerpo y salud frágil.', feedback: 'Tu salud es tu mayor riqueza. Vamos a cuidarla con cariño.' },
      { id: 'E', text: 'Dificultad para mantener la constancia.', feedback: 'La culpa no es tuya, es del método. Nuestro plan está hecho para rutinas reales.' }
    ]
  },
  {
    id: 3,
    type: 'question',
    title: '¿Cómo te sientes cuando te miras al espejo?',
    alternatives: [
      { id: 'A', text: 'Frustrada e insatisfecha.', feedback: 'Transformaremos esa frustración en orgullo en pocas semanas.' },
      { id: 'B', text: 'Cansada y sin energía.', feedback: 'Tu cuerpo pide un despertar. Vamos a darle el combustible correcto.' },
      { id: 'C', text: 'Bien, pero puedo mejorar.', feedback: 'La excelencia está a tu alcance. ¡Vamos a pulir ese diamante!' },
      { id: 'D', text: 'Me da pena y evito mirarme.', feedback: 'Siente nuestro abrazo. Eres hermosa y vamos a rescatar tu confianza juntos.' }
    ]
  },
  {
    id: 4,
    type: 'question',
    title: 'Imagínate dentro de 30 días. ¿Qué elegirías transformar en tu cuerpo para sentirte plena?',
    alternatives: [
      { id: 'A', text: 'Abdomen definido y cintura fina.', feedback: 'El secreto está en ejercicios hipopresivos y enfoque en el core.' },
      { id: 'B', text: 'Piernas y glúteos tonificados.', feedback: 'Entrenamientos de fuerza cortos en casa hacen milagros aquí.' },
      { id: 'C', text: 'Más fuerza y resistencia.', feedback: '¡La funcionalidad es vida! Te sentirás mucho más ligera.' },
      { id: 'D', text: 'Cuerpo ligero y menos grasa.', feedback: 'Haremos que tu metabolismo trabaje a tu favor, incluso descansando.' }
    ]
  },
  {
    id: 5,
    type: 'question',
    title: '¿Tu cuerpo actual afecta tu autoestima?',
    alternatives: [
      { id: 'A', text: 'Sí, afecta mi estado de ánimo.', feedback: 'Increíble cómo lo físico impacta lo emocional, ¿verdad? Vamos a romper ese ciclo.' },
      { id: 'B', text: 'A veces me siento insegura.', feedback: 'La seguridad es libertad. Mereces sentirte libre.' },
      { id: 'C', text: 'No, pero quiero más confianza.', feedback: 'La confianza es un músculo que vamos a entrenar todos los días.' }
    ]
  },
  {
    id: 6,
    type: 'question',
    title: '¿Sabías que la baja autoestima genera riesgos para la salud?',
    alternatives: [
      { id: 'A', text: 'Sí, ya siento síntomas.', feedback: 'Identificar es el primer paso para la cura. El ejercicio es la mejor medicina natural.' },
      { id: 'B', text: 'Tengo miedo de desarrollarlos.', feedback: 'La prevención es amor propio. Estás en el lugar correcto.' },
      { id: 'C', text: 'No, pero quiero prevenir.', feedback: '¡Excelente mentalidad! La salud mental y física van de la mano.' }
    ]
  },
  {
    id: 7,
    type: 'question',
    title: '¿Qué has intentado ya para cambiar esto?',
    alternatives: [
      { id: 'A', text: 'Gimnasios (abandoné).', feedback: 'El gimnasio tradicional es frío. El entrenamiento en casa es acogedor y eficiente.' },
      { id: 'B', text: 'Dietas restrictivas.', feedback: 'La restricción genera compulsión. Vamos a enfocarnos en el equilibrio.' },
      { id: 'C', text: 'Entrenamientos online genéricos.', feedback: 'La falta de personalización desmotiva a cualquiera. Aquí se trata de TI.' },
      { id: 'D', text: 'Nada todavía.', feedback: 'Empezar de la manera correcta te ahorra meses de frustración.' }
    ]
  },
  {
    id: 8,
    type: 'question',
    title: '¿Cuál ha sido tu mayor desafío hasta hoy?',
    alternatives: [
      { id: 'A', text: 'Mantener la constancia.', feedback: 'Vamos a crear un hábito placentero, no una obligación aburrida.' },
      { id: 'B', text: 'Perder peso y mantenerlo.', feedback: 'El efecto rebote termina cuando el metabolismo se estabiliza.' },
      { id: 'C', text: 'Seguir la dieta.', feedback: 'La alimentación es el 70% del resultado. ¡Vamos a facilitártelo!' },
      { id: 'D', text: 'Falta de tiempo en mi rutina.', feedback: 'Tu rutina dicta el entrenamiento, no al revés.' }
    ]
  },
  {
    id: 9,
    type: 'input_numeric',
    title: '¿Cuál es tu PESO actual?',
    description: 'No te preocupes, este dato es solo para el cálculo de metabolismo.',
    inputType: 'kg'
  },
  {
    id: 10,
    type: 'input_numeric',
    title: '¿Cuál es tu ESTATURA?',
    description: 'Esto nos ayuda a definir tu IMC ideal.',
    inputType: 'cm'
  },
  {
    id: 11,
    type: 'question',
    title: '¿Cuánto tiempo tienes para entrenar diariamente?',
    alternatives: [
      { id: 'A', text: 'Menos de 15 minutos.', feedback: '¡Perfecto! Tenemos protocolos "Exprés" de 12 minutos.' },
      { id: 'B', text: 'De 15 a 30 minutos.', feedback: 'El tiempo ideal para quemar grasa y tonificar.' },
      { id: 'C', text: 'Más de 30 minutos.', feedback: 'Genial, podremos incluir bonos de estiramiento y yoga.' }
    ]
  },
  {
    id: 12,
    type: 'question',
    title: '¿Cuántas veces por semana estás COMPROMETIDA a entrenar?',
    alternatives: [
      { id: 'A', text: '2-3 veces por semana.', feedback: '¡Constancia mínima que ya genera grandes resultados!' },
      { id: 'B', text: '3-4 veces por semana.', feedback: 'Ritmo excelente para una transformación acelerada.' },
      { id: 'C', text: '5 o más veces.', feedback: '¡Enfoque total! Serás una atleta de tu propia vida.' }
    ]
  },
  {
    id: 13,
    type: 'question',
    title: '¿Cuál de estos cuerpos se asemeja más al tuyo actualmente?',
    alternatives: [
      { id: 'A', text: 'Delgada', feedback: '¡Genial! Nos enfocaremos en definición y ganancia de masa magra.' },
      { id: 'B', text: 'Media', feedback: 'Perfecto para empezar a esculpir tus curvas ahora mismo.' },
      { id: 'C', text: 'Sobrepeso', feedback: 'Vamos a acelerar tu metabolismo para eliminar grasa rápido.' },
      { id: 'D', text: 'OBESIDAD ⚠️', feedback: 'Tu salud es nuestra prioridad total. ¡Vamos a transformar tu vida hoy!' }
    ]
  },
  {
    id: 14,
    type: 'image_select',
    title: '¿Cuál resultado te gustaría alcanzar de estos?',
    images: [
      'https://img.freepik.com/fotos-premium/mulher-magra-sexy-em-lingerie-branca-confortavel-olhando-para-a-camera-com-um-olhar-sedutor_615653-2177.jpg',
      'https://img.freepik.com/fotos-gratis/bela-mulher-de-lingerie-orgulhosa-do-seu-corpo_329181-16855.jpg?semt=ais_hybrid&w=740&q=80',
      'https://a-static.mlcdn.com.br/420x420/short-feminino-modelador-corpo-perfeito-c06f-fanaticos-por-cintas/fanaticosporcintasoficial/15976637388/1ba87b6e0317403fb33745e453d26f29.jpeg',
      'https://img.freepik.com/fotos-premium/mulher-forte-na-academia-dynamo-mulher-de-meia-idade-inspirando-conquistas-fitness_223582-2649.jpg'
    ]
  },
  {
    id: 15,
    type: 'analysis',
    title: 'Analizando tu Perfil...',
    description: 'Estamos cruzando tus datos con nuestra base de más de 10,000 alumnas latinas.'
  },
  {
    id: 16,
    type: 'approval',
    title: '¡HAS SIDO APROBADA!',
    description: 'Tu perfil es perfecto para nuestro Desafío de Tu Mejor Versión.'
  },
  {
    id: 17,
    type: 'projection',
    title: 'Tu Jornada de Transformación',
    description: 'Basado en tu peso y estatura, mira lo que podemos lograr en 21 días.'
  },
  {
    id: 18,
    type: 'social_proof',
    title: 'Resultados Reales de Mujeres Como Tú',
    description: 'Ellas también tenían poco tiempo, pero decidieron priorizar su salud.'
  },
  {
    id: 19,
    type: 'surprise',
    title: '¡Tenemos una Sorpresa para Ti!',
    description: 'Como forma de incentivo por haber llegado hasta aquí, preparamos algo especial.'
  },
  {
    id: 20,
    type: 'roulette',
    title: '¡Gira la Ruleta de la Suerte!',
    description: 'Tienes una oportunidad de ganar un descuento exclusivo ahora mismo.'
  },
  {
    id: 21,
    type: 'offer',
    title: 'Tu Nueva Vida Comienza Hoy',
    description: 'Acceso completo al Desafío de Tu Mejor Versión por un valor simbólico.'
  }
];
