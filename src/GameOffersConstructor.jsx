import { useState, useEffect, useRef, Component } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,padding:"8px 10px",boxSizing:"border-box"};
const label={fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};

function offerTitle(offer){return offer.Label||offer.gui?.TextTitle||`Оффер ${offer.Id}`}

class OfferEditorBoundary extends Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error("[OfferEditor crash]",error,info)}
  render(){
    if(this.state.error){
      return (
        <div style={{color:T1,padding:24}}>
          <div style={{marginBottom:12,color:DNG,fontSize:13,fontWeight:700}}>Ошибка при открытии редактора оффера</div>
          <div style={{marginBottom:16,color:T2,fontSize:11,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{String(this.state.error?.message||this.state.error)}</div>
          <button onClick={this.props.onBack} style={{padding:"8px 16px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>← К списку офферов</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const valueStr=value===undefined||value===null?"":String(value);
  useEffect(()=>{
    const onClickOutside=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",onClickOutside);
    return ()=>document.removeEventListener("mousedown",onClickOutside);
  },[]);
  const filtered=(options||[]).filter(opt=>String(opt).toLowerCase().includes(valueStr.toLowerCase()));
  return (
    <div ref={wrapRef} style={{position:"relative",...(width?{width}:{flex:1})}}>
      <div style={label}>{lbl}</div>
      <input value={valueStr} autoComplete="off" onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true)}} style={inputStyle}/>
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

function CampaignEditor({campaign,offers,onBack,onSave,onOpenOffer}){
  const [name,setName]=useState(campaign.name||"");
  const [offerIds,setOfferIds]=useState(campaign.offerIds||[]);
  const [search,setSearch]=useState("");
  const [showPicker,setShowPicker]=useState(false);

  const addedOffers=offerIds.map(id=>offers.find(o=>o.Id===id)).filter(Boolean);
  const pickable=offers.filter(o=>!offerIds.includes(o.Id)&&(!search.trim()||offerTitle(o).toLowerCase().includes(search.trim().toLowerCase())));

  const save=()=>{
    if(!name.trim()){alert("Введите название кампании");return}
    if(!offerIds.length){alert("Добавьте хотя бы один оффер");return}
    onSave({name:name.trim(),offerIds});
  };

  return (
    <div style={{color:T1,height:"100%",overflowY:"auto"}}>
      <button onClick={onBack} style={{marginBottom:16,padding:"6px 12px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>← К кампаниям</button>
      <div style={{marginBottom:16,maxWidth:320}}><TextField lbl="Название кампании" value={name} onChange={setName}/></div>

      <div style={{fontSize:11,color:T2,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Офферы в кампании ({addedOffers.length})</div>
      {addedOffers.map(offer=>(
        <div key={offer.Id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",border:`1px solid ${BRD}`,marginBottom:6,fontSize:12}}>
          <span>{offerTitle(offer)}{offer.IsEnable===false&&<small style={{color:T2,marginLeft:8}}>выключен</small>}</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>onOpenOffer(offer.Id)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:11,cursor:"pointer"}}>В редактор</button>
            <button onClick={()=>setOfferIds(prev=>prev.filter(id=>id!==offer.Id))} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:16}}>×</button>
          </div>
        </div>
      ))}
      {offerIds.length>addedOffers.length && <div style={{fontSize:11,color:T2,marginBottom:6}}>Сохранено в кампании, но не найдено в локальном кэше: {offerIds.length-addedOffers.length} — нажмите «Синхронизация» на экране офферов.</div>}

      {!showPicker && <button onClick={()=>setShowPicker(true)} style={{width:36,height:36,background:A,border:"none",color:"#000",fontWeight:800,fontSize:16,cursor:"pointer"}}>+</button>}
      {showPicker && (
        <div style={{border:`1px solid ${BRD}`,padding:10,marginTop:10,maxWidth:400}}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск оффера..." style={{...inputStyle,marginBottom:8}}/>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {pickable.length===0&&<div style={{fontSize:11,color:T2,padding:6}}>Ничего не найдено</div>}
            {pickable.slice(0,50).map(o=>(
              <div key={o.Id} onClick={()=>{setOfferIds(prev=>[...prev,o.Id]);setShowPicker(false);setSearch("")}} style={{padding:"6px 8px",fontSize:12,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background=SRF} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{offerTitle(o)}</div>
            ))}
          </div>
          <button onClick={()=>{setShowPicker(false);setSearch("")}} style={{marginTop:8,padding:"6px 12px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>Закрыть</button>
        </div>
      )}

      <div style={{marginTop:24,paddingBottom:24}}>
        <button onClick={save} style={{padding:"10px 24px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Сохранить кампанию</button>
      </div>
    </div>
  );
}

function CampaignsListScreen({campaigns,onBack,onEdit,onNew,onRestart,onDelete,busyName}){
  return (
    <div style={{color:T1,height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
        <button onClick={onBack} style={{padding:"6px 12px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>← К офферам</button>
        <button onClick={onNew} style={{padding:"9px 18px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:12,fontWeight:800,cursor:"pointer"}}>+ Новая кампания</button>
      </div>
      {campaigns.length===0 && <div style={{color:T2,fontSize:12,padding:16}}>Кампаний пока нет.</div>}
      {campaigns.map(c=>(
        <div key={c.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",border:`1px solid ${BRD}`,marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>{c.name}</div>
            <div style={{fontSize:11,color:T2}}>{c.offerIds.length} офферов</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>onEdit(c)} style={{padding:"7px 14px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:11,cursor:"pointer"}}>Редактировать</button>
            <button disabled={busyName===c.name} onClick={()=>onRestart(c)} style={{padding:"7px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>{busyName===c.name?"...":"Перезапустить (копия)"}</button>
            <button onClick={()=>onDelete(c)} style={{padding:"7px 14px",background:"transparent",border:`1px solid ${DNG}`,color:DNG,fontSize:11,cursor:"pointer"}}>Удалить</button>
          </div>
        </div>
      ))}
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
  const [screen,setScreen]=useState("offers");
  const [campaigns,setCampaigns]=useState([]);
  const [editingCampaign,setEditingCampaign]=useState(null);
  const [campaignBusy,setCampaignBusy]=useState(null);
  const listRef=useRef(null);

  useEffect(()=>{
    window.workspaceStore?.read("offerCampaigns").then(list=>{if(Array.isArray(list))setCampaigns(list)}).catch(()=>{});
  },[]);
  const persistCampaigns=async next=>{setCampaigns(next);await window.workspaceStore?.write("offerCampaigns",next).catch(()=>{})};

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

  const saveCampaign=async campaign=>{
    const exists=campaigns.some(c=>c.name===campaign.name);
    if(exists&&editingCampaign?.name!==campaign.name){alert(`Кампания «${campaign.name}» уже есть`);return}
    const next=exists?campaigns.map(c=>c.name===campaign.name?campaign:c):[...campaigns,campaign];
    await persistCampaigns(next);
    setEditingCampaign(null);
    setStatus({state:"success",message:`Кампания «${campaign.name}» сохранена`});
  };

  const deleteCampaign=async campaign=>{
    if(!window.confirm(`Удалить кампанию «${campaign.name}»? Сами офферы в таблице останутся — удалится только сама карточка кампании.`))return;
    await persistCampaigns(campaigns.filter(c=>c.name!==campaign.name));
  };

  const restartCampaign=async campaign=>{
    const newName=window.prompt(`Новое название для копии кампании «${campaign.name}» (офферы внутри получат новые id):`,`${campaign.name} (2)`);
    if(!newName||!newName.trim())return;
    const finalName=newName.trim();
    if(campaigns.some(c=>c.name===finalName)){alert("Кампания с таким названием уже есть");return}
    setCampaignBusy(campaign.name);
    setStatus({state:"loading",message:`Копируем офферы кампании «${campaign.name}» в «${finalName}»...`});
    try{
      const newIds=[];
      for(const id of campaign.offerIds){
        const offer=offers.find(o=>o.Id===id);
        if(!offer)continue;
        const payload=buildCopyPayload(offer);
        const result=await window.workspaceGoogle?.saveOffer({offer:payload});
        if(result?.id)newIds.push(result.id);
      }
      if(!newIds.length)throw new Error("Не удалось скопировать ни один оффер — проверьте, что они загружены («Синхронизация»)");
      await persistCampaigns([...campaigns,{name:finalName,offerIds:newIds}]);
      await sync();
      setStatus({state:"success",message:`Готово: создана кампания «${finalName}» (${newIds.length} из ${campaign.offerIds.length} офферов)`});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка при перезапуске кампании"});
    }finally{
      setCampaignBusy(null);
    }
  };

  const openOfferFromCampaign=id=>{
    const found=offers.find(item=>item.Id===id);
    if(found){setScreen("offers");setEditingCampaign(null);setEditingOffer(found)}
  };

  const filtered=offers.filter(offer=>{
    if(!search.trim())return true;
    return offerTitle(offer).toLowerCase().includes(search.trim().toLowerCase());
  });

  const scrollToStart=()=>listRef.current?.scrollTo({top:0,behavior:"smooth"});
  const scrollToEnd=()=>listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:"smooth"});

  if(editingOffer){
    return <OfferEditorBoundary key={editingOffer.Id||"new"} onBack={()=>setEditingOffer(null)}><OfferEditor initial={editingOffer} priceTiers={priceTiers} listOptions={listOptions}
      onBack={()=>setEditingOffer(null)} onSaved={onSaved} copiedOffer={copiedOffer} onPaste={()=>setCopiedOffer(null)}
      onOpenCampaign={(offer)=>onOpenCampaign?.(offer.Id)}/></OfferEditorBoundary>;
  }

  if(screen==="campaigns"){
    if(editingCampaign){
      return <CampaignEditor campaign={editingCampaign} offers={offers} onBack={()=>setEditingCampaign(null)} onSave={saveCampaign} onOpenOffer={openOfferFromCampaign}/>;
    }
    return <CampaignsListScreen campaigns={campaigns} onBack={()=>setScreen("offers")}
      onNew={()=>setEditingCampaign({name:"",offerIds:[]})} onEdit={c=>setEditingCampaign(c)}
      onRestart={restartCampaign} onDelete={deleteCampaign} busyName={campaignBusy}/>;
  }

  return (
    <div style={{color:T1,height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по названию..." style={{...inputStyle,flex:1}}/>
        <button disabled title="Скоро" style={{padding:"9px 18px",background:"transparent",border:`1px solid ${BRD}`,color:T2,fontSize:12,fontWeight:700,cursor:"default",opacity:0.6,whiteSpace:"nowrap"}}>Всякие фильтры</button>
        <button onClick={()=>setScreen("campaigns")} style={{padding:"9px 18px",background:"transparent",border:`1px solid ${A}`,color:A,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>Кампании</button>
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
