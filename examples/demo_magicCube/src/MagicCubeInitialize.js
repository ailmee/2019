/**
 * Created by SF3298 on 2019/11/30.
 */

var MagicCubeInitialize = function(){"use strict";

    let thm = this;
    var is_Init = false, df_Clock=null, df_raf = null;
    var raycaster = null, pickObject = [];
    var cubeGeo = null, planGeo = null, planMat = null;
    this.click_callback = toFunction();

    this.init = function( cts,config) {

        const conts = parseCts(cts);
        if ( detector() && conts != null) {
            try {

                config = config || {};
                defaultConfig = $.extend( true, {}, defaultConfig, config );

                thm.parentCont = conts;
                const TId = conts.attr('id') +'_'+ THREE.Math.generateUUID();
                thm.container = creatContainer( TId );

                thm.parentCont.html( thm.container );

                __setPlugsIN();

                initiate();
                is_Init = true;
            } catch (e) {
                thm.Result = 'error! Initialization Error!';
                creatError(conts);
                return;
            }
        } else thm.Result = 'error! Not Support WebGL!';
    };

    this.render = function () {
        if ( is_Init ) { renderers(); }
    };

    this.disposeRender = function () {
        if (is_Init) {
            is_Init = false;
        }
    };

    this.updateData = function(data){

        updateInData(data);//更新数据
    };

    this.updateSelect = function(id){

        updateInSelect(id);//更新数据
    };

    this.getClick = function(callback){
        thm.click_callback = toFunction(callback);
    };

    let defaultConfig = {
        controls:{ enabled: true },
        camera: { near:1, far:1000, position: [0, 0, 257.2124999999999],target:[0,0,0]},
        magicCube: {
            size: 12,
            row: 4,
            col: 4,
            space: 1.5,
            path: 'images/inRect.png',
            sPath: 'images/sInRect.png',

            dataNames: ['front', 'left', 'back', 'right', 'top', 'bottom'],

            label:{
                font: 'px 思源黑体',//字体样式
                fontWeight: 'normal',//字体粗细
                color: '#70ffbf',//普通字体颜色
                sColor: '#ffffff',//选中字体颜色
                size: 48,//字体大小
                spaceX: 10,//左右间距
                spaceY:0
            },

            data:{
                front:[
                    {name: '服务 1'}
                ],
            },

            baseEnable: true,//是否启用底盘
            outPEnable: true,//是否启用外围平面
            ringEnable: true,//是否启用旋转平面

            outPlane:{
                color: '#ffffff',
                path: 'images/outRect.png',
                opacity: .4,//透明值
                wScale: 0.85,//宽度占比
                scale: 1.15
            },

            base:{
                size: 100,//大小
                speed: 0.5,//底盘速度
                offset:[0, -50, -50],//偏移值
                rotateX: -Math.PI*.5//旋转值
            }
        },
        ring: {
            size: 100,
            pSize:[10, 15],
            pColor:['#1c93e7', '#44FFDF'],
            pPath: 'images/point.png',
            rPath: 'images/ring.png'
        }
    };

    //-init
    function initiate () {

        df_Clock = new THREE.Clock();

        // renderer
        var wh = { w: thm.container.width(), h: thm.container.height() };
        thm.renderer = _Collects.createRenderer(wh.w, wh.h);
        thm.container.append( $(thm.renderer.domElement) );

        thm.scene = _Collects.createScene();

        //- camera
        const cInfor = defaultConfig.camera;
        thm.camera = _Collects.createCamera( wh, cInfor.near, cInfor.far, cInfor.position );

        //- controls
        thm.controls = new THREE.OrbitControls( thm.camera, thm.container[0] );
        thm.controls.target.fromArray( cInfor.target );
        thm.controls.update();
        thm.controls.enabled = defaultConfig.controls.enabled;

        raycaster = new THREE.Raycaster();

        init3DMesh();

        //- 监听鼠标点击事件
        thm.container[0].addEventListener( 'click', onClick, false );
        window.addEventListener('resize', onContResize, false);
    }

    //-shader
    var _Shaders = {

        PlaneVShader: [
            "varying vec2 vUv;",
            "void main(){",
            "vUv= uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "}"
        ].join("\n"),
        PlaneFShader: [
            "uniform sampler2D b_map;",
            "uniform sampler2D s_map;",
            "uniform sampler2D t_map;",
            "uniform bool select;",
            "uniform vec3 color;",
            "uniform vec2 tUv;",
            "uniform vec3 sColor;",

            "varying vec2 vUv;",

            "void main(){",

            "vec4 fColor = select? texture2D( s_map, vUv ): texture2D( b_map, vUv );",

            "float tx = (1.0 - tUv.x)/2.0;",
            "vec2 uv = vec2(tx + vUv.x*tUv.x, vUv.y*tUv.y);",
            "vec4 wColor = texture2D( t_map, uv );",

            "gl_FragColor = vec4(fColor.rgb + wColor.rgb * (select? sColor: color), fColor.a);" ,
            "}"
        ].join("\n")
    };

    //- Common methods
    var _Collects = {

        createScene: function() {

            var scene = new THREE.Scene();
            return scene;
        },
        createCamera: function( wh, near, far, position ) {

            var camera = new THREE.PerspectiveCamera( 45, wh.w / wh.h, near, far );
            camera.position.set(position[0],position[1],position[2]);

            return camera;
        },
        createRenderer: function( w, h ) {

            var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
            // renderer.sortObjects = false;
            renderer.setSize( w, h );

            return renderer;
        }
    };

    var _Materials = {
        sprite: function( param ) { return new THREE.SpriteMaterial( param ); },
        point: function( param ) { return new THREE.PointsMaterial( param ); },
        basic: function ( param ) { return new THREE.MeshBasicMaterial( param ); },
        shader: function ( param ) { return new THREE.ShaderMaterial( param ); }
    };

    var _Geometries = {
        geo: function () { return new THREE.Geometry(); },
        buf: function () { return new THREE.BufferGeometry(); },
        planeBuf: function (w, h, ws, hs) { return new THREE.PlaneBufferGeometry( w, h, ws, hs ); },
        circleBuf: function (r, s, ts) { return new THREE.CircleBufferGeometry( r, s, ts ); }
    };

    function init3DMesh () {

        const config = defaultConfig.magicCube;

        thm.cube = new THREE.Object3D();
        thm.cube.name = '旋转魔方';
        thm.cube.rotateY(-Math.PI);
        //- 外围平面
        if(config.outPEnable){

            const parm = config.outPlane;
            thm.rect = new THREE.Object3D();
            thm.rect.scale.set(parm.scale, parm.scale, parm.scale);
        }

        createMagicCube();

        thm.rect && thm.cube.add(thm.rect);
        thm.scene.add(thm.cube);

        //- 旋转平面
        if(config.ringEnable){

            thm.ring = new THREE.Object3D();
            createAperture(thm.ring);
            thm.scene.add(thm.ring);
        }

        //- 底座
        if(config.baseEnable){

            //- 底盘集合对象
            thm.base = new THREE.Object3D();
            thm.scene.add(thm.base);

            //-
            let parm = config.base;
            for(let i=0; i<parm.size.length; i++){

                let _geo = _Geometries.planeBuf(parm.size[i], parm.size[i]);
                let mesh = new THREE.Mesh(_geo, _Materials.basic({
                    map: new THREE.TextureLoader().load( parm.path[i], function(tex){
                        tex.minFilter = THREE.LinearFilter;
                    }),
                    transparent: true,
                    depthWrite: false
                }));
                mesh.position.fromArray(parm.offset[i]);
                mesh.rotateX(parm.rotateX[i]);
                mesh._speed = parm.speed[i];

                thm.base.add(mesh);
            }
        }

    }

    function createMagicCube(){
        //- 配置项
        var config = defaultConfig.magicCube;
        config.width = config.size * config.row + config.space * (config.row - 1);

        //- 魔方纹理对象
        thm.cube.userData._map = new THREE.TextureLoader().load( config.path, function(tex){
            tex.minFilter = THREE.LinearFilter;
        });
        thm.cube.userData._sMap = new THREE.TextureLoader().load( config.sPath, function(tex){
            tex.minFilter = THREE.LinearFilter;
        });

        var hW = config.width * .5,
            s = config.space * .5;
        let pos = new THREE.Vector3(0,0,0);
        let rotate = new THREE.Vector3();

        // - 辅助矩阵
        var matrix = new THREE.Matrix4();
        matrix.makeRotationFromEuler(new THREE.Euler(Math.PI*.3, Math.PI*.25, 0));

        cubeGeo = _Geometries.planeBuf(config.size, config.size);

        //- 外平面
        if(config.outPEnable){

            //- 外平面配置项
            const parm = config.outPlane;
            const w = config.width*parm.wScale;
            planGeo = _Geometries.planeBuf(w, w);
            planMat = _Materials.basic({
                map: new THREE.TextureLoader().load( parm.path, function(tex){
                    tex.minFilter = THREE.LinearFilter;
                }),
                color: parm.color,
                transparent: true,
                opacity: parm.opacity,
                blending: THREE.AdditiveBlending
            });
        }

        //- 魔方
        createInRect(matrix, pos.set(0,0,hW+s), rotate);//前面
        createInRect(matrix, pos.set(-hW-s,0,0), rotate.set(0,-Math.PI*.5,0));//左面
        createInRect(matrix, pos.set(0,0,-hW-s), rotate.set(0,Math.PI,0));//后面
        createInRect(matrix, pos.set(hW+s,0,0), rotate.set(0,Math.PI*.5,0));//右面
        createInRect(matrix, pos.set(0,hW+s,0), rotate.set(-Math.PI*.5,0,0));//上面
        createInRect(matrix, pos.set(0,-hW-s,0), rotate.set(Math.PI*.5,0,0));//下面

        //- 文字数据
        updateInData(config.data, true);
        delete config.data;
    }
    function createInRect(matrixWorld, pos, rotate){

        const {size, row, col, space, width, label} = defaultConfig.magicCube;

        const group = new THREE.Object3D();
        group.position.copy(pos);
        group.rotation.setFromVector3(rotate);
        group.updateMatrix();
        group.matrixWorld.multiplyMatrices( matrixWorld, group.matrix );

        var quaternion=new THREE.Quaternion();
        group.matrixWorld.decompose( new THREE.Vector3(), quaternion, new THREE.Vector3() );

        let color = new THREE.Color(label.color);
        let sColor = new THREE.Color(label.sColor);
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {

                let mesh = new THREE.Mesh(cubeGeo, _Materials.shader({
                    uniforms:{
                        select: {value: false},
                        b_map: {value: thm.cube.userData._map},
                        s_map: {value: thm.cube.userData._sMap},
                        color: {value: color},
                        sColor: {value: sColor},
                        tUv: {value: new THREE.Vector2(1,1)},
                        t_map: {value: null}
                    },
                    transparent: true,

                    vertexShader: _Shaders.PlaneVShader,
                    fragmentShader: _Shaders.PlaneFShader
                }));

                let x = i * size + i * space - width / 2 + size / 2;
                let y = j * size + j * space - width / 2 + size / 2;

                mesh.position.set(x, y, 0).applyMatrix4(group.matrixWorld);
                mesh.quaternion.copy(quaternion);

                thm.cube.add(mesh);
                pickObject.push(mesh);
            }
        }

        thm.rect && createOutRect(group.matrixWorld, quaternion);
    }
    function createCanvasR(config, txt){
        //- 字体样式
        var font = config.fontWeight+" "+config.size + config.font;
        //-
        var cavs = document.createElement('canvas');
        var cont = cavs.getContext('2d');

        //- 计算字体宽度和高度
        cont.font = font;

        var _dw = Math.round( cont.measureText( txt ).width )+config.spaceX*2;
        var _tw = Math.max( 16, ceilPowerOfTwo( _dw ) ),
            // _th = _tw;
            _th = Math.max( 8, ceilPowerOfTwo( config.size+config.spaceY ) );

        //- 画布大小
        cavs.width = _tw;
        cavs.height = _th;

        //- 文字
        cont.textAlign = "center";
        cont.textBaseline = "middle";

        //-
        cont.font = font;
        cont.fillStyle = '#ffffff';
        cont.fillText( txt, _tw*0.5, _th*0.5 );

        var ratio = _tw/_th;
        var texture = new THREE.Texture(cavs);
        // texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        texture._size = {
            w: txt.length==0?1:ratio<1?1:1/ratio,
            h: 1
        };
        // texture._size = {
        //     w: txt.length==0?1:ratio<0?ratio:1,
        //     h: txt.length==0?1:ratio<0?1:1/ratio
        // };

        return texture;
    }

    //- 外围平面
    function createOutRect(matrixWorld, quaternion){

        let mesh = new THREE.Mesh(planGeo, planMat);

        mesh.position.applyMatrix4(matrixWorld);
        mesh.quaternion.copy(quaternion);
        mesh.renderOrder = 1;

        thm.rect.add(mesh);
    }

    //- 圆环（旋转点）
    function createAperture(ring){
        //- 配置项
        const config = defaultConfig.ring;
        //
        const baseInfor = {
            geo: _Geometries.planeBuf(config.size, config.size),
            pMap: new THREE.TextureLoader().load( config.pPath ),
            mat: _Materials.basic({
                map: new THREE.TextureLoader().load( config.rPath, function(tex){
                    tex.minFilter = THREE.LinearFilter;
                }),
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthTest: false,
                depthWrite: false
            }),
            rMat: _Materials.basic({
                visible: false
            })
        };
        //
        let points = [
            new THREE.Vector3(50,0,0),
            new THREE.Vector3(-50,0,0),
            new THREE.Vector3(0,0,50),
            new THREE.Vector3(0,-50,0)
        ];

        //
        let rotate = new THREE.Vector3( -Math.PI*.4, Math.PI*.08, 0 );
        createRPoint(ring, baseInfor, rotate, {size: config.pSize[0], color: config.pColor[0], points: points.slice(0,config.pNum[0])});

        //
        rotate = new THREE.Vector3( -Math.PI*.4, -Math.PI*.25, 0 );
        createRPoint(ring, baseInfor, rotate, {size: config.pSize[1], color: config.pColor[1], points: points.slice(0,config.pNum[1])});

    }
    function createRPoint(obj, ring, rotate, config){

        //- 圆环(不旋转)
        let mesh = new THREE.Mesh(ring.geo, ring.mat);
        mesh.rotateX(rotate.x);
        mesh.rotateY(rotate.y);
        mesh.renderOrder = 2;
        obj.add(mesh);

        //- 旋转平面（隐藏的平面）
        mesh = new THREE.Mesh(ring.geo, ring.rMat);
        mesh.rotateX(rotate.x);
        mesh.rotateY(rotate.y);
        mesh._rotate = true;
        obj.add(mesh);

        //- 旋转点
        var pGeo = _Geometries.geo();
        pGeo.vertices = config.points;
        let point = new THREE.Points( pGeo, _Materials.point({
            map: ring.pMap,
            color: config.color,
            size: config.size,
            transparent: true,
            depthWrite: false
        }));
        point.renderOrder = 2;
        mesh.add(point);

    }

    //- 更新数据
    function updateInData(data, isFirst){

        const {label, dataNames: names} = defaultConfig.magicCube;

        //- 魔方矩形个数
        let len = thm.cube.children.length;
        (!isFirst && thm.rect) && (len -=1);

        let num = len/6;

        for(let i=0; i<len; i++){

            //- 魔块对象
            const mesh = thm.cube.children[i];

            //- 数据信息
            let k = i % num;
            const infor = data[names[Math.floor(i/num)]][k];
            const uniforms = mesh.material.uniforms;
            //- 删除原纹理对象
            if(uniforms.t_map.value){

                uniforms.t_map.value.dispose();
                uniforms.t_map.value = null;
            }
            //- 替换纹理
            let txt = infor.name;
            infor.name.length>label.num && (txt = infor.name.slice(0,label.num) + "...");
            let tex = createCanvasR(label, txt);
            uniforms.t_map.value = tex;
            uniforms.tUv.value.set(tex._size.w, tex._size.h);

            mesh._infor = infor;//数据信息
        }

    }
    //- 更新选中效果
    function updateInSelect(id){
        //- 魔方矩形个数
        const conig = defaultConfig.magicCube;
        let len = conig.row * conig.col * 6;

        for(let i=0; i<len; i++){

            //- 魔块对象
            const mesh = thm.cube.children[i];

            mesh.material.uniforms.select.value = mesh._infor.id == id;
        }
    }

    function ceilPowerOfTwo(value){

        return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );
    }

    function onClick( event ) {

        var wh = { w: thm.container.width(), h: thm.container.height() };

        //-
        var mouse = new THREE.Vector2();
        mouse.x = ( event.layerX / wh.w ) * 2 - 1;
        mouse.y = - ( event.layerY / wh.h ) * 2 + 1;
        //-
        raycaster.setFromCamera( mouse, thm.camera );
        const intersects = raycaster.intersectObjects( pickObject );

        //- 处理单击事件要干的事
        if ( intersects.length > 0 ) {
            //index/point
            const object = intersects[0].object;

            //- 选中效果
            const select = object.material.uniforms.select;
            select.value = !select.value;

            thm.click_callback(true,object._infor);
        }else{
            thm.click_callback(false);
        }
    }

    function animation(dt) {

        // //- 自转
        thm.cube && (thm.cube.rotation.y = df_Clock.elapsedTime * defaultConfig.magicCube.speed);

        thm.base && thm.base.children.forEach(function(base){

            base.rotation.z = df_Clock.elapsedTime * base._speed;
        });

        thm.ring && thm.ring.children.forEach(function(ring){

            ring._rotate && (ring.rotation.z = df_Clock.elapsedTime * defaultConfig.ring.speed);
        });
    }

    function onContResize ( event ) {

        var wh = { w: thm.container.width(), h: thm.container.height() };
        thm.camera.aspect = wh.w/wh.h;
        thm.camera.updateProjectionMatrix();

        thm.renderer.setSize(wh.w, wh.h);
    }

    //- renderer
    function renderers () {
        (function Animations() {
            if (is_Init) {
                df_raf = window.requestAnimationFrame(Animations);

                var delte = df_Clock.getDelta();
                animation(delte);

                thm.renderer.render( thm.scene, thm.camera );
            } else {
                df_raf && window.cancelAnimationFrame(df_raf);

                removeEvents();
                disposeScene();
            }
        })();
    }

    function disposeScene() {
        //-
        thm.renderer.dispose();
        thm.renderer.forceContextLoss();
        thm.renderer.domElement = null;
        thm.renderer.context = null;

        thm.container.remove();

        //-
        df_raf = null;
        defaultConfig = null;
        raycaster = null;
        pickObject = null;

        cubeGeo = null;
        planGeo = null;
        planMat = null;

        //-
        _Shaders = null;
        _Materials = null;
        _Geometries = null;
        _Collects = null;

        thm.parentCont = null;
        if(thm.cube){

            //- 魔方纹理对象
            thm.cube.userData._map.dispose();
            thm.cube.userData._sMap.dispose();
            thm.cube.userData = {};
        }
        thm.cube = null;
        thm.base = null;
        thm.rect = null;
        thm.ring = null;

        disposeObj(thm.scene);

        df_Clock = null;
        thm.scene = null;
        thm.camera = null;
        thm.renderer = null;

        thm.click_callback = null;

        thm = null;
    }
    function disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {

            objectTraverse(obj, function(child) {
                //- geometry
                if (child.geometry) {
                    if (child.geometry._bufferGeometry) {
                        child.geometry._bufferGeometry.dispose();
                    }
                    child.geometry.dispose();
                    child.geometry = null;
                    //- material
                    if (Array.isArray(child.material)) {
                        child.material.forEach(function(mtl) {
                            disposeMaterial(mtl);
                        });
                    }else{
                        disposeMaterial(child.material);
                    }
                    child.material = null;
                }
                if (child.parent) child.parent.remove(child);
                child = null;
            });
        }
    }
    function objectTraverse(obj, callback) {
        if (!callback) return;
        var children = obj.children;
        for (var i = children.length - 1; i >= 0; i--) {
            objectTraverse(children[i], callback);
        }
        callback(obj);
    }
    function disposeMaterial(mtl) {
        if(mtl.uniforms){

            for(let i in mtl.uniforms){
                if (mtl.__webglShader && mtl.__webglShader.uniforms[i] && mtl.__webglShader.uniforms[i].value ) {
                    mtl.__webglShader.uniforms[i].value.dispose&&mtl.__webglShader.uniforms[i].value.dispose();
                    mtl.__webglShader.uniforms[i].value = null;
                }
                if(mtl.uniforms[i].value){

                    mtl.uniforms[i].value.dispose&&mtl.uniforms[i].value.dispose();
                    mtl.uniforms[i].value = null;
                }
            }
        }

        if (mtl.map) {
            mtl.map.dispose();
            mtl.map = null;
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.map.value.dispose();
                mtl.__webglShader.uniforms.map.value = null;
            }
        }

        mtl.dispose();
        mtl = null;
    }

    function removeEvents() {

        thm.container[0].removeEventListener( 'click', onClick, false );
        window.removeEventListener( 'resize', onContResize, false );
    }

    function toFunction ( a ) {
        var b = Object.prototype.toString.call(a) === '[object Function]';
        return b? a: function(o){};
    }

    function detector () {
        try {
            return !! window.WebGLRenderingContext && !! document.createElement('canvas').getContext('experimental-webgl');
        } catch( e ) { return false; }
    }
    function parseCts ( cts ) {
        var $dom = ( typeof cts == 'object' )? $(cts): $('#'+cts);
        if ( $dom.length <= 0 ) return null;
        return $dom;
    }

    function creatContainer ( id ) {
        var containers = $('<div></div>');
        containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:absolute");
        containers.attr('id', id);
        return containers;
    }
    function creatError ( conts, errorText ) {
        var error = $('<div class="data-error"></div>'),
            error_text = errorText || '数据错误。。。';
        if( undefined != conts ) {
            var ctxt = "color:#fff;position:absolute;top:49%;width:100%;text-align:center;";
            error.css("cssText", ctxt);
            conts.html( error.html(error_text) );
        }
    }
};

