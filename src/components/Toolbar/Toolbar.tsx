import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { ToolType } from '../../types/editor';

const TOOL_GROUPS = [
  { label: 'SELECT', color: 'var(--c-purple)', tools: [
    { id:'select'as ToolType, label:'Select', key:'V' },
    { id:'move'as ToolType, label:'Move', key:'M' },
    { id:'marquee'as ToolType, label:'Marquee', key:'M' },
    { id:'lasso'as ToolType, label:'Lasso', key:'L' },
    { id:'magic-wand'as ToolType, label:'Magic Wand', key:'W' },
  ]},
  { label: 'DRAW', color: 'var(--c-teal)', tools: [
    { id:'rect'as ToolType, label:'Rectangle', key:'R' },
    { id:'ellipse'as ToolType, label:'Ellipse', key:'E' },
    { id:'line'as ToolType, label:'Line', key:'L' },
    { id:'pen'as ToolType, label:'Pen', key:'P' },
    { id:'text'as ToolType, label:'Text', key:'T' },
    { id:'shape-builder'as ToolType, label:'Shape Build', key:'U' },
  ]},
  { label: 'PAINT', color: 'var(--c-red)', tools: [
    { id:'brush'as ToolType, label:'Brush', key:'B' },
    { id:'eraser'as ToolType, label:'Eraser', key:'E' },
    { id:'fill'as ToolType, label:'Fill', key:'G' },
    { id:'gradient'as ToolType, label:'Gradient', key:'G' },
    { id:'clone'as ToolType, label:'Clone Stamp', key:'S' },
    { id:'healing'as ToolType, label:'Healing', key:'H' },
  ]},
];

export default function Toolbar() {
  const { state, dispatch } = useEditor();
  const { basicMode } = state.globalSettings;
  const [search, setSearch] = useState('');

  const groups = basicMode ? TOOL_GROUPS.slice(0,2) : TOOL_GROUPS;
  const filtered = search.trim()
    ? groups.map(g=>({...g,tools:g.tools.filter(t=>t.label.toLowerCase().includes(search.toLowerCase())||t.key.toLowerCase().includes(search.toLowerCase()))})).filter(g=>g.tools.length>0)
    : groups;

  return (
    <div style={{width:'var(--toolbar-w)',background:'var(--bg-surface)',borderRight:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>

      <div style={{padding:'12px 10px 10px',borderBottom:'1px solid var(--border-subtle)',fontFamily:'var(--font-display)',fontSize:10,fontWeight:800,letterSpacing:2,color:'var(--accent)',userSelect:'none'}}>
        DE
      </div>

      <div style={{padding:'8px 8px',borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{position:'relative'}}>
          <svg style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Tools..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',padding:'6px 6px 6px 24px',fontSize:9,borderRadius:'var(--radius)',border:'1px solid var(--border-default)',background:'var(--bg-input)',color:'var(--text-secondary)',fontFamily:'var(--font-body)',fontWeight:500}} />
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
        {filtered.map(grp=>(
          <div key={grp.label} style={{marginBottom:4}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:6,fontWeight:800,letterSpacing:2,color:grp.color,padding:'8px 10px 4px'}}>{grp.label}</div>
            {grp.tools.map(t=>{
              const a = state.tool===t.id;
              return (
                <button key={t.id} onClick={()=>dispatch({type:'SET_TOOL',payload:t.id})}
                  style={{display:'flex',alignItems:'center',gap:6,width:'100%',padding:'6px 10px',fontFamily:'var(--font-display)',fontSize:9,fontWeight:600,letterSpacing:.6,textAlign:'left',background:a?'rgba(124,92,252,.06)':'transparent',borderLeft:a?`3px solid ${grp.color}`:'3px solid transparent',color:a?'#fff':'var(--text-muted)',borderRadius:0,cursor:'pointer',transition:'all .06s'}}
                  onMouseEnter={e=>{if(!a){e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.background='var(--bg-elevated)'}}}
                  onMouseLeave={e=>{if(!a){e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.background='transparent'}}}>
                  <span style={{fontFamily:'var(--font-body)',fontSize:8,fontWeight:700,color:a?grp.color:'var(--text-disabled)',width:16,textAlign:'center'}}>{t.key}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{padding:'8px 8px',borderTop:'1px solid var(--border-subtle)'}}>
        <div style={{display:'flex',gap:5,marginBottom:5}}>
          <div style={{width:20,height:20,borderRadius:'var(--radius)',background:'#1a1a1a',border:'2px solid var(--border-strong)',cursor:'pointer'}}/>
          <div style={{width:20,height:20,borderRadius:'var(--radius)',background:'#fff',border:'2px solid var(--border-strong)',cursor:'pointer'}}/>
        </div>
        <div style={{fontFamily:'var(--font-display)',fontSize:6,fontWeight:700,letterSpacing:1.5,color:'var(--text-disabled)',marginBottom:6}}>FG / BG</div>
        <button onClick={()=>dispatch({type:'SET_BASIC_MODE',payload:!basicMode})}
          style={{width:'100%',padding:'5px',borderRadius:'var(--radius)',fontFamily:'var(--font-display)',fontSize:7,fontWeight:700,letterSpacing:1.5,border:'1px solid var(--border-default)',background:basicMode?'rgba(124,92,252,.06)':'transparent',color:basicMode?'var(--accent)':'var(--text-muted)',cursor:'pointer'}}>
          {basicMode?'ADVANCED':'BASIC'}
        </button>
      </div>
    </div>
  );
}
