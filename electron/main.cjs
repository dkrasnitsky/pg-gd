const { app, BrowserWindow, dialog, ipcMain, safeStorage, session, shell } = require("electron");
const http = require("node:http");
const https = require("node:https");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

let localServer;
let mainWindow;
const workspacePartition="persist:pg3d-workspace";
const storeKeys=new Set(["navigation","workspace","notes","calendar","items","settings","lotteryBalances"]);
const storeWrites=new Map();
const lotterySpreadsheetId="1d2mBr0-yDswgyFzTeaFHdbNEizukTEtCtaYkG3PzouI";
const lotteryTestSpreadsheetId="10s8UQTOfFupR3afkyU0nmvKo_crLPjREHFTolesQK54";
const lotteryScheduleGid=2053899668;
const lotteryTestScheduleGid=1485566542;
const eventCenterSpreadsheetId="1tIXmTByMu6TRlyn7t-5hJHdCB__70M6DbSbvMItefL0";
const eventCenterTestSpreadsheetId="1ZNXorevxFq6Tlxbr9FjljuQXzM9jCv7KuIt7jbHz_uE";
const eventCenterLotteryGid=450520332;
const eventCenterTestLotteryGid=1724060786;
const segmentsSheetGid=1297452825;
const tierSpreadsheetId="1YKQ4dtCBeUVpMy1oaBxFC-nS4udGHvjYU_qx7U1HTMs";
const tierSheetGid=619054802;
const nameSheetGid=1632164539;
const weaponGeneratorPath="Z:\\pg3d\\Assets\\Scripts\\Item\\Generated\\ItemConverterId_clientToIndex.cs";
const googleScope="https://www.googleapis.com/auth/spreadsheets";
const jiraEmail="d.krasnitsky@cubicgames.com";
const jiraToken="ATATT3xFfGF0jXXe_lR_N9tplVahKSSluupYeK023mk1EluThXO-IPe_jGD2P8ZIWzgUhzxpwXNRWYxrMY2XJwt-sAuAcHRBTMhsJ2zpGBKdSUBuw_xtw9ZYxiqqcl7EwapopQO7x5R-O4uf6GiipKDgSNDMW0qEycfHC-yMr55SkKg7DRvV66o=F4AB4211";
const jiraAuth=Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64");

function googleCredentialsPath(){return path.join(app.getPath("userData"),"google-oauth.json")}
function googleTokenPath(){return path.join(app.getPath("userData"),"google-token.dat")}

async function selectGoogleCredentials(){
  const result=await dialog.showOpenDialog(mainWindow,{title:"Выберите OAuth-ключ Google",properties:["openFile"],filters:[{name:"Google OAuth JSON",extensions:["json"]}]});
  if(result.canceled||!result.filePaths[0])throw new Error("Выбор OAuth-ключа отменён");
  const source=JSON.parse(await fs.promises.readFile(result.filePaths[0],"utf8"));
  if(!source.installed?.client_id||!source.installed?.auth_uri||!source.installed?.token_uri)throw new Error("Нужен OAuth-клиент Google типа Desktop app");
  await fs.promises.writeFile(googleCredentialsPath(),JSON.stringify({installed:source.installed}),"utf8");
  return source.installed;
}

async function readGoogleCredentials(){
  try{const data=JSON.parse(await fs.promises.readFile(googleCredentialsPath(),"utf8"));if(data.installed?.client_id)return data.installed}catch(error){if(error.code!=="ENOENT")throw error}
  return selectGoogleCredentials();
}

async function writeGoogleToken(token){
  const serialized=Buffer.from(JSON.stringify(token));
  const payload=safeStorage.isEncryptionAvailable()?`encrypted:${safeStorage.encryptString(serialized.toString("utf8")).toString("base64")}`:`plain:${serialized.toString("base64")}`;
  await fs.promises.writeFile(googleTokenPath(),payload,"utf8");
}