function __setPlugsIN() {
    THREE.OrbitControls=function(F,G){function h(){return Math.pow(.95,a.zoomSpeed)}function z(b){a.object instanceof THREE.PerspectiveCamera?k/=b:a.object instanceof THREE.OrthographicCamera?(a.object.zoom=Math.max(a.minZoom,Math.min(a.maxZoom,a.object.zoom*b)),a.object.updateProjectionMatrix(),y=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),a.enableZoom=!1)}function A(b){a.object instanceof THREE.PerspectiveCamera?k*=b:a.object instanceof THREE.OrthographicCamera?
            (a.object.zoom=Math.max(a.minZoom,Math.min(a.maxZoom,a.object.zoom/b)),a.object.updateProjectionMatrix(),y=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),a.enableZoom=!1)}function H(b){if(!1!==a.enabled){b.preventDefault();if(b.button===a.mouseButtons.ORBIT){if(!1===a.enableRotate)return;l.set(b.clientX,b.clientY);d=c.ROTATE}else if(b.button===a.mouseButtons.ZOOM){if(!1===a.enableZoom)return;m.set(b.clientX,b.clientY);d=c.DOLLY}else if(b.button===
        a.mouseButtons.PAN){if(!1===a.enablePan)return;n.set(b.clientX,b.clientY);d=c.PAN}d!==c.NONE&&(document.addEventListener("mousemove",B,!1),document.addEventListener("mouseup",C,!1),a.dispatchEvent(D))}}function B(b){!1!==a.enabled&&(b.preventDefault(),d===c.ROTATE?!1!==a.enableRotate&&(p.set(b.clientX,b.clientY),q.subVectors(p,l),b=a.domElement===document?a.domElement.body:a.domElement,e.theta-=2*Math.PI*q.x/b.clientWidth*a.rotateSpeed,e.phi-=2*Math.PI*q.y/b.clientHeight*a.rotateSpeed,l.copy(p),a.update()):
        d===c.DOLLY?!1!==a.enableZoom&&(r.set(b.clientX,b.clientY),t.subVectors(r,m),0<t.y?z(h()):0>t.y&&A(h()),m.copy(r),a.update()):d===c.PAN&&!1!==a.enablePan&&(u.set(b.clientX,b.clientY),v.subVectors(u,n).multiplyScalar(a.panSpeed),w(v.x,v.y),n.copy(u),a.update()))}function C(b){!1!==a.enabled&&(document.removeEventListener("mousemove",B,!1),document.removeEventListener("mouseup",C,!1),a.dispatchEvent(E),d=c.NONE)}function I(b){!1===a.enabled||!1===a.enableZoom||d!==c.NONE&&d!==c.ROTATE||(b.preventDefault(),
        b.stopPropagation(),0>b.deltaY?A(h()):0<b.deltaY&&z(h()),a.update(),a.dispatchEvent(D),a.dispatchEvent(E))}function J(b){if(!1!==a.enabled&&!1!==a.enableKeys&&!1!==a.enablePan)switch(b.keyCode){case a.keys.UP:w(0,7*-a.panSpeed);a.update();break;case a.keys.BOTTOM:w(0,7*a.panSpeed);a.update();break;case a.keys.LEFT:w(7*-a.panSpeed,0);a.update();break;case a.keys.RIGHT:w(7*a.panSpeed,0),a.update()}}function K(b){if(!1!==a.enabled){switch(b.touches.length){case 1:if(!1===a.enableRotate)return;l.set(b.touches[0].pageX,
        b.touches[0].pageY);d=c.TOUCH_ROTATE;break;case 2:if(!1===a.enableZoom)return;var g=b.touches[0].pageX-b.touches[1].pageX;b=b.touches[0].pageY-b.touches[1].pageY;m.set(0,Math.sqrt(g*g+b*b));d=c.TOUCH_DOLLY;break;case 3:if(!1===a.enablePan)return;n.set(b.touches[0].pageX,b.touches[0].pageY);d=c.TOUCH_PAN;break;default:d=c.NONE}d!==c.NONE&&a.dispatchEvent(D)}}function L(b){if(!1!==a.enabled)switch(b.preventDefault(),b.stopPropagation(),b.touches.length){case 1:if(!1===a.enableRotate)break;if(d!==c.TOUCH_ROTATE)break;
        p.set(b.touches[0].pageX,b.touches[0].pageY);q.subVectors(p,l);var g=a.domElement===document?a.domElement.body:a.domElement;e.theta-=2*Math.PI*q.x/g.clientWidth*a.rotateSpeed;e.phi-=2*Math.PI*q.y/g.clientHeight*a.rotateSpeed;l.copy(p);a.update();break;case 2:if(!1===a.enableZoom)break;if(d!==c.TOUCH_DOLLY)break;g=b.touches[0].pageX-b.touches[1].pageX;b=b.touches[0].pageY-b.touches[1].pageY;r.set(0,Math.sqrt(g*g+b*b));t.subVectors(r,m);0<t.y?A(h()):0>t.y&&z(h());m.copy(r);a.update();break;case 3:if(!1===
        a.enablePan)break;if(d!==c.TOUCH_PAN)break;u.set(b.touches[0].pageX,b.touches[0].pageY);v.subVectors(u,n);w(v.x,v.y);n.copy(u);a.update();break;default:d=c.NONE}}function M(b){!1!==a.enabled&&(a.dispatchEvent(E),d=c.NONE)}function N(a){a.preventDefault()}this.object=F;this.domElement=void 0!==G?G:document;this.enabled=!0;this.target=new THREE.Vector3;this.minDistance=0;this.maxDistance=Infinity;this.minZoom=0;this.maxZoom=Infinity;this.minPolarAngle=0;this.maxPolarAngle=Math.PI;this.minAzimuthAngle=
        -Infinity;this.maxAzimuthAngle=Infinity;this.enableDamping=!1;this.dampingFactor=.25;this.enableZoom=!0;this.zoomSpeed=1;this.enableRotate=!0;this.rotateSpeed=1;this.enablePan=!0;this.panSpeed=1;this.autoRotate=!1;this.autoRotateSpeed=2;this.enableKeys=!0;this.keys={LEFT:37,UP:38,RIGHT:39,BOTTOM:40};this.mouseButtons={ORBIT:THREE.MOUSE.LEFT,ZOOM:THREE.MOUSE.MIDDLE,PAN:THREE.MOUSE.RIGHT};this.target0=this.target.clone();this.position0=this.object.position.clone();this.zoom0=this.object.zoom;this.getPolarAngle=
        function(){return f.phi};this.getAzimuthalAngle=function(){return f.theta};this.reset=function(){a.target.copy(a.target0);a.object.position.copy(a.position0);a.object.zoom=a.zoom0;a.object.updateProjectionMatrix();a.dispatchEvent(O);a.update();d=c.NONE};this.update=function(){var b=new THREE.Vector3,g=(new THREE.Quaternion).setFromUnitVectors(F.up,new THREE.Vector3(0,1,0)),U=g.clone().inverse(),P=new THREE.Vector3,Q=new THREE.Quaternion;return function(){var h=a.object.position;b.copy(h).sub(a.target);
        b.applyQuaternion(g);f.setFromVector3(b);a.autoRotate&&d===c.NONE&&(e.theta-=2*Math.PI/60/60*a.autoRotateSpeed);f.theta+=e.theta;f.phi+=e.phi;f.theta=Math.max(a.minAzimuthAngle,Math.min(a.maxAzimuthAngle,f.theta));f.phi=Math.max(a.minPolarAngle,Math.min(a.maxPolarAngle,f.phi));f.makeSafe();f.radius*=k;f.radius=Math.max(a.minDistance,Math.min(a.maxDistance,f.radius));a.target.add(x);b.setFromSpherical(f);b.applyQuaternion(U);h.copy(a.target).add(b);a.object.lookAt(a.target);!0===a.enableDamping?(k+=
                (1-k)*a.dampingFactor*.6,e.theta*=1-a.dampingFactor,e.phi*=1-a.dampingFactor,x.multiplyScalar(1-a.dampingFactor)):(k=1,e.set(0,0,0),x.set(0,0,0));return y||P.distanceToSquared(a.object.position)>R||8*(1-Q.dot(a.object.quaternion))>R?(a.dispatchEvent(O),P.copy(a.object.position),Q.copy(a.object.quaternion),y=!1,!0):!1}}();this.dispose=function(){a.domElement.removeEventListener("contextmenu",N,!1);a.domElement.removeEventListener("mousedown",H,!1);a.domElement.removeEventListener("wheel",I,!1);a.domElement.removeEventListener("touchstart",
        K,!1);a.domElement.removeEventListener("touchend",M,!1);a.domElement.removeEventListener("touchmove",L,!1);document.removeEventListener("mousemove",B,!1);document.removeEventListener("mouseup",C,!1);window.removeEventListener("keydown",J,!1)};var a=this,O={type:"change"},D={type:"start"},E={type:"end"},c={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_DOLLY:4,TOUCH_PAN:5},d=c.NONE,R=1E-6,f=new THREE.Spherical,e=new THREE.Spherical,k=1,x=new THREE.Vector3,y=!1,l=new THREE.Vector2,p=new THREE.Vector2,
        q=new THREE.Vector2,n=new THREE.Vector2,u=new THREE.Vector2,v=new THREE.Vector2,m=new THREE.Vector2,r=new THREE.Vector2,t=new THREE.Vector2,S=function(){var a=new THREE.Vector3;return function(b,c){a.setFromMatrixColumn(c,0);a.multiplyScalar(-b);x.add(a)}}(),T=function(){var a=new THREE.Vector3;return function(b,c){a.setFromMatrixColumn(c,1);a.multiplyScalar(b);x.add(a)}}(),w=function(){var b=new THREE.Vector3;return function(c,d){var e=a.domElement===document?a.domElement.body:a.domElement;if(a.object instanceof
            THREE.PerspectiveCamera){b.copy(a.object.position).sub(a.target);var f=b.length(),f=f*Math.tan(a.object.fov/2*Math.PI/180);S(2*c*f/e.clientHeight,a.object.matrix);T(2*d*f/e.clientHeight,a.object.matrix)}else a.object instanceof THREE.OrthographicCamera?(S(c*(a.object.right-a.object.left)/a.object.zoom/e.clientWidth,a.object.matrix),T(d*(a.object.top-a.object.bottom)/a.object.zoom/e.clientHeight,a.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),
                a.enablePan=!1)}}();a.domElement.addEventListener("contextmenu",N,!1);a.domElement.addEventListener("mousedown",H,!1);a.domElement.addEventListener("wheel",I,!1);a.domElement.addEventListener("touchstart",K,!1);a.domElement.addEventListener("touchend",M,!1);a.domElement.addEventListener("touchmove",L,!1);window.addEventListener("keydown",J,!1);this.update()};THREE.OrbitControls.prototype=Object.create(THREE.EventDispatcher.prototype);THREE.OrbitControls.prototype.constructor=THREE.OrbitControls;
}