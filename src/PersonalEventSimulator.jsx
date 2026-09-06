import { useState, useEffect } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const SUBTYPES=[
  {key:"Board",label:"Board",ready:true},
  {key:"Linear",label:"Linear",ready:true},
  {key:"TasksHorizontal",label:"Task Horizontal",ready:true},
  {key:"TasksVertical",label:"Task Vertical",ready:true},
  {key:"TopUp",label:"TopUp",ready:true},
  {key:"Wheel",label:"Wheel of Fortune",ready:true},
];

const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:11,padding:"5px 6px",boxSizing:"border-box"};
const label={fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};

const defaultNotif=()=>({StartInfoStage:false,StartActiveStage:true,BeforeEndActiveStage:false,StartAddedStage:false,EndEvent:false});
const defaultMeta=(overrides={})=>({
  style:"",mechanicIds:"",infoStageDuration:0,activeStageDuration:172800,addedStageDuration:0,timeUntilEndActiveStageForPopUp:86400,
  mainPrefabName:"",notificationPrefabName:"personal",lobbyButtonPrefabName:"default",infoPrefabName:"default",
  infoPopupPreviewRewards:"",notif:defaultNotif(),
  ...overrides,
});

const emptyBoardReward=()=>({id:"",itemId:"",itemCount:"",altItemId:"",altItemCount:"",buyLimit:"",dropChance:1,cool:false,showInPreview:false});
const defaultBoardBalance=()=>({
  ...defaultMeta({style:"PersonalDrawerOfFortune_Battles",mechanicIds:67,mainPrefabName:"roulette"}),
  openCellPrice:"",gemsOpenCellPrice:"",priceMultiplier1:1,spinType:"Random",
  rewards:[emptyBoardReward()],
});

const defaultWheelBalance=()=>({
  ...defaultMeta({style:"PersonalWheelOfFortune_Battles",mechanicIds:68,mainPrefabName:"wheel_of_fortune"}),
  openCellPrice:"",gemsOpenCellPrice:"",priceMultiplier1:1,spinType:"Random",
  rewards:[emptyBoardReward()],
});

const emptyLinearReward=()=>({id:"",rewardId:"",rewardCount:"",altId:"",altCount:"",xpAmount:"",cool:false,showInPreview:false});
const defaultLinearBalance=()=>({
  ...defaultMeta({style:"PersonalLinear_Battles",mechanicIds:65,mainPrefabName:"accumulative_personal"}),
  itemExpId:"",itemExpCount:"",boost:false,currencyToXPType:"Currency",currencyToXPId:"",currencyToXPCount:"",
  rewards:[emptyLinearReward()],
});

const emptyTask=()=>({taskId:"",neededCount:"",rewardId:"",rewardCount:"",taskPriceType:"Currency",taskPriceId:"GemsCurrency",taskPriceCount:""});
const defaultTasksHorizontalBalance=()=>({
  ...defaultMeta({style:"PersonalTaskBookHorizontal",mainPrefabName:"tasks_horizontal"}),
  itemExpId:"",itemExpCount:"",
  rewards:[emptyLinearReward()],
  tasks:[emptyTask()],
});

const emptyTaskVertical=()=>({taskId:"",neededCount:"",rewards:"",taskPriceType:"Currency",taskPriceId:"GemsCurrency",taskPriceCount:""});
const defaultTasksVerticalBalance=()=>({
  ...defaultMeta({style:"PersonalTaskBookVertical",mainPrefabName:"tasks_vertical"}),
  itemExpId:"",itemExpCount:"",
  rewards:[emptyLinearReward()],
  tasks:[emptyTaskVertical()],
});

const emptyTopUpReward=()=>({id:"",rewardType:"",rewardId:"",rewardCount:"",altType:"",altId:"",altCount:"",priceType:"Currency",priceId:"",priceCount:"",cool:false,showInPreview:false});
const defaultTopUpBalance=()=>({
  ...defaultMeta({style:"PersonalShopping2024",mainPrefabName:"sequential_personal"}),
  adsPointName:"",cashBackFromUSD:"",cashBackFromGems:"",cashBackFromCoins:"",cashBackFromPixelPassCurrency:"",howItWorkPlace:"MainStore",
  rewards:[emptyTopUpReward()],
});

