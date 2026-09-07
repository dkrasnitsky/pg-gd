import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import LootboxSimulator from "./LootboxSimulator";
import TimeTracker from "./TimeTracker";
import LotterySimulator from "./LotterySimulator";
import CardRouletteSimulator from "./CardRouletteSimulator";
import PersonalEventSimulator from "./PersonalEventSimulator";
import GameOffersConstructor from "./GameOffersConstructor";
import NotesPage from "./NotesPage";
import EventCalendar from "./EventCalendar";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from "react-icons/vsc";
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiPackage, FiPlus, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const STRIPE=`repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(195,216,197,0.04) 4px,rgba(195,216,197,0.04) 5px),#303330`;
const ZZZ="'ZZZBold','Integral CF',Impact,sans-serif";

const JIRA_JQL="assignee = currentUser()";
const JIRA_BASE="https://cubicgamesstudio.atlassian.net";
const SHEETS_URL="https://docs.google.com/spreadsheets/d/1fGQnW1s9ueyhNxU7G2edY5hljQNUpKPZtRn_Qn-KsYM/edit?gid=1388976908#gid=1388976908";
const SC={"To Do":"#3B82F6","In Progress":"#F59E0B","Done":"#22C55E","к выполнению":"#3B82F6","К выполнению":"#3B82F6","В работе":"#F59E0B","Готово":"#22C55E","Reopened":"#3B82F6","QA Verified":"#4faf72","Merged":"#4faf72","Need More Info":"#F59E0B","On Hold":"#6B7280","Ready to Testing":"#8B5CF6","В процессе проверки":"#8B5CF6","In Testing":"#8B5CF6","Открыто повторно":"#3B82F6","Закрыто":"#22C55E","Ready to Merge":"#4faf72"};
const SEN={"к выполнению":"TO DO","К выполнению":"TO DO","В работе":"IN PROGRESS","Готово":"DONE","Открыто повторно":"REOPENED","В процессе проверки":"READY TO TESTING","Закрыто":"CLOSED"};
const TODO_S=["к выполнению","К выполнению","reopened","открыто повторно"];
const DONE_S=["готово","qa verified","merged","закрыто","ready to merge"];
const ACTIVE_S=["в работе","in testing","в процессе проверки"];
const S_ORDER={"В работе":0,"к выполнению":1,"Reopened":1,"Открыто повторно":1,"QA Verified":2,"Merged":2,"Ready to Merge":2,"В процессе проверки":2,"In Testing":2,"Готово":3,"Закрыто":3};

function sDisp(s){return (SEN[s]||s||"").toUpperCase()}
function sClr(s){return SC[s]||"#6B7280"}

function ParseDesc({text}){
  if(!text) return <span style={{color:T2,fontStyle:"italic"}}>No description — click to add</span>;
  const re=/\[([^|\]]+)\|([^\]]+)\]|\[([^\]]+)\]/g;
  const parts=[];let last=0;let m;
  while((m=re.exec(text))!==null){
    if(m.index>last) parts.push(<span key={"t"+m.index}>{text.slice(last,m.index)}</span>);
    const label=m[1]||m[3],url=m[2]||m[3];
    parts.push(<a key={"a"+m.index} href={url} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none",fontWeight:500}}>{label}</a>);
    last=re.lastIndex;
  }
  if(last<text.length) parts.push(<span key="end">{text.slice(last)}</span>);
  return parts.length>0 ? <>{parts}</> : <span>{text}</span>;
}

const CONFIGS=[
  {name:"Trader Van",icon:"/icons/trader-van.png",url:"https://docs.google.com/spreadsheets/d/1qKogyjkoHpO6imV1aU5ZyWKpFuF9Hr_qPYyc8RpamfE/edit?pli=1&gid=1806543965#gid=1806543965"},
  {name:"LootBoxes",icon:"/icons/lootboxes.png",url:"https://docs.google.com/spreadsheets/d/1yo8yR4JrIalvrxEqHCoj32UJ4Q4LZwosXhyApRZUVFg/edit?gid=477693117#gid=477693117"},
  {name:"Offers",icon:"/icons/offers.png",url:"https://docs.google.com/spreadsheets/d/1vlDGjRJqApHyicMYLd9PtFhL9C5FCl0jhD0N4D2zyWs/edit?gid=1298282127#gid=1298282127"},
  {name:"Localization",icon:"/icons/localization.png",url:"https://docs.google.com/spreadsheets/d/1x8FIcdnR-FpSTsdIV2GlWfAQUyzv2e_I6z4Q_BMOGmU/edit?gid=1409705545#gid=1409705545"},
  {name:"Lottery",icon:"/icons/lottery.png",url:"https://docs.google.com/spreadsheets/d/1d2mBr0-yDswgyFzTeaFHdbNEizukTEtCtaYkG3PzouI/edit?gid=1435187476#gid=1435187476"},
  {name:"Balance",icon:"/icons/balance.png",url:"https://docs.google.com/spreadsheets/d/1bnMxSgihWoq3nKmsU59uki8v2i2dkKjdY2mOOKRUKJ0/edit?gid=1642372391#gid=1642372391"},
  {name:"Event Center",icon:"/icons/event-center.png",url:"https://docs.google.com/spreadsheets/d/1lyMS61re8SfGLwaHP-B1ccFwAKlMJHXOiBYxWWyGEnk/edit?gid=272367832#gid=272367832"},
  {name:"Card Roulette",icon:"/icons/card-roulette.png",url:"https://docs.google.com/spreadsheets/d/1onDfSBGSAnHqLTglpj0upGhBZCJrjkL50V03sVnlFrk/edit?gid=1041170058#gid=1041170058"},
  {name:"Main Store",icon:"/icons/main-store.png",url:"https://docs.google.com/spreadsheets/d/1u3yjemhvz5KL7SnxV-mHhRvpa9gO_zdi2rHtRflFQhs/edit?gid=546486489#gid=546486489"},
  {name:"Attributes",icon:"/icons/attributes.png",url:"https://docs.google.com/spreadsheets/d/1ny_0djfR2Lfr4mTpBqMpJBWMkPS3MntEJxVjIlo7y88/edit?gid=1298282127#gid=1298282127"},
  {name:"Pers. Events",icon:"/icons/pers-events.png",url:"https://docs.google.com/spreadsheets/d/12WklJDMluXtBqlRzJblNLVvxXqh86R4hKbdLw7Mm-KE/edit?gid=0#gid=0"},
  {name:"Temp. Events",icon:"/icons/temp-events.png",url:"https://docs.google.com/spreadsheets/d/1bloozm-L0zlGycSDpH_FcVtesp7aWMwjsrk8ycTOMyM/edit?gid=1538831076#gid=1538831076"},
  {name:"AB Test",icon:"/icons/ab-test.png",url:"https://docs.google.com/spreadsheets/d/1KK-NJlVjculhuG2wPiFRa3U0mtKa7ojEUff0CoU0DZI/edit?gid=524589511#gid=524589511"},
  {name:"Exp Open",icon:"/icons/exp-open.png",url:"https://docs.google.com/spreadsheets/d/10Q0AtqZ2P3XLqAvk7uJ-rJr59j2obGGtBFR7kGn0dEU/edit?gid=735417490#gid=735417490"},
  {name:"Map List",icon:"/icons/map-list.png",url:"https://docs.google.com/spreadsheets/d/1e_y2x7YRupUSDXxhpsiOLzKTcDE8yq4oahgRiNgNfHU/edit?gid=731056815#gid=731056815"},
  {name:"Clan War",icon:"/icons/clan-war.png",url:"https://docs.google.com/spreadsheets/d/1gMT-SZ7_21JVLyA9_PUr-udTUWuANqmIuAEQZ_muoYo/edit?gid=1303472773#gid=1303472773"},
  {name:"ADS Roulette",icon:"/icons/ads-roulette.png",url:"https://docs.google.com/spreadsheets/d/1JFLI7wCdjWRIgI4DDOgztpwQ3aF_bx7-crf84ENphCk/edit?gid=1797882636#gid=1797882636"},
  {name:"Clan Chests",icon:"/icons/clan-chests.png",url:"https://docs.google.com/spreadsheets/d/140Reh4WxbJKOPJqKdJnI4lZvhUFGiw3AW-wdlBcvShE/edit#gid=1401792340"},
  {name:"GameModeHub",icon:"/icons/game-mode-hub.png",url:"https://docs.google.com/spreadsheets/d/1oEP6E5MZC_4pK4bUTxcbOuR_Vo9ZMF5-_N9nh2JGzkk/edit#gid=191785334"},
  {name:"Tournament",icon:"/icons/tournament.png",url:"https://docs.google.com/spreadsheets/d/1ebOFV3-GmYoVcDPVHg0wwKr834GTijfG8-0VzzcvOa8/edit#gid=1952180301"},
  {name:"Bots",icon:"/icons/bots.png",url:"https://docs.google.com/spreadsheets/d/1fpVcK1-r_Zl4x-_gJui4sQnN4JVJL3vox1qRJnSLZbM/edit?gid=175703923#gid=175703923"},
  {name:"Rotation",icon:"/icons/rotation.png",url:"https://docs.google.com/spreadsheets/d/1P_j0Yhc9sk_2dk8BQK6oH-z6cZ5uUw0FGw65sAosCxw/edit?gid=2024213723#gid=2024213723"},
];

const FILES=[
  {name:"График ивентов — Google Sheets",icon:"/icons/content-plan.png",url:SHEETS_URL},
  {name:"Tableau",icon:"/icons/tableau.png",url:"https://tableau.lightmap.com/#/views/GameOffersStats_16814863932280/GameOffersstats?:iid=2"},
  {name:"PG3D.Admin",icon:"/icons/admin.png",url:"https://admin.pixelgun3d.com/login.php"},
  {name:"Appsheet",icon:"/icons/appsheet.png",url:"https://www.appsheet.com/start/af0ee9ea-93dd-4252-a0b6-8f5ff46bc8a3"},
  {name:"GitLab",icon:"/icons/gitlab.webp",url:"https://gitlab.lightmap.com/users/sign_in"},
  {name:"Claude",icon:"/icons/claude.png",url:"https://claude.ai/new"},
  {name:"Content Sheet",icon:"/icons/content-sheet.png",url:"https://docs.google.com/spreadsheets/d/1ZM2fCvf580tDi0bA7RshmHuKzg-X9y84RN40FHfbhTc/edit?gid=1438679607#gid=1438679607"},
  {name:"Calculator",icon:"/icons/calculator.png",url:"https://docs.google.com/spreadsheets/d/1kanzsPLAdiIsQbC8Bz0plim9qG1_3hEkR_e-T0kV0cM/edit?gid=2083202133#gid=2083202133"},
  {name:"Configs Archive",icon:"/icons/archive.png",url:"https://docs.google.com/document/d/1X2ktgdRp0SfQMBmR9_6rrtXBp1Kc_oteQg6N_hWQ2qY/edit"},
  {name:"Aghanim",icon:"/icons/aghanim.png",url:"https://docs.google.com/spreadsheets/u/1/d/1isCRJ9l_w-JbM4aXoXY22nftZyr5IAO0UkpMYe_LwvM/edit?gid=1461258706#gid=1461258706"},
  {name:"Content Plan",icon:"/icons/content-plan.png",url:"https://docs.google.com/spreadsheets/d/1lUrRJlwMvamwj-GP_Am03iJ9Y3ziU_K4Cce39uiIoUY/edit?gid=1741412222#gid=1741412222"},
  {name:"Notion",icon:"/icons/notion.png",url:"https://www.notion.so/cubicgames/cfa8d8f2c5db405a9b37384f0fa72322"},
  {name:"Translator",icon:"/icons/translator.png",url:"https://translate.yandex.ru/?source_lang=en&target_lang=ru"},
  {name:"Figma",icon:"/icons/figma.webp",url:"https://www.figma.com/design/OPWNcCTREwX1OfqVSaxWiK"},
  {name:"Confluence",icon:"/icons/confluence.webp",url:"https://cubicgamesstudio.atlassian.net/wiki/spaces/PG3/pages/3036348439"},
  {name:"Weapon Analytics",icon:"/icons/weapon-anal.png",url:"https://docs.google.com/spreadsheets/d/1YKQ4dtCBeUVpMy1oaBxFC-nS4udGHvjYU_qx7U1HTMs/edit?gid=619054802#gid=619054802"},
  {name:"Distribution&Trends",icon:"/icons/distribution.png",url:"https://docs.google.com/spreadsheets/d/1kGr5rrlg9Y7yKniFaFu_qv2r--2orvUhBYCk7UkYIUI/edit?pli=1&gid=0#gid=0"},
];

const CATALOG=[
  {cat:"Currency",name:"Gems",unit:30,uLabel:"/30"},{cat:"Currency",name:"Coins",unit:50,uLabel:"/50"},{cat:"Currency",name:"Keys",unit:50,uLabel:"/50"},{cat:"Currency",name:"PixelPassExp",unit:150,uLabel:"/150"},{cat:"Currency",name:"PixelPassTicket",unit:60,uLabel:"/60"},{cat:"Currency",name:"GalleryCoupons",unit:50,uLabel:"/50"},{cat:"Currency",name:"ClanSilver",unit:1000,uLabel:"/1000"},{cat:"Currency",name:"Template Currency",unit:5,uLabel:"/5"},
  {cat:"Armor Set",name:"Legendary Armor Set",price:10},{cat:"Armor Set",name:"Mythic Armor Set",price:20},
  {cat:"Armor",name:"Rare Armor",price:2},{cat:"Armor",name:"Epic Armor",price:5},{cat:"Armor",name:"Legendary Armor",price:7},{cat:"Armor",name:"Mythic Armor",price:15},
  {cat:"Gadget",name:"Common Gadget",price:1},{cat:"Gadget",name:"Rare Gadget",price:2},{cat:"Gadget",name:"Epic Gadget",price:5},{cat:"Gadget",name:"Legendary Gadget",price:7},{cat:"Gadget",name:"Mythic Gadget",price:15},
  {cat:"Cosmetic",name:"Module",price:0.1},{cat:"Cosmetic",name:"Boots",price:1},{cat:"Cosmetic",name:"Mask",price:1},{cat:"Cosmetic",name:"Hat",price:1},{cat:"Cosmetic",name:"Cape",price:1},{cat:"Cosmetic",name:"Skin Boots",price:1},{cat:"Cosmetic",name:"Skin Mask",price:1},{cat:"Cosmetic",name:"Skin Hat",price:1},{cat:"Cosmetic",name:"Graffiti",price:1},
  {cat:"Pet",name:"Common Pet",price:0.25},{cat:"Pet",name:"Uncommon Pet",price:0.5},{cat:"Pet",name:"Rare Pet",price:1},{cat:"Pet",name:"Epic Pet",price:2},{cat:"Pet",name:"Legendary Pet",price:4},{cat:"Pet",name:"Mythical Pet",price:6},{cat:"Pet",name:"Mythical P_Parts",price:0.28},{cat:"Pet",name:"Legendary Egg",price:1},{cat:"Pet",name:"Mythical Egg",price:2},
  {cat:"Weapon",name:"Common Weapon",price:1},{cat:"Weapon",name:"Rare Weapon",price:2},{cat:"Weapon",name:"Epic Weapon",price:5},{cat:"Weapon",name:"Legendary Weapon",price:10},{cat:"Weapon",name:"Mythic Weapon",price:20},{cat:"Weapon",name:"Legendary Shovel",price:2},{cat:"Weapon",name:"Mythic Shovel",price:5},
  {cat:"W_Parts",name:"Rare W_Parts",price:0.008},{cat:"W_Parts",name:"Epic W_Parts",price:0.02},{cat:"W_Parts",name:"Legendary W_Parts",price:0.04},{cat:"W_Parts",name:"Mythic W_Parts",price:0.08},
  {cat:"Upgrade",name:"L_Upgrade",price:1},{cat:"Upgrade",name:"Rare Q_Upgrade",price:2},{cat:"Upgrade",name:"Epic Q_Upgrade",price:5},{cat:"Upgrade",name:"Legendary Q_Upgrade",price:10},
  {cat:"Avatar",name:"Epic Avatar",price:2},{cat:"Avatar",name:"Legendary Avatar",price:5},{cat:"Avatar",name:"Mythic Avatar",price:10},{cat:"Avatar",name:"Mythic A_Parts",price:0.04},
  {cat:"Trail",name:"Common Trail",price:0.5},{cat:"Trail",name:"Uncommon Trail",price:1},{cat:"Trail",name:"Rare Trail",price:2},{cat:"Trail",name:"Epic Trail",price:3},{cat:"Trail",name:"Legendary Trail",price:4},{cat:"Trail",name:"Mythic Trail",price:5},
  {cat:"Car",name:"Common Car",price:0.5},{cat:"Car",name:"Rare Car",price:1},{cat:"Car",name:"Epic Car",price:2},{cat:"Car",name:"Legendary Car",price:4},{cat:"Car",name:"Mythic Car",price:6},
  {cat:"Weapon Skin",name:"Epic Weapon Skin",price:2},{cat:"Weapon Skin",name:"Legendary Weapon Skin",price:5},{cat:"Weapon Skin",name:"Mythic Weapon Skin",price:10},
  {cat:"Glider",name:"Common Glider",price:0.5},{cat:"Glider",name:"Uncommon Glider",price:1},{cat:"Glider",name:"Rare Glider",price:2},{cat:"Glider",name:"Epic Glider",price:3},{cat:"Glider",name:"Legendary Glider",price:4},{cat:"Glider",name:"Mythic Glider",price:5},
  {cat:"Booster",name:"Booster x25 XP",price:0.25},{cat:"Booster",name:"Booster x50 XP",price:0.5},{cat:"Booster",name:"Booster x100 XP",price:1},{cat:"Booster",name:"Booster x200 XP",price:2},{cat:"Booster",name:"Gems Booster",price:0.13},
  {cat:"Chest",name:"Lootbox",price:1},{cat:"Chest",name:"Lootbox_T1",price:8},{cat:"Chest",name:"Lootbox_T2",price:6},{cat:"Chest",name:"Lootbox_T3",price:5},{cat:"Chest",name:"Lootbox_T4",price:2},{cat:"Chest",name:"Lootbox_SolidGuns",price:15},{cat:"Chest",name:"Lootbox_Collector",price:15},{cat:"Chest",name:"Small Chest",price:0.2},{cat:"Chest",name:"Medium Chest",price:1},{cat:"Chest",name:"Big Chest",price:5},{cat:"Chest",name:"Monthly Chest",price:7},{cat:"Chest",name:"Super Chest",price:40}
];
const CATS=[...new Set(CATALOG.map(i=>i.cat))];
function iv(item,qty){return item.unit ? qty/item.unit : qty*item.price}

