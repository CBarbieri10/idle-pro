const fs = require('fs');
const path = require('path');

const map = {
  "01-club-athletico-paranaense-v2019.svg": "athletico-pr.svg",
  "02-clube-atltico-mineiro-v2016.svg": "atletico-mineiro.svg",
  "03-esporte-clube-bahia-v2017.svg": "bahia.svg",
  "04-Botafogo-de-Futebol-e-Regatas-v1942.svg": "botafogo.svg",
  "05-associao-chapecoense-de-futebol-v2017.svg": "chapecoense.svg",
  "06-sport-club-corinthians-paulista-v2011.svg": "corinthians.svg",
  "07-coritiba-foot-ball-club-v2001.svg": "coritiba.svg",
  "08-cruzeiro-esporte-clube-v2003.svg": "cruzeiro.svg",
  "09-Clube-de-Regatas-do-Flamengo-v2018.svg": "flamengo.svg",
  "10-Fluminense-Football-Club-v2015.svg": "fluminense.svg",
  "11-grmio-foot-ball-porto-alegrense-v2017.svg": "gremio.svg",
  "12-sport-club-internacional-v2009.svg": "internacional.svg",
  "13-mirassol-futebol-clube-v0000.svg": "mirassol.svg",
  "14-Sociedade-Esportiva-Palmeiras-v1989.svg": "palmeiras.svg",
  "15-red-bull-bragantino-v2020.svg": "rb-bragantino.svg",
  "16-clube-do-remo-v2014.svg": "remo.svg",
  "17-santos-futebol-clube-v2023.svg": "santos.svg",
  "18-sao-paulo-futebol-clube-v1986.svg": "sao-paulo.svg",
  "19-club-de-regatas-vasco-da-gama-v2021.svg": "vasco-da-gama.svg",
  "20-esporte-clube-vitoria-v2019.svg": "vitoria.svg"
};

const srcDir = "C:\\Users\\Player\\Desktop\\svg";
const destDir = "C:\\Users\\Player\\idle-pro\\public\\logos";

for (const [oldName, newName] of Object.entries(map)) {
  const src = path.join(srcDir, oldName);
  const dest = path.join(destDir, newName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${oldName} to ${newName}`);
  } else {
    console.log(`Source not found: ${src}`);
  }
}