async function readGoogleToken(){
  try{
    const payload=await fs.promises.readFile(googleTokenPath(),"utf8");
    if(payload.startsWith("encrypted:"))return JSON.parse(safeStorage.decryptString(Buffer.from(payload.slice(10),"base64")));
    if(payload.startsWith("plain:"))return JSON.parse(Buffer.from(payload.slice(6),"base64").toString("utf8"));
  }catch(error){if(error.code!=="ENOENT")console.error("Failed to read Google token",error)}
  return null;
}

async function tokenRequest(credentials,params){
  const response=await fetch(credentials.token_uri,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams(params)});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error_description||body.error||"Google OAuth завершился ошибкой");
  return body;
}

async function authorizeGoogle(credentials){
  const state=crypto.randomBytes(24).toString("hex");
  const verifier=crypto.randomBytes(48).toString("base64url");
  const challenge=crypto.createHash("sha256").update(verifier).digest("base64url");
  let callbackServer;
  let redirectUri;
  const codePromise=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{callbackServer?.close();reject(new Error("Время ожидания авторизации Google истекло"))},300000);
    callbackServer=http.createServer((req,res)=>{
      const url=new URL(req.url,"http://127.0.0.1");
      if(url.pathname!=="/oauth2callback")return;
      const error=url.searchParams.get("error");
      const code=url.searchParams.get("code");
      const returnedState=url.searchParams.get("state");
      res.writeHead(error?400:200,{"content-type":"text/html; charset=utf-8"});
      res.end(error?"Авторизация отменена. Это окно можно закрыть.":"Доступ предоставлен. Вернитесь в PG3D Workspace — это окно можно закрыть.");
      clearTimeout(timeout);callbackServer.close();
      if(error)reject(new Error("Авторизация Google отменена"));else if(!code||returnedState!==state)reject(new Error("Некорректный ответ авторизации Google"));else resolve(code);
    });
    callbackServer.listen(0,"127.0.0.1",()=>{
      redirectUri=`http://127.0.0.1:${callbackServer.address().port}/oauth2callback`;
      const authUrl=new URL(credentials.auth_uri);
      authUrl.search=new URLSearchParams({client_id:credentials.client_id,redirect_uri:redirectUri,response_type:"code",scope:googleScope,access_type:"offline",prompt:"consent",state,code_challenge:challenge,code_challenge_method:"S256"}).toString();
      shell.openExternal(authUrl.toString()).catch(reject);
    });
  });
  const code=await codePromise;
  return tokenRequest(credentials,{client_id:credentials.client_id,client_secret:credentials.client_secret||"",code,code_verifier:verifier,grant_type:"authorization_code",redirect_uri:redirectUri});
}

async function getGoogleAccessToken(){
  const credentials=await readGoogleCredentials();
  let token=await readGoogleToken();
  if(token?.access_token&&token.expires_at>Date.now()+60000)return token.access_token;
  if(token?.refresh_token){
    const refreshed=await tokenRequest(credentials,{client_id:credentials.client_id,client_secret:credentials.client_secret||"",refresh_token:token.refresh_token,grant_type:"refresh_token"});
    token={...token,...refreshed,expires_at:Date.now()+(refreshed.expires_in||3600)*1000};await writeGoogleToken(token);return token.access_token;
  }
  const authorized=await authorizeGoogle(credentials);
  token={...authorized,expires_at:Date.now()+(authorized.expires_in||3600)*1000};await writeGoogleToken(token);return token.access_token;
}

async function sheetsRequest(accessToken,url,options={}){
  const response=await fetch(url,{...options,headers:{authorization:`Bearer ${accessToken}`,"content-type":"application/json",...(options.headers||{})}});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error?.message||"Google Sheets API завершился ошибкой");
  return body;
}

function colLetter(index){let value=index+1,name="";while(value>0){value--;name=String.fromCharCode(65+value%26)+name;value=Math.floor(value/26)}return name}

