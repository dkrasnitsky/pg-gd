import { useState, useEffect, useRef } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,padding:"7px 9px",boxSizing:"border-box"};
const label={fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};

function TextField({lbl,value,onChange,width,placeholder}){
  return (
    <div style={width?{width}:{flex:1}}>
      <div style={label}>{lbl}</div>
      <input value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle}/>
    </div>
  );
}
function CheckField({lbl,checked,onChange}){
  return (
    <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T2,paddingBottom:2,whiteSpace:"nowrap"}}>
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/>{lbl}
    </label>
  );
}

function SearchableEventPicker({events,value,onSelect}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const wrapRef=useRef(null);
  useEffect(()=>{
    const onClickOutside=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onClickOutside);
    return ()=>document.removeEventListener("mousedown",onClickOutside);
  },[]);
  const filtered=events.filter(ev=>ev.eventName.toLowerCase().includes(query.toLowerCase()));
  return (
    <div ref={wrapRef} style={{position:"relative",width:240}}>
      <div style={label}>Событие (из Schedule)</div>
      <input value={open?query:value} onFocus={()=>{setOpen(true);setQuery("")}} onChange={e=>setQuery(e.target.value)}
        placeholder="Поиск по названию..." style={inputStyle}/>
      {open && (
        <div style={{position:"absolute",zIndex:30,top:"100%",left:0,right:0,maxHeight:260,overflowY:"auto",background:"#1a1a22",border:`1px solid ${BRD}`,marginTop:2}}>
          {filtered.length===0 && <div style={{padding:8,fontSize:11,color:T2}}>Ничего не найдено</div>}
          {filtered.map(ev=>(
            <div key={`${ev.eventId}-${ev.eventName}`} onMouseDown={()=>{onSelect(ev.eventName);setOpen(false)}}
              style={{padding:"6px 10px",fontSize:12,cursor:"pointer",color:T1}}
              onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {ev.eventName}{ev.status?<span style={{color:T2}}> ({ev.status})</span>:null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyShop=()=>({name:"",offerIds:"",unlockByProgress:""});
const emptyTask=()=>({groupName:"",Group:"",Index:"",TaskId:"",NeededCount:"",Rewards:"",Priority:"",IsPremium:false,ConditionType:"",IntParams:"",ItemIndex:"",ItemType:"",ItemCategory:""});
const BOOL_COLUMNS=["IsPremium","ShowInPreview","ShowMainRewardsInPreview","AutoPurchase","Cool","HideReward"];

const META_LABELS={
  Style:"Style",LevelOpen:"LevelOpen",MechanicIds:"MechanicIds",InfoStageDuration:"InfoStageDuration",
  ActiveStageDuration:"ActiveStageDuration",AddedStageDuration:"AddedStageDuration",TimeUntilEndActiveStageForPopUp:"TimeUntilEndActiveStageForPopUp",
  MainPrefabName:"MainPrefabName",NotificationPrefabName:"NotificationPrefabName",LobbyButtonPrefabName:"LobbyButtonPrefabName",
  InfoPrefabName:"InfoPrefabName",LobbyViewPrefabName:"LobbyViewPrefabName",
  PremiumPackOnePrice:"PremiumPackOnePrice",PremiumPackOneBonus:"PremiumPackOneBonus",PremiumPackOneSale:"PremiumPackOneSale",
  PremiumPackTwoPrice:"PremiumPackTwoPrice",PremiumPackTwoBonus:"PremiumPackTwoBonus",PremiumPackTwoSale:"PremiumPackTwoSale",
  InfoPopupPreviewRewards:"InfoPopupPreviewRewards",CompletedProgressToDisableMechanics:"CompletedProgressToDisableMechanics",
};

function MechanicsEditor({common,onChange}){
  if(!common)return <div style={{color:T2,fontSize:12,padding:16}}>Лист Common_ для этого события не найден.</div>;
  const patchMeta=p=>onChange({...common,meta:{...common.meta,...p}});
  const patchNotif=p=>onChange({...common,notif:{...common.notif,...p}});
  const updateStage=(index,p)=>onChange({...common,stages:common.stages.map((s,i)=>i===index?{...s,...p}:s)});
  const updateShop=(index,p)=>onChange({...common,shops:common.shops.map((s,i)=>i===index?{...s,...p}:s)});
  const addShop=()=>onChange({...common,shops:[...common.shops,emptyShop()]});
  const removeShop=index=>onChange({...common,shops:common.shops.filter((_,i)=>i!==index)});

  return (
    <div style={{color:T1}}>
      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Основные настройки</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {Object.keys(META_LABELS).map(name=>(
          <TextField key={name} lbl={META_LABELS[name]} value={common.meta[name]} onChange={v=>patchMeta({[name]:v})} width={name==="InfoPopupPreviewRewards"?280:160}/>
        ))}
      </div>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>NotificationBanners</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
        {["StartInfoStage","StartActiveStage","BeforeEndActiveStage","StartAddedStage","EndEvent"].map(name=>(
          <CheckField key={name} lbl={name} checked={common.notif[name]} onChange={v=>patchNotif({[name]:v})}/>
        ))}
      </div>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>SettingsInStages</div>
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}><th style={{padding:"4px 10px"}}></th><th style={{padding:"4px 10px"}}>Info</th><th style={{padding:"4px 10px"}}>Active</th><th style={{padding:"4px 10px"}}>Added</th></tr></thead>
          <tbody>
            {common.stages.map((stage,index)=>(
              <tr key={stage.field} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 10px",color:T2}}>{stage.field}</td>
                <td style={{padding:"4px 10px"}}><input type="checkbox" checked={stage.info} onChange={e=>updateStage(index,{info:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/></td>
                <td style={{padding:"4px 10px"}}><input type="checkbox" checked={stage.active} onChange={e=>updateStage(index,{active:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/></td>
                <td style={{padding:"4px 10px"}}><input type="checkbox" checked={stage.added} onChange={e=>updateStage(index,{added:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Shops (только ссылки на офферы из Offer Constructor)</div>
      <div style={{overflowX:"auto",marginBottom:8}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:140}}>Name</th>
            <th style={{padding:"4px 6px",minWidth:260}}>OfferIds (через запятую)</th>
            <th style={{padding:"4px 6px",width:140}}>UnlockByProgress</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {common.shops.map((shop,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={shop.name} onChange={e=>updateShop(index,{name:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={shop.offerIds} onChange={e=>updateShop(index,{offerIds:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={shop.unlockByProgress} onChange={e=>updateShop(index,{unlockByProgress:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}>{common.shops.length>1&&<button onClick={()=>removeShop(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:16}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addShop} style={{padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ магазин</button>
    </div>
  );
}

function ProgressLevelEditor({title,tab,onChange}){
  const parsed=tab.parsed;
  if(!parsed)return <RawTablePreview title={title} rows={tab.rows}/>;
  const patchMain=p=>onChange({...parsed,mainFields:{...parsed.mainFields,...p}});
  const updateItem=(index,p)=>onChange({...parsed,items:parsed.items.map((it,i)=>i===index?{...it,...p}:it)});
  const addItem=()=>{
    const blank={};
    parsed.tableColumns.forEach(col=>{blank[col]=BOOL_COLUMNS.includes(col)?false:""});
    onChange({...parsed,items:[...parsed.items,blank]});
  };
  const removeItem=index=>onChange({...parsed,items:parsed.items.filter((_,i)=>i!==index)});
  const boolLike=v=>v===true||String(v).trim().toUpperCase()==="TRUE";

  return (
    <div style={{color:T1}}>
      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{title} — основная награда</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20,alignItems:"flex-end"}}>
        {Object.keys(parsed.mainFields).map(name=>BOOL_COLUMNS.includes(name)?(
          <CheckField key={name} lbl={name} checked={boolLike(parsed.mainFields[name])} onChange={v=>patchMain({[name]:v})}/>
        ):(
          <TextField key={name} lbl={name} value={parsed.mainFields[name]} onChange={v=>patchMain({[name]:v})} width={220}/>
        ))}
      </div>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>таблица наград</div>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            {parsed.tableColumns.map(col=><th key={col} style={{padding:"4px 6px",minWidth:col==="CellIds"?110:90}}>{col}</th>)}
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {parsed.items.map((item,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                {parsed.tableColumns.map(col=>(
                  <td key={col} style={{padding:"4px 6px"}}>
                    {BOOL_COLUMNS.includes(col)
                      ? <input type="checkbox" checked={boolLike(item[col])} onChange={e=>updateItem(index,{[col]:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/>
                      : <input value={item[col]??""} onChange={e=>updateItem(index,{[col]:e.target.value})} style={inputStyle}/>}
                  </td>
                ))}
                <td style={{padding:"4px 6px"}}>{parsed.items.length>1&&<button onClick={()=>removeItem(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:16}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addItem} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ награда</button>
    </div>
  );
}

function RawTablePreview({title,rows}){
  return (
    <div style={{color:T1}}>
      <div style={{fontSize:11,color:T2,marginBottom:10}}>{title} — пока только просмотр (сложная структура наград по уровням, редактирование добавим отдельно).</div>
      <div style={{border:`1px solid ${BRD}`,padding:10,overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:10,whiteSpace:"nowrap"}}>
          <tbody>
            {(rows||[]).slice(0,80).map((row,ri)=>(
              <tr key={ri} style={{borderTop:ri>0?`1px solid ${BRD}`:"none"}}>
                {row.map((cell,ci)=>(
                  <td key={ci} style={{padding:"3px 8px",color:cell===""||cell===undefined?BRD:T1}}>{String(cell??"")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {(rows||[]).length>80 && <div style={{fontSize:10,color:T2,marginTop:6}}>...и ещё {rows.length-80} строк</div>}
      </div>
    </div>
  );
}

function TaskIdField({value,onChange,taskReference}){
  const [open,setOpen]=useState(false);
  const wrapRef=useRef(null);
  useEffect(()=>{
    const onClickOutside=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onClickOutside);
    return ()=>document.removeEventListener("mousedown",onClickOutside);
  },[]);
  const valueStr=value===undefined||value===null?"":String(value);
  const filtered=taskReference.filter(t=>String(t.taskId).includes(valueStr)||t.description.toLowerCase().includes(valueStr.toLowerCase())).slice(0,60);
  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <input value={valueStr} autoComplete="off" onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true)}} style={inputStyle}/>
      {open && filtered.length>0 && (
        <div style={{position:"absolute",zIndex:30,top:"100%",left:0,minWidth:280,maxHeight:220,overflowY:"auto",background:"#1a1a22",border:`1px solid ${BRD}`,marginTop:2}}>
          {filtered.map(t=>(
            <div key={t.taskId} onMouseDown={()=>{onChange(String(t.taskId));setOpen(false)}}
              style={{padding:"6px 10px",fontSize:11,cursor:"pointer",color:T1,whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {t.taskId} — {t.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksEditor({tasks,onChange}){
  const [taskReference,setTaskReference]=useState([]);
  useEffect(()=>{
    window.workspaceGoogle?.getTaskReference().then(list=>{if(Array.isArray(list))setTaskReference(list)}).catch(()=>{});
  },[]);
  const updateTask=(index,p)=>onChange(tasks.map((t,i)=>i===index?{...t,...p}:t));
  const addTask=()=>onChange([...tasks,emptyTask()]);
  const removeTask=index=>onChange(tasks.filter((_,i)=>i!==index));

  if(!tasks)return <div style={{color:T2,fontSize:12,padding:16}}>Лист Tasks_Group_ для этого события не найден.</div>;

  return (
    <div style={{color:T1}}>
      <div style={{fontSize:10,color:T2,marginBottom:8}}>TaskId — выбор из справочника задач (Id — описание для GD), можно ввести номер вручную.</div>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:110}}>GroupName</th>
            <th style={{padding:"4px 6px",width:60}}>Group</th>
            <th style={{padding:"4px 6px",width:70}}>Index</th>
            <th style={{padding:"4px 6px",width:160}}>TaskId</th>
            <th style={{padding:"4px 6px",width:100}}>NeededCount</th>
            <th style={{padding:"4px 6px",minWidth:130}}>Rewards</th>
            <th style={{padding:"4px 6px",width:70}}>Priority</th>
            <th style={{padding:"4px 6px",width:80}}>IsPremium</th>
            <th style={{padding:"4px 6px",width:110}}>ConditionType</th>
            <th style={{padding:"4px 6px",width:90}}>IntParams</th>
            <th style={{padding:"4px 6px",width:90}}>ItemIndex</th>
            <th style={{padding:"4px 6px",width:90}}>ItemType</th>
            <th style={{padding:"4px 6px",width:100}}>ItemCategory</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {tasks.map((task,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={task.groupName} onChange={e=>updateTask(index,{groupName:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.Group} onChange={e=>updateTask(index,{Group:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.Index} onChange={e=>updateTask(index,{Index:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><TaskIdField value={task.TaskId} onChange={v=>updateTask(index,{TaskId:v})} taskReference={taskReference}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.NeededCount} onChange={e=>updateTask(index,{NeededCount:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.Rewards} onChange={e=>updateTask(index,{Rewards:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.Priority} onChange={e=>updateTask(index,{Priority:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={task.IsPremium} onChange={e=>updateTask(index,{IsPremium:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.ConditionType} onChange={e=>updateTask(index,{ConditionType:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.IntParams} onChange={e=>updateTask(index,{IntParams:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.ItemIndex} onChange={e=>updateTask(index,{ItemIndex:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.ItemType} onChange={e=>updateTask(index,{ItemType:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={task.ItemCategory} onChange={e=>updateTask(index,{ItemCategory:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}>{tasks.length>1&&<button onClick={()=>removeTask(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:16}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addTask} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ задача</button>
    </div>
  );
}

export default function TemplateEventSimulator(){
  const [target,setTarget]=useState("prod");
  const [events,setEvents]=useState([]);
  const [selectedName,setSelectedName]=useState("");
  const [loaded,setLoaded]=useState(null);
  const [view,setView]=useState("mechanics");
  const [saveAsName,setSaveAsName]=useState("");
  const [status,setStatus]=useState({state:"idle",message:""});

  const syncList=async(nextTarget=target)=>{
    setStatus({state:"loading",message:"Читаем список событий..."});
    try{
      const result=await window.workspaceGoogle?.syncTemplateEvents(nextTarget);
      setEvents(result?.events||[]);
      setStatus({state:"success",message:`Загружено: ${result?.events?.length||0}`});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  useEffect(()=>{syncList()},[]);

  const openEvent=async name=>{
    setSelectedName(name);
    setSaveAsName("");
    setLoaded(null);
    setView("mechanics");
    setStatus({state:"loading",message:"Загружаем настройки..."});
    try{
      const result=await window.workspaceGoogle?.loadTemplateEvent({eventName:name,target});
      setLoaded(result);
      setStatus({state:"idle",message:""});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  const save=async(asNew)=>{
    if(!loaded)return;
    if(asNew&&!saveAsName.trim()){setStatus({state:"error",message:"Введите название для нового события"});return}
    setStatus({state:"loading",message:asNew?"Сохраняем как новое...":"Сохраняем..."});
    try{
      const result=await window.workspaceGoogle?.saveTemplateEvent({
        eventName:selectedName,
        saveAsName:asNew?saveAsName.trim():undefined,
        common:loaded.common,
        tasks:loaded.tasks,
        extraTabs:loaded.extraTabs,
        target,
      });
      setStatus({state:"success",message:`Сохранено: ${result.eventName}`});
      if(asNew){
        await syncList();
        openEvent(result.eventName);
      }
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  const extraTabs=loaded?.extraTabs||[];

  return (
    <div style={{color:T1}}>
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"flex-end"}}>
        <SearchableEventPicker events={events} value={selectedName} onSelect={openEvent}/>
        <div style={{width:120}}>
          <div style={label}>Таблица</div>
          <select value={target} onChange={e=>{setTarget(e.target.value);syncList(e.target.value)}} style={inputStyle}>
            <option value="prod">Прод</option>
            <option value="test">Тест</option>
          </select>
        </div>
        <button onClick={()=>syncList()} style={{padding:"9px 16px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:12,cursor:"pointer"}}>Обновить список</button>
      </div>
      {status.message && <div style={{marginBottom:14,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      {loaded && (
        <>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <button onClick={()=>setView("mechanics")} style={{padding:"9px 18px",background:view==="mechanics"?A:"transparent",border:`1px solid ${A}`,color:view==="mechanics"?"#000":A,fontSize:12,fontWeight:700,cursor:"pointer"}}>Механики</button>
            <button onClick={()=>setView("tasks")} style={{padding:"9px 18px",background:view==="tasks"?A:"transparent",border:`1px solid ${A}`,color:view==="tasks"?"#000":A,fontSize:12,fontWeight:700,cursor:"pointer"}}>Задачи</button>
            {extraTabs.map(tab=>(
              <button key={tab.title} onClick={()=>setView(tab.title)} style={{padding:"9px 18px",background:view===tab.title?A:"transparent",border:`1px solid ${A}`,color:view===tab.title?"#000":A,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{tab.label}</button>
            ))}
          </div>

          {view==="mechanics" && <MechanicsEditor common={loaded.common} onChange={c=>setLoaded(prev=>({...prev,common:c}))}/>}
          {view==="tasks" && <TasksEditor tasks={loaded.tasks} onChange={t=>setLoaded(prev=>({...prev,tasks:t}))}/>}
          {extraTabs.map((tab,tabIndex)=>view===tab.title && <ProgressLevelEditor key={tab.title} title={tab.label} tab={tab}
            onChange={parsed=>setLoaded(prev=>({...prev,extraTabs:prev.extraTabs.map((t,i)=>i===tabIndex?{...t,parsed}:t)}))}/>)}

          <div style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:24,paddingBottom:24,borderTop:`1px solid ${BRD}`,paddingTop:20}}>
            <button onClick={()=>save(false)} disabled={status.state==="loading"} style={{padding:"10px 24px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Сохранить</button>
            <div style={{width:220}}>
              <div style={label}>Новое название (для «Сохранить как новый»)</div>
              <input value={saveAsName} onChange={e=>setSaveAsName(e.target.value)} placeholder="Например: Lunar2027" style={inputStyle}/>
            </div>
            <button onClick={()=>save(true)} disabled={status.state==="loading"} style={{padding:"10px 24px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:12,fontWeight:800,cursor:"pointer"}}>Сохранить как новый</button>
          </div>
        </>
      )}
    </div>
  );
}
