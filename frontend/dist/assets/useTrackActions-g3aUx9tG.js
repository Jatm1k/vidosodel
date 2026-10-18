import{O as In,P as me,Q as je,R as Ot,S as xe,T as re,Y as Qe,U as et,V as tt,W as Fe,X as se,Z as xt,_ as ee,$ as Ze,a0 as Te,a1 as f,a2 as Sn,L as Ge,k as u,c as d,b as c,K as _e,m as F,q as G,a3 as de,f as w,t as C,j as N,w as v,e as r,a4 as Ne,J as $,F as S,r as le,l as j,x as qe,u as nt,n as ce,a5 as Ln,a6 as pt,a7 as Vn,a8 as It,a9 as it,aa as St,ab as lt,ac as Cn,ad as Le,ae as Mn,af as Lt,ag as Ye,ah as Me,ai as ze,aj as Vt,B as Je,ak as fe,al as zn,am as Yt,an as Ve,ao as Jt,ap as Qt,aq as en,ar as tn,as as pe,at as nn,p as ln,au as $n,s as on,d as ot,v as Ct,y as Xe,g as h,z as an,A as Pe,C as ue,h as R,a as Fn,i as Q,o as Tn,G as dt,av as Pn,aw as An,ax as En}from"./index-U2M6hm7X.js";import{a as oe,b as J,s as ie}from"./index-BcjBhRIA.js";import{s as ve}from"./index-XXw6m-UC.js";var at=In(),Dn=`
    .p-menu {
        background: dt('menu.background');
        color: dt('menu.color');
        border: 1px solid dt('menu.border.color');
        border-radius: dt('menu.border.radius');
        min-width: 12.5rem;
    }

    .p-menu-list {
        margin: 0;
        padding: dt('menu.list.padding');
        outline: 0 none;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: dt('menu.list.gap');
    }

    .p-menu-item-content {
        transition:
            background dt('menu.transition.duration'),
            color dt('menu.transition.duration');
        border-radius: dt('menu.item.border.radius');
        color: dt('menu.item.color');
        overflow: hidden;
    }

    .p-menu-item-link {
        cursor: pointer;
        display: flex;
        align-items: center;
        text-decoration: none;
        overflow: hidden;
        position: relative;
        color: inherit;
        padding: dt('menu.item.padding');
        gap: dt('menu.item.gap');
        user-select: none;
        outline: 0 none;
    }

    .p-menu-item-label {
        line-height: 1;
    }

    .p-menu-item-icon {
        color: dt('menu.item.icon.color');
    }

    .p-menu-item.p-focus .p-menu-item-content {
        color: dt('menu.item.focus.color');
        background: dt('menu.item.focus.background');
    }

    .p-menu-item.p-focus .p-menu-item-icon {
        color: dt('menu.item.icon.focus.color');
    }

    .p-menu-item:not(.p-disabled) .p-menu-item-content:hover {
        color: dt('menu.item.focus.color');
        background: dt('menu.item.focus.background');
    }

    .p-menu-item:not(.p-disabled) .p-menu-item-content:hover .p-menu-item-icon {
        color: dt('menu.item.icon.focus.color');
    }

    .p-menu-overlay {
        box-shadow: dt('menu.shadow');
    }

    .p-menu-submenu-label {
        background: dt('menu.submenu.label.background');
        padding: dt('menu.submenu.label.padding');
        color: dt('menu.submenu.label.color');
        font-weight: dt('menu.submenu.label.font.weight');
    }

    .p-menu-separator {
        border-block-start: 1px solid dt('menu.separator.border.color');
    }
`,Bn={root:function(e){var n=e.props;return["p-menu p-component",{"p-menu-overlay":n.popup}]},start:"p-menu-start",list:"p-menu-list",submenuLabel:"p-menu-submenu-label",separator:"p-menu-separator",end:"p-menu-end",item:function(e){var n=e.instance;return["p-menu-item",{"p-focus":n.id===n.focusedOptionId,"p-disabled":n.disabled()}]},itemContent:"p-menu-item-content",itemLink:"p-menu-item-link",itemIcon:"p-menu-item-icon",itemLabel:"p-menu-item-label"},Hn=me.extend({name:"menu",style:Dn,classes:Bn}),Kn={name:"BaseMenu",extends:xe,props:{popup:{type:Boolean,default:!1},model:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Hn,provide:function(){return{$pcMenu:this,$parentInstance:this}}},sn={name:"Menuitem",hostName:"Menu",extends:xe,inheritAttrs:!1,emits:["item-click","item-mousemove"],props:{item:null,templates:null,id:null,focusedOptionId:null,index:null},methods:{getItemProp:function(e,n){return e&&e.item?Sn(e.item[n]):void 0},getPTOptions:function(e){return this.ptm(e,{context:{item:this.item,index:this.index,focused:this.isItemFocused(),disabled:this.disabled()}})},isItemFocused:function(){return this.focusedOptionId===this.id},onItemClick:function(e){var n=this.getItemProp(this.item,"command");n&&n({originalEvent:e,item:this.item.item}),this.$emit("item-click",{originalEvent:e,item:this.item,id:this.id})},onItemMouseMove:function(e){this.$emit("item-mousemove",{originalEvent:e,item:this.item,id:this.id})},visible:function(){return typeof this.item.visible=="function"?this.item.visible():this.item.visible!==!1},disabled:function(){return typeof this.item.disabled=="function"?this.item.disabled():this.item.disabled},label:function(){return typeof this.item.label=="function"?this.item.label():this.item.label},getMenuItemProps:function(e){return{action:f({class:this.cx("itemLink"),tabindex:"-1"},this.getPTOptions("itemLink")),icon:f({class:[this.cx("itemIcon"),e.icon]},this.getPTOptions("itemIcon")),label:f({class:this.cx("itemLabel")},this.getPTOptions("itemLabel"))}}},computed:{dataP:function(){return re({focus:this.isItemFocused(),disabled:this.disabled()})}},directives:{ripple:Ot}},Un=["id","aria-label","aria-disabled","data-p-focused","data-p-disabled","data-p"],Rn=["data-p"],jn=["href","target"],Gn=["data-p"],_n=["data-p"];function Nn(t,e,n,l,s,i){var b=Ge("ripple");return i.visible()?(u(),d("li",f({key:0,id:n.id,class:[t.cx("item"),n.item.class],role:"menuitem",style:n.item.style,"aria-label":i.label(),"aria-disabled":i.disabled(),"data-p-focused":i.isItemFocused(),"data-p-disabled":i.disabled()||!1,"data-p":i.dataP},i.getPTOptions("item")),[c("div",f({class:t.cx("itemContent"),onClick:e[0]||(e[0]=function(p){return i.onItemClick(p)}),onMousemove:e[1]||(e[1]=function(p){return i.onItemMouseMove(p)}),"data-p":i.dataP},i.getPTOptions("itemContent")),[n.templates.item?n.templates.item?(u(),F(de(n.templates.item),{key:1,item:n.item,label:i.label(),props:i.getMenuItemProps(n.item)},null,8,["item","label","props"])):w("",!0):_e((u(),d("a",f({key:0,href:n.item.url,class:t.cx("itemLink"),target:n.item.target,tabindex:"-1"},i.getPTOptions("itemLink")),[n.templates.itemicon?(u(),F(de(n.templates.itemicon),{key:0,item:n.item,class:G(t.cx("itemIcon"))},null,8,["item","class"])):n.item.icon?(u(),d("span",f({key:1,class:[t.cx("itemIcon"),n.item.icon],"data-p":i.dataP},i.getPTOptions("itemIcon")),null,16,Gn)):w("",!0),c("span",f({class:t.cx("itemLabel"),"data-p":i.dataP},i.getPTOptions("itemLabel")),C(i.label()),17,_n)],16,jn)),[[b]])],16,Rn)],16,Un)):w("",!0)}sn.render=Nn;function Ht(t){return Xn(t)||Zn(t)||Wn(t)||qn()}function qn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Wn(t,e){if(t){if(typeof t=="string")return ht(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ht(t,e):void 0}}function Zn(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Xn(t){if(Array.isArray(t))return ht(t)}function ht(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Yn={name:"Menu",extends:Kn,inheritAttrs:!1,emits:["show","hide","focus","blur"],data:function(){return{overlayVisible:!1,focused:!1,focusedOptionIndex:-1,selectedOptionIndex:-1}},target:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,list:null,mounted:function(){this.popup||(this.bindResizeListener(),this.bindOutsideClickListener())},beforeUnmount:function(){this.unbindResizeListener(),this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.target=null,this.container&&this.autoZIndex&&se.clear(this.container),this.container=null},methods:{itemClick:function(e){var n=e.item;this.disabled(n)||(n.command&&n.command(e),this.overlayVisible&&this.hide(),!this.popup&&this.focusedOptionIndex!==e.id&&(this.focusedOptionIndex=e.id))},itemMouseMove:function(e){this.focused&&(this.focusedOptionIndex=e.id)},onListFocus:function(e){this.focused=!0,!this.popup&&this.changeFocusedOptionIndex(0),this.$emit("focus",e)},onListBlur:function(e){this.focused=!1,this.focusedOptionIndex=-1,this.$emit("blur",e)},onListKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Space":this.onSpaceKey(e);break;case"Escape":this.popup&&(ee(this.target),this.hide());case"Tab":this.overlayVisible&&this.hide();break}},onArrowDownKey:function(e){var n=this.findNextOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.popup)ee(this.target),this.hide(),e.preventDefault();else{var n=this.findPrevOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()}},onHomeKey:function(e){this.changeFocusedOptionIndex(0),e.preventDefault()},onEndKey:function(e){this.changeFocusedOptionIndex(Ze(this.container,'li[data-pc-section="item"][data-p-disabled="false"]').length-1),e.preventDefault()},onEnterKey:function(e){var n=Te(this.list,'li[id="'.concat("".concat(this.focusedOptionIndex),'"]')),l=n&&Te(n,'a[data-pc-section="itemlink"]');this.popup&&ee(this.target),l?l.click():n&&n.click(),e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},findNextOptionIndex:function(e){var n=Ze(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Ht(n).findIndex(function(s){return s.id===e});return l>-1?l+1:0},findPrevOptionIndex:function(e){var n=Ze(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Ht(n).findIndex(function(s){return s.id===e});return l>-1?l-1:0},changeFocusedOptionIndex:function(e){var n=Ze(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=e>=n.length?n.length-1:e<0?0:e;l>-1&&(this.focusedOptionIndex=n[l].getAttribute("id"))},toggle:function(e,n){this.overlayVisible?this.hide():this.show(e,n)},show:function(e,n){this.overlayVisible=!0,this.target=n??e.currentTarget},hide:function(){this.overlayVisible=!1,this.target=null},onEnter:function(e){xt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.bindOutsideClickListener(),this.bindResizeListener(),this.bindScrollListener(),this.autoZIndex&&se.set("menu",e,this.baseZIndex||this.$primevue.config.zIndex.menu),this.popup&&ee(this.list),this.$emit("show")},onLeave:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindScrollListener(),this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){tt(this.container,this.target);var e=Fe(this.target);e>Fe(this.container)&&(this.container.style.minWidth=Fe(this.target)+"px")},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=e.container&&!e.container.contains(n.target),s=!(e.target&&(e.target===n.target||e.target.contains(n.target)));e.overlayVisible&&l&&s?e.hide():!e.popup&&l&&s&&(e.focusedOptionIndex=-1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new et(this.target,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Qe()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},visible:function(e){return typeof e.visible=="function"?e.visible():e.visible!==!1},disabled:function(e){return typeof e.disabled=="function"?e.disabled():e.disabled},label:function(e){return typeof e.label=="function"?e.label():e.label},onOverlayClick:function(e){at.emit("overlay-click",{originalEvent:e,target:this.target})},containerRef:function(e){this.container=e},listRef:function(e){this.list=e}},computed:{focusedOptionId:function(){return this.focusedOptionIndex!==-1?this.focusedOptionIndex:null},dataP:function(){return re({popup:this.popup})}},components:{PVMenuitem:sn,Portal:je}},Jn=["id","data-p"],Qn=["id","tabindex","aria-activedescendant","aria-label","aria-labelledby"],ei=["id"];function ti(t,e,n,l,s,i){var b=N("PVMenuitem"),p=N("Portal");return u(),F(p,{appendTo:t.appendTo,disabled:!t.popup},{default:v(function(){return[r(Ne,f({name:"p-anchored-overlay",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:v(function(){return[!t.popup||s.overlayVisible?(u(),d("div",f({key:0,ref:i.containerRef,id:t.$id,class:t.cx("root"),onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),"data-p":i.dataP},t.ptmi("root")),[t.$slots.start?(u(),d("div",f({key:0,class:t.cx("start")},t.ptm("start")),[$(t.$slots,"start")],16)):w("",!0),c("ul",f({ref:i.listRef,id:t.$id+"_list",class:t.cx("list"),role:"menu",tabindex:t.tabindex,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,onFocus:e[0]||(e[0]=function(){return i.onListFocus&&i.onListFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onListBlur&&i.onListBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onListKeyDown&&i.onListKeyDown.apply(i,arguments)})},t.ptm("list")),[(u(!0),d(S,null,le(t.model,function(m,y){return u(),d(S,{key:i.label(m)+y.toString()},[m.items&&i.visible(m)&&!m.separator?(u(),d(S,{key:0},[m.items?(u(),d("li",f({key:0,id:t.$id+"_"+y,class:[t.cx("submenuLabel"),m.class],role:"none"},{ref_for:!0},t.ptm("submenuLabel")),[$(t.$slots,t.$slots.submenulabel?"submenulabel":"submenuheader",{item:m},function(){return[j(C(i.label(m)),1)]})],16,ei)):w("",!0),(u(!0),d(S,null,le(m.items,function(O,I){return u(),d(S,{key:O.label+y+"_"+I},[i.visible(O)&&!O.separator?(u(),F(b,{key:0,id:t.$id+"_"+y+"_"+I,item:O,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"])):i.visible(O)&&O.separator?(u(),d("li",f({key:"separator"+y+I,class:[t.cx("separator"),m.class],style:O.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):w("",!0)],64)}),128))],64)):i.visible(m)&&m.separator?(u(),d("li",f({key:"separator"+y.toString(),class:[t.cx("separator"),m.class],style:m.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):(u(),F(b,{key:i.label(m)+y.toString(),id:t.$id+"_"+y,item:m,index:y,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","index","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"]))],64)}),128))],16,Qn),t.$slots.end?(u(),d("div",f({key:1,class:t.cx("end")},t.ptm("end")),[$(t.$slots,"end")],16)):w("",!0)],16,Jn)):w("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo","disabled"])}Yn.render=ti;const rn=[{id:"draft",title:"Черновик",hint:"Сценарий без озвучки"},{id:"voiced",title:"Озвучено",hint:"Ждёт раскадровку"},{id:"storyboard",title:"Раскадровка",hint:"Картинки готовы, нужен монтаж"},{id:"video",title:"Смонтировано",hint:"Видео собрано, надо проверить"},{id:"ready",title:"Готово",hint:"Проверено, можно выкладывать"},{id:"published",title:"Выложено",hint:""}],Kt=t=>rn.findIndex(e=>e.id===t),Os=t=>rn.find(e=>e.id===t)?.title??t,ni=[{id:"voice",label:"До озвучки",icon:"pi pi-microphone",hint:"Перевод и озвучка — дальше вручную",steps:["translate","voice"],below:"voiced"},{id:"scenes",label:"До сцен",icon:"pi pi-th-large",hint:"Озвучка и разбивка на сцены — можно поправить границы",steps:["translate","voice","scenes"],below:"storyboard"},{id:"prompts",label:"До промптов",icon:"pi pi-pencil",hint:"Всё до промптов картинок — проверить их, прежде чем тратить кредиты",steps:["translate","voice","scenes","characters","prompts"],below:"storyboard"},{id:"images",label:"До раскадровки",icon:"pi pi-images",hint:"Картинки готовы, видео не собирается",steps:["translate","voice","scenes","characters","prompts","images"],below:"storyboard"},{id:"video",label:"До видео",icon:"pi pi-video",hint:"Собранное видео без метаданных и обложек",steps:["translate","voice","scenes","characters","prompts","images","render"],below:"video"},{id:"all",label:"Весь конвейер",icon:"pi pi-play",hint:"",steps:null,below:"ready"}],xs=t=>t?new Date(t*1e3).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):"";async function Is(t,e){try{await ce.patch(`/api/tracks/${t}`,e)}catch(n){qe().error(n)}}function Ss(t){const e=qe(),n=nt();async function l(p,m){try{const y=await ce.post(`/api/projects/${p.id}/run`,m?{steps:m}:{});e.info(y.message,p.name),n.loadActiveJobs(),t()}catch(y){e.error(y)}}async function s(p,m){try{await ce.post(`/api/projects/${p.id}/mark`,m),t()}catch(y){e.error(y)}}async function i(p){try{await ce.post(`/api/projects/${p.id}/cancel`),n.loadActiveJobs(),t()}catch(m){e.error(m)}}function b(p,m){const y=Kt(p.status),O=p.tracks_status.some(P=>P.has_script),I=p.status==="published",A=p.tracks_status.some(P=>P.published_at),U=[];if(m)U.push({label:"Остановить",icon:"pi pi-stop",command:()=>i(p)});else{const P=ni.filter(x=>y<Kt(x.below));P.length&&U.push({label:"Довести до…",items:P.map(x=>({label:x.label,icon:x.icon,disabled:!O,command:()=>l(p,x.steps)}))})}const E=[];return p.status==="video"&&E.push({label:"Проверено",icon:"pi pi-check",command:()=>s(p,{approved:!0})}),p.status==="ready"&&E.push({label:"Снять «проверено»",icon:"pi pi-undo",command:()=>s(p,{approved:!1})}),I||E.push({label:"Выложено",icon:"pi pi-send",command:()=>s(p,{published:!0})}),A&&E.push({label:"Снять «выложено»",icon:"pi pi-undo",command:()=>s(p,{published:!1})}),E.length&&U.push({label:"Отметить",items:E}),U}return{runUntil:l,mark:s,stop:i,menuFor:b}}var ii=`
    .p-colorpicker {
        display: inline-block;
        position: relative;
    }

    .p-colorpicker-dragging {
        cursor: pointer;
    }

    .p-colorpicker-preview {
        width: dt('colorpicker.preview.width');
        height: dt('colorpicker.preview.height');
        padding: 0;
        border: 0 none;
        border-radius: dt('colorpicker.preview.border.radius');
        transition:
            background dt('colorpicker.transition.duration'),
            color dt('colorpicker.transition.duration'),
            border-color dt('colorpicker.transition.duration'),
            outline-color dt('colorpicker.transition.duration'),
            box-shadow dt('colorpicker.transition.duration');
        outline-color: transparent;
        cursor: pointer;
    }

    .p-colorpicker-preview:enabled:focus-visible {
        border-color: dt('colorpicker.preview.focus.border.color');
        box-shadow: dt('colorpicker.preview.focus.ring.shadow');
        outline: dt('colorpicker.preview.focus.ring.width') dt('colorpicker.preview.focus.ring.style') dt('colorpicker.preview.focus.ring.color');
        outline-offset: dt('colorpicker.preview.focus.ring.offset');
    }

    .p-colorpicker-panel {
        background: dt('colorpicker.panel.background');
        border: 1px solid dt('colorpicker.panel.border.color');
        border-radius: dt('colorpicker.panel.border.radius');
        box-shadow: dt('colorpicker.panel.shadow');
        width: 193px;
        height: 166px;
        position: absolute;
        top: 0;
        left: 0;
    }

    .p-colorpicker-panel-inline {
        box-shadow: none;
        position: static;
    }

    .p-colorpicker-content {
        position: relative;
    }

    .p-colorpicker-color-selector {
        width: 150px;
        height: 150px;
        inset-block-start: 8px;
        inset-inline-start: 8px;
        position: absolute;
    }

    .p-colorpicker-color-background {
        width: 100%;
        height: 100%;
        background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);
    }

    .p-colorpicker-color-handle {
        position: absolute;
        inset-block-start: 0px;
        inset-inline-start: 150px;
        border-radius: 100%;
        width: 10px;
        height: 10px;
        border-width: 1px;
        border-style: solid;
        margin: -5px 0 0 -5px;
        cursor: pointer;
        opacity: 0.85;
        border-color: dt('colorpicker.handle.color');
    }

    .p-colorpicker-hue {
        width: 17px;
        height: 150px;
        inset-block-start: 8px;
        inset-inline-start: 167px;
        position: absolute;
        opacity: 0.85;
        background: linear-gradient(0deg, red 0, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red);
    }

    .p-colorpicker-hue-handle {
        position: absolute;
        inset-block-start: 150px;
        inset-inline-start: 0px;
        width: 21px;
        margin-inline-start: -2px;
        margin-block-start: -5px;
        height: 10px;
        border-width: 2px;
        border-style: solid;
        opacity: 0.85;
        cursor: pointer;
        border-color: dt('colorpicker.handle.color');
    }
`,li={root:"p-colorpicker p-component",preview:function(e){var n=e.props;return["p-colorpicker-preview",{"p-disabled":n.disabled}]},panel:function(e){var n=e.instance,l=e.props;return["p-colorpicker-panel",{"p-colorpicker-panel-inline":l.inline,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},colorSelector:"p-colorpicker-color-selector",colorBackground:"p-colorpicker-color-background",colorHandle:"p-colorpicker-color-handle",hue:"p-colorpicker-hue",hueHandle:"p-colorpicker-hue-handle"},oi=me.extend({name:"colorpicker",style:ii,classes:li}),ai={name:"BaseColorPicker",extends:Ln,props:{defaultColor:{type:null,default:"ff0000"},inline:{type:Boolean,default:!1},format:{type:String,default:"hex"},tabindex:{type:String,default:null},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},appendTo:{type:[String,Object],default:"body"},inputId:{type:String,default:null},panelClass:null,overlayClass:null},style:oi,provide:function(){return{$pcColorPicker:this,$parentInstance:this}}},ge={name:"ColorPicker",extends:ai,inheritAttrs:!1,emits:["change","show","hide"],data:function(){return{overlayVisible:!1}},hsbValue:null,localHue:null,outsideClickListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,scrollHandler:null,resizeListener:null,hueDragging:null,colorDragging:null,selfUpdate:null,picker:null,colorSelector:null,colorHandle:null,hueView:null,hueHandle:null,watch:{modelValue:{immediate:!0,handler:function(e){this.hsbValue=this.toHSB(e),this.selfUpdate?this.selfUpdate=!1:this.updateUI()}}},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindDragListeners(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.picker&&this.autoZIndex&&se.clear(this.picker),this.clearRefs()},mounted:function(){this.updateUI()},methods:{pickColor:function(e){var n=this.colorSelector.getBoundingClientRect(),l=n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),s=n.left+document.body.scrollLeft,i=Math.floor(100*Math.max(0,Math.min(150,(e.pageX||e.changedTouches[0].pageX)-s))/150),b=Math.floor(100*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-l)))/150);this.hsbValue=this.validateHSB({h:this.localHue,s:i,b}),this.selfUpdate=!0,this.updateColorHandle(),this.updateInput(),this.updateModel(e)},pickHue:function(e){var n=this.hueView.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);this.localHue=Math.floor(360*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-n)))/150),this.hsbValue=this.validateHSB({h:this.localHue,s:this.hsbValue.s,b:this.hsbValue.b}),this.selfUpdate=!0,this.updateColorSelector(),this.updateHue(),this.updateModel(e),this.updateInput()},updateModel:function(e){var n=this.d_value;switch(this.format){case"hex":n=this.HSBtoHEX(this.hsbValue);break;case"rgb":n=this.HSBtoRGB(this.hsbValue);break;case"hsb":n=this.hsbValue;break}this.writeValue(n,e),this.$emit("change",{event:e,value:n})},updateColorSelector:function(){if(this.colorSelector){var e=this.validateHSB({h:this.hsbValue.h,s:100,b:100});this.colorSelector.style.backgroundColor="#"+this.HSBtoHEX(e)}},updateColorHandle:function(){this.colorHandle&&(this.colorHandle.style.left=Math.floor(150*this.hsbValue.s/100)+"px",this.colorHandle.style.top=Math.floor(150*(100-this.hsbValue.b)/100)+"px")},updateHue:function(){this.hueHandle&&(this.hueHandle.style.top=Math.floor(150-150*this.hsbValue.h/360)+"px")},updateInput:function(){this.$refs.input&&(this.$refs.input.style.backgroundColor="#"+this.HSBtoHEX(this.hsbValue))},updateUI:function(){this.updateHue(),this.updateColorHandle(),this.updateInput(),this.updateColorSelector()},validateHSB:function(e){return{h:Math.min(360,Math.max(0,e.h)),s:Math.min(100,Math.max(0,e.s)),b:Math.min(100,Math.max(0,e.b))}},validateRGB:function(e){return{r:Math.min(255,Math.max(0,e.r)),g:Math.min(255,Math.max(0,e.g)),b:Math.min(255,Math.max(0,e.b))}},validateHEX:function(e){var n=6-e.length;if(n>0){for(var l=[],s=0;s<n;s++)l.push("0");l.push(e),e=l.join("")}return e},HEXtoRGB:function(e){var n=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:n>>16,g:(n&65280)>>8,b:n&255}},HEXtoHSB:function(e){return this.RGBtoHSB(this.HEXtoRGB(e))},RGBtoHSB:function(e){var n={h:0,s:0,b:0},l=Math.min(e.r,e.g,e.b),s=Math.max(e.r,e.g,e.b),i=s-l;return n.b=s,n.s=s!==0?255*i/s:0,n.s!==0?e.r===s?n.h=(e.g-e.b)/i:e.g===s?n.h=2+(e.b-e.r)/i:n.h=4+(e.r-e.g)/i:n.h=-1,n.h*=60,n.h<0&&(n.h+=360),n.s*=100/255,n.b*=100/255,n},HSBtoRGB:function(e){var n={r:null,g:null,b:null},l=Math.round(e.h),s=Math.round(e.s*255/100),i=Math.round(e.b*255/100);if(s===0)n={r:i,g:i,b:i};else{var b=i,p=(255-s)*i/255,m=(b-p)*(l%60)/60;l===360&&(l=0),l<60?(n.r=b,n.b=p,n.g=p+m):l<120?(n.g=b,n.b=p,n.r=b-m):l<180?(n.g=b,n.r=p,n.b=p+m):l<240?(n.b=b,n.r=p,n.g=b-m):l<300?(n.b=b,n.g=p,n.r=p+m):l<360?(n.r=b,n.g=p,n.b=b-m):(n.r=0,n.g=0,n.b=0)}return{r:Math.round(n.r),g:Math.round(n.g),b:Math.round(n.b)}},RGBtoHEX:function(e){var n=[e.r.toString(16),e.g.toString(16),e.b.toString(16)];for(var l in n)n[l].length===1&&(n[l]="0"+n[l]);return n.join("")},HSBtoHEX:function(e){return this.RGBtoHEX(this.HSBtoRGB(e))},toHSB:function(e){var n;if(e)switch(this.format){case"hex":n=this.HEXtoHSB(e);break;case"rgb":n=this.RGBtoHSB(e);break;case"hsb":n=e;break}else n=this.HEXtoHSB(this.defaultColor);return n.s===0||n.b===0?n.h=this.localHue:this.localHue=n.h,n},onOverlayEnter:function(e){this.updateUI(),this.alignOverlay(),this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&se.set("overlay",e,this.baseZIndex||this.$primevue.config.zIndex.overlay),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),this.$emit("show")},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.clearRefs(),this.$emit("hide")},onOverlayAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){this.appendTo==="self"?It(this.picker,this.$refs.input):tt(this.picker,this.$refs.input)},onInputClick:function(){this.disabled||(this.overlayVisible=!this.overlayVisible)},onInputKeydown:function(e){switch(e.code){case"Space":this.overlayVisible=!this.overlayVisible,e.preventDefault();break;case"Escape":case"Tab":this.overlayVisible=!1;break}},onInputBlur:function(e){var n,l;(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onColorMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onColorDragStart(e))},onColorDragStart:function(e){this.disabled||(this.colorDragging=!0,this.pickColor(e),this.$el.setAttribute("p-colorpicker-dragging","true"),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},onDrag:function(e){this.colorDragging&&(this.pickColor(e),e.preventDefault()),this.hueDragging&&(this.pickHue(e),e.preventDefault())},onDragEnd:function(){this.colorDragging=!1,this.hueDragging=!1,this.$el.setAttribute("p-colorpicker-dragging","false"),!this.isUnstyled&&Vn(this.$el,"p-colorpicker-dragging"),this.unbindDragListeners()},onHueMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onHueDragStart(e))},onHueDragStart:function(e){this.disabled||(this.hueDragging=!0,this.pickHue(e),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},isInputClicked:function(e){return this.$refs.input&&this.$refs.input.isSameNode(e.target)},bindDragListeners:function(){this.bindDocumentMouseMoveListener(),this.bindDocumentMouseUpListener()},unbindDragListeners:function(){this.unbindDocumentMouseMoveListener(),this.unbindDocumentMouseUpListener()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.picker&&!e.picker.contains(n.target)&&!e.isInputClicked(n)&&(e.overlayVisible=!1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new et(this.$refs.container,function(){e.overlayVisible&&(e.overlayVisible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Qe()&&(e.overlayVisible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindDocumentMouseMoveListener:function(){this.documentMouseMoveListener||(this.documentMouseMoveListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.documentMouseMoveListener))},unbindDocumentMouseMoveListener:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null)},bindDocumentMouseUpListener:function(){this.documentMouseUpListener||(this.documentMouseUpListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseUpListener:function(){this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},pickerRef:function(e){this.picker=e},colorSelectorRef:function(e){this.colorSelector=e},colorHandleRef:function(e){this.colorHandle=e},hueViewRef:function(e){this.hueView=e},hueHandleRef:function(e){this.hueHandle=e},clearRefs:function(){this.picker=null,this.colorSelector=null,this.colorHandle=null,this.hueView=null,this.hueHandle=null},onOverlayClick:function(e){at.emit("overlay-click",{originalEvent:e,target:this.$el})}},components:{Portal:je}};function Ae(t){"@babel/helpers - typeof";return Ae=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ae(t)}function Ut(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Rt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Ut(Object(n),!0).forEach(function(l){si(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Ut(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function si(t,e,n){return(e=ri(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ri(t){var e=ui(t,"string");return Ae(e)=="symbol"?e:e+""}function ui(t,e){if(Ae(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ae(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var di=["id","tabindex","disabled"];function ci(t,e,n,l,s,i){var b=N("Portal");return u(),d("div",f({ref:"container",class:t.cx("root")},t.ptmi("root")),[t.inline?w("",!0):(u(),d("input",f({key:0,ref:"input",id:t.inputId,type:"text",class:t.cx("preview"),readonly:"",tabindex:t.tabindex,disabled:t.disabled,onClick:e[0]||(e[0]=function(){return i.onInputClick&&i.onInputClick.apply(i,arguments)}),onKeydown:e[1]||(e[1]=function(){return i.onInputKeydown&&i.onInputKeydown.apply(i,arguments)}),onBlur:e[2]||(e[2]=function(){return i.onInputBlur&&i.onInputBlur.apply(i,arguments)})},t.ptm("preview")),null,16,di)),r(b,{appendTo:t.appendTo,disabled:t.inline},{default:v(function(){return[r(Ne,f({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[t.inline||s.overlayVisible?(u(),d("div",f({key:0,ref:i.pickerRef,class:[t.cx("panel"),t.panelClass,t.overlayClass],onClick:e[11]||(e[11]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)})},Rt(Rt({},t.ptm("panel")),t.ptm("overlay"))),[c("div",f({class:t.cx("content")},t.ptm("content")),[c("div",f({ref:i.colorSelectorRef,class:t.cx("colorSelector"),onMousedown:e[3]||(e[3]=function(p){return i.onColorMousedown(p)}),onTouchstart:e[4]||(e[4]=function(p){return i.onColorDragStart(p)}),onTouchmove:e[5]||(e[5]=function(p){return i.onDrag(p)}),onTouchend:e[6]||(e[6]=function(p){return i.onDragEnd()})},t.ptm("colorSelector")),[c("div",f({class:t.cx("colorBackground")},t.ptm("colorBackground")),[c("div",f({ref:i.colorHandleRef,class:t.cx("colorHandle")},t.ptm("colorHandle")),null,16)],16)],16),c("div",f({ref:i.hueViewRef,class:t.cx("hue"),onMousedown:e[7]||(e[7]=function(p){return i.onHueMousedown(p)}),onTouchstart:e[8]||(e[8]=function(p){return i.onHueDragStart(p)}),onTouchmove:e[9]||(e[9]=function(p){return i.onDrag(p)}),onTouchend:e[10]||(e[10]=function(p){return i.onDragEnd()})},t.ptm("hue")),[c("div",f({ref:i.hueHandleRef,class:t.cx("hueHandle")},t.ptm("hueHandle")),null,16)],16)],16)],16)):w("",!0)]}),_:1},16,["onEnter","onLeave","onAfterLeave"])]}),_:1},8,["appendTo","disabled"])],16)}ge.render=ci;var Mt={name:"ChevronDownIcon",extends:it};function pi(t){return bi(t)||mi(t)||fi(t)||hi()}function hi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function fi(t,e){if(t){if(typeof t=="string")return ft(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ft(t,e):void 0}}function mi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function bi(t){if(Array.isArray(t))return ft(t)}function ft(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function vi(t,e,n,l,s,i){return u(),d("svg",f({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),pi(e[0]||(e[0]=[c("path",{d:"M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z",fill:"currentColor"},null,-1)])),16)}Mt.render=vi;var zt={name:"SearchIcon",extends:it};function gi(t){return Oi(t)||wi(t)||ki(t)||yi()}function yi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ki(t,e){if(t){if(typeof t=="string")return mt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?mt(t,e):void 0}}function wi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Oi(t){if(Array.isArray(t))return mt(t)}function mt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function xi(t,e,n,l,s,i){return u(),d("svg",f({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),gi(e[0]||(e[0]=[c("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z",fill:"currentColor"},null,-1)])),16)}zt.render=xi;var un={name:"MinusIcon",extends:it};function Ii(t){return Ci(t)||Vi(t)||Li(t)||Si()}function Si(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Li(t,e){if(t){if(typeof t=="string")return bt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?bt(t,e):void 0}}function Vi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Ci(t){if(Array.isArray(t))return bt(t)}function bt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Mi(t,e,n,l,s,i){return u(),d("svg",f({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Ii(e[0]||(e[0]=[c("path",{d:"M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z",fill:"currentColor"},null,-1)])),16)}un.render=Mi;var zi=`
    .p-checkbox {
        position: relative;
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        width: dt('checkbox.width');
        height: dt('checkbox.height');
    }

    .p-checkbox-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border: 1px solid transparent;
        border-radius: dt('checkbox.border.radius');
    }

    .p-checkbox-box {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: dt('checkbox.border.radius');
        border: 1px solid dt('checkbox.border.color');
        background: dt('checkbox.background');
        width: dt('checkbox.width');
        height: dt('checkbox.height');
        transition:
            background dt('checkbox.transition.duration'),
            color dt('checkbox.transition.duration'),
            border-color dt('checkbox.transition.duration'),
            box-shadow dt('checkbox.transition.duration'),
            outline-color dt('checkbox.transition.duration');
        outline-color: transparent;
        box-shadow: dt('checkbox.shadow');
    }

    .p-checkbox-icon {
        transition-duration: dt('checkbox.transition.duration');
        color: dt('checkbox.icon.color');
        font-size: dt('checkbox.icon.size');
        width: dt('checkbox.icon.size');
        height: dt('checkbox.icon.size');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        border-color: dt('checkbox.hover.border.color');
    }

    .p-checkbox-checked .p-checkbox-box {
        border-color: dt('checkbox.checked.border.color');
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked .p-checkbox-icon {
        color: dt('checkbox.icon.checked.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
        border-color: dt('checkbox.checked.hover.border.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-icon {
        color: dt('checkbox.icon.checked.hover.color');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.focus.border.color');
        box-shadow: dt('checkbox.focus.ring.shadow');
        outline: dt('checkbox.focus.ring.width') dt('checkbox.focus.ring.style') dt('checkbox.focus.ring.color');
        outline-offset: dt('checkbox.focus.ring.offset');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.checked.focus.border.color');
    }

    .p-checkbox.p-invalid > .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }

    .p-checkbox.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.filled.background');
    }

    .p-checkbox-checked.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked.p-variant-filled:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
    }

    .p-checkbox.p-disabled {
        opacity: 1;
    }

    .p-checkbox.p-disabled .p-checkbox-box {
        background: dt('checkbox.disabled.background');
        border-color: dt('checkbox.checked.disabled.border.color');
    }

    .p-checkbox.p-disabled .p-checkbox-box .p-checkbox-icon {
        color: dt('checkbox.icon.disabled.color');
    }

    .p-checkbox-sm,
    .p-checkbox-sm .p-checkbox-box {
        width: dt('checkbox.sm.width');
        height: dt('checkbox.sm.height');
    }

    .p-checkbox-sm .p-checkbox-icon {
        font-size: dt('checkbox.icon.sm.size');
        width: dt('checkbox.icon.sm.size');
        height: dt('checkbox.icon.sm.size');
    }

    .p-checkbox-lg,
    .p-checkbox-lg .p-checkbox-box {
        width: dt('checkbox.lg.width');
        height: dt('checkbox.lg.height');
    }

    .p-checkbox-lg .p-checkbox-icon {
        font-size: dt('checkbox.icon.lg.size');
        width: dt('checkbox.icon.lg.size');
        height: dt('checkbox.icon.lg.size');
    }
`,$i={root:function(e){var n=e.instance,l=e.props;return["p-checkbox p-component",{"p-checkbox-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$pcCheckboxGroup?n.$pcCheckboxGroup.$invalid:n.$invalid,"p-variant-filled":n.$variant==="filled","p-checkbox-sm p-inputfield-sm":l.size==="small","p-checkbox-lg p-inputfield-lg":l.size==="large"}]},box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},Fi=me.extend({name:"checkbox",style:zi,classes:$i}),Ti={name:"BaseCheckbox",extends:lt,props:{value:null,binary:Boolean,indeterminate:{type:Boolean,default:!1},trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},required:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:Fi,provide:function(){return{$pcCheckbox:this,$parentInstance:this}}};function Ee(t){"@babel/helpers - typeof";return Ee=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ee(t)}function Pi(t,e,n){return(e=Ai(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ai(t){var e=Ei(t,"string");return Ee(e)=="symbol"?e:e+""}function Ei(t,e){if(Ee(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ee(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Di(t){return Ui(t)||Ki(t)||Hi(t)||Bi()}function Bi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Hi(t,e){if(t){if(typeof t=="string")return vt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?vt(t,e):void 0}}function Ki(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Ui(t){if(Array.isArray(t))return vt(t)}function vt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var dn={name:"Checkbox",extends:Ti,inheritAttrs:!1,emits:["change","focus","blur","update:indeterminate"],inject:{$pcCheckboxGroup:{default:void 0}},data:function(){return{d_indeterminate:this.indeterminate}},watch:{indeterminate:function(e){this.d_indeterminate=e,this.updateIndeterminate()}},mounted:function(){this.updateIndeterminate()},updated:function(){this.updateIndeterminate()},methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,indeterminate:this.d_indeterminate,disabled:this.disabled}})},onChange:function(e){var n=this;if(!this.disabled&&!this.readonly){var l=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value,s;this.binary?s=this.d_indeterminate?this.trueValue:this.checked?this.falseValue:this.trueValue:this.checked||this.d_indeterminate?s=l.filter(function(i){return!Le(i,n.value)}):s=l?[].concat(Di(l),[this.value]):[this.value],this.d_indeterminate&&(this.d_indeterminate=!1,this.$emit("update:indeterminate",this.d_indeterminate)),this.$pcCheckboxGroup?this.$pcCheckboxGroup.writeValue(s,e):this.writeValue(s,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)},updateIndeterminate:function(){this.$refs.input&&(this.$refs.input.indeterminate=this.d_indeterminate)}},computed:{groupName:function(){return this.$pcCheckboxGroup?this.$pcCheckboxGroup.groupName:this.$formName},checked:function(){var e=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value;return this.d_indeterminate?!1:this.binary?e===this.trueValue:Cn(this.value,e)},dataP:function(){return re(Pi({invalid:this.$invalid,checked:this.checked,disabled:this.disabled,filled:this.$variant==="filled"},this.size,this.size))}},components:{CheckIcon:St,MinusIcon:un}},Ri=["data-p-checked","data-p-indeterminate","data-p-disabled","data-p"],ji=["id","value","name","checked","tabindex","disabled","readonly","required","aria-labelledby","aria-label","aria-invalid"],Gi=["data-p"];function _i(t,e,n,l,s,i){var b=N("CheckIcon"),p=N("MinusIcon");return u(),d("div",f({class:t.cx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-indeterminate":s.d_indeterminate||void 0,"data-p-disabled":t.disabled,"data-p":i.dataP}),[c("input",f({ref:"input",id:t.inputId,type:"checkbox",class:[t.cx("input"),t.inputClass],style:t.inputStyle,value:t.value,name:i.groupName,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,required:t.required,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,ji),c("div",f({class:t.cx("box")},i.getPTOptions("box"),{"data-p":i.dataP}),[$(t.$slots,"icon",{checked:i.checked,indeterminate:s.d_indeterminate,class:G(t.cx("icon")),dataP:i.dataP},function(){return[i.checked?(u(),F(b,f({key:0,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):s.d_indeterminate?(u(),F(p,f({key:1,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):w("",!0)]})],16,Gi)],16,Ri)}dn.render=_i;var Ni=`
    .p-chip {
        display: inline-flex;
        align-items: center;
        background: dt('chip.background');
        color: dt('chip.color');
        border-radius: dt('chip.border.radius');
        padding-block: dt('chip.padding.y');
        padding-inline: dt('chip.padding.x');
        gap: dt('chip.gap');
    }

    .p-chip-icon {
        color: dt('chip.icon.color');
        font-size: dt('chip.icon.size');
        width: dt('chip.icon.size');
        height: dt('chip.icon.size');
    }

    .p-chip-image {
        border-radius: 50%;
        width: dt('chip.image.width');
        height: dt('chip.image.height');
        margin-inline-start: calc(-1 * dt('chip.padding.y'));
    }

    .p-chip:has(.p-chip-remove-icon) {
        padding-inline-end: dt('chip.padding.y');
    }

    .p-chip:has(.p-chip-image) {
        padding-block-start: calc(dt('chip.padding.y') / 2);
        padding-block-end: calc(dt('chip.padding.y') / 2);
    }

    .p-chip-remove-icon {
        cursor: pointer;
        font-size: dt('chip.remove.icon.size');
        width: dt('chip.remove.icon.size');
        height: dt('chip.remove.icon.size');
        color: dt('chip.remove.icon.color');
        border-radius: 50%;
        transition:
            outline-color dt('chip.transition.duration'),
            box-shadow dt('chip.transition.duration');
        outline-color: transparent;
    }

    .p-chip-remove-icon:focus-visible {
        box-shadow: dt('chip.remove.icon.focus.ring.shadow');
        outline: dt('chip.remove.icon.focus.ring.width') dt('chip.remove.icon.focus.ring.style') dt('chip.remove.icon.focus.ring.color');
        outline-offset: dt('chip.remove.icon.focus.ring.offset');
    }
`,qi={root:"p-chip p-component",image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},Wi=me.extend({name:"chip",style:Ni,classes:qi}),Zi={name:"BaseChip",extends:xe,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:Wi,provide:function(){return{$pcChip:this,$parentInstance:this}}},cn={name:"Chip",extends:Zi,inheritAttrs:!1,emits:["remove"],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)},close:function(e){this.visible=!1,this.$emit("remove",e)}},computed:{dataP:function(){return re({removable:this.removable})}},components:{TimesCircleIcon:Mn}},Xi=["aria-label","data-p"],Yi=["src"];function Ji(t,e,n,l,s,i){return s.visible?(u(),d("div",f({key:0,class:t.cx("root"),"aria-label":t.label},t.ptmi("root"),{"data-p":i.dataP}),[$(t.$slots,"default",{},function(){return[t.image?(u(),d("img",f({key:0,src:t.image},t.ptm("image"),{class:t.cx("image")}),null,16,Yi)):t.$slots.icon?(u(),F(de(t.$slots.icon),f({key:1,class:t.cx("icon")},t.ptm("icon")),null,16,["class"])):t.icon?(u(),d("span",f({key:2,class:[t.cx("icon"),t.icon]},t.ptm("icon")),null,16)):w("",!0),t.label!==null?(u(),d("div",f({key:3,class:t.cx("label")},t.ptm("label")),C(t.label),17)):w("",!0)]}),t.removable?$(t.$slots,"removeicon",{key:0,removeCallback:i.close,keydownCallback:i.onKeydown},function(){return[(u(),F(de(t.removeIcon?"span":"TimesCircleIcon"),f({class:[t.cx("removeIcon"),t.removeIcon],onClick:i.close,onKeydown:i.onKeydown},t.ptm("removeIcon")),null,16,["class","onClick","onKeydown"]))]}):w("",!0)],16,Xi)):w("",!0)}cn.render=Ji;var Qi=`
    .p-iconfield {
        position: relative;
        display: block;
    }

    .p-inputicon {
        position: absolute;
        top: 50%;
        margin-top: calc(-1 * (dt('icon.size') / 2));
        color: dt('iconfield.icon.color');
        line-height: 1;
        z-index: 1;
    }

    .p-iconfield .p-inputicon:first-child {
        inset-inline-start: dt('form.field.padding.x');
    }

    .p-iconfield .p-inputicon:last-child {
        inset-inline-end: dt('form.field.padding.x');
    }

    .p-iconfield .p-inputtext:not(:first-child),
    .p-iconfield .p-inputwrapper:not(:first-child) .p-inputtext {
        padding-inline-start: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-iconfield .p-inputtext:not(:last-child) {
        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-iconfield:has(.p-inputfield-sm) .p-inputicon {
        font-size: dt('form.field.sm.font.size');
        width: dt('form.field.sm.font.size');
        height: dt('form.field.sm.font.size');
        margin-top: calc(-1 * (dt('form.field.sm.font.size') / 2));
    }

    .p-iconfield:has(.p-inputfield-lg) .p-inputicon {
        font-size: dt('form.field.lg.font.size');
        width: dt('form.field.lg.font.size');
        height: dt('form.field.lg.font.size');
        margin-top: calc(-1 * (dt('form.field.lg.font.size') / 2));
    }
`,el={root:"p-iconfield"},tl=me.extend({name:"iconfield",style:Qi,classes:el}),nl={name:"BaseIconField",extends:xe,style:tl,provide:function(){return{$pcIconField:this,$parentInstance:this}}},$t={name:"IconField",extends:nl,inheritAttrs:!1};function il(t,e,n,l,s,i){return u(),d("div",f({class:t.cx("root")},t.ptmi("root")),[$(t.$slots,"default")],16)}$t.render=il;var ll={root:"p-inputicon"},ol=me.extend({name:"inputicon",classes:ll}),al={name:"BaseInputIcon",extends:xe,style:ol,props:{class:null},provide:function(){return{$pcInputIcon:this,$parentInstance:this}}},Ft={name:"InputIcon",extends:al,inheritAttrs:!1,computed:{containerClass:function(){return[this.cx("root"),this.class]}}};function sl(t,e,n,l,s,i){return u(),d("span",f({class:i.containerClass},t.ptmi("root"),{"aria-hidden":"true"}),[$(t.$slots,"default")],16)}Ft.render=sl;var rl=`
    .p-virtualscroller-loader {
        background: dt('virtualscroller.loader.mask.background');
        color: dt('virtualscroller.loader.mask.color');
    }

    .p-virtualscroller-loading-icon {
        font-size: dt('virtualscroller.loader.icon.size');
        width: dt('virtualscroller.loader.icon.size');
        height: dt('virtualscroller.loader.icon.size');
    }
`,ul=`
.p-virtualscroller {
    position: relative;
    overflow: auto;
    contain: strict;
    transform: translateZ(0);
    will-change: scroll-position;
    outline: 0 none;
}

.p-virtualscroller-content {
    position: absolute;
    top: 0;
    left: 0;
    min-height: 100%;
    min-width: 100%;
    will-change: transform;
}

.p-virtualscroller-spacer {
    position: absolute;
    top: 0;
    left: 0;
    height: 1px;
    width: 1px;
    transform-origin: 0 0;
    pointer-events: none;
}

.p-virtualscroller-loader {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.p-virtualscroller-loader-mask {
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-virtualscroller-horizontal > .p-virtualscroller-content {
    display: flex;
}

.p-virtualscroller-inline .p-virtualscroller-content {
    position: static;
}

.p-virtualscroller .p-virtualscroller-loading {
    transform: none !important;
    min-height: 0;
    position: sticky;
    inset-block-start: 0;
    inset-inline-start: 0;
}
`,jt=me.extend({name:"virtualscroller",css:ul,style:rl}),dl={name:"BaseVirtualScroller",extends:xe,props:{id:{type:String,default:null},style:null,class:null,items:{type:Array,default:null},itemSize:{type:[Number,Array],default:0},scrollHeight:null,scrollWidth:null,orientation:{type:String,default:"vertical"},numToleratedItems:{type:Number,default:null},delay:{type:Number,default:0},resizeDelay:{type:Number,default:10},lazy:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},loaderDisabled:{type:Boolean,default:!1},columns:{type:Array,default:null},loading:{type:Boolean,default:!1},showSpacer:{type:Boolean,default:!0},showLoader:{type:Boolean,default:!1},tabindex:{type:Number,default:0},inline:{type:Boolean,default:!1},step:{type:Number,default:0},appendOnly:{type:Boolean,default:!1},autoSize:{type:Boolean,default:!1}},style:jt,provide:function(){return{$pcVirtualScroller:this,$parentInstance:this}},beforeMount:function(){var e;jt.loadCSS({nonce:(e=this.$primevueConfig)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce})}};function De(t){"@babel/helpers - typeof";return De=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},De(t)}function Gt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function $e(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Gt(Object(n),!0).forEach(function(l){pn(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Gt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function pn(t,e,n){return(e=cl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function cl(t){var e=pl(t,"string");return De(e)=="symbol"?e:e+""}function pl(t,e){if(De(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(De(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Tt={name:"VirtualScroller",extends:dl,inheritAttrs:!1,emits:["update:numToleratedItems","scroll","scroll-index-change","lazy-load"],data:function(){var e=this.isBoth();return{first:e?{rows:0,cols:0}:0,last:e?{rows:0,cols:0}:0,page:e?{rows:0,cols:0}:0,numItemsInViewport:e?{rows:0,cols:0}:0,lastScrollPos:e?{top:0,left:0}:0,d_numToleratedItems:this.numToleratedItems,d_loading:this.loading,loaderArr:[],spacerStyle:{},contentStyle:{}}},element:null,content:null,lastScrollPos:null,scrollTimeout:null,resizeTimeout:null,defaultWidth:0,defaultHeight:0,defaultContentWidth:0,defaultContentHeight:0,isRangeChanged:!1,lazyLoadState:{},resizeListener:null,resizeObserver:null,initialized:!1,watch:{numToleratedItems:function(e){this.d_numToleratedItems=e},loading:function(e,n){this.lazy&&e!==n&&e!==this.d_loading&&(this.d_loading=e)},items:{handler:function(e,n){(!n||n.length!==(e||[]).length)&&(this.init(),this.calculateAutoSize())},deep:!0},itemSize:function(){this.init(),this.calculateAutoSize()},orientation:function(){this.lastScrollPos=this.isBoth()?{top:0,left:0}:0},scrollHeight:function(){this.init(),this.calculateAutoSize()},scrollWidth:function(){this.init(),this.calculateAutoSize()}},mounted:function(){this.viewInit(),this.lastScrollPos=this.isBoth()?{top:0,left:0}:0,this.lazyLoadState=this.lazyLoadState||{}},updated:function(){!this.initialized&&this.viewInit()},unmounted:function(){this.unbindResizeListener(),this.initialized=!1},methods:{viewInit:function(){Ye(this.element)&&(this.setContentEl(this.content),this.init(),this.calculateAutoSize(),this.defaultWidth=Me(this.element),this.defaultHeight=ze(this.element),this.defaultContentWidth=Me(this.content),this.defaultContentHeight=ze(this.content),this.initialized=!0),this.element&&this.bindResizeListener()},init:function(){this.disabled||(this.setSize(),this.calculateOptions(),this.setSpacerSize())},isVertical:function(){return this.orientation==="vertical"},isHorizontal:function(){return this.orientation==="horizontal"},isBoth:function(){return this.orientation==="both"},scrollTo:function(e){this.element&&this.element.scrollTo(e)},scrollToIndex:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:"auto",s=this.isBoth(),i=this.isHorizontal(),b=s?e.every(function(L){return L>-1}):e>-1;if(b){var p=this.first,m=this.element,y=m.scrollTop,O=y===void 0?0:y,I=m.scrollLeft,A=I===void 0?0:I,U=this.calculateNumItems(),E=U.numToleratedItems,P=this.getContentPosition(),x=this.itemSize,K=function(){var T=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Y=arguments.length>1?arguments[1]:void 0;return T<=Y?0:T},M=function(T,Y,ne){return T*Y+ne},B=function(){var T=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Y=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.scrollTo({left:T,top:Y,behavior:l})},z=s?{rows:0,cols:0}:0,ae=!1,_=!1;s?(z={rows:K(e[0],E[0]),cols:K(e[1],E[1])},B(M(z.cols,x[1],P.left),M(z.rows,x[0],P.top)),_=this.lastScrollPos.top!==O||this.lastScrollPos.left!==A,ae=z.rows!==p.rows||z.cols!==p.cols):(z=K(e,E),i?B(M(z,x,P.left),O):B(A,M(z,x,P.top)),_=this.lastScrollPos!==(i?A:O),ae=z!==p),this.isRangeChanged=ae,_&&(this.first=z)}},scrollInView:function(e,n){var l=this,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"auto";if(n){var i=this.isBoth(),b=this.isHorizontal(),p=i?e.every(function(x){return x>-1}):e>-1;if(p){var m=this.getRenderedRange(),y=m.first,O=m.viewport,I=function(){var K=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,M=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return l.scrollTo({left:K,top:M,behavior:s})},A=n==="to-start",U=n==="to-end";if(A){if(i)O.first.rows-y.rows>e[0]?I(O.first.cols*this.itemSize[1],(O.first.rows-1)*this.itemSize[0]):O.first.cols-y.cols>e[1]&&I((O.first.cols-1)*this.itemSize[1],O.first.rows*this.itemSize[0]);else if(O.first-y>e){var E=(O.first-1)*this.itemSize;b?I(E,0):I(0,E)}}else if(U){if(i)O.last.rows-y.rows<=e[0]+1?I(O.first.cols*this.itemSize[1],(O.first.rows+1)*this.itemSize[0]):O.last.cols-y.cols<=e[1]+1&&I((O.first.cols+1)*this.itemSize[1],O.first.rows*this.itemSize[0]);else if(O.last-y<=e+1){var P=(O.first+1)*this.itemSize;b?I(P,0):I(0,P)}}}}else this.scrollToIndex(e,s)},getRenderedRange:function(){var e=function(I,A){return Math.floor(I/(A||I))},n=this.first,l=0;if(this.element){var s=this.isBoth(),i=this.isHorizontal(),b=this.element,p=b.scrollTop,m=b.scrollLeft;if(s)n={rows:e(p,this.itemSize[0]),cols:e(m,this.itemSize[1])},l={rows:n.rows+this.numItemsInViewport.rows,cols:n.cols+this.numItemsInViewport.cols};else{var y=i?m:p;n=e(y,this.itemSize),l=n+this.numItemsInViewport}}return{first:this.first,last:this.last,viewport:{first:n,last:l}}},calculateNumItems:function(){var e=this.isBoth(),n=this.isHorizontal(),l=this.itemSize,s=this.getContentPosition(),i=this.element?this.element.offsetWidth-s.left:0,b=this.element?this.element.offsetHeight-s.top:0,p=function(A,U){return Math.ceil(A/(U||A))},m=function(A){return Math.ceil(A/2)},y=e?{rows:p(b,l[0]),cols:p(i,l[1])}:p(n?i:b,l),O=this.d_numToleratedItems||(e?[m(y.rows),m(y.cols)]:m(y));return{numItemsInViewport:y,numToleratedItems:O}},calculateOptions:function(){var e=this,n=this.isBoth(),l=this.first,s=this.calculateNumItems(),i=s.numItemsInViewport,b=s.numToleratedItems,p=function(O,I,A){var U=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;return e.getLast(O+I+(O<A?2:3)*A,U)},m=n?{rows:p(l.rows,i.rows,b[0]),cols:p(l.cols,i.cols,b[1],!0)}:p(l,i,b);this.last=m,this.numItemsInViewport=i,this.d_numToleratedItems=b,this.$emit("update:numToleratedItems",this.d_numToleratedItems),this.showLoader&&(this.loaderArr=n?Array.from({length:i.rows}).map(function(){return Array.from({length:i.cols})}):Array.from({length:i})),this.lazy&&Promise.resolve().then(function(){var y;e.lazyLoadState={first:e.step?n?{rows:0,cols:l.cols}:0:l,last:Math.min(e.step?e.step:m,((y=e.items)===null||y===void 0?void 0:y.length)||0)},e.$emit("lazy-load",e.lazyLoadState)})},calculateAutoSize:function(){var e=this;this.autoSize&&!this.d_loading&&Promise.resolve().then(function(){if(e.content){var n=e.isBoth(),l=e.isHorizontal(),s=e.isVertical();e.content.style.minHeight=e.content.style.minWidth="auto",e.content.style.position="relative",e.element.style.contain="none";var i=[Me(e.element),ze(e.element)],b=i[0],p=i[1];(n||l)&&(e.element.style.width=b<e.defaultWidth?b+"px":e.scrollWidth||e.defaultWidth+"px"),(n||s)&&(e.element.style.height=p<e.defaultHeight?p+"px":e.scrollHeight||e.defaultHeight+"px"),e.content.style.minHeight=e.content.style.minWidth="",e.content.style.position="",e.element.style.contain=""}})},getLast:function(){var e,n,l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,s=arguments.length>1?arguments[1]:void 0;return this.items?Math.min(s?((e=this.columns||this.items[0])===null||e===void 0?void 0:e.length)||0:((n=this.items)===null||n===void 0?void 0:n.length)||0,l):0},getContentPosition:function(){if(this.content){var e=getComputedStyle(this.content),n=parseFloat(e.paddingLeft)+Math.max(parseFloat(e.left)||0,0),l=parseFloat(e.paddingRight)+Math.max(parseFloat(e.right)||0,0),s=parseFloat(e.paddingTop)+Math.max(parseFloat(e.top)||0,0),i=parseFloat(e.paddingBottom)+Math.max(parseFloat(e.bottom)||0,0);return{left:n,right:l,top:s,bottom:i,x:n+l,y:s+i}}return{left:0,right:0,top:0,bottom:0,x:0,y:0}},setSize:function(){var e=this;if(this.element){var n=this.isBoth(),l=this.isHorizontal(),s=this.element.parentElement,i=this.scrollWidth||"".concat(this.element.offsetWidth||s.offsetWidth,"px"),b=this.scrollHeight||"".concat(this.element.offsetHeight||s.offsetHeight,"px"),p=function(y,O){return e.element.style[y]=O};n||l?(p("height",b),p("width",i)):p("height",b)}},setSpacerSize:function(){var e=this,n=this.items;if(n){var l=this.isBoth(),s=this.isHorizontal(),i=this.getContentPosition(),b=function(m,y,O){var I=arguments.length>3&&arguments[3]!==void 0?arguments[3]:0;return e.spacerStyle=$e($e({},e.spacerStyle),pn({},"".concat(m),(y||[]).length*O+I+"px"))};l?(b("height",n,this.itemSize[0],i.y),b("width",this.columns||n[1],this.itemSize[1],i.x)):s?b("width",this.columns||n,this.itemSize,i.x):b("height",n,this.itemSize,i.y)}},setContentPosition:function(e){var n=this;if(this.content&&!this.appendOnly){var l=this.isBoth(),s=this.isHorizontal(),i=e?e.first:this.first,b=function(O,I){return O*I},p=function(){var O=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,I=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.contentStyle=$e($e({},n.contentStyle),{transform:"translate3d(".concat(O,"px, ").concat(I,"px, 0)")})};if(l)p(b(i.cols,this.itemSize[1]),b(i.rows,this.itemSize[0]));else{var m=b(i,this.itemSize);s?p(m,0):p(0,m)}}},onScrollPositionChange:function(e){var n=this,l=e.target,s=this.isBoth(),i=this.isHorizontal(),b=this.getContentPosition(),p=function(Z,H){return Z?Z>H?Z-H:Z:0},m=function(Z,H){return Math.floor(Z/(H||Z))},y=function(Z,H,D,V,te,he){return Z<=te?te:he?D-V-te:H+te-1},O=function(Z,H,D,V,te,he,be,Ie){if(Z<=he)return 0;var Ce=Math.max(0,be?Z<H?D:Z-he:Z>H?D:Z-2*he),Se=n.getLast(Ce,Ie);return Ce>Se?Se-te:Ce},I=function(Z,H,D,V,te,he){var be=H+V+2*te;return Z>=te&&(be+=te+1),n.getLast(be,he)},A=p(l.scrollTop,b.top),U=p(l.scrollLeft,b.left),E=s?{rows:0,cols:0}:0,P=this.last,x=!1,K=this.lastScrollPos;if(s){var M=this.lastScrollPos.top<=A,B=this.lastScrollPos.left<=U;if(!this.appendOnly||this.appendOnly&&(M||B)){var z={rows:m(A,this.itemSize[0]),cols:m(U,this.itemSize[1])},ae={rows:y(z.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],M),cols:y(z.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],B)};E={rows:O(z.rows,ae.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],M),cols:O(z.cols,ae.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],B,!0)},P={rows:I(z.rows,E.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0]),cols:I(z.cols,E.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],!0)},x=E.rows!==this.first.rows||P.rows!==this.last.rows||E.cols!==this.first.cols||P.cols!==this.last.cols||this.isRangeChanged,K={top:A,left:U}}}else{var _=i?U:A,L=this.lastScrollPos<=_;if(!this.appendOnly||this.appendOnly&&L){var T=m(_,this.itemSize),Y=y(T,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L);E=O(T,Y,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L),P=I(T,E,this.last,this.numItemsInViewport,this.d_numToleratedItems),x=E!==this.first||P!==this.last||this.isRangeChanged,K=_}}return{first:E,last:P,isRangeChanged:x,scrollPos:K}},onScrollChange:function(e){var n=this.onScrollPositionChange(e),l=n.first,s=n.last,i=n.isRangeChanged,b=n.scrollPos;if(i){var p={first:l,last:s};if(this.setContentPosition(p),this.first=l,this.last=s,this.lastScrollPos=b,this.$emit("scroll-index-change",p),this.lazy&&this.isPageChanged(l)){var m,y,O={first:this.step?Math.min(this.getPageByFirst(l)*this.step,(((m=this.items)===null||m===void 0?void 0:m.length)||0)-this.step):l,last:Math.min(this.step?(this.getPageByFirst(l)+1)*this.step:s,((y=this.items)===null||y===void 0?void 0:y.length)||0)},I=this.lazyLoadState.first!==O.first||this.lazyLoadState.last!==O.last;I&&this.$emit("lazy-load",O),this.lazyLoadState=O}}},onScroll:function(e){var n=this;if(this.$emit("scroll",e),this.delay){if(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.isPageChanged()){if(!this.d_loading&&this.showLoader){var l=this.onScrollPositionChange(e),s=l.isRangeChanged,i=s||(this.step?this.isPageChanged():!1);i&&(this.d_loading=!0)}this.scrollTimeout=setTimeout(function(){n.onScrollChange(e),n.d_loading&&n.showLoader&&(!n.lazy||n.loading===void 0)&&(n.d_loading=!1,n.page=n.getPageByFirst())},this.delay)}}else this.onScrollChange(e)},onResize:function(){var e=this;this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){if(Ye(e.element)){var n=e.isBoth(),l=e.isVertical(),s=e.isHorizontal(),i=[Me(e.element),ze(e.element)],b=i[0],p=i[1],m=b!==e.defaultWidth,y=p!==e.defaultHeight,O=n?m||y:s?m:l?y:!1;O&&(e.d_numToleratedItems=e.numToleratedItems,e.defaultWidth=b,e.defaultHeight=p,e.defaultContentWidth=Me(e.content),e.defaultContentHeight=ze(e.content),e.init())}},this.resizeDelay)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=this.onResize.bind(this),window.addEventListener("resize",this.resizeListener),window.addEventListener("orientationchange",this.resizeListener),this.resizeObserver=new ResizeObserver(function(){e.onResize()}),this.resizeObserver.observe(this.element))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),window.removeEventListener("orientationchange",this.resizeListener),this.resizeListener=null),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)},getOptions:function(e){var n=(this.items||[]).length,l=this.isBoth()?this.first.rows+e:this.first+e;return{index:l,count:n,first:l===0,last:l===n-1,even:l%2===0,odd:l%2!==0}},getLoaderOptions:function(e,n){var l=this.loaderArr.length;return $e({index:e,count:l,first:e===0,last:e===l-1,even:e%2===0,odd:e%2!==0},n)},getPageByFirst:function(e){return Math.floor(((e??this.first)+this.d_numToleratedItems*4)/(this.step||1))},isPageChanged:function(e){return this.step&&!this.lazy?this.page!==this.getPageByFirst(e??this.first):!0},setContentEl:function(e){this.content=e||this.content||Te(this.element,'[data-pc-section="content"]')},elementRef:function(e){this.element=e},contentRef:function(e){this.content=e}},computed:{containerClass:function(){return["p-virtualscroller",this.class,{"p-virtualscroller-inline":this.inline,"p-virtualscroller-both p-both-scroll":this.isBoth(),"p-virtualscroller-horizontal p-horizontal-scroll":this.isHorizontal()}]},contentClass:function(){return["p-virtualscroller-content",{"p-virtualscroller-loading":this.d_loading}]},loaderClass:function(){return["p-virtualscroller-loader",{"p-virtualscroller-loader-mask":!this.$slots.loader}]},loadedItems:function(){var e=this;return this.items&&!this.d_loading?this.isBoth()?this.items.slice(this.appendOnly?0:this.first.rows,this.last.rows).map(function(n){return e.columns?n:n.slice(e.appendOnly?0:e.first.cols,e.last.cols)}):this.isHorizontal()&&this.columns?this.items:this.items.slice(this.appendOnly?0:this.first,this.last):[]},loadedRows:function(){return this.d_loading?this.loaderDisabled?this.loaderArr:[]:this.loadedItems},loadedColumns:function(){if(this.columns){var e=this.isBoth(),n=this.isHorizontal();if(e||n)return this.d_loading&&this.loaderDisabled?e?this.loaderArr[0]:this.loaderArr:this.columns.slice(e?this.first.cols:this.first,e?this.last.cols:this.last)}return this.columns}},components:{SpinnerIcon:Lt}},hl=["tabindex"];function fl(t,e,n,l,s,i){var b=N("SpinnerIcon");return t.disabled?(u(),d(S,{key:1},[$(t.$slots,"default"),$(t.$slots,"content",{items:t.items,rows:t.items,columns:i.loadedColumns})],64)):(u(),d("div",f({key:0,ref:i.elementRef,class:i.containerClass,tabindex:t.tabindex,style:t.style,onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)})},t.ptmi("root")),[$(t.$slots,"content",{styleClass:i.contentClass,items:i.loadedItems,getItemOptions:i.getOptions,loading:s.d_loading,getLoaderOptions:i.getLoaderOptions,itemSize:t.itemSize,rows:i.loadedRows,columns:i.loadedColumns,contentRef:i.contentRef,spacerStyle:s.spacerStyle,contentStyle:s.contentStyle,vertical:i.isVertical(),horizontal:i.isHorizontal(),both:i.isBoth()},function(){return[c("div",f({ref:i.contentRef,class:i.contentClass,style:s.contentStyle},t.ptm("content")),[(u(!0),d(S,null,le(i.loadedItems,function(p,m){return $(t.$slots,"item",{key:m,item:p,options:i.getOptions(m)})}),128))],16)]}),t.showSpacer?(u(),d("div",f({key:0,class:"p-virtualscroller-spacer",style:s.spacerStyle},t.ptm("spacer")),null,16)):w("",!0),!t.loaderDisabled&&t.showLoader&&s.d_loading?(u(),d("div",f({key:1,class:i.loaderClass},t.ptm("loader")),[t.$slots&&t.$slots.loader?(u(!0),d(S,{key:0},le(s.loaderArr,function(p,m){return $(t.$slots,"loader",{key:m,options:i.getLoaderOptions(m,i.isBoth()&&{numCols:t.d_numItemsInViewport.cols})})}),128)):w("",!0),$(t.$slots,"loadingicon",{},function(){return[r(b,f({spin:"",class:"p-virtualscroller-loading-icon"},t.ptm("loadingIcon")),null,16)]})],16)):w("",!0)],16,hl))}Tt.render=fl;var ml=`
    .p-multiselect {
        display: inline-flex;
        cursor: pointer;
        position: relative;
        user-select: none;
        background: dt('multiselect.background');
        border: 1px solid dt('multiselect.border.color');
        transition:
            background dt('multiselect.transition.duration'),
            color dt('multiselect.transition.duration'),
            border-color dt('multiselect.transition.duration'),
            outline-color dt('multiselect.transition.duration'),
            box-shadow dt('multiselect.transition.duration');
        border-radius: dt('multiselect.border.radius');
        outline-color: transparent;
        box-shadow: dt('multiselect.shadow');
    }

    .p-multiselect:not(.p-disabled):hover {
        border-color: dt('multiselect.hover.border.color');
    }

    .p-multiselect:not(.p-disabled).p-focus {
        border-color: dt('multiselect.focus.border.color');
        box-shadow: dt('multiselect.focus.ring.shadow');
        outline: dt('multiselect.focus.ring.width') dt('multiselect.focus.ring.style') dt('multiselect.focus.ring.color');
        outline-offset: dt('multiselect.focus.ring.offset');
    }

    .p-multiselect.p-variant-filled {
        background: dt('multiselect.filled.background');
    }

    .p-multiselect.p-variant-filled:not(.p-disabled):hover {
        background: dt('multiselect.filled.hover.background');
    }

    .p-multiselect.p-variant-filled.p-focus {
        background: dt('multiselect.filled.focus.background');
    }

    .p-multiselect.p-invalid {
        border-color: dt('multiselect.invalid.border.color');
    }

    .p-multiselect.p-disabled {
        opacity: 1;
        background: dt('multiselect.disabled.background');
    }

    .p-multiselect-dropdown {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        color: dt('multiselect.dropdown.color');
        width: dt('multiselect.dropdown.width');
        border-start-end-radius: dt('multiselect.border.radius');
        border-end-end-radius: dt('multiselect.border.radius');
    }

    .p-multiselect-clear-icon {
        align-self: center;
        color: dt('multiselect.clear.icon.color');
        inset-inline-end: dt('multiselect.dropdown.width');
    }

    .p-multiselect-label-container {
        overflow: hidden;
        flex: 1 1 auto;
        cursor: pointer;
    }

    .p-multiselect-label {
        white-space: nowrap;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: dt('multiselect.padding.y') dt('multiselect.padding.x');
        color: dt('multiselect.color');
    }

    .p-multiselect-display-chip .p-multiselect-label {
        display: flex;
        align-items: center;
        gap: calc(dt('multiselect.padding.y') / 2);
    }

    .p-multiselect-label.p-placeholder {
        color: dt('multiselect.placeholder.color');
    }

    .p-multiselect.p-invalid .p-multiselect-label.p-placeholder {
        color: dt('multiselect.invalid.placeholder.color');
    }

    .p-multiselect.p-disabled .p-multiselect-label {
        color: dt('multiselect.disabled.color');
    }

    .p-multiselect-label-empty {
        overflow: hidden;
        visibility: hidden;
    }

    .p-multiselect-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('multiselect.overlay.background');
        color: dt('multiselect.overlay.color');
        border: 1px solid dt('multiselect.overlay.border.color');
        border-radius: dt('multiselect.overlay.border.radius');
        box-shadow: dt('multiselect.overlay.shadow');
        min-width: 100%;
    }

    .p-multiselect-header {
        display: flex;
        align-items: center;
        padding: dt('multiselect.list.header.padding');
    }

    .p-multiselect-header .p-checkbox {
        margin-inline-end: dt('multiselect.option.gap');
    }

    .p-multiselect-filter-container {
        flex: 1 1 auto;
    }

    .p-multiselect-filter {
        width: 100%;
    }

    .p-multiselect-list-container {
        overflow: auto;
    }

    .p-multiselect-list {
        margin: 0;
        padding: 0;
        list-style-type: none;
        padding: dt('multiselect.list.padding');
        display: flex;
        flex-direction: column;
        gap: dt('multiselect.list.gap');
    }

    .p-multiselect-option {
        cursor: pointer;
        font-weight: normal;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: dt('multiselect.option.gap');
        padding: dt('multiselect.option.padding');
        border: 0 none;
        color: dt('multiselect.option.color');
        background: transparent;
        transition:
            background dt('multiselect.transition.duration'),
            color dt('multiselect.transition.duration'),
            border-color dt('multiselect.transition.duration'),
            box-shadow dt('multiselect.transition.duration'),
            outline-color dt('multiselect.transition.duration');
        border-radius: dt('multiselect.option.border.radius');
    }

    .p-multiselect-option:not(.p-multiselect-option-selected):not(.p-disabled).p-focus {
        background: dt('multiselect.option.focus.background');
        color: dt('multiselect.option.focus.color');
    }

    .p-multiselect-option:not(.p-multiselect-option-selected):not(.p-disabled):hover {
        background: dt('multiselect.option.focus.background');
        color: dt('multiselect.option.focus.color');
    }

    .p-multiselect-option.p-multiselect-option-selected {
        background: dt('multiselect.option.selected.background');
        color: dt('multiselect.option.selected.color');
    }

    .p-multiselect-option.p-multiselect-option-selected.p-focus {
        background: dt('multiselect.option.selected.focus.background');
        color: dt('multiselect.option.selected.focus.color');
    }

    .p-multiselect-option-group {
        cursor: auto;
        margin: 0;
        padding: dt('multiselect.option.group.padding');
        background: dt('multiselect.option.group.background');
        color: dt('multiselect.option.group.color');
        font-weight: dt('multiselect.option.group.font.weight');
    }

    .p-multiselect-empty-message {
        padding: dt('multiselect.empty.message.padding');
    }

    .p-multiselect-label .p-chip {
        padding-block-start: calc(dt('multiselect.padding.y') / 2);
        padding-block-end: calc(dt('multiselect.padding.y') / 2);
        border-radius: dt('multiselect.chip.border.radius');
    }

    .p-multiselect-label:has(.p-chip) {
        padding: calc(dt('multiselect.padding.y') / 2) calc(dt('multiselect.padding.x') / 2);
    }

    .p-multiselect-fluid {
        display: flex;
        width: 100%;
    }

    .p-multiselect-sm .p-multiselect-label {
        font-size: dt('multiselect.sm.font.size');
        padding-block: dt('multiselect.sm.padding.y');
        padding-inline: dt('multiselect.sm.padding.x');
    }

    .p-multiselect-sm .p-multiselect-dropdown .p-icon {
        font-size: dt('multiselect.sm.font.size');
        width: dt('multiselect.sm.font.size');
        height: dt('multiselect.sm.font.size');
    }

    .p-multiselect-lg .p-multiselect-label {
        font-size: dt('multiselect.lg.font.size');
        padding-block: dt('multiselect.lg.padding.y');
        padding-inline: dt('multiselect.lg.padding.x');
    }

    .p-multiselect-lg .p-multiselect-dropdown .p-icon {
        font-size: dt('multiselect.lg.font.size');
        width: dt('multiselect.lg.font.size');
        height: dt('multiselect.lg.font.size');
    }

    .p-floatlabel-in .p-multiselect-filter {
        padding-block-start: dt('multiselect.padding.y');
        padding-block-end: dt('multiselect.padding.y');
    }
`,bl={root:function(e){var n=e.props;return{position:n.appendTo==="self"?"relative":void 0}}},vl={root:function(e){var n=e.instance,l=e.props;return["p-multiselect p-component p-inputwrapper",{"p-multiselect-display-chip":l.display==="chip","p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":n.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":n.focused||n.overlayVisible,"p-multiselect-open":n.overlayVisible,"p-multiselect-fluid":n.$fluid,"p-multiselect-sm p-inputfield-sm":l.size==="small","p-multiselect-lg p-inputfield-lg":l.size==="large"}]},labelContainer:"p-multiselect-label-container",label:function(e){var n=e.instance,l=e.props;return["p-multiselect-label",{"p-placeholder":n.label===l.placeholder,"p-multiselect-label-empty":!l.placeholder&&!n.$filled}]},clearIcon:"p-multiselect-clear-icon",chipItem:"p-multiselect-chip-item",pcChip:"p-multiselect-chip",chipIcon:"p-multiselect-chip-icon",dropdown:"p-multiselect-dropdown",loadingIcon:"p-multiselect-loading-icon",dropdownIcon:"p-multiselect-dropdown-icon",overlay:"p-multiselect-overlay p-component",header:"p-multiselect-header",pcFilterContainer:"p-multiselect-filter-container",pcFilter:"p-multiselect-filter",listContainer:"p-multiselect-list-container",list:"p-multiselect-list",optionGroup:"p-multiselect-option-group",option:function(e){var n=e.instance,l=e.option,s=e.index,i=e.getItemOptions,b=e.props;return["p-multiselect-option",{"p-multiselect-option-selected":n.isSelected(l)&&b.highlightOnSelect,"p-focus":n.focusedOptionIndex===n.getOptionIndex(s,i),"p-disabled":n.isOptionDisabled(l)}]},emptyMessage:"p-multiselect-empty-message"},gl=me.extend({name:"multiselect",style:ml,classes:vl,inlineStyles:bl}),yl={name:"BaseMultiSelect",extends:lt,props:{options:Array,optionLabel:null,optionValue:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:"14rem"},placeholder:String,inputId:{type:String,default:null},panelClass:{type:String,default:null},panelStyle:{type:null,default:null},overlayClass:{type:String,default:null},overlayStyle:{type:null,default:null},dataKey:null,showClear:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},resetFilterOnClear:{type:Boolean,default:!1},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},display:{type:String,default:"comma"},selectedItemsLabel:{type:String,default:null},maxSelectedLabels:{type:Number,default:null},selectionLimit:{type:Number,default:null},showToggleAll:{type:Boolean,default:!0},loading:{type:Boolean,default:!1},checkboxIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},removeTokenIcon:{type:String,default:void 0},chipIcon:{type:String,default:void 0},selectAll:{type:Boolean,default:null},resetFilterOnHide:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:gl,provide:function(){return{$pcMultiSelect:this,$parentInstance:this}}};function Be(t){"@babel/helpers - typeof";return Be=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Be(t)}function _t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Nt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?_t(Object(n),!0).forEach(function(l){ke(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):_t(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ke(t,e,n){return(e=kl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function kl(t){var e=wl(t,"string");return Be(e)=="symbol"?e:e+""}function wl(t,e){if(Be(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Be(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function qt(t){return Sl(t)||Il(t)||xl(t)||Ol()}function Ol(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function xl(t,e){if(t){if(typeof t=="string")return gt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?gt(t,e):void 0}}function Il(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Sl(t){if(Array.isArray(t))return gt(t)}function gt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var yt={name:"MultiSelect",extends:yl,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter","selectall-change"],inject:{$pcFluid:{default:null}},outsideClickListener:null,scrollHandler:null,resizeListener:null,overlay:null,list:null,virtualScroller:null,startRangeIndex:-1,searchTimeout:null,searchValue:"",selectOnFocus:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1}},watch:{options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(se.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e)+"_".concat(n)},getHeaderCheckboxPTOptions:function(e){return this.ptm(e,{context:{selected:this.allSelected}})},getCheckboxPTOptions:function(e,n,l,s){return this.ptm(s,{context:{selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.maxSelectionLimitReached&&!this.isSelected(e)?!0:this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return!!(this.optionGroupLabel&&e.optionGroup&&e.group)},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),e&&ee(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&ee(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),!this.autoFilterFocus&&this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n,l;this.clicked=!1,this.focused=!1,this.focusedOptionIndex=-1,this.searchValue="",this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"ShiftLeft":case"ShiftRight":this.onShiftKey(e);break;default:if(e.code==="KeyA"&&l){var s=this.visibleOptions.filter(function(i){return n.isValidOption(i)}).map(function(i){return n.getOptionValue(i)});this.updateModel(e,s),e.preventDefault();break}!l&&tn(e.key)&&(!this.overlayVisible&&this.show(),this.searchOptions(e),e.preventDefault());break}this.clicked=!1},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,[]),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?en(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;ee(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;ee(n)},onOptionSelect:function(e,n){var l=this,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1,i=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;if(!(this.disabled||this.isOptionDisabled(n))){var b=this.isSelected(n),p=null;b?p=this.d_value.filter(function(m){return!Le(m,l.getOptionValue(n),l.equalityKey)}):p=[].concat(qt(this.d_value||[]),[this.getOptionValue(n)]),this.updateModel(e,p),s!==-1&&(this.focusedOptionIndex=s),i&&ee(this.$refs.focusInput)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onOptionSelectRange:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(l===-1&&(l=this.findNearestSelectedOptionIndex(s,!0)),s===-1&&(s=this.findNearestSelectedOptionIndex(l)),l!==-1&&s!==-1){var i=Math.min(l,s),b=Math.max(l,s),p=this.visibleOptions.slice(i,b+1).filter(function(m){return n.isValidOption(m)}).map(function(m){return n.getOptionValue(m)});this.updateModel(e,p)}},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e,!0);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){at.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show();else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,n),this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,l,this.startRangeIndex),this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else{var s=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();e.shiftKey&&s&&this.onOptionSelectRange(e,i,this.startRangeIndex),this.changeFocusedOptionIndex(e,i),!this.overlayVisible&&this.show()}e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var s=l.value.length;l.setSelectionRange(s,s),this.focusedOptionIndex=-1}}else{var i=e.metaKey||e.ctrlKey,b=this.findLastOptionIndex();e.shiftKey&&i&&this.onOptionSelectRange(e,this.startRangeIndex,b),this.changeFocusedOptionIndex(e,b),!this.overlayVisible&&this.show()}e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?this.focusedOptionIndex!==-1&&(e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex])):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onEscapeKey:function(e){this.overlayVisible&&(this.hide(!0),e.stopPropagation()),e.preventDefault()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(ee(e.shiftKey?this.$refs.lastHiddenFocusableElementOnOverlay:this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onOverlayEnter:function(e){se.set("overlay",e,this.$primevue.config.zIndex.overlay),xt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.autoFilterFocus&&ee(this.$refs.filterInput.$el),this.autoUpdateModel(),this.$attrSelector&&e.setAttribute(this.$attrSelector,"")},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){se.clear(e)},alignOverlay:function(){this.appendTo==="self"?It(this.overlay,this.$el):(this.overlay.style.minWidth=Fe(this.$el)+"px",tt(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new et(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Qe()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isOutsideClicked:function(e){return!(this.$el.isSameNode(e.target)||this.$el.contains(e.target)||this.overlay&&this.overlay.contains(e.target))},getLabelByValue:function(e){var n=this,l=this.optionGroupLabel?this.flatOptions(this.options):this.options||[],s=l.find(function(i){return!n.isOptionGroup(i)&&Le(n.getOptionValue(i),e,n.equalityKey)});return this.getOptionLabel(s)},getSelectedItemsLabel:function(){var e=/{(.*?)}/,n=this.selectedItemsLabel||this.$primevue.config.locale.selectionMessage;return e.test(n)?n.replace(n.match(e)[0],this.d_value.length+""):n},onToggleAll:function(e){var n=this;if(this.selectAll!==null)this.$emit("selectall-change",{originalEvent:e,checked:!this.allSelected});else{var l=this.allSelected?[]:this.visibleOptions.filter(function(s){return n.isValidOption(s)}).map(function(s){return n.getOptionValue(s)});this.updateModel(e,l)}},removeOption:function(e,n){var l=this;e.stopPropagation();var s=this.d_value.filter(function(i){return!Le(i,n,l.equalityKey)});this.updateModel(e,s)},clearFilter:function(){this.filterValue=null},hasFocusableElements:function(){return Jt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return fe(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,n){return Le(e,n,this.equalityKey)},isSelected:function(e){var n=this,l=this.getOptionValue(e);return(this.d_value||[]).some(function(s){return n.isEquals(s,l)})},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return Ve(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidOption(s)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?Ve(this.visibleOptions.slice(0,e),function(s){return n.isValidOption(s)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;if(this.$filled){for(var n=function(){var b=e.d_value[s],p=e.visibleOptions.findIndex(function(m){return e.isValidSelectedOption(m)&&e.isEquals(b,e.getOptionValue(m))});if(p>-1)return{v:p}},l,s=this.d_value.length-1;s>=0;s--)if(l=n(),l)return l.v}return-1},findFirstSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)}):-1},findLastSelectedOptionIndex:function(){var e=this;return this.$filled?Ve(this.visibleOptions,function(n){return e.isValidSelectedOption(n)}):-1},findNextSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidSelectedOption(s)}):-1;return l>-1?l+e+1:-1},findPrevSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e>0?Ve(this.visibleOptions.slice(0,e),function(s){return n.isValidSelectedOption(s)}):-1;return l>-1?l:-1},findNearestSelectedOptionIndex:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,l=-1;return this.$filled&&(n?(l=this.findPrevSelectedOptionIndex(e),l=l===-1?this.findNextSelectedOptionIndex(e):l):(l=this.findNextSelectedOptionIndex(e),l=l===-1?this.findPrevSelectedOptionIndex(e):l)),l>-1?l:e},findFirstFocusedOptionIndex:function(){var e=this.findFirstSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e){var n=this;this.searchValue=(this.searchValue||"")+e.key;var l=-1;fe(this.searchValue)&&(this.focusedOptionIndex!==-1?(l=this.visibleOptions.slice(this.focusedOptionIndex).findIndex(function(s){return n.isOptionMatched(s)}),l=l===-1?this.visibleOptions.slice(0,this.focusedOptionIndex).findIndex(function(s){return n.isOptionMatched(s)}):l+this.focusedOptionIndex):l=this.visibleOptions.findIndex(function(s){return n.isOptionMatched(s)}),l===-1&&this.focusedOptionIndex===-1&&(l=this.findFirstFocusedOptionIndex()),l!==-1&&this.changeFocusedOptionIndex(e,l)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){n.searchValue="",n.searchTimeout=null},500)},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n]))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,s=Te(e.list,'li[id="'.concat(l,'"]'));s?s.scrollIntoView&&s.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){if(this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled){var e=this.getOptionValue(this.visibleOptions[this.focusedOptionIndex]);this.updateModel(null,[e])}},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,s,i){var b=n.getOptionGroupChildren(s);return b&&Array.isArray(b)?(l.push({optionGroup:s,group:!0,index:i}),b.forEach(function(p){return l.push(p)})):l.push(s),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Yt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var s=this.options||[],i=[];return s.forEach(function(b){var p=e.getOptionGroupChildren(b),m=p.filter(function(y){return l.includes(y)});m.length>0&&i.push(Nt(Nt({},b),{},ke({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",qt(m))))}),this.flatOptions(i)}return l}return n},label:function(){var e;if(this.d_value&&this.d_value.length)if(this.loading&&(!this.options||this.options.length===0))e=this.placeholder;else{if(fe(this.maxSelectedLabels)&&this.d_value.length>this.maxSelectedLabels)return this.getSelectedItemsLabel();e="";for(var n=0;n<this.d_value.length;n++)n!==0&&(e+=", "),e+=this.getLabelByValue(this.d_value[n])}else e=this.placeholder;return e},chipSelectedItems:function(){return fe(this.maxSelectedLabels)&&this.d_value&&this.d_value.length>this.maxSelectedLabels},allSelected:function(){var e=this;return this.selectAll!==null?this.selectAll:fe(this.visibleOptions)&&this.visibleOptions.every(function(n){return e.isOptionGroup(n)||e.isOptionDisabled(n)||e.isSelected(n)})},hasSelectedOption:function(){return this.$filled},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},maxSelectionLimitReached:function(){return this.selectionLimit&&this.d_value&&this.d_value.length===this.selectionLimit},filterResultMessageText:function(){return fe(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}",this.d_value.length):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},toggleAllAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria[this.allSelected?"selectAll":"unselectAll"]:void 0},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},hasFluid:function(){return zn(this.fluid)?!!this.$pcFluid:this.fluid},isClearIconVisible:function(){return this.showClear&&this.d_value&&this.d_value.length&&this.d_value!=null&&fe(this.options)&&!this.disabled&&!this.loading},containerDataP:function(){return re(ke({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return re(ke(ke(ke({placeholder:this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled},this.size,this.size),"has-chip",this.display==="chip"&&this.d_value&&this.d_value.length&&(this.maxSelectedLabels?this.d_value.length<=this.maxSelectedLabels:!0)),"empty",!this.placeholder&&!this.$filled))},dropdownIconDataP:function(){return re(ke({},this.size,this.size))},overlayDataP:function(){return re(ke({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:Ot},components:{InputText:Je,Checkbox:dn,VirtualScroller:Tt,Portal:je,Chip:cn,IconField:$t,InputIcon:Ft,TimesIcon:Vt,SearchIcon:zt,ChevronDownIcon:Mt,SpinnerIcon:Lt,CheckIcon:St}};function He(t){"@babel/helpers - typeof";return He=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},He(t)}function Wt(t,e,n){return(e=Ll(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ll(t){var e=Vl(t,"string");return He(e)=="symbol"?e:e+""}function Vl(t,e){if(He(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(He(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Cl=["data-p"],Ml=["id","disabled","placeholder","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid"],zl=["data-p"],$l={key:1},Fl=["data-p"],Tl=["id","aria-label"],Pl=["id"],Al=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onClick","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function El(t,e,n,l,s,i){var b=N("Chip"),p=N("SpinnerIcon"),m=N("Checkbox"),y=N("InputText"),O=N("SearchIcon"),I=N("InputIcon"),A=N("IconField"),U=N("VirtualScroller"),E=N("Portal"),P=Ge("ripple");return u(),d("div",f({ref:"container",class:t.cx("root"),style:t.sx("root"),onClick:e[7]||(e[7]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[c("div",f({class:"p-hidden-accessible"},t.ptm("hiddenInputContainer"),{"data-p-hidden-accessible":!0}),[c("input",f({ref:"focusInput",id:t.inputId,type:"text",readonly:"",disabled:t.disabled,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":s.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)})},t.ptm("hiddenInput")),null,16,Ml)],16),c("div",f({class:t.cx("labelContainer")},t.ptm("labelContainer")),[c("div",f({class:t.cx("label"),"data-p":i.labelDataP},t.ptm("label")),[$(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){return[t.display==="comma"?(u(),d(S,{key:0},[j(C(i.label||"empty"),1)],64)):t.display==="chip"?(u(),d(S,{key:1},[t.loading&&(!t.options||t.options.length===0)?(u(),d(S,{key:0},[j(C(t.placeholder||"empty"),1)],64)):i.chipSelectedItems?(u(),d("span",$l,C(i.label),1)):(u(!0),d(S,{key:2},le(t.d_value,function(x,K){return u(),d("span",f({key:"chip-".concat(i.getLabelByValue(x),"_").concat(K),class:t.cx("chipItem")},{ref_for:!0},t.ptm("chipItem")),[$(t.$slots,"chip",{value:x,removeCallback:function(B){return i.removeOption(B,x)}},function(){return[r(b,{class:G(t.cx("pcChip")),label:i.getLabelByValue(x),removeIcon:t.chipIcon||t.removeTokenIcon,removable:"",unstyled:t.unstyled,onRemove:function(B){return i.removeOption(B,x)},pt:t.ptm("pcChip")},{removeicon:v(function(){return[$(t.$slots,t.$slots.chipicon?"chipicon":"removetokenicon",{class:G(t.cx("chipIcon")),item:x,removeCallback:function(B){return i.removeOption(B,x)}})]}),_:2},1032,["class","label","removeIcon","unstyled","onRemove","pt"])]})],16)}),128)),!t.d_value||t.d_value.length===0?(u(),d(S,{key:3},[j(C(t.placeholder||"empty"),1)],64)):w("",!0)],64)):w("",!0)]})],16,zl)],16),i.isClearIconVisible?$(t.$slots,"clearicon",{key:0,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(u(),F(de(t.clearIcon?"i":"TimesIcon"),f({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):w("",!0),c("div",f({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?$(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(u(),d("span",f({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(u(),F(p,f({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):$(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(u(),F(de(t.dropdownIcon?"span":"ChevronDownIcon"),f({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(E,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,f({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[s.overlayVisible?(u(),d("div",f({key:0,ref:i.overlayRef,style:[t.panelStyle,t.overlayStyle],class:[t.cx("overlay"),t.panelClass,t.overlayClass],onClick:e[5]||(e[5]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[c("span",f({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[3]||(e[3]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),$(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.showToggleAll&&t.selectionLimit==null||t.filter?(u(),d("div",f({key:0,class:t.cx("header")},t.ptm("header")),[t.showToggleAll&&t.selectionLimit==null?(u(),F(m,{key:0,modelValue:i.allSelected,binary:!0,disabled:t.disabled,variant:t.variant,"aria-label":i.toggleAllAriaLabel,onChange:i.onToggleAll,unstyled:t.unstyled,pt:i.getHeaderCheckboxPTOptions("pcHeaderCheckbox"),formControl:{novalidate:!0}},{icon:v(function(x){return[t.$slots.headercheckboxicon?(u(),F(de(t.$slots.headercheckboxicon),{key:0,checked:x.checked,class:G(x.class)},null,8,["checked","class"])):x.checked?(u(),F(de(t.checkboxIcon?"span":"CheckIcon"),f({key:1,class:[x.class,Wt({},t.checkboxIcon,x.checked)]},i.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon")),null,16,["class"])):w("",!0)]}),_:1},8,["modelValue","disabled","variant","aria-label","onChange","unstyled","pt"])):w("",!0),t.filter?(u(),F(A,{key:1,class:G(t.cx("pcFilterContainer")),unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(y,{ref:"filterInput",value:s.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,disabled:t.disabled,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","disabled","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(I,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[$(t.$slots,"filtericon",{},function(){return[t.filterIcon?(u(),d("span",f({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(u(),F(O,nn(f({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["class","unstyled","pt"])):w("",!0),t.filter?(u(),d("span",f({key:2,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),C(i.filterResultMessageText),17)):w("",!0)],16)):w("",!0),c("div",f({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,f({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),ln({content:v(function(x){var K=x.styleClass,M=x.contentRef,B=x.items,z=x.getItemOptions,ae=x.contentStyle,_=x.itemSize;return[c("ul",f({ref:function(T){return i.listRef(T,M)},id:t.$id+"_list",class:[t.cx("list"),K],style:ae,role:"listbox","aria-multiselectable":"true","aria-label":i.listAriaLabel},t.ptm("list")),[(u(!0),d(S,null,le(B,function(L,T){return u(),d(S,{key:i.getOptionRenderKey(L,i.getOptionIndex(T,z))},[i.isOptionGroup(L)?(u(),d("li",f({key:0,id:t.$id+"_"+i.getOptionIndex(T,z),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[$(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(T,z)},function(){return[j(C(i.getOptionGroupLabel(L.optionGroup)),1)]})],16,Pl)):_e((u(),d("li",f({key:1,id:t.$id+"_"+i.getOptionIndex(T,z),style:{height:_?_+"px":void 0},class:t.cx("option",{option:L,index:T,getItemOptions:z}),role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(T,z)),onClick:function(ne){return i.onOptionSelect(ne,L,i.getOptionIndex(T,z),!0)},onMousemove:function(ne){return i.onOptionMouseMove(ne,i.getOptionIndex(T,z))}},{ref_for:!0},i.getCheckboxPTOptions(L,z,T,"option"),{"data-p-selected":i.isSelected(L),"data-p-focused":s.focusedOptionIndex===i.getOptionIndex(T,z),"data-p-disabled":i.isOptionDisabled(L)}),[r(m,{defaultValue:i.isSelected(L),binary:!0,tabindex:-1,variant:t.variant,unstyled:t.unstyled,pt:i.getCheckboxPTOptions(L,z,T,"pcOptionCheckbox"),formControl:{novalidate:!0}},{icon:v(function(Y){return[t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon?(u(),F(de(t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon),{key:0,checked:Y.checked,class:G(Y.class)},null,8,["checked","class"])):Y.checked?(u(),F(de(t.checkboxIcon?"span":"CheckIcon"),f({key:1,class:[Y.class,Wt({},t.checkboxIcon,Y.checked)]},{ref_for:!0},i.getCheckboxPTOptions(L,z,T,"pcOptionCheckbox.icon")),null,16,["class"])):w("",!0)]}),_:2},1032,["defaultValue","variant","unstyled","pt"]),$(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(T,z)},function(){return[c("span",f({ref_for:!0},t.ptm("optionLabel")),C(i.getOptionLabel(L)),17)]})],16,Al)),[[P]])],64)}),128)),s.filterValue&&(!B||B&&B.length===0)?(u(),d("li",f({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[$(t.$slots,"emptyfilter",{},function(){return[j(C(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(u(),d("li",f({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[$(t.$slots,"empty",{},function(){return[j(C(i.emptyMessageText),1)]})],16)):w("",!0)],16,Tl)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(x){var K=x.options;return[$(t.$slots,"loader",{options:K})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),$(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(u(),d("span",f({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),C(i.emptyMessageText),17)):w("",!0),c("span",f({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),C(i.selectedMessageText),17),c("span",f({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[4]||(e[4]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Fl)):w("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,Cl)}yt.render=El;var hn={name:"BlankIcon",extends:it};function Dl(t){return Ul(t)||Kl(t)||Hl(t)||Bl()}function Bl(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Hl(t,e){if(t){if(typeof t=="string")return kt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?kt(t,e):void 0}}function Kl(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Ul(t){if(Array.isArray(t))return kt(t)}function kt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Rl(t,e,n,l,s,i){return u(),d("svg",f({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Dl(e[0]||(e[0]=[c("rect",{width:"1",height:"1",fill:"currentColor","fill-opacity":"0"},null,-1)])),16)}hn.render=Rl;var jl=`
    .p-select {
        display: inline-flex;
        cursor: pointer;
        position: relative;
        user-select: none;
        background: dt('select.background');
        border: 1px solid dt('select.border.color');
        transition:
            background dt('select.transition.duration'),
            color dt('select.transition.duration'),
            border-color dt('select.transition.duration'),
            outline-color dt('select.transition.duration'),
            box-shadow dt('select.transition.duration');
        border-radius: dt('select.border.radius');
        outline-color: transparent;
        box-shadow: dt('select.shadow');
    }

    .p-select:not(.p-disabled):hover {
        border-color: dt('select.hover.border.color');
    }

    .p-select:not(.p-disabled).p-focus {
        border-color: dt('select.focus.border.color');
        box-shadow: dt('select.focus.ring.shadow');
        outline: dt('select.focus.ring.width') dt('select.focus.ring.style') dt('select.focus.ring.color');
        outline-offset: dt('select.focus.ring.offset');
    }

    .p-select.p-variant-filled {
        background: dt('select.filled.background');
    }

    .p-select.p-variant-filled:not(.p-disabled):hover {
        background: dt('select.filled.hover.background');
    }

    .p-select.p-variant-filled:not(.p-disabled).p-focus {
        background: dt('select.filled.focus.background');
    }

    .p-select.p-invalid {
        border-color: dt('select.invalid.border.color');
    }

    .p-select.p-disabled {
        opacity: 1;
        background: dt('select.disabled.background');
    }

    .p-select-clear-icon {
        align-self: center;
        color: dt('select.clear.icon.color');
        inset-inline-end: dt('select.dropdown.width');
    }

    .p-select-dropdown {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        color: dt('select.dropdown.color');
        width: dt('select.dropdown.width');
        border-start-end-radius: dt('select.border.radius');
        border-end-end-radius: dt('select.border.radius');
    }

    .p-select-label {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        flex: 1 1 auto;
        width: 1%;
        padding: dt('select.padding.y') dt('select.padding.x');
        text-overflow: ellipsis;
        cursor: pointer;
        color: dt('select.color');
        background: transparent;
        border: 0 none;
        outline: 0 none;
        font-size: 1rem;
    }

    .p-select-label.p-placeholder {
        color: dt('select.placeholder.color');
    }

    .p-select.p-invalid .p-select-label.p-placeholder {
        color: dt('select.invalid.placeholder.color');
    }

    .p-select.p-disabled .p-select-label {
        color: dt('select.disabled.color');
    }

    .p-select-label-empty {
        overflow: hidden;
        opacity: 0;
    }

    input.p-select-label {
        cursor: default;
    }

    .p-select-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('select.overlay.background');
        color: dt('select.overlay.color');
        border: 1px solid dt('select.overlay.border.color');
        border-radius: dt('select.overlay.border.radius');
        box-shadow: dt('select.overlay.shadow');
        min-width: 100%;
        transform-origin: inherit;
        will-change: transform;
    }

    .p-select-header {
        padding: dt('select.list.header.padding');
    }

    .p-select-filter {
        width: 100%;
    }

    .p-select-list-container {
        overflow: auto;
    }

    .p-select-option-group {
        cursor: auto;
        margin: 0;
        padding: dt('select.option.group.padding');
        background: dt('select.option.group.background');
        color: dt('select.option.group.color');
        font-weight: dt('select.option.group.font.weight');
    }

    .p-select-list {
        margin: 0;
        padding: 0;
        list-style-type: none;
        padding: dt('select.list.padding');
        gap: dt('select.list.gap');
        display: flex;
        flex-direction: column;
    }

    .p-select-option {
        cursor: pointer;
        font-weight: normal;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: dt('select.option.padding');
        border: 0 none;
        color: dt('select.option.color');
        background: transparent;
        transition:
            background dt('select.transition.duration'),
            color dt('select.transition.duration'),
            border-color dt('select.transition.duration'),
            box-shadow dt('select.transition.duration'),
            outline-color dt('select.transition.duration');
        border-radius: dt('select.option.border.radius');
    }

    .p-select-option:not(.p-select-option-selected):not(.p-disabled).p-focus {
        background: dt('select.option.focus.background');
        color: dt('select.option.focus.color');
    }

    .p-select-option:not(.p-select-option-selected):not(.p-disabled):hover {
        background: dt('select.option.focus.background');
        color: dt('select.option.focus.color');
    }

    .p-select-option.p-select-option-selected {
        background: dt('select.option.selected.background');
        color: dt('select.option.selected.color');
    }

    .p-select-option.p-select-option-selected.p-focus {
        background: dt('select.option.selected.focus.background');
        color: dt('select.option.selected.focus.color');
    }
   
    .p-select-option-blank-icon {
        flex-shrink: 0;
    }

    .p-select-option-check-icon {
        position: relative;
        flex-shrink: 0;
        margin-inline-start: dt('select.checkmark.gutter.start');
        margin-inline-end: dt('select.checkmark.gutter.end');
        color: dt('select.checkmark.color');
    }

    .p-select-empty-message {
        padding: dt('select.empty.message.padding');
    }

    .p-select-fluid {
        display: flex;
        width: 100%;
    }

    .p-select-sm .p-select-label {
        font-size: dt('select.sm.font.size');
        padding-block: dt('select.sm.padding.y');
        padding-inline: dt('select.sm.padding.x');
    }

    .p-select-sm .p-select-dropdown .p-icon {
        font-size: dt('select.sm.font.size');
        width: dt('select.sm.font.size');
        height: dt('select.sm.font.size');
    }

    .p-select-lg .p-select-label {
        font-size: dt('select.lg.font.size');
        padding-block: dt('select.lg.padding.y');
        padding-inline: dt('select.lg.padding.x');
    }

    .p-select-lg .p-select-dropdown .p-icon {
        font-size: dt('select.lg.font.size');
        width: dt('select.lg.font.size');
        height: dt('select.lg.font.size');
    }

    .p-floatlabel-in .p-select-filter {
        padding-block-start: dt('select.padding.y');
        padding-block-end: dt('select.padding.y');
    }
`,Gl={root:function(e){var n=e.instance,l=e.props,s=e.state;return["p-select p-component p-inputwrapper",{"p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":s.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":s.focused||s.overlayVisible,"p-select-open":s.overlayVisible,"p-select-fluid":n.$fluid,"p-select-sm p-inputfield-sm":l.size==="small","p-select-lg p-inputfield-lg":l.size==="large"}]},label:function(e){var n,l=e.instance,s=e.props;return["p-select-label",{"p-placeholder":!s.editable&&l.label===s.placeholder,"p-select-label-empty":!s.editable&&!l.$slots.value&&(l.label==="p-emptylabel"||((n=l.label)===null||n===void 0?void 0:n.length)===0)}]},clearIcon:"p-select-clear-icon",dropdown:"p-select-dropdown",loadingicon:"p-select-loading-icon",dropdownIcon:"p-select-dropdown-icon",overlay:"p-select-overlay p-component",header:"p-select-header",pcFilter:"p-select-filter",listContainer:"p-select-list-container",list:"p-select-list",optionGroup:"p-select-option-group",optionGroupLabel:"p-select-option-group-label",option:function(e){var n=e.instance,l=e.props,s=e.state,i=e.option,b=e.focusedOption;return["p-select-option",{"p-select-option-selected":n.isSelected(i)&&l.highlightOnSelect,"p-focus":s.focusedOptionIndex===b,"p-disabled":n.isOptionDisabled(i)}]},optionLabel:"p-select-option-label",optionCheckIcon:"p-select-option-check-icon",optionBlankIcon:"p-select-option-blank-icon",emptyMessage:"p-select-empty-message"},_l=me.extend({name:"select",style:jl,classes:Gl}),Nl={name:"BaseSelect",extends:lt,props:{options:Array,optionLabel:[String,Function],optionValue:[String,Function],optionDisabled:[String,Function],optionGroupLabel:[String,Function],optionGroupChildren:[String,Function],scrollHeight:{type:String,default:"14rem"},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},editable:Boolean,placeholder:{type:String,default:null},dataKey:null,showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},labelId:{type:String,default:null},labelClass:{type:[String,Object],default:null},labelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},appendTo:{type:[String,Object],default:"body"},loading:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},resetFilterOnHide:{type:Boolean,default:!1},resetFilterOnClear:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!0},checkmark:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:_l,provide:function(){return{$pcSelect:this,$parentInstance:this}}};function Ke(t){"@babel/helpers - typeof";return Ke=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ke(t)}function ql(t){return Yl(t)||Xl(t)||Zl(t)||Wl()}function Wl(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Zl(t,e){if(t){if(typeof t=="string")return wt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?wt(t,e):void 0}}function Xl(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Yl(t){if(Array.isArray(t))return wt(t)}function wt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Zt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Xt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Zt(Object(n),!0).forEach(function(l){we(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Zt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function we(t,e,n){return(e=Jl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Jl(t){var e=Ql(t,"string");return Ke(e)=="symbol"?e:e+""}function Ql(t,e){if(Ke(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ke(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var X={name:"Select",extends:Nl,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter"],outsideClickListener:null,scrollHandler:null,resizeListener:null,labelClickListener:null,matchMediaOrientationListener:null,overlay:null,list:null,virtualScroller:null,searchTimeout:null,searchValue:null,isModelValueChanged:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1,queryOrientation:null}},watch:{modelValue:function(){this.isModelValueChanged=!0},options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel(),this.bindLabelClickListener(),this.bindMatchMediaOrientationListener()},updated:function(){this.overlayVisible&&this.isModelValueChanged&&this.scrollInView(this.findSelectedOptionIndex()),this.isModelValueChanged=!1},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindLabelClickListener(),this.unbindMatchMediaOrientationListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(se.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return(this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e))+"_"+n},getPTItemOptions:function(e,n,l,s){return this.ptm(s,{context:{option:e,index:l,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),e&&ee(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&ee(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n=this;setTimeout(function(){var l,s;n.focused=!1,n.focusedOptionIndex=-1,n.searchValue="",n.$emit("blur",e),(l=(s=n.formField).onBlur)===null||l===void 0||l.call(s,e)},100)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}if($n())switch(e.code){case"Backspace":this.onBackspaceKey(e,this.editable);break;case"Enter":case"NumpadDecimal":this.onEnterKey(e);break;default:e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,this.editable);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,this.editable);break;case"Home":this.onHomeKey(e,this.editable);break;case"End":this.onEndKey(e,this.editable);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Space":this.onSpaceKey(e,this.editable);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"Backspace":this.onBackspaceKey(e,this.editable);break;case"ShiftLeft":case"ShiftRight":break;default:!l&&tn(e.key)&&(!this.overlayVisible&&this.show(),!this.editable&&this.searchOptions(e,e.key),this.filter&&this.$nextTick(function(){n.$refs.filterInput&&ee(n.$refs.filterInput.$el)}));break}this.clicked=!1},onEditableInput:function(e){var n=e.target.value;this.searchValue="";var l=this.searchOptions(e,n);!l&&(this.focusedOptionIndex=-1),this.updateModel(e,n),!this.overlayVisible&&fe(n)&&this.show()},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,null),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?en(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;ee(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;ee(n)},onOptionSelect:function(e,n){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0;if(this.overlayVisible){var s=this.getOptionValue(n);this.updateModel(e,s),l&&this.hide(!0)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){if(!e.isComposing)switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){at.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show(),this.editable&&this.changeFocusedOptionIndex(e,this.findSelectedOptionIndex());else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else this.changeFocusedOptionIndex(e,this.findFirstOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var s=l.value.length;l.setSelectionRange(s,s),this.focusedOptionIndex=-1}}else this.changeFocusedOptionIndex(e,this.findLastOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.hide(!0)):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onSpaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;!n&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault(),e.stopPropagation()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(ee(this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onBackspaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&!this.overlayVisible&&this.show()},onOverlayEnter:function(e){var n=this;se.set("overlay",e,this.$primevue.config.zIndex.overlay),xt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),setTimeout(function(){n.autoFilterFocus&&n.filter&&ee(n.$refs.filterInput.$el),n.autoUpdateModel()},1)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){var n=this;e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.autoFilterFocus&&this.filter&&!this.editable&&this.$nextTick(function(){n.$refs.filterInput&&ee(n.$refs.filterInput.$el)}),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){se.clear(e)},alignOverlay:function(){this.appendTo==="self"?It(this.overlay,this.$el):this.overlay&&(this.overlay.style.minWidth=Fe(this.$el)+"px",tt(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=n.composedPath();e.overlayVisible&&e.overlay&&!l.includes(e.$el)&&!l.includes(e.overlay)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new et(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Qe()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindLabelClickListener:function(){var e=this;if(!this.editable&&!this.labelClickListener){var n=document.querySelector('label[for="'.concat(this.labelId,'"]'));n&&Ye(n)&&(this.labelClickListener=function(){ee(e.$refs.focusInput)},n.addEventListener("click",this.labelClickListener))}},unbindLabelClickListener:function(){if(this.labelClickListener){var e=document.querySelector('label[for="'.concat(this.labelId,'"]'));e&&Ye(e)&&e.removeEventListener("click",this.labelClickListener)}},bindMatchMediaOrientationListener:function(){var e=this;if(!this.matchMediaOrientationListener){var n=matchMedia("(orientation: portrait)");this.queryOrientation=n,this.matchMediaOrientationListener=function(){e.alignOverlay()},this.queryOrientation.addEventListener("change",this.matchMediaOrientationListener)}},unbindMatchMediaOrientationListener:function(){this.matchMediaOrientationListener&&(this.queryOrientation.removeEventListener("change",this.matchMediaOrientationListener),this.queryOrientation=null,this.matchMediaOrientationListener=null)},hasFocusableElements:function(){return Jt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionExactMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale))==this.searchValue.toLocaleLowerCase(this.filterLocale)},isOptionStartsWith:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return fe(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isSelected:function(e){return Le(this.d_value,this.getOptionValue(e),this.equalityKey)},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return Ve(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidOption(s)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?Ve(this.visibleOptions.slice(0,e),function(s){return n.isValidOption(s)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)})},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e,n){var l=this;this.searchValue=(this.searchValue||"")+n;var s=-1,i=!1;return fe(this.searchValue)&&(s=this.visibleOptions.findIndex(function(b){return l.isOptionExactMatched(b)}),s===-1&&(s=this.visibleOptions.findIndex(function(b){return l.isOptionStartsWith(b)})),s!==-1&&(i=!0),s===-1&&this.focusedOptionIndex===-1&&(s=this.findFirstFocusedOptionIndex()),s!==-1&&this.changeFocusedOptionIndex(e,s)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){l.searchValue="",l.searchTimeout=null},500),i},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n],!1))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,s=Te(e.list,'li[id="'.concat(l,'"]'));s?s.scrollIntoView&&s.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1)},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,s,i){l.push({optionGroup:s,group:!0,index:i});var b=n.getOptionGroupChildren(s);return b&&b.forEach(function(p){return l.push(p)}),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Yt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var s=this.options||[],i=[];return s.forEach(function(b){var p=e.getOptionGroupChildren(b),m=p.filter(function(y){return l.includes(y)});m.length>0&&i.push(Xt(Xt({},b),{},we({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",ql(m))))}),this.flatOptions(i)}return l}return n},hasSelectedOption:function(){return this.$filled},label:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.placeholder||"p-emptylabel"},editableInputValue:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.d_value||""},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},filterResultMessageText:function(){return fe(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}","1"):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},isClearIconVisible:function(){return this.showClear&&this.d_value!=null&&!this.disabled&&!this.loading},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},containerDataP:function(){return re(we({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return re(we(we({placeholder:!this.editable&&this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled,editable:this.editable},this.size,this.size),"empty",!this.editable&&!this.$slots.value&&(this.label==="p-emptylabel"||this.label.length===0)))},dropdownIconDataP:function(){return re(we({},this.size,this.size))},overlayDataP:function(){return re(we({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:Ot},components:{InputText:Je,VirtualScroller:Tt,Portal:je,InputIcon:Ft,IconField:$t,TimesIcon:Vt,ChevronDownIcon:Mt,SpinnerIcon:Lt,SearchIcon:zt,CheckIcon:St,BlankIcon:hn}},eo=["id","data-p"],to=["name","id","value","placeholder","tabindex","disabled","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","data-p"],no=["name","id","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","aria-disabled","data-p"],io=["data-p"],lo=["id"],oo=["id"],ao=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onMousedown","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function so(t,e,n,l,s,i){var b=N("SpinnerIcon"),p=N("InputText"),m=N("SearchIcon"),y=N("InputIcon"),O=N("IconField"),I=N("CheckIcon"),A=N("BlankIcon"),U=N("VirtualScroller"),E=N("Portal"),P=Ge("ripple");return u(),d("div",f({ref:"container",id:t.$id,class:t.cx("root"),onClick:e[12]||(e[12]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[t.editable?(u(),d("input",f({key:0,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,type:"text",class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],value:i.editableInputValue,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,disabled:t.disabled,autocomplete:"off",role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":s.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),onInput:e[3]||(e[3]=function(){return i.onEditableInput&&i.onEditableInput.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),null,16,to)):(u(),d("span",f({key:1,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel||(i.label==="p-emptylabel"?void 0:i.label),"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":t.$id+"_list","aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,"aria-disabled":t.disabled,onFocus:e[4]||(e[4]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[5]||(e[5]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),[$(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){var x;return[j(C(i.label==="p-emptylabel"?" ":(x=i.label)!==null&&x!==void 0?x:"empty"),1)]})],16,no)),i.isClearIconVisible?$(t.$slots,"clearicon",{key:2,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(u(),F(de(t.clearIcon?"i":"TimesIcon"),f({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):w("",!0),c("div",f({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?$(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(u(),d("span",f({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(u(),F(b,f({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):$(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(u(),F(de(t.dropdownIcon?"span":"ChevronDownIcon"),f({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(E,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,f({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[s.overlayVisible?(u(),d("div",f({key:0,ref:i.overlayRef,class:[t.cx("overlay"),t.panelClass,t.overlayClass],style:[t.panelStyle,t.overlayStyle],onClick:e[10]||(e[10]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[11]||(e[11]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[c("span",f({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[7]||(e[7]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),$(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.filter?(u(),d("div",f({key:0,class:t.cx("header")},t.ptm("header")),[r(O,{unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(p,{ref:"filterInput",type:"text",value:s.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(y,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[$(t.$slots,"filtericon",{},function(){return[t.filterIcon?(u(),d("span",f({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(u(),F(m,nn(f({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["unstyled","pt"]),c("span",f({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),C(i.filterResultMessageText),17)],16)):w("",!0),c("div",f({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,f({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),ln({content:v(function(x){var K=x.styleClass,M=x.contentRef,B=x.items,z=x.getItemOptions,ae=x.contentStyle,_=x.itemSize;return[c("ul",f({ref:function(T){return i.listRef(T,M)},id:t.$id+"_list",class:[t.cx("list"),K],style:ae,role:"listbox"},t.ptm("list")),[(u(!0),d(S,null,le(B,function(L,T){return u(),d(S,{key:i.getOptionRenderKey(L,i.getOptionIndex(T,z))},[i.isOptionGroup(L)?(u(),d("li",f({key:0,id:t.$id+"_"+i.getOptionIndex(T,z),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[$(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(T,z)},function(){return[c("span",f({class:t.cx("optionGroupLabel")},{ref_for:!0},t.ptm("optionGroupLabel")),C(i.getOptionGroupLabel(L.optionGroup)),17)]})],16,oo)):_e((u(),d("li",f({key:1,id:t.$id+"_"+i.getOptionIndex(T,z),class:t.cx("option",{option:L,focusedOption:i.getOptionIndex(T,z)}),style:{height:_?_+"px":void 0},role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(T,z)),onMousedown:function(ne){return i.onOptionSelect(ne,L)},onMousemove:function(ne){return i.onOptionMouseMove(ne,i.getOptionIndex(T,z))},onClick:e[8]||(e[8]=on(function(){},["stop"])),"data-p-selected":!t.checkmark&&i.isSelected(L),"data-p-focused":s.focusedOptionIndex===i.getOptionIndex(T,z),"data-p-disabled":i.isOptionDisabled(L)},{ref_for:!0},i.getPTItemOptions(L,z,T,"option")),[t.checkmark?(u(),d(S,{key:0},[i.isSelected(L)?(u(),F(I,f({key:0,class:t.cx("optionCheckIcon")},{ref_for:!0},t.ptm("optionCheckIcon")),null,16,["class"])):(u(),F(A,f({key:1,class:t.cx("optionBlankIcon")},{ref_for:!0},t.ptm("optionBlankIcon")),null,16,["class"]))],64)):w("",!0),$(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(T,z)},function(){return[c("span",f({class:t.cx("optionLabel")},{ref_for:!0},t.ptm("optionLabel")),C(i.getOptionLabel(L)),17)]})],16,ao)),[[P]])],64)}),128)),s.filterValue&&(!B||B&&B.length===0)?(u(),d("li",f({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[$(t.$slots,"emptyfilter",{},function(){return[j(C(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(u(),d("li",f({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[$(t.$slots,"empty",{},function(){return[j(C(i.emptyMessageText),1)]})],16)):w("",!0)],16,lo)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(x){var K=x.options;return[$(t.$slots,"loader",{options:K})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),$(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(u(),d("span",f({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),C(i.emptyMessageText),17)):w("",!0),c("span",f({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),C(i.selectedMessageText),17),c("span",f({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[9]||(e[9]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,io)):w("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,eo)}X.render=so;var ro=`
    .p-textarea {
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: dt('textarea.color');
        background: dt('textarea.background');
        padding-block: dt('textarea.padding.y');
        padding-inline: dt('textarea.padding.x');
        border: 1px solid dt('textarea.border.color');
        transition:
            background dt('textarea.transition.duration'),
            color dt('textarea.transition.duration'),
            border-color dt('textarea.transition.duration'),
            outline-color dt('textarea.transition.duration'),
            box-shadow dt('textarea.transition.duration');
        appearance: none;
        border-radius: dt('textarea.border.radius');
        outline-color: transparent;
        box-shadow: dt('textarea.shadow');
    }

    .p-textarea:enabled:hover {
        border-color: dt('textarea.hover.border.color');
    }

    .p-textarea:enabled:focus {
        border-color: dt('textarea.focus.border.color');
        box-shadow: dt('textarea.focus.ring.shadow');
        outline: dt('textarea.focus.ring.width') dt('textarea.focus.ring.style') dt('textarea.focus.ring.color');
        outline-offset: dt('textarea.focus.ring.offset');
    }

    .p-textarea.p-invalid {
        border-color: dt('textarea.invalid.border.color');
    }

    .p-textarea.p-variant-filled {
        background: dt('textarea.filled.background');
    }

    .p-textarea.p-variant-filled:enabled:hover {
        background: dt('textarea.filled.hover.background');
    }

    .p-textarea.p-variant-filled:enabled:focus {
        background: dt('textarea.filled.focus.background');
    }

    .p-textarea:disabled {
        opacity: 1;
        background: dt('textarea.disabled.background');
        color: dt('textarea.disabled.color');
    }

    .p-textarea::placeholder {
        color: dt('textarea.placeholder.color');
    }

    .p-textarea.p-invalid::placeholder {
        color: dt('textarea.invalid.placeholder.color');
    }

    .p-textarea-fluid {
        width: 100%;
    }

    .p-textarea-resizable {
        overflow: hidden;
        resize: none;
    }

    .p-textarea-sm {
        font-size: dt('textarea.sm.font.size');
        padding-block: dt('textarea.sm.padding.y');
        padding-inline: dt('textarea.sm.padding.x');
    }

    .p-textarea-lg {
        font-size: dt('textarea.lg.font.size');
        padding-block: dt('textarea.lg.padding.y');
        padding-inline: dt('textarea.lg.padding.x');
    }
`,uo={root:function(e){var n=e.instance,l=e.props;return["p-textarea p-component",{"p-filled":n.$filled,"p-textarea-resizable ":l.autoResize,"p-textarea-sm p-inputfield-sm":l.size==="small","p-textarea-lg p-inputfield-lg":l.size==="large","p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-textarea-fluid":n.$fluid}]}},co=me.extend({name:"textarea",style:ro,classes:uo}),po={name:"BaseTextarea",extends:lt,props:{autoResize:Boolean},style:co,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function Ue(t){"@babel/helpers - typeof";return Ue=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ue(t)}function ho(t,e,n){return(e=fo(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function fo(t){var e=mo(t,"string");return Ue(e)=="symbol"?e:e+""}function mo(t,e){if(Ue(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ue(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Oe={name:"Textarea",extends:po,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,n=parseInt(e)||0,l=this.$el.scrollHeight,s=!n||l>n,i=n&&l<n;i?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):s&&(this.$el.style.height="".concat(l,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return f(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return re(ho({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},bo=["value","name","disabled","aria-invalid","data-p"];function vo(t,e,n,l,s,i){return u(),d("textarea",f({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":i.dataP,onInput:e[0]||(e[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},i.attrs),null,16,bo)}Oe.render=vo;const go={class:"pt-1.5"},yo={class:"flex items-baseline gap-2 text-ink"},ko={key:0,class:"tnum text-[13px] text-tally"},wo={key:0,class:"mt-0.5 text-[13px] leading-snug text-ink-3"},Oo={class:"min-w-0"},xo={key:0,class:"mt-1 text-[13px] text-ink-3"},g=ot({__name:"FormField",props:{label:{},hint:{},value:{},stacked:{type:Boolean}},setup(t){return(e,n)=>(u(),d("div",{class:G(t.stacked?"flex flex-col gap-2":"grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1")},[c("div",go,[c("div",yo,[j(C(t.label)+" ",1),t.value!==void 0&&t.value!==null?(u(),d("span",ko,C(t.value),1)):w("",!0)]),t.hint&&!t.stacked?(u(),d("div",wo,C(t.hint),1)):w("",!0)]),c("div",Oo,[$(e.$slots,"default"),t.hint&&t.stacked?(u(),d("div",xo,C(t.hint),1)):w("",!0)])],2))}}),Io={class:"relative aspect-video overflow-hidden rounded-md bg-black"},So=["src"],Lo={key:1,class:"absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-ink-2"},Vo={key:2,class:"absolute inset-0 flex items-center justify-center p-6 text-center text-ink-2"},Co={class:"mt-3 flex items-center justify-between gap-4"},Mo={class:"text-[13px] text-ink-3"},zo={class:"flex shrink-0 gap-2"},$o=ot({__name:"FxPreview",props:Pe({target:{},channelId:{},projectId:{},settings:{type:Function}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:["update:visible"],setup(t){const e=Ct(t,"visible"),n=t,l=R(""),s=R(!1),i=R(""),b=R(!0),p=R(0),m=R(0);async function y(){if(n.target){s.value=!0,i.value="";try{const I=await ce.post("/api/fx-preview",{kind:n.target.kind,effect:n.target.effect,channel_id:n.channelId??null,project_id:n.projectId??null,pick:m.value,settings:n.settings()});l.value=I.url,b.value=I.own_images,p.value=I.images}catch(I){i.value=I.message}finally{s.value=!1}}}function O(){m.value+=n.target?.kind==="transition"?2:1,y()}return Xe(()=>[e.value,n.target],([I])=>{I&&(l.value="",y())}),(I,A)=>(u(),F(h(an),{visible:e.value,"onUpdate:visible":A[0]||(A[0]=U=>e.value=U),modal:"",header:t.target?.title??"Превью",style:{width:"min(820px, 96vw)"}},{default:v(()=>[c("div",Io,[l.value?(u(),d("video",{key:l.value,src:l.value,autoplay:"",loop:"",muted:"",playsinline:"",class:"h-full w-full"},null,8,So)):w("",!0),s.value?(u(),d("div",Lo,[...A[1]||(A[1]=[c("i",{class:"pi pi-spin pi-spinner"},null,-1),j("Рендер превью… ",-1)])])):i.value?(u(),d("div",Vo,C(i.value),1)):w("",!0)]),c("div",Co,[c("p",Mo,[b.value?(u(),d(S,{key:0},[j("На картинке канала, с текущими настройками (ещё не сохранёнными).")],64)):(u(),d(S,{key:1},[j("В канале пока нет картинок — показано на условной заглушке.")],64))]),c("div",zo,[t.target?.kind==="chapter"||t.target?.kind==="accent"||b.value&&p.value>1?(u(),F(h(ue),{key:0,label:t.target?.kind==="chapter"||t.target?.kind==="accent"?"Другой вариант":"Другая картинка",icon:"pi pi-images",severity:"secondary",size:"small",disabled:s.value,onClick:O},null,8,["label","disabled"])):w("",!0),r(h(ue),{label:"Обновить",icon:"pi pi-refresh",severity:"secondary",size:"small",disabled:s.value,onClick:y},null,8,["disabled"])])])]),_:1},8,["visible","header"]))}}),Fo={class:"grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]"},To={class:"flex min-h-0 flex-col border-r border-line-soft"},Po={class:"flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3"},Ao={class:"min-h-0 flex-1 overflow-y-auto"},Eo=["onClick"],Do=["aria-label","onClick"],Bo={class:"min-w-0 flex-1"},Ho={class:"block truncate font-medium"},Ko={class:"block truncate text-[13px] text-ink-3"},Uo={key:0,class:"pi pi-check text-tally"},Ro={class:"p-4 text-center"},jo={key:1,class:"text-ink-3"},Go={key:2,class:"text-ink-3"},_o={class:"flex min-h-0 flex-col overflow-y-auto p-5"},No={class:"font-display text-lg"},qo={key:0,class:"mt-1 line-clamp-4 text-[13px] text-ink-3"},Wo={class:"mt-5 flex flex-col gap-4"},Zo={key:1,class:"m-auto max-w-60 text-center text-ink-3"},Xo=ot({__name:"VoicePicker",props:Pe({language:{}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:Pe(["created"],["update:visible"]),setup(t,{emit:e}){const n=Ct(t,"visible"),l=t,s=e,i=nt(),b=qe(),p=R("elevenlabs"),m=R(""),y=R(null),O=R(l.language??null),I=R([]),A=R(0),U=R(!1),E=R(!1),P=R(null),x=R(null),K=new Audio;K.onended=()=>x.value=null;const M=R({name:"",model_id:"eleven_multilingual_v2",stability:.5,similarity_boost:.75,style:0,speed:1}),B=R(!1),z=[{id:"eleven_multilingual_v2",name:"Multilingual v2 — стабильный, лучший для длинных текстов"},{id:"eleven_v3",name:"v3 — самый выразительный, больше языков"},{id:"eleven_turbo_v2_5",name:"Turbo v2.5 — быстрый и дешевле"},{id:"eleven_flash_v2_5",name:"Flash v2.5 — самый быстрый"}],ae=Q(()=>[{code:null,name:"Любой язык"},...i.meta?.languages??[]]);async function _(H=!0){E.value=!0,H&&(A.value=0);try{const D=new URLSearchParams({source:p.value,search:m.value,language:O.value??"",gender:y.value??"",page:String(A.value)}),V=await ce.get(`/api/lumean/voices?${D}`);I.value=H?V.voices:[...I.value,...V.voices],U.value=V.has_more}catch(D){b.error(D,"Каталог голосов недоступен")}finally{E.value=!1}}function L(){A.value+=1,_(!1)}function T(H){if(H.preview_url){if(x.value===H.voice_id){K.pause(),x.value=null;return}K.src=H.preview_url,K.play(),x.value=H.voice_id}}function Y(H){P.value=H;const D=O.value?` ${O.value.toUpperCase()}`:"";M.value.name=`${H.name}${D}`}async function ne(){if(P.value){B.value=!0;try{const H=await ce.post("/api/lumean/templates",{...M.value,voice_id:P.value.voice_id,language_code:O.value||null});b.ok("Голос добавлен в Lumean",H.name),s("created",H),n.value=!1}catch(H){b.error(H)}finally{B.value=!1}}}let Z;return Xe([m],()=>{window.clearTimeout(Z),Z=window.setTimeout(()=>_(),400)}),Xe([p,y,O],()=>_()),Xe(n,H=>{H&&!I.value.length&&_(),H||K.pause()}),Fn(()=>K.pause()),(H,D)=>(u(),F(h(an),{visible:n.value,"onUpdate:visible":D[10]||(D[10]=V=>n.value=V),modal:"",header:"Подбор голоса",style:{width:"min(1100px, 96vw)"},"content-style":{padding:0}},{default:v(()=>[c("div",Fo,[c("div",To,[c("div",Po,[r(h(ve),{modelValue:p.value,"onUpdate:modelValue":D[0]||(D[0]=V=>p.value=V),options:[{v:"elevenlabs",l:"ElevenLabs"},{v:"lumean",l:"Lumean"}],"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),r(h(Je),{modelValue:m.value,"onUpdate:modelValue":D[1]||(D[1]=V=>m.value=V),placeholder:"Поиск: тембр, стиль, имя",size:"small",class:"min-w-48 flex-1"},null,8,["modelValue"]),r(h(X),{modelValue:O.value,"onUpdate:modelValue":D[2]||(D[2]=V=>O.value=V),options:ae.value,"option-value":"code","option-label":"name",size:"small",class:"w-40"},null,8,["modelValue","options"]),r(h(X),{modelValue:y.value,"onUpdate:modelValue":D[3]||(D[3]=V=>y.value=V),options:[{v:null,l:"Любой пол"},{v:"male",l:"Мужской"},{v:"female",l:"Женский"}],"option-value":"v","option-label":"l",size:"small",class:"w-36"},null,8,["modelValue"])]),c("div",Ao,[(u(!0),d(S,null,le(I.value,V=>(u(),d("button",{key:V.voice_id,class:G(["flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised",P.value?.voice_id===V.voice_id?"bg-raised":""]),onClick:te=>Y(V)},[c("span",{role:"button","aria-label":x.value===V.voice_id?"Остановить":"Прослушать",class:G(["flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",[x.value===V.voice_id?"border-tally bg-tally text-tally-ink":"border-line text-ink-2 hover:border-ink-3",V.preview_url?"":"opacity-30"]]),onClick:on(te=>T(V),["stop"])},[c("i",{class:G([["pi",x.value===V.voice_id?"pi-pause":"pi-play"],"text-xs"])},null,2)],10,Do),c("span",Bo,[c("span",Ho,C(V.name),1),c("span",Ko,C([V.gender==="male"?"мужской":V.gender==="female"?"женский":"",V.age,V.accent,V.use_case,V.language].filter(Boolean).join(", ")||V.description),1)]),P.value?.voice_id===V.voice_id?(u(),d("i",Uo)):w("",!0)],10,Eo))),128)),c("div",Ro,[U.value?(u(),F(h(ue),{key:0,label:"Показать ещё",text:"",severity:"secondary",loading:E.value,onClick:L},null,8,["loading"])):E.value?(u(),d("span",jo,"Загрузка…")):I.value.length?w("",!0):(u(),d("span",Go,"Ничего не найдено. Измените фильтры."))])])]),c("div",_o,[P.value?(u(),d(S,{key:0},[c("div",No,C(P.value.name),1),P.value.description?(u(),d("p",qo,C(P.value.description),1)):w("",!0),c("div",Wo,[r(g,{label:"Название шаблона",stacked:""},{default:v(()=>[r(h(Je),{modelValue:M.value.name,"onUpdate:modelValue":D[4]||(D[4]=V=>M.value.name=V),class:"w-full"},null,8,["modelValue"])]),_:1}),r(g,{label:"Модель",stacked:""},{default:v(()=>[r(h(X),{modelValue:M.value.model_id,"onUpdate:modelValue":D[5]||(D[5]=V=>M.value.model_id=V),options:z,"option-value":"id","option-label":"name",class:"w-full"},null,8,["modelValue"])]),_:1}),r(g,{label:"Стабильность",value:M.value.stability.toFixed(2),hint:"Выше — ровнее, ниже — эмоциональнее",stacked:""},{default:v(()=>[r(h(oe),{modelValue:M.value.stability,"onUpdate:modelValue":D[6]||(D[6]=V=>M.value.stability=V),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Похожесть на оригинал",value:M.value.similarity_boost.toFixed(2),stacked:""},{default:v(()=>[r(h(oe),{modelValue:M.value.similarity_boost,"onUpdate:modelValue":D[7]||(D[7]=V=>M.value.similarity_boost=V),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Выразительность",value:M.value.style.toFixed(2),stacked:""},{default:v(()=>[r(h(oe),{modelValue:M.value.style,"onUpdate:modelValue":D[8]||(D[8]=V=>M.value.style=V),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Скорость речи",value:M.value.speed.toFixed(2),stacked:""},{default:v(()=>[r(h(oe),{modelValue:M.value.speed,"onUpdate:modelValue":D[9]||(D[9]=V=>M.value.speed=V),min:.7,max:1.2,step:.01},null,8,["modelValue"])]),_:1},8,["value"])]),r(h(ue),{class:"mt-6",label:"Создать голос",loading:B.value,disabled:!M.value.name.trim(),onClick:ne},null,8,["loading","disabled"])],64)):(u(),d("div",Zo," Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом. "))])])]),_:1},8,["visible"]))}}),Yo={class:"grid grid-cols-[13rem_minmax(0,1fr)] gap-8"},Jo={class:"sticky top-4 flex h-fit flex-col gap-0.5"},Qo=["onClick"],ea={class:"flex min-w-0 flex-col gap-7 pb-10"},ta={key:0,class:"rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad"},na={class:"flex gap-2"},ia={class:"flex gap-2"},la={class:"flex gap-2"},oa={class:"flex items-center gap-4 pt-1.5"},aa={class:"mt-2 text-[13px] text-ink-3"},sa={class:"mt-2 text-[13px] text-ink-3"},ra={class:"flex items-center gap-3"},ua={key:0,class:"mt-4 flex items-center gap-3"},da={class:"mt-2 text-[13px] leading-snug text-ink-3"},ca={class:"grid grid-cols-1 gap-2 xl:grid-cols-2"},pa=["onClick"],ha={class:"flex items-baseline justify-between gap-2"},fa={class:"font-medium"},ma={class:"tnum shrink-0 text-[13px] text-ink-3"},ba={class:"mt-0.5 block text-[13px] text-ink-3"},va={class:"flex items-center gap-3 pt-1"},ga={class:"text-[13px] text-ink-3"},ya={key:0,class:"mt-3 flex flex-wrap gap-2"},ka=["src"],wa=["onClick"],Oa={key:0,class:"flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"},xa={key:0,class:"mt-3 flex flex-col gap-2"},Ia={class:"flex flex-col gap-1.5"},Sa={key:0,class:"text-[13px] text-tally"},La={key:1,class:"text-[13px] text-ink-3"},Va={class:"flex gap-3"},Ca={class:"flex flex-wrap gap-2"},Ma=["onClick"],za=["onClick"],$a={class:"flex flex-wrap gap-2"},Fa=["onClick"],Ta=["onClick"],Pa={class:"flex items-center gap-3"},Aa={class:"flex items-center gap-3"},Ea={class:"relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]",style:{"container-type":"size"}},Da={class:"flex flex-wrap items-center gap-3"},Ba={class:"flex items-center gap-2"},Ha={class:"flex items-center gap-2"},Ka={class:"flex flex-wrap items-center gap-5"},Ua={class:"flex items-center gap-2"},Ra={key:0,class:"flex items-center gap-2"},ja={key:1,class:"flex items-center gap-2"},Ga={key:2,class:"flex items-center gap-2"},_a={class:"flex items-center gap-3"},Na={class:"flex items-center gap-3"},qa={class:"grid grid-cols-3 gap-2"},Wa={class:"flex items-center justify-between gap-1"},Za={class:"text-[13px] font-medium"},Xa={class:"text-[12px] leading-snug text-ink-3"},Ya={class:"flex flex-wrap items-center gap-3"},Ja={class:"grid grid-cols-2 gap-3"},Qa={class:"flex items-center justify-between gap-2"},es={class:"font-medium"},ts={class:"text-[13px] text-ink-3"},ns={class:"flex items-center gap-3"},is={key:1,class:"text-[13px] text-ink-3"},ls={class:"flex items-center gap-5 text-[13px] text-ink-2"},os={class:"flex items-center gap-2"},as={class:"flex items-center gap-2"},Ls=ot({__name:"SettingsForm",props:Pe({mode:{},channelId:{},projectId:{},references:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:Pe(["referencesChanged"],["update:modelValue"]),setup(t,{emit:e}){const n=Ct(t,"modelValue"),l=t,s=e,i=nt(),b=qe(),p=[{id:"voice",label:"Озвучка",icon:"pi-microphone"},{id:"scenes",label:"Сцены",icon:"pi-th-large"},{id:"images",label:"Изображения",icon:"pi-image"},{id:"llm",label:"Тексты и промпты",icon:"pi-sparkles"},{id:"render",label:"Анимация и видео",icon:"pi-video"},{id:"atmosphere",label:"Атмосфера",icon:"pi-sun"},{id:"subtitles",label:"Субтитры",icon:"pi-align-center"},{id:"chapters",label:"Заставки глав",icon:"pi-bookmark"},{id:"unique",label:"Уникализация",icon:"pi-shield"},{id:"publish",label:"Публикация",icon:"pi-youtube"}],m=R("voice"),y=R(!1),O=R(null);function I(k,a,q){O.value={kind:k,effect:a,title:q},y.value=!0}function A(){return JSON.parse(JSON.stringify({...n.value.render,atmosphere:n.value.atmosphere,chapters:n.value.chapters,subtitles:n.value.subtitles}))}const U=[["pop","Слова с отскоком","Слова выпрыгивают по одному в такт голосу, главное слово цветом"],["marker","Маркер","За словами проходит штрих текстовыделителя, пока диктор их произносит"],["stack","Лесенка слов","Каждое слово на своей строке, главное крупно, выезжают с разных сторон"],["slam","Удар","Фраза врезается в кадр, картинка коротко вздрагивает"],["underline","Подчёркивание","Слова проявляются, потом от руки подчёркивается или обводится главное"],["type","Печать","Буквы печатаются в такт голосу, с курсором"],["counter","Счётчик чисел","Только для чисел: цифра отсчитывается до значения, у процентов есть шкала"],["nameplate","Плашка с именем","Только для имён: имя и кто это, выезжают из-за цветной полосы внизу кадра"],["quote","Цитата","Только для цитат: большие кавычки, текст курсивом по словам, автор ниже"]],E=[["cinema","Кино","Сверху и снизу выезжают чёрные полосы, картинка темнеет и смягчается. Над названием с засечками разреженная надпись «Глава», буквы поднимаются по одной"],["editorial","Журнал","Огромная контурная цифра главы уходит за край кадра, строки жирного названия выезжают из-под маски, сторона кадра без героя затемняется"],["brush","Кисть","Поперёк кадра прорисовывается мазок туши с рваными краями и сухим хвостом, название лежит на нём с лёгким наклоном"],["minimal","Минимализм","Вырастает тонкая линия, из-за неё выезжают номер и название. Спокойно и аккуратно"],["clipping","Газетная вырезка","Клочок газеты с рваными краями: рубрика и заголовок. Влетает сбоку, падает сверху или подпрыгивает"],["tape","Наклейка","Цветная наклейка на полосках малярного скотча с пружинкой появляется поверх кадра"],["typewriter","Печатная машинка","Надпись и название печатаются по буквам с курсором и неровными оттисками, иногда на бумажных полосках"],["frame","Рамка","Вокруг названия прорисовывается тонкая рамка, уголки или двойная линия, внутри картинка притемняется"],["knockout","Буквы-окна","Кадр темнеет, а огромные буквы названия остаются окнами в картинку. Самый яркий вариант"]],P=[["dust","Пылинки в воздухе","Мелкие пылинки и размытые «боке» медленно плывут по кадру — как в луче света"],["breathing","Дыхание","Герой едва заметно «дышит». В 3D-параллаксе дышит только передний план, в остальных сценах — весь кадр от нижнего края"],["light_pulse","Пульсация света","Светлые места кадра медленно мягко светятся и гаснут"],["vignette_breathing","Дыхание виньетки","Затемнение по краям медленно сгущается и отпускает"],["grain_boil","Кипящее зерно","Крупное зерно, как фактура бумаги или плёнки, сменяется рывками, как в рисованной анимации. Заменяет обычное зерно уникализации"],["line_boil","Дрожание линий","Контуры чуть дрожат, будто каждый кадр перерисован от руки. Только для рисованных стилей: на фотореализме выглядит как брак"]],x=R([]),K=R(""),M=R(null),B=R(null);async function z(){try{x.value=await ce.get("/api/lumean/templates"),K.value=""}catch(k){K.value=k.message}}const ae=Q(()=>x.value.map(k=>({id:k.id,label:`${k.name}${k.model_id?` · ${k.model_id.replace("eleven_","")}`:""}`}))),_=Q(()=>Object.keys(n.value.voice.templates)),L=Q(()=>(i.meta?.languages??[]).filter(k=>!(k.code in n.value.voice.templates)));function T(){B.value&&(n.value.voice.templates={...n.value.voice.templates,[B.value]:""},B.value=null)}function Y(k){const a={...n.value.voice.templates};delete a[k],n.value.voice.templates=a,n.value.voice.master_language===k&&(n.value.voice.master_language=null)}const ne=Q(()=>{const k=i.meta?.languages??[];return _.value.length?k.filter(a=>_.value.includes(a.code)):k});async function Z(k){await z(),M.value==="__default"?n.value.voice.default_template_id=k.id:M.value&&(n.value.voice.templates={...n.value.voice.templates,[M.value]:k.id})}const H=Q({get:()=>n.value.voice.speed!=null,set:k=>n.value.voice.speed=k?1:null});function D(k){const a=n.value.scenes,q=Math.min(k,a.intro_seconds);return Math.round(q/((a.intro_min_duration+a.intro_max_duration)/2)+Math.max(0,k-q)/((a.min_duration+a.max_duration)/2))}const V=Q(()=>`Пример: ${[10,30,60].map(a=>{const q=D(a*60),o=Math.min(q,n.value.scenes.max_images);return`${a} мин → ${o}${q>o?` (сцена ≈ ${Math.round(a*60/o)} с)`:""}`}).join(", ")}`),te=Q(()=>i.meta?.image_operations??[]),he=Q(()=>te.value.find(k=>k.id===n.value.images.operation)),be=Q(()=>i.status?.fastgen?.budget??500);function Ie(k){const a=te.value.find(q=>q.id===k);return(a?.credits??4)*(n.value.images.upscale_2x&&a?.upscale?2:1)}const Ce=Q(()=>Math.floor(be.value/Ie(n.value.images.operation))),Se=Q(()=>n.value.images.model_strategy!=="single"),fn=[{v:"single",l:"Одна модель"},{v:"intro",l:"Начало качественнее"},{v:"budget",l:"По бюджету"}],mn=Q(()=>({single:"Все сцены генерируются одной моделью.",intro:"Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.",budget:"Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен."})[n.value.images.model_strategy]),Pt=k=>!!te.value.find(a=>a.id===k)?.refs,At=k=>te.value.find(a=>a.id===k)?.name??k??"",bn=Q(()=>Se.value?[n.value.images.operation,n.value.images.economy_operation]:[n.value.images.operation]),st=Q(()=>[n.value.images.operation,n.value.images.economy_operation].find(Pt)??null),vn=Q(()=>!!st.value),Et=Q(()=>{const k=bn.value.filter(a=>!Pt(a));return k.length&&st.value?k.map(At).join(", "):""}),Dt=Q(()=>te.value.map(k=>({...k,label:`${k.name} · ${k.credits} кр.`}))),gn=Q(()=>{const a=n.value.images.budget_credits||be.value,q=Ie(n.value.images.operation),o=Ie(n.value.images.economy_operation);if(q<=o)return"все 100 сцен — качественной моделью";const W=Math.max(0,Math.min(100,Math.floor((a-100*o)/(q-o))));return W>=100?"все 100 сцен — качественной моделью":`${W} качественных и ${100-W} дешёвых`}),rt=R(!1);async function yn(k){const a=k.target.files;if(!(!a?.length||!l.channelId)){rt.value=!0;try{for(const q of Array.from(a))await ce.upload(`/api/channels/${l.channelId}/references`,q);s("referencesChanged")}catch(q){b.error(q)}finally{rt.value=!1,k.target.value=""}}}async function kn(k){await ce.post(`/api/channels/${l.channelId}/references/delete`,{path:k}),s("referencesChanged")}const ut=R([]);async function wn(){try{ut.value=await ce.get("/api/fastgen/chat-models")}catch{ut.value=[{id:n.value.llm.model,name:n.value.llm.model,context:0}]}}function Bt(k,a){return k.includes(a)?k.filter(q=>q!==a):[...k,a]}const We=R([]),On=Q(()=>{const k=n.value.subtitles,a=k.size/1080*100,q=k.style==="box"?0:k.outline/1080*100*1.2;return{fontFamily:`"${k.font}", sans-serif`,fontSize:`${a}cqh`,fontWeight:k.bold?700:400,textTransform:k.uppercase?"uppercase":"none",color:k.primary_color,WebkitTextStroke:q?`${q}cqh ${k.outline_color}`:void 0,paintOrder:"stroke fill",background:k.style==="box"?`color-mix(in srgb, ${k.box_color} ${k.box_opacity*100}%, transparent)`:void 0,padding:k.style==="box"?"0.15em 0.4em":void 0,textShadow:k.shadow?`0 ${k.shadow*.15}cqh ${k.shadow*.3}cqh rgb(0 0 0 / .6)`:void 0}}),xn=Q(()=>{const k=`${n.value.subtitles.margin_v/1080*100}%`;return n.value.subtitles.position==="top"?{top:k}:n.value.subtitles.position==="middle"?{top:"45%"}:{bottom:k}});function ye(k){return k.startsWith("#")?k:`#${k}`}return Tn(async()=>{z(),wn(),We.value=await ce.get("/api/fonts").catch(()=>[])}),(k,a)=>{const q=Ge("tooltip");return u(),d("div",Yo,[c("nav",Jo,[(u(),d(S,null,le(p,o=>c("button",{key:o.id,class:G(["flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised",m.value===o.id?"bg-raised text-ink":"text-ink-2"]),onClick:W=>m.value=o.id},[c("i",{class:G([["pi",o.icon],"w-4 text-[14px]"])},null,2),j(C(o.label),1)],10,Qo)),64))]),c("div",ea,[m.value==="voice"?(u(),d(S,{key:0},[a[94]||(a[94]=c("p",{class:"text-ink-3"}," Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию. ",-1)),K.value?(u(),d("div",ta," Не удалось загрузить голоса Lumean: "+C(K.value),1)):w("",!0),t.mode==="channel"?(u(),F(g,{key:1,label:"Основной язык",hint:"На нём вставляется сценарий новых проектов, остальные языки переводятся с него"},{default:v(()=>[r(h(X),{modelValue:n.value.voice.master_language,"onUpdate:modelValue":a[0]||(a[0]=o=>n.value.voice.master_language=o),options:ne.value,"option-value":"code","option-label":"name",filter:"","show-clear":"",placeholder:"Первый язык из списка",class:"w-60"},null,8,["modelValue","options"])]),_:1})):w("",!0),r(g,{label:"Голос по умолчанию",hint:"Для языков без отдельного голоса"},{default:v(()=>[c("div",na,[r(h(X),{modelValue:n.value.voice.default_template_id,"onUpdate:modelValue":a[1]||(a[1]=o=>n.value.voice.default_template_id=o),options:ae.value,"option-value":"id","option-label":"label",filter:"","show-clear":"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","options"]),r(h(ue),{icon:"pi pi-search",label:"Подобрать",severity:"secondary",outlined:"",onClick:a[2]||(a[2]=o=>M.value="__default")})])]),_:1}),(u(!0),d(S,null,le(_.value,o=>(u(),F(g,{key:o,label:h(i).langLabel(o)},{default:v(()=>[c("div",ia,[r(h(X),{modelValue:n.value.voice.templates[o],"onUpdate:modelValue":W=>n.value.voice.templates[o]=W,options:ae.value,"option-value":"id","option-label":"label",filter:"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","onUpdate:modelValue","options"]),_e(r(h(ue),{icon:"pi pi-search",severity:"secondary",outlined:"","aria-label":"Подобрать голос",onClick:W=>M.value=o},null,8,["onClick"]),[[q,"Подобрать голос"]]),r(h(ue),{icon:"pi pi-trash",severity:"secondary",text:"","aria-label":"Убрать язык",onClick:W=>Y(o)},null,8,["onClick"])])]),_:2},1032,["label"]))),128)),r(g,{label:"Отдельный голос для языка"},{default:v(()=>[c("div",la,[r(h(X),{modelValue:B.value,"onUpdate:modelValue":a[3]||(a[3]=o=>B.value=o),options:L.value,"option-value":"code","option-label":"name",filter:"",placeholder:"Язык",class:"w-60"},null,8,["modelValue","options"]),r(h(ue),{label:"Добавить",severity:"secondary",outlined:"",disabled:!B.value,onClick:T},null,8,["disabled"])])]),_:1}),r(g,{label:"Своя скорость речи",hint:"Иначе используется скорость из шаблона",value:n.value.voice.speed?.toFixed(2)},{default:v(()=>[c("div",oa,[r(h(J),{modelValue:H.value,"onUpdate:modelValue":a[4]||(a[4]=o=>H.value=o)},null,8,["modelValue"]),n.value.voice.speed!=null?(u(),F(h(oe),{key:0,modelValue:n.value.voice.speed,"onUpdate:modelValue":a[5]||(a[5]=o=>n.value.voice.speed=o),min:.7,max:1.2,step:.01,class:"flex-1"},null,8,["modelValue"])):w("",!0)])]),_:1},8,["value"]),r(g,{label:"Озвучивать по абзацам",hint:"Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже"},{default:v(()=>[r(h(J),{modelValue:n.value.voice.paragraph_mode,"onUpdate:modelValue":a[6]||(a[6]=o=>n.value.voice.paragraph_mode=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(Xo,{visible:M.value!==null,language:M.value&&M.value!=="__default"?M.value:void 0,"onUpdate:visible":a[7]||(a[7]=o=>!o&&(M.value=null)),onCreated:Z},null,8,["visible","language"])],64)):m.value==="scenes"?(u(),d(S,{key:1},[r(g,{label:"Способ разбивки"},{default:v(()=>[r(h(ve),{modelValue:n.value.scenes.mode,"onUpdate:modelValue":a[8]||(a[8]=o=>n.value.scenes.mode=o),options:[{v:"smart",l:"По смыслу (LLM)"},{v:"auto",l:"По предложениям"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),c("p",aa,C(n.value.scenes.mode==="smart"?"Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.":"Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности."),1)]),_:1}),r(g,{label:"Чем ограничить"},{default:v(()=>[r(h(ve),{modelValue:n.value.scenes.limit_mode,"onUpdate:modelValue":a[9]||(a[9]=o=>n.value.scenes.limit_mode=o),options:[{v:"duration",l:"Длительностью сцен"},{v:"count",l:"Количеством картинок"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),c("p",sa,C(n.value.scenes.limit_mode==="count"?"Не больше заданного числа картинок на видео. Если с длительностью ниже картинок получится больше, сцены равномерно удлинятся.":"Сцены держатся в заданных секундах, число картинок зависит от длины видео."),1)]),_:1}),n.value.scenes.limit_mode==="count"?(u(),F(g,{key:0,label:"Картинок на видео",hint:`Не больше этого числа на одно видео (на каждую языковую версию со своими картинками). ${V.value}`},{default:v(()=>[r(h(ie),{modelValue:n.value.scenes.max_images,"onUpdate:modelValue":a[10]||(a[10]=o=>n.value.scenes.max_images=o),min:10,max:5e3,step:10,"show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"])):w("",!0),r(g,{label:n.value.scenes.limit_mode==="count"?"Длительность сцены, если лимит не мешает":"Длительность сцены",hint:"Сколько секунд держится одна картинка",value:`${n.value.scenes.min_duration}–${n.value.scenes.max_duration} с`},{default:v(()=>[c("div",ra,[r(h(ie),{modelValue:n.value.scenes.min_duration,"onUpdate:modelValue":a[11]||(a[11]=o=>n.value.scenes.min_duration=o),min:1,max:n.value.scenes.max_duration,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","max"]),a[95]||(a[95]=c("span",{class:"text-ink-3"},"до",-1)),r(h(ie),{modelValue:n.value.scenes.max_duration,"onUpdate:modelValue":a[12]||(a[12]=o=>n.value.scenes.max_duration=o),min:n.value.scenes.min_duration,max:60,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","min"])])]),_:1},8,["label","value"]),r(g,{label:"Быстрое начало",hint:"В первые секунды картинки меняются чаще — это удерживает зрителя",value:`${n.value.scenes.intro_seconds} с`},{default:v(()=>[r(h(oe),{modelValue:n.value.scenes.intro_seconds,"onUpdate:modelValue":a[13]||(a[13]=o=>n.value.scenes.intro_seconds=o),min:0,max:180,step:5,class:"mt-3"},null,8,["modelValue"]),n.value.scenes.intro_seconds>0?(u(),d("div",ua,[a[96]||(a[96]=c("span",{class:"text-ink-3"},"Сцены в начале",-1)),r(h(ie),{modelValue:n.value.scenes.intro_min_duration,"onUpdate:modelValue":a[14]||(a[14]=o=>n.value.scenes.intro_min_duration=o),min:1,max:n.value.scenes.intro_max_duration,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","max"]),a[97]||(a[97]=c("span",{class:"text-ink-3"},"до",-1)),r(h(ie),{modelValue:n.value.scenes.intro_max_duration,"onUpdate:modelValue":a[15]||(a[15]=o=>n.value.scenes.intro_max_duration=o),min:n.value.scenes.intro_min_duration,max:30,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","min"])])):w("",!0)]),_:1},8,["value"])],64)):m.value==="images"?(u(),d(S,{key:2},[r(g,{label:"Распределение моделей"},{default:v(()=>[r(h(ve),{modelValue:n.value.images.model_strategy,"onUpdate:modelValue":a[16]||(a[16]=o=>n.value.images.model_strategy=o),options:fn,"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),c("p",da,C(mn.value),1)]),_:1}),r(g,{label:Se.value?"Качественная модель":"Модель",hint:`≈ ${Ce.value} картинок в час на вашем тарифе`},{default:v(()=>[c("div",ca,[(u(!0),d(S,null,le(te.value,o=>(u(),d("button",{key:o.id,class:G(["rounded-md border px-3.5 py-2.5 text-left transition-colors",n.value.images.operation===o.id?"border-tally bg-tally/10":"border-line hover:border-ink-3"]),onClick:W=>n.value.images.operation=o.id},[c("span",ha,[c("span",fa,C(o.name),1),c("span",ma,C(o.credits)+" кр.",1)]),c("span",ba,C(o.note),1)],10,pa))),128))])]),_:1},8,["label","hint"]),Se.value?(u(),d(S,{key:0},[r(g,{label:"Дешёвая модель",hint:`Для остальных сцен · ≈ ${Math.floor(be.value/Ie(n.value.images.economy_operation))} картинок в час`},{default:v(()=>[r(h(X),{modelValue:n.value.images.economy_operation,"onUpdate:modelValue":a[17]||(a[17]=o=>n.value.images.economy_operation=o),options:Dt.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),_:1},8,["hint"]),n.value.images.model_strategy==="intro"?(u(),F(g,{key:0,label:"Качественная модель первые",hint:"Минут от начала каждого видео"},{default:v(()=>[r(h(ie),{modelValue:n.value.images.premium_minutes,"onUpdate:modelValue":a[18]||(a[18]=o=>n.value.images.premium_minutes=o),min:.5,max:60,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" мин","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1})):(u(),F(g,{key:1,label:"Бюджет на проект",hint:`Кредитов на все картинки проекта. 0 — один час тарифа (${be.value} кр.). Для 10-минутного видео: ${gn.value}`},{default:v(()=>[r(h(ie),{modelValue:n.value.images.budget_credits,"onUpdate:modelValue":a[19]||(a[19]=o=>n.value.images.budget_credits=o),min:0,step:50,suffix:" кр.","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"]))],64)):w("",!0),he.value?.upscale?(u(),F(g,{key:1,label:"Увеличение 2×",hint:"Чётче при зуме и в 1440p/4K, но вдвое дороже"},{default:v(()=>[r(h(J),{modelValue:n.value.images.upscale_2x,"onUpdate:modelValue":a[20]||(a[20]=o=>n.value.images.upscale_2x=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):w("",!0),r(g,{label:"Стиль канала",hint:"Добавляется к каждому промпту: техника, свет, цвет, настроение"},{default:v(()=>[r(h(Oe),{modelValue:n.value.images.style_prompt,"onUpdate:modelValue":a[21]||(a[21]=o=>n.value.images.style_prompt=o),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(g,{label:"Чего не должно быть",hint:"Перечислите через запятую"},{default:v(()=>[r(h(Oe),{modelValue:n.value.images.avoid,"onUpdate:modelValue":a[22]||(a[22]=o=>n.value.images.avoid=o),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1}),r(g,{label:"Референсы стиля",hint:t.mode==="channel"?"Примеры картинок в нужном стиле — отправляются вместе с каждым запросом":"Задаются в настройках канала"},{default:v(()=>[c("div",va,[r(h(J),{modelValue:n.value.images.use_references,"onUpdate:modelValue":a[23]||(a[23]=o=>n.value.images.use_references=o),disabled:!he.value?.refs},null,8,["modelValue","disabled"]),c("span",ga,C(he.value?.refs?"Использовать референсы":"Эта модель не принимает референсы"),1)]),t.references?.length||t.mode==="channel"?(u(),d("div",ya,[(u(!0),d(S,null,le(t.references,o=>(u(),d("div",{key:o.path,class:"group relative h-20 w-32 overflow-hidden rounded-md border border-line"},[c("img",{src:o.url,alt:"Референс стиля",class:"h-full w-full object-cover"},null,8,ka),t.mode==="channel"?(u(),d("button",{key:0,class:"absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex","aria-label":"Удалить референс",onClick:W=>kn(o.path)},[...a[98]||(a[98]=[c("i",{class:"pi pi-times text-xs"},null,-1)])],8,wa)):w("",!0)]))),128)),t.mode==="channel"?(u(),d("label",Oa,[c("i",{class:G(["pi",rt.value?"pi-spin pi-spinner":"pi-plus"])},null,2),a[99]||(a[99]=j("Добавить ",-1)),c("input",{type:"file",accept:"image/*",multiple:"",class:"hidden",onChange:yn},null,32)])):w("",!0)])):w("",!0)]),_:1},8,["hint"]),r(g,{label:"Референсы персонажей",hint:"Повторяющиеся герои получают портрет-образец, который отправляется со всеми сценами, где они есть: лицо, причёска и одежда не меняются от кадра к кадру"},{default:v(()=>[r(h(J),{modelValue:n.value.images.character_refs,"onUpdate:modelValue":a[24]||(a[24]=o=>n.value.images.character_refs=o),class:"mt-1.5"},null,8,["modelValue"]),n.value.images.character_refs?(u(),d("div",xa,[c("label",Ia,[a[100]||(a[100]=c("span",{class:"text-[13px] text-ink-2"},"Модель для портретов",-1)),r(h(X),{modelValue:n.value.images.character_operation,"onUpdate:modelValue":a[25]||(a[25]=o=>n.value.images.character_operation=o),options:Dt.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),vn.value?Et.value?(u(),d("p",La,C(Et.value)+" не принимает референсы — сцены с персонажами сделает "+C(At(st.value))+". ",1)):w("",!0):(u(),d("p",Sa," Ни одна из выбранных моделей не принимает референсы — портреты не будут учитываться. Выберите, например, Nano Banana 2. "))])):w("",!0)]),_:1}),r(g,{label:"Продолжение кадра",hint:"Когда рассказ остаётся в той же ситуации и меняется только деталь, следующая картинка рисуется из предыдущей: место, люди и ракурс сохраняются, меняется только нужное. LLM отмечает такие сцены при создании промптов, отметку можно поменять у сцены"},{default:v(()=>[r(h(J),{modelValue:n.value.images.scene_continuity,"onUpdate:modelValue":a[26]||(a[26]=o=>n.value.images.scene_continuity=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(g,{label:"Водяные знаки",hint:"Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется"},{default:v(()=>[r(h(X),{modelValue:n.value.images.watermark_fix,"onUpdate:modelValue":a[27]||(a[27]=o=>n.value.images.watermark_fix=o),options:[{v:"auto",l:"Удалять автоматически"},{v:"crop",l:"Обрезать угол"},{v:"none",l:"Не трогать"}],"option-value":"v","option-label":"l",class:"w-64"},null,8,["modelValue"])]),_:1}),r(g,{label:"Исправлять отклонённые промпты",hint:"Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит"},{default:v(()=>[r(h(J),{modelValue:n.value.images.auto_fix_rejected,"onUpdate:modelValue":a[28]||(a[28]=o=>n.value.images.auto_fix_rejected=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(g,{label:"Попыток на картинку"},{default:v(()=>[r(h(ie),{modelValue:n.value.images.max_attempts,"onUpdate:modelValue":a[29]||(a[29]=o=>n.value.images.max_attempts=o),min:1,max:6,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):m.value==="llm"?(u(),d(S,{key:3},[r(g,{label:"Модель",hint:"Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком"},{default:v(()=>[r(h(X),{modelValue:n.value.llm.model,"onUpdate:modelValue":a[30]||(a[30]=o=>n.value.llm.model=o),options:ut.value,"option-value":"id","option-label":"name",filter:"",class:"w-80"},null,8,["modelValue","options"])]),_:1}),r(g,{label:"Тематика канала",hint:"О чём канал и для кого — помогает точнее подбирать образы и названия"},{default:v(()=>[r(h(Oe),{modelValue:n.value.llm.niche,"onUpdate:modelValue":a[31]||(a[31]=o=>n.value.llm.niche=o),"auto-resize":"",rows:"2",class:"w-full",placeholder:"Например: психология отношений для женщин 30–50 лет"},null,8,["modelValue"])]),_:1}),r(g,{label:"Указания для промптов",hint:"Постоянные правила для картинок канала"},{default:v(()=>[r(h(Oe),{modelValue:n.value.llm.prompt_instructions,"onUpdate:modelValue":a[32]||(a[32]=o=>n.value.llm.prompt_instructions=o),"auto-resize":"",rows:"3",class:"w-full",placeholder:"Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"},null,8,["modelValue"])]),_:1}),r(g,{label:"Креативность",value:n.value.llm.temperature.toFixed(1),hint:"Выше — разнообразнее образы, ниже — точнее по тексту"},{default:v(()=>[r(h(oe),{modelValue:n.value.llm.temperature,"onUpdate:modelValue":a[33]||(a[33]=o=>n.value.llm.temperature=o),min:0,max:1.2,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):m.value==="render"?(u(),d(S,{key:4},[r(g,{label:"Разрешение и частота"},{default:v(()=>[c("div",Va,[r(h(X),{modelValue:n.value.render.resolution,"onUpdate:modelValue":a[34]||(a[34]=o=>n.value.render.resolution=o),options:[{v:"1080p",l:"1920×1080 (Full HD)"},{v:"1440p",l:"2560×1440 (2K)"},{v:"2160p",l:"3840×2160 (4K)"}],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue"]),r(h(X),{modelValue:n.value.render.fps,"onUpdate:modelValue":a[35]||(a[35]=o=>n.value.render.fps=o),options:[24,25,30,60],class:"w-28"},null,8,["modelValue"])]),a[101]||(a[101]=c("p",{class:"mt-2 text-[13px] text-ink-3"},"1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.",-1))]),_:1}),r(g,{label:"Движение камеры",hint:"Для каждой сцены выбирается случайно из отмеченных. ▶ — превью с текущей интенсивностью"},{default:v(()=>[c("div",Ca,[(u(!0),d(S,null,le(h(i).meta?.effects,o=>(u(),d("span",{key:o.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.motion_effects.includes(o.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[c("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:W=>n.value.render.motion_effects=Bt(n.value.render.motion_effects,o.id)},C(o.name),9,Ma),c("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:W=>I("motion",o.id,`Движение камеры: ${o.name}`)},[...a[102]||(a[102]=[c("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,za)],2))),128))])]),_:1}),r(g,{label:"Интенсивность движения",value:`${Math.round(n.value.render.motion_intensity*100)}%`},{default:v(()=>[r(h(oe),{modelValue:n.value.render.motion_intensity,"onUpdate:modelValue":a[36]||(a[36]=o=>n.value.render.motion_intensity=o),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Крупные планы по фразам",hint:"Внутри сцены монтаж чередует общий план и более крупный план героя, склейки — на паузах в речи. Новые картинки не нужны"},{default:v(()=>[r(h(J),{modelValue:n.value.render.phrase_cuts,"onUpdate:modelValue":a[37]||(a[37]=o=>n.value.render.phrase_cuts=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.render.motion_effects.includes("parallax")?(u(),F(g,{key:0,label:"Размытие фона",hint:"3D-параллакс: фон за героем мягко размыт, как при съёмке на длиннофокусный объектив"},{default:v(()=>[r(h(J),{modelValue:n.value.render.depth_of_field,"onUpdate:modelValue":a[38]||(a[38]=o=>n.value.render.depth_of_field=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):w("",!0),r(g,{label:"Переходы"},{default:v(()=>[c("div",$a,[(u(!0),d(S,null,le(h(i).meta?.transitions,o=>(u(),d("span",{key:o.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.transitions.includes(o.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[c("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:W=>n.value.render.transitions=Bt(n.value.render.transitions,o.id)},C(o.name),9,Fa),c("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:W=>I("transition",o.id,`Переход: ${o.name}`)},[...a[103]||(a[103]=[c("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,Ta)],2))),128))])]),_:1}),r(g,{label:"Длительность перехода",value:`${n.value.render.transition_duration.toFixed(1)} с`},{default:v(()=>[r(h(oe),{modelValue:n.value.render.transition_duration,"onUpdate:modelValue":a[39]||(a[39]=o=>n.value.render.transition_duration=o),min:.2,max:1.5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Доля простых склеек",value:`${Math.round(n.value.render.cut_ratio*100)}%`,hint:"Без эффекта перехода — так монтаж выглядит естественнее"},{default:v(()=>[r(h(oe),{modelValue:n.value.render.cut_ratio,"onUpdate:modelValue":a[40]||(a[40]=o=>n.value.render.cut_ratio=o),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Появление и затухание"},{default:v(()=>[c("div",Pa,[r(h(ie),{modelValue:n.value.render.fade_in,"onUpdate:modelValue":a[41]||(a[41]=o=>n.value.render.fade_in=o),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(h(ie),{modelValue:n.value.render.fade_out,"onUpdate:modelValue":a[42]||(a[42]=o=>n.value.render.fade_out=o),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(g,{label:"Качество кодирования"},{default:v(()=>[r(h(ve),{modelValue:n.value.render.quality,"onUpdate:modelValue":a[43]||(a[43]=o=>n.value.render.quality=o),options:[{v:"max",l:"Максимум"},{v:"high",l:"Высокое"},{v:"balanced",l:"Баланс"},{v:"fast",l:"Быстро"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(g,{label:"Ограничение битрейта",hint:"YouTube всё равно пережимает видео. При 12 Мбит/с качество на глаз то же, а ролики с зерном и 3D весят вдвое меньше"},{default:v(()=>[r(h(ve),{modelValue:n.value.render.max_bitrate,"onUpdate:modelValue":a[44]||(a[44]=o=>n.value.render.max_bitrate=o),options:[{v:8,l:"8 Мбит/с"},{v:12,l:"12 Мбит/с"},{v:0,l:"Без ограничения"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(g,{label:"Энкодер",hint:"Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее"},{default:v(()=>[r(h(X),{modelValue:n.value.render.encoder,"onUpdate:modelValue":a[45]||(a[45]=o=>n.value.render.encoder=o),options:[{v:"auto",l:"Автоматически"},...(h(i).meta?.encoders??[]).map(o=>({v:o,l:o}))],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(g,{label:"Громкость",hint:"YouTube нормализует к −14 LUFS",value:`${n.value.render.loudness} LUFS`},{default:v(()=>[r(h(oe),{modelValue:n.value.render.loudness,"onUpdate:modelValue":a[46]||(a[46]=o=>n.value.render.loudness=o),min:-24,max:-9,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Процессов рендера",hint:"0 — подобрать автоматически по числу ядер"},{default:v(()=>[r(h(ie),{modelValue:n.value.render.workers,"onUpdate:modelValue":a[47]||(a[47]=o=>n.value.render.workers=o),min:0,max:16,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):m.value==="atmosphere"?(u(),d(S,{key:5},[a[104]||(a[104]=c("p",{class:"text-ink-3"}," Едва заметная жизнь в статичной картинке. Каждый рендер получает свой ритм, так что эффекты ещё и уникализируют видео. Зерно и дрожание линий заметно увеличивают размер файла. ",-1)),c("div",null,[r(h(ue),{label:"Превью всех включённых",icon:"pi pi-play",severity:"secondary",size:"small",disabled:!P.some(o=>n.value.atmosphere[o[0]]),onClick:a[48]||(a[48]=o=>I("atmosphere","all","Атмосфера: все включённые эффекты"))},null,8,["disabled"])]),(u(),d(S,null,le(P,o=>(u(),d(S,{key:o[0]},[r(g,{label:o[1],hint:o[2]},{default:v(()=>[c("div",Aa,[r(h(J),{modelValue:n.value.atmosphere[o[0]],"onUpdate:modelValue":W=>n.value.atmosphere[o[0]]=W,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"]),r(h(ue),{label:"Превью",icon:"pi pi-play",severity:"secondary",size:"small",text:"",class:"mt-1",onClick:W=>I("atmosphere",o[0],`Атмосфера: ${o[1]}`)},null,8,["onClick"])])]),_:2},1032,["label","hint"]),n.value.atmosphere[o[0]]?(u(),F(g,{key:0,label:"Сила",value:`${Math.round(n.value.atmosphere[`${o[0]}_strength`]*100)}%`},{default:v(()=>[r(h(oe),{modelValue:n.value.atmosphere[`${o[0]}_strength`],"onUpdate:modelValue":W=>n.value.atmosphere[`${o[0]}_strength`]=W,min:.05,max:1,step:.05,class:"mt-3"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["value"])):w("",!0)],64))),64)),n.value.atmosphere.line_boil||n.value.atmosphere.grain_boil?(u(),F(g,{key:0,label:"Частота «кипения»",hint:"Как часто перерисовываются линии и зерно"},{default:v(()=>[r(h(ve),{modelValue:n.value.atmosphere.boil_hold,"onUpdate:modelValue":a[49]||(a[49]=o=>n.value.atmosphere.boil_hold=o),options:[{v:2,l:"Быстро (на двойках)"},{v:3,l:"Классика (на тройках)"},{v:4,l:"Медленно"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1})):w("",!0)],64)):m.value==="subtitles"?(u(),d(S,{key:6},[r(g,{label:"Вшивать субтитры в видео",hint:"Файл .srt для загрузки на YouTube создаётся всегда"},{default:v(()=>[r(h(J),{modelValue:n.value.subtitles.enabled,"onUpdate:modelValue":a[50]||(a[50]=o=>n.value.subtitles.enabled=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.enabled?(u(),d(S,{key:0},[c("div",Ea,[c("div",{class:"absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight",style:dt(xn.value)},[c("span",{style:dt(On.value)},[n.value.subtitles.style==="karaoke"?(u(),d(S,{key:0},[c("span",{style:dt({color:n.value.subtitles.highlight_color})},"Так выглядят",4),a[105]||(a[105]=j(" субтитры",-1)),a[106]||(a[106]=c("br",null,null,-1)),a[107]||(a[107]=j("в вашем видео ",-1))],64)):(u(),d(S,{key:1},[a[108]||(a[108]=j("Так выглядят субтитры",-1)),a[109]||(a[109]=c("br",null,null,-1)),a[110]||(a[110]=j("в вашем видео",-1))],64))],4)],4)]),r(g,{label:"Стиль"},{default:v(()=>[r(h(ve),{modelValue:n.value.subtitles.style,"onUpdate:modelValue":a[51]||(a[51]=o=>n.value.subtitles.style=o),options:[{v:"plain",l:"Обводка"},{v:"karaoke",l:"Подсветка слов"},{v:"box",l:"Плашка"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(g,{label:"Шрифт",hint:"Свои шрифты положите в папку data/fonts"},{default:v(()=>[c("div",Da,[r(h(X),{modelValue:n.value.subtitles.font,"onUpdate:modelValue":a[52]||(a[52]=o=>n.value.subtitles.font=o),options:We.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(h(ie),{modelValue:n.value.subtitles.size,"onUpdate:modelValue":a[53]||(a[53]=o=>n.value.subtitles.size=o),min:20,max:140,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"]),c("label",Ba,[r(h(J),{modelValue:n.value.subtitles.bold,"onUpdate:modelValue":a[54]||(a[54]=o=>n.value.subtitles.bold=o)},null,8,["modelValue"]),a[111]||(a[111]=j("Жирный",-1))]),c("label",Ha,[r(h(J),{modelValue:n.value.subtitles.uppercase,"onUpdate:modelValue":a[55]||(a[55]=o=>n.value.subtitles.uppercase=o)},null,8,["modelValue"]),a[112]||(a[112]=j("Заглавные",-1))])])]),_:1}),r(g,{label:"Цвета"},{default:v(()=>[c("div",Ka,[c("label",Ua,[r(h(ge),{"model-value":n.value.subtitles.primary_color.slice(1),"onUpdate:modelValue":a[56]||(a[56]=o=>n.value.subtitles.primary_color=ye(o))},null,8,["model-value"]),a[113]||(a[113]=j("Текст ",-1))]),n.value.subtitles.style==="karaoke"?(u(),d("label",Ra,[r(h(ge),{"model-value":n.value.subtitles.highlight_color.slice(1),"onUpdate:modelValue":a[57]||(a[57]=o=>n.value.subtitles.highlight_color=ye(o))},null,8,["model-value"]),a[114]||(a[114]=j("Подсветка ",-1))])):w("",!0),n.value.subtitles.style!=="box"?(u(),d("label",ja,[r(h(ge),{"model-value":n.value.subtitles.outline_color.slice(1),"onUpdate:modelValue":a[58]||(a[58]=o=>n.value.subtitles.outline_color=ye(o))},null,8,["model-value"]),a[115]||(a[115]=j("Обводка ",-1))])):(u(),d("label",Ga,[r(h(ge),{"model-value":n.value.subtitles.box_color.slice(1),"onUpdate:modelValue":a[59]||(a[59]=o=>n.value.subtitles.box_color=ye(o))},null,8,["model-value"]),a[116]||(a[116]=j("Плашка ",-1))]))])]),_:1}),n.value.subtitles.style==="box"?(u(),F(g,{key:0,label:"Прозрачность плашки",value:`${Math.round(n.value.subtitles.box_opacity*100)}%`},{default:v(()=>[r(h(oe),{modelValue:n.value.subtitles.box_opacity,"onUpdate:modelValue":a[60]||(a[60]=o=>n.value.subtitles.box_opacity=o),min:.1,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])):(u(),F(g,{key:1,label:"Толщина обводки",value:n.value.subtitles.outline.toFixed(1)},{default:v(()=>[r(h(oe),{modelValue:n.value.subtitles.outline,"onUpdate:modelValue":a[61]||(a[61]=o=>n.value.subtitles.outline=o),min:0,max:8,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])),r(g,{label:"Положение"},{default:v(()=>[c("div",_a,[r(h(ve),{modelValue:n.value.subtitles.position,"onUpdate:modelValue":a[62]||(a[62]=o=>n.value.subtitles.position=o),options:[{v:"bottom",l:"Внизу"},{v:"middle",l:"По центру"},{v:"top",l:"Вверху"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),r(h(ie),{modelValue:n.value.subtitles.margin_v,"onUpdate:modelValue":a[63]||(a[63]=o=>n.value.subtitles.margin_v=o),min:0,max:400,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(g,{label:"Длина строки",hint:"Символов в строке и строк на экране"},{default:v(()=>[c("div",Na,[r(h(ie),{modelValue:n.value.subtitles.max_chars_per_line,"onUpdate:modelValue":a[64]||(a[64]=o=>n.value.subtitles.max_chars_per_line=o),min:12,max:80,"show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(h(ie),{modelValue:n.value.subtitles.max_lines,"onUpdate:modelValue":a[65]||(a[65]=o=>n.value.subtitles.max_lines=o),min:1,max:3,"show-buttons":"",class:"w-28"},null,8,["modelValue"])])]),_:1})],64)):w("",!0),r(g,{label:"Ключевые фразы на экране",hint:"Нейросеть находит то, что стоит выделить: цифры, имена, цитаты, термины, сильные утверждения. На экране появляются слова самого диктора, каждое ровно тогда, когда он его произносит. Работает и без субтитров"},{default:v(()=>[r(h(J),{modelValue:n.value.subtitles.accents,"onUpdate:modelValue":a[66]||(a[66]=o=>n.value.subtitles.accents=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.accents?(u(),d(S,{key:1},[r(g,{label:"Частота",value:`${n.value.subtitles.accents_per_minute.toFixed(1)} в минуту`,hint:"Примерно столько фраз на минуту видео; между фразами всегда есть пауза"},{default:v(()=>[r(h(oe),{modelValue:n.value.subtitles.accents_per_minute,"onUpdate:modelValue":a[67]||(a[67]=o=>n.value.subtitles.accents_per_minute=o),min:.3,max:4,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(g,{label:"Стили",hint:"Пусто — все. Каждой фразе подбирается стиль под её тип (число, имя, цитата, термин, утверждение), подряд один стиль не повторяется. Оформление (регистр, наклон, цвета) меняется от ролика к ролику"},{default:v(()=>[r(h(yt),{modelValue:n.value.subtitles.accent_styles,"onUpdate:modelValue":a[68]||(a[68]=o=>n.value.subtitles.accent_styles=o),options:U.map(o=>({id:o[0],name:o[1]})),"option-value":"id","option-label":"name",placeholder:"Все стили","max-selected-labels":3,"selected-items-label":"{0} стилей",class:"w-72"},null,8,["modelValue","options"])]),_:1}),c("div",qa,[(u(),d(S,null,le(U,o=>c("div",{key:o[0],class:G(["flex flex-col gap-1 rounded-md border p-2.5",!n.value.subtitles.accent_styles.length||n.value.subtitles.accent_styles.includes(o[0])?"border-line-soft":"border-line-soft opacity-50"])},[c("div",Wa,[c("span",Za,C(o[1]),1),r(h(ue),{icon:"pi pi-play",severity:"secondary",size:"small",text:"",rounded:"","aria-label":`Превью: ${o[1]}`,onClick:W=>I("accent",o[0],`Ключевая фраза: ${o[1]}`)},null,8,["aria-label","onClick"])]),c("span",Xa,C(o[2]),1)],2)),64))]),r(g,{label:"Шрифт и цвет фраз",hint:"«Шрифт стиля» — у каждого стиля свой: жирный рубленый, курсив для цитат, машинописный для печати"},{default:v(()=>[c("div",Ya,[r(h(X),{modelValue:n.value.subtitles.accent_font,"onUpdate:modelValue":a[69]||(a[69]=o=>n.value.subtitles.accent_font=o),options:[{id:"",name:"Шрифт стиля"},...We.value.map(o=>({id:o,name:o}))],"option-value":"id","option-label":"name",class:"w-56"},null,8,["modelValue","options"]),r(h(ge),{"model-value":n.value.subtitles.accent_color.slice(1),"onUpdate:modelValue":a[70]||(a[70]=o=>n.value.subtitles.accent_color=ye(o))},null,8,["model-value"])])]),_:1})],64)):w("",!0)],64)):m.value==="chapters"?(u(),d(S,{key:7},[a[118]||(a[118]=c("p",{class:"text-ink-3"}," Когда в ролике начинается новая глава, поверх кадра на несколько секунд появляется её название. Озвучка при этом не прерывается. Главы и короткие названия для экрана подбирает нейросеть. Таймкоды в описании YouTube совпадают с заставками. ",-1)),r(g,{label:"Заставки глав"},{default:v(()=>[r(h(J),{modelValue:n.value.chapters.enabled,"onUpdate:modelValue":a[71]||(a[71]=o=>n.value.chapters.enabled=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.chapters.enabled?(u(),d(S,{key:0},[r(g,{label:"Дизайн",hint:"«Разные» — для каждого ролика свой дизайн из выбранных. У каждого дизайна есть варианты (шрифт, раскладка, цвета, появление), они меняются от ролика к ролику. Сторона кадра выбирается так, чтобы не закрывать героя"},{default:v(()=>[r(h(X),{modelValue:n.value.chapters.style,"onUpdate:modelValue":a[72]||(a[72]=o=>n.value.chapters.style=o),options:[{id:"auto",name:"Разные для каждого ролика"},...E.map(o=>({id:o[0],name:o[1]}))],"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),n.value.chapters.style==="auto"?(u(),F(g,{key:0,label:"Из каких выбирать",hint:"Пусто — из всех"},{default:v(()=>[r(h(yt),{modelValue:n.value.chapters.pool,"onUpdate:modelValue":a[73]||(a[73]=o=>n.value.chapters.pool=o),options:E.map(o=>({id:o[0],name:o[1]})),"option-value":"id","option-label":"name",placeholder:"Все дизайны","max-selected-labels":3,"selected-items-label":"{0} дизайнов",class:"w-72"},null,8,["modelValue","options"])]),_:1})):w("",!0),a[117]||(a[117]=c("p",{class:"text-[13px] text-ink-3"},"В превью кнопка «Другой вариант» показывает тот же дизайн в другом варианте и на другой картинке.",-1)),c("div",Ja,[(u(),d(S,null,le(E,o=>c("div",{key:o[0],class:G(["flex flex-col gap-2 rounded-md border p-3",n.value.chapters.style===o[0]?"border-tally/60 bg-tally/[0.04]":"border-line-soft"])},[c("div",Qa,[c("span",es,C(o[1]),1),r(h(ue),{label:"Превью",icon:"pi pi-play",severity:"secondary",size:"small",text:"",onClick:W=>I("chapter",o[0],`Заставка главы: ${o[1]}`)},null,8,["onClick"])]),c("span",ts,C(o[2]),1)],2)),64))]),r(g,{label:"Надпись над названием"},{default:v(()=>[r(h(X),{modelValue:n.value.chapters.kicker,"onUpdate:modelValue":a[74]||(a[74]=o=>n.value.chapters.kicker=o),options:[{id:"word",name:"ГЛАВА 2"},{id:"roman",name:"ГЛАВА II"},{id:"none",name:"Без надписи"}],"option-value":"id","option-label":"name",class:"w-56"},null,8,["modelValue"])]),_:1}),r(g,{label:"Шрифт названия",hint:"Пусто — шрифт дизайна (с засечками в «Кино», жирный в «Журнале» и «Кисти»). Свои шрифты — в папку data/fonts"},{default:v(()=>[r(h(X),{modelValue:n.value.chapters.font,"onUpdate:modelValue":a[75]||(a[75]=o=>n.value.chapters.font=o),options:[{id:"",name:"Шрифт дизайна"},...We.value.map(o=>({id:o,name:o}))],"option-value":"id","option-label":"name",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(g,{label:"Цвет акцента",hint:"Надпись, линии, цифра, мазок кисти. По умолчанию у каждого дизайна свой"},{default:v(()=>[c("div",ns,[r(h(J),{"model-value":!!n.value.chapters.color,"onUpdate:modelValue":a[76]||(a[76]=o=>n.value.chapters.color=o?"#E3C58B":"")},null,8,["model-value"]),n.value.chapters.color?(u(),F(h(ge),{key:0,"model-value":n.value.chapters.color.slice(1),"onUpdate:modelValue":a[77]||(a[77]=o=>n.value.chapters.color=ye(o))},null,8,["model-value"])):(u(),d("span",is,"цвет дизайна"))])]),_:1}),r(g,{label:"Длительность",value:`${n.value.chapters.duration.toFixed(1)} с`},{default:v(()=>[r(h(oe),{modelValue:n.value.chapters.duration,"onUpdate:modelValue":a[78]||(a[78]=o=>n.value.chapters.duration=o),min:2.5,max:5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):w("",!0)],64)):m.value==="unique"?(u(),d(S,{key:8},[a[119]||(a[119]=c("p",{class:"text-ink-3"}," Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов, тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными. ",-1)),r(g,{label:"Уникализация"},{default:v(()=>[r(h(J),{modelValue:n.value.unique.enabled,"onUpdate:modelValue":a[79]||(a[79]=o=>n.value.unique.enabled=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.unique.enabled?(u(),d(S,{key:0},[r(g,{label:"Сила",value:`${Math.round(n.value.unique.strength*100)}%`},{default:v(()=>[r(h(oe),{modelValue:n.value.unique.strength,"onUpdate:modelValue":a[80]||(a[80]=o=>n.value.unique.strength=o),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),(u(),d(S,null,le([["color_jitter","Цветокоррекция","Яркость, контраст, насыщенность и температура"],["film_grain","Плёночное зерно","Едва заметный шум, разный в каждом рендере"],["vignette","Виньетка","Мягкое затемнение по краям"],["micro_zoom","Микрозум и сдвиг","Кадр чуть иначе обрезан"],["audio_eq","Эквализация звука","Неслышимые изменения тембра ±0.6 дБ"],["strip_metadata","Очистка метаданных","Убирает служебную информацию из файла"]],o=>r(g,{key:o[0],label:o[1],hint:o[2]},{default:v(()=>[r(h(J),{modelValue:n.value.unique[o[0]],"onUpdate:modelValue":W=>n.value.unique[o[0]]=W,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"])),64))],64)):w("",!0)],64)):m.value==="publish"?(u(),d(S,{key:9},[r(g,{label:"Создавать в конвейере",hint:"Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео"},{default:v(()=>[r(h(J),{modelValue:n.value.publish.enabled,"onUpdate:modelValue":a[81]||(a[81]=o=>n.value.publish.enabled=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(g,{label:"Вариантов названия"},{default:v(()=>[r(h(ie),{modelValue:n.value.publish.title_variants,"onUpdate:modelValue":a[82]||(a[82]=o=>n.value.publish.title_variants=o),min:1,max:10,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(g,{label:"Тегов"},{default:v(()=>[r(h(ie),{modelValue:n.value.publish.tags_count,"onUpdate:modelValue":a[83]||(a[83]=o=>n.value.publish.tags_count=o),min:3,max:40,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(g,{label:"Главы в описании",hint:"Таймкоды разделов по абзацам сценария"},{default:v(()=>[r(h(J),{modelValue:n.value.publish.with_chapters,"onUpdate:modelValue":a[84]||(a[84]=o=>n.value.publish.with_chapters=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(g,{label:"Подпись в конце описания",hint:"Ссылки, соцсети, дисклеймеры"},{default:v(()=>[r(h(Oe),{modelValue:n.value.publish.description_footer,"onUpdate:modelValue":a[85]||(a[85]=o=>n.value.publish.description_footer=o),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(g,{label:"Обложек"},{default:v(()=>[r(h(ie),{modelValue:n.value.publish.thumbnail_count,"onUpdate:modelValue":a[86]||(a[86]=o=>n.value.publish.thumbnail_count=o),min:1,max:4,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(g,{label:"Модель для обложек"},{default:v(()=>[r(h(X),{modelValue:n.value.publish.thumbnail_operation,"onUpdate:modelValue":a[87]||(a[87]=o=>n.value.publish.thumbnail_operation=o),options:te.value,"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),r(g,{label:"Заголовок на обложке",hint:"Короткая фраза крупным шрифтом, которая дополняет название"},{default:v(()=>[r(h(J),{modelValue:n.value.publish.thumbnail_text,"onUpdate:modelValue":a[88]||(a[88]=o=>n.value.publish.thumbnail_text=o),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.publish.thumbnail_text?(u(),d(S,{key:0},[r(g,{label:"Кто рисует заголовок",hint:"«Программа» — текст набирается поверх картинки жирным шрифтом с обводкой: без ошибок в буквах на любом языке. «Модель» — текст рисует нейросеть, часто с опечатками"},{default:v(()=>[r(h(X),{modelValue:n.value.publish.thumbnail_text_mode,"onUpdate:modelValue":a[89]||(a[89]=o=>n.value.publish.thumbnail_text_mode=o),options:[{id:"overlay",name:"Программа (рекомендуется)"},{id:"model",name:"Модель картинок"}],"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue"])]),_:1}),n.value.publish.thumbnail_text_mode==="overlay"?(u(),F(g,{key:0,label:"Цвета заголовка"},{default:v(()=>[c("div",ls,[c("label",os,[r(h(ge),{"model-value":n.value.publish.thumbnail_text_color.slice(1),"onUpdate:modelValue":a[90]||(a[90]=o=>n.value.publish.thumbnail_text_color=ye(o))},null,8,["model-value"]),a[120]||(a[120]=j("Текст ",-1))]),c("label",as,[r(h(ge),{"model-value":n.value.publish.thumbnail_accent_color.slice(1),"onUpdate:modelValue":a[91]||(a[91]=o=>n.value.publish.thumbnail_accent_color=ye(o))},null,8,["model-value"]),a[121]||(a[121]=j("Главное слово ",-1))])])]),_:1})):w("",!0)],64)):w("",!0),r(g,{label:"Стиль обложек"},{default:v(()=>[r(h(Oe),{modelValue:n.value.publish.thumbnail_style,"onUpdate:modelValue":a[92]||(a[92]=o=>n.value.publish.thumbnail_style=o),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1})],64)):w("",!0)]),r($o,{visible:y.value,"onUpdate:visible":a[93]||(a[93]=o=>y.value=o),target:O.value,"channel-id":t.channelId,"project-id":t.projectId,settings:A},null,8,["visible","target","channel-id","project-id"])])}}});var ss=`
    .p-drawer {
        display: flex;
        flex-direction: column;
        transform: translate3d(0px, 0px, 0px);
        position: relative;
        transition: transform 0.3s;
        background: dt('drawer.background');
        color: dt('drawer.color');
        border-style: solid;
        border-color: dt('drawer.border.color');
        box-shadow: dt('drawer.shadow');
    }

    .p-drawer-content {
        overflow-y: auto;
        flex-grow: 1;
        padding: dt('drawer.content.padding');
    }

    .p-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        padding: dt('drawer.header.padding');
    }

    .p-drawer-footer {
        padding: dt('drawer.footer.padding');
    }

    .p-drawer-title {
        font-weight: dt('drawer.title.font.weight');
        font-size: dt('drawer.title.font.size');
    }

    .p-drawer-full .p-drawer {
        transition: none;
        transform: none;
        width: 100vw !important;
        height: 100vh !important;
        max-height: 100%;
        top: 0px !important;
        left: 0px !important;
        border-width: 1px;
    }

    .p-drawer-left .p-drawer-enter-active {
        animation: p-animate-drawer-enter-left 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .p-drawer-left .p-drawer-leave-active {
        animation: p-animate-drawer-leave-left 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .p-drawer-right .p-drawer-enter-active {
        animation: p-animate-drawer-enter-right 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .p-drawer-right .p-drawer-leave-active {
        animation: p-animate-drawer-leave-right 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .p-drawer-top .p-drawer-enter-active {
        animation: p-animate-drawer-enter-top 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .p-drawer-top .p-drawer-leave-active {
        animation: p-animate-drawer-leave-top 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .p-drawer-bottom .p-drawer-enter-active {
        animation: p-animate-drawer-enter-bottom 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .p-drawer-bottom .p-drawer-leave-active {
        animation: p-animate-drawer-leave-bottom 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .p-drawer-full .p-drawer-enter-active {
        animation: p-animate-drawer-enter-full 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .p-drawer-full .p-drawer-leave-active {
        animation: p-animate-drawer-leave-full 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }
    
    .p-drawer-left .p-drawer {
        width: 20rem;
        height: 100%;
        border-inline-end-width: 1px;
    }

    .p-drawer-right .p-drawer {
        width: 20rem;
        height: 100%;
        border-inline-start-width: 1px;
    }

    .p-drawer-top .p-drawer {
        height: 10rem;
        width: 100%;
        border-block-end-width: 1px;
    }

    .p-drawer-bottom .p-drawer {
        height: 10rem;
        width: 100%;
        border-block-start-width: 1px;
    }

    .p-drawer-left .p-drawer-content,
    .p-drawer-right .p-drawer-content,
    .p-drawer-top .p-drawer-content,
    .p-drawer-bottom .p-drawer-content {
        width: 100%;
        height: 100%;
    }

    .p-drawer-open {
        display: flex;
    }

    .p-drawer-mask:dir(rtl) {
        flex-direction: row-reverse;
    }

    @keyframes p-animate-drawer-enter-left {
        from {
            transform: translate3d(-100%, 0px, 0px);
        }
    }

    @keyframes p-animate-drawer-leave-left {
        to {
            transform: translate3d(-100%, 0px, 0px);
        }
    }

    @keyframes p-animate-drawer-enter-right {
        from {
            transform: translate3d(100%, 0px, 0px);
        }
    }

    @keyframes p-animate-drawer-leave-right {
        to {
            transform: translate3d(100%, 0px, 0px);
        }
    }

    @keyframes p-animate-drawer-enter-top {
        from {
            transform: translate3d(0px, -100%, 0px);
        }
    }

    @keyframes p-animate-drawer-leave-top {
        to {
            transform: translate3d(0px, -100%, 0px);
        }
    }

    @keyframes p-animate-drawer-enter-bottom {
        from {
            transform: translate3d(0px, 100%, 0px);
        }
    }

    @keyframes p-animate-drawer-leave-bottom {
        to {
            transform: translate3d(0px, 100%, 0px);
        }
    }

    @keyframes p-animate-drawer-enter-full {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-drawer-leave-full {
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`,rs={mask:function(e){var n=e.position,l=e.modal;return{position:"fixed",height:"100%",width:"100%",left:0,top:0,display:"flex",justifyContent:n==="left"?"flex-start":n==="right"?"flex-end":"center",alignItems:n==="top"?"flex-start":n==="bottom"?"flex-end":"center",pointerEvents:l?"auto":"none"}},root:{pointerEvents:"auto"}},us={mask:function(e){var n=e.instance,l=e.props,s=["left","right","top","bottom"],i=s.find(function(b){return b===l.position});return["p-drawer-mask",{"p-overlay-mask p-overlay-mask-enter-active":l.modal,"p-drawer-open":n.containerVisible,"p-drawer-full":n.fullScreen},i?"p-drawer-".concat(i):""]},root:function(e){var n=e.instance;return["p-drawer p-component",{"p-drawer-full":n.fullScreen}]},header:"p-drawer-header",title:"p-drawer-title",pcCloseButton:"p-drawer-close-button",content:"p-drawer-content",footer:"p-drawer-footer"},ds=me.extend({name:"drawer",style:ss,classes:us,inlineStyles:rs}),cs={name:"BaseDrawer",extends:xe,props:{visible:{type:Boolean,default:!1},position:{type:String,default:"left"},header:{type:null,default:null},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},dismissable:{type:Boolean,default:!0},showCloseIcon:{type:Boolean,default:!0},closeButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}},closeIcon:{type:String,default:void 0},modal:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!1},closeOnEscape:{type:Boolean,default:!0}},style:ds,provide:function(){return{$pcDrawer:this,$parentInstance:this}}};function Re(t){"@babel/helpers - typeof";return Re=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Re(t)}function ct(t,e,n){return(e=ps(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ps(t){var e=hs(t,"string");return Re(e)=="symbol"?e:e+""}function hs(t,e){if(Re(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Re(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var fs={name:"Drawer",extends:cs,inheritAttrs:!1,emits:["update:visible","show","after-show","hide","after-hide","before-hide"],data:function(){return{containerVisible:this.visible}},container:null,mask:null,content:null,headerContainer:null,footerContainer:null,closeButton:null,outsideClickListener:null,documentKeydownListener:null,watch:{dismissable:function(e){e&&!this.modal?this.bindOutsideClickListener():this.unbindOutsideClickListener()}},updated:function(){this.visible&&(this.containerVisible=this.visible)},beforeUnmount:function(){this.disableDocumentSettings(),this.mask&&this.autoZIndex&&se.clear(this.mask),this.container=null,this.mask=null},methods:{hide:function(){this.$emit("update:visible",!1)},onEnter:function(){this.$emit("show"),this.focus(),this.bindDocumentKeyDownListener(),this.autoZIndex&&se.set("modal",this.mask,this.baseZIndex||this.$primevue.config.zIndex.modal)},onAfterEnter:function(){this.enableDocumentSettings(),this.$emit("after-show")},onBeforeLeave:function(){this.modal&&!this.isUnstyled&&pt(this.mask,"p-overlay-mask-leave-active"),this.$emit("before-hide")},onLeave:function(){this.$emit("hide")},onAfterLeave:function(){this.autoZIndex&&se.clear(this.mask),this.unbindDocumentKeyDownListener(),this.containerVisible=!1,this.disableDocumentSettings(),this.$emit("after-hide")},onMaskClick:function(e){this.dismissable&&this.modal&&this.mask===e.target&&this.hide()},focus:function(){var e=function(s){return s&&s.querySelector("[autofocus]")},n=this.$slots.header&&e(this.headerContainer);n||(n=this.$slots.default&&e(this.container),n||(n=this.$slots.footer&&e(this.footerContainer),n||(n=this.closeButton))),n&&ee(n)},enableDocumentSettings:function(){this.dismissable&&!this.modal&&this.bindOutsideClickListener(),this.blockScroll&&En()},disableDocumentSettings:function(){this.unbindOutsideClickListener(),this.blockScroll&&An()},onKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&this.hide()},containerRef:function(e){this.container=e},maskRef:function(e){this.mask=e},contentRef:function(e){this.content=e},headerContainerRef:function(e){this.headerContainer=e},footerContainerRef:function(e){this.footerContainer=e},closeButtonRef:function(e){this.closeButton=e?e.$el:void 0},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeydown,document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},isOutsideClicked:function(e){return this.container&&!this.container.contains(e.target)}},computed:{fullScreen:function(){return this.position==="full"},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return re(ct(ct(ct({"full-screen":this.position==="full"},this.position,this.position),"open",this.containerVisible),"modal",this.modal))}},directives:{focustrap:Pn},components:{Button:ue,Portal:je,TimesIcon:Vt}},ms=["data-p"],bs=["role","aria-modal","data-p"];function vs(t,e,n,l,s,i){var b=N("Button"),p=N("Portal"),m=Ge("focustrap");return u(),F(p,null,{default:v(function(){return[s.containerVisible?(u(),d("div",f({key:0,ref:i.maskRef,onMousedown:e[0]||(e[0]=function(){return i.onMaskClick&&i.onMaskClick.apply(i,arguments)}),class:t.cx("mask"),style:t.sx("mask",!0,{position:t.position,modal:t.modal}),"data-p":i.dataP},t.ptm("mask")),[r(Ne,f({name:"p-drawer",onEnter:i.onEnter,onAfterEnter:i.onAfterEnter,onBeforeLeave:i.onBeforeLeave,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave,appear:""},t.ptm("transition")),{default:v(function(){return[t.visible?_e((u(),d("div",f({key:0,ref:i.containerRef,class:t.cx("root"),style:t.sx("root"),role:t.modal?"dialog":"complementary","aria-modal":t.modal?!0:void 0,"data-p":i.dataP},t.ptmi("root")),[t.$slots.container?$(t.$slots,"container",{key:0,closeCallback:i.hide}):(u(),d(S,{key:1},[c("div",f({ref:i.headerContainerRef,class:t.cx("header")},t.ptm("header")),[$(t.$slots,"header",{class:G(t.cx("title"))},function(){return[t.header?(u(),d("div",f({key:0,class:t.cx("title")},t.ptm("title")),C(t.header),17)):w("",!0)]}),t.showCloseIcon?$(t.$slots,"closebutton",{key:0,closeCallback:i.hide},function(){return[r(b,f({ref:i.closeButtonRef,type:"button",class:t.cx("pcCloseButton"),"aria-label":i.closeAriaLabel,unstyled:t.unstyled,onClick:i.hide},t.closeButtonProps,{pt:t.ptm("pcCloseButton"),"data-pc-group-section":"iconcontainer"}),{icon:v(function(y){return[$(t.$slots,"closeicon",{},function(){return[(u(),F(de(t.closeIcon?"span":"TimesIcon"),f({class:[t.closeIcon,y.class]},t.ptm("pcCloseButton").icon),null,16,["class"]))]})]}),_:3},16,["class","aria-label","unstyled","onClick","pt"])]}):w("",!0)],16),c("div",f({ref:i.contentRef,class:t.cx("content")},t.ptm("content")),[$(t.$slots,"default")],16),t.$slots.footer?(u(),d("div",f({key:0,ref:i.footerContainerRef,class:t.cx("footer")},t.ptm("footer")),[$(t.$slots,"footer")],16)):w("",!0)],64))],16,bs)),[[m]]):w("",!0)]}),_:3},16,["onEnter","onAfterEnter","onBeforeLeave","onLeave","onAfterLeave"])],16,ms)):w("",!0)]}),_:3})}fs.render=vs;function Vs(t){const e=qe(),n=nt(),l=R(null);async function s(i,b={},p){l.value=i;try{await ce.post(`/api/tracks/${t()}/jobs/${i}`,b),n.loadActiveJobs(),p&&e.info(p)}catch(m){e.error(m)}finally{l.value=null}}return{run:s,starting:l}}function gs(t,e){if(t&&e&&typeof t=="object"&&typeof e=="object"&&!Array.isArray(t)){const n={};for(const[l,s]of Object.entries(t)){const i=gs(s,e[l]);i!==void 0&&(n[l]=i)}return Object.keys(n).length?n:void 0}return JSON.stringify(t)===JSON.stringify(e)?void 0:t}export{ni as R,rn as S,Ls as _,Os as a,fs as b,Oe as c,yt as d,X as e,gs as f,Vs as g,dn as h,Is as i,xs as m,Yn as s,Ss as u};
