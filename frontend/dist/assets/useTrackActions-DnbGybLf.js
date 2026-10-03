import{aj as Rt,B as de,D as Ue,R as kt,p as ge,q as re,Y as it,O as lt,S as ot,Q as Fe,T as se,U as wt,V as le,ak as Be,K as Ae,x as b,al as Kt,$ as Re,k as d,c as u,b as p,a4 as Ke,m as E,a0 as W,y as Le,f as O,t as H,j as q,w as v,e as r,a1 as je,v as T,F as V,r as ae,l as N,am as xt,an as We,ao as jt,P as It,ap as Ge,A as Ot,aq as Ee,ar as xe,as as Ie,z as St,C as Lt,E as Ze,G as at,H as He,J as Gt,M as pt,L as Ct,N as _t,W as Nt,X as qt,at as Wt,Z as Zt,_ as be,a2 as Xt,a3 as Yt,ab as Vt,d as st,a5 as zt,u as rt,a6 as dt,h as K,a7 as _e,a as Jt,g as m,a8 as Qt,a9 as De,aa as fe,i as Q,n as ce,o as en,ae as Ne,au as tn,av as nn,aw as ln,ax as on}from"./index-OrRunlSx.js";import{a as ie,s as _}from"./index-D6Dv6a4b.js";import{s as ve}from"./index-6Nc3qS5E.js";var ut=Rt(),an=`
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
`,sn={root:function(e){var n=e.props;return["p-menu p-component",{"p-menu-overlay":n.popup}]},start:"p-menu-start",list:"p-menu-list",submenuLabel:"p-menu-submenu-label",separator:"p-menu-separator",end:"p-menu-end",item:function(e){var n=e.instance;return["p-menu-item",{"p-focus":n.id===n.focusedOptionId,"p-disabled":n.disabled()}]},itemContent:"p-menu-item-content",itemLink:"p-menu-item-link",itemIcon:"p-menu-item-icon",itemLabel:"p-menu-item-label"},rn=de.extend({name:"menu",style:an,classes:sn}),dn={name:"BaseMenu",extends:ge,props:{popup:{type:Boolean,default:!1},model:{type:Array,default:null},appendTo:{type:[String,Object],default:"body"},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:rn,provide:function(){return{$pcMenu:this,$parentInstance:this}}},Mt={name:"Menuitem",hostName:"Menu",extends:ge,inheritAttrs:!1,emits:["item-click","item-mousemove"],props:{item:null,templates:null,id:null,focusedOptionId:null,index:null},methods:{getItemProp:function(e,n){return e&&e.item?Kt(e.item[n]):void 0},getPTOptions:function(e){return this.ptm(e,{context:{item:this.item,index:this.index,focused:this.isItemFocused(),disabled:this.disabled()}})},isItemFocused:function(){return this.focusedOptionId===this.id},onItemClick:function(e){var n=this.getItemProp(this.item,"command");n&&n({originalEvent:e,item:this.item.item}),this.$emit("item-click",{originalEvent:e,item:this.item,id:this.id})},onItemMouseMove:function(e){this.$emit("item-mousemove",{originalEvent:e,item:this.item,id:this.id})},visible:function(){return typeof this.item.visible=="function"?this.item.visible():this.item.visible!==!1},disabled:function(){return typeof this.item.disabled=="function"?this.item.disabled():this.item.disabled},label:function(){return typeof this.item.label=="function"?this.item.label():this.item.label},getMenuItemProps:function(e){return{action:b({class:this.cx("itemLink"),tabindex:"-1"},this.getPTOptions("itemLink")),icon:b({class:[this.cx("itemIcon"),e.icon]},this.getPTOptions("itemIcon")),label:b({class:this.cx("itemLabel")},this.getPTOptions("itemLabel"))}}},computed:{dataP:function(){return re({focus:this.isItemFocused(),disabled:this.disabled()})}},directives:{ripple:kt}},un=["id","aria-label","aria-disabled","data-p-focused","data-p-disabled","data-p"],cn=["data-p"],pn=["href","target"],hn=["data-p"],fn=["data-p"];function mn(t,e,n,l,s,i){var h=Re("ripple");return i.visible()?(d(),u("li",b({key:0,id:n.id,class:[t.cx("item"),n.item.class],role:"menuitem",style:n.item.style,"aria-label":i.label(),"aria-disabled":i.disabled(),"data-p-focused":i.isItemFocused(),"data-p-disabled":i.disabled()||!1,"data-p":i.dataP},i.getPTOptions("item")),[p("div",b({class:t.cx("itemContent"),onClick:e[0]||(e[0]=function(c){return i.onItemClick(c)}),onMousemove:e[1]||(e[1]=function(c){return i.onItemMouseMove(c)}),"data-p":i.dataP},i.getPTOptions("itemContent")),[n.templates.item?n.templates.item?(d(),E(Le(n.templates.item),{key:1,item:n.item,label:i.label(),props:i.getMenuItemProps(n.item)},null,8,["item","label","props"])):O("",!0):Ke((d(),u("a",b({key:0,href:n.item.url,class:t.cx("itemLink"),target:n.item.target,tabindex:"-1"},i.getPTOptions("itemLink")),[n.templates.itemicon?(d(),E(Le(n.templates.itemicon),{key:0,item:n.item,class:W(t.cx("itemIcon"))},null,8,["item","class"])):n.item.icon?(d(),u("span",b({key:1,class:[t.cx("itemIcon"),n.item.icon],"data-p":i.dataP},i.getPTOptions("itemIcon")),null,16,hn)):O("",!0),p("span",b({class:t.cx("itemLabel"),"data-p":i.dataP},i.getPTOptions("itemLabel")),H(i.label()),17,fn)],16,pn)),[[h]])],16,cn)],16,un)):O("",!0)}Mt.render=mn;function ht(t){return yn(t)||gn(t)||vn(t)||bn()}function bn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function vn(t,e){if(t){if(typeof t=="string")return Xe(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Xe(t,e):void 0}}function gn(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function yn(t){if(Array.isArray(t))return Xe(t)}function Xe(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var kn={name:"Menu",extends:dn,inheritAttrs:!1,emits:["show","hide","focus","blur"],data:function(){return{overlayVisible:!1,focused:!1,focusedOptionIndex:-1,selectedOptionIndex:-1}},target:null,outsideClickListener:null,scrollHandler:null,resizeListener:null,container:null,list:null,mounted:function(){this.popup||(this.bindResizeListener(),this.bindOutsideClickListener())},beforeUnmount:function(){this.unbindResizeListener(),this.unbindOutsideClickListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.target=null,this.container&&this.autoZIndex&&se.clear(this.container),this.container=null},methods:{itemClick:function(e){var n=e.item;this.disabled(n)||(n.command&&n.command(e),this.overlayVisible&&this.hide(),!this.popup&&this.focusedOptionIndex!==e.id&&(this.focusedOptionIndex=e.id))},itemMouseMove:function(e){this.focused&&(this.focusedOptionIndex=e.id)},onListFocus:function(e){this.focused=!0,!this.popup&&this.changeFocusedOptionIndex(0),this.$emit("focus",e)},onListBlur:function(e){this.focused=!1,this.focusedOptionIndex=-1,this.$emit("blur",e)},onListKeyDown:function(e){switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Space":this.onSpaceKey(e);break;case"Escape":this.popup&&(le(this.target),this.hide());case"Tab":this.overlayVisible&&this.hide();break}},onArrowDownKey:function(e){var n=this.findNextOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()},onArrowUpKey:function(e){if(e.altKey&&this.popup)le(this.target),this.hide(),e.preventDefault();else{var n=this.findPrevOptionIndex(this.focusedOptionIndex);this.changeFocusedOptionIndex(n),e.preventDefault()}},onHomeKey:function(e){this.changeFocusedOptionIndex(0),e.preventDefault()},onEndKey:function(e){this.changeFocusedOptionIndex(Be(this.container,'li[data-pc-section="item"][data-p-disabled="false"]').length-1),e.preventDefault()},onEnterKey:function(e){var n=Ae(this.list,'li[id="'.concat("".concat(this.focusedOptionIndex),'"]')),l=n&&Ae(n,'a[data-pc-section="itemlink"]');this.popup&&le(this.target),l?l.click():n&&n.click(),e.preventDefault()},onSpaceKey:function(e){this.onEnterKey(e)},findNextOptionIndex:function(e){var n=Be(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=ht(n).findIndex(function(s){return s.id===e});return l>-1?l+1:0},findPrevOptionIndex:function(e){var n=Be(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=ht(n).findIndex(function(s){return s.id===e});return l>-1?l-1:0},changeFocusedOptionIndex:function(e){var n=Be(this.container,'li[data-pc-section="item"][data-p-disabled="false"]'),l=e>=n.length?n.length-1:e<0?0:e;l>-1&&(this.focusedOptionIndex=n[l].getAttribute("id"))},toggle:function(e,n){this.overlayVisible?this.hide():this.show(e,n)},show:function(e,n){this.overlayVisible=!0,this.target=n??e.currentTarget},hide:function(){this.overlayVisible=!1,this.target=null},onEnter:function(e){wt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.bindOutsideClickListener(),this.bindResizeListener(),this.bindScrollListener(),this.autoZIndex&&se.set("menu",e,this.baseZIndex||this.$primevue.config.zIndex.menu),this.popup&&le(this.list),this.$emit("show")},onLeave:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindScrollListener(),this.$emit("hide")},onAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){ot(this.container,this.target);var e=Fe(this.target);e>Fe(this.container)&&(this.container.style.minWidth=Fe(this.target)+"px")},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=e.container&&!e.container.contains(n.target),s=!(e.target&&(e.target===n.target||e.target.contains(n.target)));e.overlayVisible&&l&&s?e.hide():!e.popup&&l&&s&&(e.focusedOptionIndex=-1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new lt(this.target,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!it()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},visible:function(e){return typeof e.visible=="function"?e.visible():e.visible!==!1},disabled:function(e){return typeof e.disabled=="function"?e.disabled():e.disabled},label:function(e){return typeof e.label=="function"?e.label():e.label},onOverlayClick:function(e){ut.emit("overlay-click",{originalEvent:e,target:this.target})},containerRef:function(e){this.container=e},listRef:function(e){this.list=e}},computed:{focusedOptionId:function(){return this.focusedOptionIndex!==-1?this.focusedOptionIndex:null},dataP:function(){return re({popup:this.popup})}},components:{PVMenuitem:Mt,Portal:Ue}},wn=["id","data-p"],xn=["id","tabindex","aria-activedescendant","aria-label","aria-labelledby"],In=["id"];function On(t,e,n,l,s,i){var h=q("PVMenuitem"),c=q("Portal");return d(),E(c,{appendTo:t.appendTo,disabled:!t.popup},{default:v(function(){return[r(je,b({name:"p-anchored-overlay",onEnter:i.onEnter,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave},t.ptm("transition")),{default:v(function(){return[!t.popup||s.overlayVisible?(d(),u("div",b({key:0,ref:i.containerRef,id:t.$id,class:t.cx("root"),onClick:e[3]||(e[3]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),"data-p":i.dataP},t.ptmi("root")),[t.$slots.start?(d(),u("div",b({key:0,class:t.cx("start")},t.ptm("start")),[T(t.$slots,"start")],16)):O("",!0),p("ul",b({ref:i.listRef,id:t.$id+"_list",class:t.cx("list"),role:"menu",tabindex:t.tabindex,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,onFocus:e[0]||(e[0]=function(){return i.onListFocus&&i.onListFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onListBlur&&i.onListBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onListKeyDown&&i.onListKeyDown.apply(i,arguments)})},t.ptm("list")),[(d(!0),u(V,null,ae(t.model,function(f,y){return d(),u(V,{key:i.label(f)+y.toString()},[f.items&&i.visible(f)&&!f.separator?(d(),u(V,{key:0},[f.items?(d(),u("li",b({key:0,id:t.$id+"_"+y,class:[t.cx("submenuLabel"),f.class],role:"none"},{ref_for:!0},t.ptm("submenuLabel")),[T(t.$slots,t.$slots.submenulabel?"submenulabel":"submenuheader",{item:f},function(){return[N(H(i.label(f)),1)]})],16,In)):O("",!0),(d(!0),u(V,null,ae(f.items,function(g,x){return d(),u(V,{key:g.label+y+"_"+x},[i.visible(g)&&!g.separator?(d(),E(h,{key:0,id:t.$id+"_"+y+"_"+x,item:g,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"])):i.visible(g)&&g.separator?(d(),u("li",b({key:"separator"+y+x,class:[t.cx("separator"),f.class],style:g.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):O("",!0)],64)}),128))],64)):i.visible(f)&&f.separator?(d(),u("li",b({key:"separator"+y.toString(),class:[t.cx("separator"),f.class],style:f.style,role:"separator"},{ref_for:!0},t.ptm("separator")),null,16)):(d(),E(h,{key:i.label(f)+y.toString(),id:t.$id+"_"+y,item:f,index:y,templates:t.$slots,focusedOptionId:i.focusedOptionId,unstyled:t.unstyled,onItemClick:i.itemClick,onItemMousemove:i.itemMouseMove,pt:t.pt},null,8,["id","item","index","templates","focusedOptionId","unstyled","onItemClick","onItemMousemove","pt"]))],64)}),128))],16,xn),t.$slots.end?(d(),u("div",b({key:1,class:t.cx("end")},t.ptm("end")),[T(t.$slots,"end")],16)):O("",!0)],16,wn)):O("",!0)]}),_:3},16,["onEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo","disabled"])}kn.render=On;var Sn=`
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
`,Ln={root:"p-colorpicker p-component",preview:function(e){var n=e.props;return["p-colorpicker-preview",{"p-disabled":n.disabled}]},panel:function(e){var n=e.instance,l=e.props;return["p-colorpicker-panel",{"p-colorpicker-panel-inline":l.inline,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},colorSelector:"p-colorpicker-color-selector",colorBackground:"p-colorpicker-color-background",colorHandle:"p-colorpicker-color-handle",hue:"p-colorpicker-hue",hueHandle:"p-colorpicker-hue-handle"},Cn=de.extend({name:"colorpicker",style:Sn,classes:Ln}),Vn={name:"BaseColorPicker",extends:xt,props:{defaultColor:{type:null,default:"ff0000"},inline:{type:Boolean,default:!1},format:{type:String,default:"hex"},tabindex:{type:String,default:null},autoZIndex:{type:Boolean,default:!0},baseZIndex:{type:Number,default:0},appendTo:{type:[String,Object],default:"body"},inputId:{type:String,default:null},panelClass:null,overlayClass:null},style:Cn,provide:function(){return{$pcColorPicker:this,$parentInstance:this}}},Se={name:"ColorPicker",extends:Vn,inheritAttrs:!1,emits:["change","show","hide"],data:function(){return{overlayVisible:!1}},hsbValue:null,localHue:null,outsideClickListener:null,documentMouseMoveListener:null,documentMouseUpListener:null,scrollHandler:null,resizeListener:null,hueDragging:null,colorDragging:null,selfUpdate:null,picker:null,colorSelector:null,colorHandle:null,hueView:null,hueHandle:null,watch:{modelValue:{immediate:!0,handler:function(e){this.hsbValue=this.toHSB(e),this.selfUpdate?this.selfUpdate=!1:this.updateUI()}}},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindDragListeners(),this.unbindResizeListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.picker&&this.autoZIndex&&se.clear(this.picker),this.clearRefs()},mounted:function(){this.updateUI()},methods:{pickColor:function(e){var n=this.colorSelector.getBoundingClientRect(),l=n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),s=n.left+document.body.scrollLeft,i=Math.floor(100*Math.max(0,Math.min(150,(e.pageX||e.changedTouches[0].pageX)-s))/150),h=Math.floor(100*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-l)))/150);this.hsbValue=this.validateHSB({h:this.localHue,s:i,b:h}),this.selfUpdate=!0,this.updateColorHandle(),this.updateInput(),this.updateModel(e)},pickHue:function(e){var n=this.hueView.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);this.localHue=Math.floor(360*(150-Math.max(0,Math.min(150,(e.pageY||e.changedTouches[0].pageY)-n)))/150),this.hsbValue=this.validateHSB({h:this.localHue,s:this.hsbValue.s,b:this.hsbValue.b}),this.selfUpdate=!0,this.updateColorSelector(),this.updateHue(),this.updateModel(e),this.updateInput()},updateModel:function(e){var n=this.d_value;switch(this.format){case"hex":n=this.HSBtoHEX(this.hsbValue);break;case"rgb":n=this.HSBtoRGB(this.hsbValue);break;case"hsb":n=this.hsbValue;break}this.writeValue(n,e),this.$emit("change",{event:e,value:n})},updateColorSelector:function(){if(this.colorSelector){var e=this.validateHSB({h:this.hsbValue.h,s:100,b:100});this.colorSelector.style.backgroundColor="#"+this.HSBtoHEX(e)}},updateColorHandle:function(){this.colorHandle&&(this.colorHandle.style.left=Math.floor(150*this.hsbValue.s/100)+"px",this.colorHandle.style.top=Math.floor(150*(100-this.hsbValue.b)/100)+"px")},updateHue:function(){this.hueHandle&&(this.hueHandle.style.top=Math.floor(150-150*this.hsbValue.h/360)+"px")},updateInput:function(){this.$refs.input&&(this.$refs.input.style.backgroundColor="#"+this.HSBtoHEX(this.hsbValue))},updateUI:function(){this.updateHue(),this.updateColorHandle(),this.updateInput(),this.updateColorSelector()},validateHSB:function(e){return{h:Math.min(360,Math.max(0,e.h)),s:Math.min(100,Math.max(0,e.s)),b:Math.min(100,Math.max(0,e.b))}},validateRGB:function(e){return{r:Math.min(255,Math.max(0,e.r)),g:Math.min(255,Math.max(0,e.g)),b:Math.min(255,Math.max(0,e.b))}},validateHEX:function(e){var n=6-e.length;if(n>0){for(var l=[],s=0;s<n;s++)l.push("0");l.push(e),e=l.join("")}return e},HEXtoRGB:function(e){var n=parseInt(e.indexOf("#")>-1?e.substring(1):e,16);return{r:n>>16,g:(n&65280)>>8,b:n&255}},HEXtoHSB:function(e){return this.RGBtoHSB(this.HEXtoRGB(e))},RGBtoHSB:function(e){var n={h:0,s:0,b:0},l=Math.min(e.r,e.g,e.b),s=Math.max(e.r,e.g,e.b),i=s-l;return n.b=s,n.s=s!==0?255*i/s:0,n.s!==0?e.r===s?n.h=(e.g-e.b)/i:e.g===s?n.h=2+(e.b-e.r)/i:n.h=4+(e.r-e.g)/i:n.h=-1,n.h*=60,n.h<0&&(n.h+=360),n.s*=100/255,n.b*=100/255,n},HSBtoRGB:function(e){var n={r:null,g:null,b:null},l=Math.round(e.h),s=Math.round(e.s*255/100),i=Math.round(e.b*255/100);if(s===0)n={r:i,g:i,b:i};else{var h=i,c=(255-s)*i/255,f=(h-c)*(l%60)/60;l===360&&(l=0),l<60?(n.r=h,n.b=c,n.g=c+f):l<120?(n.g=h,n.b=c,n.r=h-f):l<180?(n.g=h,n.r=c,n.b=c+f):l<240?(n.b=h,n.r=c,n.g=h-f):l<300?(n.b=h,n.g=c,n.r=c+f):l<360?(n.r=h,n.g=c,n.b=h-f):(n.r=0,n.g=0,n.b=0)}return{r:Math.round(n.r),g:Math.round(n.g),b:Math.round(n.b)}},RGBtoHEX:function(e){var n=[e.r.toString(16),e.g.toString(16),e.b.toString(16)];for(var l in n)n[l].length===1&&(n[l]="0"+n[l]);return n.join("")},HSBtoHEX:function(e){return this.RGBtoHEX(this.HSBtoRGB(e))},toHSB:function(e){var n;if(e)switch(this.format){case"hex":n=this.HEXtoHSB(e);break;case"rgb":n=this.RGBtoHSB(e);break;case"hsb":n=e;break}else n=this.HEXtoHSB(this.defaultColor);return n.s===0||n.b===0?n.h=this.localHue:this.localHue=n.h,n},onOverlayEnter:function(e){this.updateUI(),this.alignOverlay(),this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.autoZIndex&&se.set("overlay",e,this.baseZIndex||this.$primevue.config.zIndex.overlay),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),this.$emit("show")},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.clearRefs(),this.$emit("hide")},onOverlayAfterLeave:function(e){this.autoZIndex&&se.clear(e)},alignOverlay:function(){this.appendTo==="self"?It(this.picker,this.$refs.input):ot(this.picker,this.$refs.input)},onInputClick:function(){this.disabled||(this.overlayVisible=!this.overlayVisible)},onInputKeydown:function(e){switch(e.code){case"Space":this.overlayVisible=!this.overlayVisible,e.preventDefault();break;case"Escape":case"Tab":this.overlayVisible=!1;break}},onInputBlur:function(e){var n,l;(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l)},onColorMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onColorDragStart(e))},onColorDragStart:function(e){this.disabled||(this.colorDragging=!0,this.pickColor(e),this.$el.setAttribute("p-colorpicker-dragging","true"),!this.isUnstyled&&We(this.$el,"p-colorpicker-dragging"),e.preventDefault())},onDrag:function(e){this.colorDragging&&(this.pickColor(e),e.preventDefault()),this.hueDragging&&(this.pickHue(e),e.preventDefault())},onDragEnd:function(){this.colorDragging=!1,this.hueDragging=!1,this.$el.setAttribute("p-colorpicker-dragging","false"),!this.isUnstyled&&jt(this.$el,"p-colorpicker-dragging"),this.unbindDragListeners()},onHueMousedown:function(e){this.disabled||(this.bindDragListeners(),this.onHueDragStart(e))},onHueDragStart:function(e){this.disabled||(this.hueDragging=!0,this.pickHue(e),!this.isUnstyled&&We(this.$el,"p-colorpicker-dragging"),e.preventDefault())},isInputClicked:function(e){return this.$refs.input&&this.$refs.input.isSameNode(e.target)},bindDragListeners:function(){this.bindDocumentMouseMoveListener(),this.bindDocumentMouseUpListener()},unbindDragListeners:function(){this.unbindDocumentMouseMoveListener(),this.unbindDocumentMouseUpListener()},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.overlayVisible&&e.picker&&!e.picker.contains(n.target)&&!e.isInputClicked(n)&&(e.overlayVisible=!1)},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new lt(this.$refs.container,function(){e.overlayVisible&&(e.overlayVisible=!1)})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!it()&&(e.overlayVisible=!1)},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindDocumentMouseMoveListener:function(){this.documentMouseMoveListener||(this.documentMouseMoveListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.documentMouseMoveListener))},unbindDocumentMouseMoveListener:function(){this.documentMouseMoveListener&&(document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null)},bindDocumentMouseUpListener:function(){this.documentMouseUpListener||(this.documentMouseUpListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.documentMouseUpListener))},unbindDocumentMouseUpListener:function(){this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)},pickerRef:function(e){this.picker=e},colorSelectorRef:function(e){this.colorSelector=e},colorHandleRef:function(e){this.colorHandle=e},hueViewRef:function(e){this.hueView=e},hueHandleRef:function(e){this.hueHandle=e},clearRefs:function(){this.picker=null,this.colorSelector=null,this.colorHandle=null,this.hueView=null,this.hueHandle=null},onOverlayClick:function(e){ut.emit("overlay-click",{originalEvent:e,target:this.$el})}},components:{Portal:Ue}};function Ce(t){"@babel/helpers - typeof";return Ce=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ce(t)}function ft(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function mt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?ft(Object(n),!0).forEach(function(l){zn(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):ft(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function zn(t,e,n){return(e=Mn(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Mn(t){var e=$n(t,"string");return Ce(e)=="symbol"?e:e+""}function $n(t,e){if(Ce(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ce(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Pn=["id","tabindex","disabled"];function Tn(t,e,n,l,s,i){var h=q("Portal");return d(),u("div",b({ref:"container",class:t.cx("root")},t.ptmi("root")),[t.inline?O("",!0):(d(),u("input",b({key:0,ref:"input",id:t.inputId,type:"text",class:t.cx("preview"),readonly:"",tabindex:t.tabindex,disabled:t.disabled,onClick:e[0]||(e[0]=function(){return i.onInputClick&&i.onInputClick.apply(i,arguments)}),onKeydown:e[1]||(e[1]=function(){return i.onInputKeydown&&i.onInputKeydown.apply(i,arguments)}),onBlur:e[2]||(e[2]=function(){return i.onInputBlur&&i.onInputBlur.apply(i,arguments)})},t.ptm("preview")),null,16,Pn)),r(h,{appendTo:t.appendTo,disabled:t.inline},{default:v(function(){return[r(je,b({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[t.inline||s.overlayVisible?(d(),u("div",b({key:0,ref:i.pickerRef,class:[t.cx("panel"),t.panelClass,t.overlayClass],onClick:e[11]||(e[11]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)})},mt(mt({},t.ptm("panel")),t.ptm("overlay"))),[p("div",b({class:t.cx("content")},t.ptm("content")),[p("div",b({ref:i.colorSelectorRef,class:t.cx("colorSelector"),onMousedown:e[3]||(e[3]=function(c){return i.onColorMousedown(c)}),onTouchstart:e[4]||(e[4]=function(c){return i.onColorDragStart(c)}),onTouchmove:e[5]||(e[5]=function(c){return i.onDrag(c)}),onTouchend:e[6]||(e[6]=function(c){return i.onDragEnd()})},t.ptm("colorSelector")),[p("div",b({class:t.cx("colorBackground")},t.ptm("colorBackground")),[p("div",b({ref:i.colorHandleRef,class:t.cx("colorHandle")},t.ptm("colorHandle")),null,16)],16)],16),p("div",b({ref:i.hueViewRef,class:t.cx("hue"),onMousedown:e[7]||(e[7]=function(c){return i.onHueMousedown(c)}),onTouchstart:e[8]||(e[8]=function(c){return i.onHueDragStart(c)}),onTouchmove:e[9]||(e[9]=function(c){return i.onDrag(c)}),onTouchend:e[10]||(e[10]=function(c){return i.onDragEnd()})},t.ptm("hue")),[p("div",b({ref:i.hueHandleRef,class:t.cx("hueHandle")},t.ptm("hueHandle")),null,16)],16)],16)],16)):O("",!0)]}),_:1},16,["onEnter","onLeave","onAfterLeave"])]}),_:1},8,["appendTo","disabled"])],16)}Se.render=Tn;var $t={name:"BlankIcon",extends:Ge};function Bn(t){return En(t)||An(t)||Fn(t)||Hn()}function Hn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Fn(t,e){if(t){if(typeof t=="string")return Ye(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Ye(t,e):void 0}}function An(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function En(t){if(Array.isArray(t))return Ye(t)}function Ye(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Dn(t,e,n,l,s,i){return d(),u("svg",b({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Bn(e[0]||(e[0]=[p("rect",{width:"1",height:"1",fill:"currentColor","fill-opacity":"0"},null,-1)])),16)}$t.render=Dn;var Pt={name:"ChevronDownIcon",extends:Ge};function Un(t){return Gn(t)||jn(t)||Kn(t)||Rn()}function Rn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Kn(t,e){if(t){if(typeof t=="string")return Je(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Je(t,e):void 0}}function jn(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Gn(t){if(Array.isArray(t))return Je(t)}function Je(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function _n(t,e,n,l,s,i){return d(),u("svg",b({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Un(e[0]||(e[0]=[p("path",{d:"M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z",fill:"currentColor"},null,-1)])),16)}Pt.render=_n;var Tt={name:"SearchIcon",extends:Ge};function Nn(t){return Xn(t)||Zn(t)||Wn(t)||qn()}function qn(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Wn(t,e){if(t){if(typeof t=="string")return Qe(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Qe(t,e):void 0}}function Zn(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function Xn(t){if(Array.isArray(t))return Qe(t)}function Qe(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function Yn(t,e,n,l,s,i){return d(),u("svg",b({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),Nn(e[0]||(e[0]=[p("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z",fill:"currentColor"},null,-1)])),16)}Tt.render=Yn;var Jn=`
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
`,Qn={root:"p-iconfield"},ei=de.extend({name:"iconfield",style:Jn,classes:Qn}),ti={name:"BaseIconField",extends:ge,style:ei,provide:function(){return{$pcIconField:this,$parentInstance:this}}},Bt={name:"IconField",extends:ti,inheritAttrs:!1};function ni(t,e,n,l,s,i){return d(),u("div",b({class:t.cx("root")},t.ptmi("root")),[T(t.$slots,"default")],16)}Bt.render=ni;var ii={root:"p-inputicon"},li=de.extend({name:"inputicon",classes:ii}),oi={name:"BaseInputIcon",extends:ge,style:li,props:{class:null},provide:function(){return{$pcInputIcon:this,$parentInstance:this}}},Ht={name:"InputIcon",extends:oi,inheritAttrs:!1,computed:{containerClass:function(){return[this.cx("root"),this.class]}}};function ai(t,e,n,l,s,i){return d(),u("span",b({class:i.containerClass},t.ptmi("root"),{"aria-hidden":"true"}),[T(t.$slots,"default")],16)}Ht.render=ai;var si=`
    .p-virtualscroller-loader {
        background: dt('virtualscroller.loader.mask.background');
        color: dt('virtualscroller.loader.mask.color');
    }

    .p-virtualscroller-loading-icon {
        font-size: dt('virtualscroller.loader.icon.size');
        width: dt('virtualscroller.loader.icon.size');
        height: dt('virtualscroller.loader.icon.size');
    }
`,ri=`
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
`,bt=de.extend({name:"virtualscroller",css:ri,style:si}),di={name:"BaseVirtualScroller",extends:ge,props:{id:{type:String,default:null},style:null,class:null,items:{type:Array,default:null},itemSize:{type:[Number,Array],default:0},scrollHeight:null,scrollWidth:null,orientation:{type:String,default:"vertical"},numToleratedItems:{type:Number,default:null},delay:{type:Number,default:0},resizeDelay:{type:Number,default:10},lazy:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1},loaderDisabled:{type:Boolean,default:!1},columns:{type:Array,default:null},loading:{type:Boolean,default:!1},showSpacer:{type:Boolean,default:!0},showLoader:{type:Boolean,default:!1},tabindex:{type:Number,default:0},inline:{type:Boolean,default:!1},step:{type:Number,default:0},appendOnly:{type:Boolean,default:!1},autoSize:{type:Boolean,default:!1}},style:bt,provide:function(){return{$pcVirtualScroller:this,$parentInstance:this}},beforeMount:function(){var e;bt.loadCSS({nonce:(e=this.$primevueConfig)===null||e===void 0||(e=e.csp)===null||e===void 0?void 0:e.nonce})}};function Ve(t){"@babel/helpers - typeof";return Ve=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ve(t)}function vt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function Oe(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?vt(Object(n),!0).forEach(function(l){Ft(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):vt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function Ft(t,e,n){return(e=ui(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ui(t){var e=ci(t,"string");return Ve(e)=="symbol"?e:e+""}function ci(t,e){if(Ve(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Ve(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var At={name:"VirtualScroller",extends:di,inheritAttrs:!1,emits:["update:numToleratedItems","scroll","scroll-index-change","lazy-load"],data:function(){var e=this.isBoth();return{first:e?{rows:0,cols:0}:0,last:e?{rows:0,cols:0}:0,page:e?{rows:0,cols:0}:0,numItemsInViewport:e?{rows:0,cols:0}:0,lastScrollPos:e?{top:0,left:0}:0,d_numToleratedItems:this.numToleratedItems,d_loading:this.loading,loaderArr:[],spacerStyle:{},contentStyle:{}}},element:null,content:null,lastScrollPos:null,scrollTimeout:null,resizeTimeout:null,defaultWidth:0,defaultHeight:0,defaultContentWidth:0,defaultContentHeight:0,isRangeChanged:!1,lazyLoadState:{},resizeListener:null,resizeObserver:null,initialized:!1,watch:{numToleratedItems:function(e){this.d_numToleratedItems=e},loading:function(e,n){this.lazy&&e!==n&&e!==this.d_loading&&(this.d_loading=e)},items:{handler:function(e,n){(!n||n.length!==(e||[]).length)&&(this.init(),this.calculateAutoSize())},deep:!0},itemSize:function(){this.init(),this.calculateAutoSize()},orientation:function(){this.lastScrollPos=this.isBoth()?{top:0,left:0}:0},scrollHeight:function(){this.init(),this.calculateAutoSize()},scrollWidth:function(){this.init(),this.calculateAutoSize()}},mounted:function(){this.viewInit(),this.lastScrollPos=this.isBoth()?{top:0,left:0}:0,this.lazyLoadState=this.lazyLoadState||{}},updated:function(){!this.initialized&&this.viewInit()},unmounted:function(){this.unbindResizeListener(),this.initialized=!1},methods:{viewInit:function(){Ee(this.element)&&(this.setContentEl(this.content),this.init(),this.calculateAutoSize(),this.defaultWidth=xe(this.element),this.defaultHeight=Ie(this.element),this.defaultContentWidth=xe(this.content),this.defaultContentHeight=Ie(this.content),this.initialized=!0),this.element&&this.bindResizeListener()},init:function(){this.disabled||(this.setSize(),this.calculateOptions(),this.setSpacerSize())},isVertical:function(){return this.orientation==="vertical"},isHorizontal:function(){return this.orientation==="horizontal"},isBoth:function(){return this.orientation==="both"},scrollTo:function(e){this.element&&this.element.scrollTo(e)},scrollToIndex:function(e){var n=this,l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:"auto",s=this.isBoth(),i=this.isHorizontal(),h=s?e.every(function($){return $>-1}):e>-1;if(h){var c=this.first,f=this.element,y=f.scrollTop,g=y===void 0?0:y,x=f.scrollLeft,z=x===void 0?0:x,j=this.calculateNumItems(),A=j.numToleratedItems,F=this.getContentPosition(),L=this.itemSize,D=function(){var B=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,oe=arguments.length>1?arguments[1]:void 0;return B<=oe?0:B},C=function(B,oe,Y){return B*oe+Y},G=function(){var B=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,oe=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.scrollTo({left:B,top:oe,behavior:l})},M=s?{rows:0,cols:0}:0,Z=!1,R=!1;s?(M={rows:D(e[0],A[0]),cols:D(e[1],A[1])},G(C(M.cols,L[1],F.left),C(M.rows,L[0],F.top)),R=this.lastScrollPos.top!==g||this.lastScrollPos.left!==z,Z=M.rows!==c.rows||M.cols!==c.cols):(M=D(e,A),i?G(C(M,L,F.left),g):G(z,C(M,L,F.top)),R=this.lastScrollPos!==(i?z:g),Z=M!==c),this.isRangeChanged=Z,R&&(this.first=M)}},scrollInView:function(e,n){var l=this,s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"auto";if(n){var i=this.isBoth(),h=this.isHorizontal(),c=i?e.every(function(L){return L>-1}):e>-1;if(c){var f=this.getRenderedRange(),y=f.first,g=f.viewport,x=function(){var D=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,C=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return l.scrollTo({left:D,top:C,behavior:s})},z=n==="to-start",j=n==="to-end";if(z){if(i)g.first.rows-y.rows>e[0]?x(g.first.cols*this.itemSize[1],(g.first.rows-1)*this.itemSize[0]):g.first.cols-y.cols>e[1]&&x((g.first.cols-1)*this.itemSize[1],g.first.rows*this.itemSize[0]);else if(g.first-y>e){var A=(g.first-1)*this.itemSize;h?x(A,0):x(0,A)}}else if(j){if(i)g.last.rows-y.rows<=e[0]+1?x(g.first.cols*this.itemSize[1],(g.first.rows+1)*this.itemSize[0]):g.last.cols-y.cols<=e[1]+1&&x((g.first.cols+1)*this.itemSize[1],g.first.rows*this.itemSize[0]);else if(g.last-y<=e+1){var F=(g.first+1)*this.itemSize;h?x(F,0):x(0,F)}}}}else this.scrollToIndex(e,s)},getRenderedRange:function(){var e=function(x,z){return Math.floor(x/(z||x))},n=this.first,l=0;if(this.element){var s=this.isBoth(),i=this.isHorizontal(),h=this.element,c=h.scrollTop,f=h.scrollLeft;if(s)n={rows:e(c,this.itemSize[0]),cols:e(f,this.itemSize[1])},l={rows:n.rows+this.numItemsInViewport.rows,cols:n.cols+this.numItemsInViewport.cols};else{var y=i?f:c;n=e(y,this.itemSize),l=n+this.numItemsInViewport}}return{first:this.first,last:this.last,viewport:{first:n,last:l}}},calculateNumItems:function(){var e=this.isBoth(),n=this.isHorizontal(),l=this.itemSize,s=this.getContentPosition(),i=this.element?this.element.offsetWidth-s.left:0,h=this.element?this.element.offsetHeight-s.top:0,c=function(z,j){return Math.ceil(z/(j||z))},f=function(z){return Math.ceil(z/2)},y=e?{rows:c(h,l[0]),cols:c(i,l[1])}:c(n?i:h,l),g=this.d_numToleratedItems||(e?[f(y.rows),f(y.cols)]:f(y));return{numItemsInViewport:y,numToleratedItems:g}},calculateOptions:function(){var e=this,n=this.isBoth(),l=this.first,s=this.calculateNumItems(),i=s.numItemsInViewport,h=s.numToleratedItems,c=function(g,x,z){var j=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;return e.getLast(g+x+(g<z?2:3)*z,j)},f=n?{rows:c(l.rows,i.rows,h[0]),cols:c(l.cols,i.cols,h[1],!0)}:c(l,i,h);this.last=f,this.numItemsInViewport=i,this.d_numToleratedItems=h,this.$emit("update:numToleratedItems",this.d_numToleratedItems),this.showLoader&&(this.loaderArr=n?Array.from({length:i.rows}).map(function(){return Array.from({length:i.cols})}):Array.from({length:i})),this.lazy&&Promise.resolve().then(function(){var y;e.lazyLoadState={first:e.step?n?{rows:0,cols:l.cols}:0:l,last:Math.min(e.step?e.step:f,((y=e.items)===null||y===void 0?void 0:y.length)||0)},e.$emit("lazy-load",e.lazyLoadState)})},calculateAutoSize:function(){var e=this;this.autoSize&&!this.d_loading&&Promise.resolve().then(function(){if(e.content){var n=e.isBoth(),l=e.isHorizontal(),s=e.isVertical();e.content.style.minHeight=e.content.style.minWidth="auto",e.content.style.position="relative",e.element.style.contain="none";var i=[xe(e.element),Ie(e.element)],h=i[0],c=i[1];(n||l)&&(e.element.style.width=h<e.defaultWidth?h+"px":e.scrollWidth||e.defaultWidth+"px"),(n||s)&&(e.element.style.height=c<e.defaultHeight?c+"px":e.scrollHeight||e.defaultHeight+"px"),e.content.style.minHeight=e.content.style.minWidth="",e.content.style.position="",e.element.style.contain=""}})},getLast:function(){var e,n,l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,s=arguments.length>1?arguments[1]:void 0;return this.items?Math.min(s?((e=this.columns||this.items[0])===null||e===void 0?void 0:e.length)||0:((n=this.items)===null||n===void 0?void 0:n.length)||0,l):0},getContentPosition:function(){if(this.content){var e=getComputedStyle(this.content),n=parseFloat(e.paddingLeft)+Math.max(parseFloat(e.left)||0,0),l=parseFloat(e.paddingRight)+Math.max(parseFloat(e.right)||0,0),s=parseFloat(e.paddingTop)+Math.max(parseFloat(e.top)||0,0),i=parseFloat(e.paddingBottom)+Math.max(parseFloat(e.bottom)||0,0);return{left:n,right:l,top:s,bottom:i,x:n+l,y:s+i}}return{left:0,right:0,top:0,bottom:0,x:0,y:0}},setSize:function(){var e=this;if(this.element){var n=this.isBoth(),l=this.isHorizontal(),s=this.element.parentElement,i=this.scrollWidth||"".concat(this.element.offsetWidth||s.offsetWidth,"px"),h=this.scrollHeight||"".concat(this.element.offsetHeight||s.offsetHeight,"px"),c=function(y,g){return e.element.style[y]=g};n||l?(c("height",h),c("width",i)):c("height",h)}},setSpacerSize:function(){var e=this,n=this.items;if(n){var l=this.isBoth(),s=this.isHorizontal(),i=this.getContentPosition(),h=function(f,y,g){var x=arguments.length>3&&arguments[3]!==void 0?arguments[3]:0;return e.spacerStyle=Oe(Oe({},e.spacerStyle),Ft({},"".concat(f),(y||[]).length*g+x+"px"))};l?(h("height",n,this.itemSize[0],i.y),h("width",this.columns||n[1],this.itemSize[1],i.x)):s?h("width",this.columns||n,this.itemSize,i.x):h("height",n,this.itemSize,i.y)}},setContentPosition:function(e){var n=this;if(this.content&&!this.appendOnly){var l=this.isBoth(),s=this.isHorizontal(),i=e?e.first:this.first,h=function(g,x){return g*x},c=function(){var g=arguments.length>0&&arguments[0]!==void 0?arguments[0]:0,x=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0;return n.contentStyle=Oe(Oe({},n.contentStyle),{transform:"translate3d(".concat(g,"px, ").concat(x,"px, 0)")})};if(l)c(h(i.cols,this.itemSize[1]),h(i.rows,this.itemSize[0]));else{var f=h(i,this.itemSize);s?c(f,0):c(0,f)}}},onScrollPositionChange:function(e){var n=this,l=e.target,s=this.isBoth(),i=this.isHorizontal(),h=this.getContentPosition(),c=function(U,P){return U?U>P?U-P:U:0},f=function(U,P){return Math.floor(U/(P||U))},y=function(U,P,S,I,X,ue){return U<=X?X:ue?S-I-X:P+X-1},g=function(U,P,S,I,X,ue,me,ye){if(U<=ue)return 0;var ke=Math.max(0,me?U<P?S:U-ue:U>P?S:U-2*ue),we=n.getLast(ke,ye);return ke>we?we-X:ke},x=function(U,P,S,I,X,ue){var me=P+I+2*X;return U>=X&&(me+=X+1),n.getLast(me,ue)},z=c(l.scrollTop,h.top),j=c(l.scrollLeft,h.left),A=s?{rows:0,cols:0}:0,F=this.last,L=!1,D=this.lastScrollPos;if(s){var C=this.lastScrollPos.top<=z,G=this.lastScrollPos.left<=j;if(!this.appendOnly||this.appendOnly&&(C||G)){var M={rows:f(z,this.itemSize[0]),cols:f(j,this.itemSize[1])},Z={rows:y(M.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],C),cols:y(M.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],G)};A={rows:g(M.rows,Z.rows,this.first.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0],C),cols:g(M.cols,Z.cols,this.first.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],G,!0)},F={rows:x(M.rows,A.rows,this.last.rows,this.numItemsInViewport.rows,this.d_numToleratedItems[0]),cols:x(M.cols,A.cols,this.last.cols,this.numItemsInViewport.cols,this.d_numToleratedItems[1],!0)},L=A.rows!==this.first.rows||F.rows!==this.last.rows||A.cols!==this.first.cols||F.cols!==this.last.cols||this.isRangeChanged,D={top:z,left:j}}}else{var R=i?j:z,$=this.lastScrollPos<=R;if(!this.appendOnly||this.appendOnly&&$){var B=f(R,this.itemSize),oe=y(B,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,$);A=g(B,oe,this.first,this.last,this.numItemsInViewport,this.d_numToleratedItems,$),F=x(B,A,this.last,this.numItemsInViewport,this.d_numToleratedItems),L=A!==this.first||F!==this.last||this.isRangeChanged,D=R}}return{first:A,last:F,isRangeChanged:L,scrollPos:D}},onScrollChange:function(e){var n=this.onScrollPositionChange(e),l=n.first,s=n.last,i=n.isRangeChanged,h=n.scrollPos;if(i){var c={first:l,last:s};if(this.setContentPosition(c),this.first=l,this.last=s,this.lastScrollPos=h,this.$emit("scroll-index-change",c),this.lazy&&this.isPageChanged(l)){var f,y,g={first:this.step?Math.min(this.getPageByFirst(l)*this.step,(((f=this.items)===null||f===void 0?void 0:f.length)||0)-this.step):l,last:Math.min(this.step?(this.getPageByFirst(l)+1)*this.step:s,((y=this.items)===null||y===void 0?void 0:y.length)||0)},x=this.lazyLoadState.first!==g.first||this.lazyLoadState.last!==g.last;x&&this.$emit("lazy-load",g),this.lazyLoadState=g}}},onScroll:function(e){var n=this;if(this.$emit("scroll",e),this.delay){if(this.scrollTimeout&&clearTimeout(this.scrollTimeout),this.isPageChanged()){if(!this.d_loading&&this.showLoader){var l=this.onScrollPositionChange(e),s=l.isRangeChanged,i=s||(this.step?this.isPageChanged():!1);i&&(this.d_loading=!0)}this.scrollTimeout=setTimeout(function(){n.onScrollChange(e),n.d_loading&&n.showLoader&&(!n.lazy||n.loading===void 0)&&(n.d_loading=!1,n.page=n.getPageByFirst())},this.delay)}}else this.onScrollChange(e)},onResize:function(){var e=this;this.resizeTimeout&&clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){if(Ee(e.element)){var n=e.isBoth(),l=e.isVertical(),s=e.isHorizontal(),i=[xe(e.element),Ie(e.element)],h=i[0],c=i[1],f=h!==e.defaultWidth,y=c!==e.defaultHeight,g=n?f||y:s?f:l?y:!1;g&&(e.d_numToleratedItems=e.numToleratedItems,e.defaultWidth=h,e.defaultHeight=c,e.defaultContentWidth=xe(e.content),e.defaultContentHeight=Ie(e.content),e.init())}},this.resizeDelay)},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=this.onResize.bind(this),window.addEventListener("resize",this.resizeListener),window.addEventListener("orientationchange",this.resizeListener),this.resizeObserver=new ResizeObserver(function(){e.onResize()}),this.resizeObserver.observe(this.element))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),window.removeEventListener("orientationchange",this.resizeListener),this.resizeListener=null),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null)},getOptions:function(e){var n=(this.items||[]).length,l=this.isBoth()?this.first.rows+e:this.first+e;return{index:l,count:n,first:l===0,last:l===n-1,even:l%2===0,odd:l%2!==0}},getLoaderOptions:function(e,n){var l=this.loaderArr.length;return Oe({index:e,count:l,first:e===0,last:e===l-1,even:e%2===0,odd:e%2!==0},n)},getPageByFirst:function(e){return Math.floor(((e??this.first)+this.d_numToleratedItems*4)/(this.step||1))},isPageChanged:function(e){return this.step&&!this.lazy?this.page!==this.getPageByFirst(e??this.first):!0},setContentEl:function(e){this.content=e||this.content||Ae(this.element,'[data-pc-section="content"]')},elementRef:function(e){this.element=e},contentRef:function(e){this.content=e}},computed:{containerClass:function(){return["p-virtualscroller",this.class,{"p-virtualscroller-inline":this.inline,"p-virtualscroller-both p-both-scroll":this.isBoth(),"p-virtualscroller-horizontal p-horizontal-scroll":this.isHorizontal()}]},contentClass:function(){return["p-virtualscroller-content",{"p-virtualscroller-loading":this.d_loading}]},loaderClass:function(){return["p-virtualscroller-loader",{"p-virtualscroller-loader-mask":!this.$slots.loader}]},loadedItems:function(){var e=this;return this.items&&!this.d_loading?this.isBoth()?this.items.slice(this.appendOnly?0:this.first.rows,this.last.rows).map(function(n){return e.columns?n:n.slice(e.appendOnly?0:e.first.cols,e.last.cols)}):this.isHorizontal()&&this.columns?this.items:this.items.slice(this.appendOnly?0:this.first,this.last):[]},loadedRows:function(){return this.d_loading?this.loaderDisabled?this.loaderArr:[]:this.loadedItems},loadedColumns:function(){if(this.columns){var e=this.isBoth(),n=this.isHorizontal();if(e||n)return this.d_loading&&this.loaderDisabled?e?this.loaderArr[0]:this.loaderArr:this.columns.slice(e?this.first.cols:this.first,e?this.last.cols:this.last)}return this.columns}},components:{SpinnerIcon:Ot}},pi=["tabindex"];function hi(t,e,n,l,s,i){var h=q("SpinnerIcon");return t.disabled?(d(),u(V,{key:1},[T(t.$slots,"default"),T(t.$slots,"content",{items:t.items,rows:t.items,columns:i.loadedColumns})],64)):(d(),u("div",b({key:0,ref:i.elementRef,class:i.containerClass,tabindex:t.tabindex,style:t.style,onScroll:e[0]||(e[0]=function(){return i.onScroll&&i.onScroll.apply(i,arguments)})},t.ptmi("root")),[T(t.$slots,"content",{styleClass:i.contentClass,items:i.loadedItems,getItemOptions:i.getOptions,loading:s.d_loading,getLoaderOptions:i.getLoaderOptions,itemSize:t.itemSize,rows:i.loadedRows,columns:i.loadedColumns,contentRef:i.contentRef,spacerStyle:s.spacerStyle,contentStyle:s.contentStyle,vertical:i.isVertical(),horizontal:i.isHorizontal(),both:i.isBoth()},function(){return[p("div",b({ref:i.contentRef,class:i.contentClass,style:s.contentStyle},t.ptm("content")),[(d(!0),u(V,null,ae(i.loadedItems,function(c,f){return T(t.$slots,"item",{key:f,item:c,options:i.getOptions(f)})}),128))],16)]}),t.showSpacer?(d(),u("div",b({key:0,class:"p-virtualscroller-spacer",style:s.spacerStyle},t.ptm("spacer")),null,16)):O("",!0),!t.loaderDisabled&&t.showLoader&&s.d_loading?(d(),u("div",b({key:1,class:i.loaderClass},t.ptm("loader")),[t.$slots&&t.$slots.loader?(d(!0),u(V,{key:0},ae(s.loaderArr,function(c,f){return T(t.$slots,"loader",{key:f,options:i.getLoaderOptions(f,i.isBoth()&&{numCols:t.d_numItemsInViewport.cols})})}),128)):O("",!0),T(t.$slots,"loadingicon",{},function(){return[r(h,b({spin:"",class:"p-virtualscroller-loading-icon"},t.ptm("loadingIcon")),null,16)]})],16)):O("",!0)],16,pi))}At.render=hi;var fi=`
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
`,mi={root:function(e){var n=e.instance,l=e.props,s=e.state;return["p-select p-component p-inputwrapper",{"p-disabled":l.disabled,"p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-focus":s.focused,"p-inputwrapper-filled":n.$filled,"p-inputwrapper-focus":s.focused||s.overlayVisible,"p-select-open":s.overlayVisible,"p-select-fluid":n.$fluid,"p-select-sm p-inputfield-sm":l.size==="small","p-select-lg p-inputfield-lg":l.size==="large"}]},label:function(e){var n,l=e.instance,s=e.props;return["p-select-label",{"p-placeholder":!s.editable&&l.label===s.placeholder,"p-select-label-empty":!s.editable&&!l.$slots.value&&(l.label==="p-emptylabel"||((n=l.label)===null||n===void 0?void 0:n.length)===0)}]},clearIcon:"p-select-clear-icon",dropdown:"p-select-dropdown",loadingicon:"p-select-loading-icon",dropdownIcon:"p-select-dropdown-icon",overlay:"p-select-overlay p-component",header:"p-select-header",pcFilter:"p-select-filter",listContainer:"p-select-list-container",list:"p-select-list",optionGroup:"p-select-option-group",optionGroupLabel:"p-select-option-group-label",option:function(e){var n=e.instance,l=e.props,s=e.state,i=e.option,h=e.focusedOption;return["p-select-option",{"p-select-option-selected":n.isSelected(i)&&l.highlightOnSelect,"p-focus":s.focusedOptionIndex===h,"p-disabled":n.isOptionDisabled(i)}]},optionLabel:"p-select-option-label",optionCheckIcon:"p-select-option-check-icon",optionBlankIcon:"p-select-option-blank-icon",emptyMessage:"p-select-empty-message"},bi=de.extend({name:"select",style:fi,classes:mi}),vi={name:"BaseSelect",extends:at,props:{options:Array,optionLabel:[String,Function],optionValue:[String,Function],optionDisabled:[String,Function],optionGroupLabel:[String,Function],optionGroupChildren:[String,Function],scrollHeight:{type:String,default:"14rem"},filter:Boolean,filterPlaceholder:String,filterLocale:String,filterMatchMode:{type:String,default:"contains"},filterFields:{type:Array,default:null},editable:Boolean,placeholder:{type:String,default:null},dataKey:null,showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},labelId:{type:String,default:null},labelClass:{type:[String,Object],default:null},labelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},appendTo:{type:[String,Object],default:"body"},loading:{type:Boolean,default:!1},clearIcon:{type:String,default:void 0},dropdownIcon:{type:String,default:void 0},filterIcon:{type:String,default:void 0},loadingIcon:{type:String,default:void 0},resetFilterOnHide:{type:Boolean,default:!1},resetFilterOnClear:{type:Boolean,default:!1},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},autoFilterFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},highlightOnSelect:{type:Boolean,default:!0},checkmark:{type:Boolean,default:!1},filterMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptyFilterMessage:{type:String,default:null},emptyMessage:{type:String,default:null},tabindex:{type:Number,default:0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:bi,provide:function(){return{$pcSelect:this,$parentInstance:this}}};function ze(t){"@babel/helpers - typeof";return ze=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},ze(t)}function gi(t){return xi(t)||wi(t)||ki(t)||yi()}function yi(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ki(t,e){if(t){if(typeof t=="string")return et(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?et(t,e):void 0}}function wi(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function xi(t){if(Array.isArray(t))return et(t)}function et(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function gt(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);e&&(l=l.filter(function(s){return Object.getOwnPropertyDescriptor(t,s).enumerable})),n.push.apply(n,l)}return n}function yt(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?gt(Object(n),!0).forEach(function(l){pe(t,l,n[l])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):gt(Object(n)).forEach(function(l){Object.defineProperty(t,l,Object.getOwnPropertyDescriptor(n,l))})}return t}function pe(t,e,n){return(e=Ii(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ii(t){var e=Oi(t,"string");return ze(e)=="symbol"?e:e+""}function Oi(t,e){if(ze(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(ze(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var ee={name:"Select",extends:vi,inheritAttrs:!1,emits:["change","focus","blur","before-show","before-hide","show","hide","filter"],outsideClickListener:null,scrollHandler:null,resizeListener:null,labelClickListener:null,matchMediaOrientationListener:null,overlay:null,list:null,virtualScroller:null,searchTimeout:null,searchValue:null,isModelValueChanged:!1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,filterValue:null,overlayVisible:!1,queryOrientation:null}},watch:{modelValue:function(){this.isModelValueChanged=!0},options:function(){this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel(),this.bindLabelClickListener(),this.bindMatchMediaOrientationListener()},updated:function(){this.overlayVisible&&this.isModelValueChanged&&this.scrollInView(this.findSelectedOptionIndex()),this.isModelValueChanged=!1},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.unbindLabelClickListener(),this.unbindMatchMediaOrientationListener(),this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.overlay&&(se.clear(this.overlay),this.overlay=null)},methods:{getOptionIndex:function(e,n){return this.virtualScrollerDisabled?e:n&&n(e).index},getOptionLabel:function(e){return this.optionLabel?be(e,this.optionLabel):e},getOptionValue:function(e){return this.optionValue?be(e,this.optionValue):e},getOptionRenderKey:function(e,n){return(this.dataKey?be(e,this.dataKey):this.getOptionLabel(e))+"_"+n},getPTItemOptions:function(e,n,l,s){return this.ptm(s,{context:{option:e,index:l,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(l,n),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?be(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return be(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return be(e,this.optionGroupChildren)},getAriaPosInset:function(e){var n=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(l){return n.isOptionGroup(l)}).length:e)+1},show:function(e){this.$emit("before-show"),this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),e&&le(this.$refs.focusInput)},hide:function(e){var n=this,l=function(){n.$emit("before-hide"),n.overlayVisible=!1,n.clicked=!1,n.focusedOptionIndex=-1,n.searchValue="",n.resetFilterOnHide&&(n.filterValue=null),e&&le(n.$refs.focusInput)};setTimeout(function(){l()},0)},onFocus:function(e){this.disabled||(this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex!==-1?this.focusedOptionIndex:this.autoOptionFocus?this.findFirstFocusedOptionIndex():this.editable?-1:this.findSelectedOptionIndex(),this.scrollInView(this.focusedOptionIndex)),this.$emit("focus",e))},onBlur:function(e){var n=this;setTimeout(function(){var l,s;n.focused=!1,n.focusedOptionIndex=-1,n.searchValue="",n.$emit("blur",e),(l=(s=n.formField).onBlur)===null||l===void 0||l.call(s,e)},100)},onKeyDown:function(e){var n=this;if(this.disabled){e.preventDefault();return}if(Wt())switch(e.code){case"Backspace":this.onBackspaceKey(e,this.editable);break;case"Enter":case"NumpadDecimal":this.onEnterKey(e);break;default:e.preventDefault();return}var l=e.metaKey||e.ctrlKey;switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,this.editable);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,this.editable);break;case"Home":this.onHomeKey(e,this.editable);break;case"End":this.onEndKey(e,this.editable);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Space":this.onSpaceKey(e,this.editable);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break;case"Backspace":this.onBackspaceKey(e,this.editable);break;case"ShiftLeft":case"ShiftRight":break;default:!l&&Zt(e.key)&&(!this.overlayVisible&&this.show(),!this.editable&&this.searchOptions(e,e.key),this.filter&&this.$nextTick(function(){n.$refs.filterInput&&le(n.$refs.filterInput.$el)}));break}this.clicked=!1},onEditableInput:function(e){var n=e.target.value;this.searchValue="";var l=this.searchOptions(e,n);!l&&(this.focusedOptionIndex=-1),this.updateModel(e,n),!this.overlayVisible&&He(n)&&this.show()},onContainerClick:function(e){this.disabled||this.loading||e.target.tagName==="INPUT"||e.target.getAttribute("data-pc-section")==="clearicon"||e.target.closest('[data-pc-section="clearicon"]')||((!this.overlay||!this.overlay.contains(e.target))&&(this.overlayVisible?this.hide(!0):this.show(!0)),this.clicked=!0)},onClearClick:function(e){this.updateModel(e,null),this.resetFilterOnClear&&(this.filterValue=null)},onFirstHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?qt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;le(n)},onLastHiddenFocus:function(e){var n=e.relatedTarget===this.$refs.focusInput?Nt(this.overlay,':not([data-p-hidden-focusable="true"])'):this.$refs.focusInput;le(n)},onOptionSelect:function(e,n){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0;if(this.overlayVisible){var s=this.getOptionValue(n);this.updateModel(e,s),l&&this.hide(!0)}},onOptionMouseMove:function(e,n){this.focusOnHover&&this.changeFocusedOptionIndex(e,n)},onFilterChange:function(e){var n=e.target.value;this.filterValue=n,this.focusedOptionIndex=-1,this.$emit("filter",{originalEvent:e,value:n}),!this.virtualScrollerDisabled&&this.virtualScroller.scrollToIndex(0)},onFilterKeyDown:function(e){if(!e.isComposing)switch(e.code){case"ArrowDown":this.onArrowDownKey(e);break;case"ArrowUp":this.onArrowUpKey(e,!0);break;case"ArrowLeft":case"ArrowRight":this.onArrowLeftKey(e,!0);break;case"Home":this.onHomeKey(e,!0);break;case"End":this.onEndKey(e,!0);break;case"Enter":case"NumpadEnter":this.onEnterKey(e);break;case"Escape":this.onEscapeKey(e);break;case"Tab":this.onTabKey(e);break}},onFilterBlur:function(){this.focusedOptionIndex=-1},onFilterUpdated:function(){this.overlayVisible&&this.alignOverlay()},onOverlayClick:function(e){ut.emit("overlay-click",{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){e.code==="Escape"&&this.onEscapeKey(e)},onArrowDownKey:function(e){if(!this.overlayVisible)this.show(),this.editable&&this.changeFocusedOptionIndex(e,this.findSelectedOptionIndex());else{var n=this.focusedOptionIndex!==-1?this.findNextOptionIndex(this.focusedOptionIndex):this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex();this.changeFocusedOptionIndex(e,n)}e.preventDefault()},onArrowUpKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(e.altKey&&!n)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var l=this.focusedOptionIndex!==-1?this.findPrevOptionIndex(this.focusedOptionIndex):this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex();this.changeFocusedOptionIndex(e,l),!this.overlayVisible&&this.show(),e.preventDefault()}},onArrowLeftKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&(this.focusedOptionIndex=-1)},onHomeKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;e.shiftKey?l.setSelectionRange(0,e.target.selectionStart):(l.setSelectionRange(0,0),this.focusedOptionIndex=-1)}else this.changeFocusedOptionIndex(e,this.findFirstOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onEndKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(n){var l=e.currentTarget;if(e.shiftKey)l.setSelectionRange(e.target.selectionStart,l.value.length);else{var s=l.value.length;l.setSelectionRange(s,s),this.focusedOptionIndex=-1}}else this.changeFocusedOptionIndex(e,this.findLastOptionIndex()),!this.overlayVisible&&this.show();e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.overlayVisible?(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.hide(!0)):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)),e.preventDefault()},onSpaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;!n&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault(),e.stopPropagation()},onTabKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n||(this.overlayVisible&&this.hasFocusableElements()?(le(this.$refs.firstHiddenFocusableElementOnOverlay),e.preventDefault()):(this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(this.filter)))},onBackspaceKey:function(e){var n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;n&&!this.overlayVisible&&this.show()},onOverlayEnter:function(e){var n=this;se.set("overlay",e,this.$primevue.config.zIndex.overlay),wt(e,{position:"absolute",top:"0"}),this.alignOverlay(),this.scrollInView(),this.$attrSelector&&e.setAttribute(this.$attrSelector,""),setTimeout(function(){n.autoFilterFocus&&n.filter&&le(n.$refs.filterInput.$el),n.autoUpdateModel()},1)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit("show")},onOverlayLeave:function(e){var n=this;e.style.pointerEvents="none",this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.autoFilterFocus&&this.filter&&!this.editable&&this.$nextTick(function(){n.$refs.filterInput&&le(n.$refs.filterInput.$el)}),this.$emit("hide"),this.overlay=null},onOverlayAfterLeave:function(e){se.clear(e)},alignOverlay:function(){this.appendTo==="self"?It(this.overlay,this.$el):this.overlay&&(this.overlay.style.minWidth=Fe(this.$el)+"px",ot(this.overlay,this.$el))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){var l=n.composedPath();e.overlayVisible&&e.overlay&&!l.includes(e.$el)&&!l.includes(e.overlay)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},bindScrollListener:function(){var e=this;this.scrollHandler||(this.scrollHandler=new lt(this.$refs.container,function(){e.overlayVisible&&e.hide()})),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!it()&&e.hide()},window.addEventListener("resize",this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&(window.removeEventListener("resize",this.resizeListener),this.resizeListener=null)},bindLabelClickListener:function(){var e=this;if(!this.editable&&!this.labelClickListener){var n=document.querySelector('label[for="'.concat(this.labelId,'"]'));n&&Ee(n)&&(this.labelClickListener=function(){le(e.$refs.focusInput)},n.addEventListener("click",this.labelClickListener))}},unbindLabelClickListener:function(){if(this.labelClickListener){var e=document.querySelector('label[for="'.concat(this.labelId,'"]'));e&&Ee(e)&&e.removeEventListener("click",this.labelClickListener)}},bindMatchMediaOrientationListener:function(){var e=this;if(!this.matchMediaOrientationListener){var n=matchMedia("(orientation: portrait)");this.queryOrientation=n,this.matchMediaOrientationListener=function(){e.alignOverlay()},this.queryOrientation.addEventListener("change",this.matchMediaOrientationListener)}},unbindMatchMediaOrientationListener:function(){this.matchMediaOrientationListener&&(this.queryOrientation.removeEventListener("change",this.matchMediaOrientationListener),this.queryOrientation=null,this.matchMediaOrientationListener=null)},hasFocusableElements:function(){return _t(this.overlay,':not([data-p-hidden-focusable="true"])').length>0},isOptionExactMatched:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale))==this.searchValue.toLocaleLowerCase(this.filterLocale)},isOptionStartsWith:function(e){var n;return this.isValidOption(e)&&typeof this.getOptionLabel(e)=="string"&&((n=this.getOptionLabel(e))===null||n===void 0?void 0:n.toLocaleLowerCase(this.filterLocale).startsWith(this.searchValue.toLocaleLowerCase(this.filterLocale)))},isValidOption:function(e){return He(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isSelected:function(e){return Ct(this.d_value,this.getOptionValue(e),this.equalityKey)},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidOption(n)})},findLastOptionIndex:function(){var e=this;return pt(this.visibleOptions,function(n){return e.isValidOption(n)})},findNextOptionIndex:function(e){var n=this,l=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(s){return n.isValidOption(s)}):-1;return l>-1?l+e+1:e},findPrevOptionIndex:function(e){var n=this,l=e>0?pt(this.visibleOptions.slice(0,e),function(s){return n.isValidOption(s)}):-1;return l>-1?l:e},findSelectedOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(n){return e.isValidSelectedOption(n)})},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},searchOptions:function(e,n){var l=this;this.searchValue=(this.searchValue||"")+n;var s=-1,i=!1;return He(this.searchValue)&&(s=this.visibleOptions.findIndex(function(h){return l.isOptionExactMatched(h)}),s===-1&&(s=this.visibleOptions.findIndex(function(h){return l.isOptionStartsWith(h)})),s!==-1&&(i=!0),s===-1&&this.focusedOptionIndex===-1&&(s=this.findFirstFocusedOptionIndex()),s!==-1&&this.changeFocusedOptionIndex(e,s)),this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(function(){l.searchValue="",l.searchTimeout=null},500),i},changeFocusedOptionIndex:function(e,n){this.focusedOptionIndex!==n&&(this.focusedOptionIndex=n,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[n],!1))},scrollInView:function(){var e=this,n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var l=n!==-1?"".concat(e.$id,"_").concat(n):e.focusedOptionId,s=Ae(e.list,'li[id="'.concat(l,'"]'));s?s.scrollIntoView&&s.scrollIntoView({block:"nearest",inline:"nearest"}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(n!==-1?n:e.focusedOptionIndex)})},autoUpdateModel:function(){this.autoOptionFocus&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex()),this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1)},updateModel:function(e,n){this.writeValue(n,e),this.$emit("change",{originalEvent:e,value:n})},flatOptions:function(e){var n=this;return(e||[]).reduce(function(l,s,i){l.push({optionGroup:s,group:!0,index:i});var h=n.getOptionGroupChildren(s);return h&&h.forEach(function(c){return l.push(c)}),l},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,n){this.list=e,n&&n(e)},virtualScrollerRef:function(e){this.virtualScroller=e}},computed:{visibleOptions:function(){var e=this,n=this.optionGroupLabel?this.flatOptions(this.options):this.options||[];if(this.filterValue){var l=Gt.filter(n,this.searchFields,this.filterValue,this.filterMatchMode,this.filterLocale);if(this.optionGroupLabel){var s=this.options||[],i=[];return s.forEach(function(h){var c=e.getOptionGroupChildren(h),f=c.filter(function(y){return l.includes(y)});f.length>0&&i.push(yt(yt({},h),{},pe({},typeof e.optionGroupChildren=="string"?e.optionGroupChildren:"items",gi(f))))}),this.flatOptions(i)}return l}return n},hasSelectedOption:function(){return this.$filled},label:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.placeholder||"p-emptylabel"},editableInputValue:function(){var e=this.findSelectedOptionIndex();return e!==-1?this.getOptionLabel(this.visibleOptions[e]):this.d_value||""},equalityKey:function(){return this.optionValue?null:this.dataKey},searchFields:function(){return this.filterFields||[this.optionLabel]},filterResultMessageText:function(){return He(this.visibleOptions)?this.filterMessageText.replaceAll("{0}",this.visibleOptions.length):this.emptyFilterMessageText},filterMessageText:function(){return this.filterMessage||this.$primevue.config.locale.searchMessage||""},emptyFilterMessageText:function(){return this.emptyFilterMessage||this.$primevue.config.locale.emptySearchMessage||this.$primevue.config.locale.emptyFilterMessage||""},emptyMessageText:function(){return this.emptyMessage||this.$primevue.config.locale.emptyMessage||""},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||""},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||""},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll("{0}","1"):this.emptySelectionMessageText},focusedOptionId:function(){return this.focusedOptionIndex!==-1?"".concat(this.$id,"_").concat(this.focusedOptionIndex):null},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(n){return!e.isOptionGroup(n)}).length},isClearIconVisible:function(){return this.showClear&&this.d_value!=null&&!this.disabled&&!this.loading},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},containerDataP:function(){return re(pe({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))},labelDataP:function(){return re(pe(pe({placeholder:!this.editable&&this.label===this.placeholder,clearable:this.showClear,disabled:this.disabled,editable:this.editable},this.size,this.size),"empty",!this.editable&&!this.$slots.value&&(this.label==="p-emptylabel"||this.label.length===0)))},dropdownIconDataP:function(){return re(pe({},this.size,this.size))},overlayDataP:function(){return re(pe({},"portal-"+this.appendTo,"portal-"+this.appendTo))}},directives:{ripple:kt},components:{InputText:Ze,VirtualScroller:At,Portal:Ue,InputIcon:Ht,IconField:Bt,TimesIcon:Lt,ChevronDownIcon:Pt,SpinnerIcon:Ot,SearchIcon:Tt,CheckIcon:St,BlankIcon:$t}},Si=["id","data-p"],Li=["name","id","value","placeholder","tabindex","disabled","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","data-p"],Ci=["name","id","tabindex","aria-label","aria-labelledby","aria-expanded","aria-controls","aria-activedescendant","aria-invalid","aria-disabled","data-p"],Vi=["data-p"],zi=["id"],Mi=["id"],$i=["id","aria-label","aria-selected","aria-disabled","aria-setsize","aria-posinset","onMousedown","onMousemove","data-p-selected","data-p-focused","data-p-disabled"];function Pi(t,e,n,l,s,i){var h=q("SpinnerIcon"),c=q("InputText"),f=q("SearchIcon"),y=q("InputIcon"),g=q("IconField"),x=q("CheckIcon"),z=q("BlankIcon"),j=q("VirtualScroller"),A=q("Portal"),F=Re("ripple");return d(),u("div",b({ref:"container",id:t.$id,class:t.cx("root"),onClick:e[12]||(e[12]=function(){return i.onContainerClick&&i.onContainerClick.apply(i,arguments)}),"data-p":i.containerDataP},t.ptmi("root")),[t.editable?(d(),u("input",b({key:0,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,type:"text",class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],value:i.editableInputValue,placeholder:t.placeholder,tabindex:t.disabled?-1:t.tabindex,disabled:t.disabled,autocomplete:"off",role:"combobox","aria-label":t.ariaLabel,"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":s.overlayVisible?t.$id+"_list":void 0,"aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[2]||(e[2]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),onInput:e[3]||(e[3]=function(){return i.onEditableInput&&i.onEditableInput.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),null,16,Li)):(d(),u("span",b({key:1,ref:"focusInput",name:t.name,id:t.labelId||t.inputId,class:[t.cx("label"),t.inputClass,t.labelClass],style:[t.inputStyle,t.labelStyle],tabindex:t.disabled?-1:t.tabindex,role:"combobox","aria-label":t.ariaLabel||(i.label==="p-emptylabel"?void 0:i.label),"aria-labelledby":t.ariaLabelledby,"aria-haspopup":"listbox","aria-expanded":s.overlayVisible,"aria-controls":t.$id+"_list","aria-activedescendant":s.focused?i.focusedOptionId:void 0,"aria-invalid":t.invalid||void 0,"aria-disabled":t.disabled,onFocus:e[4]||(e[4]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[5]||(e[5]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onKeydown:e[6]||(e[6]=function(){return i.onKeyDown&&i.onKeyDown.apply(i,arguments)}),"data-p":i.labelDataP},t.ptm("label")),[T(t.$slots,"value",{value:t.d_value,placeholder:t.placeholder},function(){var L;return[N(H(i.label==="p-emptylabel"?" ":(L=i.label)!==null&&L!==void 0?L:"empty"),1)]})],16,Ci)),i.isClearIconVisible?T(t.$slots,"clearicon",{key:2,class:W(t.cx("clearIcon")),clearCallback:i.onClearClick},function(){return[(d(),E(Le(t.clearIcon?"i":"TimesIcon"),b({ref:"clearIcon",class:[t.cx("clearIcon"),t.clearIcon],onClick:i.onClearClick},t.ptm("clearIcon"),{"data-pc-section":"clearicon"}),null,16,["class","onClick"]))]}):O("",!0),p("div",b({class:t.cx("dropdown")},t.ptm("dropdown")),[t.loading?T(t.$slots,"loadingicon",{key:0,class:W(t.cx("loadingIcon"))},function(){return[t.loadingIcon?(d(),u("span",b({key:0,class:[t.cx("loadingIcon"),"pi-spin",t.loadingIcon],"aria-hidden":"true"},t.ptm("loadingIcon")),null,16)):(d(),E(h,b({key:1,class:t.cx("loadingIcon"),spin:"","aria-hidden":"true"},t.ptm("loadingIcon")),null,16,["class"]))]}):T(t.$slots,"dropdownicon",{key:1,class:W(t.cx("dropdownIcon"))},function(){return[(d(),E(Le(t.dropdownIcon?"span":"ChevronDownIcon"),b({class:[t.cx("dropdownIcon"),t.dropdownIcon],"aria-hidden":"true","data-p":i.dropdownIconDataP},t.ptm("dropdownIcon")),null,16,["class","data-p"]))]})],16),r(A,{appendTo:t.appendTo},{default:v(function(){return[r(je,b({name:"p-anchored-overlay",onEnter:i.onOverlayEnter,onAfterEnter:i.onOverlayAfterEnter,onLeave:i.onOverlayLeave,onAfterLeave:i.onOverlayAfterLeave},t.ptm("transition")),{default:v(function(){return[s.overlayVisible?(d(),u("div",b({key:0,ref:i.overlayRef,class:[t.cx("overlay"),t.panelClass,t.overlayClass],style:[t.panelStyle,t.overlayStyle],onClick:e[10]||(e[10]=function(){return i.onOverlayClick&&i.onOverlayClick.apply(i,arguments)}),onKeydown:e[11]||(e[11]=function(){return i.onOverlayKeyDown&&i.onOverlayKeyDown.apply(i,arguments)}),"data-p":i.overlayDataP},t.ptm("overlay")),[p("span",b({ref:"firstHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[7]||(e[7]=function(){return i.onFirstHiddenFocus&&i.onFirstHiddenFocus.apply(i,arguments)})},t.ptm("hiddenFirstFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16),T(t.$slots,"header",{value:t.d_value,options:i.visibleOptions}),t.filter?(d(),u("div",b({key:0,class:t.cx("header")},t.ptm("header")),[r(g,{unstyled:t.unstyled,pt:t.ptm("pcFilterContainer")},{default:v(function(){return[r(c,{ref:"filterInput",type:"text",value:s.filterValue,onVnodeMounted:i.onFilterUpdated,onVnodeUpdated:i.onFilterUpdated,class:W(t.cx("pcFilter")),placeholder:t.filterPlaceholder,variant:t.variant,unstyled:t.unstyled,role:"searchbox",autocomplete:"off","aria-owns":t.$id+"_list","aria-activedescendant":i.focusedOptionId,onKeydown:i.onFilterKeyDown,onBlur:i.onFilterBlur,onInput:i.onFilterChange,pt:t.ptm("pcFilter"),formControl:{novalidate:!0}},null,8,["value","onVnodeMounted","onVnodeUpdated","class","placeholder","variant","unstyled","aria-owns","aria-activedescendant","onKeydown","onBlur","onInput","pt"]),r(y,{unstyled:t.unstyled,pt:t.ptm("pcFilterIconContainer")},{default:v(function(){return[T(t.$slots,"filtericon",{},function(){return[t.filterIcon?(d(),u("span",b({key:0,class:t.filterIcon},t.ptm("filterIcon")),null,16)):(d(),E(f,Xt(b({key:1},t.ptm("filterIcon"))),null,16))]})]}),_:3},8,["unstyled","pt"])]}),_:3},8,["unstyled","pt"]),p("span",b({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenFilterResult"),{"data-p-hidden-accessible":!0}),H(i.filterResultMessageText),17)],16)):O("",!0),p("div",b({class:t.cx("listContainer"),style:{"max-height":i.virtualScrollerDisabled?t.scrollHeight:""}},t.ptm("listContainer")),[r(j,b({ref:i.virtualScrollerRef},t.virtualScrollerOptions,{items:i.visibleOptions,style:{height:t.scrollHeight},tabindex:-1,disabled:i.virtualScrollerDisabled,pt:t.ptm("virtualScroller")}),Yt({content:v(function(L){var D=L.styleClass,C=L.contentRef,G=L.items,M=L.getItemOptions,Z=L.contentStyle,R=L.itemSize;return[p("ul",b({ref:function(B){return i.listRef(B,C)},id:t.$id+"_list",class:[t.cx("list"),D],style:Z,role:"listbox"},t.ptm("list")),[(d(!0),u(V,null,ae(G,function($,B){return d(),u(V,{key:i.getOptionRenderKey($,i.getOptionIndex(B,M))},[i.isOptionGroup($)?(d(),u("li",b({key:0,id:t.$id+"_"+i.getOptionIndex(B,M),style:{height:R?R+"px":void 0},class:t.cx("optionGroup"),role:"option"},{ref_for:!0},t.ptm("optionGroup")),[T(t.$slots,"optiongroup",{option:$.optionGroup,index:i.getOptionIndex(B,M)},function(){return[p("span",b({class:t.cx("optionGroupLabel")},{ref_for:!0},t.ptm("optionGroupLabel")),H(i.getOptionGroupLabel($.optionGroup)),17)]})],16,Mi)):Ke((d(),u("li",b({key:1,id:t.$id+"_"+i.getOptionIndex(B,M),class:t.cx("option",{option:$,focusedOption:i.getOptionIndex(B,M)}),style:{height:R?R+"px":void 0},role:"option","aria-label":i.getOptionLabel($),"aria-selected":i.isSelected($),"aria-disabled":i.isOptionDisabled($),"aria-setsize":i.ariaSetSize,"aria-posinset":i.getAriaPosInset(i.getOptionIndex(B,M)),onMousedown:function(Y){return i.onOptionSelect(Y,$)},onMousemove:function(Y){return i.onOptionMouseMove(Y,i.getOptionIndex(B,M))},onClick:e[8]||(e[8]=Vt(function(){},["stop"])),"data-p-selected":!t.checkmark&&i.isSelected($),"data-p-focused":s.focusedOptionIndex===i.getOptionIndex(B,M),"data-p-disabled":i.isOptionDisabled($)},{ref_for:!0},i.getPTItemOptions($,M,B,"option")),[t.checkmark?(d(),u(V,{key:0},[i.isSelected($)?(d(),E(x,b({key:0,class:t.cx("optionCheckIcon")},{ref_for:!0},t.ptm("optionCheckIcon")),null,16,["class"])):(d(),E(z,b({key:1,class:t.cx("optionBlankIcon")},{ref_for:!0},t.ptm("optionBlankIcon")),null,16,["class"]))],64)):O("",!0),T(t.$slots,"option",{option:$,selected:i.isSelected($),index:i.getOptionIndex(B,M)},function(){return[p("span",b({class:t.cx("optionLabel")},{ref_for:!0},t.ptm("optionLabel")),H(i.getOptionLabel($)),17)]})],16,$i)),[[F]])],64)}),128)),s.filterValue&&(!G||G&&G.length===0)?(d(),u("li",b({key:0,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[T(t.$slots,"emptyfilter",{},function(){return[N(H(i.emptyFilterMessageText),1)]})],16)):!t.options||t.options&&t.options.length===0?(d(),u("li",b({key:1,class:t.cx("emptyMessage"),role:"option"},t.ptm("emptyMessage"),{"data-p-hidden-accessible":!0}),[T(t.$slots,"empty",{},function(){return[N(H(i.emptyMessageText),1)]})],16)):O("",!0)],16,zi)]}),_:2},[t.$slots.loader?{name:"loader",fn:v(function(L){var D=L.options;return[T(t.$slots,"loader",{options:D})]}),key:"0"}:void 0]),1040,["items","style","disabled","pt"])],16),T(t.$slots,"footer",{value:t.d_value,options:i.visibleOptions}),!t.options||t.options&&t.options.length===0?(d(),u("span",b({key:1,role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenEmptyMessage"),{"data-p-hidden-accessible":!0}),H(i.emptyMessageText),17)):O("",!0),p("span",b({role:"status","aria-live":"polite",class:"p-hidden-accessible"},t.ptm("hiddenSelectedMessage"),{"data-p-hidden-accessible":!0}),H(i.selectedMessageText),17),p("span",b({ref:"lastHiddenFocusableElementOnOverlay",role:"presentation","aria-hidden":"true",class:"p-hidden-accessible p-hidden-focusable",tabindex:0,onFocus:e[9]||(e[9]=function(){return i.onLastHiddenFocus&&i.onLastHiddenFocus.apply(i,arguments)})},t.ptm("hiddenLastFocusableEl"),{"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0}),null,16)],16,Vi)):O("",!0)]}),_:3},16,["onEnter","onAfterEnter","onLeave","onAfterLeave"])]}),_:3},8,["appendTo"])],16,Si)}ee.render=Pi;var Ti=`
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
`,Bi={root:function(e){var n=e.instance,l=e.props;return["p-textarea p-component",{"p-filled":n.$filled,"p-textarea-resizable ":l.autoResize,"p-textarea-sm p-inputfield-sm":l.size==="small","p-textarea-lg p-inputfield-lg":l.size==="large","p-invalid":n.$invalid,"p-variant-filled":n.$variant==="filled","p-textarea-fluid":n.$fluid}]}},Hi=de.extend({name:"textarea",style:Ti,classes:Bi}),Fi={name:"BaseTextarea",extends:at,props:{autoResize:Boolean},style:Hi,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function Me(t){"@babel/helpers - typeof";return Me=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Me(t)}function Ai(t,e,n){return(e=Ei(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ei(t){var e=Di(t,"string");return Me(e)=="symbol"?e:e+""}function Di(t,e){if(Me(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Me(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var he={name:"Textarea",extends:Fi,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,n=parseInt(e)||0,l=this.$el.scrollHeight,s=!n||l>n,i=n&&l<n;i?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):s&&(this.$el.style.height="".concat(l,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return b(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return re(Ai({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},Ui=["value","name","disabled","aria-invalid","data-p"];function Ri(t,e,n,l,s,i){return d(),u("textarea",b({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":i.dataP,onInput:e[0]||(e[0]=function(){return i.onInput&&i.onInput.apply(i,arguments)})},i.attrs),null,16,Ui)}he.render=Ri;var Ki=`
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
`,ji={root:{position:"relative"}},Gi={root:function(e){var n=e.instance,l=e.props;return["p-toggleswitch p-component",{"p-toggleswitch-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$invalid}]},input:"p-toggleswitch-input",slider:"p-toggleswitch-slider",handle:"p-toggleswitch-handle"},_i=de.extend({name:"toggleswitch",style:Ki,classes:Gi,inlineStyles:ji}),Ni={name:"BaseToggleSwitch",extends:xt,props:{trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:_i,provide:function(){return{$pcToggleSwitch:this,$parentInstance:this}}},ne={name:"ToggleSwitch",extends:Ni,inheritAttrs:!1,emits:["change","focus","blur"],methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,disabled:this.disabled}})},onChange:function(e){if(!this.disabled&&!this.readonly){var n=this.checked?this.falseValue:this.trueValue;this.writeValue(n,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)}},computed:{checked:function(){return this.d_value===this.trueValue},dataP:function(){return re({checked:this.checked,disabled:this.disabled,invalid:this.$invalid})}}},qi=["data-p-checked","data-p-disabled","data-p"],Wi=["id","checked","tabindex","disabled","readonly","aria-checked","aria-labelledby","aria-label","aria-invalid"],Zi=["data-p"],Xi=["data-p"];function Yi(t,e,n,l,s,i){return d(),u("div",b({class:t.cx("root"),style:t.sx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-disabled":t.disabled,"data-p":i.dataP}),[p("input",b({id:t.inputId,type:"checkbox",role:"switch",class:[t.cx("input"),t.inputClass],style:t.inputStyle,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,"aria-checked":i.checked,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,Wi),p("div",b({class:t.cx("slider")},i.getPTOptions("slider"),{"data-p":i.dataP}),[p("div",b({class:t.cx("handle")},i.getPTOptions("handle"),{"data-p":i.dataP}),[T(t.$slots,"handle",{checked:i.checked})],16,Xi)],16,Zi)],16,qi)}ne.render=Yi;const Ji={class:"pt-1.5"},Qi={class:"flex items-baseline gap-2 text-ink"},el={key:0,class:"tnum text-[13px] text-tally"},tl={key:0,class:"mt-0.5 text-[13px] leading-snug text-ink-3"},nl={class:"min-w-0"},il={key:0,class:"mt-1 text-[13px] text-ink-3"},k=st({__name:"FormField",props:{label:{},hint:{},value:{},stacked:{type:Boolean}},setup(t){return(e,n)=>(d(),u("div",{class:W(t.stacked?"flex flex-col gap-2":"grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1")},[p("div",Ji,[p("div",Qi,[N(H(t.label)+" ",1),t.value!==void 0&&t.value!==null?(d(),u("span",el,H(t.value),1)):O("",!0)]),t.hint&&!t.stacked?(d(),u("div",tl,H(t.hint),1)):O("",!0)]),p("div",nl,[T(e.$slots,"default"),t.hint&&t.stacked?(d(),u("div",il,H(t.hint),1)):O("",!0)])],2))}}),ll={class:"grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]"},ol={class:"flex min-h-0 flex-col border-r border-line-soft"},al={class:"flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3"},sl={class:"min-h-0 flex-1 overflow-y-auto"},rl=["onClick"],dl=["aria-label","onClick"],ul={class:"min-w-0 flex-1"},cl={class:"block truncate font-medium"},pl={class:"block truncate text-[13px] text-ink-3"},hl={key:0,class:"pi pi-check text-tally"},fl={class:"p-4 text-center"},ml={key:1,class:"text-ink-3"},bl={key:2,class:"text-ink-3"},vl={class:"flex min-h-0 flex-col overflow-y-auto p-5"},gl={class:"font-display text-lg"},yl={key:0,class:"mt-1 line-clamp-4 text-[13px] text-ink-3"},kl={class:"mt-5 flex flex-col gap-4"},wl={key:1,class:"m-auto max-w-60 text-center text-ink-3"},xl=st({__name:"VoicePicker",props:De({language:{}},{visible:{type:Boolean,required:!0},visibleModifiers:{}}),emits:De(["created"],["update:visible"]),setup(t,{emit:e}){const n=zt(t,"visible"),l=t,s=e,i=rt(),h=dt(),c=K("elevenlabs"),f=K(""),y=K(null),g=K(l.language??null),x=K([]),z=K(0),j=K(!1),A=K(!1),F=K(null),L=K(null),D=new Audio;D.onended=()=>L.value=null;const C=K({name:"",model_id:"eleven_multilingual_v2",stability:.5,similarity_boost:.75,style:0,speed:1}),G=K(!1),M=[{id:"eleven_multilingual_v2",name:"Multilingual v2 — стабильный, лучший для длинных текстов"},{id:"eleven_v3",name:"v3 — самый выразительный, больше языков"},{id:"eleven_turbo_v2_5",name:"Turbo v2.5 — быстрый и дешевле"},{id:"eleven_flash_v2_5",name:"Flash v2.5 — самый быстрый"}],Z=Q(()=>[{code:null,name:"Любой язык"},...i.meta?.languages??[]]);async function R(P=!0){A.value=!0,P&&(z.value=0);try{const S=new URLSearchParams({source:c.value,search:f.value,language:g.value??"",gender:y.value??"",page:String(z.value)}),I=await ce.get(`/api/lumean/voices?${S}`);x.value=P?I.voices:[...x.value,...I.voices],j.value=I.has_more}catch(S){h.error(S,"Каталог голосов недоступен")}finally{A.value=!1}}function $(){z.value+=1,R(!1)}function B(P){if(P.preview_url){if(L.value===P.voice_id){D.pause(),L.value=null;return}D.src=P.preview_url,D.play(),L.value=P.voice_id}}function oe(P){F.value=P;const S=g.value?` ${g.value.toUpperCase()}`:"";C.value.name=`${P.name}${S}`}async function Y(){if(F.value){G.value=!0;try{const P=await ce.post("/api/lumean/templates",{...C.value,voice_id:F.value.voice_id,language_code:g.value||null});h.ok("Голос добавлен в Lumean",P.name),s("created",P),n.value=!1}catch(P){h.error(P)}finally{G.value=!1}}}let U;return _e([f],()=>{window.clearTimeout(U),U=window.setTimeout(()=>R(),400)}),_e([c,y,g],()=>R()),_e(n,P=>{P&&!x.value.length&&R(),P||D.pause()}),Jt(()=>D.pause()),(P,S)=>(d(),E(m(Qt),{visible:n.value,"onUpdate:visible":S[10]||(S[10]=I=>n.value=I),modal:"",header:"Подбор голоса",style:{width:"min(1100px, 96vw)"},"content-style":{padding:0}},{default:v(()=>[p("div",ll,[p("div",ol,[p("div",al,[r(m(ve),{modelValue:c.value,"onUpdate:modelValue":S[0]||(S[0]=I=>c.value=I),options:[{v:"elevenlabs",l:"ElevenLabs"},{v:"lumean",l:"Lumean"}],"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),r(m(Ze),{modelValue:f.value,"onUpdate:modelValue":S[1]||(S[1]=I=>f.value=I),placeholder:"Поиск: тембр, стиль, имя",size:"small",class:"min-w-48 flex-1"},null,8,["modelValue"]),r(m(ee),{modelValue:g.value,"onUpdate:modelValue":S[2]||(S[2]=I=>g.value=I),options:Z.value,"option-value":"code","option-label":"name",size:"small",class:"w-40"},null,8,["modelValue","options"]),r(m(ee),{modelValue:y.value,"onUpdate:modelValue":S[3]||(S[3]=I=>y.value=I),options:[{v:null,l:"Любой пол"},{v:"male",l:"Мужской"},{v:"female",l:"Женский"}],"option-value":"v","option-label":"l",size:"small",class:"w-36"},null,8,["modelValue"])]),p("div",sl,[(d(!0),u(V,null,ae(x.value,I=>(d(),u("button",{key:I.voice_id,class:W(["flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised",F.value?.voice_id===I.voice_id?"bg-raised":""]),onClick:X=>oe(I)},[p("span",{role:"button","aria-label":L.value===I.voice_id?"Остановить":"Прослушать",class:W(["flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",[L.value===I.voice_id?"border-tally bg-tally text-tally-ink":"border-line text-ink-2 hover:border-ink-3",I.preview_url?"":"opacity-30"]]),onClick:Vt(X=>B(I),["stop"])},[p("i",{class:W([["pi",L.value===I.voice_id?"pi-pause":"pi-play"],"text-xs"])},null,2)],10,dl),p("span",ul,[p("span",cl,H(I.name),1),p("span",pl,H([I.gender==="male"?"мужской":I.gender==="female"?"женский":"",I.age,I.accent,I.use_case,I.language].filter(Boolean).join(", ")||I.description),1)]),F.value?.voice_id===I.voice_id?(d(),u("i",hl)):O("",!0)],10,rl))),128)),p("div",fl,[j.value?(d(),E(m(fe),{key:0,label:"Показать ещё",text:"",severity:"secondary",loading:A.value,onClick:$},null,8,["loading"])):A.value?(d(),u("span",ml,"Загрузка…")):x.value.length?O("",!0):(d(),u("span",bl,"Ничего не найдено. Измените фильтры."))])])]),p("div",vl,[F.value?(d(),u(V,{key:0},[p("div",gl,H(F.value.name),1),F.value.description?(d(),u("p",yl,H(F.value.description),1)):O("",!0),p("div",kl,[r(k,{label:"Название шаблона",stacked:""},{default:v(()=>[r(m(Ze),{modelValue:C.value.name,"onUpdate:modelValue":S[4]||(S[4]=I=>C.value.name=I),class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель",stacked:""},{default:v(()=>[r(m(ee),{modelValue:C.value.model_id,"onUpdate:modelValue":S[5]||(S[5]=I=>C.value.model_id=I),options:M,"option-value":"id","option-label":"name",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стабильность",value:C.value.stability.toFixed(2),hint:"Выше — ровнее, ниже — эмоциональнее",stacked:""},{default:v(()=>[r(m(ie),{modelValue:C.value.stability,"onUpdate:modelValue":S[6]||(S[6]=I=>C.value.stability=I),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Похожесть на оригинал",value:C.value.similarity_boost.toFixed(2),stacked:""},{default:v(()=>[r(m(ie),{modelValue:C.value.similarity_boost,"onUpdate:modelValue":S[7]||(S[7]=I=>C.value.similarity_boost=I),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Выразительность",value:C.value.style.toFixed(2),stacked:""},{default:v(()=>[r(m(ie),{modelValue:C.value.style,"onUpdate:modelValue":S[8]||(S[8]=I=>C.value.style=I),min:0,max:1,step:.05},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Скорость речи",value:C.value.speed.toFixed(2),stacked:""},{default:v(()=>[r(m(ie),{modelValue:C.value.speed,"onUpdate:modelValue":S[9]||(S[9]=I=>C.value.speed=I),min:.7,max:1.2,step:.01},null,8,["modelValue"])]),_:1},8,["value"])]),r(m(fe),{class:"mt-6",label:"Создать голос",loading:G.value,disabled:!C.value.name.trim(),onClick:Y},null,8,["loading","disabled"])],64)):(d(),u("div",wl," Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом. "))])])]),_:1},8,["visible"]))}}),Il={class:"grid grid-cols-[13rem_minmax(0,1fr)] gap-8"},Ol={class:"sticky top-4 flex h-fit flex-col gap-0.5"},Sl=["onClick"],Ll={class:"flex min-w-0 flex-col gap-7 pb-10"},Cl={key:0,class:"rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad"},Vl={class:"flex gap-2"},zl={class:"flex gap-2"},Ml={class:"flex gap-2"},$l={class:"flex items-center gap-4 pt-1.5"},Pl={class:"mt-2 text-[13px] text-ink-3"},Tl={class:"flex items-center gap-3"},Bl={key:0,class:"mt-4 flex items-center gap-3"},Hl={class:"mt-2 text-[13px] leading-snug text-ink-3"},Fl={class:"grid grid-cols-1 gap-2 xl:grid-cols-2"},Al=["onClick"],El={class:"flex items-baseline justify-between gap-2"},Dl={class:"font-medium"},Ul={class:"tnum shrink-0 text-[13px] text-ink-3"},Rl={class:"mt-0.5 block text-[13px] text-ink-3"},Kl={class:"flex items-center gap-3 pt-1"},jl={class:"text-[13px] text-ink-3"},Gl={key:0,class:"mt-3 flex flex-wrap gap-2"},_l=["src"],Nl=["onClick"],ql={key:0,class:"flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"},Wl={class:"flex gap-3"},Zl={class:"flex flex-wrap gap-2"},Xl=["onClick"],Yl={class:"flex flex-wrap gap-2"},Jl=["onClick"],Ql={class:"flex items-center gap-3"},eo={class:"relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]",style:{"container-type":"size"}},to={class:"flex flex-wrap items-center gap-3"},no={class:"flex items-center gap-2"},io={class:"flex items-center gap-2"},lo={class:"flex flex-wrap items-center gap-5"},oo={class:"flex items-center gap-2"},ao={key:0,class:"flex items-center gap-2"},so={key:1,class:"flex items-center gap-2"},ro={key:2,class:"flex items-center gap-2"},uo={class:"flex items-center gap-3"},co={class:"flex items-center gap-3"},Xo=st({__name:"SettingsForm",props:De({mode:{},channelId:{},references:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:De(["referencesChanged"],["update:modelValue"]),setup(t,{emit:e}){const n=zt(t,"modelValue"),l=t,s=e,i=rt(),h=dt(),c=[{id:"voice",label:"Озвучка",icon:"pi-microphone"},{id:"scenes",label:"Сцены",icon:"pi-th-large"},{id:"images",label:"Изображения",icon:"pi-image"},{id:"llm",label:"Тексты и промпты",icon:"pi-sparkles"},{id:"render",label:"Анимация и видео",icon:"pi-video"},{id:"subtitles",label:"Субтитры",icon:"pi-align-center"},{id:"unique",label:"Уникализация",icon:"pi-shield"},{id:"publish",label:"Публикация",icon:"pi-youtube"}],f=K("voice"),y=K([]),g=K(""),x=K(null),z=K(null);async function j(){try{y.value=await ce.get("/api/lumean/templates"),g.value=""}catch(w){g.value=w.message}}const A=Q(()=>y.value.map(w=>({id:w.id,label:`${w.name}${w.model_id?` · ${w.model_id.replace("eleven_","")}`:""}`}))),F=Q(()=>Object.keys(n.value.voice.templates)),L=Q(()=>(i.meta?.languages??[]).filter(w=>!(w.code in n.value.voice.templates)));function D(){z.value&&(n.value.voice.templates={...n.value.voice.templates,[z.value]:""},z.value=null)}function C(w){const o={...n.value.voice.templates};delete o[w],n.value.voice.templates=o}async function G(w){await j(),x.value==="__default"?n.value.voice.default_template_id=w.id:x.value&&(n.value.voice.templates={...n.value.voice.templates,[x.value]:w.id})}const M=Q({get:()=>n.value.voice.speed!=null,set:w=>n.value.voice.speed=w?1:null}),Z=Q(()=>i.meta?.image_operations??[]),R=Q(()=>Z.value.find(w=>w.id===n.value.images.operation)),$=Q(()=>i.status?.fastgen?.budget??500);function B(w){const o=Z.value.find(J=>J.id===w);return(o?.credits??4)*(n.value.images.upscale_2x&&o?.upscale?2:1)}const oe=Q(()=>Math.floor($.value/B(n.value.images.operation))),Y=Q(()=>n.value.images.model_strategy!=="single"),U=[{v:"single",l:"Одна модель"},{v:"intro",l:"Начало качественнее"},{v:"budget",l:"По бюджету"}],P=Q(()=>({single:"Все сцены генерируются одной моделью.",intro:"Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.",budget:"Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен."})[n.value.images.model_strategy]),S=Q(()=>Z.value.map(w=>({...w,label:`${w.name} · ${w.credits} кр.`}))),I=Q(()=>{const o=n.value.images.budget_credits||$.value,J=B(n.value.images.operation),a=B(n.value.images.economy_operation);if(J<=a)return"все 100 сцен — качественной моделью";const te=Math.max(0,Math.min(100,Math.floor((o-100*a)/(J-a))));return te>=100?"все 100 сцен — качественной моделью":`${te} качественных и ${100-te} дешёвых`}),X=K(!1);async function ue(w){const o=w.target.files;if(!(!o?.length||!l.channelId)){X.value=!0;try{for(const J of Array.from(o))await ce.upload(`/api/channels/${l.channelId}/references`,J);s("referencesChanged")}catch(J){h.error(J)}finally{X.value=!1,w.target.value=""}}}async function me(w){await ce.post(`/api/channels/${l.channelId}/references/delete`,{path:w}),s("referencesChanged")}const ye=K([]);async function ke(){try{ye.value=await ce.get("/api/fastgen/chat-models")}catch{ye.value=[{id:n.value.llm.model,name:n.value.llm.model,context:0}]}}function we(w,o){return w.includes(o)?w.filter(J=>J!==o):[...w,o]}const ct=K([]),Dt=Q(()=>{const w=n.value.subtitles,o=w.size/1080*100,J=w.style==="box"?0:w.outline/1080*100*1.2;return{fontFamily:`"${w.font}", sans-serif`,fontSize:`${o}cqh`,fontWeight:w.bold?700:400,textTransform:w.uppercase?"uppercase":"none",color:w.primary_color,WebkitTextStroke:J?`${J}cqh ${w.outline_color}`:void 0,paintOrder:"stroke fill",background:w.style==="box"?`color-mix(in srgb, ${w.box_color} ${w.box_opacity*100}%, transparent)`:void 0,padding:w.style==="box"?"0.15em 0.4em":void 0,textShadow:w.shadow?`0 ${w.shadow*.15}cqh ${w.shadow*.3}cqh rgb(0 0 0 / .6)`:void 0}}),Ut=Q(()=>{const w=`${n.value.subtitles.margin_v/1080*100}%`;return n.value.subtitles.position==="top"?{top:w}:n.value.subtitles.position==="middle"?{top:"45%"}:{bottom:w}});function Te(w){return w.startsWith("#")?w:`#${w}`}return en(async()=>{j(),ke(),ct.value=await ce.get("/api/fonts").catch(()=>[])}),(w,o)=>{const J=Re("tooltip");return d(),u("div",Il,[p("nav",Ol,[(d(),u(V,null,ae(c,a=>p("button",{key:a.id,class:W(["flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised",f.value===a.id?"bg-raised text-ink":"text-ink-2"]),onClick:te=>f.value=a.id},[p("i",{class:W([["pi",a.icon],"w-4 text-[14px]"])},null,2),N(H(a.label),1)],10,Sl)),64))]),p("div",Ll,[f.value==="voice"?(d(),u(V,{key:0},[o[66]||(o[66]=p("p",{class:"text-ink-3"}," Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию. ",-1)),g.value?(d(),u("div",Cl," Не удалось загрузить голоса Lumean: "+H(g.value),1)):O("",!0),r(k,{label:"Голос по умолчанию",hint:"Для языков без отдельного голоса"},{default:v(()=>[p("div",Vl,[r(m(ee),{modelValue:n.value.voice.default_template_id,"onUpdate:modelValue":o[0]||(o[0]=a=>n.value.voice.default_template_id=a),options:A.value,"option-value":"id","option-label":"label",filter:"","show-clear":"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","options"]),r(m(fe),{icon:"pi pi-search",label:"Подобрать",severity:"secondary",outlined:"",onClick:o[1]||(o[1]=a=>x.value="__default")})])]),_:1}),(d(!0),u(V,null,ae(F.value,a=>(d(),E(k,{key:a,label:m(i).langLabel(a)},{default:v(()=>[p("div",zl,[r(m(ee),{modelValue:n.value.voice.templates[a],"onUpdate:modelValue":te=>n.value.voice.templates[a]=te,options:A.value,"option-value":"id","option-label":"label",filter:"",placeholder:"Выберите шаблон Lumean",class:"min-w-0 flex-1"},null,8,["modelValue","onUpdate:modelValue","options"]),Ke(r(m(fe),{icon:"pi pi-search",severity:"secondary",outlined:"","aria-label":"Подобрать голос",onClick:te=>x.value=a},null,8,["onClick"]),[[J,"Подобрать голос"]]),r(m(fe),{icon:"pi pi-trash",severity:"secondary",text:"","aria-label":"Убрать язык",onClick:te=>C(a)},null,8,["onClick"])])]),_:2},1032,["label"]))),128)),r(k,{label:"Отдельный голос для языка"},{default:v(()=>[p("div",Ml,[r(m(ee),{modelValue:z.value,"onUpdate:modelValue":o[2]||(o[2]=a=>z.value=a),options:L.value,"option-value":"code","option-label":"name",filter:"",placeholder:"Язык",class:"w-60"},null,8,["modelValue","options"]),r(m(fe),{label:"Добавить",severity:"secondary",outlined:"",disabled:!z.value,onClick:D},null,8,["disabled"])])]),_:1}),r(k,{label:"Своя скорость речи",hint:"Иначе используется скорость из шаблона",value:n.value.voice.speed?.toFixed(2)},{default:v(()=>[p("div",$l,[r(m(ne),{modelValue:M.value,"onUpdate:modelValue":o[3]||(o[3]=a=>M.value=a)},null,8,["modelValue"]),n.value.voice.speed!=null?(d(),E(m(ie),{key:0,modelValue:n.value.voice.speed,"onUpdate:modelValue":o[4]||(o[4]=a=>n.value.voice.speed=a),min:.7,max:1.2,step:.01,class:"flex-1"},null,8,["modelValue"])):O("",!0)])]),_:1},8,["value"]),r(k,{label:"Озвучивать по абзацам",hint:"Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже"},{default:v(()=>[r(m(ne),{modelValue:n.value.voice.paragraph_mode,"onUpdate:modelValue":o[5]||(o[5]=a=>n.value.voice.paragraph_mode=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(xl,{visible:x.value!==null,language:x.value&&x.value!=="__default"?x.value:void 0,"onUpdate:visible":o[6]||(o[6]=a=>!a&&(x.value=null)),onCreated:G},null,8,["visible","language"])],64)):f.value==="scenes"?(d(),u(V,{key:1},[r(k,{label:"Способ разбивки"},{default:v(()=>[r(m(ve),{modelValue:n.value.scenes.mode,"onUpdate:modelValue":o[7]||(o[7]=a=>n.value.scenes.mode=a),options:[{v:"smart",l:"По смыслу (LLM)"},{v:"auto",l:"По предложениям"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),p("p",Pl,H(n.value.scenes.mode==="smart"?"Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.":"Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности."),1)]),_:1}),r(k,{label:"Длительность сцены",hint:"Сколько секунд держится одна картинка",value:`${n.value.scenes.min_duration}–${n.value.scenes.max_duration} с`},{default:v(()=>[p("div",Tl,[r(m(_),{modelValue:n.value.scenes.min_duration,"onUpdate:modelValue":o[8]||(o[8]=a=>n.value.scenes.min_duration=a),min:1,max:n.value.scenes.max_duration,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","max"]),o[67]||(o[67]=p("span",{class:"text-ink-3"},"до",-1)),r(m(_),{modelValue:n.value.scenes.max_duration,"onUpdate:modelValue":o[9]||(o[9]=a=>n.value.scenes.max_duration=a),min:n.value.scenes.min_duration,max:60,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue","min"])])]),_:1},8,["value"]),r(k,{label:"Быстрое начало",hint:"В первые секунды картинки меняются чаще — это удерживает зрителя",value:`${n.value.scenes.intro_seconds} с`},{default:v(()=>[r(m(ie),{modelValue:n.value.scenes.intro_seconds,"onUpdate:modelValue":o[10]||(o[10]=a=>n.value.scenes.intro_seconds=a),min:0,max:180,step:5,class:"mt-3"},null,8,["modelValue"]),n.value.scenes.intro_seconds>0?(d(),u("div",Bl,[o[68]||(o[68]=p("span",{class:"text-ink-3"},"Сцены в начале",-1)),r(m(_),{modelValue:n.value.scenes.intro_min_duration,"onUpdate:modelValue":o[11]||(o[11]=a=>n.value.scenes.intro_min_duration=a),min:1,max:n.value.scenes.intro_max_duration,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","max"]),o[69]||(o[69]=p("span",{class:"text-ink-3"},"до",-1)),r(m(_),{modelValue:n.value.scenes.intro_max_duration,"onUpdate:modelValue":o[12]||(o[12]=a=>n.value.scenes.intro_max_duration=a),min:n.value.scenes.intro_min_duration,max:30,step:.5,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-28"},null,8,["modelValue","min"])])):O("",!0)]),_:1},8,["value"])],64)):f.value==="images"?(d(),u(V,{key:2},[r(k,{label:"Распределение моделей"},{default:v(()=>[r(m(ve),{modelValue:n.value.images.model_strategy,"onUpdate:modelValue":o[13]||(o[13]=a=>n.value.images.model_strategy=a),options:U,"option-value":"v","option-label":"l","allow-empty":!1,size:"small"},null,8,["modelValue"]),p("p",Hl,H(P.value),1)]),_:1}),r(k,{label:Y.value?"Качественная модель":"Модель",hint:`≈ ${oe.value} картинок в час на вашем тарифе`},{default:v(()=>[p("div",Fl,[(d(!0),u(V,null,ae(Z.value,a=>(d(),u("button",{key:a.id,class:W(["rounded-md border px-3.5 py-2.5 text-left transition-colors",n.value.images.operation===a.id?"border-tally bg-tally/10":"border-line hover:border-ink-3"]),onClick:te=>n.value.images.operation=a.id},[p("span",El,[p("span",Dl,H(a.name),1),p("span",Ul,H(a.credits)+" кр.",1)]),p("span",Rl,H(a.note),1)],10,Al))),128))])]),_:1},8,["label","hint"]),Y.value?(d(),u(V,{key:0},[r(k,{label:"Дешёвая модель",hint:`Для остальных сцен · ≈ ${Math.floor($.value/B(n.value.images.economy_operation))} картинок в час`},{default:v(()=>[r(m(ee),{modelValue:n.value.images.economy_operation,"onUpdate:modelValue":o[14]||(o[14]=a=>n.value.images.economy_operation=a),options:S.value,"option-value":"id","option-label":"label",class:"w-80"},null,8,["modelValue","options"])]),_:1},8,["hint"]),n.value.images.model_strategy==="intro"?(d(),E(k,{key:0,label:"Качественная модель первые",hint:"Минут от начала каждого видео"},{default:v(()=>[r(m(_),{modelValue:n.value.images.premium_minutes,"onUpdate:modelValue":o[15]||(o[15]=a=>n.value.images.premium_minutes=a),min:.5,max:60,step:.5,"min-fraction-digits":0,"max-fraction-digits":1,suffix:" мин","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1})):(d(),E(k,{key:1,label:"Бюджет на проект",hint:`Кредитов на все картинки проекта. 0 — один час тарифа (${$.value} кр.). Для 10-минутного видео: ${I.value}`},{default:v(()=>[r(m(_),{modelValue:n.value.images.budget_credits,"onUpdate:modelValue":o[16]||(o[16]=a=>n.value.images.budget_credits=a),min:0,step:50,suffix:" кр.","show-buttons":"",class:"w-36"},null,8,["modelValue"])]),_:1},8,["hint"]))],64)):O("",!0),R.value?.upscale?(d(),E(k,{key:1,label:"Увеличение 2×",hint:"Чётче при зуме и в 1440p/4K, но вдвое дороже"},{default:v(()=>[r(m(ne),{modelValue:n.value.images.upscale_2x,"onUpdate:modelValue":o[17]||(o[17]=a=>n.value.images.upscale_2x=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1})):O("",!0),r(k,{label:"Стиль канала",hint:"Добавляется к каждому промпту: техника, свет, цвет, настроение"},{default:v(()=>[r(m(he),{modelValue:n.value.images.style_prompt,"onUpdate:modelValue":o[18]||(o[18]=a=>n.value.images.style_prompt=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Чего не должно быть",hint:"Перечислите через запятую"},{default:v(()=>[r(m(he),{modelValue:n.value.images.avoid,"onUpdate:modelValue":o[19]||(o[19]=a=>n.value.images.avoid=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Референсы стиля",hint:t.mode==="channel"?"Примеры картинок в нужном стиле — отправляются вместе с каждым запросом":"Задаются в настройках канала"},{default:v(()=>[p("div",Kl,[r(m(ne),{modelValue:n.value.images.use_references,"onUpdate:modelValue":o[20]||(o[20]=a=>n.value.images.use_references=a),disabled:!R.value?.refs},null,8,["modelValue","disabled"]),p("span",jl,H(R.value?.refs?"Использовать референсы":"Эта модель не принимает референсы"),1)]),t.references?.length||t.mode==="channel"?(d(),u("div",Gl,[(d(!0),u(V,null,ae(t.references,a=>(d(),u("div",{key:a.path,class:"group relative h-20 w-32 overflow-hidden rounded-md border border-line"},[p("img",{src:a.url,alt:"Референс стиля",class:"h-full w-full object-cover"},null,8,_l),t.mode==="channel"?(d(),u("button",{key:0,class:"absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex","aria-label":"Удалить референс",onClick:te=>me(a.path)},[...o[70]||(o[70]=[p("i",{class:"pi pi-times text-xs"},null,-1)])],8,Nl)):O("",!0)]))),128)),t.mode==="channel"?(d(),u("label",ql,[p("i",{class:W(["pi",X.value?"pi-spin pi-spinner":"pi-plus"])},null,2),o[71]||(o[71]=N("Добавить ",-1)),p("input",{type:"file",accept:"image/*",multiple:"",class:"hidden",onChange:ue},null,32)])):O("",!0)])):O("",!0)]),_:1},8,["hint"]),r(k,{label:"Водяные знаки",hint:"Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется"},{default:v(()=>[r(m(ee),{modelValue:n.value.images.watermark_fix,"onUpdate:modelValue":o[21]||(o[21]=a=>n.value.images.watermark_fix=a),options:[{v:"auto",l:"Удалять автоматически"},{v:"crop",l:"Обрезать угол"},{v:"none",l:"Не трогать"}],"option-value":"v","option-label":"l",class:"w-64"},null,8,["modelValue"])]),_:1}),r(k,{label:"Исправлять отклонённые промпты",hint:"Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит"},{default:v(()=>[r(m(ne),{modelValue:n.value.images.auto_fix_rejected,"onUpdate:modelValue":o[22]||(o[22]=a=>n.value.images.auto_fix_rejected=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Попыток на картинку"},{default:v(()=>[r(m(_),{modelValue:n.value.images.max_attempts,"onUpdate:modelValue":o[23]||(o[23]=a=>n.value.images.max_attempts=a),min:1,max:6,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="llm"?(d(),u(V,{key:3},[r(k,{label:"Модель",hint:"Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком"},{default:v(()=>[r(m(ee),{modelValue:n.value.llm.model,"onUpdate:modelValue":o[24]||(o[24]=a=>n.value.llm.model=a),options:ye.value,"option-value":"id","option-label":"name",filter:"",class:"w-80"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Тематика канала",hint:"О чём канал и для кого — помогает точнее подбирать образы и названия"},{default:v(()=>[r(m(he),{modelValue:n.value.llm.niche,"onUpdate:modelValue":o[25]||(o[25]=a=>n.value.llm.niche=a),"auto-resize":"",rows:"2",class:"w-full",placeholder:"Например: психология отношений для женщин 30–50 лет"},null,8,["modelValue"])]),_:1}),r(k,{label:"Указания для промптов",hint:"Постоянные правила для картинок канала"},{default:v(()=>[r(m(he),{modelValue:n.value.llm.prompt_instructions,"onUpdate:modelValue":o[26]||(o[26]=a=>n.value.llm.prompt_instructions=a),"auto-resize":"",rows:"3",class:"w-full",placeholder:"Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"},null,8,["modelValue"])]),_:1}),r(k,{label:"Креативность",value:n.value.llm.temperature.toFixed(1),hint:"Выше — разнообразнее образы, ниже — точнее по тексту"},{default:v(()=>[r(m(ie),{modelValue:n.value.llm.temperature,"onUpdate:modelValue":o[27]||(o[27]=a=>n.value.llm.temperature=a),min:0,max:1.2,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])],64)):f.value==="render"?(d(),u(V,{key:4},[r(k,{label:"Разрешение и частота"},{default:v(()=>[p("div",Wl,[r(m(ee),{modelValue:n.value.render.resolution,"onUpdate:modelValue":o[28]||(o[28]=a=>n.value.render.resolution=a),options:[{v:"1080p",l:"1920×1080 (Full HD)"},{v:"1440p",l:"2560×1440 (2K)"},{v:"2160p",l:"3840×2160 (4K)"}],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue"]),r(m(ee),{modelValue:n.value.render.fps,"onUpdate:modelValue":o[29]||(o[29]=a=>n.value.render.fps=a),options:[24,25,30,60],class:"w-28"},null,8,["modelValue"])]),o[72]||(o[72]=p("p",{class:"mt-2 text-[13px] text-ink-3"},"1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.",-1))]),_:1}),r(k,{label:"Движение камеры",hint:"Для каждой сцены выбирается случайно из отмеченных"},{default:v(()=>[p("div",Zl,[(d(!0),u(V,null,ae(m(i).meta?.effects,a=>(d(),u("button",{key:a.id,class:W(["rounded-md border px-3 py-1.5 text-[13px] transition-colors",n.value.render.motion_effects.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3 hover:text-ink-2"]),onClick:te=>n.value.render.motion_effects=we(n.value.render.motion_effects,a.id)},H(a.name),11,Xl))),128))])]),_:1}),r(k,{label:"Интенсивность движения",value:`${Math.round(n.value.render.motion_intensity*100)}%`},{default:v(()=>[r(m(ie),{modelValue:n.value.render.motion_intensity,"onUpdate:modelValue":o[30]||(o[30]=a=>n.value.render.motion_intensity=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Переходы"},{default:v(()=>[p("div",Yl,[(d(!0),u(V,null,ae(m(i).meta?.transitions,a=>(d(),u("button",{key:a.id,class:W(["rounded-md border px-3 py-1.5 text-[13px] transition-colors",n.value.render.transitions.includes(a.id)?"border-tally bg-tally/10 text-ink":"border-line text-ink-3 hover:text-ink-2"]),onClick:te=>n.value.render.transitions=we(n.value.render.transitions,a.id)},H(a.name),11,Jl))),128))])]),_:1}),r(k,{label:"Длительность перехода",value:`${n.value.render.transition_duration.toFixed(1)} с`},{default:v(()=>[r(m(ie),{modelValue:n.value.render.transition_duration,"onUpdate:modelValue":o[31]||(o[31]=a=>n.value.render.transition_duration=a),min:.2,max:1.5,step:.1,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Доля простых склеек",value:`${Math.round(n.value.render.cut_ratio*100)}%`,hint:"Без эффекта перехода — так монтаж выглядит естественнее"},{default:v(()=>[r(m(ie),{modelValue:n.value.render.cut_ratio,"onUpdate:modelValue":o[32]||(o[32]=a=>n.value.render.cut_ratio=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Появление и затухание"},{default:v(()=>[p("div",Ql,[r(m(_),{modelValue:n.value.render.fade_in,"onUpdate:modelValue":o[33]||(o[33]=a=>n.value.render.fade_in=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(m(_),{modelValue:n.value.render.fade_out,"onUpdate:modelValue":o[34]||(o[34]=a=>n.value.render.fade_out=a),min:0,max:5,step:.1,"max-fraction-digits":1,suffix:" с","show-buttons":"",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Качество кодирования"},{default:v(()=>[r(m(ve),{modelValue:n.value.render.quality,"onUpdate:modelValue":o[35]||(o[35]=a=>n.value.render.quality=a),options:[{v:"max",l:"Максимум"},{v:"high",l:"Высокое"},{v:"balanced",l:"Баланс"},{v:"fast",l:"Быстро"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Энкодер",hint:"Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее"},{default:v(()=>[r(m(ee),{modelValue:n.value.render.encoder,"onUpdate:modelValue":o[36]||(o[36]=a=>n.value.render.encoder=a),options:[{v:"auto",l:"Автоматически"},...(m(i).meta?.encoders??[]).map(a=>({v:a,l:a}))],"option-value":"v","option-label":"l",class:"w-56"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Громкость",hint:"YouTube нормализует к −14 LUFS",value:`${n.value.render.loudness} LUFS`},{default:v(()=>[r(m(ie),{modelValue:n.value.render.loudness,"onUpdate:modelValue":o[37]||(o[37]=a=>n.value.render.loudness=a),min:-24,max:-9,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),r(k,{label:"Процессов рендера",hint:"0 — подобрать автоматически по числу ядер"},{default:v(()=>[r(m(_),{modelValue:n.value.render.workers,"onUpdate:modelValue":o[38]||(o[38]=a=>n.value.render.workers=a),min:0,max:16,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1})],64)):f.value==="subtitles"?(d(),u(V,{key:5},[r(k,{label:"Вшивать субтитры в видео",hint:"Файл .srt для загрузки на YouTube создаётся всегда"},{default:v(()=>[r(m(ne),{modelValue:n.value.subtitles.enabled,"onUpdate:modelValue":o[39]||(o[39]=a=>n.value.subtitles.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.subtitles.enabled?(d(),u(V,{key:0},[p("div",eo,[p("div",{class:"absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight",style:Ne(Ut.value)},[p("span",{style:Ne(Dt.value)},[n.value.subtitles.style==="karaoke"?(d(),u(V,{key:0},[p("span",{style:Ne({color:n.value.subtitles.highlight_color})},"Так выглядят",4),o[73]||(o[73]=N(" субтитры",-1)),o[74]||(o[74]=p("br",null,null,-1)),o[75]||(o[75]=N("в вашем видео ",-1))],64)):(d(),u(V,{key:1},[o[76]||(o[76]=N("Так выглядят субтитры",-1)),o[77]||(o[77]=p("br",null,null,-1)),o[78]||(o[78]=N("в вашем видео",-1))],64))],4)],4)]),r(k,{label:"Стиль"},{default:v(()=>[r(m(ve),{modelValue:n.value.subtitles.style,"onUpdate:modelValue":o[40]||(o[40]=a=>n.value.subtitles.style=a),options:[{v:"plain",l:"Обводка"},{v:"karaoke",l:"Подсветка слов"},{v:"box",l:"Плашка"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"])]),_:1}),r(k,{label:"Шрифт",hint:"Свои шрифты положите в папку data/fonts"},{default:v(()=>[p("div",to,[r(m(ee),{modelValue:n.value.subtitles.font,"onUpdate:modelValue":o[41]||(o[41]=a=>n.value.subtitles.font=a),options:ct.value,editable:"",class:"w-56"},null,8,["modelValue","options"]),r(m(_),{modelValue:n.value.subtitles.size,"onUpdate:modelValue":o[42]||(o[42]=a=>n.value.subtitles.size=a),min:20,max:140,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"]),p("label",no,[r(m(ne),{modelValue:n.value.subtitles.bold,"onUpdate:modelValue":o[43]||(o[43]=a=>n.value.subtitles.bold=a)},null,8,["modelValue"]),o[79]||(o[79]=N("Жирный",-1))]),p("label",io,[r(m(ne),{modelValue:n.value.subtitles.uppercase,"onUpdate:modelValue":o[44]||(o[44]=a=>n.value.subtitles.uppercase=a)},null,8,["modelValue"]),o[80]||(o[80]=N("Заглавные",-1))])])]),_:1}),r(k,{label:"Цвета"},{default:v(()=>[p("div",lo,[p("label",oo,[r(m(Se),{"model-value":n.value.subtitles.primary_color.slice(1),"onUpdate:modelValue":o[45]||(o[45]=a=>n.value.subtitles.primary_color=Te(a))},null,8,["model-value"]),o[81]||(o[81]=N("Текст ",-1))]),n.value.subtitles.style==="karaoke"?(d(),u("label",ao,[r(m(Se),{"model-value":n.value.subtitles.highlight_color.slice(1),"onUpdate:modelValue":o[46]||(o[46]=a=>n.value.subtitles.highlight_color=Te(a))},null,8,["model-value"]),o[82]||(o[82]=N("Подсветка ",-1))])):O("",!0),n.value.subtitles.style!=="box"?(d(),u("label",so,[r(m(Se),{"model-value":n.value.subtitles.outline_color.slice(1),"onUpdate:modelValue":o[47]||(o[47]=a=>n.value.subtitles.outline_color=Te(a))},null,8,["model-value"]),o[83]||(o[83]=N("Обводка ",-1))])):(d(),u("label",ro,[r(m(Se),{"model-value":n.value.subtitles.box_color.slice(1),"onUpdate:modelValue":o[48]||(o[48]=a=>n.value.subtitles.box_color=Te(a))},null,8,["model-value"]),o[84]||(o[84]=N("Плашка ",-1))]))])]),_:1}),n.value.subtitles.style==="box"?(d(),E(k,{key:0,label:"Прозрачность плашки",value:`${Math.round(n.value.subtitles.box_opacity*100)}%`},{default:v(()=>[r(m(ie),{modelValue:n.value.subtitles.box_opacity,"onUpdate:modelValue":o[49]||(o[49]=a=>n.value.subtitles.box_opacity=a),min:.1,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])):(d(),E(k,{key:1,label:"Толщина обводки",value:n.value.subtitles.outline.toFixed(1)},{default:v(()=>[r(m(ie),{modelValue:n.value.subtitles.outline,"onUpdate:modelValue":o[50]||(o[50]=a=>n.value.subtitles.outline=a),min:0,max:8,step:.5,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"])),r(k,{label:"Положение"},{default:v(()=>[p("div",uo,[r(m(ve),{modelValue:n.value.subtitles.position,"onUpdate:modelValue":o[51]||(o[51]=a=>n.value.subtitles.position=a),options:[{v:"bottom",l:"Внизу"},{v:"middle",l:"По центру"},{v:"top",l:"Вверху"}],"option-value":"v","option-label":"l","allow-empty":!1},null,8,["modelValue"]),r(m(_),{modelValue:n.value.subtitles.margin_v,"onUpdate:modelValue":o[52]||(o[52]=a=>n.value.subtitles.margin_v=a),min:0,max:400,"show-buttons":"",suffix:" px",class:"w-32"},null,8,["modelValue"])])]),_:1}),r(k,{label:"Длина строки",hint:"Символов в строке и строк на экране"},{default:v(()=>[p("div",co,[r(m(_),{modelValue:n.value.subtitles.max_chars_per_line,"onUpdate:modelValue":o[53]||(o[53]=a=>n.value.subtitles.max_chars_per_line=a),min:12,max:80,"show-buttons":"",class:"w-32"},null,8,["modelValue"]),r(m(_),{modelValue:n.value.subtitles.max_lines,"onUpdate:modelValue":o[54]||(o[54]=a=>n.value.subtitles.max_lines=a),min:1,max:3,"show-buttons":"",class:"w-28"},null,8,["modelValue"])])]),_:1})],64)):O("",!0)],64)):f.value==="unique"?(d(),u(V,{key:6},[o[85]||(o[85]=p("p",{class:"text-ink-3"}," Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов, тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными. ",-1)),r(k,{label:"Уникализация"},{default:v(()=>[r(m(ne),{modelValue:n.value.unique.enabled,"onUpdate:modelValue":o[55]||(o[55]=a=>n.value.unique.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),n.value.unique.enabled?(d(),u(V,{key:0},[r(k,{label:"Сила",value:`${Math.round(n.value.unique.strength*100)}%`},{default:v(()=>[r(m(ie),{modelValue:n.value.unique.strength,"onUpdate:modelValue":o[56]||(o[56]=a=>n.value.unique.strength=a),min:0,max:1,step:.05,class:"mt-3"},null,8,["modelValue"])]),_:1},8,["value"]),(d(),u(V,null,ae([["color_jitter","Цветокоррекция","Яркость, контраст, насыщенность и температура"],["film_grain","Плёночное зерно","Едва заметный шум, разный в каждом рендере"],["vignette","Виньетка","Мягкое затемнение по краям"],["micro_zoom","Микрозум и сдвиг","Кадр чуть иначе обрезан"],["audio_eq","Эквализация звука","Неслышимые изменения тембра ±0.6 дБ"],["strip_metadata","Очистка метаданных","Убирает служебную информацию из файла"]],a=>r(k,{key:a[0],label:a[1],hint:a[2]},{default:v(()=>[r(m(ne),{modelValue:n.value.unique[a[0]],"onUpdate:modelValue":te=>n.value.unique[a[0]]=te,class:"mt-1.5"},null,8,["modelValue","onUpdate:modelValue"])]),_:2},1032,["label","hint"])),64))],64)):O("",!0)],64)):f.value==="publish"?(d(),u(V,{key:7},[r(k,{label:"Создавать в конвейере",hint:"Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео"},{default:v(()=>[r(m(ne),{modelValue:n.value.publish.enabled,"onUpdate:modelValue":o[57]||(o[57]=a=>n.value.publish.enabled=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Вариантов названия"},{default:v(()=>[r(m(_),{modelValue:n.value.publish.title_variants,"onUpdate:modelValue":o[58]||(o[58]=a=>n.value.publish.title_variants=a),min:1,max:10,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Тегов"},{default:v(()=>[r(m(_),{modelValue:n.value.publish.tags_count,"onUpdate:modelValue":o[59]||(o[59]=a=>n.value.publish.tags_count=a),min:3,max:40,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Главы в описании",hint:"Таймкоды разделов по абзацам сценария"},{default:v(()=>[r(m(ne),{modelValue:n.value.publish.with_chapters,"onUpdate:modelValue":o[60]||(o[60]=a=>n.value.publish.with_chapters=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Подпись в конце описания",hint:"Ссылки, соцсети, дисклеймеры"},{default:v(()=>[r(m(he),{modelValue:n.value.publish.description_footer,"onUpdate:modelValue":o[61]||(o[61]=a=>n.value.publish.description_footer=a),"auto-resize":"",rows:"3",class:"w-full"},null,8,["modelValue"])]),_:1}),r(k,{label:"Обложек"},{default:v(()=>[r(m(_),{modelValue:n.value.publish.thumbnail_count,"onUpdate:modelValue":o[62]||(o[62]=a=>n.value.publish.thumbnail_count=a),min:1,max:4,"show-buttons":"",class:"w-32"},null,8,["modelValue"])]),_:1}),r(k,{label:"Модель для обложек"},{default:v(()=>[r(m(ee),{modelValue:n.value.publish.thumbnail_operation,"onUpdate:modelValue":o[63]||(o[63]=a=>n.value.publish.thumbnail_operation=a),options:Z.value,"option-value":"id","option-label":"name",class:"w-72"},null,8,["modelValue","options"])]),_:1}),r(k,{label:"Заголовок на обложке",hint:"Модель нарисует 2–4 слова крупным шрифтом"},{default:v(()=>[r(m(ne),{modelValue:n.value.publish.thumbnail_text,"onUpdate:modelValue":o[64]||(o[64]=a=>n.value.publish.thumbnail_text=a),class:"mt-1.5"},null,8,["modelValue"])]),_:1}),r(k,{label:"Стиль обложек"},{default:v(()=>[r(m(he),{modelValue:n.value.publish.thumbnail_style,"onUpdate:modelValue":o[65]||(o[65]=a=>n.value.publish.thumbnail_style=a),"auto-resize":"",rows:"2",class:"w-full"},null,8,["modelValue"])]),_:1})],64)):O("",!0)])])}}});var Et={name:"MinusIcon",extends:Ge};function po(t){return bo(t)||mo(t)||fo(t)||ho()}function ho(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function fo(t,e){if(t){if(typeof t=="string")return tt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?tt(t,e):void 0}}function mo(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function bo(t){if(Array.isArray(t))return tt(t)}function tt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}function vo(t,e,n,l,s,i){return d(),u("svg",b({width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",xmlns:"http://www.w3.org/2000/svg"},t.pti()),po(e[0]||(e[0]=[p("path",{d:"M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z",fill:"currentColor"},null,-1)])),16)}Et.render=vo;var go=`
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
`,yo={root:function(e){var n=e.instance,l=e.props;return["p-checkbox p-component",{"p-checkbox-checked":n.checked,"p-disabled":l.disabled,"p-invalid":n.$pcCheckboxGroup?n.$pcCheckboxGroup.$invalid:n.$invalid,"p-variant-filled":n.$variant==="filled","p-checkbox-sm p-inputfield-sm":l.size==="small","p-checkbox-lg p-inputfield-lg":l.size==="large"}]},box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},ko=de.extend({name:"checkbox",style:go,classes:yo}),wo={name:"BaseCheckbox",extends:at,props:{value:null,binary:Boolean,indeterminate:{type:Boolean,default:!1},trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},required:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:ko,provide:function(){return{$pcCheckbox:this,$parentInstance:this}}};function $e(t){"@babel/helpers - typeof";return $e=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},$e(t)}function xo(t,e,n){return(e=Io(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Io(t){var e=Oo(t,"string");return $e(e)=="symbol"?e:e+""}function Oo(t,e){if($e(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if($e(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function So(t){return zo(t)||Vo(t)||Co(t)||Lo()}function Lo(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Co(t,e){if(t){if(typeof t=="string")return nt(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?nt(t,e):void 0}}function Vo(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function zo(t){if(Array.isArray(t))return nt(t)}function nt(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,l=Array(e);n<e;n++)l[n]=t[n];return l}var Mo={name:"Checkbox",extends:wo,inheritAttrs:!1,emits:["change","focus","blur","update:indeterminate"],inject:{$pcCheckboxGroup:{default:void 0}},data:function(){return{d_indeterminate:this.indeterminate}},watch:{indeterminate:function(e){this.d_indeterminate=e,this.updateIndeterminate()}},mounted:function(){this.updateIndeterminate()},updated:function(){this.updateIndeterminate()},methods:{getPTOptions:function(e){var n=e==="root"?this.ptmi:this.ptm;return n(e,{context:{checked:this.checked,indeterminate:this.d_indeterminate,disabled:this.disabled}})},onChange:function(e){var n=this;if(!this.disabled&&!this.readonly){var l=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value,s;this.binary?s=this.d_indeterminate?this.trueValue:this.checked?this.falseValue:this.trueValue:this.checked||this.d_indeterminate?s=l.filter(function(i){return!Ct(i,n.value)}):s=l?[].concat(So(l),[this.value]):[this.value],this.d_indeterminate&&(this.d_indeterminate=!1,this.$emit("update:indeterminate",this.d_indeterminate)),this.$pcCheckboxGroup?this.$pcCheckboxGroup.writeValue(s,e):this.writeValue(s,e),this.$emit("change",e)}},onFocus:function(e){this.$emit("focus",e)},onBlur:function(e){var n,l;this.$emit("blur",e),(n=(l=this.formField).onBlur)===null||n===void 0||n.call(l,e)},updateIndeterminate:function(){this.$refs.input&&(this.$refs.input.indeterminate=this.d_indeterminate)}},computed:{groupName:function(){return this.$pcCheckboxGroup?this.$pcCheckboxGroup.groupName:this.$formName},checked:function(){var e=this.$pcCheckboxGroup?this.$pcCheckboxGroup.d_value:this.d_value;return this.d_indeterminate?!1:this.binary?e===this.trueValue:tn(this.value,e)},dataP:function(){return re(xo({invalid:this.$invalid,checked:this.checked,disabled:this.disabled,filled:this.$variant==="filled"},this.size,this.size))}},components:{CheckIcon:St,MinusIcon:Et}},$o=["data-p-checked","data-p-indeterminate","data-p-disabled","data-p"],Po=["id","value","name","checked","tabindex","disabled","readonly","required","aria-labelledby","aria-label","aria-invalid"],To=["data-p"];function Bo(t,e,n,l,s,i){var h=q("CheckIcon"),c=q("MinusIcon");return d(),u("div",b({class:t.cx("root")},i.getPTOptions("root"),{"data-p-checked":i.checked,"data-p-indeterminate":s.d_indeterminate||void 0,"data-p-disabled":t.disabled,"data-p":i.dataP}),[p("input",b({ref:"input",id:t.inputId,type:"checkbox",class:[t.cx("input"),t.inputClass],style:t.inputStyle,value:t.value,name:i.groupName,checked:i.checked,tabindex:t.tabindex,disabled:t.disabled,readonly:t.readonly,required:t.required,"aria-labelledby":t.ariaLabelledby,"aria-label":t.ariaLabel,"aria-invalid":t.invalid||void 0,onFocus:e[0]||(e[0]=function(){return i.onFocus&&i.onFocus.apply(i,arguments)}),onBlur:e[1]||(e[1]=function(){return i.onBlur&&i.onBlur.apply(i,arguments)}),onChange:e[2]||(e[2]=function(){return i.onChange&&i.onChange.apply(i,arguments)})},i.getPTOptions("input")),null,16,Po),p("div",b({class:t.cx("box")},i.getPTOptions("box"),{"data-p":i.dataP}),[T(t.$slots,"icon",{checked:i.checked,indeterminate:s.d_indeterminate,class:W(t.cx("icon")),dataP:i.dataP},function(){return[i.checked?(d(),E(h,b({key:0,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):s.d_indeterminate?(d(),E(c,b({key:1,class:t.cx("icon")},i.getPTOptions("icon"),{"data-p":i.dataP}),null,16,["class","data-p"])):O("",!0)]})],16,To)],16,$o)}Mo.render=Bo;var Ho=`
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
`,Fo={mask:function(e){var n=e.position,l=e.modal;return{position:"fixed",height:"100%",width:"100%",left:0,top:0,display:"flex",justifyContent:n==="left"?"flex-start":n==="right"?"flex-end":"center",alignItems:n==="top"?"flex-start":n==="bottom"?"flex-end":"center",pointerEvents:l?"auto":"none"}},root:{pointerEvents:"auto"}},Ao={mask:function(e){var n=e.instance,l=e.props,s=["left","right","top","bottom"],i=s.find(function(h){return h===l.position});return["p-drawer-mask",{"p-overlay-mask p-overlay-mask-enter-active":l.modal,"p-drawer-open":n.containerVisible,"p-drawer-full":n.fullScreen},i?"p-drawer-".concat(i):""]},root:function(e){var n=e.instance;return["p-drawer p-component",{"p-drawer-full":n.fullScreen}]},header:"p-drawer-header",title:"p-drawer-title",pcCloseButton:"p-drawer-close-button",content:"p-drawer-content",footer:"p-drawer-footer"},Eo=de.extend({name:"drawer",style:Ho,classes:Ao,inlineStyles:Fo}),Do={name:"BaseDrawer",extends:ge,props:{visible:{type:Boolean,default:!1},position:{type:String,default:"left"},header:{type:null,default:null},baseZIndex:{type:Number,default:0},autoZIndex:{type:Boolean,default:!0},dismissable:{type:Boolean,default:!0},showCloseIcon:{type:Boolean,default:!0},closeButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}},closeIcon:{type:String,default:void 0},modal:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!1},closeOnEscape:{type:Boolean,default:!0}},style:Eo,provide:function(){return{$pcDrawer:this,$parentInstance:this}}};function Pe(t){"@babel/helpers - typeof";return Pe=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Pe(t)}function qe(t,e,n){return(e=Uo(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Uo(t){var e=Ro(t,"string");return Pe(e)=="symbol"?e:e+""}function Ro(t,e){if(Pe(t)!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var l=n.call(t,e);if(Pe(l)!="object")return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var Ko={name:"Drawer",extends:Do,inheritAttrs:!1,emits:["update:visible","show","after-show","hide","after-hide","before-hide"],data:function(){return{containerVisible:this.visible}},container:null,mask:null,content:null,headerContainer:null,footerContainer:null,closeButton:null,outsideClickListener:null,documentKeydownListener:null,watch:{dismissable:function(e){e&&!this.modal?this.bindOutsideClickListener():this.unbindOutsideClickListener()}},updated:function(){this.visible&&(this.containerVisible=this.visible)},beforeUnmount:function(){this.disableDocumentSettings(),this.mask&&this.autoZIndex&&se.clear(this.mask),this.container=null,this.mask=null},methods:{hide:function(){this.$emit("update:visible",!1)},onEnter:function(){this.$emit("show"),this.focus(),this.bindDocumentKeyDownListener(),this.autoZIndex&&se.set("modal",this.mask,this.baseZIndex||this.$primevue.config.zIndex.modal)},onAfterEnter:function(){this.enableDocumentSettings(),this.$emit("after-show")},onBeforeLeave:function(){this.modal&&!this.isUnstyled&&We(this.mask,"p-overlay-mask-leave-active"),this.$emit("before-hide")},onLeave:function(){this.$emit("hide")},onAfterLeave:function(){this.autoZIndex&&se.clear(this.mask),this.unbindDocumentKeyDownListener(),this.containerVisible=!1,this.disableDocumentSettings(),this.$emit("after-hide")},onMaskClick:function(e){this.dismissable&&this.modal&&this.mask===e.target&&this.hide()},focus:function(){var e=function(s){return s&&s.querySelector("[autofocus]")},n=this.$slots.header&&e(this.headerContainer);n||(n=this.$slots.default&&e(this.container),n||(n=this.$slots.footer&&e(this.footerContainer),n||(n=this.closeButton))),n&&le(n)},enableDocumentSettings:function(){this.dismissable&&!this.modal&&this.bindOutsideClickListener(),this.blockScroll&&on()},disableDocumentSettings:function(){this.unbindOutsideClickListener(),this.blockScroll&&ln()},onKeydown:function(e){e.code==="Escape"&&this.closeOnEscape&&this.hide()},containerRef:function(e){this.container=e},maskRef:function(e){this.mask=e},contentRef:function(e){this.content=e},headerContainerRef:function(e){this.headerContainer=e},footerContainerRef:function(e){this.footerContainer=e},closeButtonRef:function(e){this.closeButton=e?e.$el:void 0},bindDocumentKeyDownListener:function(){this.documentKeydownListener||(this.documentKeydownListener=this.onKeydown,document.addEventListener("keydown",this.documentKeydownListener))},unbindDocumentKeyDownListener:function(){this.documentKeydownListener&&(document.removeEventListener("keydown",this.documentKeydownListener),this.documentKeydownListener=null)},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(n){e.isOutsideClicked(n)&&e.hide()},document.addEventListener("click",this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&(document.removeEventListener("click",this.outsideClickListener,!0),this.outsideClickListener=null)},isOutsideClicked:function(e){return this.container&&!this.container.contains(e.target)}},computed:{fullScreen:function(){return this.position==="full"},closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return re(qe(qe(qe({"full-screen":this.position==="full"},this.position,this.position),"open",this.containerVisible),"modal",this.modal))}},directives:{focustrap:nn},components:{Button:fe,Portal:Ue,TimesIcon:Lt}},jo=["data-p"],Go=["role","aria-modal","data-p"];function _o(t,e,n,l,s,i){var h=q("Button"),c=q("Portal"),f=Re("focustrap");return d(),E(c,null,{default:v(function(){return[s.containerVisible?(d(),u("div",b({key:0,ref:i.maskRef,onMousedown:e[0]||(e[0]=function(){return i.onMaskClick&&i.onMaskClick.apply(i,arguments)}),class:t.cx("mask"),style:t.sx("mask",!0,{position:t.position,modal:t.modal}),"data-p":i.dataP},t.ptm("mask")),[r(je,b({name:"p-drawer",onEnter:i.onEnter,onAfterEnter:i.onAfterEnter,onBeforeLeave:i.onBeforeLeave,onLeave:i.onLeave,onAfterLeave:i.onAfterLeave,appear:""},t.ptm("transition")),{default:v(function(){return[t.visible?Ke((d(),u("div",b({key:0,ref:i.containerRef,class:t.cx("root"),style:t.sx("root"),role:t.modal?"dialog":"complementary","aria-modal":t.modal?!0:void 0,"data-p":i.dataP},t.ptmi("root")),[t.$slots.container?T(t.$slots,"container",{key:0,closeCallback:i.hide}):(d(),u(V,{key:1},[p("div",b({ref:i.headerContainerRef,class:t.cx("header")},t.ptm("header")),[T(t.$slots,"header",{class:W(t.cx("title"))},function(){return[t.header?(d(),u("div",b({key:0,class:t.cx("title")},t.ptm("title")),H(t.header),17)):O("",!0)]}),t.showCloseIcon?T(t.$slots,"closebutton",{key:0,closeCallback:i.hide},function(){return[r(h,b({ref:i.closeButtonRef,type:"button",class:t.cx("pcCloseButton"),"aria-label":i.closeAriaLabel,unstyled:t.unstyled,onClick:i.hide},t.closeButtonProps,{pt:t.ptm("pcCloseButton"),"data-pc-group-section":"iconcontainer"}),{icon:v(function(y){return[T(t.$slots,"closeicon",{},function(){return[(d(),E(Le(t.closeIcon?"span":"TimesIcon"),b({class:[t.closeIcon,y.class]},t.ptm("pcCloseButton").icon),null,16,["class"]))]})]}),_:3},16,["class","aria-label","unstyled","onClick","pt"])]}):O("",!0)],16),p("div",b({ref:i.contentRef,class:t.cx("content")},t.ptm("content")),[T(t.$slots,"default")],16),t.$slots.footer?(d(),u("div",b({key:0,ref:i.footerContainerRef,class:t.cx("footer")},t.ptm("footer")),[T(t.$slots,"footer")],16)):O("",!0)],64))],16,Go)),[[f]]):O("",!0)]}),_:3},16,["onEnter","onAfterEnter","onBeforeLeave","onLeave","onAfterLeave"])],16,jo)):O("",!0)]}),_:3})}Ko.render=_o;function Yo(t){const e=dt(),n=rt(),l=K(null);async function s(i,h={},c){l.value=i;try{await ce.post(`/api/tracks/${t()}/jobs/${i}`,h),n.loadActiveJobs(),c&&e.info(c)}catch(f){e.error(f)}finally{l.value=null}}return{run:s,starting:l}}function No(t,e){if(t&&e&&typeof t=="object"&&typeof e=="object"&&!Array.isArray(t)){const n={};for(const[l,s]of Object.entries(t)){const i=No(s,e[l]);i!==void 0&&(n[l]=i)}return Object.keys(n).length?n:void 0}return JSON.stringify(t)===JSON.stringify(e)?void 0:t}export{ut as O,Xo as _,Tt as a,Ht as b,Bt as c,At as d,Mo as e,Ko as f,he as g,ee as h,No as i,kn as j,Pt as s,Yo as u};
