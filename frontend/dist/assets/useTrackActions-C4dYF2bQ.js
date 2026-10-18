import{O as wn,P as me,Q as Re,R as wt,S as Oe,T as re,Y as Je,U as Qe,V as et,W as Fe,X as se,Z as Ot,_ as J,$ as We,a0 as $e,a1 as h,a2 as On,L as je,k as u,c as d,b as p,K as Ge,m as F,q as G,a3 as ue,f as x,t as z,j as N,w as v,e as r,a4 as Ne,J as M,F as V,r as oe,l as j,x as _e,u as tt,n as de,a5 as xn,a6 as pt,a7 as In,a8 as xt,a9 as nt,aa as It,ab as Xe,ac as Ve,ad as Me,ae as St,af as Lt,B as Ye,ag as it,ah as he,ai as Xt,aj as Ie,ak as Se,al as Yt,am as Jt,an as Qt,ao as Sn,ap as en,aq as pe,ar as tn,p as nn,s as ln,d as lt,v as Ct,y as Ze,g as b,z as on,A as Te,C as fe,h as R,a as Ln,i as Y,o as Cn,G as dt,as as Vn,at as Mn,au as zn,av as Fn,aw as $n,ax as Tn}from"./index-CEb2iypc.js";import{a as le,b as ee,s as ne}from"./index-p8zAYlvz.js";import{s as be}from"./index-DEhrtLQP.js";var ot=wn(),Pn=`
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
`,An={root:function(e){var n=e.props;return["p-menu p-component",{"p-menu-overlay":n.popup}]},start:"p-menu-start",list:"p-menu-list",submenuLabel:"p-menu-submenu-label",separator:"p-menu-separator",end:"p-menu-end",item:function(e){var n=e.instance;return["p-menu-item",{"p-focus":n.id===n.focusedOptionId,"p-disabled":n.disabled()}]},itemContent:"p-menu-item-content",itemLink:"p-menu-item-link",itemIcon:"p-menu-item-icon",itemLabel:"p-menu-item-label"},En=me.extend({name:"menu",style:Pn,classes:An}),Dn={name:"BaseMenu",extends:Oe,props:{popup:{type:Boolean,default:!1},model:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:En,provide:function(){return{$pcMenu:this,$parentInstance:this}}},sn={name:"Menuitem",hostName:"Menu",extends:Oe,inheritAttrs:!1,emits:["item-click","item-mousemove"],props:{item:null,templates:null,id:null,focusedOptionId:null,index:null},methods:{getItemProp:function(e,n){return e&&e.item?On(e.item[n]):void 0},getPTOptions:function(e){return this.ptm(e,{context:{item:this.item,index:this.index,focused:this.isItemFocused(),disabled:this.disabled()}})},isItemFocused:function(){return this.focusedOptionId===this.id},onItemClick:function(e){var n=this.getItemProp(this.item,"command");n&&n({originalEvent:e,item:this.item.item}),this.$emit("item-click",{originalEvent:e,item:this.item,id:this.id})},onItemMouseMove:function(e){this.$emit("item-mousemove",{originalEvent:e,item:this.item,id:this.id})},visible:function(){return typeof this.item.visible=="function"?this.item.visible():this.item.visible!==!1},disabled:function(){return typeof this.item.disabled=="function"?this.item.disabled():this.item.disabled},label:function(){return typeof this.item.label=="function"?this.item.label():this.item.label},getMenuItemProps:function(e){return{action:h({class:this.cx("itemLink"),tabindex:"-1"},this.getPTOptions("itemLink")),icon:h({class:[this.cx("itemIcon"),e.icon]},this.getPTOptions("itemIcon")),label:h({class:this.cx("itemLabel")},this.getPTOptions("itemLabel"))}}},computed:{dataP:function(){return re({focus:this.isItemFocused(),disabled:this.disabled()})}},directives:{ripple:wt}},Hn=["id","aria-label","aria-disabled","data-p-focused","data-p-disabled","data-p"],Bn=["data-p"],Kn=["href","target"],Un=["data-p"],Rn=["data-p"];function jn(t,e,n,l,s,i){var m=je("ripple");return i.visible()?(u(),d("li",h({key:0,id:n.id,class:[t.cx("item"),n.item.class],role:"menuitem",style:n.item.style,"aria-label":i.label(),"aria-disabled":i.disabled(),"data-p-focused":i.isItemFocused(),"data-p-disabled":i.disabled()||!1,"data-p":i.dataP},i.getPTOptions("item")),[p("div",h({class:t.cx("itemContent"),onClick:e[0]||(e[0]=function(c){return i.onItemClick(c)}),onMousemove:e[1]||(e[1]=function(c){return i.onItemMouseMove(c)}),"data-p":i.dataP},i.getPTOptions("itemContent")),[n.templates.item?n.templates.item?(u(),F(ue(n.templates.item),{key:1,item:n.item,label:i.label(),props:i.getMenuItemProps(n.item)},null,8,["item","label","props"])):x("",!0):Ge((u(),d("a",h({key:0,href:n.item.url,class:t.cx("itemLink"),target:n.item.target,tabindex:"-1"},i.getPTOptions("itemLink")),[n.templates.itemicon?(u(),F(ue(n.templates.itemicon),{key:0,item:n.item,class:G(t.cx("itemIcon"))},null,8,["item","class"])):n.item.icon?(u(),d("span",h({key:1,class:[t.cx("itemIcon"),n.item.icon],"data-p":i.dataP},i.getPTOptions("itemIcon")),null,16,Un)):x("",!0),p("span",h({class:t.cx("itemLabel"),"data-p":i.dataP},i.getPTOptions("itemLabel")),z(i.label()),17,Rn)],16,Kn)),[[m]])],16,Bn)],16,Hn)):x("",!0)}sn.render=jn;function Ht(t){return qn(t)||_n(t)||Nn(t)||Gn()}function Gn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Nn(t,e){if(t){if(typeof t=="string")return ht(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ht(t,e):void 0}}function _n(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function qn(t){if(Array.isArray(t))return ht(t)}function ht(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Wn={name:"Menu",extends:Dn,inheritAttrs:!1,emits:["show","hide","focus","blur"],data:function(){return{overlayVisible:!1,focused:!1,focusedOptionIndex:-1,selectedOptionIndex:-1}},target:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,list:null,mounted:function(){this.popup||(this.bindResizeListener(),this.bindOutsideClickListener())},beforeUnmount:function(){this.unbindResizeListener(),this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.target=null,this.container&&this.autoZIndex&&se.clear(this.container),this.container=null},methods:{itemClick:function(e){var n=e.item;this.disabled(n)||(n.command&&n.command(e),this.overlayVisible&&this.hide(),!this.popup&&this.focusedOptionIndex!==e.id&&(this.focusedOptionIndex=e.id))},itemMouseMove:function(e){this.focused&&(this.focusedOptionIndex=e.id)},onListFocus:function(e){this.focused=!0,!this.popup&&this.changeFocusedOptionIndex(0),this.$emit("focus",e)},onListBlur:function(e){this.focused=!1,this.focusedOptionIndex=-1,this.$emit("blur",e)},onListKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Space":this.onSpaceKey(e);break;case"Escape":this.popup&&(J(this.target),this.hide());case"Tab":this.overlayVisible&&this.hide();break}},onArrowDownKey:function(e){var n=this.findNextOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.popup)J(this.target),this.hide(),e.preventDefault();else{var n=this.findPrevOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()}},onHomeKey:function(e){this.changeFocusedOptionIndex(0),e.preventDefault()},onEndKey:function(e){this.changeFocusedOptionIndex(We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]').length-1),e.preventDefault()},onEnterKey:function(e){var n=$e(this.list,'li[id="'.concat("".concat(this.focusedOptionIndex),'"]')),l=n&&$e(n,'a[data-pc-section="itemlink"]');this.popup&&J(this.target),l?l.click():n&&n.click(),e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},findNextOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Ht(n).findIndex(function(s){return s.id===e});return l>-1?l+1:0},findPrevOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Ht(n).findIndex(function(s){return s.id===e});return l>-1?l-1:0},changeFocusedOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=e>=n.length?n.length-1:e<0?0:e;l>-1&&(this.focusedOptionIndex=n[l].getAttribute("id"))},toggle:function(e,n){this.overlayVisible?this.hide():this.show(e,n)},show:function(e,n){this.overlayVisible=!0,this.target=n??e.currentTarget},hide:function(){this.overlayVisible=!1,this.target=null},onEnter:function(e){Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.bindOutsideClickListener(),this.bindResizeListener(),this.bindScrollListener(),this.autoZIndex&&se.set("menu",e,this.baseZIndex||this.$primevue.config.zIndex.menu),this.popup&&J(this.list),this.$emit("show")},onLeave:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindScrollListener(),this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){et(this.container,this.target);var e=Fe(this.target);e>Fe(this.container)&&(this.container.style.minWidth=Fe(this.target)+"px")},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=e.container&&!e.container.contains(n.target),s=!(e.target&&(e.target===n.target||e.target.contains(n.target)));e.overlayVisible&&l&&s?e.hide():!e.popup&&l&&s&&(e.focusedOptionIndex=-1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.target,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},visible:function(e){return typeof e.visible=="function"?e.visible():e.visible!==!1},disabled:function(e){return typeof e.disabled=="function"?e.disabled():e.disabled},label:function(e){return typeof e.label=="function"?e.label():e.label},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.target})},containerRef:function(e){this.container=e},listRef:function(e){this.list=e}},computed:{focusedOptionId:function(){return this.focusedOptionIndex!==-1?this.focusedOptionIndex:null},dataP:function(){return re({popup:this.popup})}},components:{PVMenuitem:sn,Portal:Re}},Zn=["id","data-p"],Xn=["id","tabindex","aria-activedescendant","aria-label","aria-labelledby"],Yn=["id"];function Jn(t,e,n,l,s,i){var m=N("PVMenuitem"),c=N("Portal");return u(),F(c,{appendTo:t.appendTo,disabled:!t.popup},{default:v(function(){return[r(Ne,h({name:"p-anchored-overlay",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:v(function(){return[!t.popup||s.overlayVisible?(u(),d("div",h({key:0,ref:i.containerRef,id:t.$id,class:t.cx("root"),onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),"data-p":i.dataP},t.ptmi("root")),[t.$slots.start?(u(),d("div",h({key:0,class:t.cx("start")},t.ptm("start")),[M(t.$slots,"start")],16)):x("",!0),p("ul",h({ref:i.listRef,id:t.$id+"_list",class:t.cx("list"),role:"menu",tabindex:t.tabindex,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,onFocus:e[0]||(e[0]=function(){return i.onListFocus&&i.onListFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onListBlur&&i.onListBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onListKeyDown&&i.onListKeyDown.apply(i,arguments)})},t.ptm("list")),[(u(!0),d(V,null,oe(t.model,function(f,g){return u(),d(V,{key:i.label(f)+g.toString()},[f.items&&i.visible(f)&&!f.separator?(u(),d(V,{key:0},[f.items?(u(),d("li",h({key:0,id:t.$id+"_"+g,class:[t.cx("submenuLabel"),f.class],role:"none"},{ref_for:!0},t.ptm("submenuLabel")),[M(t.$slots,t.$slots.submenulabel?"submenulabel":"submenuheader",{item:f},function(){return[j(z(i.label(f)),1)]})],16,Yn)):x("",!0),(u(!0),d(V,null,oe(f.items,function(w,I){return u(),d(V,{key:w.label+g+"_"+I},[i.visible(w)&&!w.separator?(u(),F(m,{key:0,id:t.$id+"_"+g+"_"+I,item:w,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"])):i.visible(w)&&w.separator?(u(),d("li",h({key:"separator"+g+I,class:[t.cx("separator"),f.class],style:w.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):x("",!0)],64)}),128))],64)):i.visible(f)&&f.separator?(u(),d("li",h({key:"separator"+g.toString(),class:[t.cx("separator"),f.class],style:f.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):(u(),F(m,{key:i.label(f)+g.toString(),id:t.$id+"_"+g,item:f,index:g,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","index","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"]))],64)}),128))],16,Xn),t.$slots.end?(u(),d("div",h({key:1,class:t.cx("end")},t.ptm("end")),[M(t.$slots,"end")],16)):x("",!0)],16,Zn)):x("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo","disabled"])}Wn.render=Jn;const an=[{id:"draft",title:"Черновик",hint:"Сценарий без озвучки"},{id:"voiced",title:"Озвучено",hint:"Ждёт раскадровку"},{id:"storyboard",title:"Раскадровка",hint:"Картинки готовы, нужен монтаж"},{id:"video",title:"Смонтировано",hint:"Видео собрано, надо проверить"},{id:"ready",title:"Готово",hint:"Проверено, можно выкладывать"},{id:"published",title:"Выложено",hint:""}],Bt=t=>an.findIndex(e=>e.id===t),da=t=>an.find(e=>e.id===t)?.title??t,Qn=[{id:"voice",label:"До озвучки",icon:"pi pi-microphone",hint:"Перевод и озвучка — дальше вручную",steps:["translate","voice"],below:"voiced"},{id:"scenes",label:"До сцен",icon:"pi pi-th-large",hint:"Озвучка и разбивка на сцены — можно поправить границы",steps:["translate","voice","scenes"],below:"storyboard"},{id:"prompts",label:"До промптов",icon:"pi pi-pencil",hint:"Всё до промптов картинок — проверить их, прежде чем тратить кредиты",steps:["translate","voice","scenes","characters","prompts"],below:"storyboard"},{id:"images",label:"До раскадровки",icon:"pi pi-images",hint:"Картинки готовы, видео не собирается",steps:["translate","voice","scenes","characters","prompts","images"],below:"storyboard"},{id:"video",label:"До видео",icon:"pi pi-video",hint:"Собранное видео без метаданных и обложек",steps:["translate","voice","scenes","characters","prompts","images","render"],below:"video"},{id:"all",label:"Весь конвейер",icon:"pi pi-play",hint:"",steps:null,below:"ready"}],ca=t=>t?new Date(t*1e3).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):"";async function pa(t,e){try{await de.patch(`/api/tracks/${t}`,e)}catch(n){_e().error(n)}}function ha(t){const e=_e(),n=tt();async function l(c,f){try{const g=await de.post(`/api/projects/${c.id}/run`,f?{steps:f}:{});e.info(g.message,c.name),n.loadActiveJobs(),t()}catch(g){e.error(g)}}async function s(c,f){try{await de.post(`/api/projects/${c.id}/mark`,f),t()}catch(g){e.error(g)}}async function i(c){try{await de.post(`/api/projects/${c.id}/cancel`),n.loadActiveJobs(),t()}catch(f){e.error(f)}}function m(c,f){const g=Bt(c.status),w=c.tracks_status.some(P=>P.has_script),I=c.status==="published",E=c.tracks_status.some(P=>P.published_at),U=[];if(f)U.push({label:"Остановить",icon:"pi pi-stop",command:()=>i(c)});else{const P=Qn.filter(O=>g<Bt(O.below));P.length&&U.push({label:"Довести до…",items:P.map(O=>({label:O.label,icon:O.icon,disabled:!w,command:()=>l(c,O.steps)}))})}const D=[];return c.status==="video"&&D.push({label:"Проверено",icon:"pi pi-check",command:()=>s(c,{approved:!0})}),c.status==="ready"&&D.push({label:"Снять «проверено»",icon:"pi pi-undo",command:()=>s(c,{approved:!1})}),I||D.push({label:"Выложено",icon:"pi pi-send",command:()=>s(c,{published:!0})}),E&&D.push({label:"Снять «выложено»",icon:"pi pi-undo",command:()=>s(c,{published:!1})}),D.length&&U.push({label:"Отметить",items:D}),U}return{runUntil:l,mark:s,stop:i,menuFor:m}}var ei=`
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
`,ti={root:"p-colorpicker p-component",preview:function(e){var n=e.props;return["p-colorpicker-preview",{"p-disabled":n.disabled}]},panel:function(e){var n=e.instance,l=e.props;return["p-colorpicker-panel",{"p-colorpicker-panel-inline":l.inline,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},colorSelector:"p-colorpicker-color-selector",colorBackground:"p-colorpicker-color-background",colorHandle:"p-colorpicker-color-handle",hue:"p-colorpicker-hue",hueHandle:"p-colorpicker-hue-handle"},ni=me.extend({name:"colorpicker",style:ei,classes:ti}),ii={name:"BaseColorPicker",extends:xn,props:{defaultColor:{type:null,default:"ff0000"},inline:{type:Boolean,default:!1},format:{type:String,default:"hex"},tabindex:{type:String,default:null},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},appendTo:{type:[String,Object],default:"body"},inputId:{type:String,default:null},panelClass:null,overlayClass:null},style:ni,provide:function(){return{$pcColorPicker:this,$parentInstance:this}}},ve={name:"ColorPicker",extends:ii,inheritAttrs:!1,emits:["change","show","hide"],data:function(){return{overlayVisible:!1}},hsbValue:null,localHue:null,outsideClickListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,scrollHandler:null,resizeListener:null,hueDragging:null,colorDragging:null,selfUpdate:null,picker:null,colorSelector:null,colorHandle:null,hueView:null,hueHandle:null,watch:{modelValue:{immediate:!0,handler:function(e){this.hsbValue=this.toHSB(e),this.selfUpdate?this.selfUpdate=!1:this.updateUI()}}},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindDragListeners(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.picker&&this.autoZIndex&&se.clear(this.picker),this.clearRefs()},mounted:function(){this.updateUI()},methods:{pickColor:function(e){var n=this.colorSelector.getBoundingClientRect(),l=n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),s=n.left+document.body.scrollLeft,i=Math.floor(100*Math.max(0,Math.min(150,(e.pageX||e.changedTouches[0].pageX)-s))/150),m=Math.floor(100*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-l)))/150);this.hsbValue=this.validateHSB({h:this.localHue,s:i,b:m}),this.selfUpdate=!0,this.updateColorHandle(),this.updateInput(),this.updateModel(e)},pickHue:function(e){var n=this.hueView.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);this.localHue=Math.floor(360*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-n)))/150),this.hsbValue=this.validateHSB({h:this.localHue,s:this.hsbValue.s,b:this.hsbValue.b}),this.selfUpdate=!0,this.updateColorSelector(),this.updateHue(),this.updateModel(e),this.updateInput()},updateModel:function(e){var n=this.d_value;switch(this.format){case"hex":n=this.HSBtoHEX(this.hsbValue);break;case"rgb":n=this.HSBtoRGB(this.hsbValue);break;case"hsb":n=this.hsbValue;break}this.writeValue(n,e),this.$emit("change",{event:e,value:n})},updateColorSelector:function(){if(this.colorSelector){var e=this.validateHSB({h:this.hsbValue.h,s:100,b:100});this.colorSelector.style.backgroundColor="#"+this.HSBtoHEX(e)}},updateColorHandle:function(){this.colorHandle&&(this.colorHandle.style.left=Math.floor(150*this.hsbValue.s/100)+"px",this.colorHandle.style.top=Math.floor(150*(100-this.hsbValue.b)/100)+"px")},updateHue:function(){this.hueHandle&&(this.hueHandle.style.top=Math.floor(150-150*this.hsbValue.h/360)+"px")},updateInput:function(){this.$refs.input&&(this.$refs.input.style.backgroundColor="#"+this.HSBtoHEX(this.hsbValue))},updateUI:function(){this.updateHue(),this.updateColorHandle(),this.updateInput(),this.updateColorSelector()},validateHSB:function(e){return{h:Math.min(360,Math.max(0,e.h)),s:Math.min(100,Math.max(0,e.s)),b:Math.min(100,Math.max(0,e.b))}},validateRGB:function(e){return{r:Math.min(255,Math.max(0,e.r)),g:Math.min(255,Math.max(0,e.g)),b:Math.min(255,Math.max(0,e.b))}},validateHEX:function(e){var n=6-e.length;if(n>0){for(var l=[],s=0;s<n;s++)l.push("0");l.push(e),e=l.join("")}return e},HEXtoRGB:function(e){var n=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:n>>16,g:(n&65280)>>8,b:n&255}},HEXtoHSB:function(e){return this.RGBtoHSB(this.HEXtoRGB(e))},RGBtoHSB:function(e){var n={h:0,s:0,b:0},l=Math.min(e.r,e.g,e.b),s=Math.max(e.r,e.g,e.b),i=s-l;return n.b=s,n.s=s!==0?255*i/s:0,n.s!==0?e.r===s?n.h=(e.g-e.b)/i:e.g===s?n.h=2+(e.b-e.r)/i:n.h=4+(e.r-e.g)/i:n.h=-1,n.h*=60,n.h<0&&(n.h+=360),n.s*=100/255,n.b*=100/255,n},HSBtoRGB:function(e){var n={r:null,g:null,b:null},l=Math.round(e.h),s=Math.round(e.s*255/100),i=Math.round(e.b*255/100);if(s===0)n={r:i,g:i,b:i};else{var m=i,c=(255-s)*i/255,f=(m-c)*(l%60)/60;l===360&&(l=0),l<60?(n.r=m,n.b=c,n.g=c+f):l<120?(n.g=m,n.b=c,n.r=m-f):l<180?(n.g=m,n.r=c,n.b=c+f):l<240?(n.b=m,n.r=c,n.g=m-f):l<300?(n.b=m,n.g=c,n.r=c+f):l<360?(n.r=m,n.g=c,n.b=m-f):(n.r=0,n.g=0,n.b=0)}return{r:Math.round(n.r),g:Math.round(n.g),b:Math.round(n.b)}},RGBtoHEX:function(e){var n=[e.r.toString(16),e.g.toString(16),e.b.toString(16)];for(var l in n)n[l].length===1&&(n[l]="0"+n[l]);return n.join("")},HSBtoHEX:function(e){return this.RGBtoHEX(this.HSBtoRGB(e))},toHSB:function(e){var n;if(e)switch(this.format){case"hex":n=this.HEXtoHSB(e);break;case"rgb":n=this.RGBtoHSB(e);break;case"hsb":n=e;break}else n=this.HEXtoHSB(this.defaultColor);return n.s===0||n.b===0?n.h=this.localHue:this.localHue=n.h,n},onOverlayEnter:function(e){this.updateUI(),this.alignOverlay(),this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&se.set("overlay",e,this.baseZIndex||this.$primevue.config.zIndex.overlay),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),this.$emit("show")},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.clearRefs(),this.$emit("hide")},onOverlayAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.picker,this.$refs.input):et(this.picker,this.$refs.input)},onInputClick:function(){this.disabled||(this.overlayVisible=!this.overlayVisible)},onInputKeydown:function(e){switch(e.code){case"Space":this.overlayVisible=!this.overlayVisible,e.preventDefault();break;case"Escape":case"Tab":this.overlayVisible=!1;break}},onInputBlur:function(e){var n,l;(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onColorMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onColorDragStart(e))},onColorDragStart:function(e){this.disabled||(this.colorDragging=!0,this.pickColor(e),this.$el.setAttribute("p-colorpicker-dragging","true"),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},onDrag:function(e){this.colorDragging&&(this.pickColor(e),e.preventDefault()),this.hueDragging&&(this.pickHue(e),e.preventDefault())},onDragEnd:function(){this.colorDragging=!1,this.hueDragging=!1,this.$el.setAttribute("p-colorpicker-dragging","false"),!this.isUnstyled&&In(this.$el,"p-colorpicker-dragging"),this.unbindDragListeners()},onHueMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onHueDragStart(e))},onHueDragStart:function(e){this.disabled||(this.hueDragging=!0,this.pickHue(e),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},isInputClicked:function(e){return this.$refs.input&&this.$refs.input.isSameNode(e.target)},bindDragListeners:function(){this.bindDocumentMouseMoveListener(),this.bindDocumentMouseUpListener()},unbindDragListeners:function(){this.unbindDocumentMouseMoveListener(),this.unbindDocumentMouseUpListener()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.picker&&!e.picker.contains(n.target)&&!e.isInputClicked(n)&&(e.overlayVisible=!1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&(e.overlayVisible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&(e.overlayVisible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindDocumentMouseMoveListener:function(){this.documentMouseMoveListener||(this.documentMouseMoveListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.documentMouseMoveListener))},unbindDocumentMouseMoveListener:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null)},bindDocumentMouseUpListener:function(){this.documentMouseUpListener||(this.documentMouseUpListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseUpListener:function(){this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},pickerRef:function(e){this.picker=e},colorSelectorRef:function(e){this.colorSelector=e},colorHandleRef:function(e){this.colorHandle=e},hueViewRef:function(e){this.hueView=e},hueHandleRef:function(e){this.hueHandle=e},clearRefs:function(){this.picker=null,this.colorSelector=null,this.colorHandle=null,this.hueView=null,this.hueHandle=null},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})}},components:{Portal:Re}};function Pe(t){"@babel/helpers - typeof";return Pe=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Pe(t)}function Kt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Ut(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Kt(Object(n),!0).forEach(function(l){li(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Kt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function li(t,e,n){return(e=oi(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function oi(t){var e=si(t,"string");return Pe(e)=="symbol"?e:e+""}function si(t,e){if(Pe(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Pe(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ai=["id","tabindex","disabled"];function ri(t,e,n,l,s,i){var m=N("Portal");return u(),d("div",h({ref:"container",class:t.cx("root")},t.ptmi("root")),[t.inline?x("",!0):(u(),d("input",h({key:0,ref:"input",id:t.inputId,type:"text",class:t.cx("preview"),readonly:"",tabindex:t.tabindex,disabled:t.disabled,onClick:e[0]||(e[0]=function(){return i.onInputClick&&i.onInputClick.apply(i,arguments)}),onKeydown:e[1]||(e[1]=function(){return i.onInputKeydown&&i.onInputKeydown.apply(i,arguments)}),onBlur:e[2]||(e[2]=function(){return i.onInputBlur&&i.onInputBlur.apply(i,arguments)})},t.ptm("preview")),null,16,ai)),r(m,{appendTo:t.appendTo,disabled:t.inline},{default:v(function(){return[r(Ne,h({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[t.inline||s.overlayVisible?(u(),d("div",h({key:0,ref:i.pickerRef,class:[t.cx("panel"),t.panelClass,t.overlayClass],onClick:e[11]||(e[11]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)})},Ut(Ut({},t.ptm("panel")),t.ptm("overlay"))),[p("div",h({class:t.cx("content")},t.ptm("content")),[p("div",h({ref:i.colorSelectorRef,class:t.cx("colorSelector"),onMousedown:e[3]||(e[3]=function(c){return i.onColorMousedown(c)}),onTouchstart:e[4]||(e[4]=function(c){return i.onColorDragStart(c)}),onTouchmove:e[5]||(e[5]=function(c){return i.onDrag(c)}),onTouchend:e[6]||(e[6]=function(c){return i.onDragEnd()})},t.ptm("colorSelector")),[p("div",h({class:t.cx("colorBackground")},t.ptm("colorBackground")),[p("div",h({ref:i.colorHandleRef,class:t.cx("colorHandle")},t.ptm("colorHandle")),null,16)],16)],16),p("div",h({ref:i.hueViewRef,class:t.cx("hue"),onMousedown:e[7]||(e[7]=function(c){return i.onHueMousedown(c)}),onTouchstart:e[8]||(e[8]=function(c){return i.onHueDragStart(c)}),onTouchmove:e[9]||(e[9]=function(c){return i.onDrag(c)}),onTouchend:e[10]||(e[10]=function(c){return i.onDragEnd()})},t.ptm("hue")),[p("div",h({ref:i.hueHandleRef,class:t.cx("hueHandle")},t.ptm("hueHandle")),null,16)],16)],16)],16)):x("",!0)]}),_:1},16,["onEnter","onLeave","onAfterLeave"])]}),_:1},8,["appendTo","disabled"])],16)}ve.render=ri;var rn={name:"BlankIcon",extends:nt};function ui(t){return hi(t)||pi(t)||ci(t)||di()}function di(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ci(t,e){if(t){if(typeof t=="string")return ft(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ft(t,e):void 0}}function pi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function hi(t){if(Array.isArray(t))return ft(t)}function ft(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function fi(t,e,n,l,s,i){return u(),d("svg",h({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),ui(e[0]||(e[0]=[p("rect",{width:"1",height:"1",fill:"currentColor","fill-opacity":"0"},null,-1)])),16)}rn.render=fi;var Vt={name:"ChevronDownIcon",extends:nt};function mi(t){return yi(t)||gi(t)||vi(t)||bi()}function bi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function vi(t,e){if(t){if(typeof t=="string")return mt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?mt(t,e):void 0}}function gi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function yi(t){if(Array.isArray(t))return mt(t)}function mt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function ki(t,e,n,l,s,i){return u(),d("svg",h({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),mi(e[0]||(e[0]=[p("path",{d:"M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z",fill:"currentColor"},null,-1)])),16)}Vt.render=ki;var Mt={name:"SearchIcon",extends:nt};function wi(t){return Si(t)||Ii(t)||xi(t)||Oi()}function Oi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function xi(t,e){if(t){if(typeof t=="string")return bt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?bt(t,e):void 0}}function Ii(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Si(t){if(Array.isArray(t))return bt(t)}function bt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Li(t,e,n,l,s,i){return u(),d("svg",h({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),wi(e[0]||(e[0]=[p("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z",fill:"currentColor"},null,-1)])),16)}Mt.render=Li;var Ci=`
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
`,Vi={root:"p-iconfield"},Mi=me.extend({name:"iconfield",style:Ci,classes:Vi}),zi={name:"BaseIconField",extends:Oe,style:Mi,provide:function(){return{$pcIconField:this,$parentInstance:this}}},zt={name:"IconField",extends:zi,inheritAttrs:!1};function Fi(t,e,n,l,s,i){return u(),d("div",h({class:t.cx("root")},t.ptmi("root")),[M(t.$slots,"default")],16)}zt.render=Fi;var $i={root:"p-inputicon"},Ti=me.extend({name:"inputicon",classes:$i}),Pi={name:"BaseInputIcon",extends:Oe,style:Ti,props:{class:null},provide:function(){return{$pcInputIcon:this,$parentInstance:this}}},Ft={name:"InputIcon",extends:Pi,inheritAttrs:!1,computed:{containerClass:function(){return[this.cx("root"),this.class]}}};function Ai(t,e,n,l,s,i){return u(),d("span",h({class:i.containerClass},t.ptmi("root"),{"aria-hidden":"true"}),[M(t.$slots,"default")],16)}Ft.render=Ai;var Ei=`
    .p-virtualscroller-loader {
        background: dt('virtualscroller.loader.mask.background');
        color: dt('virtualscroller.loader.mask.color');
    }

    .p-virtualscroller-loading-icon {
        font-size: dt('virtualscroller.loader.icon.size');
        width: dt('virtualscroller.loader.icon.size');
        height: dt('virtualscroller.loader.icon.size');
    }
`,Di=`
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
`,Rt=me.extend({name:"virtualscroller",css:Di,style:Ei}),Hi={name:"BaseVirtualScroller",extends:Oe,props:{id:{type:String,default:null},style:null,class:null,items:{type:Array,default:null},itemSize:{type:[Number,Array],default:0},scrollHeight:null,scrollWidth:null,orientation:{type:String,default:"vertical"},numToleratedItems:{type:Number,default:null},delay:{type:Number,default:0},resizeDelay:{type:Number,default:10},lazy:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},loaderDisabled:{type:Boolean,default:!1},columns:{type:Array,default:null},loading:{type:Boolean,default:!1},showSpacer:{type:Boolean,default:!0},showLoader:{type:Boolean,default:!1},tabindex:{type:Number,default:0},inline:{type:Boolean,default:!1},step:{type:Number,default:0},appendOnly:{type:Boolean,default:!1},autoSize:{type:Boolean,default:!1}},style:Rt,provide:function(){return{$pcVirtualScroller:this,$parentInstance:this}},beforeMount:function(){var e;Rt.loadCSS({nonce:(e=this.$primevueConfig)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce})}};function Ae(t){"@babel/helpers - typeof";return Ae=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ae(t)}function jt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function ze(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?jt(Object(n),!0).forEach(function(l){un(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):jt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function un(t,e,n){return(e=Bi(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Bi(t){var e=Ki(t,"string");return Ae(e)=="symbol"?e:e+""}function Ki(t,e){if(Ae(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ae(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var $t={name:"VirtualScroller",extends:Hi,inheritAttrs:!1,emits:["update:numToleratedItems","scroll","scroll-index-change","lazy-load"],data:function(){var e=this.isBoth();return{first:e?{rows:0,cols:0}:0,last:e?{rows:0,cols:0}:0,page:e?{rows:0,cols:0}:0,numItemsInViewport:e?{rows:0,cols:0}:0,lastScrollPos:e?{top:0,left:0}:0,d_numToleratedItems:this.numToleratedItems,d_loading:this.loading,loaderArr:[],spacerStyle:{},contentStyle:{}}},element:null,content:null,lastScrollPos:null,scrollTimeout:null,resizeTimeout:null,defaultWidth:0,defaultHeight:0,defaultContentWidth:0,defaultContentHeight:0,isRangeChanged:!1,lazyLoadState:{},resizeListener:null,resizeObserver:null,initialized:!1,watch:{numToleratedItems:function(e){this.d_numToleratedItems=e},loading:function(e,n){this.lazy&&e!==n&&e!==this.d_loading&&(this.d_loading=e)},items:{handler:function(e,n){(!n||n.length!==(e||[]).length)&&(this.init(),this.calculateAutoSize())},deep:!0},itemSize:function(){this.init(),this.calculateAutoSize()},orientation:function(){this.lastScrollPos=this.isBoth()?{top:0,left:0}:0},scrollHeight:function(){this.init(),this.calculateAutoSize()},scrollWidth:function(){this.init(),this.calculateAutoSize()}},mounted:function(){this.viewInit(),this.lastScrollPos=this.isBoth()?{top:0,left:0}:0,this.lazyLoadState=this.lazyLoadState||{}},updated:function(){!this.initialized&&this.viewInit()},unmounted:function(){this.unbindResizeListener(),this.initialized=!1},methods:{viewInit:function(){Xe(this.element)&&(this.setContentEl(this.content),this.init(),this.calculateAutoSize(),this.defaultWidth=Ve(this.element),this.defaultHeight=Me(this.element),this.defaultContentWidth=Ve(this.content),this.defaultContentHeight=Me(this.content),this.initialized=!0),this.element&&this.bindResizeListener()},init:function(){this.disabled||(this.setSize(),this.calculateOptions(),this.setSpacerSize())},isVertical:function(){return this.orientation==="vertical"},isHorizontal:function(){return this.orientation==="horizontal"},isBoth:function(){return this.orientation==="both"},scrollTo:function(e){this.element&&this.element.scrollTo(e)},scrollToIndex:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:"auto",s=this.isBoth(),i=this.isHorizontal(),m=s?e.every(function(L){return L>-1}):e>-1;if(m){var c=this.first,f=this.element,g=f.scrollTop,w=g===void 0?0:g,I=f.scrollLeft,E=I===void 0?0:I,U=this.calculateNumItems(),D=U.numToleratedItems,P=this.getContentPosition(),O=this.itemSize,H=function(){var $=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Z=arguments.length>1?arguments[1]:void 0;return $<=Z?0:$},A=function($,Z,Q){return $*Z+Q},K=function(){var $=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Z=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.scrollTo({left:$,top:Z,behavior:l})},C=s?{rows:0,cols:0}:0,ae=!1,_=!1;s?(C={rows:H(e[0],D[0]),cols:H(e[1],D[1])},K(A(C.cols,O[1],P.left),A(C.rows,O[0],P.top)),_=this.lastScrollPos.top!==w||this.lastScrollPos.left!==E,ae=C.rows!==c.rows||C.cols!==c.cols):(C=H(e,D),i?K(A(C,O,P.left),w):K(E,A(C,O,P.top)),_=this.lastScrollPos!==(i?E:w),ae=C!==c),this.isRangeChanged=ae,_&&(this.first=C)}},scrollInView:function(e,n){var l=this,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"auto";if(n){var i=this.isBoth(),m=this.isHorizontal(),c=i?e.every(function(O){return O>-1}):e>-1;if(c){var f=this.getRenderedRange(),g=f.first,w=f.viewport,I=function(){var H=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,A=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return l.scrollTo({left:H,top:A,behavior:s})},E=n==="to-start",U=n==="to-end";if(E){if(i)w.first.rows-g.rows>e[0]?I(w.first.cols*this.itemSize[1],(w.first.rows-1)*this.itemSize[0]):w.first.cols-g.cols>e[1]&&I((w.first.cols-1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.first-g>e){var D=(w.first-1)*this.itemSize;m?I(D,0):I(0,D)}}else if(U){if(i)w.last.rows-g.rows<=e[0]+1?I(w.first.cols*this.itemSize[1],(w.first.rows+1)*this.itemSize[0]):w.last.cols-g.cols<=e[1]+1&&I((w.first.cols+1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.last-g<=e+1){var P=(w.first+1)*this.itemSize;m?I(P,0):I(0,P)}}}}else this.scrollToIndex(e,s)},getRenderedRange:function(){var e=function(I,E){return Math.floor(I/(E||I))},n=this.first,l=0;if(this.element){var s=this.isBoth(),i=this.isHorizontal(),m=this.element,c=m.scrollTop,f=m.scrollLeft;if(s)n={rows:e(c,this.itemSize[0]),cols:e(f,this.itemSize[1])},l={rows:n.rows+this.numItemsInViewport.rows,cols:n.cols+this.numItemsInViewport.cols};else{var g=i?f:c;n=e(g,this.itemSize),l=n+this.numItemsInViewport}}return{first:this.first,last:this.last,viewport:{first:n,last:l}}},calculateNumItems:function(){var e=this.isBoth(),n=this.isHorizontal(),l=this.itemSize,s=this.getContentPosition(),i=this.element?this.element.offsetWidth-s.left:0,m=this.element?this.element.offsetHeight-s.top:0,c=function(E,U){return Math.ceil(E/(U||E))},f=function(E){return Math.ceil(E/2)},g=e?{rows:c(m,l[0]),cols:c(i,l[1])}:c(n?i:m,l),w=this.d_numToleratedItems||(e?[f(g.rows),f(g.cols)]:f(g));return{numItemsInViewport:g,numToleratedItems:w}},calculateOptions:function(){var e=this,n=this.isBoth(),l=this.first,s=this.calculateNumItems(),i=s.numItemsInViewport,m=s.numToleratedItems,c=function(w,I,E){var U=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;return e.getLast(w+I+(w<E?2:3)*E,U)},f=n?{rows:c(l.rows,i.rows,m[0]),cols:c(l.cols,i.cols,m[1],!0)}:c(l,i,m);this.last=f,this.numItemsInViewport=i,this.d_numToleratedItems=m,this.$emit("update:numToleratedItems",this.d_numToleratedItems),this.showLoader&&(this.loaderArr=n?Array.from({length:i.rows}).map(function(){return Array.from({length:i.cols})}):Array.from({length:i})),this.lazy&&Promise.resolve().then(function(){var g;e.lazyLoadState={first:e.step?n?{rows:0,cols:l.cols}:0:l,last:Math.min(e.step?e.step:f,((g=e.items)===null||g===void 0?void 0:g.length)||0)},e.$emit("lazy-load",e.lazyLoadState)})},calculateAutoSize:function(){var e=this;this.autoSize&&!this.d_loading&&Promise.resolve().then(function(){if(e.content){var n=e.isBoth(),l=e.isHorizontal(),s=e.isVertical();e.content.style.minHeight=e.content.style.minWidth="auto",e.content.style.position="relative",e.element.style.contain="none";var i=[Ve(e.element),Me(e.element)],m=i[0],c=i[1];(n||l)&&(e.element.style.width=m<e.defaultWidth?m+"px":e.scrollWidth||e.defaultWidth+"px"),(n||s)&&(e.element.style.height=c<e.defaultHeight?c+"px":e.scrollHeight||e.defaultHeight+"px"),e.content.style.minHeight=e.content.style.minWidth="",e.content.style.position="",e.element.style.contain=""}})},getLast:function(){var e,n,l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,s=arguments.length>1?arguments[1]:void 0;return this.items?Math.min(s?((e=this.columns||this.items[0])===null||e===void 0?void 0:e.length)||0:((n=this.items)===null||n===void 0?void 0:n.length)||0,l):0},getContentPosition:function(){if(this.content){var e=getComputedStyle(this.content),n=parseFloat(e.paddingLeft)+Math.max(parseFloat(e.left)||0,0),l=parseFloat(e.paddingRight)+Math.max(parseFloat(e.right)||0,0),s=parseFloat(e.paddingTop)+Math.max(parseFloat(e.top)||0,0),i=parseFloat(e.paddingBottom)+Math.max(parseFloat(e.bottom)||0,0);return{left:n,right:l,top:s,bottom:i,x:n+l,y:s+i}}return{left:0,right:0,top:0,bottom:0,x:0,y:0}},setSize:function(){var e=this;if(this.element){var n=this.isBoth(),l=this.isHorizontal(),s=this.element.parentElement,i=this.scrollWidth||"".concat(this.element.offsetWidth||s.offsetWidth,"px"),m=this.scrollHeight||"".concat(this.element.offsetHeight||s.offsetHeight,"px"),c=function(g,w){return e.element.style[g]=w};n||l?(c("height",m),c("width",i)):c("height",m)}},setSpacerSize:function(){var e=this,n=this.items;if(n){var l=this.isBoth(),s=this.isHorizontal(),i=this.getContentPosition(),m=function(f,g,w){var I=arguments.length>3&&arguments[3]!==void 0?arguments[3]:0;return e.spacerStyle=ze(ze({},e.spacerStyle),un({},"".concat(f),(g||[]).length*w+I+"px"))};l?(m("height",n,this.itemSize[0],i.y),m("width",this.columns||n[1],this.itemSize[1],i.x)):s?m("width",this.columns||n,this.itemSize,i.x):m("height",n,this.itemSize,i.y)}},setContentPosition:function(e){var n=this;if(this.content&&!this.appendOnly){var l=this.isBoth(),s=this.isHorizontal(),i=e?e.first:this.first,m=function(w,I){return w*I},c=function(){var w=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,I=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.contentStyle=ze(ze({},n.contentStyle),{transform:"translate3d(".concat(w,"px, ").concat(I,"px, 0)")})};if(l)c(m(i.cols,this.itemSize[1]),m(i.rows,this.itemSize[0]));else{var f=m(i,this.itemSize);s?c(f,0):c(0,f)}}},onScrollPositionChange:function(e){var n=this,l=e.target,s=this.isBoth(),i=this.isHorizontal(),m=this.getContentPosition(),c=function(W,B){return W?W>B?W-B:W:0},f=function(W,B){return Math.floor(W/(B||W))},g=function(W,B,T,S,ie,ce){return W<=ie?ie:ce?T-S-ie:B+ie-1},w=function(W,B,T,S,ie,ce,xe,Le){if(W<=ce)return 0;var Ce=Math.max(0,xe?W<B?T:W-ce:W>B?T:W-2*ce),qe=n.getLast(Ce,Le);return Ce>qe?qe-ie:Ce},I=function(W,B,T,S,ie,ce){var xe=B+S+2*ie;return W>=ie&&(xe+=ie+1),n.getLast(xe,ce)},E=c(l.scrollTop,m.top),U=c(l.scrollLeft,m.left),D=s?{rows:0,cols:0}:0,P=this.last,O=!1,H=this.lastScrollPos;if(s){var A=this.lastScrollPos.top<=E,K=this.lastScrollPos.left<=U;if(!this.appendOnly||this.appendOnly&&(A||K)){var C={rows:f(E,this.itemSize[0]),cols:f(U,this.itemSize[1])},ae={rows:g(C.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],A),cols:g(C.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K)};D={rows:w(C.rows,ae.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],A),cols:w(C.cols,ae.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K,!0)},P={rows:I(C.rows,D.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0]),cols:I(C.cols,D.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],!0)},O=D.rows!==this.first.rows||P.rows!==this.last.rows||D.cols!==this.first.cols||P.cols!==this.last.cols||this.isRangeChanged,H={top:E,left:U}}}else{var _=i?U:E,L=this.lastScrollPos<=_;if(!this.appendOnly||this.appendOnly&&L){var $=f(_,this.itemSize),Z=g($,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L);D=w($,Z,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L),P=I($,D,this.last,this.numItemsInViewport,this.d_numToleratedItems),O=D!==this.first||P!==this.last||this.isRangeChanged,H=_}}return{first:D,last:P,isRangeChanged:O,scrollPos:H}},onScrollChange:function(e){var n=this.onScrollPositionChange(e),l=n.first,s=n.last,i=n.isRangeChanged,m=n.scrollPos;if(i){var c={first:l,last:s};if(this.setContentPosition(c),this.first=l,this.last=s,this.lastScrollPos=m,this.$emit("scroll-index-change",c),this.lazy&&this.isPageChanged(l)){var f,g,w={first:this.step?Math.min(this.getPageByFirst(l)*this.step,(((f=this.items)===null||f===void 0?void 0:f.length)||0)-this.step):l,last:Math.min(this.step?(this.getPageByFirst(l)+1)*this.step:s,((g=this.items)===null||g===void 0?void 0:g.length)||0)},I=this.lazyLoadState.first!==w.first||this.lazyLoadState.last!==w.last;I&&this.$emit("lazy-load",w),this.lazyLoadState=w}}},onScroll:function(e){var n=this;if(this.$emit("scroll",e),this.delay){if(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.isPageChanged()){if(!this.d_loading&&this.showLoader){var l=this.onScrollPositionChange(e),s=l.isRangeChanged,i=s||(this.step?this.isPageChanged():!1);i&&(this.d_loading=!0)}this.scrollTimeout=setTimeout(function(){n.onScrollChange(e),n.d_loading&&n.showLoader&&(!n.lazy||n.loading===void 0)&&(n.d_loading=!1,n.page=n.getPageByFirst())},this.delay)}}else this.onScrollChange(e)},onResize:function(){var e=this;this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){if(Xe(e.element)){var n=e.isBoth(),l=e.isVertical(),s=e.isHorizontal(),i=[Ve(e.element),Me(e.element)],m=i[0],c=i[1],f=m!==e.defaultWidth,g=c!==e.defaultHeight,w=n?f||g:s?f:l?g:!1;w&&(e.d_numToleratedItems=e.numToleratedItems,e.defaultWidth=m,e.defaultHeight=c,e.defaultContentWidth=Ve(e.content),e.defaultContentHeight=Me(e.content),e.init())}},this.resizeDelay)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=this.onResize.bind(this),window.addEventListener("resize",this.resizeListener),window.addEventListener("orientationchange",this.resizeListener),this.resizeObserver=new ResizeObserver(function(){e.onResize()}),this.resizeObserver.observe(this.element))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),window.removeEventListener("orientationchange",this.resizeListener),this.resizeListener=null),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)},getOptions:function(e){var n=(this.items||[]).length,l=this.isBoth()?this.first.rows+e:this.first+e;return{index:l,count:n,first:l===0,last:l===n-1,even:l%2===0,odd:l%2!==0}},getLoaderOptions:function(e,n){var l=this.loaderArr.length;return ze({index:e,count:l,first:e===0,last:e===l-1,even:e%2===0,odd:e%2!==0},n)},getPageByFirst:function(e){return Math.floor(((e??this.first)+this.d_numToleratedItems*4)/(this.step||1))},isPageChanged:function(e){return this.step&&!this.lazy?this.page!==this.getPageByFirst(e??this.first):!0},setContentEl:function(e){this.content=e||this.content||$e(this.element,'[data-pc-section="content"]')},elementRef:function(e){this.element=e},contentRef:function(e){this.content=e}},computed:{containerClass:function(){return["p-virtualscroller",this.class,{"p-virtualscroller-inline":this.inline,"p-virtualscroller-both p-both-scroll":this.isBoth(),"p-virtualscroller-horizontal p-horizontal-scroll":this.isHorizontal()}]},contentClass:function(){return["p-virtualscroller-content",{"p-virtualscroller-loading":this.d_loading}]},loaderClass:function(){return["p-virtualscroller-loader",{"p-virtualscroller-loader-mask":!this.$slots.loader}]},loadedItems:function(){var e=this;return this.items&&!this.d_loading?this.isBoth()?this.items.slice(this.appendOnly?0:this.first.rows,this.last.rows).map(function(n){return e.columns?n:n.slice(e.appendOnly?0:e.first.cols,e.last.cols)}):this.isHorizontal()&&this.columns?this.items:this.items.slice(this.appendOnly?0:this.first,this.last):[]},loadedRows:function(){return this.d_loading?this.loaderDisabled?this.loaderArr:[]:this.loadedItems},loadedColumns:function(){if(this.columns){var e=this.isBoth(),n=this.isHorizontal();if(e||n)return this.d_loading&&this.loaderDisabled?e?this.loaderArr[0]:this.loaderArr:this.columns.slice(e?this.first.cols:this.first,e?this.last.cols:this.last)}return this.columns}},components:{SpinnerIcon:It}},Ui=["tabindex"];function Ri(t,e,n,l,s,i){var m=N("SpinnerIcon");return t.disabled?(u(),d(V,{key:1},[M(t.$slots,"default"),M(t.$slots,"content",{items:t.items,rows:t.items,columns:i.loadedColumns})],64)):(u(),d("div",h({key:0,ref:i.elementRef,class:i.containerClass,tabindex:t.tabindex,style:t.style,onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)})},t.ptmi("root")),[M(t.$slots,"content",{styleClass:i.contentClass,items:i.loadedItems,getItemOptions:i.getOptions,loading:s.d_loading,getLoaderOptions:i.getLoaderOptions,itemSize:t.itemSize,rows:i.loadedRows,columns:i.loadedColumns,contentRef:i.contentRef,spacerStyle:s.spacerStyle,contentStyle:s.contentStyle,vertical:i.isVertical(),horizontal:i.isHorizontal(),both:i.isBoth()},function(){return[p("div",h({ref:i.contentRef,class:i.contentClass,style:s.contentStyle},t.ptm("content")),[(u(!0),d(V,null,oe(i.loadedItems,function(c,f){return M(t.$slots,"item",{key:f,item:c,options:i.getOptions(f)})}),128))],16)]}),t.showSpacer?(u(),d("div",h({key:0,class:"p-virtualscroller-spacer",style:s.spacerStyle},t.ptm("spacer")),null,16)):x("",!0),!t.loaderDisabled&&t.showLoader&&s.d_loading?(u(),d("div",h({key:1,class:i.loaderClass},t.ptm("loader")),[t.$slots&&t.$slots.loader?(u(!0),d(V,{key:0},oe(s.loaderArr,function(c,f){return M(t.$slots,"loader",{key:f,options:i.getLoaderOptions(f,i.isBoth()&&{numCols:t.d_numItemsInViewport.cols})})}),128)):x("",!0),M(t.$slots,"loadingicon",{},function(){return[r(m,h({spin:"",class:"p-virtualscroller-loading-icon"},t.ptm("loadingIcon")),null,16)]})],16)):x("",!0)],16,Ui))}$t.render=Ri;var ji=`
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
`,Gi={root:function(e){var n=e.instance,l=e.props,s=e.state;return["p-select p-component p-inputwrapper",{"p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":s.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":s.focused||s.overlayVisible,"p-select-open":s.overlayVisible,"p-select-fluid":n.$fluid,"p-select-sm p-inputfield-sm":l.size==="small","p-select-lg p-inputfield-lg":l.size==="large"}]},label:function(e){var n,l=e.instance,s=e.props;return["p-select-label",{"p-placeholder":!s.editable&&l.label===s.placeholder,"p-select-label-empty":!s.editable&&!l.$slots.value&&(l.label==="p-emptylabel"||((n=l.label)===null||n===void 0?void 0:n.length)===0)}]},clearIcon:"p-select-clear-icon",dropdown:"p-select-dropdown",loadingicon:"p-select-loading-icon",dropdownIcon:"p-select-dropdown-icon",overlay:"p-select-overlay p-component",header:"p-select-header",pcFilter:"p-select-filter",listContainer:"p-select-list-container",list:"p-select-list",optionGroup:"p-select-option-group",optionGroupLabel:"p-select-option-group-label",option:function(e){var n=e.instance,l=e.props,s=e.state,i=e.option,m=e.focusedOption;return["p-select-option",{"p-select-option-selected":n.isSelected(i)&&l.highlightOnSelect,"p-focus":s.focusedOptionIndex===m,"p-disabled":n.isOptionDisabled(i)}]},optionLabel:"p-select-option-label",optionCheckIcon:"p-select-option-check-icon",optionBlankIcon:"p-select-option-blank-icon",emptyMessage:"p-select-empty-message"},Ni=me.extend({name:"select",style:ji,classes:Gi}),_i={name:"BaseSelect",extends:it,props:{options:Array,optionLabel:[String,Function],optionValue:[String,Function],optionDisabled:[String,Function],optionGroupLabel:[String,Function],optionGroupChildren:[String,Function],scrollHeight:{type:String,default:"14rem"},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},editable:Boolean,placeholder:{type:String,default:null},dataKey:null,showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},labelId:{type:String,default:null},labelClass:{type:[String,Object],default:null},labelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},appendTo:{type:[String,Object],default:"body"},loading:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},resetFilterOnHide:{type:Boolean,default:!1},resetFilterOnClear:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!0},checkmark:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Ni,provide:function(){return{$pcSelect:this,$parentInstance:this}}};function Ee(t){"@babel/helpers - typeof";return Ee=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ee(t)}function qi(t){return Yi(t)||Xi(t)||Zi(t)||Wi()}function Wi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Zi(t,e){if(t){if(typeof t=="string")return vt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?vt(t,e):void 0}}function Xi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Yi(t){if(Array.isArray(t))return vt(t)}function vt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Gt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Nt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Gt(Object(n),!0).forEach(function(l){ke(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Gt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ke(t,e,n){return(e=Ji(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ji(t){var e=Qi(t,"string");return Ee(e)=="symbol"?e:e+""}function Qi(t,e){if(Ee(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ee(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var te={name:"Select",extends:_i,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter"],outsideClickListener:null,scrollHandler:null,resizeListener:null,labelClickListener:null,matchMediaOrientationListener:null,overlay:null,list:null,virtualScroller:null,searchTimeout:null,searchValue:null,isModelValueChanged:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1,queryOrientation:null}},watch:{modelValue:function(){this.isModelValueChanged=!0},options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel(),this.bindLabelClickListener(),this.bindMatchMediaOrientationListener()},updated:function(){this.overlayVisible&&this.isModelValueChanged&&this.scrollInView(this.findSelectedOptionIndex()),this.isModelValueChanged=!1},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindLabelClickListener(),this.unbindMatchMediaOrientationListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(se.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return(this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e))+"_"+n},getPTItemOptions:function(e,n,l,s){return this.ptm(s,{context:{option:e,index:l,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),e&&J(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&J(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n=this;setTimeout(function(){var l,s;n.focused=!1,n.focusedOptionIndex=-1,n.searchValue="",n.$emit("blur",e),(l=(s=n.formField).onBlur)===null||l===void 0||l.call(s,e)},100)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}if(Sn())switch(e.code){case"Backspace":this.onBackspaceKey(e,this.editable);break;case"Enter":case"NumpadDecimal":this.onEnterKey(e);break;default:e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,this.editable);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,this.editable);break;case"Home":this.onHomeKey(e,this.editable);break;case"End":this.onEndKey(e,this.editable);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Space":this.onSpaceKey(e,this.editable);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"Backspace":this.onBackspaceKey(e,this.editable);break;case"ShiftLeft":case"ShiftRight":break;default:!l&&en(e.key)&&(!this.overlayVisible&&this.show(),!this.editable&&this.searchOptions(e,e.key),this.filter&&this.$nextTick(function(){n.$refs.filterInput&&J(n.$refs.filterInput.$el)}));break}this.clicked=!1},onEditableInput:function(e){var n=e.target.value;this.searchValue="";var l=this.searchOptions(e,n);!l&&(this.focusedOptionIndex=-1),this.updateModel(e,n),!this.overlayVisible&&he(n)&&this.show()},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,null),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Jt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onOptionSelect:function(e,n){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0;if(this.overlayVisible){var s=this.getOptionValue(n);this.updateModel(e,s),l&&this.hide(!0)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){if(!e.isComposing)switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show(),this.editable&&this.changeFocusedOptionIndex(e,this.findSelectedOptionIndex());else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else this.changeFocusedOptionIndex(e,this.findFirstOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var s=l.value.length;l.setSelectionRange(s,s),this.focusedOptionIndex=-1}}else this.changeFocusedOptionIndex(e,this.findLastOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.hide(!0)):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onSpaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;!n&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault(),e.stopPropagation()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(J(this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onBackspaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&!this.overlayVisible&&this.show()},onOverlayEnter:function(e){var n=this;se.set("overlay",e,this.$primevue.config.zIndex.overlay),Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),setTimeout(function(){n.autoFilterFocus&&n.filter&&J(n.$refs.filterInput.$el),n.autoUpdateModel()},1)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){var n=this;e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.autoFilterFocus&&this.filter&&!this.editable&&this.$nextTick(function(){n.$refs.filterInput&&J(n.$refs.filterInput.$el)}),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){se.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.overlay,this.$el):this.overlay&&(this.overlay.style.minWidth=Fe(this.$el)+"px",et(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=n.composedPath();e.overlayVisible&&e.overlay&&!l.includes(e.$el)&&!l.includes(e.overlay)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindLabelClickListener:function(){var e=this;if(!this.editable&&!this.labelClickListener){var n=document.querySelector('label[for="'.concat(this.labelId,'"]'));n&&Xe(n)&&(this.labelClickListener=function(){J(e.$refs.focusInput)},n.addEventListener("click",this.labelClickListener))}},unbindLabelClickListener:function(){if(this.labelClickListener){var e=document.querySelector('label[for="'.concat(this.labelId,'"]'));e&&Xe(e)&&e.removeEventListener("click",this.labelClickListener)}},bindMatchMediaOrientationListener:function(){var e=this;if(!this.matchMediaOrientationListener){var n=matchMedia("(orientation: portrait)");this.queryOrientation=n,this.matchMediaOrientationListener=function(){e.alignOverlay()},this.queryOrientation.addEventListener("change",this.matchMediaOrientationListener)}},unbindMatchMediaOrientationListener:function(){this.matchMediaOrientationListener&&(this.queryOrientation.removeEventListener("change",this.matchMediaOrientationListener),this.queryOrientation=null,this.matchMediaOrientationListener=null)},hasFocusableElements:function(){return Yt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionExactMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale))==this.searchValue.toLocaleLowerCase(this.filterLocale)},isOptionStartsWith:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return he(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isSelected:function(e){return Se(this.d_value,this.getOptionValue(e),this.equalityKey)},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return Ie(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidOption(s)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?Ie(this.visibleOptions.slice(0,e),function(s){return n.isValidOption(s)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)})},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e,n){var l=this;this.searchValue=(this.searchValue||"")+n;var s=-1,i=!1;return he(this.searchValue)&&(s=this.visibleOptions.findIndex(function(m){return l.isOptionExactMatched(m)}),s===-1&&(s=this.visibleOptions.findIndex(function(m){return l.isOptionStartsWith(m)})),s!==-1&&(i=!0),s===-1&&this.focusedOptionIndex===-1&&(s=this.findFirstFocusedOptionIndex()),s!==-1&&this.changeFocusedOptionIndex(e,s)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){l.searchValue="",l.searchTimeout=null},500),i},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n],!1))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,s=$e(e.list,'li[id="'.concat(l,'"]'));s?s.scrollIntoView&&s.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1)},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,s,i){l.push({optionGroup:s,group:!0,index:i});var m=n.getOptionGroupChildren(s);return m&&m.forEach(function(c){return l.push(c)}),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Xt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var s=this.options||[],i=[];return s.forEach(function(m){var c=e.getOptionGroupChildren(m),f=c.filter(function(g){return l.includes(g)});f.length>0&&i.push(Nt(Nt({},m),{},ke({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",qi(f))))}),this.flatOptions(i)}return l}return n},hasSelectedOption:function(){return this.$filled},label:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.placeholder||"p-emptylabel"},editableInputValue:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.d_value||""},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},filterResultMessageText:function(){return he(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}","1"):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},isClearIconVisible:function(){return this.showClear&&this.d_value!=null&&!this.disabled&&!this.loading},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},containerDataP:function(){return re(ke({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return re(ke(ke({placeholder:!this.editable&&this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled,editable:this.editable},this.size,this.size),"empty",!this.editable&&!this.$slots.value&&(this.label==="p-emptylabel"||this.label.length===0)))},dropdownIconDataP:function(){return re(ke({},this.size,this.size))},overlayDataP:function(){return re(ke({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:wt},components:{InputText:Ye,VirtualScroller:$t,Portal:Re,InputIcon:Ft,IconField:zt,TimesIcon:Lt,ChevronDownIcon:Vt,SpinnerIcon:It,SearchIcon:Mt,CheckIcon:St,BlankIcon:rn}},el=["id","data-p"],tl=["name","id","value","placeholder","tabindex","disabled","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","data-p"],nl=["name","id","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","aria-disabled","data-p"],il=["data-p"],ll=["id"],ol=["id"],sl=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onMousedown","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function al(t,e,n,l,s,i){var m=N("SpinnerIcon"),c=N("InputText"),f=N("SearchIcon"),g=N("InputIcon"),w=N("IconField"),I=N("CheckIcon"),E=N("BlankIcon"),U=N("VirtualScroller"),D=N("Portal"),P=je("ripple");return u(),d("div",h({ref:"container",id:t.$id,class:t.cx("root"),onClick:e[12]||(e[12]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[t.editable?(u(),d("input",h({key:0,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,type:"text",class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],value:i.editableInputValue,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,disabled:t.disabled,autocomplete:"off",role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":s.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),onInput:e[3]||(e[3]=function(){return i.onEditableInput&&i.onEditableInput.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),null,16,tl)):(u(),d("span",h({key:1,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel||(i.label==="p-emptylabel"?void 0:i.label),"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":t.$id+"_list","aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,"aria-disabled":t.disabled,onFocus:e[4]||(e[4]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[5]||(e[5]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),[M(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){var O;return[j(z(i.label==="p-emptylabel"?" ":(O=i.label)!==null&&O!==void 0?O:"empty"),1)]})],16,nl)),i.isClearIconVisible?M(t.$slots,"clearicon",{key:2,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(u(),F(ue(t.clearIcon?"i":"TimesIcon"),h({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):x("",!0),p("div",h({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?M(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(u(),d("span",h({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(u(),F(m,h({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):M(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(u(),F(ue(t.dropdownIcon?"span":"ChevronDownIcon"),h({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(D,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,h({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[s.overlayVisible?(u(),d("div",h({key:0,ref:i.overlayRef,class:[t.cx("overlay"),t.panelClass,t.overlayClass],style:[t.panelStyle,t.overlayStyle],onClick:e[10]||(e[10]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[11]||(e[11]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[p("span",h({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[7]||(e[7]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),M(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.filter?(u(),d("div",h({key:0,class:t.cx("header")},t.ptm("header")),[r(w,{unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(c,{ref:"filterInput",type:"text",value:s.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(g,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[M(t.$slots,"filtericon",{},function(){return[t.filterIcon?(u(),d("span",h({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(u(),F(f,tn(h({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["unstyled","pt"]),p("span",h({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)],16)):x("",!0),p("div",h({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,h({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),nn({content:v(function(O){var H=O.styleClass,A=O.contentRef,K=O.items,C=O.getItemOptions,ae=O.contentStyle,_=O.itemSize;return[p("ul",h({ref:function($){return i.listRef($,A)},id:t.$id+"_list",class:[t.cx("list"),H],style:ae,role:"listbox"},t.ptm("list")),[(u(!0),d(V,null,oe(K,function(L,$){return u(),d(V,{key:i.getOptionRenderKey(L,i.getOptionIndex($,C))},[i.isOptionGroup(L)?(u(),d("li",h({key:0,id:t.$id+"_"+i.getOptionIndex($,C),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[M(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex($,C)},function(){return[p("span",h({class:t.cx("optionGroupLabel")},{ref_for:!0},t.ptm("optionGroupLabel")),z(i.getOptionGroupLabel(L.optionGroup)),17)]})],16,ol)):Ge((u(),d("li",h({key:1,id:t.$id+"_"+i.getOptionIndex($,C),class:t.cx("option",{option:L,focusedOption:i.getOptionIndex($,C)}),style:{height:_?_+"px":void 0},role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex($,C)),onMousedown:function(Q){return i.onOptionSelect(Q,L)},onMousemove:function(Q){return i.onOptionMouseMove(Q,i.getOptionIndex($,C))},onClick:e[8]||(e[8]=ln(function(){},["stop"])),"data-p-selected":!t.checkmark&&i.isSelected(L),"data-p-focused":s.focusedOptionIndex===i.getOptionIndex($,C),"data-p-disabled":i.isOptionDisabled(L)},{ref_for:!0},i.getPTItemOptions(L,C,$,"option")),[t.checkmark?(u(),d(V,{key:0},[i.isSelected(L)?(u(),F(I,h({key:0,class:t.cx("optionCheckIcon")},{ref_for:!0},t.ptm("optionCheckIcon")),null,16,["class"])):(u(),F(E,h({key:1,class:t.cx("optionBlankIcon")},{ref_for:!0},t.ptm("optionBlankIcon")),null,16,["class"]))],64)):x("",!0),M(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex($,C)},function(){return[p("span",h({class:t.cx("optionLabel")},{ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,sl)),[[P]])],64)}),128)),s.filterValue&&(!K||K&&K.length===0)?(u(),d("li",h({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[M(t.$slots,"emptyfilter",{},function(){return[j(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(u(),d("li",h({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[M(t.$slots,"empty",{},function(){return[j(z(i.emptyMessageText),1)]})],16)):x("",!0)],16,ll)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(O){var H=O.options;return[M(t.$slots,"loader",{options:H})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),M(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(u(),d("span",h({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):x("",!0),p("span",h({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),p("span",h({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[9]||(e[9]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,il)):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,el)}te.render=al;var rl=`
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
`,ul={root:function(e){var n=e.instance,l=e.props;return["p-textarea p-component",{"p-filled":n.$filled,"p-textarea-resizable ":l.autoResize,"p-textarea-sm p-inputfield-sm":l.size==="small","p-textarea-lg p-inputfield-lg":l.size==="large","p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-textarea-fluid":n.$fluid}]}},dl=me.extend({name:"textarea",style:rl,classes:ul}),cl={name:"BaseTextarea",extends:it,props:{autoResize:Boolean},style:dl,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function De(t){"@babel/helpers - typeof";return De=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},De(t)}function pl(t,e,n){return(e=hl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function hl(t){var e=fl(t,"string");return De(e)=="symbol"?e:e+""}function fl(t,e){if(De(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(De(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var we={name:"Textarea",extends:cl,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,n=parseInt(e)||0,l=this.$el.scrollHeight,s=!n||l>n,i=n&&l<n;i?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):s&&(this.$el.style.height="".concat(l,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return h(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return re(pl({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},ml=["value","name","disabled","aria-invalid","data-p"];function bl(t,e,n,l,s,i){return u(),d("textarea",h({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":i.dataP,onInput:e[0]||(e[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},i.attrs),null,16,ml)}we.render=bl;const vl={class:"pt-1.5"},gl={class:"flex items-baseline gap-2 text-ink"},yl={key:0,class:"tnum text-[13px] text-tally"},kl={key:0,class:"mt-0.5 text-[13px] leading-snug text-ink-3"},wl={class:"min-w-0"},Ol={key:0,class:"mt-1 text-[13px] text-ink-3"},y=lt({__name:"FormField",props:{label:{},hint:{},value:{},stacked:{type:Boolean}},setup(t){return(e,n)=>(u(),d("div",{class:G(t.stacked?"flex flex-col gap-2":"grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1")},[p("div",vl,[p("div",gl,[j(z(t.label)+" ",1),t.value!==void 0&&t.value!==null?(u(),d("span",yl,z(t.value),1)):x("",!0)]),t.hint&&!t.stacked?(u(),d("div",kl,z(t.hint),1)):x("",!0)]),p("div",wl,[M(e.$slots,"default"),t.hint&&t.stacked?(u(),d("div",Ol,z(t.hint),1)):x("",!0)])],2))}}),xl={class:"relative aspect-video overflow-hidden rounded-md bg-black"},Il=["src"],Sl={key:1,class:"absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-ink-2"},Ll={key:2,class:"absolute inset-0 flex items-center justify-center p-6 text-center text-ink-2"},Cl={class:"mt-3 flex items-center justify-between gap-4"},Vl={class:"text-[13px] text-ink-3"},Ml={class:"flex shrink-0 gap-2"},zl=lt({__name:"FxPreview",props:Te({target:{},channelId:{},projectId:{},settings:{type:Function}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:["update:visible"],setup(t){const e=Ct(t,"visible"),n=t,l=R(""),s=R(!1),i=R(""),m=R(!0),c=R(0),f=R(0);async function g(){if(n.target){s.value=!0,i.value="";try{const I=await de.post("/api/fx-preview",{kind:n.target.kind,effect:n.target.effect,channel_id:n.channelId??null,project_id:n.projectId??null,pick:f.value,settings:n.settings()});l.value=I.url,m.value=I.own_images,c.value=I.images}catch(I){i.value=I.message}finally{s.value=!1}}}function w(){f.value+=n.target?.kind==="transition"?2:1,g()}return Ze(()=>[e.value,n.target],([I])=>{I&&(l.value="",g())}),(I,E)=>(u(),F(b(on),{visible:e.value,"onUpdate:visible":E[0]||(E[0]=U=>e.value=U),modal:"",header:t.target?.title??"Превью",style:{width:"min(820px, 96vw)"}},{default:v(()=>[p("div",xl,[l.value?(u(),d("video",{key:l.value,src:l.value,autoplay:"",loop:"",muted:"",playsinline:"",class:"h-full w-full"},null,8,Il)):x("",!0),s.value?(u(),d("div",Sl,[...E[1]||(E[1]=[p("i",{class:"pi pi-spin pi-spinner"},null,-1),j("Рендер превью… ",-1)])])):i.value?(u(),d("div",Ll,z(i.value),1)):x("",!0)]),p("div",Cl,[p("p",Vl,[m.value?(u(),d(V,{key:0},[j("На картинке канала, с текущими настройками (ещё не сохранёнными).")],64)):(u(),d(V,{key:1},[j("В канале пока нет картинок — показано на условной заглушке.")],64))]),p("div",Ml,[m.value&&c.value>1?(u(),F(b(fe),{key:0,label:"Другая картинка",icon:"pi pi-images",severity:"secondary",size:"small",disabled:s.value,onClick:w},null,8,["disabled"])):x("",!0),r(b(fe),{label:"Обновить",icon:"pi pi-refresh",severity:"secondary",size:"small",disabled:s.value,onClick:g},null,8,["disabled"])])])]),_:1},8,["visible","header"]))}}),Fl={class:"grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]"},$l={class:"flex min-h-0 flex-col border-r border-line-soft"},Tl={class:"flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3"},Pl={class:"min-h-0 flex-1 overflow-y-auto"},Al=["onClick"],El=["aria-label","onClick"],Dl={class:"min-w-0 flex-1"},Hl={class:"block truncate font-medium"},Bl={class:"block truncate text-[13px] text-ink-3"},Kl={key:0,class:"pi pi-check text-tally"},Ul={class:"p-4 text-center"},Rl={key:1,class:"text-ink-3"},jl={key:2,class:"text-ink-3"},Gl={class:"flex min-h-0 flex-col overflow-y-auto p-5"},Nl={class:"font-display text-lg"},_l={key:0,class:"mt-1 line-clamp-4 text-[13px] text-ink-3"},ql={class:"mt-5 flex flex-col gap-4"},Wl={key:1,class:"m-auto max-w-60 text-center text-ink-3"},Zl=lt({__name:"VoicePicker",props:Te({language:{}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:Te(["created"],["update:visible"]),setup(t,{emit:e}){const n=Ct(t,"visible"),l=t,s=e,i=tt(),m=_e(),c=R("elevenlabs"),f=R(""),g=R(null),w=R(l.language??null),I=R([]),E=R(0),U=R(!1),D=R(!1),P=R(null),O=R(null),H=new Audio;H.onended=()=>O.value=null;const A=R({name:"",model_id:"eleven_multilingual_v2",stability:.5,similarity_boost:.75,style:0,speed:1}),K=R(!1),C=[{id:"eleven_multilingual_v2",name:"Multilingual v2 — стабильный, лучший для длинных текстов"},{id:"eleven_v3",name:"v3 — самый выразительный, больше языков"},{id:"eleven_turbo_v2_5",name:"Turbo v2.5 — быстрый и дешевле"},{id:"eleven_flash_v2_5",name:"Flash v2.5 — самый быстрый"}],ae=Y(()=>[{code:null,name:"Любой язык"},...i.meta?.languages??[]]);async function _(B=!0){D.value=!0,B&&(E.value=0);try{const T=new URLSearchParams({source:c.value,search:f.value,language:w.value??"",gender:g.value??"",page:String(E.value)}),S=await de.get(`/api/lumean/voices?${T}`);I.value=B?S.voices:[...I.value,...S.voices],U.value=S.has_more}catch(T){m.error(T,"Каталог голосов недоступен")}finally{D.value=!1}}function L(){E.value+=1,_(!1)}function $(B){if(B.preview_url){if(O.value===B.voice_id){H.pause(),O.value=null;return}H.src=B.preview_url,H.play(),O.value=B.voice_id}}function Z(B){P.value=B;const T=w.value?` ${w.value.toUpperCase()}`:"";A.value.name=`${B.name}${T}`}async function Q(){if(P.value){K.value=!0;try{const B=await de.post("/api/lumean/templates",{...A.value,voice_id:P.value.voice_id,language_code:w.value||null});m.ok("Голос добавлен в Lumean",B.name),s("created",B),n.value=!1}catch(B){m.error(B)}finally{K.value=!1}}}let W;return Ze([f],()=>{window.clearTimeout(W),W=window.setTimeout(()=>_(),400)}),Ze([c,g,w],()=>_()),Ze(n,B=>{B&&!I.value.length&&_(),B||H.pause()}),Ln(()=>H.pause()),(B,T)=>(u(),F(b(on),{visible:n.value,"onUpdate:visible":T[10]||(T[10]=S=>n.value=S),modal:"",header:"Подбор голоса",style:{width:"min(1100px, 96vw)"},"content-style":{padding:0}},{default:v(()=>[p("div",Fl,[p("div",$l,[p("div",Tl,[r(b(be),{modelValue:c.value,"onUpdate:modelValue":T[0]||(T[0]=S=>c.value=S),options:[{v:"elevenlabs",l:"ElevenLabs"},{v:"lumean",l:"Lumean"}],"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),r(b(Ye),{modelValue:f.value,"onUpdate:modelValue":T[1]||(T[1]=S=>f.value=S),placeholder:"Поиск: тембр, стиль, имя",size:"small",class:"min-w-48 flex-1"},null,8,["modelValue"]),r(b(te),{modelValue:w.value,"onUpdate:modelValue":T[2]||(T[2]=S=>w.value=S),options:ae.value,"option-value":"code","option-label":"name",size:"small",class:"w-40"},null,8,["modelValue","options"]),r(b(te),{modelValue:g.value,"onUpdate:modelValue":T[3]||(T[3]=S=>g.value=S),options:[{v:null,l:"Любой пол"},{v:"male",l:"Мужской"},{v:"female",l:"Женский"}],"option-value":"v","option-label":"l",size:"small",class:"w-36"},null,8,["modelValue"])]),p("div",Pl,[(u(!0),d(V,null,oe(I.value,S=>(u(),d("button",{key:S.voice_id,class:G(["flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised",P.value?.voice_id===S.voice_id?"bg-raised":""]),onClick:ie=>Z(S)},[p("span",{role:"button","aria-label":O.value===S.voice_id?"Остановить":"Прослушать",class:G(["flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",[O.value===S.voice_id?"border-tally bg-tally text-tally-ink":"border-line text-ink-2 hover:border-ink-3",S.preview_url?"":"opacity-30"]]),onClick:ln(ie=>$(S),["stop"])},[p("i",{class:G([["pi",O.value===S.voice_id?"pi-pause":"pi-play"],"text-xs"])},null,2)],10,El),p("span",Dl,[p("span",Hl,z(S.name),1),p("span",Bl,z([S.gender==="male"?"мужской":S.gender==="female"?"женский":"",S.age,S.accent,S.use_case,S.language].filter(Boolean).join(", ")||S.description),1)]),P.value?.voice_id===S.voice_id?(u(),d("i",Kl)):x("",!0)],10,Al))),128)),p("div",Ul,[U.value?(u(),F(b(fe),{key:0,label:"Показать ещё",text:"",severity:"secondary",loading:D.value,onClick:L},null,8,["loading"])):D.value?(u(),d("span",Rl,"Загрузка…")):I.value.length?x("",!0):(u(),d("span",jl,"Ничего не найдено. Измените фильтры."))])])]),p("div",Gl,[P.value?(u(),d(V,{key:0},[p("div",Nl,z(P.value.name),1),P.value.description?(u(),d("p",_l,z(P.value.description),1)):x("",!0),p("div",ql,[r(y,{label:"Название шаблона",stacked:""},{default:v(()=>[r(b(Ye),{modelValue:A.value.name,"onUpdate:modelValue":T[4]||(T[4]=S=>A.value.name=S),class:"w-full"},null,8,["modelValue"])]),_:1}),r(y,{label:"Модель",stacked:""},{default:v(()=>[r(b(te),{modelValue:A.value.model_id,"onUpdate:modelValue":T[5]||(T[5]=S=>A.value.model_id=S),options:C,"option-value":"id","option-label":"name",class:"w-full"},null,8,["modelValue"])]),_:1}),r(y,{label:"Стабильность",value:A.value.stability.toFixed(2),hint:"Выше — ровнее, ниже — эмоциональнее",stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.stability,"onUpdate:modelValue":T[6]||(T[6]=S=>A.value.stability=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Похожесть на оригинал",value:A.value.similarity_boost.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.similarity_boost,"onUpdate:modelValue":T[7]||(T[7]=S=>A.value.similarity_boost=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Выразительность",value:A.value.style.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.style,"onUpdate:modelValue":T[8]||(T[8]=S=>A.value.style=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Скорость речи",value:A.value.speed.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.speed,"onUpdate:modelValue":T[9]||(T[9]=S=>A.value.speed=S),min:.7,max:1.2,step:.01},null,8,["modelValue"])]),_:1},8,["value"])]),r(b(fe),{class:"mt-6",label:"Создать голос",loading:K.value,disabled:!A.value.name.trim(),onClick:Q},null,8,["loading","disabled"])],64)):(u(),d("div",Wl," Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом. "))])])]),_:1},8,["visible"]))}}),Xl={class:"grid grid-cols-[13rem_minmax(0,1fr)] gap-8"},Yl={class:"sticky top-4 flex h-fit flex-col gap-0.5"},Jl=["onClick"],Ql={class:"flex min-w-0 flex-col gap-7 pb-10"},eo={key:0,class:"rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad"},to={class:"flex gap-2"},no={class:"flex gap-2"},io={class:"flex gap-2"},lo={class:"flex items-center gap-4 pt-1.5"},oo={class:"mt-2 text-[13px] text-ink-3"},so={class:"mt-2 text-[13px] text-ink-3"},ao={class:"flex items-center gap-3"},ro={key:0,class:"mt-4 flex items-center gap-3"},uo={class:"mt-2 text-[13px] leading-snug text-ink-3"},co={class:"grid grid-cols-1 gap-2 xl:grid-cols-2"},po=["onClick"],ho={class:"flex items-baseline justify-between gap-2"},fo={class:"font-medium"},mo={class:"tnum shrink-0 text-[13px] text-ink-3"},bo={class:"mt-0.5 block text-[13px] text-ink-3"},vo={class:"flex items-center gap-3 pt-1"},go={class:"text-[13px] text-ink-3"},yo={key:0,class:"mt-3 flex flex-wrap gap-2"},ko=["src"],wo=["onClick"],Oo={key:0,class:"flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"},xo={key:0,class:"mt-3 flex flex-col gap-2"},Io={class:"flex flex-col gap-1.5"},So={key:0,class:"text-[13px] text-tally"},Lo={key:1,class:"text-[13px] text-ink-3"},Co={class:"flex gap-3"},Vo={class:"flex flex-wrap gap-2"},Mo=["onClick"],zo=["onClick"],Fo={class:"flex flex-wrap gap-2"},$o=["onClick"],To=["onClick"],Po={class:"flex items-center gap-3"},Ao={class:"flex items-center gap-3"},Eo={class:"relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]",style:{"container-type":"size"}},Do={class:"flex flex-wrap items-center gap-3"},Ho={class:"flex items-center gap-2"},Bo={class:"flex items-center gap-2"},Ko={class:"flex flex-wrap items-center gap-5"},Uo={class:"flex items-center gap-2"},Ro={key:0,class:"flex items-center gap-2"},jo={key:1,class:"flex items-center gap-2"},Go={key:2,class:"flex items-center gap-2"},No={class:"flex items-center gap-3"},_o={class:"flex items-center gap-3"},qo={class:"flex flex-wrap items-center gap-3"},Wo={class:"flex items-center gap-5 text-[13px] text-ink-2"},Zo={class:"flex items-center gap-2"},Xo={class:"flex items-center gap-2"},fa=lt({__name:"SettingsForm",props:Te({mode:{},channelId:{},projectId:{},references:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:Te(["referencesChanged"],["update:modelValue"]),setup(t,{emit:e}){const n=Ct(t,"modelValue"),l=t,s=e,i=tt(),m=_e(),c=[{id:"voice",label:"Озвучка",icon:"pi-microphone"},{id:"scenes",label:"Сцены",icon:"pi-th-large"},{id:"images",label:"Изображения",icon:"pi-image"},{id:"llm",label:"Тексты и промпты",icon:"pi-sparkles"},{id:"render",label:"Анимация и видео",icon:"pi-video"},{id:"atmosphere",label:"Атмосфера",icon:"pi-sun"},{id:"subtitles",label:"Субтитры",icon:"pi-align-center"},{id:"unique",label:"Уникализация",icon:"pi-shield"},{id:"publish",label:"Публикация",icon:"pi-youtube"}],f=R("voice"),g=R(!1),w=R(null);function I(k,o,q){w.value={kind:k,effect:o,title:q},g.value=!0}function E(){return JSON.parse(JSON.stringify({...n.value.render,atmosphere:n.value.atmosphere}))}const U=[["dust","Пылинки в воздухе","Мелкие пылинки и размытые «боке» медленно плывут по кадру — как в луче света"],["breathing","Дыхание","Герой едва заметно «дышит». В 3D-параллаксе дышит только передний план, в остальных сценах — весь кадр от нижнего края"],["light_pulse","Пульсация света","Светлые места кадра медленно мягко светятся и гаснут"],["vignette_breathing","Дыхание виньетки","Затемнение по краям медленно сгущается и отпускает"],["grain_boil","Кипящее зерно","Крупное зерно, как фактура бумаги или плёнки, сменяется рывками, как в рисованной анимации. Заменяет обычное зерно уникализации"],["line_boil","Дрожание линий","Контуры чуть дрожат, будто каждый кадр перерисован от руки. Только для рисованных стилей: на фотореализме выглядит как брак"]],D=R([]),P=R(""),O=R(null),H=R(null);async function A(){try{D.value=await de.get("/api/lumean/templates"),P.value=""}catch(k){P.value=k.message}}const K=Y(()=>D.value.map(k=>({id:k.id,label:`${k.name}${k.model_id?` · ${k.model_id.replace("eleven_","")}`:""}`}))),C=Y(()=>Object.keys(n.value.voice.templates)),ae=Y(()=>(i.meta?.languages??[]).filter(k=>!(k.code in n.value.voice.templates)));function _(){H.value&&(n.value.voice.templates={...n.value.voice.templates,[H.value]:""},H.value=null)}function L(k){const o={...n.value.voice.templates};delete o[k],n.value.voice.templates=o,n.value.voice.master_language===k&&(n.value.voice.master_language=null)}const $=Y(()=>{const k=i.meta?.languages??[];return C.value.length?k.filter(o=>C.value.includes(o.code)):k});async function Z(k){await A(),O.value==="__default"?n.value.voice.default_template_id=k.id:O.value&&(n.value.voice.templates={...n.value.voice.templates,[O.value]:k.id})}const Q=Y({get:()=>n.value.voice.speed!=null,set:k=>n.value.voice.speed=k?1:null});function W(k){const o=n.value.scenes,q=Math.min(k,o.intro_seconds);return Math.round(q/((o.intro_min_duration+o.intro_max_duration)/2)+Math.max(0,k-q)/((o.min_duration+o.max_duration)/2))}const B=Y(()=>`Пример: ${[10,30,60].map(o=>{const q=W(o*60),a=Math.min(q,n.value.scenes.max_images);return`${o} мин → ${a}${q>a?` (сцена ≈ ${Math.round(o*60/a)} с)`:""}`}).join(", ")}`),T=Y(()=>i.meta?.image_operations??[]),S=Y(()=>T.value.find(k=>k.id===n.value.images.operation)),ie=Y(()=>i.status?.fastgen?.budget??500);function ce(k){const o=T.value.find(q=>q.id===k);return(o?.credits??4)*(n.value.images.upscale_2x&&o?.upscale?2:1)}const xe=Y(()=>Math.floor(ie.value/ce(n.value.images.operation))),Le=Y(()=>n.value.images.model_strategy!=="single"),Ce=[{v:"single",l:"Одна модель"},{v:"intro",l:"Начало качественнее"},{v:"budget",l:"По бюджету"}],qe=Y(()=>({single:"Все сцены генерируются одной моделью.",intro:"Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.",budget:"Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен."})[n.value.images.model_strategy]),Tt=k=>!!T.value.find(o=>o.id===k)?.refs,Pt=k=>T.value.find(o=>o.id===k)?.name??k??"",hn=Y(()=>Le.value?[n.value.images.operation,n.value.images.economy_operation]:[n.value.images.operation]),st=Y(()=>[n.value.images.operation,n.value.images.economy_operation].find(Tt)??null),fn=Y(()=>!!st.value),At=Y(()=>{const k=hn.value.filter(o=>!Tt(o));return k.length&&st.value?k.map(Pt).join(", "):""}),Et=Y(()=>T.value.map(k=>({...k,label:`${k.name} · ${k.credits} кр.`}))),mn=Y(()=>{const o=n.value.images.budget_credits||ie.value,q=ce(n.value.images.operation),a=ce(n.value.images.economy_operation);if(q<=a)return"все 100 сцен — качественной моделью";const X=Math.max(0,Math.min(100,Math.floor((o-100*a)/(q-a))));return X>=100?"все 100 сцен — качественной моделью":`${X} качественных и ${100-X} дешёвых`}),at=R(!1);async function bn(k){const o=k.target.files;if(!(!o?.length||!l.channelId)){at.value=!0;try{for(const q of Array.from(o))await de.upload(`/api/channels/${l.channelId}/references`,q);s("referencesChanged")}catch(q){m.error(q)}finally{at.value=!1,k.target.value=""}}}async function vn(k){await de.post(`/api/channels/${l.channelId}/references/delete`,{path:k}),s("referencesChanged")}const rt=R([]);async function gn(){try{rt.value=await de.get("/api/fastgen/chat-models")}catch{rt.value=[{id:n.value.llm.model,name:n.value.llm.model,context:0}]}}function Dt(k,o){return k.includes(o)?k.filter(q=>q!==o):[...k,o]}const ut=R([]),yn=Y(()=>{const k=n.value.subtitles,o=k.size/1080*100,q=k.style==="box"?0:k.outline/1080*100*1.2;return{fontFamily:`"${k.font}", sans-serif`,fontSize:`${o}cqh`,fontWeight:k.bold?700:400,textTransform:k.uppercase?"uppercase":"none",color:k.primary_color,WebkitTextStroke:q?`${q}cqh ${k.outline_color}`:void 0,paintOrder:"stroke fill",background:k.style==="box"?`color-mix(in srgb, ${k.box_color} ${k.box_opacity*100}%, transparent)`:void 0,padding:k.style==="box"?"0.15em 0.4em":void 0,textShadow:k.shadow?`0 ${k.shadow*.15}cqh ${k.shadow*.3}cqh rgb(0 0 0 / .6)`:void 0}}),kn=Y(()=>{const k=`${n.value.subtitles.margin_v/1080*100}%`;return n.value.subtitles.position==="top"?{top:k}:n.value.subtitles.position==="middle"?{top:"45%"}:{bottom:k}});function ye(k){return k.startsWith("#")?k:`#${k}`}return Cn(async()=>{A(),gn(),ut.value=await de.get("/api/fonts").catch(()=>[])}),(k,o)=>{const q=je("tooltip");return u(),d("div",Xl,[p("nav",Yl,[(u(),d(V,null,oe(c,a=>p("button",{key:a.id,class:G(["flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised",f.value===a.id?"bg-raised text-ink":"text-ink-2"]),onClick:X=>f.value=a.id},[p("i",{class:G([["pi",a.icon],"w-4 text-[14px]"])},null,2),j(z(a.label),1)],10,Jl)),64))]),p("div",Ql,[f.value==="voice"?(u(),d(V,{key:0},[o[85]||(o[85]=p("p",{class:"text-ink-3"}," Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию. ",-1)),P.value?(u(),d("div",eo," Не удалось загрузить голоса Lumean: "+z(P.value),1)):x("",!0),t.mode==="channel"?(u(),F(y,{key:1,label:"Основной язык",hint:"На нём вставляется сценарий новых проектов, остальные языки переводятся с него"},{default:v(()=>[r(b(te),{modelValue:n.value.voice.master_language,"onUpdate:modelValue":o[0]||(o[0]=a=>n.value.voice.master_language=a),options:$.value,"option-value":"code","option-label":"name",filter:"","show-clear":"",placeholder:"Первый язык из списка",class:"w-60"},null,8,["modelValue","options"])]),_:1})):x("",!0),r(y,{label:"Голос по умолчанию",hint:"Для языков без отдельного голоса"},{default:v(()=>[p("div",to,[r(b(te),{modelValue:n.value.voice.default_template_id,"onUpdate:modelValue":o[1]||(o[1]=a=>n.value.voice.default_template_id=a),options:K.value,"option-value":"id","option-label":"label",filter:"","show-clear":"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","options"]),r(b(fe),{icon:"pi pi-search",label:"Подобрать",severity:"secondary",outlined:"",onClick:o[2]||(o[2]=a=>O.value="__default")})])]),_:1}),(u(!0),d(V,null,oe(C.value,a=>(u(),F(y,{key:a,label:b(i).langLabel(a)},{default:v(()=>[p("div",no,[r(b(te),{modelValue:n.value.voice.templates[a],"onUpdate:modelValue":X=>n.value.voice.templates[a]=X,options:K.value,"option-value":"id","option-label":"label",filter:"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","onUpdate:modelValue","options"]),Ge(r(b(fe),{icon:"pi pi-search",severity:"secondary",outlined:"","aria-label":"Подобрать голос",onClick:X=>O.value=a},null,8,["onClick"]),[[q,"Подобрать голос"]]),r(b(fe),{icon:"pi pi-trash",severity:"secondary",text:"","aria-label":"Убрать язык",onClick:X=>L(a)},null,8,["onClick"])])]),_:2},1032,["label"]))),128)),r(y,{label:"Отдельный голос для языка"},{default:v(()=>[p("div",io,[r(b(te),{modelValue:H.value,"onUpdate:modelValue":o[3]||(o[3]=a=>H.value=a),options:ae.value,"option-value":"code","option-label":"name",filter:"",placeholder:"Язык",class:"w-60"},null,8,["modelValue","options"]),r(b(fe),{label:"Добавить",severity:"secondary",outlined:"",disabled:!H.value,onClick:_},null,8,["disabled"])])]),_:1}),r(y,{label:"Своя скорость речи",hint:"Иначе используется скорость из шаблона",value:n.value.voice.speed?.toFixed(2)},{default:v(()=>[p("div",lo,[r(b(ee),{modelValue:Q.value,"onUpdate:modelValue":o[4]||(o[4]=a=>Q.value=a)},null,8,["modelValue"]),n.value.voice.speed!=null?(u(),F(b(le),{key:0,modelValue:n.value.voice.speed,"onUpdate:modelValue":o[5]||(o[5]=a=>n.value.voice.speed=a),min:.7,max:1.2,step:.01,class:"flex-1"},null,8,["modelValue"])):x("",!0)])]),_:1},8,["value"]),r(y,{label:"Озвучивать по абзацам",hint:"Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже"},{default:v(()=>[r(b(ee),{modelValue:n.value.voice.paragraph_mode,"onUpdate:modelValue":o[6]||(o[6]=a=>n.value.voice.paragraph_mode=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(Zl,{visible:O.value!==null,language:O.value&&O.value!=="__default"?O.value:void 0,"onUpdate:visible":o[7]||(o[7]=a=>!a&&(O.value=null)),onCreated:Z},null,8,["visible","language"])],64)):f.value==="scenes"?(u(),d(V,{key:1},[r(y,{label:"Способ разбивки"},{default:v(()=>[r(b(be),{modelValue:n.value.scenes.mode,"onUpdate:modelValue":o[8]||(o[8]=a=>n.value.scenes.mode=a),options:[{v:"smart",l:"По смыслу (LLM)"},{v:"auto",l:"По предложениям"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),p("p",oo,z(n.value.scenes.mode==="smart"?"Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.":"Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности."),1)]),_:1}),r(y,{label:"Чем ограничить"},{default:v(()=>[r(b(be),{modelValue:n.value.scenes.limit_mode,"onUpdate:modelValue":o[9]||(o[9]=a=>n.value.scenes.limit_mode=a),options:[{v:"duration",l:"Длительностью сцен"},{v:"count",l:"Количеством картинок"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),p("p",so,z(n.value.scenes.limit_mode==="count"?"Не больше заданного числа картинок на видео. Если с длительностью ниже картинок получится больше, сцены равномерно удлинятся.":"Сцены держатся в заданных секундах, число картинок зависит от длины видео."),1)]),_:1}),n.value.scenes.limit_mode==="count"?(u(),F(y,{key:0,label:"Картинок на видео",hint:`Не больше этого числа на одно видео (на каждую языковую версию со своими картинками). ${B.value}`},{default:v(()=>[r(b(ne),{modelValue:n.value.scenes.max_images,"onUpdate:modelValue":o[10]||(o[10]=a=>n.value.scenes.max_images=a),min:10,max:5e3,step:10,"show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"])):x("",!0),r(y,{label:n.value.scenes.limit_mode==="count"?"Длительность сцены, если лимит не мешает":"Длительность сцены",hint:"Сколько секунд держится одна картинка",value:`${n.value.scenes.min_duration}–${n.value.scenes.max_duration} с`},{default:v(()=>[p("div",ao,[r(b(ne),{modelValue:n.value.scenes.min_duration,"onUpdate:modelValue":o[11]||(o[11]=a=>n.value.scenes.min_duration=a),min:1,max:n.value.scenes.max_duration,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","max"]),o[86]||(o[86]=p("span",{class:"text-ink-3"},"до",-1)),r(b(ne),{modelValue:n.value.scenes.max_duration,"onUpdate:modelValue":o[12]||(o[12]=a=>n.value.scenes.max_duration=a),min:n.value.scenes.min_duration,max:60,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","min"])])]),_:1},8,["label","value"]),r(y,{label:"Быстрое начало",hint:"В первые секунды картинки меняются чаще — это удерживает зрителя",value:`${n.value.scenes.intro_seconds} с`},{default:v(()=>[r(b(le),{modelValue:n.value.scenes.intro_seconds,"onUpdate:modelValue":o[13]||(o[13]=a=>n.value.scenes.intro_seconds=a),min:0,max:180,step:5,class:"mt-3"},null,8,["modelValue"]),n.value.scenes.intro_seconds>0?(u(),d("div",ro,[o[87]||(o[87]=p("span",{class:"text-ink-3"},"Сцены в начале",-1)),r(b(ne),{modelValue:n.value.scenes.intro_min_duration,"onUpdate:modelValue":o[14]||(o[14]=a=>n.value.scenes.intro_min_duration=a),min:1,max:n.value.scenes.intro_max_duration,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","max"]),o[88]||(o[88]=p("span",{class:"text-ink-3"},"до",-1)),r(b(ne),{modelValue:n.value.scenes.intro_max_duration,"onUpdate:modelValue":o[15]||(o[15]=a=>n.value.scenes.intro_max_duration=a),min:n.value.scenes.intro_min_duration,max:30,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","min"])])):x("",!0)]),_:1},8,["value"])],64)):f.value==="images"?(u(),d(V,{key:2},[r(y,{label:"Распределение моделей"},{default:v(()=>[r(b(be),{modelValue:n.value.images.model_strategy,"onUpdate:modelValue":o[16]||(o[16]=a=>n.value.images.model_strategy=a),options:Ce,"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),p("p",uo,z(qe.value),1)]),_:1}),r(y,{label:Le.value?"Качественная модель":"Модель",hint:`≈ ${xe.value} картинок в час на вашем тарифе`},{default:v(()=>[p("div",co,[(u(!0),d(V,null,oe(T.value,a=>(u(),d("button",{key:a.id,class:G(["rounded-md border px-3.5 py-2.5 text-left transition-colors",n.value.images.operation===a.id?"border-tally bg-tally/10":"border-line hover:border-ink-3"]),onClick:X=>n.value.images.operation=a.id},[p("span",ho,[p("span",fo,z(a.name),1),p("span",mo,z(a.credits)+" кр.",1)]),p("span",bo,z(a.note),1)],10,po))),128))])]),_:1},8,["label","hint"]),Le.value?(u(),d(V,{key:0},[r(y,{label:"Дешёвая модель",hint:`Для остальных сцен · ≈ ${Math.floor(ie.value/ce(n.value.images.economy_operation))} картинок в час`},{default:v(()=>[r(b(te),{modelValue:n.value.images.economy_operation,"onUpdate:modelValue":o[17]||(o[17]=a=>n.value.images.economy_operation=a),options:Et.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),_:1},8,["hint"]),n.value.images.model_strategy==="intro"?(u(),F(y,{key:0,label:"Качественная модель первые",hint:"Минут от начала каждого видео"},{default:v(()=>[r(b(ne),{modelValue:n.value.images.premium_minutes,"onUpdate:modelValue":o[18]||(o[18]=a=>n.value.images.premium_minutes=a),min:.5,max:60,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" мин","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1})):(u(),F(y,{key:1,label:"Бюджет на проект",hint:`Кредитов на все картинки проекта. 0 — один час тарифа (${ie.value} кр.). Для 10-минутного видео: ${mn.value}`},{default:v(()=>[r(b(ne),{modelValue:n.value.images.budget_credits,"onUpdate:modelValue":o[19]||(o[19]=a=>n.value.images.budget_credits=a),min:0,step:50,suffix:" кр.","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"]))],64)):x("",!0),S.value?.upscale?(u(),F(y,{key:1,label:"Увеличение 2×",hint:"Чётче при зуме и в 1440p/4K, но вдвое дороже"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.upscale_2x,"onUpdate:modelValue":o[20]||(o[20]=a=>n.value.images.upscale_2x=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):x("",!0),r(y,{label:"Стиль канала",hint:"Добавляется к каждому промпту: техника, свет, цвет, настроение"},{default:v(()=>[r(b(we),{modelValue:n.value.images.style_prompt,"onUpdate:modelValue":o[21]||(o[21]=a=>n.value.images.style_prompt=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(y,{label:"Чего не должно быть",hint:"Перечислите через запятую"},{default:v(()=>[r(b(we),{modelValue:n.value.images.avoid,"onUpdate:modelValue":o[22]||(o[22]=a=>n.value.images.avoid=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1}),r(y,{label:"Референсы стиля",hint:t.mode==="channel"?"Примеры картинок в нужном стиле — отправляются вместе с каждым запросом":"Задаются в настройках канала"},{default:v(()=>[p("div",vo,[r(b(ee),{modelValue:n.value.images.use_references,"onUpdate:modelValue":o[23]||(o[23]=a=>n.value.images.use_references=a),disabled:!S.value?.refs},null,8,["modelValue","disabled"]),p("span",go,z(S.value?.refs?"Использовать референсы":"Эта модель не принимает референсы"),1)]),t.references?.length||t.mode==="channel"?(u(),d("div",yo,[(u(!0),d(V,null,oe(t.references,a=>(u(),d("div",{key:a.path,class:"group relative h-20 w-32 overflow-hidden rounded-md border border-line"},[p("img",{src:a.url,alt:"Референс стиля",class:"h-full w-full object-cover"},null,8,ko),t.mode==="channel"?(u(),d("button",{key:0,class:"absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex","aria-label":"Удалить референс",onClick:X=>vn(a.path)},[...o[89]||(o[89]=[p("i",{class:"pi pi-times text-xs"},null,-1)])],8,wo)):x("",!0)]))),128)),t.mode==="channel"?(u(),d("label",Oo,[p("i",{class:G(["pi",at.value?"pi-spin pi-spinner":"pi-plus"])},null,2),o[90]||(o[90]=j("Добавить ",-1)),p("input",{type:"file",accept:"image/*",multiple:"",class:"hidden",onChange:bn},null,32)])):x("",!0)])):x("",!0)]),_:1},8,["hint"]),r(y,{label:"Референсы персонажей",hint:"Повторяющиеся герои получают портрет-образец, который отправляется со всеми сценами, где они есть: лицо, причёска и одежда не меняются от кадра к кадру"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.character_refs,"onUpdate:modelValue":o[24]||(o[24]=a=>n.value.images.character_refs=a),class:"mt-1.5"},null,8,["modelValue"]),n.value.images.character_refs?(u(),d("div",xo,[p("label",Io,[o[91]||(o[91]=p("span",{class:"text-[13px] text-ink-2"},"Модель для портретов",-1)),r(b(te),{modelValue:n.value.images.character_operation,"onUpdate:modelValue":o[25]||(o[25]=a=>n.value.images.character_operation=a),options:Et.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),fn.value?At.value?(u(),d("p",Lo,z(At.value)+" не принимает референсы — сцены с персонажами сделает "+z(Pt(st.value))+". ",1)):x("",!0):(u(),d("p",So," Ни одна из выбранных моделей не принимает референсы — портреты не будут учитываться. Выберите, например, Nano Banana 2. "))])):x("",!0)]),_:1}),r(y,{label:"Продолжение кадра",hint:"Когда рассказ остаётся в той же ситуации и меняется только деталь, следующая картинка рисуется из предыдущей: место, люди и ракурс сохраняются, меняется только нужное. LLM отмечает такие сцены при создании промптов, отметку можно поменять у сцены"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.scene_continuity,"onUpdate:modelValue":o[26]||(o[26]=a=>n.value.images.scene_continuity=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(y,{label:"Водяные знаки",hint:"Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется"},{default:v(()=>[r(b(te),{modelValue:n.value.images.watermark_fix,"onUpdate:modelValue":o[27]||(o[27]=a=>n.value.images.watermark_fix=a),options:[{v:"auto",l:"Удалять автоматически"},{v:"crop",l:"Обрезать угол"},{v:"none",l:"Не трогать"}],"option-value":"v","option-label":"l",class:"w-64"},null,8,["modelValue"])]),_:1}),r(y,{label:"Исправлять отклонённые промпты",hint:"Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.auto_fix_rejected,"onUpdate:modelValue":o[28]||(o[28]=a=>n.value.images.auto_fix_rejected=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(y,{label:"Попыток на картинку"},{default:v(()=>[r(b(ne),{modelValue:n.value.images.max_attempts,"onUpdate:modelValue":o[29]||(o[29]=a=>n.value.images.max_attempts=a),min:1,max:6,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="llm"?(u(),d(V,{key:3},[r(y,{label:"Модель",hint:"Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком"},{default:v(()=>[r(b(te),{modelValue:n.value.llm.model,"onUpdate:modelValue":o[30]||(o[30]=a=>n.value.llm.model=a),options:rt.value,"option-value":"id","option-label":"name",filter:"",class:"w-80"},null,8,["modelValue","options"])]),_:1}),r(y,{label:"Тематика канала",hint:"О чём канал и для кого — помогает точнее подбирать образы и названия"},{default:v(()=>[r(b(we),{modelValue:n.value.llm.niche,"onUpdate:modelValue":o[31]||(o[31]=a=>n.value.llm.niche=a),"auto-resize":"",rows:"2",class:"w-full",placeholder:"Например: психология отношений для женщин 30–50 лет"},null,8,["modelValue"])]),_:1}),r(y,{label:"Указания для промптов",hint:"Постоянные правила для картинок канала"},{default:v(()=>[r(b(we),{modelValue:n.value.llm.prompt_instructions,"onUpdate:modelValue":o[32]||(o[32]=a=>n.value.llm.prompt_instructions=a),"auto-resize":"",rows:"3",class:"w-full",placeholder:"Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"},null,8,["modelValue"])]),_:1}),r(y,{label:"Креативность",value:n.value.llm.temperature.toFixed(1),hint:"Выше — разнообразнее образы, ниже — точнее по тексту"},{default:v(()=>[r(b(le),{modelValue:n.value.llm.temperature,"onUpdate:modelValue":o[33]||(o[33]=a=>n.value.llm.temperature=a),min:0,max:1.2,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):f.value==="render"?(u(),d(V,{key:4},[r(y,{label:"Разрешение и частота"},{default:v(()=>[p("div",Co,[r(b(te),{modelValue:n.value.render.resolution,"onUpdate:modelValue":o[34]||(o[34]=a=>n.value.render.resolution=a),options:[{v:"1080p",l:"1920×1080 (Full HD)"},{v:"1440p",l:"2560×1440 (2K)"},{v:"2160p",l:"3840×2160 (4K)"}],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue"]),r(b(te),{modelValue:n.value.render.fps,"onUpdate:modelValue":o[35]||(o[35]=a=>n.value.render.fps=a),options:[24,25,30,60],class:"w-28"},null,8,["modelValue"])]),o[92]||(o[92]=p("p",{class:"mt-2 text-[13px] text-ink-3"},"1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.",-1))]),_:1}),r(y,{label:"Движение камеры",hint:"Для каждой сцены выбирается случайно из отмеченных. ▶ — превью с текущей интенсивностью"},{default:v(()=>[p("div",Vo,[(u(!0),d(V,null,oe(b(i).meta?.effects,a=>(u(),d("span",{key:a.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.motion_effects.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[p("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:X=>n.value.render.motion_effects=Dt(n.value.render.motion_effects,a.id)},z(a.name),9,Mo),p("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:X=>I("motion",a.id,`Движение камеры: ${a.name}`)},[...o[93]||(o[93]=[p("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,zo)],2))),128))])]),_:1}),r(y,{label:"Интенсивность движения",value:`${Math.round(n.value.render.motion_intensity*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.render.motion_intensity,"onUpdate:modelValue":o[36]||(o[36]=a=>n.value.render.motion_intensity=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Крупные планы по фразам",hint:"Внутри сцены монтаж чередует общий план и более крупный план героя, склейки — на паузах в речи. Новые картинки не нужны"},{default:v(()=>[r(b(ee),{modelValue:n.value.render.phrase_cuts,"onUpdate:modelValue":o[37]||(o[37]=a=>n.value.render.phrase_cuts=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.render.motion_effects.includes("parallax")?(u(),F(y,{key:0,label:"Размытие фона",hint:"3D-параллакс: фон за героем мягко размыт, как при съёмке на длиннофокусный объектив"},{default:v(()=>[r(b(ee),{modelValue:n.value.render.depth_of_field,"onUpdate:modelValue":o[38]||(o[38]=a=>n.value.render.depth_of_field=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):x("",!0),r(y,{label:"Переходы"},{default:v(()=>[p("div",Fo,[(u(!0),d(V,null,oe(b(i).meta?.transitions,a=>(u(),d("span",{key:a.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.transitions.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[p("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:X=>n.value.render.transitions=Dt(n.value.render.transitions,a.id)},z(a.name),9,$o),p("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:X=>I("transition",a.id,`Переход: ${a.name}`)},[...o[94]||(o[94]=[p("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,To)],2))),128))])]),_:1}),r(y,{label:"Длительность перехода",value:`${n.value.render.transition_duration.toFixed(1)} с`},{default:v(()=>[r(b(le),{modelValue:n.value.render.transition_duration,"onUpdate:modelValue":o[39]||(o[39]=a=>n.value.render.transition_duration=a),min:.2,max:1.5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Доля простых склеек",value:`${Math.round(n.value.render.cut_ratio*100)}%`,hint:"Без эффекта перехода — так монтаж выглядит естественнее"},{default:v(()=>[r(b(le),{modelValue:n.value.render.cut_ratio,"onUpdate:modelValue":o[40]||(o[40]=a=>n.value.render.cut_ratio=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Появление и затухание"},{default:v(()=>[p("div",Po,[r(b(ne),{modelValue:n.value.render.fade_in,"onUpdate:modelValue":o[41]||(o[41]=a=>n.value.render.fade_in=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(ne),{modelValue:n.value.render.fade_out,"onUpdate:modelValue":o[42]||(o[42]=a=>n.value.render.fade_out=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(y,{label:"Качество кодирования"},{default:v(()=>[r(b(be),{modelValue:n.value.render.quality,"onUpdate:modelValue":o[43]||(o[43]=a=>n.value.render.quality=a),options:[{v:"max",l:"Максимум"},{v:"high",l:"Высокое"},{v:"balanced",l:"Баланс"},{v:"fast",l:"Быстро"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(y,{label:"Ограничение битрейта",hint:"YouTube всё равно пережимает видео. При 12 Мбит/с качество на глаз то же, а ролики с зерном и 3D весят вдвое меньше"},{default:v(()=>[r(b(be),{modelValue:n.value.render.max_bitrate,"onUpdate:modelValue":o[44]||(o[44]=a=>n.value.render.max_bitrate=a),options:[{v:8,l:"8 Мбит/с"},{v:12,l:"12 Мбит/с"},{v:0,l:"Без ограничения"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(y,{label:"Энкодер",hint:"Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее"},{default:v(()=>[r(b(te),{modelValue:n.value.render.encoder,"onUpdate:modelValue":o[45]||(o[45]=a=>n.value.render.encoder=a),options:[{v:"auto",l:"Автоматически"},...(b(i).meta?.encoders??[]).map(a=>({v:a,l:a}))],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(y,{label:"Громкость",hint:"YouTube нормализует к −14 LUFS",value:`${n.value.render.loudness} LUFS`},{default:v(()=>[r(b(le),{modelValue:n.value.render.loudness,"onUpdate:modelValue":o[46]||(o[46]=a=>n.value.render.loudness=a),min:-24,max:-9,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Процессов рендера",hint:"0 — подобрать автоматически по числу ядер"},{default:v(()=>[r(b(ne),{modelValue:n.value.render.workers,"onUpdate:modelValue":o[47]||(o[47]=a=>n.value.render.workers=a),min:0,max:16,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="atmosphere"?(u(),d(V,{key:5},[o[95]||(o[95]=p("p",{class:"text-ink-3"}," Едва заметная жизнь в статичной картинке. Каждый рендер получает свой ритм, так что эффекты ещё и уникализируют видео. Зерно и дрожание линий заметно увеличивают размер файла. ",-1)),p("div",null,[r(b(fe),{label:"Превью всех включённых",icon:"pi pi-play",severity:"secondary",size:"small",disabled:!U.some(a=>n.value.atmosphere[a[0]]),onClick:o[48]||(o[48]=a=>I("atmosphere","all","Атмосфера: все включённые эффекты"))},null,8,["disabled"])]),(u(),d(V,null,oe(U,a=>(u(),d(V,{key:a[0]},[r(y,{label:a[1],hint:a[2]},{default:v(()=>[p("div",Ao,[r(b(ee),{modelValue:n.value.atmosphere[a[0]],"onUpdate:modelValue":X=>n.value.atmosphere[a[0]]=X,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"]),r(b(fe),{label:"Превью",icon:"pi pi-play",severity:"secondary",size:"small",text:"",class:"mt-1",onClick:X=>I("atmosphere",a[0],`Атмосфера: ${a[1]}`)},null,8,["onClick"])])]),_:2},1032,["label","hint"]),n.value.atmosphere[a[0]]?(u(),F(y,{key:0,label:"Сила",value:`${Math.round(n.value.atmosphere[`${a[0]}_strength`]*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.atmosphere[`${a[0]}_strength`],"onUpdate:modelValue":X=>n.value.atmosphere[`${a[0]}_strength`]=X,min:.05,max:1,step:.05,class:"mt-3"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["value"])):x("",!0)],64))),64)),n.value.atmosphere.line_boil||n.value.atmosphere.grain_boil?(u(),F(y,{key:0,label:"Частота «кипения»",hint:"Как часто перерисовываются линии и зерно"},{default:v(()=>[r(b(be),{modelValue:n.value.atmosphere.boil_hold,"onUpdate:modelValue":o[49]||(o[49]=a=>n.value.atmosphere.boil_hold=a),options:[{v:2,l:"Быстро (на двойках)"},{v:3,l:"Классика (на тройках)"},{v:4,l:"Медленно"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1})):x("",!0)],64)):f.value==="subtitles"?(u(),d(V,{key:6},[r(y,{label:"Вшивать субтитры в видео",hint:"Файл .srt для загрузки на YouTube создаётся всегда"},{default:v(()=>[r(b(ee),{modelValue:n.value.subtitles.enabled,"onUpdate:modelValue":o[50]||(o[50]=a=>n.value.subtitles.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.enabled?(u(),d(V,{key:0},[p("div",Eo,[p("div",{class:"absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight",style:dt(kn.value)},[p("span",{style:dt(yn.value)},[n.value.subtitles.style==="karaoke"?(u(),d(V,{key:0},[p("span",{style:dt({color:n.value.subtitles.highlight_color})},"Так выглядят",4),o[96]||(o[96]=j(" субтитры",-1)),o[97]||(o[97]=p("br",null,null,-1)),o[98]||(o[98]=j("в вашем видео ",-1))],64)):(u(),d(V,{key:1},[o[99]||(o[99]=j("Так выглядят субтитры",-1)),o[100]||(o[100]=p("br",null,null,-1)),o[101]||(o[101]=j("в вашем видео",-1))],64))],4)],4)]),r(y,{label:"Стиль"},{default:v(()=>[r(b(be),{modelValue:n.value.subtitles.style,"onUpdate:modelValue":o[51]||(o[51]=a=>n.value.subtitles.style=a),options:[{v:"plain",l:"Обводка"},{v:"karaoke",l:"Подсветка слов"},{v:"box",l:"Плашка"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(y,{label:"Шрифт",hint:"Свои шрифты положите в папку data/fonts"},{default:v(()=>[p("div",Do,[r(b(te),{modelValue:n.value.subtitles.font,"onUpdate:modelValue":o[52]||(o[52]=a=>n.value.subtitles.font=a),options:ut.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(ne),{modelValue:n.value.subtitles.size,"onUpdate:modelValue":o[53]||(o[53]=a=>n.value.subtitles.size=a),min:20,max:140,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"]),p("label",Ho,[r(b(ee),{modelValue:n.value.subtitles.bold,"onUpdate:modelValue":o[54]||(o[54]=a=>n.value.subtitles.bold=a)},null,8,["modelValue"]),o[102]||(o[102]=j("Жирный",-1))]),p("label",Bo,[r(b(ee),{modelValue:n.value.subtitles.uppercase,"onUpdate:modelValue":o[55]||(o[55]=a=>n.value.subtitles.uppercase=a)},null,8,["modelValue"]),o[103]||(o[103]=j("Заглавные",-1))])])]),_:1}),r(y,{label:"Цвета"},{default:v(()=>[p("div",Ko,[p("label",Uo,[r(b(ve),{"model-value":n.value.subtitles.primary_color.slice(1),"onUpdate:modelValue":o[56]||(o[56]=a=>n.value.subtitles.primary_color=ye(a))},null,8,["model-value"]),o[104]||(o[104]=j("Текст ",-1))]),n.value.subtitles.style==="karaoke"?(u(),d("label",Ro,[r(b(ve),{"model-value":n.value.subtitles.highlight_color.slice(1),"onUpdate:modelValue":o[57]||(o[57]=a=>n.value.subtitles.highlight_color=ye(a))},null,8,["model-value"]),o[105]||(o[105]=j("Подсветка ",-1))])):x("",!0),n.value.subtitles.style!=="box"?(u(),d("label",jo,[r(b(ve),{"model-value":n.value.subtitles.outline_color.slice(1),"onUpdate:modelValue":o[58]||(o[58]=a=>n.value.subtitles.outline_color=ye(a))},null,8,["model-value"]),o[106]||(o[106]=j("Обводка ",-1))])):(u(),d("label",Go,[r(b(ve),{"model-value":n.value.subtitles.box_color.slice(1),"onUpdate:modelValue":o[59]||(o[59]=a=>n.value.subtitles.box_color=ye(a))},null,8,["model-value"]),o[107]||(o[107]=j("Плашка ",-1))]))])]),_:1}),n.value.subtitles.style==="box"?(u(),F(y,{key:0,label:"Прозрачность плашки",value:`${Math.round(n.value.subtitles.box_opacity*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.box_opacity,"onUpdate:modelValue":o[60]||(o[60]=a=>n.value.subtitles.box_opacity=a),min:.1,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])):(u(),F(y,{key:1,label:"Толщина обводки",value:n.value.subtitles.outline.toFixed(1)},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.outline,"onUpdate:modelValue":o[61]||(o[61]=a=>n.value.subtitles.outline=a),min:0,max:8,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])),r(y,{label:"Положение"},{default:v(()=>[p("div",No,[r(b(be),{modelValue:n.value.subtitles.position,"onUpdate:modelValue":o[62]||(o[62]=a=>n.value.subtitles.position=a),options:[{v:"bottom",l:"Внизу"},{v:"middle",l:"По центру"},{v:"top",l:"Вверху"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),r(b(ne),{modelValue:n.value.subtitles.margin_v,"onUpdate:modelValue":o[63]||(o[63]=a=>n.value.subtitles.margin_v=a),min:0,max:400,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(y,{label:"Длина строки",hint:"Символов в строке и строк на экране"},{default:v(()=>[p("div",_o,[r(b(ne),{modelValue:n.value.subtitles.max_chars_per_line,"onUpdate:modelValue":o[64]||(o[64]=a=>n.value.subtitles.max_chars_per_line=a),min:12,max:80,"show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(ne),{modelValue:n.value.subtitles.max_lines,"onUpdate:modelValue":o[65]||(o[65]=a=>n.value.subtitles.max_lines=a),min:1,max:3,"show-buttons":"",class:"w-28"},null,8,["modelValue"])])]),_:1})],64)):x("",!0),r(y,{label:"Ключевые фразы на экране",hint:"Нейросеть выбирает в сценарии цифры и главные мысли, и в нужный момент они крупно появляются в кадре. Работает и без субтитров"},{default:v(()=>[r(b(ee),{modelValue:n.value.subtitles.accents,"onUpdate:modelValue":o[66]||(o[66]=a=>n.value.subtitles.accents=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.accents?(u(),d(V,{key:1},[r(y,{label:"Частота",value:`${n.value.subtitles.accents_per_minute.toFixed(1)} в минуту`,hint:"Примерно столько фраз на минуту видео; ближе 6 секунд друг к другу они не появляются"},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.accents_per_minute,"onUpdate:modelValue":o[67]||(o[67]=a=>n.value.subtitles.accents_per_minute=a),min:.3,max:4,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(y,{label:"Шрифт и цвет фраз"},{default:v(()=>[p("div",qo,[r(b(te),{modelValue:n.value.subtitles.accent_font,"onUpdate:modelValue":o[68]||(o[68]=a=>n.value.subtitles.accent_font=a),options:ut.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(ve),{"model-value":n.value.subtitles.accent_color.slice(1),"onUpdate:modelValue":o[69]||(o[69]=a=>n.value.subtitles.accent_color=ye(a))},null,8,["model-value"])])]),_:1})],64)):x("",!0)],64)):f.value==="unique"?(u(),d(V,{key:7},[o[108]||(o[108]=p("p",{class:"text-ink-3"}," Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов, тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными. ",-1)),r(y,{label:"Уникализация"},{default:v(()=>[r(b(ee),{modelValue:n.value.unique.enabled,"onUpdate:modelValue":o[70]||(o[70]=a=>n.value.unique.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.unique.enabled?(u(),d(V,{key:0},[r(y,{label:"Сила",value:`${Math.round(n.value.unique.strength*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.unique.strength,"onUpdate:modelValue":o[71]||(o[71]=a=>n.value.unique.strength=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),(u(),d(V,null,oe([["color_jitter","Цветокоррекция","Яркость, контраст, насыщенность и температура"],["film_grain","Плёночное зерно","Едва заметный шум, разный в каждом рендере"],["vignette","Виньетка","Мягкое затемнение по краям"],["micro_zoom","Микрозум и сдвиг","Кадр чуть иначе обрезан"],["audio_eq","Эквализация звука","Неслышимые изменения тембра ±0.6 дБ"],["strip_metadata","Очистка метаданных","Убирает служебную информацию из файла"]],a=>r(y,{key:a[0],label:a[1],hint:a[2]},{default:v(()=>[r(b(ee),{modelValue:n.value.unique[a[0]],"onUpdate:modelValue":X=>n.value.unique[a[0]]=X,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"])),64))],64)):x("",!0)],64)):f.value==="publish"?(u(),d(V,{key:8},[r(y,{label:"Создавать в конвейере",hint:"Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.enabled,"onUpdate:modelValue":o[72]||(o[72]=a=>n.value.publish.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(y,{label:"Вариантов названия"},{default:v(()=>[r(b(ne),{modelValue:n.value.publish.title_variants,"onUpdate:modelValue":o[73]||(o[73]=a=>n.value.publish.title_variants=a),min:1,max:10,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(y,{label:"Тегов"},{default:v(()=>[r(b(ne),{modelValue:n.value.publish.tags_count,"onUpdate:modelValue":o[74]||(o[74]=a=>n.value.publish.tags_count=a),min:3,max:40,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(y,{label:"Главы в описании",hint:"Таймкоды разделов по абзацам сценария"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.with_chapters,"onUpdate:modelValue":o[75]||(o[75]=a=>n.value.publish.with_chapters=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(y,{label:"Подпись в конце описания",hint:"Ссылки, соцсети, дисклеймеры"},{default:v(()=>[r(b(we),{modelValue:n.value.publish.description_footer,"onUpdate:modelValue":o[76]||(o[76]=a=>n.value.publish.description_footer=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(y,{label:"Обложек"},{default:v(()=>[r(b(ne),{modelValue:n.value.publish.thumbnail_count,"onUpdate:modelValue":o[77]||(o[77]=a=>n.value.publish.thumbnail_count=a),min:1,max:4,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(y,{label:"Модель для обложек"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.thumbnail_operation,"onUpdate:modelValue":o[78]||(o[78]=a=>n.value.publish.thumbnail_operation=a),options:T.value,"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),r(y,{label:"Заголовок на обложке",hint:"Короткая фраза крупным шрифтом, которая дополняет название"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.thumbnail_text,"onUpdate:modelValue":o[79]||(o[79]=a=>n.value.publish.thumbnail_text=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.publish.thumbnail_text?(u(),d(V,{key:0},[r(y,{label:"Кто рисует заголовок",hint:"«Программа» — текст набирается поверх картинки жирным шрифтом с обводкой: без ошибок в буквах на любом языке. «Модель» — текст рисует нейросеть, часто с опечатками"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.thumbnail_text_mode,"onUpdate:modelValue":o[80]||(o[80]=a=>n.value.publish.thumbnail_text_mode=a),options:[{id:"overlay",name:"Программа (рекомендуется)"},{id:"model",name:"Модель картинок"}],"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue"])]),_:1}),n.value.publish.thumbnail_text_mode==="overlay"?(u(),F(y,{key:0,label:"Цвета заголовка"},{default:v(()=>[p("div",Wo,[p("label",Zo,[r(b(ve),{"model-value":n.value.publish.thumbnail_text_color.slice(1),"onUpdate:modelValue":o[81]||(o[81]=a=>n.value.publish.thumbnail_text_color=ye(a))},null,8,["model-value"]),o[109]||(o[109]=j("Текст ",-1))]),p("label",Xo,[r(b(ve),{"model-value":n.value.publish.thumbnail_accent_color.slice(1),"onUpdate:modelValue":o[82]||(o[82]=a=>n.value.publish.thumbnail_accent_color=ye(a))},null,8,["model-value"]),o[110]||(o[110]=j("Главное слово ",-1))])])]),_:1})):x("",!0)],64)):x("",!0),r(y,{label:"Стиль обложек"},{default:v(()=>[r(b(we),{modelValue:n.value.publish.thumbnail_style,"onUpdate:modelValue":o[83]||(o[83]=a=>n.value.publish.thumbnail_style=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1})],64)):x("",!0)]),r(zl,{visible:g.value,"onUpdate:visible":o[84]||(o[84]=a=>g.value=a),target:w.value,"channel-id":t.channelId,"project-id":t.projectId,settings:E},null,8,["visible","target","channel-id","project-id"])])}}});var dn={name:"MinusIcon",extends:nt};function Yo(t){return ts(t)||es(t)||Qo(t)||Jo()}function Jo(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Qo(t,e){if(t){if(typeof t=="string")return gt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?gt(t,e):void 0}}function es(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function ts(t){if(Array.isArray(t))return gt(t)}function gt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function ns(t,e,n,l,s,i){return u(),d("svg",h({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Yo(e[0]||(e[0]=[p("path",{d:"M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z",fill:"currentColor"},null,-1)])),16)}dn.render=ns;var is=`
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
`,ls={root:function(e){var n=e.instance,l=e.props;return["p-checkbox p-component",{"p-checkbox-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$pcCheckboxGroup?n.$pcCheckboxGroup.$invalid:n.$invalid,"p-variant-filled":n.$variant==="filled","p-checkbox-sm p-inputfield-sm":l.size==="small","p-checkbox-lg p-inputfield-lg":l.size==="large"}]},box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},os=me.extend({name:"checkbox",style:is,classes:ls}),ss={name:"BaseCheckbox",extends:it,props:{value:null,binary:Boolean,indeterminate:{type:Boolean,default:!1},trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},required:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:os,provide:function(){return{$pcCheckbox:this,$parentInstance:this}}};function He(t){"@babel/helpers - typeof";return He=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},He(t)}function as(t,e,n){return(e=rs(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function rs(t){var e=us(t,"string");return He(e)=="symbol"?e:e+""}function us(t,e){if(He(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(He(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function ds(t){return fs(t)||hs(t)||ps(t)||cs()}function cs(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ps(t,e){if(t){if(typeof t=="string")return yt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?yt(t,e):void 0}}function hs(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function fs(t){if(Array.isArray(t))return yt(t)}function yt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var cn={name:"Checkbox",extends:ss,inheritAttrs:!1,emits:["change","focus","blur","update:indeterminate"],inject:{$pcCheckboxGroup:{default:void 0}},data:function(){return{d_indeterminate:this.indeterminate}},watch:{indeterminate:function(e){this.d_indeterminate=e,this.updateIndeterminate()}},mounted:function(){this.updateIndeterminate()},updated:function(){this.updateIndeterminate()},methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,indeterminate:this.d_indeterminate,disabled:this.disabled}})},onChange:function(e){var n=this;if(!this.disabled&&!this.readonly){var l=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value,s;this.binary?s=this.d_indeterminate?this.trueValue:this.checked?this.falseValue:this.trueValue:this.checked||this.d_indeterminate?s=l.filter(function(i){return!Se(i,n.value)}):s=l?[].concat(ds(l),[this.value]):[this.value],this.d_indeterminate&&(this.d_indeterminate=!1,this.$emit("update:indeterminate",this.d_indeterminate)),this.$pcCheckboxGroup?this.$pcCheckboxGroup.writeValue(s,e):this.writeValue(s,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)},updateIndeterminate:function(){this.$refs.input&&(this.$refs.input.indeterminate=this.d_indeterminate)}},computed:{groupName:function(){return this.$pcCheckboxGroup?this.$pcCheckboxGroup.groupName:this.$formName},checked:function(){var e=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value;return this.d_indeterminate?!1:this.binary?e===this.trueValue:Vn(this.value,e)},dataP:function(){return re(as({invalid:this.$invalid,checked:this.checked,disabled:this.disabled,filled:this.$variant==="filled"},this.size,this.size))}},components:{CheckIcon:St,MinusIcon:dn}},ms=["data-p-checked","data-p-indeterminate","data-p-disabled","data-p"],bs=["id","value","name","checked","tabindex","disabled","readonly","required","aria-labelledby","aria-label","aria-invalid"],vs=["data-p"];function gs(t,e,n,l,s,i){var m=N("CheckIcon"),c=N("MinusIcon");return u(),d("div",h({class:t.cx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-indeterminate":s.d_indeterminate||void 0,"data-p-disabled":t.disabled,"data-p":i.dataP}),[p("input",h({ref:"input",id:t.inputId,type:"checkbox",class:[t.cx("input"),t.inputClass],style:t.inputStyle,value:t.value,name:i.groupName,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,required:t.required,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,bs),p("div",h({class:t.cx("box")},i.getPTOptions("box"),{"data-p":i.dataP}),[M(t.$slots,"icon",{checked:i.checked,indeterminate:s.d_indeterminate,class:G(t.cx("icon")),dataP:i.dataP},function(){return[i.checked?(u(),F(m,h({key:0,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):s.d_indeterminate?(u(),F(c,h({key:1,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):x("",!0)]})],16,vs)],16,ms)}cn.render=gs;var ys=`
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
`,ks={root:"p-chip p-component",image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},ws=me.extend({name:"chip",style:ys,classes:ks}),Os={name:"BaseChip",extends:Oe,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:ws,provide:function(){return{$pcChip:this,$parentInstance:this}}},pn={name:"Chip",extends:Os,inheritAttrs:!1,emits:["remove"],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)},close:function(e){this.visible=!1,this.$emit("remove",e)}},computed:{dataP:function(){return re({removable:this.removable})}},components:{TimesCircleIcon:Mn}},xs=["aria-label","data-p"],Is=["src"];function Ss(t,e,n,l,s,i){return s.visible?(u(),d("div",h({key:0,class:t.cx("root"),"aria-label":t.label},t.ptmi("root"),{"data-p":i.dataP}),[M(t.$slots,"default",{},function(){return[t.image?(u(),d("img",h({key:0,src:t.image},t.ptm("image"),{class:t.cx("image")}),null,16,Is)):t.$slots.icon?(u(),F(ue(t.$slots.icon),h({key:1,class:t.cx("icon")},t.ptm("icon")),null,16,["class"])):t.icon?(u(),d("span",h({key:2,class:[t.cx("icon"),t.icon]},t.ptm("icon")),null,16)):x("",!0),t.label!==null?(u(),d("div",h({key:3,class:t.cx("label")},t.ptm("label")),z(t.label),17)):x("",!0)]}),t.removable?M(t.$slots,"removeicon",{key:0,removeCallback:i.close,keydownCallback:i.onKeydown},function(){return[(u(),F(ue(t.removeIcon?"span":"TimesCircleIcon"),h({class:[t.cx("removeIcon"),t.removeIcon],onClick:i.close,onKeydown:i.onKeydown},t.ptm("removeIcon")),null,16,["class","onClick","onKeydown"]))]}):x("",!0)],16,xs)):x("",!0)}pn.render=Ss;var Ls=`
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
`,Cs={root:function(e){var n=e.props;return{position:n.appendTo==="self"?"relative":void 0}}},Vs={root:function(e){var n=e.instance,l=e.props;return["p-multiselect p-component p-inputwrapper",{"p-multiselect-display-chip":l.display==="chip","p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":n.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":n.focused||n.overlayVisible,"p-multiselect-open":n.overlayVisible,"p-multiselect-fluid":n.$fluid,"p-multiselect-sm p-inputfield-sm":l.size==="small","p-multiselect-lg p-inputfield-lg":l.size==="large"}]},labelContainer:"p-multiselect-label-container",label:function(e){var n=e.instance,l=e.props;return["p-multiselect-label",{"p-placeholder":n.label===l.placeholder,"p-multiselect-label-empty":!l.placeholder&&!n.$filled}]},clearIcon:"p-multiselect-clear-icon",chipItem:"p-multiselect-chip-item",pcChip:"p-multiselect-chip",chipIcon:"p-multiselect-chip-icon",dropdown:"p-multiselect-dropdown",loadingIcon:"p-multiselect-loading-icon",dropdownIcon:"p-multiselect-dropdown-icon",overlay:"p-multiselect-overlay p-component",header:"p-multiselect-header",pcFilterContainer:"p-multiselect-filter-container",pcFilter:"p-multiselect-filter",listContainer:"p-multiselect-list-container",list:"p-multiselect-list",optionGroup:"p-multiselect-option-group",option:function(e){var n=e.instance,l=e.option,s=e.index,i=e.getItemOptions,m=e.props;return["p-multiselect-option",{"p-multiselect-option-selected":n.isSelected(l)&&m.highlightOnSelect,"p-focus":n.focusedOptionIndex===n.getOptionIndex(s,i),"p-disabled":n.isOptionDisabled(l)}]},emptyMessage:"p-multiselect-empty-message"},Ms=me.extend({name:"multiselect",style:Ls,classes:Vs,inlineStyles:Cs}),zs={name:"BaseMultiSelect",extends:it,props:{options:Array,optionLabel:null,optionValue:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:"14rem"},placeholder:String,inputId:{type:String,default:null},panelClass:{type:String,default:null},panelStyle:{type:null,default:null},overlayClass:{type:String,default:null},overlayStyle:{type:null,default:null},dataKey:null,showClear:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},resetFilterOnClear:{type:Boolean,default:!1},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},display:{type:String,default:"comma"},selectedItemsLabel:{type:String,default:null},maxSelectedLabels:{type:Number,default:null},selectionLimit:{type:Number,default:null},showToggleAll:{type:Boolean,default:!0},loading:{type:Boolean,default:!1},checkboxIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},removeTokenIcon:{type:String,default:void 0},chipIcon:{type:String,default:void 0},selectAll:{type:Boolean,default:null},resetFilterOnHide:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Ms,provide:function(){return{$pcMultiSelect:this,$parentInstance:this}}};function Be(t){"@babel/helpers - typeof";return Be=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Be(t)}function _t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function qt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?_t(Object(n),!0).forEach(function(l){ge(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):_t(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ge(t,e,n){return(e=Fs(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Fs(t){var e=$s(t,"string");return Be(e)=="symbol"?e:e+""}function $s(t,e){if(Be(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Be(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Wt(t){return Es(t)||As(t)||Ps(t)||Ts()}function Ts(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Ps(t,e){if(t){if(typeof t=="string")return kt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?kt(t,e):void 0}}function As(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Es(t){if(Array.isArray(t))return kt(t)}function kt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Ds={name:"MultiSelect",extends:zs,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter","selectall-change"],inject:{$pcFluid:{default:null}},outsideClickListener:null,scrollHandler:null,resizeListener:null,overlay:null,list:null,virtualScroller:null,startRangeIndex:-1,searchTimeout:null,searchValue:"",selectOnFocus:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1}},watch:{options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(se.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e)+"_".concat(n)},getHeaderCheckboxPTOptions:function(e){return this.ptm(e,{context:{selected:this.allSelected}})},getCheckboxPTOptions:function(e,n,l,s){return this.ptm(s,{context:{selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.maxSelectionLimitReached&&!this.isSelected(e)?!0:this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return!!(this.optionGroupLabel&&e.optionGroup&&e.group)},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),e&&J(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&J(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),!this.autoFilterFocus&&this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n,l;this.clicked=!1,this.focused=!1,this.focusedOptionIndex=-1,this.searchValue="",this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"ShiftLeft":case"ShiftRight":this.onShiftKey(e);break;default:if(e.code==="KeyA"&&l){var s=this.visibleOptions.filter(function(i){return n.isValidOption(i)}).map(function(i){return n.getOptionValue(i)});this.updateModel(e,s),e.preventDefault();break}!l&&en(e.key)&&(!this.overlayVisible&&this.show(),this.searchOptions(e),e.preventDefault());break}this.clicked=!1},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,[]),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Jt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onOptionSelect:function(e,n){var l=this,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1,i=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;if(!(this.disabled||this.isOptionDisabled(n))){var m=this.isSelected(n),c=null;m?c=this.d_value.filter(function(f){return!Se(f,l.getOptionValue(n),l.equalityKey)}):c=[].concat(Wt(this.d_value||[]),[this.getOptionValue(n)]),this.updateModel(e,c),s!==-1&&(this.focusedOptionIndex=s),i&&J(this.$refs.focusInput)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onOptionSelectRange:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(l===-1&&(l=this.findNearestSelectedOptionIndex(s,!0)),s===-1&&(s=this.findNearestSelectedOptionIndex(l)),l!==-1&&s!==-1){var i=Math.min(l,s),m=Math.max(l,s),c=this.visibleOptions.slice(i,m+1).filter(function(f){return n.isValidOption(f)}).map(function(f){return n.getOptionValue(f)});this.updateModel(e,c)}},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e,!0);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show();else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,n),this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,l,this.startRangeIndex),this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else{var s=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();e.shiftKey&&s&&this.onOptionSelectRange(e,i,this.startRangeIndex),this.changeFocusedOptionIndex(e,i),!this.overlayVisible&&this.show()}e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var s=l.value.length;l.setSelectionRange(s,s),this.focusedOptionIndex=-1}}else{var i=e.metaKey||e.ctrlKey,m=this.findLastOptionIndex();e.shiftKey&&i&&this.onOptionSelectRange(e,this.startRangeIndex,m),this.changeFocusedOptionIndex(e,m),!this.overlayVisible&&this.show()}e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?this.focusedOptionIndex!==-1&&(e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex])):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onEscapeKey:function(e){this.overlayVisible&&(this.hide(!0),e.stopPropagation()),e.preventDefault()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(J(e.shiftKey?this.$refs.lastHiddenFocusableElementOnOverlay:this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onOverlayEnter:function(e){se.set("overlay",e,this.$primevue.config.zIndex.overlay),Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.autoFilterFocus&&J(this.$refs.filterInput.$el),this.autoUpdateModel(),this.$attrSelector&&e.setAttribute(this.$attrSelector,"")},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){se.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.overlay,this.$el):(this.overlay.style.minWidth=Fe(this.$el)+"px",et(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isOutsideClicked:function(e){return!(this.$el.isSameNode(e.target)||this.$el.contains(e.target)||this.overlay&&this.overlay.contains(e.target))},getLabelByValue:function(e){var n=this,l=this.optionGroupLabel?this.flatOptions(this.options):this.options||[],s=l.find(function(i){return!n.isOptionGroup(i)&&Se(n.getOptionValue(i),e,n.equalityKey)});return this.getOptionLabel(s)},getSelectedItemsLabel:function(){var e=/{(.*?)}/,n=this.selectedItemsLabel||this.$primevue.config.locale.selectionMessage;return e.test(n)?n.replace(n.match(e)[0],this.d_value.length+""):n},onToggleAll:function(e){var n=this;if(this.selectAll!==null)this.$emit("selectall-change",{originalEvent:e,checked:!this.allSelected});else{var l=this.allSelected?[]:this.visibleOptions.filter(function(s){return n.isValidOption(s)}).map(function(s){return n.getOptionValue(s)});this.updateModel(e,l)}},removeOption:function(e,n){var l=this;e.stopPropagation();var s=this.d_value.filter(function(i){return!Se(i,n,l.equalityKey)});this.updateModel(e,s)},clearFilter:function(){this.filterValue=null},hasFocusableElements:function(){return Yt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return he(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,n){return Se(e,n,this.equalityKey)},isSelected:function(e){var n=this,l=this.getOptionValue(e);return(this.d_value||[]).some(function(s){return n.isEquals(s,l)})},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return Ie(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidOption(s)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?Ie(this.visibleOptions.slice(0,e),function(s){return n.isValidOption(s)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;if(this.$filled){for(var n=function(){var m=e.d_value[s],c=e.visibleOptions.findIndex(function(f){return e.isValidSelectedOption(f)&&e.isEquals(m,e.getOptionValue(f))});if(c>-1)return{v:c}},l,s=this.d_value.length-1;s>=0;s--)if(l=n(),l)return l.v}return-1},findFirstSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)}):-1},findLastSelectedOptionIndex:function(){var e=this;return this.$filled?Ie(this.visibleOptions,function(n){return e.isValidSelectedOption(n)}):-1},findNextSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidSelectedOption(s)}):-1;return l>-1?l+e+1:-1},findPrevSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e>0?Ie(this.visibleOptions.slice(0,e),function(s){return n.isValidSelectedOption(s)}):-1;return l>-1?l:-1},findNearestSelectedOptionIndex:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,l=-1;return this.$filled&&(n?(l=this.findPrevSelectedOptionIndex(e),l=l===-1?this.findNextSelectedOptionIndex(e):l):(l=this.findNextSelectedOptionIndex(e),l=l===-1?this.findPrevSelectedOptionIndex(e):l)),l>-1?l:e},findFirstFocusedOptionIndex:function(){var e=this.findFirstSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e){var n=this;this.searchValue=(this.searchValue||"")+e.key;var l=-1;he(this.searchValue)&&(this.focusedOptionIndex!==-1?(l=this.visibleOptions.slice(this.focusedOptionIndex).findIndex(function(s){return n.isOptionMatched(s)}),l=l===-1?this.visibleOptions.slice(0,this.focusedOptionIndex).findIndex(function(s){return n.isOptionMatched(s)}):l+this.focusedOptionIndex):l=this.visibleOptions.findIndex(function(s){return n.isOptionMatched(s)}),l===-1&&this.focusedOptionIndex===-1&&(l=this.findFirstFocusedOptionIndex()),l!==-1&&this.changeFocusedOptionIndex(e,l)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){n.searchValue="",n.searchTimeout=null},500)},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n]))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,s=$e(e.list,'li[id="'.concat(l,'"]'));s?s.scrollIntoView&&s.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){if(this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled){var e=this.getOptionValue(this.visibleOptions[this.focusedOptionIndex]);this.updateModel(null,[e])}},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,s,i){var m=n.getOptionGroupChildren(s);return m&&Array.isArray(m)?(l.push({optionGroup:s,group:!0,index:i}),m.forEach(function(c){return l.push(c)})):l.push(s),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Xt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var s=this.options||[],i=[];return s.forEach(function(m){var c=e.getOptionGroupChildren(m),f=c.filter(function(g){return l.includes(g)});f.length>0&&i.push(qt(qt({},m),{},ge({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",Wt(f))))}),this.flatOptions(i)}return l}return n},label:function(){var e;if(this.d_value&&this.d_value.length)if(this.loading&&(!this.options||this.options.length===0))e=this.placeholder;else{if(he(this.maxSelectedLabels)&&this.d_value.length>this.maxSelectedLabels)return this.getSelectedItemsLabel();e="";for(var n=0;n<this.d_value.length;n++)n!==0&&(e+=", "),e+=this.getLabelByValue(this.d_value[n])}else e=this.placeholder;return e},chipSelectedItems:function(){return he(this.maxSelectedLabels)&&this.d_value&&this.d_value.length>this.maxSelectedLabels},allSelected:function(){var e=this;return this.selectAll!==null?this.selectAll:he(this.visibleOptions)&&this.visibleOptions.every(function(n){return e.isOptionGroup(n)||e.isOptionDisabled(n)||e.isSelected(n)})},hasSelectedOption:function(){return this.$filled},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},maxSelectionLimitReached:function(){return this.selectionLimit&&this.d_value&&this.d_value.length===this.selectionLimit},filterResultMessageText:function(){return he(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}",this.d_value.length):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},toggleAllAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria[this.allSelected?"selectAll":"unselectAll"]:void 0},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},hasFluid:function(){return zn(this.fluid)?!!this.$pcFluid:this.fluid},isClearIconVisible:function(){return this.showClear&&this.d_value&&this.d_value.length&&this.d_value!=null&&he(this.options)&&!this.disabled&&!this.loading},containerDataP:function(){return re(ge({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return re(ge(ge(ge({placeholder:this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled},this.size,this.size),"has-chip",this.display==="chip"&&this.d_value&&this.d_value.length&&(this.maxSelectedLabels?this.d_value.length<=this.maxSelectedLabels:!0)),"empty",!this.placeholder&&!this.$filled))},dropdownIconDataP:function(){return re(ge({},this.size,this.size))},overlayDataP:function(){return re(ge({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:wt},components:{InputText:Ye,Checkbox:cn,VirtualScroller:$t,Portal:Re,Chip:pn,IconField:zt,InputIcon:Ft,TimesIcon:Lt,SearchIcon:Mt,ChevronDownIcon:Vt,SpinnerIcon:It,CheckIcon:St}};function Ke(t){"@babel/helpers - typeof";return Ke=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ke(t)}function Zt(t,e,n){return(e=Hs(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Hs(t){var e=Bs(t,"string");return Ke(e)=="symbol"?e:e+""}function Bs(t,e){if(Ke(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ke(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Ks=["data-p"],Us=["id","disabled","placeholder","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid"],Rs=["data-p"],js={key:1},Gs=["data-p"],Ns=["id","aria-label"],_s=["id"],qs=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onClick","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function Ws(t,e,n,l,s,i){var m=N("Chip"),c=N("SpinnerIcon"),f=N("Checkbox"),g=N("InputText"),w=N("SearchIcon"),I=N("InputIcon"),E=N("IconField"),U=N("VirtualScroller"),D=N("Portal"),P=je("ripple");return u(),d("div",h({ref:"container",class:t.cx("root"),style:t.sx("root"),onClick:e[7]||(e[7]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[p("div",h({class:"p-hidden-accessible"},t.ptm("hiddenInputContainer"),{"data-p-hidden-accessible":!0}),[p("input",h({ref:"focusInput",id:t.inputId,type:"text",readonly:"",disabled:t.disabled,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":s.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)})},t.ptm("hiddenInput")),null,16,Us)],16),p("div",h({class:t.cx("labelContainer")},t.ptm("labelContainer")),[p("div",h({class:t.cx("label"),"data-p":i.labelDataP},t.ptm("label")),[M(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){return[t.display==="comma"?(u(),d(V,{key:0},[j(z(i.label||"empty"),1)],64)):t.display==="chip"?(u(),d(V,{key:1},[t.loading&&(!t.options||t.options.length===0)?(u(),d(V,{key:0},[j(z(t.placeholder||"empty"),1)],64)):i.chipSelectedItems?(u(),d("span",js,z(i.label),1)):(u(!0),d(V,{key:2},oe(t.d_value,function(O,H){return u(),d("span",h({key:"chip-".concat(i.getLabelByValue(O),"_").concat(H),class:t.cx("chipItem")},{ref_for:!0},t.ptm("chipItem")),[M(t.$slots,"chip",{value:O,removeCallback:function(K){return i.removeOption(K,O)}},function(){return[r(m,{class:G(t.cx("pcChip")),label:i.getLabelByValue(O),removeIcon:t.chipIcon||t.removeTokenIcon,removable:"",unstyled:t.unstyled,onRemove:function(K){return i.removeOption(K,O)},pt:t.ptm("pcChip")},{removeicon:v(function(){return[M(t.$slots,t.$slots.chipicon?"chipicon":"removetokenicon",{class:G(t.cx("chipIcon")),item:O,removeCallback:function(K){return i.removeOption(K,O)}})]}),_:2},1032,["class","label","removeIcon","unstyled","onRemove","pt"])]})],16)}),128)),!t.d_value||t.d_value.length===0?(u(),d(V,{key:3},[j(z(t.placeholder||"empty"),1)],64)):x("",!0)],64)):x("",!0)]})],16,Rs)],16),i.isClearIconVisible?M(t.$slots,"clearicon",{key:0,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(u(),F(ue(t.clearIcon?"i":"TimesIcon"),h({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):x("",!0),p("div",h({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?M(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(u(),d("span",h({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(u(),F(c,h({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):M(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(u(),F(ue(t.dropdownIcon?"span":"ChevronDownIcon"),h({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(D,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,h({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[s.overlayVisible?(u(),d("div",h({key:0,ref:i.overlayRef,style:[t.panelStyle,t.overlayStyle],class:[t.cx("overlay"),t.panelClass,t.overlayClass],onClick:e[5]||(e[5]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[p("span",h({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[3]||(e[3]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),M(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.showToggleAll&&t.selectionLimit==null||t.filter?(u(),d("div",h({key:0,class:t.cx("header")},t.ptm("header")),[t.showToggleAll&&t.selectionLimit==null?(u(),F(f,{key:0,modelValue:i.allSelected,binary:!0,disabled:t.disabled,variant:t.variant,"aria-label":i.toggleAllAriaLabel,onChange:i.onToggleAll,unstyled:t.unstyled,pt:i.getHeaderCheckboxPTOptions("pcHeaderCheckbox"),formControl:{novalidate:!0}},{icon:v(function(O){return[t.$slots.headercheckboxicon?(u(),F(ue(t.$slots.headercheckboxicon),{key:0,checked:O.checked,class:G(O.class)},null,8,["checked","class"])):O.checked?(u(),F(ue(t.checkboxIcon?"span":"CheckIcon"),h({key:1,class:[O.class,Zt({},t.checkboxIcon,O.checked)]},i.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon")),null,16,["class"])):x("",!0)]}),_:1},8,["modelValue","disabled","variant","aria-label","onChange","unstyled","pt"])):x("",!0),t.filter?(u(),F(E,{key:1,class:G(t.cx("pcFilterContainer")),unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(g,{ref:"filterInput",value:s.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,disabled:t.disabled,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","disabled","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(I,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[M(t.$slots,"filtericon",{},function(){return[t.filterIcon?(u(),d("span",h({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(u(),F(w,tn(h({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["class","unstyled","pt"])):x("",!0),t.filter?(u(),d("span",h({key:2,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)):x("",!0)],16)):x("",!0),p("div",h({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,h({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),nn({content:v(function(O){var H=O.styleClass,A=O.contentRef,K=O.items,C=O.getItemOptions,ae=O.contentStyle,_=O.itemSize;return[p("ul",h({ref:function($){return i.listRef($,A)},id:t.$id+"_list",class:[t.cx("list"),H],style:ae,role:"listbox","aria-multiselectable":"true","aria-label":i.listAriaLabel},t.ptm("list")),[(u(!0),d(V,null,oe(K,function(L,$){return u(),d(V,{key:i.getOptionRenderKey(L,i.getOptionIndex($,C))},[i.isOptionGroup(L)?(u(),d("li",h({key:0,id:t.$id+"_"+i.getOptionIndex($,C),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[M(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex($,C)},function(){return[j(z(i.getOptionGroupLabel(L.optionGroup)),1)]})],16,_s)):Ge((u(),d("li",h({key:1,id:t.$id+"_"+i.getOptionIndex($,C),style:{height:_?_+"px":void 0},class:t.cx("option",{option:L,index:$,getItemOptions:C}),role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex($,C)),onClick:function(Q){return i.onOptionSelect(Q,L,i.getOptionIndex($,C),!0)},onMousemove:function(Q){return i.onOptionMouseMove(Q,i.getOptionIndex($,C))}},{ref_for:!0},i.getCheckboxPTOptions(L,C,$,"option"),{"data-p-selected":i.isSelected(L),"data-p-focused":s.focusedOptionIndex===i.getOptionIndex($,C),"data-p-disabled":i.isOptionDisabled(L)}),[r(f,{defaultValue:i.isSelected(L),binary:!0,tabindex:-1,variant:t.variant,unstyled:t.unstyled,pt:i.getCheckboxPTOptions(L,C,$,"pcOptionCheckbox"),formControl:{novalidate:!0}},{icon:v(function(Z){return[t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon?(u(),F(ue(t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon),{key:0,checked:Z.checked,class:G(Z.class)},null,8,["checked","class"])):Z.checked?(u(),F(ue(t.checkboxIcon?"span":"CheckIcon"),h({key:1,class:[Z.class,Zt({},t.checkboxIcon,Z.checked)]},{ref_for:!0},i.getCheckboxPTOptions(L,C,$,"pcOptionCheckbox.icon")),null,16,["class"])):x("",!0)]}),_:2},1032,["defaultValue","variant","unstyled","pt"]),M(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex($,C)},function(){return[p("span",h({ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,qs)),[[P]])],64)}),128)),s.filterValue&&(!K||K&&K.length===0)?(u(),d("li",h({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[M(t.$slots,"emptyfilter",{},function(){return[j(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(u(),d("li",h({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[M(t.$slots,"empty",{},function(){return[j(z(i.emptyMessageText),1)]})],16)):x("",!0)],16,Ns)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(O){var H=O.options;return[M(t.$slots,"loader",{options:H})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),M(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(u(),d("span",h({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):x("",!0),p("span",h({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),p("span",h({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[4]||(e[4]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Gs)):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,Ks)}Ds.render=Ws;var Zs=`
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
`,Xs={mask:function(e){var n=e.position,l=e.modal;return{position:"fixed",height:"100%",width:"100%",left:0,top:0,display:"flex",justifyContent:n==="left"?"flex-start":n==="right"?"flex-end":"center",alignItems:n==="top"?"flex-start":n==="bottom"?"flex-end":"center",pointerEvents:l?"auto":"none"}},root:{pointerEvents:"auto"}},Ys={mask:function(e){var n=e.instance,l=e.props,s=["left","right","top","bottom"],i=s.find(function(m){return m===l.position});return["p-drawer-mask",{"p-overlay-mask p-overlay-mask-enter-active":l.modal,"p-drawer-open":n.containerVisible,"p-drawer-full":n.fullScreen},i?"p-drawer-".concat(i):""]},root:function(e){var n=e.instance;return["p-drawer p-component",{"p-drawer-full":n.fullScreen}]},header:"p-drawer-header",title:"p-drawer-title",pcCloseButton:"p-drawer-close-button",content:"p-drawer-content",footer:"p-drawer-footer"},Js=me.extend({name:"drawer",style:Zs,classes:Ys,inlineStyles:Xs}),Qs={name:"BaseDrawer",extends:Oe,props:{visible:{type:Boolean,default:!1},position:{type:String,default:"left"},header:{type:null,default:null},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},dismissable:{type:Boolean,default:!0},showCloseIcon:{type:Boolean,default:!0},closeButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}},closeIcon:{type:String,default:void 0},modal:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!1},closeOnEscape:{type:Boolean,default:!0}},style:Js,provide:function(){return{$pcDrawer:this,$parentInstance:this}}};function Ue(t){"@babel/helpers - typeof";return Ue=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ue(t)}function ct(t,e,n){return(e=ea(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ea(t){var e=ta(t,"string");return Ue(e)=="symbol"?e:e+""}function ta(t,e){if(Ue(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ue(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var na={name:"Drawer",extends:Qs,inheritAttrs:!1,emits:["update:visible","show","after-show","hide","after-hide","before-hide"],data:function(){return{containerVisible:this.visible}},container:null,mask:null,content:null,headerContainer:null,footerContainer:null,closeButton:null,outsideClickListener:null,documentKeydownListener:null,watch:{dismissable:function(e){e&&!this.modal?this.bindOutsideClickListener():this.unbindOutsideClickListener()}},updated:function(){this.visible&&(this.containerVisible=this.visible)},beforeUnmount:function(){this.disableDocumentSettings(),this.mask&&this.autoZIndex&&se.clear(this.mask),this.container=null,this.mask=null},methods:{hide:function(){this.$emit("update:visible",!1)},onEnter:function(){this.$emit("show"),this.focus(),this.bindDocumentKeyDownListener(),this.autoZIndex&&se.set("modal",this.mask,this.baseZIndex||this.$primevue.config.zIndex.modal)},onAfterEnter:function(){this.enableDocumentSettings(),this.$emit("after-show")},onBeforeLeave:function(){this.modal&&!this.isUnstyled&&pt(this.mask,"p-overlay-mask-leave-active"),this.$emit("before-hide")},onLeave:function(){this.$emit("hide")},onAfterLeave:function(){this.autoZIndex&&se.clear(this.mask),this.unbindDocumentKeyDownListener(),this.containerVisible=!1,this.disableDocumentSettings(),this.$emit("after-hide")},onMaskClick:function(e){this.dismissable&&this.modal&&this.mask===e.target&&this.hide()},focus:function(){var e=function(s){return s&&s.querySelector("[autofocus]")},n=this.$slots.header&&e(this.headerContainer);n||(n=this.$slots.default&&e(this.container),n||(n=this.$slots.footer&&e(this.footerContainer),n||(n=this.closeButton))),n&&J(n)},enableDocumentSettings:function(){this.dismissable&&!this.modal&&this.bindOutsideClickListener(),this.blockScroll&&Tn()},disableDocumentSettings:function(){this.unbindOutsideClickListener(),this.blockScroll&&$n()},onKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&this.hide()},containerRef:function(e){this.container=e},maskRef:function(e){this.mask=e},contentRef:function(e){this.content=e},headerContainerRef:function(e){this.headerContainer=e},footerContainerRef:function(e){this.footerContainer=e},closeButtonRef:function(e){this.closeButton=e?e.$el:void 0},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeydown,document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},isOutsideClicked:function(e){return this.container&&!this.container.contains(e.target)}},computed:{fullScreen:function(){return this.position==="full"},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return re(ct(ct(ct({"full-screen":this.position==="full"},this.position,this.position),"open",this.containerVisible),"modal",this.modal))}},directives:{focustrap:Fn},components:{Button:fe,Portal:Re,TimesIcon:Lt}},ia=["data-p"],la=["role","aria-modal","data-p"];function oa(t,e,n,l,s,i){var m=N("Button"),c=N("Portal"),f=je("focustrap");return u(),F(c,null,{default:v(function(){return[s.containerVisible?(u(),d("div",h({key:0,ref:i.maskRef,onMousedown:e[0]||(e[0]=function(){return i.onMaskClick&&i.onMaskClick.apply(i,arguments)}),class:t.cx("mask"),style:t.sx("mask",!0,{position:t.position,modal:t.modal}),"data-p":i.dataP},t.ptm("mask")),[r(Ne,h({name:"p-drawer",onEnter:i.onEnter,onAfterEnter:i.onAfterEnter,onBeforeLeave:i.onBeforeLeave,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave,appear:""},t.ptm("transition")),{default:v(function(){return[t.visible?Ge((u(),d("div",h({key:0,ref:i.containerRef,class:t.cx("root"),style:t.sx("root"),role:t.modal?"dialog":"complementary","aria-modal":t.modal?!0:void 0,"data-p":i.dataP},t.ptmi("root")),[t.$slots.container?M(t.$slots,"container",{key:0,closeCallback:i.hide}):(u(),d(V,{key:1},[p("div",h({ref:i.headerContainerRef,class:t.cx("header")},t.ptm("header")),[M(t.$slots,"header",{class:G(t.cx("title"))},function(){return[t.header?(u(),d("div",h({key:0,class:t.cx("title")},t.ptm("title")),z(t.header),17)):x("",!0)]}),t.showCloseIcon?M(t.$slots,"closebutton",{key:0,closeCallback:i.hide},function(){return[r(m,h({ref:i.closeButtonRef,type:"button",class:t.cx("pcCloseButton"),"aria-label":i.closeAriaLabel,unstyled:t.unstyled,onClick:i.hide},t.closeButtonProps,{pt:t.ptm("pcCloseButton"),"data-pc-group-section":"iconcontainer"}),{icon:v(function(g){return[M(t.$slots,"closeicon",{},function(){return[(u(),F(ue(t.closeIcon?"span":"TimesIcon"),h({class:[t.closeIcon,g.class]},t.ptm("pcCloseButton").icon),null,16,["class"]))]})]}),_:3},16,["class","aria-label","unstyled","onClick","pt"])]}):x("",!0)],16),p("div",h({ref:i.contentRef,class:t.cx("content")},t.ptm("content")),[M(t.$slots,"default")],16),t.$slots.footer?(u(),d("div",h({key:0,ref:i.footerContainerRef,class:t.cx("footer")},t.ptm("footer")),[M(t.$slots,"footer")],16)):x("",!0)],64))],16,la)),[[f]]):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onBeforeLeave","onLeave","onAfterLeave"])],16,ia)):x("",!0)]}),_:3})}na.render=oa;function ma(t){const e=_e(),n=tt(),l=R(null);async function s(i,m={},c){l.value=i;try{await de.post(`/api/tracks/${t()}/jobs/${i}`,m),n.loadActiveJobs(),c&&e.info(c)}catch(f){e.error(f)}finally{l.value=null}}return{run:s,starting:l}}function sa(t,e){if(t&&e&&typeof t=="object"&&typeof e=="object"&&!Array.isArray(t)){const n={};for(const[l,s]of Object.entries(t)){const i=sa(s,e[l]);i!==void 0&&(n[l]=i)}return Object.keys(n).length?n:void 0}return JSON.stringify(t)===JSON.stringify(e)?void 0:t}export{Qn as R,an as S,fa as _,da as a,na as b,we as c,Ds as d,te as e,sa as f,ma as g,cn as h,pa as i,ca as m,Wn as s,ha as u};
