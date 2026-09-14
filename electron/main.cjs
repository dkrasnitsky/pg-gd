const { app, BrowserWindow, dialog, ipcMain, safeStorage, session, shell } = require("electron");
const http = require("node:http");
const https = require("node:https");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

let localServer;
let mainWindow;
const workspacePartition="persist:pg3d-workspace";
const cardRouletteSpreadsheetId="1onDfSBGSAnHqLTglpj0upGhBZCJrjkL50V03sVnlFrk";
const cardRouletteTestSpreadsheetId="1lIRQ8FT0vWZcsgHwl1clhZrNuY2RxCGV7faf_0hl5JE";
const cardRouletteScheduleGid=1041170058;
const eventCenterCardRouletteGid=641877320;
const eventCenterTestCardRouletteGid=387562133;
const storeKeys=new Set(["navigation","workspace","notes","calendar","items","settings","lotteryBalances","cardRouletteBalances","personalEventBoardBalances","personalEventLinearBalances","personalEventTasksHorizontalBalances","personalEventTasksVerticalBalances","personalEventTopUpBalances","personalEventWheelBalances","gameOffersCache","traderVanBalances"]);
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
const eventCenterRouletteAdsGid=1035905528;
const eventCenterTemplateEventGid=1195098988;
const eventCenterPixelPassGid=1170504714;
const gameOffersSpreadsheetId="1vlDGjRJqApHyicMYLd9PtFhL9C5FCl0jhD0N4D2zyWs";
const gameOfferGid=1298282127;
const gameOfferGuiGid=1741583800;
const gameOffersTestSpreadsheetId="1doZu0uLJTyNiAlx1D3SHih4Lw6AJDvVNpxMMvx6pjLE";
const priceTierGid=739652503;
const activeMapsSpreadsheetId="1e_y2x7YRupUSDXxhpsiOLzKTcDE8yq4oahgRiNgNfHU";
const activeMapsOverviewGid=1340983618;
const activeMapsModeTabs=[
  {gid:731056815,label:"Team Fight"},
  {gid:1493905143,label:"Deathmatch"},
  {gid:1264631773,label:"Flag Capture"},
  {gid:1704910560,label:"Capture Points"},
  {gid:1035921361,label:"Duel"},
];
const tierSpreadsheetId="1YKQ4dtCBeUVpMy1oaBxFC-nS4udGHvjYU_qx7U1HTMs";
const tierSheetGid=619054802;
const nameSheetGid=1632164539;
const contentPoolSpreadsheetId="1uOsaKGRCU1gghA5yGFDGXNl13bP5IwP5GnbO8VksLfM";
const traderVanSpreadsheetId="1qKogyjkoHpO6imV1aU5ZyWKpFuF9Hr_qPYyc8RpamfE";
const traderVanGid=1806543965;
const TRADER_VAN_FIELDS=["i_season","s_style","season","Show Van In Lobby","buylimit","id","start","end","price","sale","order","content","show_timer","price_amount"];
const personalEventScheduleSpreadsheetId="12WklJDMluXtBqlRzJblNLVvxXqh86R4hKbdLw7Mm-KE";
const personalEventBoardSpreadsheetId="18NncLI5KUdqG-j4C81P-smduV5Yz5yiUNU2IEquYX2Y";
const personalEventLinearSpreadsheetId="1nW_7hBl2bcdJ_kvsp8QESkMgw6Fk1_wYclcPUKGHyKw";
const personalEventTasksHorizontalSpreadsheetId="1WZ9VWAecfOlbDXtMCBrI0Up9h83YEXGj7T5Ouxxg7-E";
const personalEventTasksVerticalSpreadsheetId="1aZWPsqRbPJSXjHQgxhsraQkugOi6VDrA8xUFnhmjOAw";
const personalEventTopUpSpreadsheetId="1QGK9JE7gm1UGzg259O9uIoWaI3JkRkfj7uJPjjW-Fh0";
const personalEventWheelSpreadsheetId="1mrxcDYCoFRh4hScGYjT85TSOig3UVPWB4qIbxpD0hJc";
const taskReferenceSpreadsheetId="1woPA0mmXlRoTCjXwnOg2_D9n8Pveul2bWZYITgTwUOI";
const taskReferenceGid=1207975760;
const eventCenterPersonalizedEventGid=916675254;
const eventCenterTestPersonalizedEventGid=1513551562;
const weaponGeneratorPath="Z:\\pg3d\\Assets\\Scripts\\Item\\Generated\\ItemConverterId_clientToIndex.cs";
const itemsDataStoragePath="Z:\\pg3d\\Assets\\Editor\\Resources\\CommonData\\ItemsDataStorage.asset";
const languageEnglishPath="Z:\\pg3d\\Assets\\Editor\\Resources\\Localization\\Language_English.prefab";
const catalogXlsxPath="C:\\Users\\Валерия\\Desktop\\pg3d-dashboard\\data\\PG3D_Items_by_Category_Name_Tag_Id.xlsx";
const googleScope="https://www.googleapis.com/auth/spreadsheets";
const jiraHost="cubicgamesstudio.atlassian.net";

function googleCredentialsPath(){return path.join(app.getPath("userData"),"google-oauth.json")}
function googleTokenPath(){return path.join(app.getPath("userData"),"google-token.dat")}
function defaultGoogleCredentialsPath(){return path.join(__dirname,"google-oauth-default.json")}

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
  try{
    const bundled=JSON.parse(await fs.promises.readFile(defaultGoogleCredentialsPath(),"utf8"));
    if(bundled.installed?.client_id){
      await fs.promises.writeFile(googleCredentialsPath(),JSON.stringify({installed:bundled.installed}),"utf8");
      return bundled.installed;
    }
  }catch(error){if(error.code!=="ENOENT")throw error}
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

function jiraCredentialsPath(){return path.join(app.getPath("userData"),"jira-credentials.dat")}

async function writeJiraCredentials(creds){
  const serialized=Buffer.from(JSON.stringify(creds));
  const payload=safeStorage.isEncryptionAvailable()?`encrypted:${safeStorage.encryptString(serialized.toString("utf8")).toString("base64")}`:`plain:${serialized.toString("base64")}`;
  await fs.promises.writeFile(jiraCredentialsPath(),payload,"utf8");
}

async function readJiraCredentials(){
  try{
    const payload=await fs.promises.readFile(jiraCredentialsPath(),"utf8");
    if(payload.startsWith("encrypted:"))return JSON.parse(safeStorage.decryptString(Buffer.from(payload.slice(10),"base64")));
    if(payload.startsWith("plain:"))return JSON.parse(Buffer.from(payload.slice(6),"base64").toString("utf8"));
  }catch(error){if(error.code!=="ENOENT")console.error("Failed to read Jira credentials",error)}
  return null;
}

async function verifyJiraCredentials(email,token){
  const auth=Buffer.from(`${email}:${token}`).toString("base64");
  return new Promise((resolve,reject)=>{
    const req=https.request({hostname:jiraHost,path:"/rest/api/2/myself",method:"GET",headers:{authorization:`Basic ${auth}`,accept:"application/json"}},res=>{
      let body="";res.on("data",chunk=>body+=chunk);
      res.on("end",()=>{
        if(res.statusCode>=200&&res.statusCode<300){try{resolve(JSON.parse(body))}catch{resolve({})}}
        else reject(new Error(`Jira отклонил учётные данные (HTTP ${res.statusCode})`));
      });
    });
    req.on("error",reject);
    req.end();
  });
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
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(url,{...options,headers:{authorization:`Bearer ${accessToken}`,"content-type":"application/json",...(options.headers||{})}});
    const body=await response.json();
    if(response.ok)return body;
    const status=response.status;
    const message=body.error?.message||"Google Sheets API завершился ошибкой";
    lastError=new Error(message);
    const retryable=status===503||status===429||status>=500;
    if(!retryable||attempt===2)throw lastError;
    await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
  }
  throw lastError;
}

function colLetter(index){let value=index+1,name="";while(value>0){value--;name=String.fromCharCode(65+value%26)+name;value=Math.floor(value/26)}return name}

