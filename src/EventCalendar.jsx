import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCopy, FiPlus, FiTrash2, FiX } from "react-icons/fi";

const TYPES={"Pixel Pass":"#ff7348",Lottery:"#c3d8c5","Card Roulette":"#8f83e8","Template Event":"#e8b26b","Personal Event":"#62a7e8","Core Event":"#e77c91"};
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const parse=value=>new Date(`${value}T12:00:00`);
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const ROW_HEIGHT=52;
const TOP_PADDING=18;

function LotteryConfigurator({event,onClose,onSave}){
  const [partitions,setPartitions]=useState(()=>{
    if(event.lotteryConfig?.partitions?.length)return event.lotteryConfig.partitions;
    return [{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",style:"",segment:"",startDateTime:`${event.start}T${event.startTime||"10:00"}`,endDateTime:`${event.end}T${event.endTime||"10:00"}`,balanceName:""}];
  });
  const [segments,setSegments]=useState([]);
  const [balances,setBalances]=useState([]);
  const [status,setStatus]=useState({state:"idle",message:""});
  const [idLoading,setIdLoading]=useState(false);

  useEffect(()=>{
    window.workspaceGoogle?.getSegments().then(list=>{if(Array.isArray(list))setSegments(list)}).catch(()=>{});
    window.workspaceStore?.read("lotteryBalances").then(list=>{if(Array.isArray(list))setBalances(list)}).catch(()=>{});
  },[]);

  useEffect(()=>{
    setPartitions(prev=>{
      if(prev.length!==1||prev[0].id)return prev;
      setIdLoading(true);
      window.workspaceGoogle?.getNextLotteryId().then(nextId=>{
        if(nextId)setPartitions(cur=>cur.map((p,i)=>i===0&&!p.id?{...p,id:String(nextId)}:p));
      }).catch(()=>{}).finally(()=>setIdLoading(false));
      return prev;
    });
  },[]);

  const updatePartition=(uid,patch)=>setPartitions(prev=>prev.map(p=>p.uid===uid?{...p,...patch}:p));
  const addPartition=()=>setPartitions(prev=>[...prev,{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",style:"",segment:"",startDateTime:prev[0]?.startDateTime||"",endDateTime:prev[0]?.endDateTime||"",balanceName:""}]);
  const removePartition=uid=>setPartitions(prev=>prev.filter(p=>p.uid!==uid));

  const saveDraft=()=>{onSave({partitions});onClose()};

  const apply=async(target)=>{
    setStatus({state:"loading",message:`Создаём конфиг${target==="test"?" (ТЕСТ)":""}…`});
    const results=[];
    for(const partition of partitions){
      const balance=balances.find(b=>b.name===partition.balanceName);
      const balanceItems=balance?Object.values(balance.chests).flat().map(item=>({containerId:item.label,containerType:"SingleItem",category:item.category||"",itemType:item.itemType||"",itemId:item.group,alternativeReward:item.alternativeReward||"",showInPreview:!!item.showInPreview,itemSubtype:item.itemSubtype||"",count:item.drop,dropChance:item.weight})):[];
      try{
        const result=await window.workspaceGoogle?.applyLotteryPartition({
          name:partition.name,id:partition.id,style:partition.style,segment:partition.segment,
          startDateTime:partition.startDateTime?`${partition.startDateTime}:00`:"",
          endDateTime:partition.endDateTime?`${partition.endDateTime}:00`:"",
          balanceItems,balanceName:partition.balanceName,target,
        });
        results.push(`✓ ${partition.name}: ${result.names.join(", ")}`);
      }catch(error){
        results.push(`✗ ${partition.name}: ${error.message||"ошибка"}`);
      }
    }
    onSave({partitions});
    setStatus({state:results.some(r=>r.startsWith("✗"))?"error":"success",message:results.join("\n")});
  };

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:60}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(720px,100%)",maxHeight:"90vh",overflowY:"auto"}}>
        <header><div><span>LOTTERY CONFIG</span><h2>{event.title}</h2></div><button onClick={onClose}><FiX/></button></header>
        {partitions.map((p,index)=>(
          <div key={p.uid} style={{border:"1px solid #59645b",borderRadius:2,padding:12,marginBottom:12,position:"relative"}}>
            {partitions.length>1&&<button type="button" onClick={()=>removePartition(p.uid)} style={{position:"absolute",top:8,right:8,background:"transparent",border:"none",color:"#ff5d55",cursor:"pointer"}}><FiTrash2/></button>}
            <label>Name<input value={p.name} onChange={e=>updatePartition(p.uid,{name:e.target.value})}/></label>
            <div className="form-columns">
              <label>Id{index===0&&idLoading?" (загрузка…)":""}<input value={p.id} onChange={e=>updatePartition(p.uid,{id:e.target.value})} placeholder={index>0?"впишите вручную":""}/></label>
              <label>style<input value={p.style} onChange={e=>updatePartition(p.uid,{style:e.target.value})}/></label>
            </div>
            <label>segment<select value={p.segment} onChange={e=>updatePartition(p.uid,{segment:e.target.value})}><option value="">—</option>{segments.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
            <div className="form-columns">
              <label>start date-time<input type="datetime-local" value={p.startDateTime} onChange={e=>updatePartition(p.uid,{startDateTime:e.target.value})}/></label>
              <label>end date-time<input type="datetime-local" value={p.endDateTime} onChange={e=>updatePartition(p.uid,{endDateTime:e.target.value})}/></label>
            </div>
            <label>lottery balance<select value={p.balanceName} onChange={e=>updatePartition(p.uid,{balanceName:e.target.value})}><option value="">—</option>{balances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}</select></label>
          </div>
        ))}
        <button type="button" className="secondary-action" onClick={addPartition} style={{marginBottom:12}}><FiPlus/></button>
        {status.message&&<div className={`config-status ${status.state}`} style={{whiteSpace:"pre-line"}}>{status.message}</div>}
        <footer>
          <button className="primary-action" onClick={saveDraft}>Ок</button>
          <button className="secondary-action" disabled={status.state==="loading"} onClick={()=>apply("prod")}>Создать конфиг</button>
          <button className="secondary-action" disabled={status.state==="loading"} onClick={()=>apply("test")}>Создать конфиг ТЕСТ</button>
        </footer>
      </div>
    </div>
  );
}

export default function EventCalendar(){
  const today=new Date();
  const [cursor,setCursor]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [events,setEvents]=useState([]);
  const [selectedId,setSelectedId]=useState(null);
  const [ready,setReady]=useState(false);
  const [gesture,setGesture]=useState(null);
  const [configState,setConfigState]=useState({status:"idle",message:""});
  const [showConfigurator,setShowConfigurator]=useState(false);
  const days=useMemo(()=>Array.from({length:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()},(_,index)=>new Date(cursor.getFullYear(),cursor.getMonth(),index+1)),[cursor]);
  const monthStart=iso(days[0]),monthEnd=iso(days[days.length-1]);
  const visible=events.filter(event=>event.end>=monthStart&&event.start<=monthEnd);
  const maxLane=visible.reduce((max,event,index)=>Math.max(max,Number.isInteger(event.lane)?event.lane:index),-1);
  const timelineHeight=Math.max(500,TOP_PADDING+(maxLane+1)*ROW_HEIGHT+28);
  const selected=events.find(event=>event.id===selectedId);

  useEffect(()=>{let live=true;(async()=>{const saved=await window.workspaceStore?.read("calendar");if(live&&Array.isArray(saved))setEvents(saved.map((event,index)=>({...event,lane:Number.isInteger(event.lane)?event.lane:index})));if(live)setReady(true)})().catch(()=>setReady(true));return()=>{live=false}},[]);
  useEffect(()=>{if(ready)window.workspaceStore?.write("calendar",events).catch(console.error)},[events,ready]);
  useEffect(()=>{if(!gesture)return;const move=event=>{const deltaX=Math.round((event.clientX-gesture.x)/(gesture.width/days.length));const deltaY=gesture.mode==="move"?Math.round((event.clientY-gesture.y)/ROW_HEIGHT):0;if(deltaX===gesture.deltaX&&deltaY===gesture.deltaY)return;setGesture(current=>({...current,deltaX,deltaY}));setEvents(current=>current.map(item=>{if(item.id!==gesture.id)return item;const start=parse(gesture.start),end=parse(gesture.end);if(gesture.mode==="move"){start.setDate(start.getDate()+deltaX);end.setDate(end.getDate()+deltaX)}else if(gesture.mode==="left")start.setDate(start.getDate()+clamp(deltaX,-365,daysBetween(gesture.start,gesture.end)));else end.setDate(end.getDate()+Math.max(deltaX,-daysBetween(gesture.start,gesture.end)));return{...item,start:iso(start),end:iso(end),lane:gesture.mode==="move"?Math.max(0,gesture.lane+deltaY):item.lane}}))};const up=()=>setGesture(null);window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)}},[gesture,days.length]);

  const createAt=day=>{const date=iso(day);const lane=visible.reduce((max,event,index)=>Math.max(max,Number.isInteger(event.lane)?event.lane:index),-1)+1;const item={id:`event-${Date.now()}`,title:"Новый ивент",start:date,end:date,startTime:"10:00",endTime:"18:00",type:"Pixel Pass",notes:"",lane};setEvents(current=>[...current,item]);setSelectedId(item.id)};
  const update=patch=>setEvents(current=>current.map(event=>event.id===selectedId?{...event,...patch}:event));
  const remove=()=>{if(!selected)return;setEvents(current=>current.filter(event=>event.id!==selectedId));setSelectedId(null)};
  const duplicate=()=>{if(!selected)return;const lane=visible.reduce((max,event,index)=>Math.max(max,Number.isInteger(event.lane)?event.lane:index),-1)+1;const copy={...selected,id:`event-${Date.now()}`,title:`${selected.title} — копия`,lane};setEvents(current=>[...current,copy]);setSelectedId(copy.id)};
  const createConfig=()=>{
    if(!selected)return;
    if(selected.type!=="Lottery"){setConfigState({status:"error",message:"Настройка пока доступна только для типа Lottery"});return}
    setConfigState({status:"idle",message:""});
    setShowConfigurator(true);
  };
  const changeMonth=delta=>setCursor(current=>new Date(current.getFullYear(),current.getMonth()+delta,1));
  const beginGesture=(event,item,mode,lane)=>{event.stopPropagation();const width=event.currentTarget.closest(".calendar-timeline").getBoundingClientRect().width;setGesture({id:item.id,mode,x:event.clientX,y:event.clientY,width,start:item.start,end:item.end,lane,deltaX:0,deltaY:0})};

  return <div className="event-calendar-page">
    <header className="feature-header"><div><div className="feature-kicker">LIVEOPS PLANNING SYSTEM</div><h1>График ивентов</h1></div><div className="month-switch"><button aria-label="Предыдущий месяц" onClick={()=>changeMonth(-1)}><FiChevronLeft/></button><strong>{cursor.toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</strong><button aria-label="Следующий месяц" onClick={()=>changeMonth(1)}><FiChevronRight/></button><button className="today-action" onClick={()=>setCursor(new Date(today.getFullYear(),today.getMonth(),1))}>Сегодня</button></div></header>
    <div className="calendar-board">
      <div className="calendar-days" style={{gridTemplateColumns:`repeat(${days.length},minmax(34px,1fr))`}}>{days.map(day=><button key={iso(day)} className={iso(day)===iso(today)?"today":""} onClick={()=>createAt(day)}><span>{day.toLocaleDateString("ru-RU",{weekday:"short"})}</span><b>{day.getDate()}</b></button>)}</div>
      <div className="calendar-timeline" style={{"--days":days.length,height:timelineHeight}} onDoubleClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();createAt(days[clamp(Math.floor((event.clientX-rect.left)/(rect.width/days.length)),0,days.length-1)])}}}>
        <div className="calendar-grid-lines" style={{gridTemplateColumns:`repeat(${days.length},1fr)`}}>{days.map(day=><i key={iso(day)} className={iso(day)===iso(today)?"today":""} onClick={()=>createAt(day)}/>)}</div>
        {visible.map((item,index)=>{const start=clamp(daysBetween(monthStart,item.start),0,days.length-1);const end=clamp(daysBetween(monthStart,item.end),0,days.length-1);const lane=Number.isInteger(item.lane)?item.lane:index;return <div key={item.id} className="calendar-event" style={{left:`${start/days.length*100}%`,width:`${(end-start+1)/days.length*100}%`,top:TOP_PADDING+lane*ROW_HEIGHT,background:TYPES[item.type]}} onPointerDown={event=>beginGesture(event,item,"move",lane)} onDoubleClick={event=>{event.stopPropagation();setSelectedId(item.id)}}><i className="resize left" onPointerDown={event=>beginGesture(event,item,"left",lane)}/><span>{item.title}</span><small>{item.type}</small><i className="resize right" onPointerDown={event=>beginGesture(event,item,"right",lane)}/></div>})}
        {!visible.length&&<button className="calendar-empty" onClick={()=>createAt(days[Math.floor(days.length/2)])}><FiPlus/>Добавить первый ивент</button>}
      </div>
    </div>
    {selected&&<div className="event-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedId(null)}}><div className="event-modal"><header><div><span>EVENT DATA</span><h2>{selected.title}</h2></div><button onClick={()=>setSelectedId(null)}><FiX/></button></header><label>Название<input value={selected.title} onChange={event=>{update({title:event.target.value});setConfigState({status:"idle",message:""})}}/></label><div className="form-columns"><label>Дата с<input type="date" value={selected.start} onInput={event=>update({start:event.currentTarget.value,end:event.currentTarget.value>selected.end?event.currentTarget.value:selected.end})}/></label><label>Дата до<input type="date" value={selected.end} onInput={event=>update({end:event.currentTarget.value<selected.start?selected.start:event.currentTarget.value})}/></label></div><div className="form-columns"><label>Время с<input type="time" value={selected.startTime} onInput={event=>update({startTime:event.currentTarget.value})}/></label><label>Время до<input type="time" value={selected.endTime} onInput={event=>update({endTime:event.currentTarget.value})}/></label></div><label>Тип ивента<select value={selected.type} onChange={event=>{update({type:event.target.value});setConfigState({status:"idle",message:""})}}>{Object.keys(TYPES).map(type=><option key={type}>{type}</option>)}</select></label><label>Примечание<textarea maxLength={500} value={selected.notes} onChange={event=>update({notes:event.target.value})}/><small>{selected.notes.length}/500</small></label>{configState.message&&<div className={`config-status ${configState.status}`}>{configState.message}</div>}<footer><button className="danger-action" onClick={remove}><FiTrash2/>Удалить</button><button className="secondary-action" onClick={duplicate}><FiCopy/>Дублировать</button><button className="secondary-action" disabled={configState.status==="loading"} onClick={createConfig}>Настроить</button><button className="primary-action" onClick={()=>setSelectedId(null)}>Готово</button></footer></div></div>}
    {showConfigurator&&selected&&<LotteryConfigurator event={selected} onClose={()=>setShowConfigurator(false)} onSave={cfg=>update({lotteryConfig:cfg})}/>}
  </div>;
}
