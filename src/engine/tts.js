// ================================================================
// SHARED TTS — All medical terms from all conversations live here.
// Adding terms here makes them available everywhere.
// ================================================================
export function prepareForSpeech(text) {
  let result = text;
  // Anatomy & general
  result = result.replace(/alveoli/gi, "al vee uh lye");
  result = result.replace(/alveolar/gi, "al vee uh ler");
  result = result.replace(/capillaries/gi, "ca pill air eez");
  result = result.replace(/capillary/gi, "ca pill air ee");
  result = result.replace(/pharynx/gi, "fair inks");
  result = result.replace(/larynx/gi, "lair inks");
  result = result.replace(/trachea/gi, "tray kee ah");
  result = result.replace(/bronchi\b/gi, "bronk eye");
  result = result.replace(/diaphragm/gi, "die ah fram");
  result = result.replace(/atelectasis/gi, "at eh lek tah sis");
  result = result.replace(/surfactant/gi, "sir fak tent");
  result = result.replace(/chemoreceptors/gi, "kee mo receptors");
  result = result.replace(/orthopnea/gi, "or thop nee ah");
  result = result.replace(/dyspnea/gi, "disp nee ah");
  result = result.replace(/rhonchi/gi, "ronk eye");
  result = result.replace(/rales/gi, "rawls");
  result = result.replace(/hypercapnia/gi, "hyper cap nee ah");
  result = result.replace(/hypocapnia/gi, "hypo cap nee ah");
  result = result.replace(/rhinitis/gi, "rye night iss");
  result = result.replace(/hemoptysis/gi, "he mop tih sis");
  result = result.replace(/polycythemia/gi, "polly sigh thee me ah");
  result = result.replace(/cyanosis/gi, "sigh ah no sis");
  result = result.replace(/emphysema/gi, "em fih zee mah");
  result = result.replace(/bronchiectasis/gi, "bronk ee ek tah sis");
  result = result.replace(/hypoxic/gi, "high pock sick");
  result = result.replace(/hypoxia/gi, "high pock see ah");
  result = result.replace(/hyperinflated/gi, "hyper in flated");
  result = result.replace(/carotid/gi, "kah rot id");
  result = result.replace(/medulla/gi, "meh dull ah");
  result = result.replace(/oblongata/gi, "ob long gah tah");
  result = result.replace(/pursed/gi, "perst");
  result = result.replace(/recoil/gi, "ree coil");
  result = result.replace(/bronchodilators/gi, "bronk oh die lay tors");
  // Lab values & abbreviations
  result = result.replace(/PaO2/g, "P A O 2");
  result = result.replace(/PaCO2/g, "P A C O 2");
  result = result.replace(/HCO3/g, "H C O 3");
  result = result.replace(/FiO2/g, "F I O 2");
  result = result.replace(/SpO2/g, "S P O 2");
  result = result.replace(/CO2/g, "C O 2");
  result = result.replace(/mmHg/g, "millimeters of mercury");
  result = result.replace(/D\.O\.E\./g, "D O E");
  result = result.replace(/S\.O\.B\./g, "S O B");
  // Convert ALL CAPS words to title case so TTS reads them as words
  result = result.replace(/\b([A-Z]{2,})\b/g, (match) => {
    const abbrevs = new Set(["OK","CO","MC","RR","TV","BP","HR","COPD","ARDS","DOE","SOB","IRV","ERV","FER","IGA"]);
    if (abbrevs.has(match)) return match;
    return match.charAt(0) + match.slice(1).toLowerCase();
  });
  return result;
}
