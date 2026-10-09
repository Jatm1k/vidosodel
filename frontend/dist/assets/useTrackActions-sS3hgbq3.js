import{O as vn,P as pe,Q as Re,R as yt,S as we,T as oe,Y as Ye,U as Je,V as Qe,W as Fe,X as ae,Z as kt,_ as Y,$ as _e,a0 as Te,a1 as p,a2 as gn,L as Ue,k as d,c as u,b as m,K as je,m as $,q as j,a3 as de,f as O,t as z,j as G,w as v,e as r,a4 as Ge,J as C,F as M,r as le,l as _,x as Ne,u as et,n as ce,a5 as qt,a6 as ut,a7 as yn,a8 as wt,a9 as tt,aa as Ot,ab as We,ac as Ve,ad as Me,ae as It,af as xt,B as Ze,ag as nt,ah as he,ai as _t,aj as xe,ak as Se,al as Wt,am as Zt,an as Xt,ao as kn,ap as Yt,aq as ue,ar as Jt,p as Qt,s as en,d as St,v as tn,h as X,y as st,a as wn,g as b,z as On,A as Xe,C as ke,i as Z,o as In,G as rt,as as xn,at as Sn,au as Ln,av as Cn,aw as Vn,ax as Mn}from"./index-zRjWAgOQ.js";import{a as ie,s as te}from"./index-DF5gVO0m.js";import{s as me}from"./index-BX2_x_GS.js";var it=vn(),zn=`
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
`,Fn={root:function(e){var n=e.props;return["p-menu p-component",{"p-menu-overlay":n.popup}]},start:"p-menu-start",list:"p-menu-list",submenuLabel:"p-menu-submenu-label",separator:"p-menu-separator",end:"p-menu-end",item:function(e){var n=e.instance;return["p-menu-item",{"p-focus":n.id===n.focusedOptionId,"p-disabled":n.disabled()}]},itemContent:"p-menu-item-content",itemLink:"p-menu-item-link",itemIcon:"p-menu-item-icon",itemLabel:"p-menu-item-label"},Tn=pe.extend({name:"menu",style:zn,classes:Fn}),$n={name:"BaseMenu",extends:we,props:{popup:{type:Boolean,default:!1},model:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Tn,provide:function(){return{$pcMenu:this,$parentInstance:this}}},nn={name:"Menuitem",hostName:"Menu",extends:we,inheritAttrs:!1,emits:["item-click","item-mousemove"],props:{item:null,templates:null,id:null,focusedOptionId:null,index:null},methods:{getItemProp:function(e,n){return e&&e.item?gn(e.item[n]):void 0},getPTOptions:function(e){return this.ptm(e,{context:{item:this.item,index:this.index,focused:this.isItemFocused(),disabled:this.disabled()}})},isItemFocused:function(){return this.focusedOptionId===this.id},onItemClick:function(e){var n=this.getItemProp(this.item,"command");n&&n({originalEvent:e,item:this.item.item}),this.$emit("item-click",{originalEvent:e,item:this.item,id:this.id})},onItemMouseMove:function(e){this.$emit("item-mousemove",{originalEvent:e,item:this.item,id:this.id})},visible:function(){return typeof this.item.visible=="function"?this.item.visible():this.item.visible!==!1},disabled:function(){return typeof this.item.disabled=="function"?this.item.disabled():this.item.disabled},label:function(){return typeof this.item.label=="function"?this.item.label():this.item.label},getMenuItemProps:function(e){return{action:p({class:this.cx("itemLink"),tabindex:"-1"},this.getPTOptions("itemLink")),icon:p({class:[this.cx("itemIcon"),e.icon]},this.getPTOptions("itemIcon")),label:p({class:this.cx("itemLabel")},this.getPTOptions("itemLabel"))}}},computed:{dataP:function(){return oe({focus:this.isItemFocused(),disabled:this.disabled()})}},directives:{ripple:yt}},Pn=["id","aria-label","aria-disabled","data-p-focused","data-p-disabled","data-p"],An=["data-p"],En=["href","target"],Dn=["data-p"],Bn=["data-p"];function Hn(t,e,n,l,o,i){var f=Ue("ripple");return i.visible()?(d(),u("li",p({key:0,id:n.id,class:[t.cx("item"),n.item.class],role:"menuitem",style:n.item.style,"aria-label":i.label(),"aria-disabled":i.disabled(),"data-p-focused":i.isItemFocused(),"data-p-disabled":i.disabled()||!1,"data-p":i.dataP},i.getPTOptions("item")),[m("div",p({class:t.cx("itemContent"),onClick:e[0]||(e[0]=function(c){return i.onItemClick(c)}),onMousemove:e[1]||(e[1]=function(c){return i.onItemMouseMove(c)}),"data-p":i.dataP},i.getPTOptions("itemContent")),[n.templates.item?n.templates.item?(d(),$(de(n.templates.item),{key:1,item:n.item,label:i.label(),props:i.getMenuItemProps(n.item)},null,8,["item","label","props"])):O("",!0):je((d(),u("a",p({key:0,href:n.item.url,class:t.cx("itemLink"),target:n.item.target,tabindex:"-1"},i.getPTOptions("itemLink")),[n.templates.itemicon?(d(),$(de(n.templates.itemicon),{key:0,item:n.item,class:j(t.cx("itemIcon"))},null,8,["item","class"])):n.item.icon?(d(),u("span",p({key:1,class:[t.cx("itemIcon"),n.item.icon],"data-p":i.dataP},i.getPTOptions("itemIcon")),null,16,Dn)):O("",!0),m("span",p({class:t.cx("itemLabel"),"data-p":i.dataP},i.getPTOptions("itemLabel")),z(i.label()),17,Bn)],16,En)),[[f]])],16,An)],16,Pn)):O("",!0)}nn.render=Hn;function Pt(t){return jn(t)||Un(t)||Rn(t)||Kn()}function Kn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Rn(t,e){if(t){if(typeof t=="string")return ct(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ct(t,e):void 0}}function Un(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function jn(t){if(Array.isArray(t))return ct(t)}function ct(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Gn={name:"Menu",extends:$n,inheritAttrs:!1,emits:["show","hide","focus","blur"],data:function(){return{overlayVisible:!1,focused:!1,focusedOptionIndex:-1,selectedOptionIndex:-1}},target:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,list:null,mounted:function(){this.popup||(this.bindResizeListener(),this.bindOutsideClickListener())},beforeUnmount:function(){this.unbindResizeListener(),this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.target=null,this.container&&this.autoZIndex&&ae.clear(this.container),this.container=null},methods:{itemClick:function(e){var n=e.item;this.disabled(n)||(n.command&&n.command(e),this.overlayVisible&&this.hide(),!this.popup&&this.focusedOptionIndex!==e.id&&(this.focusedOptionIndex=e.id))},itemMouseMove:function(e){this.focused&&(this.focusedOptionIndex=e.id)},onListFocus:function(e){this.focused=!0,!this.popup&&this.changeFocusedOptionIndex(0),this.$emit("focus",e)},onListBlur:function(e){this.focused=!1,this.focusedOptionIndex=-1,this.$emit("blur",e)},onListKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Space":this.onSpaceKey(e);break;case"Escape":this.popup&&(Y(this.target),this.hide());case"Tab":this.overlayVisible&&this.hide();break}},onArrowDownKey:function(e){var n=this.findNextOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.popup)Y(this.target),this.hide(),e.preventDefault();else{var n=this.findPrevOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()}},onHomeKey:function(e){this.changeFocusedOptionIndex(0),e.preventDefault()},onEndKey:function(e){this.changeFocusedOptionIndex(_e(this.container,'li[data-pc-section="item"][data-p-disabled="false"]').length-1),e.preventDefault()},onEnterKey:function(e){var n=Te(this.list,'li[id="'.concat("".concat(this.focusedOptionIndex),'"]')),l=n&&Te(n,'a[data-pc-section="itemlink"]');this.popup&&Y(this.target),l?l.click():n&&n.click(),e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},findNextOptionIndex:function(e){var n=_e(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Pt(n).findIndex(function(o){return o.id===e});return l>-1?l+1:0},findPrevOptionIndex:function(e){var n=_e(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=Pt(n).findIndex(function(o){return o.id===e});return l>-1?l-1:0},changeFocusedOptionIndex:function(e){var n=_e(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=e>=n.length?n.length-1:e<0?0:e;l>-1&&(this.focusedOptionIndex=n[l].getAttribute("id"))},toggle:function(e,n){this.overlayVisible?this.hide():this.show(e,n)},show:function(e,n){this.overlayVisible=!0,this.target=n??e.currentTarget},hide:function(){this.overlayVisible=!1,this.target=null},onEnter:function(e){kt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.bindOutsideClickListener(),this.bindResizeListener(),this.bindScrollListener(),this.autoZIndex&&ae.set("menu",e,this.baseZIndex||this.$primevue.config.zIndex.menu),this.popup&&Y(this.list),this.$emit("show")},onLeave:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindScrollListener(),this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&ae.clear(e)},alignOverlay:function(){Qe(this.container,this.target);var e=Fe(this.target);e>Fe(this.container)&&(this.container.style.minWidth=Fe(this.target)+"px")},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=e.container&&!e.container.contains(n.target),o=!(e.target&&(e.target===n.target||e.target.contains(n.target)));e.overlayVisible&&l&&o?e.hide():!e.popup&&l&&o&&(e.focusedOptionIndex=-1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Je(this.target,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Ye()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},visible:function(e){return typeof e.visible=="function"?e.visible():e.visible!==!1},disabled:function(e){return typeof e.disabled=="function"?e.disabled():e.disabled},label:function(e){return typeof e.label=="function"?e.label():e.label},onOverlayClick:function(e){it.emit("overlay-click",{originalEvent:e,target:this.target})},containerRef:function(e){this.container=e},listRef:function(e){this.list=e}},computed:{focusedOptionId:function(){return this.focusedOptionIndex!==-1?this.focusedOptionIndex:null},dataP:function(){return oe({popup:this.popup})}},components:{PVMenuitem:nn,Portal:Re}},Nn=["id","data-p"],qn=["id","tabindex","aria-activedescendant","aria-label","aria-labelledby"],_n=["id"];function Wn(t,e,n,l,o,i){var f=G("PVMenuitem"),c=G("Portal");return d(),$(c,{appendTo:t.appendTo,disabled:!t.popup},{default:v(function(){return[r(Ge,p({name:"p-anchored-overlay",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:v(function(){return[!t.popup||o.overlayVisible?(d(),u("div",p({key:0,ref:i.containerRef,id:t.$id,class:t.cx("root"),onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),"data-p":i.dataP},t.ptmi("root")),[t.$slots.start?(d(),u("div",p({key:0,class:t.cx("start")},t.ptm("start")),[C(t.$slots,"start")],16)):O("",!0),m("ul",p({ref:i.listRef,id:t.$id+"_list",class:t.cx("list"),role:"menu",tabindex:t.tabindex,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,onFocus:e[0]||(e[0]=function(){return i.onListFocus&&i.onListFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onListBlur&&i.onListBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onListKeyDown&&i.onListKeyDown.apply(i,arguments)})},t.ptm("list")),[(d(!0),u(M,null,le(t.model,function(h,g){return d(),u(M,{key:i.label(h)+g.toString()},[h.items&&i.visible(h)&&!h.separator?(d(),u(M,{key:0},[h.items?(d(),u("li",p({key:0,id:t.$id+"_"+g,class:[t.cx("submenuLabel"),h.class],role:"none"},{ref_for:!0},t.ptm("submenuLabel")),[C(t.$slots,t.$slots.submenulabel?"submenulabel":"submenuheader",{item:h},function(){return[_(z(i.label(h)),1)]})],16,_n)):O("",!0),(d(!0),u(M,null,le(h.items,function(w,S){return d(),u(M,{key:w.label+g+"_"+S},[i.visible(w)&&!w.separator?(d(),$(f,{key:0,id:t.$id+"_"+g+"_"+S,item:w,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"])):i.visible(w)&&w.separator?(d(),u("li",p({key:"separator"+g+S,class:[t.cx("separator"),h.class],style:w.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):O("",!0)],64)}),128))],64)):i.visible(h)&&h.separator?(d(),u("li",p({key:"separator"+g.toString(),class:[t.cx("separator"),h.class],style:h.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):(d(),$(f,{key:i.label(h)+g.toString(),id:t.$id+"_"+g,item:h,index:g,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","index","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"]))],64)}),128))],16,qn),t.$slots.end?(d(),u("div",p({key:1,class:t.cx("end")},t.ptm("end")),[C(t.$slots,"end")],16)):O("",!0)],16,Nn)):O("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo","disabled"])}Gn.render=Wn;const ln=[{id:"draft",title:"Черновик",hint:"Сценарий без озвучки"},{id:"voiced",title:"Озвучено",hint:"Ждёт раскадровку"},{id:"storyboard",title:"Раскадровка",hint:"Картинки готовы, нужен монтаж"},{id:"video",title:"Смонтировано",hint:"Видео собрано, надо проверить"},{id:"ready",title:"Готово",hint:"Проверено, можно выкладывать"},{id:"published",title:"Выложено",hint:""}],At=t=>ln.findIndex(e=>e.id===t),ns=t=>ln.find(e=>e.id===t)?.title??t,Zn=[{label:"До озвучки",icon:"pi pi-microphone",steps:["translate","voice"],below:"voiced"},{label:"До раскадровки",icon:"pi pi-images",steps:["translate","voice","scenes","characters","prompts","images"],below:"storyboard"},{label:"До видео",icon:"pi pi-video",steps:["translate","voice","scenes","characters","prompts","images","render"],below:"video"},{label:"Весь конвейер",icon:"pi pi-play",steps:null,below:"ready"}],is=t=>t?new Date(t*1e3).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):"";async function ls(t,e){try{await ce.patch(`/api/tracks/${t}`,e)}catch(n){Ne().error(n)}}function os(t){const e=Ne(),n=et();async function l(c,h){try{const g=await ce.post(`/api/projects/${c.id}/run`,h?{steps:h}:{});e.info(g.message,c.name),n.loadActiveJobs(),t()}catch(g){e.error(g)}}async function o(c,h){try{await ce.post(`/api/projects/${c.id}/mark`,h),t()}catch(g){e.error(g)}}async function i(c){try{await ce.post(`/api/projects/${c.id}/cancel`),n.loadActiveJobs(),t()}catch(h){e.error(h)}}function f(c,h){const g=At(c.status),w=c.tracks_status.some(A=>A.has_script),S=c.status==="published",T=c.tracks_status.some(A=>A.published_at),H=[];if(h)H.push({label:"Остановить",icon:"pi pi-stop",command:()=>i(c)});else{const A=Zn.filter(I=>g<At(I.below));A.length&&H.push({label:"Довести до…",items:A.map(I=>({label:I.label,icon:I.icon,disabled:!w,command:()=>l(c,I.steps)}))})}const B=[];return c.status==="video"&&B.push({label:"Проверено",icon:"pi pi-check",command:()=>o(c,{approved:!0})}),c.status==="ready"&&B.push({label:"Снять «проверено»",icon:"pi pi-undo",command:()=>o(c,{approved:!1})}),S||B.push({label:"Выложено",icon:"pi pi-send",command:()=>o(c,{published:!0})}),T&&B.push({label:"Снять «выложено»",icon:"pi pi-undo",command:()=>o(c,{published:!1})}),B.length&&H.push({label:"Отметить",items:B}),H}return{runUntil:l,mark:o,stop:i,menuFor:f}}var Xn=`
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
`,Yn={root:"p-colorpicker p-component",preview:function(e){var n=e.props;return["p-colorpicker-preview",{"p-disabled":n.disabled}]},panel:function(e){var n=e.instance,l=e.props;return["p-colorpicker-panel",{"p-colorpicker-panel-inline":l.inline,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},colorSelector:"p-colorpicker-color-selector",colorBackground:"p-colorpicker-color-background",colorHandle:"p-colorpicker-color-handle",hue:"p-colorpicker-hue",hueHandle:"p-colorpicker-hue-handle"},Jn=pe.extend({name:"colorpicker",style:Xn,classes:Yn}),Qn={name:"BaseColorPicker",extends:qt,props:{defaultColor:{type:null,default:"ff0000"},inline:{type:Boolean,default:!1},format:{type:String,default:"hex"},tabindex:{type:String,default:null},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},appendTo:{type:[String,Object],default:"body"},inputId:{type:String,default:null},panelClass:null,overlayClass:null},style:Jn,provide:function(){return{$pcColorPicker:this,$parentInstance:this}}},Ie={name:"ColorPicker",extends:Qn,inheritAttrs:!1,emits:["change","show","hide"],data:function(){return{overlayVisible:!1}},hsbValue:null,localHue:null,outsideClickListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,scrollHandler:null,resizeListener:null,hueDragging:null,colorDragging:null,selfUpdate:null,picker:null,colorSelector:null,colorHandle:null,hueView:null,hueHandle:null,watch:{modelValue:{immediate:!0,handler:function(e){this.hsbValue=this.toHSB(e),this.selfUpdate?this.selfUpdate=!1:this.updateUI()}}},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindDragListeners(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.picker&&this.autoZIndex&&ae.clear(this.picker),this.clearRefs()},mounted:function(){this.updateUI()},methods:{pickColor:function(e){var n=this.colorSelector.getBoundingClientRect(),l=n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),o=n.left+document.body.scrollLeft,i=Math.floor(100*Math.max(0,Math.min(150,(e.pageX||e.changedTouches[0].pageX)-o))/150),f=Math.floor(100*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-l)))/150);this.hsbValue=this.validateHSB({h:this.localHue,s:i,b:f}),this.selfUpdate=!0,this.updateColorHandle(),this.updateInput(),this.updateModel(e)},pickHue:function(e){var n=this.hueView.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);this.localHue=Math.floor(360*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-n)))/150),this.hsbValue=this.validateHSB({h:this.localHue,s:this.hsbValue.s,b:this.hsbValue.b}),this.selfUpdate=!0,this.updateColorSelector(),this.updateHue(),this.updateModel(e),this.updateInput()},updateModel:function(e){var n=this.d_value;switch(this.format){case"hex":n=this.HSBtoHEX(this.hsbValue);break;case"rgb":n=this.HSBtoRGB(this.hsbValue);break;case"hsb":n=this.hsbValue;break}this.writeValue(n,e),this.$emit("change",{event:e,value:n})},updateColorSelector:function(){if(this.colorSelector){var e=this.validateHSB({h:this.hsbValue.h,s:100,b:100});this.colorSelector.style.backgroundColor="#"+this.HSBtoHEX(e)}},updateColorHandle:function(){this.colorHandle&&(this.colorHandle.style.left=Math.floor(150*this.hsbValue.s/100)+"px",this.colorHandle.style.top=Math.floor(150*(100-this.hsbValue.b)/100)+"px")},updateHue:function(){this.hueHandle&&(this.hueHandle.style.top=Math.floor(150-150*this.hsbValue.h/360)+"px")},updateInput:function(){this.$refs.input&&(this.$refs.input.style.backgroundColor="#"+this.HSBtoHEX(this.hsbValue))},updateUI:function(){this.updateHue(),this.updateColorHandle(),this.updateInput(),this.updateColorSelector()},validateHSB:function(e){return{h:Math.min(360,Math.max(0,e.h)),s:Math.min(100,Math.max(0,e.s)),b:Math.min(100,Math.max(0,e.b))}},validateRGB:function(e){return{r:Math.min(255,Math.max(0,e.r)),g:Math.min(255,Math.max(0,e.g)),b:Math.min(255,Math.max(0,e.b))}},validateHEX:function(e){var n=6-e.length;if(n>0){for(var l=[],o=0;o<n;o++)l.push("0");l.push(e),e=l.join("")}return e},HEXtoRGB:function(e){var n=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:n>>16,g:(n&65280)>>8,b:n&255}},HEXtoHSB:function(e){return this.RGBtoHSB(this.HEXtoRGB(e))},RGBtoHSB:function(e){var n={h:0,s:0,b:0},l=Math.min(e.r,e.g,e.b),o=Math.max(e.r,e.g,e.b),i=o-l;return n.b=o,n.s=o!==0?255*i/o:0,n.s!==0?e.r===o?n.h=(e.g-e.b)/i:e.g===o?n.h=2+(e.b-e.r)/i:n.h=4+(e.r-e.g)/i:n.h=-1,n.h*=60,n.h<0&&(n.h+=360),n.s*=100/255,n.b*=100/255,n},HSBtoRGB:function(e){var n={r:null,g:null,b:null},l=Math.round(e.h),o=Math.round(e.s*255/100),i=Math.round(e.b*255/100);if(o===0)n={r:i,g:i,b:i};else{var f=i,c=(255-o)*i/255,h=(f-c)*(l%60)/60;l===360&&(l=0),l<60?(n.r=f,n.b=c,n.g=c+h):l<120?(n.g=f,n.b=c,n.r=f-h):l<180?(n.g=f,n.r=c,n.b=c+h):l<240?(n.b=f,n.r=c,n.g=f-h):l<300?(n.b=f,n.g=c,n.r=c+h):l<360?(n.r=f,n.g=c,n.b=f-h):(n.r=0,n.g=0,n.b=0)}return{r:Math.round(n.r),g:Math.round(n.g),b:Math.round(n.b)}},RGBtoHEX:function(e){var n=[e.r.toString(16),e.g.toString(16),e.b.toString(16)];for(var l in n)n[l].length===1&&(n[l]="0"+n[l]);return n.join("")},HSBtoHEX:function(e){return this.RGBtoHEX(this.HSBtoRGB(e))},toHSB:function(e){var n;if(e)switch(this.format){case"hex":n=this.HEXtoHSB(e);break;case"rgb":n=this.RGBtoHSB(e);break;case"hsb":n=e;break}else n=this.HEXtoHSB(this.defaultColor);return n.s===0||n.b===0?n.h=this.localHue:this.localHue=n.h,n},onOverlayEnter:function(e){this.updateUI(),this.alignOverlay(),this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&ae.set("overlay",e,this.baseZIndex||this.$primevue.config.zIndex.overlay),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),this.$emit("show")},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.clearRefs(),this.$emit("hide")},onOverlayAfterLeave:function(e){this.autoZIndex&&ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?wt(this.picker,this.$refs.input):Qe(this.picker,this.$refs.input)},onInputClick:function(){this.disabled||(this.overlayVisible=!this.overlayVisible)},onInputKeydown:function(e){switch(e.code){case"Space":this.overlayVisible=!this.overlayVisible,e.preventDefault();break;case"Escape":case"Tab":this.overlayVisible=!1;break}},onInputBlur:function(e){var n,l;(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onColorMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onColorDragStart(e))},onColorDragStart:function(e){this.disabled||(this.colorDragging=!0,this.pickColor(e),this.$el.setAttribute("p-colorpicker-dragging","true"),!this.isUnstyled&&ut(this.$el,"p-colorpicker-dragging"),e.preventDefault())},onDrag:function(e){this.colorDragging&&(this.pickColor(e),e.preventDefault()),this.hueDragging&&(this.pickHue(e),e.preventDefault())},onDragEnd:function(){this.colorDragging=!1,this.hueDragging=!1,this.$el.setAttribute("p-colorpicker-dragging","false"),!this.isUnstyled&&yn(this.$el,"p-colorpicker-dragging"),this.unbindDragListeners()},onHueMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onHueDragStart(e))},onHueDragStart:function(e){this.disabled||(this.hueDragging=!0,this.pickHue(e),!this.isUnstyled&&ut(this.$el,"p-colorpicker-dragging"),e.preventDefault())},isInputClicked:function(e){return this.$refs.input&&this.$refs.input.isSameNode(e.target)},bindDragListeners:function(){this.bindDocumentMouseMoveListener(),this.bindDocumentMouseUpListener()},unbindDragListeners:function(){this.unbindDocumentMouseMoveListener(),this.unbindDocumentMouseUpListener()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.picker&&!e.picker.contains(n.target)&&!e.isInputClicked(n)&&(e.overlayVisible=!1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Je(this.$refs.container,function(){e.overlayVisible&&(e.overlayVisible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Ye()&&(e.overlayVisible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindDocumentMouseMoveListener:function(){this.documentMouseMoveListener||(this.documentMouseMoveListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.documentMouseMoveListener))},unbindDocumentMouseMoveListener:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null)},bindDocumentMouseUpListener:function(){this.documentMouseUpListener||(this.documentMouseUpListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseUpListener:function(){this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},pickerRef:function(e){this.picker=e},colorSelectorRef:function(e){this.colorSelector=e},colorHandleRef:function(e){this.colorHandle=e},hueViewRef:function(e){this.hueView=e},hueHandleRef:function(e){this.hueHandle=e},clearRefs:function(){this.picker=null,this.colorSelector=null,this.colorHandle=null,this.hueView=null,this.hueHandle=null},onOverlayClick:function(e){it.emit("overlay-click",{originalEvent:e,target:this.$el})}},components:{Portal:Re}};function $e(t){"@babel/helpers - typeof";return $e=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},$e(t)}function Et(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function Dt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Et(Object(n),!0).forEach(function(l){ei(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Et(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ei(t,e,n){return(e=ti(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ti(t){var e=ni(t,"string");return $e(e)=="symbol"?e:e+""}function ni(t,e){if($e(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if($e(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ii=["id","tabindex","disabled"];function li(t,e,n,l,o,i){var f=G("Portal");return d(),u("div",p({ref:"container",class:t.cx("root")},t.ptmi("root")),[t.inline?O("",!0):(d(),u("input",p({key:0,ref:"input",id:t.inputId,type:"text",class:t.cx("preview"),readonly:"",tabindex:t.tabindex,disabled:t.disabled,onClick:e[0]||(e[0]=function(){return i.onInputClick&&i.onInputClick.apply(i,arguments)}),onKeydown:e[1]||(e[1]=function(){return i.onInputKeydown&&i.onInputKeydown.apply(i,arguments)}),onBlur:e[2]||(e[2]=function(){return i.onInputBlur&&i.onInputBlur.apply(i,arguments)})},t.ptm("preview")),null,16,ii)),r(f,{appendTo:t.appendTo,disabled:t.inline},{default:v(function(){return[r(Ge,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[t.inline||o.overlayVisible?(d(),u("div",p({key:0,ref:i.pickerRef,class:[t.cx("panel"),t.panelClass,t.overlayClass],onClick:e[11]||(e[11]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)})},Dt(Dt({},t.ptm("panel")),t.ptm("overlay"))),[m("div",p({class:t.cx("content")},t.ptm("content")),[m("div",p({ref:i.colorSelectorRef,class:t.cx("colorSelector"),onMousedown:e[3]||(e[3]=function(c){return i.onColorMousedown(c)}),onTouchstart:e[4]||(e[4]=function(c){return i.onColorDragStart(c)}),onTouchmove:e[5]||(e[5]=function(c){return i.onDrag(c)}),onTouchend:e[6]||(e[6]=function(c){return i.onDragEnd()})},t.ptm("colorSelector")),[m("div",p({class:t.cx("colorBackground")},t.ptm("colorBackground")),[m("div",p({ref:i.colorHandleRef,class:t.cx("colorHandle")},t.ptm("colorHandle")),null,16)],16)],16),m("div",p({ref:i.hueViewRef,class:t.cx("hue"),onMousedown:e[7]||(e[7]=function(c){return i.onHueMousedown(c)}),onTouchstart:e[8]||(e[8]=function(c){return i.onHueDragStart(c)}),onTouchmove:e[9]||(e[9]=function(c){return i.onDrag(c)}),onTouchend:e[10]||(e[10]=function(c){return i.onDragEnd()})},t.ptm("hue")),[m("div",p({ref:i.hueHandleRef,class:t.cx("hueHandle")},t.ptm("hueHandle")),null,16)],16)],16)],16)):O("",!0)]}),_:1},16,["onEnter","onLeave","onAfterLeave"])]}),_:1},8,["appendTo","disabled"])],16)}Ie.render=li;var on={name:"BlankIcon",extends:tt};function oi(t){return di(t)||ri(t)||si(t)||ai()}function ai(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function si(t,e){if(t){if(typeof t=="string")return pt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?pt(t,e):void 0}}function ri(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function di(t){if(Array.isArray(t))return pt(t)}function pt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function ui(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),oi(e[0]||(e[0]=[m("rect",{width:"1",height:"1",fill:"currentColor","fill-opacity":"0"},null,-1)])),16)}on.render=ui;var Lt={name:"ChevronDownIcon",extends:tt};function ci(t){return mi(t)||fi(t)||hi(t)||pi()}function pi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function hi(t,e){if(t){if(typeof t=="string")return ht(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ht(t,e):void 0}}function fi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function mi(t){if(Array.isArray(t))return ht(t)}function ht(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function bi(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),ci(e[0]||(e[0]=[m("path",{d:"M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z",fill:"currentColor"},null,-1)])),16)}Lt.render=bi;var Ct={name:"SearchIcon",extends:tt};function vi(t){return wi(t)||ki(t)||yi(t)||gi()}function gi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function yi(t,e){if(t){if(typeof t=="string")return ft(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ft(t,e):void 0}}function ki(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function wi(t){if(Array.isArray(t))return ft(t)}function ft(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Oi(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),vi(e[0]||(e[0]=[m("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z",fill:"currentColor"},null,-1)])),16)}Ct.render=Oi;var Ii=`
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
`,xi={root:"p-iconfield"},Si=pe.extend({name:"iconfield",style:Ii,classes:xi}),Li={name:"BaseIconField",extends:we,style:Si,provide:function(){return{$pcIconField:this,$parentInstance:this}}},Vt={name:"IconField",extends:Li,inheritAttrs:!1};function Ci(t,e,n,l,o,i){return d(),u("div",p({class:t.cx("root")},t.ptmi("root")),[C(t.$slots,"default")],16)}Vt.render=Ci;var Vi={root:"p-inputicon"},Mi=pe.extend({name:"inputicon",classes:Vi}),zi={name:"BaseInputIcon",extends:we,style:Mi,props:{class:null},provide:function(){return{$pcInputIcon:this,$parentInstance:this}}},Mt={name:"InputIcon",extends:zi,inheritAttrs:!1,computed:{containerClass:function(){return[this.cx("root"),this.class]}}};function Fi(t,e,n,l,o,i){return d(),u("span",p({class:i.containerClass},t.ptmi("root"),{"aria-hidden":"true"}),[C(t.$slots,"default")],16)}Mt.render=Fi;var Ti=`
    .p-virtualscroller-loader {
        background: dt('virtualscroller.loader.mask.background');
        color: dt('virtualscroller.loader.mask.color');
    }

    .p-virtualscroller-loading-icon {
        font-size: dt('virtualscroller.loader.icon.size');
        width: dt('virtualscroller.loader.icon.size');
        height: dt('virtualscroller.loader.icon.size');
    }
`,$i=`
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
`,Bt=pe.extend({name:"virtualscroller",css:$i,style:Ti}),Pi={name:"BaseVirtualScroller",extends:we,props:{id:{type:String,default:null},style:null,class:null,items:{type:Array,default:null},itemSize:{type:[Number,Array],default:0},scrollHeight:null,scrollWidth:null,orientation:{type:String,default:"vertical"},numToleratedItems:{type:Number,default:null},delay:{type:Number,default:0},resizeDelay:{type:Number,default:10},lazy:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},loaderDisabled:{type:Boolean,default:!1},columns:{type:Array,default:null},loading:{type:Boolean,default:!1},showSpacer:{type:Boolean,default:!0},showLoader:{type:Boolean,default:!1},tabindex:{type:Number,default:0},inline:{type:Boolean,default:!1},step:{type:Number,default:0},appendOnly:{type:Boolean,default:!1},autoSize:{type:Boolean,default:!1}},style:Bt,provide:function(){return{$pcVirtualScroller:this,$parentInstance:this}},beforeMount:function(){var e;Bt.loadCSS({nonce:(e=this.$primevueConfig)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce})}};function Pe(t){"@babel/helpers - typeof";return Pe=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Pe(t)}function Ht(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function ze(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Ht(Object(n),!0).forEach(function(l){an(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Ht(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function an(t,e,n){return(e=Ai(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ai(t){var e=Ei(t,"string");return Pe(e)=="symbol"?e:e+""}function Ei(t,e){if(Pe(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Pe(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var zt={name:"VirtualScroller",extends:Pi,inheritAttrs:!1,emits:["update:numToleratedItems","scroll","scroll-index-change","lazy-load"],data:function(){var e=this.isBoth();return{first:e?{rows:0,cols:0}:0,last:e?{rows:0,cols:0}:0,page:e?{rows:0,cols:0}:0,numItemsInViewport:e?{rows:0,cols:0}:0,lastScrollPos:e?{top:0,left:0}:0,d_numToleratedItems:this.numToleratedItems,d_loading:this.loading,loaderArr:[],spacerStyle:{},contentStyle:{}}},element:null,content:null,lastScrollPos:null,scrollTimeout:null,resizeTimeout:null,defaultWidth:0,defaultHeight:0,defaultContentWidth:0,defaultContentHeight:0,isRangeChanged:!1,lazyLoadState:{},resizeListener:null,resizeObserver:null,initialized:!1,watch:{numToleratedItems:function(e){this.d_numToleratedItems=e},loading:function(e,n){this.lazy&&e!==n&&e!==this.d_loading&&(this.d_loading=e)},items:{handler:function(e,n){(!n||n.length!==(e||[]).length)&&(this.init(),this.calculateAutoSize())},deep:!0},itemSize:function(){this.init(),this.calculateAutoSize()},orientation:function(){this.lastScrollPos=this.isBoth()?{top:0,left:0}:0},scrollHeight:function(){this.init(),this.calculateAutoSize()},scrollWidth:function(){this.init(),this.calculateAutoSize()}},mounted:function(){this.viewInit(),this.lastScrollPos=this.isBoth()?{top:0,left:0}:0,this.lazyLoadState=this.lazyLoadState||{}},updated:function(){!this.initialized&&this.viewInit()},unmounted:function(){this.unbindResizeListener(),this.initialized=!1},methods:{viewInit:function(){We(this.element)&&(this.setContentEl(this.content),this.init(),this.calculateAutoSize(),this.defaultWidth=Ve(this.element),this.defaultHeight=Me(this.element),this.defaultContentWidth=Ve(this.content),this.defaultContentHeight=Me(this.content),this.initialized=!0),this.element&&this.bindResizeListener()},init:function(){this.disabled||(this.setSize(),this.calculateOptions(),this.setSpacerSize())},isVertical:function(){return this.orientation==="vertical"},isHorizontal:function(){return this.orientation==="horizontal"},isBoth:function(){return this.orientation==="both"},scrollTo:function(e){this.element&&this.element.scrollTo(e)},scrollToIndex:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:"auto",o=this.isBoth(),i=this.isHorizontal(),f=o?e.every(function(L){return L>-1}):e>-1;if(f){var c=this.first,h=this.element,g=h.scrollTop,w=g===void 0?0:g,S=h.scrollLeft,T=S===void 0?0:S,H=this.calculateNumItems(),B=H.numToleratedItems,A=this.getContentPosition(),I=this.itemSize,R=function(){var F=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,U=arguments.length>1?arguments[1]:void 0;return F<=U?0:F},P=function(F,U,J){return F*U+J},K=function(){var F=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,U=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.scrollTo({left:F,top:U,behavior:l})},V=o?{rows:0,cols:0}:0,se=!1,N=!1;o?(V={rows:R(e[0],B[0]),cols:R(e[1],B[1])},K(P(V.cols,I[1],A.left),P(V.rows,I[0],A.top)),N=this.lastScrollPos.top!==w||this.lastScrollPos.left!==T,se=V.rows!==c.rows||V.cols!==c.cols):(V=R(e,B),i?K(P(V,I,A.left),w):K(T,P(V,I,A.top)),N=this.lastScrollPos!==(i?T:w),se=V!==c),this.isRangeChanged=se,N&&(this.first=V)}},scrollInView:function(e,n){var l=this,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"auto";if(n){var i=this.isBoth(),f=this.isHorizontal(),c=i?e.every(function(I){return I>-1}):e>-1;if(c){var h=this.getRenderedRange(),g=h.first,w=h.viewport,S=function(){var R=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,P=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return l.scrollTo({left:R,top:P,behavior:o})},T=n==="to-start",H=n==="to-end";if(T){if(i)w.first.rows-g.rows>e[0]?S(w.first.cols*this.itemSize[1],(w.first.rows-1)*this.itemSize[0]):w.first.cols-g.cols>e[1]&&S((w.first.cols-1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.first-g>e){var B=(w.first-1)*this.itemSize;f?S(B,0):S(0,B)}}else if(H){if(i)w.last.rows-g.rows<=e[0]+1?S(w.first.cols*this.itemSize[1],(w.first.rows+1)*this.itemSize[0]):w.last.cols-g.cols<=e[1]+1&&S((w.first.cols+1)*this.itemSize[1],w.first.rows*this.itemSize[0]);else if(w.last-g<=e+1){var A=(w.first+1)*this.itemSize;f?S(A,0):S(0,A)}}}}else this.scrollToIndex(e,o)},getRenderedRange:function(){var e=function(S,T){return Math.floor(S/(T||S))},n=this.first,l=0;if(this.element){var o=this.isBoth(),i=this.isHorizontal(),f=this.element,c=f.scrollTop,h=f.scrollLeft;if(o)n={rows:e(c,this.itemSize[0]),cols:e(h,this.itemSize[1])},l={rows:n.rows+this.numItemsInViewport.rows,cols:n.cols+this.numItemsInViewport.cols};else{var g=i?h:c;n=e(g,this.itemSize),l=n+this.numItemsInViewport}}return{first:this.first,last:this.last,viewport:{first:n,last:l}}},calculateNumItems:function(){var e=this.isBoth(),n=this.isHorizontal(),l=this.itemSize,o=this.getContentPosition(),i=this.element?this.element.offsetWidth-o.left:0,f=this.element?this.element.offsetHeight-o.top:0,c=function(T,H){return Math.ceil(T/(H||T))},h=function(T){return Math.ceil(T/2)},g=e?{rows:c(f,l[0]),cols:c(i,l[1])}:c(n?i:f,l),w=this.d_numToleratedItems||(e?[h(g.rows),h(g.cols)]:h(g));return{numItemsInViewport:g,numToleratedItems:w}},calculateOptions:function(){var e=this,n=this.isBoth(),l=this.first,o=this.calculateNumItems(),i=o.numItemsInViewport,f=o.numToleratedItems,c=function(w,S,T){var H=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;return e.getLast(w+S+(w<T?2:3)*T,H)},h=n?{rows:c(l.rows,i.rows,f[0]),cols:c(l.cols,i.cols,f[1],!0)}:c(l,i,f);this.last=h,this.numItemsInViewport=i,this.d_numToleratedItems=f,this.$emit("update:numToleratedItems",this.d_numToleratedItems),this.showLoader&&(this.loaderArr=n?Array.from({length:i.rows}).map(function(){return Array.from({length:i.cols})}):Array.from({length:i})),this.lazy&&Promise.resolve().then(function(){var g;e.lazyLoadState={first:e.step?n?{rows:0,cols:l.cols}:0:l,last:Math.min(e.step?e.step:h,((g=e.items)===null||g===void 0?void 0:g.length)||0)},e.$emit("lazy-load",e.lazyLoadState)})},calculateAutoSize:function(){var e=this;this.autoSize&&!this.d_loading&&Promise.resolve().then(function(){if(e.content){var n=e.isBoth(),l=e.isHorizontal(),o=e.isVertical();e.content.style.minHeight=e.content.style.minWidth="auto",e.content.style.position="relative",e.element.style.contain="none";var i=[Ve(e.element),Me(e.element)],f=i[0],c=i[1];(n||l)&&(e.element.style.width=f<e.defaultWidth?f+"px":e.scrollWidth||e.defaultWidth+"px"),(n||o)&&(e.element.style.height=c<e.defaultHeight?c+"px":e.scrollHeight||e.defaultHeight+"px"),e.content.style.minHeight=e.content.style.minWidth="",e.content.style.position="",e.element.style.contain=""}})},getLast:function(){var e,n,l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,o=arguments.length>1?arguments[1]:void 0;return this.items?Math.min(o?((e=this.columns||this.items[0])===null||e===void 0?void 0:e.length)||0:((n=this.items)===null||n===void 0?void 0:n.length)||0,l):0},getContentPosition:function(){if(this.content){var e=getComputedStyle(this.content),n=parseFloat(e.paddingLeft)+Math.max(parseFloat(e.left)||0,0),l=parseFloat(e.paddingRight)+Math.max(parseFloat(e.right)||0,0),o=parseFloat(e.paddingTop)+Math.max(parseFloat(e.top)||0,0),i=parseFloat(e.paddingBottom)+Math.max(parseFloat(e.bottom)||0,0);return{left:n,right:l,top:o,bottom:i,x:n+l,y:o+i}}return{left:0,right:0,top:0,bottom:0,x:0,y:0}},setSize:function(){var e=this;if(this.element){var n=this.isBoth(),l=this.isHorizontal(),o=this.element.parentElement,i=this.scrollWidth||"".concat(this.element.offsetWidth||o.offsetWidth,"px"),f=this.scrollHeight||"".concat(this.element.offsetHeight||o.offsetHeight,"px"),c=function(g,w){return e.element.style[g]=w};n||l?(c("height",f),c("width",i)):c("height",f)}},setSpacerSize:function(){var e=this,n=this.items;if(n){var l=this.isBoth(),o=this.isHorizontal(),i=this.getContentPosition(),f=function(h,g,w){var S=arguments.length>3&&arguments[3]!==void 0?arguments[3]:0;return e.spacerStyle=ze(ze({},e.spacerStyle),an({},"".concat(h),(g||[]).length*w+S+"px"))};l?(f("height",n,this.itemSize[0],i.y),f("width",this.columns||n[1],this.itemSize[1],i.x)):o?f("width",this.columns||n,this.itemSize,i.x):f("height",n,this.itemSize,i.y)}},setContentPosition:function(e){var n=this;if(this.content&&!this.appendOnly){var l=this.isBoth(),o=this.isHorizontal(),i=e?e.first:this.first,f=function(w,S){return w*S},c=function(){var w=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,S=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.contentStyle=ze(ze({},n.contentStyle),{transform:"translate3d(".concat(w,"px, ").concat(S,"px, 0)")})};if(l)c(f(i.cols,this.itemSize[1]),f(i.rows,this.itemSize[0]));else{var h=f(i,this.itemSize);o?c(h,0):c(0,h)}}},onScrollPositionChange:function(e){var n=this,l=e.target,o=this.isBoth(),i=this.isHorizontal(),f=this.getContentPosition(),c=function(q,E){return q?q>E?q-E:q:0},h=function(q,E){return Math.floor(q/(E||q))},g=function(q,E,D,x,re,fe){return q<=re?re:fe?D-x-re:E+re-1},w=function(q,E,D,x,re,fe,ve,qe){if(q<=fe)return 0;var Le=Math.max(0,ve?q<E?D:q-fe:q>E?D:q-2*fe),Oe=n.getLast(Le,qe);return Le>Oe?Oe-re:Le},S=function(q,E,D,x,re,fe){var ve=E+x+2*re;return q>=re&&(ve+=re+1),n.getLast(ve,fe)},T=c(l.scrollTop,f.top),H=c(l.scrollLeft,f.left),B=o?{rows:0,cols:0}:0,A=this.last,I=!1,R=this.lastScrollPos;if(o){var P=this.lastScrollPos.top<=T,K=this.lastScrollPos.left<=H;if(!this.appendOnly||this.appendOnly&&(P||K)){var V={rows:h(T,this.itemSize[0]),cols:h(H,this.itemSize[1])},se={rows:g(V.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],P),cols:g(V.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K)};B={rows:w(V.rows,se.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],P),cols:w(V.cols,se.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],K,!0)},A={rows:S(V.rows,B.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0]),cols:S(V.cols,B.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],!0)},I=B.rows!==this.first.rows||A.rows!==this.last.rows||B.cols!==this.first.cols||A.cols!==this.last.cols||this.isRangeChanged,R={top:T,left:H}}}else{var N=i?H:T,L=this.lastScrollPos<=N;if(!this.appendOnly||this.appendOnly&&L){var F=h(N,this.itemSize),U=g(F,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L);B=w(F,U,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,L),A=S(F,B,this.last,this.numItemsInViewport,this.d_numToleratedItems),I=B!==this.first||A!==this.last||this.isRangeChanged,R=N}}return{first:B,last:A,isRangeChanged:I,scrollPos:R}},onScrollChange:function(e){var n=this.onScrollPositionChange(e),l=n.first,o=n.last,i=n.isRangeChanged,f=n.scrollPos;if(i){var c={first:l,last:o};if(this.setContentPosition(c),this.first=l,this.last=o,this.lastScrollPos=f,this.$emit("scroll-index-change",c),this.lazy&&this.isPageChanged(l)){var h,g,w={first:this.step?Math.min(this.getPageByFirst(l)*this.step,(((h=this.items)===null||h===void 0?void 0:h.length)||0)-this.step):l,last:Math.min(this.step?(this.getPageByFirst(l)+1)*this.step:o,((g=this.items)===null||g===void 0?void 0:g.length)||0)},S=this.lazyLoadState.first!==w.first||this.lazyLoadState.last!==w.last;S&&this.$emit("lazy-load",w),this.lazyLoadState=w}}},onScroll:function(e){var n=this;if(this.$emit("scroll",e),this.delay){if(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.isPageChanged()){if(!this.d_loading&&this.showLoader){var l=this.onScrollPositionChange(e),o=l.isRangeChanged,i=o||(this.step?this.isPageChanged():!1);i&&(this.d_loading=!0)}this.scrollTimeout=setTimeout(function(){n.onScrollChange(e),n.d_loading&&n.showLoader&&(!n.lazy||n.loading===void 0)&&(n.d_loading=!1,n.page=n.getPageByFirst())},this.delay)}}else this.onScrollChange(e)},onResize:function(){var e=this;this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){if(We(e.element)){var n=e.isBoth(),l=e.isVertical(),o=e.isHorizontal(),i=[Ve(e.element),Me(e.element)],f=i[0],c=i[1],h=f!==e.defaultWidth,g=c!==e.defaultHeight,w=n?h||g:o?h:l?g:!1;w&&(e.d_numToleratedItems=e.numToleratedItems,e.defaultWidth=f,e.defaultHeight=c,e.defaultContentWidth=Ve(e.content),e.defaultContentHeight=Me(e.content),e.init())}},this.resizeDelay)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=this.onResize.bind(this),window.addEventListener("resize",this.resizeListener),window.addEventListener("orientationchange",this.resizeListener),this.resizeObserver=new ResizeObserver(function(){e.onResize()}),this.resizeObserver.observe(this.element))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),window.removeEventListener("orientationchange",this.resizeListener),this.resizeListener=null),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)},getOptions:function(e){var n=(this.items||[]).length,l=this.isBoth()?this.first.rows+e:this.first+e;return{index:l,count:n,first:l===0,last:l===n-1,even:l%2===0,odd:l%2!==0}},getLoaderOptions:function(e,n){var l=this.loaderArr.length;return ze({index:e,count:l,first:e===0,last:e===l-1,even:e%2===0,odd:e%2!==0},n)},getPageByFirst:function(e){return Math.floor(((e??this.first)+this.d_numToleratedItems*4)/(this.step||1))},isPageChanged:function(e){return this.step&&!this.lazy?this.page!==this.getPageByFirst(e??this.first):!0},setContentEl:function(e){this.content=e||this.content||Te(this.element,'[data-pc-section="content"]')},elementRef:function(e){this.element=e},contentRef:function(e){this.content=e}},computed:{containerClass:function(){return["p-virtualscroller",this.class,{"p-virtualscroller-inline":this.inline,"p-virtualscroller-both p-both-scroll":this.isBoth(),"p-virtualscroller-horizontal p-horizontal-scroll":this.isHorizontal()}]},contentClass:function(){return["p-virtualscroller-content",{"p-virtualscroller-loading":this.d_loading}]},loaderClass:function(){return["p-virtualscroller-loader",{"p-virtualscroller-loader-mask":!this.$slots.loader}]},loadedItems:function(){var e=this;return this.items&&!this.d_loading?this.isBoth()?this.items.slice(this.appendOnly?0:this.first.rows,this.last.rows).map(function(n){return e.columns?n:n.slice(e.appendOnly?0:e.first.cols,e.last.cols)}):this.isHorizontal()&&this.columns?this.items:this.items.slice(this.appendOnly?0:this.first,this.last):[]},loadedRows:function(){return this.d_loading?this.loaderDisabled?this.loaderArr:[]:this.loadedItems},loadedColumns:function(){if(this.columns){var e=this.isBoth(),n=this.isHorizontal();if(e||n)return this.d_loading&&this.loaderDisabled?e?this.loaderArr[0]:this.loaderArr:this.columns.slice(e?this.first.cols:this.first,e?this.last.cols:this.last)}return this.columns}},components:{SpinnerIcon:Ot}},Di=["tabindex"];function Bi(t,e,n,l,o,i){var f=G("SpinnerIcon");return t.disabled?(d(),u(M,{key:1},[C(t.$slots,"default"),C(t.$slots,"content",{items:t.items,rows:t.items,columns:i.loadedColumns})],64)):(d(),u("div",p({key:0,ref:i.elementRef,class:i.containerClass,tabindex:t.tabindex,style:t.style,onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)})},t.ptmi("root")),[C(t.$slots,"content",{styleClass:i.contentClass,items:i.loadedItems,getItemOptions:i.getOptions,loading:o.d_loading,getLoaderOptions:i.getLoaderOptions,itemSize:t.itemSize,rows:i.loadedRows,columns:i.loadedColumns,contentRef:i.contentRef,spacerStyle:o.spacerStyle,contentStyle:o.contentStyle,vertical:i.isVertical(),horizontal:i.isHorizontal(),both:i.isBoth()},function(){return[m("div",p({ref:i.contentRef,class:i.contentClass,style:o.contentStyle},t.ptm("content")),[(d(!0),u(M,null,le(i.loadedItems,function(c,h){return C(t.$slots,"item",{key:h,item:c,options:i.getOptions(h)})}),128))],16)]}),t.showSpacer?(d(),u("div",p({key:0,class:"p-virtualscroller-spacer",style:o.spacerStyle},t.ptm("spacer")),null,16)):O("",!0),!t.loaderDisabled&&t.showLoader&&o.d_loading?(d(),u("div",p({key:1,class:i.loaderClass},t.ptm("loader")),[t.$slots&&t.$slots.loader?(d(!0),u(M,{key:0},le(o.loaderArr,function(c,h){return C(t.$slots,"loader",{key:h,options:i.getLoaderOptions(h,i.isBoth()&&{numCols:t.d_numItemsInViewport.cols})})}),128)):O("",!0),C(t.$slots,"loadingicon",{},function(){return[r(f,p({spin:"",class:"p-virtualscroller-loading-icon"},t.ptm("loadingIcon")),null,16)]})],16)):O("",!0)],16,Di))}zt.render=Bi;var Hi=`
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
`,Ki={root:function(e){var n=e.instance,l=e.props,o=e.state;return["p-select p-component p-inputwrapper",{"p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":o.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":o.focused||o.overlayVisible,"p-select-open":o.overlayVisible,"p-select-fluid":n.$fluid,"p-select-sm p-inputfield-sm":l.size==="small","p-select-lg p-inputfield-lg":l.size==="large"}]},label:function(e){var n,l=e.instance,o=e.props;return["p-select-label",{"p-placeholder":!o.editable&&l.label===o.placeholder,"p-select-label-empty":!o.editable&&!l.$slots.value&&(l.label==="p-emptylabel"||((n=l.label)===null||n===void 0?void 0:n.length)===0)}]},clearIcon:"p-select-clear-icon",dropdown:"p-select-dropdown",loadingicon:"p-select-loading-icon",dropdownIcon:"p-select-dropdown-icon",overlay:"p-select-overlay p-component",header:"p-select-header",pcFilter:"p-select-filter",listContainer:"p-select-list-container",list:"p-select-list",optionGroup:"p-select-option-group",optionGroupLabel:"p-select-option-group-label",option:function(e){var n=e.instance,l=e.props,o=e.state,i=e.option,f=e.focusedOption;return["p-select-option",{"p-select-option-selected":n.isSelected(i)&&l.highlightOnSelect,"p-focus":o.focusedOptionIndex===f,"p-disabled":n.isOptionDisabled(i)}]},optionLabel:"p-select-option-label",optionCheckIcon:"p-select-option-check-icon",optionBlankIcon:"p-select-option-blank-icon",emptyMessage:"p-select-empty-message"},Ri=pe.extend({name:"select",style:Hi,classes:Ki}),Ui={name:"BaseSelect",extends:nt,props:{options:Array,optionLabel:[String,Function],optionValue:[String,Function],optionDisabled:[String,Function],optionGroupLabel:[String,Function],optionGroupChildren:[String,Function],scrollHeight:{type:String,default:"14rem"},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},editable:Boolean,placeholder:{type:String,default:null},dataKey:null,showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},labelId:{type:String,default:null},labelClass:{type:[String,Object],default:null},labelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},appendTo:{type:[String,Object],default:"body"},loading:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},resetFilterOnHide:{type:Boolean,default:!1},resetFilterOnClear:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!0},checkmark:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Ri,provide:function(){return{$pcSelect:this,$parentInstance:this}}};function Ae(t){"@babel/helpers - typeof";return Ae=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ae(t)}function ji(t){return _i(t)||qi(t)||Ni(t)||Gi()}function Gi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Ni(t,e){if(t){if(typeof t=="string")return mt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?mt(t,e):void 0}}function qi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function _i(t){if(Array.isArray(t))return mt(t)}function mt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Kt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function Rt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Kt(Object(n),!0).forEach(function(l){ge(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Kt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function ge(t,e,n){return(e=Wi(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Wi(t){var e=Zi(t,"string");return Ae(e)=="symbol"?e:e+""}function Zi(t,e){if(Ae(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ae(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ne={name:"Select",extends:Ui,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter"],outsideClickListener:null,scrollHandler:null,resizeListener:null,labelClickListener:null,matchMediaOrientationListener:null,overlay:null,list:null,virtualScroller:null,searchTimeout:null,searchValue:null,isModelValueChanged:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1,queryOrientation:null}},watch:{modelValue:function(){this.isModelValueChanged=!0},options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel(),this.bindLabelClickListener(),this.bindMatchMediaOrientationListener()},updated:function(){this.overlayVisible&&this.isModelValueChanged&&this.scrollInView(this.findSelectedOptionIndex()),this.isModelValueChanged=!1},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindLabelClickListener(),this.unbindMatchMediaOrientationListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(ae.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?ue(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?ue(e,this.optionValue):e},getOptionRenderKey:function(e,n){return(this.dataKey?ue(e,this.dataKey):this.getOptionLabel(e))+"_"+n},getPTItemOptions:function(e,n,l,o){return this.ptm(o,{context:{option:e,index:l,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?ue(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return ue(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return ue(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),e&&Y(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&Y(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n=this;setTimeout(function(){var l,o;n.focused=!1,n.focusedOptionIndex=-1,n.searchValue="",n.$emit("blur",e),(l=(o=n.formField).onBlur)===null||l===void 0||l.call(o,e)},100)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}if(kn())switch(e.code){case"Backspace":this.onBackspaceKey(e,this.editable);break;case"Enter":case"NumpadDecimal":this.onEnterKey(e);break;default:e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,this.editable);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,this.editable);break;case"Home":this.onHomeKey(e,this.editable);break;case"End":this.onEndKey(e,this.editable);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Space":this.onSpaceKey(e,this.editable);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"Backspace":this.onBackspaceKey(e,this.editable);break;case"ShiftLeft":case"ShiftRight":break;default:!l&&Yt(e.key)&&(!this.overlayVisible&&this.show(),!this.editable&&this.searchOptions(e,e.key),this.filter&&this.$nextTick(function(){n.$refs.filterInput&&Y(n.$refs.filterInput.$el)}));break}this.clicked=!1},onEditableInput:function(e){var n=e.target.value;this.searchValue="";var l=this.searchOptions(e,n);!l&&(this.focusedOptionIndex=-1),this.updateModel(e,n),!this.overlayVisible&&he(n)&&this.show()},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,null),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Xt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;Y(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Zt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;Y(n)},onOptionSelect:function(e,n){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0;if(this.overlayVisible){var o=this.getOptionValue(n);this.updateModel(e,o),l&&this.hide(!0)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){if(!e.isComposing)switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){it.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show(),this.editable&&this.changeFocusedOptionIndex(e,this.findSelectedOptionIndex());else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else this.changeFocusedOptionIndex(e,this.findFirstOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var o=l.value.length;l.setSelectionRange(o,o),this.focusedOptionIndex=-1}}else this.changeFocusedOptionIndex(e,this.findLastOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.hide(!0)):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onSpaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;!n&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault(),e.stopPropagation()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(Y(this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onBackspaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&!this.overlayVisible&&this.show()},onOverlayEnter:function(e){var n=this;ae.set("overlay",e,this.$primevue.config.zIndex.overlay),kt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),setTimeout(function(){n.autoFilterFocus&&n.filter&&Y(n.$refs.filterInput.$el),n.autoUpdateModel()},1)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){var n=this;e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.autoFilterFocus&&this.filter&&!this.editable&&this.$nextTick(function(){n.$refs.filterInput&&Y(n.$refs.filterInput.$el)}),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?wt(this.overlay,this.$el):this.overlay&&(this.overlay.style.minWidth=Fe(this.$el)+"px",Qe(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=n.composedPath();e.overlayVisible&&e.overlay&&!l.includes(e.$el)&&!l.includes(e.overlay)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Je(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Ye()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindLabelClickListener:function(){var e=this;if(!this.editable&&!this.labelClickListener){var n=document.querySelector('label[for="'.concat(this.labelId,'"]'));n&&We(n)&&(this.labelClickListener=function(){Y(e.$refs.focusInput)},n.addEventListener("click",this.labelClickListener))}},unbindLabelClickListener:function(){if(this.labelClickListener){var e=document.querySelector('label[for="'.concat(this.labelId,'"]'));e&&We(e)&&e.removeEventListener("click",this.labelClickListener)}},bindMatchMediaOrientationListener:function(){var e=this;if(!this.matchMediaOrientationListener){var n=matchMedia("(orientation: portrait)");this.queryOrientation=n,this.matchMediaOrientationListener=function(){e.alignOverlay()},this.queryOrientation.addEventListener("change",this.matchMediaOrientationListener)}},unbindMatchMediaOrientationListener:function(){this.matchMediaOrientationListener&&(this.queryOrientation.removeEventListener("change",this.matchMediaOrientationListener),this.queryOrientation=null,this.matchMediaOrientationListener=null)},hasFocusableElements:function(){return Wt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionExactMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale))==this.searchValue.toLocaleLowerCase(this.filterLocale)},isOptionStartsWith:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return he(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isSelected:function(e){return Se(this.d_value,this.getOptionValue(e),this.equalityKey)},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return xe(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidOption(o)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidOption(o)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)})},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e,n){var l=this;this.searchValue=(this.searchValue||"")+n;var o=-1,i=!1;return he(this.searchValue)&&(o=this.visibleOptions.findIndex(function(f){return l.isOptionExactMatched(f)}),o===-1&&(o=this.visibleOptions.findIndex(function(f){return l.isOptionStartsWith(f)})),o!==-1&&(i=!0),o===-1&&this.focusedOptionIndex===-1&&(o=this.findFirstFocusedOptionIndex()),o!==-1&&this.changeFocusedOptionIndex(e,o)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){l.searchValue="",l.searchTimeout=null},500),i},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n],!1))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,o=Te(e.list,'li[id="'.concat(l,'"]'));o?o.scrollIntoView&&o.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1)},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,o,i){l.push({optionGroup:o,group:!0,index:i});var f=n.getOptionGroupChildren(o);return f&&f.forEach(function(c){return l.push(c)}),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=_t.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var o=this.options||[],i=[];return o.forEach(function(f){var c=e.getOptionGroupChildren(f),h=c.filter(function(g){return l.includes(g)});h.length>0&&i.push(Rt(Rt({},f),{},ge({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",ji(h))))}),this.flatOptions(i)}return l}return n},hasSelectedOption:function(){return this.$filled},label:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.placeholder||"p-emptylabel"},editableInputValue:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.d_value||""},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},filterResultMessageText:function(){return he(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}","1"):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},isClearIconVisible:function(){return this.showClear&&this.d_value!=null&&!this.disabled&&!this.loading},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},containerDataP:function(){return oe(ge({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return oe(ge(ge({placeholder:!this.editable&&this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled,editable:this.editable},this.size,this.size),"empty",!this.editable&&!this.$slots.value&&(this.label==="p-emptylabel"||this.label.length===0)))},dropdownIconDataP:function(){return oe(ge({},this.size,this.size))},overlayDataP:function(){return oe(ge({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:yt},components:{InputText:Ze,VirtualScroller:zt,Portal:Re,InputIcon:Mt,IconField:Vt,TimesIcon:xt,ChevronDownIcon:Lt,SpinnerIcon:Ot,SearchIcon:Ct,CheckIcon:It,BlankIcon:on}},Xi=["id","data-p"],Yi=["name","id","value","placeholder","tabindex","disabled","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","data-p"],Ji=["name","id","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","aria-disabled","data-p"],Qi=["data-p"],el=["id"],tl=["id"],nl=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onMousedown","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function il(t,e,n,l,o,i){var f=G("SpinnerIcon"),c=G("InputText"),h=G("SearchIcon"),g=G("InputIcon"),w=G("IconField"),S=G("CheckIcon"),T=G("BlankIcon"),H=G("VirtualScroller"),B=G("Portal"),A=Ue("ripple");return d(),u("div",p({ref:"container",id:t.$id,class:t.cx("root"),onClick:e[12]||(e[12]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[t.editable?(d(),u("input",p({key:0,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,type:"text",class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],value:i.editableInputValue,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,disabled:t.disabled,autocomplete:"off",role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":o.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),onInput:e[3]||(e[3]=function(){return i.onEditableInput&&i.onEditableInput.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),null,16,Yi)):(d(),u("span",p({key:1,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel||(i.label==="p-emptylabel"?void 0:i.label),"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":t.$id+"_list","aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,"aria-disabled":t.disabled,onFocus:e[4]||(e[4]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[5]||(e[5]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),[C(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){var I;return[_(z(i.label==="p-emptylabel"?" ":(I=i.label)!==null&&I!==void 0?I:"empty"),1)]})],16,Ji)),i.isClearIconVisible?C(t.$slots,"clearicon",{key:2,class:j(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(d(),$(de(t.clearIcon?"i":"TimesIcon"),p({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):O("",!0),m("div",p({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?C(t.$slots,"loadingicon",{key:0,class:j(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(d(),u("span",p({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(d(),$(f,p({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):C(t.$slots,"dropdownicon",{key:1,class:j(t.cx("dropdownIcon"))},function(){return[(d(),$(de(t.dropdownIcon?"span":"ChevronDownIcon"),p({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(B,{appendTo:t.appendTo},{default:v(function(){return[r(Ge,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[o.overlayVisible?(d(),u("div",p({key:0,ref:i.overlayRef,class:[t.cx("overlay"),t.panelClass,t.overlayClass],style:[t.panelStyle,t.overlayStyle],onClick:e[10]||(e[10]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[11]||(e[11]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[m("span",p({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[7]||(e[7]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),C(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.filter?(d(),u("div",p({key:0,class:t.cx("header")},t.ptm("header")),[r(w,{unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(c,{ref:"filterInput",type:"text",value:o.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:j(t.cx("pcFilter")),placeholder:t.filterPlaceholder,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(g,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[C(t.$slots,"filtericon",{},function(){return[t.filterIcon?(d(),u("span",p({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(d(),$(h,Jt(p({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["unstyled","pt"]),m("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)],16)):O("",!0),m("div",p({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(H,p({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),Qt({content:v(function(I){var R=I.styleClass,P=I.contentRef,K=I.items,V=I.getItemOptions,se=I.contentStyle,N=I.itemSize;return[m("ul",p({ref:function(F){return i.listRef(F,P)},id:t.$id+"_list",class:[t.cx("list"),R],style:se,role:"listbox"},t.ptm("list")),[(d(!0),u(M,null,le(K,function(L,F){return d(),u(M,{key:i.getOptionRenderKey(L,i.getOptionIndex(F,V))},[i.isOptionGroup(L)?(d(),u("li",p({key:0,id:t.$id+"_"+i.getOptionIndex(F,V),style:{height:N?N+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[C(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(F,V)},function(){return[m("span",p({class:t.cx("optionGroupLabel")},{ref_for:!0},t.ptm("optionGroupLabel")),z(i.getOptionGroupLabel(L.optionGroup)),17)]})],16,tl)):je((d(),u("li",p({key:1,id:t.$id+"_"+i.getOptionIndex(F,V),class:t.cx("option",{option:L,focusedOption:i.getOptionIndex(F,V)}),style:{height:N?N+"px":void 0},role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(F,V)),onMousedown:function(J){return i.onOptionSelect(J,L)},onMousemove:function(J){return i.onOptionMouseMove(J,i.getOptionIndex(F,V))},onClick:e[8]||(e[8]=en(function(){},["stop"])),"data-p-selected":!t.checkmark&&i.isSelected(L),"data-p-focused":o.focusedOptionIndex===i.getOptionIndex(F,V),"data-p-disabled":i.isOptionDisabled(L)},{ref_for:!0},i.getPTItemOptions(L,V,F,"option")),[t.checkmark?(d(),u(M,{key:0},[i.isSelected(L)?(d(),$(S,p({key:0,class:t.cx("optionCheckIcon")},{ref_for:!0},t.ptm("optionCheckIcon")),null,16,["class"])):(d(),$(T,p({key:1,class:t.cx("optionBlankIcon")},{ref_for:!0},t.ptm("optionBlankIcon")),null,16,["class"]))],64)):O("",!0),C(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(F,V)},function(){return[m("span",p({class:t.cx("optionLabel")},{ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,nl)),[[A]])],64)}),128)),o.filterValue&&(!K||K&&K.length===0)?(d(),u("li",p({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[C(t.$slots,"emptyfilter",{},function(){return[_(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(d(),u("li",p({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[C(t.$slots,"empty",{},function(){return[_(z(i.emptyMessageText),1)]})],16)):O("",!0)],16,el)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(I){var R=I.options;return[C(t.$slots,"loader",{options:R})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),C(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(d(),u("span",p({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):O("",!0),m("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),m("span",p({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[9]||(e[9]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Qi)):O("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,Xi)}ne.render=il;var ll=`
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
`,ol={root:function(e){var n=e.instance,l=e.props;return["p-textarea p-component",{"p-filled":n.$filled,"p-textarea-resizable ":l.autoResize,"p-textarea-sm p-inputfield-sm":l.size==="small","p-textarea-lg p-inputfield-lg":l.size==="large","p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-textarea-fluid":n.$fluid}]}},al=pe.extend({name:"textarea",style:ll,classes:ol}),sl={name:"BaseTextarea",extends:nt,props:{autoResize:Boolean},style:al,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function Ee(t){"@babel/helpers - typeof";return Ee=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ee(t)}function rl(t,e,n){return(e=dl(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function dl(t){var e=ul(t,"string");return Ee(e)=="symbol"?e:e+""}function ul(t,e){if(Ee(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ee(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ye={name:"Textarea",extends:sl,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,n=parseInt(e)||0,l=this.$el.scrollHeight,o=!n||l>n,i=n&&l<n;i?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):o&&(this.$el.style.height="".concat(l,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return p(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return oe(rl({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},cl=["value","name","disabled","aria-invalid","data-p"];function pl(t,e,n,l,o,i){return d(),u("textarea",p({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":i.dataP,onInput:e[0]||(e[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},i.attrs),null,16,cl)}ye.render=pl;var hl=`
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
`,fl={root:{position:"relative"}},ml={root:function(e){var n=e.instance,l=e.props;return["p-toggleswitch p-component",{"p-toggleswitch-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},input:"p-toggleswitch-input",slider:"p-toggleswitch-slider",handle:"p-toggleswitch-handle"},bl=pe.extend({name:"toggleswitch",style:hl,classes:ml,inlineStyles:fl}),vl={name:"BaseToggleSwitch",extends:qt,props:{trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:bl,provide:function(){return{$pcToggleSwitch:this,$parentInstance:this}}},Q={name:"ToggleSwitch",extends:vl,inheritAttrs:!1,emits:["change","focus","blur"],methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,disabled:this.disabled}})},onChange:function(e){if(!this.disabled&&!this.readonly){var n=this.checked?this.falseValue:this.trueValue;this.writeValue(n,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)}},computed:{checked:function(){return this.d_value===this.trueValue},dataP:function(){return oe({checked:this.checked,disabled:this.disabled,invalid:this.$invalid})}}},gl=["data-p-checked","data-p-disabled","data-p"],yl=["id","checked","tabindex","disabled","readonly","aria-checked","aria-labelledby","aria-label","aria-invalid"],kl=["data-p"],wl=["data-p"];function Ol(t,e,n,l,o,i){return d(),u("div",p({class:t.cx("root"),style:t.sx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-disabled":t.disabled,"data-p":i.dataP}),[m("input",p({id:t.inputId,type:"checkbox",role:"switch",class:[t.cx("input"),t.inputClass],style:t.inputStyle,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,"aria-checked":i.checked,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,yl),m("div",p({class:t.cx("slider")},i.getPTOptions("slider"),{"data-p":i.dataP}),[m("div",p({class:t.cx("handle")},i.getPTOptions("handle"),{"data-p":i.dataP}),[C(t.$slots,"handle",{checked:i.checked})],16,wl)],16,kl)],16,gl)}Q.render=Ol;const Il={class:"pt-1.5"},xl={class:"flex items-baseline gap-2 text-ink"},Sl={key:0,class:"tnum text-[13px] text-tally"},Ll={key:0,class:"mt-0.5 text-[13px] leading-snug text-ink-3"},Cl={class:"min-w-0"},Vl={key:0,class:"mt-1 text-[13px] text-ink-3"},k=St({__name:"FormField",props:{label:{},hint:{},value:{},stacked:{type:Boolean}},setup(t){return(e,n)=>(d(),u("div",{class:j(t.stacked?"flex flex-col gap-2":"grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1")},[m("div",Il,[m("div",xl,[_(z(t.label)+" ",1),t.value!==void 0&&t.value!==null?(d(),u("span",Sl,z(t.value),1)):O("",!0)]),t.hint&&!t.stacked?(d(),u("div",Ll,z(t.hint),1)):O("",!0)]),m("div",Cl,[C(e.$slots,"default"),t.hint&&t.stacked?(d(),u("div",Vl,z(t.hint),1)):O("",!0)])],2))}}),Ml={class:"grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]"},zl={class:"flex min-h-0 flex-col border-r border-line-soft"},Fl={class:"flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3"},Tl={class:"min-h-0 flex-1 overflow-y-auto"},$l=["onClick"],Pl=["aria-label","onClick"],Al={class:"min-w-0 flex-1"},El={class:"block truncate font-medium"},Dl={class:"block truncate text-[13px] text-ink-3"},Bl={key:0,class:"pi pi-check text-tally"},Hl={class:"p-4 text-center"},Kl={key:1,class:"text-ink-3"},Rl={key:2,class:"text-ink-3"},Ul={class:"flex min-h-0 flex-col overflow-y-auto p-5"},jl={class:"font-display text-lg"},Gl={key:0,class:"mt-1 line-clamp-4 text-[13px] text-ink-3"},Nl={class:"mt-5 flex flex-col gap-4"},ql={key:1,class:"m-auto max-w-60 text-center text-ink-3"},_l=St({__name:"VoicePicker",props:Xe({language:{}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:Xe(["created"],["update:visible"]),setup(t,{emit:e}){const n=tn(t,"visible"),l=t,o=e,i=et(),f=Ne(),c=X("elevenlabs"),h=X(""),g=X(null),w=X(l.language??null),S=X([]),T=X(0),H=X(!1),B=X(!1),A=X(null),I=X(null),R=new Audio;R.onended=()=>I.value=null;const P=X({name:"",model_id:"eleven_multilingual_v2",stability:.5,similarity_boost:.75,style:0,speed:1}),K=X(!1),V=[{id:"eleven_multilingual_v2",name:"Multilingual v2 — стабильный, лучший для длинных текстов"},{id:"eleven_v3",name:"v3 — самый выразительный, больше языков"},{id:"eleven_turbo_v2_5",name:"Turbo v2.5 — быстрый и дешевле"},{id:"eleven_flash_v2_5",name:"Flash v2.5 — самый быстрый"}],se=Z(()=>[{code:null,name:"Любой язык"},...i.meta?.languages??[]]);async function N(E=!0){B.value=!0,E&&(T.value=0);try{const D=new URLSearchParams({source:c.value,search:h.value,language:w.value??"",gender:g.value??"",page:String(T.value)}),x=await ce.get(`/api/lumean/voices?${D}`);S.value=E?x.voices:[...S.value,...x.voices],H.value=x.has_more}catch(D){f.error(D,"Каталог голосов недоступен")}finally{B.value=!1}}function L(){T.value+=1,N(!1)}function F(E){if(E.preview_url){if(I.value===E.voice_id){R.pause(),I.value=null;return}R.src=E.preview_url,R.play(),I.value=E.voice_id}}function U(E){A.value=E;const D=w.value?` ${w.value.toUpperCase()}`:"";P.value.name=`${E.name}${D}`}async function J(){if(A.value){K.value=!0;try{const E=await ce.post("/api/lumean/templates",{...P.value,voice_id:A.value.voice_id,language_code:w.value||null});f.ok("Голос добавлен в Lumean",E.name),o("created",E),n.value=!1}catch(E){f.error(E)}finally{K.value=!1}}}let q;return st([h],()=>{window.clearTimeout(q),q=window.setTimeout(()=>N(),400)}),st([c,g,w],()=>N()),st(n,E=>{E&&!S.value.length&&N(),E||R.pause()}),wn(()=>R.pause()),(E,D)=>(d(),$(b(On),{visible:n.value,"onUpdate:visible":D[10]||(D[10]=x=>n.value=x),modal:"",header:"Подбор голоса",style:{width:"min(1100px, 96vw)"},"content-style":{padding:0}},{default:v(()=>[m("div",Ml,[m("div",zl,[m("div",Fl,[r(b(me),{modelValue:c.value,"onUpdate:modelValue":D[0]||(D[0]=x=>c.value=x),options:[{v:"elevenlabs",l:"ElevenLabs"},{v:"lumean",l:"Lumean"}],"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),r(b(Ze),{modelValue:h.value,"onUpdate:modelValue":D[1]||(D[1]=x=>h.value=x),placeholder:"Поиск: тембр, стиль, имя",size:"small",class:"min-w-48 flex-1"},null,8,["modelValue"]),r(b(ne),{modelValue:w.value,"onUpdate:modelValue":D[2]||(D[2]=x=>w.value=x),options:se.value,"option-value":"code","option-label":"name",size:"small",class:"w-40"},null,8,["modelValue","options"]),r(b(ne),{modelValue:g.value,"onUpdate:modelValue":D[3]||(D[3]=x=>g.value=x),options:[{v:null,l:"Любой пол"},{v:"male",l:"Мужской"},{v:"female",l:"Женский"}],"option-value":"v","option-label":"l",size:"small",class:"w-36"},null,8,["modelValue"])]),m("div",Tl,[(d(!0),u(M,null,le(S.value,x=>(d(),u("button",{key:x.voice_id,class:j(["flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised",A.value?.voice_id===x.voice_id?"bg-raised":""]),onClick:re=>U(x)},[m("span",{role:"button","aria-label":I.value===x.voice_id?"Остановить":"Прослушать",class:j(["flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",[I.value===x.voice_id?"border-tally bg-tally text-tally-ink":"border-line text-ink-2 hover:border-ink-3",x.preview_url?"":"opacity-30"]]),onClick:en(re=>F(x),["stop"])},[m("i",{class:j([["pi",I.value===x.voice_id?"pi-pause":"pi-play"],"text-xs"])},null,2)],10,Pl),m("span",Al,[m("span",El,z(x.name),1),m("span",Dl,z([x.gender==="male"?"мужской":x.gender==="female"?"женский":"",x.age,x.accent,x.use_case,x.language].filter(Boolean).join(", ")||x.description),1)]),A.value?.voice_id===x.voice_id?(d(),u("i",Bl)):O("",!0)],10,$l))),128)),m("div",Hl,[H.value?(d(),$(b(ke),{key:0,label:"Показать ещё",text:"",severity:"secondary",loading:B.value,onClick:L},null,8,["loading"])):B.value?(d(),u("span",Kl,"Загрузка…")):S.value.length?O("",!0):(d(),u("span",Rl,"Ничего не найдено. Измените фильтры."))])])]),m("div",Ul,[A.value?(d(),u(M,{key:0},[m("div",jl,z(A.value.name),1),A.value.description?(d(),u("p",Gl,z(A.value.description),1)):O("",!0),m("div",Nl,[r(k,{label:"Название шаблона",stacked:""},{default:v(()=>[r(b(Ze),{modelValue:P.value.name,"onUpdate:modelValue":D[4]||(D[4]=x=>P.value.name=x),class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель",stacked:""},{default:v(()=>[r(b(ne),{modelValue:P.value.model_id,"onUpdate:modelValue":D[5]||(D[5]=x=>P.value.model_id=x),options:V,"option-value":"id","option-label":"name",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стабильность",value:P.value.stability.toFixed(2),hint:"Выше — ровнее, ниже — эмоциональнее",stacked:""},{default:v(()=>[r(b(ie),{modelValue:P.value.stability,"onUpdate:modelValue":D[6]||(D[6]=x=>P.value.stability=x),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Похожесть на оригинал",value:P.value.similarity_boost.toFixed(2),stacked:""},{default:v(()=>[r(b(ie),{modelValue:P.value.similarity_boost,"onUpdate:modelValue":D[7]||(D[7]=x=>P.value.similarity_boost=x),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Выразительность",value:P.value.style.toFixed(2),stacked:""},{default:v(()=>[r(b(ie),{modelValue:P.value.style,"onUpdate:modelValue":D[8]||(D[8]=x=>P.value.style=x),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Скорость речи",value:P.value.speed.toFixed(2),stacked:""},{default:v(()=>[r(b(ie),{modelValue:P.value.speed,"onUpdate:modelValue":D[9]||(D[9]=x=>P.value.speed=x),min:.7,max:1.2,step:.01},null,8,["modelValue"])]),_:1},8,["value"])]),r(b(ke),{class:"mt-6",label:"Создать голос",loading:K.value,disabled:!P.value.name.trim(),onClick:J},null,8,["loading","disabled"])],64)):(d(),u("div",ql," Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом. "))])])]),_:1},8,["visible"]))}}),Wl={class:"grid grid-cols-[13rem_minmax(0,1fr)] gap-8"},Zl={class:"sticky top-4 flex h-fit flex-col gap-0.5"},Xl=["onClick"],Yl={class:"flex min-w-0 flex-col gap-7 pb-10"},Jl={key:0,class:"rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad"},Ql={class:"flex gap-2"},eo={class:"flex gap-2"},to={class:"flex gap-2"},no={class:"flex items-center gap-4 pt-1.5"},io={class:"mt-2 text-[13px] text-ink-3"},lo={class:"mt-2 text-[13px] text-ink-3"},oo={class:"flex items-center gap-3"},ao={key:0,class:"mt-4 flex items-center gap-3"},so={class:"mt-2 text-[13px] leading-snug text-ink-3"},ro={class:"grid grid-cols-1 gap-2 xl:grid-cols-2"},uo=["onClick"],co={class:"flex items-baseline justify-between gap-2"},po={class:"font-medium"},ho={class:"tnum shrink-0 text-[13px] text-ink-3"},fo={class:"mt-0.5 block text-[13px] text-ink-3"},mo={class:"flex items-center gap-3 pt-1"},bo={class:"text-[13px] text-ink-3"},vo={key:0,class:"mt-3 flex flex-wrap gap-2"},go=["src"],yo=["onClick"],ko={key:0,class:"flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"},wo={key:0,class:"mt-3 flex flex-col gap-2"},Oo={class:"flex flex-col gap-1.5"},Io={key:0,class:"text-[13px] text-tally"},xo={key:1,class:"text-[13px] text-ink-3"},So={class:"flex gap-3"},Lo={class:"flex flex-wrap gap-2"},Co=["onClick"],Vo={class:"flex flex-wrap gap-2"},Mo=["onClick"],zo={class:"flex items-center gap-3"},Fo={class:"relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]",style:{"container-type":"size"}},To={class:"flex flex-wrap items-center gap-3"},$o={class:"flex items-center gap-2"},Po={class:"flex items-center gap-2"},Ao={class:"flex flex-wrap items-center gap-5"},Eo={class:"flex items-center gap-2"},Do={key:0,class:"flex items-center gap-2"},Bo={key:1,class:"flex items-center gap-2"},Ho={key:2,class:"flex items-center gap-2"},Ko={class:"flex items-center gap-3"},Ro={class:"flex items-center gap-3"},Uo={class:"flex flex-wrap items-center gap-3"},as=St({__name:"SettingsForm",props:Xe({mode:{},channelId:{},references:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:Xe(["referencesChanged"],["update:modelValue"]),setup(t,{emit:e}){const n=tn(t,"modelValue"),l=t,o=e,i=et(),f=Ne(),c=[{id:"voice",label:"Озвучка",icon:"pi-microphone"},{id:"scenes",label:"Сцены",icon:"pi-th-large"},{id:"images",label:"Изображения",icon:"pi-image"},{id:"llm",label:"Тексты и промпты",icon:"pi-sparkles"},{id:"render",label:"Анимация и видео",icon:"pi-video"},{id:"atmosphere",label:"Атмосфера",icon:"pi-sun"},{id:"subtitles",label:"Субтитры",icon:"pi-align-center"},{id:"unique",label:"Уникализация",icon:"pi-shield"},{id:"publish",label:"Публикация",icon:"pi-youtube"}],h=X("voice"),g=[["dust","Пылинки в воздухе","Мелкие пылинки и размытые «боке» медленно плывут по кадру — как в луче света"],["breathing","Дыхание","Герой едва заметно «дышит». В 3D-параллаксе дышит только передний план, в остальных сценах — весь кадр от нижнего края"],["light_pulse","Пульсация света","Светлые места кадра медленно мягко светятся и гаснут"],["vignette_breathing","Дыхание виньетки","Затемнение по краям медленно сгущается и отпускает"],["grain_boil","Кипящее зерно","Крупное зерно, как фактура бумаги или плёнки, сменяется рывками, как в рисованной анимации. Заменяет обычное зерно уникализации"],["line_boil","Дрожание линий","Контуры чуть дрожат, будто каждый кадр перерисован от руки. Только для рисованных стилей: на фотореализме выглядит как брак"]],w=X([]),S=X(""),T=X(null),H=X(null);async function B(){try{w.value=await ce.get("/api/lumean/templates"),S.value=""}catch(y){S.value=y.message}}const A=Z(()=>w.value.map(y=>({id:y.id,label:`${y.name}${y.model_id?` · ${y.model_id.replace("eleven_","")}`:""}`}))),I=Z(()=>Object.keys(n.value.voice.templates)),R=Z(()=>(i.meta?.languages??[]).filter(y=>!(y.code in n.value.voice.templates)));function P(){H.value&&(n.value.voice.templates={...n.value.voice.templates,[H.value]:""},H.value=null)}function K(y){const a={...n.value.voice.templates};delete a[y],n.value.voice.templates=a,n.value.voice.master_language===y&&(n.value.voice.master_language=null)}const V=Z(()=>{const y=i.meta?.languages??[];return I.value.length?y.filter(a=>I.value.includes(a.code)):y});async function se(y){await B(),T.value==="__default"?n.value.voice.default_template_id=y.id:T.value&&(n.value.voice.templates={...n.value.voice.templates,[T.value]:y.id})}const N=Z({get:()=>n.value.voice.speed!=null,set:y=>n.value.voice.speed=y?1:null});function L(y){const a=n.value.scenes,W=Math.min(y,a.intro_seconds);return Math.round(W/((a.intro_min_duration+a.intro_max_duration)/2)+Math.max(0,y-W)/((a.min_duration+a.max_duration)/2))}const F=Z(()=>`Пример: ${[10,30,60].map(a=>{const W=L(a*60),s=Math.min(W,n.value.scenes.max_images);return`${a} мин → ${s}${W>s?` (сцена ≈ ${Math.round(a*60/s)} с)`:""}`}).join(", ")}`),U=Z(()=>i.meta?.image_operations??[]),J=Z(()=>U.value.find(y=>y.id===n.value.images.operation)),q=Z(()=>i.status?.fastgen?.budget??500);function E(y){const a=U.value.find(W=>W.id===y);return(a?.credits??4)*(n.value.images.upscale_2x&&a?.upscale?2:1)}const D=Z(()=>Math.floor(q.value/E(n.value.images.operation))),x=Z(()=>n.value.images.model_strategy!=="single"),re=[{v:"single",l:"Одна модель"},{v:"intro",l:"Начало качественнее"},{v:"budget",l:"По бюджету"}],fe=Z(()=>({single:"Все сцены генерируются одной моделью.",intro:"Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.",budget:"Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен."})[n.value.images.model_strategy]),ve=y=>!!U.value.find(a=>a.id===y)?.refs,qe=y=>U.value.find(a=>a.id===y)?.name??y??"",Le=Z(()=>x.value?[n.value.images.operation,n.value.images.economy_operation]:[n.value.images.operation]),Oe=Z(()=>[n.value.images.operation,n.value.images.economy_operation].find(ve)??null),un=Z(()=>!!Oe.value),Ft=Z(()=>{const y=Le.value.filter(a=>!ve(a));return y.length&&Oe.value?y.map(qe).join(", "):""}),Tt=Z(()=>U.value.map(y=>({...y,label:`${y.name} · ${y.credits} кр.`}))),cn=Z(()=>{const a=n.value.images.budget_credits||q.value,W=E(n.value.images.operation),s=E(n.value.images.economy_operation);if(W<=s)return"все 100 сцен — качественной моделью";const ee=Math.max(0,Math.min(100,Math.floor((a-100*s)/(W-s))));return ee>=100?"все 100 сцен — качественной моделью":`${ee} качественных и ${100-ee} дешёвых`}),lt=X(!1);async function pn(y){const a=y.target.files;if(!(!a?.length||!l.channelId)){lt.value=!0;try{for(const W of Array.from(a))await ce.upload(`/api/channels/${l.channelId}/references`,W);o("referencesChanged")}catch(W){f.error(W)}finally{lt.value=!1,y.target.value=""}}}async function hn(y){await ce.post(`/api/channels/${l.channelId}/references/delete`,{path:y}),o("referencesChanged")}const ot=X([]);async function fn(){try{ot.value=await ce.get("/api/fastgen/chat-models")}catch{ot.value=[{id:n.value.llm.model,name:n.value.llm.model,context:0}]}}function $t(y,a){return y.includes(a)?y.filter(W=>W!==a):[...y,a]}const at=X([]),mn=Z(()=>{const y=n.value.subtitles,a=y.size/1080*100,W=y.style==="box"?0:y.outline/1080*100*1.2;return{fontFamily:`"${y.font}", sans-serif`,fontSize:`${a}cqh`,fontWeight:y.bold?700:400,textTransform:y.uppercase?"uppercase":"none",color:y.primary_color,WebkitTextStroke:W?`${W}cqh ${y.outline_color}`:void 0,paintOrder:"stroke fill",background:y.style==="box"?`color-mix(in srgb, ${y.box_color} ${y.box_opacity*100}%, transparent)`:void 0,padding:y.style==="box"?"0.15em 0.4em":void 0,textShadow:y.shadow?`0 ${y.shadow*.15}cqh ${y.shadow*.3}cqh rgb(0 0 0 / .6)`:void 0}}),bn=Z(()=>{const y=`${n.value.subtitles.margin_v/1080*100}%`;return n.value.subtitles.position==="top"?{top:y}:n.value.subtitles.position==="middle"?{top:"45%"}:{bottom:y}});function Ce(y){return y.startsWith("#")?y:`#${y}`}return In(async()=>{B(),fn(),at.value=await ce.get("/api/fonts").catch(()=>[])}),(y,a)=>{const W=Ue("tooltip");return d(),u("div",Wl,[m("nav",Zl,[(d(),u(M,null,le(c,s=>m("button",{key:s.id,class:j(["flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised",h.value===s.id?"bg-raised text-ink":"text-ink-2"]),onClick:ee=>h.value=s.id},[m("i",{class:j([["pi",s.icon],"w-4 text-[14px]"])},null,2),_(z(s.label),1)],10,Xl)),64))]),m("div",Yl,[h.value==="voice"?(d(),u(M,{key:0},[a[78]||(a[78]=m("p",{class:"text-ink-3"}," Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию. ",-1)),S.value?(d(),u("div",Jl," Не удалось загрузить голоса Lumean: "+z(S.value),1)):O("",!0),t.mode==="channel"?(d(),$(k,{key:1,label:"Основной язык",hint:"На нём вставляется сценарий новых проектов, остальные языки переводятся с него"},{default:v(()=>[r(b(ne),{modelValue:n.value.voice.master_language,"onUpdate:modelValue":a[0]||(a[0]=s=>n.value.voice.master_language=s),options:V.value,"option-value":"code","option-label":"name",filter:"","show-clear":"",placeholder:"Первый язык из списка",class:"w-60"},null,8,["modelValue","options"])]),_:1})):O("",!0),r(k,{label:"Голос по умолчанию",hint:"Для языков без отдельного голоса"},{default:v(()=>[m("div",Ql,[r(b(ne),{modelValue:n.value.voice.default_template_id,"onUpdate:modelValue":a[1]||(a[1]=s=>n.value.voice.default_template_id=s),options:A.value,"option-value":"id","option-label":"label",filter:"","show-clear":"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","options"]),r(b(ke),{icon:"pi pi-search",label:"Подобрать",severity:"secondary",outlined:"",onClick:a[2]||(a[2]=s=>T.value="__default")})])]),_:1}),(d(!0),u(M,null,le(I.value,s=>(d(),$(k,{key:s,label:b(i).langLabel(s)},{default:v(()=>[m("div",eo,[r(b(ne),{modelValue:n.value.voice.templates[s],"onUpdate:modelValue":ee=>n.value.voice.templates[s]=ee,options:A.value,"option-value":"id","option-label":"label",filter:"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","onUpdate:modelValue","options"]),je(r(b(ke),{icon:"pi pi-search",severity:"secondary",outlined:"","aria-label":"Подобрать голос",onClick:ee=>T.value=s},null,8,["onClick"]),[[W,"Подобрать голос"]]),r(b(ke),{icon:"pi pi-trash",severity:"secondary",text:"","aria-label":"Убрать язык",onClick:ee=>K(s)},null,8,["onClick"])])]),_:2},1032,["label"]))),128)),r(k,{label:"Отдельный голос для языка"},{default:v(()=>[m("div",to,[r(b(ne),{modelValue:H.value,"onUpdate:modelValue":a[3]||(a[3]=s=>H.value=s),options:R.value,"option-value":"code","option-label":"name",filter:"",placeholder:"Язык",class:"w-60"},null,8,["modelValue","options"]),r(b(ke),{label:"Добавить",severity:"secondary",outlined:"",disabled:!H.value,onClick:P},null,8,["disabled"])])]),_:1}),r(k,{label:"Своя скорость речи",hint:"Иначе используется скорость из шаблона",value:n.value.voice.speed?.toFixed(2)},{default:v(()=>[m("div",no,[r(b(Q),{modelValue:N.value,"onUpdate:modelValue":a[4]||(a[4]=s=>N.value=s)},null,8,["modelValue"]),n.value.voice.speed!=null?(d(),$(b(ie),{key:0,modelValue:n.value.voice.speed,"onUpdate:modelValue":a[5]||(a[5]=s=>n.value.voice.speed=s),min:.7,max:1.2,step:.01,class:"flex-1"},null,8,["modelValue"])):O("",!0)])]),_:1},8,["value"]),r(k,{label:"Озвучивать по абзацам",hint:"Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже"},{default:v(()=>[r(b(Q),{modelValue:n.value.voice.paragraph_mode,"onUpdate:modelValue":a[6]||(a[6]=s=>n.value.voice.paragraph_mode=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(_l,{visible:T.value!==null,language:T.value&&T.value!=="__default"?T.value:void 0,"onUpdate:visible":a[7]||(a[7]=s=>!s&&(T.value=null)),onCreated:se},null,8,["visible","language"])],64)):h.value==="scenes"?(d(),u(M,{key:1},[r(k,{label:"Способ разбивки"},{default:v(()=>[r(b(me),{modelValue:n.value.scenes.mode,"onUpdate:modelValue":a[8]||(a[8]=s=>n.value.scenes.mode=s),options:[{v:"smart",l:"По смыслу (LLM)"},{v:"auto",l:"По предложениям"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),m("p",io,z(n.value.scenes.mode==="smart"?"Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.":"Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности."),1)]),_:1}),r(k,{label:"Чем ограничить"},{default:v(()=>[r(b(me),{modelValue:n.value.scenes.limit_mode,"onUpdate:modelValue":a[9]||(a[9]=s=>n.value.scenes.limit_mode=s),options:[{v:"duration",l:"Длительностью сцен"},{v:"count",l:"Количеством картинок"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),m("p",lo,z(n.value.scenes.limit_mode==="count"?"Не больше заданного числа картинок на видео. Если с длительностью ниже картинок получится больше, сцены равномерно удлинятся.":"Сцены держатся в заданных секундах, число картинок зависит от длины видео."),1)]),_:1}),n.value.scenes.limit_mode==="count"?(d(),$(k,{key:0,label:"Картинок на видео",hint:`Не больше этого числа на одно видео (на каждую языковую версию со своими картинками). ${F.value}`},{default:v(()=>[r(b(te),{modelValue:n.value.scenes.max_images,"onUpdate:modelValue":a[10]||(a[10]=s=>n.value.scenes.max_images=s),min:10,max:5e3,step:10,"show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"])):O("",!0),r(k,{label:n.value.scenes.limit_mode==="count"?"Длительность сцены, если лимит не мешает":"Длительность сцены",hint:"Сколько секунд держится одна картинка",value:`${n.value.scenes.min_duration}–${n.value.scenes.max_duration} с`},{default:v(()=>[m("div",oo,[r(b(te),{modelValue:n.value.scenes.min_duration,"onUpdate:modelValue":a[11]||(a[11]=s=>n.value.scenes.min_duration=s),min:1,max:n.value.scenes.max_duration,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","max"]),a[79]||(a[79]=m("span",{class:"text-ink-3"},"до",-1)),r(b(te),{modelValue:n.value.scenes.max_duration,"onUpdate:modelValue":a[12]||(a[12]=s=>n.value.scenes.max_duration=s),min:n.value.scenes.min_duration,max:60,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","min"])])]),_:1},8,["label","value"]),r(k,{label:"Быстрое начало",hint:"В первые секунды картинки меняются чаще — это удерживает зрителя",value:`${n.value.scenes.intro_seconds} с`},{default:v(()=>[r(b(ie),{modelValue:n.value.scenes.intro_seconds,"onUpdate:modelValue":a[13]||(a[13]=s=>n.value.scenes.intro_seconds=s),min:0,max:180,step:5,class:"mt-3"},null,8,["modelValue"]),n.value.scenes.intro_seconds>0?(d(),u("div",ao,[a[80]||(a[80]=m("span",{class:"text-ink-3"},"Сцены в начале",-1)),r(b(te),{modelValue:n.value.scenes.intro_min_duration,"onUpdate:modelValue":a[14]||(a[14]=s=>n.value.scenes.intro_min_duration=s),min:1,max:n.value.scenes.intro_max_duration,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","max"]),a[81]||(a[81]=m("span",{class:"text-ink-3"},"до",-1)),r(b(te),{modelValue:n.value.scenes.intro_max_duration,"onUpdate:modelValue":a[15]||(a[15]=s=>n.value.scenes.intro_max_duration=s),min:n.value.scenes.intro_min_duration,max:30,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","min"])])):O("",!0)]),_:1},8,["value"])],64)):h.value==="images"?(d(),u(M,{key:2},[r(k,{label:"Распределение моделей"},{default:v(()=>[r(b(me),{modelValue:n.value.images.model_strategy,"onUpdate:modelValue":a[16]||(a[16]=s=>n.value.images.model_strategy=s),options:re,"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),m("p",so,z(fe.value),1)]),_:1}),r(k,{label:x.value?"Качественная модель":"Модель",hint:`≈ ${D.value} картинок в час на вашем тарифе`},{default:v(()=>[m("div",ro,[(d(!0),u(M,null,le(U.value,s=>(d(),u("button",{key:s.id,class:j(["rounded-md border px-3.5 py-2.5 text-left transition-colors",n.value.images.operation===s.id?"border-tally bg-tally/10":"border-line hover:border-ink-3"]),onClick:ee=>n.value.images.operation=s.id},[m("span",co,[m("span",po,z(s.name),1),m("span",ho,z(s.credits)+" кр.",1)]),m("span",fo,z(s.note),1)],10,uo))),128))])]),_:1},8,["label","hint"]),x.value?(d(),u(M,{key:0},[r(k,{label:"Дешёвая модель",hint:`Для остальных сцен · ≈ ${Math.floor(q.value/E(n.value.images.economy_operation))} картинок в час`},{default:v(()=>[r(b(ne),{modelValue:n.value.images.economy_operation,"onUpdate:modelValue":a[17]||(a[17]=s=>n.value.images.economy_operation=s),options:Tt.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),_:1},8,["hint"]),n.value.images.model_strategy==="intro"?(d(),$(k,{key:0,label:"Качественная модель первые",hint:"Минут от начала каждого видео"},{default:v(()=>[r(b(te),{modelValue:n.value.images.premium_minutes,"onUpdate:modelValue":a[18]||(a[18]=s=>n.value.images.premium_minutes=s),min:.5,max:60,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" мин","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1})):(d(),$(k,{key:1,label:"Бюджет на проект",hint:`Кредитов на все картинки проекта. 0 — один час тарифа (${q.value} кр.). Для 10-минутного видео: ${cn.value}`},{default:v(()=>[r(b(te),{modelValue:n.value.images.budget_credits,"onUpdate:modelValue":a[19]||(a[19]=s=>n.value.images.budget_credits=s),min:0,step:50,suffix:" кр.","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"]))],64)):O("",!0),J.value?.upscale?(d(),$(k,{key:1,label:"Увеличение 2×",hint:"Чётче при зуме и в 1440p/4K, но вдвое дороже"},{default:v(()=>[r(b(Q),{modelValue:n.value.images.upscale_2x,"onUpdate:modelValue":a[20]||(a[20]=s=>n.value.images.upscale_2x=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):O("",!0),r(k,{label:"Стиль канала",hint:"Добавляется к каждому промпту: техника, свет, цвет, настроение"},{default:v(()=>[r(b(ye),{modelValue:n.value.images.style_prompt,"onUpdate:modelValue":a[21]||(a[21]=s=>n.value.images.style_prompt=s),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Чего не должно быть",hint:"Перечислите через запятую"},{default:v(()=>[r(b(ye),{modelValue:n.value.images.avoid,"onUpdate:modelValue":a[22]||(a[22]=s=>n.value.images.avoid=s),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Референсы стиля",hint:t.mode==="channel"?"Примеры картинок в нужном стиле — отправляются вместе с каждым запросом":"Задаются в настройках канала"},{default:v(()=>[m("div",mo,[r(b(Q),{modelValue:n.value.images.use_references,"onUpdate:modelValue":a[23]||(a[23]=s=>n.value.images.use_references=s),disabled:!J.value?.refs},null,8,["modelValue","disabled"]),m("span",bo,z(J.value?.refs?"Использовать референсы":"Эта модель не принимает референсы"),1)]),t.references?.length||t.mode==="channel"?(d(),u("div",vo,[(d(!0),u(M,null,le(t.references,s=>(d(),u("div",{key:s.path,class:"group relative h-20 w-32 overflow-hidden rounded-md border border-line"},[m("img",{src:s.url,alt:"Референс стиля",class:"h-full w-full object-cover"},null,8,go),t.mode==="channel"?(d(),u("button",{key:0,class:"absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex","aria-label":"Удалить референс",onClick:ee=>hn(s.path)},[...a[82]||(a[82]=[m("i",{class:"pi pi-times text-xs"},null,-1)])],8,yo)):O("",!0)]))),128)),t.mode==="channel"?(d(),u("label",ko,[m("i",{class:j(["pi",lt.value?"pi-spin pi-spinner":"pi-plus"])},null,2),a[83]||(a[83]=_("Добавить ",-1)),m("input",{type:"file",accept:"image/*",multiple:"",class:"hidden",onChange:pn},null,32)])):O("",!0)])):O("",!0)]),_:1},8,["hint"]),r(k,{label:"Референсы персонажей",hint:"Повторяющиеся герои получают портрет-образец, который отправляется со всеми сценами, где они есть: лицо, причёска и одежда не меняются от кадра к кадру"},{default:v(()=>[r(b(Q),{modelValue:n.value.images.character_refs,"onUpdate:modelValue":a[24]||(a[24]=s=>n.value.images.character_refs=s),class:"mt-1.5"},null,8,["modelValue"]),n.value.images.character_refs?(d(),u("div",wo,[m("label",Oo,[a[84]||(a[84]=m("span",{class:"text-[13px] text-ink-2"},"Модель для портретов",-1)),r(b(ne),{modelValue:n.value.images.character_operation,"onUpdate:modelValue":a[25]||(a[25]=s=>n.value.images.character_operation=s),options:Tt.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),un.value?Ft.value?(d(),u("p",xo,z(Ft.value)+" не принимает референсы — сцены с персонажами сделает "+z(qe(Oe.value))+". ",1)):O("",!0):(d(),u("p",Io," Ни одна из выбранных моделей не принимает референсы — портреты не будут учитываться. Выберите, например, Nano Banana 2. "))])):O("",!0)]),_:1}),r(k,{label:"Водяные знаки",hint:"Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется"},{default:v(()=>[r(b(ne),{modelValue:n.value.images.watermark_fix,"onUpdate:modelValue":a[26]||(a[26]=s=>n.value.images.watermark_fix=s),options:[{v:"auto",l:"Удалять автоматически"},{v:"crop",l:"Обрезать угол"},{v:"none",l:"Не трогать"}],"option-value":"v","option-label":"l",class:"w-64"},null,8,["modelValue"])]),_:1}),r(k,{label:"Исправлять отклонённые промпты",hint:"Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит"},{default:v(()=>[r(b(Q),{modelValue:n.value.images.auto_fix_rejected,"onUpdate:modelValue":a[27]||(a[27]=s=>n.value.images.auto_fix_rejected=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Попыток на картинку"},{default:v(()=>[r(b(te),{modelValue:n.value.images.max_attempts,"onUpdate:modelValue":a[28]||(a[28]=s=>n.value.images.max_attempts=s),min:1,max:6,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):h.value==="llm"?(d(),u(M,{key:3},[r(k,{label:"Модель",hint:"Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком"},{default:v(()=>[r(b(ne),{modelValue:n.value.llm.model,"onUpdate:modelValue":a[29]||(a[29]=s=>n.value.llm.model=s),options:ot.value,"option-value":"id","option-label":"name",filter:"",class:"w-80"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Тематика канала",hint:"О чём канал и для кого — помогает точнее подбирать образы и названия"},{default:v(()=>[r(b(ye),{modelValue:n.value.llm.niche,"onUpdate:modelValue":a[30]||(a[30]=s=>n.value.llm.niche=s),"auto-resize":"",rows:"2",class:"w-full",placeholder:"Например: психология отношений для женщин 30–50 лет"},null,8,["modelValue"])]),_:1}),r(k,{label:"Указания для промптов",hint:"Постоянные правила для картинок канала"},{default:v(()=>[r(b(ye),{modelValue:n.value.llm.prompt_instructions,"onUpdate:modelValue":a[31]||(a[31]=s=>n.value.llm.prompt_instructions=s),"auto-resize":"",rows:"3",class:"w-full",placeholder:"Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"},null,8,["modelValue"])]),_:1}),r(k,{label:"Креативность",value:n.value.llm.temperature.toFixed(1),hint:"Выше — разнообразнее образы, ниже — точнее по тексту"},{default:v(()=>[r(b(ie),{modelValue:n.value.llm.temperature,"onUpdate:modelValue":a[32]||(a[32]=s=>n.value.llm.temperature=s),min:0,max:1.2,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):h.value==="render"?(d(),u(M,{key:4},[r(k,{label:"Разрешение и частота"},{default:v(()=>[m("div",So,[r(b(ne),{modelValue:n.value.render.resolution,"onUpdate:modelValue":a[33]||(a[33]=s=>n.value.render.resolution=s),options:[{v:"1080p",l:"1920×1080 (Full HD)"},{v:"1440p",l:"2560×1440 (2K)"},{v:"2160p",l:"3840×2160 (4K)"}],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue"]),r(b(ne),{modelValue:n.value.render.fps,"onUpdate:modelValue":a[34]||(a[34]=s=>n.value.render.fps=s),options:[24,25,30,60],class:"w-28"},null,8,["modelValue"])]),a[85]||(a[85]=m("p",{class:"mt-2 text-[13px] text-ink-3"},"1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.",-1))]),_:1}),r(k,{label:"Движение камеры",hint:"Для каждой сцены выбирается случайно из отмеченных"},{default:v(()=>[m("div",Lo,[(d(!0),u(M,null,le(b(i).meta?.effects,s=>(d(),u("button",{key:s.id,class:j(["rounded-md border px-3 py-1.5 text-[13px] transition-colors",n.value.render.motion_effects.includes(s.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3 hover:text-ink-2"]),onClick:ee=>n.value.render.motion_effects=$t(n.value.render.motion_effects,s.id)},z(s.name),11,Co))),128))])]),_:1}),r(k,{label:"Интенсивность движения",value:`${Math.round(n.value.render.motion_intensity*100)}%`},{default:v(()=>[r(b(ie),{modelValue:n.value.render.motion_intensity,"onUpdate:modelValue":a[35]||(a[35]=s=>n.value.render.motion_intensity=s),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Крупные планы по фразам",hint:"Внутри сцены монтаж чередует общий план и более крупный план героя, склейки — на паузах в речи. Новые картинки не нужны"},{default:v(()=>[r(b(Q),{modelValue:n.value.render.phrase_cuts,"onUpdate:modelValue":a[36]||(a[36]=s=>n.value.render.phrase_cuts=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.render.motion_effects.includes("parallax")?(d(),$(k,{key:0,label:"Размытие фона",hint:"3D-параллакс: фон за героем мягко размыт, как при съёмке на длиннофокусный объектив"},{default:v(()=>[r(b(Q),{modelValue:n.value.render.depth_of_field,"onUpdate:modelValue":a[37]||(a[37]=s=>n.value.render.depth_of_field=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):O("",!0),r(k,{label:"Переходы"},{default:v(()=>[m("div",Vo,[(d(!0),u(M,null,le(b(i).meta?.transitions,s=>(d(),u("button",{key:s.id,class:j(["rounded-md border px-3 py-1.5 text-[13px] transition-colors",n.value.render.transitions.includes(s.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3 hover:text-ink-2"]),onClick:ee=>n.value.render.transitions=$t(n.value.render.transitions,s.id)},z(s.name),11,Mo))),128))])]),_:1}),r(k,{label:"Длительность перехода",value:`${n.value.render.transition_duration.toFixed(1)} с`},{default:v(()=>[r(b(ie),{modelValue:n.value.render.transition_duration,"onUpdate:modelValue":a[38]||(a[38]=s=>n.value.render.transition_duration=s),min:.2,max:1.5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Доля простых склеек",value:`${Math.round(n.value.render.cut_ratio*100)}%`,hint:"Без эффекта перехода — так монтаж выглядит естественнее"},{default:v(()=>[r(b(ie),{modelValue:n.value.render.cut_ratio,"onUpdate:modelValue":a[39]||(a[39]=s=>n.value.render.cut_ratio=s),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Появление и затухание"},{default:v(()=>[m("div",zo,[r(b(te),{modelValue:n.value.render.fade_in,"onUpdate:modelValue":a[40]||(a[40]=s=>n.value.render.fade_in=s),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(te),{modelValue:n.value.render.fade_out,"onUpdate:modelValue":a[41]||(a[41]=s=>n.value.render.fade_out=s),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Качество кодирования"},{default:v(()=>[r(b(me),{modelValue:n.value.render.quality,"onUpdate:modelValue":a[42]||(a[42]=s=>n.value.render.quality=s),options:[{v:"max",l:"Максимум"},{v:"high",l:"Высокое"},{v:"balanced",l:"Баланс"},{v:"fast",l:"Быстро"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Энкодер",hint:"Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее"},{default:v(()=>[r(b(ne),{modelValue:n.value.render.encoder,"onUpdate:modelValue":a[43]||(a[43]=s=>n.value.render.encoder=s),options:[{v:"auto",l:"Автоматически"},...(b(i).meta?.encoders??[]).map(s=>({v:s,l:s}))],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Громкость",hint:"YouTube нормализует к −14 LUFS",value:`${n.value.render.loudness} LUFS`},{default:v(()=>[r(b(ie),{modelValue:n.value.render.loudness,"onUpdate:modelValue":a[44]||(a[44]=s=>n.value.render.loudness=s),min:-24,max:-9,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Процессов рендера",hint:"0 — подобрать автоматически по числу ядер"},{default:v(()=>[r(b(te),{modelValue:n.value.render.workers,"onUpdate:modelValue":a[45]||(a[45]=s=>n.value.render.workers=s),min:0,max:16,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):h.value==="atmosphere"?(d(),u(M,{key:5},[a[86]||(a[86]=m("p",{class:"text-ink-3"}," Едва заметная жизнь в статичной картинке. Каждый рендер получает свой ритм, так что эффекты ещё и уникализируют видео. Зерно и дрожание линий заметно увеличивают размер файла. ",-1)),(d(),u(M,null,le(g,s=>(d(),u(M,{key:s[0]},[r(k,{label:s[1],hint:s[2]},{default:v(()=>[r(b(Q),{modelValue:n.value.atmosphere[s[0]],"onUpdate:modelValue":ee=>n.value.atmosphere[s[0]]=ee,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"]),n.value.atmosphere[s[0]]?(d(),$(k,{key:0,label:"Сила",value:`${Math.round(n.value.atmosphere[`${s[0]}_strength`]*100)}%`},{default:v(()=>[r(b(ie),{modelValue:n.value.atmosphere[`${s[0]}_strength`],"onUpdate:modelValue":ee=>n.value.atmosphere[`${s[0]}_strength`]=ee,min:.05,max:1,step:.05,class:"mt-3"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["value"])):O("",!0)],64))),64)),n.value.atmosphere.line_boil||n.value.atmosphere.grain_boil?(d(),$(k,{key:0,label:"Частота «кипения»",hint:"Как часто перерисовываются линии и зерно"},{default:v(()=>[r(b(me),{modelValue:n.value.atmosphere.boil_hold,"onUpdate:modelValue":a[46]||(a[46]=s=>n.value.atmosphere.boil_hold=s),options:[{v:2,l:"Быстро (на двойках)"},{v:3,l:"Классика (на тройках)"},{v:4,l:"Медленно"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1})):O("",!0)],64)):h.value==="subtitles"?(d(),u(M,{key:6},[r(k,{label:"Вшивать субтитры в видео",hint:"Файл .srt для загрузки на YouTube создаётся всегда"},{default:v(()=>[r(b(Q),{modelValue:n.value.subtitles.enabled,"onUpdate:modelValue":a[47]||(a[47]=s=>n.value.subtitles.enabled=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.enabled?(d(),u(M,{key:0},[m("div",Fo,[m("div",{class:"absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight",style:rt(bn.value)},[m("span",{style:rt(mn.value)},[n.value.subtitles.style==="karaoke"?(d(),u(M,{key:0},[m("span",{style:rt({color:n.value.subtitles.highlight_color})},"Так выглядят",4),a[87]||(a[87]=_(" субтитры",-1)),a[88]||(a[88]=m("br",null,null,-1)),a[89]||(a[89]=_("в вашем видео ",-1))],64)):(d(),u(M,{key:1},[a[90]||(a[90]=_("Так выглядят субтитры",-1)),a[91]||(a[91]=m("br",null,null,-1)),a[92]||(a[92]=_("в вашем видео",-1))],64))],4)],4)]),r(k,{label:"Стиль"},{default:v(()=>[r(b(me),{modelValue:n.value.subtitles.style,"onUpdate:modelValue":a[48]||(a[48]=s=>n.value.subtitles.style=s),options:[{v:"plain",l:"Обводка"},{v:"karaoke",l:"Подсветка слов"},{v:"box",l:"Плашка"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Шрифт",hint:"Свои шрифты положите в папку data/fonts"},{default:v(()=>[m("div",To,[r(b(ne),{modelValue:n.value.subtitles.font,"onUpdate:modelValue":a[49]||(a[49]=s=>n.value.subtitles.font=s),options:at.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(te),{modelValue:n.value.subtitles.size,"onUpdate:modelValue":a[50]||(a[50]=s=>n.value.subtitles.size=s),min:20,max:140,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"]),m("label",$o,[r(b(Q),{modelValue:n.value.subtitles.bold,"onUpdate:modelValue":a[51]||(a[51]=s=>n.value.subtitles.bold=s)},null,8,["modelValue"]),a[93]||(a[93]=_("Жирный",-1))]),m("label",Po,[r(b(Q),{modelValue:n.value.subtitles.uppercase,"onUpdate:modelValue":a[52]||(a[52]=s=>n.value.subtitles.uppercase=s)},null,8,["modelValue"]),a[94]||(a[94]=_("Заглавные",-1))])])]),_:1}),r(k,{label:"Цвета"},{default:v(()=>[m("div",Ao,[m("label",Eo,[r(b(Ie),{"model-value":n.value.subtitles.primary_color.slice(1),"onUpdate:modelValue":a[53]||(a[53]=s=>n.value.subtitles.primary_color=Ce(s))},null,8,["model-value"]),a[95]||(a[95]=_("Текст ",-1))]),n.value.subtitles.style==="karaoke"?(d(),u("label",Do,[r(b(Ie),{"model-value":n.value.subtitles.highlight_color.slice(1),"onUpdate:modelValue":a[54]||(a[54]=s=>n.value.subtitles.highlight_color=Ce(s))},null,8,["model-value"]),a[96]||(a[96]=_("Подсветка ",-1))])):O("",!0),n.value.subtitles.style!=="box"?(d(),u("label",Bo,[r(b(Ie),{"model-value":n.value.subtitles.outline_color.slice(1),"onUpdate:modelValue":a[55]||(a[55]=s=>n.value.subtitles.outline_color=Ce(s))},null,8,["model-value"]),a[97]||(a[97]=_("Обводка ",-1))])):(d(),u("label",Ho,[r(b(Ie),{"model-value":n.value.subtitles.box_color.slice(1),"onUpdate:modelValue":a[56]||(a[56]=s=>n.value.subtitles.box_color=Ce(s))},null,8,["model-value"]),a[98]||(a[98]=_("Плашка ",-1))]))])]),_:1}),n.value.subtitles.style==="box"?(d(),$(k,{key:0,label:"Прозрачность плашки",value:`${Math.round(n.value.subtitles.box_opacity*100)}%`},{default:v(()=>[r(b(ie),{modelValue:n.value.subtitles.box_opacity,"onUpdate:modelValue":a[57]||(a[57]=s=>n.value.subtitles.box_opacity=s),min:.1,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])):(d(),$(k,{key:1,label:"Толщина обводки",value:n.value.subtitles.outline.toFixed(1)},{default:v(()=>[r(b(ie),{modelValue:n.value.subtitles.outline,"onUpdate:modelValue":a[58]||(a[58]=s=>n.value.subtitles.outline=s),min:0,max:8,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])),r(k,{label:"Положение"},{default:v(()=>[m("div",Ko,[r(b(me),{modelValue:n.value.subtitles.position,"onUpdate:modelValue":a[59]||(a[59]=s=>n.value.subtitles.position=s),options:[{v:"bottom",l:"Внизу"},{v:"middle",l:"По центру"},{v:"top",l:"Вверху"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),r(b(te),{modelValue:n.value.subtitles.margin_v,"onUpdate:modelValue":a[60]||(a[60]=s=>n.value.subtitles.margin_v=s),min:0,max:400,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Длина строки",hint:"Символов в строке и строк на экране"},{default:v(()=>[m("div",Ro,[r(b(te),{modelValue:n.value.subtitles.max_chars_per_line,"onUpdate:modelValue":a[61]||(a[61]=s=>n.value.subtitles.max_chars_per_line=s),min:12,max:80,"show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(b(te),{modelValue:n.value.subtitles.max_lines,"onUpdate:modelValue":a[62]||(a[62]=s=>n.value.subtitles.max_lines=s),min:1,max:3,"show-buttons":"",class:"w-28"},null,8,["modelValue"])])]),_:1})],64)):O("",!0),r(k,{label:"Ключевые фразы на экране",hint:"Нейросеть выбирает в сценарии цифры и главные мысли, и в нужный момент они крупно появляются в кадре. Работает и без субтитров"},{default:v(()=>[r(b(Q),{modelValue:n.value.subtitles.accents,"onUpdate:modelValue":a[63]||(a[63]=s=>n.value.subtitles.accents=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.accents?(d(),u(M,{key:1},[r(k,{label:"Частота",value:`${n.value.subtitles.accents_per_minute.toFixed(1)} в минуту`,hint:"Примерно столько фраз на минуту видео; ближе 6 секунд друг к другу они не появляются"},{default:v(()=>[r(b(ie),{modelValue:n.value.subtitles.accents_per_minute,"onUpdate:modelValue":a[64]||(a[64]=s=>n.value.subtitles.accents_per_minute=s),min:.3,max:4,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Шрифт и цвет фраз"},{default:v(()=>[m("div",Uo,[r(b(ne),{modelValue:n.value.subtitles.accent_font,"onUpdate:modelValue":a[65]||(a[65]=s=>n.value.subtitles.accent_font=s),options:at.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(b(Ie),{"model-value":n.value.subtitles.accent_color.slice(1),"onUpdate:modelValue":a[66]||(a[66]=s=>n.value.subtitles.accent_color=Ce(s))},null,8,["model-value"])])]),_:1})],64)):O("",!0)],64)):h.value==="unique"?(d(),u(M,{key:7},[a[99]||(a[99]=m("p",{class:"text-ink-3"}," Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов, тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными. ",-1)),r(k,{label:"Уникализация"},{default:v(()=>[r(b(Q),{modelValue:n.value.unique.enabled,"onUpdate:modelValue":a[67]||(a[67]=s=>n.value.unique.enabled=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.unique.enabled?(d(),u(M,{key:0},[r(k,{label:"Сила",value:`${Math.round(n.value.unique.strength*100)}%`},{default:v(()=>[r(b(ie),{modelValue:n.value.unique.strength,"onUpdate:modelValue":a[68]||(a[68]=s=>n.value.unique.strength=s),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),(d(),u(M,null,le([["color_jitter","Цветокоррекция","Яркость, контраст, насыщенность и температура"],["film_grain","Плёночное зерно","Едва заметный шум, разный в каждом рендере"],["vignette","Виньетка","Мягкое затемнение по краям"],["micro_zoom","Микрозум и сдвиг","Кадр чуть иначе обрезан"],["audio_eq","Эквализация звука","Неслышимые изменения тембра ±0.6 дБ"],["strip_metadata","Очистка метаданных","Убирает служебную информацию из файла"]],s=>r(k,{key:s[0],label:s[1],hint:s[2]},{default:v(()=>[r(b(Q),{modelValue:n.value.unique[s[0]],"onUpdate:modelValue":ee=>n.value.unique[s[0]]=ee,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"])),64))],64)):O("",!0)],64)):h.value==="publish"?(d(),u(M,{key:8},[r(k,{label:"Создавать в конвейере",hint:"Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео"},{default:v(()=>[r(b(Q),{modelValue:n.value.publish.enabled,"onUpdate:modelValue":a[69]||(a[69]=s=>n.value.publish.enabled=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Вариантов названия"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.title_variants,"onUpdate:modelValue":a[70]||(a[70]=s=>n.value.publish.title_variants=s),min:1,max:10,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Тегов"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.tags_count,"onUpdate:modelValue":a[71]||(a[71]=s=>n.value.publish.tags_count=s),min:3,max:40,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Главы в описании",hint:"Таймкоды разделов по абзацам сценария"},{default:v(()=>[r(b(Q),{modelValue:n.value.publish.with_chapters,"onUpdate:modelValue":a[72]||(a[72]=s=>n.value.publish.with_chapters=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Подпись в конце описания",hint:"Ссылки, соцсети, дисклеймеры"},{default:v(()=>[r(b(ye),{modelValue:n.value.publish.description_footer,"onUpdate:modelValue":a[73]||(a[73]=s=>n.value.publish.description_footer=s),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Обложек"},{default:v(()=>[r(b(te),{modelValue:n.value.publish.thumbnail_count,"onUpdate:modelValue":a[74]||(a[74]=s=>n.value.publish.thumbnail_count=s),min:1,max:4,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель для обложек"},{default:v(()=>[r(b(ne),{modelValue:n.value.publish.thumbnail_operation,"onUpdate:modelValue":a[75]||(a[75]=s=>n.value.publish.thumbnail_operation=s),options:U.value,"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Заголовок на обложке",hint:"Модель нарисует 2–4 слова крупным шрифтом"},{default:v(()=>[r(b(Q),{modelValue:n.value.publish.thumbnail_text,"onUpdate:modelValue":a[76]||(a[76]=s=>n.value.publish.thumbnail_text=s),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стиль обложек"},{default:v(()=>[r(b(ye),{modelValue:n.value.publish.thumbnail_style,"onUpdate:modelValue":a[77]||(a[77]=s=>n.value.publish.thumbnail_style=s),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1})],64)):O("",!0)])])}}});var sn={name:"MinusIcon",extends:tt};function jo(t){return _o(t)||qo(t)||No(t)||Go()}function Go(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function No(t,e){if(t){if(typeof t=="string")return bt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?bt(t,e):void 0}}function qo(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function _o(t){if(Array.isArray(t))return bt(t)}function bt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Wo(t,e,n,l,o,i){return d(),u("svg",p({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),jo(e[0]||(e[0]=[m("path",{d:"M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z",fill:"currentColor"},null,-1)])),16)}sn.render=Wo;var Zo=`
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
`,Xo={root:function(e){var n=e.instance,l=e.props;return["p-checkbox p-component",{"p-checkbox-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$pcCheckboxGroup?n.$pcCheckboxGroup.$invalid:n.$invalid,"p-variant-filled":n.$variant==="filled","p-checkbox-sm p-inputfield-sm":l.size==="small","p-checkbox-lg p-inputfield-lg":l.size==="large"}]},box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},Yo=pe.extend({name:"checkbox",style:Zo,classes:Xo}),Jo={name:"BaseCheckbox",extends:nt,props:{value:null,binary:Boolean,indeterminate:{type:Boolean,default:!1},trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},required:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:Yo,provide:function(){return{$pcCheckbox:this,$parentInstance:this}}};function De(t){"@babel/helpers - typeof";return De=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},De(t)}function Qo(t,e,n){return(e=ea(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ea(t){var e=ta(t,"string");return De(e)=="symbol"?e:e+""}function ta(t,e){if(De(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(De(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function na(t){return aa(t)||oa(t)||la(t)||ia()}function ia(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function la(t,e){if(t){if(typeof t=="string")return vt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?vt(t,e):void 0}}function oa(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function aa(t){if(Array.isArray(t))return vt(t)}function vt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var rn={name:"Checkbox",extends:Jo,inheritAttrs:!1,emits:["change","focus","blur","update:indeterminate"],inject:{$pcCheckboxGroup:{default:void 0}},data:function(){return{d_indeterminate:this.indeterminate}},watch:{indeterminate:function(e){this.d_indeterminate=e,this.updateIndeterminate()}},mounted:function(){this.updateIndeterminate()},updated:function(){this.updateIndeterminate()},methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,indeterminate:this.d_indeterminate,disabled:this.disabled}})},onChange:function(e){var n=this;if(!this.disabled&&!this.readonly){var l=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value,o;this.binary?o=this.d_indeterminate?this.trueValue:this.checked?this.falseValue:this.trueValue:this.checked||this.d_indeterminate?o=l.filter(function(i){return!Se(i,n.value)}):o=l?[].concat(na(l),[this.value]):[this.value],this.d_indeterminate&&(this.d_indeterminate=!1,this.$emit("update:indeterminate",this.d_indeterminate)),this.$pcCheckboxGroup?this.$pcCheckboxGroup.writeValue(o,e):this.writeValue(o,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)},updateIndeterminate:function(){this.$refs.input&&(this.$refs.input.indeterminate=this.d_indeterminate)}},computed:{groupName:function(){return this.$pcCheckboxGroup?this.$pcCheckboxGroup.groupName:this.$formName},checked:function(){var e=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value;return this.d_indeterminate?!1:this.binary?e===this.trueValue:xn(this.value,e)},dataP:function(){return oe(Qo({invalid:this.$invalid,checked:this.checked,disabled:this.disabled,filled:this.$variant==="filled"},this.size,this.size))}},components:{CheckIcon:It,MinusIcon:sn}},sa=["data-p-checked","data-p-indeterminate","data-p-disabled","data-p"],ra=["id","value","name","checked","tabindex","disabled","readonly","required","aria-labelledby","aria-label","aria-invalid"],da=["data-p"];function ua(t,e,n,l,o,i){var f=G("CheckIcon"),c=G("MinusIcon");return d(),u("div",p({class:t.cx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-indeterminate":o.d_indeterminate||void 0,"data-p-disabled":t.disabled,"data-p":i.dataP}),[m("input",p({ref:"input",id:t.inputId,type:"checkbox",class:[t.cx("input"),t.inputClass],style:t.inputStyle,value:t.value,name:i.groupName,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,required:t.required,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,ra),m("div",p({class:t.cx("box")},i.getPTOptions("box"),{"data-p":i.dataP}),[C(t.$slots,"icon",{checked:i.checked,indeterminate:o.d_indeterminate,class:j(t.cx("icon")),dataP:i.dataP},function(){return[i.checked?(d(),$(f,p({key:0,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):o.d_indeterminate?(d(),$(c,p({key:1,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):O("",!0)]})],16,da)],16,sa)}rn.render=ua;var ca=`
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
`,pa={root:"p-chip p-component",image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},ha=pe.extend({name:"chip",style:ca,classes:pa}),fa={name:"BaseChip",extends:we,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:ha,provide:function(){return{$pcChip:this,$parentInstance:this}}},dn={name:"Chip",extends:fa,inheritAttrs:!1,emits:["remove"],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)},close:function(e){this.visible=!1,this.$emit("remove",e)}},computed:{dataP:function(){return oe({removable:this.removable})}},components:{TimesCircleIcon:Sn}},ma=["aria-label","data-p"],ba=["src"];function va(t,e,n,l,o,i){return o.visible?(d(),u("div",p({key:0,class:t.cx("root"),"aria-label":t.label},t.ptmi("root"),{"data-p":i.dataP}),[C(t.$slots,"default",{},function(){return[t.image?(d(),u("img",p({key:0,src:t.image},t.ptm("image"),{class:t.cx("image")}),null,16,ba)):t.$slots.icon?(d(),$(de(t.$slots.icon),p({key:1,class:t.cx("icon")},t.ptm("icon")),null,16,["class"])):t.icon?(d(),u("span",p({key:2,class:[t.cx("icon"),t.icon]},t.ptm("icon")),null,16)):O("",!0),t.label!==null?(d(),u("div",p({key:3,class:t.cx("label")},t.ptm("label")),z(t.label),17)):O("",!0)]}),t.removable?C(t.$slots,"removeicon",{key:0,removeCallback:i.close,keydownCallback:i.onKeydown},function(){return[(d(),$(de(t.removeIcon?"span":"TimesCircleIcon"),p({class:[t.cx("removeIcon"),t.removeIcon],onClick:i.close,onKeydown:i.onKeydown},t.ptm("removeIcon")),null,16,["class","onClick","onKeydown"]))]}):O("",!0)],16,ma)):O("",!0)}dn.render=va;var ga=`
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
`,ya={root:function(e){var n=e.props;return{position:n.appendTo==="self"?"relative":void 0}}},ka={root:function(e){var n=e.instance,l=e.props;return["p-multiselect p-component p-inputwrapper",{"p-multiselect-display-chip":l.display==="chip","p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":n.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":n.focused||n.overlayVisible,"p-multiselect-open":n.overlayVisible,"p-multiselect-fluid":n.$fluid,"p-multiselect-sm p-inputfield-sm":l.size==="small","p-multiselect-lg p-inputfield-lg":l.size==="large"}]},labelContainer:"p-multiselect-label-container",label:function(e){var n=e.instance,l=e.props;return["p-multiselect-label",{"p-placeholder":n.label===l.placeholder,"p-multiselect-label-empty":!l.placeholder&&!n.$filled}]},clearIcon:"p-multiselect-clear-icon",chipItem:"p-multiselect-chip-item",pcChip:"p-multiselect-chip",chipIcon:"p-multiselect-chip-icon",dropdown:"p-multiselect-dropdown",loadingIcon:"p-multiselect-loading-icon",dropdownIcon:"p-multiselect-dropdown-icon",overlay:"p-multiselect-overlay p-component",header:"p-multiselect-header",pcFilterContainer:"p-multiselect-filter-container",pcFilter:"p-multiselect-filter",listContainer:"p-multiselect-list-container",list:"p-multiselect-list",optionGroup:"p-multiselect-option-group",option:function(e){var n=e.instance,l=e.option,o=e.index,i=e.getItemOptions,f=e.props;return["p-multiselect-option",{"p-multiselect-option-selected":n.isSelected(l)&&f.highlightOnSelect,"p-focus":n.focusedOptionIndex===n.getOptionIndex(o,i),"p-disabled":n.isOptionDisabled(l)}]},emptyMessage:"p-multiselect-empty-message"},wa=pe.extend({name:"multiselect",style:ga,classes:ka,inlineStyles:ya}),Oa={name:"BaseMultiSelect",extends:nt,props:{options:Array,optionLabel:null,optionValue:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:"14rem"},placeholder:String,inputId:{type:String,default:null},panelClass:{type:String,default:null},panelStyle:{type:null,default:null},overlayClass:{type:String,default:null},overlayStyle:{type:null,default:null},dataKey:null,showClear:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},resetFilterOnClear:{type:Boolean,default:!1},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},display:{type:String,default:"comma"},selectedItemsLabel:{type:String,default:null},maxSelectedLabels:{type:Number,default:null},selectionLimit:{type:Number,default:null},showToggleAll:{type:Boolean,default:!0},loading:{type:Boolean,default:!1},checkboxIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},removeTokenIcon:{type:String,default:void 0},chipIcon:{type:String,default:void 0},selectAll:{type:Boolean,default:null},resetFilterOnHide:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:wa,provide:function(){return{$pcMultiSelect:this,$parentInstance:this}}};function Be(t){"@babel/helpers - typeof";return Be=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Be(t)}function Ut(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),n.push.apply(n,l)}return n}function jt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Ut(Object(n),!0).forEach(function(l){be(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Ut(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function be(t,e,n){return(e=Ia(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ia(t){var e=xa(t,"string");return Be(e)=="symbol"?e:e+""}function xa(t,e){if(Be(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Be(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function Gt(t){return Va(t)||Ca(t)||La(t)||Sa()}function Sa(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function La(t,e){if(t){if(typeof t=="string")return gt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?gt(t,e):void 0}}function Ca(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Va(t){if(Array.isArray(t))return gt(t)}function gt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Ma={name:"MultiSelect",extends:Oa,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter","selectall-change"],inject:{$pcFluid:{default:null}},outsideClickListener:null,scrollHandler:null,resizeListener:null,overlay:null,list:null,virtualScroller:null,startRangeIndex:-1,searchTimeout:null,searchValue:"",selectOnFocus:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1}},watch:{options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(ae.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?ue(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?ue(e,this.optionValue):e},getOptionRenderKey:function(e,n){return this.dataKey?ue(e,this.dataKey):this.getOptionLabel(e)+"_".concat(n)},getHeaderCheckboxPTOptions:function(e){return this.ptm(e,{context:{selected:this.allSelected}})},getCheckboxPTOptions:function(e,n,l,o){return this.ptm(o,{context:{selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.maxSelectionLimitReached&&!this.isSelected(e)?!0:this.optionDisabled?ue(e,this.optionDisabled):!1},isOptionGroup:function(e){return!!(this.optionGroupLabel&&e.optionGroup&&e.group)},getOptionGroupLabel:function(e){return ue(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return ue(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),e&&Y(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&Y(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.findSelectedOptionIndex(),!this.autoFilterFocus&&this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n,l;this.clicked=!1,this.focused=!1,this.focusedOptionIndex=-1,this.searchValue="",this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"ShiftLeft":case"ShiftRight":this.onShiftKey(e);break;default:if(e.code==="KeyA"&&l){var o=this.visibleOptions.filter(function(i){return n.isValidOption(i)}).map(function(i){return n.getOptionValue(i)});this.updateModel(e,o),e.preventDefault();break}!l&&Yt(e.key)&&(!this.overlayVisible&&this.show(),this.searchOptions(e),e.preventDefault());break}this.clicked=!1},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,[]),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Xt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;Y(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Zt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;Y(n)},onOptionSelect:function(e,n){var l=this,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1,i=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;if(!(this.disabled||this.isOptionDisabled(n))){var f=this.isSelected(n),c=null;f?c=this.d_value.filter(function(h){return!Se(h,l.getOptionValue(n),l.equalityKey)}):c=[].concat(Gt(this.d_value||[]),[this.getOptionValue(n)]),this.updateModel(e,c),o!==-1&&(this.focusedOptionIndex=o),i&&Y(this.$refs.focusInput)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onOptionSelectRange:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,o=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(l===-1&&(l=this.findNearestSelectedOptionIndex(o,!0)),o===-1&&(o=this.findNearestSelectedOptionIndex(l)),l!==-1&&o!==-1){var i=Math.min(l,o),f=Math.max(l,o),c=this.visibleOptions.slice(i,f+1).filter(function(h){return n.isValidOption(h)}).map(function(h){return n.getOptionValue(h)});this.updateModel(e,c)}},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e,!0);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){it.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show();else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,n),this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();e.shiftKey&&this.onOptionSelectRange(e,l,this.startRangeIndex),this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else{var o=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();e.shiftKey&&o&&this.onOptionSelectRange(e,i,this.startRangeIndex),this.changeFocusedOptionIndex(e,i),!this.overlayVisible&&this.show()}e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var o=l.value.length;l.setSelectionRange(o,o),this.focusedOptionIndex=-1}}else{var i=e.metaKey||e.ctrlKey,f=this.findLastOptionIndex();e.shiftKey&&i&&this.onOptionSelectRange(e,this.startRangeIndex,f),this.changeFocusedOptionIndex(e,f),!this.overlayVisible&&this.show()}e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?this.focusedOptionIndex!==-1&&(e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex])):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onEscapeKey:function(e){this.overlayVisible&&(this.hide(!0),e.stopPropagation()),e.preventDefault()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(Y(e.shiftKey?this.$refs.lastHiddenFocusableElementOnOverlay:this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onOverlayEnter:function(e){ae.set("overlay",e,this.$primevue.config.zIndex.overlay),kt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.autoFilterFocus&&Y(this.$refs.filterInput.$el),this.autoUpdateModel(),this.$attrSelector&&e.setAttribute(this.$attrSelector,"")},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){ae.clear(e)},alignOverlay:function(){this.appendTo==="self"?wt(this.overlay,this.$el):(this.overlay.style.minWidth=Fe(this.$el)+"px",Qe(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new Je(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!Ye()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},isOutsideClicked:function(e){return!(this.$el.isSameNode(e.target)||this.$el.contains(e.target)||this.overlay&&this.overlay.contains(e.target))},getLabelByValue:function(e){var n=this,l=this.optionGroupLabel?this.flatOptions(this.options):this.options||[],o=l.find(function(i){return!n.isOptionGroup(i)&&Se(n.getOptionValue(i),e,n.equalityKey)});return this.getOptionLabel(o)},getSelectedItemsLabel:function(){var e=/{(.*?)}/,n=this.selectedItemsLabel||this.$primevue.config.locale.selectionMessage;return e.test(n)?n.replace(n.match(e)[0],this.d_value.length+""):n},onToggleAll:function(e){var n=this;if(this.selectAll!==null)this.$emit("selectall-change",{originalEvent:e,checked:!this.allSelected});else{var l=this.allSelected?[]:this.visibleOptions.filter(function(o){return n.isValidOption(o)}).map(function(o){return n.getOptionValue(o)});this.updateModel(e,l)}},removeOption:function(e,n){var l=this;e.stopPropagation();var o=this.d_value.filter(function(i){return!Se(i,n,l.equalityKey)});this.updateModel(e,o)},clearFilter:function(){this.filterValue=null},hasFocusableElements:function(){return Wt(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return he(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,n){return Se(e,n,this.equalityKey)},isSelected:function(e){var n=this,l=this.getOptionValue(e);return(this.d_value||[]).some(function(o){return n.isEquals(o,l)})},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return xe(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidOption(o)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidOption(o)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;if(this.$filled){for(var n=function(){var f=e.d_value[o],c=e.visibleOptions.findIndex(function(h){return e.isValidSelectedOption(h)&&e.isEquals(f,e.getOptionValue(h))});if(c>-1)return{v:c}},l,o=this.d_value.length-1;o>=0;o--)if(l=n(),l)return l.v}return-1},findFirstSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)}):-1},findLastSelectedOptionIndex:function(){var e=this;return this.$filled?xe(this.visibleOptions,function(n){return e.isValidSelectedOption(n)}):-1},findNextSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(o){return n.isValidSelectedOption(o)}):-1;return l>-1?l+e+1:-1},findPrevSelectedOptionIndex:function(e){var n=this,l=this.$filled&&e>0?xe(this.visibleOptions.slice(0,e),function(o){return n.isValidSelectedOption(o)}):-1;return l>-1?l:-1},findNearestSelectedOptionIndex:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,l=-1;return this.$filled&&(n?(l=this.findPrevSelectedOptionIndex(e),l=l===-1?this.findNextSelectedOptionIndex(e):l):(l=this.findNextSelectedOptionIndex(e),l=l===-1?this.findPrevSelectedOptionIndex(e):l)),l>-1?l:e},findFirstFocusedOptionIndex:function(){var e=this.findFirstSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e){var n=this;this.searchValue=(this.searchValue||"")+e.key;var l=-1;he(this.searchValue)&&(this.focusedOptionIndex!==-1?(l=this.visibleOptions.slice(this.focusedOptionIndex).findIndex(function(o){return n.isOptionMatched(o)}),l=l===-1?this.visibleOptions.slice(0,this.focusedOptionIndex).findIndex(function(o){return n.isOptionMatched(o)}):l+this.focusedOptionIndex):l=this.visibleOptions.findIndex(function(o){return n.isOptionMatched(o)}),l===-1&&this.focusedOptionIndex===-1&&(l=this.findFirstFocusedOptionIndex()),l!==-1&&this.changeFocusedOptionIndex(e,l)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){n.searchValue="",n.searchTimeout=null},500)},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n]))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,o=Te(e.list,'li[id="'.concat(l,'"]'));o?o.scrollIntoView&&o.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){if(this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled){var e=this.getOptionValue(this.visibleOptions[this.focusedOptionIndex]);this.updateModel(null,[e])}},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,o,i){var f=n.getOptionGroupChildren(o);return f&&Array.isArray(f)?(l.push({optionGroup:o,group:!0,index:i}),f.forEach(function(c){return l.push(c)})):l.push(o),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=_t.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var o=this.options||[],i=[];return o.forEach(function(f){var c=e.getOptionGroupChildren(f),h=c.filter(function(g){return l.includes(g)});h.length>0&&i.push(jt(jt({},f),{},be({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",Gt(h))))}),this.flatOptions(i)}return l}return n},label:function(){var e;if(this.d_value&&this.d_value.length)if(this.loading&&(!this.options||this.options.length===0))e=this.placeholder;else{if(he(this.maxSelectedLabels)&&this.d_value.length>this.maxSelectedLabels)return this.getSelectedItemsLabel();e="";for(var n=0;n<this.d_value.length;n++)n!==0&&(e+=", "),e+=this.getLabelByValue(this.d_value[n])}else e=this.placeholder;return e},chipSelectedItems:function(){return he(this.maxSelectedLabels)&&this.d_value&&this.d_value.length>this.maxSelectedLabels},allSelected:function(){var e=this;return this.selectAll!==null?this.selectAll:he(this.visibleOptions)&&this.visibleOptions.every(function(n){return e.isOptionGroup(n)||e.isOptionDisabled(n)||e.isSelected(n)})},hasSelectedOption:function(){return this.$filled},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},maxSelectionLimitReached:function(){return this.selectionLimit&&this.d_value&&this.d_value.length===this.selectionLimit},filterResultMessageText:function(){return he(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}",this.d_value.length):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},toggleAllAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria[this.allSelected?"selectAll":"unselectAll"]:void 0},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},hasFluid:function(){return Ln(this.fluid)?!!this.$pcFluid:this.fluid},isClearIconVisible:function(){return this.showClear&&this.d_value&&this.d_value.length&&this.d_value!=null&&he(this.options)&&!this.disabled&&!this.loading},containerDataP:function(){return oe(be({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return oe(be(be(be({placeholder:this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled},this.size,this.size),"has-chip",this.display==="chip"&&this.d_value&&this.d_value.length&&(this.maxSelectedLabels?this.d_value.length<=this.maxSelectedLabels:!0)),"empty",!this.placeholder&&!this.$filled))},dropdownIconDataP:function(){return oe(be({},this.size,this.size))},overlayDataP:function(){return oe(be({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:yt},components:{InputText:Ze,Checkbox:rn,VirtualScroller:zt,Portal:Re,Chip:dn,IconField:Vt,InputIcon:Mt,TimesIcon:xt,SearchIcon:Ct,ChevronDownIcon:Lt,SpinnerIcon:Ot,CheckIcon:It}};function He(t){"@babel/helpers - typeof";return He=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},He(t)}function Nt(t,e,n){return(e=za(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function za(t){var e=Fa(t,"string");return He(e)=="symbol"?e:e+""}function Fa(t,e){if(He(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(He(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Ta=["data-p"],$a=["id","disabled","placeholder","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid"],Pa=["data-p"],Aa={key:1},Ea=["data-p"],Da=["id","aria-label"],Ba=["id"],Ha=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onClick","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function Ka(t,e,n,l,o,i){var f=G("Chip"),c=G("SpinnerIcon"),h=G("Checkbox"),g=G("InputText"),w=G("SearchIcon"),S=G("InputIcon"),T=G("IconField"),H=G("VirtualScroller"),B=G("Portal"),A=Ue("ripple");return d(),u("div",p({ref:"container",class:t.cx("root"),style:t.sx("root"),onClick:e[7]||(e[7]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[m("div",p({class:"p-hidden-accessible"},t.ptm("hiddenInputContainer"),{"data-p-hidden-accessible":!0}),[m("input",p({ref:"focusInput",id:t.inputId,type:"text",readonly:"",disabled:t.disabled,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":o.overlayVisible,"aria-controls":o.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":o.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)})},t.ptm("hiddenInput")),null,16,$a)],16),m("div",p({class:t.cx("labelContainer")},t.ptm("labelContainer")),[m("div",p({class:t.cx("label"),"data-p":i.labelDataP},t.ptm("label")),[C(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){return[t.display==="comma"?(d(),u(M,{key:0},[_(z(i.label||"empty"),1)],64)):t.display==="chip"?(d(),u(M,{key:1},[t.loading&&(!t.options||t.options.length===0)?(d(),u(M,{key:0},[_(z(t.placeholder||"empty"),1)],64)):i.chipSelectedItems?(d(),u("span",Aa,z(i.label),1)):(d(!0),u(M,{key:2},le(t.d_value,function(I,R){return d(),u("span",p({key:"chip-".concat(i.getLabelByValue(I),"_").concat(R),class:t.cx("chipItem")},{ref_for:!0},t.ptm("chipItem")),[C(t.$slots,"chip",{value:I,removeCallback:function(K){return i.removeOption(K,I)}},function(){return[r(f,{class:j(t.cx("pcChip")),label:i.getLabelByValue(I),removeIcon:t.chipIcon||t.removeTokenIcon,removable:"",unstyled:t.unstyled,onRemove:function(K){return i.removeOption(K,I)},pt:t.ptm("pcChip")},{removeicon:v(function(){return[C(t.$slots,t.$slots.chipicon?"chipicon":"removetokenicon",{class:j(t.cx("chipIcon")),item:I,removeCallback:function(K){return i.removeOption(K,I)}})]}),_:2},1032,["class","label","removeIcon","unstyled","onRemove","pt"])]})],16)}),128)),!t.d_value||t.d_value.length===0?(d(),u(M,{key:3},[_(z(t.placeholder||"empty"),1)],64)):O("",!0)],64)):O("",!0)]})],16,Pa)],16),i.isClearIconVisible?C(t.$slots,"clearicon",{key:0,class:j(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(d(),$(de(t.clearIcon?"i":"TimesIcon"),p({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):O("",!0),m("div",p({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?C(t.$slots,"loadingicon",{key:0,class:j(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(d(),u("span",p({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(d(),$(c,p({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):C(t.$slots,"dropdownicon",{key:1,class:j(t.cx("dropdownIcon"))},function(){return[(d(),$(de(t.dropdownIcon?"span":"ChevronDownIcon"),p({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(B,{appendTo:t.appendTo},{default:v(function(){return[r(Ge,p({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[o.overlayVisible?(d(),u("div",p({key:0,ref:i.overlayRef,style:[t.panelStyle,t.overlayStyle],class:[t.cx("overlay"),t.panelClass,t.overlayClass],onClick:e[5]||(e[5]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[m("span",p({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[3]||(e[3]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),C(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.showToggleAll&&t.selectionLimit==null||t.filter?(d(),u("div",p({key:0,class:t.cx("header")},t.ptm("header")),[t.showToggleAll&&t.selectionLimit==null?(d(),$(h,{key:0,modelValue:i.allSelected,binary:!0,disabled:t.disabled,variant:t.variant,"aria-label":i.toggleAllAriaLabel,onChange:i.onToggleAll,unstyled:t.unstyled,pt:i.getHeaderCheckboxPTOptions("pcHeaderCheckbox"),formControl:{novalidate:!0}},{icon:v(function(I){return[t.$slots.headercheckboxicon?(d(),$(de(t.$slots.headercheckboxicon),{key:0,checked:I.checked,class:j(I.class)},null,8,["checked","class"])):I.checked?(d(),$(de(t.checkboxIcon?"span":"CheckIcon"),p({key:1,class:[I.class,Nt({},t.checkboxIcon,I.checked)]},i.getHeaderCheckboxPTOptions("pcHeaderCheckbox.icon")),null,16,["class"])):O("",!0)]}),_:1},8,["modelValue","disabled","variant","aria-label","onChange","unstyled","pt"])):O("",!0),t.filter?(d(),$(T,{key:1,class:j(t.cx("pcFilterContainer")),unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(g,{ref:"filterInput",value:o.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:j(t.cx("pcFilter")),placeholder:t.filterPlaceholder,disabled:t.disabled,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","disabled","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(S,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[C(t.$slots,"filtericon",{},function(){return[t.filterIcon?(d(),u("span",p({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(d(),$(w,Jt(p({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["class","unstyled","pt"])):O("",!0),t.filter?(d(),u("span",p({key:2,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),z(i.filterResultMessageText),17)):O("",!0)],16)):O("",!0),m("div",p({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(H,p({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),Qt({content:v(function(I){var R=I.styleClass,P=I.contentRef,K=I.items,V=I.getItemOptions,se=I.contentStyle,N=I.itemSize;return[m("ul",p({ref:function(F){return i.listRef(F,P)},id:t.$id+"_list",class:[t.cx("list"),R],style:se,role:"listbox","aria-multiselectable":"true","aria-label":i.listAriaLabel},t.ptm("list")),[(d(!0),u(M,null,le(K,function(L,F){return d(),u(M,{key:i.getOptionRenderKey(L,i.getOptionIndex(F,V))},[i.isOptionGroup(L)?(d(),u("li",p({key:0,id:t.$id+"_"+i.getOptionIndex(F,V),style:{height:N?N+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[C(t.$slots,"optiongroup",{option:L.optionGroup,index:i.getOptionIndex(F,V)},function(){return[_(z(i.getOptionGroupLabel(L.optionGroup)),1)]})],16,Ba)):je((d(),u("li",p({key:1,id:t.$id+"_"+i.getOptionIndex(F,V),style:{height:N?N+"px":void 0},class:t.cx("option",{option:L,index:F,getItemOptions:V}),role:"option","aria-label":i.getOptionLabel(L),"aria-selected":i.isSelected(L),"aria-disabled":i.isOptionDisabled(L),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(F,V)),onClick:function(J){return i.onOptionSelect(J,L,i.getOptionIndex(F,V),!0)},onMousemove:function(J){return i.onOptionMouseMove(J,i.getOptionIndex(F,V))}},{ref_for:!0},i.getCheckboxPTOptions(L,V,F,"option"),{"data-p-selected":i.isSelected(L),"data-p-focused":o.focusedOptionIndex===i.getOptionIndex(F,V),"data-p-disabled":i.isOptionDisabled(L)}),[r(h,{defaultValue:i.isSelected(L),binary:!0,tabindex:-1,variant:t.variant,unstyled:t.unstyled,pt:i.getCheckboxPTOptions(L,V,F,"pcOptionCheckbox"),formControl:{novalidate:!0}},{icon:v(function(U){return[t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon?(d(),$(de(t.$slots.optioncheckboxicon||t.$slots.itemcheckboxicon),{key:0,checked:U.checked,class:j(U.class)},null,8,["checked","class"])):U.checked?(d(),$(de(t.checkboxIcon?"span":"CheckIcon"),p({key:1,class:[U.class,Nt({},t.checkboxIcon,U.checked)]},{ref_for:!0},i.getCheckboxPTOptions(L,V,F,"pcOptionCheckbox.icon")),null,16,["class"])):O("",!0)]}),_:2},1032,["defaultValue","variant","unstyled","pt"]),C(t.$slots,"option",{option:L,selected:i.isSelected(L),index:i.getOptionIndex(F,V)},function(){return[m("span",p({ref_for:!0},t.ptm("optionLabel")),z(i.getOptionLabel(L)),17)]})],16,Ha)),[[A]])],64)}),128)),o.filterValue&&(!K||K&&K.length===0)?(d(),u("li",p({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[C(t.$slots,"emptyfilter",{},function(){return[_(z(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(d(),u("li",p({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage")),[C(t.$slots,"empty",{},function(){return[_(z(i.emptyMessageText),1)]})],16)):O("",!0)],16,Da)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(I){var R=I.options;return[C(t.$slots,"loader",{options:R})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),C(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(d(),u("span",p({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),z(i.emptyMessageText),17)):O("",!0),m("span",p({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),z(i.selectedMessageText),17),m("span",p({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[4]||(e[4]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Ea)):O("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,Ta)}Ma.render=Ka;var Ra=`
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
`,Ua={mask:function(e){var n=e.position,l=e.modal;return{position:"fixed",height:"100%",width:"100%",left:0,top:0,display:"flex",justifyContent:n==="left"?"flex-start":n==="right"?"flex-end":"center",alignItems:n==="top"?"flex-start":n==="bottom"?"flex-end":"center",pointerEvents:l?"auto":"none"}},root:{pointerEvents:"auto"}},ja={mask:function(e){var n=e.instance,l=e.props,o=["left","right","top","bottom"],i=o.find(function(f){return f===l.position});return["p-drawer-mask",{"p-overlay-mask p-overlay-mask-enter-active":l.modal,"p-drawer-open":n.containerVisible,"p-drawer-full":n.fullScreen},i?"p-drawer-".concat(i):""]},root:function(e){var n=e.instance;return["p-drawer p-component",{"p-drawer-full":n.fullScreen}]},header:"p-drawer-header",title:"p-drawer-title",pcCloseButton:"p-drawer-close-button",content:"p-drawer-content",footer:"p-drawer-footer"},Ga=pe.extend({name:"drawer",style:Ra,classes:ja,inlineStyles:Ua}),Na={name:"BaseDrawer",extends:we,props:{visible:{type:Boolean,default:!1},position:{type:String,default:"left"},header:{type:null,default:null},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},dismissable:{type:Boolean,default:!0},showCloseIcon:{type:Boolean,default:!0},closeButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}},closeIcon:{type:String,default:void 0},modal:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!1},closeOnEscape:{type:Boolean,default:!0}},style:Ga,provide:function(){return{$pcDrawer:this,$parentInstance:this}}};function Ke(t){"@babel/helpers - typeof";return Ke=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ke(t)}function dt(t,e,n){return(e=qa(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function qa(t){var e=_a(t,"string");return Ke(e)=="symbol"?e:e+""}function _a(t,e){if(Ke(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ke(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Wa={name:"Drawer",extends:Na,inheritAttrs:!1,emits:["update:visible","show","after-show","hide","after-hide","before-hide"],data:function(){return{containerVisible:this.visible}},container:null,mask:null,content:null,headerContainer:null,footerContainer:null,closeButton:null,outsideClickListener:null,documentKeydownListener:null,watch:{dismissable:function(e){e&&!this.modal?this.bindOutsideClickListener():this.unbindOutsideClickListener()}},updated:function(){this.visible&&(this.containerVisible=this.visible)},beforeUnmount:function(){this.disableDocumentSettings(),this.mask&&this.autoZIndex&&ae.clear(this.mask),this.container=null,this.mask=null},methods:{hide:function(){this.$emit("update:visible",!1)},onEnter:function(){this.$emit("show"),this.focus(),this.bindDocumentKeyDownListener(),this.autoZIndex&&ae.set("modal",this.mask,this.baseZIndex||this.$primevue.config.zIndex.modal)},onAfterEnter:function(){this.enableDocumentSettings(),this.$emit("after-show")},onBeforeLeave:function(){this.modal&&!this.isUnstyled&&ut(this.mask,"p-overlay-mask-leave-active"),this.$emit("before-hide")},onLeave:function(){this.$emit("hide")},onAfterLeave:function(){this.autoZIndex&&ae.clear(this.mask),this.unbindDocumentKeyDownListener(),this.containerVisible=!1,this.disableDocumentSettings(),this.$emit("after-hide")},onMaskClick:function(e){this.dismissable&&this.modal&&this.mask===e.target&&this.hide()},focus:function(){var e=function(o){return o&&o.querySelector("[autofocus]")},n=this.$slots.header&&e(this.headerContainer);n||(n=this.$slots.default&&e(this.container),n||(n=this.$slots.footer&&e(this.footerContainer),n||(n=this.closeButton))),n&&Y(n)},enableDocumentSettings:function(){this.dismissable&&!this.modal&&this.bindOutsideClickListener(),this.blockScroll&&Mn()},disableDocumentSettings:function(){this.unbindOutsideClickListener(),this.blockScroll&&Vn()},onKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&this.hide()},containerRef:function(e){this.container=e},maskRef:function(e){this.mask=e},contentRef:function(e){this.content=e},headerContainerRef:function(e){this.headerContainer=e},footerContainerRef:function(e){this.footerContainer=e},closeButtonRef:function(e){this.closeButton=e?e.$el:void 0},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeydown,document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},isOutsideClicked:function(e){return this.container&&!this.container.contains(e.target)}},computed:{fullScreen:function(){return this.position==="full"},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return oe(dt(dt(dt({"full-screen":this.position==="full"},this.position,this.position),"open",this.containerVisible),"modal",this.modal))}},directives:{focustrap:Cn},components:{Button:ke,Portal:Re,TimesIcon:xt}},Za=["data-p"],Xa=["role","aria-modal","data-p"];function Ya(t,e,n,l,o,i){var f=G("Button"),c=G("Portal"),h=Ue("focustrap");return d(),$(c,null,{default:v(function(){return[o.containerVisible?(d(),u("div",p({key:0,ref:i.maskRef,onMousedown:e[0]||(e[0]=function(){return i.onMaskClick&&i.onMaskClick.apply(i,arguments)}),class:t.cx("mask"),style:t.sx("mask",!0,{position:t.position,modal:t.modal}),"data-p":i.dataP},t.ptm("mask")),[r(Ge,p({name:"p-drawer",onEnter:i.onEnter,onAfterEnter:i.onAfterEnter,onBeforeLeave:i.onBeforeLeave,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave,appear:""},t.ptm("transition")),{default:v(function(){return[t.visible?je((d(),u("div",p({key:0,ref:i.containerRef,class:t.cx("root"),style:t.sx("root"),role:t.modal?"dialog":"complementary","aria-modal":t.modal?!0:void 0,"data-p":i.dataP},t.ptmi("root")),[t.$slots.container?C(t.$slots,"container",{key:0,closeCallback:i.hide}):(d(),u(M,{key:1},[m("div",p({ref:i.headerContainerRef,class:t.cx("header")},t.ptm("header")),[C(t.$slots,"header",{class:j(t.cx("title"))},function(){return[t.header?(d(),u("div",p({key:0,class:t.cx("title")},t.ptm("title")),z(t.header),17)):O("",!0)]}),t.showCloseIcon?C(t.$slots,"closebutton",{key:0,closeCallback:i.hide},function(){return[r(f,p({ref:i.closeButtonRef,type:"button",class:t.cx("pcCloseButton"),"aria-label":i.closeAriaLabel,unstyled:t.unstyled,onClick:i.hide},t.closeButtonProps,{pt:t.ptm("pcCloseButton"),"data-pc-group-section":"iconcontainer"}),{icon:v(function(g){return[C(t.$slots,"closeicon",{},function(){return[(d(),$(de(t.closeIcon?"span":"TimesIcon"),p({class:[t.closeIcon,g.class]},t.ptm("pcCloseButton").icon),null,16,["class"]))]})]}),_:3},16,["class","aria-label","unstyled","onClick","pt"])]}):O("",!0)],16),m("div",p({ref:i.contentRef,class:t.cx("content")},t.ptm("content")),[C(t.$slots,"default")],16),t.$slots.footer?(d(),u("div",p({key:0,ref:i.footerContainerRef,class:t.cx("footer")},t.ptm("footer")),[C(t.$slots,"footer")],16)):O("",!0)],64))],16,Xa)),[[h]]):O("",!0)]}),_:3},16,["onEnter","onAfterEnter","onBeforeLeave","onLeave","onAfterLeave"])],16,Za)):O("",!0)]}),_:3})}Wa.render=Ya;function ss(t){const e=Ne(),n=et(),l=X(null);async function o(i,f={},c){l.value=i;try{await ce.post(`/api/tracks/${t()}/jobs/${i}`,f),n.loadActiveJobs(),c&&e.info(c)}catch(h){e.error(h)}finally{l.value=null}}return{run:o,starting:l}}function Ja(t,e){if(t&&e&&typeof t=="object"&&typeof e=="object"&&!Array.isArray(t)){const n={};for(const[l,o]of Object.entries(t)){const i=Ja(o,e[l]);i!==void 0&&(n[l]=i)}return Object.keys(n).length?n:void 0}return JSON.stringify(t)===JSON.stringify(e)?void 0:t}export{ln as S,as as _,ns as a,Wa as b,ye as c,Ma as d,ne as e,rn as f,Ja as g,ss as h,ls as i,is as m,Gn as s,os as u};