let _offerIdCounter=4;

const ITEM_TYPES=["Weapon","Avatar","WeaponSkin","Gadget","Gadget_Detail","Module","Hat","Mask","Armor","Cape","Boots","Graffiti","Pet","Car","Trail","Glider","Shovel","Event","Primary","Backup","Melee","Special","Sniper","Premium","PortraitFrameUI","PortraitUI","ProfileBackgroundUI"];
const ITEM_RARITIES=["Common","Rare","Epic","Legendary","Mythic"];
const SALE_LOCATIONS=["Lottery","CardRoulette","AdsRoulette","PersonalEvent","TraderVan","Offer","PixelPass","TemplateEvent"];
const SALE_LOCATION_LABEL={Lottery:"Lottery",CardRoulette:"Card Roulette",AdsRoulette:"Ads Roulette",PersonalEvent:"Personal Event",TraderVan:"Trader Van",Offer:"Offer",PixelPass:"Pixel Pass",TemplateEvent:"Template Event"};
const SALE_LOCATION_GLYPH={Lottery:"🎟",CardRoulette:"🎡",AdsRoulette:"📺",PersonalEvent:"👤",TraderVan:"🚐",Offer:"🏷",PixelPass:"🎫",TemplateEvent:"📋"};
const RARITY_META={Common:{label:"Обычная",color:"#e5e5e5"},Rare:{label:"Редкая",color:"#3b82f6"},Epic:{label:"Эпическая",color:"#fbbf24"},Legendary:{label:"Легендарная",color:"#f97316"},Mythic:{label:"Мифическая",color:"#a855f7"}};
function effectiveRarity(item){return item?.sheetRarity||item?.rarity||""}
function effectiveName(item){return item?.name||item?.realName||item?.sheetName||""}
const WARNING_SETTINGS=["Кланы","Турниры","Anniversary","DLC"];
function hasWarningSetting(item){
  const list=String(item?.setting||"").split(",").map(s=>s.trim());
  return list.some(s=>WARNING_SETTINGS.includes(s));
}
function rarityMetaFor(value){const key=Object.keys(RARITY_META).find(k=>k.toLowerCase()===String(value||"").trim().toLowerCase());return key?RARITY_META[key]:null}
function fmtItemDate(value){if(!value)return "—";const d=new Date(value);if(Number.isNaN(d.getTime()))return value;return d.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"2-digit"})}

function Icon({type,color="#fff",sz=15}){
  const p={home:<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>,tasks:<path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm2 4v2h8V6H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z"/>,config:<path d="M12 15.5A3.5 3.5 0 0115.5 12 3.5 3.5 0 0112 8.5 3.5 3.5 0 018.5 12 3.5 3.5 0 0112 15.5zM19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.06 7.06 0 00-1.69-.98l-.38-2.65A.49.49 0 0014 2h-4a.49.49 0 00-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.49.49 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.05.24.26.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.5.5 0 00.61-.22l2-3.46a.49.49 0 00-.12-.64l-2.11-1.65z"/>,boards:<path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/>,tools:<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>,up:<path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>,down:<path d="M12 5v14M5 12l7 7 7-7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>,back:<path d="M15 18l-6-6 6-6" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>};
  return <svg width={sz} height={sz} viewBox="0 0 24 24" fill={["up","down","back"].includes(type)?"none":color}>{p[type]}</svg>;
}

/* ─── Tab icon mapping ─── */
const TAB_ICON_MAP={"Trader Van":"\u26DF","LootBoxes":"\uD83D\uDDC3","Offers":"$","Localization":"\u53CB","Lottery":"\uD83C\uDF9F","Balance":"\u2696\uFE0E","Event Center":"\uD83D\uDDD3","Card Roulette":"\uD83C\uDCB1","Main Store":"\u26C1","Attributes":"\uD83C\uDF9A","Pers. Events":"\u2254","Temp. Events":"\u2611","AB Test":"\uD83D\uDDA7","Exp Open":"\u2191","Map List":"\uD83D\uDDFA","Clan War":"\u26E8","ADS Roulette":"\uD83C\uDF9E","Clan Chests":"\uD83D\uDF32","GameModeHub":"\uD800\uDC51","Tournament":"\uD83C\uDF96","Bots":"\u23FB","Rotation":"\u21BB","Tableau":"\uD83D\uDCCA","PG3D.Admin":"\uBAA8","Appsheet":"\uD83D\uDCF1","GitLab":"\uD83E\uDDEA","Claude":"\uD83E\uDD16","Content Sheet":"\u229E","Calculator":"\u00F7","Configs Archive":"\uD83D\uDDC1","Aghanim":"A","Content Plan":"\uD83D\uDDD0","Notion":"\u2712","Translator":"\uD83C\uDF10","Figma":"\u25B2","Confluence":"\uD83D\uDCD6","GameOffer Resources":"\u270E","PG3D Items":"\u270E","Dmitriy Krasnitskiy":"\u270E","Monetization - Planning":"\u270E"};
function getTabIcon(title){return TAB_ICON_MAP[title]||"\uD83D\uDCC4"}

