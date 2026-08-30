/**
 * Arabe d'abord : `/…` est en arabe (RTL), `/fr/…` en français.
 * Aucune détection automatique : l'URL fait foi, la bascule est un simple lien.
 */
export type Lang = "ar" | "fr";
export const LANGS: Lang[] = ["ar", "fr"];
export const dir = (l: Lang) => (l === "ar" ? "rtl" : "ltr");
export const prefixe = (l: Lang) => (l === "fr" ? "/fr" : "");
/** Chemin sans préfixe de langue → chemin dans la langue demandée. */
export const lien = (l: Lang, chemin: string) => `${prefixe(l)}${chemin === "/" && l === "fr" ? "" : chemin}` || "/";
export const autre = (l: Lang): Lang => (l === "ar" ? "fr" : "ar");

/**
 * Classes d'étiquette : mono, capitales et espacement en français ; en arabe, sans-serif sans
 * espacement — le letter-spacing déconnecte les lettres, la mono casse la ligature.
 */
export const etq = (l: Lang) => (l === "ar" ? "font-sans" : "font-mono uppercase tracking-wider");
export const etqLarge = (l: Lang) => (l === "ar" ? "font-sans" : "font-mono uppercase tracking-widest");
/** Texte de données (pastilles, compteurs) : mono en français, sans en arabe ; chiffres tabulaires dans les deux cas. */
export const data = (l: Lang) => (l === "ar" ? "font-sans tabular-nums" : "font-mono");

/** Pluriel arabe : 1, 2, 3–10, 11+. */
const arN = (n: number, un: string, deux: string, peu: string, beaucoup: string) =>
  n === 1 ? un : n === 2 ? deux : n <= 10 ? `${n} ${peu}` : `${n} ${beaucoup}`;

export const dateLoc = (l: Lang, iso: string) =>
  new Date(iso).toLocaleDateString(l === "ar" ? "ar-DZ" : "fr-DZ", { day: "numeric", month: "long" });

