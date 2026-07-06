// Envoi des notifications programmées — exécuté par GitHub Actions toutes les 15 min.
// Il compare l'heure de Paris aux créneaux ci-dessous et envoie la notification correspondante.
// ✏️ MODIFIE LES CRÉNEAUX ICI (jour: 0=dimanche, 1=lundi ... 6=samedi · heure/minute = heure de Paris)

const SLOTS = [
  { day: 1, h: 8,  m: 17, title: '⚖️ Pesée du lundi',    body: "À jeun, après les toilettes. Note-la dans l'appli !" },
  { day: 3, h: 8,  m: 17, title: '⚖️ Pesée du mercredi', body: "À jeun, après les toilettes. Note-la dans l'appli !" },
  { day: 5, h: 8,  m: 17, title: '⚖️ Pesée du vendredi', body: '3ᵉ pesée → va voir ton bloc Analyse & conseil 🧠' },
  { day: 1, h: 19, m: 15, title: '🏋️ Séance FORCE ce soir', body: "Clôture d'abord ta semaine dans l'appli, puis découvre tes nouvelles cibles." },
  { day: 3, h: 19, m: 15, title: '💪 Séance VOLUME ce soir', body: 'RIR 2-3 : garde 2-3 reps en réserve sur chaque série.' },
  { day: 5, h: 19, m: 15, title: '🤸 Séance poids du corps ce soir', body: "Trio + jambes + lombaires. N'oublie pas les mollets (tibias !)." },
  { day: 6, h: 9,  m: 0,  id: 'course', title: '🏃 Course aujourd\'hui', body: "Quand tu veux dans la journée. Regarde dans l'appli si c'est semaine EF ou VMA. Échauffement 15 min !" }
];

// 🏃 TEST DEMI-COOPER : rappel le samedi, tous les 70 jours (≈ une décharge sur deux)
// à partir de la date d'ancrage ci-dessous. ✏️ Change l'ancre si ton cycle se décale.
const COOPER = { anchor: '2026-07-11', everyDays: 70, title: '⏱️ Test VMA aujourd\'hui — demi-Cooper',
  body: 'Échauffement 15 min puis 6 minutes à fond : note ta distance dans l\'appli (bloc Test VMA). Il remplace ta course du jour.' };

const TOLERANCE_MIN = 14; // le cron passe toutes les 15 min

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const VAPID_PUBLIC = 'BPt5r_nKe0wyU4sm6IzXkQxXaynMBr-ZbE9wlNEOqc8BKWOYcYF9P47PIAY2eGKG6JAZ15YV_lMhj3rlq9sK-DI';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PRIVATE){ console.error('❌ Secret VAPID_PRIVATE_KEY manquant (Settings → Secrets → Actions).'); process.exit(1); }

webpush.setVapidDetails('mailto:ms.digitalconnect75@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

// Heure et date actuelles à Paris (gère été/hiver automatiquement)
const now = new Date();
const parts = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
}).formatToParts(now);
const get = t => parts.find(p => p.type === t).value;
const dayMap = { 'dim.': 0, 'lun.': 1, 'mar.': 2, 'mer.': 3, 'jeu.': 4, 'ven.': 5, 'sam.': 6 };
const day = dayMap[get('weekday')];
const nowMin = parseInt(get('hour')) * 60 + parseInt(get('minute'));

function isCooperDay(){
  const dstr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now); // AAAA-MM-JJ à Paris
  const diffDays = Math.round((new Date(dstr) - new Date(COOPER.anchor)) / 864e5);
  return diffDays >= 0 && diffDays % COOPER.everyDays === 0;
}

let slot = SLOTS.find(s => s.day === day && nowMin >= s.h*60 + s.m && nowMin < s.h*60 + s.m + TOLERANCE_MIN);
if (slot && slot.id === 'course' && isCooperDay()){
  slot = { ...slot, title: COOPER.title, body: COOPER.body };
}
if (!slot){ console.log('Aucun créneau à envoyer (Paris : jour ' + day + ', ' + get('hour') + 'h' + get('minute') + ').'); process.exit(0); }

const subs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'subs.json'), 'utf8'));
if (!subs.length){ console.log("subs.json est vide — active les notifications dans l'appli et colle ton abonnement."); process.exit(0); }

(async () => {
  console.log('📤 Envoi : "' + slot.title + '" à ' + subs.length + ' appareil(s)...');
  for (const sub of subs){
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title: slot.title, body: slot.body, tag: 'cf-' + slot.day + '-' + slot.h }));
      console.log('  ✅ envoyé');
    } catch (err) {
      console.log('  ⚠️ échec (' + err.statusCode + ') — si 404/410, cet abonnement est expiré : retire-le de subs.json');
    }
  }
})();
