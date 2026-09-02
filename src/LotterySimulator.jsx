import { useState, useCallback, useEffect } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";

const uid=()=>Math.random().toString(36).slice(2,8);
const mkItem=(group,label,drop,weight,craft)=>({id:uid(),group,label,drop,weight,craft,category:"Gun",itemType:"Parts",alternativeReward:"",showInPreview:false,itemSubtype:""});
const CATEGORY_OPTIONS=["Gun","Royale","Currency"];
const ITEM_TYPE_OPTIONS=["Parts","Gun","Royale","Currency"];
const palette=["#D8FA00","#00D4AA","#FF6B8A","#8B5CF6","#F59E0B","#06B6D4","#EC4899","#84CC16","#F97316","#6366F1"];
function getGroupColors(items){const gs=[...new Set(items.map(i=>i.group).filter(Boolean))];const m={};gs.forEach((g,i)=>{m[g]=palette[i%palette.length]});return m}

function simulateMC(items,simCount,keyCost){
  const ai=items.filter(i=>i.weight>0);
  const gs=[...new Set(items.map(i=>i.group).filter(Boolean))];
  const gc={};for(const it of items)if(it.group&&it.craft>0)gc[it.group]=it.craft;
  const tg=gs.filter(g=>gc[g]>0);
  const ar=[];
  for(let r=0;r<simCount;r++){
    const col={};tg.forEach(g=>col[g]=0);const ca={};const done=new Set();let op=0;
    while(done.size<tg.length&&op<2000){
      const pool=ai.filter(i=>!i.group||!done.has(i.group));
      const tw=pool.reduce((s,i)=>s+i.weight,0);if(tw===0)break;
      let roll=Math.random()*tw;let ch=pool[0];
      for(const it of pool){roll-=it.weight;if(roll<=0){ch=it;break}}
      op++;
      if(ch.group&&col[ch.group]!==undefined){
        col[ch.group]=Math.min(gc[ch.group],col[ch.group]+ch.drop);
        if(col[ch.group]>=gc[ch.group]&&!done.has(ch.group)){done.add(ch.group);ca[ch.group]=op*keyCost}
      }
    }
    ar.push(ca);
  }
  const stats={};
  for(const g of tg){
    const v=ar.map(r=>r[g]||2000*keyCost).sort((a,b)=>a-b);
    stats[g]={median:v[Math.floor(v.length*0.5)],mean:(v.reduce((s,x)=>s+x,0)/v.length).toFixed(1),p10:v[Math.floor(v.length*0.1)],p90:v[Math.floor(v.length*0.9)]};
  }
  const tots=ar.map(r=>{const v=tg.map(g=>r[g]||2000*keyCost);return v.length?Math.max(...v):0}).sort((a,b)=>a-b);
  stats._total={median:tots[Math.floor(tots.length*0.5)],mean:(tots.reduce((s,x)=>s+x,0)/tots.length).toFixed(1),p10:tots[Math.floor(tots.length*0.1)],p90:tots[Math.floor(tots.length*0.9)]};
  const hb={};for(const v of tots)hb[v]=(hb[v]||0)+1;
  return {stats,histBuckets:hb,simCount,trackGroups:tg};
}

function simulateSingle(items,maxOpens,keyCost){
  const ai=items.filter(i=>i.weight>0);
  const gs=[...new Set(items.map(i=>i.group).filter(Boolean))];
  const gc={};for(const it of items)if(it.group&&it.craft>0)gc[it.group]=it.craft;
  const tg=gs.filter(g=>gc[g]>0);
  const col={};tg.forEach(g=>col[g]=0);const done=new Set();const log=[];
  for(let i=0;i<maxOpens;i++){
    const pool=ai.filter(it=>!it.group||!done.has(it.group));
    const tw=pool.reduce((s,it)=>s+it.weight,0);if(tw===0)break;
    let roll=Math.random()*tw;let ch=pool[0];
    for(const it of pool){roll-=it.weight;if(roll<=0){ch=it;break}}
    let crafted=false;
    if(ch.group&&col[ch.group]!==undefined){
      col[ch.group]=Math.min(gc[ch.group],col[ch.group]+ch.drop);
      if(col[ch.group]>=gc[ch.group]&&!done.has(ch.group)){done.add(ch.group);crafted=true}
    }
    log.push({open:i+1,keys:(i+1)*keyCost,label:ch.label,group:ch.group,drop:ch.drop,progress:ch.group&&gc[ch.group]?col[ch.group]:null,craft:ch.group?gc[ch.group]:null,crafted,allDone:done.size>=tg.length});
  }
  return {log,collected:{...col},trackGroups:tg,groupCraft:gc};
}

function parseTarget(str){
  if(!str)return null;
  const clean=str.replace(/[~≈]/g,"").trim();
  const m=clean.match(/(\d+)\s*[–\-—]\s*(\d+)/);
  if(m)return {lo:parseInt(m[1]),hi:parseInt(m[2])};
  const n=parseInt(clean);
  if(!isNaN(n))return {lo:n,hi:n};
  return null;
}

