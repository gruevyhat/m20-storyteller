
const root=document.documentElement,theme=document.querySelector('#theme');
const tocToggle=document.querySelector('.toc-toggle');tocToggle.addEventListener('click',()=>{const open=document.querySelector('.sidebar').classList.toggle('is-open');tocToggle.setAttribute('aria-expanded',String(open));tocToggle.textContent=open?'Close chapter list ↑':'Chapters ↓'});
document.querySelectorAll('.sidebar a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.sidebar').classList.remove('is-open');tocToggle.setAttribute('aria-expanded','false');tocToggle.textContent='Chapters ↓'}));
theme.addEventListener('click',()=>{const light=root.dataset.theme!=='light';root.dataset.theme=light?'light':'dark';theme.textContent=light?'Dark theme':'Light theme';theme.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme')});
document.querySelector('#print').addEventListener('click',()=>window.print());
const toast=document.querySelector('.toast');let toastTimer;
document.querySelectorAll('.copy').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.parentElement.querySelector('p').textContent);toast.textContent='Text copied';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.textContent='',2200)}catch{toast.textContent='Select the example text to copy it.';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.textContent='',3500)}}));
const sections=[...document.querySelectorAll('.article > h2')],links=[...document.querySelectorAll('.sidebar a')];
function progress(){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.progress').style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';let current=sections[0]?.id;for(const h of sections){if(h.getBoundingClientRect().top<140)current=h.id}for(const a of links){if(a.hash==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')}}
window.addEventListener('scroll',progress,{passive:true});window.addEventListener('resize',progress);progress();
