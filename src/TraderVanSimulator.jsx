import { useState, useEffect } from "react";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const inputStyle={width:"100%",background:"#1a1a22",border:`1px solid ${BRD}`,borderRadius:0,color:T1,fontSize:12,padding:"7px 9px",boxSizing:"border-box"};
const label={fontSize:10,color:T2,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};

const PRICE_OPTIONS=[
  {value:"G",label:"G — Гемы"},
  {value:"C",label:"C — Коины"},
  {value:"R",label:"R — Real"},
  {value:"P",label:"P — PixelPassCurrency"},
  {value:"E",label:"E — EventCurrency"},
  {value:"U",label:"U — Coupon"},
  {value:"F",label:"F — Craft"},
  {value:"B",label:"B — BattlePass"},
];

const emptyItem=()=>({startDate:"",endDate:"",price:"G",sale:"",content:"",showTimer:false,priceAmount:"",buyLimit:""});
const defaultBalance=()=>({sStyle:"basic",season:"basic",items:[emptyItem()]});

export default function TraderVanSimulator(){
  const [balanceName,setBalanceName]=useState("");
  const [balance,setBalance]=useState(defaultBalance());
  const [savedBalances,setSavedBalances]=useState([]);
  const [nextId,setNextId]=useState(null);
  const [status,setStatus]=useState({state:"idle",message:""});

  useEffect(()=>{
    window.workspaceStore?.read("traderVanBalances").then(list=>{if(Array.isArray(list))setSavedBalances(list)}).catch(()=>{});
    window.workspaceGoogle?.getNextTraderVanId().then(info=>setNextId(info.nextId)).catch(()=>{});
  },[]);

  const patch=p=>setBalance(prev=>({...prev,...p}));
  const updateItem=(index,p)=>setBalance(prev=>({...prev,items:prev.items.map((item,i)=>i===index?{...item,...p}:item)}));
  const addItem=()=>setBalance(prev=>({...prev,items:[...prev.items,emptyItem()]}));
  const removeItem=index=>setBalance(prev=>({...prev,items:prev.items.filter((_,i)=>i!==index)}));

  const persist=(next)=>window.workspaceStore?.write("traderVanBalances",next).catch(()=>{});

  const saveBalance=async()=>{
    const name=balanceName.trim();
    if(!name){setStatus({state:"error",message:"Введите название для сохранения баланса"});return}
    const exists=savedBalances.some(b=>b.name===name);
    if(exists&&!window.confirm(`Баланс «${name}» уже существует. Перезаписать?`))return;
    const snapshot={name,...balance};
    const next=exists?savedBalances.map(b=>b.name===name?snapshot:b):[...savedBalances,snapshot];
    setSavedBalances(next);
    await persist(next);
    setStatus({state:"success",message:`Баланс «${name}» сохранён`});
  };
  const loadBalance=name=>{
    const found=savedBalances.find(b=>b.name===name);
    if(!found)return;
    const {name:_,...rest}=found;
    setBalance({...defaultBalance(),...rest});
    setBalanceName(name);
    setStatus({state:"idle",message:""});
  };
  const deleteBalance=async()=>{
    const name=balanceName.trim();
    if(!savedBalances.some(b=>b.name===name)){setStatus({state:"error",message:"Сначала выберите сохранённый баланс"});return}
    if(!window.confirm(`Удалить баланс «${name}»?`))return;
    const next=savedBalances.filter(b=>b.name!==name);
    setSavedBalances(next);
    await persist(next);
    setStatus({state:"success",message:`Баланс «${name}» удалён`});
  };

  const createConfig=async()=>{
    if(!balance.items.length){setStatus({state:"error",message:"Добавьте хотя бы один предмет"});return}
    setStatus({state:"loading",message:"Создаём конфиг..."});
    try{
      const result=await window.workspaceGoogle?.applyTraderVan({sStyle:balance.sStyle,season:balance.season,items:balance.items});
      setStatus({state:"success",message:`Готово: i_season ${result.seasonId}`});
      window.workspaceGoogle?.getNextTraderVanId().then(info=>setNextId(info.nextId)).catch(()=>{});
    }catch(error){
      setStatus({state:"error",message:error.message||"Ошибка"});
    }
  };

  return (
    <div style={{color:T1}}>
      <div style={{fontSize:11,color:T2,marginBottom:14}}>Следующий i_season: <b style={{color:A}}>{nextId??"…"}</b></div>

      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
        <div><div style={label}>Название баланса</div><input value={balanceName} onChange={e=>setBalanceName(e.target.value)} placeholder="Например: SummerVan" style={{...inputStyle,width:200}}/></div>
        {savedBalances.length>0 && (
          <div><div style={label}>Сохранённые</div>
            <select value="" onChange={e=>e.target.value&&loadBalance(e.target.value)} style={{...inputStyle,width:180}}>
              <option value="">Загрузить...</option>
              {savedBalances.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={saveBalance} style={{padding:"7px 16px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Сохранить</button>
        {savedBalances.some(b=>b.name===balanceName.trim()) && <button onClick={deleteBalance} style={{padding:"7px 16px",background:"transparent",border:`1px solid ${DNG}`,color:DNG,fontSize:12,cursor:"pointer"}}>Удалить</button>}
      </div>
      {status.message && <div style={{marginBottom:14,fontSize:11,color:status.state==="error"?DNG:"#22C55E"}}>{status.message}</div>}

      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
        <div style={{width:160}}><div style={label}>s_style</div><input value={balance.sStyle} onChange={e=>patch({sStyle:e.target.value})} style={inputStyle}/></div>
        <div style={{width:160}}><div style={label}>season</div><input value={balance.season} onChange={e=>patch({season:e.target.value})} style={inputStyle}/></div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
          <thead><tr style={{color:T2,textAlign:"left"}}>
            <th style={{padding:"4px 6px",width:40}}>Id</th>
            <th style={{padding:"4px 6px",width:150}}>Дата старта</th>
            <th style={{padding:"4px 6px",width:150}}>Дата окончания</th>
            <th style={{padding:"4px 6px",width:90}}>BuyLimit</th>
            <th style={{padding:"4px 6px",width:170}}>Price</th>
            <th style={{padding:"4px 6px",width:80}}>Sale</th>
            <th style={{padding:"4px 6px",minWidth:220}}>Content</th>
            <th style={{padding:"4px 6px",width:90}}>ShowTimer</th>
            <th style={{padding:"4px 6px",width:110}}>PriceAmount</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {balance.items.map((item,index)=>(
              <tr key={index} style={{borderTop:`1px solid ${BRD}`}}>
                <td style={{padding:"4px 6px",color:T2}}>{index+1}</td>
                <td style={{padding:"4px 6px"}}><input type="date" value={item.startDate} onChange={e=>updateItem(index,{startDate:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input type="date" value={item.endDate} onChange={e=>updateItem(index,{endDate:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={item.buyLimit} onChange={e=>updateItem(index,{buyLimit:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}>
                  <select value={item.price} onChange={e=>updateItem(index,{price:e.target.value})} style={inputStyle}>
                    {PRICE_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </td>
                <td style={{padding:"4px 6px"}}><input value={item.sale} onChange={e=>updateItem(index,{sale:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}><input value={item.content} onChange={e=>updateItem(index,{content:e.target.value})} placeholder="#Weapon:tag:1" style={inputStyle}/></td>
                <td style={{padding:"4px 6px",textAlign:"center"}}><input type="checkbox" checked={item.showTimer} onChange={e=>updateItem(index,{showTimer:e.target.checked})} style={{width:16,height:16,accentColor:A,cursor:"pointer"}}/></td>
                <td style={{padding:"4px 6px"}}><input value={item.priceAmount} onChange={e=>updateItem(index,{priceAmount:e.target.value})} style={inputStyle}/></td>
                <td style={{padding:"4px 6px"}}>{balance.items.length>1&&<button onClick={()=>removeItem(index)} style={{background:"transparent",border:"none",color:DNG,cursor:"pointer",fontSize:16}}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addItem} style={{marginTop:8,marginBottom:20,padding:"6px 14px",background:"transparent",border:`1px dashed ${BRD}`,color:T2,fontSize:11,cursor:"pointer"}}>+ предмет</button>

      <div>
        <button onClick={createConfig} disabled={status.state==="loading"} style={{padding:"10px 24px",background:A,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer"}}>Создать конфиг</button>
      </div>
    </div>
  );
}