async function duplicateLotteryTemplateSheets(accessToken,spreadsheetId,base,isNewbies){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title,index)`);
  const templates=isNewbies
    ?[{source:"NewbiesChest",suffix:"Chest"},{source:"NewbiesGameRewards",suffix:"Rewards"},{source:"NewbiesInappsCurrency",suffix:"Currency"}]
    :[{source:"Chest",suffix:"Chest"},{source:"GameRewards",suffix:"Rewards"},{source:"InappsCurrency",suffix:"Currency"}];
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
  const normalized=items.map(item=>({
    containerId:Number(item?.containerId),
    containerType:String(item?.containerType||"SingleItem"),
    category:String(item?.category||""),
    itemType:String(item?.itemType||""),
    itemId:String(item?.itemId??""),
    alternativeReward:String(item?.alternativeReward||""),
    showInPreview:!!item?.showInPreview,
    itemSubtype:String(item?.itemSubtype||""),
    count:Number(item?.count),
    dropChance:Number(item?.dropChance),
  }));
  if(normalized.some(item=>!Number.isInteger(item.containerId)||!item.itemType||!Number.isFinite(item.count)||!Number.isFinite(item.dropChance)))throw new Error("В симуляторе есть некорректные ID или числовые значения");
  const duplicateIds=normalized.map(item=>item.containerId).filter((id,index,all)=>all.indexOf(id)!==index);
  if(duplicateIds.length)throw new Error(`ID повторяются в симуляторе: ${[...new Set(duplicateIds)].join(", ")}`);

  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.title===title);
  if(!sheet)throw new Error(`Лист «${title}» не найден`);
  const sheetId=sheet.properties.sheetId;

  const quotedTitle=`'${title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=valuesResponse.values||[];
  const required=["container_id","container_type","category","item_type","item_id","alternative_reward","ShowInPreview","item_subtype","count","drop_chance"];
  const headerIndex=rows.findIndex(row=>required.every(header=>row.includes(header)));
  if(headerIndex<0)throw new Error(`На листе «${title}» не найдены поля: ${required.join(", ")}`);
  const header=rows[headerIndex];
  const columns=Object.fromEntries(required.map(name=>[name,header.indexOf(name)]));
  const formulaCol=header.findIndex(h=>String(h||"").trim()==="drop_chance (400)%");

  const blockOf=id=>Math.floor(id/100)*100;
  const blocks=new Map();
  for(const item of normalized){const b=blockOf(item.containerId);if(!blocks.has(b))blocks.set(b,[]);blocks.get(b).push(item)}
  for(const arr of blocks.values())arr.sort((a,b)=>a.containerId-b.containerId);

  const dataRows=rows.slice(headerIndex+1).map((row,i)=>({sheetRow:headerIndex+2+i,containerId:Number(row[columns.container_id])})).filter(r=>Number.isFinite(r.containerId));
  const existingBlocks=new Map();
  for(const r of dataRows){const b=blockOf(r.containerId);if(!existingBlocks.has(b))existingBlocks.set(b,[]);existingBlocks.get(b).push(r)}
  for(const arr of existingBlocks.values())arr.sort((a,b)=>a.sheetRow-b.sheetRow);

  const notFoundBlocks=[...blocks.keys()].filter(b=>!existingBlocks.has(b));
  if(notFoundBlocks.length)throw new Error(`На листе не найден блок строк для ID начиная с ${notFoundBlocks.join(", ")} — авто-создание нового блока не поддерживается`);

  const structRequests=[];
  for(const [blockStart,blockItems] of blocks){
    const existing=existingBlocks.get(blockStart);
    const needed=blockItems.length;
    const have=existing.length;
    if(have>needed){
      const toDelete=existing.slice(needed);
      const startIndex=toDelete[0].sheetRow-1;
      const endIndex=toDelete[toDelete.length-1].sheetRow;
      structRequests.push({sortRow:startIndex,requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]});
    }else if(have<needed){
      const missing=needed-have;
      const lastRow=existing[existing.length-1].sheetRow;
      const group=[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex:lastRow,endIndex:lastRow+missing},inheritFromBefore:true}}];
      if(formulaCol>=0){
        group.push({copyPaste:{
          source:{sheetId,startRowIndex:lastRow-1,endRowIndex:lastRow,startColumnIndex:formulaCol,endColumnIndex:formulaCol+1},
          destination:{sheetId,startRowIndex:lastRow,endRowIndex:lastRow+missing,startColumnIndex:formulaCol,endColumnIndex:formulaCol+1},
          pasteType:"PASTE_FORMULA"
        }});
      }
      structRequests.push({sortRow:lastRow,requests:group});
    }
  }
  if(structRequests.length){
    structRequests.sort((a,b)=>b.sortRow-a.sortRow);
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:structRequests.flatMap(r=>r.requests)})});
  }

  // Blocks below any resized block physically shift — compute the corrected final start row for each
  // block by walking blocks top-to-bottom and accumulating the net row-count delta introduced above it.
  const blocksByOriginalOrder=[...blocks.keys()].sort((a,b)=>existingBlocks.get(a)[0].sheetRow-existingBlocks.get(b)[0].sheetRow);
  const blockStarts=[];
  let cumulativeDelta=0;
  for(const blockStart of blocksByOriginalOrder){
    const existing=existingBlocks.get(blockStart);
    const needed=blocks.get(blockStart).length;
    const have=existing.length;
    blockStarts.push({blockStart,startRow:existing[0].sheetRow+cumulativeDelta});
    cumulativeDelta+=(needed-have);
  }

  const data=[];
  for(const {blockStart,startRow}of blockStarts){
    const blockItems=blocks.get(blockStart);
    blockItems.forEach((item,index)=>{
      const row=startRow+index;
      data.push({range:`${quotedTitle}!${colLetter(columns.container_id)}${row}`,values:[[item.containerId]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.container_type)}${row}`,values:[[item.containerType]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.category)}${row}`,values:[[item.category]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.item_type)}${row}`,values:[[item.itemType]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.item_id)}${row}`,values:[[item.itemId]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.alternative_reward)}${row}`,values:[[item.alternativeReward]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.ShowInPreview)}${row}`,values:[[item.showInPreview]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.item_subtype)}${row}`,values:[[item.itemSubtype]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.count)}${row}`,values:[[item.count]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.drop_chance)}${row}`,values:[[item.dropChance]]});
    });
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

ipcMain.handle("google:get-status",async()=>{
  const token=await readGoogleToken();
  return {connected:!!(token&&token.refresh_token)};
});

ipcMain.handle("google:connect",async()=>{
  await getGoogleAccessToken();
  return {connected:true};
});

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

ipcMain.handle("google:get-segment-expressions",async()=>{
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${eventCenterSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===segmentsSheetGid);
  if(!sheet)return {};
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const resp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!B2:C10000`)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=resp.values||[];
  const map={};
  for(const row of rows){
    const name=String(row[0]||"").trim();
    if(name&&map[name]===undefined)map[name]=String(row[1]||"");
  }
  return map;
});

ipcMain.handle("google:get-reward-pools",async()=>{
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${contentPoolSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.title==="Pools");
  if(!sheet)return [];
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const resp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!A1:A10000`)}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`);
  const col=(resp.values&&resp.values[0])||[];
  const header=col[0];
  const rest=String(header||"").trim().toLowerCase()==="poolid"?col.slice(1):col;
  return [...new Set(rest.map(v=>String(v||"").trim()).filter(Boolean))];
});

ipcMain.handle("google:apply-lottery-partition",async(_event,partition)=>{
  const {name,id,style,segment,startDateTime,endDateTime,balanceItems,balanceName,target}=partition||{};
  const cleanName=String(name||"").replace(/\s+/g,"");
  if(!cleanName)throw new Error("Укажите Name");
  if(!id)throw new Error("Укажите Id");
  const isTest=target==="test";
  const isNewbies=/LotteryNewbies$/i.test(String(balanceName||"").trim());
  const lotterySpId=isTest?lotteryTestSpreadsheetId:lotterySpreadsheetId;
  const scheduleGid=isTest?lotteryTestScheduleGid:lotteryScheduleGid;
  const eventCenterSpId=isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId;
  const lotteryGid=isTest?eventCenterTestLotteryGid:eventCenterLotteryGid;

  const accessToken=await getGoogleAccessToken();
  const names=await duplicateLotteryTemplateSheets(accessToken,lotterySpId,cleanName,isNewbies);
  await appendScheduleRow(accessToken,lotterySpId,scheduleGid,{name:cleanName,style:style||"",uniqueId:id});
  await appendLotteryRow(accessToken,eventCenterSpId,lotteryGid,{id,style:style||"",segment:segment||"",startDateTime:startDateTime||"",endDateTime:endDateTime||""});
  if(Array.isArray(balanceItems)&&balanceItems.length){
    await buildLotteryConfigInSheet(accessToken,lotterySpId,names[0],balanceItems);
  }
  return {names,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${lotterySpId}/edit`};
});

function chestAttributeId(chestNumber){return 90000+Number(chestNumber)*1000+201}

async function duplicateCardRouletteTemplateSheets(accessToken,spreadsheetId,base){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title,index)`);
  const templates=[{source:"Settings_Template",name:`Settings_${base}`},{source:"Chests_Template",name:`Chests_${base}`}];
  const sheets=new Map((spreadsheet.sheets||[]).map(sheet=>[sheet.properties.title,sheet.properties]));
  const missing=templates.filter(template=>!sheets.has(template.source)).map(template=>template.source);
  if(missing.length)throw new Error(`Не найдены дефолтные листы: ${missing.join(", ")}`);
  const conflicts=templates.filter(template=>sheets.has(template.name)).map(template=>template.name);
  if(conflicts.length)throw new Error(`Листы уже существуют: ${conflicts.join(", ")}`);
  await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:templates.map(template=>({duplicateSheet:{sourceSheetId:sheets.get(template.source).sheetId,newSheetName:template.name}})).reverse()})});
  return {settings:templates[0].name,chests:templates[1].name};
}

async function appendCardRouletteScheduleRow(accessToken,spreadsheetId,scheduleGid,overrides){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===scheduleGid);
  if(!sheet)throw new Error("Лист Schedule не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const allResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=allResp.values||[];
  if(rows.length<2)throw new Error("На листе Schedule нет строк для копирования");
  const lastRow=[...rows[rows.length-1]];
  while(lastRow.length<6)lastRow.push("");
  lastRow[1]=overrides.uniqueId;
  lastRow[4]=overrides.sheetName;
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[lastRow]})});
}

async function buildCardRouletteSettingsInSheet(accessToken,spreadsheetId,sheetName,settings){
  const title=String(sheetName||"").trim();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.title===title);
  if(!sheet)throw new Error(`Лист «${title}» не найден`);
  const quotedTitle=`'${title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=valuesResponse.values||[];
  const required=["UniqueId","Style","FirstOpenDiscount","OpenPrices","ChestIds","AttributeIds","LevelOpen"];
  const headerIndex=rows.findIndex(row=>required.every(header=>row.includes(header)));
  if(headerIndex<0)throw new Error(`На листе «${title}» не найдены поля: ${required.join(", ")}`);
  const header=rows[headerIndex];
  const columns=Object.fromEntries(required.map(name=>[name,header.indexOf(name)]));
  const targetRow=headerIndex+2;
  const data=required.map(name=>({range:`${quotedTitle}!${colLetter(columns[name])}${targetRow}`,values:[[settings[name]??""]]}));
  await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

async function buildCardRouletteChestsInSheet(accessToken,spreadsheetId,sheetName,chests){
  const title=String(sheetName||"").trim();
  if(!title)throw new Error("Введите название листа");
  if(!Array.isArray(chests)||!chests.length)throw new Error("В симуляторе нет данных для записи");

  const normalized=[];
  for(const chest of chests){
    const chestId=Number(chest.chestNumber);
    const attributeId=chestAttributeId(chestId);
    for(const item of chest.items||[]){
      const cellId=Number(item.cellId);
      normalized.push({
        chestId,cellId,
        item:`${item.itemType||""}:${item.itemValue||""}:${item.itemCount??""}`,
        altItem:item.altItemType||item.altItemValue||item.altItemCount!==undefined&&item.altItemCount!==""?`${item.altItemType||""}:${item.altItemValue||""}:${item.altItemCount??""}`:"",
        dropChance:Number(item.dropChance??1),
        previewed:!!item.previewed,
        cool:!!item.cool,
        showInPreview:!!item.showInPreview,
        expression:item.expressionValue!==undefined&&item.expressionValue!==""?`${attributeId}:GreaterEqual:${item.expressionValue}`:"",
      });
    }
  }
  if(normalized.some(item=>!Number.isInteger(item.chestId)||!Number.isInteger(item.cellId)||!Number.isFinite(item.dropChance)))throw new Error("В симуляторе есть некорректные ID сундука/ячейки или числовые значения");

  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.title===title);
  if(!sheet)throw new Error(`Лист «${title}» не найден`);
  const sheetId=sheet.properties.sheetId;

  const quotedTitle=`'${title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=valuesResponse.values||[];
  const required=["ChestId","CellId","Item","AlterItem","DropChance","Previewed","Cool","ShowInPreview","Expression"];
  const headerIndex=rows.findIndex(row=>required.every(header=>row.includes(header)));
  if(headerIndex<0)throw new Error(`На листе «${title}» не найдены поля: ${required.join(", ")}`);
  const header=rows[headerIndex];
  const columns=Object.fromEntries(required.map(name=>[name,header.indexOf(name)]));

  const blocks=new Map();
  for(const item of normalized){if(!blocks.has(item.chestId))blocks.set(item.chestId,[]);blocks.get(item.chestId).push(item)}
  for(const arr of blocks.values())arr.sort((a,b)=>a.cellId-b.cellId);

  let lastChestId=null;
  const dataRows=rows.slice(headerIndex+1).map((row,i)=>{
    const raw=row[columns.ChestId];
    const isBlank=raw===undefined||raw===null||raw==="";
    if(!isBlank&&Number.isFinite(Number(raw)))lastChestId=Number(raw);
    return {sheetRow:headerIndex+2+i,chestId:lastChestId};
  }).filter(r=>r.chestId!==null);
  const existingBlocks=new Map();
  for(const r of dataRows){if(!existingBlocks.has(r.chestId))existingBlocks.set(r.chestId,[]);existingBlocks.get(r.chestId).push(r)}
  for(const arr of existingBlocks.values())arr.sort((a,b)=>a.sheetRow-b.sheetRow);

  const notFoundBlocks=[...blocks.keys()].filter(b=>!existingBlocks.has(b));
  if(notFoundBlocks.length)throw new Error(`На листе не найден блок строк для сундука №${notFoundBlocks.join(", ")} — авто-создание нового сундука не поддерживается`);

  const structRequests=[];
  for(const [chestId,chestItems] of blocks){
    const existing=existingBlocks.get(chestId);
    const needed=chestItems.length;
    const have=existing.length;
    if(have>needed){
      const toDelete=existing.slice(needed);
      const startIndex=toDelete[0].sheetRow-1;
      const endIndex=toDelete[toDelete.length-1].sheetRow;
      structRequests.push({sortRow:startIndex,requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]});
    }else if(have<needed){
      const missing=needed-have;
      const lastRow=existing[existing.length-1].sheetRow;
      structRequests.push({sortRow:lastRow,requests:[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex:lastRow,endIndex:lastRow+missing},inheritFromBefore:true}}]});
    }
  }
  if(structRequests.length){
    structRequests.sort((a,b)=>b.sortRow-a.sortRow);
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:structRequests.flatMap(r=>r.requests)})});
  }

  const blocksByOriginalOrder=[...blocks.keys()].sort((a,b)=>existingBlocks.get(a)[0].sheetRow-existingBlocks.get(b)[0].sheetRow);
  const blockStarts=[];
  let cumulativeDelta=0;
  for(const chestId of blocksByOriginalOrder){
    const existing=existingBlocks.get(chestId);
    const needed=blocks.get(chestId).length;
    const have=existing.length;
    blockStarts.push({chestId,startRow:existing[0].sheetRow+cumulativeDelta});
    cumulativeDelta+=(needed-have);
  }

  const data=[];
  for(const {chestId,startRow}of blockStarts){
    const chestItems=blocks.get(chestId);
    chestItems.forEach((item,index)=>{
      const row=startRow+index;
      data.push({range:`${quotedTitle}!${colLetter(columns.ChestId)}${row}`,values:[[index===0?item.chestId:""]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.CellId)}${row}`,values:[[item.cellId]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.Item)}${row}`,values:[[item.item]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.AlterItem)}${row}`,values:[[item.altItem]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.DropChance)}${row}`,values:[[item.dropChance]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.Previewed)}${row}`,values:[[item.previewed]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.Cool)}${row}`,values:[[item.cool]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.ShowInPreview)}${row}`,values:[[item.showInPreview]]});
      data.push({range:`${quotedTitle}!${colLetter(columns.Expression)}${row}`,values:[[item.expression]]});
    });
  }
  await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return{updated:normalized.length,sheetName:title};
}

async function readSheetValues(accessToken,spreadsheetId,title){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const quotedTitle=`'${title.replace(/'/g,"''")}'`;
  const resp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  return {rows:resp.values||[],quotedTitle,api};
}

