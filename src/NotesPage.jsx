import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiBold, FiImage, FiItalic, FiList, FiPlus, FiTrash2, FiUnderline } from "react-icons/fi";

const emptyNote=()=>({id:`note-${Date.now()}`,title:"Новая заметка",content:"",updatedAt:new Date().toISOString()});

export default function NotesPage(){
  const [notes,setNotes]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [ready,setReady]=useState(false);
  const editorRef=useRef(null);
  const imageInputRef=useRef(null);
  const active=notes.find(note=>note.id===activeId);

  useEffect(()=>{let live=true;(async()=>{const saved=await window.workspaceStore?.read("notes");if(live&&Array.isArray(saved))setNotes(saved);if(live)setReady(true)})().catch(()=>setReady(true));return()=>{live=false}},[]);
  useEffect(()=>{if(ready)window.workspaceStore?.write("notes",notes).catch(console.error)},[notes,ready]);
  useEffect(()=>{if(active&&editorRef.current&&editorRef.current.innerHTML!==active.content)editorRef.current.innerHTML=active.content||""},[activeId]);

  const createNote=()=>{const note=emptyNote();setNotes(current=>[note,...current]);setActiveId(note.id)};
  const updateActive=patch=>setNotes(current=>current.map(note=>note.id===activeId?{...note,...patch,updatedAt:new Date().toISOString()}:note));
  const removeActive=()=>{if(!active||!window.confirm("Удалить эту заметку?"))return;setNotes(current=>current.filter(note=>note.id!==activeId));setActiveId(null)};
  const format=command=>{editorRef.current?.focus();document.execCommand(command,false,null);updateActive({content:editorRef.current?.innerHTML||""})};
  const insertImage=file=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{editorRef.current?.focus();document.execCommand("insertImage",false,String(reader.result));updateActive({content:editorRef.current?.innerHTML||""})};reader.readAsDataURL(file)};
  const onPaste=event=>{const image=[...event.clipboardData.items].find(item=>item.type.startsWith("image/"));if(image){event.preventDefault();insertImage(image.getAsFile())}};
  const preview=html=>{const wrapper=document.createElement("div");wrapper.innerHTML=html||"";return wrapper.textContent?.trim()||"Пустая заметка"};

  if(active)return <div className="note-editor-page">
    <header className="feature-header"><button className="ghost-action" onClick={()=>setActiveId(null)}><FiArrowLeft/>Все заметки</button><div className="feature-kicker">PERSONAL ARCHIVE / {new Date(active.updatedAt).toLocaleDateString("ru-RU")}</div><button className="icon-danger" aria-label="Удалить заметку" onClick={removeActive}><FiTrash2/></button></header>
    <div className="note-editor-shell">
      <input className="note-title-input" value={active.title} onChange={event=>updateActive({title:event.target.value})} placeholder="Заголовок заметки"/>
      <div className="note-toolbar">
        <button title="Жирный" onClick={()=>format("bold")}><FiBold/></button><button title="Курсив" onClick={()=>format("italic")}><FiItalic/></button><button title="Подчёркивание" onClick={()=>format("underline")}><FiUnderline/></button><button title="Список" onClick={()=>format("insertUnorderedList")}><FiList/></button>
        <span/><button title="Добавить изображение" onClick={()=>imageInputRef.current?.click()}><FiImage/></button><input ref={imageInputRef} type="file" accept="image/*" hidden onChange={event=>{insertImage(event.target.files?.[0]);event.target.value=""}}/>
        <small>Изображение можно вставить из буфера обмена</small>
      </div>
      <div ref={editorRef} className="note-rich-editor" contentEditable suppressContentEditableWarning data-placeholder="Начните писать..." onInput={event=>updateActive({content:event.currentTarget.innerHTML})} onPaste={onPaste}/>
    </div>
  </div>;

  return <div className="notes-page">
    <header className="feature-header"><div><div className="feature-kicker">LOCAL KNOWLEDGE SYSTEM</div><h1>Заметки</h1></div><button className="primary-action" onClick={createNote}><FiPlus/>Новая заметка</button></header>
    <div className="notes-grid">
      {notes.map((note,index)=><button className="note-card" key={note.id} onClick={()=>setActiveId(note.id)}><span className="note-index">{String(index+1).padStart(2,"0")}</span><div><h2>{note.title||"Без названия"}</h2><p>{preview(note.content)}</p></div><time>{new Date(note.updatedAt).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"})}</time></button>)}
      <button className="note-card create" onClick={createNote}><FiPlus/><span>Создать карточку</span></button>
    </div>
  </div>;
}