function useBalances(storeKey){
  const [savedBalances,setSavedBalances]=useState([]);
  useEffect(()=>{
    window.workspaceStore?.read(storeKey).then(list=>{if(Array.isArray(list))setSavedBalances(list)}).catch(()=>{});
  },[storeKey]);
  return [savedBalances,setSavedBalances];
}

export default function PersonalEventSimulator(){
  const [subtype,setSubtype]=useState(null);

  if(!subtype){
    return (
      <div style={{color:T1}}>
        <div style={{fontSize:12,color:T2,marginBottom:16}}>Выберите тип Personal Event:</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          {SUBTYPES.map(s=>(
            <button key={s.key} onClick={()=>s.ready&&setSubtype(s.key)} disabled={!s.ready}
              style={{padding:"28px 16px",background:SRF,border:`1px solid ${BRD}`,color:s.ready?T1:T2,fontSize:14,fontWeight:700,cursor:s.ready?"pointer":"default",opacity:s.ready?1:0.55,textAlign:"center"}}>
              {s.label}{!s.ready&&<div style={{fontSize:10,color:T2,marginTop:6,fontWeight:400}}>скоро</div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const BackButton=<button onClick={()=>setSubtype(null)} style={{marginBottom:16,padding:"6px 12px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>← К выбору типа</button>;

  if(subtype==="Board")return <><div>{BackButton}<BoardEditor/></div></>;
  if(subtype==="Linear")return <><div>{BackButton}<LinearEditor/></div></>;
  if(subtype==="TasksHorizontal")return <><div>{BackButton}<TasksHorizontalEditor/></div></>;
  if(subtype==="TasksVertical")return <><div>{BackButton}<TasksVerticalEditor/></div></>;
  if(subtype==="TopUp")return <><div>{BackButton}<TopUpEditor/></div></>;
  if(subtype==="Wheel")return <><div>{BackButton}<BoardEditor storeKey="personalEventWheelBalances" makeDefault={defaultWheelBalance} progressLabel="Progress_Wheel"/></div></>;
  return (
    <div style={{color:T1}}>
      {BackButton}
      <div style={{padding:24,color:T2,fontSize:12}}>Тип «{SUBTYPES.find(s=>s.key===subtype)?.label}» ещё не реализован.</div>
    </div>
  );
}

function CommonFieldsEditor({meta,patch,patchNotif}){
  return (
    <>
      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Common — мета-настройки</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
        <Field label="Style" value={meta.style} onChange={v=>patch({style:v})} width={220}/>
        <Field label="MechanicIds" value={meta.mechanicIds} onChange={v=>patch({mechanicIds:v})} width={100}/>
        <Field label="InfoStageDuration" value={meta.infoStageDuration} onChange={v=>patch({infoStageDuration:v})} width={110} type="number"/>
        <Field label="ActiveStageDuration" value={meta.activeStageDuration} onChange={v=>patch({activeStageDuration:v})} width={130} type="number"/>
        <Field label="AddedStageDuration" value={meta.addedStageDuration} onChange={v=>patch({addedStageDuration:v})} width={120} type="number"/>
        <Field label="TimeUntilEndActiveStageForPopUp" value={meta.timeUntilEndActiveStageForPopUp} onChange={v=>patch({timeUntilEndActiveStageForPopUp:v})} width={160} type="number"/>
        <Field label="MainPrefabName" value={meta.mainPrefabName} onChange={v=>patch({mainPrefabName:v})} width={140}/>
        <Field label="NotificationPrefabName" value={meta.notificationPrefabName} onChange={v=>patch({notificationPrefabName:v})} width={150}/>
        <Field label="LobbyButtonPrefabName" value={meta.lobbyButtonPrefabName} onChange={v=>patch({lobbyButtonPrefabName:v})} width={150}/>
        <Field label="InfoPrefabName" value={meta.infoPrefabName} onChange={v=>patch({infoPrefabName:v})} width={120}/>
        <Field label="InfoPopupPreviewRewards" value={meta.infoPopupPreviewRewards} onChange={v=>patch({infoPopupPreviewRewards:v})} width={280} placeholder="220027:1, 2015:50, 2015:75"/>
      </div>
      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>NotificationBanners</div>
      <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
        {Object.keys(meta.notif).map(k=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T2}}>
            <input type="checkbox" checked={meta.notif[k]} onChange={e=>patchNotif({[k]:e.target.checked})}/>{k}
          </label>
        ))}
      </div>
    </>
  );
}

function BalanceHeader({storeKey,balanceName,setBalanceName,balance,savedBalances,setSavedBalances,onLoad,status,setStatus}){
  const saveBalance=async()=>{
    const name=balanceName.trim();
    if(!name){setStatus({state:"error",message:"Введите название для сохранения баланса"});return}
    const exists=savedBalances.some(b=>b.name===name);
    if(exists&&!window.confirm(`Баланс «${name}» уже существует. Перезаписать?`))return;
    const snapshot={name,...balance};
    const next=exists?savedBalances.map(b=>b.name===name?snapshot:b):[...savedBalances,snapshot];
    setSavedBalances(next);
    try{
      await window.workspaceStore?.write(storeKey,next);
      setStatus({state:"success",message:`Баланс «${name}» сохранён`});
    }catch(e){setStatus({state:"error",message:"Не удалось сохранить: "+e.message})}
  };
  const deleteBalance=async()=>{
    const name=balanceName.trim();
    if(!savedBalances.some(b=>b.name===name)){setStatus({state:"error",message:"Сначала выберите сохранённый баланс"});return}
    if(!window.confirm(`Удалить баланс «${name}»?`))return;
    const next=savedBalances.filter(b=>b.name!==name);
    setSavedBalances(next);
    try{await window.workspaceStore?.write(storeKey,next);setStatus({state:"success",message:`Баланс «${name}» удалён`})}
    catch(e){setStatus({state:"error",message:"Не удалось удалить: "+e.message})}
  };
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
      <div><div style={label}>Название баланса</div><input value={balanceName} onChange={e=>setBalanceName(e.target.value)} placeholder="Например: Summer2026" style={{...inputStyle,width:200}}/></div>
      {savedBalances.length>0 && (
        <div><div style={label}>Сохранённые</div>
          <select value="" onChange={e=>e.target.value&&onLoad(e.target.value)} style={{...inputStyle,width:180}}>
            <option value="">Загрузить...</option>
            {savedBalances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </div>
      )}
      <button onClick={saveBalance} style={{padding:"6px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Сохранить</button>
      {savedBalances.some(b=>b.name===balanceName.trim()) && <button onClick={deleteBalance} style={{padding:"6px 14px",background:"transparent",border:`1px solid ${DNG}`,color:DNG,fontSize:11,cursor:"pointer"}}>Удалить</button>}
    </div>
  );
}

function BoardEditor({storeKey="personalEventBoardBalances",makeDefault=defaultBoardBalance,progressLabel="Progress_Wheel"}){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(makeDefault());
  const [savedBalances,setSavedBalances]=useBalances(storeKey);
  const [status,setStatus]=useState({state:"idle",message:""});

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const patchNotif=p=>setBalance(prev=>({...prev,notif:{...prev.notif,...p}}));
  const updateReward=(index,p)=>setBalance(prev=>({...prev,rewards:prev.rewards.map((r,i)=>i===index?{...r,...p}:r)}));
  const addReward=()=>setBalance(prev=>({...prev,rewards:[...prev.rewards,emptyBoardReward()]}));
  const removeReward=index=>setBalance(prev=>({...prev,rewards:prev.rewards.filter((_,i)=>i!==index)}));

  const onLoad=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...makeDefault(),...rest,notif:{...defaultNotif(),...rest.notif}});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };

  return (
    <div style={{color:T1}}>
      <BalanceHeader storeKey={storeKey} balanceName={balanceName} setBalanceName={setBalanceName} balance={balance} savedBalances={savedBalances} setSavedBalances={setSavedBalances} onLoad={onLoad} status={status} setStatus={setStatus}/>
      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      <CommonFieldsEditor meta={balance} patch={patch} patchNotif={patchNotif}/>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>{progressLabel} — цена и барабан</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
        <Field label="OpenCellPrice" value={balance.openCellPrice} onChange={v=>patch({openCellPrice:v})} width={140} placeholder="83015:3"/>
        <Field label="GemsOpenCellPrice" value={balance.gemsOpenCellPrice} onChange={v=>patch({gemsOpenCellPrice:v})} width={140} placeholder="2015:60"/>
        <Field label="PriceMultiplier1" value={balance.priceMultiplier1} onChange={v=>patch({priceMultiplier1:v})} width={110} type="number"/>
        <Field label="SpinType" value={balance.spinType} onChange={v=>patch({spinType:v})} width={110}/>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:50}}>Id</th>
            <th style={{padding:"4px 6px",minWidth:150}}>Reward</th>
            <th style={{padding:"4px 6px",minWidth:150}}>AlternateReward</th>
            <th style={{padding:"4px 6px",width:70}}>BuyLimit</th>
            <th style={{padding:"4px 6px",width:70}}>Drop</th>
            <th style={{padding:"4px 6px",width:60}}>Cool</th>
            <th style={{padding:"4px 6px",width:70}}>ShowInPreview</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.rewards.map((r,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={r.id} onChange={e=>updateReward(index,{id:e.target.value})} style={{...inputStyle,width:40}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.itemId} onChange={e=>updateReward(index,{itemId:e.target.value})} placeholder="item" style={{...inputStyle,width:90}}/>
                    <input value={r.itemCount} onChange={e=>updateReward(index,{itemCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.altItemId} onChange={e=>updateReward(index,{altItemId:e.target.value})} placeholder="item" style={{...inputStyle,width:90}}/>
                    <input value={r.altItemCount} onChange={e=>updateReward(index,{altItemCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input value={r.buyLimit} onChange={e=>updateReward(index,{buyLimit:e.target.value})} style={{...inputStyle,width:60}}/></td>
                <td style={{padding:"4px 6px"}}><input type="number" value={r.dropChance} onChange={e=>updateReward(index,{dropChance:e.target.value})} style={{...inputStyle,width:60}}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.cool} onChange={e=>updateReward(index,{cool:e.target.checked})}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.showInPreview} onChange={e=>updateReward(index,{showInPreview:e.target.checked})}/></td>
                <td style={{padding:"4px 6px"}}>{balance.rewards.length>1&&<button onClick={()=>removeReward(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addReward} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ строка</button>
    </div>
  );
}

function LinearEditor(){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(defaultLinearBalance());
  const [savedBalances,setSavedBalances]=useBalances("personalEventLinearBalances");
  const [status,setStatus]=useState({state:"idle",message:""});

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const patchNotif=p=>setBalance(prev=>({...prev,notif:{...prev.notif,...p}}));
  const updateReward=(index,p)=>setBalance(prev=>({...prev,rewards:prev.rewards.map((r,i)=>i===index?{...r,...p}:r)}));
  const addReward=()=>setBalance(prev=>({...prev,rewards:[...prev.rewards,emptyLinearReward()]}));
  const removeReward=index=>setBalance(prev=>({...prev,rewards:prev.rewards.filter((_,i)=>i!==index)}));

  const onLoad=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...defaultLinearBalance(),...rest,notif:{...defaultNotif(),...rest.notif}});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };

  return (
    <div style={{color:T1}}>
      <BalanceHeader storeKey="personalEventLinearBalances" balanceName={balanceName} setBalanceName={setBalanceName} balance={balance} savedBalances={savedBalances} setSavedBalances={setSavedBalances} onLoad={onLoad} status={status} setStatus={setStatus}/>
      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      <CommonFieldsEditor meta={balance} patch={patch} patchNotif={patchNotif}/>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Progress_Accumulative — конвертация опыта</div>
      <div style={{fontSize:10,color:T2,marginBottom:8}}>Тип можно оставить пустым — тогда в конфиг уйдёт просто <code>id:количество</code>, иначе <code>Тип:id:количество</code>.</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
        <div>
          <div style={label}>ItemExp</div>
          <div style={{display:"flex",gap:4}}>
            <input value={balance.itemExpId} onChange={e=>patch({itemExpId:e.target.value})} placeholder="item" style={{...inputStyle,width:100}}/>
            <input value={balance.itemExpCount} onChange={e=>patch({itemExpCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:80}}/>
          </div>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T2,paddingBottom:6}}>
          <input type="checkbox" checked={balance.boost} onChange={e=>patch({boost:e.target.checked})}/>Boost
        </label>
        <div>
          <div style={label}>CurrencyToXP (Тип / Id / Кол-во)</div>
          <div style={{display:"flex",gap:4}}>
            <input value={balance.currencyToXPType} onChange={e=>patch({currencyToXPType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:100}}/>
            <input value={balance.currencyToXPId} onChange={e=>patch({currencyToXPId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
            <input value={balance.currencyToXPCount} onChange={e=>patch({currencyToXPCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:80}}/>
          </div>
        </div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:50}}>Id</th>
            <th style={{padding:"4px 6px",minWidth:150}}>Reward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:150}}>AlternateReward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",width:80}}>XPAmount</th>
            <th style={{padding:"4px 6px",width:60}}>Cool</th>
            <th style={{padding:"4px 6px",width:70}}>ShowInPreview</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.rewards.map((r,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={r.id} onChange={e=>updateReward(index,{id:e.target.value})} style={{...inputStyle,width:40}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.rewardId} onChange={e=>updateReward(index,{rewardId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.rewardCount} onChange={e=>updateReward(index,{rewardCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.altId} onChange={e=>updateReward(index,{altId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.altCount} onChange={e=>updateReward(index,{altCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input type="number" value={r.xpAmount} onChange={e=>updateReward(index,{xpAmount:e.target.value})} style={{...inputStyle,width:70}}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.cool} onChange={e=>updateReward(index,{cool:e.target.checked})}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.showInPreview} onChange={e=>updateReward(index,{showInPreview:e.target.checked})}/></td>
                <td style={{padding:"4px 6px"}}>{balance.rewards.length>1&&<button onClick={()=>removeReward(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addReward} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ строка</button>
    </div>
  );
}

function TaskReferenceModal({onClose}){
  const [list,setList]=useState(null);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");

  useEffect(()=>{
    window.workspaceGoogle?.getTaskReference().then(setList).catch(e=>setError(e.message||"Ошибка загрузки"));
  },[]);

  const filtered=(list||[]).filter(item=>{
    if(!query.trim())return true;
    const q=query.trim().toLowerCase();
    return String(item.taskId).toLowerCase().includes(q)||item.description.toLowerCase().includes(q);
  });

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:BG,border:`1px solid ${BRD}`,width:"min(600px,90%)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${BRD}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T1,flex:1}}>Справочник задач (TaskId → GDDescpiption)</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T2,fontSize:16,cursor:"pointer"}}>×</button>
        </div>
        <div style={{padding:12}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по TaskId или описанию..." style={inputStyle}/>
        </div>
        <div style={{overflowY:"auto",padding:"0 12px 12px"}}>
          {error && <div style={{color:DNG,fontSize:12}}>{error}</div>}
          {!error && list===null && <div style={{color:T2,fontSize:12}}>Загрузка...</div>}
          {list && filtered.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderTop:i>0?`1px solid ${BRD}`:"none",fontSize:11}}>
              <div style={{color:A,fontWeight:700,width:50,flexShrink:0}}>{item.taskId}</div>
              <div style={{color:T1}}>{item.description}</div>
            </div>
          ))}
          {list&&!filtered.length&&<div style={{color:T2,fontSize:12}}>Ничего не найдено</div>}
        </div>
      </div>
    </div>
  );
}

function TasksHorizontalEditor(){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(defaultTasksHorizontalBalance());
  const [savedBalances,setSavedBalances]=useBalances("personalEventTasksHorizontalBalances");
  const [status,setStatus]=useState({state:"idle",message:""});
  const [showReference,setShowReference]=useState(false);

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const patchNotif=p=>setBalance(prev=>({...prev,notif:{...prev.notif,...p}}));
  const updateReward=(index,p)=>setBalance(prev=>({...prev,rewards:prev.rewards.map((r,i)=>i===index?{...r,...p}:r)}));
  const addReward=()=>setBalance(prev=>({...prev,rewards:[...prev.rewards,emptyLinearReward()]}));
  const removeReward=index=>setBalance(prev=>({...prev,rewards:prev.rewards.filter((_,i)=>i!==index)}));
  const updateTask=(index,p)=>setBalance(prev=>({...prev,tasks:prev.tasks.map((t,i)=>i===index?{...t,...p}:t)}));
  const addTask=()=>setBalance(prev=>({...prev,tasks:[...prev.tasks,emptyTask()]}));
  const removeTask=index=>setBalance(prev=>({...prev,tasks:prev.tasks.filter((_,i)=>i!==index)}));

  const onLoad=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...defaultTasksHorizontalBalance(),...rest,notif:{...defaultNotif(),...rest.notif}});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };

  return (
    <div style={{color:T1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <BalanceHeader storeKey="personalEventTasksHorizontalBalances" balanceName={balanceName} setBalanceName={setBalanceName} balance={balance} savedBalances={savedBalances} setSavedBalances={setSavedBalances} onLoad={onLoad} status={status} setStatus={setStatus}/>
        <button onClick={()=>setShowReference(true)} style={{padding:"6px 14px",background:"transparent",border:`1px solid ${BRD}`,color:T1,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Справочник задач</button>
      </div>
      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}
      {showReference && <TaskReferenceModal onClose={()=>setShowReference(false)}/>}

      <CommonFieldsEditor meta={balance} patch={patch} patchNotif={patchNotif}/>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Progress_Accumulative — опыт</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
        <div>
          <div style={label}>ItemExp</div>
          <div style={{display:"flex",gap:4}}>
            <input value={balance.itemExpId} onChange={e=>patch({itemExpId:e.target.value})} placeholder="item" style={{...inputStyle,width:100}}/>
            <input value={balance.itemExpCount} onChange={e=>patch({itemExpCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:80}}/>
          </div>
        </div>
      </div>

      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:50}}>Id</th>
            <th style={{padding:"4px 6px",minWidth:150}}>Reward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:150}}>AlternateReward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",width:80}}>XPAmount</th>
            <th style={{padding:"4px 6px",width:60}}>Cool</th>
            <th style={{padding:"4px 6px",width:70}}>ShowInPreview</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.rewards.map((r,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={r.id} onChange={e=>updateReward(index,{id:e.target.value})} style={{...inputStyle,width:40}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.rewardId} onChange={e=>updateReward(index,{rewardId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.rewardCount} onChange={e=>updateReward(index,{rewardCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.altId} onChange={e=>updateReward(index,{altId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.altCount} onChange={e=>updateReward(index,{altCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input type="number" value={r.xpAmount} onChange={e=>updateReward(index,{xpAmount:e.target.value})} style={{...inputStyle,width:70}}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.cool} onChange={e=>updateReward(index,{cool:e.target.checked})}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.showInPreview} onChange={e=>updateReward(index,{showInPreview:e.target.checked})}/></td>
                <td style={{padding:"4px 6px"}}>{balance.rewards.length>1&&<button onClick={()=>removeReward(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addReward} style={{marginBottom:24,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ строка награды</button>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Tasks_Simple — список задач</div>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:70}}>TaskId</th>
            <th style={{padding:"4px 6px",width:90}}>NeededCount</th>
            <th style={{padding:"4px 6px",minWidth:150}}>Rewards (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:220}}>TaskPrice (Тип/Id/Кол-во)</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.tasks.map((t,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={t.taskId} onChange={e=>updateTask(index,{taskId:e.target.value})} style={{...inputStyle,width:60}}/></td>
                <td style={{padding:"4px 6px"}}><input value={t.neededCount} onChange={e=>updateTask(index,{neededCount:e.target.value})} style={{...inputStyle,width:80}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={t.rewardId} onChange={e=>updateTask(index,{rewardId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={t.rewardCount} onChange={e=>updateTask(index,{rewardCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={t.taskPriceType} onChange={e=>updateTask(index,{taskPriceType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:80}}/>
                    <input value={t.taskPriceId} onChange={e=>updateTask(index,{taskPriceId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={t.taskPriceCount} onChange={e=>updateTask(index,{taskPriceCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>{balance.tasks.length>1&&<button onClick={()=>removeTask(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addTask} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ задача</button>
    </div>
  );
}

function TasksVerticalEditor(){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(defaultTasksVerticalBalance());
  const [savedBalances,setSavedBalances]=useBalances("personalEventTasksVerticalBalances");
  const [status,setStatus]=useState({state:"idle",message:""});
  const [showReference,setShowReference]=useState(false);

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const patchNotif=p=>setBalance(prev=>({...prev,notif:{...prev.notif,...p}}));
  const updateReward=(index,p)=>setBalance(prev=>({...prev,rewards:prev.rewards.map((r,i)=>i===index?{...r,...p}:r)}));
  const addReward=()=>setBalance(prev=>({...prev,rewards:[...prev.rewards,emptyLinearReward()]}));
  const removeReward=index=>setBalance(prev=>({...prev,rewards:prev.rewards.filter((_,i)=>i!==index)}));
  const updateTask=(index,p)=>setBalance(prev=>({...prev,tasks:prev.tasks.map((t,i)=>i===index?{...t,...p}:t)}));
  const addTask=()=>setBalance(prev=>({...prev,tasks:[...prev.tasks,emptyTaskVertical()]}));
  const removeTask=index=>setBalance(prev=>({...prev,tasks:prev.tasks.filter((_,i)=>i!==index)}));

  const onLoad=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...defaultTasksVerticalBalance(),...rest,notif:{...defaultNotif(),...rest.notif}});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };

  return (
    <div style={{color:T1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <BalanceHeader storeKey="personalEventTasksVerticalBalances" balanceName={balanceName} setBalanceName={setBalanceName} balance={balance} savedBalances={savedBalances} setSavedBalances={setSavedBalances} onLoad={onLoad} status={status} setStatus={setStatus}/>
        <button onClick={()=>setShowReference(true)} style={{padding:"6px 14px",background:"transparent",border:`1px solid ${BRD}`,color:T1,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Справочник задач</button>
      </div>
      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}
      {showReference && <TaskReferenceModal onClose={()=>setShowReference(false)}/>}

      <CommonFieldsEditor meta={balance} patch={patch} patchNotif={patchNotif}/>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Progress_Accumulative — опыт</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
        <div>
          <div style={label}>ItemExp</div>
          <div style={{display:"flex",gap:4}}>
            <input value={balance.itemExpId} onChange={e=>patch({itemExpId:e.target.value})} placeholder="item" style={{...inputStyle,width:100}}/>
            <input value={balance.itemExpCount} onChange={e=>patch({itemExpCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:80}}/>
          </div>
        </div>
      </div>

      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:50}}>Id</th>
            <th style={{padding:"4px 6px",minWidth:150}}>Reward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:150}}>AlternateReward (Id/Кол-во)</th>
            <th style={{padding:"4px 6px",width:80}}>XPAmount</th>
            <th style={{padding:"4px 6px",width:60}}>Cool</th>
            <th style={{padding:"4px 6px",width:70}}>ShowInPreview</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.rewards.map((r,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={r.id} onChange={e=>updateReward(index,{id:e.target.value})} style={{...inputStyle,width:40}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.rewardId} onChange={e=>updateReward(index,{rewardId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.rewardCount} onChange={e=>updateReward(index,{rewardCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.altId} onChange={e=>updateReward(index,{altId:e.target.value})} placeholder="id" style={{...inputStyle,width:100}}/>
                    <input value={r.altCount} onChange={e=>updateReward(index,{altCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:70}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input type="number" value={r.xpAmount} onChange={e=>updateReward(index,{xpAmount:e.target.value})} style={{...inputStyle,width:70}}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.cool} onChange={e=>updateReward(index,{cool:e.target.checked})}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.showInPreview} onChange={e=>updateReward(index,{showInPreview:e.target.checked})}/></td>
                <td style={{padding:"4px 6px"}}>{balance.rewards.length>1&&<button onClick={()=>removeReward(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addReward} style={{marginBottom:24,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ строка награды</button>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Tasks_Simple — список задач</div>
      <div style={{fontSize:10,color:T2,marginBottom:8}}>Index проставляется автоматически (EventId + номер задачи), тут не задаётся. Rewards — список пар через запятую, например <code>47032:1,77032:25</code>.</div>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:70}}>TaskId</th>
            <th style={{padding:"4px 6px",width:90}}>NeededCount</th>
            <th style={{padding:"4px 6px",minWidth:200}}>Rewards</th>
            <th style={{padding:"4px 6px",minWidth:220}}>TaskPrice (Тип/Id/Кол-во)</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.tasks.map((t,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={t.taskId} onChange={e=>updateTask(index,{taskId:e.target.value})} style={{...inputStyle,width:60}}/></td>
                <td style={{padding:"4px 6px"}}><input value={t.neededCount} onChange={e=>updateTask(index,{neededCount:e.target.value})} style={{...inputStyle,width:80}}/></td>
                <td style={{padding:"4px 6px"}}><input value={t.rewards} onChange={e=>updateTask(index,{rewards:e.target.value})} placeholder="47032:1,77032:25" style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={t.taskPriceType} onChange={e=>updateTask(index,{taskPriceType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:80}}/>
                    <input value={t.taskPriceId} onChange={e=>updateTask(index,{taskPriceId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={t.taskPriceCount} onChange={e=>updateTask(index,{taskPriceCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>{balance.tasks.length>1&&<button onClick={()=>removeTask(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addTask} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ задача</button>
    </div>
  );
}

function TopUpEditor(){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(defaultTopUpBalance());
  const [savedBalances,setSavedBalances]=useBalances("personalEventTopUpBalances");
  const [status,setStatus]=useState({state:"idle",message:""});

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const patchNotif=p=>setBalance(prev=>({...prev,notif:{...prev.notif,...p}}));
  const updateReward=(index,p)=>setBalance(prev=>({...prev,rewards:prev.rewards.map((r,i)=>i===index?{...r,...p}:r)}));
  const addReward=()=>setBalance(prev=>({...prev,rewards:[...prev.rewards,emptyTopUpReward()]}));
  const removeReward=index=>setBalance(prev=>({...prev,rewards:prev.rewards.filter((_,i)=>i!==index)}));

  const onLoad=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...defaultTopUpBalance(),...rest,notif:{...defaultNotif(),...rest.notif}});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };

  return (
    <div style={{color:T1}}>
      <BalanceHeader storeKey="personalEventTopUpBalances" balanceName={balanceName} setBalanceName={setBalanceName} balance={balance} savedBalances={savedBalances} setSavedBalances={setSavedBalances} onLoad={onLoad} status={status} setStatus={setStatus}/>
      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      <CommonFieldsEditor meta={balance} patch={patch} patchNotif={patchNotif}/>

      <div style={{fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,color:T1}}>Progress_Sequential — настройки шопинга</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
        <Field label="AdsPointName" value={balance.adsPointName} onChange={v=>patch({adsPointName:v})} width={140}/>
        <Field label="CashBackFromUSD" value={balance.cashBackFromUSD} onChange={v=>patch({cashBackFromUSD:v})} width={110}/>
        <Field label="CashBackFromGems" value={balance.cashBackFromGems} onChange={v=>patch({cashBackFromGems:v})} width={110}/>
        <Field label="CashBackFromCoins" value={balance.cashBackFromCoins} onChange={v=>patch({cashBackFromCoins:v})} width={110}/>
        <Field label="CashBackFromPixelPassCurrency" value={balance.cashBackFromPixelPassCurrency} onChange={v=>patch({cashBackFromPixelPassCurrency:v})} width={130}/>
        <Field label="HowItWorkPlace" value={balance.howItWorkPlace} onChange={v=>patch({howItWorkPlace:v})} width={120}/>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:40}}>Id</th>
            <th style={{padding:"4px 6px",minWidth:200}}>Reward (Тип/Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:200}}>AlternateReward (Тип/Id/Кол-во)</th>
            <th style={{padding:"4px 6px",minWidth:200}}>Price (Тип/Id/Кол-во)</th>
            <th style={{padding:"4px 6px",width:60}}>Cool</th>
            <th style={{padding:"4px 6px",width:70}}>ShowInPreview</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.rewards.map((r,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px"}}><input value={r.id} onChange={e=>updateReward(index,{id:e.target.value})} style={{...inputStyle,width:36}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.rewardType} onChange={e=>updateReward(index,{rewardType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:80}}/>
                    <input value={r.rewardId} onChange={e=>updateReward(index,{rewardId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={r.rewardCount} onChange={e=>updateReward(index,{rewardCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.altType} onChange={e=>updateReward(index,{altType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:80}}/>
                    <input value={r.altId} onChange={e=>updateReward(index,{altId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={r.altCount} onChange={e=>updateReward(index,{altCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <input value={r.priceType} onChange={e=>updateReward(index,{priceType:e.target.value})} placeholder="Тип" style={{...inputStyle,width:80}}/>
                    <input value={r.priceId} onChange={e=>updateReward(index,{priceId:e.target.value})} placeholder="id" style={{...inputStyle,width:90}}/>
                    <input value={r.priceCount} onChange={e=>updateReward(index,{priceCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.cool} onChange={e=>updateReward(index,{cool:e.target.checked})}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={r.showInPreview} onChange={e=>updateReward(index,{showInPreview:e.target.checked})}/></td>
                <td style={{padding:"4px 6px"}}>{balance.rewards.length>1&&<button onClick={()=>removeReward(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer"}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addReward} style={{marginTop:8,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ строка</button>
    </div>
  );
}

function Field({label:lbl,value,onChange,width,type="text",placeholder}){
  return (
    <div>
      <div style={label}>{lbl}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...inputStyle,width}}/>
    </div>
  );
}