function Sidebar({section,setSection,total}){
  if(typeof window!=="undefined"&&window.__PG3D_DESKTOP_SHELL__)return null;
  return (
    <div style={{position:"absolute",left:0,bottom:0,width:48,height:"55%",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",background:BG,borderRadius:12,padding:"6px 0"}}>
      <div onClick={()=>setSection(Math.max(0,section-1))} style={{width:34,height:34,background:A,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Icon type="up" color={BG} sz={13}/></div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{writingMode:"vertical-rl",transform:"rotate(180deg)",fontSize:28,fontWeight:900,color:"#fff",letterSpacing:4,opacity:0.7}}>{String(section+1).padStart(2,"0")}</div></div>
      <div onClick={()=>setSection(Math.min(total-1,section+1))} style={{width:34,height:34,background:A,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Icon type="down" color={BG} sz={13}/></div>
    </div>
  );
}

function ZzzHeader({onBack,onMinimize,title,rightLabel,rightUrl}){
  return (
    <div style={{position:"relative",height:48,overflow:"hidden",flexShrink:0}}>
      <div style={{position:"absolute",inset:0,background:"#EFF0EF"}}/>
      <div style={{position:"absolute",left:0,bottom:0,right:0,height:"50%",background:A,clipPath:"polygon(0 40%,100% 0,100% 100%,0 100%)"}}/>
      <div style={{position:"absolute",left:0,bottom:0,right:0,height:"38%",background:"repeating-linear-gradient(135deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,padding:"0 12px",height:"100%",display:"flex",alignItems:"center",gap:10}}>
        <div onClick={onBack} onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.querySelector("path").style.stroke=BG}} onMouseLeave={e=>{e.currentTarget.style.background="#000";e.currentTarget.querySelector("path").style.stroke=A}} style={{width:34,height:34,background:"#000",border:`2px solid ${A}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}><Icon type="back" color={A} sz={13}/></div>
        <div style={{width:3,height:18,background:A,borderRadius:1}}/>
        <div style={{fontSize:15,fontWeight:900,fontFamily:ZZZ,fontStyle:"italic",color:"#000",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
        {onMinimize && (
          <div onClick={onMinimize} title="Minimize to tab" onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.querySelector("line").style.stroke=BG}} onMouseLeave={e=>{e.currentTarget.style.background="#000";e.currentTarget.querySelector("line").style.stroke=A}} style={{width:34,height:34,background:"#000",border:`2px solid ${A}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><line x1="5" y1="12" x2="19" y2="12" stroke={A} strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
        )}
        {rightUrl && <a href={rightUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"rgba(0,0,0,0.4)",background:"rgba(0,0,0,0.07)",padding:"4px 10px",borderRadius:5,textDecoration:"none",fontWeight:600,flexShrink:0}}>{rightLabel||"Open"} ↗</a>}
      </div>
    </div>
  );
}

function TaskDetail({taskKey,onClose}){
  const [data,setData]=useState(null);const [trans,setTrans]=useState([]);const [loading,setLoading]=useState(true);const [comment,setComment]=useState("");const [posting,setPosting]=useState(false);const [editDesc,setEditDesc]=useState(false);const [descDraft,setDescDraft]=useState("");const [saving,setSaving]=useState(false);
  const hdrs={"Accept":"application/json"};const hdrsJ={...hdrs,"Content-Type":"application/json","X-Atlassian-Token":"no-check"};
  const load=()=>{setLoading(true);Promise.all([fetch(`/jira-api/rest/api/2/issue/${taskKey}?fields=summary,description,status,priority,assignee,reporter,parent,duedate,fixVersions,comment`,{headers:hdrs}).then(r=>r.json()),fetch(`/jira-api/rest/api/2/issue/${taskKey}/transitions`,{headers:hdrs}).then(r=>r.json())]).then(([issue,tr])=>{setData(issue);setTrans(tr.transitions||[]);setLoading(false);setEditDesc(false)})};
  useEffect(()=>{load()},[taskKey]);
  const doTrans=(id)=>{setSaving(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}/transitions`,{method:"POST",headers:hdrsJ,body:JSON.stringify({transition:{id:String(id)}})}).then(r=>{if(!r.ok)return r.text().then(t=>{alert("Failed: "+t);setSaving(false)});setSaving(false);load()}).catch(e=>{alert(e.message);setSaving(false)})};
  const saveDesc=()=>{setSaving(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}`,{method:"PUT",headers:hdrsJ,body:JSON.stringify({fields:{description:descDraft}})}).then(r=>{if(!r.ok)return r.text().then(t=>alert("Failed: "+t));setSaving(false);load()}).catch(e=>{alert(e.message);setSaving(false)})};
  const addComment=()=>{if(!comment.trim())return;setPosting(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}/comment`,{method:"POST",headers:hdrsJ,body:JSON.stringify({body:comment})}).then(()=>{setComment("");setPosting(false);load()})};
  if(loading) return <div style={{position:"absolute",inset:0,zIndex:50,background:BG,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:T2}}>Loading...</div></div>;
  const f=data?.fields||{};const comments=(f.comment?.comments||[]).slice(-20);const clr=sClr(f.status?.name);
  return (
    <div style={{position:"absolute",inset:0,zIndex:50,background:BG,borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ZzzHeader onBack={onClose} title={<><a href={`${JIRA_BASE}/browse/${taskKey}`} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none",fontWeight:600,marginRight:8}}>{taskKey}</a>{f.summary}</>} rightLabel="Open in Jira" rightUrl={`${JIRA_BASE}/browse/${taskKey}`}/>
      <div style={{flex:1,overflowY:"auto",display:"flex"}}>
        <div style={{flex:1,padding:20,borderRight:`1px solid ${BRD}`,overflowY:"auto"}}>
          <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:700,color:"#fff",background:clr}}>{sDisp(f.status?.name)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={T2}><path d="M9 18l6-6-6-6"/></svg>
            {trans.map(tr=>(<button key={tr.id} onClick={()=>doTrans(tr.id)} disabled={saving} onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.style.color="#000";e.currentTarget.style.borderColor=A}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T1;e.currentTarget.style.borderColor=BRD}} style={{padding:"5px 12px",background:"transparent",border:`2px solid ${BRD}`,borderRadius:20,color:T1,fontSize:11,fontWeight:700,fontFamily:ZZZ,fontStyle:"italic",cursor:saving?"wait":"pointer",transition:"all .15s",opacity:saving?0.5:1}}>{sDisp(tr.to?.name||tr.name)}</button>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {[{l:"Priority",v:f.priority?.name||"—"},{l:"Assignee",v:f.assignee?.displayName||"—"},{l:"Reporter",v:f.reporter?.displayName||"—"},{l:"Fix Versions",v:f.fixVersions?.length?f.fixVersions.map(v=>v.name).join(", "):"—"},{l:"Due Date",v:f.duedate?new Date(f.duedate).toLocaleDateString("ru-RU"):"—",c:f.duedate&&new Date(f.duedate)<new Date()?DNG:null}].map((fl,i)=>(<div key={i} style={{background:"#1a1a22",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:T2,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:4}}>{fl.l}</div><div style={{fontSize:13,color:fl.c||T1,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={fl.v}>{fl.v}</div></div>))}
          </div>
          {f.parent && <div style={{marginBottom:16,fontSize:12,color:T2}}>Parent: <a href={`${JIRA_BASE}/browse/${f.parent.key}`} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none"}}>{f.parent.key} — {f.parent.fields?.summary}</a></div>}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{fontSize:10,color:T2,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Description</div><div style={{flex:1}}/>
            {!editDesc ? <button onClick={()=>{setDescDraft(f.description||"");setEditDesc(true)}} onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.color=A}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BRD;e.currentTarget.style.color=T2}} style={{padding:"3px 10px",background:"transparent",border:`1px solid ${BRD}`,borderRadius:6,color:T2,fontSize:10,cursor:"pointer",transition:"all .15s",fontWeight:600}}>Edit</button>
              : <div style={{display:"flex",gap:4}}><button onClick={saveDesc} disabled={saving} style={{padding:"3px 10px",background:A,border:"none",borderRadius:6,color:"#000",fontSize:10,cursor:"pointer",fontWeight:800}}>{saving?"Saving...":"Save"}</button><button onClick={()=>setEditDesc(false)} style={{padding:"3px 10px",background:"transparent",border:`1px solid ${BRD}`,borderRadius:6,color:T2,fontSize:10,cursor:"pointer"}}>Cancel</button></div>}
          </div>
          {editDesc ? <textarea value={descDraft} onChange={e=>setDescDraft(e.target.value)} style={{width:"100%",minHeight:120,background:"#1a1a22",border:`1.5px solid ${A}`,borderRadius:12,color:T1,fontSize:13,padding:"12px 14px",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6}}/> : <div style={{background:"#1a1a22",borderRadius:12,padding:"14px 16px",fontSize:13,color:T1,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",minHeight:60,cursor:"pointer"}} onClick={()=>{setDescDraft(f.description||"");setEditDesc(true)}}><ParseDesc text={f.description}/></div>}
        </div>
        <div style={{width:"30%",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"14px 14px 6px",display:"flex",alignItems:"center",gap:5}}><div style={{width:3,height:12,background:A,borderRadius:1}}/><div style={{fontSize:10,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Comments</div><div style={{flex:1}}/><div style={{fontSize:9,color:T2}}>{comments.length}</div></div>
          <div style={{flex:1,overflowY:"auto",padding:"0 14px 6px"}}>
            {comments.length===0 && <div style={{padding:16,textAlign:"center",color:T2,fontSize:11,fontStyle:"italic"}}>No comments</div>}
            {comments.map((c,i)=>(<div key={c.id||i} style={{marginBottom:6,background:"#1a1a22",borderRadius:8,padding:"8px 10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:A}}>{c.author?.displayName||"?"}</span><span style={{fontSize:9,color:T2}}>{new Date(c.created).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span></div><div style={{fontSize:11,color:T1,lineHeight:1.4,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{c.body}</div></div>))}
          </div>
          <div style={{padding:"6px 14px 14px",borderTop:`1px solid ${BRD}`}}>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment..." rows={2} style={{width:"100%",background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:8,color:T1,fontSize:11,padding:"8px 10px",outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BRD}/>
            <button onClick={addComment} disabled={posting||!comment.trim()} style={{marginTop:4,padding:"6px 16px",background:posting||!comment.trim()?"#333":A,color:posting||!comment.trim()?T2:"#000",border:"none",borderRadius:8,fontSize:11,fontWeight:800,fontFamily:ZZZ,fontStyle:"italic",cursor:posting||!comment.trim()?"default":"pointer"}}>{posting?"...":"Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleSheetsView(){
  const viewRef=useRef(null);
  const [canGoBack,setCanGoBack]=useState(false);
  useEffect(()=>{
    const view=viewRef.current;if(!view)return;
    const sync=()=>{try{setCanGoBack(view.canGoBack())}catch{/* guest is still attaching */}};
    view.addEventListener("did-navigate",sync);view.addEventListener("did-navigate-in-page",sync);view.addEventListener("dom-ready",sync);
    return()=>{view.removeEventListener("did-navigate",sync);view.removeEventListener("did-navigate-in-page",sync);view.removeEventListener("dom-ready",sync)};
  },[]);
  const back=()=>{const view=viewRef.current;if(view&&view.canGoBack())view.goBack()};
  const returnToSheet=()=>viewRef.current?.loadURL(SHEETS_URL);
  return <div className="google-sheet-view">
    <div className="google-sheet-toolbar">
      <button onClick={back} disabled={!canGoBack}><FiArrowLeft/>Назад</button>
      <button onClick={returnToSheet}>Вернуться к таблице</button>
      <span>Вход выполняется в защищённой локальной сессии приложения</span>
    </div>
    <webview ref={viewRef} src={SHEETS_URL} partition="persist:pg3d-workspace" allowpopups="true"/>
  </div>;
}

function JiraSetupForm({onDone}){
  const [email,setEmail]=useState("");
  const [token,setToken]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const submit=()=>{
    if(!email.trim()||!token.trim()){setError("Укажите email и API-токен");return}
    setBusy(true);setError("");
    window.workspaceJira.setCredentials(email.trim(),token.trim()).then(res=>{setBusy(false);onDone(res)}).catch(e=>{setBusy(false);setError(e.message)});
  };
  return (
    <div style={{padding:24,maxWidth:360}}>
      <div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:10}}>Подключите свой аккаунт Jira</div>
      <div style={{fontSize:11,color:T2,marginBottom:14,lineHeight:1.5}}>Понадобится email и персональный API-токен. Создать токен: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA"}}>id.atlassian.com</a>. Хранится только на этом компьютере.</div>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@cubicgames.com" style={{width:"100%",marginBottom:8,padding:"8px 10px",background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,boxSizing:"border-box"}}/>
      <input value={token} onChange={e=>setToken(e.target.value)} type="password" placeholder="API токен" style={{width:"100%",marginBottom:8,padding:"8px 10px",background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,boxSizing:"border-box"}}/>
      {error && <div style={{fontSize:11,color:DNG,marginBottom:8}}>{error}</div>}
      <button onClick={submit} disabled={busy} style={{padding:"8px 16px",background:A,border:"none",borderRadius:0,color:"#000",fontSize:12,fontWeight:800,cursor:busy?"wait":"pointer"}}>{busy?"Проверка...":"Подключить"}</button>
    </div>
  );
}

function TasksTab({openIn,activeSection=0}){
  const [section,setSection]=useState(activeSection);const [tasks,setTasks]=useState([]);const [loading,setLoading]=useState(true);const [err,setErr]=useState(null);const [sortBy,setSortBy]=useState(null);const [showSort,setShowSort]=useState(false);const [selTask,setSelTask]=useState(null);
  const [search,setSearch]=useState("");const [statusFilter,setStatusFilter]=useState("all");const [priorityFilter,setPriorityFilter]=useState("all");
  useEffect(()=>setSection(activeSection),[activeSection]);
  const [jiraStatus,setJiraStatus]=useState(null);
  const load=()=>{setLoading(true);fetch(`/jira-api/rest/api/2/search/jql?jql=${encodeURIComponent(JIRA_JQL)}&maxResults=50&fields=summary,status,priority,parent,duedate`,{headers:{"Accept":"application/json"}}).then(r=>{if(r.status===401){setJiraStatus({configured:false});setLoading(false);return null}if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(d=>{if(d){setTasks(d.issues||[]);setLoading(false)}}).catch(e=>{setErr(e.message);setLoading(false)})};
  useEffect(()=>{window.workspaceJira.getStatus().then(s=>{setJiraStatus(s);if(s.configured)load();else setLoading(false)})},[]);
  const statusOptions=useMemo(()=>[...new Set(tasks.map(t=>t.fields?.status?.name).filter(Boolean))],[tasks]);
  const priorityOptions=useMemo(()=>[...new Set(tasks.map(t=>t.fields?.priority?.name).filter(Boolean))],[tasks]);
  const filtered=useMemo(()=>tasks.filter(t=>{
    const f=t.fields||{};
    if(statusFilter!=="all"&&f.status?.name!==statusFilter)return false;
    if(priorityFilter!=="all"&&f.priority?.name!==priorityFilter)return false;
    if(search.trim()){
      const q=search.trim().toLowerCase();
      if(!(t.key.toLowerCase().includes(q)||String(f.summary||"").toLowerCase().includes(q)))return false;
    }
    return true;
  }),[tasks,statusFilter,priorityFilter,search]);
  const sorted=useMemo(()=>{if(!sortBy)return filtered;const c=[...filtered];if(sortBy==="deadline")c.sort((a,b)=>(a.fields?.duedate||"9999").localeCompare(b.fields?.duedate||"9999"));if(sortBy==="status")c.sort((a,b)=>(S_ORDER[a.fields?.status?.name]??5)-(S_ORDER[b.fields?.status?.name]??5));return c},[filtered,sortBy]);
  if(section===1) return (<div style={{position:"relative",height:"100%"}}><Sidebar section={section} setSection={setSection} total={3}/><div style={{position:"absolute",left:54,top:0,right:0,bottom:0,borderRadius:16,overflow:"hidden",background:"#EFF0EF"}}><div style={{display:"flex",alignItems:"center",padding:"8px 14px",gap:8}}><div style={{width:3,height:16,background:A,borderRadius:1}}/><div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#000",letterSpacing:1,textTransform:"uppercase"}}>Google Sheets</div></div><div style={{margin:"0 8px 8px",borderRadius:12,overflow:"hidden",height:"calc(100% - 44px)"}}><GoogleSheetsView/></div></div></div>);
  if(section===2) return (<div style={{position:"relative",height:"100%"}}><Sidebar section={section} setSection={setSection} total={3}/><div style={{position:"absolute",left:54,top:0,right:0,bottom:0}}><TimeTracker/></div></div>);
  if(jiraStatus&&!jiraStatus.configured) return (<div style={{position:"relative",height:"100%",display:"flex"}}><Sidebar section={section} setSection={setSection} total={3}/><div style={{flex:1,marginLeft:54,display:"flex",alignItems:"center",justifyContent:"center"}}><JiraSetupForm onDone={s=>{setJiraStatus(s);load()}}/></div></div>);
  return (
    <div className="tasks-page" style={{position:"relative",height:"100%",display:"flex"}}>
      <Sidebar section={section} setSection={setSection} total={3}/>
      {selTask && <TaskDetail taskKey={selTask} onClose={()=>{setSelTask(null);load()}}/>}
      <div className="tasks-summary-panel" style={{width:"24%",marginLeft:54,position:"relative",overflow:"hidden",borderRadius:"16px 0 0 16px",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,background:"#EFF0EF"}}/><div style={{position:"absolute",left:0,bottom:0,right:0,top:"25%",background:A,clipPath:"polygon(0 18%,100% 0,100% 100%,0 100%)"}}/><div style={{position:"absolute",left:0,bottom:0,right:0,top:"38%",background:"repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 6px)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,padding:"14px 16px",height:"100%",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:10,color:T2,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>// Dashboard</div>
          <div style={{fontSize:11,color:"#000",fontWeight:600,marginBottom:"auto"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",day:"2-digit",month:"long"})}</div>
          <div style={{fontSize:22,fontWeight:900,color:"#000",fontFamily:ZZZ,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Tasks</div>
          <div style={{fontSize:80,fontWeight:900,lineHeight:0.85,marginBottom:10}}><span style={{background:"repeating-linear-gradient(135deg,#000 0px,#000 2px,transparent 2px,transparent 4.5px)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-3}}>01</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{n:tasks.length||"...",l:"Total"},{n:tasks.filter(t=>TODO_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"To Do"},{n:tasks.filter(t=>ACTIVE_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"Active"},{n:tasks.filter(t=>DONE_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"Done",c:"#22C55E"}].map((s,i)=>(<div key={i} style={{background:"rgba(0,0,0,0.08)",borderRadius:10,padding:"12px 12px"}}><div style={{fontSize:28,fontWeight:900,color:s.c||"#000",lineHeight:1}}>{s.n}</div><div style={{fontSize:11,color:"rgba(0,0,0,0.5)",textTransform:"uppercase",letterSpacing:0.5,marginTop:4}}>{s.l}</div></div>))}
          </div>
        </div>
      </div>
      <div className="tasks-list-panel" style={{flex:1,background:BG,borderLeft:"1px solid #EFF0EF",borderRadius:"0 16px 16px 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px 8px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:3,height:14,background:A,borderRadius:1}}/><div style={{fontSize:12,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>My tasks</div><div style={{flex:1}}/><a href={`${JIRA_BASE}/issues/?jql=${encodeURIComponent(JIRA_JQL)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"#555",textDecoration:"none",marginRight:8}}>Open in Jira ↗</a>
          <div style={{position:"relative"}}>
            <div onClick={()=>setShowSort(!showSort)} style={{width:28,height:28,background:A,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg></div>
            {showSort && (<div style={{position:"absolute",top:34,right:0,background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:10,padding:4,zIndex:20,minWidth:130,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}><div onClick={()=>{setSortBy("deadline");setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:sortBy==="deadline"?A:T1,fontWeight:sortBy==="deadline"?700:500,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>By deadline</div><div onClick={()=>{setSortBy("status");setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:sortBy==="status"?A:T1,fontWeight:sortBy==="status"?700:500,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>By status</div>{sortBy && <div onClick={()=>{setSortBy(null);setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:T2,cursor:"pointer",borderTop:`1px solid ${BRD}`,marginTop:2}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Reset</div>}</div>)}
          </div>
        </div>
        <div style={{padding:"0 16px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по задачам..." style={{flex:1,minWidth:110,background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:11,padding:"6px 10px",outline:"none",boxSizing:"border-box"}}/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:11,padding:"6px 8px"}}>
            <option value="all">Статус: все</option>
            {statusOptions.map(s=><option key={s} value={s}>{sDisp(s)}</option>)}
          </select>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} style={{background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:11,padding:"6px 8px"}}>
            <option value="all">Приоритет: все</option>
            {priorityOptions.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 16px 10px"}}>
          {loading && <div style={{padding:30,textAlign:"center",color:T2,fontSize:12}}>Loading...</div>}
          {err && <div style={{padding:20,textAlign:"center",color:DNG,fontSize:11}}>Error: {err}</div>}
          {!loading && !err && sorted.map(t=>{const f=t.fields,sn=f.status?.name||"",clr=sClr(sn),snl=sn.toLowerCase();const bgClr=ACTIVE_S.includes(snl)?"rgba(216,250,0,0.04)":DONE_S.includes(snl)?"rgba(34,197,94,0.04)":"rgba(255,255,255,0.02)";
            return (<div key={t.key} onClick={()=>setSelTask(t.key)} style={{background:bgClr,borderRadius:10,padding:"12px 16px",borderLeft:`3px solid ${clr}`,marginBottom:6,cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(216,250,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.background=bgClr}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,color:"#60A5FA",fontWeight:600,flexShrink:0}}>{t.key}</span>
                <div style={{flex:1,fontSize:14,color:T1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.summary}</div>
                {f.duedate && <div style={{fontSize:13,color:new Date(f.duedate)<new Date()?DNG:T2,fontWeight:600,whiteSpace:"nowrap",width:42,textAlign:"right",flexShrink:0}}>{new Date(f.duedate).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"})}</div>}
                <div style={{fontSize:12,color:clr,fontWeight:700,letterSpacing:0.5,whiteSpace:"nowrap",width:120,textAlign:"right",flexShrink:0}}>{sDisp(sn)}</div>
                {f.parent ? <a href={`${JIRA_BASE}/browse/${f.parent.key}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} title={f.parent.fields?.summary||f.parent.key} style={{fontSize:13,color:"#555",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,width:160,overflow:"hidden",textOverflow:"ellipsis",display:"inline-block"}}>{f.parent.fields?.summary||f.parent.key}</a> : <div style={{width:160,flexShrink:0}}/>}
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}



function ItemImage({src,size=48}){
  if(src) return <img src={src} alt="" style={{width:size,height:size,objectFit:"contain",borderRadius:8,background:"#1a1a20",flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:8,background:"#1a1a20",border:`1px dashed ${BRD}`,display:"flex",alignItems:"center",justifyContent:"center",color:T2,fontSize:size*0.35,flexShrink:0}}>?</div>;
}

function ItemCard({item,onOpen}){
  const isEvent=item.type==="Event";
  const rarity=isEvent?null:rarityMetaFor(effectiveRarity(item));
  const displayName=effectiveName(item);
  return (
    <div onDoubleClick={()=>onOpen(item)} title="Двойной клик — подробнее" onMouseEnter={e=>e.currentTarget.style.boxShadow=`6px 6px 0 ${A}`} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"} style={{position:"relative",background:SRF,border:`1px solid ${BRD}`,borderRadius:2,boxShadow:"none",transition:"box-shadow .15s",padding:14,display:"flex",flexDirection:"column",gap:10,cursor:"pointer",width:230,flexShrink:0,userSelect:"none"}}>
      {hasWarningSetting(item)&&<span title="Сеттинг требует внимания" style={{position:"absolute",bottom:8,right:8,fontSize:15,lineHeight:1}}>🚫</span>}
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <ItemImage src={item.icon} size={52}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",textTransform:"uppercase",letterSpacing:.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6}}>{displayName||"без названия"}</div>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8}}>
            {rarity&&<span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,color:T1}}><span style={{width:7,height:7,borderRadius:"50%",background:rarity.color,flexShrink:0}}/>{rarity.label}</span>}
            {item.tier&&<span style={{padding:"2px 8px",borderRadius:2,border:`1px solid ${A}`,color:A,fontSize:10,fontWeight:800}}>{item.tier}</span>}
          </div>
        </div>
      </div>
      <div style={{fontSize:12,color:T2,display:"flex",flexDirection:"column",gap:4}}>
        <div>{isEvent?"ID валюты":"ID"}: <span style={{color:T1}}>{item.id||"—"}</span></div>
        {!isEvent&&<div>Parts: <span style={{color:T1}}>{item.parts||"None"}</span></div>}
        {item.lastSale&&<div style={{display:"flex",alignItems:"center",gap:5}}>{isEvent?"Запуск":"Last sale"}: <span style={{color:T1}}>{fmtItemDate(item.lastSale)}</span>{item.saleLocation&&<span title={SALE_LOCATION_LABEL[item.saleLocation]} style={{fontSize:12,opacity:.85}}>{SALE_LOCATION_GLYPH[item.saleLocation]}</span>}</div>}
      </div>
    </div>
  );
}

function ItemDetail({item,onClose,onOpenLottery,onOpenCardRoulette,onOpenItemSettings}){
  const isEvent=item.type==="Event";
  const rarity=isEvent?null:rarityMetaFor(effectiveRarity(item));
  const displayName=effectiveName(item);
  const rows=[[isEvent?"ID валюты":"ID",item.id||"—"]];
  if(!isEvent)rows.push(["Parts",item.parts||"None"]);
  rows.push(["Tag",item.tag||"—"],["тип",item.type||"—"],["сеттинг",item.setting||"—"]);
  if(!isEvent)rows.push(["tier",item.tier||"—"],["type (Weapon Analytics)",item.sheetType||"—"],["rarity (Weapon Analytics)",item.sheetRarity||"—"],["летальность",item.sheetLethality||"—"],["распространённость",item.sheetPrevalence||"—"]);
  if(item.lastSale){rows.push([isEvent?"дата последнего запуска":"дата последней продажи",fmtItemDate(item.lastSale)]);rows.push([isEvent?"тип ивента":"место продажи",item.saleLocation?SALE_LOCATION_LABEL[item.saleLocation]:"—"])}
  return (
    <div className="event-modal-backdrop" style={{position:"fixed"}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal">
        <header><div><span>ITEM DATA</span><h2>{displayName||"без названия"}</h2></div>{onOpenItemSettings&&<button type="button" onClick={()=>onOpenItemSettings(item)} title="Открыть настройки предмета" style={{width:32,height:32,display:"grid",placeItems:"center",border:`1px solid ${BRD}`,borderRadius:2,background:"transparent",color:T2,cursor:"pointer",flexShrink:0,alignSelf:"flex-start"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.color=A}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BRD;e.currentTarget.style.color=T2}}><FiSettings size={15}/></button>}</header>
        <div style={{position:"relative"}}>
        {hasWarningSetting(item)&&<span title="Сеттинг требует внимания" style={{position:"absolute",top:0,right:0,fontSize:18,lineHeight:1}}>🚫</span>}
        <div style={{display:"flex",gap:20,alignItems:"flex-start",marginBottom:14,flexWrap:"wrap"}}>
          <div style={{position:"relative",flexShrink:0}}>
            <ItemImage src={item.icon} size={256}/>
            {isEvent&&item.eventIcon&&<img src={item.eventIcon} alt="" style={{position:"absolute",bottom:6,right:6,width:64,height:64,borderRadius:4,border:`1px solid ${BRD}`,background:"#1a1a20",objectFit:"contain"}}/>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:180}}>
            {rarity&&<span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,0.06)",fontSize:11,fontWeight:700,color:T1,alignSelf:"flex-start"}}><span style={{width:7,height:7,borderRadius:"50%",background:rarity.color,flexShrink:0}}/>{rarity.label}</span>}
            {!isEvent&&onOpenLottery&&<button type="button" className="primary-action" onClick={()=>{if(item.tag)navigator.clipboard?.writeText(item.tag).catch(()=>{});onOpenLottery()}}>Lottery</button>}
            {!isEvent&&onOpenCardRoulette&&<button type="button" className="primary-action" onClick={()=>{if(item.tag)navigator.clipboard?.writeText(item.tag).catch(()=>{});onOpenCardRoulette()}}>Card Roulette</button>}
          </div>
        </div>
        <div className="form-columns">
          {rows.map(([l,v])=>(
            <label key={l}>{l}<input value={v} readOnly/></label>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({label,options,selected,onToggle,align="left"}){
  const [open,setOpen]=useState(false);
  const boxRef=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const onDocClick=e=>{if(boxRef.current&&!boxRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onDocClick);
    return()=>document.removeEventListener("mousedown",onDocClick);
  },[open]);
  return (
    <div ref={boxRef} style={{position:"relative",flexShrink:0}}>
      <button type="button" onClick={()=>setOpen(v=>!v)} className={selected.size?"primary-action":"ghost-action"} style={{whiteSpace:"nowrap"}}>
        {label}{selected.size>0?` (${selected.size})`:""}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",[align==="right"?"right":"left"]:0,zIndex:30,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,padding:8,minWidth:190,maxWidth:260,maxHeight:320,overflowY:"auto",overscrollBehavior:"contain",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          {options.length===0&&<div style={{fontSize:11,color:T2,padding:"2px 4px"}}>Нет значений</div>}
          {options.map(o=>(
            <div key={o} onClick={()=>onToggle(o)} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 2px",cursor:"pointer"}}>
              <input type="checkbox" checked={selected.has(o)} onChange={()=>onToggle(o)} onClick={e=>e.stopPropagation()} style={{width:14,height:14,flexShrink:0,accentColor:A,margin:0}}/>
              <span style={{flex:1,textAlign:"left",fontSize:12,fontWeight:400,textTransform:"none",color:selected.has(o)?A:T1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyFilteredButton({items,align="left"}){
  const [open,setOpen]=useState(false);
  const [copied,setCopied]=useState("");
  const boxRef=useRef(null);
  useEffect(()=>{
    if(!open)return;
    const onDocClick=e=>{if(boxRef.current&&!boxRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onDocClick);
    return()=>document.removeEventListener("mousedown",onDocClick);
  },[open]);
  const options=[{key:"id",label:"Id"},{key:"parts",label:"Parts"},{key:"tag",label:"tag"}];
  const doCopy=async(field)=>{
    const lines=items.map(it=>it[field]).filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").map(v=>String(v));
    const text=lines.join("\n");
    try{
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(()=>setCopied(""),1500);
    }catch{}
    setOpen(false);
  };
  return (
    <div ref={boxRef} style={{position:"relative",flexShrink:0}}>
      <button type="button" onClick={()=>setOpen(v=>!v)} className="ghost-action" style={{whiteSpace:"nowrap"}}>
        {copied?`Скопировано ✓`:"Copy"}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",[align==="right"?"right":"left"]:0,zIndex:30,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,padding:6,minWidth:140,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          {options.map(o=>(
            <div key={o.key} onClick={()=>doCopy(o.key)} style={{padding:"6px 8px",cursor:"pointer",fontSize:12,color:T1,borderRadius:2}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${A}22`;e.currentTarget.style.color=A}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T1}}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeFilterDropdown({label,from,to,onFromChange,onToChange,align="left"}){
  const [open,setOpen]=useState(false);
  const boxRef=useRef(null);
  const active=from!==""||to!=="";
  useEffect(()=>{
    if(!open)return;
    const onDocClick=e=>{if(boxRef.current&&!boxRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onDocClick);
    return()=>document.removeEventListener("mousedown",onDocClick);
  },[open]);
  return (
    <div ref={boxRef} style={{position:"relative",flexShrink:0}}>
      <button type="button" onClick={()=>setOpen(v=>!v)} className={active?"primary-action":"ghost-action"} style={{whiteSpace:"nowrap"}}>
        {label}{active?` (${from||"…"}–${to||"…"})`:""}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",[align==="right"?"right":"left"]:0,zIndex:30,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,padding:10,minWidth:190,boxShadow:"0 8px 24px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={from} onChange={e=>onFromChange(e.target.value)} placeholder="От" style={{width:70,background:"#111",border:`1px solid ${BRD}`,borderRadius:2,color:T1,fontSize:12,padding:"5px 8px",outline:"none"}}/>
          <span style={{color:T2,fontSize:12}}>–</span>
          <input type="number" value={to} onChange={e=>onToChange(e.target.value)} placeholder="До" style={{width:70,background:"#111",border:`1px solid ${BRD}`,borderRadius:2,color:T1,fontSize:12,padding:"5px 8px",outline:"none"}}/>
        </div>
      )}
    </div>
  );
}

function ContentPicker({items=[],settingsList=[],onOpenLottery,onOpenCardRoulette,onOpenItemSettings}){
  const [query,setQuery]=useState("");
  const [typeFilter,setTypeFilter]=useState(()=>new Set());
  const [rarityFilter,setRarityFilter]=useState(()=>new Set());
  const [tierFilter,setTierFilter]=useState(()=>new Set());
  const [settingFilter,setSettingFilter]=useState(()=>new Set());
  const [lethalityFrom,setLethalityFrom]=useState("");
  const [lethalityTo,setLethalityTo]=useState("");
  const [hasPartsFilter,setHasPartsFilter]=useState(false);
  const [openItem,setOpenItem]=useState(null);
  const settingsPool=useMemo(()=>{
    const used=items.flatMap(i=>String(i.setting||"").split(",").map(s=>s.trim()).filter(Boolean));
    return [...new Set([...(settingsList||[]),...used])].sort();
  },[items,settingsList]);
  const tierPool=useMemo(()=>[...new Set(items.map(i=>i.tier).filter(Boolean))].sort(),[items]);
  const toggle=(setFn,value)=>setFn(prev=>{const next=new Set(prev);next.has(value)?next.delete(value):next.add(value);return next});
  const hasActiveSearch=query.trim().length>0||typeFilter.size>0||rarityFilter.size>0||tierFilter.size>0||settingFilter.size>0||lethalityFrom!==""||lethalityTo!==""||hasPartsFilter;
  const resetAll=()=>{
    setQuery("");setTypeFilter(new Set());setRarityFilter(new Set());setTierFilter(new Set());setSettingFilter(new Set());setLethalityFrom("");setLethalityTo("");setHasPartsFilter(false);
  };
  const filtered=useMemo(()=>{
    if(!hasActiveSearch)return [];
    const q=query.trim().toLowerCase();
    const lo=lethalityFrom!==""?Number(lethalityFrom):null;
    const hi=lethalityTo!==""?Number(lethalityTo):null;
    return items.filter(it=>{
      if(q){
        const hay=[it.id,it.parts,it.tag,it.name,it.sheetName].map(v=>String(v??"").toLowerCase());
        if(!hay.some(v=>v.includes(q)))return false;
      }
      if(typeFilter.size&&!typeFilter.has(it.type)&&!typeFilter.has(it.sheetType))return false;
      if(rarityFilter.size&&!rarityFilter.has(effectiveRarity(it)))return false;
      if(tierFilter.size&&!tierFilter.has(it.tier))return false;
      if(settingFilter.size){
        const itemSettings=String(it.setting||"").split(",").map(s=>s.trim()).filter(Boolean);
        if(!itemSettings.some(s=>settingFilter.has(s)))return false;
      }
      if(lo!==null||hi!==null){
        const value=Number(it.sheetLethality);
        if(!Number.isFinite(value))return false;
        if(lo!==null&&value<lo)return false;
        if(hi!==null&&value>hi)return false;
      }
      if(hasPartsFilter&&!(it.id&&it.parts))return false;
      return true;
    });
  },[items,query,typeFilter,rarityFilter,tierFilter,settingFilter,lethalityFrom,lethalityTo,hasPartsFilter,hasActiveSearch]);
  return (
    <div style={{position:"relative"}}>
      {openItem&&<ItemDetail item={openItem} onClose={()=>setOpenItem(null)} onOpenLottery={onOpenLottery} onOpenCardRoulette={onOpenCardRoulette} onOpenItemSettings={onOpenItemSettings}/>}
      <div style={{position:"sticky",top:0,zIndex:25,background:BG,marginLeft:-24,marginRight:-24,paddingTop:18,paddingLeft:24,paddingRight:24,paddingBottom:14}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="id, parts, tag или название..." style={{flex:1,minWidth:220,background:"#1a1a20",border:`1.5px solid ${A}`,borderRadius:2,color:T1,padding:"10px 14px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          <button className="primary-action">Поиск</button>
          <FilterDropdown label="тип" options={ITEM_TYPES} selected={typeFilter} onToggle={v=>toggle(setTypeFilter,v)}/>
          <FilterDropdown label="редкость" options={ITEM_RARITIES} selected={rarityFilter} onToggle={v=>toggle(setRarityFilter,v)}/>
          <FilterDropdown label="тир" options={tierPool} selected={tierFilter} onToggle={v=>toggle(setTierFilter,v)}/>
          <RangeFilterDropdown label="летальность" from={lethalityFrom} to={lethalityTo} onFromChange={setLethalityFrom} onToChange={setLethalityTo}/>
          <FilterDropdown label="сеттинг" options={settingsPool} selected={settingFilter} onToggle={v=>toggle(setSettingFilter,v)} align="right"/>
          <button type="button" onClick={()=>setHasPartsFilter(v=>!v)} className={hasPartsFilter?"primary-action":"ghost-action"} title="Есть детали" style={{flexShrink:0}}><FiPackage/></button>
          <CopyFilteredButton items={filtered} align="right"/>
          {hasActiveSearch&&<button type="button" onClick={resetAll} className="ghost-action" style={{whiteSpace:"nowrap",color:DNG,borderColor:DNG}}>✕ сбросить</button>}
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,alignContent:"flex-start"}}>
        {filtered.length===0&&<div style={{color:T2,fontSize:12,padding:20}}>{hasActiveSearch?"Ничего не найдено":"Начните поиск или выберите фильтр, чтобы увидеть предметы"}</div>}
        {filtered.map(it=><ItemCard key={it.uid} item={it} onOpen={setOpenItem}/>)}
      </div>
    </div>
  );
}

function OfferConstructor(){
  const [offers,setOffers]=useState([
    {id:1,label:"Offer 1",price:9.99,items:[]},
    {id:2,label:"Offer 2",price:9.99,items:[]},
    {id:3,label:"Offer 3",price:9.99,items:[]}
  ]);

  const upd=(idx,o)=>setOffers(p=>p.map((x,i)=>i===idx?o:x));
  const rm=id=>setOffers(p=>p.filter(x=>x.id!==id));
  const add=()=>setOffers(p=>[...p,{id:_offerIdCounter++,label:`Offer ${p.length+1}`,price:9.99,items:[]}]);
  const dup=o=>setOffers(p=>[...p,{...o,id:_offerIdCounter++,label:o.label+" (copy)",items:o.items.map(i=>({...i}))}]);
  const filled=offers.filter(o=>o.items.length>0);

  return (<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:9,color:T2}}>{CATALOG.length} items · {offers.length} offers</div>
      <button onClick={add} style={{padding:"6px 14px",background:A,color:"#000",border:"none",borderRadius:10,cursor:"pointer",fontSize:11,fontWeight:800}}>+ New Offer</button>
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-start"}}>
      {offers.map((o,idx)=><OCard key={o.id} offer={o} onUpdate={u=>upd(idx,u)} onRemove={rm} onDuplicate={dup}/>)}
    </div>
    {filled.length>1 && (
      <div style={{marginTop:12,padding:14,background:STRIPE,borderRadius:14,border:`1px solid ${BRD}`}}>
        <div style={{fontSize:11,fontWeight:700,color:T1,marginBottom:10}}>Compare</div>
        <div style={{display:"flex",gap:16,alignItems:"end"}}>
          {filled.map(o=>{
            const tv=o.items.reduce((s,it)=>s+iv(it.catItem,it.qty),0);
            const d=tv>0?((1-o.price/tv)*100):0;
            return (
              <div key={o.id} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:800,color:d>50?DNG:A}}>{d.toFixed(1)}%</div>
                <div style={{height:Math.max(d*1.4,8),background:d>50?DNG:A,borderRadius:"4px 4px 0 0",opacity:0.85,marginTop:3}}/>
                <div style={{fontSize:10,color:T1,marginTop:4,fontWeight:600}}>{o.label}</div>
                <div style={{fontSize:9,color:T2}}>${o.price}</div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>);
}

function OCard({offer,onUpdate,onRemove,onDuplicate}){
  const [pick,setPick]=useState(false);
  const [search,setSearch]=useState("");
  const [catF,setCatF]=useState("All");
  const tv=offer.items.reduce((s,it)=>s+iv(it.catItem,it.qty),0);
  const disc=tv>0?((1-offer.price/tv)*100):0;
  const over50=disc>50;
  const addItem=c=>{const ex=offer.items.find(i=>i.catItem.name===c.name);if(ex)onUpdate({...offer,items:offer.items.map(i=>i.catItem.name===c.name?{...i,qty:i.qty+(c.unit||1)}:i)});else onUpdate({...offer,items:[...offer.items,{catItem:c,qty:c.unit||1}]})};
  const updQ=(i,v)=>{const n=[...offer.items];n[i]={...n[i],qty:Math.max(0,v)};onUpdate({...offer,items:n.filter(x=>x.qty>0)})};
  const rmI=i=>onUpdate({...offer,items:offer.items.filter((_,j)=>j!==i)});
  const filt=CATALOG.filter(c=>(catF==="All"||c.cat===catF)&&(!search||c.name.toLowerCase().includes(search.toLowerCase())));
  const ib={background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:8,color:T1,padding:"4px 8px",fontSize:12,outline:"none"};

  return (
    <div style={{background:STRIPE,width:280,borderRadius:14,border:`1px solid ${BRD}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${BRD}`,display:"flex",alignItems:"center"}}>
        <input value={offer.label} onChange={e=>onUpdate({...offer,label:e.target.value})} style={{...ib,flex:1,fontSize:14,fontWeight:800,background:"transparent",border:"none",padding:"2px 0"}}/>
        <div onClick={()=>onDuplicate(offer)} style={{width:24,height:24,background:"rgba(255,255,255,0.06)",border:`1px solid ${BRD}`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginRight:4,fontSize:10}}>📋</div>
        <div onClick={()=>onRemove(offer.id)} style={{width:24,height:24,background:A,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#000",fontWeight:900,fontSize:11}}>X</div>
      </div>
      <div style={{padding:"8px 12px",background:SRF,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:T2,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Price</span>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:18,fontWeight:900,color:A}}>$</span>
          <input type="number" value={offer.price} step={0.01} min={0} onChange={e=>onUpdate({...offer,price:parseFloat(e.target.value)||0})} style={{...ib,width:70,fontSize:18,fontWeight:900,color:A,textAlign:"right"}}/>
        </div>
      </div>
      <div style={{padding:"4px 12px",overflowY:"auto",maxHeight:180}}>
        {offer.items.length===0 && <div style={{color:T2,fontSize:11,textAlign:"center",padding:16,opacity:0.6}}>Empty — add items ↓</div>}
        {offer.items.map((it,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<offer.items.length-1?`1px solid ${BRD}22`:"none"}}>
            <span onClick={()=>rmI(i)} style={{cursor:"pointer",color:"#555",fontSize:10}}>✕</span>
            <div style={{width:3,height:14,background:A,borderRadius:2}}/>
            <span style={{flex:1,fontSize:11,color:T1,fontWeight:500}}>{it.catItem.name}</span>
            <input type="number" value={it.qty} min={1} step={it.catItem.unit||1} onChange={e=>updQ(i,parseInt(e.target.value)||0)} style={{...ib,width:56,fontSize:11,textAlign:"center",padding:"2px 4px"}}/>
            <span style={{fontSize:10,color:T2,fontFamily:"monospace",width:48,textAlign:"right"}}>${iv(it.catItem,it.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"4px 12px 8px"}}>
        <button onClick={()=>setPick(!pick)} style={{width:"100%",padding:6,background:pick?SRF:"transparent",border:`1px dashed ${pick?A:BRD}`,borderRadius:8,cursor:"pointer",fontSize:11,color:pick?A:T2,fontWeight:600}}>{pick?"Hide catalog ▲":"+ Add item"}</button>
      </div>
      {pick && (
        <div style={{padding:"6px 12px 10px",background:"#1a1a20",borderTop:`1px solid ${BRD}`,maxHeight:180,overflowY:"auto"}}>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...ib,width:"100%",fontSize:11,marginBottom:5,boxSizing:"border-box"}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
            {["All",...CATS].map(c=>(
              <button key={c} onClick={()=>setCatF(c)} style={{padding:"2px 8px",borderRadius:20,fontSize:9,cursor:"pointer",fontWeight:600,background:catF===c?A:"transparent",color:catF===c?"#000":T2,border:`1px solid ${catF===c?A:BRD}`}}>{c}</button>
            ))}
          </div>
          {filt.map((c,j)=>(
            <div key={j} onClick={()=>addItem(c)} style={{display:"flex",justifyContent:"space-between",padding:"5px 6px",cursor:"pointer",borderRadius:6,fontSize:11,color:T1}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{c.name}</span>
              <span style={{color:T2}}>{c.unit?`$1${c.uLabel}`:`$${c.price}`}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{padding:"10px 12px",background:SRF,borderTop:`1px solid ${BRD}`,borderRadius:"0 0 14px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:T2}}>Total value</span>
          <span style={{color:T1,fontWeight:600}}>${tv.toFixed(2)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
          <span style={{color:T2,fontSize:11}}>Discount</span>
          <span style={{fontSize:18,fontWeight:900,color:over50?DNG:A}}>{disc.toFixed(1)}%{over50?" ⚠️":""}</span>
        </div>
        <div style={{marginTop:6,height:4,background:BRD,borderRadius:2}}>
          <div style={{width:`${Math.min(Math.max(disc,0),100)}%`,height:"100%",background:over50?`linear-gradient(90deg,${A},${DNG})`:A,borderRadius:2,transition:"width .3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginTop:2}}>
          <span style={{color:"#555"}}>0%</span>
          <span style={{color:DNG,fontWeight:600}}>50%</span>
          <span style={{color:"#555"}}>100%</span>
        </div>
      </div>
    </div>
  );
}

function IconLibraryPicker({onSelect,onClose}){
  const [files,setFiles]=useState([]);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState("");
  useEffect(()=>{
    let live=true;
    window.iconLibrary?.list().then(list=>{if(live){setFiles(Array.isArray(list)?list:[]);setLoading(false)}}).catch(()=>{if(live)setLoading(false)});
    return()=>{live=false};
  },[]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const list=q?files.filter(f=>f.toLowerCase().includes(q)):files;
    return list.slice(0,300);
  },[files,query]);
  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:60}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(760px,100%)"}}>
        <header><div><span>ICON LIBRARY</span><h2>выбор иконки</h2></div><button onClick={onClose}><FiX/></button></header>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="поиск по имени файла, например tag предмета…" autoFocus style={{width:"100%",boxSizing:"border-box",marginBottom:12,padding:"10px 12px",background:"#1a1a20",border:`1.5px solid ${A}`,borderRadius:2,color:T1,fontSize:13,outline:"none"}}/>
        {loading&&<div style={{color:T2,fontSize:12,padding:20,textAlign:"center"}}>Загружаем библиотеку…</div>}
        {!loading&&files.length===0&&<div style={{color:T2,fontSize:12,padding:20,textAlign:"center"}}>Библиотека иконок пуста — достуупна только в собранном приложении</div>}
        {!loading&&files.length>0&&<>
          <div style={{fontSize:10,color:T2,marginBottom:8}}>{filtered.length}{filtered.length>=300?"+":""} из {files.length}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:8,maxHeight:420,overflowY:"auto"}}>
            {filtered.map(f=>(
              <button key={f} type="button" onClick={()=>onSelect(`/icons-items/${f}`)} title={f} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:6,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
                <img src={`/icons-items/${f}`} alt="" loading="lazy" style={{width:48,height:48,objectFit:"contain"}}/>
                <span style={{fontSize:8,color:T2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",textAlign:"center"}}>{f.replace(/_icon1?_big\.(png|webp|jpg|jpeg|gif)$/i,"")}</span>
              </button>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}

function SettingPicker({value,pool,onChange,allowCreate=true}){
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState("");
  const boxRef=useRef(null);
  const selected=useMemo(()=>new Set(String(value||"").split(",").map(s=>s.trim()).filter(Boolean)),[value]);
  useEffect(()=>{
    if(!open)return;
    const onDocClick=e=>{if(boxRef.current&&!boxRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onDocClick);
    return()=>document.removeEventListener("mousedown",onDocClick);
  },[open]);
  const commit=next=>onChange([...next].join(", "));
  const toggle=name=>{const next=new Set(selected);next.has(name)?next.delete(name):next.add(name);commit(next)};
  const addNew=()=>{
    const name=draft.trim();
    if(!name)return;
    const next=new Set(selected);
    next.add(name);
    commit(next);
    setDraft("");
  };
  return (
    <div ref={boxRef} style={{position:"relative"}}>
      <button type="button" onClick={()=>setOpen(v=>!v)} style={{width:"100%",textAlign:"left",background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,color:selected.size?T1:T2,fontSize:13,padding:"9px 12px",cursor:"pointer"}}>
        {selected.size?[...selected].join(", "):"Выбрать сеттинг…"}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:30,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,padding:8,maxHeight:320,overflowY:"auto",overscrollBehavior:"contain",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          {pool.length===0&&<div style={{fontSize:11,color:T2,marginBottom:8}}>Пока нет сеттингов</div>}
          {pool.map(name=>(
            <div key={name} onClick={()=>toggle(name)} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 2px",cursor:"pointer"}}>
              <input type="checkbox" checked={selected.has(name)} onChange={()=>toggle(name)} onClick={e=>e.stopPropagation()} style={{width:14,height:14,flexShrink:0,accentColor:A,margin:0}}/>
              <span style={{flex:1,textAlign:"left",fontSize:12,fontWeight:400,textTransform:"none",color:selected.has(name)?A:T1}}>{name}</span>
            </div>
          ))}
          {allowCreate&&(
            <div style={{display:"flex",gap:6,marginTop:8,borderTop:`1px solid ${BRD}`,paddingTop:8}}>
              <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addNew()}}} placeholder="новый сеттинг…" style={{flex:1,background:"#111",border:`1px solid ${BRD}`,borderRadius:2,color:T1,fontSize:12,padding:"5px 8px",outline:"none"}}/>
              <button type="button" onClick={addNew} className="icon-upload">+ New</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsManager({settingsList,onSettingsListChange,items,onItemsChange}){
  const [newName,setNewName]=useState("");
  const [renaming,setRenaming]=useState(null);
  const [renameDraft,setRenameDraft]=useState("");
  const pool=useMemo(()=>{
    const used=items.flatMap(i=>String(i.setting||"").split(",").map(s=>s.trim()).filter(Boolean));
    return [...new Set([...(settingsList||[]),...used])].sort();
  },[items,settingsList]);
  const addSetting=()=>{
    const name=newName.trim();
    if(!name||pool.includes(name))return;
    onSettingsListChange([...(settingsList||[]),name]);
    setNewName("");
  };
  const commitRename=oldName=>{
    const next=renameDraft.trim();
    setRenaming(null);
    if(!next||next===oldName)return;
    onSettingsListChange((settingsList||[]).filter(s=>s!==oldName).concat(next));
    onItemsChange(items.map(it=>{
      const list=String(it.setting||"").split(",").map(s=>s.trim()).filter(Boolean);
      if(!list.includes(oldName))return it;
      return {...it,setting:[...new Set(list.map(s=>s===oldName?next:s))].join(", ")};
    }));
  };
  const removeSetting=name=>{
    if(!window.confirm(`удалить сеттинг «${name}»? Он будет снят у всех предметов.`))return;
    onSettingsListChange((settingsList||[]).filter(s=>s!==name));
    onItemsChange(items.map(it=>{
      const list=String(it.setting||"").split(",").map(s=>s.trim()).filter(Boolean);
      if(!list.includes(name))return it;
      return {...it,setting:list.filter(s=>s!==name).join(", ")};
    }));
  };
  return (
    <div style={{marginBottom:12,padding:10,background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2}}>
      <div style={{fontSize:10,color:T2,textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>Сеттинги</div>
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8,maxHeight:160,overflowY:"auto"}}>
        {pool.length===0&&<div style={{fontSize:11,color:T2}}>Пока нет сеттингов</div>}
        {pool.map(name=>(
          <div key={name} style={{display:"flex",alignItems:"center",gap:6}}>
            {renaming===name?(
              <input autoFocus value={renameDraft} onChange={e=>setRenameDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")commitRename(name);if(e.key==="Escape")setRenaming(null)}} onBlur={()=>commitRename(name)} style={{flex:1,background:"#111",border:`1px solid ${A}`,borderRadius:2,color:T1,fontSize:12,padding:"3px 6px",outline:"none"}}/>
            ):(
              <span style={{flex:1,fontSize:12,color:T1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
            )}
            <button type="button" onClick={()=>{setRenaming(name);setRenameDraft(name)}} title="Переименовать" style={{background:"transparent",border:"none",color:T2,cursor:"pointer",fontSize:12,padding:2,flexShrink:0}}>✎</button>
            <button type="button" onClick={()=>removeSetting(name)} title="удалить" style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:12,padding:2,flexShrink:0}}>✕</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addSetting()}}} placeholder="новый сеттинг…" style={{flex:1,background:"#111",border:`1px solid ${BRD}`,borderRadius:2,color:T1,fontSize:12,padding:"5px 8px",outline:"none"}}/>
        <button type="button" onClick={addSetting} className="icon-upload">+ New</button>
      </div>
    </div>
  );
}

function ItemCatalogPanel({items,onItemsChange,onSwitchMode,onClose,settingsList=[],onSettingsListChange,focusRequest}){
  const [selId,setSelId]=useState(()=>focusRequest?.uid||null);
  useEffect(()=>{if(focusRequest?.uid)setSelId(focusRequest.uid)},[focusRequest]);
  const [tierStatus,setTierStatus]=useState("");
  const [listQuery,setListQuery]=useState("");
  const [libraryOpen,setLibraryOpen]=useState(false);
  const [collapsedTypes,setCollapsedTypes]=useState(()=>new Set());
  const toggleType=type=>setCollapsedTypes(prev=>{const next=new Set(prev);next.has(type)?next.delete(type):next.add(type);return next});
  const iconInput=useRef(null);
  const eventIconInput=useRef(null);
  const sel=items.find(i=>i.uid===selId)||null;
  const settingsPool=useMemo(()=>{
    const used=items.flatMap(i=>String(i.setting||"").split(",").map(s=>s.trim()).filter(Boolean));
    return [...new Set([...(settingsList||[]),...used])].sort();
  },[items,settingsList]);
  const visibleItems=useMemo(()=>{
    const q=listQuery.trim().toLowerCase();
    if(!q)return items;
    return items.filter(i=>[i.name,i.sheetName,i.id,i.tag].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,listQuery]);
  const groupedByType=useMemo(()=>{
    const map=new Map();
    visibleItems.forEach(i=>{
      const key=i.type||"Без типа";
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(i);
    });
    const ordered=[...ITEM_TYPES.filter(t=>map.has(t)),...[...map.keys()].filter(k=>!ITEM_TYPES.includes(k))];
    return ordered.map(type=>[type,map.get(type)]);
  },[visibleItems]);
  useEffect(()=>{setTierStatus("")},[selId]);
  const update=patch=>onItemsChange(items.map(i=>i.uid===selId?{...i,...patch}:i));
  const addItem=()=>{
    const created={uid:`item-${Date.now()}`,id:"",parts:"",tag:"",name:"Новый предмет",type:ITEM_TYPES[0],rarity:ITEM_RARITIES[0],setting:"",lastSale:"",saleLocation:"",tier:"",sheetType:"",sheetRarity:"",sheetName:"",sheetLethality:"",sheetPrevalence:"",icon:"",eventIcon:""};
    onItemsChange([...items,created]);setSelId(created.uid);
  };
  const removeItem=()=>{onItemsChange(items.filter(i=>i.uid!==selId));setSelId(null)};
  const [importStatus,setImportStatus]=useState("");
  const importFromSheet=async()=>{
    if(!window.workspaceCatalog){setImportStatus("Синхронизация недоступна вне приложения");return}
    setImportStatus("Читаем таблицу и папку с иконками…");
    try{
      const result=await window.workspaceCatalog.syncFromXlsx();
      if(result?.skipped){setImportStatus("Файл таблицы не найден в data/PG3D_Items_by_Category_Name_Tag_Id.xlsx");return}
      if(result?.error){setImportStatus("Ошибка чтения таблицы: "+result.error);return}
      const fresh=await window.workspaceStore.read("items");
      if(Array.isArray(fresh))onItemsChange(fresh);
      setImportStatus(`Добавлено: ${result?.added||0}, удалено: ${result?.removed||0}, иконок: ${result?.iconsFilled||0} (всего: ${result?.total??items.length}) | debug: строк в таблице=${result?.debug?.xlsxRows}, отмечено как «из таблицы» задним числом=${result?.debug?.markedExisting}`);
    }catch(e){setImportStatus("Ошибка импорта: "+e.message)}
  };
  const [namesStatus,setNamesStatus]=useState("");
  const syncRealNames=async()=>{
    if(!window.workspaceCatalog){setNamesStatus("Синхронизация недоступна вне приложения");return}
    setNamesStatus("Читаем ItemsDataStorage.asset и Language_English.prefab…");
    try{
      const result=await window.workspaceCatalog.syncRealNames();
      const fresh=await window.workspaceStore.read("items");
      if(Array.isArray(fresh))onItemsChange(fresh);
      setNamesStatus(`Найдено оружия с именем: ${result?.matched||0}, обновлено записей: ${result?.updated||0} (всего в каталоге: ${result?.total??items.length})`);
    }catch(e){setNamesStatus("Ошибка: "+e.message+" — проверь, что диск Z: с проектом игры подключён")}
  };
  const pickIcon=event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>update({icon:String(reader.result)});reader.readAsDataURL(file);event.target.value=""};
  const pickEventIcon=event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>update({eventIcon:String(reader.result)});reader.readAsDataURL(file);event.target.value=""};
  const refreshTier=async()=>{
    if(!sel)return;
    if(!sel.tag){setTierStatus("Укажите tag");return}
    setTierStatus("Получаем данные из Weapon Analytics…");
    try{
      const info=await window.workspaceGoogle?.fetchTier(sel.tag);
      update({tier:info?.tier||"",sheetType:info?.type||"",sheetRarity:info?.rarity||"",sheetLethality:info?.lethality||"",sheetPrevalence:info?.prevalence||""});
      setTierStatus(info?.tier||info?.type||info?.rarity?`найдено: tier ${info?.tier||"—"}, type ${info?.type||"—"}, rarity ${info?.rarity||"—"}`:"Не найдено в таблице");
    }catch(e){setTierStatus("Ошибка: "+e.message)}
  };
  return <>
    <aside className="settings-nav">
      <div className="settings-title">Настройки</div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button type="button" onClick={onSwitchMode} style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${BRD}`,background:"transparent",color:T2,fontSize:11,cursor:"pointer"}}>Навигация</button>
        <button type="button" style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${A}`,background:A,color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Каталог</button>
      </div>
      <SettingsManager settingsList={settingsList} onSettingsListChange={onSettingsListChange} items={items} onItemsChange={onItemsChange}/>
      <input value={listQuery} onChange={e=>setListQuery(e.target.value)} placeholder="Поиск по названию, id или tag…" style={{width:"100%",boxSizing:"border-box",marginBottom:8,padding:"8px 10px",background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:2,color:T1,fontSize:12,outline:"none"}}/>
      <button className="settings-add" onClick={addItem}><FiPlus/>Добавить предмет</button>
      <button className="settings-add" onClick={importFromSheet} style={{marginTop:6}}>Обновить из таблицы</button>
      {importStatus&&<div style={{fontSize:11,color:T2,padding:"4px 2px"}}>{importStatus}</div>}
      <button className="settings-add" onClick={syncRealNames} style={{marginTop:6}}>Обновить названия (Unity)</button>
      {namesStatus&&<div style={{fontSize:11,color:T2,padding:"4px 2px"}}>{namesStatus}</div>}
      <div className="settings-list">{groupedByType.map(([type,groupItems])=>{
        const collapsed=collapsedTypes.has(type);
        return (
          <Fragment key={type}>
            <GroupHeader label={type} count={groupItems.length} collapsed={collapsed} onToggle={()=>toggleType(type)}/>
            {!collapsed&&groupItems.map(i=><button key={i.uid} className={i.uid===selId?"active":""} onClick={()=>setSelId(i.uid)}>{i.icon?<TintedIcon src={i.icon} className="settings-item-icon"/>:<span className="settings-item-dot"/>}<span>{effectiveName(i)||"Без названия"}</span><FiChevronRight/></button>)}
          </Fragment>
        );
      })}{visibleItems.length===0&&<div style={{padding:"10px 4px",color:T2,fontSize:11}}>Ничего не найдено</div>}</div>
    </aside>
    <section className="settings-editor">
      <header><div><span>Каталог предметов</span><h2>{sel?effectiveName(sel)||"Без названия":"Выберите предмет"}</h2></div><button className="settings-close" aria-label="Закрыть настройки" onClick={onClose}><FiX/></button></header>
      {sel&&<div className="settings-card">
        <label>Название<input value={sel.name} onChange={e=>update({name:e.target.value})} placeholder={sel.sheetName?`${sel.sheetName} (из таблицы)`:"Название"}/></label>
        {sel.type==="Event"?(
          <label>ID валюты<input value={sel.id} onChange={e=>update({id:e.target.value})}/></label>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <label>ID<input value={sel.id} onChange={e=>update({id:e.target.value})}/></label>
            <label>Parts<input value={sel.parts} onChange={e=>update({parts:e.target.value})} placeholder="none"/></label>
          </div>
        )}
        <label>Tag (для поиска и подтягивания tier)<input value={sel.tag} onChange={e=>update({tag:e.target.value})} onBlur={refreshTier} placeholder="совпадает с колонкой E в Weapon Analytics"/></label>
        <label>Тип<select value={sel.type} onChange={e=>update({type:e.target.value})}>{ITEM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        <label>Сеттинг<SettingPicker value={sel.setting} pool={settingsPool} onChange={val=>update({setting:val})} allowCreate={false}/></label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label>{sel.type==="Event"?"Дата последнего запуска":"Дата последней продажи"}<input type="date" value={sel.lastSale||""} onChange={e=>update({lastSale:e.target.value})}/></label>
          <label>{sel.type==="Event"?"Тип ивента":"Место продажи"}<select value={sel.saleLocation||""} onChange={e=>update({saleLocation:e.target.value})}><option value="">—</option>{SALE_LOCATIONS.map(s=><option key={s} value={s}>{SALE_LOCATION_LABEL[s]}</option>)}</select></label>
        </div>
        <label>Иконка<div className="icon-field">{sel.icon?<TintedIcon src={sel.icon} className="icon-preview image"/>:<span className="icon-preview empty">+</span>}<span className="icon-file-name">{sel.icon?"текущая иконка":"None"}</span><button type="button" className="icon-upload" onClick={()=>setLibraryOpen(true)}>Из библиотеки</button><button type="button" className="icon-upload" onClick={()=>iconInput.current?.click()}>Своё изображение</button>{sel.icon&&<button type="button" className="icon-upload" onClick={()=>update({icon:""})}>None</button>}<input ref={iconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={pickIcon}/></div></label>
        {sel.type==="Event"&&<label>Иконка 64×64 (только в открытой карточке в Подборе Контента)<div className="icon-field">{sel.eventIcon?<img src={sel.eventIcon} alt="" style={{width:64,height:64,objectFit:"contain",borderRadius:4,background:"#1a1a20"}}/>:<span className="icon-preview empty">+</span>}<span className="icon-file-name">{sel.eventIcon?"текущая иконка":"None"}</span><button type="button" className="icon-upload" onClick={()=>eventIconInput.current?.click()}>Своё изображение</button>{sel.eventIcon&&<button type="button" className="icon-upload" onClick={()=>update({eventIcon:""})}>None</button>}<input ref={eventIconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={pickEventIcon}/></div></label>}
        {libraryOpen&&<IconLibraryPicker onSelect={path=>{update({icon:path,iconName:""});setLibraryOpen(false)}} onClose={()=>setLibraryOpen(false)}/>}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button type="button" className="icon-upload" onClick={refreshTier}>Обновить tier/type/rarity</button>
          <span style={{fontSize:11,color:T2}}>{tierStatus||(sel.tier||sel.sheetType||sel.sheetRarity?`текущие: tier ${sel.tier||"—"}, type ${sel.sheetType||"—"}, rarity ${sel.sheetRarity||"—"}`:"данные из таблицы не указаны")}</span>
        </div>
        <button className="danger-button" onClick={removeItem}><FiTrash2/>удалить предмет</button>
      </div>}
    </section>
  </>;
}

function ToolsTab({initialTool="offers",hideSelector=false,items=[],settingsList=[],onOpenLottery,onOpenCardRoulette,onOpenItemSettings,pendingOfferId,onOpenOfferCampaign}){
  const [activeTool,setActiveTool]=useState(initialTool);
  useEffect(()=>setActiveTool(initialTool),[initialTool]);
  return (
    <div className="tools-page" style={{height:"100%",background:BG,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div className="tools-feature-header">
        <div><span>PROBABILITY LAB</span><h1>{activeTool==="content"?"Подбор Контента":activeTool==="lootbox"?"Lootbox Simulator":activeTool==="lottery"?"Lottery Simulator":activeTool==="cardroulette"?"Card Roulette":activeTool==="personalevent"?"Personal Event":"Offer Constructor"}</h1></div>
        <div style={{flex:1}}/>
        {!hideSelector&&<div style={{display:"flex",background:BG,borderRadius:20,padding:3,border:`1px solid ${BRD}`}}>
          {[["content","Подбор Контента"],["offers","Offer Constructor"],["lootbox","Lootbox Sim"],["lottery","Lottery Sim"],["cardroulette","Card Roulette"],["personalevent","Personal Event"]].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTool(k)} style={{padding:"6px 16px",borderRadius:18,fontSize:11,fontWeight:700,fontFamily:ZZZ,fontStyle:"italic",cursor:"pointer",border:"none",background:activeTool===k?A:"transparent",color:activeTool===k?"#000":T2,transition:"all .2s"}}>{l}</button>
          ))}
        </div>}
      </div>
      <div style={{flex:1,position:"relative"}}>
        <div style={{position:"absolute",inset:0,overflowY:"auto",padding:"0 24px 24px"}}>
          <div style={{display:activeTool==="content"?"block":"none"}}><ContentPicker items={items} settingsList={settingsList} onOpenLottery={onOpenLottery} onOpenCardRoulette={onOpenCardRoulette} onOpenItemSettings={onOpenItemSettings}/></div>
          <div style={{display:activeTool==="offers"?"flex":"none",flexDirection:"column",height:"100%",paddingTop:18,boxSizing:"border-box"}}><GameOffersConstructor pendingOfferId={pendingOfferId} onOpenCampaign={onOpenOfferCampaign}/></div>
          <div style={{display:activeTool==="lootbox"?"block":"none",paddingTop:18}}><LootboxSimulator/></div>
          <div style={{display:activeTool==="lottery"?"block":"none",paddingTop:18}}><LotterySimulator/></div>
          <div style={{display:activeTool==="cardroulette"?"block":"none",paddingTop:18}}><CardRouletteSimulator/></div>
          <div style={{display:activeTool==="personalevent"?"block":"none",paddingTop:18}}><PersonalEventSimulator/></div>
        </div>
      </div>
    </div>
  );
}

/* Legacy Electron-less dashboard shell (LegacyDashboard, CalendarTab, NavBar, BoardsTab, LinkGrid,
   InternalBrowser, BrowserTabs, MIRO_BOARDS) removed 2026-08-26: superseded by AppShell/webview
   architecture and no longer referenced anywhere in this file. */

const LINK_ICON_BY_NAME={
  "Trader Van":"/icons/hugeicons--van.png","LootBoxes":"/icons/memory--chest-fill.png","Offers":"/icons/circum--shopping-tag.png","Localization":"/icons/cil--language.png","Lottery":"/icons/pixelarticons--key-solid.png","Balance":"/icons/game-icons--ray-gun.png","Event Center":"/icons/ri--calendar-line.png","Card Roulette":"/icons/material-symbols--cards-star-sharp.png","Main Store":"/icons/uil--shop.png","Attributes":"/icons/carbon--attribute-definition.png","Pers. Events":"/icons/carbon--task-progress.png","Temp. Events":"/icons/material-symbols--event-list-outline-sharp.png","AB Test":"/icons/mdi--ab-testing.png","Exp Open":"/icons/streamline-ultimate--arrow-double-up-bold.png","Map List":"/icons/griddy-icons--map.png","Clan War":"/icons/game-icons--battle-tank.png","ADS Roulette":"/icons/material-symbols--shop-outline.png","Clan Chests":"/icons/ant-design--gold-filled.png","GameModeHub":"/icons/ri--layout-6-line.png","Tournament":"/icons/solar--cup-star-bold.png","Bots":"/icons/solar--bot-bold.png","Rotation":"/icons/material-symbols--screen-rotation-up-sharp.png",
  "График ивентов — Google Sheets":"/icons/grommet-icons--schedule.png","Tableau":"/icons/cib--tableau.png","PG3D.Admin":"/icons/eos-icons--admin.png","Appsheet":"/icons/arcticons--appsheet.png","GitLab":"/icons/mdi--gitlab.png","Claude":"/icons/mingcute--claude-line.png","Content Sheet":"/icons/streamline-sharp--hand-held-tablet-drawing.png","Calculator":"/icons/hugeicons--calculator.png","Configs Archive":"/icons/mdi--archive-outline.png","Aghanim":"/icons/mdi--letter-a-box-outline.png","Content Plan":"/icons/selfhst--google-sheets-light.png","Notion":"/icons/mage--notion.png","Translator":"/icons/garden--translation-exists-fill-16.png","Figma":"/icons/solar--figma-bold.png","Confluence":"/icons/devicon-plain--confluence.png","Weapon Analytics":"/icons/grommet-icons--analytics.png","Distribution&Trends":"/icons/healthicons--spreadsheets-outline.png"
};
const linkIcon=item=>LINK_ICON_BY_NAME[item.name]||item.icon;

const APP_SECTIONS=[
  {id:"dashboard",label:"Дашборд",icon:"tasks",builtIn:true,items:[
    {id:"events",label:"График ивентов",tabIcon:"▦"},{id:"tasks",label:"Мои задачи",tabIcon:"◆"},{id:"notes",label:"Заметки",tabIcon:"▤"}
  ]},
  {id:"configs",label:"Конфиги",icon:"config",builtIn:true,items:CONFIGS.map((item,index)=>({id:`config-${index}`,label:item.name,url:item.url,icon:linkIcon(item)}))},
  {id:"files",label:"Файлы",icon:"home",builtIn:true,items:FILES.map((item,index)=>({id:item.url===SHEETS_URL?"event-sheet":`file-${index}`,label:item.name,url:item.url,icon:linkIcon(item)}))},
  {id:"tools",label:"Инструменты",icon:"tools",builtIn:true,items:[
    {id:"content",label:"Подбор Контента"},{id:"offers",label:"Offer Constructor"},{id:"lootbox",label:"Lootbox Simulator"},{id:"lottery",label:"Lottery Simulator"},{id:"cardroulette",label:"Card Roulette"},{id:"personalevent",label:"Personal Event"}
  ]},
];

const PAGE_TITLES={tasks:"Мои задачи",events:"График ивентов",notes:"Заметки",content:"Подбор Контента",offers:"Offer Constructor",lootbox:"Lootbox Simulator",lottery:"Lottery Simulator",cardroulette:"Card Roulette",personalevent:"Personal Event"};
const PAGE_SECTIONS={tasks:"dashboard",events:"dashboard",notes:"dashboard",content:"tools",offers:"tools",lootbox:"tools",lottery:"tools",cardroulette:"tools",personalevent:"tools"};

function normalizeNavigation(source){
  const saved=Array.isArray(source)?source:[];
  const byId=new Map(saved.filter(section=>section?.id!=="boards").map(section=>[section.id,section]));
  const applyLinkIcons=items=>items.map(item=>({...item,icon:item.iconName?item.icon:(LINK_ICON_BY_NAME[item.label]||item.icon)}));
  return APP_SECTIONS.map(defaultSection=>{
    const previous=byId.get(defaultSection.id);
    if(!previous)return JSON.parse(JSON.stringify(defaultSection));
    if(defaultSection.id==="dashboard")return{...previous,items:defaultSection.items};
    if(defaultSection.id==="files"){
      const items=Array.isArray(previous.items)?previous.items:[];
      const legacySheet=defaultSection.items[0];
      const merged=items.some(item=>item.url===SHEETS_URL)?items:[legacySheet,...items];
      return{...previous,items:applyLinkIcons(merged)};
    }
    if(defaultSection.id==="tools"){
      const items=Array.isArray(previous.items)?previous.items:[];
      const byItemId=new Map(items.map(entry=>[entry.id,entry]));
      const merged=defaultSection.items.map(def=>byItemId.get(def.id)||def);
      const extras=items.filter(entry=>!defaultSection.items.some(def=>def.id===entry.id));
      return{...previous,items:[...merged,...extras]};
    }
    return{...previous,items:applyLinkIcons(Array.isArray(previous.items)?previous.items:defaultSection.items)};
  });
}

function loadNavigation(){
  try{const saved=JSON.parse(localStorage.getItem("pg3d-navigation-v1"));if(Array.isArray(saved)&&saved.length)return normalizeNavigation(saved)}catch(e){/* defaults */}
  return normalizeNavigation(APP_SECTIONS);
}

function SectionIcon({value,color="#b7b7bd",size=17}){
  if(value?.startsWith("/")||value?.startsWith("http")||value?.startsWith("data:"))return <TintedIcon src={value} className="nav-icon-image"/>;
  return <Icon type={["home","tasks","config","boards","tools"].includes(value)?value:"home"} color={color} sz={size}/>;
}

function TintedIcon({src,className=""}){
  return <span className={`tinted-icon ${className}`} style={{"--icon-image":`url("${src}")`}} aria-hidden="true"/>;
}

function GroupsManager({groups=[],onGroupsChange,items=[],onItemsChange}){
  const [newName,setNewName]=useState("");
  const [renaming,setRenaming]=useState(null);
  const [renameDraft,setRenameDraft]=useState("");
  const addGroup=()=>{
    const label=newName.trim();
    if(!label)return;
    onGroupsChange([...(groups||[]),{id:`group-${Date.now()}`,label}]);
    setNewName("");
  };
  const commitRename=id=>{
    const label=renameDraft.trim();
    setRenaming(null);
    if(!label)return;
    onGroupsChange((groups||[]).map(g=>g.id===id?{...g,label}:g));
  };
  const removeGroup=id=>{
    const g=(groups||[]).find(x=>x.id===id);
    if(!g)return;
    if(!window.confirm(`Удалить группу «${g.label}»? Элементы останутся, но станут без группы.`))return;
    onGroupsChange((groups||[]).filter(x=>x.id!==id));
    onItemsChange((items||[]).map(it=>it.groupId===id?{...it,groupId:null}:it));
  };
  return (
    <div className="settings-card">
      <label>Новая группа<div style={{display:"flex",gap:8}}><input style={{flex:1}} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addGroup()}}} placeholder="Название группы"/><button type="button" onClick={addGroup} className="icon-upload">Добавить</button></div></label>
      {(groups||[]).length>0&&<div className="settings-items">{(groups||[]).map(g=>(
        <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          {renaming===g.id?(
            <input autoFocus value={renameDraft} onChange={e=>setRenameDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")commitRename(g.id);if(e.key==="Escape")setRenaming(null)}} onBlur={()=>commitRename(g.id)} style={{flex:1}}/>
          ):(
            <b style={{flex:1,color:T1,fontSize:13}}>{g.label}</b>
          )}
          <button type="button" onClick={()=>{setRenaming(g.id);setRenameDraft(g.label)}} className="icon-upload">Переименовать</button>
          <button type="button" onClick={()=>removeGroup(g.id)} className="icon-upload" style={{color:DNG}}>Удалить</button>
        </div>
      ))}</div>}
    </div>
  );
}

function InnerNavButton({item,isActive,onClick}){
  return <button className={isActive?"inner-button active":"inner-button"} onClick={onClick}>{item.icon?<TintedIcon src={item.icon} className="inner-item-icon"/>:<span className="inner-dot"/>}{item.label}</button>;
}

function GroupHeader({label,count,collapsed,onToggle}){
  return (
    <div role="button" tabIndex={0} onClick={onToggle} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onToggle()}}}
      style={{width:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"transparent",color:T2,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,cursor:"pointer",userSelect:"none"}}>
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,flexShrink:0,transform:collapsed?"rotate(-90deg)":"none",transition:"transform .15s",fontSize:15,lineHeight:1,color:T1}}>▾</span>
      <span style={{flex:1,textAlign:"left"}}>{label}</span>
      <span style={{opacity:.6,flexShrink:0}}>{count}</span>
    </div>
  );
}

function SettingsPanel({navigation,onChange,onClose,items,onItemsChange,settingsList,onSettingsListChange,focusRequest}){
  const [panelMode,setPanelMode]=useState(focusRequest?"catalog":"nav");
  useEffect(()=>{if(focusRequest)setPanelMode("catalog")},[focusRequest]);
  const [sectionId,setSectionId]=useState(()=>navigation[0]?.id);
  const [itemId,setItemId]=useState(null);
  const [showSymbols,setShowSymbols]=useState(false);
  const sectionIconInput=useRef(null);
  const itemIconInput=useRef(null);
  const section=navigation.find(s=>s.id===sectionId)||navigation[0];
  const item=section?.items?.find(i=>i.id===itemId)||null;
  useEffect(()=>{if(section&&!navigation.some(s=>s.id===sectionId)){setSectionId(navigation[0]?.id);setItemId(null)}},[navigation,sectionId]);
  const updateSection=patch=>onChange(navigation.map(s=>s.id===section.id?{...s,...patch}:s));
  const updateItem=patch=>updateSection({items:section.items.map(i=>i.id===item.id?{...i,...patch}:i)});
  const addSection=()=>{const created={id:`custom-section-${Date.now()}`,label:"Новый раздел",icon:"home",builtIn:false,items:[]};onChange([...navigation,created]);setSectionId(created.id);setItemId(null)};
  const removeSection=()=>{if(section?.builtIn)return;const next=navigation.filter(s=>s.id!==section.id);onChange(next);setSectionId(next[0]?.id);setItemId(null)};
  const addItem=()=>{const created={id:`custom-item-${Date.now()}`,label:"Новый файл",url:"https://",icon:"",tabIcon:"📄"};updateSection({items:[...(section.items||[]),created]});setItemId(created.id)};
  const removeItem=()=>{updateSection({items:section.items.filter(i=>i.id!==item.id)});setItemId(null)};
  const pickIcon=(event,apply)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>apply({icon:String(reader.result),iconName:file.name});reader.readAsDataURL(file);event.target.value=""};
  const unicodeSymbols=["◇","◆","●","○","■","□","★","☆","✓","⚡","⚙","🔧","📄","📁","📊","📋","🗓","🧩","🎯","🛠","🚀","💡","🔗","🌐","🎮","🎲","💎","🏠","🔔","⏱"];
  if(panelMode==="catalog")return <div className="settings-page"><ItemCatalogPanel items={items} onItemsChange={onItemsChange} onSwitchMode={()=>setPanelMode("nav")} onClose={onClose} settingsList={settingsList} onSettingsListChange={onSettingsListChange} focusRequest={focusRequest}/></div>;
  return <div className="settings-page">
    <aside className="settings-nav">
      <div className="settings-title">Настройки</div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button type="button" style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${A}`,background:A,color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Навигация</button>
        <button type="button" onClick={()=>setPanelMode("catalog")} style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${BRD}`,background:"transparent",color:T2,fontSize:11,cursor:"pointer"}}>Каталог</button>
      </div>
      <button className="settings-add" onClick={addSection}><FiPlus/>Добавить раздел</button>
      <div className="settings-list">{navigation.map(s=><button key={s.id} className={s.id===section?.id?"active":""} onClick={()=>{setSectionId(s.id);setItemId(null)}}><SectionIcon value={s.icon} size={15}/><span>{s.label}</span><FiChevronRight/></button>)}</div>
    </aside>
    <section className="settings-editor">
      <header><div><span>Персонализация</span><h2>{item?item.label:section?.label}</h2></div><button className="settings-close" aria-label="Закрыть настройки" onClick={onClose}><FiX/></button></header>
      {!item&&section&&<>
        <div className="settings-card">
          <label>Название раздела<input value={section.label} onChange={e=>updateSection({label:e.target.value})}/></label>
          <label>Иконка<div className="icon-field"><span className="icon-preview"><SectionIcon value={section.icon}/></span><span className="icon-file-name">{section.iconName||"Текущая иконка"}</span><button type="button" className="icon-upload" onClick={()=>sectionIconInput.current?.click()}>Выбрать изображение</button><input ref={sectionIconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={e=>pickIcon(e,updateSection)}/></div></label>
          {!section.builtIn&&<button className="danger-button" onClick={removeSection}><FiTrash2/>Удалить раздел</button>}
        </div>
        <div className="settings-section-head"><div><h3>Файлы и страницы</h3><span>{section.items.length} элементов</span></div><button onClick={addItem}><FiPlus/>Добавить файл</button></div>
        <GroupsManager groups={section.groups} onGroupsChange={groups=>updateSection({groups})} items={section.items} onItemsChange={groupedItems=>updateSection({items:groupedItems})}/>
        <div className="settings-items">{section.items.map(i=><button key={i.id} onClick={()=>setItemId(i.id)}>{i.icon?<TintedIcon src={i.icon} className="settings-item-icon"/>:<span className="settings-item-dot"/>}<span><b>{i.label}</b><small>{i.url||"Встроенная страница"}</small></span><FiChevronRight/></button>)}</div>
      </>}
      {item&&<>
        <button className="settings-back" onClick={()=>setItemId(null)}><FiArrowLeft/>{section.label}</button>
        <div className="settings-card">
          <label>Название<input value={item.label} onChange={e=>updateItem({label:e.target.value})}/></label>
          <label>Ссылка<input value={item.url||""} disabled={!item.url&&section.builtIn} onChange={e=>updateItem({url:e.target.value})} placeholder="https://..."/></label>
          {section.groups?.length>0&&<label>Группа<select value={item.groupId||""} onChange={e=>updateItem({groupId:e.target.value||null})}><option value="">Без группы</option>{section.groups.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}</select></label>}
          <label>Иконка<div className="icon-field">{item.icon?<TintedIcon src={item.icon} className="icon-preview image"/>:<span className="icon-preview empty">+</span>}<span className="icon-file-name">{item.iconName||(item.icon?"Текущая иконка":"Не выбрана")}</span><button type="button" className="icon-upload" onClick={()=>itemIconInput.current?.click()}>Выбрать изображение</button><input ref={itemIconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={e=>pickIcon(e,updateItem)}/></div></label>
          <label>Мини-иконка вкладки<div className="unicode-field">{item.icon?<div className="tab-icon-linked"><TintedIcon src={item.icon} className="tab-image-icon"/>Используется иконка ссылки</div>:<button type="button" className="unicode-trigger" onClick={()=>setShowSymbols(value=>!value)}><span>{item.tabIcon||getTabIcon(item.label)}</span>Выбрать символ</button>}{showSymbols&&!item.icon&&<div className="unicode-picker">{unicodeSymbols.map(symbol=><button type="button" key={symbol} className={item.tabIcon===symbol?"active":""} onClick={()=>{updateItem({tabIcon:symbol});setShowSymbols(false)}}>{symbol}</button>)}</div>}</div></label>
          {item.url&&<button className="danger-button" onClick={removeItem}><FiTrash2/>Удалить файл</button>}
        </div>
      </>}
    </section>
  </div>;
}

function WindowControls(){
  const [maximized,setMaximized]=useState(false);
  useEffect(()=>{
    const api=window.desktopWindow;if(!api)return;
    api.isMaximized().then(setMaximized);
    return api.onMaximizedChange(setMaximized);
  },[]);
  const api=()=>window.desktopWindow;
  return <div className="window-controls">
    <button aria-label="Свернуть" onClick={()=>api()?.minimize()}><VscChromeMinimize/></button>
    <button aria-label={maximized?"Восстановить":"Развернуть"} onClick={()=>api()?.toggleMaximize()}>{maximized?<VscChromeRestore/>:<VscChromeMaximize/>}</button>
    <button className="window-close" aria-label="Закрыть" onClick={()=>api()?.close()}><VscChromeClose/></button>
  </div>;
}

function migrateWorkspace(saved){
  const source=saved?.tabs?.length?saved.tabs:[{id:"page-tasks",type:"page",page:"tasks",title:PAGE_TITLES.tasks}];
  const tabs=source.filter(tab=>tab.section!=="boards").map(tab=>tab.page==="tracker"?{...tab,id:"page-notes",page:"notes",title:"Заметки",tabIcon:"▤"}:tab);
  const safeTabs=tabs.length?tabs:[{id:"page-tasks",type:"page",page:"tasks",title:PAGE_TITLES.tasks}];
  return{tabs:safeTabs,activeId:safeTabs.some(tab=>tab.id===saved?.activeId)?saved.activeId:safeTabs[0].id};
}

function loadWorkspace(){
  try{
    const saved=JSON.parse(localStorage.getItem("pg3d-workspace-v2"));
    if(saved?.tabs?.length)return migrateWorkspace(saved);
  }catch(e){/* use defaults */}
  return migrateWorkspace(null);
}

function OnboardingScreen({googleConnected,jiraConfigured,onGoogleConnected,onJiraDone,onSkipJira}){
  const [googleBusy,setGoogleBusy]=useState(false);
  const [googleError,setGoogleError]=useState("");
  const connectGoogle=()=>{
    setGoogleBusy(true);setGoogleError("");
    window.workspaceGoogle.connect().then(()=>{setGoogleBusy(false);onGoogleConnected()}).catch(e=>{setGoogleBusy(false);setGoogleError(e.message)});
  };
  return (
    <div style={{position:"fixed",inset:0,background:BG,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{width:400,maxWidth:"90%"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:3,height:18,background:A}}/><div style={{fontSize:18,fontWeight:900,fontFamily:ZZZ,color:T1,letterSpacing:1,textTransform:"uppercase"}}>PG3D Workspace</div></div>
        <div style={{fontSize:11,color:T2,marginBottom:20,lineHeight:1.5}}>Один раз войдите в сервисы — дальше приложение запомнит вас на этом компьютере.</div>
        <div style={{marginBottom:14,padding:16,background:SRF,border:`1px solid ${googleConnected?"#22C55E":BRD}`,borderLeft:`3px solid ${googleConnected?"#22C55E":A}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:googleConnected?0:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T1,flex:1,textTransform:"uppercase",letterSpacing:0.5}}>Google</div>
            {googleConnected && <span style={{fontSize:11,color:"#22C55E",fontWeight:700}}>Подключено ✓</span>}
          </div>
          {!googleConnected && <>
            <div style={{fontSize:11,color:T2,marginBottom:10,lineHeight:1.5}}>Нужен доступ к Google Sheets для записи конфигов. Откроется окно входа в браузере.</div>
            {googleError && <div style={{fontSize:11,color:DNG,marginBottom:8}}>{googleError}</div>}
            <button onClick={connectGoogle} disabled={googleBusy} style={{padding:"8px 16px",background:A,border:"none",borderRadius:0,color:"#000",fontSize:12,fontWeight:800,cursor:googleBusy?"wait":"pointer"}}>{googleBusy?"Ожидание авторизации...":"Войти через Google"}</button>
          </>}
        </div>
        <div style={{padding:jiraConfigured?16:0,background:SRF,border:`1px solid ${jiraConfigured?"#22C55E":BRD}`,borderLeft:`3px solid ${jiraConfigured?"#22C55E":A}`}}>
          {jiraConfigured
            ? <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:12,fontWeight:700,color:T1,flex:1,textTransform:"uppercase",letterSpacing:0.5}}>Jira</div><span style={{fontSize:11,color:"#22C55E",fontWeight:700}}>Подключено ✓</span></div>
            : <>
              <JiraSetupForm onDone={onJiraDone}/>
              <div style={{padding:"0 24px 16px"}}><button onClick={onSkipJira} style={{padding:0,background:"transparent",border:"none",color:T2,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Настроить позже</button></div>
            </>
          }
        </div>
      </div>
    </div>
  );
}

function AppShell(){
  if(typeof window!=="undefined")window.__PG3D_DESKTOP_SHELL__=true;
  const initial=useMemo(loadWorkspace,[]);
  const [tabs,setTabs]=useState(initial.tabs);
  const [activeId,setActiveId]=useState(initial.activeId);
  const [navigation,setNavigation]=useState(loadNavigation);
  const [items,setItems]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem("pg3d-items-v1"));return Array.isArray(saved)?saved:[]}catch(e){return[]}});
  const [settingsList,setSettingsList]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem("pg3d-settings-v1"));return Array.isArray(saved)?saved:[]}catch(e){return[]}});
  const [selectedSection,setSelectedSection]=useState("dashboard");
  const [settingsRequest,setSettingsRequest]=useState(null);
  const [draggingTab,setDraggingTab]=useState(null);
  const [collapsedGroups,setCollapsedGroups]=useState(()=>new Set());
  const toggleGroup=id=>setCollapsedGroups(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next});
  const [storeReady,setStoreReady]=useState(!window.workspaceStore);
  const [onboarding,setOnboarding]=useState(null);
  const [jiraSkipped,setJiraSkipped]=useState(false);
  useEffect(()=>{
    Promise.all([
      window.workspaceGoogle?.getStatus?.().catch(()=>({connected:false}))||Promise.resolve({connected:false}),
      window.workspaceJira?.getStatus?.().catch(()=>({configured:false}))||Promise.resolve({configured:false}),
    ]).then(([g,j])=>setOnboarding({google:!!g.connected,jira:!!j.configured}));
  },[]);
  const tabsScrollRef=useRef(null);
  const active=tabs.find(t=>t.id===activeId)||tabs[0];
  const activeSection=selectedSection;
  const isSettingsActive=active?.type==="settings";
  useEffect(()=>{if(activeId&&active)setSelectedSection(active.type==="page"?PAGE_SECTIONS[active.page]:(active.section||"files"))},[activeId]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!window.workspaceStore)return;
      const [savedNavigation,savedWorkspace,savedItems,savedSettings]=await Promise.all([window.workspaceStore.read("navigation"),window.workspaceStore.read("workspace"),window.workspaceStore.read("items"),window.workspaceStore.read("settings")]);
      if(cancelled)return;
      if(Array.isArray(savedNavigation)&&savedNavigation.length)setNavigation(normalizeNavigation(savedNavigation));
      else await window.workspaceStore.write("navigation",navigation);
      if(Array.isArray(savedItems))setItems(savedItems);
      else await window.workspaceStore.write("items",items);
      if(Array.isArray(savedSettings))setSettingsList(savedSettings);
      else await window.workspaceStore.write("settings",settingsList);
      if(savedWorkspace?.tabs?.length){const migrated=migrateWorkspace(savedWorkspace);setTabs(migrated.tabs);setActiveId(migrated.activeId)}
      else await window.workspaceStore.write("workspace",{tabs,activeId});
      setStoreReady(true);
    })().catch(error=>{console.error("Failed to load workspace settings",error);setStoreReady(true)});
    return()=>{cancelled=true};
  },[]);
  useEffect(()=>{
    if(!window.workspaceStore?.onItemsUpdated)return;
    return window.workspaceStore.onItemsUpdated(()=>{
      window.workspaceStore.read("items").then(fresh=>{if(Array.isArray(fresh))setItems(fresh)}).catch(console.error);
    });
  },[]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-workspace-v2",JSON.stringify({tabs,activeId}))}catch{/* Electron file storage remains authoritative */}window.workspaceStore?.write("workspace",{tabs,activeId}).catch(console.error)},[tabs,activeId,storeReady]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-navigation-v1",JSON.stringify(navigation))}catch{/* selected images can exceed the browser quota */}window.workspaceStore?.write("navigation",navigation).catch(console.error)},[navigation,storeReady]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-items-v1",JSON.stringify(items))}catch{/* selected images can exceed the browser quota */}window.workspaceStore?.write("items",items).catch(console.error)},[items,storeReady]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-settings-v1",JSON.stringify(settingsList))}catch{/* ignore quota */}window.workspaceStore?.write("settings",settingsList).catch(console.error)},[settingsList,storeReady]);
  useEffect(()=>setTabs(prev=>prev.map(tab=>{for(const section of navigation){const item=section.items.find(i=>i.id===(tab.sourceItemId||tab.page));if(item)return{...tab,title:item.label,url:item.url||tab.url,section:section.id,icon:item.icon||null,tabIcon:item.tabIcon||tab.tabIcon}}return tab})),[navigation]);

  const openPage=(page,tabIcon)=>{
    const id=`page-${page}`;
    setTabs(prev=>prev.some(t=>t.id===id)?prev:[...prev,{id,type:"page",page,title:PAGE_TITLES[page],tabIcon}]);
    setActiveId(id);
  };
  const openLottery=()=>{
    openPage("lottery");
  };
  const openCardRoulette=()=>{
    openPage("cardroulette");
  };
  const [pendingOfferId,setPendingOfferId]=useState(null);
  const openOffer=(offerId)=>{
    setPendingOfferId({id:offerId,nonce:Date.now()});
    openPage("offers");
  };
  const [pendingCampaignOffer,setPendingCampaignOffer]=useState(null);
  const openOfferCampaign=(offerId)=>{
    setPendingCampaignOffer({offerId,nonce:Date.now()});
    openPage("events");
  };
  const openSettingsTab=()=>{
    const id="page-settings";
    setTabs(prev=>prev.some(t=>t.id===id)?prev:[...prev,{id,type:"settings",title:"Настройки",tabIcon:"⚙"}]);
    setActiveId(id);
  };
  const openItemSettings=(item)=>{
    setSettingsRequest({uid:item.uid,nonce:Date.now()});
    openSettingsTab();
  };
  const openIn=(url,title,section=selectedSection,sourceItemId=null,tabIcon=null,icon=null)=>{
    const existing=tabs.find(t=>t.type==="web"&&(sourceItemId?t.sourceItemId===sourceItemId:t.title===title));
    if(existing){setActiveId(existing.id);return}
    const id=`web-${Date.now()}`;
    setTabs(prev=>[...prev,{id,type:"web",url,title,section,sourceItemId,tabIcon,icon}]);setActiveId(id);
  };
  const selectSection=(section)=>{setSelectedSection(section.id);setActiveId(null)};
  const selectTab=(tab)=>{setActiveId(tab.id);setSelectedSection(tab.type==="page"?PAGE_SECTIONS[tab.page]:(tab.section||"files"))};
  const openSidebarItem=(item)=>item.url?openIn(item.url,item.label,selectedSection,item.id,item.tabIcon,item.icon):openPage(item.id,item.tabIcon);
  const closeTab=(id)=>{
    setTabs(prev=>{
      const index=prev.findIndex(t=>t.id===id);const next=prev.filter(t=>t.id!==id);
      if(id===activeId)setActiveId(next[Math.min(index,next.length-1)]?.id||null);
      return next;
    });
  };
  const moveTabOver=(overId)=>{
    if(!draggingTab||draggingTab===overId)return;
    setTabs(prev=>{const from=prev.findIndex(t=>t.id===draggingTab),to=prev.findIndex(t=>t.id===overId);if(from<0||to<0)return prev;const next=[...prev];const [moved]=next.splice(from,1);next.splice(to,0,moved);return next});
  };
  const scrollTabs=direction=>tabsScrollRef.current?.scrollBy({left:direction*320,behavior:"smooth"});
  const renderTab=tab=>{
    if(tab.type==="settings")return <SettingsPanel navigation={navigation} onChange={setNavigation} onClose={()=>closeTab(tab.id)} items={items} onItemsChange={setItems} settingsList={settingsList} onSettingsListChange={setSettingsList} focusRequest={settingsRequest}/>;
    if(tab.type==="web")return <webview className="workspace-frame" src={tab.url} partition="persist:pg3d-workspace" allowpopups="true"/>;
    if(tab.page==="tasks")return <div className="task-shell"><TasksTab openIn={openIn} activeSection={0}/></div>;
    if(tab.page==="events")return <EventCalendar onOpenOffer={openOffer} pendingCampaignOffer={pendingCampaignOffer}/>;
    if(tab.page==="notes")return <NotesPage/>;
    return <ToolsTab initialTool={tab.page} hideSelector items={items} settingsList={settingsList} onOpenLottery={openLottery} onOpenCardRoulette={openCardRoulette} onOpenItemSettings={openItemSettings} pendingOfferId={pendingOfferId} onOpenOfferCampaign={openOfferCampaign}/>;
  };

  if(onboarding&&(!onboarding.google||(!onboarding.jira&&!jiraSkipped))){
    return <OnboardingScreen
      googleConnected={onboarding.google}
      jiraConfigured={onboarding.jira}
      onGoogleConnected={()=>setOnboarding(o=>({...o,google:true}))}
      onJiraDone={()=>setOnboarding(o=>({...o,jira:true}))}
      onSkipJira={()=>setJiraSkipped(true)}
    />;
  }

  return <div className="desktop-app">
    <aside className="app-sidebar">
      <div className="app-brand"><img className="brand-mark" src="/icons/pg3d-512.png" alt="PG3D Dashboard"/><div><b>PG3D</b><span>Workspace</span></div></div>
      <nav className="section-nav">
        {navigation.map(section=><button key={section.id} className={activeSection===section.id&&!isSettingsActive?"section-button active":"section-button"} onClick={()=>selectSection(section)}><SectionIcon value={section.icon} color={activeSection===section.id?A:"#b7b7bd"}/><span>{section.label}</span></button>)}
      </nav>
      <div className="sidebar-divider"/>
      <div className="section-caption">{navigation.find(s=>s.id===activeSection)?.label||"Содержимое"}</div>
      <div className="inner-nav">
        {(()=>{
          const activeNavSection=navigation.find(s=>s.id===activeSection);
          const navItems=activeNavSection?.items||[];
          const navGroups=activeNavSection?.groups||[];
          const isActiveItem=item=>(active?.page===item.id||active?.title===item.label)&&activeId&&!isSettingsActive;
          const handleClick=item=>{openSidebarItem(item)};
          if(!navGroups.length)return navItems.map(item=><InnerNavButton key={item.id} item={item} isActive={isActiveItem(item)} onClick={()=>handleClick(item)}/>);
          const byGroup=new Map(navGroups.map(g=>[g.id,[]]));
          const ungrouped=[];
          navItems.forEach(item=>{
            if(item.groupId&&byGroup.has(item.groupId))byGroup.get(item.groupId).push(item);
            else ungrouped.push(item);
          });
          return <>
            {navGroups.map(g=>{
              const groupItems=byGroup.get(g.id)||[];
              const collapsed=collapsedGroups.has(g.id);
              return (
                <Fragment key={g.id}>
                  <GroupHeader label={g.label} count={groupItems.length} collapsed={collapsed} onToggle={()=>toggleGroup(g.id)}/>
                  {!collapsed&&groupItems.map(item=><InnerNavButton key={item.id} item={item} isActive={isActiveItem(item)} onClick={()=>handleClick(item)}/>)}
                </Fragment>
              );
            })}
            {ungrouped.map(item=><InnerNavButton key={item.id} item={item} isActive={isActiveItem(item)} onClick={()=>handleClick(item)}/>)}
          </>;
        })()}
      </div>
      <div className="sidebar-footer"><span className="status-dot"/><span>Локальное приложение</span><button className={isSettingsActive?"sidebar-settings active":"sidebar-settings"} aria-label="Настройки" onClick={openSettingsTab}><FiSettings/></button></div>
    </aside>
    <main className="app-main">
      <header className="workspace-tabs" onDoubleClick={()=>window.desktopWindow?.toggleMaximize()}>
        <div ref={tabsScrollRef} className="tabs-scroll" onWheel={e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();tabsScrollRef.current.scrollLeft+=e.deltaY}}}>{tabs.map(tab=><button key={tab.id} draggable className={`${tab.id===activeId?"workspace-tab active":"workspace-tab"}${draggingTab===tab.id?" dragging":""}`} onDragStart={e=>{setDraggingTab(tab.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",tab.id)}} onDragOver={e=>{e.preventDefault();moveTabOver(tab.id)}} onDragEnd={()=>setDraggingTab(null)} onClick={()=>selectTab(tab)}><MdDragIndicator className="tab-grip"/>{tab.icon?<TintedIcon src={tab.icon} className="tab-image-icon"/>:<span className="tab-symbol">{tab.tabIcon||(tab.type==="web"?getTabIcon(tab.title):"◇")}</span>}<span>{tab.title}</span><i onClick={e=>{e.stopPropagation();closeTab(tab.id)}}>×</i></button>)}</div>
        <div className="tabs-scroll-controls"><button aria-label="Прокрутить вкладки влево" onClick={()=>scrollTabs(-1)}><FiChevronLeft/></button><button aria-label="Прокрутить вкладки вправо" onClick={()=>scrollTabs(1)}><FiChevronRight/></button></div>
        <div className="window-drag"/>
        <WindowControls/>
      </header>
      <section className="workspace-content">
        <div className="workspace-stack">
          {tabs.map(tab=><div key={tab.id} className={tab.id===activeId?"tab-surface active":"tab-surface"}>{renderTab(tab)}</div>)}
          {!activeId&&<div className="empty-workspace"><div>{["configs","boards","files"].includes(selectedSection)?"Выбери файл":"Выбери страницу"}</div></div>}
        </div>
      </section>
    </main>
  </div>;
}

export default AppShell;
