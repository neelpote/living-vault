import {mkdirSync,writeFileSync} from 'node:fs';
const families={dmsans:['DMSans[opsz,wght].ttf'],instrumentserif:['InstrumentSerif-Regular.ttf','InstrumentSerif-Italic.ttf'],italianno:['Italianno-Regular.ttf'],ibmplexmono:['IBMPlexMono-Regular.ttf','IBMPlexMono-Medium.ttf']};
mkdirSync('public/fonts',{recursive:true});
for(const [family,files] of Object.entries(families))for(const file of [...files,'OFL.txt']){
  const response=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/${encodeURIComponent(file)}`,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`${family}/${file}: HTTP ${response.status}`);
  writeFileSync(`public/fonts/${file==='OFL.txt'?family+'-OFL.txt':file.startsWith('DMSans[')?'DMSans-Variable.ttf':file}`,Buffer.from(await response.arrayBuffer()));
}
console.log('Vendored six original font files and four OFL licenses; no runtime Google Fonts dependency.');
