import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import LootboxSimulator from "./LootboxSimulator";
import TimeTracker from "./TimeTracker";
import LotterySimulator from "./LotterySimulator";
import NotesPage from "./NotesPage";
import EventCalendar from "./EventCalendar";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from "react-icons/vsc";
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiPlus, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

const A="#ff7348",BG="#292929",SRF="#343934",BRD="#59645b",T1="#c3d8c5",T2="#91a293",DNG="#ff5d55";
const STRIPE=`repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(195,216,197,0.04) 4px,rgba(195,216,197,0.04) 5px),#303330`;
const ZZZ="'ZZZBold','Integral CF',Impact,sans-serif";

const JIRA_EMAIL="d.krasnitsky@cubicgames.com";
const JIRA_TOKEN="ATATT3xFfGF0jXXe_lR_N9tplVahKSSluupYeK023mk1EluThXO-IPe_jGD2P8ZIWzgUhzxpwXNRWYxrMY2XJwt-sAuAcHRBTMhsJ2zpGBKdSUBuw_xtw9ZYxiqqcl7EwapopQO7x5R-O4uf6GiipKDgSNDMW0qEycfHC-yMr55SkKg7DRvV66o=F4AB4211";
const JIRA_FILTER="19197";
const JIRA_BASE="https://cubicgamesstudio.atlassian.net";
const SHEETS_URL="https://docs.google.com/spreadsheets/d/1fGQnW1s9ueyhNxU7G2edY5hljQNUpKPZtRn_Qn-KsYM/edit?gid=1388976908#gid=1388976908";
const GCAL_CLIENT_ID="843756905806-bm9uvc9esj6bvifjkfmp45fchp9d8e0m.apps.googleusercontent.com";
const GCAL_SCOPES="https://www.googleapis.com/auth/calendar.readonly";

/* ─── Google OAuth helper ─── */
function useGoogleAuth(){
  const [token,setToken]=useState(()=>sessionStorage.getItem("gcal_token")||null);
  const [ready,setReady]=useState(false);
  const clientRef=useRef(null);

  useEffect(()=>{
    const script=document.createElement("script");
    script.src="https://accounts.google.com/gsi/client";
    script.async=true;
    script.onload=()=>{
      clientRef.current=window.google.accounts.oauth2.initTokenClient({
        client_id:GCAL_CLIENT_ID,
        scope:GCAL_SCOPES,
        callback:(resp)=>{
          if(resp.access_token){
            setToken(resp.access_token);
            sessionStorage.setItem("gcal_token",resp.access_token);
          }
        },
      });
      setReady(true);
    };
    document.head.appendChild(script);
    return()=>{try{document.head.removeChild(script)}catch(e){}};
  },[]);

  const signIn=useCallback(()=>{if(clientRef.current)clientRef.current.requestAccessToken()},[]);
  const signOut=useCallback(()=>{setToken(null);sessionStorage.removeItem("gcal_token")},[]);

  return {token,ready,signIn,signOut};
}


