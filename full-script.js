const $ = (selector) => document.querySelector(selector);
const digitsOnly = (value) => [...value.replaceAll("-", "")].map(Number).filter(Boolean);
const reduceNumber = (number) => { let n = number; while (n > 9) n = [...String(n)].reduce((a,b)=>a+Number(b),0); return n; };

function calculate(dateValue){
  const [year,month,day] = dateValue.split("-").map(Number);
  const innate = digitsOnly(dateValue);
  const birthday = reduceNumber([...String(day)].reduce((a,b)=>a+Number(b),0));
  const total = innate.reduce((a,b)=>a+b,0);
  const talentDigits = total > 9 ? [...String(total)].map(Number).filter(Boolean) : [total];
  let stage = total;
  let master = null;
  while(stage > 9){
    stage = [...String(stage)].reduce((a,b)=>a+Number(b),0);
    if([11,22,33].includes(stage)) master = stage;
  }
  const life = stage;
  const all = [...innate, birthday, ...talentDigits, life];
  const counts = Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,all.filter(n=>n===i+1).length]));
  return {year,month,day,innate,birthday,total,talentDigits,life,master,counts};
}

function energyState(count){ if(count===0)return "空缺"; if(count===1)return "均衡能量"; if(count===2)return "較明顯能量"; if(count===3)return "主導能量"; return "高度主導"; }
function stateText(item,count){ if(count===0)return item.missing; if(count===1)return item.levels[0]; if(count===2)return item.levels[1]; if(count===3)return item.levels[2]; return item.levels[3]; }

function renderCore(data){
  $("#resultTitle").textContent=`${data.year}年${data.month}月${data.day}日的生命靈數命盤`;
  const talent=data.talentDigits.join("");
  const lifeDisplay=data.master?`${data.master}/${data.life}`:String(data.life);
  const items=[["生日數",data.birthday],["天賦數",talent],["主命數／生命數",lifeDisplay],["空缺數",Object.keys(data.counts).filter(n=>data.counts[n]===0).join("、")||"無"]];
  $("#coreNumbers").replaceChildren(...items.map(([k,v])=>{const d=document.createElement("div"),dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=k;dd.textContent=v;d.append(dt,dd);return d;}));
}

function renderGrid(data){
  const order=[3,6,9,2,5,8,1,4,7];
  $("#grid").replaceChildren(...order.map(n=>{const d=document.createElement("div");d.className=`number-cell${data.counts[n]===0?" missing":""}`;const s=data.counts[n]?String(n).repeat(data.counts[n]):"—";d.innerHTML=`<strong>${s}</strong><span>${data.counts[n]} 次｜${energyState(data.counts[n])}</span>`;return d;}));
}

function renderNumbers(data){
  $("#numberCards").replaceChildren(...Object.entries(NUMBER_DATA).map(([n,item])=>{const count=data.counts[n];const card=document.createElement("article");card.className="energy-card";card.innerHTML=`<p class="status">數字${n}｜${energyState(count)}｜${count}次</p><h3>${item.title}</h3><div class="badges">${item.keywords.map(x=>`<span class="badge">${x}</span>`).join("")}</div><p>${stateText(item,count)}</p><details><summary>查看完整解析</summary><div class="details"><p><b>優勢：</b>${item.strength}</p><p><b>過載盲點：</b>${item.overload}</p><p><b>提醒：</b>${item.reminder}</p></div></details>`;return card;}));
}

function evaluateLines(data){
  return LINE_DATA.map((line,index)=>{const present=line.numbers.filter(n=>data.counts[n]>0);const missing=line.numbers.filter(n=>data.counts[n]===0);return {...line,index,present,missing,formed:missing.length===0,strength:line.numbers.reduce((s,n)=>s+data.counts[n],0),strongest:[...line.numbers].sort((a,b)=>data.counts[b]-data.counts[a]||a-b)[0]};});
}
function lineCard(line,counts){const card=document.createElement("article");card.className="line-card";card.innerHTML=`<p class="status">${line.code}｜${line.name}${line.alias?`｜${line.alias}`:""}</p><h3>${line.formed?"正式成立":`尚未形成｜目前缺${line.missing.join("、")}`}</h3>${line.formed?`<p>${line.core}</p><p><b>線內最強數字：</b>${line.strongest}（${counts[line.strongest]}次）</p><details><summary>查看完整解析</summary><div class="details"><p><b>能量原理：</b>${line.principle}</p><p><b>優勢：</b>${line.strengthText}</p><p><b>過載盲點：</b>${line.overload}</p><p><b>提醒：</b>${line.reminder}</p></div></details>`:`<p>${line.missing.map(n=>`缺數${n}：${NUMBER_DATA[n].missing}`).join(" ")}</p>`}`;return card;}

function renderLines(data){const lines=evaluateLines(data);const formed=lines.filter(x=>x.formed).sort((a,b)=>b.strength-a.strength||a.index-b.index);const near=lines.filter(x=>!x.formed&&x.numbers.length===3&&x.missing.length===1);$("#formedLines").replaceChildren(...(formed.length?formed.map(x=>lineCard(x,data.counts)):[emptyCard("目前沒有正式成立的連線") ]));$("#nearLines").replaceChildren(...(near.length?near.map(x=>lineCard(x,data.counts)):[emptyCard("目前沒有只差一碼的三碼連線") ]));return formed;}
function emptyCard(text){const d=document.createElement("article");d.className="line-card";d.textContent=text;return d;}

function renderHighlights(data,formed){
  const ranked=Object.entries(data.counts).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]));const max=ranked[0][1];const strongest=ranked.filter(x=>x[1]===max&&max>0).map(x=>x[0]);const missing=ranked.filter(x=>x[1]===0).map(x=>x[0]);const main=formed[0];
  const items=[`主命核心：數字${data.life}｜${NUMBER_DATA[data.life].title}`,`最強數字：${strongest.join("、")}（各${max}次）`,main?`主要連線：${main.code}｜${main.name}`:"主要連線：目前沒有正式成立",`空缺課題：${missing.join("、")||"沒有空缺數"}`];
  $("#highlights").replaceChildren(...items.map(x=>{const d=document.createElement("div");d.className="highlight";d.textContent=x;return d;}));
  $("#integratedSummary").textContent=`你的主命核心是數字${data.life}，最明顯的能量集中在${strongest.join("、")}；${main?`主要連線是${main.name}，呈現${main.core}`:"目前沒有正式成立的主要連線"}。${missing.length?`空缺${missing.join("、")}不是缺點，而是較需要透過經驗建立的能力。`:"命盤沒有空缺數，仍需留意高能量過度使用。"}`;
}

$("#calculator").addEventListener("submit",event=>{event.preventDefault();const value=$("#birthDate").value;if(!value){$("#error").textContent="請先選擇西元出生年月日。";return;}$("#error").textContent="";const data=calculate(value);renderCore(data);renderGrid(data);renderNumbers(data);const formed=renderLines(data);renderHighlights(data,formed);$("#result").hidden=false;$("#result").scrollIntoView({behavior:"smooth",block:"start"});});