function autoBalance(items,targets,keyCost,simCount=5000,maxIter=80){
  const groups=[...new Set(items.map(i=>i.group).filter(Boolean))];
  const gc={};for(const it of items)if(it.group&&it.craft>0)gc[it.group]=it.craft;
  const tg=groups.filter(g=>gc[g]>0);
  const targetMap={};
  for(const t of targets){const p=parseTarget(t.target);if(p&&tg.includes(t.group))targetMap[t.group]=p}
  if(Object.keys(targetMap).length===0)return null;

  const newItems=items.map(i=>({...i}));
  for(const it of newItems){if(it.group&&targetMap[it.group]&&it.weight===0)it.weight=1}

  const redistributeGroup=(g)=>{
    const gItems=newItems.filter(i=>i.group===g&&i.weight>0);
    if(gItems.length<2)return;
    const totalW=gItems.reduce((s,i)=>s+i.weight,0);
    const craftVal=gc[g]||250;
    const raw=gItems.map(i=>{const ratio=i.drop/craftVal;return 1/Math.pow(ratio,1.2)});
    const rawSum=raw.reduce((s,v)=>s+v,0);
    gItems.forEach((it,i)=>{it.weight=Math.max(0.1,(raw[i]/rawSum)*totalW)});
  };

  for(const g of Object.keys(targetMap))redistributeGroup(g);

  let bestItems=newItems.map(i=>({...i}));
  let bestScore=Infinity;

  for(let iter=0;iter<maxIter;iter++){
    const res=simulateMC(newItems,simCount,keyCost);
    let score=0;
    let allGood=true;
    for(const g of Object.keys(targetMap)){
      const s=res.stats[g];if(!s)continue;
      const {lo,hi}=targetMap[g];
      const mid=(lo+hi)/2;
      const dist=Math.abs(s.median-mid)/mid;
      score+=dist;
      if(s.median<lo||s.median>hi){
        allGood=false;
        const ratio=s.median/mid;
        const damp=dist>0.3?0.5:dist>0.1?0.35:0.2;
        const factor=Math.pow(ratio,damp);
        const gItems=newItems.filter(i=>i.group===g);
        for(const it of gItems)it.weight=Math.max(0.1,it.weight*factor);
      }
    }
    if(score<bestScore){bestScore=score;bestItems=newItems.map(i=>({...i}))}
    if(allGood)break;
  }

  for(let i=0;i<newItems.length;i++)newItems[i].weight=bestItems[i].weight;

  const minW=Math.min(...newItems.filter(i=>i.weight>0).map(i=>i.weight));
  const scale=minW>0?1/minW:1;
  for(const it of newItems){if(it.weight>0)it.weight=Math.max(1,Math.round(it.weight*scale));else it.weight=0}

  const verify=simulateMC(newItems,10000,keyCost);
  return {items:newItems,stats:verify.stats,trackGroups:verify.trackGroups};
}

const inp={background:BG,border:`1px solid ${BRD}`,borderRadius:2,color:T1,padding:"7px 9px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
const In=({value,onChange,style,...p})=>(<input value={value} onChange={e=>onChange(e.target.value)} onFocus={e=>e.target.select()} style={{...inp,...style}} {...p}/>);

/* ─── Chest config ─── */
function ChestRow({chest,onChange,onRemove}){
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:`1px solid ${BRD}22`}}>
      <In value={chest.name} onChange={v=>onChange({...chest,name:v})} style={{flex:1,fontSize:12}} placeholder="Chest name"/>
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        <span style={{fontSize:10,color:T2}}>🔑</span>
        <In value={chest.keyCost} onChange={v=>onChange({...chest,keyCost:Math.max(0,Number(v)||0)})} type="text" inputMode="numeric" style={{width:40,textAlign:"center",fontSize:12}}/>
      </div>
      <div onClick={onRemove} style={{width:20,height:20,background:A,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#000",fontWeight:700,fontSize:11,flexShrink:0}}>×</div>
    </div>
  );
}

const defaultItems=()=>[
  mkItem("T4 Weapon","T4 ×50",50,4,250),mkItem("T4 Weapon","T4 ×125",125,12,250),mkItem("T4 Weapon","T4 ×250",250,8,250),
  mkItem("T3 Weapon","T3 ×50",50,6,250),mkItem("T3 Weapon","T3 ×125",125,8,250),mkItem("T3 Weapon","T3 ×250",250,3,250),
  mkItem("T2 Weapon","T2 ×50",50,10,250),mkItem("T2 Weapon","T2 ×125",125,5,250),mkItem("T2 Weapon","T2 ×250",250,1,250),
  mkItem("T1 Weapon","T1 ×50",50,8,250),mkItem("T1 Weapon","T1 ×125",125,2,250),mkItem("T1 Weapon","T1 ×250",250,0,250),
  mkItem("","Gems",150,1,0),
];

const smallChestItems=()=>[
  mkItem("avatar","101",1,400,1),
  mkItem("mythic_1","102",1,45,250),
  mkItem("mythic_2","103",1,90,250),
  mkItem("mythic_3","104",1,110,250),
  mkItem("mythic_4","105",2,1160,250),
  mkItem("mythic_5","106",2,1190,250),
  mkItem("legendary_1","107",2,1290,250),
  mkItem("legendary_2","108",2,1320,250),
  mkItem("legendary_3","109",2,1460,250),
  mkItem("epic_1","110",3,1600,250),
  mkItem("rare_1","111",3,400,250),
  mkItem("cosmetic","112",1,600,1),
  mkItem("mythic_1","113",3,12,250),
  mkItem("mythic_2","114",3,32,250),
  mkItem("mythic_3","115",3,62,250),
  mkItem("mythic_4","116",3,90,250),
  mkItem("mythic_5","117",3,140,250),
  mkItem("legendary_1","118",3,200,250),
  mkItem("legendary_2","119",3,250,250),
  mkItem("legendary_3","120",3,300,250),
  mkItem("epic_1","121",5,550,250),
  mkItem("rare_1","122",7,9000,250),
  mkItem("Gems","123",5,1,0),
];

