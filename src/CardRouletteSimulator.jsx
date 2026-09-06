import { useState, useEffect } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const ITEM_TYPE_OPTIONS=["Weapon","Currency","FreeUpgrade","Royale","ProfileBackgroundUI","Mask","Armor","Boots","Pet","Applicable","PixelPassExp","FeatureExp"];
const OPEN_PRICE_CURRENCIES=["2015","73032"];

const emptyItem=()=>({itemType:"Weapon",itemValue:"",itemCount:"",altItemType:"",altItemValue:"",altItemCount:"",dropChance:1,previewed:false,cool:false,showInPreview:false,expressionValue:""});
const emptyChest=()=>Array.from({length:8},emptyItem);

const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:11,padding:"5px 6px",boxSizing:"border-box"};
const selectStyle={...inputStyle,padding:"5px 4px"};

export default function CardRouletteSimulator(){
  const [chests,setChests]=useState([emptyChest(),emptyChest(),emptyChest()]);
  const [activeChest,setActiveChest]=useState(0);
  const [discount,setDiscount]=useState("");
  const [openPriceCurrency,setOpenPriceCurrency]=useState(OPEN_PRICE_CURRENCIES[0]);
  const [openPriceValues,setOpenPriceValues]=useState("");
  const [levelOpen,setLevelOpen]=useState("");
  const [balanceName,setBalanceName]=useState("");
  const [savedBalances,setSavedBalances]=useState([]);
  const [renaming,setRenaming]=useState(false);
  const [renameValue,setRenameValue]=useState("");
  const [status,setStatus]=useState({state:"idle",message:""});

  useEffect(()=>{
    window.workspaceStore?.read("cardRouletteBalances").then(list=>{if(Array.isArray(list))setSavedBalances(list)}).catch(()=>{});
  },[]);

  const updateItem=(chestIndex,itemIndex,patch)=>{
    setChests(prev=>prev.map((chest,ci)=>ci!==chestIndex?chest:chest.map((item,ii)=>ii!==itemIndex?item:{...item,...patch})));
  };
  const addChest=()=>setChests(prev=>[...prev,emptyChest()]);
  const removeChest=(index)=>{
    if(chests.length<=1)return;
    setChests(prev=>prev.filter((_,i)=>i!==index));
    setActiveChest(prev=>Math.max(0,Math.min(prev,chests.length-2)));
  };

  const buildOpenPrices=()=>{
    const values=openPriceValues.split(",").map(v=>v.trim()).filter(Boolean);
    return values.map(v=>`${openPriceCurrency}:${v}`).join(",");
  };

  const saveBalance=async()=>{
    const name=balanceName.trim();
    if(!name){setStatus({state:"error",message:"Введите название для сохранения баланса"});return}
    const exists=savedBalances.some(b=>b.name===name);
    if(exists&&!window.confirm(`Баланс «${name}» уже существует. Перезаписать?`))return;
    const snapshot={name,discount,openPriceCurrency,openPriceValues,levelOpen,chests};
    const next=exists?savedBalances.map(b=>b.name===name?snapshot:b):[...savedBalances,snapshot];
    setSavedBalances(next);
    try{
      await window.workspaceStore?.write("cardRouletteBalances",next);
      setStatus({state:"success",message:`Баланс «${name}» сохранён`});
    }catch(e){setStatus({state:"error",message:"Не удалось сохранить: "+e.message})}
  };
  const loadBalance=(name)=>{
    const balance=savedBalances.find(b=>b.name===name);
    if(!balance)return;
    setChests(balance.chests?.length?balance.chests.map(chest=>chest.map(item=>({...emptyItem(),...item}))):[emptyChest()]);
    setActiveChest(0);
    setDiscount(balance.discount||"");
    setOpenPriceCurrency(balance.openPriceCurrency||OPEN_PRICE_CURRENCIES[0]);
    setOpenPriceValues(balance.openPriceValues||"");
    setLevelOpen(balance.levelOpen||"");
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };
  const deleteBalance=async()=>{
    const name=balanceName.trim();
    if(!savedBalances.some(b=>b.name===name)){setStatus({state:"error",message:"Сначала выберите сохранённый баланс"});return}
    if(!window.confirm(`Удалить баланс «${name}»?`))return;
    const next=savedBalances.filter(b=>b.name!==name);
    setSavedBalances(next);
    try{
      await window.workspaceStore?.write("cardRouletteBalances",next);
      setStatus({state:"success",message:`Баланс «${name}» удалён`});
    }catch(e){setStatus({state:"error",message:"Не удалось удалить: "+e.message})}
  };
  const renameBalance=async()=>{
    const oldName=balanceName.trim();
    const cleanName=renameValue.trim();
    if(!savedBalances.some(b=>b.name===oldName)){setStatus({state:"error",message:"Сначала выберите сохранённый баланс"});return}
    if(!cleanName)return;
    if(savedBalances.some(b=>b.name===cleanName)){setStatus({state:"error",message:`Баланс «${cleanName}» уже существует`});return}
    const next=savedBalances.map(b=>b.name===oldName?{...b,name:cleanName}:b);
    setSavedBalances(next);
    setBalanceName(cleanName);
    setRenaming(false);
    try{await window.workspaceStore?.write("cardRouletteBalances",next)}catch(e){setStatus({state:"error",message:"Не удалось переименовать: "+e.message})}
  };

  const items=chests[activeChest]||[];

  return (
    <div style={{color:T1}}>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
        <div>
          <div style={{fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Название баланса</div>
          <input value={balanceName} onChange={e=>setBalanceName(e.target.value)} placeholder="Например: SummerRoulette" style={{...inputStyle,width:200}}/>
        </div>
        {savedBalances.length>0 && (
          <div>
            <div style={{fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Сохранённые</div>
            <select value="" onChange={e=>e.target.value&&loadBalance(e.target.value)} style={{...selectStyle,width:180}}>
              <option value="">Загрузить...</option>
              {savedBalances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={saveBalance} style={{padding:"6px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Сохранить</button>
        {savedBalances.some(b=>b.name===balanceName.trim()) && !renaming && (
          <button onClick={()=>{setRenaming(true);setRenameValue(balanceName.trim())}} style={{padding:"6px 14px",background:"transparent",border:`1px solid ${BRD}`,color:T1,fontSize:11,cursor:"pointer"}}>Переименовать</button>
        )}
        {renaming && (<>
          <input value={renameValue} onChange={e=>setRenameValue(e.target.value)} style={{...inputStyle,width:160}}/>
          <button onClick={renameBalance} style={{padding:"6px 14px",background:A,border:"none",color:"#000",fontSize:11,fontWeight:800,cursor:"pointer"}}>Ок</button>
        </>)}
        {savedBalances.some(b=>b.name===balanceName.trim()) && (
          <button onClick={deleteBalance} style={{padding:"6px 14px",background:"transparent",border:`1px solid ${DNG}`,color:DNG,fontSize:11,cursor:"pointer"}}>Удалить</button>
        )}
      </div>

      {status.message && <div style={{marginBottom:12,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
        <div><div style={{fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase"}}>Скидка</div><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} style={{...inputStyle,width:100}}/></div>
        <div>
          <div style={{fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase"}}>Цена открытия</div>
          <div style={{display:"flex",gap:6}}>
            <select value={openPriceCurrency} onChange={e=>setOpenPriceCurrency(e.target.value)} style={{...selectStyle,width:90}}>
              {OPEN_PRICE_CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input value={openPriceValues} onChange={e=>setOpenPriceValues(e.target.value)} placeholder="100,150,200" style={{...inputStyle,width:160}}/>
          </div>
          <div style={{fontSize:10,color:T2,marginTop:4}}>Итог: {buildOpenPrices()||"—"}</div>
        </div>
        <div><div style={{fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase"}}>Уровень открытия</div><input type="number" value={levelOpen} onChange={e=>setLevelOpen(e.target.value)} style={{...inputStyle,width:100}}/></div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
        {chests.map((_,index)=>(
          <div key={index} style={{position:"relative"}}>
            <button onClick={()=>setActiveChest(index)} style={{padding:"6px 16px",background:activeChest===index?A:"transparent",border:`1px solid ${activeChest===index?A:BRD}`,color:activeChest===index?"#000":T1,fontSize:11,fontWeight:700,cursor:"pointer"}}>Сундук {index+1}</button>
            {chests.length>1 && <button onClick={()=>removeChest(index)} title="Удалить сундук" style={{position:"absolute",top:-6,right:-6,width:14,height:14,background:DNG,border:"none",color:"#fff",fontSize:9,lineHeight:1,cursor:"pointer",padding:0}}>×</button>}
          </div>
        ))}
        <button onClick={addChest} style={{padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ сундук</button>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead>
            <tr style={{color:T2,textAlign:"left"}}>
              <th style={{padding:"4px 6px"}}>#</th>
              <th style={{padding:"4px 6px",minWidth:180}}>Item</th>
              <th style={{padding:"4px 6px",minWidth:180}}>AltItem</th>
              <th style={{padding:"4px 6px",width:70}}>Drop</th>
              <th style={{padding:"4px 6px",width:110}}>Pr / C / SiP</th>
              <th style={{padding:"4px 6px",width:90}}>Expression</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px",color:T2}}>{index+1}</td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <select value={item.itemType} onChange={e=>updateItem(activeChest,index,{itemType:e.target.value})} style={{...selectStyle,width:110}}>
                      {ITEM_TYPE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={item.itemValue} onChange={e=>updateItem(activeChest,index,{itemValue:e.target.value})} placeholder="id/tag" style={{...inputStyle,width:90}}/>
                    <input value={item.itemCount} onChange={e=>updateItem(activeChest,index,{itemCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <select value={item.altItemType} onChange={e=>updateItem(activeChest,index,{altItemType:e.target.value})} style={{...selectStyle,width:110}}>
                      <option value="">—</option>
                      {ITEM_TYPE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={item.altItemValue} onChange={e=>updateItem(activeChest,index,{altItemValue:e.target.value})} placeholder="id/tag" style={{...inputStyle,width:90}}/>
                    <input value={item.altItemCount} onChange={e=>updateItem(activeChest,index,{altItemCount:e.target.value})} placeholder="кол-во" style={{...inputStyle,width:60}}/>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input type="number" value={item.dropChance} onChange={e=>updateItem(activeChest,index,{dropChance:e.target.value})} style={{...inputStyle,width:60}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                    <label title="Previewed" style={{display:"flex",flexDirection:"column",alignItems:"center",fontSize:9,color:T2}}>Pr<input type="checkbox" checked={item.previewed} onChange={e=>updateItem(activeChest,index,{previewed:e.target.checked})}/></label>
                    <label title="Cool" style={{display:"flex",flexDirection:"column",alignItems:"center",fontSize:9,color:T2}}>C<input type="checkbox" checked={item.cool} onChange={e=>updateItem(activeChest,index,{cool:e.target.checked})}/></label>
                    <label title="ShowInPreview" style={{display:"flex",flexDirection:"column",alignItems:"center",fontSize:9,color:T2}}>SiP<input type="checkbox" checked={item.showInPreview} onChange={e=>updateItem(activeChest,index,{showInPreview:e.target.checked})}/></label>
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><input type="number" value={item.expressionValue} onChange={e=>updateItem(activeChest,index,{expressionValue:e.target.value})} placeholder="—" style={{...inputStyle,width:70}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