async function duplicateLotteryTemplateSheets(accessToken,spreadsheetId,base){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title,index)`);
  const templates=[{source:"Chest",suffix:"Chest"},{source:"GameRewards",suffix:"Rewards"},{source:"InappsCurrency",suffix:"Currency"}];
  const sheets=new Map((spreadsheet.sheets||[]).map(sheet=>[sheet.properties.title,sheet.properties]));
  const missing=templates.filter(template=>!sheets.has(template.source)).map(template=>template.source);
  if(missing.length)throw new Error(`Не найдены дефолтные листы: ${missing.join(", ")}`);
  const names=templates.map(template=>`${base}${template.suffix}`);
  const conflicts=names.filter(name=>sheets.has(name));
  if(conflicts.length)throw new Error(`Листы уже существуют: ${conflicts.join(", ")}`);
  const duplicateResponse=await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:templates.map((template,index)=>({duplicateSheet:{sourceSheetId:sheets.get(template.source).sheetId,newSheetName:names[index]}}))})});
  const newSheetIds=(duplicateResponse.replies||[]).map(reply=>reply.duplicateSheet?.properties?.sheetId).filter(id=>id!==undefined);
  if(newSheetIds.length===templates.length){
    const anchor=(spreadsheet.sheets||[]).find(entry=>entry.properties.title==="EggsAndPets");
    const baseIndex=anchor?anchor.properties.index+1:0;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:newSheetIds.map((sheetId,index)=>({updateSheetProperties:{properties:{sheetId,index:baseIndex+index},fields:"index"}}))})});
  }
  return names;
}

async function buildLotteryConfigInSheet(accessToken,spreadsheetId,sheetName,items){
  const title=String(sheetName||"").trim();
  if(!title)throw new Error("Введите название листа с лотереей");
  if(!Array.isArray(items)||!items.length)throw new Error("В симуляторе нет данных для записи");
  const normalized=items.map(item=>({containerId:String(item?.containerId??"").trim(),itemId:String(item?.itemId??""),count:Number(item?.count),dropChance:Number(item?.dropChance)}));
  if(normalized.some(item=>!item.containerId||!Number.isFinite(item.count)||!Number.isFinite(item.dropChance)))throw new Error("В симуляторе есть некорректные ID или числовые значения");
  const duplicateIds=normalized.map(item=>item.containerId).filter((id,index,all)=>all.indexOf(id)!==index);
  if(duplicateIds.length)throw new Error(`ID повторяются в симуляторе: ${[...new Set(duplicateIds)].join(", ")}`);

  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.title===title);
  if(!sheet)throw new Error(`Лист «${title}» не найден`);

  const quotedTitle=`'${title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS`);
  const rows=valuesResponse.values||[];
  const required=["container_id","item_id","count","drop_chance"];
  const headerIndex=rows.findIndex(row=>required.every(header=>row.includes(header)));
  if(headerIndex<0)throw new Error(`На листе «${title}» не найдены поля: ${required.join(", ")}`);
  const header=rows[headerIndex];
  const columns=Object.fromEntries(required.map(name=>[name,header.indexOf(name)]));
  const rowByContainer=new Map();
  rows.slice(headerIndex+1).forEach((row,index)=>{const value=String(row[columns.container_id]??"").trim();if(value&&!rowByContainer.has(value))rowByContainer.set(value,headerIndex+2+index)});
  const missing=normalized.filter(item=>!rowByContainer.has(item.containerId)).map(item=>item.containerId);
  if(missing.length)throw new Error(`На листе не найдены container_id: ${missing.join(", ")}`);

  const data=[];
  for(const item of normalized){
    const row=rowByContainer.get(item.containerId);
    data.push({range:`${quotedTitle}!${colLetter(columns.item_id)}${row}`,values:[[item.itemId]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.count)}${row}`,values:[[item.count]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.drop_chance)}${row}`,values:[[item.dropChance]]});
  }
  await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return{updated:normalized.length,sheetName:title};
}

async function appendScheduleRow(accessToken,spreadsheetId,scheduleGid,overrides){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===scheduleGid);
  if(!sheet)throw new Error("Лист Schedule не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const allResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=allResp.values||[];
  if(rows.length<2)throw new Error("На листе Schedule нет строк для копирования");
  const lastRow=[...rows[rows.length-1]];
  while(lastRow.length<8)lastRow.push("");
  lastRow[0]=overrides.name;
  lastRow[1]=overrides.style;
  lastRow[7]=overrides.uniqueId;
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[lastRow]})});
}

