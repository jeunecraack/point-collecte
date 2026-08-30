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
    majLe: (date: string, age: string) => `تم التحديث في ${date} — ${age}`,
    age: (j: number) => (j === 0 ? "اليوم" : j === 1 ? "أمس" : arN(j, "منذ يوم", "منذ يومين", "أيام مضت", "يوما مضى")),
    telephone: "الهاتف",
    itineraire: "المسار",
    ouvrirMaps: "افتح في خرائط Google",
    source: "المصدر",
    nPoints: (n: number) => arN(n, "نقطة جمع واحدة", "نقطتا جمع", "نقاط جمع", "نقطة جمع"),
    nPointsCourt: (n: number) => arN(n, "نقطة واحدة", "نقطتان", "نقاط", "نقطة"),
    nCommunes: (n: number) => arN(n, "بلدية واحدة", "بلديتان", "بلديات", "بلدية"),
    communeInconnue: "بلدية غير مذكورة",
    communes: "البلديات",
    aucunPoint: "لا توجد نقطة جمع مسجلة حاليا.",
    derniereMaj: (date: string) => `آخر تحديث في ${date}`,
    rienVerifie: (nom: string) => `لا توجد نقطة مسجلة في ${nom} حاليا`,
    silence: (nom: string) =>
      `لم يسجل المتطوعون بعد أي نقطة جمع في ${nom}. بدل أن نرسلك إلى عنوان غير موثوق، إليك من يمكنه توجيهك:`,
    protectionCivile: "الحماية المدنية",
    numeroVert: "الرقم الأخضر",
    croissantRouge: "اللجنة الولائية للهلال الأحمر الجزائري",
    croissantRougeNote: (nom: string) => `لجنة ${nom} تنسق التبرعات محليا.`,
    signalerA: (nom: string) => `أبلغ عن نقطة في ${nom}`,
    footerFiche: "تغير عنوان أو أُغلقت نقطة؟",
    signalezLe: "أبلغنا",
    titreWilaya: (nom: string) => `نقاط جمع التبرعات — ${nom}`,
    descWilaya: (n: number, nom: string, communes: string, date?: string) =>
      `${arN(n, "نقطة جمع واحدة", "نقطتا جمع", "نقاط جمع", "نقطة جمع")} في ${nom}${communes ? ` (${communes})` : ""}.${date ? ` آخر تحديث في ${date}.` : ""} عناوين وأرقام هواتف سجلها متطوعون.`,
    descWilayaVide: (nom: string) => `لا توجد نقطة جمع مسجلة في ${nom} حاليا. أرقام الطوارئ والتوجيه إلى الحماية المدنية.`,
    // accueil
    titreAccueil: "نقاط جمع التبرعات — حرائق الجزائر",
    descAccueil: "أين تودع تبرعاتك، الآن، في ولايتك. عناوين سجلها متطوعون، مؤرخة. أرقام الطوارئ.",
    eyebrow: "حرائق · تبرعات · الجزائر",
    h1: "أين تودع تبرعاتك، الآن.",
    lede: "عناوين سجلها متطوعون، على سبيل الإرشاد ودون ضمان: اتصل بالنقطة قبل التنقل. البطاقة المؤرخة منذ أكثر من 10 أيام تختفي تلقائيا.",
    couvertes: (n: number) => `الولايات المغطاة — ${n}`,
    aucuneCouverte: "لا توجد نقطة مسجلة حاليا. إن كنت تدير نقطة جمع،",
    poserQuestion: "اطرح سؤالا",
    poserQuestionNote: "«أين أودع في بجاية؟»، «ماذا أتبرع؟». اكتب ولايتك وسؤالك.",
    signalerPoint: "أبلغ عن نقطة",
    signalerPointNote: "تدير أو تعرف نقطة جمع؟ أضفها في دقيقة.",
    toutes58: "كل الولايات — 58",
    // assistant
    assistant: "المساعد",
    descAssistant: "اكتب ولايتك وسؤالك: نقاط الجمع، أرقام الطوارئ، التطوع.",
    suggestions: ["أرقام الطوارئ", "ماذا أتبرع؟", "أريد التطوع"],
    placeholder: "ولايتك، سؤالك…",
    envoyer: "إرسال",
    votreQuestion: "سؤالك",
    demandeWilaya: "قل لي ولايتك — اسمها أو رقمها: «بجاية»، «06»، «w15»…",
    urgenceReponse: "إن كنت في خطر، اتصل الآن:",
    pointsA: (n: number, nom: string) => `${arN(n, "نقطة جمع واحدة مسجلة", "نقطتا جمع مسجلتان", "نقاط جمع مسجلة", "نقطة جمع مسجلة")} في ${nom}:`,
    rienA: (nom: string) => `لا توجد نقطة مسجلة في ${nom} حاليا.`,
    quoiGenerique: "الأنفع عادة: مواد غذائية غير قابلة للتلف، ماء، أغطية، مواد نظافة، أدوية غير منتهية الصلاحية. اتصل بالنقطة قبل التنقل لتعرف ما ينقصها اليوم. ",
    argent: "لا نجمع المال ولا نعرض أي رقم حساب. للتبرع المالي، مر عبر الهلال الأحمر الجزائري أو هيئة رسمية، عبر قنواتهم هم — لا عبر حساب منشور على الشبكات الاجتماعية.",
    sang: "التبرع بالدم يكون عبر مركز حقن الدم (CTS) في ولايتك أو أقرب مستشفى. لا نعرض مواعيد جمع الدم.",
    benevole: "الأنفع: أن تتوجه مباشرة إلى نقطة جمع، فهي دائما بحاجة إلى سواعد. اللجنة الولائية للهلال الأحمر الجزائري تسجل المتطوعين أيضا. ",
    ajouter: "تعرف نقطة غير مدرجة، أو بطاقة تحتاج تصحيحا؟ استعمل الاستمارة.",
    pageWilaya: (nom: string) => `صفحة ${nom}`,
    // signaler
    titreSignaler: "أبلغ عن نقطة جمع",
    descSignaler: "اقترح نقطة جمع أو تصحيحا.",
    encartSignaler: "يراجع متطوع اقتراحك ثم ينشره كما هو. لا يتم أي تحقق في عين المكان: المعلومات تُنشر كما صرّح بها أصحابها، دون ضمان ولا مسؤولية.",
    recu: "تم الاستلام. سيراجع متطوع اقتراحك قبل نشره.",
    incomplet: "الاستمارة ناقصة: تحقق من الولاية واسم المكان والعنوان.",
    wilaya: "الولاية",
    choisir: "اختر…",
    commune: "البلدية",
    nomLieu: "اسم المكان",
    adresse: "العنوان",
    telPoint: "هاتف النقطة",
    facultatif: "(اختياري)",
    nom: "الاسم",
    envoyerVerif: "أرسل للتحقق",
    // 404
    erreur404: "خطأ 404",
    introuvable: "هذه الصفحة غير موجودة",
    introuvableNote: "ربما نُسخ العنوان خطأ. صفحات الولايات تُكتب برمز من رقمين: /06 لبجاية، /16 للجزائر.",
    changerLangue: "تغيير اللغة",
    horairesReponse: "لا نسجل أوقات الفتح: اتصل بالنقطة قبل التنقل. ",
    ajouterBientot: "الإبلاغ عن نقطة جديدة سيُفتح قريبا. في الأثناء، قل لي ولايتك لأدلك على النقاط المسجلة.",
    salutReponse: "مرحبا! قل لي ولايتك — اسمها أو رقمها — وأدلك على نقاط الجمع.",
    merciReponse: "على الرحب والسعة. اتصل بالنقطة قبل التنقل، وتضامنا مع الجميع.",
    pointsCommune: (n: number, commune: string, wilaya: string) => `${arN(n, "نقطة جمع واحدة مسجلة", "نقطتا جمع مسجلتان", "نقاط جمع مسجلة", "نقطة جمع مسجلة")} في ${commune} (${wilaya}):`,
    avertissement: "معلومات جمعها متطوعون وتُنشر على سبيل الإرشاد، دون أي ضمان أو مسؤولية. اتصل بالنقطة قبل التنقل.",
    modeSombre: "داكن",
    modeClair: "فاتح",
    // propositions contextuelles de l'assistant
    propWilaya: (nom: string) => [`ماذا أتبرع في ${nom}؟`, `أريد التطوع في ${nom}`, "أرقام الطوارئ"],
    propApresPoints: (nom: string) => [`ماذا أتبرع في ${nom}؟`, `أريد التطوع في ${nom}`, "أبلغ عن نقطة"],
    propApresVide: () => ["أبلغ عن نقطة", "أرقام الطوارئ"],
    propGenerales: () => ["ماذا أتبرع؟", "أريد التطوع", "أبلغ عن نقطة"],
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
    majLe: (date: string, age: string) => `Mis à jour le ${date} — ${age}`,
    age: (j: number) => (j === 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} j`),
    telephone: "Téléphone",
    itineraire: "Itinéraire",
    ouvrirMaps: "Ouvrir dans Google Maps",
    source: "Source",
    nPoints: (n: number) => `${n} point${n > 1 ? "s" : ""} de collecte`,
    nPointsCourt: (n: number) => `${n} point${n > 1 ? "s" : ""}`,
    nCommunes: (n: number) => `${n} commune${n > 1 ? "s" : ""}`,
    communeInconnue: "Commune non renseignée",
    communes: "Communes",
    aucunPoint: "Aucun point de collecte recensé pour l'instant.",
    derniereMaj: (date: string) => `dernière mise à jour le ${date}`,
    rienVerifie: (nom: string) => `Aucun point recensé à ${nom} pour l'instant`,
    silence: (nom: string) =>
      `Les bénévoles n'ont encore recensé aucun point de collecte à ${nom}. Plutôt que de vous envoyer vers une adresse incertaine, voici qui peut vous orienter :`,
    protectionCivile: "Protection civile",
    numeroVert: "numéro vert",
    croissantRouge: "Comité de wilaya du Croissant-Rouge algérien",
    croissantRougeNote: (nom: string) => `le comité de ${nom} coordonne les dons localement.`,
    signalerA: (nom: string) => `Signaler un point à ${nom}`,
    footerFiche: "Une adresse a changé, un point a fermé ?",
    signalezLe: "Signalez-le",
    titreWilaya: (nom: string) => `Points de collecte de dons — ${nom}`,
    descWilaya: (n: number, nom: string, communes: string, date?: string) =>
      `${n} point${n > 1 ? "s" : ""} de collecte à ${nom}${communes ? ` (${communes})` : ""}.${date ? ` Dernière mise à jour le ${date}.` : ""} Adresses et téléphones recensés par des bénévoles.`,
    descWilayaVide: (nom: string) => `Aucun point de collecte recensé à ${nom} pour l'instant. Numéros d'urgence et orientation vers la Protection civile.`,
    titreAccueil: "Points de collecte de dons — incendies Algérie",
    descAccueil: "Où déposer ses dons, maintenant, dans sa wilaya. Adresses recensées par des bénévoles, datées. Numéros d'urgence.",
    eyebrow: "Incendies · dons · Algérie",
    h1: "Où déposer vos dons, maintenant.",
    lede: "Adresses recensées par des bénévoles, à titre indicatif et sans garantie : appelez le point avant de vous déplacer. Une fiche datée de plus de 10 jours disparaît d'elle-même.",
    couvertes: (n: number) => `Wilayas couvertes — ${n}`,
    aucuneCouverte: "Aucun point recensé pour l'instant. Si vous tenez un point de collecte,",
    poserQuestion: "Poser une question",
    poserQuestionNote: "« Où déposer à Béjaïa ? », « quoi donner ? ». Écrivez votre wilaya et votre question.",
    signalerPoint: "Signaler un point",
    signalerPointNote: "Vous tenez ou connaissez un point de collecte ? Ajoutez-le en une minute.",
    toutes58: "Toutes les wilayas — 58",
    assistant: "Assistant",
    descAssistant: "Écrivez votre wilaya et votre question : points de collecte, numéros d'urgence, bénévolat.",
    suggestions: ["Numéros d'urgence", "Quoi donner ?", "Je veux être bénévole"],
    placeholder: "Votre wilaya, votre question…",
    envoyer: "Envoyer",
    votreQuestion: "Votre question",
    demandeWilaya: "Dites-moi votre wilaya — son nom ou son numéro : « Béjaïa », « 06 », « w15 »…",
    urgenceReponse: "Si vous êtes en danger, appelez maintenant :",
    pointsA: (n: number, nom: string) => `${n} point${n > 1 ? "s" : ""} de collecte recensé${n > 1 ? "s" : ""} à ${nom} :`,
    rienA: (nom: string) => `Aucun point recensé à ${nom} pour l'instant.`,
    quoiGenerique: "Le plus utile en général : denrées non périssables, eau, couvertures, produits d'hygiène, médicaments non périmés. Appelez le point avant de vous déplacer pour savoir ce qui lui manque aujourd'hui. ",
    argent: "Nous ne collectons pas d'argent et n'affichons aucun numéro de compte. Pour un don financier, passez par le Croissant-Rouge algérien ou un organisme officiel, via leurs canaux à eux — jamais via un compte partagé sur les réseaux sociaux.",
    sang: "Le don de sang passe par le centre de transfusion sanguine (CTS) de votre wilaya ou l'hôpital le plus proche. Nous n'affichons pas de créneaux de collecte de sang.",
    benevole: "Le plus utile : vous présenter directement à un point de collecte, ils manquent toujours de bras. Le comité de wilaya du Croissant-Rouge algérien inscrit aussi des volontaires. ",
    ajouter: "Vous connaissez un point qui n'est pas listé, ou une fiche à corriger ? Passez par le formulaire.",
    pageWilaya: (nom: string) => `Page ${nom}`,
    titreSignaler: "Signaler un point de collecte",
    descSignaler: "Proposez un point de collecte ou une correction.",
    encartSignaler: "Un bénévole relit votre proposition puis la publie telle quelle. Aucune vérification sur place : les informations sont publiées comme déclarées, sans garantie ni responsabilité.",
    recu: "Reçu. Un bénévole relit votre proposition avant publication.",
    incomplet: "Le formulaire est incomplet : vérifiez la wilaya, le nom du lieu et l'adresse.",
    wilaya: "Wilaya",
    choisir: "Choisir…",
    commune: "Commune",
    nomLieu: "Nom du lieu",
    adresse: "Adresse",
    telPoint: "Téléphone du point",
    facultatif: "(facultatif)",
    nom: "Nom",
    envoyerVerif: "Envoyer pour vérification",
    erreur404: "Erreur 404",
    introuvable: "Cette page n'existe pas",
    introuvableNote: "L'adresse a peut-être été mal copiée. Les pages wilaya s'écrivent avec le code à deux chiffres : /06 pour Béjaïa, /16 pour Alger.",
    changerLangue: "Changer de langue",
    horairesReponse: "Les horaires d'ouverture ne sont pas recensés : appelez le point avant de vous déplacer. ",
    ajouterBientot: "Le signalement d'un nouveau point ouvrira bientôt. En attendant, dites-moi votre wilaya et je vous indique les points recensés.",
    salutReponse: "Bonjour ! Dites-moi votre wilaya — son nom ou son numéro — et je vous indique les points de collecte.",
    merciReponse: "Avec plaisir. Appelez le point avant de vous déplacer, et bon courage.",
    pointsCommune: (n: number, commune: string, wilaya: string) => `${n} point${n > 1 ? "s" : ""} de collecte recensé${n > 1 ? "s" : ""} à ${commune} (${wilaya}) :`,
    avertissement: "Informations recensées par des bénévoles et publiées à titre indicatif, sans garantie ni responsabilité. Appelez le point avant de vous déplacer.",
    modeSombre: "Sombre",
    modeClair: "Clair",
    propWilaya: (nom: string) => [`Quoi donner à ${nom} ?`, `Je veux être bénévole à ${nom}`, "Numéros d'urgence"],
    propApresPoints: (nom: string) => [`Quoi donner à ${nom} ?`, `Je veux être bénévole à ${nom}`, "Signaler un point"],
    propApresVide: () => ["Signaler un point", "Numéros d'urgence"],
    propGenerales: () => ["Quoi donner ?", "Je veux être bénévole", "Signaler un point"],
  },
} as const satisfies Record<Lang, unknown>;

export type Dict = (typeof T)["ar"] | (typeof T)["fr"];
export const t = (l: Lang): Dict => T[l];
/** Nom de la wilaya dans la langue de la page. */
export const nomWilaya = (l: Lang, w: { nom: string; nomAr: string }) => (l === "ar" ? w.nomAr : w.nom);
