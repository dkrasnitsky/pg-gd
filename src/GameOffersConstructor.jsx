import { useState, useEffect, useRef } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,padding:"8px 10px",boxSizing:"border-box"};

function offerTitle(offer){return offer.Label||offer.gui?.TextTitle||`Оффер ${offer.Id}`}

function buildCopyPayload(offer){
  const {gui,guiDouble,...rest}=offer;
  return {
    ...rest,
    Id:"",__new:true,
    gui:gui?{...gui,Id:"",__new:true}:null,
    guiDouble:guiDouble?{...guiDouble,Id:"",__new:true}:null,
  };
}

export default function GameOffersConstructor({onEdit}){
  const [offers,setOffers]=useState([]);
  const [priceTiers,setPriceTiers]=useState({});
  const [listOptions,setListOptions]=useState({});
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState({state:"idle",message:""});
  const [busyId,setBusyId]=useState(null);
  const listRef=useRef(null);

  useEffect(()=>{
    window.workspaceStore?.read("gameOffersCache").then(cache=>{
      if(cache&&Array.isArray(cache.offers)){
        setOffers(cache.offers);
        setPriceTiers(cache.priceTiers||{});
        setListOptions(cache.listOptions||{});
      }
    }).catch(()=>{});
  },[]);

  const persistCache=(nextOffers,nextPriceTiers,nextListOptions)=>{
    window.workspaceStore?.write("gameOffersCache",{offers:nextOffers,priceTiers:nextPriceTiers,listOptions:nextListOptions}).catch(()=>{});
  };

  const sync=async()=>{
    setStatus({state:"loading",message:"Синхронизируем с GameOffersSystem..."});
    try{
      const result=await window.workspaceGoogle?.syncOffers();
      const nextOffers=result?.offers||[];
      const nextPriceTiers=result?.priceTiers||{};
      const nextListOptions=result?.listOptions||{};
      setOffers(nextOffers);
      setPriceTiers(nextPriceTiers);
      setListOptions(nextListOptions);
      persistCache(nextOffers,nextPriceTiers,nextListOptions);
      setStatus({state:"success",message:`Загружено офферов: ${nextOffers.length}`});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка синхронизации"});
    }
  };

  const copyOffer=async offer=>{
    setBusyId(offer.Id);
    try{
      const payload=buildCopyPayload(offer);
      const result=await window.workspaceGoogle?.saveOffer({offer:payload});
      const newOffer={...offer,Id:result.id,Label:offer.Label?`${offer.Label} (копия)`:offer.Label,
        gui:offer.gui?{...offer.gui,Id:result.guiId}:null,
        guiDouble:offer.guiDouble?{...offer.guiDouble,Id:result.guiDoubleId}:null,
      };
      const next=[...offers,newOffer];
      setOffers(next);
      persistCache(next,priceTiers,listOptions);
      setStatus({state:"success",message:`Создана копия: id ${result.id}`});
    }catch(error){
      setStatus({state:"error",message:error.message||"Не удалось скопировать"});
    }finally{
      setBusyId(null);
    }
  };

  const deleteOffer=async offer=>{
    if(!window.confirm(`Удалить оффер «${offerTitle(offer)}» (id ${offer.Id}) из таблицы?`))return;
    setBusyId(offer.Id);
    try{
      await window.workspaceGoogle?.deleteOffer({id:offer.Id});
      const next=offers.filter(item=>item.Id!==offer.Id);
      setOffers(next);
      persistCache(next,priceTiers,listOptions);
      setStatus({state:"success",message:"Оффер удалён"});
    }catch(error){
      setStatus({state:"error",message:error.message||"Не удалось удалить"});
    }finally{
      setBusyId(null);
    }
  };

  const filtered=offers.filter(offer=>{
    if(!search.trim())return true;
    return offerTitle(offer).toLowerCase().includes(search.trim().toLowerCase());
  });

  const scrollToStart=()=>listRef.current?.scrollTo({top:0,behavior:"smooth"});
  const scrollToEnd=()=>listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:"smooth"});

  return (
    <div style={{color:T1,height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по названию..." style={{...inputStyle,flex:1}}/>
        <button disabled title="Скоро" style={{padding:"9px 18px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:12,fontWeight:700,cursor:"default",opacity:0.6,whiteSpace:"nowrap"}}>Всякие фильтры</button>
        <button onClick={sync} disabled={status.state==="loading"} style={{padding:"9px 18px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>{status.state==="loading"?"...":"Синхронизация"}</button>
      </div>
      {status.message && <div style={{marginBottom:10,fontSize:11,color:status.state==="error"?DNG:"#22C55E",flexShrink:0}}>{status.message}</div>}

      {offers.length>0 && <button onClick={scrollToStart} style={{width:"100%",padding:"6px",marginBottom:4,background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:10,cursor:"pointer",flexShrink:0}}>▲ В начало</button>}

      <div ref={listRef} style={{flex:1,minHeight:0,overflowY:"auto",border:offers.length?`1px solid ${BRD}`:"none"}}>
        {filtered.length===0 && offers.length===0 && <div style={{padding:24,textAlign:"center",color:T2,fontSize:12}}>Список пуст. Нажмите «Синхронизация», чтобы загрузить офферы.</div>}
        {filtered.length===0 && offers.length>0 && <div style={{padding:24,textAlign:"center",color:T2,fontSize:12}}>Ничего не найдено по запросу «{search}»</div>}
        {filtered.map((offer,index)=>(
          <div key={offer.Id} onClick={()=>onEdit?.(offer,{priceTiers,listOptions})}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderTop:index>0?`1px solid ${BRD}`:"none",cursor:"pointer",background:"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{offerTitle(offer)}</span>
              {offer.Type==="Double"&&<small style={{fontSize:9,color:A,border:`1px solid ${A}`,padding:"1px 5px",flexShrink:0}}>DOUBLE</small>}
              {offer.IsEnable===false&&<small style={{fontSize:9,color:T2,flexShrink:0}}>выключен</small>}
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
              <button disabled={busyId===offer.Id} onClick={()=>copyOffer(offer)} style={{padding:"7px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Копировать</button>
              <button disabled={busyId===offer.Id} onClick={()=>deleteOffer(offer)} style={{padding:"7px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {offers.length>0 && <button onClick={scrollToEnd} style={{width:"100%",padding:"6px",marginTop:4,background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:10,cursor:"pointer",flexShrink:0}}>▼ В конец</button>}
    </div>
  );
}
