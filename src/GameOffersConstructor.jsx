import { useState, useEffect, useRef } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,padding:"8px 10px",boxSizing:"border-box"};
const label={fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};

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

const emptyGui=()=>({__new:true,Id:"",Label:"",PrefabGuiWindow:"",ImageGuiWindowMain:"",GuiApplyer:"",ImagePattern:"",TextTitle:"",TextDescription:"",TextDescriptionLong:"",TextTimeLeft:"Key_11451",TextPrice:"Key_14484",TextOldPrice:"Key_11453",PriceOldSale:"",TextButtonBuy:"Key_14484",TextSale:"Key_11455",SaleAmount:"",BankSection:"",PrefabGuiBank:"",LayoutTypeBank:"",ImageGuiBank:"",PrefabBannerLobby:"",ImageBannerLobby:""});

const emptyOffer=()=>({
  __new:true,Id:"",Label:"",Type:"",BindedOffers:"",PriceTier:"",PriceItem:"",AsAGift:false,AsAGiftHideNick:false,Country:"",
  StartTime:"",EndTime:"",Lifetime:"",Cooldown:"",CooldownOnBuy:"",GuiOrder:"",BuyLimit:"",GameOfferGroup:"",Priority:"",
  GameOfferGui:"",GameOfferGuiDouble:"",PopupOnStart:false,PopupPriority:"",LobbyPopupCooldown:"",ShowPreview:false,
  EnableMiniBanner:false,OrderMiniBanner:"",PlatformList:"",IsEnable:true,AnalyticGroup:"",Expression:"","$":"",ItemReward:"",
  ForDeepLink:false,ShowOnlyIfAvailableByExpression:false,IgnoreGlobalAndGroupCooldown:false,PlaceToShow:"",
  gui:emptyGui(),guiDouble:null,
});

function previewOldPrice(price,saleAmount){
  const priceNum=parseFloat(String(price).replace(/[^0-9.]/g,""));
  const saleNum=parseFloat(String(saleAmount).replace(/[^0-9.]/g,""));
  if(!Number.isFinite(priceNum)||!Number.isFinite(saleNum)||saleNum<=0||saleNum>=100)return "";
  const old=priceNum/(1-saleNum/100);
  return `${old.toFixed(2)}$`;
}

