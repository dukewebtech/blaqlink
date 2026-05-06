export const NIGERIAN_STATES = {
  "Abia": ["Aba", "Umuahia", "Ohafia", "Arochukwu", "Bende"],
  "Adamawa": ["Yola", "Mubi", "Girei", "Song", "Numan"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak"],
  "Anambra": ["Awka", "Onitsha", "Nnewi", "Agulu", "Ekwulobia"],
  "Bauchi": ["Bauchi", "Azare", "Dass", "Tafawa Balewa", "Jama'are"],
  "Bayelsa": ["Yenagoa", "Brass", "Opobo", "Burutu", "Ogbia"],
  "Benue": ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"],
  "Borno": ["Maiduguri", "Biu", "Dikwa", "Gwoza", "Konduga"],
  "Cross River": ["Calabar", "Buea", "Ikom", "Obudu", "Ugep"],
  "Delta": ["Asaba", "Warri", "Sapele", "Effurun", "Burutu"],
  "Ebonyi": ["Abakaliki", "Onueke", "Afikpo", "Ebonyi", "Ohaozara"],
  "Edo": ["Benin City", "Midwestern", "Ekpoma", "Agenebode", "Irrua"],
  "Ekiti": ["Ado-Ekiti", "Ikole", "Ijero", "Ilawe", "Omuo-Ekiti"],
  "Enugu": ["Enugu", "Nsukka", "Enugu-Ezike", "Oji", "Awgu"],
  "Gombe": ["Gombe", "Kumo", "Yamaltu", "Dukku", "Balanga"],
  "Imo": ["Owerri", "Orlu", "Okigwe", "Mbaise", "Mbaitoli"],
  "Jigawa": ["Dutse", "Hadejia", "Kano", "Katsina", "Birnin Kudu"],
  "Kaduna": ["Kaduna", "Zaria", "Kafanchan", "Saminaka", "Kudan"],
  "Kano": ["Kano", "Dala", "Fagge", "Gwale", "Kura"],
  "Katsina": ["Katsina", "Kankia", "Daura", "Jibiya", "Kafur"],
  "Kebbi": ["Birnin Kebbi", "Argungu", "Sokoto", "Bunza", "Jega"],
  "Kogi": ["Lokoja", "Okene", "Ofu", "Idah", "Dekina"],
  "Kwara": ["Ilorin", "Offa", "Jebba", "Ifelodun", "Share"],
  "Lagos": ["Lagos Island", "Ikeja", "Lekki", "Ajah", "Bariga"],
  "Nasarawa": ["Lafia", "Keffi", "Nasarawa", "Obi", "Karu"],
  "Niger": ["Minna", "Suleja", "Bida", "Kontagora", "Mokwa"],
  "Ogun": ["Abeokuta", "Sagamu", "Ijebu-Ode", "Ilaro", "Ota"],
  "Ondo": ["Akure", "Ondo", "Owo", "Okitipupa", "Ile-Ife"],
  "Osun": ["Osogbo", "Ilesha", "Iwo", "Ilesa", "Ikirun"],
  "Oyo": ["Ibadan", "Oyo", "Ogbomosho", "Lanlate", "Saki"],
  "Plateau": ["Jos", "Pankshin", "Vom", "Bukuru", "Wamba"],
  "Rivers": ["Port Harcourt", "Obio-Akpo", "Bonny", "Ahoada", "Ogoni"],
  "Sokoto": ["Sokoto", "Gusau", "Goronyo", "Kware", "Rabah"],
  "Taraba": ["Jalingo", "Zing", "Takum", "Gembu", "Wukari"],
  "Yobe": ["Damaturu", "Potiskum", "Gashua", "Gujba", "Yunusari"],
  "Zamfara": ["Gusau", "Talika", "Anka", "Kaura-Namoda", "Maru"],
  "FCT": ["Abuja", "Gwagwalada", "Kuje", "Kwali", "Bwari"],
} as const

export type NigerianState = keyof typeof NIGERIAN_STATES

export function getStatesList(): NigerianState[] {
  return Object.keys(NIGERIAN_STATES) as NigerianState[]
}

export function getCitiesByState(state: NigerianState): string[] {
  return NIGERIAN_STATES[state] || []
}
