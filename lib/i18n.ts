import { useS } from "./store";
const D: Record<string, string[]> = {
  "Accueil": ["Home", "Inicio", "Start"], "Parler à Bobby": ["Talk to Bobby", "Hablar con Bobby", "Mit Bobby sprechen"],
  "Analyse texte": ["Text analysis", "Análisis de texto", "Textanalyse"], "Analyse site web": ["Website analysis", "Análisis de sitio web", "Website-Analyse"],
  "Analyse image": ["Image analysis", "Análisis de imagen", "Bildanalyse"], "Analyse QR code": ["QR code analysis", "Análisis de código QR", "QR-Code-Analyse"],
  "Protection appels": ["Call protection", "Protección de llamadas", "Anrufschutz"], "Centre des menaces": ["Threat center", "Centro de amenazas", "Bedrohungszentrum"],
  "Famille": ["Family", "Familia", "Familie"], "Communauté": ["Community", "Comunidad", "Gemeinschaft"], "Réglages": ["Settings", "Ajustes", "Einstellungen"],
  "Votre tableau de bord": ["Your dashboard", "Su panel", "Ihr Dashboard"], "Posez-moi vos questions": ["Ask me anything", "Hágame preguntas", "Stellen Sie mir Fragen"],
  "SMS, mails, WhatsApp": ["SMS, emails, WhatsApp", "SMS, correos, WhatsApp", "SMS, E-Mails, WhatsApp"], "Ce site est-il fiable ?": ["Is this site trustworthy?", "¿Es fiable este sitio?", "Ist diese Seite vertrauenswürdig?"],
  "Capture d'écran, photo": ["Screenshot, photo", "Captura, foto", "Screenshot, Foto"], "Où mène ce code ?": ["Where does this code lead?", "¿A dónde lleva este código?", "Wohin führt dieser Code?"],
  "Qui vous appelle ?": ["Who is calling you?", "¿Quién le llama?", "Wer ruft an?"], "Reconnaître les arnaques": ["Spot scams", "Reconocer estafas", "Betrug erkennen"],
  "Protéger vos proches": ["Protect your loved ones", "Proteja a los suyos", "Schützen Sie Ihre Liebsten"], "Signalements en direct": ["Live reports", "Avisos en directo", "Live-Meldungen"], "Personnaliser Bobby": ["Customize Bobby", "Personalizar Bobby", "Bobby anpassen"],
  "Bonjour, je suis Bobby.": ["Hello, I'm Bobby.", "Hola, soy Bobby.", "Hallo, ich bin Bobby."], "Je vérifie ce qui mérite votre confiance.": ["I check what deserves your trust.", "Compruebo lo que merece su confianza.", "Ich prüfe, was Ihr Vertrauen verdient."],
  "Score de confiance": ["Trust score", "Puntuación de confianza", "Vertrauenswert"], "Protégé aujourd'hui": ["Protected today", "Protegido hoy", "Heute geschützt"], "Menaces bloquées": ["Threats blocked", "Amenazas bloqueadas", "Bedrohungen blockiert"], "Alertes communauté": ["Community alerts", "Alertas de la comunidad", "Community-Warnungen"],
  "Menaces repérées cette semaine": ["Threats spotted this week", "Amenazas detectadas esta semana", "Diese Woche erkannte Bedrohungen"], "Voir": ["See", "Ver", "Ansehen"],
  "Personnalisez Bobby comme vous le souhaitez.": ["Customize Bobby as you like.", "Personalice Bobby a su gusto.", "Passen Sie Bobby nach Wunsch an."], "Langue": ["Language", "Idioma", "Sprache"],
  "Notifications d'alerte": ["Alert notifications", "Notificaciones de alerta", "Warnmeldungen"], "Confidentialité renforcée (rien n'est envoyé)": ["Enhanced privacy (nothing is sent)", "Privacidad reforzada (no se envía nada)", "Erhöhter Datenschutz (nichts wird gesendet)"],
  "Bobby parle sur tous les écrans": ["Bobby speaks on every screen", "Bobby habla en todas las pantallas", "Bobby spricht auf allen Bildschirmen"],
  "Thème": ["Theme", "Tema", "Design"], "Sombre": ["Dark", "Oscuro", "Dunkel"], "Clair": ["Light", "Claro", "Hell"], "Niveau de sécurité": ["Security level", "Nivel de seguridad", "Sicherheitsstufe"],
  "À propos de Bobby One": ["About Bobby One", "Acerca de Bobby One", "Über Bobby One"],
  "Le menu et les écrans principaux changent de langue. Les analyses de Bobby restent en français pour le moment.": ["The menu and main screens change language. Bobby's analyses stay in French for now.", "El menú y las pantallas principales cambian de idioma. Los análisis de Bobby siguen en francés por ahora.", "Menü und Hauptbildschirme wechseln die Sprache. Bobbys Analysen bleiben vorerst auf Französisch."],
};
const IDX: Record<string, number> = { English: 0, Español: 1, Deutsch: 2 };
export const tr = (l: string, s: string) => { const i = IDX[l]; return i === undefined ? s : D[s]?.[i] ?? s; };
export const useT = () => { const l = useS((s) => s.settings.lang); return (s: string) => tr(l, s); };