async function appendLotteryRow(accessToken,spreadsheetId,lotteryGid,overrides){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===lotteryGid);
  if(!sheet)throw new Error("Лист Lottery не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const allResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=allResp.values||[];
  if(rows.length<2)throw new Error("На листе Lottery нет строк для копирования");
  const lastRow=[...rows[rows.length-1]];
  while(lastRow.length<8)lastRow.push("");
  lastRow[2]=overrides.id;
  lastRow[3]=overrides.startDateTime;
  lastRow[4]=overrides.endDateTime;
  lastRow[5]=overrides.segment;
  lastRow[7]=overrides.style;
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[lastRow]})});
}

ipcMain.handle("google:create-lottery-config",async(_event,title)=>{
  const base=String(title||"").replace(/\s+/g,"");
  if(!base)throw new Error("Укажите название элемента");
  const accessToken=await getGoogleAccessToken();
  const names=await duplicateLotteryTemplateSheets(accessToken,lotterySpreadsheetId,base);
  return{names,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${lotterySpreadsheetId}/edit`};
});

ipcMain.handle("google:build-lottery-config",async(_event,sheetName,items)=>{
  const accessToken=await getGoogleAccessToken();
  return buildLotteryConfigInSheet(accessToken,lotterySpreadsheetId,sheetName,items);
});

ipcMain.handle("google:get-next-lottery-id",async()=>{
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${lotterySpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===lotteryScheduleGid);
  if(!sheet)throw new Error("Лист Schedule не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const headerResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!A1:Z1`)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const header=(headerResp.values&&headerResp.values[0])||[];
  const idx=header.findIndex(h=>String(h||"").trim().toLowerCase()==="uniqueid");
  if(idx<0)throw new Error("Колонка UniqueId не найдена на листе Schedule");
  const colResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!${colLetter(idx)}2:${colLetter(idx)}100000`)}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`);
  const col=(colResp.values&&colResp.values[0])||[];
  let last=null;
  for(const v of col){const n=Number(v);if(Number.isFinite(n))last=n}
  return (last!==null?last:2162)+1;
});

ipcMain.handle("google:get-segments",async()=>{
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${eventCenterSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===segmentsSheetGid);
  if(!sheet)return [];
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const resp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!B2:B10000`)}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`);
  const col=(resp.values&&resp.values[0])||[];
  return [...new Set(col.map(v=>String(v||"").trim()).filter(Boolean))];
});

