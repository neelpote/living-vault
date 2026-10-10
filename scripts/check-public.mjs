import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
const base=process.env.PUBLIC_APP_URL||'https://livingvault.pics';
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/hydration|didn't match/i.test(m.text()))errors.push(m.text());});
  mkdirSync('test-results',{recursive:true});
  for(const route of ['/','/create','/f1','/together','/mainnet','/mainnet/f1','/mainnet/vault','/mainnet/vault/1','/mainnet/nft/f1/1','/mainnet/together','/docs']){
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
    await page.evaluate(async()=>{await document.fonts.ready;for(const family of ['DM Sans','Instrument Serif','Italianno','IBM Plex Mono'])await document.fonts.load(`16px "${family}"`);});await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/fonts\.(googleapis|gstatic)\.com/.test(r.name))),false,'Fonts must be hosted with the application');
    if(route.includes('/nft/'))await page.locator('.nft-original').waitFor({timeout:45000});
    if(route==='/mainnet/vault')await page.getByRole('button',{name:'Connect wallet',exact:true}).first().waitFor();
    if(route.startsWith('/mainnet/vault')){
      assert.equal(await page.getByRole('link',{name:'View deployment transaction',exact:true}).getAttribute('href'),'https://monadvision.com/tx/0x79357b581b8eb3556df8aab9c791e86a623f05fd2c615e4917f29c1a53b89012');
      assert.equal(await page.getByRole('link',{name:'View contract',exact:true}).getAttribute('href'),'https://monadvision.com/address/0x9a6003f651a04baef93fffc9e853b1fa2cb48d20');
    }
    if(route==='/mainnet/vault/1')await page.getByRole('heading',{name:'0.01 MON',exact:true}).waitFor({timeout:45000});
    if(route==='/mainnet'){
      await page.getByRole('heading',{name:'LIVING VAULT',exact:true}).waitFor();
      assert.equal(await page.locator('.exhibition-cta').getAttribute('href'),'/mainnet/vault');
      assert.equal(await page.locator('.museum-links').getByRole('link',{name:'Explore real F1 artwork'}).getAttribute('href'),'/mainnet/f1');
      await page.getByRole('button',{name:'Open navigation',exact:true}).click();
      assert.equal(await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Your collection'}).getAttribute('href'),'/mainnet#collection');
      await page.getByRole('button',{name:'Close navigation',exact:true}).click();
    }
    if(route==='/docs')assert.ok(await page.locator('#native-mon').innerText().then(s=>s.includes('0x9a6003f651a04baef93fffc9e853b1fa2cb48d20')));
    await page.evaluate(async()=>{await Promise.all(Array.from(document.images).filter(img=>img.loading!=='lazy').map(img=>img.decode()));});
    assert.equal(await page.locator('img:not([alt])').count(),0,route+' images need descriptions');
    assert.equal(await page.locator('#main-content').count(),1,route+' keyboard skip destination');
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' '+width);
      await page.screenshot({path:`test-results/public-${route.replaceAll('/','-')}-${width}.png`,fullPage:true});
    }
    console.log('PASS public '+route+' desktop/mobile, local fonts and no overflow');
  }
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Mainnet',exact:true}).click();
  await page.waitForURL(base+'/mainnet');
  await page.getByRole('heading',{name:'LIVING VAULT',exact:true}).waitFor();
  await page.getByRole('button',{name:'Testnet',exact:true}).click();
  await page.waitForURL(base+'/');
  await page.getByRole('heading',{name:'LIVING VAULT',exact:true}).waitFor();
  console.log('PASS network switches open exhibition home, not the F1 gallery');
  assert.deepEqual(errors,[]);console.log('PASS public hydration/page errors: none. Read-only browser; no wallet signatures.');
}finally{await browser.close();}
