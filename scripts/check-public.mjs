import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_APP_URL||'https://livingvault.pics';
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/hydration|didn't match/i.test(m.text()))errors.push(m.text());});
  mkdirSync('test-results',{recursive:true});
  for(const route of ['/mainnet/vault','/mainnet/nft/f1/1','/mainnet/together','/docs']){
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
    await page.evaluate(async()=>{await document.fonts.ready;for(const family of ['DM Sans','Instrument Serif','Italianno','IBM Plex Mono'])await document.fonts.load(`16px "${family}"`);});await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/fonts\.(googleapis|gstatic)\.com/.test(r.name))),false,'Fonts must be hosted with the application');
    if(route.includes('/nft/'))await page.locator('.nft-original').waitFor({timeout:45000});
    if(route==='/mainnet/vault')await page.getByRole('button',{name:'Connect wallet',exact:true}).first().waitFor();
    if(route==='/docs')assert.ok(await page.locator('#native-mon').innerText().then(s=>s.includes('0x9a6003f651a04baef93fffc9e853b1fa2cb48d20')));
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' '+width);
      await page.screenshot({path:`test-results/public-${route.replaceAll('/','-')}-${width}.png`,fullPage:true});
    }
    console.log('PASS public '+route+' desktop/mobile, local fonts and no overflow');
  }
  assert.deepEqual(errors,[]);console.log('PASS public hydration/page errors: none. Read-only browser; no wallet signatures.');
}finally{await browser.close();}