const mediumChestItems=()=>[
  mkItem("avatar","201",1,400,1),
  mkItem("mythic_1","202",5,45,250),
  mkItem("mythic_2","203",5,90,250),
  mkItem("mythic_3","204",5,110,250),
  mkItem("mythic_4","205",10,1160,250),
  mkItem("mythic_5","206",10,1190,250),
  mkItem("legendary_1","207",10,1290,250),
  mkItem("legendary_2","208",10,1320,250),
  mkItem("legendary_3","209",10,1460,250),
  mkItem("epic_1","210",10,1600,250),
  mkItem("rare_1","211",10,1000,250),
  mkItem("cosmetic","212",1,600,1),
  mkItem("mythic_1","213",15,10,250),
  mkItem("mythic_2","214",15,30,250),
  mkItem("mythic_3","215",15,60,250),
  mkItem("mythic_4","216",25,90,250),
  mkItem("mythic_5","217",25,120,250),
  mkItem("legendary_1","218",25,170,250),
  mkItem("legendary_2","219",25,210,250),
  mkItem("legendary_3","220",25,279,250),
  mkItem("epic_1","221",25,520,250),
  mkItem("rare_1","222",35,9500,250),
  mkItem("Gems","223",30,1,0),
];

const bigChestItems=()=>[
  mkItem("avatar","301",1,100,1),
  mkItem("mythic_1","302",25,150,250),
  mkItem("mythic_2","303",25,200,250),
  mkItem("mythic_3","304",25,250,250),
  mkItem("mythic_4","305",25,1000,250),
  mkItem("mythic_5","306",25,1200,250),
  mkItem("legendary_1","307",25,1500,250),
  mkItem("legendary_2","308",25,2000,250),
  mkItem("legendary_3","309",25,2500,250),
  mkItem("epic_1","310",25,3000,250),
  mkItem("rare_1","311",25,50,250),
  mkItem("cosmetic","312",1,150,1),
  mkItem("mythic_1","313",50,35,250),
  mkItem("mythic_2","314",50,45,250),
  mkItem("mythic_3","315",50,55,250),
  mkItem("mythic_4","316",50,100,250),
  mkItem("mythic_5","317",50,110,250),
  mkItem("legendary_1","318",50,200,250),
  mkItem("legendary_2","319",50,300,250),
  mkItem("legendary_3","320",50,400,250),
  mkItem("epic_1","321",50,600,250),
  mkItem("rare_1","322",50,200,250),
  mkItem("cosmetic","323",1,100,1),
  mkItem("mythic_1","324",75,10,250),
  mkItem("mythic_2","325",75,15,250),
  mkItem("mythic_3","326",75,20,250),
  mkItem("mythic_4","327",75,35,250),
  mkItem("mythic_5","328",75,55,250),
  mkItem("legendary_1","329",75,75,250),
  mkItem("legendary_2","330",75,100,250),
  mkItem("legendary_3","331",75,140,250),
  mkItem("epic_1","332",75,160,250),
  mkItem("rare_1","333",100,16000,250),
  mkItem("Gems","334",150,1,0),
];

const superChestItems=()=>[
  mkItem("mythic_1","401",1,1000,1),
  mkItem("mythic_2","402",1,1000,1),
  mkItem("mythic_3","403",1,1000,1),
  mkItem("mythic_4","404",1,1000,1),
  mkItem("mythic_5","405",1,1000,1),
  mkItem("legendary_1","406",1,1000,1),
  mkItem("legendary_2","407",1,1000,1),
  mkItem("legendary_3","408",1,1000,1),
  mkItem("epic_1","409",1,1000,1),
  mkItem("rare_1","410",1,1000,1),
  mkItem("weapon_11","411",1,1000,1),
  mkItem("weapon_12","412",1,1000,1),
  mkItem("weapon_13","413",1,1000,1),
  mkItem("weapon_14","414",1,1000,1),
  mkItem("weapon_15","415",1,1000,1),
  mkItem("weapon_16","416",1,1000,1),
  mkItem("weapon_17","417",1,1000,1),
  mkItem("weapon_18","418",1,1000,1),
  mkItem("weapon_19","419",1,1000,1),
  mkItem("weapon_20","420",1,1000,1),
  mkItem("Gems","421",700,1,0),
];