export const T = {
  ar: {
    langue: "عربي",
    marque: "نقاط الجمع",
    toutesWilayas: "كل الولايات",
    urgenceTitre: "طوارئ — اتصل قبل كل شيء",
    urgences: [
      { num: "14", nom: "الحماية المدنية", note: "حرائق — الرقم الأخضر 1021" },
      { num: "16", nom: "الإسعاف الطبي (SAMU)", note: "" },
      { num: "17", nom: "نجدة الشرطة", note: "الرقم الأخضر 1548" },
      { num: "1055", nom: "الدرك الوطني", note: "" },
    ],
    verifieLe: (date: string, age: string) => `تم التحقق في ${date} — ${age}`,
    age: (j: number) => (j === 0 ? "اليوم" : j === 1 ? "أمس" : arN(j, "منذ يوم", "منذ يومين", "أيام مضت", "يوما مضى")),
    nonDate: "تاريخ التحقق غير مذكور",
    agree: "معتمدة من الدولة",
    horaires: "الأوقات",
    telephone: "الهاتف",
    itineraire: "المسار",
    ouvrirMaps: "افتح في خرائط Google",
    besoins: "الاحتياجات",
    source: "المصدر",
    nPoints: (n: number) => arN(n, "نقطة جمع واحدة", "نقطتا جمع", "نقاط جمع", "نقطة جمع"),
    nPointsCourt: (n: number) => arN(n, "نقطة واحدة", "نقطتان", "نقاط", "نقطة"),
    nCommunes: (n: number) => arN(n, "بلدية واحدة", "بلديتان", "بلديات", "بلدية"),
    communeInconnue: "بلدية غير مذكورة",
    communes: "البلديات",
    aucunPoint: "لا توجد نقطة جمع مؤكدة حاليا.",
    derniereVerif: (date: string) => `آخر تحقق في ${date}`,
    rienVerifie: (nom: string) => `لا شيء مؤكد في ${nom} حاليا`,
    silence: (nom: string) =>
      `لا ننشر إلا النقاط المؤكدة هاتفيا. ما دام لم يتحقق أي متطوع من نقطة في ${nom}، لا شيء يُعرض هنا — بدل أن نرسلك إلى عنوان غير مؤكد.`,
    protectionCivile: "الحماية المدنية",
    numeroVert: "الرقم الأخضر",
    croissantRouge: "اللجنة الولائية للهلال الأحمر الجزائري",
    croissantRougeNote: (nom: string) => `لجنة ${nom} تنسق التبرعات محليا.`,
    signalerA: (nom: string) => `أبلغ عن نقطة في ${nom}`,
    rappelAvantPublication: "نتصل بك للتحقق قبل النشر.",
    footerFiche: "تغير عنوان أو أُغلقت نقطة؟",
    signalezLe: "أبلغنا",
    rienSansAppel: "لا يُنشر شيء دون مكالمة تحقق.",
    titreWilaya: (nom: string) => `نقاط جمع التبرعات — ${nom}`,
    descWilaya: (n: number, nom: string, communes: string, date?: string) =>
      `${arN(n, "نقطة جمع واحدة", "نقطتا جمع", "نقاط جمع", "نقطة جمع")} في ${nom}${communes ? ` (${communes})` : ""}.${date ? ` آخر تحقق في ${date}.` : ""} عناوين وأرقام هواتف.`,
    descWilayaVide: (nom: string) => `لا توجد نقطة جمع مؤكدة في ${nom} حاليا. أرقام الطوارئ والتوجيه إلى الحماية المدنية.`,
    // accueil
    titreAccueil: "نقاط جمع التبرعات — حرائق الجزائر",
    descAccueil: "أين تودع تبرعاتك، الآن، في ولايتك. عناوين مؤكدة هاتفيا ومؤرخة. أرقام الطوارئ.",
    eyebrow: "حرائق · تبرعات · الجزائر",
    h1: "أين تودع تبرعاتك، الآن.",
    lede: "كل عنوان أدناه تم تأكيده بمكالمة، ويحمل تاريخه. البطاقة المؤرخة منذ أكثر من 10 أيام تختفي تلقائيا. لا لقطات شاشة، لا «قيل لي».",
    couvertes: (n: number) => `الولايات المغطاة — ${n}`,
    aucuneCouverte: "لا توجد نقطة مؤكدة حاليا. إن كنت تدير نقطة جمع،",
    jauge: (part: number, r: number, t: number) => `${part}٪ من البطاقات تم التحقق منها منذ أقل من 48 ساعة (${r}/${t}).`,
    poserQuestion: "اطرح سؤالا",
    poserQuestionNote: "«أين أودع في بجاية؟»، «ماذا أتبرع؟». المساعد يتعرف على ولايتك وحاجتك — دون ذكاء اصطناعي، دون اختلاق.",
    signalerPoint: "أبلغ عن نقطة",
    signalerPointNote: "تدير أو تعرف نقطة جمع. نتصل بك قبل النشر.",
    toutes58: "كل الولايات — 58",
    // assistant
    assistant: "المساعد",
    sansIA: "دون ذكاء اصطناعي",
    introAssistant: "أتعرف على ولايتك وما تبحث عنه، ولا أجيب إلا ببطاقات مؤكدة. لا أختلق شيئا: إن لم تكن المعلومة عندي، أقول لك ذلك.",
    suggestions: ["أين أودع في بجاية؟", "ماذا أتبرع؟", "أرقام الطوارئ", "أريد التطوع"],
    placeholder: "ولايتك، سؤالك…",
    envoyer: "إرسال",
    votreQuestion: "سؤالك",
    demandeWilaya: "قل لي ولايتك — اسمها أو رقمها: «بجاية»، «06»، «w15»…",
    urgenceReponse: "إن كنت في خطر، اتصل الآن:",
    pointsA: (n: number, nom: string) => `${arN(n, "نقطة جمع واحدة مؤكدة", "نقطتا جمع مؤكدتان", "نقاط جمع مؤكدة", "نقطة جمع مؤكدة")} في ${nom}:`,
    rienA: (nom: string) => `لا شيء مؤكد في ${nom} حاليا.`,
    besoinsA: (nom: string, liste: string) => `الاحتياجات المسجلة في ${nom}: ${liste}. التفاصيل حسب النقطة:`,
    quoiGenerique: "كل بطاقة تذكر احتياجات اليوم — تتغير بسرعة، فاعتمد على البطاقة لا على قائمة عامة. ",
    argent: "لا نجمع المال ولا نعرض أي رقم حساب. للتبرع المالي، مر عبر الهلال الأحمر الجزائري أو هيئة رسمية، عبر قنواتهم هم — لا عبر حساب منشور على الشبكات الاجتماعية.",
    sang: "التبرع بالدم يكون عبر مركز حقن الدم (CTS) في ولايتك أو أقرب مستشفى. لا نعرض مواعيد جمع الدم.",
    benevole: "الأنفع: أن تتوجه مباشرة إلى نقطة جمع، فهي دائما بحاجة إلى سواعد. اللجنة الولائية للهلال الأحمر الجزائري تسجل المتطوعين أيضا. ",
    ajouter: "تعرف نقطة غير مدرجة، أو بطاقة تحتاج تصحيحا؟ استعمل الاستمارة — نتصل بك للتحقق قبل النشر.",
    pageWilaya: (nom: string) => `صفحة ${nom}`,
    // signaler
    titreSignaler: "أبلغ عن نقطة جمع",
    descSignaler: "اقترح نقطة جمع أو تصحيحا. لا يُنشر شيء دون مكالمة تحقق.",
    encartSignaler: "يتصل متطوع بالشخص المذكور أدناه، يؤكد العنوان والأوقات، وعندها فقط تظهر البطاقة على الموقع.",
    recu: "تم الاستلام. نتصل بك للتحقق قبل أي نشر.",
    incomplet: "الاستمارة ناقصة: تحقق من الولاية واسم المكان والعنوان والشخص الذي نتصل به.",
    wilaya: "الولاية",
    choisir: "اختر…",
    commune: "البلدية",
    nomLieu: "اسم المكان",
    adresse: "العنوان",
    telPoint: "هاتف النقطة",
    facultatif: "(اختياري)",
    besoinsVirgules: "(مفصولة بفواصل)",
    personneSurPlace: "الشخص الذي يجيب في المكان",
    personneNote: "نتصل به هو. رقمه لا يُنشر أبدا.",
    nom: "الاسم",
    envoyerVerif: "أرسل للتحقق",
    // 404
    erreur404: "خطأ 404",
    introuvable: "هذه الصفحة غير موجودة",
    introuvableNote: "ربما نُسخ العنوان خطأ. صفحات الولايات تُكتب برمز من رقمين: /06 لبجاية، /16 للجزائر.",
    changerLangue: "تغيير اللغة",
  },
  fr: {
    langue: "FR",
    marque: "Points de collecte",
    toutesWilayas: "Toutes les wilayas",
    urgenceTitre: "Urgence — appeler avant tout",
    urgences: [
      { num: "14", nom: "Protection civile", note: "incendies — numéro vert 1021" },
      { num: "16", nom: "SAMU", note: "" },
      { num: "17", nom: "Police secours", note: "numéro vert 1548" },
      { num: "1055", nom: "Gendarmerie nationale", note: "" },
    ],
    verifieLe: (date: string, age: string) => `Vérifié le ${date} — ${age}`,
    age: (j: number) => (j === 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} j`),
    nonDate: "Date de vérification non renseignée",
    agree: "Agréé par l'État",
    horaires: "Horaires",
    telephone: "Téléphone",
    itineraire: "Itinéraire",
    ouvrirMaps: "Ouvrir dans Google Maps",
    besoins: "Besoins",
    source: "Source",
    nPoints: (n: number) => `${n} point${n > 1 ? "s" : ""} de collecte`,
    nPointsCourt: (n: number) => `${n} point${n > 1 ? "s" : ""}`,
    nCommunes: (n: number) => `${n} commune${n > 1 ? "s" : ""}`,
    communeInconnue: "Commune non renseignée",
    communes: "Communes",
    aucunPoint: "Aucun point de collecte vérifié pour l'instant.",
    derniereVerif: (date: string) => `dernière vérification le ${date}`,
    rienVerifie: (nom: string) => `Rien de vérifié à ${nom} pour l'instant`,
    silence: (nom: string) =>
      `On ne publie que des points confirmés par téléphone. Tant qu'aucun bénévole n'a vérifié un point à ${nom}, il n'y a rien à afficher ici — plutôt que de vous envoyer vers une adresse incertaine.`,
    protectionCivile: "Protection civile",
    numeroVert: "numéro vert",
    croissantRouge: "Comité de wilaya du Croissant-Rouge algérien",
    croissantRougeNote: (nom: string) => `le comité de ${nom} coordonne les dons localement.`,
    signalerA: (nom: string) => `Signaler un point à ${nom}`,
    rappelAvantPublication: "On vous rappelle pour vérifier avant de publier.",
    footerFiche: "Une adresse a changé, un point a fermé ?",
    signalezLe: "Signalez-le",
    rienSansAppel: "Rien n'est publié sans un appel de vérification.",
    titreWilaya: (nom: string) => `Points de collecte de dons — ${nom}`,
    descWilaya: (n: number, nom: string, communes: string, date?: string) =>
      `${n} point${n > 1 ? "s" : ""} de collecte à ${nom}${communes ? ` (${communes})` : ""}.${date ? ` Dernière vérification le ${date}.` : ""} Adresses et téléphones.`,
    descWilayaVide: (nom: string) => `Aucun point de collecte vérifié à ${nom} pour l'instant. Numéros d'urgence et orientation vers la Protection civile.`,
    titreAccueil: "Points de collecte de dons — incendies Algérie",
    descAccueil: "Où déposer ses dons, maintenant, dans sa wilaya. Adresses vérifiées par téléphone et datées. Numéros d'urgence.",
    eyebrow: "Incendies · dons · Algérie",
    h1: "Où déposer vos dons, maintenant.",
    lede: "Chaque adresse ci-dessous a été confirmée par un appel, et porte sa date. Une fiche datée de plus de 10 jours disparaît d'elle-même. Pas de capture d'écran, pas de « on m'a dit ».",
    couvertes: (n: number) => `Wilayas couvertes — ${n}`,
    aucuneCouverte: "Aucun point vérifié pour l'instant. Si vous tenez un point de collecte,",
    jauge: (part: number, r: number, t: number) => `${part} % des fiches vérifiées depuis moins de 48 h (${r}/${t}).`,
    poserQuestion: "Poser une question",
    poserQuestionNote: "« Où déposer à Béjaïa ? », « quoi donner ? ». L'assistant reconnaît votre wilaya et votre besoin — sans IA, sans inventer.",
    signalerPoint: "Signaler un point",
    signalerPointNote: "Vous tenez ou connaissez un point de collecte. On vous rappelle avant de publier.",
    toutes58: "Toutes les wilayas — 58",
    assistant: "Assistant",
    sansIA: "sans IA",
    introAssistant: "Je reconnais votre wilaya et ce que vous cherchez, et je ne réponds qu'avec des fiches vérifiées. Je n'invente rien : si je n'ai pas l'information, je vous le dis.",
    suggestions: ["Où déposer à Béjaïa ?", "Quoi donner ?", "Numéros d'urgence", "Je veux être bénévole"],
    placeholder: "Votre wilaya, votre question…",
    envoyer: "Envoyer",
    votreQuestion: "Votre question",
    demandeWilaya: "Dites-moi votre wilaya — son nom ou son numéro : « Béjaïa », « 06 », « w15 »…",
    urgenceReponse: "Si vous êtes en danger, appelez maintenant :",
    pointsA: (n: number, nom: string) => `${n} point${n > 1 ? "s" : ""} de collecte vérifié${n > 1 ? "s" : ""} à ${nom} :`,
    rienA: (nom: string) => `Rien de vérifié à ${nom} pour l'instant.`,
    besoinsA: (nom: string, liste: string) => `Besoins signalés à ${nom} : ${liste}. Le détail par point :`,
    quoiGenerique: "Chaque fiche liste ses besoins du jour — ils changent vite, fiez-vous à la fiche plutôt qu'à une liste générale. ",
    argent: "Nous ne collectons pas d'argent et n'affichons aucun numéro de compte. Pour un don financier, passez par le Croissant-Rouge algérien ou un organisme officiel, via leurs canaux à eux — jamais via un compte partagé sur les réseaux sociaux.",
    sang: "Le don de sang passe par le centre de transfusion sanguine (CTS) de votre wilaya ou l'hôpital le plus proche. Nous n'affichons pas de créneaux de collecte de sang.",
    benevole: "Le plus utile : vous présenter directement à un point de collecte, ils manquent toujours de bras. Le comité de wilaya du Croissant-Rouge algérien inscrit aussi des volontaires. ",
    ajouter: "Vous connaissez un point qui n'est pas listé, ou une fiche à corriger ? Passez par le formulaire — on vous rappelle pour vérifier avant de publier.",
    pageWilaya: (nom: string) => `Page ${nom}`,
    titreSignaler: "Signaler un point de collecte",
    descSignaler: "Proposez un point de collecte ou une correction. Rien n'est publié sans un appel de vérification.",
    encartSignaler: "Un bénévole rappelle la personne indiquée ci-dessous, confirme l'adresse et les horaires, puis seulement la fiche apparaît sur le site.",
    recu: "Reçu. On vous rappelle pour vérifier avant toute publication.",
    incomplet: "Le formulaire est incomplet : vérifiez la wilaya, le nom du lieu, l'adresse et la personne à rappeler.",
    wilaya: "Wilaya",
    choisir: "Choisir…",
    commune: "Commune",
    nomLieu: "Nom du lieu",
    adresse: "Adresse",
    telPoint: "Téléphone du point",
    facultatif: "(facultatif)",
    besoinsVirgules: "(séparés par des virgules)",
    personneSurPlace: "Personne qui répond sur place",
    personneNote: "C'est elle qu'on rappelle. Son numéro n'est jamais publié.",
    nom: "Nom",
    envoyerVerif: "Envoyer pour vérification",
    erreur404: "Erreur 404",
    introuvable: "Cette page n'existe pas",
    introuvableNote: "L'adresse a peut-être été mal copiée. Les pages wilaya s'écrivent avec le code à deux chiffres : /06 pour Béjaïa, /16 pour Alger.",
    changerLangue: "Changer de langue",
  },
} as const satisfies Record<Lang, unknown>;

export type Dict = (typeof T)["ar"] | (typeof T)["fr"];
export const t = (l: Lang): Dict => T[l];
/** Nom de la wilaya dans la langue de la page. */
export const nomWilaya = (l: Lang, w: { nom: string; nomAr: string }) => (l === "ar" ? w.nomAr : w.nom);
