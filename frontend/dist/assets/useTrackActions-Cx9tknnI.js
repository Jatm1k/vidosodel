import{O as On,P as he,Q as Re,R as wt,S as ke,T as se,Y as Je,U as Qe,V as et,W as Fe,X as ae,Z as Ot,_ as J,$ as We,a0 as $e,a1 as p,a2 as xn,L as je,k as d,c as u,b as h,K as Ge,m as $,q as G,a3 as de,f as x,t as z,j as N,w as v,e as r,a4 as Ne,J as V,F as M,r as oe,l as j,x as _e,u as tt,n as ue,a5 as Xt,a6 as pt,a7 as In,a8 as xt,a9 as nt,aa as It,ab as Xe,ac as Ve,ad as Me,ae as St,af as Lt,B as Ye,ag as it,ah as fe,ai as Yt,aj as xe,ak as Ie,al as Jt,am as Qt,an as en,ao as Sn,ap as tn,aq as pe,ar as nn,p as ln,s as on,d as lt,v as Ct,y as Ze,g as b,z as sn,A as Te,C as me,h as R,a as Ln,i as Y,o as Cn,G as ut,as as Vn,at as Mn,au as zn,av as Fn,aw as $n,ax as Tn}from"./index-CLD5k9VZ.js";import{a as le,s as te}from"./index-DTSxRXa6.js";import{s as be}from"./index-BoS0gKIU.js";var ot=On(),Pn=`
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
`,An={root:function(e){var n=e.props;return["p-menu p-component",{"p-menu-overlay":n.popup}]},start:"p-menu-start",list:"p-menu-list",submenuLabel:"p-menu-submenu-label",separator:"p-menu-separator",end:"p-menu-end",item:function(e){var n=e.instance;return["p-menu-item",{"p-focus":n.id===n.focusedOptionId,"p-disabled":n.disabled()}]},itemContent:"p-menu-item-content",itemLink:"p-menu-item-link",itemIcon:"p-menu-item-icon",itemLabel:"p-menu-item-label"},En=he.extend({name:"menu",style:Pn,classes:An}),Dn={name:"BaseMenu",extends:ke,props:{popup:{type:Boolean,default:!1},model:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:En,provide:function(){return{$pcMenu:this,$parentInstance:this}}},an={name:"Menuitem",hostName:"Menu",extends:ke,inheritAttrs:!1,emits:["item-click","item-mousemove"],props:{item:null,templates:null,id:null,focusedOptionId:null,index:null},methods:{getItemProp:function(e,n){return e&&e.item?xn(e.item[n]):void 0},getPTOptions:function(e){return this.ptm(e,{context:{item:this.item,index:this.index,focused:this.isItemFocused(),disabled:this.disabled()}})},isItemFocused:function(){return this.focusedOptionId===this.id},onItemClick:function(e){var n=this.getItemProp(this.item,"command");n&&n({originalEvent:e,item:this.item.item}),this.$emit("item-click",{originalEvent:e,item:this.item,id:this.id})},onItemMouseMove:function(e){this.$emit("item-mousemove",{originalEvent:e,item:this.item,id:this.id})},visible:function(){return typeof this.item.visible=="function"?this.item.visible():this.item.visible!==!1},disabled:function(){return typeof this.item.disabled=="function"?this.item.disabled():this.item.disabled},label:function(){return typeof this.item.label=="function"?this.item.label():this.item.label},getMenuItemProps:function(e){return{action:p({class:this.cx("itemLink"),tabindex:"-1"},this.getPTOptions("itemLink")),icon:p({class:[this.cx("itemIcon"),e.icon]},this.getPTOptions("itemIcon")),label:p({class:this.cx("itemLabel")},this.getPTOptions("itemLabel"))}}},computed:{dataP:function(){return se({focus:this.isItemFocused(),disabled:this.disabled()})}},directives:{ripple:wt}},Bn=["id","aria-label","aria-disabled","data-p-focused","data-p-disabled","data-p"],Hn=["data-p"],Kn=["href","target"],Un=["data-p"],Rn=["data-p"];function jn(t,e,n,l,o,i){var m=je("ripple");return i.visible()?(d(),u("li",p({key:0,id:n.id,class:[t.cx("item"),n.item.class],role:"menuitem",style:n.item.style,"aria-label":i.label(),"aria-disabled":i.disabled(),"data-p-focused":i.isItemFocused(),"data-p-disabled":i.disabled()||!1,"data-p":i.dataP},i.getPTOptions("item")),[h("div",p({class:t.cx("itemContent"),onClick:e[0]||(e[0]=function(c){return i.onItemClick(c)}),onMousemove:e[1]||(e[1]=function(c){return i.onItemMouseMove(c)}),"data-p":i.dataP},i.getPTOptions("itemContent")),[n.templates.item?n.templates.item?(d(),$(de(n.templates.item),{key:1,item:n.item,label:i.label(),props:i.getMenuItemProps(n.item)},null,8,["item","label","props"])):x("",!0):Ge((d(),u("a",p({key:0,href:n.item.url,class:t.cx("itemLink"),target:n.item.target,tabindex:"-1"},i.getPTOptions("itemLink")),[n.templates.itemicon?(d(),$(de(n.templates.itemicon),{key:0,item:n.item,class:G(t.cx("itemIcon"))},null,8,["item","class"])):n.item.icon?(d(),u("span",p({key:1,class:[t.cx("itemIcon"),n.item.icon],"data-p":i.dataP},i.getPTOptions("itemIcon")),null,16,Un)):x("",!0),h("span",p({class:t.cx("itemLabel"),"data-p":i.dataP},i.getPTOptions("itemLabel")),z(i.label()),17,Rn)],16,Kn)),[[m]])],16,Hn)],16,Bn)):x("",!0)}an.render=jn;function Bt(t){return qn(t)||_n(t)||Nn(t)||Gn()}function Gn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Nn(t,e){if(t){if(typeof t=="string")return ht(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ht(t,e):void 0}}function _n(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function qn(t){if(Array.isArray(t))return ht(t)}function ht(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Wn={name:"Menu",extends:Dn,inheritAttrs:!1,emits:["show","hide","focus","blur"],data:function(){return{overlayVisible:!1,focused:!1,focusedOptionIndex:-1,selectedOptionIndex:-1}},target:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,list:null,mounted:function(){this.popup||(this.bindResizeListener(),this.bindOutsideClickListener())},beforeUnmount:function(){this.unbindResizeListener(),this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.target=null,this.container&&this.autoZIndex&&ae.clear(this.container),this.container=null},methods:{itemClick:function(e){var n=e.item;this.disabled(n)||(n.command&&n.command(e),this.overlayVisible&&this.hide(),!this.popup&&this.focusedOptionIndex!==e.id&&(this.focusedOptionIndex=e.id))},itemMouseMove:function(e){this.focused&&(this.focusedOptionIndex=e.id)},onListFocus:function(e){this.focused=!0,!this.popup&&this.changeFocusedOptionIndex(0),this.$emit("focus",e)},onListBlur:function(e){this.focused=!1,this.focusedOptionIndex=-1,this.$emit("blur",e)},onListKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Space":this.onSpaceKey(e);break;case"Escape":this.popup&&(J(this.target),this.hide());case"Tab":this.overlayVisible&&this.hide();break}},onArrowDownKey:function(e){var n=this.findNextOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.popup)J(this.target),this.hide(),e.preventDefault();else{var n=this.findPrevOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()}},onHomeKey:function(e){this.changeFocusedOptionIndex(0),e.preventDefault()},onEndKey:function(e){this.changeFocusedOptionIndex(We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]').length-1),e.preventDefault()},onEnterKey:function(e){var n=$e(this.list,'li[id="'.concat("".concat(this.focusedOptionIndex),'"]')),l=n&&$e(n,'a[data-pc-section="itemlink"]');this.popup&&J(this.target),l?l.click():n&&n.click(),e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},findNextOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Bt(n).findIndex(function(o){return o.id===e});return l>-1?l+1:0},findPrevOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Bt(n).findIndex(function(o){return o.id===e});return l>-1?l-1:0},changeFocusedOptionIndex:function(e){var n=We(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=e>=n.length?n.length-1:e<0?0:e;l>-1&&(this.focusedOptionIndex=n[l].getAttribute("id"))},toggle:function(e,n){this.overlayVisible?this.hide():this.show(e,n)},show:function(e,n){this.overlayVisible=!0,this.target=n??e.currentTarget},hide:function(){this.overlayVisible=!1,this.target=null},onEnter:function(e){Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.bindOutsideClickListener(),this.bindResizeListener(),this.bindScrollListener(),this.autoZIndex&&ae.set("menu",e,this.baseZIndex||this.$primevue.config.zIndex.menu),this.popup&&J(this.list),this.$emit("show")},onLeave:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindScrollListener(),this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&ae.clear(e)},alignOverlay:function(){et(this.container,this.target);var e=Fe(this.target);e>Fe(this.container)&&(this.container.style.minWidth=Fe(this.target)+"px")},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=e.container&&!e.container.contains(n.target),o=!(e.target&&(e.target===n.target||e.target.contains(n.target)));e.overlayVisible&&l&&o?e.hide():!e.popup&&l&&o&&(e.focusedOptionIndex=-1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.target,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},visible:function(e){return typeof e.visible=="function"?e.visible():e.visible!==!1},disabled:function(e){return typeof e.disabled=="function"?e.disabled():e.disabled},label:function(e){return typeof e.label=="function"?e.label():e.label},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.target})},containerRef:function(e){this.container=e},listRef:function(e){this.list=e}},computed:{focusedOptionId:function(){return this.focusedOptionIndex!==-1?this.focusedOptionIndex:null},dataP:function(){return se({popup:this.popup})}},components:{PVMenuitem:an,Portal:Re}},Zn=["id","data-p"],Xn=["id","tabindex","aria-activedescendant","aria-label","aria-labelledby"],Yn=["id"];function Jn(t,e,n,l,o,i){var m=N("PVMenuitem"),c=N("Portal");return d(),$(c,{appendTo:t.appendTo,disabled:!t.popup},{default:v(function(){return[r(Ne,p({name:"p-anchored-overlay",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:v(function(){return[!t.popup||o.overlayVisible?(d(),u("div",p({key:0,ref:i.containerRef,id:t.$id,class:t.cx("root"),onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),"data-p":i.dataP},t.ptmi("root")),[t.$slots.start?(d(),u("div",p({key:0,class:t.cx("start")},t.ptm("start")),[V(t.$slots,"start")],16)):x("",!0),h("ul",p({ref:i.listRef,id:t.$id+"_list",class:t.cx("list"),role:"menu",tabindex:t.tabindex,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,onFocus:e[0]||(e[0]=function(){return i.onListFocus&&i.onListFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onListBlur&&i.onListBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onListKeyDown&&i.onListKeyDown.apply(i,arguments)})},t.ptm("list")),[(d(!0),u(M,null,oe(t.model,function(f,g){return d(),u(M,{key:i.label(f)+g.toString()},[f.items&&i.visible(f)&&!f.separator?(d(),u(M,{key:0},[f.items?(d(),u("li",p({key:0,id:t.$id+"_"+g,class:[t.cx("submenuLabel"),f.class],role:"none"},{ref_for:!0},t.ptm("submenuLabel")),[V(t.$slots,t.$slots.submenulabel?"submenulabel":"submenuheader",{item:f},function(){return[j(z(i.label(f)),1)]})],16,Yn)):x("",!0),(d(!0),u(M,null,oe(f.items,function(w,I){return d(),u(M,{key:w.label+g+"_"+I},[i.visible(w)&&!w.separator?(d(),$(m,{key:0,id:t.$id+"_"+g+"_"+I,item:w,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"])):i.visible(w)&&w.separator?(d(),u("li",p({key:"separator"+g+I,class:[t.cx("separator"),f.class],style:w.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):x("",!0)],64)}),128))],64)):i.visible(f)&&f.separator?(d(),u("li",p({key:"separator"+g.toString(),class:[t.cx("separator"),f.class],style:f.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):(d(),$(m,{key:i.label(f)+g.toString(),id:t.$id+"_"+g,item:f,index:g,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","index","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"]))],64)}),128))],16,Xn),t.$slots.end?(d(),u("div",p({key:1,class:t.cx("end")},t.ptm("end")),[V(t.$slots,"end")],16)):x("",!0)],16,Zn)):x("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo","disabled"])}Wn.render=Jn;const rn=[{id:"draft",title:"Черновик",hint:"Сценарий без озвучки"},{id:"voiced",title:"Озвучено",hint:"Ждёт раскадровку"},{id:"storyboard",title:"Раскадровка",hint:"Картинки готовы, нужен монтаж"},{id:"video",title:"Смонтировано",hint:"Видео собрано, надо проверить"},{id:"ready",title:"Готово",hint:"Проверено, можно выкладывать"},{id:"published",title:"Выложено",hint:""}],Ht=t=>rn.findIndex(e=>e.id===t),va=t=>rn.find(e=>e.id===t)?.title??t,Qn=[{label:"До озвучки",icon:"pi pi-microphone",steps:["translate","voice"],below:"voiced"},{label:"До раскадровки",icon:"pi pi-images",steps:["translate","voice","scenes","characters","prompts","images"],below:"storyboard"},{label:"До видео",icon:"pi pi-video",steps:["translate","voice","scenes","characters","prompts","images","render"],below:"video"},{label:"Весь конвейер",icon:"pi pi-play",steps:null,below:"ready"}],ga=t=>t?new Date(t*1e3).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):"";async function ya(t,e){try{await ue.patch(`/api/tracks/${t}`,e)}catch(n){_e().error(n)}}function ka(t){const e=_e(),n=tt();async function l(c,f){try{const g=await ue.post(`/api/projects/${c.id}/run`,f?{steps:f}:{});e.info(g.message,c.name),n.loadActiveJobs(),t()}catch(g){e.error(g)}}async function o(c,f){try{await ue.post(`/api/projects/${c.id}/mark`,f),t()}catch(g){e.error(g)}}async function i(c){try{await ue.post(`/api/projects/${c.id}/cancel`),n.loadActiveJobs(),t()}catch(f){e.error(f)}}function m(c,f){const g=Ht(c.status),w=c.tracks_status.some(P=>P.has_script),I=c.status==="published",E=c.tracks_status.some(P=>P.published_at),U=[];if(f)U.push({label:"Остановить",icon:"pi pi-stop",command:()=>i(c)});else{const P=Qn.filter(O=>g<Ht(O.below));P.length&&U.push({label:"Довести до…",items:P.map(O=>({label:O.label,icon:O.icon,disabled:!w,command:()=>l(c,O.steps)}))})}const D=[];return c.status==="video"&&D.push({label:"Проверено",icon:"pi pi-check",command:()=>o(c,{approved:!0})}),c.status==="ready"&&D.push({label:"Снять «проверено»",icon:"pi pi-undo",command:()=>o(c,{approved:!1})}),I||D.push({label:"Выложено",icon:"pi pi-send",command:()=>o(c,{published:!0})}),E&&D.push({label:"Снять «выложено»",icon:"pi pi-undo",command:()=>o(c,{published:!1})}),D.length&&U.push({label:"Отметить",items:D}),U}return{runUntil:l,mark:o,stop:i,menuFor:m}}var ei=`
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
`,ti={root:"p-colorpicker p-component",preview:function(e){var n=e.props;return["p-colorpicker-preview",{"p-disabled":n.disabled}]},panel:function(e){var n=e.instance,l=e.props;return["p-colorpicker-panel",{"p-colorpicker-panel-inline":l.inline,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},colorSelector:"p-colorpicker-color-selector",colorBackground:"p-colorpicker-color-background",colorHandle:"p-colorpicker-color-handle",hue:"p-colorpicker-hue",hueHandle:"p-colorpicker-hue-handle"},ni=he.extend({name:"colorpicker",style:ei,classes:ti}),ii={name:"BaseColorPicker",extends:Xt,props:{defaultColor:{type:null,default:"ff0000"},inline:{type:Boolean,default:!1},format:{type:String,default:"hex"},tabindex:{type:String,default:null},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},appendTo:{type:[String,Object],default:"body"},inputId:{type:String,default:null},panelClass:null,overlayClass:null},style:ni,provide:function(){return{$pcColorPicker:this,$parentInstance:this}}},Oe={name:"ColorPicker",extends:ii,inheritAttrs:!1,emits:["change","show","hide"],data:function(){return{overlayVisible:!1}},hsbValue:null,localHue:null,outsideClickListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,scrollHandler:null,resizeListener:null,hueDragging:null,colorDragging:null,selfUpdate:null,picker:null,colorSelector:null,colorHandle:null,hueView:null,hueHandle:null,watch:{modelValue:{immediate:!0,handler:function(e){this.hsbValue=this.toHSB(e),this.selfUpdate?this.selfUpdate=!1:this.updateUI()}}},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindDragListeners(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.picker&&this.autoZIndex&&ae.clear(this.picker),this.clearRefs()},mounted:function(){this.updateUI()},methods:{pickColor:function(e){var n=this.colorSelector.getBoundingClientRect(),l=n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),o=n.left+document.body.scrollLeft,i=Math.floor(100*Math.max(0,Math.min(150,(e.pageX||e.changedTouches[0].pageX)-o))/150),m=Math.floor(100*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-l)))/150);this.hsbValue=this.validateHSB({h:this.localHue,s:i,b:m}),this.selfUpdate=!0,this.updateColorHandle(),this.updateInput(),this.updateModel(e)},pickHue:function(e){var n=this.hueView.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);this.localHue=Math.floor(360*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-n)))/150),this.hsbValue=this.validateHSB({h:this.localHue,s:this.hsbValue.s,b:this.hsbValue.b}),this.selfUpdate=!0,this.updateColorSelector(),this.updateHue(),this.updateModel(e),this.updateInput()},updateModel:function(e){var n=this.d_value;switch(this.format){case"hex":n=this.HSBtoHEX(this.hsbValue);break;case"rgb":n=this.HSBtoRGB(this.hsbValue);break;case"hsb":n=this.hsbValue;break}this.writeValue(n,e),this.$emit("change",{event:e,value:n})},updateColorSelector:function(){if(this.colorSelector){var e=this.validateHSB({h:this.hsbValue.h,s:100,b:100});this.colorSelector.style.backgroundColor="#"+this.HSBtoHEX(e)}},updateColorHandle:function(){this.colorHandle&&(this.colorHandle.style.left=Math.floor(150*this.hsbValue.s/100)+"px",this.colorHandle.style.top=Math.floor(150*(100-this.hsbValue.b)/100)+"px")},updateHue:function(){this.hueHandle&&(this.hueHandle.style.top=Math.floor(150-150*this.hsbValue.h/360)+"px")},updateInput:function(){this.$refs.input&&(this.$refs.input.style.backgroundColor="#"+this.HSBtoHEX(this.hsbValue))},updateUI:function(){this.updateHue(),this.updateColorHandle(),this.updateInput(),this.updateColorSelector()},validateHSB:function(e){return{h:Math.min(360,Math.max(0,e.h)),s:Math.min(100,Math.max(0,e.s)),b:Math.min(100,Math.max(0,e.b))}},validateRGB:function(e){return{r:Math.min(255,Math.max(0,e.r)),g:Math.min(255,Math.max(0,e.g)),b:Math.min(255,Math.max(0,e.b))}},validateHEX:function(e){var n=6-e.length;if(n>0){for(var l=[],o=0;o<n;o++)l.push("0");l.push(e),e=l.join("")}return e},HEXtoRGB:function(e){var n=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:n>>16,g:(n&65280)>>8,b:n&255}},HEXtoHSB:function(e){return this.RGBtoHSB(this.HEXtoRGB(e))},RGBtoHSB:function(e){var n={h:0,s:0,b:0},l=Math.min(e.r,e.g,e.b),o=Math.max(e.r,e.g,e.b),i=o-l;return n.b=o,n.s=o!==0?255*i/o:0,n.s!==0?e.r===o?n.h=(e.g-e.b)/i:e.g===o?n.h=2+(e.b-e.r)/i:n.h=4+(e.r-e.g)/i:n.h=-1,n.h*=60,n.h<0&&(n.h+=360),n.s*=100/255,n.b*=100/255,n},HSBtoRGB:function(e){var n={r:null,g:null,b:null},l=Math.round(e.h),o=Math.round(e.s*255/100),i=Math.round(e.b*255/100);if(o===0)n={r:i,g:i,b:i};else{var m=i,c=(255-o)*i/255,f=(m-c)*(l%60)/60;l===360&&(l=0),l<60?(n.r=m,n.b=c,n.g=c+f):l<120?(n.g=m,n.b=c,n.r=m-f):l<180?(n.g=m,n.r=c,n.b=c+f):l<240?(n.b=m,n.r=c,n.g=m-f):l<300?(n.b=m,n.g=c,n.r=c+f):l<360?(n.r=m,n.g=c,n.b=m-f):(n.r=0,n.g=0,n.b=0)}return{r:Math.round(n.r),g:Math.round(n.g),b:Math.round(n.b)}},RGBtoHEX:function(e){var n=[e.r.toString(16),e.g.toString(16),e.b.toString(16)];for(var l in n)n[l].length===1&&(n[l]="0"+n[l]);return n.join("")},HSBtoHEX:function(e){return this.RGBtoHEX(this.HSBtoRGB(e))},toHSB:function(e){var n;if(e)switch(this.format){case"hex":n=this.HEXtoHSB(e);break;case"rgb":n=this.RGBtoHSB(e);break;case"hsb":n=e;break}else n=this.HEXtoHSB(this.defaultColor);return n.s===0||n.b===0?n.h=this.localHue:this.localHue=n.h,n},onOverlayEnter:function(e){this.updateUI(),this.alignOverlay(),this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&ae.set("overlay",e,this.baseZIndex||this.$primevue.config.zIndex.overlay),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),this.$emit("show")},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.clearRefs(),this.$emit("hide")},onOverlayAfterLeave:function(e){this.autoZIndex&&ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.picker,this.$refs.input):et(this.picker,this.$refs.input)},onInputClick:function(){this.disabled||(this.overlayVisible=!this.overlayVisible)},onInputKeydown:function(e){switch(e.code){case"Space":this.overlayVisible=!this.overlayVisible,e.preventDefault();break;case"Escape":case"Tab":this.overlayVisible=!1;break}},onInputBlur:function(e){var n,l;(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onColorMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onColorDragStart(e))},onColorDragStart:function(e){this.disabled||(this.colorDragging=!0,this.pickColor(e),this.$el.setAttribute("p-colorpicker-dragging","true"),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},onDrag:function(e){this.colorDragging&&(this.pickColor(e),e.preventDefault()),this.hueDragging&&(this.pickHue(e),e.preventDefault())},onDragEnd:function(){this.colorDragging=!1,this.hueDragging=!1,this.$el.setAttribute("p-colorpicker-dragging","false"),!this.isUnstyled&&In(this.$el,"p-colorpicker-dragging"),this.unbindDragListeners()},onHueMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onHueDragStart(e))},onHueDragStart:function(e){this.disabled||(this.hueDragging=!0,this.pickHue(e),!this.isUnstyled&&pt(this.$el,"p-colorpicker-dragging"),e.preventDefault())},isInputClicked:function(e){return this.$refs.input&&this.$refs.input.isSameNode(e.target)},bindDragListeners:function(){this.bindDocumentMouseMoveListener(),this.bindDocumentMouseUpListener()},unbindDragListeners:function(){this.unbindDocumentMouseMoveListener(),this.unbindDocumentMouseUpListener()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.picker&&!e.picker.contains(n.target)&&!e.isInputClicked(n)&&(e.overlayVisible=!1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&(e.overlayVisible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&(e.overlayVisible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindDocumentMouseMoveListener:function(){this.documentMouseMoveListener||(this.documentMouseMoveListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.documentMouseMoveListener))},unbindDocumentMouseMoveListener:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null)},bindDocumentMouseUpListener:function(){this.documentMouseUpListener||(this.documentMouseUpListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseUpListener:function(){this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},pickerRef:function(e){this.picker=e},colorSelectorRef:function(e){this.colorSelector=e},colorHandleRef:function(e){this.colorHandle=e},hueViewRef:function(e){this.hueView=e},hueHandleRef:function(e){this.hueHandle=e},clearRefs:function(){this.picker=null,this.colorSelector=null,this.colorHandle=null,this.hueView=null,this.hueHandle=null},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})}},components:{Portal:Re}};function Pe(t){"@babel/helpers - typeof";return Pe=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Pe(t)}function Kt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function Ut(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Kt(Object(n),!0).forEach(function(l){li(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Kt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function li(t,e,n){return(e=oi(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function oi(t){var e=si(t,"string");return Pe(e)=="symbol"?e:e+""}function si(t,e){if(Pe(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Pe(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ai=["id","tabindex","disabled"];function ri(t,e,n,l,o,i){var m=N("Portal");return d(),u("div",p({ref:"container",class:t.cx("root")},t.ptmi("root")),[t.inline?x("",!0):(d(),u("input",p({key:0,ref:"input",id:t.inputId,type:"text",class:t.cx("preview"),readonly:"",tabindex:t.tabindex,disabled:t.disabled,onClick:e[0]||(e[0]=function(){return i.onInputClick&&i.onInputClick.apply(i,arguments)}),onKeydown:e[1]||(e[1]=function(){return i.onInputKeydown&&i.onInputKeydown.apply(i,arguments)}),onBlur:e[2]||(e[2]=function(){return i.onInputBlur&&i.onInputBlur.apply(i,arguments)})},t.ptm("preview")),null,16,ai)),r(m,{appendTo:t.appendTo,disabled:t.inline},{default:v(function(){return[r(Ne,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[t.inline||o.overlayVisible?(d(),u("div",p({key:0,ref:i.pickerRef,class:[t.cx("panel"),t.panelClass,t.overlayClass],onClick:e[11]||(e[11]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)})},Ut(Ut({},t.ptm("panel")),t.ptm("overlay"))),[h("div",p({class:t.cx("content")},t.ptm("content")),[h("div",p({ref:i.colorSelectorRef,class:t.cx("colorSelector"),onMousedown:e[3]||(e[3]=function(c){return i.onColorMousedown(c)}),onTouchstart:e[4]||(e[4]=function(c){return i.onColorDragStart(c)}),onTouchmove:e[5]||(e[5]=function(c){return i.onDrag(c)}),onTouchend:e[6]||(e[6]=function(c){return i.onDragEnd()})},t.ptm("colorSelector")),[h("div",p({class:t.cx("colorBackground")},t.ptm("colorBackground")),[h("div",p({ref:i.colorHandleRef,class:t.cx("colorHandle")},t.ptm("colorHandle")),null,16)],16)],16),h("div",p({ref:i.hueViewRef,class:t.cx("hue"),onMousedown:e[7]||(e[7]=function(c){return i.onHueMousedown(c)}),onTouchstart:e[8]||(e[8]=function(c){return i.onHueDragStart(c)}),onTouchmove:e[9]||(e[9]=function(c){return i.onDrag(c)}),onTouchend:e[10]||(e[10]=function(c){return i.onDragEnd()})},t.ptm("hue")),[h("div",p({ref:i.hueHandleRef,class:t.cx("hueHandle")},t.ptm("hueHandle")),null,16)],16)],16)],16)):x("",!0)]}),_:1},16,["onEnter","onLeave","onAfterLeave"])]}),_:1},8,["appendTo","disabled"])],16)}Oe.render=ri;var dn={name:"BlankIcon",extends:nt};function di(t){return hi(t)||pi(t)||ci(t)||ui()}function ui(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ci(t,e){if(t){if(typeof t=="string")return ft(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ft(t,e):void 0}}function pi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function hi(t){if(Array.isArray(t))return ft(t)}function ft(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function fi(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),di(e[0]||(e[0]=[h("rect",{width:"1",height:"1",fill:"currentColor","fill-opacity":"0"},null,-1)])),16)}dn.render=fi;var Vt={name:"ChevronDownIcon",extends:nt};function mi(t){return yi(t)||gi(t)||vi(t)||bi()}function bi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function vi(t,e){if(t){if(typeof t=="string")return mt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?mt(t,e):void 0}}function gi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function yi(t){if(Array.isArray(t))return mt(t)}function mt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function ki(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),mi(e[0]||(e[0]=[h("path",{d:"M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z",fill:"currentColor"},null,-1)])),16)}Vt.render=ki;var Mt={name:"SearchIcon",extends:nt};function wi(t){return Si(t)||Ii(t)||xi(t)||Oi()}function Oi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function xi(t,e){if(t){if(typeof t=="string")return bt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?bt(t,e):void 0}}function Ii(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Si(t){if(Array.isArray(t))return bt(t)}function bt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Li(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),wi(e[0]||(e[0]=[h("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z",fill:"currentColor"},null,-1)])),16)}Mt.render=Li;var Ci=`
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
`,Vi={root:"p-iconfield"},Mi=he.extend({name:"iconfield",style:Ci,classes:Vi}),zi={name:"BaseIconField",extends:ke,style:Mi,provide:function(){return{$pcIconField:this,$parentInstance:this}}},zt={name:"IconField",extends:zi,inheritAttrs:!1};function Fi(t,e,n,l,o,i){return d(),u("div",p({class:t.cx("root")},t.ptmi("root")),[V(t.$slots,"default")],16)}zt.render=Fi;var $i={root:"p-inputicon"},Ti=he.extend({name:"inputicon",classes:$i}),Pi={name:"BaseInputIcon",extends:ke,style:Ti,props:{class:null},provide:function(){return{$pcInputIcon:this,$parentInstance:this}}},Ft={name:"InputIcon",extends:Pi,inheritAttrs:!1,computed:{containerClass:function(){return[this.cx("root"),this.class]}}};function Ai(t,e,n,l,o,i){return d(),u("span",p({class:i.containerClass},t.ptmi("root"),{"aria-hidden":"true"}),[V(t.$slots,"default")],16)}Ft.render=Ai;var Ei=`
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
`,Rt=he.extend({name:"virtualscroller",css:Di,style:Ei}),Bi={name:"BaseVirtualScroller",extends:ke,props:{id:{type:String,default:null},style:null,class:null,items:{type:Array,default:null},itemSize:{type:[Number,Array],default:0},scrollHeight:null,scrollWidth:null,orientation:{type:String,default:"vertical"},numToleratedItems:{type:Number,default:null},delay:{type:Number,default:0},resizeDelay:{type:Number,default:10},lazy:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},loaderDisabled:{type:Boolean,default:!1},columns:{type:Array,default:null},loading:{type:Boolean,default:!1},showSpacer:{type:Boolean,default:!0},showLoader:{type:Boolean,default:!1},tabindex:{type:Number,default:0},inline:{type:Boolean,default:!1},step:{type:Number,default:0},appendOnly:{type:Boolean,default:!1},autoSize:{type:Boolean,default:!1}},style:Rt,provide:function(){return{$pcVirtualScroller:this,$parentInstance:this}},beforeMount:function(){var e;Rt.loadCSS({nonce:(e=this.$primevueConfig)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce})}};function Ae(t){"@babel/helpers - typeof";return Ae=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ae(t)}function jt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function ze(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?jt(Object(n),!0).forEach(function(l){un(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):jt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function un(t,e,n){return(e=Hi(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Hi(t){var e=Ki(t,"string");return Ae(e)=="symbol"?e:e+""}function Ki(t,e){if(Ae(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ae(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var $t={name:"VirtualScroller",extends:Bi,inheritAttrs:!1,emits:["update:numToleratedItems","scroll","scroll-index-change","lazy-load"],data:function(){var e=this.isBoth();return{first:e?{rows:0,cols:0}:0,last:e?{rows:0,cols:0}:0,page:e?{rows:0,cols:0}:0,numItemsInViewport:e?{rows:0,cols:0}:0,lastScrollPos:e?{top:0,left:0}:0,d_numToleratedItems:this.numToleratedItems,d_loading:this.loading,loaderArr:[],spacerStyle:{},contentStyle:{}}},element:null,content:null,lastScrollPos:null,scrollTimeout:null,resizeTimeout:null,defaultWidth:0,defaultHeight:0,defaultContentWidth:0,defaultContentHeight:0,isRangeChanged:!1,lazyLoadState:{},resizeListener:null,resizeObserver:null,initialized:!1,watch:{numToleratedItems:function(e){this.d_numToleratedItems=e},loading:function(e,n){this.lazy&&e!==n&&e!==this.d_loading&&(this.d_loading=e)},items:{handler:function(e,n){(!n||n.length!==(e||[]).length)&&(this.init(),this.calculateAutoSize())},deep:!0},itemSize:function(){this.init(),this.calculateAutoSize()},orientation:function(){this.lastScrollPos=this.isBoth()?{top:0,left:0}:0},scrollHeight:function(){this.init(),this.calculateAutoSize()},scrollWidth:function(){this.init(),this.calculateAutoSize()}},mounted:function(){this.viewInit(),this.lastScrollPos=this.isBoth()?{top:0,left:0}:0,this.lazyLoadState=this.lazyLoadState||{}},updated:function(){!this.initialized&&this.viewInit()},unmounted:function(){this.unbindResizeListener(),this.initialized=!1},methods:{viewInit:function(){Xe(this.element)&&(this.setContentEl(this.content),this.init(),this.calculateAutoSize(),this.defaultWidth=Ve(this.element),this.defaultHeight=Me(this.element),this.defaultContentWidth=Ve(this.content),this.defaultContentHeight=Me(this.content),this.initialized=!0),this.element&&this.bindResizeListener()},init:function(){this.disabled||(this.setSize(),this.calculateOptions(),this.setSpacerSize())},isVertical:function(){return this.orientation==="vertical"},isHorizontal:function(){return this.orientation==="horizontal"},isBoth:function(){return this.orientation==="both"},scrollTo:function(e){this.element&&this.element.scrollTo(e)},scrollToIndex:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:"auto",o=this.isBoth(),i=this.isHorizontal(),m=o?e.every(function(L){return L>-1}):e>-1;if(m){var c=this.first,f=this.element,g=f.scrollTop,w=g===void 0?0:g,I=f.scrollLeft,E=I===void 0?0:I,U=this.calculateNumItems(),D=U.numToleratedItems,P=this.getContentPosition(),O=this.itemSize,B=function(){var F=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Z=arguments.length>1?arguments[1]:void 0;return F<=Z?0:F},A=function(F,Z,Q){return F*Z+Q},K=function(){var F=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,Z=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.scrollTo({left:F,top:Z,behavior:l})},C=o?{rows:0,cols:0}:0,re=!1,_=!1;o?(C={rows:B(e[0],D[0]),cols:B(e[1],D[1])},K(A(C.cols,O[1],P.left),A(C.rows,O[0],P.top)),_=this.lastScrollPos.top!==w||this.lastScrollPos.left!==E,re=C.rows!==c.rows||C.cols!==c.cols):(C=B(e,D),i?K(A(C,O,P.left),w):K(E,A(C,O,P.top)),_=this.lastScrollPos!==(i?E:w),re=C!==c),this.isRangeChanged=re,_&&(this.first=C)}},scrollInView:function(e,n){var l=this,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"auto";if(n){var i=this.isBoth(),m=this.isHorizontal(),c=i?e.every(function(O){return O>-1}):e>-1;if(c){var f=this.getRenderedRange(),g=f.first,w=f.viewport,I=function(){var B=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,A=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return l.scrollTo({left:B,top:A,behavior:o})},E=n==="to-start",U=n==="to-end";if(E){if(i)w.first.rows-g.rows>e[0]?I(w.first.cols*this.itemSize[1],(w.first.rows-1)*this.itemSize[0]):w.first.cols-g.cols>e[1]&&I((w.first.cols-1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.first-g>e){var D=(w.first-1)*this.itemSize;m?I(D,0):I(0,D)}}else if(U){if(i)w.last.rows-g.rows<=e[0]+1?I(w.first.cols*this.itemSize[1],(w.first.rows+1)*this.itemSize[0]):w.last.cols-g.cols<=e[1]+1&&I((w.first.cols+1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.last-g<=e+1){var P=(w.first+1)*this.itemSize;m?I(P,0):I(0,P)}}}}else this.scrollToIndex(e,o)},getRenderedRange:function(){var e=function(I,E){return Math.floor(I/(E||I))},n=this.first,l=0;if(this.element){var o=this.isBoth(),i=this.isHorizontal(),m=this.element,c=m.scrollTop,f=m.scrollLeft;if(o)n={rows:e(c,this.itemSize[0]),cols:e(f,this.itemSize[1])},l={rows:n.rows+this.numItemsInViewport.rows,cols:n.cols+this.numItemsInViewport.cols};else{var g=i?f:c;n=e(g,this.itemSize),l=n+this.numItemsInViewport}}return{first:this.first,last:this.last,viewport:{first:n,last:l}}},calculateNumItems:function(){var e=this.isBoth(),n=this.isHorizontal(),l=this.itemSize,o=this.getContentPosition(),i=this.element?this.element.offsetWidth-o.left:0,m=this.element?this.element.offsetHeight-o.top:0,c=function(E,U){return Math.ceil(E/(U||E))},f=function(E){return Math.ceil(E/2)},g=e?{rows:c(m,l[0]),cols:c(i,l[1])}:c(n?i:m,l),w=this.d_numToleratedItems||(e?[f(g.rows),f(g.cols)]:f(g));return{numItemsInViewport:g,numToleratedItems:w}},calculateOptions:function(){var e=this,n=this.isBoth(),l=this.first,o=this.calculateNumItems(),i=o.numItemsInViewport,m=o.numToleratedItems,c=function(w,I,E){var U=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;return e.getLast(w+I+(w<E?2:3)*E,U)},f=n?{rows:c(l.rows,i.rows,m[0]),cols:c(l.cols,i.cols,m[1],!0)}:c(l,i,m);this.last=f,this.numItemsInViewport=i,this.d_numToleratedItems=m,this.$emit("update:numToleratedItems",this.d_numToleratedItems),this.showLoader&&(this.loaderArr=n?Array.from({length:i.rows}).map(function(){return Array.from({length:i.cols})}):Array.from({length:i})),this.lazy&&Promise.resolve().then(function(){var g;e.lazyLoadState={first:e.step?n?{rows:0,cols:l.cols}:0:l,last:Math.min(e.step?e.step:f,((g=e.items)===null||g===void 0?void 0:g.length)||0)},e.$emit("lazy-load",e.lazyLoadState)})},calculateAutoSize:function(){var e=this;this.autoSize&&!this.d_loading&&Promise.resolve().then(function(){if(e.content){var n=e.isBoth(),l=e.isHorizontal(),o=e.isVertical();e.content.style.minHeight=e.content.style.minWidth="auto",e.content.style.position="relative",e.element.style.contain="none";var i=[Ve(e.element),Me(e.element)],m=i[0],c=i[1];(n||l)&&(e.element.style.width=m<e.defaultWidth?m+"px":e.scrollWidth||e.defaultWidth+"px"),(n||o)&&(e.element.style.height=c<e.defaultHeight?c+"px":e.scrollHeight||e.defaultHeight+"px"),e.content.style.minHeight=e.content.style.minWidth="",e.content.style.position="",e.element.style.contain=""}})},getLast:function(){var e,n,l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,o=arguments.length>1?arguments[1]:void 0;return this.items?Math.min(o?((e=this.columns||this.items[0])===null||e===void 0?void 0:e.length)||0:((n=this.items)===null||n===void 0?void 0:n.length)||0,l):0},getContentPosition:function(){if(this.content){var e=getComputedStyle(this.content),n=parseFloat(e.paddingLeft)+Math.max(parseFloat(e.left)||0,0),l=parseFloat(e.paddingRight)+Math.max(parseFloat(e.right)||0,0),o=parseFloat(e.paddingTop)+Math.max(parseFloat(e.top)||0,0),i=parseFloat(e.paddingBottom)+Math.max(parseFloat(e.bottom)||0,0);return{left:n,right:l,top:o,bottom:i,x:n+l,y:o+i}}return{left:0,right:0,top:0,bottom:0,x:0,y:0}},setSize:function(){var e=this;if(this.element){var n=this.isBoth(),l=this.isHorizontal(),o=this.element.parentElement,i=this.scrollWidth||"".concat(this.element.offsetWidth||o.offsetWidth,"px"),m=this.scrollHeight||"".concat(this.element.offsetHeight||o.offsetHeight,"px"),c=function(g,w){return e.element.style[g]=w};n||l?(c("height",m),c("width",i)):c("height",m)}},setSpacerSize:function(){var e=this,n=this.items;if(n){var l=this.isBoth(),o=this.isHorizontal(),i=this.getContentPosition(),m=function(f,g,w){var I=arguments.length>3&&arguments[3]!==void 0?arguments[3]:0;return e.spacerStyle=ze(ze({},e.spacerStyle),un({},"".concat(f),(g||[]).length*w+I+"px"))};l?(m("height",n,this.itemSize[0],i.y),m("width",this.columns||n[1],this.itemSize[1],i.x)):o?m("width",this.columns||n,this.itemSize,i.x):m("height",n,this.itemSize,i.y)}},setContentPosition:function(e){var n=this;if(this.content&&!this.appendOnly){var l=this.isBoth(),o=this.isHorizontal(),i=e?e.first:this.first,m=function(w,I){return w*I},c=function(){var w=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,I=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.contentStyle=ze(ze({},n.contentStyle),{transform:"translate3d(".concat(w,"px, ").concat(I,"px, 0)")})};if(l)c(m(i.cols,this.itemSize[1]),m(i.rows,this.itemSize[0]));else{var f=m(i,this.itemSize);o?c(f,0):c(0,f)}}},onScrollPositionChange:function(e){var n=this,l=e.target,o=this.isBoth(),i=this.isHorizontal(),m=this.getContentPosition(),c=function(W,H){return W?W>H?W-H:W:0},f=function(W,H){return Math.floor(W/(H||W))},g=function(W,H,T,S,ie,ce){return W<=ie?ie:ce?T-S-ie:H+ie-1},w=function(W,H,T,S,ie,ce,we,Se){if(W<=ce)return 0;var Le=Math.max(0,we?W<H?T:W-ce:W>H?T:W-2*ce),qe=n.getLast(Le,Se);return Le>qe?qe-ie:Le},I=function(W,H,T,S,ie,ce){var we=H+S+2*ie;return W>=ie&&(we+=ie+1),n.getLast(we,ce)},E=c(l.scrollTop,m.top),U=c(l.scrollLeft,m.left),D=o?{rows:0,cols:0}:0,P=this.last,O=!1,B=this.lastScrollPos;if(o){var A=this.lastScrollPos.top<=E,K=this.lastScrollPos.left<=U;if(!this.appendOnly||this.appendOnly&&(A||K)){var C={rows:f(E,this.itemSize[0]),cols:f(U,this.itemSize[1])},re={rows:g(C.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],A),cols:g(C.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K)};D={rows:w(C.rows,re.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],A),cols:w(C.cols,re.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K,!0)},P={rows:I(C.rows,D.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0]),cols:I(C.cols,D.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],!0)},O=D.rows!==this.first.rows||P.rows!==this.last.rows||D.cols!==this.first.cols||P.cols!==this.last.cols||this.isRangeChanged,B={top:E,left:U}}}else{var _=i?U:E,L=this.lastScrollPos<=_;if(!this.appendOnly||this.appendOnly&&L){var F=f(_,this.itemSize),Z=g(F,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L);D=w(F,Z,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L),P=I(F,D,this.last,this.numItemsInViewport,this.d_numToleratedItems),O=D!==this.first||P!==this.last||this.isRangeChanged,B=_}}return{first:D,last:P,isRangeChanged:O,scrollPos:B}},onScrollChange:function(e){var n=this.onScrollPositionChange(e),l=n.first,o=n.last,i=n.isRangeChanged,m=n.scrollPos;if(i){var c={first:l,last:o};if(this.setContentPosition(c),this.first=l,this.last=o,this.lastScrollPos=m,this.$emit("scroll-index-change",c),this.lazy&&this.isPageChanged(l)){var f,g,w={first:this.step?Math.min(this.getPageByFirst(l)*this.step,(((f=this.items)===null||f===void 0?void 0:f.length)||0)-this.step):l,last:Math.min(this.step?(this.getPageByFirst(l)+1)*this.step:o,((g=this.items)===null||g===void 0?void 0:g.length)||0)},I=this.lazyLoadState.first!==w.first||this.lazyLoadState.last!==w.last;I&&this.$emit("lazy-load",w),this.lazyLoadState=w}}},onScroll:function(e){var n=this;if(this.$emit("scroll",e),this.delay){if(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.isPageChanged()){if(!this.d_loading&&this.showLoader){var l=this.onScrollPositionChange(e),o=l.isRangeChanged,i=o||(this.step?this.isPageChanged():!1);i&&(this.d_loading=!0)}this.scrollTimeout=setTimeout(function(){n.onScrollChange(e),n.d_loading&&n.showLoader&&(!n.lazy||n.loading===void 0)&&(n.d_loading=!1,n.page=n.getPageByFirst())},this.delay)}}else this.onScrollChange(e)},onResize:function(){var e=this;this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){if(Xe(e.element)){var n=e.isBoth(),l=e.isVertical(),o=e.isHorizontal(),i=[Ve(e.element),Me(e.element)],m=i[0],c=i[1],f=m!==e.defaultWidth,g=c!==e.defaultHeight,w=n?f||g:o?f:l?g:!1;w&&(e.d_numToleratedItems=e.numToleratedItems,e.defaultWidth=m,e.defaultHeight=c,e.defaultContentWidth=Ve(e.content),e.defaultContentHeight=Me(e.content),e.init())}},this.resizeDelay)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=this.onResize.bind(this),window.addEventListener("resize",this.resizeListener),window.addEventListener("orientationchange",this.resizeListener),this.resizeObserver=new ResizeObserver(function(){e.onResize()}),this.resizeObserver.observe(this.element))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),window.removeEventListener("orientationchange",this.resizeListener),this.resizeListener=null),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)},getOptions:function(e){var n=(this.items||[]).length,l=this.isBoth()?this.first.rows+e:this.first+e;return{index:l,count:n,first:l===0,last:l===n-1,even:l%2===0,odd:l%2!==0}},getLoaderOptions:function(e,n){var l=this.loaderArr.length;return ze({index:e,count:l,first:e===0,last:e===l-1,even:e%2===0,odd:e%2!==0},n)},getPageByFirst:function(e){return Math.floor(((e??this.first)+this.d_numToleratedItems*4)/(this.step||1))},isPageChanged:function(e){return this.step&&!this.lazy?this.page!==this.getPageByFirst(e??this.first):!0},setContentEl:function(e){this.content=e||this.content||$e(this.element,'[data-pc-section="content"]')},elementRef:function(e){this.element=e},contentRef:function(e){this.content=e}},computed:{containerClass:function(){return["p-virtualscroller",this.class,{"p-virtualscroller-inline":this.inline,"p-virtualscroller-both p-both-scroll":this.isBoth(),"p-virtualscroller-horizontal p-horizontal-scroll":this.isHorizontal()}]},contentClass:function(){return["p-virtualscroller-content",{"p-virtualscroller-loading":this.d_loading}]},loaderClass:function(){return["p-virtualscroller-loader",{"p-virtualscroller-loader-mask":!this.$slots.loader}]},loadedItems:function(){var e=this;return this.items&&!this.d_loading?this.isBoth()?this.items.slice(this.appendOnly?0:this.first.rows,this.last.rows).map(function(n){return e.columns?n:n.slice(e.appendOnly?0:e.first.cols,e.last.cols)}):this.isHorizontal()&&this.columns?this.items:this.items.slice(this.appendOnly?0:this.first,this.last):[]},loadedRows:function(){return this.d_loading?this.loaderDisabled?this.loaderArr:[]:this.loadedItems},loadedColumns:function(){if(this.columns){var e=this.isBoth(),n=this.isHorizontal();if(e||n)return this.d_loading&&this.loaderDisabled?e?this.loaderArr[0]:this.loaderArr:this.columns.slice(e?this.first.cols:this.first,e?this.last.cols:this.last)}return this.columns}},components:{SpinnerIcon:It}},Ui=["tabindex"];function Ri(t,e,n,l,o,i){var m=N("SpinnerIcon");return t.disabled?(d(),u(M,{key:1},[V(t.$slots,"default"),V(t.$slots,"content",{items:t.items,rows:t.items,columns:i.loadedColumns})],64)):(d(),u("div",p({key:0,ref:i.elementRef,class:i.containerClass,tabindex:t.tabindex,style:t.style,onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)})},t.ptmi("root")),[V(t.$slots,"content",{styleClass:i.contentClass,items:i.loadedItems,getItemOptions:i.getOptions,loading:o.d_loading,getLoaderOptions:i.getLoaderOptions,itemSize:t.itemSize,rows:i.loadedRows,columns:i.loadedColumns,contentRef:i.contentRef,spacerStyle:o.spacerStyle,contentStyle:o.contentStyle,vertical:i.isVertical(),horizontal:i.isHorizontal(),both:i.isBoth()},function(){return[h("div",p({ref:i.contentRef,class:i.contentClass,style:o.contentStyle},t.ptm("content")),[(d(!0),u(M,null,oe(i.loadedItems,function(c,f){return V(t.$slots,"item",{key:f,item:c,options:i.getOptions(f)})}),128))],16)]}),t.showSpacer?(d(),u("div",p({key:0,class:"p-virtualscroller-spacer",style:o.spacerStyle},t.ptm("spacer")),null,16)):x("",!0),!t.loaderDisabled&&t.showLoader&&o.d_loading?(d(),u("div",p({key:1,class:i.loaderClass},t.ptm("loader")),[t.$slots&&t.$slots.loader?(d(!0),u(M,{key:0},oe(o.loaderArr,function(c,f){return V(t.$slots,"loader",{key:f,options:i.getLoaderOptions(f,i.isBoth()&&{numCols:t.d_numItemsInViewport.cols})})}),128)):x("",!0),V(t.$slots,"loadingicon",{},function(){return[r(m,p({spin:"",class:"p-virtualscroller-loading-icon"},t.ptm("loadingIcon")),null,16)]})],16)):x("",!0)],16,Ui))}$t.render=Ri;var ji=`
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
`,Gi={root:function(e){var n=e.instance,l=e.props,o=e.state;return["p-select p-component p-inputwrapper",{"p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":o.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":o.focused||o.overlayVisible,"p-select-open":o.overlayVisible,"p-select-fluid":n.$fluid,"p-select-sm p-inputfield-sm":l.size==="small","p-select-lg p-inputfield-lg":l.size==="large"}]},label:function(e){var n,l=e.instance,o=e.props;return["p-select-label",{"p-placeholder":!o.editable&&l.label===o.placeholder,"p-select-label-empty":!o.editable&&!l.$slots.value&&(l.label==="p-emptylabel"||((n=l.label)===null||n===void 0?void 0:n.length)===0)}]},clearIcon:"p-select-clear-icon",dropdown:"p-select-dropdown",loadingicon:"p-select-loading-icon",dropdownIcon:"p-select-dropdown-icon",overlay:"p-select-overlay p-component",header:"p-select-header",pcFilter:"p-select-filter",listContainer:"p-select-list-container",list:"p-select-list",optionGroup:"p-select-option-group",optionGroupLabel:"p-select-option-group-label",option:function(e){var n=e.instance,l=e.props,o=e.state,i=e.option,m=e.focusedOption;return["p-select-option",{"p-select-option-selected":n.isSelected(i)&&l.highlightOnSelect,"p-focus":o.focusedOptionIndex===m,"p-disabled":n.isOptionDisabled(i)}]},optionLabel:"p-select-option-label",optionCheckIcon:"p-select-option-check-icon",optionBlankIcon:"p-select-option-blank-icon",emptyMessage:"p-select-empty-message"},Ni=he.extend({name:"select",style:ji,classes:Gi}),_i={name:"BaseSelect",extends:it,props:{options:Array,optionLabel:[String,Function],optionValue:[String,Function],optionDisabled:[String,Function],optionGroupLabel:[String,Function],optionGroupChildren:[String,Function],scrollHeight:{type:String,default:"14rem"},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},editable:Boolean,placeholder:{type:String,default:null},dataKey:null,showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},labelId:{type:String,default:null},labelClass:{type:[String,Object],default:null},labelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},appendTo:{type:[String,Object],default:"body"},loading:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},resetFilterOnHide:{type:Boolean,default:!1},resetFilterOnClear:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!0},checkmark:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Ni,provide:function(){return{$pcSelect:this,$parentInstance:this}}};function Ee(t){"@babel/helpers - typeof";return Ee=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ee(t)}function qi(t){return Yi(t)||Xi(t)||Zi(t)||Wi()}function Wi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Zi(t,e){if(t){if(typeof t=="string")return vt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?vt(t,e):void 0}}function Xi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Yi(t){if(Array.isArray(t))return vt(t)}function vt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Gt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function Nt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Gt(Object(n),!0).forEach(function(l){ge(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Gt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ge(t,e,n){return(e=Ji(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ji(t){var e=Qi(t,"string");return Ee(e)=="symbol"?e:e+""}function Qi(t,e){if(Ee(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ee(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ne={name:"Select",extends:_i,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter"],outsideClickListener:null,scrollHandler:null,resizeListener:null,labelClickListener:null,matchMediaOrientationListener:null,overlay:null,list:null,virtualScroller:null,searchTimeout:null,searchValue:null,isModelValueChanged:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1,queryOrientation:null}},watch:{modelValue:function(){this.isModelValueChanged=!0},options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel(),this.bindLabelClickListener(),this.bindMatchMediaOrientationListener()},updated:function(){this.overlayVisible&&this.isModelValueChanged&&this.scrollInView(this.findSelectedOptionIndex()),this.isModelValueChanged=!1},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindLabelClickListener(),this.unbindMatchMediaOrientationListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(ae.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return(this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e))+"_"+n},getPTItemOptions:function(e,n,l,o){return this.ptm(o,{context:{option:e,index:l,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),e&&J(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&J(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n=this;setTimeout(function(){var l,o;n.focused=!1,n.focusedOptionIndex=-1,n.searchValue="",n.$emit("blur",e),(l=(o=n.formField).onBlur)===null||l===void 0||l.call(o,e)},100)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}if(Sn())switch(e.code){case"Backspace":this.onBackspaceKey(e,this.editable);break;case"Enter":case"NumpadDecimal":this.onEnterKey(e);break;default:e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,this.editable);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,this.editable);break;case"Home":this.onHomeKey(e,this.editable);break;case"End":this.onEndKey(e,this.editable);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Space":this.onSpaceKey(e,this.editable);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"Backspace":this.onBackspaceKey(e,this.editable);break;case"ShiftLeft":case"ShiftRight":break;default:!l&&tn(e.key)&&(!this.overlayVisible&&this.show(),!this.editable&&this.searchOptions(e,e.key),this.filter&&this.$nextTick(function(){n.$refs.filterInput&&J(n.$refs.filterInput.$el)}));break}this.clicked=!1},onEditableInput:function(e){var n=e.target.value;this.searchValue="";var l=this.searchOptions(e,n);!l&&(this.focusedOptionIndex=-1),this.updateModel(e,n),!this.overlayVisible&&fe(n)&&this.show()},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,null),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?en(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onOptionSelect:function(e,n){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0;if(this.overlayVisible){var o=this.getOptionValue(n);this.updateModel(e,o),l&&this.hide(!0)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){if(!e.isComposing)switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show(),this.editable&&this.changeFocusedOptionIndex(e,this.findSelectedOptionIndex());else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else this.changeFocusedOptionIndex(e,this.findFirstOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var o=l.value.length;l.setSelectionRange(o,o),this.focusedOptionIndex=-1}}else this.changeFocusedOptionIndex(e,this.findLastOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.hide(!0)):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onSpaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;!n&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault(),e.stopPropagation()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(J(this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onBackspaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&!this.overlayVisible&&this.show()},onOverlayEnter:function(e){var n=this;ae.set("overlay",e,this.$primevue.config.zIndex.overlay),Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),setTimeout(function(){n.autoFilterFocus&&n.filter&&J(n.$refs.filterInput.$el),n.autoUpdateModel()},1)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){var n=this;e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.autoFilterFocus&&this.filter&&!this.editable&&this.$nextTick(function(){n.$refs.filterInput&&J(n.$refs.filterInput.$el)}),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.overlay,this.$el):this.overlay&&(this.overlay.style.minWidth=Fe(this.$el)+"px",et(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=n.composedPath();e.overlayVisible&&e.overlay&&!l.includes(e.$el)&&!l.includes(e.overlay)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindLabelClickListener:function(){var e=this;if(!this.editable&&!this.labelClickListener){var n=document.querySelector('label[for="'.concat(this.labelId,'"]'));n&&Xe(n)&&(this.labelClickListener=function(){J(e.$refs.focusInput)},n.addEventListener("click",this.labelClickListener))}},unbindLabelClickListener:function(){if(this.labelClickListener){var e=document.querySelector('label[for="'.concat(this.labelId,'"]'));e&&Xe(e)&&e.removeEventListener("click",this.labelClickListener)}},bindMatchMediaOrientationListener:function(){var e=this;if(!this.matchMediaOrientationListener){var n=matchMedia("(orientation: portrait)");this.queryOrientation=n,this.matchMediaOrientationListener=function(){e.alignOverlay()},this.queryOrientation.addEventListener("change",this.matchMediaOrientationListener)}},unbindMatchMediaOrientationListener:function(){this.matchMediaOrientationListener&&(this.queryOrientation.removeEventListener("change",this.matchMediaOrientationListener),this.queryOrientation=null,this.matchMediaOrientationListener=null)},hasFocusableElements:function(){return Jt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionExactMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale))==this.searchValue.toLocaleLowerCase(this.filterLocale)},isOptionStartsWith:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return fe(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isSelected:function(e){return Ie(this.d_value,this.getOptionValue(e),this.equalityKey)},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return xe(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidOption(o)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidOption(o)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)})},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e,n){var l=this;this.searchValue=(this.searchValue||"")+n;var o=-1,i=!1;return fe(this.searchValue)&&(o=this.visibleOptions.findIndex(function(m){return l.isOptionExactMatched(m)}),o===-1&&(o=this.visibleOptions.findIndex(function(m){return l.isOptionStartsWith(m)})),o!==-1&&(i=!0),o===-1&&this.focusedOptionIndex===-1&&(o=this.findFirstFocusedOptionIndex()),o!==-1&&this.changeFocusedOptionIndex(e,o)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){l.searchValue="",l.searchTimeout=null},500),i},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n],!1))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,o=$e(e.list,'li[id="'.concat(l,'"]'));o?o.scrollIntoView&&o.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1)},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,o,i){l.push({optionGroup:o,group:!0,index:i});var m=n.getOptionGroupChildren(o);return m&&m.forEach(function(c){return l.push(c)}),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Yt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var o=this.options||[],i=[];return o.forEach(function(m){var c=e.getOptionGroupChildren(m),f=c.filter(function(g){return l.includes(g)});f.length>0&&i.push(Nt(Nt({},m),{},ge({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",qi(f))))}),this.flatOptions(i)}return l}return n},hasSelectedOption:function(){return this.$filled},label:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.placeholder||"p-emptylabel"},editableInputValue:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.d_value||""},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},filterResultMessageText:function(){return fe(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}","1"):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},isClearIconVisible:function(){return this.showClear&&this.d_value!=null&&!this.disabled&&!this.loading},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},containerDataP:function(){return se(ge({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return se(ge(ge({placeholder:!this.editable&&this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled,editable:this.editable},this.size,this.size),"empty",!this.editable&&!this.$slots.value&&(this.label==="p-emptylabel"||this.label.length===0)))},dropdownIconDataP:function(){return se(ge({},this.size,this.size))},overlayDataP:function(){return se(ge({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:wt},components:{InputText:Ye,VirtualScroller:$t,Portal:Re,InputIcon:Ft,IconField:zt,TimesIcon:Lt,ChevronDownIcon:Vt,SpinnerIcon:It,SearchIcon:Mt,CheckIcon:St,BlankIcon:dn}},el=["id","data-p"],tl=["name","id","value","placeholder","tabindex","disabled","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","data-p"],nl=["name","id","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","aria-disabled","data-p"],il=["data-p"],ll=["id"],ol=["id"],sl=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onMousedown","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function al(t,e,n,l,o,i){var m=N("SpinnerIcon"),c=N("InputText"),f=N("SearchIcon"),g=N("InputIcon"),w=N("IconField"),I=N("CheckIcon"),E=N("BlankIcon"),U=N("VirtualScroller"),D=N("Portal"),P=je("ripple");return d(),u("div",p({ref:"container",id:t.$id,class:t.cx("root"),onClick:e[12]||(e[12]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[t.editable?(d(),u("input",p({key:0,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,type:"text",class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],value:i.editableInputValue,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,disabled:t.disabled,autocomplete:"off",role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":o.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),onInput:e[3]||(e[3]=function(){return i.onEditableInput&&i.onEditableInput.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),null,16,tl)):(d(),u("span",p({key:1,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel||(i.label==="p-emptylabel"?void 0:i.label),"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":t.$id+"_list","aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,"aria-disabled":t.disabled,onFocus:e[4]||(e[4]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[5]||(e[5]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),[V(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){var O;return[j(z(i.label==="p-emptylabel"?" ":(O=i.label)!==null&&O!==void 0?O:"empty"),1)]})],16,nl)),i.isClearIconVisible?V(t.$slots,"clearicon",{key:2,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(d(),$(de(t.clearIcon?"i":"TimesIcon"),p({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):x("",!0),h("div",p({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?V(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(d(),u("span",p({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(d(),$(m,p({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):V(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(d(),$(de(t.dropdownIcon?"span":"ChevronDownIcon"),p({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(D,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[o.overlayVisible?(d(),u("div",p({key:0,ref:i.overlayRef,class:[t.cx("overlay"),t.panelClass,t.overlayClass],style:[t.panelStyle,t.overlayStyle],onClick:e[10]||(e[10]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[11]||(e[11]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[h("span",p({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[7]||(e[7]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),V(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.filter?(d(),u("div",p({key:0,class:t.cx("header")},t.ptm("header")),[r(w,{unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(c,{ref:"filterInput",type:"text",value:o.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(g,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[V(t.$slots,"filtericon",{},function(){return[t.filterIcon?(d(),u("span",p({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(d(),$(f,nn(p({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["unstyled","pt"]),h("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)],16)):x("",!0),h("div",p({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,p({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),ln({content:v(function(O){var B=O.styleClass,A=O.contentRef,K=O.items,C=O.getItemOptions,re=O.contentStyle,_=O.itemSize;return[h("ul",p({ref:function(F){return i.listRef(F,A)},id:t.$id+"_list",class:[t.cx("list"),B],style:re,role:"listbox"},t.ptm("list")),[(d(!0),u(M,null,oe(K,function(L,F){return d(),u(M,{key:i.getOptionRenderKey(L,i.getOptionIndex(F,C))},[i.isOptionGroup(L)?(d(),u("li",p({key:0,id:t.$id+"_"+i.getOptionIndex(F,C),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[V(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(F,C)},function(){return[h("span",p({class:t.cx("optionGroupLabel")},{ref_for:!0},t.ptm("optionGroupLabel")),z(i.getOptionGroupLabel(L.optionGroup)),17)]})],16,ol)):Ge((d(),u("li",p({key:1,id:t.$id+"_"+i.getOptionIndex(F,C),class:t.cx("option",{option:L,focusedOption:i.getOptionIndex(F,C)}),style:{height:_?_+"px":void 0},role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(F,C)),onMousedown:function(Q){return i.onOptionSelect(Q,L)},onMousemove:function(Q){return i.onOptionMouseMove(Q,i.getOptionIndex(F,C))},onClick:e[8]||(e[8]=on(function(){},["stop"])),"data-p-selected":!t.checkmark&&i.isSelected(L),"data-p-focused":o.focusedOptionIndex===i.getOptionIndex(F,C),"data-p-disabled":i.isOptionDisabled(L)},{ref_for:!0},i.getPTItemOptions(L,C,F,"option")),[t.checkmark?(d(),u(M,{key:0},[i.isSelected(L)?(d(),$(I,p({key:0,class:t.cx("optionCheckIcon")},{ref_for:!0},t.ptm("optionCheckIcon")),null,16,["class"])):(d(),$(E,p({key:1,class:t.cx("optionBlankIcon")},{ref_for:!0},t.ptm("optionBlankIcon")),null,16,["class"]))],64)):x("",!0),V(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(F,C)},function(){return[h("span",p({class:t.cx("optionLabel")},{ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,sl)),[[P]])],64)}),128)),o.filterValue&&(!K||K&&K.length===0)?(d(),u("li",p({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[V(t.$slots,"emptyfilter",{},function(){return[j(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(d(),u("li",p({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[V(t.$slots,"empty",{},function(){return[j(z(i.emptyMessageText),1)]})],16)):x("",!0)],16,ll)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(O){var B=O.options;return[V(t.$slots,"loader",{options:B})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),V(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(d(),u("span",p({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):x("",!0),h("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),h("span",p({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[9]||(e[9]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,il)):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,el)}ne.render=al;var rl=`
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
`,dl={root:function(e){var n=e.instance,l=e.props;return["p-textarea p-component",{"p-filled":n.$filled,"p-textarea-resizable ":l.autoResize,"p-textarea-sm p-inputfield-sm":l.size==="small","p-textarea-lg p-inputfield-lg":l.size==="large","p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-textarea-fluid":n.$fluid}]}},ul=he.extend({name:"textarea",style:rl,classes:dl}),cl={name:"BaseTextarea",extends:it,props:{autoResize:Boolean},style:ul,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function De(t){"@babel/helpers - typeof";return De=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},De(t)}function pl(t,e,n){return(e=hl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function hl(t){var e=fl(t,"string");return De(e)=="symbol"?e:e+""}function fl(t,e){if(De(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(De(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ye={name:"Textarea",extends:cl,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,n=parseInt(e)||0,l=this.$el.scrollHeight,o=!n||l>n,i=n&&l<n;i?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):o&&(this.$el.style.height="".concat(l,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return p(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return se(pl({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},ml=["value","name","disabled","aria-invalid","data-p"];function bl(t,e,n,l,o,i){return d(),u("textarea",p({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":i.dataP,onInput:e[0]||(e[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},i.attrs),null,16,ml)}ye.render=bl;var vl=`
    .p-toggleswitch {
        display: inline-block;
        width: dt('toggleswitch.width');
        height: dt('toggleswitch.height');
    }

    .p-toggleswitch-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border-radius: dt('toggleswitch.border.radius');
    }

    .p-toggleswitch-slider {
        cursor: pointer;
        width: 100%;
        height: 100%;
        border-width: dt('toggleswitch.border.width');
        border-style: solid;
        border-color: dt('toggleswitch.border.color');
        background: dt('toggleswitch.background');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            border-color dt('toggleswitch.transition.duration'),
            outline-color dt('toggleswitch.transition.duration'),
            box-shadow dt('toggleswitch.transition.duration');
        border-radius: dt('toggleswitch.border.radius');
        outline-color: transparent;
        box-shadow: dt('toggleswitch.shadow');
    }

    .p-toggleswitch-handle {
        position: absolute;
        top: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: dt('toggleswitch.handle.background');
        color: dt('toggleswitch.handle.color');
        width: dt('toggleswitch.handle.size');
        height: dt('toggleswitch.handle.size');
        inset-inline-start: dt('toggleswitch.gap');
        margin-block-start: calc(-1 * calc(dt('toggleswitch.handle.size') / 2));
        border-radius: dt('toggleswitch.handle.border.radius');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            inset-inline-start dt('toggleswitch.slide.duration'),
            box-shadow dt('toggleswitch.slide.duration');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.background');
        border-color: dt('toggleswitch.checked.border.color');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.background');
        color: dt('toggleswitch.handle.checked.color');
        inset-inline-start: calc(dt('toggleswitch.width') - calc(dt('toggleswitch.handle.size') + dt('toggleswitch.gap')));
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-slider {
        background: dt('toggleswitch.hover.background');
        border-color: dt('toggleswitch.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.hover.background');
        color: dt('toggleswitch.handle.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.hover.background');
        border-color: dt('toggleswitch.checked.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.hover.background');
        color: dt('toggleswitch.handle.checked.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible) .p-toggleswitch-slider {
        box-shadow: dt('toggleswitch.focus.ring.shadow');
        outline: dt('toggleswitch.focus.ring.width') dt('toggleswitch.focus.ring.style') dt('toggleswitch.focus.ring.color');
        outline-offset: dt('toggleswitch.focus.ring.offset');
    }

    .p-toggleswitch.p-invalid > .p-toggleswitch-slider {
        border-color: dt('toggleswitch.invalid.border.color');
    }

    .p-toggleswitch.p-disabled {
        opacity: 1;
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-slider {
        background: dt('toggleswitch.disabled.background');
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.disabled.background');
    }
`,gl={root:{position:"relative"}},yl={root:function(e){var n=e.instance,l=e.props;return["p-toggleswitch p-component",{"p-toggleswitch-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},input:"p-toggleswitch-input",slider:"p-toggleswitch-slider",handle:"p-toggleswitch-handle"},kl=he.extend({name:"toggleswitch",style:vl,classes:yl,inlineStyles:gl}),wl={name:"BaseToggleSwitch",extends:Xt,props:{trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:kl,provide:function(){return{$pcToggleSwitch:this,$parentInstance:this}}},ee={name:"ToggleSwitch",extends:wl,inheritAttrs:!1,emits:["change","focus","blur"],methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,disabled:this.disabled}})},onChange:function(e){if(!this.disabled&&!this.readonly){var n=this.checked?this.falseValue:this.trueValue;this.writeValue(n,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)}},computed:{checked:function(){return this.d_value===this.trueValue},dataP:function(){return se({checked:this.checked,disabled:this.disabled,invalid:this.$invalid})}}},Ol=["data-p-checked","data-p-disabled","data-p"],xl=["id","checked","tabindex","disabled","readonly","aria-checked","aria-labelledby","aria-label","aria-invalid"],Il=["data-p"],Sl=["data-p"];function Ll(t,e,n,l,o,i){return d(),u("div",p({class:t.cx("root"),style:t.sx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-disabled":t.disabled,"data-p":i.dataP}),[h("input",p({id:t.inputId,type:"checkbox",role:"switch",class:[t.cx("input"),t.inputClass],style:t.inputStyle,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,"aria-checked":i.checked,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,xl),h("div",p({class:t.cx("slider")},i.getPTOptions("slider"),{"data-p":i.dataP}),[h("div",p({class:t.cx("handle")},i.getPTOptions("handle"),{"data-p":i.dataP}),[V(t.$slots,"handle",{checked:i.checked})],16,Sl)],16,Il)],16,Ol)}ee.render=Ll;const Cl={class:"pt-1.5"},Vl={class:"flex items-baseline gap-2 text-ink"},Ml={key:0,class:"tnum text-[13px] text-tally"},zl={key:0,class:"mt-0.5 text-[13px] leading-snug text-ink-3"},Fl={class:"min-w-0"},$l={key:0,class:"mt-1 text-[13px] text-ink-3"},k=lt({__name:"FormField",props:{label:{},hint:{},value:{},stacked:{type:Boolean}},setup(t){return(e,n)=>(d(),u("div",{class:G(t.stacked?"flex flex-col gap-2":"grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1")},[h("div",Cl,[h("div",Vl,[j(z(t.label)+" ",1),t.value!==void 0&&t.value!==null?(d(),u("span",Ml,z(t.value),1)):x("",!0)]),t.hint&&!t.stacked?(d(),u("div",zl,z(t.hint),1)):x("",!0)]),h("div",Fl,[V(e.$slots,"default"),t.hint&&t.stacked?(d(),u("div",$l,z(t.hint),1)):x("",!0)])],2))}}),Tl={class:"relative aspect-video overflow-hidden rounded-md bg-black"},Pl=["src"],Al={key:1,class:"absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-ink-2"},El={key:2,class:"absolute inset-0 flex items-center justify-center p-6 text-center text-ink-2"},Dl={class:"mt-3 flex items-center justify-between gap-4"},Bl={class:"text-[13px] text-ink-3"},Hl={class:"flex shrink-0 gap-2"},Kl=lt({__name:"FxPreview",props:Te({target:{},channelId:{},projectId:{},settings:{type:Function}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:["update:visible"],setup(t){const e=Ct(t,"visible"),n=t,l=R(""),o=R(!1),i=R(""),m=R(!0),c=R(0),f=R(0);async function g(){if(n.target){o.value=!0,i.value="";try{const I=await ue.post("/api/fx-preview",{kind:n.target.kind,effect:n.target.effect,channel_id:n.channelId??null,project_id:n.projectId??null,pick:f.value,settings:n.settings()});l.value=I.url,m.value=I.own_images,c.value=I.images}catch(I){i.value=I.message}finally{o.value=!1}}}function w(){f.value+=n.target?.kind==="transition"?2:1,g()}return Ze(()=>[e.value,n.target],([I])=>{I&&(l.value="",g())}),(I,E)=>(d(),$(b(sn),{visible:e.value,"onUpdate:visible":E[0]||(E[0]=U=>e.value=U),modal:"",header:t.target?.title??"Превью",style:{width:"min(820px, 96vw)"}},{default:v(()=>[h("div",Tl,[l.value?(d(),u("video",{key:l.value,src:l.value,autoplay:"",loop:"",muted:"",playsinline:"",class:"h-full w-full"},null,8,Pl)):x("",!0),o.value?(d(),u("div",Al,[...E[1]||(E[1]=[h("i",{class:"pi pi-spin pi-spinner"},null,-1),j("Рендер превью… ",-1)])])):i.value?(d(),u("div",El,z(i.value),1)):x("",!0)]),h("div",Dl,[h("p",Bl,[m.value?(d(),u(M,{key:0},[j("На картинке канала, с текущими настройками (ещё не сохранёнными).")],64)):(d(),u(M,{key:1},[j("В канале пока нет картинок — показано на условной заглушке.")],64))]),h("div",Hl,[m.value&&c.value>1?(d(),$(b(me),{key:0,label:"Другая картинка",icon:"pi pi-images",severity:"secondary",size:"small",disabled:o.value,onClick:w},null,8,["disabled"])):x("",!0),r(b(me),{label:"Обновить",icon:"pi pi-refresh",severity:"secondary",size:"small",disabled:o.value,onClick:g},null,8,["disabled"])])])]),_:1},8,["visible","header"]))}}),Ul={class:"grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]"},Rl={class:"flex min-h-0 flex-col border-r border-line-soft"},jl={class:"flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3"},Gl={class:"min-h-0 flex-1 overflow-y-auto"},Nl=["onClick"],_l=["aria-label","onClick"],ql={class:"min-w-0 flex-1"},Wl={class:"block truncate font-medium"},Zl={class:"block truncate text-[13px] text-ink-3"},Xl={key:0,class:"pi pi-check text-tally"},Yl={class:"p-4 text-center"},Jl={key:1,class:"text-ink-3"},Ql={key:2,class:"text-ink-3"},eo={class:"flex min-h-0 flex-col overflow-y-auto p-5"},to={class:"font-display text-lg"},no={key:0,class:"mt-1 line-clamp-4 text-[13px] text-ink-3"},io={class:"mt-5 flex flex-col gap-4"},lo={key:1,class:"m-auto max-w-60 text-center text-ink-3"},oo=lt({__name:"VoicePicker",props:Te({language:{}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:Te(["created"],["update:visible"]),setup(t,{emit:e}){const n=Ct(t,"visible"),l=t,o=e,i=tt(),m=_e(),c=R("elevenlabs"),f=R(""),g=R(null),w=R(l.language??null),I=R([]),E=R(0),U=R(!1),D=R(!1),P=R(null),O=R(null),B=new Audio;B.onended=()=>O.value=null;const A=R({name:"",model_id:"eleven_multilingual_v2",stability:.5,similarity_boost:.75,style:0,speed:1}),K=R(!1),C=[{id:"eleven_multilingual_v2",name:"Multilingual v2 — стабильный, лучший для длинных текстов"},{id:"eleven_v3",name:"v3 — самый выразительный, больше языков"},{id:"eleven_turbo_v2_5",name:"Turbo v2.5 — быстрый и дешевле"},{id:"eleven_flash_v2_5",name:"Flash v2.5 — самый быстрый"}],re=Y(()=>[{code:null,name:"Любой язык"},...i.meta?.languages??[]]);async function _(H=!0){D.value=!0,H&&(E.value=0);try{const T=new URLSearchParams({source:c.value,search:f.value,language:w.value??"",gender:g.value??"",page:String(E.value)}),S=await ue.get(`/api/lumean/voices?${T}`);I.value=H?S.voices:[...I.value,...S.voices],U.value=S.has_more}catch(T){m.error(T,"Каталог голосов недоступен")}finally{D.value=!1}}function L(){E.value+=1,_(!1)}function F(H){if(H.preview_url){if(O.value===H.voice_id){B.pause(),O.value=null;return}B.src=H.preview_url,B.play(),O.value=H.voice_id}}function Z(H){P.value=H;const T=w.value?` ${w.value.toUpperCase()}`:"";A.value.name=`${H.name}${T}`}async function Q(){if(P.value){K.value=!0;try{const H=await ue.post("/api/lumean/templates",{...A.value,voice_id:P.value.voice_id,language_code:w.value||null});m.ok("Голос добавлен в Lumean",H.name),o("created",H),n.value=!1}catch(H){m.error(H)}finally{K.value=!1}}}let W;return Ze([f],()=>{window.clearTimeout(W),W=window.setTimeout(()=>_(),400)}),Ze([c,g,w],()=>_()),Ze(n,H=>{H&&!I.value.length&&_(),H||B.pause()}),Ln(()=>B.pause()),(H,T)=>(d(),$(b(sn),{visible:n.value,"onUpdate:visible":T[10]||(T[10]=S=>n.value=S),modal:"",header:"Подбор голоса",style:{width:"min(1100px, 96vw)"},"content-style":{padding:0}},{default:v(()=>[h("div",Ul,[h("div",Rl,[h("div",jl,[r(b(be),{modelValue:c.value,"onUpdate:modelValue":T[0]||(T[0]=S=>c.value=S),options:[{v:"elevenlabs",l:"ElevenLabs"},{v:"lumean",l:"Lumean"}],"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),r(b(Ye),{modelValue:f.value,"onUpdate:modelValue":T[1]||(T[1]=S=>f.value=S),placeholder:"Поиск: тембр, стиль, имя",size:"small",class:"min-w-48 flex-1"},null,8,["modelValue"]),r(b(ne),{modelValue:w.value,"onUpdate:modelValue":T[2]||(T[2]=S=>w.value=S),options:re.value,"option-value":"code","option-label":"name",size:"small",class:"w-40"},null,8,["modelValue","options"]),r(b(ne),{modelValue:g.value,"onUpdate:modelValue":T[3]||(T[3]=S=>g.value=S),options:[{v:null,l:"Любой пол"},{v:"male",l:"Мужской"},{v:"female",l:"Женский"}],"option-value":"v","option-label":"l",size:"small",class:"w-36"},null,8,["modelValue"])]),h("div",Gl,[(d(!0),u(M,null,oe(I.value,S=>(d(),u("button",{key:S.voice_id,class:G(["flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised",P.value?.voice_id===S.voice_id?"bg-raised":""]),onClick:ie=>Z(S)},[h("span",{role:"button","aria-label":O.value===S.voice_id?"Остановить":"Прослушать",class:G(["flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",[O.value===S.voice_id?"border-tally bg-tally text-tally-ink":"border-line text-ink-2 hover:border-ink-3",S.preview_url?"":"opacity-30"]]),onClick:on(ie=>F(S),["stop"])},[h("i",{class:G([["pi",O.value===S.voice_id?"pi-pause":"pi-play"],"text-xs"])},null,2)],10,_l),h("span",ql,[h("span",Wl,z(S.name),1),h("span",Zl,z([S.gender==="male"?"мужской":S.gender==="female"?"женский":"",S.age,S.accent,S.use_case,S.language].filter(Boolean).join(", ")||S.description),1)]),P.value?.voice_id===S.voice_id?(d(),u("i",Xl)):x("",!0)],10,Nl))),128)),h("div",Yl,[U.value?(d(),$(b(me),{key:0,label:"Показать ещё",text:"",severity:"secondary",loading:D.value,onClick:L},null,8,["loading"])):D.value?(d(),u("span",Jl,"Загрузка…")):I.value.length?x("",!0):(d(),u("span",Ql,"Ничего не найдено. Измените фильтры."))])])]),h("div",eo,[P.value?(d(),u(M,{key:0},[h("div",to,z(P.value.name),1),P.value.description?(d(),u("p",no,z(P.value.description),1)):x("",!0),h("div",io,[r(k,{label:"Название шаблона",stacked:""},{default:v(()=>[r(b(Ye),{modelValue:A.value.name,"onUpdate:modelValue":T[4]||(T[4]=S=>A.value.name=S),class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель",stacked:""},{default:v(()=>[r(b(ne),{modelValue:A.value.model_id,"onUpdate:modelValue":T[5]||(T[5]=S=>A.value.model_id=S),options:C,"option-value":"id","option-label":"name",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стабильность",value:A.value.stability.toFixed(2),hint:"Выше — ровнее, ниже — эмоциональнее",stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.stability,"onUpdate:modelValue":T[6]||(T[6]=S=>A.value.stability=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Похожесть на оригинал",value:A.value.similarity_boost.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.similarity_boost,"onUpdate:modelValue":T[7]||(T[7]=S=>A.value.similarity_boost=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Выразительность",value:A.value.style.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.style,"onUpdate:modelValue":T[8]||(T[8]=S=>A.value.style=S),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Скорость речи",value:A.value.speed.toFixed(2),stacked:""},{default:v(()=>[r(b(le),{modelValue:A.value.speed,"onUpdate:modelValue":T[9]||(T[9]=S=>A.value.speed=S),min:.7,max:1.2,step:.01},null,8,["modelValue"])]),_:1},8,["value"])]),r(b(me),{class:"mt-6",label:"Создать голос",loading:K.value,disabled:!A.value.name.trim(),onClick:Q},null,8,["loading","disabled"])],64)):(d(),u("div",lo," Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом. "))])])]),_:1},8,["visible"]))}}),so={class:"grid grid-cols-[13rem_minmax(0,1fr)] gap-8"},ao={class:"sticky top-4 flex h-fit flex-col gap-0.5"},ro=["onClick"],uo={class:"flex min-w-0 flex-col gap-7 pb-10"},co={key:0,class:"rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad"},po={class:"flex gap-2"},ho={class:"flex gap-2"},fo={class:"flex gap-2"},mo={class:"flex items-center gap-4 pt-1.5"},bo={class:"mt-2 text-[13px] text-ink-3"},vo={class:"mt-2 text-[13px] text-ink-3"},go={class:"flex items-center gap-3"},yo={key:0,class:"mt-4 flex items-center gap-3"},ko={class:"mt-2 text-[13px] leading-snug text-ink-3"},wo={class:"grid grid-cols-1 gap-2 xl:grid-cols-2"},Oo=["onClick"],xo={class:"flex items-baseline justify-between gap-2"},Io={class:"font-medium"},So={class:"tnum shrink-0 text-[13px] text-ink-3"},Lo={class:"mt-0.5 block text-[13px] text-ink-3"},Co={class:"flex items-center gap-3 pt-1"},Vo={class:"text-[13px] text-ink-3"},Mo={key:0,class:"mt-3 flex flex-wrap gap-2"},zo=["src"],Fo=["onClick"],$o={key:0,class:"flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"},To={key:0,class:"mt-3 flex flex-col gap-2"},Po={class:"flex flex-col gap-1.5"},Ao={key:0,class:"text-[13px] text-tally"},Eo={key:1,class:"text-[13px] text-ink-3"},Do={class:"flex gap-3"},Bo={class:"flex flex-wrap gap-2"},Ho=["onClick"],Ko=["onClick"],Uo={class:"flex flex-wrap gap-2"},Ro=["onClick"],jo=["onClick"],Go={class:"flex items-center gap-3"},No={class:"flex items-center gap-3"},_o={class:"relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]",style:{"container-type":"size"}},qo={class:"flex flex-wrap items-center gap-3"},Wo={class:"flex items-center gap-2"},Zo={class:"flex items-center gap-2"},Xo={class:"flex flex-wrap items-center gap-5"},Yo={class:"flex items-center gap-2"},Jo={key:0,class:"flex items-center gap-2"},Qo={key:1,class:"flex items-center gap-2"},es={key:2,class:"flex items-center gap-2"},ts={class:"flex items-center gap-3"},ns={class:"flex items-center gap-3"},is={class:"flex flex-wrap items-center gap-3"},wa=lt({__name:"SettingsForm",props:Te({mode:{},channelId:{},projectId:{},references:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:Te(["referencesChanged"],["update:modelValue"]),setup(t,{emit:e}){const n=Ct(t,"modelValue"),l=t,o=e,i=tt(),m=_e(),c=[{id:"voice",label:"Озвучка",icon:"pi-microphone"},{id:"scenes",label:"Сцены",icon:"pi-th-large"},{id:"images",label:"Изображения",icon:"pi-image"},{id:"llm",label:"Тексты и промпты",icon:"pi-sparkles"},{id:"render",label:"Анимация и видео",icon:"pi-video"},{id:"atmosphere",label:"Атмосфера",icon:"pi-sun"},{id:"subtitles",label:"Субтитры",icon:"pi-align-center"},{id:"unique",label:"Уникализация",icon:"pi-shield"},{id:"publish",label:"Публикация",icon:"pi-youtube"}],f=R("voice"),g=R(!1),w=R(null);function I(y,s,q){w.value={kind:y,effect:s,title:q},g.value=!0}function E(){return JSON.parse(JSON.stringify({...n.value.render,atmosphere:n.value.atmosphere}))}const U=[["dust","Пылинки в воздухе","Мелкие пылинки и размытые «боке» медленно плывут по кадру — как в луче света"],["breathing","Дыхание","Герой едва заметно «дышит». В 3D-параллаксе дышит только передний план, в остальных сценах — весь кадр от нижнего края"],["light_pulse","Пульсация света","Светлые места кадра медленно мягко светятся и гаснут"],["vignette_breathing","Дыхание виньетки","Затемнение по краям медленно сгущается и отпускает"],["grain_boil","Кипящее зерно","Крупное зерно, как фактура бумаги или плёнки, сменяется рывками, как в рисованной анимации. Заменяет обычное зерно уникализации"],["line_boil","Дрожание линий","Контуры чуть дрожат, будто каждый кадр перерисован от руки. Только для рисованных стилей: на фотореализме выглядит как брак"]],D=R([]),P=R(""),O=R(null),B=R(null);async function A(){try{D.value=await ue.get("/api/lumean/templates"),P.value=""}catch(y){P.value=y.message}}const K=Y(()=>D.value.map(y=>({id:y.id,label:`${y.name}${y.model_id?` · ${y.model_id.replace("eleven_","")}`:""}`}))),C=Y(()=>Object.keys(n.value.voice.templates)),re=Y(()=>(i.meta?.languages??[]).filter(y=>!(y.code in n.value.voice.templates)));function _(){B.value&&(n.value.voice.templates={...n.value.voice.templates,[B.value]:""},B.value=null)}function L(y){const s={...n.value.voice.templates};delete s[y],n.value.voice.templates=s,n.value.voice.master_language===y&&(n.value.voice.master_language=null)}const F=Y(()=>{const y=i.meta?.languages??[];return C.value.length?y.filter(s=>C.value.includes(s.code)):y});async function Z(y){await A(),O.value==="__default"?n.value.voice.default_template_id=y.id:O.value&&(n.value.voice.templates={...n.value.voice.templates,[O.value]:y.id})}const Q=Y({get:()=>n.value.voice.speed!=null,set:y=>n.value.voice.speed=y?1:null});function W(y){const s=n.value.scenes,q=Math.min(y,s.intro_seconds);return Math.round(q/((s.intro_min_duration+s.intro_max_duration)/2)+Math.max(0,y-q)/((s.min_duration+s.max_duration)/2))}const H=Y(()=>`Пример: ${[10,30,60].map(s=>{const q=W(s*60),a=Math.min(q,n.value.scenes.max_images);return`${s} мин → ${a}${q>a?` (сцена ≈ ${Math.round(s*60/a)} с)`:""}`}).join(", ")}`),T=Y(()=>i.meta?.image_operations??[]),S=Y(()=>T.value.find(y=>y.id===n.value.images.operation)),ie=Y(()=>i.status?.fastgen?.budget??500);function ce(y){const s=T.value.find(q=>q.id===y);return(s?.credits??4)*(n.value.images.upscale_2x&&s?.upscale?2:1)}const we=Y(()=>Math.floor(ie.value/ce(n.value.images.operation))),Se=Y(()=>n.value.images.model_strategy!=="single"),Le=[{v:"single",l:"Одна модель"},{v:"intro",l:"Начало качественнее"},{v:"budget",l:"По бюджету"}],qe=Y(()=>({single:"Все сцены генерируются одной моделью.",intro:"Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.",budget:"Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен."})[n.value.images.model_strategy]),Tt=y=>!!T.value.find(s=>s.id===y)?.refs,Pt=y=>T.value.find(s=>s.id===y)?.name??y??"",fn=Y(()=>Se.value?[n.value.images.operation,n.value.images.economy_operation]:[n.value.images.operation]),st=Y(()=>[n.value.images.operation,n.value.images.economy_operation].find(Tt)??null),mn=Y(()=>!!st.value),At=Y(()=>{const y=fn.value.filter(s=>!Tt(s));return y.length&&st.value?y.map(Pt).join(", "):""}),Et=Y(()=>T.value.map(y=>({...y,label:`${y.name} · ${y.credits} кр.`}))),bn=Y(()=>{const s=n.value.images.budget_credits||ie.value,q=ce(n.value.images.operation),a=ce(n.value.images.economy_operation);if(q<=a)return"все 100 сцен — качественной моделью";const X=Math.max(0,Math.min(100,Math.floor((s-100*a)/(q-a))));return X>=100?"все 100 сцен — качественной моделью":`${X} качественных и ${100-X} дешёвых`}),at=R(!1);async function vn(y){const s=y.target.files;if(!(!s?.length||!l.channelId)){at.value=!0;try{for(const q of Array.from(s))await ue.upload(`/api/channels/${l.channelId}/references`,q);o("referencesChanged")}catch(q){m.error(q)}finally{at.value=!1,y.target.value=""}}}async function gn(y){await ue.post(`/api/channels/${l.channelId}/references/delete`,{path:y}),o("referencesChanged")}const rt=R([]);async function yn(){try{rt.value=await ue.get("/api/fastgen/chat-models")}catch{rt.value=[{id:n.value.llm.model,name:n.value.llm.model,context:0}]}}function Dt(y,s){return y.includes(s)?y.filter(q=>q!==s):[...y,s]}const dt=R([]),kn=Y(()=>{const y=n.value.subtitles,s=y.size/1080*100,q=y.style==="box"?0:y.outline/1080*100*1.2;return{fontFamily:`"${y.font}", sans-serif`,fontSize:`${s}cqh`,fontWeight:y.bold?700:400,textTransform:y.uppercase?"uppercase":"none",color:y.primary_color,WebkitTextStroke:q?`${q}cqh ${y.outline_color}`:void 0,paintOrder:"stroke fill",background:y.style==="box"?`color-mix(in srgb, ${y.box_color} ${y.box_opacity*100}%, transparent)`:void 0,padding:y.style==="box"?"0.15em 0.4em":void 0,textShadow:y.shadow?`0 ${y.shadow*.15}cqh ${y.shadow*.3}cqh rgb(0 0 0 / .6)`:void 0}}),wn=Y(()=>{const y=`${n.value.subtitles.margin_v/1080*100}%`;return n.value.subtitles.position==="top"?{top:y}:n.value.subtitles.position==="middle"?{top:"45%"}:{bottom:y}});function Ce(y){return y.startsWith("#")?y:`#${y}`}return Cn(async()=>{A(),yn(),dt.value=await ue.get("/api/fonts").catch(()=>[])}),(y,s)=>{const q=je("tooltip");return d(),u("div",so,[h("nav",ao,[(d(),u(M,null,oe(c,a=>h("button",{key:a.id,class:G(["flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised",f.value===a.id?"bg-raised text-ink":"text-ink-2"]),onClick:X=>f.value=a.id},[h("i",{class:G([["pi",a.icon],"w-4 text-[14px]"])},null,2),j(z(a.label),1)],10,ro)),64))]),h("div",uo,[f.value==="voice"?(d(),u(M,{key:0},[s[80]||(s[80]=h("p",{class:"text-ink-3"}," Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию. ",-1)),P.value?(d(),u("div",co," Не удалось загрузить голоса Lumean: "+z(P.value),1)):x("",!0),t.mode==="channel"?(d(),$(k,{key:1,label:"Основной язык",hint:"На нём вставляется сценарий новых проектов, остальные языки переводятся с него"},{default:v(()=>[r(b(ne),{modelValue:n.value.voice.master_language,"onUpdate:modelValue":s[0]||(s[0]=a=>n.value.voice.master_language=a),options:F.value,"option-value":"code","option-label":"name",filter:"","show-clear":"",placeholder:"Первый язык из списка",class:"w-60"},null,8,["modelValue","options"])]),_:1})):x("",!0),r(k,{label:"Голос по умолчанию",hint:"Для языков без отдельного голоса"},{default:v(()=>[h("div",po,[r(b(ne),{modelValue:n.value.voice.default_template_id,"onUpdate:modelValue":s[1]||(s[1]=a=>n.value.voice.default_template_id=a),options:K.value,"option-value":"id","option-label":"label",filter:"","show-clear":"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","options"]),r(b(me),{icon:"pi pi-search",label:"Подобрать",severity:"secondary",outlined:"",onClick:s[2]||(s[2]=a=>O.value="__default")})])]),_:1}),(d(!0),u(M,null,oe(C.value,a=>(d(),$(k,{key:a,label:b(i).langLabel(a)},{default:v(()=>[h("div",ho,[r(b(ne),{modelValue:n.value.voice.templates[a],"onUpdate:modelValue":X=>n.value.voice.templates[a]=X,options:K.value,"option-value":"id","option-label":"label",filter:"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","onUpdate:modelValue","options"]),Ge(r(b(me),{icon:"pi pi-search",severity:"secondary",outlined:"","aria-label":"Подобрать голос",onClick:X=>O.value=a},null,8,["onClick"]),[[q,"Подобрать голос"]]),r(b(me),{icon:"pi pi-trash",severity:"secondary",text:"","aria-label":"Убрать язык",onClick:X=>L(a)},null,8,["onClick"])])]),_:2},1032,["label"]))),128)),r(k,{label:"Отдельный голос для языка"},{default:v(()=>[h("div",fo,[r(b(ne),{modelValue:B.value,"onUpdate:modelValue":s[3]||(s[3]=a=>B.value=a),options:re.value,"option-value":"code","option-label":"name",filter:"",placeholder:"Язык",class:"w-60"},null,8,["modelValue","options"]),r(b(me),{label:"Добавить",severity:"secondary",outlined:"",disabled:!B.value,onClick:_},null,8,["disabled"])])]),_:1}),r(k,{label:"Своя скорость речи",hint:"Иначе используется скорость из шаблона",value:n.value.voice.speed?.toFixed(2)},{default:v(()=>[h("div",mo,[r(b(ee),{modelValue:Q.value,"onUpdate:modelValue":s[4]||(s[4]=a=>Q.value=a)},null,8,["modelValue"]),n.value.voice.speed!=null?(d(),$(b(le),{key:0,modelValue:n.value.voice.speed,"onUpdate:modelValue":s[5]||(s[5]=a=>n.value.voice.speed=a),min:.7,max:1.2,step:.01,class:"flex-1"},null,8,["modelValue"])):x("",!0)])]),_:1},8,["value"]),r(k,{label:"Озвучивать по абзацам",hint:"Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже"},{default:v(()=>[r(b(ee),{modelValue:n.value.voice.paragraph_mode,"onUpdate:modelValue":s[6]||(s[6]=a=>n.value.voice.paragraph_mode=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(oo,{visible:O.value!==null,language:O.value&&O.value!=="__default"?O.value:void 0,"onUpdate:visible":s[7]||(s[7]=a=>!a&&(O.value=null)),onCreated:Z},null,8,["visible","language"])],64)):f.value==="scenes"?(d(),u(M,{key:1},[r(k,{label:"Способ разбивки"},{default:v(()=>[r(b(be),{modelValue:n.value.scenes.mode,"onUpdate:modelValue":s[8]||(s[8]=a=>n.value.scenes.mode=a),options:[{v:"smart",l:"По смыслу (LLM)"},{v:"auto",l:"По предложениям"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),h("p",bo,z(n.value.scenes.mode==="smart"?"Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.":"Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности."),1)]),_:1}),r(k,{label:"Чем ограничить"},{default:v(()=>[r(b(be),{modelValue:n.value.scenes.limit_mode,"onUpdate:modelValue":s[9]||(s[9]=a=>n.value.scenes.limit_mode=a),options:[{v:"duration",l:"Длительностью сцен"},{v:"count",l:"Количеством картинок"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),h("p",vo,z(n.value.scenes.limit_mode==="count"?"Не больше заданного числа картинок на видео. Если с длительностью ниже картинок получится больше, сцены равномерно удлинятся.":"Сцены держатся в заданных секундах, число картинок зависит от длины видео."),1)]),_:1}),n.value.scenes.limit_mode==="count"?(d(),$(k,{key:0,label:"Картинок на видео",hint:`Не больше этого числа на одно видео (на каждую языковую версию со своими картинками). ${H.value}`},{default:v(()=>[r(b(te),{modelValue:n.value.scenes.max_images,"onUpdate:modelValue":s[10]||(s[10]=a=>n.value.scenes.max_images=a),min:10,max:5e3,step:10,"show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"])):x("",!0),r(k,{label:n.value.scenes.limit_mode==="count"?"Длительность сцены, если лимит не мешает":"Длительность сцены",hint:"Сколько секунд держится одна картинка",value:`${n.value.scenes.min_duration}–${n.value.scenes.max_duration} с`},{default:v(()=>[h("div",go,[r(b(te),{modelValue:n.value.scenes.min_duration,"onUpdate:modelValue":s[11]||(s[11]=a=>n.value.scenes.min_duration=a),min:1,max:n.value.scenes.max_duration,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","max"]),s[81]||(s[81]=h("span",{class:"text-ink-3"},"до",-1)),r(b(te),{modelValue:n.value.scenes.max_duration,"onUpdate:modelValue":s[12]||(s[12]=a=>n.value.scenes.max_duration=a),min:n.value.scenes.min_duration,max:60,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","min"])])]),_:1},8,["label","value"]),r(k,{label:"Быстрое начало",hint:"В первые секунды картинки меняются чаще — это удерживает зрителя",value:`${n.value.scenes.intro_seconds} с`},{default:v(()=>[r(b(le),{modelValue:n.value.scenes.intro_seconds,"onUpdate:modelValue":s[13]||(s[13]=a=>n.value.scenes.intro_seconds=a),min:0,max:180,step:5,class:"mt-3"},null,8,["modelValue"]),n.value.scenes.intro_seconds>0?(d(),u("div",yo,[s[82]||(s[82]=h("span",{class:"text-ink-3"},"Сцены в начале",-1)),r(b(te),{modelValue:n.value.scenes.intro_min_duration,"onUpdate:modelValue":s[14]||(s[14]=a=>n.value.scenes.intro_min_duration=a),min:1,max:n.value.scenes.intro_max_duration,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","max"]),s[83]||(s[83]=h("span",{class:"text-ink-3"},"до",-1)),r(b(te),{modelValue:n.value.scenes.intro_max_duration,"onUpdate:modelValue":s[15]||(s[15]=a=>n.value.scenes.intro_max_duration=a),min:n.value.scenes.intro_min_duration,max:30,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","min"])])):x("",!0)]),_:1},8,["value"])],64)):f.value==="images"?(d(),u(M,{key:2},[r(k,{label:"Распределение моделей"},{default:v(()=>[r(b(be),{modelValue:n.value.images.model_strategy,"onUpdate:modelValue":s[16]||(s[16]=a=>n.value.images.model_strategy=a),options:Le,"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),h("p",ko,z(qe.value),1)]),_:1}),r(k,{label:Se.value?"Качественная модель":"Модель",hint:`≈ ${we.value} картинок в час на вашем тарифе`},{default:v(()=>[h("div",wo,[(d(!0),u(M,null,oe(T.value,a=>(d(),u("button",{key:a.id,class:G(["rounded-md border px-3.5 py-2.5 text-left transition-colors",n.value.images.operation===a.id?"border-tally bg-tally/10":"border-line hover:border-ink-3"]),onClick:X=>n.value.images.operation=a.id},[h("span",xo,[h("span",Io,z(a.name),1),h("span",So,z(a.credits)+" кр.",1)]),h("span",Lo,z(a.note),1)],10,Oo))),128))])]),_:1},8,["label","hint"]),Se.value?(d(),u(M,{key:0},[r(k,{label:"Дешёвая модель",hint:`Для остальных сцен · ≈ ${Math.floor(ie.value/ce(n.value.images.economy_operation))} картинок в час`},{default:v(()=>[r(b(ne),{modelValue:n.value.images.economy_operation,"onUpdate:modelValue":s[17]||(s[17]=a=>n.value.images.economy_operation=a),options:Et.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),_:1},8,["hint"]),n.value.images.model_strategy==="intro"?(d(),$(k,{key:0,label:"Качественная модель первые",hint:"Минут от начала каждого видео"},{default:v(()=>[r(b(te),{modelValue:n.value.images.premium_minutes,"onUpdate:modelValue":s[18]||(s[18]=a=>n.value.images.premium_minutes=a),min:.5,max:60,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" мин","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1})):(d(),$(k,{key:1,label:"Бюджет на проект",hint:`Кредитов на все картинки проекта. 0 — один час тарифа (${ie.value} кр.). Для 10-минутного видео: ${bn.value}`},{default:v(()=>[r(b(te),{modelValue:n.value.images.budget_credits,"onUpdate:modelValue":s[19]||(s[19]=a=>n.value.images.budget_credits=a),min:0,step:50,suffix:" кр.","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"]))],64)):x("",!0),S.value?.upscale?(d(),$(k,{key:1,label:"Увеличение 2×",hint:"Чётче при зуме и в 1440p/4K, но вдвое дороже"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.upscale_2x,"onUpdate:modelValue":s[20]||(s[20]=a=>n.value.images.upscale_2x=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):x("",!0),r(k,{label:"Стиль канала",hint:"Добавляется к каждому промпту: техника, свет, цвет, настроение"},{default:v(()=>[r(b(ye),{modelValue:n.value.images.style_prompt,"onUpdate:modelValue":s[21]||(s[21]=a=>n.value.images.style_prompt=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Чего не должно быть",hint:"Перечислите через запятую"},{default:v(()=>[r(b(ye),{modelValue:n.value.images.avoid,"onUpdate:modelValue":s[22]||(s[22]=a=>n.value.images.avoid=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Референсы стиля",hint:t.mode==="channel"?"Примеры картинок в нужном стиле — отправляются вместе с каждым запросом":"Задаются в настройках канала"},{default:v(()=>[h("div",Co,[r(b(ee),{modelValue:n.value.images.use_references,"onUpdate:modelValue":s[23]||(s[23]=a=>n.value.images.use_references=a),disabled:!S.value?.refs},null,8,["modelValue","disabled"]),h("span",Vo,z(S.value?.refs?"Использовать референсы":"Эта модель не принимает референсы"),1)]),t.references?.length||t.mode==="channel"?(d(),u("div",Mo,[(d(!0),u(M,null,oe(t.references,a=>(d(),u("div",{key:a.path,class:"group relative h-20 w-32 overflow-hidden rounded-md border border-line"},[h("img",{src:a.url,alt:"Референс стиля",class:"h-full w-full object-cover"},null,8,zo),t.mode==="channel"?(d(),u("button",{key:0,class:"absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex","aria-label":"Удалить референс",onClick:X=>gn(a.path)},[...s[84]||(s[84]=[h("i",{class:"pi pi-times text-xs"},null,-1)])],8,Fo)):x("",!0)]))),128)),t.mode==="channel"?(d(),u("label",$o,[h("i",{class:G(["pi",at.value?"pi-spin pi-spinner":"pi-plus"])},null,2),s[85]||(s[85]=j("Добавить ",-1)),h("input",{type:"file",accept:"image/*",multiple:"",class:"hidden",onChange:vn},null,32)])):x("",!0)])):x("",!0)]),_:1},8,["hint"]),r(k,{label:"Референсы персонажей",hint:"Повторяющиеся герои получают портрет-образец, который отправляется со всеми сценами, где они есть: лицо, причёска и одежда не меняются от кадра к кадру"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.character_refs,"onUpdate:modelValue":s[24]||(s[24]=a=>n.value.images.character_refs=a),class:"mt-1.5"},null,8,["modelValue"]),n.value.images.character_refs?(d(),u("div",To,[h("label",Po,[s[86]||(s[86]=h("span",{class:"text-[13px] text-ink-2"},"Модель для портретов",-1)),r(b(ne),{modelValue:n.value.images.character_operation,"onUpdate:modelValue":s[25]||(s[25]=a=>n.value.images.character_operation=a),options:Et.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),mn.value?At.value?(d(),u("p",Eo,z(At.value)+" не принимает референсы — сцены с персонажами сделает "+z(Pt(st.value))+". ",1)):x("",!0):(d(),u("p",Ao," Ни одна из выбранных моделей не принимает референсы — портреты не будут учитываться. Выберите, например, Nano Banana 2. "))])):x("",!0)]),_:1}),r(k,{label:"Водяные знаки",hint:"Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется"},{default:v(()=>[r(b(ne),{modelValue:n.value.images.watermark_fix,"onUpdate:modelValue":s[26]||(s[26]=a=>n.value.images.watermark_fix=a),options:[{v:"auto",l:"Удалять автоматически"},{v:"crop",l:"Обрезать угол"},{v:"none",l:"Не трогать"}],"option-value":"v","option-label":"l",class:"w-64"},null,8,["modelValue"])]),_:1}),r(k,{label:"Исправлять отклонённые промпты",hint:"Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит"},{default:v(()=>[r(b(ee),{modelValue:n.value.images.auto_fix_rejected,"onUpdate:modelValue":s[27]||(s[27]=a=>n.value.images.auto_fix_rejected=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Попыток на картинку"},{default:v(()=>[r(b(te),{modelValue:n.value.images.max_attempts,"onUpdate:modelValue":s[28]||(s[28]=a=>n.value.images.max_attempts=a),min:1,max:6,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="llm"?(d(),u(M,{key:3},[r(k,{label:"Модель",hint:"Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком"},{default:v(()=>[r(b(ne),{modelValue:n.value.llm.model,"onUpdate:modelValue":s[29]||(s[29]=a=>n.value.llm.model=a),options:rt.value,"option-value":"id","option-label":"name",filter:"",class:"w-80"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Тематика канала",hint:"О чём канал и для кого — помогает точнее подбирать образы и названия"},{default:v(()=>[r(b(ye),{modelValue:n.value.llm.niche,"onUpdate:modelValue":s[30]||(s[30]=a=>n.value.llm.niche=a),"auto-resize":"",rows:"2",class:"w-full",placeholder:"Например: психология отношений для женщин 30–50 лет"},null,8,["modelValue"])]),_:1}),r(k,{label:"Указания для промптов",hint:"Постоянные правила для картинок канала"},{default:v(()=>[r(b(ye),{modelValue:n.value.llm.prompt_instructions,"onUpdate:modelValue":s[31]||(s[31]=a=>n.value.llm.prompt_instructions=a),"auto-resize":"",rows:"3",class:"w-full",placeholder:"Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"},null,8,["modelValue"])]),_:1}),r(k,{label:"Креативность",value:n.value.llm.temperature.toFixed(1),hint:"Выше — разнообразнее образы, ниже — точнее по тексту"},{default:v(()=>[r(b(le),{modelValue:n.value.llm.temperature,"onUpdate:modelValue":s[32]||(s[32]=a=>n.value.llm.temperature=a),min:0,max:1.2,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):f.value==="render"?(d(),u(M,{key:4},[r(k,{label:"Разрешение и частота"},{default:v(()=>[h("div",Do,[r(b(ne),{modelValue:n.value.render.resolution,"onUpdate:modelValue":s[33]||(s[33]=a=>n.value.render.resolution=a),options:[{v:"1080p",l:"1920×1080 (Full HD)"},{v:"1440p",l:"2560×1440 (2K)"},{v:"2160p",l:"3840×2160 (4K)"}],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue"]),r(b(ne),{modelValue:n.value.render.fps,"onUpdate:modelValue":s[34]||(s[34]=a=>n.value.render.fps=a),options:[24,25,30,60],class:"w-28"},null,8,["modelValue"])]),s[87]||(s[87]=h("p",{class:"mt-2 text-[13px] text-ink-3"},"1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.",-1))]),_:1}),r(k,{label:"Движение камеры",hint:"Для каждой сцены выбирается случайно из отмеченных. ▶ — превью с текущей интенсивностью"},{default:v(()=>[h("div",Bo,[(d(!0),u(M,null,oe(b(i).meta?.effects,a=>(d(),u("span",{key:a.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.motion_effects.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[h("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:X=>n.value.render.motion_effects=Dt(n.value.render.motion_effects,a.id)},z(a.name),9,Ho),h("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:X=>I("motion",a.id,`Движение камеры: ${a.name}`)},[...s[88]||(s[88]=[h("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,Ko)],2))),128))])]),_:1}),r(k,{label:"Интенсивность движения",value:`${Math.round(n.value.render.motion_intensity*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.render.motion_intensity,"onUpdate:modelValue":s[35]||(s[35]=a=>n.value.render.motion_intensity=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Крупные планы по фразам",hint:"Внутри сцены монтаж чередует общий план и более крупный план героя, склейки — на паузах в речи. Новые картинки не нужны"},{default:v(()=>[r(b(ee),{modelValue:n.value.render.phrase_cuts,"onUpdate:modelValue":s[36]||(s[36]=a=>n.value.render.phrase_cuts=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.render.motion_effects.includes("parallax")?(d(),$(k,{key:0,label:"Размытие фона",hint:"3D-параллакс: фон за героем мягко размыт, как при съёмке на длиннофокусный объектив"},{default:v(()=>[r(b(ee),{modelValue:n.value.render.depth_of_field,"onUpdate:modelValue":s[37]||(s[37]=a=>n.value.render.depth_of_field=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):x("",!0),r(k,{label:"Переходы"},{default:v(()=>[h("div",Uo,[(d(!0),u(M,null,oe(b(i).meta?.transitions,a=>(d(),u("span",{key:a.id,class:G(["inline-flex overflow-hidden rounded-md border text-[13px] transition-colors",n.value.render.transitions.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3"])},[h("button",{class:"py-1.5 pl-3 pr-2 hover:text-ink-2",onClick:X=>n.value.render.transitions=Dt(n.value.render.transitions,a.id)},z(a.name),9,Ro),h("button",{class:"border-l border-line px-2 text-ink-3 hover:text-tally",title:"Превью",onClick:X=>I("transition",a.id,`Переход: ${a.name}`)},[...s[89]||(s[89]=[h("i",{class:"pi pi-play text-[9px]"},null,-1)])],8,jo)],2))),128))])]),_:1}),r(k,{label:"Длительность перехода",value:`${n.value.render.transition_duration.toFixed(1)} с`},{default:v(()=>[r(b(le),{modelValue:n.value.render.transition_duration,"onUpdate:modelValue":s[38]||(s[38]=a=>n.value.render.transition_duration=a),min:.2,max:1.5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Доля простых склеек",value:`${Math.round(n.value.render.cut_ratio*100)}%`,hint:"Без эффекта перехода — так монтаж выглядит естественнее"},{default:v(()=>[r(b(le),{modelValue:n.value.render.cut_ratio,"onUpdate:modelValue":s[39]||(s[39]=a=>n.value.render.cut_ratio=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Появление и затухание"},{default:v(()=>[h("div",Go,[r(b(te),{modelValue:n.value.render.fade_in,"onUpdate:modelValue":s[40]||(s[40]=a=>n.value.render.fade_in=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(te),{modelValue:n.value.render.fade_out,"onUpdate:modelValue":s[41]||(s[41]=a=>n.value.render.fade_out=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Качество кодирования"},{default:v(()=>[r(b(be),{modelValue:n.value.render.quality,"onUpdate:modelValue":s[42]||(s[42]=a=>n.value.render.quality=a),options:[{v:"max",l:"Максимум"},{v:"high",l:"Высокое"},{v:"balanced",l:"Баланс"},{v:"fast",l:"Быстро"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Энкодер",hint:"Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее"},{default:v(()=>[r(b(ne),{modelValue:n.value.render.encoder,"onUpdate:modelValue":s[43]||(s[43]=a=>n.value.render.encoder=a),options:[{v:"auto",l:"Автоматически"},...(b(i).meta?.encoders??[]).map(a=>({v:a,l:a}))],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Громкость",hint:"YouTube нормализует к −14 LUFS",value:`${n.value.render.loudness} LUFS`},{default:v(()=>[r(b(le),{modelValue:n.value.render.loudness,"onUpdate:modelValue":s[44]||(s[44]=a=>n.value.render.loudness=a),min:-24,max:-9,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Процессов рендера",hint:"0 — подобрать автоматически по числу ядер"},{default:v(()=>[r(b(te),{modelValue:n.value.render.workers,"onUpdate:modelValue":s[45]||(s[45]=a=>n.value.render.workers=a),min:0,max:16,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="atmosphere"?(d(),u(M,{key:5},[s[90]||(s[90]=h("p",{class:"text-ink-3"}," Едва заметная жизнь в статичной картинке. Каждый рендер получает свой ритм, так что эффекты ещё и уникализируют видео. Зерно и дрожание линий заметно увеличивают размер файла. ",-1)),h("div",null,[r(b(me),{label:"Превью всех включённых",icon:"pi pi-play",severity:"secondary",size:"small",disabled:!U.some(a=>n.value.atmosphere[a[0]]),onClick:s[46]||(s[46]=a=>I("atmosphere","all","Атмосфера: все включённые эффекты"))},null,8,["disabled"])]),(d(),u(M,null,oe(U,a=>(d(),u(M,{key:a[0]},[r(k,{label:a[1],hint:a[2]},{default:v(()=>[h("div",No,[r(b(ee),{modelValue:n.value.atmosphere[a[0]],"onUpdate:modelValue":X=>n.value.atmosphere[a[0]]=X,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"]),r(b(me),{label:"Превью",icon:"pi pi-play",severity:"secondary",size:"small",text:"",class:"mt-1",onClick:X=>I("atmosphere",a[0],`Атмосфера: ${a[1]}`)},null,8,["onClick"])])]),_:2},1032,["label","hint"]),n.value.atmosphere[a[0]]?(d(),$(k,{key:0,label:"Сила",value:`${Math.round(n.value.atmosphere[`${a[0]}_strength`]*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.atmosphere[`${a[0]}_strength`],"onUpdate:modelValue":X=>n.value.atmosphere[`${a[0]}_strength`]=X,min:.05,max:1,step:.05,class:"mt-3"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["value"])):x("",!0)],64))),64)),n.value.atmosphere.line_boil||n.value.atmosphere.grain_boil?(d(),$(k,{key:0,label:"Частота «кипения»",hint:"Как часто перерисовываются линии и зерно"},{default:v(()=>[r(b(be),{modelValue:n.value.atmosphere.boil_hold,"onUpdate:modelValue":s[47]||(s[47]=a=>n.value.atmosphere.boil_hold=a),options:[{v:2,l:"Быстро (на двойках)"},{v:3,l:"Классика (на тройках)"},{v:4,l:"Медленно"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1})):x("",!0)],64)):f.value==="subtitles"?(d(),u(M,{key:6},[r(k,{label:"Вшивать субтитры в видео",hint:"Файл .srt для загрузки на YouTube создаётся всегда"},{default:v(()=>[r(b(ee),{modelValue:n.value.subtitles.enabled,"onUpdate:modelValue":s[48]||(s[48]=a=>n.value.subtitles.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.enabled?(d(),u(M,{key:0},[h("div",_o,[h("div",{class:"absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight",style:ut(wn.value)},[h("span",{style:ut(kn.value)},[n.value.subtitles.style==="karaoke"?(d(),u(M,{key:0},[h("span",{style:ut({color:n.value.subtitles.highlight_color})},"Так выглядят",4),s[91]||(s[91]=j(" субтитры",-1)),s[92]||(s[92]=h("br",null,null,-1)),s[93]||(s[93]=j("в вашем видео ",-1))],64)):(d(),u(M,{key:1},[s[94]||(s[94]=j("Так выглядят субтитры",-1)),s[95]||(s[95]=h("br",null,null,-1)),s[96]||(s[96]=j("в вашем видео",-1))],64))],4)],4)]),r(k,{label:"Стиль"},{default:v(()=>[r(b(be),{modelValue:n.value.subtitles.style,"onUpdate:modelValue":s[49]||(s[49]=a=>n.value.subtitles.style=a),options:[{v:"plain",l:"Обводка"},{v:"karaoke",l:"Подсветка слов"},{v:"box",l:"Плашка"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Шрифт",hint:"Свои шрифты положите в папку data/fonts"},{default:v(()=>[h("div",qo,[r(b(ne),{modelValue:n.value.subtitles.font,"onUpdate:modelValue":s[50]||(s[50]=a=>n.value.subtitles.font=a),options:dt.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(te),{modelValue:n.value.subtitles.size,"onUpdate:modelValue":s[51]||(s[51]=a=>n.value.subtitles.size=a),min:20,max:140,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"]),h("label",Wo,[r(b(ee),{modelValue:n.value.subtitles.bold,"onUpdate:modelValue":s[52]||(s[52]=a=>n.value.subtitles.bold=a)},null,8,["modelValue"]),s[97]||(s[97]=j("Жирный",-1))]),h("label",Zo,[r(b(ee),{modelValue:n.value.subtitles.uppercase,"onUpdate:modelValue":s[53]||(s[53]=a=>n.value.subtitles.uppercase=a)},null,8,["modelValue"]),s[98]||(s[98]=j("Заглавные",-1))])])]),_:1}),r(k,{label:"Цвета"},{default:v(()=>[h("div",Xo,[h("label",Yo,[r(b(Oe),{"model-value":n.value.subtitles.primary_color.slice(1),"onUpdate:modelValue":s[54]||(s[54]=a=>n.value.subtitles.primary_color=Ce(a))},null,8,["model-value"]),s[99]||(s[99]=j("Текст ",-1))]),n.value.subtitles.style==="karaoke"?(d(),u("label",Jo,[r(b(Oe),{"model-value":n.value.subtitles.highlight_color.slice(1),"onUpdate:modelValue":s[55]||(s[55]=a=>n.value.subtitles.highlight_color=Ce(a))},null,8,["model-value"]),s[100]||(s[100]=j("Подсветка ",-1))])):x("",!0),n.value.subtitles.style!=="box"?(d(),u("label",Qo,[r(b(Oe),{"model-value":n.value.subtitles.outline_color.slice(1),"onUpdate:modelValue":s[56]||(s[56]=a=>n.value.subtitles.outline_color=Ce(a))},null,8,["model-value"]),s[101]||(s[101]=j("Обводка ",-1))])):(d(),u("label",es,[r(b(Oe),{"model-value":n.value.subtitles.box_color.slice(1),"onUpdate:modelValue":s[57]||(s[57]=a=>n.value.subtitles.box_color=Ce(a))},null,8,["model-value"]),s[102]||(s[102]=j("Плашка ",-1))]))])]),_:1}),n.value.subtitles.style==="box"?(d(),$(k,{key:0,label:"Прозрачность плашки",value:`${Math.round(n.value.subtitles.box_opacity*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.box_opacity,"onUpdate:modelValue":s[58]||(s[58]=a=>n.value.subtitles.box_opacity=a),min:.1,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])):(d(),$(k,{key:1,label:"Толщина обводки",value:n.value.subtitles.outline.toFixed(1)},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.outline,"onUpdate:modelValue":s[59]||(s[59]=a=>n.value.subtitles.outline=a),min:0,max:8,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])),r(k,{label:"Положение"},{default:v(()=>[h("div",ts,[r(b(be),{modelValue:n.value.subtitles.position,"onUpdate:modelValue":s[60]||(s[60]=a=>n.value.subtitles.position=a),options:[{v:"bottom",l:"Внизу"},{v:"middle",l:"По центру"},{v:"top",l:"Вверху"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),r(b(te),{modelValue:n.value.subtitles.margin_v,"onUpdate:modelValue":s[61]||(s[61]=a=>n.value.subtitles.margin_v=a),min:0,max:400,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Длина строки",hint:"Символов в строке и строк на экране"},{default:v(()=>[h("div",ns,[r(b(te),{modelValue:n.value.subtitles.max_chars_per_line,"onUpdate:modelValue":s[62]||(s[62]=a=>n.value.subtitles.max_chars_per_line=a),min:12,max:80,"show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(te),{modelValue:n.value.subtitles.max_lines,"onUpdate:modelValue":s[63]||(s[63]=a=>n.value.subtitles.max_lines=a),min:1,max:3,"show-buttons":"",class:"w-28"},null,8,["modelValue"])])]),_:1})],64)):x("",!0),r(k,{label:"Ключевые фразы на экране",hint:"Нейросеть выбирает в сценарии цифры и главные мысли, и в нужный момент они крупно появляются в кадре. Работает и без субтитров"},{default:v(()=>[r(b(ee),{modelValue:n.value.subtitles.accents,"onUpdate:modelValue":s[64]||(s[64]=a=>n.value.subtitles.accents=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.accents?(d(),u(M,{key:1},[r(k,{label:"Частота",value:`${n.value.subtitles.accents_per_minute.toFixed(1)} в минуту`,hint:"Примерно столько фраз на минуту видео; ближе 6 секунд друг к другу они не появляются"},{default:v(()=>[r(b(le),{modelValue:n.value.subtitles.accents_per_minute,"onUpdate:modelValue":s[65]||(s[65]=a=>n.value.subtitles.accents_per_minute=a),min:.3,max:4,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Шрифт и цвет фраз"},{default:v(()=>[h("div",is,[r(b(ne),{modelValue:n.value.subtitles.accent_font,"onUpdate:modelValue":s[66]||(s[66]=a=>n.value.subtitles.accent_font=a),options:dt.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(Oe),{"model-value":n.value.subtitles.accent_color.slice(1),"onUpdate:modelValue":s[67]||(s[67]=a=>n.value.subtitles.accent_color=Ce(a))},null,8,["model-value"])])]),_:1})],64)):x("",!0)],64)):f.value==="unique"?(d(),u(M,{key:7},[s[103]||(s[103]=h("p",{class:"text-ink-3"}," Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов, тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными. ",-1)),r(k,{label:"Уникализация"},{default:v(()=>[r(b(ee),{modelValue:n.value.unique.enabled,"onUpdate:modelValue":s[68]||(s[68]=a=>n.value.unique.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.unique.enabled?(d(),u(M,{key:0},[r(k,{label:"Сила",value:`${Math.round(n.value.unique.strength*100)}%`},{default:v(()=>[r(b(le),{modelValue:n.value.unique.strength,"onUpdate:modelValue":s[69]||(s[69]=a=>n.value.unique.strength=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),(d(),u(M,null,oe([["color_jitter","Цветокоррекция","Яркость, контраст, насыщенность и температура"],["film_grain","Плёночное зерно","Едва заметный шум, разный в каждом рендере"],["vignette","Виньетка","Мягкое затемнение по краям"],["micro_zoom","Микрозум и сдвиг","Кадр чуть иначе обрезан"],["audio_eq","Эквализация звука","Неслышимые изменения тембра ±0.6 дБ"],["strip_metadata","Очистка метаданных","Убирает служебную информацию из файла"]],a=>r(k,{key:a[0],label:a[1],hint:a[2]},{default:v(()=>[r(b(ee),{modelValue:n.value.unique[a[0]],"onUpdate:modelValue":X=>n.value.unique[a[0]]=X,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"])),64))],64)):x("",!0)],64)):f.value==="publish"?(d(),u(M,{key:8},[r(k,{label:"Создавать в конвейере",hint:"Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.enabled,"onUpdate:modelValue":s[70]||(s[70]=a=>n.value.publish.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Вариантов названия"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.title_variants,"onUpdate:modelValue":s[71]||(s[71]=a=>n.value.publish.title_variants=a),min:1,max:10,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Тегов"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.tags_count,"onUpdate:modelValue":s[72]||(s[72]=a=>n.value.publish.tags_count=a),min:3,max:40,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Главы в описании",hint:"Таймкоды разделов по абзацам сценария"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.with_chapters,"onUpdate:modelValue":s[73]||(s[73]=a=>n.value.publish.with_chapters=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Подпись в конце описания",hint:"Ссылки, соцсети, дисклеймеры"},{default:v(()=>[r(b(ye),{modelValue:n.value.publish.description_footer,"onUpdate:modelValue":s[74]||(s[74]=a=>n.value.publish.description_footer=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Обложек"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.thumbnail_count,"onUpdate:modelValue":s[75]||(s[75]=a=>n.value.publish.thumbnail_count=a),min:1,max:4,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель для обложек"},{default:v(()=>[r(b(ne),{modelValue:n.value.publish.thumbnail_operation,"onUpdate:modelValue":s[76]||(s[76]=a=>n.value.publish.thumbnail_operation=a),options:T.value,"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Заголовок на обложке",hint:"Модель нарисует 2–4 слова крупным шрифтом"},{default:v(()=>[r(b(ee),{modelValue:n.value.publish.thumbnail_text,"onUpdate:modelValue":s[77]||(s[77]=a=>n.value.publish.thumbnail_text=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стиль обложек"},{default:v(()=>[r(b(ye),{modelValue:n.value.publish.thumbnail_style,"onUpdate:modelValue":s[78]||(s[78]=a=>n.value.publish.thumbnail_style=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1})],64)):x("",!0)]),r(Kl,{visible:g.value,"onUpdate:visible":s[79]||(s[79]=a=>g.value=a),target:w.value,"channel-id":t.channelId,"project-id":t.projectId,settings:E},null,8,["visible","target","channel-id","project-id"])])}}});var cn={name:"MinusIcon",extends:nt};function ls(t){return rs(t)||as(t)||ss(t)||os()}function os(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ss(t,e){if(t){if(typeof t=="string")return gt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?gt(t,e):void 0}}function as(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function rs(t){if(Array.isArray(t))return gt(t)}function gt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function ds(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),ls(e[0]||(e[0]=[h("path",{d:"M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z",fill:"currentColor"},null,-1)])),16)}cn.render=ds;var us=`
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
`,cs={root:function(e){var n=e.instance,l=e.props;return["p-checkbox p-component",{"p-checkbox-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$pcCheckboxGroup?n.$pcCheckboxGroup.$invalid:n.$invalid,"p-variant-filled":n.$variant==="filled","p-checkbox-sm p-inputfield-sm":l.size==="small","p-checkbox-lg p-inputfield-lg":l.size==="large"}]},box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},ps=he.extend({name:"checkbox",style:us,classes:cs}),hs={name:"BaseCheckbox",extends:it,props:{value:null,binary:Boolean,indeterminate:{type:Boolean,default:!1},trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},required:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:ps,provide:function(){return{$pcCheckbox:this,$parentInstance:this}}};function Be(t){"@babel/helpers - typeof";return Be=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Be(t)}function fs(t,e,n){return(e=ms(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ms(t){var e=bs(t,"string");return Be(e)=="symbol"?e:e+""}function bs(t,e){if(Be(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Be(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function vs(t){return ws(t)||ks(t)||ys(t)||gs()}function gs(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ys(t,e){if(t){if(typeof t=="string")return yt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?yt(t,e):void 0}}function ks(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function ws(t){if(Array.isArray(t))return yt(t)}function yt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var pn={name:"Checkbox",extends:hs,inheritAttrs:!1,emits:["change","focus","blur","update:indeterminate"],inject:{$pcCheckboxGroup:{default:void 0}},data:function(){return{d_indeterminate:this.indeterminate}},watch:{indeterminate:function(e){this.d_indeterminate=e,this.updateIndeterminate()}},mounted:function(){this.updateIndeterminate()},updated:function(){this.updateIndeterminate()},methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,indeterminate:this.d_indeterminate,disabled:this.disabled}})},onChange:function(e){var n=this;if(!this.disabled&&!this.readonly){var l=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value,o;this.binary?o=this.d_indeterminate?this.trueValue:this.checked?this.falseValue:this.trueValue:this.checked||this.d_indeterminate?o=l.filter(function(i){return!Ie(i,n.value)}):o=l?[].concat(vs(l),[this.value]):[this.value],this.d_indeterminate&&(this.d_indeterminate=!1,this.$emit("update:indeterminate",this.d_indeterminate)),this.$pcCheckboxGroup?this.$pcCheckboxGroup.writeValue(o,e):this.writeValue(o,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)},updateIndeterminate:function(){this.$refs.input&&(this.$refs.input.indeterminate=this.d_indeterminate)}},computed:{groupName:function(){return this.$pcCheckboxGroup?this.$pcCheckboxGroup.groupName:this.$formName},checked:function(){var e=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value;return this.d_indeterminate?!1:this.binary?e===this.trueValue:Vn(this.value,e)},dataP:function(){return se(fs({invalid:this.$invalid,checked:this.checked,disabled:this.disabled,filled:this.$variant==="filled"},this.size,this.size))}},components:{CheckIcon:St,MinusIcon:cn}},Os=["data-p-checked","data-p-indeterminate","data-p-disabled","data-p"],xs=["id","value","name","checked","tabindex","disabled","readonly","required","aria-labelledby","aria-label","aria-invalid"],Is=["data-p"];function Ss(t,e,n,l,o,i){var m=N("CheckIcon"),c=N("MinusIcon");return d(),u("div",p({class:t.cx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-indeterminate":o.d_indeterminate||void 0,"data-p-disabled":t.disabled,"data-p":i.dataP}),[h("input",p({ref:"input",id:t.inputId,type:"checkbox",class:[t.cx("input"),t.inputClass],style:t.inputStyle,value:t.value,name:i.groupName,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,required:t.required,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,xs),h("div",p({class:t.cx("box")},i.getPTOptions("box"),{"data-p":i.dataP}),[V(t.$slots,"icon",{checked:i.checked,indeterminate:o.d_indeterminate,class:G(t.cx("icon")),dataP:i.dataP},function(){return[i.checked?(d(),$(m,p({key:0,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):o.d_indeterminate?(d(),$(c,p({key:1,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):x("",!0)]})],16,Is)],16,Os)}pn.render=Ss;var Ls=`
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
`,Cs={root:"p-chip p-component",image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},Vs=he.extend({name:"chip",style:Ls,classes:Cs}),Ms={name:"BaseChip",extends:ke,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:Vs,provide:function(){return{$pcChip:this,$parentInstance:this}}},hn={name:"Chip",extends:Ms,inheritAttrs:!1,emits:["remove"],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)},close:function(e){this.visible=!1,this.$emit("remove",e)}},computed:{dataP:function(){return se({removable:this.removable})}},components:{TimesCircleIcon:Mn}},zs=["aria-label","data-p"],Fs=["src"];function $s(t,e,n,l,o,i){return o.visible?(d(),u("div",p({key:0,class:t.cx("root"),"aria-label":t.label},t.ptmi("root"),{"data-p":i.dataP}),[V(t.$slots,"default",{},function(){return[t.image?(d(),u("img",p({key:0,src:t.image},t.ptm("image"),{class:t.cx("image")}),null,16,Fs)):t.$slots.icon?(d(),$(de(t.$slots.icon),p({key:1,class:t.cx("icon")},t.ptm("icon")),null,16,["class"])):t.icon?(d(),u("span",p({key:2,class:[t.cx("icon"),t.icon]},t.ptm("icon")),null,16)):x("",!0),t.label!==null?(d(),u("div",p({key:3,class:t.cx("label")},t.ptm("label")),z(t.label),17)):x("",!0)]}),t.removable?V(t.$slots,"removeicon",{key:0,removeCallback:i.close,keydownCallback:i.onKeydown},function(){return[(d(),$(de(t.removeIcon?"span":"TimesCircleIcon"),p({class:[t.cx("removeIcon"),t.removeIcon],onClick:i.close,onKeydown:i.onKeydown},t.ptm("removeIcon")),null,16,["class","onClick","onKeydown"]))]}):x("",!0)],16,zs)):x("",!0)}hn.render=$s;var Ts=`
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
`,Ps={root:function(e){var n=e.props;return{position:n.appendTo==="self"?"relative":void 0}}},As={root:function(e){var n=e.instance,l=e.props;return["p-multiselect p-component p-inputwrapper",{"p-multiselect-display-chip":l.display==="chip","p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":n.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":n.focused||n.overlayVisible,"p-multiselect-open":n.overlayVisible,"p-multiselect-fluid":n.$fluid,"p-multiselect-sm p-inputfield-sm":l.size==="small","p-multiselect-lg p-inputfield-lg":l.size==="large"}]},labelContainer:"p-multiselect-label-container",label:function(e){var n=e.instance,l=e.props;return["p-multiselect-label",{"p-placeholder":n.label===l.placeholder,"p-multiselect-label-empty":!l.placeholder&&!n.$filled}]},clearIcon:"p-multiselect-clear-icon",chipItem:"p-multiselect-chip-item",pcChip:"p-multiselect-chip",chipIcon:"p-multiselect-chip-icon",dropdown:"p-multiselect-dropdown",loadingIcon:"p-multiselect-loading-icon",dropdownIcon:"p-multiselect-dropdown-icon",overlay:"p-multiselect-overlay p-component",header:"p-multiselect-header",pcFilterContainer:"p-multiselect-filter-container",pcFilter:"p-multiselect-filter",listContainer:"p-multiselect-list-container",list:"p-multiselect-list",optionGroup:"p-multiselect-option-group",option:function(e){var n=e.instance,l=e.option,o=e.index,i=e.getItemOptions,m=e.props;return["p-multiselect-option",{"p-multiselect-option-selected":n.isSelected(l)&&m.highlightOnSelect,"p-focus":n.focusedOptionIndex===n.getOptionIndex(o,i),"p-disabled":n.isOptionDisabled(l)}]},emptyMessage:"p-multiselect-empty-message"},Es=he.extend({name:"multiselect",style:Ts,classes:As,inlineStyles:Ps}),Ds={name:"BaseMultiSelect",extends:it,props:{options:Array,optionLabel:null,optionValue:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:"14rem"},placeholder:String,inputId:{type:String,default:null},panelClass:{type:String,default:null},panelStyle:{type:null,default:null},overlayClass:{type:String,default:null},overlayStyle:{type:null,default:null},dataKey:null,showClear:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},resetFilterOnClear:{type:Boolean,default:!1},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},display:{type:String,default:"comma"},selectedItemsLabel:{type:String,default:null},maxSelectedLabels:{type:Number,default:null},selectionLimit:{type:Number,default:null},showToggleAll:{type:Boolean,default:!0},loading:{type:Boolean,default:!1},checkboxIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},removeTokenIcon:{type:String,default:void 0},chipIcon:{type:String,default:void 0},selectAll:{type:Boolean,default:null},resetFilterOnHide:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Es,provide:function(){return{$pcMultiSelect:this,$parentInstance:this}}};function He(t){"@babel/helpers - typeof";return He=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},He(t)}function _t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function qt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?_t(Object(n),!0).forEach(function(l){ve(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):_t(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ve(t,e,n){return(e=Bs(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Bs(t){var e=Hs(t,"string");return He(e)=="symbol"?e:e+""}function Hs(t,e){if(He(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(He(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Wt(t){return js(t)||Rs(t)||Us(t)||Ks()}function Ks(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Us(t,e){if(t){if(typeof t=="string")return kt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?kt(t,e):void 0}}function Rs(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function js(t){if(Array.isArray(t))return kt(t)}function kt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Gs={name:"MultiSelect",extends:Ds,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter","selectall-change"],inject:{$pcFluid:{default:null}},outsideClickListener:null,scrollHandler:null,resizeListener:null,overlay:null,list:null,virtualScroller:null,startRangeIndex:-1,searchTimeout:null,searchValue:"",selectOnFocus:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1}},watch:{options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(ae.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?pe(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?pe(e,this.optionValue):e},getOptionRenderKey:function(e,n){return this.dataKey?pe(e,this.dataKey):this.getOptionLabel(e)+"_".concat(n)},getHeaderCheckboxPTOptions:function(e){return this.ptm(e,{context:{selected:this.allSelected}})},getCheckboxPTOptions:function(e,n,l,o){return this.ptm(o,{context:{selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.maxSelectionLimitReached&&!this.isSelected(e)?!0:this.optionDisabled?pe(e,this.optionDisabled):!1},isOptionGroup:function(e){return!!(this.optionGroupLabel&&e.optionGroup&&e.group)},getOptionGroupLabel:function(e){return pe(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return pe(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),e&&J(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&J(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),!this.autoFilterFocus&&this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n,l;this.clicked=!1,this.focused=!1,this.focusedOptionIndex=-1,this.searchValue="",this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"ShiftLeft":case"ShiftRight":this.onShiftKey(e);break;default:if(e.code==="KeyA"&&l){var o=this.visibleOptions.filter(function(i){return n.isValidOption(i)}).map(function(i){return n.getOptionValue(i)});this.updateModel(e,o),e.preventDefault();break}!l&&tn(e.key)&&(!this.overlayVisible&&this.show(),this.searchOptions(e),e.preventDefault());break}this.clicked=!1},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,[]),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?en(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;J(n)},onOptionSelect:function(e,n){var l=this,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1,i=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;if(!(this.disabled||this.isOptionDisabled(n))){var m=this.isSelected(n),c=null;m?c=this.d_value.filter(function(f){return!Ie(f,l.getOptionValue(n),l.equalityKey)}):c=[].concat(Wt(this.d_value||[]),[this.getOptionValue(n)]),this.updateModel(e,c),o!==-1&&(this.focusedOptionIndex=o),i&&J(this.$refs.focusInput)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onOptionSelectRange:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(l===-1&&(l=this.findNearestSelectedOptionIndex(o,!0)),o===-1&&(o=this.findNearestSelectedOptionIndex(l)),l!==-1&&o!==-1){var i=Math.min(l,o),m=Math.max(l,o),c=this.visibleOptions.slice(i,m+1).filter(function(f){return n.isValidOption(f)}).map(function(f){return n.getOptionValue(f)});this.updateModel(e,c)}},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e,!0);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){ot.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show();else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,n),this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,l,this.startRangeIndex),this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else{var o=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();e.shiftKey&&o&&this.onOptionSelectRange(e,i,this.startRangeIndex),this.changeFocusedOptionIndex(e,i),!this.overlayVisible&&this.show()}e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var o=l.value.length;l.setSelectionRange(o,o),this.focusedOptionIndex=-1}}else{var i=e.metaKey||e.ctrlKey,m=this.findLastOptionIndex();e.shiftKey&&i&&this.onOptionSelectRange(e,this.startRangeIndex,m),this.changeFocusedOptionIndex(e,m),!this.overlayVisible&&this.show()}e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?this.focusedOptionIndex!==-1&&(e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex])):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onEscapeKey:function(e){this.overlayVisible&&(this.hide(!0),e.stopPropagation()),e.preventDefault()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(J(e.shiftKey?this.$refs.lastHiddenFocusableElementOnOverlay:this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onOverlayEnter:function(e){ae.set("overlay",e,this.$primevue.config.zIndex.overlay),Ot(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.autoFilterFocus&&J(this.$refs.filterInput.$el),this.autoUpdateModel(),this.$attrSelector&&e.setAttribute(this.$attrSelector,"")},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?xt(this.overlay,this.$el):(this.overlay.style.minWidth=Fe(this.$el)+"px",et(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Qe(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Je()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isOutsideClicked:function(e){return!(this.$el.isSameNode(e.target)||this.$el.contains(e.target)||this.overlay&&this.overlay.contains(e.target))},getLabelByValue:function(e){var n=this,l=this.optionGroupLabel?this.flatOptions(this.options):this.options||[],o=l.find(function(i){return!n.isOptionGroup(i)&&Ie(n.getOptionValue(i),e,n.equalityKey)});return this.getOptionLabel(o)},getSelectedItemsLabel:function(){var e=/{(.*?)}/,n=this.selectedItemsLabel||this.$primevue.config.locale.selectionMessage;return e.test(n)?n.replace(n.match(e)[0],this.d_value.length+""):n},onToggleAll:function(e){var n=this;if(this.selectAll!==null)this.$emit("selectall-change",{originalEvent:e,checked:!this.allSelected});else{var l=this.allSelected?[]:this.visibleOptions.filter(function(o){return n.isValidOption(o)}).map(function(o){return n.getOptionValue(o)});this.updateModel(e,l)}},removeOption:function(e,n){var l=this;e.stopPropagation();var o=this.d_value.filter(function(i){return!Ie(i,n,l.equalityKey)});this.updateModel(e,o)},clearFilter:function(){this.filterValue=null},hasFocusableElements:function(){return Jt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return fe(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,n){return Ie(e,n,this.equalityKey)},isSelected:function(e){var n=this,l=this.getOptionValue(e);return(this.d_value||[]).some(function(o){return n.isEquals(o,l)})},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return xe(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidOption(o)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidOption(o)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;if(this.$filled){for(var n=function(){var m=e.d_value[o],c=e.visibleOptions.findIndex(function(f){return e.isValidSelectedOption(f)&&e.isEquals(m,e.getOptionValue(f))});if(c>-1)return{v:c}},l,o=this.d_value.length-1;o>=0;o--)if(l=n(),l)return l.v}return-1},findFirstSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)}):-1},findLastSelectedOptionIndex:function(){var e=this;return this.$filled?xe(this.visibleOptions,function(n){return e.isValidSelectedOption(n)}):-1},findNextSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidSelectedOption(o)}):-1;return l>-1?l+e+1:-1},findPrevSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidSelectedOption(o)}):-1;return l>-1?l:-1},findNearestSelectedOptionIndex:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,l=-1;return this.$filled&&(n?(l=this.findPrevSelectedOptionIndex(e),l=l===-1?this.findNextSelectedOptionIndex(e):l):(l=this.findNextSelectedOptionIndex(e),l=l===-1?this.findPrevSelectedOptionIndex(e):l)),l>-1?l:e},findFirstFocusedOptionIndex:function(){var e=this.findFirstSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e){var n=this;this.searchValue=(this.searchValue||"")+e.key;var l=-1;fe(this.searchValue)&&(this.focusedOptionIndex!==-1?(l=this.visibleOptions.slice(this.focusedOptionIndex).findIndex(function(o){return n.isOptionMatched(o)}),l=l===-1?this.visibleOptions.slice(0,this.focusedOptionIndex).findIndex(function(o){return n.isOptionMatched(o)}):l+this.focusedOptionIndex):l=this.visibleOptions.findIndex(function(o){return n.isOptionMatched(o)}),l===-1&&this.focusedOptionIndex===-1&&(l=this.findFirstFocusedOptionIndex()),l!==-1&&this.changeFocusedOptionIndex(e,l)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){n.searchValue="",n.searchTimeout=null},500)},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n]))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,o=$e(e.list,'li[id="'.concat(l,'"]'));o?o.scrollIntoView&&o.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){if(this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled){var e=this.getOptionValue(this.visibleOptions[this.focusedOptionIndex]);this.updateModel(null,[e])}},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,o,i){var m=n.getOptionGroupChildren(o);return m&&Array.isArray(m)?(l.push({optionGroup:o,group:!0,index:i}),m.forEach(function(c){return l.push(c)})):l.push(o),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Yt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var o=this.options||[],i=[];return o.forEach(function(m){var c=e.getOptionGroupChildren(m),f=c.filter(function(g){return l.includes(g)});f.length>0&&i.push(qt(qt({},m),{},ve({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",Wt(f))))}),this.flatOptions(i)}return l}return n},label:function(){var e;if(this.d_value&&this.d_value.length)if(this.loading&&(!this.options||this.options.length===0))e=this.placeholder;else{if(fe(this.maxSelectedLabels)&&this.d_value.length>this.maxSelectedLabels)return this.getSelectedItemsLabel();e="";for(var n=0;n<this.d_value.length;n++)n!==0&&(e+=", "),e+=this.getLabelByValue(this.d_value[n])}else e=this.placeholder;return e},chipSelectedItems:function(){return fe(this.maxSelectedLabels)&&this.d_value&&this.d_value.length>this.maxSelectedLabels},allSelected:function(){var e=this;return this.selectAll!==null?this.selectAll:fe(this.visibleOptions)&&this.visibleOptions.every(function(n){return e.isOptionGroup(n)||e.isOptionDisabled(n)||e.isSelected(n)})},hasSelectedOption:function(){return this.$filled},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},maxSelectionLimitReached:function(){return this.selectionLimit&&this.d_value&&this.d_value.length===this.selectionLimit},filterResultMessageText:function(){return fe(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}",this.d_value.length):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},toggleAllAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria[this.allSelected?"selectAll":"unselectAll"]:void 0},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},hasFluid:function(){return zn(this.fluid)?!!this.$pcFluid:this.fluid},isClearIconVisible:function(){return this.showClear&&this.d_value&&this.d_value.length&&this.d_value!=null&&fe(this.options)&&!this.disabled&&!this.loading},containerDataP:function(){return se(ve({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return se(ve(ve(ve({placeholder:this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled},this.size,this.size),"has-chip",this.display==="chip"&&this.d_value&&this.d_value.length&&(this.maxSelectedLabels?this.d_value.length<=this.maxSelectedLabels:!0)),"empty",!this.placeholder&&!this.$filled))},dropdownIconDataP:function(){return se(ve({},this.size,this.size))},overlayDataP:function(){return se(ve({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:wt},components:{InputText:Ye,Checkbox:pn,VirtualScroller:$t,Portal:Re,Chip:hn,IconField:zt,InputIcon:Ft,TimesIcon:Lt,SearchIcon:Mt,ChevronDownIcon:Vt,SpinnerIcon:It,CheckIcon:St}};function Ke(t){"@babel/helpers - typeof";return Ke=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ke(t)}function Zt(t,e,n){return(e=Ns(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ns(t){var e=_s(t,"string");return Ke(e)=="symbol"?e:e+""}function _s(t,e){if(Ke(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ke(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var qs=["data-p"],Ws=["id","disabled","placeholder","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid"],Zs=["data-p"],Xs={key:1},Ys=["data-p"],Js=["id","aria-label"],Qs=["id"],ea=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onClick","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function ta(t,e,n,l,o,i){var m=N("Chip"),c=N("SpinnerIcon"),f=N("Checkbox"),g=N("InputText"),w=N("SearchIcon"),I=N("InputIcon"),E=N("IconField"),U=N("VirtualScroller"),D=N("Portal"),P=je("ripple");return d(),u("div",p({ref:"container",class:t.cx("root"),style:t.sx("root"),onClick:e[7]||(e[7]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[h("div",p({class:"p-hidden-accessible"},t.ptm("hiddenInputContainer"),{"data-p-hidden-accessible":!0}),[h("input",p({ref:"focusInput",id:t.inputId,type:"text",readonly:"",disabled:t.disabled,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":o.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)})},t.ptm("hiddenInput")),null,16,Ws)],16),h("div",p({class:t.cx("labelContainer")},t.ptm("labelContainer")),[h("div",p({class:t.cx("label"),"data-p":i.labelDataP},t.ptm("label")),[V(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){return[t.display==="comma"?(d(),u(M,{key:0},[j(z(i.label||"empty"),1)],64)):t.display==="chip"?(d(),u(M,{key:1},[t.loading&&(!t.options||t.options.length===0)?(d(),u(M,{key:0},[j(z(t.placeholder||"empty"),1)],64)):i.chipSelectedItems?(d(),u("span",Xs,z(i.label),1)):(d(!0),u(M,{key:2},oe(t.d_value,function(O,B){return d(),u("span",p({key:"chip-".concat(i.getLabelByValue(O),"_").concat(B),class:t.cx("chipItem")},{ref_for:!0},t.ptm("chipItem")),[V(t.$slots,"chip",{value:O,removeCallback:function(K){return i.removeOption(K,O)}},function(){return[r(m,{class:G(t.cx("pcChip")),label:i.getLabelByValue(O),removeIcon:t.chipIcon||t.removeTokenIcon,removable:"",unstyled:t.unstyled,onRemove:function(K){return i.removeOption(K,O)},pt:t.ptm("pcChip")},{removeicon:v(function(){return[V(t.$slots,t.$slots.chipicon?"chipicon":"removetokenicon",{class:G(t.cx("chipIcon")),item:O,removeCallback:function(K){return i.removeOption(K,O)}})]}),_:2},1032,["class","label","removeIcon","unstyled","onRemove","pt"])]})],16)}),128)),!t.d_value||t.d_value.length===0?(d(),u(M,{key:3},[j(z(t.placeholder||"empty"),1)],64)):x("",!0)],64)):x("",!0)]})],16,Zs)],16),i.isClearIconVisible?V(t.$slots,"clearicon",{key:0,class:G(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(d(),$(de(t.clearIcon?"i":"TimesIcon"),p({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):x("",!0),h("div",p({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?V(t.$slots,"loadingicon",{key:0,class:G(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(d(),u("span",p({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(d(),$(c,p({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):V(t.$slots,"dropdownicon",{key:1,class:G(t.cx("dropdownIcon"))},function(){return[(d(),$(de(t.dropdownIcon?"span":"ChevronDownIcon"),p({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(D,{appendTo:t.appendTo},{default:v(function(){return[r(Ne,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[o.overlayVisible?(d(),u("div",p({key:0,ref:i.overlayRef,style:[t.panelStyle,t.overlayStyle],class:[t.cx("overlay"),t.panelClass,t.overlayClass],onClick:e[5]||(e[5]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[h("span",p({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[3]||(e[3]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),V(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.showToggleAll&&t.selectionLimit==null||t.filter?(d(),u("div",p({key:0,class:t.cx("header")},t.ptm("header")),[t.showToggleAll&&t.selectionLimit==null?(d(),$(f,{key:0,modelValue:i.allSelected,binary:!0,disabled:t.disabled,variant:t.variant,"aria-label":i.toggleAllAriaLabel,onChange:i.onToggleAll,unstyled:t.unstyled,pt:i.getHeaderCheckboxPTOptions("pcHeaderCheckbox"),formControl:{novalidate:!0}},{icon:v(function(O){return[t.$slots.headercheckboxicon?(d(),$(de(t.$slots.headercheckboxicon),{key:0,checked:O.checked,class:G(O.class)},null,8,["checked","class"])):O.checked?(d(),$(de(t.checkboxIcon?"span":"CheckIcon"),p({key:1,class:[O.class,Zt({},t.checkboxIcon,O.checked)]},i.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon")),null,16,["class"])):x("",!0)]}),_:1},8,["modelValue","disabled","variant","aria-label","onChange","unstyled","pt"])):x("",!0),t.filter?(d(),$(E,{key:1,class:G(t.cx("pcFilterContainer")),unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(g,{ref:"filterInput",value:o.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:G(t.cx("pcFilter")),placeholder:t.filterPlaceholder,disabled:t.disabled,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","disabled","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(I,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[V(t.$slots,"filtericon",{},function(){return[t.filterIcon?(d(),u("span",p({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(d(),$(w,nn(p({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["class","unstyled","pt"])):x("",!0),t.filter?(d(),u("span",p({key:2,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)):x("",!0)],16)):x("",!0),h("div",p({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(U,p({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),ln({content:v(function(O){var B=O.styleClass,A=O.contentRef,K=O.items,C=O.getItemOptions,re=O.contentStyle,_=O.itemSize;return[h("ul",p({ref:function(F){return i.listRef(F,A)},id:t.$id+"_list",class:[t.cx("list"),B],style:re,role:"listbox","aria-multiselectable":"true","aria-label":i.listAriaLabel},t.ptm("list")),[(d(!0),u(M,null,oe(K,function(L,F){return d(),u(M,{key:i.getOptionRenderKey(L,i.getOptionIndex(F,C))},[i.isOptionGroup(L)?(d(),u("li",p({key:0,id:t.$id+"_"+i.getOptionIndex(F,C),style:{height:_?_+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[V(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(F,C)},function(){return[j(z(i.getOptionGroupLabel(L.optionGroup)),1)]})],16,Qs)):Ge((d(),u("li",p({key:1,id:t.$id+"_"+i.getOptionIndex(F,C),style:{height:_?_+"px":void 0},class:t.cx("option",{option:L,index:F,getItemOptions:C}),role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(F,C)),onClick:function(Q){return i.onOptionSelect(Q,L,i.getOptionIndex(F,C),!0)},onMousemove:function(Q){return i.onOptionMouseMove(Q,i.getOptionIndex(F,C))}},{ref_for:!0},i.getCheckboxPTOptions(L,C,F,"option"),{"data-p-selected":i.isSelected(L),"data-p-focused":o.focusedOptionIndex===i.getOptionIndex(F,C),"data-p-disabled":i.isOptionDisabled(L)}),[r(f,{defaultValue:i.isSelected(L),binary:!0,tabindex:-1,variant:t.variant,unstyled:t.unstyled,pt:i.getCheckboxPTOptions(L,C,F,"pcOptionCheckbox"),formControl:{novalidate:!0}},{icon:v(function(Z){return[t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon?(d(),$(de(t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon),{key:0,checked:Z.checked,class:G(Z.class)},null,8,["checked","class"])):Z.checked?(d(),$(de(t.checkboxIcon?"span":"CheckIcon"),p({key:1,class:[Z.class,Zt({},t.checkboxIcon,Z.checked)]},{ref_for:!0},i.getCheckboxPTOptions(L,C,F,"pcOptionCheckbox.icon")),null,16,["class"])):x("",!0)]}),_:2},1032,["defaultValue","variant","unstyled","pt"]),V(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(F,C)},function(){return[h("span",p({ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,ea)),[[P]])],64)}),128)),o.filterValue&&(!K||K&&K.length===0)?(d(),u("li",p({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[V(t.$slots,"emptyfilter",{},function(){return[j(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(d(),u("li",p({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[V(t.$slots,"empty",{},function(){return[j(z(i.emptyMessageText),1)]})],16)):x("",!0)],16,Js)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(O){var B=O.options;return[V(t.$slots,"loader",{options:B})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),V(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(d(),u("span",p({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):x("",!0),h("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),h("span",p({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[4]||(e[4]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Ys)):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,qs)}Gs.render=ta;var na=`
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
`,ia={mask:function(e){var n=e.position,l=e.modal;return{position:"fixed",height:"100%",width:"100%",left:0,top:0,display:"flex",justifyContent:n==="left"?"flex-start":n==="right"?"flex-end":"center",alignItems:n==="top"?"flex-start":n==="bottom"?"flex-end":"center",pointerEvents:l?"auto":"none"}},root:{pointerEvents:"auto"}},la={mask:function(e){var n=e.instance,l=e.props,o=["left","right","top","bottom"],i=o.find(function(m){return m===l.position});return["p-drawer-mask",{"p-overlay-mask p-overlay-mask-enter-active":l.modal,"p-drawer-open":n.containerVisible,"p-drawer-full":n.fullScreen},i?"p-drawer-".concat(i):""]},root:function(e){var n=e.instance;return["p-drawer p-component",{"p-drawer-full":n.fullScreen}]},header:"p-drawer-header",title:"p-drawer-title",pcCloseButton:"p-drawer-close-button",content:"p-drawer-content",footer:"p-drawer-footer"},oa=he.extend({name:"drawer",style:na,classes:la,inlineStyles:ia}),sa={name:"BaseDrawer",extends:ke,props:{visible:{type:Boolean,default:!1},position:{type:String,default:"left"},header:{type:null,default:null},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},dismissable:{type:Boolean,default:!0},showCloseIcon:{type:Boolean,default:!0},closeButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}},closeIcon:{type:String,default:void 0},modal:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!1},closeOnEscape:{type:Boolean,default:!0}},style:oa,provide:function(){return{$pcDrawer:this,$parentInstance:this}}};function Ue(t){"@babel/helpers - typeof";return Ue=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ue(t)}function ct(t,e,n){return(e=aa(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function aa(t){var e=ra(t,"string");return Ue(e)=="symbol"?e:e+""}function ra(t,e){if(Ue(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ue(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var da={name:"Drawer",extends:sa,inheritAttrs:!1,emits:["update:visible","show","after-show","hide","after-hide","before-hide"],data:function(){return{containerVisible:this.visible}},container:null,mask:null,content:null,headerContainer:null,footerContainer:null,closeButton:null,outsideClickListener:null,documentKeydownListener:null,watch:{dismissable:function(e){e&&!this.modal?this.bindOutsideClickListener():this.unbindOutsideClickListener()}},updated:function(){this.visible&&(this.containerVisible=this.visible)},beforeUnmount:function(){this.disableDocumentSettings(),this.mask&&this.autoZIndex&&ae.clear(this.mask),this.container=null,this.mask=null},methods:{hide:function(){this.$emit("update:visible",!1)},onEnter:function(){this.$emit("show"),this.focus(),this.bindDocumentKeyDownListener(),this.autoZIndex&&ae.set("modal",this.mask,this.baseZIndex||this.$primevue.config.zIndex.modal)},onAfterEnter:function(){this.enableDocumentSettings(),this.$emit("after-show")},onBeforeLeave:function(){this.modal&&!this.isUnstyled&&pt(this.mask,"p-overlay-mask-leave-active"),this.$emit("before-hide")},onLeave:function(){this.$emit("hide")},onAfterLeave:function(){this.autoZIndex&&ae.clear(this.mask),this.unbindDocumentKeyDownListener(),this.containerVisible=!1,this.disableDocumentSettings(),this.$emit("after-hide")},onMaskClick:function(e){this.dismissable&&this.modal&&this.mask===e.target&&this.hide()},focus:function(){var e=function(o){return o&&o.querySelector("[autofocus]")},n=this.$slots.header&&e(this.headerContainer);n||(n=this.$slots.default&&e(this.container),n||(n=this.$slots.footer&&e(this.footerContainer),n||(n=this.closeButton))),n&&J(n)},enableDocumentSettings:function(){this.dismissable&&!this.modal&&this.bindOutsideClickListener(),this.blockScroll&&Tn()},disableDocumentSettings:function(){this.unbindOutsideClickListener(),this.blockScroll&&$n()},onKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&this.hide()},containerRef:function(e){this.container=e},maskRef:function(e){this.mask=e},contentRef:function(e){this.content=e},headerContainerRef:function(e){this.headerContainer=e},footerContainerRef:function(e){this.footerContainer=e},closeButtonRef:function(e){this.closeButton=e?e.$el:void 0},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeydown,document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},isOutsideClicked:function(e){return this.container&&!this.container.contains(e.target)}},computed:{fullScreen:function(){return this.position==="full"},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return se(ct(ct(ct({"full-screen":this.position==="full"},this.position,this.position),"open",this.containerVisible),"modal",this.modal))}},directives:{focustrap:Fn},components:{Button:me,Portal:Re,TimesIcon:Lt}},ua=["data-p"],ca=["role","aria-modal","data-p"];function pa(t,e,n,l,o,i){var m=N("Button"),c=N("Portal"),f=je("focustrap");return d(),$(c,null,{default:v(function(){return[o.containerVisible?(d(),u("div",p({key:0,ref:i.maskRef,onMousedown:e[0]||(e[0]=function(){return i.onMaskClick&&i.onMaskClick.apply(i,arguments)}),class:t.cx("mask"),style:t.sx("mask",!0,{position:t.position,modal:t.modal}),"data-p":i.dataP},t.ptm("mask")),[r(Ne,p({name:"p-drawer",onEnter:i.onEnter,onAfterEnter:i.onAfterEnter,onBeforeLeave:i.onBeforeLeave,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave,appear:""},t.ptm("transition")),{default:v(function(){return[t.visible?Ge((d(),u("div",p({key:0,ref:i.containerRef,class:t.cx("root"),style:t.sx("root"),role:t.modal?"dialog":"complementary","aria-modal":t.modal?!0:void 0,"data-p":i.dataP},t.ptmi("root")),[t.$slots.container?V(t.$slots,"container",{key:0,closeCallback:i.hide}):(d(),u(M,{key:1},[h("div",p({ref:i.headerContainerRef,class:t.cx("header")},t.ptm("header")),[V(t.$slots,"header",{class:G(t.cx("title"))},function(){return[t.header?(d(),u("div",p({key:0,class:t.cx("title")},t.ptm("title")),z(t.header),17)):x("",!0)]}),t.showCloseIcon?V(t.$slots,"closebutton",{key:0,closeCallback:i.hide},function(){return[r(m,p({ref:i.closeButtonRef,type:"button",class:t.cx("pcCloseButton"),"aria-label":i.closeAriaLabel,unstyled:t.unstyled,onClick:i.hide},t.closeButtonProps,{pt:t.ptm("pcCloseButton"),"data-pc-group-section":"iconcontainer"}),{icon:v(function(g){return[V(t.$slots,"closeicon",{},function(){return[(d(),$(de(t.closeIcon?"span":"TimesIcon"),p({class:[t.closeIcon,g.class]},t.ptm("pcCloseButton").icon),null,16,["class"]))]})]}),_:3},16,["class","aria-label","unstyled","onClick","pt"])]}):x("",!0)],16),h("div",p({ref:i.contentRef,class:t.cx("content")},t.ptm("content")),[V(t.$slots,"default")],16),t.$slots.footer?(d(),u("div",p({key:0,ref:i.footerContainerRef,class:t.cx("footer")},t.ptm("footer")),[V(t.$slots,"footer")],16)):x("",!0)],64))],16,ca)),[[f]]):x("",!0)]}),_:3},16,["onEnter","onAfterEnter","onBeforeLeave","onLeave","onAfterLeave"])],16,ua)):x("",!0)]}),_:3})}da.render=pa;function Oa(t){const e=_e(),n=tt(),l=R(null);async function o(i,m={},c){l.value=i;try{await ue.post(`/api/tracks/${t()}/jobs/${i}`,m),n.loadActiveJobs(),c&&e.info(c)}catch(f){e.error(f)}finally{l.value=null}}return{run:o,starting:l}}function ha(t,e){if(t&&e&&typeof t=="object"&&typeof e=="object"&&!Array.isArray(t)){const n={};for(const[l,o]of Object.entries(t)){const i=ha(o,e[l]);i!==void 0&&(n[l]=i)}return Object.keys(n).length?n:void 0}return JSON.stringify(t)===JSON.stringify(e)?void 0:t}export{rn as S,wa as _,va as a,da as b,ye as c,Gs as d,ne as e,pn as f,ha as g,Oa as h,ya as i,ga as m,Wn as s,ka as u};