async function findLatestNumberedSheet(accessToken,spreadsheetId,prefix){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  let best=null;
  for(const sheet of spreadsheet.sheets||[]){
    const title=sheet.properties.title;
    if(!title.startsWith(prefix))continue;
    const suffix=title.slice(prefix.length);
    if(!/^\d+$/.test(suffix))continue;
    const number=Number(suffix);
    if(!best||number>best.number)best={title,sheetId:sheet.properties.sheetId,number};
  }
  if(!best)throw new Error(`Не найден ни один лист с префиксом ${prefix}`);
  return best;
}

async function duplicatePersonalEventSheets(accessToken,spreadsheetId,prefixes,newId){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title,index)`);
  const allSheets=spreadsheet.sheets||[];
  const found=prefixes.map(prefix=>{
    let best=null;
    for(const sheet of allSheets){
      const title=sheet.properties.title;
      if(!title.startsWith(prefix))continue;
      const suffix=title.slice(prefix.length);
      if(!/^\d+$/.test(suffix))continue;
      const number=Number(suffix);
      if(!best||number>best.number)best={title,sheetId:sheet.properties.sheetId,number};
    }
    if(!best)throw new Error(`Не найден ни один лист с префиксом ${prefix}`);
    return best;
  });
  const names={};
  const requests=found.map((sheet,i)=>{
    const newName=`${prefixes[i]}${newId}`;
    names[prefixes[i]]=newName;
    return {duplicateSheet:{sourceSheetId:sheet.sheetId,newSheetName:newName}};
  }).reverse();
  await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests})});
  return names;
}

async function getNextPersonalEventId(accessToken,eventType){
  const spreadsheetId=personalEventScheduleSpreadsheetId;
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheetTitle=meta.sheets?.[0]?.properties?.title;
  if(!sheetTitle)throw new Error("Не найден лист в таблице Schedule (Personal Event)");
  const {rows}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const headerIdx=rows.findIndex(row=>row.includes("IsEnable")&&row.includes("EventType")&&row.includes("Id"));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы Schedule");
  const header=rows[headerIdx];
  const typeCol=header.indexOf("EventType"),idCol=header.indexOf("Id");
  let maxId=0,lastMatchRow=null;
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row[typeCol]!==eventType)continue;
    const idVal=Number(row[idCol]);
    if(Number.isFinite(idVal)&&idVal>maxId){maxId=idVal;lastMatchRow=row}
  }
  return {nextId:maxId+1,header,lastMatchRow,sheetTitle,headerIdx};
}

async function appendPersonalEventScheduleRow(accessToken,eventType,newId,overrides){
  const spreadsheetId=personalEventScheduleSpreadsheetId;
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const {header,lastMatchRow,sheetTitle}=await getNextPersonalEventId(accessToken,eventType);
  const quotedTitle=`'${sheetTitle.replace(/'/g,"''")}'`;
  const template=lastMatchRow?[...lastMatchRow]:header.map(()=>"");
  while(template.length<header.length)template.push("");
  const setCol=(name,value)=>{const c=header.indexOf(name);if(c>=0&&value!==undefined)template[c]=value};
  setCol("IsEnable",false);
  setCol("Id",newId);
  setCol("EventType",eventType);
  setCol("StartDistributionDate",overrides.startDate);
  setCol("EndDistributionDate",overrides.endDate);
  setCol("Expression",overrides.expression);
  setCol("GroupId",overrides.groupId);
  setCol("Примечание GD",overrides.note);
  setCol("EndCompletionDate",overrides.endCompletionDate);
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[template]})});
}

async function appendPersonalizedEventRow(accessToken,spreadsheetId,gid,fields){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(s=>s.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист PersonalizedEvent не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const resp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const rows=resp.values||[];
  if(!rows.length)throw new Error("Лист PersonalizedEvent пуст");
  const lastRow=[...rows[rows.length-1]];
  while(lastRow.length<9)lastRow.push("");
  lastRow[2]=fields.eventId;
  lastRow[3]=fields.startDate;
  lastRow[4]=fields.endDate;
  lastRow[5]=fields.segment||"";
  lastRow[6]=fields.groupId??"";
  lastRow[8]=fields.style||"";
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[lastRow]})});
}

async function readEventCenterTab(accessToken,gid,typeLabel){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${eventCenterSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)return [];
  const {rows}=await readSheetValues(accessToken,eventCenterSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("EventId")&&(row.includes("StartDate")||row.includes("StartDistributionDate")));
  if(headerIdx<0)return [];
  const header=rows[headerIdx];
  const idCol=header.indexOf("EventId");
  const startCol=header.indexOf("StartDate")>=0?header.indexOf("StartDate"):header.indexOf("StartDistributionDate");
  const endCol=header.indexOf("EndDate")>=0?header.indexOf("EndDate"):header.indexOf("EndDistributionDate");
  const segCol=header.indexOf("Segment");
  const styleCol=header.indexOf("Style");
  const enableCol=header.indexOf("IsEnable");
  const normalizeSheetDate=value=>{
    if(typeof value==="string"){
      const trimmed=value.trim();
      return (/^\d{4}-\d{2}-\d{2}/.test(trimmed)&&!Number.isNaN(new Date(trimmed).getTime()))?trimmed:null;
    }
    if(typeof value==="number"&&Number.isFinite(value)){
      const ms=Date.UTC(1899,11,30)+value*86400000;
      const d=new Date(ms);
      if(Number.isNaN(d.getTime()))return null;
      const pad=n=>String(n).padStart(2,"0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    }
    return null;
  };
  const results=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row[idCol]===undefined||row[idCol]==="")continue;
    const startNormalized=normalizeSheetDate(row[startCol]);
    if(!startNormalized)continue;
    const endNormalized=normalizeSheetDate(row[endCol])||startNormalized;
    results.push({
      type:typeLabel,
      eventId:String(row[idCol]),
      start:startNormalized,
      end:endNormalized,
      segment:segCol>=0?String(row[segCol]||""):"",
      style:styleCol>=0?String(row[styleCol]||""):"",
      enabled:enableCol>=0?(row[enableCol]===true||String(row[enableCol]).trim().toUpperCase()==="TRUE"):true,
    });
  }
  return results;
}

ipcMain.handle("google:sync-event-center",async()=>{
  const accessToken=await getGoogleAccessToken();
  const tabs=[
    {gid:eventCenterLotteryGid,type:"Lottery"},
    {gid:eventCenterCardRouletteGid,type:"Card Roulette"},
    {gid:eventCenterRouletteAdsGid,type:"Ads Roulette"},
    {gid:eventCenterTemplateEventGid,type:"Template Event"},
    {gid:eventCenterPersonalizedEventGid,type:"Personal Event"},
    {gid:eventCenterPixelPassGid,type:"Pixel Pass"},
  ];
  let all=[];
  for(const tab of tabs){
    const rows=await readEventCenterTab(accessToken,tab.gid,tab.type);
    all=all.concat(rows);
  }
  const cutoff=new Date(new Date().getFullYear(),0,1);
  const filtered=all.filter(row=>{
    const d=new Date(row.start);
    return !Number.isNaN(d.getTime())&&d>=cutoff;
  });
  const groups=new Map();
  for(const row of filtered){
    const key=`${row.type}|${row.style}|${row.start}|${row.end}`;
    if(!groups.has(key))groups.set(key,{type:row.type,style:row.style,start:row.start,end:row.end,eventIds:[],segments:[],enabledFlags:[]});
    const group=groups.get(key);
    group.eventIds.push(row.eventId);
    if(row.segment)group.segments.push(row.segment);
    group.enabledFlags.push(row.enabled);
  }
  return [...groups.values()].map(group=>({
    type:group.type,style:group.style,start:group.start,end:group.end,
    eventIds:group.eventIds,segments:group.segments,
    enabled:group.enabledFlags.every(Boolean),
  }));
});