export default function LotterySimulator(){
  const initChests=()=>{
    const c1={id:uid(),name:"Small Chest",keyCost:10};
    const c2={id:uid(),name:"Medium Chest",keyCost:50};
    const c3={id:uid(),name:"Big Chest",keyCost:150};
    const c4={id:uid(),name:"Super Chest",keyCost:0};
    return [c1,c2,c3,c4];
  };
  const [chests,setChests]=useState(initChests);
  const [activeChestId,setActiveChestId]=useState(()=>null);
  const [chestItems,setChestItems]=useState(()=>{
    const presets=[smallChestItems,mediumChestItems,bigChestItems,superChestItems];
    const m={};chests.forEach((c,index)=>{m[c.id]=presets[index]?presets[index]():defaultItems()});return m;
  });

  const activeChest=chests.find(c=>c.id===activeChestId)||chests[0];
  const keyCost=activeChest?.keyCost??5;
  const chestId=activeChest?.id;
  const items=chestItems[chestId]||[];
  const chestIndex=Math.max(0,chests.findIndex(c=>c.id===chestId));
  const chestStartId=(chestIndex+1)*100+1;

  const setItems=(fn)=>{
    setChestItems(prev=>{
      const cur=prev[chestId]||[];
      const next=typeof fn==="function"?fn(cur):fn;
      return {...prev,[chestId]:next};
    });
  };

  const switchChest=(id)=>{setActiveChestId(id);setResults(null);setSingleLog(null);setBalanceResult(null)};
  const copyItemsFrom=(srcId)=>{
    const src=chestItems[srcId];
    if(!src)return;
    setChestItems(prev=>({...prev,[chestId]:src.map(i=>({...i,id:uid()}))}));
  };
  const [targets,setTargets]=useState(()=>[
    {id:uid(),group:"T4 Weapon",target:"20–25"},
    {id:uid(),group:"T3 Weapon",target:"30–35"},
    {id:uid(),group:"T2 Weapon",target:"40–50"},
    {id:uid(),group:"T1 Weapon",target:"~60"},
  ]);
  const [simCount,setSimCount]=useState(10000);
  const [totalTarget,setTotalTarget]=useState("~60");
  const [results,setResults]=useState(null);
  const [running,setRunning]=useState(false);
  const [balancing,setBalancing]=useState(false);
  const [balanceResult,setBalanceResult]=useState(null);
  const [mode,setMode]=useState("mc");
  const [singleCount,setSingleCount]=useState(20);
  const [singleLog,setSingleLog]=useState(null);
  const [lotteryName,setLotteryName]=useState("");
  const [buildState,setBuildState]=useState({status:"idle",message:""});
  const [savedBalances,setSavedBalances]=useState([]);
  const [rewardPools,setRewardPools]=useState([]);
  const [renaming,setRenaming]=useState(false);
  const [renameValue,setRenameValue]=useState("");

  useEffect(()=>{
    window.workspaceGoogle?.getRewardPools().then(list=>{if(Array.isArray(list))setRewardPools(list)}).catch(()=>{});
  },[]);

  useEffect(()=>{
    window.workspaceStore?.read("lotteryBalances").then(list=>{if(Array.isArray(list))setSavedBalances(list)}).catch(()=>{});
  },[]);

  const saveBalance=async()=>{
    const name=lotteryName.trim();
    if(!name){setBuildState({status:"error",message:"Введите название для сохранения баланса"});return}
    const exists=savedBalances.some(b=>b.name===name);
    if(exists&&!window.confirm(`Баланс «${name}» уже существует. Перезаписать?`))return;
    const snapshot={name,chests:Object.fromEntries(chests.map(c=>[c.name,(chestItems[c.id]||[]).map(({id,...rest})=>rest)]))};
    const next=exists?savedBalances.map(b=>b.name===name?snapshot:b):[...savedBalances,snapshot];
    setSavedBalances(next);
    try{
      await window.workspaceStore?.write("lotteryBalances",next);
      setBuildState({status:"success",message:`Баланс «${name}» сохранён`});
    }catch(e){setBuildState({status:"error",message:"Не удалось сохранить: "+e.message})}
  };
  const loadBalance=(name)=>{
    const balance=savedBalances.find(b=>b.name===name);
    if(!balance)return;
    setChestItems(prev=>{
      const next={...prev};
      chests.forEach(c=>{
        const saved=balance.chests[c.name];
        if(saved)next[c.id]=saved.map(item=>({
          ...item,
          id:uid(),
          category:item.category||"Gun",
          itemType:item.itemType||"Parts",
          alternativeReward:item.alternativeReward||"",
          showInPreview:!!item.showInPreview,
          itemSubtype:item.itemSubtype||"",
        }));
      });
      return next;
    });
    setLotteryName(name);
    setBuildState({status:"idle",message:""});
  };
  const deleteBalance=async()=>{
    const name=lotteryName.trim();
    if(!savedBalances.some(b=>b.name===name)){setBuildState({status:"error",message:"Сначала выберите сохранённый баланс"});return}
    if(!window.confirm(`Удалить баланс «${name}»?`))return;
    const next=savedBalances.filter(b=>b.name!==name);
    setSavedBalances(next);
    try{
      await window.workspaceStore?.write("lotteryBalances",next);
      setBuildState({status:"success",message:`Баланс «${name}» удалён`});
    }catch(e){setBuildState({status:"error",message:"Не удалось удалить: "+e.message})}
  };
  const renameBalance=async()=>{
    const oldName=lotteryName.trim();
    if(!savedBalances.some(b=>b.name===oldName)){setBuildState({status:"error",message:"Сначала выберите сохранённый баланс"});return}
    const cleanName=renameValue.trim();
    if(!cleanName||cleanName===oldName){setRenaming(false);return}
    if(savedBalances.some(b=>b.name===cleanName)){setBuildState({status:"error",message:`Баланс «${cleanName}» уже существует`});return}
    const next=savedBalances.map(b=>b.name===oldName?{...b,name:cleanName}:b);
    setSavedBalances(next);
    setLotteryName(cleanName);
    setRenaming(false);
    try{
      await window.workspaceStore?.write("lotteryBalances",next);
      setBuildState({status:"success",message:`Баланс переименован в «${cleanName}»`});
    }catch(e){setBuildState({status:"error",message:"Не удалось переименовать: "+e.message})}
  };

  const upItem=(id,f,v)=>setItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));
  const upItemNum=(id,f,v)=>upItem(id,f,Math.max(0,Number(v)||0));
  const addItem=()=>setItems(p=>[...p,mkItem("","",1,1,0)]);
  const delItem=id=>setItems(p=>p.filter(i=>i.id!==id));
  const dupeItem=id=>setItems(p=>{const idx=p.findIndex(i=>i.id===id);if(idx<0)return p;const n=[...p];n.splice(idx+1,0,{...p[idx],id:uid()});return n});

  const upTarget=(id,f,v)=>setTargets(p=>p.map(t=>t.id===id?{...t,[f]:v}:t));
  const addTarget=()=>setTargets(p=>[...p,{id:uid(),group:"",target:"?"}]);
  const delTarget=id=>setTargets(p=>p.filter(t=>t.id!==id));

  const addChest=()=>{const n={id:uid(),name:`Chest ${chests.length+1}`,keyCost:5};setChests(p=>[...p,n]);setChestItems(prev=>({...prev,[n.id]:defaultItems()}))};
  const upChest=(id,v)=>setChests(p=>p.map(c=>c.id===id?v:c));
  const rmChest=id=>{setChests(p=>p.filter(c=>c.id!==id));setChestItems(prev=>{const n={...prev};delete n[id];return n});if(activeChestId===id)setActiveChestId(null)};

  const totalWeight=items.reduce((s,i)=>s+i.weight,0);
  const groupColors=getGroupColors(items);

  const run=useCallback(()=>{setRunning(true);setTimeout(()=>{setResults(simulateMC(items,simCount,keyCost));setRunning(false)},50)},[items,simCount,keyCost]);
  const runSingle=useCallback(()=>{setSingleLog(simulateSingle(items,singleCount,keyCost))},[items,singleCount,keyCost]);

  const runBalance=useCallback(()=>{
    setBalancing(true);setBalanceResult(null);
    setTimeout(()=>{
      const res=autoBalance(items,targets,keyCost);
      if(res)setBalanceResult(res);
      setBalancing(false);
    },50);
  },[items,targets,keyCost]);
  const applyBalance=useCallback(()=>{if(!balanceResult)return;setChestItems(prev=>({...prev,[chestId]:balanceResult.items.map(i=>({...i,id:uid()}))}));setBalanceResult(null)},[balanceResult,chestId]);
  const buildConfig=async()=>{
    const title=lotteryName.trim();
    if(!title){setBuildState({status:"error",message:"Введите точное название листа с лотереей"});return}
    const configItems=chests.flatMap((chest,ci)=>{
      const start=(ci+1)*100+1;
      return (chestItems[chest.id]||[]).map((item,idx)=>({
        containerId:start+idx,
        containerType:"SingleItem",
        category:item.category||"Gun",
        itemType:item.itemType||"Parts",
        itemId:item.group,
        alternativeReward:item.alternativeReward||"",
        showInPreview:!!item.showInPreview,
        itemSubtype:(item.itemType||"Parts")==="Currency"?(item.itemSubtype||""):"",
        count:item.drop,
        dropChance:item.weight,
      }));
    });
    setBuildState({status:"loading",message:"Обновляем конфиг в Google Sheets…"});
    try{
      const result=await window.workspaceGoogle?.buildLotteryConfig(title,configItems);
      if(!result)throw new Error("Функция доступна только в настольном приложении");
      setBuildState({status:"success",message:`Лист «${result.sheetName}» обновлён: ${result.updated} строк`});
    }catch(error){setBuildState({status:"error",message:error.message||"Не удалось собрать конфиг"})}
  };

  const maxHist=results?Math.max(...Object.values(results.histBuckets)):0;
  const histKeys=results?Object.keys(results.histBuckets).map(Number).sort((a,b)=>a-b):[];
  const hMin=histKeys[0]||0;
  const hMax=histKeys.length?Math.min(histKeys[histKeys.length-1],hMin+40):30;

  const pill={background:A,color:"#292929",border:"none",borderRadius:2,padding:"6px 14px",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:.4};
  const delBtn={background:A,color:"#292929",border:"none",borderRadius:2,width:26,height:26,fontSize:15,fontWeight:700,cursor:"pointer",lineHeight:1,padding:0,flexShrink:0};
  const card={background:SRF,borderRadius:2,border:`1px solid ${BRD}`,padding:16,marginBottom:12};

  return (<div className="simulator-shell">
    <div style={{fontSize:9,color:T2,marginBottom:12}}>Monte Carlo · динамический пул · несколько сундуков · цели в 🔑</div>

    {/* ── Chests ── */}
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600,color:T1}}>Сундуки</span>
        <In value={lotteryName} onChange={v=>{setLotteryName(v);setBuildState({status:"idle",message:""})}} style={{width:200,fontSize:12}} placeholder="Название листа/баланса"/>
        <button onClick={saveBalance} style={{...pill,background:"transparent",color:T1,border:`1px solid ${BRD}`}}>Сохранить</button>
        <button onClick={buildConfig} disabled={buildState.status==="loading"} style={{...pill,opacity:buildState.status==="loading"?.55:1,cursor:buildState.status==="loading"?"wait":"pointer"}}>{buildState.status==="loading"?"Собираю…":"Собрать конфиг"}</button>
        {savedBalances.length>0&&(
          <select onChange={e=>{if(e.target.value)loadBalance(e.target.value);e.target.value=""}} defaultValue="" style={{fontSize:11,color:T1,padding:"6px 10px",background:BG,border:`1px solid ${BRD}`,borderRadius:2,cursor:"pointer",outline:"none"}}>
            <option value="">Сохранённые балансы…</option>
            {savedBalances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        )}
        {savedBalances.some(b=>b.name===lotteryName.trim())&&(renaming?(<>
          <In value={renameValue} onChange={setRenameValue} style={{width:140,fontSize:12}} placeholder="Новое название"/>
          <button onClick={renameBalance} title="Сохранить название" style={{...pill,padding:"6px 9px"}}>✓</button>
          <button onClick={()=>setRenaming(false)} title="Отмена" style={{...pill,background:"transparent",color:T2,border:`1px solid ${BRD}`,padding:"6px 9px"}}>✕</button>
        </>):(<>
          <button onClick={()=>{setRenameValue(lotteryName.trim());setRenaming(true)}} title="Переименовать баланс" style={{...pill,background:"transparent",color:T1,border:`1px solid ${BRD}`,padding:"6px 9px"}}>✎</button>
          <button onClick={deleteBalance} title="Удалить баланс" style={{...pill,background:"transparent",color:DNG,border:`1px solid ${DNG}44`,padding:"6px 9px"}}>🗑</button>
        </>))}
        <button onClick={addChest} style={pill}>+ сундук</button>
      </div>
      {buildState.message&&<div className={`config-status ${buildState.status}`} style={{margin:"0 0 10px"}}>{buildState.message}</div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {chests.map(ch=>(
          <div key={ch.id} onClick={()=>switchChest(ch.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,cursor:"pointer",
              background:activeChest?.id===ch.id?`${A}22`:"transparent",
              border:`1px solid ${activeChest?.id===ch.id?A:BRD}`,transition:"all .15s"}}>
            <span style={{fontSize:12,fontWeight:600,color:activeChest?.id===ch.id?A:T1}}>{ch.name}</span>
            <span style={{fontSize:10,color:T2}}>{ch.keyCost}🔑</span>
          </div>
        ))}
      </div>
      {activeChest&&(
        <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderTop:`1px solid ${BRD}`}}>
          <In value={activeChest.name} onChange={v=>upChest(activeChest.id,{...activeChest,name:v})} style={{width:140,fontSize:12}} placeholder="Name"/>
          <span style={{fontSize:10,color:T2}}>Стоимость открытия:</span>
          <In value={activeChest.keyCost} onChange={v=>upChest(activeChest.id,{...activeChest,keyCost:Math.max(0,Number(v)||0)})} type="text" inputMode="numeric" style={{width:50,textAlign:"center",color:A,fontSize:13}}/>
          <span style={{fontSize:10,color:T2}}>🔑</span>
          <div style={{flex:1}}/>
          {chests.length>1&&<div onClick={()=>rmChest(activeChest.id)} style={{fontSize:9,color:DNG,cursor:"pointer",padding:"3px 8px",border:`1px solid ${DNG}44`,borderRadius:6}}>Удалить</div>}
          {chests.filter(c=>c.id!==chestId).length>0&&(
            <select onChange={e=>{if(e.target.value)copyItemsFrom(e.target.value);e.target.value=""}}
              style={{fontSize:10,color:T2,padding:"3px 8px",background:BG,border:`1px solid ${BRD}`,borderRadius:6,cursor:"pointer",outline:"none"}}>
              <option value="">Копировать из...</option>
              {chests.filter(c=>c.id!==chestId).map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          )}
        </div>
      )}
    </div>

    {/* ── Items ── */}
    <div style={{...card,overflowX:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600,color:T1}}>Содержимое сундука</span>
        <button onClick={addItem} style={pill}>+ айтем</button>
        <div style={{flex:1}}/>
        {items.length>0&&<button onClick={()=>setItems([])} style={{...pill,background:"transparent",color:DNG,border:`1px solid ${DNG}44`,fontSize:11,padding:"4px 12px"}}>Очистить все</button>}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1080}}>
        <thead>
          <tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px",fontWeight:500,width:52}}></th>
            <th style={{padding:"4px 6px",fontWeight:500}}>Item</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Id</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Дроп</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Вес</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Крафт</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Шанс</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Категория</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Тип</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Alt.Reward</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Preview</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Subtype</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item,itemIndex)=>{
            const pct=totalWeight>0?(item.weight/totalWeight*100).toFixed(1):"0.0";
            const gc=item.group&&groupColors[item.group];
            const containerId=chestStartId+itemIndex;
            const isCurrency=item.itemType==="Currency";
            return (
              <tr key={item.id} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"3px",whiteSpace:"nowrap"}}>
                  <div style={{display:"flex",gap:3}}>
                    <button onClick={()=>dupeItem(item.id)} title="Дублировать" style={{...delBtn,fontSize:12,background:BRD,color:T1}}>⧉</button>
                    <button onClick={()=>delItem(item.id)} style={delBtn}>×</button>
                  </div>
                </td>
                <td style={{padding:"3px 6px"}}><div style={{display:"flex",alignItems:"center",gap:5}}>{gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}<In value={item.group} onChange={v=>upItem(item.id,"group",v)} style={{width:100}} placeholder="(нет)"/></div></td>
                <td style={{padding:"3px 6px",textAlign:"center",color:T2}}>{containerId}</td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.drop} onChange={v=>upItemNum(item.id,"drop",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center"}}/></td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.weight} onChange={v=>upItemNum(item.id,"weight",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center"}}/></td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.craft} onChange={v=>upItemNum(item.id,"craft",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center",color:item.craft>0?A:T2}}/></td>
                <td style={{padding:"6px",textAlign:"center",color:T2,fontSize:11}}>{pct}%</td>
                <td style={{padding:"3px 6px",textAlign:"center"}}>
                  <select value={item.category} onChange={e=>upItem(item.id,"category",e.target.value)} style={{...inp,width:88,padding:"5px 4px",fontSize:11}}>
                    {CATEGORY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td style={{padding:"3px 6px",textAlign:"center"}}>
                  <select value={item.itemType} onChange={e=>{const v=e.target.value;setItems(p=>p.map(i=>i.id===item.id?{...i,itemType:v,itemSubtype:v==="Currency"?i.itemSubtype:""}:i))}} style={{...inp,width:88,padding:"5px 4px",fontSize:11}}>
                    {ITEM_TYPE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{padding:"3px 6px",textAlign:"center"}}>
                  <select value={item.alternativeReward} onChange={e=>upItem(item.id,"alternativeReward",e.target.value)} style={{...inp,width:150,padding:"5px 4px",fontSize:11}}>
                    <option value="">(empty)</option>
                    {rewardPools.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td style={{padding:"3px 6px",textAlign:"center"}}>
                  <input type="checkbox" checked={!!item.showInPreview} onChange={e=>upItem(item.id,"showInPreview",e.target.checked)} style={{width:15,height:15,accentColor:A,margin:0}}/>
                </td>
                <td style={{padding:"3px 6px",textAlign:"center"}}>
                  <In value={item.itemSubtype} onChange={v=>upItem(item.id,"itemSubtype",v)} disabled={!isCurrency} style={{width:90,textAlign:"center",opacity:isCurrency?1:.4}} placeholder={isCurrency?"":"—"}/>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* ── Targets ── */}
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:600,color:T1}}>Цели (в 🔑)</span>
        <button onClick={addTarget} style={pill}>+ цель</button>
        <div style={{flex:1}}/>
        <button onClick={runBalance} disabled={balancing} style={{...pill,background:balancing?"#333":A,color:balancing?T2:"#000",padding:"6px 18px",opacity:balancing?0.6:1,cursor:balancing?"wait":"pointer"}}>
          {balancing?"Подбираю...":"⚡ Подобрать веса"}
        </button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {targets.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,background:BG,borderRadius:8,padding:"3px 6px",border:`1px solid ${BRD}`}}>
            <In value={t.group} onChange={v=>upTarget(t.id,"group",v)} style={{width:90,fontSize:12}} placeholder="Группа"/>
            <In value={t.target} onChange={v=>upTarget(t.id,"target",v)} style={{width:50,textAlign:"center",color:A,fontSize:12}} placeholder="🔑"/>
            <button onClick={()=>delTarget(t.id)} style={delBtn}>×</button>
          </div>
        ))}
      </div>
      {balanceResult&&(
        <div style={{marginTop:12,padding:12,background:BG,borderRadius:10,border:`1px solid ${A}44`}}>
          <div style={{fontSize:12,fontWeight:700,color:A,marginBottom:8}}>Подобранные веса</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginBottom:10}}>
            <thead><tr style={{color:T2}}><th style={{padding:"3px 6px",textAlign:"left",fontWeight:500}}>Группа</th><th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Цель 🔑</th><th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Медиана 🔑</th><th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Попал?</th></tr></thead>
            <tbody>
              {balanceResult.trackGroups.map(g=>{
                const s=balanceResult.stats[g];if(!s)return null;
                const tgt=targets.find(t2=>t2.group===g);
                const p=tgt?parseTarget(tgt.target):null;
                const ok=p&&s.median>=p.lo&&s.median<=p.hi;
                return (<tr key={g} style={{borderTop:`1px solid ${BRD}`}}><td style={{padding:"4px 6px",fontWeight:600}}>{g}</td><td style={{padding:"4px 6px",textAlign:"center",color:A}}>{tgt?.target||"—"}</td><td style={{padding:"4px 6px",textAlign:"center",fontWeight:700}}>{s.median}</td><td style={{padding:"4px 6px",textAlign:"center"}}>{ok?"✅":"⚠️"}</td></tr>);
              })}
            </tbody>
          </table>
          <div style={{fontSize:11,color:T2,marginBottom:8}}>Новые веса:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
            {balanceResult.items.filter(i=>i.weight>0&&i.group).map((it,i)=>(<span key={i} style={{fontSize:10,background:SRF,borderRadius:6,padding:"3px 8px",color:T1}}>{it.label}: <span style={{color:A,fontWeight:700}}>{it.weight}</span></span>))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={applyBalance} style={{...pill,padding:"6px 18px"}}>Применить</button>
            <button onClick={()=>setBalanceResult(null)} style={{...pill,background:"transparent",color:T2,border:`1px solid ${BRD}`,padding:"6px 18px"}}>Отмена</button>
          </div>
        </div>
      )}
    </div>

    {/* ── Mode tabs ── */}
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      {[["mc","Monte Carlo"],["single","Одиночное"]].map(([k,l])=>(
        <button key={k} onClick={()=>setMode(k)} style={{background:mode===k?A:"transparent",color:mode===k?"#000":T2,border:`1px solid ${mode===k?A:BRD}`,borderRadius:20,padding:"5px 16px",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
      ))}
    </div>

    {/* ══════ Monte Carlo ══════ */}
    {mode==="mc"&&(<>
      <div style={{...card,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{fontSize:12}}><span style={{color:T2,marginRight:5}}>Симуляций</span><In value={simCount} onChange={v=>setSimCount(Math.max(100,Math.min(100000,Number(v)||100)))} type="text" inputMode="numeric" style={{width:72,textAlign:"center"}}/></label>
        <label style={{fontSize:12}}><span style={{color:T2,marginRight:5}}>Цель 🔑</span><In value={totalTarget} onChange={setTotalTarget} style={{width:56,textAlign:"center"}}/></label>
        <div style={{fontSize:11,color:T2,padding:"4px 10px",background:BG,borderRadius:8}}>Сундук: <span style={{color:A,fontWeight:700}}>{activeChest?.name||"—"}</span> ({keyCost}🔑/откр)</div>
        <button onClick={run} disabled={running} style={{...pill,padding:"8px 24px",fontSize:13,opacity:running?0.6:1,cursor:running?"wait":"pointer"}}>{running?"Считаю...":"Запустить"}</button>
      </div>
      {results&&(<>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:T1,marginBottom:10}}>Результаты <span style={{color:T2,fontWeight:400,fontSize:11}}>({results.simCount.toLocaleString()} · {activeChest?.name} · {keyCost}🔑/откр)</span></div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{color:T2}}><th style={{padding:"4px 6px",textAlign:"left",fontWeight:500}}>Группа</th><th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Цель 🔑</th><th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Медиана 🔑</th><th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Среднее</th><th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>P10</th><th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>P90</th></tr></thead>
            <tbody>
              {results.trackGroups.map(g=>{const s=results.stats[g];const tgt=targets.find(t=>t.group===g);const gc=groupColors[g];
                return (<tr key={g} style={{borderTop:`1px solid ${BRD}`}}><td style={{padding:"6px",fontWeight:600}}><div style={{display:"flex",alignItems:"center",gap:5}}>{gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}{g}</div></td><td style={{padding:"6px",textAlign:"center",color:A,fontSize:11}}>{tgt?tgt.target:"—"}</td><td style={{padding:"6px",textAlign:"center",fontWeight:700,fontSize:15}}>{s.median}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{s.mean}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{s.p10}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{s.p90}</td></tr>);
              })}
              <tr style={{borderTop:`2px solid ${A}`}}><td style={{padding:"6px",fontWeight:700}}>ВСЁ</td><td style={{padding:"6px",textAlign:"center",color:A,fontSize:11}}>{totalTarget}</td><td style={{padding:"6px",textAlign:"center",fontWeight:700,fontSize:15,color:A}}>{results.stats._total.median}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.mean}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.p10}</td><td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.p90}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={card}><div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:10}}>Распределение ключей</div><div style={{display:"flex",alignItems:"flex-end",gap:2,height:100}}>{Array.from({length:hMax-hMin+1},(_,i)=>{const n=hMin+i;const count=results.histBuckets[n]||0;const h=maxHist>0?(count/maxHist)*100:0;const isM=n===results.stats._total.median;return (<div key={n} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:"100%",maxWidth:24,height:`${h}%`,minHeight:count>0?2:0,background:isM?A:"rgba(216,250,0,0.25)",borderRadius:"3px 3px 0 0"}} title={`${n}🔑: ${count} (${(count/results.simCount*100).toFixed(1)}%)`}/>{n%2===0&&<span style={{fontSize:9,color:isM?A:T2,marginTop:3}}>{n}</span>}</div>)})}</div></div>
      </>)}
    </>)}

    {/* ══════ Single ══════ */}
    {mode==="single"&&(<>
      <div style={{...card,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{fontSize:12}}><span style={{color:T2,marginRight:5}}>Открытий</span><In value={singleCount} onChange={v=>setSingleCount(Math.max(1,Math.min(500,Number(v)||1)))} type="text" inputMode="numeric" style={{width:56,textAlign:"center"}}/></label>
        <span style={{fontSize:11,color:T2}}>= {singleCount*keyCost} 🔑</span>
        <button onClick={runSingle} style={{...pill,padding:"8px 24px",fontSize:13}}>Открыть сундук</button>
      </div>
      {singleLog&&(<>
        {singleLog.trackGroups.length>0&&(<div style={card}><div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:8}}>Прогресс крафта</div><div style={{display:"flex",flexDirection:"column",gap:8}}>{singleLog.trackGroups.map(g=>{const cur=singleLog.collected[g]||0;const max=singleLog.groupCraft[g]||1;const pct=Math.min(100,cur/max*100);const gc=groupColors[g]||A;const dn=cur>=max;return (<div key={g}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:12}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/><span style={{fontWeight:600}}>{g}</span>{dn&&<span style={{fontSize:10,color:A,fontWeight:700}}>CRAFTED</span>}</div><span style={{color:T2}}>{cur}/{max}</span></div><div style={{height:6,background:BG,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:dn?A:gc,borderRadius:3}}/></div></div>)})}</div></div>)}
        <div style={card}><div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:8}}>Лог открытий <span style={{color:T2,fontWeight:400,fontSize:11}}>({singleLog.log.length} откр. · {singleLog.log.length*keyCost} 🔑)</span></div><div style={{display:"flex",flexDirection:"column"}}>{singleLog.log.map((entry,i)=>{const gc=entry.group&&groupColors[entry.group];const isT=entry.progress!==null;return (<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderTop:i>0?`1px solid ${BRD}`:"none",background:entry.crafted?"rgba(216,250,0,0.06)":"transparent"}}><span style={{color:T2,fontSize:11,width:50,textAlign:"right",flexShrink:0}}>#{entry.open} ({entry.keys}🔑)</span>{gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}<span style={{fontWeight:600,fontSize:12,minWidth:80}}>{entry.label}</span><span style={{color:A,fontSize:12,fontWeight:600,minWidth:40}}>+{entry.drop}</span>{isT&&(<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,maxWidth:150,height:5,background:BG,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${Math.min(100,entry.progress/entry.craft*100)}%`,background:entry.crafted?A:(gc||T2)}}/></div><span style={{color:T2,fontSize:10,flexShrink:0}}>{entry.progress}/{entry.craft}</span></div>)}{entry.crafted&&(<span style={{background:A,color:"#000",borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700,flexShrink:0}}>CRAFTED</span>)}</div>)})}{singleLog.log.length>0&&singleLog.log[singleLog.log.length-1].allDone&&(<div style={{padding:"10px 8px",textAlign:"center",borderTop:`2px solid ${A}`,color:A,fontWeight:700,fontSize:13}}>Всё собрано за {singleLog.log.find(e=>e.allDone)?.keys||"?"} ключей ({singleLog.log.find(e=>e.allDone)?.open||"?"} открытий)</div>)}</div></div>
      </>)}
    </>)}
  </div>);
}
