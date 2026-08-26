import { useState, useCallback } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";

const uid=()=>Math.random().toString(36).slice(2,8);
const mkItem=(group,label,drop,weight,craft)=>({id:uid(),group,label,drop,weight,craft});
const palette=["#D8FA00","#00D4AA","#FF6B8A","#8B5CF6","#F59E0B","#06B6D4","#EC4899","#84CC16","#F97316","#6366F1"];
function getGroupColors(items){const gs=[...new Set(items.map(i=>i.group).filter(Boolean))];const m={};gs.forEach((g,i)=>{m[g]=palette[i%palette.length]});return m}

function simulateMC(items,simCount){
  const ai=items.filter(i=>i.weight>0);
  const gs=[...new Set(items.map(i=>i.group).filter(Boolean))];
  const gc={};for(const it of items)if(it.group&&it.craft>0)gc[it.group]=it.craft;
  const tg=gs.filter(g=>gc[g]>0);
  const ar=[];
  for(let r=0;r<simCount;r++){
    const col={};tg.forEach(g=>col[g]=0);const ca={};const done=new Set();let op=0;
    while(done.size<tg.length&&op<500){
      const pool=ai.filter(i=>!i.group||!done.has(i.group));
      const tw=pool.reduce((s,i)=>s+i.weight,0);if(tw===0)break;
      let roll=Math.random()*tw;let ch=pool[0];
      for(const it of pool){roll-=it.weight;if(roll<=0){ch=it;break}}
      op++;
      if(ch.group&&col[ch.group]!==undefined){
        col[ch.group]=Math.min(gc[ch.group],col[ch.group]+ch.drop);
        if(col[ch.group]>=gc[ch.group]&&!done.has(ch.group)){done.add(ch.group);ca[ch.group]=op}
      }
    }
    ar.push(ca);
  }
  const stats={};
  for(const g of tg){
    const v=ar.map(r=>r[g]||500).sort((a,b)=>a-b);
    stats[g]={median:v[Math.floor(v.length*0.5)],mean:(v.reduce((s,x)=>s+x,0)/v.length).toFixed(1),p10:v[Math.floor(v.length*0.1)],p90:v[Math.floor(v.length*0.9)]};
  }
  const tots=ar.map(r=>{const v=tg.map(g=>r[g]||500);return v.length?Math.max(...v):0}).sort((a,b)=>a-b);
  stats._total={median:tots[Math.floor(tots.length*0.5)],mean:(tots.reduce((s,x)=>s+x,0)/tots.length).toFixed(1),p10:tots[Math.floor(tots.length*0.1)],p90:tots[Math.floor(tots.length*0.9)]};
  const hb={};for(const v of tots)hb[v]=(hb[v]||0)+1;
  return {stats,histBuckets:hb,simCount,trackGroups:tg};
}