ipcMain.handle("google:apply-lottery-partition",async(_event,partition)=>{
  const {name,id,style,segment,startDateTime,endDateTime,balanceItems,target}=partition||{};
  const cleanName=String(name||"").replace(/\s+/g,"");
  if(!cleanName)throw new Error("Укажите Name");
  if(!id)throw new Error("Укажите Id");
  const isTest=target==="test";
  const lotterySpId=isTest?lotteryTestSpreadsheetId:lotterySpreadsheetId;
  const scheduleGid=isTest?lotteryTestScheduleGid:lotteryScheduleGid;
  const eventCenterSpId=isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId;
  const lotteryGid=isTest?eventCenterTestLotteryGid:eventCenterLotteryGid;

  const accessToken=await getGoogleAccessToken();
  const names=await duplicateLotteryTemplateSheets(accessToken,lotterySpId,cleanName);
  await appendScheduleRow(accessToken,lotterySpId,scheduleGid,{name:cleanName,style:style||"",uniqueId:id});
  await appendLotteryRow(accessToken,eventCenterSpId,lotteryGid,{id,style:style||"",segment:segment||"",startDateTime:startDateTime||"",endDateTime:endDateTime||""});
  if(Array.isArray(balanceItems)&&balanceItems.length){
    await buildLotteryConfigInSheet(accessToken,lotterySpId,names[0],balanceItems);
  }
  return {names,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${lotterySpId}/edit`};
});

async function fetchWeaponAnalytics(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${tierSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===tierSheetGid);
  const lookup=new Map();
  if(!sheet)return lookup;
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!E:V`)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const clean=value=>{const text=value===undefined||value===null?"":String(value).trim();return (!text||text.startsWith("#"))?"":text};
  for(const row of valuesResponse.values||[]){
    const key=String(row[0]??"").trim().toLowerCase();
    if(!key||lookup.has(key))continue;
    lookup.set(key,{type:clean(row[2]),rarity:clean(row[3]),tier:clean(row[5]),lethality:clean(row[13]),prevalence:clean(row[17])});
  }
  return lookup;
}

async function fetchNamesAndSaleDates(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${tierSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===nameSheetGid);
  const names=new Map();
  if(!sheet)return {names};
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const headerResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!A1:AZ1`)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const header=(headerResp.values&&headerResp.values[0])||[];
  const headerMap=new Map();
  header.forEach((h,i)=>{const key=String(h||"").trim().toLowerCase();if(key&&!headerMap.has(key))headerMap.set(key,i)});
  const tagCol=headerMap.has("tag")?headerMap.get("tag"):0;
  const nameCol=headerMap.has("name")?headerMap.get("name"):1;
  const maxCol=Math.max(tagCol,nameCol,0);
  const range=`${quotedTitle}!A2:${colLetter(maxCol)}100000`;
  const dataResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  for(const row of dataResp.values||[]){
    const tag=String(row[tagCol]??"").trim();
    if(!tag)continue;
    const key=tag.toLowerCase();
    const name=String(row[nameCol]??"").trim();
    if(name&&!names.has(key))names.set(key,name);
  }
  return {names};
}

function extractDictionaryBody(text,funcName){
  const defRe=new RegExp(`Create${funcName}Dictionary\\(\\)\\s*=>`);
  const defMatch=defRe.exec(text);
  if(!defMatch)return null;
  const openIdx=text.indexOf("{",defMatch.index+defMatch[0].length);
  if(openIdx<0)return null;
  let depth=1,p=openIdx+1;
  while(depth>0&&p<text.length){
    if(text[p]==="{")depth++;
    else if(text[p]==="}")depth--;
    p++;
  }
  return text.slice(openIdx,p);
}

function parseTagIndexPairs(body){
  const map=new Map();
  const re=/new TagIndexStruct\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*(\d+)\s*\)/g;
  let m;
  while((m=re.exec(body))!==null){
    if(!map.has(m[1]))map.set(m[1],m[2]);
  }
  return map;
}

async function parseWeaponGenerator(){
  let text;
  try{
    text=await fs.promises.readFile(weaponGeneratorPath,"utf8");
  }catch(error){
    console.log("[sync] weapon generator file not reachable (drive not mounted?), skipping",error.message);
    return null;
  }
  const weaponBody=extractDictionaryBody(text,"Weapon");
  if(!weaponBody){
    console.error("[sync] CreateWeaponDictionary not found in generator file");
    return null;
  }
  const partsBody=extractDictionaryBody(text,"Parts");
  return {weaponMap:parseTagIndexPairs(weaponBody),partsMap:partsBody?parseTagIndexPairs(partsBody):new Map()};
}

async function runWeaponAutoSync(){
  const generator=await parseWeaponGenerator();
  if(!generator)return;

  let existing=[];
  try{existing=JSON.parse(await fs.promises.readFile(storePath("items"),"utf8"))||[]}catch(error){if(error.code!=="ENOENT")throw error}

  const weaponEntries=[...generator.weaponMap.entries()];
  const weaponLower=new Map(weaponEntries.map(([tag,id])=>[tag.toLowerCase(),{tag,id}]));
  const partsLower=new Map([...generator.partsMap].map(([tag,id])=>[tag.toLowerCase(),id]));
  const existingTagsLower=new Set(existing.filter(i=>i.tag).map(i=>String(i.tag).toLowerCase()));
  const newEntries=weaponEntries.filter(([tag])=>!existingTagsLower.has(tag.toLowerCase()));
  console.log(`[sync] generator: ${weaponEntries.length} weapon tags, ${newEntries.length} new`);

  let iconByLower=new Map();
  try{
    const files=await fs.promises.readdir(iconLibraryDir());
    iconByLower=new Map(files.map(f=>[f.toLowerCase(),f]));
  }catch(error){/* icon library not present in this build; icons stay empty */}
  const matchIcon=tag=>{
    for(const ext of ["png","webp","jpg","jpeg","gif"]){
      const real=iconByLower.get(`${tag}_icon1_big.${ext}`.toLowerCase());
      if(real)return `/icons-items/${real}`;
    }
    return "";
  };

  let uidSeed=Date.now();
  const createdItems=newEntries.map(([tag,id])=>({
    uid:`item-${uidSeed++}`,
    id:id||"",parts:partsLower.get(tag.toLowerCase())||"",tag,
    name:"",type:"Weapon",rarity:"",setting:"",lastSale:"",saleLocation:"",
    tier:"",sheetType:"",sheetRarity:"",sheetName:"",sheetLethality:"",sheetPrevalence:"",
    icon:matchIcon(tag),
  }));

  let allItems=[...existing,...createdItems];

  let analytics=new Map();
  let sheetInfo={names:new Map()};
  try{
    const accessToken=await getGoogleAccessToken();
    analytics=await fetchWeaponAnalytics(accessToken);
    sheetInfo=await fetchNamesAndSaleDates(accessToken);
    console.log(`[sync] Weapon Analytics: ${analytics.size} rows; name sheet: ${sheetInfo.names.size} names`);
  }catch(error){
    console.error("[sync] could not reach Google Sheets this run; tier/type/rarity/name left unchanged",error.message||error);
  }

  allItems=allItems.map(item=>{
    if(!item.tag)return item;
    const key=String(item.tag).toLowerCase();
    const patch={};
    const weap=weaponLower.get(key);
    if(weap)patch.id=weap.id;
    const parts=partsLower.get(key);
    if(parts!==undefined)patch.parts=parts;
    const info=analytics.get(key);
    if(info){
      patch.tier=info.tier||"";
      patch.sheetType=info.type||"";
      patch.sheetRarity=info.rarity||"";
      patch.sheetLethality=info.lethality||"";
      patch.sheetPrevalence=info.prevalence||"";
    }
    const name=sheetInfo.names.get(key);
    if(name!==undefined)patch.sheetName=name;
    return Object.keys(patch).length?{...item,...patch}:item;
  });

  const target=storePath("items");
  const temporary=`${target}.${process.pid}.${Date.now()}.sync.tmp`;
  await fs.promises.mkdir(path.dirname(target),{recursive:true});
  await fs.promises.writeFile(temporary,JSON.stringify(allItems),"utf8");
  await fs.promises.rename(temporary,target);
  console.log(`[sync] done: ${createdItems.length} new items, ${allItems.length} total`);
}

ipcMain.handle("google:fetch-tier",async(_event,tag)=>{
  const needle=String(tag||"").trim().toLowerCase();
  if(!needle)return null;
  const accessToken=await getGoogleAccessToken();
  const analytics=await fetchWeaponAnalytics(accessToken);
  return analytics.get(needle)||null;
});

function iconLibraryDir(){return path.join(__dirname,"..","dist","icons-items")}

ipcMain.handle("icons:list",async()=>{
  try{
    const files=await fs.promises.readdir(iconLibraryDir());
    return files.filter(name=>/\.(png|webp|jpg|jpeg|gif)$/i.test(name)).sort();
  }catch(error){
    if(error.code==="ENOENT")return [];
    throw error;
  }
});

function storePath(key){
  if(!storeKeys.has(key))throw new Error("Unknown store key");
  return path.join(app.getPath("userData"),`${key}.json`);
}

ipcMain.handle("store:read",async(_event,key)=>{
  try{return JSON.parse(await fs.promises.readFile(storePath(key),"utf8"))}catch(error){if(error.code==="ENOENT")return null;throw error}
});
ipcMain.handle("store:write",async(_event,key,value)=>{
  const previous=storeWrites.get(key)||Promise.resolve();
  const pending=previous.catch(()=>{}).then(async()=>{
    const target=storePath(key);const temporary=`${target}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    await fs.promises.mkdir(path.dirname(target),{recursive:true});
    await fs.promises.writeFile(temporary,JSON.stringify(value),"utf8");
    await fs.promises.rename(temporary,target);
    return true;
  });
  storeWrites.set(key,pending);
  return pending;
});

