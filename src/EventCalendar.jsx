import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCopy, FiPlus, FiTrash2, FiX } from "react-icons/fi";

const TYPES={"Pixel Pass":"#ff7348",Lottery:"#c3d8c5","Card Roulette":"#8f83e8","Ads Roulette":"#d97757","Template Event":"#e8b26b","Personal Event":"#62a7e8","Core Event":"#e77c91",Offers:"#6bbf8f"};
const TYPE_ORDER=["Pixel Pass","Template Event","Lottery","Card Roulette","Personal Event","Ads Roulette","Core Event","Offers"];
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const parse=value=>new Date(`${value}T12:00:00`);
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const ROW_HEIGHT=35;
const TOP_PADDING=18;

function LotteryConfigurator({event,onClose,onSave}){
  const [partitions,setPartitions]=useState(()=>{
    if(event.lotteryConfig?.partitions?.length)return event.lotteryConfig.partitions;
    return [{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",committed:false,style:"",segment:"",startDateTime:`${event.start}T${event.startTime||"10:00"}`,endDateTime:`${event.end}T${event.endTime||"10:00"}`,balanceName:""}];
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
  const addPartition=()=>setPartitions(prev=>[...prev,{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",committed:false,style:"",segment:"",startDateTime:prev[0]?.startDateTime||"",endDateTime:prev[0]?.endDateTime||"",balanceName:""}]);
  const removePartition=uid=>setPartitions(prev=>prev.filter(p=>p.uid!==uid));

  const saveDraft=()=>{onSave({partitions});onClose()};

  const apply=async(target)=>{
    setStatus({state:"loading",message:`Создаём конфиг${target==="test"?" (ТЕСТ)":""}…`});
    const results=[];
    const updated=[...partitions];
    for(let index=0;index<partitions.length;index++){
      const partition=partitions[index];
      const balance=balances.find(b=>b.name===partition.balanceName);
      const balanceItems=balance?Object.values(balance.chests).flatMap((chestItemList,ci)=>{
        const start=(ci+1)*100+1;
        return (chestItemList||[]).map((item,idx)=>({
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
      }):[];
      try{
        const result=await window.workspaceGoogle?.applyLotteryPartition({
          name:partition.name,id:partition.id,style:partition.style,segment:partition.segment,
          startDateTime:partition.startDateTime?`${partition.startDateTime}:00`:"",
          endDateTime:partition.endDateTime?`${partition.endDateTime}:00`:"",
          balanceItems,balanceName:partition.balanceName,target,
        });
        results.push(`✓ ${partition.name}: ${result.names.join(", ")}`);
        updated[index]={...updated[index],committed:true};
      }catch(error){
        results.push(`✗ ${partition.name}: ${error.message||"ошибка"}`);
      }
    }
    setPartitions(updated);
    onSave({partitions:updated});
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
              <label>Id{index===0&&idLoading?" (загрузка…)":p.committed?" (создан)":""}<input value={p.id} disabled={p.committed} onChange={e=>updatePartition(p.uid,{id:e.target.value})} placeholder={index>0?"впишите вручную":""}/></label>
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

function CardRouletteConfigurator({event,onClose,onSave}){
  const [partitions,setPartitions]=useState(()=>{
    if(event.cardRouletteConfig?.partitions?.length)return event.cardRouletteConfig.partitions;
    return [{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",style:"",segment:"",startDateTime:`${event.start}T${event.startTime||"10:00"}`,endDateTime:`${event.end}T${event.endTime||"10:00"}`,balanceName:""}];
  });
  const [segments,setSegments]=useState([]);
  const [balances,setBalances]=useState([]);
  const [status,setStatus]=useState({state:"idle",message:""});
  const [idLoading,setIdLoading]=useState(false);

  useEffect(()=>{
    window.workspaceGoogle?.getSegments().then(list=>{if(Array.isArray(list))setSegments(list)}).catch(()=>{});
    window.workspaceStore?.read("cardRouletteBalances").then(list=>{if(Array.isArray(list))setBalances(list)}).catch(()=>{});
  },[]);

  useEffect(()=>{
    setPartitions(prev=>{
      if(prev.length!==1||prev[0].id)return prev;
      setIdLoading(true);
      window.workspaceGoogle?.getNextCardRouletteId(false).then(nextId=>{
        if(nextId)setPartitions(cur=>cur.map((p,i)=>i===0&&!p.id?{...p,id:String(nextId)}:p));
      }).catch(()=>{}).finally(()=>setIdLoading(false));
      return prev;
    });
  },[]);

  const updatePartition=(uid,patch)=>setPartitions(prev=>prev.map(p=>p.uid===uid?{...p,...patch}:p));
  const addPartition=()=>setPartitions(prev=>[...prev,{uid:`p-${Date.now()}`,name:event.title.replace(/\s+/g,""),id:"",committed:false,style:"",segment:"",startDateTime:prev[0]?.startDateTime||"",endDateTime:prev[0]?.endDateTime||"",balanceName:""}]);
  const removePartition=uid=>setPartitions(prev=>prev.filter(p=>p.uid!==uid));

  const saveDraft=()=>{onSave({partitions});onClose()};

  const apply=async(target)=>{
    setStatus({state:"loading",message:`Создаём конфиг${target==="test"?" (ТЕСТ)":""}…`});
    const results=[];
    const updated=[...partitions];
    for(let index=0;index<partitions.length;index++){
      const partition=partitions[index];
      const balance=balances.find(b=>b.name===partition.balanceName);
      const chests=balance?balance.chests.map((chestItems,ci)=>({
        chestNumber:ci+1,
        items:(chestItems||[]).map((item,ii)=>({cellId:ii+1,...item})),
      })):[];
      const openPrices=balance?(balance.openPriceValues||"").split(",").map(v=>v.trim()).filter(Boolean).map(v=>`${balance.openPriceCurrency}:${v}`).join(","):"";
      try{
        const result=await window.workspaceGoogle?.applyCardRoulettePartition({
          name:partition.name,id:partition.id,style:partition.style,segment:partition.segment,
          startDateTime:partition.startDateTime?`${partition.startDateTime}:00`:"",
          endDateTime:partition.endDateTime?`${partition.endDateTime}:00`:"",
          discount:balance?.discount??"",openPrices,levelOpen:balance?.levelOpen??"",
          chests,target,
        });
        results.push(`✓ ${partition.name}: ${result.names.settings}, ${result.names.chests}`);
        updated[index]={...updated[index],committed:true};
      }catch(error){
        results.push(`✗ ${partition.name}: ${error.message||"ошибка"}`);
      }
    }
    setPartitions(updated);
    onSave({partitions:updated});
    setStatus({state:results.some(r=>r.startsWith("✗"))?"error":"success",message:results.join("\n")});
  };

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:60}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(720px,100%)",maxHeight:"90vh",overflowY:"auto"}}>
        <header><div><span>CARD ROULETTE CONFIG</span><h2>{event.title}</h2></div><button onClick={onClose}><FiX/></button></header>
        {partitions.map((p,index)=>(
          <div key={p.uid} style={{border:"1px solid #59645b",borderRadius:2,padding:12,marginBottom:12,position:"relative"}}>
            {partitions.length>1&&<button type="button" onClick={()=>removePartition(p.uid)} style={{position:"absolute",top:8,right:8,background:"transparent",border:"none",color:"#ff5d55",cursor:"pointer"}}><FiTrash2/></button>}
            <label>Name<input value={p.name} onChange={e=>updatePartition(p.uid,{name:e.target.value})}/></label>
            <div className="form-columns">
              <label>Id{index===0&&idLoading?" (загрузка…)":p.committed?" (создан)":""}<input value={p.id} disabled={p.committed} onChange={e=>updatePartition(p.uid,{id:e.target.value})} placeholder={index>0?"впишите вручную":""}/></label>
              <label>style<input value={p.style} onChange={e=>updatePartition(p.uid,{style:e.target.value})}/></label>
            </div>
            <label>segment<select value={p.segment} onChange={e=>updatePartition(p.uid,{segment:e.target.value})}><option value="">—</option>{segments.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
            <div className="form-columns">
              <label>start date-time<input type="datetime-local" value={p.startDateTime} onChange={e=>updatePartition(p.uid,{startDateTime:e.target.value})}/></label>
              <label>end date-time<input type="datetime-local" value={p.endDateTime} onChange={e=>updatePartition(p.uid,{endDateTime:e.target.value})}/></label>
            </div>
            <label>card roulette balance<select value={p.balanceName} onChange={e=>updatePartition(p.uid,{balanceName:e.target.value})}><option value="">—</option>{balances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}</select></label>
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

const plusDaysFormatted=(isoLocal,days)=>{
  const d=new Date(isoLocal);
  if(Number.isNaN(d.getTime()))return "";
  d.setDate(d.getDate()+days);
  const pad=n=>String(n).padStart(2,"0");
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${d.getHours()}:${pad(d.getMinutes())}:00`;
};

function PersonalEventConfigurator({event,onClose,onSave}){
  const [subtype,setSubtype]=useState(event.personalEventConfig?.subtype||"Board");
  const [startDate,setStartDate]=useState(event.personalEventConfig?.startDate||`${event.start}T${event.startTime||"09:00"}`);
  const [endDate,setEndDate]=useState(event.personalEventConfig?.endDate||`${event.end}T${event.endTime||"09:00"}`);
  const [endCompletionDate,setEndCompletionDate]=useState(event.personalEventConfig?.endCompletionDate||plusDaysFormatted(event.personalEventConfig?.endDate||`${event.end}T${event.endTime||"09:00"}`,2));
  const [expression,setExpression]=useState(event.personalEventConfig?.expression||"");
  const [groupId,setGroupId]=useState(event.personalEventConfig?.groupId??"");
  const [note,setNote]=useState(event.personalEventConfig?.note||"");
  const [segment,setSegment]=useState(event.personalEventConfig?.segment||"");
  const [balanceName,setBalanceName]=useState(event.personalEventConfig?.balanceName||"");
  const [segments,setSegments]=useState([]);
  const [segmentsError,setSegmentsError]=useState(false);
  const [segmentExpressions,setSegmentExpressions]=useState({});
  const [balances,setBalances]=useState([]);
  const [nextId,setNextId]=useState(null);
  const [preview,setPreview]=useState(null);
  const [status,setStatus]=useState({state:"idle",message:""});

  const loadSegments=()=>{
    setSegmentsError(false);
    window.workspaceGoogle?.getSegments().then(list=>{if(Array.isArray(list))setSegments(list)}).catch(()=>setSegmentsError(true));
    window.workspaceGoogle?.getSegmentExpressions().then(map=>{if(map&&typeof map==="object")setSegmentExpressions(map)}).catch(()=>{});
  };
  useEffect(()=>{loadSegments()},[]);

  useEffect(()=>{
    const storeKeys={Linear:"personalEventLinearBalances",TasksHorizontal:"personalEventTasksHorizontalBalances",TasksVertical:"personalEventTasksVerticalBalances",TopUp:"personalEventTopUpBalances",Wheel:"personalEventWheelBalances"};
    const storeKey=storeKeys[subtype]||"personalEventBoardBalances";
    window.workspaceStore?.read(storeKey).then(list=>{setBalances(Array.isArray(list)?list:[])}).catch(()=>setBalances([]));
  },[subtype]);

  useEffect(()=>{
    const alreadyCommitted=event.personalEventConfig?.committed&&event.personalEventConfig?.subtype===subtype;
    if(alreadyCommitted){
      setNextId(event.personalEventConfig.lastResult?.eventId??null);
      return;
    }
    setNextId(null);
    let cancelled=false;
    window.workspaceGoogle?.getNextPersonalEventId(subtype).then(info=>{
      if(cancelled)return;
      setNextId(info.nextId);
      if(groupId===""&&info.lastGroupId!=="")setGroupId(info.lastGroupId);
      if(!note&&info.lastNote)setNote(info.lastNote);
    }).catch(()=>{});
    return ()=>{cancelled=true};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[subtype]);

  const onEndDateChange=value=>{
    setEndDate(value);
    setEndCompletionDate(plusDaysFormatted(value,2));
    setPreview(null);
  };
  const onSegmentChange=value=>{
    setSegment(value);
    setExpression(segmentExpressions[value]||"");
    setPreview(null);
  };

  const saveDraft=()=>{onSave({subtype,startDate,endDate,endCompletionDate,expression,groupId,note,segment,balanceName,committed:event.personalEventConfig?.subtype===subtype?event.personalEventConfig?.committed:false,lastResult:event.personalEventConfig?.subtype===subtype?event.personalEventConfig?.lastResult:undefined});onClose()};

  const buildPreview=()=>{
    const balance=balances.find(b=>b.name===balanceName);
    if(!balance){setStatus({state:"error",message:"Выберите сохранённый баланс"});return}
    if(subtype==="Linear"||subtype==="TasksHorizontal"||subtype==="TasksVertical"){
      const join=(type,id,count)=>type?`${type}:${id}:${count}`:`${id}:${count}`;
      const rewards=balance.rewards.map(r=>({
        id:r.id,
        reward:`${r.rewardId}:${r.rewardCount}`,
        alternateReward:r.altId?`${r.altId}:${r.altCount}`:`${r.rewardId}:${r.rewardCount}`,
        xpAmount:r.xpAmount,cool:r.cool,showInPreview:r.showInPreview,
      }));
      const itemExp=`${balance.itemExpId}:${balance.itemExpCount}`;
      const currencyToXP=subtype==="Linear"?join(balance.currencyToXPType,balance.currencyToXPId,balance.currencyToXPCount):undefined;
      const prefixes={Linear:"Linear",TasksHorizontal:"TaskBookHorizontal",TasksVertical:"TaskBookVertical"};
      const prefix=prefixes[subtype];
      const tasks=subtype==="TasksHorizontal"?(balance.tasks||[]).map(t=>({
        taskId:t.taskId,neededCount:t.neededCount,
        rewards:`${t.rewardId}:${t.rewardCount}`,
        taskPrice:join(t.taskPriceType,t.taskPriceId,t.taskPriceCount),
      })):subtype==="TasksVertical"?(balance.tasks||[]).map(t=>({
        taskId:t.taskId,neededCount:t.neededCount,
        rewards:t.rewards,
        taskPrice:join(t.taskPriceType,t.taskPriceId,t.taskPriceCount),
      })):undefined;
      setPreview({
        eventId:nextId,
        commonSheet:`Common_Personal${prefix}${nextId}`,
        progressSheet:`Progress_Accumulative_Personal${prefix}${nextId}`,
        tasksSheet:tasks?`Tasks_Simple_Personal${prefix}${nextId}`:undefined,
        style:balance.style,mechanicIds:balance.mechanicIds,mainPrefabName:balance.mainPrefabName,
        infoPopupPreviewRewards:balance.infoPopupPreviewRewards,
        itemExp,boost:balance.boost,currencyToXP,
        startDate,endDate,endCompletionDate,expression,groupId,note,segment,
        rewardsCount:rewards.length,tasksCount:tasks?.length,
        payload:{...balance,rewards,tasks,itemExp,currencyToXP,startDate:`${startDate}:00`,endDate:`${endDate}:00`,endCompletionDate,expression,groupId,note,segment},
      });
      return;
    }
    if(subtype==="TopUp"){
      const join=(type,id,count)=>type?`${type}:${id}:${count}`:`${id}:${count}`;
      const rewards=balance.rewards.map(r=>({
        id:r.id,
        reward:join(r.rewardType,r.rewardId,r.rewardCount),
        alternateReward:(r.altId||r.altType)?join(r.altType,r.altId,r.altCount):join(r.rewardType,r.rewardId,r.rewardCount),
        price:join(r.priceType,r.priceId,r.priceCount),
        cool:r.cool,showInPreview:r.showInPreview,
      }));
      setPreview({
        eventId:nextId,
        commonSheet:`Common_PersonalTopUp${nextId}`,
        progressSheet:`Progress_Sequential_PersonalTopUp${nextId}`,
        style:balance.style,mechanicIds:balance.mechanicIds,mainPrefabName:balance.mainPrefabName,
        infoPopupPreviewRewards:balance.infoPopupPreviewRewards,
        adsPointName:balance.adsPointName,howItWorkPlace:balance.howItWorkPlace,
        startDate,endDate,endCompletionDate,expression,groupId,note,segment,
        rewardsCount:rewards.length,
        payload:{...balance,rewards,startDate:`${startDate}:00`,endDate:`${endDate}:00`,endCompletionDate,expression,groupId,note,segment},
      });
      return;
    }
    const rewards=balance.rewards.map(r=>({
      id:r.id,reward:`${r.itemId}:${r.itemCount}`,alternateReward:r.altItemId?`${r.altItemId}:${r.altItemCount}`:`${r.itemId}:${r.itemCount}`,
      buyLimit:r.buyLimit,dropChance:r.dropChance,cool:r.cool,showInPreview:r.showInPreview,
    }));
    const rouletteNames={Board:"PersonalDrawerOfFortune",Wheel:"PersonalWheelOfFortune"};
    const rouletteName=rouletteNames[subtype]||"PersonalDrawerOfFortune";
    setPreview({
      eventId:nextId,
      commonSheet:`Common_${rouletteName}${nextId}`,
      progressSheet:`Progress_Wheel_${rouletteName}${nextId}`,
      style:balance.style,mechanicIds:balance.mechanicIds,mainPrefabName:balance.mainPrefabName,
      infoPopupPreviewRewards:balance.infoPopupPreviewRewards,
      openCellPrice:balance.openCellPrice,gemsOpenCellPrice:balance.gemsOpenCellPrice,
      startDate,endDate,endCompletionDate,expression,groupId,note,segment,
      rewardsCount:rewards.length,
      payload:{...balance,rewards,startDate:`${startDate}:00`,endDate:`${endDate}:00`,endCompletionDate,expression,groupId,note,segment},
    });
  };

  const apply=async target=>{
    if(!preview)return;
    setStatus({state:"loading",message:`Создаём конфиг${target==="test"?" (ТЕСТ)":""}…`});
    try{
      const methods={Linear:window.workspaceGoogle?.applyPersonalEventLinear,TasksHorizontal:window.workspaceGoogle?.applyPersonalEventTasksHorizontal,TasksVertical:window.workspaceGoogle?.applyPersonalEventTasksVertical,TopUp:window.workspaceGoogle?.applyPersonalEventTopUp,Wheel:window.workspaceGoogle?.applyPersonalEventWheel};
      const method=methods[subtype]||window.workspaceGoogle?.applyPersonalEventBoard;
      const commonKeys={Linear:"Common_PersonalLinear",TasksHorizontal:"Common_PersonalTaskBookHorizontal",TasksVertical:"Common_PersonalTaskBookVertical",TopUp:"Common_PersonalTopUp",Wheel:"Common_PersonalWheelOfFortune"};
      const progressKeys={Linear:"Progress_Accumulative_PersonalLinear",TasksHorizontal:"Progress_Accumulative_PersonalTaskBookHorizontal",TasksVertical:"Progress_Accumulative_PersonalTaskBookVertical",TopUp:"Progress_Sequential_PersonalTopUp",Wheel:"Progress_Wheel_PersonalWheelOfFortune"};
      const commonKey=commonKeys[subtype]||"Common_PersonalDrawerOfFortune";
      const progressKey=progressKeys[subtype]||"Progress_Wheel_PersonalDrawerOfFortune";
      const result=await method({...preview.payload,target});
      setStatus({state:"success",message:`Готово: EventId ${result.eventId}, листы ${result.names[commonKey]}, ${result.names[progressKey]}`});
      onSave({subtype,startDate,endDate,endCompletionDate,expression,groupId,note,segment,balanceName,lastResult:result,committed:true});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:60}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(720px,100%)",maxHeight:"90vh",overflowY:"auto"}}>
        <header><div><span>PERSONAL EVENT CONFIG</span><h2>{event.title}</h2></div><button onClick={onClose}><FiX/></button></header>

        <label>Подтип<select value={subtype} onChange={e=>{setSubtype(e.target.value);setBalanceName("");setPreview(null)}}>
          {["Board","Linear","TasksHorizontal","TasksVertical","TopUp","Wheel"].map(t=><option key={t} value={t}>{t}</option>)}
        </select></label>

        <>
          <div style={{fontSize:11,color:"#91a293",margin:"4px 0 10px"}}>{event.personalEventConfig?.committed&&event.personalEventConfig?.subtype===subtype?<>Id: <b style={{color:"#c3d8c5"}}>{nextId??"…"}</b> (уже создан)</>:<>Следующий Id для {subtype}: <b>{nextId??"…"}</b></>}</div>
          <div className="form-columns">
            <label>start date-time<input type="datetime-local" value={startDate} onChange={e=>{setStartDate(e.target.value);setPreview(null)}}/></label>
            <label>end date-time<input type="datetime-local" value={endDate} onChange={e=>onEndDateChange(e.target.value)}/></label>
          </div>
          <label>EndCompletionDate (авто: end date-time + 2 дня, можно поправить)<input value={endCompletionDate} onChange={e=>{setEndCompletionDate(e.target.value);setPreview(null)}}/></label>
          <label>segment<select value={segment} onChange={e=>onSegmentChange(e.target.value)}><option value="">—</option>{segments.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
          {segmentsError&&<div style={{fontSize:11,color:"#ff5d55",margin:"-6px 0 10px"}}>Не удалось загрузить список сегментов (Google Sheets временно недоступен). <button type="button" onClick={loadSegments} style={{background:"transparent",border:"none",color:"#ff7348",textDecoration:"underline",cursor:"pointer",padding:0,fontSize:11}}>Обновить</button></div>}
          <label>Expression (= выбранный сегмент, проверь перед отправкой)<textarea rows={2} value={expression} onChange={e=>{setExpression(e.target.value);setPreview(null)}}/></label>
          <div className="form-columns">
            <label>GroupId<input value={groupId} onChange={e=>{setGroupId(e.target.value);setPreview(null)}}/></label>
            <label>Примечание GD<input value={note} onChange={e=>{setNote(e.target.value);setPreview(null)}}/></label>
          </div>
          <label>{subtype} balance<select value={balanceName} onChange={e=>{setBalanceName(e.target.value);setPreview(null)}}><option value="">—</option>{balances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}</select></label>

          {!preview && <button type="button" className="secondary-action" onClick={buildPreview}>Показать превью</button>}

          {preview && (
            <div style={{border:"1px solid #59645b",borderRadius:2,padding:12,marginTop:10,marginBottom:10,fontSize:12,lineHeight:1.7}}>
              <div><b>EventId:</b> {preview.eventId}</div>
              <div><b>Листы:</b> {preview.commonSheet} / {preview.progressSheet}{preview.tasksSheet?` / ${preview.tasksSheet}`:""}</div>
              <div><b>Style / MechanicIds / Prefab:</b> {preview.style} / {preview.mechanicIds} / {preview.mainPrefabName}</div>
              <div><b>InfoPopupPreviewRewards:</b> {preview.infoPopupPreviewRewards}</div>
              {(subtype==="Board"||subtype==="Wheel")
                ? <div><b>OpenCellPrice / GemsOpenCellPrice:</b> {preview.openCellPrice} / {preview.gemsOpenCellPrice}</div>
                : subtype==="Linear"
                ? <div><b>ItemExp / Boost / CurrencyToXP:</b> {preview.itemExp} / {String(preview.boost)} / {preview.currencyToXP}</div>
                : subtype==="TopUp"
                ? <div><b>AdsPointName / HowItWorkPlace:</b> {preview.adsPointName||"—"} / {preview.howItWorkPlace}</div>
                : <div><b>ItemExp:</b> {preview.itemExp}</div>}
              <div><b>Даты (Schedule):</b> {preview.startDate}:00 → {preview.endDate}:00, завершение {preview.endCompletionDate}</div>
              <div><b>Segment / GroupId:</b> {preview.segment||"—"} / {preview.groupId}</div>
              <div><b>Expression:</b> {preview.expression||"—"}</div>
              <div><b>Строк наград:</b> {preview.rewardsCount}{preview.tasksCount!==undefined?` · задач: ${preview.tasksCount}`:""}</div>
            </div>
          )}
        </>

        {status.message && <div className={`config-status ${status.state}`}>{status.message}</div>}
        <footer>
          <button className="primary-action" onClick={saveDraft}>Ок</button>
          {preview && <>
            <button className="secondary-action" disabled={status.state==="loading"} onClick={()=>apply("prod")}>Создать конфиг</button>
            <button className="secondary-action" disabled={status.state==="loading"} onClick={()=>apply("test")}>Создать конфиг ТЕСТ</button>
          </>}
        </footer>
      </div>
    </div>
  );
}

const splitDateTime=iso=>{
  const value=String(iso||"").trim();
  const match=value.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  if(!match)return {date:"",time:"09:00"};
  return {date:match[1],time:match[2]||"09:00"};
};

function ActiveMapsModal({onClose}){
  const [groups,setGroups]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    window.workspaceGoogle?.syncActiveMaps().then(result=>{
      setGroups(result?.groups||[]);
    }).catch(e=>setError(e.message||"Ошибка чтения таблицы карт"));
  },[]);

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:70}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(520px,100%)",maxHeight:"85vh",overflowY:"auto"}}>
        <header><div><span>MAPS</span><h2>Актуальный список запущенных карт</h2></div><button onClick={onClose}><FiX/></button></header>
        {error && <div className="config-status error">{error}</div>}
        {!error && groups===null && <div style={{padding:16,color:"#91a293",fontSize:12}}>Читаем таблицу карт...</div>}
        {groups && groups.map((group,index)=>(
          <div key={group.mode} style={{marginTop:index>0?16:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"#c3d8c5",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{group.mode}</div>
            {group.maps.length===0 && <div style={{fontSize:12,color:"#91a293",paddingLeft:4}}>—</div>}
            {group.maps.map(map=>(
              <div key={map.scene} style={{display:"flex",gap:8,fontSize:12,padding:"3px 4px",color:"#c3d8c5"}}>
                <span style={{opacity:0.8}}>{map.scene}</span>
                <span style={{opacity:0.6}}>{map.displayName?`(${map.displayName})`:""}</span>
                {map.nextScene && <>
                  <span style={{opacity:0.5,margin:"0 2px"}}>→</span>
                  <span style={{opacity:0.9,color:"#ff7348"}}>{map.nextScene}</span>
                  <span style={{opacity:0.6}}>{map.nextDisplayName?`(${map.nextDisplayName})`:""}</span>
                </>}
              </div>
            ))}
          </div>
        ))}
        <footer><button className="secondary-action" onClick={onClose}>Закрыть</button></footer>
      </div>
    </div>
  );
}

function EventCenterSyncModal({events,onClose,onApply}){
  const [newGroups,setNewGroups]=useState(null);
  const [statusChanges,setStatusChanges]=useState([]);
  const [error,setError]=useState("");
  const [selectedNew,setSelectedNew]=useState(new Set());
  const [selectedStatus,setSelectedStatus]=useState(new Set());

  useEffect(()=>{
    window.workspaceGoogle?.syncEventCenter().then(list=>{
      const knownIndex=new Map();
      for(const event of events){
        if(Array.isArray(event.sourceEventIds)){
          for(const id of event.sourceEventIds)knownIndex.set(`${event.type}|${id}`,event);
        }
      }
      const fresh=[];
      const changesMap=new Map();
      for(const group of (list||[])){
        const matched=group.eventIds.map(id=>knownIndex.get(`${group.type}|${id}`)).find(Boolean);
        if(!matched){fresh.push(group);continue}
        const currentlyEnabled=matched.enabled!==false;
        if(currentlyEnabled!==group.enabled&&!changesMap.has(matched.id)){
          changesMap.set(matched.id,{eventId:matched.id,title:matched.title,type:matched.type,from:currentlyEnabled,to:group.enabled});
        }
      }
      const changes=[...changesMap.values()];
      fresh.sort((a,b)=>a.start.localeCompare(b.start));
      setNewGroups(fresh);
      setStatusChanges(changes);
      setSelectedNew(new Set(fresh.map((_,index)=>index)));
      setSelectedStatus(new Set(changes.map((_,index)=>index)));
    }).catch(e=>setError(e.message||"Ошибка чтения EventCenterConfig"));
  },[]);

  const toggleNew=index=>setSelectedNew(prev=>{
    const next=new Set(prev);
    if(next.has(index))next.delete(index);else next.add(index);
    return next;
  });
  const toggleStatus=index=>setSelectedStatus(prev=>{
    const next=new Set(prev);
    if(next.has(index))next.delete(index);else next.add(index);
    return next;
  });

  const apply=()=>{
    onApply({
      groupsToAdd:newGroups.filter((_,index)=>selectedNew.has(index)),
      changesToApply:statusChanges.filter((_,index)=>selectedStatus.has(index)),
    });
    onClose();
  };

  const totalFound=(newGroups?.length||0)+statusChanges.length;
  const totalSelected=selectedNew.size+selectedStatus.size;

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:70}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(640px,100%)",maxHeight:"85vh",overflowY:"auto"}}>
        <header><div><span>СИНХРОНИЗАЦИЯ</span><h2>EventCenterConfig → График</h2></div><button onClick={onClose}><FiX/></button></header>
        {error && <div className="config-status error">{error}</div>}
        {!error && newGroups===null && <div style={{padding:16,color:"#91a293",fontSize:12}}>Читаем EventCenterConfig...</div>}
        {newGroups && totalFound===0 && <div style={{padding:16,color:"#91a293",fontSize:12}}>Отличий не найдено (с начала года) — график уже актуален.</div>}

        {statusChanges.length>0 && <>
          <div style={{fontSize:12,color:"#91a293",margin:"0 0 10px"}}>Изменился статус IsEnable у {statusChanges.length} уже добавленных событий:</div>
          {statusChanges.map((change,index)=>(
            <label key={change.eventId} className="sync-row" style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 4px",borderTop:index>0?"1px solid #59645b":"none",fontSize:12,cursor:"pointer"}}>
              <input type="checkbox" checked={selectedStatus.has(index)} onChange={()=>toggleStatus(index)} style={{marginTop:2,width:20,height:20,flexShrink:0,accentColor:"#ff7348",borderRadius:0,cursor:"pointer"}}/>
              <div>
                <div><b style={{color:TYPES[change.type]}}>{change.type}</b> — {change.title}</div>
                <div style={{color:"#91a293"}}>{change.from?"включено":"выключено"} → {change.to?"включено":"выключено"}</div>
              </div>
            </label>
          ))}
        </>}

        {newGroups && newGroups.length>0 && <>
          <div style={{fontSize:12,color:"#91a293",margin:statusChanges.length?"16px 0 10px":"0 0 10px"}}>Найдено {newGroups.length} новых событий с начала года. Отметьте, что добавить:</div>
          {newGroups.map((group,index)=>(
            <label key={index} className="sync-row" style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 4px",borderTop:index>0?"1px solid #59645b":"none",fontSize:12,cursor:"pointer"}}>
              <input type="checkbox" checked={selectedNew.has(index)} onChange={()=>toggleNew(index)} style={{marginTop:2,width:20,height:20,flexShrink:0,accentColor:"#ff7348",borderRadius:0,cursor:"pointer"}}/>
              <div>
                <div><b style={{color:TYPES[group.type]}}>{group.type}</b> — {group.style||"(без названия)"}{group.enabled===false?" (выключено)":""}</div>
                <div style={{color:"#91a293"}}>
                  {splitDateTime(group.start).date} → {splitDateTime(group.end).date}
                  {group.segments.length?` · сегменты: ${group.segments.join(", ")}`:""}
                  {group.eventIds.length>1?` · id: ${group.eventIds.join(", ")}`:` · id: ${group.eventIds[0]}`}
                </div>
              </div>
            </label>
          ))}
        </>}
        <footer>
          <button className="secondary-action" onClick={onClose}>Отменить</button>
          {totalFound>0 && <button className="primary-action" onClick={apply}>Обновить график ({totalSelected})</button>}
        </footer>
      </div>
    </div>
  );
}

function offerLabel(offer){return offer.Label||offer.gui?.TextTitle||`Оффер ${offer.Id}`}

function OfferCampaignConfigurator({event,onClose,onSave,onOpenOffer}){
  const [name,setName]=useState(event.title&&event.title!=="Кампания офферов"?event.title:(event.title||"Кампания офферов"));
  const [startDate,setStartDate]=useState(event.offerCampaignConfig?.startDate||`${event.start}T${event.startTime||"09:00"}`);
  const [endDate,setEndDate]=useState(event.offerCampaignConfig?.endDate||`${event.end}T${event.endTime||"09:00"}`);
  const [allOffers,setAllOffers]=useState([]);
  const [addedIds,setAddedIds]=useState(event.offerCampaignConfig?.offerIds||event.sourceEventIds||[]);
  const [search,setSearch]=useState("");
  const [showPicker,setShowPicker]=useState(false);
  const [conflicts,setConflicts]=useState(null);
  const [status,setStatus]=useState({state:"idle",message:""});

  useEffect(()=>{
    window.workspaceStore?.read("gameOffersCache").then(cache=>{
      if(cache&&Array.isArray(cache.offers))setAllOffers(cache.offers);
    }).catch(()=>{});
  },[]);

  const addedOffers=addedIds.map(id=>allOffers.find(o=>o.Id===id)).filter(Boolean);
  const pickable=allOffers.filter(o=>!addedIds.includes(o.Id)&&(!search.trim()||offerLabel(o).toLowerCase().includes(search.toLowerCase())));

  const removeOffer=id=>setAddedIds(prev=>prev.filter(x=>x!==id));
  const addOffer=id=>{setAddedIds(prev=>[...prev,id]);setShowPicker(false);setSearch("")};

  const doApply=async overrideIds=>{
    setStatus({state:"loading",message:"Применяем..."});
    try{
      const startTime=`${startDate}:00`,endTime=`${endDate}:00`;
      const toDate=[...addedOffers.filter(o=>!o.StartTime&&!o.EndTime).map(o=>o.Id),...overrideIds];
      if(toDate.length)await window.workspaceGoogle?.applyOfferCampaign({offerIdsToDate:toDate,startTime,endTime});
      onSave({title:name||"Кампания офферов",start:startDate,end:endDate,type:"Offers",sourceEventIds:addedIds,offerCampaignConfig:{startDate,endDate,offerIds:addedIds}});
      onClose();
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  const createConfigClick=()=>{
    if(!name.trim()){setStatus({state:"error",message:"Введите название кампании"});return}
    if(!addedIds.length){setStatus({state:"error",message:"Добавьте хотя бы один оффер"});return}
    const withDates=addedOffers.filter(o=>o.StartTime||o.EndTime);
    if(withDates.length){setConflicts(withDates.map(o=>({id:o.Id,label:offerLabel(o),checked:false})));return}
    doApply([]);
  };

  const toggleConflict=id=>setConflicts(prev=>prev.map(c=>c.id===id?{...c,checked:!c.checked}:c));
  const confirmConflicts=()=>{
    const overrideIds=conflicts.filter(c=>c.checked).map(c=>c.id);
    setConflicts(null);
    doApply(overrideIds);
  };

  const applyTest=async()=>{
    if(!addedIds.length){setStatus({state:"error",message:"Добавьте хотя бы один оффер"});return}
    setStatus({state:"loading",message:"Копируем в тестовую GameOffersSystem..."});
    try{
      const startTime=`${startDate}:00`,endTime=`${endDate}:00`;
      const result=await window.workspaceGoogle?.applyOfferCampaignTest({offers:addedOffers,startTime,endTime});
      setStatus({state:"success",message:`Готово (ТЕСТ): скопировано офферов ${result.updated}`});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  return (
    <div className="event-modal-backdrop" style={{position:"fixed",zIndex:70}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="event-modal" style={{width:"min(640px,100%)",maxHeight:"85vh",overflowY:"auto"}}>
        <header><div><span>OFFERS CAMPAIGN</span><h2>Кампания офферов</h2></div><button onClick={onClose}><FiX/></button></header>

        <label>Название кампании (ни на что не влияет, только для графика)<input value={name} onChange={e=>setName(e.target.value)}/></label>
        <div className="form-columns">
          <label>Даты старта<input type="datetime-local" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label>
          <label>Даты окончания<input type="datetime-local" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label>
        </div>

        <div style={{fontSize:11,color:"#91a293",textTransform:"uppercase",letterSpacing:0.5,margin:"14px 0 6px"}}>Офферы</div>
        {addedOffers.map(offer=>(
          <div key={offer.Id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",border:"1px solid #59645b",marginBottom:6,fontSize:12}}>
            <span>{offerLabel(offer)}{(offer.StartTime||offer.EndTime)&&<small style={{color:"#ff5d55",marginLeft:8}}>уже есть даты</small>}</span>
            <div style={{display:"flex",gap:8}}>
              <button type="button" className="secondary-action" onClick={()=>onOpenOffer?.(offer.Id)}>В конструктор</button>
              <button type="button" onClick={()=>removeOffer(offer.Id)} style={{background:"transparent",border:"none",color:"#ff5d55",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          </div>
        ))}
        {addedIds.length>0 && addedOffers.length<addedIds.length && <div style={{fontSize:11,color:"#91a293",marginBottom:6}}>Часть офферов не найдена в локальном кэше — откройте Offer Constructor и нажмите «Синхронизация».</div>}

        {!showPicker && <button type="button" onClick={()=>setShowPicker(true)} style={{width:36,height:36,background:"#ff7348",border:"none",color:"#000",fontWeight:800,fontSize:16,cursor:"pointer"}}>+</button>}
        {showPicker && (
          <div style={{border:"1px solid #59645b",padding:10,marginBottom:10}}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск оффера по названию..." style={{width:"100%",background:"#1a1a22",border:"1px solid #59645b",color:"#c3d8c5",fontSize:12,padding:"6px 8px",boxSizing:"border-box",marginBottom:8}}/>
            <div style={{maxHeight:180,overflowY:"auto"}}>
              {pickable.length===0 && <div style={{fontSize:11,color:"#91a293",padding:6}}>{allOffers.length===0?"Кэш офферов пуст — сначала синхронизируйтесь в Offer Constructor.":"Ничего не найдено"}</div>}
              {pickable.slice(0,50).map(o=>(
                <div key={o.Id} onClick={()=>addOffer(o.Id)} style={{padding:"6px 8px",fontSize:12,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#343934"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{offerLabel(o)}</div>
              ))}
            </div>
            <button type="button" className="secondary-action" onClick={()=>{setShowPicker(false);setSearch("")}} style={{marginTop:8}}>Закрыть</button>
          </div>
        )}

        {conflicts && (
          <div style={{border:"1px solid #ff5d55",padding:12,marginTop:10,marginBottom:10}}>
            <div style={{fontSize:12,marginBottom:8}}>У этих офферов уже есть свои даты. Отметьте, кому всё равно перезаписать датами кампании (остальные останутся со своими датами):</div>
            {conflicts.map(c=>(
              <label key={c.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,padding:"4px 0",cursor:"pointer"}}>
                <input type="checkbox" checked={c.checked} onChange={()=>toggleConflict(c.id)} style={{width:18,height:18,accentColor:"#ff7348"}}/>{c.label}
              </label>
            ))}
            <button type="button" className="primary-action" onClick={confirmConflicts} style={{marginTop:8}}>Продолжить</button>
          </div>
        )}

        {status.message && <div className={`config-status ${status.state}`}>{status.message}</div>}
        <footer>
          <button className="secondary-action" onClick={onClose}>Отменить</button>
          {!conflicts && <button className="secondary-action" disabled={status.state==="loading"} onClick={applyTest}>Тест</button>}
          {!conflicts && <button className="primary-action" disabled={status.state==="loading"} onClick={createConfigClick}>Создать конфиг</button>}
        </footer>
      </div>
    </div>
  );
}

function resolveEventRealId(event){
  if(event.type==="Lottery"&&event.lotteryConfig?.partitions){
    const ids=event.lotteryConfig.partitions.filter(p=>p.committed&&p.id).map(p=>p.id);
    return ids.join(", ");
  }
  if(event.type==="Card Roulette"&&event.cardRouletteConfig?.partitions){
    const ids=event.cardRouletteConfig.partitions.filter(p=>p.committed&&p.id).map(p=>p.id);
    return ids.join(", ");
  }
  if(event.type==="Personal Event"&&event.personalEventConfig?.committed){
    return String(event.personalEventConfig.lastResult?.eventId??"");
  }
  if(Array.isArray(event.sourceEventIds)&&event.sourceEventIds.length)return event.sourceEventIds.join(", ");
  return "";
}

export default function EventCalendar({onOpenOffer,pendingCampaignOffer}){
  const today=new Date();
  const [cursor,setCursor]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [events,setEvents]=useState([]);
  const [selectedId,setSelectedId]=useState(null);
  const [ready,setReady]=useState(false);
  const [gesture,setGesture]=useState(null);
  const [configState,setConfigState]=useState({status:"idle",message:""});
  const [showConfigurator,setShowConfigurator]=useState(false);
  const [showSync,setShowSync]=useState(false);
  const [showMaps,setShowMaps]=useState(false);
  const [enableStatus,setEnableStatus]=useState({state:"idle",message:""});
  const days=useMemo(()=>Array.from({length:new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()},(_,index)=>new Date(cursor.getFullYear(),cursor.getMonth(),index+1)),[cursor]);
  const monthStart=iso(days[0]),monthEnd=iso(days[days.length-1]);
  const visible=events.filter(event=>event.end>=monthStart&&event.start<=monthEnd);
  const layout=useMemo(()=>{
    const groups=new Map();
    for(const type of TYPE_ORDER)groups.set(type,[]);
    for(const event of visible){
      const type=TYPE_ORDER.includes(event.type)?event.type:"__other__";
      if(!groups.has(type))groups.set(type,[]);
      groups.get(type).push(event);
    }
    const BAND_GAP=10,LABEL_HEIGHT=16;
    const positions=new Map();
    const bands=[];
    let offset=0;
    for(const [type,list] of groups){
      if(!list.length)continue;
      const sorted=[...list].sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
      const laneEnds=[];
      for(const event of sorted){
        let lane=laneEnds.findIndex(end=>end<event.start);
        if(lane===-1){lane=laneEnds.length;laneEnds.push(event.end)}else{laneEnds[lane]=event.end}
        positions.set(event.id,offset+LABEL_HEIGHT+lane*ROW_HEIGHT);
      }
      bands.push({type,top:offset,lanes:laneEnds.length});
      offset+=LABEL_HEIGHT+laneEnds.length*ROW_HEIGHT+BAND_GAP;
    }
    return {positions,bands,height:offset};
  },[visible]);
  const timelineHeight=Math.max(500,TOP_PADDING+layout.height+28);
  const selected=events.find(event=>event.id===selectedId);

  useEffect(()=>{let live=true;(async()=>{const saved=await window.workspaceStore?.read("calendar");if(live&&Array.isArray(saved))setEvents(saved.map((event,index)=>({...event,lane:Number.isInteger(event.lane)?event.lane:index})));if(live)setReady(true)})().catch(()=>setReady(true));return()=>{live=false}},[]);

  useEffect(()=>{
    if(!ready||!pendingCampaignOffer?.offerId)return;
    const todayIso=iso(today);
    const newEvent={id:`event-${Date.now()}`,title:"Кампания офферов",start:todayIso,end:todayIso,startTime:"10:00",endTime:"18:00",type:"Offers",notes:"",offerCampaignConfig:{offerIds:[pendingCampaignOffer.offerId]}};
    setEvents(prev=>[...prev,newEvent]);
    setSelectedId(newEvent.id);
    setConfigState({status:"idle",message:""});
    setShowConfigurator(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,pendingCampaignOffer?.nonce]);

  useEffect(()=>{if(ready)window.workspaceStore?.write("calendar",events).catch(console.error)},[events,ready]);
  useEffect(()=>{if(!gesture)return;const move=event=>{const deltaX=Math.round((event.clientX-gesture.x)/(gesture.width/days.length));if(deltaX===gesture.deltaX)return;setGesture(current=>({...current,deltaX}));setEvents(current=>current.map(item=>{if(item.id!==gesture.id)return item;const start=parse(gesture.start),end=parse(gesture.end);if(gesture.mode==="move"){start.setDate(start.getDate()+deltaX);end.setDate(end.getDate()+deltaX)}else if(gesture.mode==="left")start.setDate(start.getDate()+clamp(deltaX,-365,daysBetween(gesture.start,gesture.end)));else end.setDate(end.getDate()+Math.max(deltaX,-daysBetween(gesture.start,gesture.end)));return{...item,start:iso(start),end:iso(end)}}))};const up=()=>setGesture(null);window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)}},[gesture,days.length]);

  const createAt=day=>{const date=iso(day);const item={id:`event-${Date.now()}`,title:"Новый ивент",start:date,end:date,startTime:"09:00",endTime:"09:00",type:"Pixel Pass",notes:""};setEvents(current=>[...current,item]);setSelectedId(item.id)};
  const update=patch=>setEvents(current=>current.map(event=>event.id===selectedId?{...event,...patch}:event));
  useEffect(()=>{setEnableStatus({state:"idle",message:""})},[selectedId]);
  const toggleEnabled=async checked=>{
    if(!selected)return;
    update({enabled:checked});
    if(!Array.isArray(selected.sourceEventIds)||!selected.sourceEventIds.length)return;
    setEnableStatus({state:"loading",message:"Обновляем EventCenterConfig..."});
    try{
      await window.workspaceGoogle?.setEventEnabled({type:selected.type,eventIds:selected.sourceEventIds,enabled:checked});
      setEnableStatus({state:"success",message:"Готово"});
    }catch(error){
      setEnableStatus({state:"error",message:error.message||"Ошибка"});
    }
  };
  const remove=()=>{if(!selected)return;setEvents(current=>current.filter(event=>event.id!==selectedId));setSelectedId(null)};
  const duplicate=()=>{if(!selected)return;const copy={...selected,id:`event-${Date.now()}`,title:`${selected.title} — копия`};setEvents(current=>[...current,copy]);setSelectedId(copy.id)};
  const createConfig=()=>{
    if(!selected)return;
    if(selected.type!=="Lottery"&&selected.type!=="Card Roulette"&&selected.type!=="Personal Event"&&selected.type!=="Offers"){setConfigState({status:"error",message:"Настройка пока доступна только для типов Lottery, Card Roulette, Personal Event и Offers"});return}
    setConfigState({status:"idle",message:""});
    setShowConfigurator(true);
  };
  const changeMonth=delta=>setCursor(current=>new Date(current.getFullYear(),current.getMonth()+delta,1));
  const beginGesture=(event,item,mode)=>{event.stopPropagation();const width=event.currentTarget.closest(".calendar-timeline").getBoundingClientRect().width;setGesture({id:item.id,mode,x:event.clientX,y:event.clientY,width,start:item.start,end:item.end,deltaX:0})};

  const applySync=({groupsToAdd,changesToApply})=>{
    setEvents(prev=>{
      let next=[...prev];
      for(const group of groupsToAdd){
        const {date:startDate,time:startTime}=splitDateTime(group.start);
        const {date:endDate,time:endTime}=splitDateTime(group.end);
        if(!startDate)continue;
        next.push({
          id:`event-sync-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          title:group.style||"Без названия",
          start:startDate,
          end:endDate||startDate,
          startTime,endTime,
          type:group.type,
          notes:group.segments.length?`Сегменты: ${group.segments.join(", ")}`:"",
          enabled:group.enabled!==false,
          sourceEventIds:group.eventIds,
          sourceStyle:group.style,
          sourceSegments:group.segments,
        });
      }
      for(const change of (changesToApply||[])){
        next=next.map(event=>event.id===change.eventId?{...event,enabled:change.to}:event);
      }
      return next;
    });
  };

  return <div className="event-calendar-page">
    <header className="feature-header"><div><div className="feature-kicker">LIVEOPS PLANNING SYSTEM</div><h1>График ивентов</h1></div><div className="month-switch"><button aria-label="Предыдущий месяц" onClick={()=>changeMonth(-1)}><FiChevronLeft/></button><strong>{cursor.toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</strong><button aria-label="Следующий месяц" onClick={()=>changeMonth(1)}><FiChevronRight/></button><button className="today-action" onClick={()=>setCursor(new Date(today.getFullYear(),today.getMonth(),1))}>Сегодня</button><button className="today-action" onClick={()=>setShowSync(true)}>Синхронизировать с EventCenterConfig</button><button className="today-action" onClick={()=>setShowMaps(true)}>Карты</button></div></header>
    <div className="calendar-board">
      <div className="calendar-days" style={{gridTemplateColumns:`repeat(${days.length},minmax(34px,1fr))`}}>{days.map(day=><button key={iso(day)} className={iso(day)===iso(today)?"today":""} onClick={()=>createAt(day)}><span>{day.toLocaleDateString("ru-RU",{weekday:"short"})}</span><b>{day.getDate()}</b></button>)}</div>
      <div className="calendar-timeline" style={{"--days":days.length,height:timelineHeight}} onDoubleClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();createAt(days[clamp(Math.floor((event.clientX-rect.left)/(rect.width/days.length)),0,days.length-1)])}}}>
        <div className="calendar-grid-lines" style={{gridTemplateColumns:`repeat(${days.length},1fr)`}}>{days.map(day=><i key={iso(day)} className={iso(day)===iso(today)?"today":""} onClick={()=>createAt(day)}/>)}</div>
        {layout.bands.map(band=><div key={band.type} className="calendar-band-label" style={{position:"absolute",left:4,top:TOP_PADDING+band.top,fontSize:9,letterSpacing:0.5,textTransform:"uppercase",color:TYPES[band.type]||"#91a293",opacity:0.8}}>{band.type==="__other__"?"Другое":band.type}</div>)}
        {visible.map(item=>{const start=clamp(daysBetween(monthStart,item.start),0,days.length-1);const end=clamp(daysBetween(monthStart,item.end),0,days.length-1);const top=TOP_PADDING+(layout.positions.get(item.id)??0);const accent=TYPES[item.type]||"#8fa091";const disabled=item.enabled===false;return <div key={item.id} className="calendar-event" style={{left:`${start/days.length*100}%`,width:`${(end-start+1)/days.length*100}%`,top,background:disabled?"var(--orion-bg)":accent,borderColor:disabled?accent:"#292929",color:disabled?accent:"#292929"}} onPointerDown={event=>beginGesture(event,item,"move")} onDoubleClick={event=>{event.stopPropagation();setSelectedId(item.id)}}><i className="resize left" onPointerDown={event=>beginGesture(event,item,"left")}/><span>{item.title}</span><small>{item.type}</small><i className="resize right" onPointerDown={event=>beginGesture(event,item,"right")}/></div>})}
        {!visible.length&&<button className="calendar-empty" onClick={()=>createAt(days[Math.floor(days.length/2)])}><FiPlus/>Добавить первый ивент</button>}
      </div>
    </div>
    {selected&&<div className="event-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedId(null)}}><div className="event-modal"><header><div><span>EVENT DATA</span><h2>{selected.title}</h2></div><button onClick={()=>setSelectedId(null)}><FiX/></button></header>{resolveEventRealId(selected)&&<div style={{fontSize:11,color:"#91a293",margin:"-6px 0 10px"}}>Id: <b style={{color:"#c3d8c5"}}>{resolveEventRealId(selected)}</b></div>}<label>Название<input value={selected.title} onChange={event=>{update({title:event.target.value});setConfigState({status:"idle",message:""})}}/></label><div className="form-columns"><label>Дата с<input type="date" value={selected.start} onInput={event=>update({start:event.currentTarget.value,end:event.currentTarget.value>selected.end?event.currentTarget.value:selected.end})}/></label><label>Дата до<input type="date" value={selected.end} onInput={event=>update({end:event.currentTarget.value<selected.start?selected.start:event.currentTarget.value})}/></label></div><div className="form-columns"><label>Время с<input type="time" value={selected.startTime} onInput={event=>update({startTime:event.currentTarget.value})}/></label><label>Время до<input type="time" value={selected.endTime} onInput={event=>update({endTime:event.currentTarget.value})}/></label></div><label>Тип ивента<select value={selected.type} onChange={event=>{update({type:event.target.value});setConfigState({status:"idle",message:""})}}>{Object.keys(TYPES).map(type=><option key={type}>{type}</option>)}</select></label><label style={{display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={selected.enabled!==false} onChange={event=>toggleEnabled(event.target.checked)} style={{width:18,height:18,accentColor:TYPES[selected.type]||"#ff7348",cursor:"pointer"}}/><span style={{textTransform:"none",letterSpacing:0,fontWeight:400,fontSize:11}}>Включено (IsEnable в EventCenterConfig){!selected.sourceEventIds?.length&&" — не привязано, статус только локальный"}</span></label>{enableStatus.message&&<div className={`config-status ${enableStatus.state==="error"?"error":enableStatus.state==="loading"?"loading":"success"}`}>{enableStatus.message}</div>}<label>Примечание<textarea maxLength={500} value={selected.notes} onChange={event=>update({notes:event.target.value})}/><small>{selected.notes.length}/500</small></label>{configState.message&&<div className={`config-status ${configState.status}`}>{configState.message}</div>}<footer><button className="danger-action" onClick={remove}><FiTrash2/>Удалить</button><button className="secondary-action" onClick={duplicate}><FiCopy/>Дублировать</button><button className="secondary-action" disabled={configState.status==="loading"} onClick={createConfig}>Настроить</button><button className="primary-action" onClick={()=>setSelectedId(null)}>Готово</button></footer></div></div>}
    {showConfigurator&&selected&&selected.type==="Lottery"&&<LotteryConfigurator event={selected} onClose={()=>setShowConfigurator(false)} onSave={cfg=>update({lotteryConfig:cfg,sourceEventIds:cfg.partitions.filter(p=>p.committed&&p.id).map(p=>p.id)})}/>}
    {showConfigurator&&selected&&selected.type==="Card Roulette"&&<CardRouletteConfigurator event={selected} onClose={()=>setShowConfigurator(false)} onSave={cfg=>update({cardRouletteConfig:cfg,sourceEventIds:cfg.partitions.filter(p=>p.committed&&p.id).map(p=>p.id)})}/>}
    {showConfigurator&&selected&&selected.type==="Personal Event"&&<PersonalEventConfigurator event={selected} onClose={()=>setShowConfigurator(false)} onSave={cfg=>update({personalEventConfig:cfg,sourceEventIds:cfg.committed&&cfg.lastResult?.eventId?[String(cfg.lastResult.eventId)]:selected.sourceEventIds})}/>}
    {showConfigurator&&selected&&selected.type==="Offers"&&<OfferCampaignConfigurator event={selected} onClose={()=>setShowConfigurator(false)} onSave={cfg=>update(cfg)} onOpenOffer={onOpenOffer}/>}
    {showSync&&<EventCenterSyncModal events={events} onClose={()=>setShowSync(false)} onApply={applySync}/>}
    {showMaps&&<ActiveMapsModal onClose={()=>setShowMaps(false)}/>}
  </div>;
}