async function setEventCenterEnabled(accessToken,gid,eventIds,enabled){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${eventCenterSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист не найден в EventCenterConfig");
  const {rows,quotedTitle,api:sheetsApi}=await readSheetValues(accessToken,eventCenterSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("EventId")&&(row.includes("StartDate")||row.includes("StartDistributionDate")));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы");
  const header=rows[headerIdx];
  const idCol=header.indexOf("EventId");
  const enableCol=header.indexOf("IsEnable");
  if(enableCol<0)throw new Error("Не найдена колонка IsEnable");
  const idSet=new Set(eventIds.map(String));
  const data=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row[idCol]===undefined)continue;
    if(idSet.has(String(row[idCol])))data.push({range:`${quotedTitle}!${colLetter(enableCol)}${i+1}`,values:[[!!enabled]]});
  }
  if(!data.length)throw new Error("Не найдено ни одной строки с указанными id в EventCenterConfig");
  await sheetsRequest(accessToken,`${sheetsApi}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return {updated:data.length};
}

ipcMain.handle("google:set-event-enabled",async(_event,payload)=>{
  const {type,eventIds,enabled}=payload||{};
  if(type==="Offers"){
    if(!Array.isArray(eventIds)||!eventIds.length)throw new Error("У этой кампании нет привязанных офферов");
    const accessToken=await getGoogleAccessToken();
    return setOffersEnabled(accessToken,eventIds,!!enabled);
  }
  const gidMap={
    Lottery:eventCenterLotteryGid,
    "Card Roulette":eventCenterCardRouletteGid,
    "Ads Roulette":eventCenterRouletteAdsGid,
    "Template Event":eventCenterTemplateEventGid,
    "Personal Event":eventCenterPersonalizedEventGid,
    "Pixel Pass":eventCenterPixelPassGid,
  };
  const gid=gidMap[type];
  if(gid===undefined)throw new Error(`Синхронизация статуса недоступна для типа «${type}»`);
  if(!Array.isArray(eventIds)||!eventIds.length)throw new Error("У этого события нет привязки к EventCenterConfig");
  const accessToken=await getGoogleAccessToken();
  return setEventCenterEnabled(accessToken,gid,eventIds,!!enabled);
});

async function findGameOfferSheetInfo(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${gameOffersSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gameOfferGid);
  if(!sheet)throw new Error("Лист GameOffer не найден");
  const {rows}=await readSheetValues(accessToken,gameOffersSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("Id")&&row.includes("Label"));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы GameOffer");
  return {api,quotedTitle:`'${sheet.properties.title.replace(/'/g,"''")}'`,rows,header:rows[headerIdx],headerIdx};
}

async function setOffersEnabled(accessToken,offerIds,enabled){
  const {api,quotedTitle,rows,header,headerIdx}=await findGameOfferSheetInfo(accessToken);
  const idCol=header.indexOf("Id");
  const enableCol=header.indexOf("IsEnable");
  if(enableCol<0)throw new Error("Не найдена колонка IsEnable");
  const idSet=new Set(offerIds.map(String));
  const data=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(row&&idSet.has(String(row[idCol])))data.push({range:`${quotedTitle}!${colLetter(enableCol)}${i+1}`,values:[[!!enabled]]});
  }
  if(!data.length)throw new Error("Не найдено ни одного оффера с такими id");
  await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return {updated:data.length};
}

async function setOffersDates(accessToken,offerIds,startTime,endTime){
  const {api,quotedTitle,rows,header,headerIdx}=await findGameOfferSheetInfo(accessToken);
  const idCol=header.indexOf("Id");
  const startCol=header.indexOf("StartTime");
  const endCol=header.indexOf("EndTime");
  const idSet=new Set(offerIds.map(String));
  const data=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(row&&idSet.has(String(row[idCol]))){
      data.push({range:`${quotedTitle}!${colLetter(startCol)}${i+1}`,values:[[startTime]]});
      data.push({range:`${quotedTitle}!${colLetter(endCol)}${i+1}`,values:[[endTime]]});
    }
  }
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return {updated:data.length/2};
}

ipcMain.handle("google:apply-offer-campaign",async(_event,payload)=>{
  const {offerIdsToDate,startTime,endTime}=payload||{};
  if(!Array.isArray(offerIdsToDate)||!offerIdsToDate.length)return {updated:0};
  const accessToken=await getGoogleAccessToken();
  return setOffersDates(accessToken,offerIdsToDate,startTime,endTime);
});

const GAME_OFFER_FIELDS=["Id","Label","Type","BindedOffers","PriceTier","PriceItem","AsAGift","AsAGiftHideNick","Country","StartTime","EndTime","Lifetime","Cooldown","CooldownOnBuy","GuiOrder","BuyLimit","GameOfferGroup","Priority","GameOfferGui","GameOfferGuiDouble","PopupOnStart","PopupPriority","LobbyPopupCooldown","ShowPreview","EnableMiniBanner","OrderMiniBanner","PlatformList","IsEnable","AnalyticGroup","Expression","$","ItemReward","ForDeepLink","ShowOnlyIfAvailableByExpression","IgnoreGlobalAndGroupCooldown","PlaceToShow"];
const GAME_OFFER_GUI_FIELDS=["Id","Label","PrefabGuiWindow","ImageGuiWindowMain","GuiApplyer","ImagePattern","TextTitle","TextDescription","TextDescriptionLong","ColorLabel1","TextLabel1","ColorLabel2","TextLabel2","TextTimeLeft","TextPrice","TextOldPrice","PriceOldSale","TextButtonBuy","TextSale","SaleAmount","BankSection","PrefabGuiBank","LayoutTypeBank","ImageGuiBank","PrefabBannerLobby","ImageBannerLobby"];
const GAME_OFFER_LIST_FIELDS=["Type","PriceTier","Country","GameOfferGroup","PlatformList","Expression"];
const GAME_OFFER_GUI_LIST_FIELDS=["PrefabGuiWindow","ImageGuiWindowMain","GuiApplyer","ImagePattern","BankSection","PrefabGuiBank","LayoutTypeBank","ImageGuiBank","PrefabBannerLobby","ImageBannerLobby"];

async function readGameOffersTab(accessToken,gid){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${gameOffersSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист не найден в GameOffersSystem");
  const {rows}=await readSheetValues(accessToken,gameOffersSpreadsheetId,sheet.properties.title);
  return {title:sheet.properties.title,rows};
}

function rowsToObjects(rows,headerMatch,fields){
  const headerIdx=rows.findIndex(row=>headerMatch.every(name=>row.includes(name)));
  if(headerIdx<0)return {objects:[],headerIdx:-1,columns:{}};
  const header=rows[headerIdx];
  const columns=Object.fromEntries(fields.map(name=>[name,header.indexOf(name)]));
  const idCol=columns.Id;
  const objects=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||idCol<0||row[idCol]===undefined||row[idCol]==="")continue;
    const obj={};
    for(const name of fields)obj[name]=columns[name]>=0?(row[columns[name]]??""):"";
    objects.push(obj);
  }
  return {objects,headerIdx,columns};
}

function uniqueValues(objects,field){
  return [...new Set(objects.map(o=>String(o[field]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}

async function readPriceTiers(accessToken){
  const {rows}=await readGameOffersTab(accessToken,priceTierGid);
  const map={};
  for(const row of rows){
    if(!row||!row[0])continue;
    const key=String(row[0]).trim();
    if(/^PriceTier/i.test(key))map[key]=String(row[1]||"").trim();
  }
  return map;
}

ipcMain.handle("google:sync-offers",async()=>{
  const accessToken=await getGoogleAccessToken();
  const [offerTab,guiTab,priceTiers]=await Promise.all([
    readGameOffersTab(accessToken,gameOfferGid),
    readGameOffersTab(accessToken,gameOfferGuiGid),
    readPriceTiers(accessToken),
  ]);
  const {objects:offerRows}=rowsToObjects(offerTab.rows,["Id","Label","Type"],GAME_OFFER_FIELDS);
  const {objects:guiRows}=rowsToObjects(guiTab.rows,["Id","Label","PrefabGuiWindow"],GAME_OFFER_GUI_FIELDS);
  const guiById=new Map(guiRows.map(gui=>[String(gui.Id),gui]));
  const offers=offerRows.map(offer=>({
    ...offer,
    gui:guiById.get(String(offer.GameOfferGui))||null,
    guiDouble:offer.Type==="Double"?(guiById.get(String(offer.GameOfferGuiDouble))||null):null,
  }));
  const listOptions={};
  for(const field of GAME_OFFER_LIST_FIELDS)listOptions[field]=uniqueValues(offerRows,field);
  for(const field of GAME_OFFER_GUI_LIST_FIELDS)listOptions[field]=uniqueValues(guiRows,field);
  return {offers,priceTiers,listOptions};
});

async function upsertGameOffersRow(accessToken,spreadsheetId,gid,fields,idValue,values,idSuffix){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист не найден в GameOffersSystem");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const {rows}=await readSheetValues(accessToken,spreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("Id")&&row.includes("Label"));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы");
  const header=rows[headerIdx];
  const idCol=header.indexOf("Id");
  let targetRow=-1;
  if(idValue){
    for(let i=headerIdx+1;i<rows.length;i++){
      if(rows[i]&&String(rows[i][idCol])===String(idValue)){targetRow=i;break}
    }
  }
  if(targetRow<0){
    let maxPrefix=0;
    const suffixPattern=new RegExp(`^(\\d+)${idSuffix}$`);
    for(let i=headerIdx+1;i<rows.length;i++){
      const row=rows[i];
      if(!row||row[idCol]===undefined)continue;
      const match=String(row[idCol]).match(suffixPattern);
      if(match){const prefix=Number(match[1]);if(prefix>maxPrefix)maxPrefix=prefix}
    }
    const finalId=`${maxPrefix+1}${idSuffix}`;
    const rowValues=fields.map(name=>{
      if(name==="Id")return finalId;
      const value=values[name];
      return value===undefined?"":value;
    });
    await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[rowValues]})});
    return finalId;
  }
  const sheetRow=targetRow+1;
  const data=[];
  for(const name of fields){
    if(name==="Id")continue;
    const col=header.indexOf(name);
    if(col<0)continue;
    const value=values[name];
    data.push({range:`${quotedTitle}!${colLetter(col)}${sheetRow}`,values:[[value===undefined?"":value]]});
  }
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
  return idValue;
}

ipcMain.handle("google:save-offer",async(_event,payload)=>{
  const {offer}=payload||{};
  if(!offer)throw new Error("Нет данных оффера");
  const accessToken=await getGoogleAccessToken();
  const priceTiers=await readPriceTiers(accessToken);

  let guiId=offer.GameOfferGui||"";
  if(offer.gui){
    guiId=await upsertGameOffersRow(accessToken,gameOffersSpreadsheetId,gameOfferGuiGid,GAME_OFFER_GUI_FIELDS,offer.gui.__new?null:offer.gui.Id,offer.gui,"213");
  }
  let guiDoubleId=offer.GameOfferGuiDouble||"";
  if(offer.Type==="Double"&&offer.guiDouble){
    guiDoubleId=await upsertGameOffersRow(accessToken,gameOffersSpreadsheetId,gameOfferGuiGid,GAME_OFFER_GUI_FIELDS,offer.guiDouble.__new?null:offer.guiDouble.Id,offer.guiDouble,"213");
  }

  const values={...offer,GameOfferGui:guiId,GameOfferGuiDouble:offer.Type==="Double"?guiDoubleId:"","$":priceTiers[offer.PriceTier]||""};
  const finalId=await upsertGameOffersRow(accessToken,gameOffersSpreadsheetId,gameOfferGid,GAME_OFFER_FIELDS,offer.__new?null:offer.Id,values,"211");
  return {id:finalId,guiId,guiDoubleId,price:priceTiers[offer.PriceTier]||""};
});