function installPopupHandler(contents){
  contents.setWindowOpenHandler(({url})=>{
    if(contents.getType()==="webview"){
      contents.loadURL(url);
      return {action:"deny"};
    }
    const popup=new BrowserWindow({
      width:1080,height:760,minWidth:640,minHeight:520,
      parent:mainWindow||undefined,modal:false,frame:true,autoHideMenuBar:true,
      backgroundColor:"#171717",title:"Вход — PG3D Workspace",
      webPreferences:{session:session.fromPartition(workspacePartition),contextIsolation:true,nodeIntegration:false,sandbox:true}
    });
    popup.on("closed",()=>{if(mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.send("workspace:popup-closed")});
    popup.loadURL(url);
    return {action:"deny"};
  });
}

app.on("web-contents-created",(_event,contents)=>installPopupHandler(contents));

const mime = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".ttf":"font/ttf"};

function proxyJira(req,res){
  const targetPath=req.url.replace(/^\/jira-api/,"");
  const upstream=https.request({hostname:"cubicgamesstudio.atlassian.net",path:targetPath,method:req.method,headers:{...req.headers,host:"cubicgamesstudio.atlassian.net",origin:"https://cubicgamesstudio.atlassian.net",referer:"https://cubicgamesstudio.atlassian.net/",authorization:`Basic ${jiraAuth}`}},up=>{
    res.writeHead(up.statusCode||500,{...up.headers,"access-control-allow-origin":"*"});up.pipe(res);
  });
  upstream.on("error",error=>{res.writeHead(502,{"content-type":"application/json"});res.end(JSON.stringify({error:error.message}));});
  req.pipe(upstream);
}

