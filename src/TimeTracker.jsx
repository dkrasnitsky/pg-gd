import { useState, useEffect, useCallback, useRef } from "react";

const A="#D8FA00",BG="#131416",SRF="#26262e",BRD="#3a3a44",T1="#eee",T2="#888",DNG="#ff4444";
const ZZZ="'ZZZBold','Integral CF',Impact,sans-serif";
const START_H=10,END_H=22,HOUR_H=62,GRID_H=HOUR_H*(END_H-START_H);
const SNAP=5,PX_PER_MIN=HOUR_H/60;

const COLORS=[
  {name:"Gamedesign",color:"#5D8DE8"},{name:"Configs",color:"#E8A85D"},
  {name:"Meeting",color:"#E85D75"},{name:"Break",color:"#22C55E"},
  {name:"Analytics",color:"#8B5CF6"},{name:"Review",color:"#06B6D4"},
  {name:"Other",color:"#6B7280"},
];

const uid=()=>Math.random().toString(36).slice(2,8);
const dateKey=d=>`tracker_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const pad2=n=>String(n).padStart(2,"0");
const fmtHM=(h,m)=>`${pad2(h)}:${pad2(m)}`;
const snapM=m=>Math.round(m/SNAP)*SNAP;
const clampStart=m=>Math.max(START_H*60,Math.min(END_H*60-SNAP,m));

function loadDay(d){try{const r=localStorage.getItem(dateKey(d));return r?JSON.parse(r):null}catch(e){return null}}
function saveDay(d,data){try{localStorage.setItem(dateKey(d),JSON.stringify(data))}catch(e){}}
function loadTemplates(){try{const r=localStorage.getItem("tracker_templates");return r?JSON.parse(r):[]}catch(e){return[]}}
function saveTemplates(t){try{localStorage.setItem("tracker_templates",JSON.stringify(t))}catch(e){}}

function layoutTasks(tasks){
  const items=tasks.map((t,idx)=>{
    const sm=t.startHour*60+t.startMin;
    const top=((sm-START_H*60)/60)*HOUR_H;
    const height=Math.max((t.durationMin/60)*HOUR_H-2,16);
    return{...t,top,height,sm,em:sm+t.durationMin,idx};
  });
  items.sort((a,b)=>a.sm-b.sm||a.idx-b.idx);
  const cols=[];
  items.forEach(it=>{
    let placed=false;
    for(let c=0;c<cols.length;c++){if(it.sm>=cols[c][cols[c].length-1].em){cols[c].push(it);it.col=c;placed=true;break}}
    if(!placed){it.col=cols.length;cols.push([it])}
  });
  const tc=cols.length||1;
  items.forEach(it=>{it.totalCols=tc});
  return items;
}

/* ─── Mini Calendar ─── */
function MiniCal({current,onSelect}){
  const [viewDate,setViewDate]=useState(()=>new Date(current));
  useEffect(()=>{setViewDate(new Date(current))},[current]);
  const y=viewDate.getFullYear(),m=viewDate.getMonth();
  const startDay=new Date(y,m,1).getDay();
  const dim=new Date(y,m+1,0).getDate();
  const prevD=new Date(y,m,0).getDate();
  const cells=[];
  for(let i=0;i<startDay;i++)cells.push({d:prevD-startDay+1+i,out:true});
  for(let i=1;i<=dim;i++)cells.push({d:i,out:false});
  const rem=7-cells.length%7;if(rem<7)for(let i=1;i<=rem;i++)cells.push({d:i,out:true});
  const today=new Date();today.setHours(0,0,0,0);
  const sel=new Date(current);sel.setHours(0,0,0,0);

  return(
    <div style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:T1,flex:1}}>{viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
        <div onClick={()=>setViewDate(new Date(y,m-1,1))} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <div onClick={()=>setViewDate(new Date(y,m+1,1))} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,textAlign:"center"}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(<div key={i} style={{fontSize:10,color:T2,fontWeight:600,padding:"4px 0"}}>{d}</div>))}
        {cells.map((c,i)=>{
          const cd=c.out?null:new Date(y,m,c.d);
          const isT=cd&&cd.getTime()===today.getTime();
          const isS=cd&&cd.getTime()===sel.getTime()&&!isT;
          const hasData=cd&&(()=>{try{const r=localStorage.getItem(dateKey(cd));if(!r)return false;const p=JSON.parse(r);return(p.tasks&&p.tasks.length>0)||(p.notes&&p.notes.trim().length>0)}catch(e){return false}})();
          return(<div key={i} onClick={()=>{if(cd)onSelect(cd)}}
            style={{fontSize:11,borderRadius:"50%",cursor:c.out?"default":"pointer",color:c.out?"#333":isT?BG:isS?BG:T1,background:isT?A:isS?"#fff":"transparent",fontWeight:(isT||isS)?800:400,transition:"background .15s",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",position:"relative"}}
            onMouseEnter={e=>{if(!c.out&&!isT&&!isS)e.currentTarget.style.background="rgba(255,255,255,0.08)"}}
            onMouseLeave={e=>{if(!c.out&&!isT&&!isS)e.currentTarget.style.background="transparent"}}>
            {c.d}
            {hasData&&!isT&&!isS&&<div style={{position:"absolute",bottom:1,width:3,height:3,borderRadius:"50%",background:A}}/>}
          </div>);
        })}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function TimeTracker(){
  const [selDate,setSelDate]=useState(()=>{const d=new Date();d.setHours(0,0,0,0);return d});
  const [tasks,setTasks]=useState([]);
  const [notes,setNotes]=useState("");
  const [templates,setTemplates]=useState(()=>loadTemplates());
  const [nowMin,setNowMin]=useState(()=>{const n=new Date();return n.getHours()*60+n.getMinutes()});
  const [timers,setTimers]=useState({});
  const [hovCat,setHovCat]=useState(null);
  const [drag,setDrag]=useState(null);
  const [editingId,setEditingId]=useState(null);
  const [colorPickerId,setColorPickerId]=useState(null);
  const [clipboard,setClipboard]=useState(null);
  const gridRef=useRef(null);
  const timerRef=useRef(null);
  const loadedRef=useRef(false);

  // Load day
  useEffect(()=>{
    loadedRef.current=false;
    const data=loadDay(selDate);
    if(data){setTasks(data.tasks||[]);setNotes(data.notes||"")}
    else{setTasks([]);setNotes("")}
    setEditingId(null);setColorPickerId(null);
    setTimeout(()=>{loadedRef.current=true},0);
  },[selDate]);

  // Save (only after load)
  useEffect(()=>{
    if(!loadedRef.current)return;
    if(tasks.length>0||notes.trim().length>0)saveDay(selDate,{tasks,notes});
    else{try{localStorage.removeItem(dateKey(selDate))}catch(e){}}
  },[tasks,notes,selDate]);

  // Clock
  useEffect(()=>{const iv=setInterval(()=>{const n=new Date();setNowMin(n.getHours()*60+n.getMinutes())},15000);return()=>clearInterval(iv)},[]);

  // Timers tick
  useEffect(()=>{
    if(Object.keys(timers).length===0){if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}return}
    if(!timerRef.current)timerRef.current=setInterval(()=>{setTimers(prev=>{const n={...prev};for(const id in n)n[id]=n[id]+1;return n})},1000);
    return()=>{if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}};
  },[Object.keys(timers).length]);

  // ── Drag system ──
  useEffect(()=>{
    if(!drag)return;
    const handleMove=e=>{
      const dy=e.clientY-drag.startY;
      const rawDMin=(dy/HOUR_H)*60;
      setTasks(p=>p.map(t=>{
        if(t.id!==drag.id)return t;
        if(drag.type==="resize"||drag.type==="create"){
          const nd=Math.max(SNAP,snapM(drag.origDurationMin+rawDMin));
          const mx=END_H*60-(t.startHour*60+t.startMin);
          return{...t,durationMin:Math.min(nd,mx)};
        }
        if(drag.type==="move"){
          const ns=clampStart(snapM(drag.origStartMin+rawDMin));
          const clamped=Math.min(ns,END_H*60-t.durationMin);
          return{...t,startHour:Math.floor(clamped/60),startMin:clamped%60};
        }
        return t;
      }));
    };
    const handleUp=()=>{
      if(drag.type==="create")setEditingId(drag.id);
      setDrag(null);
    };
    window.addEventListener("mousemove",handleMove);
    window.addEventListener("mouseup",handleUp);
    return()=>{window.removeEventListener("mousemove",handleMove);window.removeEventListener("mouseup",handleUp)};
  },[drag]);

  const handleGridMouseDown=e=>{
    if(!gridRef.current)return;
    let el=e.target;
    while(el&&el!==gridRef.current){if(el.dataset?.tb)return;el=el.parentElement}
    const rect=gridRef.current.getBoundingClientRect();
    const y=e.clientY-rect.top;
    const raw=START_H*60+(y/PX_PER_MIN);
    const snapped=snapM(raw);
    const h=Math.floor(snapped/60),mn=snapped%60;
    if(h<START_H||h>=END_H)return;
    const nid=uid();
    setTasks(p=>[...p,{id:nid,title:"",startHour:h,startMin:mn,durationMin:30,color:COLORS[0].color,category:COLORS[0].name}]);
    setColorPickerId(null);setEditingId(null);
    setDrag({id:nid,type:"create",startY:e.clientY,origStartMin:h*60+mn,origDurationMin:30});
  };

  const isToday=useCallback(()=>{const t=new Date();t.setHours(0,0,0,0);return selDate.getTime()===t.getTime()},[selDate]);
  const nowTop=((nowMin-START_H*60)/60)*HOUR_H;
  const showNowLine=isToday()&&nowMin>=START_H*60&&nowMin<=END_H*60;

  const deleteTask=id=>{setTasks(p=>p.filter(t=>t.id!==id));if(editingId===id)setEditingId(null);if(colorPickerId===id)setColorPickerId(null)};
  const copyTask=task=>{setClipboard({title:task.title,startHour:task.startHour,startMin:task.startMin,durationMin:task.durationMin,color:task.color,category:task.category})};
  const pasteTask=()=>{if(!clipboard)return;setTasks(p=>[...p,{id:uid(),...clipboard}])};
  const toggleTimer=id=>{setTimers(prev=>{const n={...prev};if(n[id]!==undefined)delete n[id];else n[id]=0;return n})};
  const fmtTimer=s=>{const m=Math.floor(s/60);return`${m}:${pad2(s%60)}`};

  const cycleColor=id=>{
    setTasks(p=>p.map(t=>{
      if(t.id!==id)return t;
      const ci=COLORS.findIndex(c=>c.color===t.color);
      const next=COLORS[(ci+1)%COLORS.length];
      return{...t,color:next.color,category:next.name};
    }));
  };

  const copyToTomorrow=()=>{
    const tmrw=new Date(selDate);tmrw.setDate(tmrw.getDate()+1);
    const ex=loadDay(tmrw);
    const cp=tasks.map(t=>({...t,id:uid()}));
    saveDay(tmrw,{tasks:ex?[...ex.tasks,...cp]:cp,notes:ex?.notes||""});
  };

  const addFromTemplate=tpl=>{setTasks(p=>[...p,{id:uid(),...tpl}]);};
  const saveAsTemplate=task=>{
    const t=[...templates,{title:task.title,startHour:task.startHour,startMin:task.startMin,durationMin:task.durationMin,color:task.color,category:task.category}];
    setTemplates(t);saveTemplates(t);
  };
  const removeTemplate=i=>{const t=templates.filter((_,j)=>j!==i);setTemplates(t);saveTemplates(t)};

  // Summary
  const catHours={};
  tasks.forEach(t=>{catHours[t.category]=(catHours[t.category]||0)+t.durationMin/60});
  const totalHours=Object.entries(catHours).filter(([c])=>c!=="Other"&&c!=="Break").reduce((s,[,v])=>s+v,0);
  const catEntries=Object.entries(catHours).sort((a,b)=>{if(a[0]==="Other"||a[0]==="Break")return 1;if(b[0]==="Other"||b[0]==="Break")return -1;return b[1]-a[1]});
  const barTotal=Object.values(catHours).reduce((s,v)=>s+v,0);
  const catColorMap={};COLORS.forEach(c=>{catColorMap[c.name]=c.color});

  const laid=layoutTasks(tasks);
  const hours=[];for(let h=START_H;h<=END_H;h++)hours.push(h);
  const dayLabel=selDate.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  return(
    <div className="time-tracker-page" style={{height:"100%",background:BG,borderRadius:16,border:`1px solid ${BRD}`,overflow:"hidden",display:"flex",flexDirection:"column",userSelect:drag?"none":"auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",padding:"10px 16px",gap:8,flexShrink:0}}>
        <div style={{width:3,height:16,background:A,borderRadius:1}}/>
        <div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Time Tracker</div>
        {!isToday()&&<div onClick={()=>{const d=new Date();d.setHours(0,0,0,0);setSelDate(d)}} style={{padding:"4px 10px",background:A,borderRadius:8,fontSize:10,fontWeight:800,color:"#000",cursor:"pointer",marginLeft:4}}>Today</div>}
        <div style={{flex:1}}/>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* ── Left panel ── */}
        <div style={{width:240,flexShrink:0,borderRight:`1px solid ${BRD}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <MiniCal current={selDate} onSelect={d=>{d.setHours(0,0,0,0);setSelDate(new Date(d))}}/>
          <div style={{margin:"0 14px",height:1,background:BRD}}/>

          {/* Total */}
          <div style={{padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <div style={{width:3,height:12,background:A,borderRadius:1}}/>
              <span style={{fontSize:11,fontWeight:800,fontFamily:ZZZ,color:T1,textTransform:"uppercase",letterSpacing:1}}>Total</span>
              <div style={{flex:1}}/>
              <span style={{fontSize:18,fontWeight:700,color:T1}}>{totalHours.toFixed(1)}ч</span>
            </div>
            {barTotal>0&&(
              <div style={{display:"flex",height:8,borderRadius:4,overflow:"visible",gap:2,position:"relative"}}>
                {catEntries.map(([cat,hrs])=>(
                  <div key={cat} onMouseEnter={()=>setHovCat(cat)} onMouseLeave={()=>setHovCat(null)}
                    style={{width:`${(hrs/barTotal)*100}%`,background:catColorMap[cat]||"#6B7280",borderRadius:3,cursor:"pointer",position:"relative",transition:"opacity .15s",opacity:hovCat&&hovCat!==cat?0.4:1}}>
                    {hovCat===cat&&(
                      <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:T1,color:BG,fontSize:10,padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap",zIndex:20,fontWeight:600,pointerEvents:"none"}}>
                        {cat} — {hrs.toFixed(1)}ч
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{margin:"0 14px",height:1,background:BRD}}/>

          {/* Notes */}
          <div style={{flex:1,padding:"10px 14px",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <div style={{width:3,height:12,background:A,borderRadius:1}}/>
              <span style={{fontSize:11,fontWeight:800,fontFamily:ZZZ,color:T1,textTransform:"uppercase",letterSpacing:1}}>Notes</span>
            </div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for the day..."
              style={{flex:1,width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:8,color:T1,fontSize:12,padding:"8px 10px",outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BRD}/>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Day header */}
          <div style={{padding:"10px 14px 6px",display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:700,color:T1}}>{dayLabel}</span>
            <div style={{flex:1}}/>
            {clipboard&&(
              <div onClick={pasteTask} style={{fontSize:11,color:A,padding:"6px 14px",border:`1px solid ${A}44`,borderRadius:20,cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=`${A}44`}>
                Paste
              </div>
            )}
            <div onClick={copyToTomorrow} style={{fontSize:11,color:T2,padding:"6px 14px",border:`1px solid ${BRD}`,borderRadius:20,cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
              Copy to tomorrow
            </div>
          </div>

          {/* Templates */}
          {templates.length>0&&(
            <div style={{padding:"0 14px 6px",display:"flex",gap:4,flexWrap:"wrap",flexShrink:0}}>
              {templates.map((tpl,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:2}}>
                  <div onClick={()=>addFromTemplate(tpl)}
                    style={{fontSize:9,color:T2,padding:"2px 8px",border:`1px solid ${BRD}`,borderRadius:20,cursor:"pointer",background:"#1a1a22",display:"flex",alignItems:"center",gap:4}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
                    <span style={{width:6,height:6,borderRadius:3,background:tpl.color,flexShrink:0}}/>{tpl.title} {fmtHM(tpl.startHour,tpl.startMin)}
                  </div>
                  <div onClick={()=>removeTemplate(i)} style={{fontSize:8,color:"#555",cursor:"pointer",padding:"0 2px"}}>✕</div>
                </div>
              ))}
            </div>
          )}

          {/* Hint */}
          <div style={{padding:"0 14px 4px",flexShrink:0}}>
            <div style={{fontSize:9,color:"#444"}}>Click on grid to create · drag to move · drag bottom edge to resize · click color dot to change</div>
          </div>

          {/* Grid */}
          <div style={{flex:1,overflowY:"auto",padding:"0 14px 8px"}}>
            <div ref={gridRef} onMouseDown={handleGridMouseDown} onClick={()=>setColorPickerId(null)}
              style={{position:"relative",marginLeft:40,height:GRID_H,cursor:"crosshair"}}>

              {/* Time labels + grid lines */}
              {hours.map((h,i)=>(
                <div key={h}>
                  <div style={{position:"absolute",left:-40,top:i*HOUR_H,fontSize:10,color:T2,lineHeight:1,pointerEvents:"none"}}>{pad2(h)}:00</div>
                  <div style={{position:"absolute",top:i*HOUR_H,left:0,right:0,borderTop:`0.5px solid rgba(58,58,68,0.3)`,pointerEvents:"none"}}/>
                </div>
              ))}

              {/* Now line */}
              {showNowLine&&(
                <div style={{position:"absolute",top:nowTop,left:-6,right:0,display:"flex",alignItems:"center",zIndex:1,pointerEvents:"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:A,flexShrink:0}}/>
                  <div style={{flex:1,height:2,background:A}}/>
                </div>
              )}

              {/* Task blocks */}
              {laid.map(item=>{
                const colW=100/item.totalCols;
                const left=item.col*colW;
                const isActive=timers[item.id]!==undefined;
                const isEdit=editingId===item.id;
                const showCP=colorPickerId===item.id;
                const isDragging=drag?.id===item.id;
                const endH2=item.startHour+Math.floor((item.startMin+item.durationMin)/60);
                const endM2=(item.startMin+item.durationMin)%60;
                const tall=item.height>=34;
                const mid=item.height>=24;

                return(
                  <div key={item.id} data-tb="1"
                    onMouseDown={e=>{
                      if(e.target.tagName==="INPUT"||e.target.dataset?.rz||e.target.dataset?.cb||e.target.dataset?.tb2)return;
                      e.preventDefault();
                      setDrag({id:item.id,type:"move",startY:e.clientY,origStartMin:item.startHour*60+item.startMin,origDurationMin:item.durationMin});
                    }}
                    style={{
                      position:"absolute",top:item.top+1,left:`calc(${left}% + 2px)`,width:`calc(${colW}% - 4px)`,height:item.height,
                      background:`linear-gradient(${item.color}${isActive?"40":"26"},${item.color}${isActive?"40":"26"}),${BG}`,borderLeft:`3px solid ${item.color}`,
                      borderRadius:5,cursor:isDragging?"grabbing":"grab",overflow:"visible",
                      zIndex:isDragging?30:showCP?25:2,
                      display:"flex",flexDirection:"column",justifyContent:"center",padding:"2px 8px",
                    }}>

                    {/* Main row */}
                    <div style={{display:"flex",alignItems:"center",gap:4,minHeight:0}}>
                      {/* Color dot */}
                      <div data-cb="1" onClick={e=>{e.stopPropagation();setColorPickerId(showCP?null:item.id)}}
                        style={{width:8,height:8,borderRadius:4,background:item.color,cursor:"pointer",flexShrink:0,border:`1px solid ${item.color}`}}/>

                      {/* Title */}
                      {isEdit?(
                        <input autoFocus value={item.title}
                          onChange={e=>setTasks(p=>p.map(t=>t.id===item.id?{...t,title:e.target.value}:t))}
                          onBlur={()=>setEditingId(null)}
                          onKeyDown={e=>{
                            if(e.key==="Enter"){setEditingId(null)}
                            if(e.key==="Backspace"&&!item.title){e.preventDefault();deleteTask(item.id)}
                            if(e.key==="Escape"){setEditingId(null)}
                          }}
                          onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}
                          style={{flex:1,background:"transparent",border:"none",color:item.color,fontSize:11,fontWeight:600,outline:"none",padding:0,minWidth:0,fontFamily:"inherit"}}
                          placeholder="Name..."/>
                      ):(
                        <div onClick={e=>{e.stopPropagation();setEditingId(item.id)}} onMouseDown={e=>e.stopPropagation()}
                          style={{flex:1,fontSize:11,fontWeight:600,color:item.color,cursor:"text",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {item.title||"Untitled"}
                        </div>
                      )}

                      {/* Copy */}
                      <div data-tb2="1" onClick={e=>{e.stopPropagation();copyTask(item)}}
                        style={{fontSize:9,color:"#555",cursor:"pointer",flexShrink:0,padding:"0 2px",lineHeight:1}}
                        onMouseEnter={e=>e.currentTarget.style.color=A} onMouseLeave={e=>e.currentTarget.style.color="#555"}>⧉</div>

                      {/* Delete */}
                      <div data-tb2="1" onClick={e=>{e.stopPropagation();deleteTask(item.id)}}
                        style={{fontSize:9,color:"#555",cursor:"pointer",flexShrink:0,padding:"0 2px",lineHeight:1}}
                        onMouseEnter={e=>e.currentTarget.style.color=DNG} onMouseLeave={e=>e.currentTarget.style.color="#555"}>✕</div>
                    </div>

                    {/* Time + progress */}
                    {mid&&<div style={{fontSize:9,color:T2,marginTop:1}}>{fmtHM(item.startHour,item.startMin)} – {fmtHM(endH2,endM2)}</div>}
                    {/* Save as template (tall blocks) */}
                    {tall&&item.title&&(
                      <div data-tb2="1" onClick={e=>{e.stopPropagation();saveAsTemplate(item)}}
                        style={{fontSize:8,color:"#444",marginTop:2,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.color=A} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
                        save as template
                      </div>
                    )}

                    {/* Color picker popover */}
                    {showCP&&(
                      <div data-cb="1" style={{position:"absolute",...(item.top<30?{top:item.height+2}:{bottom:item.height+2}),left:0,display:"flex",gap:3,padding:"4px 8px",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:8,zIndex:50}}
                        onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}>
                        {COLORS.map(c=>(
                          <div key={c.name} onClick={()=>{setTasks(p=>p.map(t=>t.id===item.id?{...t,color:c.color,category:c.name}:t));setColorPickerId(null)}} title={c.name}
                            style={{width:16,height:16,borderRadius:8,background:c.color,cursor:"pointer",border:item.color===c.color?`2px solid ${T1}`:"2px solid transparent"}}/>
                        ))}
                      </div>
                    )}

                    {/* Resize handle */}
                    <div data-rz="1"
                      onMouseDown={e=>{
                        e.stopPropagation();e.preventDefault();
                        setDrag({id:item.id,type:"resize",startY:e.clientY,origStartMin:item.startHour*60+item.startMin,origDurationMin:item.durationMin});
                      }}
                      style={{position:"absolute",bottom:0,left:6,right:6,height:8,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{width:20,height:3,borderRadius:2,background:`${item.color}66`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stripe */}
      <div style={{height:8,flexShrink:0,background:`repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 6px)`,borderTop:`1px solid ${BRD}`}}/>
    </div>
  );
}
