export type Wilaya = {
  code: string;
  nom: string;
  nomAr: string;
  alias: string[];
};

const RAW: [string, string, string, string][] = [
  ["01", "Adrar", "أدرار", ""],
  ["02", "Chlef", "الشلف", "ech cheliff|el asnam"],
  ["03", "Laghouat", "الأغواط", ""],
  ["04", "Oum El Bouaghi", "أم البواقي", "oum bouaghi"],
  ["05", "Batna", "باتنة", ""],
  ["06", "Béjaïa", "بجاية", "bgayet|vgayet|bougie"],
  ["07", "Biskra", "بسكرة", ""],
  ["08", "Béchar", "بشار", ""],
  ["09", "Blida", "البليدة", ""],
  ["10", "Bouira", "البويرة", ""],
  ["11", "Tamanrasset", "تمنراست", "tamanghasset"],
  ["12", "Tébessa", "تبسة", ""],
  ["13", "Tlemcen", "تلمسان", ""],
  ["14", "Tiaret", "تيارت", ""],
  ["15", "Tizi Ouzou", "تيزي وزو", "tiziouzou|tizi|تيزي"],
  ["16", "Alger", "الجزائر", "algiers|dzayer|دزاير|الدزاير|العاصمة|لعاصمة"],
  ["17", "Djelfa", "الجلفة", ""],
  ["18", "Jijel", "جيجل", ""],
  ["19", "Sétif", "سطيف", ""],
  ["20", "Saïda", "سعيدة", ""],
  ["21", "Skikda", "سكيكدة", ""],
  ["22", "Sidi Bel Abbès", "سيدي بلعباس", "sba"],
  ["23", "Annaba", "عنابة", ""],
  ["24", "Guelma", "قالمة", ""],
  ["25", "Constantine", "قسنطينة", "qacentina|cirta"],
  ["26", "Médéa", "المدية", ""],
  ["27", "Mostaganem", "مستغانم", "mosta"],
  ["28", "M'Sila", "المسيلة", "msila"],
  ["29", "Mascara", "معسكر", ""],
  ["30", "Ouargla", "ورقلة", ""],
  ["31", "Oran", "وهران", "wahran"],
  ["32", "El Bayadh", "البيض", ""],
  ["33", "Illizi", "إليزي", ""],
  ["34", "Bordj Bou Arréridj", "برج بوعريريج", "bba"],
  ["35", "Boumerdès", "بومرداس", ""],
  ["36", "El Tarf", "الطارف", ""],
  ["37", "Tindouf", "تندوف", ""],
  ["38", "Tissemsilt", "تيسمسيلت", ""],
  ["39", "El Oued", "الوادي", ""],
  ["40", "Khenchela", "خنشلة", ""],
  ["41", "Souk Ahras", "سوق أهراس", ""],
  ["42", "Tipaza", "تيبازة", "tipasa"],
  ["43", "Mila", "ميلة", ""],
  ["44", "Aïn Defla", "عين الدفلى", ""],
  ["45", "Naâma", "النعامة", "naama"],
  ["46", "Aïn Témouchent", "عين تموشنت", "ain timouchent|ain timounchent"],
  ["47", "Ghardaïa", "غرداية", ""],
  ["48", "Relizane", "غليزان", ""],
  ["49", "Timimoun", "تيميمون", ""],
  ["50", "Bordj Badji Mokhtar", "برج باجي مختار", ""],
  ["51", "Ouled Djellal", "أولاد جلال", ""],
  ["52", "Béni Abbès", "بني عباس", ""],
  ["53", "In Salah", "عين صالح", "ain salah"],
  ["54", "In Guezzam", "عين قزام", "ain guezzam"],
  ["55", "Touggourt", "تقرت", ""],
  ["56", "Djanet", "جانت", ""],
  ["57", "El M'Ghair", "المغير", "el meghaier"],
  ["58", "El Meniaa", "المنيعة", "el golea"],
];

export const WILAYAS: Wilaya[] = RAW.map(([code, nom, nomAr, alias]) => ({
  code,
  nom,
  nomAr,
  alias: alias ? alias.split("|") : [],
}));

export const WILAYA_PAR_CODE = new Map(WILAYAS.map((w) => [w.code, w]));

export function wilayaParCode(code: string): Wilaya | undefined {
  return WILAYA_PAR_CODE.get(code.padStart(2, "0"));
}