function simulateSingle(items,maxOpens){
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
    log.push({open:i+1,label:ch.label,group:ch.group,drop:ch.drop,progress:ch.group&&gc[ch.group]?col[ch.group]:null,craft:ch.group?gc[ch.group]:null,crafted,allDone:done.size>=tg.length});
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

function autoBalance(items,targets,simCount=3000,maxIter=40){
  const groups=[...new Set(items.map(i=>i.group).filter(Boolean))];
  const gc={};for(const it of items)if(it.group&&it.craft>0)gc[it.group]=it.craft;
  const tg=groups.filter(g=>gc[g]>0);
  const targetMap={};
  for(const t of targets){const p=parseTarget(t.target);if(p&&tg.includes(t.group))targetMap[t.group]=p}
  if(Object.keys(targetMap).length===0)return null;

  const newItems=items.map(i=>({...i}));
  // init: give every zero-weight tracked item at least 1
  for(const it of newItems){if(it.group&&targetMap[it.group]&&it.weight===0)it.weight=1}

  for(let iter=0;iter<maxIter;iter++){
    const res=simulateMC(newItems,simCount);
    let allGood=true;
    for(const g of Object.keys(targetMap)){
      const s=res.stats[g];if(!s)continue;
      const {lo,hi}=targetMap[g];
      const med=s.median;
      if(med>=lo&&med<=hi)continue;
      allGood=false;
      // ratio: how much to scale weights for this group
      const targetMid=(lo+hi)/2;
      const ratio=med/targetMid;
      // if med > target → group collects too slow → increase weights
      // if med < target → group collects too fast → decrease weights
      const factor=Math.pow(ratio,0.4); // damped
      for(const it of newItems){
        if(it.group===g){
          it.weight=Math.max(0.1,it.weight*factor);
        }
      }
    }
    if(allGood)break;
  }

  // round weights to nice numbers
  const minW=Math.min(...newItems.filter(i=>i.weight>0).map(i=>i.weight));
  const scale=minW>0?1/minW:1;
  for(const it of newItems){
    if(it.weight>0)it.weight=Math.max(1,Math.round(it.weight*scale));
    else it.weight=0;
  }

  // final verify run
  const verify=simulateMC(newItems,5000);
  return {items:newItems,stats:verify.stats,trackGroups:verify.trackGroups};
}

const inp={background:BG,border:`1px solid ${BRD}`,borderRadius:2,color:T1,padding:"7px 9px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
const In=({value,onChange,style,...p})=>(<input value={value} onChange={e=>onChange(e.target.value)} onFocus={e=>e.target.select()} style={{...inp,...style}} {...p}/>);

export default function LootboxSimulator(){
  const [items,setItems]=useState(()=>[
    mkItem("T4 Weapon","T4 ×50",50,4,250),mkItem("T4 Weapon","T4 ×125",125,12,250),mkItem("T4 Weapon","T4 ×250",250,8,250),
    mkItem("T3 Weapon","T3 ×50",50,6,250),mkItem("T3 Weapon","T3 ×125",125,8,250),mkItem("T3 Weapon","T3 ×250",250,3,250),
    mkItem("T2 Weapon","T2 ×50",50,10,250),mkItem("T2 Weapon","T2 ×125",125,5,250),mkItem("T2 Weapon","T2 ×250",250,1,250),
    mkItem("T1 Weapon","T1 ×50",50,8,250),mkItem("T1 Weapon","T1 ×125",125,2,250),mkItem("T1 Weapon","T1 ×250",250,0,250),
    mkItem("","Gems",150,1,0),
  ]);
  const [targets,setTargets]=useState(()=>[
    {id:uid(),group:"T4 Weapon",target:"4–5"},
    {id:uid(),group:"T3 Weapon",target:"6–7"},
    {id:uid(),group:"T2 Weapon",target:"8–10"},
    {id:uid(),group:"T1 Weapon",target:"~12"},
  ]);
  const [simCount,setSimCount]=useState(10000);
  const [totalTarget,setTotalTarget]=useState("~12");
  const [results,setResults]=useState(null);
  const [running,setRunning]=useState(false);
  const [mode,setMode]=useState("mc");
  const [singleCount,setSingleCount]=useState(20);
  const [singleLog,setSingleLog]=useState(null);
  const [balancing,setBalancing]=useState(false);
  const [balanceResult,setBalanceResult]=useState(null);

  const upItem=(id,f,v)=>setItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));
  const upItemNum=(id,f,v)=>upItem(id,f,Math.max(0,Number(v)||0));
  const addItem=()=>setItems(p=>[...p,mkItem("","New Item",1,1,0)]);
  const delItem=id=>setItems(p=>p.filter(i=>i.id!==id));
  const dupeItem=id=>setItems(p=>{const idx=p.findIndex(i=>i.id===id);if(idx<0)return p;const n=[...p];n.splice(idx+1,0,{...p[idx],id:uid()});return n});

  const upTarget=(id,f,v)=>setTargets(p=>p.map(t=>t.id===id?{...t,[f]:v}:t));
  const addTarget=()=>setTargets(p=>[...p,{id:uid(),group:"",target:"?"}]);
  const delTarget=id=>setTargets(p=>p.filter(t=>t.id!==id));

  const totalWeight=items.reduce((s,i)=>s+i.weight,0);
  const groupColors=getGroupColors(items);

  const run=useCallback(()=>{setRunning(true);setTimeout(()=>{setResults(simulateMC(items,simCount));setRunning(false)},50)},[items,simCount]);
  const runSingle=useCallback(()=>{setSingleLog(simulateSingle(items,singleCount))},[items,singleCount]);

  const runBalance=useCallback(()=>{
    setBalancing(true);setBalanceResult(null);
    setTimeout(()=>{
      const res=autoBalance(items,targets);
      if(res){
        setBalanceResult(res);
      }
      setBalancing(false);
    },50);
  },[items,targets]);

  const applyBalance=useCallback(()=>{
    if(!balanceResult)return;
    setItems(balanceResult.items.map(i=>({...i,id:uid()})));
    setBalanceResult(null);
  },[balanceResult]);

  const maxHist=results?Math.max(...Object.values(results.histBuckets)):0;
  const histKeys=results?Object.keys(results.histBuckets).map(Number).sort((a,b)=>a-b):[];
  const hMin=histKeys[0]||0;
  const hMax=histKeys.length?Math.min(histKeys[histKeys.length-1],hMin+40):30;

  const pill={background:A,color:"#292929",border:"none",borderRadius:2,padding:"6px 14px",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:.4};
  const delBtn={background:A,color:"#292929",border:"none",borderRadius:2,width:26,height:26,fontSize:15,fontWeight:700,cursor:"pointer",lineHeight:1,padding:0,flexShrink:0};
  const card={background:SRF,borderRadius:2,border:`1px solid ${BRD}`,padding:16,marginBottom:12};

  return (<div className="simulator-shell">
    <div style={{fontSize:9,color:T2,marginBottom:12}}>Monte Carlo · динамический пул · craft=0 не отслеживается</div>

    {/* ── Items table ── */}
    <div style={{...card,overflowX:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600,color:T1}}>Содержимое сундука</span>
        <button onClick={addItem} style={pill}>+ айтем</button>
        <div style={{flex:1}}/>
        {items.length>0&&<button onClick={()=>setItems([])} style={{...pill,background:"transparent",color:DNG,border:`1px solid ${DNG}44`,fontSize:11,padding:"4px 12px"}}>Очистить все</button>}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:580}}>
        <thead>
          <tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px",fontWeight:500,width:52}}></th>
            <th style={{padding:"4px 6px",fontWeight:500}}>Группа</th>
            <th style={{padding:"4px 6px",fontWeight:500}}>Название</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Дроп</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Вес</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Крафт</th>
            <th style={{padding:"4px 6px",fontWeight:500,textAlign:"center"}}>Шанс</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item=>{
            const pct=totalWeight>0?(item.weight/totalWeight*100).toFixed(1):"0.0";
            const gc=item.group&&groupColors[item.group];
            return (
              <tr key={item.id} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"3px",whiteSpace:"nowrap"}}>
                  <div style={{display:"flex",gap:3}}>
                    <button onClick={()=>dupeItem(item.id)} title="Дублировать" style={{...delBtn,fontSize:12,background:BRD,color:T1}}>⧉</button>
                    <button onClick={()=>delItem(item.id)} style={delBtn}>×</button>
                  </div>
                </td>
                <td style={{padding:"3px 6px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    {gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}
                    <In value={item.group} onChange={v=>upItem(item.id,"group",v)} style={{width:100}} placeholder="(нет)"/>
                  </div>
                </td>
                <td style={{padding:"3px 6px"}}><In value={item.label} onChange={v=>upItem(item.id,"label",v)} style={{width:100}}/></td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.drop} onChange={v=>upItemNum(item.id,"drop",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center"}}/></td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.weight} onChange={v=>upItemNum(item.id,"weight",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center"}}/></td>
                <td style={{padding:"3px 6px",textAlign:"center"}}><In value={item.craft} onChange={v=>upItemNum(item.id,"craft",v)} type="text" inputMode="numeric" style={{width:50,textAlign:"center",color:item.craft>0?A:T2}}/></td>
                <td style={{padding:"6px",textAlign:"center",color:T2,fontSize:11}}>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* ── Targets ── */}
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:600,color:T1}}>Цели</span>
        <button onClick={addTarget} style={pill}>+ цель</button>
        <div style={{flex:1}}/>
        <button onClick={runBalance} disabled={balancing} style={{...pill,background:balancing?"#333":A,color:balancing?T2:"#000000",padding:"6px 18px",opacity:balancing?0.6:1,cursor:balancing?"wait":"pointer"}}>
          {balancing?"Подбираю...":"⚡ Подобрать веса"}
        </button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {targets.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,background:BG,borderRadius:8,padding:"3px 6px",border:`1px solid ${BRD}`}}>
            <In value={t.group} onChange={v=>upTarget(t.id,"group",v)} style={{width:90,fontSize:12}} placeholder="Группа"/>
            <In value={t.target} onChange={v=>upTarget(t.id,"target",v)} style={{width:44,textAlign:"center",color:A,fontSize:12}} placeholder="?"/>
            <button onClick={()=>delTarget(t.id)} style={delBtn}>×</button>
          </div>
        ))}
      </div>

      {/* Balance result preview */}
      {balanceResult&&(
        <div style={{marginTop:12,padding:12,background:BG,borderRadius:10,border:`1px solid ${A}44`}}>
          <div style={{fontSize:12,fontWeight:700,color:A,marginBottom:8}}>Подобранные веса</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginBottom:10}}>
            <thead>
              <tr style={{color:T2}}>
                <th style={{padding:"3px 6px",textAlign:"left",fontWeight:500}}>Группа</th>
                <th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Цель</th>
                <th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Медиана</th>
                <th style={{padding:"3px 6px",textAlign:"center",fontWeight:500}}>Попал?</th>
              </tr>
            </thead>
            <tbody>
              {balanceResult.trackGroups.map(g=>{
                const s=balanceResult.stats[g];if(!s)return null;
                const tgt=targets.find(t2=>t2.group===g);
                const p=tgt?parseTarget(tgt.target):null;
                const ok=p&&s.median>=p.lo&&s.median<=p.hi;
                return (
                  <tr key={g} style={{borderTop:`1px solid ${BRD}`}}>
                    <td style={{padding:"4px 6px",fontWeight:600}}>{g}</td>
                    <td style={{padding:"4px 6px",textAlign:"center",color:A}}>{tgt?.target||"—"}</td>
                    <td style={{padding:"4px 6px",textAlign:"center",fontWeight:700}}>{s.median}</td>
                    <td style={{padding:"4px 6px",textAlign:"center"}}>{ok?"✅":"⚠️"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{fontSize:11,color:T2,marginBottom:8}}>Новые веса:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
            {balanceResult.items.filter(i=>i.weight>0&&i.group).map((it,i)=>(
              <span key={i} style={{fontSize:10,background:SRF,borderRadius:6,padding:"3px 8px",color:T1}}>
                {it.label}: <span style={{color:A,fontWeight:700}}>{it.weight}</span>
              </span>
            ))}
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
        <button key={k} onClick={()=>setMode(k)} style={{
          background:mode===k?A:"transparent",color:mode===k?"#000000":T2,
          border:`1px solid ${mode===k?A:BRD}`,borderRadius:20,padding:"5px 16px",
          fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"
        }}>{l}</button>
      ))}
    </div>

    {/* ══════ Monte Carlo ══════ */}
    {mode==="mc"&&(<>
      <div style={{...card,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{fontSize:12}}>
          <span style={{color:T2,marginRight:5}}>Симуляций</span>
          <In value={simCount} onChange={v=>setSimCount(Math.max(100,Math.min(100000,Number(v)||100)))} type="text" inputMode="numeric" style={{width:72,textAlign:"center"}}/>
        </label>
        <label style={{fontSize:12}}>
          <span style={{color:T2,marginRight:5}}>Цель</span>
          <In value={totalTarget} onChange={setTotalTarget} style={{width:56,textAlign:"center"}}/>
        </label>
        <button onClick={run} disabled={running} style={{...pill,padding:"8px 24px",fontSize:13,opacity:running?0.6:1,cursor:running?"wait":"pointer"}}>
          {running?"Считаю...":"Запустить"}
        </button>
      </div>

      {results&&(<>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:T1,marginBottom:10}}>
            Результаты <span style={{color:T2,fontWeight:400,fontSize:11}}>({results.simCount.toLocaleString()})</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{color:T2}}>
                <th style={{padding:"4px 6px",textAlign:"left",fontWeight:500}}>Группа</th>
                <th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Цель</th>
                <th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Медиана</th>
                <th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>Среднее</th>
                <th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>P10</th>
                <th style={{padding:"4px 6px",textAlign:"center",fontWeight:500}}>P90</th>
              </tr>
            </thead>
            <tbody>
              {results.trackGroups.map(g=>{
                const s=results.stats[g];const tgt=targets.find(t=>t.group===g);const gc=groupColors[g];
                return (
                  <tr key={g} style={{borderTop:`1px solid ${BRD}`}}>
                    <td style={{padding:"6px",fontWeight:600}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        {gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}{g}
                      </div>
                    </td>
                    <td style={{padding:"6px",textAlign:"center",color:A,fontSize:11}}>{tgt?tgt.target:"—"}</td>
                    <td style={{padding:"6px",textAlign:"center",fontWeight:700,fontSize:15}}>{s.median}</td>
                    <td style={{padding:"6px",textAlign:"center",color:T2}}>{s.mean}</td>
                    <td style={{padding:"6px",textAlign:"center",color:T2}}>{s.p10}</td>
                    <td style={{padding:"6px",textAlign:"center",color:T2}}>{s.p90}</td>
                  </tr>
                );
              })}
              <tr style={{borderTop:`2px solid ${A}`}}>
                <td style={{padding:"6px",fontWeight:700}}>ВСЁ</td>
                <td style={{padding:"6px",textAlign:"center",color:A,fontSize:11}}>{totalTarget}</td>
                <td style={{padding:"6px",textAlign:"center",fontWeight:700,fontSize:15,color:A}}>{results.stats._total.median}</td>
                <td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.mean}</td>
                <td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.p10}</td>
                <td style={{padding:"6px",textAlign:"center",color:T2}}>{results.stats._total.p90}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:10}}>Распределение открытий</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:2,height:100}}>
            {Array.from({length:hMax-hMin+1},(_,i)=>{
              const n=hMin+i;const count=results.histBuckets[n]||0;
              const h=maxHist>0?(count/maxHist)*100:0;
              const isM=n===results.stats._total.median;
              return (
                <div key={n} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:"100%",maxWidth:24,height:`${h}%`,minHeight:count>0?2:0,background:isM?A:"rgba(216,250,0,0.25)",borderRadius:"3px 3px 0 0"}} title={`${n}: ${count} (${(count/results.simCount*100).toFixed(1)}%)`}/>
                  {n%2===0&&<span style={{fontSize:9,color:isM?A:T2,marginTop:3}}>{n}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </>)}
    </>)}

    {/* ══════ Single open ══════ */}
    {mode==="single"&&(<>
      <div style={{...card,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{fontSize:12}}>
          <span style={{color:T2,marginRight:5}}>Открытий</span>
          <In value={singleCount} onChange={v=>setSingleCount(Math.max(1,Math.min(500,Number(v)||1)))} type="text" inputMode="numeric" style={{width:56,textAlign:"center"}}/>
        </label>
        <button onClick={runSingle} style={{...pill,padding:"8px 24px",fontSize:13}}>Открыть сундук</button>
      </div>

      {singleLog&&(<>
        {/* Progress bars */}
        {singleLog.trackGroups.length>0&&(
          <div style={card}>
            <div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:8}}>Прогресс крафта</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {singleLog.trackGroups.map(g=>{
                const cur=singleLog.collected[g]||0;const max=singleLog.groupCraft[g]||1;
                const pct=Math.min(100,cur/max*100);const gc=groupColors[g]||A;const dn=cur>=max;
                return (
                  <div key={g}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>
                        <span style={{fontWeight:600}}>{g}</span>
                        {dn&&<span style={{fontSize:10,color:A,fontWeight:700}}>CRAFTED</span>}
                      </div>
                      <span style={{color:T2}}>{cur}/{max}</span>
                    </div>
                    <div style={{height:6,background:BG,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:dn?A:gc,borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drop log */}
        <div style={card}>
          <div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:8}}>
            Лог открытий <span style={{color:T2,fontWeight:400,fontSize:11}}>({singleLog.log.length})</span>
          </div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {singleLog.log.map((entry,i)=>{
              const gc=entry.group&&groupColors[entry.group];
              const isT=entry.progress!==null;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderTop:i>0?`1px solid ${BRD}`:"none",background:entry.crafted?"rgba(216,250,0,0.06)":"transparent"}}>
                  <span style={{color:T2,fontSize:11,width:24,textAlign:"right",flexShrink:0}}>#{entry.open}</span>
                  {gc&&<div style={{width:7,height:7,borderRadius:4,background:gc,flexShrink:0}}/>}
                  <span style={{fontWeight:600,fontSize:12,minWidth:80}}>{entry.label}</span>
                  <span style={{color:A,fontSize:12,fontWeight:600,minWidth:40}}>+{entry.drop}</span>
                  {isT&&(
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                      <div style={{flex:1,maxWidth:150,height:5,background:BG,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,width:`${Math.min(100,entry.progress/entry.craft*100)}%`,background:entry.crafted?A:(gc||T2)}}/>
                      </div>
                      <span style={{color:T2,fontSize:10,flexShrink:0}}>{entry.progress}/{entry.craft}</span>
                    </div>
                  )}
                  {entry.crafted&&(
                    <span style={{background:A,color:"#000000",borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700,flexShrink:0}}>CRAFTED</span>
                  )}
                </div>
              );
            })}
            {singleLog.log.length>0&&singleLog.log[singleLog.log.length-1].allDone&&(
              <div style={{padding:"10px 8px",textAlign:"center",borderTop:`2px solid ${A}`,color:A,fontWeight:700,fontSize:13}}>
                Всё собрано за {singleLog.log.find(e=>e.allDone)?.open||"?"} открытий
              </div>
            )}
          </div>
        </div>
      </>)}
    </>)}
  </div>);
}