ipcMain.handle("google:delete-offer",async(_event,payload)=>{
  const {id}=payload||{};
  if(!id)throw new Error("Не указан id оффера");
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${gameOffersSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gameOfferGid);
  if(!sheet)throw new Error("Лист не найден");
  const {rows}=await readSheetValues(accessToken,gameOffersSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("Id")&&row.includes("Label"));
  const idCol=rows[headerIdx].indexOf("Id");
  let rowIndex=-1;
  for(let i=headerIdx+1;i<rows.length;i++){
    if(rows[i]&&String(rows[i][idCol])===String(id)){rowIndex=i;break}
  }
  if(rowIndex<0)throw new Error("Оффер не найден в таблице");
  await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId:gameOfferGid,dimension:"ROWS",startIndex:rowIndex,endIndex:rowIndex+1}}}]})});
  return {deleted:true};
});

async function upsertByExactId(accessToken,spreadsheetId,gid,idValue,values){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист не найден в тестовой GameOffersSystem");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const {rows}=await readSheetValues(accessToken,spreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("Id")&&row.includes("Label"));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы в тестовой GameOffersSystem");
  const header=rows[headerIdx];
  const idCol=header.indexOf("Id");
  let targetRow=-1;
  for(let i=headerIdx+1;i<rows.length;i++){
    if(rows[i]&&String(rows[i][idCol])===String(idValue)){targetRow=i;break}
  }
  if(targetRow<0){
    const rowValues=header.map(name=>{
      const value=values[name];
      return value===undefined?"":value;
    });
    await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[rowValues]})});
    return;
  }
  const sheetRow=targetRow+1;
  const data=[];
  for(const name of Object.keys(values)){
    const col=header.indexOf(name);
    if(col<0)continue;
    data.push({range:`${quotedTitle}!${colLetter(col)}${sheetRow}`,values:[[values[name]===undefined?"":values[name]]]});
  }
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

ipcMain.handle("google:apply-offer-campaign-test",async(_event,payload)=>{
  const {offers,startTime,endTime}=payload||{};
  if(!Array.isArray(offers)||!offers.length)throw new Error("Нет офферов для копирования в тест");
  const accessToken=await getGoogleAccessToken();
  let updated=0;
  for(const offer of offers){
    if(!offer.Id)continue;
    const {gui,guiDouble,...offerFields}=offer;
    if(gui&&gui.Id)await upsertByExactId(accessToken,gameOffersTestSpreadsheetId,gameOfferGuiGid,gui.Id,gui);
    if(guiDouble&&guiDouble.Id)await upsertByExactId(accessToken,gameOffersTestSpreadsheetId,gameOfferGuiGid,guiDouble.Id,guiDouble);
    await upsertByExactId(accessToken,gameOffersTestSpreadsheetId,gameOfferGid,offer.Id,{...offerFields,StartTime:startTime,EndTime:endTime});
    updated++;
  }
  return {updated};
});

async function readMapsSheetColumnA(accessToken,gid){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${activeMapsSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===gid);
  if(!sheet)throw new Error("Лист не найден в таблице карт");
  const {rows}=await readSheetValues(accessToken,activeMapsSpreadsheetId,sheet.properties.title);
  const scenes=[];
  for(const row of rows){
    const value=String((row&&row[0])||"").trim();
    if(!value||value.toLowerCase()==="map")continue;
    const next=String((row&&row[1])||"").trim();
    scenes.push({scene:value,nextScene:(next&&next!==value)?next:null});
  }
  return scenes;
}

async function readMapsOverviewNames(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${activeMapsSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===activeMapsOverviewGid);
  if(!sheet)throw new Error("Лист Overview не найден");
  const {rows}=await readSheetValues(accessToken,activeMapsSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("Prefab")&&row.includes("ENG"));
  if(headerIdx<0)return {};
  const header=rows[headerIdx];
  const prefabCol=header.indexOf("Prefab");
  const engCol=header.indexOf("ENG");
  const map={};
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row)continue;
    const prefab=String(row[prefabCol]||"").trim();
    if(!prefab)continue;
    if(map[prefab]===undefined)map[prefab]=String(row[engCol]||"").trim();
  }
  return map;
}

ipcMain.handle("google:sync-active-maps",async()=>{
  const accessToken=await getGoogleAccessToken();
  const overviewNames=await readMapsOverviewNames(accessToken);
  const groups=[];
  for(const tab of activeMapsModeTabs){
    const scenes=await readMapsSheetColumnA(accessToken,tab.gid);
    groups.push({
      mode:tab.label,
      maps:scenes.map(({scene,nextScene})=>({
        scene,displayName:overviewNames[scene]||"",
        nextScene:nextScene||null,nextDisplayName:nextScene?(overviewNames[nextScene]||""):"",
      })),
    });
  }
  return {groups};
});

async function findTraderVanSheetInfo(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${traderVanSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===traderVanGid);
  if(!sheet)throw new Error("Лист Trader Van не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const {rows}=await readSheetValues(accessToken,traderVanSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("i_season")&&row.includes("s_style"));
  if(headerIdx<0)throw new Error("Не найдена шапка таблицы Trader Van");
  return {api,quotedTitle,rows,header:rows[headerIdx],headerIdx};
}

async function getNextTraderVanSeason(accessToken){
  const {rows,header,headerIdx}=await findTraderVanSheetInfo(accessToken);
  const seasonCol=header.indexOf("i_season");
  let max=0;
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row)continue;
    const value=Number(row[seasonCol]);
    if(Number.isFinite(value)&&value>max)max=value;
  }
  return max+1;
}

ipcMain.handle("google:get-next-trader-van-id",async()=>{
  const accessToken=await getGoogleAccessToken();
  return {nextId:await getNextTraderVanSeason(accessToken)};
});

ipcMain.handle("google:apply-trader-van",async(_event,payload)=>{
  const {sStyle,season,items}=payload||{};
  if(!Array.isArray(items)||!items.length)throw new Error("Добавьте хотя бы один предмет");
  const accessToken=await getGoogleAccessToken();
  const {api,quotedTitle,header}=await findTraderVanSheetInfo(accessToken);
  const nextId=await getNextTraderVanSeason(accessToken);
  const columns=Object.fromEntries(TRADER_VAN_FIELDS.map(name=>[name,header.indexOf(name)]));
  const width=header.length;
  const toNumberOrBlank=value=>{
    if(value===undefined||value===null||value==="")return "";
    const num=Number(value);
    return Number.isFinite(num)?num:value;
  };
  const rows=items.map((item,index)=>{
    const row=new Array(width).fill("");
    const set=(name,value)=>{if(columns[name]>=0)row[columns[name]]=value};
    if(index===0)set("i_season",nextId);
    set("s_style",sStyle||"basic");
    set("season",season||"basic");
    set("buylimit",toNumberOrBlank(item.buyLimit));
    set("id",index+1);
    set("start",item.startDate?`${item.startDate}T09:00:00`:"");
    set("end",item.endDate?`${item.endDate}T09:00:00`:"");
    set("price",item.price||"");
    set("sale",toNumberOrBlank(item.sale));
    set("order",index+1);
    set("content",item.content||"");
    set("show_timer",!!item.showTimer);
    set("price_amount",toNumberOrBlank(item.priceAmount));
    return row;
  });
  await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(quotedTitle)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:rows})});
  return {seasonId:nextId};
});

const BOARD_META_FIELDS=["EventId","Style","MechanicIds","InfoStageDuration","ActiveStageDuration","AddedStageDuration","TimeUntilEndActiveStageForPopUp","MainPrefabName","NotificationPrefabName","LobbyButtonPrefabName","InfoPrefabName","InfoPopupPreviewRewards"];
const BOARD_NOTIF_FIELDS=["StartInfoStage","StartActiveStage","BeforeEndActiveStage","StartAddedStage","EndEvent"];