function startServer(){
  const root=path.join(__dirname,"..","dist");
  return new Promise(resolve=>{
    localServer=http.createServer((req,res)=>{
      if(req.url.startsWith("/jira-api"))return proxyJira(req,res);
      const rawPath=decodeURIComponent(req.url.split("?")[0]);
      let filePath=path.join(root,rawPath==="/"?"index.html":rawPath);
      if(!filePath.startsWith(root))filePath=path.join(root,"index.html");
      fs.stat(filePath,(error,stat)=>{
        if(error||!stat.isFile())filePath=path.join(root,"index.html");
        fs.readFile(filePath,(readError,data)=>{
          if(readError){res.writeHead(404);return res.end("Not found")}
          res.writeHead(200,{"content-type":mime[path.extname(filePath)]||"application/octet-stream"});res.end(data);
        });
      });
    }).listen(0,"127.0.0.1",()=>resolve(localServer.address().port));
  });
}

async function createWindow(){
  const port=await startServer();
  const workspaceSession=session.fromPartition(workspacePartition);
  workspaceSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36");
  const win=new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,frame:false,backgroundColor:"#171717",title:"PG3D Workspace",icon:path.join(__dirname,"..","dist","icons","pg3d-512.png"),autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,"preload.cjs"),partition:workspacePartition,webviewTag:true,contextIsolation:true,nodeIntegration:false,sandbox:true}});
  mainWindow=win;
  const sendMaximized=()=>win.webContents.send("window:maximized-change",win.isMaximized());
  win.on("maximize",sendMaximized);win.on("unmaximize",sendMaximized);
  await win.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(async()=>{
  await createWindow();
  runWeaponAutoSync().catch(error=>console.error("[sync] failed",error));
});
ipcMain.on("window:minimize",event=>BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.on("window:toggle-maximize",event=>{const win=BrowserWindow.fromWebContents(event.sender);if(!win)return;win.isMaximized()?win.unmaximize():win.maximize()});
ipcMain.on("window:close",event=>BrowserWindow.fromWebContents(event.sender)?.close());
ipcMain.handle("window:is-maximized",event=>BrowserWindow.fromWebContents(event.sender)?.isMaximized()||false);
app.on("window-all-closed",()=>{if(localServer)localServer.close();if(process.platform!=="darwin")app.quit()});
app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