/* ─── Mini Calendar (left panel) ─── */
function MiniCal({current,onSelect}){
  const [viewDate,setViewDate]=useState(()=>new Date(current));
  const y=viewDate.getFullYear(),m=viewDate.getMonth();
  const first=new Date(y,m,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const prevDays=new Date(y,m,0).getDate();
  const cells=[];
  for(let i=0;i<startDay;i++)cells.push({d:prevDays-startDay+1+i,out:true});
  for(let i=1;i<=daysInMonth;i++)cells.push({d:i,out:false});
  const rem=7-cells.length%7;
  if(rem<7)for(let i=1;i<=rem;i++)cells.push({d:i,out:true});
  const today=new Date();today.setHours(0,0,0,0);
  const monLabel=viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});

  return (
    <div style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:T1,flex:1}}>{monLabel}</div>
        <div onClick={()=>setViewDate(new Date(y,m-1,1))} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <div onClick={()=>setViewDate(new Date(y,m+1,1))} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,textAlign:"center"}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} style={{fontSize:10,color:T2,fontWeight:600,padding:"4px 0"}}>{d}</div>
        ))}
        {cells.map((c,i)=>{
          const cellDate=c.out?null:new Date(y,m,c.d);
          const isToday=cellDate&&cellDate.getTime()===today.getTime();
          return (
            <div key={i}
              onClick={()=>{if(cellDate)onSelect(cellDate)}}
              style={{fontSize:11,borderRadius:"50%",cursor:c.out?"default":"pointer",color:c.out?"#333":isToday?BG:T1,background:isToday?A:"transparent",fontWeight:isToday?800:400,transition:"background .15s",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}
              onMouseEnter={e=>{if(!c.out&&!isToday)e.currentTarget.style.background="rgba(255,255,255,0.08)"}}
              onMouseLeave={e=>{if(!c.out&&!isToday)e.currentTarget.style.background="transparent"}}>
              {c.d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Layout overlapping events side-by-side ─── */
function layoutEvents(dayEvents,getEventPos){
  const items=dayEvents.filter(e=>e.start?.dateTime).map(e=>({ev:e,...getEventPos(e)}));
  items.sort((a,b)=>a.top-b.top||b.height-a.height);
  const columns=[];
  items.forEach(item=>{
    let placed=false;
    for(let c=0;c<columns.length;c++){
      const last=columns[c][columns[c].length-1];
      if(item.top>=last.top+last.height){columns[c].push(item);item.col=c;placed=true;break}
    }
    if(!placed){item.col=columns.length;columns.push([item])}
  });
  const totalCols=columns.length;
  items.forEach(item=>{item.totalCols=totalCols});
  return items;
}

/* ─── Calendar Component ─── */
function CalendarTab(){
  const {token,ready,signIn,signOut}=useGoogleAuth();
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const [weekOff,setWeekOff]=useState(0);
  const [selEvent,setSelEvent]=useState(null);
  const [nowMin,setNowMin]=useState(()=>{const n=new Date();return n.getHours()*60+n.getMinutes()});

  useEffect(()=>{
    const iv=setInterval(()=>{const n=new Date();setNowMin(n.getHours()*60+n.getMinutes())},60000);
    return()=>clearInterval(iv);
  },[]);

  const getWeekDays=useCallback(()=>{
    const now=new Date();
    now.setDate(now.getDate()+weekOff*7);
    const day=now.getDay();
    const mon=new Date(now);
    mon.setDate(now.getDate()-(day===0?6:day-1));
    mon.setHours(0,0,0,0);
    const days=[];
    for(let i=0;i<5;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d)}
    return days;
  },[weekOff]);

  const days=useMemo(()=>getWeekDays(),[getWeekDays]);
  const weekStart=days[0];
  const weekEnd=new Date(days[4]);weekEnd.setHours(23,59,59,999);

  useEffect(()=>{
    if(!token)return;
    setLoading(true);setErr(null);
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`,{
      headers:{"Authorization":`Bearer ${token}`}
    })
      .then(r=>{
        if(r.status===401){signOut();throw new Error("Token expired — sign in again")}
        if(!r.ok)throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d=>{setEvents(d.items||[]);setLoading(false)})
      .catch(e=>{setErr(e.message);setLoading(false)});
  },[token,weekOff]);

  const START_H=10,END_H=20,HOUR_H=68;
  const hours=[];for(let h=START_H;h<=END_H;h++)hours.push(h);
  const GRID_H=HOUR_H*(END_H-START_H);
  const DAY_NAMES=["Mon","Tue","Wed","Thu","Fri"];
  const today=new Date();today.setHours(0,0,0,0);
  const isThisWeek=weekOff===0;
  const nowTop=((nowMin-START_H*60)/60)*HOUR_H;
  const showNowLine=isThisWeek&&nowMin>=START_H*60&&nowMin<=END_H*60;

  const getEventsForDay=(dayDate)=>{
    const y=dayDate.getFullYear(),mo=dayDate.getMonth(),da=dayDate.getDate();
    return events.filter(e=>{
      const s=new Date(e.start?.dateTime||e.start?.date);
      return s.getFullYear()===y&&s.getMonth()===mo&&s.getDate()===da;
    });
  };

  const getEventPos=(e)=>{
    const s=new Date(e.start?.dateTime);
    const en=new Date(e.end?.dateTime);
    const startMin=Math.max(s.getHours()*60+s.getMinutes(),START_H*60);
    const endMin=Math.min(en.getHours()*60+en.getMinutes(),END_H*60);
    return {top:((startMin-START_H*60)/60)*HOUR_H,height:Math.max(((endMin-startMin)/60)*HOUR_H-2,22)};
  };

  const getEventColor=(e)=>{
    const h=new Date(e.start?.dateTime).getHours();
    if(h<14)return{bg:"#E85D75",bgFade:"rgba(232,93,117,0.18)",border:"#E85D75",text:"#fff",textFade:"#E85D75"};
    if(h<17)return{bg:"#E8A85D",bgFade:"rgba(232,168,93,0.18)",border:"#E8A85D",text:"#000",textFade:"#E8A85D"};
    return{bg:"#5D8DE8",bgFade:"rgba(93,141,232,0.18)",border:"#5D8DE8",text:"#fff",textFade:"#5D8DE8"};
  };

  const isAccepted=(e)=>{
    if(!e.attendees)return true;
    const me=e.attendees.find(a=>a.self);
    return !me||me.responseStatus==="accepted"||me.responseStatus==="tentative";
  };

  const fmtTime=(iso)=>{const d=new Date(iso);const h=d.getHours();const m=d.getMinutes();const ap=h>=12?"pm":"am";const h12=h%12||12;return m===0?`${h12}${ap}`:`${h12}:${String(m).padStart(2,"0")}${ap}`};
  const fmtRange=(s,e)=>`${fmtTime(s)} - ${fmtTime(e)}`;

  const navigateToDate=(date)=>{
    const now=new Date();
    const diff=Math.floor((date-now)/86400000);
    setWeekOff(Math.floor(diff/7));
    setSelEvent(null);
  };

  if(!token){
    return (
      <div className="calendar-page" style={{height:"100%",background:BG,borderRadius:16,border:`1px solid ${BRD}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{fontSize:40,opacity:0.3}}>📅</div>
        <div style={{fontSize:14,color:T1,fontWeight:600}}>Sign in to view your calendar</div>
        <div style={{fontSize:11,color:T2,textAlign:"center",maxWidth:280,lineHeight:1.5}}>Sign in with your Google Workspace account to load events.</div>
        <button onClick={signIn} disabled={!ready} style={{padding:"10px 24px",background:ready?A:"#333",color:ready?"#000":T2,border:"none",borderRadius:12,fontSize:13,fontWeight:800,fontFamily:ZZZ,fontStyle:"italic",cursor:ready?"pointer":"default"}}>
          {ready?"Sign in with Google":"Loading..."}
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-page" style={{height:"100%",background:BG,borderRadius:16,border:`1px solid ${BRD}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",padding:"10px 16px",gap:8,flexShrink:0}}>
        <div style={{width:3,height:16,background:A,borderRadius:1}}/>
        <div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Calendar</div>
        {!isThisWeek&&<div onClick={()=>{setWeekOff(0);setSelEvent(null)}} style={{padding:"4px 10px",background:A,borderRadius:8,fontSize:10,fontWeight:800,color:"#000",cursor:"pointer",marginLeft:4}}>Today</div>}
        <div style={{flex:1}}/>
        <div onClick={signOut} style={{fontSize:9,color:"#555",cursor:"pointer"}}>Sign out</div>
        <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"#555",textDecoration:"none"}}>Open ↗</a>
      </div>

      {loading&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:T2,fontSize:12}}>Loading...</span></div>}
      {err&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><span style={{color:DNG,fontSize:12}}>{err}</span>{err.includes("expired")&&<button onClick={signIn} style={{padding:"6px 16px",background:A,color:"#000",border:"none",borderRadius:8,fontSize:11,fontWeight:800,cursor:"pointer"}}>Sign in again</button>}</div>}

      {!loading&&!err&&(
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* ── Left panel ── */}
          <div style={{width:260,flexShrink:0,borderRight:`1px solid ${BRD}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <MiniCal current={days[0]} onSelect={navigateToDate}/>
            <div style={{margin:"0 14px",height:1,background:BRD}}/>

            {/* Week nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 14px"}}>
              <div onClick={()=>{setWeekOff(w=>w-1);setSelEvent(null)}} style={{width:28,height:28,background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div style={{fontSize:11,color:T2,fontWeight:600,minWidth:110,textAlign:"center"}}>
                {days[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} — {days[4].toLocaleDateString("en-US",{month:"short",day:"numeric"})}
              </div>
              <div onClick={()=>{setWeekOff(w=>w+1);setSelEvent(null)}} style={{width:28,height:28,background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={T1} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            </div>

            <div style={{margin:"0 14px",height:1,background:BRD}}/>

            {/* Event detail */}
            <div style={{flex:1,overflowY:"auto"}}>
              {selEvent?(
                <div style={{padding:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                    <div style={{width:3,height:14,background:A,borderRadius:1}}/>
                    <div style={{fontSize:11,fontWeight:800,fontFamily:ZZZ,color:T1,textTransform:"uppercase",letterSpacing:0.5,flex:1}}>Event</div>
                    <div onClick={()=>setSelEvent(null)} style={{width:22,height:22,background:BRD,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke={T1} strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                  </div>
                  <div style={{fontSize:16,fontWeight:800,color:T1,marginBottom:8,lineHeight:1.3}}>{selEvent.summary||"(no title)"}</div>
                  <div style={{fontSize:12,color:T2,marginBottom:6}}>
                    {selEvent.start?.dateTime&&<>
                      <span style={{color:A,fontWeight:600}}>{new Date(selEvent.start.dateTime).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                      <br/>{fmtTime(selEvent.start.dateTime)} – {fmtTime(selEvent.end.dateTime)}
                    </>}
                    {selEvent.start?.date&&!selEvent.start?.dateTime&&<span style={{color:A,fontWeight:600}}>All day</span>}
                  </div>
                  {!isAccepted(selEvent)&&<div style={{fontSize:10,color:DNG,fontWeight:600,marginBottom:6,padding:"3px 8px",background:"rgba(255,68,68,0.1)",borderRadius:6,display:"inline-block"}}>Not accepted</div>}
                  {selEvent.location&&<div style={{fontSize:11,color:T2,marginBottom:6}}>📍 {selEvent.location}</div>}
                  {selEvent.hangoutLink&&<a href={selEvent.hangoutLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginBottom:10,padding:"6px 14px",background:A,color:"#000",borderRadius:8,fontSize:12,fontWeight:800,textDecoration:"none"}}>Join Meet ↗</a>}
                  {selEvent.conferenceData?.entryPoints?.map((ep,i)=>(
                    ep.entryPointType==="video"&&!selEvent.hangoutLink&&<a key={i} href={ep.uri} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginBottom:10,padding:"6px 14px",background:A,color:"#000",borderRadius:8,fontSize:12,fontWeight:800,textDecoration:"none"}}>{ep.label||"Join call"} ↗</a>
                  ))}
                  {selEvent.description&&<div style={{fontSize:11,color:T2,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",borderTop:`1px solid ${BRD}`,paddingTop:10,marginTop:6}} dangerouslySetInnerHTML={{__html:selEvent.description}}/>}
                  {selEvent.attendees&&selEvent.attendees.length>0&&(
                    <div style={{marginTop:10,borderTop:`1px solid ${BRD}`,paddingTop:10}}>
                      <div style={{fontSize:9,color:T2,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:6}}>Attendees</div>
                      {selEvent.attendees.map((a,i)=>(
                        <div key={i} style={{fontSize:11,color:a.responseStatus==="accepted"?"#22C55E":a.responseStatus==="declined"?DNG:T2,marginBottom:3}}>
                          {a.displayName||a.email} {a.organizer&&<span style={{fontSize:9,color:A}}>org</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {selEvent.htmlLink&&<a href={selEvent.htmlLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,fontSize:10,color:"#555",textDecoration:"none"}}>Open in Google Calendar ↗</a>}
                </div>
              ):(
                <div style={{padding:"30px 14px",textAlign:"center",color:"#333",fontSize:11}}>Select an event to view details</div>
              )}
            </div>
          </div>

          {/* ── Week grid ── */}
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            {/* Time gutter */}
            <div style={{width:48,flexShrink:0,borderRight:`1px solid ${BRD}`,display:"flex",flexDirection:"column"}}>
              <div style={{height:40,flexShrink:0}}/>
              <div style={{position:"relative",height:GRID_H}}>
                {hours.map((h,i)=>(
                  <div key={h} style={{position:"absolute",top:i*HOUR_H,right:8}}>
                    <span style={{fontSize:11,color:T2,lineHeight:1}}>{String(h).padStart(2,"0")}.00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day columns */}
            {days.map((d,di)=>{
              const isToday=d.getTime()===today.getTime();
              const dayEvents=getEventsForDay(d);
              const laid=layoutEvents(dayEvents,getEventPos);
              return (
                <div key={di} style={{flex:1,borderRight:di<4?"1px solid rgba(58,58,68,0.4)":"none",minWidth:0,display:"flex",flexDirection:"column"}}>
                  {/* Day header */}
                  <div style={{height:40,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${BRD}`,flexShrink:0}}>
                    <span style={{fontSize:12,color:isToday?A:T2,fontWeight:600,marginRight:5}}>{DAY_NAMES[di]}</span>
                    <span style={{fontSize:15,fontWeight:800,color:isToday?"#000":T1,background:isToday?A:"transparent",width:28,height:28,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{d.getDate()}</span>
                  </div>

                  {/* Grid area */}
                  <div style={{position:"relative",height:GRID_H}}>
                    {/* Hour lines */}
                    {hours.map((h,i)=>(
                      <div key={h} style={{position:"absolute",top:i*HOUR_H,left:0,right:0,borderTop:"1px solid rgba(58,58,68,0.15)"}}/>
                    ))}

                    {/* Now line */}
                    {showNowLine&&isToday&&(
                      <div style={{position:"absolute",top:nowTop,left:-1,right:-1,zIndex:20,pointerEvents:"none",display:"flex",alignItems:"center"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:A,flexShrink:0,marginLeft:-5}}/>
                        <div style={{flex:1,height:2,background:A}}/>
                      </div>
                    )}

                    {/* Events (side-by-side) */}
                    {laid.map((item,ei)=>{
                      const ev=item.ev;
                      const clr=getEventColor(ev);
                      const accepted=isAccepted(ev);
                      const sel=selEvent?.id===ev.id;
                      const colW=100/item.totalCols;
                      const leftPct=item.col*colW;
                      return (
                        <div key={ev.id||ei} onClick={()=>setSelEvent(sel?null:ev)}
                          style={{position:"absolute",top:item.top,left:`calc(${leftPct}% + 2px)`,width:`calc(${colW}% - 4px)`,height:item.height,
                            background:accepted?(sel?clr.bg:clr.bgFade):"transparent",
                            border:accepted?`1.5px solid ${sel?clr.bg:clr.border}`:`1.5px dashed ${clr.border}`,
                            borderRadius:6,padding:"3px 6px",overflow:"hidden",cursor:"pointer",
                            transition:"all .15s",zIndex:sel?5:1}}>
                          <div style={{fontSize:11,fontWeight:700,color:sel&&accepted?clr.text:clr.textFade,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.summary||"(no title)"}</div>
                          {item.height>30&&<div style={{fontSize:9,color:sel&&accepted?clr.text:T2,marginTop:1}}>{fmtRange(ev.start.dateTime,ev.end.dateTime)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Bottom stripe */}
      <div style={{height:12,flexShrink:0,background:`repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 6px)`,borderTop:`1px solid ${BRD}`}}/>
    </div>
  );
}

const SC={"To Do":"#3B82F6","In Progress":"#F59E0B","Done":"#22C55E","к выполнению":"#3B82F6","К выполнению":"#3B82F6","В работе":"#F59E0B","Готово":"#22C55E","Reopened":"#3B82F6","QA Verified":"#4faf72","Merged":"#4faf72","Need More Info":"#F59E0B","On Hold":"#6B7280","Ready to Testing":"#8B5CF6","В процессе проверки":"#8B5CF6","In Testing":"#8B5CF6","Открыто повторно":"#3B82F6","Закрыто":"#22C55E","Ready to Merge":"#4faf72"};
const SEN={"к выполнению":"TO DO","К выполнению":"TO DO","В работе":"IN PROGRESS","Готово":"DONE","Открыто повторно":"REOPENED","В процессе проверки":"READY TO TESTING","Закрыто":"CLOSED"};
const TODO_S=["к выполнению","К выполнению","reopened","открыто повторно"];
const DONE_S=["готово","qa verified","merged","закрыто","ready to merge"];
const ACTIVE_S=["в работе","in testing","в процессе проверки"];
const S_ORDER={"В работе":0,"к выполнению":1,"Reopened":1,"Открыто повторно":1,"QA Verified":2,"Merged":2,"Ready to Merge":2,"В процессе проверки":2,"In Testing":2,"Готово":3,"Закрыто":3};
const NO_IFRAME=["tableau.lightmap.com","appsheet.com","claude.ai","notion.so","figma.com","translate.yandex.ru","gitlab.lightmap.com","atlassian.net"];

function sDisp(s){return (SEN[s]||s||"").toUpperCase()}
function sClr(s){return SC[s]||"#6B7280"}
function canEmbed(url){try{const h=new URL(url).hostname;return !NO_IFRAME.some(d=>h.includes(d))}catch(e){return false}}
function proxyUrl(url){try{const u=new URL(url);if(u.hostname.includes("atlassian.net"))return "/jira-api"+u.pathname+u.search+u.hash;return url}catch(e){return url}}
function getGreeting(){const h=new Date().getHours();if(h<6)return "Good night";if(h<13)return "Good morning";if(h<18)return "Good afternoon";return "Good evening"}

function ParseDesc({text}){
  if(!text) return <span style={{color:T2,fontStyle:"italic"}}>No description — click to add</span>;
  const re=/\[([^|\]]+)\|([^\]]+)\]|\[([^\]]+)\]/g;
  const parts=[];let last=0;let m;
  while((m=re.exec(text))!==null){
    if(m.index>last) parts.push(<span key={"t"+m.index}>{text.slice(last,m.index)}</span>);
    const label=m[1]||m[3],url=m[2]||m[3];
    parts.push(<a key={"a"+m.index} href={url} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none",fontWeight:500}}>{label}</a>);
    last=re.lastIndex;
  }
  if(last<text.length) parts.push(<span key="end">{text.slice(last)}</span>);
  return parts.length>0 ? <>{parts}</> : <span>{text}</span>;
}

const MIRO_BOARDS=[
  {name:"GameOffer Resources",url:"https://miro.com/app/live-embed/uXjVPsBJW2c=/?moveToViewport=4380,-7022,6509,3112&embedId=73948711755",desc:"Ресурсы для офферов"},
  {name:"PG3D Items",url:"https://miro.com/app/live-embed/o9J_lr2kApE=/?moveToViewport=672,-7901,5424,2594&embedId=408374462174",desc:"База итемов с картинками"},
  {name:"Dmitriy Krasnitskiy",url:"https://miro.com/app/live-embed/uXjVNThhVxM=/?moveToViewport=20751,-20245,36951,17671&embedId=617913335258",desc:"Личная доска"},
  {name:"Monetization - Planning",url:"https://miro.com/app/live-embed/uXjVNbbbAtA=/?moveToViewport=-181228,-70904,391196,187084&embedId=959101288117",desc:"Концепты лайв-опс активностей"},
];

const CONFIGS=[
  {name:"Trader Van",icon:"/icons/trader-van.png",url:"https://docs.google.com/spreadsheets/d/1qKogyjkoHpO6imV1aU5ZyWKpFuF9Hr_qPYyc8RpamfE/edit?pli=1&gid=1806543965#gid=1806543965"},
  {name:"LootBoxes",icon:"/icons/lootboxes.png",url:"https://docs.google.com/spreadsheets/d/1yo8yR4JrIalvrxEqHCoj32UJ4Q4LZwosXhyApRZUVFg/edit?gid=477693117#gid=477693117"},
  {name:"Offers",icon:"/icons/offers.png",url:"https://docs.google.com/spreadsheets/d/1vlDGjRJqApHyicMYLd9PtFhL9C5FCl0jhD0N4D2zyWs/edit?gid=1298282127#gid=1298282127"},
  {name:"Localization",icon:"/icons/localization.png",url:"https://docs.google.com/spreadsheets/d/1x8FIcdnR-FpSTsdIV2GlWfAQUyzv2e_I6z4Q_BMOGmU/edit?gid=1409705545#gid=1409705545"},
  {name:"Lottery",icon:"/icons/lottery.png",url:"https://docs.google.com/spreadsheets/d/1d2mBr0-yDswgyFzTeaFHdbNEizukTEtCtaYkG3PzouI/edit?gid=1435187476#gid=1435187476"},
  {name:"Balance",icon:"/icons/balance.png",url:"https://docs.google.com/spreadsheets/d/1bnMxSgihWoq3nKmsU59uki8v2i2dkKjdY2mOOKRUKJ0/edit?gid=1642372391#gid=1642372391"},
  {name:"Event Center",icon:"/icons/event-center.png",url:"https://docs.google.com/spreadsheets/d/1lyMS61re8SfGLwaHP-B1ccFwAKlMJHXOiBYxWWyGEnk/edit?gid=272367832#gid=272367832"},
  {name:"Card Roulette",icon:"/icons/card-roulette.png",url:"https://docs.google.com/spreadsheets/d/1onDfSBGSAnHqLTglpj0upGhBZCJrjkL50V03sVnlFrk/edit?gid=1041170058#gid=1041170058"},
  {name:"Main Store",icon:"/icons/main-store.png",url:"https://docs.google.com/spreadsheets/d/1u3yjemhvz5KL7SnxV-mHhRvpa9gO_zdi2rHtRflFQhs/edit?gid=546486489#gid=546486489"},
  {name:"Attributes",icon:"/icons/attributes.png",url:"https://docs.google.com/spreadsheets/d/1ny_0djfR2Lfr4mTpBqMpJBWMkPS3MntEJxVjIlo7y88/edit?gid=1298282127#gid=1298282127"},
  {name:"Pers. Events",icon:"/icons/pers-events.png",url:"https://docs.google.com/spreadsheets/d/12WklJDMluXtBqlRzJblNLVvxXqh86R4hKbdLw7Mm-KE/edit?gid=0#gid=0"},
  {name:"Temp. Events",icon:"/icons/temp-events.png",url:"https://docs.google.com/spreadsheets/d/1bloozm-L0zlGycSDpH_FcVtesp7aWMwjsrk8ycTOMyM/edit?gid=1538831076#gid=1538831076"},
  {name:"AB Test",icon:"/icons/ab-test.png",url:"https://docs.google.com/spreadsheets/d/1KK-NJlVjculhuG2wPiFRa3U0mtKa7ojEUff0CoU0DZI/edit?gid=524589511#gid=524589511"},
  {name:"Exp Open",icon:"/icons/exp-open.png",url:"https://docs.google.com/spreadsheets/d/10Q0AtqZ2P3XLqAvk7uJ-rJr59j2obGGtBFR7kGn0dEU/edit?gid=735417490#gid=735417490"},
  {name:"Map List",icon:"/icons/map-list.png",url:"https://docs.google.com/spreadsheets/d/1e_y2x7YRupUSDXxhpsiOLzKTcDE8yq4oahgRiNgNfHU/edit?gid=731056815#gid=731056815"},
  {name:"Clan War",icon:"/icons/clan-war.png",url:"https://docs.google.com/spreadsheets/d/1gMT-SZ7_21JVLyA9_PUr-udTUWuANqmIuAEQZ_muoYo/edit?gid=1303472773#gid=1303472773"},
  {name:"ADS Roulette",icon:"/icons/ads-roulette.png",url:"https://docs.google.com/spreadsheets/d/1JFLI7wCdjWRIgI4DDOgztpwQ3aF_bx7-crf84ENphCk/edit?gid=1797882636#gid=1797882636"},
  {name:"Clan Chests",icon:"/icons/clan-chests.png",url:"https://docs.google.com/spreadsheets/d/140Reh4WxbJKOPJqKdJnI4lZvhUFGiw3AW-wdlBcvShE/edit#gid=1401792340"},
  {name:"GameModeHub",icon:"/icons/game-mode-hub.png",url:"https://docs.google.com/spreadsheets/d/1oEP6E5MZC_4pK4bUTxcbOuR_Vo9ZMF5-_N9nh2JGzkk/edit#gid=191785334"},
  {name:"Tournament",icon:"/icons/tournament.png",url:"https://docs.google.com/spreadsheets/d/1ebOFV3-GmYoVcDPVHg0wwKr834GTijfG8-0VzzcvOa8/edit#gid=1952180301"},
  {name:"Bots",icon:"/icons/bots.png",url:"https://docs.google.com/spreadsheets/d/1fpVcK1-r_Zl4x-_gJui4sQnN4JVJL3vox1qRJnSLZbM/edit?gid=175703923#gid=175703923"},
  {name:"Rotation",icon:"/icons/rotation.png",url:"https://docs.google.com/spreadsheets/d/1P_j0Yhc9sk_2dk8BQK6oH-z6cZ5uUw0FGw65sAosCxw/edit?gid=2024213723#gid=2024213723"},
];

const FILES=[
  {name:"График ивентов — Google Sheets",icon:"/icons/content-plan.png",url:SHEETS_URL},
  {name:"Tableau",icon:"/icons/tableau.png",url:"https://tableau.lightmap.com/#/views/GameOffersStats_16814863932280/GameOffersstats?:iid=2"},
  {name:"PG3D.Admin",icon:"/icons/admin.png",url:"https://admin.pixelgun3d.com/login.php"},
  {name:"Appsheet",icon:"/icons/appsheet.png",url:"https://www.appsheet.com/start/af0ee9ea-93dd-4252-a0b6-8f5ff46bc8a3"},
  {name:"GitLab",icon:"/icons/gitlab.webp",url:"https://gitlab.lightmap.com/users/sign_in"},
  {name:"Claude",icon:"/icons/claude.png",url:"https://claude.ai/new"},
  {name:"Content Sheet",icon:"/icons/content-sheet.png",url:"https://docs.google.com/spreadsheets/d/1ZM2fCvf580tDi0bA7RshmHuKzg-X9y84RN40FHfbhTc/edit?gid=1438679607#gid=1438679607"},
  {name:"Calculator",icon:"/icons/calculator.png",url:"https://docs.google.com/spreadsheets/d/1kanzsPLAdiIsQbC8Bz0plim9qG1_3hEkR_e-T0kV0cM/edit?gid=2083202133#gid=2083202133"},
  {name:"Configs Archive",icon:"/icons/archive.png",url:"https://docs.google.com/document/d/1X2ktgdRp0SfQMBmR9_6rrtXBp1Kc_oteQg6N_hWQ2qY/edit"},
  {name:"Aghanim",icon:"/icons/aghanim.png",url:"https://docs.google.com/spreadsheets/u/1/d/1isCRJ9l_w-JbM4aXoXY22nftZyr5IAO0UkpMYe_LwvM/edit?gid=1461258706#gid=1461258706"},
  {name:"Content Plan",icon:"/icons/content-plan.png",url:"https://docs.google.com/spreadsheets/d/1lUrRJlwMvamwj-GP_Am03iJ9Y3ziU_K4Cce39uiIoUY/edit?gid=1741412222#gid=1741412222"},
  {name:"Notion",icon:"/icons/notion.png",url:"https://www.notion.so/cubicgames/cfa8d8f2c5db405a9b37384f0fa72322"},
  {name:"Translator",icon:"/icons/translator.png",url:"https://translate.yandex.ru/?source_lang=en&target_lang=ru"},
  {name:"Figma",icon:"/icons/figma.webp",url:"https://www.figma.com/design/OPWNcCTREwX1OfqVSaxWiK"},
  {name:"Confluence",icon:"/icons/confluence.webp",url:"https://cubicgamesstudio.atlassian.net/wiki/spaces/PG3/pages/3036348439"},
  {name:"Weapon Analytics",icon:"/icons/weapon-anal.png",url:"https://docs.google.com/spreadsheets/d/1YKQ4dtCBeUVpMy1oaBxFC-nS4udGHvjYU_qx7U1HTMs/edit?gid=619054802#gid=619054802"},
  {name:"Distribution&Trends",icon:"/icons/distribution.png",url:"https://docs.google.com/spreadsheets/d/1kGr5rrlg9Y7yKniFaFu_qv2r--2orvUhBYCk7UkYIUI/edit?pli=1&gid=0#gid=0"},
];

const CATALOG=[
  {cat:"Currency",name:"Gems",unit:30,uLabel:"/30"},{cat:"Currency",name:"Coins",unit:50,uLabel:"/50"},{cat:"Currency",name:"Keys",unit:50,uLabel:"/50"},{cat:"Currency",name:"PixelPassExp",unit:150,uLabel:"/150"},{cat:"Currency",name:"PixelPassTicket",unit:60,uLabel:"/60"},{cat:"Currency",name:"GalleryCoupons",unit:50,uLabel:"/50"},{cat:"Currency",name:"ClanSilver",unit:1000,uLabel:"/1000"},{cat:"Currency",name:"Template Currency",unit:5,uLabel:"/5"},
  {cat:"Armor Set",name:"Legendary Armor Set",price:10},{cat:"Armor Set",name:"Mythic Armor Set",price:20},
  {cat:"Armor",name:"Rare Armor",price:2},{cat:"Armor",name:"Epic Armor",price:5},{cat:"Armor",name:"Legendary Armor",price:7},{cat:"Armor",name:"Mythic Armor",price:15},
  {cat:"Gadget",name:"Common Gadget",price:1},{cat:"Gadget",name:"Rare Gadget",price:2},{cat:"Gadget",name:"Epic Gadget",price:5},{cat:"Gadget",name:"Legendary Gadget",price:7},{cat:"Gadget",name:"Mythic Gadget",price:15},
  {cat:"Cosmetic",name:"Module",price:0.1},{cat:"Cosmetic",name:"Boots",price:1},{cat:"Cosmetic",name:"Mask",price:1},{cat:"Cosmetic",name:"Hat",price:1},{cat:"Cosmetic",name:"Cape",price:1},{cat:"Cosmetic",name:"Skin Boots",price:1},{cat:"Cosmetic",name:"Skin Mask",price:1},{cat:"Cosmetic",name:"Skin Hat",price:1},{cat:"Cosmetic",name:"Graffiti",price:1},
  {cat:"Pet",name:"Common Pet",price:0.25},{cat:"Pet",name:"Uncommon Pet",price:0.5},{cat:"Pet",name:"Rare Pet",price:1},{cat:"Pet",name:"Epic Pet",price:2},{cat:"Pet",name:"Legendary Pet",price:4},{cat:"Pet",name:"Mythical Pet",price:6},{cat:"Pet",name:"Mythical P_Parts",price:0.28},{cat:"Pet",name:"Legendary Egg",price:1},{cat:"Pet",name:"Mythical Egg",price:2},
  {cat:"Weapon",name:"Common Weapon",price:1},{cat:"Weapon",name:"Rare Weapon",price:2},{cat:"Weapon",name:"Epic Weapon",price:5},{cat:"Weapon",name:"Legendary Weapon",price:10},{cat:"Weapon",name:"Mythic Weapon",price:20},{cat:"Weapon",name:"Legendary Shovel",price:2},{cat:"Weapon",name:"Mythic Shovel",price:5},
  {cat:"W_Parts",name:"Rare W_Parts",price:0.008},{cat:"W_Parts",name:"Epic W_Parts",price:0.02},{cat:"W_Parts",name:"Legendary W_Parts",price:0.04},{cat:"W_Parts",name:"Mythic W_Parts",price:0.08},
  {cat:"Upgrade",name:"L_Upgrade",price:1},{cat:"Upgrade",name:"Rare Q_Upgrade",price:2},{cat:"Upgrade",name:"Epic Q_Upgrade",price:5},{cat:"Upgrade",name:"Legendary Q_Upgrade",price:10},
  {cat:"Avatar",name:"Epic Avatar",price:2},{cat:"Avatar",name:"Legendary Avatar",price:5},{cat:"Avatar",name:"Mythic Avatar",price:10},{cat:"Avatar",name:"Mythic A_Parts",price:0.04},
  {cat:"Trail",name:"Common Trail",price:0.5},{cat:"Trail",name:"Uncommon Trail",price:1},{cat:"Trail",name:"Rare Trail",price:2},{cat:"Trail",name:"Epic Trail",price:3},{cat:"Trail",name:"Legendary Trail",price:4},{cat:"Trail",name:"Mythic Trail",price:5},
  {cat:"Car",name:"Common Car",price:0.5},{cat:"Car",name:"Rare Car",price:1},{cat:"Car",name:"Epic Car",price:2},{cat:"Car",name:"Legendary Car",price:4},{cat:"Car",name:"Mythic Car",price:6},
  {cat:"Weapon Skin",name:"Epic Weapon Skin",price:2},{cat:"Weapon Skin",name:"Legendary Weapon Skin",price:5},{cat:"Weapon Skin",name:"Mythic Weapon Skin",price:10},
  {cat:"Glider",name:"Common Glider",price:0.5},{cat:"Glider",name:"Uncommon Glider",price:1},{cat:"Glider",name:"Rare Glider",price:2},{cat:"Glider",name:"Epic Glider",price:3},{cat:"Glider",name:"Legendary Glider",price:4},{cat:"Glider",name:"Mythic Glider",price:5},
  {cat:"Booster",name:"Booster x25 XP",price:0.25},{cat:"Booster",name:"Booster x50 XP",price:0.5},{cat:"Booster",name:"Booster x100 XP",price:1},{cat:"Booster",name:"Booster x200 XP",price:2},{cat:"Booster",name:"Gems Booster",price:0.13},
  {cat:"Chest",name:"Lootbox",price:1},{cat:"Chest",name:"Lootbox_T1",price:8},{cat:"Chest",name:"Lootbox_T2",price:6},{cat:"Chest",name:"Lootbox_T3",price:5},{cat:"Chest",name:"Lootbox_T4",price:2},{cat:"Chest",name:"Lootbox_SolidGuns",price:15},{cat:"Chest",name:"Lootbox_Collector",price:15},{cat:"Chest",name:"Small Chest",price:0.2},{cat:"Chest",name:"Medium Chest",price:1},{cat:"Chest",name:"Big Chest",price:5},{cat:"Chest",name:"Monthly Chest",price:7},{cat:"Chest",name:"Super Chest",price:40}
];
const CATS=[...new Set(CATALOG.map(i=>i.cat))];
function iv(item,qty){return item.unit ? qty/item.unit : qty*item.price}

let _offerIdCounter=4;

function Icon({type,color="#fff",sz=15}){
  const p={home:<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>,tasks:<path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm2 4v2h8V6H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z"/>,config:<path d="M12 15.5A3.5 3.5 0 0115.5 12 3.5 3.5 0 0112 8.5 3.5 3.5 0 018.5 12 3.5 3.5 0 0112 15.5zM19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.06 7.06 0 00-1.69-.98l-.38-2.65A.49.49 0 0014 2h-4a.49.49 0 00-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.49.49 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.05.24.26.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.5.5 0 00.61-.22l2-3.46a.49.49 0 00-.12-.64l-2.11-1.65z"/>,boards:<path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/>,tools:<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>,up:<path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>,down:<path d="M12 5v14M5 12l7 7 7-7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>,back:<path d="M15 18l-6-6 6-6" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>};
  return <svg width={sz} height={sz} viewBox="0 0 24 24" fill={["up","down","back"].includes(type)?"none":color}>{p[type]}</svg>;
}

function NavBar({tab,setTab}){
  const tabs=["home","tasks","config","boards","tools"];
  return (
    <div style={{position:"absolute",top:0,right:0,height:48,background:BG,borderRadius:12,zIndex:10,display:"flex",alignItems:"center",gap:6,padding:"0 10px"}}>
      {tabs.map((t,i)=>(
        <div key={t} onClick={()=>setTab(i)} style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
          <Icon type={t} color={tab===i?A:"#fff"} sz={15}/>
          {tab===i && <div style={{position:"absolute",top:3,right:3,width:6,height:6,background:A,borderRadius:"50%"}}/>}
        </div>
      ))}
    </div>
  );
}

/* ─── Tab icon mapping ─── */
const TAB_ICON_MAP={"Trader Van":"\u26DF","LootBoxes":"\uD83D\uDDC3","Offers":"$","Localization":"\u53CB","Lottery":"\uD83C\uDF9F","Balance":"\u2696\uFE0E","Event Center":"\uD83D\uDDD3","Card Roulette":"\uD83C\uDCB1","Main Store":"\u26C1","Attributes":"\uD83C\uDF9A","Pers. Events":"\u2254","Temp. Events":"\u2611","AB Test":"\uD83D\uDDA7","Exp Open":"\u2191","Map List":"\uD83D\uDDFA","Clan War":"\u26E8","ADS Roulette":"\uD83C\uDF9E","Clan Chests":"\uD83D\uDF32","GameModeHub":"\uD800\uDC51","Tournament":"\uD83C\uDF96","Bots":"\u23FB","Rotation":"\u21BB","Tableau":"\uD83D\uDCCA","PG3D.Admin":"\uBAA8","Appsheet":"\uD83D\uDCF1","GitLab":"\uD83E\uDDEA","Claude":"\uD83E\uDD16","Content Sheet":"\u229E","Calculator":"\u00F7","Configs Archive":"\uD83D\uDDC1","Aghanim":"A","Content Plan":"\uD83D\uDDD0","Notion":"\u2712","Translator":"\uD83C\uDF10","Figma":"\u25B2","Confluence":"\uD83D\uDCD6","GameOffer Resources":"\u270E","PG3D Items":"\u270E","Dmitriy Krasnitskiy":"\u270E","Monetization - Planning":"\u270E"};
function getTabIcon(title){return TAB_ICON_MAP[title]||"\uD83D\uDCC4"}

/* ─── Browser Tabs (horizontal pills, bottom center) ─── */
function BrowserTabs({tabs,activeId,showBrowser,onSelect,onClose}){
  const [hovered,setHovered]=useState(null);
  const containerRef=useRef(null);
  const tabRefs=useRef({});
  const [blob,setBlob]=useState({left:0,width:0});
  const [ready,setReady]=useState(false);

  const updateBlob=useCallback(()=>{
    const aId=showBrowser?activeId:null;
    const el=aId!=null?tabRefs.current[aId]:null;
    const container=containerRef.current;
    if(!el||!container)return;
    const cr=container.getBoundingClientRect();
    const er=el.getBoundingClientRect();
    setBlob({left:er.left-cr.left,width:er.width});
    if(!ready)setReady(true);
  },[tabs,activeId,showBrowser,ready]);

  useEffect(()=>{updateBlob()},[updateBlob]);
  useEffect(()=>{const t=setTimeout(updateBlob,60);return()=>clearTimeout(t)},[tabs.length,activeId]);

  if(tabs.length===0)return null;

  const hasActive=showBrowser&&tabs.some(t=>t.id===activeId);

  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:50,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div ref={containerRef} style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
        {hasActive&&<div style={{position:"absolute",top:0,left:blob.left,width:blob.width,height:34,borderRadius:20,background:A,transition:ready?"left 0.3s cubic-bezier(0.4,0,0.2,1),width 0.3s cubic-bezier(0.4,0,0.2,1)":"none",zIndex:0}}/>}
        {tabs.map((t)=>{
          const on=showBrowser&&t.id===activeId;
          const isHov=hovered===t.id;
          return (
            <div key={t.id} ref={el=>{if(el)tabRefs.current[t.id]=el}}
              onClick={()=>onSelect(t.id)}
              onMouseEnter={()=>setHovered(t.id)} onMouseLeave={()=>setHovered(null)}
              style={{height:34,padding:"0 16px",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",background:on?"transparent":"#A2A2A2",transition:"background 0.25s,transform 0.15s",transform:isHov?"scale(1.04)":"scale(1)",zIndex:1}}>
              <span style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,fontStyle:"italic",color:on?"#000":"#131416",letterSpacing:0.5,whiteSpace:"nowrap",transition:"color 0.2s"}}>{t.title.toUpperCase()}</span>
              {isHov&&(
                <div onClick={(e)=>{e.stopPropagation();onClose(t.id)}} style={{position:"absolute",top:-6,right:-6,width:18,height:18,background:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({section,setSection,total}){
  if(typeof window!=="undefined"&&window.__PG3D_DESKTOP_SHELL__)return null;
  return (
    <div style={{position:"absolute",left:0,bottom:0,width:48,height:"55%",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",background:BG,borderRadius:12,padding:"6px 0"}}>
      <div onClick={()=>setSection(Math.max(0,section-1))} style={{width:34,height:34,background:A,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Icon type="up" color={BG} sz={13}/></div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{writingMode:"vertical-rl",transform:"rotate(180deg)",fontSize:28,fontWeight:900,color:"#fff",letterSpacing:4,opacity:0.7}}>{String(section+1).padStart(2,"0")}</div></div>
      <div onClick={()=>setSection(Math.min(total-1,section+1))} style={{width:34,height:34,background:A,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Icon type="down" color={BG} sz={13}/></div>
    </div>
  );
}

function ZzzHeader({onBack,onMinimize,title,rightLabel,rightUrl}){
  return (
    <div style={{position:"relative",height:48,overflow:"hidden",flexShrink:0}}>
      <div style={{position:"absolute",inset:0,background:"#EFF0EF"}}/>
      <div style={{position:"absolute",left:0,bottom:0,right:0,height:"50%",background:A,clipPath:"polygon(0 40%,100% 0,100% 100%,0 100%)"}}/>
      <div style={{position:"absolute",left:0,bottom:0,right:0,height:"38%",background:"repeating-linear-gradient(135deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,padding:"0 12px",height:"100%",display:"flex",alignItems:"center",gap:10}}>
        <div onClick={onBack} onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.querySelector("path").style.stroke=BG}} onMouseLeave={e=>{e.currentTarget.style.background="#000";e.currentTarget.querySelector("path").style.stroke=A}} style={{width:34,height:34,background:"#000",border:`2px solid ${A}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}><Icon type="back" color={A} sz={13}/></div>
        <div style={{width:3,height:18,background:A,borderRadius:1}}/>
        <div style={{fontSize:15,fontWeight:900,fontFamily:ZZZ,fontStyle:"italic",color:"#000",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
        {onMinimize && (
          <div onClick={onMinimize} title="Minimize to tab" onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.querySelector("line").style.stroke=BG}} onMouseLeave={e=>{e.currentTarget.style.background="#000";e.currentTarget.querySelector("line").style.stroke=A}} style={{width:34,height:34,background:"#000",border:`2px solid ${A}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><line x1="5" y1="12" x2="19" y2="12" stroke={A} strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
        )}
        {rightUrl && <a href={rightUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"rgba(0,0,0,0.4)",background:"rgba(0,0,0,0.07)",padding:"4px 10px",borderRadius:5,textDecoration:"none",fontWeight:600,flexShrink:0}}>{rightLabel||"Open"} ↗</a>}
      </div>
    </div>
  );
}

function TaskDetail({taskKey,onClose}){
  const [data,setData]=useState(null);const [trans,setTrans]=useState([]);const [loading,setLoading]=useState(true);const [comment,setComment]=useState("");const [posting,setPosting]=useState(false);const [editDesc,setEditDesc]=useState(false);const [descDraft,setDescDraft]=useState("");const [saving,setSaving]=useState(false);
  const auth=btoa(`${JIRA_EMAIL}:${JIRA_TOKEN}`);const hdrs={"Authorization":`Basic ${auth}`,"Accept":"application/json"};const hdrsJ={...hdrs,"Content-Type":"application/json","X-Atlassian-Token":"no-check"};
  const load=()=>{setLoading(true);Promise.all([fetch(`/jira-api/rest/api/2/issue/${taskKey}?fields=summary,description,status,priority,assignee,reporter,parent,duedate,fixVersions,comment`,{headers:hdrs}).then(r=>r.json()),fetch(`/jira-api/rest/api/2/issue/${taskKey}/transitions`,{headers:hdrs}).then(r=>r.json())]).then(([issue,tr])=>{setData(issue);setTrans(tr.transitions||[]);setLoading(false);setEditDesc(false)})};
  useEffect(()=>{load()},[taskKey]);
  const doTrans=(id)=>{setSaving(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}/transitions`,{method:"POST",headers:hdrsJ,body:JSON.stringify({transition:{id:String(id)}})}).then(r=>{if(!r.ok)return r.text().then(t=>{alert("Failed: "+t);setSaving(false)});setSaving(false);load()}).catch(e=>{alert(e.message);setSaving(false)})};
  const saveDesc=()=>{setSaving(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}`,{method:"PUT",headers:hdrsJ,body:JSON.stringify({fields:{description:descDraft}})}).then(r=>{if(!r.ok)return r.text().then(t=>alert("Failed: "+t));setSaving(false);load()}).catch(e=>{alert(e.message);setSaving(false)})};
  const addComment=()=>{if(!comment.trim())return;setPosting(true);fetch(`/jira-api/rest/api/2/issue/${taskKey}/comment`,{method:"POST",headers:hdrsJ,body:JSON.stringify({body:comment})}).then(()=>{setComment("");setPosting(false);load()})};
  if(loading) return <div style={{position:"absolute",inset:0,zIndex:50,background:BG,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:T2}}>Loading...</div></div>;
  const f=data?.fields||{};const comments=(f.comment?.comments||[]).slice(-20);const clr=sClr(f.status?.name);
  return (
    <div style={{position:"absolute",inset:0,zIndex:50,background:BG,borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <ZzzHeader onBack={onClose} title={<><a href={`${JIRA_BASE}/browse/${taskKey}`} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none",fontWeight:600,marginRight:8}}>{taskKey}</a>{f.summary}</>} rightLabel="Open in Jira" rightUrl={`${JIRA_BASE}/browse/${taskKey}`}/>
      <div style={{flex:1,overflowY:"auto",display:"flex"}}>
        <div style={{flex:1,padding:20,borderRight:`1px solid ${BRD}`,overflowY:"auto"}}>
          <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:700,color:"#fff",background:clr}}>{sDisp(f.status?.name)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={T2}><path d="M9 18l6-6-6-6"/></svg>
            {trans.map(tr=>(<button key={tr.id} onClick={()=>doTrans(tr.id)} disabled={saving} onMouseEnter={e=>{e.currentTarget.style.background=A;e.currentTarget.style.color="#000";e.currentTarget.style.borderColor=A}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T1;e.currentTarget.style.borderColor=BRD}} style={{padding:"5px 12px",background:"transparent",border:`2px solid ${BRD}`,borderRadius:20,color:T1,fontSize:11,fontWeight:700,fontFamily:ZZZ,fontStyle:"italic",cursor:saving?"wait":"pointer",transition:"all .15s",opacity:saving?0.5:1}}>{sDisp(tr.to?.name||tr.name)}</button>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {[{l:"Priority",v:f.priority?.name||"—"},{l:"Assignee",v:f.assignee?.displayName||"—"},{l:"Reporter",v:f.reporter?.displayName||"—"},{l:"Fix Versions",v:f.fixVersions?.length?f.fixVersions.map(v=>v.name).join(", "):"—"},{l:"Due Date",v:f.duedate?new Date(f.duedate).toLocaleDateString("ru-RU"):"—",c:f.duedate&&new Date(f.duedate)<new Date()?DNG:null}].map((fl,i)=>(<div key={i} style={{background:"#1a1a22",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:T2,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:4}}>{fl.l}</div><div style={{fontSize:13,color:fl.c||T1,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={fl.v}>{fl.v}</div></div>))}
          </div>
          {f.parent && <div style={{marginBottom:16,fontSize:12,color:T2}}>Parent: <a href={`${JIRA_BASE}/browse/${f.parent.key}`} target="_blank" rel="noopener noreferrer" style={{color:"#60A5FA",textDecoration:"none"}}>{f.parent.key} — {f.parent.fields?.summary}</a></div>}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{fontSize:10,color:T2,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Description</div><div style={{flex:1}}/>
            {!editDesc ? <button onClick={()=>{setDescDraft(f.description||"");setEditDesc(true)}} onMouseEnter={e=>{e.currentTarget.style.borderColor=A;e.currentTarget.style.color=A}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BRD;e.currentTarget.style.color=T2}} style={{padding:"3px 10px",background:"transparent",border:`1px solid ${BRD}`,borderRadius:6,color:T2,fontSize:10,cursor:"pointer",transition:"all .15s",fontWeight:600}}>Edit</button>
              : <div style={{display:"flex",gap:4}}><button onClick={saveDesc} disabled={saving} style={{padding:"3px 10px",background:A,border:"none",borderRadius:6,color:"#000",fontSize:10,cursor:"pointer",fontWeight:800}}>{saving?"Saving...":"Save"}</button><button onClick={()=>setEditDesc(false)} style={{padding:"3px 10px",background:"transparent",border:`1px solid ${BRD}`,borderRadius:6,color:T2,fontSize:10,cursor:"pointer"}}>Cancel</button></div>}
          </div>
          {editDesc ? <textarea value={descDraft} onChange={e=>setDescDraft(e.target.value)} style={{width:"100%",minHeight:120,background:"#1a1a22",border:`1.5px solid ${A}`,borderRadius:12,color:T1,fontSize:13,padding:"12px 14px",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6}}/> : <div style={{background:"#1a1a22",borderRadius:12,padding:"14px 16px",fontSize:13,color:T1,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",minHeight:60,cursor:"pointer"}} onClick={()=>{setDescDraft(f.description||"");setEditDesc(true)}}><ParseDesc text={f.description}/></div>}
        </div>
        <div style={{width:"30%",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"14px 14px 6px",display:"flex",alignItems:"center",gap:5}}><div style={{width:3,height:12,background:A,borderRadius:1}}/><div style={{fontSize:10,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Comments</div><div style={{flex:1}}/><div style={{fontSize:9,color:T2}}>{comments.length}</div></div>
          <div style={{flex:1,overflowY:"auto",padding:"0 14px 6px"}}>
            {comments.length===0 && <div style={{padding:16,textAlign:"center",color:T2,fontSize:11,fontStyle:"italic"}}>No comments</div>}
            {comments.map((c,i)=>(<div key={c.id||i} style={{marginBottom:6,background:"#1a1a22",borderRadius:8,padding:"8px 10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:A}}>{c.author?.displayName||"?"}</span><span style={{fontSize:9,color:T2}}>{new Date(c.created).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span></div><div style={{fontSize:11,color:T1,lineHeight:1.4,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{c.body}</div></div>))}
          </div>
          <div style={{padding:"6px 14px 14px",borderTop:`1px solid ${BRD}`}}>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment..." rows={2} style={{width:"100%",background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:8,color:T1,fontSize:11,padding:"8px 10px",outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=BRD}/>
            <button onClick={addComment} disabled={posting||!comment.trim()} style={{marginTop:4,padding:"6px 16px",background:posting||!comment.trim()?"#333":A,color:posting||!comment.trim()?T2:"#000",border:"none",borderRadius:8,fontSize:11,fontWeight:800,fontFamily:ZZZ,fontStyle:"italic",cursor:posting||!comment.trim()?"default":"pointer"}}>{posting?"...":"Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleSheetsView(){
  const viewRef=useRef(null);
  const [canGoBack,setCanGoBack]=useState(false);
  useEffect(()=>{
    const view=viewRef.current;if(!view)return;
    const sync=()=>{try{setCanGoBack(view.canGoBack())}catch{/* guest is still attaching */}};
    view.addEventListener("did-navigate",sync);view.addEventListener("did-navigate-in-page",sync);view.addEventListener("dom-ready",sync);
    return()=>{view.removeEventListener("did-navigate",sync);view.removeEventListener("did-navigate-in-page",sync);view.removeEventListener("dom-ready",sync)};
  },[]);
  const back=()=>{const view=viewRef.current;if(view&&view.canGoBack())view.goBack()};
  const returnToSheet=()=>viewRef.current?.loadURL(SHEETS_URL);
  return <div className="google-sheet-view">
    <div className="google-sheet-toolbar">
      <button onClick={back} disabled={!canGoBack}><FiArrowLeft/>Назад</button>
      <button onClick={returnToSheet}>Вернуться к таблице</button>
      <span>Вход выполняется в защищённой локальной сессии приложения</span>
    </div>
    <webview ref={viewRef} src={SHEETS_URL} partition="persist:pg3d-workspace" allowpopups="true"/>
  </div>;
}

function TasksTab({openIn,activeSection=0}){
  const [section,setSection]=useState(activeSection);const [tasks,setTasks]=useState([]);const [loading,setLoading]=useState(true);const [err,setErr]=useState(null);const [sortBy,setSortBy]=useState(null);const [showSort,setShowSort]=useState(false);const [selTask,setSelTask]=useState(null);
  useEffect(()=>setSection(activeSection),[activeSection]);
  const auth=btoa(`${JIRA_EMAIL}:${JIRA_TOKEN}`);
  const load=()=>{setLoading(true);fetch(`/jira-api/rest/api/2/search/jql?jql=filter=${JIRA_FILTER}&maxResults=50&fields=summary,status,priority,parent,duedate`,{headers:{"Authorization":`Basic ${auth}`,"Accept":"application/json"}}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(d=>{setTasks(d.issues||[]);setLoading(false)}).catch(e=>{setErr(e.message);setLoading(false)})};
  useEffect(()=>{load()},[]);
  const sorted=useMemo(()=>{if(!sortBy)return tasks;const c=[...tasks];if(sortBy==="deadline")c.sort((a,b)=>(a.fields?.duedate||"9999").localeCompare(b.fields?.duedate||"9999"));if(sortBy==="status")c.sort((a,b)=>(S_ORDER[a.fields?.status?.name]??5)-(S_ORDER[b.fields?.status?.name]??5));return c},[tasks,sortBy]);
  if(section===1) return (<div style={{position:"relative",height:"100%"}}><Sidebar section={section} setSection={setSection} total={3}/><div style={{position:"absolute",left:54,top:0,right:0,bottom:0,borderRadius:16,overflow:"hidden",background:"#EFF0EF"}}><div style={{display:"flex",alignItems:"center",padding:"8px 14px",gap:8}}><div style={{width:3,height:16,background:A,borderRadius:1}}/><div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#000",letterSpacing:1,textTransform:"uppercase"}}>Google Sheets</div></div><div style={{margin:"0 8px 8px",borderRadius:12,overflow:"hidden",height:"calc(100% - 44px)"}}><GoogleSheetsView/></div></div></div>);
  if(section===2) return (<div style={{position:"relative",height:"100%"}}><Sidebar section={section} setSection={setSection} total={3}/><div style={{position:"absolute",left:54,top:0,right:0,bottom:0}}><TimeTracker/></div></div>);
  return (
    <div className="tasks-page" style={{position:"relative",height:"100%",display:"flex"}}>
      <Sidebar section={section} setSection={setSection} total={3}/>
      {selTask && <TaskDetail taskKey={selTask} onClose={()=>{setSelTask(null);load()}}/>}
      <div className="tasks-summary-panel" style={{width:"24%",marginLeft:54,position:"relative",overflow:"hidden",borderRadius:"16px 0 0 16px",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,background:"#EFF0EF"}}/><div style={{position:"absolute",left:0,bottom:0,right:0,top:"25%",background:A,clipPath:"polygon(0 18%,100% 0,100% 100%,0 100%)"}}/><div style={{position:"absolute",left:0,bottom:0,right:0,top:"38%",background:"repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 6px)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,padding:"14px 16px",height:"100%",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:10,color:T2,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>// Dashboard</div>
          <div style={{fontSize:11,color:"#000",fontWeight:600,marginBottom:"auto"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",day:"2-digit",month:"long"})}</div>
          <div style={{fontSize:22,fontWeight:900,color:"#000",fontFamily:ZZZ,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Tasks</div>
          <div style={{fontSize:80,fontWeight:900,lineHeight:0.85,marginBottom:10}}><span style={{background:"repeating-linear-gradient(135deg,#000 0px,#000 2px,transparent 2px,transparent 4.5px)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-3}}>01</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{n:tasks.length||"...",l:"Total"},{n:tasks.filter(t=>TODO_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"To Do"},{n:tasks.filter(t=>ACTIVE_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"Active"},{n:tasks.filter(t=>DONE_S.includes((t.fields?.status?.name||"").toLowerCase())).length,l:"Done",c:"#22C55E"}].map((s,i)=>(<div key={i} style={{background:"rgba(0,0,0,0.08)",borderRadius:10,padding:"12px 12px"}}><div style={{fontSize:28,fontWeight:900,color:s.c||"#000",lineHeight:1}}>{s.n}</div><div style={{fontSize:11,color:"rgba(0,0,0,0.5)",textTransform:"uppercase",letterSpacing:0.5,marginTop:4}}>{s.l}</div></div>))}
          </div>
        </div>
      </div>
      <div className="tasks-list-panel" style={{flex:1,background:BG,borderLeft:"1px solid #EFF0EF",borderRadius:"0 16px 16px 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px 8px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:3,height:14,background:A,borderRadius:1}}/><div style={{fontSize:12,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>My tasks</div><div style={{flex:1}}/><a href={`${JIRA_BASE}/issues/?filter=${JIRA_FILTER}`} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:"#555",textDecoration:"none",marginRight:8}}>JIRA #{JIRA_FILTER} ↗</a>
          <div style={{position:"relative"}}>
            <div onClick={()=>setShowSort(!showSort)} style={{width:28,height:28,background:A,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg></div>
            {showSort && (<div style={{position:"absolute",top:34,right:0,background:"#1a1a22",border:`1.5px solid ${BRD}`,borderRadius:10,padding:4,zIndex:20,minWidth:130,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}><div onClick={()=>{setSortBy("deadline");setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:sortBy==="deadline"?A:T1,fontWeight:sortBy==="deadline"?700:500,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>By deadline</div><div onClick={()=>{setSortBy("status");setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:sortBy==="status"?A:T1,fontWeight:sortBy==="status"?700:500,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>By status</div>{sortBy && <div onClick={()=>{setSortBy(null);setShowSort(false)}} style={{padding:"7px 12px",borderRadius:7,fontSize:11,color:T2,cursor:"pointer",borderTop:`1px solid ${BRD}`,marginTop:2}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Reset</div>}</div>)}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 16px 10px"}}>
          {loading && <div style={{padding:30,textAlign:"center",color:T2,fontSize:12}}>Loading...</div>}
          {err && <div style={{padding:20,textAlign:"center",color:DNG,fontSize:11}}>Error: {err}</div>}
          {!loading && !err && sorted.map(t=>{const f=t.fields,sn=f.status?.name||"",clr=sClr(sn),snl=sn.toLowerCase();const bgClr=ACTIVE_S.includes(snl)?"rgba(216,250,0,0.04)":DONE_S.includes(snl)?"rgba(34,197,94,0.04)":"rgba(255,255,255,0.02)";
            return (<div key={t.key} onClick={()=>setSelTask(t.key)} style={{background:bgClr,borderRadius:10,padding:"12px 16px",borderLeft:`3px solid ${clr}`,marginBottom:6,cursor:"pointer",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(216,250,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.background=bgClr}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,color:"#60A5FA",fontWeight:600,flexShrink:0}}>{t.key}</span>
                <div style={{flex:1,fontSize:14,color:T1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.summary}</div>
                {f.duedate && <div style={{fontSize:13,color:new Date(f.duedate)<new Date()?DNG:T2,fontWeight:600,whiteSpace:"nowrap",width:42,textAlign:"right",flexShrink:0}}>{new Date(f.duedate).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"})}</div>}
                <div style={{fontSize:12,color:clr,fontWeight:700,letterSpacing:0.5,whiteSpace:"nowrap",width:120,textAlign:"right",flexShrink:0}}>{sDisp(sn)}</div>
                {f.parent ? <a href={`${JIRA_BASE}/browse/${f.parent.key}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} title={f.parent.fields?.summary||f.parent.key} style={{fontSize:13,color:"#555",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,width:160,overflow:"hidden",textOverflow:"ellipsis",display:"inline-block"}}>{f.parent.fields?.summary||f.parent.key}</a> : <div style={{width:160,flexShrink:0}}/>}
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

function InternalBrowser({url,title,onClose,onMinimize}){
  const [failed,setFailed]=useState(false);
  return (
    <div style={{position:"absolute",inset:0,zIndex:50,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",background:BG}}>
      <ZzzHeader onBack={onClose} onMinimize={onMinimize} title={title} rightLabel="Open in new tab" rightUrl={url}/>
      <div style={{flex:1,background:"#fff",position:"relative"}}>
        {failed ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",background:BG,gap:12}}><div style={{fontSize:14,color:T2}}>Can't embed this site</div><a href={url} target="_blank" rel="noopener noreferrer" style={{padding:"10px 20px",background:A,color:"#000",borderRadius:10,textDecoration:"none",fontWeight:800,fontSize:13}}>Open in new tab ↗</a></div>
          : <iframe src={url} style={{width:"100%",height:"100%",border:"none"}} title={title} onError={()=>setFailed(true)}/>}
      </div>
    </div>
  );
}

function LinkGrid({items,openIn}){
  const isC=items===CONFIGS;
  return (
    <div style={{height:"100%",background:BG,borderRadius:16,border:`1px solid ${BRD}`,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{`.lbtn .fill{position:absolute;inset:0;background:${A};transform:scaleX(0);transform-origin:left;transition:transform .3s ease;z-index:0}.lbtn:hover .fill{transform:scaleX(1)}.lbtn:hover{border-color:${A}!important}.lbtn:hover .lt{color:#000!important}`}</style>
      <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(135deg,transparent,transparent 6px,rgba(255,255,255,0.01) 6px,rgba(255,255,255,0.01) 12px)",pointerEvents:"none",borderRadius:16}}/>
      <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",padding:"14px 20px 8px",gap:8}}><div style={{width:3,height:16,background:A,borderRadius:1}}/><div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>{isC?"Configs":"Files"}</div><div style={{flex:1}}/><div style={{fontSize:9,color:"#555"}}>{items.length} shortcuts</div></div>
      <div style={{position:"relative",zIndex:1,margin:"0 20px 12px",height:1,background:BRD}}/>
      <div style={{position:"relative",zIndex:1,flex:1,overflowY:"auto",padding:"0 18px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",columnGap:16,rowGap:8,alignContent:"start"}}>
        {items.map(c=>(<a key={c.name} href={c.url} onClick={e=>{e.preventDefault();if(canEmbed(c.url))openIn(proxyUrl(c.url),c.name);else window.open(c.url,"_blank")}} className="lbtn" style={{display:"flex",alignItems:"center",height:52,background:"#000",border:`2.5px solid ${BRD}`,borderRadius:28,overflow:"hidden",cursor:"pointer",transition:"border-color .2s",textDecoration:"none",position:"relative"}}>
          <div className="fill"/><div style={{width:68,height:"100%",background:A,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,clipPath:"polygon(0 0,100% 0,78% 100%,0 100%)",position:"relative",zIndex:1}}>{c.icon.startsWith("/")?<img src={c.icon} alt="" style={{width:34,height:34,objectFit:"contain",filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.3))"}} onError={e=>{e.target.style.display="none";e.target.parentElement.textContent=c.name[0]}}/>:<span style={{fontSize:22}}>{c.icon}</span>}</div>
          <span className="lt" style={{flex:1,padding:"0 16px",fontSize:15,fontWeight:900,fontFamily:ZZZ,fontStyle:"italic",color:T1,letterSpacing:0.5,position:"relative",zIndex:1,transition:"color .25s"}}>{c.name}</span>
        </a>))}
      </div>
    </div>
  );
}

function BoardsTab({openIn}){
  return (
    <div style={{height:"100%",background:BG,borderRadius:16,border:`1px solid ${BRD}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",padding:"14px 20px 8px",gap:8}}><div style={{width:3,height:16,background:A,borderRadius:1}}/><div style={{fontSize:13,fontWeight:800,fontFamily:ZZZ,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>Boards</div><div style={{flex:1}}/><div style={{fontSize:9,color:"#555"}}>{MIRO_BOARDS.length} Miro boards</div></div>
      <div style={{margin:"0 20px 10px",height:1,background:BRD}}/>
      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"0 18px 14px",alignContent:"start"}}>
        {MIRO_BOARDS.map((b,i)=>(<div key={i} onClick={()=>openIn(b.url,b.name)} onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor=BRD} style={{background:"#000",border:`2px solid ${BRD}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all .15s",display:"flex",flexDirection:"column"}}>
          <div style={{flex:1,minHeight:140,background:"#1a1a22",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(255,255,255,0.03) 19px,rgba(255,255,255,0.03) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(255,255,255,0.03) 19px,rgba(255,255,255,0.03) 20px)"}}/><div style={{position:"relative",display:"flex",gap:4,flexWrap:"wrap",padding:10,alignContent:"flex-start"}}>{[A,"#ff6b6b","#4ecdc4","#a29bfe","#fdcb6e"].slice(0,3+i).map((c,j)=>(<div key={j} style={{width:24+j*4,height:18,background:c,borderRadius:2,opacity:0.7-j*0.08}}/>))}</div></div>
          <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,color:T1,fontWeight:900,fontFamily:ZZZ,fontStyle:"italic"}}>{b.name}</span><span style={{fontSize:10,color:"#555"}}>· {b.desc}</span></div>
        </div>))}
      </div>
    </div>
  );
}

function OfferConstructor(){
  const [offers,setOffers]=useState([
    {id:1,label:"Offer 1",price:9.99,items:[]},
    {id:2,label:"Offer 2",price:9.99,items:[]},
    {id:3,label:"Offer 3",price:9.99,items:[]}
  ]);

  const upd=(idx,o)=>setOffers(p=>p.map((x,i)=>i===idx?o:x));
  const rm=id=>setOffers(p=>p.filter(x=>x.id!==id));
  const add=()=>setOffers(p=>[...p,{id:_offerIdCounter++,label:`Offer ${p.length+1}`,price:9.99,items:[]}]);
  const dup=o=>setOffers(p=>[...p,{...o,id:_offerIdCounter++,label:o.label+" (copy)",items:o.items.map(i=>({...i}))}]);
  const filled=offers.filter(o=>o.items.length>0);

  return (<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:9,color:T2}}>{CATALOG.length} items · {offers.length} offers</div>
      <button onClick={add} style={{padding:"6px 14px",background:A,color:"#000",border:"none",borderRadius:10,cursor:"pointer",fontSize:11,fontWeight:800}}>+ New Offer</button>
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-start"}}>
      {offers.map((o,idx)=><OCard key={o.id} offer={o} onUpdate={u=>upd(idx,u)} onRemove={rm} onDuplicate={dup}/>)}
    </div>
    {filled.length>1 && (
      <div style={{marginTop:12,padding:14,background:STRIPE,borderRadius:14,border:`1px solid ${BRD}`}}>
        <div style={{fontSize:11,fontWeight:700,color:T1,marginBottom:10}}>Compare</div>
        <div style={{display:"flex",gap:16,alignItems:"end"}}>
          {filled.map(o=>{
            const tv=o.items.reduce((s,it)=>s+iv(it.catItem,it.qty),0);
            const d=tv>0?((1-o.price/tv)*100):0;
            return (
              <div key={o.id} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:800,color:d>50?DNG:A}}>{d.toFixed(1)}%</div>
                <div style={{height:Math.max(d*1.4,8),background:d>50?DNG:A,borderRadius:"4px 4px 0 0",opacity:0.85,marginTop:3}}/>
                <div style={{fontSize:10,color:T1,marginTop:4,fontWeight:600}}>{o.label}</div>
                <div style={{fontSize:9,color:T2}}>${o.price}</div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>);
}

function OCard({offer,onUpdate,onRemove,onDuplicate}){
  const [pick,setPick]=useState(false);
  const [search,setSearch]=useState("");
  const [catF,setCatF]=useState("All");
  const tv=offer.items.reduce((s,it)=>s+iv(it.catItem,it.qty),0);
  const disc=tv>0?((1-offer.price/tv)*100):0;
  const over50=disc>50;
  const addItem=c=>{const ex=offer.items.find(i=>i.catItem.name===c.name);if(ex)onUpdate({...offer,items:offer.items.map(i=>i.catItem.name===c.name?{...i,qty:i.qty+(c.unit||1)}:i)});else onUpdate({...offer,items:[...offer.items,{catItem:c,qty:c.unit||1}]})};
  const updQ=(i,v)=>{const n=[...offer.items];n[i]={...n[i],qty:Math.max(0,v)};onUpdate({...offer,items:n.filter(x=>x.qty>0)})};
  const rmI=i=>onUpdate({...offer,items:offer.items.filter((_,j)=>j!==i)});
  const filt=CATALOG.filter(c=>(catF==="All"||c.cat===catF)&&(!search||c.name.toLowerCase().includes(search.toLowerCase())));
  const ib={background:"#1a1a20",border:`1px solid ${BRD}`,borderRadius:8,color:T1,padding:"4px 8px",fontSize:12,outline:"none"};

  return (
    <div style={{background:STRIPE,width:280,borderRadius:14,border:`1px solid ${BRD}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${BRD}`,display:"flex",alignItems:"center"}}>
        <input value={offer.label} onChange={e=>onUpdate({...offer,label:e.target.value})} style={{...ib,flex:1,fontSize:14,fontWeight:800,background:"transparent",border:"none",padding:"2px 0"}}/>
        <div onClick={()=>onDuplicate(offer)} style={{width:24,height:24,background:"rgba(255,255,255,0.06)",border:`1px solid ${BRD}`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginRight:4,fontSize:10}}>📋</div>
        <div onClick={()=>onRemove(offer.id)} style={{width:24,height:24,background:A,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#000",fontWeight:900,fontSize:11}}>X</div>
      </div>
      <div style={{padding:"8px 12px",background:SRF,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:T2,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Price</span>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:18,fontWeight:900,color:A}}>$</span>
          <input type="number" value={offer.price} step={0.01} min={0} onChange={e=>onUpdate({...offer,price:parseFloat(e.target.value)||0})} style={{...ib,width:70,fontSize:18,fontWeight:900,color:A,textAlign:"right"}}/>
        </div>
      </div>
      <div style={{padding:"4px 12px",overflowY:"auto",maxHeight:180}}>
        {offer.items.length===0 && <div style={{color:T2,fontSize:11,textAlign:"center",padding:16,opacity:0.6}}>Empty — add items ↓</div>}
        {offer.items.map((it,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<offer.items.length-1?`1px solid ${BRD}22`:"none"}}>
            <span onClick={()=>rmI(i)} style={{cursor:"pointer",color:"#555",fontSize:10}}>✕</span>
            <div style={{width:3,height:14,background:A,borderRadius:2}}/>
            <span style={{flex:1,fontSize:11,color:T1,fontWeight:500}}>{it.catItem.name}</span>
            <input type="number" value={it.qty} min={1} step={it.catItem.unit||1} onChange={e=>updQ(i,parseInt(e.target.value)||0)} style={{...ib,width:56,fontSize:11,textAlign:"center",padding:"2px 4px"}}/>
            <span style={{fontSize:10,color:T2,fontFamily:"monospace",width:48,textAlign:"right"}}>${iv(it.catItem,it.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"4px 12px 8px"}}>
        <button onClick={()=>setPick(!pick)} style={{width:"100%",padding:6,background:pick?SRF:"transparent",border:`1px dashed ${pick?A:BRD}`,borderRadius:8,cursor:"pointer",fontSize:11,color:pick?A:T2,fontWeight:600}}>{pick?"Hide catalog ▲":"+ Add item"}</button>
      </div>
      {pick && (
        <div style={{padding:"6px 12px 10px",background:"#1a1a20",borderTop:`1px solid ${BRD}`,maxHeight:180,overflowY:"auto"}}>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...ib,width:"100%",fontSize:11,marginBottom:5,boxSizing:"border-box"}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
            {["All",...CATS].map(c=>(
              <button key={c} onClick={()=>setCatF(c)} style={{padding:"2px 8px",borderRadius:20,fontSize:9,cursor:"pointer",fontWeight:600,background:catF===c?A:"transparent",color:catF===c?"#000":T2,border:`1px solid ${catF===c?A:BRD}`}}>{c}</button>
            ))}
          </div>
          {filt.map((c,j)=>(
            <div key={j} onClick={()=>addItem(c)} style={{display:"flex",justifyContent:"space-between",padding:"5px 6px",cursor:"pointer",borderRadius:6,fontSize:11,color:T1}} onMouseEnter={e=>e.currentTarget.style.background=`${A}15`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{c.name}</span>
              <span style={{color:T2}}>{c.unit?`$1${c.uLabel}`:`$${c.price}`}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{padding:"10px 12px",background:SRF,borderTop:`1px solid ${BRD}`,borderRadius:"0 0 14px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:T2}}>Total value</span>
          <span style={{color:T1,fontWeight:600}}>${tv.toFixed(2)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
          <span style={{color:T2,fontSize:11}}>Discount</span>
          <span style={{fontSize:18,fontWeight:900,color:over50?DNG:A}}>{disc.toFixed(1)}%{over50?" ⚠️":""}</span>
        </div>
        <div style={{marginTop:6,height:4,background:BRD,borderRadius:2}}>
          <div style={{width:`${Math.min(Math.max(disc,0),100)}%`,height:"100%",background:over50?`linear-gradient(90deg,${A},${DNG})`:A,borderRadius:2,transition:"width .3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginTop:2}}>
          <span style={{color:"#555"}}>0%</span>
          <span style={{color:DNG,fontWeight:600}}>50%</span>
          <span style={{color:"#555"}}>100%</span>
        </div>
      </div>
    </div>
  );
}

function ToolsTab({initialTool="offers",hideSelector=false}){
  const [activeTool,setActiveTool]=useState(initialTool);
  useEffect(()=>setActiveTool(initialTool),[initialTool]);
  return (
    <div className="tools-page" style={{height:"100%",background:BG,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div className="tools-feature-header">
        <div><span>PROBABILITY LAB</span><h1>{activeTool==="lootbox"?"Lootbox Simulator":activeTool==="lottery"?"Lottery Simulator":"Offer Constructor"}</h1></div>
        <div style={{flex:1}}/>
        {!hideSelector&&<div style={{display:"flex",background:BG,borderRadius:20,padding:3,border:`1px solid ${BRD}`}}>
          {[["offers","Offer Constructor"],["lootbox","Lootbox Sim"],["lottery","Lottery Sim"]].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTool(k)} style={{padding:"6px 16px",borderRadius:18,fontSize:11,fontWeight:700,fontFamily:ZZZ,fontStyle:"italic",cursor:"pointer",border:"none",background:activeTool===k?A:"transparent",color:activeTool===k?"#000":T2,transition:"all .2s"}}>{l}</button>
          ))}
        </div>}
      </div>
      <div style={{flex:1,position:"relative"}}>
        <div style={{position:"absolute",inset:0,overflowY:"auto",padding:"18px 24px 24px"}}>
          <div style={{display:activeTool==="offers"?"block":"none"}}><OfferConstructor/></div>
          <div style={{display:activeTool==="lootbox"?"block":"none"}}><LootboxSimulator/></div>
          <div style={{display:activeTool==="lottery"?"block":"none"}}><LotterySimulator/></div>
        </div>
      </div>
    </div>
  );
}

function LegacyDashboard(){
  const [tab,setTab]=useState(0);
  /* ── Browser tabs state ── */
  const [browserTabs,setBrowserTabs]=useState([]);
  const [activeTabId,setActiveTabId]=useState(null);
  const [showBrowser,setShowBrowser]=useState(false);
  const nextId=useRef(1);

  const openIn=(url,title)=>{
    const existing=browserTabs.find(t=>t.title===title);
    if(existing){setActiveTabId(existing.id);setShowBrowser(true);return}
    const id=nextId.current++;
    setBrowserTabs(prev=>[...prev,{id,title,url}]);
    setActiveTabId(id);
    setShowBrowser(true);
  };

  const closeBrowser=()=>{
    if(activeTabId!==null) setBrowserTabs(prev=>prev.filter(t=>t.id!==activeTabId));
    setActiveTabId(null);
    setShowBrowser(false);
  };

  const minimizeBrowser=()=>{setShowBrowser(false)};

  const selectTab=(id)=>{setActiveTabId(id);setShowBrowser(true)};

  const closeTab=(id)=>{
    setBrowserTabs(prev=>prev.filter(t=>t.id!==id));
    if(activeTabId===id){setActiveTabId(null);setShowBrowser(false)}
  };

  const activeTab=browserTabs.find(t=>t.id===activeTabId);

  return (
    <div style={{height:"100vh",background:BG,fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>
      <style>{`
        @font-face{font-family:'ZZZBold';src:url('/fonts/integral-cf-bold.ttf') format('truetype');font-weight:700;font-style:normal}
        html,body,#root{margin:0;padding:0;height:100%;background:${BG}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${BRD};border-radius:3px}
        .cal-grid::-webkit-scrollbar{width:6px}
        .cal-grid *::-webkit-scrollbar{width:0px;display:none}
      `}</style>
      <div style={{position:"relative",width:"100%",height:"100%",background:BG,overflow:"hidden"}}>
        <div style={{position:"absolute",top:18,left:20,zIndex:10}}>
          <div style={{color:"#fff",fontWeight:900,fontSize:18,fontFamily:ZZZ,fontStyle:"italic",letterSpacing:1,lineHeight:1}}>
            {getGreeting()}, <span style={{color:A}}>Dima</span>
          </div>
        </div>
        <NavBar tab={tab} setTab={t=>{setTab(t);setShowBrowser(false)}}/>
        <div style={{position:"absolute",left:12,top:56,right:12,bottom:browserTabs.length>0?50:12,transition:"bottom 0.3s"}}>
          {browserTabs.map(t=>(
            <div key={t.id} style={{position:"absolute",inset:0,zIndex:showBrowser&&activeTabId===t.id?50:(-1),opacity:showBrowser&&activeTabId===t.id?1:0,pointerEvents:showBrowser&&activeTabId===t.id?"auto":"none",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",background:BG}}>
              <ZzzHeader onBack={closeBrowser} onMinimize={minimizeBrowser} title={t.title} rightLabel="Open in new tab" rightUrl={t.url}/>
              <div style={{flex:1,background:"#fff",position:"relative"}}>
                <iframe src={t.url} style={{width:"100%",height:"100%",border:"none"}} title={t.title}/>
              </div>
            </div>
          ))}
          {tab===0 && <TasksTab openIn={openIn}/>}
          {tab===1 && <div style={{height:"100%",position:"relative"}}><LinkGrid items={CONFIGS} openIn={openIn}/></div>}
          {tab===2 && <BoardsTab openIn={openIn}/>}
          {tab===3 && <div style={{height:"100%",position:"relative"}}><LinkGrid items={FILES} openIn={openIn}/></div>}
          <div style={{height:"100%",display:tab===4?"block":"none"}}><ToolsTab/></div>
        </div>
        <BrowserTabs tabs={browserTabs} activeId={activeTabId} showBrowser={showBrowser} onSelect={selectTab} onClose={closeTab}/>
      </div>
    </div>
  );
}

const LINK_ICON_BY_NAME={
  "Trader Van":"/icons/hugeicons--van.png","LootBoxes":"/icons/memory--chest-fill.png","Offers":"/icons/circum--shopping-tag.png","Localization":"/icons/cil--language.png","Lottery":"/icons/pixelarticons--key-solid.png","Balance":"/icons/game-icons--ray-gun.png","Event Center":"/icons/ri--calendar-line.png","Card Roulette":"/icons/material-symbols--cards-star-sharp.png","Main Store":"/icons/uil--shop.png","Attributes":"/icons/carbon--attribute-definition.png","Pers. Events":"/icons/carbon--task-progress.png","Temp. Events":"/icons/material-symbols--event-list-outline-sharp.png","AB Test":"/icons/mdi--ab-testing.png","Exp Open":"/icons/streamline-ultimate--arrow-double-up-bold.png","Map List":"/icons/griddy-icons--map.png","Clan War":"/icons/game-icons--battle-tank.png","ADS Roulette":"/icons/material-symbols--shop-outline.png","Clan Chests":"/icons/ant-design--gold-filled.png","GameModeHub":"/icons/ri--layout-6-line.png","Tournament":"/icons/solar--cup-star-bold.png","Bots":"/icons/solar--bot-bold.png","Rotation":"/icons/material-symbols--screen-rotation-up-sharp.png",
  "График ивентов — Google Sheets":"/icons/grommet-icons--schedule.png","Tableau":"/icons/cib--tableau.png","PG3D.Admin":"/icons/eos-icons--admin.png","Appsheet":"/icons/arcticons--appsheet.png","GitLab":"/icons/mdi--gitlab.png","Claude":"/icons/mingcute--claude-line.png","Content Sheet":"/icons/streamline-sharp--hand-held-tablet-drawing.png","Calculator":"/icons/hugeicons--calculator.png","Configs Archive":"/icons/mdi--archive-outline.png","Aghanim":"/icons/mdi--letter-a-box-outline.png","Content Plan":"/icons/selfhst--google-sheets-light.png","Notion":"/icons/mage--notion.png","Translator":"/icons/garden--translation-exists-fill-16.png","Figma":"/icons/solar--figma-bold.png","Confluence":"/icons/devicon-plain--confluence.png","Weapon Analytics":"/icons/grommet-icons--analytics.png","Distribution&Trends":"/icons/healthicons--spreadsheets-outline.png"
};
const linkIcon=item=>LINK_ICON_BY_NAME[item.name]||item.icon;

const APP_SECTIONS=[
  {id:"dashboard",label:"Дашборд",icon:"tasks",builtIn:true,items:[
    {id:"events",label:"График ивентов",tabIcon:"▦"},{id:"tasks",label:"Мои задачи",tabIcon:"◆"},{id:"notes",label:"Заметки",tabIcon:"▤"}
  ]},
  {id:"configs",label:"Конфиги",icon:"config",builtIn:true,items:CONFIGS.map((item,index)=>({id:`config-${index}`,label:item.name,url:item.url,icon:linkIcon(item)}))},
  {id:"files",label:"Файлы",icon:"home",builtIn:true,items:FILES.map((item,index)=>({id:item.url===SHEETS_URL?"event-sheet":`file-${index}`,label:item.name,url:item.url,icon:linkIcon(item)}))},
  {id:"tools",label:"Инструменты",icon:"tools",builtIn:true,items:[
    {id:"offers",label:"Offer Constructor"},{id:"lootbox",label:"Lootbox Simulator"},{id:"lottery",label:"Lottery Simulator"}
  ]},
];

const PAGE_TITLES={tasks:"Мои задачи",events:"График ивентов",notes:"Заметки",offers:"Offer Constructor",lootbox:"Lootbox Simulator",lottery:"Lottery Simulator"};
const PAGE_SECTIONS={tasks:"dashboard",events:"dashboard",notes:"dashboard",offers:"tools",lootbox:"tools",lottery:"tools"};

function normalizeNavigation(source){
  const saved=Array.isArray(source)?source:[];
  const byId=new Map(saved.filter(section=>section?.id!=="boards").map(section=>[section.id,section]));
  const applyLinkIcons=items=>items.map(item=>({...item,icon:item.iconName?item.icon:(LINK_ICON_BY_NAME[item.label]||item.icon)}));
  return APP_SECTIONS.map(defaultSection=>{
    const previous=byId.get(defaultSection.id);
    if(!previous)return JSON.parse(JSON.stringify(defaultSection));
    if(defaultSection.id==="dashboard")return{...previous,items:defaultSection.items};
    if(defaultSection.id==="files"){
      const items=Array.isArray(previous.items)?previous.items:[];
      const legacySheet=defaultSection.items[0];
      const merged=items.some(item=>item.url===SHEETS_URL)?items:[legacySheet,...items];
      return{...previous,items:applyLinkIcons(merged)};
    }
    return{...previous,items:applyLinkIcons(Array.isArray(previous.items)?previous.items:defaultSection.items)};
  });
}

function loadNavigation(){
  try{const saved=JSON.parse(localStorage.getItem("pg3d-navigation-v1"));if(Array.isArray(saved)&&saved.length)return normalizeNavigation(saved)}catch(e){/* defaults */}
  return normalizeNavigation(APP_SECTIONS);
}

function SectionIcon({value,color="#b7b7bd",size=17}){
  if(value?.startsWith("/")||value?.startsWith("http")||value?.startsWith("data:"))return <TintedIcon src={value} className="nav-icon-image"/>;
  return <Icon type={["home","tasks","config","boards","tools"].includes(value)?value:"home"} color={color} sz={size}/>;
}

function TintedIcon({src,className=""}){
  return <span className={`tinted-icon ${className}`} style={{"--icon-image":`url("${src}")`}} aria-hidden="true"/>;
}

function SettingsPanel({navigation,onChange,onClose}){
  const [sectionId,setSectionId]=useState(()=>navigation[0]?.id);
  const [itemId,setItemId]=useState(null);
  const [showSymbols,setShowSymbols]=useState(false);
  const sectionIconInput=useRef(null);
  const itemIconInput=useRef(null);
  const section=navigation.find(s=>s.id===sectionId)||navigation[0];
  const item=section?.items?.find(i=>i.id===itemId)||null;
  useEffect(()=>{if(section&&!navigation.some(s=>s.id===sectionId)){setSectionId(navigation[0]?.id);setItemId(null)}},[navigation,sectionId]);
  const updateSection=patch=>onChange(navigation.map(s=>s.id===section.id?{...s,...patch}:s));
  const updateItem=patch=>updateSection({items:section.items.map(i=>i.id===item.id?{...i,...patch}:i)});
  const addSection=()=>{const created={id:`custom-section-${Date.now()}`,label:"Новый раздел",icon:"home",builtIn:false,items:[]};onChange([...navigation,created]);setSectionId(created.id);setItemId(null)};
  const removeSection=()=>{if(section?.builtIn)return;const next=navigation.filter(s=>s.id!==section.id);onChange(next);setSectionId(next[0]?.id);setItemId(null)};
  const addItem=()=>{const created={id:`custom-item-${Date.now()}`,label:"Новый файл",url:"https://",icon:"",tabIcon:"📄"};updateSection({items:[...(section.items||[]),created]});setItemId(created.id)};
  const removeItem=()=>{updateSection({items:section.items.filter(i=>i.id!==item.id)});setItemId(null)};
  const pickIcon=(event,apply)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>apply({icon:String(reader.result),iconName:file.name});reader.readAsDataURL(file);event.target.value=""};
  const unicodeSymbols=["◇","◆","●","○","■","□","★","☆","✓","⚡","⚙","🔧","📄","📁","📊","📋","🗓","🧩","🎯","🛠","🚀","💡","🔗","🌐","🎮","🎲","💎","🏠","🔔","⏱"];
  return <div className="settings-page">
    <aside className="settings-nav">
      <div className="settings-title">Настройки</div>
      <button className="settings-add" onClick={addSection}><FiPlus/>Добавить раздел</button>
      <div className="settings-list">{navigation.map(s=><button key={s.id} className={s.id===section?.id?"active":""} onClick={()=>{setSectionId(s.id);setItemId(null)}}><SectionIcon value={s.icon} size={15}/><span>{s.label}</span><FiChevronRight/></button>)}</div>
    </aside>
    <section className="settings-editor">
      <header><div><span>Персонализация</span><h2>{item?item.label:section?.label}</h2></div><button className="settings-close" aria-label="Закрыть настройки" onClick={onClose}><FiX/></button></header>
      {!item&&section&&<>
        <div className="settings-card">
          <label>Название раздела<input value={section.label} onChange={e=>updateSection({label:e.target.value})}/></label>
          <label>Иконка<div className="icon-field"><span className="icon-preview"><SectionIcon value={section.icon}/></span><span className="icon-file-name">{section.iconName||"Текущая иконка"}</span><button type="button" className="icon-upload" onClick={()=>sectionIconInput.current?.click()}>Выбрать изображение</button><input ref={sectionIconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={e=>pickIcon(e,updateSection)}/></div></label>
          {!section.builtIn&&<button className="danger-button" onClick={removeSection}><FiTrash2/>Удалить раздел</button>}
        </div>
        <div className="settings-section-head"><div><h3>Файлы и страницы</h3><span>{section.items.length} элементов</span></div><button onClick={addItem}><FiPlus/>Добавить файл</button></div>
        <div className="settings-items">{section.items.map(i=><button key={i.id} onClick={()=>setItemId(i.id)}>{i.icon?<TintedIcon src={i.icon} className="settings-item-icon"/>:<span className="settings-item-dot"/>}<span><b>{i.label}</b><small>{i.url||"Встроенная страница"}</small></span><FiChevronRight/></button>)}</div>
      </>}
      {item&&<>
        <button className="settings-back" onClick={()=>setItemId(null)}><FiArrowLeft/>{section.label}</button>
        <div className="settings-card">
          <label>Название<input value={item.label} onChange={e=>updateItem({label:e.target.value})}/></label>
          <label>Ссылка<input value={item.url||""} disabled={!item.url&&section.builtIn} onChange={e=>updateItem({url:e.target.value})} placeholder="https://..."/></label>
          <label>Иконка<div className="icon-field">{item.icon?<TintedIcon src={item.icon} className="icon-preview image"/>:<span className="icon-preview empty">+</span>}<span className="icon-file-name">{item.iconName||(item.icon?"Текущая иконка":"Не выбрана")}</span><button type="button" className="icon-upload" onClick={()=>itemIconInput.current?.click()}>Выбрать изображение</button><input ref={itemIconInput} className="hidden-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={e=>pickIcon(e,updateItem)}/></div></label>
          <label>Мини-иконка вкладки<div className="unicode-field">{item.icon?<div className="tab-icon-linked"><TintedIcon src={item.icon} className="tab-image-icon"/>Используется иконка ссылки</div>:<button type="button" className="unicode-trigger" onClick={()=>setShowSymbols(value=>!value)}><span>{item.tabIcon||getTabIcon(item.label)}</span>Выбрать символ</button>}{showSymbols&&!item.icon&&<div className="unicode-picker">{unicodeSymbols.map(symbol=><button type="button" key={symbol} className={item.tabIcon===symbol?"active":""} onClick={()=>{updateItem({tabIcon:symbol});setShowSymbols(false)}}>{symbol}</button>)}</div>}</div></label>
          {item.url&&<button className="danger-button" onClick={removeItem}><FiTrash2/>Удалить файл</button>}
        </div>
      </>}
    </section>
  </div>;
}

function WindowControls(){
  const [maximized,setMaximized]=useState(false);
  useEffect(()=>{
    const api=window.desktopWindow;if(!api)return;
    api.isMaximized().then(setMaximized);
    return api.onMaximizedChange(setMaximized);
  },[]);
  const api=()=>window.desktopWindow;
  return <div className="window-controls">
    <button aria-label="Свернуть" onClick={()=>api()?.minimize()}><VscChromeMinimize/></button>
    <button aria-label={maximized?"Восстановить":"Развернуть"} onClick={()=>api()?.toggleMaximize()}>{maximized?<VscChromeRestore/>:<VscChromeMaximize/>}</button>
    <button className="window-close" aria-label="Закрыть" onClick={()=>api()?.close()}><VscChromeClose/></button>
  </div>;
}

function migrateWorkspace(saved){
  const source=saved?.tabs?.length?saved.tabs:[{id:"page-tasks",type:"page",page:"tasks",title:PAGE_TITLES.tasks}];
  const tabs=source.filter(tab=>tab.section!=="boards").map(tab=>tab.page==="tracker"?{...tab,id:"page-notes",page:"notes",title:"Заметки",tabIcon:"▤"}:tab);
  const safeTabs=tabs.length?tabs:[{id:"page-tasks",type:"page",page:"tasks",title:PAGE_TITLES.tasks}];
  return{tabs:safeTabs,activeId:safeTabs.some(tab=>tab.id===saved?.activeId)?saved.activeId:safeTabs[0].id};
}

function loadWorkspace(){
  try{
    const saved=JSON.parse(localStorage.getItem("pg3d-workspace-v2"));
    if(saved?.tabs?.length)return migrateWorkspace(saved);
  }catch(e){/* use defaults */}
  return migrateWorkspace(null);
}

function AppShell(){
  if(typeof window!=="undefined")window.__PG3D_DESKTOP_SHELL__=true;
  const initial=useMemo(loadWorkspace,[]);
  const [tabs,setTabs]=useState(initial.tabs);
  const [activeId,setActiveId]=useState(initial.activeId);
  const [navigation,setNavigation]=useState(loadNavigation);
  const [selectedSection,setSelectedSection]=useState("dashboard");
  const [showSettings,setShowSettings]=useState(false);
  const [draggingTab,setDraggingTab]=useState(null);
  const [storeReady,setStoreReady]=useState(!window.workspaceStore);
  const tabsScrollRef=useRef(null);
  const active=tabs.find(t=>t.id===activeId)||tabs[0];
  const activeSection=selectedSection;
  useEffect(()=>{if(activeId&&active)setSelectedSection(active.type==="page"?PAGE_SECTIONS[active.page]:(active.section||"files"))},[activeId]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!window.workspaceStore)return;
      const [savedNavigation,savedWorkspace]=await Promise.all([window.workspaceStore.read("navigation"),window.workspaceStore.read("workspace")]);
      if(cancelled)return;
      if(Array.isArray(savedNavigation)&&savedNavigation.length)setNavigation(normalizeNavigation(savedNavigation));
      else await window.workspaceStore.write("navigation",navigation);
      if(savedWorkspace?.tabs?.length){const migrated=migrateWorkspace(savedWorkspace);setTabs(migrated.tabs);setActiveId(migrated.activeId)}
      else await window.workspaceStore.write("workspace",{tabs,activeId});
      setStoreReady(true);
    })().catch(error=>{console.error("Failed to load workspace settings",error);setStoreReady(true)});
    return()=>{cancelled=true};
  },[]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-workspace-v2",JSON.stringify({tabs,activeId}))}catch{/* Electron file storage remains authoritative */}window.workspaceStore?.write("workspace",{tabs,activeId}).catch(console.error)},[tabs,activeId,storeReady]);
  useEffect(()=>{if(!storeReady)return;try{localStorage.setItem("pg3d-navigation-v1",JSON.stringify(navigation))}catch{/* selected images can exceed the browser quota */}window.workspaceStore?.write("navigation",navigation).catch(console.error)},[navigation,storeReady]);
  useEffect(()=>setTabs(prev=>prev.map(tab=>{for(const section of navigation){const item=section.items.find(i=>i.id===(tab.sourceItemId||tab.page));if(item)return{...tab,title:item.label,url:item.url||tab.url,section:section.id,icon:item.icon||null,tabIcon:item.tabIcon||tab.tabIcon}}return tab})),[navigation]);

  const openPage=(page,tabIcon)=>{
    const id=`page-${page}`;
    setTabs(prev=>prev.some(t=>t.id===id)?prev:[...prev,{id,type:"page",page,title:PAGE_TITLES[page],tabIcon}]);
    setActiveId(id);
  };
  const openIn=(url,title,section=selectedSection,sourceItemId=null,tabIcon=null,icon=null)=>{
    const existing=tabs.find(t=>t.type==="web"&&(sourceItemId?t.sourceItemId===sourceItemId:t.title===title));
    if(existing){setActiveId(existing.id);return}
    const id=`web-${Date.now()}`;
    setTabs(prev=>[...prev,{id,type:"web",url,title,section,sourceItemId,tabIcon,icon}]);setActiveId(id);
  };
  const selectSection=(section)=>{setShowSettings(false);setSelectedSection(section.id);setActiveId(null)};
  const selectTab=(tab)=>{setActiveId(tab.id);setSelectedSection(tab.type==="page"?PAGE_SECTIONS[tab.page]:(tab.section||"files"))};
  const openSidebarItem=(item)=>item.url?openIn(item.url,item.label,selectedSection,item.id,item.tabIcon,item.icon):openPage(item.id,item.tabIcon);
  const closeTab=(id)=>{
    setTabs(prev=>{
      const index=prev.findIndex(t=>t.id===id);const next=prev.filter(t=>t.id!==id);
      if(id===activeId)setActiveId(next[Math.min(index,next.length-1)]?.id||null);
      return next;
    });
  };
  const moveTabOver=(overId)=>{
    if(!draggingTab||draggingTab===overId)return;
    setTabs(prev=>{const from=prev.findIndex(t=>t.id===draggingTab),to=prev.findIndex(t=>t.id===overId);if(from<0||to<0)return prev;const next=[...prev];const [moved]=next.splice(from,1);next.splice(to,0,moved);return next});
  };
  const scrollTabs=direction=>tabsScrollRef.current?.scrollBy({left:direction*320,behavior:"smooth"});
  const renderTab=tab=>{
    if(tab.type==="web")return <webview className="workspace-frame" src={tab.url} partition="persist:pg3d-workspace" allowpopups="true"/>;
    if(tab.page==="tasks")return <div className="task-shell"><TasksTab openIn={openIn} activeSection={0}/></div>;
    if(tab.page==="events")return <EventCalendar/>;
    if(tab.page==="notes")return <NotesPage/>;
    return <ToolsTab initialTool={tab.page} hideSelector/>;
  };

  return <div className="desktop-app">
    <aside className="app-sidebar">
      <div className="app-brand"><img className="brand-mark" src="/icons/pg3d-512.png" alt="PG3D Dashboard"/><div><b>PG3D</b><span>Workspace</span></div></div>
      <nav className="section-nav">
        {navigation.map(section=><button key={section.id} className={activeSection===section.id&&!showSettings?"section-button active":"section-button"} onClick={()=>selectSection(section)}><SectionIcon value={section.icon} color={activeSection===section.id?A:"#b7b7bd"}/><span>{section.label}</span></button>)}
      </nav>
      <div className="sidebar-divider"/>
      <div className="section-caption">{navigation.find(s=>s.id===activeSection)?.label||"Содержимое"}</div>
      <div className="inner-nav">
        {(navigation.find(s=>s.id===activeSection)?.items||[]).map(item=><button key={item.id} className={(active?.page===item.id||active?.title===item.label)&&activeId&&!showSettings?"inner-button active":"inner-button"} onClick={()=>{setShowSettings(false);openSidebarItem(item)}}>{item.icon?<TintedIcon src={item.icon} className="inner-item-icon"/>:<span className="inner-dot"/>}{item.label}</button>)}
      </div>
      <div className="sidebar-footer"><span className="status-dot"/><span>Локальное приложение</span><button className={showSettings?"sidebar-settings active":"sidebar-settings"} aria-label="Настройки" onClick={()=>setShowSettings(true)}><FiSettings/></button></div>
    </aside>
    <main className="app-main">
      <header className="workspace-tabs" onDoubleClick={()=>window.desktopWindow?.toggleMaximize()}>
        <div ref={tabsScrollRef} className="tabs-scroll" onWheel={e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();tabsScrollRef.current.scrollLeft+=e.deltaY}}}>{tabs.map(tab=><button key={tab.id} draggable className={`${tab.id===activeId?"workspace-tab active":"workspace-tab"}${draggingTab===tab.id?" dragging":""}`} onDragStart={e=>{setDraggingTab(tab.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",tab.id)}} onDragOver={e=>{e.preventDefault();moveTabOver(tab.id)}} onDragEnd={()=>setDraggingTab(null)} onClick={()=>{setShowSettings(false);selectTab(tab)}}><MdDragIndicator className="tab-grip"/>{tab.icon?<TintedIcon src={tab.icon} className="tab-image-icon"/>:<span className="tab-symbol">{tab.tabIcon||(tab.type==="web"?getTabIcon(tab.title):"◇")}</span>}<span>{tab.title}</span><i onClick={e=>{e.stopPropagation();closeTab(tab.id)}}>×</i></button>)}</div>
        <div className="tabs-scroll-controls"><button aria-label="Прокрутить вкладки влево" onClick={()=>scrollTabs(-1)}><FiChevronLeft/></button><button aria-label="Прокрутить вкладки вправо" onClick={()=>scrollTabs(1)}><FiChevronRight/></button></div>
        <div className="window-drag"/>
        <WindowControls/>
      </header>
      <section className="workspace-content">
        <div className={showSettings?"workspace-stack hidden":"workspace-stack"}>
          {tabs.map(tab=><div key={tab.id} className={tab.id===activeId?"tab-surface active":"tab-surface"}>{renderTab(tab)}</div>)}
          {!activeId&&<div className="empty-workspace"><div>{["configs","boards","files"].includes(selectedSection)?"Выбери файл":"Выбери страницу"}</div></div>}
        </div>
        {showSettings&&<SettingsPanel navigation={navigation} onChange={setNavigation} onClose={()=>setShowSettings(false)}/>}
      </section>
    </main>
  </div>;
}

export default AppShell;