async function writeBoardCommonSheet(accessToken,spreadsheetId,sheetTitle,fields){
  const {rows,quotedTitle,api}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const metaHeaderIdx=rows.findIndex(row=>row.includes("EventId")&&row.includes("InfoPopupPreviewRewards"));
  if(metaHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найдена мета-таблица (EventId/InfoPopupPreviewRewards)`);
  const metaHeader=rows[metaHeaderIdx];
  const metaDataRow=metaHeaderIdx+2;
  const data=[];
  for(const name of BOARD_META_FIELDS){
    if(fields[name]===undefined)continue;
    const col=metaHeader.indexOf(name);
    if(col<0)continue;
    data.push({range:`${quotedTitle}!${colLetter(col)}${metaDataRow}`,values:[[fields[name]]]});
  }
  const notifLabelIdx=rows.findIndex((row,i)=>i>metaHeaderIdx&&String(row[0]||"").trim()==="NotificationBanners");
  if(notifLabelIdx>=0){
    const notifHeader=rows[notifLabelIdx+1]||[];
    const notifDataRow=notifLabelIdx+3;
    for(const name of BOARD_NOTIF_FIELDS){
      if(fields[name]===undefined)continue;
      const col=notifHeader.indexOf(name);
      if(col<0)continue;
      data.push({range:`${quotedTitle}!${colLetter(col)}${notifDataRow}`,values:[[fields[name]?"TRUE":"FALSE"]]});
    }
  }
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

async function writeBoardProgressSheet(accessToken,spreadsheetId,sheetTitle,priceFields,rewardRows){
  const {rows,quotedTitle,api}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const sheetsMeta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheetId=(sheetsMeta.sheets||[]).find(s=>s.properties.title===sheetTitle)?.properties.sheetId;
  if(sheetId===undefined)throw new Error(`Лист «${sheetTitle}» не найден`);

  const priceHeaderIdx=rows.findIndex(row=>row.includes("OpenCellPrice")&&row.includes("SpinType"));
  if(priceHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найден блок OpenCellPrice/SpinType`);
  const priceHeader=rows[priceHeaderIdx];
  const priceDataRow=priceHeaderIdx+2;
  const data=[];
  for(const name of ["OpenCellPrice","GemsOpenCellPrice","PriceMultiplier1","SpinType"]){
    if(priceFields[name]===undefined)continue;
    const col=priceHeader.indexOf(name);
    if(col<0)continue;
    data.push({range:`${quotedTitle}!${colLetter(col)}${priceDataRow}`,values:[[priceFields[name]]]});
  }

  const rewardHeaderIdx=rows.findIndex((row,i)=>i>priceHeaderIdx&&row.includes("Id")&&row.includes("Reward")&&row.includes("AlternateReward")&&row.includes("DropChance"));
  if(rewardHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найдена таблица наград`);
  const rewardHeader=rows[rewardHeaderIdx];
  const columns=Object.fromEntries(["Id","Reward","AlternateReward","BuyLimit","DropChance","Cool","ShowInPreview"].map(name=>[name,rewardHeader.indexOf(name)]));

  let existingCount=0;
  for(let i=rewardHeaderIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(cell=>cell===""||cell===undefined))break;
    existingCount++;
  }
  const needed=rewardRows.length;
  const firstDataSheetRow=rewardHeaderIdx+2;
  if(existingCount>needed){
    const startIndex=rewardHeaderIdx+1+needed;
    const endIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]})});
  }else if(existingCount<needed){
    const missing=needed-existingCount;
    const startIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex:startIndex+missing},inheritFromBefore:existingCount>0}}]})});
  }

  rewardRows.forEach((item,index)=>{
    const row=firstDataSheetRow+index;
    data.push({range:`${quotedTitle}!${colLetter(columns.Id)}${row}`,values:[[item.id]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Reward)}${row}`,values:[[item.reward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.AlternateReward)}${row}`,values:[[item.alternateReward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.BuyLimit)}${row}`,values:[[item.buyLimit??""]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.DropChance)}${row}`,values:[[item.dropChance]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Cool)}${row}`,values:[[!!item.cool]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.ShowInPreview)}${row}`,values:[[!!item.showInPreview]]});
  });
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

ipcMain.handle("google:get-next-personal-event-id",async(_event,eventType)=>{
  const accessToken=await getGoogleAccessToken();
  const {nextId,lastMatchRow,header}=await getNextPersonalEventId(accessToken,eventType);
  const pick=name=>{const c=header.indexOf(name);return c>=0&&lastMatchRow?lastMatchRow[c]:undefined};
  return {nextId,lastGroupId:pick("GroupId")??"",lastNote:pick("Примечание GD")||""};
});

ipcMain.handle("google:apply-personal-event-board",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,openCellPrice,gemsOpenCellPrice,priceMultiplier1,spinType,rewards,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"Board");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventBoardSpreadsheetId,["Common_PersonalDrawerOfFortune","Progress_Wheel_PersonalDrawerOfFortune"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventBoardSpreadsheetId,names["Common_PersonalDrawerOfFortune"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeBoardProgressSheet(accessToken,personalEventBoardSpreadsheetId,names["Progress_Wheel_PersonalDrawerOfFortune"],
    {OpenCellPrice:openCellPrice,GemsOpenCellPrice:gemsOpenCellPrice,PriceMultiplier1:priceMultiplier1,SpinType:spinType},rewards);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"Board",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

async function writeLinearProgressSheet(accessToken,spreadsheetId,sheetTitle,expFields,rewardRows){
  const {rows,quotedTitle,api}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const sheetsMeta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheetId=(sheetsMeta.sheets||[]).find(s=>s.properties.title===sheetTitle)?.properties.sheetId;
  if(sheetId===undefined)throw new Error(`Лист «${sheetTitle}» не найден`);

  const expHeaderIdx=rows.findIndex(row=>row.includes("ItemExp"));
  if(expHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найден блок ItemExp`);
  const expHeader=rows[expHeaderIdx];
  const expDataRow=expHeaderIdx+2;
  const data=[];
  for(const name of ["ItemExp","Boost","CurrencyToXP"]){
    if(expFields[name]===undefined)continue;
    const col=expHeader.indexOf(name);
    if(col<0)continue;
    data.push({range:`${quotedTitle}!${colLetter(col)}${expDataRow}`,values:[[expFields[name]]]});
  }

  const rewardHeaderIdx=rows.findIndex((row,i)=>i>expHeaderIdx&&row.includes("Id")&&row.includes("Reward")&&row.includes("AlternateReward")&&row.includes("XPAmount"));
  if(rewardHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найдена таблица наград`);
  const rewardHeader=rows[rewardHeaderIdx];
  const columns=Object.fromEntries(["Id","Reward","AlternateReward","XPAmount","Cool","ShowInPreview"].map(name=>[name,rewardHeader.indexOf(name)]));

  let existingCount=0;
  for(let i=rewardHeaderIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(cell=>cell===""||cell===undefined))break;
    existingCount++;
  }
  const needed=rewardRows.length;
  const firstDataSheetRow=rewardHeaderIdx+2;
  if(existingCount>needed){
    const startIndex=rewardHeaderIdx+1+needed;
    const endIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]})});
  }else if(existingCount<needed){
    const missing=needed-existingCount;
    const startIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex:startIndex+missing},inheritFromBefore:existingCount>0}}]})});
  }

  rewardRows.forEach((item,index)=>{
    const row=firstDataSheetRow+index;
    data.push({range:`${quotedTitle}!${colLetter(columns.Id)}${row}`,values:[[item.id]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Reward)}${row}`,values:[[item.reward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.AlternateReward)}${row}`,values:[[item.alternateReward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.XPAmount)}${row}`,values:[[item.xpAmount]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Cool)}${row}`,values:[[!!item.cool]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.ShowInPreview)}${row}`,values:[[!!item.showInPreview]]});
  });
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

ipcMain.handle("google:apply-personal-event-linear",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,itemExp,boost,currencyToXP,rewards,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"Linear");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventLinearSpreadsheetId,["Common_PersonalLinear","Progress_Accumulative_PersonalLinear"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventLinearSpreadsheetId,names["Common_PersonalLinear"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeLinearProgressSheet(accessToken,personalEventLinearSpreadsheetId,names["Progress_Accumulative_PersonalLinear"],
    {ItemExp:itemExp,Boost:boost,CurrencyToXP:currencyToXP},rewards);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"Linear",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

async function writeTasksSimpleSheet(accessToken,spreadsheetId,sheetTitle,taskRows){
  const {rows,quotedTitle,api}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const sheetsMeta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheetId=(sheetsMeta.sheets||[]).find(s=>s.properties.title===sheetTitle)?.properties.sheetId;
  if(sheetId===undefined)throw new Error(`Лист «${sheetTitle}» не найден`);

  const headerIdx=rows.findIndex(row=>row.includes("Index")&&row.includes("TaskId")&&row.includes("NeededCount")&&row.includes("Rewards")&&row.includes("TaskPrice"));
  if(headerIdx<0)throw new Error(`На листе «${sheetTitle}» не найдена таблица задач (Index/TaskId/NeededCount/Rewards/TaskPrice)`);
  const header=rows[headerIdx];
  const columns=Object.fromEntries(["Index","TaskId","NeededCount","Rewards","TaskPrice"].map(name=>[name,header.indexOf(name)]));

  let existingCount=0;
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(cell=>cell===""||cell===undefined))break;
    existingCount++;
  }
  const needed=taskRows.length;
  const firstDataSheetRow=headerIdx+2;
  if(existingCount>needed){
    const startIndex=headerIdx+1+needed;
    const endIndex=headerIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]})});
  }else if(existingCount<needed){
    const missing=needed-existingCount;
    const startIndex=headerIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex:startIndex+missing},inheritFromBefore:existingCount>0}}]})});
  }

  const data=[];
  taskRows.forEach((task,index)=>{
    const row=firstDataSheetRow+index;
    data.push({range:`${quotedTitle}!${colLetter(columns.Index)}${row}`,values:[[task.index??(index+1)]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.TaskId)}${row}`,values:[[task.taskId]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.NeededCount)}${row}`,values:[[task.neededCount]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Rewards)}${row}`,values:[[task.rewards]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.TaskPrice)}${row}`,values:[[task.taskPrice]]});
  });
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

ipcMain.handle("google:get-task-reference",async()=>{
  const accessToken=await getGoogleAccessToken();
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${taskReferenceSpreadsheetId}`;
  const meta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(meta.sheets||[]).find(entry=>entry.properties.sheetId===taskReferenceGid);
  if(!sheet)throw new Error("Лист со справочником задач не найден");
  const {rows}=await readSheetValues(accessToken,taskReferenceSpreadsheetId,sheet.properties.title);
  const headerIdx=rows.findIndex(row=>row.includes("TaskId")&&row.includes("GDDescpiption"));
  if(headerIdx<0)return [];
  const header=rows[headerIdx];
  const idCol=header.indexOf("TaskId"),descCol=header.indexOf("GDDescpiption");
  const list=[];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row)continue;
    const id=row[idCol];
    if(id===undefined||id==="")continue;
    list.push({taskId:id,description:String(row[descCol]||"")});
  }
  return list;
});

ipcMain.handle("google:apply-personal-event-tasks-horizontal",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,itemExp,boost,currencyToXP,rewards,tasks,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  if(!Array.isArray(tasks)||!tasks.length)throw new Error("Добавьте хотя бы одну задачу");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"TasksHorizontal");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventTasksHorizontalSpreadsheetId,["Common_PersonalTaskBookHorizontal","Progress_Accumulative_PersonalTaskBookHorizontal","Tasks_Simple_PersonalTaskBookHorizontal"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventTasksHorizontalSpreadsheetId,names["Common_PersonalTaskBookHorizontal"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeLinearProgressSheet(accessToken,personalEventTasksHorizontalSpreadsheetId,names["Progress_Accumulative_PersonalTaskBookHorizontal"],
    {ItemExp:itemExp,Boost:boost,CurrencyToXP:currencyToXP},rewards);
  await writeTasksSimpleSheet(accessToken,personalEventTasksHorizontalSpreadsheetId,names["Tasks_Simple_PersonalTaskBookHorizontal"],tasks);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"TasksHorizontal",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

ipcMain.handle("google:apply-personal-event-tasks-vertical",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,itemExp,rewards,tasks,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  if(!Array.isArray(tasks)||!tasks.length)throw new Error("Добавьте хотя бы одну задачу");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"TasksVertical");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventTasksVerticalSpreadsheetId,["Common_PersonalTaskBookVertical","Progress_Accumulative_PersonalTaskBookVertical","Tasks_Simple_PersonalTaskBookVertical"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventTasksVerticalSpreadsheetId,names["Common_PersonalTaskBookVertical"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeLinearProgressSheet(accessToken,personalEventTasksVerticalSpreadsheetId,names["Progress_Accumulative_PersonalTaskBookVertical"],
    {ItemExp:itemExp},rewards);
  const indexedTasks=tasks.map((task,index)=>({...task,index:Number(`${nextId}${String(index+1).padStart(2,"0")}`)}));
  await writeTasksSimpleSheet(accessToken,personalEventTasksVerticalSpreadsheetId,names["Tasks_Simple_PersonalTaskBookVertical"],indexedTasks);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"TasksVertical",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

async function writeTopUpProgressSheet(accessToken,spreadsheetId,sheetTitle,metaFields,rewardRows){
  const {rows,quotedTitle,api}=await readSheetValues(accessToken,spreadsheetId,sheetTitle);
  const sheetsMeta=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheetId=(sheetsMeta.sheets||[]).find(s=>s.properties.title===sheetTitle)?.properties.sheetId;
  if(sheetId===undefined)throw new Error(`Лист «${sheetTitle}» не найден`);

  const metaHeaderIdx=rows.findIndex(row=>row.includes("AdsPointName")&&row.includes("HowItWorkPlace"));
  if(metaHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найден блок AdsPointName/.../HowItWorkPlace`);
  const metaHeader=rows[metaHeaderIdx];
  const metaDataRow=metaHeaderIdx+2;
  const data=[];
  for(const name of ["AdsPointName","CashBackFromUSD","CashBackFromGems","CashBackFromCoins","CashBackFromPixelPassCurrency","HowItWorkPlace"]){
    if(metaFields[name]===undefined)continue;
    const col=metaHeader.indexOf(name);
    if(col<0)continue;
    data.push({range:`${quotedTitle}!${colLetter(col)}${metaDataRow}`,values:[[metaFields[name]]]});
  }

  const rewardHeaderIdx=rows.findIndex((row,i)=>i>metaHeaderIdx&&row.includes("Id")&&row.includes("Reward")&&row.includes("AlternateReward")&&row.includes("Price"));
  if(rewardHeaderIdx<0)throw new Error(`На листе «${sheetTitle}» не найдена таблица наград`);
  const rewardHeader=rows[rewardHeaderIdx];
  const columns=Object.fromEntries(["Id","Reward","AlternateReward","Price","Cool","ShowInPreview"].map(name=>[name,rewardHeader.indexOf(name)]));

  let existingCount=0;
  for(let i=rewardHeaderIdx+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(cell=>cell===""||cell===undefined))break;
    existingCount++;
  }
  const needed=rewardRows.length;
  const firstDataSheetRow=rewardHeaderIdx+2;
  if(existingCount>needed){
    const startIndex=rewardHeaderIdx+1+needed;
    const endIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex}}}]})});
  }else if(existingCount<needed){
    const missing=needed-existingCount;
    const startIndex=rewardHeaderIdx+1+existingCount;
    await sheetsRequest(accessToken,`${api}:batchUpdate`,{method:"POST",body:JSON.stringify({requests:[{insertDimension:{range:{sheetId,dimension:"ROWS",startIndex,endIndex:startIndex+missing},inheritFromBefore:existingCount>0}}]})});
  }

  rewardRows.forEach((item,index)=>{
    const row=firstDataSheetRow+index;
    data.push({range:`${quotedTitle}!${colLetter(columns.Id)}${row}`,values:[[item.id]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Reward)}${row}`,values:[[item.reward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.AlternateReward)}${row}`,values:[[item.alternateReward]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Price)}${row}`,values:[[item.price]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.Cool)}${row}`,values:[[!!item.cool]]});
    data.push({range:`${quotedTitle}!${colLetter(columns.ShowInPreview)}${row}`,values:[[!!item.showInPreview]]});
  });
  if(data.length)await sheetsRequest(accessToken,`${api}/values:batchUpdate`,{method:"POST",body:JSON.stringify({valueInputOption:"RAW",data})});
}