function ListField({lbl,value,onChange,options=[],width}){
  const [open,setOpen]=useState(false);
  const wrapRef=useRef(null);
  useEffect(()=>{
    const onClickOutside=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onClickOutside);
    return ()=>document.removeEventListener("mousedown",onClickOutside);
  },[]);
  const filtered=(options||[]).filter(opt=>opt.toLowerCase().includes((value||"").toLowerCase()));
  return (
    <div ref={wrapRef} style={{position:"relative",...(width?{width}:{flex:1})}}>
      <div style={label}>{lbl}</div>
      <input value={value||""} autoComplete="off" onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true)}} style={inputStyle}/>
      {open && filtered.length>0 && (
        <div style={{position:"absolute",zIndex:30,top:"100%",left:0,right:0,maxHeight:220,overflowY:"auto",background:"#1a1a22",border:`1px solid ${BRD}`,marginTop:2}}>
          {filtered.map(opt=>(
            <div key={opt} onMouseDown={()=>{onChange(opt);setOpen(false)}}
              style={{padding:"6px 10px",fontSize:12,cursor:"pointer",color:T1}}
              onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}
function TextField({lbl,value,onChange,width,type="text",placeholder}){
  return (
    <div style={width?{width}:{flex:1}}>
      <div style={label}>{lbl}</div>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle}/>
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

function GuiEditor({title,gui,onChange,listOptions,onToggleNew,isNew,price}){
  const patch=p=>onChange({...gui,...p});
  return (
    <div style={{border:`1px solid ${BRD}`,padding:14,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <button type="button" onClick={onToggleNew} title="Если включено — при сохранении создастся новая строка Gui, а не редактируется текущая"
          style={{width:26,height:26,flexShrink:0,background:isNew?A:"transparent",border:`1px solid ${A}`,color:isNew?"#000":A,fontWeight:800,cursor:"pointer"}}>+</button>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{title}{!isNew&&gui.Id?` — id ${gui.Id} (правки затронут всех, кто её использует)`:" — новая строка"}</div>
      </div>
      <div style={{marginBottom:10}}><TextField lbl="Label" value={gui.Label} onChange={v=>patch({Label:v})}/></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <ListField lbl="PrefabGui" value={gui.PrefabGuiWindow} onChange={v=>patch({PrefabGuiWindow:v})} options={listOptions.PrefabGuiWindow}/>
        <ListField lbl="ImageGui" value={gui.ImageGuiWindowMain} onChange={v=>patch({ImageGuiWindowMain:v})} options={listOptions.ImageGuiWindowMain}/>
        <ListField lbl="GuiApplyer" value={gui.GuiApplyer} onChange={v=>patch({GuiApplyer:v})} options={listOptions.GuiApplyer}/>
        <ListField lbl="ImagePattern" value={gui.ImagePattern} onChange={v=>patch({ImagePattern:v})} options={listOptions.ImagePattern}/>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <ListField lbl="BankSection" value={gui.BankSection} onChange={v=>patch({BankSection:v})} options={listOptions.BankSection}/>
        <ListField lbl="PrefabGuiBank" value={gui.PrefabGuiBank} onChange={v=>patch({PrefabGuiBank:v})} options={listOptions.PrefabGuiBank}/>
        <ListField lbl="LayoutTypeBank" value={gui.LayoutTypeBank} onChange={v=>patch({LayoutTypeBank:v})} options={listOptions.LayoutTypeBank}/>
        <ListField lbl="ImageGuiBank" value={gui.ImageGuiBank} onChange={v=>patch({ImageGuiBank:v})} options={listOptions.ImageGuiBank}/>
        <ListField lbl="PrefabBannerLobby" value={gui.PrefabBannerLobby} onChange={v=>patch({PrefabBannerLobby:v})} options={listOptions.PrefabBannerLobby}/>
        <ListField lbl="ImageBannerLobby" value={gui.ImageBannerLobby} onChange={v=>patch({ImageBannerLobby:v})} options={listOptions.ImageBannerLobby}/>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <TextField lbl="Title" value={gui.TextTitle} onChange={v=>patch({TextTitle:v})}/>
        <TextField lbl="Description" value={gui.TextDescription} onChange={v=>patch({TextDescription:v})}/>
      </div>
      <div style={{marginBottom:10}}><div style={label}>DescriptionLong</div><textarea rows={2} value={gui.TextDescriptionLong||""} onChange={e=>patch({TextDescriptionLong:e.target.value})} style={{...inputStyle,resize:"vertical"}}/></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <TextField lbl="TimeLeft" value={gui.TextTimeLeft} onChange={v=>patch({TextTimeLeft:v})} width={100}/>
        <TextField lbl="TextPrice" value={gui.TextPrice} onChange={v=>patch({TextPrice:v})} width={110}/>
        <TextField lbl="TextOldPrice" value={gui.TextOldPrice} onChange={v=>patch({TextOldPrice:v})} width={110}/>
        <TextField lbl="PriceOldSale" value={gui.PriceOldSale} onChange={v=>patch({PriceOldSale:v})} width={100}/>
        <TextField lbl="TextButtonBuy" value={gui.TextButtonBuy} onChange={v=>patch({TextButtonBuy:v})} width={120}/>
        <TextField lbl="TextSale" value={gui.TextSale} onChange={v=>patch({TextSale:v})} width={100}/>
        <TextField lbl="SaleAmount" value={gui.SaleAmount} onChange={v=>patch({SaleAmount:v})} width={100}/>
        <div style={{width:110}}><div style={label}>PreviewOldPrice</div><div style={{...inputStyle,fontStyle:"italic",color:T2,background:"transparent"}}>{previewOldPrice(price,gui.SaleAmount)||"—"}</div></div>
      </div>
    </div>
  );
}

function OfferEditor({initial,priceTiers,listOptions,onBack,onSaved,onOpenCampaign,copiedOffer,onPaste}){
  const [offer,setOffer]=useState(initial);
  const [status,setStatus]=useState({state:"idle",message:""});
  const patch=p=>setOffer(prev=>({...prev,...p}));

  const price=priceTiers[offer.PriceTier]||offer["$"]||"";

  const paste=()=>{
    if(!copiedOffer)return;
    setOffer(copiedOffer);
    onPaste?.();
  };

  const save=async()=>{
    setStatus({state:"loading",message:"Сохраняем..."});
    try{
      const result=await window.workspaceGoogle?.saveOffer({offer});
      setStatus({state:"success",message:`Сохранено, id ${result.id}`});
      onSaved({...offer,Id:result.id,__new:false,"$":result.price,
        gui:offer.gui?{...offer.gui,Id:result.guiId,__new:false}:null,
        guiDouble:offer.guiDouble?{...offer.guiDouble,Id:result.guiDoubleId,__new:false}:null,
      });
    }catch(error){
      setStatus({state:"error",message:error.message||"Не удалось сохранить"});
    }
  };

  return (
    <div style={{color:T1,height:"100%",overflowY:"auto",paddingRight:4}}>
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
        <button onClick={onBack} style={{padding:"6px 12px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>← К списку офферов</button>
        {copiedOffer && <button onClick={paste} style={{padding:"6px 12px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:11,fontWeight:700,cursor:"pointer"}}>Вставить скопированное ({offerTitle(copiedOffer)})</button>}
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <TextField lbl="Id (авто)" value={offer.Id||"будет присвоен при сохранении"} onChange={()=>{}} width={220}/>
        <TextField lbl="Label" value={offer.Label} onChange={v=>patch({Label:v})}/>
        <ListField lbl="Type" value={offer.Type} onChange={v=>patch({Type:v,guiDouble:v==="Double"?(offer.guiDouble||emptyGui()):offer.guiDouble})} options={listOptions.Type} width={160}/>
        {offer.Type==="Double" && <TextField lbl="BindedOffers (id через запятую)" value={offer.BindedOffers} onChange={v=>patch({BindedOffers:v})} width={220}/>}
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <ListField lbl="PriceTier" value={offer.PriceTier} onChange={v=>patch({PriceTier:v})} options={listOptions.PriceTier} width={160}/>
        <div style={{width:120}}><div style={label}>Price (авто)</div><div style={{...inputStyle,color:T2}}>{price||"—"}</div></div>
        <TextField lbl="PriceItem" value={offer.PriceItem} onChange={v=>patch({PriceItem:v})} width={160}/>
        <CheckField lbl="As Gift" checked={offer.AsAGift} onChange={v=>patch({AsAGift:v})}/>
        <CheckField lbl="HideNick" checked={offer.AsAGiftHideNick} onChange={v=>patch({AsAGiftHideNick:v})}/>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <TextField lbl="Start (ГГГГ-ММ-ДДTЧЧ:ММ:СС)" value={offer.StartTime} onChange={v=>patch({StartTime:v})}/>
        <TextField lbl="End (ГГГГ-ММ-ДДTЧЧ:ММ:СС)" value={offer.EndTime} onChange={v=>patch({EndTime:v})}/>
        <TextField lbl="Lifetime" value={offer.Lifetime} onChange={v=>patch({Lifetime:v})} width={110}/>
        <TextField lbl="Cooldown" value={offer.Cooldown} onChange={v=>patch({Cooldown:v})} width={110}/>
        <TextField lbl="CooldownOnBuy" value={offer.CooldownOnBuy} onChange={v=>patch({CooldownOnBuy:v})} width={130}/>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10,alignItems:"flex-end"}}>
        <TextField lbl="GuiOrder" value={offer.GuiOrder} onChange={v=>patch({GuiOrder:v})} width={90}/>
        <TextField lbl="BuyLimit" value={offer.BuyLimit} onChange={v=>patch({BuyLimit:v})} width={90}/>
        <ListField lbl="GameOfferGroup" value={offer.GameOfferGroup} onChange={v=>patch({GameOfferGroup:v})} options={listOptions.GameOfferGroup} width={140}/>
        <TextField lbl="Priority" value={offer.Priority} onChange={v=>patch({Priority:v})} width={90}/>
        <CheckField lbl="PopupOnStart" checked={offer.PopupOnStart} onChange={v=>patch({PopupOnStart:v})}/>
        <TextField lbl="PopupPriority" value={offer.PopupPriority} onChange={v=>patch({PopupPriority:v})} width={110}/>
        <TextField lbl="LobbyPopupCooldown" value={offer.LobbyPopupCooldown} onChange={v=>patch({LobbyPopupCooldown:v})} width={140}/>
        <CheckField lbl="ShowPreview" checked={offer.ShowPreview} onChange={v=>patch({ShowPreview:v})}/>
        <CheckField lbl="MiniBanner" checked={offer.EnableMiniBanner} onChange={v=>patch({EnableMiniBanner:v})}/>
        <TextField lbl="OrderMiniBanner" value={offer.OrderMiniBanner} onChange={v=>patch({OrderMiniBanner:v})} width={120}/>
        <TextField lbl="Country" value={offer.Country} onChange={v=>patch({Country:v})} width={100}/>
        <ListField lbl="PlatformList" value={offer.PlatformList} onChange={v=>patch({PlatformList:v})} options={listOptions.PlatformList} width={140}/>
        <CheckField lbl="ForDeepLink" checked={offer.ForDeepLink} onChange={v=>patch({ForDeepLink:v})}/>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10,alignItems:"flex-end"}}>
        <TextField lbl="AnalyticGroup" value={offer.AnalyticGroup} onChange={v=>patch({AnalyticGroup:v})} width={150}/>
        <TextField lbl="PlaceToShow" value={offer.PlaceToShow} onChange={v=>patch({PlaceToShow:v})} width={150}/>
        <CheckField lbl="ShowOnlyIfAvailableByExpression" checked={offer.ShowOnlyIfAvailableByExpression} onChange={v=>patch({ShowOnlyIfAvailableByExpression:v})}/>
        <CheckField lbl="IgnoreGlobalAndGroupCooldown" checked={offer.IgnoreGlobalAndGroupCooldown} onChange={v=>patch({IgnoreGlobalAndGroupCooldown:v})}/>
      </div>

      <div style={{marginBottom:6}}>
        <div style={label}>Expression (список готовых — выбор подставит ниже, можно поправить)</div>
        <select value="" onChange={e=>e.target.value&&patch({Expression:e.target.value})} style={inputStyle}>
          <option value="">Выбрать готовое выражение...</option>
          {(listOptions.Expression||[]).map(opt=><option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      <div style={{marginBottom:16}}>
        <div style={label}>Expression (пишется в конфиг именно отсюда)</div>
        <textarea rows={2} value={offer.Expression||""} onChange={e=>patch({Expression:e.target.value})} style={{...inputStyle,resize:"vertical"}}/>
      </div>

      <div style={{marginBottom:16}}>
        <div style={label}>ItemReward</div>
        <textarea rows={2} value={offer.ItemReward||""} onChange={e=>patch({ItemReward:e.target.value})} style={{...inputStyle,resize:"vertical"}}/>
      </div>

      <GuiEditor title="Gui" gui={offer.gui||emptyGui()} onChange={g=>patch({gui:g})} listOptions={listOptions} price={price}
        isNew={!!offer.gui?.__new} onToggleNew={()=>patch({gui:offer.gui?.__new?{...offer.gui,__new:false}:{...emptyGui(),Label:offer.gui?.Label||""}})}/>

      {offer.Type==="Double" && <GuiEditor title="GuiDouble" gui={offer.guiDouble||emptyGui()} onChange={g=>patch({guiDouble:g})} listOptions={listOptions} price={price}
        isNew={!!offer.guiDouble?.__new} onToggleNew={()=>patch({guiDouble:offer.guiDouble?.__new?{...offer.guiDouble,__new:false}:{...emptyGui(),Label:offer.guiDouble?.Label||""}})}/>}

      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}
      <div style={{display:"flex",gap:10,paddingBottom:24}}>
        <button onClick={save} disabled={status.state==="loading"} style={{padding:"10px 24px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Сохранить</button>
        <button onClick={()=>onOpenCampaign(offer)} disabled={!offer.Id} title={!offer.Id?"Сначала сохраните оффер":""} style={{padding:"10px 24px",background:offer.Id?A:BRD,border:"none",color:offer.Id?"#000":T2,fontSize:12,fontWeight:800,cursor:offer.Id?"pointer":"default"}}>В график ивентов</button>
      </div>
    </div>
  );
}

export default function GameOffersConstructor({pendingOfferId,onOpenCampaign}){
  const [offers,setOffers]=useState([]);
  const [priceTiers,setPriceTiers]=useState({});
  const [listOptions,setListOptions]=useState({});
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState({state:"idle",message:""});
  const [copiedOffer,setCopiedOffer]=useState(null);
  const [editingOffer,setEditingOffer]=useState(null);
  const listRef=useRef(null);

  useEffect(()=>{
    window.workspaceStore?.read("gameOffersCache").then(cache=>{
      if(cache&&Array.isArray(cache.offers)){
        setOffers(cache.offers);
        setPriceTiers(cache.priceTiers||{});
        setListOptions(cache.listOptions||{});
        if(pendingOfferId?.id){
          const found=cache.offers.find(item=>item.Id===pendingOfferId.id);
          if(found)setEditingOffer(found);
        }
      }
    }).catch(()=>{});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(!pendingOfferId?.id)return;
    const found=offers.find(item=>item.Id===pendingOfferId.id);
    if(found)setEditingOffer(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pendingOfferId?.nonce]);

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

  const copyOffer=offer=>{
    setCopiedOffer(buildCopyPayload(offer));
    setStatus({state:"success",message:`Скопировано «${offerTitle(offer)}» — откройте оффер и нажмите «Вставить скопированное»`});
  };

  const deleteOffer=async offer=>{
    if(!window.confirm(`Удалить оффер «${offerTitle(offer)}» (id ${offer.Id}) из таблицы?`))return;
    try{
      await window.workspaceGoogle?.deleteOffer({id:offer.Id});
      const next=offers.filter(item=>item.Id!==offer.Id);
      setOffers(next);
      persistCache(next,priceTiers,listOptions);
      setStatus({state:"success",message:"Оффер удалён"});
    }catch(error){
      setStatus({state:"error",message:error.message||"Не удалось удалить"});
    }
  };

  const onSaved=savedOffer=>{
    setOffers(prev=>{
      const exists=prev.some(item=>item.Id===savedOffer.Id);
      const next=exists?prev.map(item=>item.Id===savedOffer.Id?savedOffer:item):[...prev,savedOffer];
      persistCache(next,priceTiers,listOptions);
      return next;
    });
    setEditingOffer(savedOffer);
  };

  const filtered=offers.filter(offer=>{
    if(!search.trim())return true;
    return offerTitle(offer).toLowerCase().includes(search.trim().toLowerCase());
  });

  const scrollToStart=()=>listRef.current?.scrollTo({top:0,behavior:"smooth"});
  const scrollToEnd=()=>listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:"smooth"});

  if(editingOffer){
    return <OfferEditor initial={editingOffer} priceTiers={priceTiers} listOptions={listOptions}
      onBack={()=>setEditingOffer(null)} onSaved={onSaved} copiedOffer={copiedOffer} onPaste={()=>setCopiedOffer(null)}
      onOpenCampaign={(offer)=>onOpenCampaign?.(offer.Id)}/>;
  }

  return (
    <div style={{color:T1,height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по названию..." style={{...inputStyle,flex:1}}/>
        <button disabled title="Скоро" style={{padding:"9px 18px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:12,fontWeight:700,cursor:"default",opacity:0.6,whiteSpace:"nowrap"}}>Всякие фильтры</button>
        <button onClick={()=>setEditingOffer(emptyOffer())} style={{padding:"9px 18px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>+ Новый оффер</button>
        <button onClick={sync} disabled={status.state==="loading"} style={{padding:"9px 18px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>{status.state==="loading"?"...":"Синхронизация"}</button>
      </div>
      {status.message && <div style={{marginBottom:10,fontSize:11,color:status.state==="error"?DNG:"#22C55E",flexShrink:0}}>{status.message}</div>}

      {offers.length>0 && <button onClick={scrollToStart} style={{width:"100%",padding:"6px",marginBottom:4,background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:10,cursor:"pointer",flexShrink:0}}>▲ В начало</button>}

      <div ref={listRef} style={{flex:1,minHeight:0,overflowY:"auto",border:offers.length?`1px solid ${BRD}`:"none"}}>
        {filtered.length===0 && offers.length===0 && <div style={{padding:24,textAlign:"center",color:T2,fontSize:12}}>Список пуст. Нажмите «Синхронизация», чтобы загрузить офферы.</div>}
        {filtered.length===0 && offers.length>0 && <div style={{padding:24,textAlign:"center",color:T2,fontSize:12}}>Ничего не найдено по запросу «{search}»</div>}
        {filtered.map((offer,index)=>(
          <div key={offer.Id} onClick={()=>setEditingOffer(offer)}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderTop:index>0?`1px solid ${BRD}`:"none",cursor:"pointer",background:"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{offerTitle(offer)}</span>
              {offer.Type==="Double"&&<small style={{fontSize:9,color:A,border:`1px solid ${A}`,padding:"1px 5px",flexShrink:0}}>DOUBLE</small>}
              {offer.IsEnable===false&&<small style={{fontSize:9,color:T2,flexShrink:0}}>выключен</small>}
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>copyOffer(offer)} style={{padding:"7px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Копировать</button>
              <button onClick={()=>deleteOffer(offer)} style={{padding:"7px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {offers.length>0 && <button onClick={scrollToEnd} style={{width:"100%",padding:"6px",marginTop:4,background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:10,cursor:"pointer",flexShrink:0}}>▼ В конец</button>}
    </div>
  );
}
