import { useState, useEffect, useRef } from 'react';
import useNebulaStore from '../store/useNebulaStore';

const FONT = '"PingFang SC","Microsoft YaHei",sans-serif';
const PLANET_EMOJIS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🪐','☄️','🌍'];
const AI_TEMPLATES = [
  (n)=>`今天在「${n}」想分享：真正的壁垒往往不在技术，而在对用户场景的颗粒度打磨。`,
  (n)=>`「${n}」日记：把复杂留给自己，把简单交给用户。`,
  (n)=>`「${n}」复盘——做产品最危险的不是走错路，而是走得太久没回头检视前提。`,
  (n)=>`「${n}」深夜思考：长期主义不是慢，而是把节奏交给正确的事。`,
  (n)=>`「${n}」笔记：护城河是你愿意做、别人不愿意做的无聊小事的累积。`,
  (n)=>`「${n}」更新：所有增长的尽头都是组织的认知边界。`,
];

function scrollScrollParentToTop(el){
  let node=el?.parentElement;
  while(node){
    const s=getComputedStyle(node);
    if(/(auto|scroll)/.test(s.overflowY)&&node.scrollHeight>node.clientHeight){node.scrollTo({top:0,left:0});return;}
    node=node.parentElement;
  }
}

function SubNavBar({title,onBack,right=null}){
  return (
    <div style={{position:'sticky',top:0,zIndex:10,background:'rgba(247,247,248,0.95)',backdropFilter:'blur(20px)',padding:'10px 14px',display:'flex',alignItems:'center',gap:8,borderBottom:'0.5px solid rgba(0,0,0,0.06)'}}>
      <span onClick={onBack} style={{fontSize:18,color:'#1d1d1f',cursor:'pointer',lineHeight:1,minWidth:32,fontFamily:'system-ui,sans-serif'}}>‹</span>
      <span style={{flex:1,fontSize:13,fontWeight:600,color:'#1d1d1f',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</span>
      {right}
    </div>
  );
}

function PlanetPostCard({post,onDelete}){
  const isAgent=post.source==='agent';
  return (
    <div style={{background:'#fff',padding:'14px 16px 12px',borderBottom:'0.5px solid rgba(0,0,0,0.05)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:isAgent?'linear-gradient(135deg,#FFD700,#FF8C00)':'#e8e8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:isAgent?'#fff':'#1d1d1f',flexShrink:0}}>{post.authorAvatar||(isAgent?'✨':'·')}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1d1d1f',fontFamily:FONT,display:'flex',alignItems:'center',gap:6}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.authorName}</span>
            {isAgent&&<span style={{fontSize:10,fontWeight:500,color:'#FF8C00',background:'rgba(255,140,0,0.12)',padding:'1px 6px',borderRadius:8}}>AI 生成</span>}
          </div>
          <div style={{fontSize:11,color:'#8e8e93',marginTop:2,fontFamily:FONT}}>{post.time}</div>
        </div>
        {onDelete&&<span onClick={()=>onDelete(post.id)} style={{fontSize:18,color:'#c7c7cc',cursor:'pointer',lineHeight:1,padding:4}} title="删除">···</span>}
      </div>
      <div style={{fontSize:14,lineHeight:1.6,color:'#1d1d1f',fontFamily:FONT,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{post.text}</div>
    </div>
  );
}

export function PlanetListScreen(){
  const userPlanets=useNebulaStore(s=>s.userPlanets);
  const planetPosts=useNebulaStore(s=>s.planetPosts);
  const setCurrentPlanet=useNebulaStore(s=>s.setCurrentPlanet);
  const deletePlanet=useNebulaStore(s=>s.deletePlanet);
  const [showCreate,setShowCreate]=useState(false);
  return (
    <div>
      <div style={{background:'linear-gradient(135deg,#2a2a3a 0%,#4a4a5e 100%)',padding:'20px 16px 18px',color:'#fff',position:'relative'}}>
        <div style={{fontSize:16,fontWeight:600,marginBottom:4,fontFamily:FONT}}>🪐 知识星图市场</div>
        <div style={{fontSize:11,opacity:0.7,lineHeight:1.5,fontFamily:FONT}}>开垦你的知识星域，沉淀思考与洞察<br/>每颗星球都是可视化生长的知识资产</div>
        <div onClick={()=>setShowCreate(true)} style={{position:'absolute',top:18,right:14,background:'rgba(255,255,255,0.18)',backdropFilter:'blur(10px)',border:'0.5px solid rgba(255,255,255,0.3)',borderRadius:16,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#fff',fontFamily:FONT}}>✚ 开垦</div>
      </div>
      {userPlanets.length===0?(
        <div style={{padding:'60px 30px',textAlign:'center',color:'#8e8e93',fontSize:13,fontFamily:FONT}}>
          <div style={{fontSize:48,marginBottom:12}}>🌑</div>
          <div style={{fontSize:14,fontWeight:600,color:'#1d1d1f',marginBottom:6}}>还没有自己的星球</div>
          <div>点击右上角「✚ 创建」开启第一个知识星球</div>
        </div>
      ):(
        <div>
          {userPlanets.map(planet=>{
            const count=(planetPosts[planet.id]||[]).length;
            return (
              <div key={planet.id} style={{background:'#fff',padding:'14px 16px',cursor:'pointer',borderBottom:'0.5px solid rgba(0,0,0,0.05)',display:'flex',alignItems:'center',gap:12}} onClick={()=>setCurrentPlanet(planet.id)}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'radial-gradient(circle at 30% 30%,#dcdce2 0%,#a8a8b0 60%,#7a7a85 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'inset -3px -3px 6px rgba(0,0,0,0.2)'}}>{planet.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#1d1d1f',marginBottom:3,fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{planet.name}</div>
                  <div style={{fontSize:11,color:'#8e8e93',fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{planet.description||'暂无简介'} · {count} 篇</div>
                </div>
                <span onClick={(e)=>{e.stopPropagation();if(window.confirm(`确定删除星球「${planet.name}」？所有内容将一并清除。`))deletePlanet(planet.id);}} style={{fontSize:16,color:'#c7c7cc',cursor:'pointer',padding:6,lineHeight:1}} title="删除星球">···</span>
              </div>
            );
          })}
        </div>
      )}
      {showCreate&&<CreatePlanetModal onClose={()=>setShowCreate(false)}/>}
    </div>
  );
}

// 💎 星球价值面板 —— 知识资产可视化（Tier-1 商业化最小实现）
// 4 个指标 + 5 维 SVG 雷达图，全部基于 posts 真实计算，无后端依赖
function PlanetValuePanel({planet,posts}){
  const postCount=posts.length;
  const aiCount=posts.filter(p=>p.source==='agent').length;
  const totalLen=posts.reduce((s,p)=>s+(p.text||'').length,0);
  const avgLen=postCount>0?Math.round(totalLen/postCount):0;
  const daysSince=Math.max(1,Math.ceil((Date.now()-(planet.createdAt||Date.now()))/86400000));
  const uniqWords=new Set(posts.flatMap(p=>(p.text||'').split(/[\s，。、！？]/).filter(w=>w.length>1))).size;
  const radar=[
    {l:'产出',v:Math.min(100,postCount*15)},
    {l:'AI协作',v:postCount>0?Math.min(100,(aiCount/postCount)*70+aiCount*5):0},
    {l:'深度',v:Math.min(100,avgLen*0.4)},
    {l:'频率',v:Math.min(100,(postCount/daysSince)*30)},
    {l:'广度',v:Math.min(100,uniqWords*2)},
  ];
  const score=Math.round(radar.reduce((s,x)=>s+x.v,0)/5);
  const N=5,cx=70,cy=70,R=52;
  const ang=i=>(Math.PI*2*i/N)-Math.PI/2;
  const pt=(i,r)=>`${cx+Math.cos(ang(i))*r},${cy+Math.sin(ang(i))*r}`;
  const poly=r=>[0,1,2,3,4].map(i=>pt(i,r)).join(' ');
  const dataPoly=radar.map((x,i)=>pt(i,(x.v/100)*R)).join(' ');
  const verdict=score>=70?'🔥 高价值星球：产出活跃、AI 协作充分，知识资产持续增值。':score>=35?'✨ 成长中星球：持续铸造，价值正在积累。':'🌱 新生星球：开始铸造知识卡片，让价值可视化生长。';
  return (
    <div style={{background:'#1a1a24',padding:'16px 14px',color:'#fff'}}>
      <div style={{fontSize:13,fontWeight:600,marginBottom:12,fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>💎 知识资产价值</span>
        <span style={{fontSize:10,opacity:0.5,fontWeight:400}}>基于内容活跃度实时计算</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
        {[
          {l:'知识卡片',v:postCount,u:'篇',c:'#b8d4ff'},
          {l:'AI 衍生',v:aiCount,u:'次',c:'#FFD700'},
          {l:'平均深度',v:avgLen,u:'字',c:'#7ee7c7'},
          {l:'活跃指数',v:score,u:'分',c:'#ff9ec7'},
        ].map(m=>(
          <div key={m.l} style={{background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'10px 12px'}}>
            <div style={{fontSize:10,opacity:0.6,marginBottom:4,fontFamily:FONT}}>{m.l}</div>
            <div style={{display:'flex',alignItems:'baseline',gap:3}}>
              <span style={{fontSize:20,fontWeight:700,color:m.c,fontFamily:FONT}}>{m.v}</span>
              <span style={{fontSize:10,opacity:0.6,fontFamily:FONT}}>{m.u}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{flexShrink:0}}>
          {[0.25,0.5,0.75,1].map(r=>(<polygon key={r} points={poly(R*r)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>))}
          {[0,1,2,3,4].map(i=>(<line key={i} x1={cx} y1={cy} x2={cx+Math.cos(ang(i))*R} y2={cy+Math.sin(ang(i))*R} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>))}
          <polygon points={dataPoly} fill="rgba(184,212,255,0.25)" stroke="#b8d4ff" strokeWidth="1.5"/>
          {radar.map((x,i)=>(<circle key={i} cx={cx+Math.cos(ang(i))*(x.v/100)*R} cy={cy+Math.sin(ang(i))*(x.v/100)*R} r="2" fill="#cfe2ff"/>))}
          {radar.map((x,i)=>(<text key={i} x={cx+Math.cos(ang(i))*(R+13)} y={cy+Math.sin(ang(i))*(R+13)} fill="rgba(255,255,255,0.7)" fontSize="9" textAnchor="middle" dominantBaseline="middle" fontFamily={FONT}>{x.l}</text>))}
        </svg>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,opacity:0.85,lineHeight:1.6,fontFamily:FONT}}>{verdict}</div>
          <div style={{fontSize:10,opacity:0.4,marginTop:8,fontFamily:FONT,lineHeight:1.5}}>知识价值 = 产出 × AI 衍生 × 连接 × 时间复利</div>
        </div>
      </div>
    </div>
  );
}

// 占位：后续 replace_in_file 补全
export function PlanetDetailScreen({planetId}){
  const containerRef=useRef();
  const userPlanets=useNebulaStore(s=>s.userPlanets);
  const planetPosts=useNebulaStore(s=>s.planetPosts);
  const deletePlanetPost=useNebulaStore(s=>s.deletePlanetPost);
  const setCurrentPlanet=useNebulaStore(s=>s.setCurrentPlanet);
  const [showCompose,setShowCompose]=useState(false);
  const planet=userPlanets.find(p=>p.id===planetId);
  const posts=planetPosts[planetId]||[];
  const focusPlanet=useNebulaStore(s=>s.focusPlanet);
  const closePhone=useNebulaStore(s=>s.closePhone);
  useEffect(()=>{scrollScrollParentToTop(containerRef.current);},[planetId]);
  if(!planet){
    return (
      <div ref={containerRef}>
        <SubNavBar title="星球不存在" onBack={()=>setCurrentPlanet(null)}/>
        <div style={{padding:40,textAlign:'center',color:'#8e8e93',fontSize:13}}>该星球已被删除</div>
      </div>
    );
  }
  return (
    <div ref={containerRef}>
      <SubNavBar title={planet.name} onBack={()=>setCurrentPlanet(null)}
        right={<span onClick={()=>setShowCompose(true)} style={{fontSize:12,fontWeight:600,color:'#fff',background:'#07C160',padding:'5px 12px',borderRadius:14,cursor:'pointer',fontFamily:FONT}}>✎ 铸造</span>}/>
      <div style={{background:'linear-gradient(135deg,#3a3a4a 0%,#5a5a6e 50%,#2a2a3a 100%)',padding:'24px 16px 20px',color:'#fff'}}>
        <div style={{fontSize:44,marginBottom:8}}>{planet.emoji}</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:6,fontFamily:FONT}}>{planet.name}</div>
        {planet.description&&<div style={{fontSize:12,lineHeight:1.5,opacity:0.85,maxWidth:'90%',fontFamily:FONT}}>{planet.description}</div>}
        <div style={{fontSize:11,opacity:0.6,marginTop:10,fontFamily:FONT}}>📅 创建于 {new Date(planet.createdAt).toLocaleDateString('zh-CN')} · {posts.length} 篇内容</div>
        <div onClick={()=>{focusPlanet(planetId);closePhone();}} style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:5,background:'rgba(157,123,255,0.22)',border:'0.5px solid rgba(157,123,255,0.5)',borderRadius:14,padding:'6px 12px',fontSize:12,fontWeight:600,color:'#c9b8ff',cursor:'pointer',fontFamily:FONT}}>🛰️ 在星空中定位这颗月球</div>
      </div>
      <PlanetValuePanel planet={planet} posts={posts}/>
      {posts.length===0?(
        <div style={{padding:'50px 30px',textAlign:'center',color:'#8e8e93',fontSize:13,fontFamily:FONT}}>
          <div style={{fontSize:36,marginBottom:10}}>📝</div>
          还没有内容<br/>点右上角「✎ 发表」写下第一篇吧
        </div>
      ):(
        <div>{posts.map(post=><PlanetPostCard key={post.id} post={post} onDelete={(pid)=>deletePlanetPost(planetId,pid)}/>)}</div>
      )}
      {showCompose&&<ComposePlanetPost planetId={planetId} planetName={planet.name} onClose={()=>setShowCompose(false)}/>}
    </div>
  );
}

export function CreatePlanetModal({onClose}){
  const createPlanet=useNebulaStore(s=>s.createPlanet);
  const setCurrentPlanet=useNebulaStore(s=>s.setCurrentPlanet);
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [emoji,setEmoji]=useState(PLANET_EMOJIS[0]);
  const nameRef=useRef();
  useEffect(()=>{setTimeout(()=>nameRef.current?.focus(),100);},[]);
  const canSubmit=name.trim().length>0;
  const handleSubmit=()=>{
    if(!canSubmit)return;
    const planet=createPlanet({name,description,emoji});
    setCurrentPlanet(planet.id);
    onClose();
  };
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
      <div onClick={(e)=>e.stopPropagation()} style={{width:'100%',background:'#fff',borderRadius:'14px 14px 0 0',padding:'16px 16px 24px',animation:'fnSheetUp 0.28s ease-out'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span onClick={onClose} style={{fontSize:14,color:'#8e8e93',cursor:'pointer',fontFamily:FONT}}>取消</span>
          <span style={{fontSize:14,fontWeight:600,color:'#1d1d1f',fontFamily:FONT}}>开垦知识星域</span>
          <span onClick={handleSubmit} style={{fontSize:14,fontWeight:600,color:canSubmit?'#07C160':'#c7c7cc',cursor:canSubmit?'pointer':'not-allowed',fontFamily:FONT}}>完成</span>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:'#8e8e93',marginBottom:8,fontFamily:FONT}}>星球图标</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {PLANET_EMOJIS.map(em=>(
              <div key={em} onClick={()=>setEmoji(em)} style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',background:emoji===em?'rgba(0,0,0,0.06)':'transparent',border:emoji===em?'1.5px solid #1d1d1f':'1.5px solid transparent'}}>{em}</div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <input ref={nameRef} value={name} onChange={(e)=>setName(e.target.value)} placeholder="星球名称（如：产品思考圈）" maxLength={20} style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',fontSize:14,border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:8,outline:'none',fontFamily:FONT}} onKeyDown={(e)=>{if(e.key==='Enter')handleSubmit();}}/>
        </div>
        <div style={{marginBottom:12}}>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="一句话介绍你的星球（选填）" maxLength={80} rows={2} style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',fontSize:14,border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:8,outline:'none',resize:'none',fontFamily:FONT}}/>
        </div>
        <div style={{fontSize:11,color:'#8e8e93',textAlign:'center',fontFamily:FONT,opacity:0.8}}>🌐 创建后，这颗星球将以月球形态环绕你的分身在 3D 星空中运行</div>
      </div>
    </div>
  );
}

export function ComposePlanetPost({planetId,planetName,onClose}){
  const addPlanetPost=useNebulaStore(s=>s.addPlanetPost);
  const userProfile=useNebulaStore(s=>s.userProfile);
  const [text,setText]=useState('');
  const [aiLoading,setAiLoading]=useState(false);
  const textRef=useRef();
  useEffect(()=>{setTimeout(()=>textRef.current?.focus(),100);},[]);
  const canSubmit=text.trim().length>0;
  const handleManual=()=>{
    if(!canSubmit)return;
    addPlanetPost(planetId,text,'manual',userProfile?.name,userProfile?.avatar);
    onClose();
  };
  const handleAiGenerate=()=>{
    setAiLoading(true);
    setTimeout(()=>{
      const tpl=AI_TEMPLATES[Math.floor(Math.random()*AI_TEMPLATES.length)];
      const content=tpl(planetName);
      addPlanetPost(planetId,content,'agent','AI 星主助理','✨');
      setAiLoading(false);
      onClose();
    },800+Math.random()*600);
  };
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
      <div onClick={(e)=>e.stopPropagation()} style={{width:'100%',background:'#fff',borderRadius:'14px 14px 0 0',padding:'16px 16px 24px',animation:'fnSheetUp 0.28s ease-out'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span onClick={onClose} style={{fontSize:14,color:'#8e8e93',cursor:'pointer',fontFamily:FONT}}>取消</span>
          <span style={{fontSize:14,fontWeight:600,color:'#1d1d1f',fontFamily:FONT}}>铸造知识卡片到「{planetName}」</span>
          <span onClick={handleManual} style={{fontSize:14,fontWeight:600,color:canSubmit?'#07C160':'#c7c7cc',cursor:canSubmit?'pointer':'not-allowed',fontFamily:FONT}}>发表</span>
        </div>
        <textarea ref={textRef} value={text} onChange={(e)=>setText(e.target.value)} placeholder="这一刻的想法…" maxLength={500} rows={6} style={{width:'100%',boxSizing:'border-box',padding:'12px',fontSize:14,lineHeight:1.6,border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:8,outline:'none',resize:'none',fontFamily:FONT}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <span style={{fontSize:11,color:'#8e8e93',fontFamily:FONT}}>{text.length}/500</span>
        </div>
        <div style={{marginTop:14,paddingTop:14,borderTop:'0.5px solid rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:11,color:'#8e8e93',marginBottom:8,fontFamily:FONT}}>星主发布方式</div>
          <button onClick={handleAiGenerate} disabled={aiLoading} style={{
            width:'100%',padding:'11px',fontSize:13,fontWeight:600,
            background:aiLoading?'#e8e8ed':'linear-gradient(135deg,#FFD700,#FF8C00)',
            color:aiLoading?'#8e8e93':'#fff',border:'none',borderRadius:10,cursor:aiLoading?'not-allowed':'pointer',
            fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          }}>
            {aiLoading?'✨ 正在生成…':'✨ 让 AI 替我生成一篇'}
          </button>
          <div style={{fontSize:10,color:'#8e8e93',textAlign:'center',marginTop:6,fontFamily:FONT,opacity:0.8}}>AI 会基于「{planetName}」主题生成一段思考笔记</div>
        </div>
      </div>
    </div>
  );
}