ipcMain.handle("google:apply-personal-event-topup",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,adsPointName,cashBackFromUSD,cashBackFromGems,cashBackFromCoins,cashBackFromPixelPassCurrency,howItWorkPlace,rewards,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"TopUp");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventTopUpSpreadsheetId,["Common_PersonalTopUp","Progress_Sequential_PersonalTopUp"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventTopUpSpreadsheetId,names["Common_PersonalTopUp"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeTopUpProgressSheet(accessToken,personalEventTopUpSpreadsheetId,names["Progress_Sequential_PersonalTopUp"],
    {AdsPointName:adsPointName,CashBackFromUSD:cashBackFromUSD,CashBackFromGems:cashBackFromGems,CashBackFromCoins:cashBackFromCoins,CashBackFromPixelPassCurrency:cashBackFromPixelPassCurrency,HowItWorkPlace:howItWorkPlace},rewards);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"TopUp",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

ipcMain.handle("google:apply-personal-event-wheel",async(_event,partition)=>{
  const {style,mechanicIds,infoStageDuration,activeStageDuration,addedStageDuration,timeUntilEndActiveStageForPopUp,mainPrefabName,notificationPrefabName,lobbyButtonPrefabName,infoPrefabName,infoPopupPreviewRewards,notificationBanners,openCellPrice,gemsOpenCellPrice,priceMultiplier1,spinType,rewards,startDate,endDate,endCompletionDate,expression,groupId,note,segment,target}=partition||{};
  if(!Array.isArray(rewards)||!rewards.length)throw new Error("Добавьте хотя бы одну строку наград");
  const accessToken=await getGoogleAccessToken();
  const {nextId}=await getNextPersonalEventId(accessToken,"Wheel");
  const names=await duplicatePersonalEventSheets(accessToken,personalEventWheelSpreadsheetId,["Common_PersonalWheelOfFortune","Progress_Wheel_PersonalWheelOfFortune"],nextId);
  await writeBoardCommonSheet(accessToken,personalEventWheelSpreadsheetId,names["Common_PersonalWheelOfFortune"],{
    EventId:nextId,Style:style,MechanicIds:mechanicIds,InfoStageDuration:infoStageDuration,ActiveStageDuration:activeStageDuration,
    AddedStageDuration:addedStageDuration,TimeUntilEndActiveStageForPopUp:timeUntilEndActiveStageForPopUp,MainPrefabName:mainPrefabName,
    NotificationPrefabName:notificationPrefabName,LobbyButtonPrefabName:lobbyButtonPrefabName,InfoPrefabName:infoPrefabName,
    InfoPopupPreviewRewards:infoPopupPreviewRewards,...notificationBanners,
  });
  await writeBoardProgressSheet(accessToken,personalEventWheelSpreadsheetId,names["Progress_Wheel_PersonalWheelOfFortune"],
    {OpenCellPrice:openCellPrice,GemsOpenCellPrice:gemsOpenCellPrice,PriceMultiplier1:priceMultiplier1,SpinType:spinType},rewards);
  const isTest=target==="test";
  await appendPersonalEventScheduleRow(accessToken,"Wheel",nextId,{startDate,endDate,expression,groupId,note,endCompletionDate});
  await appendPersonalizedEventRow(accessToken,isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId,isTest?eventCenterTestPersonalizedEventGid:eventCenterPersonalizedEventGid,{
    eventId:nextId,startDate,endDate,segment,groupId,style,
  });
  return {eventId:nextId,names};
});

ipcMain.handle("google:get-next-card-roulette-id",async(_event,isTest)=>{
  const accessToken=await getGoogleAccessToken();
  const spId=isTest?cardRouletteTestSpreadsheetId:cardRouletteSpreadsheetId;
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${spId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===cardRouletteScheduleGid);
  if(!sheet)throw new Error("Лист Schedule не найден");
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const colResp=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!B2:B100000`)}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`);
  const col=(colResp.values&&colResp.values[0])||[];
  let last=null;
  for(const v of col){const n=Number(v);if(Number.isFinite(n))last=n}
  return (last!==null?last:0)+1;
});

ipcMain.handle("google:apply-card-roulette-partition",async(_event,partition)=>{
  const {name,id,style,segment,startDateTime,endDateTime,discount,openPrices,levelOpen,chests,target}=partition||{};
  const cleanName=String(name||"").replace(/\s+/g,"");
  if(!cleanName)throw new Error("Укажите Name");
  if(!id)throw new Error("Укажите Id");
  const isTest=target==="test";
  const spId=isTest?cardRouletteTestSpreadsheetId:cardRouletteSpreadsheetId;
  const eventCenterSpId=isTest?eventCenterTestSpreadsheetId:eventCenterSpreadsheetId;
  const eventCenterGid=isTest?eventCenterTestCardRouletteGid:eventCenterCardRouletteGid;

  const accessToken=await getGoogleAccessToken();
  const names=await duplicateCardRouletteTemplateSheets(accessToken,spId,cleanName);
  await appendCardRouletteScheduleRow(accessToken,spId,cardRouletteScheduleGid,{uniqueId:id,sheetName:names.chests});
  await appendLotteryRow(accessToken,eventCenterSpId,eventCenterGid,{id,startDateTime:startDateTime||"",endDateTime:endDateTime||"",segment:segment||"",style:style||""});
  if(Array.isArray(chests)&&chests.length){
    const chestIds=chests.map(c=>Number(c.chestNumber));
    await buildCardRouletteSettingsInSheet(accessToken,spId,names.settings,{
      UniqueId:id,Style:style||"",FirstOpenDiscount:discount??"",OpenPrices:openPrices||"",
      ChestIds:chestIds.join(","),AttributeIds:chestIds.map(chestAttributeId).join(","),LevelOpen:levelOpen??"",
    });
    await buildCardRouletteChestsInSheet(accessToken,spId,names.chests,chests);
  }
  return {names,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${spId}/edit`};
});

async function fetchWeaponAnalytics(accessToken){
  const api=`https://sheets.googleapis.com/v4/spreadsheets/${tierSpreadsheetId}`;
  const spreadsheet=await sheetsRequest(accessToken,`${api}?fields=sheets.properties(sheetId,title)`);
  const sheet=(spreadsheet.sheets||[]).find(entry=>entry.properties.sheetId===tierSheetGid);
  const lookup=new Map();
  if(!sheet)return lookup;
  const quotedTitle=`'${sheet.properties.title.replace(/'/g,"''")}'`;
  const valuesResponse=await sheetsRequest(accessToken,`${api}/values/${encodeURIComponent(`${quotedTitle}!E:Z`)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const clean=value=>{const text=value===undefined||value===null?"":String(value).trim();return (!text||text.startsWith("#"))?"":text};
  for(const row of valuesResponse.values||[]){
    const key=String(row[0]??"").trim().toLowerCase();
    if(!key||lookup.has(key))continue;
    lookup.set(key,{type:clean(row[1]),rarity:clean(row[2]),tier:clean(row[7]),lethality:clean(row[15]),prevalence:clean(row[19])});
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
  allItems=allItems.map(item=>(item.saleLocation==="Lottery"&&!item.lastSale)?{...item,saleLocation:""}:item);

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

  await queuedStoreWrite("items",allItems);
  console.log(`[sync] done: ${createdItems.length} new items, ${allItems.length} total`);
}

ipcMain.handle("google:fetch-tier",async(_event,tag)=>{
  const needle=String(tag||"").trim().toLowerCase();
  if(!needle)return null;
  const accessToken=await getGoogleAccessToken();
  const analytics=await fetchWeaponAnalytics(accessToken);
  return analytics.get(needle)||null;
});

ipcMain.handle("catalog:refresh-analytics",async()=>{
  await runWeaponAutoSync();
  return {refreshed:true};
});

function iconLibraryDir(){return liveIconsItemsDir}

async function buildIconSuffixLookup(){
  try{
    const files=await fs.promises.readdir(iconLibraryDir());
    const suffixRe=/_icon1?_big\.(png|webp|jpg|jpeg|gif)$/i;
    const map=new Map();
    for(const fn of files){
      const m=suffixRe.exec(fn);
      if(m){const key=fn.slice(0,m.index).toLowerCase();if(!map.has(key))map.set(key,fn)}
    }
    return map;
  }catch(error){return new Map()}
}

async function runCatalogXlsxSync(){
  try{await fs.promises.access(catalogXlsxPath)}catch{
    console.log("[catalog-sync] xlsx not found at",catalogXlsxPath,"skipping");
    return {added:0,iconsFilled:0,removed:0,total:0,skipped:true};
  }

  let workbook;
  try{workbook=XLSX.readFile(catalogXlsxPath)}catch(error){
    console.error("[catalog-sync] failed to read xlsx",error.message);
    return {added:0,iconsFilled:0,removed:0,total:0,error:error.message};
  }

  const iconLookup=await buildIconSuffixLookup();
  let existing=[];
  try{existing=JSON.parse(await fs.promises.readFile(storePath("items"),"utf8"))||[]}catch(error){if(error.code!=="ENOENT")throw error}

  const byTag=new Map(existing.filter(i=>i.tag).map(i=>[String(i.tag).toLowerCase(),i]));
  const sheetNames=workbook.SheetNames.filter(name=>name!=="ModulePoint");
  const seenTags=new Set();
  const currentTags=new Set();
  let added=0,iconsFilled=0,marked=0,uidSeed=Date.now();
  let result=[...existing];

  for(const sheetName of sheetNames){
    const ws=workbook.Sheets[sheetName];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});
    for(let i=1;i<rows.length;i++){
      const row=rows[i];
      if(!row||row.length<3)continue;
      let [name,tag,id]=row;
      name=String(name??"").trim();tag=String(tag??"").trim();id=String(id??"").trim();
      if(!tag||seenTags.has(tag))continue;
      seenTags.add(tag);
      const key=tag.toLowerCase();
      currentTags.add(key);
      const keyName=name.replace(/\s+/g,"").toLowerCase();
      let icon="";
      if(iconLookup.has(key))icon=`/icons-items/${iconLookup.get(key)}`;
      else if(iconLookup.has(keyName))icon=`/icons-items/${iconLookup.get(keyName)}`;

      const existingItem=byTag.get(key);
      if(!existingItem){
        const item={uid:`item-${uidSeed++}`,id,parts:"",tag,name,type:sheetName,rarity:"",setting:"",lastSale:"",saleLocation:"",tier:"",sheetType:"",sheetRarity:"",sheetName:"",sheetLethality:"",sheetPrevalence:"",icon,eventIcon:"",xlsxSync:true};
        result.push(item);byTag.set(key,item);added++;
      }else{
        if(!existingItem.icon&&icon){existingItem.icon=icon;iconsFilled++}
        if(!existingItem.xlsxSync){existingItem.xlsxSync=true;marked++}
      }
    }
  }

  // Deletion no longer depends on the item's "type" field (which could drift from what the
  // sync itself would have set, e.g. via manual edits or older import passes) — an item is
  // only ever considered sync-managed once it has actually matched a table tag at least once
  // (the xlsxSync marker set above). From then on, if that same tag disappears from the table,
  // the item is dropped, regardless of what its type currently says.
  const before=result.length;
  result=result.filter(item=>!(item.xlsxSync&&item.tag&&!currentTags.has(String(item.tag).toLowerCase())));
  const removed=before-result.length;

  const debug={xlsxRows:seenTags.size,currentTagsSize:currentTags.size,markedExisting:marked};
  console.log("[catalog-sync] debug",debug);

  if(!added&&!iconsFilled&&!removed&&!marked){console.log("[catalog-sync] no changes");return {added:0,iconsFilled:0,removed:0,total:result.length,debug}}

  await queuedStoreWrite("items",result);
  console.log(`[catalog-sync] done: ${added} new items, ${iconsFilled} icons filled, ${removed} removed, ${result.length} total`);
  return {added,iconsFilled,removed,total:result.length,debug};
}

function parseItemsDataStorageWeaponKeys(text){
  const map=new Map();
  const chunks=text.split(/\n  - /);
  for(const chunk of chunks){
    const tagMatch=chunk.match(/_tag:\s*(\S+)/);
    const keyMatch=chunk.match(/localizeWeaponKey:\s*(\S+)/);
    if(tagMatch&&keyMatch)map.set(tagMatch[1].toLowerCase(),keyMatch[1]);
  }
  return map;
}

function parseLocalizationTerms(text,neededKeys){
  const result=new Map();
  const lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^\s*-\s*term:\s*(\S+)\s*$/);
    if(!m)continue;
    const key=m[1];
    if(neededKeys&&!neededKeys.has(key))continue;
    const next=lines[i+1]||"";
    const tm=next.match(/^\s*translation:\s*(.*)$/);
    if(!tm)continue;
    let value=tm[1];
    if(value.startsWith("'")){
      value=value.slice(1);
      const endIdx=value.indexOf("'");
      value=endIdx>=0?value.slice(0,endIdx):value;
      value=value.replace(/''/g,"'");
    }
    value=value.trim();
    if(value)result.set(key,value);
  }
  return result;
}

async function readWeaponRealNames(){
  let storageText,langText;
  try{storageText=await fs.promises.readFile(itemsDataStoragePath,"utf8")}
  catch(error){console.log("[names-sync] ItemsDataStorage.asset not reachable, skipping",error.message);return null}
  try{langText=await fs.promises.readFile(languageEnglishPath,"utf8")}
  catch(error){console.log("[names-sync] Language_English.prefab not reachable, skipping",error.message);return null}
  const tagToKey=parseItemsDataStorageWeaponKeys(storageText);
  const neededKeys=new Set(tagToKey.values());
  const keyToText=parseLocalizationTerms(langText,neededKeys);
  const tagToName=new Map();
  for(const [tag,key] of tagToKey){
    const text=keyToText.get(key);
    if(text)tagToName.set(tag,text);
  }
  return tagToName;
}

ipcMain.handle("catalog:sync-real-names",async()=>{
  const tagToName=await readWeaponRealNames();
  if(!tagToName)throw new Error("Не удалось прочитать файлы юнити-проекта (диск Z: подключён?)");
  let existing=[];
  try{existing=JSON.parse(await fs.promises.readFile(storePath("items"),"utf8"))||[]}catch(error){if(error.code!=="ENOENT")throw error}
  let updated=0;
  const result=existing.map(item=>{
    if(!item.tag)return item;
    const name=tagToName.get(String(item.tag).toLowerCase());
    if(name&&item.realName!==name){updated++;return {...item,realName:name}}
    return item;
  });
  if(updated)await queuedStoreWrite("items",result);
  return {matched:tagToName.size,updated,total:existing.length};
});

ipcMain.handle("catalog:sync-from-xlsx",async()=>runCatalogXlsxSync());

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
async function queuedStoreWrite(key,value){
  const previous=storeWrites.get(key)||Promise.resolve();
  const pending=previous.catch(()=>{}).then(async()=>{
    const target=storePath(key);const temporary=`${target}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    await fs.promises.mkdir(path.dirname(target),{recursive:true});
    await fs.promises.writeFile(temporary,JSON.stringify(value),"utf8");
    let lastError;
    for(let attempt=0;attempt<5;attempt++){
      try{
        await fs.promises.rename(temporary,target);
        return true;
      }catch(error){
        lastError=error;
        if(error.code!=="EPERM"&&error.code!=="EBUSY")throw error;
        await new Promise(resolve=>setTimeout(resolve,80*(attempt+1)));
      }
    }
    throw lastError;
  });
  storeWrites.set(key,pending);
  return pending;
}
ipcMain.handle("store:write",async(_event,key,value)=>queuedStoreWrite(key,value));

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

async function proxyJira(req,res){
  const creds=await readJiraCredentials();
  if(!creds){
    res.writeHead(401,{"content-type":"application/json","access-control-allow-origin":"*"});
    res.end(JSON.stringify({error:"jira_not_configured"}));
    return;
  }
  const auth=Buffer.from(`${creds.email}:${creds.token}`).toString("base64");
  const targetPath=req.url.replace(/^\/jira-api/,"");
  const upstream=https.request({hostname:jiraHost,path:targetPath,method:req.method,headers:{...req.headers,host:jiraHost,origin:`https://${jiraHost}`,referer:`https://${jiraHost}/`,authorization:`Basic ${auth}`}},up=>{
    res.writeHead(up.statusCode||500,{...up.headers,"access-control-allow-origin":"*"});up.pipe(res);
  });
  upstream.on("error",error=>{res.writeHead(502,{"content-type":"application/json"});res.end(JSON.stringify({error:error.message}));});
  req.pipe(upstream);
}

ipcMain.handle("jira:get-status",async()=>{
  const creds=await readJiraCredentials();
  return creds?{configured:true,email:creds.email}:{configured:false};
});

ipcMain.handle("jira:set-credentials",async(_event,email,token)=>{
  const cleanEmail=String(email||"").trim();
  const cleanToken=String(token||"").trim();
  if(!cleanEmail||!cleanToken)throw new Error("Укажите email и API-токен");
  const me=await verifyJiraCredentials(cleanEmail,cleanToken);
  await writeJiraCredentials({email:cleanEmail,token:cleanToken});
  return {configured:true,email:cleanEmail,displayName:me.displayName||cleanEmail};
});

ipcMain.handle("jira:clear-credentials",async()=>{
  try{await fs.promises.unlink(jiraCredentialsPath())}catch(error){if(error.code!=="ENOENT")throw error}
  return {configured:false};
});

const liveIconsItemsDir="C:\\Users\\Валерия\\Desktop\\pg3d-dashboard\\public\\icons-items";

function startServer(){
  const root=path.join(__dirname,"..","dist");
  return new Promise(resolve=>{
    localServer=http.createServer((req,res)=>{
      if(req.url.startsWith("/jira-api"))return proxyJira(req,res);
      const rawPath=decodeURIComponent(req.url.split("?")[0]);
      if(rawPath.startsWith("/icons-items/")){
        const name=rawPath.slice("/icons-items/".length);
        const livePath=path.join(liveIconsItemsDir,name);
        if(livePath.startsWith(liveIconsItemsDir)){
          fs.readFile(livePath,(liveError,liveData)=>{
            if(!liveError){res.writeHead(200,{"content-type":mime[path.extname(livePath)]||"application/octet-stream"});return res.end(liveData)}
            const fallbackPath=path.join(root,rawPath);
            fs.readFile(fallbackPath,(fbError,fbData)=>{
              if(fbError){res.writeHead(404);return res.end("Not found")}
              res.writeHead(200,{"content-type":mime[path.extname(fallbackPath)]||"application/octet-stream"});res.end(fbData);
            });
          });
          return;
        }
      }
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
  runWeaponAutoSync().then(()=>mainWindow?.webContents.send("items:updated")).catch(error=>console.error("[sync] failed",error));
  runCatalogXlsxSync().then(result=>{if(result&&(result.added||result.iconsFilled||result.removed))mainWindow?.webContents.send("items:updated")}).catch(error=>console.error("[catalog-sync] failed",error));
});
ipcMain.on("window:minimize",event=>BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.on("window:toggle-maximize",event=>{const win=BrowserWindow.fromWebContents(event.sender);if(!win)return;win.isMaximized()?win.unmaximize():win.maximize()});
ipcMain.on("window:close",event=>BrowserWindow.fromWebContents(event.sender)?.close());
ipcMain.handle("window:is-maximized",event=>BrowserWindow.fromWebContents(event.sender)?.isMaximized()||false);
app.on("window-all-closed",()=>{if(localServer)localServer.close();if(process.platform!=="darwin")app.quit()});
app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
